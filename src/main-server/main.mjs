import { Lobby } from './lobby.mjs'
const makeId = Lobby().makeId

// ********************* DATA STRUCTURES ********************

const gameMap = {} // GameID -> Game
const playerMap = {} // PlayerID -> GameID

// ********************* PUBLIC CLASSES *******************

class Game {

    constructor(endGameCallback) {
        this.endGameCallback = endGameCallback // Function which unregister one player, to call on all player when game is over
        this.id = makeId(5)
        while(this.id in gameMap) {
            this.id = makeId(5)
        }
        gameMap[this.id] = this

        // Players
        this.players = {}
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
            'ws': player.ws
        }
    }


    /**
     * Function to handle commands from users
     * @param {Object} data 
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

function handleLeave(id) {

}


export function GameInterface() {
    return {
        'createGame': createGame,
        'handleMessage': handleMessage,
        'handleLeave':handleLeave
    }
}

