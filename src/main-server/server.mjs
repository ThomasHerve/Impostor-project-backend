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
 * - playerID : id of the player, delivered by the server at the beginning
 * - playerName : name of the player, choose by the player itself 
 * - lobbyID : id of the lobby to join
 */
wss.on('connection', (ws)=>{
    ws.on('message', (data)=>{
        data = JSON.parse(data)
        if(data.type === "createLobby") {
            let id = registerPlayer(data.playerName, ws)
            lobby.createLobby(
                id,
                (lobbyID) => {
                    ws.send(JSON.stringify({
                        "type": "lobbyCreated",
                        "lobbyID" : lobbyID,
                    }), (error) => {
                        leaveLobby(id)
                    })
                }
            )
        } else if(data.type === "joinLobby") {
            let id = registerPlayer(data.playerName, ws)
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
                        "playersID": playerArray 
                    }),
                    (error)=>{
                        leaveLobby(id)
                    })
                },
                // failure : lobby doesn't exist
                () => {
                    ws.send(JSON.stringify({
                        "type": "nonExistingLobby"
                    }), 
                    (error) => {delete playersMap[id]})
                },
                // Callback for other players
                (playerID, newPlayerID) => {
                    playersMap[playerID].ws.send({
                       "type": "newPlayerJoinedLobby",
                       "newPlayerName": playersMap[newPlayerID].name
                    },
                    (error) => {
                        leaveLobby(id)
                    })
                } 
            )
        } else if(data.type === "leaveLobby") {
            leaveLobby(data.playerID)
        } else if(data.type === "launchGame") {
            // Start game
            let gameInstance = game.createGame()
            lobby.launchGame(data.playerID, (playerID) => {
                let alive = true
                playersMap[playerID].ws.send(JSON.stringify({
                    "type": "startGame",
                    "gameID": gameID
                }),(error)=>{alive = false})
                
                // Add player to the game
                if(alive) {
                    gameInstance.addPlayer(gameID, {
                        'id': playerID,
                        'name': playersMap[playerID].name,
                        'ws': playersMap[playerID].ws
                    })
                }
                delete playersMap[playerID]
            })
            gameInstance.startGame()
        } else {
            game.handleMessage(data, ws)
        }
    })
})

// ********************* DATA STRUCTURES ********************

const playersMap = {} // ID -> {name, websocket}

// *********************     FUNCTIONS   ********************

/**
 * Function to call to register a new player
 * @param {String} name the player to register
 * @param {WebSocket} ws the websocket of the player
 * @returns {String} the id of the player
 */
function registerPlayer(name, ws) {
    let id = lobby.makeId(5)
    while(id in playersMap) {
        id = lobby.makeId(5)
    }
    playersMap[id] = {
        "name": name,
        "ws": ws
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
                "playerLeavingName": playersMap[playerLeavingID]
            }),(error)=>{
                leaveLobby(playersMap[pID])
            })
        },
        // Owner leaving
        (pID)=>{
            playersMap[pID].ws.send(JSON.stringify({
                "type": "lobbyDestroyed",
            }),(error)=>{})
            delete playersMap[pID]
        }
    )
    delete playersMap[playerID]
}

/**
 * 
 * Send type:
 * - createLobby (playerName)
 * - joinLobby (playerName, lobbyID)
 * - leaveLobby (id)
 * - launchGame (id)
 * 
 * Receive type
 * - playerLeave (playerLeavingName) 
 * - lobbyDestroyed ()
 * - lobbyCreated (lobbyID)
 * - nonExistingLobby ()
 * - lobbyJoinSuccess (playersID)
 * - newPlayerJoinedLobby (newPlayerName)
 */