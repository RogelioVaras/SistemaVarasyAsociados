/* Partida Doble · Vistas: panel de cartera con alertas y calendario tributario. */
async function cargarTodo(){S.cartera={loading:true,data:{}};render();const data={};
 for(const e of S.emps){if(e.id===S.empId)continue;const d={};
  if(!S.db){for(const k of KINDS)d[k]=S.local?Object.fromEntries(lsDocs(`empresas/${e.id}/${k}/`)):{}}
  else{try{const sn=await Promise.all(KINDS.map(k=>S.db.collection(`empresas/${e.id}/${k}`).get()));KINDS.forEach((k,i)=>{d[k]={};sn[i].docs.forEach(x=>d[k][x.id]=x.data())})}catch(err){d.err=true}}
  data[e.id]=d}
 S.cartera={loading:false,data,at:new Date()};render()}
function withEmp(e,fn){if(e.id===S.empId&&ready())return fn();const d=(S.cartera&&S.cartera.data[e.id]);if(!d||d.err)return null;
 const save={empId:S.empId,...Object.fromEntries(KINDS.map(k=>[k,S[k]]))};S.empId=e.id;KINDS.forEach(k=>S[k]=d[k]||{});inval();
 try{return fn()}finally{S.empId=save.empId;KINDS.forEach(k=>S[k]=save[k]);inval()}}
const venceF29=ym=>{const [y,m]=ym.split('-').map(Number);return `${m===12?y+1:y}-${pad(m===12?1:m+1)}-20`};
function tareaHecha(e,key){if((e.tareas||{})[key])return true;if(key.startsWith('F29-')&&(e.cerradoHasta||'')>=key.slice(4))return true;return false}
function alertasEmp(e,ym){const out=[];const add=(nivel,txt)=>out.push({nivel,txt});const [y,m]=ym.split('-').map(Number);const fin=`${ym}-${pad(new Date(y,m,0).getDate())}`;
 const iv=ivaMes(ym);const r=S.rcv[ym]||{};const nDocs=((r.compras||[]).length)+((r.ventas||[]).length);
 const dl=dias(hoy(),venceF29(ym));if(!tareaHecha(e,'F29-'+ym)){if(dl<0)add('bad',`F29 de ${MESES[m-1].toLowerCase()} venció hace ${-dl} días y no está marcado como declarado`);else if(dl<=7)add('warn',`F29 vence en ${dl} días (${fmt(iv.total)} a pagar)`)}
 if(!nDocs)add('warn','Sin compras ni ventas registradas en el mes');
 let nObs=0;for(const k of ['compras','ventas']){const NM=nombresPorRut(k);nObs+=(r[k]||[]).filter(d=>obsDoc(d,k,NM).length).length}if(nObs)add('warn',`${nObs} documento(s) con observaciones en compras o ventas`);
 const desc=asientos().filter(a=>a.fecha.startsWith(String(y))&&!cuadra(a)).length;if(desc)add('bad',`${desc} asiento(s) descuadrados en ${y}`);
 const cli=ctacte(claves().clientes,fin);const v90=sum(cli,g=>buckets(g.pend,fin)[3]);if(v90>0)add('warn',`${fmt(v90)} por cobrar con más de 90 días`);
 const ban=(S.banco[ym]||{}).movs||[];if(bancos().length&&!ban.length)add('info','Cartola del mes sin cargar');const pend=ban.filter(x=>!x.match).length;if(pend)add('info',`${pend} movimiento(s) del banco por conciliar`);
 const act=trabActivos(ym).length;const liqs=((S.remu[ym]||{}).liqs||[]).length;if(act&&!liqs)add('warn',`Remuneraciones del mes sin calcular (${act} trabajadores)`);
 if(liqs&&!asientos().some(a=>a.origen&&a.origen.kind==='remu'&&a.origen.ym===ym))add('info','Remuneraciones calculadas sin centralizar');
 return{alertas:out,iv,nDocs,asientos:asientos().filter(a=>a.fecha.startsWith(ym)).length,pendBanco:pend,ban:ban.length,liqs}}
const NIV={bad:0,warn:1,info:2};const NIVC={bad:'bad',warn:'warn',info:'acc'};
function vCartera(){if(!S.emps.length)return head('Panel de cartera','')+`<div class="sheet"><div class="empty"><h3>Aún no hay empresas</h3><p><a class="btn pri" href="#empresas">Crear la primera</a></p></div></div>`;
 if(!S.mes)return head('Panel de cartera','')+needMes();const ym=ymSel();
 if(!S.cartera){setTimeout(cargarTodo,0);return head('Panel de cartera','')+`<div class="sheet"><div class="empty">Revisando las empresas…</div></div>`}
 if(S.cartera.loading)return head('Panel de cartera','')+`<div class="sheet"><div class="empty">Revisando las empresas…</div></div>`;
 const vence=venceF29(ym);const dl=dias(hoy(),vence);
 const rows=S.emps.map(e=>({e,r:withEmp(e,()=>alertasEmp(e,ym))})).sort((a,b)=>{const sa=a.r?Math.min(3,...a.r.alertas.map(x=>NIV[x.nivel])):4,sb=b.r?Math.min(3,...b.r.alertas.map(x=>NIV[x.nivel])):4;return sa-sb||(a.e.razon||'').localeCompare(b.e.razon||'')});
 const all=rows.flatMap(x=>x.r?x.r.alertas:[]);const nb=all.filter(a=>a.nivel==='bad').length,nw=all.filter(a=>a.nivel==='warn').length;
 return head('Panel de cartera',`${esc(perTxt())} · ${S.emps.length} empresas · F29 vence el ${fd(vence)}${dl>=0?` (${dl===0?'hoy':`en ${dl} días`})`:` (venció hace ${-dl} días)`}`,`<a class="btn" href="#calendario">Calendario</a><button class="btn" data-act="cartera-reload">Actualizar</button>`)+
 `<div class="kpis"><div class="kpi"><span>Alertas críticas</span><b style="color:${nb?'var(--bad)':'var(--ok)'}">${nb}</b></div><div class="kpi"><span>Avisos</span><b style="color:${nw?'var(--warn)':'var(--ok)'}">${nw}</b></div><div class="kpi"><span>F29 a pagar (total cartera)</span><b>${fmt(sum(rows,x=>x.r?x.r.iv.total:0))}</b></div><div class="kpi"><span>Empresas al día</span><b>${rows.filter(x=>x.r&&!x.r.alertas.some(a=>a.nivel!=='info')).length} / ${rows.length}</b></div></div>
 <div class="sheet"><div class="scroll"><table><thead><tr><th>Empresa</th><th>Alertas</th><th class="n">Asientos</th><th class="n">Docs</th><th class="n">F29 a pagar</th><th></th></tr></thead><tbody>
 ${rows.map(({e,r})=>`<tr${e.id===S.empId?' class="picked"':''}><td><b>${esc(e.razon)}</b>${e.demo?' <span class="pill chip-demo">Ejemplo</span>':''}<br><span class="c">${rutFmt(e.rut)}</span></td>
 <td>${!r?'<span class="muted">Sin datos disponibles en esta vista</span>':r.alertas.length?`<div style="display:flex;flex-direction:column;gap:3px;align-items:flex-start">${r.alertas.sort((a,b)=>NIV[a.nivel]-NIV[b.nivel]).map(a=>`<span class="pill ${NIVC[a.nivel]}" style="white-space:normal">${esc(a.txt)}</span>`).join('')}</div>`:'<span class="pill ok">Todo al día</span>'}</td>
 <td class="n">${r?r.asientos:''}</td><td class="n">${r?r.nDocs:''}</td><td class="n">${r?fmt(r.iv.total):''}${r&&r.iv.remSig?`<br><span class="muted" style="font-size:11.5px">Remanente ${fmt(r.iv.remSig)}</span>`:''}</td>
 <td><button class="btn sm" data-act="emp-open" data-id="${e.id}">Abrir</button></td></tr>`).join('')}
 </tbody></table></div></div><p class="muted" style="font-size:12.5px;margin:0">Última revisión a las ${S.cartera.at?S.cartera.at.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit',hour12:false}):''} h. Usa “Actualizar” después de trabajar en otras empresas. El F29 se da por declarado cuando lo marcas en el calendario o cierras el mes.</p>`}

/* ---- Calendario tributario ---- */
const DJ_AT={2027:{'1879':'03-29','1887':'03-29','1847':'06-30','1926':'06-30','F22':'04-30'}};
const DJ_TXT={'1879':'DJ 1879 · retenciones de honorarios','1887':'DJ 1887 · sueldos','1847':'DJ 1847 · balance de 8 columnas','1926':'DJ 1926 · base imponible y pérdidas','F22':'Formulario 22 · renta anual'};
function eventosEmp(e,desde,hasta){const ev=[];const add=(key,fecha,txt,ref)=>{if(fecha>=desde&&fecha<=hasta)ev.push({key,fecha,txt,ref,e,hecho:tareaHecha(e,key)})};
 const [y0]=desde.split('-').map(Number);const tieneTrab=trabajadores().length>0;const ini=e.inicio?e.inicio.slice(0,7):(e.creada?prevYm(e.creada.slice(0,7)):'');
 for(let y=y0-1;y<=y0+1;y++)for(let m=1;m<=12;m++){const ym=`${y}-${pad(m)}`;if(ini&&ym<ini)continue;add('F29-'+ym,venceF29(ym),`F29 de ${MESES[m-1].toLowerCase()} ${y}`,'iva');
  if(tieneTrab){const [ny,nm]=m===12?[y+1,1]:[y,m+1];add('PREV-'+ym,`${ny}-${pad(nm)}-13`,`Cotizaciones Previred de ${MESES[m-1].toLowerCase()} ${y}`,'remu')}}
 for(let at=y0;at<=y0+1;at++){const D=DJ_AT[at]||DJ_AT[2027];const est=!DJ_AT[at];const hon=honDe().some(h=>h.fecha.startsWith(String(at-1)));const rem=Object.keys(S.remu).some(k=>k.startsWith(String(at-1)))||tieneTrab;
  for(const [dj,md] of Object.entries(D)){if(dj==='1879'&&!hon)continue;if(dj==='1887'&&!rem)continue;add(`${dj}-AT${at}`,`${at}-${md}`,`${DJ_TXT[dj]} AT${at}${est?' (fecha estimada)':''}`,dj==='F22'?'renta':null)}}
 return ev}
function vCalendario(){if(!S.emps.length)return head('Calendario tributario','')+noEmp();
 if(!S.cartera){setTimeout(cargarTodo,0);return head('Calendario tributario','')+`<div class="sheet"><div class="empty">Revisando las empresas…</div></div>`}
 if(S.cartera.loading)return head('Calendario tributario','')+`<div class="sheet"><div class="empty">Revisando las empresas…</div></div>`;
 const h=hoy();const d0=new Date();d0.setDate(d0.getDate()-60);const d1=new Date();d1.setDate(d1.getDate()+120);const desde=d0.toLocaleDateString('sv-SE'),hasta=d1.toLocaleDateString('sv-SE');
 let ev=S.emps.flatMap(e=>withEmp(e,()=>eventosEmp(e,desde,hasta))||[]);const verHechas=!!S.showImp.hechas;
 ev=ev.filter(x=>verHechas||!x.hecho).sort((a,b)=>a.fecha<b.fecha?-1:a.fecha>b.fecha?1:(a.e.razon||'').localeCompare(b.e.razon||''));
 const venc=ev.filter(x=>!x.hecho&&x.fecha<h).length,prox=ev.filter(x=>!x.hecho&&x.fecha>=h&&dias(h,x.fecha)<=7).length;
 let mes='';const rowsH=ev.map(x=>{const dd=dias(h,x.fecha);const mh=x.fecha.slice(0,7)!==mes?(mes=x.fecha.slice(0,7),`<tr class="sub"><td colspan="5">${MESES[+mes.slice(5,7)-1]} ${mes.slice(0,4)}</td></tr>`):'';
  const st=x.hecho?'<span class="pill ok">Hecho</span>':dd<0?`<span class="pill bad">Vencido hace ${-dd} días</span>`:dd<=7?`<span class="pill warn">${dd===0?'Hoy':`En ${dd} días`}</span>`:`<span class="pill">En ${dd} días</span>`;
  return mh+`<tr><td class="c">${fd(x.fecha)}</td><td>${st}</td><td><b>${esc(x.e.razon)}</b></td><td>${esc(x.txt)}</td><td><label style="display:flex;gap:6px;align-items:center;white-space:nowrap"><input type="checkbox" id="tk-${x.e.id}-${x.key}" data-save="tarea" data-emp="${x.e.id}" data-key="${x.key}" ${x.hecho?'checked':''}> Hecho</label></td></tr>`}).join('');
 return head('Calendario tributario','Vencimientos de todas tus empresas: últimos 60 días pendientes y próximos 4 meses.',`<button class="btn" data-act="imp-toggle" data-k="hechas">${verHechas?'Ocultar hechas':'Mostrar hechas'}</button><button class="btn" data-act="cartera-reload">Actualizar</button>`)+
 `<div class="kpis"><div class="kpi"><span>Vencidos sin marcar</span><b style="color:${venc?'var(--bad)':'var(--ok)'}">${venc}</b></div><div class="kpi"><span>Próximos 7 días</span><b style="color:${prox?'var(--warn)':'inherit'}">${prox}</b></div></div>
 <div class="sheet">${ev.length?`<div class="scroll"><table><thead><tr><th>Vence</th><th>Estado</th><th>Empresa</th><th>Obligación</th><th></th></tr></thead><tbody>${rowsH}</tbody></table></div>`:'<div class="empty">Sin vencimientos pendientes en el período.</div>'}</div>
 <p class="muted" style="font-size:12.5px;margin:0">Fechas de DJ del AT2027 según la Resolución Exenta SII N°135 de 2026; F22 al 30 de abril. Si el vencimiento cae en fin de semana o feriado, el SII lo traslada al día hábil siguiente. La DJ 1879 aparece si hubo honorarios y la 1887 si hay trabajadores.</p>`}

