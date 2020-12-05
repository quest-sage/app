# Quest Sage
This is the front-end component to Quest Sage. This is the web app that you see in your browser.

# Compiling
Prerequisites:
- Node package manager, `npm` (after installing, run `npm install` in this folder)
- Rust compiler using `rustup` (see the Rust website for more)
- WASM packing utility `wasm-pack` (run `cargo install wasm-pack`)

To compile:
- Run `wasm-pack build crate` to build the Rust project.
- Run `npm start` to build and serve the project locally.

# Licenses and Contributing
- This project uses [HTML5 Boilerplate](https://html5boilerplate.com/), released under the MIT License.
- We also use the [Rust WASM template](https://github.com/rustwasm/wasm-pack-template), dual licensed under Apache 2 and MIT.

This project is under the MIT license, any contributions will also be licensed as such.