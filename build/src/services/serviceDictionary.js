import { Service } from './abstractions';
import { NavigationService } from './crosscutting/navigationService';
import { RESTService } from './crosscutting/restService';
import { ServiceKeys } from './serviceKeys';
export const ServiceDictionary = {
  [ServiceKeys.NavigationService]: new NavigationService(ServiceKeys.NavigationService),
  [ServiceKeys.RESTService]: new RESTService(ServiceKeys.RESTService)
};