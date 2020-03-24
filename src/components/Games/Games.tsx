import React, { ChangeEvent, useEffect, useState } from 'react'
import { GameState } from "../../App"
import { useHistory } from 'react-router-dom'

type Game = {
    _id: string
    name: string
}

type GameProps = {
    gameState: GameState
    setGameState: (gameState: GameState) => void
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
        const gameId = localStorage.getItem('gameId')
        const playerId = localStorage.getItem('playerId')

        fetch(`/api/validate?gameId=${gameId}&playerId=${playerId}`).then(response => {
            if (response.status === 200) {
                response.json().then(json => {
                    if (json.status === 'ASSIGNED' || json.status === 'READY') {
                        history.push(`/play/${gameId}/${playerId}`)
                    } else if (json.status === 'OPEN') {
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
        }).then((response) => {
            if (response.status === 200) {
                response.json().then(json => {
                    localStorage.setItem('gameId', gameId)
                    localStorage.setItem('playerId', json.playerId)
                    props.setGameState({...props.gameState, playerId: json.playerId})
                    history.push('/waiting-room')
                })
            }
        })
    }
}
