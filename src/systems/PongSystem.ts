import { Quaternion, Vector3 } from 'three'

import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import {
  defineQuery,
  getComponent,
  getMutableComponent,
} from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { CollisionComponent } from '@etherealengine/engine/src/physics/components/CollisionComponent'
import { RigidBodyComponent } from '@etherealengine/engine/src/physics/components/RigidBodyComponent'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { PhysicsSystem } from '@etherealengine/engine/src/physics/systems/PhysicsSystem'

import { matches, matchesEntityUUID, matchesQuaternion, matchesVector3, matchesWithDefault } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { NetworkTopics } from '@etherealengine/engine/src/networking/classes/Network'
import { defineAction, defineActionQueue, dispatchAction, getState } from '@etherealengine/hyperflux'
import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { BallComponent } from '../components/BallComponent'
import { EntityTreeComponent } from '@etherealengine/engine/src/ecs/functions/EntityTree'

import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'

import { PongComponent, PongMode } from '../components/PongComponent'
import { GoalComponent } from '../components/GoalComponent'
import { TextComponent } from '../components/TextComponent'
import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'
import { PlateComponent } from '../components/PlateComponent'
import { PaddleComponent } from '../components/PaddleComponent'
import { AvatarRigComponent } from '@etherealengine/engine/src/avatar/components/AvatarAnimationComponent'
import { AvatarIKTargetComponent } from '@etherealengine/engine/src/avatar/components/AvatarIKComponents'

///////////////////////////////////////////////////////////////////////////////////////////
//
// action schemas

class PongAction {

  static pongPong = defineAction({
    type: 'pong.pong',
    uuid: matchesEntityUUID,
    mode: matches.string,
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
    kinematicPosition: matchesVector3.optional(),
    kinematicRotation: matchesQuaternion.optional(),
    position: matchesVector3.optional(),
    rotation: matchesQuaternion.optional(),
    impulse: matchesVector3.optional(),
    $topic: NetworkTopics.world,
  })

}

////////////////////////////////////////////////////////////////////////////////////////////
//
// action handling

const pongPong = (action: ReturnType<typeof PongAction.pongPong>) => {
  const pong = UUIDComponent.entitiesByUUID[action.uuid]
  if(!pong) return
  const pongMutable = getMutableComponent(pong,PongComponent)
  switch(action.mode) {
    default:
    case 'stopped': pongMutable.mode.set( PongMode.stopped ); break
    case 'playing': pongMutable.mode.set( PongMode.playing ); break
    case 'completed': pongMutable.mode.set( PongMode.completed ); break
  }
  console.log("*** pong: mode change =",action.mode)
}

const pongGoal = (action: ReturnType<typeof PongAction.pongGoal>) => {
  const goal = UUIDComponent.entitiesByUUID[action.entityUUID]
  if(!goal) return
  const goalComponent = getMutableComponent(goal,GoalComponent)
  if(!goalComponent) return
  goalComponent.health.set( action.health )
  if(goalComponent.text) {
    const textComponent = getMutableComponent(goalComponent.text.value,TextComponent)
    if(textComponent) {
      textComponent.text.set(`${action.health}`)
    }
  }
  console.log("*** pong: set goal in game =",action.health,goal)
}

const pongMove = (action: ReturnType<typeof PongAction.pongMove>) => {

  const entity = UUIDComponent.entitiesByUUID[action.entityUUID]
  if(!entity) return
  const transform = getComponent(entity,TransformComponent)
  if(!transform) return
  const rigid = getComponent(entity,RigidBodyComponent)

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

///////////////////////////////////////////////////////////////////////////////////////////
//
// action queues

function PongActionQueueReceptorContext() {
  const pongPongQueue = defineActionQueue(PongAction.pongPong.matches)
  const pongGoalQueue = defineActionQueue(PongAction.pongGoal.matches)
  const pongMoveQueue = defineActionQueue(PongAction.pongMove.matches)
  const exhaustActionQueues = () => {
    for (const action of pongPongQueue()) pongPong(action)
    for (const action of pongGoalQueue()) pongGoal(action)
    for (const action of pongMoveQueue()) pongMove(action)
  }
  return exhaustActionQueues
}

const PongActionReceptor = PongActionQueueReceptorContext()

///////////////////////////////////////////////////////////////////////////////////////////

///
/// helper function to find relationships between goals and goal text, plate, paddle
/// @todo ideally this would be called once only at startup
///

function helperBindPongParts(pong:Entity) {
  const pongMutable = getMutableComponent(pong,PongComponent)
  if(!pongMutable) return
  const pongNode = getComponent(pong,EntityTreeComponent)
  const goals : Array<Entity> = []
  const balls : Array<Entity> = []
  pongNode?.children?.forEach( child => {
    if(getComponent(child,BallComponent)) {
      balls.push(child)
      return
    }
    const goalMutable = getMutableComponent(child,GoalComponent)
    if(!goalMutable) return
    goals.push(child)
    if(goalMutable.text.value || goalMutable.plate.value || goalMutable.paddle.value) return
    const goalNode = getComponent(child,EntityTreeComponent)
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
  })
  pongMutable.balls.set(balls)
  pongMutable.goals.set(goals)
}

///
/// helper function to build relationship between goal and first avatar on goal
/// @todo it may make sense to allow players to step out of a goal briefly using a timeout
/// @todo it may make sense to watch collision transitions rather than busy poll this
/// @todo hack; use proximity for now because collision capsule on avatar is above ground
//

const avatars = defineQuery([AvatarRigComponent])

function helperBindPongGoalsAvatar(pong:Entity) {
  let numAvatars = 0
  const pongComponent = getComponent(pong,PongComponent)
  pongComponent.goals.forEach( goal => {
    const goalMutable = getMutableComponent(goal,GoalComponent)
    const transformPlate = getComponent(goalMutable.plate.value,TransformComponent)
    if(!transformPlate) return
    avatars().forEach(avatar=>{
      const dist = getComponent(avatar,TransformComponent).position.distanceToSquared(transformPlate.position)
      if(dist < transformPlate.scale.lengthSq()) {
        goalMutable.avatar.set(avatar)
        numAvatars++
      }
    })
  })
  return numAvatars
}

function orig_helperBindPongGoalsAvatar(pong:Entity) {
  let numAvatars = 0
  const pongComponent = getComponent(pong,PongComponent)
  pongComponent.goals.forEach( goal => {
    const goalMutable = getMutableComponent(goal,GoalComponent)
    const collidants = getComponent(goalMutable.plate?.value, CollisionComponent)
    if (!collidants || !collidants.size) return 0
    for (let [avatar, collision] of collidants) {
      if(getComponent(avatar,AvatarRigComponent)) {
        goalMutable.avatar.set(avatar)
        numAvatars++
      }
    }
  })
  return numAvatars
}

function helperDispatchUpdateGoalAvatar(goal:Entity) {
  const goalComponent = getComponent(goal,GoalComponent)
  if(!goalComponent || !goalComponent.avatar || !goalComponent.paddle) return
  const rig = getComponent(goalComponent.avatar, AvatarRigComponent)
  if (!rig) return
  
  // @todo could use local player for locally authoritative lower latency
  //const rig = getOptionalComponent(Engine.instance.localClientEntity, AvatarRigComponent)

  const handPose = rig?.rig?.rightHand?.node
  if(!handPose) return
  const kinematicPosition = new Vector3()
  const kinematicRotation = new Quaternion()
  handPose.getWorldPosition(kinematicPosition)
  handPose.getWorldQuaternion(kinematicRotation)

  const entityUUID = getComponent(goalComponent.paddle, UUIDComponent) as EntityUUID
  dispatchAction(PongAction.pongMove({entityUUID,kinematicPosition,kinematicRotation}))
}

function helperDispatchEvaluateGoals(goal:Entity ) {
  const goalComponent = getComponent(goal,GoalComponent)
  if(!goalComponent || !goalComponent.plate) return false
  const collidants = getComponent(goalComponent.plate, CollisionComponent)
  if (!collidants || !collidants.size) return false
  for (let [ball, collision] of collidants) {
    if(!getComponent(ball,BallComponent)) continue
    const health = goalComponent.health - 1
    const entityUUID = getComponent(goal, UUIDComponent) as EntityUUID
    dispatchAction(PongAction.pongGoal({ entityUUID, health }))
    console.log("*** pong: playing, and a ball hit a goal ",ball,goal,health)
    if(health <= 0) {
      return true // game over
    }
    // dispatch hide/reset ball by just moving far away for now
    const position = new Vector3(-1000,-1000,-1000)
    dispatchAction(PongAction.pongMove({entityUUID,position}))
    // also move it now asap to prevent collisions from racking up locally
    const ballTransform = getComponent(ball,TransformComponent)
    ballTransform.position.copy(position)
  }
  return false
}

function helperDispatchVolleyBalls(pong:Entity) {

  // every few seconds consider volleying a ball; this could be improved
  // @todo could a timer be used instead? also or could temporal events be reactive?

  const pongComponent = getComponent(pong, PongComponent)
  if(!pongComponent.balls.length || !pongComponent.goals.length) return

  const seconds = getState(EngineState).elapsedSeconds
  if(seconds < pongComponent.elapsedSeconds ) return

  const pongMutable = getMutableComponent(pong, PongComponent)
  pongMutable.elapsedSeconds.set( seconds + 5.0 )

  // recycle the ball with the smallest elapsedSeconds
  let ball = 0 as Entity
  let ballComponent : any = null
  for(const candidate of pongComponent.balls) {
    const candidateComponent = getComponent(candidate,BallComponent)
    if(!ball || candidateComponent.elapsedSeconds < ballComponent.elapsedSeconds) {
      ball = candidate
      ballComponent = candidateComponent
    }
  }

  // if a ball can be recycled then do so
  if(!ball) return

  // update ball time last spawned locally on server
  const ballMutable = getMutableComponent(ball,BallComponent)
  const entityUUID = getComponent(ball, UUIDComponent) as EntityUUID
  ballMutable.elapsedSeconds.set(seconds)

  // volley the ball via dispatch
  const goal = pongComponent.goals[Math.floor(pongComponent.goals.length * Math.random())]
  const goalTransform = getComponent(goal,TransformComponent)
  const pongTransform = getComponent(pong,TransformComponent)
  const impulse = goalTransform.position.clone()
  impulse.sub(pongTransform.position).normalize().multiplyScalar(Math.random() * 0.1 + 0.1)
  const position = new Vector3(0,5,0)
  dispatchAction(PongAction.pongMove({ entityUUID, position, impulse }))
}

const helperPong = (pong: Entity) => {

  // the following is server only
  // if(!isClient) return

  const pongComponent = getComponent(pong, PongComponent)
  const pongUUID = getComponent(pong, UUIDComponent) as EntityUUID

  helperBindPongParts(pong)
  const numAvatars = helperBindPongGoalsAvatar(pong)

  switch(pongComponent.mode) {

    default:
    case PongMode.completed:
      // stay in completed state till players all leave then go to stopped state
      if(!numAvatars) {
        console.log("*** pong: stopping")
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.stopped }))
      }
      break

    case PongMode.stopped:
      // stay in stopped state till players show up
      if(!numAvatars) {
        break
      }

      // reset goals for a new game
      pongComponent.goals.forEach(goal=>{
        const entityUUID = getComponent(goal, UUIDComponent) as EntityUUID
        const health = getComponent(goal,GoalComponent)?.startingHealth || 9
        dispatchAction(PongAction.pongGoal({ entityUUID, health }))
      })

      // reset balls for a new game
      pongComponent.balls.forEach(ball=>{
        const entityUUID = getComponent(ball, UUIDComponent) as EntityUUID
        const position = new Vector3(-1000,-1000,-1000)
        dispatchAction(PongAction.pongMove({ entityUUID, position }))
      })

      // start new game
      dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.playing }))
      console.log("*** pong: starting")

    case PongMode.playing:

      // stop playing if players leave
      if(!numAvatars) {
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode: PongMode.stopped }))
        break
      }

      // volley balls periodically
      helperDispatchVolleyBalls(pong)

      // update paddles
      pongComponent.goals.forEach( helperDispatchUpdateGoalAvatar )

      // update goal collisions
      pongComponent.goals.forEach(goal=>{
          if(helperDispatchEvaluateGoals(goal)) {
            dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode: PongMode.completed }))
          }
      })

      break

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

