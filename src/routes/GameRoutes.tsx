import { Route, Switch, useHistory } from "react-router-dom"
import { WaitingRoom } from "../components/WaitingRoom/WaitingRoom"
import { BingoSheet } from "../components/Bingo/BingoSheet"
import React, { useEffect, useState } from "react"
import { processMessage } from "../components/WebSockets/GameMessageProcessor"
import { Player } from "../components/Games/gameActions"
import { Games } from "../components/Games/Games"

export interface GameState {
    gameId?: string
    playerId?: string
    players: Array<Player>
    ticketNo?: number,
    started: boolean,
    houseCalledByPlayer?: string
    playTestAudio: boolean
}

export const GameRoutes = () => {
    const [gameState, setGameState] = useState<GameState>({players: [], started: false, playTestAudio: false})
    const [webSocket, setWebSocket] = useState<WebSocket>()
    useEffect(init, [])
    useEffect(setPlayerId, [gameState.playerId, webSocket])
    const history = useHistory()

    return (
        <Switch>
            <Route exact path={'/waiting-room'}>
                <WaitingRoom gameState={gameState}
                             setGameState={setGameState} />
            </Route>

            <Route path={'/play'}>
                <BingoSheet gameState={gameState}
                            setGameState={setGameState}
                            ws={webSocket!} />
            </Route>

            <Route exact path='/'>
                <Games gameState={gameState}
                       setGameState={setGameState}/>
            </Route>
        </Switch>
    )

    function init() {
        initWebSocket()

        if (!gameState.gameId || !gameState.playerId) {
            const gameId = localStorage.getItem('gameId') || undefined
            const playerId = localStorage.getItem('playerId') || undefined
            setGameState({...gameState, gameId, playerId})
        }
    }

    function initWebSocket() {
        const port = process.env.NODE_ENV === 'development' ? ':8002' : ''
        const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}${port}/socket`)
        ws.onopen = () => {
            setWebSocket(ws)
            console.log('web socket opened')
        }
        ws.onclose = () => {
            setWebSocket(undefined)
        }
        ws.onmessage = (message) => {
            if (message.data) {
                processMessage(JSON.parse(message.data), setGameState, history)
            }
        }
    }

    function setPlayerId() {
        console.log('player id has changed')
        if (webSocket && gameState.playerId) {
            webSocket?.send(JSON.stringify({action: 'SET_PLAYER_ID', payload: gameState.playerId}))
        } else {
            if (!webSocket) {
                console.log('ws is undefined')
            }
            if (!gameState.playerId) {
                console.log('playerId is undefined')
            }
        }
    }
}