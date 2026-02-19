// Face validation utilities for selfie verification
// This uses basic image analysis to detect potential face obstructions

export interface FaceValidationResult {
  isValid: boolean;
  error: string | null;
  warnings: string[];
}

// Analyze image brightness to detect potential face visibility issues
function analyzeImageBrightness(imageData: ImageData): { average: number; variance: number } {
  const data = imageData.data;
  let sum = 0;
  let sumSquared = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    sum += brightness;
    sumSquared += brightness * brightness;
  }

  const average = sum / pixelCount;
  const variance = sumSquared / pixelCount - average * average;

  return { average, variance };
}

// Analyze facial structure - looking for distinct regions (forehead, eyes, nose, mouth, chin)
function analyzeFacialStructure(canvas: HTMLCanvasElement): {
  hasFaceStructure: boolean;
  hasEyeRegion: boolean;
  hasNoseRegion: boolean;
  hasMouthRegion: boolean;
  hasForeheadRegion: boolean;
  skinDistribution: 'face_like' | 'random' | 'none';
  isMasked: boolean;
  hasHat: boolean;
  brightness: number;
  faceCenteredness: number;
  faceSize: number;
  isBlurred: boolean;
  hasLeftEye: boolean;
  hasRightEye: boolean;
  hasLips: boolean;
  hasChinVisible: boolean;
  eyesClarity: number;
  noseClarity: number;
  mouthClarity: number;
  overallClarity: number;
} {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      hasFaceStructure: false,
      hasEyeRegion: false,
      hasNoseRegion: false,
      hasMouthRegion: false,
      hasForeheadRegion: false,
      skinDistribution: 'none',
      isMasked: false,
      hasHat: false,
      brightness: 0,
      faceCenteredness: 0,
      faceSize: 0,
      isBlurred: true,
      hasLeftEye: false,
      hasRightEye: false,
      hasLips: false,
      hasChinVisible: false,
      eyesClarity: 0,
      noseClarity: 0,
      mouthClarity: 0,
      overallClarity: 0,
    };
  }

  const width = canvas.width;
  const height = canvas.height;

  // Define facial regions (percentages of frame) - centered for proper face detection
  const regions = {
    forehead: { x: 0.35, y: 0.15, w: 0.30, h: 0.12 },
    leftEye: { x: 0.30, y: 0.30, w: 0.15, h: 0.10 },
    rightEye: { x: 0.55, y: 0.30, w: 0.15, h: 0.10 },
    nose: { x: 0.42, y: 0.42, w: 0.16, h: 0.18 },
    mouth: { x: 0.38, y: 0.60, w: 0.24, h: 0.12 },
    lips: { x: 0.40, y: 0.58, w: 0.20, h: 0.08 },
    chin: { x: 0.38, y: 0.72, w: 0.24, h: 0.10 },
    leftCheek: { x: 0.22, y: 0.45, w: 0.15, h: 0.18 },
    rightCheek: { x: 0.63, y: 0.45, w: 0.15, h: 0.18 },
    top: { x: 0.30, y: 0.02, w: 0.40, h: 0.10 },
    centerFace: { x: 0.35, y: 0.35, w: 0.30, h: 0.35 },
  };

  const getRegionData = (region: { x: number; y: number; w: number; h: number }) => {
    const x = Math.floor(width * region.x);
    const y = Math.floor(height * region.y);
    const w = Math.floor(width * region.w);
    const h = Math.floor(height * region.h);
    return ctx.getImageData(x, y, w, h);
  };

  const analyzeSkinInRegion = (imageData: ImageData): { 
    skinRatio: number; 
    avgBrightness: number; 
    variance: number; 
    darkRatio: number;
    edgeStrength: number;
    clarity: number;
  } => {
    const data = imageData.data;
    let skinPixels = 0;
    let totalBrightness = 0;
    let darkPixels = 0;
    const pixelCount = data.length / 4;
    const brightnessValues: number[] = [];
    let edgeSum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      totalBrightness += brightness;
      brightnessValues.push(brightness);
      
      if (brightness < 50) darkPixels++;

      // Edge detection for clarity (simple gradient)
      if (i > 4 * 4) { // Not first row
        const prevBrightness = (data[i - 16] + data[i - 15] + data[i - 14]) / 3;
        edgeSum += Math.abs(brightness - prevBrightness);
      }

      // Enhanced skin tone detection (covers various skin colors more accurately)
      const isSkin = (
        // Light to medium skin tones
        (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) ||
        // Medium to dark skin tones
        (r > 60 && g > 40 && b > 20 && r >= g && r >= b && r - b > 10) ||
        // Very light skin tones
        (r > 180 && g > 140 && b > 110 && r > g && g > b)
      ) && r < 255 && g < 245 && b < 230;

      if (isSkin) {
        skinPixels++;
      }
    }

    const avgBrightness = totalBrightness / pixelCount;
    const variance = brightnessValues.reduce((sum, val) => sum + Math.pow(val - avgBrightness, 2), 0) / pixelCount;
    const edgeStrength = edgeSum / pixelCount;
    
    // Clarity score: combines variance and edge strength
    const clarity = Math.sqrt(variance) * (edgeStrength / 10);

    return {
      skinRatio: skinPixels / pixelCount,
      avgBrightness,
      variance,
      darkRatio: darkPixels / pixelCount,
      edgeStrength,
      clarity,
    };
  };

  // Analyze each facial region
  const foreheadData = analyzeSkinInRegion(getRegionData(regions.forehead));
  const leftEyeData = analyzeSkinInRegion(getRegionData(regions.leftEye));
  const rightEyeData = analyzeSkinInRegion(getRegionData(regions.rightEye));
  const noseData = analyzeSkinInRegion(getRegionData(regions.nose));
  const mouthData = analyzeSkinInRegion(getRegionData(regions.mouth));
  const lipsData = analyzeSkinInRegion(getRegionData(regions.lips));
  const chinData = analyzeSkinInRegion(getRegionData(regions.chin));
  const leftCheekData = analyzeSkinInRegion(getRegionData(regions.leftCheek));
  const rightCheekData = analyzeSkinInRegion(getRegionData(regions.rightCheek));
  const topData = analyzeSkinInRegion(getRegionData(regions.top));
  const centerFaceData = analyzeSkinInRegion(getRegionData(regions.centerFace));

  // TOLERANT face detection - relaxed thresholds
  const hasForeheadRegion = foreheadData.skinRatio > 0.15;
  
  // Individual eye detection with clarity check
  const hasLeftEye = leftEyeData.variance > 250 && leftEyeData.clarity > 15;
  const hasRightEye = rightEyeData.variance > 250 && rightEyeData.clarity > 15;
  const hasEyeRegion = hasLeftEye && hasRightEye;
  
  // Nose with clarity validation
  const hasNoseRegion = noseData.skinRatio > 0.20 && noseData.variance > 120 && noseData.clarity > 20;
  
  // Mouth region with clarity - strict visibility
  const hasMouthRegion = mouthData.skinRatio > 0.18 && mouthData.darkRatio < 0.50 && mouthData.clarity > 18;
  
  // Lips specifically detected
  const hasLips = lipsData.variance > 200 && lipsData.clarity > 15;
  
  // Cheeks detection
  const hasCheeks = leftCheekData.skinRatio > 0.18 && rightCheekData.skinRatio > 0.18;
  
  // Chin visible and clear
  const hasChinVisible = chinData.skinRatio > 0.15 && chinData.clarity > 12;

  // STRICT mask detection - any sign of covering
  const isMasked = (
    (mouthData.skinRatio < 0.15 || mouthData.darkRatio > 0.45) ||
    (noseData.skinRatio < 0.15) ||
    (mouthData.variance < 350 && mouthData.skinRatio < 0.20) ||
    !hasLips ||
    (lipsData.variance < 180)
  );

  // STRICT hat detection
  const hasHat = topData.darkRatio > 0.50 || (topData.variance < 600 && topData.avgBrightness < 80);

  // Face centeredness check - tolerant
  const faceCenteredness = centerFaceData.skinRatio;
  const faceSize = centerFaceData.skinRatio > 0.30 ? 1.0 : centerFaceData.skinRatio / 0.30;

  // Blur detection - STRICT clarity requirements
  const eyesClarity = (leftEyeData.clarity + rightEyeData.clarity) / 2;
  const noseClarity = noseData.clarity;
  const mouthClarity = mouthData.clarity;
  const overallClarity = (eyesClarity + noseClarity + mouthClarity) / 3;
  const isBlurred = overallClarity < 18 || eyesClarity < 15 || noseClarity < 18 || mouthClarity < 16;

  // TOLERANT symmetry
  const cheekSymmetry = Math.abs(leftCheekData.skinRatio - rightCheekData.skinRatio) < 0.35;
  const eyeSymmetry = Math.abs(leftEyeData.variance - rightEyeData.variance) < 1200;
  
  // Face-like with tolerant detection
  const isFaceLike = (
    hasForeheadRegion &&
    hasCheeks &&
    hasChinVisible &&
    hasEyeRegion &&
    cheekSymmetry &&
    eyeSymmetry &&
    !isMasked &&
    faceCenteredness > 0.20
  );

  // Count regions - tolerant
  const totalSkinRegions = [
    hasForeheadRegion,
    hasEyeRegion,
    hasNoseRegion,
    hasMouthRegion,
    hasCheeks,
    hasChinVisible
  ].filter(Boolean).length;

  let skinDistribution: 'face_like' | 'random' | 'none';
  if (isFaceLike && totalSkinRegions >= 4) {
    skinDistribution = 'face_like';
  } else if (totalSkinRegions >= 2) {
    skinDistribution = 'random';
  } else {
    skinDistribution = 'none';
  }

  // TOLERANT overall face structure
  const hasFaceStructure = isFaceLike && totalSkinRegions >= 4 && !isMasked && !hasHat && faceCenteredness > 0.20;

  return {
    hasFaceStructure,
    hasEyeRegion,
    hasNoseRegion,
    hasMouthRegion,
    hasForeheadRegion,
    skinDistribution,
    isMasked,
    hasHat,
    brightness: (foreheadData.avgBrightness + noseData.avgBrightness + mouthData.avgBrightness) / 3,
    faceCenteredness,
    faceSize,
    isBlurred,
    hasLeftEye,
    hasRightEye,
    hasLips,
    hasChinVisible,
    eyesClarity,
    noseClarity,
    mouthClarity,
    overallClarity,
  };
}

export function validateFaceImage(canvas: HTMLCanvasElement): FaceValidationResult {
  try {
    const analysis = analyzeFacialStructure(canvas);

    // STRICT CHECK: Reject blurred images
    if (analysis.isBlurred) {
      return {
        isValid: false,
        error: 'Image is blurred. Hold still and keep the camera steady.',
        warnings: [],
      };
    }

    // STRICT CHECK: Overall clarity must be high
    if (analysis.overallClarity < 18) {
      return {
        isValid: false,
        error: 'Image not clear enough. Ensure good focus and lighting.',
        warnings: [],
      };
    }

    // STRICT CHECK: Low light rejection
    if (analysis.brightness < 50) {
      return {
        isValid: false,
        error: 'Too dark! Move to a well-lit area with bright lighting.',
        warnings: [],
      };
    }

    // STRICT CHECK: Overexposure rejection
    if (analysis.brightness > 220) {
      return {
        isValid: false,
        error: 'Too bright! Reduce direct lighting or move to softer light.',
        warnings: [],
      };
    }

    // TOLERANT: Face centeredness
    if (analysis.faceCenteredness < 0.20) {
      return {
        isValid: false,
        error: 'Center your face in the oval guide.',
        warnings: [],
      };
    }

    // TOLERANT: Face size
    if (analysis.faceSize < 0.55) {
      return {
        isValid: false,
        error: 'Move closer - your face needs to be larger in frame.',
        warnings: [],
      };
    }

    // TOLERANT: Basic face structure
    if (!analysis.hasFaceStructure) {
      if (analysis.skinDistribution === 'random') {
        return {
          isValid: false,
          error: 'No face detected. Please position your FACE in the frame (not hands).',
          warnings: [],
        };
      }
      if (analysis.skinDistribution === 'none') {
        return {
          isValid: false,
          error: 'No face detected. Position your face clearly in the oval.',
          warnings: [],
        };
      }
    }

    // STRICT: Both eyes must be clearly visible
    if (!analysis.hasLeftEye || !analysis.hasRightEye) {
      return {
        isValid: false,
        error: 'Both eyes must be clearly visible. Look directly at camera.',
        warnings: [],
      };
    }

    // STRICT: Eyes clarity check
    if (analysis.eyesClarity < 15) {
      return {
        isValid: false,
        error: 'Eyes not clear enough. Ensure proper focus and remove sunglasses.',
        warnings: [],
      };
    }

    // STRICT: Forehead must be visible
    if (!analysis.hasForeheadRegion) {
      return {
        isValid: false,
        error: 'Forehead must be visible. Remove hat or push back hair.',
        warnings: [],
      };
    }

    // STRICT: Nose must be clearly visible
    if (!analysis.hasNoseRegion) {
      return {
        isValid: false,
        error: 'Nose is not clearly visible. Remove any face covering.',
        warnings: [],
      };
    }

    // STRICT: Nose clarity
    if (analysis.noseClarity < 18) {
      return {
        isValid: false,
        error: 'Nose area not clear. Ensure nothing is covering your nose.',
        warnings: [],
      };
    }

    // STRICT: Mouth must be clearly visible
    if (!analysis.hasMouthRegion) {
      return {
        isValid: false,
        error: 'Mouth is not visible. Remove any face covering or mask.',
        warnings: [],
      };
    }

    // STRICT: Lips must be visible
    if (!analysis.hasLips) {
      return {
        isValid: false,
        error: 'Lips must be clearly visible. Remove mask or face covering.',
        warnings: [],
      };
    }

    // STRICT: Mouth clarity
    if (analysis.mouthClarity < 16) {
      return {
        isValid: false,
        error: 'Mouth area not clear. Ensure proper lighting and no obstruction.',
        warnings: [],
      };
    }

    // STRICT: Mask detection
    if (analysis.isMasked) {
      return {
        isValid: false,
        error: 'Face mask or covering detected! Remove all face coverings.',
        warnings: [],
      };
    }

    // STRICT: Chin must be visible
    if (!analysis.hasChinVisible) {
      return {
        isValid: false,
        error: 'Chin must be visible. Adjust camera angle or remove scarf.',
        warnings: [],
      };
    }

    // STRICT: Hat detection
    if (analysis.hasHat) {
      return {
        isValid: false,
        error: 'Remove any hat, cap, or head covering for verification.',
        warnings: [],
      };
    }

    // STRICT: Final skin distribution check
    if (analysis.skinDistribution !== 'face_like') {
      return {
        isValid: false,
        error: 'Full face not properly detected. Ensure entire face is visible.',
        warnings: [],
      };
    }

    // ALL STRICT CHECKS PASSED
    return {
      isValid: true,
      error: null,
      warnings: [],
    };
  } catch (error) {
    console.error('Face validation error:', error);
    return {
      isValid: false,
      error: 'Could not validate face. Please ensure your face is clearly visible.',
      warnings: [],
    };
  }
}

// Quick validation before capture
export function validateCameraFrame(video: HTMLVideoElement): { canCapture: boolean; message: string } {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { canCapture: true, message: '' };
  }

  ctx.drawImage(video, 0, 0);
  const result = validateFaceImage(canvas);

  return {
    canCapture: result.isValid,
    message: result.error || result.warnings.join(' '),
  };
}