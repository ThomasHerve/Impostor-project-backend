import { WebSocketServer } from 'ws';
import { Lobby } from './lobby.mjs'
const lobby = Lobby()

// ********************* SERVER LOGIC ********************

const wss = new WebSocketServer({
    port: 8080
})
console.log("Server started")

/**
 * data contains : 
 * - type : Nature of the packet
 * - playerName : name of the player, choose by the player itself 
 */
wss.on('connection', (ws)=>{
    console.log("Anonymous user connected")
    let id = ""
    ws.on('close', ()=>{
        if(id in playersMap) {
            leaveLobby(id)
        } else {
            console.log(`Anonymous user leaved`)
        }
    })
    ws.on('message', (data)=>{
        data = JSON.parse(data)
        if(data.type === "createLobby") {
            if(id === "") {
                id = registerPlayer(ws)
                lobby.createLobby(
                    id,
                    (lobbyID) => {
                        ws.send(JSON.stringify({
                            "type": "lobbyCreated",
                            "lobbyID" : lobbyID,
                        }))
                        console.log(`Player ${playersMap[id].name} created a lobby with id ${lobbyID}`)
                    }
                )
            } else {
                ws.send(JSON.stringify({
                    "type": "alreadyInLobby",
                }))
            }
        } else if(data.type === "joinLobby") {
            if(id === "") {
                id = registerPlayer(ws)
                lobby.joinLobby(
                    data.lobbyID,
                    id,
                    // Callback for the new player
                    (playerIDList) => {
                        const playerArray = []
                        playerIDList.forEach((i)=>{
                            if(i != id) {
                                playerArray.push(playersMap[i].name)
                            }
                        })
                        ws.send(JSON.stringify({
                            "type": "lobbyJoinSuccess",
                            "players": playerArray 
                        }))
                        console.log(`Player ${playersMap[id].name} joined the ${data.lobbyID} lobby`)
                    },
                    // failure : lobby doesn't exist
                    () => {
                        ws.send(JSON.stringify({
                            "type": "nonExistingLobby"
                        }))
                        id = ""
                    },
                    // Callback for other players
                    (playerID) => {
                        playersMap[playerID].ws.send(JSON.stringify({
                           "type": "playerJoined",
                           "players": getNames(lobby.allPlayerOfLobby(playerID))
                        }))
                    } 
                )
            } else {
                ws.send(JSON.stringify({
                    "type": "alreadyInLobby",
                }))
            }
        } else if(data.type === "leaveLobby") {
            if(id != "") {
                leaveLobby(id)
                ws.send(JSON.stringify({
                    "type": "acknowledgeLeaveLobby",
                }))
                id = ""
            }
        } else if(data.type === "changeName") {
            if(id != "" && data.playerName != undefined) {
                console.log(`Player ${playersMap[id].name} renammed to ${data.playerName}`)
                playersMap[id].name = data.playerName
                lobby.callbackAllPlayers(id, (p)=>{
                    if(p != id) {
                        playersMap[p].ws.send(JSON.stringify({
                            "type": "changeName",
                            "players": getNames(lobby.allPlayerOfLobby(p))
                        }))
                    } else {
                        ws.send(JSON.stringify({
                            "type": "acknowledgeNewName",
                        }))
                    }
                })
            }
        } else if(data.type === "launchGame") {       
            if(data.numberOfImpostors == undefined || data.tasks == undefined || id === "") {
                ws.send(JSON.stringify({
                    "type": "invalidPacket",
                }))
            } else {
                let parameters = {
                    "numberOfImpostors": data.numberOfImpostors,
                    "tasks": data.tasks
                }
                if(!lobby.isOwner(id) || !checkGameValid(parameters, id, lobby.allPlayerOfLobby(id))) {
                    ws.send(JSON.stringify({
                        "type": "invalidLobby",
                    }))
                    return
                }
                let gameInstance = undefined
                lobby.launchGame(id,
                    () => {
                        // Start game
                        // gameInstance = game.createGame(parameters, unregisterPlayer) // OLD
                        gameInstance = new Game(parameters)
                    }, 
                    (playerID) => {
                    // Add player to the game
                    gameInstance.addPlayer({
                        'id': playerID,
                        'name': playersMap[playerID].name,
                        'ws': playersMap[playerID].ws
                    })
                    // Remove the players from the map which track them
                    delete playersMap[playerID]
                })
                if(gameInstance != undefined) {
                    gameInstance.launchGame()
                }
            }
        }
    })
})

// ********************* DATA STRUCTURES ********************

const playersMap = {} // ID -> {name, websocket}, only the players in lobby
const playersIDSet = new Set() // All the player, even the ones in game, to warranty the unicity have the ids

// *********************     FUNCTIONS   ********************

/**
 * Function to call to register a new player
 * @param {String} name the player to register
 * @param {WebSocket} ws the websocket of the player
 * @returns {String} the id of the player
 */
function registerPlayer(ws) {
    let id = lobby.makeId(5)
    while(playersIDSet.has(id)) {
        id = lobby.makeId(5)
    }
    playersIDSet.add(id)
    playersMap[id] = {
        "name": "Player",
        "ws": ws
    }
    return id
}

/**
 * Function called by a game to unregister a player
 * @param {String} id 
 */
function unregisterPlayer(id) {
    if(playersIDSet.has(id)) {
        playersIDSet.delete(id)
    }
}

/**
 * function to call when a player break the connection with the server
 * @param {String} playerID the player id 
 */
function leaveLobby(playerID) {
    let ids = lobby.allPlayerOfLobby(playerID)
    ids = ids.filter(item => {
        return item != playerID
    });
    lobby.leaveLobby(playerID,
        // Non owner leaving
        (pID)=>{
            let names = getNames(ids.filter(item => {
                return item != pID
            }))
            playersMap[pID].ws.send(JSON.stringify({
                "type": "playerLeft",
                "players": names
            }))
        },
        // Owner leaving
        (pID)=>{
            playersMap[pID].ws.send(JSON.stringify({
                "type": "lobbyDestroyed",
            }))
            delete playersMap[pID]
            unregisterPlayer(pID)
        }
    )
    console.log(`Player ${playersMap[playerID].name} leaved`)
    delete playersMap[playerID]
    unregisterPlayer(playerID)
}

function getNames(playersID) {
    let ret = []
    playersID.forEach((item)=>{
        ret.push(playersMap[item].name)
    })
    return ret
}

// ********************* Game descriptor class ***************

class Game {

    constructor(parameters) {
        this.parameters = parameters
        this.players = []
    }

    addPlayer(playerID) {
        this.players.push(playerID)
    }

    launchGame() {
        // Create Game
        console.log("Here create new game")

        // Notify players
        this.players.forEach((player)=>{
            player.ws.send(JSON.stringify({
                "type": "startGame",
                "IP": "TODO",
                "PORT": "TODO"
            }))
            // Remove player from id map
            unregisterPlayer(player.id)
        })
    }
}

function checkGameValid(parameters, ownerID, playersID) {
    let n = playersID.length + 1
    if(n < lobby.minPlayers) {
        return false
    }
    if(parameters.numberOfImpostors < 1) {
        return false
    }
    // At least 4 tasks
    if(parameters.tasks.length < 4) {
        return false
    }
    // Check tasks are correct
    parameters.tasks.forEach((task)=>{
        if(task.length != 2) {
            return false
        }
    })
    return true
}

/**
 * 
 * Send type:
 * - createLobby ()
 * - joinLobby (lobbyID)
 * - leaveLobby ()
 * - launchGame (numberOfImpostors)
 * - changeName (playerName)
 * 
 * Receive type
 * - playerLeft (playerLeavingName) 
 * - lobbyDestroyed ()
 * - lobbyCreated (lobbyID)
 * - nonExistingLobby ()
 * - lobbyJoinSuccess (playersName)
 * - playerJoined (players)
 */
