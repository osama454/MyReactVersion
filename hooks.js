// hooks.js
const React = (() => {
  const componentStates = new Map();
  let currentInstance = null;
  let currentIndex = 0;

  // Helper function to create DOM elements from JSX-like structures
  function basicElement(type, props, ...children) {
    const element = document.createElement(type);
    let component = currentInstance;
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
      if (node.render) {
        element.appendChild(node.render());
      } else element.appendChild(node);
    });
    for (const key in component.childs) {
      let remove = component.childs[key].ids.splice(component.childs[key].indx);
      component.childs[key].indx = 0;
      for (const key of remove) {
        componentStates.delete(key);
      }
    }
    return element;
  }

  // Component instance creator with DOM rendering
  function createElement(type, props, ...children) {
    let symbol = Symbol("component-instance");
    if (currentInstance && typeof type == "function") {
      let comp = currentInstance.childs[type];
      if (comp) {
        let indx = comp.indx;
        let ids = comp.ids;
        let id = ids[indx];
        if (!id) {
          ids[indx] = symbol;
        } else {
          symbol = ids[indx];
        }
        comp.indx++;
      } else {
        currentInstance.childs[type] = {
          indx: 1,
          ids: [symbol],
        };
      }
    }
    if (typeof type !== "function")
      return basicElement(type, props, ...children);

    return {
      id: symbol,
      type: type,
      reRender: true,
      domElement: null,
      childs: {},
      render: function () {
        /**
         * Sets a reference for the component being rendered and return a dom element for this component
         *  */
        if (!this.reRender) return this.domElement;
        this.reRender = false;
        startRender(this);

        // Capture the returned JSX and convert to DOM
        const result =
          children.length < 2
            ? type({ ...props, children: children[0] })
            : type({ ...props, children });
        let domElement;
        if (result) {
          if (result instanceof HTMLElement) {
            domElement = result;
          } else if (typeof result === "string") {
            domElement = document.createTextNode(result);
          } else {
            for (const key in this.childs) {
              let remove = this.childs[key].ids.splice(this.childs[key].indx);
              this.childs[key].indx = 0;
              for (const key of remove) {
                componentStates.delete(key);
              }
            }
            domElement = result.render();
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
      let old = componentState[stateIndex];
      componentState[stateIndex] =
        typeof newValue === "function"
          ? newValue(componentState[stateIndex])
          : newValue;
      if (componentState[stateIndex] == old) return;
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

  function useCallback(callback, dependencies) {
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
      componentEffects[effectIndex] = {
        dependencies,
        callback,
      };
    }
    return componentEffects[effectIndex].callback;
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

  function memo(Component, areEqual = defaultAreEqual) {
    // Store these in closure instead of using 'this'
    let prevProps = null;
    let prevResult = null;

    return function MemoComponent(props) {
      // First render
      if (!prevResult) {
        prevProps = props;
        prevResult = Component(props);
        return prevResult;
      }

      // Compare props
      if (areEqual(prevProps, props)) {
        return prevResult;
      }

      // Update stored values if props changed
      prevProps = props;
      prevResult = Component(props);
      return prevResult;
    };
  }

  // Default comparison function
  function defaultAreEqual(prevProps, nextProps) {
    if (nextProps === prevProps) return true;
    let prevKeys = Object.keys(prevProps);
    let nextKeys = Object.keys(nextProps);
    if (prevKeys.length != nextKeys.length) {
      prevProps = nextProps;
      return false;
    }
    for (const key in prevProps) {
      if (prevProps[key] != nextProps[key]) {
        prevProps = nextProps;
        return false;
      }
    }
    return true;
  }
  return {
    createElement,
    useState,
    useEffect,
    useRef,
    useReducer,
    createContext,
    useContext,
    memo,
    useCallback,
    render,
  };
})();
