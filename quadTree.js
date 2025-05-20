//Der Code für einen quadTree, wobei NICHT in jedem Quadrant die Anzahl Partikel und center-of-mass gespeichert wird,
//da ich mit dem quadTree nur für jedes Partikel im Radius von rMax berechnen will, was die Force ist, und das dafür 
//nicht nötig ist.

//In jedem internal node ist this.particle = null, in den external nodes ist this.particle = null, wenn es dort kein Partikel gibt,
//und sonst ist this.particle = das Partikel, welches dort drinnen ist

export class Quadrant { 
    constructor(x, y, length) { //x = x Koordinate vom Punkt oben links, y = y Koordinate vom Punkt oben links, length = width = height
        this.x = x;
        this.y = y;
        this.length = length;
        this.children = []; //wenn der Quadrant aufgeteilt wird, werden hier die 4 untergestellten Quadranten referenziert
        this.particle = null; //null bedeutet, es ist noch kein Partikel drinnen
    }

    drawQuadrant(ctx) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1; 
        ctx.strokeRect(this.x, this.y, this.length, this.length);

        //Zeichnen der 4 untergeordneten Quadranten, falls der Quadrant unterteilt wurde
        if (this.children.length > 0) {
            for (let i = 0; i < 4; i++) {
                this.children[i].drawQuadrant(ctx);
            }
        }
    }

    subdivide() {
        let halfLength = this.length / 2;
        let nw = new Quadrant(this.x, this.y, halfLength);
        let ne = new Quadrant(this.x + halfLength, this.y, halfLength);
        let sw = new Quadrant(this.x, this.y + halfLength, halfLength);
        let se = new Quadrant(this.x + halfLength, this.y + halfLength, halfLength);

        this.children.push(nw, ne, sw, se);
    }

    contains(particle, canvas) {
        //Hochgerechnete Position der Koordinaten der Partikel, welche zwischen 0 und 1 sind
        const canvasX = particle.positionX * canvas.width; 
        const canvasY = particle.positionY * canvas.height;

        return (canvasX >= this.x &&
            canvasX <= this.x + this.length &&
            canvasY >= this.y &&
            canvasY <= this.y + this.length)
    }

    insert(particle, canvas) {
        if (!this.contains(particle, canvas)) { //Wenn das Partikel gar nicht in diesem Quadranten ist, soll gar nicht inserted werden
            return
        }

        if (this.children.length === 0) {
            //Das ist ein "external node", es hat keine "Kinderquadranten"

            if (this.particle === null) {
                //Kein Partikel vorhanden, also füge das einzufügende Partikel hinzu
                this.particle = particle;
            } else {
                //Partikel bereits vorhanden, also Quadrant unterteilen
                this.subdivide();
                //Das Partikel, das in dem aktuellen Quadranten ist, in eines der neu erstellten Quadranten einsetzen
                for (let i = 0; i < 4; i++) {
                    this.children[i].insert(this.particle, canvas);
                }
                 // Entferne das Partikel vom aktuellen Quadranten
                 this.particle = null;

                 //Das neu einzusetzende Partikel in eines der neuen Quadranten einsetzen
                 for (let i = 0; i < 4; i++) {
                     this.children[i].insert(particle, canvas);
                 }
            }
        } else {
            //Das ist ein "internal node"
            for (let i = 0; i < 4; i++) {
                //Es wird rekursiv versucht, das neue Partikel in die 4 Kinder Quadranten hinzuzufügen, es geht so die internal nodes durch, bis es einen external node findet
                this.children[i].insert(particle, canvas);
            }
        }
    }

    query(range, found = [], canvas) { //range ist ein Objekt (Quadrat oder Kreis); found ist die Liste, in welcher alle gefundenen Parikel in der Range sind
        if (!range.intersects(this.x, this.y, this.length)) { //Wenn die Range Fläche und der Quadrant sich nicht überschneiden
            return found;
          }
        
          if (this.children.length > 0) {
            for (let i = 0; i < 4; i++) {
                this.children[i].query(range, found, canvas); //Die Liste wird übertragen als Parameter, sodass am Schluss alle gefundenen in einer Liste sind
            }
            return found;
          }
        
          if (this.particle != null) {
            if (range.contains(this.particle, canvas)) {
              found.push(this.particle);
            }
          }
      
          return found;
    }
}

export class Square {
    constructor(x, y, length) { //x y = Koordinaten oben links, length = ganze Breite des Quadrats
        this.x = x;
        this.y = y;
        this.length = length;
    }

    intersects(quadrant_x, quadrant_y, quadrant_length) { // Ist es NICHT möglich, dass Quadrate sich überschneiden --> return false
        return !(this.x > quadrant_x + quadrant_length || 
            this.x + this.length < quadrant_x ||
            this.y > quadrant_y + quadrant_length ||
            this.y + this.length < quadrant_y)
    }

    contains(particle, canvas) {
        //Hochgerechnete Position der Koordinaten der Partikel, welche eigentlich zwischen 0 und 1 sind
        const canvasX = particle.positionX * canvas.width; 
        const canvasY = particle.positionY * canvas.height;

        return (canvasX >= this.x &&
            canvasX <= this.x + this.length &&
            canvasY >= this.y &&
            canvasY <= this.y + this.length)
    }

    draw(ctx) {
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1; 
        ctx.strokeRect(this.x, this.y, this.length, this.length);
    }
}

export class Circle {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    intersects(quadrant_x, quadrant_y, quadrant_length) {
        const xDist = Math.abs(this.x - (quadrant_x + quadrant_length / 2));
        const yDist = Math.abs(this.y - (quadrant_y + quadrant_length / 2));
        const r = this.radius;
        const half = quadrant_length / 2;

        const edges = Math.pow(xDist - half, 2) + Math.pow(yDist - half, 2);

        if (xDist > (r + half) || yDist > (r + half)) return false;
        if (xDist <= half || yDist <= half) return true;
        return edges <= r * r;
    }

    contains(particle, canvas) {
        const canvasX = particle.positionX * canvas.width;
        const canvasY = particle.positionY * canvas.height;
        const dx = canvasX - this.x;
        const dy = canvasY - this.y;
        const distanceSquared = dx * dx + dy * dy;
        return distanceSquared < this.radius * this.radius;
    }

    draw(ctx) {
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 1; 
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI); 
        ctx.stroke(); 
    }
}