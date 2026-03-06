import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Loader2, 
  XCircle, 
  AlertTriangle, 
  CheckCircle,
  MapPin,
  Scan,
  User,
  RefreshCw,
} from 'lucide-react';
import { validateFaceImage } from '@/lib/faceValidation';

interface FaceScanCameraProps {
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
  actionLabel: string;
  actionVariant?: 'default' | 'destructive' | 'success';
  isLocationVerified: boolean;
  locationError: string | null;
  onRetryLocation: () => void;
  locationChecking: boolean;
  personName?: string;
}

export function FaceScanCamera({
  onCapture,
  onCancel,
  actionLabel,
  actionVariant = 'default',
  isLocationVerified,
  locationError,
  onRetryLocation,
  locationChecking,
  personName,
}: FaceScanCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [faceWarnings, setFaceWarnings] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsScanning(true);
    } catch (error) {
      console.error('Camera access error:', error);
      setFaceError('Could not access camera. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  }, [stream]);

  useEffect(() => {
    if (isLocationVerified) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isLocationVerified]);

  // Simulate scanning animation
  useEffect(() => {
    if (isScanning && !capturedImage) {
      scanIntervalRef.current = setInterval(() => {
        setScanProgress((prev) => (prev + 2) % 100);
      }, 50);
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isScanning, capturedImage]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);
    setFaceError(null);
    setFaceWarnings([]);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setFaceError('Could not capture image');
      setCapturing(false);
      return;
    }

    ctx.drawImage(video, 0, 0);

    // Validate face
    const validation = validateFaceImage(canvas);
    if (!validation.isValid) {
      setFaceError(validation.error);
      setCapturing(false);
      return;
    }

    setFaceWarnings(validation.warnings);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
          onCapture(blob);
        }
        setCapturing(false);
      },
      'image/jpeg',
      0.9
    );
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setFaceError(null);
    setFaceWarnings([]);
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Location Error State */}
      {!isLocationVerified && locationError && (
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <MapPin className="w-10 h-10 text-destructive" />
          </div>
          <Alert variant="destructive" className="text-center">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onRetryLocation} disabled={locationChecking} className="flex-1">
              {locationChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Location
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Location Checking */}
      {!isLocationVerified && !locationError && locationChecking && (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <MapPin className="w-10 h-10 text-primary" />
          </div>
          <p className="text-lg font-medium">Verifying Location...</p>
          <p className="text-sm text-muted-foreground text-center">
            Please ensure your location services are enabled
          </p>
        </div>
      )}

      {/* Camera View */}
      {isLocationVerified && (
        <div className="flex flex-col flex-1">
          {/* Location Verified Badge */}
          <Alert className="border-success/50 bg-success/10 mb-4">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success font-medium">
              Location verified! {personName && `Taking photo of ${personName}`}
            </AlertDescription>
          </Alert>

          {/* Face Validation Errors */}
          {faceError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{faceError}</AlertDescription>
            </Alert>
          )}

          {/* Face Warnings */}
          {faceWarnings.length > 0 && (
            <Alert className="border-warning/50 bg-warning/10 mb-4">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                {faceWarnings.join(' ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Camera Container - Large fullscreen-like */}
          <div className="relative flex-1 min-h-[400px] rounded-2xl overflow-hidden bg-black">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Face Scanning Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Darkened edges */}
                  <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50" />
                  
                  {/* Face oval guide */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-80">
                      {/* Oval border with scanning animation */}
                      <svg 
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 256 320"
                      >
                        <defs>
                          <linearGradient id="scanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset={`${scanProgress}%`} stopColor="transparent" />
                            <stop offset={`${scanProgress + 10}%`} stopColor="#22c55e" stopOpacity="0.8" />
                            <stop offset={`${scanProgress + 20}%`} stopColor="transparent" />
                          </linearGradient>
                        </defs>
                        {/* Outer glow */}
                        <ellipse
                          cx="128"
                          cy="160"
                          rx="120"
                          ry="150"
                          fill="none"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="3"
                        />
                        {/* Main scanning line */}
                        <ellipse
                          cx="128"
                          cy="160"
                          rx="120"
                          ry="150"
                          fill="none"
                          stroke="url(#scanGradient)"
                          strokeWidth="4"
                        />
                        {/* Corner markers */}
                        <path d="M 38 80 L 38 50 A 90 90 0 0 1 68 35" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 218 80 L 218 50 A 90 90 0 0 0 188 35" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 38 240 L 38 270 A 90 90 0 0 0 68 285" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 218 240 L 218 270 A 90 90 0 0 1 188 285" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      
                      {/* Instructions */}
                      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                        <div className="flex items-center gap-2 text-white bg-black/60 px-4 py-2 rounded-full">
                          <Scan className="w-4 h-4 text-success animate-pulse" />
                          <span className="text-sm font-medium">Position face in the oval</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scanning indicator */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white bg-black/60 px-4 py-2 rounded-full">
                    <User className="w-4 h-4" />
                    <span className="text-sm">No mask or hat allowed</span>
                  </div>
                </div>

                {/* Loading overlay */}
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-10 h-10 animate-spin text-white mx-auto" />
                      <p className="text-white/80">Starting camera...</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            {!capturedImage ? (
              <>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={capturePhoto}
                  disabled={!stream || capturing}
                  className={`flex-1 h-14 text-lg ${
                    actionVariant === 'destructive' 
                      ? 'bg-destructive hover:bg-destructive/90' 
                      : actionVariant === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : ''
                  }`}
                >
                  {capturing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-2" />
                      Capture & {actionLabel}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={retakePhoto} className="flex-1">
                  <XCircle className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={handleCancel}
                  className={`flex-1 ${
                    actionVariant === 'destructive' 
                      ? 'bg-destructive hover:bg-destructive/90' 
                      : actionVariant === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : ''
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {actionLabel} Complete
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
