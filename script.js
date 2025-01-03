const canvas = document.getElementById("my-canvas");
const ctx = canvas.getContext("2d");

const n = 1000; //Anzahl Partikel
const dt = 0.01; //DeltaZeit zwischen Frames
const frictionHalfLife = 0.02; //Halbwertszeit der Reibung
const rMax = 0.1; //Maximale Distanz, bei der noch eine Kraft ausgeübt wird
const m = 6; //Anzahl Farben
const matrix = makeRandomMatrix();
const forceFactor = 20; //Verstärkungsfaktor der Kraft

const frictionFactor = Math.pow(0.5, dt / frictionHalfLife); //Reibungsfaktor basierend auf Halbwertzeit

function makeRandomMatrix() { //Generiert eine zufällige Matrix der Anziehung
    const rows = [];
    for (let i = 0; i < m; i++) {
        const row = [];
        for (let j = 0; j < m; j++) {
            row.push(Math.random() * 2 - 1); //Wert zwischen 1 und -1
        }
        rows.push(row);
    }
    return rows;
}

//Arrays für Partikeleigenschaften
const colors = new Int32Array(n);
const positionsX = new Float32Array(n);
const positionsY = new Float32Array(n);
const velocitiesX = new Float32Array(n);
const velocitiesY = new Float32Array(n);

//Initialisierung der Partikel
for (let i = 0; i < n; i++) {
    colors[i] = Math.floor(Math.random() * m); //Random Farbe
    positionsX[i] = Math.random(); //Zufällige Positionen
    positionsY[i] = Math.random();
    velocitiesX[i] = 0; //Geschwindigkeit = 0 am Anfang
    velocitiesY[i] = 0;
}

function loop() {
    updateParticles();

    ctx.fillStyle = "black"; //Canvas leeren
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //Zeichnen der Partikel
    for (let i = 0; i < n; i++) {
        ctx.beginPath();
        const screenX = positionsX[i] * canvas.width;
        const screenY = positionsY[i] * canvas.height;
        ctx.arc(screenX, screenY, 1, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${360 * (colors[i] / m)}, 100%, 50%)`;
        ctx.fill();
    }

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
            let rx = positionsX[j] - positionsX[i];
            let ry = positionsY[j] - positionsY[i];

            rx = restrictDistance(rx); //Kürzeste Distanz zwischen den 2 Partikel wenn periodische Grenzen berücksichtigt werden
            ry = restrictDistance(ry);

            const r = Math.hypot(rx, ry); //Abstand zwischen den Partikeln aber nicht hoch 2!
            if (r > 0 && r < rMax) {
                const f = force(r / rMax, matrix[colors[i]][colors[j]]); //Wieso r/ rMax???????
                totalForceX += (rx / r) * f; //Kraft f (Skalar) wird mit dem Richtungsvektor (rx / r) multipliziert und dann der totalforceX addiert
                totalForceY += (ry / r) * f;
            }
        }

        //Skalierung
        totalForceX *= rMax * forceFactor;
        totalForceY *= rMax * forceFactor;

        //Reibung
        velocitiesX[i] *= frictionFactor;
        velocitiesY[i] *= frictionFactor;

        //Geschwindigkeit aktualisieren
        velocitiesX[i] += totalForceX * dt;
        velocitiesY[i] += totalForceY * dt;
    }

    //Position aktualisieren
    for (let i = 0; i < n; i++) {
        positionsX[i] += velocitiesX[i] * dt;
        positionsY[i] += velocitiesY[i] * dt;

        //periodische Ränder 
        positionsX[i] = transitionPosition(positionsX[i]);
        positionsY[i] = transitionPosition(positionsY[i]);
    }
}

//Berechnung der Kraft abhängig vom Abstand r und dem Anziehungsfaktor a
function force(r, a) {
    const equilibrium = 0.2; //equilibrium = Der Punkt, bei dem die Kraft im Gleichgewicht ist also f = 0 zwischen abstossend und anziehend
    if (r < equilibrium) {
        return r / equilibrium - 1;
    } else if (equilibrium < r && r < 1) {
        return a * (1 - Math.abs(2 * r - 1 - equilibrium) / (1 - equilibrium));
    } else {
        return 0;
    }
}

function transitionPosition(position) { //Macht, dass position zwischen 0 und 1 bleibt, also auf dem Screen
    if (position < 0) return position + 1; // Links / oben raus -> rechts / unten wieder rein
    if (position > 1) return position - 1; // Rechts / unten raus -> links / oben wieder rein
    return position; //Keine Veränderung
}

function restrictDistance(distance) { //Distanz zwischen zwei Partikel soll zwischen -0.5 und 0.5 sein, weil das die kürzeste Distanz mit periodischen Grenzen ist
    if (distance > 0.5) {
        return distance - 1; //z.B. Wenn Distanz 0.8 ist, gibt es -0.2 zurück, was auch die kürzere Distanz ist
    }

    else if (distance < -0.5) { //z.B. Wenn Distanz -0.9 ist. gibt es 0.1 zurück
        return distance + 1;
    }
    else{
        return distance; //Keine Veränderung
    }
}