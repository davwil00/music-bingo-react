import { GameState } from "../../routes/GameRoutes"
import { Dispatch, SetStateAction } from "react"
import * as H from "history"

interface Message {
    action: string,
    payload: any
}

export function processMessage(message: Message, setGameState: Dispatch<SetStateAction<GameState>>, history: H.History) {
    console.log(message)
    const payload = message.payload

    switch (message.action) {
        case 'ASSIGN_TICKET':
            setGameState(gameState => ({...gameState, status: 'ASSIGNED'}))
            break

        case 'UPDATE_PLAYERS':
            setGameState(gameState => ({...gameState, players: payload}))
            break

        case 'START_GAME':
            setGameState(gameState => ({...gameState, status: 'READY'}))
            break

        case 'TEST_AUDIO':
            setGameState(gameState => ({...gameState, playTestAudio: true}))
            break

        case 'HOUSE_CALLED':
            setGameState(gameState => ({...gameState, houseCalledByPlayer: payload.playerName}))
            break
    }
}