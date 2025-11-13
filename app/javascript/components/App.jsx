import React from 'react';
import AppTsx from './App.tsx';

const App = ({ features = [], appName = 'Script Generation' }) => {
  return <AppTsx features={features} appName={appName} />;
};

export default App;