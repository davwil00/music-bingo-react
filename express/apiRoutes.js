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

    .get('/game/:gameId', (req, res) => {
        const gameId = req.params.gameId
        req.app.locals.db.getGame(gameId).then(game => {
            game.id = game._id
            delete game._id
            game.players.forEach(player => {
                player.id = player._id
                delete player._id
            })
            res.send(game)
        })
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
        req.app.locals.db.updateGameStatus(gameId, 'ASSIGNED')
            .then(() => res.sendStatus(200))
    })

    // Get a bingo sheet
    .get('/game/:gameId/bingo-sheet/:playerId', async (req, res) => {
        const {gameId, playerId} = req.params
        if (!gameId || !playerId) {
            res.sendStatus(404)
            return
        }
        const bingoSheet = await req.app.locals.db.getBingoSheet(gameId, playerId)
        if (bingoSheet.length === 0) {
            res.sendStatus(404)
            return
        }
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
        const gameName = req.body.name
        const ownerId = '5fba34131e933d82fbe3f3ba' // TODO: don't hard code this!
        const playlist = await req.app.locals.spotify.getPlaylist(ownerId, playlistId)
        console.log({playlist})
        await req.app.locals.db.createGame(gameName, ownerId, playlist)
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
                    const trackPath = path.join(tracksDir, track.title.replace(/\//g, ''))
                    singleTrackList.push(trackPath)
                    singleTrackList.push(whooshPath)
                    return audioProcessor.downloadTrack(track.previewUrl, trackPath)
                })
                Promise.all(trackPromises).then(() => {
                    audioProcessor.createSingleTrack(singleTrackList, gameId).then(() => {
                        req.app.locals.db.updateGameStatus(gameId, 'OPEN').then(() => {
                            res.sendStatus(201)
                        })
                    })
                }).finally(() => {
                    fs.rmdir(tracksDir, () => {})
                })
            }).catch(error => {
                console.error(error)
                res.sendStatus(500)
            })
        } else {
            req.app.locals.db.updateGameStatus(gameId, 'OPEN').then(() => {
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
        const trackNum = req.body.trackNum
        req.app.locals.db.getGame(gameId).then(game => {
            if (didPlayerWin(game, playerId, trackNum)) {
                req.app.locals.ws.houseCalled(playerId)
                res.sendStatus(200)
            } else {
                req.app.locals.ws.houseCalledIncorrectly(playerId)
                res.sendStatus(400)
            }
        })
    })

    .post('/game/:gameId/player/:playerId/test-audio', (req, res) => {
        const playerId = req.params.playerId
        req.app.locals.ws.testPlayerAudio(playerId)
        res.sendStatus(200)
    })

    .post('/game/:gameId/reopen', (req, res) => {
        const gameId = req.params.gameId
        req.app.locals.db.updateGameStatus(gameId, 'OPEN').then(() =>
            res.sendStatus(200)
        )
    })

    .get('/bpm/playlist/:playlistId', async(req, res) => {
      const playlistId = req.params.playlistId
      const bpmDetails = await req.app.locals.spotify.getBpmForPlaylist('5fba34131e933d82fbe3f3ba', playlistId)
      res.send(bpmDetails)
    })

    .get('/bpm/album/:albumId', async(req, res) => {
      const albumId = req.params.albumId
      const bpmDetails = await req.app.locals.spotify.getBpmForAlbum('5fba34131e933d82fbe3f3ba', albumId)
      res.send(bpmDetails)
    })

module.exports = router

function formatPlayers(result) {
    return result.players.map(player => (
        {id: player._id, name: player.name}
    ))
}

function didPlayerWin(game, playerId, trackNum) {
    const playersTracks = game.players.find(player => player._id === playerId).tracks
    const tracksPlayed = game.tracks.slice(0, trackNum)
    return playersTracks.every(track => tracksPlayed.includes(track))
}
