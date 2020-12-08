import { fabric } from "fabric";
import { ResizeSensor } from "css-element-queries";

export class TabletopRenderer {
    coverCanvas: HTMLCanvasElement;
    gridCanvas: fabric.Canvas;
    grid?: fabric.Line[];
    draggingCanvas: boolean;
    position: [number, number];

    constructor(tabletopContainer: HTMLDivElement) {
        this.draggingCanvas = false;
        this.position = [0, 0];

        const coverCanvas = document.createElement("canvas");
        coverCanvas.id = "tabletop-cover";
        coverCanvas.className = "canvas-layer";
        coverCanvas.style.zIndex = "100";
        tabletopContainer.appendChild(coverCanvas);
        this.coverCanvas = coverCanvas;

        coverCanvas.addEventListener('mousedown', _ => {
            this.draggingCanvas = true;
        });

        coverCanvas.addEventListener('mouseup', _ => {
            this.draggingCanvas = false;
        });

        coverCanvas.addEventListener('mousemove', e => {
            if (this.draggingCanvas) {
                this.onCanvasTranslate(e.movementX, e.movementY);
            }
        });

        const gridCanvas = document.createElement("canvas");
        gridCanvas.id = "tabletop-grid";
        gridCanvas.style.zIndex = "0";
        const gridCanvasContainer = document.createElement("div");
        gridCanvasContainer.className = "canvas-layer";
        tabletopContainer.appendChild(gridCanvasContainer);
        gridCanvasContainer.appendChild(gridCanvas);
        this.gridCanvas = new fabric.Canvas(gridCanvas);
        gridCanvas.className = "bg_grid_square64";
        gridCanvas.style.opacity = '30%';

        new ResizeSensor(tabletopContainer, this.onCanvasResize.bind(this));
    }

    onCanvasResize(size: { width: number, height: number }): void {
        this.coverCanvas.width = size.width;
        this.coverCanvas.height = size.height;

        this.gridCanvas.setDimensions(size);
        //this.drawGridCells();
    }

    onCanvasTranslate(movementX: number, movementY: number): void {
        this.position[0] -= movementX;
        this.position[1] -= movementY;
        this.gridCanvas.getContext().canvas.style.backgroundPositionX = -this.position[0] + 'px';
        this.gridCanvas.getContext().canvas.style.backgroundPositionY = -this.position[1] + 'px';
        //this.gridCanvas.setViewportTransform([1, 0, 0, 1, -this.position[0], -this.position[1]]);
        //this.drawGridCells();
    }

    drawGridCells(): fabric.Line[] {
        const CELL_SIZE = 64; // px
        const GRID_COLOUR = "#CCCCCC";

        const height = this.gridCanvas.height!;
        const width = this.gridCanvas.width!;

        const minX = this.position[0];
        const maxX = this.position[0] + width;
        const minY = this.position[1];
        const maxY = this.position[1] + height;

        const lineOpts = {
            stroke: GRID_COLOUR,
            strokeWidth: 2,
            selectable: false,
            evented: false,
        };

        if (this.grid !== undefined) {
            this.gridCanvas.remove(...this.grid);
        }

        let lines = [];
        for (let i = Math.floor(minX / CELL_SIZE); i <= Math.ceil(maxX / CELL_SIZE); i++) {
            const line = new fabric.Line([i * CELL_SIZE + 1, minY, i * CELL_SIZE + 1, maxY], lineOpts);
            lines.push(line);
        }
        for (let j = Math.floor(minY / CELL_SIZE); j <= Math.ceil(maxY / CELL_SIZE); j++) {
            const line = new fabric.Line([minX, j * CELL_SIZE + 1, maxX, j * CELL_SIZE + 1], lineOpts);
            lines.push(line);
        }
        this.gridCanvas.add(...lines);
        this.grid = lines;

        return lines;
    }
}