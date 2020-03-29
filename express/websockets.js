const WebSocket = require('ws')

/** Web Sockets **/
const wss = new WebSocket.Server({ port: 8002 })

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message)
        processMessage(ws, JSON.parse(message))
    })
})

function processMessage(ws, message) {
    if (message.action === 'SET_PLAYER_ID') {
        ws.playerId = message.payload
    }
}

function sendMessageToAll(message) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            sendMessage(client, message)
        }
    })
}

function sendMessage(ws, message) {
    ws.send(JSON.stringify(message))
}

const houseCalled = (playerName) => {
    sendMessageToAll({action: 'HOUSE_CALLED', payload: {playerName: playerName}})
}

const updatePlayers = (playerNames) => {
    sendMessageToAll({
        action: 'UPDATE_PLAYERS', payload: playerNames
    })
}

const assignBingoSheets = () => {
    wss.clients.forEach((client) => {
        sendMessage(client, {action: 'ASSIGN_TICKET'})
    })
}

const startGame = () => {
    sendMessageToAll({action: 'START_GAME'})
}

const testPlayerAudio = (playerId) => {
    const client = Array.from(wss.clients).find(client => client.playerId === playerId)
    sendMessage(client, {action: 'TEST_AUDIO'})
}

module.exports = {updatePlayers, assignBingoSheets, startGame, houseCalled, testPlayerAudio}