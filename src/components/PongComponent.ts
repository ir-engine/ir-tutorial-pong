import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { matches } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { defineComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { Vector3 } from 'three'

export const PongComponent = defineComponent({
  name: 'Pong Component',

  jsonID: 'pong',

  onInit: (entity) => {
    return {
      ball: '' as EntityUUID,
      paddle1: '' as EntityUUID,
      paddle2: '' as EntityUUID,
      wall1: '' as EntityUUID,
      wall2: '' as EntityUUID,
      score1: '' as EntityUUID,
      score2: '' as EntityUUID,
      plate1: '' as EntityUUID,
      plate2: '' as EntityUUID,
      tilter: '' as EntityUUID,
      player1: '' as EntityUUID,
      player2: '' as EntityUUID,
      collisions1: 0,
      collisions2: 0,
      mode: 0,
      paddle1xzy: null as Vector3 | null,
      paddle2xzy: null as Vector3 | null
    }
  },

  onSet: (entity, pong, json) => {
    if (!json) return
    if (matches.string.test(json.ball)) pong.ball.set(json.ball)
    if (matches.string.test(json.paddle1)) pong.paddle1.set(json.paddle1)
    if (matches.string.test(json.paddle2)) pong.paddle2.set(json.paddle2)
    if (matches.string.test(json.wall1)) pong.wall1.set(json.wall1)
    if (matches.string.test(json.wall2)) pong.wall2.set(json.wall2)
    if (matches.string.test(json.score1)) pong.score1.set(json.score1)
    if (matches.string.test(json.score2)) pong.score2.set(json.score2)
    if (matches.string.test(json.plate1)) pong.plate1.set(json.plate1)
    if (matches.string.test(json.plate2)) pong.plate2.set(json.plate2)
    if (matches.string.test(json.tilter)) pong.tilter.set(json.tilter)
  },

  toJSON: (entity, pong) => {
    return {
      ball: pong.ball.value,
      paddle1: pong.paddle1.value,
      paddle2: pong.paddle2.value,
      wall1: pong.wall1.value,
      wall2: pong.wall2.value,
      score1: pong.score1.value,
      score2: pong.score2.value,
      plate1: pong.score1.value,
      plate2: pong.score1.value,
      tilter: pong.score2.value
    }
  }
})
