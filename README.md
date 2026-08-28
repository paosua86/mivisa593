# Mi Visa593

Asesoría de visas de turismo en Ecuador · Estados Unidos, Canadá y Schengen.
David Ubilluz · Quito · WhatsApp +593 99 896 1214

Sitio estático, sin dependencias ni paso de build. Se publica tal cual.

## Estructura

```
index.html        Landing pública
empezar/          Formulario de precalificación (paso 1 del proceso)
docs/             Documentos internos: copy, estrategia, rediseño de formularios
referencias/      Originales de David (Excel, Word). Solo lectura.
imagenes/         Gráficos para redes
herramientas/     Scripts de apoyo
CLAUDE.md         Reglas del proyecto y decisiones ya tomadas
```

`docs/` y `referencias/` están excluidos por `.gitignore`: son internos.

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

### Semáforo

| Puntos | Resultado |
|---|---|
| 6 o más | **Verde** — caso sólido |
| 2 a 5 | **Ámbar** — se puede trabajar, con puntos flojos |
| menos de 2 | **Rojo** — todavía no es su momento |

Dos reglas duras mandan por encima del puntaje:

- Visa negada hace menos de un año y sin cambios en el perfil → **rojo**.
- Sin pasaporte → nunca puede salir verde.

## Publicar

GitHub Pages, rama `main`, carpeta raíz.

## Pendiente

- Guardar los casos en una base de datos. Hoy el resultado se entrega por
  WhatsApp con el resumen ya escrito.
- Formulario de expediente completo (paso 4). Ver
  `docs/formularios-rediseno.md`.
- Webhook de PayPhone.
- Facturación electrónica SRI.
- Aviso de privacidad y política de retención (LOPDP).
