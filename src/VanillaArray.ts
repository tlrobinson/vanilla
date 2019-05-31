import VanillaCommon from "./VanillaCommon";

export default class VanillaArray extends Array {
  constructor(raw, parser, parent, key, meta) {
    if (typeof raw === "number") {
      super(raw);
    } else {
      super(raw ? raw.length : 0);
      Object.assign(this, raw);
    }
    Object.setPrototypeOf(this, new.target.prototype);
    this.private("_parser", parser);
    this.private("_parent", parent);
    this.private("_key", key);
    this.private("_meta", meta);
  }

  _set(key, value) {
    return this._replace([
      ...this.slice(0, key),
      value,
      ...this.slice(key + 1)
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
