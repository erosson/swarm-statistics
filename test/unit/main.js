import * as s from '../../src/main';

describe('statistics', () => {
  it('defines max stats', () => {
    let def = new s.Builder()
    def.stat('money', 'max')
    def.stat('bogus', 'max')
    let stats = def.create()
    stats.update('money', -900)
    expect(stats.values).to.deep.equal({money: -900})
    stats.update('money', 100)
    expect(stats.values).to.deep.equal({money: 100})
    stats.update('money', 50)
    expect(stats.values).to.deep.equal({money: 100})
    stats.update('money', 200)
    expect(stats.values).to.deep.equal({money: 200})
  })
  it('defines min stats', () => {
    let def = new s.Builder()
    def.stat('duration', 'min')
    def.stat('bogus', 'min')
    let stats = def.create()
    stats.update('duration', 100)
    expect(stats.values).to.deep.equal({duration: 100})
    stats.update('duration', 200)
    expect(stats.values).to.deep.equal({duration: 100})
    stats.update('duration', 50)
    expect(stats.values).to.deep.equal({duration: 50})
    stats.update('duration', -900)
    expect(stats.values).to.deep.equal({duration: -900})
  })
  it('defines incr stats', () => {
    let def = new s.Builder()
    def.stat('count', 'incr')
    def.stat('bogus', 'incr')
    let stats = def.create()
    stats.update('count')
    expect(stats.values).to.deep.equal({count: 1})
    stats.update('count', 3)
    expect(stats.values).to.deep.equal({count: 4})
    stats.update('count', -1)
    expect(stats.values).to.deep.equal({count: 3})
  })
  it('defines replace stats', () => {
    let def = new s.Builder()
    def.stat('blah', 'replace')
    def.stat('bogus', 'replace')
    let stats = def.create()
    stats.update('blah', 'foo')
    expect(stats.values).to.deep.equal({blah: 'foo'})
    stats.update('blah', 'bar')
    expect(stats.values).to.deep.equal({blah: 'bar'})
    stats.update('blah', null)
    expect(stats.values).to.deep.equal({blah: null})
  })
  it('sets thresholds', (done) => {
    let def = new s.Builder()
    let stat = def.stat('money', 'max')
    let count=0
    stat.threshold(10, 'named').then(() => {
      stats.update('money', 25)
    })
    stat.threshold(20).then(() => done())
    stat.threshold(24, 'delayed')
    def.stat('bogus', 'max')
    let stats = def.create()
    stats.update('money', 5)
    expect(stats.threshold('named').isComplete()).to.equal(false)
    expect(stats.threshold('delayed').isComplete()).to.equal(false)
    stats.update('money', 10)
    expect(stats.threshold('named').isComplete()).to.equal(true)
    expect(stats.threshold('delayed').isComplete()).to.equal(false)
  })
})
