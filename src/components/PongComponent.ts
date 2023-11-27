import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { matches } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { defineComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { Vector3 } from 'three'

export enum PongMode {
  'stopped' = 'stopped',
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
