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
    switch (message.action) {
        case 'SET_PLAYER_ID':
            ws.playerId = message.payload
            break;
        case 'SET_ADMIN':
            ws.isAdmin = true
            break;
        case 'AUDIO_TEST_FAILED':
            sendAdminMessage('AUDIO_FAILED', ws.playerId)
            break;

        default:
            return
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
    if (!ws) {
        console.error("Unbale to send message")
    }
    const msgStr = JSON.stringify(message)
    console.log(`sending message ${msgStr}`)
    ws.send(msgStr)
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

function sendAdminMessage(action, payload) {
    const adminClient = Array.from(wss.clients).filter(client => client.isAdmin)
    sendMessage(adminClient, {action, payload})
}

module.exports = {updatePlayers, assignBingoSheets, startGame, houseCalled, testPlayerAudio}