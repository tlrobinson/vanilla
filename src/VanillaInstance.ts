import * as _ from "underscore";
import VanillaParser from "./VanillaParser";

export type VanillaKey = string | number;
export type VanillaMeta = any;
export type VanillaClass = any;

abstract class VanillaInstance {
  _parser: VanillaParser;
  _parent: VanillaInstance;
  _key: VanillaKey;
  _meta: VanillaMeta;

  abstract _set(key: VanillaKey, value: any): VanillaInstance;
  abstract _add(value: any): VanillaInstance;
  abstract _remove(key: VanillaKey): VanillaInstance;

  // getChildClass?: (raw: any, key: VanillaKey) => VanillaClass | null;

  raw(): any {
    return JSON.parse(JSON.stringify(this));
  }

  equals(other: VanillaInstance): boolean {
    return other === this || (other && _.isEqual(other.raw(), this.raw()));
  }

  clone(): VanillaInstance {
    // @ts-ignore
    return new this.constructor(
      this,
      this._parser,
      this._parent,
      this._key,
      this._meta
    );
  }

  parse(
    raw: any,
    key: VanillaKey | null = null,
    WrapperClass: VanillaClass = null
  ): VanillaInstance {
    return this._parser.parse(raw, this._meta, this, key, WrapperClass);
  }

  parent(): VanillaInstance | null {
    if (this._parent) {
      if (this.equals(this._parent[this._key])) {
        return this._parent;
      } else {
        return this._parent._set(this._key, this);
      }
    }
    return null;
  }

  root(): VanillaInstance {
    if (this._parent) {
      return this.parent().root();
    } else {
      return this;
    }
  }

  // MUTATION METHODS

  // set(key, value): sets a child property
  set(key: VanillaKey, value: any): VanillaInstance {
    return this._set(key, this.parse(value, key));
  }

  // replace(value): replaces itself in parent
  replace(value: any): VanillaInstance {
    if (this._parent && this._key !== undefined) {
      return this._parent._set(
        this._key,
        this._parent.parse(value, this._key, this.constructor)
      );
    } else {
      throw new Error("Can't replace node without a parent and key");
    }
  }

  // TODO: better name?
  _replace(value: any): VanillaInstance {
    if (this._parent) {
      return this._parent.parse(value, this._key, this.constructor);
    } else {
      return this._parser.parse(
        value,
        this._meta,
        this._parent,
        this._key,
        this.constructor
      );
    }
  }

  // add(value): adds child
  add(value: any): VanillaInstance {
    return this._add(value);
  }

  // remove(): removes from parent
  // remove(key): removes child
  remove(...args: [] | [VanillaKey]): VanillaInstance {
    if (args.length === 0) {
      return this._parent._remove(this._key);
    } else if (args.length === 1) {
      const [key] = args;
      return this._remove(key);
    }
  }

  // UTILS
  private(key: string, value: any): void {
    // this prevents properties from being serialized
    Object.defineProperty(this, key, { value: value, enumerable: false });
  }

  freeze(): VanillaInstance {
    return Object.freeze(this);
  }

  // method for typesafe accessing of properties by key.
  // foo.bar is typechecked but foo["bar"] isn't?
  _safe<K extends keyof this>(key: K): this[K] {
    return this[key];
  }
}

export default VanillaInstance;
