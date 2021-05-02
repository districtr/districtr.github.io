import UIStateStore from "./UIStateStore";
import reducer from "../reducers";
import Toolbar from "../components/Toolbar/Toolbar";
import { render } from "lit-html";

export default class Editor {
    constructor(state, mapState, plugins) {
        this.render = this.render.bind(this);
        this.mapState = mapState;

        this.state = state;

        let activeTab = "criteria";

        this.store = new UIStateStore(reducer, {
            toolbar: { activeTab: activeTab, dropdownMenuOpen: false },
            elections: {
                activeElectionIndex: 0
            },
            charts: {}
        });

        this.toolbar = new Toolbar(this.store, this);

        for (let plugin of plugins) {
            plugin(this);
        }

        this.store.subscribe(this.render);
        this.state.subscribe(this.render);
    }
    render() {
        const target = document.getElementById("toolbar");
        if (target === null) {
            return;
        }
        render(this.toolbar.render(), target);
    }
}
