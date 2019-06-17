import * as t from "io-ts";

import { FieldOrAggregationReference } from "./field";

export const Asc = t.tuple([t.literal("asc"), FieldOrAggregationReference]);
export const Desc = t.tuple([t.literal("desc"), FieldOrAggregationReference]);

export const OrderBy = t.union([Asc, Desc]);
