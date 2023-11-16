import { defineQuery, getComponent, getMutableComponent } from "@etherealengine/engine/src/ecs/functions/ComponentFunctions";
import { defineSystem } from "@etherealengine/engine/src/ecs/functions/SystemFunctions";
import { PongComponent } from "../components/PongComponent";
import { LocalTransformComponent } from "@etherealengine/engine/src/transform/components/TransformComponent";
import { NO_PROXY, getState } from "@etherealengine/hyperflux";
import { EngineState } from "@etherealengine/engine/src/ecs/classes/EngineState";
import { Vector3 } from "three";
import { CollisionComponent } from "@etherealengine/engine/src/physics/components/CollisionComponent";

const query = defineQuery([PongComponent])

export const PongSystem = defineSystem({
  uuid: "PongSystem",
  execute: () => {
  
    // - find hands by brute force with query
    //    - reset game if no players enar game

    // - query for collisions on the components by brute force
    //    - increment score
    //    - paint scores
    //    - detect end of game

    const { elapsedSeconds, deltaSeconds } = getState(EngineState)
    for (const entity of query()) {
//      console.log("collision detected by system")
    }
  }
})

