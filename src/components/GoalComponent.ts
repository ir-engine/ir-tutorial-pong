import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { defineComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

export const GoalComponent = defineComponent({
  name: 'Goal Component',
  jsonID: 'pong.goal',
  onInit: (entity) => {
    return {
      plate: 0 as Entity,
      paddle1: 0 as Entity,
      paddle2: 0 as Entity,
      text: 0 as Entity,
      avatar: 0 as Entity,
      avatarTimer: 0,
      damage: 0,
      startingHealth: 9,
    }
  },
  onSet: (entity, component, json) => {
  },
  toJSON: (entity, component) => {
    return {}
  }
})
