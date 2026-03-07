
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