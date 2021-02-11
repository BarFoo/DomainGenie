import { BrowserWindow, ipcMain, app } from "electron";
import { mainFileStore } from "../mainFileStore";

const log = require("electron-log");
const path = require("path");
const { fork } = require("child_process");

/**
 * Function encapsulating registrar related IPC and child process
 * @param {BrowserWindow} The browser window send process responses to
 * @todo Split this out even further
 */
export default function () {
  let checkRegistrarProcess;
  let getAllDomainsProcess;
  let updateDomainsProcess;

  /**
   * Responsible for checking registrars to determine if the given registrar settings
   * are valid. This essentially calls the underlying registrar child process.
   */
  ipcMain.on("checkRegistrars", (evt, registrarSettings) => {
    // Lazily create the process if this is the first time we're running this
    // @todo Why don't we only spawn this once per operation instead of keeping it running?
    if (checkRegistrarProcess === undefined) {
      checkRegistrarProcess = fork(
        path.join(__dirname, "checkRegistrars.js"),
        ["args"],
        {
          stdio: ["pipe", "pipe", "pipe", "ipc"],
        }
      );

      checkRegistrarProcess.on("exit", () => {
        // If for some reason the process has exited, this will let us
        // re-create it next time checkRegistrars is called
        checkRegistrarProcess = undefined;
      });

      checkRegistrarProcess.on("message", (data) => {
        log.debug("Received result from checkRegistrarProcess", data);
        if (data._completed) {
          // For the process finishing
          evt.reply("checkRegistrarsCompleted");
        } else {
          // For individual process updates
          evt.reply("checkedRegistrar", data);
        }
      });

      checkRegistrarProcess.stdout.on("data", (data) => {
        log.debug(`checkRegistrarProcess stdout: ${data}`);
      });

      checkRegistrarProcess.stderr.on("data", (err) => {
        log.error(`checkRegistrarProcess stderr: ${err}`);
      });

      log.debug("Setup checkRegistrarProcess");
    }

    // Pass off to the registrar child process, as this could take some time
    checkRegistrarProcess.send(registrarSettings);
  });

  /**
   * Perhaps a confusing name, this does get all domains from all registrars
   * but doesn't immediately return them, or else the main thread could be blocked
   * for a while. Renderer should listen in for the getAllDomainsCompleted
   * channel to get the results of this operation.
   */
  ipcMain.on("getAllDomains", (evt) => {
    if (getAllDomainsProcess === undefined) {
      getAllDomainsProcess = fork(
        path.join(__dirname, "getAllDomains.js"),
        ["args"],
        {
          stdio: ["pipe", "pipe", "pipe", "ipc"],
        }
      );

      getAllDomainsProcess.on("message", (data) => {
        if (data._completed) {
          evt.reply("getAllDomainsCompleted");
        } else {
          evt.reply("getAllDomainsUpdate", data);
        }
      });

      getAllDomainsProcess.stdout.on("data", (data) => {
        log.debug("Received data from getAllDomainsProcess", data);
      });

      getAllDomainsProcess.stderr.on("data", (err) => {
        log.error("Error from getAllDomainsProcess", err);
      });

      log.debug("Setup getAllDomainsProcess");
    }

    const registrarSettings = mainFileStore.get("registrarSettings");
    // We have to pass a message in or else node will throw
    // an error, even though this doesn't actually use any
    // incoming message. Bit of an odd one this..
    getAllDomainsProcess.send(registrarSettings);
  });

  ipcMain.on("updateDomains", (evt, domains, operationName) => {
    if (updateDomainsProcess === undefined) {
      updateDomainsProcess = fork(
        path.join(__dirname, "updateDomains.js"),
        ["args"],
        {
          stdio: ["pipe", "pipe", "pipe", "ipc"],
        }
      );

      updateDomainsProcess.on("message", (data) => {
        // A partial update in this case equivalent to one domain
        if (data._partialUpdate) {
          log.debug("Received partial update", data);
          evt.reply("updateDomainsPartial", data.partialResult);
        } else if (data._completed) {
          log.debug("updateDomains has completed");
          evt.reply("updateDomainsCompleted");
        } else {
          // The default is a registrar update
          log.debug("Received updateDomains registrar progress", data);
          evt.reply("updateDomainsRegistrar", data);
        }
      });

      updateDomainsProcess.stdout.on("data", (data) => {
        console.log(`updateDomainsProcess stdout: ${data}`);
      });

      updateDomainsProcess.stderr.on("data", (err) => {
        console.error(`updateDomainsProcess stderr: ${err}`);
      });

      log.debug("Setup updateDomainsProcess");
    }

    const registrarSettings = mainFileStore.get("registrarSettings");

    // We have to pass a message in or else node will throw
    // an error, even though this doesn't actually use any
    // incoming message. Bit of an odd one this..
    updateDomainsProcess.send({
      registrarSettings,
      domains,
      operationName,
    });
  });

  app.on("window-all-closed", function () {
    if (checkRegistrarProcess) checkRegistrarProcess.kill();
    if (getAllDomainsProcess) getAllDomainsProcess.kill();
  });
}
