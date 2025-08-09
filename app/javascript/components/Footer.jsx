import React from 'react';

const Footer = ({ appName }) => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 py-10">
      <div className="mx-auto max-w-6xl px-4 text-sm text-gray-600">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-brand-600 text-white text-xs font-bold">SG</span>
            <span>{appName}</span>
          </div>
          <p className="mt-4 md:mt-0">© {year} {appName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


