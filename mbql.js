const { VanillaParser, VanillaObject, VanillaArray } = require("./src/vanilla");
const _ = require("underscore");

MBQLCommon = {
  metadata() {
    return this._meta.metadata;
  },
  query() {
    return this.parent().query();
  },
  question() {
    return this.parent().question();
  },
};

class MBQLObject extends VanillaObject {}
Object.assign(MBQLObject.prototype, MBQLCommon);

class MBQLArray extends VanillaArray {}
Object.assign(MBQLArray.prototype, MBQLCommon);

class MBQLNullableArray extends MBQLArray {
  parent() {
    if (this.length === 0) {
      return this._parent.remove(this._key);
    } else if (this.length === 1) {
      return this._parent.replace(this._key, this);
    }
  }
}
class MBQLNullableObject extends MBQLObject {
  parent() {
    if (this.length === 0) {
      return this._parent.remove(this._key);
    } else if (this.length === 1) {
      return this._parent.replace(this._key, this);
    }
  }
}

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

  parseQuery(query, meta) {
    return this.parse(query, meta, null, null, Query);
  }

  parseQuestion(question, meta) {
    return this.parse(question, meta, null, null, Question);
  }
}

class Question extends MBQLObject {
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

class StructuredDatasetQuery extends MBQLObject {
  getChildClass(raw, key) {
    if (key === "query") {
      return Query;
    }
  }

  expressions() {
    return this.query.expressionList();
  }
  filters() {
    return this.query.filters();
  }
  aggregations() {
    return this.query.aggregations();
  }
  breakouts() {
    return this.query.breakouts();
  }
  sorts() {
    return this.query.sorts();
  }
  fields() {
    return this.query.fields();
  }
}

class NativeDatasetQuery extends MBQLObject {}

class Query extends MBQLObject {
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
  filters() {
    const filters = !this.filter
      ? []
      : this.filter[0] === "and"
      ? this.filter.slice(1)
      : [this.filter];
    return this.parse(filters, "filter", FilterList);
  }
  aggregations() {
    return this.aggregation || this.parse([], "aggregation");
  }
  breakouts() {
    return this.breakout || this.parse([], "breakout");
  }
  sorts() {
    return this["order-by"] || this.parse([], "order-by");
  }
  fields() {
    return this.fields || this.parse([], "fields");
  }

  table() {
    if (this["source-table"]) {
      return this.metadata().table(this["source-table"]);
    } else if (this["source-query"]) {
      throw "nyi";
    }
  }

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

  sourceQuery() {
    return this["source-query"];
  }

  queries() {
    const stages = [];
    for (let query = this; query; query = query.sourceQuery()) {
      stages.unshift(query);
    }
    return stages;
  }
}

const QUERY_CLAUSES = {};

QUERY_CLAUSES["source-query"] = class SourceQuery extends Query {
  parentQuery() {
    return this.parent();
  }
};

QUERY_CLAUSES["expressions"] = Object; // objects that can have arbitrary keys must not have additional methods
QUERY_CLAUSES[
  "aggregation"
] = class AggregationList extends MBQLNullableArray {};
QUERY_CLAUSES["breakout"] = class BreakoutList extends MBQLNullableArray {};
QUERY_CLAUSES["order-by"] = class SortList extends MBQLNullableArray {};
QUERY_CLAUSES["fields"] = class FieldList extends MBQLNullableArray {};

class FilterList extends MBQLArray {
  parent() {
    if (this.length === 0) {
      return this._parent.remove(this._key);
    } else if (this.length === 1) {
      return this._parent.replace(this._key, this[0]);
    } else {
      return this._parent.replace(this._key, ["and", ...this]);
    }
  }
}

// a "virtual" clause the converts an expression object into a
class ExpressionList extends MBQLArray {
  parent() {
    if (this.length === 0) {
      return this._parent.remove(this._key);
    } else {
      const expressions = _.object(this);
      return this._parent.replace(this._key, expressions);
    }
  }
  getChildClass() {
    return Expression;
  }
}

// this is used by ExpressionList, not an actual MBQL clause
class Expression extends MBQLArray {
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

MBQL_CLAUSES["field-id"] = class FieldId extends MBQLArray {
  displayName() {
    return this.field().displayName();
  }
  field() {
    return this.metadata().field(this.fieldId());
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

MBQL_CLAUSES["asc"] = class SortAscending extends MBQLArray {
  displayName() {
    return `${this.dimension().displayName()}: Ascending`;
  }
  dimension() {
    return this[1];
  }
};
MBQL_CLAUSES["desc"] = class SortDescending extends MBQLArray {
  displayName() {
    return `${this.dimension().displayName()}: Descending`;
  }
  dimension() {
    return this[1];
  }
};

MBQL_CLAUSES["metric"] = class Metric extends MBQLArray {
  displayName() {
    return this.metric().displayName();
  }
  metric() {
    return this.metadata().metric(this.metricId());
  }
  metricId() {
    return this[1];
  }
};
MBQL_CLAUSES["segment"] = class Segment extends MBQLArray {
  displayName() {
    return this.segment().displayName();
  }
  segment() {
    return this.metadata().segment(this.segmentId());
  }
  segmentId() {
    return this[1];
  }
};

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

const MBQL = new MBQLParser();
MBQL.CLAUSES = MBQL_CLAUSES;
MBQL.QUERY_CLAUSES = QUERY_CLAUSES;

module.exports = MBQL;
module.exports.Query = Query;
