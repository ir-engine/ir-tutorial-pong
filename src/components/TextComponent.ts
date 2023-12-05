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

import { Euler, Mesh, MeshLambertMaterial } from 'three'
import { Geometry } from '@etherealengine/engine/src/assets/constants/Geometry'
import { defineComponent, useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { useEntityContext } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'
import { addObjectToGroup, removeObjectFromGroup } from '@etherealengine/engine/src/scene/components/GroupComponent'
import { ObjectLayers } from '@etherealengine/engine/src/scene/constants/ObjectLayers'
import { setObjectLayers } from '@etherealengine/engine/src/scene/functions/setObjectLayers'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { useEffect } from 'react'


import { FontLoader } from '@etherealengine/engine/src/assets/font/FontLoader'

/**
 * Text = 3D Text
 *
 * parameters = {
 *  font: <THREE.Font>, // font
 *
 *  size: <float>, // size of the text
 *  height: <float>, // thickness to extrude text
 *  curveSegments: <int>, // number of points on the curves
 *
 *  bevelEnabled: <bool>, // turn on bevel
 *  bevelThickness: <float>, // how deep into text bevel goes
 *  bevelSize: <float>, // how far from text outline (including bevelOffset) is bevel
 *  bevelOffset: <float> // how far from text outline does bevel start
 * }
 */

import {
	ExtrudeGeometry
} from 'three';

class TextGeometry extends ExtrudeGeometry {

  type = 'TextGeometry'

	constructor( text, parameters : any ) {

		const font = parameters.font;

		if ( font === undefined ) {

			super(); // generate default extrude geometry

		} else {

			const shapes = font.generateShapes( text, parameters.size );

			// translate parameters to ExtrudeGeometry API

			parameters.depth = parameters.height !== undefined ? parameters.height : 50;

			// defaults

			if ( parameters.bevelThickness === undefined ) parameters.bevelThickness = 10;
			if ( parameters.bevelSize === undefined ) parameters.bevelSize = 8;
			if ( parameters.bevelEnabled === undefined ) parameters.bevelEnabled = false;

			super( shapes, parameters );

		}

		this.type = 'TextGeometry';

	}

}

/*

import {
	FileLoader,
	Loader,
	ShapePath
} from 'three';

class FontLoader extends Loader {

	constructor() {

		super();

	}

	load( url, onLoad ) {

		const scope = this;

		const loader = new FileLoader( this.manager );
		loader.setPath( this.path );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );
		loader.load( url, function ( text : string ) {

			const font = scope.parse( JSON.parse( text ) );

			if ( onLoad ) onLoad( font );

		});

	}

	parse( json ) {

		return new Font( json );

	}

}


function createPaths( text, size, data ) {

	const chars = Array.from( text );
	const scale = size / data.resolution;
	const line_height = ( data.boundingBox.yMax - data.boundingBox.yMin + data.underlineThickness ) * scale;

	let paths : Array<any> = [];

	let offsetX = 0, offsetY = 0;

	for ( let i = 0; i < chars.length; i ++ ) {

		const char = chars[ i ];

		if ( char === '\n' ) {

			offsetX = 0;
			offsetY -= line_height;

		} else {

			const ret : any = createPath( char, scale, offsetX, offsetY, data );
      offsetX += ret.offsetX;
      paths.push( ret.path );

		}

	}

	return paths;

}

function createPath( char, scale, offsetX, offsetY, data ) {

	const glyph = data.glyphs[ char ] || data.glyphs[ '?' ];

	if ( ! glyph ) {

		console.error( 'THREE.Font: character "' + char + '" does not exists in font family ' + data.familyName + '.' );

		return;

	}

	const path = new ShapePath();

	let x, y, cpx, cpy, cpx1, cpy1, cpx2, cpy2;

	if ( glyph.o ) {

		const outline = glyph._cachedOutline || ( glyph._cachedOutline = glyph.o.split( ' ' ) );

		for ( let i = 0, l = outline.length; i < l; ) {

			const action = outline[ i ++ ];

			switch ( action ) {

				case 'm': // moveTo

					x = outline[ i ++ ] * scale + offsetX;
					y = outline[ i ++ ] * scale + offsetY;

					path.moveTo( x, y );

					break;

				case 'l': // lineTo

					x = outline[ i ++ ] * scale + offsetX;
					y = outline[ i ++ ] * scale + offsetY;

					path.lineTo( x, y );

					break;

				case 'q': // quadraticCurveTo

					cpx = outline[ i ++ ] * scale + offsetX;
					cpy = outline[ i ++ ] * scale + offsetY;
					cpx1 = outline[ i ++ ] * scale + offsetX;
					cpy1 = outline[ i ++ ] * scale + offsetY;

					path.quadraticCurveTo( cpx1, cpy1, cpx, cpy );

					break;

				case 'b': // bezierCurveTo

					cpx = outline[ i ++ ] * scale + offsetX;
					cpy = outline[ i ++ ] * scale + offsetY;
					cpx1 = outline[ i ++ ] * scale + offsetX;
					cpy1 = outline[ i ++ ] * scale + offsetY;
					cpx2 = outline[ i ++ ] * scale + offsetX;
					cpy2 = outline[ i ++ ] * scale + offsetY;

					path.bezierCurveTo( cpx1, cpy1, cpx2, cpy2, cpx, cpy );

					break;

			}

		}

	}

	return { offsetX: glyph.ha * scale, path: path };

}


//

class Font {

	constructor( data ) {

    let thus : any = this

		thus.isFont = true;

		thus.type = 'Font';

		thus.data = data;

	}

	generateShapes( text, size = 100 ) {

		const shapes : Array<any> = [];
    let thus : any = this
		const paths = createPaths( text, size, thus.data );

		for ( let p = 0, pl = paths.length; p < pl; p ++ ) {

      let items = paths[p].toShapes()

			shapes.push( ...items );

		}

		return shapes;

	}

}

*/


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
  const transform = useComponent(entity, TransformComponent)

  const material = new MeshLambertMaterial()

  const helper = (text = 'hello') => {
    const loader = new FontLoader()
    let url = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_regular.typeface.json'
    loader.load(url, function (font) {
      if (textComponent.geometry.value) {
        textComponent.geometry.value.dispose()
      }
      if (textComponent.mesh && textComponent.mesh.value && textComponent.mesh.value.geometry) {
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
    })
  }

  useEffect(() => {
    helper(textComponent.text.value)
    return () => {
      if (!textComponent.mesh.value) return
      removeObjectFromGroup(entity, textComponent.mesh.value)
    }
  }, [])

  // sync geometry with transform
  useEffect(() => {
    if (!textComponent.mesh.value) return
    textComponent.mesh.position.value.copy(transform.position.value)
    textComponent.mesh.rotation.value.copy(new Euler().setFromQuaternion(transform.rotation.value))
    textComponent.mesh.scale.value.copy(transform.scale.value)
  }, [textComponent.geometry])

  // if text changes
  useEffect(() => {
    helper(textComponent.text.value)
    if (!textComponent.mesh.value) return
    textComponent.mesh.position.value.copy(transform.position.value)
    textComponent.mesh.rotation.value.copy(new Euler().setFromQuaternion(transform.rotation.value))
    textComponent.mesh.scale.value.copy(transform.scale.value)
  }, [textComponent.text])

  return null
}
