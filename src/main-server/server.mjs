import { WebSocketServer } from 'ws';
import { Lobby } from './lobby.mjs'
import { GameInterface } from './main.mjs'
const lobby = Lobby()
const game = GameInterface()

// ********************* SERVER LOGIC ********************

const wss = new WebSocketServer({
    port: 8080
})

/**
 * data contains : 
 * - type : Nature of the packet
 * - playerName : name of the player, choose by the player itself 
 */
wss.on('connection', (ws)=>{
    let id = ""
    ws.on('close', ()=>{
        if(id in playersMap) {
            leaveLobby(id)
        } else {
            game.handleLeave(id)
        }
    })
    ws.on('message', (data)=>{
        data = JSON.parse(data)
        if(data.type === "createLobby") {
            if(data.playerName == undefined) {
                ws.send(JSON.stringify({
                    "type": "invalidPacket",
                }))
            }
            else if(id === "") {
                id = registerPlayer(data.playerName, ws)
                lobby.createLobby(
                    id,
                    (lobbyID) => {
                        ws.send(JSON.stringify({
                            "type": "lobbyCreated",
                            "lobbyID" : lobbyID,
                        }))
                    }
                )
            } else {
                ws.send(JSON.stringify({
                    "type": "alreadyInLobby",
                }))
            }
        } else if(data.type === "joinLobby") {
            if(data.playerName == undefined) {
                ws.send(JSON.stringify({
                    "type": "invalidPacket",
                }))
            }
            else if(id === "") {
                id = registerPlayer(data.playerName, ws)
                lobby.joinLobby(
                    data.lobbyID,
                    id,
                    // Callback for the new player
                    (playerIDList) => {
                        const playerArray = []
                        playerIDList.forEach((id)=>{
                            playerArray.push(playersMap[id].name)
                        })
                        ws.send(JSON.stringify({
                            "type": "lobbyJoinSuccess",
                            "playersName": playerArray 
                        }))
                    },
                    // failure : lobby doesn't exist
                    () => {
                        ws.send(JSON.stringify({
                            "type": "nonExistingLobby"
                        }))
                        id = ""
                    },
                    // Callback for other players
                    (playerID, newPlayerID) => {
                        playersMap[playerID].ws.send(JSON.stringify({
                           "type": "newPlayerJoinedLobby",
                           "newPlayerName": playersMap[newPlayerID].name
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
                id = ""
            }
        } else if(data.type === "launchGame") {       
            if(data.numberOfImpostors == undefined) {
                ws.send(JSON.stringify({
                    "type": "invalidPacket",
                }))
            } else {
                let gameInstance = undefined
                let parameters = {
                    "numberOfImpostors": data.numberOfImpostors 
                }
                lobby.launchGame(id,
                    () => {
                        // Start game
                        gameInstance = game.createGame(parameters, unregisterPlayer)
                    }, 
                    (playerID) => {
                    playersMap[playerID].ws.send(JSON.stringify({
                        "type": "startGame"
                    }))
                    // Add player to the game
                    gameInstance.addPlayer({
                        'id': playerID,
                        'name': playersMap[playerID].name,
                        'ws': playersMap[playerID].ws
                    })
                    
                    delete playersMap[playerID]
                })
                if(gameInstance != undefined) {
                    gameInstance.startGame()
                }
            }
        } else {
            game.handleMessage(data, id,  ws)
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
function registerPlayer(name, ws) {
    let id = lobby.makeId(5)
    while(playersIDSet.has(id)) {
        id = lobby.makeId(5)
    }
    playersIDSet.add(id)
    playersMap[id] = {
        "name": name,
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
    lobby.leaveLobby(playerID,
        // Non owner leaving
        (pID, playerLeavingID)=>{
            playersMap[pID].ws.send(JSON.stringify({
                "type": "playerLeave",
                "playerLeavingName": playersMap[playerLeavingID].name
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
    playersMap[playerID].ws.send(
        JSON.stringify({
            "type": "Aknowledge leaving"
        })
    )
    console.log(`Player ${playersMap[playerID].name} leaved`)
    delete playersMap[playerID]
    unregisterPlayer(playerID)
}

/**
 * 
 * Send type:
 * - createLobby (playerName)
 * - joinLobby (playerName, lobbyID)
 * - leaveLobby ()
 * - launchGame (numberOfImpostors)
 * 
 * Receive type
 * - playerLeave (playerLeavingName) 
 * - lobbyDestroyed ()
 * - lobbyCreated (lobbyID)
 * - nonExistingLobby ()
 * - lobbyJoinSuccess (playersID)
 * - newPlayerJoinedLobby (newPlayerName)
 */