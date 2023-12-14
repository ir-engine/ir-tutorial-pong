
import { Quaternion, Vector3 } from 'three'

import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'

import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { CollisionComponent } from '@etherealengine/engine/src/physics/components/CollisionComponent'
import { RigidBodyComponent } from '@etherealengine/engine/src/physics/components/RigidBodyComponent'
import { EntityTreeComponent } from '@etherealengine/engine/src/ecs/functions/EntityTree'
import { AvatarRigComponent } from '@etherealengine/engine/src/avatar/components/AvatarAnimationComponent'
import { AvatarComponent } from '@etherealengine/engine/src/avatar/components/AvatarComponent'
import { addComponent, defineQuery, getComponent, getMutableComponent, setComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

import { NetworkObjectComponent } from '@etherealengine/engine/src/networking/components/NetworkObjectComponent'
import { WorldNetworkAction } from '@etherealengine/engine/src/networking/functions/WorldNetworkAction'

import { defineAction, dispatchAction, getState } from '@etherealengine/hyperflux'

import { PongComponent } from './components/PongComponent'
import { GoalComponent } from './components/GoalComponent'
import { TextComponent } from './components/TextComponent'
import { BallComponent } from './components/BallComponent'
import { PlateComponent } from './components/PlateComponent'
import { PaddleComponent } from './components/PaddleComponent'
import { netlog } from './PongLogging'
import { createEntity } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { PrimitiveGeometryComponent } from '@etherealengine/engine/src/scene/components/PrimitiveGeometryComponent'
import { VisibleComponent } from '@etherealengine/engine/src/scene/components/VisibleComponent'
import { ColliderComponent } from '@etherealengine/engine/src/scene/components/ColliderComponent'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { PongAction } from './PongActions'
import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'

let counter = 0

///
/// A ball spawner - doesn't work yet
///

function spawnBall() {

  const userId = Engine.instance.userID
  const ownerEntity = Engine.instance.localClientEntity
  const entity = createEntity() //NetworkObjectComponent.getNetworkObject(userId, action.networkId)!

  setComponent(entity, NameComponent, `Pong-${userId}-${counter++}`)
  setComponent(entity, VisibleComponent, true)
  setComponent(entity, PrimitiveGeometryComponent)
  setComponent(entity, ColliderComponent)
  setComponent(entity, TransformComponent)
  setComponent(entity, RigidBodyComponent)
  setComponent(entity, NetworkObjectComponent)

  const transform = getComponent(entity, TransformComponent)
  transform.position.y += 5

  const rigid = getComponent(entity,RigidBodyComponent)

  /*
    const colliderDesc = ColliderDesc.ball(golfBallRadius)
    colliderDesc.setCollisionGroups(interactionGroups)
    colliderDesc.setActiveCollisionTypes(ActiveCollisionTypes.ALL)
    colliderDesc.setActiveEvents(ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS)
    colliderDesc.setMass(ballMass)
    colliderDesc.setRestitution(0.9)
    colliderDesc.setFriction(0.4)
    colliderDesc.setFrictionCombineRule(CoefficientCombineRule.Max)
  
    const rigidBodyDesc = RigidBodyDesc.dynamic()
    const rigidBody = Physics.createRigidBody(entityBall, Engine.instance.physicsWorld, rigidBodyDesc, [
      colliderDesc
    ])
    rigidBody.setAngularDamping(1)
    rigidBody.setLinearDamping(0)
    // rigidBody.enableCcd(true)
  */
 
     
    /*

    static spawnObject = defineAction({
    type: 'ee.engine.world.SPAWN_OBJECT',
    prefab: matches.string,
    entityUUID: matchesEntityUUID,
    networkId: matchesWithDefault(matchesNetworkId, () => NetworkObjectComponent.createNetworkId()),
    position: matchesVector3.optional(),
    rotation: matchesQuaternion.optional(),
    $cache: true,
    $topic: NetworkTopics.world
  })
  dispatchAction(WorldNetworkAction.spawnObject(...)

    */
 
  return entity
}

///
/// A ball mover
/// @todo it is unclear if there is a delay between requesting ownership and getting it
///

function moveBall(ball:Entity,position:Vector3,impulse:Vector3) {

  // the engine is arranged such that an object must be explicitly requested to be 'owned' in order to be moved

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

  const rigid = getComponent(ball,RigidBodyComponent)

  // strategies to try set the ball position
  {
    // a ball is dynamic - not kinematic so this should not work...
    // rigid.targetKinematicPosition.copy(position)

    // this should work but does not? ...
    rigid.position.copy(position)

    // this doesn't network correctly ...
    rigid.body.setTranslation({ x:0, y:5, z:0 }, true) 

    // uh i dunno at this point
    // const ballTransform = getComponent(ball,TransformComponent)
    // ballTransform.position.copy(position)
  }

  rigid.body.resetForces(true)
  if(impulse && (impulse.x || impulse.y || impulse.z)) {
    rigid.body.applyImpulse(impulse as Vector3,true)    
    // a timeout seemed needed between resetting and applying forces?
    setTimeout(()=>{
      //rigid.body.wakeUp()
      //rigid.body.setLinvel(zero, true)
      //rigid.body.setAngvel(zero, true)
      //rigid.targetKinematicPosition.copy(xyz)
      //rigid.body.setLinvel(vel,true)
      //rigid.body.resetForces(true)
      rigid.body.applyImpulse(impulse as Vector3,true)
    },10)
  }

}

export function pongVolleyBalls(pong:Entity) {

  // run this on client for now
  if(!isClient) return

  const pongComponent = getComponent(pong, PongComponent)
  if(!pongComponent || !pongComponent.balls.length || !pongComponent.goals.length) return

  // volley balls periodically for now
  // @todo this has to be improved for client side use because clients will fight to volley balls
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
  const goal = pongComponent.goals[Math.floor(pongComponent.goals.length * Math.random())]
  const goalTransform = getComponent(goal,TransformComponent)

  const pongTransform = getComponent(pong,TransformComponent)
  const impulse = goalTransform.position.clone()
  //const mass = 4/3*3.14*(ballTransform.scale.x + 1.0)
  impulse.sub(pongTransform.position).normalize().multiplyScalar(Math.random() * 0.1 + 0.2)

  const position = new Vector3(0,5,0)
  moveBall(ball,position,impulse)

  netlog("volleyed a ball "+ball)
}

export function pongBallCollisions(pong:Entity) {
  const pongComponent = getComponent(pong,PongComponent)
  pongComponent.goals.forEach(goal=>{
    goalBallCollisions(goal)
  })
}

function goalBallCollisions(goal:Entity ) {

  // @todo this could be rewritten using triggers on the plates - this would avoid the busy polling

  const goalComponent = getComponent(goal,GoalComponent)
  if(!goalComponent || !goalComponent.plate) return false

  const collidants = getComponent(goalComponent.plate, CollisionComponent)
  if (!collidants || !collidants.size) return false

  let gameover = false

  for (let pair of collidants) {
    const entity : Entity = pair[0]
    const collision = pair[1]
    //console.log("**** pong collider "+getComponent(entity,NameComponent))
    if(!getComponent(entity,BallComponent)) continue

    const ball = entity
    const position = new Vector3(0,5000,0)
    const impulse = new Vector3(0,0,0)
    moveBall(ball,position,impulse)

    const damage = goalComponent.damage + 1
    if(damage >= goalComponent.startingHealth) gameover = true

    // dispatch update goal score to all parties
    {
      const entityUUID = getComponent(goal, UUIDComponent) as EntityUUID
      dispatchAction(PongAction.pongGoal({ entityUUID, damage }))
      //netlog("*** pong: playing, and a ball hit a goal ball=" + entity2UUID(ball) + " goal="+entity2UUID(goal) + " damage="+damage)
    }


  }
  return gameover
}



/*

revising ball volley strategy dec 13

  - a local client can look and see if there are any balls in play in that game
  - if there are none then they can go ahead and volley
  - we can penalize a client creating a delay prior to volley; such as if they were last hit by a ball
  - balls are eventually recycled by some strategy; if they are far away, on the ground, hit something, hit nothing

*/