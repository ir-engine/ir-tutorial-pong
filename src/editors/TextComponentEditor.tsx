import React from 'react'

import InputGroup from '@etherealengine/editor/src/components/inputs/InputGroup'
import NodeEditor from '@etherealengine/editor/src/components/properties/NodeEditor'
import { EditorComponentType } from '@etherealengine/editor/src/components/properties/Util'
import { useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import AlbumIcon from '@mui/icons-material/Album'

import StringInput from '@etherealengine/editor/src/components/inputs/StringInput'
import { TextComponent } from '../components/TextComponent'

export const TextComponentEditor: EditorComponentType = (props) => {
  const text = useComponent(props.entity, TextComponent)

  return (
    <NodeEditor description={'Text3D'} {...props}>
      <InputGroup name="Text" label="Text">
        <StringInput
          value={text.text.value}
          onChange={(e) => {
            text.text.set(e?.target.value ?? '')
          }}
          placeholder="Hello"
        />
      </InputGroup>
    </NodeEditor>
  )
}
TextComponent.iconComponent = AlbumIcon
