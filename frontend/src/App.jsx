import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import RoutesPath from './utils/RoutePath';


function App() {
  return (
    <BrowserRouter>
      <RoutesPath/>
    </BrowserRouter>
  )
}

export default App