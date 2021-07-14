import { html, render } from "lit-html";
import Parameter from "./Parameter";
import { savePlanToStorage } from "../routes";
import { bindAll, spatial_abilities } from "../utils";
import { colorScheme } from "../colors";

export default class AboutSection {
    constructor({ state, render }) {
        this.part = state.parts[0];
        this.name = this.part.name || "";
        this.description = this.part.description || "";
        this.state = state;
        this.renderCallback = render;
        this.saved = false;
        bindAll(
            ["onSave", "setName", "setDescription", "render", "setPart", "saveFeature", "deleteFeature"],
            this
        );
    }
    setPart(index) {
        if (this.state.parts[index].visible !== true) {
            return;
        }
        this.part = this.state.parts[index];
        this.name = this.part.name || "";
        this.description = this.part.description || "";
        document.getElementsByClassName('custom-select')[0].classList.toggle('open');

        if (spatial_abilities(this.state.place.id).find_unpainted) {
          let matching = Object.keys(this.state.plan.assignment).filter(geo => this.state.plan.assignment[geo] === index || (this.state.plan.assignment[geo].length && this.state.plan.assignment[geo].includes(index)));
          if (matching.length) {
            const sep = (this.state.place.id === "louisiana") ? ";" : ",";
            fetch("//mggg.pythonanywhere.com/findLimits?place=" + this.state.place.id + `&ids=${matching.slice(0, 100).join(sep)}`)
            .then((res) => res.json())
            .catch((e) => console.error(e))
            .then((d) => {
              const border = JSON.parse(d[0]);
              this.state.map.getSource("coi_focus").setData(border);

              // console.log(border);
              let minx = 180, maxx = -180, miny = 90, maxy = -90;
              const getBounds = (coords) => {
                if (!coords.length) {
                  return;
                }
                if (typeof coords[0] === 'object') {
                  coords.forEach((c) => {
                    getBounds(c);
                  });
                } else {
                  coords.forEach((c) => {
                    minx = Math.min(minx, coords[0]);
                    maxx = Math.max(maxx, coords[0]);
                    miny = Math.min(miny, coords[1]);
                    maxy = Math.max(maxy, coords[1]);
                  });
                }
              };
              const bounds = getBounds(border.coordinates);
              // console.log([minx, maxx, miny, maxy]);
              this.state.map.fitBounds([
                [minx, miny],
                [maxx, maxy]
              ]);
            });
          }
        }

        this.renderCallback();
    }
    setName(name) {
        this.name = name;
        this.onSave();
    }
    setDescription(description) {
        this.description = description;
        this.onSave();
    }
    onSave() {
        this.part.updateDescription({
            name: this.name,
            description: this.description
        });
        savePlanToStorage(this.state.serialize());
        this.saved = true;
        this.renderCallback();
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
    render() {
        const parts = this.state.activeParts;
        if (this.state.place.landmarks.source && !this.state.place.landmarks.data) {
            this.state.place.landmarks.data = this.state.place.landmarks.source.data;
        }

        // print view of COI and landmarks
        render(html`
          <h2>Communities of Interest</h2>
          ${parts.map(p => html`<div>
            <h4>
              <span class="part-number" style="${'border: 8px solid ' + colorScheme[p.id % colorScheme.length] }"> </span>
              ${p.name || (p.id + 1)}
            </h4>
            <p>${p.description || ""}</p>
          </div>`)}
          <h2>${this.state.place.landmarks.data.features.length ? "Important Places" : ""}</h2>
          ${this.state.place.landmarks.data.features.map(lm => html`<div>
            <h4>${lm.properties.name}</h4>
            <p>${lm.properties.short_description}</p>
            ${Object.keys(lm.properties).filter(p => !["name", "short_description"].includes(p)).forEach(p => {
              return html`<p><strong>${p}</strong> - ${lm.properties[p]}</p>`
            })}
          </div>`)}`,
          document.querySelector(".print-summary")
        );

        return html`
            <ul class="option-list">
                <li class="option-list__item">
                    ${parts.length > 0
                        ? Parameter({
                              label: "Select",
                              element: html`<div class="custom-select-wrapper">
                                      <div class="custom-select">
                                          <div
                                              class="custom-select__trigger"
                                              @click="${(e) => { document.getElementsByClassName('custom-select')[0].classList.toggle('open')}}"
                                          >
                                              <span class="part-number" style="${'background:' + colorScheme[this.part.id] }"> </span>
                                              <span class="label">${this.name}</span>
                                              <div class="arrow"></div>
                                          </div>
                                          <div class="custom-options">
                                              ${parts.map((p) => {
                                                 return html`<div @click="${e => this.setPart(p.id)}">
                                                    <span class="part-number" style="${'background:' + colorScheme[p.id] }"> </span>
                                                    <span class="custom-option" data-value="${p.name}">${p.name}</span>
                                                 </div>`;
                                              })}
                                          </div>
                                      </div>
                                  </div>`
                          })
                        : ""}
                </li>
            </ul>
            ${AboutSectionTemplate(this)}
        `;
    }
}

function AboutSectionTemplate({
    name,
    description,
    saved,
    onSave,
    setName,
    setDescription
}) {
    return html`
        <ul class="option-list">
            <li class="option-list__item">
                <label class="ui-label">Name</label>
                <input
                    type="text"
                    class="text-input"
                    .value="${name}"
                    @blur=${e => setName(e.target.value)}
                    @input=${e => setName(e.target.value)}
                />
            </li>
            <li class="option-list__item">
                <label class="ui-label"></label>
                <textarea
                    class="text-input text-area"
                    placeholder="Describe this community"
                    @blur=${e => setDescription(e.target.value)}
                    @input=${e => setDescription(e.target.value)}
                    .value="${description}"
                ></textarea>
                <br/>
                <span>These details are updated automatically</span>
            </li>
        </ul>
    `;
}
