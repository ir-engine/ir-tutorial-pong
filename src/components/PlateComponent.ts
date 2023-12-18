
import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { defineComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

export const PlateComponent = defineComponent({
  name: 'Plate Component',
  jsonID: 'pong.plate',
  onInit: (entity) => {
    return {
      goal: 0 as Entity
    }
  },
  onSet: (entity, component, json) => {
  },
  toJSON: (entity, component) => {
    return {}
  }
})
