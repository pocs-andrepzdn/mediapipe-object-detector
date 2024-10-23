import './App.css'
import { FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision';
import { useState, useEffect, useRef } from "react";


const App = () => {
  const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
  const [detections, setDetections] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
      );
      const objectDetector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float32/1/efficientdet_lite2.tflite",
          delegate: "GPU",
        },
        categoryAllowlist: ['dog'],
        maxResults: 10,
        scoreThreshold: 0.3,
        runningMode: "IMAGE",
      });
      setModel(objectDetector);
    };
    loadModel();
  }, [])

  useEffect(() => {
    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
      }
    };
    startWebcam();
  }, [videoRef]);

  useEffect(() => {
    if (model) {
      const detectObjects = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = video.width;
        canvas.height = video.height;

        const predictions = await model.detect(video);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        predictions.detections.forEach((prediction) => {
          console.log(prediction);
          const {angle, height, originX, originY, width} = prediction.boundingBox;
          ctx.strokeStyle = "#00FF00";
          ctx.lineWidth = 2;
          ctx.strokeRect(originX, originY, width, height);
          ctx.fillStyle = "#00FF00";
          ctx.font = "18px Arial";
          ctx.fillText(
            `${prediction.categories[0].categoryName} (${Math.round(prediction.categories[0].score * 100)}%)`,
            originX,
            originY > 10 ? originY - 5 : 10
          );
        });

        requestAnimationFrame(detectObjects);
      }

      detectObjects();
    }

  }, [model]);

  return (
    <section>
      <video
        ref={videoRef}
        autoPlay
        width="640"
        height="480"
        style={{ display: "block", position: "absolute", top: 100, left: 50 }}
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ position: "absolute", top: 100, left: 50 }}
      />
    </section>
  );
};

export default App;
