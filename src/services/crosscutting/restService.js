import { createResponse, ResponseStateEnumeration } from '../../communication';
import { LocalizationNamespaces } from '../../i18n';

export class RESTService {

  // Props
  authorizationHeader = '';

  constructor(key) {
    this.key = key;
    this.display = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'services.restservice.display',
      value: 'REST Service'
    };
    this.description = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'services.restservice.description',
      value: 'Provides all interaction options for REST communication.'
    };
  }

  get = (url, init) => {
    return this.invokeAsync('GET', url, undefined, init);
  };

  post = (url, data, init) => {
    return this.invokeAsync('POST', url, data, init);
  };

  put = (url, data, init) => {
    return this.invokeAsync('PUT', url, data, init);
  };

  delete = (url, data, init) => {
    return this.invokeAsync('DELETE', url, data, init);
  };

  setAuthorization = (authorizationHeader) => {
    this.authorizationHeader = authorizationHeader;
  };

  async onStarting() {
    return createResponse(true, ResponseStateEnumeration.OK, []);
  }

  async onStopping() {
    return createResponse(true, ResponseStateEnumeration.OK, []);
  }

  getHeaders = (data) => {
    const headers = new Headers();

    // We only accept json as payload
    headers.set('Accept', 'application/json');

    // We can use different authorizations. `Bearer TOKEN`, `Basic USERNAME:PASSWORD`, etc.
    if (this.authorizationHeader !== '') {
      headers.set('Authorization', this.authorizationHeader);
    }

    // We define the type of the content by the data type
    if (data) {
      if (typeof data === 'object') {
        headers.set('Content-Type', 'application/json');
      } else {
        headers.set('Content-Type', 'application/x-www-form-urlencoded');
      }
    }

    return headers;
  };

  getBody = (data) => {
    let body;

    // Body data type must match "Content-Type" header
    if (data) {
      if (typeof data === 'object') {
        body = JSON.stringify(data);
      } else {
        body = String(data);
      }
    }

    return body;
  };

  getRequestInit = (method, init) => {
    const requestInit = {
      method: method,               // *GET, POST, PUT, DELETE, etc.
      mode: "same-origin",           // no-cors, cors, *same-origin
      cache: "default",              // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin",    // include, *same-origin, omit
      redirect: "follow",            // manual, *follow, error
      referrer: "client",
    };

    if (init) {
      if (init.mode) requestInit.mode = init.mode;
      if (init.credentials) requestInit.credentials = init.credentials;
    }

    return requestInit;
  };

  invokeAsync = async (method, url, data, init) => {
    let responseOk = false;
    let responseStatus = 0;
    let responseStatusText = '';

    const requestInit = this.getRequestInit(method, init);
    const headers = this.getHeaders(data);
    const body = this.getBody(data);
    requestInit.headers = headers;
    requestInit.body = body;

    if (this.isDebugModeActive) {
      this.logger.info(`REST request '${method}' has started on url ${url}.`);
    }

    try {
      const responseFromServer = await fetch(url, requestInit);
      // Save the response state
      responseOk = responseFromServer.ok;
      responseStatus = responseFromServer.status;
      responseStatusText = responseFromServer.statusText;

      // Check how to resolve the body
      const responseContentType = responseFromServer.headers.get("content-type");
      let responseObject;

      if (responseContentType && responseContentType.indexOf("application/json") !== -1) {
        responseObject = await responseFromServer.json();
      } else {
        responseObject = await responseFromServer.text();
      }

      // Setup the response object
      const responseData = {
        state: ResponseStateEnumeration.Unknown,
        messageStack: []
      };

      if (this.isDebugModeActive) {
        this.logger.info(`REST request '${method}' has returned from url ${url}. [${responseStatus}, ${responseStatusText}]`);
      }

      if (responseObject == null || responseObject == undefined) {
        const displayKey = "services.restservice.novalidresponse";
        const displayValue = `No valid response.`;
        const logMessage = `${displayValue} Response object is null or undefined.`;

        responseData.messageStack.push({
          display: {
            keyNamespace: LocalizationNamespaces.System,
            key: displayKey,
            value: displayValue,
          },
          context: this.key,
          logText: logMessage
        });

        this.logger.error(logMessage);
      } else if (typeof responseObject === 'string') {
        const payload = {
          data: responseObject
        };

        responseData.state = ResponseStateEnumeration.OK;
        responseData.payload = payload;
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
        const displayKey = "services.restservice.noresponse";
        const displayValue = `No response available.`;
        const logMessage = `${displayValue} No idea what's going on here. Go and drink a coffee.`;

        responseData.messageStack.push({
          display: {
            key: displayKey,
            keyNamespace: LocalizationNamespaces.System,
            value: displayValue,
          },
          context: this.key,
          logText: logMessage
        });

        this.logger.error(logMessage);
      }

      // Fill the response object
      const finalResponse = {
        state: responseData.state,
        messageStack: responseData.messageStack,
        payload: responseData.payload,
      };

      return finalResponse;
    } catch (error) {
      const errorResponse = {
        state: ResponseStateEnumeration.Error,
        messageStack: []
      };
      return errorResponse;
    }
  };
}
