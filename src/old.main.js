import _ from 'lodash'

function assert(value, message) {
  if (!value) {
    throw new Error(message)
  }
  return value
}
const types = {
  replace: {
    init: null,
    reduce: (total, val) => val,
    // thresholds for replace don't make sense
    isComplete: (total, quota) => null,
    percent: (total, quota) => null,
    sortBy: _.iteratee('quota'),
  },
  max: {
    init: Number.NEGATIVE_INFINITY,
    reduce: Math.max,
    percent: (total, quota) => total / quota,
    isComplete(total, quota) {return this.percent(total, quota) >= 1},
    sortBy: _.iteratee('quota'),
  },
  min: {
    init: Number.POSITIVE_INFINITY,
    reduce: Math.min,
    isComplete: (total, quota) => total <= quota,
    percent: (total, quota) => null,
    sortBy: _.negate(_.iteratee('quota'))
  },
  incr: {
    init: 0,
    reduce: (total, val=1) => total + val,
    percent: (total, quota) => total / quota,
    isComplete(total, quota) {return this.percent(total, quota) >= 1},
    sortBy: _.iteratee('quota'),
  },
}

export class StatBuilder {
  constructor(builder, name) {
    this.builder = builder
    this.name = name
  }
  threshold(quota, name) {
    const thresh = {statName: this.name, quota, name}
    thresh.promise = new Promise((resolve, reject) => {
      thresh._resolve = resolve
      thresh._reject = reject
    })
    this.builder.thresholds.push(thresh)
    return thresh.promise
  }
}
export class Builder {
  constructor() {
    this.stats = []
    this.statsByName = {}
    this.thresholds = []
  }
  stat(name, type) {
    if (!this.statsByName[name]) {
      const stat = {name, type: types[type] || type}
      assert(stat.type.reduce, 'no such stattype: '+stat)
      this.stats.push(stat)
      this.statsByName[name] = stat
    }
    return new StatBuilder(this, name)
  }

  create(values={}) {
    return new Statistics(this.statsByName, this.thresholds, values)
  }
}

class Threshold {
  constructor(statistics, data) {
    this._statistics = statistics
    this._data = data
    this._stat = assert(this._statistics.stats[this._data.statName])
  }
  _value() {
    return this._statistics.value(this._stat.name)
  }
  isComplete(value=this._value()) {
    return this._stat.type.isComplete(value, this._data.quota)
  }
  percent(value=this._value()) {
    return this._stat.type.percent(value, this._data.quota)
  }
}
class Statistics {
  constructor(stats, thresholds, values) {
    this.stats = stats // name: {name, type}
    this.thresholds = thresholds // [{name?, statName, quota, promise, _resolve}]
    this.values = values // statName: value
    this.thresholds = this.thresholds.map((thresh) => new Threshold(this, thresh))
    this.thresholdsByName = _.keyBy(_.filter(this.thresholds, '_data.name'), '_data.name')
    this.thresholdsByStat = _.groupBy(this.thresholds, '_data.statName')
  }
  update(name, val) {
    return this.updates({[name]: val})
  }
  updates(obj) {
    const completed = []
    this.values = Object.assign(this.values, _.mapValues(obj, (value, name) => {
      const stat = assert(this.stats[name], 'no such stat: '+name)
      const total = this.value(name, stat)
      const ret = stat.type.reduce(total, value)
      // just completed
      // TODO index this so we don't have to test every threshold every time
      for (let thresh of this.thresholdsByStat[name] || []) {
        if (!thresh.isComplete(total) && thresh.isComplete(ret)) {
          completed.push(thresh)
          thresh._data._resolve(ret)
        }
      }
      return ret
    }))
    //return completed.map((thresh) => thresh.name)
  }
  value(name, _stat=this.stats[name]) {
    return _.get(this.values, name, _stat.type.init)
  }
  threshold(name) {
    return assert(this.thresholdsByName[name], 'no such threshold: '+name)
  }
}
