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
  useCallback,
  memo,
  useMemo,
} = React;
const App = () => {
  const [count, setCount] = useState(0);
  const [todos, setTodos] = useState([]);
  const calculation = useMemo(() => expensiveCalculation(count), [count]);

  const increment = () => {
    setCount((c) => c + 1);
  };
  const addTodo = () => {
    setTodos((t) => [...t, "New Todo"]);
  };

  return createElement(
    "div",
    null,
    createElement(
      "div",
      null,
      createElement("h2", null, "My Todos"),
      todos.map((todo, index) => createElement("p", { key: index }, todo)),
      createElement("button", { onClick: addTodo }, "Add Todo")
    ),
    createElement("hr"),
    createElement(
      "div",
      null,
      "Count: ",
      count,
      createElement("button", { onClick: increment }, "+"),
      createElement("h2", null, "Expensive Calculation"),
      calculation
    )
  );
};

const expensiveCalculation = (num) => {
  console.log("Calculating...");
  for (let i = 0; i < 1000000000; i++) {
    num += 1;
  }
  return num;
};

// Initialize the app
render(createElement(App), document.getElementById("root"));
