import React, { ChangeEvent, useEffect, useState } from 'react'
import { GameState } from "../../routes/GameRoutes"
import { useHistory } from 'react-router-dom'
import { Game, getGames } from "./gameActions"

type GameProps = {
    gameState: GameState
    setGameState: (gameState: GameState) => void
}

export const Games = (props: GameProps) => {
    const [loading, setLoading] = useState(true)
    const [games, setGames] = useState<Array<Game>>([])
    const [playerName, setPlayerName] = useState()
    const [error, setError] = useState(false)
    const history = useHistory()

    useEffect(init, [])

    if (loading) {
        return <p>Loading...</p>
    }

    if (!games || games.length === 0) {
        return <p>No games available right now, stay tuned!</p>
    }

    return (
        <div>
            <div className="form-group">
                <label htmlFor="name">Player name</label>
                <input type="text" className="form-control" onChange={handleChange}/>
                {error && <small>Please enter a name</small>}
            </div>
            <ul className="list-group">
                {games.map((game: Game) => {
                    return (
                        <li key={game.id} className="list-group-item">
                            {game.name}
                            <button className="btn btn-secondary" onClick={() => joinGame(game.id)}>Join</button>
                        </li>
                    )
                })}
            </ul>
        </div>
    )

    function init() {
        getGames().then(games => {
            const openGames = games.filter(game => game.status === 'OPEN')
            setGames(openGames)
            setLoading(false)
        }).catch(() => {
            history.push('/')
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
        }).then((response) => {
            if (response.status === 200) {
                response.json().then(json => {
                    localStorage.setItem('gameId', gameId)
                    localStorage.setItem('playerId', json.playerId)
                    props.setGameState({...props.gameState, gameId, playerId: json.playerId})
                    history.push('/waiting-room')
                })
            }
        })
    }
}
