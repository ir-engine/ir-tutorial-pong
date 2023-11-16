import React from 'react'

import { EditorComponentType, commitProperty, updateProperty } from '@etherealengine/editor/src/components/properties/Util'
import { getComponent, useComponent, useQuery } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import NodeEditor from '@etherealengine/editor/src/components/properties/NodeEditor'
import InputGroup from '@etherealengine/editor/src/components/inputs/InputGroup'
import { ColorInput } from '@etherealengine/editor/src/components/inputs/ColorInput'
import AlbumIcon from '@mui/icons-material/Album';
import NumericInput from '@etherealengine/editor/src/components/inputs/NumericInput'
import Vector3Input from '@etherealengine/editor/src/components/inputs/Vector3Input'

import { TextComponent } from '../components/TextComponent'
import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import StringInput from '@etherealengine/editor/src/components/inputs/StringInput'

export const TextComponentEditor: EditorComponentType = (props) => {

  const text = useComponent(props.entity, TextComponent)

  return <NodeEditor description={'Description'} {...props}>
      <InputGroup name="Text" label="Text">
        <StringInput
          value={text.text.value}
          onChange={ (e) => { text.text.set(e?.target.value ?? '') }}
          placeholder='Hello'
        />
      </InputGroup>
    </NodeEditor>
}
TextComponent.iconComponent = AlbumIcon
