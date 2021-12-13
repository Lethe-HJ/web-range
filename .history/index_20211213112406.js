const { WebRangerComponent } = require('./web-ranger');
const FilterSearchComponent = require('./filterSearch');
const SearchInputComponent = require('./search');

const register_components_map = {
    SearchInputComponent,
    FilterSearchComponent
};

Object.values(register_components_map).forEach((item) => {
    item.defineCustomElements();
});

module.exports = {
    WebRangerComponent,
    ...register_components_map
};
