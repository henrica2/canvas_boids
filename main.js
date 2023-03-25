import { Vector2 } from "./vector.js"

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const c = canvas.getContext("2d");
// window.addEventListener("mousemove", handleMouseMove);

// Mouse setup for testing heading
// let mouse = {
//     xPos: null,
//     yPos: null,
//     isDown: false
// }

// function handleMouseMove(event) {
//     mouse.xPos = event.clientX;
//     mouse.yPos = event.clientY;
// }

class Boid {
    constructor(position, velocity, mass) {
        this.position = position;
        this.velocity = velocity;
        this.acceleration = new Vector2(0, 0);
        this.mass = mass;
        
        this.maxSpeed = 5;
        this.maxForce = 10;
        
        this.wanderDist = 150;
        this.wanderR1 = 75;
        this.wanderR2 = 10;
        this.wanderIv = Math.random() * (Math.PI - (-1 * Math.PI)) + (-1 * Math.PI);
        this.wanderPoint = new Vector2(Math.sin(this.wanderIv), Math.cos(this.wanderIv));

        this.perceptionRadius = 50;
        
    }

    applyForce(force) {
        force.setMag(clamp(force.getMag(), 0, this.maxForce));
        force.divide(this.mass);
        this.acceleration.add(force);
    }

    update() {
        this.velocity.add(this.acceleration);
        this.velocity.setMag(clamp(this.velocity.getMag(), 0, this.maxSpeed));
        this.position.add(this.velocity);
        this.acceleration.scale(0);
    }

    draw() {
        const r = Math.sqrt(this.mass) * 10;
        const heading = this.velocity.getHeading();
        
        c.translate(this.position.x, this.position.y);
        c.rotate(heading);
        c.translate(-1 * this.position.x, -1 * this.position.y);

        c.beginPath();
        c.moveTo(this.position.x, this.position.y);
        c.lineTo(this.position.x, this.position.y + (r / 3));
        c.lineTo(this.position.x + r, this.position.y);
        c.lineTo(this.position.x, this.position.y - (r / 3));
        c.lineTo(this.position.x, this.position.y + (r / 3));
        c.closePath();

        c.lineWidth = 4;
        c.stroke();

        c.fillStyle = 'grey';
        c.fill();

        c.resetTransform();

        // wander debugging draws
        
        // c.lineWidth = 2;
        // c.beginPath();
        // c.arc(this.wanderAnchor.x, this.wanderAnchor.y, this.wanderR1, 0, 2 * Math.PI);
        // c.stroke();
        // c.beginPath();
        // c.arc(this.wanderAnchor.x, this.wanderAnchor.y, 1, 0, 2 * Math.PI);
        // c.stroke();

        // c.beginPath();
        // c.arc(this.wanderPoint.x, this.wanderPoint.y, this.wanderR2, 0, 2 * Math.PI);
        // c.stroke();
        // c.beginPath();
        // c.arc(this.wanderPoint.x, this.wanderPoint.y, 1, 0, 2 * Math.PI);
        // c.stroke();

        // c.beginPath();
        // c.moveTo(this.position.x, this.position.y);
        // c.lineTo(this.wanderAnchor.x, this.wanderAnchor.y);
        // c.stroke();

        // c.beginPath();
        // c.moveTo(this.position.x, this.position.y);
        // c.lineTo(this.wanderPoint.x, this.wanderPoint.y);
        // c.stroke();

        // c.beginPath();
        // c.arc(this.newPoint.x, this.newPoint.y, 2, 0, 2 * Math.PI);
        // c.stroke();

        // Other debugging draws
        
        // c.lineWidth = 2;
        // c.beginPath();
        // c.arc(this.position.x, this.position.y, this.perceptionRadius, 0, 2 * Math.PI);
        // c.stroke();

    }

    // seek function for testing heading
    // seek(mouse) {
    //     let mPos = new Vector2 (mouse.xPos, mouse.yPos);
        
    //     // Calculate steering force with desired velocity - velocity
    //     let force = Vector2.subVector2(mPos, this.position);
    //     force.sub(this.velocity);
    //     this.applyForce(force);
    // }

    flock(boids) {
        let aForce = new Vector2(0, 0);
        let cForce = new Vector2(0, 0);
        let sForce = new Vector2(0, 0);
        let totalForce = new Vector2(0, 0);
        let total = 0;
        // Loop over all boids to find those in perceptionRange
        for (const boid of boids) {
            let distance = Vector2.subVector2(boid.position, this.position);
            if (boid != this && distance.getMag() < this.perceptionRadius) {
                // get allignment
                aForce.add(boid.velocity);
                // get cohesion
                cForce.add(boid.position);
                // get seperation
                let difference = Vector2.subVector2(this.position, boid.position);
                difference.divide(distance);
                sForce.add(difference);

                total++;
            }
        }
        if (total > 0) {
            // average forces
            aForce.divide(total);
            cForce.divide(total);
            sForce.divide(total);

            // set as a steering force
            aForce.sub(this.velocity);
            cForce.sub(this.position);
            sForce.sub(this.velocity);
            
            // scale by magic const
            aForce.scale(allScale);
            cForce.scale(cohScale);
            sForce.scale(sepScale);
            
            // force = a + c + s
            totalForce.add(aForce);
            totalForce.add(cForce);
            totalForce.add(sForce);

            // apply force
            this.applyForce(totalForce);
        }
    }

    wander() {
        // Update the wander anchor point
        this.wanderAnchor = new Vector2(this.velocity.x, this.velocity.y);
        this.wanderAnchor.setMag(this.wanderDist);
        this.wanderAnchor.add(this.position);

        // Update the wander point
        const wanderUpdate = Math.random() * (Math.PI - (-1 * Math.PI)) + (-1 * Math.PI);
        this.newPoint = new Vector2(Math.sin(wanderUpdate), Math.cos(wanderUpdate));
        this.newPoint.setMag(this.wanderR2);
        this.newPoint.add(this.wanderPoint);

        this.wanderPoint = Vector2.subVector2(this.newPoint, this.wanderAnchor);
        this.wanderPoint.setMag(this.wanderR1);
        this.wanderPoint.add(this.wanderAnchor);

        // Apply steering force towards the wander point
        let force = Vector2.subVector2(this.wanderPoint, this.position);
        force.sub(this.velocity);
        this.applyForce(force);
    }

    wrap() {
        if (this.position.y < 0) {
            this.position.y = canvas.height;
        }
        if (this.position.y > canvas.height) {
            this.position.y = 0;
        }
        if (this.position.x < 0) {
            this.position.x = canvas.width;
        }
        if (this.position.x > canvas.width) {
            this.position.x = 0;
        }
    }

    // edges() {
    // }
}

function clamp(a, b, c) {
    return Math.max(Math.min(a, Math.max(b, c)), Math.min(b, c));
}

function startAnimating(framerate) {
    frameInterval = 1000 / framerate;
    then = Date.now();
    startTime = then;
    update();
}

function update() {
    requestAnimationFrame(update);
    now = Date.now();
    elapsed = now - then;
    if (elapsed > frameInterval) {
        then = now - (elapsed % frameInterval);
        // animation code
        c.clearRect(0, 0, canvas.width, canvas.height);
        for (const element of boids) {
            element.wander();
            element.flock(boids);
            element.update();
            element.draw();
            element.wrap();
        }
    }
}

const framerate = 60;
let startTime, now, then, elapsed, frameInterval;
const allScale = 5;
const cohScale = 1.75;
const sepScale = 1.75;
let boids = [];
for (let i = 0; i < 200; i++) {
    let startPos = new Vector2(Math.random() * canvas.width, Math.random() * canvas.height);
    let startVel = new Vector2(Math.random(), Math.random());
    let boid = new Boid(startPos, startVel, 5);
    boids.push(boid);
}

startAnimating(framerate);
