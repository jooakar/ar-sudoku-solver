import * as tf from "@tensorflow/tfjs";
import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
import { NumberComponent } from "../imageProcessing/findGridBoxes";

const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const IMAGE_SIZE = 20;

setWasmPaths(`${process.env.PUBLIC_URL}/tfjs_wasm/`);
const MODEL_URL = `${process.env.PUBLIC_URL}/tfjs_model/model.json`;

let _model: tf.LayersModel | undefined = undefined;
let modelLoadingPromise: Promise<tf.LayersModel> | undefined = undefined;

tf.setBackend("wasm").then(
  async () => await loadModel(),
  (err) => console.log(err),
);

async function loadModel() {
  if (_model) {
    return _model;
  }
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }
  modelLoadingPromise = new Promise(async (resolve, reject) => {
    await tf.setBackend("wasm");
    _model = await tf.loadLayersModel(MODEL_URL);
    resolve(_model);
  });
}

export async function getClasses(logits: tf.Tensor<tf.Rank>) {
  const logitsArray = (await logits.array()) as number[][];
  const classes = logitsArray.map((values) => {
    let maxProb = 0;
    let maxIndex = 0;
    values.forEach((value, index) => {
      if (value > maxProb) {
        maxProb = value;
        maxIndex = index;
      }
    });
    return CLASSES[maxIndex];
  });
  return classes;
}

export default async function predictNumbers(components: NumberComponent[]) {
  const model = await loadModel();

  const logits = tf.tidy(() => {
    const images = components.map((c) => {
      const img = tf.browser
        .fromPixels(c.numberImage.toImageData(), 1)
        .resizeBilinear([IMAGE_SIZE, IMAGE_SIZE])
        .toFloat();
      const mean = img.mean();
      const std = tf.moments(img).variance.sqrt();
      const normalized = img.sub(mean).div(std);
      const batched = normalized.reshape([1, IMAGE_SIZE, IMAGE_SIZE, 1]);
      return batched;
    });
    const input = tf.concat(images);
    return model!.predict(input, { batchSize: components.length });
  });

  const classes = await getClasses(logits as tf.Tensor<tf.Rank>);
  classes.forEach(
    (className, index) => (components[index].detectedNumber = className),
  );
}
