const {ipcMain} = require('electron');
const io = require("./lib/io");

function init() {
  ipcMain.handle('fs::on-file-add', io.addFiles);

}

module.exports = {init}
