const { WebRangerComponent } = require('../web-ranger');
const { nextCycle } = require('../../../common/utils');

/**
 * @description search component with filter function
 * @example
    new FilterSearchComponent({
        el: this,
        data: {
            options: [{id: 111, label: 'task'}, {id: 112, label: 'group'}],
            value: "",
            search_key: '',
        }
    });
 */
class FilterSearchComponent extends WebRangerComponent {
    constructor() {
        super({
            dirname: __dirname
        });
        this.observed = ['value'];
    }

    setData() {
        return {
            options: [],
            value: '',
            search_key: ''
        };
    }

    /**
     * props data都已经初始化完成
     */
    created() {
        this.$search_input_subcomp = $(this.root).find('#search-input-comp');
        this.initDomEvent();
        this.data.options = this.props.options;
        this.dataBinder();
        this.data.search_key = this.props.search_key;
    }

    /**
     * init event of dom
     */
    initDomEvent() {
        // dropdown-btn toggle logic
        $(this.root)
            .find('#dropdown-btn')
            .on('click', () => {
                this.dropdoMenuToggle();
                this.focusSearchInputCompLater();
            });

        // Listen to the custom event of the subcomponent 'search_input_subcomp'
        this.$search_input_subcomp.on('inputed', (e, reg, value) => {
            this.data.value = value;
            this.search(this.data.search_key, reg);
            // focus input after dom updated
            this.focusSearchInputCompLater();
        });
    }

    /**
     * focus input of search_input_comp later
     */
    focusSearchInputCompLater() {
        nextCycle(() => {
            this.$search_input_subcomp[0].inputFocus();
        });
    }

    dataBinder() {
        // data init
        let dropdown_li_html = '';
        this.data.options.forEach((option) => {
            dropdown_li_html += `<li id="${option.id}"><a href="#">${option.label}</a></li>`;
        });
        $(this.root).find('#dropdown-menu').append(dropdown_li_html);
        this.setMVVMBinder('data.value', '#filter-search-input');
        this.setMVBinder('data.search_key', '#caret');
        const dropdown_lis = $(this.root).find('#dropdown-menu>li');
        dropdown_lis.each((index, li) => {
            $(li).on('click', (e) => {
                this.data.search_key = this.data.options[index].label;
                this.dropdoMenuToggle();
            });
        });
    }

    dropdoMenuToggle() {
        const dropdown_menu = $(this.root).find('#dropdown-menu');
        dropdown_menu.toggle();
        const dropdown_menu_height = dropdown_menu.height();
        const toggle_height = dropdown_menu_height + 20;
        const is_display_none =
            dropdown_menu.css('display') === 'none' ? -1 : 1;
        const filter_search = $(this.root).find('#filter-search');
        filter_search.height(
            filter_search.height() + is_display_none * toggle_height
        );
    }

    search(key, value) {
        return [];
    }
}

module.exports = FilterSearchComponent;
