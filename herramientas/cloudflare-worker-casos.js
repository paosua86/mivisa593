/**
 * MiVisa EC — Intermediario entre el formulario y Google Sheets
 * =============================================================
 *
 * PARA QUÉ SIRVE
 * La página es estática, así que todo lo que ponga en su código lo puede
 * leer cualquiera. Este Worker guarda la URL de Google Apps Script como
 * variable de entorno del lado del servidor: el navegador nunca la ve.
 * La página llama al Worker, y el Worker reenvía el caso a la hoja.
 *
 * Además:
 *  - Solo acepta peticiones que vengan de nuestra propia página.
 *  - Limita el tamaño del envío.
 *  - Valida que el contenido tenga forma de caso real, no de basura.
 *
 * CÓMO INSTALARLO (15 minutos, una sola vez)
 *
 *  1. Crea una cuenta gratis en https://dash.cloudflare.com
 *
 *  2. En el panel: Compute (Workers) → Create → Start from Hello World
 *     → Deploy. Ponle de nombre "mivisaec-casos".
 *
 *  3. Entra al Worker → Edit code. Borra todo y pega este archivo.
 *     Deploy.
 *
 *  4. Worker → Settings → Variables and Secrets → Add:
 *       Tipo:   Secret
 *       Nombre: URL_HOJA
 *       Valor:  la URL de Apps Script que termina en /exec
 *     Guarda y vuelve a hacer Deploy.
 *
 *  5. Copia la URL del Worker. Se ve así:
 *       https://mivisaec-casos.TU-SUBDOMINIO.workers.dev
 *
 *  6. Pega ESA url en empezar/index.html, en ENDPOINT_GUARDADO.
 *     La de Google desaparece del código de la página.
 *
 *  7. Si algún día cambias de dominio, añádelo abajo en ORIGENES.
 *
 * COMPROBAR QUE FUNCIONA
 * Abre la URL del Worker en el navegador. Debe responder:
 *   {"ok":true,"mensaje":"Worker de MiVisa EC activo"}
 */

const ORIGENES = [
  "https://mivisaec.com",
  "https://www.mivisaec.com",
  "https://paosua86.github.io",
  "http://127.0.0.1:8899",
  "http://localhost:8899"
];

/* Campos que debe traer un caso de verdad. */
const OBLIGATORIOS = ["nombre", "telefono", "destino", "semaforo"];
const SEMAFOROS = ["verde", "ambar", "rojo"];
const MAX_BYTES = 8000;

export default {
  async fetch(request, env) {
    const origen = request.headers.get("Origin") || "";
    const permitido = ORIGENES.includes(origen);
    const cors = {
      "Access-Control-Allow-Origin": permitido ? origen : ORIGENES[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === "GET") {
      return json({ ok: true, mensaje: "Worker de MiVisa EC activo" }, 200, cors);
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Método no permitido" }, 405, cors);
    }

    if (origen && !permitido) {
      return json({ ok: false, error: "Origen no autorizado" }, 403, cors);
    }

    if (!env.URL_HOJA) {
      return json({ ok: false, error: "Falta configurar URL_HOJA" }, 500, cors);
    }

    const cuerpo = await request.text();

    if (cuerpo.length > MAX_BYTES) {
      return json({ ok: false, error: "Envío demasiado grande" }, 413, cors);
    }

    let datos;
    try {
      datos = JSON.parse(cuerpo);
    } catch (e) {
      return json({ ok: false, error: "JSON inválido" }, 400, cors);
    }

    for (const campo of OBLIGATORIOS) {
      if (!datos[campo] || typeof datos[campo] !== "string") {
        return json({ ok: false, error: "Falta el campo " + campo }, 400, cors);
      }
    }

    if (!SEMAFOROS.includes(String(datos.semaforo).toLowerCase())) {
      return json({ ok: false, error: "Semáforo inválido" }, 400, cors);
    }

    try {
      await fetch(env.URL_HOJA, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(datos),
        redirect: "follow"
      });
      return json({ ok: true }, 200, cors);
    } catch (e) {
      return json({ ok: false, error: "No se pudo guardar" }, 502, cors);
    }
  }
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json;charset=utf-8", ...cors }
  });
}
