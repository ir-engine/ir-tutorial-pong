
import { Quaternion, Vector3 } from 'three'

import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'

import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { NameComponent } from '@etherealengine/engine/src/scene/components/NameComponent'
import { CollisionComponent } from '@etherealengine/engine/src/physics/components/CollisionComponent'
import { RigidBodyComponent } from '@etherealengine/engine/src/physics/components/RigidBodyComponent'
import { EntityTreeComponent } from '@etherealengine/engine/src/ecs/functions/EntityTree'
import { AvatarRigComponent } from '@etherealengine/engine/src/avatar/components/AvatarAnimationComponent'
import { AvatarComponent } from '@etherealengine/engine/src/avatar/components/AvatarComponent'
import { defineQuery, getComponent, getMutableComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'

import { NetworkObjectComponent } from '@etherealengine/engine/src/networking/components/NetworkObjectComponent'
import { WorldNetworkAction } from '@etherealengine/engine/src/networking/functions/WorldNetworkAction'

import { dispatchAction, getState } from '@etherealengine/hyperflux'

import { PongComponent } from './components/PongComponent'
import { GoalComponent } from './components/GoalComponent'
import { TextComponent } from './components/TextComponent'
import { BallComponent } from './components/BallComponent'
import { PlateComponent } from './components/PlateComponent'
import { PaddleComponent } from './components/PaddleComponent'
import { netlog } from './PongLogging'

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// When I associate a player and a goal I also want to let that player operate the paddles on that goal
///
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function setNetworkAuthorityPaddleAvatar(paddle: Entity,avatar : Entity ) {

  const networkPaddle = getComponent(paddle, NetworkObjectComponent)
  if(!networkPaddle) {
    netlog("error paddle has no network")
    return
  }

  const networkAvatar = getComponent(avatar, NetworkObjectComponent)
  if(!networkAvatar) {
    netlog("error avatar has no network")
    return
  }

  if(networkPaddle.authorityPeerID == networkAvatar.authorityPeerID) {
    return
  }

  netlog("paddle bound a new avatar "+getComponent(paddle,NameComponent)+" "+getComponent(avatar,NameComponent))

  if(isClient) {
    // @todo remove this is test code
    netlog("client transfer paddle auth " + Engine.instance.store.peerID)
    dispatchAction(
      WorldNetworkAction.requestAuthorityOverObject({
        ownerId: networkPaddle.ownerId,
        networkId: networkPaddle.networkId,
        newAuthority: Engine.instance.store.peerID
      })
    )
  } else {
    netlog("server transfer paddle auth " + networkAvatar.authorityPeerID)
    dispatchAction(
      WorldNetworkAction.transferAuthorityOfObject({
        ownerId: networkPaddle.ownerId,
        networkId: networkPaddle.networkId,
        newAuthority: networkAvatar.authorityPeerID
      })
    )
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// goals have a paddle1, paddle2, text, a plate - they are organized as children of the goal at startup
///
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function goalBindParts(goal:Entity) {
  const goalMutable = getMutableComponent(goal,GoalComponent)
  if(goalMutable.paddle1.value && goalMutable.paddle2.value && goalMutable.text.value && goalMutable.plate.value) {
    return
  }
  const node = getComponent(goal,EntityTreeComponent)
  if(!node || !node.children || !node.children.length) {
    netlog("goal has no entity tree children error")
    return
  }
  node.children.forEach( child => {
    if(!goalMutable.paddle1.value && getComponent(child,PaddleComponent) && !goalMutable.paddle1.value && child != goalMutable.paddle2.value) {
      goalMutable.paddle1.set(child)
      netlog("goal added a paddle1, goal="+getComponent(goal,NameComponent)+" paddle="+getComponent(child,NameComponent))
      return
    }
    if(!goalMutable.paddle2.value && getComponent(child,PaddleComponent) && !goalMutable.paddle2.value && child != goalMutable.paddle1.value) {
      goalMutable.paddle2.set(child)
      netlog("goal added a paddle2, goal="+getComponent(goal,NameComponent)+" paddle="+getComponent(child,NameComponent))
      return
    }
    if(!goalMutable.text.value && getComponent(child,TextComponent)) {
      goalMutable.text.set(child)
      netlog("goal set text, goal="+getComponent(goal,NameComponent)+" text="+getComponent(child,NameComponent))
      return
    }
    if(!goalMutable.plate.value && getComponent(child,PlateComponent)) {
      goalMutable.plate.set(child)
      netlog("goal set plate, goal="+getComponent(goal,NameComponent)+" plate="+getComponent(child,NameComponent))
      return
    }
  })
}

function pongBindGoalParts(pong:Entity) {
  const pongComponent = getComponent(pong, PongComponent)
  pongComponent.goals.forEach(goal => { goalBindParts(goal) } )
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// pong game has one or more goals that are part of that game - find them at startup
///
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const queryGoals = defineQuery([GoalComponent])

function pongBindGoals(pong:Entity) {
  const pongComponent = getComponent(pong, PongComponent)
  if(pongComponent.goals.length) return

  // the engine disallows children that have physics, it will rewrite the scene - so this error can occur
  const node = getComponent(pong,EntityTreeComponent)
  if(!node || !node.children || !node.children.length) {
    let count = node && node.children ? node.children.length : 0
    //netlog("pong scene is not fully loaded yet")
    return
  }

  // when the scene first starts up these elements should be in the scene defined order; try find them
  let goals : Array<Entity> = []
  node.children.forEach( child => {
    const goalMutable = getMutableComponent(child,GoalComponent)
    if(goalMutable) {
      netlog("pong found a goal name=" + getComponent(child,NameComponent))
      goals.push(child)
    }
  })

  // find associated by a hack - @todo remove hack
  if(!goals.length) {
    goals = queryGoals()
    if(goals.length) {
      netlog("error didn't find goals earlier but direct query returned resultcount="+goals.length)
    }
  }

  // store these when eventually found
  if(goals.length) {
    const pongMutable = getMutableComponent(pong,PongComponent)
    pongMutable.goals.set(goals.slice())
    netlog("pong bound to goals of length="+goals.length)
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// pong game may have some pre-defined balls optionally - find them at startup
///
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const queryBalls = defineQuery([BallComponent])

function pongBindBalls(pong:Entity) {
  const pongComponent = getComponent(pong, PongComponent)
  if(pongComponent.balls.length) return

  // the engine disallows children that have physics, it will rewrite the scene - so this error can occur
  const pongNode = getComponent(pong,EntityTreeComponent)
  if(!pongNode || !pongNode.children || !pongNode.children.length) {
    let count = pongNode && pongNode.children ? pongNode.children.length : 0
    //netlog("pong scene is not fully loaded yet")
    return
  }

  // when the scene first starts up these elements should be in the scene defined order; try find them
  let balls : Array<Entity> = []
  pongNode.children.forEach( child => {
    const ballMutable = getMutableComponent(child,BallComponent)
    if(ballMutable) {
      netlog("pong found a ball name=" + getComponent(child,NameComponent))
      balls.push(child)
    }
  })

  // find associated by a hack - @todo remove hack
  if(!balls.length) {
    balls = queryBalls()
    if(balls.length) {
      netlog("error didn't find balls earlier but direct query returned resultcount="+balls.length)
    }
  }

  // store these when eventually found
  if(balls.length) {
    const pongMutable = getMutableComponent(pong,PongComponent)
    pongMutable.balls.set(balls.slice())
    netlog("pong bound to balls of length="+balls.length)
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// find if any avatars have recently been on any plates
///
/// @todo a trigger callback could be used to reduce the busy polling here
///
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const avatarQuery = defineQuery([AvatarComponent])

function platesBindAvatars(pong:Entity) {
  let numAvatars = 0
  const seconds = getState(EngineState).elapsedSeconds
  const pongComponent = getComponent(pong,PongComponent)
  pongComponent.goals.forEach( goal => {
    const goalMutable = getMutableComponent(goal,GoalComponent)
    const collidants = getComponent(goalMutable.plate.value, CollisionComponent)
    if(collidants && collidants.size) {
      for (let [avatar, collision] of collidants) {
        if(getComponent(avatar,AvatarComponent)) {
          if(goalMutable.avatar.value != avatar) {
            goalMutable.avatar.set(avatar)
            setNetworkAuthorityPaddleAvatar(goalMutable.paddle1.value,avatar)
            setNetworkAuthorityPaddleAvatar(goalMutable.paddle2.value,avatar)
          }
          goalMutable.avatarTimer.set(seconds)
        }
      }
    }
    if(goalMutable.avatarTimer.value > seconds - 5 ) {
      numAvatars++
      goalMutable.avatarTimer.set( goalMutable.avatarTimer.value - 1)
    } else if(goalMutable.avatar.value) {
      goalMutable.avatar.set(0 as Entity)
    }
  })
  return numAvatars
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// attach paddles to player hands if they are on a plate
/// this works only for the local player and is networked
///
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function platesBindAvatarPaddles(pong:Entity) {
  if(!isClient) return
  let numAvatars = 0
  const pongComponent = getComponent(pong,PongComponent)
  pongComponent.goals.forEach( goal => {
    const goalComponent = getComponent(goal,GoalComponent)
    if(!goalComponent || !goalComponent.plate || !goalComponent.paddle1 || !goalComponent.paddle2) return
    if(!Engine.instance.localClientEntity || Engine.instance.localClientEntity != goalComponent.avatar ) return
    const rig = getComponent(goalComponent.avatar, AvatarRigComponent)
    if (!rig) return
    {
      const position1 = new Vector3()
      const rotation1 = new Quaternion()
      const handPose1 = rig?.rawRig?.rightHand?.node
      if(!handPose1) return
      handPose1.getWorldPosition(position1)
      handPose1.getWorldQuaternion(rotation1)
      const rigid1 = getComponent(goalComponent.paddle1,RigidBodyComponent)
      if(!rigid1) return
      rigid1.targetKinematicPosition.copy(position1)
      rigid1.targetKinematicRotation.copy(rotation1)
    }
    {
      const position2 = new Vector3()
      const rotation2 = new Quaternion()
      const handPose2 = rig?.rawRig?.leftHand?.node
      if(!handPose2) return
      handPose2.getWorldPosition(position2)
      handPose2.getWorldQuaternion(rotation2)
      const rigid2 = getComponent(goalComponent.paddle2,RigidBodyComponent)
      if(!rigid2) return
      rigid2.targetKinematicPosition.copy(position2)
      rigid2.targetKinematicRotation.copy(rotation2)
    }
  })
  return numAvatars
}

export function pongWireParts(pong:Entity) {

  pongBindGoals(pong)
  pongBindBalls(pong)
  pongBindGoalParts(pong)
  const numAvatars = platesBindAvatars(pong)
  platesBindAvatarPaddles(pong)

  return numAvatars
}