/* Partida Doble · Activo fijo y depreciación lineal. */
/* ---- Activo fijo ---- */
const bienes=()=>((S.renta.activos||{}).bienes)||[];
const mesesEntre=(a,b)=>{const [y1,m1]=a.split('-').map(Number),[y2,m2]=b.split('-').map(Number);return (y2-y1)*12+(m2-m1)};
function depAcum(b,ym){if(!b.fecha||!(+b.vida))return 0;const ini=b.fecha.slice(0,7);let n=mesesEntre(ini,ym);if(b.baja&&ym>b.baja.slice(0,7))n=mesesEntre(ini,b.baja.slice(0,7));const tot=Math.round(+b.vida*12);n=Math.max(0,Math.min(n,tot));return Math.round(((+b.valor||0)-(+b.residual||0))*n/tot)}
const depMes=(b,ym)=>depAcum(b,ym)-depAcum(b,prevYm(ym));
async function guardarBienes(list){const prev=bienes();await putE('renta/activos',{...clone(S.renta.activos||{}),bienes:list});const d=(a,b)=>a.filter(x=>!b.some(y=>JSON.stringify(y)===JSON.stringify(x)));for(const x of d(prev,list))if(!list.some(y=>y.id===x.id))await audit('eliminar','Activo fijo',x.nombre,`${fd(x.fecha)} · ${fmt(x.valor)} · ${x.vida} años`,null);for(const x of d(list,prev)){const o=prev.find(y=>y.id===x.id);await audit(o?'modificar':'crear','Activo fijo',x.nombre,o&&`${fd(o.fecha)} · ${fmt(o.valor)} · ${o.vida} años`,`${fd(x.fecha)} · ${fmt(x.valor)} · ${x.vida} años`)}}

