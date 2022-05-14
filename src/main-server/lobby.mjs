// ********************* DATA STRUCTURES ********************

const minPlayers = 4
const lobbyMap = {} // ID -> player[]
const ownerMap = {} // player -> ID
const joinerMap = {} // player -> ID

// ********************* PUBLIC FUNCTIONS *******************

/**
 * Function which handle the creation of a new lobby
 * @param {Object} player the player
 * @param {Function} successFunction a function which will be called if the lobby creation is a success
 */
function createLobby(player, successFunction) {
    let idLobby = generateLobbyID()
    lobbyMap[idLobby] = [player]
    ownerMap[player] = idLobby
    successFunction(idLobby)
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
        lobbyMap[idLobby].push(player)
        joinerMap[player] = idLobby
        lobbyMap[idLobby].forEach((p)=>{
            // p = player to send the callback
            // player = player data to send
            newPlayerEnterFunction(p)
        })
        successFunction(lobbyMap[idLobby])
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
                notifyPlayerFunction(p)
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
 * @param {Function} successFunction function which will be called one time if success
 * @param {Function} launchFunctionOnePlayer function which will be called on each player to launch the game
 */
function launchGame(player, successFunction, launchFunction) {
    if(player in ownerMap && lobbyMap[ownerMap[player]].length >= minPlayers) {
        let idLobby = ownerMap[player]
        successFunction()
        lobbyMap[idLobby].forEach((p)=>{
            launchFunction(p)
            if(p != player) {
                delete joinerMap[p]
            }
        })
        delete ownerMap[player]
        delete lobbyMap[idLobby]
    }
}

/**
 * Function to call on every player of a lobby
 * @param {id} player the player
 * @param {Function} callback
 */
function callbackAllPlayers(player, callback) {
    if(player in ownerMap) {
        lobbyMap[ownerMap[player]].forEach((p)=>{
            callback(p)
        })
    } else {
        lobbyMap[joinerMap[player]].forEach((p)=>{
            callback(p)
        })
    }
}

/**
 * get list of players IDsm exept itself
 * @param {id} player 
 * @returns 
 */
function allPlayerOfLobby(player) {
    let p = []
    if(player in ownerMap) {
        p = lobbyMap[ownerMap[player]]
    } else {
        p = lobbyMap[joinerMap[player]]
    }
    return p.filter(item => {
        return item != player
    });
}

/**
 * Is the player an owner ?
 * @param {String} player 
 */
function isOwner(player) {
    return player in ownerMap
}

/**
 * Function to generate a random ID
 * @param {number} length the length of the id
 */
function makeId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


// ********************* PRIVATE FUNCTIONS *******************

function generateLobbyID() {
    let idLobby = makeId(5)
    while(idLobby in lobbyMap) {
        idLobby = makeId(5)
    }
    return idLobby
}

export function Lobby() {
    return {
        'createLobby': createLobby,
        'joinLobby': joinLobby,
        'leaveLobby': leaveLobby,
        'launchGame': launchGame,
        'makeId': makeId,
        'callbackAllPlayers': callbackAllPlayers,
        'allPlayerOfLobby': allPlayerOfLobby,
        'isOwner': isOwner,

        // Expose this data structures for testing purposes
        'lobbyMap': lobbyMap,
        'ownerMap': ownerMap,
        'joinerMap': joinerMap
    }
}

