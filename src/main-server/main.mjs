import { Lobby } from './lobby.mjs'
const makeId = Lobby().makeId


/**
 * 
 * PARAMETERS OF A GAME CURRENTLY AVAILABLES:
 * numberOfImpostors (Mandatory): the number of impostors 
 * 
 * 
 */



// ********************* DATA STRUCTURES ********************

const gameMap = {} // GameID -> Game
const playerMap = {} // PlayerID -> GameID

// ********************* PUBLIC CLASSES *******************

class Game {

    /**
     * The Game constructor
     * @param {Object} parameters object containing the parameters (See above for more details)
     * @param {*} endGameCallback Function which unregister one player, to call on all player when game is over
     */
    constructor(parameters, endGameCallback) {

        // Attributes
        this.endGameCallback = endGameCallback
        this.parameters = parameters
        this.id = makeId(5)
        this.players = {}

        while(this.id in gameMap) {
            this.id = makeId(5)
        }
        gameMap[this.id] = this


    }

    // External functions, Which means they are called by the outside (lobby management, player disconnecting/reconnecting)
    /**
     * Add a player to the game
     * @param {Object} player 
     */
    addPlayer(player) {
        this.players[player.id] = {
            'name': player.name,
            'ws': player.ws,
            'online': true // Will be passed to false if the connection with the client is broken
        }
        playerMap[player.id]  = this.id
    }
    
    /**
     * Handle a player of this particular game leaving
     * @param {String} playerID 
     */
    playerLeaved(playerID) {
        this.players[playerID].online = false
    }

    /**
     * handle the reconnection of a player
     * @param {String} playerID 
     */
    playerReconnect(playerID) {
        this.players[playerID].online = true
    }

    /**
     * Function to handle commands from users
     * @param {Object} data 
     * @param {WebSocket} id
     * @param {WebSocket} ws 
     */
    handleMessage(data, id, ws) {
        
    }

    // Game functions, called from this class (excepting startGame)
    /**
     * Function to start the Game
     */
    startGame() {
        // Players are already notified that the game has began
        this.parametrizePlayers()
        this.selectImpostors()
    }


    /**
     * populate the missing fields in players
     */
    parametrizePlayers() {
        for(let playerID in this.players) {
            this.players[playerID]["status"] = {
                'alive': true,
                'impostor': false,
                'tasks': []
            }
        }
    }

    /**
     * Function which design the impostors among the players
     */
    selectImpostors() {
        // Security, you cannot have more than 25% of the players as impostor
        let playersID = Object.keys(this.players)
        let numberOfImpostors = Math.max(this.parameters.numberOfImpostors, Math.floor(playersID.length / 4))

        // Security against any possible infinite loop
        let maxRetry = 10000

        while(numberOfImpostors > 0) {
            let randomPlayer = playersID[Math.floor(Math.random() * playersID.length)]
            if(!this.players[playersID].status.impostor) {
                this.players[playersID].status.impostor = true
                numberOfImpostors--
            } else {
                maxRetry--
                if(maxRetry === 0) {
                    console.log(`Game ${this.id} was stuck in an infinite loop for impostors selection`)
                    this.end()
                }
            }
        }
    }

    notifyPlayersRoles() {
        for(let playerID in this.players) {
            let role = "crewmate"
            if(this.players[playerID].status.impostor) {
                role = "impostor"
            }
            this.players[playerID].ws.send(JSON.stringify({
                "type": "playerRole",
                "role": role
            }))
        }
    }

    // End the game
    /**
     * Method to call to end this game
     */
    end() {
        for(let playerID in this.players) {
            delete playerMap[playerID]
            this.endGameCallback(playerID)
        }
        delete gameMap[this.id]
        console.log(`Game ${this.id} ended`)
    }
}


// Entrypoint for server
function handleMessage(data, ws) {
    if(data.gameID != undefined && data.gameID in gameMap) {
        gameMap[data].handleMessage(data, ws)
    }
}

/**
 * Function to create a new game
 * @param {Function} endGameCallback
 * @returns {Game}
 */
function createGame (endGameCallback) {
    return new Game(endGameCallback)
}

/**
 * Function to handle a player which broke the connection with the server
 * @param {String} id the id of the player that broke the connection
 */
function handleLeave(id) {
    gameMap[playerMap[id]].playerLeaved(id)
}

/**
 * Function to handle the reconnection of a player that leaved a game
 * @param {String} id playerID
 * @param {*} ws the new websocket of the player
 */
function handleReconnect(id, ws) {
    gameMap[playerMap[id]].playerReconnect(id)
}


export function GameInterface() {
    return {
        'createGame': createGame,
        'handleMessage': handleMessage,
        'handleLeave':handleLeave,
        'handleReconnect':handleReconnect
    }
}

/**
 * 
 * Send type:
 * 
 * Receive type
 * - playerRole (role) 
 */