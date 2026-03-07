
function calcSens(){
  let tp=v('s_tp'),fp=v('s_fp'),fn=v('s_fn'),tn=v('s_tn');
  const se_d=v('s_se'),sp_d=v('s_sp'),prev=v('s_prev');
  let se,sp,n=null;
  if(tp+fp+fn+tn>0){n=tp+fp+fn+tn;se=tp/(tp+fn);sp=tn/(tn+fp);}
  else if(se_d>0&&sp_d>0){se=se_d/100;sp=sp_d/100;}
  else{showToast('請輸入混淆矩陣或靈敏度/特異度', 'warn');return;}
  const lr_p=se/(1-sp),lr_n=(1-se)/sp,youden=se+sp-1;
  const acc=n?((tp||0)+(tn||0))/n:null;
  let ppvb=null,npvb=null;
  if(prev>0){const p=prev/100;ppvb=se*p/(se*p+(1-sp)*(1-p));npvb=sp*(1-p)/(sp*(1-p)+(1-se)*p);}
  const ppv=n?tp/(tp+fp):null,npv=n?tn/(tn+fn):null;
  ['tp','fn','fp','tn'].forEach(k=>{const el=document.getElementById('cm-'+k),vals={tp,fn,fp,tn};if(el){const v2=vals[k];el.querySelector('div').textContent=v2!==null&&v2!==undefined?v2:'—';}});
  let c='';
  c+=cell('靈敏度 Se',pct(se),se>=0.9?'ct':se>=0.7?'ca':'cr',se>=0.9?'優（篩檢）':'');
  c+=cell('特異度 Sp',pct(sp),sp>=0.95?'ct':sp>=0.8?'ca':'cr',sp>=0.95?'優（確診）':'');
  if(ppv!==null)c+=cell('PPV',pct(ppv),ppv>=0.8?'ct':'ca');
  if(npv!==null)c+=cell('NPV',pct(npv),npv>=0.9?'ct':'ca');
  if(ppvb!==null)c+=cell(`PPV（盛行率${prev}%）`,pct(ppvb),ppvb>=0.8?'ct':'ca','貝氏修正');
  if(npvb!==null)c+=cell(`NPV（盛行率${prev}%）`,pct(npvb),npvb>=0.9?'ct':'ca','貝氏修正');
  c+=cell('LR+',fmt(lr_p,2),lr_p>=10?'ct':lr_p>=5?'ca':'cr',lr_p>=10?'強確診力':'');
  c+=cell('LR−',fmt(lr_n,3),lr_n<=0.1?'ct':lr_n<=0.2?'ca':'cr',lr_n<=0.1?'強排除力':'');
  c+=cell("Youden's J",fmt(youden,3),youden>=0.7?'ct':youden>=0.5?'ca':'cr');
  if(acc!==null)c+=cell('準確率',pct(acc),acc>=0.9?'ct':'ca');
  document.getElementById('sens-cells').innerHTML=c;
  document.getElementById('rp-sens').classList.add('on');
  document.getElementById('rp-sens').scrollIntoView({behavior:'smooth'});
}

// ─── AI CHECK ───
const SYMS_URGENT=['胸痛','呼吸困難','意識不清','大量出血'];
const SYMS_ALL=['頭痛','頭暈','胸痛','心悸','呼吸困難','咳嗽','發燒','腹痛','噁心嘔吐','腹瀉','便秘','血尿','水腫','疲勞','體重減輕','口渴多尿','視力模糊','手腳麻木','關節疼痛','皮膚黃染','失眠','頻尿','脫髮','皮疹','頸部僵硬','淋巴結腫大','意識不清','大量出血','盜汗','食慾不振','排便習慣改變','胸悶','背痛','小便顏色異常'];
(()=>{const c=document.getElementById('sym-tags');if(!c)return;c.innerHTML=SYMS_ALL.map(s=>{const u=SYMS_URGENT.includes(s);return`<span class="stag ${u?'urgent':''}" onclick="togSym(this,'${s}')">${u?'⚠️':''}${s}</span>`;}).join('');})();