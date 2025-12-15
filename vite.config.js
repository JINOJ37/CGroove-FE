import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 현재 폴더의 모든 .html 파일을 자동으로 찾는 함수
function getHtmlFiles() {
  const inputs = {}
  fs.readdirSync(__dirname).forEach(file => {
    if (file.endsWith('.html')) {
      const name = file.replace('.html', '')
      inputs[name] = resolve(__dirname, file)
    }
  })
  return inputs
}

export default defineConfig({
  build: {
    rollupOptions: {
      // index.html 뿐만 아니라 login.html 등 모든 파일을 포함시킴!
      input: getHtmlFiles()
    }
  }
})