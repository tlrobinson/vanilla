import VanillaInstance, { VanillaKey, VanillaMeta } from "./VanillaInstance";
import VanillaParser from "./VanillaParser";

export default class VanillaObject extends VanillaInstance {
  constructor(
    raw: any,
    parser: VanillaParser,
    parent: VanillaInstance,
    key: VanillaKey,
    meta: VanillaMeta = null
  ) {
    super();
    Object.assign(this, raw);
    this.private("_parser", parser);
    this.private("_parent", parent);
    this.private("_key", key);
    this.private("_meta", meta);
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
