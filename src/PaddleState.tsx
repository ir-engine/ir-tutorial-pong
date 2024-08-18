import { UserID } from '@ir-engine/common/src/schema.type.module'
import { EntityUUID, UUIDComponent, getComponent, matchesEntityUUID, setComponent } from '@ir-engine/ecs'
import {
  GrabbableComponent,
  GrabbedComponent
} from '@ir-engine/engine/src/interaction/components/GrabbableComponent'
import { GrabbableNetworkAction } from '@ir-engine/engine/src/interaction/functions/grabbableFunctions'
import { PrimitiveGeometryComponent } from '@ir-engine/engine/src/scene/components/PrimitiveGeometryComponent'
import {
  defineAction,
  defineState,
  dispatchAction,
  getMutableState,
  matches,
  none,
  useHookstate
} from '@ir-engine/hyperflux'
import { NetworkTopics, WorldNetworkAction, matchesUserID } from '@ir-engine/network'
import { NameComponent } from '@ir-engine/spatial/src/common/NameComponent'
import { ColliderComponent } from '@ir-engine/spatial/src/physics/components/ColliderComponent'
import { RigidBodyComponent } from '@ir-engine/spatial/src/physics/components/RigidBodyComponent'
import { CollisionGroups } from '@ir-engine/spatial/src/physics/enums/CollisionGroups'
import { BodyTypes } from '@ir-engine/spatial/src/physics/types/PhysicsTypes'
import { VisibleComponent } from '@ir-engine/spatial/src/renderer/components/VisibleComponent'
import { SpawnObjectActions } from '@ir-engine/spatial/src/transform/SpawnObjectActions'
import {
  DistanceFromCameraComponent,
  FrustumCullCameraComponent
} from '@ir-engine/spatial/src/transform/components/DistanceComponents'
import { TransformComponent } from '@ir-engine/spatial/src/transform/components/TransformComponent'
import React, { useEffect } from 'react'
import { Vector3 } from 'three'

export enum PongCollisionGroups {
  PaddleCollisionGroup = 1 << 6
}

export class PaddleActions {
  static spawnPaddle = defineAction({
    ...SpawnObjectActions.spawnObject.actionShape,
    prefab: 'ee.pong.paddle',
    gameEntityUUID: matchesEntityUUID,
    handedness: matches.literals('left', 'right'),
    owner: matchesUserID,
    $topic: NetworkTopics.world
  })
}

export const PaddleState = defineState({
  name: 'ee.pong.PaddleState',
  initial: {} as Record<
    EntityUUID,
    {
      owner: UserID
      handedness: 'left' | 'right'
      gameEntityUUID: EntityUUID
    }
  >,

  receptors: {
    onSpawnPaddle: PaddleActions.spawnPaddle.receive((action) => {
      const state = getMutableState(PaddleState)
      state[action.entityUUID].merge({
        owner: action.owner,
        handedness: action.handedness,
        gameEntityUUID: action.gameEntityUUID
      })
    }),
    onDestroyPaddle: WorldNetworkAction.destroyEntity.receive((action) => {
      const state = getMutableState(PaddleState)
      state[action.entityUUID].set(none)
    })
  },

  reactor: () => {
    const paddlesState = useHookstate(getMutableState(PaddleState))

    return (
      <>
        {paddlesState.keys.map((entityUUID: EntityUUID) => (
          <PaddleReactor key={entityUUID} entityUUID={entityUUID} />
        ))}
      </>
    )
  }
})

const PaddleReactor = ({ entityUUID }: { entityUUID: EntityUUID }) => {
  const paddleState = useHookstate(getMutableState(PaddleState)[entityUUID])

  useEffect(() => {
    const entity = UUIDComponent.getEntityByUUID(entityUUID)
    const ownerEntity = UUIDComponent.getEntityByUUID(paddleState.owner.value as any as EntityUUID)

    /** @todo - add colours */
    // const game = getState(PongState)[paddleState.gameEntityUUID.value]
    // const color = PlayerColors[game.players.findIndex(player => player.connected === paddleState.owner.value)]

    setComponent(entity, TransformComponent, { scale: new Vector3(0.2, 0.2, 0.1) })
    setComponent(entity, VisibleComponent)
    setComponent(entity, DistanceFromCameraComponent)
    setComponent(entity, FrustumCullCameraComponent)

    setComponent(
      entity,
      NameComponent,
      getComponent(ownerEntity, NameComponent) + "'s " + paddleState.handedness.value + ' paddle'
    )

    setComponent(entity, PrimitiveGeometryComponent, {
      geometryType: 1
    })

    /** Grabbable system handles setting collider as kinematic, so just set it to dynamic here */
    setComponent(entity, RigidBodyComponent, { type: BodyTypes.Dynamic })
    setComponent(entity, ColliderComponent, {
      shape: 'sphere',
      collisionLayer: PongCollisionGroups.PaddleCollisionGroup as any,
      collisionMask: CollisionGroups.Default,
      restitution: 0.5
    })

    setComponent(entity, GrabbableComponent)
    setComponent(entity, GrabbedComponent, {
      attachmentPoint: paddleState.handedness.value,
      grabberEntity: ownerEntity
    })

    dispatchAction(
      GrabbableNetworkAction.setGrabbedObject({
        entityUUID,
        grabberUserId: paddleState.owner.value as any as EntityUUID,
        grabbed: true,
        attachmentPoint: paddleState.handedness.value
      })
    )
  }, [])

  return null
}
