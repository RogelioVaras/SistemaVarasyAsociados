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
/* Facturas por cobrar (ventas) o por pagar (compras): una fila por documento registrado,
   con lo pagado y lo pendiente según los mismos cargos y abonos de cuentas corrientes.
   Las notas de crédito no generan fila: ya rebajan el pendiente de la factura que abonan.
   Un documento que todavía no se ha centralizado aparece completo como pendiente. */
function facturasDe(kind,hasta){
 const cta=kind==='ventas'?claves().clientes:claves().proveedores;
 const porRut={};ctacte(cta,hasta).forEach(g=>{porRut[g.rut]=g});
 const refsContadas=new Set();Object.values(porRut).forEach(g=>(g.cargos||[]).forEach(c=>refsContadas.add(String(c.ref))));
 const out=[];
 /* La antigüedad se mide hasta hoy, salvo que el informe se corte antes. */
 const ref=hasta&&hasta>hoy()?hoy():hasta;
 for(const d of docsDe(kind)){
  if(+d.tipo===61)continue;
  const rut=rutClean(d.rut)||'SINRUT';const folio=String(d.folio==null?'':d.folio);
  const g=porRut[rut];const cargo=g&&g.cargos?g.cargos.find(c=>String(c.ref)===folio):null;
  if(!cargo&&refsContadas.has(folio))continue;
  const bruto=Math.abs(Math.round(+d.total||0));
  const pend=cargo?Math.max(0,Math.round(cargo.pend)):bruto;
  out.push({id:d.id,rut,razon:(d.razon||'').trim(),tipo:+d.tipo,folio,fecha:d.fecha,
   total:bruto,pagado:bruto-pend,pend,dias:dias(d.fecha,ref),centralizada:!!cargo});
 }
 return out;
}
const dias=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
function buckets(pend,hasta){const b=[0,0,0,0];for(const c of pend){const d=dias(c.fecha,hasta);b[d<=30?0:d<=60?1:d<=90?2:3]+=c.pend}return b}

