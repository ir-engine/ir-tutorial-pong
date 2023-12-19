
import { Vector3 } from 'three'

import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'

import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'

import { dispatchAction, getState } from '@etherealengine/hyperflux'
import { getComponent, getMutableComponent, removeComponent, setComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { RigidBodyComponent } from '@etherealengine/engine/src/physics/components/RigidBodyComponent'
import { CollisionComponent } from '@etherealengine/engine/src/physics/components/CollisionComponent'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'

import { PongComponent, PongMode } from './components/PongComponent'
import { TextComponent } from './components/TextComponent'
import { BallComponent } from './components/BallComponent'
import { PlateComponent } from './components/PlateComponent'
import { GoalComponent } from './components/GoalComponent'

import { platesBindAvatars } from './PongBindParts'
import { PongAction } from './PongActions'
import { netlog } from './PongLogging'
import { GroundPlaneComponent } from '@etherealengine/engine/src/scene/components/GroundPlaneComponent'
import { CollisionEvents } from '@etherealengine/engine/src/physics/types/PhysicsTypes'
import { AvatarComponent } from '@etherealengine/engine/src/avatar/components/AvatarComponent'
import { PaddleComponent } from './components/PaddleComponent'
import { VisibleComponent } from '@etherealengine/engine/src/scene/components/VisibleComponent'
import { PrimitiveGeometryComponent } from '@etherealengine/engine/src/scene/components/PrimitiveGeometryComponent'


const BALL_VOLLEY_CHECK_PERIOD = 5.0
const BALL_AGE_BEFORE_EXPIRED = 5.0
const BALL_START_HEIGHT = 3.0
const ZERO = new Vector3(0,0,0)
const BALL_POSITION_OFF_SCREEN = new Vector3(100,-10,100)
//const BALL_MAX_DAMAGE = 9

///
/// Update the local goal / score
///

export const pongGoal = (action: ReturnType<typeof PongAction.pongGoal>) => {
  const goal = UUIDComponent.entitiesByUUID[action.entityUUID]
  if(!goal) return
  const goalMutable = getMutableComponent(goal,GoalComponent)
  if(!goalMutable) return
  const val = parseInt(action.damage)
  if(!isNaN(val)) goalMutable.damage.set( val )
  if(goalMutable.text.value) {
    const textMutable = getMutableComponent(goalMutable.text.value,TextComponent)
    if(textMutable) {
      console.log("pong got text to set *** ",val)
      // let's not use text for now
      // textMutable.text.set(action.damage)
      // instead let's scale the component as a power bar
      if(val && !isNaN(val)) {
        const scale = (goalMutable.maxDamage.value-val) / goalMutable.maxDamage.value
        const transform = getComponent(goalMutable.text.value,TransformComponent)
        transform.scale.set(scale,transform.scale.y,transform.scale.z)
        console.log("pong scale is ",transform.scale)

        const geometryComponent = getComponent(goalMutable.text.value, PrimitiveGeometryComponent)
        //const mesh = useState<Mesh>(new Mesh())
        //if(geometryComponent) geometryComponent.geometry.  //(transform.scale)

      }
    } else {
      console.log("....... pong text bad")
    }
  }
  //netlog("*** pong: set goal in game ="+action.damage+" goal="+entity2UUID(goal))
}

///
/// Update local state of play overall
///

export const pongPong = (action: ReturnType<typeof PongAction.pongPong>) => {
  const pong = UUIDComponent.entitiesByUUID[action.uuid]
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
  netlog("setting gamestate " + action.mode)
}

///
/// coerce an entity position
/// @todo this is not the right way to do this but there are some issues with networking of state such as forces
///

export const pongMove = (action: ReturnType<typeof PongAction.pongMove>) => {

  const entity = UUIDComponent.entitiesByUUID[action.entityUUID]
  if(!entity) return
  const transform = getComponent(entity,TransformComponent)
  if(!transform) return
  const rigid = getComponent(entity,RigidBodyComponent)

  if(rigid) {
    rigid.body.wakeUp()
    rigid.body.resetForces(true)
    rigid.body.setLinvel(ZERO, true)
    rigid.body.setAngvel(ZERO, true)
  }

  /*
  if(rigid && action.kinematicPosition) {
    rigid.targetKinematicPosition.copy(action.kinematicPosition)
    transform.position.copy(action.kinematicPosition)
  }

  if(rigid && action.kinematicRotation) {
    rigid.targetKinematicRotation.copy(action.kinematicRotation)
    transform.rotation.copy(action.kinematicRotation)
  }
  */
 
  // strategies to try set the ball position over the network (these are NOT working if issued from server - known bug)
  if(action.position) {
    // this is not networked for objects with physics
    // const ballTransform = getComponent(ball,TransformComponent)
    // ballTransform.position.copy(position)

    // a ball is dynamic - not kinematic so this should not work...
    // rigid.targetKinematicPosition.copy(position)

    // this should work but does not? ...
    //rigid.position.copy(action.position)

    // this may work?
    rigid.body.setTranslation(action.position, true)
  }
  
  if( action.impulse ) {
    //setTimeout(()=>{
      rigid.body.setLinvel(action.impulse as Vector3,true)
      //},10);
  }
}

///
/// Move something by forcing it to move over network
///

export function pongMoveNetwork(ball:Entity,position:Vector3,impulse:Vector3) {

  // get authority over ball - this is problematic as it has a one frame delay - this is a design bug in ee
  /*
  const net = getComponent(ball,NetworkObjectComponent)
  if(!net) {
    netlog("error: no network for ball")
    return
  }
  if(net.authorityPeerID != Engine.instance.store.peerID) {
    console.log("***** pong authority is=" + net.authorityPeerID + " local =" + Engine.instance.store.peerID)
    netlog("ball: transferring ownership for ball name = " + getComponent(ball,NameComponent))
    dispatchAction(
      WorldNetworkAction.requestAuthorityOverObject({
        ownerId: net.ownerId,
        networkId: net.networkId,
        newAuthority: Engine.instance.store.peerID
      })
    )
    console.log("***** pong binding ball ",getComponent(ball,NameComponent),net.authorityPeerID,net.networkId,net.ownerId,Engine.instance.store.peerID)
    //setComponent(ball,NetworkObjectSendPeriodicUpdatesTag)
    //setComponent(ball,NetworkObjectOwnedTag)
    //setComponent(ball,NetworkObjectAuthorityTag)
    // @todo the latency here is unclear; it may be that the below fails if the ball is not locally owned first
  }
  */

  // there's a bug where server issued move events don't work - so this line does not work - instead network it
  // pongMove(PongAction.pongMove({ entityUUID, position, impulse }))

  const entityUUID = getComponent(ball,UUIDComponent)
  dispatchAction(PongAction.pongMove({ entityUUID, position, impulse }))
}

///
/// hide an entity
///

export function pongHideNetwork(entity:Entity) {
  pongMoveNetwork(entity,BALL_POSITION_OFF_SCREEN,ZERO)
}

export function pongHideHack(entity:Entity) {
  getComponent(entity,RigidBodyComponent).body.setTranslation(BALL_POSITION_OFF_SCREEN, true)
}

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
    const goalTransform = getComponent(goal,TransformComponent)
    const pongTransform = getComponent(pong,TransformComponent)
    const impulse = goalTransform.position.clone()
    //const mass = 4/3*3.14*(ballTransform.scale.x + 1.0)
    impulse.sub(pongTransform.position).normalize().multiplyScalar(Math.random() + 2)
    const position = new Vector3(pongTransform.position.x,BALL_START_HEIGHT,pongTransform.position.z)
    pongMoveNetwork(ball,position,impulse)
    netlog("volleying")
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
          netlog("hit a plate but no player")
          break
        }
        // set not visible flag as a hack to detect if ball is out of play - there is network latency on the below
        if(!getComponent(ball,VisibleComponent)) {
          return
        }
        removeComponent(ball,VisibleComponent)
        // hide ball; there is some latency on this event - hence the hack above
        pongHideNetwork(ball)
        // increase damage and publish (server will resolve end game conditions by watching changes)
        const damage = `${goalComponent.damage + 1}`
        const entityUUID = getComponent(plateComponent.goal, UUIDComponent) as EntityUUID
        dispatchAction(PongAction.pongGoal({ entityUUID, damage }))   
        netlog("increased damage")   
        break
      }
      if(getComponent(entity,AvatarComponent)) {
        // reset ball recentness
        getMutableComponent(ball,BallComponent).elapsedSeconds.set(seconds)
        netlog("ball hit player")   
        break
      }
      if(getComponent(entity,PaddleComponent)) {
        // reset ball recentness
        getMutableComponent(ball,BallComponent).elapsedSeconds.set(seconds)
        netlog("ball hit paddle")   
        break
      }
      if(getComponent(entity,GroundPlaneComponent)) {
        netlog("ball hit ground")
        pongHideNetwork(ball)
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
        pongHideNetwork(ball)
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
