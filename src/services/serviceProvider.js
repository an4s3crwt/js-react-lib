import { Service } from "./abstractions";
import { ServiceDictionary } from "./serviceDictionary";
import { LogProvider } from "./../logging";
import { ResponseStateEnumeration } from "./../communication";


export class ServiceProvider extends Service {
  constructor(key) {
    super(key); // Llamada al constructor de la clase base
    this.key = key;
    this.serviceDictionary = ServiceDictionary;
    this.logger = LogProvider.getLogger(this.key);
  }

  addService(service, serviceKey) {
    // Check if the service already exists
    if (this.serviceDictionary.hasOwnProperty(serviceKey)) {
      return;
    }

    // Push the new service to the dictionary
    this.logger.info(`Service '${serviceKey}' added.`);
    this.serviceDictionary[serviceKey] = service;
  }

  // Obtener un servicio
  getService(serviceKey) {
    if (this.serviceDictionary.hasOwnProperty(serviceKey)) {
      return this.serviceDictionary[serviceKey];
    }

    this.logger.error(`Service '${serviceKey}' not found.`);
    return undefined;
  }

  // Iniciar todos los servicios
  async startServices() {
    this.logger.info(
      `'${Object.keys(this.serviceDictionary).length}' services detected.`
    );
    this.logger.info(`Starting services.`);

    const serviceStartPromises = Object.values(this.serviceDictionary).map(
      (service) => {
        // Depuración: Verifica el tipo de servicio
        this.logger.debug(`Service type: ${service.constructor.name}`);

        if (service instanceof Service) {
          // Verifica si la función existe
          if (typeof service.injectServiceProvider === 'function') {
            service.injectServiceProvider(this); // Inyectamos el servicio
          } else {
            this.logger.error(`injectServiceProvider is not a function for ${service.key}`);
            return Promise.reject(new Error('injectServiceProvider not found'));
          }

          return service.start(); // Llamamos al método start
        } else {
          this.logger.error(`Service is not an instance of Service: ${service}`);
          return Promise.reject(new Error('Invalid service instance'));
        }
      }
    );

    try {
      const serviceStartResponses = await Promise.all(serviceStartPromises);
      const failedServices = serviceStartResponses.filter(
        (r) => r.state === ResponseStateEnumeration.Error
      );

      if (failedServices.length > 0) {
        this.logger.error(
          `Not all services could be started. '${failedServices.length}' services failed!`
        );
      } else {
        this.logger.info(`All services started and ready.`);
      }

      return failedServices.length === 0;
    } catch (error) {
      this.logger.error(`Error starting services: ${error.message}`);
      return false;
    }
  }

  // Detener todos los servicios
  async stopServices() {
    this.logger.info(
      `'${Object.keys(this.serviceDictionary).length}' services detected.`
    );
    this.logger.info(`Stopping services.`);

    const serviceStopPromises = Object.values(this.serviceDictionary).map(
      (service) => service.stop()
    );
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
