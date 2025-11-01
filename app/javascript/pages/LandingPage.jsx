import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import Cta from '../components/Cta';
import LogoStrip from '../components/LogoStrip';
import BackgroundMotif from '../components/BackgroundMotif';
import useReveal from '../utils/useReveal';

const LandingPage = ({ features, appName }) => {
  useReveal();
  
  return (
    <>
      <BackgroundMotif />
      <Hero appName={appName} />
      <LogoStrip />
      <Features features={features} />
      <Testimonials />
      <Cta />
    </>
  );
};

export default LandingPage;


