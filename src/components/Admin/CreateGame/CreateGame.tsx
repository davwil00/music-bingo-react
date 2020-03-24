import React, { ChangeEvent, SyntheticEvent, useState } from "react"
import { useHistory } from "react-router-dom"

interface GameInputs {
    name : string,
    playlistId: string
}

export const CreateGame = () => {

    const [inputs, setInputs] = useState<GameInputs>({name: '', playlistId: ''})
    const [error, setError] = useState(false)
    const history = useHistory()

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setInputs({
            ...inputs,
            [event.target.name]: event.target.value
        })
    }

    function handleSubmit(event: SyntheticEvent) {
        fetch('/api/game', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(inputs)
        }).then((response) => {
            if (response.status === 201) {
                history.push('/admin')
            } else {
                setError(true)
            }
        })

        event.preventDefault()
    }

    return (
        <div>
            {error && <div className="alert alert-error">An error occurred</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Game name</label>
                    <input type="text" name="name" className="form-control" id="name" aria-describedby="nameHelp" required onChange={handleChange}/>
                    <small id="nameHelp" className="form-text text-muted">The name / theme of your game</small>
                </div>
                <div className="form-group">
                    <label htmlFor="playlistId">Playlist ID</label>
                    <input type="text" name="playlistId" className="form-control" id="playlistId" aria-describedby="playlistIdHelp" onChange={handleChange} required />
                    <small id="playlistIdHelp" className="form-text text-muted">The spotify ID for your playlist</small>
                </div>
                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
        </div>
    )
}