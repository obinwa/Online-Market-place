var duration = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
exports.isFuture = function (dateTime) {
  let taskDate = new Date(dateTime);
  let currentDate = new Date();
  return taskDate > currentDate;
};

//true if dateTime1 is greater than dateTime2
exports.isAhead = function (dateTime1, dateTime2) {
  let date1 = new Date(dateTime1);
  let date2 = new Date(dateTime2);
  return date1 > date2;
};

exports.difference = function (dateTime1, dateTime2, unit) {
  let date1 = new Date(dateTime1);
  let date2 = new Date(dateTime2);
  let offset = new Date().getTimezoneOffset();
  let difference = date1 - date2; // + (offset * 60000);
  let denominator = duration[unit] ? duration[unit] : 1000;
  return Math.abs(Math.floor(difference / denominator));
};

exports.minus = function (dateTime, timeInterval, unit) {
  let date = new Date(dateTime);

  unit = duration[unit] ? duration[unit] : 1000;
  let timeIntervalInMilliseconds = timeInterval * unit;
  let newDate = new Date(date - timeIntervalInMilliseconds);

  return newDate;
};

exports.plus = function (dateTime, timeInterval, unit) {
  let date = new Date(dateTime);

  unit = duration[unit] ? duration[unit] : 1000;
  let timeIntervalInMilliseconds = timeInterval * unit;

  let newDate = new Date(date + timeIntervalInMilliseconds);
  return newDate;
};

exports.sameDay = function (dateTime1, dateTime2) {
  let d1 = new Date(dateTime1);
  let d2 = new Date(dateTime2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

exports.isToday = function (dateTime1) {
  let d1 = new Date(dateTime1);
  let d2 = new Date();

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

exports.formatDate = function (date) {
  let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
  let mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(date);
  let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
  return `${da}-${mo}-${ye}`;
};
