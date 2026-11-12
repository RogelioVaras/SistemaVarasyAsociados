/* Partida Doble · Conciliación bancaria: cuentas de banco y movimientos. */
/* ---- Banco ---- */
const bancos=()=>plan().filter(c=>c.banco);
function bancoCta(){const b=bancos();if(!b.length)return null;if(!S.bancoCta||!b.some(x=>x.codigo===S.bancoCta))S.bancoCta=b[0].codigo;return S.bancoCta}
const movsTodos=()=>Object.entries(S.banco).flatMap(([ym,v])=>((v&&v.movs)||[]).map(m=>({...m,_ym:ym})));
function lineasBanco(cta,hasta){const out=[];for(const a of asientos()){if(a.fecha>hasta)break;(a.lineas||[]).forEach((l,i)=>{if(l.cuenta===cta)out.push({k:a.id+':'+i,fecha:a.fecha,numero:a.numero,glosa:a.glosa,monto:(+l.debe||0)-(+l.haber||0)})})}return out}
async function putMovs(ym,fn){const o=clone(S.banco[ym]||{movs:[]});o.movs=o.movs||[];fn(o);await putE(`banco/${ym}`,o)}

