import { spatial_abilities } from "../../utils";

/**
 * Assigns units to their districts while the Mapbox tiles are still
 * loading.
 *
 * @param {State} state The State object.
 * @param {Object} assignment The assignment we want to set.
 * @param {Function} readyCallback Called after all the units' assignments
 *  are set.
 */
export function assignUnitsAsTheyLoad(state, assignment, readyCallback) {
    let assignmentLength = Object.keys(assignment).filter(
        key => assignment[key] !== undefined && assignment[key] !== null
    ).length;
    let numberAssigned = 0;
    let mapUnloaded = {};
    let populationUnloaded = new Set(Object.keys(assignment));
    let loadRemainingData = () => {
        console.log('Missing units: ' + populationUnloaded.size);
        if (populationUnloaded.size > 0 && spatial_abilities(state.place.id).sideload) {
            fetch("//mggg.pythonanywhere.com/demographics", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  id: state.place.id,
                  unitType: state.units.id,
                  keyColumn: state.idColumn.key,
                  units: Array.from(populationUnloaded),
                })
            })
            .then(res => res.json())
            .then(data => {
                // console.log(data);
                data.forEach((row) => {
                    let unitId = row[state.idColumn.key];
                    if (populationUnloaded.has(unitId)) {
                        populationUnloaded.delete(unitId);
                        assign(state, {
                            type: 'Feature',
                            id: unitId,
                            properties: row,
                        }, assignment[unitId], true);
                    }
                });
            });
        }
    };
    let sideLoader = null;
    state.units.untilSourceLoaded(done => {
        const { successes, failures } = assignFeatures(
            state,
            assignment,
            mapUnloaded,
            populationUnloaded
        );
        numberAssigned += successes;
        if (successes > 0) {
            if (sideLoader) {
                clearTimeout(sideLoader);
            }
            sideLoader = setTimeout(loadRemainingData, 500);
        }
        if (numberAssigned === assignmentLength && failures === 0) {
            done();
        } else {
            // console.error([numberAssigned, assignmentLength]);
            // console.error(failures + " failures");
        }
        readyCallback();
        state.render();
    });
}

export function getAssignedUnitIds(assignment) {
    return Object.keys(assignment).filter(
        x =>
            x !== undefined &&
            x !== null &&
            assignment[x] !== null &&
            assignment[x] !== undefined
    );
}

function assign(state, feature, partId, updateData) {
    if (typeof partId === 'number') {
        partId = [partId];
    }
    if (updateData) {
        state.update(feature, partId);
    } else {
    }
    partId.forEach((p) => {
        if (state.parts[p]) {
            state.parts[p].visible = true;
        } else {
            console.error("Off by one? No matching district number for: " + p);
        }
    });
    state.units.setAssignment(feature, partId);
}

function assignFeatures(state, assignment, mapUnloaded, populationUnloaded) {
    const features = state.units.querySourceFeatures();
    let failures = 0;
    let successes = 0;
    while (features.length > 0) {
        let feature = features.pop();
        if (true) { //state.hasExpectedData(feature)) {
            let unitId = state.idColumn.getValue(feature);
            if (
                mapUnloaded[unitId] !== true &&
                assignment.hasOwnProperty(unitId) &&
                assignment[unitId] !== null &&
                assignment[unitId] !== undefined
            ) {
                assign(state, feature, assignment[unitId], populationUnloaded.has(unitId) || populationUnloaded.has(String(unitId)));
                mapUnloaded[unitId] = true;
                successes += 1;
                populationUnloaded.delete(unitId);
            }
        } else {
            failures += 1;
        }
    }
    return { failures, successes };
}
