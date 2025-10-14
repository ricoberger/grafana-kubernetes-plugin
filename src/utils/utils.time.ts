/**
 * `formatTime` formats an given `time` in a uniform way accross the UI.
 */
export const formatTime = (time: Date): string => {
  return `${time.getFullYear()}-${('0' + (time.getMonth() + 1)).slice(-2)}-${('0' + time.getDate()).slice(-2)} ${(
    '0' + time.getHours()
  ).slice(
    -2,
  )}:${('0' + time.getMinutes()).slice(-2)}:${('0' + time.getSeconds()).slice(-2)}`;
};

/**
 * `formatTimestamp` formats an given `timestamp` in a uniform way accross the
 * UI. It creates a new date from the provided timestamp and calls the
 * `formatTime` function.
 */
export const formatTimestamp = (timestamp: number): string => {
  const d = new Date(timestamp);
  return formatTime(d);
};

/**
 * `formatTimeString` formats an given `time` in a uniform way accross the UI.
 * It creates a new date from the provided time string and calls the
 * `formatTime` function.
 */
export const formatTimeString = (time: string): string => {
  return formatTime(new Date(time));
};

/**
 * `timeDifference` calculates the difference of two given timestamps and
 * returns a human readable string for the difference. It is used to get the
 * same style for the age of resources like it is displayed by kubectl.
 */
export const timeDifference = (
  current: number,
  previous: number,
  long?: boolean,
): string => {
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerYear = msPerDay * 365;

  const elapsed = current - previous;

  if (elapsed < msPerMinute) {
    return Math.round(elapsed / 1000) + (long ? ' seconds' : 's');
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + (long ? ' minutes' : 'm');
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + (long ? ' hours' : 'h');
  } else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerDay) + (long ? ' days' : 'd');
  } else {
    return Math.round(elapsed / msPerYear) + (long ? ' years' : 'y');
  }
};
