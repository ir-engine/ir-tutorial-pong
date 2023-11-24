
import { defineComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

export const PlateComponent = defineComponent({
  name: 'Plate Component',
  jsonID: 'pong.plate',
  onInit: (entity) => {
    return {
    }
  },
  onSet: (entity, component, json) => {
  },
  toJSON: (entity, component) => {
    return {}
  }
})
