
function openAuthModal(tab = 'login') {
  switchAuthTab(tab);
  document.getElementById('modal-auth').classList.add('on');
  setTimeout(() => {
    if (tab === 'login') document.getElementById('login_id')?.focus();
    else document.getElementById('reg_name')?.focus();
  }, 80);
}

function switchAuthTab(tab) {
  ['login', 'register'].forEach(t => {
    document.getElementById('auth-tab-' + t)?.classList.toggle('on', t === tab);
    document.getElementById('auth-pane-' + t)?.classList.toggle('on', t === tab);
  });
}

function doLogin() {
  const id  = document.getElementById('login_id')?.value?.trim();
  const pwd = document.getElementById('login_pwd')?.value;
  const errEl = document.getElementById('login-err');
  if (!id || !pwd) { showAuthError(errEl, '請填寫帳號與密碼'); return; }
  const result = Auth.login(id, pwd);
  if (result.ok) {
    closeModal();
    onLoginSuccess(result.session);
  } else {
    showAuthError(errEl, result.error);
  }
}

function doRegister() {
  const data = {
    name:      document.getElementById('reg_name')?.value?.trim(),
    license:   document.getElementById('reg_license')?.value?.trim(),
    hospital:  document.getElementById('reg_hospital')?.value?.trim(),
    specialty: document.getElementById('reg_specialty')?.value,
    email:     document.getElementById('reg_email')?.value?.trim(),
    pwd:       document.getElementById('reg_pwd')?.value,
  };
  const errEl = document.getElementById('reg-err');
  const result = Auth.register(data);
  if (result.ok) {
    // Auto-login after register
    const loginResult = Auth.login(data.email, data.pwd);
    closeModal();
    if (loginResult.ok) onLoginSuccess(loginResult.session);
    showToast('✓ 註冊成功，歡迎 ' + data.name, 'ok');
  } else {
    showAuthError(errEl, result.error);
  }
}

function doLogout() {
  Auth.logout();
  isDoctor = false;
  onLogout();
  showToast('已登出', 'ok');
  showSec('home');
}

function showAuthError(el, msg) {
  if (!el) return;
  el.style.display = 'flex';
  el.innerHTML = '❌ ' + msg;
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function toggleUserMenu() {
  document.getElementById('user-menu')?.classList.toggle('on');
}
// Close menu when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('#nav-user')) {
    document.getElementById('user-menu')?.classList.remove('on');
  }
});

// Called after successful login
function onLoginSuccess(session) {
  isDoctor = true;
  drDocId = session.userId;

  // Update nav
  document.getElementById('nav-guest').style.display = 'none';
  document.getElementById('nav-user').style.display  = 'block';
  const initials = session.name?.split('').filter((_, i) => i < 2).join('') || 'Dr';
  document.getElementById('nav-avatar-initials').textContent = initials;
  document.getElementById('nav-username').textContent = session.name;
  document.getElementById('menu-fullname').textContent = session.name;
  document.getElementById('menu-hospital').textContent =
    (session.hospital || '') + (session.specialty ? ' · ' + session.specialty : '');

  // Update doctor section badge
  const badge = document.getElementById('dr-user-badge');
  if (badge) badge.textContent = '▸ ' + session.name;

  // Update legacy drBtn
  const drBtn = document.getElementById('drBtn');
  if (drBtn) { drBtn.innerHTML = '<span class="dpulse"></span>醫師模式'; drBtn.classList.add('on'); }

  // Load supabase settings
  loadStoredSB && loadStoredSB();

  // Navigate to doctor portal
  showSec('dr');
  openDrPortalTab('dashboard');
  loadDashboard();
}

function onLogout() {
  document.getElementById('nav-guest').style.display = 'flex';
  document.getElementById('nav-user').style.display  = 'none';
  const drBtn = document.getElementById('drBtn');
  if (drBtn) { drBtn.innerHTML = '🔐 醫師登入'; drBtn.classList.remove('on'); }
  const badge = document.getElementById('dr-user-badge');
  if (badge) badge.textContent = '';
}

// Override the old goDr to use new auth
function goDr() {
  if (!isDoctor) { openAuthModal('login'); }
  else { showSec('dr'); openDrPortalTab('dashboard'); }
}

// On page load — restore session if exists
(function restoreSession() {
  const session = Auth.getSession();
  if (session) {
    isDoctor = true;
    onLoginSuccess(session);
    // Don't auto-navigate to dr section on refresh
    showSec('home');
  }
})();

// ══════════════════════════════════════════════════════════════════
//  DOCTOR PORTAL TABS
// ══════════════════════════════════════════════════════════════════

function openDrPortalTab(tab) {
  const tabs  = ['dashboard', 'form', 'drug', 'stats', 'settings'];
  tabs.forEach(t => {
    document.getElementById('dpt-' + t)?.classList.toggle('on', t === tab);
    document.getElementById('drp-' + t)?.classList.toggle('on', t === tab);
  });
  if (tab === 'stats') refreshStats();
  if (tab === 'dashboard') loadDashboard();
}

// ══════════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════════

function loadDashboard() {
  const records = getAllLocalRecords();
  const n = records.length;

  // ── Stats cards ──
  document.getElementById('dash-n-patients').textContent = n || '0';
  // This month
  const now = new Date();
  const thisMonth = records.filter(r => {
    if (!r.saved_at) return false;
    const d = new Date(r.saved_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  document.getElementById('dash-n-today').textContent = thisMonth;

  // Flags: patients with eGFR < 60 or HbA1c >= 7 or LDL >= 130 and no follow-up note
  const flagged = records.filter(r =>
    (r.egfr_calc && r.egfr_calc < 60) ||
    (r.hba1c && r.hba1c >= 7) ||
    (r.ldl && r.ldl >= 130 && !r.dm)
  ).length;
  document.getElementById('dash-n-flags').textContent = flagged;

  // Drug analysis count
  const drugCount = parseInt(localStorage.getItem('cc_drug_analysis_count') || '0');
  document.getElementById('dash-n-drug').textContent = drugCount;

  // ── Recent patients table ──
  renderRecentPatients(records.slice(0, 8));

  // ── AI reminders (rule-based, fast) ──
  renderReminders(records);

  // ── Missing tests ──
  renderMissingTests(records);

  // ── Drug conflicts summary ──
  renderDrugConflicts();
}

function getAllLocalRecords() {
  try {
    return JSON.parse(localStorage.getItem('cc_drafts') || '[]');
  } catch { return []; }
}

function renderRecentPatients(records) {
  const el = document.getElementById('dash-recent-patients');
  if (!records.length) {
    el.innerHTML = '<div class="no-data-state"><div class="nds-icon">📋</div>尚無記錄，請先儲存受檢者資料</div>';
    return;
  }
  const rows = records.map(r => {
    const ckdClass = r.egfr_calc
      ? r.egfr_calc < 30 ? 'cr' : r.egfr_calc < 60 ? 'ca' : 'ct'
      : '';
    const dmClass = r.hba1c
      ? r.hba1c >= 7 ? 'cr' : r.hba1c >= 6.5 ? 'ca' : 'ct'
      : '';
    const date = r.exam_date || (r.saved_at ? r.saved_at.slice(0,10) : '—');
    return `<tr>
      <td style="color:var(--t1);font-weight:500;">${r.pid || '—'}</td>
      <td>${r.age || '—'}歲 ${r.sex === 'male' ? '男' : r.sex === 'female' ? '女' : ''}</td>
      <td>${date}</td>
      <td>${r.egfr_calc
        ? `<span class="badge ${ckdClass}" style="background:rgba(0,201,167,.1);color:var(--teal);">eGFR ${r.egfr_calc}</span>`
        : '<span style="color:var(--t3);">—</span>'}</td>
      <td>${r.hba1c
        ? `<span class="badge" style="background:rgba(245,158,11,.1);color:var(--amber);">A1c ${r.hba1c}%</span>`
        : '<span style="color:var(--t3);">—</span>'}</td>
      <td>
        <button class="btn bs" style="padding:3px 10px;font-size:10px;"
          onclick="loadDraftToForm(${JSON.stringify(r).replace(/"/g,'&quot;')})">載入</button>
      </td>
    </tr>`;
  }).join('');
  el.innerHTML = `<table class="recent-table">
    <thead><tr>
      <th>受檢者 ID</th><th>年齡/性別</th><th>日期</th>
      <th>eGFR</th><th>HbA1c</th><th>操作</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderReminders(records) {
  const el = document.getElementById('dash-reminders');
  const reminders = [];

  if (!records.length) {
    el.innerHTML = '<div class="al ad" style="font-size:12px;">儲存受檢者記錄後，AI 將自動分析常見缺漏項目。</div>';
    return;
  }

  // Rule 1: CKD patients without UACR
  const ckdNoUacr = records.filter(r => r.egfr_calc && r.egfr_calc < 60 && !r.uacr).length;
  if (ckdNoUacr > 0) reminders.push({
    type: 'warn', icon: '🫘',
    text: `${ckdNoUacr} 位 eGFR<60 受檢者尚未填寫 UACR，KDIGO 建議 CKD 患者每年至少監測一次蛋白尿`
  });

  // Rule 2: DM patients without HbA1c
  const dmNoA1c = records.filter(r => r.dm && !r.hba1c).length;
  if (dmNoA1c > 0) reminders.push({
    type: 'alert', icon: '◈',
    text: `${dmNoA1c} 位糖尿病受檢者未記錄 HbA1c，ADA 2026 建議每 3 個月監測一次`
  });

  // Rule 3: High LDL without statin mention
  const highLdlNoMed = records.filter(r => r.ldl >= 190 && r.meds && !r.meds.match(/statin|atorva|rosuvasta|lovastatin|simvastatin/i)).length;
  if (highLdlNoMed > 0) reminders.push({
    type: 'alert', icon: '◇',
    text: `${highLdlNoMed} 位 LDL ≥190 受檢者用藥中未見 Statin，ACC/AHA 建議考慮 FH 評估及高強度 Statin 治療`
  });

  // Rule 4: Overdue follow-ups (last exam > 6 months ago for high-risk patients)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const overdue = records.filter(r => {
    if (!r.exam_date) return false;
    const examDate = new Date(r.exam_date);
    const isHighRisk = r.egfr_calc < 60 || r.hba1c >= 7 || r.dm || r.htn;
    return isHighRisk && examDate < sixMonthsAgo;
  }).length;
  if (overdue > 0) reminders.push({
    type: 'info', icon: '📅',
    text: `${overdue} 位高風險受檢者超過 6 個月未回診，建議主動聯繫安排追蹤`
  });

  // Rule 5: Elderly without bone density markers
  const elderlyNoBone = records.filter(r => r.age >= 65 && !r.vitd && !r.pth).length;
  if (elderlyNoBone > 0) reminders.push({
    type: 'info', icon: '◫',
    text: `${elderlyNoBone} 位 65 歲以上受檢者未填寫維生素 D / PTH，建議評估骨質疏鬆風險`
  });

  if (!reminders.length) {
    el.innerHTML = '<div class="al ad" style="color:var(--teal);">✓ 目前無特別提醒，資料完整度良好</div>';
    return;
  }

  el.innerHTML = '<div class="reminder-list">' + reminders.map(r =>
    `<div class="reminder-item ri-${r.type}">
      <div class="reminder-dot" style="background:${r.type==='alert'?'var(--rose)':r.type==='warn'?'var(--amber)':'var(--sky)'};"></div>
      <div><span style="font-size:14px;margin-right:6px;">${r.icon}</span>${r.text}</div>
    </div>`
  ).join('') + '</div>';
}

function renderMissingTests(records) {
  const el = document.getElementById('dash-missing-tests');
  if (!records.length) { el.innerHTML = '<div class="no-data-state"><div class="nds-icon">🗂️</div>尚無資料</div>'; return; }

  // Count missing important tests
  const total = records.length;
  const missing = [
    { name: 'UACR（尿蛋白）', count: records.filter(r => !r.uacr).length },
    { name: 'HbA1c', count: records.filter(r => !r.hba1c).length },
    { name: 'LDL 膽固醇', count: records.filter(r => !r.ldl).length },
    { name: 'TSH（甲狀腺）', count: records.filter(r => !r.tsh).length },
    { name: 'Vitamin D', count: records.filter(r => !r.vitd).length },
    { name: '尿酸（UA）', count: records.filter(r => !r.ua).length },
  ].filter(m => m.count > 0).sort((a,b) => b.count - a.count).slice(0, 6);

  if (!missing.length) { el.innerHTML = '<div style="color:var(--teal);font-size:12px;">✓ 所有主要檢測項目均已填寫</div>'; return; }

  el.innerHTML = '<div class="bar-chart">' + missing.map(m => {
    const pct = Math.round(m.count / total * 100);
    return `<div class="bar-row">
      <div class="bar-label">${m.name}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:var(--sky);"></div></div>
      <div class="bar-val">${pct}%</div>
    </div>`;
  }).join('') + '</div>';
}

function renderDrugConflicts() {
  const el = document.getElementById('dash-drug-conflicts');
  const conflicts = JSON.parse(localStorage.getItem('cc_drug_conflicts') || '[]');
  if (!conflicts.length) {
    el.innerHTML = '<div class="no-data-state"><div class="nds-icon">💊</div>尚無統計資料</div>';
    return;
  }
  // Show top 5 most frequent
  const top5 = conflicts.slice(0, 5);
  el.innerHTML = '<div class="bar-chart">' + top5.map(c => {
    return `<div class="bar-row">
      <div class="bar-label" style="font-size:11px;">${c.pair}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${c.pct}%;background:var(--rose);"></div></div>
      <div class="bar-val">${c.count}</div>
    </div>`;
  }).join('') + '</div>';
}

function loadDraftToForm(record) {
  // Switch to form tab first
  openDrPortalTab('form');
  showToast('已載入受檢者資料，可繼續編輯', 'ok');
  // Fill fields
  setTimeout(() => {
    const fieldMap = {
      dr_pid: record.pid, dr_exam: record.exam_date, dr_sex: record.sex,
      dr_ht: record.ht, dr_wt: record.wt, dr_sbp: record.sbp, dr_dbp: record.dbp,
      dr_fpg: record.fpg, dr_hba1c: record.hba1c, dr_ldl: record.ldl,
      dr_hdl: record.hdl, dr_tg: record.tg, dr_tc: record.tc,
      dr_cr: record.cr, dr_uacr: record.uacr, dr_meds: record.meds,
    };
    Object.entries(fieldMap).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    });
  }, 100);
}

// ══════════════════════════════════════════════════════════════════
//  STATISTICS
// ══════════════════════════════════════════════════════════════════

function refreshStats() {
  const records = getAllLocalRecords();
  renderStatsSummaryBar(records);
  renderStatsDiseaseChart(records);
  renderStatsRiskCanvas(records);
  renderStatsDrugChart(records);
  renderStatsMissingChart(records);
  renderStatsEgfrChart(records);
}

function renderStatsSummaryBar(records) {
  const el = document.getElementById('stats-summary-bar');
  const n = records.length;
  const avgAge = n ? Math.round(records.reduce((s,r) => s + (r.age||0), 0) / n) : 0;
  const ckdCount = records.filter(r => r.egfr_calc && r.egfr_calc < 60).length;
  const dmCount  = records.filter(r => r.dm || (r.hba1c && r.hba1c >= 6.5)).length;
  const cvCount  = records.filter(r => r.cvd || r.acs).length;

  el.innerHTML = [
    { n: n,        l: '總受檢人數', c: 'var(--teal)' },
    { n: avgAge||'—', l: '平均年齡', c: 'var(--sky)' },
    { n: ckdCount, l: 'CKD (eGFR<60)', c: 'var(--amber)' },
    { n: dmCount,  l: '糖尿病 / 糖前期', c: 'var(--violet)' },
    { n: cvCount,  l: '心血管病史', c: 'var(--rose)' },
  ].map(s => `<div class="da-stat">
    <div class="da-stat-n" style="color:${s.c};">${s.n}</div>
    <div class="da-stat-l">${s.l}</div>
  </div>`).join('');
}

function renderStatsDiseaseChart(records) {
  const el = document.getElementById('stats-disease-chart');
  if (!records.length) { el.innerHTML = '<div class="no-data-state"><div class="nds-icon">📊</div>尚無資料</div>'; return; }
  const n = records.length;
  const diseases = [
    { name: '高血壓',   count: records.filter(r => r.htn || r.sbp >= 140).length },
    { name: '糖尿病',   count: records.filter(r => r.dm || r.hba1c >= 6.5).length },
    { name: 'CKD',      count: records.filter(r => r.ckd || (r.egfr_calc && r.egfr_calc < 60)).length },
    { name: '高血脂',   count: records.filter(r => r.hl || r.ldl >= 130).length },
    { name: '心血管病', count: records.filter(r => r.cvd || r.acs).length },
    { name: '甲狀腺異常', count: records.filter(r => r.tsh && (r.tsh > 4.5 || r.tsh < 0.4)).length },
  ].sort((a,b) => b.count - a.count);
  const max = diseases[0]?.count || 1;
  el.innerHTML = '<div class="bar-chart">' + diseases.map(d => `
    <div class="bar-row">
      <div class="bar-label">${d.name}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(d.count/max*100)}%;background:var(--teal);"></div></div>
      <div class="bar-val">${d.count}<span style="color:var(--t3);font-size:9px;"> (${Math.round(d.count/n*100)}%)</span></div>
    </div>`).join('') + '</div>';
}

function renderStatsRiskCanvas(records) {
  const canvas = document.getElementById('stats-risk-canvas');
  const legend = document.getElementById('stats-risk-legend');
  if (!canvas || !records.length) return;
  const ctx = canvas.getContext('2d');
  const n = records.length;
  // Classify risk
  const high   = records.filter(r => (r.egfr_calc && r.egfr_calc < 30) || (r.hba1c >= 9) || r.acs || r.cvd).length;
  const medium = records.filter(r => !((r.egfr_calc && r.egfr_calc < 30) || r.hba1c >= 9 || r.acs || r.cvd) && ((r.egfr_calc && r.egfr_calc < 60) || (r.hba1c && r.hba1c >= 7) || r.dm || r.htn)).length;
  const low    = n - high - medium;
  const data   = [high, medium, low];
  const colors = ['#f43f5e', '#f59e0b', '#00c9a7'];
  const labels = ['高風險', '中風險', '低風險 / 正常'];
  // Draw donut
  let angle = -Math.PI / 2;
  const cx = 130, cy = 100, r1 = 80, r2 = 50;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  data.forEach((v, i) => {
    const sweep = (v / (n || 1)) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r1, angle, angle + sweep);
    ctx.arc(cx, cy, r2, angle + sweep, angle, true);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.globalAlpha = 0.85;
    ctx.fill();
    angle += sweep;
  });
  ctx.globalAlpha = 1;
  // Center text
  ctx.fillStyle = '#e8edf8';
  ctx.font = 'bold 20px Syne, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(n, cx, cy + 4);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#8896b0';
  ctx.fillText('總人數', cx, cy + 18);
  // Legend
  if (legend) legend.innerHTML = labels.map((l, i) =>
    `<div class="pie-leg-item"><div class="pie-leg-dot" style="background:${colors[i]};"></div>${l} (${data[i]})</div>`
  ).join('');
}

function renderStatsDrugChart(records) {
  const el = document.getElementById('stats-drug-chart');
  if (!records.length) { el.innerHTML = '<div class="no-data-state"><div class="nds-icon">💊</div>尚無資料</div>'; return; }
  // Count drug frequency from meds strings
  const drugCount = {};
  records.forEach(r => {
    if (!r.meds) return;
    const drugs = r.meds.split(/[,，、;；\s]+/).map(d => d.trim().split(' ')[0]).filter(d => d.length > 3);
    drugs.forEach(d => { drugCount[d] = (drugCount[d] || 0) + 1; });
  });
  const top10 = Object.entries(drugCount).sort((a,b) => b[1] - a[1]).slice(0, 10);
  if (!top10.length) { el.innerHTML = '<div class="no-data-state"><div class="nds-icon">💊</div>尚無藥物記錄</div>'; return; }
  const max = top10[0][1];
  el.innerHTML = '<div class="bar-chart">' + top10.map(([d,c]) => `
    <div class="bar-row">
      <div class="bar-label" style="font-size:11px;">${d}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(c/max*100)}%;background:var(--violet);"></div></div>
      <div class="bar-val">${c}</div>
    </div>`).join('') + '</div>';
}

function renderStatsMissingChart(records) {
  const el = document.getElementById('stats-missing-chart');
  if (!records.length) { el.innerHTML = '<div class="no-data-state"><div class="nds-icon">🔬</div>尚無資料</div>'; return; }
  const total = records.length;
  const tests = [
    { name: 'UACR', count: records.filter(r => !r.uacr).length },
    { name: 'HbA1c', count: records.filter(r => !r.hba1c).length },
    { name: 'Vit D', count: records.filter(r => !r.vitd).length },
    { name: 'TSH', count: records.filter(r => !r.tsh).length },
    { name: 'PSA / CA125', count: records.filter(r => !r.psa && !r.ca125).length },
    { name: '心電圖', count: records.filter(r => !r.ecg || r.ecg === 'not_done').length },
  ].sort((a,b) => b.count - a.count).slice(0, 6);
  const max = tests[0]?.count || 1;
  el.innerHTML = '<div class="bar-chart">' + tests.map(t => `
    <div class="bar-row">
      <div class="bar-label">${t.name}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(t.count/max*100)}%;background:var(--amber);"></div></div>
      <div class="bar-val">${t.count}<span style="color:var(--t3);font-size:9px;"> (${Math.round(t.count/total*100)}%)</span></div>
    </div>`).join('') + '</div>';
}

function renderStatsEgfrChart(records) {
  const el = document.getElementById('stats-egfr-chart');
  const withEgfr = records.filter(r => r.egfr_calc);
  if (!withEgfr.length) { el.innerHTML = '<div class="no-data-state"><div class="nds-icon">🫘</div>尚無 eGFR 資料</div>'; return; }
  const stages = [
    { label: 'G1 ≥90',    count: withEgfr.filter(r => r.egfr_calc >= 90).length, color: 'var(--teal)' },
    { label: 'G2 60-89',  count: withEgfr.filter(r => r.egfr_calc >= 60 && r.egfr_calc < 90).length, color: '#65a30d' },
    { label: 'G3a 45-59', count: withEgfr.filter(r => r.egfr_calc >= 45 && r.egfr_calc < 60).length, color: 'var(--amber)' },
    { label: 'G3b 30-44', count: withEgfr.filter(r => r.egfr_calc >= 30 && r.egfr_calc < 45).length, color: '#ea580c' },
    { label: 'G4 15-29',  count: withEgfr.filter(r => r.egfr_calc >= 15 && r.egfr_calc < 30).length, color: 'var(--rose)' },
    { label: 'G5 <15',    count: withEgfr.filter(r => r.egfr_calc < 15).length, color: '#9f1239' },
  ];
  const max = Math.max(...stages.map(s => s.count)) || 1;
  el.innerHTML = '<div class="bar-chart">' + stages.map(s => `
    <div class="bar-row">
      <div class="bar-label">${s.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(s.count/max*100)}%;background:${s.color};"></div></div>
      <div class="bar-val">${s.count}</div>
    </div>`).join('') + '</div>';
}

function exportStatsCSV() {
  const records = getAllLocalRecords();
  if (!records.length) { showToast('尚無資料可匯出', 'warn'); return; }
  const headers = ['受檢者ID','日期','年齡','性別','eGFR','HbA1c','LDL','BMI','SBP','DBP','用藥','備註'];
  const rows = records.map(r => [
    r.pid||'', r.exam_date||'', r.age||'', r.sex||'',
    r.egfr_calc||'', r.hba1c||'', r.ldl||'', r.bmi||'',
    r.sbp||'', r.dbp||'', (r.meds||'').replace(/,/g,'；'), (r.note||'').replace(/,/g,'；')
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], {type: 'text/csv;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {href: url, download: 'ClinCalc_統計_' + new Date().toISOString().slice(0,10) + '.csv'});
  a.click(); URL.revokeObjectURL(url);
  showToast('✓ CSV 匯出完成', 'ok');
}

// Track drug analysis count for dashboard
const _origRunDrug = window.runDrugAnalysis;
if (typeof runDrugAnalysis === 'function') {
  const origRun = runDrugAnalysis;
  window.runDrugAnalysis = async function() {
    await origRun.apply(this, arguments);
    // Increment counter
    const c = parseInt(localStorage.getItem('cc_drug_analysis_count') || '0') + 1;
    localStorage.setItem('cc_drug_analysis_count', c);
  };
}

