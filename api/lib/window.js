const {BrowserWindow} = require('electron')
const path = require("path");

const windows = [];

function routeOnNewTab(_, caller, id) {
  let window = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(global.rootDir, "/api/preload.js")
    }
  });
  window.loadURL('file://' + global.rootDir + '/dist/app/index.html#/' + caller + '/' + id);

  window.on("closed", () => {
    window = null;
  });

  windows.push(window);
}

function closeWindows() {
  windows.forEach(w => {
    try {
      w.close()
    } catch (e) {
    }
  });
}

module.exports = {
  routeOnNewTab,
  closeWindows
}
