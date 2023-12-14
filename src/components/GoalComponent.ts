import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { defineComponent, getMutableComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { PongAction } from '../PongActions'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { TextComponent } from '@etherealengine/engine/src/scene/components/TextComponent'

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


export const pongLocalGoal = (action: ReturnType<typeof PongAction.pongGoal>) => {
  console.log("....... pong 1")
  const goal = UUIDComponent.entitiesByUUID[action.entityUUID]
  if(!goal) return
  console.log("....... pong 2")
  const goalMutable = getMutableComponent(goal,GoalComponent)
  if(!goalMutable) return
  goalMutable.damage.set( action.damage )
  console.log("....... pong 3")
  if(goalMutable.text.value) {
    console.log("....... pong 4",goalMutable.text.value)
    const textMutable = getMutableComponent(goalMutable.text.value,TextComponent)
    if(textMutable) {
      console.log("....... pong 5",action.damage)
      textMutable.text.set(`${action.damage}`)
    } else {
      console.log("....... pong text bad")
    }
  }
  //netlog("*** pong: set goal in game ="+action.damage+" goal="+entity2UUID(goal))
}
