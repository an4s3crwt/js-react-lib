import { LocalizableContent } from './../i18n';
class SelectableBase {
  constructor(display, description = null, key, isVisible = true) {
    if (!(display instanceof LocalizableContent)) {
      throw new Error("display must be an instance of LocalizableContent");
    }
    this.display = display;
    this.description = description;
    this.key = key;
    this.isVisible = isVisible;
  }
}
class SelectableValue {
  constructor(display, description, key, value, isVisible = true) {
    // Ensure display and description are instances of LocalizableContent
    if (!(display instanceof LocalizableContent)) {
      throw new Error("display must be an instance of LocalizableContent");
    }
    if (description && !(description instanceof LocalizableContent)) {
      throw new Error("description must be an instance of LocalizableContent");
    }
    this.display = display;
    this.description = description;
    this.key = key;
    this.value = value;
    this.isVisible = isVisible;
  }
}
export { SelectableBase, SelectableValue };