if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").then((reg) => {
    if (reg.installing) {
      const sw = reg.installing || reg.waiting;
      sw.onstatechange = function () {
        if (sw.state === "installed") {
          window.location.reload();
        }
      };
    }
  });
}

const importMapScript = document.createElement("script");

importMapScript.type = "importmap";

const importMap = {
  imports: {
    react: "./react.js",
  },
};

importMapScript.textContent = JSON.stringify(importMap, null, 2);

document.head.insertBefore(importMapScript, document.head.firstChild);
