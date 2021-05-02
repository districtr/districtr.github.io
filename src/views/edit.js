import { html, render } from "lit-html";
import { MapState } from "../map";
import {
    loadPlanFromURL,
    loadPlanFromJSON,
    loadPlanFromCSV,
    getContextFromStorage,
    navigateTo,
    savePlanToStorage
} from "../routes";
import Editor from "../models/Editor";
import { assignUnitsAsTheyLoad } from "../models/lib/assign";
import State from "../models/State";
import CommunityPlugin from "../plugins/community-plugin";
import DataLayersPlugin from "../plugins/data-layers-plugin";
import EvaluationPlugin from "../plugins/evaluation-plugin";
import PopulationBalancePlugin from "../plugins/pop-balance-plugin";
import MultiLayersPlugin from "../plugins/multi-layers-plugin";
import ToolsPlugin from "../plugins/tools-plugin";
import { spatial_abilities, boundsOfGJ } from "../utils";

function getPlugins(context) {
    if (context.units.coi2) {
        return [ToolsPlugin, MultiLayersPlugin, CommunityPlugin];
    } else if (context.problem.type === "community") {
        return communityIdPlugins;
    } else {
        return defaultPlugins;
    }
}

function getMapStyle(context) {
    if (context.problem.type === "community" && !["maricopa", "phoenix", "yuma", "seaz", "nwaz"].includes((context.place || {}).id) && !context.units.coi2) {
        return "mapbox://styles/mapbox/streets-v11";
    } else {
        return "mapbox://styles/mapbox/light-v10";
    }
}

const defaultPlugins = [
    ToolsPlugin,
    PopulationBalancePlugin,
    DataLayersPlugin,
    EvaluationPlugin
];
const communityIdPlugins = [ToolsPlugin, DataLayersPlugin, CommunityPlugin];

function getPlanURLFromQueryParam() {
    if (window.location.search.includes("url=")) {
        return window.location.search.split("url=")[1].split('&')[0].split("#")[0];
    } else {
        return "";
    }
}

function getPlanContext() {
    const planURL = getPlanURLFromQueryParam();
    let finalURLpage = window.location.pathname.split("/").slice(-1)[0];
    if (planURL.length > 0) {
        return loadPlanFromURL(planURL).catch(e => {
            // eslint-disable-next-line no-console
            console.error(`Could not load plan from ${planURL}`);
            navigateTo("/");
            // eslint-disable-next-line no-console
            console.error(e);
        });
    } else if (!["edit", "coi", "plan", "embedded"].includes(finalURLpage.toLowerCase())) {
        // remove token; save a new plan
        localStorage.removeItem("districtr_token_" + finalURLpage);
        // load JSON plan from DB
        if (isNaN(finalURLpage * 1)) {
            // original _id plans
            finalURLpage = '&_id=' + finalURLpage;
        }
        return loadPlanFromURL(`/.netlify/functions/planRead?id=${finalURLpage}`).catch(e => {
            console.error(`Could not load plan ${finalURLpage} from database`);
            navigateTo("/");
            console.error(e);
        });
    } else {
        return Promise.resolve(getContextFromStorage());
    }
}

function loadContext(context) {
    const root = document.getElementById("root");
    const showVRA = spatial_abilities(context.place.id).vra_effectiveness;
    root.className = "";
    render(
        html`
            <div id="comparison-container" class="mapcontainer">
              <div id="map" class="map"></div>
              <div id="swipemap" class="map"></div>
            </div>
            <div id="toolbar"></div>
            <div class="print-only print-summary"></div>
        `,
        root
    );
    const mapState = new MapState(
        "map",
        {
            bounds: context.units.bounds,
            fitBoundsOptions: {
                padding: {
                    top: 50,
                    right: context.units.coi2 ? 250 : showVRA ? 100 : 50,
                    left: 50,
                    bottom: 50
                }
            }
        },
        getMapStyle(context)
    );
    if (context.units.coi2) {
        document.body.className = "coi2";
    }
    if (showVRA) {
        document.body.className = "vra";
    }
    window.document.title = "Loading... | Districtr";

    // display shorter URL
    if (window.history && window.history.replaceState
        && getPlanURLFromQueryParam()
        && window.location.hostname !== 'localhost'
        && window.location.hash && window.location.hash === "#plan") {

        let shortPlanName = getPlanURLFromQueryParam().split("/");
        shortPlanName = shortPlanName[2].replace("-plans", "") + "/"
            + shortPlanName[3].split(".")[0]
            + window.location.search.replace("url=" + shortPlanName.join("/"), "");
        if (shortPlanName[shortPlanName.length - 1] === "?") {
            shortPlanName = shortPlanName.substring(0, shortPlanName.length - 1);
        }
        window.history.replaceState({}, "Districtr", shortPlanName);
    }

    // block of event handlers; drop a file onto the map
    function planHandler(f, callback) {
        let plan = f.getAsFile(),
            pname = plan.name.toLowerCase();
        if (pname.includes(".json") || pname.includes(".geojson") || pname.includes(".csv")) {
            let reader = new FileReader();
            reader.onload = (e) => {
                if (pname.includes(".json") || pname.includes(".geojson")) {
                    let planData = JSON.parse(reader.result);
                    if (planData.type === "Feature" || planData.type === "FeatureCollection") {
                        // load GeoJSON / Representable
                        let rnd = Math.round(Math.random() * 100000),
                            rnd_offset = 0;
                        if (planData.features) {
                          planData.features = planData.features.map(f => {
                            if (!f.id) {
                              f.id = rnd + rnd_offset;
                              rnd_offset++;
                            }
                            return f;
                          })
                        } else if (!planData.id) {
                          planData.id = rnd;
                        }

                        let bnd = boundsOfGJ(planData);
                        mapState.map.fitBounds([
                          [bnd[0], bnd[1]],
                          [bnd[2], bnd[3]]
                        ]);

                        if (callback) {
                            callback(planData);
                        }
                    }
                    if (document.querySelector("input[name=tabs]:checked")) {
                        localStorage.setItem(
                            "jsonload_viewstate",
                            document.querySelector("input[name=tabs]:checked").value
                        );
                    }
                    if (planData.plan) {
                        planData = planData.plan;
                    }
                    if (planData.place && (planData.place.id !== context.place.id)) {
                        let conf = window.confirm("Switch locations to load this plan file?");
                        if (!conf) {
                            return;
                        }
                    }
                    loadPlanFromJSON(planData).then(loadContext);
                } else {
                    // CSV
                    try {
                        loadPlanFromCSV(reader.result, context).then(loadContext);
                    } catch (e) {
                        window.alert(e.message);
                    }
                }
            };
            reader.readAsText(plan);
        }
    }
    document.body.ondrop = (ev) => {
        ev.preventDefault();

        let loadGJ = (gj) => {
          let lm = state.place.landmarks;
          lm.type = "geojson";
          if (!lm.data) {
            lm.data = { features: [] };
          } else if (!lm.data.features) {
            lm.data.features = [];
          }
          if (gj.features) {
            lm.data.features = lm.data.features.concat(gj.features);
          } else {
            lm.data.features.push(gj);
          }

          state.map.getSource("landmarklist").setData({
            type: "FeatureCollection",
            features: lm.data.features.filter(f => f.geometry.type !== "Point")
          });
          savePlanToStorage(state.serialize());
        };

        if (ev.dataTransfer.items && ev.dataTransfer.items.length) {
            planHandler(ev.dataTransfer.items[0], loadGJ);
        } else if (ev.dataTransfer.files && ev.dataTransfer.files.length) {
            planHandler(ev.dataTransfer.files[0], loadGJ);
        }
    };
    document.body.ondragover = (ev) => {
        ev.preventDefault();
    };

    let state;
    mapState.map.on("load", () => {
        state = new State(mapState.map, mapState.swipemap, context, () => {
            window.document.title = "Districtr";
        });
        if (context.assignment) {
            state.plan.assignment = context.assignment; // know loaded district assignments
        }
        let editor = new Editor(state, mapState, getPlugins(context));
        editor.render();
    });
}

export default function renderEditView() {
    getPlanContext().then(loadContext);
}
