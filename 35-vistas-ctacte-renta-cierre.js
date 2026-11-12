/* Partida Doble · Vistas: cuentas corrientes, renta anual y cierre. */
function vCtacte(){const e=emp();if(!e)return head('Cuentas corrientes','')+noEmp();if(!ready())return loading();
 const ctas=auxCtas();if(!S.ccCta||!ctas.some(c=>c.codigo===S.ccCta))S.ccCta=claves().clientes;const cta=S.ccCta;const deud=esDeudora(cta);const [,h]=rango();
 const grupos=ctacte(cta,h);const nom=nombresRut();const nm=r=>r==='SINRUT'?'Sin RUT asignado':(nom[r]||'');
 const vis=grupos.filter(g=>Math.round(g.saldo)!==0);const B=[0,0,0,0];vis.forEach(g=>buckets(g.pend,h).forEach((v,i)=>B[i]+=v));const tot=sum(vis,g=>g.saldo);
 const g=S.ccRut?grupos.find(x=>x.rut===S.ccRut):null;const fp=S.f.pago;const cajas=plan().filter(c=>c.banco||c.codigo.startsWith('1101'));
 let det='';
 if(g){let s=0;const movs=g.mov.slice().sort((a,b)=>a.fecha<b.fecha?-1:1);
  det=`<div class="sheet"><div class="sheet-h"><div><h2>${g.rut==='SINRUT'?'Sin RUT asignado':rutFmt(g.rut)} ${esc(nm(g.rut))}</h2><span class="sub">Saldo ${deud?'por cobrar':'por pagar'} al ${fd(h)}: <b class="mono">${fmt(g.saldo)}</b>${g.favor?` · saldo a favor ${fmt(g.favor)}`:''}</span></div><button class="btn sm ghost" data-act="cc-cerrar">Cerrar detalle</button></div>
  <div class="sheet-b"><h3 style="font-size:13px;margin:0 0 6px">Documentos pendientes</h3><div class="scroll"><table><thead><tr><th>Fecha</th><th>Doc</th><th>Glosa</th><th class="n">Días</th><th class="n">Original</th><th class="n">Pendiente</th><th></th></tr></thead><tbody>
  ${g.pend.map(c=>`<tr><td class="c">${fd(c.fecha)}</td><td class="c">${esc(c.ref)}</td><td>${esc(c.glosa)}</td><td class="n">${dias(c.fecha,h)}</td><td class="n">${fmt(c.v)}</td><td class="n"><b>${fmt(c.pend)}</b></td><td>${g.rut==='SINRUT'?'':`<button class="btn sm" data-act="pago-abrir" data-id="${c.k}">${deud?'Registrar cobro':'Registrar pago'}</button>`}</td></tr>
  ${fp&&fp.k===c.k?`<tr><td colspan="7"><div class="row" style="padding:6px 0"><label class="fl">Fecha<input type="date" id="pago-fecha" data-f="pago.fecha" value="${esc(fp.fecha)}"></label><label class="fl">Monto<input class="num" id="pago-monto" data-f="pago.monto" value="${esc(fp.monto)}" inputmode="numeric"></label><label class="fl">${deud?'Depositado en':'Pagado desde'}<select id="pago-banco" data-f="pago.banco">${cajas.map(b=>`<option value="${b.codigo}" ${fp.banco===b.codigo?'selected':''}>${b.codigo} ${esc(b.nombre)}</option>`).join('')}</select></label><button class="btn pri" data-act="pago-save" style="align-self:flex-end">Crear asiento</button><button class="btn ghost" data-act="pago-cancel" style="align-self:flex-end">Cancelar</button></div></td></tr>`:''}`).join('')||'<tr><td colspan="7" class="muted">Sin documentos pendientes.</td></tr>'}
  </tbody></table></div>
  <h3 style="font-size:13px;margin:16px 0 6px">Movimientos</h3><div class="scroll"><table><thead><tr><th>Fecha</th><th>N°</th><th>Doc</th><th>Glosa</th><th class="n">Cargo</th><th class="n">Abono</th><th class="n">Saldo</th></tr></thead><tbody>
  ${movs.map(m=>{s+=m.v;return `<tr><td class="c">${fd(m.fecha)}</td><td class="c">${m.numero}</td><td class="c">${esc(m.ref)}</td><td>${esc(m.glosa)}</td><td class="n">${m.v>0?fmt(m.v):''}</td><td class="n">${m.v<0?fmt(-m.v):''}</td><td class="n">${fmt(s)}</td></tr>`}).join('')}
  </tbody></table></div></div></div>`}
 return head('Cuentas corrientes',`Saldos por RUT al ${fd(h)}. Los pagos se aplican primero al documento indicado y luego al más antiguo.`,`<label class="fl">Cuenta<select id="cc-cta" data-top="cc">${ctas.map(c=>`<option value="${c.codigo}" ${c.codigo===cta?'selected':''}>${c.codigo} ${esc(c.nombre)}</option>`).join('')}</select></label>`)+
 `<div class="kpis"><div class="kpi"><span>Total ${deud?'por cobrar':'por pagar'}</span><b>${fmt(tot)}</b><small>${vis.length} ${vis.length===1?'RUT':'RUTs'} con saldo</small></div>${['0 a 30 días','31 a 60 días','61 a 90 días','Más de 90 días'].map((t,i)=>`<div class="kpi"><span>${t}</span><b${i===3&&B[3]?' style="color:var(--bad)"':''}>${fmt(B[i])}</b><small>según fecha del documento</small></div>`).join('')}</div>`+det+
 `<div class="sheet">${vis.length?`<div class="scroll"><table><thead><tr><th>RUT</th><th>Razón social</th><th class="n">Docs</th><th class="n">0–30</th><th class="n">31–60</th><th class="n">61–90</th><th class="n">+90</th><th class="n">Saldo</th></tr></thead><tbody>
 ${vis.map(x=>{const b=buckets(x.pend,h);return `<tr class="click${x.rut===S.ccRut?' picked':''}" data-act="cc-rut" data-id="${x.rut}"><td class="c">${x.rut==='SINRUT'?'—':rutFmt(x.rut)}</td><td>${esc(nm(x.rut))}</td><td class="n">${x.pend.length}</td>${b.map((v,i)=>`<td class="n"${i===3&&v?' style="color:var(--bad)"':''}>${fz(v)}</td>`).join('')}<td class="n"><b>${fmt(x.saldo)}</b></td></tr>`}).join('')}
 <tr class="tot"><td colspan="3">Total</td>${B.map(v=>`<td class="n">${fmt(v)}</td>`).join('')}<td class="n">${fmt(tot)}</td></tr></tbody></table></div>`:`<div class="empty"><h3>Sin saldos pendientes</h3><p>Los documentos de compras y ventas y los asientos con RUT auxiliar aparecen aquí.</p></div>`}</div>`}

function vRenta(){const e=emp();if(!e)return head('Renta anual','')+noEmp();if(!ready())return loading();
 const x=rentaCalc();const aj=x.r.ajustes||[];const fa=S.f.aj||{tipo:'agregado',desc:'',monto:''};const n8=x.reg.startsWith('14 D N°8');
 return head('Renta anual',`Año comercial ${S.anio} · AT ${S.anio+1} · ${esc(x.reg||'Régimen no informado')}`,csvBtn('renta'))+
 `<div class="note">${x.flujo?'Base imponible por flujo de caja: ingresos percibidos menos egresos pagados. Los pendientes al cierre y los cobros o pagos de años anteriores se estiman desde las cuentas corrientes por RUT (en valores netos de IVA).':'Renta líquida imponible: resultado contable antes de impuesto más agregados y menos deducciones.'}${n8?' En el régimen 14 D N°8 la base se atribuye a los propietarios y la empresa no paga impuesto de primera categoría.':''}</div>
 <div class="kpis"><div class="kpi"><span>${x.flujo?'Base imponible':'Renta líquida imponible'}</span><b>${fmt(x.baseAf)}</b><small>${x.perdNueva?`Pérdida tributaria ${fmt(x.perdNueva)}`:'Después de pérdidas anteriores'}</small></div>
 <div class="kpi"><span>Impuesto 1ª categoría</span><b>${fmt(x.idpc)}</b><small>Tasa ${String(x.tasa).replace('.',',')}%</small></div>
 <div class="kpi"><span>PPM del año</span><b>${fmt(x.ppm)}</b><small>${x.r.ppm!==undefined&&x.r.ppm!==''?'Ingresado a mano':'Calculado desde los F29'}</small></div>
 <div class="kpi"><span>${x.res>=0?'Saldo a pagar':'Devolución estimada'}</span><b style="color:${x.res>0?'var(--bad)':'var(--ok)'}">${fmt(Math.abs(x.res))}</b><small>Impuesto − PPM</small></div></div>
 <div class="grid2"><div class="sheet"><div class="sheet-h"><h2>Determinación</h2><span class="sub">Al 31-12-${S.anio}</span></div><div class="scroll"><table><tbody>
 ${x.lines.map(([t,v,c])=>`<tr class="${c||''}"><td>${t}</td><td class="n">${fmt(v)}</td></tr>`).join('')}
 <tr class="sub"><td>= ${x.flujo?'Base imponible del ejercicio':'Renta líquida del ejercicio'}</td><td class="n">${fmt(x.base)}</td></tr>
 <tr><td>(−) Pérdida tributaria de ejercicios anteriores</td><td class="n">${fmt(-x.perd)}</td></tr>
 <tr class="sub"><td>= Base afecta</td><td class="n">${fmt(x.baseAf)}</td></tr>
 <tr><td>Impuesto de primera categoría (${String(x.tasa).replace('.',',')}%)</td><td class="n">${fmt(x.idpc)}</td></tr>
 <tr><td>(−) Pagos provisionales mensuales</td><td class="n">${fmt(-x.ppm)}</td></tr>
 <tr class="tot"><td>${x.res>=0?'Saldo a pagar':'Saldo a devolver'}</td><td class="n">${fmt(Math.abs(x.res))}</td></tr>
 ${x.flujo?`<tr><td class="muted">Capital propio tributario simplificado (referencial: activos − pasivos exigibles)</td><td class="n muted">${fmt(x.cpt)}</td></tr>`:''}
 </tbody></table></div></div>
 <div style="display:flex;flex-direction:column;gap:16px;min-width:0"><div class="sheet"><div class="sheet-h"><h2>Parámetros</h2></div><div class="sheet-b"><div class="form">
  <label>Tasa (%)<input id="rt-tasa" class="num" data-save="renta-tasa" value="${esc(x.r.tasa??'')}" placeholder="${String(tasaDefault()).replace('.',',')} (por defecto)" inputmode="decimal"></label>
  <label>Pérdida tributaria anterior<input id="rt-perd" class="num" data-save="renta-perd" value="${esc(x.r.perdidaAnt??'')}" inputmode="numeric"></label>
  <label>PPM pagados (reajustados)<input id="rt-ppm" class="num" data-save="renta-ppm" value="${esc(x.r.ppm??'')}" placeholder="${fmt(x.ppmCalc)} (calculado)" inputmode="numeric"></label>
 </div><p class="muted" style="font-size:12.5px;margin:10px 0 0">La tasa por defecto del 14 D N°3 es 12,5% para los años comerciales 2025 a 2027 (Ley 21.755), sujeta a cumplir la cotización empleadora; 25% en otros años. 14 A: 27%. Los PPM calculados no están reajustados.</p></div></div>
 <div class="sheet"><div class="sheet-h"><h2>Agregados y deducciones</h2></div><div class="sheet-b"><div class="form">
  <label>Tipo<select id="aj-tipo" data-f="aj.tipo"><option value="agregado" ${fa.tipo==='agregado'?'selected':''}>Agregado</option><option value="deduccion" ${fa.tipo==='deduccion'?'selected':''}>Deducción</option></select></label>
  <label class="wide">Concepto<input id="aj-desc" data-f="aj.desc" value="${esc(fa.desc)}" placeholder="Ej: Multas fiscales, gastos rechazados"></label>
  <label>Monto<input id="aj-monto" class="num" data-f="aj.monto" value="${esc(fa.monto)}" inputmode="numeric"></label>
 </div><div class="row" style="margin-top:10px"><button class="btn" data-act="aj-add">Agregar ajuste</button></div>
 ${aj.length?`<div class="scroll" style="margin-top:12px"><table><tbody>${aj.map(a=>`<tr><td><span class="pill ${a.tipo==='agregado'?'warn':'acc'}">${a.tipo==='agregado'?'Agregado':'Deducción'}</span></td><td>${esc(a.desc)}</td><td class="n">${fmt(a.monto)}</td><td>${confirmBtn('delAj:'+a.id,'Quitar')}</td></tr>`).join('')}</tbody></table></div>`:''}
 </div></div></div></div>
 <div class="note warn">Es una propuesta de trabajo. No incluye los registros RAI, REX y SAC ni la asignación de créditos a los propietarios; verifica los montos y códigos en el F22 del año tributario.</div>`}

function vCierre(){const e=emp();if(!e)return head('Cierre y apertura','')+noEmp();if(!ready())return loading();
 const anio=S.anio;const {L,res}=cierreLineas(anio);const ex=asientoOrigen('cierre',anio);const ap=asientoOrigen('apertura',anio+1);const k=claves();
 const opts=[];for(const y of [anio,anio-1])for(let m=12;m>=1;m--)opts.push(`${y}-${pad(m)}`);if(cerrado()&&!opts.includes(cerrado()))opts.unshift(cerrado());
 const fs=S.f.si||{fecha:`${anio}-01-01`};
 const resEx=ex?(()=>{const l=ex.lineas.find(l=>l.cuenta===k.resultado);return l?(l.haber||0)-(l.debe||0):0})():0;
 return head('Cierre y apertura',`Ejercicio ${anio} · ${esc(e.razon)}`,'')+
 `<div class="sheet"><div class="sheet-h"><h2>Bloqueo de períodos</h2><span class="sub">${cerrado()?`<span class="pill ok">Cerrado hasta ${cerradoTxt()}</span>`:'<span class="pill">Sin períodos cerrados</span>'}</span></div><div class="sheet-b">
  <div class="row"><label class="fl" style="min-width:min(260px,100%)">Cerrar todo hasta<select id="cierre-hasta" data-save="cerradoHasta" ${S.owner?'':'disabled'}><option value="">Sin bloqueo</option>${opts.map(o=>`<option value="${o}" ${cerrado()===o?'selected':''}>${MESES[+o.slice(5,7)-1]} ${o.slice(0,4)}</option>`).join('')}</select></label></div>
  <p class="muted" style="font-size:12.5px;margin:10px 0 0">Bloquea asientos y documentos de los meses ya declarados. Para corregir algo, elige un mes anterior o “Sin bloqueo”. La conciliación bancaria sigue disponible.${S.owner?'':' Solo el dueño de la app puede cerrar o abrir períodos.'}</p></div></div>
 <div class="sheet"><div class="sheet-h"><h2>Asiento de cierre ${anio}</h2><span class="sub">${ex?`<span class="pill ok">Generado: asiento N°${ex.numero}</span>`:'<span class="pill">Pendiente</span>'}</span></div><div class="sheet-b">
  <p class="muted" style="margin:0 0 10px;font-size:12.5px">Salda las cuentas de resultado contra ${esc(ctaTxt(k.resultado))} al 31-12-${anio}. Los reportes de ${anio} siguen mostrando el resultado del año; desde ${anio+1} las cuentas de resultado parten en cero.</p>
  ${L.length?`<div class="scroll"><table><thead><tr><th>Cuenta</th><th>Nombre</th><th class="n">Debe</th><th class="n">Haber</th></tr></thead><tbody>${L.map(l=>`<tr><td class="c">${l.cuenta}</td><td>${esc(ctaNom(l.cuenta))}</td><td class="n">${fz(l.debe)}</td><td class="n">${fz(l.haber)}</td></tr>`).join('')}<tr class="tot"><td></td><td>${res>=0?'Utilidad':'Pérdida'} del ejercicio ${fmt(Math.abs(res))}</td><td class="n">${fmt(sum(L,l=>l.debe))}</td><td class="n">${fmt(sum(L,l=>l.haber))}</td></tr></tbody></table></div>`:'<p class="muted">No hay saldos en cuentas de resultado para este año.</p>'}
  <div class="row" style="margin-top:12px"><button class="btn pri" data-act="cierre-gen" ${L.length?'':'disabled'}>${ex?'Regenerar asiento de cierre':'Generar asiento de cierre'}</button>${ex?confirmBtn('delAs:'+ex.id,'Eliminar cierre'):''}</div></div></div>
 <div class="sheet"><div class="sheet-h"><h2>Apertura ${anio+1}: traspaso del resultado</h2><span class="sub">${ap?`<span class="pill ok">Generado: asiento N°${ap.numero}</span>`:'<span class="pill">Pendiente</span>'}</span></div><div class="sheet-b">
  <p class="muted" style="margin:0 0 10px;font-size:12.5px">Los saldos de activo, pasivo y patrimonio se arrastran solos al año siguiente. Este asiento, al 01-01-${anio+1}, traspasa el resultado de ${anio} desde ${esc(ctaNom(k.resultado))} a ${esc(ctaNom(k.utilidades))}.</p>
  ${ex?`<div class="cuadre"><span>${resEx>=0?'Utilidad':'Pérdida'} a traspasar: <b>${fmt(Math.abs(resEx))}</b></span></div>`:'<p class="muted">Primero genera el asiento de cierre.</p>'}
  <div class="row" style="margin-top:12px"><button class="btn pri" data-act="ap-gen" ${ex&&resEx?'':'disabled'}>${ap?'Regenerar traspaso':'Generar traspaso'}</button></div></div></div>
 <div class="sheet"><div class="sheet-h"><h2>Saldos iniciales</h2><span class="sub">Para empresas que vienen de otro sistema</span></div><div class="sheet-b">
  <div class="form"><label>Fecha del asiento<input type="date" id="si-fecha" data-f="si.fecha" value="${esc(fs.fecha)}"></label></div>
  <textarea id="imp-txt-saldos" data-imp="saldos" style="margin-top:10px" placeholder="Código;Debe;Haber;RUT (opcional)&#10;1101002;2500000;&#10;1102001;800000;;76123456-0&#10;3101001;;3300000">${esc(S.imp.saldos||'')}</textarea>
  <div class="row" style="margin-top:10px"><button class="btn pri" data-act="si-imp">Crear asiento de apertura</button><span class="muted">El total del debe debe igualar al haber. Usa una línea por RUT para clientes y proveedores.</span></div></div></div>`}

