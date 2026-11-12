/* Partida Doble · Arranque: elige dónde se guardan los datos.
   - Si js/config.js tiene los datos de Supabase: pide iniciar sesión y trabaja en la nube.
   - Si no: modo navegador (los datos quedan en este navegador; usa respaldos). */
function conectarNube(db){S.mode='nube';
 db.doc('config/indicadores').onSnapshot(d=>{S.ind=d.exists?d.data():{utm:{}};render()},()=>{});
 db.collection('empresas').onSnapshot(snap=>{S.emps=snap.docs.map(d=>({id:d.id,...d.data()}));const first=!S.loaded.emps;S.loaded.emps=true;inval();
  if(first){if(!S.emps.find(e=>e.id===S.empId))S.empId=S.emps[0]?S.emps[0].id:null;subEmpresa();return}
  if(S.empId&&!S.emps.find(e=>e.id===S.empId)){selectEmp(null);return}render()},
  err=>{toast('No se pudo conectar con la base de datos. Revisa tu conexión y recarga.','err')})}

function modoNavegador(){S.backend='local';S.mode='local';S.local=lsAvail();
 if(S.local){S.emps=lsDocs('empresas/').map(([id,d])=>({id,...d}));const ind=lsLoad()['config/indicadores'];if(ind)S.ind=ind}
 S.loaded.emps=true;if(S.empId&&!S.emps.find(e=>e.id===S.empId))S.empId=null;subEmpresa()}

route();
(async()=>{
 if(!sbConfigurado()){modoNavegador();return}
 try{const ses=await iniciarSupabase();if(!ses){mostrarLogin();return}
  S.backend='supabase';S.uid=ses.user.id;S.email=ses.user.email;S.db=crearDbSupabase(SB.client,S.uid);S.user=crearUserSupabase(SB.client,S.uid);
  await cargarRoles();conectarNube(S.db)}
 catch(e){console.error(e);toast('No se pudo conectar con Supabase. Se abrirá en modo navegador.','err');modoNavegador()}
})();
