// hooks.js
const React = (() => {
  const componentStates = new Map();
  let currentInstance = null;
  let currentIndex = 0;

  // Helper function to create DOM elements from JSX-like structures
  function basicElement(type, props, ...children) {
    const element = document.createElement(type);

    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        if (key === "className") {
          element.className = value;
        } else if (key.startsWith("on")) {
          element.addEventListener(key.toLowerCase().slice(2), value);
        } else {
          element.setAttribute(key, value);
        }
      });
    }
    if (props && props.ref) props.ref.current = element;
    children.flat().forEach((child) => {
      if (child === null || child === undefined) return;

      const node =
        typeof child === "object" ? child : document.createTextNode(child);
      if (node.render) element.appendChild(node.render());
      else element.appendChild(node);
    });

    return element;
  }

  // Component instance creator with DOM rendering
  function createElement(type, props, ...children) {
    if (typeof type !== "function")
      return basicElement(type, props, ...children);
    return {
      id: Symbol("component-instance"),
      type: type,
      reRender: true,
      domElement: null,
      render: function () {
        /**
         * Sets a reference for the component being rendered and return a dom element for this component
         *  */
        if (!this.reRender) return this.domElement;
        this.reRender = false;
        startRender(this);

        // Capture the returned JSX and convert to DOM
        const result = type({ ...props, children });
        let domElement;
        if (result) {
          if (result instanceof HTMLElement) {
            domElement = result;
          } else if (typeof result === "string") {
            domElement = document.createTextNode(result);
          } else {
            result.render();
          }
        }
        this.domElement = domElement;
        if (props && props.ref) props.ref.current = domElement;
        return domElement;
      },
    };
  }

  // Reset index when starting to render a component instance
  function startRender(instance) {
    currentInstance = instance;
    currentIndex = 0;
  }

  function render(instance, parent) {
    if (instance.render) parent.appendChild(instance.render());
    else parent.appendChild(instance);
  }

  function useState(initialValue) {
    let instance = currentInstance;
    if (!componentStates.has(instance.id)) {
      componentStates.set(instance.id, []);
    }

    const componentState = componentStates.get(instance.id);
    const stateIndex = currentIndex++;

    if (componentState.length <= stateIndex) {
      componentState.push(initialValue);
    }

    const setState = (newValue) => {
      componentState[stateIndex] =
        typeof newValue === "function"
          ? newValue(componentState[stateIndex])
          : newValue;
      instance.reRender = true;
      setTimeout(() => {
        let old = instance.domElement;
        old.parentNode.replaceChild(instance.render(), old);
      }, 0);
    };

    return [componentState[stateIndex], setState];
  }
  function useReducer(reducer, initialValue) {
    let instance = currentInstance;
    if (!componentStates.has(instance.id)) {
      componentStates.set(instance.id, []);
    }

    const componentState = componentStates.get(instance.id);
    const stateIndex = currentIndex++;

    if (componentState.length <= stateIndex) {
      componentState.push(initialValue);
    }

    const dispatch = (action) => {
      componentState[stateIndex] = reducer(componentState[stateIndex], action);
      instance.reRender = true;
      setTimeout(() => {
        let old = instance.domElement;
        old.parentNode.replaceChild(instance.render(), old);
      }, 0);
    };

    return [componentState[stateIndex], dispatch];
  }
  function useRef(initialValue) {
    let instance = currentInstance;
    if (!componentStates.has(instance.id)) {
      componentStates.set(instance.id, []);
    }

    const componentState = componentStates.get(instance.id);
    const stateIndex = currentIndex++;

    if (componentState.length <= stateIndex) {
      componentState.push({ current: initialValue });
    }
    return componentState[stateIndex];
  }

  function useEffect(callback, dependencies) {
    if (!componentStates.has(currentInstance.id)) {
      componentStates.set(currentInstance.id, []);
    }

    const componentEffects = componentStates.get(currentInstance.id);
    const effectIndex = currentIndex++;

    const oldDependencies = componentEffects[effectIndex]?.dependencies;
    const hasChanged =
      !oldDependencies ||
      !dependencies ||
      dependencies.some((dep, i) => dep !== oldDependencies[i]);

    if (hasChanged) {
      if (componentEffects[effectIndex]?.cleanup) {
        componentEffects[effectIndex].cleanup();
      }

      setTimeout(() => {
        const cleanup = callback();
        componentEffects[effectIndex] = {
          dependencies,
          cleanup: typeof cleanup === "function" ? cleanup : undefined,
        };
      }, 0);
    }
  }

  function createContext(defaultValue) {
    const contextObj = {
      default: defaultValue,
      valueStack: [],
      Provider({ value, children }) {
        // Store the value directly on contextObj instead of using 'this'
        contextObj.valueStack.push(value);
        let element = createElement("div", null, ...children);
        contextObj.valueStack.pop();
        return element;
      },
    };
    return contextObj;
  }
  function useContext(context) {
    return context.valueStack.length > 0
      ? context.valueStack[context.valueStack.length - 1]
      : context.default;
  }
  return {
    createElement,
    useState,
    useEffect,
    useRef,
    useReducer,
    createContext,
    useContext,
    render,
  };
})();
