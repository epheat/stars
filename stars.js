// created by Evan Heaton on 01/06/18

// gravitational constant (alter to taste)
const G = 0.1;
const GRAVITATION_G = 0.2
const AIR_RESISTANCE = 0.0025;
const FRAME_RATE = 60;
const GRAVITATION_MASS = 20000;

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
  frameRate(FRAME_RATE);
  universe = new Universe(40);
}

var rotation = 0;
function draw() {
  background(0, 0, 0);
  // rotation += PI / 720;
  // translate(-displayWidth / 2, -displayHeight / 2);
  // rotate(rotation);
  // translate(displayWidth / 2, displayHeight / 2);

  universe.advance();
  universe.render();
}

function mousePressed() {
  universe.activateMouseGravitation();
}

function mouseReleased() {
  universe.deactivateMouseGravitation();
}

function mouseMoved() {
  universe.updateMouseGravitation(mouseX, mouseY);
}

function mouseDragged() {
  universe.updateMouseGravitation(mouseX, mouseY);
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
  this.absorbed = false;
  this.absorbedPlanets = [];

  this.outOfBounds = function() {
    return this.x + this.radius < 0 || this.x - this.radius > displayWidth ||
          this.y + this.radius < 0 || this.y - this.radius > displayHeight;
  }

  this.absorb = function(planet) {
    this.absorbedPlanets.push(planet);

    // add Kinetic Energies of the two planets
    var kineticEnergyX = { energy: 0.5 * this.mass * this.velocityX * this.velocityX, sign: sign(this.velocityX)};
    var kineticEnergyY = { energy: 0.5 * this.mass * this.velocityY * this.velocityY, sign: sign(this.velocityY)};

    var planetEnergyX = { energy: 0.5 * planet.mass * planet.velocityX * planet.velocityX, sign: sign(planet.velocityX)};
    var planetEnergyY = { energy: 0.5 * planet.mass * planet.velocityY * planet.velocityY, sign: sign(planet.velocityY)};

    var resultingEnergyX, resultingEnergyY;
    if (kineticEnergyX.sign == planetEnergyX.sign) {
      resultingEnergyX = { energy: kineticEnergyX.energy + planetEnergyX.energy, sign: kineticEnergyX.sign};
    } else {
      if (kineticEnergyX.energy - planetEnergyX.energy < 0) {
        resultingEnergyX = { energy: planetEnergyX.energy - kineticEnergyX.energy, sign: planetEnergyX.sign }
      } else {
        resultingEnergyX = { energy: kineticEnergyX.energy - planetEnergyX.energy, sign: kineticEnergyX.sign }
      }
    }
    if (kineticEnergyY.sign == planetEnergyY.sign) {
      resultingEnergyY = { energy: kineticEnergyY.energy + planetEnergyY.energy, sign: kineticEnergyY.sign};
    } else {
      if (kineticEnergyY.energy - planetEnergyY.energy < 0) {
        resultingEnergyY = { energy: planetEnergyY.energy - kineticEnergyY.energy, sign: planetEnergyY.sign }
      } else {
        resultingEnergyY = { energy: kineticEnergyY.energy - planetEnergyY.energy, sign: kineticEnergyY.sign }
      }
    }

    this.mass += planet.mass;
    this.radius += Math.sqrt(planet.radius) / 2;
    for (var i=0; i<planet.colors.length; i++) {
      this.colors.push(planet.colors[i]);
    }

    this.velocityX = resultingEnergyX.sign * Math.sqrt(resultingEnergyX.energy * 2 / this.mass);
    this.velocityY = resultingEnergyY.sign * Math.sqrt(resultingEnergyY.energy * 2 / this.mass);
  }

  this.collidingWith = function(planet) {
    return Math.sqrt(Math.pow(planet.x - this.x, 2) + Math.pow(planet.y - this.y, 2)) < this.radius
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

  // pull the planet towards a gravitation
  this.pull = function(gravitation) {
    var force;
    if (distance(this.x, this.y, gravitation.x, gravitation.y) <= 30) {
      force = 0;
    } else {
      force = GRAVITATION_G * this.mass * GRAVITATION_MASS / Math.pow(distance(this.x, this.y, gravitation.x, gravitation.y), 2);
    }
    if (this.x > gravitation.x) {
      theta = Math.atan((gravitation.y - this.y) / (gravitation.x - this.x)) + PI;
    } else {
      theta = Math.atan((gravitation.y - this.y) / (gravitation.x - this.x));
    }
    this.applyForce(force, theta);
  }

  this.advance = function() {

    // console.log(`accelerationX: ${this.accelerationX}`);
    // uncomment to draw force vectors
    // stroke(255, 255, 255);
    // line(this.x, this.y, this.x + (this.accelerationX * 100), this.y + (this.accelerationY * 100));

    this.velocityX += this.accelerationX;
    this.velocityY += this.accelerationY;

    this.x += this.velocityX;
    this.y += this.velocityY;

    // decay of velocity (air resistance?)
    this.velocityX = decay(this.velocityX, AIR_RESISTANCE);
    this.velocityY = decay(this.velocityY, AIR_RESISTANCE);

    // acceleration should be reset every tick
    this.accelerationX = 0;
    this.accelerationY = 0;

  }

  this.render = function() {

    strokeWeight(2.5);
    stroke(this.colors[0].red, this.colors[0].green, this.colors[0].blue);
    var slice = PI / (this.colors.length-1);
    for (var i=1; i<this.colors.length; i++) {
      fill(this.colors[i].red, this.colors[i].green, this.colors[i].blue)
      arc(this.x, this.y, this.radius, this.radius, (i-1)*slice, i*slice);
    }
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

// container for GravitationLines, create one for each touch on screen.
function Gravitation(x, y) {
  this.x = x;
  this.y = y;
  this.active = false;
  this.gravitationLines = [];

  this.updatePosition = function(x, y) {
    this.x = x;
    this.y = y;
  }

  this.activate = function() {
    this.active = true;
  }
  this.deactivate = function() {
    this.active = false;
  }

  this.pushRandomGravitationLine = function() {
    // Gravitation(cX, cY, theta, length, intensity)
    this.gravitationLines.push(new GravitationLine(this.x, this.y, randomF(0, 2*Math.PI),
      randomInt(8, 38), randomF(0.6, 1)));
  }

  this.advance = function() {
    if (this.active && randomInt(0, 3) == 1) {
      this.pushRandomGravitationLine();
    }
    for (var i=0; i<this.gravitationLines.length; i++) {
      if (this.gravitationLines[i].expired) {
        this.gravitationLines.splice(i, 1);
      } else {
        this.gravitationLines[i].advance();
      }
    }
  }

  this.render = function() {
    for (var i=0; i<this.gravitationLines.length; i++) {
      this.gravitationLines[i].render();
    }
  }
}

// grayish markers around cursor to show pull
// should look kind of like shooting stars pulling inward
function GravitationLine(cX, cY, theta, length, intensity) {
  this.cX = cX;
  this.cY = cY;
  this.x0 = cX + ((15 + length) * Math.cos(theta));
  this.y0 = cY + ((15 + length) * Math.sin(theta));
  this.x = this.x0;
  this.y = this.y0;
  this.theta = theta;
  this.length = length;
  this.intensity = intensity;
  this.dead = false;
  this.expired = false;
  this.speed = 3;

  this.die = function() {
    this.dead = true;
  }

  this.advance = function() {
    if (this.dead) {
      this.intensity -= 0.04;
      if (this.intensity <= 0.06) {
        this.expired = true;
      }
    } else {
      if (sign(Math.cos(this.theta))) {

      }
      if (distance(this.x, this.y, this.cX, this.cY)  <= 15) {
        this.die();
      } else {
        this.x -= (this.speed * Math.cos(this.theta));
        this.y -= (this.speed * Math.sin(this.theta));
      }
    }
  }

  this.render = function() {
    // render the line
    strokeWeight(1.4);
    strokeCap(ROUND);
    stroke(this.intensity*150 + 60);
    line(this.x0, this.y0, this.x, this.y);
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
  this.gravitations = [new Gravitation(mouseX, mouseY)];

  this.activateMouseGravitation = function() {
    this.gravitations[0].activate();
  }
  this.deactivateMouseGravitation = function() {
    this.gravitations[0].deactivate();
  }
  this.updateMouseGravitation = function(x, y) {
    this.gravitations[0].updatePosition(x, y);
  }

  this.pushRandomPlanet = function() {
    var randomSide = randomInt(0, 4);
    var x, y, theta;
    if (randomSide == 0) { // from north
      x = randomF(0, displayWidth);
      y = -10;
      theta = randomF(0, Math.PI);
    } else if (randomSide == 1) { // from east
      x = displayWidth + 10;
      y = randomF(0, displayHeight);
      theta = randomF(Math.PI / 2, 3 * Math.PI / 2);
    } else if (randomSide == 2) { // from south
      x = randomF(0, displayWidth);
      y = displayHeight + 10;
      theta = randomF(Math.PI, 2 * Math.PI);
    } else { // from west
      x = -10;
      y = randomF(0, displayHeight);
      theta = randomF(3 * Math.PI / 2, 5 * Math.PI / 2);
    }
    // Planet(x0, y0, v0, theta0, mass, radius, colors)
    this.planets.push(new Planet(x, y,
      randomF(0.1, 3), theta, randomInt(1000, 5000), randomF(10, 30),
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
    // pull planets towards the gravitations
    for (var i=0; i<this.gravitations.length;i++) {
      if (this.gravitations[i].active) {
        for (var j=0; j<this.planets.length;j++) {
          this.planets[j].pull(this.gravitations[i]);
        }
      }
    }
    // advance the gravitations
    for (var i=0; i<this.gravitations.length;i++) {
      this.gravitations[i].advance();
    }
    // attract planets
    for (var i=0; i<this.planets.length; i++) {
      for (var j=i+1; j<this.planets.length; j++) {
        // if these planets collide, the one with greater mass should absorb the smaller planet
        if (this.planets[i].collidingWith(this.planets[j])) {
          if (this.planets[i].radius > this.planets[j].radius) {
            this.planets[i].absorb(this.planets[j]);
            this.planets[j].absorbed = true;
          } else {
            this.planets[j].absorb(this.planets[i]);
            this.planets[i].absorbed = true;
          }
        } else {
          // attract these two planets
          this.planets[i].attract(this.planets[j]);
        }
      }
    }
    // remove any out of bounds planets, advance the rest
    for (var i=0; i<this.planets.length; i++) {
      if (this.planets[i].outOfBounds() || this.planets[i].absorbed) {
        this.planets.splice(i, 1);
        i--;
      } else {
        this.planets[i].advance();
      }
    }

    // spawn new shooting stars
    if (randomInt(0, 150) == 0) {
      this.pushRandomShootingStar();
      // console.log(this.shootingStars);
    }
    // spawn new planets
    if (randomInt(0, 70) == 0) {
      this.pushRandomPlanet();
    }
  }
  this.render = function() {
    for (var i=0; i<this.stars.length; i++) {
      this.stars[i].render();
    }
    for (var i=0; i<this.shootingStars.length; i++) {
      this.shootingStars[i].render();
    }
    for (var i=0; i<this.planets.length; i++) {
      this.planets[i].render();
    }
    for (var i=0; i<this.gravitations.length; i++) {
      this.gravitations[i].render();
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

function decay(param, amt) {
  if (param == 0) {
    return param;
  } else if (param < 0) {
    return param + amt;
  } else {
    return param - amt;
  }
}

function sign(a) {
  if (a < 0) {
    return -1;
  } else if (a > 0) {
    return 1;
  } else {
    return 0;
  }
}
