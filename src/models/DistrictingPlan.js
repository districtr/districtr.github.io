import { generateId } from "../utils";
import { getParts } from "./lib/column-sets";

export default class DistrictingPlan {
    constructor({ id, problem, idColumn, parts }) {
        if (id) {
            this.id = id;
        } else {
            this.id = generateId(8);
        }

        this.problem = problem;
        this.assignment = {};
        this.parts = getParts(problem);
        if (parts) {
            for (let i = 0; i < parts.length; i++) {
                this.parts[i].updateDescription(parts[i]);
            }
        }
        if (problem.type === "multimember" || problem.type === "community") {
            this.parts.slice(1).forEach(part => {
                part.visible = false;
            });
        }
        if (problem.type === "community") {
            this.parts.forEach(part => {
                if (!part.name) {
                    part.name = `Community ${part.displayNumber}`;
                }
            });
        }
        this.idColumn = idColumn;
    }
    update(feature, part) {
        this.assignment[this.idColumn.getValue(feature)] = part;
    }
    serialize() {
        return {
            name: this.name,
            description: this.description,
            assignment: this.assignment,
            id: this.id,
            idColumn: { key: this.idColumn.key, name: this.idColumn.name },
            problem: this.problem,
            parts: this.parts.filter(p => p.visible).map(p => p.serialize())
        };
    }
}
