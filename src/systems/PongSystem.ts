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
import { defineAction, defineActionQueue, dispatchAction, getState, useHookstate } from '@etherealengine/hyperflux'
import { AvatarControllerComponent } from '@etherealengine/engine/src/avatar/components/AvatarControllerComponent'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { BallComponent } from '../components/BallComponent'
import { NetworkObjectComponent } from '@etherealengine/engine/src/networking/components/NetworkObjectComponent'
import { EntityTreeComponent } from '@etherealengine/engine/src/ecs/functions/EntityTree'
import { ColliderComponent } from '@etherealengine/engine/src/scene/components/ColliderComponent'

import { PongComponent } from '../components/PongComponent'
import { GoalComponent } from '../components/GoalComponent'
import { TextComponent } from '../components/TextComponent'
import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'

///////////////////////////////////////////////////////////////////////////////////////////
//
// action schemas

class PongAction {

  static pongStart = defineAction({
    type: 'pong.start',
    uuid: matchesEntityUUID,
    $topic: NetworkTopics.world
  })

  static pongStop = defineAction({
    type: 'pong.stop',
    uuid: matchesEntityUUID,
    $topic: NetworkTopics.world
  })

  static pongWin = defineAction({
    type: 'pong.stop',
    uuid: matchesEntityUUID,
    $topic: NetworkTopics.world
  })

  static pongGoal = defineAction({
    type: 'pong.goal',
    goalUUID: matchesEntityUUID,
    damage: matches.number,
    $topic: NetworkTopics.world
  })

  static pongVolley = defineAction({
    type: 'pong.volley',
    ballUUID: matchesEntityUUID,
    position: matchesVector3,
    velocity: matchesVector3,
    $topic: NetworkTopics.world,
  })

  static pongPaddle = defineAction({
    type: 'pong.paddle',
    avatarUUID: matchesEntityUUID,
    goalUUID: matchesEntityUUID,
    position: matchesVector3.optional(),
    rotation: matchesQuaternion.optional(),
    $topic: NetworkTopics.world
  })

}

////////////////////////////////////////////////////////////////////////////////////////////
//
// action handling

export const pongStart = (action: ReturnType<typeof PongAction.pongStart>) => {
  console.log("*** pong: starting game")
  const pong = UUIDComponent.entitiesByUUID[action.uuid]
  if(!pong) return
  const pongMutable = getMutableComponent(pong,PongComponent)
  pongMutable.playing.set(true)
  // reset all goals
  const pongNode = getComponent(pong,EntityTreeComponent)
  if(!pongNode.children || !pongNode.children.length) return
  pongNode.children.forEach( (child) => {
    const goalComponent = getComponent(child,GoalComponent)
    if(!goalComponent) return
    const goalUUID = getComponent(child, UUIDComponent) as EntityUUID
    const damage = 9
    dispatchAction(PongAction.pongGoal({ goalUUID, damage }))
  })
  // @todo remove all balls from play
}

export const pongStop = (action: ReturnType<typeof PongAction.pongStop>) => {
  console.log("*** pong: stopping game")
  const pong = UUIDComponent.entitiesByUUID[action.uuid]
  if(!pong) return
  const pongMutable = getMutableComponent(pong,PongComponent)
  pongMutable.playing.set(false)
}

export const pongWin = (action: ReturnType<typeof PongAction.pongWin>) => {
  const pong = UUIDComponent.entitiesByUUID[action.uuid]
  if(!pong) return
  const pongMutable = getMutableComponent(pong,PongComponent)
  pongMutable.playing.set(false)
}

export const pongGoal = (action: ReturnType<typeof PongAction.pongGoal>) => {
  console.log("*** pong: goal in game")
  const goal = UUIDComponent.entitiesByUUID[action.goalUUID]
  if(!goal) return
  const goalComponent = getMutableComponent(goal,GoalComponent)
  if(!goalComponent) return
  // set damage
  goalComponent.damage.set( action.damage )
  // find and update text score nodes @todo could memoize
  const goalNode = getComponent(goal,EntityTreeComponent)
  if(!goalNode.children || !goalNode.children.length) return
  goalNode.children.forEach( (child) => {
    const textComponent = getMutableComponent(child,TextComponent)
    if(!textComponent) return
    textComponent.text.set(`${action.damage}`)
  })
}

export const pongVolley = (action: ReturnType<typeof PongAction.pongVolley>) => {
  console.log("*** pong: volley in game")
  // @todo
  const ball = UUIDComponent.entitiesByUUID[action.ballUUID]
  if(!ball) return
  const ballComponent = getComponent(ball,BallComponent)
  if(!ballComponent) return
  const rigid = getComponent(ball,RigidBodyComponent)
  if(!rigid) return
  const transform = getComponent(ball,TransformComponent)
  if(!transform) return

  const xyz = new Vector3(0,5,0)
  const zero = new Vector3(0,0,0)
  const vel = new Vector3(0.1,0.1,0)

  rigid.body.resetForces(true)
  rigid.body.wakeUp()
  rigid.body.setLinvel(zero, false)
  rigid.body.setAngvel(zero, false)
  transform.position.set(0,5,0)
  rigid.position.copy(xyz)
  rigid.targetKinematicPosition.copy(xyz)

  rigid.body.setLinvel(vel,true)
  rigid.body.applyImpulse(vel,true)

}

export const pongPaddle = (action: ReturnType<typeof PongAction.pongPaddle>) => {

  const avatar = UUIDComponent.entitiesByUUID[action.avatarUUID]
  const goal = UUIDComponent.entitiesByUUID[action.goalUUID]

  // find a paddle - @todo could memoize
  let paddle = 0 as Entity
  const goalNode = getComponent(goal,EntityTreeComponent)
  if(!goalNode.children || !goalNode.children.length) return
  goalNode.children.forEach( (child) => {
    const colliderComponent = getMutableComponent(child,ColliderComponent)
    if(!colliderComponent || colliderComponent.isTrigger) return
    paddle = child
  })
  if(!paddle) return

  const transformPaddle = getMutableComponent(paddle, TransformComponent)
  if(!transformPaddle) return

  const rigidPaddle = getComponent(paddle, RigidBodyComponent)
  if(!rigidPaddle) return
  
  const transformAvatar = getComponent(avatar, TransformComponent)
  if(!transformAvatar) return

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
      //paddle1.targetKinematicPosition.copy(pose.transform.position as any as Vector3)
      //paddle1.targetKinematicRotation.copy(pose.transform.orientation as any as Quaternion)
    }
  }
  */

  // find local avatar from engine
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

  const xyz = new Vector3(
    transformAvatar.position.x,
    transformAvatar.position.y + 2.0,
    transformAvatar.position.z
  )
  rigidPaddle.targetKinematicPosition.copy(xyz)
  rigidPaddle.body.setTranslation(xyz, true) // @todo this may not be needed
}

///////////////////////////////////////////////////////////////////////////////////////////
//
// action receptor queues

function PongActionQueueReceptorContext() {

  const gameStartQueue = defineActionQueue(PongAction.pongStart.matches)
  const gameStopQueue = defineActionQueue(PongAction.pongStop.matches)
  const gameWinQueue = defineActionQueue(PongAction.pongWin.matches)
  const gameGoalQueue = defineActionQueue(PongAction.pongGoal.matches)
  const gameVolleyQueue = defineActionQueue(PongAction.pongVolley.matches)
  const gamePaddleQueue = defineActionQueue(PongAction.pongPaddle.matches)

  const exhaustActionQueues = () => {
    for (const action of gameStartQueue()) pongStart(action)
    for (const action of gameStopQueue()) pongStop(action)
    for (const action of gameWinQueue()) pongWin(action)
    for (const action of gameGoalQueue()) pongGoal(action)
    for (const action of gameVolleyQueue()) pongVolley(action)
    for (const action of gamePaddleQueue()) pongPaddle(action)
  }

  return exhaustActionQueues
}

const PongActionReceptor = PongActionQueueReceptorContext()

///////////////////////////////////////////////////////////////////////////////////////////
//
// system execute

const balls = defineQuery([BallComponent])

const pongServer = (pong: Entity) => {

  const pongUUID = getComponent(pong, UUIDComponent) as EntityUUID
  const pongComponent = getComponent(pong, PongComponent)
  const pongMutable = getMutableComponent(pong, PongComponent)

  if(pongComponent == null) return

  //
  // A pong game consists of two or more goals; find those goals and evaluate them
  //

  let numAvatars = 0

  const pongNode = getComponent(pong,EntityTreeComponent)

  if(pongNode == null || !pongNode.children || !pongNode.children.length) return

  const resolve_goal = (goal) => {

    // consider goals only
    const goalComponent = getComponent(goal,GoalComponent)
    const goalUUID = getComponent(goal, UUIDComponent) as EntityUUID
    if(!goalComponent) return

    const goalMutable = getMutableComponent(goal,GoalComponent)

    // for now discover goal paddle, collider and text widget here; @todo this could be memoized elsewhere
    if(!goalComponent.collider) {
      const goalNode = getComponent(goal,EntityTreeComponent)
      goalNode.children.forEach((child)=> {
        const textComponent = getComponent(child,TextComponent)
        if(textComponent) {
          goalMutable.text.set(child)
        }
        const colliderComponent = getComponent(child,ColliderComponent)
        if(colliderComponent) {
          if(colliderComponent.isTrigger) {
            goalMutable.collider.set(child)
            const collidants = getComponent(goalComponent.collider, CollisionComponent)
          } else {
            goalMutable.paddle.set(child)
          }
        }
      })
    }

   // don't do the rest on client
   // if(isClient) return

    // consider current collisions; the array has a non zero length if there are co-incident elements @todo use trigger callbacks instead
    const collidants = getComponent(goalComponent.collider, CollisionComponent)
    if (!collidants || !collidants.size) return
    for (let [child, collision] of collidants) {
      const ballComponent = getComponent(child,BallComponent)

      // if hit by one of our balls then cause damage and may end game
      if(ballComponent) {
        if(pongComponent.playing) {
          console.log("*** pong: playing, and a ball hit a goal ",child,goal)
          const damage = goalComponent.damage > 0 ? goalComponent.damage - 1 : 0
          dispatchAction(PongAction.pongGoal({ goalUUID, damage }))
          if(goalComponent.damage) continue
          dispatchAction(PongAction.pongWin({ uuid: pongUUID }))
          return
        }
        // @todo withdraw ball
      }

      // else assume it is an avatar, move paddle @todo may wish to improve avatar detection
      else {
        numAvatars++
        goalMutable.avatar.set(child)
        const avatarUUID = getComponent(child, UUIDComponent) as EntityUUID
        //dispatchAction(PongAction.pongPaddle({ avatarUUID, goalUUID }))
      }
    }
  }

  // resolve each goal
  pongNode.children.forEach( resolve_goal )

  //
  // if no players then stop game, otherwise may start game
  //

  if(!numAvatars) {
    if(pongComponent.playing == true) {
      pongMutable.playing.set(false)
      dispatchAction(PongAction.pongStop({ uuid: pongUUID }))
    }
    return
  } else {
    if(pongComponent.playing == false) {
      pongMutable.playing.set(true) 
      dispatchAction(PongAction.pongStart({ uuid: pongUUID }))
    }
  }

  //
  // wait a few seconds and then re-fire any old ball @todo this could be a separate component
  //

  if(pongComponent.playing) {
    const seconds = getState(EngineState).elapsedSeconds
    if(seconds > pongComponent.timer ) {
      pongMutable.timer.set( seconds + 5.0 )
      console.log("*** pong: may launch a ball",seconds,pongComponent.timer)

      let ball = 0 as Entity
      let ballComponent : any = null
      for(const candidate of balls() ) { // pongNode.children) {
        const candidateComponent = getComponent(candidate,BallComponent)
        if(!candidateComponent) continue
        if(!ballComponent || candidateComponent.elapsedSeconds < ballComponent.elapsedSeconds) {
          ball = candidate
          ballComponent = candidateComponent
        }
      }

      if(ball) {
        const ballMutable = getMutableComponent(ball,BallComponent)
        const ballUUID = getComponent(ball, UUIDComponent) as EntityUUID
        ballMutable.elapsedSeconds.set(seconds)

        const position = new Vector3(0,5,0)
        const velocity = new Vector3(200,0,0)

        dispatchAction(PongAction.pongVolley({
          ballUUID: ballUUID,
          position,
          velocity,
        }))  
      }
    }
  }


}

const pongQuery = defineQuery([PongComponent])

function execute() {
  PongActionReceptor()
  const entities = pongQuery()
  for (const pongEntity of entities) {
    pongServer(pongEntity)
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


/*

 - when i walk into play do balls start

 - can i shoot them at me

 - can i hit them somehow

 */