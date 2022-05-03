import { Lobby } from './lobby.mjs'
const makeId = Lobby().makeId

// ********************* DATA STRUCTURES ********************

const gameMap = {} // GameID -> Game


// ********************* PUBLIC CLASSES *******************

class Game {

    constructor() {
        this.id = makeId(5)
        while(this.id in gameMap) {
            this.id = makeId(5)
        }
        gameMap[this.id] = this

        // Players
        this.players = {}
    }

    // Initialization functions

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
            'ws': player.ws
        }
    }


    /**
     * Function to handle commands from users
     * @param {Object} data 
     * @param {WebSocket} ws 
     */
    handleMessage(data, ws) {
        
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
 * @returns {Game}
 */
function createGame () {
    return new Game()
}


export function GameInterface() {
    return {
        'createGame': createGame,
        'handleMessage': handleMessage
    }
}

