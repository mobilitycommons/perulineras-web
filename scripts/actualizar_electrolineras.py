#!/usr/bin/env python3
"""Descarga las electrolineras públicas del Perú desde OpenStreetMap (Overpass)
y genera data/electrolineras.geojson para el mapa de la web.

Uso:  python3 scripts/actualizar_electrolineras.py
"""
import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SALIDA = Path(__file__).resolve().parent.parent / "data" / "electrolineras.geojson"

SERVIDORES = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

CONSULTA = """
[out:json][timeout:180];
area["ISO3166-1"="PE"][admin_level=2]->.pe;
nwr["amenity"="charging_station"](area.pe);
out center tags;
"""

# Accesos que excluyen a la estación del mapa público.
ACCESO_NO_PUBLICO = {"private", "no", "customers", "permit", "delivery"}

CAMPOS = [
    "name", "operator", "brand", "network", "access", "fee", "opening_hours",
    "capacity", "addr:street", "addr:housenumber", "addr:city", "website",
]


def descargar():
    datos = urllib.parse.urlencode({"data": CONSULTA}).encode()
    cabeceras = {"User-Agent": "perulineras-web (+https://github.com/mobilitycommons/perulineras-web)"}
    for intento in range(6):
        for url in SERVIDORES:
            try:
                req = urllib.request.Request(url, data=datos, headers=cabeceras)
                with urllib.request.urlopen(req, timeout=200) as r:
                    return json.load(r)
            except Exception as e:  # noqa: BLE001 - reintentamos con otro servidor
                print(f"  {url}: {e}", file=sys.stderr)
        espera = 15 * (intento + 1)
        print(f"Reintentando en {espera}s…", file=sys.stderr)
        time.sleep(espera)
    sys.exit("No se pudo descargar desde Overpass.")


def conectores(tags):
    """Devuelve [{tipo, cantidad, potencia}] a partir de las etiquetas socket:*."""
    salida = []
    for k, v in tags.items():
        partes = k.split(":")
        if len(partes) == 2 and partes[0] == "socket":
            salida.append({
                "tipo": partes[1],
                "cantidad": v,
                "potencia": tags.get(f"socket:{partes[1]}:output"),
            })
    return salida


def main():
    elementos = descargar()["elements"]
    features = []
    for el in elementos:
        tags = el.get("tags", {})
        if tags.get("access") in ACCESO_NO_PUBLICO:
            continue
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if lat is None or lon is None:
            continue
        props = {c: tags[c] for c in CAMPOS if c in tags}
        props["conectores"] = conectores(tags)
        props["osm"] = f"{el['type']}/{el['id']}"
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
            "properties": props,
        })
    features.sort(key=lambda f: f["properties"]["osm"])
    geo = {
        "type": "FeatureCollection",
        "metadata": {
            "fuente": "OpenStreetMap (ODbL) vía Overpass API",
            "actualizado": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "criterio": "amenity=charging_station en Perú, excluyendo access=" + ",".join(sorted(ACCESO_NO_PUBLICO)),
        },
        "features": features,
    }
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(json.dumps(geo, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(features)} electrolineras públicas (de {len(elementos)} en OSM) → {SALIDA}")


if __name__ == "__main__":
    main()
