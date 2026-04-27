import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// index.css が見つからないエラーを防ぐため、一旦読み込みを外しました
// import './index.css' 

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}