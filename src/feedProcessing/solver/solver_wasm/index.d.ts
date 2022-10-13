/* eslint-disable */
export interface SolverWasm {
    _solver(a: number[][]): number[][];
  }
  
  export declare const SolverWasmPromise: Promise<SolverWasm>;
  
  export default SolverWasmPromise;