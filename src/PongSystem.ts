

import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { defineQuery } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { PhysicsSystem } from '@etherealengine/engine/src/physics/systems/PhysicsSystem'
import { updateNetwork } from './PongActions'
import { PongComponent } from './components/PongComponent'
import { pongReason } from './PongUpdate'

const pongQuery = defineQuery([PongComponent])

function execute() {
  updateNetwork()
  const pongEntities = pongQuery()
  for (const pong of pongEntities) {
    pongReason(pong)
  }
}

export const PongSystem = defineSystem({
  uuid: 'pong.system',
  execute,
  insert: { after: PhysicsSystem }
})
