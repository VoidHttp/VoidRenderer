/**
 * Generate a random component identifier.
 * @returns random unique identifier
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
    static DEAULT = {
        name: 'System-UI',
        value: 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Liberation Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"'
    }
}

/**
 * Represents a renderable HTML node in the application.
 * It is the base class of every framework elements.
 */
class Component {
    /**
     * Initialize component node.
     * @param tag component tag
     * @param component attributes
     * @param content component children
     */
    constructor(tag, attributes, ...content) {
        this.tag = tag;
        this.attributes = attributes || {};
        this.content = content || [];
        this.attributes.id = this.attributes.id || randomID();
        // register the component globally
        components.push(this);
        this.onMount();
    }

    /**
     * Render the component. Determine what exactly should be displayed
     * on the screen from the component. By default, the component renders
     * itself, but class-based renderers may override this.
     * @returns 
     */
    render() {
        return this;
    }

    /**
     * Called after the component was initialized.
     */
    onMount() {
        this.parseAttributes();
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
     * @param node node to add
     */
    addNode(node) {
        this.content.push(node);
    }

    /**
     * Add multiple nodes to the component content.
     * @param nodes nodes to add
     */
    addNodes(...nodes) {
        for (const node of nodes) {
            this.content.push(node);
        }
    }

    /**
     * Get the component's corresponding HTMl element.
     */
    getElement() {
        document.getElementById(this.attributes.id);
    }

    /**
     * Parse the full component with all its nodes to a string,
     * that can be rendered onto a HTML root element. 
     * @returns component string representation
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
                if (node instanceof Component)
                    parsedContent += node.parse();
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
            // check if the key is an aliase
            if (key in styles) {
                key = styles[key];
            }
            console.log('fos', key, componentStyle[key])
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
     * @param callback attribute value handler
     * @param names attribute key aliases
     */
    getAttribute(callback, ...names) {
        for (let name of names) {
            if (name in this.attributes)
                return callback(this.attributes[name]);
        }
    }

    /**
     * Get the style of the component.
     * @returns css style map
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
     * @returns 
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
    render() {
        return Void.createElement('p', {}, ...this.content);
    }
}

/**
 * Check if the given object is a callable function.
 * @param func target object 
 * @returns true if the object is callable
 */
const __checkFunction = (func) => typeof func == 'function';

/**
 * Check if the given object is a constructor of a class.
 * @param func target object
 * @returns true if the object is a class constructor 
 */
const __checkConstructor = (func) => !Object.hasOwn(Object.getPrototypeOf(func), 'constructor');

class Void {
    /**
     * Handle react-like element creation.
     * @param data element tag or data
     * @param attributes element attributes
     * @param content element child nodes 
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
     * @param component component to render 
     * @param root element to render to
     */
    static render = (component, root) => {
        // make the component render itself to a component
        let rendered = component.render();
        // se the rendered element's id to the component element
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
     * @param component target component
     * @param style component style 
     */
    static addStyle = (component, style) => {
        // parse the style to string
        let parsedStyle = `#${component.attributes.id} {`;
        for (const property in style) {
            parsedStyle += `${property}:${style[property]};`;
        }
        globalStyle.innerHTML += parsedStyle + '}';
    }
}

// override babel's react create element method
let React = {};
React.createElement = Void.createElement;

// call component on load handlers on window load
window.onload = () => components.forEach(component => component.onLoad());

class Storage {
    constructor(data) {
        this.data = data ?? {};
    }

    get(key, defaultValue = undefined) {
        return this.data[key] ?? defaultValue;
    }

    set(key, value) {
        let old = get(key);
        this.data[key] = value;
        return old;
    }

    has(key) {
        return key in this.data;
    }

    unset(key) {
        let value = this.data[key];
        delete this.data[key];
        return value;
    }
}

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
     * @returns page content
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
     * Initialize application.
     * @param root application root element
     * @param pages initial pages data 
     */
    constructor(root, pages) {
        this.root = root;
        this.pages = pages ?? {};
    }

    /**
     * Register a page to the application.
     * @param name page name
     * @param renderer page content renderer
     * @param page page to register 
     */
    register(name, renderer, options) {
        // create the page
        let page = new Page(renderer, options ?? {});
        // register the page
        this.pages[name] = page;
    }

    /**
     * Render the specified page.
     * @param name page name 
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
    }
}
