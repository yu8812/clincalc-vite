
function setCatFilter(cat, btn){
  refCatFilter = cat;
  document.querySelectorAll('.ref-cat-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  filterRefs();
}

function filterRefs(){
  const q = (document.getElementById('ref-search')?.value || '').toLowerCase();
  const filtered = REFS.filter(r => {
    const catOk = refCatFilter === 'all' || r.cat === refCatFilter;
    const textOk = !q || r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q) || r.cat.toLowerCase().includes(q);
    return catOk && textOk;
  });
  document.getElementById('refs-list').innerHTML = filtered.length ?
    filtered.map(r=>`<div class="dbcard" onclick="openRef('${r.id}')">
      <div class="dbcard-h">
        <div class="dbcard-t">${r.title}</div>
        <span class="tag ${r.status==='最新'?'tt':'tb'}">${r.status}</span>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:7px;">
        <span class="tag ta">${r.cat}</span>
        <span style="font-family:var(--ff-m);font-size:9px;color:var(--t3);">${r.date}</span>
      </div>
      <div class="dbcard-m">${r.summary}</div>
      <div class="dbcard-url">🔗 <a href="${r.url}" target="_blank" onclick="event.stopPropagation()">${r.url}</a></div>
    </div>`).join('') :
    `<div class="al ad">找不到符合「${q || refCatFilter}」的資料</div>`;
}

function renderRefs(){
  filterRefs();
}

function copySql(){
  const sql = document.getElementById('sql-block').textContent;
  navigator.clipboard.writeText(sql).then(()=>{ showToast('✓ SQL 已複製到剪貼簿', 'ok'); }).catch(()=>{ showToast('請手動複製上方 SQL', 'warn'); });
}
function openRef(id){
  const r=REFS.find(x=>x.id===id);if(!r)return;
  document.getElementById('detail-content').innerHTML=`<div class="mt">${r.title}</div>
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;"><span class="tag ta">${r.cat}</span><span class="tag tb">${r.date}</span><span class="tag ${r.status==='最新'?'tt':'tb'}">${r.status}</span></div>
    <div class="al ai" style="margin-bottom:12px;"><div>${r.summary}</div></div>
    <div class="dbcard-url" style="font-size:13px;">🔗 來源：<a href="${r.url}" target="_blank" style="color:var(--teal);">${r.url}</a></div>
    <div class="dis" style="margin-top:12px;">著作權聲明：本摘要來自公開摘要頁面，完整原文請至上方連結查閱。本系統不複製受版權保護的完整指引內容。</div>`;
  document.getElementById('modal-detail').classList.add('on');
}
// Custom sources
let customSources=JSON.parse(localStorage.getItem('cc_custom_src')||'[]');
function renderCustom(){
  document.getElementById('custom-list').innerHTML=customSources.length?customSources.map((s,i)=>`<div class="dbcard">
    <div class="dbcard-h"><div class="dbcard-t">${s.title}</div><span class="tag ta">自訂</span></div>
    <div style="font-family:var(--ff-m);font-size:9px;color:var(--t3);margin-bottom:6px;">${s.cat} · ${s.date||'—'}</div>
    <div class="dbcard-m">${s.summary}</div>
    <div class="dbcard-url">🔗 <a href="${s.url}" target="_blank">${s.url}</a></div>
    <button class="btn ba" style="margin-top:10px;padding:4px 10px;font-size:11px;" onclick="delCustom(${i})">移除</button>
  </div>`).join(''):al('ad','尚無自訂來源');
}
function addCustomSource(){
  const t=sv('cs_title'),u=sv('cs_url'),s=sv('cs_summary'),c=sv('cs_cat'),d=sv('cs_date');
  if(!t||!u){showToast('請填入標題和網址', 'warn');return;}
  customSources.unshift({title:t,url:u,summary:s,cat:c,date:d,added:new Date().toISOString()});
  localStorage.setItem('cc_custom_src',JSON.stringify(customSources));
  ['cs_title','cs_url','cs_summary','cs_date'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  renderCustom();showToast('✓ 已新增自訂來源', 'ok');
}
function delCustom(i){if(confirm('確定移除？')){customSources.splice(i,1);localStorage.setItem('cc_custom_src',JSON.stringify(customSources));renderCustom();}}

// ─── API UTILS (Legacy wrappers → delegate to ClinCalc.AI) ───
async function callClaude(key,prompt,maxT=1000){
  // Delegate to unified provider — uses currently selected provider
  // but can be overridden with explicit key for legacy call
  const provider = ClinCalc.Config.ai.provider;
  return await ClinCalc.AI.call(prompt, maxT, {
    provider: key ? 'claude' : provider, // if explicit key given, force claude
    key: key || undefined
  });
}
function parseJ(txt){
  try{const s=txt.indexOf('{'),e=txt.lastIndexOf('}');if(s>-1&&e>s)return JSON.parse(txt.slice(s,e+1));}catch(e){}
  return null;
}
// Load stored keys
try{
  const k=localStorage.getItem('cc_key');
  if(k){
    ['ai_key','dr_api'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=k;});
    // If key was stored, still require re-test on page load for security
    // But show hint that key is present
    const statusEl = document.getElementById('ai-test-status');
    if(statusEl){ statusEl.className='test-status ok'; statusEl.textContent='ℹ️ 發現已儲存的 Key，請點「測試連線」驗證後解鎖'; statusEl.style.display='inline-block'; }
  }
  // Initialize lock state
  setAILocked(true);
}catch(e){}
