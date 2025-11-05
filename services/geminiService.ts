import { GoogleGenAI, Modality } from '@google/genai';
import type { ConsistencyLocks, PromptTuning } from '../types';

if (!process.env.API_KEY) {
  // In a real app, this would be a fatal error.
  // For this environment, we assume it's provided.
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface ImageInput {
    data: string; // base64 encoded string
    mimeType: string;
}

interface GenerateVariationParams {
  baseImage: ImageInput;
  prompt: string;
  colors: {
    primary: string;
    secondary: string;
  };
  useStrictPalette: boolean;
  consistencyLocks: ConsistencyLocks;
  promptTuning: PromptTuning;
}

const getIntensityString = (value: number) => {
    if (value < 33) return 'subtle';
    if (value < 66) return 'moderate';
    return 'exaggerated';
}
const getPropSizeString = (value: number) => {
    if (value < 33) return 'small';
    if (value < 66) return 'medium';
    return 'large';
}

export const generateVariation = async ({
  baseImage,
  prompt,
  colors,
  useStrictPalette,
  consistencyLocks,
  promptTuning,
}: GenerateVariationParams): Promise<string> => {
  const model = 'gemini-2.5-flash-image';

  const fullPrompt = `
You are an expert illustrator's assistant. Your task is to generate a variation of the provided base image based on a specific request.

**CRITICAL RULES:**
1.  **Preserve Core Identity:** The output MUST be stylistically identical to the base image. Maintain the exact character, art style (e.g., flat, 3D, cel-shaded), line weight, proportions, and overall feel. The output must look like it was drawn by the same artist moments after the original.
2.  **Apply ONLY the requested change.** Do not add, remove, or change any other elements unless they are a direct consequence of the main request (e.g., hand position changing when holding a prop).
3.  **Maintain Consistency Locks:** The following attributes MUST remain IDENTICAL to the base image:
    ${consistencyLocks.headAndFaceShape ? '- Head and Face Shape' : ''}
    ${consistencyLocks.eyesStyle ? '- Eye Style (shape, color, pupils)' : ''}
    ${consistencyLocks.mouthStyle ? '- Mouth Style (when in a neutral state)' : ''}
    ${consistencyLocks.outlineThickness ? '- Outline Thickness and Style' : ''}
    ${consistencyLocks.shadingStyle ? '- Shading and Highlight Style' : ''}
4.  **Color Palette:**
    ${useStrictPalette
      ? `- STRICTLY use ONLY the provided brand colors: Primary: ${colors.primary}, Secondary: ${colors.secondary}. Map all new elements and color accents to these colors.`
      : `- HEAVILY FAVOR the brand colors (Primary: ${colors.primary}, Secondary: ${colors.secondary}), but allow for subtle, harmonious additions ONLY if absolutely necessary for the requested variation.`
    }
5.  **Output Format:** Generate a 2048x2048 PNG image. The background MUST be transparent unless a background is explicitly requested in the prompt with "Background:".
6.  **No Text:** Do not generate any text, letters, or numbers inside the illustration unless explicitly requested with "Text:".
7.  **Quality:** Ensure crisp, clean edges. Avoid JPEG artifacts or blurriness.

**PROMPT TUNING:**
- Expression Intensity: ${getIntensityString(promptTuning.expressionIntensity)}
- Prop Size (if applicable): ${getPropSizeString(promptTuning.propSize)}

**REQUESTED VARIATION:**
"${prompt}"
`;

  const imagePart = {
    inlineData: {
      data: baseImage.data,
      mimeType: baseImage.mimeType,
    },
  };

  const textPart = {
    text: fullPrompt,
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
    }
    throw new Error('No image data found in the API response.');

  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw new Error('Failed to generate image. Please check your prompt or API key.');
  }
};

export const removeBackground = async ({ data, mimeType }: ImageInput): Promise<string> => {
    const model = 'gemini-2.5-flash-image';
    const prompt = "Please remove the background from this image. The new background must be transparent. Preserve all details and edges of the foreground subject.";

    const imagePart = {
        inlineData: { data, mimeType },
    };

    const textPart = {
        text: prompt,
    };
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error('No image data found in API response for background removal.');
    } catch (error) {
        console.error('Gemini API call for background removal failed:', error);
        throw new Error('Failed to remove background via API.');
    }
};

export const addOutline = async (image: ImageInput, outlineColor: string, outlineWidth: number): Promise<string> => {
    const model = 'gemini-2.5-flash-image';
    const prompt = `
You are an expert illustrator's assistant. Your task is to add a clean, solid outline to the main subject of the provided image.

**CRITICAL RULES:**
1.  **Subject:** Add the outline ONLY to the main character/subject in the image.
2.  **Outline Color:** The outline color MUST be exactly ${outlineColor}. Do not use any other color for the outline.
3.  **Outline Thickness:** The outline should be a consistent ${outlineWidth}px thick.
4.  **Background:** The background MUST remain transparent. Do not add any new background elements.
5.  **Preserve Original:** Do not alter the original illustration's colors, shading, or details in any way. Simply add the outline around it.
6.  **Output Format:** The output must be a PNG image with a transparent background.
`;

    const imagePart = {
        inlineData: { data: image.data, mimeType: image.mimeType },
    };

    const textPart = {
        text: prompt,
    };
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error('No image data found in API response for adding outline.');
    } catch (error) {
        console.error('Gemini API call for adding outline failed:', error);
        throw new Error('Failed to add outline via API.');
    }
};