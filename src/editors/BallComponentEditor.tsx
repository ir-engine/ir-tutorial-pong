import React from 'react'
import NodeEditor from '@etherealengine/editor/src/components/properties/NodeEditor'
import { EditorComponentType } from '@etherealengine/editor/src/components/properties/Util'
import { useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import FlakyIcon from '@mui/icons-material/Flaky'
import { BallComponent } from '../components/BallComponent'
export const BallComponentEditor: EditorComponentType = (props) => {
  const pong = useComponent(props.entity, BallComponent)
  return (
    <NodeEditor description={'Pong Ball'} {...props}>
    </NodeEditor>
  )
}
BallComponent.iconComponent = FlakyIcon
