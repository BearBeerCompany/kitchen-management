const {BrowserWindow} = require('electron')

const windows = [];

function routeOnNewTab(_, caller, id) {
  let window = new BrowserWindow({
    width: 800,
    height: 600,
    show: true
  });
  window.loadURL('file://' + global.rootDir + '/dist/app/index.html#/' + caller + '/' + id);

  window.on("closed", () => {
    window = null;
  });

  windows.push(window);
}

function closeWindows() {
  windows.forEach(w => w.close());
}

module.exports = {
  routeOnNewTab,
  closeWindows
}
