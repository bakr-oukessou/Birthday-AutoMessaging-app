const {
  isLeapYear,
  getCelebratedMonthDay,
  isBirthdayOn,
  getNextBirthday,
  getAge,
  getTurningAge,
  getDaysUntilNextBirthday,
} = require('../dateUtils');

// Months are 0-indexed throughout (matching Date/moment)
describe('dateUtils', () => {
  describe('isLeapYear', () => {
    it('handles standard and century rules', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1900)).toBe(false);
    });
  });

  describe('getCelebratedMonthDay', () => {
    it('returns the UTC birth month/day', () => {
      expect(getCelebratedMonthDay('1990-05-15T00:00:00.000Z', 2026)).toEqual({
        month: 4,
        day: 15,
      });
    });

    it('moves Feb 29 birthdays to Feb 28 in non-leap years', () => {
      expect(getCelebratedMonthDay('1996-02-29T00:00:00.000Z', 2025)).toEqual({
        month: 1,
        day: 28,
      });
      expect(getCelebratedMonthDay('1996-02-29T00:00:00.000Z', 2028)).toEqual({
        month: 1,
        day: 29,
      });
    });
  });

  describe('isBirthdayOn', () => {
    it('matches the celebrated date', () => {
      expect(isBirthdayOn('1990-06-09T00:00:00.000Z', 2026, 5, 9)).toBe(true);
      expect(isBirthdayOn('1990-06-09T00:00:00.000Z', 2026, 5, 10)).toBe(false);
      expect(isBirthdayOn('1996-02-29T00:00:00.000Z', 2025, 1, 28)).toBe(true);
    });

    it('is not affected by local timezone (uses UTC getters)', () => {
      // Midnight UTC read with local getters in a negative-offset zone
      // would yield the previous day; ensure that does not happen
      expect(isBirthdayOn(new Date('1990-01-01T00:00:00.000Z'), 2026, 0, 1)).toBe(true);
    });
  });

  describe('getNextBirthday', () => {
    it('returns today when the birthday is today', () => {
      const today = new Date(2026, 5, 9);
      const next = getNextBirthday('1990-06-09T00:00:00.000Z', today);
      expect(next.getFullYear()).toBe(2026);
      expect(next.getMonth()).toBe(5);
      expect(next.getDate()).toBe(9);
    });

    it('rolls over to next year after the birthday has passed', () => {
      const today = new Date(2026, 5, 10);
      const next = getNextBirthday('1990-06-09T00:00:00.000Z', today);
      expect(next.getFullYear()).toBe(2027);
    });
  });

  describe('getAge / getTurningAge', () => {
    it('computes age before and after the birthday', () => {
      const dob = '1990-06-09T00:00:00.000Z';
      expect(getAge(dob, new Date(2026, 5, 8))).toBe(35);
      expect(getAge(dob, new Date(2026, 5, 9))).toBe(36);
    });

    it('turning age equals current age on the birthday itself', () => {
      const dob = '1990-06-09T00:00:00.000Z';
      expect(getTurningAge(dob, new Date(2026, 5, 9))).toBe(36);
      expect(getTurningAge(dob, new Date(2026, 5, 10))).toBe(37);
    });
  });

  describe('getDaysUntilNextBirthday', () => {
    it('returns 0 on the birthday and counts forward otherwise', () => {
      const dob = '1990-06-09T00:00:00.000Z';
      expect(getDaysUntilNextBirthday(dob, new Date(2026, 5, 9))).toBe(0);
      expect(getDaysUntilNextBirthday(dob, new Date(2026, 5, 1))).toBe(8);
    });

    it('counts across a year boundary', () => {
      const dob = '1990-01-01T00:00:00.000Z';
      expect(getDaysUntilNextBirthday(dob, new Date(2026, 11, 31))).toBe(1);
    });
  });
});
