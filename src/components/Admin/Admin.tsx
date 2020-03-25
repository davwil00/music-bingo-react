import React, { useEffect, useState } from "react"
import { Game, getGames } from "../Games/gameActions"
import { useHistory } from "react-router-dom"

export function Admin() {
    const [games, setGames] = useState<Array<Game>>([])
    const history = useHistory()
    useEffect(init, [])

    return (
        <div>
            <h1>Games</h1>
            {games && <ul className="list-group">
                {games.map(game =>
                    <li key={game.id}
                        className="list-group-item">
                        <button className="btn btn-link" onClick={() => history.push(`/admin/game/${game.id}`)}>{game.name}</button>
                    </li>)}
            </ul>}
            <button className="btn btn-primary">Create Game</button>

        </div>
    )

    function init() {
        getGames(setGames)
    }
}