/* Partida Doble · Estado global de la aplicación (S) y selectores básicos (empresa, plan, asientos, período). */
/* ============ Estado ============ */
const now=new Date();
const S={emps:[],empId:lsGet('pd.emp'),diario:{},rcv:{},banco:{},renta:{},loaded:{emps:false,diario:false,rcv:false,banco:false,renta:false},cartera:null,q:'',ccCta:null,ccRut:null,user:null,uid:null,owner:true,ro:false,names:{},ind:{utm:{}},
 view:'resumen',anio:+(lsGet('pd.anio')||now.getFullYear()),mes:+(lsGet('pd.mes')??(now.getMonth()+1)),
 f:{},ed:null,confirm:null,mayorCta:null,bancoCta:null,sel:{mov:null,lin:null},imp:{},showImp:{},mode:'cargando',db:null,dl:null,busy:false};
if(isNaN(S.mes))S.mes=now.getMonth()+1;
let AS=null,CM=null;
const inval=()=>{AS=null;CM=null};
const emp=()=>S.emps.find(e=>e.id===S.empId)||null;
const plan=()=>{const e=emp();const p=((e&&e.plan)||PLAN_BASE).slice();const have=new Set(p.map(c=>c.codigo));const need=new Set(Object.values(Object.assign({},CLAVES_BASE,(e&&e.claves)||{})));PLAN_BASE.forEach(c=>{if(need.has(c.codigo)&&!have.has(c.codigo))p.push(c)});return p.sort((a,b)=>a.codigo<b.codigo?-1:1)};
const claves=()=>Object.assign({},CLAVES_BASE,(emp()||{}).claves||{});
const cm=()=>CM||(CM=Object.fromEntries(plan().map(c=>[c.codigo,c])));
const ctaTxt=c=>{const x=cm()[c];return x?`${c} ${x.nombre}`:c};
const ctaNom=c=>(cm()[c]||{}).nombre||'Cuenta no encontrada';
function asientos(){if(AS)return AS;AS=Object.values(S.diario).flatMap(m=>(m&&m.asientos)||[]).slice().sort((a,b)=>a.fecha<b.fecha?-1:a.fecha>b.fecha?1:(a.numero||0)-(b.numero||0));return AS}
function rango(){const a=S.anio,m=S.mes;if(!m)return[`${a}-01-01`,`${a}-12-31`];return[`${a}-${pad(m)}-01`,`${a}-${pad(m)}-${pad(new Date(a,m,0).getDate())}`]}
const ymSel=()=>S.mes?`${S.anio}-${pad(S.mes)}`:null;
const perTxt=()=>S.mes?`${MESES[S.mes-1]} ${S.anio}`:`Año ${S.anio}`;
const enRango=(f,[d,h])=>f>=d&&f<=h;
function prevYm(ym){let [y,m]=ym.split('-').map(Number);m--;if(!m){m=12;y--}return `${y}-${pad(m)}`}

