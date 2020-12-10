import { fabric } from "fabric";
import { ResizeSensor } from "css-element-queries";

class GridLayer {
    private cellSize = 64; // px

    /**
     * The background div that should scroll with the tabletop, whose background image
     * is set to a repeating image of the current grid type (e.g. squares).
     */
    private gridBackground: HTMLDivElement;
    /**
     * The fabric canvas used to annotate the grid background.
     */
    private canvas: fabric.StaticCanvas;

    private annotations: fabric.Rect[];
    /**
     * The currently hovered cell.
     */
    private hoveredCell?: { x: number, y: number };
    /**
     * An indicator to show which cell we are hovering over.
     */
    private hoveredCellIndicator?: fabric.Rect;

    /**
     * @param tabletopContainer The div inside which the canvas layers should be placed.
     */
    constructor(tabletopContainer: HTMLDivElement) {
        const gridBackground = document.createElement("div");
        gridBackground.id = "tabletop-grid";
        gridBackground.className = "canvas-layer bg_grid_square64";
        gridBackground.style.zIndex = "0";
        gridBackground.style.opacity = '30%';
        tabletopContainer.appendChild(gridBackground);
        this.gridBackground = gridBackground;

        const canvas = document.createElement("canvas");
        canvas.id = "tabletop-grid";
        canvas.style.zIndex = "100";
        const gridCanvasContainer = document.createElement("div");
        gridCanvasContainer.className = "canvas-layer";
        tabletopContainer.appendChild(gridCanvasContainer);
        gridCanvasContainer.appendChild(canvas);
        this.canvas = new fabric.StaticCanvas(canvas);

        this.annotations = [];

        this.addDebugAnnotations();
    }

    setDimensions(size: { width: number; height: number; }) {
        this.canvas.setDimensions(size);
    }

    setViewportTransform(matrix: number[]) {
        // The 4th and 5th entries of this matrix are the X and Y translations.
        this.gridBackground.style.backgroundPositionX = matrix[4] + 'px';
        this.gridBackground.style.backgroundPositionY = matrix[5] + 'px';

        this.canvas.setViewportTransform(matrix);
    }

    private addDebugAnnotations() {
        const GRID_COLOUR = "#FF4343";

        this.canvas.remove(...this.annotations);

        let cells = [];
        cells.push(new fabric.Rect({
            top: -2,
            left: -2,
            width: this.cellSize,
            height: this.cellSize,
            stroke: GRID_COLOUR,
            fill: undefined,
            strokeWidth: 4,
            rx: 2,
            ry: 2,
        }));
        this.canvas.add(...cells);
        this.annotations = cells;
    }

    /**
     * Given coordinates relative to the canvas, what cell are they hovering over?
     */
    private computeHoveredCell(x: number, y: number): { x: number, y: number } {
        return {
            x: Math.floor((x - this.canvas.viewportTransform![4]) / 64),
            y: -Math.floor((y - this.canvas.viewportTransform![5]) / 64)
        };
    }

    /**
     * Given coordinates relative to the canvas, update the hovered cell indicator with the new mouse position.
     */
    updateHoveredCell(x: number, y: number) {
        this.hoveredCell = this.computeHoveredCell(x, y);
        if (this.hoveredCellIndicator === undefined) {
            this.hoveredCellIndicator = new fabric.Rect({
                top: (-this.hoveredCell.y * this.cellSize) - 2,
                left: (this.hoveredCell.x * this.cellSize) - 2,
                width: this.cellSize,
                height: this.cellSize,
                stroke: "#FFFFFF",
                fill: undefined,
                strokeWidth: 4,
                rx: 2,
                ry: 2,
            });
            this.canvas.add(this.hoveredCellIndicator);
        } else {
            this.hoveredCellIndicator.top = (-this.hoveredCell.y * this.cellSize) - 2;
            this.hoveredCellIndicator.left = (this.hoveredCell.x * this.cellSize) - 2;
            this.canvas.requestRenderAll();
        }
    }

    unfocus() {
        if (this.hoveredCellIndicator !== undefined) {
            this.canvas.remove(this.hoveredCellIndicator);
        }
        this.hoveredCell = undefined;
        this.hoveredCellIndicator = undefined;
    }
}

/**
 * The mode through which the user interacts with the tabletop.
 * In 'move' mode, for example, the user can use the mouse to pan around the
 * tabletop.
 */
type Mode = 'move' | 'grid';

export class TabletopRenderer {
    /**
     * Used for top-level annotations on the tabletop, and to capture mouse events from propagating to lower layers if required.
     */
    coverCanvas: HTMLCanvasElement;
    /**
     * The canvas layer used for drawing the grid, and annotations on the grid.
     */
    gridLayer: GridLayer;

    draggingCanvas: boolean = false;
    position: [number, number] = [0, 0];
    infiniteScrolling: boolean = false;
    mode: Mode = 'move';

    constructor(tabletopContainer: HTMLDivElement) {
        const modeSelector = document.createElement("div");
        modeSelector.id = "mode-selector";
        tabletopContainer.appendChild(modeSelector);

        const modeForm = document.createElement("form");
        modeSelector.appendChild(modeForm);

        {
            const radio = document.createElement("input");
            radio.type = 'radio';
            radio.name = 'mode';
            radio.id = 'move';
            radio.checked = true;
            modeForm.appendChild(radio);

            const label = document.createElement("label");
            label.htmlFor = 'move';
            label.className = "fas fa-hand-paper";
            modeForm.appendChild(label);

            radio.addEventListener('change', _ => {
                this.changeMode('move');
            });
        }

        {
            const radio = document.createElement("input");
            radio.type = 'radio';
            radio.name = 'mode';
            radio.id = 'grid';
            modeForm.appendChild(radio);

            const label = document.createElement("label");
            label.htmlFor = 'grid';
            label.className = "fas fa-border-all";
            modeForm.appendChild(label);

            radio.addEventListener('change', _ => {
                this.changeMode('grid');
            });
        }

        const coverCanvas = document.createElement("canvas");
        coverCanvas.id = "tabletop-cover";
        coverCanvas.className = "canvas-layer";
        coverCanvas.style.zIndex = "200";
        tabletopContainer.appendChild(coverCanvas);
        this.coverCanvas = coverCanvas;

        coverCanvas.addEventListener('mousedown', _ => {
            switch (this.mode) {
                case 'move':
                    this.draggingCanvas = true;
                    if (this.infiniteScrolling) {
                        coverCanvas.requestPointerLock();
                    }
                    break;
            }
        });

        document.addEventListener('mouseup', _ => {
            switch (this.mode) {
                case 'move':
                    this.draggingCanvas = false;
                    if (this.infiniteScrolling) {
                        document.exitPointerLock();
                    }
                    break;
            }
        });

        coverCanvas.addEventListener('mousemove', e => {
            switch (this.mode) {
                case 'move':
                    if (this.draggingCanvas) {
                        this.onCanvasTranslate(e.movementX, e.movementY);
                    }
                    break;

                case 'grid':
                    const cell = this.gridLayer.updateHoveredCell(e.offsetX, e.offsetY);
                    break;
            }
        });

        this.gridLayer = new GridLayer(tabletopContainer);

        new ResizeSensor(tabletopContainer, this.onCanvasResize.bind(this));
    }

    onCanvasResize(size: { width: number, height: number }): void {
        this.coverCanvas.width = size.width;
        this.coverCanvas.height = size.height;

        this.gridLayer.setDimensions(size);

        this.onCanvasTranslate(0, 0);
    }

    onCanvasTranslate(movementX: number, movementY: number): void {
        this.position[0] -= movementX;
        this.position[1] -= movementY;

        // Normally, we store position relative to the centre of the canvas, so that
        // resizing etc works ergonomically.
        // However, these x, y coords are relative to the top left of the canvas,
        // because CSS requires us to do things in terms of the top left.
        const x = -this.position[0] + this.coverCanvas.width! / 2;
        const y = -this.position[1] + this.coverCanvas.height! / 2;

        this.gridLayer.setViewportTransform([1, 0, 0, 1, x, y]);
    }

    changeMode(newMode: Mode) {
        this.draggingCanvas = false;
        if (this.infiniteScrolling) {
            document.exitPointerLock();
        }
        this.gridLayer.unfocus();

        this.mode = newMode;
    }
}