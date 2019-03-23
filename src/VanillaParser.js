"use strict";

const VanillaObject = require("./VanillaObject");
const VanillaArray = require("./VanillaArray");

class VanillaParser {
  constructor(
    defaultObjectClass = VanillaObject,
    defaultArrayClass = VanillaArray,
    lazy = true,
  ) {
    this._defaultObjectClass = defaultObjectClass;
    this._defaultArrayClass = defaultArrayClass;
    this._lazy = lazy;
  }

  parse(raw, meta, parent, key, WrapperClass) {
    if (typeof raw === "object" && raw != null) {
      WrapperClass = WrapperClass || this.getClass(raw, parent, key);
      const object = new WrapperClass(null, this, parent, key, meta);

      return Object.freeze(this.parseChildren(object, raw, meta));
    }
    return raw;
  }

  parseChildren(object, raw, meta) {
    if (Array.isArray(raw)) {
      for (let key = 0; key < raw.length; key++) {
        this.parseChild(object, raw, meta, key);
      }
    } else {
      for (const key in raw) {
        if (Object.prototype.hasOwnProperty.call(raw, key)) {
          this.parseChild(object, raw, meta, key);
        }
      }
    }
    return object;
  }

  parseChild(object, raw, meta, key) {
    const parser = this;
    if (this._lazy) {
      let isParsed = false;
      let parsed;
      Object.defineProperty(object, key, {
        configurable: false,
        enumerable: true,
        get() {
          if (!isParsed) {
            parsed = parser._parseChild(object, raw, meta, key);
            isParsed = true;
          }
          return parsed;
        },
      });
    } else {
      object[key] = parser._parseChild(object, raw, meta, key);
    }
  }

  _parseChild(object, raw, meta, key) {
    const value = raw[key];
    return typeof object.parse === "function"
      ? object.parse(value, key)
      : this.parse(value, meta, object, key);
  }

  getClass(raw, parent, key) {
    const WrapperClass =
      parent && parent.getChildClass && parent.getChildClass(raw, key);
    if (WrapperClass) {
      return WrapperClass;
    }
    return Array.isArray(raw)
      ? this._defaultArrayClass
      : this._defaultObjectClass;
  }
}

module.exports = VanillaParser;
