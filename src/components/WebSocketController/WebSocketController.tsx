import React from 'react'
import { useHistory } from 'react-router-dom'
import { GameState } from "../../App"

interface Message {
    action: string,
    payload: any
}

type WebSocketProps = {
    ws: WebSocket
    gameState: GameState
    setGameState: (gameState: GameState) => void
}

export const WebSocketController = (props: WebSocketProps) => {
    const history = useHistory()
    props.ws.onmessage = (message) => {
        if (message.data) {
            processMessage(JSON.parse(message.data))
        }
    }

    return(<></>)

    function processMessage(message: Message) {
        console.log(message)
        const gameState = props.gameState
        const payload = message.payload

        switch (message.action) {
            case 'ASSIGN_PLAYER_ID':
                props.gameState.playerId = payload.playerId
                break

            case 'UPDATE_PLAYERS':
                props.setGameState({...gameState, players: payload})
                break

            case 'ASSIGN_TICKET':
                const {gameId, playerId} = gameState
                if (gameId && playerId) {
                    history.push(`/play/${gameId}/${playerId}`)
                }
                break
            
            case 'START_GAME':
                props.setGameState({...gameState, started: true})
                break

            case 'HOUSE_CALLED':
                props.setGameState({...gameState, houseCalledByPlayer: payload.playerName})
                break
        }
    }
}

