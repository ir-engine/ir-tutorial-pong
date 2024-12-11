import { EntityUUID } from '@ir-engine/ecs'
import { dispatchAction, getState } from '@ir-engine/hyperflux'
import { setCallback } from '@ir-engine/spatial/src/common/CallbackComponent'

import { UserID } from '@ir-engine/common/src/schema.type.module'
import { isClient } from '@ir-engine/common/src/utils/getEnvironment'
import {
  UUIDComponent,
  UndefinedEntity,
  defineComponent,
  getComponent,
  hasComponent,
  useEntityContext
} from '@ir-engine/ecs'
import { AvatarComponent } from '@ir-engine/engine/src/avatar/components/AvatarComponent'
import { NameComponent } from '@ir-engine/spatial/src/common/NameComponent'
import { traverseEntityNodeParent } from '@ir-engine/spatial/src/transform/components/EntityTree'
import { useEffect } from 'react'
import { PongComponent } from './PongComponent'
import { PongActions, PongState } from './PongGameState'

const plateNames = ['plateA', 'plateB', 'plateC', 'plateD']

export const PlateComponent = defineComponent({
  name: 'PlateComponent',
  jsonID: 'EE_tutorial_pong_plate',

  reactor: function () {
    /** Run player enter logic only on the server */
    if (isClient) return null

    const entity = useEntityContext()

    useEffect(() => {
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
        if (!hasComponent(otherEntity, AvatarComponent)) return
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
        if (!hasComponent(otherEntity, AvatarComponent)) return
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
