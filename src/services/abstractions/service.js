import { LogProvider } from "./../../logging";
import { ServiceProvider } from "./../serviceProvider";

export const ServiceStateEnumeration = {
  Unknown: 0,
  Initialized: 1,
  Running: 2,
  Stopped: 3,
  Error: 4,
};

export class Service {
  // IService
  key;
  display;
  description;
  state;

  // Props

  version = 0;
  changesSubscriberDictionary = {};
  changesSubscriptionCounter = 0;
  logger;
  serviceProvider;
  isDebugModeActive = false;

  constructor(key) {
    this.key = key;

    this.display = {
      keyNamespace: "System",
      key: "global.nodisplaydefined",
      value: "Service?",
    };

    this.description = {
      keyNamespace: "System",
      key: "global.nodescriptiondefined",
      value: "Description?",
    };

    this.state = ServiceStateEnumeration.Unknown;
    this.logger = LogProvider.getLogger(key);
    // Inyecta el ServiceProvider solo si está definido
    if (serviceProvider) {
      this.injectServiceProvider(serviceProvider);
    }
  }

  async start() {
    this.logger.info(`Starting '${this.key}'.`);

    // Init fields
    this.changesSubscriberDictionary = {};

    const onStartingResponse = await this.onStarting();
    if (onStartingResponse.state === "OK") {
      this.logger.info(`'${this.key}' is running.`);
      this.updateState(ServiceStateEnumeration.Running);
    } else {
      this.logger.error(`'${this.key}' could not be started.`);
      this.updateState(ServiceStateEnumeration.Error);
    }

    return onStartingResponse;
  }

  async stop() {
    this.logger.info(`Stopping '${this.key}'.`);

    const onStoppingResponse = await this.onStopping();
    if (onStoppingResponse.state === "OK") {
      this.logger.info(`'${this.key}' is stopped.`);
      this.updateState(ServiceStateEnumeration.Stopped);
    } else {
      this.logger.error(`'${this.key}' could not be stopped.`);
      this.updateState(ServiceStateEnumeration.Error);
    }

    // Dispose fields
    this.changesSubscriberDictionary = {};

    return onStoppingResponse;
  }

  onChanges(contextKey, callbackHandler) {
    // Setup register key
    this.changesSubscriptionCounter++;
    const registerKey = `${contextKey}_${this.changesSubscriptionCounter}`;

    // Register callback
    this.changesSubscriberDictionary[registerKey] = callbackHandler;
    this.logger.debug(
      `Component with key '${registerKey}' has subscribed on 'Changes'.`
    );
    this.logger.debug(
      `'${
        Object.entries(this.changesSubscriberDictionary).length
      }' subscribers on 'Changes'.`
    );

    // Execute the callback to update the handler immediately
    callbackHandler(this.version, "Subscription successfully", this.key);

    return registerKey;
  }

  offChanges(registerKey) {
    // Delete callback
    const existingSubscriber = Object.entries(
      this.changesSubscriberDictionary
    ).find(([key, value]) => key === registerKey);
    if (existingSubscriber) {
      delete this.changesSubscriberDictionary[registerKey];
      this.logger.debug(
        `Component with key '${registerKey}' has unsubscribed on 'Changes'.`
      );
      this.logger.debug(
        `'${
          Object.entries(this.changesSubscriberDictionary).length
        }' subscribers on 'Changes'.`
      );

      return true;
    } else {
      this.logger.error(
        `Component with key '${registerKey}' not registered on 'Changes'.`
      );
      this.logger.debug(
        `'${
          Object.entries(this.changesSubscriberDictionary).length
        }' subscribers on 'Changes'.`
      );

      return false;
    }
  }

  injectServiceProvider(serviceProvider ) {
    this.serviceProvider = serviceProvider;
  }

  setDebugMode(enabled) {
    this.isDebugModeActive = enabled;
  }

  // Abstract methods for stopping and starting services
  async onStarting() {
    // To be implemented in subclasses
    return { state: "OK" };
  }

  async onStopping() {
    // To be implemented in subclasses
    return { state: "OK" };
  }

  updateState(state) {
    this.state = state;
    this.updateVersion(
      `State changed to '${Object.keys(ServiceStateEnumeration)[state]}'.`
    );
  }

  updateVersion(reason) {
    this.version++;
    this.logger.debug(
      `Version has been updated to '${this.version}'. ${reason}`
    );

    // Execute callbacks
    Object.entries(this.changesSubscriberDictionary).forEach(([key, value]) =>
      value(this.version, reason, this.key)
    );
  }
}
