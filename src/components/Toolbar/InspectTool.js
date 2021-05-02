import { html } from "lit-html";
import Tooltip from "../../map/Tooltip";
import BrushSlider from "./BrushSlider";
import Tool from "./Tool";
import Select from "../Select";
import { TooltipContent } from "../Charts/TooltipContent";

export default class InspectTool extends Tool {
    constructor(units, columnSets, nameColumn, unitsRecord, parts) {
        super(
            "inspect",
            "Inspect",
            html`<img src="https://deploy-preview-309--districtr-web.netlify.app/assets/Icons_Inspect_grey.svg" alt="Inspect"/>`
        );

        this.columnSets = [].concat(columnSets.filter(lyr => lyr.subgroups.length > 1));
        // separate out 2018/2019 pop
        if (this.columnSets.length && this.columnSets[0].name_alt) {
            this.columnSets.splice(1, 0, this.columnSets[0]);
        }
        this.activeColumnSetIndex = 0;

        const renderTooltipContent = features =>
            TooltipContent(
                features,
                this.activeColumnSet,
                nameColumn,
                unitsRecord.unitType,
                parts,
                this.activeColumnSetIndex
            );
        this.layer = units;
        this.tooltip = new Tooltip(units, renderTooltipContent);
        this.options = new InspectToolOptions(this);

        this.changeColumnSetByIndex = this.changeColumnSetByIndex.bind(this);
    }
    changeColumnSetByIndex(i) {
        this.activeColumnSetIndex = i;
    }
    get activeColumnSet() {
        return this.columnSets[this.activeColumnSetIndex];
    }
    activate() {
        super.activate();
        this.layer.map.getCanvas().classList.add("inspect-tool");
        this.tooltip.activate();
    }
    deactivate() {
        super.deactivate();
        this.layer.map.getCanvas().classList.remove("inspect-tool");
        this.tooltip.deactivate();
    }
}

class InspectToolOptions {
    constructor(inspectTool) {
        this.inspectTool = inspectTool;
        this.changeRadius = this.changeRadius.bind(this);
    }
    changeRadius(e) {
        e.stopPropagation();
        let value = parseInt(e.target.value);
        if (this.inspectTool.tooltip.radius != value) {
            this.inspectTool.tooltip.radius = value;
        }
        this.renderToolbar();
    }
    render() {
        console.log('rendering');
        console.log(this.inspectTool.activeColumnSetIndex)
        return html`
            <div class="ui-option">
                <legend class="ui-label ui-label--row">Tooltip Data</legend>
                ${Select(
                    this.inspectTool.columnSets.map((col, i) => {
                        return { name: i ? (col.name_alt || col.name) : col.name };
                    }),
                    this.inspectTool.changeColumnSetByIndex,
                    this.inspectTool.activeColumnSetIndex
                )}
            </div>
            ${BrushSlider(this.inspectTool.tooltip.radius, this.changeRadius, {
                title: "Spotlight Size"
            })}
        `;
    }
}
