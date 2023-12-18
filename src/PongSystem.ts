

import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { defineQuery } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { PhysicsSystem } from '@etherealengine/engine/src/physics/systems/PhysicsSystem'
import { updateNetwork } from './PongActions'
import { PongComponent } from './components/PongComponent'
import { pongReason } from './PongUpdate'
import { platesBindAvatarPaddles, platesBindAvatars, pongBindBalls, pongBindGoalParts, pongBindGoals } from './PongBindParts'
import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'

const pongQuery = defineQuery([PongComponent])

function execute() {
  updateNetwork()
  const pongEntities = pongQuery()
  for (const pong of pongEntities) {

    // @todo these could occur once only at startup
    pongBindGoals(pong)
    pongBindBalls(pong)
    pongBindGoalParts(pong)

    // associate avatars with plates; and also update paddles if avatar is on plate
    platesBindAvatars(pong)
    platesBindAvatarPaddles(pong)

    // do this reasoning on the server only for now
    if(!isClient) {
      pongReason(pong)
    }
  }
}

export const PongSystem = defineSystem({
  uuid: 'pong.system',
  execute,
  insert: { after: PhysicsSystem }
})
