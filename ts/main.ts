import * as wasm from "../crate/pkg/rust_parcel_bg.wasm";
import { draw_tabletop } from "./tabletop";

wasm.initialise_rust();
draw_tabletop();