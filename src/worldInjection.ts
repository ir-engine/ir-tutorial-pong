import { ComponentShelfCategories } from '@etherealengine/editor/src/components/element/ElementList'
import { EntityNodeEditor } from '@etherealengine/editor/src/functions/ComponentEditors'
import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'

import { TextComponent } from './components/TextComponent'
import { TextComponentEditor } from './editors/TextComponentEditor'

import { PongComponent } from './components/PongComponent'
import { PongComponentEditor } from './editors/PongComponentEditor'

import './systems/PongSystem'

export default async function worldInjection() {
  if (isClient) {
    EntityNodeEditor.set(PongComponent, PongComponentEditor)
    ComponentShelfCategories.Misc.push(PongComponent)
    EntityNodeEditor.set(TextComponent, TextComponentEditor)
    ComponentShelfCategories.Misc.push(TextComponent)
  }
}
