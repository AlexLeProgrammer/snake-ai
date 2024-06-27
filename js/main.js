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
const MAX_GEN_TIME = 100;
const SNAKES_COUNT = 10000;
const SNAKES_KEEP_COUNT = 200;
const RANDOM_SNAKES_COUNT = 200;
//#enregion

//#region Classes

class Snake {
    body = [{x:5, y:5}, {x:5, y:6}];
    appleX = Math.floor(Math.random() * GRID_SIZE);
    appleY = Math.floor(Math.random() * GRID_SIZE);
    direction = 0;
    dead = false;
    timeLived = 0;

    constructor(nn = null) {
        if (nn !== null) {
            this.neural_network = nn;
        } else {
            this.neural_network = new NeuralNetwork([4, 10, 10, 1]);
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
    let nnCopy = new NeuralNetwork([4, 10, 10, 1]);
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
for (let i = 0; i < SNAKES_COUNT; i++) {
    snakes.push(new Snake());
}

// Main loop
setInterval(() => {
    // Update the snakes
    let deadCount = 0;
    for (let snake of snakes) {
        if (!snake.dead) {
            snake.timeLived++;

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
                let input = [];

                // Calculate the distance with the apple
                input.push(snake.appleX - snake.body[0].x, snake.appleY - snake.body[0].y);

                // Get the nearest collision
                let minDistanceX = snake.body[0].x < (GRID_SIZE - 1) / 2 ? 1 - snake.body[0].x : GRID_SIZE - snake.body[0].x;
                let minDistanceY = snake.body[0].y < (GRID_SIZE - 1) / 2 ? 1 - snake.body[0].y : GRID_SIZE - snake.body[0].y;

                for (let i = 1; i  < snake.body.length; i++) {
                    // X axis
                    let distance = snake.body[i].x - snake.body[0].x;
                    if (snake.body[i].y === snake.body[0].y && Math.abs(distance) < Math.abs(minDistanceX)) {
                        minDistanceX = distance;
                    }

                    // Y axis
                    distance = snake.body[i].y - snake.body[0].y;
                    if (snake.body[i].x === snake.body[0].x && Math.abs(distance) < Math.abs(minDistanceY)) {
                        minDistanceY = distance;
                    }
                }

                input.push(minDistanceX, minDistanceY);

                // Get the output of the neural network and turn
                snake.direction = Math.floor(snake.neural_network.out(input)[0]) % 4;

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
        for (let i = 0; i < SNAKES_COUNT - SNAKES_KEEP_COUNT - RANDOM_SNAKES_COUNT; i++) {
            mutatedSnakes.push(new Snake());
            mutatedSnakes[i].neural_network = getNeuralNetCopy(snakes[i % snakes.length].neural_network);
            mutatedSnakes[i].neural_network.mutate(-1, 1);
        }

        // Push the new snakes into snakes[]
        snakes = [];
        for (let snake of newSnakes) {
            snakes.push(snake);
        }
        for (let snake of mutatedSnakes) {
            snakes.push(snake);
        }

        for (let i = 0; i < RANDOM_SNAKES_COUNT; i++) {
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
