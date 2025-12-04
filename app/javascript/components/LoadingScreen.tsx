import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
      <div className="text-center">
        <div 
          className="inline-block h-12 w-12 border-4 border-black border-t-transparent rounded-full mb-4"
          style={{
            animation: 'spin 1s linear infinite',
            WebkitAnimation: 'spin 1s linear infinite'
          }}
        ></div>
        <p className="text-lg font-mono text-gray-700">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

