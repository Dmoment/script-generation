import React from 'react';
import HeroVisual from './HeroVisual';

const Hero = ({ appName }) => {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Write, manage, and produce scripts — faster.
            </h1>
            <p className="mt-4 text-gray-700 text-lg">
              {appName} brings AI-assisted writing, production-grade breakdowns, and collaboration into one streamlined workspace.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a id="get-started" href="#features" className="inline-flex items-center rounded-md bg-brand-600 px-5 py-3 font-medium text-white hover:bg-brand-700 shadow-card">Explore Features</a>
              <a href="#contact" className="inline-flex items-center rounded-md border border-gray-300 px-5 py-3 font-medium text-gray-800 hover:bg-gray-50">Contact Sales</a>
            </div>
          </div>
          <div className="relative">
            <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
              <HeroVisual />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;


