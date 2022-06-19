const electron = require("electron");

electron.contextBridge.exposeInMainWorld("fs", {
  fileAdd: (config) => {
    return electron.ipcRenderer.invoke("fs::on-file-add", config);
  },
});
