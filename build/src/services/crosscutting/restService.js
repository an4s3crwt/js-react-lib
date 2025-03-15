import { Service } from '../abstractions'; // Asumimos que 'Service' es exportado de abstractions
import { createResponse, ResponseStateEnumeration } from '../../communication';
import { LocalizationNamespaces } from '../../i18n';

export class RESTService extends Service {
  // Props
  authorizationHeader = '';

  constructor(key) {
    super(key);

    this.display = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'services.restservice.display',
      value: 'REST Service',
    };

    this.description = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'services.restservice.description',
      value: 'Provides all interaction options for REST communication.',
    };
  }

  get(url, init) {
    return this.invokeAsync('GET', url, undefined, init);
  }

  post(url, data, init) {
    return this.invokeAsync('POST', url, data, init);
  }

  put(url, data, init) {
    return this.invokeAsync('PUT', url, data, init);
  }

  delete(url, data, init) {
    return this.invokeAsync('DELETE', url, data, init);
  }

  setAuthorization(authorizationHeader) {
    this.authorizationHeader = authorizationHeader;
  }

  async onStarting() {
    return createResponse(true, ResponseStateEnumeration.OK, []);
  }

  async onStopping() {
    return createResponse(true, ResponseStateEnumeration.OK, []);
  }

  getHeaders(data) {
    const headers = new Headers();
    headers.set('Accept', 'application/json');

    if (this.authorizationHeader !== '') {
      headers.set('Authorization', this.authorizationHeader);
    }

    if (data) {
      if (typeof data === 'object') {
        headers.set('Content-Type', 'application/json');
      } else {
        headers.set('Content-Type', 'application/x-www-form-urlencoded');
      }
    }

    return headers;
  }

  getBody(data) {
    let body = undefined;

    if (data) {
      if (typeof data === 'object') {
        body = JSON.stringify(data);
      } else {
        body = String(data);
      }
    }

    return body;
  }

  getRequestInit(method, init) {
    let requestInit = {
      method: method, // *GET, POST, PUT, DELETE, etc.
      mode: 'same-origin', // no-cors, cors, *same-origin
      cache: 'default', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      redirect: 'follow', // manual, *follow, error
      referrer: 'client',
    };

    if (init) {
      if (init.mode) requestInit.mode = init.mode;
      if (init.credentials) requestInit.credentials = init.credentials;
    }

    return requestInit;
  }

  async invokeAsync(method, url, data, init) {
    let responseOk = false;
    let responseStatus = 0;
    let responseStatusText = '';

    const requestInit = this.getRequestInit(method, init);
    const headers = this.getHeaders(data);
    const body = this.getBody(data);
    requestInit.headers = headers;
    requestInit.body = body;

    if (this.isDebugModeActive)
      this.logger.info(`REST request '${method}' has started on url ${url}.`);

    try {
      const response = await fetch(url, requestInit);
      responseOk = response.ok;
      responseStatus = response.status;
      responseStatusText = response.statusText;

      let responseContentType = response.headers.get('content-type');
      let responseObject = null;
      
      if (responseContentType && responseContentType.indexOf('application/json') !== -1) {
        responseObject = await response.json();
      } else {
        responseObject = await response.text();
      }

      let responseData = {
        state: ResponseStateEnumeration.Unknown,
        messageStack: [],
      };

      if (this.isDebugModeActive)
        this.logger.info(`REST request '${method}' has returned from url ${url}. [${responseStatus}, ${responseStatusText}]`);

      if (!responseObject) {
        const displayKey = 'services.restservice.novalidresponse';
        const displayValue = 'No valid response.';
        const logMessage = `${displayValue} Response object is null or undefined.`;

        responseData.messageStack.push({
          display: {
            keyNamespace: LocalizationNamespaces.System,
            key: displayKey,
            value: displayValue,
          },
          context: this.key,
          logText: logMessage,
        });

        this.logger.error(logMessage);
      } else if (typeof responseObject === 'string') {
        responseData.state = ResponseStateEnumeration.OK;
        responseData.payload = { data: responseObject };
      } else if (typeof responseObject === 'object') {
        const assertedResponseData = responseObject;
        if (assertedResponseData.state && assertedResponseData.messageStack && assertedResponseData.payload) {
          responseData.state = assertedResponseData.state;
          responseData.messageStack = assertedResponseData.messageStack;
          responseData.payload = assertedResponseData.payload;
        } else {
          responseData.state = ResponseStateEnumeration.OK;
          responseData.payload = responseObject;
        }
      } else {
        const displayKey = 'services.restservice.noresponse';
        const displayValue = 'No response available.';
        const logMessage = `${displayValue} No idea what's going on here. Go and drink a coffee.`;

        responseData.messageStack.push({
          display: {
            key: displayKey,
            keyNamespace: LocalizationNamespaces.System,
            value: displayValue,
          },
          context: this.key,
          logText: logMessage,
        });

        this.logger.error(logMessage);
      }

      return {
        state: responseData.state,
        messageStack: responseData.messageStack,
        payload: responseData.payload,
      };
    } catch (reason) {
      return {
        state: ResponseStateEnumeration.Error,
        messageStack: [],
      };
    }
  }
}
