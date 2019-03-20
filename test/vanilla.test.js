const Vanilla = require("../src/vanilla");
const { VanillaArray, VanillaObject } = Vanilla;

const ORIGINAL = { foo: [{ bar: 123 }, { baz: 234 }] };

describe("Default Vanilla parser", () => {
  describe("parse", () => {
    it("should freeze objects", () => {
      "use strict";
      const o = Vanilla.parse(ORIGINAL);
      expect(() => {
        o.foo = "bar";
      }).toThrow();
      expect(() => {
        o.foo[0] = "bar";
      }).toThrow();
    });

    it("should parse into wrapper classes", () => {
      const o = Vanilla.parse(ORIGINAL);
      expect(o).toBeInstanceOf(VanillaObject);
      expect(o.foo).toBeInstanceOf(VanillaArray);
      expect(o.foo[0]).toBeInstanceOf(VanillaObject);
      expect(o.foo[1]).toBeInstanceOf(VanillaObject);
    });

    it("should serialize to JSON", () => {
      const o = Vanilla.parse(ORIGINAL);
      expect(JSON.stringify(o)).toEqual(JSON.stringify(ORIGINAL));
    });
  });

  describe("raw", () => {
    it("should serialize to plain JavaScript objects", () => {
      const o = Vanilla.parse(ORIGINAL);
      expect(o.raw()).toEqual(ORIGINAL);
    });
  });

  describe("replace", () => {
    it("should replace a clause in it's parent", () => {
      const o = Vanilla.parse(ORIGINAL);
      const oo = o.foo[1].replace({ baz: 42 }).root();
      expect(oo).toBeInstanceOf(VanillaObject);
      expect(oo.foo).toBeInstanceOf(VanillaArray);
      expect(oo.foo[0]).toBeInstanceOf(VanillaObject);
      expect(oo.foo[1]).toBeInstanceOf(VanillaObject);
      expect(oo.raw()).toEqual({ foo: [{ bar: 123 }, { baz: 42 }] });
    });
    it("should replace a child clause", () => {
      const o = Vanilla.parse(ORIGINAL);
      const oo = o.foo.replace(1, { baz: 42 }).root();
      expect(oo).toBeInstanceOf(VanillaObject);
      expect(oo.foo).toBeInstanceOf(VanillaArray);
      expect(oo.foo[0]).toBeInstanceOf(VanillaObject);
      expect(oo.foo[1]).toBeInstanceOf(VanillaObject);
      expect(oo.raw()).toEqual({ foo: [{ bar: 123 }, { baz: 42 }] });
    });
    it("should not mutate the original", () => {
      const o = Vanilla.parse(ORIGINAL);
      const oo = o.foo[1].replace({ baz: 42 }).root();
      expect(o.raw()).toEqual(ORIGINAL);
    });
  });
});
