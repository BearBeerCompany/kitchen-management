const electron = require("electron");

electron.contextBridge.exposeInMainWorld("fs", {
  addPlate: (config) => {
    return electron.ipcRenderer.invoke("fs::on-plate-add", config);
  },
  readPlates: () => {
    return electron.ipcRenderer.invoke("fs::on-plate-get-all");
  },
  readPlate: (id) => {
    return electron.ipcRenderer.invoke("fs::on-plate-get-by-id", id);
  },
  deletePlate: (id) => {
    return electron.ipcRenderer.invoke("fs::on-plate-delete-by-id", id);
  },
  updatePlate: (config) => {
    return electron.ipcRenderer.invoke("fs::on-plate-update", config);
  }
});

electron.contextBridge.exposeInMainWorld("app", {
  openNewTab: (parent, id) => {
    return electron.ipcRenderer.invoke("window::new-tab", parent, id);
  }
});
