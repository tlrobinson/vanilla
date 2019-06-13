import { VanillaParser, VanillaObject, VanillaArray } from "./vanilla";
import VanillaInstance, { VanillaKey, VanillaClass } from "./VanillaInstance";
import * as _ from "underscore";

import {
  IQuery,
  IQueryBase,
  ILocalFieldReference,
  IFieldLiteralReference,
  IForeignFieldReference
} from "./mbql-schema";
import { number } from "io-ts";

type Metadata = any;

type DatabaseId = number;
type TableId = number;
type FieldId = number;
type SegmentId = number;
type MetricId = number;

type ColumnName = string;
type BaseType = string;

type MBQLMeta = { metadata: Metadata };

interface MBQLInstance extends VanillaInstance {
  parent(): MBQLInstance;
  metadata(): Metadata;
  query(): Query;
  question(): Question;
}

class MBQLObject extends VanillaObject implements MBQLInstance {
  static getDefaultParser() {
    return MBQL;
  }

  // @ts-ignore
  parent(): MBQLInstance {
    // @ts-ignore
    return super.parent();
  }
  metadata(): Metadata {
    return this._meta.metadata;
  }
  query(): Query {
    return this.parent().query();
  }
  question(): Question {
    return this.parent().question();
  }
}

class MBQLArray extends VanillaArray implements MBQLInstance {
  static getDefaultParser() {
    return MBQL;
  }
  // @ts-ignore
  parent(): MBQLInstance {
    // @ts-ignore
    return super.parent();
  }

  metadata(): Metadata {
    return this._meta.metadata;
  }
  query(): Query {
    return this.parent().query();
  }
  question(): Question {
    return this.parent().question();
  }
}

// This class is necessary because MBQL clauses are typed as tuples instead of arrays
// Without it you'll see errors like "Types of property 'length' are incompatible. Type 'number' is not assignable to type '2'.""
class MBQLTuple extends MBQLArray {
  length: any;
}

class MBQLNullableArray<T> extends MBQLArray {
  parent(): MBQLInstance {
    if (this.length === 0) {
      // @ts-ignore
      return this._parent.remove(this._key);
    } else if (this.length === 1) {
      // @ts-ignore
      return this._parent.set(this._key, this);
    }
  }
}
class MBQLNullableObject<T> extends MBQLObject {
  parent(): MBQLInstance {
    const keysCount = Object.keys(this).length;
    if (keysCount === 0) {
      // @ts-ignore
      return this._parent.remove(this._key);
    } else if (keysCount === 1) {
      // @ts-ignore
      return this._parent.set(this._key, this);
    }
  }
}

class MBQLParser extends VanillaParser {
  constructor() {
    super(MBQLObject, MBQLArray);
  }

  getClass(mbql, parent: MBQLInstance, key: VanillaKey) {
    if (Array.isArray(mbql) && typeof mbql[0] === "string") {
      if (MBQL_CLAUSES[mbql[0]]) {
        return MBQL_CLAUSES[mbql[0]];
      }
    }
    return super.getClass(mbql, parent, key);
  }

  parseQuery(query, meta: MBQLMeta = null) {
    return this.parse(query, meta, null, null, getQueryClass(query));
  }

  parseQuestion(question, meta: MBQLMeta = null) {
    return this.parse(question, meta, null, null, Question);
  }
}

export type DatasetQuery = StructuredDatasetQuery | NativeDatasetQuery;

export class Question extends MBQLObject {
  dataset_query: DatasetQuery;

  getChildClass(raw, key) {
    if (key === "dataset_query") {
      if (raw.type === "native") {
        return NativeDatasetQuery;
      } else {
        return StructuredDatasetQuery;
      }
    }
  }
  question() {
    return this;
  }
}

function getQueryClass(raw) {
  if ("source-query" in raw) {
    return QuerySourceQuery;
  } else {
    return QueryTableQuery;
  }
}

export class StructuredDatasetQuery extends MBQLObject {
  // @ts-ignore: MBQL object has a "query" property we're overriding
  query: Query;

  getChildClass(raw: any, key: VanillaKey): VanillaClass | null {
    if (key === "query") {
      return getQueryClass(raw);
    }
  }

  expressions() {
    return this.query.expressionList();
  }
  filters() {
    return this.query.filtersList();
  }
  aggregations() {
    return this.query.aggregationsList();
  }
  breakouts() {
    return this.query.breakoutsList();
  }
  sorts() {
    return this.query.sortsList();
  }
  fields() {
    return this.query.fieldsList();
  }
}

class NativeDatasetQuery extends MBQLObject {}

type Filter = any;

export abstract class Query extends MBQLObject implements IQueryBase {
  "joins": JoinList;
  "expressions": ExpressionObject;
  "filter": Filter;
  "aggregation": AggregationList;
  "breakout": BreakoutList;
  "fields": FieldList;
  "order-by": SortList;

  getChildClass(raw, key) {
    return QUERY_CLAUSES[key];
  }
  query() {
    return this;
  }

  expressionList() {
    const expressions = this.expressions
      ? Object.entries(this.expressions)
      : [];
    return this.parse(expressions, "expressions", ExpressionList);
  }
  filtersList() {
    const filters = !this.filter
      ? []
      : this.filter[0] === "and"
      ? this.filter.slice(1)
      : [this.filter];
    return this.parse(filters, "filter", FilterList);
  }
  aggregationsList() {
    return this.aggregation || this.parse([], "aggregation");
  }
  breakoutsList() {
    return this.breakout || this.parse([], "breakout");
  }
  sortsList() {
    return this._safe("order-by") || this.parse([], "order-by");
  }
  fieldsList() {
    return this.fields || this.parse([], "fields");
  }

  abstract table();

  sourceTable() {
    return this.rootQuery().table();
  }

  rootQuery() {
    let query = this;
    let next;
    while ((next = query.sourceQuery())) {
      query = next;
    }
    return query;
  }

  abstract sourceQuery();

  queries() {
    const stages = [];
    for (let query: Query = this; query; query = query.sourceQuery()) {
      stages.unshift(query);
    }
    return stages;
  }
}

class QuerySourceQuery extends Query {
  "source-query": Query;

  getChildClass(raw: any, key: VanillaKey): VanillaClass | null {
    if (key === "source-query") {
      return getQueryClass(raw);
    }
  }

  table() {
    throw "nyi";
  }
  sourceQuery() {
    return this._safe("source-query");
  }
}

class QueryTableQuery extends Query {
  "source-table": TableId;

  table() {
    return this.metadata().table(this._safe("source-table"));
  }
  sourceQuery() {
    return null;
  }
}

const QUERY_CLAUSES = {};
function query(name) {
  return function(target) {
    QUERY_CLAUSES[name] = target;
    return target;
  };
}

// type Aggregation =
//   | Count
//   | Sum
//   | Average
//   | CumulativeCount
//   | CumulativeSum
//   | Min
//   | Max;
type Breakout = ConcreteFieldReference | DateTimeField | BinningStrategy;

interface Sort {
  0: SortAscending | SortDescending;
  1:
    | FieldId
    | FieldLiteralReference
    | DateTimeField
    | BinningStrategy
    | AggregateFieldReference;
}

type ConcreteFieldReference =
  | LocalFieldReference
  | ForeignFieldReference
  | FieldLiteralReference
  | ExpressionReference;
type Field = ConcreteFieldReference | AggregateFieldReference;

type JoinType = "left-join" | "right-join" | "inner-join" | "full-join";

class Join extends MBQLObject {
  "source-table": TableId;
  "source-query": Query;

  "alias": string;
  "strategy": JoinType;
  "condition": Filter;
  "fields": "none" | "all" | ConcreteFieldReference[];

  getChildClass(raw: any, key: VanillaKey): VanillaClass | null {
    if (key === "source-query") {
      return getQueryClass(raw);
    }
  }
}

// @query("source-query")
// class SourceQuery extends Query {
//   parentQuery() {
//     return this.parent();
//   }
// }

@query("joins")
class JoinList extends MBQLNullableArray<Join> {}

@query("expressions")
class ExpressionObject extends MBQLNullableObject<Expression> {
  // [key: string]: Expression;
  // constructor(object: { [key: string]: Expression }) {
  //   Object.assign(this, object);
  // }
}
@query("aggregation")
class AggregationList extends MBQLNullableArray<
  Aggregation | NamedAggregation
> {}
@query("breakout")
class BreakoutList extends MBQLNullableArray<Breakout> {}
@query("order-by")
class SortList extends MBQLNullableArray<Sort> {}
@query("fields")
class FieldList extends MBQLNullableArray<Field> {}

class FilterList extends MBQLArray {
  parent(): MBQLInstance {
    if (this.length === 0) {
      // @ts-ignore
      return this._parent.remove(this._key);
    } else if (this.length === 1) {
      // @ts-ignore
      return this._parent.set(this._key, this[0]);
    } else {
      // @ts-ignore
      return this._parent.set(this._key, ["and", ...this]);
    }
  }
}

// a "virtual" clause the converts an expression object into an array of ExpressionEntry's
class ExpressionList extends MBQLArray {
  parent(): MBQLInstance {
    if (this.length === 0) {
      // @ts-ignore
      return this._parent.remove(this._key);
    } else {
      // @ts-ignore
      return this._parent.set(this._key, _.object(this));
    }
  }
  getChildClass() {
    return ExpressionEntry;
  }
}

type ExpressionName = string;
type ExpressionOperator = Add | Subtract | Multiply | Divide;
type Expression = ExpressionOperator | ConcreteFieldReference;

// this is used by ExpressionList, not an actual MBQL clause
class ExpressionEntry extends MBQLArray {
  0: ExpressionName;
  1: Expression;

  displayName() {
    return this.name();
  }
  name() {
    return this[0];
  }
  expression() {
    return this[1];
  }
}

const MBQL_CLAUSES = {};

function mbql<T = any>(name) {
  return function(target) {
    MBQL_CLAUSES[name] = target;
    return target;
  };
}

@mbql("field-id")
class LocalFieldReference extends MBQLTuple implements ILocalFieldReference {
  0: "field-id";
  1: FieldId;

  displayName() {
    return this.field().displayName();
  }
  field() {
    return this.metadata().field(this.fieldId());
  }
  fieldId() {
    return this[1];
  }
}

@mbql("field-literal")
class FieldLiteralReference extends MBQLTuple
  implements IFieldLiteralReference {
  0: "field-literal";
  1: ColumnName;
  2: BaseType;

  displayName() {
    return this[0]; // FIXME
  }
}

@mbql("fk->")
class ForeignFieldReference extends MBQLTuple
  implements IForeignFieldReference {
  0: "fk->";
  1: LocalFieldReference;
  2: LocalFieldReference;

  displayName() {
    return `${this.foreignKeyDimension().displayName()} → ${this.targetDimension().displayName()}`;
  }
  foreignKeyDimension() {
    return this[1];
  }
  targetDimension() {
    return this[2];
  }
}

type DateTimeUnit = string; // TODO

@mbql("datetime-field")
class DateTimeField extends MBQLArray {
  0: "datetime-field";
  1: LocalFieldReference | ForeignFieldReference;
  2: DateTimeUnit;

  displayName() {
    return `${this.dimension().displayName()}: ${this.unitDisplayName()}`;
  }
  dimension() {
    return this[1];
  }
  unit() {
    return this[2];
  }
  unitDisplayName() {
    return formatUnit(this.unit());
  }
}
function formatUnit(unit) {
  return unit && unit.charAt(0).toUpperCase() + unit.slice(1).replace("-", " ");
}

@mbql("binning-strategy")
class BinningStrategy extends MBQLArray {
  0: "binning-strategy";
  1: ConcreteFieldReference;
  2: string; // TODO

  displayName() {
    return `${this.dimension().displayName()}: ${this.strategy()}`;
  }
  dimension() {
    return this[1];
  }
  strategy() {
    return this[2];
  }
}

@mbql("aggregation")
class AggregateFieldReference extends MBQLArray {
  0: "aggregation";
  1: number;
  displayName() {
    return this.aggregation().displayName();
  }
  aggregation() {
    return this.query().aggregation[this[1]];
  }
}

@mbql("expression")
class ExpressionReference extends MBQLArray {
  0: "expression";
  1: ExpressionName;
  displayName() {
    return this[1];
  }
}

abstract class SortClause extends MBQLArray {
  0: "asc" | "desc";
  1: Field;
  dimension() {
    return this[1];
  }
  displayName() {
    return `${this.dimension().displayName()}: ${this.directionName()}`;
  }
  abstract directionName();
}
@mbql("asc")
class SortAscending extends SortClause {
  0: "asc";
  directionName() {
    return "Ascending";
  }
}
@mbql("desc")
class SortDescending extends SortClause {
  0: "desc";
  directionName() {
    return `Descending`;
  }
}

@mbql("metric")
class Metric extends MBQLArray {
  0: "metric";
  1: MetricId;

  displayName() {
    return this.metric().displayName();
  }
  metric() {
    return this.metadata().metric(this.metricId());
  }
  metricId() {
    return this[1];
  }
}

@mbql("segment")
class Segment extends MBQLArray {
  0: "segment";
  1: SegmentId;

  displayName() {
    return this.segment().displayName();
  }
  segment() {
    return this.metadata().segment(this.segmentId());
  }
  segmentId() {
    return this[1];
  }
}

@mbql("and")
class AndFilter extends MBQLArray {
  0: "and";
  1: Filter;
  2: Filter;
}
@mbql("or")
class OrFilter extends MBQLArray {
  0: "or";
  1: Filter;
  2: Filter;
}
@mbql("not")
class NotFilter extends MBQLArray {
  0: "not";
  1: Filter;
}

// AGGREGATIONS

abstract class FieldAggregation extends MBQLArray {
  0: string;
  1: ConcreteFieldReference;
  dimension() {
    return this[1];
  }
  displayName() {
    return `${this.aggregationName()} of ${this.dimension().displayName()}`;
  }
  abstract aggregationName();
}

@mbql("count")
class Count extends MBQLArray {
  displayName() {
    return "Count";
  }
}
@mbql("sum")
class Sum extends FieldAggregation {
  0: "sum";
  aggregationName() {
    return `Sum`;
  }
}
@mbql("avg")
class Average extends FieldAggregation {
  0: "avg";
  static "aggregationName" = `Average`;
  aggregationName() {
    return `Average`;
  }
}
@mbql("cum-count")
class CumulativeCount extends FieldAggregation {
  0: "cum-count";
  aggregationName() {
    return `Cumulative count`;
  }
}
@mbql("cum-sum")
class CumulativeSum extends FieldAggregation {
  0: "sum-sum";
  aggregationName() {
    return `Cumulative sum`;
  }
}
@mbql("min")
class Min extends FieldAggregation {
  0: "min";
  aggregationName() {
    return `Minimum`;
  }
}
@mbql("max")
class Max extends FieldAggregation {
  0: "max";
  aggregationName() {
    return `Maximum`;
  }
}

class Aggregation extends MBQLArray {}

@mbql("named")
class NamedAggregation extends Aggregation {
  0: "named";
  1: Aggregation;
  2: string;

  displayName() {
    return this[2];
  }
}

type Value = number | string | null;

// FILTER OPERATORS
@mbql("=")
class Equals extends MBQLArray {
  0: "=";
  1: ConcreteFieldReference;
  2: Value;
}
@mbql("time-interval")
class TimeInterval extends MBQLArray {
  0: "time-interval";
}

// EXPRESSION OPERATORS
abstract class BinaryFieldOperator extends MBQLArray {
  0: "+" | "-" | "*" | "/";
  1: Expression;
  2: Expression;
}

@mbql("+")
class Add extends BinaryFieldOperator {
  0: "+";
}
@mbql("-")
class Subtract extends BinaryFieldOperator {
  0: "-";
}
@mbql("*")
class Multiply extends BinaryFieldOperator {
  0: "*";
}
@mbql("/")
class Divide extends BinaryFieldOperator {
  0: "/";
}

const MBQL = new MBQLParser();

export default MBQL;
export { MBQL_CLAUSES, QUERY_CLAUSES };
