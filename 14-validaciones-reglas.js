/* Partida Doble · Validaciones de documentos y reglas de clasificación por proveedor o cliente. */
/* ---- Validaciones ---- */
function nombresPorRut(kind){const m={};for(const d of docsDe(kind)){if(!d.rut||!d.razon)continue;const n=norm(d.razon).replace(/[^a-z0-9]/g,'');(m[d.rut]=m[d.rut]||new Set()).add(n)}return m}
function obsDoc(d,kind,nm,R){const o=[];const t=+d.tipo;const iva=(+d.iva||0)+(+d.ivaUC||0),neto=+d.neto||0;
 if(d.rut&&!rutOk(d.rut))o.push('RUT inválido');
 if([33,56,61,46,914].includes(t)&&neto&&Math.abs(iva-Math.round(neto*0.19))>2&&!(d.ivaAF||d.netoAF))o.push(`IVA no es 19% del neto (esperado ${fmt(Math.round(neto*0.19))})`);
 if([33,56,61,46,914].includes(t)&&!neto&&!iva&&!(+d.exento))o.push('Sin montos');
 const comp=(+d.exento||0)+neto+iva+(+d.ivaNoRec||0);if(kind==='compras'&&Math.abs(comp-(+d.total||0))>2)o.push(`Total no calza con sus componentes (dif. ${fmt((+d.total||0)-comp)}): posibles otros impuestos`);
 if(kind==='ventas'&&Math.abs(comp-(+d.total||0))>2)o.push(`Total no calza (dif. ${fmt((+d.total||0)-comp)})`);
 if(nm&&d.rut&&nm[d.rut]&&nm[d.rut].size>1)o.push('El mismo RUT tiene otra razón social en otros documentos');
 if(R&&S.mes&&!enRango(d.fecha,R))o.push('Fecha fuera del período');
 if([34,41].includes(t)&&iva)o.push('Documento exento con IVA');
 return o}

/* ---- Reglas de clasificación ---- */
function reglaDe(kind,rut){const g=(((emp()||{}).reglas)||{})[kind]||{};const c=g[rutClean(rut)];return c&&cm()[c]?c:null}
async function guardarRegla(kind,rut,cuenta){const r=clone((emp()||{}).reglas||{});r[kind]=r[kind]||{};if(cuenta)r[kind][rutClean(rut)]=cuenta;else delete r[kind][rutClean(rut)];await saveEmp({reglas:r})}


/* ---- Identificación de un RUT con lo que ya sabemos ----
   Busca el nombre y los datos de un RUT en lo que la app ya tiene: tus empresas, los documentos
   del registro de compras y ventas y las boletas de honorarios. No consulta al SII: ese dato no
   está disponible por una vía pública y gratuita. Si algún día configuras un servicio de consulta
   en js/config.js (rutApi), se usa como último recurso. */
function fichaPorRut(rut){const c=rutClean(rut);if(c.length<2)return null;
 const e=S.emps.find(x=>rutClean(x.rut)===c);
 if(e)return{razon:e.razon||'',giro:e.giro||'',direccion:e.direccion||'',comuna:e.comuna||'',desde:'tus empresas'};
 const nm=nombresRut();if(nm[c])return{razon:nm[c],desde:'el registro de compras y ventas'};
 const h=honDe().find(x=>rutClean(x.rut)===c&&x.nombre);
 if(h)return{razon:h.nombre,desde:'las boletas de honorarios'};
 return null}
async function rutRemoto(rut){const u=(window.PD_CONFIG||{}).rutApi;if(!u)return null;
 try{const r=await fetch(String(u).replace('{rut}',encodeURIComponent(rutClean(rut))));if(!r.ok)return null;const j=await r.json();
  const razon=j.razon||j.nombre||j.razonSocial||'';if(!razon)return null;
  return{razon,giro:j.giro||j.actividad||'',direccion:j.direccion||'',comuna:j.comuna||'',desde:'la consulta en línea'}}catch(e){return null}}
