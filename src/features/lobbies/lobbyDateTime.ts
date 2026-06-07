import type { Lobby, LobbyStatus } from '../../types';

export const israelTimeZone = 'Asia/Jerusalem';
export const matchCompletionDelayMinutes = 60;

export type DateOption = {
  description?: string;
  label: string;
  value: string;
};

export type TimeOption = {
  description?: string;
  label: string;
  value: string;
};

export function formatLobbyStart(startsAt: string, now = new Date()) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt;
  }

  const dateValue = getIsraelDateValue(date);
  const todayValue = getIsraelDateValue(now);
  const tomorrowValue = getIsraelDateValue(addDays(now, 1));
  const timeValue = getIsraelTimeValue(date);

  if (dateValue === todayValue) {
    return `Today, ${timeValue}`;
  }

  if (dateValue === tomorrowValue) {
    return `Tomorrow, ${timeValue}`;
  }

  return `${formatIsraelMonthDay(date)}, ${timeValue}`;
}

export function getLobbyLocalDateValue(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt.slice(0, 10);
  }

  return getIsraelDateValue(date);
}

export function getLobbyLocalTimeValue(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt.slice(11, 16);
  }

  return getIsraelTimeValue(date);
}

export function buildLobbyStartsAt(matchDate: string, startTime: string) {
  return `${matchDate}T${startTime}:00${getIsraelOffsetForDate(matchDate)}`;
}

export function buildFutureDateOptions({
  days = 14,
  includeDate,
  now = new Date(),
}: {
  days?: number;
  includeDate?: string | null;
  now?: Date;
} = {}): DateOption[] {
  const today = getIsraelDateValue(now);
  const options = Array.from({ length: days }, (_item, index) => {
    const date = addDays(parseIsraelDateValue(today), index);
    const value = getIsraelDateValue(date);

    return {
      description: getRelativeDateDescription(value, now),
      label: formatIsraelDateOptionLabel(date),
      value,
    };
  });

  if (includeDate && !options.some((option) => option.value === includeDate) && includeDate >= today) {
    const includedDate = parseIsraelDateValue(includeDate);

    options.push({
      description: getRelativeDateDescription(includeDate, now),
      label: formatIsraelDateOptionLabel(includedDate),
      value: includeDate,
    });
  }

  return options.sort((left, right) => left.value.localeCompare(right.value));
}

export function buildStartTimeOptions({
  includeTime,
  matchDate,
  now = new Date(),
}: {
  includeTime?: string | null;
  matchDate?: string | null;
  now?: Date;
} = {}): TimeOption[] {
  const baseTimes = buildHalfHourTimes(6, 22);
  const times = includeTime && !baseTimes.includes(includeTime)
    ? [includeTime, ...baseTimes].sort()
    : baseTimes;

  return times
    .filter((time) => !matchDate || isFutureLobbyStart(matchDate, time, now) || time === includeTime)
    .map((time) => ({
      description: getTimeDescription(time),
      label: time,
      value: time,
    }));
}

export function isFutureLobbyStart(matchDate: string, startTime: string, now = new Date()) {
  return new Date(buildLobbyStartsAt(matchDate, startTime)).getTime() > now.getTime();
}

export function isFutureStartsAt(startsAt: string, now = new Date()) {
  const startsAtTime = new Date(startsAt).getTime();

  return !Number.isNaN(startsAtTime) && startsAtTime > now.getTime();
}

export function getMinutesBetweenLobbyStarts(firstStartsAt: string, secondStartsAt: string) {
  const firstTime = new Date(firstStartsAt).getTime();
  const secondTime = new Date(secondStartsAt).getTime();

  if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(firstTime - secondTime) / 60000;
}

export function getMinutesUntilLobbyStart(startsAt: string, now = new Date()) {
  const startTime = new Date(startsAt).getTime();

  if (Number.isNaN(startTime)) {
    return Number.POSITIVE_INFINITY;
  }

  return (startTime - now.getTime()) / 60000;
}

export function getMinutesUntilLobbyCompletion(startsAt: string, now = new Date()) {
  return getMinutesUntilLobbyStart(startsAt, now) + matchCompletionDelayMinutes;
}

export function hasLobbyStarted(startsAt: string, now = new Date()) {
  return getMinutesUntilLobbyStart(startsAt, now) <= 0;
}

export function hasLobbyCompleted(startsAt: string, now = new Date()) {
  return getMinutesUntilLobbyCompletion(startsAt, now) <= 0;
}

export function getEffectiveLobbyStatus(lobby: Pick<Lobby, 'startsAt' | 'status'>, now = new Date()): LobbyStatus {
  if (lobby.status === 'closed' || lobby.status === 'draft') {
    return lobby.status;
  }

  if (hasLobbyCompleted(lobby.startsAt, now)) {
    return 'completed';
  }

  if (hasLobbyStarted(lobby.startsAt, now)) {
    return 'in_progress';
  }

  if (lobby.status === 'completed' || lobby.status === 'in_progress' || lobby.status === 'rating_open') {
    return 'open';
  }

  return lobby.status;
}

export function applyLobbyLifecycle(lobby: Lobby, now = new Date()): Lobby {
  const status = getEffectiveLobbyStatus(lobby, now);

  return status === lobby.status ? lobby : { ...lobby, status };
}

export function isLobbyBeforeStart(lobby: Pick<Lobby, 'startsAt'>, now = new Date()) {
  return !hasLobbyStarted(lobby.startsAt, now);
}

export function isLobbyReadyForRatings(lobby: Pick<Lobby, 'startsAt' | 'status'>, now = new Date()) {
  return getEffectiveLobbyStatus(lobby, now) === 'completed';
}

export function isEveningLobbyStart(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt.includes('19:');
  }

  return Number(getIsraelTimeValue(date).slice(0, 2)) >= 18;
}

function padTime(value: number) {
  return value.toString().padStart(2, '0');
}

function getIsraelDateValue(date: Date) {
  const parts = getIsraelDateParts(date);

  return `${parts.year}-${padTime(parts.month)}-${padTime(parts.day)}`;
}

function getIsraelTimeValue(date: Date) {
  const parts = getIsraelDateParts(date);

  return `${padTime(parts.hour)}:${padTime(parts.minute)}`;
}

function getIsraelDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    timeZone: israelTimeZone,
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    month: Number(values.month),
    year: Number(values.year),
  };
}

function formatIsraelMonthDay(date: Date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    timeZone: israelTimeZone,
  }).format(date);
}

function formatIsraelDateOptionLabel(date: Date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    timeZone: israelTimeZone,
    weekday: 'short',
  }).format(date);
}

function getRelativeDateDescription(dateValue: string, now: Date) {
  const todayValue = getIsraelDateValue(now);
  const tomorrowValue = getIsraelDateValue(addDays(now, 1));

  if (dateValue === todayValue) {
    return 'Today';
  }

  if (dateValue === tomorrowValue) {
    return 'Tomorrow';
  }

  return undefined;
}

function parseIsraelDateValue(dateValue: string) {
  return new Date(`${dateValue}T12:00:00${getIsraelOffsetForDate(dateValue)}`);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function buildHalfHourTimes(startHour: number, endHour: number) {
  const times: string[] = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    times.push(`${padTime(hour)}:00`);
    times.push(`${padTime(hour)}:30`);
  }

  return times;
}

function getTimeDescription(time: string) {
  const hour = Number(time.slice(0, 2));

  if (hour < 12) {
    return 'Morning';
  }

  if (hour < 17) {
    return 'Afternoon';
  }

  return 'Evening';
}

function getIsraelOffsetForDate(dateValue: string) {
  const probeDate = new Date(`${dateValue}T12:00:00+03:00`);
  const timeZoneName = new Intl.DateTimeFormat('en', {
    timeZone: israelTimeZone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(probeDate)
    .find((part) => part.type === 'timeZoneName')?.value;
  const match = timeZoneName?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);

  if (!match) {
    return '+03:00';
  }

  const sign = match[1];
  const hours = padTime(Number(match[2]));
  const minutes = match[3] ?? '00';

  return `${sign}${hours}:${minutes}`;
}
