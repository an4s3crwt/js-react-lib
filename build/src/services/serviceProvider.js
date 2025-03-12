import { Service } from './abstractions';
import { ServiceDictionary } from './serviceDictionary';
import { createResponse, ResponseStateEnumeration } from './createResponse'; // Import createResponse

export class ServiceProvider {
  constructor(key) {
    this.key = key;
    this.serviceDictionary = ServiceDictionary; // Assuming ServiceDictionary is initialized elsewhere
  }

  // Add a service
  addService(service, serviceKey) {
    if (!this.serviceDictionary[serviceKey]) {
      this.serviceDictionary[serviceKey] = service;
    }
  }

  // Get a service
  getService(serviceKey) {
    const service = this.serviceDictionary[serviceKey];
    return service ? service : undefined;
  }

  // Start services
  async startServices() {
    const serviceStartPromises = [];
    Object.entries(this.serviceDictionary).forEach(([key, value]) => {
      const service = value;
      service.injectServiceProvider(this); // Inject ServiceProvider for each service
      serviceStartPromises.push(service.start());
    });
    const serviceStartResponses = await Promise.all(serviceStartPromises);
    const failedServices = serviceStartResponses.filter(r => r.state === ResponseStateEnumeration.Error);
    return failedServices.length === 0;
  }

  // Stop services
  async stopServices() {
    const serviceStopPromises = [];
    Object.entries(this.serviceDictionary).forEach(([key, value]) => serviceStopPromises.push(value.stop()));
    const serviceStopResponses = await Promise.all(serviceStopPromises);
    const failedServices = serviceStopResponses.filter(r => r.state === ResponseStateEnumeration.Error);
    return failedServices.length === 0;
  }
}