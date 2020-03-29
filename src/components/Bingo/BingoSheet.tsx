import React, { SyntheticEvent, useEffect, useRef, useState } from "react"
import "./bingo-sheet.css"
import { GameState } from "../../routes/GameRoutes"
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

    const {gameId, playerId, houseCalledByPlayer, started} = props.gameState

    useEffect(init, [gameId, playerId])
    useEffect(startMusic, [props.gameState])

    return (
        <div className="container">
            <table>
                <tbody>
                {printTracks(tracks)}
                </tbody>
            </table>
            <p>Tracks matched: {sheetState.tracksMatched.size}/{tracks.length}</p>
            <p>Tracks remaining: {tracks.length - sheetState.tracksMatched.size}</p>
            {sheetState.tracksMatched.size === tracks.length && <button onClick={callHouse}>Call House</button>}
            {!!houseCalledByPlayer && <div className="info info-danger">House called by: {houseCalledByPlayer}</div>}
            <audio ref={audioElt} id="audio" src={`${process.env.PUBLIC_URL}/${gameId}.mp3`} preload="none"/>
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
        const {gameId, playerId} = props.gameState
        if (gameId && playerId) {
            fetch(`/api/game/${gameId}/bingo-sheet/${playerId}`).then((response) => {
                response.json().then(tracks => {
                    setTracks(tracks)
                })
            }).catch(() => {
                history.push('/')
            })
        }
    }

    function startMusic() {
        if (!playing && started) {
            console.log("starting music")
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

    async function callHouse() {
        const {gameId, playerId} = props.gameState
        await fetch(`/api/game/${gameId}/player/${playerId}/callHouse`, {
            method: 'POST'
        })
    }
}