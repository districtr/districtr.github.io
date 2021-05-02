import lookupState from "./lookupOldState";

export function listPlaces(placeID, stateName) {
    if (!stateName) {
        stateName = lookupState[placeID];
    }
    if (placeID) {
        return fetch("https://deploy-preview-309--districtr-web.netlify.app/assets/data/modules/" + stateName + ".json").then(resp => resp.json()).then((data) => {
          return data.filter(d => d.id === placeID);
        });
    } else {
        return fetch("https://deploy-preview-309--districtr-web.netlify.app/assets/data/modules/" + stateName + ".json").then(resp => resp.json());
    }
}
