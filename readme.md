### Ethereal Engine Pong

# Gameplay

1) When one or more players enters a goal then play is started
2) When all players leave all goals then play stops
3) If a ball hits a player goal then that player takes damage; at maximum damage the game ends
4) volleying is automatic

# Code

1) A PongComponent acts as a parent node in the editor to collect GoalComponents that make up a game
2) GoalComponents themselves have a collision zone that the player can enter to begin play
3) GoalComponents also may have a paddle that the player can manipulate while in the goal
4) GoalComponents also may have a damage counter that indicates how many times the goal was hit
5) A PongSystem handles all the logic

# Todo

- volley balls on client by spawning
- or figure out how to volley balls on server and have them networked


## Minor / Later

- rotate text 90'
- perhaps some win effect?
- optionally a robot player?
- optionally improve scoreboard art to be not arabic numerals but rather just dots
- different shaped volumes
- multiball
- obstacles
- gravity, attractors, fans etc
- larger smaller paddles

