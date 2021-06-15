# DataTable

Written in `/src/components/Charts/DataTable.js`, 
The `DataTable` is a simple lit-html function that renders that creates a 
table of class `.data-table`. The function takes a `header`, various
`rows` and a an optional `left_corner` parameter set default to top
to create a `thead` and `tbody` in html. It is used to format...
- Election Results
- Median Income
- Demographics 
- Partisan Summaries
- VRA information and VRA results
- Historgrams
- Pivot Tables, Coalition Pivot Tables
- and Feature tables. 

## The Header Row

The `HeaderRow` is a lit-html function that takes variable names
and the option for the `left_corner`. Unless `left_corner` is true,
a dummy th is opened and closed. Then, for each variable name, 
a th is created of class `.data-table__column-heading` is created.
If there is only one variable name in the list, this header cell spans
two columns. 

## Cells

Each row is a collection of `Cell`s, which are themselves the result of
the lit-html `Cell` function, which takes an object pair of `content` and
`style`. When `DataTable` creates a row, a tr is created and a th of class
`data-table__row-heading` is created to render the `row.label`. Then, for
each `row.entries`, the Cell function is called, creating a td of
style `style` and content. 

Thus, `Cell` is a wrapper of td ensuring class `.ui-data` and
`data-table__cell` with passed in content and style.

> Parameter `header` is simply a list of variable names. Each row has a
`row.label` and a `row.entry` which is an object {`content` and `style`}.

# Pivot Table

The `PivotTable` is sort of an extension of the `DataTable` used when
drawing communities, as it is only called by the `community-plugin` to
represent Population or VAP. 

## Helper Functions

To help in the creation of `PivotTable`s and `DistrictEvaluationTable`s
described below, there are helper functions like `getCellStyle(value)` which
generates a gray-scaled background color based on parameter `value`, `getCell(value)`
which creates an object with pair `content` and `style`, and `getEntries(subgroup, part)` 
which creates cells that generate district and overall fractions.

Function `getBackgrounColor` is used by `getCellStyle` and its original 
documentation by [@maxhully] is printed below. 

```
/**
 * We want the background color to be #f9f9f9 when value = 0, and black when
 * the value = 1. #f9f9f9 is the same as rgba(0, 0, 0, 0.02), so we map the 0-to-1
 * value scale to the 0.02-to-1 alpha scale.
 * @param {number} value - the subgroup's share of the district's population
 *  (between 0 and 1)
 */
```

## The `PivotTable` Function
The `PivotTable` function is called when needed by the `community-plugin` and 
is used to represent both Population and VAP. 

### Contruction
 
The constructor takes a series of parameters. For our example, we will
consider as it is constructed to represent Population, one of only two
ways the PivotTable is used. Parameters include...
 - A `chartId`, the common name of the table like "Population"
 - A `columnSet`, like `state.population` 
 - A place name, like `state.place.name.`
 - The `parts` or drawn communities, `state.parts` 
 - And whether `spaital_abilities` permits coalitions. 

In addition, `PivotTable` takes a `uiState` and `dispatch` to include functionality.

If `coaltionEnabled`, a `mockColumnSet` must be created to keep track of coalition
tallies. First, the coaltion groups stored by `window.coaltionGroups`, selected
using the chekboxes in the Coalition Section of the Toolbar, are stored in an
array known as `mockData`. This `mockData` is fleshed out into a `coalitionSubgroup`,
akin to the `Subgroup` model with its own `key`, `name` and abbreviation and fraction
part functions. This subgroup is then merged with the standard `columnSet` into a new
new `mockColumnSet` object.

### Rendering

Inside a new section of class `toolbar-section`, if there are any visible parts to show,
a `Select` of visible parts is created within a `Parameter` class. Finally, a 
`DistrictEvaluationTable`is rendered. 

_why is coalitionSubgroup not created with a subgroup model?_ 

## The District Evaluation Table

The `DistrictEvaluationTable` function is included in `PivotTable.js` and is used by
both the `PivotTable` and the `CoalitionPivotTable`. In essence, it is simply
a `DataTable` with generated headers and rows. 

Its headers us simply an array of the `part.name` or `part.renderLabel()` and the
`placename`. The rows start with the `total`s of columnSet data and sum. Then,
each subgroup is given a row with a `label`, the subGroup abbreviation, and
entries for each `part`. 

# Coalition Pivot Table

The `CoalitionPivotTable` is another version of a `PivotTable` that is called in 
`data-layers-plugin.js`. It reimplements much of what is in `PivotTable` with the
added benefit of calculating district totals, but is always set when created by the
plugin with `totalonly` set to true. This means that the user is presented a simple table that
only shows state and coalition totals. 

_What is the relationship between PivotTable and CoalitionPivotTable such that
inheritance may occure?_
_Totals Only set to true! It could almost be replaced by PivotTable_