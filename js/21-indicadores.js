/* Partida Doble · Indicadores externos (UF y UTM).
   Consulta un servicio público que replica la publicación del SII y del Banco
   Central y devuelve los valores del mes pedido. Nada se guarda solo: la
   pantalla muestra lo que encontró y el usuario decide aplicarlo con su
   propia sesión (los datos comunes son de administrador). */

const IND_URL = 'https://mindicador.cl/api';
const IND_TIMEOUT_MS = 12000;
const IND_FUENTE = 'mindicador.cl (SII y Banco Central)';

/* UF del último día publicado del mes. La serie trae fechas con hora; se toma
   la mayor fecha del mes que tenga un valor positivo. */
function indUfDelMes(serie, ym) {
  if (!Array.isArray(serie) || !ym) return null;
  let mejor = null;
  for (const x of serie) {
    const fecha = String((x && x.fecha) || '').slice(0, 10);
    const valor = Number(x && x.valor);
    if (fecha.slice(0, 7) !== ym || !isFinite(valor) || valor <= 0) continue;
    if (!mejor || fecha > mejor.fecha) mejor = { fecha, valor };
  }
  return mejor;
}

/* UTM del mes (una por mes, publicada con fecha del día 1). */
function indUtmDelMes(serie, ym) {
  if (!Array.isArray(serie) || !ym) return null;
  for (const x of serie) {
    const fecha = String((x && x.fecha) || '').slice(0, 10);
    const valor = Math.round(Number(x && x.valor));
    if (fecha.slice(0, 7) === ym && isFinite(valor) && valor > 0) return { fecha, valor };
  }
  return null;
}

/* Pide la serie del año al servicio. `opciones.fetch` permite inyectar uno
   falso en las pruebas; sin él usa el fetch del navegador. */
async function indTraer(ym, opciones) {
  const op = opciones || {};
  if (!ym) throw new Error('Elige un mes en la barra de arriba antes de consultar.');
  const f = op.fetch || (typeof fetch === 'function' ? fetch : null);
  if (!f) throw new Error('Este navegador no permite consultar el servicio de indicadores.');
  const anio = String(ym).slice(0, 4);
  const pedir = async ruta => {
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const reloj = ctl ? setTimeout(() => ctl.abort(), op.timeout || IND_TIMEOUT_MS) : null;
    try {
      const r = await f(`${IND_URL}/${ruta}/${anio}`, Object.assign({ cache: 'no-store' }, ctl ? { signal: ctl.signal } : {}));
      if (!r || !r.ok) throw new Error(`El servicio de indicadores respondió ${(r && r.status) || 'sin respuesta'}.`);
      return await r.json();
    } catch (e) {
      if (e && e.name === 'AbortError') throw new Error('El servicio de indicadores no respondió a tiempo.');
      throw e;
    } finally {
      if (reloj) clearTimeout(reloj);
    }
  };
  const [ju, jt] = await Promise.all([pedir('uf'), pedir('utm')]);
  const uf = indUfDelMes((ju && ju.serie) || [], ym);
  const utm = indUtmDelMes((jt && jt.serie) || [], ym);
  if (!uf && !utm) throw new Error('El servicio todavía no publica la UF ni la UTM de ese mes.');
  return { ym, uf, utm, consultado: new Date().toISOString(), fuente: IND_FUENTE };
}

/* ¿Lo consultado sirve para el mes que está en pantalla? */
const indSirve = (r, ym) => !!(r && r.ym && ym && r.ym === ym);

/* La UF lleva centavos y se muestran: 41.439,89 */
function indUfTxt(v) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return '';
  const entero = Math.trunc(n);
  const cent = Math.round((n - entero) * 100);
  const miles = String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${miles},${String(cent).padStart(2, '0')}`;
}
