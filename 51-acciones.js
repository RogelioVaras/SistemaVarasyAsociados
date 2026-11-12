/* Partida Doble · Acciones de los botones (A) y confirmaciones de eliminación (CONFIRM). */
/* ============ Acciones ============ */
function blankEd(){const [d,h]=rango();const f=hoy();return{id:null,numero:null,fecha:enRango(f,[d,h])?f:d,tipo:'Traspaso',glosa:'',lineas:[{cuenta:'',debe:'',haber:'',glosa:''},{cuenta:'',debe:'',haber:'',glosa:''}]}}
function parseCta(txt){txt=String(txt||'').trim();if(!txt)return'';const code=txt.split(/\s+/)[0];if(cm()[code])return code;const n=norm(txt);const hit=plan().find(c=>norm(c.nombre)===n)||plan().filter(c=>norm(c.nombre).includes(n));return Array.isArray(hit)?(hit.length===1?hit[0].codigo:''):(hit?hit.codigo:'')}
function updEdTot(){const t=edTotals();const el=$('#ed-tot');if(el)el.innerHTML=`<span>Debe <b>${fmt(t.d)}</b></span><span>Haber <b>${fmt(t.h)}</b></span>${t.ok?'<span class="pill ok">Cuadrado</span>':`<span class="pill bad">Diferencia ${fmt(t.d-t.h)}</span>`}`;const b=$('#ed-save');if(b)b.disabled=!t.ok}
function updHon(){const f=S.f.hon;const el=$('#hf-calc');if(!f||!el)return;const b=Math.round(pn(f.bruto));const r=f.retenida==='0'?0:Math.round(b*tasaHon(+String(f.fecha).slice(0,4))/100);el.innerHTML=`<span>Retención <b>${fmt(r)}</b></span><span>Líquido a pagar <b>${fmt(b-r)}</b></span>`}
function calcDoc(kind,changed){const f=S.f[kind];const tipo=+f.tipo;const set=(id,v)=>{const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=v};
 if((tipo===39)&&changed==='total'){const t=pn(f.total);const neto=Math.round(t/1.19);f.neto=String(neto);f.iva=String(t-neto);f.exento='';set('df-neto',f.neto);set('df-iva',f.iva);set('df-exento','');return}
 if(tipo===41&&changed==='total'){f.exento=f.total;f.neto='';f.iva='';set('df-exento',f.exento);set('df-neto','');set('df-iva','');return}
 if(changed==='neto'||changed==='tipo'){const iva=[34,41].includes(tipo)?0:Math.round(pn(f.neto)*0.19);f.iva=iva?String(iva):'';set('df-iva',f.iva)}
 if(['neto','iva','exento','ivaNoRec','ivaUC','tipo'].includes(changed)){const t=pn(f.exento)+pn(f.neto)+pn(f.iva)+pn(f.ivaNoRec)+pn(f.ivaUC);f.total=t?String(Math.round(t)):'';set('df-total',f.total)}}

/* Al digitar un RUT: valida el dígito verificador y completa los campos que la app ya conoce
   (razón social, giro, dirección y comuna). No pisa lo que la persona ya escribió. */
function autoRut(input,cfg){const f=S.f[cfg.f];if(!f)return;const msg=document.getElementById(cfg.msg);
 const aviso=h=>{if(msg)msg.innerHTML=h};
 const c=rutClean(input.value);
 if(c.length<2){aviso('');return}
 if(!rutOk(c)){aviso(c.length>=8?'<span style="color:var(--bad)">Revisa el dígito verificador</span>':'<span style="color:var(--muted)">Sigue escribiendo el RUT</span>');return}
 const llenar=d=>{let n=0;cfg.map.forEach(([id,k])=>{const v=d[k];if(!v||String(f[k]||'').trim())return;f[k]=v;const el=document.getElementById(id);if(el)el.value=v;n++});return n};
 const d=fichaPorRut(c);
 if(d){const n=llenar(d);aviso('<span style="color:var(--ok)">RUT válido</span> · '+(n?'completé '+n+' dato(s) desde '+d.desde:'ya estaba todo escrito'));return}
 aviso('<span style="color:var(--ok)">RUT válido</span> · no hay datos guardados de este RUT');
 Promise.resolve(rutRemoto(c)).then(r=>{if(!r)return;const cur=S.f[cfg.f];if(!cur||rutClean(cur.rut)!==c)return;
  if(llenar(r))aviso('<span style="color:var(--ok)">RUT válido</span> · datos traídos desde '+r.desde)}).catch(()=>{})}
const autoRutEmp=input=>autoRut(input,{f:'emp',msg:'emp-rut-msg',map:[['emp-razon','razon'],['emp-giro','giro'],['emp-dir','direccion'],['emp-comuna','comuna']]});
const autoRutDoc=(kind,input)=>autoRut(input,{f:kind,msg:'df-rut-msg',map:[['df-razon','razon']]});

const A={
 /* Abre o cierra una sección del menú lateral (General, Registros, Impuestos, …). */
 nav:(el)=>{const g=el.dataset.g;const st=navEst();st[g]=!navAbierto(g);lsSet('pd.nav',JSON.stringify(st));renderNav()},
 'emp-new':()=>{S.f.emp={rut:'',razon:'',giro:'',direccion:'',comuna:'',regimen:REGIMENES[0],tasaPPM:'0,25',inicio:''}},
 'emp-edit':t=>{const e=S.emps.find(x=>x.id===t.dataset.id);S.f.emp={...clone(e)}},
 'emp-cancel':()=>{S.f.emp=null},
 'emp-save':async()=>{const f=S.f.emp;if(!rutOk(f.rut)){toast('El RUT no es válido. Revisa el dígito verificador.','err');return}if(!String(f.razon||'').trim()){toast('Falta la razón social.','err');return}
  const dup=S.emps.find(e=>rutClean(e.rut)===rutClean(f.rut)&&e.id!==f.id);if(dup){toast('Ya existe una empresa con ese RUT.','err');return}
  const id=f.id||uid();const prev=S.emps.find(e=>e.id===id);const data={...(prev?clone(prev):{}),rut:rutClean(f.rut),razon:f.razon.trim(),giro:f.giro||'',direccion:f.direccion||'',comuna:f.comuna||'',regimen:f.regimen,tasaPPM:String(f.tasaPPM||'0').replace(',','.'),inicio:f.inicio||'',repLegal:(f.repLegal||'').trim(),repRut:rutClean(f.repRut||'')};delete data.id;
  if(!prev){data.plan=clone(PLAN_BASE);data.claves={...CLAVES_BASE};data.creada=hoy()}
  S.f.emp=null;await put(`empresas/${id}`,data);if(!prev){selectEmp(id);toast('Empresa creada');}else toast('Empresa actualizada')},
 'emp-open':t=>{selectEmp(t.dataset.id);location.hash='resumen'},
 /* Carga la empresa de ejemplo sin pasar por el diálogo de archivos. */
 'emp-demo':async()=>{try{const r=await fetch('datos-de-prueba/respaldo_prueba_comercial_los_aromos.json');
   if(!r.ok)throw new Error('HTTP '+r.status);await restaurar(await r.text())}
  catch(e){toast('No se pudo cargar el ejemplo. Usa Restaurar respaldo con el archivo de la carpeta datos-de-prueba.','err')}},
 'ed-new':()=>{S.ed=blankEd()},
 'ed-edit':t=>{const a=asientos().find(x=>x.id===t.dataset.id);if(!a)return;S.ed={...clone(a),_oldYm:a.fecha.slice(0,7),lineas:a.lineas.map(l=>({cuenta:l.cuenta,debe:l.debe?String(l.debe):'',haber:l.haber?String(l.haber):'',glosa:l.glosa||'',rut:l.rut?rutFmt(l.rut):'',ref:l.ref||''}))};window.scrollTo(0,0)},
 'ed-addl':()=>{S.ed.lineas.push({cuenta:'',debe:'',haber:'',glosa:''})},
 'ed-dell':t=>{S.ed.lineas.splice(+t.dataset.i,1)},
 'ed-cancel':()=>{S.ed=null},
 'ed-save':async()=>{const ed=S.ed;if(!ed.fecha){toast('Falta la fecha.','err');return}if(!ed.glosa.trim()){toast('Escribe una glosa para el asiento.','err');return}
  const L=[];for(const [i,l] of ed.lineas.entries()){const d=Math.round(pn(l.debe)),h=Math.round(pn(l.haber));if(!l.cuenta&&!d&&!h)continue;if(!l.cuenta||!cm()[l.cuenta]){toast(`La línea ${i+1} no tiene una cuenta válida del plan.`,'err');return}if(d&&h){toast(`La línea ${i+1} tiene monto en debe y haber a la vez.`,'err');return}if(!d&&!h){toast(`La línea ${i+1} no tiene monto.`,'err');return}if(d<0||h<0){toast('Los montos deben ser positivos.','err');return}
   const ax=esAux(l.cuenta);if(ax&&l.rut&&!rutOk(l.rut)){toast(`La línea ${i+1} tiene un RUT inválido.`,'err');return}
   L.push({cuenta:l.cuenta,debe:d,haber:h,...(l.glosa?{glosa:l.glosa}:{}),...(ax&&l.rut?{rut:rutClean(l.rut)}:{}),...(ax&&l.ref?{ref:String(l.ref).trim()}:{})})}
  if(L.length<2){toast('Un asiento necesita al menos dos líneas.','err');return}if(sum(L,l=>l.debe)!==sum(L,l=>l.haber)){toast('El asiento no cuadra.','err');return}
  const keepNum=ed.numero&&ed._oldYm&&ed._oldYm.slice(0,4)===ed.fecha.slice(0,4);
  const a={id:ed.id||uid(),numero:keepNum?ed.numero:nextNum(ed.fecha.slice(0,4)),fecha:ed.fecha,tipo:ed.tipo,glosa:ed.glosa.trim(),lineas:L,...(ed.origen?{origen:ed.origen}:{})};
  const old=ed._oldYm;S.ed=null;await guardarAsiento(a,old);toast(`Asiento N°${a.numero} guardado`)},
 'doc-new':t=>{S.f[t.dataset.k]=docFormBlank(t.dataset.k)},
 'hon-new':()=>{const [d,h]=rango();const f=hoy();S.f.hon={id:null,fecha:enRango(f,[d,h])?f:d,numero:'',rut:'',nombre:'',bruto:'',retenida:'1',cuenta:claves().honGasto}},
 'hon-edit':t=>{const h=honDe().find(x=>x.id===t.dataset.id);if(!h)return;S.f.hon={...clone(h),rut:rutFmt(h.rut),bruto:String(h.bruto),retenida:h.retenida===false?'0':'1',_oldYm:h._ym};window.scrollTo(0,0)},
 'hon-cancel':()=>{S.f.hon=null},
 'hon-save':async()=>{const f=S.f.hon;const bruto=Math.round(pn(f.bruto));if(!f.fecha||!String(f.numero).trim()){toast('Faltan la fecha o el número de boleta.','err');return}if(!rutOk(f.rut)){toast('El RUT del emisor no es válido.','err');return}if(bruto<=0){toast('El monto bruto debe ser mayor que cero.','err');return}
  const ret=Math.round(bruto*tasaHon(+f.fecha.slice(0,4))/100);const h={id:f.id||uid(),fecha:f.fecha,numero:String(f.numero).trim(),rut:rutClean(f.rut),nombre:(f.nombre||'').trim(),bruto,ret,retenida:f.retenida!=='0',cuenta:f.cuenta,...(f.asientoId?{asientoId:f.asientoId}:{})};
  const old=f._oldYm;S.f.hon=null;await guardarHon(h,old);toast('Boleta guardada y centralizada')},
 'af-new':()=>{const [d,h]=rango();const f=hoy();const c=plan().find(x=>x.grupo==='ANC'&&!/depreci/i.test(x.nombre));S.f.af={id:null,nombre:'',cuenta:c?c.codigo:'',fecha:enRango(f,[d,h])?f:d,valor:'',vida:'',residual:'1',trib:'normal',baja:''}},
 'af-desde':t=>{const d=docsDe('compras').find(x=>x.id===t.dataset.id);if(!d)return;S.f.af={id:null,nombre:`${d.razon||'Bien'} · ${CORTO[d.tipo]||d.tipo} ${d.folio}`,cuenta:d.cuenta,fecha:d.fecha,valor:String((+d.neto||0)+(+d.exento||0)),vida:'',residual:'1',trib:(emp().regimen||'').startsWith('14 D')?'instantanea':'normal',baja:'',docId:d.id};window.scrollTo(0,0)},
 'af-edit':t=>{const b=bienes().find(x=>x.id===t.dataset.id);if(!b)return;S.f.af={...clone(b),valor:String(b.valor),vida:String(b.vida),residual:String(b.residual??1)};window.scrollTo(0,0)},
 'af-cancel':()=>{S.f.af=null},
 'af-save':async()=>{const f=S.f.af;const valor=Math.round(pn(f.valor)),vida=+String(f.vida).replace(',','.');if(!String(f.nombre||'').trim()||!f.fecha||valor<=0||!(vida>0)){toast('Completa descripción, fecha, valor y vida útil.','err');return}
  const b={id:f.id||uid(),nombre:f.nombre.trim(),cuenta:f.cuenta,fecha:f.fecha,valor,vida,residual:Math.round(pn(f.residual)),trib:f.trib||'normal',...(f.baja?{baja:f.baja}:{}),...(f.docId?{docId:f.docId}:{})};
  const list=clone(bienes()).filter(x=>x.id!==b.id);list.push(b);S.f.af=null;await guardarBienes(list);toast('Bien guardado')},
 'dep-gen':async()=>{const k=claves();const hasta=S.mes||12;let n=0;
  for(let m=1;m<=hasta;m++){const ym=`${S.anio}-${pad(m)}`;if(bloq(ym))continue;const v=sum(bienes(),b=>depMes(b,ym));const ex=asientos().find(a=>a.origen&&a.origen.kind==='dep'&&a.origen.ym===ym);
   if(!v){if(ex){await borrarAsiento(ex.id)}continue}if(ex&&Math.round(sum(ex.lineas,l=>l.debe))===v)continue;
   const last=`${ym}-${pad(new Date(S.anio,m,0).getDate())}`;const a={id:ex?ex.id:uid(),numero:ex?ex.numero:nextNum(String(S.anio)),fecha:last,tipo:'Ajuste',glosa:`Depreciación ${MESES[m-1].toLowerCase()} ${S.anio}`,lineas:[{cuenta:k.depGasto,debe:v,haber:0},{cuenta:k.depAcum,debe:0,haber:v}],origen:{kind:'dep',ym}};
   await guardarAsiento(a,ex?ymDeAsiento(ex.id):null);n++}
  toast(n?`${n} asiento(s) de depreciación generados o actualizados`:'La depreciación ya estaba al día')},
 'trab-new':()=>{const P=prevP();S.f.trab={id:null,rut:'',nombre:'',cargo:'',ingreso:hoy(),termino:'',contrato:'indefinido',jornada:String(P.jornada),sueldo:'',grat:'art50',afp:'Habitat',salud:'fonasa',isapre:'',planUF:'',colacion:'',movilizacion:'',cargas:'0',tramo:''}},
 'trab-edit':t=>{const x=trabajadores().find(y=>y.id===t.dataset.id);if(!x)return;S.f.trab=Object.fromEntries(Object.entries(clone(x)).map(([k,v])=>[k,k==='rut'?rutFmt(v):(v==null?'':String(v))]));window.scrollTo(0,0)},
 'trab-cancel':()=>{S.f.trab=null},
 'trab-save':async()=>{const f=S.f.trab;if(!rutOk(f.rut)){toast('El RUT del trabajador no es válido.','err');return}if(!String(f.nombre).trim()){toast('Falta el nombre.','err');return}const sue=Math.round(pn(f.sueldo));if(sue<=0){toast('Ingresa el sueldo base.','err');return}
  if(trabajadores().some(t=>t.id!==f.id&&rutClean(t.rut)===rutClean(f.rut))){toast('Ya existe un trabajador con ese RUT.','err');return}
  const t={id:f.id||uid(),rut:rutClean(f.rut),nombre:f.nombre.trim(),cargo:(f.cargo||'').trim(),ingreso:f.ingreso||'',termino:f.termino||'',contrato:f.contrato,jornada:+String(f.jornada).replace(',','.')||prevP().jornada,sueldo:sue,grat:f.grat,afp:f.afp,salud:f.salud,isapre:f.salud==='isapre'?(f.isapre||''):'',planUF:f.salud==='isapre'?+String(f.planUF).replace(',','.')||0:0,colacion:Math.round(pn(f.colacion)),movilizacion:Math.round(pn(f.movilizacion)),cargas:Math.round(pn(f.cargas)),tramo:f.tramo||''};
  if(t.sueldo<prevP().imm*(Math.min(t.jornada,prevP().jornada)/prevP().jornada)-1)toast('Ojo: el sueldo base es menor al ingreso mínimo para esa jornada.','err');
  const list=clone(trabajadores()).filter(x=>x.id!==t.id);list.push(t);S.f.trab=null;await guardarTrab(list);toast('Trabajador guardado')},
 'remu-calc':async()=>{const ym=ymSel();chkBloq(ym);if(!ufMes(ym)||!utm(ym)){S.showImp.param=true;toast('Ingresa la UF y la UTM del mes en Parámetros previsionales.','err');return}
  const doc=clone(S.remu[ym]||{});const prev=Object.fromEntries((doc.liqs||[]).map(l=>[l.tid,l]));const liqs=[];
  for(const t of trabActivos(ym))liqs.push(liqFromTrab(t,ym,prev[t.id]));doc.liqs=liqs;await putE(`remu/${ym}`,doc);await audit('crear','Remuneraciones',`Cálculo de ${liqs.length} liquidaciones de ${perTxt()}`,null,`Líquido total ${fmt(sum(liqs,l=>l.c.liq))}`);toast(`${liqs.length} liquidaciones calculadas`)},
 'liq-ver':t=>{S.liqVer=S.liqVer===t.dataset.id?null:t.dataset.id},
 'liq-cerrar':()=>{S.liqVer=null},
 'liq-edit':t=>{const l=((S.remu[ymSel()]||{}).liqs||[]).find(x=>x.tid===t.dataset.id);if(!l)return;S.f.liq={tid:l.tid,nombre:l.nombre,dias:String(l.dias??30),hx:String(l.hx||0),bonos:String(l.bonos||0),otrosNoImp:String(l.otrosNoImp||0),anticipos:String(l.anticipos||0),otrosDesc:String(l.otrosDesc||0)};window.scrollTo(0,0)},
 'liq-cancel':()=>{S.f.liq=null},
 'liq-save':async()=>{const ym=ymSel();chkBloq(ym);const f=S.f.liq;const t=trabajadores().find(x=>x.id===f.tid);if(!t){toast('La ficha del trabajador ya no existe.','err');return}if(!ufMes(ym)||!utm(ym)){toast('Ingresa la UF y la UTM del mes.','err');return}
  const doc=clone(S.remu[ym]||{liqs:[]});const l={dias:+String(f.dias).replace(',','.')||0,hx:+String(f.hx).replace(',','.')||0,bonos:Math.round(pn(f.bonos)),otrosNoImp:Math.round(pn(f.otrosNoImp)),anticipos:Math.round(pn(f.anticipos)),otrosDesc:Math.round(pn(f.otrosDesc))};
  const nl=liqFromTrab(t,ym,l);const ol=(doc.liqs||[]).find(x=>x.tid===f.tid);doc.liqs=(doc.liqs||[]).map(x=>x.tid===f.tid?nl:x);S.f.liq=null;await putE(`remu/${ym}`,doc);const rl=x=>x?`${x.c.dias} días · HE ${x.hx||0} · bonos ${fmt(x.bonos||0)} · anticipos ${fmt(x.anticipos||0)} · líquido ${fmt(x.c.liq)}`:'';await audit('modificar','Liquidación',`${nl.nombre} · ${perTxt()}`,rl(ol),rl(nl));toast('Liquidación recalculada')},
 'remu-cent':async()=>{const ym=ymSel();const liqs=(S.remu[ym]||{}).liqs||[];if(!liqs.length)return;const ex=asientos().find(a=>a.origen&&a.origen.kind==='remu'&&a.origen.ym===ym);const a=asientoRemu(ym,liqs,ex);
  if(sum(a.lineas,l=>l.debe)!==sum(a.lineas,l=>l.haber)){toast('La centralización no cuadra; revisa las liquidaciones.','err');return}await guardarAsiento(a,ex?ymDeAsiento(ex.id):null);toast(`Centralización N°${a.numero} ${ex?'actualizada':'creada'}`)},
 'regla-add':async t=>{const k=t.dataset.k;const f=S.f.regla||{};if(!rutOk(f.rut)){toast('El RUT no es válido.','err');return}if(!cm()[f.cuenta]){toast('Elige una cuenta.','err');return}await guardarRegla(k,f.rut,f.cuenta);S.f.regla={rut:'',cuenta:f.cuenta};toast('Regla guardada')},
 'reglas-aplicar':async t=>{const k=t.dataset.k;const R=rango();const list=docsDe(k).filter(d=>enRango(d.fecha,R)&&!bloq(d.fecha)&&!d.ivaAF&&!d.netoAF).filter(d=>{const r=reglaDe(k,d.rut);return r&&r!==d.cuenta}).map(d=>({...clone(d),cuenta:reglaDe(k,d.rut),_oldYm:d._ym}));if(!list.length)return;await guardarDocs(k,list);toast(`${list.length} documento(s) reclasificados con sus asientos`)},
 'uc-ajuste':async()=>{const ym=ymSel();const x=ivaMes(ym);const v=x.uc-x.ucRec;if(!v)return;const k=claves();const ex=asientos().find(a=>a.origen&&a.origen.kind==='ajusteUC'&&a.origen.ym===ym);
  const a={id:ex?ex.id:uid(),numero:ex?ex.numero:nextNum(String(S.anio)),fecha:rango()[1],tipo:'Ajuste',glosa:`Ajuste IVA uso común no recuperable ${perTxt()}`,lineas:[{cuenta:k.compras,debe:v,haber:0},{cuenta:k.ivaCF,debe:0,haber:v}],origen:{kind:'ajusteUC',ym}};
  await guardarAsiento(a,ex?ymDeAsiento(ex.id):null);toast(`Asiento de ajuste N°${a.numero} ${ex?'actualizado':'creado'}`)},
 'bol-res':()=>{if(!S.mes){toast('Elige un mes para registrar el resumen de boletas.','err');return}const ym=ymSel();const n=docsDe('ventas').filter(d=>d.folio.startsWith('RES-'+ym)).length;
  S.f.ventas={...docFormBlank('ventas'),tipo:'39',folio:`RES-${ym}${n?'-'+(n+1):''}`,fecha:rango()[1],razon:'Resumen de boletas del mes',cant:''};toast('Ingresa el total con IVA y la cantidad de boletas del mes (o del día).')},
 'doc-edit':t=>{const k=t.dataset.k;const d=docsDe(k).find(x=>x.id===t.dataset.id);if(!d)return;const s=v=>v?String(v):'';S.f[k]={...clone(d),tipo:String(d.tipo),exento:s(d.exento),neto:s(d.neto),iva:s(d.iva),ivaNoRec:s(d.ivaNoRec),total:s(d.total),_oldYm:d._ym};window.scrollTo(0,0)},
 'doc-cancel':t=>{S.f[t.dataset.k]=null},
 'doc-save':async t=>{const k=t.dataset.k;const f=S.f[k];if(!f.fecha||!String(f.folio).trim()){toast('Faltan la fecha o el folio.','err');return}
  if(f.rut&&!rutOk(f.rut)){toast('El RUT no es válido.','err');return}if(![39,41].includes(+f.tipo)&&!f.rut){toast('Falta el RUT.','err');return}
  const total=Math.round(pn(f.total));if(total<=0){toast('El total debe ser mayor que cero.','err');return}
  const dup=docsDe(k).find(d=>d.id!==f.id&&String(d.tipo)===String(f.tipo)&&String(d.folio)===String(f.folio).trim()&&rutClean(d.rut)===rutClean(f.rut));if(dup){toast('Ese documento ya está registrado.','err');return}
  const d={id:f.id||uid(),tipo:+f.tipo,folio:String(f.folio).trim(),fecha:f.fecha,rut:rutClean(f.rut),razon:(f.razon||'').trim(),exento:Math.round(pn(f.exento)),neto:Math.round(pn(f.neto)),iva:Math.round(pn(f.iva)),total,cuenta:f.cuenta,...(k==='compras'?{ivaNoRec:Math.round(pn(f.ivaNoRec)),ivaUC:Math.round(pn(f.ivaUC)),...(f.ivaAF?{ivaAF:+f.ivaAF,netoAF:+f.netoAF||0}:{})}:{}),...(k==='ventas'&&[39,41].includes(+f.tipo)&&pn(f.cant)?{cant:Math.round(pn(f.cant))}:{}),...(f.asientoId?{asientoId:f.asientoId}:{}),...(f.creado?{creado:f.creado,creadoPor:f.creadoPor}:{}),_oldYm:f._oldYm};
  S.f[k]=null;await guardarDocs(k,[d]);if(S.mes&&!enRango(d.fecha,rango()))toast(`Ojo: el documento quedó registrado en ${MESES[+d.fecha.slice(5,7)-1].toLowerCase()} ${d.fecha.slice(0,4)}, según su fecha.`,'err');const def=k==='compras'?claves().compras:claves().ventas;
  if(d.rut&&d.cuenta!==def&&!d.ivaAF&&!d.netoAF&&reglaDe(k,d.rut)!==d.cuenta){await guardarRegla(k,d.rut,d.cuenta);toast(`Documento guardado. Los próximos de ${d.razon||rutFmt(d.rut)} irán a ${ctaTxt(d.cuenta)}.`)}else toast('Documento guardado y centralizado')},
 'imp-toggle':t=>{S.showImp[t.dataset.k]=!S.showImp[t.dataset.k]},
 'imp-run':async t=>{const k=t.dataset.k;const rows=parseCSV(S.imp[k]);if(rows.length<2){toast('No encontré filas. Pega el CSV con su fila de encabezados.','err');return}
  const H=rows[0].map(norm);const ix=p=>H.findIndex(p);
  const c={tipo:ix(h=>h.startsWith('tipo doc')),rut:ix(h=>h.startsWith('rut')),razon:ix(h=>h.startsWith('razon')),folio:ix(h=>h==='folio'),fecha:ix(h=>h.startsWith('fecha docto')||h==='fecha'),exento:ix(h=>h==='monto exento'),neto:ix(h=>h==='monto neto'),
   iva:k==='compras'?ix(h=>h==='monto iva recuperable'):(ix(h=>h==='monto iva')>=0?ix(h=>h==='monto iva'):ix(h=>h==='monto iva recuperable')),nr:ix(h=>h==='monto iva no recuperable'),total:ix(h=>h==='monto total'),netoAF:ix(h=>h==='monto neto activo fijo'),ivaAF:ix(h=>h==='iva activo fijo'),ivaUC:ix(h=>h==='iva uso comun')};
  if(c.tipo<0||c.folio<0||c.fecha<0||c.total<0){toast('El archivo no tiene las columnas del RCV (Tipo Doc, Folio, Fecha Docto, Monto Total).','err');return}
  const exist=new Set(docsDe(k).map(d=>`${d.tipo}|${d.folio}|${rutClean(d.rut)}`));const cuenta=k==='compras'?claves().compras:claves().ventas;const list=[];let skip=0,bad=0,nAF=0;
  for(const r of rows.slice(1)){const fecha=parseFecha(r[c.fecha]);const tipo=parseInt(r[c.tipo],10);if(!fecha||!tipo){bad++;continue}
   const d={id:uid(),tipo,folio:String(r[c.folio]||'').trim(),fecha,rut:rutClean(c.rut>=0?r[c.rut]:''),razon:c.razon>=0?r[c.razon]:'',exento:Math.round(Math.abs(pn(c.exento>=0?r[c.exento]:0))),neto:Math.round(Math.abs(pn(c.neto>=0?r[c.neto]:0))),iva:Math.round(Math.abs(pn(c.iva>=0?r[c.iva]:0))),total:Math.round(Math.abs(pn(r[c.total]))),cuenta:reglaDe(k,c.rut>=0?r[c.rut]:'')||cuenta};
   if(k==='compras'){const g=i=>i>=0?Math.round(Math.abs(pn(r[i]))):0;d.ivaNoRec=g(c.nr);const uc=g(c.ivaUC),af=g(c.ivaAF),naf=g(c.netoAF);if(uc)d.ivaUC=uc;
    if(af||naf){const base=d.exento+d.ivaNoRec+uc;let best=null;for(const n of [d.neto,d.neto+naf])for(const iv of [d.iva,d.iva+af]){if(Math.abs(base+n+iv-d.total)<=2&&!best)best=[n,iv]}if(best){d.neto=best[0];d.iva=best[1]}d.ivaAF=af;d.netoAF=naf;nAF++;const anc=plan().find(x=>x.grupo==='ANC'&&!/depreci/i.test(x.nombre));if(anc)d.cuenta=anc.codigo}}
   if([39,41].includes(tipo)&&!d.neto&&!d.iva&&d.total){if(tipo===39){d.neto=Math.round(d.total/1.19);d.iva=d.total-d.neto}else d.exento=d.total}
   const key=`${d.tipo}|${d.folio}|${d.rut}`;if(exist.has(key)){skip++;continue}exist.add(key);list.push(d)}
  if(!list.length){toast(skip?`Los ${skip} documentos ya estaban registrados.`:'No hay documentos válidos para importar.','err');return}
  S.busy=true;try{await guardarDocs(k,list);S.imp[k]='';S.showImp[k]=false;toast(`${list.length} documentos importados${skip?`, ${skip} omitidos por repetidos`:''}${bad?`, ${bad} filas sin fecha o tipo`:''}${nAF?`. ${nAF} de activo fijo quedaron en cuenta de activo: revísalas`:''}`)}finally{S.busy=false}},
 'plan-add':async()=>{const f=S.f.cta||{};const cod=String(f.codigo||'').trim();if(!/^\d{3,10}$/.test(cod)){toast('El código debe tener solo dígitos (3 a 10).','err');return}if(cm()[cod]){toast('Ese código ya existe.','err');return}if(!String(f.nombre||'').trim()){toast('Falta el nombre de la cuenta.','err');return}
  const p=clone(plan());p.push({codigo:cod,nombre:f.nombre.trim(),grupo:f.grupo||'GAS',banco:!!f.banco});S.f.cta={codigo:'',nombre:'',grupo:f.grupo||'GAS'};await saveEmp({plan:p});toast('Cuenta agregada')},
 'mov-add':async()=>{const f=S.f.mov||{};const ym=ymSel();const fecha=f.fecha||rango()[0];if(!fecha.startsWith(ym)){toast('La fecha debe estar dentro del mes seleccionado.','err');return}const monto=Math.round(pn(f.monto));if(!monto){toast('Ingresa un monto distinto de cero.','err');return}
  const cta=bancoCta();S.f.mov={fecha,desc:'',monto:''};await putMovs(ym,o=>o.movs.push({id:uid(),fecha,desc:(f.desc||'').trim()||'Movimiento',monto,cuenta:cta,match:null,...sello()}))},
 'cart-imp':async()=>{const rows=parseCSV(S.imp.cartola);if(!rows.length){toast('Pega o carga la cartola primero.','err');return}
  let H=rows[0].map(norm);let body=rows.slice(1);let c;
  if(parseFecha(rows[0][0])){body=rows;c={fecha:0,desc:1,monto:2,cargo:-1,abono:-1}}
  else c={fecha:H.findIndex(h=>h.startsWith('fecha')),desc:H.findIndex(h=>/descrip|glosa|detalle|concepto/.test(h)),cargo:H.findIndex(h=>/cargo|giro|debito/.test(h)),abono:H.findIndex(h=>/abono|deposito|credito/.test(h)),monto:H.findIndex(h=>h==='monto'||h==='importe')};
  if(c.fecha<0||(c.monto<0&&(c.cargo<0||c.abono<0))){toast('No reconozco las columnas. Usa Fecha; Descripción; Cargo; Abono.','err');return}
  const cta=bancoCta();const by={};let n=0;
  for(const r of body){const fecha=parseFecha(r[c.fecha]);if(!fecha)continue;let monto=c.monto>=0?pn(r[c.monto]):Math.abs(pn(r[c.abono]))-Math.abs(pn(r[c.cargo]));monto=Math.round(monto);if(!monto)continue;(by[fecha.slice(0,7)]||(by[fecha.slice(0,7)]=[])).push({id:uid(),fecha,desc:c.desc>=0?r[c.desc]:'',monto,cuenta:cta,match:null,...sello()});n++}
  if(!n){toast('No encontré movimientos con fecha y monto.','err');return}
  for(const [y,list] of Object.entries(by))await putMovs(y,o=>o.movs.push(...list));S.imp.cartola='';S.showImp.cartola=false;toast(`${n} movimientos importados`)},
 'mov-sel':t=>{S.sel.mov=S.sel.mov===t.dataset.id?null:t.dataset.id},
 'lin-sel':t=>{S.sel.lin=S.sel.lin===t.dataset.id?null:t.dataset.id},
 'conc':async()=>{const m=movsTodos().find(x=>x.id===S.sel.mov);if(!m||!S.sel.lin)return;const k=S.sel.lin;S.sel={mov:null,lin:null};await putMovs(m._ym,o=>{const x=o.movs.find(y=>y.id===m.id);if(x)x.match=k});toast('Partida conciliada')},
 'conc-auto':async()=>{const cta=bancoCta();const ym=ymSel();const [,h]=rango();const all=movsTodos().filter(m=>m.cuenta===cta);const used=new Set(all.filter(m=>m.match).map(m=>m.match));
  const lin=lineasBanco(cta,h).filter(l=>!used.has(l.k));const pend=all.filter(m=>m._ym===ym&&!m.match);const res={};const dd=(a,b)=>Math.abs((new Date(a)-new Date(b))/864e5);
  for(const m of pend){let best=null;for(const l of lin){if(used.has(l.k)||Math.round(l.monto)!==Math.round(m.monto))continue;const d=dd(l.fecha,m.fecha);if(d<=5&&(!best||d<best.d))best={l,d}}if(best){used.add(best.l.k);res[m.id]=best.l.k}}
  const n=Object.keys(res).length;if(!n){toast('No encontré coincidencias de monto y fecha.');return}await putMovs(ym,o=>o.movs.forEach(x=>{if(res[x.id])x.match=res[x.id]}));toast(`${n} partidas conciliadas`)},
 'desconc':async t=>{const m=movsTodos().find(x=>x.id===t.dataset.id);if(!m)return;await putMovs(m._ym,o=>{const x=o.movs.find(y=>y.id===m.id);if(x)x.match=null})},
 'mov-cont':async()=>{const m=movsTodos().find(x=>x.id===S.sel.mov);if(!m)return;const contra=(S.f.cont||{}).cuenta||plan().find(c=>c.codigo!==m.cuenta).codigo;const v=Math.abs(m.monto);
  const L=m.monto>0?[{cuenta:m.cuenta,debe:v,haber:0},{cuenta:contra,debe:0,haber:v}]:[{cuenta:contra,debe:v,haber:0},{cuenta:m.cuenta,debe:0,haber:v}];
  const a={id:uid(),numero:nextNum(m.fecha.slice(0,4)),fecha:m.fecha,tipo:m.monto>0?'Ingreso':'Egreso',glosa:m.desc||'Movimiento bancario',lineas:L,origen:{kind:'banco',movId:m.id}};
  const idx=L.findIndex(l=>l.cuenta===m.cuenta);S.sel={mov:null,lin:null};await guardarAsiento(a,null);await putMovs(m._ym,o=>{const x=o.movs.find(y=>y.id===m.id);if(x)x.match=a.id+':'+idx});toast(`Asiento N°${a.numero} creado y conciliado`)},
 'emp-backup':t=>respaldo(t.dataset.id),
 'cartera-reload':()=>{S.cartera=null},
 'cc-rut':t=>{S.ccRut=S.ccRut===t.dataset.id?null:t.dataset.id;S.f.pago=null},
 'cc-cerrar':()=>{S.ccRut=null;S.f.pago=null},
 'pago-abrir':t=>{const g=ctacte(S.ccCta,rango()[1]).find(x=>x.rut===S.ccRut);const c=g&&g.pend.find(x=>x.k===t.dataset.id);if(!c)return;const [d,h]=rango();const f=hoy();
  const b=plan().find(x=>x.banco)||plan().find(x=>x.codigo.startsWith('1101'));S.f.pago={k:c.k,fecha:enRango(f,[d,h])?f:h,monto:String(c.pend),banco:b?b.codigo:''}},
 'pago-cancel':()=>{S.f.pago=null},
 'pago-save':async()=>{const f=S.f.pago;const cta=S.ccCta;const deud=esDeudora(cta);const g=ctacte(cta,'9999-12-31').find(x=>x.rut===S.ccRut);const c=g&&g.cargos.find(x=>x.k===f.k);if(!c)return;
  const m=Math.round(pn(f.monto));if(m<=0){toast('El monto debe ser mayor que cero.','err');return}if(!f.fecha){toast('Falta la fecha.','err');return}if(!cm()[f.banco]){toast('Elige la cuenta de caja o banco.','err');return}
  const aux={cuenta:cta,rut:g.rut,ref:c.ref};const L=deud?[{cuenta:f.banco,debe:m,haber:0},{...aux,debe:0,haber:m}]:[{...aux,debe:m,haber:0},{cuenta:f.banco,debe:0,haber:m}];
  const a={id:uid(),numero:nextNum(f.fecha.slice(0,4)),fecha:f.fecha,tipo:deud?'Ingreso':'Egreso',glosa:`${deud?'Cobro':'Pago'} doc ${c.ref} ${nombresRut()[g.rut]||rutFmt(g.rut)}`.trim(),lineas:L,origen:{kind:'pago'}};
  await guardarAsiento(a,null);S.f.pago=null;toast(`Asiento N°${a.numero} creado`)},
 'aj-add':async()=>{const f=S.f.aj||{tipo:'agregado'};const m=Math.round(pn(f.monto));if(!String(f.desc||'').trim()||!m){toast('Escribe el concepto y el monto del ajuste.','err');return}
  const y=String(S.anio);const o=clone(S.renta[y]||{});o.ajustes=o.ajustes||[];o.ajustes.push({id:uid(),tipo:f.tipo||'agregado',desc:f.desc.trim(),monto:Math.abs(m)});S.f.aj={tipo:f.tipo||'agregado',desc:'',monto:''};await putE(`renta/${y}`,o)},
 'cierre-gen':async()=>{const anio=S.anio;const {L}=cierreLineas(anio);if(!L.length)return;const ex=asientoOrigen('cierre',anio);
  const a={id:ex?ex.id:uid(),numero:ex?ex.numero:nextNum(String(anio)),fecha:`${anio}-12-31`,tipo:'Cierre',glosa:`Cierre del ejercicio ${anio}`,lineas:L,origen:{kind:'cierre',anio}};
  await guardarAsiento(a,ex?ex.fecha.slice(0,7):null);toast(`Asiento de cierre N°${a.numero} ${ex?'actualizado':'creado'}`)},
 'ap-gen':async()=>{const anio=S.anio;const k=claves();const ex=asientoOrigen('cierre',anio);if(!ex)return;const l=ex.lineas.find(x=>x.cuenta===k.resultado);const r=l?(l.haber||0)-(l.debe||0):0;if(!r)return;
  const ap=asientoOrigen('apertura',anio+1);const v=Math.abs(r);const L=r>0?[{cuenta:k.resultado,debe:v,haber:0},{cuenta:k.utilidades,debe:0,haber:v}]:[{cuenta:k.utilidades,debe:v,haber:0},{cuenta:k.resultado,debe:0,haber:v}];
  const a={id:ap?ap.id:uid(),numero:ap?ap.numero:nextNum(String(anio+1)),fecha:`${anio+1}-01-01`,tipo:'Apertura',glosa:`Traspaso resultado ejercicio ${anio}`,lineas:L,origen:{kind:'apertura',anio:anio+1}};
  await guardarAsiento(a,ap?ap.fecha.slice(0,7):null);toast(`Traspaso N°${a.numero} creado en ${anio+1}`)},
 'si-imp':async()=>{const rows=parseCSV(S.imp.saldos);const fecha=(S.f.si||{}).fecha||`${S.anio}-01-01`;const L=[];
  for(const [i,r] of rows.entries()){const cod=String(r[0]||'').trim();if(!/^\d+$/.test(cod)){if(i===0)continue;toast(`Fila ${i+1}: el código "${cod}" no es válido.`,'err');return}
   if(!cm()[cod]){toast(`Fila ${i+1}: la cuenta ${cod} no está en el plan.`,'err');return}let d=Math.round(pn(r[1])),h=Math.round(pn(r[2]));if(r.length===2&&d<0){h=-d;d=0}if(!d&&!h)continue;
   const rut=rutClean(r[3]);if(rut&&!rutOk(rut)){toast(`Fila ${i+1}: el RUT no es válido.`,'err');return}L.push({cuenta:cod,debe:Math.abs(d),haber:Math.abs(h),...(rut&&esAux(cod)?{rut,ref:'SI'}:{})})}
  if(L.length<2){toast('Ingresa al menos dos cuentas con saldo.','err');return}const D=sum(L,l=>l.debe),H=sum(L,l=>l.haber);if(D!==H){toast(`Los saldos no cuadran: debe ${fmt(D)}, haber ${fmt(H)}.`,'err');return}
  const a={id:uid(),numero:nextNum(fecha.slice(0,4)),fecha,tipo:'Apertura',glosa:'Saldos iniciales',lineas:L,origen:{kind:'saldos'}};await guardarAsiento(a,null);S.imp.saldos='';toast(`Asiento de apertura N°${a.numero} creado`)},
 'pl-usar':()=>{const id=(S.f.pl||{}).id;const p=((emp()||{}).plantillas||[]).find(x=>x.id===id);if(!p){toast('Elige una plantilla.','err');return}
  S.ed.tipo=p.tipo;S.ed.glosa=p.glosa;S.ed.lineas=p.lineas.map(l=>({cuenta:l.cuenta,debe:l.debe?String(l.debe):'',haber:l.haber?String(l.haber):'',glosa:l.glosa||'',rut:l.rut||'',ref:''}))},
 'pl-guardar':async()=>{const ed=S.ed;const L=ed.lineas.filter(l=>l.cuenta).map(l=>({cuenta:l.cuenta,debe:Math.round(pn(l.debe)),haber:Math.round(pn(l.haber)),...(l.glosa?{glosa:l.glosa}:{}),...(l.rut?{rut:rutClean(l.rut)}:{})}));
  if(!ed.glosa.trim()||L.length<2){toast('Escribe una glosa y al menos dos cuentas para guardar la plantilla.','err');return}
  const pl=clone((emp()||{}).plantillas||[]);pl.push({id:uid(),nombre:ed.glosa.trim(),tipo:ed.tipo,glosa:ed.glosa.trim(),lineas:L});await saveEmp({plantillas:pl});toast('Plantilla guardada')},
 'salir':()=>salir(),
 'inv-add':async()=>{const f=S.f.inv||{};if(!/^\S+@\S+\.\S+$/.test(f.email||'')){toast('Escribe un correo válido.','err');return}await invitarMiembro(S.empId,f.email.trim(),f.rol||'editor');S.f.inv={email:'',rol:f.rol||'editor'}},
 'csv':t=>exportar(t.dataset.what),
 'pdf':t=>exportPDF(t.dataset.what,t.dataset.id)
};
const CONFIRM={
 delEmp:async id=>{if(!soloDueno())return;const was=S.empId===id;if(S.local){const st=lsLoad();Object.keys(st).filter(p=>p.startsWith(`empresas/${id}/`)).forEach(p=>delete st[p]);lsPut('_',null)}if(S.db){for(const k of ['diario','rcv','banco']){try{const s=await S.db.collection(`empresas/${id}/${k}`).get();for(const d of s.docs)await enqueue(`empresas/${id}/${k}/${d.id}`,()=>S.db.doc(`empresas/${id}/${k}/${d.id}`).delete())}catch(e){toast(errMsg(e),'err');return}}}
  await del(`empresas/${id}`);if(was)selectEmp(null);toast('Empresa eliminada')},
 delAs:async id=>{await borrarAsiento(id);toast('Asiento eliminado')},
 delDoc:async x=>{const [k,id]=x.split(':');await borrarDoc(k,id);toast('Documento y su asiento eliminados')},
 delCta:async cod=>{await saveEmp({plan:clone(plan()).filter(c=>c.codigo!==cod)});toast('Cuenta eliminada')},
 delAj:async id=>{const y=String(S.anio);const o=clone(S.renta[y]||{});o.ajustes=(o.ajustes||[]).filter(a=>a.id!==id);await putE(`renta/${y}`,o)},
 delPl:async id=>{S.f.pl=null;await saveEmp({plantillas:clone((emp()||{}).plantillas||[]).filter(p=>p.id!==id)});toast('Plantilla eliminada')},
 delHon:async id=>{await borrarHon(id);toast('Boleta y su asiento eliminados')},
 delAf:async id=>{await guardarBienes(clone(bienes()).filter(b=>b.id!==id));toast('Bien eliminado')},
 delTrab:async id=>{await guardarTrab(clone(trabajadores()).filter(t=>t.id!==id));toast('Ficha eliminada; sus liquidaciones anteriores se mantienen')},
 delLiq:async tid=>{const ym=ymSel();chkBloq(ym);const doc=clone(S.remu[ym]||{});const ol=(doc.liqs||[]).find(l=>l.tid===tid);if(ol)await audit('eliminar','Liquidación',`${ol.nombre} · ${perTxt()}`,`líquido ${fmt(ol.c.liq)}`,null);doc.liqs=(doc.liqs||[]).filter(l=>l.tid!==tid);await putE(`remu/${ym}`,doc)},
 delRegla:async x=>{const [k,rut]=x.split(':');await guardarRegla(k,rut,null);toast('Regla quitada')},
 delMiembro:async uid=>{await quitarMiembro(S.empId,uid)},
 delMov:async id=>{const m=movsTodos().find(x=>x.id===id);if(!m)return;if(S.sel.mov===id)S.sel.mov=null;await putMovs(m._ym,o=>{o.movs=o.movs.filter(y=>y.id!==id)})}
};

