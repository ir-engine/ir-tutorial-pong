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

## behave graph variant todo

* plate exists and is a trigger and is sensitive to onCollision events
  * successfully collides with avatar
    - detect 'on enter' and 'on exit' -> i actually could hack that a different way with an exit plate
    - set game started flag

  * collides with ball? (after manually changing the ball mask to 15)
    - increment damage
    - show damage in score
    - reset ball
    - may stop game

- ontick ball launcher
  - ? some kind of bug with trying to set forces on the ball -> looks like broken code in the engine
  - if game started then periodically launch the ball
