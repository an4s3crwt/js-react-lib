import { SelectableBase } from './../selection'; // Assuming SelectableBase class is already exported

// Enum for Navigation Types
const NavigationTypeEnumeration = {
  View: 0,
  Dialog: 1
};

// Base class for navigation elements, extending SelectableBase
class NavigationElementBase extends SelectableBase {
  constructor(importPath, type = NavigationTypeEnumeration.View, display, description, key, isVisible = true) {
    super(display, description, key, isVisible);
    this.importPath = importPath;
    this.type = type;
  }
}

// Navigation request class
class NavigationRequest {
  constructor(key, type, url = '', timeStamp) {
    this.key = key;
    this.type = type;
    this.url = url;
    this.timeStamp = timeStamp;
  }
}

export { NavigationTypeEnumeration, NavigationElementBase, NavigationRequest };
