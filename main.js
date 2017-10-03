'use strict';

const electron = require('electron'),
  url = require('url'),
  path = require('path'),
  fs = require('fs');

const {app, dialog, BrowserWindow, Menu, ipcMain} = electron;

let _ = {};
_.src = path.join(__dirname, 'src');
_.pages = path.join(_.src, 'pages');

process.env.Prod = false;

let mainWindow;

app.on('ready', function () {
  mainWindow = new BrowserWindow({frame: false, titleBarStyle: 'hidden', skipTaskbar: true}); // frame: false
  mainWindow.loadURL(url.format({
    pathname: path.join(_.pages, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  mainWindow.on('closed', () => {
    mainWindow = null
  });
});

// Catch window control API's
ipcMain.on('window:minmax', function (e, minmax) {
  mainWindow.setFullScreen(minmax);
});

ipcMain.on('window:minimize', function (e, minmax) {
  mainWindow.minimize();
});

ipcMain.on('window:onTop', function(e, bool) {
  mainWindow.setAlwaysOnTop(bool);
});

ipcMain.on('window:close', function () {
  app.quit();
});

if (process.env.Prod == true) {
  app
    .on('browser-window-created', function (e, window) {
      window.setMenu(null);
    });
}