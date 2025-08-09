import React from 'react';

const Cta = () => {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-700 p-8 text-white shadow-card">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Ready to accelerate your production?</h3>
              <p className="mt-1 text-white/80">Start with AI-assisted script creation and end with auto-generated call sheets.</p>
            </div>
            <div className="flex gap-3">
              <a href="#" className="inline-flex items-center rounded-md bg-white px-5 py-3 font-medium text-brand-700 hover:bg-white/90">Start Free</a>
              <a href="#contact" className="inline-flex items-center rounded-md border border-white/30 px-5 py-3 font-medium hover:bg-white/10">Book a Demo</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;


