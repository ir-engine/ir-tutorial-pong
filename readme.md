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

* ontick ball launcher
  x ? some kind of bug with trying to set forces on the ball -> looks like broken code in the engine
  - if game started test -> we could have a game reset pad
  * periodically launch the ball

* plate collider
  * if it is a ball -> then increase damage -> reset ball
    * if damage is greater than 9 then end game
  - if it is an avatar -> if game is stopped then start game

- if ball hit ground -> reset ball

 