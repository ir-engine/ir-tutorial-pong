import React from 'react'
import NodeEditor from '@etherealengine/editor/src/components/properties/NodeEditor'
import { EditorComponentType } from '@etherealengine/editor/src/components/properties/Util'
import { useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import FlakyIcon from '@mui/icons-material/Flaky'
import { PaddleComponent } from '../components/PaddleComponent'
export const PaddleComponentEditor: EditorComponentType = (props) => {
  const pong = useComponent(props.entity, PaddleComponent)
  return (
    <NodeEditor description={'Pong Paddle'} {...props}>
    </NodeEditor>
  )
}
PaddleComponent.iconComponent = FlakyIcon
