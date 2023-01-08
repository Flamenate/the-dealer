const fs = require("fs");
const moment = require("moment");

class Logger {
  static errCallback = (err) => {
    if (err) throw err;
  };
  static levels = ["LOG", "WARN", "ERROR"];

  constructor(filepath) {
    fs.writeFile(filepath, "", (err) => {
      if (err) throw err;
      console.log("Logfile writable.");
    });
    this.file = filepath;
  }

  commandLog(levelIndex, interaction, message) {
    const level = Logger.levels[levelIndex];
    const timestamp = moment().format("D/MM/YYYY, h:mm:ss A");
    const msg = levelIndex != 2 ? message : message.stack;
    fs.appendFile(
      this.file,
      `${"-".repeat(25) + "\n"}[${timestamp}] ${level} on /${
        interaction?.commandName
      } by ${interaction?.user?.tag}:\n${msg}\n\n`,
      Logger.errCallback
    );
    if (levelIndex == 0) return;
    console.log(
      `Logged ${level} in /${interaction?.commandName} from ${interaction?.user?.tag}.`
    );
  }
  eventLog(levelIndex, event, message) {
    const level = Logger.levels[levelIndex];
    const timestamp = moment().format("D/MM/YYYY, h:mm:ss A");
    const msg = levelIndex != 2 ? message : message.stack;
    fs.appendFile(
      this.file,
      `${
        "-".repeat(25) + "\n"
      }[${timestamp}] ${level} on /${event}:\n${msg}\n\n`,
      Logger.errCallback
    );
    if (levelIndex == 0) return;
    console.log(`Logged ${level} in ${event}.`);
  }
}

module.exports = Logger;
