import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { matches, matchesEntityUUID, matchesUserId } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { NetworkTopics } from '@etherealengine/engine/src/networking/classes/Network'
import { PhysicsSystem } from '@etherealengine/engine/src/physics/PhysicsModule'
import { UserID } from '@etherealengine/engine/src/schemas/user/user.schema'
import {
  defineAction,
  defineState,
  dispatchAction,
  getMutableState,
  none,
  receiveActions,
  useHookstate
} from '@etherealengine/hyperflux'
import React, { useEffect } from 'react'

import { getComponent, setComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import {
  GrabbableComponent,
  GrabbedComponent
} from '@etherealengine/engine/src/interaction/components/GrabbableComponent'
import { GrabbableNetworkAction } from '@etherealengine/engine/src/interaction/systems/GrabbableSystem'
import { WorldNetworkAction } from '@etherealengine/engine/src/networking/functions/WorldNetworkAction'
import { CollisionGroups } from '@etherealengine/engine/src/physics/enums/CollisionGroups'
import { ColliderComponent } from '@etherealengine/engine/src/scene/components/ColliderComponent'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { PrimitiveGeometryComponent } from '@etherealengine/engine/src/scene/components/PrimitiveGeometryComponent'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { VisibleComponent } from '@etherealengine/engine/src/scene/components/VisibleComponent'
import {
  DistanceFromCameraComponent,
  FrustumCullCameraComponent
} from '@etherealengine/engine/src/transform/components/DistanceComponents'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { Vector3 } from 'three'

export enum PongCollisionGroups {
  PaddleCollisionGroup = 1 << 6
}

export class PaddleActions {
  static spawnPaddle = defineAction({
    ...WorldNetworkAction.spawnObject.actionShape,
    prefab: 'ee.pong.paddle',
    gameEntityUUID: matchesEntityUUID,
    handedness: matches.literals('left', 'right'),
    owner: matchesUserId,
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

  receptors: [
    [
      PaddleActions.spawnPaddle,
      (state, action: typeof PaddleActions.spawnPaddle.matches._TYPE) => {
        state[action.entityUUID].merge({
          owner: action.owner,
          handedness: action.handedness,
          gameEntityUUID: action.gameEntityUUID
        })
      }
    ],
    [
      WorldNetworkAction.destroyObject,
      (state, action: typeof WorldNetworkAction.destroyObject.matches._TYPE) => {
        state[action.entityUUID].set(none)
      }
    ]
  ]
})

const execute = () => {
  receiveActions(PaddleState)
}

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
    setComponent(entity, ColliderComponent, {
      bodyType: 0, // dynamic
      shapeType: 1, // sphere
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

const reactor = () => {
  const paddlesState = useHookstate(getMutableState(PaddleState))

  return (
    <>
      {paddlesState.keys.map((entityUUID: EntityUUID) => (
        <PaddleReactor key={entityUUID} entityUUID={entityUUID} />
      ))}
    </>
  )
}

export const PaddleSystem = defineSystem({
  uuid: 'pong.paddle-system',
  execute,
  reactor,
  insert: { after: PhysicsSystem }
})
