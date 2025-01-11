// demo.js
const {
  render,
  createElement,
  useState,
  useEffect,
  useRef,
  useReducer,
  createContext,
  useContext,
} = React;

function F1() {
  console.log("Re render F1");
  const [count, setCount] = useState(0);
  const [text, setText] = useState("hello");

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + 1);
      setText("counter= " + count);
    }, 1000);
    return () => clearInterval(interval);
  }, [count]);

  return createElement(
    "div",
    { className: "component" },
    createElement("h2", null, "Component F1"),
    createElement("p", null, `Count: ${count}`),
    createElement("p", null, text),
    createElement(
      "button",
      {
        onClick: () => setCount((c) => c + 1),
        style: "padding: 5px 10px; margin: 5px;",
      },
      "Increment"
    )
  );
}

function F2(props, child) {
  console.log("Re render F2");
  const [count, setCount] = useState(0);
  const [text, setText] = useState(child);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + 1);
      setText("counter= " + count);
    }, 1000);
    return () => clearInterval(interval);
  }, [count]);

  return createElement(
    "div",
    null,
    createElement("h2", null, "Component F2"),
    createElement("p", null, `Count: ${count}`),
    createElement("p", null, text),
    createElement(
      "button",
      {
        onClick: () => setCount((c) => c + 1),
        style: "padding: 5px 10px; margin: 5px;",
      },
      "Increment"
    )
  );
}

function T() {
  console.log("Re render T");
  return createElement(F2, null, "hello");
}

function Div({ children, ...props }) {
  return createElement("div", props, children);
}

function Effect() {
  let [state, setState] = useState(0);

  useEffect(() => {
    setInterval(() => {
      console.log(state);
      state += 1;
      setState(state);
    }, 1000);
  }, []);
  return createElement("div", null, state);
}

function ref() {
  const [inputValue, setInputValue] = useState("");
  const count = useRef(0);

  //useEffect(() => {
  count.current = count.current + 1;
  //});
  return createElement(
    "div",
    null,
    createElement("input", {
      type: "text",
      onChange: (e) => {
        console.log("change");
        setInputValue(e.target.value);
      },
      value: inputValue,
    }),
    createElement("h1", null, count.current)
  );
}

function reducer() {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action) {
      case "increment":
        return state + 1;
      case "decrement":
        return state - 1;
      default:
        return state;
    }
  }, 10);
  return createElement(
    "div",
    null,
    createElement("h1", null, state),
    createElement(
      "button",
      { onClick: () => dispatch("increment") },
      "increment"
    ),
    createElement(
      "button",
      { onClick: () => dispatch("decrement") },
      "decrement"
    )
  );
}

let myContext = createContext("osama");
function child() {
  let state = useContext(myContext);
  return createElement("h1", null, state);
}
function context() {
  const [state, setState] = useState("adel");
  return createElement(
    "div",
    null,
    createElement(myContext.Provider, { value: state }, createElement(child)),
    createElement(child)
  );
}
// Initialize the app
render(createElement(context), document.getElementById("root"));
