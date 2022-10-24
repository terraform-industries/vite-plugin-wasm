"use strict";
/// <reference lib="DOM" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.code = exports.id = void 0;
// This file is copied from
// https://github.com/vitejs/vite/blob/3c0a6091fe96044e9dd84fbe5db3343339a88986/packages/vite/src/node/plugins/wasm.ts
exports.id = "/__vite-plugin-wasm-helper";
/* istanbul ignore next */
const wasmHelper = async (opts = {}, url, root) => {
    var inBrowser = !!(typeof window !== "undefined" && window.document && window.document.createElement);
    let result;
    if (url.startsWith("data:")) {
        const urlContent = url.replace(/^data:.*?base64,/, "");
        let bytes;
        if (typeof Buffer === "function" && typeof Buffer.from === "function") {
            bytes = Buffer.from(urlContent, "base64");
        }
        else if (typeof atob === "function") {
            const binaryString = atob(urlContent);
            bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
        }
        else {
            throw new Error("Cannot decode base64-encoded data URL");
        }
        result = await WebAssembly.instantiate(bytes, opts);
    }
    else if (inBrowser) {
        // https://github.com/mdn/webassembly-examples/issues/5
        // WebAssembly.instantiateStreaming requires the server to provide the
        // correct MIME type for .wasm files, which unfortunately doesn't work for
        // a lot of static file servers, so we just work around it by getting the
        // raw buffer.
        // @ts-ignore
        const response = await fetch(url);
        const contentType = response.headers.get("Content-Type") || "";
        if ("instantiateStreaming" in WebAssembly && contentType.startsWith("application/wasm")) {
            result = await WebAssembly.instantiateStreaming(response, opts);
        }
        else {
            const buffer = await response.arrayBuffer();
            result = await WebAssembly.instantiate(buffer, opts);
        }
    }
    else {
        const { readFile } = require("node:fs/promises");
        const file = await readFile(root + url);
        result = await WebAssembly.instantiate(new Uint8Array(file), opts);
    }
    return result.instance.exports;
};
exports.code = wasmHelper.toString();