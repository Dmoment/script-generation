import React from 'react';

// Subtle background curves/dots using SVG with CSS mask for minimal aesthetic
const BackgroundMotif = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* dotted pattern */}
      <svg className="absolute -top-20 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 opacity-[0.25]" viewBox="0 0 1100 700" fill="none">
        <defs>
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#68a88d" />
          </pattern>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1100" height="700" fill="url(#dots)" />
        <rect width="1100" height="700" fill="url(#fade)" />
      </svg>

      {/* curved shape with mask */}
      <svg className="absolute bottom-[-200px] left-1/2 h-[800px] w-[1200px] -translate-x-1/2 opacity-[0.25]" viewBox="0 0 1200 800" fill="none">
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2e9c79" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2e9c79" stopOpacity="0" />
          </radialGradient>
          <mask id="softMask">
            <rect width="1200" height="800" fill="url(#rg)" />
          </mask>
        </defs>
        <g mask="url(#softMask)">
          <path d="M0,600 C300,500 900,700 1200,600 L1200,800 L0,800 Z" fill="#b6dfcf" />
        </g>
      </svg>
    </div>
  );
};

export default BackgroundMotif;


