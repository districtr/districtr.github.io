import { html, parts, render } from "lit-html";
import { toggle } from "../components/Toggle";
import { actions } from "../reducers/charts";
import Parameter from "../components/Parameter";
import OverlayContainer from "../layers/OverlayContainer";
import PartisanOverlayContainer from "../layers/PartisanOverlayContainer";
import DemographicsTable from "../components/Charts/DemographicsTable";
import LayerTab from "../components/LayerTab";
import Layer, { addBelowLabels } from "../map/Layer";
import Election from "../models/Election";
import { CoalitionPivotTable } from "../components/Charts/CoalitionPivotTable";

import { addAmerIndianLayer } from "../layers/amin_control";
import { addCountyLayer } from "../layers/counties";
import { addCurrentDistricts } from "../layers/current_districts";
import { spatial_abilities } from "../utils";


export default function DataLayersPlugin(editor) {
    const { state, toolbar } = editor;
    const showVRA = (state.plan.problem.type !== "community") && (spatial_abilities(state.place.id).vra_effectiveness);
    const tab = new LayerTab("layers", showVRA ? "Data" : "Data Layers", editor.store);

    const demoLayers = window.mapslide ? state.swipeLayers : state.layers;

    const districtsHeading =
        state.plan.problem.type === "community" ? "Communities" : "Districts";
    const districtMessage =
        state.plan.problem.type === "community"
            ? "Show my communities"
            : "Show districts";
    const districtNumberLabel = "Show " + (state.plan.problem.type === "community" ? "community" : "district")
        + " numbers";
    tab.addSection(
        () => html`
            <h4>${districtsHeading}</h4>
            ${toggle(districtMessage, true, checked => {
                let opacity = checked ? 0.8 : 0;
                state.units.setOpacity(opacity);
            })}
            ${(["chicago_community_areas", "alaska_blockgroups", "hawaii_blockgroups", "oregon_blockgroups",
                "colorado_blockgroups", "iowa_blockgroups", "georgia_blockgroups", "connecticut_blockgroups",
               "maryland_blockgroups", "ma_blockgroups", "michigan_blockgroups", "minnesota_blockgroups",
               "montana_blocks", "wyoming_blocks", "newhampshire_blockgroups",
             "new_mexico_blockgroups", "pennsylvania_blockgroups", "texas_blockgroups", "vermont_bg_blockgroups",
           "wisconsin_blockgroups", "virginia_blockgroups", "rhode_island_blockgroups", "utah_blockgroups",
            "ohio_blockgroups", "oklahoma_blockgroups", "arizona_blockgroups", "delaware_blockgroups",
              "maine_blockgroups", "louisiana_blockgroups"].includes(state.units.sourceId)
              || !spatial_abilities(state.place.id).number_markers
            ) ? null
                : toggle(districtNumberLabel, false, checked => {
                    if (checked) {
                        window.planNumbers.update(state);
                    }
                    let opacity = checked ? 1 : 0;
                    state.numbers.forEach((number) => {
                        number.setOpacity(Math.round(opacity))
                    });
                }, "toggle-district-numbers")}
        `
    );

    let smatch = (name) => {
      return name.toLowerCase().replace(/\s+/g, '').replace('_bg', '').replace('2020', '').replace('_', '');
    };

    if (smatch(state.place.state) === smatch(state.place.id) || showVRA || ["wisco2019acs", "mn2020acs", "ma"].includes(state.place.id)) {
        addCountyLayer(tab, state);
    }

    if (state.plan.problem.type === "community" && spatial_abilities(state.place.id).neighborhoods) {
        const noNames = "";
        state.map.setLayoutProperty('settlement-subdivision-label', 'text-field', noNames);
        state.map.setLayoutProperty('settlement-label', 'text-field', ["case",
            ["==", ["get", "type"], "hamlet"],
            "",
            ["get", "name"]
        ]);

        tab.addSection(() => toggle("Suggest neighborhood names", false, checked => {
            state.map.setLayoutProperty('settlement-subdivision-label', 'text-field', checked ? ["get", "name"]
                : noNames);
            state.map.setLayoutProperty('settlement-label', 'text-field', checked ? ["get", "name"]
                : ["case",
                ["==", ["get", "type"], "hamlet"],
                "",
                ["get", "name"]
            ]);
        }));
    }

    // city border within county
    if (["miamidade", "olmsted", "buncombe", "stlouis_mn"].includes(state.place.id)) {
        let miami = null,
            cityid = {
              miamidade: "miamifl",
              olmsted: "rochestermn",
              buncombe: "asheville",
              stlouis_mn: "duluth",
            },
            cityname = {
              miamidade: "City of Miami",
              olmsted: "Rochester",
              buncombe: "Asheville",
              stlouis_mn: "Duluth",
            };

        fetch(`/assets/city_border/${cityid[state.place.id]}.geojson`).then(res => res.json()).then((border) => {
            state.map.addSource('togglecity_border', {
                type: 'geojson',
                data: border
            });

            miami = new Layer(
                state.map,
                {
                    id: "togglecity_border",
                    source: "togglecity_border",
                    type: "line",
                    paint: {
                        "line-color": "#000",
                        "line-opacity": 0.7,
                        "line-width": 1.5
                    }
                }
            );
        });

        tab.addSection(
            () => html`
                <h4>${cityname[state.place.id]}</h4>
                ${toggle("Show boundary", true, (checked) => {
                    miami.setOpacity(
                        checked ? 0.7 : 0
                    );
                })}
            `
        );
    }

    if (state.place.id === "forsyth_nc") {
        let fnc_layer;
        fetch(`/assets/current_districts/forsyth_nc_muni.geojson`).then(res => res.json()).then((fnc) => {
            state.map.addSource('fnc', {
                type: 'geojson',
                data: fnc
            });

            fnc_layer = new Layer(state.map,
                {
                    id: 'fnc',
                    source: 'fnc',
                    type: 'line',
                    paint: { "line-color": "#000", "line-width": 2, "line-opacity": 0 }
                },
                addBelowLabels
            );
        });
        tab.addRevealSection(
            'Show Boundary',
            (uiState, dispatch) => html`
            ${toggle("Winston-Salem", false, checked => {
                let opacity = checked ? 1 : 0;
                fnc_layer && fnc_layer.setOpacity(opacity);
            })}`,
            {
                isOpen: false
            }
        );

    }

    if (state.place.id === "baltimore") {
        let fnc_layer;
        fetch(`/assets/current_districts/baltimore-precincts.geojson`).then(res => res.json()).then((fnc) => {
            state.map.addSource('fnc', {
                type: 'geojson',
                data: fnc
            });

            fnc_layer = new Layer(state.map,
                {
                    id: 'fnc',
                    source: 'fnc',
                    type: 'line',
                    paint: { "line-color": "#000", "line-width": 1.5, "line-opacity": 0 }
                },
                addBelowLabels
            );
        });
        tab.addSection(
            () => html`
            ${toggle("Voter Precincts", false, checked => {
                let opacity = checked ? 0.8 : 0;
                fnc_layer && fnc_layer.setOpacity(opacity);
            })}`
        );

    }

    let plan2010, plan2013, ush, plan2010_labels, plan2013_labels;
    if (["virginia", "lax"].includes(state.place.id)) {
        fetch(`/assets/current_districts/${state.place.id}_2010.geojson`).then(res => res.json()).then((va2010) => {
            state.map.addSource('va2010', {
                type: 'geojson',
                data: va2010
            });

            plan2010 = new Layer(state.map,
                {
                    id: 'va2010',
                    source: 'va2010',
                    type: 'line',
                    paint: { "line-color": "#000", "line-width": 2, "line-opacity": 0 }
                },
                addBelowLabels
            );

            if (state.place.id === "virginia") {
                fetch("/assets/current_districts/virginia_2013.geojson").then(res => res.json()).then((va2013) => {
                    state.map.addSource('va2013', {
                        type: 'geojson',
                        data: va2013
                    });

                    plan2013 = new Layer(state.map,
                        {
                            id: 'va2013',
                            source: 'va2013',
                            type: 'line',
                            paint: { "line-color": "#000", "line-width": 2, "line-opacity": 0 }
                        },
                        addBelowLabels
                    );
                });
            } else if (state.place.id === "lax") {
                fetch("/assets/current_districts/lax_senate.geojson").then(res => res.json()).then((va2013) => {
                    state.map.addSource('va2013', {
                        type: 'geojson',
                        data: va2013
                    });

                    plan2013 = new Layer(state.map,
                        {
                            id: 'va2013',
                            source: 'va2013',
                            type: 'line',
                            paint: { "line-color": "#000", "line-width": 2, "line-opacity": 0 }
                        },
                        addBelowLabels
                    );
                });
                fetch("/assets/current_districts/lax_congress.geojson").then(res => res.json()).then((lax_ush) => {
                    state.map.addSource('lax_ush', {
                        type: 'geojson',
                        data: lax_ush
                    });

                    ush = new Layer(state.map,
                        {
                            id: 'lax_ush',
                            source: 'lax_ush',
                            type: 'line',
                            paint: { "line-color": "#000", "line-width": 2, "line-opacity": 0 }
                        },
                        addBelowLabels
                    );
                });
            }
        });
    }

    // school zones and towns
    let schoolsLayer, school_labels, placesLayer, place_labels, precinctsLayer, precinct_labels;
    if (["ohcentral", "ohakron", "ohcin", "ohcle", "ohse", "ohtoledo", "indiana", "missouri", "newhampshire", "wisco2019acs", "wisconsin", "wisconsin2020", "michigan"].includes(state.place.id)) {
        let st = "oh";
        if (state.place.id === "indiana") {
          st = "in";
        } else if (state.place.id === "missouri") {
          st = "mo";
        } else if (state.place.id === "newhampshire") {
          st = "nh";
        } else if (["wisconsin", "wisc2020", "wisco2019acs"].includes(state.place.id)) {
          st = "wi";
        } else if (state.place.id === "michigan") {
          st = "mi";
        }
        fetch(`/assets/current_districts/${st}schools/${state.place.id}_schools.geojson`).then(res => res.json()).then((school_gj) => {
            state.map.addSource('school_gj', {
                type: 'geojson',
                data: school_gj
            });
            schoolsLayer = new Layer(state.map,
                {
                    id: 'school_gj',
                    source: 'school_gj',
                    type: 'line',
                    paint: { "line-color": "#000", "line-width": 2, "line-opacity": 0 }
                },
                addBelowLabels
            );

            fetch(`/assets/current_districts/${st}schools/${state.place.id}_schools_centroids.geojson`).then(res => res.json()).then((school_centroids) => {
                state.map.addSource('school_centroids', {
                    type: 'geojson',
                    data: school_centroids
                });

                school_labels = new Layer(state.map,
                    {
                      id: 'school_centroids',
                      source: 'school_centroids',
                      type: 'symbol',
                      layout: {
                        'text-field': [
                            'format',
                            ['get', 'NAME'],
                            {'font-scale': 0.75},
                        ],
                        'text-anchor': 'center',
                        'text-radial-offset': 0,
                        'text-justify': 'center'
                      },
                      paint: {
                        'text-opacity': 0
                      }
                    },
                    addBelowLabels
                );

                if (!["ohcentral", "indiana"].includes(state.place.id)) {
                  return;
                }
                fetch(`/assets/current_districts/${state.place.id}_places.geojson`).then(res => res.json()).then((places_gj) => {
                    state.map.addSource('places_gj', {
                        type: 'geojson',
                        data: places_gj
                    });

                    placesLayer = new Layer(state.map,
                        {
                          id: 'places_gj',
                          source: 'places_gj',
                          type: 'line',
                          paint: { "line-color": "#000", "line-width": 1.5, "line-opacity": 0 }
                        },
                        addBelowLabels
                    );
                    fetch(`/assets/current_districts/${state.place.id}_places_centroids.geojson`).then(res => res.json()).then((places_centroids) => {
                        state.map.addSource('places_centroids', {
                            type: 'geojson',
                            data: places_centroids
                        });

                        place_labels = new Layer(state.map,
                            {
                              id: 'places_centroids',
                              source: 'places_centroids',
                              type: 'symbol',
                              layout: {
                                'text-field': [
                                    'format',
                                    ['get', 'NAME'],
                                    {'font-scale': 0.75},
                                ],
                                'text-anchor': 'center',
                                'text-radial-offset': 0,
                                'text-justify': 'center'
                              },
                              paint: {
                                'text-opacity': 0
                              }
                            },
                            addBelowLabels
                        );
                    });
                });
            });
        });
    } else if (["elpasotx"].includes(state.place.id) && !state.units.sourceId.includes("precinct")) {
      fetch(`/assets/current_districts/${state.place.id}_precincts.geojson`).then(res => res.json()).then((precinct_gj) => {
          state.map.addSource('precinct_gj', {
              type: 'geojson',
              data: precinct_gj
          });
          precinctsLayer = new Layer(state.map,
              {
                  id: 'precinct_gj',
                  source: 'precinct_gj',
                  type: 'line',
                  paint: { "line-color": "#555", "line-width": 1.2, "line-opacity": 0 }
              },
              addBelowLabels
          );

          fetch(`/assets/current_districts/${state.place.id}_precincts_centroids.geojson`).then(res => res.json()).then((precinct_centroids) => {
              state.map.addSource('precinct_centroids', {
                  type: 'geojson',
                  data: precinct_centroids
              });

              precinct_labels = new Layer(state.map,
                  {
                    id: 'precinct_centroids',
                    source: 'precinct_centroids',
                    type: 'symbol',
                    layout: {
                      'text-field': [
                          'format',
                          ['get', 'VTD'],
                          {},
                      ],
                      'text-anchor': 'center',
                      'text-radial-offset': 0,
                      'text-justify': 'center'
                    },
                    paint: {
                      'text-opacity': 0
                    }
                  },
                  addBelowLabels
              );
          });
       });
    }

    if (state.place.id === "virginia") {
        const checkVAplan = () => {
            // console.log(document.getElementsByName("enacted"));
            plan2010 && plan2010.setOpacity(document.getElementById("va2010").checked ? 1 : 0);
            plan2013 && plan2013.setOpacity(document.getElementById("va2013").checked ? 1 : 0);
        };
        tab.addRevealSection(
            'Enacted Plans',
            (uiState, dispatch) => html`
              <label style="display:block;margin-bottom:8px;">
                <input type="radio" name="enacted" value="hidden" @change="${checkVAplan}" checked/>
                Hidden
              </label>
              <label style="display:block;margin-bottom:8px;">
                <input id="va2010" type="radio" name="enacted" value="2010" @change="${checkVAplan}"/>
                2003-2013 Congressional Plan
              </label>
              <label style="display:block;margin-bottom:8px;">
                <input id="va2013" type="radio" name="enacted" value="2013" @change="${checkVAplan}"/>
                2013-2017 Congressional Plan
              </label>`,
            {
                isOpen: false
            }
        );
    } else if (["ohcentral", "ohtoledo", "ohakron", "ohse", "ohcle", "ohcin", "indiana", "missouri", "newhampshire", "wisconsin", "wisconsin2020", "wisco2019acs", "michigan"].includes(state.place.id)) {
        const toggleSchoolsTownslayer = () => {
            // console.log(document.getElementsByName("enacted"));
            schoolsLayer && schoolsLayer.setOpacity(document.getElementById("schools").checked ? 1 : 0);
            school_labels && school_labels.setPaintProperty('text-opacity', document.getElementById("schools").checked ? 1 : 0);
            placesLayer && placesLayer.setOpacity(document.getElementById("towns").checked ? 1 : 0);
            place_labels && place_labels.setPaintProperty('text-opacity', document.getElementById("towns").checked ? 1 : 0);
        };
        tab.addRevealSection(
            'Boundaries',
            (uiState, dispatch) => html`
              <label style="display:block;margin-bottom:8px;">
                <input type="radio" name="enacted" @change="${toggleSchoolsTownslayer}" checked/>
                Hidden
              </label>
              ${["ohcentral", "indiana"].includes(state.place.id) ? html`<label style="display:block;margin-bottom:8px;">
                <input id="towns" type="radio" name="enacted" @change="${toggleSchoolsTownslayer}"/>
                Cities and Towns
              </label>` : ""}
              <label style="display:block;margin-bottom:8px;">
                <input id="schools" type="radio" name="enacted" @change="${toggleSchoolsTownslayer}"/>
                School Districts
              </label>`,
            {
                isOpen: true
            }
        );
    } else if (state.place.id === "lax") {
        tab.addRevealSection(
            'Enacted Plans',
            (uiState, dispatch) => html`
            ${toggle("State Assembly", false, checked => {
                let opacity = checked ? 1 : 0;
                plan2010 && plan2010.setOpacity(opacity);
            })}
            ${toggle("State Senate", false, checked => {
                let opacity = checked ? 1 : 0;
                plan2013 && plan2013.setOpacity(opacity);
            })}
            ${toggle("US House", false, checked => {
                let opacity = checked ? 1 : 0;
                ush && ush.setOpacity(opacity);
            })}`,
            {
                isOpen: false
            }
        );
    } else if (state.place.id === "elpasotx" && !state.units.sourceId.includes("precinct")) {
        tab.addRevealSection(
            'Boundaries',
            (uiState, dispatch) => html`
            ${toggle("Current Precincts", false, checked => {
                let opacity = checked ? 1 : 0;
                precinctsLayer && precinctsLayer.setOpacity(opacity);
                precinct_labels && precinct_labels.setPaintProperty('text-opacity', opacity);
            })}`,
            {
                isOpen: true
            }
        );
    }

    if (spatial_abilities(state.place.id).native_american) {
        addAmerIndianLayer(tab, state);
    }

    if (spatial_abilities(state.place.id).current_districts) {
        addCurrentDistricts(tab, state);
    }

    // alaska plan overlay
    if (state.place.id === 'alaska') {
        // fetch all five plans
        var planLayers = [];
        fetch(`/assets/current_districts/ak-overlays/plan1.geojson`).then(res => res.json()).then((plan1) => {
        fetch(`/assets/current_districts/ak-overlays/plan2.geojson`).then(res => res.json()).then((plan2) => {
        fetch(`/assets/current_districts/ak-overlays/plan3.geojson`).then(res => res.json()).then((plan3) => {
        fetch(`/assets/current_districts/ak-overlays/plan4.geojson`).then(res => res.json()).then((plan4) => {
        fetch(`/assets/current_districts/ak-overlays/plan5.geojson`).then(res => res.json()).then((plan5) => {
            
            // load into the tab
            let ps = [plan1, plan2, plan3, plan4, plan5]
            let colors = ['#000', '#E21D2D', '#90E21D', '#1DE2D2', '#6F1DE2']
            for (let i = 0; i < 5; i++) {
                var name = 'plan' + (i+1);
                state.map.addSource(name, {
                    type: 'geojson',
                    data: ps[i]
                });

                planLayers.push(new Layer(state.map,
                    {
                        id: name,
                        source: name,
                        type: 'line',
                        paint: { "line-color": colors[i], "line-width": 2, "line-opacity": 0 }
                    },
                    addBelowLabels
                ));
            }
        })})})})}); // closing all the fetch calls
        
        tab.addSection(() => html`
        <h4>Potential Plans</h4>
        <li>
            ${toggle(`Plan 1`, false, checked =>
                planLayers[0].setOpacity(
                    checked ? 1 : 0
                ),
                "plan1-visible"
            )}
        </li>
        <li>
            ${toggle(`Plan 2`, false, checked =>
                planLayers[1].setOpacity(
                    checked ? 1 : 0
                ),
                "plan2-visible"
            )}
        </li>
        <li>
            ${toggle(`Plan 3`, false, checked =>
                planLayers[2].setOpacity(
                    checked ? 1 : 0
                ),
                "plan3-visible"
            )}
        </li>
        <li>
            ${toggle(`Plan 4`, false, checked =>
                planLayers[3].setOpacity(
                    checked ? 1 : 0
                ),
                "plan4-visible"
            )}
        </li>
        <li>
            ${toggle(`Plan 5`, false, checked =>
                planLayers[4].setOpacity(
                    checked ? 1 : 0
                ),
                "plan5-visible"
            )}
        </li>
        `);
    }

    tab.addSection(() => html`<h4>Demographics</h4>`)

    let coalitionOverlays = [];
    if (spatial_abilities(state.place.id).coalition !== false) {
        window.coalitionGroups = {};
        let vapEquivalents = {
          NH_WHITE: 'WVAP',
          NH_BLACK: 'BVAP',
          HISP: 'HVAP',
          NH_ASIAN: 'ASIANVAP',
          NH_AMIN: 'AMINVAP',
          NH_NHPI: 'NHPIVAP',
          'NH_2MORE': '2MOREVAP',
          NH_OTHER: 'OTHERVAP'
        };

        const coalitionPivot = CoalitionPivotTable(
            "Coalition Builder",
            state.population,
            state.place.name,
            state.parts,
            state.units,
            true // totals only
        );

        tab.addRevealSection(
            "Coalition Builder",
            (uiState, dispatch) => html`
              ${Parameter({
                  label: "",
                  element: html`<div style="margin-top:8px">
                      ${state.population.subgroups.filter(sg => !sg.total_alt).map(sg => html`<div style="display:inline-block;border:1px solid silver;padding:4px;border-radius:4px;cursor:pointer;">
                          ${toggle(sg.name.replace(" population", ""), false, checked => {
                              window.coalitionGroups[sg.key] = checked;
                              window.coalitionGroups[vapEquivalents[sg.key]] = checked;
                              coalitionOverlays.forEach(cat => cat.overlay.repaint());
                              render(coalitionPivot(uiState, dispatch), document.getElementById("coalition-table"));
                            },
                            "toggle_" + sg.key
                          )}
                      </div>`)}
                  </div>`
              })}
              <div id="coalition-table">
                ${coalitionPivot(uiState, dispatch)}
              </div>
            `,
            {
                isOpen: false
            }
        );
    }

    let supportMultiYear = state.units.id.includes("blockgroup");
    if (state.place.id === "chicago" && state.units.id.includes("precinct")) {
      supportMultiYear = true;
    }

    const demographicsOverlay = new OverlayContainer(
        "demographics",
        demoLayers.filter(lyr => !lyr.background),
        state.population,
        "Show population",
        false, // first only (one layer)?
        (spatial_abilities(state.place.id).coalition === false) ? null : "Coalition population", // coalition subgroup
        (supportMultiYear ? spatial_abilities(state.place.id).multiyear : null) // multiple years
    );
    coalitionOverlays.push(demographicsOverlay);

    let vapOverlay = null;
    if (state.vap) {
        vapOverlay = new OverlayContainer(
            "vap",
            demoLayers.filter(lyr => !lyr.background),
            state.vap,
            "Show voting age population (VAP)",
            false,
            (spatial_abilities(state.place.id).coalition === false) ? null : "Coalition voting age population",
            false // multiple years? not on miami-dade
        );
        coalitionOverlays.push(vapOverlay);
    }
    if (state.cvap) {
        vapOverlay = new OverlayContainer(
            "cvap",
            demoLayers.filter(lyr => !lyr.background),
            state.cvap,
            "Show citizen voting age population (CVAP)",
            false,
            (spatial_abilities(state.place.id).coalition === false) ? null : "Coalition voting age population",
            false // multiple years? not on miami-dade
        );
        coalitionOverlays.push(vapOverlay);
    }

    tab.addRevealSection(
        "Race",
        (uiState, dispatch) => html`
            ${state.place.id === "lowell" ? "(“Coalition” = Asian + Hispanic)" : ""}
            ${demographicsOverlay.render()}
            ${vapOverlay ? vapOverlay.render() : null}
        `,
        {
            isOpen: true
        }
    );

    if (state.median_income || state.rent) {
        let incomeOverlay, rentOverlay;
        if (state.median_income) {
            incomeOverlay = new OverlayContainer(
                "income",
                state.layers.filter(lyr => lyr.id.includes("blockgroups")),
                state.median_income,
                "Show median income",
                true // first layer only
            );
        }
        if (state.rent) {
            let rentElec = new Election(
                "Test",
                state.rent.subgroups,
                state.parts,
            );
            rentOverlay = new PartisanOverlayContainer(
                "partisan",
                demoLayers.filter(lyr => !lyr.background),
                [rentElec],
                toolbar,
                "Show % renter",
            );
        }

        tab.addRevealSection(
            "Socioeconomic data" + (spatial_abilities(state.place.id).multiyear
              ? ` (${spatial_abilities(state.place.id).multiyear})`
              : ""
            ),
            (uiState, dispatch) => html`
              ${state.median_income ? incomeOverlay.render() : null}
              ${state.rent ?
                html`${rentOverlay.render()}
                <div class="color-legend" id="color-renter" style="display: block;visibility: hidden;">
                  <span class="gradientbar greenorange"></span>
                  <br>
                  <div class="notches" id="notches-vap">
                      <span class="notch">|</span>
                      <span class="notch">|</span>
                      <span class="notch">|</span>
                      <span class="notch">|</span>
                      <span class="notch">|</span>
                      <span class="notch">|</span>
                  </div>
                  <div id="percents-vap">
                      <span class="square">0%</span>
                      <span class="square">20%</span>
                      <span class="square">40%</span>
                      <span class="square">60%</span>
                      <span class="square">80%</span>
                      <span class="square">100%</span>
                  </div>` : null}
            `, {}
        );
    }

    if (state.elections.length > 0) {
        const partisanOverlays = new PartisanOverlayContainer(
            "partisan",
            demoLayers,
            state.elections,
            toolbar
        );
        tab.addRevealSection('Previous Elections',
            () => html`

                <div class="option-list__item">
                    ${partisanOverlays.render()}
                </div>
            `,
            {
              isOpen: true
            }
        );
    }

    toolbar.addTab(tab);
}
