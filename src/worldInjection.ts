import { isClient } from "@etherealengine/engine/src/common/functions/getEnvironment";
import { ComponentShelfCategories } from '@etherealengine/editor/src/components/element/ElementList'
import { EntityNodeEditor } from '@etherealengine/editor/src/functions/ComponentEditors'
import { getState } from "@etherealengine/hyperflux";
import { EngineState } from "@etherealengine/engine/src/ecs/classes/EngineState";

import { TextComponent } from "./components/TextComponent";
import { TextComponentEditor } from "./editors/TextComponentEditor";

import { PongComponent } from "./components/PongComponent";
import { PongComponentEditor } from "./editors/PongComponentEditor";

import { PongSystem } from "./systems/PongSystem";

console.log("pong world injection - this line must be here",PongSystem)

export default async function worldInjection() {
  if (isClient) {
    EntityNodeEditor.set(PongComponent, PongComponentEditor)
    ComponentShelfCategories.Misc.push(PongComponent)
    if (getState(EngineState).isEditing) {
      EntityNodeEditor.set(TextComponent, TextComponentEditor)
      ComponentShelfCategories.Misc.push(TextComponent)
    }
  }
}
