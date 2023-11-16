import { isClient } from "@etherealengine/engine/src/common/functions/getEnvironment";
import { ComponentShelfCategories } from '@etherealengine/editor/src/components/element/ElementList'
import { EntityNodeEditor } from '@etherealengine/editor/src/functions/ComponentEditors'
import { getState } from "@etherealengine/hyperflux";
import { EngineState } from "@etherealengine/engine/src/ecs/classes/EngineState";
import { startSystem } from "@etherealengine/engine/src/ecs/functions/SystemFunctions";
import { SimulationSystemGroup } from "@etherealengine/engine/src/ecs/functions/EngineFunctions";

import { PongComponent } from "./components/PongComponent";
import { PongComponentEditor } from "./editors/PongComponentEditor";
import { PongSystem } from "./systems/PongSystem";

export default async function worldInjection() {
  if (isClient) {
    if (getState(EngineState).isEditing) {
      EntityNodeEditor.set(PongComponent, PongComponentEditor)
      ComponentShelfCategories.Misc.push(PongComponent)
    }
    startSystem(PongSystem, { after: SimulationSystemGroup })
  }
}
