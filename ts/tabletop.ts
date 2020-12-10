import { fabric } from "fabric";
import { ResizeSensor } from "css-element-queries";

class GridLayer {
    /**
     * The background div that should scroll with the tabletop, whose background image
     * is set to a repeating image of the current grid type (e.g. squares).
     */
    gridBackground: HTMLDivElement;
    /**
     * The fabric canvas used to annotate the grid background.
     */
    canvas: fabric.Canvas;

    annotations: fabric.Rect[];

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
        this.canvas = new fabric.Canvas(canvas);

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

    addDebugAnnotations() {
        const CELL_SIZE = 64; // px
        const GRID_COLOUR = "#FF4343";

        this.canvas.remove(...this.annotations);

        let cells = [];
        cells.push(new fabric.Rect({
            top: -2,
            left: -2,
            width: CELL_SIZE,
            height: CELL_SIZE,
            stroke: GRID_COLOUR,
            fill: undefined,
            strokeWidth: 4,
            selectable: false,
            evented: false,
            rx: 2,
            ry: 2,
        }));
        this.canvas.add(...cells);
        this.annotations = cells;
    }
}

export class TabletopRenderer {
    /**
     * Used for top-level annotations on the tabletop, and to capture mouse events from propagating to lower layers if required.
     */
    coverCanvas: HTMLCanvasElement;
    /**
     * The canvas layer used for drawing the grid, and annotations on the grid.
     */
    gridLayer: GridLayer;
    draggingCanvas: boolean;
    position: [number, number];
    infiniteScrolling: boolean;

    constructor(tabletopContainer: HTMLDivElement) {
        this.draggingCanvas = false;
        this.position = [0, 0];
        this.infiniteScrolling = false;

        const coverCanvas = document.createElement("canvas");
        coverCanvas.id = "tabletop-cover";
        coverCanvas.className = "canvas-layer";
        coverCanvas.style.zIndex = "200";
        tabletopContainer.appendChild(coverCanvas);
        this.coverCanvas = coverCanvas;

        coverCanvas.addEventListener('mousedown', _ => {
            this.draggingCanvas = true;
            if (this.infiniteScrolling) {
                coverCanvas.requestPointerLock();
            }
        });

        coverCanvas.addEventListener('mouseup', _ => {
            this.draggingCanvas = false;
            if (this.infiniteScrolling) {
                document.exitPointerLock();
            }
        });

        coverCanvas.addEventListener('mousemove', e => {
            if (this.draggingCanvas) {
                this.onCanvasTranslate(e.movementX, e.movementY);
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
}