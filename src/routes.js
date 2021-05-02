import { listPlaces } from "./api/mockApi";
import { spatial_abilities } from "./utils";

const routes = {
    "/": "/",
    "/new": "/new",
    "/edit": "/edit",
    "/embedded": "/embedded",
    "/COI": "/COI",
    "/plan": "/plan",
    "/register": "/register",
    "/request": "/request",
    "/signin": "/signin",
    "/signout": "/signout"
};

export function navigateTo(route) {
    if (routes.hasOwnProperty(route) || route.includes("?event=")) {
        location.assign(routes[route] || route);
    } else {
        throw Error("The requested route does not exist: " + route);
    }
}

export function startNewPlan(place, problem, units, id, setParts, eventCode) {
    if (setParts) {
        problem.numberOfParts = setParts;
    }
    savePlanToStorage({ place, problem, units, id });
    let action = (window.location.hostname === "localhost" ? "edit" : (
      problem.type === "community" ? "COI" : "plan"
    ));
    navigateTo(eventCode ? (`/${action}?event=${eventCode}`) : `/${action}`);
}

export function savePlanToStorage({
    place,
    problem,
    units,
    id,
    assignment,
    name,
    description,
    parts
}) {
    const state = {
        place,
        problem,
        units,
        id,
        assignment,
        name,
        description,
        parts
    };
    if (!window.location.href.includes("embed")) {
        localStorage.setItem("savedState", JSON.stringify(state));
    }
}

export function savePlanToDB(state, eventCode, planName, callback, noNewScreenshot) {
    const serialized = state.serialize(),
        mapID = window.location.pathname.split("/").slice(-1)[0],
        token = localStorage.getItem("districtr_token_" + mapID) || "",
        createdAfter = (new Date() * 1) - 24 * 60 * 60 * 1000,
        tokenValid = (token && (token !== "null")
            && (token.split("_")[1] * 1 > createdAfter)),
        saveURL = tokenValid
            ? ("/.netlify/functions/planUpdate?id=" + mapID)
            : "/.netlify/functions/planCreate",
        requestBody = {
            plan: JSON.parse(JSON.stringify(serialized)),
            token: token.split("_")[0],
            eventCode: eventCode,
            planName: planName,
            isScratch: (document.getElementById("is-scratch") || {}).checked,
            hostname: window.location.hostname
        };
    // VA fix - if precinct IDs are strings, escape any "."
    Object.keys(requestBody.plan.assignment || {}).forEach(key => {
        if (typeof key === "string" && key.indexOf(".") > -1) {
            requestBody.plan.assignment[key.replace(/\./g, "÷")] =
                requestBody.plan.assignment[key];
            delete requestBody.plan.assignment[key];
        }
    });
    fetch(saveURL, {
        method: "POST",
        body: JSON.stringify(requestBody)
    })
    .then(res => res.json())
    .then(info => {
        if (info.simple_id) {
            let action = (window.location.hostname === "localhost" ? "edit" : (
              serialized.problem.type === "community" ? "COI" : "plan"
            ));
            history.pushState({}, "Districtr", `/${action}/${info.simple_id}`);
            if (info.token && localStorage) {
                localStorage.setItem("districtr_token_" + info.simple_id, info.token + "_" + (1 * new Date()));
            }
            if ((eventCode || (state.place.id === "michigan")) && spatial_abilities(state.place.id).shapefile) {
                fetch("//mggg.pythonanywhere.com/picture2?id=" + info.simple_id).then((res) => res.text()).then(f => console.log('saved image'))
            }
            callback(info.simple_id, action);
        } else {
            callback(null);
        }
    })
    .catch(e => callback(null));
}

export function getContextFromStorage() {
    const savedState = window.location.href.includes("embed")
        ? null
        : localStorage.getItem("savedState");
    let state;
    try {
        state = JSON.parse(savedState);
    } catch (e) {
        localStorage.removeItem("savedState");
        navigateTo("/new");
    }

    if (state === null || state === undefined) {
        navigateTo("/new");
    }

    return state;
}

export function loadPlanFromJSON(planRecord) {
    if (planRecord.msg && planRecord.plan) {
        // retrieved from database
        console.log(planRecord.msg);
        planRecord = planRecord.plan;
    }
    Object.keys(planRecord.assignment || {}).forEach((key) => {
        if (String(key).includes('÷')) {
            let newKey = key.replace(/÷/g, ".");
            planRecord.assignment[newKey] = planRecord.assignment[key];
            delete planRecord.assignment[key];
        }
    });
    return listPlaces(planRecord.placeId, (planRecord.state || (planRecord.place ? planRecord.place.state : null))).then(places => {
        const place = places.find(p => String(p.id).replace(/÷/g, ".") === String(planRecord.placeId));
        place.landmarks = (planRecord.place || {}).landmarks;
        planRecord.units = place.units.find(u => (u.name === planRecord.units.name) || (u.name === "Wards" && planRecord.units.name === "2011 Wards") || (u.name === "2011 Wards" && planRecord.units.name === "Wards"));
        return {
            ...planRecord,
            place
        };
    });
}

export function loadPlanFromCSV(assignmentList, state) {
    let rows = assignmentList.trim().split("\n");
    let headers = rows[0].replace(/"/g, "").trim().split(",");
    if (
        headers[0].indexOf("id-") === 0
        && headers[0].split("-").length === 5
    ) {
        // new format, verify units match
        //id-state.place.id-state.units.id
        let cols = headers[0].split("-");
        let placeId = cols[1],
            unitId = cols[2],
            partCount = cols[3],
            pluralType = cols[4];
        if (unitId.includes("_")) {
            unitId = unitId.split("_").slice(-1)[0];
        }

        if (placeId !== state.place.id) {
            throw new Error("CSV is for a different module (another state or region).");
        } else if (unitId !== state.units.id.split("_").slice(-1)[0]) {
            throw new Error("CSV is for this module but a different unit map (e.g. blocks, precincts).");
        }
        // else if (pluralType !== state.problem.pluralNoun.replace(/\s+/g, "")) {
        //     throw new Error("CSV is for this module but a different division map (e.g. districts)");
        // }
        state.problem.numberOfParts = partCount * 1;
    } else {
        // old format, no column headers
        headers = null;
    }
    let planRecord = state;
    planRecord.assignment = {};

    const delimiter = (state.place.id === "louisiana") ? ";" : ",";

    let districtIds = new Set(rows.map((row, index) => row.split(delimiter)[1].split("_")[0] ));
    if (headers) {districtIds.delete(rows[0].split(delimiter)[1]);}
    districtIds.delete(undefined);

    let distMap = Array.from(districtIds.values());
    (!isNaN(distMap[0] - distMap[1])) ? distMap.sort((a, b) => a - b) : distMap.sort();

    // if we didn't set numberOfParts in CSV, find max here
    state.problem.numberOfParts =  Math.max(state.problem.numberOfParts, distMap.length)


    return listPlaces(state.place.id, state.place.state).then(places => {
        rows.forEach((row, index) => {
            if (index > 0 || !headers) {
                let cols = row.split(delimiter),
                    val = cols[1].split("_"),
                    key = (isNaN(cols[0] * 1) || cols[0].match(/[^0-9]/) || cols[0][0] === "0")
                        ? cols[0]
                        : cols[0] * 1;
                if (typeof(key) === "string" && (key.includes("\""))) {
                    key = key.slice(1, -1);
                }

                if (key && val !== undefined) {
                    planRecord.assignment[key] = [];
                    val.forEach(v => planRecord.assignment[key].push(distMap.indexOf(v)));
                }
            }
        });
        const place = places.find(p => p.id === planRecord.place.id);
        return {
            ...planRecord,
            place
        };
    });
}

export function loadPlanFromURL(url) {
    return fetch(url)
        .then(r => r.json())
        .then(loadPlanFromJSON);
}
