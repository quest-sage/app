import { fabric } from "fabric";
import { ResizeSensor } from "css-element-queries";

export class TabletopRenderer {
    coverCanvas: HTMLCanvasElement;
    gridCanvas: fabric.Canvas;
    grid?: fabric.Rect[];
    gridDiv: HTMLDivElement;
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

        const gridDiv = document.createElement("div");
        gridDiv.id = "tabletop-grid";
        gridDiv.className = "canvas-layer bg_grid_square64";
        gridDiv.style.zIndex = "0";
        gridDiv.style.opacity = '30%';
        tabletopContainer.appendChild(gridDiv);
        this.gridDiv = gridDiv;

        const gridCanvas = document.createElement("canvas");
        gridCanvas.id = "tabletop-grid";
        gridCanvas.style.zIndex = "100";
        const gridCanvasContainer = document.createElement("div");
        gridCanvasContainer.className = "canvas-layer";
        tabletopContainer.appendChild(gridCanvasContainer);
        gridCanvasContainer.appendChild(gridCanvas);
        this.gridCanvas = new fabric.Canvas(gridCanvas);
        this.drawGridCells();

        new ResizeSensor(tabletopContainer, this.onCanvasResize.bind(this));
    }

    onCanvasResize(size: { width: number, height: number }): void {
        this.coverCanvas.width = size.width;
        this.coverCanvas.height = size.height;

        this.gridCanvas.setDimensions(size);
        
        this.onCanvasTranslate(0, 0);
    }

    onCanvasTranslate(movementX: number, movementY: number): void {
        this.position[0] -= movementX;
        this.position[1] -= movementY;

        // Normally, we store position relative to the centre of the canvas, so that
        // resizing etc works ergonomically.
        // However, these x, y coords are relative to the top left of the canvas,
        // because CSS requires us to do things in terms of the top left.
        const x = -this.position[0] + this.gridCanvas.width! / 2;
        const y = -this.position[1] + this.gridCanvas.height! / 2;

        this.gridDiv.style.backgroundPositionX = x + 'px';
        this.gridDiv.style.backgroundPositionY = y + 'px';
        
        this.gridCanvas.setViewportTransform([1, 0, 0, 1, x, y]);
    }

    drawGridCells(): fabric.Rect[] {
        const CELL_SIZE = 64; // px
        const GRID_COLOUR = "#FF4343";

        if (this.grid !== undefined) {
            this.gridCanvas.remove(...this.grid);
        }

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
        this.gridCanvas.add(...cells);
        this.grid = cells;

        return cells;
    }
}