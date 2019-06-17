import * as t from "io-ts";

import { TableId, JoinAlias } from "./types";

import { Filter } from "./filter";
import { Field } from "./field";

const JoinFields = t.union([
  t.literal("none"),
  t.literal("all"),
  t.array(Field)
]);

const JoinBase = t.type({
  fields: JoinFields,
  alias: JoinAlias,
  condition: Filter
});

const JoinSourceTable = t.intersection([
  t.type({
    "source-table": TableId
  }),
  JoinBase
]);
interface JoinSourceQuery extends t.TypeOf<typeof JoinBase> {
  "source-query": t.TypeOf<typeof Query>;
}
const JoinSourceQuery: t.Type<JoinSourceQuery> = t.recursion(
  "JoinSourceQuery",
  () =>
    t.intersection([
      t.type({
        "source-query": Query
      }),
      JoinBase
    ])
);

export const Join = t.union([JoinSourceTable, JoinSourceQuery]);

// NOTE: this import must come last since it depends on Join being defined
import { Query } from "./index";
