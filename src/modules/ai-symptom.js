
function togSym(el,s){const i=selSym.indexOf(s);if(i===-1){selSym.push(s);el.classList.add('on');}else{selSym.splice(i,1);el.classList.remove('on');}}
function clearAI(){selSym=[];document.querySelectorAll('.stag').forEach(e=>e.classList.remove('on'));['ai_note','ai_age','ai_med','ai_hx','ai_allergy'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});document.getElementById('ai_sev').value=5;document.getElementById('ai_sevv').textContent=5;document.getElementById('rp-ai').classList.remove('on');}
// ─── API KEY LOCK/UNLOCK ───
let aiApiUnlocked = false;

function onApiKeyChange(){
  const k = document.getElementById('ai_key').value;
  if(!k){ setAILocked(true); }
}

function setAILocked(locked){
  const container = document.getElementById('ai-fields-container');
  const badge = document.getElementById('ai-lock-badge');
  aiApiUnlocked = !locked;
  if(locked){
    container.className = 'ai-locked';
    badge.className = 'lock-badge';
    badge.textContent = '🔒 請先設定並測試 API Key 才能使用';
  } else {
    container.className = 'ai-unlocked';
    badge.className = 'lock-badge unlocked';
    badge.textContent = '🔓 API Key 已驗證，功能已解鎖';
  }
}

async function testAPIKey(){
  const k = document.getElementById('ai_key').value || localStorage.getItem('cc_key');
  if(!k){ showToast('請先輸入 Anthropic API Key', 'warn'); return; }
  const statusEl = document.getElementById('ai-test-status');
  statusEl.className = 'test-status';
  statusEl.textContent = '⏳ 測試中...';
  statusEl.style.display = 'inline-block';
  try{
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01'},
      body: JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:10,messages:[{role:'user',content:'ping'}]})
    });
    if(res.ok || res.status === 200){
      statusEl.className = 'test-status ok';
      statusEl.textContent = '✓ 連線成功！功能已解鎖';
      localStorage.setItem('cc_key', k);
      document.getElementById('dr_api').value = k;
      setAILocked(false);
    } else {
      const e = await res.json();
      statusEl.className = 'test-status fail';
      statusEl.textContent = '❌ ' + (e.error?.message || `錯誤 ${res.status}`);
      setAILocked(true);
    }
  } catch(e){
    statusEl.className = 'test-status fail';
    statusEl.textContent = '❌ 連線失敗：' + e.message;
    setAILocked(true);
  }
}

function saveKey(){const k=document.getElementById('ai_key').value;if(k){localStorage.setItem('cc_key',k);showToast('✓ API Key 已儲存至本機', 'ok');}}
async function runAI(){
  if(!document.getElementById('dis_agree').checked){showToast('請先閱讀並勾選同意免責聲明', 'warn');return;}
  const key=document.getElementById('ai_key').value||localStorage.getItem('cc_key');
  if(!key){showToast('請輸入 Anthropic API Key', 'warn');return;}
  if(!selSym.length){showToast('請選擇至少一個症狀', 'warn');return;}
  const urgentSelected=selSym.some(s=>SYMS_URGENT.includes(s));
  if(urgentSelected&&!confirm('⚠️ 您選擇了可能緊急的症狀。若症狀嚴重，請立即前往急診或撥打119，而非使用AI評估。\n\n是否仍要繼續 AI 評估（輕症參考用）？'))return;
  showLoad('Claude AI 症狀分析中...');
  try{
    const age=sv('ai_age'),sex=sv('ai_sex'),dur=sv('ai_dur'),sev=document.getElementById('ai_sev').value;
    const hx=sv('ai_hx'),med=sv('ai_med'),allergy=sv('ai_allergy'),note=sv('ai_note');
    const prompt=`你是台灣醫療AI助手（繁體中文），分析症狀並提供建議。所有建議需標示「AI建議」字樣。
受檢者：年齡${age||'未填'}，性別${sex||'未填'}，病史：${hx||'無'}，用藥：${med||'無'}，過敏：${allergy||'無'}
症狀：${selSym.join('、')}。持續：${dur||'未填'}。嚴重度自評：${sev}/10。補充：${note||'無'}

請以JSON回應：{"urgency":1-5,"label":"緊急程度描述","conditions":["可能診斷1","2","3"],"dept":"建議科別","home":["居家建議1","2","3"],"ai_see":["AI建議就醫情況1","2"],"warning":"若有緊急警示則填入，否則為null","follow":"後續追蹤建議"}`;
    const r=await callClaude(key,prompt,1000);
    const j=parseJ(r);
    if(j){
      const uc={1:'#00c9a7',2:'#65a30d',3:'#f59e0b',4:'#dc2626',5:'#dc2626'};
      document.getElementById('ai-main').innerHTML=`<div style="font-family:var(--ff-m);font-size:9px;letter-spacing:1.5px;color:var(--teal);text-transform:uppercase;">AI 症狀評估（僅供參考）</div><div class="rbig" style="color:${uc[j.urgency]||uc[3]};font-size:22px;">${j.label||'待評估'}</div>${j.warning?`<div class="al ar" style="margin-top:10px;">⚠️ AI 建議立即就醫：${j.warning}</div>`:''} ${j.urgency>=4?'<div class="al ar" style="margin-top:8px;">⚠️ AI 建議立即前往急診或撥打 119</div>':''}`;
      document.getElementById('ai-cells').innerHTML=cell('緊急程度',`${j.urgency}/5`,j.urgency>=4?'cr':j.urgency>=3?'ca':'ct')+cell('建議科別',j.dept||'家醫科','cb');
      let d='';
      if(j.conditions?.length)d+=`<div class="aiblock"><div class="aih">可能相關疾病（AI 建議參考，非診斷）</div>${j.conditions.map(c=>`<div class="aipt"><div class="aidot"></div>${c}</div>`).join('')}</div>`;
      if(j.home?.length)d+=`<div class="aiblock"><div class="aih">居家照護建議</div>${j.home.map(c=>`<div class="aipt"><div class="aidot"></div>${c}</div>`).join('')}</div>`;
      if(j.ai_see?.length)d+=`<div class="aiblock" style="border-color:rgba(244,63,94,.3);"><div class="aih" style="color:var(--rose);">AI 建議就醫的情況</div>${j.ai_see.map(c=>`<div class="aipt"><div class="aidot" style="background:var(--rose);"></div>${c}</div>`).join('')}</div>`;
      if(j.follow)d+=`<div class="aiblock"><div class="aih">後續追蹤</div><div class="aipt"><div class="aidot"></div>${j.follow}</div></div>`;
      document.getElementById('ai-detail').innerHTML=d;
      document.getElementById('rp-ai').classList.add('on');
      document.getElementById('rp-ai').scrollIntoView({behavior:'smooth'});
    }
  }catch(e){showToast('AI 評估失敗：'+e.message, 'warn');}finally{hideLoad();}
}

// ─── DR SECTION ───
let drSBMode=false;
// Date input events — handled by calcAgeFromPicker / calcAgeFromText
['dr_ht','dr_wt'].forEach(id=>{const e=document.getElementById(id);if(e)e.addEventListener('input',()=>{autoBMI();autoWHR();});});
document.getElementById('dr_hip')?.addEventListener('input',autoWHR);
['dr_fpg','dr_ins'].forEach(id=>{const e=document.getElementById(id);if(e)e.addEventListener('input',autoHOMA);});
['dr_tc','dr_hdl'].forEach(id=>{const e=document.getElementById(id);if(e)e.addEventListener('input',autoNHDL);});
document.getElementById('dr_cr')?.addEventListener('input',autoEGFR);
document.getElementById('dr_sex')?.addEventListener('change',()=>{autoEGFR();autoIBW();});
document.getElementById('dr_sex_b')?.addEventListener('change',()=>{autoEGFR();autoIBW();});

// ─── DATE / AGE ─────────────────────────────────────────────────
function toggleDobMode(mode){
  document.getElementById('dob-picker-mode').style.display = mode==='picker' ? '' : 'none';
  document.getElementById('dob-text-mode').style.display = mode==='text' ? '' : 'none';
}

function calcAgeFromPicker(){
  const y=parseInt(document.getElementById('dob_y')?.value||0);
  const m=parseInt(document.getElementById('dob_m')?.value||0);
  const d=parseInt(document.getElementById('dob_d')?.value||0);
  if(!y||!m||!d){document.getElementById('dr_age').value='';return;}
  const examDateEl=document.getElementById('dr_exam_date');
  const examDate=examDateEl?.value ? new Date(examDateEl.value) : new Date();
  const dob=new Date(y,m-1,d);
  let age=examDate.getFullYear()-dob.getFullYear();
  const mo=examDate.getMonth()-dob.getMonth();
  if(mo<0||(mo===0&&examDate.getDate()<dob.getDate()))age--;
  document.getElementById('dr_age').value=age>0&&age<130?age:'';
  // sync hidden field for storage
  document.getElementById('dr_dob').value=`${y}${String(m).padStart(2,'0')}${String(d).padStart(2,'0')}`;
  autoEGFR();autoIBW();
}

function syncExamDate(){
  const v=document.getElementById('dr_exam_date')?.value||'';
  if(v){const d=new Date(v);document.getElementById('dr_exam').value=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;}
  calcAgeFromPicker();
}

function calcAgeFromText(){
  const dob=document.getElementById('dr_dob_text')?.value||'';
  const exam=document.getElementById('dr_exam_text')?.value||'';
  const ageTarget=document.getElementById('dr_age_b');
  if(dob.length===8&&exam.length===8){
    const by=parseInt(dob.slice(0,4)),bm=parseInt(dob.slice(4,6)),bd=parseInt(dob.slice(6,8));
    const ey=parseInt(exam.slice(0,4)),em=parseInt(exam.slice(4,6)),ed=parseInt(exam.slice(6,8));
    let age=ey-by;
    if(em<bm||(em===bm&&ed<bd))age--;
    if(ageTarget)ageTarget.value=age>0&&age<130?age:'';
    // sync to main fields
    document.getElementById('dr_dob').value=dob;
    document.getElementById('dr_exam').value=exam;
    document.getElementById('dr_age').value=age>0?age:'';
    autoEGFR();autoIBW();
  }
}

function getDobMode(){
  const checked=document.querySelector('input[name="dob_mode"]:checked');
  return checked?checked.value:'picker';
}

function getDRSex(){
  const mode=getDobMode();
  if(mode==='text') return sv('dr_sex_b')||sv('dr_sex');
  return sv('dr_sex');
}

function getDRAge(){
  const mode=getDobMode();
  if(mode==='text'){
    const el=document.getElementById('dr_age_b');
    return el?parseInt(el.value)||null:null;
  }
  const el=document.getElementById('dr_age');
  return el?parseInt(el.value)||null:null;
}

// ─── IDEAL BODY WEIGHT ───
function autoIBW(){
  const ht=v('dr_ht'),wt=v('dr_wt');
  const sex=getDRSex();
  if(!ht||!sex){return;}
  let ibw;
  if(sex==='male') ibw=50+2.3*((ht/2.54)-60);
  else ibw=45.5+2.3*((ht/2.54)-60);
  ibw=Math.max(ibw,0);
  const ibwEl=document.getElementById('dr_ibw');
  const diffEl=document.getElementById('dr_wt_diff');
  const catEl=document.getElementById('dr_bmi_cat');
  if(ibwEl)ibwEl.value=ibw.toFixed(1)+' kg';
  if(diffEl&&wt)diffEl.value=(wt-ibw>0?'+':'')+(wt-ibw).toFixed(1)+' kg';
  if(catEl){
    const bmi=v('dr_bmi')||(ht&&wt?+(wt/((ht/100)**2)).toFixed(1):0);
    let cat='';
    if(bmi>0){if(bmi<18.5)cat='體重過輕';else if(bmi<24)cat='正常體重';else if(bmi<27)cat='過重';else if(bmi<30)cat='輕度肥胖';else if(bmi<35)cat='中度肥胖';else cat='重度肥胖';}
    catEl.value=cat;
  }
}
function autoBMI(){
  const ht=v('dr_ht'),wt=v('dr_wt');
  if(ht&&wt){document.getElementById('dr_bmi').value=(wt/((ht/100)**2)).toFixed(1);}
  autoIBW();
}
function autoWHR(){
  const w=v('dr_waist'),h=v('dr_hip');
  if(w&&h)document.getElementById('dr_whr').value=(w/h).toFixed(2);
}
function autoHOMA(){
  const fpg=v('dr_fpg'),ins=v('dr_ins');
  if(fpg&&ins)document.getElementById('dr_homa').value=(fpg*ins/405).toFixed(2);
}
function autoNHDL(){
  const tc=v('dr_tc'),hdl=v('dr_hdl');
  if(tc&&hdl)document.getElementById('dr_nhdl').value=tc-hdl;
}
function autoEGFR(){
  const cr=v('dr_cr');
  const sex=getDRSex();
  const age=getDRAge();
  if(cr&&sex&&age){const e=calcEGFR(cr,age,sex);if(e)document.getElementById('dr_egfr').value=e.toFixed(1);}
}
