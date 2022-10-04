import Image from "./Image";
import { findComponent } from "./findLargestConnectedComponent";
import ConnectedComponent from "./Component";

export interface NumberComponent {
    x: number,
    y: number,
    component: ConnectedComponent;
    numberImage: Image;
    detectedNumber: number;
} 

export default function findGridBoxes (grayscale: Image, thresholded: Image) {
    const foundNums: NumberComponent[] = [];
    const size = grayscale.width;
    const boxSize = size / 9;
    const searchSize = boxSize / 5;

    for(let gridY = 0; gridY < 9; gridY++) {
        for(let gridX = 0; gridX < 9; gridX++) {
            let component: ConnectedComponent | null = null;

            const startFromX = gridX * boxSize + searchSize;
            const endAtX = (gridX+1) * boxSize - searchSize;
            const startFromY = gridY * boxSize + searchSize;
            const endAtY = (gridY+1) * boxSize - searchSize;

            for(let y = startFromY; y < endAtY; y++) {
                const row = y * size;
                for(let x = startFromX; x < endAtX; x++) {
                    if(thresholded.data[row + x] === 255) {
                        const foundComponent = findComponent(thresholded, row + x);
                        if(foundComponent.points.length > 50
                            && foundComponent.width > boxSize / 10
                            && foundComponent.height > boxSize / 5
                            && foundComponent.height < boxSize
                            && foundComponent.width < boxSize
                            )
                            component = foundComponent;
                    }
                }
            }

            if(component) {
                const numberImage = grayscale.subImage(component.minX - 3, component.minY - 3, component.maxX + 3, component.maxY + 3);
                foundNums.push({
                    x: gridX,   
                    y: gridY, 
                    component: component, 
                    numberImage: numberImage, 
                    detectedNumber: 0})
            }
        }
    }

    return foundNums;
}