import React from 'react';

const FeatureCard = ({ feature, tone = 'white' }) => (
  <article id={feature.id} className={`group rounded-2xl border border-gray-200 p-6 shadow-sm transition hover:shadow-md animate-fade-in-up ${tone}`} data-reveal>
    <div className="flex items-start gap-4">
      <div className="rounded-md bg-brand-50 p-2 text-brand-600">
        <i className={`bi ${feature.icon} text-xl`}></i>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{feature.title}</h3>
        <p className="mt-1 text-gray-600">{feature.description}</p>
        <div className="mt-4">
          <a href="#" className="text-brand-700 hover:text-brand-800">Learn more →</a>
        </div>
      </div>
    </div>
  </article>
);

const Features = ({ features }) => {
  return (
    <section id="features" className="py-16 md:py-20 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl md:text-3xl font-bold">Everything you need to take a script from idea to set</h2>
        <p className="mt-2 text-gray-700">Modular tools that stay out of your way and speed up collaboration.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(features || []).map((f, idx) => (
            <FeatureCard
              key={f.id}
              feature={f}
              tone={
                [
                  'bg-soft-blue/60',
                  'bg-soft-sand/60',
                  'bg-soft-mint/60',
                  'bg-soft-lavender/60',
                  'bg-soft-mint/60',
                  'bg-soft-blue/60',
                  'bg-soft-sand/60',
                ][idx % 7]
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
