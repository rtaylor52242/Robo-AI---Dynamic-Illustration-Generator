import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { GeneratedImage, BaseImage } from '../types';
import { DownloadIcon, ImageIcon, FilmIcon, LayoutGridIcon, CheckSquareIcon, SquareIcon } from './icons';
import { createZip, createSpriteSheet, createGif, downloadFile } from '../utils/fileUtils';
import ImageModal from './ImageModal';


interface OutputAreaProps {
  generatedImages: GeneratedImage[];
  isLoading: boolean;
  progress: { current: number; total: number } | null;
  baseImage: BaseImage | null;
  onDeleteImage: (id: string) => void;
  onRemoveBackground: (id: string) => Promise<void>;
  onAddOutline: (id: string, color: string, width: number) => Promise<void>;
  onUpdateImageBase64: (id: string, newBase64: string) => void;
}

type Tab = 'png' | 'spritesheet' | 'gif';

const OutputArea: React.FC<OutputAreaProps> = ({ generatedImages, isLoading, progress, baseImage, onDeleteImage, onRemoveBackground, onAddOutline, onUpdateImageBase64 }) => {
  const [activeTab, setActiveTab] = useState<Tab>('png');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [modalImageIndex, setModalImageIndex] = useState<number | null>(null);
  
  useEffect(() => {
    // Select all images by default when new images are generated
    setSelectedImages(new Set(generatedImages.map(img => img.id)));
  }, [generatedImages]);

  const handleSelectImage = (id: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const selectedImageData = useMemo(() => {
    return generatedImages.filter(img => selectedImages.has(img.id));
  }, [generatedImages, selectedImages]);

  const handleDownloadSelected = useCallback(async () => {
    if (selectedImageData.length === 0) return;
    if (selectedImageData.length === 1) {
        downloadFile(selectedImageData[0].base64, `${selectedImageData[0].prompt}.png`);
    } else {
        await createZip(selectedImageData.map(img => ({ name: `${img.prompt}.png`, data: img.base64.split(',')[1] })));
    }
  }, [selectedImageData]);

  const handleDownloadAll = useCallback(async () => {
    if (generatedImages.length === 0) return;
    await createZip(generatedImages.map(img => ({ name: `${img.prompt}.png`, data: img.base64.split(',')[1] })));
  }, [generatedImages]);

  const handleNext = useCallback(() => {
    if (modalImageIndex !== null) {
        setModalImageIndex((prevIndex) => (prevIndex! + 1) % generatedImages.length);
    }
  }, [modalImageIndex, generatedImages.length]);

  const handlePrevious = useCallback(() => {
    if (modalImageIndex !== null) {
        setModalImageIndex((prevIndex) => (prevIndex! - 1 + generatedImages.length) % generatedImages.length);
    }
  }, [modalImageIndex, generatedImages.length]);

  const handleDeleteFromModal = useCallback((idToDelete: string) => {
    const currentTotal = generatedImages.length;
    
    // Call parent to update state which will re-render this component
    onDeleteImage(idToDelete);

    if (currentTotal <= 1) {
        setModalImageIndex(null); // Close if it was the last one.
    } else if (modalImageIndex !== null && modalImageIndex >= currentTotal - 1) {
        // If we deleted the very last image in the list.
        setModalImageIndex(prev => (prev === null ? null : prev - 1));
    }
    // If any other image is deleted, the index can stay the same, and the next image will appear.
  }, [generatedImages.length, modalImageIndex, onDeleteImage]);

  const currentImage = modalImageIndex !== null ? generatedImages[modalImageIndex] : null;

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState progress={progress} />;
    }
    if (generatedImages.length === 0) {
      return <EmptyState baseImage={baseImage}/>;
    }

    switch (activeTab) {
      case 'png':
        return <PngGrid images={generatedImages} selected={selectedImages} onSelect={handleSelectImage} onImageClick={setModalImageIndex} />;
      case 'spritesheet':
        return <SpriteSheetView images={selectedImageData} />;
      case 'gif':
        return <GifView images={selectedImageData} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg h-full min-h-[calc(100vh-10rem)] flex flex-col">
        <div className="flex-shrink-0 p-4 border-b border-gray-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center border border-gray-700 rounded-lg p-1">
                <TabButton icon={<ImageIcon />} label="PNG files" isActive={activeTab === 'png'} onClick={() => setActiveTab('png')} />
                <TabButton icon={<LayoutGridIcon />} label="Sprite Sheet" isActive={activeTab === 'spritesheet'} onClick={() => setActiveTab('spritesheet')} />
                <TabButton icon={<FilmIcon />} label="Loop GIF" isActive={activeTab === 'gif'} onClick={() => setActiveTab('gif')} />
            </div>
            {generatedImages.length > 0 && (
                <div className="flex gap-2">
                    <button onClick={handleDownloadSelected} disabled={selectedImageData.length === 0} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        <DownloadIcon className="w-4 h-4" />
                        Download Selected ({selectedImageData.length})
                    </button>
                    <button onClick={handleDownloadAll} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                       Download All ({generatedImages.length})
                    </button>
                </div>
            )}
        </div>
        <div className="flex-grow p-4 overflow-y-auto">
            {renderContent()}
        </div>
        {currentImage && (
            <ImageModal 
                image={currentImage} 
                onClose={() => setModalImageIndex(null)}
                onNext={handleNext}
                onPrevious={handlePrevious}
                currentIndex={modalImageIndex!}
                totalImages={generatedImages.length}
                onDelete={handleDeleteFromModal}
                onRemoveBackground={onRemoveBackground}
                onAddOutline={onAddOutline}
                onUpdateImageBase64={onUpdateImageBase64}
            />
        )}
    </div>
  );
};

const TabButton: React.FC<{icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void}> = ({icon, label, isActive, onClick}) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
       {icon} {label}
    </button>
);


const LoadingState: React.FC<{progress: { current: number; total: number } | null}> = ({ progress }) => (
  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
    <div className="w-16 h-16 border-4 border-t-indigo-500 border-gray-600 rounded-full animate-spin mb-4"></div>
    <h3 className="text-xl font-semibold text-white">Generating Illustrations...</h3>
    {progress && (
        <>
        <p className="mt-2">{`Processing variation ${progress.current} of ${progress.total}`}</p>
        <div className="w-full max-w-sm bg-gray-700 rounded-full h-2.5 mt-4">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
        </div>
        </>
    )}
  </div>
);

const EmptyState: React.FC<{ baseImage: BaseImage | null }> = ({ baseImage }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
        <div className="w-24 h-24 text-gray-600 bg-gray-700/50 rounded-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12" />
        </div>
        <h3 className="mt-6 text-xl font-semibold text-white">Output Area</h3>
        <p className="mt-2 max-w-md">
            {baseImage
            ? "Your generated illustrations will appear here once you've entered your prompts and clicked 'Generate'."
            : "Upload a base image and enter some variation prompts to get started."}
        </p>
  </div>
);

const PngGrid: React.FC<{images: GeneratedImage[], selected: Set<string>, onSelect: (id: string) => void, onImageClick: (index: number) => void}> = ({images, selected, onSelect, onImageClick}) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {images.map((img, index) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden bg-gray-900/50">
                <img src={img.base64} alt={img.prompt} className="aspect-square w-full object-contain cursor-pointer" onClick={() => onImageClick(index)} />
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex p-2 pointer-events-none">
                    <p className="text-xs text-white line-clamp-2">{img.prompt}</p>
                </div>

                <button 
                    onClick={() => onSelect(img.id)} 
                    className="absolute top-2 right-2 p-1 z-10 bg-black/20 rounded-full hover:bg-black/50 transition-colors"
                >
                    {selected.has(img.id) 
                        ? <CheckSquareIcon className="w-6 h-6 text-indigo-400"/> 
                        : <SquareIcon className="w-6 h-6 text-gray-400 group-hover:text-white"/>
                    }
                </button>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
                    <p className="text-xs text-white truncate group-hover:hidden">{img.prompt}</p>
                </div>

                {selected.has(img.id) && <div className="absolute inset-0 ring-2 ring-indigo-500 rounded-lg pointer-events-none"></div>}
            </div>
        ))}
    </div>
);


const SpriteSheetView: React.FC<{images: GeneratedImage[]}> = ({ images }) => {
    const [sheet, setSheet] = useState<{sheet: string, map: object} | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const generate = useCallback(async () => {
        if (images.length === 0) return;
        setIsGenerating(true);
        const result = await createSpriteSheet(images.map(i => i.base64), 2048, 2048);
        setSheet(result);
        setIsGenerating(false);
    }, [images]);

    useEffect(() => {
       generate();
    }, [generate]);

    if (images.length === 0) return <div className="text-center text-gray-400">Select at least one image to create a sprite sheet.</div>
    if (isGenerating) return <div className="text-center text-gray-400">Generating Sprite Sheet...</div>
    if (!sheet) return <div className="text-center text-gray-400">Could not generate sprite sheet.</div>

    return (
        <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-white">Sprite Sheet Preview</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg inline-block">
                <img src={sheet.sheet} alt="Sprite Sheet" className="max-w-full h-auto max-h-[50vh] object-contain"/>
            </div>
            <div className="flex justify-center gap-4">
                 <button onClick={() => downloadFile(sheet.sheet, 'sprite-sheet.png')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                    <DownloadIcon className="w-4 h-4" /> Download Sheet (PNG)
                </button>
                 <button onClick={() => downloadFile('data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sheet.map, null, 2)), 'sprite-map.json')} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                    <DownloadIcon className="w-4 h-4" /> Download Map (JSON)
                </button>
            </div>
        </div>
    );
}

const GifView: React.FC<{images: GeneratedImage[]}> = ({ images }) => {
    const [gifUrl, setGifUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const generate = useCallback(async () => {
        if (images.length < 2) return;
        setIsGenerating(true);
        setGifUrl(null);
        const result = await createGif(images.map(i => i.base64), { width: 800, height: 800, fps: 12});
        setGifUrl(result);
        setIsGenerating(false);
    }, [images]);

    useEffect(() => {
        generate();
    }, [generate]);
    
    if (images.length < 2) return <div className="text-center text-gray-400">Select at least two images to create a GIF.</div>
    if (isGenerating) return <div className="text-center text-gray-400">Generating GIF...</div>
    if (!gifUrl) return <div className="text-center text-gray-400">Could not generate GIF.</div>

    return (
         <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-white">Looping GIF Preview</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg inline-block">
                <img src={gifUrl} alt="Generated GIF" className="max-w-full h-auto max-h-[50vh] object-contain"/>
            </div>
            <div>
                 <button onClick={() => downloadFile(gifUrl, 'animation.gif')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                    <DownloadIcon className="w-4 h-4" /> Download GIF
                </button>
            </div>
        </div>
    );
};

export default OutputArea;
