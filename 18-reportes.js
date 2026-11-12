/* Partida Doble · Cálculo de reportes: libro mayor, balance de 8 columnas y estados financieros. */
function balance8(){const [,h]=rango();const {m,prev}=acumulados(h,S.anio);const rows=[];
 for(const c of Object.keys(m).sort()){const v=m[c];const x=cm()[c]||{nombre:'Cuenta no encontrada',grupo:'AC'};const s=v.debe-v.haber;const res=RES.has(x.grupo);
  rows.push({c,n:x.nombre,d:v.debe,h:v.haber,sd:s>0?s:0,sa:s<0?-s:0,ac:!res&&s>0?s:0,pa:!res&&s<0?-s:0,pe:res&&s>0?s:0,ga:res&&s<0?-s:0})}
 const ps=prev.debe-prev.haber;if(Math.round(prev.debe)||Math.round(prev.haber))rows.push({c:'—',n:'Resultados de ejercicios anteriores sin cerrar',d:prev.debe,h:prev.haber,sd:ps>0?ps:0,sa:ps<0?-ps:0,ac:ps>0?ps:0,pa:ps<0?-ps:0,pe:0,ga:0});
 const T={};for(const k of ['d','h','sd','sa','ac','pa','pe','ga'])T[k]=sum(rows,r=>r[k]);const res=T.ga-T.pe;return{rows,T,res}}

function eeffData(){const [d,h]=rango();const A=acumulados(h,S.anio).m;const M=S.mes?acumulados(h,S.anio,d).m:null;const prev=acumulados(h,S.anio).prev;
 const bal=(map,c,deud)=>{const v=map[c];if(!v)return 0;return deud?v.debe-v.haber:v.haber-v.debe};
 const cuentasG=g=>plan().filter(c=>c.grupo===g&&A[c.codigo]);return{A,M,prev,bal,cuentasG}}
function mayorData(cta){const [d,h]=rango();const c=cm()[cta];const res=c&&RES.has(c.grupo);const ini=`${S.anio}-01-01`;let si=0;const movs=[];
 for(const a of asientos()){if(a.fecha>h)break;for(const l of a.lineas||[]){if(l.cuenta!==cta)continue;const v=(+l.debe||0)-(+l.haber||0);
  if(a.fecha<d){if(!res||a.fecha>=ini)si+=v}else movs.push({a,l})}}
 return{si,movs}}
