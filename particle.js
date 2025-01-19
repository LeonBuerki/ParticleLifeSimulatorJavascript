export class Particle {
    constructor(color, positionX, positionY, velocityX, velocityY) {
        this.color = color;
        this.positionX = positionX;
        this.positionY = positionY;
        this.velocityX = velocityX; 
        this.velocityY = velocityY;
    }

    updatePosition(dt) {
        this.positionX += this.velocityX * dt;
        this.positionY += this.velocityY * dt;

        // Periodische Grenzen: Halte Position zwischen 0 und 1
        this.positionX = this.transitionPosition(this.positionX);
        this.positionY = this.transitionPosition(this.positionY);
    }

    updateVelocity(dt, frictionFactor, totalForceX, totalForceY) {
         //Reibung
         this.velocityX *= frictionFactor;
         this.velocityY *= frictionFactor;
 
         //Geschwindigkeit aktualisieren
        this.velocityX += totalForceX * dt;
        this.velocityY += totalForceY * dt;
    }

    transitionPosition(position) { //Macht, dass position zwischen 0 und 1 bleibt, also auf dem Screen
        if (position < 0) return position + 1; // Links / oben raus -> rechts / unten wieder rein
        if (position > 1) return position - 1; // Rechts / unten raus -> links / oben wieder rein
        return position; //Keine Veränderung
    }


}

export function restrictDistance(distance) { //Distanz zwischen zwei Partikel soll zwischen -0.5 und 0.5 sein, weil das die kürzeste Distanz mit periodischen Grenzen ist
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


export function drawParticles(ctx, particles, canvas, m) {
    ctx.fillStyle = "black"; //Canvas leeren
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //Zeichnen der Partikel
    particles.forEach(particle => {
        ctx.beginPath();
        const screenX = particle.positionX * canvas.width;
        const screenY = particle.positionY * canvas.height;
        ctx.arc(screenX, screenY, 1, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${360 * (particle.color / m)}, 100%, 50%)`;
        ctx.fill();
    });
}

export function initializeParticles(n, m) {
    let particles = [];
    for (let i = 0; i < n; i++) {
        let color = Math.floor(Math.random() * m); //Random Farbe
        let positionX = Math.random(); //Zufällige Positionen von 0 bis 1
        let positionY = Math.random();
        let velocityX = 0; //Geschwindigkeit = 0 am Anfang
        let velocityY = 0;

        let particle = new Particle(color, positionX, positionY, velocityX, velocityY);
        particles.push(particle);
    }
    return particles;
}

export function setRandomParticlePositions(particles) { //Stellt auch die Geschwindigkeiten der Partikel wieder auf 0
    particles.forEach(particle => {
    particle.positionX = Math.random(); //Zufällige Positionen
    particle.positionY = Math.random();
    particle.velocityX = 0;
    particle.velocityY = 0;
    });
}

//Berechnung der Kraft abhängig vom Abstand r und dem Anziehungsfaktor a
export function force(r, a) {
    const equilibrium = 0.2; //equilibrium = Der Punkt, bei dem die Kraft im Gleichgewicht ist also f = 0 zwischen abstossend und anziehend
    if (r < equilibrium) { //abstossend
        return r / equilibrium - 1;
    } else if (equilibrium < r && r < 1) {
        return a * (1 - Math.abs(2 * r - 1 - equilibrium) / (1 - equilibrium));
    } else {
        return 0;
    }
}