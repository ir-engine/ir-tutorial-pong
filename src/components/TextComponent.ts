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

import { useEffect } from 'react'
import { useState } from '@etherealengine/hyperflux'

import { defineComponent, useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { useEntityContext } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'
import { addObjectToGroup, removeObjectFromGroup } from '@etherealengine/engine/src/scene/components/GroupComponent'
import { ObjectLayers } from '@etherealengine/engine/src/scene/constants/ObjectLayers'
import { setObjectLayers } from '@etherealengine/engine/src/scene/functions/setObjectLayers'

import { Mesh, MeshLambertMaterial, ExtrudeGeometry } from 'three'
import { Font, FontLoader } from '@etherealengine/engine/src/assets/font/FontLoader'
import { Geometry } from '@etherealengine/engine/src/assets/constants/Geometry'

// @todo remove this completely in favor of one from threejs extensions once vite added
class TextGeometry extends ExtrudeGeometry {
  type = 'TextGeometry'
	constructor( text, parameters : any ) {
		const font = parameters.font;
		if ( font === undefined ) {
			super(); // generate default extrude geometry
		} else {
			const shapes = font.generateShapes( text, parameters.size );
			parameters.depth = parameters.height !== undefined ? parameters.height : 50;
			if ( parameters.bevelThickness === undefined ) parameters.bevelThickness = 10;
			if ( parameters.bevelSize === undefined ) parameters.bevelSize = 8;
			if ( parameters.bevelEnabled === undefined ) parameters.bevelEnabled = false;
			super( shapes, parameters );
		}
		this.type = 'TextGeometry';
	}
}

// @todo move this out of pong into ethereal engine as a whole as a aresource
export const TextComponent = defineComponent({
  name: 'TextComponent',
  jsonID: 'text-geometry',

  onInit: (entity) => {
    return {
      text: '',
      geometry: null! as Geometry,
      mesh: null! as Mesh
    }
  },

  toJSON: (entity, component) => {
    return {
      text: component.text.value
    }
  },

  onSet: (entity, component, json) => {
    if (!json) return
    if (json.text) component.text.set(json.text)
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
	const fontState = useState(null! as Font)

	useEffect(() => {
		const loader = new FontLoader()
    let url = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_regular.typeface.json'
    loader.load(url, function (font:Font) {
			fontState.set(font)
    })
	},[])

  useEffect(() => {
		if (!fontState.value) return
		const text = textComponent.text.value
		if(!text || !text.length) return
		const geometry = new TextGeometry(text, {
			font: fontState.value,
			size: 80,
			height: 5,
			curveSegments: 12,
			bevelEnabled: true,
			bevelThickness: 10,
			bevelSize: 8,
			bevelOffset: 0,
			bevelSegments: 5
		})
		const material = new MeshLambertMaterial()
		
		const mesh = new Mesh(geometry, material)
		mesh.name = `${entity}-text-geometry`
		mesh.visible = true
		mesh.updateMatrixWorld(true)
		textComponent.mesh.set(mesh)
		textComponent.geometry.set(geometry)
		setObjectLayers(mesh, ObjectLayers.Scene)
		addObjectToGroup(entity, mesh)

		return () => {
			material.dispose()
			geometry.dispose()
      removeObjectFromGroup(entity, mesh)
    }

  }, [textComponent.text, fontState])

  return null
}
