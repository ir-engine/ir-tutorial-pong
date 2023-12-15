

import { matches, matchesEntityUUID } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { NetworkTopics } from '@etherealengine/engine/src/networking/classes/Network'
import { defineAction, defineActionQueue, defineState, receiveActions } from '@etherealengine/hyperflux'
import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { defineQuery } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { UserID } from '@etherealengine/engine/src/schemas/user/user.schema'
import { PeerID } from '@etherealengine/common/src/interfaces/PeerID'
import { NetworkId } from '@etherealengine/common/src/interfaces/NetworkId'

import { getMutableComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { PhysicsSystem } from '@etherealengine/engine/src/physics/systems/PhysicsSystem'

import { TextComponent } from './components/TextComponent'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'

import { PongComponent } from './components/PongComponent'
import { GoalComponent } from './components/GoalComponent'

import { pongLocalLog } from './PongLogging'
import { pongLocalPong } from './components/PongComponent'
import { pongUpdateInstance } from './PongUpdateInstance'

import { netlog } from './PongLogging'

import { PongAction } from './PongActions'

//////////////////////////////////////////////////////////////////////////////////////////////////
///
/// a text helper function - @todo move - there's some kind of wierd quirk where TextComponent is not resolved if placed in another file
///
//////////////////////////////////////////////////////////////////////////////////////////////////

export const pongLocalGoal = (action: ReturnType<typeof PongAction.pongGoal>) => {
  const goal = UUIDComponent.entitiesByUUID[action.entityUUID]
  if(!goal) return
  const goalMutable = getMutableComponent(goal,GoalComponent)
  if(!goalMutable) return
  goalMutable.damage.set( action.damage )
  if(goalMutable.text.value) {
    const textMutable = getMutableComponent(goalMutable.text.value,TextComponent)
    if(textMutable) {
      textMutable.text.set(`${action.damage}`)
    } else {
      console.log("....... pong text bad")
    }
  }
  //netlog("*** pong: set goal in game ="+action.damage+" goal="+entity2UUID(goal))
}

//////////////////////////////////////////////////////////////////////////////////////////////////
///
/// networked state for the pong game
///
//////////////////////////////////////////////////////////////////////////////////////////////////

export enum PongMode {
  'stopped' = 'stopped',
  'starting' = 'starting',
  'playing' = 'playing',
  'completed' = 'completed'
}

export const PongNetworkState = defineState({
  name: 'pong.PongNetworkState',
  initial: {} as Record<
    EntityUUID,
    {
      ownerId: UserID
      networkId: NetworkId
      peerId: PeerID
      elapsedSeconds: number
      goals: []
      balls: []
      mode: PongMode
    }
  >,
  receptors: [
    [
      PongAction.pongGoal,
      (state, action: typeof PongAction.pongGoal.matches._TYPE) => {
        // @todo rather than just calling into the previous approach I could move more work to here
        pongLocalGoal(action)
      }
    ],
    [
      PongAction.pongPong,
      (state, action: typeof PongAction.pongPong.matches._TYPE) => {
        // @todo rather than just calling into the previous approach I could move more work to here
        pongLocalPong(action)
      }
    ]
  ]
})

//////////////////////////////////////////////////////////////////////////////////////////////////
///
/// system execution - update every instance of pong
///
//////////////////////////////////////////////////////////////////////////////////////////////////

const pongQuery = defineQuery([PongComponent])

const pongLogQueue = defineActionQueue(PongAction.pongLog.matches)

let debug = 0

function execute() {

  // debugging
  if(debug++ > 5*60) { netlog("5*60 hertz passed heartbeat"); debug = 0 }

  // a private network queue for debugging
  for (const action of pongLogQueue()) pongLocalLog(action)

  // shared events that are event sourced so that late joiners can get a copy of the current game state
  receiveActions(PongNetworkState)

  // visit each pong instance and do work on it
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


