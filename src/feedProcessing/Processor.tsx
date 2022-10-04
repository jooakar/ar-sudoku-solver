import EventEmitter from "events";

import { Corners, Point } from "./imageProcessing/Component";
import frameToImage from "./imageProcessing/frameToImage";
//import adaptiveThresholdOtsu from "./adaptiveThresholdOtsu";
import adaptiveThresholdBradley from "./imageProcessing/adaptiveThresholdBradley";
import findLargestConnectedComponent from "./imageProcessing/findLargestConnectedComponent";
import findHomographicTransform, { Transform, transformPoint } from "./imageProcessing/findHomographicTransform";
import createTransformedImage from "./imageProcessing/createTransformedImage";
import findGridBoxes from "./imageProcessing/findGridBoxes";
import predictNumbers from "./tensorflow/predictNumber";
import SudokuSolver from "./solver/sudokuSolver";

const PROCESSING_SIZE = 900;

type SolvedBox = {
  digit: number;
  digitHeight: number;
  digitRotation: number;
  position: Point;
}

export default class Processor{
    video!: HTMLVideoElement;
    videoRunning: boolean = false;
    videoProcessing: boolean = false;

    gridCorners: Corners | null = null;
    solvedBoxes: SolvedBox[] | null = null;
    solvedPuzzle: number[][] | null = null;

    events = new EventEmitter();

    // Stream video from camera to the <video/> element
    async streamToVideo(video: HTMLVideoElement) {
        if(this.videoRunning)
            return;

        this.video = video;
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {facingMode: "environment", width: 640},
            audio: false,
        });

        const canPlayListener = () => {
            this.video.removeEventListener("canplay", canPlayListener);
            this.events.emit("videoReady", this.video.videoWidth, this.video.videoHeight);
            this.videoRunning = true;
            
            this.processFrame();
        };
          
        this.video.addEventListener("canplay", canPlayListener);
        this.video.srcObject = stream;
        this.video.play();
    }

    getTextDetailsForBox(x: number, y: number, digit: number, transform: Transform): SolvedBox {
      const boxSize = PROCESSING_SIZE / 9;

      const p1 = transformPoint(
        { x: (x + 0.5) * boxSize, y: y * boxSize },
        transform
      );
      const p2 = transformPoint(
        { x: (x + 0.5) * boxSize, y: (y + 1) * boxSize },
        transform
      );
      // Center of the box
      const textPosition = transformPoint(
        { x: (x + 0.5) * boxSize, y: (y + 0.5) * boxSize },
        transform
      );
      // Calculate transformed angle in the box
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const digitRotation = Math.atan2(dx, dy);
  
      // Calculate height of the number in the box
      const digitHeight = 0.8 * Math.sqrt(dx * dx + dy * dy);
  
      return {
        digit,
        digitHeight,
        digitRotation,
        position: textPosition,
      };
    }

    async processFrame() {
        if(!this.videoRunning || this.videoProcessing)
           return;

        this.videoProcessing = true;

        // Capture a frame from the video stream
        let img = frameToImage(this.video);

        // Binarize image
        const thresholded = adaptiveThresholdBradley(img.clone(), 0.1);
        
        // Find the largest connected component (connected whites in the thresholded image)
        const component = findLargestConnectedComponent(thresholded.clone());

        if(component) {
            // Find the corners of found component
            this.gridCorners = component.findCorners();

            // Find the transformation matrix using the corners as reference
            const transform = findHomographicTransform(PROCESSING_SIZE, this.gridCorners);

            const transformedGrayscale = 
              createTransformedImage(img, PROCESSING_SIZE, transform);
              
            const transformedThresholded = 
              createTransformedImage(thresholded, PROCESSING_SIZE, transform);

            const boxes = findGridBoxes(transformedGrayscale, transformedThresholded);

            // https://www.technologyreview.com/2012/01/06/188520/mathematicians-solve-minimum-sudoku-problem/
            // The grid needs to have atleast 17 numbers to have a unique solution
            if(boxes.length >= 17) {
              await predictNumbers(boxes);
            
              let puzzle = new Array(9);
              for(let i = 0; i < 9; i++)
                puzzle[i] = new Array(9).fill(0);

              boxes.forEach((box) => {
                puzzle[box.y][box.x] = box.detectedNumber;
              })

              const solver = new SudokuSolver();
              const solution = solver.solve(puzzle);

              if(solution) {
                this.solvedBoxes = new Array<SolvedBox>();
                solution.forEach((row, y) => {
                  row.forEach((val, x) => {
                    this.solvedBoxes!.push(this.getTextDetailsForBox(x, y, val, transform));
                  })
                })
              }
              else {
                this.solvedBoxes = null;
              }
            }
        }
        else {
            this.gridCorners = null;
            this.solvedBoxes = null;
        }
        this.videoProcessing = false;
    }
}
