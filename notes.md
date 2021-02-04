## Important Gotchas

Watch out for ipcMain.on/.handle and ipcRenderer.send/.invoke.

Use ipcRenderer.send with ipcMain.on when the consumer doesn't require or expect a response.

Otherwise use ipcRenderer.invoke WITH ipcMain.handle and NOT ipcMain.on.
