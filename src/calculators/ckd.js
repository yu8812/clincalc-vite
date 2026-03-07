
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