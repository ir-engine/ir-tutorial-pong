import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'

import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { RigidBodyComponent } from '@etherealengine/engine/src/physics/components/RigidBodyComponent'
import { NetworkObjectComponent } from '@etherealengine/engine/src/networking/components/NetworkObjectComponent'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { PrimitiveGeometryComponent } from '@etherealengine/engine/src/scene/components/PrimitiveGeometryComponent'
import { VisibleComponent } from '@etherealengine/engine/src/scene/components/VisibleComponent'
import { ColliderComponent } from '@etherealengine/engine/src/scene/components/ColliderComponent'

import { getComponent, setComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { createEntity } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'

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


