import React from 'react';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  imageClassName?: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  image = '/videos/create_header.png',
  imageAlt = 'Header',
  imageClassName = 'h-30 w-auto max-w-[180px] object-cover object-top scale-125',
}) => {
  return (
    <div className="border-b-4 border-black bg-black text-white px-6 py-3 overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 bg-red-500 border border-red-700"></div>
              <div className="h-1.5 w-1.5 bg-yellow-500 border border-yellow-700"></div>
              <div className="h-1.5 w-1.5 bg-green-500 border border-green-700"></div>
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

