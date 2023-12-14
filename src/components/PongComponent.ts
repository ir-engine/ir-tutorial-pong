import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { getMutableComponent, defineComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { PongAction } from '../PongActions'

export enum PongMode {
  'stopped' = 'stopped',
  'starting' = 'starting',
  'playing' = 'playing',
  'completed' = 'completed'
}

export const PongComponent = defineComponent({
  name: 'Pong Component',
  jsonID: 'pong',
  onInit: (entity) => {
    return {
      goals: [] as Array<Entity>,
      balls: [] as Array<Entity>,
      mode: PongMode.stopped,
      elapsedSeconds: 0
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

export const pongPong = (action: ReturnType<typeof PongAction.pongPong>) => {
  const pong = UUIDComponent.entitiesByUUID[action.uuid]
  if(!pong) return
  const pongMutable = getMutableComponent(pong,PongComponent)
  if(!pongMutable) return
  switch(action.mode) {
    default:
    case 'stopped': pongMutable.mode.set( PongMode.stopped ); break
    case 'starting': pongMutable.mode.set( PongMode.starting ); break
    case 'playing': pongMutable.mode.set( PongMode.playing ); break
    case 'completed': pongMutable.mode.set( PongMode.completed ); break
  }
}

