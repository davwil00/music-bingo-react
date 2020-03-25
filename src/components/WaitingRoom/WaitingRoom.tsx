import React, { useEffect } from 'react'
import { GameState } from "../../App"
import { getPlayers, rehydrateState } from "../Games/gameActions"
import { useHistory } from 'react-router-dom'

type WaitingRoomProps = {
    gameState: GameState
    setGameState: (gameState: GameState) => void
}

export const WaitingRoom = (props: WaitingRoomProps) => {
    useEffect(init, [])
    const history = useHistory()
    const players = props.gameState.players

    return (
        <div>
            <h1>Waiting Room</h1>
            <div className="alert alert-info">Waiting for other players to join</div>
            <h2>Current Players</h2>
            {players && <ul className="list-group">
                {players.map((player, i) =>
                    <li key={i} className="list-group-item">{player}</li>)
                }
            </ul>}
        </div>
    )

    function init() {
        const {gameState, setGameState} = props
        rehydrateState(gameState, setGameState, history)
        gameState.gameId && getPlayers(gameState.gameId, players => setGameState({...gameState, players}))
    }
}