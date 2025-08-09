import React from 'react';

const defaultLogos = [
  { name: 'Fountain Life', text: true },
  { name: 'WellcomeMD', text: true },
  { name: 'University Hospitals', text: true },
  { name: 'Parsley Health', text: true },
  { name: 'Aligned', text: true },
];

const LogoStrip = ({ logos = defaultLogos }) => {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 items-center gap-8 opacity-70 sm:grid-cols-3 md:grid-cols-5" data-reveal>
          {logos.map((logo) => (
            <div key={logo.name} className="flex items-center justify-center">
              <div className="h-6 text-gray-500">{logo.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoStrip;


