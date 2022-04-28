import {Lobby} from '../lobby.mjs'
import asserts from 'assert'
const lobby = Lobby()

// Create players
let p1 = "1"
let p2 = "2"
let p3 = "3"
let p4 = "4"

let test = 0
let idLobby
lobby.createLobby(p1, (i) => {
    test++
    idLobby = i
})
asserts(test == 1)

let testJoinCallback = []
let joinCallback = (target, newPlayer) => {testJoinCallback.push([target, newPlayer])}
lobby.joinLobby(idLobby, p2, () => {test++}, () => {}, joinCallback)
lobby.joinLobby(idLobby, p3, () => {test++}, () => {}, joinCallback)
lobby.joinLobby(idLobby, p4, () => {test++}, () => {}, joinCallback)
asserts(test == 4)

// Check the callbacks are corrects
asserts(testJoinCallback.length == 6)
asserts(testJoinCallback[0][0] == 1)
asserts(testJoinCallback[0][1] == 2)
asserts(testJoinCallback[1][0] == 1)
asserts(testJoinCallback[1][1] == 3)
asserts(testJoinCallback[2][0] == 2)
asserts(testJoinCallback[2][1] == 3)
asserts(testJoinCallback[3][0] == 1)
asserts(testJoinCallback[3][1] == 4)
asserts(testJoinCallback[4][0] == 2)
asserts(testJoinCallback[4][1] == 4)
asserts(testJoinCallback[5][0] == 3)
asserts(testJoinCallback[5][1] == 4)

// CHeck the leave is correct
let notifyLeave = []
lobby.leaveLobby(p2, (player, p) => {notifyLeave.push([player, p])}, () => {})
asserts(notifyLeave.length == 3)
asserts(notifyLeave[0][1] ==  p2)
asserts(notifyLeave[1][1] == p2)
asserts(notifyLeave[2][1] == p2)
asserts(notifyLeave[0][0] !=  p2)
asserts(notifyLeave[1][0] != p2)
asserts(notifyLeave[2][0] != p2)

console.log("All tests passed !")

