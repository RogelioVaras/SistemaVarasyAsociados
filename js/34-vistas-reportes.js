/* Partida Doble · Vistas: balance de 8 columnas y estados financieros. */
function vBalance(){const e=emp();if(!e)return head('Balance 8 columnas','')+noEmp();if(!ready())return loading();
 const {rows,T,res}=balance8();const [,h]=rango();const ok=Math.round(T.d)===Math.round(T.h)&&Math.round(T.ac+(res<0?-res:0))===Math.round(T.pa+(res>0?res:0));
 return head('Balance de 8 columnas',`Acumulado del 01-01-${S.anio} al ${fd(h)} · ${esc(e.razon)}`,csvBtn('balance'))+
 `<div class="sheet"><div class="scroll"><table><thead><tr><th>Código</th><th>Cuenta</th><th class="n">Debe</th><th class="n">Haber</th><th class="n">Deudor</th><th class="n">Acreedor</th><th class="n">Activo</th><th class="n">Pasivo</th><th class="n">Pérdida</th><th class="n">Ganancia</th></tr></thead><tbody>
 ${rows.map(r=>`<tr><td class="c">${r.c}</td><td>${esc(r.n)}</td>${['d','h','sd','sa','ac','pa','pe','ga'].map(k=>`<td class="n">${fz(r[k])}</td>`).join('')}</tr>`).join('')||'<tr><td colspan="10" class="muted">Sin movimientos.</td></tr>'}
 <tr class="sub"><td></td><td>Sumas</td>${['d','h','sd','sa','ac','pa','pe','ga'].map(k=>`<td class="n">${fmt(T[k])}</td>`).join('')}</tr>
 <tr><td></td><td>${res>=0?'Utilidad del ejercicio':'Pérdida del ejercicio'}</td><td></td><td></td><td></td><td></td><td class="n">${res<0?fmt(-res):''}</td><td class="n">${res>0?fmt(res):''}</td><td class="n">${res>0?fmt(res):''}</td><td class="n">${res<0?fmt(-res):''}</td></tr>
 <tr class="tot"><td></td><td>Totales ${ok?'<span class="pill ok">Cuadra</span>':'<span class="pill bad">No cuadra</span>'}</td><td class="n">${fmt(T.d)}</td><td class="n">${fmt(T.h)}</td><td class="n">${fmt(T.sd)}</td><td class="n">${fmt(T.sa)}</td><td class="n">${fmt(T.ac+(res<0?-res:0))}</td><td class="n">${fmt(T.pa+(res>0?res:0))}</td><td class="n">${fmt(T.pe+(res>0?res:0))}</td><td class="n">${fmt(T.ga+(res<0?-res:0))}</td></tr>
 </tbody></table></div></div>`}

function vEeff(){const e=emp();if(!e)return head('Estados financieros','')+noEmp();if(!ready())return loading();
 const {A,M,prev,bal,cuentasG}=eeffData();const [,h]=rango();
 const er=[['ING','Ingresos de explotación',false],['COS','Costo de ventas',true],['GAS','Gastos de administración y ventas',true],['IMP','Impuesto a la renta',true]];
 const tot=(map,g,deud)=>map?sum(cuentasG(g),c=>bal(map,c.codigo,deud)):0;
 const ing=tot(A,'ING',false),cos=tot(A,'COS',true),gas=tot(A,'GAS',true),imp=tot(A,'IMP',true);const mi=tot(M,'ING',false),mc=tot(M,'COS',true),mg=tot(M,'GAS',true),mimp=tot(M,'IMP',true);
 const resA=ing-cos-gas-imp,resM=mi-mc-mg-mimp;const colM=!!M;
 const rowsER=(g,t,deud)=>`<tr class="sub"><td colspan="${colM?3:2}">${t}</td></tr>`+cuentasG(g).map(c=>`<tr class="indent"><td>${c.codigo} ${esc(c.nombre)}</td>${colM?`<td class="n">${fmt(bal(M,c.codigo,deud))}</td>`:''}<td class="n">${fmt(bal(A,c.codigo,deud))}</td></tr>`).join('');
 const lineER=(t,m,a,cls='sub')=>`<tr class="${cls}"><td>${t}</td>${colM?`<td class="n">${fmt(m)}</td>`:''}<td class="n">${fmt(a)}</td></tr>`;
 const sec=(g,deud)=>cuentasG(g).map(c=>`<tr class="indent"><td>${c.codigo} ${esc(c.nombre)}</td><td class="n">${fmt(bal(A,c.codigo,deud))}</td></tr>`).join('');
 const tAC=tot(A,'AC',true),tANC=tot(A,'ANC',true),tPC=tot(A,'PC',false),tPNC=tot(A,'PNC',false),tPAT=tot(A,'PAT',false);const ant=prev.haber-prev.debe;const tPatr=tPAT+ant+resA;
 const ok=Math.round(tAC+tANC)===Math.round(tPC+tPNC+tPatr);
 return head('Estados financieros',`${esc(e.razon)} · RUT ${rutFmt(e.rut)} · al ${fd(h)}`,csvBtn('eeff'))+
 `<div class="grid2"><div class="sheet"><div class="sheet-h"><h2>Estado de resultados</h2><span class="sub">Ejercicio ${S.anio}</span></div><div class="scroll"><table><thead><tr><th>Concepto</th>${colM?`<th class="n">${MESES[S.mes-1]}</th>`:''}<th class="n">Acumulado</th></tr></thead><tbody>
 ${rowsER('ING','Ingresos de explotación',false)}${rowsER('COS','Costo de ventas',true)}${lineER('Margen bruto',mi-mc,ing-cos)}
 ${rowsER('GAS','Gastos de administración y ventas',true)}${lineER('Resultado antes de impuesto',mi-mc-mg,ing-cos-gas)}
 ${cuentasG('IMP').length?rowsER('IMP','Impuesto a la renta',true):''}${lineER(resA>=0?'Utilidad del ejercicio':'Pérdida del ejercicio',resM,resA,'tot')}
 </tbody></table></div></div>
 <div class="sheet"><div class="sheet-h"><h2>Balance general clasificado</h2>${ok?'<span class="pill ok">Activo = Pasivo + Patrimonio</span>':'<span class="pill bad">No cuadra</span>'}</div><div class="scroll"><table><tbody>
 <tr class="sub"><td>Activo corriente</td><td class="n">${fmt(tAC)}</td></tr>${sec('AC',true)}
 <tr class="sub"><td>Activo no corriente</td><td class="n">${fmt(tANC)}</td></tr>${sec('ANC',true)}
 <tr class="tot"><td>Total activos</td><td class="n">${fmt(tAC+tANC)}</td></tr>
 <tr class="sub"><td>Pasivo corriente</td><td class="n">${fmt(tPC)}</td></tr>${sec('PC',false)}
 <tr class="sub"><td>Pasivo no corriente</td><td class="n">${fmt(tPNC)}</td></tr>${sec('PNC',false)}
 <tr class="sub"><td>Patrimonio</td><td class="n">${fmt(tPatr)}</td></tr>${sec('PAT',false)}
 ${Math.round(ant)?`<tr class="indent"><td>Resultados de ejercicios anteriores sin cerrar</td><td class="n">${fmt(ant)}</td></tr>`:''}
 <tr class="indent"><td>Resultado del ejercicio</td><td class="n">${fmt(resA)}</td></tr>
 <tr class="tot"><td>Total pasivos y patrimonio</td><td class="n">${fmt(tPC+tPNC+tPatr)}</td></tr>
 </tbody></table></div></div></div>`}

/* ---- Facturas por cobrar y por pagar: una fila por documento registrado, con filtros ---- */
function fxDe(kind){S.fx=S.fx||{};if(!S.fx[kind]){const R=rango();S.fx[kind]={desde:R[0],hasta:R[1],q:'',todas:false}}return S.fx[kind]}
function vFacturas(kind){const e=emp();const esCob=kind==='cobrar';const titulo=esCob?'Facturas por cobrar':'Facturas por pagar';
 if(!e)return head(titulo,'')+noEmp();if(!ready())return loading();
 const f=fxDe(kind);const tope=f.hasta||rango()[1];
 const todas=facturasDe(esCob?'ventas':'compras',tope).filter(r=>r.fecha>=f.desde&&r.fecha<=f.hasta);
 const q=norm(f.q),qn=rutClean(f.q),txt=String(f.q||'').trim();
 const hit=r=>!q||(qn.length>=3&&r.rut.includes(qn))||norm(r.razon).includes(q)||String(r.folio)===txt;
 const filtradas=todas.filter(hit);const ver=f.todas?filtradas:filtradas.filter(r=>Math.round(r.pend)!==0);
 const pend=sum(ver,r=>r.pend),total=sum(ver,r=>r.total),pag=sum(ver,r=>r.pagado);
 const venc=ver.filter(r=>r.pend>0&&r.dias>30);
 const favor=Math.round(sum(ctacte(esCob?claves().clientes:claves().proveedores,tope),g=>Math.max(0,+g.favor||0)));
 const ctrl=`<label class="fl">Desde<input type="date" id="fx-desde" data-fx="desde" data-fk="${kind}" value="${esc(f.desde)}"></label>`+
  `<label class="fl">Hasta<input type="date" id="fx-hasta" data-fx="hasta" data-fk="${kind}" value="${esc(f.hasta)}"></label>`+
  `<input id="fx-q" data-fx="q" data-fk="${kind}" value="${esc(f.q)}" placeholder="RUT, razón social o folio" style="min-width:min(240px,100%)">`+
  `<button class="btn sm ${f.todas?'':'pri'}" data-act="fx-todas" data-k="${kind}">${f.todas?'Viendo todas':'Solo pendientes'}</button>${csvBtn(kind)}`;
 const filas=ver.map(r=>`<tr><td class="c mono">${r.rut==='SINRUT'?'—':rutFmt(r.rut)}</td><td><b>${esc(r.razon||'—')}</b></td><td>${esc(CORTO[r.tipo]||r.tipo)}</td><td class="c">${esc(String(r.folio))}</td><td class="c">${fd(r.fecha)}</td><td class="n">${fz(r.total)}</td><td class="n">${fz(r.pagado)}</td><td class="n"><b>${fz(r.pend)}</b></td><td class="n">${r.dias}</td></tr>`).join('');
 const tabla=filas
  ?`<div class="scroll"><table><thead><tr><th>RUT</th><th>Razón social</th><th>Tipo</th><th>Folio</th><th>Fecha</th><th class="n">Total</th><th class="n">${esCob?'Cobrado':'Pagado'}</th><th class="n">Pendiente</th><th class="n">Días</th></tr></thead><tbody>`+
    filas+`<tr class="tot"><td colspan="5">Totales</td><td class="n">${fmt(total)}</td><td class="n">${fmt(pag)}</td><td class="n">${fmt(pend)}</td><td></td></tr></tbody></table></div>`
  :`<div class="empty"><h3>Sin documentos que mostrar</h3><p>Revisa el rango de fechas o el filtro de solo pendientes.</p></div>`;
 return head(titulo,`${ver.length} documento(s) · del ${fd(f.desde)} al ${fd(f.hasta)} · el pendiente ya tiene aplicadas las notas de crédito y los abonos`,ctrl)+
  `<div class="kpis"><div class="kpi"><span>${esCob?'Por cobrar':'Por pagar'}</span><b>${fmt(pend)}</b><small>${ver.length} documento(s)</small></div>`+
  `<div class="kpi"><span>Total documentos</span><b>${fmt(total)}</b></div>`+
  `<div class="kpi"><span>Ya ${esCob?'cobrado':'pagado'}</span><b>${fmt(pag)}</b></div>`+
  `<div class="kpi"><span>Con más de 30 días</span><b>${fmt(sum(venc,r=>r.pend))}</b><small>${venc.length} documento(s)</small></div></div>`+
  `${favor?`<div class="note">Saldos a favor ${esCob?'de clientes':'de proveedores'}: <b>${fmt(favor)}</b> (notas de crédito o pagos que exceden lo facturado).</div>`:''}`+
  `<div class="sheet">${tabla}</div>`;
}
