import { Service } from "./../abstractions";
import {
  createResponse,
  ResponseStateEnumeration,
} from "./../../communication";
import { LocalizationNamespaces } from "../../i18n";
import { NavigationTypeEnumeration } from "../../navigation";

export class NavigationService extends Service {
  constructor(key) {
    super(key);

    this.history = [];
    this.navigationRequestSubscriberDictionary = {};
    this.navigationRequestSubscriptionCounter = 0;
    this.historyOverflowLimit = 2000;

    this.display = {
      keyNamespace: LocalizationNamespaces.System,
      key: "services.navigationservice.display",
      value: "Navigation Service",
    };

    this.description = {
      keyNamespace: LocalizationNamespaces.System,
      key: "services.navigationservice.description",
      value: "Provides all interaction options for UI navigation.",
    };

    this.logger.info("NavigationService initialized.");
  }

  show = (navigationData, url) => {
    const navigationRequest = {
      key: navigationData.key,
      type: navigationData.type
        ? navigationData.type
        : NavigationTypeEnumeration.View,
      url: url,
      timeStamp: Date.now(),
    };

    this.logger.debug(`Showing navigation request: ${JSON.stringify(navigationRequest)}`);
    this.processNavigationRequest(navigationRequest);
  };

  onNavigationRequest = (contextKey, callbackHandler) => {
    this.navigationRequestSubscriptionCounter++;
    const registerKey = `${contextKey}_${this.navigationRequestSubscriptionCounter}`;

    this.navigationRequestSubscriberDictionary[registerKey] = callbackHandler;
    this.logger.debug(
      `Component with key '${registerKey}' has subscribed to 'NavigationRequest'.`
    );
    this.logger.debug(
      `'${Object.entries(this.navigationRequestSubscriberDictionary).length}' subscribers on 'NavigationRequest'.`
    );

    return registerKey;
  };

  offNavigationRequest = (registerKey) => {
    const existingSubscriber = Object.entries(this.navigationRequestSubscriberDictionary)
      .find(([key, value]) => key === registerKey);
    
    if (existingSubscriber) {
      delete this.navigationRequestSubscriberDictionary[registerKey];
      this.logger.debug(
        `Component with key '${registerKey}' has unsubscribed from 'NavigationRequest'.`
      );
      this.logger.debug(
        `'${Object.entries(this.navigationRequestSubscriberDictionary).length}' subscribers on 'NavigationRequest'.`
      );
      return true;
    } else {
      this.logger.error(
        `Component with key '${registerKey}' not found in 'NavigationRequest' subscriptions.`
      );
      this.logger.debug(
        `'${Object.entries(this.navigationRequestSubscriberDictionary).length}' subscribers on 'NavigationRequest'.`
      );
      return false;
    }
  };

  async onStarting() {
    try {
      this.logger.info("NavigationService is starting...");
      return createResponse(true, ResponseStateEnumeration.OK, []);
    } catch (error) {
      this.logger.error("Error during NavigationService startup:", error);
      return createResponse(false, ResponseStateEnumeration.Error, [error.message]);
    }
  }

  async onStopping() {
    try {
      this.logger.info("NavigationService is stopping...");
      return createResponse(true, ResponseStateEnumeration.OK, []);
    } catch (error) {
      this.logger.error("Error during NavigationService shutdown:", error);
      return createResponse(false, ResponseStateEnumeration.Error, [error.message]);
    }
  }

  processNavigationRequest(navigationRequest) {
    try {
      this.logger.debug(`Processing navigation request: ${JSON.stringify(navigationRequest)}`);
      Object.values(this.navigationRequestSubscriberDictionary).forEach(
        (callback) => callback(navigationRequest)
      );
      this.archiveNavigationRequest(navigationRequest);
      this.updateVersion(
        `Navigation request has been added [${navigationRequest.key}, ${navigationRequest.type}]`
      );
    } catch (error) {
      this.logger.error("Error processing navigation request:", error);
    }
  }

  archiveNavigationRequest(navigationRequest) {
    try {
      this.history.unshift(navigationRequest);
      if (this.history.length > this.historyOverflowLimit) {
        this.history.pop();
      }
      this.logger.debug(`Archived navigation request: ${JSON.stringify(navigationRequest)}`);
    } catch (error) {
      this.logger.error("Error archiving navigation request:", error);
    }
  }
}
