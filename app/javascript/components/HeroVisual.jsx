import React from 'react';

// Brand-themed abstract visual inspired by film lighting without external assets
const HeroVisual = () => {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 520 380"
        className="w-full h-auto drop-shadow-lg"
        aria-hidden
      >
        <defs>
          <radialGradient id="glow" cx="55%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#b6dfcf" />
            <stop offset="60%" stopColor="#2e9c79" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2e9c79" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#eaf6f1" stopOpacity="0.0" />
            <stop offset="50%" stopColor="#b6dfcf" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2e9c79" stopOpacity="0.0" />
          </linearGradient>
          <clipPath id="roundedBlob">
            <path d="M360,40c50,0,80,40,140,40v180c-60,0-90,40-140,40s-80-40-140-40S100,260,40,260V80c60,0,90-40,140-40s80,40,140,40Z" />
          </clipPath>
        </defs>

        <g clipPath="url(#roundedBlob)">
          <rect x="0" y="0" width="520" height="380" fill="url(#glow)" />
          {/* light beams */}
          <g opacity="0.9">
            <polygon points="-20,170 520,100 520,170 -20,240" fill="url(#beam)" />
            <polygon points="-20,210 520,170 520,230 -20,300" fill="url(#beam)" />
            <polygon points="-20,130 520,60 520,120 -20,200" fill="url(#beam)" />
          </g>

          {/* simple camera silhouette */}
          <g transform="translate(170,160)" fill="#0c3429" opacity="0.85">
            <rect x="0" y="30" width="120" height="55" rx="8" />
            <rect x="110" y="40" width="60" height="36" rx="4" />
            <circle cx="20" cy="20" r="20" />
            <circle cx="60" cy="20" r="20" />
            <rect x="30" y="85" width="14" height="40" rx="3" />
            <rect x="90" y="85" width="14" height="40" rx="3" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default HeroVisual;


