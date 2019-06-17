import * as t from "io-ts";

import { SegmentId, RelativeDatetimeUnit } from "./types";
import {
  LocalFieldReference,
  FieldLiteralReference,
  ForeignFieldReference,
  JoinedFieldReference,
  Field
} from "./field";

type AndFilter = any;
const AndFilter: t.Type<AndFilter> = t.recursion("AndFilter", () =>
  t.tuple([t.literal("and"), Filter, Filter])
);

type OrFilter = any;
const OrFilter: t.Type<OrFilter> = t.recursion("OrFilter", () =>
  t.tuple([t.literal("or"), Filter, Filter])
);

type NotFilter = any;
const NotFilter: t.Type<NotFilter> = t.recursion("NotFilter", () =>
  t.tuple([t.literal("not"), Filter])
);

const TimeIntervalFilter = t.tuple([
  t.literal("time-interval"),
  t.union([
    LocalFieldReference,
    ForeignFieldReference,
    FieldLiteralReference,
    JoinedFieldReference
  ]),
  t.union([
    t.number,
    t.literal("current"),
    t.literal("last"),
    t.literal("next")
  ]),
  RelativeDatetimeUnit
  // // FIXME: TimeIntervalOptions
]);

const RelativeDatetime = t.union([
  t.tuple([t.literal("relative-datetime"), t.literal("current")]),
  t.tuple([t.literal("relative-datetime"), t.number, RelativeDatetimeUnit])
]);

const FieldOrRelativeDatetime = t.union([Field, RelativeDatetime]);

const DatetimeLiteral = t.string;
const EqualityComparible = t.union([
  t.boolean,
  t.number,
  t.string,
  DatetimeLiteral,
  FieldOrRelativeDatetime
]);
const OrderComparible = t.union([
  t.number,
  t.string,
  DatetimeLiteral,
  FieldOrRelativeDatetime
]);

export const EqualFilter = t.tuple([t.literal("="), Field, EqualityComparible]);
export const NotEqualFilter = t.tuple([
  t.literal("!="),
  Field,
  EqualityComparible
]);
export const GreaterThanFilter = t.tuple([
  t.literal(">"),
  Field,
  OrderComparible
]);
export const GreaterThanEqualFilter = t.tuple([
  t.literal(">="),
  Field,
  OrderComparible
]);
export const LessThanFilter = t.tuple([t.literal("<"), Field, OrderComparible]);
export const LessThanEqualFilter = t.tuple([
  t.literal("<="),
  Field,
  OrderComparible
]);
export const BetweenFilter = t.tuple([
  t.literal("between"),
  Field,
  OrderComparible,
  OrderComparible
]);

const StringOrField = t.union([t.string, Field]);

const StringFilterOptions = t.any; // FIXME

export const StartsWithFilter = t.tuple([
  t.literal("starts-with"),
  Field,
  StringOrField,
  StringFilterOptions
]);
export const EndsWithFilter = t.tuple([
  t.literal("ends-with"),
  Field,
  StringOrField,
  StringFilterOptions
]);
export const ContainsFilter = t.tuple([
  t.literal("contains"),
  Field,
  StringOrField,
  StringFilterOptions
]);
export const DoesNotContainsFilter = t.tuple([
  t.literal("does-not-contain"),
  Field,
  StringOrField,
  StringFilterOptions
]);

export const InsideFilter = t.tuple([t.literal("inside"), Field]); // FIXME

export const IsNullFilter = t.tuple([t.literal("is-null"), Field]);
export const NotNullFilter = t.tuple([t.literal("not-null"), Field]);

export const SegmentFilter = t.tuple([t.literal("segment"), SegmentId]);

export const Filter = t.union([
  AndFilter,
  OrFilter,
  NotFilter,
  EqualFilter,
  NotEqualFilter,
  LessThanFilter,
  GreaterThanFilter,
  LessThanEqualFilter,
  GreaterThanEqualFilter,
  BetweenFilter,
  StartsWithFilter,
  EndsWithFilter,
  ContainsFilter,
  DoesNotContainsFilter,
  InsideFilter,
  IsNullFilter,
  NotNullFilter,
  TimeIntervalFilter,
  SegmentFilter
]);
