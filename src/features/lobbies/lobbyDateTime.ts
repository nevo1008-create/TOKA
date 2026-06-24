import type { Lobby, LobbyStatus } from '../../types';
import {
  applyLobbyLifecycle as applyLifecycleStatus,
  canJoinedPlayersRateLobby,
  getLobbyLifecycleStatus,
  ratingOpenAfterStartMinutes,
  ratingWindowMinutes,
} from './lobbyLifecycle';

export const matchCompletionDelayMinutes = ratingOpenAfterStartMinutes;

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

  const dateValue = getLocalDateValue(date);
  const todayValue = getLocalDateValue(now);
  const tomorrowValue = getLocalDateValue(addDays(now, 1));
  const timeValue = getLocalTimeValue(date);

  if (dateValue === todayValue) {
    return `Today, ${timeValue}`;
  }

  if (dateValue === tomorrowValue) {
    return `Tomorrow, ${timeValue}`;
  }

  return `${formatLocalMonthDay(date)}, ${timeValue}`;
}

export function getLobbyLocalDateValue(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt.slice(0, 10);
  }

  return getLocalDateValue(date);
}

export function getLobbyLocalTimeValue(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt.slice(11, 16);
  }

  return getLocalTimeValue(date);
}

export function buildLobbyStartsAt(matchDate: string, startTime: string) {
  const date = parseLocalDateTimeValue(matchDate, startTime);

  return Number.isNaN(date.getTime()) ? `${matchDate}T${startTime}:00` : date.toISOString();
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
  const today = getLocalDateValue(now);
  const options = Array.from({ length: days }, (_item, index) => {
    const date = addDays(parseLocalDateValue(today), index);
    const value = getLocalDateValue(date);

    return {
      description: getRelativeDateDescription(value, now),
      label: formatLocalDateOptionLabel(date),
      value,
    };
  });

  if (includeDate && !options.some((option) => option.value === includeDate) && includeDate >= today) {
    const includedDate = parseLocalDateValue(includeDate);

    options.push({
      description: getRelativeDateDescription(includeDate, now),
      label: formatLocalDateOptionLabel(includedDate),
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
  return getMinutesUntilLobbyStart(startsAt, now) + ratingOpenAfterStartMinutes + ratingWindowMinutes;
}

export function hasLobbyStarted(startsAt: string, now = new Date()) {
  return getMinutesUntilLobbyStart(startsAt, now) <= 0;
}

export function hasLobbyCompleted(startsAt: string, now = new Date()) {
  return getMinutesUntilLobbyCompletion(startsAt, now) <= 0;
}

export function getEffectiveLobbyStatus(lobby: Pick<Lobby, 'maxPlayers' | 'participants' | 'startsAt' | 'status'>, now = new Date()): LobbyStatus {
  return getLobbyLifecycleStatus(lobby, now);
}

export function applyLobbyLifecycle(lobby: Lobby, now = new Date()): Lobby {
  return applyLifecycleStatus(lobby, now);
}

export function isLobbyBeforeStart(lobby: Pick<Lobby, 'startsAt'>, now = new Date()) {
  return !hasLobbyStarted(lobby.startsAt, now);
}

export function isLobbyReadyForRatings(lobby: Pick<Lobby, 'matchParticipantIds' | 'maxPlayers' | 'participants' | 'startsAt' | 'status'>, now = new Date()) {
  return canJoinedPlayersRateLobby(lobby, now);
}

export function isEveningLobbyStart(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt.includes('19:');
  }

  return Number(getLocalTimeValue(date).slice(0, 2)) >= 18;
}

function padTime(value: number) {
  return value.toString().padStart(2, '0');
}

function getLocalDateValue(date: Date) {
  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`;
}

function getLocalTimeValue(date: Date) {
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
}

function formatLocalMonthDay(date: Date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function formatLocalDateOptionLabel(date: Date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(date);
}

function getRelativeDateDescription(dateValue: string, now: Date) {
  const todayValue = getLocalDateValue(now);
  const tomorrowValue = getLocalDateValue(addDays(now, 1));

  if (dateValue === todayValue) {
    return 'Today';
  }

  if (dateValue === tomorrowValue) {
    return 'Tomorrow';
  }

  return undefined;
}

function parseLocalDateValue(dateValue: string) {
  const [year, month, day] = parseDateParts(dateValue);

  return new Date(year, month - 1, day, 12);
}

function parseLocalDateTimeValue(dateValue: string, timeValue: string) {
  const [year, month, day] = parseDateParts(dateValue);
  const [hour, minute] = parseTimeParts(timeValue);

  return new Date(year, month - 1, day, hour, minute);
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

function parseDateParts(dateValue: string) {
  return dateValue.split('-').map(Number) as [number, number, number];
}

function parseTimeParts(timeValue: string) {
  return timeValue.split(':').map(Number) as [number, number];
}
