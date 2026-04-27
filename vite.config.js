import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/test-1/', // ★ここを自分のリポジトリ名に書き換える（前後の / を忘れずに！）
  plugins: [react()],
})
