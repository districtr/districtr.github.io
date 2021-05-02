import { html } from "lit-html";

import { PivotTable } from "../components/Charts/PivotTable";
import { CoalitionPivotTable } from "../components/Charts/CoalitionPivotTable";
import OverlayContainer from "../layers/OverlayContainer";
import MedianIncomeTable from "../components/Charts/MedianIncomeTable";
import DemographicsTable from "../components/Charts/DemographicsTable";
import { Tab } from "../components/Tab";
import { actions } from "../reducers/toolbar";
import AboutSection from "../components/AboutSection";
import { Landmarks } from "../components/Landmark";
import { toggle } from "../components/Toggle";
import { bindAll, spatial_abilities } from "../utils";
import { savePlanToStorage } from "../routes";

export default function CommunityPlugin(editor) {
    const { state, mapState } = editor;

    let tab, about;
    if (editor.store) {
        // skip this on embed
        addLocationSearch(mapState);

        tab = new Tab("community", "Drawing", editor.store);
        about = new AboutSection(editor);
        tab.addRevealSection("Areas of Interest", about.render);
    }

    let lm = state.place.landmarks;
    if (!lm.source && !lm.type) {
        // initialize a blank landmarks object
        // we cannot replace the object, which is used to remember landmarks
        lm.type = "geojson";
        lm.data = {"type": "FeatureCollection", "features": []};
    }
    // compatibility with old landmarks
    lm = lm.source || lm;
    lm.data.features = lm.data.features.filter(f => !f.number_id);

    let lmo;
    if (!state.map.landmarks) {
        window.selectLandmarkFeature = 0;
        state.map.landmarks = new Landmarks(state.map, lm, (isNew) => {
          // updateLandmarkList
          savePlanToStorage(state.serialize());

          if (lm.data.features.length) {
              document.querySelector("#landmark-instruction").innerText = "mouse over marker for info; edit below";
              document.querySelector("#landmark-instruction").style.visibility = "visible";
          }

          if (isNew) {
            window.selectLandmarkFeature = lm.data.features.length - 1;
            document.querySelector('.landmark-select .label').innerText = "New Point " + lm.data.features.length;
            document.querySelector(".marker-form").style.visibility = "visible";
            document.querySelector(".marker-form input").value = "New Point " + (window.selectLandmarkFeature + 1);
            document.querySelector(".marker-form textarea").value= "";

            lmo.setDescription(''); // triggers marker save
          } else if (window.selectLandmarkFeature >= 0 && lm.data.features.length) {
            const selected = lm.data.features[window.selectLandmarkFeature].properties;
            document.querySelector('.landmark-select .label').innerText = selected.name;
          }

          document.querySelector('.landmark-parameter').display = lm.data.features.length ? "flex" : "none";

          state.render();
        });
    }

    if (!editor.store) {
      // embed
      return;
    }

    lmo = new LandmarkOptions(
        state.map.landmarks,
        lm.data.features,
        state.map
    );
    tab.addRevealSection("Important Places", lmo.render.bind(lmo));

    const evaluationTab = new Tab("population", "Evaluation", editor.store);
    const populationPivot = PivotTable(
        "Population",
        state.population,
        state.place.name,
        state.parts,
        (spatial_abilities(state.place.id).coalition === false) ? false : "Coalition"
    );
    evaluationTab.addRevealSection("Population", populationPivot, {
        isOpen: true,
        activePartIndex: 0
    });
    if (state.vap && state.vap.subgroups.length > 1) {
        const vapPivot = PivotTable(
            "Voting Age Population",
            state.vap,
            state.place.name,
            state.parts,
            (spatial_abilities(state.place.id).coalition === false) ? false : "Coalition VAP"
        );
        evaluationTab.addRevealSection("Voting Age Population", vapPivot, {
            isOpen: false,
            activePartIndex: 0
        });
    }

    if (state.incomes && !["maricopa", "phoenix", "yuma", "seaz", "nwaz"].includes(state.place.id)) {
        evaluationTab.addRevealSection(
            'Household Income',
            (uiState, dispatch) =>  html`<div>
                ${MedianIncomeTable(
                    state.incomes,
                    state.activeParts,
                    uiState.charts["Median Income"],
                    dispatch
                )}
            </div>`,
            {
              isOpen: false
            }
        );
    }

    if (state.rent) {
        evaluationTab.addRevealSection(
            'Homeowner or Renter',
            (uiState, dispatch) => html`<div class="sectionThing">
                ${DemographicsTable(
                    state.rent.subgroups,
                    state.activeParts
                )}
            </div>`,
            {
              isOpen: false
            }
        );
    }

    editor.toolbar.addTabFirst(tab);
    editor.toolbar.addTab(evaluationTab);
    editor.store.dispatch(actions.changeTab({ id: "community" }));
}

function addLocationSearch(mapState) {
    return (
        fetch(
            "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.2.0/mapbox-gl-geocoder.min.js"
        )
            .then(r => r.text())
            // eslint-disable-next-line no-eval
            .then(eval)
            .then(() => {
                const bounds = mapState.map.getBounds();
                const bbox = [
                    bounds.getWest(),
                    bounds.getSouth(),
                    bounds.getEast(),
                    bounds.getNorth()
                ];
                // eslint-disable-next-line no-undef
                const geocoder = new MapboxGeocoder({
                    accessToken: mapState.mapboxgl.accessToken,
                    mapboxgl: mapState.mapboxgl,
                    enableEventLogging: false,
                    bbox
                });

                const container = document.createElement("div");
                container.className = "geocoder";
                mapState.map.getContainer().appendChild(container);
                container.appendChild(geocoder.onAdd(mapState.map));
            })
            .catch(e => {
                // eslint-disable-next-line no-console
                console.error("Could not load geocoder");
                // eslint-disable-next-line no-console
                console.error(e);
            })
    );
}

class LandmarkOptions {
    constructor(landmarks, features, map) {
        this.points = landmarks.points;
        this.drawTool = landmarks.drawTool;
        this.features = features;
        this.map = map;
        this.updateLandmarkList = landmarks.updateLandmarkList;

        bindAll(["onDelete", "setName", "setDescription", "saveFeature", "deleteFeature"],
            this);
    }
    // setName / setDescription: remember but don't yet save to map and localStorage
    setName(name) {
        let updateFeature = this.features[window.selectLandmarkFeature];
        updateFeature.properties.name = name;
        document.querySelector('.landmark-select .label').innerText = name;
        this.saveFeature(updateFeature.id);
    }
    setDescription(description) {
        let updateFeature = this.features[window.selectLandmarkFeature];
        updateFeature.properties.short_description = description;
        this.saveFeature(updateFeature.id);
    }
    saveFeature(feature_id) {
        // if this feature ID is currently move-able, we lock it
        this.features.forEach((feature) => {
            // if you draw multiple items without saving them
            // saving this feature will save all unsaved points
            // we need to remove their old IDs, too
            if (feature.number_id) {
                this.drawTool.trash(feature.id);
                feature.id = feature.number_id + "";
                delete feature.number_id;

                this.points.data.features.push(feature);
            }
        });

        // save names and locations
        this.map.getSource("landmarkpoints")
            .setData(this.points.data);
        this.updateLandmarkList();
    }
    deleteFeature(delete_id) {
      this.features.forEach((feature, index) => {
          if (feature.id === delete_id) {
              let deleteFeature = this.features.splice(index, 1);
              this.drawTool.trash(deleteFeature.id);

              // if point, also remove from the Points layer
              if (deleteFeature[0].geometry.type === 'Point') {
                  this.points.data.features.forEach((point, pindex) => {
                      if (point.id === delete_id) {
                          this.points.data.features.splice(pindex, 1);
                      }
                  });
              }
          }
      });
      this.map.getSource("landmarkpoints")
          .setData(this.points.data);
    }
    onDelete() {
        // delete currently viewed shape
        let deleteID = this.features[window.selectLandmarkFeature].id;
        this.deleteFeature(deleteID);
    }
    render() {
        let properties = this.features.map(feature => feature.properties);

        /*
        <button @click="${(e) => {
          window.selectLandmarkFeature = -1;
          this.updateLandmarkList();
        }}">Close</button>
        */

        return html`<ul class="option-list landmark-list">
        <li class="option-list__item">
          <div class="parameter">
              <button
                @click="${() => {
                  window.selectLandmarkFeature = -1;
                  document.querySelector("#tool-pan").click();
                  document.querySelector(".marker-form").style.visibility = "hidden";
                  document.querySelector(".mapboxgl-control-container .mapbox-gl-draw_point").click()
                  document.querySelector("#landmark-instruction").innerText = "activated - click map to place";
                  document.querySelector("#landmark-instruction").style.visibility = "visible";
                }}"
                title="New Marker"
                style="border: 2px solid #aaa;margin-left:auto;margin-right:auto;"
              >
                <img src="/assets/new_landmark.svg"/>
                New
              </button>
          </div>
          <div class="parameter">
              <span id="landmark-instruction" style="margin-left:auto;margin-right:auto;">activated - click map to place</span>
          </div>
        </li>
        <li class="option-list__item">
          <div class="parameter landmark-parameter" style="display: ${properties.length ? "flex" : "none"}">
            <label class="parameter__label ui-label ui-label--row">Select</label>
            <div class="custom-select-wrapper">
                <div class="custom-select landmark-select">
                    <div
                      class="custom-select__trigger"
                      @click="${(e) => { document.getElementsByClassName('landmark-select')[0].classList.toggle('open')}}"
                    >
                        <span class="label">${(properties.length && window.selectLandmarkFeature >= 0)
                            ? properties[window.selectLandmarkFeature].name
                            : "Select place"
                        }</span>
                        <div class="arrow"></div>
                    </div>
                    <div class="custom-options">
                      ${properties.map((p, idx) => html`<div @click="${() => {
                          window.selectLandmarkFeature = idx * 1;
                          document.getElementsByClassName('landmark-select')[0].classList.toggle('open');
                          document.querySelector('.landmark-select .label').innerText = properties[window.selectLandmarkFeature].name;
                          document.querySelector('.marker-form').style.visibility = "visible";
                          document.querySelector('.marker-form input').value = properties[window.selectLandmarkFeature].name;
                          document.querySelector('.marker-form textarea').value = properties[window.selectLandmarkFeature].short_description;
                          this.updateLandmarkList();
                        }}">
                        <span class="custom-option" data-value="${idx}">
                          ${p.name}
                        </span>
                      </div>`)}
                    </div>
                </div>
            </div>
          </div>
          <div class="parameter">
            <li class="marker" style="display: ${(properties.length && window.selectLandmarkFeature >= 0) ? "block" : "none"}">
              <div class="marker-form">
                <label class="parameter__label ui-label ui-label--row">Place Name</label>
                <input
                  class="text-input"
                  type="text"
                  placeholder="Place name"
                  value="${(properties[window.selectLandmarkFeature] || {}).name}"
                  autofill="off"
                  autocomplete="off"
                  @input="${e => {
                    this.setName(e.target.value);
                  }}"
                  style="width: 80%;"
                />
                <button
                  class="text-input"
                  style="background:#f00; width:18%; vertical-align: top; height: 30px; padding: 2px;"
                  @click="${(e) => {
                    this.onDelete();
                    window.selectLandmarkFeature = 0;
                    this.updateLandmarkList();

                    properties = this.features.map(feature => feature.properties);
                    if (properties.length && properties[window.selectLandmarkFeature]) {
                      document.querySelector('.marker-form input').value = properties[window.selectLandmarkFeature].name;
                      document.querySelector('.marker-form textarea').value = properties[window.selectLandmarkFeature].short_description;
                    } else {
                      document.querySelector('.marker-form input').value = "";
                      document.querySelector('.marker-form textarea').value = "";
                    }
                    document.querySelector('.landmark-parameter').display = properties.length ? "flex" : "none";
                }}">
                  <div class="icon" title="delete">
                      <i class="material-icons">delete</i>
                  </div>
                </button>

                <textarea
                  class="text-input text-area"
                  placeholder="Describe this point"
                  autofill="off"
                  autocomplete="off"
                  @input="${e => {
                    this.setDescription(e.target.value);
                  }}"
                >${(properties[window.selectLandmarkFeature] || {}).short_description}</textarea>
              </div>
            </li>
          </div>
    </ul>`;
    }
}
