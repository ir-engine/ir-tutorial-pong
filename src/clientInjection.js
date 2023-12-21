import { TextComponent } from './components/ScoreComponent'
import { BallComponent } from './components/BallComponent'
import { PaddleComponent } from './components/PaddleComponent'
import { PlateComponent } from './components/PlateComponent'
import { GoalComponent } from './components/GoalComponent'
import { PongComponent } from './components/PongComponent'

import { ComponentShelfCategories } from '@etherealengine/editor/src/components/element/ElementList'

import { EntityNodeEditor } from '@etherealengine/editor/src/functions/ComponentEditors'
import { TextComponentEditor } from './editors/TextComponentEditor'
import { BallComponentEditor } from './editors/BallComponentEditor'
import { PaddleComponentEditor } from './editors/PaddleComponentEditor'
import { PlateComponentEditor } from './editors/PlateComponentEditor'
import { GoalComponentEditor } from './editors/GoalComponentEditor'
import { PongComponentEditor } from './editors/PongComponentEditor'

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
