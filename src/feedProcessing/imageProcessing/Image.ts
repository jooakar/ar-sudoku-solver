export default class Image {
    public data: Uint8ClampedArray;
    public width: number;
    public height: number;

    constructor(imageData: ImageData) {
        this.width = imageData.width;
        this.height = imageData.height;
        this.data = new Uint8ClampedArray(this.height*this.width);

        for(let y = 0; y < this.height; y++) 
        {
            const row = y * this.width;
            for(let x = 0; x < this.width; x++) 
            {
                // Save only the value of the green channel for each pixel, sufficient for grayscaling
                const g = imageData.data[((row + x) * 4 + 1)];
                this.data[row + x] = g;
            }
        }
    }

    public static withSize(width: number, height: number): Image {
        let img = new Image(new ImageData(width, height))
        return img;
    }

    public clone(): Image {
        let img = new Image(new ImageData(this.width, this.height))
        img.data = new Uint8ClampedArray(this.data);
        return img;
    }

    public subImage(fromX: number, fromY: number, toX: number, toY: number) {
        const width = toX - fromX;
        const height = toY - fromY;
        let img = new Image(new ImageData(width, height));

        for(let y = 0; y < height; y++) {
            const subRow = y * width;
            const originalRow = (y + fromY) * this.width;

            for(let x = 0; x < width; x++) {
                img.data[subRow + x] = this.data[originalRow + (x + fromX)]
            }
        }

        return img;
    }

    // Histograms used in Otsu's adaptive thresholding
    public subHistogram(sx: number, sy: number, ex: number, ey: number): number[] {
        let histogramCounts = new Array<number>(256).fill(0);
        
        const width = ex - sx;
        const height = ey - sy;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const val = this.data[(y + sy) * this.width + x + sx];
                histogramCounts[val] += 1;
            }
        }
        return histogramCounts;
    }

    public histogram(): number[] {
        let histogramCounts = new Array<number>(256).fill(0);
        for(let i = 0; i < this.data.length; i++) {
            histogramCounts[this.data[i]] += 1;
        }

        return histogramCounts;
    }

    toImageData() {
        const newData = new ImageData(this.width, this.height);

        for(let y = 0; y < this.height; y++) {
            const row = y * this.width;
            for(let x = 0; x < this.width; x++) {
                const val = this.data[row + x];
                
                // Assign greyscale value to each color channel, 255 for alpha
                newData.data[(row + x) * 4] = val       // R
                newData.data[(row + x) * 4 + 1] = val   // G
                newData.data[(row + x) * 4 + 2] = val   // B
                newData.data[(row + x) * 4 + 3] = 255   // A
            }
        }

        return newData;
    }
}