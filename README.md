# Partida Doble

Contabilidad multiempresa para Chile, como página web estática: no se instala ni se compila.

Esta carpeta es la que se publica. El programa es `index.html` más las carpetas `css/` y `js/`; los datos viven en Supabase, no en estos archivos.

---

## Cómo publicarla en GitHub Pages

1. En GitHub crea un repositorio nuevo, por ejemplo `partida-doble`.
   Puede ser privado si tu plan lo permite con Pages; si no, déjalo público.
2. En el repositorio: **Add file → Upload files** y arrastra **el contenido** de esta carpeta
   (no la carpeta en sí): `index.html`, `css`, `js`, `datos-de-prueba`, `supabase`, `robots.txt`,
   `.nojekyll`, `README-COMPLETO.md`.
3. Presiona **Commit changes**.
4. Ve a **Settings → Pages**. En *Build and deployment* elige **Deploy from a branch**,
   rama `main`, carpeta `/ (root)` y guarda.
5. En uno o dos minutos queda en `https://TU-USUARIO.github.io/partida-doble/`.

Alternativa más rápida: arrastra la carpeta a https://app.netlify.com/drop y obtienes un enlace al instante.

---

## Después de publicar: avisar a Supabase la dirección nueva

En el proyecto de Supabase abre **Authentication → URL Configuration** y cambia:

- *Site URL*: la dirección publicada, por ejemplo `https://TU-USUARIO.github.io/partida-doble/`
- *Redirect URLs*: agrega esa misma dirección terminada en `/**`

Si no lo haces, los correos de confirmación de cuenta y de cambio de contraseña llevan a la dirección antigua.

---

## Cuentas y permisos

- Cada persona crea su cuenta con su correo en la página publicada; llega un correo de confirmación.
- Quien crea o restaura una empresa queda como **dueño**.
- El dueño da acceso en **Administración → Usuarios**, por correo, con rol **Editor** (registra) o **Lector** (solo revisa y exporta).
- Cada persona ve únicamente las empresas a las que tiene acceso; lo controla la base de datos, no solo la pantalla.

## Empresa de ejemplo

En **Empresas**, cuando no hay ninguna cargada, aparece el botón **Cargar empresa de ejemplo**.
Carga *Comercial Los Aromos SpA* (RUT 76.543.210-3) con tres meses de movimientos, para recorrer el sistema con datos.
El respaldo también está en `datos-de-prueba/respaldo_prueba_comercial_los_aromos.json`, por si prefieres usar **Restaurar respaldo**.

## Respaldos

Supabase guarda copias diarias solo en los planes pagados. En el plan gratuito, descarga el **Respaldo** de cada empresa de vez en cuando desde **Empresas → Respaldo**. Los proyectos gratuitos se pausan tras una semana sin uso: se reactivan desde el panel de Supabase.

## Archivos

| Archivo | Contenido |
|---|---|
| `index.html` | Página principal; carga los estilos y los scripts en orden |
| `css/` | Estilos (tema claro y oscuro) |
| `js/01-…06-` | Núcleo: constantes, utilidades, estado, persistencia y conexión con Supabase |
| `js/10-…20-` | Lógica contable y tributaria, sin pantalla |
| `js/30-…40-` | Pantallas y generación de PDF |
| `js/50-…60-` | Dibujo, acciones, eventos y arranque |
| `js/config.js` | Dirección y clave pública del proyecto de Supabase |
| `supabase/esquema.sql` | Tablas, permisos y funciones de la base |
| `datos-de-prueba/` | Empresa de ejemplo y archivos del SII para probar importaciones |

La guía completa (uso, valores legales, pendientes) está en `README-COMPLETO.md`.
