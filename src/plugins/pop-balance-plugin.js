
import { html } from "lit-html";
import { Tab } from "../components/Tab";
import { spatial_abilities } from "../utils";
import HighlightUnassigned from "../components/Charts/HighlightUnassigned";
import MultiMemberPopBalanceChart from "../components/Charts/MMPopBalanceChart";
import populationBarChart from "../components/Charts/PopulationBarChart";
import populationDeviation from "../components/Charts/PopulationDeviation";
import unassignedPopulation from "../components/Charts/UnassignedPopulation";
import populateDatasetInfo from "../components/Charts/DatasetInfo";

export default function PopulationBalancePlugin(editor) {
    const problem = editor.state.plan.problem;
    const state = editor.state;
    const showVRA = (state.plan.problem.type !== "community") && (spatial_abilities(state.place.id).vra_effectiveness);
    const tab = new Tab("criteria", showVRA ? "Pop." : "Population", editor.store);

    let place = editor.state.place.id,
        extra_source = (editor.state.units.sourceId === "ma_precincts_02_10") ? "ma_02" : 0;
    if (editor.state.units.sourceId === "ma_towns") {
        extra_source = "ma_towns";
    }
    if (editor.state.units.sourceId === "indiana_precincts") {
        extra_source = "indianaprec";
    }
    const placeID = extra_source || place;
    const sep = (placeID === "louisiana") ? ";" : ",";

    const zoomToUnassigned = spatial_abilities(editor.state.place.id).find_unpainted
      ? (e) => {
        let saveplan = state.serialize();
        const GERRYCHAIN_URL = "//mggg.pythonanywhere.com";
        fetch(GERRYCHAIN_URL + "/unassigned", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(saveplan),
        })
        .then((res) => res.json())
        .catch((e) => console.error(e))
        .then((data) => {
          if (data["-1"] && data["-1"].length) {
            const ids = data["-1"].filter(a => !a.includes(null)).sort((a, b) => b.length - a.length)[0];
            const myurl = `//mggg.pythonanywhere.com/findBBox?place=${placeID}&`;
            fetch(`${myurl}ids=${ids.slice(0, 100).join(sep)}`).then(res => res.json()).then((bbox) => {
              if (bbox.length && typeof bbox[0] === 'number') {
                bbox = {x: bbox};
              } else if (bbox.length) {
                bbox = bbox[0];
                if (bbox.length) {
                  bbox = {x: bbox};
                }
              }
              Object.values(bbox).forEach(mybbox => {
                editor.state.map.fitBounds([
                  [mybbox[0], mybbox[2]],
                  [mybbox[1], mybbox[3]]
                ]);
              });
            });
          }
        });
      }
      : null;

    if (problem.type === "multimember") {
        tab.addRevealSection(
            "Population Balance",
            () => html`
                <section class="toolbar-inner dataset-info">
                    ${populateDatasetInfo(state)};
                </section>
                ${MultiMemberPopBalanceChart(state.population, state.parts)}
                <dl class="report-data-list">
                    ${unassignedPopulation(state.population)}
                    ${HighlightUnassigned(state.unitsBorders, zoomToUnassigned)}
                </dl>
            `
        );
    } else {
        tab.addRevealSection(
            "Population Balance",
            () =>
                html`
                    <section class="toolbar-inner dataset-info">
                        ${populateDatasetInfo(state)};
                    </section>
                    ${populationBarChart(state.population, state.activeParts)}
                    <dl class="report-data-list">
                        ${unassignedPopulation(state.population)}
                        ${populationDeviation(state.population)}
                        ${HighlightUnassigned(state.unitsBorders, zoomToUnassigned)}
                    </dl>
                `
        );
    }

    // Add the tab to the toolbar.
    editor.toolbar.addTab(tab);
}
