import React, { ChangeEvent, SyntheticEvent, useState } from "react"

interface GameInputs {
    name : string,
    playlistId: string
}

export const CreateGame = () => {

    const [inputs, setInputs] = useState<GameInputs>({name: '', playlistId: ''})

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setInputs({
            ...inputs,
            [event.target.name]: event.target.value
        })
    }

    async function handleSubmit(event: SyntheticEvent) {
        await fetch('/api/game', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(inputs)
        })

        event.preventDefault()
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Game name</label>
                    <input type="text" name="name" className="form-control" id="name" aria-describedby="nameHelp" required onChange={handleChange}/>
                    <small id="nameHelp" className="form-text text-muted">The name / theme of your game</small>
                </div>
                <div className="form-group">
                    <label htmlFor="playlistId">Playlist ID</label>
                    <input type="text" name="playlistOd" className="form-control" id="playlistId" aria-describedby="playlistIdHelp" onChange={handleChange} required />
                    <small id="playlistIdHelp" className="form-text text-muted">The spotify ID for your playlist</small>
                </div>
                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
        </div>
    )
}