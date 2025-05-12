import React from 'react';
import Register from './components/Register';
import Login from './components/Login';

function App() {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>TechStock</h1>
      <Register />
      <hr />
      <Login />
    </div>
  );
}

export default App;
