import * as t from "io-ts";

import { Field } from "./field";

export const ExpressionName = t.string;

type ArithmeticExpression = any; // FIXME
export const ArithmeticExpression: t.Type<ArithmeticExpression> = t.recursion(
  "ArithmeticExpression",
  () =>
    t.tuple([
      t.keyof({ "+": null, "-": null, "*": null, "/": null }),
      ExpressionArg,
      ExpressionArg
    ])
);

const ExpressionArg = t.union([t.number, ArithmeticExpression, Field]);

// TODO: metabase/mbql/schema.clj named this, but why not just call it `Expression`?
export const FieldOrExpressionDef = t.union([ArithmeticExpression, Field]);
export const Expression = FieldOrExpressionDef;
