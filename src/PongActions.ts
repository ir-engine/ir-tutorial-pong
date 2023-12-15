//////////////////////////////////////////////////////////////////////////////////////////////////
///
/// pong networked state action datagram shapes
///
//////////////////////////////////////////////////////////////////////////////////////////////////

import { matches, matchesEntityUUID } from "@etherealengine/engine/src/common/functions/MatchesUtils"
import { NetworkTopics } from "@etherealengine/engine/src/networking/classes/Network"
import { defineAction } from "@etherealengine/hyperflux"

export class PongAction {

  static pongLog = defineAction({
    type: 'pong.log',
    log: matches.string,
    $topic: NetworkTopics.world
  })

  static pongPong = defineAction({
    type: 'pong.pong',
    uuid: matchesEntityUUID,
    mode: matches.string,
    $topic: NetworkTopics.world
  })

  static pongGoal = defineAction({
    type: 'pong.goal',
    entityUUID: matchesEntityUUID,
    damage: matches.number,
    $topic: NetworkTopics.world
  })

}
