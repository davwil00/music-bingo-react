import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getPlayers } from "../Games/gameActions"

enum GameStatus {
    OPEN = 'Open',
    ASSIGNING_TICKETS = 'Assigning tickets',
    ASSIGNED = 'Tickets assigned',
    GENERATING_TRACK = 'Generating track',
    READY = 'Ready to start',
    IN_PROGRESS = 'Game in progress',
    ERROR = 'Error'
}

export const ManageGame = () => {
    const {gameId} = useParams()
    const [gameStatus, setGameStatus] = useState<GameStatus>()
    const [players, setPlayers] = useState<Array<string>>([])
    useEffect(init, [])

    return (
        <div>
            <div className="alert alert-info">
                Current status: {gameStatus}
            </div>
            {players &&
                <>
                    {players.length} player(s) connected
                    <ul className="list-group">
                        {players.map((player, i) =>
                            <li key={i} className="list-group-item">{player}</li>
                        )}
                    </ul>
                </>
            }
            {getActionForStatus()}
        </div>
    )

    function init() {
        gameId && getPlayers(gameId, setPlayers)
        fetch(`/api/game/${gameId}/status`).then(response => {
            if (response.status === 200) {
                response.json().then(json => {
                    setGameStatus(json.status)
                })
            }
        })
    }

    function getActionForStatus() {
        let buttonType, onclickFunction, label

        switch(gameStatus) {
            case GameStatus.OPEN:
                buttonType = 'primary'
                onclickFunction = generateAndAssignTickets
                label = 'Generate and assign tickets'
                break

            case GameStatus.ASSIGNED:
                buttonType = 'primary'
                onclickFunction = generateTrack
                label = 'Generate track'
                break

            case GameStatus.READY:
                buttonType = 'success'
                onclickFunction = startGame
                label = 'Start Game'
                break

            default:
                return ''
        }

        return <button className={`btn btn-${buttonType}`} onClick={onclickFunction}>{label}</button>
    }

    function generateAndAssignTickets() {
        setGameStatus(GameStatus.ASSIGNING_TICKETS)
        fetch(`/api/game/${gameId}/assign`, {method: 'POST'})
            .then((response) => {
                if (response.status === 200) {
                    setGameStatus(GameStatus.ASSIGNED)
                } else {
                    setGameStatus(GameStatus.ERROR)
                }
            })
    }

    function generateTrack() {
        setGameStatus(GameStatus.GENERATING_TRACK)
        fetch(`/game/${gameId}/generate-track`, {method: 'POST'}).then(response => {
            if (response.status === 201) {
                setGameStatus(GameStatus.READY)
            }
        })
    }

    function startGame() {
        fetch(`/game/${gameId}/start`, {method: 'POST'}).then(response => {
            if (response.status === 200) {
                setGameStatus(GameStatus.IN_PROGRESS)
            }
        })
    }
}