
import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { getComponent, getMutableComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { PongAction } from './PongActions'
import { netlog } from './PongLogging'
import { pongWireParts } from './PongWireParts'
import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import { PongComponent, PongMode } from './components/PongComponent'
import { dispatchAction } from '@etherealengine/hyperflux'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { pongBallCollisions, pongVolleyBalls } from './PongVolleyBalls'
import { GoalComponent } from './components/GoalComponent'


export function pongUpdateInstance(pong:Entity) {

  const pongComponent = getComponent(pong,PongComponent)
  const pongMutable = getMutableComponent(pong,PongComponent)
  const pongUUID = getComponent(pong,UUIDComponent)

  const numAvatars = pongWireParts(pong)

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
      if(!numAvatars) {
        console.log("*** pong: completed -> stopping")
        pongMutable.mode.set(PongMode.stopped) // ?? @todo improve
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.stopped }))
        netlog("Pong stopping game transition")
      }
      break

    case PongMode.stopped:
      // stay in stopped state till players show up - right now i let any instance start the game
      if(!numAvatars) {
        //netlog("*** pong is stopped")
        break
      }

      // start new game
      dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.starting }))
      netlog("Pong starting game transition")
      pongMutable.mode.set(PongMode.starting) // ?? @todo improve
      break

    case PongMode.starting:
    case PongMode.playing:

      // stop playing if players leave - right now i let any instance stop the game
      if(!numAvatars) {
        netlog("ending a game")
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode: PongMode.stopped }))
        pongMutable.mode.set(PongMode.stopped) // ?? @todo improve
        break
      }

      // transitioning into play- reset the balls and scores

      if(pongComponent.mode == PongMode.starting) {
        netlog("starting a game")

        // reset goals for a new game
        pongComponent.goals.forEach(goal=>{
          const entityUUID = getComponent(goal, UUIDComponent) as EntityUUID
          const damage = 0
          dispatchAction(PongAction.pongGoal({ entityUUID, damage }))
        })

        // reset balls for a new game
        pongComponent.balls.forEach(ball=>{
          getComponent(ball,TransformComponent).position.setY(5000)
        })

        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.playing }))
        pongMutable.mode.set(PongMode.playing) // ?? @todo improve
      }

      // physically look and see if the game has ended
      // this is a bit of a hack because i am now volleying balls on the client side
      // note that I don't reset the counters when a game ends - i want to leave the score up
    
      let gameover = false
      pongComponent.goals.forEach(goal=>{
        const goalComponent = getComponent(goal,GoalComponent)
        if(goalComponent.damage >=9) gameover = true
      })
      if(gameover) {
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode: PongMode.completed }))
        netlog("Pong ended a game")
        pongMutable.mode.set(PongMode.completed)
      }

      break

  }

}

