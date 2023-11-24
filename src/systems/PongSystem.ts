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
import { PlateComponent } from '../components/PlateComponent'
import { PaddleComponent } from '../components/PaddleComponent'
import { on } from 'primus'

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

  static pongGoal = defineAction({
    type: 'pong.goal',
    entityUUID: matchesEntityUUID,
    health: matches.number,
    $topic: NetworkTopics.world
  })

  static pongMove = defineAction({
    type: 'pong.move',
    entityUUID: matchesEntityUUID,
    visibility: matches.number.optional(), // 123 = visible, 456 = not visible @todo improve
    position: matchesVector3.optional(),
    rotation: matchesQuaternion.optional(),
    impulse: matchesVector3.optional(),
    $topic: NetworkTopics.world,
  })

}

////////////////////////////////////////////////////////////////////////////////////////////
//
// action handling

const pongStart = (action: ReturnType<typeof PongAction.pongStart>) => {
  // mark the game as started; this doesn't mean a lot on the client side
  const pong = UUIDComponent.entitiesByUUID[action.uuid]
  if(!pong) return
  const pongMutable = getMutableComponent(pong,PongComponent)
  pongMutable.playing.set(true)
  console.log("*** pong: restarted game")
}

const pongStop = (action: ReturnType<typeof PongAction.pongStop>) => {
  // mark the game as stopped; this doesn't mean a lot on the client side
  const pong = UUIDComponent.entitiesByUUID[action.uuid]
  if(!pong) return
  const pongMutable = getMutableComponent(pong,PongComponent)
  pongMutable.playing.set(false)
  console.log("*** pong: stopped game")
}

const pongGoal = (action: ReturnType<typeof PongAction.pongGoal>) => {
  // update the goal health and also the text goal object(s) of a goal if any
  const goal = UUIDComponent.entitiesByUUID[action.entityUUID]
  if(!goal) return
  const goalComponent = getMutableComponent(goal,GoalComponent)
  if(!goalComponent) return
  // set health
  goalComponent.health.set( action.health )
  // find and update text score nodes @todo could memoize
  const goalNode = getComponent(goal,EntityTreeComponent)
  if(!goalNode.children || !goalNode.children.length) return
  goalNode.children.forEach( (child) => {
    const textComponent = getMutableComponent(child,TextComponent)
    if(textComponent) {
      textComponent.text.set(`${action.health}`)
    }
  })
  console.log("*** pong: set goal in game =",action.health,goal)
}

const pongMove = (action: ReturnType<typeof PongAction.pongMove>) => {

  const entity = UUIDComponent.entitiesByUUID[action.entityUUID]
  if(!entity) return
  const transform = getComponent(entity,TransformComponent)
  if(!transform) return
  const rigid = getComponent(entity,RigidBodyComponent)

  // make the item not visible - @improve this later
  if( action.visibility && action.visibility == 456) {
    transform.position.set(9999,9999,9999)
    if(rigid) rigid.position.set(9999,9999,9999)
    return
  }

  if(rigid) {
    rigid.body.resetForces(true)
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

///////////////////////////////////////////////////////////////////////////////////////////
//
// action receptor queues

function PongActionQueueReceptorContext() {
  const pongStartQueue = defineActionQueue(PongAction.pongStart.matches)
  const pongStopQueue = defineActionQueue(PongAction.pongStop.matches)
  const pongGoalQueue = defineActionQueue(PongAction.pongGoal.matches)
  const pongMoveQueue = defineActionQueue(PongAction.pongMove.matches)
  const exhaustActionQueues = () => {
    for (const action of pongStartQueue()) pongStart(action)
    for (const action of pongStopQueue()) pongStop(action)
    for (const action of pongGoalQueue()) pongGoal(action)
    for (const action of pongMoveQueue()) pongMove(action)
  }
  return exhaustActionQueues
}

const PongActionReceptor = PongActionQueueReceptorContext()

///////////////////////////////////////////////////////////////////////////////////////////
//
// helper functions

function helperBindParts(goal:Entity) {
  // bind goal paddle, collider and text widget
  const goalMutable = getMutableComponent(goal,GoalComponent)
  if(!goalMutable || goalMutable.paddle.value) return
  const goalNode = getComponent(goal,EntityTreeComponent)
  goalNode?.children.forEach((child)=> {
    if(getComponent(child,TextComponent)) {
      goalMutable.text.set(child)
    }
    else if(getComponent(child,PlateComponent)) {
      goalMutable.plate.set(child)
    }
    else if(getComponent(child,PaddleComponent)) {
      goalMutable.paddle.set(child)
    }
  })
}

function helperDispatchResetGoals(pong:Entity) {
  const pongNode = getComponent(pong,EntityTreeComponent)
  if(!pongNode || !pongNode.children || !pongNode.children.length) return
  pongNode.children.forEach( (child) => {
    const goalComponent = getComponent(child,GoalComponent)
    if(goalComponent) {
      const entityUUID = getComponent(child, UUIDComponent) as EntityUUID
      const health = goalComponent.startingHealth || 9
      dispatchAction(PongAction.pongGoal({ entityUUID, health }))
    }
  })
}

function helperDispatchResetBalls(pong:Entity) {
  const pongNode = getComponent(pong,EntityTreeComponent)
  if(!pongNode || !pongNode.children || !pongNode.children.length) return
  pongNode.children.forEach( (child) => {
    const ballComponent = getComponent(child,BallComponent)
    if(ballComponent) {
      const entityUUID = getComponent(child, UUIDComponent) as EntityUUID
      const visibility = 0
      dispatchAction(PongAction.pongMove({ entityUUID, visibility }))
    }
  })
}

function helperDispatchMovePaddle(avatar:Entity,paddle:Entity) {
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

  const position = new Vector3(
    transformAvatar.position.x,
    transformAvatar.position.y + 2.0,
    transformAvatar.position.z
  )
  const entityUUID = getComponent(paddle, UUIDComponent) as EntityUUID
  dispatchAction(PongAction.pongMove({entityUUID,position}))
}

function helperDispatchEvaluateGoals(pong:Entity, goal:Entity ) {

  const goalComponent = getComponent(goal,GoalComponent)
  if(!goalComponent || !goalComponent.plate || !goalComponent.paddle) return 0

  // look at all the things that are in collision with the plate right now
  // @todo use trigger callbacks of countingn collidants?

  const collidants = getComponent(goalComponent.plate, CollisionComponent)
  if (!collidants || !collidants.size) return 0
  const pongComponent = getComponent(pong, PongComponent)
  const pongUUID = getComponent(pong, UUIDComponent) as EntityUUID

  let numAvatars = 0

  for (let [child, collision] of collidants) {

    // is the plate incident with a ball? reset the ball and may end game
    if(getComponent(child,BallComponent)) {

      const entityUUID = getComponent(child, UUIDComponent) as EntityUUID
      const visibility = 456
      dispatchAction(PongAction.pongMove({entityUUID,visibility}))

      if(pongComponent.playing) {
        console.log("*** pong: playing, and a ball hit a goal ",child,goal)
        const health = goalComponent.health - 1
        if(health >= 0) {
          const entityUUID = getComponent(goal, UUIDComponent) as EntityUUID
          dispatchAction(PongAction.pongGoal({ entityUUID, health }))
        } else {
          dispatchAction(PongAction.pongStop({uuid:pongUUID}))
        }
      }
    }

    // is the plate incident with a paddle? do nothing
    else if(getComponent(child,PaddleComponent)) {
    }

    // is an avatar incident with the plate? @todo improve avatar detector
    else {
      numAvatars++
      helperDispatchMovePaddle(child,goal)
    }
  }

  return numAvatars
}

function helperDispatchVolleyBalls(pong:Entity) {

  const pongComponent = getComponent(pong, PongComponent)
  const pongMutable = getMutableComponent(pong, PongComponent)
  const pongNode = getComponent(pong,EntityTreeComponent)
  const pongTransform = getComponent(pong,TransformComponent)
  if(!pongComponent || !pongTransform || !pongNode || !pongNode.children || !pongNode.children.length) return

  // every few seconds consider volleying a ball -> @todo could a timer be used instead?

  const seconds = getState(EngineState).elapsedSeconds
  if(seconds < pongComponent.timer ) return

  pongMutable.timer.set( seconds + 5.0 )
  console.log("*** pong: may launch a ball",seconds,pongComponent.timer)

  // recycle the oldest ball
  let ball = 0 as Entity
  let ballComponent : any = null
  for(const candidate of pongNode.children) {
    const candidateComponent = getComponent(candidate,BallComponent)
    if(candidateComponent && (!ball || candidateComponent.elapsedSeconds > ballComponent.elapsedSeconds)) {
      ball = candidate
      ballComponent = candidateComponent
    }
  }

  // if a ball can be recycled then do so
  if(ball) {
    const ballMutable = getMutableComponent(ball,BallComponent)
    const entityUUID = getComponent(ball, UUIDComponent) as EntityUUID
    ballMutable.elapsedSeconds.set(seconds)

    const position = new Vector3(0,5,0)
    const impulse = new Vector3(0.5,0,0)

    // calculate impulse vector @todo what if the whole thing is rotated?
    // @todo i'd prefer to volley either randomly or to last party hit

    for(const child of pongNode.children) {
      if(!getComponent(child,GoalComponent)) continue
      const transform = getComponent(child,TransformComponent)
      if(!transform) continue
      impulse.x = (transform.position.x - pongTransform.position.x)/10.0
      impulse.y = 0
      impulse.z = (transform.position.z - pongTransform.position.z)/10.0
    }

    dispatchAction(PongAction.pongMove({ entityUUID, position, impulse }))
  }
}

const helperPong = (pong: Entity) => {

  const pongUUID = getComponent(pong, UUIDComponent) as EntityUUID
  const pongComponent = getComponent(pong, PongComponent)
  const pongMutable = getMutableComponent(pong, PongComponent)
  const pongNode = getComponent(pong,EntityTreeComponent)
  if(!pongComponent || !pongNode || !pongNode.children || !pongNode.children.length) return

  //
  // rebind each goal to its plate and a paddle - @todo don't call this over and over
  //

  pongNode.children.forEach( goal => {
    helperBindParts(goal)
  })

  //
  // visit each goal and evaluate that goal
  //

  let numAvatars = 0
  pongNode.children.forEach( goal => {
    helperBindParts(goal)
    numAvatars += helperDispatchEvaluateGoals(pong,goal)
  })

  //
  // modally stop or start game; this is arranged to leave the score up and balls active after game ends
  //

  if(!numAvatars) {
    if(pongComponent.playing == true) {
      pongMutable.playing.set(false) // @todo maybe remove this
      dispatchAction(PongAction.pongStop({ uuid: pongUUID }))
    }
    return
  } else {
    if(pongComponent.playing == false) {
      helperDispatchResetBalls(pong)
      dispatchAction(PongAction.pongStart({ uuid: pongUUID }))
      pongMutable.playing.set(true) // @todo maybe remove this
    }
  }

  //
  // volley balls periodically while playing; allows multiple balls at once
  //

  if(pongComponent.playing) {
    helperDispatchVolleyBalls(pong)
  }

}

const pongQuery = defineQuery([PongComponent])

function execute() {
  PongActionReceptor()
  const pongEntities = pongQuery()
  for (const pong of pongEntities) {
    helperPong(pong)
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

