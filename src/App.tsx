import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import Processor from "./feedProcessing/Processor";

const processor = new Processor();

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [videoWidth, setVideoWidth] = useState(100);
  const [videoHeight, setVideoHeight] = useState(100);

  // Runs on video update
  useEffect(() => {
    const video = videoRef.current;
    if(video) {
      processor.streamToVideo(video).then(
        () => console.log("Streaming video"),
        (error) => alert(error.message)
      );
    }
  }, [videoRef]);
  
  // Runs on canvas update
  useEffect(() => {
    const interval = window.setInterval(() => {
      const canvas = canvasRef.current;
      if(canvas && processor.videoRunning) {

        const context = canvas!.getContext("2d");
        if(context) {
          context.drawImage(processor.video, 0, 0);

          if (processor.gridCorners) {
            const {
              topLeft,
              topRight,
              bottomLeft,
              bottomRight,
            } = processor.gridCorners;
  
            context.strokeStyle = "rgba(180,65,65,0.5)";
            context.fillStyle = "rgba(0,0,0,0)";
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(topLeft.x, topLeft.y);
            context.lineTo(topRight.x, topRight.y);
            context.lineTo(bottomRight.x, bottomRight.y);
            context.lineTo(bottomLeft.x, bottomLeft.y);
            context.closePath();
            context.stroke();
            context.fill();
          }

          if (processor.solvedBoxes) {
            context.fillStyle = "rgba(180,65,65,1)";
            processor.solvedBoxes.forEach((box) => {
              const {
                digit,
                digitHeight,
                digitRotation,
                position,
              } = box;
                context.font = `bold ${digitHeight}px sans-serif`;
                context.translate(position.x, position.y);
                context.rotate(Math.PI - digitRotation);
                context.fillText(
                  digit.toString(),
                  -digitHeight / 4,
                  digitHeight / 3
                );
                context.setTransform();
              })  
            }
         
        }
      }

    }, 100)
    return () => {
      window.clearInterval(interval);
    }
  }, [canvasRef]);

  useEffect(() => {
    function videoReadyListener(width: number, height: number) {
      setVideoWidth(width);
      setVideoHeight(height);
    }
    processor.events.on("videoReady", videoReadyListener);
    return () => {
      processor.events.off("videoReady", videoReadyListener);
    };
  });

  return (
    <div className="App">
      <video ref={videoRef} muted playsInline className="videoElement"/>
      <canvas ref={canvasRef} width={videoWidth} height={videoHeight} className="canvasElement"/>
    </div>
  );
}


export default App;