import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);
  
  const child = React.Children.only(children);
  
  const triggerProps = {
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
  };

  return (
    <div className="relative flex items-center">
      {React.cloneElement(child, triggerProps)}
      {isVisible && (
        <div 
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 z-20
                     bg-gray-900 text-gray-200 text-xs rounded-lg py-2 px-3 shadow-lg border border-gray-700"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                        border-x-4 border-x-transparent
                        border-t-4 border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
