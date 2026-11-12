# Partida Doble

Contabilidad multiempresa para Chile, pensada para contadores que llevan varias empresas: libro diario y mayor, compras y ventas desde el Registro de Compras y Ventas del SII, IVA y F29, honorarios, remuneraciones, activo fijo, cuentas corrientes por RUT, conciliación bancaria, renta anual (14 D y 14 A), cierre del ejercicio, estados financieros, informes en PDF, panel de cartera con alertas y calendario tributario.

La app es una página web estática (HTML, CSS y JavaScript) que no necesita instalación ni compilación. Puede guardar los datos de dos formas:

| Modo | Dónde quedan los datos | Para qué sirve |
|---|---|---|
| **Navegador** (por defecto) | En el navegador del computador donde se usa | Probar, o usarla solo, sin internet ni cuentas |
| **Nube con Supabase** | En una base de datos PostgreSQL en Supabase | Usarla desde cualquier equipo, con usuarios, permisos por empresa y trabajo en equipo |

---

## 1. Probarla en tu computador

Opción rápida: abre `index.html` con doble clic. Funciona en modo navegador.

Opción con servidor local (recomendada, necesita [Node.js](https://nodejs.org) 18 o superior):

```bash
npm start
```

y abre http://localhost:8080.

Para cargar datos de ejemplo: en **Empresas → Restaurar respaldo** elige `datos-de-prueba/respaldo_prueba_comercial_los_aromos.json`. Los archivos CSV de esa carpeta sirven para probar las importaciones de noviembre de 2026.

---

## 2. Publicarla con un enlace https (GitHub Pages, gratis)

1. Crea una cuenta en https://github.com si no tienes.
2. Crea un repositorio nuevo, por ejemplo `partida-doble`. Puede ser privado si tu plan lo permite con Pages; si no, déjalo público (los datos **no** quedan en el repositorio, solo el programa).
3. En el repositorio: **Add file → Upload files**, arrastra todo el contenido de esta carpeta (no la carpeta en sí) y presiona **Commit changes**.
4. Ve a **Settings → Pages**. En *Build and deployment* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
5. En uno o dos minutos la app queda en `https://TU-USUARIO.github.io/partida-doble/`.

Alternativa: arrastra la carpeta a https://app.netlify.com/drop.

---

## 3. Conectar la base de datos en la nube (Supabase)

> Guía interactiva: abre `nube.html` en el navegador. Trae el SQL listo para copiar, prueba la conexión del proyecto y dice exactamente qué falta si algo no responde.

1. Crea una cuenta en https://supabase.com y un proyecto nuevo. Elige la región **South America (São Paulo)** y guarda la contraseña de la base de datos.
2. En el proyecto abre **SQL Editor → New query**, pega el contenido de `supabase/esquema.sql` y presiona **Run**. Debe terminar sin errores.
3. En **Authentication → URL Configuration**, en *Site URL* pon la dirección de tu app (por ejemplo `https://TU-USUARIO.github.io/partida-doble/`).
4. En **Project Settings → API** copia:
   - *Project URL*
   - la clave **anon public** (es pública por diseño; la seguridad la dan las políticas del esquema).
5. Edita `js/config.js` (en GitHub: abre el archivo y usa el lápiz) y pega ambos valores:

   ```js
   window.PD_CONFIG = {
     supabaseUrl: 'https://xxxxxxxx.supabase.co',
     supabaseAnonKey: 'eyJhbGciOi...'
   };
   ```

6. Guarda (Commit). Al abrir la app aparecerá la pantalla de ingreso: crea tu cuenta, confirma el correo y entra.
7. Para traer lo que tenías en la versión anterior: en esa versión descarga el **Respaldo** de cada empresa y en la nueva usa **Empresas → Restaurar respaldo**.

### Usuarios y permisos

- Quien crea o restaura una empresa queda como **dueño**.
- En **Empresas → Accesos**, el dueño da acceso a otras personas por correo, con rol **Editor** (registra) o **Lector** (solo ve y exporta). La persona primero debe crear su cuenta en la app.
- Cada persona ve solo las empresas a las que tiene acceso. Esto lo garantiza la base de datos (políticas RLS), no solo la pantalla.
- Cuando ya estén registradas las personas de tu equipo, puedes cerrar los registros nuevos en **Authentication → Providers → Email → Allow new users to sign up**.

### Respaldos

Supabase guarda copias diarias en sus planes pagados. En el plan gratuito, descarga cada cierto tiempo el **Respaldo** de cada empresa desde la app. Además, los proyectos gratuitos se pausan tras una semana sin uso; se reactivan desde el panel de Supabase.

---

## 4. Estructura del proyecto

```
index.html                 Página principal: carga los estilos y los scripts en orden
css/                       Estilos (colores en variables, tema claro y oscuro)
js/config.js               Datos de conexión a Supabase (vacío = modo navegador)
js/01-…06-                 Núcleo: constantes, utilidades, estado, persistencia, Supabase
js/10-…20-                 Lógica contable y tributaria (sin pantalla): asientos, IVA, banco,
                           cuentas corrientes, renta, honorarios, activo fijo, remuneraciones, reportes
js/30-…40-                 Pantallas (cada función vXxx() devuelve el HTML de una vista) y PDF
js/50-…60-                 Dibujo, acciones de botones, eventos y arranque
supabase/esquema.sql       Tablas, permisos y funciones de la base de datos
tests/                     Pruebas automáticas de los cálculos
datos-de-prueba/           Empresa de ejemplo y archivos del SII para probar importaciones
```

Los datos se organizan como documentos con ruta, igual en ambos modos:

| Ruta | Contenido |
|---|---|
| `empresas/{id}` | Ficha, plan de cuentas, reglas, cierre de períodos, plantillas |
| `empresas/{id}/diario/{AAAA-MM}` | Asientos del mes (si el mes se llena se crean partes `AAAA-MM.2`) |
| `empresas/{id}/rcv/{AAAA-MM}` | Compras, ventas y honorarios del mes |
| `empresas/{id}/banco/{AAAA-MM}` | Cartola y conciliación |
| `empresas/{id}/remu/{AAAA-MM}` | Liquidaciones del mes |
| `empresas/{id}/renta/…` | Renta anual, activo fijo (`activos`) y trabajadores (`personal`) |
| `empresas/{id}/audit/{AAAA-MM}` | Historial de cambios |
| `config/indicadores` | UF, UTM y parámetros previsionales comunes |

---

## 5. Pruebas automáticas

```bash
npm test
```

Prueban el RUT, el F29, los asientos automáticos, el balance de 8 columnas, el cierre, el impuesto único, las liquidaciones y el generador de PDF. En GitHub se ejecutan solas en cada cambio (pestaña **Actions**).

Antes de cambiar un cálculo, agrega o ajusta su prueba en `tests/`.

---

## 6. Valores que debes revisar periódicamente

- **Parámetros previsionales** (Remuneraciones → Parámetros): UF, UTM, topes, tasas de AFP, SIS y aporte del empleador. Vienen precargados con valores de Previred 2026 y cambian mes a mes o año a año.
- **Ingreso mínimo**: precargado en $553.553; confírmalo.
- **Tasa de retención de honorarios**: 15,25% en 2026, 16% en 2027 y 17% desde 2028.
- **Códigos del F29** marcados con “—” en la app: no están confirmados.
- **Fechas de DJ**: cargadas para el AT2027 (Res. Ex. SII N°135 de 2026). Para otros años se muestran como estimadas.

## 7. Pendientes conocidos

- Remuneraciones: finiquitos, vacaciones, licencias médicas, archivo para Previred, APV, gratificación art. 47.
- Renta: registros RAI, REX y SAC, corrección monetaria, códigos del F22.
- Declaraciones juradas generadas en formato de carga del SII.

Para seguir desarrollando con Claude Code, lee `CLAUDE.md`.
