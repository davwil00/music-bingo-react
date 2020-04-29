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
    testAudioError: boolean
    callStatus?: 'GOOD' | 'BAD'
}

export const BingoSheet = (props: BingoSheetProps) => {
    const [tracks, setTracks] = useState([])
    const [playing, setPlaying] = useState(false)
    const [sheetState, setSheetState] = useState<SheetState>({tracksMatched: new Set(), houseCalled: false, testAudioError: false})
    const history = useHistory()
    let audioElt = useRef<HTMLAudioElement>(null)
    let testAudioElt = useRef<HTMLAudioElement>(null)

    const {gameId, playerId, houseCalledByPlayer, status, playTestAudio} = props.gameState

    useEffect(init, [gameId, playerId])
    useEffect(startMusic, [props.gameState])
    useEffect(startTestAudio, [props.gameState])

    return (
        <div className="container">
            {sheetState.testAudioError && <div className="alert alert-danger">
                Audio test failed, please allow this page to play audio
                <button className="btn btn-secondary">Try Again</button>
            </div>}
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
            <audio ref={testAudioElt} id="testAudio" src="https://p.scdn.co/mp3-preview/a69cabb16c6c3333db903d1f538e808493689e40?cid=774b29d4f13844c495f206cafdad9c86" />
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
        console.log('init')
        const {gameId, playerId} = props.gameState
        if (gameId && playerId) {
            fetch(`/api/game/${gameId}/bingo-sheet/${playerId}`).then((response) => {
                if (response.status === 200) {
                    response.json().then(tracks => {
                        setTracks(tracks)
                    })
                } else {
                    history.push('/')
                }
            }).catch(() => {
                history.push('/')
            })
        }
    }

    function startMusic() {
        if (!playing && status === 'IN_PROGRESS') {
            console.log("starting music")
            audioElt.current?.play().catch(e => console.error("Unable to start playing" + e))
            setPlaying(true)
        }
    }

    function startTestAudio() {
        if (playTestAudio) {
            console.log('Testing remote audio trigger')
            testAudioElt.current?.play().catch((error) => {
                if (error === 'NotAllowedError') {
                    setSheetState(sheetState => ({...sheetState, testAudioError: true}))
                    props.ws.send(JSON.stringify({action: 'AUDIO_TEST_FAILED'}))
                } else {
                    console.error(error)
                }
            })
            // testAudioElt.controls
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
        setSheetState(sheetState => ({...sheetState, callStatus: undefined}))
        const {gameId, playerId} = props.gameState
        fetch(`/api/game/${gameId}/player/${playerId}/callHouse`, {
            method: 'POST'
        }).then(response => {
            if (response.status === 200) {
                setSheetState(sheetState => ({...sheetState, callStatus: 'GOOD'}))
            } else if (response.status === 400) {
                setSheetState(sheetState => ({...sheetState, callStatus: 'BAD'}))
            }
        })
    }
}