import VanillaCommon from "./VanillaCommon";

export default class VanillaObject {
  constructor(raw, parser, parent, key, meta) {
    Object.assign(this, raw);
    Object.setPrototypeOf(this, new.target.prototype);
    this.private("_parser", parser);
    this.private("_parent", parent);
    this.private("_key", key);
    this.private("_meta", meta);
  }

  _set(key, value) {
    return this._replace({
      ...this,
      [key]: value
    });
  }
  _remove(key) {
    const copy = { ...this };
    delete copy[key];
    return this._replace(copy);
  }
}
Object.assign(VanillaObject.prototype, VanillaCommon);
