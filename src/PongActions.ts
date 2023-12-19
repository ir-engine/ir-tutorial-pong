//////////////////////////////////////////////////////////////////////////////////////////////////
///
/// pong networked state action datagram shapes
///
//////////////////////////////////////////////////////////////////////////////////////////////////

import { matches, matchesEntityUUID, matchesQuaternion, matchesVector3 } from "@etherealengine/engine/src/common/functions/MatchesUtils"
import { NetworkTopics } from "@etherealengine/engine/src/networking/classes/Network"
import { defineAction, defineActionQueue, defineState, dispatchAction, receiveActions } from "@etherealengine/hyperflux"
import { pongGoal, pongMove, pongPong } from "./PongUpdate"
import { netlog, pongLocalLog } from "./PongLogging"

export class PongAction {

  static pongLog = defineAction({
    type: 'pong.log',
    log: matches.string,
    $topic: NetworkTopics.world
  })

  static pongPong = defineAction({
    type: 'pong.pong',
    uuid: matchesEntityUUID,
    mode: matches.string,
    $topic: NetworkTopics.world
  })

  static pongGoal = defineAction({
    type: 'pong.goal',
    entityUUID: matchesEntityUUID,
    damage: matches.string,
    $topic: NetworkTopics.world
  })

  static pongMove = defineAction({
    type: 'pong.move',
    entityUUID: matchesEntityUUID,
    kinematicPosition: matchesVector3.optional(),
    kinematicRotation: matchesQuaternion.optional(),
    position: matchesVector3.optional(),
    rotation: matchesQuaternion.optional(),
    impulse: matchesVector3.optional(),
    $topic: NetworkTopics.world,
  })
}

export const PongNetworkState = defineState({
  name: 'pong.PongNetworkStateReceptors',
  initial: {},
  receptors: [
    [
      PongAction.pongGoal,
      (state, action: typeof PongAction.pongGoal.matches._TYPE) => {
        pongGoal(action)
      }
    ],
    [
      PongAction.pongPong,
      (state, action: typeof PongAction.pongPong.matches._TYPE) => {
        pongPong(action)
      }
    ],
    [
      PongAction.pongMove,
      (state, action: typeof PongAction.pongMove.matches._TYPE) => {
        pongMove(action)
      }
    ]
  ]
})

const pongLogQueue = defineActionQueue(PongAction.pongLog.matches)

export function updateNetwork() {

  // a private network queue for debugging
  for (const action of pongLogQueue()) pongLocalLog(action)

  // shared events that are event sourced so that late joiners can get a copy of the current game state
  receiveActions(PongNetworkState)

}
