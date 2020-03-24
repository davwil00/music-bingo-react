const ObjectId = require('mongodb').ObjectId

module.exports = class Db {
    constructor(client) {
        this.users = client.db("bingo").collection("users")
        this.games = client.db('bingo').collection('games')
    }

    createUser(username, refreshToken, accessToken) {
        return this.users.insertOne({username, refreshToken, accessToken})
    }

    getUser(username) {
        return this.users.findOne({_id: new ObjectId(username)})
    }

    createGame(name, ownerId, playlist) {
        return this.games.insertOne({name, ownerId, playlist, players: [], status: 'OPEN'})
    }

    getGames() {
        const games = this.games
        return games.find().toArray()
    }

    getGame(gameId) {
        return this.games.findOne({_id: new ObjectId(gameId)})
    }

    updateGameStatus(gameId, newStatus) {
        return this.games.update({_id: new ObjectId(gameId)}, {
            update: {
                $set: {
                    status: newStatus
                }
            }
        })
    }

    addPlayerToGame(gameId, playerId, playerName) {
        return this.games.updateOne({_id: new ObjectId(gameId)}, {
            $push: {
                players: {
                    _id: playerId,
                    name: playerName
                }
            }
        })
    }

    getPlayerNames(gameId) {
        return this.games.findOne({_id: new ObjectId(gameId)}, {projection: {"players.name": 1}})
    }

    assignPlayers(gameObjectId, players) {
        return this.games.updateOne({_id: gameObjectId}, {
            $set: {
                players,
                status: 'ASSIGNED'
            }
        })
    }

    getBingoSheet(gameId, playerId) {
        return this.games.findOne({_id: new ObjectId(gameId), "players._id": playerId},
            {
                projection: {
                    "players.bingoSheet.artist": 1,
                    "players.bingoSheet.title": 1
                }
            }
        )
    }

    findGameByIdAndPlayer(gameId, playerId) {
        return this.games.findOne({_id: new ObjectId(gameId), "players._id": playerId}, {projection: {status: 1}})
    }

}
