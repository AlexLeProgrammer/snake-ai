/**
 * Main script.
 * @author Alex Etienne.
 */

"use strict";

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
const WAIT_TIME = 1;
const MAX_GEN_TIME = 50;
const SNAKES_COUNT = 150;
const SNAKES_KEEP_COUNT = 20;

//#enregion

//#region Classes

class Snake {
    body = [{x:5, y:5}, {x:5, y:6}];
    appleX = Math.floor(Math.random() * GRID_SIZE);
    appleY = Math.floor(Math.random() * GRID_SIZE);
    direction = 0;
    dead = false;

    constructor(nn = null) {
        if (nn !== null) {
            this.neural_network = nn;
        } else {
            this.neural_network = new NeuralNetwork([GRID_SIZE*GRID_SIZE, 30, 30, 3]);
        }
    }

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
let generation = 0;
let display = true;

// Snakes
let snakes = [new Snake()];

// Input
let inputLeft = false;
let inputRight = false;

//#endregion

//#region Functions

/**
 * Copy a neural network.
 * @param nn The neural network to copy.
 * @return {NeuralNetwork} The new neural network.
 */
function getNeuralNetCopy(nn) {
    let nnCopy = new NeuralNetwork([GRID_SIZE*GRID_SIZE, 30, 30, 3]);
    for (let i = 0; i < nn.neurons.length; i++) {
        for (let j = 0; j < nn.neurons[i].length; j++) {
            nnCopy.neurons[i][j].weights = {...nn.neurons[i][j].weights};
            nnCopy.neurons[i][j].bias = nn.neurons[i][j].bias;
        }
    }

    return nnCopy;
}

//#endregion

// Add the first snakes
for (let i = 0; i < SNAKES_COUNT * 10; i++) {
    snakes.push(new Snake());
}

// Main loop
setInterval(() => {
    // Update the snakes
    let deadCount = 0;
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
                // Create the input of the snake
                let map = [];
                for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
                    map.push(0);
                }

                // Add the apple
                map[snake.appleY * GRID_SIZE + snake.appleX] = 1;

                // Add the head
                map[snake.body[0].y * GRID_SIZE + snake.body[0].x] = 2;

                // Add the tail to the map
                for (let i = 1; i < snake.body.length; i++) {
                    map[snake.body[i].y * GRID_SIZE + snake.body[i].x] = 3;
                }

                // Move the tail
                for (let i = snake.body.length - 1; i > 0; i--) {
                    snake.body[i].x = snake.body[i - 1].x;
                    snake.body[i].y = snake.body[i - 1].y;
                }

                // Get the output of the neural network and turn
                const OUT = snake.neural_network.out(map);
                if (OUT[1] > OUT[2]) {
                    if (OUT[1] > OUT[0]) {
                        snake.turn(true);
                    }
                } else if (OUT[2] > OUT[1]) {
                    if (OUT[2] > OUT[0]) {
                        snake.turn(false);
                    }
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
        } else {
            deadCount++;
        }
    }

    // Stop the generation and start another one
    if (deadCount === snakes.length || time % MAX_GEN_TIME === 0) {
        // Get the best snakes
        snakes.sort((a, b) => b.body.length - a.body.length);
        snakes.slice(0, SNAKES_KEEP_COUNT);

        // Create the new generation

        // Recreate first snakes
        let newSnakes = [];
        for (let i = 0; i < SNAKES_KEEP_COUNT; i++) {
            newSnakes.push(new Snake(snakes[i].neural_network));
        }

        // Mutate snakes
        let mutatedSnakes = [];
        for (let i = 0; i < SNAKES_KEEP_COUNT * 3; i++) {
            mutatedSnakes.push(new Snake());
            mutatedSnakes[i].neural_network = getNeuralNetCopy(snakes[i % snakes.length].neural_network);
            mutatedSnakes[i].neural_network.mutate(-0.1, 0.1);
        }

        // Push the new snakes into snakes[]
        snakes = [];
        for (let snake of newSnakes) {
            snakes.push(snake);
        }
        for (let snake of mutatedSnakes) {
            snakes.push(snake);
        }

        // Add the other snakes
        for (let i = 0; i < SNAKES_COUNT - SNAKES_KEEP_COUNT * 4; i++) {
            snakes.push(new Snake());
        }

        generation++;
        console.log(generation);
    }

    if (display) {
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
