import _ from 'lodash'

function assert(value, message) {
  if (!value) {
    throw new Error(message)
  }
  return value
}
const types = {
  max: {
    init: Number.NEGATIVE_INFINITY,
    reduce: Math.max,
    percent: (total, quota) => total / quota,
    isComplete(total, quota) {return this.percent(total, quota) >= 1}
  },
  min: {
    init: Number.POSITIVE_INFINITY,
    reduce: Math.min,
    isComplete: (total, quota) => total <= quota,
    percent: (total, quota) => null,
  },
  incr: {
    init: 0,
    reduce: (total, val=1) => total + val,
    percent: (total, quota) => total / quota,
    isComplete(total, quota) {return this.percent(total, quota) >= 1}
  },
}

class Threshold {
  constructor(stat, quota, promise, resolve) {
    this.stat = stat
    this.quota = quota
    this.promise = promise
    this.tryComplete = () => this.isComplete() && resolve(this.stat.value())
  }
  isComplete(value=this.stat.value()) {
    return this.stat.type.isComplete(value, this.quota)
  }
  percent(value=this.stat.value()) {
    return this.stat.type.percent(value, this.quota)
  }
}
export class Statistic {
  constructor(type) {
    this.type = types[type] || type
    this.thresholds = []
  }
  threshold(quota) {
    let resolve
    let promise = new Promise((_resolve, reject) => {
      resolve = _resolve
    })
    const thresh = new Threshold(this, quota, promise, resolve)
    const index = _.sortedIndexOf(this.thresholds, thresh, this.type.sortBy)
    this.thresholds.splice(index, 0, thresh)
    thresh.tryComplete()
    return thresh
  }
  value() {
    return _.get(this, '_value', this.type.init)
  }
  toJson() {
    return this._value
  }
  update(value) {
    const oldvalue = this.value()
    this._value = this.type.reduce(oldvalue, value)
    // TODO: use sorting to avoid iterating all
    for (let thresh of this.thresholds) {
      thresh.tryComplete()
    }
    // return value if changed, undefined if unchanged
    if (oldvalue !== this._value) {
      return this._value
    }
  } 
}
