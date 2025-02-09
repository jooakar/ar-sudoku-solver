import Image from "./Image";

//  Bradley, D., G. Roth, "Adapting Thresholding Using the Integral Image", January 2007, Journal of Graphics GPU and Game Tools 12(2):13-21
// https://www.researchgate.net/publication/220494200_Adaptive_Thresholding_using_the_Integral_Image
export default function adaptiveThreshold(image: Image, t: number): Image {
  const { data, width, height } = image;
  let intImg = new Uint32Array(width * height);
  const s = width / 8;

  for (let y = 0; y < height; y++) {
    let sum = 0;
    const row = y * width;
    for (let x = 0; x < width; x++) {
      sum += data[row + x];
      if (row === 0) {
        intImg[row + x] = sum;
      } else {
        intImg[row + x] = intImg[row - width + x] + sum;
      }
    }
  }

  const s2 = s / 2;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(x - s2, 0);
      const x2 = Math.min(x + s2, width - 1);
      const y1 = Math.max(y - s2, 0);
      const y2 = Math.min(y + s2, height - 1);

      const size = (x2 - x1) * (y2 - y1);
      const sum =
        intImg[x2 + y2 * width] -
        intImg[x2 + y1 * width] -
        intImg[x1 + y2 * width] +
        intImg[x1 + y1 * width];

      if (data[row + x] * size <= sum * (1 - t)) data[row + x] = 255;
      else data[row + x] = 0;
    }
  }
  return image;
}
