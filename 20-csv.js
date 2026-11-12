/* Partida Doble · Descarga de archivos CSV. */
/* ============ CSV / descargas ============ */
async function bajarCSV(nombre,rows){
 const txt='﻿'+rows.map(r=>r.map(c=>{c=c==null?'':String(c);return /[;"\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(';')).join('\r\n');
 await saveFile(nombre,txt)}
const nomArchivo=base=>`${base}_${rutClean((emp()||{}).rut)||'empresa'}_${S.mes?S.anio+'-'+pad(S.mes):S.anio}.csv`;
const PDFS=new Set(['diario','mayor','compras','ventas','balance','eeff','f29','remu']);const NOCSV=new Set(['eeff']);
const csvBtn=what=>canDl()?`${NOCSV.has(what)?'':`<button class="btn sm" data-act="csv" data-what="${what}">CSV</button>`}${PDFS.has(what)?`<button class="btn sm" data-act="pdf" data-what="${what}">PDF</button>`:''}`:'';const expBtns=csvBtn;

