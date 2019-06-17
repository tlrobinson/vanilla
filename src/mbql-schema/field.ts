import * as t from "io-ts";

import {
  ColumnName,
  BaseType,
  FieldId,
  ExpressionName,
  DateTimeUnit,
  JoinAlias
} from "./types";

export const LocalFieldReference = t.tuple([t.literal("field-id"), FieldId]);
export const FieldLiteralReference = t.tuple([
  t.literal("field-literal"),
  ColumnName,
  BaseType
]);
export const ForeignFieldReference = t.tuple([
  t.literal("fk->"),
  LocalFieldReference,
  LocalFieldReference
]);
export const ExpressionReference = t.tuple([
  t.literal("expression"),
  ExpressionName
]);

export const JoinedFieldReference =
  t.any; /*t.tuple([
  t.literal("joined-field"),
  JoinAlias,
  t.union([LocalFieldReference, FieldLiteralReference])
]);*/

export const ConcreteFieldReference = t.union([
  LocalFieldReference,
  FieldLiteralReference,
  ForeignFieldReference,
  JoinedFieldReference
]);

export const DateTimeFieldReference = t.tuple([
  t.literal("datetime-field"),
  ConcreteFieldReference,
  DateTimeUnit
]);

export const BinnableFieldReference = t.union([
  LocalFieldReference,
  ForeignFieldReference,
  FieldLiteralReference,
  JoinedFieldReference,
  DateTimeFieldReference
]);

const BinningStrategyName = t.union([
  t.literal("default"),
  t.literal("bin-width")
]);
const BinningStrategyParam = t.union([t.number, t.undefined]);

export const BinningStrategy = t.tuple([
  t.literal("binning-strategy"),
  BinnableFieldReference,
  BinningStrategyName,
  BinningStrategyParam
]);

export const Field = t.union([
  LocalFieldReference,
  ForeignFieldReference,
  FieldLiteralReference,
  JoinedFieldReference,
  DateTimeFieldReference,
  ExpressionReference,
  BinningStrategy
]);

export const AggregationReference = t.tuple([
  t.literal("aggregation"),
  t.number
]);

export const FieldOrAggregationReference = t.union([
  Field,
  AggregationReference
]);
