
import { Vector3 } from 'three'

import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'

import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'

import { dispatchAction, getState } from '@etherealengine/hyperflux'
import { getComponent, getMutableComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

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


///
/// Update the local goal / score
///

export const pongGoal = (action: ReturnType<typeof PongAction.pongGoal>) => {
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
    const zero = new Vector3(0,0,0)
    rigid.body.setLinvel(zero, true)
    rigid.body.setAngvel(zero, true)
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

  const entityUUID = getComponent(ball,UUIDComponent)
  dispatchAction(PongAction.pongMove({ entityUUID, position, impulse }))
}

///
/// hide an entity
///

export function pongHideNetwork(entity:Entity) {
  pongMoveNetwork(entity,new Vector3(100,-10,100),new Vector3(0,0,0))
}

export function pongHideHack(entity:Entity) {
  getComponent(entity,RigidBodyComponent).body.setTranslation(new Vector3(0,0,0), true)
}

export function ballVolley(pong:Entity) {

  const pongComponent = getComponent(pong, PongComponent)
  if(!pongComponent || !pongComponent.balls.length || !pongComponent.goals.length) return

  // volley balls periodically for now @todo improve
  const seconds = getState(EngineState).elapsedSeconds
  if(seconds < pongComponent.elapsedSeconds ) return
  const pongMutable = getMutableComponent(pong, PongComponent)
  if(!pongMutable) return
  pongMutable.elapsedSeconds.set( seconds + 5.0 )

  // steal the ball with the smallest elapsedSeconds
  // @todo this strategy could be improved - better orchestration would be nice
  let ball = 0 as Entity
  let ballComponent : any = null
  for(const candidate of pongComponent.balls) {
    const candidateComponent = getComponent(candidate,BallComponent)
    if(!ball || candidateComponent.elapsedSeconds < ballComponent.elapsedSeconds) {
      ball = candidate
      ballComponent = candidateComponent
    }
  }

  // update ball time last spawned
  const ballMutable = getMutableComponent(ball,BallComponent)
  ballMutable.elapsedSeconds.set(seconds)

  // volley the ball towards a goal
  const which = Math.floor(pongComponent.goals.length * Math.random())
  const goal = pongComponent.goals[which]
  const goalTransform = getComponent(goal,TransformComponent)

  const pongTransform = getComponent(pong,TransformComponent)
  const impulse = goalTransform.position.clone()
  //const mass = 4/3*3.14*(ballTransform.scale.x + 1.0)
  impulse.sub(pongTransform.position).normalize().multiplyScalar(Math.random() + 4)

  const position = new Vector3(pongTransform.position.x,5,pongTransform.position.z)
  pongMoveNetwork(ball,position,impulse)
}

///
/// reset ball if it hits a plate or the ground; also may cause damage to goal
/// @todo this could be done using triggers instead to reduce busy polling
///

export function ballCollisions(pong:Entity) {
  const pongComponent = getComponent(pong,PongComponent)
  pongComponent.balls.forEach(ball=>{
    const collidants = getComponent(ball, CollisionComponent)
    if (!collidants || !collidants.size) return false
    for (let pair of collidants) {
      const entity : Entity = pair[0]
      const collision = pair[1]
      // if(collision.type != CollisionEvents.COLLISION_START) continue // these simply don't occur on triggers - bug
      // did ball hit a plate?
      const plate = getComponent(entity,PlateComponent)
      if(plate) {
        console.log("**** ball=",ball," plate=",plate,"pos=",getComponent(ball,TransformComponent).position)
        // hide ball; this should arguably propagate over network
        pongHideNetwork(ball)
        // hack: force this faster on the server because I do not want collisions here again next frame
        pongHideHack(ball)
        // this should have been set in the setup; get the plates goal
        const goalComponent = getComponent(plate.goal,GoalComponent)
        if(goalComponent) {
          // increase damage and publish (server will resolve end game conditions by watching changes)
          const damage = goalComponent.damage + 1
          const entityUUID = getComponent(plate.goal, UUIDComponent) as EntityUUID
          dispatchAction(PongAction.pongGoal({ entityUUID, damage }))   
          netlog("increased damage")   
        }
        break
      }
      if(getComponent(entity,GroundPlaneComponent)) {
        netlog("ball hit ground ground")
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
    case PongMode.playing:

      // stop playing if players leave
      if(!numAvatars) {
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode: PongMode.stopped }))
        break
      }

      // transitioning into play? reset the balls and scores

      if(pongComponent.mode == PongMode.starting) {

        // advise goals to reset
        pongComponent.goals.forEach(goal=>{
          const entityUUID = getComponent(goal, UUIDComponent) as EntityUUID
          const damage = 0
          dispatchAction(PongAction.pongGoal({ entityUUID, damage }))
        })

        // make balls not be around
        pongComponent.balls.forEach(ball=>{
          pongHideNetwork(ball)
        })

        // switch to playing
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode:PongMode.playing }))
      }

      // evaluate collisions and volley events
      ballCollisions(pong)
      ballVolley(pong)

      // manually check to see if game has ended - a bit of a hack because clients can volley balls
    
      let gameover = false
      pongComponent.goals.forEach(goal=>{
        const goalComponent = getComponent(goal,GoalComponent)
        if(goalComponent.damage >=9) gameover = true
      })

      if(gameover) {
        dispatchAction(PongAction.pongPong({ uuid: pongUUID, mode: PongMode.completed }))
      }

      break
  }

}
