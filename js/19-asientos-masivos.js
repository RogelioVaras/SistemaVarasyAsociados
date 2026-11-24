/* Partida Doble · Registro masivo de asientos: interpreta un listado pegado desde Excel (o un CSV)
   y arma los asientos completos. Una fila por cuenta; las filas con la misma fecha y glosa
   (o el mismo número de asiento, si la columna existe) forman un solo asiento. */

/* ---- Ayuda que se muestra en pantalla ---- */
const MAS_AYUDA='Columnas separadas por punto y coma (también sirve tabulación, coma o barra vertical): '
 +'<b>Fecha; Glosa; Cuenta; Debe; Haber</b> y, si hace falta, RUT; Documento; Detalle; Asiento. '
 +'La cuenta puede ir como código (1101002) o como “código nombre”. '
 +'La fecha se lee como en Excel: 05-10-2026, 05/10/2026 o 2026-10-05. '
 +'Una fila en blanco (o una línea que empiece con #) separa dos asientos que tengan la misma fecha y glosa; '
 +'si traes una columna Asiento, se agrupa por ella. '
 +'Los asientos cuadrados se guardan con numeración correlativa por año, según su fecha. No se puede cargar en períodos cerrados.';

const MAS_EJEMPLO=['Fecha;Glosa;Cuenta;Debe;Haber;RUT;Documento;Detalle',
 '05-10-2026;Pago arriendo oficina octubre;5201004 Arriendos;350000;;;;',
 '05-10-2026;Pago arriendo oficina octubre;1101002 Banco cuenta corriente;;350000;;;',
 '07-10-2026;Venta factura 120 Comercial Andes;1102001 Clientes;595000;;12345678-5;120;',
 '07-10-2026;Venta factura 120 Comercial Andes;4101001 Ventas;;500000;;;',
 '07-10-2026;Venta factura 120 Comercial Andes;2102001 IVA débito fiscal;;95000;;;',
 '09-10-2026;Compra insumos factura 4471;5101002 Compras de mercaderías e insumos;100000;;;;',
 '09-10-2026;Compra insumos factura 4471;1104001 IVA crédito fiscal;19000;;;;',
 '09-10-2026;Compra insumos factura 4471;2101001 Proveedores;;119000;;;'].join('\n');

/* ---- Lectura del listado ---- */
const MAS_COL={fecha:['fecha'],glosa:['glosa','descripcion','concepto','detalleasiento'],cuenta:['cuenta','codigo','cta'],
 debe:['debe','cargo','debito'],haber:['haber','abono','credito'],rut:['rut'],
 ref:['doc','folio','ref','referencia'],detalle:['detalle','comentario'],grupo:['asiento','grupo','partida','nasiento','nroasiento','idasiento','numeroasiento']};
const MAS_ORDEN=['fecha','glosa','cuenta','debe','haber','rut','ref','detalle','grupo'];

/* Separa una línea respetando las comillas (para glosas con punto y coma). */
function masSplit(l,d){const out=[];let cur='',q=false;
 for(const ch of l){if(ch==='"'){q=!q;continue}if(ch===d&&!q){out.push(cur);cur='';continue}cur+=ch}
 out.push(cur);return out.map(x=>x.trim())}

/* Elige el separador mirando las primeras líneas del listado. */
function masDelim(lineas){const cands=[';','\t','|',','];let mejor=';',max=0;
 for(const c of cands){let n=0;for(const l of lineas.slice(0,5))n+=l.split(c).length-1;if(n>max){max=n;mejor=c}}
 return max?mejor:';'}

/* Ubica cada columna del encabezado en su posición. */
function masIndice(h){const ix={};MAS_ORDEN.forEach(k=>ix[k]=-1);
 const campo=t=>{const n=norm(t).replace(/[^a-z0-9]/g,'');if(!n)return null;
  for(const [k,al] of Object.entries(MAS_COL))if(al.some(a=>n===a||n.startsWith(a)))return k;return null};
 h.forEach((t,i)=>{const k=campo(t);if(k&&ix[k]<0)ix[k]=i});return ix}

/* Devuelve el código de cuenta que corresponde a lo escrito (código, nombre o “código nombre”). */
function resolverCuenta(txt){const s=String(txt||'').trim();if(!s)return'';
 const code=s.split(/[\s]+/)[0].replace(/[^\d]/g,'');
 if(/^\d{3,10}$/.test(code)&&cm()[code])return code;
 const n=norm(s);const P=plan();
 let hit=P.find(c=>norm(c.nombre)===n);if(hit)return hit.codigo;
 const inc=P.filter(c=>{const cn=norm(c.nombre);return cn.includes(n)||n.includes(cn)||cn.startsWith(n)});
 return inc.length===1?inc[0].codigo:''}

/* Interpreta el texto completo. Devuelve {asientos, errores, filas}. */
function parseAsientosMasivos(txt){
 const crudo=String(txt??'').replace(/^\uFEFF/,'').split(/\r?\n/);
 const out=[],errores=[];
 const util=crudo.map(l=>l.trim()).filter(l=>l&&!l.startsWith('#'));
 const delim=masDelim(util);
 let ix=null,encabezado=false;
 if(util.length){const c0=masSplit(util[0],delim);const i0=masIndice(c0);
  if(c0.length>2&&i0.fecha>=0&&i0.cuenta>=0&&i0.debe>=0&&!parseFecha(c0[i0.fecha])){ix=i0;encabezado=true}}
 if(!ix){ix={};MAS_ORDEN.forEach((k,i)=>ix[k]=i)}
 let bloque=null,leidas=0;
 const cerrar=()=>{const b=bloque;bloque=null;if(!b)return;
  const desde=b._filas[0],hasta=b._filas[b._filas.length-1];const donde=desde===hasta?`Fila ${desde}`:`Filas ${desde}–${hasta}`;
  if(!b._glosa)errores.push(`${donde}: el asiento no tiene glosa.`);
  if(b.lineas.length<2)errores.push(`${donde}: el asiento necesita al menos dos líneas.`);
  const D=sum(b.lineas,l=>l.debe),H=sum(b.lineas,l=>l.haber);
  if(D!==H)errores.push(`${donde}: el asiento «${b._glosa||'sin glosa'}» del ${fd(b.fecha)} no cuadra (debe ${fmt(D)} y haber ${fmt(H)}).`);
  if(bloq(b.fecha))errores.push(`${donde}: el asiento «${b._glosa||'sin glosa'}» del ${fd(b.fecha)} cae en un período cerrado.`);
  b.totalD=D;b.totalH=H;b.glosa=b._glosa;b.desde=desde;b.hasta=hasta;delete b._glosa;delete b._k;delete b._filas;out.push(b)};
 crudo.forEach((linea,i)=>{
  const l=linea.trim();
  if(!l||l.startsWith('#')||l.startsWith('//')){cerrar();return}
  if(encabezado&&!leidas){leidas++;return}
  leidas++;const n=i+1;const c=masSplit(l,delim);
  const val=k=>{const j=ix[k];return j>=0&&j<c.length?c[j]:''};
  const txtCta=String(val('cuenta')||'').trim();
  if(!txtCta){errores.push(`Fila ${n}: falta la cuenta.`);return}
  const cta=resolverCuenta(txtCta);
  if(!cta){errores.push(`Fila ${n}: la cuenta «${txtCta}» no está en el plan de cuentas.`);return}
  const debe=Math.round(pn(val('debe'))),haber=Math.round(pn(val('haber')));
  if(debe&&haber){errores.push(`Fila ${n}: tiene monto en el debe y en el haber a la vez.`);return}
  if(!debe&&!haber){errores.push(`Fila ${n}: no tiene monto en el debe ni en el haber.`);return}
  if(debe<0||haber<0){errores.push(`Fila ${n}: los montos deben ser positivos.`);return}
  const rutRaw=String(val('rut')||'').trim();
  let rut='';if(rutRaw){if(!rutOk(rutRaw)){errores.push(`Fila ${n}: el RUT «${rutRaw}» no es válido.`);return}if(esAux(cta))rut=rutClean(rutRaw)}
  const doc=String(val('ref')||'').trim();
  const det=String(val('detalle')||'').trim();
  const f=parseFecha(val('fecha'));
  if(String(val('fecha')||'').trim()&&!f){errores.push(`Fila ${n}: la fecha «${val('fecha')}» no se entiende.`);return}
  const g=String(val('glosa')||'').trim();
  const grupo=String(val('grupo')||'').trim();
  const fecha=f||(bloque?bloque.fecha:null);
  if(!fecha){errores.push(`Fila ${n}: falta la fecha del asiento.`);return}
  const glosa=g||(bloque?bloque._glosa:'');
  const clave=grupo?'g:'+grupo:`${fecha}|${norm(glosa)}`;
  if(!bloque||bloque._k!==clave){cerrar();bloque={_k:clave,_filas:[],fecha,_glosa:glosa,tipo:'Traspaso',lineas:[]}}
  bloque._filas.push(n);
  bloque.lineas.push({cuenta:cta,debe,haber,...(det?{glosa:det}:{}),...(rut?{rut,...(doc?{ref:doc}:{})}:{})})});
 cerrar();
 return{asientos:out,errores,filas:Math.max(0,leidas-(encabezado?1:0))}}

/* ---- Guardado: un solo envío por mes, numeración correlativa por año ---- */
async function guardarAsientosMasivos(lista){
 const as=Array.isArray(lista)?lista:[];if(!as.length)return[];
 for(const a of as){const L=a.lineas||[];const D=sum(L,l=>+l.debe||0),H=sum(L,l=>+l.haber||0);
  if(L.length<2||!a.fecha||D!==H){toast('Hay un asiento incompleto o descuadrado: no se guardó ninguno.','err');throw new Error('masivo')}}
 chkBloq(...as.map(a=>a.fecha));
 const diaM={};const getD=y=>diaM[y]||(diaM[y]=clone(S.diario[y]||{asientos:[]}));
 const nums={};const nn=y=>{if(!(y in nums))nums[y]=nextNum(y);return nums[y]++};
 const orden=as.map((a,i)=>({a,i})).sort((x,y)=>x.a.fecha<y.a.fecha?-1:x.a.fecha>y.a.fecha?1:x.i-y.i).map(x=>x.a);
 const hechos=[];
 for(const a of orden){const y=a.fecha.slice(0,4);
  const asiento={id:uid(),numero:nn(y),fecha:a.fecha,tipo:a.tipo||'Traspaso',glosa:String(a.glosa||'').trim(),
   lineas:(a.lineas||[]).map(l=>({cuenta:l.cuenta,debe:+l.debe||0,haber:+l.haber||0,...(l.glosa?{glosa:l.glosa}:{}),...(l.rut?{rut:l.rut}:{}),...(l.ref?{ref:l.ref}:{})}))};
  Object.assign(asiento,sello(null));
  const ym=a.fecha.slice(0,7);
  const tgt=parteLibre(k=>diaM[k]||S.diario[k],[...Object.keys(S.diario),...Object.keys(diaM)],ym,bytes(asiento));
  const d=getD(tgt);d.asientos=(d.asientos||[]).filter(x=>x.id!==asiento.id);d.asientos.push(asiento);hechos.push(asiento)}
 for(const [y,v] of Object.entries(diaM))await putE(`diario/${y}`,v);
 await audit('crear','Asiento',`Carga masiva de ${hechos.length} asientos`,null,hechos.slice(0,5).map(sumA).join(' | ')+(hechos.length>5?' …':''));
 return hechos}

/* ---- Vista previa (solo el HTML del bloque de resultado) ---- */
function masPreviewHTML(){
 const txt=String(S.imp.diario||'');
 if(!txt.trim())return `<div class="note">${MAS_AYUDA}</div>`;
 const r=parseAsientosMasivos(txt);
 if(!r.asientos.length)return `<div class="note bad">No pude leer ningún asiento. Revisa el formato: ${MAS_AYUDA}</div>`;
 const D=sum(r.asientos,a=>a.totalD),H=sum(r.asientos,a=>a.totalH),NL=sum(r.asientos,a=>a.lineas.length);
 const filas=r.asientos.slice(0,80);
 return `${r.errores.length?`<div class="note bad" style="margin-bottom:8px"><b>${r.errores.length} problema(s) que impiden importar</b><ul style="margin:6px 0 0 18px;font-family:var(--f-num);font-size:12.5px">${r.errores.slice(0,12).map(e=>`<li>${esc(e)}</li>`).join('')}${r.errores.length>12?`<li>y ${r.errores.length-12} más…</li>`:''}</ul></div>`:''}
 <div class="row" style="gap:8px;margin-bottom:8px;flex-wrap:wrap"><span class="pill ${r.errores.length?'bad':'ok'}">${r.asientos.length} asiento(s)</span><span class="pill">${NL} líneas</span><span class="pill" title="Suma del debe de todos los asientos">Debe ${fmt(D)}</span><span class="pill" title="Suma del haber de todos los asientos">Haber ${fmt(H)}</span><span class="pill ${Math.round(D)===Math.round(H)?'ok':'bad'}">${Math.round(D)===Math.round(H)?'Total general cuadra':'Total general no cuadra'}</span></div>
 <div class="scroll" style="max-height:300px"><table><thead><tr><th>#</th><th>Fecha</th><th>Glosa</th><th class="n">Líneas</th><th class="n">Debe</th><th class="n">Haber</th><th>Estado</th></tr></thead><tbody>
 ${filas.map((a,i)=>`<tr><td class="c">${i+1}</td><td class="c">${fd(a.fecha)}</td><td>${esc(a.glosa)}${a.lineas.some(l=>l.rut)?' <span class="pill acc">con RUT</span>':''}</td><td class="n">${a.lineas.length}</td><td class="n">${fz(a.totalD)}</td><td class="n">${fz(a.totalH)}</td><td>${a.totalD===a.totalH&&!bloq(a.fecha)?'<span class="pill ok">Listo</span>':'<span class="pill bad">Revisar</span>'}</td></tr>`).join('')}
 ${r.asientos.length>80?`<tr><td colspan="7" class="muted">… y ${r.asientos.length-80} asientos más (no se muestran, se importan igual).</td></tr>`:''}
 </tbody></table></div>`}

/* Redibuja la vista previa y ajusta el botón de importar mientras se escribe o pega. */
function masPintar(){const el=document.getElementById('mas-prev');if(!el)return;
 el.innerHTML=masPreviewHTML();
 const b=document.getElementById('mas-btn');
 if(b){const r=parseAsientosMasivos(S.imp.diario);b.textContent=r.asientos.length?`Importar ${r.asientos.length} asiento(s)`:'Importar asientos';b.disabled=!!r.errores.length||!r.asientos.length}}
