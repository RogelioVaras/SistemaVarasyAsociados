/* Partida Doble · Persistencia: guardado en el navegador o en la nube, historial de cambios y suscripción a los datos de la empresa. */
/* ============ Persistencia ============ */
const queues={};
function localApply(path,data){const s=path.split('/');
 if(s[0]==='config'){if(s[1]==='indicadores')S.ind=data?clone(data):{utm:{}};inval();return}
 if(s.length===2){const i=S.emps.findIndex(e=>e.id===s[1]);if(data===null){if(i>=0)S.emps.splice(i,1)}else{const o={id:s[1],...clone(data)};if(i>=0)S.emps[i]=o;else S.emps.push(o)}}
 else if(s.length===4&&s[1]===S.empId){const k=s[2];const m={...S[k]};if(data===null)delete m[s[3]];else m[s[3]]=clone(data);S[k]=m}
 inval()}
function enqueue(path,fn){const p=(queues[path]||Promise.resolve()).catch(()=>{}).then(fn);queues[path]=p;return p}
const STANDALONE=true;
const LS_KEY='pd.store.v1';let LS=null;
function lsAvail(){try{localStorage.setItem('pd.t','1');localStorage.removeItem('pd.t');return true}catch(e){return false}}
function lsLoad(){if(LS)return LS;try{LS=JSON.parse(localStorage.getItem(LS_KEY)||'{}')||{}}catch(e){LS={}}return LS}
function lsPut(path,data){const st=lsLoad();if(data===null)delete st[path];else st[path]=clone(data);try{localStorage.setItem(LS_KEY,JSON.stringify(st))}catch(e){toast('El navegador se quedó sin espacio. Descarga un respaldo y elimina empresas que ya no uses.','err')}}
const lsDocs=prefix=>{const st=lsLoad();return Object.keys(st).filter(p=>p.startsWith(prefix)&&!p.slice(prefix.length).includes('/')).map(p=>[p.slice(prefix.length),st[p]])};
const canDl=()=>!!S.dl||STANDALONE;
async function saveFile(name,data){if(S.dl){try{await S.dl.save({filename:name,data})}catch(e){if(e&&e.code!=='declined')toast('No se pudo generar la descarga.','err')}return}
 if(!STANDALONE){toast('La descarga no está disponible en esta vista.','err');return}
 const ext=name.split('.').pop();const blob=new Blob([data],{type:ext==='json'?'application/json':ext==='pdf'?'application/pdf':'text/csv;charset=utf-8'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},500)}
function writeErr(e){if(e&&e.code==='invalid_argument'){S.ro=true;toast('La base rechazó el cambio: quedaste en solo lectura.','err');
 // El rechazo puede venir del rol o de un acceso mal configurado: se vuelve a preguntar a la base
 // para que el aviso de la pantalla diga la razón real.
 if(S.backend==='supabase'&&S.empId)cargarRoles().then(()=>{aplicarRol(S.empId);if(S.rol!=='lector')S.ro=true;render()}).catch(()=>{})}
 else toast(errMsg(e),'err')}
async function put(path,data){if(S.ro){toast('Tienes acceso de solo lectura.','err');throw new Error('ro')}localApply(path,data);if(!S.db){if(S.local)lsPut(path,data);return}try{await enqueue(path,()=>S.db.doc(path).set(data))}catch(e){writeErr(e);throw e}}
async function del(path){if(S.ro){toast('Tienes acceso de solo lectura.','err');throw new Error('ro')}localApply(path,null);if(!S.db){if(S.local)lsPut(path,null);return}try{await enqueue(path,()=>S.db.doc(path).delete())}catch(e){writeErr(e);throw e}}
const ep=rel=>`empresas/${S.empId}/${rel}`;
const putE=(rel,data)=>put(ep(rel),data);
const AUD_K={plan:'Plan de cuentas',claves:'Cuentas automáticas',reglas:'Reglas de clasificación',cerradoHasta:'Cierre de períodos',plantillas:'Plantillas de asientos',tasaPPM:'Tasa PPM',tareas:'Calendario'};
async function saveEmp(patch){const e=clone(emp());if(!e)return;const prev=clone(e);delete e.id;Object.assign(e,patch);await put(`empresas/${S.empId}`,e);
 for(const k of Object.keys(patch)){if(JSON.stringify(prev[k])===JSON.stringify(patch[k]))continue;const simple=v=>v==null||typeof v!=='object'?String(v??'—'):'';await audit('modificar','Empresa',AUD_K[k]||k,simple(prev[k]),simple(patch[k]))}}
const sumA=a=>a?`${fd(a.fecha)} · ${a.glosa} · ${fmt(sum(a.lineas||[],l=>l.debe))} · `+(a.lineas||[]).map(l=>`${l.cuenta} ${l.debe?'D':'H'} ${fmt(l.debe||l.haber)}`).join('; '):'';
const sumD=d=>d?`${CORTO[d.tipo]||d.tipo} ${d.folio} · ${fd(d.fecha)} · ${d.razon||rutFmt(d.rut)} · total ${fmt(d.total)} · cuenta ${d.cuenta}`:'';
async function audit(accion,tipo,ref,antes,despues){if(!S.empId||S.ro)return;try{const ym=hoy().slice(0,7);const e={t:new Date().toISOString(),...(S.uid?{u:S.uid}:{}),accion,tipo,ref:String(ref||'').slice(0,200),...(antes?{antes:String(antes).slice(0,600)}:{}),...(despues?{despues:String(despues).slice(0,600)}:{})};
 const key=parteLibre(k=>S.audit[k],Object.keys(S.audit),ym,bytes(e));const n=clone(S.audit[key]||{log:[]});n.log=n.log||[];n.log.push(e);await putE(`audit/${key}`,n)}catch(err){}}

let unsubs=[];
const KINDS=['diario','rcv','banco','renta','remu','audit'];
function subEmpresa(){unsubs.forEach(u=>{try{u()}catch(e){}});unsubs=[];KINDS.forEach(k=>S[k]={});inval();S.ed=null;S.sel={mov:null,lin:null};S.ccRut=null;S.f={};aplicarRol(S.empId);
 if(!S.empId){render();return}
 if(!S.db){KINDS.forEach(k=>{S[k]=S.local?Object.fromEntries(lsDocs(`empresas/${S.empId}/${k}/`)):{};S.loaded[k]=true});inval();render();return}
 KINDS.forEach(k=>S.loaded[k]=false);const id=S.empId;
 for(const k of KINDS){unsubs.push(S.db.collection(`empresas/${id}/${k}`).onSnapshot(snap=>{if(S.empId!==id)return;const m={};snap.docs.forEach(d=>{m[d.id]=d.data()});S[k]=m;S.loaded[k]=true;inval();render()},err=>{toast('Se perdió la conexión con los datos. Recarga la página.','err')}))}
 render()}
function selectEmp(id){S.empId=id;lsSet('pd.emp',id||'');subEmpresa()}

