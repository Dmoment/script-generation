import { useEffect } from 'react';

// Adds 'reveal-in' class to elements with data-reveal once they enter viewport.
// Supports stagger via data-reveal-delay (ms).
export default function useReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('[data-reveal]'));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = Number(entry.target.getAttribute('data-reveal-delay') || 0);
            setTimeout(() => {
              entry.target.classList.add('reveal-in');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}


