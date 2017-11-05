# wasm-particles

[Demo](https://maierfelix.github.io/wasm-particles/static)

Little experiment with particles using WebAssembly and WebGL.

There is also some basic glue code to work with point based textures. You can tell the wasm module to allocate some space for a RGB texture and then have access from JS to manipulate it etc. Since there is no garbage collection for WebAssembly yet, you have to free the texture manually. The three example methods to work with textures: ``allocateTexture``, ``freeTexture`` and ``drawTexture`` which fills the texture's pixels into the relative particles.
