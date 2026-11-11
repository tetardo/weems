import { contextBridge, ipcRenderer } from "electron";
import { type AppCommands, type AppState, CHANNELS } from "./app-state.ts";

/** The only bridge between the window and the tracker: window.weems (sandboxed window). */
const commands: AppCommands = {
  logIn: () => ipcRenderer.invoke(CHANNELS.logIn),
  logOut: () => ipcRenderer.invoke(CHANNELS.logOut),
  saveSettings: (settings) => ipcRenderer.invoke(CHANNELS.saveSettings, settings),
  closeFlight: () => ipcRenderer.invoke(CHANNELS.closeFlight),
  onState: (listener) => {
    ipcRenderer.on(CHANNELS.state, (_event, state: AppState) => listener(state));
  },
};
contextBridge.exposeInMainWorld("weems", commands);
