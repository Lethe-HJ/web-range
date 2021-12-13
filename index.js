const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { getTagName, nextCycle, readFile } = require('./tools');
const { COMPONENT_DEFAULT_ARGS, EVENT_NAMES_Li } = require('./const');
class WebRangerComponent extends HTMLElement {
    /**
     * define custom element with prototype and the spinal case word which equivalent to its prototype name
     * @param {Object} component_space space that defined the web component, default window
     */
    static defineCustomElements(component_space = window) {
        const tag_name = getTagName(this.name);
        if (component_space.customElements.get(tag_name)) return;
        component_space.customElements.define(tag_name, this);
    }

    /**
     * create component by js api not html tag
     * @param {HTMLElement} el
     * @param {Any} params
     * @returns component instance
     */
    static create(el, params = {}) {
        console.log('Active Mount');
        const component = document.createElement(getTagName(this.name));
        Object.keys(params).forEach((key) => {
            component.setAttribute(key, JSON.stringify(params[key]));
        });
        el.appendChild(component);
        return component;
    }

    constructor(config) {
        super();
        this.el = COMPONENT_DEFAULT_ARGS.el;
        this._initFiles(config);
        this.isShow = true;
        this.shadow_dom = false;
        this.dirname = config.dirname;
        this._loadTemplate();
    }

    /**
     * init template, styles, templateUrl and styleUrls
     * @param {COMPONENT_DEFAULT_ARGS} config
     */
    _initFiles(config) {
        const {
            dirname,
            template,
            templateUrl,
            styles,
            styleUrls,
            styleScoped
        } = Object.assign(COMPONENT_DEFAULT_ARGS, config);
        if (template) {
            this.template = template;
        } else {
            this.templateUrl = path.resolve(dirname, templateUrl);
        }
        if (styles) {
            this.styles = styles;
        } else {
            this.styleUrls = path.resolve(dirname, styleUrls);
        }
        if (this.shadow_dom) {
            this.preload_base_large_css_li = [
                './src/style/bootstrap.min.css',
                './src/style/global.css'
            ];
        }
        this.styleScoped = styleScoped;
    }

    /**
     * read html and css file or template string, and mount them (private method)
     */
    async _loadTemplate() {
        this.beforeCreate();
        console.log('loading template');
        // read css
        let p_base_css_content = Promise.resolve('');
        let p_css_content = Promise.resolve(this.style);
        if (this.styles) {
            if (this.shadow_dom) {
                p_base_css_content = this._loadBaseLargeCss();
            }
            p_css_content = Promise.resolve(this.styles);
        } else {
            p_css_content = readFile(this.styleUrls);
        }
        // read template or html, and mount them
        let p_html_content = '';
        if (!this.template) {
            p_html_content = readFile(this.templateUrl);
        } else {
            p_html_content = Promise.resolve(this.template);
        }
        const template = document.createElement('template');

        const [base_css_content, css_content, html_content] = await Promise.all(
            [p_base_css_content, p_css_content, p_html_content]
        );
        // 在下面的style标签中加入 @import './style/bootstrap.min.css';也能获取css文件 不过会有一定的阻塞

        let { compiled_html, compiled_css } = this.innerStyleClassNameCompile(
            html_content,
            css_content
        );
        const style_content = `
            <style>
                ${base_css_content}
                ${compiled_css}
            </style>
        `;
        template.innerHTML = compiled_html + style_content;
        const content = template.content.cloneNode(true);
        if (this.shadow_dom) {
            this._shadowRoot = this.attachShadow({ mode: 'open' });
            this._shadowRoot.appendChild(content);
            this.root = this._shadowRoot;
        } else {
            this.appendChild(content);
            this.root = this;
        }
        this._created();
        nextCycle(() => {
            this._mounted();
        });
    }

    /**
     * replace double Underscore prefix with hash prefix in style class name
     * example "__input-after" => "c4s5e2-search_input-after"
     * @param {*} html_content
     * @param {*} css_content
     * @returns
     */
    innerStyleClassNameCompile(html_content, css_content) {
        let compiled_html = html_content;
        let compiled_css = css_content;
        const prefix = `c${uuidv4().substring(0, 6)}`;
        if (this.styleScoped) {
            compiled_html = compiled_html.replaceAll(
                /(\<[\w\-]+[\s\S]*?\sclass\=\")([\s\S]*?)(\"[\s\S]*?\>)/g,
                (match, p1, p2, p3) => {
                    p2 = p2.replaceAll(/__/g, `${prefix}_`);
                    return `${p1}${p2}${p3}`;
                }
            );
            compiled_css = compiled_css.replaceAll(
                /\.__([\w\-]+)/g,
                `.${prefix}_$1`
            );
        }
        return { compiled_html, compiled_css };
    }

    /**
     * change this for dom event
     */
    domEventRegister() {
        EVENT_NAMES_Li.forEach((name) => {
            const doms = $(this).find(`[${name}]`);
            doms.each((index, item) => {
                item[name] = item[name].bind(this);
            });
        });
    }
    /**
     * load base large css file when this function is used globally for the first time
     * @returns Promise
     */
    async _loadBaseLargeCss() {
        let base_css_content = '';
        if (!WebRangerComponent.base_css_content) {
            const p_base_css_content_li = [];
            this.preload_base_large_css_li.forEach((file_path) => {
                p_base_css_content_li.push(readFile(file_path));
            });
            const base_css_content_li = await Promise.all(
                p_base_css_content_li
            );
            base_css_content_li.forEach((item) => {
                base_css_content += item;
            });
            WebRangerComponent.base_css_content = base_css_content;
        } else {
            base_css_content = WebRangerComponent.base_css_content;
        }

        return Promise.resolve(base_css_content);
    }

    /**
     * init props into this.props
     */
    initProps() {
        const props = {};
        for (let i = 0; i < this.attributes.length; i += 1) {
            let key = this.attributes[i].name;
            const value = this.attributes[key].value;
            const res = key.match(/\[(\w+)\]/);
            if (res) {
                // 稍后设置该组件在父组件dom中声明的数据绑定
                key = res[1];
                nextCycle(() => {
                    const default_value =
                        this.__parent.getValueFromDotKey(value);
                    this.setAttribute(key, default_value);
                    this.__parent.setMVBinder(value, this, key);
                });
                continue;
            }
            try {
                props[key] = JSON.parse(value);
            } catch (error) {
                // value maybe string when key is class, style, etc.
                if (/^SyntaxError: Unexpected token/.test(error.toString())) {
                    props[key] = value;
                } else {
                    throw error;
                }
            }
        }
        this.props = {
            ...props,
            css: undefined
        };
        props.css && $(this).css(props.css);
    }

    /**
     * Associate component tree upward
     */
    connectToComponentTree() {
        const recursionToTop = (node, origin) => {
            const child_comp = origin || node;
            const parent_dom = $(node).parent().get(0);
            if (!parent_dom) {
                // 已经到顶了
                if (process.env.NODE_ENV === 'development') {
                    // 将组件树声明到window上 方便调试
                    if (!window.comp_tree) {
                        window.comp_tree = [origin];
                    } else {
                        window.comp_tree.push(origin);
                    }
                }
                return;
            }
            if (parent_dom instanceof WebRangerComponent) {
                child_comp.__parent = parent_dom;
                if (parent_dom.__parent) return;
                if (parent_dom.__children)
                    parent_dom.__children.push(child_comp);
                else parent_dom.__children = [child_comp];
                return;
            } else {
                // 继续在dom树上向上探索
                return recursionToTop(parent_dom, child_comp);
            }
        };
        recursionToTop(this);
    }
    /**
     * do something before create
     * this.props not exist, but this.attributes exist
     */
    beforeCreate() {
        console.log('beforeCreate');
    }

    /**
     * HTMLElement api
     * 元素被插入到DOM时执行，通常用来获取数据，设置默认属性。
     * 时机: 接在constructor后面
     */
    connectedCallback() {
        // 没有记录父组件 则向上探索直到将其记录到组件树上
        !this.__parent && this.connectToComponentTree();
        console.log('connectedCallback');
        this.initProps();
        this._setData();
    }

    /**
     * execute this.data() and set returnValue to this.data
     */
    _setData() {
        console.log('setData');
        this.data = this.setData();
    }

    /**
     * set default data
     * @returns data object
     */
    setData() {
        return {};
    }

    _created() {
        console.log('_created');
        this.domEventRegister();
        this.created();
    }

    /**
     * props
     */
    created() {
        console.log('created');
    }

    _mounted() {
        console.log('_mounted');
        this.mounted();
    }

    /**
     * dom mount completely
     */
    mounted() {
        console.log('mounted');
    }

    /**
     * 当 custom element增加、删除、修改被关注的自身属性时调用
     * 关注的属性由observedAttributes注册
     * @param {String} name
     * @param {String} oldVal
     * @param {String} newVal
     */
    attributeChangedCallback(name, oldVal, newVal) {
        this.onChanges(name, oldVal, newVal);
    }

    /**
     * new api for replacing attributeChangedCallback
     * @param {String} name
     * @param {String} oldVal
     * @param {String} newVal
     */
    onChanges(name, oldVal, newVal) {}

    /**
     * get value of last key in keys
     * @param {String} keys
     * @returns {Any} father object of last key
     */
    getValueFromDotKey(keys) {
        let father = this;
        keys.split('.').forEach((key) => {
            father = father[key];
        });
        return father;
    }

    /**
     * set value of last key in keys
     * @param {String} keys key path, example "data.value1"
     * @param {any} value value
     * @returns { {father:Any, key:String} } father: father object of last key, key: last key, example { father: "data", key: "value1"}
     */
    setValueFromDotKey(keys, value) {
        let father = this;
        const key_li = keys.split('.');
        let key = '';
        let index = 0;
        const last_index = key_li.length - 1;
        while (index <= last_index) {
            key = key_li[index];
            if (index === last_index) {
                father[key] = value;
            } else father = father[key];
            index += 1;
        }
        return { father, key };
    }

    /**
     * set binding to update dom when model changed
     * @param {String} key
     * @param {String|HTMLElement} dom selector string or dom
     * @param {String} bind_attr attribute being monitored
     */
    setMVBinder(keys, dom, bind_attr) {
        let value = this.getValueFromDotKey(keys); // set default value
        const _this = this;
        const { father, key } = this.setValueFromDotKey(keys);
        Object.defineProperty(father, key, {
            get() {
                return value;
            },
            set(newValue) {
                if (newValue === value) return;
                let matches =
                    typeof dom === 'string' ? $(_this.root).find(dom) : dom;
                $(matches).each((index, match) => {
                    if (bind_attr) {
                        $(match).attr(bind_attr, newValue);
                        return;
                    }
                    const tag_bind_map = {
                        INPUT: 'value',
                        IMG: 'src'
                    };
                    const tagName = $(match)[index].tagName;
                    if (tag_bind_map[tagName]) {
                        $(match).attr(tag_bind_map[tagName], newValue);
                    } else {
                        $(match).text(newValue);
                    }
                });
                value = newValue;
            },
            enumerable: true,
            configurable: true
        });
    }

    /**
     * set binding to update model when view changed
     * @param {String|HTMLElement} dom selector string or dom
     * @param {String} keys path of key, example "data.value"
     * @param {String} event which event to trigger data update, default change
     */
    setVMBinder(dom, keys, event = 'change') {
        $(this.root)
            .find(dom)
            .on(event, (e) => {
                if (this.getValueFromDotKey(keys) === e.target.value) return;
                this.setValueFromDotKey(keys, e.target.value);
            });
    }

    /**
     * two way data binding
     * @param {String} keys path of key, example "data.value"
     * @param {String|HTMLElement} dom selector string or dom
     * @param {String} bind_attr function whose returnValue setted to model
     * @param {String} event which event to trigger data update
     */
    setMVVMBinder(keys, dom, bind_attr, event) {
        this.setMVBinder(keys, dom, bind_attr);
        this.setVMBinder(dom, keys, event);
    }

    /**
     * emit event out to parent component
     * @param {String} event_name
     * @param  {...any} args
     */
    emit(event_name, ...args) {
        $(this).trigger(event_name, args);
    }
    /**
     * do something that must be executed before dom destroyed
     */
    beforeDestroy() {}

    /**
     * execute beforeDestroy, remove dom and delete window.components
     */
    destroy() {
        $(this.root).remove();
        console.log('execute destroy');
    }

    // 元素从DOM移除时执行，通常用来做清理工作，例如取消事件监听和定时器。
    disconnectedCallback() {
        this.destroy();
        this.beforeDestroy();
        nextCycle(() => {
            this.destroyed();
        });
    }

    destroyed() {}

    hide() {
        $(this.root).hide();
        this.isShow = false;
    }

    show() {
        $(this.root).show();
        this.isShow = true;
    }

    toggle() {
        if (this.isShow) {
            this.hide();
        } else {
            this.show();
        }
    }
}

module.exports = { WebRangerComponent };
