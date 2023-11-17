import { defineComponent, getMutableComponent, removeComponent, useComponent, useOptionalComponent } from "@etherealengine/engine/src/ecs/functions/ComponentFunctions"
import { useEntityContext } from "@etherealengine/engine/src/ecs/functions/EntityFunctions"
import { useEffect } from "react"
import { EntityUUID } from "@etherealengine/common/src/interfaces/EntityUUID"
import { CollisionComponent } from "@etherealengine/engine/src/physics/components/CollisionComponent"
import { matches } from "@etherealengine/engine/src/common/functions/MatchesUtils"
import { UUIDComponent } from "@etherealengine/engine/src/scene/components/UUIDComponent"
import { TextComponent } from "./TextComponent"
import { Entity } from "@etherealengine/engine/src/ecs/classes/Entity"

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
      collisions1: 0,
      collisions2: 0,
    }
  },
  onSet: (entity, component, json) => {
    if (!json) return
    if (matches.string.test(json.ball)) component.ball.set(json.ball)
    if (matches.string.test(json.paddle1)) component.paddle1.set(json.paddle1)
    if (matches.string.test(json.paddle2)) component.paddle2.set(json.paddle2)
    if (matches.string.test(json.wall1)) component.wall1.set(json.wall1)
    if (matches.string.test(json.wall2)) component.wall2.set(json.wall2)
    if (matches.string.test(json.score1)) component.score1.set(json.score1)
    if (matches.string.test(json.score2)) component.score2.set(json.score2)
  },
  toJSON: (entity, component) => {
    const state = {
      ball: component.ball.value,
      paddle1: component.paddle1.value,
      paddle2: component.paddle2.value,
      wall1: component.wall1.value,
      wall2: component.wall2.value,
      score1: component.score1.value,
      score2: component.score2.value
    }
    return state
  },

  // register state change listeners / observers
  reactor: () => {

    // assert that the self entity has its own state attached to itself
    const entity = useEntityContext()
    const pong = useComponent(entity, PongComponent)

    // hit wall1?
    const wall1 = UUIDComponent.entitiesByUUID[pong.wall1.value]
    const collision1 = useOptionalComponent(wall1, CollisionComponent )

    // this is a way to detect a collision
    // it is however not synchronous and in some use cases would be a problem
    // in our case it is ok because we intend to reset the game state on a collision

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

    return null
  }
})

function useMutableComponent(score1: Entity, TextComponent: { name: string; jsonID: string; onInit: (this: import("bitecs").ComponentType<Record<string, any>>, entity: import("@etherealengine/engine/src/ecs/classes/Entity").Entity) => { text: string; geometry: import("@etherealengine/engine/src/assets/constants/Geometry").Geometry; mesh: import("three").Mesh<import("three").BufferGeometry<import("three").NormalBufferAttributes>, import("three").Material | import("three").Material[], import("three").Object3DEventMap> }; toJSON: (entity: import("@etherealengine/engine/src/ecs/classes/Entity").Entity, component: import("@hookstate/core").State<{ text: string; geometry: import("@etherealengine/engine/src/assets/constants/Geometry").Geometry; mesh: import("three").Mesh<import("three").BufferGeometry<import("three").NormalBufferAttributes>, import("three").Material | import("three").Material[], import("three").Object3DEventMap> }>) => { text: string }; onSet: (entity: import("@etherealengine/engine/src/ecs/classes/Entity").Entity, component: import("@hookstate/core").State<{ text: string; geometry: import("@etherealengine/engine/src/assets/constants/Geometry").Geometry; mesh: import("three").Mesh<import("three").BufferGeometry<import("three").NormalBufferAttributes>, import("three").Material | import("three").Material[], import("three").Object3DEventMap> }>, json: Partial<{ text: string }> | undefined) => void; onRemove: (entity: import("@etherealengine/engine/src/ecs/classes/Entity").Entity, component: import("@hookstate/core").State<{ text: string; geometry: import("@etherealengine/engine/src/assets/constants/Geometry").Geometry; mesh: import("three").Mesh<import("three").BufferGeometry<import("three").NormalBufferAttributes>, import("three").Material | import("three").Material[], import("three").Object3DEventMap> }>) => void; reactor: () => null } & import("bitecs").ComponentType<Record<string, any>> & import("@etherealengine/engine/src/ecs/functions/ComponentFunctions").Component<{ text: string; geometry: import("@etherealengine/engine/src/assets/constants/Geometry").Geometry; mesh: import("three").Mesh<import("three").BufferGeometry<import("three").NormalBufferAttributes>, import("three").Material | import("three").Material[], import("three").Object3DEventMap> }, Record<string, any>, { text: string }, Partial<{ text: string }>, ""> & { _TYPE: { text: string; geometry: import("@etherealengine/engine/src/assets/constants/Geometry").Geometry; mesh: import("three").Mesh<import("three").BufferGeometry<import("three").NormalBufferAttributes>, import("three").Material | import("three").Material[], import("three").Object3DEventMap> } }) {
  throw new Error("Function not implemented.")
}

