/* Partida Doble · Contabilidad: bloqueo de períodos, asientos, documentos de compras y ventas, e IVA. */
/* ============ Cálculos contables ============ */
/* ---- Bloqueo de períodos ---- */
const cerrado=()=>(emp()||{}).cerradoHasta||'';
const cerradoTxt=()=>{const c=cerrado();return c?`${MESES[+c.slice(5,7)-1].toLowerCase()} ${c.slice(0,4)}`:''};
const bloq=f=>!!f&&!!cerrado()&&String(f).slice(0,7)<=cerrado();
function chkBloq(...fs){if(fs.some(bloq)){toast(`Los períodos hasta ${cerradoTxt()} están cerrados. Ábrelos en Cierre y apertura para modificarlos.`,'err');throw new Error('bloq')}}
function acumulados(hasta,anio,desde){const ini=`${anio}-01-01`;const m={};const prev={debe:0,haber:0};
 for(const a of asientos()){if(a.fecha>hasta)break;if(desde&&a.fecha<desde)continue;if(a.origen&&a.origen.kind==='cierre'&&a.fecha>=ini)continue;
  for(const l of a.lineas||[]){const c=cm()[l.cuenta];const res=c?RES.has(c.grupo):false;const d=+l.debe||0,h=+l.haber||0;
   if(!desde&&res&&a.fecha<ini){prev.debe+=d;prev.haber+=h;continue}
   const x=m[l.cuenta]||(m[l.cuenta]={debe:0,haber:0});x.debe+=d;x.haber+=h}}
 return{m,prev}}
const cuadra=a=>Math.round(sum(a.lineas||[],l=>l.debe))===Math.round(sum(a.lineas||[],l=>l.haber));
function nextNum(anio){return asientos().filter(a=>a.fecha.startsWith(anio+'-')).reduce((m,a)=>Math.max(m,a.numero||0),0)+1}
const LIM=200000;const bytes=o=>JSON.stringify(o||{}).length;
const partesDe=(keys,ym)=>[...new Set(keys)].filter(k=>k===ym||k.startsWith(ym+'.')).sort((a,b)=>a.length-b.length||(a<b?-1:1));
function parteLibre(get,keys,ym,extra){const ks=partesDe(keys,ym);for(const k of ks)if(bytes(get(k))+extra<LIM)return k;return ks.length?`${ym}.${ks.length+1}`:ym}
async function guardarAsiento(a,oldYm){const y=a.fecha.slice(0,7);const cur=ymDeAsiento(a.id);chkBloq(a.fecha,oldYm,cur);const prevA=clone(asientos().find(x=>x.id===a.id)||null);Object.assign(a,sello(prevA));
 let target;if(cur&&cur.slice(0,7)===y)target=cur;else{if(cur){const o=clone(S.diario[cur]);o.asientos=(o.asientos||[]).filter(x=>x.id!==a.id);await putE(`diario/${cur}`,o)}target=parteLibre(k=>S.diario[k],Object.keys(S.diario),y,bytes(a))}
 const n=clone(S.diario[target]||{asientos:[]});n.asientos=(n.asientos||[]).filter(x=>x.id!==a.id);n.asientos.push(a);await putE(`diario/${target}`,n);
 if(!prevA||sumA(prevA)!==sumA(a))await audit(prevA?'modificar':'crear','Asiento',`N°${a.numero} ${a.glosa}`,prevA&&sumA(prevA),sumA(a))}
function ymDeAsiento(id){for(const [k,v] of Object.entries(S.diario)){if((v.asientos||[]).some(a=>a.id===id))return k}return null}
async function borrarAsiento(id){const y=ymDeAsiento(id);if(!y)return;chkBloq(y);const prevA=asientos().find(a=>a.id===id);const o=clone(S.diario[y]);o.asientos=o.asientos.filter(a=>a.id!==id);await putE(`diario/${y}`,o);if(prevA)await audit('eliminar','Asiento',`N°${prevA.numero} ${prevA.glosa}`,sumA(prevA),null)}
function asientoDeDoc(kind,d,numero){const k=claves();const s=+d.tipo===61?-1:1;const L=[];
 const add=(cuenta,monto,lado,aux)=>{monto=Math.round(monto||0);if(!monto)return;let debe=0,haber=0;if((lado==='D')===(s>0))debe=monto;else haber=monto;L.push({cuenta,debe,haber,...(aux&&d.rut?{rut:rutClean(d.rut),ref:String(d.folio)}:{})})};
 const total=Math.round(+d.total||0),iva=Math.round(+d.iva||0);
 if(kind==='compras'){const uc=Math.round(+d.ivaUC||0);const cf=iva+uc;add(d.cuenta||k.compras,total-cf,'D');add(k.ivaCF,cf,'D');if(+d.tipo===46){add(k.proveedores,total-iva,'H',1);add(k.ivaRet,iva,'H')}else add(k.proveedores,total,'H',1)}
 else{const ex=Math.round(+d.exento||0);add(k.clientes,total,'D',1);add(d.cuenta||k.ventas,total-iva-ex,'H');add(k.ventasEx,ex,'H');add(k.ivaDF,iva,'H')}
 return{id:d.asientoId||uid(),numero,fecha:d.fecha,tipo:'Traspaso',glosa:`${kind==='compras'?'Compra':'Venta'} ${CORTO[d.tipo]||d.tipo} N°${d.folio} ${d.razon||''}`.trim(),lineas:L,origen:{kind,docId:d.id}}}
function docsDe(kind){return Object.entries(S.rcv).flatMap(([ym,v])=>((v&&v[kind])||[]).map(d=>({...d,_ym:ym})))}
async function guardarDocs(kind,list){ // list: docs con _oldYm opcional
 const rcvM={},diaM={};const getR=y=>rcvM[y]||(rcvM[y]=clone(S.rcv[y]||{compras:[],ventas:[]}));const getD=y=>diaM[y]||(diaM[y]=clone(S.diario[y]||{asientos:[]}));
 for(const d of list)chkBloq(d.fecha,d._oldYm);const prevDocs=Object.fromEntries(docsDe(kind).filter(x=>list.some(d=>d.id===x.id)).map(x=>[x.id,clone(x)]));
 const nums={};const nn=anio=>{if(!(anio in nums))nums[anio]=nextNum(anio);return nums[anio]++};
 for(const d0 of list){const d=clone(d0);const oldYm=d._oldYm;delete d._oldYm;delete d._ym;const y=d.fecha.slice(0,7);
  if(oldYm){const r=getR(oldYm);r[kind]=(r[kind]||[]).filter(x=>x.id!==d.id)}
  const prevA=d.asientoId?asientos().find(a=>a.id===d.asientoId):null;const prevAy=prevA?ymDeAsiento(prevA.id):null;
  if(prevAy){const o=getD(prevAy);o.asientos=(o.asientos||[]).filter(a=>a.id!==prevA.id)}
  const numero=prevA&&prevA.fecha.slice(0,4)===d.fecha.slice(0,4)?prevA.numero:nn(d.fecha.slice(0,4));
  const a=asientoDeDoc(kind,d,numero);Object.assign(a,sello(prevA));d.asientoId=a.id;Object.assign(d,sello(docsDe(kind).find(x=>x.id===d.id)));
  const r=getR(y);r[kind]=(r[kind]||[]).filter(x=>x.id!==d.id);r[kind].push(d);
  const tgt=prevAy&&prevAy.slice(0,7)===y?prevAy:parteLibre(k=>diaM[k]||S.diario[k],[...Object.keys(S.diario),...Object.keys(diaM)],y,bytes(a));const dd=getD(tgt);dd.asientos=(dd.asientos||[]).filter(x=>x.id!==a.id);dd.asientos.push(a)}
 for(const [y,v] of Object.entries(rcvM))await putE(`rcv/${y}`,v);
 for(const [y,v] of Object.entries(diaM))await putE(`diario/${y}`,v);
 const T=kind==='compras'?'Documento de compra':'Documento de venta';if(list.length>3)await audit('crear',T,`Importación o reclasificación de ${list.length} documentos`,null,list.slice(0,5).map(sumD).join(' | ')+(list.length>5?' …':''));
 else for(const d of list){const prev=prevDocs[d.id];await audit(prev?'modificar':'crear',T,`${CORTO[d.tipo]||d.tipo} ${d.folio} ${d.razon||''}`,prev&&sumD(prev),sumD(d))}}
async function borrarDoc(kind,id){const d=docsDe(kind).find(x=>x.id===id);if(!d)return;chkBloq(d.fecha);await audit('eliminar',kind==='compras'?'Documento de compra':'Documento de venta',`${CORTO[d.tipo]||d.tipo} ${d.folio} ${d.razon||''}`,sumD(d),null);const r=clone(S.rcv[d._ym]);r[kind]=r[kind].filter(x=>x.id!==id);await putE(`rcv/${d._ym}`,r);if(d.asientoId)await borrarAsiento(d.asientoId)}

function grp(arr,tipos){const x=arr.filter(d=>tipos.includes(+d.tipo));return{n:sum(x,d=>+d.cant||1),neto:sum(x,d=>d.neto),exento:sum(x,d=>d.exento),iva:sum(x,d=>d.iva),total:sum(x,d=>d.total),ivaNoRec:sum(x,d=>d.ivaNoRec)}}
function factorUC(ym){const y=ym.slice(0,4);let af=0,ex=0;for(const [k,r] of Object.entries(S.rcv)){if(!k.startsWith(y)||k>ym)continue;for(const d of ((r&&r.ventas)||[])){const s=+d.tipo===61?-1:1;if([34,41].includes(+d.tipo))ex+=s*(+d.total||0);else{af+=s*(+d.neto||0);ex+=s*(+d.exento||0)}}}return af+ex>0?Math.max(0,Math.min(1,af/(af+ex))):1}
const utm=ym=>+(((S.ind||{}).utm||{})[ym]||0);
function ivaMes(ym,depth=0){const r=S.rcv[ym]||{};let remAnt,reaj=false;const manual=r.remAnt!==undefined&&r.remAnt!==null&&r.remAnt!=='';
 if(manual)remAnt=+r.remAnt;else{const keys=Object.keys(S.rcv).sort();const p=prevYm(ym);let rs=(keys.length&&p>=keys[0]&&depth<240)?ivaMes(p,depth+1).remSig:0;if(rs&&utm(p)&&utm(ym)){rs=Math.round(rs/utm(p)*utm(ym));reaj=true}remAnt=rs}
 const iu=Math.round(sum(((S.remu||{})[ym]||{}).liqs||[],l=>(l.c||{}).iu||0));const x=ivaCalc(r,remAnt,+((emp()||{}).tasaPPM||0),manual,factorUC(ym),iu);x.reaj=reaj;return x}
function ivaCalc(r,remAnt,tasa,manual,fuc=1,iu=0){r=r||{};const v=r.ventas||[],c=r.compras||[];const sg=d=>+d.tipo===61?-1:1;
 const V={f33:grp(v,[33]),f34:grp(v,[34]),b39:grp(v,[39]),b41:grp(v,[41]),nd:grp(v,[56]),nc:grp(v,[61])};
 const C={f33:grp(c,[33]),f34:grp(c,[34]),nd:grp(c,[56]),nc:grp(c,[61]),fc46:grp(c,[46]),din:grp(c,[914])};
 const uc=Math.round(sum(c,d=>sg(d)*(+d.ivaUC||0)));const ucRec=Math.round(uc*fuc);const ivaAF=Math.round(sum(c,d=>sg(d)*(+d.ivaAF||0)));
 const debito=V.f33.iva+V.b39.iva+V.nd.iva-V.nc.iva;const credito=C.f33.iva+C.nd.iva-C.nc.iva+C.fc46.iva+C.din.iva+ucRec;
 const neto=debito-credito-remAnt;const ivaPagar=Math.max(0,neto),remSig=Math.max(0,-neto);
 const base=v.reduce((s,d)=>s+sg(d)*((+d.total||0)-(+d.iva||0)),0);
 const honRet=Math.round(sum((r.honorarios||[]).filter(h=>h.retenida!==false),h=>h.ret));const retManual=r.retHon!==undefined&&r.retHon!==null&&r.retHon!=='';
 const ppm=Math.round(base*tasa/100);const ret=retManual?+r.retHon:honRet;const ret46=C.fc46.iva;
 return{V,C,debito,credito,remAnt,manual,ivaPagar,remSig,base,tasa,ppm,ret,honRet,retManual,ret46,uc,ucRec,fuc,ivaAF,iu,total:ivaPagar+ppm+ret+ret46+iu}}

