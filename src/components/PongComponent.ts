import { defineComponent, getComponent, removeComponent, setComponent, useComponent } from "@etherealengine/engine/src/ecs/functions/ComponentFunctions"
import { createEntity, useEntityContext } from "@etherealengine/engine/src/ecs/functions/EntityFunctions"
import { Color, MathUtils, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from "three"
import { useEffect } from "react"
import { addObjectToGroup } from "@etherealengine/engine/src/scene/components/GroupComponent"
import { Entity } from "@etherealengine/engine/src/ecs/classes/Entity"
import { NameComponent } from "@etherealengine/engine/src/scene/components/NameComponent"
import { EntityUUID } from "@etherealengine/common/src/interfaces/EntityUUID"
import { EntityTreeComponent } from "@etherealengine/engine/src/ecs/functions/EntityTree"
import { VisibleComponent } from "@etherealengine/engine/src/scene/components/VisibleComponent"
import { CollisionComponent } from "@etherealengine/engine/src/physics/components/CollisionComponent"
import { matches } from "@etherealengine/engine/src/common/functions/MatchesUtils"
import { UUIDComponent } from "@etherealengine/engine/src/scene/components/UUIDComponent"

//
// pong state
//

export const PongComponent = defineComponent({
  name: "Pong Component",
  jsonID: "pong",
  onInit: (entity) => {
    return {
      ball: "" as EntityUUID,
      paddle1: "" as EntityUUID,
      paddle2: "" as EntityUUID,
      wall1: "" as EntityUUID,
      wall2: "" as EntityUUID
    }
  },
  onSet: (entity, component, json) => {
    if (!json) return
    console.log("**************************  got json",json)
    console.log("**************************  got json",json)
    console.log("**************************  got json",json)
    if (matches.string.test(json.ball)) component.ball.set(json.ball)
    if (matches.string.test(json.paddle1)) component.paddle1.set(json.paddle1)
    if (matches.string.test(json.paddle2)) component.paddle2.set(json.paddle2)
    if (matches.string.test(json.wall1)) component.wall1.set(json.wall1)
    if (matches.string.test(json.wall2)) component.wall2.set(json.wall2)
  },
  toJSON: (entity, component) => {
    const state = {
      ball: component.ball.value,
      paddle1: component.paddle1.value,
      paddle2: component.paddle2.value,
      wall1: component.wall1.value,
      wall2: component.wall2.value
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
    const collision1 = useComponent(wall1, CollisionComponent )
    useEffect(() => {
      console.log("******* hello collision detected wall 1")
      removeComponent(wall1, CollisionComponent)
    }, [collision1.size])

    // hit wall2?
    const wall2 = UUIDComponent.entitiesByUUID[pong.wall2.value]
    const collision2 = useComponent(wall2, CollisionComponent )
    useEffect(() => {
      console.log("******* hello collision detected wall 2 ")
      removeComponent(wall2, CollisionComponent)
    }, [collision2.size])
    
    return null
  }
})

