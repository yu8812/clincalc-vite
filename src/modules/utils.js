// ─── MODULE: UI Helpers ─────────────────────────────────────────
ClinCalc.UI = {
  // Render AI provider selector badge
  renderProviderBadge(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const p = ClinCalc.Config.ai.provider;
    const info = ClinCalc.AI.getProviderInfo(p);
    el.innerHTML = `<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;
      border-radius:100px;font-family:var(--ff-m);font-size:10px;
      background:rgba(0,0,0,.3);border:1px solid;border-color:${info.color}33;color:${info.color};">
      ${info.icon} ${info.name} · ${info.model}
    </div>`;
  },

  // Render retention status pill
  renderRetentionPill(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const s = ClinCalc.Retention.formatStatus();
    el.innerHTML = `<span style="font-family:var(--ff-m);font-size:10px;color:var(--amber);">
      🗑️ 資料保留：${s.days}天 · 自動刪除：${s.autoDelete?'✓':'✗'}
      ${s.expiringSoon > 0 ? `· ⚠️ ${s.expiringSoon}筆即將過期` : ''}
    </span>`;
  }
};

// ─── Initialize App ──────────────────────────────────────────────
window.CC = ClinCalc; // shorthand


// ─── NAV ───
function showSec(id){
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.ntab').forEach(t=>t.classList.remove('on'));
  const s=document.getElementById('s-'+id);if(s){s.classList.add('on');window.scrollTo(0,0);}
  document.querySelectorAll('.ntab').forEach(t=>{if((t.getAttribute('onclick')||'').includes("'"+id+"'"))t.classList.add('on');});
}
/* goDr() — superseded by Auth module */
function showCalc(id){
  showSec('calc');
  document.querySelectorAll('.cp').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.ctab').forEach(t=>t.classList.remove('on'));
  const p=document.getElementById('cp-'+id);if(p)p.classList.add('on');
  document.querySelectorAll('.ctab').forEach(t=>{if((t.getAttribute('onclick')||'').includes("'"+id+"'"))t.classList.add('on');});
}
function showDRTab(id){
  const tabOrder=['api','supabase','privacy'];
  document.querySelectorAll('#s-dr .dbtab').forEach((t,i)=>{t.classList.toggle('on',tabOrder[i]===id);});
  document.querySelectorAll('#s-dr .dbp:not([id^="dbt"])').forEach(p=>p.classList.remove('on'));
  const p=document.getElementById('drt-'+id);if(p){p.classList.add('on');}
  if(id==='api') setTimeout(renderProviderUI, 50);
  if(id==='privacy') setTimeout(initPrivacyTab, 50);
}

// ─── PROVIDER UI ───────────────────────────────────────────────
function selectProvider(prov){
  ClinCalc.Config.ai.provider = prov;
  renderProviderUI();
  ClinCalc.UI.renderProviderBadge('provider-badge-dr');
}

function renderProviderUI(){
  const p = ClinCalc.Config.ai.provider;
  ['claude','openai','gemini','supabase'].forEach(id=>{
    const el = document.getElementById('pc-'+id);
    if(el) el.classList.toggle('active', id===p);
  });
  const fieldsDiv = document.getElementById('provider-fields');
  if(!fieldsDiv) return;
  const info = ClinCalc.AI.getProviderInfo(p);
  const templates = {
    claude: `<div class="pf-section"><div class="pf-label">Anthropic Claude 設定</div>
      <div class="g2">
        <div class="fg"><label class="fl">API Key</label>
          <input type="password" class="fi" id="key_claude" placeholder="sk-ant-..." value="${ClinCalc.Config.ai.claudeKey}">
          <div class="hint">取得：<a href="https://console.anthropic.com/settings/keys" target="_blank" style="color:var(--teal);">console.anthropic.com</a>｜免費 5$/月額度</div></div>
        <div class="fg"><label class="fl">模型</label>
          <select class="fsel" id="model_claude">
            <option value="claude-haiku-4-5-20251001" ${ClinCalc.Config.ai.claudeModel==='claude-haiku-4-5-20251001'?'selected':''}>Claude Haiku 4.5（速度快、費用低）</option>
            <option value="claude-sonnet-4-20250514" ${ClinCalc.Config.ai.claudeModel==='claude-sonnet-4-20250514'?'selected':''}>Claude Sonnet 4（智能強）</option>
          </select></div>
      </div></div>`,
    openai: `<div class="pf-section"><div class="pf-label">OpenAI GPT 設定</div>
      <div class="g2">
        <div class="fg"><label class="fl">API Key</label>
          <input type="password" class="fi" id="key_openai" placeholder="sk-..." value="${ClinCalc.Config.ai.openaiKey}">
          <div class="hint">取得：<a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--teal);">platform.openai.com</a>｜需綁定信用卡</div></div>
        <div class="fg"><label class="fl">模型</label>
          <select class="fsel" id="model_openai">
            <option value="gpt-4o-mini" ${ClinCalc.Config.ai.openaiModel==='gpt-4o-mini'?'selected':''}>GPT-4o-mini（費用低、速度快）</option>
            <option value="gpt-4o" ${ClinCalc.Config.ai.openaiModel==='gpt-4o'?'selected':''}>GPT-4o（最高智能）</option>
            <option value="gpt-3.5-turbo" ${ClinCalc.Config.ai.openaiModel==='gpt-3.5-turbo'?'selected':''}>GPT-3.5 Turbo（最便宜）</option>
          </select></div>
      </div></div>`,
    gemini: `<div class="pf-section"><div class="pf-label">Google Gemini 設定（AI Studio）</div>
      <div class="g2">
        <div class="fg"><label class="fl">API Key</label>
          <input type="password" class="fi" id="key_gemini" placeholder="AIza..." value="${ClinCalc.Config.ai.geminiKey}">
          <div class="hint">取得：<a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--teal);">aistudio.google.com</a>｜免費 60 req/min</div></div>
        <div class="fg"><label class="fl">模型</label>
          <select class="fsel" id="model_gemini">
            <option value="gemini-1.5-flash">Gemini 1.5 Flash（免費、速度快）</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro（更強，有用量限制）</option>
            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp（最新實驗版）</option>
          </select></div>
      </div>
      <div class="al ag" style="margin-top:8px;">✅ Gemini 1.5 Flash 完全免費：每分鐘 15 次、每日 1,500 次。</div></div>`,
    supabase: `<div class="pf-section"><div class="pf-label">Supabase AI（免費 Edge Function + Groq Llama）</div>
      <div class="al ai" style="margin-bottom:10px;">⚙️ 需先完成「隱私設定」頁籤中的 Edge Function 部署，並在 Supabase Secrets 設定 GROQ_API_KEY。</div>
      <div class="al ag">✅ 完全免費：Groq 免費方案 / Llama 3.1 8B。資料不離開您的 Supabase 環境。</div></div>`,
  };
  fieldsDiv.innerHTML = templates[p] || templates.claude;
}

function saveAllProviderSettings(){
  const p = ClinCalc.Config.ai.provider;
  const claudeKeyEl = document.getElementById('key_claude');
  const openaiKeyEl = document.getElementById('key_openai');
  const geminiKeyEl = document.getElementById('key_gemini');
  if(claudeKeyEl?.value){ClinCalc.Config.ai.claudeKey=claudeKeyEl.value;localStorage.setItem('cc_key',claudeKeyEl.value);document.getElementById('dr_api').value=claudeKeyEl.value;const ak=document.getElementById('ai_key');if(ak)ak.value=claudeKeyEl.value;}
  if(openaiKeyEl?.value){ClinCalc.Config.ai.openaiKey=openaiKeyEl.value;localStorage.setItem('cc_openai_key',openaiKeyEl.value);}
  if(geminiKeyEl?.value){ClinCalc.Config.ai.geminiKey=geminiKeyEl.value;localStorage.setItem('cc_gemini_key',geminiKeyEl.value);
    const geminiModelEl = document.getElementById('gemini_model');
    if (geminiModelEl) {
      ClinCalc.Config.ai.geminiModel = geminiModelEl.value;
      localStorage.setItem('cc_gemini_model', geminiModelEl.value);
    }}
  const modelEl=document.getElementById('model_'+p);
  if(modelEl){if(p==='claude')ClinCalc.Config.ai.claudeModel=modelEl.value;if(p==='openai')ClinCalc.Config.ai.openaiModel=modelEl.value;}
  ClinCalc.Config.save();
  ClinCalc.UI.renderProviderBadge('provider-badge-dr');
  // 同步更新藥物分析的 provider 標籤
  const drugBadge = document.getElementById('drug-provider-badge');
  if (drugBadge) {
    const pName = { claude:'Claude', openai:'GPT-4o', gemini:'Gemini 2.0 Flash ✦免費', supabase:'Supabase AI' };
    drugBadge.textContent = '▸ 使用 ' + (pName[p] || p);
  }
  showToast('✓ AI 設定已儲存', 'ok');
}

async function testCurrentProvider(){
  const p=ClinCalc.Config.ai.provider;
  const statusEl=document.getElementById('provider-test-status');
  statusEl.innerHTML=`<div class="al ai">⏳ 測試 ${ClinCalc.AI.getProviderInfo(p).name}...</div>`;
  const keyEl=document.getElementById('key_'+p);
  const key=keyEl?keyEl.value:ClinCalc.Config.ai[p+'Key']||'';
  const result=await ClinCalc.AI.test(p,key);
  if(result.ok){
    statusEl.innerHTML=`<div class="al ag">✅ ${ClinCalc.AI.getProviderInfo(p).name} 連線成功！AI 功能已可用。</div>`;
    if(p==='claude')setAILocked(false);
  }else{statusEl.innerHTML=`<div class="al ar">❌ ${result.error}</div>`;}
}

// ─── PRIVACY TAB ───────────────────────────────────────────────
function initPrivacyTab(){
  const daysEl=document.getElementById('retention_days');
  if(daysEl)daysEl.value=ClinCalc.Config.retention.days;
  const actionEl=document.getElementById('retention_action');
  if(actionEl)actionEl.value=ClinCalc.Config.retention.autoDelete?'auto_delete':'notify';
  const codeEl=document.getElementById('edge-fn-code');
  if(codeEl)codeEl.textContent=ClinCalc.SupabaseAI.getEdgeFunctionCode();
  updateRetentionPreview();
}

function updateRetentionPreview(){
  const days=parseInt(document.getElementById('retention_days')?.value||365);
  const action=document.getElementById('retention_action')?.value||'auto_delete';
  const expiry=new Date();expiry.setDate(expiry.getDate()+days);
  const el=document.getElementById('retention-preview');
  if(el)el.innerHTML=`ℹ️ 今日起新增的記錄將於 <strong>${expiry.toLocaleDateString('zh-TW')}</strong>（${days}天後）${action==='auto_delete'?'自動刪除':action==='notify'?'發出到期提醒':'封存'}。`;
}

function saveRetentionSettings(){
  const days=parseInt(document.getElementById('retention_days')?.value||365);
  const action=document.getElementById('retention_action')?.value||'auto_delete';
  if(days<30||days>3650){showToast('保留天數需在 30-3650 天之間');return;}
  ClinCalc.Config.retention.days=days;
  ClinCalc.Config.retention.autoDelete=action==='auto_delete';
  ClinCalc.Config.save();
  showToast(`✓ 已設定：資料保留 ${days} 天`, 'ok');
}

function runLocalPurge(){
  if(!confirm('確定要刪除本機所有過期記錄？此操作不可復原。'))return;
  const result=ClinCalc.Retention.purgeLocalDrafts();
  const el=document.getElementById('retention-purge-result');
  if(el)el.innerHTML=`<div class="al ag">🧹 清理完成：刪除 ${result.deleted} 筆，剩餘 ${result.after} 筆有效記錄。</div>`;
}

function showRetentionSQL(){
  const sql=ClinCalc.Retention.buildSupabaseCleanupSQL();
  document.getElementById('detail-content').innerHTML=`<div style="font-family:var(--ff-h);font-size:18px;font-weight:700;margin-bottom:12px;">Supabase 資料保留清理 SQL</div>
    <div class="al ay" style="margin-bottom:12px;">⚠️ 請在 Supabase SQL Editor 執行，或設定 pg_cron 定時自動執行。</div>
    <pre style="font-family:var(--ff-m);font-size:11px;color:#a5f3fc;background:var(--c0);padding:14px;border-radius:8px;overflow:auto;line-height:1.65;">${sql}</pre>
    <button class="btn bs" style="margin-top:12px;" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(sql)}')).then(()=>showToast('✓ 已複製', 'ok'))">複製 SQL</button>`;
  document.getElementById('modal-detail').classList.add('on');
}

function runDeIDPreview(){
  const input=document.getElementById('audit_input')?.value;
  if(!input){showToast('請先填入資料', 'warn');return;}
  let data;try{data=JSON.parse(input);}catch(e){showToast('JSON 格式錯誤：'+e.message, 'warn');return;}
  const sanitized=ClinCalc.DeID.sanitize(data);
  const diff=ClinCalc.DeID.diff(data,sanitized);
  const warnings=ClinCalc.DeID.audit(data);
  const el=document.getElementById('deid-preview-result');
  el.innerHTML=`<div class="al ag" style="margin-bottom:8px;">✅ 去識別化完成 · 移除 ${diff.removed.length} 個欄位 · 修改 ${diff.modified.length} 個欄位</div>
    ${diff.removed.length?`<div class="al ar" style="margin-bottom:8px;">🚫 已移除：${diff.removed.join(', ')}</div>`:''}
    ${diff.modified.length?`<div class="al ay" style="margin-bottom:8px;">⚠️ 已假名化：${diff.modified.join(', ')}</div>`:''}
    ${warnings.length?`<div class="al ay" style="margin-bottom:8px;">⚠️ 潛在 PII：${warnings.join(' | ')}</div>`:''}
    <details style="margin-top:8px;"><summary style="font-family:var(--ff-m);font-size:11px;color:var(--teal);cursor:pointer;">查看去識別化後資料</summary>
    <pre style="font-family:var(--ff-m);font-size:10px;color:var(--t2);background:var(--c2);padding:12px;border-radius:6px;overflow:auto;max-height:300px;margin-top:8px;">${JSON.stringify(sanitized,null,2)}</pre></details>`;
}

async function testSupabaseAI(){
  const statusEl=document.getElementById('supabase-ai-status');
  statusEl.innerHTML='<div class="al ai">⏳ 測試 Supabase AI...</div>';
  const result=await ClinCalc.SupabaseAI.test();
  statusEl.innerHTML=result.ok?'<div class="al ag">✅ Supabase AI Edge Function 連線成功！可切換使用免費 AI 分析。</div>':`<div class="al ar">❌ ${result.error}</div>`;
}

function copyEdgeFunction(){
  const code=ClinCalc.SupabaseAI.getEdgeFunctionCode();
  navigator.clipboard.writeText(code).then(()=>showToast('✓ Edge Function 程式碼已複製', 'ok'));
}
function showDBTab(id){
  document.querySelectorAll('#dbt-records,#dbt-refs,#dbt-custom').forEach(p=>p.classList.remove('on'));
  const p=document.getElementById('dbt-'+id);if(p)p.classList.add('on');
  if(id==='refs')renderRefs();
  if(id==='records')loadRecords();
  if(id==='custom')renderCustom();
  // fix tabs
  document.querySelectorAll('[onclick*="showDBTab"]').forEach(t=>t.classList.toggle('on',(t.getAttribute('onclick')||'').includes("'"+id+"'")));
}

// ─── MODAL ───
function closeModal(){
  const authModal = document.getElementById('modal-auth');
  if (authModal) authModal.classList.remove('on');
  const legacyModal = document.getElementById('modal-login');
  if (legacyModal) legacyModal.classList.remove('on');
  const loginErr = document.getElementById('login-err');
  if (loginErr) loginErr.style.display = 'none';
  const regErr = document.getElementById('reg-err');
  if (regErr) regErr.style.display = 'none';
}
/* doLogin() — superseded by Auth module in auth.js */

// ─── LOADER ───
function showLoad(t){document.getElementById('loader-txt').textContent=t||'計算中...';document.getElementById('loader').classList.add('on');}
function hideLoad(){document.getElementById('loader').classList.remove('on');}

// ─── HELPERS ───
function v(id){const e=document.getElementById(id);return e?parseFloat(e.value)||0:0;}
function sv(id){const e=document.getElementById(id);return e?e.value:'';}
function rv(n){const e=document.querySelector(`input[name="${n}"]:checked`);return e?e.value:'';}
function fmt(n,d=1){return isNaN(n)||n===null?'—':Number(n).toFixed(d);}
function pct(n){return isNaN(n)||n===null?'—':(n*100).toFixed(1)+'%';}
function cell(l,val,cls='',sub=''){return`<div class="rcell"><div class="rl">${l}</div><div class="rv ${cls}">${val}</div>${sub?`<div class="rs">${sub}</div>`:''}</div>`;}
function al(t,txt){return`<div class="al ${t}">${txt}</div>`;}
function clr(id){
  document.querySelectorAll(`#cp-${id} .fi`).forEach(e=>e.value='');
  document.querySelectorAll(`#cp-${id} .fsel`).forEach(e=>e.selectedIndex=0);
  const rp=document.getElementById(`rp-${id}`);if(rp)rp.classList.remove('on');
}

// ─── eGFR ───
function calcEGFR(cr,age,sex){
  if(!cr||!age)return null;
  if(sex==='female'){const k=0.7,a=-0.241;return 142*Math.pow(Math.min(cr/k,1),a)*Math.pow(Math.max(cr/k,1),-1.200)*Math.pow(0.9938,age)*1.012;}
  const k=0.9,a=-0.302;return 142*Math.pow(Math.min(cr/k,1),a)*Math.pow(Math.max(cr/k,1),-1.200)*Math.pow(0.9938,age);
}
function getStage(e){
  if(e>=90)return{s:'G1（正常或高）',k:'g1',c:'ct'};
  if(e>=60)return{s:'G2（輕度下降）',k:'g2',c:'ct'};
  if(e>=45)return{s:'G3a（輕中度）',k:'g3a',c:'ca'};
  if(e>=30)return{s:'G3b（中重度）',k:'g3b',c:'ca'};
  if(e>=15)return{s:'G4（重度）',k:'g4',c:'cr'};
  return{s:'G5（腎衰竭）',k:'g5',c:'cr'};
}
function getAStage(u){
  if(!u)return{s:'未提供',c:''};
  if(u>=300)return{s:'A3（嚴重）',c:'cr'};
  if(u>=30)return{s:'A2（中度）',c:'ca'};
  return{s:'A1（正常）',c:'ct'};
}

// ─── CKD CALC ───