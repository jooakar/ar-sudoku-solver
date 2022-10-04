import Image from "./Image";

// https://en.wikipedia.org/wiki/Otsu's_method
function otsu(histogramCounts: number[], total: number) {
    let sumB = 0;
    let wB = 0;
    let maximum = 0;
    let level = 0;
  
    let sum1 = 0;
    for (let i = 0; i < histogramCounts.length; i++) {
      sum1 += i * histogramCounts[i];
    }
  
    for (let j = 0; j < histogramCounts.length; j++) {
      wB += histogramCounts[j];
      const wF = total - wB;
      if (wB === 0 || wF === 0) {
        continue;
      }
      sumB += j * histogramCounts[j];
      const mF = (sum1 - sumB) / wF;
      const between = wB * wF * (sumB / wB - mF) * (sumB / wB - mF);
      if (between >= maximum) {
        level = j;
        maximum = between;
      }
    }
  
    return level;
  }

export default function adaptiveThreshold(image: Image, localSize: number)
{
    const { height, width, data } = image;
    const globalThreshold = otsu(image.histogram(), image.data.length);

    let [sx, sy, ex, ey] = [0, 0, localSize, localSize];
    while(ex < width || ey < height)
    {
        const histogram = image.subHistogram(sx, sy, ex, ey);
        const threshold = otsu(histogram, localSize*localSize);

        for(let y = 0; y < localSize; y++) {
            const row = (y + sy) * width;
            for(let x = 0; x < localSize; x++) {
                data[row + sx + x] = data[row + sx + x] < (threshold*7 + globalThreshold*3)/10 ? 255 : 0
            }
        }

        if(ex < width) {
            sx += localSize;
            ex += localSize;
        }
        else {
            sx = 0;
            ex = localSize;
            sy += localSize;
            ey += localSize;
        }
    }

    return image;
}
