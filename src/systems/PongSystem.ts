import { defineQuery, getComponent, getMutableComponent, removeComponent, updateComponent, useOptionalComponent } from "@etherealengine/engine/src/ecs/functions/ComponentFunctions";
import { defineSystem } from "@etherealengine/engine/src/ecs/functions/SystemFunctions";
import { PongComponent } from "../components/PongComponent";
import { LocalTransformComponent } from "@etherealengine/engine/src/transform/components/TransformComponent";
import { NO_PROXY, getState } from "@etherealengine/hyperflux";
import { EngineState } from "@etherealengine/engine/src/ecs/classes/EngineState";
import { Vector3 } from "three";
import { CollisionComponent } from "@etherealengine/engine/src/physics/components/CollisionComponent";
import { UUIDComponent } from "@etherealengine/engine/src/scene/components/UUIDComponent";
import { Entity } from "@etherealengine/engine/src/ecs/classes/Entity";
import { TextComponent } from "../components/TextComponent";

const query1 = defineQuery([PongComponent])
const query2 = defineQuery([CollisionComponent])

let collisions1 = 0
let collisions2 = 0

export const PongSystem = defineSystem({
  uuid: "PongSystem",
  execute: () => {
  
    // - find hands by brute force with query
    //    - reset game if no players enar game

    // - query for collisions on the components by brute force
    //    - increment score
    //    - paint scores
    //    - detect end of game

    // hideously busy poll each pong game
    for (const pongEntity of query1()) {

      const pong = getComponent(pongEntity,PongComponent)

      const wall1 = UUIDComponent.entitiesByUUID[pong.wall1]
      const wall2 = UUIDComponent.entitiesByUUID[pong.wall2]
      const score1 = UUIDComponent.entitiesByUUID[pong.score1]
      const score2 = UUIDComponent.entitiesByUUID[pong.score2]
      if(!wall1 || !wall2 || !score1 || !score2) continue
      let score1text = getMutableComponent(score1,TextComponent)
      let score2text = getMutableComponent(score2,TextComponent)

      // monstrously brute force search for collisions related to this game
      for (const collisionEntity of query2()) {
        if(collisionEntity == wall1) {
          score1text.text.set(`${collisions1++}`)
          //updateComponent(score1,TextComponent,{text:`${collisions1++}`})
        }
        if(collisionEntity == wall2) {
          score2text.text.set(`${collisions2++}`)
          //updateComponent(score2,TextComponent,{text:`${collisions2++}`})
        }
      }

      // flush any collisions
      try {
        removeComponent(wall1, CollisionComponent)
        removeComponent(wall2, CollisionComponent)
      } catch(err) {
        console.error(err)
      }

    }
  }
})

