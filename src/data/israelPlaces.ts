export type IsraelLocationOption = {
  aliases: string[];
  area: string;
  city: string;
  displayName: string;
  id: string;
  latitude: number;
  longitude: number;
};

export type IsraelBeachOption = {
  aliases: string[];
  area: string;
  city: string;
  displayName: string;
  id: string;
  latitude: number;
  locationId: string;
  longitude: number;
};

export const israelLocations: IsraelLocationOption[] = [
  {
    aliases: ['tel aviv', 'tlv', 'tel aviv yafo', '×ª×œ ××‘×™×‘', '×ª×œ ××‘×™×‘ ×™×¤×•'],
    area: 'Central Israel',
    city: 'Tel Aviv-Yafo',
    displayName: 'Tel Aviv-Yafo, Central Israel',
    id: 'tel-aviv-yafo',
    latitude: 32.0853,
    longitude: 34.7818,
  },
  {
    aliases: ['haifa', '×—×™×¤×”'],
    area: 'North coast',
    city: 'Haifa',
    displayName: 'Haifa, North coast',
    id: 'haifa',
    latitude: 32.794,
    longitude: 34.9896,
  },
  {
    aliases: ['holon', 'hulon', 'ulon', '×—×•×œ×•×Ÿ'],
    area: 'Central Israel',
    city: 'Holon',
    displayName: 'Holon, Central Israel',
    id: 'holon',
    latitude: 32.0158,
    longitude: 34.7874,
  },
  {
    aliases: ['bat yam', 'bat-yam', '×‘×ª ×™×'],
    area: 'Central Israel',
    city: 'Bat Yam',
    displayName: 'Bat Yam, Central Israel',
    id: 'bat-yam',
    latitude: 32.0167,
    longitude: 34.75,
  },
  {
    aliases: ['rishon lezion', 'rishon le zion', 'rishon', '×¨××©×•×Ÿ ×œ×¦×™×•×Ÿ'],
    area: 'Central Israel',
    city: 'Rishon LeZion',
    displayName: 'Rishon LeZion, Central Israel',
    id: 'rishon-lezion',
    latitude: 31.973,
    longitude: 34.7925,
  },
  {
    aliases: ['herzliya', 'hertzliya', '×”×¨×¦×œ×™×”'],
    area: 'Sharon',
    city: 'Herzliya',
    displayName: 'Herzliya, Sharon',
    id: 'herzliya',
    latitude: 32.1663,
    longitude: 34.8433,
  },
  {
    aliases: ['netanya', '× ×ª× ×™×”'],
    area: 'Sharon',
    city: 'Netanya',
    displayName: 'Netanya, Sharon',
    id: 'netanya',
    latitude: 32.3215,
    longitude: 34.8532,
  },
  {
    aliases: ['caesarea', 'cesarea', 'keysarya', '×§×™×¡×¨×™×”'],
    area: 'North coast',
    city: 'Caesarea',
    displayName: 'Caesarea, North coast',
    id: 'caesarea',
    latitude: 32.5189,
    longitude: 34.9046,
  },
  {
    aliases: ['ashdod', '××©×“×•×“'],
    area: 'South coast',
    city: 'Ashdod',
    displayName: 'Ashdod, South coast',
    id: 'ashdod',
    latitude: 31.8044,
    longitude: 34.6553,
  },
  {
    aliases: ['ashkelon', '××©×§×œ×•×Ÿ'],
    area: 'South coast',
    city: 'Ashkelon',
    displayName: 'Ashkelon, South coast',
    id: 'ashkelon',
    latitude: 31.6688,
    longitude: 34.5743,
  },
  {
    aliases: ['jerusalem', 'yerushalayim', '×™×¨×•×©×œ×™×'],
    area: 'Jerusalem area',
    city: 'Jerusalem',
    displayName: 'Jerusalem, Jerusalem area',
    id: 'jerusalem',
    latitude: 31.7683,
    longitude: 35.2137,
  },
  {
    aliases: ['beer sheva', 'beersheba', 'be er sheva', '×‘××¨ ×©×‘×¢'],
    area: 'South',
    city: 'Beersheba',
    displayName: 'Beersheba, South',
    id: 'beersheba',
    latitude: 31.2529,
    longitude: 34.7915,
  },
];

export const israelBeaches: IsraelBeachOption[] = [
  {
    aliases: ['gordon', 'gordon beach', 'hof gordon', '×—×•×£ ×’×•×¨×“×•×Ÿ', '×’×•×¨×“×•×Ÿ'],
    area: 'Tel Aviv coast',
    city: 'Tel Aviv-Yafo',
    displayName: 'Gordon Beach',
    id: 'gordon-beach',
    latitude: 32.0826,
    locationId: 'tel-aviv-yafo',
    longitude: 34.7681,
  },
  {
    aliases: ['hilton', 'hilton beach', 'hof hilton', '×—×•×£ ×”×™×œ×˜×•×Ÿ', '×”×™×œ×˜×•×Ÿ'],
    area: 'Tel Aviv coast',
    city: 'Tel Aviv-Yafo',
    displayName: 'Hilton Beach',
    id: 'hilton-beach',
    latitude: 32.0915,
    locationId: 'tel-aviv-yafo',
    longitude: 34.7691,
  },
  {
    aliases: ['poleg', 'poleg beach', 'hof poleg', '×—×•×£ ×¤×•×œ×’', '×¤×•×œ×’'],
    area: 'Sharon coast',
    city: 'Netanya',
    displayName: 'Poleg Beach',
    id: 'poleg-beach',
    latitude: 32.2766,
    locationId: 'netanya',
    longitude: 34.8465,
  },
  {
    aliases: ['aqueduct', 'aqueduct beach', 'caesarea aqueduct', '×—×•×£ ×”××§×•×•×“×•×§×˜', '××§×•×•×“×•×§×˜', '×§×™×¡×¨×™×”'],
    area: 'North coast',
    city: 'Caesarea',
    displayName: 'Aqueduct Beach',
    id: 'aqueduct-beach',
    latitude: 32.5068,
    locationId: 'caesarea',
    longitude: 34.8915,
  },
  {
    aliases: ['frishman', 'frishman beach', 'hof frishman', '×—×•×£ ×¤×¨×™×©×ž×Ÿ', '×¤×¨×™×©×ž×Ÿ'],
    area: 'Tel Aviv coast',
    city: 'Tel Aviv-Yafo',
    displayName: 'Frishman Beach',
    id: 'frishman-beach',
    latitude: 32.0804,
    locationId: 'tel-aviv-yafo',
    longitude: 34.7665,
  },
  {
    aliases: ['jerusalem beach', 'geula beach', 'hof yerushalayim', '×—×•×£ ×™×¨×•×©×œ×™×', '×™×¨×•×©×œ×™×'],
    area: 'Tel Aviv coast',
    city: 'Tel Aviv-Yafo',
    displayName: 'Jerusalem Beach',
    id: 'jerusalem-beach',
    latitude: 32.0735,
    locationId: 'tel-aviv-yafo',
    longitude: 34.7635,
  },
  {
    aliases: ['dado', 'dado beach', 'hof dado', '×—×•×£ ×“×“×•', '×“×“×•'],
    area: 'North coast',
    city: 'Haifa',
    displayName: 'Dado Beach',
    id: 'dado-beach',
    latitude: 32.793,
    locationId: 'haifa',
    longitude: 34.9577,
  },
  {
    aliases: ['bat galim', 'bat galim beach', 'hof bat galim', '×—×•×£ ×‘×ª ×’×œ×™×', '×‘×ª ×’×œ×™×'],
    area: 'North coast',
    city: 'Haifa',
    displayName: 'Bat Galim Beach',
    id: 'bat-galim-beach',
    latitude: 32.8338,
    locationId: 'haifa',
    longitude: 34.9812,
  },
  {
    aliases: ['marina herzliya', 'herzliya beach', 'hof herzliya', '×—×•×£ ×”×¨×¦×œ×™×”', '×”×¨×¦×œ×™×”'],
    area: 'Sharon coast',
    city: 'Herzliya',
    displayName: 'Herzliya Beach',
    id: 'herzliya-beach',
    latitude: 32.1657,
    locationId: 'herzliya',
    longitude: 34.7963,
  },
  {
    aliases: ['tayo', 'tayo beach', 'bat yam beach', 'hof tayo', '×—×•×£ ×ª××™×•', '×ª××™×•', '×‘×ª ×™×'],
    area: 'Central coast',
    city: 'Bat Yam',
    displayName: 'Tayo Beach',
    id: 'tayo-beach',
    latitude: 32.0013,
    locationId: 'bat-yam',
    longitude: 34.7389,
  },
  {
    aliases: ['delilah', 'delila', 'ashkelon beach', 'hof delilah', '×—×•×£ ×“×œ×™×œ×”', '×“×œ×™×œ×”'],
    area: 'South coast',
    city: 'Ashkelon',
    displayName: 'Delilah Beach',
    id: 'delilah-beach',
    latitude: 31.6794,
    locationId: 'ashkelon',
    longitude: 34.5604,
  },
  {
    aliases: ['liddo', 'lido', 'ashdod beach', 'hof lido', '×—×•×£ ×œ×™×“×•', '×œ×™×“×•'],
    area: 'South coast',
    city: 'Ashdod',
    displayName: 'Lido Beach',
    id: 'lido-beach',
    latitude: 31.8057,
    locationId: 'ashdod',
    longitude: 34.6341,
  },
];

export function searchIsraelLocations(query: string, limit = 5) {
  const normalizedQuery = normalizePlaceSearch(query);

  if (!normalizedQuery) {
    return [];
  }

  return israelLocations
    .map((location) => ({
      location,
      score: getLocationSearchScore(location, normalizedQuery),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.location.displayName.localeCompare(b.location.displayName))
    .slice(0, limit)
    .map((result) => result.location);
}

export function getRecommendedIsraelBeaches(locationId?: string | null, limit = 6) {
  if (!locationId) {
    return [];
  }

  return israelBeaches.filter((beach) => beach.locationId === locationId).slice(0, limit);
}

export function searchIsraelBeaches(query: string, limit = 6) {
  const normalizedQuery = normalizePlaceSearch(query);

  if (!normalizedQuery) {
    return [];
  }

  return israelBeaches
    .map((beach) => ({
      beach,
      score: getBeachSearchScore(beach, normalizedQuery),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.beach.displayName.localeCompare(b.beach.displayName))
    .slice(0, limit)
    .map((result) => result.beach);
}

function getLocationSearchScore(location: IsraelLocationOption, normalizedQuery: string) {
  const searchableValues = [
    location.city,
    location.displayName,
    location.area,
    ...location.aliases,
  ].map(normalizePlaceSearch);

  return getSearchScore(searchableValues, normalizedQuery);
}

function getBeachSearchScore(beach: IsraelBeachOption, normalizedQuery: string) {
  const location = israelLocations.find((item) => item.id === beach.locationId);
  const locationValues = [
    location?.city,
    location?.displayName,
    location?.area,
    ...(location?.aliases ?? []),
  ].filter(Boolean).map((value) => normalizePlaceSearch(value as string));
  const locationScore = getSearchScore(locationValues, normalizedQuery);

  if (locationScore >= 75) {
    return 90;
  }

  if (locationScore > 0) {
    return 65;
  }

  const searchableValues = [
    beach.city,
    beach.displayName,
    beach.area,
    ...beach.aliases,
  ].map(normalizePlaceSearch);

  return getSearchScore(searchableValues, normalizedQuery);
}

function getSearchScore(searchableValues: string[], normalizedQuery: string) {
  if (searchableValues.some((value) => value === normalizedQuery)) {
    return 100;
  }

  if (searchableValues.some((value) => value.startsWith(normalizedQuery))) {
    return 75;
  }

  if (searchableValues.some((value) => value.includes(normalizedQuery))) {
    return 50;
  }

  return 0;
}

function normalizePlaceSearch(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-'".,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
