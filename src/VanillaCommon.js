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

module.exports = VanillaCommon;
