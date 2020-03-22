import React, { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import "./bingo-sheet.css"
import { GameState } from "../../App"

type Track = {
    title: string,
    artist: string
}

type BingoSheetProps = {
    gameState: GameState
}

const printTracks = (tracks: Array<Track>) => {
    const trackGrid = []
    for (let i = 0; i < tracks.length; i += 5) {
        trackGrid.push(tracks.slice(i, i + 5))
    }
    const rows: Array<React.ReactChild> = []
    trackGrid.forEach((trackRow, rownum) => {
        rows.push(<tr key={rownum}>{trackRow.map(track => <td>
            {track.title}<br/>
            <span className="artist">{track.artist}</span>
        </td>)}
        </tr>)
    })
    return rows
}

export const BingoSheet = (props: BingoSheetProps) => {
    const [tracks, setTracks] = useState([])
    const [playing, setPlaying] = useState((false))
    const {gameId, ticketId} = useParams()
    let audioElt = useRef<HTMLAudioElement>(null)

    useEffect(getTracks, [gameId, ticketId])
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
            <audio ref={audioElt} id="audio" src={`${process.env.PUBLIC_URL}/bingo.mp3`} preload="none"/>
        </div>
    )


    function getTracks() {
        gameId && ticketId && fetch(`/api/game/${gameId}/ticket/${ticketId}`)
            .then((response) => {
                response.json().then(body => {
                    setTracks(body.tracks)
                })
            })
    }

    function startMusic() {
        if (!playing && props.gameState.started) {
            audioElt.current?.play().catch(e => console.error("Unable to start playing" + e))
            setPlaying(true)
        }
    }

}