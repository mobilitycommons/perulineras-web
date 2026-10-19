#!/usr/bin/env python3
"""Base de datos de electrolineras del Perú que alimenta el mapa de la web.

    python3 scripts/electrolineras.py              # descargar + construir
    python3 scripts/electrolineras.py descargar [aap ocm osm]
    python3 scripts/electrolineras.py construir

Flujo:
  1. descargar  → data/fuentes/<fuente>.json  (instantánea normalizada por fuente, versionada en git)
  2. construir  → une las fuentes con la capa manual data/curado/*.json, deduplica y genera
                  data/electrolineras.sqlite (BD completa, no versionada) y
                  data/electrolineras.geojson (solo estaciones publicables, lo que lee assets/mapa.js).

Variables de entorno: OCM_API_KEY (opcional; sin ella se usa el export público de Open Charge Map).
"""
import json
import math
import sqlite3
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fuentes import CORRIENTE, DESCARGADORES  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
DATOS = RAIZ / "data"
FUENTES_DIR = DATOS / "fuentes"
CURADO = DATOS / "curado"
BD = DATOS / "electrolineras.sqlite"
GEOJSON = DATOS / "electrolineras.geojson"

UNION_AUTOMATICA_M = 100     # registros de distintas fuentes a menos de esta distancia = misma estación
POSIBLE_DUPLICADO_M = 2000   # hasta esta distancia se listan para revisión manual
PERU = (-18.5, -81.5, 0.1, -68.5)  # sur, oeste, norte, este: fuera de este recuadro la coordenada es un error

CAMPOS = ["nombre", "operador", "equipo", "direccion", "localidad", "acceso", "costo", "horario"]
FICHA_TECNICA = ["cargadores", "conectores_total", "potencia_max_kw", "conectores"]


def leer_json(ruta, defecto=None):
    return json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else defecto


def escribir_json(ruta, datos, compacto=False):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    texto = json.dumps(datos, ensure_ascii=False, separators=(",", ":")) if compacto else \
        json.dumps(datos, ensure_ascii=False, indent=1)
    ruta.write_text(texto + "\n", encoding="utf-8")


def distancia_m(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a["lat"], a["lon"], b["lat"], b["lon"]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


# --- descargar -----------------------------------------------------------------

def descargar(ids):
    hoy = date.today().isoformat()
    fallos = []
    for fid in ids or DESCARGADORES:
        ruta = FUENTES_DIR / f"{fid}.json"
        anterior = (leer_json(ruta) or {}).get("registros")
        print(f"Descargando {fid}…")
        try:
            registros = DESCARGADORES[fid](anterior=anterior)
        except Exception as e:  # noqa: BLE001 - se conserva la instantánea anterior
            print(f"  ERROR en {fid}: {e}. Se conserva la instantánea anterior.", file=sys.stderr)
            fallos.append(fid)
            continue
        sin_coord = [r["id"] for r in registros if r.get("lat") is None]
        escribir_json(ruta, {"fuente": fid, "consultado": hoy, "total": len(registros), "registros": registros})
        print(f"  {len(registros)} registros → {ruta.relative_to(RAIZ)}" +
              (f" ({len(sin_coord)} sin coordenadas: {', '.join(sin_coord)})" if sin_coord else ""))
    return fallos


# --- construir -----------------------------------------------------------------

class Conjuntos:
    """Union-find para agrupar registros de la misma estación."""

    def __init__(self, ids):
        self.padre = {i: i for i in ids}

    def raiz(self, i):
        while self.padre[i] != i:
            self.padre[i] = self.padre[self.padre[i]]
            i = self.padre[i]
        return i

    def unir(self, a, b):
        self.padre[self.raiz(a)] = self.raiz(b)

    def grupos(self):
        g = {}
        for i in self.padre:
            g.setdefault(self.raiz(i), []).append(i)
        return list(g.values())


def cargar():
    fuentes = {f["id"]: f for f in leer_json(CURADO / "fuentes.json")["fuentes"]}
    ajustes = leer_json(CURADO / "ajustes.json", {})
    registros = {}
    for fid in fuentes:
        inst = leer_json(FUENTES_DIR / f"{fid}.json")
        if inst:
            fuentes[fid]["consultado"] = inst["consultado"]
            for r in inst["registros"]:
                registros[r["id"]] = {**r, "fuente": fid}
    for r in ajustes.get("altas", []):
        registros[r["id"]] = {"conectores": [], **r, "fuente": "perulineras"}
    for rid, cambios in ajustes.get("correcciones", {}).items():
        if rid in registros:
            registros[rid].update(cambios)
        else:
            print(f"  Aviso: corrección para registro inexistente {rid}", file=sys.stderr)
    for rid, motivo in ajustes.get("excluir", {}).items():
        if rid in registros:
            registros[rid]["excluido"] = motivo
    for r in registros.values():
        if r.get("lat") is not None and not (PERU[0] <= r["lat"] <= PERU[2] and PERU[1] <= r["lon"] <= PERU[3]):
            print(f"  Aviso: {r['id']} tiene coordenadas fuera del Perú ({r['lat']}, {r['lon']}); se descartan. "
                  "Corrígelas en data/curado/ajustes.json.", file=sys.stderr)
            r["coordenadas_descartadas"] = [r["lat"], r["lon"]]
            r["lat"] = r["lon"] = None
    return fuentes, ajustes, registros


def agrupar(registros, ajustes):
    validos = [r for r in registros.values() if r.get("lat") is not None and not r.get("excluido")]
    separar = {frozenset(p) for p in ajustes.get("separar", [])}
    conj = Conjuntos(r["id"] for r in validos)
    candidatos = []
    for i, a in enumerate(validos):
        for b in validos[i + 1:]:
            if a["fuente"] == b["fuente"] or frozenset((a["id"], b["id"])) in separar:
                continue
            d = distancia_m(a, b)
            if d <= UNION_AUTOMATICA_M:
                conj.unir(a["id"], b["id"])
            elif d <= POSIBLE_DUPLICADO_M:
                candidatos.append((a["id"], b["id"], round(d)))
    for grupo in ajustes.get("unir", []):
        presentes = [g for g in grupo if g in conj.padre]
        if len(presentes) != len(grupo):
            print(f"  Aviso: 'unir' con registros inexistentes o sin coordenadas: {grupo}", file=sys.stderr)
        for g in presentes[1:]:
            conj.unir(presentes[0], g)
    grupos = conj.grupos()
    # Solo se listan candidatos que siguen en estaciones distintas.
    candidatos = [c for c in candidatos if conj.raiz(c[0]) != conj.raiz(c[1])]
    return grupos, candidatos


def consolidar(ids, registros, fuentes, ajustes):
    miembros = sorted((registros[i] for i in ids), key=lambda r: (fuentes[r["fuente"]]["prioridad"], r["id"]))
    publicables = [r for r in miembros if fuentes[r["fuente"]]["publicar"]]
    base = publicables or miembros

    est = {"id": "pl-" + miembros[0]["id"].replace(":", "-").replace("/", "-")}
    for c in CAMPOS:
        est[c] = next((r[c] for r in base if r.get(c)), None)
    coord = min(base, key=lambda r: (fuentes[r["fuente"]]["prioridad_coordenadas"], r["id"]))
    est.update(lat=round(coord["lat"], 6), lon=round(coord["lon"], 6), precision=coord.get("precision"))
    ficha = next((r for r in base if r.get("conectores")), None) or base[0]
    for c in FICHA_TECNICA:
        est[c] = ficha.get(c)
    corrientes = sorted({CORRIENTE.get(c["tipo"]) for c in est["conectores"] or []} - {None})
    est["corriente"] = "/".join(corrientes) or None

    motivo = None
    if not publicables:
        motivo = "Fuentes no publicables"
    elif any(r.get("acceso") == "privado" for r in base):
        motivo = "Acceso privado según " + ", ".join(r["id"] for r in base if r.get("acceso") == "privado")
    elif any(r.get("estado") == "no_operativo" for r in base):
        motivo = "No operativa según " + ", ".join(r["id"] for r in base if r.get("estado") == "no_operativo")
    est["publicada"] = motivo is None
    est["motivo_exclusion"] = motivo

    verif = [dict(v, registro=i) for i, v in ajustes.get("verificaciones", {}).items() if i in ids]
    est["verificacion"] = max(verif, key=lambda v: v["fecha"]) if verif else None
    est["registros"] = [r["id"] for r in miembros]
    est["_base"] = base
    return est


def escribir_bd(fuentes, registros, estaciones, candidatos):
    if BD.exists():
        BD.unlink()
    con = sqlite3.connect(BD)
    con.executescript((DATOS / "esquema.sql").read_text(encoding="utf-8"))
    con.executemany("INSERT INTO fuente VALUES (?,?,?,?,?,?,?,?)", [
        (f["id"], f["nombre"], f.get("url"), f.get("licencia"), f.get("atribucion"), int(f["publicar"]),
         f["prioridad"], f.get("consultado")) for f in fuentes.values()])
    for r in registros.values():
        con.execute("INSERT INTO registro VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (
            r["id"], r["fuente"], r.get("id_origen") or r["id"].split(":", 1)[1], r.get("nombre"), r.get("operador"),
            r.get("equipo"), r.get("direccion"), r.get("localidad"), r.get("lat"), r.get("lon"), r.get("precision"),
            r.get("acceso"), r.get("costo"), r.get("horario"), r.get("estado"), r.get("cargadores"),
            r.get("conectores_total"), r.get("potencia_max_kw"), r.get("url"), r.get("actualizado_origen"),
            r.get("excluido"), json.dumps(r, ensure_ascii=False)))
        con.executemany("INSERT INTO conector VALUES (?,?,?,?,?)", [
            (r["id"], c["tipo"], c.get("corriente"), c.get("cantidad"), c.get("potencia_kw")) for c in r.get("conectores") or []])
    for e in estaciones:
        con.execute("INSERT INTO estacion VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (
            e["id"], e["nombre"], e["operador"], e["equipo"], e["direccion"], e["localidad"], e["lat"], e["lon"],
            e["precision"], e["acceso"], e["costo"], e["horario"], e["cargadores"], e["conectores_total"],
            e["potencia_max_kw"], e["corriente"], int(e["publicada"]), e["motivo_exclusion"]))
        con.executemany("INSERT INTO estacion_registro VALUES (?,?)", [(e["id"], r) for r in e["registros"]])
        if e["verificacion"]:
            v = e["verificacion"]
            con.execute("INSERT INTO verificacion VALUES (?,?,?,?)", (e["id"], v["fecha"], v.get("fuente"), v.get("nota")))
    con.executemany("INSERT INTO posible_duplicado VALUES (?,?,?)", candidatos)
    con.commit()
    con.close()


def propiedades(e, fuentes):
    p = {k: e[k] for k in ["id", *CAMPOS, "cargadores", "conectores_total", "potencia_max_kw", "corriente", "precision"]
         if e.get(k) is not None}
    p["conectores"] = [{k: v for k, v in c.items() if v is not None} for c in e["conectores"] or []]
    # «actualizado»: fecha del dato en la fuente (si la da); la de consulta va en metadata.fuentes.
    p["fuentes"] = [{k: v for k, v in {
        "id": r["fuente"], "ref": r["id"], "url": r.get("url"), "actualizado": r.get("actualizado_origen"),
    }.items() if v} for r in e["_base"]]
    osm = next((r["id_origen"] for r in e["_base"] if r["fuente"] == "osm"), None)
    if osm:
        p["osm"] = osm
    if e["verificacion"]:
        p["verificacion"] = {k: e["verificacion"][k] for k in ("fecha", "fuente") if e["verificacion"].get(k)}
    return p


def construir():
    fuentes, ajustes, registros = cargar()
    grupos, candidatos = agrupar(registros, ajustes)
    estaciones = sorted((consolidar(g, registros, fuentes, ajustes) for g in grupos), key=lambda e: e["id"])
    escribir_bd(fuentes, registros, estaciones, candidatos)

    publicadas = [e for e in estaciones if e["publicada"]]
    usadas = sorted({f["id"] for e in publicadas for f in propiedades(e, fuentes)["fuentes"]},
                    key=lambda f: fuentes[f]["prioridad"])
    geo = {
        "type": "FeatureCollection",
        "metadata": {
            "actualizado": max((fuentes[f].get("consultado") or "" for f in usadas), default=date.today().isoformat()),
            "total": len(publicadas),
            "criterio": "Estaciones de fuentes públicas, deduplicadas; se excluyen las de acceso privado, "
                        "las reportadas como no operativas y los registros descartados en revisión.",
            "fuentes": [{k: fuentes[f].get(k) for k in ("id", "nombre", "url", "licencia", "atribucion", "consultado")}
                        for f in usadas],
        },
        "features": [{
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [e["lon"], e["lat"]]},
            "properties": propiedades(e, fuentes),
        } for e in publicadas],
    }
    escribir_json(GEOJSON, geo, compacto=True)

    sin_coord = [r["id"] for r in registros.values() if r.get("lat") is None and not r.get("excluido")]
    print(f"{len(registros)} registros → {len(estaciones)} estaciones; {len(publicadas)} publicadas en "
          f"{GEOJSON.relative_to(RAIZ)}; BD completa en {BD.relative_to(RAIZ)}")
    for f in fuentes.values():
        n = sum(1 for r in registros.values() if r["fuente"] == f["id"])
        if n:
            print(f"  {f['id']}: {n} registros (consultado {f.get('consultado', '—')})")
    for e in estaciones:
        if not e["publicada"]:
            print(f"  No publicada {e['id']} ({e['nombre']}): {e['motivo_exclusion']}")
    for rid in sin_coord:
        print(f"  Sin coordenadas (no entra al mapa): {rid} {registros[rid].get('nombre')}")
    for a, b, d in sorted(candidatos, key=lambda c: c[2]):
        print(f"  Revisar posible duplicado a {d} m: {a} «{registros[a].get('nombre')}» ↔ {b} «{registros[b].get('nombre')}»")


def main(args):
    orden = args[0] if args else "todo"
    if orden == "descargar":
        fallos = descargar(args[1:])
        sys.exit(1 if fallos else 0)
    if orden == "construir":
        construir()
    elif orden == "todo":
        fallos = descargar([])
        construir()
        sys.exit(1 if fallos else 0)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
