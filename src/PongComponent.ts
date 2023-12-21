import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'
import { defineComponent, getComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { useEntityContext } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { dispatchAction, getState } from '@etherealengine/hyperflux'
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
