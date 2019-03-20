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
  // replace(value): // replaces in parent
  // replace(key, value): replaces child
  replace(...args) {
    if (args.length === 1) {
      const [value] = args;
      return this._parent._replace(
        this._key,
        this._parent.parse(value, this._key),
      );
    } else if (args.length === 2) {
      const [value, key] = args;
      return this._replace(key, this.parse(value, key));
    }
  },
  parent() {
    if (this._parent) {
      if (this.equals(this._parent[this._key])) {
        return this._parent;
      } else {
        return this._parent._replace(this._key, this);
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
  parse(raw, key = null) {
    return this._parser.parse(raw, this, key);
  },
  // utils
  private(key, value) {
    // this prevents properties from being serialized
    Object.defineProperty(this, key, { value: value, enumerable: false });
  },
  freeze() {
    return Object.freeze(this);
  },
};

class VanillaObject {
  constructor(object, parser, parent, key) {
    Object.assign(this || {}, object);
    this.private("_parser", parser);
    this.private("_parent", parent);
    this.private("_key", key);
  }

  _replace(key, value) {
    const object = this.clone();
    object[key] = value;
    return object.freeze();
  }
  _add(key, value) {
    return this._replace(key, value);
  }
  _remove(key) {
    const object = this.clone();
    delete object[key];
    return object.freeze();
  }
}
Object.assign(VanillaObject.prototype, VanillaCommon);

class VanillaArray extends Array {
  constructor(raw, parser, parent, key) {
    super(...(raw || []));
    this.private("_parser", parser);
    this.private("_parent", parent);
    this.private("_key", key);
  }

  _replace(key, value) {
    const array = this.clone();
    array[key] = value;
    return array.freeze();
  }
  _add(value) {
    const array = this.clone();
    array.push(value);
    return array.freeze();
  }
  // _remove() {
  //   // needs to update child keys
  // }
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

  parse(raw, parent, key, WrapperClass) {
    if (typeof raw === "object" && raw != null) {
      WrapperClass = WrapperClass || this.getClass(raw, parent, key);
      const object = new WrapperClass(null, this, parent, key);
      for (const key in raw) {
        const value = raw[key];
        object[key] = object.parse(value, key);
      }
      return object.freeze();
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
