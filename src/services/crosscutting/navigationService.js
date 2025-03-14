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

    this.processNavigationRequest(navigationRequest);
  };

  onNavigationRequest = (contextKey, callbackHandler) => {
    // Setup register key
    this.navigationRequestSubscriptionCounter++;
    const registerKey = `${contextKey}_${this.navigationRequestSubscriptionCounter}`;

    // Register callback
    this.navigationRequestSubscriberDictionary[registerKey] = callbackHandler;
    this.logger.debug(
      `Component with key '${registerKey}' has subscribed on 'NavigationRequest'.`
    );
    this.logger.debug(
      `'${
        Object.entries(this.navigationRequestSubscriberDictionary).length
      }' subscribers on 'Changes'.`
    );

    return registerKey;
  };

  offNavigationRequest = (registerKey) => {
    // Delete callback
    const existingSubscriber = Object.entries(
      this.navigationRequestSubscriberDictionary
    ).find(([key, value]) => key === registerKey);
    if (existingSubscriber) {
      delete this.navigationRequestSubscriberDictionary[registerKey];
      this.logger.debug(
        `Component with key '${registerKey}' has unsubscribed on 'Changes'.`
      );
      this.logger.debug(
        `'${
          Object.entries(this.navigationRequestSubscriberDictionary).length
        }' subscribers on 'Changes'.`
      );

      return true;
    } else {
      this.logger.error(
        `Component with key '${registerKey}' not registered on 'Changes'.`
      );
      this.logger.debug(
        `'${
          Object.entries(this.navigationRequestSubscriberDictionary).length
        }' subscribers on 'Changes'.`
      );

      return false;
    }
  };

  async onStarting() {
    return createResponse(true, ResponseStateEnumeration.OK, []);
  }

  async onStopping() {
    return createResponse(true, ResponseStateEnumeration.OK, []);
  }

  processNavigationRequest(navigationRequest) {
    Object.values(this.navigationRequestSubscriberDictionary).forEach(
      (callback) => callback(navigationRequest)
    );
    this.archiveNavigationRequest(navigationRequest);
    this.updateVersion(
      `Navigation request has been added [${navigationRequest.key}, ${navigationRequest.type}]`
    );
  }

  archiveNavigationRequest(navigationRequest) {
    this.history.unshift(navigationRequest);
    if (this.history.length > this.historyOverflowLimit) {
      this.history.pop();
    }
  }
}
