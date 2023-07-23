/**
 * Generate a random component identifier.
 * @returns {string} random unique identifier
 */
const randomID = () => 'v-' + Math.floor(Math.random() * 1000000);

/**
 * The head element of the document.
 */
const head = document.head || document.getElementsByTagName('head')[0];

/**
 * The body element of the document.
 */
const body = document.body || document.getElementsByTagName('body')[0];

/**
 * The array of the registered components.
 * @type {Component[]}
 */
let components = [];

/**
 * The style element used for setting global style properties.
 */
let globalStyle = document.createElement('style');
head.appendChild(globalStyle);

/**
 * Represents a holder of the default framework fonts.
 */
class Font {
    /**
     * The default font used by the framework. Credits for bootstrap 4.
     */
    static DEFAULT = {
        name: 'System-UI',
        value: 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Liberation Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"'
    }
}

/**
 * Represents a renderer HTML node in the application.
 * It is the base class of every framework elements.
 */
class Component {
    /**
     * Initialize component node.
     * @param {string} tag component tag
     * @param {Object} component attributes
     * @param {...Component} content component children
     */
    constructor(tag, attributes, ...content) {
        this.tag = tag;
        this.attributes = attributes || {};
        this.content = content || [];
        this.attributes.id = this.attributes.id || randomID();
        this.state = {};
        // register the component globally
        components.push(this);
        this.parseAttributes();
        this.onMount();
    }

    /**
     * Render the component. Determine what exactly should be displayed
     * on the screen from the component. By default, the component renders
     * itself, but class-based renderers may override this.
     * @returns {Component} component rendering result
     */
    render() {
        return this;
    }

    /**
     * Called after the component was initialized.
     */
    onMount() {
    }

    /**
     * Called after the component was created on the screen.
     */
    onCreate() {
    }

    /**
     * Called after the document was fully loaded.
     */
    onLoad() {
        // get the HTML representation of the component
        let element = this.getElement();
        if (element == null)
            return;
        // register the component listeners
        if (this.attributes.onclick != null) {
            element.addEventListener('click', this.attributes.onclick);
        }
    }

    /**
     * Add a node to the component content.
     * @param {Component} node node to add
     */
    addNode(node) {
        this.content.push(node);
    }

    /**
     * Add multiple nodes to the component content.
     * @param {...Component} nodes nodes to add
     */
    addNodes(...nodes) {
        for (const node of nodes) {
            this.content.push(node);
        }
    }

    /**
     * Get the component's corresponding HTMl element.
     * @returns {HTMLElement | null} DOM component element
     */
    getElement() {
        return document.getElementById(this.attributes.id);
    }

    /**
     * Refresh the inner html of this component.
     */
    refresh() {
        if (this.rendered) {
            const element = document.getElementById(this.rendered.attributes.id);
            element.innerHTML = this.render().parse();
        }
    }

    /**
     * Update the state of the component.
     * @param {Object} newState - new component states
     */
    setState(newState) {
        // update the state object
        this.state = {
            ...this.state,
            ...newState
        }
        // refresh the application
        this.refresh();
    }

    /**
     * Parse the full component with all its nodes to a string,
     * that can be rendered onto a HTML root element.
     * @returns {string} component string representation
     */
    parse() {
        // extract the parse information from this component
        const tag = this.tag;
        const attributes = this.attributes;
        const content = this.content;

        // parse the attributes of the components
        let parsedAttributes = '';
        for (const attribute in attributes)
            // add the attribute key and value
            parsedAttributes += ` ${attribute}="${attributes[attribute]}"`;

        // check if the component has any child nodes
        if (content.length > 0) {
            // parse the content of the component
            let parsedContent = '';
            for (const node of content) {
                // parse the node, if it is a component as well
                if (node instanceof Component) {
                    node.parent = this;
                    parsedContent += node.parse();
                }
                // parse observable state
                else if (node instanceof Observer)
                    parsedContent += node.get();
                // node is not a component, more like a raw value
                // append it without any modification
                else
                    parsedContent += node;
            }
            // finally, put all the parsed information together
            return `<${tag}${parsedAttributes}>${parsedContent}</${tag}>`;
        }

        // component does not have any children
        // parse it with the simplified tag design
        return `<${tag}${parsedAttributes}/>`;
    }

    /**
     * Parse the style and classes of the component using attributes.
     */
    parseAttributes() {
        // handle component flags
        let classes = ['void-layout'];
        // attribute name to css class name map
        const flags = {
            'flex': 'void-flex',
            'center': 'void-align-center',
            'centerHorizontal': 'void-align-center-horizontal',
            'centerVertical': 'void-align-center-vertical'
        };
        for (const key in flags) {
            if (key in this.attributes)
                classes.push(flags[key]);
        }
        this.classes = classes;
        // pre-define style aliases
        const styles = {
            'grow': 'flex-grow',
            'background': 'background',
            'foreground': 'color',
            'color': 'color',
            'padding': 'padding',
            'margin': 'margin'
        };
        // handle component style
        let styleParsed = '';
        for (const key in styles) {
            if (key in this.attributes) {
                let styleKey = styles[key];
                let styleValue = this.attributes[key];
                styleParsed += `${styleKey}:${styleValue};`;
            }
        }
        let componentStyle = this.style() || {};
        // handle special style attributes
        this.handleSpecialAttributes(componentStyle);
        // add component-declared style
        for (let key in componentStyle) {
            // check if the key is an alias
            if (key in styles)
                key = styles[key];
            styleParsed += `${key}:${componentStyle[key]};`;
        }
        this.styleParsed = styleParsed;
    }

    /**
     * Handle special style modifier attributes.
     */
    handleSpecialAttributes(componentStyle) {
        // handle padding modifiers
        this.getAttribute(padding => {
            componentStyle['padding-left'] = padding;
            componentStyle['padding-right'] = padding;
        }, 'paddingHorizontal', 'paddingHor', 'paddingH');
        this.getAttribute(padding => {
            componentStyle['padding-top'] = padding;
            componentStyle['padding-bottom'] = padding;
        }, 'paddingVertical', 'paddingVert', 'paddingV');
        // handle margin modifiers
        this.getAttribute(margin => {
            componentStyle['margin-left'] = margin;
            componentStyle['margin-right'] = margin;
        }, 'marginHorizontal', 'marginHor', 'marginH');
        this.getAttribute(margin => {
            componentStyle['margin-top'] = margin;
            componentStyle['margin-bottom'] = margin;
        }, 'marginVertical', 'marginVert', 'marginV');
    }

    /**
     * Get the value of the given attribute key.
     * @param {Function} callback attribute value handler
     * @param {...string} names attribute key aliases
     */
    getAttribute(callback, ...names) {
        for (let name of names) {
            if (name in this.attributes)
                return callback(this.attributes[name]);
        }
    }

    /**
     * Get the style of the component.
     * @returns {{}} css style map
     */
    style() {
        return {};
    }
}

/**
 * Represents a component that can hold and render multiple child components.
 */
class Layout extends Component {
    /**
     * Render the component. Determine what exactly should be displayed
     * on the screen from the component. By default, the component renders
     * itself, but class-based renderers may override this.
     * @returns {Component} component rendering result
     */
    render() {
        // create the parent class that will hold the elements
        let classes = this.classes.join(' ');
        let attributes = { 'class': classes };
        if (this.styleParsed.length > 0)
            attributes.style = this.styleParsed;
        let parent = Void.createElement('div', attributes);
        // add this nodes to the parent
        for (const node of this.content) {
            // make sure to only render the content of layouts
            if (node instanceof Layout)
                parent.addNode(node.render())
            else
                parent.addNode(node);
        }
        return parent;
    }
}

/**
 * Represents a component that can hold and render multiple child components vertically aligned.
 */
class FlexLayout extends Layout {
    onMount() {
        super.onMount();
        this.classes.push('void-flex');
    }
}

class Text extends Layout {
    /**
     * Render the component. Determine what exactly should be displayed
     * on the screen from the component. By default, the component renders
     * itself, but class-based renderers may override this.
     * @returns {Component} component rendering result
     */
    render() {
        return Void.createElement('p', {}, ...this.content);
    }
}

/**
 * Check if the given object is a callable function.
 * @param {Function} func target object
 * @returns {boolean} true if the object is callable
 */
const __checkFunction = (func) => typeof func == 'function';

/**
 * Check if the given object is a constructor of a class.
 * @param {Function} func target object
 * @returns {boolean} true if the object is a class constructor
 */
const __checkConstructor = (func) => !Object.hasOwn(Object.getPrototypeOf(func), 'constructor');

class Void {
    /**
     * Handle react-like element creation.
     * @param {string | Component | Function} data element tag or data
     * @param {Object} attributes element attributes
     * @param {...(Component | any)} content element child nodes
     */
    static createElement = (data, attributes, ...content) => {
        // check if the given data is a function or a constructor
        let isFunction = __checkFunction(data);
        let isConstructor = __checkConstructor(data);

        // handle default element creation
        // this method is used when parsing default html elements
        if (!isFunction)
            // create a new component with the given element data
            return new Component(data, attributes, ...content);

        // handle functional element creation
        // this method is used when creating elements with a method
        // let the function create the parent component for this
        if (!isConstructor)
            // make the function create the component
            return data(...content);

        // handle class-based element creation
        // this method is used when creating elements with extended component classes
        // instantiate the target component class
        return new data(data.name, attributes, ...content);
    };

    /**
     * Create a content root to render elements into.
     * @param {string} name - root html element name
     * @returns {HTMLDivElement} - new html root element
     */
    static createRoot = (name = 'root') => {
        // create the root element
        let root = document.createElement('div');
        root.classList.add(name);
        // append the root to the body
        body.appendChild(root);
        return root;
    }

    /**
     * Render a drawable component on the given canvas HTML element.
     * @param {Component} component component to render
     * @param {HTMLElement} root element to render to
     */
    static render = (component, root) => {
        component.parent = root;
        // make the component render itself to a component
        let rendered = component.render();
        component.rendered = rendered;
        rendered.parent = rendered;
        // set the rendered element's id to the component element
        rendered.attributes.id = component.attributes.id;
        // parse the rendered component
        let parsed = rendered.parse();
        // append the parsed component data to the root element
        root.innerHTML += parsed;
        // handle component post creation
        component.onCreate();
    };

    /**
     * Append style properties for the given component.
     * @param {Component} component target component
     * @param {Object} style component style
     */
    static addStyle = (component, style) => {
        // parse the style to string
        let parsedStyle = `#${component.attributes.id} {`;
        for (const property in style)
            parsedStyle += `${property}:${style[property]};`;
        globalStyle.innerHTML += parsedStyle + '}';
    }
}

// override babel's react create element method
let React = {};
React.createElement = Void.createElement;

// call component on load handlers on window load
window.onload = () => components.forEach(component => component.onLoad());

/**
 * Represents a page in an application that can render elements separately from other pages.
 */
class Page {
    /**
     * Initialize the page.
     * @param page page renderer function
     * @param options page options
     */
    constructor(renderer, options) {
        this.renderer = renderer;
        this.options = options;
    }

    /**
     * Render the content of the page.
     * @returns {Component} page content
     */
    render() {
        return this.renderer();
    }
}

/**
 * Represents a Void rendering application environment.
 */
class App {
    /**
     * The currently rendering app.
     * @type {App}
     */
    static currentApp;

    /**
     * Initialize application.
     * @param {HTMLElement} root application root element
     * @param {Map<string, Page> | null} pages initial pages data
     */
    constructor(root, pages) {
        this.root = root;
        this.pages = pages ?? {};
        App.currentApp = this;
    }

    /**
     * Register a page to the application.
     * @param {string} name page name
     * @param {Component} renderer page content renderer
     * @param {{}} options - renderer options
     */
    register(name, renderer, options) {
        // create the page
        let page = new Page(renderer, options ?? {});
        // register the page
        this.pages[name] = page;
    }

    /**
     * Render the specified page.
     * @param {string} name page name
     */
    render(name) {
        // get the page from name
        let page = this.pages[name];
        // check if the page is not registered
        if (page == null)
            return;
        // create the page component
        let component = page.render() || Void.createElement('pre', {}, `Page '${name}' is has nothing to render`);
        // render the component on the application root
        Void.render(component, this.root);
        this.currentPage = { page, name };
    }

    /**
     * Refresh the currently rendered page.
     */
    refresh() {
        // return if there is no page rendered at the moment
        if (!this.currentPage)
            return;
        // create the page component
        let component = this.currentPage.page.render()
            || Void.createElement('pre', {}, `Page '${this.currentPage.name}' is has nothing to render`);
        // reset the existing html code
        this.root.innerHTML = ''
        // render the component on the application root
        Void.render(component, this.root);
    }
}

/**
 * Represents an event manager which can register, unregister and call certain event types.
 */
class EventEmitter {
    /**
     * Initialize the event emitter.
     */
    constructor() {
        this.listeners = {}
    }

    /**
     * Subscribe a new listener for the specified event type.
     * @param {string} event - event type
     * @param {(...args: any) => void} listener - listener for the event
     */
    on(event, listener) {
        if (!this.listeners[event])
            this.listeners[event] = [];
        this.listeners[event].push(listener);
    }

    /**
     * Unsubscribe an event listener from the specified event type.
     * @param {string} event - event type
     * @param {(...args: any) => void} listener - listener for the event
     */
    off(event, listener) {
        this.listeners[event].filter(item => item !== listener);
    }

    /**
     * Emit an event with the specified arguments.
     * @param {string} event - event type
     * @param {...any} args - event call arguments
     */
    emit(event, ...args) {
        const listeners = this.listeners[event];
        if (!listeners)
            return;
        for (const listener of listeners)
            listener(...args);
    }
}

/**
 * Represents a state observer that is able to tract the mutation of a value.
 * @template T - observer state value type
 */
class Observer extends EventEmitter {
    /**
     * Initialize the state observer.
     * @param {T} defaultValue - observer default value
     * @param {Component[]} targets - observer initial target components
     */
    constructor(defaultValue, ...targets) {
        super();
        this.value = defaultValue;
        this.targets = targets;
    }

    /**
     * Get the value of the observer.
     * @returns {T} current observer value
     */
    get() {
        return this.value;
    }

    /**
     * Refresh the target components of the observer.
     */
    mutate() {
        for (const target of this.targets)
            target.refresh();
        this.emit('mutate', this.value);
    }

    /**
     * Update the value of the observer.
     * @param {T} newValue - new observer value
     */
    set(newValue) {
        this.value = newValue;
        this.mutate();
    }

    /**
     * Subscribe a new component for the observer to be refreshed on mutation.
     * @param {Component} target - additional observer target
     */
    subscribe(target) {
        this.targets.push(target);
    }

    /**
     * Unsubscribe a component from the observer mutation refresher.
     * @param {Component} target - observer target to remove
     */
    unsubscribe(target) {
        this.targets.filter(item => item !== element);
    }

    /**
     * Increment the value of the observer if it is a number.
     */
    increment() {
        if (/^-?[\d.]+(?:e-?\d+)?$/.test(this.value)) {
            this.value++;
            this.mutate();
            this.emit('increment', this.value);
        }
    }

    /**
     * Decrement the value of the observer if it is a number.
     */
    decrement() {
        if (/^-?[\d.]+(?:e-?\d+)?$/.test(this.value)) {
            this.value--;
            this.mutate();
            this.emit('decrement', this.value);
        }
    }

    /**
     * Add the specified amount to the observer value if it is a number.
     * @param {number} amount - number to add
     */
    add(amount) {
        if (/^-?[\d.]+(?:e-?\d+)?$/.test(this.value)) {
            this.value += amount;
            this.mutate();
            this.emit('add', this.value);
        }
    }

    /**
     * Subtract the observer value with the specified amount if it is a number.
     * @param {number} amount - number to add
     */
    subtract(amount) {
        if (/^-?[\d.]+(?:e-?\d+)?$/.test(this.value)) {
            this.value -= amount;
            this.mutate();
            this.emit('subtract', this.value);
            this.emit('subtract', this.value);
        }
    }

    /**
     * Multiply the observer value with the specified amount if it is a number.
     * @param {number} amount - number to multiply with
     */
    multiply(amount) {
        if (/^-?[\d.]+(?:e-?\d+)?$/.test(this.value)) {
            this.value *= amount;
            this.mutate();
            this.emit('multiply', this.value);
        }
    }

    /**
     * Divide the observer value with the specified amount if it is a number.
     * @param {number} amount - number to divide with
     */
    divide(amount) {
        if (/^-?[\d.]+(?:e-?\d+)?$/.test(this.value)) {
            this.value /= amount;
            this.mutate();
            this.emit('divide', this.value);
        }
    }

    /**
     * Get the total length of the observer value.
     * @returns {number} observer state value length
     */
    length() {
        return toString(this.value).length
    }

    /**
     * Convert the observer value to an integer.
     * @returns {number} observer state as int
     */
    toInt() {
        return parseInt(toString(this.value))
    }

    /**
     * Convert the observer value to a float.
     * @returns {number} observer state as float
     */
    toFloat() {
        return parseFloat(toString(this.value))
    }
}

/**
 * Create a new state observer of the specified initial value and refresh target components.
 * @param defaultValue - initial observer value
 * @param {...Component} targets - target observer components
 * @returns {Observer} new state observer
 */
const useState = (defaultValue, ...targets) => {
    return new Observer(defaultValue, ...targets);
}

/**
 * Create a mutation callback that is called when any of the specified observers is mutated.
 * @param {function} callback - mutation callback
 * @param {Observer[]} observers - target observers
 */
const useEffect = (callback, observers) => {
    for (const observer of observers)
        observer.on('mutate', callback);
}
