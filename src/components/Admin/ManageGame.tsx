import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getGame, Game, GameStatus } from "../Games/gameActions"
import { processMessage } from "../WebSockets/AdminMessageProcessor"
import './manage-game.css' 

export type ManageGameState = {
    game: Game
    started: boolean,
    houseCalledByPlayer?: string
    audioFailed?: string,
    previewUrl?: string
}

export const ManageGame = () => {
    const {gameId} = useParams()
    const [manageGameState, setManageGameState] = useState<ManageGameState>({started: false, game: {id: '', name: '', status: 'UNKNOWN'}})
    useEffect(init, [])
    const {game, audioFailed, previewUrl} = manageGameState;
    const {players, status, playlist} = game

    return (
        <div className="container">
            <div className="alert alert-info">
                Current status: {status}
            </div>
            {!!audioFailed && <div className="alert alert-danger">Test audio failed for {audioFailed}</div>}
            <div className="row">
                <div className="col">
                {players &&
                    <>
                        {players.length} player(s) connected
                        <ul className="list-group">
                            {players.map(player =>
                                <li key={player.id} className="list-group-item">
                                    {player.name}
                                    <button onClick={() => removePlayerFromGame(player.id)} className="btn btn-secondary"><i className="fas fa-trash-alt"/></button>
                                    <button onClick={() => testAudio(player.id)} className="btn btn-secondary">Test Audio</button>
                                    {player.bingoSheet ? <i className="fas fa-clipboard-check"></i> : ''}
                                </li>
                            )}
                        </ul>
                        {previewUrl && <li className="list-group"><audio src={previewUrl} controls /></li>}
                    </>
                }
                </div>
                <div className="col">
                    Playlist
                    <ul className="list-group playlist">
                        {playlist?.tracks.map(track => 
                            <li key={track.id} className="list-group-item">
                                <button className="btn btn-link" onClick={() => playTrack(track.previewUrl)}>{track.artist} - {track.title}</button>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
            <div>
                {getActionsForStatus()}
            </div>
            {!!manageGameState.houseCalledByPlayer && <div className="info info-danger">HOUSE CALLED</div>}
            <audio id="audio" src={`${process.env.PUBLIC_URL}/${gameId}.mp3`} controls />
        </div>
    )

    function init() {
        getGame(gameId).then((game) => {
            setManageGameState({...manageGameState, game})
        })

        initWebSocket()
    }

    function getStatus() {
        return fetch(`/api/game/${gameId}/status`).then(response => response.json())
    }

    function getActionsForStatus() {
        const status = game?.status

        switch(status) {
            case 'CREATED':
                return createButton('primary', generateTrack, 'Generate track')

            case 'OPEN':
                return createButton('primary', generateAndAssignTickets, 'Generate and assign tickets')

            case 'ASSIGNED':
                return [
                    createButton('success', startGame, 'Start Game', 1), 
                    createButton('secondary', generateAndAssignTickets, 'Reassign tickets', 2),
                    createButton('secondary', reopenGame, 'Reopen game', 3)
                ]

            default:
                return status
        }
    }

    function createButton(buttonType: string, onclickFunction: () => void, label: string, key=1) {
        return <button key={key} className={`btn btn-${buttonType}`} onClick={onclickFunction}>{label}</button>
    }

    function generateAndAssignTickets() {
        setManageGameState(setGameStatus(manageGameState, 'ASSIGNING_TICKETS'))
        fetch(`/api/game/${gameId}/assign`, {method: 'POST'})
            .then((response) => { 
                if (response.status === 200) {
                    setManageGameState(setGameStatus(manageGameState, 'ASSIGNED'))
                } else {
                    setManageGameState(setGameStatus(manageGameState, 'ERROR'))
                }
            })
    }

    function generateTrack() {
        setManageGameState(setGameStatus(manageGameState, 'GENERATING_TRACK'))
        fetch(`/api/game/${gameId}/generate-track`, {method: 'POST'}).then(response => {
            if (response.status === 201) {
                setManageGameState(setGameStatus(manageGameState, 'OPEN'))
            }
        })
    }

    function startGame() {
        fetch(`/api/game/${gameId}/start`, {method: 'POST'}).then(response => {
            if (response.status === 200) {
                setManageGameState(setGameStatus(manageGameState, 'IN_PROGRESS'))
            }
        })
    }

    async function removePlayerFromGame(playerId: string) {
        fetch(`/api/game/${gameId}/player/${playerId}`, {
            method: 'DELETE'
        }).then(() => {
            setManageGameState({
                ...manageGameState, 
                game: {
                    ...manageGameState.game,
                    players: manageGameState.game.players?.filter(player => player.id !== playerId)
                }
            })
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
                setManageGameState(setGameStatus(manageGameState, statusResponse.status))
            })
        })
    }

    function setGameStatus(state: ManageGameState, status: GameStatus): ManageGameState {
        return {...manageGameState, game: {...manageGameState.game!, status}}
    }

    function playTrack(previewUrl: string) {
        setManageGameState({...manageGameState, previewUrl})
    }
}