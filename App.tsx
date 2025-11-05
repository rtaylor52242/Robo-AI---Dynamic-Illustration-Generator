import React, { useState, useCallback, useEffect } from 'react';
import { BaseImage, GeneratedImage, ConsistencyLocks, PromptTuning } from './types';
import Header from './components/Header';
import ControlsPanel from './components/ControlsPanel';
import OutputArea from './components/OutputArea';
import { generateVariation, removeBackground, addOutline } from './services/geminiService';
import { fileToBase64, base64ToFile } from './utils/fileUtils';
import ConfirmationModal from './components/ConfirmationModal';

const INITIAL_PRESETS = [
  'happy grin', 'shocked', 'crying tears of joy', 'winking', 'reading a book', 'using a laptop', 'holding a coffee mug', 'giving a thumbs-up', 'in a superhero pose', 'wearing a party hat with confetti', 'wearing a Santa hat', 'holding a pumpkin'
];

const App: React.FC = () => {
  const [baseImage, setBaseImage] = useState<BaseImage | null>(null);
  const [variations, setVariations] = useState<string>(() => {
    try {
      return localStorage.getItem('roboAiCurrentVariations') || '';
    } catch (e) {
      console.warn('Failed to read variations from localStorage', e);
      return '';
    }
  });
  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    try {
      return localStorage.getItem('roboAiCurrentPrimaryColor') || '#4F46E5';
    } catch (e) {
      console.warn('Failed to read primaryColor from localStorage', e);
      return '#4F46E5';
    }
  });
  const [secondaryColor, setSecondaryColor] = useState<string>(() => {
    try {
      return localStorage.getItem('roboAiCurrentSecondaryColor') || '#10B981';
    } catch (e) {
      console.warn('Failed to read secondaryColor from localStorage', e);
      return '#10B981';
    }
  });
  const [useStrictPalette, setUseStrictPalette] = useState<boolean>(true);
  const [consistencyLocks, setConsistencyLocks] = useState<ConsistencyLocks>({
    headAndFaceShape: true,
    eyesStyle: true,
    mouthStyle: true,
    outlineThickness: true,
    shadingStyle: true,
  });
   const [promptTuning, setPromptTuning] = useState<PromptTuning>({
    expressionIntensity: 50,
    propSize: 50,
  });
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('roboAiPresets');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Use a Set to ensure no duplicates if a saved preset matches an initial one
        return [...new Set([...INITIAL_PRESETS, ...parsed])];
      }
    } catch (e) {
      console.error("Failed to parse presets from localStorage", e);
    }
    return INITIAL_PRESETS;
  });
  const [savePresetsConfirmation, setSavePresetsConfirmation] = useState<string[] | null>(null);


  useEffect(() => {
    try {
        localStorage.setItem('roboAiCurrentVariations', variations);
        localStorage.setItem('roboAiCurrentPrimaryColor', primaryColor);
        localStorage.setItem('roboAiCurrentSecondaryColor', secondaryColor);
    } catch (e) {
        console.error("Failed to save working state to localStorage", e);
    }
  }, [variations, primaryColor, secondaryColor]);

  useEffect(() => {
    try {
      // Filter out presets that are in the initial default list
      const customPresets = presets.filter(p => !INITIAL_PRESETS.includes(p));
      localStorage.setItem('roboAiPresets', JSON.stringify(customPresets));
    } catch (e) {
      console.error("Failed to save presets to localStorage", e);
    }
  }, [presets]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Please upload a PNG, JPG, or WebP file.');
      return;
    }
    // Simple check for "real person" photo - heuristic based on file name.
    if (/(person|photo|selfie|portrait)/i.test(file.name)) {
        setError('Real person photos are not supported. Please use an illustrated avatar or mascot.');
        return;
    }
    setError(null);
    const base64 = await fileToBase64(file);
    setBaseImage({ file, base64 });
    setGeneratedImages([]);
  }, []);

  const executeGeneration = useCallback(async () => {
    if (!baseImage) {
      setError('Please upload a base image first.');
      return;
    }
    const variationPrompts = variations.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (variationPrompts.length === 0) {
      setError('Please enter at least one variation prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    setProgress({ current: 0, total: variationPrompts.length });

    const newImages: GeneratedImage[] = [];

    for (let i = 0; i < variationPrompts.length; i++) {
      const prompt = variationPrompts[i];
      setProgress({ current: i + 1, total: variationPrompts.length });
      try {
        const resultBase64 = await generateVariation({
          baseImage: {
            data: baseImage.base64.split(',')[1],
            mimeType: baseImage.file.type,
          },
          prompt,
          colors: { primary: primaryColor, secondary: secondaryColor },
          useStrictPalette,
          consistencyLocks,
          promptTuning,
        });
        newImages.push({
          id: `${Date.now()}-${i}`,
          prompt,
          base64: `data:image/png;base64,${resultBase64}`,
        });
        setGeneratedImages([...newImages]);
      } catch (e) {
        console.error('Error generating variation:', e);
        setError(`Failed to generate variation for: "${prompt}". Please try again.`);
        // Stop on first error
        setIsLoading(false);
        setProgress(null);
        return;
      }
    }

    setIsLoading(false);
    setProgress(null);
  }, [baseImage, variations, primaryColor, secondaryColor, useStrictPalette, consistencyLocks, promptTuning]);
  
  const handleGenerate = useCallback(async () => {
    if (!baseImage) {
      setError('Please upload a base image first.');
      return;
    }
    const variationPrompts = variations.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (variationPrompts.length === 0) {
      setError('Please enter at least one variation prompt.');
      return;
    }
    if (variationPrompts.length > 30) {
        setError('Batch mode supports up to 30 variations per run.');
        return;
    }

    const newVariations = [...new Set(variationPrompts.filter(v => !presets.includes(v)))];
    
    if (newVariations.length > 0) {
      setSavePresetsConfirmation(newVariations);
    } else {
      executeGeneration();
    }
  }, [baseImage, variations, presets, executeGeneration]);

  const handleConfirmSavePresets = () => {
    if (savePresetsConfirmation) {
      setPresets(prev => [...new Set([...prev, ...savePresetsConfirmation])]);
    }
    setSavePresetsConfirmation(null);
    executeGeneration();
  };

  const handleDeclineSavePresets = () => {
    setSavePresetsConfirmation(null);
    executeGeneration();
  };

  const handleDeleteImage = useCallback((id: string) => {
    setGeneratedImages(prevImages => prevImages.filter(img => img.id !== id));
  }, []);

  const handleRemoveBackground = useCallback(async (id: string) => {
    const imageToUpdate = generatedImages.find(img => img.id === id);
    if (!imageToUpdate) {
        setError("Could not find the image to modify.");
        return;
    }
    
    const imageFile = base64ToFile(imageToUpdate.base64, 'image.png');
    if (!imageFile) {
        setError("Could not process the image file.");
        return;
    }

    try {
        const resultBase64 = await removeBackground({
            data: imageToUpdate.base64.split(',')[1],
            mimeType: imageFile.type,
        });

        setGeneratedImages(prevImages =>
            prevImages.map(img =>
                img.id === id
                    ? { ...img, base64: `data:image/png;base64,${resultBase64}` }
                    : img
            )
        );
    } catch (e) {
        console.error("Failed to remove background:", e);
        setError("Sorry, the background could not be removed. This can happen with complex images. Please try again.");
        throw e; // re-throw to allow modal to handle its state
    }
  }, [generatedImages]);

  const handleAddOutline = useCallback(async (id: string, color: string, width: number) => {
    const imageToUpdate = generatedImages.find(img => img.id === id);
    if (!imageToUpdate) {
        setError("Could not find the image to modify.");
        return;
    }
    
    const imageFile = base64ToFile(imageToUpdate.base64, 'image.png');
    if (!imageFile) {
        setError("Could not process the image file.");
        return;
    }

    try {
        const resultBase64 = await addOutline({
            data: imageToUpdate.base64.split(',')[1],
            mimeType: imageFile.type,
        }, color, width);

        setGeneratedImages(prevImages =>
            prevImages.map(img =>
                img.id === id
                    ? { ...img, base64: `data:image/png;base64,${resultBase64}` }
                    : img
            )
        );
    } catch (e) {
        console.error("Failed to add outline:", e);
        setError("Sorry, the outline could not be added. Please try different settings or another image.");
        throw e; // re-throw to allow modal to handle its state
    }
  }, [generatedImages]);

  const handleUpdateImageBase64 = useCallback((id: string, newBase64: string) => {
    setGeneratedImages(prevImages =>
      prevImages.map(img =>
        img.id === id ? { ...img, base64: newBase64 } : img
      )
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-screen-2xl mx-auto">
          <div className="lg:col-span-4 xl:col-span-3">
            <ControlsPanel
              baseImage={baseImage}
              onImageUpload={handleImageUpload}
              variations={variations}
              setVariations={setVariations}
              primaryColor={primaryColor}
              setPrimaryColor={setPrimaryColor}
              secondaryColor={secondaryColor}
              setSecondaryColor={setSecondaryColor}
              useStrictPalette={useStrictPalette}
              setUseStrictPalette={setUseStrictPalette}
              consistencyLocks={consistencyLocks}
              setConsistencyLocks={setConsistencyLocks}
              promptTuning={promptTuning}
              setPromptTuning={setPromptTuning}
              onGenerate={handleGenerate}
              isLoading={isLoading}
              error={error}
              setError={setError}
              presets={presets}
            />
          </div>
          <div className="lg:col-span-8 xl:col-span-9">
            <OutputArea
              generatedImages={generatedImages}
              isLoading={isLoading}
              progress={progress}
              baseImage={baseImage}
              onDeleteImage={handleDeleteImage}
              onRemoveBackground={handleRemoveBackground}
              onAddOutline={handleAddOutline}
              onUpdateImageBase64={handleUpdateImageBase64}
            />
          </div>
        </div>
      </main>
      {savePresetsConfirmation && (
        <ConfirmationModal
          isOpen={!!savePresetsConfirmation}
          onClose={handleDeclineSavePresets}
          onConfirm={handleConfirmSavePresets}
          title="Save New Presets?"
          confirmText="Yes, Save"
          cancelText="No, Continue"
        >
            <p className="text-sm text-gray-300">You've added new variations. Would you like to save them as presets for future use?</p>
            <ul className="text-xs text-gray-400 list-disc list-inside bg-gray-700/50 p-2 rounded-md mt-2 max-h-24 overflow-y-auto">
                {savePresetsConfirmation.map(v => <li key={v}>{v}</li>)}
            </ul>
        </ConfirmationModal>
      )}
    </div>
  );
};

export default App;