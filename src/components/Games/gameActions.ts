export type Game = {
    id: string
    name: string
    status: GameStatus
    players?: Array<Player>
    playlist?: Playlist
}

export type Player = {
    id: string,
    name: string,
    bingoSheet?: Array<Track>
}

export type Playlist = {
    id: string,
    name: string,
    tracks: Array<Track>
}

export type Track = {
    id: string,
    artist: string,
    title: string,
    previewUrl: string
}

const gameStatuses = {
    CREATED: 'Created',
    GENERATING_TRACK: 'Generating track',
    OPEN: 'Open',
    ASSIGNING_TICKETS: 'Assigning tickets',
    ASSIGNED: 'Tickets assigned',
    READY: 'Ready to start',
    IN_PROGRESS: 'Game in progress',
    ERROR: 'Error',
    UNKNOWN: 'Unknown'
}

export type GameStatus = keyof typeof gameStatuses

export function getGames(): Promise<Array<Game>> {
    return fetch('/api/games').then(response => response.json())
}

export function getPlayers(gameId?: string): Promise<Array<Player>> {
    if (gameId) {
        return fetch(`/api/game/${gameId}/players`).then(response => response.json())
    }
    return Promise.reject()
}

export function getGame(gameId?: string): Promise<Game> {
    if (gameId) {
        return fetch(`/api/game/${gameId}`).then(response => response.json())
    }
    return Promise.reject()
}