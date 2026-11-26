/* Partida Doble · Envío de liquidaciones por correo.
   La app no manda correos por sí sola: llama a la función "enviar-liquidaciones" de Supabase,
   que guarda la clave del proveedor (Brevo) como secreto y comprueba el rol del usuario. Aquí se
   arma el PDF, se convierte a base64 y se guarda el registro del envío junto a las liquidaciones. */
const emailOk=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v||'').trim());
const correoListo=()=>!!(typeof SB!=='undefined'&&SB.client&&SB.session&&S.backend==='supabase');
const mesLargo=ym=>`${MESES[+ym.slice(5,7)-1]} ${ym.slice(0,4)}`;
const enviosDe=ym=>((S.remu[ym]||{}).envios)||{};
/* base64 del PDF en trozos: pasar todo de una vez revienta el límite de argumentos. */
function bytesB64(u8){let s='';const paso=0x8000;for(let i=0;i<u8.length;i+=paso)s+=String.fromCharCode.apply(null,u8.subarray(i,i+paso));return btoa(s)}
/* Deja constancia del envío (o del intento fallido) en el documento del mes. */
async function marcarEnvio(ym,tid,dato){const doc=clone(S.remu[ym]||{liqs:[]});doc.envios={...(doc.envios||{})};if(dato)doc.envios[tid]=dato;else delete doc.envios[tid];await putE(`remu/${ym}`,doc)}
const ERROR_CORREO={'401':'Tu sesión venció: vuelve a entrar a la app.','403':'Solo el dueño o un editor de la empresa puede enviar liquidaciones.','404':'Falta publicar la función de correo en Supabase.','429':'Se alcanzó el límite de correos del día. Vuelve a intentarlo mañana.','SIN_CLAVE':'Falta configurar la clave del correo en Supabase.'};
/* Envía una liquidación. "para" es el correo de destino (o el propio, cuando es una prueba). */
async function enviarLiqUno(ym,l,para){
 const r=repLiq(ym,l.tid);if(!r)throw new Error('No encontré la liquidación.');
 if(!correoListo())throw new Error('Necesitas iniciar sesión en la nube para enviar correos.');
 if(!emailOk(para))throw new Error('El correo de destino no es válido.');
 const body={empresaId:S.empId,empresa:(emp()||{}).razon||'',periodo:mesLargo(ym),
  liquidaciones:[{nombre:l.nombre||'',rut:rutClean(l.rut),email:String(para).trim().toLowerCase(),filename:r.nombre,pdf:bytesB64(pdfReport(r.rep))}]};
 let res;try{res=await SB.client.functions.invoke('enviar-liquidaciones',{body})}catch(e){throw new Error('No se pudo contactar el servicio de correo. Revisa la conexión.')}
 const {data,error}=res||{};
 if(error){const st=String((error.context&&error.context.status)||'');throw new Error(ERROR_CORREO[st]||error.message||'El servicio de correo rechazó el envío.')}
 if(!data)throw new Error('El servicio de correo no respondió.');
 if(!data.ok)throw new Error(ERROR_CORREO[data.error]||data.error||'No se pudo enviar la liquidación.');
 return data;
}
/* Envía varias liquidaciones una por una y deja el registro de cada intento.
   "paraDe" devuelve el correo de destino de cada liquidación. */
async function enviarLote(ym,liqs,paraDe){
 let ok=0;const fallos=[];
 for(const l of liqs){
  const para=String(paraDe(l)||'').trim().toLowerCase();
  if(!emailOk(para)){fallos.push(`${l.nombre||'Trabajador'}: sin correo`);continue}
  try{await enviarLiqUno(ym,l,para);await marcarEnvio(ym,l.tid,{t:new Date().toISOString(),email:para,ok:true});ok++;
   await audit('crear','Envío de liquidación',`${l.nombre||''} · ${mesLargo(ym)}`,null,`a ${para}`)}
  catch(e){await marcarEnvio(ym,l.tid,{t:new Date().toISOString(),email:para,ok:false,error:e.message});fallos.push(`${l.nombre||'Trabajador'}: ${e.message}`)}
 }
 return {ok,fallos};
}
