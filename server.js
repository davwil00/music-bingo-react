const express = require('express')
const path = require('path')
const app = express()

const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')
const shuffle = require('shuffle-array')

app.use(express.static(path.join(__dirname, 'build')))

app.get('/ping', function (req, res) {
    return res.send('pong')
})

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

app.get('/api/game/1/ticket/:id', (req, res) => {
    res.sendFile(path.join(__dirname, `/json/${req.params.id}.json`))
})

app.get('/api/games', (req, res) => {
    res.send({games: [{id: 1, name: 'Corona'}]})
})

app.get('/api/game/join/:gameId', (req, res) => {
    res.send('{"ticketId":"1"}')
})

app.post('/api/game/:gameId/assign', (req, res) => {
    assignTickets()
    res.sendStatus(200)
})

app.post('/api/game/:gameId/start', (req, res) => {
    startGame()
    res.sendStatus(200)
})

const wss = new WebSocket.Server({ port: 8002 });

wss.on('connection', function connection(ws) {
    ws.id = uuidv4();
    updatePlayers()
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        reply(ws, message)
    });
});

function reply(ws, message) {
    const data = JSON.parse(message)
    switch(data.action) {
        case 'JOIN_GAME':
            // state.players.push(data.payload.playerName)
            ws.playerName = data.payload.playerName
            sendMessage(ws, {action: 'JOINED', payload: {gameId: data.payload.gameId}})
            updatePlayers()
            break
    }
}

function updatePlayers() {
    sendMessageToAll({action: 'UPDATE_PLAYERS', payload: Array.from(wss.clients)
            .filter(client => client.playerName)
            .map(client => client.playerName)})
}

function assignTickets() {
    console.log('assigning tickets')
    const tickets = shuffle([...Array(wss.clients.size).keys()]) // generate tickets (wss.clients.length)
    wss.clients.forEach((client) => {
        sendMessage(client, {action: 'ASSIGN_TICKET', payload: tickets.pop().toString()})
    });
}

function startGame() {
    sendMessageToAll({action: 'START_GAME'})
}

function sendMessageToAll(message) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            sendMessage(client, message)
        }
    });
}

function sendMessage(ws, message) {
    ws.send(JSON.stringify(message))
}

app.listen(process.env.PORT || 8001)
