
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