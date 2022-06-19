const {ipcMain} = require('electron');
const io = require("./lib/io");

function init() {
  ipcMain.handle('fs::on-plate-add', io.addPlate);
  ipcMain.handle('fs::on-plate-get-all', io.readPlates);
}

module.exports = {init}
