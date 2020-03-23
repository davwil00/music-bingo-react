const request = require('request')
const querystring = require('querystring')
const { v4: uuidv4 } = require('uuid')

/** Spotify **/
const client_id = 'c0e15b98fe494c2c9d6cb57c7b19a85d' // Your client id
const client_secret = 'af081a0f7a7a423eb4f731e8a243dd4d' // Your secret
const redirect_uri = 'http://localhost:3000/api/login/callback' // Your redirect uri
const scope = 'playlist-read-private'
const stateKey = 'spotify_auth_state'
const spotifyAccessTokenKey = 'spotify_access_token'

module.exports = class Spotify {
    constructor(db) {
        this.db = db
        Spotify.instance = this
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
                url: 'https://accounts.spotify.com/api/token',
                form: {
                    code: code,
                    redirect_uri: redirect_uri,
                    grant_type: 'authorization_code'
                },
                headers: {
                    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
                },
                json: true
            }

            request.post(authOptions, function (error, response, body) {
                if (!error && response.statusCode === 200) {

                    const accessToken = body.access_token
                    const refreshToken = body.refresh_token
                    res.cookie(spotifyAccessTokenKey, accessToken)

                    const options = {
                        url: 'https://api.spotify.com/v1/me',
                        headers: {'Authorization': 'Bearer ' + accessToken},
                        json: true
                    }

                    // use the access token to access the Spotify Web API
                    request.get(options, function (error, response, body) {
                        this.db.createUser(body.id, refreshToken)
                    })

                } else {
                    res.redirect('/#' +
                        querystring.stringify({
                            error: 'invalid_token'
                        }))
                }
            })
        }
    }

    refreshToken(req, res) {

        // requesting access token from refresh token
        if (!req.cookies.username) {
            res.sendStatus(401)
            return
        }

        const username = this.db.getUser(req.cookies.username)
        const refreshToken = this.db.getUser(username).refreshToken

        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))},
            form: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var access_token = body.access_token;
                res.send({
                    'access_token': access_token
                });
            }
        });
    }
}