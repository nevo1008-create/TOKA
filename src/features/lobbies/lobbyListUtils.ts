import type { Lobby } from '../../types';

export function getUniqueLobbies(lobbies: Lobby[]) {
  const lobbyKeys = new Set<string>();

  return lobbies.filter((lobby) => {
    const lobbyKey = getLobbyDedupeKey(lobby);

    if (lobbyKeys.has(lobbyKey)) {
      return false;
    }

    lobbyKeys.add(lobbyKey);
    return true;
  });
}

function getLobbyDedupeKey(lobby: Lobby) {
  return [
    normalizeLobbyText(lobby.title),
    normalizeLobbyText(lobby.location.name),
    normalizeLobbyText(lobby.location.city),
    lobby.adminId,
    lobby.startsAt,
  ].join('|');
}

function normalizeLobbyText(value?: string) {
  return value?.trim().toLocaleLowerCase() ?? '';
}
