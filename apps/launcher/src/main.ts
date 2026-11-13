import { execFile } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { join } from "node:path";
import { ManagedProcess } from "@weems/local-process";
import { app, BrowserWindow, ipcMain, Menu, nativeImage, shell, Tray } from "electron";
import { ConsoleClient } from "./console-client.ts";
import { Launcher } from "./launcher.ts";
import {
  CHANNELS,
  type LauncherCommand,
  type LauncherState,
  type LinkTarget,
} from "./launcher-state.ts";
import { CLAUDE_APP, DOCKER_APP, linkUrl, repoPaths, URLS, VSCODE_APP } from "./repo.ts";
import { type TrayItem, trayMenu, trayTitle } from "./tray-menu.ts";

/** Replaced at build time (scripts/build-app.ts): the repository the app was built from. */
declare const WEEMS_REPO_ROOT: string;

const REFRESH_MS = 2_000;
/** Files of the window, next to this bundle. */
const HERE = __dirname;

const paths = repoPaths(process.env["WEEMS_REPO"] ?? WEEMS_REPO_ROOT);
const launcher = new Launcher({
  client: new ConsoleClient(URLS.console),
  now: () => Date.now(),
  paths,
  newProcess: (onLine) => new ManagedProcess(onLine),
  sleep: (ms) => sleep(ms),
});
let window: BrowserWindow | null = null;
let tray: Tray | null = null;
let quitting = false;

function openWindow(): BrowserWindow {
  const created = new BrowserWindow({
    width: 840,
    height: 660,
    minWidth: 820,
    minHeight: 620,
    title: "Weems",
    backgroundColor: "#0e1320",
    webPreferences: {
      preload: join(HERE, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  void created.loadFile(join(HERE, "window", "index.html"));
  created.webContents.on("did-finish-load", () => show(launcher.state()));
  // Closing the window keeps Weems running: the menu bar item stays, « Quitter » stops everything.
  created.on("close", (event) => {
    if (quitting) return;
    event.preventDefault();
    created.hide();
  });
  return created;
}

function showWindow(): void {
  window ??= openWindow();
  window.show();
  window.focus();
}

function run(command: LauncherCommand | "show" | "quit"): void {
  if (command === "show") return showWindow();
  if (command === "quit") return app.quit();
  if (command.type === "open") return openTarget(command.target);
  void launcher.command(command);
}

function openTarget(target: LinkTarget): void {
  if (target === "docker") void shell.openPath(DOCKER_APP);
  else if (target === "vscode") execFile("open", ["-a", VSCODE_APP, paths.root], () => undefined);
  else if (target === "claude") execFile("open", ["-a", CLAUDE_APP], () => undefined);
  else void shell.openExternal(linkUrl(target));
}

/** The menu is rebuilt only when it changes: rebuilding it closes it if it is open. */
let shownMenu = "";
function show(state: LauncherState): void {
  if (window && !quitting && !window.isDestroyed()) window.webContents.send(CHANNELS.state, state);
  if (!tray) return;
  tray.setTitle(trayTitle(state));
  const items = trayMenu(state);
  const key = JSON.stringify(items);
  if (key === shownMenu) return;
  shownMenu = key;
  tray.setContextMenu(Menu.buildFromTemplate(items.map(toMenuItem)));
}

function toMenuItem({ command, ...item }: TrayItem): Electron.MenuItemConstructorOptions {
  return command ? { ...item, click: () => run(command) } : item;
}

async function start(): Promise<void> {
  await app.whenReady();
  tray = new Tray(nativeImage.createEmpty());
  ipcMain.on(CHANNELS.command, (_event, command: LauncherCommand) => run(command));
  launcher.onChange(show);
  showWindow();
  setInterval(() => void launcher.refresh(), REFRESH_MS);
  // Opening the app starts what is stopped (maquette: one click, everything runs).
  await launcher.command({ type: "start-all" });
}

// One launcher at a time: two would start the console twice.
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", showWindow);
  app.on("activate", showWindow);
  app.on("window-all-closed", () => undefined);
  app.on("before-quit", (event) => {
    if (quitting) return;
    event.preventDefault();
    quitting = true;
    window?.hide();
    void launcher.quit().finally(() => app.quit());
  });
  // A stop from outside (kill, end of session) goes through « Quitter »: everything stops too.
  process.on("SIGTERM", () => app.quit());
  void start();
}
