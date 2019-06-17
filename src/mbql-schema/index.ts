import * as t from "io-ts";

import { QuestionId, MetricId, DatabaseId, TableId } from "./types";
import {
  Field,
  FieldOrAggregationReference,
  LocalFieldReference,
  ForeignFieldReference,
  FieldLiteralReference
} from "./field";

import { ExpressionName, Expression } from "./expression";
import { Aggregation, NamedAggregation } from "./aggregation";
import { Breakout } from "./breakout";
import { Filter } from "./filter";
import { OrderBy } from "./order-by";
import { Join } from "./join";

export const QueryBase = t.partial({
  joins: t.array(Join),
  expressions: t.record(ExpressionName, Expression),
  filter: Filter,
  aggregation: t.array(t.union([Aggregation, NamedAggregation])),
  breakout: t.array(Breakout),
  "order-by": t.array(OrderBy),
  fields: t.array(Field),
  limit: t.number
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
export const QuerySourceQuery: t.Type<QuerySourceQuery> = t.recursion(
  "QuerySourceQuery",
  () =>
    t.intersection([
      t.type({
        "source-query": Query
      }),
      QueryBase
    ])
);
export const QuerySourceTable = t.intersection([
  t.type({
    "source-table": TableId
  }),
  QueryBase
]);
export const Query = t.union([QuerySourceQuery, QuerySourceTable]);

export const StructuredDatasetQuery = t.type({
  type: t.literal("query"),
  database: DatabaseId,
  query: Query
});

export const TemplateTagBase = t.type({
  id: t.string,
  name: t.string,
  "display-name": t.string
});
export const TemplateTagDimension = t.intersection([
  t.type({
    type: t.literal("dimension"),
    dimension: Field
  }),
  TemplateTagBase
]);
export const TemplateTagNumber = t.intersection([
  t.type({ type: t.literal("number") }),
  TemplateTagBase
]);
export const TemplateTagText = t.intersection([
  t.type({ type: t.literal("text") }),
  TemplateTagBase
]);
export const TemplateTagDate = t.intersection([
  t.type({ type: t.literal("date") }),
  TemplateTagBase
]);

export const TemplateTag = t.taggedUnion("type", [
  TemplateTagDimension,
  TemplateTagNumber,
  TemplateTagText,
  TemplateTagDate
]);

const TemplateTagName = t.string;

export const NativeQuery = t.exact(
  t.intersection([
    t.type({
      query: t.string
    }),
    t.partial({
      "template-tags": t.record(TemplateTagName, TemplateTag)
    })
  ])
);
export const NativeDatasetQuery = t.type({
  type: t.literal("native"),
  database: DatabaseId,
  native: NativeQuery
});

export const DatasetQuery = t.union([
  StructuredDatasetQuery,
  NativeDatasetQuery
]);

export const Question = t.type({
  id: QuestionId,
  name: t.string,
  description: t.union([t.string, t.null]),
  display: t.string,
  dataset_query: DatasetQuery,
  visualization_settings: t.object
});

export type IQuerySourceQuery = t.TypeOf<typeof QuerySourceQuery>;
export type IQuerySourceTable = t.TypeOf<typeof QuerySourceTable>;
// export type IQuery = t.TypeOf<typeof Query>;
export type IQuery = ExclusifyUnion<IQuerySourceQuery | IQuerySourceTable>;
export type IQueryBase = t.TypeOf<typeof QueryBase>;

export type ILocalFieldReference = t.TypeOf<typeof LocalFieldReference>;
export type IForeignFieldReference = t.TypeOf<typeof ForeignFieldReference>;
export type IFieldLiteralReference = t.TypeOf<typeof FieldLiteralReference>;

// TYPE HELPERS

// https://github.com/microsoft/TypeScript/issues/12936#issuecomment-393202175
type AllKeys<U> = U extends any ? keyof U : never;
type ExclusifyUnion<U> = [U] extends [infer V]
  ? V extends any
    ? (V & { [P in Exclude<AllKeys<U>, keyof V>]?: never })
    : never
  : never;
