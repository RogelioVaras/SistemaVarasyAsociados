/* Partida Doble · Dibujo de la pantalla: menú, barra superior y vista activa. */
/* ============ Render ============ */
/* Menú lateral: cada sección (General, Registros, Impuestos, Personal, Tesorería, Reportes)
   es un botón que despliega u oculta sus opciones. El estado se recuerda en el navegador. */
function grupoDe(k){const g=VIEWS.find(([,it])=>it.some(([v])=>v===k));return g?g[0]:'General'}
function navEst(){if(!S.nav){try{S.nav=JSON.parse(lsGet('pd.nav')||'{}')||{}}catch(e){S.nav={}}}return S.nav}
function navAbierto(g){const st=navEst();return st[g]!==undefined?!!st[g]:g===grupoDe(S.view)}
const NAV_CHEV='<svg class="chev" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function renderNav(){$('#nav').innerHTML=VIEWS.map(([g,it],i)=>{const sid='nav-sec-'+i,ab=navAbierto(g),on=it.some(([k])=>k===S.view);
 return `<div class="nav-sec${ab?'':' cerrado'}${on?' con-on':''}"><button type="button" class="nav-g" data-act="nav" data-g="${esc(g)}" aria-expanded="${ab}" aria-controls="${sid}" title="${ab?'Ocultar':'Mostrar'} ${esc(g)}"><span class="nav-t">${esc(g)}</span><span class="nav-n">${it.length}</span>${NAV_CHEV}</button><div class="nav-items" id="${sid}">${it.map(([k,t])=>`<a href="#${k}" class="${S.view===k?'on':''}">${t}</a>`).join('')}</div></div>`}).join('')}
function renderTop(){const yrs=new Set([now.getFullYear()-3,now.getFullYear()-2,now.getFullYear()-1,now.getFullYear(),now.getFullYear()+1,S.anio]);Object.keys(S.diario).forEach(k=>yrs.add(+k.slice(0,4)));
 const st=S.backend==='supabase'?`<span class="dot ${S.ro?'warn':'ok'}"></span>${esc(S.email||'')}${S.rol?' · '+esc((ROLES[S.rol]||S.rol)):''} <button class="btn sm ghost" data-act="salir">Salir</button>`:S.mode==='nube'?(S.ro?'<span class="dot warn"></span>Solo lectura':`<span class="dot ok"></span>Guardado en la nube${S.owner?'':' · colaborador'}`):S.mode==='local'?(S.local?'<span class="dot ok"></span>Guardado en este navegador':'<span class="dot warn"></span>Sin almacenamiento: los cambios no se guardan'):'<span class="dot"></span>Conectando…';
 $('#top').innerHTML=`<label>Empresa<select id="top-emp" class="emp-sel" data-top="emp"><option value="">${S.emps.length?'Elige una empresa':'Sin empresas'}</option>${S.emps.slice().sort((a,b)=>(a.razon||'').localeCompare(b.razon||'')).map(e=>`<option value="${e.id}" ${e.id===S.empId?'selected':''}>${esc(e.razon)} · ${rutFmt(e.rut)}</option>`).join('')}</select></label>
 <label>Año<select id="top-anio" data-top="anio">${[...yrs].sort().map(y=>`<option ${y===S.anio?'selected':''}>${y}</option>`).join('')}</select></label>
 <label>Mes<select id="top-mes" data-top="mes"><option value="0" ${!S.mes?'selected':''}>Todo el año</option>${MESES.map((m,i)=>`<option value="${i+1}" ${S.mes===i+1?'selected':''}>${m}</option>`).join('')}</select></label>
 <div class="status">${st}</div>`}
function render(){inval();const a=document.activeElement;const id=a&&a.id;let ss=null,se=null;try{ss=a.selectionStart;se=a.selectionEnd}catch(e){}
 const sy=window.scrollY;
 renderNav();renderTop();
 $('#dl-cuentas').innerHTML=plan().map(c=>`<option value="${c.codigo} ${esc(c.nombre)}"></option>`).join('');
 const V={resumen:vResumen,empresas:vEmpresas,usuarios:vUsuarios,plan:vPlan,diario:vDiario,mayor:vMayor,compras:()=>vLibro('compras'),ventas:()=>vLibro('ventas'),iva:vIva,banco:vBanco,balance:vBalance,eeff:vEeff,ctacte:vCtacte,renta:vRenta,cierre:vCierre,cartera:vCartera,honorarios:vHonorarios,activo:vActivo,trabajadores:vTrabajadores,remu:vRemu,calendario:vCalendario,historial:vHistorial}[S.view]||vResumen;
 if(!S.loaded.emps&&S.mode==='cargando'){$('#view').innerHTML=`<div class="sheet"><div class="empty">Cargando empresas…</div></div>`;return}
 NEED.clear();document.body.classList.toggle('ro',S.ro);
 $('#view').innerHTML=(S.ro?`<div class="note warn">${S.rol==='lector'
   ?'Tu rol en esta empresa es <b>Lector</b>: puedes revisar los libros y exportarlos, pero no registrar cambios. El dueño te cambia a Editor en Administración → Usuarios.'
   :'No tienes permiso para registrar cambios en esta empresa. Revisa tu rol en Administración → Usuarios; si deberías ser dueño, cierra sesión y entra con la cuenta que creó la empresa.'}</div>`:'')+V();
 if(S.ro)document.querySelectorAll('#view [data-save],#view [data-file],#view [data-f],#view [data-el],#view [data-ed],#view [data-imp]').forEach(el=>{el.disabled=true});
 if(NEED.size)resolverNombres();
 if(S.f.hon)updHon();
 if(id){const n=document.getElementById(id);if(n){n.focus({preventScroll:true});try{if(ss!=null)n.setSelectionRange(ss,se)}catch(e){}}}
 window.scrollTo(0,sy)}

