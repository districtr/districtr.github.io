import { handleResponse } from "../utils";
import { client } from "./client";

export function listPlaces() {
    return Promise.all([
        client
            .get("/places/")
            .then(handleResponse({ 200: resp => resp.json() })),
        fetch("https://districtr.org/assets/data/response.json").then(resp =>
            resp.json()
        )
    ]).then(([places, mockedPlaces]) => {
        const mockedPlacesByName = mockedPlaces.reduce(
            (table, place) => ({ ...table, [place.name]: place }),
            {}
        );
        return places.map(place => ({
            ...mockedPlacesByName[place.name],
            ...place
        }));
    });
}
