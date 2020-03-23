const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')
const shuffle = require('shuffle-array')

/** Web Sockets **/
const wss = new WebSocket.Server({ port: 8002 })

wss.on('connection', function connection(ws) {
    const playerId = uuidv4()
    ws.id = playerId
    sendMessage(ws, {action: 'ASSIGN_PLAYER_ID', payload: {playerId: playerId}})
    // updatePlayers()
    ws.on('message', function incoming(message) {
        console.log('received: %s', message)
        reply(ws, message)
    })
})

function reply(ws, message) {
    const data = JSON.parse(message)
    switch(data.action) {
        case 'JOIN_GAME':
            ws.playerName = data.payload.playerName
            sendMessage(ws, {action: 'JOINED', payload: {gameId: data.payload.gameId}})
            updatePlayers()
            break
        case 'CALL_HOUSE':
            sendMessageToAll({action: 'HOUSE_CALLED', payload: {playerName: ws.playerName}})
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
    const tickets = shuffle([...Array(wss.clients.size).keys()])
    wss.clients.forEach((client) => {
        sendMessage(client, {action: 'ASSIGN_TICKET', payload: tickets.pop().toString()})
    })
}

function startGame() {
    sendMessageToAll({action: 'START_GAME'})
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
