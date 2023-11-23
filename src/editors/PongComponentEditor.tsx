import React from 'react'

import InputGroup from '@etherealengine/editor/src/components/inputs/InputGroup'
import NodeEditor from '@etherealengine/editor/src/components/properties/NodeEditor'
import { EditorComponentType, commitProperty } from '@etherealengine/editor/src/components/properties/Util'
import { getComponent, useComponent, useQuery } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import RocketIcon from '@mui/icons-material/Rocket'

import SelectInput from '@etherealengine/editor/src/components/inputs/SelectInput'
import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { ColliderComponent } from '@etherealengine/engine/src/scene/components/ColliderComponent'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'

import { PongComponent } from '../components/PongComponent'
import { TextComponent } from '../components/TextComponent'

export const PongComponentEditor: EditorComponentType = (props) => {
  const pong = useComponent(props.entity, PongComponent)
  return (
    <NodeEditor description={'Pong Game'} {...props}>
    </NodeEditor>
  )
}
PongComponent.iconComponent = RocketIcon
