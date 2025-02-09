import Image from "./Image";
import { Transform } from "./findHomographicTransform";

export default function extractSquareFromRegion(
  source: Image,
  size: number,
  transform: Transform,
) {
  const { a, b, c, d, e, f, g, h } = transform;

  const result = Image.withSize(size, size);
  for (let y = 0; y < size; y++) {
    const sxPre = b * y + c;
    const syPre = e * y + f;
    const commonPre = h * y + 1;

    const resultRow = y * size;
    for (let x = 0; x < size; x++) {
      const sx = Math.floor((a * x + sxPre) / (g * x + commonPre));
      const sy = Math.floor((d * x + syPre) / (g * x + commonPre));

      result.data[resultRow + x] = source.data[sy * source.width + sx];
    }
  }
  return result;
}
