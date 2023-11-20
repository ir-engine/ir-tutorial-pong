import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { matches } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { defineComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { Vector3 } from 'three'

export const PongComponent = defineComponent({
  name: 'Pong Component',
  jsonID: 'pong',
  onInit: (entity) => {
    return {
      playing: false,
      timer: 0
    }
  },
  onSet: (entity, pong, json) => {
    if (!json) return
  },
  toJSON: (entity, pong) => {
    return {
    }
  }
})
