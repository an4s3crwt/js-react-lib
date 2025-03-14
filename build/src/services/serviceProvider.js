import { ServiceDictionary } from "./serviceDictionary";
import { ResponseStateEnumeration } from "./../communication/response";
export class ServiceProvider {
  constructor(key) {
    this.key = key;
    this.serviceDictionary = ServiceDictionary || {}; // Asegura que siempre sea un objeto válido
  }

  // Agregar un servicio con inyección de ServiceProvider
  addService(service, serviceKey) {
    if (!this.serviceDictionary[serviceKey]) {
      service.injectServiceProvider(this); // Inyecta el ServiceProvider antes de registrarlo
      this.serviceDictionary[serviceKey] = service;
    }
  }

  // Obtener un servicio
  getService(serviceKey) {
    return this.serviceDictionary[serviceKey] || undefined;
  }

  // Iniciar todos los servicios
  async startServices() {
    const serviceStartPromises = Object.values(this.serviceDictionary).map(service => {
      service.injectServiceProvider(this);
      return service.start();
    });
    const serviceStartResponses = await Promise.all(serviceStartPromises);
    return serviceStartResponses.every(r => r.state !== ResponseStateEnumeration.Error);
  }

  // Detener todos los servicios
  async stopServices() {
    const serviceStopPromises = Object.values(this.serviceDictionary).map(service => service.stop());
    const serviceStopResponses = await Promise.all(serviceStopPromises);
    return serviceStopResponses.every(r => r.state !== ResponseStateEnumeration.Error);
  }
}