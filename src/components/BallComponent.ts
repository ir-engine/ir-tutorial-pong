
import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { defineComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

export const BallComponent = defineComponent({
  name: 'Ball Component',
  jsonID: 'pong.ball',
  onInit: (entity) => {
    return {
      pongUUID: "" as EntityUUID,
      avatarUUID: "" as EntityUUID,
      elapsedSeconds: 0
    }
  },
  onSet: (entity, component, json) => {
  },
  toJSON: (entity, component) => {
    return {}
  }
})
