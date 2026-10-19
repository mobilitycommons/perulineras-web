"""Descarga y normalización de las fuentes de electrolineras del Perú.

Cada fuente devuelve una lista de registros con el mismo formato:

    {"id": "aap:12", "id_origen": "12", "nombre", "operador", "equipo",
     "direccion", "localidad", "lat", "lon", "precision" ("exacta"|"lugar"),
     "acceso" ("publico"|"clientes"|"privado"|None), "costo" ("gratuito"|"pago"|None),
     "horario", "estado" ("operativo"|"no_operativo"|None), "cargadores",
     "conectores_total", "potencia_max_kw", "conectores": [{tipo, corriente,
     cantidad, potencia_kw}], "url", "actualizado_origen"}

Los campos sin dato quedan en None: nunca se rellenan con supuestos.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

AGENTE = "perulineras-web (+https://github.com/mobilitycommons/perulineras-web)"


def _get(url, datos=None, cabeceras=None, timeout=60):
    req = urllib.request.Request(url, data=datos, headers={"User-Agent": AGENTE, **(cabeceras or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def _get_json(url, **kw):
    return json.loads(_get(url, **kw))


# --- Conectores y potencias -------------------------------------------------

# Claves compatibles con assets/mapa.js (etiquetas socket:* de OSM).
CORRIENTE = {
    "type1": "AC", "type2": "AC", "type2_cable": "AC", "gb_t": "AC", "schuko": "AC",
    "type1_combo": "DC", "type2_combo": "DC", "chademo": "DC", "gb_t_dc": "DC",
    "tesla_supercharger": "DC",
}


def tipos_conector(texto):
    """Reconoce tipos de conector en texto libre (español o inglés).

    Ej.: "C.A.: Tipo 2 (Mennekes) C.C.: GBT y CCS2" → ["type2", "gb_t_dc", "type2_combo"].
    """
    t = texto.lower()
    tipos = []

    def hay(patron):
        nonlocal t
        if re.search(patron, t):
            t = re.sub(patron, " ", t)
            return True
        return False

    # Los combinados primero, para que «CCS Combo T1» no cuente también como «Tipo 1».
    if hay(r"ccs\s*(combo\s*)?(t|type\s*|tipo\s*)?1|ccs\s*\(type 1\)"):
        tipos.append("type1_combo")
    if hay(r"ccs\s*(combo\s*)?(t|type\s*|tipo\s*)?2|ccs\s*\(type 2\)|\bccs\b"):
        tipos.append("type2_combo")
    if hay(r"chademo"):
        tipos.append("chademo")
    if re.search(r"gb[\s/-]?t", t):
        dc = re.search(r"(c\.c\.|\bdc\b)[^a]*gb[\s/-]?t", texto.lower())
        hay(r"gb[\s/-]?t\w*")
        tipos.append("gb_t_dc" if dc else "gb_t")
    if hay(r"(tipo|type)\s*1\b|j1772"):
        tipos.append("type1")
    if hay(r"(tipo|type)\s*2\s*\(tethered|(tipo|type)\s*2\b|mennekes"):
        tipos.append("type2")
    if hay(r"schuko|cee\s*7/4"):
        tipos.append("schuko")
    return tipos


def potencia_kw(texto):
    """Mayor potencia en kW mencionada en el texto ("2 x 7.4 kW" → 7.4)."""
    valores = [float(v.replace(",", ".")) for v in re.findall(r"(\d+(?:[.,]\d+)?)\s*kw", str(texto or "").lower())]
    return max(valores) if valores else None


def _conectores_sin_detalle(tipos, total, potencia):
    """Con un solo tipo se asignan cantidad y potencia; con varios se desconoce el reparto."""
    unico = len(tipos) == 1
    return [{
        "tipo": t, "corriente": CORRIENTE.get(t),
        "cantidad": total if unico else None,
        "potencia_kw": potencia if unico else None,
    } for t in tipos]


# --- Coordenadas desde enlaces de Google Maps ---------------------------------

class _SinRedireccion(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **kw):
        return None


def coordenadas_google(url):
    """Extrae (lat, lon) de un enlace de Google Maps; resuelve los enlaces cortos."""
    if not url:
        return None
    for patron, orden in ((r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", 1), (r"!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)", -1),
                          (r"@(-?\d+\.\d+),(-?\d+\.\d+)", 1)):
        m = re.search(patron, url)
        if m:
            a, b = (float(x) for x in m.groups())
            return (a, b) if orden == 1 else (b, a)
    if "goo.gl" in url:
        abridor = urllib.request.build_opener(_SinRedireccion)
        try:
            abridor.open(urllib.request.Request(url, headers={"User-Agent": AGENTE}), timeout=30)
        except urllib.error.HTTPError as e:
            destino = e.headers.get("Location")
            if destino and destino != url:
                return coordenadas_google(destino)
        except Exception as e:  # noqa: BLE001
            print(f"  aap: no se pudo resolver {url}: {e}", file=sys.stderr)
    return None


# --- AAP: padrón de electrolineras de la Asociación Automotriz del Perú --------

def descargar_aap(anterior=None):
    """https://aap.org.pe/electrolineras (API JSON que usa la propia página)."""
    filas = _get_json("https://aap.org.pe/api/electrolineras", cabeceras={"Accept": "application/json"})["data"]
    # Reutiliza las coordenadas ya resueltas si el enlace no cambió (evita consultar Google de nuevo).
    cache = {r["url_mapa"]: (r["lat"], r["lon"]) for r in (anterior or []) if r.get("url_mapa") and r.get("lat")}
    registros = []
    for f in filas:
        url_mapa = (f.get("mapa_url") or "").strip()
        coords = cache.get(url_mapa) or coordenadas_google(url_mapa)
        if url_mapa not in cache:
            time.sleep(0.5)
        tipos = tipos_conector(f.get("tipo_cargador") or "")
        total = f.get("conectores")
        pot = potencia_kw(f.get("potencia"))
        registros.append({
            "id": f"aap:{f['id']}", "id_origen": str(f["id"]),
            "nombre": (f.get("nombre") or "").strip() or None,
            "operador": None,
            "equipo": re.sub(r"\s+,", ",", (f.get("marca") or "").strip()) or None,
            "direccion": (f.get("direccion") or "").strip() or None,
            "localidad": (f.get("ciudad") or "").strip().title() or None,
            "lat": coords[0] if coords else None, "lon": coords[1] if coords else None,
            "precision": "lugar",  # el enlace apunta al establecimiento, no al cargador
            "acceso": None, "costo": None, "horario": None, "estado": None,
            "cargadores": f.get("cargadores"), "conectores_total": total,
            "potencia_max_kw": pot,
            "conectores": _conectores_sin_detalle(tipos, total, pot),
            "url": "https://aap.org.pe/electrolineras",
            "url_mapa": url_mapa or None,
            "texto_conectores": f.get("tipo_cargador"),
            "actualizado_origen": None,
        })
    return registros


# --- Open Charge Map -----------------------------------------------------------

OCM_EXPORT = "https://raw.githubusercontent.com/openchargemap/ocm-export/main/data"
OCM_ACCESO = {1: "publico", 4: "publico", 5: "publico", 7: "publico", 6: "clientes", 2: "privado", 3: "privado"}
OCM_NO_OPERATIVO = {100, 150, 200, 210}


def descargar_ocm(anterior=None):
    """Con OCM_API_KEY usa la API v3; sin clave, el export público de GitHub (openchargemap/ocm-export)."""
    clave = os.environ.get("OCM_API_KEY")
    ref = _get_json(f"{OCM_EXPORT}/referencedata.json")
    if clave:
        q = urllib.parse.urlencode({"countrycode": "PE", "maxresults": 5000, "compact": "true", "verbose": "false", "key": clave})
        pois = _get_json(f"https://api.openchargemap.io/v3/poi/?{q}")
    else:
        lista = _get_json("https://api.github.com/repos/openchargemap/ocm-export/contents/data/PE")
        pois = [_get_json(f"{OCM_EXPORT}/PE/{a['name']}") for a in lista if a["name"].endswith(".json")]

    operadores = {o["ID"]: o["Title"] for o in ref["Operators"]}
    tipos = {c["ID"]: c["Title"] for c in ref["ConnectionTypes"]}
    proveedores = {p["ID"]: p for p in ref["DataProviders"]}
    registros = []
    for p in sorted(pois, key=lambda p: p["ID"]):
        a = p.get("AddressInfo") or {}
        conectores = []
        for c in p.get("Connections") or []:
            t = tipos_conector(tipos.get(c.get("ConnectionTypeID"), ""))
            tipo = t[0] if t else (tipos.get(c.get("ConnectionTypeID")) or "desconocido")
            conectores.append({"tipo": tipo, "corriente": CORRIENTE.get(tipo),
                               "cantidad": c.get("Quantity") or 1, "potencia_kw": c.get("PowerKW")})
        # Agrupa conectores iguales.
        agrupados = {}
        for c in conectores:
            k = (c["tipo"], c["potencia_kw"])
            agrupados.setdefault(k, {**c, "cantidad": 0})["cantidad"] += c["cantidad"]
        conectores = list(agrupados.values())
        potencias = [c["potencia_kw"] for c in conectores if c["potencia_kw"]]
        proveedor = proveedores.get(p.get("DataProviderID"), {})
        registros.append({
            "id": f"ocm:{p['ID']}", "id_origen": str(p["ID"]),
            "nombre": a.get("Title"),
            "operador": operadores.get(p.get("OperatorID")) if p.get("OperatorID") not in (None, 1, 44, 45) else None,
            "equipo": None,
            "direccion": a.get("AddressLine1"),
            "localidad": a.get("Town"),
            "lat": a.get("Latitude"), "lon": a.get("Longitude"), "precision": "exacta",
            "acceso": OCM_ACCESO.get(p.get("UsageTypeID")),
            "costo": None, "horario": None,
            "estado": "no_operativo" if p.get("StatusTypeID") in OCM_NO_OPERATIVO else
                      "operativo" if p.get("StatusTypeID") in (10, 20, 50, 75) else None,
            "cargadores": p.get("NumberOfPoints"),
            "conectores_total": sum(c["cantidad"] for c in conectores) or None,
            "potencia_max_kw": max(potencias) if potencias else None,
            "conectores": conectores,
            "url": f"https://openchargemap.org/site/poi/details/{p['ID']}",
            "proveedor_datos": proveedor.get("Title"),
            "licencia": proveedor.get("License"),
            "actualizado_origen": (p.get("DateLastVerified") or p.get("DateLastStatusUpdate") or "")[:10] or None,
        })
    return registros


# --- OpenStreetMap (Overpass) --------------------------------------------------

OVERPASS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
CONSULTA_OSM = """
[out:json][timeout:180];
area["ISO3166-1"="PE"][admin_level=2]->.pe;
nwr["amenity"="charging_station"](area.pe);
out center tags meta;
"""
OSM_ACCESO = {"yes": "publico", "public": "publico", "customers": "clientes",
              "private": "privado", "no": "privado", "permit": "privado", "delivery": "privado"}


def descargar_osm(anterior=None):
    datos = urllib.parse.urlencode({"data": CONSULTA_OSM}).encode()
    for intento in range(4):
        for url in OVERPASS:
            try:
                elementos = json.loads(_get(url, datos=datos, timeout=200))["elements"]
                break
            except Exception as e:  # noqa: BLE001 - probamos otro servidor
                print(f"  {url}: {e}", file=sys.stderr)
        else:
            time.sleep(15 * (intento + 1))
            continue
        break
    else:
        raise RuntimeError("No se pudo descargar desde Overpass.")

    registros = []
    for el in sorted(elementos, key=lambda e: (e["type"], e["id"])):
        t = el.get("tags", {})
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        conectores = []
        for k, v in t.items():
            partes = k.split(":")
            if len(partes) == 2 and partes[0] == "socket":
                tipo = partes[1]
                conectores.append({"tipo": tipo, "corriente": CORRIENTE.get(tipo),
                                   "cantidad": int(v) if v.isdigit() else None,
                                   "potencia_kw": potencia_kw(t.get(f"socket:{tipo}:output"))})
        potencias = [c["potencia_kw"] for c in conectores if c["potencia_kw"]]
        calle = " ".join(x for x in (t.get("addr:street"), t.get("addr:housenumber")) if x)
        registros.append({
            "id": f"osm:{el['type']}/{el['id']}", "id_origen": f"{el['type']}/{el['id']}",
            "nombre": t.get("name"),
            "operador": t.get("operator") or t.get("network") or t.get("brand"),
            "equipo": None,
            "direccion": calle or None,
            "localidad": t.get("addr:city"),
            "lat": lat, "lon": lon, "precision": "exacta",
            "acceso": OSM_ACCESO.get(t.get("access")),
            "costo": {"no": "gratuito", "yes": "pago"}.get(t.get("fee")),
            "horario": t.get("opening_hours"),
            "estado": "no_operativo" if t.get("disused:amenity") or t.get("operational_status") in ("closed", "broken") else None,
            "cargadores": int(t["capacity"]) if t.get("capacity", "").isdigit() else None,
            "conectores_total": sum(c["cantidad"] or 0 for c in conectores) or None,
            "potencia_max_kw": max(potencias) if potencias else None,
            "conectores": conectores,
            "url": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
            "actualizado_origen": (el.get("timestamp") or "")[:10] or None,
        })
    return registros


DESCARGADORES = {"aap": descargar_aap, "ocm": descargar_ocm, "osm": descargar_osm}
