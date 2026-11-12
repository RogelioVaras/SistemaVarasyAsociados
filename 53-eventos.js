/* Partida Doble · Eventos de la página: clics, escritura, cambios y navegación. */
document.addEventListener('click',async e=>{const c=e.target.closest('[data-confirm]');
 if(c){e.stopPropagation();const key=c.dataset.confirm;if(S.confirm!==key){S.confirm=key;render();return}S.confirm=null;const i=key.indexOf(':');try{await CONFIRM[key.slice(0,i)](key.slice(i+1))}catch(err){}render();return}
 const t=e.target.closest('[data-act]');if(!t){if(S.confirm){S.confirm=null;render()}return}
 if(t.disabled)return;S.confirm=null;const fn=A[t.dataset.act];if(!fn)return;
 // El menú lateral se redibuja solo; no hace falta volver a pintar la vista.
 if(t.dataset.act==='nav'){try{fn(t,e)}catch(err){}return}
 try{const p=fn(t,e);render();if(p&&p.then){await p;render()}}catch(err){render()}});
document.addEventListener('input',e=>{const t=e.target;
 if(t.dataset.f){const [f,k]=t.dataset.f.split('.');S.f[f]=S.f[f]||{};S.f[f][k]=t.value;if((f==='compras'||f==='ventas')&&k==='rut'){const rg=reglaDe(f,t.value);if(rg&&S.f[f].cuenta!==rg){S.f[f].cuenta=rg;const sl=$('#df-cta');if(sl)sl.value=rg}}if(f==='compras'||f==='ventas')calcDoc(f,k);if(f==='hon')updHon();if(k==='rut')f==='emp'?autoRutEmp(t):autoRutDoc(f,t);return}
 if(t.dataset.ed){S.ed[t.dataset.ed]=t.value;return}
 if(t.dataset.el){const [i,k]=t.dataset.el.split('.');const l=S.ed.lineas[+i];if(k==='cuenta'){l._txt=t.value;l.cuenta=parseCta(t.value)}else{l[k]=t.value;if(k==='debe'&&t.value)l.haber='';if(k==='haber'&&t.value)l.debe='';const other=document.getElementById(`el-${i}-${k==='debe'?'h':'d'}`);if(other&&t.value)other.value=''}updEdTot();return}
 if(t.dataset.imp){S.imp[t.dataset.imp]=t.value;return}
 if(t.dataset.q){S.q=t.value;render();return}
 if(t.dataset.qh){S.qh=t.value;render()}});
document.addEventListener('change',async e=>{const t=e.target;
 // Al salir del campo, el RUT queda con puntos y guion.
 if(t.id==='emp-rut'){const v=rutFmt(t.value);t.value=v;if(S.f.emp)S.f.emp.rut=v;autoRutEmp(t);return}
 if(t.id==='df-rut'){const v=rutFmt(t.value);t.value=v;const k=String(t.dataset.f||'').split('.')[0];if(S.f[k])S.f[k].rut=v;return}
 if(t.id==='emp-reprut'){const v=rutFmt(t.value);t.value=v;if(S.f.emp)S.f.emp.repRut=v;return}
 if(t.dataset.el&&t.dataset.el.endsWith('.cuenta')){const l=S.ed.lineas[+t.dataset.el.split('.')[0]];if(l.cuenta)t.value=ctaTxt(l.cuenta);else if(t.value)toast('No encontré esa cuenta en el plan. Escribe el código o elige de la lista.','err');render();return}
 if(t.dataset.top){const v=t.value;if(t.dataset.top==='emp'){selectEmp(v||null);return}if(t.dataset.top==='anio'){S.anio=+v;lsSet('pd.anio',v)}if(t.dataset.top==='mes'){S.mes=+v;lsSet('pd.mes',v)}if(t.dataset.top==='mayor')S.mayorCta=v;if(t.dataset.top==='banco'){S.bancoCta=v;S.sel={mov:null,lin:null}}if(t.dataset.top==='cc'){S.ccCta=v;S.ccRut=null;S.f.pago=null}S.ed=null;render();return}
 if(t.dataset.file==='backup'){const file=t.files&&t.files[0];if(!file)return;const fr=new FileReader();fr.onload=()=>{restaurar(String(fr.result)).catch(()=>{}).then(render)};fr.readAsText(file,'UTF-8');t.value='';return}
 if(t.dataset.file){const k=t.dataset.file;const file=t.files&&t.files[0];if(!file)return;const rd=enc=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=()=>r('');fr.readAsText(file,enc)});let txt=await rd('UTF-8');if(txt.includes('\uFFFD'))txt=await rd('ISO-8859-1');S.imp[k]=txt;render();toast(`Archivo cargado: ${parseCSV(txt).length} filas`);return}
 const s=t.dataset.save;if(!s)return;
 try{
 if(s==='clave'){await saveEmp({claves:{...claves(),[t.dataset.key]:t.value}});toast('Cuenta actualizada')}
 else if(s.startsWith('plan-')){const p=clone(plan());const c=p.find(x=>x.codigo===t.dataset.cod);if(!c)return;if(s==='plan-nom'){if(!t.value.trim())return;c.nombre=t.value.trim()}if(s==='plan-grp')c.grupo=t.value;if(s==='plan-bco')c.banco=t.checked;if(s==='plan-aux')c.aux=t.checked;await saveEmp({plan:p})}
 else if(s==='rol'){await invitarMiembro(S.empId,t.dataset.email,t.value);return}
 else if(s==='regla'){await guardarRegla(t.dataset.k,t.dataset.rut,t.value);toast('Regla actualizada')}
 else if(s==='tarea'){const e=S.emps.find(x=>x.id===t.dataset.emp);if(!e)return;const o=clone(e);delete o.id;o.tareas=o.tareas||{};if(t.checked)o.tareas[t.dataset.key]=true;else delete o.tareas[t.dataset.key];await put(`empresas/${e.id}`,o)}
 else if(s==='cerradoHasta'){if(!soloDueno()){render();return}await saveEmp({cerradoHasta:t.value});toast(t.value?`Períodos cerrados hasta ${cerradoTxt()}`:'Se quitó el bloqueo de períodos')}
 else if(s.startsWith('renta-')){const y=String(S.anio);const o=clone(S.renta[y]||{});const key={'renta-tasa':'tasa','renta-perd':'perdidaAnt','renta-ppm':'ppm'}[s];const v=t.value.trim();if(v==='')delete o[key];else o[key]=key==='tasa'?+v.replace(',','.'):Math.round(pn(v));await putE(`renta/${y}`,o)}
 else if(s==='tasaPPM'){await saveEmp({tasaPPM:String(t.value).replace(',','.')})}
 else if(s==='sii'){const ym=ymSel();const o=clone(S.rcv[ym]||{compras:[],ventas:[]});o.sii=o.sii||{};const v=t.value.trim();if(v==='')delete o.sii[t.dataset.key];else o.sii[t.dataset.key]=Math.round(pn(v));await putE(`rcv/${ym}`,o)}
 else if(s==='uf'||s==='prev'||s==='prevafp'){const o=clone(S.ind||{});const raw=String(t.value).trim();const val=raw===''?null:pdec(raw);
  if(s==='uf'){o.uf=o.uf||{};if(val)o.uf[t.dataset.key]=val;else delete o.uf[t.dataset.key]}
  else{o.prev=o.prev||{};const tgt=s==='prev'?o.prev:(o.prev.afp=o.prev.afp||{});if(val===null)delete tgt[t.dataset.key];else tgt[t.dataset.key]=val}
  await put('config/indicadores',o)}
 else if(s==='utm'){const o=clone(S.ind||{});o.utm=o.utm||{};const v=Math.round(pn(t.value));if(!v)delete o.utm[t.dataset.key];else o.utm[t.dataset.key]=v;await put('config/indicadores',o)}
 else if(s==='remAnt'||s==='retHon'){const ym=ymSel();const o=clone(S.rcv[ym]||{compras:[],ventas:[]});const v=t.value.trim();if(v==='')delete o[s];else o[s]=Math.round(pn(v));await putE(`rcv/${ym}`,o)}
 else if(s==='saldoBanco'){const ym=ymSel();const o=clone(S.banco[ym]||{movs:[]});o.saldos=o.saldos||{};const v=t.value.trim();if(v==='')delete o.saldos[bancoCta()];else o.saldos[bancoCta()]=Math.round(pn(v));await putE(`banco/${ym}`,o)}
 }catch(err){}render()});
function route(){const h=location.hash.slice(1);S.view=VIEWS.some(([,it])=>it.some(([k])=>k===h))?h:'resumen';S.confirm=null;
 // Si se llega a una vista de una sección cerrada del menú, se abre para que quede a la vista.
 const g=grupoDe(S.view),st=navEst();if(st[g]===false){st[g]=true;lsSet('pd.nav',JSON.stringify(st))}
 render();window.scrollTo(0,0)}
window.addEventListener('hashchange',route);

