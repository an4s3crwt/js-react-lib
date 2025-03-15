import { Service } from './abstractions';
import { ServiceKeys } from './serviceKeys';
import { NavigationService } from './crosscutting/navigationService';
import { RESTService } from './crosscutting/restService';


export const ServiceDictionary = {
  [ServiceKeys.NavigationService]: new NavigationService(ServiceKeys.NavigationService),
  [ServiceKeys.RESTService]: new RESTService(ServiceKeys.RESTService)
};