import { Route, Switch, useHistory } from "react-router-dom"
import { WaitingRoom } from "../components/WaitingRoom/WaitingRoom"
import { BingoSheet } from "../components/Bingo/BingoSheet"
import React, { useEffect, useState } from "react"
import { processMessage } from "../components/WebSockets/GameMessageProcessor"
import { Player, GameStatus } from "../components/Games/gameActions"
import { Games } from "../components/Games/Games"
import { Loading } from "../components/Loading/Loading"

export interface GameState {
    gameId?: string
    playerId?: string
    players: Array<Player>
    ticketNo?: number,
    status: GameStatus,
    houseCalledByPlayer?: string
    playTestAudio: boolean
}

export const GameRoutes = () => {
    const [gameState, setGameState] = useState<GameState>({players: [], status: 'UNKNOWN', playTestAudio: false})
    const [webSocket, setWebSocket] = useState<WebSocket>()
    useEffect(init, [])
    useEffect(setPlayerId, [gameState.playerId])
    const history = useHistory()
    rehydrate()

    return (
        <Switch>
            <Route exact path={'/waiting-room'}>
                <WaitingRoom gameState={gameState}
                             setGameState={setGameState} />
            </Route>

            <Route path={'/play'}>
                {webSocket ?
                    <BingoSheet gameState={gameState}
                                setGameState={setGameState}
                                ws={webSocket} />
                : <Loading />
                }
            </Route>

            <Route exact path='/'>
                <Games gameState={gameState}
                       setGameState={setGameState}/>
            </Route>
        </Switch>
    )

    function init() {
        initWebSocket()
        rehydrate()
    }

    function rehydrate() {
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
            keepAlive()
        }
        ws.onclose = () => {
            setWebSocket(undefined)
            setTimeout(initWebSocket, 1000) 
        }
        ws.onmessage = (message) => {
            if (message.data) {
                processMessage(JSON.parse(message.data), setGameState, history)
            }
        }
    }

    function setPlayerId() {
        console.log(`player id has changed - ${gameState.playerId}`)
        if (webSocket && gameState.playerId) {
            webSocket?.send(JSON.stringify({action: 'SET_PLAYER_ID', payload: gameState.playerId}))
        }
    }

    function keepAlive() {
        if (webSocket && webSocket.OPEN) {
            webSocket.send(JSON.stringify({action: 'KEEP_ALIVE', payload: gameState.playerId}))
            setTimeout(keepAlive, 1000)
        }
    }
}