import * as t from "io-ts";

import { Field } from "./field";
import { ExpressionName } from "./types";

export type ExpressionArg = any; // FIXME
export const ExpressionArg: t.Type<ExpressionArg> = t.recursion(
  "ExpressionArg",
  () => t.union([t.number, ArithmeticExpression, Field])
);

export const ArithmeticExpression = t.tuple([
  t.keyof({ "+": null, "-": null, "*": null, "/": null }),
  ExpressionArg,
  ExpressionArg
]);

// TODO: metabase/mbql/schema.clj named this, but why not just call it `Expression`?
export const FieldOrExpressionDef = t.union([ArithmeticExpression, Field]);
export const Expression = FieldOrExpressionDef;
