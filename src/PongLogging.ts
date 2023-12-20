
import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { dispatchAction } from '@etherealengine/hyperflux'

import { PongAction } from './PongActions'

export const pongLocalLog = (action: ReturnType<typeof PongAction.pongLog>) => {
  console.log("*** pong remote log:",action.log)
}

let lastmsg = ""

export function netlog(msg: string) {
  if(msg === lastmsg) return
  lastmsg = msg
  const userid = Engine.instance.userID
  const log = `*** pong v=1024 userid=${userid} isClient=${isClient} : ${msg}`
  dispatchAction(PongAction.pongLog({log}))
}
