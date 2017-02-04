import statistics from '../../src/main';

describe('statistics', () => {
  describe('Greet function', () => {
    beforeEach(() => {
      spy(statistics, 'greet');
      statistics.greet();
    });

    it('should have been run once', () => {
      expect(statistics.greet).to.have.been.calledOnce;
    });

    it('should have always returned hello', () => {
      expect(statistics.greet).to.have.always.returned('hello');
    });
  });
});
