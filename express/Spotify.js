const axios = require('axios')
const querystring = require('querystring')
const { v4: uuidv4 } = require('uuid')
const _ = require('underscore')

/** Spotify **/
const client_id = '39e44cffa303474eaa87ba42e08d740e' // Your client id
const client_secret = '8101f5125de74f8d927302f06ed37069' // Your secret
const redirect_uri = 'http://localhost:8001/api/login/callback' // Your redirect uri
const scope = 'playlist-read-private'
const stateKey = 'spotify_auth_state'
const spotifyAccessTokenKey = 'spotify_access_token'
const tokenCache = {}

module.exports = class Spotify {
    constructor(db) {
        this.db = db
    }

    login(req, res) {
        if (req.cookies.username) {
            // already known user - refresh token
        } else {
            const state = uuidv4()
            res.cookie(stateKey, state)
            res.redirect('https://accounts.spotify.com/authorize?' +
                querystring.stringify({
                    response_type: 'code',
                    client_id: client_id,
                    scope: scope,
                    redirect_uri: redirect_uri,
                    state: state
                }))
        }
    }

    loginCallback(req, res) {
        // your application requests refresh and access tokens
        // after checking the state parameter

        const code = req.query.code || null
        const state = req.query.state || null
        const storedState = req.cookies ? req.cookies[stateKey] : null

        if (state === null || state !== storedState) {
            res.redirect('/#' +
                querystring.stringify({
                    error: 'state_mismatch'
                }))
        } else {
            res.clearCookie(stateKey)
            const data = querystring.stringify({
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            })
            const config = {
                auth: {
                    username: client_id,
                    password: client_secret
                }
            }
            axios.post('https://accounts.spotify.com/api/token', data, config).then(response => {
                if (response.status === 200) {
                    console.log({response})
                    const accessToken = response.data.access_token
                    console.log({accessToken})
                    const refreshToken = response.data.refresh_token
                    // res.cookie(spotifyAccessTokenKey, accessToken)

                    // use the access token to access the Spotify Web API
                    axios.get('https://api.spotify.com/v1/me', {
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    }).then(response => {
                        if (response.status === 200) {
                            req.app.locals.db.createUser(response.data.id, refreshToken, accessToken)
                            res.redirect('/admin')
                            return
                        } else {
                            console.error(`Failed to get user profile, status ${response.status}`)
                        }
                    }).catch(err => console.log(err))
                } else {
                    console.error(`Failed to auth, probably an invalid token, status ${response.status}`)
                }
            }).catch(err => console.log(err))
        }
    }

    refreshToken(username) {
      console.log('refreshing token for', username)
      if (tokenCache[username] && tokenCache[username].timestamp < new Date() + 600000) {
        return tokenCache[username].token
      } else {
        return this.db.getUser(username).then(user => {
            const refreshToken = user.refreshToken
            const url = 'https://accounts.spotify.com/api/token'
            const data = querystring.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
            const config = {
                auth: {
                    username: client_id,
                    password: client_secret
                }
            }

            return axios.post(url, data, config).then(response => {
                if (response.status === 200) {
                    tokenCache[username] = {timestamp: new Date().getTime(), token: response.data.access_token}
                    return response.data.access_token
                } else {
                    console.error('Unable to get refresh token')
                }
            }).catch(err => console.log(err))
        })
      }
    }

    getPlaylist(username, playlistId) {
        console.log('fetching playlist tracks')
        return this.refreshToken(username).then((accessToken) => {
            const fields = 'name,tracks(items(track(id,preview_url,name,artists(name))))'
            const url = `https://api.spotify.com/v1/playlists/${playlistId}?market=GB&fields=${fields}`

            return axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }).then(response => {
                if (response.status === 200) {
                    const playlistName = response.data.name
                    const tracks = response.data.tracks.items.map(item => {
                        return {
                            id: item.track.id,
                            artist: item.track.artists[0].name,
                            title: item.track.name,
                            previewUrl: item.track.preview_url
                        }
                    })
                    return {id: playlistId, name: playlistName, tracks: tracks}
                } else {
                    console.error('failed to get playlist tracks')
                }
            }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    }

    getAlbumTracks(username, albumId) {
      console.log('fetching almbum tracks')
      return this.refreshToken(username).then(accessToken => {
        const url = `https://api.spotify.com/v1/albums/${albumId}/tracks`

        return axios.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }).then(response => {
          if (response.status === 200) {
            const tracks = response.data.items.map(item => ({
              id: item.id,
              artist: item.artists[0].name,
              title: item.name,
              previewUrl: item.preview_url
            }))
            return {id: albumId, tracks: tracks}
          } else {
            console.error('failed to get album tracks')
          }
        }).catch(err => console.error(err))
      }).catch(err => console.error(err))
    }

    async getBpmForPlaylist(username, playlistId) {
      console.log("fetching bpm for playlist tracks", playlistId)
      const playlist = await this.getPlaylist(username, playlistId)
      const trackIds = playlist.tracks.map(track => track.id)
      const bpmData = await this.getAudioFeatures(username, trackIds)

      for (let i = 0; i < playlist.tracks.length; i++) {
        playlist.tracks[i].bpm = bpmData[i].bpm
        playlist.tracks[i].bpmConfidence = bpmData[i].bpmConfidence
        playlist.tracks[i].danceability = bpmData[i].danceability
        playlist.tracks[i].energy = bpmData[i].energy
      }

      return playlist.tracks
    }

    async getBpmForAlbum(username, albumId) {
      console.log('fetching bpm for album', albumId)
      const album = await this.getAlbumTracks(username, albumId)
      const trackIds = album.tracks.map(track => track.id)
      const bpmData = await this.getAudioFeatures(username, trackIds)

      for(let i = 0; i < album.tracks.length; i++) {
        album.tracks[i].bpm = bpmData[i].bpm
        album.tracks[i].bpmConfidence = bpmData[i].bpmConfidence
        album.tracks[i].danceability = bpmData[i].danceability
        album.tracks[i].energy = bpmData[i].energy
      }

      return album.tracks
    }

    getAudioFeatures(username, trackIds) {
      console.log('Fetching audio analysis for tracks', trackIds)
      return this.refreshToken(username).then(token => {
        const url = `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`
        return axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).then(response => {
          if (response.status === 200) {
            return response.data.audio_features.map(af => ({
              bpm: af.tempo,
              danceability: af.danceability,
              energy: af.energy
            }))
          }
        }).catch(err => console.log(err))
      })
    }
}
