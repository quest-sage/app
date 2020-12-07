import { fabric } from "fabric";
import { ResizeSensor } from "css-element-queries";

export class TabletopRenderer {
    canvas: fabric.Canvas;
    grid?: fabric.Line[];

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvas = new fabric.Canvas(canvasElement);
    
        const tabletopContainer = document.getElementById("tabletop-container") as HTMLDivElement;
        new ResizeSensor(tabletopContainer, this.onCanvasResize.bind(this));
    }

    onCanvasResize(size: { width: number, height: number }) {
        this.canvas.setDimensions(size);
        this.drawGridCells();
        this.canvas.renderAll();
    }

    drawGridCells(): fabric.Line[] {
        const CELL_SIZE = 64; // px
        const GRID_COLOUR = "#CCCCCC";
    
        const height = this.canvas.height!;
        const width = this.canvas.width!;
        const rows = Math.ceil(height / (CELL_SIZE + 1));
        const cols = Math.ceil(width / (CELL_SIZE + 1));
    
        const lineOpts = {
            stroke: GRID_COLOUR,
            strokeWidth: 2,
            selectable: false,
            evented: false,
        };
    
        if (this.grid !== undefined) {
            this.canvas.remove(...this.grid);
        }

        let lines = [];
        for (let i = 0; i <= cols; i++) {
            const line = new fabric.Line([i * (CELL_SIZE + 1) + 1, 0, i * (CELL_SIZE + 1) + 1, height], lineOpts);
            lines.push(line);
        }
        for (let j = 0; j <= rows; j++) {
            const line = new fabric.Line([0, j * (CELL_SIZE + 1) + 1, width, j * (CELL_SIZE + 1) + 1], lineOpts);
            lines.push(line);
        }
        this.canvas.add(...lines);
    
        return lines;
    }
}