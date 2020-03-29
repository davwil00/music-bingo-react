export type Game = {
    id: string
    name: string
    status: string
}

export type Player = {
    id: string,
    name: string
}

export function getGames(): Promise<Array<Game>> {
    return fetch('/api/games').then(response => response.json())
}

export function getPlayers(gameId?: string): Promise<Array<Player>> {
    if (gameId) {
        return fetch(`/api/game/${gameId}/players`).then(response => response.json())
    }
    return Promise.reject()
}