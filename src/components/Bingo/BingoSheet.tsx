import React, { SyntheticEvent, useEffect, useRef, useState } from "react"
import "./bingo-sheet.css"
import { GameState } from "../../App"
import { Game, rehydrateState } from "../Games/gameActions"
import { useHistory } from "react-router-dom"

type Track = {
    title: string,
    artist: string
}

type BingoSheetProps = {
    gameState: GameState,
    setGameState: (gameState: GameState) => void
    ws: WebSocket
}

interface SheetState {
    tracksMatched: Set<number>
    houseCalled: boolean
}

export const BingoSheet = (props: BingoSheetProps) => {
    const [tracks, setTracks] = useState([])
    const [playing, setPlaying] = useState(false)
    const [sheetState, setSheetState] = useState<SheetState>({tracksMatched: new Set(), houseCalled: false})
    const history = useHistory()
    let audioElt = useRef<HTMLAudioElement>(null)

    useEffect(init, [])
    useEffect(startMusic, [props.gameState.started])

    return (
        <div className="container">
            <h1><span className="emoji">&#x1f3b6;&#x1f3b6;</span>&nbsp; DJ Williams' Music
                Bingo &nbsp;&#x1f3b6;&#x1f3b6;</h1>
            <table>
                <tbody>
                {printTracks(tracks)}
                </tbody>
            </table>
            <p>Tracks matched: {sheetState.tracksMatched.size}/{tracks.length}</p>
            <p>Tracks remaining: {tracks.length - sheetState.tracksMatched.size}</p>
            {sheetState.tracksMatched.size === tracks.length && <button onClick={callHouse}>Call House</button>}
            {props.gameState.houseCalledByPlayer && <span>House called by: {props.gameState.houseCalledByPlayer}</span>}
            <audio ref={audioElt} id="audio" src={`${process.env.PUBLIC_URL}/bingo.mp3`} preload="none"/>
        </div>
    )

    function printTracks(tracks: Array<Track>) {
        const tracksPerRow = 5
        const trackGrid = []
        for (let i = 0; i < tracks.length; i += tracksPerRow) {
            trackGrid.push(tracks.slice(i, i + tracksPerRow))
        }
        const rows: Array<React.ReactChild> = []
        trackGrid.forEach((trackRow, rownum) => {
            rows.push(<tr key={rownum}>{trackRow.map((track, i) => {
                const key = (tracksPerRow * rownum) + i
                return (<td key={key} data-trackno={key} onClick={markTrackMatched} className={sheetState.tracksMatched.has(key) ? 'crossed' : ''}>
                    {track.title}<br/>
                    <span className="artist">{track.artist}</span>
                </td>)
            })}
            </tr>)
        })
        return rows
    }

    function init() {
        const {gameState, setGameState} = props
        rehydrateState(gameState, setGameState, history)
        if (gameState.gameId && gameState.playerId) {
            fetch(`/api/game/${gameState.gameId}/bingo-sheet/${gameState.playerId}`)
                .then((response) => {
                    response.json().then(tracks => {
                        setTracks(tracks)
                    })
                })
        }
    }

    function startMusic() {
        if (!playing && props.gameState.started) {
            audioElt.current?.play().catch(e => console.error("Unable to start playing" + e))
            setPlaying(true)
        }
    }

    function markTrackMatched(event: SyntheticEvent<HTMLElement>) {
        event.currentTarget.classList.toggle('crossed')
        const trackNo = parseInt(event.currentTarget.dataset.trackno || '')
        const tracksMatched = new Set(sheetState.tracksMatched)

        if (sheetState.tracksMatched.has(trackNo)) {
            tracksMatched.delete(trackNo)
        } else {
            tracksMatched.add(trackNo)
        }

        setSheetState({...sheetState, tracksMatched: tracksMatched})
    }

    function callHouse() {
        props.ws.send(JSON.stringify({action: 'CALL_HOUSE'}))
    }
}