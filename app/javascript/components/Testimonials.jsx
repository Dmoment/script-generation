import React, { useEffect, useRef, useState } from 'react';

const testimonialsDefault = [
  {
    quote:
      'My production runs smoother and faster. The AI outline to call sheet flow is a game changer for my team.',
    author: 'Jordan P.',
    title: 'Producer',
  },
  {
    quote:
      'The version comparisons and secure sharing made approvals painless. We shipped on time.',
    author: 'Avery L.',
    title: 'Showrunner',
  },
  {
    quote:
      'Props identification and VFX suggestions saved us days of manual breakdowns.',
    author: 'Sam K.',
    title: 'Line Producer',
  },
];

const Testimonials = ({ items = testimonialsDefault }) => {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef();

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => clearTimeout(timeoutRef.current);
  }, [index, items.length]);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="text-3xl font-semibold text-gray-800">Why teams love Script Generation</h2>
        <div className="relative mx-auto mt-8 rounded-2xl bg-brand-50 p-8 shadow-card" data-reveal>
          {items.map((t, i) => (
            <blockquote
              key={i}
              className={`text-gray-700 transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
            >
              <p className="mx-auto max-w-3xl text-xl leading-relaxed">“{t.quote}”</p>
              <footer className="mt-4 text-sm text-gray-600">{t.author}, {t.title}</footer>
            </blockquote>
          ))}
          <div className="mt-6 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-brand-700' : 'bg-gray-300'}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;


