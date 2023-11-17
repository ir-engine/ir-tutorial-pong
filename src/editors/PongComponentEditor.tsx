import React from 'react'

import { EditorComponentType, commitProperty, updateProperty } from '@etherealengine/editor/src/components/properties/Util'
import { getComponent, useComponent, useQuery } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import NodeEditor from '@etherealengine/editor/src/components/properties/NodeEditor'
import InputGroup from '@etherealengine/editor/src/components/inputs/InputGroup'
import { ColorInput } from '@etherealengine/editor/src/components/inputs/ColorInput'
import AlbumIcon from '@mui/icons-material/Album';

import { ColliderComponent } from '@etherealengine/engine/src/scene/components/ColliderComponent'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import SelectInput from '@etherealengine/editor/src/components/inputs/SelectInput'
import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'

import { PongComponent } from '../components/PongComponent'
import { TextComponent } from '../components/TextComponent'

export const PongComponentEditor: EditorComponentType = (props) => {

  const pong = useComponent(props.entity, PongComponent)

  let first = 0 as Entity

  const entities = useQuery([ColliderComponent]).map((entity) => {
    const label = getComponent(entity, NameComponent)
    const value = getComponent(entity, UUIDComponent) as any as Entity
    if(!first) first = value
    return { label, value }
  })

  const scoreboards = useQuery([TextComponent]).map((entity) => {
    const label = getComponent(entity, NameComponent)
    const value = getComponent(entity, UUIDComponent) as any as Entity
    if(!first) first = value
    return { label, value }
  })

  // @todo cleanup

  const set1 = (args) => {
    pong.ball.set(args)
    return commitProperty(PongComponent, 'ball') as any
  }

  const set2 = (args) => {
    pong.paddle1.set(args)
    return commitProperty(PongComponent, 'paddle1') as any
  }

  const set3 = (args) => {
    pong.paddle2.set(args)
    return commitProperty(PongComponent, 'paddle2') as any
  }

  const set4 = (args) => {
    pong.wall1.set(args)
    return commitProperty(PongComponent, 'wall1') as any
  }

  const set5 = (args) => {
    pong.wall2.set(args)
    return commitProperty(PongComponent, 'wall2') as any
  }

  const set6 = (args) => {
    pong.score1.set(args)
    return commitProperty(PongComponent, 'score1') as any
  }

  const set7 = (args) => {
    pong.score2.set(args)
    return commitProperty(PongComponent, 'score2') as any
  }


  return <NodeEditor description={'Description'} {...props}>
      <InputGroup name="Ball">
        <SelectInput
          key="ball"
          options={entities}
          value={pong.ball.value || first}
          onChange={set1}
        />
      </InputGroup>
      <InputGroup name="Paddle1">
        <SelectInput
          key="paddle1"
          options={entities}
          value={pong.paddle1.value || first}
          onChange={set2}
        />
      </InputGroup>
      <InputGroup name="Paddle2">
        <SelectInput
          key="paddle2"
          options={entities}
          value={pong.paddle2.value || first}
          onChange={set3}
        />
      </InputGroup>
      <InputGroup name="Wall1">
        <SelectInput
          key="wall1"
          options={entities}
          value={pong.wall1.value || first}
          onChange={set4}
        />
      </InputGroup>
      <InputGroup name="Wall2">
        <SelectInput
          key="wall2"
          options={entities}
          value={pong.wall2.value || first}
          onChange={set5}
        />
      </InputGroup>
      <InputGroup name="Score1">
        <SelectInput
          key="score1"
          options={scoreboards}
          value={pong.score1.value || first}
          onChange={set6}
        />
      </InputGroup>
      <InputGroup name="Score2">
        <SelectInput
          key="score2"
          options={scoreboards}
          value={pong.score2.value || first}
          onChange={set7}
        />
      </InputGroup>
    </NodeEditor>
}
PongComponent.iconComponent = AlbumIcon

