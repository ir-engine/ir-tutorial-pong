
import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { getComponent, getMutableComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { dispatchAction } from '@etherealengine/hyperflux'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'

import { PongComponent, PongMode } from './components/PongComponent'
import { GoalComponent } from './components/GoalComponent'
import { hideBall, moveBall, pongBallCollisions, pongVolleyBalls } from './PongVolleyBalls'
import { pongBindParts } from './PongBindParts'
import { PongAction } from './PongActions'
import { netlog } from './PongLogging'
import { Vector3 } from 'three'


export function pongUpdateInstance(pong:Entity) {

  const pongComponent = getComponent(pong,PongComponent)
  const pongMutable = getMutableComponent(pong,PongComponent)
  const pongUUID = getComponent(pong,UUIDComponent)

  const numAvatars = pongBindParts(pong)

  // volley balls on the client due to networking issues
  if(isClient) {
    if(pongComponent.mode == PongMode.playing) {
      pongBallCollisions(pong)
      pongVolleyBalls(pong)
    }
    return
  }

  // advance game state on the server for simplicity
  switch(pongComponent.mode) {

    default:
    case PongMode.completed:
      // stay in completed state till players all leave then go to stopped state
      if(numAvatars) break
      dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.stopped }))
      break

    case PongMode.stopped:
      // stay in stopped state till players show up
      if(!numAvatars) break
      dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.starting }))
      break

    case PongMode.starting:
    case PongMode.playing:

      // stop playing if players leave
      if(!numAvatars) {
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode: PongMode.stopped }))
        break
      }

      // transitioning into play? reset the balls and scores

      if(pongComponent.mode == PongMode.starting) {

        // advise goals to reset
        pongComponent.goals.forEach(goal=>{
          const entityUUID = getComponent(goal, UUIDComponent) as EntityUUID
          const damage = 0
          dispatchAction(PongAction.pongGoal({ entityUUID, damage }))
        })

        // make balls not be around
        pongComponent.balls.forEach(ball=>{
          hideBall(ball)
        })

        // switch to playing
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.playing }))
      }

      // manually check to see if game has ended - a bit of a hack because clients can volley balls
    
      let gameover = false
      pongComponent.goals.forEach(goal=>{
        const goalComponent = getComponent(goal,GoalComponent)
        if(goalComponent.damage >=9) gameover = true
      })

      if(gameover) {
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode: PongMode.completed }))
      }

      break

  }

}

