import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { defineComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
export const GoalComponent = defineComponent({
  name: 'Goal Component',
  jsonID: 'pong.goal',
  onInit: (entity) => {
    return {
      trigger: '' as EntityUUID,
      paddle: '' as EntityUUID,
      score: '' as EntityUUID,
      damage: 0,
    }
  },
  onSet: (entity, component, json) => {
  },
  toJSON: (entity, component) => {
    return {}
  }
})
