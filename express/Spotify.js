const axios = require('axios')
const querystring = require('querystring')
const { v4: uuidv4 } = require('uuid')
const _ = require('underscore')

/** Spotify **/
const client_id = 'c0e15b98fe494c2c9d6cb57c7b19a85d' // Your client id
const client_secret = 'af081a0f7a7a423eb4f731e8a243dd4d' // Your secret
const redirect_uri = 'http://localhost:8001/api/login/callback' // Your redirect uri
const scope = 'playlist-read-private'
const stateKey = 'spotify_auth_state'
const spotifyAccessTokenKey = 'spotify_access_token'

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
            const authOptions = {

                headers: {
                    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
                },
                json: true
            }

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

                    const accessToken = data.access_token
                    const refreshToken = data.refresh_token
                    res.cookie(spotifyAccessTokenKey, accessToken)

                    const options = {
                        url: 'https://api.spotify.com/v1/me',
                        headers: {'Authorization': 'Bearer ' + accessToken},
                        json: true
                    }

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
        res.redirect('/error')
    }

    refreshToken(username) {
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
                    return response.data.access_token
                } else {
                    console.error('Unable to get refresh token')
                }
            }).catch(err => console.log(err))
        })

    }

    getPlaylist(username, playlistId) {
        console.log('fetching tracks')
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
                    console.error('failed to get tracks')
                }
            }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    }
}
