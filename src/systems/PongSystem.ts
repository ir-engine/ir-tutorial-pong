import { defineQuery, getComponent, getMutableComponent, getOptionalComponent, removeComponent, updateComponent, useOptionalComponent } from "@etherealengine/engine/src/ecs/functions/ComponentFunctions";
import { defineSystem } from "@etherealengine/engine/src/ecs/functions/SystemFunctions";
import { PongComponent } from "../components/PongComponent";
import { LocalTransformComponent, TransformComponent, TransformComponentType } from "@etherealengine/engine/src/transform/components/TransformComponent";
import { NO_PROXY, getState } from "@etherealengine/hyperflux";
import { EngineState } from "@etherealengine/engine/src/ecs/classes/EngineState";
import { Vector3 } from "three";
import { CollisionComponent } from "@etherealengine/engine/src/physics/components/CollisionComponent";
import { UUIDComponent } from "@etherealengine/engine/src/scene/components/UUIDComponent";
import { Entity } from "@etherealengine/engine/src/ecs/classes/Entity";
import { TextComponent } from "../components/TextComponent";
import { AvatarIKTargetComponent } from "@etherealengine/engine/src/avatar/components/AvatarIKComponents";
import { NameComponent } from "@etherealengine/engine/src/scene/components/NameComponent";
import { ColliderComponent } from "@etherealengine/engine/src/scene/components/ColliderComponent";
import { RigidBodyComponent, RigidBodyKinematicPositionBasedTagComponent } from "@etherealengine/engine/src/physics/components/RigidBodyComponent";
import { CollisionEvents } from "@etherealengine/engine/src/physics/types/PhysicsTypes";

import { ReferenceSpace, XRState } from '@etherealengine/engine/src/xr/XRState'
import { Engine } from "@etherealengine/engine/src/ecs/classes/Engine";
import { AvatarRigComponent } from "@etherealengine/engine/src/avatar/components/AvatarAnimationComponent";

const pongQuery = defineQuery([PongComponent])
const handQuery = defineQuery([AvatarIKTargetComponent])

export const PongSystem = defineSystem({
  uuid: "PongSystem",
  execute: () => {

    //
    // resolve one game instance
    //

    const play = (pongEntity) => {

      const pong = getComponent(pongEntity,PongComponent)
      const pongMutable = getMutableComponent(pongEntity,PongComponent)
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
      let player1 = 0 as Entity
      let player2 = 0 as Entity

      if(!ball || !paddle1 || !paddle2 || !wall1 || !wall2 || !score1 || !score2 || !plate1 || !plate2 || !tilter) {
        console.warn("pong: game is not wired up")
        return
      }
      let score1text = getMutableComponent(score1,TextComponent)
      let score2text = getMutableComponent(score2,TextComponent)
      if(!score1text || !score2text) {
        console.warn("pong: game score text components are not wired up")
        return
      }

      const c1 = getComponent(plate1,CollisionComponent)
      const c2 = getComponent(plate2,CollisionComponent)
      const participants = (c1 && c1.size) || (c2 && c2.size) ? true : false
      let winner = pong.collisions1 > 10 || pong.collisions2 > 10 ? true : false

      //////////////////////////////////////////////////////////////////////////
      //
      // reason about game state
      //
      //

      switch( pong.mode ) {
        case 0:
          // allow a new session to start once players show up; don't reset display till then
          if(participants) {
            pongMutable.mode.set(1)
            pongMutable.collisions1.set( 0 )
            pongMutable.collisions2.set( 0 )
            score1text.text.set(`${pong.collisions1}`)
            score1text.text.set(`${pong.collisions2}`)
            winner = false
          }
          break
        case 1:
          // a play session is ongoing - latch back to allow a new game once players leave
          if(!participants) {
            pongMutable.mode.set(0)
          }
          break
      }

      ///////////////////////////////////////////////////////////////////////////
      //
      // update physics
      //

      if(!participants || winner) {
        // @todo rather than thrashing physics I'd set the collider to static
        const transform = getComponent(ball,TransformComponent)
        transform?.position.set(0,10,0)
        //pongMutable.playmode.set(0) // it is not critical to set this in this case
        //const collider = getMutableComponent(ball,ColliderComponent)
        //collider.bodyType.set(RigidBodyKinematicPositionBasedTagComponent)
        return
      }

      ///////////////////////////////////////////////////////////////////////////
      // move puck1
      if(c1 && c1.size > 0) {
        const player1 = c1.entries().next().value[0]

        /*
        // unsure about this
        // this is one way to get an input
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

        // this is another way - just peek at the avatar...
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

        // this is another way, just use the player body for now

        const transformPlayer = getComponent(player1,TransformComponent)
        const transformPaddle = getMutableComponent(paddle1,TransformComponent)

        const xyz = new Vector3(
          transformPlayer.position.x,
          transformPlayer.position.y + 1.0,
          transformPaddle.position.z.value
        )

        transformPaddle.position.set(xyz)
        const rigid = getComponent(paddle1, RigidBodyComponent)
        if (rigid) {
          rigid.targetKinematicPosition.copy(xyz)
          rigid.body.setTranslation(xyz, true)
        } else {
        }

        /*

        paddle needs some of this?

    const gripBodyDesc = RigidBodyDesc.kinematicPositionBased()
    gripColliderDesc.setCollisionGroups(0)
    const physicsWorld = getState(PhysicsState).physicsWorld
    const gripBody = Physics.createRigidBody(gripBodyEntity, physicsWorld, gripBodyDesc, [gripColliderDesc])
    const gripBodyComponent = getComponent(gripBodyEntity, RigidBodyComponent)
    gripBodyComponent.targetKinematicLerpMultiplier = 40

        */


        /*
        // search for the hand by brute force
        const hands :Array<TransformComponentType> = []
        for (const entity of handQuery()) {
          const name = getComponent(entity,NameComponent)
          if(!name) continue
          const transform = getComponent(entity,TransformComponent)
          if(!transform) continue
          hands.push(transform)
        }
        */

      } else {
        // - move puck robotically
      }

      ///////////////////////////////////////////////////////////////////////////
      // move puck2
      if(c2 && c2.size > 0) {
        const entity = c2.entries().next().value[0]
      } else {
        // - move puck robotically
      }

      // re-drop the ball?
      let drop = false

      // if hit an active wall then mark collision and reset ball
      // @todo check for enter specifically, and perhaps make sure it is the ball!
      if(getComponent(wall1,CollisionComponent)) {
        removeComponent(wall1, CollisionComponent)
        pongMutable.collisions1.set( pong.collisions1 + 1 )
        score1text.text.set(`${pong.collisions1}`)
        drop = true
      }

      // if hit an active wall then mark collision and reset ball
      // @todo check for enter specifically, and perhaps make sure it is the ball!
      if(getComponent(wall2,CollisionComponent)) {
        removeComponent(wall2, CollisionComponent)
        pongMutable.collisions2.set( pong.collisions2 + 1 )
        score1text.text.set(`${pong.collisions2}`)
        drop = true
      }

      // reset the puck?
      if(drop) {
        const transform = getComponent(ball,TransformComponent)
        transform?.position.set(0,10,0)
      }
    }

    //
    // resolve all game instances
    //

    for (const pongEntity of pongQuery()) {
      play(pongEntity)
    }
  }
})

/*

other ideas

- different shaped volumes
- multiball
- obstacles
- gravity, attractors, fans etc
- larger smaller paddles

*/