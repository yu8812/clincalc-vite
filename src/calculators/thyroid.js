
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