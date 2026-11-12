/* Partida Doble · Renta anual (14 D y 14 A) y asiento de cierre del ejercicio. */
/* ---- Renta anual ---- */
function tasaDefault(){const reg=(emp()||{}).regimen||'';const a=S.anio;if(reg.startsWith('14 D N°3'))return a>=2025&&a<=2027?12.5:25;if(reg.startsWith('14 D N°8'))return 0;return 27}
function rentaCalc(){const anio=S.anio,ini=`${anio}-01-01`,fin=`${anio}-12-31`;const e=emp();const r=S.renta[String(anio)]||{};const reg=e.regimen||'';
 const flujo=reg.startsWith('14 D');const {m}=acumulados(fin,anio);
 const sal=c=>{const v=m[c.codigo];return v?v.debe-v.haber:0};const tg=(g,f=()=>true)=>sum(plan().filter(c=>c.grupo===g&&f(c)),sal);
 const isDep=c=>/depreci/i.test(c.nombre);
 const ing=-tg('ING'),cos=tg('COS'),gasT=tg('GAS'),dep=tg('GAS',isDep),imp=tg('IMP');
 const af=sum(asientos().filter(a=>a.fecha>=ini&&a.fecha<=fin),a=>sum((a.lineas||[]).filter(l=>{const c=cm()[l.cuenta];return c&&c.grupo==='ANC'&&!isDep(c)}),l=>l.debe));
 const k=claves();const ratio=d=>d&&+d.total?((+d.total||0)-(+d.iva||0))/(+d.total):1/1.19;
 const pendAnio=list=>sum(list.flatMap(g=>g.pend).filter(c=>c.fecha>=ini),c=>c.pend*ratio(c.doc));
 const cobAnt=list=>sum(list.flatMap(g=>g.abonos).filter(a=>a.fecha>=ini),a=>sum(a.aplic.filter(x=>x.cargo.fecha<ini),x=>x.monto*ratio(x.cargo.doc)));
 const cli=ctacte(k.clientes,fin),pro=ctacte(k.proveedores,fin);
 const noPerc=Math.round(pendAnio(cli)),percAnt=Math.round(cobAnt(cli)),noPag=Math.round(pendAnio(pro)),pagAnt=Math.round(cobAnt(pro));
 const aj=r.ajustes||[];const agr=sum(aj.filter(a=>a.tipo==='agregado'),a=>a.monto),ded=sum(aj.filter(a=>a.tipo==='deduccion'),a=>a.monto);
 let lines,base;
 if(flujo){const ingP=ing-noPerc+percAnt;const egr=cos+gasT-dep-noPag+pagAnt+af;base=ingP-egr+agr-ded;
  lines=[['Ingresos según contabilidad',ing],['(−) Ingresos devengados no percibidos al cierre',-noPerc],['(+) Ingresos percibidos de facturas de ejercicios anteriores',percAnt],['= Ingresos percibidos',ingP,'sub'],
   ['Costos y gastos según contabilidad, sin depreciación',cos+gasT-dep],['(−) Gastos adeudados al cierre',-noPag],['(+) Pagos de gastos de ejercicios anteriores',pagAnt],['(+) Activo fijo adquirido (depreciación instantánea)',af],['= Egresos pagados',egr,'sub'],
   ['(+) Agregados',agr],['(−) Deducciones',-ded]]}
 else{base=ing-cos-gasT+agr-ded;lines=[['Ingresos',ing],['(−) Costos',-cos],['(−) Gastos',-gasT],['= Resultado contable antes de impuesto',ing-cos-gasT,'sub'],['(+) Agregados',agr],['(−) Deducciones',-ded]]}
 const perd=+r.perdidaAnt||0;const baseAf=Math.max(0,Math.round(base-perd));const tasa=r.tasa!==undefined&&r.tasa!==''?+r.tasa:tasaDefault();const idpc=Math.round(baseAf*tasa/100);
 let ppmCalc=0;for(let i=1;i<=12;i++){const y=`${anio}-${pad(i)}`;if(S.rcv[y])ppmCalc+=ivaMes(y).ppm}
 const ppm=r.ppm!==undefined&&r.ppm!==''?+r.ppm:ppmCalc;
 const tA=sum(plan().filter(c=>['AC','ANC'].includes(c.grupo)),sal),tP=-sum(plan().filter(c=>['PC','PNC'].includes(c.grupo)),sal);
 return{r,flujo,reg,lines,base:Math.round(base),perd,baseAf,tasa,idpc,ppm,ppmCalc,res:idpc-ppm,cpt:Math.round(tA-tP),imp,perdNueva:base<perd?Math.round(perd-base):0}}

/* ---- Cierre ---- */
function cierreLineas(anio){const {m}=acumulados(`${anio}-12-31`,anio);const L=[];let res=0;
 for(const c of plan()){if(!RES.has(c.grupo))continue;const v=m[c.codigo];if(!v)continue;const s=Math.round(v.debe-v.haber);if(!s)continue;res-=s;L.push(s>0?{cuenta:c.codigo,debe:0,haber:s}:{cuenta:c.codigo,debe:-s,haber:0})}
 const k=claves();if(res)L.push(res>0?{cuenta:k.resultado,debe:0,haber:res}:{cuenta:k.resultado,debe:-res,haber:0});return{L,res}}
const asientoOrigen=(kind,anio)=>asientos().find(a=>a.origen&&a.origen.kind===kind&&a.origen.anio===anio);

