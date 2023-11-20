import React from 'react'
import NodeEditor from '@etherealengine/editor/src/components/properties/NodeEditor'
import { EditorComponentType } from '@etherealengine/editor/src/components/properties/Util'
import { useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import AlbumIcon from '@mui/icons-material/Album'
import { GoalComponent } from '../components/GoalComponent'
export const GoalComponentEditor: EditorComponentType = (props) => {
  const pong = useComponent(props.entity, GoalComponent)
  return (
    <NodeEditor description={'Description'} {...props}>
    </NodeEditor>
  )
}
GoalComponent.iconComponent = AlbumIcon
