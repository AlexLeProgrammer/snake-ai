/**
 * Main script.
 * @author Alex Etienne.
 */

//#region Constants

// Get the canvas
const CANVAS = document.querySelector("canvas");
const CTX = CANVAS.getContext("2d");

// Set the size of the canvas
CANVAS.width = 176;
CANVAS.height = 176;

// Grid
const GRID_SIZE = 11;

// Game
const WAIT_TIME = 100;

//#enregion

//#region Classes

class Snake {
    body = [{x:5, y:5}, {x:5, y:6}];
    appleX = 0;
    appleY = 0;
    direction = 0;
    dead = false;

    /**
     * Turn the snake.
     * @param left If we want to the snake to turn to the left : true, else : false.
     */
    turn(left) {
        if (left && this.direction === 0) {
            this.direction = 3;
        } else if (left) {
            this.direction--;
        }

        if (!left && this.direction === 3) {
            this.direction = 0;
        } else if (!left) {
            this.direction++;
        }
    }

    collision(x, y) {
        if (x < 0 || x > GRID_SIZE - 1 || y < 0 || y > GRID_SIZE - 1) {
            return true;
        }

        for (let i = 1; i < this.body.length; i++) {
            if (this.body[i].x === x && this.body[i].y === y) {
                return true;
            }
        }

        return false;
    }
}

//#endregion

//#region Variables

// Game
let time = 0;

// Snakes
let snakes = [new Snake()];

// Input
let inputLeft = false;
let inputRight = false;

//#endregion

//#region Functions

//#endregion

// Main loop
setInterval(() => {
    // Update the snakes
    for (let snake of snakes) {
        if (!snake.dead) {
            // Eat apple
            if (snake.body[0].x === snake.appleX && snake.body[0].y === snake.appleY) {
                snake.body.push({x: snake.body[snake.body.length - 1].x, y: snake.body[snake.body.length - 1].y});

                // Recreate the apple
                do {
                    snake.appleX = Math.floor(Math.random() * GRID_SIZE);
                    snake.appleY = Math.floor(Math.random() * GRID_SIZE);
                } while (snake.collision(snake.appleX, snake.appleY) ||
                (snake.appleX === snake.body[0].x && snake.appleY === snake.body[0].y));
            }

            // Move
            if (time % WAIT_TIME === 0) {
                // Turn


                // Move the tail
                for (let i = snake.body.length - 1; i > 0; i--) {
                    snake.body[i].x = snake.body[i - 1].x;
                    snake.body[i].y = snake.body[i - 1].y;
                }

                // Move in the direction of the snake
                switch (snake.direction) {
                    case 0: snake.body[0].y--; break;
                    case 1: snake.body[0].x++; break;
                    case 2: snake.body[0].y++; break;
                    case 3: snake.body[0].x--;
                }

                if (snake.collision(snake.body[0].x, snake.body[0].y)) {
                    snake.dead = true;
                }
            }
        }


    }


    CTX.clearRect(0,0,CANVAS.width,CANVAS.height);

    const CELL_SIZE = CANVAS.width / GRID_SIZE;

    // Draw the apple
    CTX.fillStyle = "#F00";
    CTX.fillRect(snakes[0].appleX * CELL_SIZE, snakes[0].appleY * CELL_SIZE, CELL_SIZE + 1, CELL_SIZE + 1);

    // Draw the snake
    for (let i = 0; i < snakes[0].body.length; i++) {
        if (i === 0) {
            CTX.fillStyle = "#0F0";
        } else {
            CTX.fillStyle = "#0B0";
        }

        CTX.fillRect(snakes[0].body[i].x * CELL_SIZE, snakes[0].body[i].y * CELL_SIZE, CELL_SIZE + 1, CELL_SIZE + 1);
    }

    // Draw the grid
    CTX.fillStyle = "#FFF";

    // Vertical lines
    for (let i = 1; i < GRID_SIZE; i++) {
        CTX.fillRect(i * CELL_SIZE, 0, 1, CANVAS.height);
    }

    // Horizontal lines
    for (let i = 1; i < GRID_SIZE; i++) {
        CTX.fillRect(0, i * CELL_SIZE, CANVAS.width, 1);
    }

    // Increase time
    time++;
});

//#region Inputs

// Event when a key is pressed
document.addEventListener("keydown", (e) => {
    // Left
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        if (!inputLeft) {
            snakes[0].turn(true);
        }

        inputLeft = true;
    }

    // Right
    if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        if (!inputRight) {
            snakes[0].turn(false);
        }

        inputRight = true;
    }
});

// Event when a key is released
document.addEventListener("keyup", (e) => {
    // Left
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        inputLeft = false;
    }

    // Right
    if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        inputRight = false;
    }
});

//#endregion
