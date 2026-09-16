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
├── caso/                  Página personal: resultado, pago y formulario
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

**Un trámite es renovación mientras la visa anterior siga vigente o no
haya cumplido 12 meses de vencida.** Pasado ese año vuelve a ser
primera vez, con el precio de primera vez. Es la regla de David,
confirmada en septiembre de 2026, y vale para los tres destinos. La
ventana es de un año, y no menos, porque entre la llamada, el pago,
reunir papeles y conseguir cita se van semanas: una ventana corta
dejaría fuera a gente que empezó a tiempo.

No se le pregunta a la persona si "es una renovación": se le pide la
**fecha de vencimiento de la visa anterior** y la página lo calcula.
Preguntarlo como opinión terminaba con David cobrando $55 a alguien que
no calificaba. Quien no tiene el pasaporte a la mano puede seguir con
«No la tengo a la mano ahora»: cuenta como primera vez y le queda una
bandera a David para confirmarlo.

El tipo de trámite y el servicio **se calculan una sola vez, el día de
la precalificación, y se guardan escritos** en las columnas `Tipo de
trámite` y `Servicio`. Si se recalcularan al abrir la página, un caso
que empezó como renovación se volvería primera vez solo a mitad del
trámite y el precio cambiaría después de que la persona ya lo vio.

La constante `MESES_RENOVACION = 12` existe igual en
`empezar/index.html` y `caso/index.html`; el Apps Script no recalcula
nada, solo lee lo guardado. Estas ventanas las mueven los consulados:
cuando cambie, se cambia en esos dos sitios.

**Schengen no tiene precio de renovación.** Cada solicitud se presenta
como nueva y el trabajo es el mismo, así que `schengen-renovacion`
cuesta los mismos $155. Existe como servicio aparte solo para dejar
registrado que la persona ya tuvo Schengen, que sí pesa en el caso.

**Un pago puede cubrir a varias personas, cada una con su precio.**
Pasa todo el tiempo: alguien llama por él, su esposa y sus hijos, y
dentro del grupo unos renuevan y otros van por primera vez. En
`caso/index.html`, antes del bloque de pago, la persona arma la lista:
de cada acompañante se piden el nombre, si ya tuvo la visa (con la
fecha de vencimiento, que decide su precio) y si alguna vez se la
negaron. El total es la suma y es lo que se muestra en el recuadro de
PayPhone.

El semáforo sigue siendo solo del titular: doce preguntas por cabeza es
donde la gente abandona. La pregunta de la negativa anterior sí se le
hace a cada acompañante porque es lo que puede hundir el trámite de
todos, cuesta un toque y si no aparece el día de la entrega de
documentos.

**Un código, un destino.** Si alguien del grupo va a otro país es otro
trámite y otro código: el formulario largo es distinto por destino.

El grupo se guarda en `Detalle del cobro` (legible), `Total a cobrar` y
`Solicitantes (datos)` (JSON, para la máquina). El formulario largo lee
ese JSON y **crea una ficha por persona ya con su nombre**, sin volver
a preguntarlo. Si el grupo cambia después de declarar el pago, la
página avisa que ese cobro va aparte: el total no se reescribe por
debajo de un pago ya hecho.

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

**`empezar/` no pinta el resultado: redirige a `caso/`.** La pantalla
de resultado y la página del caso son la misma cosa. Al terminar las 12
preguntas, `empezar/` guarda el caso, deja el resultado en
`sessionStorage` y hace `location.replace` a `caso/?c=CODIGO`, que
pinta al instante sin esperar al servidor. Así el semáforo, el pago y
el formulario están en una sola pantalla y el bloque de pago existe en
un solo archivo. El copy del semáforo y el mapa `CONSEJOS` viven en
`caso/index.html`, que es donde se leen.

**Los avisos de trabajo a David van por Telegram, no por correo.** Un
bot de Telegram. **El token NO va en el código: va en Configuración del
proyecto → Propiedades de la secuencia de comandos**, como
`TELEGRAM_TOKEN` y `TELEGRAM_CHAT_ID`. El repo es público y el Apps
Script está copiado en él; un secreto escrito ahí queda publicado. Vale
para cualquier credencial futura. Motivo: el correo se lee tarde, y WhatsApp es de donde
este proyecto le está sacando el trabajo — un aviso ahí se pierde entre
los mensajes de clientes. Telegram es una bandeja que solo tiene esto.
Mientras las constantes estén vacías, los avisos caen al correo, que no
es el modo final. Los correos a la PERSONA (su código, su página, la
confirmación de pago) no cambian.

**La bandeja del negocio es `Visatour.ec@proton.me`** (`CORREO_DAVID`
en el Apps Script), no el Gmail personal de David. Ahí caen los avisos
mientras no esté Telegram, y las respuestas de las personas a sus
correos (`replyTo`). Los correos igual **salen** desde
`davidubilluz83@gmail.com`, que es la cuenta que ejecuta el script:
Apps Script no deja cambiar el remitente. Cualquier cambio al script se
hace con la sesión de `davidubilluz83@gmail.com` abierta en Chrome.

WhatsApp quedó descartado por dos razones concretas: la Cloud API exige
plantillas aprobadas por Meta para mensajes que inicia el negocio, y el
número que se registra en la API deja de servir en la app normal — el
+593 99 896 1214 es al que le escriben los clientes, así que haría
falta un segundo número. No volver a proponerlo sin resolver eso.

**`appsscript.json` declara los `oauthScopes` a mano.** Está copiado en
`herramientas/appsscript.json`. Cuando esa lista es explícita, Apps
Script **no** deduce los permisos del código: si se agrega una llamada
a un servicio nuevo (`MailApp`, `UrlFetchApp`, `CalendarApp`…) y su
scope no está en la lista, falla en tiempo de ejecución y, como casi
todo va dentro de `try/catch`, falla en silencio. Ya pasó una vez: los
correos y el Excel adjunto se desplegaron sin permiso y no habrían
funcionado nunca. **Al agregar un servicio nuevo, actualizar también
este archivo y volver a autorizar.**

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

Los tres Excel de David están en `referencias/`
(`formulario-visa-americana.xlsx`, `-canadiense`, `-schengen`) y ya se
compararon campo por campo: el detalle está en
`docs/comparacion-excel-david.md`.

**Las preguntas de la web son la unión de los dos lados: lo que pide el
formulario oficial más lo que pide el Excel de David. No quitar nada de
ninguno de los dos.** Sus formatos de Canadá y Schengen están
incompletos frente a los formularios oficiales, así que alinear la web
a ellos le devolvería las llamadas telefónicas que el proyecto está
quitando. Lo que queda pendiente es lo contrario: **reordenar el Excel
que genera el Apps Script** para que salga en el orden de sus
secciones, con los campos extra al final en un bloque "Datos
adicionales del formulario oficial".

**En el expediente nada es opcional.** Todo campo visible se responde.
Si no es su caso, la persona toca **«No aplica»** debajo del campo (o
«Esta sección no aplica para mí» arriba, en secciones enteras como
universidad o postgrado; o «No aplica · no tengo ninguno» en las
tablas). David recibe "No aplica" escrito, nunca un hueco: un hueco no
le dice si el dato no aplica o si la persona no se tomó el trabajo, y
averiguarlo es una llamada. Es un botón y no texto a mano porque los
campos de fecha en el celular no dejan teclear. Los campos `req:true`
no tienen el botón: son los que siempre aplican. **No volver a marcar
campos como `opcional`.** La revisión final lleva a la persona a la
primera sección con huecos antes de dar la ficha por completa.

**Trabajos anteriores: mínimo dos, en los tres destinos** (tres con el
actual). La tabla abre dos espacios de entrada; si no tuvo trabajos,
«No aplica · no tengo ninguno» para la sección entera; si tuvo uno
solo, «Este no aplica» en el segundo. Lo controla `minimo` en la
definición de la tabla, y sirve para cualquier otra tabla que lo
necesite.

**Un botón no se deshabilita en silencio: se toca y dice qué falta.**
En el último paso de `empezar/` el botón estaba apagado hasta que los
cuatro datos fueran válidos, y la gente se quedaba trancada ahí sin
saber por qué — un espacio al final del correo, un ".com" que faltaba,
y el botón simplemente no reaccionaba. Ahora el botón siempre se puede
tocar; al tocarlo se revisa y el mensaje sale **junto al campo que está
mal**, con cómo se escribe bien, y la pantalla se desplaza hasta ahí.
El mensaje desaparece en cuanto la persona vuelve a escribir en ese
campo. Vale para cualquier formulario que se agregue: **nada de botones
apagados sin explicación.**

Los descuidos de tecleo que no cambian el dato se arreglan solos:
espacios (el teclado del celular los mete al autocompletar), mayúsculas
y el punto o la coma pegada al final del correo. Lo que falta no se
inventa: si no está el ".com", se le dice.

El nombre pide **dos palabras**: sin apellido, David tiene que llamar
para pedirlo.

**Siempre con un ejemplo.** Cada pregunta del expediente trae un ejemplo
concreto: dentro de la casilla vacía ("Ej: ...") y repetido en el
mensaje de error si la dejan en blanco. Viven en `EJEMPLOS`, en
`expediente/index.html`, con el texto de la pregunta como clave (un
mismo ejemplo sirve para los tres destinos). Datos inventados con forma
ecuatoriana: cédula de 10 dígitos, celular 09, dirección de Quito. **Al
agregar una pregunta, agregar su ejemplo.** La regla vale para todo
mensaje que le pida algo a la persona: si pide un formato, lo muestra.

**Schengen pide un correo por donde confirmar el trabajo.** En su
sección `laboral` van el nombre del jefe inmediato, su correo y el de
Recursos Humanos, y **al menos uno de los dos correos tiene que ser
real**: si los dos quedan en «No aplica», la sección no pasa. Los
consulados Schengen verifican el empleo escribiendo a la empresa, y un
teléfono que nadie contesta atrasa o tumba el caso. Es un pedido de
David (septiembre de 2026) y de momento solo para Schengen; EE.UU. y
Canadá siguen con el nombre del jefe y el teléfono.

Lo controla `regla` en la definición de la sección: una función que
recibe todos los datos de la persona y devuelve `{k, msg, regla:true}`
cuando algo que depende de **varios campos a la vez** no cuadra. Se
revisa después de los campos en blanco, y si es lo único que falla su
mensaje reemplaza al aviso de arriba (que diría «toca No aplica», que
es justo lo que la persona acaba de hacer). Sirve para cualquier otra
regla cruzada que haga falta.

**Los campos `tipo:"correo"` revisan el formato**, no solo que estén
llenos: un correo con un espacio o sin el ".com" se guardaba igual y
David se enteraba semanas después, cuando el mensaje rebotaba. Se
limpian solos los espacios, las mayúsculas y el punto final; lo que
falta no se inventa. Misma regla que en `empezar/`.

**Redes sociales: enlace completo, no el usuario** (`tipo:"url"`, se
valida que sea un perfil de esa red; `instagram.com/x` se completa solo
a `https://`). Se le pide dejar el perfil en público mientras dura el
trámite — **es un pedido de David, no un requisito oficial para la visa
de turismo**, y la página no dice que el consulado lo exija. La guía
paso a paso vive en `GUIA_REDES`; si hay un video, su URL va en
`VIDEO_REDES`.

Para agregar o cambiar una pregunta basta con editar el arreglo del
destino: los encabezados de la hoja, el mapa de etiquetas y la barra de
progreso salen todos de ahí. No hace falta tocar el Apps Script.

**En la ficha de David las fechas van en DD/MM/AAAA**, como piden sus
Excel: el formulario las guarda como AAAA-MM-DD (lo que da el
calendario del celular) y `fechaDavid` las convierte al escribir. Las
tablas de más de cuatro columnas salen en vertical, un bloque por
elemento ("Trabajo 1", "Trabajo 2"); antes se cortaban a cinco
columnas y se perdían datos. Las bandas se combinan de A a E con alto
fijo y **no hay fila congelada**: congelar el título lo repetía encima
del contenido al ver el archivo en el celular.

**El expediente se guarda como una hoja por persona**, no como una
fila. La pestaña se llama `CÓDIGO · Nombre` y lleva el formato de los
Excel de David: banda de título azul oscuro (`#1f3a5f`), secciones
numeradas en el orden de `ORDEN_DAVID`, la pregunta a la izquierda y la
**respuesta en amarillo** (`#fff9c4`) a la derecha, y las tablas con
cabecera azul media (`#3b6ea5`) sobre filas crema (`#fffde7`). Los
colores están medidos sobre los `.xlsx` de `referencias/`: en sus
formularios el amarillo significa "esto lo llena el aplicante", y aquí
le dice dónde mirar.

Antes cada persona era una fila de más de cien columnas en una pestaña
por destino. Se guardaba bien y no se podía leer. **No volver a esa
forma**: si David no puede leer el expediente de un vistazo, no sirve.

El mismo renderizador (`pintarFichaPersona`) arma la pestaña y el
archivo adjunto, así que no hay dos formatos que mantener. Si la
persona reenvía el expediente se reescribe su misma pestaña, no se crea
una segunda. El formato se aplica en bloque (`setBackgrounds` y
compañía sobre el rango entero), no celda por celda, porque cuatro
personas son miles de celdas y si no se pasa del límite de seis minutos
de Apps Script.

## Idioma

Todo el contenido público en español ecuatoriano, tuteo, frases cortas,
sin tecnicismos sin explicar.
