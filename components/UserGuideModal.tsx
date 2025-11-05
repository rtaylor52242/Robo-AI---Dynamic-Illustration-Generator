
import React from 'react';
import { XCircleIcon } from './icons';

interface UserGuideModalProps {
  onClose: () => void;
}

const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-indigo-400 mb-2 border-b border-indigo-400/20 pb-1">{title}</h3>
      <div className="space-y-3 text-gray-300">{children}</div>
    </div>
  );

  const ListItem: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
      <li>
        <strong className="text-gray-100">{title}:</strong> {children}
      </li>
  );

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-guide-title"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800">
          <h2 id="user-guide-title" className="text-2xl font-semibold text-white">User Guide</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <Section title="Welcome!">
            <p>
              This guide will walk you through using the Dynamic Illustration Generator. This tool is designed to take a single character illustration and generate multiple variations while maintaining a consistent style, brand, and character identity.
            </p>
          </Section>

          <Section title="1. Base Image">
            <p>
              This is the starting point. Upload an image of your character or mascot. For best results, use a high-resolution illustration with a transparent background (PNG).
            </p>
            <p className="text-sm text-amber-300 bg-amber-900/30 p-2 rounded-md">
              <strong>Important:</strong> This tool is designed for illustrated characters, not real-person photos. Uploading photographs of people is not supported and may result in errors.
            </p>
          </Section>

          <Section title="2. Variations">
            <p>
              Tell the AI what changes you want. Each line in the text box represents one new illustration to be generated.
            </p>
             <ul className="list-disc list-inside space-y-2">
                 <ListItem title="Presets">Click the preset buttons (e.g., 'happy grin', 'winking') to quickly add or remove common variations from your list.</ListItem>
                 <ListItem title="Templates">Use the 'Save' button to store your current list of variations and brand colors with a name. 'Load' allows you to retrieve a saved template, and 'Clear' removes all variations from the list. Your current working list is always saved automatically when you close the app.</ListItem>
             </ul>
          </Section>

          <Section title="3. Brand & Style Controls">
            <p>
              This is the most important section for keeping your illustrations consistent and on-brand.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <ListItem title="Primary & Secondary Color">Set your two main brand colors. The AI will prioritize these colors in all generated images.</ListItem>
              <ListItem title="Strict Brand Palette">When ON, the AI is forced to use *only* your brand colors. When OFF, it can use other harmonious colors if necessary for the prompt (e.g., the color of a coffee mug).</ListItem>
              <ListItem title="Consistency Locks">These checkboxes "lock" core attributes of your character. By default, all are checked to ensure the AI doesn't change the character's fundamental appearance (like eye shape or outline style) between variations.</ListItem>
            </ul>
          </Section>
            
           <Section title="4. Prompt Tuning (Advanced)">
            <p>
              Fine-tune the AI's interpretation of your prompts without writing more text.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <ListItem title="Expression Intensity">Controls how strong an emotion is. A low setting for "happy" might be a subtle smile, while a high setting would be an exaggerated, joyful grin.</ListItem>
              <ListItem title="Prop Size">Influences the size of any objects mentioned in the prompt. A low setting for "holding a coffee mug" might create an espresso cup, while a high setting creates a large travel mug.</ListItem>
            </ul>
          </Section>
            
           <Section title="5. Output Area">
            <p>
              After generation, your images appear here. You can manage them in several ways:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <ListItem title="Selection">Click the checkbox on an image to select it for bulk actions.</ListItem>
              <ListItem title="Download">Download selected images or all images as a ZIP file.</ListItem>
              <ListItem title="View Modes">Use the tabs to view your selected images as a Sprite Sheet or an animated GIF, which can also be downloaded.</ListItem>
              <ListItem title="Image Editor">Click on any image to open it in a larger view. From there, you can perform post-production edits like removing the background, adding a text overlay, or adding a colored outline.</ListItem>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModal;
