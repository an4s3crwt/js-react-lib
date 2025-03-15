import { Service } from "./abstractions";
import { ServiceDictionary } from "./serviceDictionary";
import { LogProvider } from "./../logging";
import { ResponseStateEnumeration } from "./../communication";

export class ServiceProvider extends Service {
  constructor(key) {
    super(key);
    this.key = key;
    this.serviceDictionary = ServiceDictionary || {}; // Evitar que sea undefined
    this.logger = LogProvider.getLogger(this.key);
  }

  addService(service, serviceKey) {
    if (!service || !serviceKey) {
      this.logger.error(`Error: Service or key is invalid.`);
      return;
    }

    if (this.serviceDictionary.hasOwnProperty(serviceKey)) {
      this.logger.warn(`Warning: Service '${serviceKey}' already exists.`);
      return;
    }

    this.logger.info(`Service '${serviceKey}' added.`);
    this.serviceDictionary[serviceKey] = service;
  }

  getService(serviceKey) {
    if (!this.serviceDictionary.hasOwnProperty(serviceKey)) {
      this.logger.error(`Service '${serviceKey}' not found.`);
      return undefined;
    }

    return this.serviceDictionary[serviceKey];
  }

  async startServices() {
    if (!this.serviceDictionary || typeof this.serviceDictionary !== "object") {
      this.logger.error("Error: serviceDictionary is not defined or is not an object.");
      return false;
    }

    const services = Object.values(this.serviceDictionary);

    this.logger.info(`Detected '${services.length}' services.`);
    this.logger.info("Starting services...");

    const serviceStartPromises = services.map((service, index) => {
      try {
        if (!(service instanceof Service)) {
          this.logger.error(`Service at index ${index} is not an instance of Service.`);
          return Promise.reject(new Error("Invalid service instance"));
        }

        if (typeof service.injectServiceProvider === "function") {
          service.injectServiceProvider(this);
        } else {
          this.logger.warn(`Service '${service.key}' does not have injectServiceProvider.`);
        }

        if (typeof service.start !== "function") {
          this.logger.error(`Service '${service.key}' does not have a start() method.`);
          return Promise.reject(new Error("start method not found"));
        }

        return service.start();
      } catch (error) {
        this.logger.error(`Error initializing service '${service.key}': ${error.message}`);
        return Promise.reject(error);
      }
    });

    try {
      const serviceStartResponses = await Promise.allSettled(serviceStartPromises);

      const failedServices = serviceStartResponses.filter(
        (result) =>
          result.status === "rejected" ||
          (result.value && result.value.state === ResponseStateEnumeration.Error)
      );

      if (failedServices.length > 0) {
        this.logger.error(
          `Not all services could be started. '${failedServices.length}' services failed!`
        );
      } else {
        this.logger.info(`All services started successfully.`);
      }

      return failedServices.length === 0;
    } catch (error) {
      this.logger.error(`Unexpected error starting services: ${error.message}`);
      return false;
    }
  }

  async stopServices() {
    if (!this.serviceDictionary || typeof this.serviceDictionary !== "object") {
      this.logger.error("Error: serviceDictionary is not defined or is not an object.");
      return false;
    }

    this.logger.info(`Detected '${Object.keys(this.serviceDictionary).length}' services.`);
    this.logger.info("Stopping services...");

    const serviceStopPromises = Object.values(this.serviceDictionary).map((service) => {
      if (typeof service.stop === "function") {
        return service.stop();
      } else {
        this.logger.warn(`Service '${service.key}' does not have a stop() method.`);
        return Promise.resolve({ state: ResponseStateEnumeration.OK }); // Consider it stopped
      }
    });

    const serviceStopResponses = await Promise.all(serviceStopPromises);
    const failedServices = serviceStopResponses.filter(
      (r) => r.state === ResponseStateEnumeration.Error
    );

    if (failedServices.length > 0) {
      this.logger.error(
        `Not all services could be stopped. '${failedServices.length}' services failed!`
      );
    } else {
      this.logger.info(`All services stopped.`);
    }

    return failedServices.length === 0;
  }
}
