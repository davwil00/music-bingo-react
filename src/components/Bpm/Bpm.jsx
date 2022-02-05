import React, { useRef, useState } from 'react'
export const Bpm = () => {
  const playlistIdRef = useRef("")
  const [data, setData] = useState([])

  const submit = () => {
    fetch(`/api/bpm/${playlistIdRef.current.value}`)
    .then(result => result.json())
    .then(json => setData(json))
  }

  return (
    <>
    <form>
      <input ref={playlistIdRef} type="text" />
      <button type="button" onClick={submit}>Submit</button>
    </form>

    {data.length > 0 && 
      <table>
        <thead>
          <tr>
            <th>Artist</th>
            <th>Track</th>
            <th>BPM</th>
            <th>Danceablility</th>
            <th>Energy</th>
          </tr>
        </thead>
        <tbody>
          {data.map((track, idx) => <tr key={idx}>
            <td>{track.artist}</td>
            <td>{track.title}</td>
            <td>{track.bpm}</td>
            <td>{track.danceability}</td>
            <td>{track.energy}</td>
          </tr>
        )}
        </tbody>
      </table>
    }
    </>
  )
}