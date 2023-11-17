
/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import {
  BoxGeometry,
  Euler, Vector3,
  Mesh,
  MeshLambertMaterial,
} from 'three'

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'

import { useEffect } from 'react'
import { defineComponent, useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { Geometry } from '@etherealengine/engine/src/assets/constants/Geometry'
import { useEntityContext } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'
import { NO_PROXY, useState } from '@etherealengine/hyperflux'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { ObjectLayers } from '@etherealengine/engine/src/scene/constants/ObjectLayers'
import { setObjectLayers } from '@etherealengine/engine/src/scene/functions/setObjectLayers'
import { addObjectToGroup, removeObjectFromGroup } from '@etherealengine/engine/src/scene/components/GroupComponent'

export const TextComponent = defineComponent({
  name: 'TextComponent',
  jsonID: 'text-geometry',

  onInit: (entity) => {
    return {
      text: "",
      geometry: null! as Geometry,
      mesh: null! as Mesh,
    }
  },

  toJSON: (entity, component) => {
    return {
      text: component.text.value
    }
  },

  onSet: (entity, component, json) => {
    if (!json) return
    if(json.text) component.text.set(json.text)
  },

  onRemove: (entity, component) => {
    if (component.geometry.value) {
      component.geometry.value.dispose()
    }
  },

  reactor: TextReactor
})

function TextReactor() {

  const entity = useEntityContext()
  const textComponent = useComponent(entity, TextComponent)
  const transform = useComponent(entity, TransformComponent)

  const material = new MeshLambertMaterial()

  const helper = (text = "hello") => {
    const loader = new FontLoader()
    let url = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_regular.typeface.json"
    loader.load(url, function ( font ) {
      if(textComponent.geometry.value) {
        console.log("disposing")
        textComponent.geometry.value.dispose()
      }
      if(textComponent.mesh && textComponent.mesh.value && textComponent.mesh.value.geometry) {
        textComponent.mesh.value.geometry.dispose()
        removeObjectFromGroup(entity, textComponent.mesh.value)
      }
      const geometry = new TextGeometry(text, {
        font: font,
        size: 80,
        height: 5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 10,
        bevelSize: 8,
        bevelOffset: 0,
        bevelSegments: 5
      })
      textComponent.mesh.set(new Mesh(geometry, material))
      textComponent.mesh.value.name = `${entity}-text-geometry`
      textComponent.mesh.value.visible = true
      textComponent.mesh.value.updateMatrixWorld(true)
      setObjectLayers(textComponent.mesh.value, ObjectLayers.Scene)
      addObjectToGroup(entity, textComponent.mesh.value)
      textComponent.geometry.set(geometry)
      console.log("created " + text)
    })
  }

  useEffect(() => {
    helper(textComponent.text.value)
    return () => {
      if(!textComponent.mesh.value) return
      removeObjectFromGroup(entity, textComponent.mesh.value)
    }
  },[])

  // sync geometry with transform
  useEffect(() => {
    if(!textComponent.mesh.value) return
    textComponent.mesh.position.value.copy(transform.position.value)
    textComponent.mesh.rotation.value.copy(new Euler().setFromQuaternion(transform.rotation.value))
    textComponent.mesh.scale.value.copy(transform.scale.value)
  }, [textComponent.geometry])

  // if text changes
  useEffect(() => {
    helper(textComponent.text.value)
    if(!textComponent.mesh.value) return
    textComponent.mesh.position.value.copy(transform.position.value)
    textComponent.mesh.rotation.value.copy(new Euler().setFromQuaternion(transform.rotation.value))
    textComponent.mesh.scale.value.copy(transform.scale.value)
  }, [textComponent.text])

  return null
}



