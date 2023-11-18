import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import {
  defineQuery,
  getComponent,
  getMutableComponent
} from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { CollisionComponent } from '@etherealengine/engine/src/physics/components/CollisionComponent'
import { RigidBodyComponent } from '@etherealengine/engine/src/physics/components/RigidBodyComponent'
import { UUIDComponent } from '@etherealengine/engine/src/scene/components/UUIDComponent'
import { TransformComponent } from '@etherealengine/engine/src/transform/components/TransformComponent'
import { Quaternion, Vector3 } from 'three'
import { PongComponent } from '../components/PongComponent'
import { TextComponent } from '../components/TextComponent'

import { PhysicsSystem } from '@etherealengine/engine/src/physics/systems/PhysicsSystem'

//
// helper to rotate a tilter effect to drop ball somewhat randomly
//

const rotate_tilter = (tilter: Entity) => {
  const rotate1 = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 32)
  const rotate2 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 32)
  const rotate3 = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 32)
  const tiltTransform = getComponent(tilter, TransformComponent)
  tiltTransform?.rotation.multiply(rotate1)
  tiltTransform?.rotation.multiply(rotate2)
  tiltTransform?.rotation.multiply(rotate3)
}

//
// helper to move paddle
//

const move_paddle = (player: Entity, paddle: Entity) => {
  if (!player) {
    // move via a robot
    return
  }

  /*
  // search for the hand by brute force - not useful approach
  const hands :Array<TransformComponentType> = []
  for (const entity of handQuery()) {
    const name = getComponent(entity,NameComponent)
    if(!name) continue
    const transform = getComponent(entity,TransformComponent)
    if(!transform) continue
    hands.push(transform)
  }
  */

  /*
  // this is one way to get an input - maybe use later
  const preferredInputSource = XRState.getPreferredInputSource()
  if (preferredInputSource) {
    const xrFrame = getState(XRState).xrFrame
    const pose = xrFrame!.getPose(
      preferredInputSource.gripSpace ?? preferredInputSource.targetRaySpace,
      ReferenceSpace.origin!
    )
    if (pose) {
      // i could apply this
      //paddle1.targetKinematicPosition.copy(pose.transform.position as any as Vector3)
      //paddle1.targetKinematicRotation.copy(pose.transform.orientation as any as Quaternion)
    }
  }
  */

  // find avatar from engine - not useful
  //const rig = getOptionalComponent(Engine.instance.localClientEntity, AvatarRigComponent)
  //if (rig) {
  //const handPose = rig.rig.rightHand.node
  //handPose.getWorldPosition(body.targetKinematicPosition)
  //handPose.getWorldQuaternion(body.targetKinematicRotation)
  //return
  //}
  // paddle1.position.set(0, -1000, 0)
  // paddle1.targetKinematicPosition.copy(body.position)
  // paddle1.body.setTranslation(body.position, true)

  // use the whole player body for now
  const transformPlayer = getComponent(player, TransformComponent)
  const transformPaddle = getMutableComponent(paddle, TransformComponent)

  // @todo - we must compute frame of reference
  // - transform player into pong frame of reference @todo
  // - place paddle forward of player by some amount; facing the center

  const xyz = new Vector3(
    transformPlayer.position.x,
    transformPlayer.position.y + 1.0,
    transformPlayer.position.z > 0 ? transformPlayer.position.z - 4.0 : transformPlayer.position.z + 4.0
  )

  //transformPaddle.position.set(xyz)
  const rigid = getComponent(paddle, RigidBodyComponent)
  if (rigid) {
    rigid.targetKinematicPosition.copy(xyz)
    rigid.body.setTranslation(xyz, true)
  }
}

//
// helper - if a ball hits a goal then count scores and reset the ball
//

const resolve_goals = (ball: Entity, wall: Entity, score: any, counter: any) => {
  const collidants = getComponent(wall, CollisionComponent)
  if (!collidants || !collidants.size) return
  for (let [key, value] of collidants) {
    if (key != ball) continue
    counter.set(counter.value + 1)
    score.text.set(`${counter.value}`)
    const transform = getComponent(ball, TransformComponent)
    transform?.position.set(0, 10, 0)
    return
  }
}

//
// resolve one game instance
//

const play = (pongEntity: Entity) => {
  // find parts per game
  // @todo these could be pulled in magically by name also

  const pong = getComponent(pongEntity, PongComponent)
  const pongMutable = getMutableComponent(pongEntity, PongComponent)
  const ball = UUIDComponent.entitiesByUUID[pong.ball]
  const paddle1 = UUIDComponent.entitiesByUUID[pong.paddle1]
  const paddle2 = UUIDComponent.entitiesByUUID[pong.paddle2]
  const wall1 = UUIDComponent.entitiesByUUID[pong.wall1]
  const wall2 = UUIDComponent.entitiesByUUID[pong.wall2]
  const score1 = UUIDComponent.entitiesByUUID[pong.score1]
  const score2 = UUIDComponent.entitiesByUUID[pong.score2]
  const plate1 = UUIDComponent.entitiesByUUID[pong.plate1]
  const plate2 = UUIDComponent.entitiesByUUID[pong.plate2]
  const tilter = UUIDComponent.entitiesByUUID[pong.tilter]

  // expect at least these parts to be present
  if (!ball || !paddle1 || !paddle2 || !wall1 || !wall2 || !score1 || !score2 || !plate1 || !plate2 || !tilter) {
    console.warn('pong: game is not wired up')
    return
  }

  // sanity check
  let score1text = getMutableComponent(score1, TextComponent)
  let score2text = getMutableComponent(score2, TextComponent)
  if (!score1text || !score2text) {
    console.warn('pong: game score text components are not wired up')
    return
  }

  // see if there are players on the plates
  // @todo this could be improved; will mess up if > 2 players
  const c1 = getComponent(plate1, CollisionComponent)
  const c2 = getComponent(plate2, CollisionComponent)
  const player1 = c1 && c1.size ? c1.entries().next().value[0] : (0 as Entity)
  const player2 = c2 && c2.size ? c2.entries().next().value[0] : (0 as Entity)

  const participants = player1 || player2

  let winner = pong.collisions1 > 10 || pong.collisions2 > 10 ? true : false

  //////////////////////////////////////////////////////////////////////////
  //
  // reason about game state
  //
  //

  switch (pong.mode) {
    case 0:
      // allow a new session to start once players show up; don't reset display till then
      if (participants) {
        console.log('pong: starting game')
        pongMutable.mode.set(1)
        pongMutable.collisions1.set(0)
        pongMutable.collisions2.set(0)
        score1text.text.set(`${pong.collisions1}`)
        score2text.text.set(`${pong.collisions2}`)
        winner = false
      }
      break
    case 1:
      // a play session is ongoing - latch back to allow a new game once players leave
      if (!participants) {
        pongMutable.mode.set(0)
      }
      break
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  // update physics
  //

  // rotate the ball drop randomizer always
  // @todo unsure if this whole idea is any good
  rotate_tilter(tilter)

  // don't run other stuff if no game is up
  if (!participants || winner) {
    // @todo rather than thrashing physics I'd set the collider to static
    const transform = getComponent(ball, TransformComponent)
    transform?.position.set(0, 10, 0)
    //pongMutable.playmode.set(0) // it is not critical to set this in this case
    //const collider = getMutableComponent(ball,ColliderComponent)
    //collider.bodyType.set(RigidBodyKinematicPositionBasedTagComponent)
    return
  }

  move_paddle(player1, paddle1)
  move_paddle(player2, paddle2)

  resolve_goals(ball, wall1, score1text, pongMutable.collisions1)
  resolve_goals(ball, wall2, score2text, pongMutable.collisions2)

  return null
}

const pongQuery = defineQuery([PongComponent])

export const PongSystem = defineSystem({
  uuid: 'PongSystem',
  execute: () => {
    for (const pongEntity of pongQuery()) {
      play(pongEntity)
    }
  },
  insert: { after: PhysicsSystem }
})

/*

todo nov 17

valuable to improve

- use player mocap if avail; or use xrstate
- rotate frame of reference for player to allow for arbitrary pong table location
- merge in collision pf
- must use rigid body positioner or else physics blow up
- ball can get out
- paddle size is off
- move paddle forward of player more

minor

- perhaps time out exit from game rather than strictly stopping game on exit
- perhaps some win effect
- optionally a robot
- optionally capture the player camera
- optionally improve scoreboard art to be not arabic numerals but rather just dots
- improve the spinner to be more fair
- it is hard to see the game state from a first person view

future

- different shaped volumes
- multiball
- obstacles
- gravity, attractors, fans etc
- larger smaller paddles

*/
