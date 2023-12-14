
import { Quaternion, Vector3 } from 'three'

import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'

import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { RigidBodyComponent } from '@etherealengine/engine/src/physics/components/RigidBodyComponent'
import { defineQuery, getComponent, getMutableComponent, setComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

import { NetworkObjectAuthorityTag, NetworkObjectComponent, NetworkObjectOwnedTag, NetworkObjectSendPeriodicUpdatesTag } from '@etherealengine/engine/src/networking/components/NetworkObjectComponent'

import { matches, matchesEntityUUID, matchesQuaternion, matchesVector3, matchesWithDefault } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { NetworkTopics } from '@etherealengine/engine/src/networking/classes/Network'
import { defineAction, defineActionQueue, dispatchAction, getState } from '@etherealengine/hyperflux'

import { GoalComponent } from './components/GoalComponent'
import { TextComponent } from './components/TextComponent'
import { netlog, pongLocalLog } from './PongLogging'

import { pongPong } from './components/PongComponent'

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

  /*
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
  */

}

///////////////////////////////////////////////////////////////////////////////////////////
///
/// network functions (move these @todo)
///
///////////////////////////////////////////////////////////////////////////////////////////

const pongGoal = (action: ReturnType<typeof PongAction.pongGoal>) => {
  const goal = UUIDComponent.entitiesByUUID[action.entityUUID]
  if(!goal) return
  const goalMutable = getMutableComponent(goal,GoalComponent)
  if(!goalMutable) return
  goalMutable.damage.set( action.damage )
  if(goalMutable.text.value) {
    const textMutable = getMutableComponent(goalMutable.text.value,TextComponent)
    if(textMutable) {
      textMutable.text.set(`${action.damage}`)
    }
  }
  //netlog("*** pong: set goal in game ="+action.damage+" goal="+entity2UUID(goal))
}

/*

const pongMove = (action: ReturnType<typeof PongAction.pongMove>) => {


  const entity = UUIDComponent.entitiesByUUID[action.entityUUID]
  if(!entity) return
  const transform = getComponent(entity,TransformComponent)
  if(!transform) return
  const rigid = getComponent(entity,RigidBodyComponent)

  //  if(isClient) return
  const name = getComponent(entity,NameComponent)
  const net = getComponent(entity,NetworkObjectComponent)
  console.log("**** pong moving ",name,net.authorityPeerID,Engine.instance.store.peerID)

  if(rigid) {
    rigid.body.resetForces(true)
  }

  if(rigid && action.kinematicPosition) {
    rigid.targetKinematicPosition.copy(action.kinematicPosition)
    transform.position.copy(action.kinematicPosition)
  }

  if(rigid && action.kinematicRotation) {
    rigid.targetKinematicRotation.copy(action.kinematicRotation)
    transform.rotation.copy(action.kinematicRotation)
  }

  if( action.position ) {
    transform.position.copy(action.position)
    if(rigid) rigid.position.copy(action.position)
  }

  if( action.rotation ) {
    transform.rotation.copy(action.rotation)
    if(rigid) rigid.rotation.copy(action.rotation)
  }

  if( action.impulse ) {
    setTimeout(()=>{
      //rigid.body.wakeUp()
      //rigid.body.setLinvel(zero, true)
      //rigid.body.setAngvel(zero, true)
      //rigid.targetKinematicPosition.copy(xyz)
      //rigid.body.setLinvel(vel,true)
      rigid.body.applyImpulse(action.impulse as Vector3,true)
    },10);
  }
}

*/

///////////////////////////////////////////////////////////////////////////////////////////
///
/// action queues
///
///////////////////////////////////////////////////////////////////////////////////////////

export function PongActionQueueReceptorContext() {
  const pongLogQueue = defineActionQueue(PongAction.pongLog.matches)
  const pongPongQueue = defineActionQueue(PongAction.pongPong.matches)
  const pongGoalQueue = defineActionQueue(PongAction.pongGoal.matches)
  //const pongMoveQueue = defineActionQueue(PongAction.pongMove.matches)
  const exhaustActionQueues = () => {
    for (const action of pongLogQueue()) pongLocalLog(action)
    for (const action of pongPongQueue()) pongPong(action)
    for (const action of pongGoalQueue()) pongGoal(action)
    //for (const action of pongMoveQueue()) pongMove(action)
  }
  return exhaustActionQueues
}

export const updatePongNetworking = PongActionQueueReceptorContext()
