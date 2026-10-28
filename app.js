'use strict';
const KEY='moneyapp.v1';
const CATS=[['food','อาหาร','🍜','#FF8A65','#FFF0E8'],['travel','เดินทาง','🚇','#4DB6AC','#E6F7F5'],['home','ที่พัก','🏠','#6C8CFF','#EAF0FF'],['util','ค่าน้ำไฟ','💡','#FFC94D','#FFF8E1'],['shop','ช้อปปิ้ง','🛍️','#B39DDB','#F3EEFF'],['other','อื่นๆ','📦','#90A4AE','#EEF1F5']];
const CAT=Object.fromEntries(CATS.map(c=>[c[0],c]));
let S=load();let view='home';
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.tx)return norm(d)}catch(e){}return{tx:[],loans:[],pin:null}}
function norm(d){return{tx:Array.isArray(d.tx)?d.tx:[],loans:Array.isArray(d.loans)?d.loans:[],pin:d.pin||null}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
const $=s=>document.querySelector(s);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok'}).format(new Date());
const baht=n=>'฿'+Number(n).toLocaleString('th-TH',{maximumFractionDigits:2});
const thDate=iso=>new Date(iso+'T12:00:00+07:00').toLocaleDateString('th-TH-u-ca-buddhist',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Bangkok'});
const thMonth=iso=>new Date(iso+'T12:00:00+07:00').toLocaleDateString('th-TH-u-ca-buddhist',{month:'long',year:'numeric',timeZone:'Asia/Bangkok'});
const ym=()=>today().slice(0,7);
const paid=l=>l.payments.reduce((a,p)=>a+p.amount,0);
function toast(m){const t=$('#toast');t.textContent=m;t.classList.remove('hide');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.add('hide'),1800)}
function txRow(t){const inc=t.type==='inc';const c=inc?['','รายรับ','💼','','#E7F8EF']:(CAT[t.cat]||CAT.other);
 return `<div class="row"><div class="ic" style="background:${c[4]}">${c[2]}</div><div class="f1"><b>${esc(t.note||c[1])}</b><span>${c[1]} · ${thDate(t.date)}</span></div><div class="${inc?'pos':'neg'}">${inc?'+':'-'}${baht(t.amount)}</div><button class="x" data-del="${t.id}" aria-label="ลบ">✕</button></div>`}
function sorted(a){return [...a].sort((x,y)=>y.date.localeCompare(x.date)||(y.ts||0)-(x.ts||0))}
function render(){document.querySelectorAll('.tab button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));
 $('#fab').classList.toggle('hide',view!=='home');$('#view').innerHTML=V[view]();window.scrollTo(0,0)}
const V={
home(){const m=ym();const tm=S.tx.filter(t=>t.date.startsWith(m));
 const inc=tm.filter(t=>t.type==='inc').reduce((a,t)=>a+t.amount,0),exp=tm.filter(t=>t.type==='exp').reduce((a,t)=>a+t.amount,0);
 const lp=S.loans.flatMap(l=>l.payments).filter(p=>p.date.startsWith(m)).reduce((a,p)=>a+p.amount,0);
 const by={};tm.filter(t=>t.type==='exp').forEach(t=>by[t.cat]=(by[t.cat]||0)+t.amount);
 let acc=0;const seg=CATS.filter(c=>by[c[0]]).map(c=>{const s=acc;acc+=by[c[0]]/exp*100;return `${c[3]} ${s}% ${acc}%`});
 const pie=exp?`<div style="display:flex;gap:16px;align-items:center"><div style="width:96px;height:96px;flex:none;border-radius:50%;background:conic-gradient(${seg.join(',')});display:flex;align-items:center;justify-content:center"><div style="width:56px;height:56px;border-radius:50%;background:#fff"></div></div><div style="font-size:13px;line-height:1.7">${CATS.filter(c=>by[c[0]]).map(c=>`<div><span style="color:${c[3]}">●</span> ${c[1]} ${Math.round(by[c[0]]/exp*100)}% · ${baht(by[c[0]])}</div>`).join('')}</div></div>`:'<div class="empty">ยังไม่มีรายจ่ายเดือนนี้ — กด + เพื่อเพิ่ม</div>';
 const rec=sorted(S.tx).slice(0,8);
 return `<div class="hd"><p>สวัสดี 👋 · ${thMonth(today())}</p><h1>ภาพรวมเดือนนี้</h1></div>
 <div class="card hero"><small>คงเหลือเดือนนี้</small><div class="big" id="balance">${baht(inc-exp-lp)}</div><div class="g3"><div>รายรับ<b>${baht(inc)}</b></div><div>รายจ่าย<b>${baht(exp)}</b></div><div>ผ่อนเงินกู้<b>${baht(lp)}</b></div></div></div>
 <div class="card"><div class="ttl">รายจ่ายตามหมวด</div>${pie}</div>
 <div class="card"><div class="ttl">รายการล่าสุด</div>${rec.length?rec.map(txRow).join(''):'<div class="empty">ยังไม่มีรายการ</div>'}</div>`},
income(){const l=sorted(S.tx.filter(t=>t.type==='inc'));const m=ym();const sm=l.filter(t=>t.date.startsWith(m)).reduce((a,t)=>a+t.amount,0);const all=l.reduce((a,t)=>a+t.amount,0);
 return `<div class="hd"><p>${thMonth(today())}</p><h1>รายรับ</h1></div><div class="card hero green"><small>รายรับเดือนนี้</small><div class="big">${baht(sm)}</div><small>รวมทั้งหมด ${baht(all)}</small></div>
 <div class="card"><button class="btn" data-act="addInc">+ เพิ่มรายรับ / เงินเดือน</button></div>
 <div class="card"><div class="ttl">ประวัติรายรับ</div>${l.length?l.map(txRow).join(''):'<div class="empty">ยังไม่มีรายรับ</div>'}</div>`},
loans(){const rem=S.loans.reduce((a,l)=>a+Math.max(0,l.principal-paid(l)),0);
 return `<div class="hd"><p>ติดตามหนี้และการผ่อน</p><h1>เงินกู้</h1></div><div class="card hero"><small>ยอดคงเหลือทั้งหมด</small><div class="big">${baht(rem)}</div><small>${S.loans.length} รายการ</small></div>
 <div class="card"><button class="btn" data-act="addLoan">+ เพิ่มเงินกู้</button></div>
 ${S.loans.length?S.loans.map(l=>{const p=paid(l),r=Math.max(0,l.principal-p),pc=Math.min(100,p/l.principal*100);
 return `<div class="card loan"><div class="ttl">${esc(l.name)} ${r<=0?'<span class="chip">ปิดแล้ว ✓</span>':`<span class="chip">ผ่อน ${baht(l.monthly||0)}/ด.</span>`}</div>
 <div class="bar"><i style="width:${pc}%"></i></div><div style="display:flex;justify-content:space-between;font-size:13px;color:#7A86A1"><span>จ่ายแล้ว ${baht(p)} (${Math.round(pc)}%)</span><span>จาก ${baht(l.principal)}</span></div>
 <div style="margin-top:6px">คงเหลือ <b class="neg remain">${baht(r)}</b></div>
 ${l.payments.length?`<div style="margin-top:6px">${[...l.payments].sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<div class="row" style="padding:5px 0"><div class="f1"><span>ชำระ ${thDate(x.date)}</span></div><div class="pos">${baht(x.amount)}</div><button class="x" data-delpay="${l.id}:${x.id}">✕</button></div>`).join('')}</div>`:''}
 <div style="display:flex;gap:8px"><button class="btn sm" data-pay="${l.id}">บันทึกการชำระ</button><button class="btn sm danger" style="width:auto;padding:9px 14px" data-delloan="${l.id}">ลบ</button></div></div>`}).join(''):'<div class="card"><div class="empty">ยังไม่มีเงินกู้</div></div>'}`},
settings(){return `<div class="hd"><p>ข้อมูลเก็บในเครื่องนี้เท่านั้น (ออฟไลน์)</p><h1>ตั้งค่า</h1></div>
 <div class="card"><div class="ttl">สำรองข้อมูล</div><button class="btn sec" data-act="expJson">⬇️ ส่งออก JSON (สำรองทั้งหมด)</button><button class="btn sec" data-act="expCsv">⬇️ ส่งออก CSV (เปิดใน Excel)</button><button class="btn sec" data-act="imp">⬆️ นำเข้า JSON</button><input type="file" id="impFile" accept=".json,application/json" class="hide"></div>
 <div class="card"><div class="ttl">รหัส PIN</div><div style="font-size:14px;color:#7A86A1">${S.pin?'เปิดใช้งานอยู่ — ต้องใส่ PIN ทุกครั้งที่เปิดแอป':'ยังไม่ได้ตั้ง PIN'}</div>${S.pin?'<button class="btn sec" data-act="pinOff">ปิด PIN</button>':'<button class="btn sec" data-act="pinOn">ตั้ง PIN 4 หลัก</button>'}</div>
 <div class="card"><div class="ttl">สถิติ</div><div style="font-size:14px">รายการรายรับ/รายจ่าย ${S.tx.length} · เงินกู้ ${S.loans.length}</div></div>
 <div class="card"><div class="ttl">ลบข้อมูล</div><button class="btn danger" id="delAll" data-act="delAll">🗑️ ลบข้อมูลทั้งหมด</button></div>
 <p style="text-align:center;color:#9AA3B8;font-size:12px;margin:8px 0">บันทึกการเงิน v1.0</p>`}};
function sheet(h){$('#sheetBody').innerHTML=h;$('#sheet').classList.remove('hide')}
function close(){$('#sheet').classList.add('hide')}
function keypadSheet(o){let a='',cat='food';
 const draw=()=>{$('#amt').textContent='฿'+(a||'0')};
 sheet(`<div class="ttl">${o.title}<button data-close>ปิด</button></div><div class="amt" id="amt">฿0</div>
 ${o.cats?`<div class="cats">${CATS.map(c=>`<button data-cat="${c[0]}" class="${c[0]===cat?'sel':''}"><i>${c[2]}</i>${c[1]}</button>`).join('')}</div>`:''}
 <label>บันทึก</label><input id="note" placeholder="${o.ph}" maxlength="60"><label>วันที่</label><input id="date" type="date" value="${today()}">
 <div class="keys">${['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k=>`<button data-k="${k}">${k}</button>`).join('')}</div><button class="btn" id="saveTx">บันทึก</button>`);
 $('#sheetBody').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.cat){cat=b.dataset.cat;document.querySelectorAll('.cats button').forEach(x=>x.classList.toggle('sel',x===b))}
  if(b.dataset.k){const k=b.dataset.k;if(k==='⌫')a=a.slice(0,-1);else if(k==='.'){if(!a.includes('.'))a=(a||'0')+'.'}else if(!/\.\d\d$/.test(a)&&a.length<10)a=a==='0'?k:a+k;draw()}
  if(b.dataset.close!==undefined)close();
  if(b.id==='saveTx'){const n=parseFloat(a);if(!(n>0))return toast('กรุณาใส่จำนวนเงิน');
   S.tx.push({id:uid(),type:o.type,amount:n,cat:o.cats?cat:null,note:$('#note').value.trim(),date:$('#date').value||today(),ts:Date.now()});save();close();render();toast('บันทึกแล้ว ✓')}}}
function formSheet(title,fields,onSave){sheet(`<div class="ttl">${title}<button data-close>ปิด</button></div>${fields.map(f=>`<label>${f[1]}</label><input id="f_${f[0]}" type="${f[2]}" ${f[2]==='number'?'inputmode="decimal" step="any" min="0"':''} value="${f[3]||''}" placeholder="${f[4]||''}">`).join('')}<button class="btn" id="saveF">บันทึก</button>`);
 $('#sheetBody').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.close!==undefined)close();
  if(b.id==='saveF'){const v={};fields.forEach(f=>v[f[0]]=$('#f_'+f[0]).value.trim());if(onSave(v)!==false){save();close();render();toast('บันทึกแล้ว ✓')}}}}
function dl(name,text,type){const b=new Blob([text],{type});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
const csvq=v=>{v=String(v??'');return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
function toCSV(){const r=[['ประเภท','วันที่ (พ.ศ.)','วันที่ ISO','หมวด/เงินกู้','บันทึก','จำนวนเงิน (บาท)']];
 sorted(S.tx).forEach(t=>r.push([t.type==='inc'?'รายรับ':'รายจ่าย',thDate(t.date),t.date,t.type==='inc'?'รายรับ':(CAT[t.cat]||CAT.other)[1],t.note,t.amount]));
 S.loans.forEach(l=>{r.push(['เงินกู้','','',l.name,'ยอดกู้ / คงเหลือ '+Math.max(0,l.principal-paid(l)),l.principal]);l.payments.forEach(p=>r.push(['ชำระเงินกู้',thDate(p.date),p.date,l.name,'',p.amount]))});
 return '\uFEFF'+r.map(x=>x.map(csvq).join(',')).join('\r\n')}
async function hash(p){if(crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('moneyapp:'+p));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}return 'p:'+p}
function pinPad(title,cb){const L=$('#lock');let p='';const draw=()=>{L.innerHTML=`<div style="font-size:40px">🔒</div><h2>${title}</h2><div class="dots">${[0,1,2,3].map(i=>`<i class="${i<p.length?'f':''}"></i>`).join('')}</div><div class="keys">${['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k=>k?`<button data-k="${k}">${k}</button>`:'<span></span>').join('')}</div>`};
 draw();L.classList.remove('hide');L.onclick=async e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k;if(k==='⌫')p=p.slice(0,-1);else if(p.length<4)p+=k;draw();if(p.length===4){const r=await cb(p);if(r){L.classList.add('hide');L.onclick=null}else{p='';draw();toast('PIN ไม่ถูกต้อง')}}}}
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||b.closest('#sheet')||b.closest('#lock'))return;const d=b.dataset;
 if(d.v){view=d.v;render();return}
 if(b.id==='fab')return keypadSheet({title:'เพิ่มรายจ่าย',type:'exp',cats:true,ph:'เช่น ข้าวมันไก่'});
 if(d.del){if(confirm('ลบรายการนี้?')){S.tx=S.tx.filter(t=>t.id!==d.del);save();render()}return}
 if(d.pay){const l=S.loans.find(x=>x.id===d.pay);return formSheet('บันทึกการชำระ · '+esc(l.name),[['amt','จำนวนเงิน (บาท)','number',l.monthly||''],['date','วันที่','date',today()]],v=>{const n=parseFloat(v.amt);if(!(n>0)){toast('กรุณาใส่จำนวนเงิน');return false}l.payments.push({id:uid(),amount:n,date:v.date||today()})})}
 if(d.delpay){const[li,pi]=d.delpay.split(':');const l=S.loans.find(x=>x.id===li);if(confirm('ลบการชำระนี้?')){l.payments=l.payments.filter(p=>p.id!==pi);save();render()}return}
 if(d.delloan){if(confirm('ลบเงินกู้นี้และประวัติการชำระ?')){S.loans=S.loans.filter(l=>l.id!==d.delloan);save();render()}return}
 switch(d.act){
 case 'addInc':return keypadSheet({title:'เพิ่มรายรับ',type:'inc',cats:false,ph:'เช่น เงินเดือน'});
 case 'addLoan':return formSheet('เพิ่มเงินกู้',[['name','ชื่อเงินกู้','text','','เช่น สินเชื่อรถยนต์'],['principal','ยอดเงินกู้ทั้งหมด (บาท)','number'],['monthly','ผ่อนต่อเดือน (บาท)','number']],v=>{const pr=parseFloat(v.principal);if(!v.name||!(pr>0)){toast('กรุณาใส่ชื่อและยอดเงินกู้');return false}S.loans.push({id:uid(),name:v.name,principal:pr,monthly:parseFloat(v.monthly)||0,payments:[],created:today()})});
 case 'expJson':dl('money-backup-'+today()+'.json',JSON.stringify({app:'moneyapp',version:1,exported:new Date().toISOString(),tx:S.tx,loans:S.loans},null,2),'application/json');return toast('ส่งออก JSON แล้ว');
 case 'expCsv':dl('money-'+today()+'.csv',toCSV(),'text/csv;charset=utf-8');return toast('ส่งออก CSV แล้ว');
 case 'imp':return $('#impFile').click();
 case 'delAll':if(confirm('ลบข้อมูลทั้งหมด? ไม่สามารถกู้คืนได้ (แนะนำให้ส่งออก JSON ก่อน)')){S={tx:[],loans:[],pin:S.pin};save();render();toast('ลบข้อมูลทั้งหมดแล้ว')}return;
 case 'pinOn':return pinPad('ตั้ง PIN ใหม่ 4 หลัก',async p=>{S.pin=await hash(p);save();render();toast('ตั้ง PIN แล้ว');return true});
 case 'pinOff':return pinPad('ใส่ PIN ปัจจุบัน',async p=>{if(await hash(p)!==S.pin)return false;S.pin=null;save();render();toast('ปิด PIN แล้ว');return true});
 }});
document.addEventListener('change',e=>{if(e.target.id!=='impFile')return;const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if(!Array.isArray(d.tx)||!Array.isArray(d.loans))throw 0;if(!confirm(`นำเข้า ${d.tx.length} รายการ และเงินกู้ ${d.loans.length} รายการ? ข้อมูลปัจจุบันจะถูกแทนที่`))return;S={tx:d.tx,loans:d.loans,pin:S.pin};save();render();toast('นำเข้าข้อมูลแล้ว ✓')}catch(x){toast('ไฟล์ไม่ถูกต้อง')}});e.target.value=''});
$('#sheet').addEventListener('click',e=>{if(e.target.classList.contains('sheet-bg'))close()});
render();
if(S.pin)pinPad('ใส่ PIN เพื่อเข้าใช้งาน',async p=>await hash(p)===S.pin);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
