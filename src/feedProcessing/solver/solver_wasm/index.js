import { solver } from "./solver.js"
import solverModule from "./solver.wasm"

// Since webpack will change the name and potentially the path of the
// `.wasm` file, we have to provide a `locateFile()` hook to redirect
// to the appropriate URL.
// More details: https://kripken.github.io/emscripten-site/docs/api_reference/module.html
const wasm = solver({
  locateFile(path) {
    if (path.endsWith(`.wasm`)) {
      return solverModule;
    }
    return path;
  },
})

export default wasm;