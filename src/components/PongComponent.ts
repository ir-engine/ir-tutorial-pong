import { defineComponent, getComponent, getMutableComponent, removeComponent, useComponent, useOptionalComponent } from "@etherealengine/engine/src/ecs/functions/ComponentFunctions"
import { useEntityContext } from "@etherealengine/engine/src/ecs/functions/EntityFunctions"
import { useEffect } from "react"
import { EntityUUID } from "@etherealengine/common/src/interfaces/EntityUUID"
import { CollisionComponent } from "@etherealengine/engine/src/physics/components/CollisionComponent"
import { matches } from "@etherealengine/engine/src/common/functions/MatchesUtils"
import { UUIDComponent } from "@etherealengine/engine/src/scene/components/UUIDComponent"
import { TextComponent } from "./TextComponent"
import { Entity } from "@etherealengine/engine/src/ecs/classes/Entity"
import { TransformComponent } from "@etherealengine/engine/src/transform/components/TransformComponent"
import { Vector3 } from "three"

let collisions1 = 0
let collisions2 = 0

export const PongComponent = defineComponent({
  name: "Pong Component",
  jsonID: "pong",
  onInit: (entity) => {
    return {
      ball: "" as EntityUUID,
      paddle1: "" as EntityUUID,
      paddle2: "" as EntityUUID,
      wall1: "" as EntityUUID,
      wall2: "" as EntityUUID,
      score1: "" as EntityUUID,
      score2: "" as EntityUUID,
      plate1: "" as EntityUUID,
      plate2: "" as EntityUUID,
      tilter: "" as EntityUUID,
      player1: "" as EntityUUID,
      player2: "" as EntityUUID,
      collisions1: 0,
      collisions2: 0,
      mode: 0,
      paddle1xzy: null as Vector3 | null,
      paddle2xzy: null as Vector3 | null
    }
  },
  onSet: (entity, pong, json) => {
    // @todo do this programmatically
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
    const state = {
      ball: pong.ball.value,
      paddle1: pong.paddle1.value,
      paddle2: pong.paddle2.value,
      wall1: pong.wall1.value,
      wall2: pong.wall2.value,
      score1: pong.score1.value,
      score2: pong.score2.value,
      plate1: pong.score1.value,
      plate2: pong.score1.value,
      tilter: pong.score2.value,
    }
    return state
  },

  // register state change listeners / observers
  reactor: () => {

    // assert that the self entity has its own state attached to itself
    const entity = useEntityContext()
    const pong = useComponent(entity, PongComponent)

    return null
  }
})



/*

Was debating doing this here but this is not synchronous with physics

    // hit wall1?
    const wall1 = UUIDComponent.entitiesByUUID[pong.wall1.value]
    const collision1 = useOptionalComponent(wall1, CollisionComponent )

    // this is a way to detect a collision - it is however not synchronous and will be laggy
    useEffect(() => {
      //removeComponent(wall1, CollisionComponent)
      const score1 = UUIDComponent.entitiesByUUID[pong.score1.value]
      let text = getMutableComponent(score1,TextComponent)
      if(text) {
        text.text.set(`${collisions1++}`)
      }
    }, [collision1])

    // hit wall2?
    const wall2 = UUIDComponent.entitiesByUUID[pong.wall2.value]
    const collision2 = useOptionalComponent(wall2, CollisionComponent )
    useEffect(() => {
      //removeComponent(wall2, CollisionComponent)
      const score2 = UUIDComponent.entitiesByUUID[pong.score1.value]
      let text = getMutableComponent(score2,TextComponent)
      if(text) {
        text.text.set(`${collisions2++}`)
      }
    }, [collision2])
*/
