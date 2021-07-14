# Districtr
# MAIMAIMAI 

[![Build Status](https://travis-ci.com/districtr/districtr.svg?branch=master)](https://travis-ci.com/districtr/districtr)
[![Netlify Status](https://api.netlify.com/api/v1/badges/61b9c7cf-9bc3-45b1-9476-22437ce398cd/deploy-status)](https://app.netlify.com/sites/districtr-web/deploys)
[![Greenkeeper badge](https://badges.greenkeeper.io/districtr/districtr.svg)](https://greenkeeper.io/)

Districtr is the open-source web app that empowers all people to draw
districting plans.

## Project values

-   **User experience.** Participating in the redistricting process should be
    easy and enjoyable.
-   **Openness and transparency.** The entire project is open-source, with
    permissive licenses. All of the data used in the app is
    [freely available](https://github.com/mggg-states) and well-documented. We
    explicitly declare where we get our data, how we've processed it, and what
    we think of its quality.
-   **Responsiveness to the community.** Different places have different values
    and priorities when it comes to drawing districts. We aim to highlight the
    specific concerns of the community in each place that we include in the app.

See also the
[Districtr Guiding Principles](https://github.com/vrdi/districtr-principles)
prepared by participants in MGGG's 2019 Voting Rights Data Institute.

## Contributing

If you're interested in contributing, thank you! Send an email to
[max@mggg.org](mailto:max@mggg.org) and we'll find a way that you can get
involved.

### Development

Here's how to get started.

1. Install [GitHub for Desktop](https://desktop.github.com/) (or just plain
   `git`), [Node.js](https://nodejs.org/en/), and a helpful text editor. We
   recommend [VS Code](https://code.visualstudio.com/).
2. Clone the repository using GitHub for Desktop, or by running
   `git clone https://github.com/districtr/districtr` from the command line.
3. Install the dependencies by running `npm install`.
4. To start the development server and make sure everything's set up, first run
   `npm run develop`. If you go to `http://localhost:3000`, you should see
   Districtr running. The development server will recompile the app's assets,
   JavaScript, HTML, and CSS as you edit the source files.

Districtr is built on [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/)
and [lit-html](https://lit-html.polymer-project.org/guide). We also use
[Sass](https://sass-lang.com/) for authoring CSS.

We use [Prettier](https://prettier.io) for formatting JS source code and
[ESLint](https://eslint.org) for linting (encouraging good habits and consistent
coding style).

#### Naming conventions

##### JavaScript

We use `PascalCase` for classes and components (e.g. `UIStateStore` or
`DataTable`). By "component", we mean any function that returns a `lit-html`
`TemplateResult`, or a class with a `.render()` method that does the same. We
use `camelCase` for everything else (e.g. variables and functions).

For file naming, we use `PascalCase` for files that export one main class or
component (e.g. `Layer.js` or `LayerTab.js`). We use `kebab-case` for other
JavaScript modules (e.g. `color-rules.js` or `routes.js`).

##### CSS

We try to use [BEM (block-element-modifier)](http://getbem.com/introduction/)
naming conventions for CSS classes.

### Testing

To run the unit test suite, run `npm run test`. We use the
[Mocha](https://mochajs.org/) test framework and the
[Chai](https://www.chaijs.com/) assertion library. We need to write more unit
tests!

### Reporting bugs and other issues

One of the best ways to contribute to Districtr (or any open source project) is
to report any bugs, problems, or points of confusion that you find. You can file
an issue in
[this GitHub repository](https://github.com/districtr/districtr/issues).