/* Partida Doble · Respaldo y restauración de empresas en archivos JSON. */
async function respaldo(id){const e=S.emps.find(x=>x.id===id);if(!e)return;
 const out={formato:'partida-doble',version:1,fecha:hoy(),empresa:clone(e),indicadores:clone(S.ind||{})};delete out.empresa.id;
 for(const k of KINDS){out[k]={};if(id===S.empId)out[k]=clone(S[k]);else if(!S.db){if(S.local)out[k]=Object.fromEntries(lsDocs(`empresas/${id}/${k}/`))}else{try{const s=await S.db.collection(`empresas/${id}/${k}`).get();s.docs.forEach(d=>out[k][d.id]=d.data())}catch(err){toast('No se pudo leer la empresa para el respaldo.','err');return}}}
 await saveFile(`respaldo_${rutClean(e.rut)}_${hoy()}.json`,JSON.stringify(out))}
async function restaurar(txt){if(S.backend!=='supabase'&&!soloDueno())return;let o;try{o=JSON.parse(txt)}catch(err){o=null}
 if(!o||o.formato!=='partida-doble'||!o.empresa){toast('El archivo no es un respaldo de Partida Doble.','err');return}
 if(S.emps.some(e=>rutClean(e.rut)===rutClean(o.empresa.rut))){toast('Ya existe una empresa con ese RUT. Elimínala o cambia su RUT antes de restaurar.','err');return}
 const id=uid();const emp0=clone(o.empresa);delete emp0.id;await put(`empresas/${id}`,emp0);selectEmp(id);
 if(o.indicadores){const cur=clone(S.ind||{});let ch=false;for(const k of ['utm','uf']){cur[k]=cur[k]||{};for(const [m,v] of Object.entries(o.indicadores[k]||{}))if(!cur[k][m]){cur[k][m]=v;ch=true}}if(!cur.prev&&o.indicadores.prev){cur.prev=o.indicadores.prev;ch=true}if(ch)await put('config/indicadores',cur)}
 for(const k of KINDS)for(const [doc,data] of Object.entries(o[k]||{}))await put(`empresas/${id}/${k}/${doc}`,data);
 toast(`Empresa ${o.empresa.razon} restaurada`);location.hash='resumen'}

