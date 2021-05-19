import { html, render } from "lit-html";
import { until } from "lit-html/directives/until";
import { spatial_abilities } from "../utils";

export function renderModal(innerContent) {
    const target = document.getElementById("modal");
    return html`
        <div
            class="modal-wrapper"
            @click="${() => render("", target)}"
        >
            <div
                class="modal-content"
                @click="${e => e.stopPropagation()}"
            >
                <button
                    class="button button--transparent button--icon media__close"
                    @click=${() => render("", target)}
                >
                    <i class="material-icons">
                        close
                    </i>
                </button>
                ${innerContent}
            </div>
        </div>
    `;
}

export function renderSaveModal(state, savePlanToDB) {
    const target = document.getElementById("modal");

    savePlanToDB(state, undefined, null, (_id, action) => {
        let eventdefault = "";
        if (window.location.href.includes("event=")) {
            eventdefault = window.location.href.split("event=")[1].split("&")[0].split("#")[0];
        }
        let withUrl = (_id) => {
            render(renderModal(
                html`
                    <h3>Plan has been saved</h3>
                    <label>Use this URL to share your plan!</label>
                    <code>https://${window.location.host}/${action}/${_id}</code>
                    <button
                        id="copy-button"
                        @click="${() => {
                            var dummy = document.createElement("textarea");
                            document.body.appendChild(dummy);
                            dummy.value = `https://${window.location.host}/${action}/${_id}`;
                            dummy.focus();
                            dummy.select();
                            dummy.setSelectionRange(0, 99999); /* For mobile devices */
                            document.execCommand("copy");
                            document.body.removeChild(dummy);
                            document.getElementById("copy-button").innerHTML = "Copied";
                        }}"
                    > Copy to Clipboard </button>
                    <br/>
                    <p>You can close this window and keep working, and update whenever you’d like.  Even if you share the link, nobody but you can change your plan—other people’s changes will save to a new link.</p>
                    <p>When you are ready, you can bring this map back to the submission form on the ${state.place.state} Redistricting Public Comment Portal.</p>
                    <div style="text-align:center">
                      <a
                        href="${spatial_abilities(state.place.id).portal.endpoint}?${state.plan.problem.type === "community" ? "coi" : "plan"}id=${_id}#form"
                        target="_blank"
                        style="margin-left:auto;margin-right:auto;padding:6px;background-color:#1b5956;color:#fff;border-radius:.5rem;padding:.375rem .75rem;font-size:1rem;margin-top:.5rem;display:inline-block;"
                      >
                        Proceed to Submit Map
                      </a>
                    </div>
                `
            ), target);
        };
        if (_id || window.location.hostname === "localhost") {
            withUrl(_id);
        }
    });
}

export function renderAboutModal({ place, unitsRecord }, userRequested) {
    const target = document.getElementById("modal");
    const template = until(
        fetch(`/assets/about/${place.id}/${unitsRecord.id}.html`)
            .then((r) => {
                if (r.status === 200) {
                    return r.text();
                } else if (userRequested) {
                    return "No About Page exists for this project";
                } else {
                    throw new Error(r.statusText);
                }
            })
            .then(
                content => renderModal(
                    html`
                        <h2 class="media__title">${place.name}</h2>
                        <h3 class="media__subtitle">${unitsRecord.name}</h3>
                        ${html([content])}
                    `
                )
            ),
        ""
    );
    render(template, target);
}

export function renderPortalAboutModal({ place, plan, unitsRecord}, userRequested) {
    const target = document.getElementById("modal");
    const type = plan.problem.type === "community" ? "coi" : "districts";
    console.log(type);
    const template = until(
        fetch(`/assets/about/${place.id}/portal-${type}.html`)
            .then((r) => {
                if (r.status === 200) {
                    return r.text();
                } else if (userRequested) {
                    return "No About Page exists for this project";
                } else {
                    throw new Error(r.statusText);
                }
            })
            .then(
                content => renderModal(
                    html`
                        <h2 class="media__title">${place.name} - Drawing ${plan.problem.name ? plan.problem.name + " Districts" : "Communities of Interest"}</h2>
                        <h3 class="media__subtitle">Currently drawing with ${unitsRecord.name}.</h3>
                        ${html([content])}
                    `
                )
            ),
        ""
    );
    render(template, target);
}

export function renderVRAAboutModal(place) {
    const target = document.getElementById("modal");
    const template = until(
        fetch(`/assets/about/vra/precomputation_${place.id}.html`)
            .then((r) => {
                if (r.status === 200) {
                    return r.text();
                } else if (userRequested) {
                    return "No About Page exists for this project";
                } else {
                    throw new Error(r.statusText);
                }
            })
            .then(
                content => renderModal(
                    html`
                        <h2 class="media__title">${place.name}</h2>
                        ${html([content])}
                    `
                )
            ),
        ""
    );
    render(template, target);
}