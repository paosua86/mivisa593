# -*- coding: utf-8 -*-
"""
Generador de las piezas de texto para TikTok — Mi Visa593.
1080x1920. Ejecutar:  python generar-imagenes.py
Las imagenes salen en la subcarpeta 'imagenes'.

Para cambiar un dato: editar la lista PIEZAS al final y volver a ejecutar.
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1080, 1920
MARGEN = 96

# Zona segura de TikTok: la interfaz tapa la franja de abajo (caption, usuario,
# musica) y la columna de la derecha (botones de like, comentar, compartir).
# Todo el contenido tiene que vivir dentro de estos limites o se pierde.
SAFE_TOP = 280
SAFE_BOTTOM = 1430
COL_VALOR = MARGEN + 430  # los valores de la lista NO van pegados al borde derecho

BG = (18, 18, 20)
TXT = (245, 245, 243)
TXT_TENUE = (150, 150, 155)
ACENTO = (214, 62, 62)
CAJA_BG = (30, 30, 34)

F_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
F_SEMI = "C:/Windows/Fonts/seguisb.ttf"
F_REG = "C:/Windows/Fonts/segoeui.ttf"
F_LIGHT = "C:/Windows/Fonts/segoeuil.ttf"

if not os.path.exists(F_SEMI):
    F_SEMI = F_BOLD


def fuente(ruta, tam):
    return ImageFont.truetype(ruta, tam)


def envolver(draw, texto, font, ancho_max):
    """Parte el texto en lineas que quepan en ancho_max."""
    lineas = []
    for parrafo in texto.split("\n"):
        if not parrafo.strip():
            lineas.append("")
            continue
        palabras, actual = parrafo.split(" "), ""
        for p in palabras:
            prueba = (actual + " " + p).strip()
            if draw.textlength(prueba, font=font) <= ancho_max:
                actual = prueba
            else:
                if actual:
                    lineas.append(actual)
                actual = p
        if actual:
            lineas.append(actual)
    return lineas


def alto_bloque(draw, texto, font, ancho_max, interlineado):
    return len(envolver(draw, texto, font, ancho_max)) * interlineado


def dibujar_bloque(draw, texto, font, ancho_max, x, y, interlineado, color):
    for linea in envolver(draw, texto, font, ancho_max):
        draw.text((x, y), linea, font=font, fill=color)
        y += interlineado
    return y


def construir(pieza, salida):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    ancho = W - MARGEN * 2

    f_titulo = fuente(F_BOLD, pieza.get("tam_titulo", 92))
    f_medio = fuente(F_REG, 46)
    f_destacado = fuente(F_SEMI, 50)
    f_lista = fuente(F_REG, 44)
    f_lista_fuerte = fuente(F_BOLD, 50)
    f_pie = fuente(F_LIGHT, 28)

    il_titulo = int(f_titulo.size * 1.14)
    il_medio = 66
    il_destacado = 70
    il_lista = 74

    # --- medir todo para centrar verticalmente el conjunto ---
    alto = alto_bloque(d, pieza["titulo"], f_titulo, ancho, il_titulo) + 60

    for parrafo in pieza.get("medio", []):
        alto += alto_bloque(d, parrafo, f_medio, ancho, il_medio) + 34

    if pieza.get("lista"):
        alto += 20 + len(pieza["lista"]) * il_lista + 24

    if pieza.get("destacado"):
        interno = alto_bloque(d, pieza["destacado"], f_destacado, ancho - 88, il_destacado)
        alto += 40 + interno + 76

    # el pie (fuente + firma) tambien cuenta: va dentro de la zona segura
    alto_pie = 46
    if pieza.get("fuente"):
        alto_pie += alto_bloque(d, pieza["fuente"], f_pie, ancho, 38) + 22

    y = SAFE_TOP + max(0, (SAFE_BOTTOM - SAFE_TOP - alto - alto_pie) // 2)

    # --- titulo ---
    y = dibujar_bloque(d, pieza["titulo"], f_titulo, ancho, MARGEN, y, il_titulo, TXT)
    y += 22
    d.rectangle([MARGEN, y, MARGEN + 108, y + 7], fill=ACENTO)
    y += 52

    # --- parrafos medios ---
    for parrafo in pieza.get("medio", []):
        y = dibujar_bloque(d, parrafo, f_medio, ancho, MARGEN, y, il_medio, TXT)
        y += 34

    # --- lista de datos ---
    if pieza.get("lista"):
        y += 14
        for etiqueta, valor, fuerte in pieza["lista"]:
            f = f_lista_fuerte if fuerte else f_lista
            c = TXT if fuerte else TXT_TENUE
            d.text((MARGEN, y), etiqueta, font=f, fill=c)
            d.text((COL_VALOR, y), valor, font=f, fill=ACENTO if fuerte else c)
            y += il_lista
        y += 24

    # --- caja destacada ---
    if pieza.get("destacado"):
        y += 26
        interno = alto_bloque(d, pieza["destacado"], f_destacado, ancho - 88, il_destacado)
        d.rounded_rectangle([MARGEN, y, W - MARGEN, y + interno + 76],
                            radius=14, fill=CAJA_BG)
        d.rectangle([MARGEN, y, MARGEN + 7, y + interno + 76], fill=ACENTO)
        dibujar_bloque(d, pieza["destacado"], f_destacado, ancho - 88,
                       MARGEN + 44, y + 38, il_destacado, TXT)
        y += interno + 76

    # --- pie: fuente y firma, justo debajo del contenido y dentro de la zona segura ---
    y_pie = y + 44
    if pieza.get("fuente"):
        for linea in envolver(d, pieza["fuente"], f_pie, ancho):
            d.text((MARGEN, y_pie), linea, font=f_pie, fill=TXT_TENUE)
            y_pie += 38
        y_pie += 22
    d.text((MARGEN, y_pie), "Mi Visa593  ·  David Ubilluz  ·  RUC 1803686656001",
           font=f_pie, fill=TXT_TENUE)

    img.save(salida, "PNG")
    print("OK  ->", salida)


PIEZAS = [
    {
        "archivo": "dia1-T2-42porciento.png",
        "titulo": "42,24 %",
        "tam_titulo": 168,
        "medio": ["Es la tasa de negación de visas B para ecuatorianos en el año fiscal 2025."],
        "lista": [
            ("2021", "15,68 %", False),
            ("2022", "17,51 %", False),
            ("2023", "26,67 %", False),
            ("2024", "36,99 %", False),
            ("2025", "42,24 %", True),
        ],
        "fuente": "Fuente: U.S. Department of State, adjusted refusal rate FY2025.",
    },
    {
        "archivo": "dia2-T1-etias.png",
        "titulo": "ETIAS no aplica a los ecuatorianos.",
        "tam_titulo": 88,
        "medio": [
            "Ecuador está en la lista de países que sí requieren visado Schengen.",
            "ETIAS es un permiso de 20 € para nacionalidades que ya estaban exentas de visa. Nosotros no estamos en ese grupo.",
        ],
        "destacado": "Si viste un video que decía lo contrario, ese video no estaba hablando de Ecuador.",
        "fuente": "Fuente: Comisión Europea, listado de países sujetos a visado Schengen.",
    },
    {
        "archivo": "dia4-T3-monto.png",
        "titulo": "No existe un monto mínimo en la cuenta.",
        "tam_titulo": 88,
        "medio": [
            "Para la visa de turismo americana no hay ninguna cifra publicada. Ninguna.",
            "Lo que se evalúa es coherencia entre tu vida, tus ingresos y el viaje que propones.",
        ],
        "destacado": "Y meter plata prestada el mes antes es exactamente lo que llama la atención.",
    },
    {
        "archivo": "dia5-T8-miercoles.png",
        "titulo": "Miércoles, 19:00.",
        "tam_titulo": 118,
        "medio": [
            "Es cuando se liberan las citas de España para las tres semanas siguientes. Se agotan rápido.",
        ],
        "destacado": "Las citas de emergencia existen solo por salud, congresos, reuniones o estudios. Por turismo no se otorgan.",
        # OJO: verificar el horario vigente en la web de BLS antes de publicar.
        # Esa advertencia es interna y NO debe aparecer en la imagen.
        "fuente": "Fuente: BLS Quito.",
    },
]

if __name__ == "__main__":
    carpeta = os.path.join(os.path.dirname(os.path.abspath(__file__)), "imagenes")
    os.makedirs(carpeta, exist_ok=True)
    for pieza in PIEZAS:
        construir(pieza, os.path.join(carpeta, pieza["archivo"]))
    print("\nListo. Carpeta:", carpeta)
