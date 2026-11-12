/* Partida Doble · Vista: IVA y Formulario 29. */
function vIva(){const e=emp();if(!e)return head('IVA y F29','')+noEmp();if(!ready())return loading();if(!S.mes)return head('IVA y F29','')+needMes();
 const ym=ymSel();const x=ivaMes(ym);const r=S.rcv[ym]||{};const sii=r.sii||{};
 const L=(cod,txt,cant,monto,cls='')=>`<tr class="${cls}"><td>${cod}</td><td>${txt}</td><td class="n">${cant===''?'':cant}</td><td class="n">${monto===''?'':fmt(monto)}</td></tr>`;
 const sg=d=>+d.tipo===61?-1:1;const appT=k=>({iva:Math.round(sum(r[k]||[],d=>sg(d)*((+d.iva||0)+(+d.ivaUC||0)))),tot:Math.round(sum(r[k]||[],d=>sg(d)*(+d.total||0))),n:(r[k]||[]).length});
 const aC=appT('compras'),aV=appT('ventas');const difRow=(t,app,key)=>{const v=sii[key];const has=v!==undefined&&v!=='';const d=has?app-v:0;return `<tr><td>${t}</td><td class="n">${fmt(app)}</td><td><input class="num" id="sii-${key}" data-save="sii" data-key="${key}" value="${has?esc(v):''}" inputmode="numeric" style="width:130px"></td><td class="n">${has?(d===0?'<span class="pill ok">Cuadra</span>':`<span class="pill bad">${fmt(d)}</span>`):''}</td></tr>`};
 const ucAj=x.uc-x.ucRec;const exAj=asientos().find(a=>a.origen&&a.origen.kind==='ajusteUC'&&a.origen.ym===ym);
 return head('IVA y F29',`Propuesta de declaración de ${esc(perTxt())} a partir de los libros de compras, ventas y honorarios.`,'')+
 `<div class="kpis"><div class="kpi"><span>Débito fiscal</span><b>${fmt(x.debito)}</b></div><div class="kpi"><span>Crédito fiscal</span><b>${fmt(x.credito)}</b><small>+ remanente anterior ${fmt(x.remAnt)}${x.reaj?' (reajustado)':''}</small></div>
 <div class="kpi"><span>${x.remSig?'Remanente para el mes siguiente':'IVA determinado'}</span><b>${fmt(x.remSig||x.ivaPagar)}</b></div><div class="kpi"><span>Total a pagar F29</span><b style="color:var(--accent)">${fmt(x.total)}</b><small>IVA + PPM + retenciones</small></div></div>
 <div class="grid2"><div class="sheet"><div class="sheet-h"><h2>Ajustes del período</h2></div><div class="sheet-b"><div class="form">
  <label>Remanente CF mes anterior (cód. 504)<input id="iva-rem" class="num" data-save="remAnt" value="${x.manual?esc(r.remAnt):''}" placeholder="${fmt(x.remAnt)} (calculado)" inputmode="numeric"></label>
  <label>UTM de ${MESES[S.mes-1].toLowerCase()}<input id="iva-utm" class="num" data-save="utm" data-key="${ym}" value="${utm(ym)||''}" inputmode="numeric" ${S.ro?'':''}></label>
  <label>UTM del mes anterior<input id="iva-utm-p" class="num" data-save="utm" data-key="${prevYm(ym)}" value="${utm(prevYm(ym))||''}" inputmode="numeric"></label>
  <label>Tasa PPM (%)<input id="iva-tasa" class="num" data-save="tasaPPM" value="${esc(e.tasaPPM||0)}" inputmode="decimal"></label>
  <label>Retención honorarios (cód. 151)<input id="iva-ret" class="num" data-save="retHon" value="${x.retManual?esc(r.retHon):''}" placeholder="${fmt(x.honRet)} (libro de honorarios)" inputmode="numeric"></label>
 </div><p class="muted" style="font-size:12.5px;margin:10px 0 0">Con las UTM de ambos meses, el remanente calculado se reajusta solo. La tabla de UTM es común a todas las empresas. Revisa los códigos contra el formulario vigente antes de declarar.</p></div></div>
 <div class="sheet"><div class="sheet-h"><h2>PPM e IVA de uso común</h2></div><div class="sheet-b"><div class="cuadre" style="flex-direction:column;align-items:flex-start;gap:6px"><span>Ingresos netos del mes: <b>${fmt(x.base)}</b> · tasa <b>${String(x.tasa).replace('.',',')}%</b> · PPM <b>${fmt(x.ppm)}</b></span>
 ${x.uc?`<span>IVA uso común: <b>${fmt(x.uc)}</b> · factor proporcional ${String((x.fuc*100).toFixed(2)).replace('.',',')}% · crédito <b>${fmt(x.ucRec)}</b></span><span>Parte no recuperable para llevar a gasto: <b>${fmt(ucAj)}</b> ${exAj?`<span class="pill ok">Ajuste N°${exAj.numero}</span>`:''}</span>`:'<span class="muted">Sin IVA de uso común este mes.</span>'}
 ${x.ivaAF?`<span>Del crédito, IVA de activo fijo: <b>${fmt(x.ivaAF)}</b></span>`:''}</div>
 ${x.uc&&ucAj?`<div class="row" style="margin-top:10px"><button class="btn" data-act="uc-ajuste">${exAj?'Actualizar':'Generar'} asiento de ajuste</button></div>`:''}
 <p class="muted" style="font-size:12.5px;margin:10px 0 0">El factor usa las ventas afectas sobre el total de ventas acumuladas del año hasta este mes.</p></div></div></div>
 <div class="sheet"><div class="sheet-h"><h2>Formulario 29 · ${esc(perTxt())}</h2>${csvBtn('f29')}</div><div class="scroll"><table class="f29"><thead><tr><th>Código</th><th>Concepto</th><th class="n">Cant.</th><th class="n">Monto</th></tr></thead><tbody>
 <tr class="sub"><td></td><td colspan="3">Débitos</td></tr>
 ${L('503 / 502','Facturas emitidas',x.V.f33.n,x.V.f33.iva)}${L('110 / 111','Boletas',x.V.b39.n,x.V.b39.iva)}${L('512 / 513','Notas de débito emitidas',x.V.nd.n,x.V.nd.iva)}${L('509 / 510','Notas de crédito emitidas',x.V.nc.n,x.V.nc.iva)}
 ${L('586 / 142','Ventas exentas o no gravadas',x.V.f34.n+x.V.b41.n,x.V.f34.total+x.V.b41.total+x.V.f33.exento)}
 ${L('538','Total débitos','',x.debito,'tot')}
 <tr class="sub"><td></td><td colspan="3">Créditos</td></tr>
 ${L('519 / 520','Facturas recibidas del giro',x.C.f33.n,x.C.f33.iva)}${L('531 / 532','Notas de débito recibidas',x.C.nd.n,x.C.nd.iva)}${L('527 / 528','Notas de crédito recibidas',x.C.nc.n,x.C.nc.iva)}
 ${x.C.fc46.n?L('—','Facturas de compra emitidas (crédito)',x.C.fc46.n,x.C.fc46.iva):''}${x.C.din.n?L('534 / 535','Importaciones del giro (DIN)',x.C.din.n,x.C.din.iva):''}
 ${x.uc?L('—','IVA uso común (proporcional)','',x.ucRec):''}
 ${L('564 / 521','Compras exentas o no gravadas',x.C.f34.n,x.C.f34.total+x.C.f33.exento)}
 ${L('504','Remanente crédito fiscal mes anterior','',x.remAnt)}
 ${L('537','Total créditos','',x.credito+x.remAnt,'tot')}
 <tr class="sub"><td></td><td colspan="3">Determinación</td></tr>
 ${L('89','IVA determinado a pagar','',x.ivaPagar)}${L('77','Remanente crédito fiscal para el período siguiente','',x.remSig)}
 ${L('563','Base imponible PPM','',x.base)}${L('115','Tasa PPM (%)','',''). replace('<td class="n"></td></tr>',`<td class="n">${String(x.tasa).replace('.',',')}</td></tr>`)}${L('62','PPM neto determinado','',x.ppm)}
 ${L('48','Impuesto único de segunda categoría (remuneraciones)','',x.iu)}${L('151','Retención honorarios','',x.ret)}${x.ret46?L('—','IVA retenido en facturas de compra (cambio de sujeto)','',x.ret46):''}
 ${L('91','Total a pagar dentro del plazo legal','',x.total,'tot')}
 </tbody></table></div></div>
 <div class="sheet"><div class="sheet-h"><h2>Cuadre con el Registro de Compras y Ventas</h2><span class="sub">Copia los totales del resumen del RCV en el SII</span></div><div class="scroll"><table><thead><tr><th>Concepto</th><th class="n">Según la app</th><th>Según el SII</th><th class="n">Diferencia</th></tr></thead><tbody>
 ${difRow(`IVA compras (${aC.n} docs)`,aC.iva,'ivaC')}${difRow('Total compras',aC.tot,'totC')}${difRow(`IVA ventas (${aV.n} docs)`,aV.iva,'ivaV')}${difRow('Total ventas',aV.tot,'totV')}
 </tbody></table></div></div>`}

