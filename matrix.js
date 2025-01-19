export class Matrix {
    constructor(size, makeRandom) {
        this.size = size;
        this.makeRandom = makeRandom; //true oder false
        this.matrix = this.GenerateNewMatrix();
    }

   
    GenerateNewMatrix() { //Generiert eine neue Matrix der Anziehung
        const rows = [];
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                let value = 0;
                if (this.makeRandom) {
                    value = Math.round((Math.random() * 2 - 1)*100)/100;  //Wert zwischen 1 und -1 auf 2 Nachkommastellen gerundet
                }
                row.push(value);
            }
            rows.push(row);
        }
        return rows;
    }

    setMatrixSize() { //Beim drücken von Set Matrix Size Button soll eine neue Matrix mit dem Wert im Input Feld als Grösse gemacht werden
        var newSize = parseInt(document.getElementById("matrix-size").value);
        if (isNaN(newSize) || newSize < 1) {
            return;
        }
    
        this.size = newSize;
        this.matrix = this.GenerateNewMatrix();
        createMatrixUserInterface(this.size, this.matrix);
    }

}

export function createMatrixUserInterface(size, matrix) { //matrix mit m Reihen und m Spalten anzeigen auf Webseite, welche mit Random Zahlen gefüllt ist
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
            input.value = matrix[i][j]; //Wert der Matrix
            input.id = `reihe-${i}-spalte-${j}`;//Id hinzufügen, damit man sich auf diese Zelle beziehen kann
            matrixContainer.appendChild(input);

            // Event-Listener für Änderungen im Input-Feld
            input.addEventListener("input", (event) => {
                let newValue = parseFloat(event.target.value); //Wert im Feld lesen und in Float umwandeln
                if (isNaN(newValue)) { //Wenn ungültig z.B. Buchstabe, dann soll der Wert 0 sein
                    newValue = 0;
                } 
                matrix[i][j] = newValue; // Matrix aktualisieren
            });
        }
    }
}