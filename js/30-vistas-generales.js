/* Partida Doble · Vistas: componentes comunes, resumen, empresas y plan de cuentas. */
/* ============ Vistas ============ */
function head(t,p,actions=''){return `<div class="head"><div><h1>${t}</h1>${p?`<p>${p}</p>`:''}</div><div class="row">${actions}</div></div>`}
function noEmp(){return `<div class="sheet"><div class="empty"><h3>Elige o crea una empresa</h3><p>Cada empresa lleva su propio plan de cuentas, libros y conciliaciones.</p><p><a class="btn pri" href="#empresas">Ir a Empresas</a></p></div></div>`}
function needMes(){return `<div class="note warn">Este libro se trabaja por mes. Elige un mes en la barra superior.</div>`}
function loading(){return `<div class="sheet"><div class="empty">Cargando libros de la empresa…</div></div>`}
const ready=()=>KINDS.every(k=>S.loaded[k]);
const confirmBtn=(key,label,extra='')=>{const armed=S.confirm===key;return `<button class="btn sm danger${armed?' armed':''}" data-confirm="${esc(key)}" ${extra}>${armed?'Confirmar':label}</button>`};

function vResumen(){const e=emp();if(!e)return head('Resumen','')+noEmp();if(!ready())return loading();
 const R=rango();const [d,h]=R;const yms=Object.keys(S.rcv).filter(y=>y>=d.slice(0,7)&&y<=h.slice(0,7));
 const vent=sum(yms,y=>((S.rcv[y]||{}).ventas||[]).reduce((s,x)=>s+(+x.tipo===61?-1:1)*((+x.total||0)-(+x.iva||0)),0));
 const comp=sum(yms,y=>((S.rcv[y]||{}).compras||[]).reduce((s,x)=>s+(+x.tipo===61?-1:1)*((+x.total||0)-(+x.iva||0)),0));
 const {m}=acumulados(h,S.anio);let resultado=0,banco=0;for(const [c,v] of Object.entries(m)){const x=cm()[c];if(x&&RES.has(x.grupo))resultado+=v.haber-v.debe;if(x&&x.banco)banco+=v.debe-v.haber}
 const iv=S.mes?ivaMes(ymSel()):null;
 const lista=asientos().filter(a=>enRango(a.fecha,R));const desc=lista.filter(a=>!cuadra(a)).length;
 const matched=new Set(movsTodos().filter(x=>x.match).map(x=>x.match));
 const pendBanco=movsTodos().filter(x=>!x.match&&enRango(x.fecha,R)).length;
 const pendLib=bancos().reduce((s,b)=>s+lineasBanco(b.codigo,h).filter(l=>!matched.has(l.k)).length,0);
 const ult=lista.slice(-8).reverse();
 return head(esc(e.razon),`${rutFmt(e.rut)} · ${esc(e.giro||'Sin giro registrado')} · ${esc(e.regimen||'')}${e.demo?' · <span class="pill chip-demo">Empresa de ejemplo</span>':''}`,`<a class="btn" href="#diario">Libro diario</a><a class="btn pri" href="#iva">IVA del mes</a>`)+
 `<div class="kpis">
  <div class="kpi"><span>Ventas netas · ${esc(perTxt())}</span><b>${fmt(vent)}</b><small>Desde el libro de ventas</small></div>
  <div class="kpi"><span>Compras netas · ${esc(perTxt())}</span><b>${fmt(comp)}</b><small>Desde el libro de compras</small></div>
  <div class="kpi"><span>F29 a pagar</span><b>${iv?fmt(iv.total):'—'}</b><small>${iv?(iv.remSig?`Remanente CF ${fmt(iv.remSig)}`:`IVA ${fmt(iv.ivaPagar)} + PPM ${fmt(iv.ppm)}`):'Elige un mes'}</small></div>
  <div class="kpi"><span>Resultado acumulado ${S.anio}</span><b style="color:${resultado<0?'var(--bad)':'var(--ok)'}">${fmt(resultado)}</b><small>${resultado<0?'Pérdida':'Utilidad'} al cierre del período</small></div>
  <div class="kpi"><span>Saldo bancos (libro)</span><b>${fmt(banco)}</b><small>${pendBanco+pendLib} partidas sin conciliar</small></div>
  <div class="kpi"><span>Asientos del período</span><b>${lista.length}</b><small>${desc?`<span class="pill bad">${desc} descuadrados</span>`:'<span class="pill ok">Todos cuadrados</span>'}</small></div>
 </div>
 <div class="sheet"><div class="sheet-h"><h2>Últimos asientos</h2><a href="#diario" class="sub">Ver libro diario</a></div>
 ${ult.length?`<div class="scroll"><table><thead><tr><th>N°</th><th>Fecha</th><th>Glosa</th><th class="n">Monto</th><th></th></tr></thead><tbody>${ult.map(a=>`<tr><td class="c">${a.numero}</td><td class="c">${fd(a.fecha)}</td><td>${esc(a.glosa)}</td><td class="n">${fmt(sum(a.lineas,l=>l.debe))}</td><td>${cuadra(a)?'':'<span class="pill bad">Descuadrado</span>'}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty"><h3>Sin asientos en ${esc(perTxt())}</h3><p>Registra un asiento o carga documentos de compras y ventas.</p></div>`}</div>`}

function vEmpresas(){const f=S.f.emp;
 const form=f?`<div class="sheet"><div class="sheet-h"><h2>${f.id?'Editar empresa':'Nueva empresa'}</h2></div><div class="sheet-b"><div class="form">
  <label>RUT<input id="emp-rut" data-f="emp.rut" value="${esc(f.rut)}" placeholder="76.123.456-7" autocomplete="off"><span id="emp-rut-msg" style="text-transform:none;letter-spacing:0;font-weight:500;font-size:12px;min-height:15px;color:var(--muted)"></span></label>
  <label class="wide">Razón social<input id="emp-razon" data-f="emp.razon" value="${esc(f.razon)}"></label>
  <label class="wide">Giro<input id="emp-giro" data-f="emp.giro" value="${esc(f.giro)}"></label>
  <label class="wide">Dirección<input id="emp-dir" data-f="emp.direccion" value="${esc(f.direccion)}"></label>
  <label>Comuna<input id="emp-comuna" data-f="emp.comuna" value="${esc(f.comuna)}"></label>
  <label>Régimen tributario<select id="emp-reg" data-f="emp.regimen">${REGIMENES.map(r=>`<option ${f.regimen===r?'selected':''}>${r}</option>`).join('')}</select></label>
  <label>Tasa PPM (%)<input id="emp-ppm" class="num" data-f="emp.tasaPPM" value="${esc(f.tasaPPM)}" inputmode="decimal"></label>
  <label>Inicio de actividades<input id="emp-ini" type="date" data-f="emp.inicio" value="${esc(f.inicio)}"></label>
  <label class="wide">Representante legal<input id="emp-rep" data-f="emp.repLegal" value="${esc(f.repLegal||'')}"></label>
  <label>RUT representante<input id="emp-reprut" data-f="emp.repRut" value="${esc(f.repRut||'')}"></label>
 </div><div class="row" style="margin-top:14px"><button class="btn pri" data-act="emp-save">Guardar empresa</button><button class="btn ghost" data-act="emp-cancel">Cancelar</button><span class="muted" id="emp-msg"></span></div></div></div>`:'';
 const rows=S.emps.slice().sort((a,b)=>(a.razon||'').localeCompare(b.razon||''));
 return (S.mode==='local'&&S.local?'<div class="note">Modo navegador: los datos quedan guardados solo en este navegador y en este equipo. Descarga un respaldo de cada empresa con frecuencia; si borras los datos del navegador, se pierden.</div>':'')+head('Empresas','Clientes y negocios propios que llevas. Al crear una empresa se le asigna un plan de cuentas base que puedes ajustar.',f?'':`${S.owner||S.backend==='supabase'?'<label class="btn" for="restore-file" style="cursor:pointer">Restaurar respaldo</label><input type="file" id="restore-file" accept=".json" data-file="backup" hidden>':''}${!rows.length?'<button class="btn" data-act="emp-demo">Cargar empresa de ejemplo</button>':''}<button class="btn pri" data-act="emp-new">Nueva empresa</button>`)+form+
 `<div class="sheet">${rows.length?`<div class="scroll"><table><thead><tr><th>RUT</th><th>Razón social</th><th>Giro</th><th>Régimen</th><th class="n">PPM</th><th></th></tr></thead><tbody>${rows.map(e=>`<tr${e.id===S.empId?' class="picked"':''}><td class="c">${rutFmt(e.rut)}</td><td><b>${esc(e.razon)}</b>${e.demo?' <span class="pill chip-demo">Ejemplo</span>':''}</td><td>${esc(e.giro)}</td><td>${esc(e.regimen)}</td><td class="n">${esc(e.tasaPPM||0)}%</td><td><div class="row" style="justify-content:flex-end"><button class="btn sm" data-act="emp-open" data-id="${e.id}">Abrir</button><button class="btn sm" data-act="emp-edit" data-id="${e.id}">Editar</button>${canDl()?`<button class="btn sm" data-act="emp-backup" data-id="${e.id}">Respaldo</button>`:''}${S.owner?confirmBtn('delEmp:'+e.id,'Eliminar'):''}</div></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty"><h3>Aún no hay empresas</h3><p>Crea la primera para empezar a registrar asientos.</p></div>`}</div>`+vAlmacen()}

function vUsuarios(){const e=emp();
 if(S.backend==='supabase'){
  const roles=SB.roles||{};const n=Object.keys(roles).length;
  return head('Usuarios',`Quién puede entrar a la app y qué puede hacer en cada empresa · ${esc(S.email||'')}`,'<button class="btn sm ghost" data-act="salir">Salir</button>')+
   `<div class="grid2"><div class="sheet"><div class="sheet-h"><h2>Tu cuenta</h2></div><div class="sheet-b">
     <table><tbody><tr><th>Correo</th><td class="c">${esc(S.email||'—')}</td></tr>
     <tr><th>Rol en ${esc(e?e.razon:'la empresa activa')}</th><td>${esc(ROLES[S.rol||(e?roles[e.id]:'')]||'Sin acceso definido')}</td></tr>
     <tr><th>Empresas con acceso</th><td>${n}</td></tr></tbody></table>
     <p class="muted" style="margin:10px 0 0;font-size:12.5px">El rol lo asigna el dueño de cada empresa. Editor registra asientos y documentos; Lector solo revisa y exporta.</p></div></div>
    <div class="sheet"><div class="sheet-h"><h2>Empresas a las que tienes acceso</h2><span class="sub">${S.emps.length}</span></div>
     ${S.emps.length?`<div class="scroll"><table><thead><tr><th>Empresa</th><th>RUT</th><th>Tu rol</th><th></th></tr></thead><tbody>${S.emps.slice().sort((a,b)=>(a.razon||'').localeCompare(b.razon||'')).map(x=>`<tr${x.id===S.empId?' class="picked"':''}><td><b>${esc(x.razon)}</b></td><td class="c">${rutFmt(x.rut)}</td><td>${esc(ROLES[roles[x.id]||'dueno']||'—')}</td><td><button class="btn sm" data-act="emp-open" data-id="${x.id}">Abrir</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty"><h3>Sin empresas</h3><p>Pide al dueño que te dé acceso por correo.</p></div>'}</div></div>`+
   (e?vAccesos():'')}
 const rows=S.emps.slice().sort((a,b)=>(a.razon||'').localeCompare(b.razon||''));
 return head('Usuarios','En modo navegador no hay cuentas separadas: todo lo guardado en este equipo es de quien lo usa')+
  `<div class="note">Modo navegador: no se piden contraseña ni usuario, y no hay forma de dar acceso a otra persona. Los datos quedan en este navegador y este equipo. Para trabajar entre varios, con roles y permisos por empresa, hay que conectar la base de datos en la nube (ver README, sección 3).</div>`+
  `<div class="sheet"><div class="sheet-h"><h2>Quién usa este equipo</h2><span class="sub">1 persona</span></div>
   <div class="scroll"><table><thead><tr><th>Persona</th><th>Correo</th><th>Rol</th><th>Empresas a cargo</th></tr></thead><tbody>
   <tr><td><b>Dueño de este equipo</b></td><td class="muted">—</td><td>Dueño (acceso total)</td><td>${rows.length} ${rows.length===1?'empresa':'empresas'}${rows.length?`<div class="muted" style="font-size:12px">${esc(rows.map(x=>x.razon).join(' · '))}</div>`:''}</td></tr>
   </tbody></table></div></div>`+
  `<div class="sheet"><div class="sheet-h"><h2>Cómo trabajar con más de una persona</h2></div><div class="sheet-b">
   <table><thead><tr><th style="width:34px">#</th><th>Paso</th></tr></thead><tbody>
   <tr><td class="c">1</td><td>Conecta la base de datos en la nube (Supabase) siguiendo el README, sección 3. Desde ahí cada persona entra con su correo y contraseña.</td></tr>
   <tr><td class="c">2</td><td>Quien crea o restaura una empresa queda como <b>dueño</b> y puede dar acceso por correo en esta misma pantalla.</td></tr>
   <tr><td class="c">3</td><td>El dueño asigna rol <b>Editor</b> (registra) o <b>Lector</b> (solo revisa y exporta). Cada persona ve únicamente las empresas a las que tiene acceso, y eso lo controla la base de datos, no solo la pantalla.</td></tr>
   </tbody></table></div></div>`}

function vPlan(){const e=emp();if(!e)return head('Plan de cuentas','')+noEmp();const p=plan();const f=S.f.cta||{codigo:'',nombre:'',grupo:'GAS'};const k=claves();
 const usadas=new Set(asientos().flatMap(a=>(a.lineas||[]).map(l=>l.cuenta)));
 return head('Plan de cuentas',`${p.length} cuentas. Códigos de 7 dígitos: el primero indica la naturaleza (1 activo, 2 pasivo, 3 patrimonio, 4 ingresos, 5 costos y gastos).`,csvBtn('plan'))+
 `<div class="sheet"><div class="sheet-h"><h2>Agregar cuenta</h2></div><div class="sheet-b"><div class="form">
  <label>Código<input id="cta-cod" class="mono" data-f="cta.codigo" value="${esc(f.codigo)}" placeholder="5201011"></label>
  <label class="wide">Nombre<input id="cta-nom" data-f="cta.nombre" value="${esc(f.nombre)}"></label>
  <label>Grupo<select id="cta-grp" data-f="cta.grupo">${Object.entries(GRUPOS).map(([g,t])=>`<option value="${g}" ${f.grupo===g?'selected':''}>${t}</option>`).join('')}</select></label>
  <label>Cuenta bancaria<select id="cta-bco" data-f="cta.banco"><option value="">No</option><option value="1" ${f.banco?'selected':''}>Sí, conciliable</option></select></label>
 </div><div class="row" style="margin-top:12px"><button class="btn pri" data-act="plan-add">Agregar cuenta</button></div></div></div>
 <div class="sheet"><div class="sheet-h"><h2>Cuentas para asientos automáticos</h2><span class="sub">Se usan al centralizar compras y ventas</span></div><div class="sheet-b"><div class="form">
 ${Object.entries(CLAVES_TXT).map(([key,t])=>`<label>${t}<select id="clave-${key}" data-save="clave" data-key="${key}">${p.map(c=>`<option value="${c.codigo}" ${k[key]===c.codigo?'selected':''}>${c.codigo} ${esc(c.nombre)}</option>`).join('')}</select></label>`).join('')}
 </div></div></div>
 <div class="sheet"><div class="scroll"><table><thead><tr><th>Código</th><th>Nombre</th><th>Grupo</th><th>Banco</th><th title="Lleva cuenta corriente por RUT">Aux. RUT</th><th></th></tr></thead><tbody>
 ${p.map(c=>`<tr><td class="c">${c.codigo}</td><td><input id="pn-${c.codigo}" data-save="plan-nom" data-cod="${c.codigo}" value="${esc(c.nombre)}" style="width:100%;min-width:200px"></td><td><select id="pg-${c.codigo}" data-save="plan-grp" data-cod="${c.codigo}">${Object.entries(GRUPOS).map(([g,t])=>`<option value="${g}" ${c.grupo===g?'selected':''}>${t}</option>`).join('')}</select></td><td><input type="checkbox" id="pb-${c.codigo}" data-save="plan-bco" data-cod="${c.codigo}" ${c.banco?'checked':''} aria-label="Cuenta bancaria"></td><td><input type="checkbox" id="pa-${c.codigo}" data-save="plan-aux" data-cod="${c.codigo}" ${esAux(c.codigo)?'checked':''} aria-label="Auxiliar por RUT"></td><td>${usadas.has(c.codigo)?'<span class="pill">Con movimientos</span>':confirmBtn('delCta:'+c.codigo,'Eliminar')}</td></tr>`).join('')}
 </tbody></table></div></div>`}

function edTotals(){const L=S.ed.lineas;const d=Math.round(sum(L,l=>pn(l.debe))),h=Math.round(sum(L,l=>pn(l.haber)));return{d,h,ok:d===h&&d>0}}
