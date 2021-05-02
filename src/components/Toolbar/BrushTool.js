import { html } from "lit-html";
import hotkeys from 'hotkeys-js';

import BrushColorPicker from "./BrushColorPicker";
import BrushSlider from "./BrushSlider";
import UndoRedo from "./UndoRedo";
import Tool from "./Tool";

const icon = (active, colorId, colors) => {
    return html`<img src="https://deploy-preview-309--districtr-web.netlify.app/assets/Icons_Paint_grey.svg" alt="Brush"/>`
};

export default class BrushTool extends Tool {
    constructor(brush, colors, options) {
        super("brush", "Paint", icon);
        this.brush = brush;
        this.colors = colors;
        this.options = new BrushToolOptions(brush, colors, undefined, options);

        hotkeys.filter = ({ target }) => {
            return (!["INPUT", "TEXTAREA"].includes(target.tagName)
              || (target.tagName === 'INPUT' && target.type.toLowerCase() !== 'text'));
        };
        hotkeys(`ctrl+z,command+z,control+z`, (evt, handler) => {
            // undo
            this.brush.undo();
            evt.preventDefault();
        });
        hotkeys(`ctrl+shift+z,command+shift+z,control+shift+z,ctrl+y,command+y,control+y`, (evt, handler) => {
            // redo
            this.brush.redo();
            evt.preventDefault();
        });
    }
    activate() {
        super.activate();
        this.brush.activate();
    }
    deactivate() {
        if (this.brush.county_brush) {
            this.options.toggleCountyBrush();
        }
        super.deactivate();
        this.brush.deactivate();
    }
    render(selectTool) {
        this.icon = icon(this.active, this.brush.color, this.colors);
        return super.render(selectTool);
    }
}

class BrushToolOptions {
    constructor(brush, colors, renderToolbar, options) {
        this.brush = brush;
        this.colors = colors;
        this.renderToolbar = renderToolbar;
        this.options = options;
        this.selectColor = this.selectColor.bind(this);
        this.changeRadius = this.changeRadius.bind(this);
        this.toggleCountyBrush = this.toggleCountyBrush.bind(this);
        this.toggleBrushLock = this.toggleBrushLock.bind(this);
    }
    selectColor(e) {
        this.brush.setColor(e.target.value);
        this.renderToolbar();
        if (document.querySelectorAll) {
            let community_opts = document.querySelectorAll('.custom-select .custom-option');
            if (community_opts.length) {
               community_opts[e.target.value * 1].click();
               document.querySelector('.custom-select__trigger').click();
            }
        }
    }
    changeRadius(e) {
        e.stopPropagation();
        let value = parseInt(e.target.value);
        if (this.brush.radius != value) {
            this.brush.radius = value;
        }
        if (this.options.county_brush && this.options.county_brush.radius != value) {
            this.options.county_brush.radius = value;
        }
        this.renderToolbar();
    }
    toggleCountyBrush() {
        this.brush.county_brush = !this.brush.county_brush;
        // toggle county-unit hover
        if (this.brush.county_brush) {
            this.options.county_brush.activate();
            this.brush.deactivate("mouseover");
        } else {
            this.options.county_brush.deactivate();
            this.brush.activate("mouseover");
        }
        // switches county borders visibility to match checkbox
        let countyLayer = document.getElementById("countyVisible");
        if (this.brush.county_brush !== countyLayer.checked) {
            countyLayer.click();
        }
    }
    toggleBrushLock() {
        this.brush.locked = !this.brush.locked;
    }
    render() {
        const activeColor = this.colors[this.brush.color].id;
        return html`
            ${this.colors.length > 1
                ? BrushColorPicker(this.colors, this.selectColor, activeColor)
                : ""}
            ${BrushSlider(this.brush.radius, this.changeRadius)}
            ${this.options && this.options.county_brush
                ? CountyBrush(this.brush.county_brush, this.toggleCountyBrush, this.options.alt_counties)
                : ""}
            ${this.colors.length > 1
                ? BrushLock(this.brush.locked, this.toggleBrushLock, this.options)
                : ""}
            ${UndoRedo(this.brush)}
        `;
    }
}

const CountyBrush = (county_brush, toggle, alt_counties) => html`
    <div class="ui-option">
        <label class="toolbar-checkbox">
            <input
                type="checkbox"
                name="county-brush"
                value="county-brush"
                ?checked=${county_brush}
                @change=${toggle}
            />
            Paint ${alt_counties || "counties"}
        </label>
    </div>
`;

const BrushLock = (locked, toggle, options) => html`
    <div class="ui-option">
        <label class="toolbar-checkbox">
            <input
                type="checkbox"
                name="brush-lock"
                value="brush-lock"
                ?checked=${locked}
                @change=${toggle}
            />
            Lock already-drawn ${options && options.community ? "communities" : "districts"}
        </label>
    </div>
`;
