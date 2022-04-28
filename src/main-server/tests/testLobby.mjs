import {Lobby} from '../lobby.mjs'
import asserts from 'assert'
const lobby = Lobby()

// Create players
let p1 = {
    name: "1"
}
let p2 = {
    name: "1"
}
let p3 = {
    name: "1"
}
let p4 = {
    name: "1"
}

let test = 0
lobby.createLobby(p1, () => {test++})
asserts(test == 1)



console.log("All tests passed !")