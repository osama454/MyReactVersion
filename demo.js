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
  memo,
} = React;

function f1({ val }) {
  useEffect(() => {
    console.log(val, "f1");
  }, []);
  return `${val}`;
}

function f2({ val }) {
  useEffect(() => {
    console.log(val, "f2");
  }, []);
  return `${val}`;
}

function Div({ props, children }) {
  return createElement("div", props, ...children);
}
function App() {
  let [val, setVal] = useState(0);
  useEffect(() => {
    setInterval(() => {
      val++;
      setVal(val);
    }, 1000);
  }, []);
  return val % 2 == 0
    ? createElement(
        Div,
        null,
        createElement(f2, { val }),
        "even",
        createElement(f1, { val: val })
      )
    : createElement(
        Div,
        null,
        createElement(f1, { val: val }),
        "odd",
        //createElement(f2, { val: val })
      );
}
// Initialize the app
render(createElement(App), document.getElementById("root"));
