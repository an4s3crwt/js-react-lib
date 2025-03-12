export const LocalizationNamespaces = {
  System: "system",
  Notifications: "notifications",
  UIComponents: "uicomponents"
};
export class LocalizableContent {
  constructor(key, value, keyNamespace = null, dynamicValueDictionary = undefined) {
    this.key = key;
    this.keyNamespace = keyNamespace;
    this.value = value;
    this.dynamicValueDictionary = dynamicValueDictionary;
  }
}
export const localize = content => {
  return content.value;
};