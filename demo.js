// demo.js
const { createComponent, useState, useEffect, createElement } = React;

function F1() {
  console.log("Re render F1");
  const [count, setCount] = useState(0);
  const [text, setText] = useState("hello");

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCount((c) => c + 1);
  //     setText("counter= " + count);
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, [count]);

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

function F2() {
  console.log("Re render F2");
  const [count, setCount] = useState(0);
  const [text, setText] = useState("hello");

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCount((c) => c + 1);
  //     setText("counter= " + count);
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, [count]);

  return createElement(
    "div",
    { className: "component" },
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
  return [
    createElement(
      "div",
      { className: "container" },
      createComponent(F1),
      createComponent(F2)
    ),
  ];
}

// Initialize the app
createComponent(T);
