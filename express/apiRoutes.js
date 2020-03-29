const express = require('express')
const router = express.Router()
const bingoSheetsGenerator = require('./bingoSheetsGenerator')
const { v4: uuidv4 } = require('uuid')
const audioProcessor = require('./AudioProcessor')
const os = require('os')
const path = require('path')
const fs = require('fs')

router
    // Get games
    .get('/games', async (req, res) => {
        const games = await req.app.locals.db.getGames()
        res.send(games.map(game => ({id: game._id, name: game.name, status: game.status})))
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
                        req.app.locals.ws.updatePlayers(result.players.map(player => {
                            return {id: player._id, name: player.name}
                        }))
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
        res.send(formatPlayers(result))
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
        res.send(bingoSheet[0].players.bingoSheet)
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
            const result = await req.app.locals.db.findGameStatusByIdAndPlayer(gameId, playerId)
            if (result) {
                res.send({status: result.status})
                return
            }
        }
        res.sendStatus(404)
    })

    // Generate the single track
    .post('/game/:gameId/generate-track', async (req, res) => {
        const gameId = req.params.gameId
        const targetFile = path.join(fs.realpathSync('./public'), `${gameId}.mp3`)
        if (!fs.existsSync(targetFile)) {
            req.app.locals.db.getGame(gameId).then(game => {
                const tracksDir = path.join(os.tmpdir(), gameId)
                const tracks = game.playlist.tracks
                fs.mkdirSync(tracksDir, {recursive: true})
                const singleTrackList = []
                const whooshPath = `${fs.realpathSync('./assets')}/whoosh`
                const trackPromises = tracks.map(track => {
                    const trackPath = path.join(tracksDir, track.title)
                    singleTrackList.push(trackPath)
                    singleTrackList.push(whooshPath)
                    return audioProcessor.downloadTrack(track.previewUrl, trackPath)
                })
                Promise.all(trackPromises).then(() => {
                    audioProcessor.createSingleTrack(singleTrackList, gameId).then(() => {
                        req.app.locals.db.updateGameStatus(gameId, 'READY').then(() => {
                            res.sendStatus(201)
                        })
                    })
                }).finally(() => {
                    fs.rmdir(tracksDir, () => {})
                })
            })
        } else {
            req.app.locals.db.updateGameStatus(gameId, 'READY').then(() => {
                res.sendStatus(201)
            })
        }
    })

    .get('/game/:gameId/status', (req, res) => {
        const gameId = req.params.gameId
        req.app.locals.db.getGame(gameId).then(result => {
            res.send({status: result.status})
        })
    })

    .delete('/game/:gameId/player/:playerId', (req, res) => {
        const {gameId, playerId} = req.params
        req.app.locals.db.removePlayerFromGame(gameId, playerId).then(() => {
            res.app.locals.db.getPlayerNames(gameId).then(result => {
                const players = formatPlayers(result)
                res.app.locals.ws.updatePlayers(players)
                res.sendStatus(200)
            })
        })
    })

    .post('/game/:gameId/player/:playerId/callHouse', (req, res) => {
        const {gameId, playerId} = req.params
        req.app.locals.db.getPlayerById(gameId, playerId).then(results => {
            req.app.locals.ws.houseCalled(results.players[0].name)
            res.sendStatus(200)
        })
    })

module.exports = router

function formatPlayers(result) {
    return result.players.map(player => (
        {id: player._id, name: player.name}
    ))
}