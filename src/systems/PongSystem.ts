import { Quaternion, Vector3 } from 'three'

import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import {
  defineQuery,
  getComponent,
  getMutableComponent,
  useQuery
} from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { CollisionComponent } from '@etherealengine/engine/src/physics/components/CollisionComponent'
import { RigidBodyComponent } from '@etherealengine/engine/src/physics/components/RigidBodyComponent'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { PhysicsSystem } from '@etherealengine/engine/src/physics/systems/PhysicsSystem'

import { matches, matchesEntityUUID, matchesNetworkId, matchesQuaternion, matchesVector3, matchesWithDefault } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { NetworkTopics } from '@etherealengine/engine/src/networking/classes/Network'
import { defineAction, defineActionQueue, dispatchAction, useHookstate } from '@etherealengine/hyperflux'
import { AvatarControllerComponent } from '@etherealengine/engine/src/avatar/components/AvatarControllerComponent'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { BallComponent } from '../components/BallComponent'
import { NetworkObjectComponent } from '@etherealengine/engine/src/networking/components/NetworkObjectComponent'


import { GoalComponent } from '../components/GoalComponent'
import { PongComponent } from '../components/PongComponent'
import { TextComponent } from '../components/TextComponent'


//////////////////////////////////////////////////////////////////////////////////////
//
// helper to move paddle
//

const move_paddle = (player: Entity, paddle: Entity) => {
  if (!player) {
    // move via a robot
    return
  }

  /*
  // search for the hand by brute force - not useful approach
  const hands :Array<TransformComponentType> = []
  for (const entity of handQuery()) {
    const name = getComponent(entity,NameComponent)
    if(!name) continue
    const transform = getComponent(entity,TransformComponent)
    if(!transform) continue
    hands.push(transform)
  }
  */

  /*
  // this is one way to get an input - maybe use later
  const preferredInputSource = XRState.getPreferredInputSource()
  if (preferredInputSource) {
    const xrFrame = getState(XRState).xrFrame
    const pose = xrFrame!.getPose(
      preferredInputSource.gripSpace ?? preferredInputSource.targetRaySpace,
      ReferenceSpace.origin!
    )
    if (pose) {
      // i could apply this
      //paddle1.targetKinematicPosition.copy(pose.transform.position as any as Vector3)
      //paddle1.targetKinematicRotation.copy(pose.transform.orientation as any as Quaternion)
    }
  }
  */

  // find avatar from engine - not useful
  //const rig = getOptionalComponent(Engine.instance.localClientEntity, AvatarRigComponent)
  //if (rig) {
  //const handPose = rig.rig.rightHand.node
  //handPose.getWorldPosition(body.targetKinematicPosition)
  //handPose.getWorldQuaternion(body.targetKinematicRotation)
  //return
  //}
  // paddle1.position.set(0, -1000, 0)
  // paddle1.targetKinematicPosition.copy(body.position)
  // paddle1.body.setTranslation(body.position, true)

  // use the whole player body for now
  const transformPlayer = getComponent(player, TransformComponent)
  const transformPaddle = getMutableComponent(paddle, TransformComponent)

  // @todo - we must compute frame of reference
  // - transform player into pong frame of reference @todo
  // - place paddle forward of player by some amount; facing the center

  const xyz = new Vector3(
    transformPlayer.position.x,
    transformPlayer.position.y + 1.0,
    transformPlayer.position.z > 0 ? transformPlayer.position.z - 4.0 : transformPlayer.position.z + 4.0
  )

  //transformPaddle.position.set(xyz)
  const rigid = getComponent(paddle, RigidBodyComponent)
  if (rigid) {
    rigid.targetKinematicPosition.copy(xyz)
    rigid.body.setTranslation(xyz, true)
  }
}

///////////////////////////////////////////////////////////////////////////////////////////
//
// action schemas

class PongAction {

  static gameStart = defineAction({
    type: 'pong.gameStart',
    uuid: matchesEntityUUID,
    $topic: NetworkTopics.world
  })

  static gameStop = defineAction({
    type: 'pong.gameStop',
    uuid: matchesEntityUUID,
    $topic: NetworkTopics.world
  })

  static goalScore = defineAction({
    type: 'pong.goalScore',
    uuid: matchesEntityUUID,
    damage: matches.number,
    $topic: NetworkTopics.world
  })

  static playerPaddle = defineAction({
    type: 'pong.playerPaddle',
    number: matches.number,
    $topic: NetworkTopics.world
  })

  static playerVolley = defineAction({
    type: 'pong.playerVolley',
    entityUUID: matchesEntityUUID,
    networkId: matchesWithDefault(matchesNetworkId, () => NetworkObjectComponent.createNetworkId()),
    position: matchesVector3.optional(),
    rotation: matchesQuaternion.optional(),
    $topic: NetworkTopics.world,
    $cache: {
      removePrevious: ['prefab']
    }
  })

}

////////////////////////////////////////////////////////////////////////////////////////////
//
// action handling

export const gameStart = (action: ReturnType<typeof PongAction.gameStart>) => {
  const pong = UUIDComponent.entitiesByUUID[action.uuid]
  if(!pong) return
  const pongMutable = getMutableComponent(pong,PongComponent)
  pongMutable.playing.set(true)
  // @todo find all children goals and reset them
}

export const gameStop = (action: ReturnType<typeof PongAction.gameStop>) => {
  const pong = UUIDComponent.entitiesByUUID[action.uuid]
  if(!pong) return
  const pongMutable = getMutableComponent(pong,PongComponent)
  pongMutable.playing.set(true)
  // @todo remove all balls from play
}

export const goalScore = (action: ReturnType<typeof PongAction.goalScore>) => {
  const goal = UUIDComponent.entitiesByUUID[action.uuid]
  if(!goal) return
  const goalComponent = getMutableComponent(goal,GoalComponent)
  if(!goalComponent) return
  goalComponent.damage.set( action.damage )
  const text = getMutableComponent(goal,TextComponent) // @todo look for children
  if(!text) return
  text.text.set(`${action.damage}`)
}

export const playerPaddle = (action: ReturnType<typeof PongAction.playerPaddle>) => {
  // @todo
}

export const playerVolley = (action: ReturnType<typeof PongAction.playerVolley>) => {
  // @todo
}

///////////////////////////////////////////////////////////////////////////////////////////
//
// action receptor queues

function PongActionQueueReceptorContext() {

  const gameStartQueue = defineActionQueue(PongAction.gameStart.matches)
  const gameStopQueue = defineActionQueue(PongAction.gameStop.matches)
  const playerPaddleQueue = defineActionQueue(PongAction.playerPaddle.matches)
  const playerVolleyQueue = defineActionQueue(PongAction.playerVolley.matches)
  const goalScoreQueue = defineActionQueue(PongAction.goalScore.matches)

  const exhaustActionQueues = () => {
    for (const action of gameStartQueue()) gameStart(action)
    for (const action of gameStopQueue()) gameStop(action)
    for (const action of playerPaddleQueue()) playerPaddle(action)
    for (const action of playerVolleyQueue()) playerVolley(action)
    for (const action of goalScoreQueue()) goalScore(action)
  }

  return exhaustActionQueues
}

///////////////////////////////////////////////////////////////////////////////////////////
//
// system execute

const PongActionReceptor = PongActionQueueReceptorContext()

const pongQuery = defineQuery([PongComponent])
const goalQuery = defineQuery([GoalComponent])

const playServer = (pong: Entity) => {

  const pongUUID = getComponent(pong, UUIDComponent) as EntityUUID
  const pongComponent = getComponent(pong, PongComponent)
  const pongMutable = getMutableComponent(pong, PongComponent)
  if(!pong) {
    console.error("pong: something is horribly wrong")
    return
  }

  const goals = goalQuery()

  //
  // check for minimum number of players
  //

  let numAvatars = 0
  const ballCollisions : any = []

  goals.forEach( (goal) => {
    const collidants = getComponent(goal, CollisionComponent)
    if (!collidants || !collidants.size) return
    for (let [entity, collision] of collidants) {
      const ballComponent = getComponent(entity,BallComponent)
      const isAvatar = ballComponent ? false : true
      if(isAvatar) {
        numAvatars++
      } else {
        const ball = entity
        const parts = [ goal, ball, collision]
        ballCollisions.push(parts)
      }
    }
  })

  //
  // modally stop the game if nobody is playing, and modally start the game if players enter goals
  //

  if(pongComponent.playing) {
    if(numAvatars == 0) {
      dispatchAction(PongAction.gameStop({ uuid: pongUUID }))
      pongMutable.playing.set(false)
      return
    }
  } else {
    if(numAvatars > 0){
      dispatchAction(PongAction.gameStart({ uuid: pongUUID }))
      pongMutable.playing.set(true)    
    }
  }

  //
  // Resolve goal collisions after game running check; may also end game
  //

  for(let [goal,ball,collision] of ballCollisions) {
    const goalComponent = getComponent(goal,GoalComponent)
    const uuid = getComponent(goal,UUIDComponent) as EntityUUID
    const damage = goalComponent.damage + 1 as number

    // dispatch a score increase
    dispatchAction(PongAction.goalScore({ uuid, damage }))

    // dispatch end of game
    if(goalComponent.damage > 9) {
      dispatchAction(PongAction.gameStop({ uuid: pongUUID }))
      pongMutable.playing.set(false)
      break
    }
  }


}

const playClient = (pongEntity: Entity) => {

  // @todo - move the paddles during game play
  // @todo - let players volley balls

}

function execute() {
  PongActionReceptor()
  for (const pongEntity of pongQuery()) {
    playServer(pongEntity)
    playClient(pongEntity)
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////
//
// system reactor
//
/*

import React, { useEffect } from 'react'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { NetworkObjectComponent } from '@etherealengine/engine/src/networking/components/NetworkObjectComponent'
import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'

function reactor() {
  if(!isClient) return null
  const entitiesByName = useHookstate(NameComponent.entitiesByNameState)
  const playerAvatar = useQuery([AvatarControllerComponent])
  useEffect( () => {
    //return <PongReactor />
  },[entitiesByName,playerAvatar])
  return null
}

*/
///////////////////////////////////////////////////////////////////////////////////////////////
///
/// system
///

export const PongSystem = defineSystem({
  uuid: 'pong.system',
  execute,
 // reactor,
  insert: { after: PhysicsSystem }
})

