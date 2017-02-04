# swarm-statistics



[![Travis build status](http://img.shields.io/travis/erosson/swarm-statistics.svg?style=flat)](https://travis-ci.org/erosson/swarm-statistics)
[![Code Climate](https://codeclimate.com/github/erosson/swarm-statistics/badges/gpa.svg)](https://codeclimate.com/github/erosson/swarm-statistics)
[![Test Coverage](https://codeclimate.com/github/erosson/swarm-statistics/badges/coverage.svg)](https://codeclimate.com/github/erosson/swarm-statistics)
[![Dependency Status](https://david-dm.org/erosson/swarm-statistics.svg)](https://david-dm.org/erosson/swarm-statistics)
[![devDependency Status](https://david-dm.org/erosson/swarm-statistics/dev-status.svg)](https://david-dm.org/erosson/swarm-statistics#info=devDependencies)


## Usage

### Statistics tracking

Start by defining the statistics you want to track.

    var def = new statistics.Definition()
    def.stat('money', 'replace', {'money.max': 'max'})
    def.stat('prestigeDurationMillis', 'min')
    def.stat('prestigeCount', 'add')
    var stats = def.create()

Update `statistics` when values in your game change.

    stats.update('money', 1000)
    stats.updates({money: 1000, prestigeDurationMillis: 300000, prestigeCount: 1})
    stats.updates({money: 800, prestigeDurationMillis: 1000000, prestigeCount: 1})
    stats.get('money')
    // => 800
    stats.get('money.max')
    // => 1000
    stats.get('prestigeDurationMillis')
    // => 86400
    stats.get('prestigeCount')
    // => 2

React to each statistic change.

    def.listen(function(name, value) {
      console.log('statistic changed: '+name+': '+value);
    })

Define thresholds to notify other parts of your app when your statistics reach a certain value. These are useful for achievements, storyline progression, or other kinds of notifications. A threshold will only call its handlers once.

TODO: should this be called on def or stats???

    def.threshold('lotsOfMoney', 'money.max', 10000)
    def.threshold('lotsOfMoney').handle(function() {
      console.log("yay I'm rich")
    })
    stats.threshold().handle(function(threshold) {
      console.log("threshold: "+threshold.name)
    })

Thresholds can also be inspected manually. `percent` is between 0 and 1; 1 is completed/100%. A completed threshold will always stay complete.

    stats.threshold('lotsOfMoney').isComplete()
    // => false
    stats.threshold('lotsOfMoney').percent()
    // => 0.1

Statistics values are JSON-formatted for easy persistence. Definitions, listeners, and thresholds aren't included, and your code should re-define them on refresh.

    var json = JSON.stringify(stats.state))
    localStorage.setItem('stats', json)
    // ...page reload...
    var def = ...
    var json = localStorage.getItem('stats')
    var stats = def.create(json && JSON.parse(json))

### Achievements and triggers

... TODO. implement thresholds/statistics first - building blocks.
The goal is to easily define (achievement: set-of-thresholds + outside conditions, like timers/durations/non-indexed statistics (maxiumum duration))

TODO: compound triggers/multi-thresholds. and, or, timer-based...

---- old compound-trigger design below

Fire triggers when your statistics reach certain thresholds. These are useful for achievements, storyline progression, or other notifications. A trigger will only fire once per game session.

    stats.trigger('lotsOfMoney').threshold('money.max', 10000)
    stats.trigger('fastPrestige').threshold('prestigeDurationMillis', 300000)
    stats.trigger('lotsOfPrestiges').threshold('prestigeCount', 10)
    stats.trigger('lotsOfMoneyAndPrestiges').threshold({prestigeCount: 10, 'money.max': 10000})
    stats.trigger('lotsOfMoneyNoPrestiges').      // TODO how to best do this one?
    stats.trigger('lotsOfMoney').handle(function() {
      console.log('yay, I\'m rich');
      // grant an achievement here, for example
    })
    stats.trigger().handle(function(name) {
      console.log('triggered '+name);
    })

Use conditions to prevent a trigger from firing based on some outside condition. // TODO: duration should be a part of this api. Also, outside conditions are ambiguous about "do I get re-fired later?" - remove them, let listener handler it????
// TODO: should compound conditions even be this API's responsibility? The "hard" part is indexing the trigger conditions; listeners can combine them.

    stats.trigger('lotsOfMoneyQuickly').threshold('money.max', 10000).condition(function() {
      timeSinceLastPrestige() >= 86400 * 1000;
    })

