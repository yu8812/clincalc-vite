import { defineConfig } from 'vite'

export default defineConfig({
  // base 要改成你的 GitHub repo 名稱
  base: '/clincalc-vite/',

  build: {
    outDir: 'dist',
    // 把所有 assets 集中在 assets 資料夾
    assetsDir: 'assets',
    // 關閉 sourcemap（部署用不到）
    sourcemap: false,
    // 輸出 gzip 大小提示
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // 手動分 chunk，讓瀏覽器可以快取計算器獨立更新
        manualChunks: {
          'calculators': [
            './src/calculators/ckd.js',
            './src/calculators/dm.js',
            './src/calculators/cv.js',
            './src/calculators/anemia.js',
            './src/calculators/liver.js',
            './src/calculators/thyroid.js',
            './src/calculators/bone.js',
            './src/calculators/sensitivity.js',
          ],
          'ai': ['./src/modules/ai.js'],
          'doctor': [
            './src/doctor/form.js',
            './src/doctor/drug.js',
            './src/doctor/data.js',
          ],
        }
      }
    }
  },

  // 開發時的 server 設定
  server: {
    port: 5173,
    open: true,
  }
})
