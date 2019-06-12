import * as t from "io-ts";

const DatabaseId = t.number;
const TableId = t.number;
const FieldId = t.number;
const ColumnName = t.string;
const BaseType = t.string; // TODO

const LocalFieldReference = t.tuple([t.literal("field-id"), FieldId]);
const FieldLiteralReference = t.tuple([
  t.literal("field-literal"),
  ColumnName,
  BaseType
]);
const ForeignFieldReference = t.tuple([
  t.literal("fk->"),
  LocalFieldReference,
  LocalFieldReference
]);

const ConcreteFieldReference = t.taggedUnion("0", [
  LocalFieldReference,
  FieldLiteralReference,
  ForeignFieldReference
]);

const Count = t.tuple([t.literal("count")]);
const Sum = t.tuple([t.literal("sum"), ConcreteFieldReference]);

const Aggregation = t.taggedUnion("0", [Count, Sum]);
const NamedAggregation = t.tuple([t.literal("named"), Aggregation, t.string]);

const QueryBase = t.partial({
  aggregation: t.array(t.taggedUnion("0", [Aggregation, NamedAggregation])),
  breakout: t.array(ConcreteFieldReference)
});

// interface Query extends t.TypeOf<typeof QueryBase> {
//   "source-table"?: t.TypeOf<typeof TableId>;
//   "source-query"?: Query;
// }
// const Query: t.Type<Query> = t.recursion("Query", () =>
//   t.intersection([
//     t.union([
//       t.type({
//         "source-query": Query
//       }),
//       t.type({
//         "source-table": TableId
//       })
//     ]),
//     QueryBase
//   ])
// );

interface QuerySourceQuery extends t.TypeOf<typeof QueryBase> {
  "source-query": t.TypeOf<typeof Query>;
}
const QuerySourceQuery: t.Type<QuerySourceQuery> = t.recursion(
  "QuerySourceQuery",
  () =>
    t.intersection([
      t.type({
        "source-query": Query
      }),
      QueryBase
    ])
);
const QuerySourceTable = t.intersection([
  t.type({
    "source-table": TableId
  }),
  QueryBase
]);
const Query = t.union([QuerySourceQuery, QuerySourceTable]);

export type IQuerySourceQuery = t.TypeOf<typeof QuerySourceQuery>;
export type IQuerySourceTable = t.TypeOf<typeof QuerySourceTable>;
// export type IQuery = t.TypeOf<typeof Query>;
export type IQuery = ExclusifyUnion<IQuerySourceQuery | IQuerySourceTable>;
export type IQueryBase = t.TypeOf<typeof QueryBase>;

export type IConcreteFieldReference = t.TypeOf<typeof ConcreteFieldReference>;
export type IForeignFieldReference = t.TypeOf<typeof ForeignFieldReference>;
export type ILocalFieldReference = t.TypeOf<typeof LocalFieldReference>;
export type IFieldLiteralReference = t.TypeOf<typeof FieldLiteralReference>;

// TYPE HELPERS

// https://github.com/microsoft/TypeScript/issues/12936#issuecomment-393202175
type AllKeys<U> = U extends any ? keyof U : never;
type ExclusifyUnion<U> = [U] extends [infer V]
  ? V extends any
    ? (V & { [P in Exclude<AllKeys<U>, keyof V>]?: never })
    : never
  : never;
