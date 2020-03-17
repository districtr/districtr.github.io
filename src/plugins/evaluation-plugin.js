import ElectionResultsSection from "../components/Charts/ElectionResultsSection";
import RacialBalanceTable from "../components/Charts/RacialBalanceTable";
import AgeHistogramTable from "../components/Charts/AgeHistogramTable";
import ContiguitySection from "../components/Charts/ContiguitySection";
import { Tab } from "../components/Tab";

export default function EvaluationPlugin(editor) {
    const { state, toolbar } = editor;

    const tab = new Tab("evaluation", "Evaluation", editor.store);

    if (state.population.subgroups.length > 1) {
        tab.addRevealSection(
            "Racial Balance",
            (uiState, dispatch) =>
                RacialBalanceTable(
                    "Racial Balance",
                    state.population,
                    state.activeParts,
                    uiState.charts["Racial Balance"],
                    dispatch
                ),
            {
                isOpen: true,
                activeSubgroupIndices: state.population.indicesOfMajorSubgroups()
            }
        );
    }
    if (state.vap) {
        tab.addRevealSection(
            "VAP Balance",
            (uiState, dispatch) =>
                RacialBalanceTable(
                    "VAP Balance",
                    state.vap,
                    state.activeParts,
                    uiState.charts["VAP Balance"],
                    dispatch
                ),
            {
                isOpen: state.population.subgroups.length > 1 ? false : true,
                activeSubgroupIndices: state.vap.indicesOfMajorSubgroups()
            }
        );
    }
    if (state.ages) {
        tab.addRevealSection(
            "Age Histograms",
            (uiState, dispatch) =>
                AgeHistogramTable(
                    "Age Histograms",
                    state.ages,
                    state.activeParts,
                    uiState.charts["Age Histograms"],
                    dispatch
                ),
            {
                isOpen: false,
                activeSubgroupIndices: state.ages.indicesOfMajorSubgroups()
            }
        );
    }
    if (state.elections.length > 0) {
        tab.addRevealSection(
            "Partisan Balance",
            (uiState, dispatch) =>
                ElectionResultsSection(
                    state.elections,
                    state.activeParts,
                    uiState,
                    dispatch
                ),
            {
                isOpen:
                    state.population.subgroups.length <= 1 &&
                    state.vap === undefined
                        ? true
                        : false
            }
        );
    }

    // if (state.plan.problem.type !== "community"
    //     && (["alaska", "colorado", "georgia", "hawaii", "iowa", "ma", "maryland", "michigan", "minnesota", "mississippi", "nc", "new_mexico", "ohio", "oklahoma", "oregon", "pennsylvania", "rhode_island", "texas", "utah", "vermont", "virginia", "wisconsin"].includes(state.place.id))
    //     && (state.units.sourceId !== "ma_towns")
    // ) {
    //     tab.addRevealSection(
    //         "Contiguity",
    //         (uiState, dispatch) =>
    //             ContiguitySection(
    //                 state.contiguity,
    //                 uiState,
    //                 dispatch
    //             ),
    //         {
    //             isOpen: true
    //         }
    //     );
    // }

    if (tab.sections.length > 0) {
        toolbar.addTab(tab);
    }
}
