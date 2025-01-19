import {Particle, restrictDistance, drawParticles, initializeParticles, setRandomParticlePositions, force} from './particle.js';

const canvas = document.getElementById("my-canvas");
const ctx = canvas.getContext("2d");

//Breite und Höhe der Zeichenfläche in Pixel
let canvasWidth = 800;
let canvasHeight = 800;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

var n = 1000; //Anzahl Partikel
var dt = 0.01; //DeltaZeit zwischen Frames
var frictionHalfLife = 0.02; //Halbwertszeit der Reibung
var rMax = 0.1; //Maximale Distanz, bei der noch eine Kraft ausgeübt wird
var m = 5; //Anzahl Farben
var forceFactor = 20; //Verstärkungsfaktor der Kraft
var frictionFactor = Math.pow(0.5, dt / frictionHalfLife); //Reibungsfaktor basierend auf Halbwertzeit

var matrix = makeRandomMatrix();
createMatrixUserInterface(m, matrix);

function makeRandomMatrix() { //Generiert eine zufällige Matrix der Anziehung
    const rows = [];
    for (let i = 0; i < m; i++) {
        const row = [];
        for (let j = 0; j < m; j++) {
            row.push(Math.round((Math.random() * 2 - 1)*100)/100); //Wert zwischen 1 und -1 auf 2 Nachkommastellen gerundet
        }
        rows.push(row);
    }
    return rows;
}

function createMatrixUserInterface(size, randomMatrix) { //matrix mit m Reihen und m Spalten anzeigen auf Webseite, welche mit Random Zahlen gefüllt ist
    const matrixContainer = document.getElementById("matrix-container");
    const colorRowTop = document.getElementById("color-row-top"); //Obere FarbkästchenContainer

    //Leeren des vorherigen Inhalts
    matrixContainer.innerHTML = "";
    colorRowTop.innerHTML = "";
    
    matrixContainer.style.gridTemplateColumns = `repeat(${size + 1}, 40px)`; // Spaltenanzahl abhängig von anzahl Farben, size+1, weil es noch 1 box für Farbkästchen links hinzurechnen muss
    colorRowTop.style.gridTemplateColumns = `repeat(${size}, 40px)`; 

     // Farbenkästchen für die horizontale Reihe oben erstellen
     for (let i = 0; i < size; i++) {
        const colorBox = document.createElement("div");
        colorBox.id = "color-square";
        colorBox.style.backgroundColor = `hsl(${360 * (i / size)}, 100%, 50%)`; //Gleiche Farbe wie beim Zeichnen der Partikel
        colorRowTop.appendChild(colorBox);
    }

    for (let i = 0; i < size; i++){ //Reihen

         // Farbkästchen links erstellen
         const colorBox = document.createElement("div");
         colorBox.id = "color-square";
         colorBox.style.backgroundColor = `hsl(${360 * (i / size)}, 100%, 50%)`;
         matrixContainer.appendChild(colorBox);

        for (let j = 0; j < size; j++) { //Spalten
            const input = document.createElement("input");
            input.type = "number"; //Der Input soll eine Zahl zwischen -1 und 1 sein
            input.min = "-1";
            input.max = "1";
            input.step = "0.1";
            input.value = randomMatrix[i][j]; //Wert der randomMatrix
            input.id = `reihe-${i}-spalte-${j}`;//Id hinzufügen, damit man sich auf diese Zelle beziehen kann
            matrixContainer.appendChild(input);

            // Event-Listener für Änderungen im Input-Feld
            input.addEventListener("input", (event) => {
                let newValue = parseFloat(event.target.value); //Wert im Feld lesen und in Float umwandeln
                if (isNaN(newValue)) { //Wenn ungültig z.B. Buchstabe, dann soll der Wert 0 sein
                    newValue = 0;
                } 
                randomMatrix[i][j] = newValue; // Matrix aktualisieren
            });
        }
    }
}

//Array für Partikel
var particles = initializeParticles(n, m);


function loop() {
    updateParticles();

    drawParticles(ctx, particles, canvas, m);

    // Schleife fortsetzen
    requestAnimationFrame(loop);
}

// Simulation starten
requestAnimationFrame(loop);

function updateParticles() {
    for (let i = 0; i < n; i++) {
        let totalForceX = 0;
        let totalForceY = 0;

        // Berechnung der Kräfte zwischen Partikeln
        for (let j = 0; j < n; j++) {
            if (j == i) continue; //Eigenes Partikel überspringen
            let rx = restrictDistance(particles[j].positionX - particles[i].positionX);
            let ry = restrictDistance(particles[j].positionY - particles[i].positionY);


            const r = Math.hypot(rx, ry); //Abstand zwischen den Partikeln aber nicht hoch 2!
            if (r > 0 && r < rMax) {
                const f = force(r / rMax, matrix[particles[i].color][particles[j].color]);
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

function setMatrixSize() { //Beim drücken von Set Matrix Size Button soll eine neue Matrix mit dem Wert im Input Feld als Grösse gemacht werden
    var newSize = parseInt(document.getElementById("matrix-size").value);
    if (isNaN(newSize) || newSize < 1) {
        return;
    }

    m = newSize;


    matrix = makeRandomMatrix();

    //Neue Initialisierung der Partikel
    particles = initializeParticles(n, m);


    createMatrixUserInterface(m, matrix);
}

const setMatrixSizeButton = document.getElementById("set-matrix-size-button");
setMatrixSizeButton.addEventListener("click", setMatrixSize);