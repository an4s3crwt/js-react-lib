import { Logger } from './log';
export const LogLevelEnumeration = {
  Info: 0,
  UserAction: 1,
  Debug: 2,
  Warning: 3,
  Error: 4
};
export class LogProvider {
  // Props
  static loggers = [];
  static archive = [];
  static archiveOverflowLimit = 5000;
  static defaultPrefix = 'WEB';
  static isDebugLogActive = false;
  static isConsoleLoggingActive = true;
  static version = 0;
  static onChangesSubscribers = [];
  static getLogger = (key, prefix) => {
    let logger = LogProvider.loggers.find(l => l.key === key);
    if (logger) {
      logger.isDebugLogActive = LogProvider.isDebugLogActive;
      return logger;
    }
    logger = LogProvider.createLogger(key, prefix);
    logger.isDebugLogActive = LogProvider.isDebugLogActive;
    return logger;
  };
  static archiveLog = log => {
    LogProvider.archive.unshift(log);
    if (LogProvider.archive.length > LogProvider.archiveOverflowLimit) {
      LogProvider.archive.pop();
    }

    // Increase version
    LogProvider.updateVersion(`New log entry received.`);
    if (LogProvider.isConsoleLoggingActive) {
      switch (log.level) {
        case LogLevelEnumeration.Debug:
          console.debug(`${log.prefix} | ${log.loggerKey} | ${log.message}`);
          break;
        case LogLevelEnumeration.Error:
          console.error(`${log.prefix} | ${log.loggerKey} | ${log.message}`);
          break;
        case LogLevelEnumeration.Info:
          console.info(`${log.prefix} | ${log.loggerKey} | ${log.message}`);
          break;
        case LogLevelEnumeration.Warning:
          console.warn(`${log.prefix} | ${log.loggerKey} | ${log.message}`);
          break;
      }
    }
  };
  static setDebugLog = (isActive, key) => {
    if (!key) {
      LogProvider.isDebugLogActive = isActive;
      LogProvider.loggers.forEach(logger => logger.isDebugLogActive = isActive);

      // Increase version
      LogProvider.updateVersion(`Debug logging changed for all loggers.`);
      return;
    }
    const logger = LogProvider.loggers.find(logger => logger.key === key);
    if (logger) {
      logger.isDebugLogActive = isActive;
    }

    // Increase version
    LogProvider.updateVersion(`Debug logging changed for logger '${key}'.`);
  };
  static setActive = (isActive, key) => {
    if (!key) {
      LogProvider.loggers.forEach(logger => logger.isActive = isActive);

      // Increase version
      LogProvider.updateVersion(`Activation changed for all loggers.`);
      return;
    }
    const logger = LogProvider.loggers.find(logger => logger.key === key);
    if (logger) {
      logger.isActive = isActive;
    }

    // Increase version
    LogProvider.updateVersion(`Activation changed for logger '${key}'.`);
  };
  static clearArchive = () => {
    // Clear main archive
    LogProvider.archive = [];

    // Increase version
    LogProvider.updateVersion(`All logs cleared.`);
  };
  static onChanges = callbackHandler => {
    // Check if the callback handler is already registred, otherwise it will be added
    const index = LogProvider.onChangesSubscribers.indexOf(callbackHandler);
    if (index < 0) {
      LogProvider.onChangesSubscribers.push(callbackHandler);
    }

    // Execute the callback to update the handler immediately
    callbackHandler(LogProvider.version, 'Successfully registred');
  };
  static offChanges = callbackHandler => {
    const index = LogProvider.onChangesSubscribers.indexOf(callbackHandler);
    if (index >= 0) {
      LogProvider.onChangesSubscribers.splice(index, 1);
    }
  };
  static updateVersion = reason => {
    LogProvider.version++;

    // Execute callbacks
    LogProvider.onChangesSubscribers.forEach(callbackHandler => callbackHandler(LogProvider.version, reason));
  };
  static createLogger = (key, prefix) => {
    const loggerPrefix = prefix ? prefix : LogProvider.defaultPrefix;
    const logger = new Logger(key, loggerPrefix);
    LogProvider.loggers.push(logger);
    return logger;
  };
}