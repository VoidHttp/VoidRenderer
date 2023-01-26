let app = new App(document.getElementById('root'));
React.createElement("div", {class: "container"}, 
    React.createElement("div", {class: "content"}, 
        React.createElement("h1", null, "Void Framework"), 
        React.createElement("p", null, "This is a demo page")
    )
)

app.register('index', () => React.createElement(Demo, null)
);
app.register('test', () => React.createElement("h1", null, "testin")
);
