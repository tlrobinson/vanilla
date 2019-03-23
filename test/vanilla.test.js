const {
  VanillaParser,
  VanillaArray,
  VanillaObject,
} = require("../src/vanilla");

const _ = require("underscore");

const ORIGINAL = { foo: [{ bar: 123 }, { baz: 234 }] };

describe("Vanilla parser", () => {
  for (const lazy of [true, false]) {
    describe(`${lazy ? "lazy" : "eager"} mode`, () => {
      const Vanilla = new VanillaParser(VanillaObject, VanillaArray, lazy);
      describe("parse", () => {
        it(`should ${lazy ? "" : "not "}be lazy`, () => {
          const parser = parserWithCounters(lazy);
          const o = parser.parse({ foo: { bar: { baz: { buz: "buz" } } } });
          expect(parser.objects).toEqual(lazy ? 1 : 4);
          o.foo;
          expect(parser.objects).toEqual(lazy ? 2 : 4);
          o.foo.bar;
          expect(parser.objects).toEqual(lazy ? 3 : 4);
          o.foo.bar.baz;
          expect(parser.objects).toEqual(4);
        });

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

        it("should have numeric _key for arrays", () => {
          expect(Vanilla.parse([{ foo: "bar" }])[0]._key).toBe(0);
        });

        xit("should work with conflicting keys", () => {
          const q = Vanilla.parse({ foo: { parent: [] } });
          expect(
            q.foo.parent
              .replace([1, 2, 3])
              .root()
              .raw(),
          ).toEqual({ foo: { parent: [1, 2, 3] } });
        });

        it("should work with _.isEqual", () => {
          expect(
            _.isEqual(Vanilla.parse(ORIGINAL), Vanilla.parse(ORIGINAL)),
          ).toBe(true);
          expect(_.isEqual(Vanilla.parse(ORIGINAL), Vanilla.parse({}))).toBe(
            false,
          );
        });

        it("should return same parsed child properties each time", () => {
          const p = Vanilla.parse(ORIGINAL);
          expect(p.foo).toBe(p.foo);
        });
      });

      describe("parent", () => {
        it("shouldn't create a new wrapper if the child hasn't been modified", () => {
          const o = Vanilla.parse(ORIGINAL);
          expect(o.foo.parent()).toBe(o);
        });
        it("should create a new wrapper if the child has been modified", () => {
          const o = Vanilla.parse(ORIGINAL);
          const oo = o.foo.add("x").parent();
          expect(oo).not.toBe(o);
          expect(oo.raw()).toEqual({ foo: [{ bar: 123 }, { baz: 234 }, "x"] });
        });
      });

      describe("root", () => {
        it("shouldn't create a new wrapper if the child hasn't been modified", () => {
          const o = Vanilla.parse(ORIGINAL);
          expect(o.foo[0].root()).toBe(o);
        });
        it("should create a new wrapper if the child has been modified", () => {
          const o = Vanilla.parse(ORIGINAL);
          const oo = o.foo[0].set("x", "y").root();
          expect(oo).not.toBe(o);
          expect(oo.raw()).toEqual({
            foo: [{ bar: 123, x: "y" }, { baz: 234 }],
          });
        });
      });

      describe("raw", () => {
        it("should serialize to plain JavaScript objects", () => {
          const o = Vanilla.parse(ORIGINAL);
          expect(o.raw()).toEqual(ORIGINAL);
        });
      });

      describe("set", () => {
        it("should set a child clause", () => {
          const o = Vanilla.parse(ORIGINAL);
          const oo = o.foo.set(1, { baz: 42 }).root();
          expect(oo).toBeInstanceOf(VanillaObject);
          expect(oo.foo).toBeInstanceOf(VanillaArray);
          expect(oo.foo[0]).toBeInstanceOf(VanillaObject);
          expect(oo.foo[1]).toBeInstanceOf(VanillaObject);
          expect(oo.raw()).toEqual({ foo: [{ bar: 123 }, { baz: 42 }] });
        });

        it("should not mutate existing tree", () => {
          const o = Vanilla.parse({ foo: ["bar"], baz: ["buz"] });
          const oo = o.foo.set(0, "BAR").root();
          expect(o.raw()).toEqual({ foo: ["bar"], baz: ["buz"] });
          expect(o.baz.root().raw()).toEqual({ foo: ["bar"], baz: ["buz"] });
        });
        it("should update sibling parents", () => {
          const o = Vanilla.parse({ foo: ["bar"], baz: ["buz"] });
          const oo = o.foo.set(0, "BAR").root();
          expect(oo.raw()).toEqual({ foo: ["BAR"], baz: ["buz"] });
          expect(oo.baz.root().raw()).toEqual({ foo: ["BAR"], baz: ["buz"] });
        });
      });

      describe("replace", () => {
        it("should not mutate the original", () => {
          const o = Vanilla.parse(ORIGINAL);
          const oo = o.foo[1].replace({ baz: 42 }).root();
          expect(o.raw()).toEqual(ORIGINAL);
        });
        it("should replace a clause in it's parent", () => {
          const o = Vanilla.parse(ORIGINAL);
          const oo = o.foo[1].replace({ baz: 42 }).root();
          expect(oo).toBeInstanceOf(VanillaObject);
          expect(oo.foo).toBeInstanceOf(VanillaArray);
          expect(oo.foo[0]).toBeInstanceOf(VanillaObject);
          expect(oo.foo[1]).toBeInstanceOf(VanillaObject);
          expect(oo.raw()).toEqual({ foo: [{ bar: 123 }, { baz: 42 }] });
        });
      });

      describe("add", () => {
        it("should add a value", () => {
          const o = Vanilla.parse({ foo: [{ bar: "bar" }] });
          const oo = o.foo.add({ buz: "buz" }).root();
          expect(oo.raw()).toEqual({ foo: [{ bar: "bar" }, { buz: "buz" }] });
        });

        it("should update sibling parents", () => {
          const o = Vanilla.parse({ foo: ["bar"], baz: ["buz"] });
          const oo = o.foo.add("BAR").root();
          expect(oo.raw()).toEqual({ foo: ["bar", "BAR"], baz: ["buz"] });
          expect(oo.baz.root().raw()).toEqual({
            foo: ["bar", "BAR"],
            baz: ["buz"],
          });
        });

        it("should not mutate existing tree", () => {
          const o = Vanilla.parse({ foo: ["bar"], baz: ["buz"] });
          const oo = o.foo.set(0, "BAR").root();
          expect(o.raw()).toEqual({ foo: ["bar"], baz: ["buz"] });
          expect(o.baz.root().raw()).toEqual({ foo: ["bar"], baz: ["buz"] });
        });
      });

      describe("remove", () => {
        it("should add a value", () => {
          const o = Vanilla.parse({ foo: [{ bar: "bar" }] });
          const oo = o.foo.add({ buz: "buz" }).root();
          expect(oo.raw()).toEqual({ foo: [{ bar: "bar" }, { buz: "buz" }] });
        });

        it("should update sibling parents", () => {
          const o = Vanilla.parse({ foo: ["bar"], baz: ["buz"] });
          const oo = o.foo.add("BAR").root();
          expect(oo.raw()).toEqual({ foo: ["bar", "BAR"], baz: ["buz"] });
          expect(oo.baz.root().raw()).toEqual({
            foo: ["bar", "BAR"],
            baz: ["buz"],
          });
        });

        it("should not mutate existing tree", () => {
          const o = Vanilla.parse({ foo: ["bar"], baz: ["buz"] });
          const oo = o.foo.set(0, "BAR").root();
          expect(o.raw()).toEqual({ foo: ["bar"], baz: ["buz"] });
          expect(o.baz.root().raw()).toEqual({ foo: ["bar"], baz: ["buz"] });
        });
      });
    });
  }
});

function parserWithCounters(lazy) {
  class TestObject extends VanillaObject {
    constructor(...args) {
      super(...args);
      parser.objects++;
    }
  }
  class TestArray extends VanillaArray {
    constructor(...args) {
      super(...args);
      parser.arrays++;
    }
  }
  const parser = new VanillaParser(TestObject, VanillaArray, lazy);
  parser.objects = 0;
  parser.arrays = 0;
  return parser;
}
