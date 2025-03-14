import { createResponse, ResponseStateEnumeration } from "../../communication";
import { LocalizationNamespaces } from "../../i18n";
import { Service } from "./../abstractions";
export class RESTService extends Service {
  constructor(key) {
    super(key);
    console.log("Initializing RESTService:", key);
    this.authorizationHeader = "";
    this.display = {
      keyNamespace: LocalizationNamespaces.System,
      key: "services.restservice.display",
      value: "REST Service"
    };
    this.description = {
      keyNamespace: LocalizationNamespaces.System,
      key: "services.restservice.description",
      value: "Provides all interaction options for REST communication."
    };
  }
  get = (url, init) => {
    return this.invokeAsync("GET", url, undefined, init);
  };
  post = (url, data, init) => {
    return this.invokeAsync("POST", url, data, init);
  };
  put = (url, data, init) => {
    return this.invokeAsync("PUT", url, data, init);
  };
  delete = (url, data, init) => {
    return this.invokeAsync("DELETE", url, data, init);
  };
  setAuthorization = authorizationHeader => {
    this.authorizationHeader = authorizationHeader;
  };
  async onStarting() {
    return createResponse(true, ResponseStateEnumeration.OK, []);
  }
  async onStopping() {
    return createResponse(true, ResponseStateEnumeration.OK, []);
  }
  getHeaders = data => {
    const headers = new Headers();
    headers.set("Accept", "application/json");
    if (this.authorizationHeader) {
      headers.set("Authorization", this.authorizationHeader);
    }
    if (data) {
      headers.set("Content-Type", typeof data === "object" ? "application/json" : "application/x-www-form-urlencoded");
    }
    return headers;
  };
  getBody = data => {
    return data ? typeof data === "object" ? JSON.stringify(data) : String(data) : undefined;
  };
  getRequestInit = (method, init = {}) => {
    return {
      method,
      mode: init.mode || "same-origin",
      cache: init.cache || "default",
      credentials: init.credentials || "same-origin",
      redirect: init.redirect || "follow",
      referrer: "client",
      headers: this.getHeaders(init.body),
      body: this.getBody(init.body)
    };
  };
  invokeAsync = async (method, url, data, init) => {
    let responseStatus = 0;
    let responseStatusText = "";
    const requestInit = this.getRequestInit(method, {
      ...init,
      body: data
    });
    try {
      const response = await fetch(url, requestInit);
      responseStatus = response.status;
      responseStatusText = response.statusText;
      const responseContentType = response.headers.get("content-type");
      const responseObject = responseContentType && responseContentType.includes("application/json") ? await response.json() : await response.text();
      return this.processResponse(responseObject, responseStatus, responseStatusText);
    } catch (error) {
      return {
        state: ResponseStateEnumeration.Error,
        messageStack: [{
          logText: `Request failed: ${error.message}`
        }]
      };
    }
  };
  processResponse = (responseObject, responseStatus, responseStatusText) => {
    let responseData = {
      state: ResponseStateEnumeration.Unknown,
      messageStack: []
    };
    if (!responseObject) {
      responseData.messageStack.push({
        display: {
          keyNamespace: LocalizationNamespaces.System,
          key: "services.restservice.novalidresponse",
          value: "No valid response."
        },
        logText: "Response object is null or undefined."
      });
    } else if (typeof responseObject === "string") {
      responseData.state = ResponseStateEnumeration.OK;
      responseData.payload = {
        data: responseObject
      };
    } else if (typeof responseObject === "object") {
      responseData = responseObject.state && responseObject.messageStack && responseObject.payload ? responseObject : {
        state: ResponseStateEnumeration.OK,
        payload: responseObject
      };
    } else {
      responseData.messageStack.push({
        display: {
          keyNamespace: LocalizationNamespaces.System,
          key: "services.restservice.noresponse",
          value: "No response available."
        },
        logText: "Unexpected response format."
      });
    }
    return {
      state: responseData.state,
      messageStack: responseData.messageStack,
      payload: responseData.payload
    };
  };
}