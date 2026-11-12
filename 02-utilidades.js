/* Partida Doble · Utilidades generales: formato de números y fechas, RUT, CSV, avisos. */
/* ============ Utilidades ============ */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NF=new Intl.NumberFormat('es-CL');
const fmt=n=>{n=Math.round(+n||0);return n<0?'('+NF.format(-n)+')':NF.format(n)};
const fz=n=>Math.round(+n||0)===0?'':fmt(n);
const pdec=v=>{v=String(v||'').trim();if(v.includes(','))return +v.replace(/\./g,'').replace(',','.')||0;if(/^\d{1,3}(\.\d{3})+$/.test(v))return +v.replace(/\./g,'')||0;return parseFloat(v)||0};
const pn=s=>{if(typeof s==='number')return s;s=String(s??'').trim();if(!s)return 0;const neg=/^\(.*\)$/.test(s)||/^-/.test(s);s=s.replace(/[^\d,]/g,'').replace(',','.');const v=parseFloat(s)||0;return neg?-v:v};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const clone=o=>JSON.parse(JSON.stringify(o??null));
const hoy=()=>new Date().toLocaleDateString('sv-SE');
const pad=n=>String(n).padStart(2,'0');
const fd=f=>f?f.slice(8,10)+'-'+f.slice(5,7)+'-'+f.slice(0,4):'';
const sum=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0);
const rutClean=r=>String(r||'').replace(/[^0-9kK]/g,'').toUpperCase();
function rutDV(n){let s=0,m=2;for(let i=n.length-1;i>=0;i--){s+=(+n[i])*m;m=m===7?2:m+1}const r=11-(s%11);return r===11?'0':r===10?'K':String(r)}
const rutOk=r=>{const c=rutClean(r);return c.length>=2&&/^\d+$/.test(c.slice(0,-1))&&rutDV(c.slice(0,-1))===c.slice(-1)};
const rutFmt=r=>{const c=rutClean(r);if(c.length<2)return r||'';return c.slice(0,-1).replace(/\B(?=(\d{3})+(?!\d))/g,'.')+'-'+c.slice(-1)};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
function parseFecha(s){s=String(s||'').trim();let m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);if(m)return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return `${m[1]}-${m[2]}-${m[3]}`;return null}
function parseCSV(txt){const lines=String(txt||'').replace(/^﻿/,'').split(/\r?\n/).filter(l=>l.trim());if(!lines.length)return[];const d=lines[0].includes(';')?';':(lines[0].includes('\t')?'\t':',');return lines.map(l=>{const out=[];let cur='',q=false;for(const ch of l){if(ch==='"'){q=!q;continue}if(ch===d&&!q){out.push(cur.trim());cur='';continue}cur+=ch}out.push(cur.trim());return out})}
function toast(msg,kind){const t=document.createElement('div');t.className='t'+(kind==='err'?' err':'');t.textContent=msg;$('#toast').appendChild(t);setTimeout(()=>t.remove(),kind==='err'?6000:2800)}
const errMsg=e=>e&&e.code==='quota_exceeded'?'Se llenó el espacio de almacenamiento. Elimina datos antiguos para seguir guardando.':e&&e.code==='invalid_argument'?'No tienes permiso para modificar estos datos.':'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.';
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};

