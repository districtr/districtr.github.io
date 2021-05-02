import mapboxgl from "mapbox-gl";
import MapboxCompare from 'mapbox-gl-compare';
import { unitBordersPaintProperty, getUnitColorProperty } from "../colors";
import Layer from "./Layer";
import { stateNameToFips, COUNTIES_TILESET, spatial_abilities } from "../utils";

mapboxgl.accessToken =
    "pk.eyJ1IjoiZGlzdHJpY3RyIiwiYSI6ImNqbjUzMTE5ZTBmcXgzcG81ZHBwMnFsOXYifQ.8HRRLKHEJA0AismGk2SX2g";

class MapSliderControl {
    constructor(activated) {
        this.activated = activated;
    }

    onAdd(map){
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = "mapboxgl-ctrl mapboxgl-ctrl-group map-slider-control";

        let btn1 = null,
            btn2 = null;

        if (this.activated) {
            btn1 = document.createElement('button');
            btn1.type = "button";
            btn1.title = "Stack layers mode";
            btn1.innerHTML = "<img src='/assets/layer_icon.svg'/>";
            this.container.appendChild(btn1);

            btn2 = document.createElement('button');
            btn2.innerHTML = "<img src='/assets/swiper_icon.svg'/>";
            btn2.type = "button";
            btn2.title = "Slide layers mode";
            this.container.appendChild(btn2);
        }

        return this.container;
    }
    onRemove(){
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}

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

        // Georgia specific
        let activated = false;
        if (document.getElementById("swipemap")) {
            document.getElementById("swipemap").style.display = "none";
        }
        this.swipemap = null;
        this.comparer = null;
        window.mapslide = null;

        activated = activated || (options && options.bounds && options.bounds[0][0] === -85.6052 && options.bounds[0][1] === 30.3558);
        const sliderOpt = new MapSliderControl(activated);
        this.map.addControl(sliderOpt, "top-left");

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

    return { units, unitsBorders };
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
            String(stateNameToFips[placeID.toLowerCase().replace("2020", "").replace("_bg", "")])
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

export function addLayers(map, swipemap, parts, tilesets, layerAdder, borderId) {
    for (let tileset of tilesets) {
        map.addSource(tileset.sourceLayer, tileset.source);
        if (swipemap) {
            swipemap.addSource(tileset.sourceLayer, tileset.source);
        }
    }
    const { units, unitsBorders } = addUnits(
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

    let swipeUnits = null,
        swipeUnitsBorders = null,
        swipePoints = null;

    if (swipemap) {
        let swipe_details = addUnits(
            swipemap,
            parts,
            tilesets.find(tileset => tileset.type === "fill"),
            layerAdder
        );
        swipeUnits = swipe_details.units;
        swipeUnitsBorders = swipe_details.unitsBorders;
        swipePoints = addPoints(
            swipemap,
            tilesets.find(tileset => tileset.type === "circle"),
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
    }

    const counties = addCounties(
        map,
        COUNTIES_TILESET,
        layerAdder,
        borderId
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

    return { units, unitsBorders, swipeUnits, swipeUnitsBorders, points, swipePoints, counties, bg_areas, precincts, new_precincts, tracts };
}
