const spotify = require('./spotify').instance

module.exports = function(app) {
    app.get('/api/login', (req, res) => {
        spotify.login(req, res)
    })

    app.get('/api/login/callback', function (req, res) {
        spotify.loginCallback(res, req)
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
}