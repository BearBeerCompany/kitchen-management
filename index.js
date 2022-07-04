const {app, BrowserWindow} = require('electron')
const url = require("url");
const path = require("path");
const handler = require("./api/handler");
const app_windows = require("./api/lib/window");

global.rootDir = path.resolve(__dirname);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      // TODO: set false for prod release.
      //devTools: false,
      preload: path.join(global.rootDir, "/api/preload.js")
    }
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(global.rootDir, `/dist/app/index.html`),
      protocol: "file:",
      slashes: true
    })
  );

  mainWindow.on('closed', function () {
    app_windows.closeWindows();
    mainWindow = null
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow();
})

handler.init();
