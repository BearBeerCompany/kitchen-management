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
  },
  addOrder: (order) => {
    return electron.ipcRenderer.invoke("fs::on-order-add", order);
  },
  addOrders: (orders) => {
    return electron.ipcRenderer.invoke("fs::on-plate-menu-items-add", orders);
  },
  readOrders: () => {
    return electron.ipcRenderer.invoke("fs::on-order-get-all");
  },
  readOrder: (id) => {
    return electron.ipcRenderer.invoke("fs::on-order-get-by-id", id);
  },
  deleteOrder: (id) => {
    return electron.ipcRenderer.invoke("fs::on-order-delete-by-id", id);
  },
  deleteOrders: (ids) => {
    return electron.ipcRenderer.invoke("fs::on-plate-menu-items-delete-by-ids", ids);
  },
  updateOrder: (order) => {
    return electron.ipcRenderer.invoke("fs::on-order-update", order);
  },
  readMenuItems: () => {
    return electron.ipcRenderer.invoke("fs::on-menuitem-get-all");
  }
});

electron.contextBridge.exposeInMainWorld("app", {
  openNewTab: (parent, id) => {
    return electron.ipcRenderer.invoke("window::new-tab", parent, id);
  }
});
