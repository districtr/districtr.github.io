import { html, render } from "lit-html";
import {
    PlaceMapWithData,
    getFeatureBySTUPS,
    selectState
} from "../components/PlaceMap";
import { until } from "lit-html/directives/until";
import PlanUploader from "../components/PlanUploader";
import { loadPlanFromJSON, navigateTo, savePlanToStorage } from "../routes";

export default function renderNewPlanView() {
    const uploadPlan = new PlanUploader(fileContent => {
        loadPlanFromJSON(JSON.parse(fileContent)).then(context => {
            savePlanToStorage(context);
            navigateTo("/edit");
        });
    });
    const target = document.getElementById("root");
    render(
        html`
            <div class="start-districting start-districting--alone">
                <h1 class="start-districting__title section__heading">
                    Where would you like to redistrict?
                </h1>
                ${until(PlaceMapWithData(), "")}
            </div>
            ${uploadPlan.render()}
        `,
        target
    );
    window.setTimeout(() => {
        const pathComponents = location.pathname.split("/");
        if (pathComponents && pathComponents[-1] !== "new") {
            const stateCode = pathComponents[-1];
            const state = getFeatureBySTUPS(stateCode);
            if (!state) {
                history.replaceState("/new");
            } else {
                selectState(
                    state,
                    document.getElementById(stateCode.toLowerCase())
                );
            }
        }
    }, 1000);
}
