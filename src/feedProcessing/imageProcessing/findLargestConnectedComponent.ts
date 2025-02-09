import ConnectedComponent from "./Component";
import Image from "./Image";

// Removes the connected component from the image as it recursively loops through each pixel
export function findComponent(image: Image, p: number): ConnectedComponent {
  const { data, width, height } = image;
  const colDirs = [1, 1, 1, 0, 0, -1, -1, -1];
  const rowDirs = [0, width, -width, width, -width, width, -width, 0];

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  const stack = [p];
  const points = [];

  while (stack.length) {
    const currentPoint = stack.pop();
    data[currentPoint] = 0;

    const x = currentPoint % width;
    const y = Math.floor(currentPoint / width);
    points.push({ x: x, y: y });
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    for (let i = 0; i < 8; i++) {
      const newPoint = currentPoint + colDirs[i] + rowDirs[i];
      if (newPoint < data.length && newPoint >= 0 && data[newPoint] === 255) {
        stack.push(currentPoint + colDirs[i] + rowDirs[i]);
      }
    }
  }

  return new ConnectedComponent(points, minX, minY, maxX, maxY);
}

export default function findLargestComponent(
  image: Image,
): ConnectedComponent | null {
  const { data, width, height } = image;

  let largest: ConnectedComponent | null = null;
  for (let i = 0; i < data.length; i++) {
    if (data[i] === 255) {
      const component = findComponent(image, i);
      if (
        component.width <= width * 0.8 &&
        component.width >= width * 0.3 &&
        component.height <= height * 0.8 &&
        component.height >= height * 0.3 &&
        component.ratio <= 1.5 &&
        component.ratio >= 0.75
      ) {
        if (!largest || component.points.length > largest.points.length)
          largest = component;
      }
    }
  }

  return largest;
}
