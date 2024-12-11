import { UUIDComponent, defineComponent, getComponent, useEntityContext } from '@ir-engine/ecs'
import { dispatchAction, getState } from '@ir-engine/hyperflux'
import { EngineState } from '@ir-engine/spatial/src/EngineState'
import { useEffect } from 'react'
import { PongActions } from './PongGameState'

export const PongComponent = defineComponent({
  name: 'PongComponent',

  jsonID: 'EE_tutorial_pong_game',

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
