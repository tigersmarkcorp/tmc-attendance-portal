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
  SwitchCamera,
} from 'lucide-react';
import { validateFaceImage, FaceValidationResult } from '@/lib/faceValidation';

interface AutoCaptureCameraProps {
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
  actionLabel: string;
  actionVariant?: 'default' | 'destructive' | 'success' | 'warning';
  isLocationVerified: boolean;
  locationError: string | null;
  onRetryLocation: () => void;
  locationChecking: boolean;
  personName?: string;
  submitting?: boolean;
}

export function AutoCaptureCamera({
  onCapture,
  onCancel,
  actionLabel,
  actionVariant = 'default',
  isLocationVerified,
  locationError,
  onRetryLocation,
  locationChecking,
  personName,
  submitting = false,
}: AutoCaptureCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<string>('Scanning for face...');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const validFrameCountRef = useRef(0);

  const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: mode, 
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setFaceError('Could not access camera. Please allow camera permissions.');
    }
  }, [facingMode, stream]);
 
   const stopCamera = useCallback(() => {
     if (stream) {
       stream.getTracks().forEach((track) => track.stop());
       setStream(null);
     }
     if (scanIntervalRef.current) {
       clearInterval(scanIntervalRef.current);
       scanIntervalRef.current = null;
     }
     if (detectionIntervalRef.current) {
       clearInterval(detectionIntervalRef.current);
       detectionIntervalRef.current = null;
     }
   }, [stream]);
 
  useEffect(() => {
    if (isLocationVerified) {
      startCamera(facingMode);
    }
    return () => {
      stopCamera();
    };
  }, [isLocationVerified, facingMode]);

  const toggleCamera = useCallback(() => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    validFrameCountRef.current = 0;
    setDetectionStatus('Switching camera...');
  }, [facingMode]);
 
   // Scanning animation
   useEffect(() => {
     if (stream && !capturedImage) {
       scanIntervalRef.current = setInterval(() => {
         setScanProgress((prev) => (prev + 2) % 100);
       }, 50);
     }
     return () => {
       if (scanIntervalRef.current) {
         clearInterval(scanIntervalRef.current);
       }
     };
   }, [stream, capturedImage]);
 
   // Auto-detection loop
   useEffect(() => {
     if (!stream || !videoRef.current || capturedImage || isDetecting) return;
 
     const detectFace = () => {
       if (!videoRef.current || !canvasRef.current || capturedImage) return;
 
       const video = videoRef.current;
       if (video.videoWidth === 0 || video.videoHeight === 0) return;
 
       const canvas = canvasRef.current;
       canvas.width = video.videoWidth;
       canvas.height = video.videoHeight;
       
       const ctx = canvas.getContext('2d');
       if (!ctx) return;
 
       ctx.drawImage(video, 0, 0);
       const validation: FaceValidationResult = validateFaceImage(canvas);
 
        if (validation.isValid) {
          validFrameCountRef.current += 1;
          const framesNeeded = 10; // Require 10 consecutive valid frames (very strict)
          const remaining = framesNeeded - validFrameCountRef.current;
          
          if (remaining > 0) {
            setDetectionStatus(`Face detected! Hold still... (${remaining})`);
          }
          setFaceError(null);

          // Require 10 consecutive valid frames before auto-capture
          if (validFrameCountRef.current >= framesNeeded) {
            setIsDetecting(true);
            setDetectionStatus('Capturing...');
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
                  setCapturedBlob(blob);
                }
                setIsDetecting(false);
              },
              'image/jpeg',
              0.9
            );
          }
        } else {
          // Reset frame count on any invalid frame - STRICT
          validFrameCountRef.current = 0;
          setDetectionStatus(validation.error || 'Position your face in the oval');
          setFaceError(validation.error || null);
        }
     };
 
     detectionIntervalRef.current = setInterval(detectFace, 300);
 
     return () => {
       if (detectionIntervalRef.current) {
         clearInterval(detectionIntervalRef.current);
       }
     };
   }, [stream, capturedImage, isDetecting]);
 
   const handleConfirm = () => {
     if (capturedBlob) {
       onCapture(capturedBlob);
     }
   };
 
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setFaceError(null);
    validFrameCountRef.current = 0;
    setIsDetecting(false);
    setDetectionStatus('Scanning for face...');
    
    if (!stream && isLocationVerified) {
      startCamera(facingMode);
    }
  }, [stream, isLocationVerified, startCamera, facingMode]);
 
   const handleCancel = () => {
     stopCamera();
     onCancel();
   };
 
   const getButtonClass = () => {
     switch (actionVariant) {
       case 'destructive':
         return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
       case 'success':
         return 'bg-emerald-600 hover:bg-emerald-700 text-white';
       case 'warning':
         return 'bg-amber-500 hover:bg-amber-600 text-white';
       default:
         return '';
     }
   };
 
   return (
     <div className="flex flex-col h-full">
       {/* Location Error State */}
       {!isLocationVerified && locationError && (
         <div className="flex flex-col items-center justify-center p-4 sm:p-6 space-y-4">
           <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-destructive/10 flex items-center justify-center">
             <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" />
           </div>
           <Alert variant="destructive" className="text-center">
             <AlertTriangle className="h-4 w-4" />
             <AlertDescription className="text-sm">{locationError}</AlertDescription>
           </Alert>
           <div className="flex gap-3 w-full">
             <Button variant="outline" onClick={handleCancel} className="flex-1 h-12">
               Cancel
             </Button>
             <Button onClick={onRetryLocation} disabled={locationChecking} className="flex-1 h-12">
               {locationChecking ? (
                 <>
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   Checking...
                 </>
               ) : (
                 <>
                   <RefreshCw className="w-4 h-4 mr-2" />
                   Retry
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
             Please ensure location services are enabled
           </p>
         </div>
       )}
 
       {/* Camera View */}
       {isLocationVerified && (
         <div className="flex flex-col flex-1 space-y-3">
           {/* Location Verified Badge */}
           <Alert className="border-success/50 bg-success/10">
             <CheckCircle className="h-4 w-4 text-success" />
             <AlertDescription className="text-success font-medium text-sm">
               Location verified! {personName && `Scanning ${personName}`}
             </AlertDescription>
           </Alert>
 
           {/* Camera Container - Fullscreen-like on mobile */}
           <div className="relative flex-1 min-h-[300px] sm:min-h-[400px] rounded-xl sm:rounded-2xl overflow-hidden bg-black">
             {!capturedImage ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }}
                  />
                  
                  {/* Camera switch button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCamera}
                    className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </Button>
                 
                 {/* Face Scanning Overlay */}
                 <div className="absolute inset-0 pointer-events-none">
                   <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50" />
                   
                   {/* Face oval guide - responsive sizing */}
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="relative w-48 h-60 sm:w-56 sm:h-72">
                       <svg 
                         className="absolute inset-0 w-full h-full"
                         viewBox="0 0 224 288"
                         preserveAspectRatio="xMidYMid meet"
                       >
                         <defs>
                           <linearGradient id="autoCaptureGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                             <stop offset={`${scanProgress}%`} stopColor="transparent" />
                             <stop offset={`${scanProgress + 10}%`} stopColor={capturedImage ? '#22c55e' : '#3b82f6'} stopOpacity="0.8" />
                             <stop offset={`${scanProgress + 20}%`} stopColor="transparent" />
                           </linearGradient>
                         </defs>
                         <ellipse
                           cx="112"
                           cy="144"
                           rx="100"
                           ry="130"
                           fill="none"
                           stroke="rgba(255,255,255,0.3)"
                           strokeWidth="2"
                         />
                         <ellipse
                           cx="112"
                           cy="144"
                           rx="100"
                           ry="130"
                           fill="none"
                           stroke="url(#autoCaptureGradient)"
                           strokeWidth="3"
                         />
                         {/* Corner markers */}
                         <path d="M 32 70 L 32 45 A 80 80 0 0 1 55 32" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                         <path d="M 192 70 L 192 45 A 80 80 0 0 0 169 32" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                         <path d="M 32 218 L 32 243 A 80 80 0 0 0 55 256" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                         <path d="M 192 218 L 192 243 A 80 80 0 0 1 169 256" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                       </svg>
                     </div>
                   </div>
 
                   {/* Top instruction */}
                   <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white bg-black/70 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
                     <User className="w-3 h-3 sm:w-4 sm:h-4" />
                     <span className="text-xs sm:text-sm font-medium">No mask or hat</span>
                   </div>
 
                   {/* Detection Status */}
                   <div className={`absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full ${
                     faceError ? 'bg-destructive/90 text-white' : 'bg-black/70 text-white'
                   }`}>
                     <Scan className={`w-3 h-3 sm:w-4 sm:h-4 ${faceError ? '' : 'text-success animate-pulse'}`} />
                     <span className="text-xs sm:text-sm font-medium max-w-[200px] sm:max-w-none truncate">
                       {detectionStatus}
                     </span>
                   </div>
                 </div>
 
                 {/* Loading overlay */}
                 {!stream && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black">
                     <div className="text-center space-y-3">
                       <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-white mx-auto" />
                       <p className="text-white/80 text-sm sm:text-base">Starting camera...</p>
                     </div>
                   </div>
                 )}
               </>
             ) : (
               <>
                 <img
                   src={capturedImage}
                   alt="Captured"
                   className="absolute inset-0 w-full h-full object-cover"
                 />
                 {/* Captured overlay */}
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-success/90 text-white px-4 py-2 rounded-full flex items-center gap-2">
                     <CheckCircle className="w-5 h-5" />
                     <span className="font-medium">Photo Captured</span>
                   </div>
                 </div>
               </>
             )}
           </div>
 
           <canvas ref={canvasRef} className="hidden" />
 
           {/* Action Buttons */}
           <div className="flex gap-3">
             {!capturedImage ? (
               <Button variant="outline" onClick={handleCancel} className="flex-1 h-12 sm:h-14">
                 Cancel
               </Button>
             ) : (
               <>
                 <Button 
                   variant="outline" 
                   onClick={retakePhoto} 
                   className="flex-1 h-12 sm:h-14"
                   disabled={submitting}
                 >
                   <XCircle className="w-4 h-4 mr-2" />
                   Retake
                 </Button>
                 <Button
                   onClick={handleConfirm}
                   disabled={submitting}
                   className={`flex-1 h-12 sm:h-14 text-base ${getButtonClass()}`}
                 >
                   {submitting ? (
                     <>
                       <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                       Processing...
                     </>
                   ) : (
                     <>
                       <CheckCircle className="w-5 h-5 mr-2" />
                       {actionLabel}
                     </>
                   )}
                 </Button>
               </>
             )}
           </div>
         </div>
       )}
     </div>
   );
 }