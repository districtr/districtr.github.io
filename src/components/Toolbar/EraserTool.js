import { html } from "lit-html";
import BrushSlider from "./BrushSlider";
import UndoRedo from "./UndoRedo";
import Tool from "./Tool";

export default class EraserTool extends Tool {
    constructor(brush) {
        const icon = html`<img src="https://deploy-preview-309--districtr-web.netlify.app/assets/Icons_Erase_grey.svg" alt="Eraser"/>`;
        super("eraser", "Erase", icon);
        this.brush = brush;
        this.options = new EraserToolOptions(brush);
    }
    activate() {
        super.activate();
        this.brush.activate();
        this.brush.startErasing();
    }
    deactivate() {
        super.deactivate();
        this.brush.deactivate();
        this.brush.stopErasing();
    }
}

class EraserToolOptions {
    constructor(brush, renderToolbar) {
        this.brush = brush;
        this.renderToolbar = renderToolbar;
        this.changeRadius = this.changeRadius.bind(this);
    }
    changeRadius(e) {
        e.stopPropagation();
        let value = parseInt(e.target.value);
        if (this.brush.radius != value) {
            this.brush.radius = value;
        }
        this.renderToolbar();
    }
    render() {
        return html`
            ${BrushSlider(this.brush.radius, this.changeRadius, {
                title: "Eraser Size"
            })}
            ${UndoRedo(this.brush)}
        `;
    }
}
