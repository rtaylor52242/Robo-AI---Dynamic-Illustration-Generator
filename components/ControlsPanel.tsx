import React, { useCallback, useRef, useState, useEffect } from 'react';
import type { BaseImage, ConsistencyLocks, PromptTuning, SavedTemplate } from '../types';
import { UploadIcon, Wand2Icon, SaveIcon, InfoIcon, XCircleIcon, Trash2Icon } from './icons';

interface LoadTemplateModalProps {
  onClose: () => void;
  templates: SavedTemplate[];
  onLoad: (template: SavedTemplate) => void;
  onDelete: (templateId: string) => void;
}

const LoadTemplateModal: React.FC<LoadTemplateModalProps> = ({ onClose, templates, onLoad, onDelete }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="load-template-title"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 id="load-template-title" className="text-lg font-semibold text-white">Load Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {templates.length > 0 ? (
            <ul className="space-y-2">
              {templates.map(template => (
                <li key={template.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center">
                  <span className="text-gray-200 font-medium">{template.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onLoad(template)} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-md transition-colors">
                      Load
                    </button>
                    <button onClick={() => onDelete(template.id)} className="text-gray-400 hover:text-red-400 p-1" aria-label={`Delete ${template.name}`}>
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400 py-8">No saved templates found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface SaveTemplateModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
  templates: SavedTemplate[];
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ onClose, onSave, templates }) => {
  const [name, setName] = useState('');
  const [nameExists, setNameExists] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (newName.trim()) {
      const exists = templates.some(t => t.name.toLowerCase() === newName.trim().toLowerCase());
      setNameExists(exists);
    } else {
      setNameExists(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 id="save-template-title" className="text-lg font-semibold text-white">Save Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="template-name" className="block text-sm font-medium text-gray-300 mb-1">Template Name</label>
            <input
              type="text"
              id="template-name"
              value={name}
              onChange={handleNameChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Social Media Set"
              required
              autoFocus
            />
            {nameExists && (
              <p className="text-xs text-amber-400 mt-2">
                A template with this name already exists. Saving will overwrite it.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="bg-gray-700/50 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {nameExists ? 'Overwrite' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


interface ControlsPanelProps {
  baseImage: BaseImage | null;
  onImageUpload: (file: File) => void;
  variations: string;
  setVariations: React.Dispatch<React.SetStateAction<string>>;
  primaryColor: string;
  setPrimaryColor: React.Dispatch<React.SetStateAction<string>>;
  secondaryColor: string;
  setSecondaryColor: React.Dispatch<React.SetStateAction<string>>;
  useStrictPalette: boolean;
  setUseStrictPalette: React.Dispatch<React.SetStateAction<boolean>>;
  consistencyLocks: ConsistencyLocks;
  setConsistencyLocks: React.Dispatch<React.SetStateAction<ConsistencyLocks>>;
  promptTuning: PromptTuning;
  setPromptTuning: React.Dispatch<React.SetStateAction<PromptTuning>>;
  onGenerate: () => void;
  isLoading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  presets: string[];
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  baseImage, onImageUpload, variations, setVariations, primaryColor, setPrimaryColor,
  secondaryColor, setSecondaryColor, useStrictPalette, setUseStrictPalette,
  consistencyLocks, setConsistencyLocks, promptTuning, setPromptTuning, onGenerate, isLoading, error, setError,
  presets
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('roboAiTemplates');
      if (saved) {
        setSavedTemplates(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to parse templates from localStorage", e);
      // Clear corrupted data
      localStorage.removeItem('roboAiTemplates');
    }
  }, []);

  const updateTemplatesInStorage = (templates: SavedTemplate[]) => {
    localStorage.setItem('roboAiTemplates', JSON.stringify(templates));
    setSavedTemplates(templates);
  };


  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  }, [onImageUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const togglePreset = (preset: string) => {
    const lines = variations.split('\n').map(l => l.trim()).filter(Boolean);
    const index = lines.indexOf(preset);
    if (index > -1) {
      lines.splice(index, 1);
    } else {
      lines.push(preset);
    }
    setVariations(lines.join('\n'));
  };
  
  const handleSaveTemplate = (name: string) => {
    if (!name || !name.trim()) return;

    const trimmedName = name.trim();

    const newTemplateData = {
        variations,
        primaryColor,
        secondaryColor,
    };

    let currentTemplates = [...savedTemplates];
    const existingTemplate = currentTemplates.find(t => t.name.toLowerCase() === trimmedName.toLowerCase());

    if (existingTemplate) {
        // Overwrite existing
        currentTemplates = currentTemplates.map(t =>
            t.id === existingTemplate.id ? { ...t, ...newTemplateData, name: trimmedName } : t
        );
    } else {
        // Add new
        const newTemplate: SavedTemplate = {
            id: Date.now().toString(),
            name: trimmedName,
            ...newTemplateData,
        };
        currentTemplates.push(newTemplate);
    }
    updateTemplatesInStorage(currentTemplates);
    setIsSaveModalOpen(false);
  };
  
  const openLoadModal = () => {
    setIsLoadModalOpen(true);
  };
  
  const handleLoadTemplate = (template: SavedTemplate) => {
    setVariations(template.variations);
    setPrimaryColor(template.primaryColor);
    setSecondaryColor(template.secondaryColor);
    setIsLoadModalOpen(false);
  };
  
  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template? This cannot be undone.')) {
        const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
        updateTemplatesInStorage(updatedTemplates);
    }
  };

  const handleClearVariations = () => {
    setVariations('');
  };


  const renderSection = (title: string, children: React.ReactNode) => (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative flex items-start gap-3" role="alert">
            <XCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <XCircleIcon className="w-5 h-5"/>
            </button>
        </div>
      )}

      {renderSection("1. Base Image", (
        <div>
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
              ${baseImage ? 'border-indigo-500' : 'border-gray-600 hover:border-indigo-500'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {baseImage ? (
              <img src={baseImage.base64} alt="Base preview" className="mx-auto max-h-48 rounded-md" />
            ) : (
              <div className="flex flex-col items-center justify-center h-48">
                <UploadIcon className="w-12 h-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-400">
                  <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, or WebP. Transparent PNG preferred.</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
          </div>
           <div className="flex items-start gap-2 text-indigo-300/70 mt-3 p-2 bg-indigo-900/20 rounded-md">
                <InfoIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">Use an illustrated avatar/mascot. Real-person photos are not supported and will be rejected.</p>
            </div>
        </div>
      ))}
      
      {renderSection("2. Variations", (
        <div className="space-y-3">
          <textarea
            value={variations}
            onChange={(e) => setVariations(e.target.value)}
            rows={5}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="happy grin\ncrying tears of joy\nwearing a party hat + confetti"
          />
          <div className="flex flex-wrap gap-2">
            {presets.map(p => {
              const isActive = variations.split('\n').map(l => l.trim()).includes(p);
              return (
                  <button key={p} onClick={() => togglePreset(p)} className={`text-xs rounded-full px-3 py-1 transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {p}
                  </button>
              );
            })}
          </div>
           <div className="pt-2 grid grid-cols-3 gap-2">
               <button onClick={() => setIsSaveModalOpen(true)} className="text-sm flex items-center gap-2 w-full justify-center bg-gray-700/50 hover:bg-gray-700 rounded-md px-3 py-2 transition-colors">
                   <SaveIcon className="w-4 h-4" /> Save
                </button>
                <button onClick={openLoadModal} className="text-sm w-full flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 rounded-md px-3 py-2 transition-colors">
                   Load
                </button>
                <button 
                    onClick={handleClearVariations} 
                    disabled={!variations}
                    className="text-sm flex items-center gap-2 w-full justify-center bg-gray-700/50 hover:bg-red-800/60 hover:text-white rounded-md px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   <Trash2Icon className="w-4 h-4" /> Clear
                </button>
           </div>
        </div>
      ))}

      {renderSection("3. Brand & Style Controls", (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-300">Primary Color</label>
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-full h-10 p-1 bg-gray-900 border border-gray-700 rounded-md cursor-pointer"/>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-300">Secondary Color</label>
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-full h-10 p-1 bg-gray-900 border border-gray-700 rounded-md cursor-pointer"/>
                </div>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-300">Strict Brand Palette</span>
                <div className={`relative inline-block w-10 h-6 rounded-full transition-colors ${useStrictPalette ? 'bg-indigo-600' : 'bg-gray-600'}`}>
                    <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${useStrictPalette ? 'transform translate-x-4' : ''}`}></span>
                </div>
                <input type="checkbox" checked={useStrictPalette} onChange={e => setUseStrictPalette(e.target.checked)} className="sr-only"/>
            </label>
            <div>
                 <h3 className="text-sm font-medium text-gray-300 mb-2">Consistency Locks</h3>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                     {Object.keys(consistencyLocks).map(key => (
                         <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                             <input type="checkbox" checked={consistencyLocks[key as keyof ConsistencyLocks]} onChange={e => setConsistencyLocks(p => ({...p, [key]: e.target.checked}))} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"/>
                             {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                         </label>
                     ))}
                 </div>
            </div>
        </div>
      ))}
      
      {renderSection("4. Prompt Tuning (Advanced)", (
          <div className="space-y-4">
              <div>
                  <label htmlFor="expression-intensity" className="flex justify-between text-sm font-medium text-gray-300">
                      <span>Expression Intensity</span>
                      <span className="text-gray-400">{promptTuning.expressionIntensity}%</span>
                  </label>
                  <input id="expression-intensity" type="range" min="0" max="100" value={promptTuning.expressionIntensity} onChange={e => setPromptTuning(p => ({...p, expressionIntensity: +e.target.value}))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
              </div>
              <div>
                  <label htmlFor="prop-size" className="flex justify-between text-sm font-medium text-gray-300">
                      <span>Prop Size</span>
                      <span className="text-gray-400">{promptTuning.propSize}%</span>
                  </label>
                  <input id="prop-size" type="range" min="0" max="100" value={promptTuning.propSize} onChange={e => setPromptTuning(p => ({...p, propSize: +e.target.value}))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
              </div>
          </div>
      ))}


      <button
        onClick={onGenerate}
        disabled={isLoading || !baseImage}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg"
      >
        <Wand2Icon className="w-6 h-6" />
        {isLoading ? 'Generating...' : 'Generate Illustrations'}
      </button>

      {isLoadModalOpen && (
        <LoadTemplateModal
          onClose={() => setIsLoadModalOpen(false)}
          templates={savedTemplates}
          onLoad={handleLoadTemplate}
          onDelete={handleDeleteTemplate}
        />
      )}

      {isSaveModalOpen && (
        <SaveTemplateModal
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleSaveTemplate}
            templates={savedTemplates}
        />
      )}
    </div>
  );
};

export default ControlsPanel;