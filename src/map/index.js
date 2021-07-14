import mapboxgl from "mapbox-gl";
import { unitBordersPaintProperty, getUnitColorProperty } from "../colors";
import Layer from "./Layer";
import { stateNameToFips, COUNTIES_TILESET, spatial_abilities } from "../utils";

mapboxgl.accessToken =
    "pk.eyJ1IjoiZGlzdHJpY3RyIiwiYSI6ImNqbjUzMTE5ZTBmcXgzcG81ZHBwMnFsOXYifQ.8HRRLKHEJA0AismGk2SX2g";

export class MapState {
    constructor(mapContainer, options, mapStyle) {
        this.map = new mapboxgl.Map({
            container: mapContainer,
            style: mapStyle,
            attributionControl: false,
            center: [-86.0, 37.83],
            zoom: 3,
            pitchWithRotate: false,
            dragRotate: false,
            preserveDrawingBuffer: true,
            dragPan: true,
            touchZoomRotate: true,
            ...options
        });
        this.nav = new mapboxgl.NavigationControl();
        this.map.addControl(this.nav, "top-left");
        this.mapboxgl = mapboxgl;
    }
}

function addUnits(map, parts, tileset, layerAdder) {
    const units = new Layer(
        map,
        {
            id: tileset.sourceLayer,
            source: tileset.sourceLayer,
            "source-layer": tileset.sourceLayer,
            type: "fill",
            paint: {
                "fill-color": getUnitColorProperty(parts),
                "fill-opacity": 0.8
            }
        },
        layerAdder
    );
    const unitsBorders = new Layer(
        map,
        {
            id: tileset.sourceLayer + "-borders",
            type: "line",
            source: tileset.sourceLayer,
            "source-layer": tileset.sourceLayer,
            paint: unitBordersPaintProperty
        },
        layerAdder
    );

    let coiunits, coiunits2;
    if (false) {
        const coisrc = tileset.sourceLayer.replace("precincts", "blockgroups").replace("counties", "blockgroups");
        coiunits = new Layer(
            map,
            {
                id: "browse_" + coisrc,
                source: coisrc,
                "source-layer": coisrc,
                type: "fill",
                paint: { "fill-opacity": 0.8, "fill-color": "rgba(0, 0, 0, 0)" }
            },
            layerAdder
        );
        coiunits2 = tileset.sourceLayer.includes("blockgroups") ? null : new Layer(
            map,
            {
                id: "browse_coinative",
                source: tileset.sourceLayer,
                "source-layer": tileset.sourceLayer,
                type: "fill",
                paint: { "fill-opacity": 0.8, "fill-color": "rgba(0, 0, 0, 0)" }
            },
            layerAdder
        );
    }

    return { units, unitsBorders, coiunits, coiunits2 };
}

function addPoints(map, tileset, layerAdder) {
    return new Layer(
        map,
        {
            id: tileset.sourceLayer + "-points",
            type: "circle",
            source: tileset.sourceLayer,
            "source-layer": tileset.sourceLayer,
            paint: {
                "circle-opacity": 0
            }
        },
        layerAdder
    );
}

function addPrecincts(map, tileset, layerAdder, newest) {
    return new Layer(map, {
        id: "extra-precincts" + (newest ? "_new" : ""),
        type: "fill",
        source: tileset.sourceLayer,
        "source-layer": tileset.sourceLayer,
        paint: {
            "fill-opacity": 0
        }
    });
}

function addTracts(map, tileset, layerAdder) {
    return new Layer(map, {
        id: "extra-tracts",
        type: "fill",
        source: tileset.sourceLayer,
        "source-layer": tileset.sourceLayer,
        paint: {
            "fill-opacity": 0
        }
    });
}

function addCounties(map, tileset, layerAdder, placeID) {
    map.addSource(tileset.sourceLayer, tileset.source);
    return new Layer(map, {
        id: "county-hover",
        type: "fill",
        source: tileset.sourceLayer,
        "source-layer": tileset.sourceLayer,
        paint: {
            "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.6,
                0
            ],
            "fill-color": "#aaa"
        },
        filter: [
            "==",
            ["get", "STATEFP"],
            String(stateNameToFips[placeID.toLowerCase().replace(" ", "")])
        ]
    },
    layerAdder);
}

function addBGs(map, tileset, layerAdder) {
    return new Layer(map, {
        id: "extra-bgs",
        type: "fill",
        source: tileset.sourceLayer,
        "source-layer": tileset.sourceLayer,
        background: true,
        paint: {
            "fill-opacity": 0
        }
    });
}

export function addLayers(map, swipemap, parts, tilesets, layerAdder, borderId, statename) {
    for (let tileset of tilesets) {
        map.addSource(tileset.sourceLayer, tileset.source);
    }
    if (borderId && spatial_abilities(borderId).load_coi && tilesets.length === 2 && !tilesets[0].sourceLayer.includes("blockgroups")) {
        const coibg = tilesets.find(t => t.type ==="fill");
        if (coibg) {
            map.addSource(
              coibg.sourceLayer.replace("precincts", "blockgroups").replace("counties", "blockgroups"),
              {
                type: "vector",
                url: coibg.source.url.replace("precincts", "blockgroups").replace("counties", "blockgroups"),
              }
            );
        }
    }
    const { units, unitsBorders, coiunits, coiunits2 } = addUnits(
        map,
        parts,
        tilesets.find(tileset => tileset.type === "fill"),
        layerAdder
    );
    const points = addPoints(
        map,
        tilesets.find(tileset => tileset.type === "circle"),
        layerAdder
    );
    let bg_areas = null;
    if (["yuma", "nwaz", "seaz", "maricopa", "phoenix"].includes(borderId)) {
        bg_areas = addBGs(
            map,
            tilesets.find(tileset => tileset.source.url.includes("blockgroups")),
            layerAdder
        );
    }

    let precincts, new_precincts, tracts;
    if (spatial_abilities(borderId).coi2 && tilesets[0].coi2) {
        precincts = addPrecincts(
            map,
            tilesets.find(tileset => tileset.source.url.includes("nc_precincts")),
            layerAdder,
            false
        );
        new_precincts = addPrecincts(
            map,
            tilesets.find(tileset => tileset.source.url.includes("norcar2_precincts")),
            layerAdder,
            true
        );
        tracts = addTracts(
            map,
            tilesets.find(tileset => tileset.source.url.includes("tracts")),
            layerAdder
        );
    } else if (["sacramento", "ca_sonoma", "ca_pasadena", "ca_santabarbara", "ca_goleta"].includes(borderId)) {
        tracts = addTracts(
            map,
            tilesets.find(tileset => tileset.source.url.includes("blockgroups")),
            layerAdder
        );
    }

    const counties = addCounties(
        map,
        COUNTIES_TILESET,
        layerAdder,
        statename
    );

    // cities in Communities of Interest will have a thick border
    if (spatial_abilities(borderId).border) {
        fetch(`/assets/city_border/${borderId}.geojson`)
            .then(res => res.json())
            .then((geojson) => {

            map.addSource('city_border', {
                type: 'geojson',
                data: {
                  type: "FeatureCollection",
                  features: geojson.features.map(f => f.geometry.type === "Polygon"
                      ? { type: "Feature", geometry: { type: "LineString", coordinates: f.geometry.coordinates[0] } }
                      : f)
                }
            });
            map.addSource('city_border_poly', {
                type: 'geojson',
                data: {
                  type: "FeatureCollection",
                  features: geojson.features.filter(f => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
                }
            });

            new Layer(
                map,
                {
                    id: "city_border",
                    source: "city_border",
                    type: "line",
                    paint: {
                        "line-color": "#000",
                        "line-opacity": 0.7,
                        "line-width": 1.5
                    }
                }
            );
            new Layer(
                map,
                {
                    id: "city_border_poly",
                    source: "city_border_poly",
                    type: "fill",
                    paint: {
                        "fill-color": "#444",
                        "fill-opacity": 0.3
                    }
                }
            );
        });
    }

    if (spatial_abilities(borderId).find_unpainted) {
      map.addSource('coi_focus', {
          type: 'geojson',
          data: {
            type: "FeatureCollection",
            features: []
          }
      });
      new Layer(
          map,
          {
              id: "coi_focus",
              source: "coi_focus",
              type: "line",
              paint: {
                  "line-color": "#000",
                  "line-width": 5,
                  "line-opacity": 0.8
              }
          }
      )
    }

    return { units, unitsBorders, coiunits, coiunits2, points, counties, bg_areas, precincts, new_precincts, tracts };
}
