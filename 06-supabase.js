/* Partida Doble · Conexión con Supabase (base de datos en la nube, inicio de sesión y permisos por empresa).
   La app trabaja con "documentos" identificados por una ruta, por ejemplo:
     empresas/{id}                 → datos de la empresa
     empresas/{id}/diario/2026-10  → asientos de octubre
     config/indicadores            → UF, UTM y parámetros previsionales (comunes)
   Este archivo traduce esas rutas a la tabla "documentos" de Supabase y entrega
   la misma interfaz que usa el resto de la app: doc(ruta).get/set/delete/onSnapshot
   y collection(ruta).get/onSnapshot. */

const SB={client:null,session:null,roles:{}};
const sbConfigurado=()=>{const c=window.PD_CONFIG||{};return !!(c.supabaseUrl&&c.supabaseAnonKey)};

function cargarScript(src){return new Promise((ok,mal)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>mal(new Error('No se pudo cargar '+src));document.head.appendChild(s)})}

async function iniciarSupabase(){
 if(!window.supabase)await cargarScript((window.PD_CONFIG||{}).supabaseScript||'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.min.js');
 const c=window.PD_CONFIG;SB.client=window.supabase.createClient(c.supabaseUrl,c.supabaseAnonKey);
 const {data}=await SB.client.auth.getSession();SB.session=data.session||null;
 SB.client.auth.onAuthStateChange((ev,ses)=>{const antes=SB.session&&SB.session.user.id;SB.session=ses;if(ev==='SIGNED_OUT'||(ses&&ses.user.id!==antes))location.reload()});
 return SB.session}

const sbErr=e=>{if(!e)return null;const code=e.code==='42501'||/row-level security|permission/i.test(e.message||'')?'invalid_argument':'unavailable';return{code,message:e.message}};
const rutaPadre=p=>p.split('/').slice(0,-1).join('/');
const rutaId=p=>p.split('/').pop();
const rutaEmpresa=p=>{const s=p.split('/');return s[0]==='empresas'&&s[1]?s[1]:null};

function crearDbSupabase(sb,uid){
 const tabla=()=>sb.from('documentos');
 const snapDoc=(id,row)=>({id,exists:!!row,data:()=>row?row.data:undefined});
 async function leerDoc(path){const {data,error}=await tabla().select('data').eq('path',path).maybeSingle();if(error)throw sbErr(error);return snapDoc(rutaId(path),data)}
 async function leerColeccion(path){const filas=[];const paso=1000;for(let desde=0;;desde+=paso){const {data,error}=await tabla().select('path,data').eq('parent',path).order('path').range(desde,desde+paso-1);if(error)throw sbErr(error);filas.push(...data);if(data.length<paso)break}
  const docs=filas.map(r=>snapDoc(rutaId(r.path),r));return{docs,size:docs.length,empty:!docs.length}}
 function escuchar(filtro,recargar){let t=null;const pedir=()=>{clearTimeout(t);t=setTimeout(recargar,250)};
  const ch=sb.channel('pd:'+filtro.valor+':'+Math.random().toString(36).slice(2))
   .on('postgres_changes',{event:'*',schema:'public',table:'documentos',filter:`${filtro.campo}=eq.${filtro.valor}`},pedir)
   .on('postgres_changes',{event:'DELETE',schema:'public',table:'documentos'},p=>{const o=p.old||{};if(o[filtro.campo]===filtro.valor)pedir()})
   .subscribe();
  return()=>{clearTimeout(t);sb.removeChannel(ch)}}
 return{
  doc:path=>({
   get:()=>leerDoc(path),
   set:async data=>{const row={path,parent:rutaPadre(path),empresa_id:rutaEmpresa(path),data,updated_at:new Date().toISOString(),updated_by:uid};
    // Se crea la fila y, si ya existía, se actualiza. No se usa upsert a propósito:
    // PostgREST devuelve la fila guardada y, al aplicarle la política de lectura, rechaza
    // el alta de una empresa nueva (todavía no hay membresía). Con insert + update no se
    // pide esa lectura y el alta funciona.
    const ins=await tabla().insert(row);
    if(!ins.error)return;
    if(ins.error.code==='23505'){const upd=await tabla().update(row).eq('path',path);if(upd.error)throw sbErr(upd.error);return}
    throw sbErr(ins.error)},
   delete:async()=>{const {error}=await tabla().delete().eq('path',path);if(error)throw sbErr(error)},
   onSnapshot(next,err){let vivo=true;const cargar=()=>leerDoc(path).then(s=>{if(vivo)next(s)}).catch(e=>{if(vivo&&err)err(e)});cargar();const off=escuchar({campo:'path',valor:path},cargar);return()=>{vivo=false;off()}}
  }),
  collection:path=>({
   get:()=>leerColeccion(path),
   onSnapshot(next,err){let vivo=true;const cargar=()=>leerColeccion(path).then(s=>{if(vivo)next(s)}).catch(e=>{if(vivo&&err)err(e)});cargar();const off=escuchar({campo:'parent',valor:path},cargar);return()=>{vivo=false;off()}}
  })
 }}

function crearUserSupabase(sb,uid){return{
 id:async()=>uid,isOwner:async()=>true,can:async()=>null,
 profiles:async ids=>{const out={};ids.forEach(i=>out[i]={name:''});const {data}=await sb.from('perfiles').select('user_id,nombre,email').in('user_id',ids);(data||[]).forEach(p=>{out[p.user_id]={name:p.nombre||p.email||''}});return out}}}

async function cargarRoles(){const {data,error}=await SB.client.from('miembros').select('empresa_id,rol').eq('user_id',S.uid);if(!error){SB.roles={};(data||[]).forEach(r=>SB.roles[r.empresa_id]=r.rol)}}
function aplicarRol(empId,reintento){if(S.backend!=='supabase')return;const r=SB.roles[empId];S.rol=r||null;S.owner=r==='dueno'||!r;S.ro=r==='lector';
 if(empId&&!r&&!reintento)cargarRoles().then(()=>{if(S.empId===empId){aplicarRol(empId,true);render()}})}

/* ---- Accesos por empresa (solo con Supabase) ---- */
async function cargarMiembros(empId){S.miembros=S.miembros||{};const {data,error}=await SB.client.from('miembros').select('user_id,rol').eq('empresa_id',empId);if(error){S.miembros[empId]={error:error.message};render();return}
 const ids=data.map(m=>m.user_id);const {data:pf}=ids.length?await SB.client.from('perfiles').select('user_id,nombre,email').in('user_id',ids):{data:[]};const mp=Object.fromEntries((pf||[]).map(p=>[p.user_id,p]));
 S.miembros[empId]={lista:data.map(m=>({...m,nombre:(mp[m.user_id]||{}).nombre||'',email:(mp[m.user_id]||{}).email||''}))};render()}
async function invitarMiembro(empId,email,rol){const {data,error}=await SB.client.rpc('invitar_miembro',{p_empresa:empId,p_email:email,p_rol:rol});if(error){toast(error.message,'err');return}
 if(data==='no_registrado'){toast('Esa persona aún no tiene cuenta. Pídele que se registre en la app con ese correo y vuelve a invitarla.','err');return}toast('Acceso actualizado');await cargarMiembros(empId)}
async function quitarMiembro(empId,userId){const {error}=await SB.client.rpc('quitar_miembro',{p_empresa:empId,p_user:userId});if(error){toast(error.message,'err');return}toast('Acceso quitado');await cargarMiembros(empId)}
const ROLES={dueno:'Dueño',editor:'Editor (registra)',lector:'Lector (solo ve)'};
function vAccesos(){const e=emp();if(S.backend!=='supabase'||!e)return'';const m=(S.miembros||{})[e.id];if(!m){setTimeout(()=>cargarMiembros(e.id),0);return''}
 if(m.error)return `<div class="note warn">No se pudieron leer los accesos: ${esc(m.error)}</div>`;const f=S.f.inv||{email:'',rol:'editor'};const dueno=S.rol==='dueno';
 return `<div class="sheet"><div class="sheet-h"><h2>Accesos a ${esc(e.razon)}</h2><span class="sub">Quién puede ver o registrar en esta empresa</span></div>
 <div class="scroll"><table><thead><tr><th>Persona</th><th>Correo</th><th>Rol</th><th></th></tr></thead><tbody>${m.lista.map(x=>`<tr><td>${esc(x.nombre||'—')}${x.user_id===S.uid?' <span class="pill">Tú</span>':''}</td><td class="c">${esc(x.email)}</td><td>${dueno&&x.user_id!==S.uid?`<select id="rol-${x.user_id}" data-save="rol" data-email="${esc(x.email)}">${Object.entries(ROLES).map(([k,t])=>`<option value="${k}" ${x.rol===k?'selected':''}>${t}</option>`).join('')}</select>`:esc(ROLES[x.rol]||x.rol)}</td><td>${dueno&&x.user_id!==S.uid?confirmBtn('delMiembro:'+x.user_id,'Quitar'):''}</td></tr>`).join('')}</tbody></table></div>
 ${dueno?`<div class="sheet-b"><div class="form"><label class="wide">Correo de la persona<input id="inv-email" type="email" data-f="inv.email" value="${esc(f.email)}" placeholder="persona@correo.cl"></label><label>Rol<select id="inv-rol" data-f="inv.rol">${Object.entries(ROLES).map(([k,t])=>`<option value="${k}" ${f.rol===k?'selected':''}>${t}</option>`).join('')}</select></label></div>
 <div class="row" style="margin-top:10px"><button class="btn" data-act="inv-add">Dar acceso</button><span class="muted">La persona debe crear su cuenta en la app antes de que la invites.</span></div></div>`:''}</div>`}

/* ---- Pantalla de ingreso ---- */
function mostrarLogin(msg){const el=document.getElementById('login');el.hidden=false;document.querySelector('.app').hidden=true;
 el.innerHTML=`<div class="login-card"><div class="brand"><div class="brand-mark">D|H</div><div><b>Partida Doble</b><small>Contabilidad multiempresa</small></div></div>
 <h1>${S.loginModo==='registro'?'Crear cuenta':'Ingresar'}</h1>${msg?`<div class="note ${msg.ok?'':'warn'}">${esc(msg.t)}</div>`:''}
 <form id="login-form" class="form" style="grid-template-columns:1fr">
 ${S.loginModo==='registro'?'<label>Nombre<input id="lg-nombre" autocomplete="name" required></label>':''}
 <label>Correo<input id="lg-email" type="email" autocomplete="email" required></label>
 <label>Contraseña<input id="lg-pass" type="password" autocomplete="${S.loginModo==='registro'?'new-password':'current-password'}" minlength="8" required></label>
 <button class="btn pri" type="submit">${S.loginModo==='registro'?'Crear cuenta':'Ingresar'}</button></form>
 <div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn ghost sm" id="lg-modo" type="button">${S.loginModo==='registro'?'Ya tengo cuenta':'Crear una cuenta'}</button>${S.loginModo==='registro'?'':'<button class="btn ghost sm" id="lg-olvido" type="button">Olvidé mi contraseña</button>'}</div></div>`;
 document.getElementById('lg-modo').onclick=()=>{S.loginModo=S.loginModo==='registro'?'ingreso':'registro';mostrarLogin()};
 const ol=document.getElementById('lg-olvido');if(ol)ol.onclick=async()=>{const em=document.getElementById('lg-email').value.trim();if(!em){mostrarLogin({t:'Escribe tu correo y vuelve a presionar “Olvidé mi contraseña”.'});return}
  const {error}=await SB.client.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname});mostrarLogin(error?{t:error.message}:{ok:1,t:'Te enviamos un correo para cambiar la contraseña.'})};
 document.getElementById('login-form').onsubmit=async ev=>{ev.preventDefault();const em=document.getElementById('lg-email').value.trim(),pw=document.getElementById('lg-pass').value;
  if(S.loginModo==='registro'){const nombre=document.getElementById('lg-nombre').value.trim();const {data,error}=await SB.client.auth.signUp({email:em,password:pw,options:{data:{nombre}}});
   if(error){mostrarLogin({t:error.message});return}if(!data.session){S.loginModo='ingreso';mostrarLogin({ok:1,t:'Cuenta creada. Revisa tu correo para confirmarla y luego ingresa.'});return}}
  else{const {error}=await SB.client.auth.signInWithPassword({email:em,password:pw});if(error){mostrarLogin({t:error.message==='Invalid login credentials'?'Correo o contraseña incorrectos.':error.message});return}}
  location.reload()}}
async function salir(){await SB.client.auth.signOut();location.reload()}
