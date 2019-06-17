import * as t from "io-ts";

import { MetricId } from "./types";
import { FieldOrExpressionDef } from "./expression";

export const CountAggregation = t.tuple([t.literal("count")]);
export const SumAggregation = t.tuple([t.literal("sum"), FieldOrExpressionDef]);
export const AverageAggregation = t.tuple([
  t.literal("avg"),
  FieldOrExpressionDef
]);
export const MinAggregation = t.tuple([t.literal("min"), FieldOrExpressionDef]);
export const MaxAggregation = t.tuple([t.literal("max"), FieldOrExpressionDef]);
export const CumulativeCountAggregation = t.tuple([t.literal("cum-count")]);
export const CumulativeSumAggregation = t.tuple([
  t.literal("cum-sum"),
  FieldOrExpressionDef
]);
export const DistinctAggregation = t.tuple([
  t.literal("distinct"),
  FieldOrExpressionDef
]);
export const BasicAggregations = t.union([
  CountAggregation,
  SumAggregation,
  AverageAggregation,
  DistinctAggregation,
  MinAggregation,
  MaxAggregation,
  CumulativeCountAggregation,
  CumulativeSumAggregation
]);

type ExpressionAggregationArg = any;
export const ExpressionAggregationArg: t.Type<
  ExpressionAggregationArg
> = t.recursion("ExpressionAggregationArg", () =>
  t.union([Aggregation, t.number])
);

export const ExpressionAggregation = t.tuple([
  t.keyof({ "+": null, "-": null, "*": null, "/": null }),
  ExpressionAggregationArg,
  ExpressionAggregationArg
]);

export const MetricAggregation = t.tuple([t.literal("metric"), MetricId]);

export const UnnamedAggregation = t.union([
  BasicAggregations,
  MetricAggregation,
  ExpressionAggregation
]);

export const NamedAggregation = t.tuple([
  t.literal("named"),
  UnnamedAggregation,
  t.string
]);

export const Aggregation = t.union([UnnamedAggregation, NamedAggregation]);
