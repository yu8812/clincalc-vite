function setAILocked(locked){
  // 公開版不鎖定，Gemini 免費直接使用
  aiApiUnlocked = true;
  const container = document.getElementById('ai-fields-container');
  const badge = document.getElementById('ai-lock-badge');
  if(container) container.classList.remove('ai-locked');
  if(badge) badge.style.display = 'none';
}// ─── MODULE: UI Helpers ─────────────────────────────────────────
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
  // 關閉新 auth modal
  const authModal = document.getElementById('modal-auth');
  if (authModal) authModal.classList.remove('on');
  // Legacy compat
  const legacyModal = document.getElementById('modal-login');
  if (legacyModal) legacyModal.classList.remove('on');
  // 清除錯誤訊息
  const loginErr = document.getElementById('login-err');
  if (loginErr) loginErr.style.display = 'none';
  const regErr = document.getElementById('reg-err');
  if (regErr) regErr.style.display = 'none';
}
/* doLogin() — superseded by Auth module, kept for reference only */

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
function calcCKD(){
  const cr=v('ckd_cr'),age=v('ckd_age'),sex=rv('ckd_sex')||'female';
  if(!cr||!age){showToast('請輸入 Creatinine 和年齡', 'warn');return;}
  const egfr=calcEGFR(cr,age,sex);
  const {s:stage,k:sk,c:sc}=getStage(egfr);
  const uacr=v('ckd_uacr'),{s:aStage,c:ac}=getAStage(uacr);
  const k_=v('ckd_k'),na=v('ckd_na'),bun=v('ckd_bun'),ua=v('ckd_ua');
  const buncr=cr>0&&bun>0?bun/cr:null;
  document.getElementById('ckd_buncr').value=buncr?fmt(buncr,1):'';
  document.getElementById('r-egfr').innerHTML=`${fmt(egfr)} <span style="font-size:14px;opacity:.4;">mL/min/1.73m²</span>`;
  document.getElementById('r-ckds').textContent=stage;
  ['g1','g2','g3a','g3b','g4','g5'].forEach(s=>{const el=document.getElementById('cs-'+s);if(el)el.style.opacity=s===sk?'1':'0.15';});
  let c=cell('eGFR',`${fmt(egfr,1)}`,sc,stage);
  c+=cell('UACR',uacr>0?`${uacr} mg/g`:'未提供',ac,aStage);
  if(bun>0)c+=cell('BUN',`${bun} mg/dL`,bun>30?'ca':'ct',bun>30?'偏高':'');
  if(ua>0)c+=cell('尿酸',`${ua} mg/dL`,ua>7?'ca':'ct');
  if(k_>0)c+=cell('K+',`${k_} mEq/L`,k_>5.5?'cr':k_<3.5?'ca':'ct',k_>5.5?'⚠️高血鉀':k_<3.5?'低血鉀':'');
  if(na>0)c+=cell('Na+',`${na} mEq/L`,na<135?'ca':na>145?'ca':'ct');
  if(buncr)c+=cell('BUN/Cr',fmt(buncr,1),buncr>20?'ca':'ct',buncr>20?'腎前性？':'');
  document.getElementById('ckd-cells').innerHTML=c;
  let a='';
  if(egfr<15)a+=al('ar','⚠️ eGFR <15 (G5) — AI 建議立即就醫，評估腎臟替代療法');
  else if(egfr<30)a+=al('ar','⚠️ eGFR 15-29 (G4) — AI 建議就醫，腎臟科轉診');
  else if(egfr<45)a+=al('ay','eGFR 30-44 (G3b) — 建議腎臟科追蹤，3-6月監測');
  else a+=al('ag','✓ eGFR 正常或輕度異常，定期追蹤');
  if(uacr>=300)a+=al('ar',`⚠️ UACR ${uacr} (A3) — AI 建議就醫，嚴重蛋白尿`);
  else if(uacr>=30)a+=al('ay',`UACR ${uacr} (A2) — 評估 ACEi/ARB`);
  if(k_>5.5)a+=al('ar',`⚠️ K+ ${k_} — AI 建議立即就醫，高血鉀`);
  document.getElementById('ckd-alerts').innerHTML=a;
  const riskMap={G1:['低','中','高'],G2:['低','中','高'],G3a:['中','高','極高'],G3b:['高','極高','極高'],G4:['極高','極高','極高'],G5:['極高','極高','極高']};
  const rkc={'低':'ct','中':'ca','高':'cr','極高':'cr'};
  const gk=sk==='g1'?'G1':sk==='g2'?'G2':sk==='g3a'?'G3a':sk==='g3b'?'G3b':sk==='g4'?'G4':'G5';
  document.getElementById('ckd-rmat').innerHTML=Object.entries(riskMap).map(([g,r])=>`<tr style="${g===gk?'background:rgba(0,201,167,.05);':''}"><td>${g}</td>${r.map(x=>`<td class="${rkc[x]}">${x}</td>`).join('')}</tr>`).join('');
  document.getElementById('rp-ckd').classList.add('on');
  document.getElementById('rp-ckd').scrollIntoView({behavior:'smooth'});
}

// ─── DM ───
function calcDM(){
  const fpg=v('dm_fpg'),hba1c=v('dm_hba1c'),pp=v('dm_pp'),rg=v('dm_rg'),cgm=v('dm_cgm');
  const ins=v('dm_ins'),bmi=v('dm_bmi'),egfr_dm=v('dm_egfr');
  const hasSx=sv('dm_sx')==='yes',target=sv('dm_target');
  const homa=fpg>0&&ins>0?fpg*ins/405:null;
  if(homa)document.getElementById('dm_homa').value=fmt(homa,2);
  const gmi=cgm>0?3.31+0.02392*cgm:null;
  const dm_f=fpg>=126,dm_h=hba1c>=6.5,dm_p=pp>=200,dm_r=rg>=200&&hasSx;
  const pre_f=fpg>=100&&fpg<126,pre_h=hba1c>=5.7&&hba1c<6.5,pre_p=pp>=140&&pp<200;
  const dmc=[dm_f,dm_h,dm_p,dm_r].filter(Boolean).length,prc=[pre_f,pre_h,pre_p].filter(Boolean).length;
  let diag='資料不足',dc='cs',dsc='';
  if(dmc>=1){diag=dmc>=2||dm_r?'符合糖尿病診斷':'可能糖尿病（建議複查）';dc='cr';dsc='ADA 2026：無症狀者需兩次獨立異常確認';}
  else if(prc>=1){diag='前期糖尿病';dc='ca';dsc='建議生活型態介入，每年追蹤';}
  else if(fpg>0||hba1c>0){diag='血糖正常範圍';dc='ct';}
  document.getElementById('dm-main').innerHTML=`<div style="font-family:var(--ff-m);font-size:9px;letter-spacing:1.5px;color:var(--teal);text-transform:uppercase;">糖尿病評估 · ADA 2026</div><div class="rbig ${dc}">${diag}</div><div style="font-size:12px;color:var(--t2);margin-top:4px;">${dsc}</div>`;
  let c='';
  if(fpg>0)c+=cell('FPG',`${fpg}`,dm_f?'cr':pre_f?'ca':'ct',dm_f?'糖尿病':pre_f?'前期':'正常');
  if(hba1c>0)c+=cell('HbA1c',`${hba1c}%`,dm_h?'cr':pre_h?'ca':'ct',dm_h?'糖尿病':pre_h?'前期':'正常');
  if(gmi)c+=cell('GMI估算',`${fmt(gmi,1)}%`,gmi>=6.5?'cr':'ct',`CGM均值${cgm}mg/dL`);
  if(homa)c+=cell('HOMA-IR',fmt(homa,2),homa>2.5?'ca':'ct',homa>2.5?'胰島素阻抗↑':'');
  if(target&&hba1c>0){const gap=hba1c-parseFloat(target);c+=cell('HbA1c目標差',gap>0?`+${fmt(gap,1)}%`:gap<-1?`${fmt(gap,1)}%`:'達標',gap>0.5?'ca':'ct');}
  if(bmi>0)c+=cell('BMI',`${bmi}`,bmi>=27.5?'ca':'ct',bmi>=27.5?'ADA:考慮GLP-1':'');
  if(egfr_dm>0)c+=cell('eGFR',`${egfr_dm}`,egfr_dm<60?'cr':'ct',egfr_dm<45?'Metformin慎用':egfr_dm<60?'降劑量評估':'');
  document.getElementById('dm-cells').innerHTML=c;
  let a='';
  if(hba1c>=10)a+=al('ar','⚠️ HbA1c ≥10% — AI 建議就醫，血糖控制極差');
  if(fpg>=200)a+=al('ar','⚠️ FPG ≥200 — AI 建議就醫評估');
  if(dm_h||dm_f){if(bmi>=27.5)a+=al('ai','📋 ADA 2026：BMI ≥27.5 可優先考慮 GLP-1 RA（如 Semaglutide）');a+=al('ai','📋 ADA 2026：診斷時即考慮 CGM 使用，評估 SGLT2i（CKD保護）');}
  if(prc>=1)a+=al('ay','💡 前期：生活介入可降低 50-60% 進展。建議體重減 ≥7%、每週 ≥150 分鐘中強度運動');
  if(homa>2.5)a+=al('ay','⚠️ HOMA-IR 偏高，胰島素阻抗，建議減重與評估 Metformin');
  document.getElementById('dm-alerts').innerHTML=a;
  document.getElementById('rp-dm').classList.add('on');
  document.getElementById('rp-dm').scrollIntoView({behavior:'smooth'});
}

// ─── CV ───
function calcCV(){
  const age=v('cv_age'),sex=rv('cv_sex')||'male';
  const tc=v('cv_tc'),hdl=v('cv_hdl'),ldl=v('cv_ldl'),tg=v('cv_tg');
  const sbp=v('cv_sbp'),dbp=v('cv_dbp'),waist=v('cv_waist'),crp=v('cv_crp');
  const smoke=sv('cv_smoke')==='yes',dm=sv('cv_dm')==='yes',htntx=sv('cv_htntx')==='yes';
  // auto pp and nhdl
  if(sbp&&dbp)document.getElementById('cv_pp').value=sbp-dbp;
  if(tc&&hdl)document.getElementById('cv_nhdl').value=tc-hdl;
  let ascvd=null;
  if(age>=40&&age<=79&&tc>0&&hdl>0&&sbp>0){
    const la=Math.log(age),lt=Math.log(tc),lh=Math.log(hdl),ls=Math.log(sbp);
    let sum,base;
    if(sex==='male'){sum=12.344*la+11.853*lt-2.664*la*lt-7.990*lh+1.769*la*lh+1.797*ls+(htntx?1.764:0)+(smoke?7.837:0)-1.795*la*(smoke?1:0)+(dm?0.658:0)-61.18;base=0.9144;}
    else{sum=-29.799*la+4.884*la*la+13.540*lt-3.114*la*lt-13.578*lh+3.149*la*lh+2.019*ls+(htntx?1.957:0)+(smoke?7.574:0)-1.665*la*(smoke?1:0)+(dm?0.661:0)+29.799;base=0.9665;}
    ascvd=Math.max(0,Math.min(100,(1-Math.pow(base,Math.exp(sum)))*100));
  }
  const ms_w=waist>0&&(sex==='male'?waist>=90:waist>=80);
  const ms_t=tg>=150,ms_h=hdl>0&&(sex==='male'?hdl<40:hdl<50),ms_b=sbp>=130||dbp>=85,ms_d=dm;
  const msc=[ms_w,ms_t,ms_h,ms_b,ms_d].filter(Boolean).length;
  let bpc='',bpcc='ct';
  if(sbp>180||dbp>120){bpc='高血壓危象';bpcc='cr';}
  else if(sbp>=140||dbp>=90){bpc='高血壓二期';bpcc='cr';}
  else if(sbp>=130){bpc='高血壓一期';bpcc='ca';}
  else if(sbp>=120){bpc='血壓偏高';bpcc='ca';}
  else if(sbp>0){bpc='正常';bpcc='ct';}
  const riskLvl=ascvd===null?'':ascvd>=20?'極高危':ascvd>=7.5?'高危':ascvd>=5?'中危':'低危';
  document.getElementById('cv-main').innerHTML=`<div style="font-family:var(--ff-m);font-size:9px;letter-spacing:1.5px;color:var(--teal);text-transform:uppercase;">ASCVD 10年風險 (PCE)</div><div class="rbig ${ascvd===null?'cs':ascvd>=7.5?'cr':'ct'}">${ascvd!==null?fmt(ascvd,1)+'%':'資料不足（需TC/HDL/SBP，年齡40-79）'}</div><div style="font-size:12px;color:var(--t2);margin-top:4px;">${riskLvl}</div>`;
  let c='';
  if(ascvd!==null)c+=cell('ASCVD',`${fmt(ascvd,1)}%`,ascvd>=7.5?'cr':'ct',riskLvl);
  if(sbp>0)c+=cell('血壓',`${sbp}/${dbp}`,bpcc,bpc);
  if(ldl>0)c+=cell('LDL',`${ldl} mg/dL`,ldl>=190?'cr':ldl>=130?'ca':'ct',ldl>=190?'考慮FH':'');
  if(tg>0)c+=cell('TG',`${tg} mg/dL`,tg>=500?'cr':tg>=200?'ca':'ct',tg>=500?'⚠️胰炎風險':'');
  if(hdl>0)c+=cell('HDL',`${hdl} mg/dL`,(sex==='male'?hdl<40:hdl<50)?'ca':'ct');
  c+=cell('代謝症候群',`${msc}/5`,msc>=3?'cr':'ct',msc>=3?'符合（台灣標準）':'未達標準');
  if(crp>0)c+=cell('hsCRP',`${crp} mg/L`,crp>=2?'ca':'ct',crp>=2?'中至高炎症':'低炎症');
  document.getElementById('cv-cells').innerHTML=c;
  if(msc>0){const its=[ms_w&&`腰圍${waist}`,ms_t&&`TG${tg}`,ms_h&&`HDL${hdl}`,ms_b&&`BP${sbp}/${dbp}`,ms_d&&'糖尿病'].filter(Boolean);document.getElementById('cv-ms').innerHTML=al(msc>=3?'ar':'ay',`${msc>=3?'⚠️代謝症候群：':'部分代謝異常：'}${its.join('·')}`);}
  else document.getElementById('cv-ms').innerHTML='';
  let a='';
  if(sbp>180)a+=al('ar',`⚠️ BP ${sbp}/${dbp} — AI 建議立即就醫，高血壓危象`);
  if(ldl>=190)a+=al('ay','⚠️ LDL ≥190 — 考慮家族性高膽固醇血症，AI 建議就醫');
  if(tg>=500)a+=al('ar',`⚠️ TG ≥500 — AI 建議就醫，急性胰臟炎風險`);
  if(ascvd>=7.5)a+=al('ai','📋 ACC/AHA：10年風險 ≥7.5%，建議高強度 Statin（Rosuvastatin 20-40mg）');
  if(crp>=2&&ascvd!==null&&ascvd<7.5)a+=al('ai','📋 hsCRP ≥2mg/L：考慮 Reynolds Risk Score 重新評估');
  document.getElementById('cv-alerts').innerHTML=a;
  document.getElementById('rp-cv').classList.add('on');
  document.getElementById('rp-cv').scrollIntoView({behavior:'smooth'});
}

// ─── ANEMIA ───
function calcAnemia(){
  const hb=v('an_hb'),mcv=v('an_mcv'),mchc=v('an_mchc'),rbc=v('an_rbc'),rdw=v('an_rdw');
  const si=v('an_si'),tibc=v('an_tibc'),ferritin=v('an_ferritin'),retic=v('an_retic');
  const b12=v('an_b12'),fol=v('an_fol'),ldh=v('an_ldh'),hap=v('an_hap'),wbc=v('an_wbc'),plt=v('an_plt');
  const sex=rv('an_sex')||'male';
  if(!hb){showToast('請輸入 Hb', 'warn');return;}
  const cut=sex==='male'?13.5:12.0;
  let sev='無貧血',sc='ct';
  if(hb<cut){if(hb>=10){sev='輕度貧血';sc='ca';}else if(hb>=8){sev='中度貧血';sc='ca';}else{sev='重度貧血';sc='cr';}}
  let type='',tc2='cs';
  if(mcv>0){if(mcv<80){type='小球性';tc2='cr';}else if(mcv<=100){type='正球性';tc2='ca';}else{type='大球性';tc2='cb';}}
  const mentzer=mcv>0&&rbc>0?mcv/rbc:null;
  const tsat=si>0&&tibc>0?si/tibc*100:null;
  let cause='';
  if(mcv<80){if(ferritin>0&&ferritin<(sex==='male'?30:13))cause='IDA可能';else if(mentzer!==null&&mentzer<13)cause='地中海型貧血可能';}
  else if(mcv>100){if(b12>0&&b12<200)cause='B12缺乏';else if(fol>0&&fol<3)cause='葉酸缺乏';else cause='B12/葉酸缺乏/肝病/藥物';}
  else if(mcv>0){if(retic>2.5)cause='溶血/失血（Retic↑）';else cause='腎因性/慢性病/早期缺鐵';}
  const hemolysis=ldh>0&&ldh>600&&hap>0&&hap<25;
  document.getElementById('anemia-main').innerHTML=`<div style="font-family:var(--ff-m);font-size:9px;letter-spacing:1.5px;color:var(--teal);text-transform:uppercase;">貧血分析</div><div class="rbig ${sc}">Hb ${hb} g/dL</div><div style="font-size:12px;color:var(--t2);margin-top:4px;">${sev}${type?` · ${type}貧血`:''}${cause?` · ${cause}`:''}</div>`;
  let c=cell('Hb',`${hb} g/dL`,sc,sev);
  if(mcv>0)c+=cell('MCV',`${mcv} fL`,tc2,type);
  if(mentzer!==null)c+=cell('Mentzer',fmt(mentzer,2),mentzer<13?'ca':'ct',mentzer<13?'地中海型':'IDA');
  if(tsat!==null)c+=cell('Transferrin Sat',pct(tsat/100),tsat<16?'cr':'ct',tsat<16?'缺鐵':'');
  if(ferritin>0)c+=cell('Ferritin',`${ferritin} ng/mL`,ferritin<15?'cr':ferritin>200?'ca':'ct',ferritin<15?'缺鐵':ferritin>200?'（可能慢性病）':'');
  if(rdw>0)c+=cell('RDW',`${rdw}%`,rdw>14.5?'ca':'ct',rdw>14.5?'混合型？':'');
  if(b12>0)c+=cell('B12',`${b12} pg/mL`,b12<200?'cr':b12<300?'ca':'ct',b12<200?'缺乏':'');
  if(fol>0)c+=cell('葉酸',`${fol} ng/mL`,fol<3?'cr':'ct',fol<3?'缺乏':'');
  if(hemolysis)c+=cell('溶血指標','↑ 溶血可能','cr','LDH↑+Hapto↓');
  document.getElementById('anemia-cells').innerHTML=c;
  let a='';
  if(hb<7)a+=al('ar',`⚠️ Hb ${hb} — AI 建議立即就醫，重度貧血`);
  else if(hb<8)a+=al('ay',`⚠️ Hb ${hb} — AI 建議就醫評估`);
  if(mentzer!==null&&mentzer<13)a+=al('ay','⚠️ Mentzer <13 — 地中海型貧血可能，建議 Hb 電泳確認');
  if(hemolysis)a+=al('ar','⚠️ 溶血指標異常（LDH↑、Haptoglobin↓）— AI 建議就醫，評估溶血原因');
  if(b12>0&&b12<200)a+=al('ai','B12 缺乏：評估飲食、惡性貧血（Anti-IF Ab）、Metformin 相關');
  document.getElementById('anemia-alerts').innerHTML=a;
  document.getElementById('rp-anemia').classList.add('on');
  document.getElementById('rp-anemia').scrollIntoView({behavior:'smooth'});
}

// ─── LIVER ───
function calcLiver(){
  const ast=v('lv_ast'),alt=v('lv_alt'),ggt=v('lv_ggt'),alp=v('lv_alp'),bili=v('lv_bili'),dbili=v('lv_dbili');
  const alb=v('lv_alb'),inr=v('lv_inr'),plt=v('lv_plt'),age=v('lv_age'),afp=v('lv_afp'),bmi=v('lv_bmi'),tp=v('lv_tp');
  const hbsag=sv('lv_hbsag'),hcv=sv('lv_hcv'),ascites=sv('lv_ascites'),he=sv('lv_he');
  const ratio=ast>0&&alt>0?ast/alt:null;
  if(ratio)document.getElementById('lv_ratio').value=fmt(ratio,2);
  let fib4=null,apri=null,cp=0;
  if(ast>0&&alt>0&&plt>0&&age>0)fib4=(age*ast)/(plt*Math.sqrt(alt));
  if(ast>0&&plt>0)apri=(ast/40)/(plt/100);
  if(bili>0||alb>0||inr>0){
    cp+=(bili<2?1:bili<=3?2:3);
    if(alb>0)cp+=(alb>3.5?1:alb>=2.8?2:3);
    if(inr>0)cp+=(inr<1.7?1:inr<=2.2?2:3);
    cp+=(ascites==='none'?1:ascites==='mild'?2:3);
    cp+=(he==='none'?1:he==='g12'?2:3);
  }
  const masld=bmi>=25&&(alt>40||ast>40)&&hbsag==='neg'&&hcv==='neg';
  let c='';
  if(ast>0)c+=cell('AST',`${ast} IU/L`,ast>400?'cr':ast>80?'ca':ast>40?'ca':'ct',ast>40?'偏高':'');
  if(alt>0)c+=cell('ALT',`${alt} IU/L`,alt>400?'cr':alt>80?'ca':alt>40?'ca':'ct',alt>40?'偏高':'');
  if(ratio)c+=cell('AST/ALT',fmt(ratio,2),ratio>2?'ca':'ct',ratio>2?'酒精性/肝硬化？':'');
  if(fib4!==null)c+=cell('FIB-4',fmt(fib4,2),fib4>=3.25?'cr':fib4>=1.30?'ca':'ct',fib4>=3.25?'高纖維化':fib4>=1.30?'不確定':'低風險');
  if(apri!==null)c+=cell('APRI',fmt(apri,2),apri>=2?'cr':apri>=1?'ca':'ct',apri>=2?'顯著纖維化':'');
  if(cp>0)c+=cell('Child-Pugh',`${cp}分 ${cp<=6?'A':cp<=9?'B':'C'}`,cp>=10?'cr':cp>=7?'ca':'ct');
  if(bili>0)c+=cell('T-Bili',`${bili} mg/dL`,bili>3?'cr':bili>1.2?'ca':'ct');
  if(alb>0)c+=cell('Albumin',`${alb} g/dL`,alb<3.5?'ca':'ct',alb<3.5?'肝合成↓':'');
  if(inr>0)c+=cell('INR',fmt(inr,2),inr>1.5?'cr':inr>1.2?'ca':'ct',inr>1.5?'凝血↓':'');
  if(afp>0)c+=cell('AFP',`${afp}`,afp>20?'cr':afp>7?'ca':'ct',afp>20&&hbsag==='pos'?'⚠️HCC風險':'');
  if(masld)c+=cell('MASLD','風險升高','ca','BMI≥25+肝酵素↑+無B/C肝');
  document.getElementById('liver-cells').innerHTML=c;
  let a='';
  if(alt>400||ast>400)a+=al('ar','⚠️ 肝酵素急升 — AI 建議立即就醫，急性肝炎/藥物性損傷');
  if(inr>2.0)a+=al('ar',`⚠️ INR ${inr} — AI 建議立即就醫，嚴重凝血障礙`);
  if(afp>200&&hbsag==='pos')a+=al('ar',`⚠️ AFP ${afp}+HBsAg+ — HCC 風險，AI 建議就醫`);
  if(fib4!==null&&fib4>=3.25)a+=al('ay',`⚠️ FIB-4 ${fmt(fib4,2)} — 高纖維化，建議胃鏡/肝臟超音波`);
  if(hbsag==='pos')a+=al('ai','📋 HBsAg+：定期HBV DNA、腹部超音波。評估抗病毒治療（台灣健保給付）');
  if(hcv==='pos')a+=al('ai','📋 Anti-HCV+：確認HCV RNA，DAA療程（台灣健保12週療程）');
  if(masld)a+=al('ay','MASLD（代謝相關脂肪肝）：生活型態介入、控制體重，FIB-4評估纖維化程度');
  document.getElementById('liver-alerts').innerHTML=a;
  document.getElementById('rp-liver').classList.add('on');
  document.getElementById('rp-liver').scrollIntoView({behavior:'smooth'});
}

// ─── THYROID ───
function calcThyroid(){
  const tsh=v('th_tsh'),ft4=v('th_ft4'),ft3=v('th_ft3'),t4=v('th_t4'),tpo=v('th_tpo');
  const trab=v('th_trab'),cal_=v('th_cal'),dose=v('th_dose');
  const preg=sv('th_preg'),goiter=sv('th_goiter'),afib=sv('th_afib'),levo=sv('th_levo');
  if(!tsh){showToast('請輸入 TSH', 'warn');return;}
  // Adjust TSH reference for pregnancy
  const tshRef=preg==='t1'?2.5:preg?3.0:4.0;
  const tshLow=preg?0.1:0.4;
  let diag='',dc='ct',dsub='';
  if(tsh<0.01){if(ft4>1.8||ft3>4.2){diag='顯性甲亢（甲狀腺機能亢進）';dc='cr';dsub='TSH極低+FT4/FT3升高';}else{diag='亞臨床甲亢';dc='ca';dsub='TSH低，FT4/FT3正常';}}
  else if(tsh<tshLow){diag='TSH偏低';dc='ca';dsub=preg?'妊娠：需密切追蹤':'輕度異常，定期複查';}
  else if(tsh>10){diag='顯性甲低（甲狀腺機能低下）';dc='cr';dsub='需 Levothyroxine 治療';}
  else if(tsh>tshRef){diag=preg?'妊娠甲低（需積極治療）':'亞臨床甲低';dc=preg?'cr':'ca';dsub=preg?'影響胎兒神經發育':'TSH升高，FT4正常';}
  else{diag='甲狀腺功能正常';dc='ct';dsub=`TSH ${tsh} 在正常範圍`;}
  // Graves suggestion
  if(tsh<0.1&&trab>1.75)dsub+=' · TRAb陽性（Graves病可能）';
  document.getElementById('thyroid-main').innerHTML=`<div style="font-family:var(--ff-m);font-size:9px;letter-spacing:1.5px;color:var(--teal);text-transform:uppercase;">甲狀腺評估 · ATA 2023</div><div class="rbig ${dc}">TSH ${tsh} mIU/L</div><div style="font-size:12px;color:var(--t2);margin-top:4px;">${diag} — ${dsub}</div>`;
  let c=cell('TSH',`${tsh} mIU/L`,dc,diag);
  if(ft4>0)c+=cell('Free T4',`${ft4} ng/dL`,ft4>1.8?'cr':ft4<0.8?'ca':'ct',ft4>1.8?'偏高':ft4<0.8?'偏低':'');
  if(ft3>0)c+=cell('Free T3',`${ft3} pg/mL`,ft3>4.2?'cr':ft3<2.3?'ca':'ct');
  if(tpo>0)c+=cell('Anti-TPO',`${tpo} IU/mL`,tpo>35?'ca':'ct',tpo>35?'橋本氏可能':'');
  if(trab>0)c+=cell('TRAb',`${trab} IU/L`,trab>1.75?'cr':'ct',trab>1.75?'Graves可能':'');
  if(dose>0&&levo==='yes'){const target=preg?'0.4-2.5':'0.5-4.0';c+=cell('Levo劑量',`${dose} μg/d`,'cb',`TSH目標 ${target}`);}
  if(cal_>0)c+=cell('Calcitonin',`${cal_} pg/mL`,cal_>10?'cr':'ct',cal_>10?'⚠️甲狀腺髓樣癌？':'');
  document.getElementById('thyroid-cells').innerHTML=c;
  let a='';
  if(tsh<0.01&&ft4>1.8)a+=al('ar','⚠️ 顯性甲亢 — AI 建議就醫，評估 MMI/PTU 或 I131');
  if(tsh>10)a+=al('ar','⚠️ 顯性甲低 — AI 建議就醫，需 Levothyroxine');
  if(preg&&tsh>2.5)a+=al('ar','⚠️ 妊娠甲低 — AI 建議立即就醫，Levothyroxine 劑量調整');
  if(tpo>35)a+=al('ay','橋本氏甲狀腺炎：每6-12月追蹤 TSH。進展為甲低時需治療');
  if(trab>1.75)a+=al('ai','TRAb 陽性：Graves 病診斷支持，評估抗甲狀腺藥物治療');
  if(afib==='yes'&&tsh<0.4)a+=al('ay','⚠️ TSH 偏低 + 心律不整：需排除甲亢引發房顫');
  document.getElementById('thyroid-alerts').innerHTML=a;
  document.getElementById('rp-thyroid').classList.add('on');
  document.getElementById('rp-thyroid').scrollIntoView({behavior:'smooth'});
}

// ─── BONE ───
function calcBone(){
  const ca=v('bn_ca'),p=v('bn_p'),pth=v('bn_pth'),vitd=v('bn_vitd'),alb=v('bn_alb'),mg=v('bn_mg'),alp=v('bn_alp');
  const egfr=v('bn_egfr'),tscore=v('bn_tscore'),rrt=sv('bn_rrt');
  const cca=ca>0&&alb>0?ca+0.8*(4-alb):null;
  if(cca)document.getElementById('bn_cca').value=fmt(cca,2);
  const cap=ca>0&&p>0?ca*p:null;
  if(cap)document.getElementById('bn_cap').value=fmt(cap,1);
  let c='';
  if(cca!==null)c+=cell('校正鈣',`${fmt(cca,2)} mg/dL`,cca>12?'cr':cca>10.5?'ca':cca<7?'cr':cca<8.5?'ca':'ct',cca>12?'高鈣危象':cca<7?'低鈣危象':cca<8.5?'低鈣':'正常');
  else if(ca>0)c+=cell('血鈣',`${ca} mg/dL`,ca>10.5?'ca':ca<8.5?'ca':'ct');
  if(p>0)c+=cell('磷',`${p} mg/dL`,p>4.5?'ca':p<2.5?'ca':'ct',p>4.5?'高磷':p<2.5?'低磷':'正常');
  if(cap)c+=cell('Ca×P',fmt(cap,1),cap>55?'cr':cap>50?'ca':'ct',cap>55?'⚠️血管鈣化風險':'');
  if(pth>0){const tgt=egfr>0&&egfr<60?(egfr>=45?35:egfr>=30?70:150):65;c+=cell('PTH',`${pth} pg/mL`,pth>tgt*2?'cr':pth>tgt?'ca':'ct',`目標<${tgt}`);}
  if(vitd>0)c+=cell('Vit D',`${vitd} ng/mL`,vitd<20?'cr':vitd<30?'ca':'ct',vitd<20?'缺乏':vitd<30?'不足':'充足');
  if(mg>0)c+=cell('Mg',`${mg} mg/dL`,mg<1.7?'ca':mg>2.5?'ca':'ct',mg<1.7?'低鎂':'');
  if(tscore!==0&&tscore!==undefined&&sv('bn_tscore')!=='')c+=cell('T-score',`${tscore}`,tscore<=-2.5?'cr':tscore<=-1?'ca':'ct',tscore<=-2.5?'骨質疏鬆':tscore<=-1?'骨量減少':'正常');
  document.getElementById('bone-cells').innerHTML=c;
  let a='';
  if(cca!==null&&cca>12)a+=al('ar',`⚠️ 校正鈣 ${fmt(cca,2)} — AI 建議立即就醫，高鈣危象`);
  if(cca!==null&&cca<7)a+=al('ar',`⚠️ 校正鈣 ${fmt(cca,2)} — AI 建議立即就醫，症狀性低鈣`);
  if(egfr>0&&egfr<60){a+=al('ai',`📋 CKD G${egfr<30?'4-5':egfr<45?'3b':'3a'}：KDIGO 建議監測 Ca/P/PTH/Vit D`);}
  if(vitd>0&&vitd<20)a+=al('ay','Vit D 缺乏：補充 D3 2000-4000 IU/天，3個月後複查');
  if(cap!==null&&cap>55)a+=al('ar',`⚠️ Ca×P ${fmt(cap,1)} >55 — 異位鈣化風險，需積極降磷`);
  document.getElementById('bone-alerts').innerHTML=a;
  document.getElementById('rp-bone').classList.add('on');
  document.getElementById('rp-bone').scrollIntoView({behavior:'smooth'});
}

// ─── SENSITIVITY ───
function calcSens(){
  let tp=v('s_tp'),fp=v('s_fp'),fn=v('s_fn'),tn=v('s_tn');
  const se_d=v('s_se'),sp_d=v('s_sp'),prev=v('s_prev');
  let se,sp,n=null;
  if(tp+fp+fn+tn>0){n=tp+fp+fn+tn;se=tp/(tp+fn);sp=tn/(tn+fp);}
  else if(se_d>0&&sp_d>0){se=se_d/100;sp=sp_d/100;}
  else{showToast('請輸入混淆矩陣或靈敏度/特異度', 'warn');return;}
  const lr_p=se/(1-sp),lr_n=(1-se)/sp,youden=se+sp-1;
  const acc=n?((tp||0)+(tn||0))/n:null;
  let ppvb=null,npvb=null;
  if(prev>0){const p=prev/100;ppvb=se*p/(se*p+(1-sp)*(1-p));npvb=sp*(1-p)/(sp*(1-p)+(1-se)*p);}
  const ppv=n?tp/(tp+fp):null,npv=n?tn/(tn+fn):null;
  ['tp','fn','fp','tn'].forEach(k=>{const el=document.getElementById('cm-'+k),vals={tp,fn,fp,tn};if(el){const v2=vals[k];el.querySelector('div').textContent=v2!==null&&v2!==undefined?v2:'—';}});
  let c='';
  c+=cell('靈敏度 Se',pct(se),se>=0.9?'ct':se>=0.7?'ca':'cr',se>=0.9?'優（篩檢）':'');
  c+=cell('特異度 Sp',pct(sp),sp>=0.95?'ct':sp>=0.8?'ca':'cr',sp>=0.95?'優（確診）':'');
  if(ppv!==null)c+=cell('PPV',pct(ppv),ppv>=0.8?'ct':'ca');
  if(npv!==null)c+=cell('NPV',pct(npv),npv>=0.9?'ct':'ca');
  if(ppvb!==null)c+=cell(`PPV（盛行率${prev}%）`,pct(ppvb),ppvb>=0.8?'ct':'ca','貝氏修正');
  if(npvb!==null)c+=cell(`NPV（盛行率${prev}%）`,pct(npvb),npvb>=0.9?'ct':'ca','貝氏修正');
  c+=cell('LR+',fmt(lr_p,2),lr_p>=10?'ct':lr_p>=5?'ca':'cr',lr_p>=10?'強確診力':'');
  c+=cell('LR−',fmt(lr_n,3),lr_n<=0.1?'ct':lr_n<=0.2?'ca':'cr',lr_n<=0.1?'強排除力':'');
  c+=cell("Youden's J",fmt(youden,3),youden>=0.7?'ct':youden>=0.5?'ca':'cr');
  if(acc!==null)c+=cell('準確率',pct(acc),acc>=0.9?'ct':'ca');
  document.getElementById('sens-cells').innerHTML=c;
  document.getElementById('rp-sens').classList.add('on');
  document.getElementById('rp-sens').scrollIntoView({behavior:'smooth'});
}

// ─── AI CHECK ───
const SYMS_URGENT=['胸痛','呼吸困難','意識不清','大量出血'];
const SYMS_ALL=['頭痛','頭暈','胸痛','心悸','呼吸困難','咳嗽','發燒','腹痛','噁心嘔吐','腹瀉','便秘','血尿','水腫','疲勞','體重減輕','口渴多尿','視力模糊','手腳麻木','關節疼痛','皮膚黃染','失眠','頻尿','脫髮','皮疹','頸部僵硬','淋巴結腫大','意識不清','大量出血','盜汗','食慾不振','排便習慣改變','胸悶','背痛','小便顏色異常'];
(()=>{const c=document.getElementById('sym-tags');if(!c)return;c.innerHTML=SYMS_ALL.map(s=>{const u=SYMS_URGENT.includes(s);return`<span class="stag ${u?'urgent':''}" onclick="togSym(this,'${s}')">${u?'⚠️':''}${s}</span>`;}).join('');})();
