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
} from "./react.js";

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
  return toggle ? (
    <div>
      <F name="osama" s={24} key={1} />
      <button
        onClick={() => {
          console.log("press");
          setToggle(false);
        }}
      >
        "click me"
      </button>
      "test"
    </div>
  ) : (
    <div>'Null'</div>
  );
}

function Test() {
  return (
    <div>
      <>osama</>
      adel
    </div>
  );
}
<App />;
// Initialize the app
render(<>osama</>, document.getElementById("root"));
