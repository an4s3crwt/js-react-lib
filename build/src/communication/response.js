import { LocalizableContent } from './../i18n';
export const ResponseStateEnumeration = {
  Unknown: 0,
  OK: 1,
  Error: 2
};
export class ResponseMessage {
  constructor(display, context, logText = undefined) {
    // Ensure that display is a LocalizableContent instance.
    this.display = display instanceof LocalizableContent ? display : new LocalizableContent(display.key, display.value, display.keyNamespace, display.dynamicValueDictionary);
    this.context = context;
    this.logText = logText;
  }
}
export const createResponse = (payload, state = ResponseStateEnumeration.OK, messageStack = []) => {
  return {
    state: state,
    messageStack: messageStack,
    payload: payload
  };
};