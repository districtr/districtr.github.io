import { html } from "lit-html";
import { toggle } from "../Toggle";

import { savePlanToStorage } from "../../routes";
import { bindAll } from "../../utils";
import { Landmarks } from "../Landmark";
import Tool from "./Tool";
import Parameter from "../Parameter";
import Select from "../Select";

export default class LandmarkTool extends Tool {
    constructor(state) {
        const icon = html`<img src="https://deploy-preview-309--districtr-web.netlify.app/assets/Icons_Landmark_grey.svg"alt="Landmark"/>`;
        super("landmark", "Landmark", icon, state.problem.type !== "community");

        this.state = state;
        this.renderCallback = state.render;

        bindAll(["updateLandmarkList", "saveFeature", "deleteFeature"],
            this);

        let lm = state.place.landmarks;
        if (!lm.source && !lm.type) {
            // initialize a blank landmarks object
            // we cannot replace the object, which is used to remember landmarks
            lm.type = "geojson";
            lm.data = {"type": "FeatureCollection", "features": []};
        }
        // compatibility with old landmarks
        lm = lm.source || lm;

        // remove landmarks which were being drawn and not saved
        lm.data.features = lm.data.features.filter(f => !f.number_id);

        this.landmarks = new Landmarks(state.map, lm, this.updateLandmarkList);
        this.options = new LandmarkOptions(
            this.landmarks,
            lm.data.features,
            this.saveFeature,
            this.deleteFeature,
            this.renderCallback
        );
    }
    updateLandmarkList(selectLastFeature) {
        // savePlanToStorage(this.state.serialize());
        // if (selectLastFeature) {
        //     this.options.handleSelectFeature(-1);
        //     // handleSelectFeature already calls render
        // } else {
        //     this.renderCallback();
        // }
    }
    saveFeature(id) {
        this.landmarks.saveFeature(id);
        savePlanToStorage(this.state.serialize());
        this.renderCallback();
    }
    deleteFeature(id) {
        this.landmarks.deleteFeature(id);
        savePlanToStorage(this.state.serialize());
        this.renderCallback();
    }
    activate() {
        super.activate();
        // enable / disable drawing toolbar
        this.landmarks.handleDrawToggle(true);
        document.querySelector(".mapboxgl-control-container .mapbox-gl-draw_point").click();
    }
    deactivate() {
        super.deactivate();
        this.landmarks.handleDrawToggle(false);
        try {
          document.querySelector(".mapboxgl-canvas-container").classList.remove("mapboxgl-interactive");
        } catch(e){
          // IE
        }
    }
}

class LandmarkOptions {
    constructor(drawTool, features, saveFeature, deleteFeature, renderCallback) {
        this.drawTool = drawTool;
        this.features = features;
        this.saveFeature = saveFeature;
        this.deleteFeature = deleteFeature;
        this.renderCallback = renderCallback;

        bindAll(["handleSelectFeature", "onSave", "onDelete", "setName", "setDescription"],
            this);

        this.selectFeature = this.features.length ? 0 : null;
        if (this.features.length) {
            this.updateName = this.features[0].properties.name;
            this.updateDescription = this.features[0].properties.short_description || '';
        } else {
            this.updateName = null;
            this.updateDescription = null;
        }
    }
    handleSelectFeature(e) {
        // e can be set to -1 (most recent layer)
        this.selectFeature = (e > -1) ? e : (this.features.length - 1);
        this.renderCallback();
    }
    // setName / setDescription: remember but don't yet save to map and localStorage
    setName(name) {
        this.updateName = name;
        this.onSave();
    }
    setDescription(description) {
        this.updateDescription = description;
        this.onSave();
    }
    onSave() {
        // save name, description, and location on map and localStorage
        let updateFeature = this.features[this.selectFeature];
        updateFeature.properties.name = this.updateName;
        updateFeature.properties.short_description = this.updateDescription;
        this.saveFeature(updateFeature.id);
    }
    onDelete() {
        // delete currently viewed shape
        let deleteID = this.features[this.selectFeature].id;
        if (this.selectFeature === this.features.length - 1) {
            // adjust index if viewing most recent feature
            this.handleSelectFeature(this.features.length - 2);
        }
        this.deleteFeature(deleteID);
    }
    render() {
        let properties = this.features.map(feature => feature.properties);
        if (this.features.length) {
            if (!this.selectFeature) {
                // when we add our first feature, this selects it
                this.selectFeature = 0;
            }

            this.updateName = this.features[this.selectFeature].properties.name;
            this.updateDescription = this.features[this.selectFeature].properties.short_description || '';
        }

        return html`
    <div class="ui-option">
        <legend class="ui-label ui-label--row">Important Places</legend>
        ${toggle(
            "Show places",
            this.drawTool.visible,
            this.drawTool.handleToggle
        )}
    </div>
    <ul class="option-list">
        <li class="option-list__item">
            ${properties.length > 0
                ? Parameter({
                      label: "Edit:",
                      element: html`${Select(
                          properties,
                          this.handleSelectFeature,
                          this.selectFeature
                      )}
                      <button
                          class="mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_point"
                          @click=${() => {
                              document.querySelector(".mapboxgl-control-container .mapbox-gl-draw_point").click();
                          }}
                      >
                      </button>`
                  })
                : ""}
        </li>
    </ul>
        `;
    }
}
