### Ethereal Engine Pong

# Gameplay

1) When one or more players enters a goal then play is started
2) When all players leave all goals then play stops
3) If a ball hits a player goal then that player takes damage; at maximum damage the game ends
4) volleying is automatic

# Code

1) A PongComponent acts as a parent node to collect GoalComponents that make up a game
2) GoalComponents themselves have a collision zone or 'plate' that the player can step on to begin play
3) GoalComponents also may have a damage counter that indicates how many times the goal was hit
4) A PongSystem handles all the logic

# Todo / Issues

- balls networked movement issue on server? balls that are loaded with the scene seem to not network from the server side; the server can move them, they do move on server, but they don't appear to move on the clients at all ... previously i worked around this by dispatching a movement request to the clients but implicit networking should do this and it does work for the paddles (except that the paddles are networked from the client side - which does seem to work)

- prefabs? spawning ball instances on client feels like a good idea; unsure the right way to do this - prefabs may be a way? building a ball from scratch may be another way - but that seems bulky to express in code and lacks customizability

- latency on requesting auth? having to request authority could create a one frame latency which makes it harder to do something such as recycle a ball - can authority be granted simply by observing attempts to move an object?

- ball forces in general appear to not reset? are ball forces networked? when a ball resets position it still is moving with the same forces it had prior to being reset - even if the forces are reset? this needs more study

- there's a network design tension where state such as game scores are not updated for new clients connecting; they are set to the game defaults! there needs to be a deeper concept of a networked game state - then network clients could get that automatically on connection - or else new joiners are going to have to ask explicitly for fresh state, or the server will have to proactively publish changes to new joiners

- move entire TextComponent feature out of pong into etherealengine as a general reasource - and also fetch font more directly; rather than from 3js github repo

## Minor / Later

- perhaps some win effect?
- optionally a robot player?
- optionally improve scoreboard art to be not arabic numerals but rather just dots
- different shaped volumes
- obstacles
- gravity, attractors, fans etc
- nicer paddle art
- nicer table art

