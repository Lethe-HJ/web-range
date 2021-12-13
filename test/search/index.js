const { WebRangerComponent } = require('../web-ranger');

const REG_MODE = { DEFAULT: 0, CASE: 1, WORD: 2, REG: 4 };

/**
 * escape reg string
 * @param {String} str
 * @returns {String} escaped_str
 */
const escapeStr = (str) => {
    const escapeChars = [
        '\\\\',
        '\\^',
        '\\$',
        '\\+',
        '\\?',
        '\\=',
        '\\!',
        '\\.',
        '\\/',
        '\\(',
        '\\)',
        '\\[',
        '\\]',
        '\\{',
        '\\}'
    ];
    escapeChars.forEach((item) => {
        str = str.replace(new RegExp(item, 'g'), item);
    });
    return str;
};

/**
 * @description search component with filter function
 * @example
    new SearchComponent({
        el: this.dom,
        data: {
            options: [{id: 111, label: 'task'}, {id: 112, label: 'group'}],
            value: "",
            search_key: '',
        }
    });
 */
class SearchInputComponent extends WebRangerComponent {
    // 注册对组件属性的变化的监听
    static get observedAttributes() {
        return ['value'];
    }

    constructor() {
        super({
            dirname: __dirname
        });
    }

    setData() {
        return {
            search_key: '',
            value: ''
        };
    }

    created() {
        this.regMode = 0;
        let timer_id = null;
        $(this.root)
            .find('#filter-search-input')
            .on('change', (e) => {
                this.emitInputed(e);
            })
            .on('input', (e) => {
                // auto debounce search when input
                if (timer_id) clearTimeout(timer_id);
                timer_id = setTimeout(() => {
                    this.emitInputed(e);
                }, 500);
            });
    }

    mounted() {
        this.inputFocus();
    }

    onChanges(name, oldVal, newVal) {
        if (name === 'value') {
            this.data.value = newVal;
        }
    }

    inputFocus() {
        $(this.root).find('#filter-search-input').trigger('focus');
    }

    emitInputed(e) {
        const value = e ? $(e.target).text() : this.data.value;
        this.emit('inputed', this.valueToReg(value), value);
    }

    clickTools(e, value) {
        const i_dom = $(e.target);
        if (i_dom.hasClass('active')) {
            i_dom.removeClass('active');
            this.regMode -= REG_MODE[value];
        } else {
            i_dom.addClass('active');
            this.regMode += REG_MODE[value];
        }
        this.emitInputed();
    }

    /**
     *
     * @param {*} value
     * @returns
     */
    valueToReg(value) {
        switch (this.regMode) {
            case REG_MODE.DEFAULT:
                return new RegExp(escapeStr(value), 'i');
            case REG_MODE.CASE:
                return new RegExp(escapeStr(value));
            case REG_MODE.WORD:
                return new RegExp(`^${escapeStr(value)}$`, 'i');
            case REG_MODE.REG:
                return new RegExp(value, 'i');
            case REG_MODE.CASE + REG_MODE.WORD:
                return new RegExp(`^${escapeStr(value)}$`);
            case REG_MODE.CASE + REG_MODE.REG:
                return new RegExp(value);
            case REG_MODE.WORD + REG_MODE.REG:
                return new RegExp(`^${value}$`, 'i');
            case REG_MODE.CASE + REG_MODE.WORD + REG_MODE.REG:
                return new RegExp(`^${value}$`);
        }
    }
}

module.exports = SearchInputComponent;
