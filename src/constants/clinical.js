/**
 * CLINICAL_CONSTANTS
 * ─────────────────────────────────────────────────────────────────
 * 所有醫療數值閾值集中在這一個檔案。
 *
 * 好處：
 *   - 當指引更新（例如 ADA 把 HbA1c 診斷標準從 6.5% 降到 6.4%），
 *     只需改這裡，所有計算器自動更新。
 *   - 避免「magic numbers」散落在各個函式裡。
 *   - 方便寫單元測試。
 *
 * 命名規則：
 *   DOMAIN_PARAMETER_CONTEXT
 *   例：CKD_EGFR_G3A = 45  （CKD 領域，eGFR 數值，G3a 分期下限）
 */

// ─── CKD / 腎臟 (KDIGO 2024) ─────────────────────────────────────
export const CKD = {
  EGFR_G1:   90,   // G1: ≥90
  EGFR_G2:   60,   // G2: 60-89
  EGFR_G3A:  45,   // G3a: 45-59
  EGFR_G3B:  30,   // G3b: 30-44
  EGFR_G4:   15,   // G4: 15-29
  // G5: <15

  UACR_A1:   30,   // A1: <30 mg/g (正常)
  UACR_A2:   300,  // A2: 30-299 mg/g (中度)
  // A3: ≥300 mg/g (重度)

  UPCR_THRESHOLD: 150,  // 尿蛋白 UPCR mg/g（CKD 收案門檻）

  // CKD-EPI 2021 係數 (不依種族)
  CKD_EPI_KAPPA_F: 0.7,
  CKD_EPI_KAPPA_M: 0.9,
  CKD_EPI_ALPHA_F: -0.241,
  CKD_EPI_ALPHA_M: -0.302,
  CKD_EPI_FEMALE_MULTIPLIER: 1.012,
}

// ─── 糖尿病 / 血糖 (ADA 2026) ──────────────────────────────────────
export const DM = {
  // 診斷標準
  FPG_DIABETES:    126,   // mg/dL，空腹血糖糖尿病門檻
  FPG_PREDIABETES: 100,   // mg/dL，糖前期（IFG）門檻
  PPG_DIABETES:    200,   // mg/dL，餐後 2 小時血糖
  HBA1C_DIABETES:  6.5,   // %，HbA1c 糖尿病門檻
  HBA1C_PREDIABETES: 5.7, // %，HbA1c 糖前期門檻

  // 治療目標
  HBA1C_TARGET_GENERAL:  7.0,  // %，一般目標
  HBA1C_TARGET_STRICT:   6.5,  // %，嚴格目標（年輕/無低血糖風險）
  HBA1C_TARGET_LENIENT:  8.0,  // %，寬鬆目標（老年/多重共病）
  BP_TARGET_DIABETES:    130,  // mmHg，收縮壓目標

  // HOMA-IR
  HOMA_IR_CUTOFF: 2.5,

  // GMI 換算（連續血糖估算 HbA1c）
  GMI_INTERCEPT: 3.31,
  GMI_SLOPE:     0.02392,
}

// ─── 心血管 / 血脂 (ACC/AHA 2022) ────────────────────────────────
export const CV = {
  // LDL 治療目標
  LDL_HIGH_RISK:        70,   // mg/dL，高風險目標
  LDL_VERY_HIGH_RISK:   55,   // mg/dL，極高風險目標
  LDL_FH_THRESHOLD:     190,  // mg/dL，考慮 FH
  LDL_STATIN_LOW:       130,  // mg/dL，一般起始 Statin 門檻
  LDL_STATIN_HIGH:      160,  // mg/dL，高強度 Statin 門檻

  // ASCVD 10 年風險分層
  ASCVD_BORDERLINE:   7.5,  // %，邊緣風險
  ASCVD_INTERMEDIATE: 10,   // %，中度風險
  ASCVD_HIGH:         20,   // %，高風險

  // PCE 計算年齡限制
  PCE_AGE_MIN: 40,
  PCE_AGE_MAX: 79,

  // TG 警戒值
  TG_ELEVATED:    150,  // mg/dL，偏高
  TG_HIGH:        500,  // mg/dL，胰臟炎風險

  // HDL 低值
  HDL_LOW_MALE:   40,   // mg/dL
  HDL_LOW_FEMALE: 50,   // mg/dL

  // 血壓
  BP_HYPERTENSION_STAGE1: 130, // mmHg SBP
  BP_HYPERTENSION_STAGE2: 140,
  BP_CRISIS:              180,
}

// ─── 代謝症候群 (IDF / 國健署) ─────────────────────────────────────
export const METS = {
  WAIST_MALE:   90,  // cm，亞洲男性腹圍門檻
  WAIST_FEMALE: 80,  // cm，亞洲女性腹圍門檻
  BP_SBP:       130,
  BP_DBP:       85,
  TG:           150,
  HDL_MALE:     40,
  HDL_FEMALE:   50,
  FPG:          100,
  CRITERIA_REQUIRED: 3,  // 至少符合幾項（腰圍必備+3項）
}

// ─── 貧血 (WHO) ──────────────────────────────────────────────────
export const ANEMIA = {
  HB_MALE:       13.0, // g/dL，男性貧血門檻
  HB_FEMALE:     12.0, // g/dL，女性貧血門檻
  HB_PREGNANT:   11.0, // g/dL，孕婦
  MCV_LOW:       80,   // fL，小球性
  MCV_HIGH:      100,  // fL，大球性
  // Mentzer Index < 13 → 地中海型，≥ 13 → 缺鐵
  MENTZER_THALASSEMIA: 13,
}

// ─── 肝功能 (EASL 2023) ──────────────────────────────────────────
export const LIVER = {
  // FIB-4
  FIB4_LOW:  1.30,  // 低纖維化風險
  FIB4_HIGH: 2.67,  // 高纖維化風險（進展期纖維化）
  FIB4_HIGH_ELDER: 2.00, // ≥65 歲高齡調整版

  // APRI
  APRI_F2:  0.5,   // F2+ 纖維化
  APRI_CIR: 1.0,   // 肝硬化

  // AST/ALT 正常上限
  AST_ULN: 40,  // U/L
  ALT_ULN: 40,  // U/L

  // Child-Pugh (分數截點)
  CHILD_A_MAX: 6,
  CHILD_B_MAX: 9,
}

// ─── 甲狀腺 (ATA 2023) ──────────────────────────────────────────
export const THYROID = {
  TSH_LOW:          0.4,   // μIU/mL
  TSH_HIGH:         4.5,   // μIU/mL
  TSH_PREGNANT_T1_LOW:  0.1,
  TSH_PREGNANT_T1_HIGH: 2.5,
  TSH_PREGNANT_T2_HIGH: 3.0,
  TSH_PREGNANT_T3_HIGH: 3.5,
  FT4_LOW:  0.8,  // ng/dL
  FT4_HIGH: 1.8,  // ng/dL
}

// ─── 骨質 / CKD-MBD (KDIGO 2017) ──────────────────────────────
export const BONE = {
  CA_LOW:      8.5,  // mg/dL
  CA_HIGH:    10.2,  // mg/dL
  P_HIGH:      4.5,  // mg/dL（CKD G3+ 目標）
  PTH_LOW:     15,   // pg/mL
  PTH_HIGH:    65,   // pg/mL（正常）
  VITD_DEFICIENT:   20,  // ng/mL，維生素 D 缺乏
  VITD_INSUFFICIENT: 30, // ng/mL，不足
}

// ─── 癌症篩檢閾值 (Taiwan NHI / 衛福部) ──────────────────────────
export const CANCER_SCREENING = {
  PSA_ELEVATED:  4.0,   // ng/mL，PSA 偏高
  CEA_ELEVATED:  5.0,   // ng/mL
  AFP_ELEVATED:  20,    // ng/mL
  CA125_ELEVATED: 35,   // U/mL
  CA199_ELEVATED: 37,   // U/mL

  // 年齡門檻
  COLORECTAL_SCREEN_AGE: 50,
  MAMMOGRAPHY_AGE:       45,
  PAP_SMEAR_AGE:         30,
  PSA_SCREEN_AGE:        50,
}

// ─── 症狀清單 (AI 症狀評估) ──────────────────────────────────────
export const SYMPTOMS = {
  URGENT: ['胸痛','呼吸困難','意識不清','大量出血'],
  ALL: [
    '頭痛','頭暈','胸痛','心悸','呼吸困難','咳嗽','發燒',
    '腹痛','噁心嘔吐','腹瀉','便秘','血尿','水腫','疲勞',
    '體重減輕','口渴多尿','視力模糊','手腳麻木','關節疼痛',
    '皮膚黃染','失眠','頻尿','脫髮','皮疹','頸部僵硬',
    '淋巴結腫大','意識不清','大量出血','盜汗','食慾不振',
    '排便習慣改變','胸悶','背痛','小便顏色異常',
  ],
}
