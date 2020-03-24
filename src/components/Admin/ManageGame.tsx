import React, { useState } from "react"
import { useParams } from "react-router-dom"

enum GameStatus {
    OPEN_TO_PLAYERS = 'Open',
    ASSIGNING_TICKETS = 'Assigning tickets',
    TICKETS_ASSIGNED = 'Tickets assigned',
    GENERATING_TRACK = 'Generating track',
    READY_TO_START = 'Ready to start',
    GAME_STARTED = 'Game started',
    ERROR = 'Error'
}

export const ManageGame = () => {
    const {gameId} = useParams()
    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.OPEN_TO_PLAYERS)

    return (
        <div>
            <div className="alert alert-info">
                Current status: {gameStatus}
            </div>
            {getActionForStatus()}
        </div>
    )

function getActionForStatus() {
    let buttonType, onclickFunction, label

    switch(gameStatus) {
        case GameStatus.OPEN_TO_PLAYERS:
            buttonType = 'primary'
            onclickFunction = generateAndAssignTickets
            label = 'Generate and assign tickets'
            break

        case GameStatus.TICKETS_ASSIGNED:
            buttonType = 'primary'
            onclickFunction = generateTrack
            label = 'Generate track'
            break

        case GameStatus.READY_TO_START:
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
                    setGameStatus(GameStatus.TICKETS_ASSIGNED)
                } else {
                    setGameStatus(GameStatus.ERROR)
                }
            })
    }

    function generateTrack() {

    }

    function startGame() {

    }
}