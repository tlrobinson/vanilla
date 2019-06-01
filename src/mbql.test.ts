import MBQL, { Query, MBQL_CLAUSES, QUERY_CLAUSES } from "./mbql";

const ORIGINAL_QUERY = { aggregation: [["sum", ["field-id", 1]]] };

const metadata = {
  fields: {
    1: { displayName: () => "Hello" },
    2: { displayName: () => "World" }
  },
  tables: {
    1: { displayName: () => "Foo" }
  },
  field: id => metadata.fields[id],
  table: id => metadata.tables[id]
};

describe("MBQL Vanilla parser", () => {
  describe("displayName", () => {
    it("should format `datetime-field` with `fk->`", () => {
      const f = MBQL.parse(
        ["datetime-field", ["fk->", ["field-id", 1], ["field-id", 2]], "month"],
        { metadata }
      );
      expect(f.displayName()).toBe("Hello → World: Month");
    });
    it("should format `order-by`s on `aggregation` references", () => {
      const q = MBQL.parseQuery(
        {
          aggregation: [["sum", ["field-id", 1]]],
          "order-by": [["asc", ["aggregation", 0]]]
        },
        { metadata }
      );
      expect(q["order-by"][0].displayName()).toBe("Sum of Hello: Ascending");
    });
    it("should format `named` aggregations", () => {
      const q = MBQL.parseQuery(
        {
          aggregation: [["named", ["+", ["sum", ["field-id", 1]]], "Foo"]]
        },
        { metadata }
      );
      expect(q["aggregation"][0].displayName()).toBe("Foo");
    });
  });

  describe("parseQuery", () => {
    it("should parse into wrapper classes", () => {
      const q = MBQL.parseQuery(ORIGINAL_QUERY);
      expect(q).toBeInstanceOf(Query);
      expect(q.aggregation).toBeInstanceOf(QUERY_CLAUSES["aggregation"]);
      expect(q.aggregation[0]).toBeInstanceOf(MBQL_CLAUSES["sum"]);
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
      expect(qq.aggregation[0]).toBeInstanceOf(MBQL_CLAUSES["count"]);
      expect(qq.raw()).toEqual({ aggregation: [["count"]] });
    });
  });

  describe("Query", () => {
    describe("parse", () => {
      it("should inherit the query", () => {
        const q = MBQL.parseQuery({ aggregation: [["count"]] });
        const a = q.parse(["aggregation", 0]);
        expect(a.displayName()).toEqual("Count");
      });
    });

    describe("filters()", () => {
      let q1, q2, q3, q4;
      beforeAll(() => {
        q1 = MBQL.parseQuery({});
        q2 = MBQL.parseQuery({ filter: ["segment", 1] });
        q3 = MBQL.parseQuery({
          filter: ["and", ["segment", 1]]
        });
        q4 = MBQL.parseQuery({
          filter: ["and", ["segment", 1], ["segment", 2]]
        });
      });

      it("should return a list of filters of correct length", () => {
        expect(q1.filters()).toHaveLength(0);
        expect(q2.filters()).toHaveLength(1);
        expect(q3.filters()).toHaveLength(1);
        expect(q4.filters()).toHaveLength(2);
      });
      it("should add new filter correctly", () => {
        expect(
          q1
            .filters()
            .add(["segment", 3])
            .query()
            .raw()
        ).toEqual({ filter: ["segment", 3] });
        expect(
          q2
            .filters()
            .add(["segment", 3])
            .query()
            .raw()
        ).toEqual({
          filter: ["and", ["segment", 1], ["segment", 3]]
        });
        expect(
          q3
            .filters()
            .add(["segment", 3])
            .query()
            .raw()
        ).toEqual({
          filter: ["and", ["segment", 1], ["segment", 3]]
        });
        expect(
          q4
            .filters()
            .add(["segment", 3])
            .query()
            .raw()
        ).toEqual({
          filter: ["and", ["segment", 1], ["segment", 2], ["segment", 3]]
        });
      });
      it("should replace filter correctly", () => {
        expect(
          q2
            .filters()[0]
            .replace(["segment", 3])
            .query()
            .raw()
        ).toEqual({
          filter: ["segment", 3]
        });
        expect(
          q3
            .filters()[0]
            .replace(["segment", 3])
            .query()
            .raw()
        ).toEqual({
          filter: ["segment", 3]
        });
        expect(
          q4
            .filters()[0]
            .replace(["segment", 3])
            .query()
            .raw()
        ).toEqual({
          filter: ["and", ["segment", 3], ["segment", 2]]
        });
        expect(
          q4
            .filters()[1]
            .replace(["segment", 3])
            .query()
            .raw()
        ).toEqual({
          filter: ["and", ["segment", 1], ["segment", 3]]
        });
      });
    });

    describe("aggregations()", () => {
      it("should add and remove correctly", () => {
        const q1 = MBQL.parseQuery({});
        expect(q1.aggregations()).toHaveLength(0);
        expect(q1.raw()).toEqual({});
        const q2 = q1
          .aggregations()
          .add(["count"])
          .query();
        expect(q2.aggregations()).toHaveLength(1);
        expect(q2.aggregations()[0]).toBeInstanceOf(MBQL_CLAUSES["count"]);
        expect(q2.raw()).toEqual({ aggregation: [["count"]] });
        const q3 = q2
          .aggregations()[0]
          .remove()
          .query();
        expect(q3.aggregations()).toHaveLength(0);
        expect(q3.raw()).toEqual({});
      });
    });

    describe("breakouts()", () => {
      it("should add and remove correctly", () => {
        const q1 = MBQL.parseQuery({});
        expect(q1.breakouts()).toHaveLength(0);
        expect(q1.raw()).toEqual({});
        const q2 = q1
          .breakouts()
          .add(["field-id", 1])
          .query();
        expect(q2.breakouts()).toHaveLength(1);
        expect(q2.breakouts()[0]).toBeInstanceOf(MBQL_CLAUSES["field-id"]);
        expect(q2.raw()).toEqual({ breakout: [["field-id", 1]] });
        const q3 = q2
          .breakouts()[0]
          .remove()
          .query();
        expect(q3.breakouts()).toHaveLength(0);
        expect(q3.raw()).toEqual({});
      });
    });

    describe("sorts()", () => {
      it("should add and remove correctly", () => {
        const q1 = MBQL.parseQuery({});
        expect(q1.sorts()).toHaveLength(0);
        expect(q1.raw()).toEqual({});
        const q2 = q1
          .sorts()
          .add(["asc", ["aggregation", 0]])
          .query();
        expect(q2.sorts()).toHaveLength(1);
        expect(q2.sorts()[0]).toBeInstanceOf(MBQL_CLAUSES["asc"]);
        expect(q2.raw()).toEqual({ "order-by": [["asc", ["aggregation", 0]]] });
        const q3 = q2
          .sorts()[0]
          .remove()
          .query();
        expect(q3.sorts()).toHaveLength(0);
        expect(q3.raw()).toEqual({});
      });
    });

    describe("expressionList", () => {
      it("should add and remove correctly", () => {
        const q1 = MBQL.parseQuery({});
        expect(q1.expressionList()).toHaveLength(0);
        const q2 = q1
          .expressionList()
          .add(["foo", ["field-id", 1]])
          .query();
        expect(q2.expressionList()).toHaveLength(1);
        expect(q2.expressionList()[0].name()).toEqual("foo");
        expect(q2.raw()).toEqual({ expressions: { foo: ["field-id", 1] } });
        const q3 = q2
          .expressionList()[0]
          .remove()
          .query();
        expect(q3.expressionList()).toHaveLength(0);
        expect(q3.raw()).toEqual({});
      });
    });
  });

  describe("nested queries", () => {
    let q;
    beforeAll(() => {
      q = MBQL.parseQuery(
        {
          "source-query": {
            "source-query": {
              "source-table": 1,
              filter: ["and", ["segment", 1], ["segment", 2]]
            },
            filter: ["=", ["field-id", 1], 42]
          }
        },
        { metadata }
      );
    });

    it("queries", () => {
      const queries = q.queries();
      expect(queries).toHaveLength(3);
      expect(queries[0]["source-table"]).toBe(1);
      expect(queries.map(q => q.filters().length)).toEqual([2, 1, 0]);
    });

    it("rootQuery", () => {
      expect(q.rootQuery()["source-table"]).toBe(1);
    });
  });
});
