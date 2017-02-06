import * as s from '../../src/main2';

describe('statistics', () => {
  it('defines max stats', () => {
    let stat = new s.Statistic('max')
    stat.update(-900)
    expect(stat.value()).to.equal(-900)
    stat.update(100)
    expect(stat.value()).to.equal(100)
    stat.update(50)
    expect(stat.value()).to.equal(100)
    stat.update(200)
    expect(stat.value()).to.equal(200)
  })
  it('defines min stats', () => {
    let stat = new s.Statistic('min')
    stat.update(100)
    expect(stat.value()).to.equal(100)
    stat.update(200)
    expect(stat.value()).to.equal(100)
    stat.update(50)
    expect(stat.value()).to.equal(50)
    stat.update(-900)
    expect(stat.value()).to.equal(-900)
  })
  it('defines min stats', () => {
    let stat = new s.Statistic('incr')
    expect(stat.value()).to.equal(0)
    stat.update()
    expect(stat.value()).to.equal(1)
    stat.update(3)
    expect(stat.value()).to.equal(4)
    stat.update(-1)
    expect(stat.value()).to.equal(3)
  })
  it('sets thresholds', (done) => {
    let stat = new s.Statistic('max')
    let one = stat.threshold(10)
    one.promise.then((res) => {
      stat.update(25)
      return res
    })
    let two = stat.threshold(20)
    two.promise.then(() => done())
    let three = stat.threshold(24)
    stat.update(5)
    expect(one.isComplete()).to.equal(false)
    expect(three.isComplete()).to.equal(false)
    stat.update(10)
    expect(one.isComplete()).to.equal(true)
    expect(three.isComplete()).to.equal(false) // async
  })
  it('resolves thresholds initially resolved', (done) => {
    let stat = new s.Statistic('max')
    stat.update(15)
    let one = stat.threshold(10)
    one.promise.then(() => done())
  })
})
