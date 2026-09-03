# MiVisa EC

Asesoría de visas de turismo en Ecuador · Estados Unidos, Canadá y Schengen.
David Ubilluz · Quito · WhatsApp +593 99 896 1214 · `mivisaec.com`

Sitio estático, sin dependencias ni paso de build. Se publica tal cual.

## Estructura

```
index.html        Landing pública
terminos.html      Términos y condiciones
privacidad.html    Política de privacidad
empezar/          Formulario de precalificación (paso 1 del proceso)
pago/             Página de pago por servicio (paso 5)
expediente/       Formulario largo, solo con link personal (paso 4+)
docs/             Documentos internos: copy, estrategia, rediseño de formularios
referencias/      Originales de David (Excel, Word). Solo lectura.
imagenes/         Logo (logo.png, logo-icono.png) y gráficos para redes
herramientas/     Apps Script (guarda los casos) y Worker de Cloudflare
CLAUDE.md         Reglas del proyecto y decisiones ya tomadas
```

`docs/` y `referencias/` están excluidos por `.gitignore`: son internos.

## Sistema visual

Playfair Display (h1/h2 y callouts) + Public Sans (cuerpo). Acento único
en degradado turquesa-azul, extraído del logo real. El verde/ámbar/rojo
del semáforo en `empezar/` y el verde de WhatsApp son colores semánticos
aparte, no cambian con la marca. Detalle completo en `CLAUDE.md`.

## Ver el sitio en local

```bash
python -m http.server 8899
```

Y abrir <http://127.0.0.1:8899>.

## Editar el formulario de precalificación

Todo el contenido vive en el bloque `PREGUNTAS` al inicio del `<script>`
de `empezar/index.html`. Cada opción acepta:

| Campo | Para qué sirve |
|---|---|
| `v` | valor guardado |
| `t` | texto del botón |
| `s` | subtexto opcional |
| `p` | puntos que suma o resta |
| `bandera` | punto flojo serio, se muestra siempre |
| `flojo` | punto flojo leve, se muestra solo si el caso no es verde |
| `si` | función que decide si la pregunta aplica al caso |

Los textos de consejo de cada punto flojo van en el objeto `CONSEJOS`.
Tabla completa de puntos en `docs/tabla-de-puntos.md`.

### Semáforo

| Puntos | Resultado |
|---|---|
| 6 o más | **Verde** — caso sólido |
| 2 a 5 | **Ámbar** — se puede trabajar, con puntos flojos |
| menos de 2 | **Rojo** — todavía no es su momento |

Dos reglas duras mandan por encima del puntaje:

- Visa negada hace menos de un año y sin cambios en el perfil → **rojo**.
- Sin pasaporte → nunca puede salir verde.

## Cómo se guarda cada caso

`empezar/index.html` envía el caso a la URL en `ENDPOINT_GUARDADO`, que
apunta al Apps Script (`herramientas/apps-script-guardar-casos.gs`). Ese
script:

- Guarda una fila en la hoja de cálculo de Google, con un código de 6
  caracteres y los links de pago y expediente ya armados.
- Crea una carpeta por caso dentro de `Casos MiVisa EC` en Drive.
- Cuando llega un expediente completo (`expediente/index.html`), lo
  guarda en la pestaña "Expedientes" y genera un documento de texto
  ordenado dentro de la carpeta del caso.

Al modificar el `.gs`, hay que volver a implementarlo como **Nueva
versión** (no nueva implementación) para que la URL no cambie.

## Publicar

GitHub Pages, rama `main`, carpeta raíz. `CNAME` apunta a `mivisaec.com`.

## Pendiente

- Webhook o integración directa con PayPhone (hoy el link de pago lo
  genera David a mano cuando el cliente lo pide por WhatsApp).
- Facturación electrónica SRI.
- Subida real de documentos en el expediente (hoy solo se marca el
  estado de cada uno; las fotos se envían por WhatsApp aparte).
