/**
 * ClinCalc v7 — main.js
 * ─────────────────────────────────────────────────────────────────
 * 這是 Vite 的入口點。
 * 瀏覽器只載入這一個檔案，Vite 會在 build 時自動處理所有 import。
 *
 * 載入順序很重要：
 *   1. CSS（全域樣式）
 *   2. 基礎模組（Config、工具函式）
 *   3. AI 模組
 *   4. 計算器
 *   5. 醫師專區
 *   6. Auth / UI 互動
 */

// ── 1. 樣式 ──────────────────────────────────────────────────────
import './style.css'

// ── 2. 全域 ClinCalc namespace 初始化 ────────────────────────────
// 注意：原始碼使用 window.ClinCalc = {} 的全域物件模式
// 這裡維持相同結構，讓所有模組可以互相存取
window.ClinCalc = window.ClinCalc || {}

// ── 3. 基礎模組（其他模組依賴這些）──────────────────────────────
import './modules/config.js'
import './modules/utils.js'
import './modules/deid.js'
import './modules/retention.js'
import './modules/supabase-ai.js'

// ── 4. AI 模組 ────────────────────────────────────────────────────
import './modules/ai.js'
import './modules/ai-symptom.js'

// ── 5. 計算器（各自獨立，無相依性）──────────────────────────────
import './calculators/ckd.js'
import './calculators/dm.js'
import './calculators/cv.js'
import './calculators/anemia.js'
import './calculators/liver.js'
import './calculators/thyroid.js'
import './calculators/bone.js'
import './calculators/sensitivity.js'

// ── 6. 醫師專區 ──────────────────────────────────────────────────
import './doctor/form.js'
import './doctor/drug.js'
import './doctor/data.js'

// ── 7. Auth + Dashboard + Stats ──────────────────────────────────
import './modules/auth.js'

// ── 8. 資料管理（REFS、設定）────────────────────────────────────
import './modules/refs.js'
