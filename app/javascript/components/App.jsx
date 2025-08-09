import React from 'react';
import Header from './Header';
import Hero from './Hero';
import Features from './Features';
import Cta from './Cta';
import Footer from './Footer';
import LogoStrip from './LogoStrip';
import Testimonials from './Testimonials';
import BackgroundMotif from './BackgroundMotif';
import useReveal from '../utils/useReveal';

const App = (props) => {
  useReveal();
  return (
    <>
      <BackgroundMotif />
      <div className="mx-auto max-w-6xl px-4">
        <Header features={props.features} appName={props.appName} />
      </div>
      <Hero appName={props.appName} />
      <LogoStrip />
      <Features features={props.features} />
      <Testimonials />
      <Cta />
      <div className="mx-auto max-w-6xl px-4">
        <Footer appName={props.appName} />
      </div>
    </>
  );
};

export default App;