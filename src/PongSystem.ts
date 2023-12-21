
import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import { defineState, receiveActions } from '@etherealengine/hyperflux'
import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { defineQuery } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { PhysicsSystem } from '@etherealengine/engine/src/physics/systems/PhysicsSystem'

import { PongAction } from './PongActions'
import { PongComponent } from './components/PongComponent'
import { pongGoal, pongPong, pongReason } from './PongUpdate'
import { platesBindAvatarPaddles, platesBindAvatars, pongBindBalls, pongBindGoalParts, pongBindGoals } from './PongBindParts'

export const PongNetworkState = defineState({
  name: 'pong.PongNetworkStateReceptors',
  initial: {
    // @todo state could/should be kept here for clarity; although functionally it is the same either way
  },
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
    ]
  ]
})

const pongQuery = defineQuery([PongComponent])

function execute() {
  receiveActions(PongNetworkState)
  const pongEntities = pongQuery()
  for (const pong of pongEntities) {

    // @todo these could occur once only at startup by watching for scene load completion
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
