import * as wasm from "../crate/pkg/rust_parcel_bg.wasm";
import { TabletopRenderer } from "./tabletop";

wasm.initialise_rust();
const canvas = document.getElementById("tabletop") as HTMLCanvasElement;
new TabletopRenderer(canvas);