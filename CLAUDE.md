# Mi Visa593 — instrucciones del proyecto

Asesoría de visas de turismo en Ecuador. Estados Unidos, Canadá y Schengen.
Titular del negocio: **David Ubilluz** · Quito · WhatsApp +593 99 896 1214
Repo: `github.com/paosua86/mivisa593` · TikTok: `@mivisaec`

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
├── empezar/               Formulario de precalificación (paso 1)
├── docs/                  Documentos internos de trabajo
│   └── estrategia/        Copy, guiones, calendario, mapa de dolor
├── referencias/           Originales del cliente (Excel, Word). NO editar.
├── imagenes/              Gráficos para redes
└── herramientas/          Scripts de apoyo
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
| Estados Unidos (B1/B2) | $47 | $40 |
| Canadá (visitante) | $95 | $75 |
| Schengen | $145 | — |

Arancel consular EE.UU.: $185, en la plataforma del consulado o en
efectivo en Banco de Guayaquil.

**Pagos:** PayPhone. No Stripe (el negocio es solo Ecuador).
**Agenda:** Horarios de citas de Google Calendar. No Cal.com.
**Facturación:** electrónica SRI, pendiente de integrar.

**El objetivo del proyecto es recuperarle tiempo a David**, no escalar
volumen. El precio se revisa más adelante, no ahora.

**El CTA de la landing es el formulario, NO WhatsApp.**
Es el punto central del proyecto: hoy cada consulta cae en el teléfono
de David y le consume el día. WhatsApp aparece solo al final de la
página, como salvavidas para quien no logre llenar el formulario.
La landing anterior tenía 7 CTAs a WhatsApp; se reemplazó a propósito.

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

---

## Contexto técnico

- Público: ecuatorianos, mayoría no técnicos, 90%+ desde el celular.
- Móvil primero. Texto grande. Botones grandes. Una sola columna.
- Formularios: una pregunta por pantalla, botones en vez de campos de
  texto libre siempre que se pueda, guardado automático.
- Sin dependencias externas ni paso de build: HTML/CSS/JS planos,
  publicables en GitHub Pages tal cual.
- Datos personales (pasaportes, cédulas, sueldos): aplica la LOPDP
  ecuatoriana. Antes de guardar datos reales hacen falta aviso de
  privacidad, consentimiento explícito, política de retención y cifrado.

## Idioma

Todo el contenido público en español ecuatoriano, tuteo, frases cortas,
sin tecnicismos sin explicar.
