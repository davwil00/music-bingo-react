const ObjectId = require('mongodb').ObjectId

module.exports = class Db {
    constructor(client) {
        this.client = client
        Db.instance = this
    }

    createUser(username, refreshToken, accessToken) {
        const users = this.client.db("bingo").collection("users")
        return users.insertOne({username, refreshToken, accessToken})
    }

    getUser(username) {
        const users = this.client.db("bingo").collection("users")
        return users.findOne({username})
    }

    createGame(name, playlistId) {
        const games = this.client.db('bingo').collection('games')
        return games.insertOne({name, playlistId, players: []})
    }

    getGames() {
        const games = this.client.db('bingo').collection('games')
        return games.find().toArray()
    }

    addPlayerToGame(gameId, playerId, playerName) {
        const games = this.client.db('bingo').collection('games')
        return games.update({_id: new ObjectId(gameId)}, {
            $push: {
                players: {
                    _id: playerId,
                    name: playerName
                }
            }
        })
    }
}
