import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

interface WebcamPanelProps {
  onFaceCropped: (dataUrl: string | null, isLooking: boolean) => void;
  isLoading: boolean;
}

const isLookingAtCamera = (landmarks: any[]): boolean => {
    if (!landmarks || landmarks.length === 0) return false;

    const leftIris = landmarks[473];
    const leftEyeCornerL = landmarks[33];
    const leftEyeCornerR = landmarks[133];

    const rightIris = landmarks[468];
    const rightEyeCornerL = landmarks[263];
    const rightEyeCornerR = landmarks[362];

    if(!leftIris || !leftEyeCornerL || !leftEyeCornerR || !rightIris || !rightEyeCornerL || !rightEyeCornerR) return false;

    const leftIrisPos = (leftIris.x - leftEyeCornerL.x) / (leftEyeCornerR.x - leftEyeCornerL.x);
    const rightIrisPos = (rightIris.x - rightEyeCornerL.x) / (rightEyeCornerR.x - rightEyeCornerL.x);
    
    const isLeftCentered = leftIrisPos > 0.25 && leftIrisPos < 0.75;
    const isRightCentered = rightIrisPos > 0.25 && rightIrisPos < 0.75;

    return isLeftCentered && isRightCentered;
};


const WebcamPanel: React.FC<WebcamPanelProps> = ({ onFaceCropped, isLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLooking, setIsLooking] = useState(false);

  const [statusText, setStatusText] = useState("눈을 맞춰주세요 (Make eye contact)");
  const [borderColor, setBorderColor] = useState('#FFC700');
  const [showCaptureFlash, setShowCaptureFlash] = useState(false);
  const prevIsLoading = useRef(false);

  useEffect(() => {
    // This effect triggers the "Captured!" feedback
    if (isLoading && !prevIsLoading.current) {
      setShowCaptureFlash(true);
      setStatusText("캡쳐 완료! (Captured!)");
      setBorderColor('#FFFFFF');
      setTimeout(() => {
        setShowCaptureFlash(false);
      }, 300); // Flash duration
    }
    prevIsLoading.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    // This effect manages the steady-state text and borders
    if (showCaptureFlash) return; // Don't change text during the flash

    if (isLoading) {
      setStatusText("처리 중... (Processing...)");
      setBorderColor('#60A5FA'); // Blue
    } else if (isLooking) {
      setStatusText("포착! (Looking!)");
      setBorderColor('#00FF00'); // Green
    } else {
      setStatusText("눈을 맞춰주세요 (Make eye contact)");
      setBorderColor('#FFC700'); // Yellow
    }
  }, [isLoading, isLooking, showCaptureFlash]);

  const predictWebcam = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = faceLandmarkerRef.current;

    if (!video || video.readyState < 2 || !canvas) {
      animationFrameId.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationFrameId.current = requestAnimationFrame(predictWebcam);
      return;
    }

    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
    
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();


    if (landmarker && !video.paused && !video.ended) {
        const results: FaceLandmarkerResult = landmarker.detectForVideo(video, Date.now());
        const looking = results.faceLandmarks.length > 0 && isLookingAtCamera(results.faceLandmarks[0]);
        setIsLooking(looking);
        
        if (results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];
            let minX = 1, maxX = 0, minY = 1, maxY = 0;
            for (const point of landmarks) {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }

            // --- Bounding Box Drawing (Mirrored Canvas) ---
            const mirroredOriginX = (1 - maxX) * canvas.width;
            const originY = minY * canvas.height;
            const width = (maxX - minX) * canvas.width;
            const height = (maxY - minY) * canvas.height;
            
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(mirroredOriginX, originY, width, height);
            
            // --- Cropping Logic (Original Video Frame) ---
            const cropCanvas = document.createElement('canvas');
            const cropCtx = cropCanvas.getContext('2d');
            if (cropCtx) {
                const faceOriginX = minX * canvas.width; // Use original, non-mirrored coordinates for cropping
                const padding = width * 0.25;

                const cropX = Math.max(0, faceOriginX - padding);
                const cropY = Math.max(0, originY - padding);
                const cropWidth = width + padding * 2;
                const cropHeight = height + padding * 2;

                cropCanvas.width = cropWidth;
                cropCanvas.height = cropHeight;
                
                // Flip the crop canvas horizontally to match the mirrored view
                cropCtx.scale(-1, 1);
                cropCtx.translate(-cropWidth, 0);

                // Draw the region from the original video onto the flipped crop canvas
                cropCtx.drawImage(
                  video,
                  cropX, cropY, cropWidth, cropHeight, // Source rect from original video
                  0, 0, cropWidth, cropHeight // Destination rect on flipped crop canvas
                );
                onFaceCropped(cropCanvas.toDataURL('image/jpeg'), looking);
            }
        } else {
            onFaceCropped(null, false);
        }
    }
    
    animationFrameId.current = requestAnimationFrame(predictWebcam);
  }, [onFaceCropped, borderColor]);
  
  const initializeFaceDetector = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU",
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      faceLandmarkerRef.current = landmarker;
      setIsReady(true);
    } catch (e) {
      console.error("Failed to initialize face landmarker", e);
      setError("Could not load face detection model. Please refresh.");
    }
  }, []);

  const setupWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            if (animationFrameId.current) {
              cancelAnimationFrame(animationFrameId.current);
            }
            predictWebcam();
          }
        };
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Webcam access denied. Please enable camera permissions in your browser settings.");
    }
  }, [predictWebcam]);

  useEffect(() => {
    initializeFaceDetector();
    setupWebcam();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      faceLandmarkerRef.current?.close();
    };
  }, [initializeFaceDetector, setupWebcam]);

  const getStatusBgColor = () => {
    if (showCaptureFlash) return 'bg-white/80 text-black';
    if (isLoading) return 'bg-blue-500/80 text-white';
    if (isLooking) return 'bg-green-500/80 text-white';
    return 'bg-yellow-500/80 text-black';
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
      {showCaptureFlash && <div className="absolute inset-0 bg-white z-20 opacity-70"></div>}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
        <h2 className="text-xl font-bold bg-black bg-opacity-50 px-3 py-1 rounded-md">Webcam</h2>
        <div className={`text-lg font-semibold px-3 py-1 rounded-md transition-colors duration-200 ${getStatusBgColor()}`}>
            {statusText}
        </div>
      </div>
      <video ref={videoRef} className="hidden" playsInline style={{ transform: 'scaleX(-1)' }}/>
      <canvas ref={canvasRef} className="w-full h-full object-cover" />
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-40">
            <p>Loading face detection model...</p>
        </div>
      )}
       {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-center p-4 z-40">
            <p className="text-red-400">{error}</p>
        </div>
       )}
    </div>
  );
};

export default WebcamPanel;