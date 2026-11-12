/* Partida Doble · Boletas de honorarios recibidas, retención y DJ 1879. */
/* ---- Honorarios ---- */
const TASA_HON={2023:13.75,2024:13.75,2025:14.5,2026:15.25,2027:16};const tasaHon=y=>TASA_HON[y]??(y>=2028?17:13);
const honDe=()=>Object.entries(S.rcv).flatMap(([ym,v])=>((v&&v.honorarios)||[]).map(h=>({...h,_ym:ym})));
function asientoHon(h,numero){const k=claves();const L=[{cuenta:h.cuenta||k.honGasto,debe:h.bruto,haber:0}];if(h.retenida!==false&&h.ret)L.push({cuenta:k.honRet,debe:0,haber:h.ret});
 L.push({cuenta:k.honPagar,debe:0,haber:h.bruto-(h.retenida!==false?h.ret:0),...(h.rut?{rut:h.rut,ref:String(h.numero)}:{})});
 return{id:h.asientoId||uid(),numero,fecha:h.fecha,tipo:'Traspaso',glosa:`Boleta honorarios N°${h.numero} ${h.nombre||''}`.trim(),lineas:L,origen:{kind:'honorarios',hid:h.id}}}
async function guardarHon(h,oldYm){chkBloq(h.fecha,oldYm);const y=h.fecha.slice(0,7);const prev=honDe().find(x=>x.id===h.id);
 const prevA=h.asientoId?asientos().find(a=>a.id===h.asientoId):null;const numero=prevA&&prevA.fecha.slice(0,4)===h.fecha.slice(0,4)?prevA.numero:nextNum(h.fecha.slice(0,4));
 const a=asientoHon(h,numero);h.asientoId=a.id;Object.assign(h,sello(prev));
 if(oldYm&&oldYm!==y){const o=clone(S.rcv[oldYm]||{});o.honorarios=(o.honorarios||[]).filter(x=>x.id!==h.id);await putE(`rcv/${oldYm}`,o)}
 const n=clone(S.rcv[y]||{compras:[],ventas:[]});n.honorarios=(n.honorarios||[]).filter(x=>x.id!==h.id);n.honorarios.push(h);await putE(`rcv/${y}`,n);await guardarAsiento(a,prevA?prevA.fecha.slice(0,7):null)}
async function borrarHon(id){const h=honDe().find(x=>x.id===id);if(!h)return;chkBloq(h.fecha);await audit('eliminar','Boleta de honorarios',`N°${h.numero} ${h.nombre}`,`${fd(h.fecha)} · bruto ${fmt(h.bruto)} · retención ${fmt(h.ret)}`,null);const o=clone(S.rcv[h._ym]);o.honorarios=o.honorarios.filter(x=>x.id!==id);await putE(`rcv/${h._ym}`,o);if(h.asientoId)await borrarAsiento(h.asientoId)}
function dj1879(anio){const by={};for(const h of honDe()){if(!h.fecha.startsWith(anio+'-')||h.retenida===false)continue;const r=h.rut||'SINRUT';const g=by[r]||(by[r]={rut:r,nombre:h.nombre||'',bruto:0,ret:0,mes:Array(12).fill(0)});g.bruto+=h.bruto;g.ret+=h.ret;g.mes[+h.fecha.slice(5,7)-1]+=h.ret;if(h.nombre)g.nombre=h.nombre}return Object.values(by).sort((a,b)=>b.bruto-a.bruto)}

