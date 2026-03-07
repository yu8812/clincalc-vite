
function saveDraft(){
  const d=getDRData();
  const drafts=JSON.parse(localStorage.getItem('cc_drafts')||'[]');
  drafts.unshift({...d,saved_at:new Date().toISOString()});
  if(drafts.length>20)drafts.pop();
  localStorage.setItem('cc_drafts',JSON.stringify(drafts));
  showToast('✓ 已暫存（最多20筆）', 'ok');
}
function clearDR(){
  document.querySelectorAll('#s-dr .fi').forEach(e=>{if(!e.readOnly)e.value='';});
  document.querySelectorAll('#s-dr .fsel').forEach(e=>e.selectedIndex=0);
  ['dr_bmi','dr_egfr','dr_whr','dr_homa','dr_nhdl','dr_age','dr_age_b','dr_ibw','dr_wt_diff','dr_bmi_cat'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  ['dob_y','dob_m','dob_d'].forEach(id=>{const e=document.getElementById(id);if(e)e.selectedIndex=0;});
  const examDate=document.getElementById('dr_exam_date');if(examDate)examDate.value='';
  document.getElementById('rp-dr').classList.remove('on');
}
function exportDR(){
  const d=getDRData();const now=new Date().toLocaleString('zh-TW');
  const blob=new Blob([JSON.stringify({exported:now,...d},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`clincalc_${d.pid||'report'}_${Date.now()}.json`;a.click();
}

// ─── SUPABASE ───
function saveSB(){sbUrl=sv('sb_url');sbKey=sv('sb_key');localStorage.setItem('cc_sb_url',sbUrl);localStorage.setItem('cc_sb_key',sbKey);showToast('✓ Supabase 設定已儲存', 'ok');}
function loadStoredSB(){
  sbUrl=localStorage.getItem('cc_sb_url')||'';
  sbKey=localStorage.getItem('cc_sb_key')||'';
  const uk=localStorage.getItem('cc_key')||'';
  drDocId=localStorage.getItem('cc_docid')||'';
  if(sbUrl)document.getElementById('sb_url').value=sbUrl;
  if(sbKey)document.getElementById('sb_key').value=sbKey;
  if(uk){document.getElementById('ai_key').value=uk;document.getElementById('dr_api').value=uk;}
  if(drDocId)document.getElementById('dr_docid').value=drDocId;
  // Load multi-provider keys into Config
  ClinCalc.Config.ai.claudeKey = uk;
  ClinCalc.Config.ai.openaiKey = localStorage.getItem('cc_openai_key') || '';
  ClinCalc.Config.ai.geminiKey = localStorage.getItem('cc_gemini_key') || '';
  // Run retention purge if enabled
  if(ClinCalc.Config.retention.autoDelete) {
    const last = ClinCalc.Config.retention.lastCleanup;
    const now = new Date().toDateString();
    if(last !== now) {
      const purged = ClinCalc.Retention.purgeLocalDrafts();
      if(purged.deleted > 0) console.log(`[Retention] 自動清理 ${purged.deleted} 筆過期記錄`);
      localStorage.setItem('cc_last_cleanup', now);
      ClinCalc.Config.retention.lastCleanup = now;
    }
  }
}
function saveAPIKey(){
  const key=sv('dr_api');const docid=sv('dr_docid');
  if(key)localStorage.setItem('cc_key',key);
  if(docid){localStorage.setItem('cc_docid',docid);drDocId=docid;}
  document.getElementById('ai_key').value=key;
  showToast('✓ 已儲存', 'ok');
}
async function testSB(){
  const url=sv('sb_url'),key=sv('sb_key');
  if(!url||!key){showToast('請填入 URL 和 Key', 'warn');return;}
  showLoad('測試 Supabase 連線...');
  try{
    const r=await fetch(`${url}/rest/v1/patients?limit=1`,{headers:{'apikey':key,'Authorization':`Bearer ${key}`}});
    if(r.ok){document.getElementById('sb-status').innerHTML=al('ag','✓ Supabase 連線成功！資料表已就緒。');}
    else if(r.status===404){document.getElementById('sb-status').innerHTML=al('ay','⚠️ 連線成功但資料表不存在，請先執行上方 SQL 建立資料表。');}
    else{document.getElementById('sb-status').innerHTML=al('ar',`❌ 連線失敗（${r.status}），請確認 URL 和 Key。`);}
  }catch(e){document.getElementById('sb-status').innerHTML=al('ar','❌ 連線失敗：'+e.message);}
  finally{hideLoad();}
}
async function saveToSB(){
  if(!sbUrl||!sbKey){showToast('請先設定 Supabase URL 和 Key', 'warn');return;}
  const rawData=getDRData();
  if(!rawData.pid){showToast('請填入受檢者編號', 'warn');return;}
  // ── DeID: sanitize before storing ──
  const deidWarnings = ClinCalc.DeID.audit(rawData);
  if(deidWarnings.length){
    if(!confirm(`⚠️ 去識別化警告：\n${deidWarnings.join('\n')}\n\n確定仍要繼續儲存（系統將自動過濾敏感欄位）？`)) return;
  }
  const d = ClinCalc.DeID.sanitize(rawData);
  showLoad('去識別化並儲存至 Supabase...');
  try{
    const qualify=judgeDR(rawData); // use raw for judgment
    const r=await fetch(`${sbUrl}/rest/v1/patients`,{method:'POST',
      headers:{'apikey':sbKey,'Authorization':`Bearer ${sbKey}`,'Content-Type':'application/json','Prefer':'return=minimal'},
      body:JSON.stringify({
        doctor_id:d.doctor||drDocId,
        pid:d.pid_hash, // store pseudonymized ID only
        pid_display:d.pid_display,
        exam_date:d.exam_date,
        sex:d.sex,
        age:d.age,
        data:d, // sanitized data
        qualify_result:qualify,
        notes:null, // never store free-text notes
        expires_at: new Date(Date.now() + ClinCalc.Config.retention.days * 864e5).toISOString()
      })
    });
    if(r.ok||r.status===201){showToast(`✓ 已成功儲存至 Supabase！\n（去識別化版本，保留至 ${new Date(Date.now()+ClinCalc.Config.retention.days*864e5).toLocaleDateString('zh-TW')}）`, 'ok');}
    else{const err=await r.json();showToast('儲存失敗：'+JSON.stringify(err, 'warn'));}
  }catch(e){showToast('儲存失敗：'+e.message, 'warn');}
  finally{hideLoad();}
}
async function loadRecords(){
  const localDrafts=JSON.parse(localStorage.getItem('cc_drafts')||'[]');
  if(localDrafts.length){
    document.getElementById('local-records').innerHTML=`<div style="font-family:var(--ff-m);font-size:9px;letter-spacing:1px;color:var(--t3);text-transform:uppercase;margin-bottom:8px;">本機暫存記錄（最近${localDrafts.length}筆）</div>`+
    localDrafts.map((d,i)=>`<div class="dbcard" onclick="showDetail(${i})">
      <div class="dbcard-h"><div class="dbcard-t">${d.pid||'（無編號）'}</div><span class="tag ${d.sex==='male'?'tb':'tv'}">${d.sex==='male'?'男':'女'} ${d.age||'—'}歲</span></div>
      <div class="dbcard-m">日期：${d.exam_date||'—'}　eGFR：${d.egfr_calc||'—'}　HbA1c：${d.hba1c||'—'}%　LDL：${d.ldl||'—'}</div>
      <div style="font-size:10.5px;color:var(--t3);margin-top:5px;">暫存：${new Date(d.saved_at).toLocaleString('zh-TW')}</div>
    </div>`).join('');
  }
  if(!sbUrl||!sbKey){document.getElementById('records-list').innerHTML=al('ad','尚未連接 Supabase，顯示本機暫存記錄。');return;}
  showLoad('載入 Supabase 記錄...');
  try{
    const r=await fetch(`${sbUrl}/rest/v1/patients?order=created_at.desc&limit=50`,{headers:{'apikey':sbKey,'Authorization':`Bearer ${sbKey}`}});
    if(!r.ok){document.getElementById('records-list').innerHTML=al('ay','無法載入記錄，請確認連線設定');return;}
    const data=await r.json();
    document.getElementById('records-list').innerHTML=data.length?data.map(rec=>`<div class="dbcard" onclick='showSBDetail(${JSON.stringify(rec).replace(/'/g,"&#39;")})'>
      <div class="dbcard-h"><div class="dbcard-t">${rec.pid||'（無編號）'}</div><span class="tag tt">已儲存</span></div>
      <div class="dbcard-m">日期：${rec.exam_date||'—'}　醫師：${rec.doctor_id||'—'}</div>
      ${rec.notes?`<div class="dbcard-m" style="margin-top:4px;">${rec.notes}</div>`:''}
      <div style="font-size:10px;color:var(--t3);margin-top:4px;">${new Date(rec.created_at).toLocaleString('zh-TW')}</div>
    </div>`).join(''):al('ad','Supabase 中尚無記錄');
  }catch(e){document.getElementById('records-list').innerHTML=al('ar','載入失敗：'+e.message);}
  finally{hideLoad();}
}
async function searchRecords(){
  const pid=sv('search_pid');if(!pid){loadRecords();return;}
  if(!sbUrl||!sbKey){showToast('請先連接 Supabase', 'warn');return;}
  showLoad('搜尋中...');
  try{
    const r=await fetch(`${sbUrl}/rest/v1/patients?pid=eq.${encodeURIComponent(pid)}&order=created_at.desc`,{headers:{'apikey':sbKey,'Authorization':`Bearer ${sbKey}`}});
    const data=await r.json();
    document.getElementById('records-list').innerHTML=data.length?data.map(rec=>`<div class="dbcard"><div class="dbcard-t">${rec.pid}</div><div class="dbcard-m">${rec.exam_date} · eGFR:${rec.data?.egfr_calc||'—'} · HbA1c:${rec.data?.hba1c||'—'}%</div></div>`).join(''):al('ad','未找到符合記錄');
  }catch(e){showToast('搜尋失敗：'+e.message, 'warn');}finally{hideLoad();}
}
function showDetail(i){
  const drafts=JSON.parse(localStorage.getItem('cc_drafts')||'[]');
  const d=drafts[i];if(!d)return;
  document.getElementById('detail-content').innerHTML=`<div class="mt">${d.pid||'（無編號）'}</div><div class="ms">${d.exam_date||'—'} · ${d.sex==='male'?'男':'女'} ${d.age||'—'}歲</div><pre style="font-family:var(--ff-m);font-size:10px;color:var(--t2);overflow:auto;max-height:400px;background:var(--c2);padding:12px;border-radius:6px;">${JSON.stringify(d,null,2)}</pre>`;
  document.getElementById('modal-detail').classList.add('on');
}
function showSBDetail(rec){
  document.getElementById('detail-content').innerHTML=`<div class="mt">${rec.pid||'（無編號）'}</div><div class="ms">${rec.exam_date||'—'}</div><pre style="font-family:var(--ff-m);font-size:10px;color:var(--t2);overflow:auto;max-height:400px;background:var(--c2);padding:12px;border-radius:6px;">${JSON.stringify(rec.data,null,2)}</pre>`;
  document.getElementById('modal-detail').classList.add('on');
}

// ─── REFS DB ───
const REFS=[
  {id:'ada2026',title:'ADA 2026 Standards of Care in Diabetes',cat:'醫療指引',date:'2026-01',url:'https://diabetesjournals.org/care/issue/49/Supplement_1',summary:'2026年重大更新：(1) CGM 診斷時即考慮使用；(2) GLP-1 RA 首次推薦用於第1型糖尿病合併肥胖；(3) 高危患者血壓目標更新為 &lt;120 mmHg；(4) SGLT2i 擴大 CKD 保護適應症；(5) 新增心理健康/焦慮篩檢。',status:'最新'},
  {id:'kdigo2024',title:'KDIGO 2024 CKD Evaluation and Management Guideline',cat:'醫療指引',date:'2024',url:'https://kdigo.org/guidelines/ckd-evaluation-and-management/',summary:'CKD-EPI 2021 race-free eGFR 公式。強化 SGLT2i 在 CKD 的心腎保護角色。UACR &lt;30/30-300/>300 三級分層。建議所有 CKD G3b-G5 轉介腎臟科。',status:'有效'},
  {id:'aha2022',title:'ACC/AHA 2022 High Blood Pressure Guideline',cat:'醫療指引',date:'2022',url:'https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065',summary:'定義高血壓 ≥130/80 mmHg。引入 PCE 工具決定是否啟動降壓藥。強調生活型態介入優先。高危患者目標 &lt;130/80 mmHg。',status:'有效'},
  {id:'kdigo2017bone',title:'KDIGO 2017 CKD-MBD Guideline',cat:'醫療指引',date:'2017',url:'https://kdigo.org/guidelines/ckd-mbd/',summary:'CKD G3b+ 監測 Ca/P/PTH/Vit D。Ca×P 乘積目標 &lt;55 mg²/dL²。PTH 目標依分期調整。避免含鈣磷結合劑過量。',status:'有效'},
  {id:'ata2023',title:'ATA 2023 Thyroid Guidelines',cat:'醫療指引',date:'2023',url:'https://www.thyroid.org/thyroid-professionals/clinical-thyroidology/',summary:'TSH 正常值 0.4-4.0 mIU/L。妊娠初期目標 &lt;2.5，中末期 &lt;3.0。Graves 病首選 ATD 治療。橋本氏甲狀腺炎每年 TSH 監測。',status:'有效'},
  {id:'nhi_ms',title:'台灣全民健保代謝症候群防治計畫',cat:'政府機關',date:'2024',url:'https://www.nhi.gov.tw/Content_List.aspx?n=9AB97CA2A0A7C57D',summary:'收案資格：腹部肥胖（男≥90/女≥80 cm，必備）+ 任意3項代謝異常（TG≥150/HDL偏低/BP≥130/85/FPG≥100）。健保給付衛教及追蹤。',status:'有效'},
  {id:'nhi_ckd',title:'台灣全民健保早期慢性腎臟病照護計畫',cat:'政府機關',date:'2023',url:'https://www.nhi.gov.tw/',summary:'收案對象：eGFR 30-59 (G3) 或 eGFR 60-89+持續蛋白尿+危險因子（糖尿病/高血壓）。每3月追蹤腎功能/UACR/血壓。強調延緩腎功能惡化、降低透析風險。',status:'有效'},
  {id:'nhi_statin',title:'全民健保降膽固醇藥物（Statin）給付規定',cat:'健保規範',date:'2024',url:'https://www.nhi.gov.tw/Content_List.aspx?n=9AB97CA2A0A7C57D',summary:'給付條件：① ACS/冠狀動脈介入/CVD；② 糖尿病+LDL≥100；③ 高血脂症+危險因子（≥2個RF:LDL≥130；≤1個RF:LDL≥160）。危險因子：高血壓/年齡/家族史/HDL&lt;40/吸菸。',status:'有效'},
  {id:'who_anemia',title:'WHO Haemoglobin Concentrations for Anaemia Diagnosis',cat:'國際機構',date:'2011',url:'https://www.who.int/publications/i/item/9789241598033',summary:'成人貧血定義：男性 Hb &lt;13.5 g/dL，女性 &lt;12.0 g/dL，妊娠期女性 &lt;11.0 g/dL。輕度：10-12/10-13，中度：8-9.9，重度：&lt;8。',status:'有效'},
  {id:'easl2023',title:'EASL Clinical Practice Guidelines on Non-Invasive Tests (MAFLD/MASLD)',cat:'醫療指引',date:'2023',url:'https://easl.eu/publication/easl-clinical-practice-guidelines-on-non-invasive-tests-for-evaluation-of-liver-disease-severity-and-prognosis/',summary:'FIB-4 &lt;1.30 低纖維化風險，≥3.25 高纖維化。APRI ≥2 顯著纖維化。MASLD（原NAFLD）定義更新：代謝危險因子+肝脂肪變性+無其他病因。',status:'有效'},
  // ─── 台灣學會 ───
  {id:'tas2024dm',title:'台灣糖尿病學會 2024 第2型糖尿病臨床照護指引',cat:'台灣學會',date:'2024',url:'https://www.endo-dm.org.tw/dia/ALLDOC/dia2019_01/dia2019_01.asp',summary:'HbA1c 目標個人化（一般 <7%，衰弱老人 <8.5%）。SGLT2i/GLP-1 RA 優先用於合併 ASCVD/CKD/HF 的糖尿病患者。CGM 建議用於第1型及多次注射第2型。',status:'最新'},
  {id:'tsn2023ckd',title:'台灣腎臟醫學會 CKD 診療準則 2023',cat:'台灣學會',date:'2023',url:'https://www.tsn.org.tw/UI/C/ClinicalGuideline.aspx',summary:'採用 CKD-EPI 2021 race-free 公式計算 eGFR。UACR 分層：正常 <30、微量 30-300、大量 >300 mg/g。SGLT2i 建議用於 eGFR ≥20 + 蛋白尿患者。血壓目標 <130/80 mmHg。',status:'有效'},
  {id:'tsh2023htn',title:'台灣高血壓學會 2023 高血壓指引',cat:'台灣學會',date:'2023',url:'https://www.hypertension.org.tw/',summary:'定義：≥140/90 mmHg。高危患者（DM/CKD/CVD）目標 <130/80。生活型態介入：限鈉 <6g/日、DASH 飲食、規律運動、戒菸、限酒。台灣白袍高血壓盛行率約 15-20%。',status:'有效'},
  {id:'tla2024lipid',title:'台灣脂質學會 2024 血脂異常臨床治療指引',cat:'台灣學會',date:'2024',url:'https://www.tla.org.tw/',summary:'ASCVD 極高危：LDL 目標 <55 mg/dL。高危（DM+靶器官損傷）：LDL <70 mg/dL。一般高危：LDL <100 mg/dL。Statin + Ezetimibe + PCSK9i 三線治療策略。',status:'最新'},
  // ─── 政府機關 ───
  {id:'nhi_icd',title:'健保署 ICD-10-CM 台灣版（TW-ICD-10-CM）對照表',cat:'政府機關',date:'2024',url:'https://www.nhi.gov.tw/Content_List.aspx?n=D529DDFE5448BEAC',summary:'台灣健保申報使用之 ICD-10-CM 編碼查詢工具。包含主要診斷碼、合併症碼對應。每年10月更新，臨床申報必備參考。',status:'有效'},
  {id:'nhi_drug',title:'全民健保藥品查詢系統（健保署）',cat:'政府機關',date:'2024',url:'https://www.nhi.gov.tw/QueryN/Query1.aspx',summary:'健保給付藥品查詢：成分名、商品名、健保碼、給付規定、共同負擔。可查詢是否符合健保給付條件及限制事項。每月更新。',status:'有效'},
  {id:'tfda_drug',title:'食藥署藥品說明書查詢（TFDA）',cat:'政府機關',date:'2024',url:'https://www.fda.gov.tw/TC/site.aspx?sid=3',summary:'台灣核准藥品仿單、適應症、劑量、禁忌、副作用完整資訊。是台灣藥品法規核准資料的最終依據。',status:'有效'},
  // ─── 工具資源 ───
  {id:'mdcalc',title:'MDCalc — 臨床計算器集合（英文）',cat:'工具資源',date:'2024',url:'https://www.mdcalc.com',summary:'收錄 500+ 經過同儕審閱的臨床評分工具，包含 CHADS2-VASc、CHA2DS2-VASc、SOFA、APACHE II、Framingham Risk Score 等。附原始文獻引用及臨床使用說明。',status:'有效'},
  {id:'drugs_com',title:'Drugs.com — 藥物交互作用查詢（英文）',cat:'工具資源',date:'2024',url:'https://www.drugs.com/drug_interactions.html',summary:'藥物交互作用查詢工具，支援多種藥物同時檢查。分為嚴重（Severe）、中等（Moderate）、輕微（Minor）三級。臨床開立多種藥物前建議查詢。',status:'有效'},
  {id:'uptodate_free',title:'台灣大學圖書館 UpToDate 連線說明',cat:'工具資源',date:'2024',url:'https://www.lib.ntu.edu.tw/',summary:'台灣各大醫學院校圖書館提供 UpToDate 校園授權。臨床決策支援最完整的循證醫學資料庫，含 30,000+ 主題文章，每 4-6 週更新一次。請透過校園 VPN 或圖書館連線使用。',status:'有效'},
  {id:'pubmed',title:'PubMed / MEDLINE — 醫學文獻資料庫（NLM）',cat:'工具資源',date:'2024',url:'https://pubmed.ncbi.nlm.nih.gov',summary:'美國國家醫學圖書館提供之免費醫學文獻資料庫，收錄 3,500 萬+篇文章。支援 MeSH 詞彙查詢、臨床查詢過濾器（RCT/系統回顧）。是醫學研究搜尋的基礎工具。',status:'有效'},
];
let refCatFilter = 'all';
