import { Lobby } from './lobby.mjs'
const makeId = Lobby().makeId

// ********************* DATA STRUCTURES ********************

const gameMap = {} // GameID -> Game
const playerMap = {} // PlayerID -> GameID

// ********************* PUBLIC CLASSES *******************

class Game {

    /**
     * The Game constructor
     * @param {Object} parameters object containing the parameters  
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

    // Lobby functions

    /**
     * Function to start the Game
     */
    startGame() {
        // TODO
    }

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
     * Function to handle commands from users
     * @param {Object} data 
     * @param {WebSocket} id
     * @param {WebSocket} ws 
     */
    handleMessage(data, id, ws) {

    }



    // Game functions



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

}

/**
 * Function to handle the reconnection of a player that leaved a game
 * @param {String} id playerID 
 * @param {*} ws the new websocket of the player
 */
function handleReconnect(id, ws) {

}


export function GameInterface() {
    return {
        'createGame': createGame,
        'handleMessage': handleMessage,
        'handleLeave':handleLeave,
        'handleReconnect':handleReconnect
    }
}

