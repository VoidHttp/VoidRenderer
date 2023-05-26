let app = new App(document.getElementById('root'));
const Demo = () => (
    React.createElement("div", {class: "demo"},
        React.createElement("div", {class: "wrapper"},
            React.createElement("h1", null, "Void Framework"),
            React.createElement("p", null, "This is a demo page")
        )
    )
);
app.register('index', () => React.createElement(Demo, null));
