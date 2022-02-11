import React, { useRef, useState } from 'react'

type BpmData = {
  artist: string,
  title: string,
  bpm: string,
  danceability: string,
  energy: string
}

export const Bpm = () => {
  const playlistIdRef = useRef<HTMLInputElement>(null)
  const albumIdRef = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<Array<BpmData>>([])

  const submitPlaylist = () => {
    const playlistId = extractIdFromUrl(playlistIdRef?.current?.value)
    fetch(`/api/bpm/playlist/${playlistId}`)
    .then(result => result.json())
    .then(json => setData(json))
  }
  const submitAlbum = () => {
    const albumId = extractIdFromUrl(albumIdRef?.current?.value)
    fetch(`/api/bpm/album/${albumId}`)
    .then(result => result.json())
    .then(json => setData(json))
  }

  const extractIdFromUrl = (url?: string): string => {
    if (url?.startsWith('http')) {
      const path = new URL(url).pathname
      return path.substring(path.lastIndexOf('/') + 1, path.length)
    }
    return url!
  }

  return (
    <>
    <form>
      <label>
        playlist id / url
        <input ref={playlistIdRef} type="text" />
      </label>
      <button type="button" onClick={submitPlaylist}>Submit</button>
      <label>
        album id / url
        <input ref={albumIdRef} type="text" />
      </label>
      <button type="button" onClick={submitAlbum}>Submit</button>
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