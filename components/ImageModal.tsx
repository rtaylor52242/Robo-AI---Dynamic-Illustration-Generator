import React, { useEffect, useState, useRef } from 'react';
import type { GeneratedImage } from '../types';
import { XCircleIcon, DownloadIcon, ShareIcon, ChevronLeftIcon, ChevronRightIcon, Trash2Icon, LayersIcon, SpinnerIcon, SquarePenIcon, TypeIcon, BoldIcon, ItalicIcon, UnderlineIcon } from './icons';
import { downloadFile, base64ToFile } from '../utils/fileUtils';

interface ImageModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  currentIndex: number;
  totalImages: number;
  onDelete: (id: string) => void;
  onRemoveBackground: (id: string) => Promise<void>;
  onAddOutline: (id: string, color: string, width: number) => Promise<void>;
  onUpdateImageBase64: (id: string, newBase64: string) => void;
}

const FONT_FACES = ['Arial', 'Verdana', 'Georgia', 'Comic Sans MS', 'Impact', 'Times New Roman'];


const ImageModal: React.FC<ImageModalProps> = ({ image, onClose, onNext, onPrevious, currentIndex, totalImages, onDelete, onRemoveBackground, onAddOutline, onUpdateImageBase64 }) => {
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isAddingOutline, setIsAddingOutline] = useState(false);
  const [isOutlinePopoverOpen, setIsOutlinePopoverOpen] = useState(false);
  const [outlineColor, setOutlineColor] = useState('#FFFFFF');
  const [outlineWidth, setOutlineWidth] = useState(4);
  const outlinePopoverRef = useRef<HTMLDivElement>(null);
  
  const [isTextPopoverOpen, setIsTextPopoverOpen] = useState(false);
  const textPopoverRef = useRef<HTMLDivElement>(null);
  const [textOverlay, setTextOverlay] = useState({
      text: 'Hello World',
      font: 'Impact',
      color: '#FFFFFF',
      size: 80,
      bold: false,
      italic: false,
      underline: false,
      position: 'center', // 'top', 'center', 'bottom'
  });

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const isLoading = isRemovingBg || isAddingOutline;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (totalImages > 1) {
        if (event.key === 'ArrowRight') {
          onNext();
        }
        if (event.key === 'ArrowLeft') {
          onPrevious();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // prevent background scrolling

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, onNext, onPrevious, totalImages]);
  
  // Reset loading state and close popovers if user navigates to another image.
  useEffect(() => {
      setIsRemovingBg(false);
      setIsAddingOutline(false);
      setIsOutlinePopoverOpen(false);
      setIsTextPopoverOpen(false);
  }, [image.id]);

  // Handle clicking outside popovers to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOutlinePopoverOpen && outlinePopoverRef.current && !outlinePopoverRef.current.contains(event.target as Node)) {
        setIsOutlinePopoverOpen(false);
      }
      if (isTextPopoverOpen && textPopoverRef.current && !textPopoverRef.current.contains(event.target as Node)) {
        setIsTextPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOutlinePopoverOpen, isTextPopoverOpen]);

  const handleShare = async () => {
    const file = base64ToFile(image.base64, `${image.prompt}.png`);
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'AI Generated Illustration',
          text: `Check out this illustration for "${image.prompt}"`,
        });
      } catch (error) {
        console.error('Sharing failed or was cancelled', error);
      }
    } else {
        console.warn('Web Share API cannot share this file or is not supported.');
    }
  };

  const handleRemoveBg = async () => {
      setIsRemovingBg(true);
      try {
          await onRemoveBackground(image.id);
      } catch (e) {
          console.error("Modal caught background removal error", e);
      } finally {
          setIsRemovingBg(false);
      }
  };

  const handleApplyOutline = async () => {
    setIsAddingOutline(true);
    setIsOutlinePopoverOpen(false);
    try {
        await onAddOutline(image.id, outlineColor, outlineWidth);
    } catch (e) {
        console.error("Modal caught outline error", e);
    } finally {
        setIsAddingOutline(false);
    }
  };

  const handleApplyText = async () => {
    if (!textOverlay.text.trim()) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        let fontStyle = '';
        if (textOverlay.italic) fontStyle += 'italic ';
        if (textOverlay.bold) fontStyle += 'bold ';
        ctx.font = `${fontStyle} ${textOverlay.size}px "${textOverlay.font}"`;
        ctx.fillStyle = textOverlay.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const x = canvas.width / 2;
        let y;
        const margin = textOverlay.size * 0.5;
        const metrics = ctx.measureText(textOverlay.text);
        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        switch (textOverlay.position) {
            case 'top':
                y = margin;
                break;
            case 'bottom':
                y = canvas.height - textHeight - margin;
                break;
            case 'center':
            default:
                y = (canvas.height - textHeight) / 2;
                break;
        }

        ctx.fillText(textOverlay.text, x, y);

        if (textOverlay.underline) {
            const textWidth = metrics.width;
            const underlineY = y + textHeight + 4; 
            const underlineHeight = Math.max(2, textOverlay.size / 15);
            ctx.fillRect(x - textWidth / 2, underlineY, textWidth, underlineHeight);
        }

        const newBase64 = canvas.toDataURL('image/png');
        onUpdateImageBase64(image.id, newBase64);
        setIsTextPopoverOpen(false);
    };
    img.src = image.base64;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
       {totalImages > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); onPrevious(); }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/30 rounded-full hover:bg-black/60 transition-colors"
          aria-label="Previous Image"
        >
          <ChevronLeftIcon className="w-8 h-8 text-white" />
        </button>
      )}

      <div 
        className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl max-h-[90vh] w-full flex flex-col relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0 gap-4">
            <div className="flex-1 min-w-0">
                 <p id="image-modal-title" className="text-gray-300 text-sm line-clamp-2">{image.prompt}</p>
                 {totalImages > 1 && <p className="text-gray-400 text-xs mt-1">{currentIndex + 1} / {totalImages}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                 <button 
                    onClick={() => downloadFile(image.base64, `${image.prompt}.png`)} 
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm"
                 >
                    <DownloadIcon className="w-4 h-4"/> Download
                </button>
                 {canShare && (
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm"
                        aria-label="Share Image"
                    >
                        <ShareIcon className="w-4 h-4" /> Share
                    </button>
                 )}
                <div className="relative" ref={textPopoverRef}>
                    <button
                        onClick={() => setIsTextPopoverOpen(p => !p)}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm disabled:opacity-50"
                        aria-label="Add Text"
                    >
                        <TypeIcon className="w-4 h-4" /> Add Text
                    </button>
                    {isTextPopoverOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-gray-700 rounded-lg shadow-xl z-20 p-4 border border-gray-600/50">
                            <div className="space-y-4 text-sm text-gray-200">
                                <div>
                                    <label htmlFor="text-input" className="font-medium">Text</label>
                                    <input id="text-input" type="text" value={textOverlay.text} onChange={e => setTextOverlay(p => ({...p, text: e.target.value}))} className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="font-select" className="font-medium">Font</label>
                                        <select id="font-select" value={textOverlay.font} onChange={e => setTextOverlay(p => ({...p, font: e.target.value}))} className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500">
                                            {FONT_FACES.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                         <label htmlFor="position-select" className="font-medium">Position</label>
                                        <select id="position-select" value={textOverlay.position} onChange={e => setTextOverlay(p => ({...p, position: e.target.value}))} className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500">
                                            <option value="top">Top</option>
                                            <option value="center">Center</option>
                                            <option value="bottom">Bottom</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">Style</div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setTextOverlay(p => ({...p, bold: !p.bold}))} className={`p-2 rounded-md ${textOverlay.bold ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-600'}`}><BoldIcon className="w-4 h-4"/></button>
                                        <button onClick={() => setTextOverlay(p => ({...p, italic: !p.italic}))} className={`p-2 rounded-md ${textOverlay.italic ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-600'}`}><ItalicIcon className="w-4 h-4"/></button>
                                        <button onClick={() => setTextOverlay(p => ({...p, underline: !p.underline}))} className={`p-2 rounded-md ${textOverlay.underline ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-600'}`}><UnderlineIcon className="w-4 h-4"/></button>
                                    </div>
                                    <input type="color" value={textOverlay.color} onChange={e => setTextOverlay(p => ({...p, color: e.target.value}))} className="w-10 h-8 p-0.5 bg-gray-800 border border-gray-600 rounded-md cursor-pointer"/>
                                </div>
                                <div>
                                    <label htmlFor="text-size" className="flex justify-between font-medium">
                                        <span>Size</span>
                                        <span className="text-gray-400">{textOverlay.size}px</span>
                                    </label>
                                    <input id="text-size" type="range" min="12" max="200" value={textOverlay.size} onChange={e => setTextOverlay(p => ({...p, size: +e.target.value}))} className="w-full h-2 mt-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                                </div>
                                <button onClick={handleApplyText} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-md transition-colors">Apply Text</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative" ref={outlinePopoverRef}>
                    <button
                        onClick={() => setIsOutlinePopoverOpen(prev => !prev)}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-wait"
                        aria-label="Add Outline"
                    >
                        {isAddingOutline ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <SquarePenIcon className="w-4 h-4" />}
                        {isAddingOutline ? 'Working...' : 'Outline'}
                    </button>
                    {isOutlinePopoverOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-700 rounded-lg shadow-xl z-10 p-4 border border-gray-600/50">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="outline-color" className="text-sm font-medium text-gray-200">Outline Color</label>
                                    <input id="outline-color" type="color" value={outlineColor} onChange={e => setOutlineColor(e.target.value)} className="w-10 h-8 p-0.5 bg-gray-800 border border-gray-600 rounded-md cursor-pointer"/>
                                </div>
                                <div>
                                    <label htmlFor="outline-width" className="flex justify-between text-sm font-medium text-gray-200">
                                        <span>Outline Width</span>
                                        <span className="text-gray-400">{outlineWidth}px</span>
                                    </label>
                                    <input id="outline-width" type="range" min="1" max="20" value={outlineWidth} onChange={e => setOutlineWidth(+e.target.value)} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                                </div>
                                <button onClick={handleApplyOutline} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-md transition-colors text-sm">
                                    Apply Outline
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleRemoveBg}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-wait"
                    aria-label="Remove Background"
                >
                    {isRemovingBg ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <LayersIcon className="w-4 h-4" />}
                    {isRemovingBg ? 'Removing...' : 'Remove BG'}
                </button>
                <button
                    onClick={() => onDelete(image.id)}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm"
                    aria-label="Delete Image"
                >
                    <Trash2Icon className="w-4 h-4" /> Delete
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-2" aria-label="Close">
                    <XCircleIcon className="w-8 h-8"/>
                </button>
            </div>
        </div>
        <div className="flex-grow p-4 overflow-auto flex items-center justify-center relative">
          <img src={image.base64} alt={image.prompt} className="max-w-full max-h-full object-contain" />
           {isLoading && (
                <div className="absolute inset-0 bg-gray-900/70 flex flex-col items-center justify-center text-white">
                    <SpinnerIcon className="w-10 h-10 animate-spin" />
                    <p className="mt-4 text-lg font-semibold">{isAddingOutline ? 'Adding Outline...' : 'Removing Background...'}</p>
                </div>
            )}
        </div>
      </div>
      
      {totalImages > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/30 rounded-full hover:bg-black/60 transition-colors"
          aria-label="Next Image"
        >
          <ChevronRightIcon className="w-8 h-8 text-white" />
        </button>
      )}
    </div>
  );
};

export default ImageModal;
