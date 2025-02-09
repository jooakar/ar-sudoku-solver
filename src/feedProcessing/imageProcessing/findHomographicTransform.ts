import { Point } from "./Component";
import * as math from "mathjs";

export interface Transform {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
}

// https://web.archive.org/web/20071214081425/http://alumni.media.mit.edu/~cwren/interpolator/
export default function findHomographicTransform(
  size: number,
  corners: {
    topLeft: Point;
    topRight: Point;
    bottomLeft: Point;
    bottomRight: Point;
  },
): Transform {
  // 2n * 8 matrix (n = 4; the amount of corner points)
  const A = math.matrix([
    [0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0],
    [size, 0, 1, 0, 0, 0, -size * corners.topRight.x, 0],
    [0, 0, 0, size, 0, 1, -size * corners.topRight.y, 0],
    [0, size, 1, 0, 0, 0, 0, -size * corners.bottomLeft.x],
    [0, 0, 0, 0, size, 1, 0, -size * corners.bottomLeft.y],
    [
      size,
      size,
      1,
      0,
      0,
      0,
      -size * corners.bottomRight.x,
      -size * corners.bottomRight.x,
    ],
    [
      0,
      0,
      0,
      size,
      size,
      1,
      -size * corners.bottomRight.y,
      -size * corners.bottomRight.y,
    ],
  ]);

  // 2n * 1 Matrix (n = 4; the amount of corner points)
  const B = math.matrix([
    corners.topLeft.x,
    corners.topLeft.y,
    corners.topRight.x,
    corners.topRight.y,
    corners.bottomLeft.x,
    corners.bottomLeft.y,
    corners.bottomRight.x,
    corners.bottomRight.y,
  ]);

  // Transpose matrix A, making 1st row into 1st column, 2nd row into 2nd column...
  const A_t = math.transpose(A);

  // λ = (A_t*A)^(-1) * (A_t * B) = oper1 * oper2
  const oper1 = math.inv(math.multiply(A_t, A));
  const oper2 = math.multiply(A_t, B);
  const lambda = math.multiply(oper1, oper2);

  const vals = new Array<number>(8);
  lambda.forEach(function (val, index) {
    vals[index] = val;
  });

  const [a, b, c, d, e, f, g, h] = vals;
  return { a, b, c, d, e, f, g, h };
}

export function transformPoint(point: Point, transform: Transform) {
  const { a, b, c, d, e, f, g, h } = transform;
  const { x, y } = point;

  // Apply transform to coordinates
  const newX = Math.floor((a * x + b * y + c) / (g * x + h * y + 1));
  const newY = Math.floor((d * x + e * y + f) / (g * x + h * y + 1));

  return { x: newX, y: newY };
}
