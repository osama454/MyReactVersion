// demo.js
import {
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
}from './react.js';

function F({ name, s }) {
  const [count, setCount] = useState(s);

  useEffect(() => {
    console.log("useEffect");
    const intervalId = setInterval(() => {
      console.log("F");
      setCount((prevCount) => prevCount + 1); // Use functional form of setState
    }, 1000);

    return () => clearInterval(intervalId); // Important cleanup
  }, []);

  return name + ": " + count;
}

function App() {
  const [toggle, setToggle] = useState(true);

  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     setToggle(prevToggle => !prevToggle); // Cleaner toggling
  //   }, 1000);
  //   return () => clearInterval(intervalId); // Cleanup
  // }, []);

  // Conditional rendering using createElement:
  return toggle
    ? createElement(
        "div",
        null,
        createElement(F, { name: "osama", s: 24, key: 1 }),
        createElement(
          "button",
          {
            onClick: () => {
              console.log("press");
              setToggle(false);
            },
          },
          "click me"
        ),
        "test"
        // createElement(F, { name: "adel", s: 61,  key:2})
      )
    : createElement(
        "div",
        null,
        "Null"
        // createElement(F, { name: "adel", s: 61,  key:2 }),
        // createElement(F, { name: "osama", s: 24 ,  key: 1})
      );
}

function test() {
  return createElement(
    "button",
    {onClick: ()=>{
      console.log("click");
    }},
   'click'
  );
}

// Initialize the app
render(createElement(App), document.getElementById("root"));
