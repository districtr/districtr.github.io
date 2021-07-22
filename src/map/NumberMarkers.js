import Layer from "./Layer";
import { colorScheme } from "../colors";
import { spatial_abilities } from "../utils";

export default function NumberMarkers(state, brush, old=false) {
    const spacer = String.fromCharCode(8202) + String.fromCharCode(8202);

    state.numbers = [];
    if (!state.problem || !state.problem.numberOfParts) {
        console.log("no numberOfParts for NumberMarkers");
        return;
    }
    if (!spatial_abilities(state.place.id).number_markers) {
        console.log("not on NumberMarkers allowlist");
        return;
    }
    const sep = (state.place.id === "louisiana") ? ";" : ",";

    let numberMarkers = {},
        canv = document.createElement("canvas"),
        ctx = canv.getContext("2d"),
        i = 0,
        districts = [],
        dpr = 1, //window.devicePixelRatio || 1,
        map = state.units.map;
    canv.height = 50 * dpr;
    // ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#000";

    if (typeof ctx.ellipse === "undefined") {
        // IE helper
        return { update: () => {} };
    }

    while (i < state.problem.numberOfParts) {
        districts.push(i);
        i++;
    }
    districts.forEach((dnum) => {
        canv.width = 44 * dpr;
        ctx.fillStyle = "#fff";
        ctx.lineWidth = 0;
        ctx.arc(22, 22, 22, 0, 2 * Math.PI);
        ctx.fill();


        if (dnum >= 99) {
            ctx.font = '500 24px Source Sans Pro';
        } else {
            ctx.font = '500 32px Source Sans Pro';
        }
        let numtxt = String(dnum + 1).split("").join(spacer);
        if (state.place.id === "alaska" && state.problem && state.problem.name === "State Senate") {
          numtxt = 'ABCDEFGHIJKLMNOPQRST'.charAt(dnum);
        }
        let numwidth = Math.round(ctx.measureText(numtxt).width / 2);
        // ctx.shadowColor = "#000";
        // ctx.shadowBlur = 5;
        ctx.lineWidth = 4;
        ctx.strokeText(numtxt, 22 - numwidth, 32);

        ctx.fillStyle = colorScheme[dnum % colorScheme.length];
        ctx.fillText(numtxt, 22 - numwidth, 32);

        map.addSource("number_source_" + dnum, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] }
        });
        map.loadImage(canv.toDataURL(), (err, numberimg) => {
            if (err) {
                throw err;
            }
            map.addImage("number_icon_" + dnum, numberimg);
            state.numbers.push(new Layer(
                map,
                {
                    id: "number_layer_" + dnum,
                    source: "number_source_" + dnum,
                    type: "symbol",
                    paint: {
                        "icon-opacity": 0
                    },
                    layout: {
                        "icon-image": "number_icon_" + dnum,
                        "icon-size": 0.75
                    }
                },
                (map, layer) => {
                    const layers = map.getStyle().layers;
                    map.addLayer(layer, layers[layers.length - 1].id);
                }
            ));
        });
    });

    const updater = (state, colorsAffected) => {
        let plan = state.plan,
            place = state.place.id,
            extra_source = (state.units.sourceId === "ma_precincts_02_10") ? "ma_02" : 0;
        if (state.units.sourceId === "ma_towns") {
            extra_source = "ma_towns";
        }
        if (state.units.sourceId === "indiana_precincts") {
            extra_source = "indianaprec";
        }
        if (state.place.id === "la_vra"){
            extra_source = "louisiana";
        }
        if (state.place.id === "tx_vra"){
            extra_source = "texas";
        }
        if (state.place.id === "elpasotx" && state.units.sourceId.includes("precincts")) {
            extra_source = "texas";
        }

        let placeID = extra_source || place;
        if (plan && plan.assignment) {
            let markers = {},
                seenDistricts = new Set();

            // figure out which units belong to colors affected by the edit
            Object.keys(plan.assignment).forEach((unit_id) => {
                if (plan.assignment[unit_id] === null) {
                    return;
                }
                let markDistrict = (district_num) => {
                    seenDistricts.add(district_num);
                    if (
                        (district_num || (district_num === 0))
                        && (!colorsAffected || colorsAffected.has(district_num))
                    ) {
                        if (markers[district_num]) {
                            markers[district_num].push(unit_id);
                        } else {
                            markers[district_num] = [unit_id];
                        }
                    }
                }
                if (Array.isArray(plan.assignment[unit_id])) {
                    plan.assignment[unit_id].forEach(markDistrict);
                } else {
                    markDistrict(Number(plan.assignment[unit_id]));
                }
            });

            let moveMarkers = Object.keys(markers);
            function check_district(d_index) {
                // up to 100 random GEOIDs in GET url
                // have requested help to POST
                let district_num = moveMarkers[d_index];
                let filterOdds = 100 / markers[district_num].length;
                if (filterOdds < 1) {
                    markers[district_num] = markers[district_num].filter(() => (Math.random() < filterOdds));
                }
                
                const units = state.unitsRecord.unitType;
                const stateName = state.place.state;
                const assign = markers[district_num];
                // console.log(assign);
                // console.log(stateName);
                // console.log(units);
                fetch("https://gvd4917837.execute-api.us-east-1.amazonaws.com/district_center", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        "state": stateName,
                        "units": units,
                        "dist_id": district_num,
                        "assignment": assign})
                })
                .then((res) => res.json())
                .catch((e) => console.error(e))
                .then((data) => {
                    if (numberMarkers[district_num]) {
                        numberMarkers[district_num].geometry.coordinates = data["coord"];
                    } else {
                        numberMarkers[district_num] = {
                            type: "Feature",
                            geometry: { type: "Point", coordinates: data["coord"] }
                        };
                    }
                    map.getSource("number_source_" + district_num).setData(numberMarkers[district_num]);
                    
                })
            } 
            
            function check_district_old(d_index) {
                // up to 100 random GEOIDs in GET url
                // have requested help to POST
                let district_num = moveMarkers[d_index];
                let filterOdds = 100 / markers[district_num].length;
                if (filterOdds < 1) {
                    markers[district_num] = markers[district_num].filter(() => (Math.random() < filterOdds));
                }
                const serverurl = `//mggg.pythonanywhere.com/findCenter?place=${placeID}&`;
                    // : `https://mggg-states.subzero.cloud/rest/rpc/merged_${placeID}?`
                fetch(`${serverurl}ids=${markers[district_num].join(sep)}`).then(res => res.json()).then((centroid) => {
                    while (centroid.length === 1) {
                        centroid = centroid[0];
                    }
                    if (typeof centroid === "object" && centroid[`merged_${placeID}`]) {
                        centroid = centroid[`merged_${placeID}`];
                    }
                    let latlng = centroid.split(" "),
                        lat = latlng[1].split(")")[0] * 1,
                        lng = latlng[0].split("(")[1] * 1;
                    if (numberMarkers[district_num]) {
                        numberMarkers[district_num].geometry.coordinates = [lng, lat];
                    } else {
                        numberMarkers[district_num] = {
                            type: "Feature",
                            geometry: { type: "Point", coordinates: [lng, lat] }
                        };
                    }
                    map.getSource("number_source_" + district_num).setData(numberMarkers[district_num]);
                }).catch(() => {console.log("Fetch failed")});
            }

            for (let d_index = 0; d_index < moveMarkers.length; d_index++) {
                console.log("old", old);
                old ? check_district_old(d_index) : check_district(d_index);
            }

            // remove a number marker if the district has no units left on the map
            Object.keys(numberMarkers).forEach((previous_dnum) => {
                if (!seenDistricts.has(1 * previous_dnum)) {
                    map.getSource("number_source_" + previous_dnum).setData({ type: "FeatureCollection", features: [] });
                }
            });
        }
    };
    // updater(state);
    return { update: updater };
}
