import reducer from "../reducers";
import { render, html } from "lit-html";
import { MapState } from "../map";
import State from "../models/State";
import ToolsPlugin from "../plugins/tools-plugin";
import { loadPlanFromURL } from "../routes";
import { client } from "../api/client";
import { generateId } from "../utils";
import UIStateStore from "../models/UIStateStore";
import MiniToolbar from "../components/Toolbar/MiniToolbar";
import CommunityPlugin from "../plugins/community-plugin";

const plugins = [ToolsPlugin];

function getContext({ place, url, units, number, ...districtrModule }) {
    if (url) {
        return loadPlanFromURL(url);
    } else {
        const problem = {
            name: "Districts",
            pluralNoun: "Districts",
            type: "districts",
            numberOfParts: number,
            ...districtrModule
        };
        return client
            .get(`/places/${place}`)
            .then(r => r.json())
            .then(placeRecord => {
                let unitsRecord = placeRecord.units.find(
                    item => item.slug === units
                );
                return { place: placeRecord, problem, units: unitsRecord };
            });
    }
}

function getMapStyle(context) {
    if (context.problem.type === "community" && !["maricopa", "phoenix", "yuma", "seaz", "nwaz"].includes((context.place || {}).id) && !context.units.coi2) {
        return "mapbox://styles/mapbox/streets-v11";
    } else {
        return "mapbox://styles/mapbox/light-v10";
    }
}

export class EmbeddedDistrictr {
    constructor(target, districtrModule, options) {
        this.render = this.render.bind(this);
        const readOnly = options && options.readOnly;

        options = { style: "mapbox://styles/mapbox/light-v10" };

        const targetElement = document.getElementById(target);
        targetElement.classList.add("districtr__embed-container");
        const mapContainer = document.createElement("div");
        const mapContainerId = generateId(8);
        mapContainer.setAttribute("id", mapContainerId);
        mapContainer.style = "height: 100%; width: 100%";
        targetElement.appendChild(mapContainer);
        this.toolbarTarget = document.createElement("div");
        targetElement.appendChild(this.toolbarTarget);

        getContext(districtrModule)
            .then(context => {
                this.mapState = new MapState(
                    mapContainerId,
                    {
                        bounds: context.units.bounds,
                        fitBoundsOptions: {
                            padding: {
                                top: 50,
                                right: 50,
                                left: 50,
                                bottom: 50
                            }
                        }
                    },
                    getMapStyle(context)
                );

                this.mapState.map.on("load", () => {
                    // this.mapState.map.setMaxBounds(
                    //     this.mapState.map.getBounds()
                    // );

                    this.state = new State(
                        this.mapState.map,
                        null,
                        context,
                        () => null
                    );
                    if (context.assignment) {
                        this.state.plan.assignment = context.assignment; // know loaded district assignments

                        const paint_ids = Object.keys(context.assignment);
                        if (this.state.place.id === "michigan" && paint_ids.length <= 250) {
                          const placeID = this.state.units.id.includes("block") ? "michigan_bg" : "michigan";
                          const myurl = `//mggg.pythonanywhere.com/findBBox?place=${placeID}&`;
                          fetch(`${myurl}ids=${paint_ids.slice(0, 250).join(",")}`).then(res => res.json()).then((resp) => {
                            let bbox = resp[0];
                            if (bbox.includes(null)) {
                                if (this.state.place.landmarks && this.state.place.landmarks.data && this.state.place.landmarks.data.features && this.state.place.landmarks.data.features.length > 1) {
                                    // landmarks, no districts
                                    bbox = [180, -180, 90 -90];
                                } else {
                                    // no content, no zooming
                                    return;
                                }
                            }
                            if (this.state.place.landmarks && this.state.place.landmarks.data && this.state.place.landmarks.data.features) {
                              // landmarks + districts
                              this.state.place.landmarks.data.features.forEach((pt) => {
                                if (pt.geometry.type === "Point") {
                                  bbox[0] = Math.min(bbox[0], pt.geometry.coordinates[0]);
                                  bbox[2] = Math.min(bbox[2], pt.geometry.coordinates[1]);
                                  bbox[1] = Math.max(bbox[1], pt.geometry.coordinates[0]);
                                  bbox[3] = Math.max(bbox[3], pt.geometry.coordinates[1]);
                                }
                              });
                            }
                            this.mapState.map.fitBounds([[bbox[0], bbox[2]], [bbox[1], bbox[3]]]);
                          });
                        }
                    }

                    if (this.state.place.landmarks && this.state.place.landmarks.data && this.state.place.landmarks.data.features) {
                        new CommunityPlugin({ state: this.state, mapState: this.mapState });
                    }

                    if (!readOnly) {
                        this.store = new UIStateStore(reducer, {
                            toolbar: {
                                activeTab: "criteria",
                                dropdownMenuOpen: false
                            },
                            elections: {
                                activeElectionIndex: 0
                            },
                            charts: {}
                        });
                        this.toolbar = new MiniToolbar(this.store, this);

                        for (let plugin of plugins) {
                            plugin(this);
                        }

                        this.store.subscribe(this.render);
                        this.state.subscribe(this.render);
                    }
                });
            })
            .catch(e => {
                // eslint-disable-next-line no-console
                console.error(e);
                // render(
                //     html`
                //         <h4>An error occurred.</h4>
                //     `,
                //     targetElement
                // );
            });
    }
    get map() {
        return this.mapState.map;
    }
    render() {
        if (!this.toolbarTarget || !this.toolbar) {
            return;
        }
        render(this.toolbar.render(), this.toolbarTarget);
    }
}

window.Districtr = (target, districtrModule, options) =>
    new EmbeddedDistrictr(target, districtrModule, options);
