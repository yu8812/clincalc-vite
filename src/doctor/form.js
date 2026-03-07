
function getDRData(){
  const age=getDRAge();
  const ht=v('dr_ht'),wt=v('dr_wt');
  const bmi=ht&&wt?+(wt/((ht/100)**2)).toFixed(1):null;
  return{
    pid:sv('dr_pid')||(getDobMode()==='text'?sv('dr_pid_b'):''),exam_date:sv('dr_exam'),dob:sv('dr_dob'),sex:getDRSex(),age,
    ht,wt,bmi,sbp:v('dr_sbp')||null,dbp:v('dr_dbp')||null,hr:v('dr_hr')||null,
    waist:v('dr_waist')||null,hip:v('dr_hip')||null,bf:v('dr_bf')||null,
    fpg:v('dr_fpg')||null,hba1c:v('dr_hba1c')||null,ins:v('dr_ins')||null,cpep:v('dr_cpep')||null,
    tc:v('dr_tc')||null,tg:v('dr_tg')||null,ldl:v('dr_ldl')||null,hdl:v('dr_hdl')||null,
    ast:v('dr_ast')||null,alt:v('dr_alt')||null,cr:v('dr_cr')||null,
    egfr_calc:v('dr_cr')&&age&&getDRSex()?+(calcEGFR(v('dr_cr'),age,getDRSex())||0).toFixed(1):null,
    uacr:v('dr_uacr')||null,upcr:v('dr_upcr')||null,dip:sv('dr_dip'),
    ua:v('dr_ua')||null,bun:v('dr_bun')||null,k:v('dr_k')||null,
    hb:v('dr_hb')||null,wbc:v('dr_wbc')||null,plt:v('dr_plt')||null,mcv:v('dr_mcv')||null,hct:v('dr_hct')||null,
    hbsag:sv('dr_hbsag'),hcv:sv('dr_hcv'),hbsab:sv('dr_hbsab'),
    tsh:v('dr_tsh')||null,ft4:v('dr_ft4')||null,ca:v('dr_ca')||null,p:v('dr_p')||null,pth:v('dr_pth')||null,vitd:v('dr_vitd')||null,
    acs:sv('dr_acs')==='yes',cabg:sv('dr_cabg')==='yes',cvd:sv('dr_cvd')==='yes',
    dm:sv('dr_dm')==='yes',hl:sv('dr_hl')==='yes',htn:sv('dr_htn')==='yes',
    age_rf:sv('dr_agerf')==='yes',fh:sv('dr_fh')==='yes',smoke:sv('dr_smoke')==='yes',ckd:sv('dr_ckd')==='yes',
    edu:sv('dr_edu'),job:sv('dr_job'),eth:sv('dr_eth'),mar:sv('dr_mar'),
    etoh:sv('dr_etoh'),ex:sv('dr_ex'),diet:sv('dr_diet'),sleep:v('dr_sleep')||null,stress:sv('dr_stress'),
    sleep_work:v('dr_sleep_work')||null,
    smoke_detail:sv('dr_smoke_detail'),smoke_yrs:v('dr_smoke_yrs')||null,
    betel:sv('dr_betel'),
    ppg:v('dr_ppg')||null,
    fasting_hr:sv('dr_fasting'),
    ibw:sv('dr_ibw'),
    symptoms:sv('dr_symptoms'),pmh:sv('dr_pmh'),meds:sv('dr_meds'),allergy:sv('dr_allergy'),
    va_r:sv('dr_va_r'),va_l:sv('dr_va_l'),
    hear_r:sv('dr_hear_r'),hear_l:sv('dr_hear_l'),pe_note:sv('dr_pe_note'),
    ecg:sv('dr_ecg'),ecg_note:sv('dr_ecg_note'),
    xray:sv('dr_xray'),xray_note:sv('dr_xray_note'),
    oral:sv('dr_oral'),
    urine_color:sv('dr_urine_color'),urine_ph:v('dr_urine_ph')||null,urine_sg:v('dr_urine_sg')||null,
    urine_glu:sv('dr_urine_glu'),urine_ket:sv('dr_urine_ket'),urine_le:sv('dr_urine_le'),urine_nit:sv('dr_urine_nit'),
    urine_rbc:sv('dr_urine_rbc'),urine_wbc_m:sv('dr_urine_wbc_m'),urine_note:sv('dr_urine_note'),
    cea:v('dr_cea')||null,afp:v('dr_afp')||null,ca125:v('dr_ca125')||null,ca199:v('dr_ca199')||null,psa:v('dr_psa')||null,
    note:sv('dr_note'),doctor:sv('dr_docid')||drDocId,
  };
}

function judgeDR(d){
  const results=[];
  // 1. MetS
  const ms_w=d.waist>0&&(d.sex==='male'?d.waist>=90:d.waist>=80);
  const ms_t=d.tg>=150,ms_h=d.hdl>0&&(d.sex==='male'?d.hdl<40:d.hdl<50);
  const ms_b=d.sbp>=130||d.dbp>=85,ms_d=d.dm||d.fpg>=100||d.hba1c>=5.7;
  const msC=[ms_w,ms_t,ms_h,ms_b,ms_d].filter(Boolean).length;
  const msQ=ms_w&&msC>=3;
  results.push({name:'🏥 健保代謝症候群防治計畫 收案資格',qualified:msQ,partial:!ms_w&&msC>=3,
    items:[
      {ok:ms_w,text:`腹部肥胖（男≥90/女≥80 cm）— 現值：${d.waist||'未填'} cm`+(ms_w?' ✓':'')},
      {ok:ms_t,text:`TG ≥150 mg/dL — 現值：${d.tg||'未填'}${ms_t?' ✓':''}`},
      {ok:ms_h,text:`HDL 男&lt;40/女&lt;50 — 現值：${d.hdl||'未填'}${ms_h?' ✓':''}`},
      {ok:ms_b,text:`BP ≥130/85 mmHg — 現值：${d.sbp||'—'}/${d.dbp||'—'}${ms_b?' ✓':''}`},
      {ok:ms_d,text:`FPG ≥100 / HbA1c ≥5.7 / 糖尿病 — ${d.fpg||d.hba1c||'—'}${ms_d?' ✓':''}`},
    ],
    note:msQ?`✓ 符合收案（腹圍必備+${msC}項）`:`腰圍：${ms_w?'✓符合':'✗未達'} | 符合${msC}/5項，需腰圍+任意3項`
  });
  // 2. Early CKD
  const egfr=d.egfr_calc||null;
  const ckd_g3=egfr!==null&&egfr>=30&&egfr<60;
  const ckd_prot=d.uacr>=30||d.upcr>=150||(d.dip&&['1+','2+','3+'].includes(d.dip));
  const ckd_rf=d.dm||d.htn||d.ckd;
  const ckdQ=ckd_g3||(egfr!==null&&egfr<90&&ckd_prot&&ckd_rf);
  results.push({name:'🫘 初期慢性腎臟病（Early CKD）照護計畫 收案資格',qualified:ckdQ,partial:ckd_prot&&!ckd_g3,
    items:[
      {ok:ckd_g3,text:`eGFR 30-59（G3a/G3b）— 現值：${egfr?egfr.toFixed(1):'未填（需Cr/年齡/性別）'}`+(ckd_g3?' ✓':'')},
      {ok:ckd_prot,text:`持續蛋白尿 UACR≥30/UPCR≥150/試紙1+ — UACR:${d.uacr||'—'} 試紙:${d.dip||'—'}`+(ckd_prot?' ✓':'')},
      {ok:ckd_rf,warn:!ckd_rf,text:`合併危險因子（糖尿病/高血壓/CKD）— ${[d.dm&&'糖尿病',d.htn&&'高血壓',d.ckd&&'CKD'].filter(Boolean).join('/')||'未填'}`+(ckd_rf?' ✓':'')},
    ],
    note:ckdQ?`✓ 符合收案。建議每3月追蹤eGFR/UACR/血壓/K+`:`eGFR ${egfr?egfr.toFixed(1):'未知'}，${ckd_prot?'有蛋白尿':'無明顯蛋白尿'}，${ckd_rf?'有危險因子':'無危險因子'}`
  });
  // 3. Statin
  const rf_htn=d.htn,rf_age=d.age_rf,rf_fh=d.fh,rf_hdl=d.hdl>0&&d.hdl<40,rf_smoke=d.smoke;
  const rfC=[rf_htn,rf_age,rf_fh,rf_hdl,rf_smoke].filter(Boolean).length;
  const c1=d.acs||d.cabg||d.cvd;
  const c2=d.dm&&d.ldl>=100;
  const c3a=d.hl&&rfC>=2&&d.ldl>=130;
  const c3b=d.hl&&rfC<=1&&d.ldl>=160;
  const lipidQ=c1||c2||c3a||c3b;
  let ldl_tgt='';
  if(c1)ldl_tgt='LDL 目標 &lt;70 mg/dL（極高危）';
  else if(c2)ldl_tgt='LDL 目標 &lt;100 mg/dL（糖尿病）';
  else if(c3a||c3b)ldl_tgt='LDL 目標 &lt;130 mg/dL';
  results.push({name:'💊 全民健保降膽固醇藥物（Statin）開立條件',qualified:lipidQ,partial:false,
    items:[
      {ok:c1,text:`條件一：ACS/冠狀動脈介入/心血管疾病 — ${[d.acs&&'ACS',d.cabg&&'CABG',d.cvd&&'CVD'].filter(Boolean).join('/')||'否'}`+(c1?' ✓':'')},
      {ok:c2,text:`條件二：糖尿病+LDL≥100 — DM:${d.dm?'是':'否'} LDL:${d.ldl||'—'}`+(c2?' ✓':'')},
      {ok:c3a,text:`條件三A：高血脂症+≥2危險因子+LDL≥130 — RF:${rfC}個 LDL:${d.ldl||'—'}`+(c3a?' ✓':'')},
      {ok:c3b,text:`條件三B：高血脂症+≤1危險因子+LDL≥160 — RF:${rfC}個 LDL:${d.ldl||'—'}`+(c3b?' ✓':'')},
      {ok:false,warn:true,text:`危險因子（${rfC}/5）：${[rf_htn&&'高血壓',rf_age&&'年齡',rf_fh&&'家族史',rf_hdl&&'HDL&lt;40',rf_smoke&&'吸菸'].filter(Boolean).join('、')||'無'}`},
    ],
    note:lipidQ?`✓ 符合健保Statin開立條件。${ldl_tgt}`:`目前不符合。LDL:${d.ldl||'—'} 危險因子${rfC}個`
  });
  return results;
}

// ─── HEALTH REPORT GENERATOR ────────────────────────────────────
function generateHealthReport(d){
  const items = [];
  const bmi = d.bmi;
  const sex = d.sex;
  const age = d.age;

  // ── BMI & 體重 ──
  if(bmi){
    let cat='',rec='';
    if(bmi<18.5){cat='體重過輕';rec='建議增加熱量攝取，可諮詢營養師。';}
    else if(bmi<24){cat='正常體重';rec='維持現有飲食及運動習慣，定期追蹤。';}
    else if(bmi<27){cat='過重';rec='建議每週150分鐘以上中強度運動，減少精緻澱粉及含糖飲料。';}
    else if(bmi<30){cat='輕度肥胖';rec='建議積極減重，目標每月0.5-1kg，可考慮就醫評估。';}
    else{cat='中重度肥胖';rec='建議就醫評估，考慮代謝症候群篩檢，必要時轉介肥胖症門診。';}
    items.push({icon:'⚖️',title:`BMI ${bmi}（${cat}）`,rec,level:bmi>=30?'danger':bmi>=27?'warn':bmi<18.5?'warn':'ok'});
  }

  // ── 血壓 ──
  if(d.sbp){
    let cat='',rec='';
    if(d.sbp>=180||d.dbp>=120){cat='高血壓危象';rec='立即就醫！避免激烈活動。';}
    else if(d.sbp>=140||d.dbp>=90){cat='高血壓二期';rec='建議就醫，限鈉（<6g/天）、DASH飲食、規律運動、戒菸。';}
    else if(d.sbp>=130){cat='高血壓一期';rec='生活型態介入：每週150分鐘有氧運動、限鈉、控制體重。';}
    else if(d.sbp>=120){cat='血壓偏高';rec='加強生活型態改善，3-6個月後追蹤。';}
    else{cat='正常';rec='維持健康生活型態。';}
    items.push({icon:'🩺',title:`血壓 ${d.sbp}/${d.dbp||'—'} mmHg（${cat}）`,rec,level:d.sbp>=140||d.dbp>=90?'danger':d.sbp>=130?'warn':'ok'});
  }

  // ── 血糖 ──
  if(d.fpg||d.hba1c){
    const fpg=d.fpg||0,hba1c=d.hba1c||0;
    let title='',rec='',level='ok';
    if(fpg>=126||hba1c>=6.5){title=`血糖異常（FPG:${fpg||'—'} HbA1c:${hba1c||'—'}%）`;rec='建議就醫確認糖尿病診斷，評估飲食控制、運動及藥物治療。';level='danger';}
    else if(fpg>=100||hba1c>=5.7){title=`前期糖尿病（FPG:${fpg||'—'} HbA1c:${hba1c||'—'}%）`;rec='生活介入可降低50-60%進展風險：體重減7%、每週≥150分鐘運動、地中海式飲食。';level='warn';}
    else{title=`血糖正常（FPG:${fpg||'—'} HbA1c:${hba1c||'—'}%）`;rec='維持健康飲食，定期追蹤。';}
    items.push({icon:'🍬',title,rec,level});
  }
  if(d.ppg){
    let ppgRec='',ppgLevel='ok';
    if(d.ppg>=200){ppgRec='飯後血糖≥200，符合糖尿病診斷（需無症狀者複查）。建議就醫。';ppgLevel='danger';}
    else if(d.ppg>=140){ppgRec='飯後血糖偏高（前期）：減少高GI食物，飯後散步15-30分鐘有助降低。';ppgLevel='warn';}
    else ppgRec='飯後血糖正常。';
    items.push({icon:'🍚',title:`飯後血糖 ${d.ppg} mg/dL`,rec:ppgRec,level:ppgLevel});
  }

  // ── 血脂 ──
  if(d.ldl){
    let ldlRec='',level='ok';
    if(d.ldl>=190){ldlRec='LDL極高，需排除家族性高膽固醇血症，建議就醫評估Statin治療。';level='danger';}
    else if(d.ldl>=160){ldlRec='LDL偏高：減少飽和脂肪（紅肉、加工品）、增加Omega-3、規律運動。';level='warn';}
    else if(d.ldl>=130){ldlRec='LDL稍高：飲食調整，依心血管風險決定是否用藥。';}
    else ldlRec='LDL在目標範圍內。';
    items.push({icon:'🩸',title:`LDL ${d.ldl} mg/dL`,rec:ldlRec,level});
  }
  if(d.tg&&d.tg>=150){
    let tgRec='',level='warn';
    if(d.tg>=500){tgRec='TG≥500 急性胰臟炎風險！立即就醫，嚴禁飲酒。';level='danger';}
    else if(d.tg>=200){tgRec='戒酒、減少糖分（含糖飲料、精緻澱粉）、增加Omega-3脂肪酸。';level='warn';}
    else tgRec='TG偏高：少糖少酒，規律運動。';
    items.push({icon:'🧈',title:`三酸甘油酯 ${d.tg} mg/dL`,rec:tgRec,level});
  }

  // ── 腎功能 ──
  if(d.egfr_calc){
    let st='',rec='',level='ok';
    if(d.egfr_calc<15){st='G5腎衰竭';rec='立即就醫，評估腎臟替代療法（洗腎/移植）。';level='danger';}
    else if(d.egfr_calc<30){st='G4重度';rec='腎臟科追蹤，準備腎替代療法，嚴格控制血壓/血糖/血脂。';level='danger';}
    else if(d.egfr_calc<60){st='G3中度';rec='每3-6個月追蹤eGFR/UACR，控制血壓<130/80，評估SGLT2i使用。';level='warn';}
    else if(d.egfr_calc<90){st='G2輕度';rec='定期追蹤，留意蛋白尿，控制糖尿病/高血壓等危險因子。';}
    else{st='G1正常';rec='維持健康生活型態，每年追蹤。';}
    items.push({icon:'🫘',title:`eGFR ${d.egfr_calc.toFixed(1)} mL/min（${st}）`,rec,level});
  }

  // ── 抽菸 ──
  if(d.smoke_detail&&d.smoke_detail!=='never'&&d.smoke_detail!=='ex'&&d.smoke_detail!==''){
    items.push({icon:'🚬',title:`抽菸（${d.smoke_detail}）`,rec:'建議戒菸！戒菸後1年冠心病風險減半，10年後接近不吸菸者。可利用戒菸門診（健保補助）、尼古丁替代療法。',level:'danger'});
  }

  // ── 飲酒 ──
  if(d.etoh==='heavy'){
    items.push({icon:'🍺',title:'重度飲酒',rec:'建議減少飲酒至每週≤14標準杯（男性），或每週≤7杯（女性）。過量飲酒增加肝病、心血管疾病、癌症風險。可諮詢成癮醫學門診。',level:'danger'});
  } else if(d.etoh==='mild'){
    items.push({icon:'🍺',title:'輕度飲酒',rec:'目前飲酒量尚可，建議勿空腹飲酒，避免與藥物併用。',level:'warn'});
  }

  // ── 檳榔 ──
  if(d.betel&&d.betel!=='never'&&d.betel!==''){
    items.push({icon:'🌿',title:`嚼檳榔（${d.betel}）`,rec:'建議立即戒除！檳榔為第一類致癌物，顯著增加口腔癌、食道癌、咽喉癌風險。口腔黏膜需定期檢查。',level:'danger'});
  }

  // ── 睡眠 ──
  if(d.sleep&&(d.sleep<6||d.sleep>9)){
    const too=d.sleep<6?'睡眠不足':'睡眠過多';
    const rec=d.sleep<6?'慢性睡眠不足增加代謝症候群、心血管疾病風險。建議每日7-9小時，固定作息，避免睡前使用3C。':'睡眠過多可能為憂鬱或其他疾病徵兆，建議就醫評估。';
    items.push({icon:'😴',title:`${too}（${d.sleep}hr/天）`,rec,level:'warn'});
  }

  // ── 運動 ──
  if(d.ex==='none'){
    items.push({icon:'🏃',title:'幾乎不運動',rec:'建議每週至少150分鐘中強度有氧運動（快走、游泳、騎腳踏車），並加入每週2次肌力訓練。規律運動可降低心血管疾病、糖尿病、癌症風險30-50%。',level:'warn'});
  }

  // ── X光 ──
  if(d.xray&&d.xray!=='正常'&&d.xray!==''){
    const serious=['肺結節','肺浸潤','心臟擴大','胸腔積液'];
    const isSerious=serious.includes(d.xray);
    items.push({icon:'📸',title:`X光：${d.xray}${d.xray_note?' ('+d.xray_note+')':''}`,rec:isSerious?`建議就醫進一步評估，可能需要CT等影像學檢查。${d.xray_note||''}`:`建議追蹤，${d.xray_note||'請依醫師指示'}`,level:isSerious?'danger':'warn'});
  }

  // ── ECG ──
  if(d.ecg&&d.ecg!=='正常'&&d.ecg!==''){
    const serious=['心房顫動','ST變化'];
    const isSerious=serious.includes(d.ecg);
    items.push({icon:'💓',title:`心電圖：${d.ecg}${d.ecg_note?' ('+d.ecg_note+')':''}`,rec:isSerious?'建議心臟科就診，評估進一步檢查及治療。':'建議追蹤，依症狀及臨床判斷。',level:isSerious?'danger':'warn'});
  }

  // ── 腫瘤標記 ──
  const tm=[];
  if(d.cea>5)tm.push(`CEA ${d.cea}（正常<5）`);
  if(d.afp>20)tm.push(`AFP ${d.afp}（正常<20）`);
  if(d.ca125>35)tm.push(`CA-125 ${d.ca125}（正常<35）`);
  if(d.ca199>37)tm.push(`CA 19-9 ${d.ca199}（正常<37）`);
  if(d.psa>4)tm.push(`PSA ${d.psa}（正常<4）`);
  if(tm.length){
    items.push({icon:'🔬',title:`腫瘤標記異常：${tm.join('、')}`,rec:'腫瘤標記升高需結合臨床症狀與影像判讀，不代表罹癌。建議就醫複查並追蹤，必要時轉介腫瘤科或相關科別。',level:'warn'});
  }

  return items;
}

function renderHealthReport(d){
  const items=generateHealthReport(d);
  if(!items.length)return '';
  const colorMap={danger:'var(--rose)',warn:'var(--amber)',ok:'var(--teal)'};
  const bgMap={danger:'rgba(244,63,94,.07)',warn:'rgba(245,158,11,.07)',ok:'rgba(0,201,167,.05)'};
  let html=`<div class="card" style="margin-top:16px;border-color:rgba(167,139,250,.2);">
    <div style="font-family:var(--ff-h);font-size:16px;font-weight:700;margin-bottom:14px;color:var(--violet);">📋 健康判讀報告</div>`;
  items.forEach(item=>{
    html+=`<div style="padding:12px 14px;border-radius:8px;margin-bottom:10px;background:${bgMap[item.level]||bgMap.ok};border-left:3px solid ${colorMap[item.level]||colorMap.ok};">
      <div style="font-weight:600;font-size:13px;margin-bottom:5px;">${item.icon} ${item.title}</div>
      <div style="font-size:12.5px;color:var(--t2);line-height:1.7;">💡 ${item.rec}</div>
    </div>`;
  });
  const dangerous=items.filter(i=>i.level==='danger').length;
  const warns=items.filter(i=>i.level==='warn').length;
  html+=`<div style="margin-top:14px;padding:10px 14px;background:var(--c2);border-radius:7px;font-size:12px;color:var(--t2);">
    <strong>摘要：</strong>發現 <span style="color:var(--rose);">${dangerous} 項需關注</span>、<span style="color:var(--amber);">${warns} 項建議改善</span>、${items.filter(i=>i.level==='ok').length} 項正常。
  </div>`;
  html+=`</div>`;
  return html;
}

async function runDR(withAI){
  const key=(document.getElementById('dr_api')?.value||localStorage.getItem('cc_key'));
  const d=getDRData();
  showLoad(withAI?'AI 醫師判讀中...':'規則判讀中...');
  try{
    const qualify=judgeDR(d);
    let html='';
    if(d.pid)html+=`<div class="al ad" style="margin-bottom:10px;">📋 受檢者：${d.pid}　日期：${d.exam_date||'—'}　性別：${d.sex==='male'?'男性':d.sex==='female'?'女性':'—'}　年齡：${d.age||'—'}歲　eGFR：${d.egfr_calc||'—'}</div>`;
    qualify.forEach(q=>{
      const ok=q.qualified,pt=q.partial;
      html+=`<div class="qbox" style="border-left-color:${ok?'var(--teal)':pt?'var(--amber)':'var(--t3)'};">
        <div class="qhead"><div class="qtit">${q.name}</div><span class="tag ${ok?'tt':pt?'ta':''}">${ok?'✓ 符合':pt?'⚠️ 部分符合':'✗ 不符合'}</span></div>
        <div class="qis">${q.items.map(i=>`<div class="qi"><div class="qdot ${i.ok?'qok':i.warn?'qwarn':'qno'}"></div><div>${i.text}</div></div>`).join('')}</div>
        ${q.note?`<div class="qnote">${q.note}</div>`:''}
      </div>`;
    });
    // Quick summary
    if(d.egfr_calc||d.fpg||d.ldl){
      const {s:st}=d.egfr_calc?getStage(d.egfr_calc):{s:''};
      html+=`<div class="card" style="margin-top:12px;"><div class="ch">關鍵數值快覽</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:9px;">${[
        d.bmi?`<div class="rcell"><div class="rl">BMI</div><div class="rv ${d.bmi>=27?'ca':'ct'}">${d.bmi}</div></div>`:'',
        d.egfr_calc?`<div class="rcell"><div class="rl">eGFR</div><div class="rv ${d.egfr_calc<60?'cr':d.egfr_calc<90?'ca':'ct'}">${d.egfr_calc}</div><div class="rs">${st}</div></div>`:'',
        d.hba1c?`<div class="rcell"><div class="rl">HbA1c</div><div class="rv ${d.hba1c>=6.5?'cr':d.hba1c>=5.7?'ca':'ct'}">${d.hba1c}%</div></div>`:'',
        d.ldl?`<div class="rcell"><div class="rl">LDL</div><div class="rv ${d.ldl>=190?'cr':d.ldl>=130?'ca':'ct'}">${d.ldl}</div></div>`:'',
        d.sbp?`<div class="rcell"><div class="rl">BP</div><div class="rv ${d.sbp>=140?'cr':d.sbp>=130?'ca':'ct'}">${d.sbp}/${d.dbp}</div></div>`:'',
      ].filter(Boolean).join('')}</div></div>`;
    }
    html += renderHealthReport(d);
    document.getElementById('dr-qualify').innerHTML=html;
    if(withAI){
      if(!key){document.getElementById('dr-ai').innerHTML=al('ay','未設定 API Key，無法使用 AI 醫師。請至「系統設定」填入。');hideLoad();document.getElementById('rp-dr').classList.add('on');document.getElementById('rp-dr').scrollIntoView({behavior:'smooth'});return;}
      const prompt=`你是台灣家醫科/腎臟科AI醫師（繁體中文），分析健檢資料並提供專業建議。所有建議需標示「AI建議」字樣。
健檢資料：${JSON.stringify(d,null,0)}
判讀結果：${qualify.map(q=>q.name+'：'+(q.qualified?'符合':'不符合')).join('；')}
請提供：1.整體健康風險評估（2-3句）2.最需關注的3個問題 3.具體生活及用藥建議3條 4.建議追蹤項目及頻率
JSON：{"overall":"整體評估","top3":["問題1","問題2","問題3"],"lifestyle":["AI建議1","AI建議2","AI建議3"],"follow_up":["追蹤1頻率","追蹤2頻率","追蹤3頻率"],"urgent":null或"緊急就醫原因"}`;
      const r=await callClaude(key,prompt,1500);
      const j=parseJ(r);
      if(j){
        document.getElementById('dr-ai').innerHTML=`<div class="aiblock" style="border-color:rgba(167,139,250,.3);">
          <div class="aih" style="color:var(--violet);">🤖 AI 醫師總評（僅供醫師參考，標示「AI建議」）</div>
          ${j.urgent?`<div class="al ar" style="margin-bottom:12px;">⚠️ AI 建議立即就醫：${j.urgent}</div>`:''}
          <div style="font-size:13px;color:var(--t1);margin-bottom:12px;line-height:1.8;">${j.overall||''}</div>
          ${j.top3?.length?`<div style="font-family:var(--ff-m);font-size:9px;letter-spacing:1px;color:var(--t3);text-transform:uppercase;margin:12px 0 8px;">最需關注問題</div>${j.top3.map(t=>`<div class="aipt"><div class="aidot"></div>${t}</div>`).join('')}`:''}
          ${j.lifestyle?.length?`<div style="font-family:var(--ff-m);font-size:9px;letter-spacing:1px;color:var(--t3);text-transform:uppercase;margin:12px 0 8px;">生活及用藥建議（AI建議）</div>${j.lifestyle.map(t=>`<div class="aipt"><div class="aidot"></div>${t}</div>`).join('')}`:''}
          ${j.follow_up?.length?`<div style="font-family:var(--ff-m);font-size:9px;letter-spacing:1px;color:var(--t3);text-transform:uppercase;margin:12px 0 8px;">建議追蹤（AI建議）</div>${j.follow_up.map(t=>`<div class="aipt"><div class="aidot" style="background:var(--amber);"></div>${t}</div>`).join('')}`:''}
        </div>`;
      }else{document.getElementById('dr-ai').innerHTML=al('ay','AI 回應解析失敗，請再試一次');}
    }else document.getElementById('dr-ai').innerHTML='';
    document.getElementById('rp-dr').classList.add('on');
    document.getElementById('rp-dr').scrollIntoView({behavior:'smooth'});
  }catch(e){showToast('判讀失敗：'+e.message, 'warn');}finally{hideLoad();}
}


// ══════════════════════════════════════════════════════════════
//  💊  藥物分析模組
//  函式列表：
//    toggleDaTag()       — 快選重點 tag 的切換
//    autoFillDaMeds()    — 從健檢表單帶入用藥
//    runDrugAnalysis()   — 主分析流程（呼叫 AI）
//    renderDrugResult()  — 解析 JSON 並渲染結果
//    clearDrugAnalysis() — 清除結果
// ══════════════════════════════════════════════════════════════

/** 切換「分析重點」快選 tag */