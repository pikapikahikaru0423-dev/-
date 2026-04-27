import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx' // 拡張子を明示的に付けると確実です

// もし index.css があるならコメントを外してください。なければこのままでOK！
// import './index.css' 

const rootElement = document.getElementById('root');

// rootElement がある場合のみ実行（JavaScriptの標準的な書き方）
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}