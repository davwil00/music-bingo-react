import React from 'react'

type WaitingRoomProps = {
    currentPlayers: Array<string>
}

export const WaitingRoom = (props: WaitingRoomProps) => {
    return (
        <div>
            <h1>Waiting Room</h1>
            <p>Waiting for other players to join</p>
            <h2>Current Players</h2>
            <ul>
                {props.currentPlayers.map((player, i) => <li key={i}>{player}</li>)}
            </ul>
        </div>
    )
}