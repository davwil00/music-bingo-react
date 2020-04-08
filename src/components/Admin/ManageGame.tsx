import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getPlayers, Player } from "../Games/gameActions"
import { processMessage } from "../WebSockets/AdminMessageProcessor"

const gameStatuses = {
    CREATED: 'Created',
    GENERATING_TRACK: 'Generating track',
    OPEN: 'Open',
    ASSIGNING_TICKETS: 'Assigning tickets',
    ASSIGNED: 'Tickets assigned',
    READY: 'Ready to start',
    IN_PROGRESS: 'Game in progress',
    ERROR: 'Error'
}

type GameStatus = keyof typeof gameStatuses

export type ManageGameState = {
    players: Array<Player>
    started: boolean,
    houseCalledByPlayer?: string
    status?: GameStatus,
    audioFailed?: string
}

export const ManageGame = () => {
    const {gameId} = useParams()
    const [manageGameState, setManageGameState] = useState<ManageGameState>({
        players: [],
        started: false,
    })
    useEffect(init, [])
    const {players, status, audioFailed} = manageGameState;

    return (
        <div>
            <div className="alert alert-info">
                Current status: {status}
            </div>
            {!!audioFailed && <div className="alert alert-danger">Test audio failed for {audioFailed}</div>}
            {players &&
                <>
                    {players.length} player(s) connected
                    <ul className="list-group">
                        {players.map(player =>
                            <li key={player.id} className="list-group-item">
                                {player.name}
                                <i onClick={() => removePlayerFromGame(player.id)} className="fas fa-trash-alt"/>
                                <button onClick={() => testAudio(player.id)} className="btn btn-secondary">Test Audio</button>
                            </li>
                        )}
                    </ul>
                </>
            }
            {players.length ? getActionForStatus() : ''}
            {status !== 'OPEN' && <button className="btn btn-secondary" onClick={reopenGame}>Reopen Game</button>}
            {!!manageGameState.houseCalledByPlayer && <div className="info info-danger">HOUSE CALLED</div>}
        </div>
    )

    function init() {
        Promise.all([
            getPlayers(gameId),
            getStatus()
        ]).then((results) => {
            const [players, statusResponse] = results
            setManageGameState({...manageGameState, players, status: statusResponse.status})
        })

        initWebSocket()
    }

    function getStatus() {
        return fetch(`/api/game/${gameId}/status`).then(response => response.json())
    }

    function getActionForStatus() {
        let buttonType, onclickFunction, label

        switch(manageGameState.status) {
            case 'CREATED':
                buttonType = 'primary'
                onclickFunction = generateTrack
                label = 'Generate track'
                break

            case 'OPEN':
                buttonType = 'primary'
                onclickFunction = generateAndAssignTickets
                label = 'Generate and assign tickets'
                break

            case 'READY':
                buttonType = 'success'
                onclickFunction = startGame
                label = 'Start Game'
                break

            default:
                return manageGameState.status
        }

        return <button className={`btn btn-${buttonType}`} onClick={onclickFunction}>{label}</button>
    }

    function generateAndAssignTickets() {
        setManageGameState({...manageGameState, status: 'ASSIGNING_TICKETS'})
        fetch(`/api/game/${gameId}/assign`, {method: 'POST'})
            .then((response) => {
                if (response.status === 200) {
                    setManageGameState({...manageGameState, status: 'ASSIGNED'})
                } else {
                    setManageGameState({...manageGameState, status: 'ERROR'})
                }
            })
    }

    function generateTrack() {
        setManageGameState({...manageGameState, status: 'GENERATING_TRACK'})
        fetch(`/api/game/${gameId}/generate-track`, {method: 'POST'}).then(response => {
            if (response.status === 201) {
                setManageGameState({...manageGameState, status: 'OPEN'})
            }
        })
    }

    function startGame() {
        fetch(`/api/game/${gameId}/start`, {method: 'POST'}).then(response => {
            if (response.status === 200) {
                setManageGameState({...manageGameState, status: 'IN_PROGRESS'})
            }
        })
    }

    async function removePlayerFromGame(playerId: string) {
        await fetch(`/api/game/${gameId}/player/${playerId}`, {
            method: 'DELETE'
        })
    }

    function initWebSocket() {
        const port = process.env.NODE_ENV === 'development' ? ':8002' : ''
        const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}${port}/socket`)
        ws.onopen = () => {
            console.log('web socket opened')
            ws.send(JSON.stringify({action: 'SET_ADMIN'}))
        }
        ws.onclose = () => {
        }
        ws.onmessage = (message) => {
            if (message.data) {
                processMessage(JSON.parse(message.data), setManageGameState)
            }
        }
    }

    function testAudio(playerId: string) {
        setManageGameState(manageGameState => ({...manageGameState, audioFailed: undefined}))
        fetch(`/api/game/${gameId}/player/${playerId}/test-audio`, {
            method: 'POST'
        }).then(() => {

        })
    }

    function reopenGame() {
        fetch(`/api/game/${gameId}/reopen`, {
            method: 'POST'
        }).then(() => {
            getStatus().then((statusResponse) => {
                setManageGameState({...manageGameState, status: statusResponse.status})
            })
        })
    }
}