# Gestor de Gastos Personales

App de finanzas personales inspirada en [cuantogasto.com.ar](https://cuantogasto.com.ar/), pensada para uso 100% individual: sin login, sin roles, sin base de datos en la nube. Todo el almacenamiento es local.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** con un sistema de tokens propio (navy + verde esmeralda, tipografía SF Pro / sistema iOS, cifras en monoespaciada tabular)
- **lucide-react** para los íconos

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Para ver el diseño tal como se vería en un iPhone, abrí las herramientas de desarrollador del navegador y activá la simulación de dispositivo móvil, o simplemente reducí el ancho de la ventana por debajo de 640px — el "marco" de teléfono desaparece y la app ocupa el 100% de la pantalla, igual que una app nativa instalada.

## Usar la app desde tu celular (instalada, e idealmente sin internet)

La app ya está preparada como **PWA (Progressive Web App)**: tiene ícono propio, se puede "instalar" en la pantalla de inicio como si fuera nativa, y gracias a un *service worker* funciona **sin conexión** después de la primera vez que se abre. Como todos los datos viven en el storage local del navegador del celular (no en un servidor), cada dispositivo donde la instales tiene sus propios datos independientes.

Hay dos caminos. El primero es el que recomiendo:

### Opción A (recomendada): desplegarla en Vercel — gratis, con URL propia, funciona con wifi o datos

1. Creá una cuenta gratis en [vercel.com](https://vercel.com) (podés entrar con GitHub).
2. Subí esta carpeta a un repositorio de GitHub (o usá `npx vercel` desde acá mismo si tenés la CLI: `npm i -g vercel && vercel`).
3. Importá el repo en Vercel (detecta Next.js automáticamente, no hay que tocar nada).
4. Te da una URL del tipo `https://tu-app.vercel.app`. Abrila **una vez** desde el celular (con wifi o datos).
5. Instalala en la pantalla de inicio (ver pasos más abajo).
6. De ahí en adelante, **abrila sin internet**: como ya está cacheada, el service worker la sirve igual.

Ventaja sobre la opción B: la URL es fija y permanente, así que funciona estés donde estés (no depende de estar en la misma red que tu computadora).

### Opción B: probarla ahora mismo, sin desplegar nada (necesita estar en la misma wifi)

1. En tu computadora: `npm run dev`.
2. Buscá la IP local de tu computadora (Mac/Linux: `ifconfig | grep inet`; Windows: `ipconfig`). Algo como `192.168.0.15`.
3. Conectá el celular a la **misma red wifi** que la computadora.
4. En el celular, abrí `http://192.168.0.15:3000` (con tu IP real).

Esto sólo funciona mientras la compu tenga `npm run dev` corriendo y el celular esté en esa wifi — no sirve para usarla "sin wifi" de forma permanente, es más para probarla rápido.

### Cómo instalarla en la pantalla de inicio

**iPhone (Safari):** abrí la URL → ícono de compartir (el cuadrado con la flecha hacia arriba) → "Agregar a pantalla de inicio".

**Android (Chrome):** abrí la URL → menú (⋮) → "Instalar app" o "Agregar a pantalla de inicio".

Una vez instalada se abre en pantalla completa, sin la barra del navegador, con su propio ícono — igual que cualquier otra app.

### Sobre el "sin wifi"

No hay forma de que una app web funcione con **cero conexión jamás, ni siquiera la primera vez** — el celular necesita descargarla una vez (wifi o datos móviles, lo que tengas a mano). Pero esa única vez alcanza: el service worker guarda todo lo necesario, y de ahí en adelante abrís la app en modo avión sin problema. Si en el futuro actualizamos la app, sí vas a necesitar conexión una vez más para traer los cambios nuevos.



```
src/
  app/
    layout.tsx          → Layout raíz (metadata, viewport, fuente)
    globals.css         → Reset + utilidades iOS (sin scroll horizontal, glass, safe-area)
    page.tsx             → Dashboard (saldo, movimientos recientes)
    nueva-carga/page.tsx → Carga de gasto/ingreso (shell funcional)
    suscripciones/page.tsx → Suscripciones y gastos recurrentes
    historial/page.tsx   → Historial + Configuración (estilo iOS Settings)
  components/
    AppShell.tsx         → Marco "iPhone": 100% en mobile, centrado (max-w 430px) en desktop
    BottomNav.tsx         → Tab bar inferior con botón central circular (Nueva Carga)
  lib/
    format.ts            → Helpers de formato de moneda (ARS) y fecha
```

## Decisiones de diseño

- **Marco de dispositivo**: en pantallas ≥640px, la app se muestra centrada con `max-width: 430px`, bordes sutiles, esquinas redondeadas y sombra, simulando un iPhone. En mobile real, ocupa el 100% del viewport. El scroll horizontal está bloqueado globalmente (`overflow-x: hidden`).
- **Bottom Tab Bar**: 4 pestañas — *Dashboard*, *Nueva Carga*, *Suscripciones*, *Historial* — en ese orden, con fondo translúcido tipo "glass" (`backdrop-filter: blur`) y un hairline superior, igual que la tab bar nativa de iOS. El botón de **Nueva Carga** es circular, más grande (56px), elevado por encima de la barra y con sombra de color (`shadow-fab`) para que se destaque como acción principal.
- **Safe areas**: se usa `env(safe-area-inset-bottom)` y `env(safe-area-inset-top)` para que el contenido y la tab bar respeten el notch / home indicator en iPhones reales.
- **Tipografía**: pila de fuentes del sistema (`-apple-system`, `SF Pro`) para que en un iPhone real se renderice con la fuente nativa San Francisco. Los montos usan una fuente monoespaciada tabular (`figure-amount`) para que las cifras no "salten" de ancho al cambiar.
- **Paleta**: navy profundo (`#0F172A`) como color de marca (tomado del `theme-color` del sitio de referencia), verde esmeralda (`#0EA672`) para ingresos/acciones primarias, rojo coral (`#E2483D`) para gastos.

## Próximos pasos sugeridos

Esta entrega cubre la base del proyecto (estructura, layout tipo app nativa, navegación). Las pantallas de *Nueva Carga*, *Suscripciones* e *Historial* tienen datos de ejemplo (demo) y están listas para conectarse a un almacenamiento local real (por ejemplo `localStorage`, `IndexedDB`, o un archivo SQLite embebido).
