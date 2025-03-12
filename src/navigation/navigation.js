// Enumeración de tipos de navegación
export const NavigationTypeEnumeration = {
  View: "View",
  Dialog: "Dialog",
};

// Clase para representar un elemento de navegación
export class NavigationElementBase {
  constructor(importPath, type = NavigationTypeEnumeration.View) {
    this.importPath = importPath;
    this.type = type;
  }
}

// Clase para representar una solicitud de navegación
export class NavigationRequest {
  constructor(key, type, url = "", timeStamp) {
    this.key = key;
    this.type = type;
    this.url = url;
    this.timeStamp = timeStamp;
  }
}
