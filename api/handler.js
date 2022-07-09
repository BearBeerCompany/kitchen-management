const {ipcMain} = require('electron');
const io = require("./lib/io");
const window = require("./lib/window");

function init() {
  ipcMain.handle('fs::on-plate-add', io.addPlate);
  ipcMain.handle('fs::on-plate-get-all', io.readPlates);
  ipcMain.handle('fs::on-plate-get-by-id', io.readPlateById);
  ipcMain.handle('fs::on-plate-delete-by-id', io.deletePlateById);
  ipcMain.handle('fs::on-plate-update', io.updatePlate);

  ipcMain.handle('fs::on-order-add', io.addOrder);
  ipcMain.handle('fs::on-orders-add', io.addOrders);
  ipcMain.handle('fs::on-order-get-all', io.readOrders);
  ipcMain.handle('fs::on-order-get-by-id', io.readOrderById);
  ipcMain.handle('fs::on-order-delete-by-id', io.deleteOrderById);
  ipcMain.handle('fs::on-orders-delete-by-ids', io.deleteOrdersByIds);
  ipcMain.handle('fs::on-order-update', io.updateOrder);

  ipcMain.handle('fs::on-menuitem-get-all', io.readMenuItems);

  ipcMain.handle('window::new-tab', window.routeOnNewTab);
}

module.exports = {init}
