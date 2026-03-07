
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