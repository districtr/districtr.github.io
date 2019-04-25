import { addLayers } from "../Map/map";
import IdColumn from "./IdColumn";
import { assignUnitsAsTheyLoad } from "./lib";
import { generateId } from "../utils";
import { getColumnSets, getParts } from "./column-sets";

// We should break this up. Maybe like this:
// MapState (map, layers)
// DistrictData (column sets) ?
// DistrictingPlan (assignment, problem, export()) ?
// Units (unitsRecord, reference to layer?) ?
// "place" is mostly split up into these categories now.

class DistrictingPlan {
    constructor(id, assignment, problem, idColumn) {
        if (id) {
            this.id = id;
        } else {
            this.id = generateId(8);
        }

        this.problem = problem;
        this.assignment = {};
        this.parts = getParts(problem);
        this.idColumn = idColumn;

        if (assignment) {
            assignUnitsAsTheyLoad(this, assignment);
        }
    }
    update(feature, part) {
        this.assignment[this.idColumn.getValue(feature)] = part;
    }
    serialize() {
        return {
            assignment: this.assignment,
            id: this.id,
            idColumn: { key: this.idColumn.key, name: this.idColumn.name },
            problem: this.problem
        };
    }
}

/**
 * Holds all of the state that needs to be updated after
 * each brush stroke. (Mainly the Plan assignment and the
 * population tally.)
 */
export default class State {
    constructor(map, { place, problem, id, assignment, units }) {
        this.unitsRecord = units;
        this.initializeMapState(map, units);

        this.place = place;
        this.idColumn = new IdColumn(units.idColumn);
        if (units.hasOwnProperty("nameColumn")) {
            this.nameColumn = new IdColumn(units.nameColumn);
        }
        this.plan = new DistrictingPlan(id, assignment, problem, this.idColumn);
        this.columnSets = getColumnSets(this, units);

        this.subscribers = [];

        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
    }
    get activeParts() {
        return this.plan.parts.filter(part => part.visible);
    }
    initializeMapState(map, unitsRecord) {
        const { units, unitsBorders, points } = addLayers(
            map,
            unitsRecord.tilesets
        );

        this.units = units;
        this.unitsBorders = unitsBorders;
        this.layers = [units, points];
        this.map = map;
    }
    update(feature, part) {
        this.columnSets.forEach(columnSet => columnSet.update(feature, part));
        this.plan.update(feature, part);
    }
    get parts() {
        return this.plan.parts;
    }
    get problem() {
        return this.plan.problem;
    }
    serialize() {
        return {
            ...this.plan.serialize(),
            placeId: this.place.id,
            units: this.unitsRecord
        };
    }
    subscribe(f) {
        this.subscribers.push(f);
        this.render();
    }
    render() {
        for (let f of this.subscribers) {
            f();
        }
    }
    hasExpectedData(feature) {
        if (feature === undefined || feature.properties === undefined) {
            return false;
        }
        for (let column of this.columns) {
            if (feature.properties[column.key] === undefined) {
                return false;
            }
        }
        return true;
    }
}
