/* Partida Doble · Autoría de registros: quién creó y modificó cada documento. */
/* ============ Autoría ============ */
const NEED=new Set();
const quien=id=>{if(!id)return'';NEED.add(id);return S.names[id]||(id===S.uid?'Tú':'Otro usuario')};
function sello(prev){const now=new Date().toISOString();const o={};const cp=prev&&prev.creadoPor!==undefined?prev.creadoPor:S.uid;const cr=prev&&prev.creado?prev.creado:now;
 if(cp)o.creadoPor=cp;o.creado=cr;if(S.uid)o.modPor=S.uid;o.mod=now;return o}
function autorTxt(x){if(!x||!x.creado)return'';const c=x.creadoPor?quien(x.creadoPor):'';let t=c?`Registró ${esc(c)} el ${fd(x.creado.slice(0,10))}`:`Registrado el ${fd(x.creado.slice(0,10))}`;
 if(x.mod&&(x.mod.slice(0,16)!==x.creado.slice(0,16)))t+=` · modificó ${x.modPor?esc(quien(x.modPor)):'—'} el ${fd(x.mod.slice(0,10))}`;return t}
async function resolverNombres(){if(!S.user||!NEED.size)return;const ids=[...NEED];try{const ps=await S.user.profiles(ids);let ch=false;for(const id of ids){const n=(ps[id]&&ps[id].name)||'';if(n&&S.names[id]!==n){S.names[id]=n;ch=true}}if(ch)render()}catch(e){}}
function soloDueno(){if(S.owner)return true;toast('Solo el dueño de la empresa puede hacer esto.','err');return false}

