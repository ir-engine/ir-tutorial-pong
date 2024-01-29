
import { UUIDComponent } from '@etherealengine/engine/src/common/UUIDComponent'
import { dispatchAction, getState } from '@etherealengine/hyperflux'
import { useEffect } from 'react'
import { PongActions } from './PongGameSystem'
import { defineComponent, useEntityContext, getComponent } from '@etherealengine/ecs'
import { EngineState } from '@etherealengine/engine/src/EngineState'

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
