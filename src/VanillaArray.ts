import VanillaInstance, { VanillaKey, VanillaMeta } from "./VanillaInstance";
import VanillaParser from "./VanillaParser";

// inherits from array
export default class VanillaArray extends Array implements VanillaInstance {
  _parser: VanillaParser;
  _parent: VanillaInstance;
  _key: VanillaKey;
  _meta: VanillaMeta;

  // NOTE: TypeScript doesn't really support mixins so we have to duplicate these here
  raw: () => any;
  equals: (other: VanillaInstance) => boolean;
  clone: () => VanillaInstance;
  parse: (
    raw: any,
    key: VanillaKey,
    WrapperClass: VanillaInstance
  ) => VanillaInstance;
  parent: () => VanillaInstance;
  root: () => VanillaInstance;
  set: (key: VanillaKey, value: any) => VanillaInstance;
  replace: (value: any) => VanillaInstance;
  _replace: (value: any) => VanillaInstance;
  add: (value: any) => VanillaInstance;
  remove: (...args: [] | [VanillaKey]) => VanillaInstance;
  private: (key: string, value: any) => void;
  freeze: () => VanillaInstance;
  _safe: <K extends keyof this>(key: K) => this[K];

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

    Object.setPrototypeOf(this, new.target.prototype);
    this.private("_parser", parser || new.target.getDefaultParser());
    this.private("_parent", parent);
    this.private("_key", key);
    this.private("_meta", meta);

    this._parser.parseChildren(this, raw, meta);
  }

  _set(key: number, value: any): VanillaInstance {
    return this._replace([
      ...this.slice(0, key),
      value,
      ...this.slice(key + 1)
    ]);
  }
  _add(value: any): VanillaInstance {
    return this._replace([...this, value]);
  }
  _remove(key: number): VanillaInstance {
    return this._replace([...this.slice(0, key), ...this.slice(key + 1)]);
  }
}

Object.assign(VanillaArray.prototype, VanillaInstance.prototype);
