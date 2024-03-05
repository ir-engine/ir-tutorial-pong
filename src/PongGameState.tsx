import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import multiLogger from '@etherealengine/common/src/logger'
import { UserID } from '@etherealengine/common/src/schema.type.module'
import { UndefinedEntity, getComponent, matchesEntityUUID } from '@etherealengine/ecs'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { SceneState } from '@etherealengine/engine/src/scene/Scene'
import {
  defineAction,
  defineState,
  dispatchAction,
  getMutableState,
  matches,
  matchesUserId,
  none,
  useHookstate
} from '@etherealengine/hyperflux'
import { NetworkTopics, WorldNetworkAction } from '@etherealengine/network'
import { NameComponent } from '@etherealengine/spatial/src/common/NameComponent'
import { UUIDComponent } from '@etherealengine/network'
import { SpawnObjectActions } from '@etherealengine/spatial/src/transform/SpawnObjectActions'
import { iterateEntityNode } from '@etherealengine/spatial/src/transform/components/EntityTree'
import { TransformComponent } from '@etherealengine/spatial/src/transform/components/TransformComponent'
import React, { useEffect } from 'react'
import { PaddleActions } from './PaddleState'
import './PlateComponent'
import './PongComponent'
import { spawnBall } from './PongPhysicsSystem'

const logger = multiLogger.child({ component: 'PongSystem' })

export class PongActions {
  static startGame = defineAction({
    type: 'ee.pong.START_GAME',
    gameEntityUUID: matchesEntityUUID,
    $topic: NetworkTopics.world
  })

  static endGame = defineAction({
    type: 'ee.pong.END_GAME',
    gameEntityUUID: matchesEntityUUID,
    $topic: NetworkTopics.world
  })

  static playerChange = defineAction({
    type: 'ee.pong.PLAYER_CONNECTED',
    gameEntityUUID: matchesEntityUUID,
    playerIndex: matches.number,
    playerUserID: matchesUserId.optional(),
    $topic: NetworkTopics.world
  })

  static playerScore = defineAction({
    type: 'ee.pong.PLAYER_SCORE',
    gameEntityUUID: matchesEntityUUID,
    playerIndex: matches.number,
    $topic: NetworkTopics.world
  })

  static spawnBall = defineAction({
    ...SpawnObjectActions.spawnObject.actionShape,
    prefab: 'ee.pong.ball',
    gameEntityUUID: matchesEntityUUID,
    $topic: NetworkTopics.world
  })
}

const maxScore = 9

export const PongState = defineState({
  name: 'ee.pong.PongState',
  initial: {} as Record<
    EntityUUID,
    {
      players: Array<{
        score: number
        connected: UserID | null
      }>
      ball: EntityUUID | null
      ballCooldown: number
    }
  >,

  receptors: {
    onStartGame: PongActions.startGame.receive((action) => {
      const state = getMutableState(PongState)
      state[action.gameEntityUUID].set({
        players: [
          {
            score: maxScore,
            connected: null
          },
          {
            score: maxScore,
            connected: null
          },
          {
            score: maxScore,
            connected: null
          },
          {
            score: maxScore,
            connected: null
          }
        ],
        ball: null,
        ballCooldown: 3000 // start in three seconds
      })
    }),
    onEndGame: PongActions.endGame.receive((action) => {
      const state = getMutableState(PongState)
      state[action.gameEntityUUID].set(none)
    }),
    onPlayerChange: PongActions.playerChange.receive((action) => {
      const state = getMutableState(PongState)
      state[action.gameEntityUUID].players[action.playerIndex].connected.set(action.playerUserID ?? null)
    }),
    onPlayerScore: PongActions.playerScore.receive((action) => {
      const state = getMutableState(PongState)
      state[action.gameEntityUUID].players[action.playerIndex].score.set((current) => current - 1)
    }),
    onSpawnBall: PongActions.spawnBall.receive((action) => {
      const state = getMutableState(PongState)
      state[action.gameEntityUUID].ball.set(action.entityUUID)
    }),
    onDestroyBall: WorldNetworkAction.destroyEntity.receive((action) => {
      const state = getMutableState(PongState)
      for (const gameUUID of state.keys) {
        const game = state[gameUUID as EntityUUID]
        if (game.ball.value === action.entityUUID) {
          game.ballCooldown.set(3000)
          game.ball.set(null)
          return
        }
      }
    })
  },

  reactor: () => {
    const pongState = useHookstate(getMutableState(PongState))
    const sceneLoaded = useHookstate(getMutableState(SceneState).sceneLoaded)
    if (!sceneLoaded.value) return null
    return (
      <>
        {pongState.keys.map((gameUUID: EntityUUID) => (
          <GameReactor key={gameUUID} gameUUID={gameUUID} />
        ))}
      </>
    )
  }
})

const PlayerReactor = (props: { playerIndex: number; gameUUID: EntityUUID }) => {
  const playerState = getMutableState(PongState)[props.gameUUID].players[props.playerIndex]
  const connected = useHookstate(playerState.connected)
  const score = useHookstate(playerState.score)

  useEffect(() => {
    const userID = connected.value

    if (!userID) return

    logger.info(`Player ${props.playerIndex} connected: ${userID}`)

    /** Dispatch from the client who is to wield the paddles */
    if (userID !== Engine.instance.userID)
      return () => {
        logger.info(`Player ${props.playerIndex} disconnected`)
      }

    dispatchAction(
      PaddleActions.spawnPaddle({
        entityUUID: (userID + '_paddle_left') as EntityUUID,
        gameEntityUUID: props.gameUUID,
        handedness: 'left',
        owner: userID
      })
    )
    dispatchAction(
      PaddleActions.spawnPaddle({
        entityUUID: (userID + '_paddle_right') as EntityUUID,
        gameEntityUUID: props.gameUUID,
        handedness: 'right',
        owner: userID
      })
    )

    return () => {
      logger.info(`Player ${props.playerIndex} disconnected`)

      dispatchAction(
        WorldNetworkAction.destroyEntity({
          entityUUID: (userID + '_paddle_left') as EntityUUID
        })
      )
      dispatchAction(
        WorldNetworkAction.destroyEntity({
          entityUUID: (userID + '_paddle_right') as EntityUUID
        })
      )
    }
  }, [connected])

  useEffect(() => {
    logger.info(`Player ${props.playerIndex} score: ${score.value}`)

    const playerLetter = ['A', 'B', 'C', 'D'][props.playerIndex]
    const gameEntity = UUIDComponent.getEntityByUUID(props.gameUUID)
    let entity = UndefinedEntity
    iterateEntityNode(gameEntity, (e) => {
      if (getComponent(e, NameComponent) === `score${playerLetter}`) entity = e
    })

    if (!entity) return console.warn(`Couldn't find score entity for player ${props.playerIndex}`)

    const x = score.value / maxScore
    const transform = getComponent(entity, TransformComponent)
    transform.scale.x = x
  }, [score])

  return null
}

const BallReactor = (props: { gameUUID: EntityUUID }) => {
  const ballState = useHookstate(getMutableState(PongState)[props.gameUUID].ball)

  useEffect(() => {
    if (!ballState.value) return
    spawnBall(props.gameUUID, ballState.value)
  }, [ballState])

  return null
}

const GameReactor = (props: { gameUUID: EntityUUID }) => {
  useEffect(() => {
    logger.info(`Game ${props.gameUUID} started`)
    return () => {
      logger.info(`Game ${props.gameUUID} ended`)
    }
  }, [])

  return (
    <>
      <PlayerReactor playerIndex={0} gameUUID={props.gameUUID} />
      <PlayerReactor playerIndex={1} gameUUID={props.gameUUID} />
      <PlayerReactor playerIndex={2} gameUUID={props.gameUUID} />
      <PlayerReactor playerIndex={3} gameUUID={props.gameUUID} />
      <BallReactor gameUUID={props.gameUUID} />
    </>
  )
}
