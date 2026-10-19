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
    };
  }

  const width = canvas.width;
  const height = canvas.height;

  // Define facial regions (percentages of frame)
  const regions = {
    forehead: { x: 0.30, y: 0.10, w: 0.40, h: 0.15 },
    leftEye: { x: 0.25, y: 0.25, w: 0.20, h: 0.12 },
    rightEye: { x: 0.55, y: 0.25, w: 0.20, h: 0.12 },
    nose: { x: 0.40, y: 0.35, w: 0.20, h: 0.20 },
    mouth: { x: 0.35, y: 0.55, w: 0.30, h: 0.15 },
    chin: { x: 0.35, y: 0.70, w: 0.30, h: 0.10 },
    leftCheek: { x: 0.20, y: 0.40, w: 0.15, h: 0.20 },
    rightCheek: { x: 0.65, y: 0.40, w: 0.15, h: 0.20 },
    top: { x: 0.25, y: 0, w: 0.50, h: 0.12 },
  };

  const getRegionData = (region: { x: number; y: number; w: number; h: number }) => {
    const x = Math.floor(width * region.x);
    const y = Math.floor(height * region.y);
    const w = Math.floor(width * region.w);
    const h = Math.floor(height * region.h);
    return ctx.getImageData(x, y, w, h);
  };

  const analyzeSkinInRegion = (imageData: ImageData): { skinRatio: number; avgBrightness: number; variance: number; darkRatio: number } => {
    const data = imageData.data;
    let skinPixels = 0;
    let totalBrightness = 0;
    let darkPixels = 0;
    const pixelCount = data.length / 4;
    const brightnessValues: number[] = [];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      totalBrightness += brightness;
      brightnessValues.push(brightness);
      
      if (brightness < 50) darkPixels++;

      // Skin tone detection (covers various skin colors)
      if (
        r > 60 && g > 40 && b > 20 &&
        r > g && r > b &&
        Math.abs(r - g) > 12 &&
        r - b > 12 &&
        r < 250 && g < 230 && b < 210
      ) {
        skinPixels++;
      }
    }

    const avgBrightness = totalBrightness / pixelCount;
    const variance = brightnessValues.reduce((sum, val) => sum + Math.pow(val - avgBrightness, 2), 0) / pixelCount;

    return {
      skinRatio: skinPixels / pixelCount,
      avgBrightness,
      variance,
      darkRatio: darkPixels / pixelCount,
    };
  };

  // Analyze each facial region
  const foreheadData = analyzeSkinInRegion(getRegionData(regions.forehead));
  const leftEyeData = analyzeSkinInRegion(getRegionData(regions.leftEye));
  const rightEyeData = analyzeSkinInRegion(getRegionData(regions.rightEye));
  const noseData = analyzeSkinInRegion(getRegionData(regions.nose));
  const mouthData = analyzeSkinInRegion(getRegionData(regions.mouth));
  const chinData = analyzeSkinInRegion(getRegionData(regions.chin));
  const leftCheekData = analyzeSkinInRegion(getRegionData(regions.leftCheek));
  const rightCheekData = analyzeSkinInRegion(getRegionData(regions.rightCheek));
  const topData = analyzeSkinInRegion(getRegionData(regions.top));

  // Face structure detection:
  // 1. Forehead should have skin
  const hasForeheadRegion = foreheadData.skinRatio > 0.25;
  
  // 2. Eye regions should have LESS skin (eyes are darker) or high variance
  const hasEyeRegion = (
    (leftEyeData.variance > 400 || leftEyeData.skinRatio < 0.6) &&
    (rightEyeData.variance > 400 || rightEyeData.skinRatio < 0.6)
  );
  
  // 3. Nose should have skin with some texture
  const hasNoseRegion = noseData.skinRatio > 0.30 && noseData.variance > 200;
  
  // 4. Mouth region should have skin (not masked)
  const hasMouthRegion = mouthData.skinRatio > 0.25 && mouthData.darkRatio < 0.4;
  
  // 5. Cheeks should have skin
  const hasCheeks = leftCheekData.skinRatio > 0.25 && rightCheekData.skinRatio > 0.25;
  
  // 6. Chin should have skin
  const hasChin = chinData.skinRatio > 0.20;

  // Check for mask (low skin in mouth/nose area, possibly uniform color)
  const isMasked = (
    (mouthData.skinRatio < 0.20 || mouthData.darkRatio > 0.35) ||
    (noseData.skinRatio < 0.20) ||
    (mouthData.variance < 500 && mouthData.skinRatio < 0.30)
  );

  // Check for hat (dark/uniform at top)
  const hasHat = topData.darkRatio > 0.4 || (topData.variance < 800 && topData.avgBrightness < 100);

  // Determine if skin distribution is face-like:
  // A face has skin distributed in specific pattern:
  // - High in forehead, cheeks, chin
  // - Variable in eye area
  // - Vertical symmetry (left/right cheeks similar)
  const cheekSymmetry = Math.abs(leftCheekData.skinRatio - rightCheekData.skinRatio) < 0.25;
  const eyeSymmetry = Math.abs(leftEyeData.variance - rightEyeData.variance) < 800;
  
  // Face-like requires: forehead + cheeks + chin with skin, eyes with variation, symmetry
  const isFaceLike = (
    hasForeheadRegion &&
    hasCheeks &&
    hasChin &&
    hasEyeRegion &&
    cheekSymmetry &&
    eyeSymmetry &&
    !isMasked
  );

  // Random skin (like a hand) won't have this structured distribution
  const totalSkinRegions = [
    hasForeheadRegion,
    hasEyeRegion,
    hasNoseRegion,
    hasMouthRegion,
    hasCheeks,
    hasChin
  ].filter(Boolean).length;

  let skinDistribution: 'face_like' | 'random' | 'none';
  if (isFaceLike && totalSkinRegions >= 5) {
    skinDistribution = 'face_like';
  } else if (totalSkinRegions >= 2) {
    skinDistribution = 'random';
  } else {
    skinDistribution = 'none';
  }

  // Overall face structure requires multiple regions to be valid
  const hasFaceStructure = isFaceLike && totalSkinRegions >= 5 && !isMasked && !hasHat;

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
  };
}

export function validateFaceImage(canvas: HTMLCanvasElement): FaceValidationResult {
  try {
    const analysis = analyzeFacialStructure(canvas);

    // STRICT CHECK 1: Must have proper face structure (not just skin)
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

    // STRICT CHECK 2: Must detect eye regions (high variance areas)
    if (!analysis.hasEyeRegion) {
      return {
        isValid: false,
        error: 'Cannot detect eyes. Look directly at the camera.',
        warnings: [],
      };
    }

    // STRICT CHECK 3: Must have forehead visible
    if (!analysis.hasForeheadRegion) {
      return {
        isValid: false,
        error: 'Cannot see forehead. Remove any hair or covering from forehead.',
        warnings: [],
      };
    }

    // STRICT CHECK 4: Mouth region must show skin (mask detection)
    if (!analysis.hasMouthRegion || analysis.isMasked) {
      return {
        isValid: false,
        error: 'Face mask detected! Please remove your mask for verification.',
        warnings: [],
      };
    }

    // STRICT CHECK 5: Nose area must be visible
    if (!analysis.hasNoseRegion) {
      return {
        isValid: false,
        error: 'Your nose is covered. Please remove any face covering.',
        warnings: [],
      };
    }

    // STRICT CHECK 6: Check for hat
    if (analysis.hasHat) {
      return {
        isValid: false,
        error: 'Please remove any hat or head covering for clear identification.',
        warnings: [],
      };
    }

    // STRICT CHECK 7: Final confirmation - skin distribution must be face-like
    if (analysis.skinDistribution !== 'face_like') {
      return {
        isValid: false,
        error: 'Face not properly detected. Center your face in the oval.',
        warnings: [],
      };
    }

    // Check brightness
    if (analysis.brightness < 40) {
      return {
        isValid: false,
        error: 'Too dark! Please move to a brighter area.',
        warnings: [],
      };
    } else if (analysis.brightness > 230) {
      return {
        isValid: false,
        error: 'Too bright! Please reduce the lighting.',
        warnings: [],
      };
    }

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
