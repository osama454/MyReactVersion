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
