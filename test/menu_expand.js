/**
 * @File menu_expand.js
 * @author Lisc
 * @description Provide Menu expand
 * @copyright eacomp.com
 * @createDate 2020-7-01
 */

const $ = require('jquery');
const { MenuManager, Menu, MenuItem } = require('./menu');

class TextMenu extends Menu {
    constructor(menu_data) {
        super(menu_data);
        this.init();
    }

    init() {
        $(this.dom).addClass(``);
        this.handleEvents();
    }
}
