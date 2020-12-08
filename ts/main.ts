import * as wasm from "../crate/pkg/rust_parcel_bg.wasm";
import { TabletopRenderer } from "./tabletop";

declare global {
    var tr: TabletopRenderer;
}

wasm.initialise_rust();
const tabletopContainer = document.getElementById("tabletop-container") as HTMLDivElement;
window.tr = new TabletopRenderer(tabletopContainer);