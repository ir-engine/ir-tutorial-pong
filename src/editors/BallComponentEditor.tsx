import React from 'react'
import NodeEditor from '@etherealengine/editor/src/components/properties/NodeEditor'
import { EditorComponentType } from '@etherealengine/editor/src/components/properties/Util'
import { useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import AlbumIcon from '@mui/icons-material/Album'
import { BallComponent } from '../components/BallComponent'
export const BallComponentEditor: EditorComponentType = (props) => {
  const pong = useComponent(props.entity, BallComponent)
  return (
    <NodeEditor description={'Description'} {...props}>
    </NodeEditor>
  )
}
BallComponent.iconComponent = AlbumIcon
