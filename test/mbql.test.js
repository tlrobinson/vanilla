const MBQL = require("../mbql");
const { Query } = MBQL;

const ORIGINAL_QUERY = { aggregation: [["sum", ["field-id", 1]]] };

describe("MBQL Vanilla parser", () => {
  describe("displayName", () => {
    it("should format `datetime-field` with `fk->`", () => {
      const f = MBQL.parse([
        "datetime-field",
        ["fk->", ["field-id", 1], ["field-id", 2]],
        "month",
      ]);
      expect(f.displayName()).toBe("Field1 → Field2: Month");
    });
    it("should format `order-by`s on `aggregation` references", () => {
      const q = MBQL.parseQuery({
        aggregation: [["sum", ["field-id", 1]]],
        "order-by": [["asc", ["aggregation", 0]]],
      });
      expect(q["order-by"][0].displayName()).toBe("Sum of Field1: Ascending");
    });
    it("should format `named` aggregations", () => {
      const q = MBQL.parseQuery({
        aggregation: [["named", ["+", ["sum", ["field-id", 1]]], "Foo"]],
      });
      expect(q["aggregation"][0].displayName()).toBe("Foo");
    });
  });

  describe("parseQuery", () => {
    it("should parse into wrapper classes", () => {
      const q = MBQL.parseQuery(ORIGINAL_QUERY);
      expect(q).toBeInstanceOf(Query);
      expect(q.aggregation).toBeInstanceOf(MBQL.QUERY_CLAUSES["aggregation"]);
      expect(q.aggregation[0]).toBeInstanceOf(MBQL.CLAUSES["sum"]);
    });

    it("should serialize to JSON", () => {
      const q = MBQL.parseQuery(ORIGINAL_QUERY);
      expect(JSON.stringify(q)).toEqual(JSON.stringify(ORIGINAL_QUERY));
    });
  });

  describe("raw", () => {
    it("should serialize to plain JavaScript objects", () => {
      const q = MBQL.parseQuery(ORIGINAL_QUERY);
      expect(q.raw()).toEqual(ORIGINAL_QUERY);
    });
  });

  describe("replace", () => {
    it("should replace a clause", () => {
      const q = MBQL.parseQuery(ORIGINAL_QUERY);
      const qq = q.aggregation[0].replace(["count"]).query();
      expect(qq.aggregation[0]).toBeInstanceOf(MBQL.CLAUSES["count"]);
      expect(qq.raw()).toEqual({ aggregation: [["count"]] });
    });
  });
});
