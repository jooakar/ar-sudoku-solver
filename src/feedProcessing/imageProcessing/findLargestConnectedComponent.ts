import ConnectedComponent from "./Component";
import Image from "./Image";

// Removes the connected component from the image as it recursively loops through each pixel
export function findComponent(image: Image, p: number, component?: ConnectedComponent): ConnectedComponent  {
    const { data, width, height } = image;
    const colDirs = [1, 1, 1, 0, 0, -1, -1, -1];
    const rowDirs = [0, width, -width, width, -width, width, -width, 0];

    data[p] = 0;
    if(!component)
        component = new ConnectedComponent([], width, height, 0, 0);

    if(component?.points.length > 5000)
        return component;

    const x = p % width;
    const y = Math.floor(p / width);

    component.points.push({x: x, y: y});    
    component.minX = Math.min(component.minX, x);
    component.minY = Math.min(component.minY, y);
    component.maxX = Math.max(component.maxX, x);
    component.maxY = Math.max(component.maxY, y);

    for(let i = 0; i < 8; i++) {
        const newPoint = p + colDirs[i] + rowDirs[i];
        if(newPoint < data.length && newPoint >= 0)
            if(data[newPoint] === 255)
                findComponent(image, newPoint, component);
    }

    return component;
}

export default function findLargestComponent(image: Image): ConnectedComponent | null {
    const { data, width, height } = image;
    
    let largest: ConnectedComponent | null = null;
    for(let i = 0; i < data.length; i++) {
        if(data[i] === 255)
        {
            const component = findComponent(image, i);
            if(component.width <= width * 0.8 && 
               component.width >= width * 0.3 &&
               component.height <= height * 0.8 &&
               component.height >= height * 0.3 &&
               component.ratio <= 1.5 &&
               component.ratio >= 0.75) 
               {
                    if(!largest || component.points.length > largest.points.length)
                        largest = component;
               }
              
        }       
    }        
            
    return largest;
}