import { defineComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

export const PaddleComponent = defineComponent({
  name: 'Paddle Component',
  jsonID: 'pong.paddle',
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
