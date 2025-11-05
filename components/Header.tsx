
import React, { useState } from 'react';
import { SparklesIcon, HelpCircleIcon } from './icons';
import UserGuideModal from './UserGuideModal';

const Header: React.FC = () => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  return (
    <>
      <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-700/50">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Robo AI <span className="text-gray-400 font-normal">- Dynamic Illustration Generator</span>
            </h1>
          </div>
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Open user guide"
          >
            <HelpCircleIcon className="w-6 h-6" />
          </button>
        </div>
      </header>
      {isHelpModalOpen && <UserGuideModal onClose={() => setIsHelpModalOpen(false)} />}
    </>
  );
};

export default Header;
