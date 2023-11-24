import React from 'react'
import NodeEditor from '@etherealengine/editor/src/components/properties/NodeEditor'
import { EditorComponentType } from '@etherealengine/editor/src/components/properties/Util'
import { useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import FlakyIcon from '@mui/icons-material/Flaky'
import { PlateComponent } from '../components/PlateComponent'
export const PlateComponentEditor: EditorComponentType = (props) => {
  const pong = useComponent(props.entity, PlateComponent)
  return (
    <NodeEditor description={'Pong Plate'} {...props}>
    </NodeEditor>
  )
}
PlateComponent.iconComponent = FlakyIcon
