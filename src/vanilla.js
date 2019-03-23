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
    return new this.constructor(
      this,
      this._parser,
      this._parent,
      this._key,
      this._meta,
    );
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

  // MUTATION METHODS

  // set(key, value): sets a child property
  set(key, value) {
    return this._set(key, this.parse(value, key));
  },
  // replace(value): replaces itself in parent
  replace(value) {
    if (this._parent && this._key !== undefined) {
      return this._parent._set(
        this._key,
        this._parent.parse(value, this._key, this.constructor),
      );
    } else {
      throw new Error("Can't replace node without a parent");
    }
  },
  // TODO: better name?
  _replace(value) {
    if (this._parent) {
      return this._parent.parse(value, this._key, this.constructor);
    } else {
      return this._parser.parse(
        value,
        this._meta,
        this._parent,
        this._key,
        this.constructor,
      );
    }
  },
  // add(value): adds child
  add(value) {
    return this._add(value);
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
    return this._replace({
      ...this,
      [key]: value,
    });
  }
  _remove(key) {
    const copy = { ...this };
    delete copy[key];
    return this._replace(copy);
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
    return this._replace([
      ...this.slice(0, key),
      value,
      ...this.slice(key + 1),
    ]);
  }
  _add(value) {
    return this._replace([...this, value]);
  }
  _remove(key) {
    return this._replace([...this.slice(0, key), ...this.slice(key + 1)]);
  }
}
Object.assign(VanillaArray.prototype, VanillaCommon);

const LAZY = typeof Object.defineProperty === "function";

class VanillaParser {
  constructor(
    defaultObjectClass = VanillaObject,
    defaultArrayClass = VanillaArray,
    lazy = LAZY,
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

module.exports = new VanillaParser();
module.exports.VanillaParser = VanillaParser;
module.exports.VanillaArray = VanillaArray;
module.exports.VanillaObject = VanillaObject;
module.exports.VanillaCommon = VanillaCommon;
