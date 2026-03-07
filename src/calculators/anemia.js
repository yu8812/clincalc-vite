
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