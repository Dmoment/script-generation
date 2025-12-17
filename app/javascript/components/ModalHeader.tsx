import React from 'react';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  imageClassName?: string;
  onClose?: () => void;
  onMaximize?: () => void;
  onMinimize?: () => void;
  isMaximized?: boolean;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  image = '/videos/create_header.png',
  imageAlt = 'Header',
  imageClassName = 'h-30 w-auto max-w-[180px] object-cover object-top scale-125',
  onClose,
  onMaximize,
  onMinimize,
  isMaximized = false,
}) => {
  return (
    <div className="border-b-4 border-black bg-black text-white px-6 py-3 overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="h-4 w-4 bg-red-500 border border-red-700 hover:bg-red-600 transition-colors rounded-sm flex items-center justify-center group"
                title="Close"
                aria-label="Close"
              >
                <svg className="h-2 w-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Minimize/Maximize Button */}
              {onMaximize && (
                <button
                  onClick={onMaximize}
                  className="h-4 w-4 bg-yellow-500 border border-yellow-700 hover:bg-yellow-600 transition-colors rounded-sm flex items-center justify-center group"
                  title={isMaximized ? "Restore" : "Maximize"}
                  aria-label={isMaximized ? "Restore" : "Maximize"}
                >
                  {isMaximized ? (
                    <svg className="h-2 w-2 text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 01-2 0V4zm14 0a1 1 0 00-1-1h-4a1 1 0 100 2h3v3a1 1 0 102 0V4zM3 16a1 1 0 001 1h4a1 1 0 100-2H5v-3a1 1 0 10-2 0v4zm14 0a1 1 0 01-1 1h-4a1 1 0 110-2h3v-3a1 1 0 112 0v4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-2 w-2 text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" />
                    </svg>
                  )}
                </button>
              )}
              {/* Minimize Button */}
              {onMinimize && (
                <button
                  onClick={onMinimize}
                  className="h-4 w-4 bg-green-500 border border-green-700 hover:bg-green-600 transition-colors rounded-sm flex items-center justify-center group"
                  title="Minimize"
                  aria-label="Minimize"
                >
                  <svg className="h-2 w-2 text-green-900 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              {!onMinimize && (
                <div className="h-4 w-4 bg-green-500 border border-green-700 rounded-sm"></div>
              )}
            </div>
            <h2 className="text-base font-black uppercase tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-[9px] font-mono mt-0.5 text-gray-400 uppercase">
              {subtitle}
            </p>
          )}
        </div>
        {image && (
          <img 
            src={image} 
            alt={imageAlt} 
            className={imageClassName}
            style={{ transformOrigin: 'right center' }}
          />
        )}
      </div>
    </div>
  );
};

export default ModalHeader;

