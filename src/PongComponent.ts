import { defineComponent, getComponent, useEntityContext } from '@etherealengine/ecs'
import { dispatchAction, getState } from '@etherealengine/hyperflux'
import { EngineState } from '@etherealengine/spatial/src/EngineState'
import { UUIDComponent } from '@etherealengine/spatial/src/common/UUIDComponent'
import { useEffect } from 'react'
import { PongActions } from './PongGameSystem'

export const PongComponent = defineComponent({
  name: 'PongComponent',

  jsonID: 'ee.pong.game',

  reactor: () => {
    const entity = useEntityContext()

    useEffect(() => {
      if (getState(EngineState).isEditing) return

      const uuid = getComponent(entity, UUIDComponent)
      dispatchAction(PongActions.startGame({ gameEntityUUID: uuid }))
      return () => {
        dispatchAction(PongActions.endGame({ gameEntityUUID: uuid }))
      }
    }, [])

    return null
  }
})
