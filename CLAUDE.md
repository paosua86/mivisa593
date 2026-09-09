# MiVisa EC — instrucciones del proyecto

Asesoría de visas de turismo en Ecuador. Estados Unidos, Canadá y Schengen.
Titular del negocio: **David Ubilluz** · Quito · WhatsApp +593 99 896 1214
Dominio: `mivisaec.com` · Repo: `github.com/paosua86/mivisa593` · TikTok: `@mivisaec`

**El nombre de marca correcto y definitivo es "MiVisa EC".** "Mi Visa593"
fue un nombre de trabajo usado al inicio del proyecto, antes de tener el
logo y el dominio; quedó reemplazado en todas las páginas, el pie legal,
los mensajes de WhatsApp y las herramientas internas. El repositorio de
GitHub se sigue llamando `mivisa593` (cambiarlo rompería la URL de
GitHub Pages) — eso no se toca, es solo el nombre técnico del repo.

---

## REGLA 1 — Todo vive aquí

**Todo lo de este proyecto va dentro de `C:\Users\USUARIO\Downloads\visas`.**

- Nunca crear carpetas de este proyecto fuera de aquí.
- Nunca usar `Downloads\noborrar\`, el escritorio ni carpetas temporales
  para archivos del proyecto.
- Antes de crear una carpeta nueva de primer nivel: **preguntar primero.**
  Dentro de las carpetas que ya existen, crear subcarpetas libremente.
- Si un archivo no encaja en ninguna carpeta existente, preguntar dónde
  va antes de inventar un sitio.

Motivo: si los archivos se dispersan, después no se encuentra nada.

## REGLA 2 — Dónde va cada cosa

```
visas/
├── CLAUDE.md              Este archivo
├── README.md              Cómo editar y publicar
├── index.html             Landing pública (una sola página)
├── terminos.html          Términos y condiciones
├── privacidad.html        Política de privacidad
├── empezar/               Formulario de precalificación (paso 1)
├── caso/                  Página personal de cada caso (pasos 2 a 4)
├── pago/                  Página de pago suelta, fuera del flujo
├── expediente/            Formulario largo, se entra desde caso/
├── docs/                  Documentos internos de trabajo
│   └── estrategia/        Copy, guiones, calendario, mapa de dolor
├── referencias/           Originales del cliente (Excel, Word). NO editar.
├── imagenes/              Logo (logo.png, logo-icono.png) y gráficos
└── herramientas/          Apps Script, Worker de Cloudflare
```

- **`referencias/` es de solo lectura.** Son los archivos originales de
  David. Si hay que modificar algo, se crea una versión nueva en otro
  sitio; el original no se toca.

## REGLA 3 — Nombres de archivo

- Minúsculas y guiones: `landing-copy.txt`, no `Landing Copy.txt`.
- Sin espacios, sin tildes, sin `ñ` en nombres de archivo.
- Los documentos de estrategia van numerados para leerse en orden.

---

## Decisiones ya tomadas (no volver a proponerlas)

**Precios** (por persona, solo la asesoría; tasas consulares aparte):

| Destino | Primera vez | Renovación |
|---|---|---|
| Estados Unidos (B1/B2) | $65 | $55 |
| Canadá (visitante) | $95 | $75 |
| Schengen | $155 | — |

Arancel consular EE.UU.: $185. Canadá: tasa de visa 100 CAD + biometría
85 CAD por persona (170 CAD máximo por familia). Todo va directo a la
autoridad correspondiente, no a David.

**Pagos:** transferencia bancaria o tarjeta de crédito por PayPhone. No
Stripe (el negocio es solo Ecuador).

**Un solo link de PayPhone, abierto.** Es el "Link de cobro abierto":
la persona entra y digita ella misma el valor. Se pega en
`LINK_PAYPHONE`, que existe igual en `caso/index.html` y en
`pago/index.html` y tiene que ser el mismo en los dos. Mientras esté
vacío, el botón de tarjeta le pide el link a David por WhatsApp.
Reemplaza a las decisiones anteriores de generarlos uno por uno y de
tener cinco links fijos por monto.

Como el monto lo teclea la persona, las dos páginas se lo muestran en
grande justo antes del botón y se lo repiten después. Si empiezan a
llegar pagos con el valor mal, la salida es volver a links fijos por
monto o pasar a la API.

Contra conocida: PayPhone sí muestra quién pagó (nombre, cédula,
correo y teléfono en el panel de transacciones), pero no dice a qué
caso corresponde, y quien paga no siempre es el solicitante. Por eso
las páginas piden poner el código del caso en la referencia. La
conciliación automática sería la API de PayPhone con
`clientTransactionId` = código; hace falta credenciales de comercio y
no está hecho.

**No hay candado en ninguna parte del flujo.** El formulario detallado
está abierto desde el primer momento para cualquiera con su código.
David no habilita nada. Lo que ordena el trabajo es que él se pone con
un caso cuando ve el pago, no un permiso técnico. Las columnas `Pago
declarado` (la escribe la persona desde su página) y `Pagado` (la
escribe David al verificar) son registro, no permiso. No volver a
proponer un desbloqueo por pago.
**Agenda:** Horarios de citas de Google Calendar. No Cal.com.
**Facturación:** electrónica SRI, pendiente de integrar.

**El objetivo del proyecto es recuperarle tiempo a David**, no escalar
volumen. El precio se revisa más adelante, no ahora.

**El CTA de la landing es el formulario, NO WhatsApp.**
Es el punto central del proyecto: antes cada consulta caía en el
teléfono de David y le consumía el día. WhatsApp aparece solo al final
de la página y en `/pago/`, como paso puntual dentro del flujo, no como
puerta de entrada general.

**El hero NO gira sobre "nadie garantiza la visa".** Eso queda como nota
al pie de la sección de honestidad. El ángulo es: *tu caso no es un
formulario genérico, el proceso es tuyo*.

**Nunca escribir en la página ni en anuncios:** "visa garantizada",
"aprobación asegurada", "100% de éxito", ni una cifra exacta de saldo
bancario presentada como requisito oficial (no lo es).

**NUNCA publicar el RUC ni el número de cédula de David** en la página,
en las páginas legales ni en ningún sitio público. En Ecuador exponer
esos números es un riesgo real de suplantación y fraude. No volver a
pedirlo ni proponerlo. La dirección y el nombre sí van; el RUC no.

**Excepción confirmada — `/pago/`:** ahí sí va la cédula de David
(1803686656) junto a los datos de la transferencia bancaria, porque en
Ecuador los bancos la piden para validar transferencias interbancarias
entrantes; sin ella la transferencia no llega. `/pago/` tiene
`<meta name="robots" content="noindex">` y no se enlaza desde ningún
lugar público del sitio — el link lo comparte Paola o David directo por
WhatsApp con cada cliente, no es una página de descubrimiento libre.
Esta excepción es solo para esa página; el resto del sitio sigue sin
mostrar el RUC/cédula.

**Publicar sin preguntar.** Cuando un cambio esté terminado y probado,
hacer commit y push a `main` directamente. El workflow de GitHub Pages
lo despliega solo. No preguntar "¿lo subo?" cada vez.

**La URL de Apps Script va pública en el código de la página.** Decisión
tomada a propósito para avanzar. El Worker de Cloudflare que la esconde
está escrito en `herramientas/cloudflare-worker-casos.js` por si algún
día se quiere; no volver a proponerlo.

**Datos de contacto públicos ya fijados:** David Ubilluz · Pachacútec
s/n, Quito, Pichincha 170802 · WhatsApp +593 99 896 1214. No volver a
pedirlos.

**Sistema visual, extraído del logo real de David (`imagenes/logo.png`
y `logo-icono.png`):**
- Acento único: degradado turquesa a azul (`--btn-1`/`--brand-2` para
  superficies con texto blanco, `--brand-deep` para enlaces y texto de
  marca, `--brand-tint` para fondos claros de insignias). Nada de verde
  ni naranja: esos colores quedaron atrás con el nombre anterior.
- Tipografía: **Playfair Display** para h1/h2 y callouts en cursiva,
  **Public Sans** para todo el cuerpo. El cuerpo nunca lleva serif, por
  legibilidad con el público mayor y no técnico.
- El verde/ámbar/rojo del semáforo de precalificación (`--ok`/`--ambar`/
  `--rojo` en `empezar/index.html`) es semántico, no de marca: se
  mantiene igual aunque cambie el resto de la paleta.
- El verde de WhatsApp (`#1f9c53`) en los botones que abren WhatsApp
  también es semántico (reconocible como "esto abre WhatsApp") y se
  mantiene igual.
- Movimiento: entrada escalonada en el hero, revelado suave al hacer
  scroll, elevación en hover (solo con puntero real). Todo respeta
  `prefers-reduced-motion`. Nada de scroll-hijack ni parallax.
- Este sistema debe aplicarse igual en cualquier página nueva que se
  agregue al sitio.

---

## Contexto técnico

- Público: ecuatorianos, mayoría no técnicos, 90%+ desde el celular.
- Móvil primero. Texto grande. Botones grandes. Una sola columna.
- Formularios: una pregunta por pantalla, botones en vez de campos de
  texto libre siempre que se pueda, guardado automático.
- Sin dependencias externas ni paso de build: HTML/CSS/JS planos,
  publicables en GitHub Pages tal cual. Las únicas peticiones externas
  son las fuentes de Google Fonts (Playfair Display, Public Sans).
- Datos personales (pasaportes, cédulas, sueldos): aplica la LOPDP
  ecuatoriana. Antes de guardar datos reales hacen falta aviso de
  privacidad, consentimiento explícito, política de retención y cifrado.
- La carpeta de Drive donde se guardan los casos se llama
  `Casos MiVisa EC`. El script (`herramientas/apps-script-guardar-casos.gs`)
  migra sola el nombre antiguo (`Casos Mi Visa593`) si lo encuentra, sin
  perder los casos ya guardados ahí.

## Expediente: cómo está armado por destino

`expediente/index.html` sirve los tres destinos desde una sola página.
Las preguntas viven en `SECCIONES_USA`, `SECCIONES_CANADA` y
`SECCIONES_SCHENGEN`, y el registro `DESTINOS` une cada una con sus
documentos y con la lista de "ten esto a la mano". `claveDestino()`
reconoce el texto que llega de la hoja (`Estados Unidos`, `Canadá`,
`Europa (Schengen)`); si no lo reconoce, deriva a WhatsApp.

Las secciones salen de los formularios oficiales: DS-160 para Estados
Unidos, IMM 5257 más la información familiar del IMM 5645 para Canadá,
y el formulario uniforme para Schengen. **David todavía no validó las
de Canadá y Schengen.**

Los tres Excel de David volvieron a `referencias/`
(`formulario-visa-americana.xlsx`, `-canadiense`, `-schengen`), así que
ya se pueden alinear las preguntas de la web al orden y las etiquetas
de sus archivos. **Está pendiente:** hoy las de Canadá y Schengen
siguen el formulario oficial, no su Excel, y no coinciden. Alinearlas
significa perder campos que el formulario oficial pide y su Excel no
(en Canadá: idiomas y las preguntas de seguridad); antes de hacerlo,
preguntarle si esos los pide por teléfono.

Para agregar o cambiar una pregunta basta con editar el arreglo del
destino: los encabezados de la hoja, el mapa de etiquetas y la barra de
progreso salen todos de ahí. No hace falta tocar el Apps Script.

En la hoja de cálculo **cada destino tiene su propia pestaña**
(`Expedientes EE.UU.`, `Expedientes Canadá`, `Expedientes Europa`),
porque las columnas no son las mismas y mezclarlas desalinea las filas.
En cada pestaña la fila 1 lleva el título legible y la fila 2, oculta,
la clave interna; si después se agrega un campo, el script crea la
columna al final sin mover lo ya guardado.

## Idioma

Todo el contenido público en español ecuatoriano, tuteo, frases cortas,
sin tecnicismos sin explicar.
