const express = require('express')
const router = express.Router()

router
    .get('/', (req, res) => {
        req.app.locals.spotify.login(req, res)
    })

    .get('/callback', function (req, res) {
        req.app.locals.spotify.loginCallback(req, res)
    })

    // app.get('/api/login/refresh-token', function (req, res) {
    //     if (!req.cookies.username) {
    //         res.sendStatus(401)
    //         return
    //     }
    //
    //     const username = this.db.getUser(req.cookies.username)
    //     spotify.refreshToken(username)
    // })

module.exports = router