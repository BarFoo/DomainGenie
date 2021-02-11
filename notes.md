## Important Gotchas

Watch out for ipcMain.on/.handle and ipcRenderer.send/.invoke.

Use ipcRenderer.send with ipcMain.on when the consumer doesn't require or expect a response.

Otherwise use ipcRenderer.invoke WITH ipcMain.handle and NOT ipcMain.on.

The preload exposes what's available from Electron, bear in mind if an event isn't coming back
as expected it is likely to be because it hasn't been whitlelisted here!
