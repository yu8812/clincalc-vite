# ClinCalc 臨床決策輔助平台 v7

> 整合 ADA 2026、KDIGO 2024 最新醫學指引。支援 Claude / GPT / Gemini AI。完全免費，資料不離開您的裝置。

## 🚀 快速開始（本機開發）

```bash
# 1. 安裝依賴（只需要做一次）
npm install

# 2. 啟動開發伺服器
npm run dev
# → 開啟 http://localhost:5173
```

## 📦 部署到 GitHub Pages

### 一次性設定
1. 把這個資料夾 push 到你的 GitHub repo
2. 開啟 repo 的 **Settings → Pages**
3. Source 選 **GitHub Actions**
4. 修改 `vite.config.js` 的 `base` 為你的 repo 名稱：
   ```js
   base: '/你的repo名稱/',
   ```
5. Push 到 `main` branch → GitHub Actions 自動 build + deploy

### 手動 build
```bash
npm run build
# 輸出到 ./dist/
```

## 📁 專案結構

```
clincalc/
├── index.html               # HTML 骨架（Vite entry）
├── vite.config.js           # Build 設定（改 base！）
├── package.json
├── src/
│   ├── main.js              # 入口點，import 所有模組
│   ├── style.css            # 全域樣式
│   ├── constants/
│   │   └── clinical.js      # ⭐ 所有醫療數值閾值（改指引從這裡改）
│   ├── modules/
│   │   ├── config.js        # ClinCalc.Config（AI 設定、版本）
│   │   ├── ai.js            # ClinCalc.AI（四大 AI 提供商）
│   │   ├── auth.js          # 登入、註冊、Session 管理
│   │   ├── utils.js         # UI 工具（showToast、showSec...）
│   │   ├── deid.js          # 去識別化引擎
│   │   ├── retention.js     # 資料保留設定
│   │   ├── supabase-ai.js   # Supabase Edge Function AI
│   │   ├── ai-symptom.js    # AI 症狀評估（公開）
│   │   └── refs.js          # 醫學指引資料庫
│   ├── calculators/
│   │   ├── ckd.js           # CKD-EPI 2021、KDIGO 分期
│   │   ├── dm.js            # ADA 2026 糖尿病
│   │   ├── cv.js            # PCE ASCVD 心血管風險
│   │   ├── anemia.js        # WHO 貧血分類
│   │   ├── liver.js         # FIB-4、APRI、Child-Pugh
│   │   ├── thyroid.js       # ATA 甲狀腺
│   │   ├── bone.js          # KDIGO CKD-MBD
│   │   └── sensitivity.js   # 靈敏度/特異度
│   └── doctor/
│       ├── form.js          # 健檢表單、judgeDR、健保收案
│       ├── drug.js          # AI 藥物分析
│       └── data.js          # 資料管理、統計、Supabase
└── .github/
    └── workflows/
        └── deploy.yml       # 自動部署到 GitHub Pages
```

## 🔑 AI 設定

| 提供商 | 費用 | 取得方式 |
|--------|------|---------|
| **Gemini 2.0 Flash** | ✅ 免費 | [aistudio.google.com](https://aistudio.google.com) |
| Claude (Anthropic) | 付費 | [console.anthropic.com](https://console.anthropic.com) |
| GPT-4o (OpenAI) | 付費 | [platform.openai.com](https://platform.openai.com) |
| Supabase AI | ✅ 免費 | 需部署 Edge Function |

## 📋 醫學指引版本

- ADA 2026 Standards of Care in Diabetes
- KDIGO 2024 CKD Guidelines  
- ACC/AHA 2022 Cholesterol Guidelines
- EASL 2023 Liver Guidelines
- ATA 2023 Thyroid Guidelines

## ⚖️ 免責聲明

本平台僅供醫療人員臨床參考，不取代臨床判斷，不構成正式醫療診斷或建議。
