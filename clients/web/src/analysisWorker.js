import wasmUrl from "../dsp-asm/build/release.wasm?url";
import { instantiate } from "../dsp-asm/build/release.js";

let wasmDS, wasmFFT, wasmUpload, wasmSbcMax, init;

function wasmInit() {
  if (init) return init;
  return (init = WebAssembly.compileStreaming(fetch(wasmUrl))
    .then(instantiate)
    .then(({ downscale, fft, uploadBuf, sbcMax }) => {
      wasmDS = downscale;
      wasmFFT = fft;
      wasmUpload = uploadBuf;
      wasmSbcMax = sbcMax;
    }));
}

const uploadBuffer = (buf) => wasmUpload(buf);

const downscale = (buf, size) => wasmDS(buf, size);

const sbcMax = (buf, start, end, n) => wasmSbcMax(buf, start ?? -1, end ?? -1, n ?? -1);

const fft = (buf, start, end, pad, persistence) =>
  wasmFFT(buf, start ?? -1, end ?? -1, pad ?? -1, persistence ?? 0);

onmessage = (e) => {
  // rip type safety
  const func = [wasmInit, uploadBuffer, downscale, sbcMax, fft][e.data[0]];
  if (!func) postMessage(["ERR", `${e.data[0]} is not a command`]);

  const res = func(...e.data.slice(2));
  if (res instanceof Promise) res.then((r) => postMessage([e.data[1], r]));
  else postMessage([e.data[1], res]);
};
