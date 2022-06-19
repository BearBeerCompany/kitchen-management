const electron = require("electron");

electron.contextBridge.exposeInMainWorld("fs", {
  plateAdd: (config) => {
    return electron.ipcRenderer.invoke("fs::on-plate-add", config);
  },
  readPlates: () => {
    return electron.ipcRenderer.invoke("fs::on-plate-get-all");
  },
});
