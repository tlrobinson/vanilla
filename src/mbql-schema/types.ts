import * as t from "io-ts";

export const DatabaseId = t.number;
export const TableId = t.union([t.number, t.string]); // TableId can be a string like "card__123"
export const FieldId = t.number;
export const MetricId = t.union([t.number, t.string]); // MetricId can be a string like "ga:users"
export const SegmentId = t.union([t.number, t.string]); // SegmentId can be a string like "gaid::-3"
export const QuestionId = t.number;

export const ExpressionName = t.string;
export const ColumnName = t.string;
export const BaseType = t.string; // TODO
export const DateTimeUnit = t.string; // TODO

export const RelativeDatetimeUnit = t.string; // FIXME :default :minute :hour :day :week :month :quarter :year

export const JoinAlias = t.string;
