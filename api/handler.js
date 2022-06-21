const {ipcMain} = require('electron');
const io = require("./lib/io");

function init() {
  ipcMain.handle('fs::on-plate-add', io.addPlate);
  ipcMain.handle('fs::on-plate-get-all', io.readPlates);
  ipcMain.handle('fs::on-plate-get-by-id', io.readPlateById);
  ipcMain.handle('fs::on-plate-delete-by-id', io.deletePlateById);
  ipcMain.handle('fs::on-plate-update', io.updatePlate);
}

module.exports = {init}
