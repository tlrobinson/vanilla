"use strict";

import VanillaInstance, {
  VanillaKey,
  VanillaMeta,
  VanillaClass
} from "./VanillaInstance";
import VanillaObject from "./VanillaObject";
import VanillaArray from "./VanillaArray";

export default class VanillaParser {
  _defaultObjectClass: VanillaClass;
  _defaultArrayClass: VanillaClass;
  _lazy: boolean;

  constructor(
    defaultObjectClass = VanillaObject,
    defaultArrayClass = VanillaArray,
    lazy = true
  ) {
    this._defaultObjectClass = defaultObjectClass;
    this._defaultArrayClass = defaultArrayClass;
    this._lazy = lazy;
  }

  parse(
    raw: any,
    meta: VanillaMeta = null,
    parent: VanillaInstance = null,
    key: VanillaKey = null,
    WrapperClass: VanillaClass = null
  ) {
    if (raw && typeof raw === "object") {
      WrapperClass = WrapperClass || this.getClass(raw, parent, key);
      const object = new WrapperClass(raw, this, parent, key, meta);
      return Object.freeze(object);
    }
    return raw;
  }

  parseChildren(object: VanillaInstance | any, raw: any, meta: VanillaMeta) {
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

  parseChild(
    object: VanillaInstance | any,
    raw: any,
    meta: VanillaMeta,
    key: VanillaKey | null
  ) {
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
        }
      });
    } else {
      object[key] = parser._parseChild(object, raw, meta, key);
    }
  }

  _parseChild(
    object: VanillaInstance | any,
    raw: any,
    meta: VanillaMeta,
    key: VanillaKey | null
  ) {
    const value = raw[key];
    return typeof object.parse === "function"
      ? object.parse(value, key)
      : this.parse(value, meta, object, key);
  }

  getClass(raw: any, parent: VanillaInstance, key: VanillaKey) {
    const WrapperClass =
      // @ts-ignore
      parent && parent.getChildClass && parent.getChildClass(raw, key);
    if (WrapperClass) {
      return WrapperClass;
    }
    return Array.isArray(raw)
      ? this._defaultArrayClass
      : this._defaultObjectClass;
  }
}
