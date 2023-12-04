import { ComponentShelfCategories } from '@etherealengine/editor/src/components/element/ElementList'
import { EntityNodeEditor } from '@etherealengine/editor/src/functions/ComponentEditors'
import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'

import { TextComponent } from './components/TextComponent'
import { TextComponentEditor } from './editors/TextComponentEditor'

import { BallComponent } from './components/BallComponent'
import { BallComponentEditor } from './editors/BallComponentEditor'

import { PaddleComponent } from './components/PaddleComponent'
import { PaddleComponentEditor } from './editors/PaddleComponentEditor'

import { PlateComponent } from './components/PlateComponent'
import { PlateComponentEditor } from './editors/PlateComponentEditor'

import { GoalComponent } from './components/GoalComponent'
import { GoalComponentEditor } from './editors/GoalComponentEditor'

import { PongComponent } from './components/PongComponent'
import { PongComponentEditor } from './editors/PongComponentEditor'

import './systems/PongSystem'
import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'
import { getState } from '@etherealengine/hyperflux'

export default async function worldInjection() {
  console.log("*** pong world injection built at Fri Nov 30 01:06 am")
  if (isClient && getState(EngineState).isEditing) {
    EntityNodeEditor.set(TextComponent, TextComponentEditor)
    ComponentShelfCategories.Misc.push(TextComponent)
    EntityNodeEditor.set(BallComponent, BallComponentEditor)
    ComponentShelfCategories.Misc.push(BallComponent)
    EntityNodeEditor.set(PaddleComponent, PaddleComponentEditor)
    ComponentShelfCategories.Misc.push(PaddleComponent)
    EntityNodeEditor.set(PlateComponent, PlateComponentEditor)
    ComponentShelfCategories.Misc.push(PlateComponent)
    EntityNodeEditor.set(GoalComponent, GoalComponentEditor)
    ComponentShelfCategories.Misc.push(GoalComponent)
    EntityNodeEditor.set(PongComponent, PongComponentEditor)
    ComponentShelfCategories.Misc.push(PongComponent)
  }
}
