// Función de Supabase: envía la liquidación de sueldo por correo usando Brevo.
//
// Configuración (Supabase → Edge Functions → Secrets):
//   BREVO_API_KEY  clave de Brevo con permiso para enviar correo transaccional
//   REMITENTE      correo remitente verificado (por defecto Notificaciones@vyasociados.cl)
//
// Seguridad: exige la sesión del usuario (Authorization: Bearer <jwt>) y comprueba en la tabla
// "miembros" que sea dueño o editor de la empresa indicada. La clave de Brevo nunca sale de aquí.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'METODO' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) return json({ ok: false, error: 'SIN_CONFIGURACION' }, 500);

  const auth = req.headers.get('Authorization') || '';
  const sb = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: quien } = await sb.auth.getUser();
  if (!quien?.user) return json({ ok: false, error: '401' }, 401);

  let body: any = null;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'CUERPO' }, 400); }

  const empresaId = String(body?.empresaId || '');
  const lista: any[] = Array.isArray(body?.liquidaciones) ? body.liquidaciones : [];
  if (!empresaId || !lista.length) return json({ ok: false, error: 'FALTAN_DATOS' }, 400);
  if (lista.length > 20) return json({ ok: false, error: 'DEMASIADAS' }, 400);

  // Solo dueño o editor de la empresa puede enviar liquidaciones.
  const { data: rol } = await sb
    .from('miembros')
    .select('rol')
    .eq('empresa_id', empresaId)
    .eq('user_id', quien.user.id)
    .maybeSingle();
  if (!rol || !['dueno', 'editor'].includes(rol.rol)) return json({ ok: false, error: '403' }, 403);

  const key = Deno.env.get('BREVO_API_KEY');
  if (!key) return json({ ok: false, error: 'SIN_CLAVE' }, 200);
  const remitente = Deno.env.get('REMITENTE') || 'Notificaciones@vyasociados.cl';
  const empresa = String(body?.empresa || '').slice(0, 120);
  const periodo = String(body?.periodo || '').slice(0, 40);

  const enviadas: string[] = [];
  for (const l of lista) {
    const para = String(l?.email || '').trim().toLowerCase();
    const nombre = String(l?.nombre || '').slice(0, 120);
    const pdf = String(l?.pdf || '');
    const archivo = String(l?.filename || 'liquidacion.pdf').replace(/[^\w.\-]/g, '_');
    if (!emailOk(para)) return json({ ok: false, error: 'CORREO_INVALIDO' }, 200);
    if (!pdf) return json({ ok: false, error: 'SIN_PDF' }, 200);
    if (pdf.length > 3_000_000) return json({ ok: false, error: 'PDF_MUY_GRANDE' }, 200);

    const html =
      `<p>Estimado(a) ${nombre}:</p>` +
      `<p>Adjuntamos su liquidación de sueldo de <b>${periodo}</b>${empresa ? ` de ${empresa}` : ''}.</p>` +
      `<p>Si tiene dudas sobre los montos o descuentos, responda este mismo correo.</p>` +
      `<p>Saludos cordiales.</p>`;

    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: remitente, name: empresa || 'Remuneraciones' },
        to: [{ email: para, name: nombre || para }],
        replyTo: { email: remitente },
        subject: `Liquidación de sueldo ${periodo}${empresa ? ' · ' + empresa : ''}`,
        htmlContent: html,
        attachment: [{ content: pdf, name: archivo }],
      }),
    });

    if (!r.ok) {
      const detalle = (await r.text()).slice(0, 300);
      const error = r.status === 401 ? 'CLAVE_INVALIDA' : r.status === 400 ? 'DESTINO_O_REMITENTE' : 'PROVEEDOR';
      return json({ ok: false, error, detalle }, 200);
    }
    enviadas.push(para);
  }

  return json({ ok: true, enviadas });
});
