
function toggleDaTag(el) {
  el.classList.toggle('dt-selected');
}

/** 從健檢表單的「目前用藥」欄位帶入到藥物分析框 */
function autoFillDaMeds() {
  const meds = document.getElementById('dr_meds')?.value?.trim();
  if (meds) {
    document.getElementById('da_meds').value = meds;
    showToast('✓ 已帶入用藥資料', 'ok');
  } else {
    showToast('請先在上方「目前用藥」欄位填入藥物', 'warn');
  }
}

/** 取得目前選擇的分析重點 tag */
function getSelectedDaFocus() {
  return [...document.querySelectorAll('#da-focus-tags .dt-selected')]
    .map(el => el.dataset.v);
}

/**
 * 主分析流程
 * 
 * 步驟：
 *   1. 收集病患資料（從 getDRData()）+ 用藥 + 主訴
 *   2. 組裝詳細的醫療 prompt（繁體中文）
 *   3. 呼叫目前設定的 AI 提供商（預設 Gemini 免費）
 *   4. 解析 JSON 回應 → renderDrugResult()
 */
async function runDrugAnalysis() {
  const medsRaw = document.getElementById('da_meds')?.value?.trim();
  if (!medsRaw) {
    showToast('請先填入目前用藥清單', 'warn');
    return;
  }

  // ── 收集資料 ─────────────────────────────────────────────
  const d       = getDRData();                    // 從健檢表單取得所有檢驗值
  const chief   = document.getElementById('da_chief')?.value?.trim() || '';
  const focus   = getSelectedDaFocus();           // 使用者選擇的分析重點
  const provider = ClinCalc.Config.ai.provider;  // 目前 AI 提供商

  // 更新 provider 標籤顯示
  const badge = document.getElementById('drug-provider-badge');
  if (badge) {
    const pName = { claude:'Claude', openai:'GPT', gemini:'Gemini ✦免費', supabase:'Supabase AI' };
    badge.textContent = `▸ 使用 ${pName[provider] || provider}`;
  }

  showLoad('AI 藥物分析中...');

  try {
    // ── 組裝 prompt ────────────────────────────────────────
    //  注意：prompt 越詳細，AI 的回答越精準
    //  我們把所有有值的檢驗數據都放進去，讓 AI 做全面評估
    const labValues = [
      d.egfr_calc  ? `eGFR: ${d.egfr_calc} mL/min/1.73m²` : '',
      d.cr         ? `Creatinine: ${d.cr} mg/dL` : '',
      d.bun        ? `BUN: ${d.bun} mg/dL` : '',
      d.ast        ? `AST: ${d.ast} U/L` : '',
      d.alt        ? `ALT: ${d.alt} U/L` : '',
      d.fpg        ? `空腹血糖: ${d.fpg} mg/dL` : '',
      d.hba1c      ? `HbA1c: ${d.hba1c}%` : '',
      d.tc         ? `Total Cholesterol: ${d.tc} mg/dL` : '',
      d.ldl        ? `LDL: ${d.ldl} mg/dL` : '',
      d.hdl        ? `HDL: ${d.hdl} mg/dL` : '',
      d.tg         ? `TG: ${d.tg} mg/dL` : '',
      d.sbp        ? `血壓: ${d.sbp}/${d.dbp || '?'} mmHg` : '',
      d.hb         ? `Hb: ${d.hb} g/dL` : '',
      d.wbc        ? `WBC: ${d.wbc} K/μL` : '',
      d.plt        ? `PLT: ${d.plt} K/μL` : '',
      d.uacr       ? `UACR: ${d.uacr} mg/g` : '',
      d.tsh        ? `TSH: ${d.tsh} μIU/mL` : '',
      d.k          ? `Potassium: ${d.k} mEq/L` : '',
      d.ca         ? `Calcium: ${d.ca} mg/dL` : '',
      d.ua         ? `Uric Acid: ${d.ua} mg/dL` : '',
    ].filter(Boolean).join('\n      ');

    const pmhList = [
      d.dm   ? '第2型糖尿病' : '',
      d.htn  ? '高血壓' : '',
      d.hl   ? '高血脂症' : '',
      d.ckd  ? '慢性腎臟病' : '',
      d.cvd  ? '心血管疾病' : '',
      d.acs  ? '急性冠心症病史' : '',
    ].filter(Boolean).join('、') || d.pmh || '無特殊';

    const focusInstruction = focus.length > 0
      ? `\n\n請特別針對以下重點詳細分析：${focus.map(f => ({
          drug_interaction: '藥物交互作用',
          dose_adjust:      '依腎/肝功能的劑量調整',
          new_drug:         '建議新增藥物',
          stop_drug:        '建議停用或替換的藥物',
          add_tests:        '建議補充的檢測項目',
          diagnosis:        '可能的診斷或鑑別診斷',
        }[f] || f)).join('、')}`
      : '';

    const prompt = `你是台灣資深臨床藥師兼內科醫師，擅長藥物治療管理（MTM）。
請以繁體中文分析以下病患資料，所有建議請標示「AI建議」字樣。

【病患基本資料】
年齡：${d.age || '未知'} 歲，性別：${d.sex === 'male' ? '男' : d.sex === 'female' ? '女' : '未知'}
BMI：${d.bmi || '未填'}，腰圍：${d.waist || '未填'} cm
主訴：${chief || '無'}
過去病史：${pmhList}
過敏史：${d.allergy || '無'}

【目前用藥】
${medsRaw}

【最新檢驗數值】
${labValues || '未提供'}
${focusInstruction}

請以以下 JSON 格式回應（僅回傳 JSON，不要加其他文字）：
{
  "summary": "整體藥物治療評估摘要（2-3行）",
  "risk_level": "low|medium|high",
  "diagnoses": [
    {"name": "可能診斷名稱", "confidence": "high|medium|low", "basis": "根據哪些數值/症狀判斷"}
  ],
  "drug_interactions": [
    {"drugs": ["藥物A", "藥物B"], "severity": "major|moderate|minor", "description": "交互作用說明", "action": "建議處置"}
  ],
  "dose_adjustments": [
    {"drug": "藥物名稱", "issue": "問題說明（如：eGFR 45，需減量）", "suggestion": "建議調整方案"}
  ],
  "add_drugs": [
    {"drug": "建議用藥", "indication": "適應症", "reason": "加藥理由", "note": "注意事項"}
  ],
  "stop_drugs": [
    {"drug": "建議停用藥物", "reason": "停用原因", "alternative": "可替代藥物（若有）"}
  ],
  "add_tests": [
    {"test": "建議檢測項目", "reason": "為何需要此項目", "frequency": "建議頻率"}
  ],
  "urgent_flags": ["緊急警示（若有危及安全的情況）"],
  "follow_up": "整體追蹤建議"
}`;

    // ── 呼叫 AI ─────────────────────────────────────────────
    // callClaude() 已在舊程式碼中封裝，內部會根據 Config.ai.provider
    // 自動選擇 Claude / OpenAI / Gemini / Supabase
    const raw = await callClaude(null, prompt, 2000);

    // ── 解析 JSON ────────────────────────────────────────────
    const result = parseJ(raw);
    if (result) {
      renderDrugResult(result, medsRaw);
    } else {
      document.getElementById('da-result').style.display = 'block';
      document.getElementById('da-result').innerHTML =
        `<div class="al ar">⚠️ AI 回應解析失敗，請再試一次。<br><pre style="font-size:11px;color:var(--t3);margin-top:8px;white-space:pre-wrap;">${raw.slice(0, 500)}</pre></div>`;
    }
  } catch(e) {
    showToast('分析失敗：' + e.message, 'err');
  } finally {
    hideLoad();
  }
}

/**
 * 解析 AI 回傳的 JSON 並渲染成可讀的 HTML
 *
 * 渲染區塊順序：
 *   1. 摘要 + 風險等級
 *   2. 可能診斷
 *   3. 藥物交互作用（危險程度排序）
 *   4. 劑量調整建議
 *   5. 建議新增藥物
 *   6. 建議停用/替換
 *   7. 建議補充檢測
 *   8. 追蹤建議
 */
function renderDrugResult(j, medsRaw) {
  const el = document.getElementById('da-result');
  el.style.display = 'block';

  // 風險等級顏色映射
  const riskColor = { low: 'var(--teal)', medium: 'var(--amber)', high: 'var(--rose)' };
  const riskLabel = { low: '低風險', medium: '中度風險', high: '高風險' };
  const sevLabel  = { major: '重大', moderate: '中等', minor: '輕微' };
  const sevClass  = { major: 'da-bd-high', moderate: 'da-bd-med', minor: 'da-bd-low' };
  const confLabel = { high: '可能性高', medium: '可能性中', low: '可能性低' };
  const confClass = { high: 'da-bd-high', medium: 'da-bd-med', low: 'da-bd-low' };

  let html = '';

  // ── 摘要列 ─────────────────────────────────────────────────
  const risk  = j.risk_level || 'medium';
  const nInt  = (j.drug_interactions || []).length;
  const nAdj  = (j.dose_adjustments || []).length;
  const nAdd  = (j.add_drugs || []).length;
  const nTest = (j.add_tests || []).length;

  html += `<div class="da-summary-bar">
    <div class="da-stat">
      <div class="da-stat-n" style="color:${riskColor[risk]};">${riskLabel[risk]}</div>
      <div class="da-stat-l">整體風險評估</div>
    </div>
    <div class="da-stat">
      <div class="da-stat-n" style="color:${nInt>0?'var(--rose)':'var(--teal)'}">${nInt}</div>
      <div class="da-stat-l">交互作用</div>
    </div>
    <div class="da-stat">
      <div class="da-stat-n" style="color:${nAdj>0?'var(--amber)':'var(--teal)'}">${nAdj}</div>
      <div class="da-stat-l">劑量調整</div>
    </div>
    <div class="da-stat">
      <div class="da-stat-n" style="color:var(--sky)">${nAdd}</div>
      <div class="da-stat-l">建議加藥</div>
    </div>
    <div class="da-stat">
      <div class="da-stat-n" style="color:var(--violet)">${nTest}</div>
      <div class="da-stat-l">建議檢測</div>
    </div>
  </div>`;

  // ── 緊急警示 ───────────────────────────────────────────────
  if (j.urgent_flags?.length) {
    j.urgent_flags.forEach(f => {
      html += `<div class="al ar" style="margin-bottom:10px;">⚠️ AI 建議緊急處理：${f}</div>`;
    });
  }

  // ── AI 建議聲明 ────────────────────────────────────────────
  html += `<div class="al ai" style="font-size:11.5px;margin-bottom:12px;">
    🤖 以下為 AI 建議，僅供醫師臨床參考，不取代專業判斷。所有處方變更請由主治醫師評估後執行。
  </div>`;

  // ── 整體評估摘要 ───────────────────────────────────────────
  if (j.summary) {
    html += `<div class="da-section">
      <div class="da-section-head">整體評估摘要（AI建議）</div>
      <div style="font-size:13px;color:var(--t1);line-height:1.8;">${j.summary}</div>
    </div>`;
  }

  // ── 可能診斷 ───────────────────────────────────────────────
  if (j.diagnoses?.length) {
    html += `<div class="da-section">
      <div class="da-section-head">📋 可能診斷（AI建議）</div>`;
    j.diagnoses.forEach(dx => {
      html += `<div class="da-item">
        <span class="da-badge ${confClass[dx.confidence] || 'da-bd-med'}">${confLabel[dx.confidence] || dx.confidence}</span>
        <div>
          <div style="font-weight:600;color:var(--t1);">${dx.name}</div>
          <div style="font-size:12px;color:var(--t2);margin-top:3px;">依據：${dx.basis}</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── 藥物交互作用 ───────────────────────────────────────────
  if (j.drug_interactions?.length) {
    // 按嚴重程度排序（major 先）
    const sorted = [...j.drug_interactions].sort((a,b) => {
      const order = { major:0, moderate:1, minor:2 };
      return (order[a.severity]||1) - (order[b.severity]||1);
    });
    html += `<div class="da-section">
      <div class="da-section-head">⚡ 藥物交互作用（AI建議）</div>`;
    sorted.forEach(int => {
      html += `<div class="da-drug-int">
        <div class="da-drug-int-title">
          <span class="da-badge ${sevClass[int.severity] || 'da-bd-med'}" style="margin-right:8px;">${sevLabel[int.severity] || int.severity}</span>
          ${(int.drugs || []).join(' ＋ ')}
        </div>
        <div class="da-drug-int-body">
          <div style="margin-bottom:4px;">${int.description}</div>
          <div style="color:var(--amber);">▸ 處置：${int.action}</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── 劑量調整建議 ───────────────────────────────────────────
  if (j.dose_adjustments?.length) {
    html += `<div class="da-section">
      <div class="da-section-head">🧪 腎/肝功能劑量調整（AI建議）</div>`;
    j.dose_adjustments.forEach(adj => {
      html += `<div class="da-item">
        <span class="da-badge da-bd-med">調整</span>
        <div>
          <div style="font-weight:600;color:var(--t1);">${adj.drug}</div>
          <div style="font-size:12px;color:var(--rose);margin-top:2px;">問題：${adj.issue}</div>
          <div style="font-size:12px;color:var(--teal);margin-top:2px;">▸ ${adj.suggestion}</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── 建議新增藥物 ───────────────────────────────────────────
  if (j.add_drugs?.length) {
    html += `<div class="da-section">
      <div class="da-section-head">💊 建議新增藥物（AI建議）</div>`;
    j.add_drugs.forEach(drug => {
      html += `<div class="da-item">
        <span class="da-badge da-bd-drug">加藥</span>
        <div>
          <div style="font-weight:600;color:var(--sky);">${drug.drug}</div>
          <div style="font-size:12px;color:var(--t2);margin-top:2px;">
            適應症：${drug.indication} ｜ 理由：${drug.reason}
          </div>
          ${drug.note ? `<div style="font-size:11.5px;color:var(--amber);margin-top:2px;">⚠ ${drug.note}</div>` : ''}
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── 建議停用/替換 ──────────────────────────────────────────
  if (j.stop_drugs?.length) {
    html += `<div class="da-section">
      <div class="da-section-head">🚫 建議停用 / 替換（AI建議）</div>`;
    j.stop_drugs.forEach(drug => {
      html += `<div class="da-item">
        <span class="da-badge da-bd-warn">停用</span>
        <div>
          <div style="font-weight:600;color:var(--rose);">${drug.drug}</div>
          <div style="font-size:12px;color:var(--t2);margin-top:2px;">原因：${drug.reason}</div>
          ${drug.alternative ? `<div style="font-size:12px;color:var(--teal);margin-top:2px;">▸ 替代方案：${drug.alternative}</div>` : ''}
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── 建議補充檢測 ───────────────────────────────────────────
  if (j.add_tests?.length) {
    html += `<div class="da-section">
      <div class="da-section-head">🔬 建議補充檢測（AI建議）</div>`;
    j.add_tests.forEach(test => {
      html += `<div class="da-item">
        <span class="da-badge da-bd-test">檢測</span>
        <div>
          <div style="font-weight:600;color:var(--violet);">${test.test}</div>
          <div style="font-size:12px;color:var(--t2);margin-top:2px;">
            原因：${test.reason}
            ${test.frequency ? ` ｜ 建議頻率：${test.frequency}` : ''}
          </div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── 追蹤建議 ───────────────────────────────────────────────
  if (j.follow_up) {
    html += `<div class="da-section" style="border-color:rgba(0,201,167,.2);">
      <div class="da-section-head" style="color:var(--teal);">📅 追蹤建議（AI建議）</div>
      <div style="font-size:13px;color:var(--t1);line-height:1.8;">${j.follow_up}</div>
    </div>`;
  }

  // ── 免責聲明 ───────────────────────────────────────────────
  html += `<div class="dis" style="margin-top:12px;">
    ⚠️ 以上藥物分析由 AI 依輸入資料自動產生，僅供醫療人員臨床參考。
    所有藥物調整、新增或停用，請由主治醫師評估後執行，並參照最新藥品仿單及健保用藥規範。
    本分析不構成正式醫療建議。
  </div>`;

  el.innerHTML = html;

  // 平滑滾動到結果區
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** 清除藥物分析結果 */
function clearDrugAnalysis() {
  const el = document.getElementById('da-result');
  el.style.display = 'none';
  el.innerHTML = '';
  document.getElementById('da_meds').value = '';
  document.getElementById('da_chief').value = '';
  // 取消所有快選 tag
  document.querySelectorAll('#da-focus-tags .dt-selected').forEach(t => t.classList.remove('dt-selected'));
  showToast('已清除分析結果', 'ok');
}

// 頁面載入完成後更新 provider badge
document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('drug-provider-badge');
  if (badge) {
    const p = ClinCalc.Config?.ai?.provider || 'gemini';
    const pName = { claude:'Claude', openai:'GPT-4o', gemini:'Gemini 2.0 Flash ✦免費', supabase:'Supabase AI' };
    badge.textContent = `▸ 使用 ${pName[p] || p}`;
  }
});



// ══════════════════════════════════════════════════════════════════
//  AUTH SYSTEM
//  架構：localStorage 模擬模式（未來換成真實後端只需改 4 個函式）
//
//  資料格式 cc_users:
//    [{id, name, email, license, hospital, specialty, passwordHash, createdAt}]
//  資料格式 cc_session:
//    {userId, name, email, hospital, specialty, loggedInAt}
// ══════════════════════════════════════════════════════════════════

const Auth = {
  // 取得所有本機使用者
  getUsers() {
    try { return JSON.parse(localStorage.getItem('cc_users') || '[]'); }
    catch { return []; }
  },

  // 儲存使用者列表
  saveUsers(users) {
    localStorage.setItem('cc_users', JSON.stringify(users));
  },

  // 取得目前 session
  getSession() {
    try { return JSON.parse(localStorage.getItem('cc_session') || 'null'); }
    catch { return null; }
  },

  // 簡易 hash（不是加密，只是不明碼儲存）
  // 正式版請換成 bcrypt 或伺服器驗證
  hashPwd(pwd) {
    let h = 0;
    for (let i = 0; i < pwd.length; i++) {
      h = ((h << 5) - h) + pwd.charCodeAt(i);
      h |= 0;
    }
    return 'h' + Math.abs(h).toString(36) + pwd.length;
  },

  // 登入驗證（支援舊密碼 doctor2024 向下相容）
  login(idOrEmail, pwd) {
    // Legacy demo account
    if ((idOrEmail === 'demo' || idOrEmail === 'doctor2024') && pwd === 'doctor2024') {
      const session = {
        userId: 'demo', name: '示範醫師', email: 'demo@clincalc.tw',
        hospital: '示範醫院', specialty: '家庭醫學科',
        loggedInAt: new Date().toISOString(), isDemo: true
      };
      localStorage.setItem('cc_session', JSON.stringify(session));
      return { ok: true, session };
    }
    const users = this.getUsers();
    const user = users.find(u => u.email === idOrEmail || u.id === idOrEmail);
    if (!user) return { ok: false, error: '找不到此帳號' };
    if (user.passwordHash !== this.hashPwd(pwd)) return { ok: false, error: '密碼錯誤' };
    const session = {
      userId: user.id, name: user.name, email: user.email,
      hospital: user.hospital, specialty: user.specialty,
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem('cc_session', JSON.stringify(session));
    return { ok: true, session };
  },

  // 註冊新醫師
  register(data) {
    if (!data.name || !data.email || !data.license || !data.pwd) {
      return { ok: false, error: '請填寫所有必填欄位（*）' };
    }
    if (data.pwd.length < 8) return { ok: false, error: '密碼至少需要 8 個字元' };
    const users = this.getUsers();
    if (users.find(u => u.email === data.email)) {
      return { ok: false, error: '此 Email 已經註冊過' };
    }
    const newUser = {
      id: 'dr_' + Date.now().toString(36),
      name: data.name, email: data.email,
      license: data.license, hospital: data.hospital || '',
      specialty: data.specialty || '',
      passwordHash: this.hashPwd(data.pwd),
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return { ok: true, user: newUser };
  },

  // 登出
  logout() {
    localStorage.removeItem('cc_session');
  },

  // 取得目前登入使用者（null = 未登入）
  currentUser() { return this.getSession(); }
};

// ── UI helpers ──────────────────────────────────────────────────
