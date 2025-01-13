// hooks.js
const React = (() => {
  const componentStates = new Map();
  let currentInstance = null;
  let currentIndex = 0;

  function cleanComponent(ids) {
    for (const key of ids) {
      if (key) {
        for (const hook of componentStates.get(key)) {
          if (hook.type == "useEffect" && hook.data.cleanup)
            hook.data.cleanup();
        }
        componentStates.delete(key);
      }
    }
  }
  // Helper function to create DOM elements from JSX-like structures
  function basicElement(type, props = {}, ...children) {
    return {
      child: [],
      props,
      keys: {},
      type,
      render: function () {
        const element = document.createElement(type);
        let component = currentInstance;
        let unVisited = { ...this.keys };
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
            if (node.props && node.props.key) {
              if (this.keys[node.props.key]) {
                node.id = this.keys[node.props.key].id;
                node.child = this.keys[node.props.key].child;
                delete unVisited[node.props.key];
              } else {
                this.keys[node.props.key] = node;
              }
            } else if (this.child[node.type]) {
              let indx = this.child[node.type].indx;
              let ids = this.child[node.type].ids;
              let id = ids[indx];
              if (!id) {
                ids[indx] = node;
              } else {
                node.id = ids[indx].id;
                node.child = ids[indx].child;
              }
              this.child[node.type].indx++;
            } else {
              this.child[node.type] = {
                indx: 1,
                ids: [node],
              };
            }
            element.appendChild(node.render());
          } else {
            element.appendChild(node);
          }
        });
        let delIds = [];
        for (const key in unVisited) {
          delIds.push(unVisited[key].id);
          delete this.keys[key];
        }
        for (const key in this.child) {
          let remove = this.child[key].ids.splice(this.child[key].indx);
          this.child[key].indx = 0;
          for (let i in remove) delIds.push(i.id);
        }
        if (delIds && delIds.length > 0) cleanComponent(delIds);
        return element;
      },
    };
  }

  // Component instance creator with DOM rendering
  function createElement(type, props = {}, ...children) {
    let symbol = Symbol(type.name ? type.name : type);

    if (typeof type !== "function")
      return basicElement(type, props, ...children);

    return {
      id: symbol,
      type: type,
      props,
      reRender: true,
      domElement: null,
      child: {},
      render: function () {
        /**
         * Sets a reference for the component being rendered and return a dom element for this component
         *  */

        // cleanComponent(component);
        if (!this.reRender) return this.domElement;
        this.reRender = false;
        startRender(this);

        // Capture the returned JSX and convert to DOM
        const result =
          children.length < 2
            ? type({ ...props, children: children[0] })
            : type({ ...props, children });

        let domElement;
        if (typeof result === "string") {
          domElement = document.createTextNode(result);
        } else {
          if (this.child.type == result.type) {
            let key1 = this.child.props ? this.child.props.key : null;
            let key2 = result.props ? result.props.key : null;
            if (key1 == key2) {
              result.id = this.child.id;
              result.child = this.child.child;
              result.keys = this.child.keys;
            }
          } else if (this.child.id) {
            cleanComponent([this.child.id]);
            this.child = result;
          } else {
            this.child = result;
          }
          domElement = result.render();
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

  function registerComponent(type, data) {
    if (!componentStates.has(currentInstance.id)) {
      componentStates.set(currentInstance.id, []);
    }

    const componentState = componentStates.get(currentInstance.id);
    const stateIndex = currentIndex++;
    let isNewHook = false;
    if (componentState.length <= stateIndex) {
      componentState.push({ type, data });
      isNewHook = true;
    }
    return { component: componentState[stateIndex], currentInstance };
  }

  function useState(initialValue) {
    const { component, currentInstance } = registerComponent(
      "useState",
      initialValue
    );

    const setState = (newValue) => {
      let old = component.data;
      component.data =
        typeof newValue === "function" ? newValue(component.data) : newValue;
      if (component.data == old) return;
      currentInstance.reRender = true;
      setTimeout(() => {
        let old = currentInstance.domElement;
        old.parentNode.replaceChild(currentInstance.render(), old);
      }, 0);
    };

    return [component.data, setState];
  }
  function useReducer(reducer, initialValue) {
    const { component, currentInstance } = registerComponent(
      "useReducer",
      initialValue
    );

    const dispatch = (action) => {
      component.data = reducer(component, action);
      currentInstance.reRender = true;
      setTimeout(() => {
        let old = currentInstance.domElement;
        old.parentNode.replaceChild(currentInstance.render(), old);
      }, 0);
    };

    return [component.data, dispatch];
  }
  function useRef(initialValue) {
    const { component } = registerComponent("useRef", {
      current: initialValue,
    });

    return component.data;
  }

  function useEffect(callback, dependencies) {
    const { component } = registerComponent("useEffect", {});

    const oldDependencies = component.data.dependencies;
    const hasChanged =
      !dependencies ||
      !oldDependencies ||
      dependencies.length != oldDependencies.length ||
      oldDependencies.some((dep, i) => dep !== oldDependencies[i]);

    if (hasChanged) {
      if (component.data.cleanup) {
        component.data.cleanup();
      }

      setTimeout(() => {
        const cleanup = callback();
        component.data = {
          dependencies,
          cleanup: typeof cleanup === "function" ? cleanup : undefined,
        };
      }, 0);
    }
  }

  function useCallback(callback, dependencies) {
    const { component } = registerComponent("useCallback", {
      callback,
    });

    const oldDependencies = component.data.dependencies;
    const hasChanged =
      !dependencies ||
      !oldDependencies ||
      dependencies.length != oldDependencies.length ||
      oldDependencies.some((dep, i) => dep !== oldDependencies[i]);

    if (hasChanged) {
      component.data = {
        dependencies,
        callback,
      };
    }
    return component.data.callback;
  }

  function useMemo(callback, dependencies) {
    const { component } = registerComponent("useMemo", {});

    const oldDependencies = component.dependencies;
    const hasChanged =
      !dependencies ||
      !oldDependencies ||
      dependencies.length != oldDependencies.length ||
      oldDependencies.some((dep, i) => dep !== oldDependencies[i]);

    if (hasChanged) {
      component.data = {
        dependencies,
        results: callback(),
      };
    }
    return component.data.results;
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
    useMemo,
    render,
  };
})();

export const {
  createElement,
  useState,
  useEffect,
  useRef,
  useReducer,
  createContext,
  useContext,
  memo,
  useCallback,
  useMemo,
  render,
} = React;

export default React;
