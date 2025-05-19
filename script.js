import {restrictDistance, drawParticles, initializeParticles, setRandomParticlePositions, force} from './particle.js';
import {Matrix, createMatrixUserInterface} from './matrix.js'
import { Quadrant, Range } from './quadTree.js';

//canvas initialisieren
const canvas = document.getElementById("my-canvas");
const ctx = canvas.getContext("2d");

//Breite und Höhe der Zeichenfläche in Pixel
let canvasWidth = 800;
let canvasHeight = 800;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

var n = 1000; //Anzahl Partikel
var dt = 0.01; //DeltaZeit zwischen Frames
var frictionHalfLife = 0.01; //Halbwertszeit der Reibung
var rMax = 0.1; //Maximale Distanz, bei der noch eine Kraft ausgeübt wird

var forceFactor = 20; //Verstärkungsfaktor der Kraft
var frictionFactor = Math.pow(0.5, dt / frictionHalfLife); //Reibungsfaktor basierend auf Halbwertzeit

var matrix = new Matrix(5, true); //Parameter 1 ist Anzahl Farben, Parameter 2 ist, ob eine random Matrix gemacht werden soll
createMatrixUserInterface(matrix.size, matrix.matrix); //matrix.matrix ist die Liste, in der die Matrix gespeichert ist

//Array für Partikel
var particles = initializeParticles(n, matrix.size);

var showQuadtree = false;

function loop() {
    let quadTree = new Quadrant(0, 0, canvas.width); //Erster Quadrant des Quadtree's

    //Partikel dem Quadtree hinzufügen
    for (let i = 0; i < n; i++) {
        quadTree.insert(particles[i], canvas);
    }
   
    //let startCounter = performance.now(); //Zählt die Zeit für die ganze Berechnung
    updateParticles();
    //let endCounter = performance.now();
    //console.log("Runtime: ", endCounter - startCounter, "ms");

    ctx.fillStyle = "black"; //Canvas leeren
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    //Das ist für Debug
    ////////////
    let range = new Range(100, 100, 300);

    if (showQuadtree) {
        quadTree.drawQuadrant(ctx);
        range.draw(ctx);
        let found = quadTree.query(range, [], canvas);

        ctx.fillStyle = "white";
        found.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.positionX * canvas.width, p.positionY * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fill();
});
    };
    ///////////

    drawParticles(ctx, particles, canvas, matrix.size);

    // Schleife fortsetzen
    requestAnimationFrame(loop);
}

// Simulation starten
requestAnimationFrame(loop);


//Dies ist eine Funktion der Kräfteberechnung mit einer runtime von O(n^2)
function updateParticles() {
    for (let i = 0; i < n; i++) {
        let totalForceX = 0;
        let totalForceY = 0;

        // Berechnung der Kräfte zwischen Partikeln
        for (let j = 0; j < n; j++) {
            if (j == i) continue; //Eigenes Partikel überspringen
            let rx = restrictDistance(particles[j].positionX - particles[i].positionX);
            let ry = restrictDistance(particles[j].positionY - particles[i].positionY);


            const r = Math.hypot(rx, ry); //Abstand zwischen den Partikeln
            if (r > 0 && r < rMax) {
                const f = force(r / rMax, matrix.matrix[particles[i].color][particles[j].color]);
                totalForceX += (rx / r) * f; //Kraft f (Skalar) wird mit dem Richtungsvektor (rx / r) multipliziert und dann der totalforceX addiert
                totalForceY += (ry / r) * f;
            }
        }

        //Skalierung
        totalForceX *= rMax * forceFactor;
        totalForceY *= rMax * forceFactor;

        particles[i].updateVelocity(dt, frictionFactor, totalForceX, totalForceY);
        particles[i].updatePosition(dt);
    }
}

const setRandomPositionButton = document.getElementById("set-random-position-button");
setRandomPositionButton.addEventListener("click", () => setRandomParticlePositions(particles));

const setMatrixSizeButton = document.getElementById("set-matrix-size-button");
setMatrixSizeButton.addEventListener("click", () => {
    matrix.setMatrixSize();
    //Neue Initialisierung der Partikel
    particles = initializeParticles(n, matrix.size);
});

const setDeltaTimeButton = document.getElementById("set-delta-time-button");
setDeltaTimeButton.addEventListener("click", () => {
    let newdt =  parseFloat(document.getElementById("delta-time-input").value);
    if (newdt > 0) {
        dt = newdt;
    }
});

const setNumberParticlesButton = document.getElementById("set-particle-number-button");
setNumberParticlesButton.addEventListener("click", () => {
    let newn =  parseInt(document.getElementById("particle-number-input").value);
    if (newn > 0) {
        n = newn;
        particles = initializeParticles(n, matrix.size);
    }
});

const showQuadtreeButton = document.getElementById("show-quadtree-button");
showQuadtreeButton.addEventListener("click", () => {
    if (showQuadtree) {
        showQuadtree = false;
    }
    else {
        showQuadtree = true;
    }
});