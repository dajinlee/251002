import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TransformationMode } from './types';
import { transformToUSAnimationStyle } from './services/geminiService';
import ModeSelector from './components/ModeSelector';
import WebcamPanel from './components/WebcamPanel';
import ResultPanel from './components/ResultPanel';
import SpinnerIcon from './components/icons/SpinnerIcon';

type ApiStatus = 'Idle' | 'Calling' | 'Success' | 'Error';

const App: React.FC = () => {
  const [mode, setMode] = useState<TransformationMode>(TransformationMode.Original);
  const [croppedFaceUrl, setCroppedFaceUrl] = useState<string | null>(null);
  const [faceUrlForApi, setFaceUrlForApi] = useState<string | null>(null);
  const [transformedFaceUrls, setTransformedFaceUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('Idle');

  const apiCallInProgress = useRef(false);

  const handleFaceCropped = useCallback((dataUrl: string | null, isLooking: boolean) => {
    setCroppedFaceUrl(dataUrl);
    // Only trigger a new API call if we are in the right mode, the user is looking,
    // we have data, AND an API call is not already in progress.
    if (mode === TransformationMode.USAnimation && isLooking && dataUrl && !apiCallInProgress.current) {
      setFaceUrlForApi(dataUrl);
    }
  }, [mode]);

  const handleModeChange = (newMode: TransformationMode) => {
    setMode(newMode);
    setTransformedFaceUrls([]);
    setError(null);
    setApiStatus('Idle');
  };
  
  useEffect(() => {
    const makeApiCall = async () => {
        if (apiCallInProgress.current || !faceUrlForApi) {
            return;
        }

        apiCallInProgress.current = true;
        setIsLoading(true);
        setError(null);
        setApiStatus('Calling');

        try {
            const resultUrl = await transformToUSAnimationStyle(faceUrlForApi);
            setTransformedFaceUrls(prevUrls => [resultUrl, ...prevUrls]);
            setApiStatus('Success');
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("Failed to generate image due to an unknown error.");
            }
            setApiStatus('Error');
            console.error(e);
        } finally {
            setIsLoading(false);
            apiCallInProgress.current = false;
            setFaceUrlForApi(null); // Reset to allow the next trigger
        }
    };

    if (mode === TransformationMode.USAnimation) {
        makeApiCall();
    }
  }, [mode, faceUrlForApi]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="w-full max-w-7xl mb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
          AI Face Stylizer
        </h1>
        <p className="mt-2 text-lg text-gray-400">Transform your face in real-time!</p>
      </header>
      
      <main className="w-full max-w-7xl flex flex-col items-center flex-grow">
        <ModeSelector currentMode={mode} onModeChange={handleModeChange} isLoading={isLoading} />
        
        <div className="mt-4 w-full max-w-4xl p-3 bg-gray-800 border border-gray-700 rounded-lg text-center flex items-center justify-center gap-3">
            <span className="font-semibold">Gemini API Call Status:</span>
            {apiStatus === 'Idle' && <span className="text-gray-400 font-mono">Idle</span>}
            {apiStatus === 'Calling' && <span className="text-blue-400 flex items-center gap-2 font-mono"><SpinnerIcon className="animate-spin h-5 w-5" /> Calling...</span>}
            {apiStatus === 'Success' && <span className="text-green-400 font-mono">Success</span>}
            {apiStatus === 'Error' && <span className="text-red-400 font-mono">Error</span>}
        </div>

        {error && (
            <div className="mt-4 w-full max-w-4xl p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-center flex items-center justify-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-left">{error}</span>
            </div>
        )}

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 flex-grow">
          <div className="aspect-w-4 aspect-h-3 lg:aspect-auto">
            <WebcamPanel onFaceCropped={handleFaceCropped} isLoading={isLoading} />
          </div>
          <div className="aspect-w-4 aspect-h-3 lg:aspect-auto">
            <ResultPanel 
              mode={mode} 
              originalFaceUrl={croppedFaceUrl} 
              transformedFaceUrls={transformedFaceUrls} 
              isLoading={isLoading} 
              error={error}
            />
          </div>
        </div>
      </main>

      <footer className="w-full max-w-7xl mt-8 text-center text-gray-500 text-sm">
        <p>Powered by React, Tailwind CSS, MediaPipe, and Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;