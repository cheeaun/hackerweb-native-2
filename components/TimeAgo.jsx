import differenceInSeconds from 'date-fns/differenceInSeconds';
import format from 'date-fns/format';
import isSameYear from 'date-fns/isSameYear';
import isValid from 'date-fns/isValid';

const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_DAY = 1440;
const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;
const MINUTES_IN_WEEK = MINUTES_IN_DAY * DAYS_IN_WEEK;

export default function ({ time }) {
  if (!time || !isValid(time)) return null;
  const now = new Date();
  const seconds = differenceInSeconds(now, time);
  const minutes = Math.round(seconds / 60);
  let text = '';
  if (minutes < 1) {
    text = seconds + 's';
  } else if (minutes < SECONDS_IN_MINUTE) {
    text = minutes + 'm';
  } else if (minutes < MINUTES_IN_DAY) {
    text = Math.round(minutes / SECONDS_IN_MINUTE) + 'h';
  } else if (minutes < MINUTES_IN_WEEK) {
    text = Math.round(minutes / SECONDS_IN_MINUTE / HOURS_IN_DAY) + 'd';
  } else if (isSameYear(time, now)) {
    text = format(time, 'd LLL');
  } else {
    text = format(time, 'd LLL yyyy');
  }
  return text;
}
