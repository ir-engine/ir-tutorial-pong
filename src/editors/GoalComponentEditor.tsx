import React from 'react'
import NodeEditor from '@etherealengine/editor/src/components/properties/NodeEditor'
import { EditorComponentType } from '@etherealengine/editor/src/components/properties/Util'
import { useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import AnchorIcon from '@mui/icons-material/Anchor'
import { GoalComponent } from '../components/GoalComponent'
export const GoalComponentEditor: EditorComponentType = (props) => {
  const pong = useComponent(props.entity, GoalComponent)
  return (
    <NodeEditor description={'Pong Goal'} {...props}>
    </NodeEditor>
  )
}
GoalComponent.iconComponent = AnchorIcon
