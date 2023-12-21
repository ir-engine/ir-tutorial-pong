
import { Vector3 } from 'three'

import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'

import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'

import { dispatchAction, getState } from '@etherealengine/hyperflux'
import { getComponent, getMutableComponent, removeComponent, setComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { RigidBodyComponent } from '@etherealengine/engine/src/physics/components/RigidBodyComponent'
import { CollisionComponent } from '@etherealengine/engine/src/physics/components/CollisionComponent'

import { PongComponent, PongMode } from './components/PongComponent'
import { ScoreComponent } from './components/ScoreComponent'
import { BallComponent } from './components/BallComponent'
import { PlateComponent } from './components/PlateComponent'
import { GoalComponent } from './components/GoalComponent'

import { PongAction } from './PongActions'
import { GroundPlaneComponent } from '@etherealengine/engine/src/scene/components/GroundPlaneComponent'
import { AvatarComponent } from '@etherealengine/engine/src/avatar/components/AvatarComponent'
import { PaddleComponent } from './components/PaddleComponent'
import { VisibleComponent } from '@etherealengine/engine/src/scene/components/VisibleComponent'
import { PrimitiveGeometryComponent } from '@etherealengine/engine/src/scene/components/PrimitiveGeometryComponent'
import { GeometryTypeEnum } from '@etherealengine/engine/src/scene/constants/GeometryTypeEnum'


const BALL_VOLLEY_CHECK_PERIOD = 5.0
const BALL_AGE_BEFORE_EXPIRED = 5.0
const BALL_START_HEIGHT = 3.0
const ZERO = new Vector3(0,0,0)
const BALL_POSITION_OFF_SCREEN = new Vector3(100,-10,100)

///
/// Update the local goal / score
///

export const pongGoal = (action: ReturnType<typeof PongAction.pongGoal>) => {
  const goal = UUIDComponent.getEntityByUUID(action.entityUUID)
  if(!goal) return
  const goalMutable = getMutableComponent(goal,GoalComponent)
  if(!goalMutable) return
  const val = parseInt(action.damage)
  if(!isNaN(val)) goalMutable.damage.set( val )
  if(!goalMutable.score.value) return
  const textMutable = getMutableComponent(goalMutable.score.value,ScoreComponent)
  if(!textMutable) return
  if(val && !isNaN(val)) {
    const x = (goalMutable.maxDamage.value-val) / goalMutable.maxDamage.value
    const transform = getMutableComponent(goalMutable.score.value,TransformComponent)
    transform.scale.set( new Vector3(x,0.1,0.1) )
    // hack force update
    const geometryComponent = getMutableComponent(goalMutable.score.value, PrimitiveGeometryComponent)
    if(geometryComponent) {
        geometryComponent.geometryType.set( GeometryTypeEnum.CapsuleGeometry )
        geometryComponent.geometryType.set( GeometryTypeEnum.BoxGeometry )
    }
  }
}

///
/// Update local state of play overall
///

export const pongPong = (action: ReturnType<typeof PongAction.pongPong>) => {
  const pong = UUIDComponent.getEntityByUUID(action.uuid)
  if(!pong) return
  const pongMutable = getMutableComponent(pong,PongComponent)
  if(!pongMutable) return
  switch(action.mode) {
    default:
    case 'stopped': pongMutable.mode.set( PongMode.stopped ); break
    case 'starting': pongMutable.mode.set( PongMode.starting ); break
    case 'playing': pongMutable.mode.set( PongMode.playing ); break
    case 'completed': pongMutable.mode.set( PongMode.completed ); break
  }
}

function move(entity:Entity,position:Vector3,impulse:Vector3) {
  const rigid = getComponent(entity,RigidBodyComponent)
  if(rigid) {
    rigid.body.wakeUp()
    rigid.body.resetForces(true)
    rigid.body.setLinvel(ZERO, true)
    rigid.body.setAngvel(ZERO, true)
  }
  rigid.body.setTranslation(position, true)
  rigid.body.setLinvel(impulse as Vector3,true)
}

function hide(entity:Entity) {
  move(entity,BALL_POSITION_OFF_SCREEN,ZERO)
}

///
/// volley control
///

export function ballVolley(pong:Entity) {

  const pongComponent = getComponent(pong, PongComponent)
  if(!pongComponent || !pongComponent.balls.length || !pongComponent.goals.length) return

  // volley balls periodically for now @todo improve
  const seconds = getState(EngineState).elapsedSeconds
  if(seconds < pongComponent.elapsedSeconds ) return
  const pongMutable = getMutableComponent(pong, PongComponent)
  if(!pongMutable) return
  pongMutable.elapsedSeconds.set( seconds + BALL_VOLLEY_CHECK_PERIOD )

  // recycle oldest acceptable ball if it has not been touched by a player recently
  let ball = 0 as Entity
  let ballComponent : any = null
  for(const candidate of pongComponent.balls) {
    const candidateComponent = getComponent(candidate,BallComponent)
    if(candidateComponent.elapsedSeconds + BALL_AGE_BEFORE_EXPIRED > seconds) continue
    if(!ball || candidateComponent.elapsedSeconds < ballComponent.elapsedSeconds) {
      ball = candidate
      ballComponent = candidateComponent
    }
  }

  // if no candidate then return
  if(!ball) return

  // update ball time last spawned
  const ballMutable = getMutableComponent(ball,BallComponent)
  ballMutable.elapsedSeconds.set(seconds)

  // force ball to be visible
  setComponent(ball, VisibleComponent, true)

  // iterate through to the next occupied goal
  let goal = 0 as Entity
  for(let i = 0; i < pongComponent.goals.length;i++) {
    // advance pointer
    pongMutable.direction.set( pongMutable.direction.value + 1)
    // peek at this goal and see if there is an avatar there
    const temp = pongComponent.goals[(pongMutable.direction.value)%pongComponent.goals.length]
    const goalComponent = getComponent(temp,GoalComponent)
    if(goalComponent.avatar) {
      goal = temp
      break
    }
  }

  // hopefully a goal was found, volley towards it
  if(goal) {
    const goalComponent = getComponent(goal,GoalComponent)
    if(!goalComponent.avatar) return
    const goalTransform = getComponent(goalComponent.avatar,TransformComponent)
    const pongTransform = getComponent(pong,TransformComponent)
    const impulse = goalTransform.position.clone()
    //const mass = 4/3*3.14*(ballTransform.scale.x + 1.0)
    impulse.sub(pongTransform.position).normalize().multiplyScalar(Math.random() + 3)
    const position = new Vector3(pongTransform.position.x,BALL_START_HEIGHT,pongTransform.position.z)
    move(ball,position,impulse)
  }
}

///
/// reset ball if it hits a plate or the ground; also may cause damage to goal
/// @todo this could be done using triggers instead to reduce busy polling
///

export function ballCollisions(pong:Entity) {
  const seconds = getState(EngineState).elapsedSeconds
  const pongComponent = getComponent(pong,PongComponent)
  pongComponent.balls.forEach(ball=>{
    const collidants = getComponent(ball, CollisionComponent)
    if (!collidants || !collidants.size) return false
    for (let pair of collidants) {
      const entity : Entity = pair[0]
      // const collision = pair[1]
      // if(collision.type != CollisionEvents.COLLISION_START) continue // these simply don't occur on triggers - bug
      // did ball hit a plate?
      const plateComponent = getComponent(entity,PlateComponent)
      if(plateComponent) {
        // plates goal should be valid, let's use it to increase damage - only if there is a player there
        const goalComponent = getComponent(plateComponent.goal,GoalComponent)
        if(!goalComponent || !goalComponent.avatar) {
          break
        }
        // set not visible flag as a hack to detect if ball is out of play - there is network latency on the below
        if(!getComponent(ball,VisibleComponent)) {
          return
        }
        removeComponent(ball,VisibleComponent)
        // hide ball; there is some latency on this event - hence the hack above
        hide(ball)
        // increase damage and publish (server will resolve end game conditions by watching changes)
        const damage = `${goalComponent.damage + 1}`
        const entityUUID = getComponent(plateComponent.goal, UUIDComponent) as EntityUUID
        dispatchAction(PongAction.pongGoal({ entityUUID, damage }))   
        break
      }
      if(getComponent(entity,AvatarComponent)) {
        // reset ball recentness
        getMutableComponent(ball,BallComponent).elapsedSeconds.set(seconds)
        break
      }
      if(getComponent(entity,PaddleComponent)) {
        // reset ball recentness
        getMutableComponent(ball,BallComponent).elapsedSeconds.set(seconds)
        break
      }
      if(getComponent(entity,GroundPlaneComponent)) {
        hide(ball)
        break
      }
    }
  })
}

///
/// Reason about game states and advance them
/// @todo this probably could be reactive
///

export function pongReason(pong:Entity) {

  const pongComponent = getComponent(pong,PongComponent)
  const pongUUID = getComponent(pong,UUIDComponent)

  // are there any players associated with goals?
  let numAvatars = 0
  pongComponent.goals.forEach(goal=>{
    if(getComponent(goal,GoalComponent).avatar) numAvatars++
  })

  // advance game state on the server for simplicity
  switch(pongComponent.mode) {

    default:
    case PongMode.completed:
      // stay in completed state till players all leave then go to stopped state
      if(numAvatars) break
      dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.stopped }))
      break

    case PongMode.stopped:
      // stay in stopped state till players show up
      if(!numAvatars) break
      dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.starting }))
      break

    case PongMode.starting:

      // advise goals to reset; i like to keep goals around until new game is active
      pongComponent.goals.forEach(goal=>{
        const entityUUID = getComponent(goal, UUIDComponent) as EntityUUID
        const damage = "0"
        dispatchAction(PongAction.pongGoal({ entityUUID, damage }))
      })

      // make balls not be around
      pongComponent.balls.forEach(ball=>{
        hide(ball)
      })

      // switch to playing
      dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.playing }))
      break

    case PongMode.playing:

      // stop playing if players leave
      if(!numAvatars) {
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode: PongMode.stopped }))
        break
      }
    
      // manually check to see if game has ended by inspecting damage - due to distributed nature of events
      let gameover = false
      pongComponent.goals.forEach(goal=>{
        const goalComponent = getComponent(goal,GoalComponent)
        if(goalComponent.damage >= goalComponent.maxDamage ) {
          const entityUUID = getComponent(goal, UUIDComponent) as EntityUUID
          const damage = "lost"
          dispatchAction(PongAction.pongGoal({ entityUUID, damage }))
          gameover = true
        }
      })

      if(gameover) {
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode: PongMode.completed }))
        break
      }

      // evaluate collisions and volley events
      ballCollisions(pong)
      ballVolley(pong)

      break
  }

}
