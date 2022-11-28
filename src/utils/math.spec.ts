import { rndBn, rndBnUnit } from './math';

const t1a = '10';
const t1b = '100';
const t1precision = 1;

const t2a = '1000000000000000000';
const t2b = '10000000000000000000';
const t2precision = 18;

const t3a = '1';
const t3b = '1';
const t3precision = 0;

describe('rndBn', () => {
  it('fails if max < min', () => {
    expect(() => rndBn(t2b, t2a)).toThrow('rndBn: max cannot be less than min.');
  });

  it('fails on negative bounds', () => {
    expect(() => rndBn('-1', '0')).toThrow('rndBn: negtive values not accepted.');
  });

  it('works with 10, 100', () => {
    const res = rndBn(t1a, t1b);
    expect(res.gte(t1a)).toBe(true);
    expect(res.lte(t1b)).toBe(true);
  });

  it('works with 18 and 19 length string numbers', () => {
    const res = rndBn(t2a, t2b);
    expect(res.gte(t2a)).toBe(true);
    expect(res.lte(t2b)).toBe(true);
  });

  it('works with min = max', () => {
    const res = rndBn(t3a, t3b);
    expect(res.gte(t3a)).toBe(true);
    expect(res.lte(t3b)).toBe(true);
  });

  it('works with 0', () => {
    const res = rndBn('0', '0');
    expect(res.gte(0)).toBe(true);
    expect(res.lte(0)).toBe(true);
  });
});

describe('rndBnUnit', () => {
  it('fails if max < min', () => {
    expect(() => rndBnUnit(2, 1, t1precision)).toThrow('rndBn: max cannot be less than min.');
  });

  it('fails on negative bounds', () => {
    expect(() => rndBnUnit(-1, 0, t1precision)).toThrow('rndBn: negtive values not accepted.');
  });

  it('works with 1, 10 and precision 1', () => {
    const res = rndBnUnit(1, 10, t1precision);
    expect(res.gte(t1a)).toBe(true);
    expect(res.lte(t1b)).toBe(true);
  });

  it('works with 1, 10 and precision 18', () => {
    const res = rndBnUnit(1, 10, t2precision);
    expect(res.gte(t2a)).toBe(true);
    expect(res.lte(t2b)).toBe(true);
  });

  it('works with 1, 10 and precision 0', () => {
    const res = rndBnUnit(1, 10, t3precision);
    expect(res.gte(1)).toBe(true);
    expect(res.lte(10)).toBe(true);
  });

  it('works with 0, 1 and precision 18', () => {
    const res = rndBnUnit(0, 1, t2precision);
    expect(res.gte(0)).toBe(true);
    expect(res.lte(t2a)).toBe(true);
  });

  it('works with min = max', () => {
    const res = rndBnUnit(1, 1, t3precision);
    expect(res.gte(t3a)).toBe(true);
    expect(res.lte(t3b)).toBe(true);
  });

  it('works with 0', () => {
    const res = rndBnUnit(0, 0, t3precision);
    expect(res.eq(0)).toBe(true);
  });
});
