import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from 'react'
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

function handleChange(e: ChangeEvent<HTMLInputElement>, setter: Dispatch<SetStateAction<string>>) {
    setter(e.target.value)
}

export const Games = (props: GameProps) => {
    const [loading, setLoading] = useState(true)
    const [games, setGames] = useState([])
    const [playerName, setPlayerName] = useState()
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
            <label>
                <input type="text" onChange={(e) => handleChange(e, setPlayerName)} />
                Player name
            </label>
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

    function joinGame(gameId: string) {
        // const data = {
        //     action: 'JOIN_GAME',
        //     payload: {
        //         gameId: gameId,
        //         playerName: playerName
        //     }
        // }
        //
        // props.ws.send(JSON.stringify(data))
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
