const electron = require("electron");

electron.contextBridge.exposeInMainWorld("fs", {
  fileAdd: () => {
    return electron.ipcRenderer.invoke("fs::on-file-add");
  },
});
