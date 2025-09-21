import {restrictDistance, drawParticles, initializeParticles, setRandomParticlePositions, force} from './particle.js';
import {Matrix, createMatrixUserInterface} from './matrix.js'
import { Quadrant, Square, Circle} from './quadTree.js';

//canvas initialisieren
const canvas = document.getElementById("my-canvas");
const ctx = canvas.getContext("2d");

//Breite und Höhe der Zeichenfläche in Pixel
let canvasWidth = 800;
let canvasHeight = 800;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

var n = 1000; //Anzahl Partikel
var dt = 0.01; //Deltazeit zwischen Frames
var frictionHalfLife = 0.01; //Halbwertszeit der Reibung
var rMax = 0.1; //Maximale Distanz, bei der noch eine Kraft ausgeübt wird

var forceFactor = 20; //Verstärkungsfaktor der Kraft
var frictionFactor = Math.pow(0.5, dt / frictionHalfLife); //Reibungsfaktor basierend auf Halbwertzeit

var matrix = new Matrix(5, true); //1. Parameter ist Anzahl Farben, 2. Parameter gibt an, ob eine random Matrix gemacht werden soll
createMatrixUserInterface(matrix.size, matrix.matrix); //matrix.matrix ist die Liste, in der die Matrix gespeichert ist

let calculationMethod = 0; //0 = naive, 1 = querySquare, 2 = queryCircle

//Für Statistiken
let summedTime = 0; //Zeit seit beginn der Simulation, wird mit "Reset Average Time Per Frame"-Button zurückgesetzt
let framesPassed = 0; //Frames seit beginn der Simulation, wird mit "Reset Average Time Per Frame"-Button zurückgesetzt

//Array für Partikel
var particles = initializeParticles(n, matrix.size);

var showQuadtree = false;

const savedMatrix = [
    [0.44, 0.54, -0.96, 0.11, 0],
    [0.66, -0.15, -0.77, 0.5, -0.74],
    [0.23, 0.85, 0.54, -0.19, 0.22],
    [-0.59, 0.43, 0.63, -0.7, -0.5],
    [-0.51, -0.24, 0.89, -0.02, -0.2]
];

function loop() {
    let quadTree;
    let t0 = performance.now();
    
    if (calculationMethod == 0) { //naive Methode
        let numberDistanceCalculations = naiveUpdateParticles();
        distanceComputationsElement.textContent = "Distance Computations:" + numberDistanceCalculations;
        rangeCountElement.textContent = "Ranges:" + 0;
        
    }
    else if (calculationMethod == 1 || calculationMethod == 2) { //Quadtree nötig
        quadTree = new Quadrant(0, 0, canvas.width); //Erster Quadrant des Quadtree's

        //Partikel dem Quadtree hinzufügen
        for (let i = 0; i < n; i++) {
            quadTree.insert(particles[i], canvas);
        }

        let {distanceComputations, rangeCount} = queryUpdateParticles(quadTree); 
        distanceComputationsElement.textContent = "Distance Computations:" + distanceComputations;
        rangeCountElement.textContent = "Ranges:" + rangeCount;
    }

    

    ctx.fillStyle = "black"; //Canvas leeren
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    //Das ist für Debug: Die Ranges des ersten Partikels (particles[0]) werden visualisiert
     let ranges = [];

    if (calculationMethod == 1) {
    ranges.push(new Square(particles[0].positionX * canvasWidth - rMax * canvasWidth, 
                            particles[0].positionY * canvasHeight - rMax * canvasHeight, 2 * rMax * canvasWidth));

     if (particles[0].positionX < rMax) {
            ranges.push(new Square(canvasWidth + particles[0].positionX * canvasWidth - rMax * canvasWidth, 
                                particles[0].positionY * canvasHeight - rMax * canvasHeight, 2 * rMax * canvasWidth));
            }

    else if (particles[0].positionX > 1 - rMax) {
    ranges.push(new Square(-canvasWidth + particles[0].positionX * canvasWidth - rMax * canvasWidth, 
                        particles[0].positionY * canvasHeight - rMax * canvasHeight, 2 * rMax * canvasWidth));
    }

    if (particles[0].positionY < rMax) {
    ranges.push(new Square(particles[0].positionX * canvasWidth - rMax * canvasWidth, 
                        canvasHeight + particles[0].positionY * canvasHeight - rMax * canvasHeight, 2 * rMax * canvasWidth));
    }

    else if (particles[0].positionY > 1 - rMax) {
    ranges.push(new Square(particles[0].positionX * canvasWidth - rMax * canvasWidth, 
                        -canvasHeight + particles[0].positionY * canvasHeight - rMax * canvasHeight, 2 * rMax * canvasWidth));
    }


     // Ecken
    if (particles[0].positionX < rMax && particles[0].positionY < rMax) {
        ranges.push(new Square(canvasWidth + particles[0].positionX * canvasWidth - rMax * canvasWidth, 
                               canvasHeight + particles[0].positionY * canvasHeight - rMax * canvasHeight, 
                               2 * rMax * canvasWidth));
    }
    if (particles[0].positionX > 1 - rMax && particles[0].positionY < rMax) {
        ranges.push(new Square(-canvasWidth + particles[0].positionX * canvasWidth - rMax * canvasWidth, 
                               canvasHeight + particles[0].positionY * canvasHeight - rMax * canvasHeight, 
                               2 * rMax * canvasWidth));
    }
    if (particles[0].positionX < rMax && particles[0].positionY > 1 - rMax) {
        ranges.push(new Square(canvasWidth + particles[0].positionX * canvasWidth - rMax * canvasWidth, 
                               -canvasHeight + particles[0].positionY * canvasHeight - rMax * canvasHeight, 
                               2 * rMax * canvasWidth));
    }
    if (particles[0].positionX > 1 - rMax && particles[0].positionY > 1 - rMax) {
        ranges.push(new Square(-canvasWidth + particles[0].positionX * canvasWidth - rMax * canvasWidth, 
                               -canvasHeight + particles[0].positionY * canvasHeight - rMax * canvasHeight, 
                               2 * rMax * canvasWidth));
    }

    }
    
    else if (calculationMethod == 2) {
    ranges.push(new Circle(particles[0].positionX * canvasWidth, 
                        particles[0].positionY * canvasHeight, rMax * canvasWidth));
        

    if (particles[0].positionX < rMax) { //linke boundary
    ranges.push(new Circle(canvasWidth + particles[0].positionX * canvasWidth, 
                        particles[0].positionY * canvasHeight, rMax * canvasWidth));
    }

    else if (particles[0].positionX > 1 - rMax) { //rechte boundary
    ranges.push(new Circle(-canvasWidth + particles[0].positionX * canvasWidth, 
                        particles[0].positionY * canvasHeight, rMax * canvasWidth));
    }

    if (particles[0].positionY < rMax) { //obere boundary
    ranges.push(new Circle(particles[0].positionX * canvasWidth, 
                        canvasHeight + particles[0].positionY * canvasHeight, rMax * canvasWidth));
    }

    else if (particles[0].positionY > 1 - rMax) { //untere boundary
    ranges.push(new Circle(particles[0].positionX * canvasWidth, 
                        -canvasHeight + particles[0].positionY * canvasHeight, rMax * canvasWidth));
    }

    //Ecken
    if (particles[0].positionX < rMax && particles[0].positionY < rMax) { //oben links
        ranges.push(new Circle(canvasWidth + particles[0].positionX * canvasWidth, //Dann muss unten rechts noch eine Range sein
                            canvasHeight + particles[0].positionY * canvasHeight, 
                            rMax * canvasWidth));
    }
    if (particles[0].positionX > 1 - rMax && particles[0].positionY < rMax) { //oben rechts
        ranges.push(new Circle(-canvasWidth + particles[0].positionX * canvasWidth,  //noch unten links
                            canvasHeight + particles[0].positionY * canvasHeight, 
                            rMax * canvasWidth));
    }
    if (particles[0].positionX < rMax && particles[0].positionY > 1 - rMax) { //unten links
        ranges.push(new Circle(canvasWidth + particles[0].positionX * canvasWidth, //oben rechts
                            -canvasHeight + particles[0].positionY * canvasHeight, 
                            rMax * canvasWidth));
    }
    if (particles[0].positionX > 1 - rMax && particles[0].positionY > 1 - rMax) { //unten rechts
        ranges.push(new Circle(-canvasWidth + particles[0].positionX * canvasWidth, //oben links
                            -canvasHeight + particles[0].positionY * canvasHeight, 
                            rMax * canvasWidth));
    }
}

    if (showQuadtree && quadTree) { //Wenn Quadtree existiert
        quadTree.drawQuadrant(ctx);
        let found = [];
        ranges.forEach(range => {
            found = found.concat(quadTree.query(range, [], canvas));
        });
        ranges.forEach(range => {
            range.draw(ctx);
        });
     


        ctx.fillStyle = "white";
        found.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.positionX * canvas.width, p.positionY * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fill();
        });
    };
    //Debug fertig

    drawParticles(ctx, particles, canvas, matrix.size);

    let t1 = performance.now();
    let timePerFrame = Math.floor((t1 - t0) * 1000) / 1000; //in Millisekunden auf 3 Nachkommastellen gerundet
    timePerFrameElement.textContent = "Time Per Frame:" + timePerFrame + "ms";

    summedTime += timePerFrame;
    framesPassed ++;

    averageTimePerFrameElement.textContent = "Average Time Per Frame:" + Math.floor((summedTime / framesPassed) * 1000) / 1000 + "ms / frame";


    // Schleife fortsetzen
    requestAnimationFrame(loop);
}

// Simulation starten
requestAnimationFrame(loop);


//Dies ist eine Funktion der Kräfteberechnung mit einer Zeitkomplexität von O(n^2)
function naiveUpdateParticles() {
    let distanceComputations = 0; //Zählt, wie oft die Distanz berechnet wird
    for (let i = 0; i < n; i++) {
        let totalForceX = 0;
        let totalForceY = 0;

        // Berechnung der Kräfte zwischen Partikeln
        for (let j = 0; j < n; j++) {
            if (j == i) continue; //Eigenes Partikel überspringen
            let rx = restrictDistance(particles[j].positionX - particles[i].positionX);
            let ry = restrictDistance(particles[j].positionY - particles[i].positionY);


            const r = Math.hypot(rx, ry); //Abstand zwischen den Partikeln
            distanceComputations += 1; 
            if (r > 0 && r < rMax) {
                const f = force(r / rMax, matrix.matrix[particles[i].color][particles[j].color]); //Skalierung der Distanz durch Division durch rMax
                totalForceX += (rx / r) * f; //Kraft f (Skalar) wird mit dem Richtungsvektor (rx / r) multipliziert und dann der totalforceX addiert
                totalForceY += (ry / r) * f;

            }
        }

        //Aufhebung der Skalierung
        totalForceX *= rMax * forceFactor;
        totalForceY *= rMax * forceFactor;

        particles[i].updateVelocity(dt, frictionFactor, totalForceX, totalForceY);
        particles[i].updatePosition(dt);
    }

    return distanceComputations;
}

function queryUpdateParticles(quadTree) {
    let distanceComputations = 0; 
    let rangeCount = 0;

    for (let i = 0; i < n; i++) {
        let totalForceX = 0;
        let totalForceY = 0;

        let ranges = [];

        if (calculationMethod == 1) { //query Square
        ranges.push(new Square(particles[i].positionX * canvasWidth - rMax * canvasWidth, 
                            particles[i].positionY * canvasHeight - rMax * canvasHeight, 2 * rMax * canvasWidth));
        rangeCount++;
            
        if (particles[i].positionX < rMax) { //linke boundary geschnitten -> zusätzliche Range rechts
        ranges.push(new Square(canvasWidth + particles[i].positionX * canvasWidth - rMax * canvasWidth, 
                            particles[i].positionY * canvasHeight - rMax * canvasHeight, 2 * rMax * canvasWidth));
            rangeCount++;
        }

        else if (particles[i].positionX > 1 - rMax) { //rechte boundary geschnitten -> zusätzliche Range links
        ranges.push(new Square(-canvasWidth + particles[i].positionX * canvasWidth - rMax * canvasWidth, 
                            particles[i].positionY * canvasHeight - rMax * canvasHeight, 2 * rMax * canvasWidth));
            rangeCount++;
        }

        if (particles[i].positionY < rMax) { //obere boundary geschnitten -> zusätzliche Range unten
        ranges.push(new Square(particles[i].positionX * canvasWidth - rMax * canvasWidth, 
                            canvasHeight + particles[i].positionY * canvasHeight - rMax * canvasHeight, 2 * rMax * canvasWidth));
            rangeCount++;
        }

        else if (particles[i].positionY > 1 - rMax) { //untere boundary geschnitten -> zusätzliche Range oben
        ranges.push(new Square(particles[i].positionX * canvasWidth - rMax * canvasWidth, 
                            -canvasHeight + particles[i].positionY * canvasHeight - rMax * canvasHeight, 2 * rMax * canvasWidth));
            rangeCount++;
        }
        //Ecken
        if (particles[i].positionX < rMax && particles[i].positionY < rMax) { //Partikel oben links
            ranges.push(new Square(canvasWidth + particles[i].positionX * canvasWidth - rMax * canvasWidth, //unten rechts noch eine Range hinzufügen
                                canvasHeight + particles[i].positionY * canvasHeight - rMax * canvasHeight, 
                                2 * rMax * canvasWidth));
            rangeCount++;
        }
        if (particles[i].positionX > 1 - rMax && particles[i].positionY < rMax) { //Partikel oben rechts
            ranges.push(new Square(-canvasWidth + particles[i].positionX * canvasWidth - rMax * canvasWidth,  //unten links noch eine Range hinzufügen
                                canvasHeight + particles[i].positionY * canvasHeight - rMax * canvasHeight, 
                                2 * rMax * canvasWidth));
            rangeCount++;
        }
        if (particles[i].positionX < rMax && particles[i].positionY > 1 - rMax) { //Partikel unten links
            ranges.push(new Square(canvasWidth + particles[i].positionX * canvasWidth - rMax * canvasWidth, //oben rechts noch eine Range hinzufügen
                                -canvasHeight + particles[i].positionY * canvasHeight - rMax * canvasHeight, 
                                2 * rMax * canvasWidth));
            rangeCount++;
        }
        if (particles[i].positionX > 1 - rMax && particles[i].positionY > 1 - rMax) { //Partikel unten rechts
            ranges.push(new Square(-canvasWidth + particles[i].positionX * canvasWidth - rMax * canvasWidth, //oben links noch eine Rane hinzufügen
                                -canvasHeight + particles[i].positionY * canvasHeight - rMax * canvasHeight, 
                                2 * rMax * canvasWidth));
            rangeCount++;
        }
        }

        ////////////////////////////////////

        else if (calculationMethod == 2) { //query Circle
        ranges.push(new Circle(particles[i].positionX * canvasWidth, 
                            particles[i].positionY * canvasHeight, rMax * canvasWidth));
            rangeCount++;
        

        if (particles[i].positionX < rMax) { //linke boundary
        ranges.push(new Circle(canvasWidth + particles[i].positionX * canvasWidth, 
                            particles[i].positionY * canvasHeight, rMax * canvasWidth));
            rangeCount++;
        }

        else if (particles[i].positionX > 1 - rMax) { //rechte boundary
        ranges.push(new Circle(-canvasWidth + particles[i].positionX * canvasWidth, 
                            particles[i].positionY * canvasHeight, rMax * canvasWidth));
            rangeCount++;
        }

        if (particles[i].positionY < rMax) { //obere boundary
        ranges.push(new Circle(particles[i].positionX * canvasWidth, 
                            canvasHeight + particles[i].positionY * canvasHeight, rMax * canvasWidth));
            rangeCount++;
        }

        else if (particles[i].positionY > 1 - rMax) { //untere boundary
        ranges.push(new Circle(particles[i].positionX * canvasWidth, 
                            -canvasHeight + particles[i].positionY * canvasHeight, rMax * canvasWidth));
            rangeCount++;
        }

        //Ecken
        if (particles[i].positionX < rMax && particles[i].positionY < rMax) { //Partikel oben links
            ranges.push(new Circle(canvasWidth + particles[i].positionX * canvasWidth, //Range unten rechts
                                canvasHeight + particles[i].positionY * canvasHeight, 
                                rMax * canvasWidth));
            rangeCount++;
        }
        if (particles[i].positionX > 1 - rMax && particles[i].positionY < rMax) { //Partikel oben rechts
            ranges.push(new Circle(-canvasWidth + particles[i].positionX * canvasWidth,  //Range unten links
                                canvasHeight + particles[i].positionY * canvasHeight, 
                                rMax * canvasWidth));
            rangeCount++;
        }
        if (particles[i].positionX < rMax && particles[i].positionY > 1 - rMax) { //Partikel unten links
            ranges.push(new Circle(canvasWidth + particles[i].positionX * canvasWidth, //Range oben rechts
                                -canvasHeight + particles[i].positionY * canvasHeight, 
                                rMax * canvasWidth));
            rangeCount++;
        }
        if (particles[i].positionX > 1 - rMax && particles[i].positionY > 1 - rMax) { //Partikel unten rechts
            ranges.push(new Circle(-canvasWidth + particles[i].positionX * canvasWidth, //Range oben links
                                -canvasHeight + particles[i].positionY * canvasHeight, 
                                rMax * canvasWidth));
            rangeCount++;
        }
        }

        let found = [];
        ranges.forEach(range => {
            found = found.concat(quadTree.query(range, [], canvas)); //Query-Methode auf alle Ranges anwenden und alle gefundenen Partikel der Liste found hinzufügen
        });

        found.forEach(particle => {
            if (particle === particles[i]) return;
            let rx =  particle.positionX - particles[i].positionX;
            let ry = particle.positionY - particles[i].positionY;

            const r = Math.hypot(rx, ry); //Abstand zwischen den Partikeln
            distanceComputations += 1; 
            if (r > 0 && r < rMax) {
            const f = force(r / rMax, matrix.matrix[particles[i].color][particle.color]); 
            totalForceX += (rx / r) * f; //Kraft f (Skalar) wird mit dem Richtungsvektor (rx / r) multipliziert und dann der totalforceX addiert
            totalForceY += (ry / r) * f;
            }

        });
        
        totalForceX *= rMax * forceFactor;
        totalForceY *= rMax * forceFactor;

        particles[i].updateVelocity(dt, frictionFactor, totalForceX, totalForceY);
        particles[i].updatePosition(dt);

    }

    return {distanceComputations, rangeCount};
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

const distanceComputationsElement = document.getElementById("distance-computations");

const rangeCountElement = document.getElementById("range-count");

const timePerFrameElement = document.getElementById("time-per-frame");

const averageTimePerFrameElement = document.getElementById("average-time-per-frame");

const loadSavedMatrixButton = document.getElementById("load-saved-matrix-button");
loadSavedMatrixButton.addEventListener("click", () => {
    matrix.size = savedMatrix.length;
    matrix.matrix = savedMatrix;
    createMatrixUserInterface(matrix.size, matrix.matrix);
});

const ResetAverageTimePerFrameButton = document.getElementById("reset-average-time-per-frame-button");
ResetAverageTimePerFrameButton.addEventListener("click", () => {
    summedTime = 0;
    framesPassed = 0;
});

const naiveMethodButton = document.getElementById("naive-method-button");
naiveMethodButton.addEventListener("click", () => {
    calculationMethod = 0;
});

const querySquareMethodButton = document.getElementById("query-square-method-button");
querySquareMethodButton.addEventListener("click", () => {
    calculationMethod = 1;
});

const queryCircleMethodButton = document.getElementById("query-circle-method-button");
queryCircleMethodButton.addEventListener("click", () => {
    calculationMethod = 2;
});