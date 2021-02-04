import { app, BrowserWindow } from "electron";
import { getAssetURL } from "electron-snowpack";
import * as path from "path";
import registrarBootstrap from "./bootstrappers/registrars";
import fileStoreBootstrap from "./bootstrappers/fileStore";

const debug = require("electron-debug");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let window;

function isDev() {
  return process.env.MODE !== "production";
}

function createWindow() {
  window = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Domain Genie",
    icon: isDev()
      ? path.join(process.cwd(), "public/icon.png")
      : path.join(__dirname, "public/icon.png"),
    show: false,
    // Hacky workaround to weird dev tools dark mode bug
    // See https://stackoverflow.com/questions/63165985/electron-browserwindow-switches-to-dark-mode-when-opening-devtools
    backgroundColor: "#FFF",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  window.loadURL(getAssetURL("index.html"));

  window.maximize();
  window.setMenu(null);

  // Emitted when the window is closed.
  window.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    window = null;
  });

  // Emitted when the window is ready to be shown
  // This helps in showing the window gracefully.
  window.once("ready-to-show", () => {
    window.show();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (window === null) createWindow();
});

debug({
  showDevTools: false,
});

registrarBootstrap();
fileStoreBootstrap();
