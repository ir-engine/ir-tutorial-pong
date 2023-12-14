
import { matches, matchesEntityUUID, matchesQuaternion, matchesVector3, matchesWithDefault } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { NetworkTopics } from '@etherealengine/engine/src/networking/classes/Network'
import { defineAction, defineActionQueue, dispatchAction, getState } from '@etherealengine/hyperflux'

import { pongLocalLog } from './PongLogging'
import { pongLocalPong } from './components/PongComponent'
import { getMutableComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { TextComponent } from './components/TextComponent'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { GoalComponent } from './components/GoalComponent'

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



export const pongLocalGoal = (action: ReturnType<typeof PongAction.pongGoal>) => {
  console.log("....... pong 1")
  const goal = UUIDComponent.entitiesByUUID[action.entityUUID]
  if(!goal) return
  console.log("....... pong 2")
  const goalMutable = getMutableComponent(goal,GoalComponent)
  if(!goalMutable) return
  goalMutable.damage.set( action.damage )
  console.log("....... pong 3")
  if(goalMutable.text.value) {
    console.log("....... pong 4",goalMutable.text.value)
    const textMutable = getMutableComponent(goalMutable.text.value,TextComponent)
    if(textMutable) {
      console.log("....... pong 5",action.damage)
      textMutable.text.set(`${action.damage}`)
    } else {
      console.log("....... pong text bad")
    }
  }
  //netlog("*** pong: set goal in game ="+action.damage+" goal="+entity2UUID(goal))
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
