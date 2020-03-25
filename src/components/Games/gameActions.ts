import { GameState } from "../../App"
import * as H from 'history';

export type Game = {
    id: string
    name: string
}

export function getGames(callback: (games: Array<Game>) => void) {
    fetch('/api/games').then(response => {
        response.json().then(games => {
            callback(games)
        })
    })
}

export function getPlayers(gameId: string, callback: (games: Array<string>) => void) {
    fetch(`/api/game/${gameId}/players`).then(response => {
        if (response.status === 200) {
            response.json().then(games => {
                callback(games)
            })
        }
    })
}

export function rehydrateState(gameState: GameState, setGameState: (gameState: GameState) => void, history: H.History) {
    if (!gameState.gameId || !gameState.playerId) {
        const gameId = localStorage.getItem('gameId')
        const playerId = localStorage.getItem('playerId')

        if (gameId && playerId) {
            fetch(`/api/validate?gameId=${gameId}&playerId=${playerId}`).then(response => {
                if (response.status === 200) {
                    response.json().then(json => {
                        const status = json.status
                        setGameState({...gameState, gameId, playerId})
                        if (status === 'ASSIGNED' || status === 'READY') {
                            history.push(`/play/${gameId}/${playerId}`)
                        } else if (status === 'OPEN') {
                            history.push('/waiting-room')
                        }
                    })
                } else if (response.status === 404) {
                    localStorage.removeItem('gameId')
                    localStorage.removeItem('playerId')
                }
            }).catch(() => {
                console.log('could not validate local storage params')
            })
        }
    }
}