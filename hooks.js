// hooks.js
const React = (() => {
  const componentStates = new Map();
  let currentInstance = null;
  let currentIndex = 0;

  // Helper function to create DOM elements from JSX-like structures
  function createElement(type, props, ...children) {
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

    children.flat().forEach((child) => {
      if (child === null || child === undefined) return;

      const node =
        typeof child === "object" ? child : document.createTextNode(child);
      element.appendChild(node);
    });

    return element;
  }

  // Component instance creator with DOM rendering
  function createComponent(
    ComponentFunction,
    containerElement = document.getElementById("root")
  ) {
    const instance = {
      id: Symbol("component-instance"),
      type: ComponentFunction.name,
      reRender: true,
      container: containerElement,
      currentDOMElement: null,
      render: function (...args) {
        if (!this.reRender) return;
        this.reRender = false;
        startRender(this);

        // Capture the returned JSX and convert to DOM
        const result = ComponentFunction.apply(this, args);

        if (result) {
          // Clear previous render
          if (this.currentDOMElement) {
            this.currentDOMElement.remove();
          }

          // Handle array of elements or single element
          if (Array.isArray(result)) {
            const wrapper = document.createElement("div");
            result.forEach((element) => {
              if (element instanceof HTMLElement) {
                wrapper.appendChild(element);
              }
            });
            this.currentDOMElement = wrapper;
          } else if (result instanceof HTMLElement) {
            this.currentDOMElement = result;
          } else if (typeof result === "string") {
            this.currentDOMElement = document.createTextNode(result);
          }

          if (this.currentDOMElement) {
            this.container.appendChild(this.currentDOMElement);
          }
        }
      },
    };

    instance.render();
    return instance.currentDOMElement;
  }

  // Reset index when starting to render a component instance
  function startRender(instance) {
    currentInstance = instance;
    currentIndex = 0;
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
        instance.render();
      }, 0);
    };

    return [componentState[stateIndex], setState];
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

  return { createComponent, useState, useEffect, createElement };
})();

