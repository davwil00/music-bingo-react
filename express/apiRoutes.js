const express = require('express')
const path = require('path')
const router = express.Router()
const db = require('./db').instance

router
    // Get games
    .get('/games', async (req, res) => {
        const games = await db.getGames()
        res.send(games)
    })

    // Join a game
    .post('/game/:gameId/join', async (req, res) => {
        const gameId = req.params.gameId
        const playerId = req.body.playerId
        await db.addPlayerToGame(playerId, gameId)
        res.sendStatus(200)
    })

    // Generate and assign tickets
    .post('/game/:gameId/assign', (req, res) => {
        // generateTickets()
        // assignTickets()
        res.sendStatus(200)
    })

    // Get a ticket
    .get('/game/1/ticket/:id', (req, res) => {
        res.sendFile(path.join(__dirname, `/json/${req.params.id}.json`))
    })

    // Start the game
    .post('/game/:gameId/start', (req, res) => {
        // startGame()
        res.sendStatus(200)
    })

    // Create a new game
    .post('/game', (req, res) => {
        const gameName = req.body.name
        const playlistId = req.body.playlistId
        // createGame(gameName, playlistId)
        res.sendStatus(201)
    })

module.exports = router