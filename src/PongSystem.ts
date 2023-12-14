import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { PhysicsSystem } from '@etherealengine/engine/src/physics/systems/PhysicsSystem'
import { defineQuery } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

import { PongComponent } from './components/PongComponent'
import { updatePongNetworking } from './PongActions'
import { pongUpdateInstance } from './PongUpdateInstance'

import { netlog } from './PongLogging'

let counter = 0
function heartbeat() {
  counter++
  if(counter > 5*60) {
    netlog("5 seconds passed heartbeat")
    counter = 0
  }
}

const pongQuery = defineQuery([PongComponent])

export function execute() {
  heartbeat()
  updatePongNetworking()
  const pongEntities = pongQuery()
  for (const pong of pongEntities) {
    pongUpdateInstance(pong)
  }
}

export const PongSystem = defineSystem({
  uuid: 'pong.system',
  execute,
  insert: { after: PhysicsSystem }
})


