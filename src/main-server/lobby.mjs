// ********************* DATA STRUCTURES ********************

const minPlayers = 4
const lobbyMap = {}
const ownerMap = {}
const joinerMap = {}

// ********************* PUBLIC FUNCTIONS *******************

/**
 * Function which handle the creation of a new lobby
 * @param {Object} player the player
 * @param {Function} successFunction a function which will be called if the lobby creation is a success
 */
function createLobby(player, successFunction) {
    let idLobby = generateLobbyID()
    successFunction(idLobby)
    lobbyMap[idLobby] = [player]
    ownerMap[player] = idLobby
}

/**
 * Function which handle the join of an existing lobby
 * @param {String} idLobby the lobby id given by the client
 * @param {Object} player the player 
 * @param {Function} successFunction a function which will be called if the lobby creation is a success
 * @param {Function} failureFunction a function which will be called if the lobby creation is a failure
 * @param {Function} newPlayerEnterFunction a function which will be called each time a new player join the lobby
 */
function joinLobby(idLobby, player, successFunction, failureFunction, newPlayerEnterFunction) {
    if(!(idLobby in lobbyMap)) {
        failureFunction()
    } else {
        lobbyMap[idLobby].forEach((p)=>{
            // p = player to send the callback
            // player = player data to send
            newPlayerEnterFunction(p, player)
        })
        lobbyMap[idLobby].push(player)
        joinerMap[player] = idLobby
        successFunction()
    }
}

/**
 * Function which handle a player leaving a lobby
 * @param {Object} player player leaving his lobby
 * @param {Function} notifyPlayerFunction callback to the players still in the lobby when a joiner leave
 * @param {Function} notifyPlayerDisbandFunction callback when the owner leave
 */
function leaveLobby(player, notifyPlayerFunction, notifyPlayerDisbandFunction) {
    // Owner case
    if(player in ownerMap) {
        let lobbyArray = lobbyMap[ownerMap[player]]
        delete lobbyMap[ownerMap[player]]
        delete ownerMap[player]
        lobbyArray.forEach((p)=>{
            if(p != player) {
                notifyPlayerDisbandFunction(p)
                delete joinerMap[player]
            }
        })
    } else { // Player case
        lobbyMap[joinerMap[player]].forEach((p)=>{
            if(p != player) {
                notifyPlayerFunction(p, player)
            }
        })
        let index = lobbyMap[joinerMap[player]].indexOf(player)
        if(index > -1) {
            lobbyMap[joinerMap[player]].splice(index, 1)
        }
        delete joinerMap[player]
    }
}

/**
 * Function to call to launch a lobby
 * @param {Object} player the owner of the lobby launching the game
 * @param {Function} launchFunction function which will be called to launch the game
 */
function launchGame(player, launchFunction) {
    if(player in ownerMap && lobbyMap[ownerMap[player]].length >= minPlayers) {
        let idLobby = ownerMap[player]
        launchFunction(lobbyMap[idLobby])
        lobbyMap[idLobby].forEach((p)=>{
            if(p != player) {
                delete joinerMap[p]
            }
        })
        delete ownerMap[player]
        delete lobbyMap[idLobby]
    }
}

// ********************* PRIVATE FUNCTIONS *******************

function generateLobbyID() {
    let idLobby = "123456" // TO CHANGE
    while(idLobby in lobbyMap) {
        idLobby = "234567" // TO CHANGE
    }
    return idLobby
}


export function Lobby() {
    return {
        'createLobby': createLobby,
        'joinLobby': joinLobby,
        'leaveLobby': leaveLobby,
        'launchGame': launchGame,

        // Expose this data structures for testing purposes
        'lobbyMap': lobbyMap,
        'ownerMap': ownerMap,
        'joinerMap': joinerMap
    }
}

