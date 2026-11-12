/* Configuración de Partida Doble.
   Para guardar los datos en la nube (con usuarios y permisos), crea un proyecto en
   https://supabase.com, ejecuta supabase/esquema.sql y pega aquí la URL del proyecto
   y la clave pública que aparece en Settings → API Keys:
     - sb_publishable_…  en los proyectos nuevos
     - anon (eyJ…)       en los proyectos antiguos; deja de funcionar a fines de 2026
   Esa clave es pública por diseño: la seguridad la dan las políticas del esquema.
   La clave secreta (sb_secret_ o service_role) no va aquí nunca.
   Si dejas los dos valores vacíos, la app funciona en "modo navegador".

   rutApi (opcional). El SII no publica una consulta de razón social por RUT, así que por
   defecto la app solo completa lo que ya tiene guardado (tus empresas, el registro de compras
   y ventas y las boletas de honorarios). Si contratas un servicio que devuelva
   {razon, giro, direccion, comuna} en JSON, pon aquí su dirección usando {rut} como marcador:
   rutApi: 'https://mi-servicio.cl/api/rut/{rut}'
   Déjalo vacío para no consultar nada fuera del equipo. */
window.PD_CONFIG = {
  supabaseUrl: 'https://byrgnqvglscadcwdiatg.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cmducXZnbHNjYWRjd2RpYXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NDI0NTksImV4cCI6MjExMDAxODQ1OX0.OXIpl5kUdiAF9PRseoMY2xij79KhkhJbn4-DMNkP1r8',
  rutApi: ''
};
