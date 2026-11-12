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

