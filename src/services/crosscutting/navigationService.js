import { Service } from '../abstractions'; // Assuming Service class is already defined
import { createResponse, ResponseStateEnumeration } from './../../communication';
import { NavigationTypeEnumeration, NavigationRequest } from '../../navigation';
import { LocalizationNamespaces } from '../../i18n';

// Define NavigationRequestCallbackMethod type
const NavigationRequestCallbackMethod = (navigationRequest) => {};

// Dictionary to store subscribers
const navigationRequestSubscriberDictionary = {};
let navigationRequestSubscriptionCounter = 0;

// NavigationService class
class NavigationService extends Service {
  constructor(key) {
    super(key);

    // Properties
    this.history = [];
    this.navigationRequestSubscriberDictionary = {};
    this.navigationRequestSubscriptionCounter = 0;
    this.historyOverflowLimit = 2000;

    // Display and description
    this.display = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'services.navigationservice.display',
      value: 'Navigation Service'
    };

    this.description = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'services.navigationservice.description',
      value: 'Provides all interaction options for UI navigation.'
    };
  }

  // show method
  show(navigationData, url = '') {
    const navigationRequest = {
      key: navigationData.key,
      type: navigationData.type || NavigationTypeEnumeration.View,
      url: url,
      timeStamp: Date.now()
    };

    this.processNavigationRequest(navigationRequest);
  }

  // onNavigationRequest method
  onNavigationRequest(contextKey, callbackHandler) {
    // Setup register key
    navigationRequestSubscriptionCounter++;
    const registerKey = `${contextKey}_${navigationRequestSubscriptionCounter}`;

    // Register callback
    navigationRequestSubscriberDictionary[registerKey] = callbackHandler;
    this.logger.debug(`Component with key '${registerKey}' has subscribed to 'NavigationRequest'.`);
    this.logger.debug(`'${Object.entries(navigationRequestSubscriberDictionary).length}' subscribers on 'Changes'.`);

    return registerKey;
  }

  // offNavigationRequest method
  offNavigationRequest(registerKey) {
    // Delete callback
    const existingSubscriber = Object.entries(navigationRequestSubscriberDictionary).find(([key, value]) => key === registerKey);
    if (existingSubscriber) {
      delete navigationRequestSubscriberDictionary[registerKey];
      this.logger.debug(`Component with key '${registerKey}' has unsubscribed from 'Changes'.`);
      this.logger.debug(`'${Object.entries(navigationRequestSubscriberDictionary).length}' subscribers on 'Changes'.`);
      return true;
    } else {
      this.logger.error(`Component with key '${registerKey}' not registered on 'Changes'.`);
      this.logger.debug(`'${Object.entries(navigationRequestSubscriberDictionary).length}' subscribers on 'Changes'.`);
      return false;
    }
  }

  // onStarting method
  async onStarting() {
    return createResponse(true, ResponseStateEnumeration.OK, []);
  }

  // onStopping method
  async onStopping() {
    return createResponse(true, ResponseStateEnumeration.OK, []);
  }

  // Private method to process navigation request
  processNavigationRequest(navigationRequest) {
    // Execute callbacks
    Object.entries(navigationRequestSubscriberDictionary).forEach(([key, value]) => value(navigationRequest));

    // Archive navigation request
    this.archiveNavigationRequest(navigationRequest);

    // Increase service version
    this.updateVersion(`Navigation request has been added [${navigationRequest.key}, ${navigationRequest.type}]`);
  }

  // Private method to archive navigation request
  archiveNavigationRequest(navigationRequest) {
    // Add navigation request
    this.history.unshift(navigationRequest);

    if (this.history.length > this.historyOverflowLimit) {
      this.history.pop();
    }
  }
}

export { NavigationService };
