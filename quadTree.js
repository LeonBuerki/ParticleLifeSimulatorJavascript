//Der Code für einen quadTree, wobei NICHT in jedem Quadrant die Anzahl Partikel und center-of-mass gespeichert wird,
//da ich mit dem quadTree nur für jedes Partikel im Radius von rMax berechnen will, was die Force ist, und das dafür 
//nicht nötig ist.

//

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
        const canvasX = particle.positionX * canvas.width;
        const canvasY = particle.positionY * canvas.height;
        if (canvasX >= this.x &&
            canvasX <= this.x + this.length &&
            canvasY >= this.y &&
            canvasY <= this.y + this.length) {
                return true
        } else {
            return false
        }
    }

    insert(particle, canvas) {
        if (!this.contains(particle, canvas)) { //Wenn das Partikel gar nicht in diesem Quadranten ist, soll gar nicht inserted werden
            return
        }

        if (this.children.length === 0) {
            //Das ist ein "external node"

            if (this.particle === null) {
                //Kein Partikel vorhanden, also füge es hinzu
                this.particle = particle;
            } else {
                //Partikel bereits vorhanden, also Quadrant unterteilen
                this.subdivide();
                //Das Partikel, das in diesem Quadranten ist, in eines der neu erstellten Quadranten einsetzen
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
                //Es wird rekursiv versucht, das neue Partikel in die 4 Kinder Quadranten hinzuzufügen
                this.children[i].insert(particle, canvas);
            }
        }
    }
}