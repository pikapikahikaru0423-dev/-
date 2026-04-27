import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages用。自分のPC（ローカル）なら '/'、GitHubなら '/test-1/' に自動切換
  base: process.env.NODE_ENV === 'production' ? '/test-1/' : '/',
})
