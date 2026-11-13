import { contextBridge, ipcRenderer } from "electron";
import { CHANNELS, type LauncherBridge, type LauncherState } from "./launcher-state.ts";

/** The only bridge between the window and the launcher: window.weems (sandboxed window). */
const bridge: LauncherBridge = {
  send: (command) => ipcRenderer.send(CHANNELS.command, command),
  onState: (listener) => {
    ipcRenderer.on(CHANNELS.state, (_event, state: LauncherState) => listener(state));
  },
};
contextBridge.exposeInMainWorld("weems", bridge);
