import { LogProvider } from "./../../logging";
import { LocalizationNamespaces } from "./../../i18n";
import { createResponse, ResponseStateEnumeration } from "./../../communication";


export const ServiceStateEnumeration = {
  Unknown: 0,
  Initialized: 1,
  Running: 2,
  Stopped: 3,
  Error: 4
};
export class Service {
  constructor(key) {
    this.key = key;
    this.display = {
      keyNamespace: LocalizationNamespaces.System,
      key: "global.nodisplaydefined",
      value: "Service?"
    };
    this.description = {
      keyNamespace: LocalizationNamespaces.System,
      key: "global.nodescriptiondefined",
      value: "Description?"
    };
    this.state = ServiceStateEnumeration.Unknown;
    this.logger = LogProvider.getLogger(key);
    this.version = 0;
    this.changesSubscriberDictionary = {};
    this.changesSubscriptionCounter = 0;
    this.serviceProvider = serviceProvider; //changed from null to serviceprovider
    this.isDebugModeActive = false;
  }
  /** Inicia el servicio */
  async start() {
    this.logger.info(`Starting '${this.key}'.`);
    this.changesSubscriberDictionary = {};
    const onStartingResponse = await this.onStarting();
    if (onStartingResponse.state === ResponseStateEnumeration.OK) {
      this.logger.info(`'${this.key}' is running.`);
      this.updateState(ServiceStateEnumeration.Running);
    } else {
      this.logger.error(`'${this.key}' could not be started.`);
      this.updateState(ServiceStateEnumeration.Error);
    }
    return onStartingResponse;
  }

  /** Detiene el servicio */
  async stop() {
    this.logger.info(`Stopping '${this.key}'.`);
    const onStoppingResponse = await this.onStopping();
    if (onStoppingResponse.state === ResponseStateEnumeration.OK) {
      this.logger.info(`'${this.key}' is stopped.`);
      this.updateState(ServiceStateEnumeration.Stopped);
    } else {
      this.logger.error(`'${this.key}' could not be stopped.`);
      this.updateState(ServiceStateEnumeration.Error);
    }
    this.changesSubscriberDictionary = {};
    return onStoppingResponse;
  }

  /**
   * Suscribe un callback a los cambios del servicio.
   * @param {string} contextKey - Clave del contexto.
   * @param {Function} callbackHandler - Función callback a ejecutar en cambios.
   * @returns {string} Clave de registro de la suscripción.
   */
  onChanges(contextKey, callbackHandler) {
    this.changesSubscriptionCounter++;
    const registerKey = `${contextKey}_${this.changesSubscriptionCounter}`;
    this.changesSubscriberDictionary[registerKey] = callbackHandler;
    this.logger.debug(`Component '${registerKey}' subscribed to 'Changes'.`);
    callbackHandler(this.version, "Subscription successfully", this.key);
    return registerKey;
  }

  /**
   * Desuscribe un callback de los cambios del servicio.
   * @param {string} registerKey - Clave de registro de la suscripción.
   * @returns {boolean} `true` si la suscripción fue eliminada, `false` si no existía.
   */
  offChanges(registerKey) {
    if (this.changesSubscriberDictionary[registerKey]) {
      delete this.changesSubscriberDictionary[registerKey];
      this.logger.debug(`Component '${registerKey}' unsubscribed from 'Changes'.`);
      return true;
    } else {
      this.logger.error(`Component '${registerKey}' not registered on 'Changes'.`);
      return false;
    }
  }

  /**
   * Inyecta un proveedor de servicio.
   * @param {Object} serviceProvider - Proveedor de servicio.
   */
  injectServiceProvider(serviceProvider) {
    this.serviceProvider = serviceProvider;
  }

  /**
   * Activa o desactiva el modo debug.
   * @param {boolean} enabled - `true` para activar debug, `false` para desactivar.
   */
  setDebugMode(enabled) {
    this.isDebugModeActive = enabled;
  }

  /**
   * Método abstracto a ser implementado en clases hijas.
   * @returns {Promise<IResponse<boolean>>}
   */
  async onStarting() {
    throw new Error("onStarting() must be implemented in the subclass.");
  }

  /**
   * Método abstracto a ser implementado en clases hijas.
   * @returns {Promise<IResponse<boolean>>}
   */
  async onStopping() {
    throw new Error("onStopping() must be implemented in the subclass.");
  }

  /**
   * Actualiza el estado del servicio y notifica cambios.
   * @param {number} state - Nuevo estado del servicio.
   */
  updateState(state) {
    this.state = state;
    this.updateVersion(`State changed to '${Object.keys(ServiceStateEnumeration)[state]}'.`);
  }

  /**
   * Actualiza la versión interna del servicio y notifica a los suscriptores.
   * @param {string} reason - Razón de la actualización.
   */
  updateVersion(reason) {
    this.version++;
    this.logger.debug(`Version updated to '${this.version}'. ${reason}`);
    Object.values(this.changesSubscriberDictionary).forEach(callback => {
      callback(this.version, reason, this.key);
    });
  }
}