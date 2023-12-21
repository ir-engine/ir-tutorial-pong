import { defineComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

export const ScoreComponent = defineComponent({
  name: 'ScoreComponent',
  jsonID: 'pong.score',
  onInit: (entity) => {
    return {
      text: '',
    }
  },
  toJSON: (entity, component) => {
    return {}
  },
  onSet: (entity, component, json) => {
  },
})
