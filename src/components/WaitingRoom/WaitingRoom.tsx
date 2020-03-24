import React, { useEffect } from 'react'
import { GameState } from "../../App"

type WaitingRoomProps = {
    currentPlayers: Array<string>
    gameState: GameState
    setGameState: (gameState: GameState) => void
}

export const WaitingRoom = (props: WaitingRoomProps) => {
    useEffect(getPlayers, [])
    return (
        <div>
            <h1>Waiting Room</h1>
            <div className="alert alert-info">Waiting for other players to join</div>
            <h2>Current Players</h2>
            <ul className="list-group">
                {props.currentPlayers.map((player, i) =>
                    <li key={i} className="list-group-item">{player}</li>)
                }
            </ul>
        </div>
    )

    function getPlayers() {
        const {setGameState, gameState} = props

        fetch(`/api/game/${gameState.gameId}/players`).then((response) => {
            if (response.status === 200) {
                response.json().then(json => {
                    setGameState({...gameState, players: json.players})
                })
            }
        })
    }
}