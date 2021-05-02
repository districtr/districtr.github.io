import { html } from "lit-html";
import { repeat } from "lit-html/directives/repeat";
import { actions } from "../../reducers/toolbar";
import OptionsContainer from "./OptionsContainer";

export default class MiniToolbar {
    constructor(store, editor) {
        this.tools = [];
        this.toolsById = {};
        this.menuItems = [];
        this.tabs = [];

        this.renderCallback = editor.render;

        this.render = this.render.bind(this);
        this.selectTool = this.selectTool.bind(this);
        this.addTool = this.addTool.bind(this);

        this.store = store;
    }
    get activeTool() {
        return this.toolsById[this.store.state.toolbar.activeTool];
    }
    selectTool(toolId) {
        if (this.activeTool) {
            this.activeTool.deactivate();
        }
        this.toolsById[toolId].activate();
        this.store.dispatch(actions.selectTool({ id: toolId }));
    }
    addTab(tab) {
        this.tabs.push(tab);
    }
    addTabFirst(tab) {
        this.tabs.splice(0, 0, tab);
    }
    addTool(tool) {
        if (tool.options !== undefined) {
            tool.options.renderToolbar = this.renderCallback;
        }
        this.toolsById[tool.id] = tool;
        this.tools.push(tool);
    }
    setMenuItems(menuItems) {
        this.menuItems = menuItems;
    }
    render() {
        return html`
        <div class="districtr__mini-toolbar">
            <nav>
                <div class="districtr__mini-toolbar-top">
                    <div class="icon-list">
                        ${repeat(
                            this.tools,
                            tool => tool.id,
                            tool => tool.render(this.selectTool)
                        )}
                    </div>
                </div>
            </nav>
            ${OptionsContainer(this.activeTool)}
            </div>
        </div>
        `;
    }
}
