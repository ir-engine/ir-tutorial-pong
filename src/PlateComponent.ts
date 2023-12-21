import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import {
  defineComponent,
  getComponent,
  hasComponent,
  removeComponent
} from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { useEntityContext } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'
import { setCallback } from '@etherealengine/engine/src/scene/components/CallbackComponent'
import { GLTFLoadedComponent } from '@etherealengine/engine/src/scene/components/GLTFLoadedComponent'
import { dispatchAction, getState } from '@etherealengine/hyperflux'

import { UndefinedEntity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { traverseEntityNodeParent } from '@etherealengine/engine/src/ecs/functions/EntityTree'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { UserID } from '@etherealengine/engine/src/schemas/user/user.schema'
import { useEffect } from 'react'
import { PongComponent } from './PongComponent'
import { PongActions, PongState } from './PongGameSystem'

const plateNames = ['plateA', 'plateB', 'plateC', 'plateD']

export const PlateComponent = defineComponent({
  name: 'PlateComponent',
  jsonID: 'ee.pong.plate',

  reactor: function () {
    const entity = useEntityContext()

    useEffect(() => {
      /**
       * hack to fix GLTFLoadedComponent on colliders
       * - this will be removed when the new physics ECS API is implemented
       */
      removeComponent(entity, GLTFLoadedComponent)

      /** Configure player enter colliders on the server */
      if (isClient) return

      let gameEntity = UndefinedEntity

      traverseEntityNodeParent(entity, (parent) => {
        if (hasComponent(parent, PongComponent)) {
          gameEntity = parent
        }
      })

      if (!gameEntity) throw new Error('PlateComponent must be a child of a PongComponent')

      const gameEntityUUID = getComponent(gameEntity, UUIDComponent) as EntityUUID

      const index = plateNames.indexOf(getComponent(entity, NameComponent))

      /** Set callbacks to dispatch join/leave events */
      setCallback(entity, 'playerJoin', (triggerEntity, otherEntity) => {
        const playerUserID = getComponent(otherEntity, UUIDComponent) as any as UserID

        /** Dispatch a player change event with this player */
        dispatchAction(
          PongActions.playerChange({
            gameEntityUUID,
            playerIndex: index,
            playerUserID: playerUserID
          })
        )
      })

      setCallback(entity, 'playerLeave', (triggerEntity, otherEntity) => {
        const connected = getState(PongState)[gameEntityUUID].players[index].connected
        /** Check if the currently connected player is not this player */
        if (connected !== (getComponent(otherEntity, UUIDComponent) as any as UserID)) return

        /** Dispatch a player change event with no player */
        dispatchAction(
          PongActions.playerChange({
            gameEntityUUID,
            playerIndex: index
          })
        )
      })
    }, [])

    return null
  }
})
