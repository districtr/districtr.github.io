import { html } from "lit-html";

export default class LayerToggle {
    constructor(layer, toggleText, checked) {
        this.layer = layer;
        this.toggleText = toggleText;
        this.checked = checked;

        this.onChange = this.onChange.bind(this);
        this.render = this.render.bind(this);
    }
    onChange(e) {
        if (e.target.checked) {
            this.checked = true;
            this.layer.setOpacity(0.8);
        } else {
            this.checked = false;
            this.layer.setOpacity(0);
        }
    }
    render() {
        return html`
            <label class="toolbar-checkbox-item">
                <input
                    type="checkbox"
                    ?checked="${this.checked}"
                    @input="${this.onChange}"
                />
                ${this.toggleText}
            </label>
        `;
    }
}
