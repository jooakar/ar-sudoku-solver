export interface Point {
    x: number;
    y: number;
}

export interface Corners {
    topLeft: Point;
    topRight: Point;
    bottomLeft: Point;
    bottomRight: Point;
}

function findManhattanDistance(a: Point, b: Point) {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);

    return dx + dy;
}

function findEuclideanDistance(a: Point, b: Point) {
    const dx = b.x - a.x;
    const dy = b.y - b.y;

    return Math.sqrt(dx*dx + dy*dy);
}

export default class ConnectedComponent {
    points: Point[];
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    corners: Corners | null = null;

    constructor(points: Point[], 
        minX:number, minY: number, 
        maxX:number, maxY: number) {
            this.points = points;
            this.minX = minX;
            this.minY = minY;
            this.maxX = maxX;
            this.maxY = maxY;
    }

    get height() {
        return this.maxY - this.minY;
    }

    get width() {
        return this.maxX - this.minX;
    }

    get ratio() {
        return this.width / this.height;
    }

    findCorners() {
        let corners = {topLeft: {x: this.minX, y: this.minY}, 
                        topRight: {x: this.maxX, y: this.minY}, 
                        bottomLeft: {x: this.minX, y: this.maxY}, 
                        bottomRight: {x: this.maxX, y: this.maxY}};

        let minTl = Number.MAX_SAFE_INTEGER;
        let minTr = Number.MAX_SAFE_INTEGER;
        let minBl = Number.MAX_SAFE_INTEGER;
        let minBr = Number.MAX_SAFE_INTEGER;
        
        this.points.forEach((point) => {
            const tl = findManhattanDistance({x: this.minX, y: this.minY}, point);
            const tr = findManhattanDistance({x: this.maxX, y: this.minY}, point);
            const bl = findManhattanDistance({x: this.minX, y: this.maxY}, point);
            const br = findManhattanDistance({x: this.maxX, y: this.maxY}, point);

            if(tl < minTl) {
                corners.topLeft = point;
                minTl = tl;
            }
            else if(tr < minTr) {
                corners.topRight = point;
                minTr = tr;
            }
            else if(bl < minBl) {
                corners.bottomLeft = point;
                minBl = bl;
            }
            else if(br < minBr) {
                corners.bottomRight = point;
                minBr = br;
            }
        });

        this.corners = corners;
        return corners;
    }

    sanityCheckCorners() {
        const { topLeft, topRight, bottomLeft, bottomRight } = this.corners!;

        const left = findEuclideanDistance(topLeft, bottomLeft);
        const right = findEuclideanDistance(topRight, bottomRight);
        const top = findEuclideanDistance(topLeft, topRight);
        const bottom = findEuclideanDistance(bottomLeft, bottomRight);
    
        if(top < 0.5 * bottom || top > 1.5 * bottom)
            return false;
        if(left < 0.7 * right || left > 1.3 * right)
            return false;
        if(left < 0.5 * bottom || left > 1.5 * bottom)
            return false;
        return true;
    }
}