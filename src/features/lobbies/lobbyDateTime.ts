const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatLobbyStart(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt;
  }

  return `${dayLabels[date.getDay()]} ${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
}

export function getLobbyLocalDateValue(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt.slice(0, 10);
  }

  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`;
}

export function getLobbyLocalTimeValue(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt.slice(11, 16);
  }

  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
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

export function isEveningLobbyStart(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt.includes('19:');
  }

  return date.getHours() >= 18;
}

function padTime(value: number) {
  return value.toString().padStart(2, '0');
}
