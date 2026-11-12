/* Partida Doble · Cuentas corrientes por RUT: aplicación de pagos y antigüedad de saldos. */
/* ---- Cuentas corrientes (auxiliar por RUT) ---- */
const esAux=c=>{const x=cm()[c];const k=claves();return !!(x&&(x.aux||c===k.clientes||c===k.proveedores))};
const auxCtas=()=>plan().filter(c=>esAux(c.codigo));
const esDeudora=c=>{const x=cm()[c];return !!x&&['AC','ANC'].includes(x.grupo)};
function nombresRut(){const m={};for(const k of ['compras','ventas'])docsDe(k).forEach(d=>{if(d.rut&&d.razon)m[rutClean(d.rut)]=d.razon});return m}
function ctacte(cta,hasta){const deud=esDeudora(cta);const docMap={};for(const k of ['compras','ventas'])docsDe(k).forEach(d=>docMap[d.id]=d);const by={};
 for(const a of asientos()){if(a.fecha>hasta)break;if(a.origen&&a.origen.kind==='cierre')continue;(a.lineas||[]).forEach((l,i)=>{if(l.cuenta!==cta)return;const od=a.origen&&a.origen.docId?docMap[a.origen.docId]:null;
  const rut=rutClean(l.rut||(od&&od.rut))||'SINRUT';const ref=String(l.ref||(od&&od.folio)||'');const v=Math.round(deud?(+l.debe||0)-(+l.haber||0):(+l.haber||0)-(+l.debe||0));if(!v)return;
  const g=by[rut]||(by[rut]={rut,mov:[]});g.mov.push({k:a.id+':'+i,aid:a.id,fecha:a.fecha,numero:a.numero,glosa:a.glosa,ref,v,doc:od})})}
 const out=[];for(const g of Object.values(by)){const cargos=g.mov.filter(m=>m.v>0).map(m=>({...m,pend:m.v}));const abonos=g.mov.filter(m=>m.v<0).map(m=>({...m,rest:-m.v,aplic:[]}));
  const apl=(ab,cg)=>{const x=Math.min(ab.rest,cg.pend);if(x<=0)return;ab.rest-=x;cg.pend-=x;ab.aplic.push({monto:x,cargo:cg})};
  for(const ab of abonos)if(ab.ref){const cg=cargos.find(c=>c.ref===ab.ref&&c.pend>0);if(cg)apl(ab,cg)}
  for(const ab of abonos)for(const cg of cargos){if(ab.rest<=0)break;apl(ab,cg)}
  g.cargos=cargos;g.abonos=abonos;g.saldo=sum(g.mov,m=>m.v);g.pend=cargos.filter(c=>c.pend>0);g.favor=sum(abonos,a=>a.rest);out.push(g)}
 return out.sort((a,b)=>b.saldo-a.saldo)}
const dias=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
function buckets(pend,hasta){const b=[0,0,0,0];for(const c of pend){const d=dias(c.fecha,hasta);b[d<=30?0:d<=60?1:d<=90?2:3]+=c.pend}return b}

