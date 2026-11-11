import { join } from "node:path";
import { app, BrowserWindow, ipcMain, safeStorage, shell } from "electron";
import electronUpdater from "electron-updater";
import { SimConnectLink } from "../connectors/msfs/simconnect-link.ts";
import { type AppState, CHANNELS, type FlightSettings } from "./app-state.ts";
import { DesktopTracker } from "./desktop-tracker.ts";

/** Replaced at build time (scripts/build-app.ts): the API of the alpha. */
declare const WEEMS_DEFAULT_API_URL: string;

const API_URL = process.env["WEEMS_API_URL"] ?? WEEMS_DEFAULT_API_URL;
/** Files of the window, next to this bundle. */
const HERE = __dirname;

let desktop: DesktopTracker | null = null;
let window: BrowserWindow | null = null;

function openWindow(): BrowserWindow {
  const created = new BrowserWindow({
    width: 440,
    height: 760,
    title: "Weems Tracker",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(HERE, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  void created.loadFile(join(HERE, "window", "index.html"));
  // Links never open inside the tracker: the pilot's browser does.
  created.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
  return created;
}

function listen(tracker: DesktopTracker): void {
  ipcMain.handle(CHANNELS.logIn, () => tracker.logIn());
  ipcMain.handle(CHANNELS.logOut, () => tracker.logOut());
  ipcMain.handle(CHANNELS.saveSettings, (_event, settings: FlightSettings) =>
    tracker.saveSettings(settings),
  );
  ipcMain.handle(CHANNELS.closeFlight, () => tracker.closeFlight());
  ipcMain.handle(CHANNELS.openReport, () => tracker.openReport());
  setInterval(() => {
    const state: AppState = tracker.state();
    window?.webContents.send(CHANNELS.state, state);
  }, 1_000);
}

async function start(): Promise<void> {
  await app.whenReady();
  desktop = new DesktopTracker({
    apiUrl: API_URL,
    version: app.getVersion(),
    dataDir: app.getPath("userData"),
    newLink: () => new SimConnectLink(),
    openBrowser: (url) => shell.openExternal(url),
    cipher: {
      encrypt: (text) => safeStorage.encryptString(text),
      decrypt: (data) => safeStorage.decryptString(data),
    },
    now: () => performance.now(),
    utcNow: () => Date.now(),
  });
  listen(desktop);
  window = openWindow();
  window.on("closed", () => (window = null));
  if (app.isPackaged) void electronUpdater.autoUpdater.checkForUpdatesAndNotify();
}

// One tracker at a time: two would share the local database and send twice.
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => window?.focus());
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", (event) => {
    if (!desktop) return;
    event.preventDefault();
    const closing = desktop;
    desktop = null;
    void closing.stop().finally(() => app.quit());
  });
  void start();
}
