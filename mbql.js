const { VanillaParser, VanillaObject, VanillaArray } = require("./src/vanilla");

MBQLCommon = {
  query() {
    return this.parent().query();
  },
};

class MBQLObject extends VanillaObject {}
Object.assign(MBQLObject.prototype, MBQLCommon);

class MBQLArray extends VanillaArray {}
Object.assign(MBQLArray.prototype, MBQLCommon);

class MBQLParser extends VanillaParser {
  constructor() {
    super(MBQLObject, MBQLArray);
  }

  getClass(mbql, parent, key) {
    if (Array.isArray(mbql) && typeof mbql[0] === "string") {
      if (MBQL_CLAUSES[mbql[0]]) {
        return MBQL_CLAUSES[mbql[0]];
      }
    }
    return super.getClass(mbql, parent, key);
  }

  parseQuery(query) {
    return this.parse(query, null, null, Query);
  }
}

class Query extends MBQLObject {
  getChildClass(mbql, key) {
    return QUERY_CLAUSES[key];
  }
  query() {
    return this;
  }
}

const QUERY_CLAUSES = {};

QUERY_CLAUSES["expressions"] = class Expressions extends MBQLObject {};
// QUERY_CLAUSES["filter"] = class FilterList extends MBQLArray {}; // filter is itself a single filter (which may be AND/OR-ed with multiple filters)
QUERY_CLAUSES["aggregation"] = class AggregationList extends MBQLArray {};
QUERY_CLAUSES["breakout"] = class BreakoutList extends MBQLArray {};
QUERY_CLAUSES["order-by"] = class SortList extends MBQLArray {};
QUERY_CLAUSES["fields"] = class FieldList extends MBQLArray {};

const MBQL_CLAUSES = {};

MBQL_CLAUSES["field-id"] = class FieldId extends MBQLArray {
  displayName() {
    // TODO: pass metadata in
    return `Field${this.fieldId()}`;
  }
  fieldId() {
    return this[1];
  }
};
MBQL_CLAUSES["fk->"] = class FkField extends MBQLArray {
  displayName() {
    return `${this.fkDimension().displayName()} → ${this.targetDimension().displayName()}`;
  }
  fkDimension() {
    return this[1];
  }
  targetDimension() {
    return this[2];
  }
};

MBQL_CLAUSES["datetime-field"] = class DateTimeField extends MBQLArray {
  displayName() {
    return `${this.dimension().displayName()}: ${formatUnit(this.unit())}`;
  }
  dimension() {
    return this[1];
  }
  unit() {
    return this[2];
  }
};
function formatUnit(unit) {
  return unit && unit.charAt(0).toUpperCase() + unit.slice(1).replace("-", " ");
}

MBQL_CLAUSES["binning-strategy"] = class BinningStrategy extends MBQLArray {
  displayName() {
    return `${this.dimension().displayName()}: ${this.strategy()}`;
  }
  dimension() {
    return this[1];
  }
  strategy() {
    return this[2];
  }
};
MBQL_CLAUSES["aggregation"] = class AggregationReference extends MBQLArray {
  displayName() {
    return this.aggregation().displayName();
  }
  aggregation() {
    return this.query().aggregation[this[1]];
  }
};

MBQL_CLAUSES["asc"] = class Ascending extends MBQLArray {
  displayName() {
    return `${this.dimension().displayName()}: Ascending`;
  }
  dimension() {
    return this[1];
  }
};
MBQL_CLAUSES["desc"] = class Descending extends MBQLArray {
  displayName() {
    return `${this.dimension().displayName()}: Descending`;
  }
  dimension() {
    return this[1];
  }
};

MBQL_CLAUSES["metric"] = class Metric extends MBQLArray {};
MBQL_CLAUSES["segment"] = class Segment extends MBQLArray {};

MBQL_CLAUSES["and"] = class AndFilter extends MBQLArray {};
MBQL_CLAUSES["or"] = class OrFilter extends MBQLArray {};
MBQL_CLAUSES["not"] = class NotFilter extends MBQLArray {};

MBQL_CLAUSES["count"] = class Count extends MBQLArray {
  displayName() {
    return "Count";
  }
};
MBQL_CLAUSES["sum"] = class Sum extends MBQLArray {
  displayName() {
    return `Sum of ${this.dimension().displayName()}`;
  }
  dimension() {
    return this[1];
  }
};

MBQL_CLAUSES["named"] = class Named extends MBQLArray {
  displayName() {
    return this[2];
  }
};

MBQL_CLAUSES["="] = class Equals extends MBQLArray {};
MBQL_CLAUSES["time-interval"] = class TimeInterval extends MBQLArray {};

module.exports = new MBQLParser();
module.exports.CLAUSES = MBQL_CLAUSES;
module.exports.QUERY_CLAUSES = QUERY_CLAUSES;

module.exports.Query = Query;
