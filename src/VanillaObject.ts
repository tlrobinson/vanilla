import VanillaInstance, { VanillaKey, VanillaMeta } from "./VanillaInstance";
import VanillaParser from "./VanillaParser";

export default class VanillaObject extends VanillaInstance {
  static getDefaultParser() {
    return new VanillaParser();
  }

  constructor(
    raw: any,
    parser: VanillaParser = null,
    parent: VanillaInstance = null,
    key: VanillaKey = null,
    meta: VanillaMeta = null
  ) {
    super();

    this.private("_parser", parser || new.target.getDefaultParser());
    this.private("_parent", parent);
    this.private("_key", key);
    this.private("_meta", meta);

    return this._parser.parseChildren(this, raw, meta);
  }

  _set(key: VanillaKey, value: any) {
    return this._replace({
      ...this,
      [key]: value
    });
  }
  _add(value: any): VanillaInstance {
    throw new Error("VanillaObject does not support add()");
  }
  _remove(key: VanillaKey) {
    const copy = { ...this };
    delete copy[key];
    return this._replace(copy);
  }
}
