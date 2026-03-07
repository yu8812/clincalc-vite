
function calcLiver(){
  const ast=v('lv_ast'),alt=v('lv_alt'),ggt=v('lv_ggt'),alp=v('lv_alp'),bili=v('lv_bili'),dbili=v('lv_dbili');
  const alb=v('lv_alb'),inr=v('lv_inr'),plt=v('lv_plt'),age=v('lv_age'),afp=v('lv_afp'),bmi=v('lv_bmi'),tp=v('lv_tp');
  const hbsag=sv('lv_hbsag'),hcv=sv('lv_hcv'),ascites=sv('lv_ascites'),he=sv('lv_he');
  const ratio=ast>0&&alt>0?ast/alt:null;
  if(ratio)document.getElementById('lv_ratio').value=fmt(ratio,2);
  let fib4=null,apri=null,cp=0;
  if(ast>0&&alt>0&&plt>0&&age>0)fib4=(age*ast)/(plt*Math.sqrt(alt));
  if(ast>0&&plt>0)apri=(ast/40)/(plt/100);
  if(bili>0||alb>0||inr>0){
    cp+=(bili<2?1:bili<=3?2:3);
    if(alb>0)cp+=(alb>3.5?1:alb>=2.8?2:3);
    if(inr>0)cp+=(inr<1.7?1:inr<=2.2?2:3);
    cp+=(ascites==='none'?1:ascites==='mild'?2:3);
    cp+=(he==='none'?1:he==='g12'?2:3);
  }
  const masld=bmi>=25&&(alt>40||ast>40)&&hbsag==='neg'&&hcv==='neg';
  let c='';
  if(ast>0)c+=cell('AST',`${ast} IU/L`,ast>400?'cr':ast>80?'ca':ast>40?'ca':'ct',ast>40?'偏高':'');
  if(alt>0)c+=cell('ALT',`${alt} IU/L`,alt>400?'cr':alt>80?'ca':alt>40?'ca':'ct',alt>40?'偏高':'');
  if(ratio)c+=cell('AST/ALT',fmt(ratio,2),ratio>2?'ca':'ct',ratio>2?'酒精性/肝硬化？':'');
  if(fib4!==null)c+=cell('FIB-4',fmt(fib4,2),fib4>=3.25?'cr':fib4>=1.30?'ca':'ct',fib4>=3.25?'高纖維化':fib4>=1.30?'不確定':'低風險');
  if(apri!==null)c+=cell('APRI',fmt(apri,2),apri>=2?'cr':apri>=1?'ca':'ct',apri>=2?'顯著纖維化':'');
  if(cp>0)c+=cell('Child-Pugh',`${cp}分 ${cp<=6?'A':cp<=9?'B':'C'}`,cp>=10?'cr':cp>=7?'ca':'ct');
  if(bili>0)c+=cell('T-Bili',`${bili} mg/dL`,bili>3?'cr':bili>1.2?'ca':'ct');
  if(alb>0)c+=cell('Albumin',`${alb} g/dL`,alb<3.5?'ca':'ct',alb<3.5?'肝合成↓':'');
  if(inr>0)c+=cell('INR',fmt(inr,2),inr>1.5?'cr':inr>1.2?'ca':'ct',inr>1.5?'凝血↓':'');
  if(afp>0)c+=cell('AFP',`${afp}`,afp>20?'cr':afp>7?'ca':'ct',afp>20&&hbsag==='pos'?'⚠️HCC風險':'');
  if(masld)c+=cell('MASLD','風險升高','ca','BMI≥25+肝酵素↑+無B/C肝');
  document.getElementById('liver-cells').innerHTML=c;
  let a='';
  if(alt>400||ast>400)a+=al('ar','⚠️ 肝酵素急升 — AI 建議立即就醫，急性肝炎/藥物性損傷');
  if(inr>2.0)a+=al('ar',`⚠️ INR ${inr} — AI 建議立即就醫，嚴重凝血障礙`);
  if(afp>200&&hbsag==='pos')a+=al('ar',`⚠️ AFP ${afp}+HBsAg+ — HCC 風險，AI 建議就醫`);
  if(fib4!==null&&fib4>=3.25)a+=al('ay',`⚠️ FIB-4 ${fmt(fib4,2)} — 高纖維化，建議胃鏡/肝臟超音波`);
  if(hbsag==='pos')a+=al('ai','📋 HBsAg+：定期HBV DNA、腹部超音波。評估抗病毒治療（台灣健保給付）');
  if(hcv==='pos')a+=al('ai','📋 Anti-HCV+：確認HCV RNA，DAA療程（台灣健保12週療程）');
  if(masld)a+=al('ay','MASLD（代謝相關脂肪肝）：生活型態介入、控制體重，FIB-4評估纖維化程度');
  document.getElementById('liver-alerts').innerHTML=a;
  document.getElementById('rp-liver').classList.add('on');
  document.getElementById('rp-liver').scrollIntoView({behavior:'smooth'});
}

// ─── THYROID ───