/* Partida Doble · Remuneraciones: parámetros previsionales, cálculo de liquidaciones, centralización y DJ 1887. */
/* ---- Remuneraciones ---- */
const PREV_BASE={imm:553553,topeAFP:90,topeAFC:135.2,reforma:3.5,mutual:0.93,afcTrab:0.6,afcEmp:2.4,afcFijo:3.0,jornada:42,
 afp:{Capital:11.44,Cuprum:11.44,Habitat:11.27,PlanVital:11.16,ProVida:11.45,Modelo:10.58,Uno:10.46},
 asig:[[649039,22601],[947990,13870],[1478539,4382]]};
const IUT=[[13.5,0,0],[30,0.04,0.54],[50,0.08,1.74],[70,0.135,4.49],[90,0.23,11.14],[120,0.304,17.8],[310,0.35,23.32],[Infinity,0.4,38.82]];
const prevP=()=>{const p=Object.assign({},PREV_BASE,clone((S.ind||{}).prev||{}));p.afp=Object.assign({},PREV_BASE.afp,((S.ind||{}).prev||{}).afp||{});return p};
const ufMes=ym=>+(((S.ind||{}).uf||{})[ym]||0);
function impUnico(base,U){for(const [lim,f,reb] of IUT){if(base<=lim*U)return Math.max(0,Math.round(base*f-reb*U))}return 0}
const trabajadores=()=>((S.renta.personal||{}).trabajadores)||[];
async function guardarTrab(list){const prev=trabajadores();await putE('renta/personal',{...clone(S.renta.personal||{}),trabajadores:list});const r=t=>`${rutFmt(t.rut)} · sueldo ${fmt(t.sueldo)} · ${t.contrato} · AFP ${t.afp} · ${t.salud}`;for(const x of prev)if(!list.some(y=>y.id===x.id))await audit('eliminar','Trabajador',x.nombre,r(x),null);for(const x of list){const o=prev.find(y=>y.id===x.id);if(!o||JSON.stringify(o)!==JSON.stringify(x))await audit(o?'modificar':'crear','Trabajador',x.nombre,o&&r(o),r(x))}}
function tramoAuto(renta){const a=prevP().asig;for(let i=0;i<a.length;i++)if(renta<=a[i][0])return 'ABC'[i];return 'D'}
const asigMonto=t=>{const a=prevP().asig;const i='ABC'.indexOf(t);return i>=0&&a[i]?a[i][1]:0};
function calcLiq(t,l,ym){const P=prevP();const UF=ufMes(ym),UTM=utm(ym);
 const dias=Math.max(0,Math.min(30,l.dias===''||l.dias==null?30:+l.dias));const base=Math.round(+t.sueldo||0);const prop=Math.round(base*dias/30);
 const jor=+t.jornada||P.jornada;const vh=base/30*28/(jor*4);const hx=Math.round(vh*1.5*(+l.hx||0));const bonos=Math.round(+l.bonos||0);
 const gBase=prop+hx+bonos;const grat=t.grat==='art50'?Math.min(Math.round(gBase*0.25),Math.round(4.75*P.imm/12)):0;
 const imp=gBase+grat;const iA=Math.min(imp,Math.round(P.topeAFP*UF)),iC=Math.min(imp,Math.round(P.topeAFC*UF));
 const afpT=+(P.afp[t.afp]??11.27);const afp=Math.round(iA*afpT/100);
 const leg=Math.round(iA*0.07);const salud=t.salud==='isapre'?Math.max(leg,Math.round((+t.planUF||0)*UF)):leg;
 const indef=t.contrato!=='plazo_fijo';const afcT=indef?Math.round(iC*P.afcTrab/100):0;
 const trib=Math.max(0,imp-afp-leg-afcT);const iu=impUnico(trib,UTM);
 const tramo=t.tramo||tramoAuto(imp);const asig=Math.round((+t.cargas||0)*asigMonto(tramo));
 const col=Math.round(+t.colacion||0),mov=Math.round(+t.movilizacion||0),onI=Math.round(+l.otrosNoImp||0);
 const noImp=col+mov+asig+onI;const hab=imp+noImp;const ant=Math.round(+l.anticipos||0),od=Math.round(+l.otrosDesc||0);
 const desc=afp+salud+afcT+iu+ant+od;const ref=Math.round(iA*P.reforma/100);const afcE=Math.round(iC*(indef?P.afcEmp:P.afcFijo)/100);const mut=Math.round(iA*P.mutual/100);
 return{dias,base,prop,hx,bonos,grat,imp,iA,iC,afpT,afp,leg,salud,adic:salud-leg,afcT,trib,iu,tramo,asig,col,mov,onI,noImp,hab,ant,od,desc,liq:hab-desc,ref,afcE,mut,aportes:ref+afcE+mut,costo:hab+ref+afcE+mut,uf:UF,utm:UTM}}
function liqFromTrab(t,ym,prev){const l=prev?{dias:prev.dias,hx:prev.hx,bonos:prev.bonos,otrosNoImp:prev.otrosNoImp,anticipos:prev.anticipos,otrosDesc:prev.otrosDesc}:{dias:30,hx:0,bonos:0,otrosNoImp:0,anticipos:0,otrosDesc:0};
 if(!prev){const [y,m]=ym.split('-').map(Number);const last=new Date(y,m,0).getDate();const ini=t.ingreso&&t.ingreso.slice(0,7)===ym?+t.ingreso.slice(8,10):1;const fin=t.termino&&t.termino.slice(0,7)===ym?+t.termino.slice(8,10):last;
  if(ini>1||fin<last)l.dias=Math.max(0,Math.min(30,fin-ini+1))}
 return{tid:t.id,rut:t.rut,nombre:t.nombre,cargo:t.cargo||'',afp:t.afp,salud:t.salud==='isapre'?(t.isapre||'Isapre'):'Fonasa',contrato:t.contrato,...l,c:calcLiq(t,l,ym)}}
const trabActivos=ym=>{const [y,m]=ym.split('-').map(Number);const ini=`${ym}-01`,fin=`${ym}-${pad(new Date(y,m,0).getDate())}`;return trabajadores().filter(t=>(!t.ingreso||t.ingreso<=fin)&&(!t.termino||t.termino>=ini))};
function totRemu(liqs){const T={};for(const l of liqs)for(const [k,v] of Object.entries(l.c||{}))if(typeof v==='number')T[k]=(T[k]||0)+v;return T}
function asientoRemu(ym,liqs,ex){const k=claves();const T=totRemu(liqs);const [y,m]=ym.split('-').map(Number);
 const L=[{cuenta:k.remGasto,debe:T.hab-T.asig,haber:0},{cuenta:k.leyesGasto,debe:T.aportes,haber:0},{cuenta:k.remPagar,debe:0,haber:T.liq},{cuenta:k.leyesPagar,debe:0,haber:T.afp+T.salud+T.afcT+T.aportes-T.asig}];
 if(T.iu)L.push({cuenta:k.iuPagar,debe:0,haber:T.iu});if(T.ant)L.push({cuenta:k.antRem,debe:0,haber:T.ant});if(T.od)L.push({cuenta:k.otrosDescRem,debe:0,haber:T.od});
 return{id:ex?ex.id:uid(),numero:ex?ex.numero:nextNum(String(y)),fecha:`${ym}-${pad(new Date(y,m,0).getDate())}`,tipo:'Traspaso',glosa:`Centralización remuneraciones ${MESES[m-1].toLowerCase()} ${y}`,lineas:L.filter(l=>l.debe||l.haber),origen:{kind:'remu',ym}}}
function dj1887(anio){const by={};for(const [ym,d] of Object.entries(S.remu)){if(!ym.startsWith(anio+'-'))continue;for(const l of (d.liqs||[])){const g=by[l.tid]||(by[l.tid]={rut:l.rut,nombre:l.nombre,trib:0,iu:0,mes:Array(12).fill(0),iuMes:Array(12).fill(0)});const i=+ym.slice(5,7)-1;g.trib+=l.c.trib;g.iu+=l.c.iu;g.mes[i]+=l.c.trib;g.iuMes[i]+=l.c.iu}}return Object.values(by).sort((a,b)=>a.nombre.localeCompare(b.nombre))}
function numPalabras(n){n=Math.round(Math.abs(n));if(n===0)return 'cero';const U=['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte','veintiuno','veintidós','veintitrés','veinticuatro','veinticinco','veintiséis','veintisiete','veintiocho','veintinueve'];
 const D=['','','','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];const C=['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
 const c99=x=>x<30?U[x]:D[Math.floor(x/10)]+(x%10?' y '+U[x%10]:'');const c999=x=>x===100?'cien':(x>=100?C[Math.floor(x/100)]+(x%100?' '+c99(x%100):''):c99(x));
 const ap=t=>t.replace(/veintiuno$/,'veintiún').replace(/uno$/,'un');const mil=x=>{const m=Math.floor(x/1000),r=x%1000;return (m?(m===1?'mil':ap(c999(m))+' mil')+(r?' ':''):'')+(r?c999(r):'')};
 const mill=Math.floor(n/1e6),r=n%1e6;return ((mill?(mill===1?'un millón':ap(mil(mill))+' millones')+(r?' ':''):'')+(r?mil(r):'')).trim()}

