
import { matches, matchesEntityUUID, matchesQuaternion, matchesVector3, matchesWithDefault } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { NetworkTopics } from '@etherealengine/engine/src/networking/classes/Network'
import { defineAction, defineActionQueue, dispatchAction, getState } from '@etherealengine/hyperflux'

import { pongLocalGoal } from './components/GoalComponent'
import { pongLocalLog } from './PongLogging'
import { pongLocalPong } from './components/PongComponent'

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
    damage: matches.number,
    $topic: NetworkTopics.world
  })

}

export function PongActionQueueReceptorContext() {
  const pongLogQueue = defineActionQueue(PongAction.pongLog.matches)
  const pongPongQueue = defineActionQueue(PongAction.pongPong.matches)
  const pongGoalQueue = defineActionQueue(PongAction.pongGoal.matches)
  const exhaustActionQueues = () => {
    for (const action of pongLogQueue()) pongLocalLog(action)
    for (const action of pongPongQueue()) pongLocalPong(action)
    for (const action of pongGoalQueue()) pongLocalGoal(action)
  }
  return exhaustActionQueues
}

export const updatePongNetworking = PongActionQueueReceptorContext()
