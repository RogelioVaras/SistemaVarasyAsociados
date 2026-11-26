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
const FX_TRAMOS=['0-30','31-60','61-90','más de 90'];
const tramoDe=d=>d<=30?'0-30':d<=60?'31-60':d<=90?'61-90':'más de 90';
function fxDe(kind){S.fx=S.fx||{};if(!S.fx[kind]){const R=rango();S.fx[kind]={desde:R[0],hasta:R[1]}}
 const f=S.fx[kind];
 if(f.q==null)f.q='';if(f.todas==null)f.todas=false;if(f.venc==null)f.venc='todas';
 if(f.plazo==null)f.plazo='30';if(f.tipo==null)f.tipo='';if(f.tramo==null)f.tramo='';if(f.agrupar==null)f.agrupar=false;
 if(!f.desde||!f.hasta){const R=rango();f.desde=R[0];f.hasta=R[1]}
 return f}
/* Aplica todos los filtros del informe y devuelve lo que se muestra, sirve para pantalla, CSV y PDF. */
function facturasFiltradas(kind){const f=fxDe(kind);const esCob=kind==='cobrar';const tope=f.hasta||rango()[1];
 const plazo=Math.max(1,Math.round(pn(f.plazo)||30));
 const todas=facturasDe(esCob?'ventas':'compras',tope,{plazo}).filter(r=>r.fecha>=f.desde&&r.fecha<=f.hasta);
 const q=norm(f.q),qn=rutClean(f.q),txt=String(f.q||'').trim();
 const hit=r=>!q||(qn.length>=3&&r.rut.includes(qn))||norm(r.razon).includes(q)||String(r.folio)===txt;
 let ver=todas.filter(hit);
 if(f.tipo)ver=ver.filter(r=>String(r.tipo)===String(f.tipo));
 if(f.tramo)ver=ver.filter(r=>tramoDe(r.dias)===f.tramo);
 if(f.venc==='vencidas')ver=ver.filter(r=>r.diasVenc>0);
 else if(f.venc==='porVencer')ver=ver.filter(r=>r.diasVenc<=0);
 if(!f.todas)ver=ver.filter(r=>Math.round(r.pend)!==0);
 const cta=esCob?claves().clientes:claves().proveedores;
 const favor=Math.round(sum(ctacte(cta,tope),g=>Math.max(0,+g.favor||0)));
 return {f,esCob,plazo,todas,ver,favor}}
function agruparFacturas(ver){const m={};
 for(const r of ver){const g=m[r.rut]||(m[r.rut]={rut:r.rut,razon:'',n:0,total:0,pagado:0,pend:0,vencido:0});
  g.n++;g.total+=r.total;g.pagado+=r.pagado;g.pend+=r.pend;if(r.diasVenc>0)g.vencido+=r.pend;if(!g.razon&&r.razon)g.razon=r.razon}
 return Object.values(m).sort((a,b)=>b.pend-a.pend)}
/* Contenido que cambia con los filtros (indicadores, saldos a favor y tabla).
   Se pinta aparte para no reemplazar los campos de filtro mientras se escriben. */
function fxRes(kind){if(kind==='honorarios')return fxResHon();
 const esCob=kind==='cobrar';
 const {f,todas,ver,favor}=facturasFiltradas(kind);
 const pend=sum(ver,r=>r.pend),total=sum(ver,r=>r.total),pag=sum(ver,r=>r.pagado);
 const vencido=sum(ver,r=>r.diasVenc>0?r.pend:0);const nVenc=ver.filter(r=>r.diasVenc>0).length;
 const kpis=`<div class="kpis"><div class="kpi"><span>${esCob?'Por cobrar':'Por pagar'}</span><b>${fmt(pend)}</b><small>${ver.length} documento(s)</small></div>`+
  `<div class="kpi"><span>Vencido</span><b${vencido?' style="color:var(--bad)"':''}>${fmt(vencido)}</b><small>${nVenc} documento(s) con más de ${f.plazo} días</small></div>`+
  `<div class="kpi"><span>Total documentos</span><b>${fmt(total)}</b></div>`+
  `<div class="kpi"><span>Ya ${esCob?'cobrado':'pagado'}</span><b>${fmt(pag)}</b></div></div>`;
 let tabla='';
 if(f.agrupar){const gr=agruparFacturas(ver);
  tabla=gr.length?`<div class="scroll"><table><thead><tr><th>RUT</th><th>Razón social</th><th class="n">Docs</th><th class="n">Total</th><th class="n">${esCob?'Cobrado':'Pagado'}</th><th class="n">Pendiente</th><th class="n">Vencido</th></tr></thead><tbody>`+
   gr.map(g=>`<tr class="click" data-act="fx-ver" data-k="${kind}" data-rut="${esc(g.rut)}"><td class="c mono">${g.rut==='SINRUT'?'—':rutFmt(g.rut)}</td><td><b>${esc(g.razon||'—')}</b></td><td class="n">${g.n}</td><td class="n">${fz(g.total)}</td><td class="n">${fz(g.pagado)}</td><td class="n"><b>${fz(g.pend)}</b></td><td class="n">${g.vencido?`<b style="color:var(--bad)">${fz(g.vencido)}</b>`:''}</td></tr>`).join('')+
   `<tr class="tot"><td colspan="3">Totales</td><td class="n">${fmt(total)}</td><td class="n">${fmt(pag)}</td><td class="n">${fmt(pend)}</td><td class="n">${fmt(vencido)}</td></tr></tbody></table></div>`
  :`<div class="empty"><h3>Sin documentos que mostrar</h3><p>Revisa los filtros o apaga "Solo pendientes".</p></div>`;
 }else{
  const filas=ver.map(r=>`<tr><td class="c mono">${r.rut==='SINRUT'?'—':rutFmt(r.rut)}</td><td><b>${esc(r.razon||'—')}</b></td><td>${esc(CORTO[r.tipo]||r.tipo)}</td><td class="c">${esc(String(r.folio))}</td><td class="c">${fd(r.fecha)}</td><td class="c">${fd(r.vence)}${r.diasVenc>0?` <span class="pill bad">vencida</span>`:''}</td><td class="n">${fz(r.total)}</td><td class="n">${fz(r.pagado)}</td><td class="n"><b>${fz(r.pend)}</b></td><td class="n">${r.dias}</td></tr>`).join('');
  tabla=filas?`<div class="scroll"><table><thead><tr><th>RUT</th><th>Razón social</th><th>Tipo</th><th>Folio</th><th>Fecha</th><th>Vence</th><th class="n">Total</th><th class="n">${esCob?'Cobrado':'Pagado'}</th><th class="n">Pendiente</th><th class="n">Días</th></tr></thead><tbody>`+
   filas+`<tr class="tot"><td colspan="6">Totales</td><td class="n">${fmt(total)}</td><td class="n">${fmt(pag)}</td><td class="n">${fmt(pend)}</td><td></td></tr></tbody></table></div>`
  :`<div class="empty"><h3>Sin documentos que mostrar</h3><p>Revisa los filtros o apaga "Solo pendientes".</p></div>`;
 }
 return kpis+`${favor?`<div class="note">Saldos a favor ${esCob?'de clientes':'de proveedores'}: <b>${fmt(favor)}</b> (notas de crédito o pagos que exceden lo facturado).</div>`:''}`+
  `<div class="sheet">${tabla}</div>`;
}
/* Vuelve a pintar solo el resultado, sin tocar los campos de filtro. */
function fxPintar(kind){const el=document.getElementById('fx-res');if(el)el.innerHTML=fxRes(kind)}
function vFacturas(kind){const e=emp();const esCob=kind==='cobrar';const titulo=esCob?'Facturas por cobrar':'Facturas por pagar';
 if(!e)return head(titulo,'')+noEmp();if(!ready())return loading();
 const f=fxDe(kind);const {todas}=facturasFiltradas(kind);
 const tipos=[...new Set(todas.map(r=>String(r.tipo)))].sort();
 const ctrl=`<label class="fl">Desde<input type="date" id="fx-desde" data-fx="desde" data-fk="${kind}" value="${esc(f.desde)}"></label>`+
  `<label class="fl">Hasta<input type="date" id="fx-hasta" data-fx="hasta" data-fk="${kind}" value="${esc(f.hasta)}"></label>`+
  `<input id="fx-q" data-fx="q" data-fk="${kind}" value="${esc(f.q)}" placeholder="RUT, razón social o folio" style="min-width:min(200px,100%)">`+
  `<label class="fl">Vence<select id="fx-venc" data-fx="venc" data-fk="${kind}"><option value="todas"${f.venc==='todas'?' selected':''}>Todas</option><option value="vencidas"${f.venc==='vencidas'?' selected':''}>Vencidas</option><option value="porVencer"${f.venc==='porVencer'?' selected':''}>Por vencer</option></select></label>`+
  `<label class="fl">Plazo<input class="num" id="fx-plazo" data-fx="plazo" data-fk="${kind}" value="${esc(String(f.plazo))}" inputmode="numeric" style="width:64px" title="Días de plazo para el vencimiento"></label>`+
  `<label class="fl">Tipo<select id="fx-tipo" data-fx="tipo" data-fk="${kind}"><option value=""${f.tipo===''?' selected':''}>Todos</option>${tipos.map(x=>`<option value="${x}"${String(f.tipo)===x?' selected':''}>${esc(CORTO[+x]||x)}</option>`).join('')}</select></label>`+
  `<label class="fl">Antigüedad<select id="fx-tramo" data-fx="tramo" data-fk="${kind}"><option value=""${f.tramo===''?' selected':''}>Todas</option>${FX_TRAMOS.map(x=>`<option value="${esc(x)}"${f.tramo===x?' selected':''}>${esc(x)}</option>`).join('')}</select></label>`+
  `<button class="btn sm ${f.agrupar?'pri':''}" data-act="fx-agrupar" data-k="${kind}">${f.agrupar?'Por cliente':'Ver por cliente'}</button>`+
  `<button class="btn sm ${f.todas?'':'pri'}" data-act="fx-todas" data-k="${kind}">${f.todas?'Viendo todas':'Solo pendientes'}</button>`+
  `<button class="btn sm ghost" data-act="fx-limpiar" data-k="${kind}" title="Volver a los filtros del período">Limpiar</button>`+csvBtn(kind);
 return head(titulo,'Filtra por fecha, cliente, vencimiento o antigüedad · el pendiente ya tiene aplicadas las notas de crédito y los abonos',ctrl)+
  `<div id="fx-res">${fxRes(kind)}</div>`;
}

/* ---- Boletas de honorarios por pagar: mismos filtros que facturas, solo boletas ---- */
function honsFiltradas(){
 const f=fxDe('honorarios');const tope=f.hasta||rango()[1];const plazo=Math.max(1,Math.round(pn(f.plazo)||30));
 const todas=honorariosDe(tope,{plazo}).filter(r=>r.fecha>=f.desde&&r.fecha<=f.hasta);
 const q=norm(f.q),qn=rutClean(f.q),txt=String(f.q||'').trim();
 let ver=todas.filter(r=>!q||(qn.length>=3&&r.rut.includes(qn))||norm(r.razon).includes(q)||String(r.folio)===txt);
 if(f.tramo)ver=ver.filter(r=>tramoDe(r.dias)===f.tramo);
 if(f.venc==='vencidas')ver=ver.filter(r=>r.diasVenc>0);else if(f.venc==='porVencer')ver=ver.filter(r=>r.diasVenc<=0);
 if(!f.todas)ver=ver.filter(r=>Math.round(r.pend)!==0);
 return {f,todas,ver,plazo};
}
function fxResHon(){const {f,ver}=honsFiltradas();
 const pend=sum(ver,r=>r.pend),total=sum(ver,r=>r.total),pag=sum(ver,r=>r.pagado),bruto=sum(ver,r=>r.bruto),ret=sum(ver,r=>r.ret);
 const vencido=sum(ver,r=>r.diasVenc>0?r.pend:0);const nVenc=ver.filter(r=>r.diasVenc>0).length;
 const kpis=`<div class="kpis"><div class="kpi"><span>Por pagar</span><b>${fmt(pend)}</b><small>${ver.length} boleta(s)</small></div>`+
  `<div class="kpi"><span>Vencido</span><b${vencido?' style="color:var(--bad)"':''}>${fmt(vencido)}</b><small>${nVenc} con más de ${f.plazo} días</small></div>`+
  `<div class="kpi"><span>Total líquido</span><b>${fmt(total)}</b><small>bruto ${fmt(bruto)} · retención ${fmt(ret)}</small></div>`+
  `<div class="kpi"><span>Ya pagado</span><b>${fmt(pag)}</b></div></div>`;
 let tabla='';
 if(f.agrupar){const gr=agruparFacturas(ver);
  tabla=gr.length?`<div class="scroll"><table><thead><tr><th>RUT</th><th>Prestador</th><th class="n">Boletas</th><th class="n">Líquido</th><th class="n">Pagado</th><th class="n">Pendiente</th><th class="n">Vencido</th></tr></thead><tbody>`+
   gr.map(g=>`<tr class="click" data-act="fx-ver" data-k="honorarios" data-rut="${esc(g.rut)}"><td class="c mono">${g.rut==='SINRUT'?'—':rutFmt(g.rut)}</td><td><b>${esc(g.razon||'—')}</b></td><td class="n">${g.n}</td><td class="n">${fz(g.total)}</td><td class="n">${fz(g.pagado)}</td><td class="n"><b>${fz(g.pend)}</b></td><td class="n">${g.vencido?`<b style="color:var(--bad)">${fz(g.vencido)}</b>`:''}</td></tr>`).join('')+
   `<tr class="tot"><td colspan="3">Totales</td><td class="n">${fmt(total)}</td><td class="n">${fmt(pag)}</td><td class="n">${fmt(pend)}</td><td class="n">${fmt(vencido)}</td></tr></tbody></table></div>`
  :`<div class="empty"><h3>Sin boletas que mostrar</h3><p>Revisa los filtros o apaga "Solo pendientes".</p></div>`;
 }else{
  const filas=ver.map(r=>`<tr><td class="c mono">${r.rut==='SINRUT'?'—':rutFmt(r.rut)}</td><td><b>${esc(r.razon||'—')}</b></td><td class="c">${esc(r.folio)}</td><td class="c">${fd(r.fecha)}</td><td class="c">${fd(r.vence)}${r.diasVenc>0?' <span class="pill bad">vencida</span>':''}</td><td class="n">${fz(r.bruto)}</td><td class="n">${fz(r.ret)}</td><td class="n">${fz(r.total)}</td><td class="n">${fz(r.pagado)}</td><td class="n"><b>${fz(r.pend)}</b></td><td class="n">${r.dias}</td></tr>`).join('');
  tabla=filas?`<div class="scroll"><table><thead><tr><th>RUT</th><th>Prestador</th><th>N° boleta</th><th>Fecha</th><th>Vence</th><th class="n">Bruto</th><th class="n">Retención</th><th class="n">Líquido</th><th class="n">Pagado</th><th class="n">Pendiente</th><th class="n">Días</th></tr></thead><tbody>`+
   filas+`<tr class="tot"><td colspan="5">Totales</td><td class="n">${fmt(bruto)}</td><td class="n">${fmt(ret)}</td><td class="n">${fmt(total)}</td><td class="n">${fmt(pag)}</td><td class="n">${fmt(pend)}</td><td></td></tr></tbody></table></div>`
  :`<div class="empty"><h3>Sin boletas que mostrar</h3><p>Revisa los filtros o apaga "Solo pendientes".</p></div>`;
 }
 const sinAsiento=ver.filter(r=>!r.centralizada).length;
 return kpis+`${sinAsiento?`<div class="note warn">${sinAsiento} boleta(s) sin asiento centralizado: aparecen con el líquido completo como pendiente.</div>`:''}`+`<div class="sheet">${tabla}</div>`;
}
function vHonPagar(){const e=emp();const titulo='Boletas de honorarios por pagar';
 if(!e)return head(titulo,'')+noEmp();if(!ready())return loading();
 const f=fxDe('honorarios');
 const ctrl=`<label class="fl">Desde<input type="date" id="fx-desde" data-fx="desde" data-fk="honorarios" value="${esc(f.desde)}"></label>`+
  `<label class="fl">Hasta<input type="date" id="fx-hasta" data-fx="hasta" data-fk="honorarios" value="${esc(f.hasta)}"></label>`+
  `<input id="fx-q" data-fx="q" data-fk="honorarios" value="${esc(f.q)}" placeholder="RUT, prestador o N° de boleta" style="min-width:min(200px,100%)">`+
  `<label class="fl">Vence<select id="fx-venc" data-fx="venc" data-fk="honorarios"><option value="todas"${f.venc==='todas'?' selected':''}>Todas</option><option value="vencidas"${f.venc==='vencidas'?' selected':''}>Vencidas</option><option value="porVencer"${f.venc==='porVencer'?' selected':''}>Por vencer</option></select></label>`+
  `<label class="fl">Plazo<input class="num" id="fx-plazo" data-fx="plazo" data-fk="honorarios" value="${esc(String(f.plazo))}" inputmode="numeric" style="width:64px" title="Días de plazo para el vencimiento"></label>`+
  `<label class="fl">Antigüedad<select id="fx-tramo" data-fx="tramo" data-fk="honorarios"><option value=""${f.tramo===''?' selected':''}>Todas</option>${FX_TRAMOS.map(x=>`<option value="${esc(x)}"${f.tramo===x?' selected':''}>${esc(x)}</option>`).join('')}</select></label>`+
  `<button class="btn sm ${f.agrupar?'pri':''}" data-act="fx-agrupar" data-k="honorarios">${f.agrupar?'Por prestador':'Ver por prestador'}</button>`+
  `<button class="btn sm ${f.todas?'':'pri'}" data-act="fx-todas" data-k="honorarios">${f.todas?'Viendo todas':'Solo pendientes'}</button>`+
  `<button class="btn sm ghost" data-act="fx-limpiar" data-k="honorarios" title="Volver a los filtros del período">Limpiar</button>`+csvBtn('honPagar');
 return head(titulo,'Solo boletas de honorarios · la deuda es el líquido (bruto menos retención) · los pagos se rebajan desde Cuentas corrientes, cuenta Honorarios por pagar',ctrl)+
  `<div id="fx-res">${fxResHon()}</div>`;
}
