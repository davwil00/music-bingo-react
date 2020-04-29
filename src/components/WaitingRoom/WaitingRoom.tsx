import React, { useEffect, SetStateAction, Dispatch } from 'react'
import { GameState } from "../../routes/GameRoutes"
import { getPlayers, GameStatus } from "../Games/gameActions"
import { useHistory } from 'react-router-dom'

type WaitingRoomProps = {
    gameState: GameState
    setGameState: Dispatch<SetStateAction<GameState>>
}

export const WaitingRoom = (props: WaitingRoomProps) => {
    useEffect(init, [])
    const history = useHistory()
    const {players, status} = props.gameState

    return (
        <div>
            <h1>Waiting Room</h1>
            <div className="alert alert-info">Waiting for other players to join</div>
            <h2>Current Players</h2>
            {players && <ul className="list-group">
                {players.map((player, i) =>
                    <li key={player.id} className="list-group-item">{player.name}</li>)
                }
            </ul>}
            {status === 'ASSIGNED' && 
            <>
                You have a ticket
                <button onClick={() => history.push('/play')} className="btn btn-primary">Start Game</button>
            </>
            }
        </div>
    )

    function init() {
        const {gameState, setGameState} = props
        getPlayers(gameState.gameId).then(players =>
            setGameState({...gameState, players})
        ).catch(() => {
            history.push('/')
        })

        fetch(`/api/game/${gameState.gameId}/status`)
            .then(response => response.json()
            .then(status => setGameState(gameState => ({...gameState, status: status.status})))
            ).catch(() => {
                history.push('/')
            })

    }
}