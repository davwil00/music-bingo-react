import { ManageGameState } from "../Admin/ManageGame"
import { Dispatch, SetStateAction } from "react"

interface Message {
    action: string,
    payload: any
}

export function processMessage(message: Message, setManageGameState: Dispatch<SetStateAction<ManageGameState>>) {
    console.log(message)
    const payload = message.payload

    switch (message.action) {
        case 'UPDATE_PLAYERS':
            setManageGameState(manageGameState => ({
                ...manageGameState, 
                game: {
                    ...manageGameState.game, 
                    players: payload
                }
            }))
            break

        case 'START_GAME':
            setManageGameState(manageGameState => ({...manageGameState, started: true}))
            break

        case 'HOUSE_CALLED':
            setManageGameState(manageGameState => ({...manageGameState, houseCalledByPlayer: payload.playerName}))
            break

        case 'AUDIO_FAILED':
            setManageGameState(manageGameState => {
                const newManageGameState = {...manageGameState}
                const player = manageGameState?.game?.players?.find(player => player.id === payload)
                newManageGameState.audioFailed = player?.name
                return newManageGameState
            })
            break
    }
}