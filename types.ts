
export interface BaseImage {
  file: File;
  base64: string;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  base64: string;
}

export interface ConsistencyLocks {
  headAndFaceShape: boolean;
  eyesStyle: boolean;
  mouthStyle: boolean;
  outlineThickness: boolean;
  shadingStyle: boolean;
}

export interface PromptTuning {
    expressionIntensity: number;
    propSize: number;
}

export interface SavedTemplate {
  id: string;
  name: string;
  variations: string;
  primaryColor: string;
  secondaryColor: string;
}
