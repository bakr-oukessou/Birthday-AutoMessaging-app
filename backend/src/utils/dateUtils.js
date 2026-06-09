// Birthday date helpers.
//
// Dates of birth are stored as UTC midnight (clients send YYYY-MM-DD as an
// ISO string), so the birth month/day must always be read with UTC getters.
// "Today" depends on the observer (user timezone), so callers pass it in as
// plain year/month/day numbers or a Date built from those components.

const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const getBirthMonthDay = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  return { month: dob.getUTCMonth(), day: dob.getUTCDate() };
};

// Month/day the birthday is celebrated in a given year.
// Feb 29 birthdays are celebrated on Feb 28 in non-leap years.
const getCelebratedMonthDay = (dateOfBirth, year) => {
  const { month, day } = getBirthMonthDay(dateOfBirth);
  if (month === 1 && day === 29 && !isLeapYear(year)) {
    return { month: 1, day: 28 };
  }
  return { month, day };
};

const isBirthdayOn = (dateOfBirth, year, month, day) => {
  const celebrated = getCelebratedMonthDay(dateOfBirth, year);
  return celebrated.month === month && celebrated.day === day;
};

// Next celebration date (midnight) on or after fromDate, compared date-only
// so a birthday today does not roll over to next year.
const getNextBirthday = (dateOfBirth, fromDate = new Date()) => {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth();
  const day = fromDate.getDate();

  const thisYear = getCelebratedMonthDay(dateOfBirth, year);
  if (thisYear.month < month || (thisYear.month === month && thisYear.day < day)) {
    const nextYear = getCelebratedMonthDay(dateOfBirth, year + 1);
    return new Date(year + 1, nextYear.month, nextYear.day);
  }
  return new Date(year, thisYear.month, thisYear.day);
};

// Completed age as of fromDate (date-only comparison).
const getAge = (dateOfBirth, fromDate = new Date()) => {
  const { month, day } = getBirthMonthDay(dateOfBirth);
  const birthYear = new Date(dateOfBirth).getUTCFullYear();
  let age = fromDate.getFullYear() - birthYear;
  if (fromDate.getMonth() < month || (fromDate.getMonth() === month && fromDate.getDate() < day)) {
    age -= 1;
  }
  return age;
};

// Age the contact turns on their next birthday (equals current age if the
// birthday is today, since getNextBirthday returns today in that case).
const getTurningAge = (dateOfBirth, fromDate = new Date()) => {
  const next = getNextBirthday(dateOfBirth, fromDate);
  return next.getFullYear() - new Date(dateOfBirth).getUTCFullYear();
};

const getDaysUntilNextBirthday = (dateOfBirth, fromDate = new Date()) => {
  const today = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const next = getNextBirthday(dateOfBirth, today);
  return Math.round((next - today) / (1000 * 60 * 60 * 24));
};

module.exports = {
  isLeapYear,
  getBirthMonthDay,
  getCelebratedMonthDay,
  isBirthdayOn,
  getNextBirthday,
  getAge,
  getTurningAge,
  getDaysUntilNextBirthday,
};
