const express = require('express')
const router = express.Router()
const bingoSheetsGenerator = require('./bingoSheetsGenerator')

router
    // Get games
    .get('/games', async (req, res) => {
        const games = await req.app.locals.db.getGames()
        res.send(games)
    })

    // Join a game
    .post('/game/:gameId/join', (req, res) => {
        const gameId = req.params.gameId
        const {playerId, playerName} = req.body
        req.app.locals.db.addPlayerToGame(gameId, playerId, playerName)
            .then(() => {
                req.app.locals.db.getPlayers(gameId)
                    .then((result) => {
                        req.app.locals.ws.updatePlayers(result.players.map(player => player.name))
                        res.sendStatus(200)
                    })
            })
            .catch((e) => {
                console.error(e)
                res.send(500)
            })
    })

    // Generate and assign bingo sheets
    .post('/game/:gameId/assign', async (req, res) => {
        const gameId = req.params.playlistId
        const username = req.cookies.username
        const game = await req.app.locals.db.getGame(gameId)
        const playlistId = game.playlistId
        const tracks = await req.app.locals.spotify.getTracks(username, playlistId)
        const bingoSheets = bingoSheetsGenerator.createSheetsForGame(tracks, game.players.length)
        const assignedBingoSheets = game.players.map(player => { return {_id: player._id, bingoSheet: bingoSheets.pop}})
        await req.app.locals.db.addBingoSheetsToPlayers(assignedBingoSheets)
        res.sendStatus(200)
    })

    // Get a ticket
    .get('/game/1/ticket/:id', async (req, res) => {
        const ticket = await req.app.locals.getTicket()
        res.send(ticket)
    })

    // Start the game
    .post('/game/:gameId/start', (req, res) => {
        // TODO: stat game with ID
        req.app.locals.ws.startGame()
        res.sendStatus(200)
    })

    // Create a new game
    .post('/game', async (req, res) => {
        const gameName = req.body.name
        const playlistId = req.body.playlistId
        await req.app.locals.db.createGame(gameName, playlistId)
        res.sendStatus(201)
    })

module.exports = router