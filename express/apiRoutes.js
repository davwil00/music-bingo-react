const express = require('express')
const router = express.Router()
const bingoSheetsGenerator = require('./bingoSheetsGenerator')
const { v4: uuidv4 } = require('uuid')

router
    // Get games
    .get('/games', async (req, res) => {
        const games = await req.app.locals.db.getGames()
        res.send(games.map(game => {return {id: game._id, name: game.name}}))
    })

    // Join a game
    .post('/game/:gameId/join', (req, res) => {
        const gameId = req.params.gameId
        const playerName = req.body.playerName
        const playerId = uuidv4()

        req.app.locals.db.addPlayerToGame(gameId, playerId, playerName)
            .then(() => {
                req.app.locals.db.getPlayerNames(gameId)
                    .then((result) => {
                        req.app.locals.ws.updatePlayers(result.players.map(player => player.name))
                        res.send({playerId})
                    })
            })
            .catch((e) => {
                console.error(e)
                res.send(500)
            })
    })

    .get('/game/:gameId/players', async (req, res) => {
        const result = await req.app.locals.db.getPlayerNames(req.params.gameId)
        res.send(result.players.map(player => player.name))
    })

    // set status to closed so no more players can join
    .post('/game/:gameId/close', (req, res) => {
        const gameId = req.params.gameId
        req.app.locals.db.updateGameStatus(gameId, 'CLOSED')
            .then(() => res.sendStatus(200))
    })

    // Generate and assign bingo sheets
    .post('/game/:gameId/assign', async (req, res) => {
        const gameId = req.params.gameId
        const game = await req.app.locals.db.getGame(gameId)
        const bingoSheets = Array.from(bingoSheetsGenerator.createSheetsForGame(game.playlist, game.players.length))
        game.players.forEach(player => { player.bingoSheet = bingoSheets.pop()})
        await req.app.locals.db.assignPlayers(game._id, game.players)
        req.app.locals.ws.assignBingoSheets(game.players)
        res.sendStatus(200)
    })

    // Get a bingo sheet
    .get('/game/:gameId/bingo-sheet/:playerId', async (req, res) => {
        const {gameId, playerId} = req.params
        const bingoSheet = await req.app.locals.db.getBingoSheet(gameId, playerId)
        res.send(bingoSheet.players[0].bingoSheet)
    })

    // Start the game
    .post('/game/:gameId/start', (req, res) => {
        // TODO: start game with ID
        req.app.locals.ws.startGame()
        res.sendStatus(200)
    })

    // Create a new game
    .post('/game', async (req, res) => {
        const playlistId = req.body.playlistId
        const ownerId = '5e7a26666d22300f90b12112' // TODO: don't hard code this!
        const playlist = await req.app.locals.spotify.getPlaylist(ownerId, playlistId)
        await req.app.locals.db.createGame(playlist.name, ownerId, playlist)
        res.sendStatus(201)
    })

    .get('/validate', async(req, res) => {
        const {gameId, playerId} = req.query
        if (gameId && playerId) {
            const result = await req.app.locals.db.findGameByIdAndPlayer(gameId, playerId)
            if (result) {
                res.send({status: result.status})
                return
            }
        }
        res.sendStatus(404)
    })

    // Generate the single track TODO: actually generate the track!
    .post('/game/:gameId/generate-track', async (req, res) => {
        const gameId = req.params.gameId
        await req.app.locals.db.updateGameStatus(gameId, 'READY')
        res.sendStatus(201)
    })

    .get('/game/:gameId/status', (req, res) => {
        const gameId = req.params.gameId
        req.app.locals.db.getGame(gameId).then(result => {
            res.send({status: result.status})
        })
    })

module.exports = router