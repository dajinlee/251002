import React, { useRef, useEffect, useState } from 'react';
import { TransformationMode } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

interface ResultPanelProps {
  mode: TransformationMode;
  originalFaceUrl: string | null;
  transformedFaceUrls: string[];
  isLoading: boolean;
  error: string | null;
}

const PIXELATION_SIZE = 32;

const ResultPanel: React.FC<ResultPanelProps> = ({ mode, originalFaceUrl, transformedFaceUrls, isLoading, error }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (transformedFaceUrls.length > 0) {
      setActiveIndex(0);
    }
  }, [transformedFaceUrls.length > 0 && transformedFaceUrls[0]]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = false;

    if (!originalFaceUrl) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (mode === TransformationMode.Original) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else if (mode === TransformationMode.Pixelated) {
        ctx.imageSmoothingEnabled = false;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = PIXELATION_SIZE;
        tempCanvas.height = PIXELATION_SIZE;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0, PIXELATION_SIZE, PIXELATION_SIZE);
          ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        }
      }
    };
    img.src = originalFaceUrl;
  }, [mode, originalFaceUrl]);

  const renderMainContent = () => {
    if (mode === TransformationMode.USAnimation) {
      if (error && transformedFaceUrls.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-semibold text-lg">Image Generation Failed</p>
            <p className="text-sm text-gray-300 mt-1">Check the status bar for details.</p>
          </div>
        );
      }
  
      if (transformedFaceUrls.length > 0) {
        return (
            <div className="w-full h-full flex flex-col">
              <div className="flex-grow flex items-center justify-center p-2 relative">
                <img 
                  src={transformedFaceUrls[activeIndex]} 
                  alt={`US Animation Style Face ${activeIndex + 1}`} 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                />
              </div>
              <div className="flex-shrink-0 p-2 bg-black/20 overflow-x-auto">
                <div className="flex items-center justify-center space-x-2">
                  {transformedFaceUrls.map((url, index) => (
                    <button 
                      key={index} 
                      onClick={() => setActiveIndex(index)}
                      className={`flex-shrink-0 rounded-md overflow-hidden transition-all duration-200 focus:outline-none ${activeIndex === index ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-900' : ''}`}
                    >
                      <img 
                        src={url} 
                        alt={`Thumbnail ${index + 1}`} 
                        className="w-16 h-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
        );
      }
  
      if(!isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>AI result will appear here.</p>
            </div>
        );
      }

      return null;
    }

    if (!originalFaceUrl) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
            <p>Point camera at face.</p>
        </div>
      )
    }

    return <canvas ref={canvasRef} className="w-full h-full object-contain" />;
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
      <h2 className="absolute top-4 left-4 text-xl font-bold bg-black bg-opacity-50 px-3 py-1 rounded-md z-20">Result</h2>
      <div className="absolute inset-0">
        {renderMainContent()}
      </div>
      {isLoading && mode === TransformationMode.USAnimation && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 z-10 p-4 text-center">
          <SpinnerIcon className="animate-spin h-12 w-12 mb-4" />
          <p className="text-lg mb-4">Generating new image...</p>
          {originalFaceUrl && (
             <div className="text-center">
                <p className="text-sm mb-2 font-mono">Sending this face to API:</p>
                <img 
                    src={originalFaceUrl} 
                    alt="Face sent to API" 
                    className="w-24 h-24 object-cover rounded-md border-2 border-indigo-500 shadow-lg"
                />
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultPanel;
