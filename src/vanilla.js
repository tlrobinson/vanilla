"use strict";

const _ = require("underscore");

const VanillaCommon = {
  raw() {
    return JSON.parse(JSON.stringify(this));
  },

  equals(other) {
    return other === this || (other && _.isEqual(other.raw(), this.raw()));
  },

  clone() {
    return new this.constructor(this, this._parser, this._parent, this._key);
  },
  parse(raw, key = null, WrapperClass = null) {
    return this._parser.parse(raw, this._meta, this, key, WrapperClass);
  },

  parent() {
    if (this._parent) {
      if (this.equals(this._parent[this._key])) {
        return this._parent;
      } else {
        return this._parent._set(this._key, this);
      }
    }
    return null;
  },
  root() {
    if (this._parent) {
      return this.parent().root();
    } else {
      return this;
    }
  },

  // add([key ,] value): adds child
  add(...args) {
    return this._add(...args);
  },
  // remove(): removes from parent
  // remove(key): removes child
  remove(...args) {
    if (args.length === 0) {
      return this._parent._remove(this._key);
    } else if (args.length === 1) {
      const [key] = args;
      return this._remove(key);
    }
  },
  // set(key, value): sets a child property
  set(key, value) {
    return this._set(key, this.parse(value, key));
  },
  // replace(value): replaces itself in parent
  replace(value) {
    return this._parent._set(this._key, this._parent.parse(value, this._key));
  },

  // UTILS
  private(key, value) {
    // this prevents properties from being serialized
    Object.defineProperty(this, key, { value: value, enumerable: false });
  },
  freeze() {
    return Object.freeze(this);
  },
};

class VanillaObject {
  constructor(raw, parser, parent, key, meta) {
    Object.assign(this, raw);
    this.private("_parser", parser);
    this.private("_parent", parent);
    this.private("_key", key);
    this.private("_meta", meta);
  }

  _set(key, value) {
    const object = this.clone();
    object[key] = this.parse(value, key);
    return object.freeze();
  }
  _add(key, value) {
    return this._set(key, value);
  }
  _remove(key) {
    const object = this.clone();
    delete object[key];
    return object.freeze();
  }
}
Object.assign(VanillaObject.prototype, VanillaCommon);

class VanillaArray extends Array {
  constructor(raw, parser, parent, key, meta) {
    if (typeof raw === "number") {
      super(raw);
    } else {
      super(raw ? raw.length : 0);
      Object.assign(this, raw);
    }
    this.private("_parser", parser);
    this.private("_parent", parent);
    this.private("_key", key);
    this.private("_meta", meta);
  }

  _set(key, value) {
    const array = this.clone();
    array[key] = this.parse(value, key);
    return array.freeze();
  }
  _add(value) {
    const array = this.clone();
    array.push(this.parse(value, array.length));
    return array.freeze();
  }
  _remove(index) {
    const array = this.clone();
    array.splice(index, 1);
    return array.freeze();
  }
}
Object.assign(VanillaArray.prototype, VanillaCommon);

class VanillaParser {
  constructor(
    defaultObjectClass = VanillaObject,
    defaultArrayClass = VanillaArray,
  ) {
    this._defaultObjectClass = defaultObjectClass;
    this._defaultArrayClass = defaultArrayClass;
  }

  parse(raw, meta, parent, key, WrapperClass) {
    if (typeof raw === "object" && raw != null) {
      WrapperClass = WrapperClass || this.getClass(raw, parent, key);
      const object = new WrapperClass(null, this, parent, key, meta);

      const parseChild =
        typeof object.parse === "function"
          ? (value, key) => object.parse(value, key)
          : (value, key) => this.parse(value, meta, object, key);

      if (Array.isArray(raw)) {
        for (let key = 0; key < raw.length; key++) {
          const value = raw[key];
          object[key] = parseChild(value, key);
        }
      } else {
        for (const key in raw) {
          const value = raw[key];
          object[key] = parseChild(value, key);
        }
      }

      return Object.freeze(object);
    }
    return raw;
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

module.exports = new VanillaParser();
module.exports.VanillaParser = VanillaParser;
module.exports.VanillaArray = VanillaArray;
module.exports.VanillaObject = VanillaObject;
module.exports.VanillaCommon = VanillaCommon;
