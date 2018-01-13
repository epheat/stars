// created by Evan Heaton on 01/06/18

const G = 10;

var canvas;
var testStar;
var testShootingStar;
var universe;

function windowResized() {
  //console.log('resized');
  resizeCanvas(displayWidth, displayHeight);
}

function setup() {

  canvas = createCanvas(displayWidth, displayHeight);
  canvas.position(0, 0);
  canvas.parent('canvasWrapper');
  stroke(0, 0, 0, 0);
  // testStar = new Star(100, 100, 20, 5, 0.5, 0.02, 0.2, {red: 200, blue: 100, green: 50});
  // testShootingStar = new ShootingStar(100, 100, 0, 15, 10, 0.9);
  universe = new Universe(60);
}

function draw() {
  background(0, 0, 0);
  // testShootingStar.advance();
  // testShootingStar.render();
  // testStar.advance();
  // testStar.render();
  universe.advance();
  universe.render();
}

// Planet
function Planet(x0, y0, v0, theta0, mass, radius, colors) {
  this.x = x0;
  this.y = y0;
  this.accelerationX = 0;
  this.accelerationY = 0;
  this.velocityX = v0 * Math.cos(theta0);
  this.velocityY = v0 * Math.sin(theta0);
  this.theta = theta0;
  this.mass = mass;
  this.radius = radius;
  this.colors = colors;

  this.outOfBounds = function() {
    return this.x + this.radius < 0 || this.x - this.radius > displayWidth ||
          this.y + this.radius < 0 || this.y - this.radius > displayHeight;
  }

  this.applyForce = function(force, theta) {
    // console.log(`force: ${force}`);
    // console.log(`theta: ${theta}`);
    var forceX = force * Math.cos(theta);
    var forceY = force * Math.sin(theta);
    this.accelerationX += forceX / this.mass;
    this.accelerationY += forceY / this.mass;
  }

  this.attract = function(planet) {

    var force = G * this.mass * planet.mass / Math.pow(distance(this.x, this.y, planet.x, planet.y), 2);
    var theta, theta2;
    if (this.x > planet.x) {
      theta2 = Math.atan((planet.y - this.y) / (planet.x - this.x));
      theta = theta2 + PI;
    } else {
      theta = Math.atan((planet.y - this.y) / (planet.x - this.x));
      theta2 = theta + PI;
    }

    // console.log(theta);
    this.applyForce(force, theta);
    planet.applyForce(force, theta2);
  }

  this.advance = function() {

    // console.log(`accelerationX: ${this.accelerationX}`);

    stroke(255, 255, 255);
    line(this.x, this.y, this.x + (this.accelerationX * 1000), this.y + (this.accelerationY * 1000));

    this.velocityX += this.accelerationX;
    this.velocityY += this.accelerationY;

    this.x += this.velocityX;
    this.y += this.velocityY;

    // acceleration should be reset every tick
    this.accelerationX = 0;
    this.accelerationY = 0;

  }

  this.render = function() {

    strokeWeight(2.0);
    stroke(this.colors[0].red, this.colors[0].green, this.colors[0].blue);
    fill(this.colors[1].red, this.colors[1].green, this.colors[1].blue);
    arc(this.x, this.y, this.radius, this.radius, 0, PI);
    fill(this.colors[0].red, this.colors[0].green, this.colors[0].blue);
    arc(this.x, this.y, this.radius, this.radius, PI, 2 * PI);

    stroke(0, 0, 0, 0)
    fill(160, 160, 160);
    textSize(12);
    text(`mass: ${this.mass}`, this.x + this.radius / 2, this.y - this.radius / 2);

  }

}


// Shooting Star
function ShootingStar(x0, y0, theta0, speed, lifespan, intensity0) {
  this.x0 = x0;
  this.y0 = y0;
  this.x = x0;
  this.y = y0;
  this.radius = randomF(3.0, 4.0);
  this.theta = theta0;
  this.speed = speed;
  this.life = lifespan;
  this.intensity = intensity0;
  this.dead = false;
  this.expired = false;

  this.die = function() {
    this.dead = true;
  }

  this.advance = function() {
    if (this.dead) {
      this.intensity -=0.06;
      if (this.intensity <=0) {
        this.expired = true;
      }
    } else {
      this.life--;
      if (this.life == 0) {
        this.die();
      }
      this.x += (this.speed*Math.cos(this.theta));
      this.y += (this.speed*Math.sin(this.theta));
    }
  }

  this.render = function() {
    //render the tail
    strokeWeight(1.2);
    strokeCap(ROUND);
    stroke(this.intensity*255, this.intensity*255, this.intensity*30);
    line(this.x0, this.y0, this.x, this.y);
    //render the star
    stroke(0, 0, 0, 0);
    fill(this.intensity*255, this.intensity*255, 0);
    ellipse(this.x, this.y, this.radius);
  }
}

// x0 = initial x position
// y0 = initial y position
// r0 = star outer radius
// legs = # of legs in the star
// fallingSpeed = added to y position every advance
// rotationSpeed = added to rotation every advance
// flexSpeed = determines speed at which innerRadius grows and shrinks
// color = {red, blue, green}
function Star(x0, y0, r0, legs, fallingSpeed, rotationSpeed, flexSpeed, color) {
  this.rotation = 0;
  this.x = x0;
  this.y = y0;
  this.radius = r0;
  this.innerRadius = this.radius / 3;
  this.legs = legs;
  this.fallingSpeed = fallingSpeed;
  this.rotationSpeed = rotationSpeed;
  this.flexSpeed = flexSpeed;
  this.color = color;

  this.flexing = true;

  this.render = function() {
    stroke(0, 0, 0, 0);
    fill(this.color.red, this.color.green, this.color.blue);
    beginShape();
    // some weird shit to render the vertices of the star
    for (var i=0; i<this.legs; i++) {
      var outerAngle = i / this.legs * 2 * Math.PI;
      var innerAngle = (2*i+1) / (2*this.legs) * 2 * Math.PI;
      vertex(this.x + this.radius * Math.cos(outerAngle + this.rotation), this.y + this.radius * Math.sin(outerAngle + this.rotation));
      vertex(this.x + this.innerRadius * Math.cos(innerAngle + this.rotation), this.y + this.innerRadius * Math.sin(innerAngle + this.rotation));
    }
    endShape(CLOSE);
  }

  this.advance = function() {
    if (this.flexing) {
      this.innerRadius += this.flexSpeed;
      if (this.innerRadius >= (this.radius/2)) {
        this.flexing = false;
      }
    } else {
      this.innerRadius -= this.flexSpeed;
      if (this.innerRadius <= 1) {
        this.flexing = true;
      }
    }
    this.y += this.fallingSpeed;
    this.rotation += this.rotationSpeed;
  }

  this.outOfBounds = function() {
    return this.y > displayHeight + this.radius;
  }
}

function Universe(numStars) {
  this.stars = [];
  this.shootingStars = [];
  this.planets = [];

  this.pushRandomPlanet = function() {
    // Planet(x0, y0, v0, theta0, mass, radius, colors)
    this.planets.push(new Planet(randomOR(0, displayWidth), randomOR(0, displayHeight),
      randomF(0.1, 5), randomF(0, 2 * Math.PI), randomInt(100, 500), randomF(10, 30),
      [randomColor(), randomColor()]));
  }

  this.pushRandomStar = function() {
    this.stars.push(new Star(randomF(0, displayWidth), 0, randomF(1, 15),
      randomInt(4, 9), randomF(0.1, 0.8), randomF(-0.03, 0.03), randomF(0.05, 0.2),
      {red: randomInt(0, 255), green: randomInt(0, 255), blue: randomInt(0, 255)}));
  }
  this.pushRandomYellowStar = function() {
    var yellowIntensity = randomInt(100, 255);
    this.stars.push(new Star(randomF(0, displayWidth), 0, randomF(3, 18),
      randomInt(4, 9), randomF(0.1, 0.8), randomF(-0.03, 0.03), randomF(0.05, 0.14),
      {red: yellowIntensity, green: yellowIntensity, blue: randomInt(0, 10)}));
  }
  this.pushRandomShootingStar = function() {
    // ShootingStar(x0, y0, theta0, speed, lifespan, intensity0)
    this.shootingStars.push(new ShootingStar(randomF(0, displayWidth), randomF(0, displayHeight),
    randomF(0, 2*Math.PI), randomF(18, 35), randomInt(8, 20), randomF(0.6, 0.82)));
  }

  for (var i=0; i<numStars; i++) {
    this.pushRandomYellowStar();
  }

  this.advance = function() {
    //advance all the stars
    for (var i=0; i<this.stars.length; i++) {
      if (this.stars[i].outOfBounds()) {
        this.stars.splice(i, 1);
        this.pushRandomYellowStar();
      } else {
        this.stars[i].advance();
      }
    }
    // advance (and maybe spawn more) shooting stars
    for (var i=0; i<this.shootingStars.length; i++) {
      if (this.shootingStars[i].expired) {
        this.shootingStars.splice(i, 1);
      } else {
        this.shootingStars[i].advance();
      }
    }
    // advance planets
    for (var i=0; i<this.planets.length; i++) {
      for (var j=i+1; j<this.planets.length; j++) {
        // attract these two planets
        this.planets[i].attract(this.planets[j]);
      }
    }
    for (var i=0; i<this.planets.length; i++) {
      if (this.planets[i].outOfBounds()) {
        this.planets.splice(i, 1);
        // console.log(this.planets);
      } else {
        this.planets[i].advance();
      }
    }


    if (randomInt(0, 100) == 0) {
      this.pushRandomShootingStar();
      // console.log(this.shootingStars);
    }
    if (randomInt(0, 80) == 0) {
      this.pushRandomPlanet();
    }
  }
  this.render = function() {
    for (var i=0; i<this.planets.length; i++) {
      this.planets[i].render();
    }
    for (var i=0; i<this.stars.length; i++) {
      this.stars[i].render();
    }
    for (var i=0; i<this.shootingStars.length; i++) {
      this.shootingStars[i].render();
    }
  }
}


function randomF(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomF(min, max));
}

function randomOR(one, other) {
  if (randomInt(0, 2) == 0) {
    return one;
  } else {
    return other;
  }
}

function randomColor() {
  return { red: randomInt(0, 255), green: randomInt(0, 255), blue: randomInt(0, 255) };
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
}
