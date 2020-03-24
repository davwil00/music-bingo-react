import React, { ChangeEvent, useEffect, useState } from 'react'
import { GameState } from "../../App"
import { useHistory } from 'react-router-dom'

type Game = {
    _id: string
    name: string
}

type GameProps = {
    ws: WebSocket
    gameState: GameState
}

export const Games = (props: GameProps) => {
    const [loading, setLoading] = useState(true)
    const [games, setGames] = useState([])
    const [playerName, setPlayerName] = useState()
    const [error, setError] = useState(false)
    const history = useHistory()

    useEffect(init, [])

    if (loading) {
        return <p>Loading...</p>
    }

    if (!games) {
        return <p>No games available right now, stay tuned!</p>
    }

    return (
        <div>
            <p>some games! {games.length}</p>
            <div className="form-group">
                <label htmlFor="name">Player name</label>
                <input type="text" className="form-control" onChange={handleChange} />
                {error && <small>Please enter a name</small>}
            </div>
        <ul>
            {games.map((game: Game) => {
                return (
                    <li key={game._id}>
                        {game.name}
                        <button onClick={() => joinGame(game._id)}>Join</button>
                    </li>
                )}
            )}
        </ul>
        </div>
    )

    function init() {
        fetch(`/api/games`).then(response => {
            response.json().then(body => {
                setGames(body)
                setLoading(false)
            })
        })
    }

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        setPlayerName(e.target.value)
        setError(false)
    }

    function joinGame(gameId: string) {
        if (!playerName) {
            setError(true)
            return
        }

        fetch(`/api/game/${gameId}/join`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                playerId: props.gameState.playerId,
                playerName: playerName
            })
        }).then(() => {
            history.push('/waiting-room')
        })
    }
}
