### Ethereal Engine Pong

# Gameplay

1) When one or more players enters a goal then play is started
2) When all players leave all goals then play stops
3) Players extend their arms to volley a ball towards another player
4) If a ball hits a player goal then that player takes damage; at maximum damage the game ends

# Code

1) A PongComponent acts as a parent node in the editor to collect GoalComponents that make up a game
2) GoalComponents themselves have a collision zone that the player can enter to begin play
3) GoalComponents also may have a paddle that the player can manipulate while in the goal
4) GoalComponents also may have a damage counter that indicates how many times the goal was hit
5) A PongSystem handles all the logic

# Todo

- write ball volley logic and also delete balls that are inactive

## Valuable to improve

- use player mocap if avail; or use xrstate
- merge in a separate commit that extends collision support slightly in ee

## Minor

- perhaps time out exit from game rather than strictly stopping game on stepping off plate?
- perhaps some win effect?
- optionally a robot player?
- optionally improve scoreboard art to be not arabic numerals but rather just dots
- it is hard to see the game state from a first person view -> could capture the player camera?

## Future

- different shaped volumes
- multiball
- obstacles
- gravity, attractors, fans etc
- larger smaller paddles

