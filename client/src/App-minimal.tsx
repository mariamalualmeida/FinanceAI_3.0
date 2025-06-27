import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>FinanceAI Test Page</h1>
      <p>If you can see this, React is working correctly.</p>
      <button onClick={() => alert('Button works!')}>Test Button</button>
    </div>
  );
}