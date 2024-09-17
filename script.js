let snake;
let apples = [];

let w = 18;
let h = 13;
let cell = 50;
let offsetX = 0;
let offsetY = 0;
let intervalDefault = 300;
let interval = intervalDefault;
let rush = 140;

let ctx;
let bg;
let paperTex;

let renderSide = true;
let imgBody, imgHead, imgEat, imgFood;

let scaleBody = 0.6;
let scaleHead = 0.6;
let scaleFood = 0.5;

function preload() {
  paperTex = loadImage("img/paper.jpg");
  imgBody = loadImage("img/body.png");
  imgHead = loadImage("img/head.png");
  imgEat = loadImage("img/eat.png");
  imgFood = loadImage("img/food.png");
}

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  // createCanvas(600, 300);

  w = Math.floor(window.innerWidth / cell) - 1;
  h = Math.floor(window.innerHeight / cell) - 1;

  offsetX = (width - w * cell) * 0.5;
  offsetY = (height - h * cell) * 0.5;

  document.querySelector("body").addEventListener("keydown", (e) => {
    console.log(e);
    keyReceived(e.key);
  });

  document.querySelector("body").addEventListener("touchstart", (e) => {
    clickReceived(e.touches[0]);
  });

  drawBG();

  resetGame();
}

function draw() {
  imageMode(CORNER);
  image(bg, 0, 0);

  if (snake.play) {
    snake.update(apples, interval, interval);
  }
  apples.forEach((a) => {
    if (a.eaten) {
      a.randomPosition([snake], w, h);
    }
  });
  apples.forEach((a) => {
    a.display(offsetX + cell / 2, offsetY + cell / 2, cell, scaleFood);
  });
  snake.display(
    offsetX + cell / 2,
    offsetY + cell / 2,
    cell,
    scaleBody,
    scaleHead
  );
}

function drawBG() {
  bg = createGraphics(width, height);
  bg.imageMode(CENTER);
  bg.image(paperTex, width / 2, height / 2, w * cell, h * cell);
  
  bg.noStroke();
  bg.fill(255, 100);
  bg.rect(0, 0, width, height);
  
  ctx = bg.drawingContext;

  const radius = cell * 0.5;

  bg.fill(150);
  bg.noStroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.lineTo(0, 0);
  ctx.lineTo(offsetX + radius, offsetY);
  ctx.arcTo(offsetX, offsetY, offsetX, offsetY + radius, radius);
  ctx.lineTo(offsetX, height - offsetY - radius);
  ctx.arcTo(
    offsetX,
    height - offsetY,
    offsetX + radius,
    height - offsetY,
    radius
  );
  ctx.lineTo(width - offsetX - radius, height - offsetY);
  ctx.arcTo(
    width - offsetX,
    height - offsetY,
    width - offsetX,
    height - offsetY - radius,
    radius
  );
  ctx.lineTo(width - offsetX, offsetY + radius);
  ctx.arcTo(
    width - offsetX,
    offsetY,
    width - offsetX - radius,
    offsetY,
    radius
  );
  ctx.lineTo(0, offsetY);
  ctx.fill();
}

function resetGame() {
  snake = new Snake(
    floor(w / 2),
    floor(h / 2),
    7,
    interval,
    imgBody,
    imgHead,
    imgEat
  );
  apples = [];
  apples.push(new Apple(0, 0, imgFood));
  apples.forEach((a) => {
    a.randomPosition([snake], w, h);
  });
}

function clickReceived(e) {
  const cx = e.clientX / window.innerWidth - 0.5;
  const cy = e.clientY / window.innerHeight - 0.5;
  const angle = Math.floor(((Math.atan2(cy, cx) / Math.PI * 180 + 225) % 360) / 90);
  if (!snake.play) {
    snake.restart();
  }
  switch (angle) {
    case 0:
      snake.updateDir(2, rush);
      break;
    case 1:
      snake.updateDir(3, rush);
      break;
    case 2:
      snake.updateDir(0, rush);
      break;
    case 3:
      snake.updateDir(1, rush);
      break;
  }
}

function keyReceived(keyIs) {
  if (!snake.play) {
    snake.restart();
    switch (keyIs) {
      case '1':
      case 'a':
      case 'ArrowLeft':
        snake.updateDir(2, interval);
        break;
      case '2':
      case 'b':
      case 'ArrowRight':
        snake.updateDir(0, interval);
        break;
      case '3':
      case 'c':
      case 'ArrowUp':
        snake.updateDir(3, interval);
        break;
      case '4':
      case 'd':
      case 'ArrowDown':
        snake.updateDir(1, interval);
        break;
    }
  } else {
    switch (keyIs) {
      case '1':
      case 'a':
      case 'ArrowLeft':
        snake.updateDir(2, rush);
      break;
      case '2':
      case 'b':
      case 'ArrowRight':
        snake.updateDir(0, rush);
      break;
      case '3':
      case 'c':
      case 'ArrowUp':
        snake.updateDir(3, rush);
      break;
      case '4':
      case 'd':
      case 'ArrowDown':
        snake.updateDir(1, rush);
      break;
      case '5':
      case 'e':
      case ' ':
        if (interval !== intervalDefault) {
          interval = intervalDefault;
        } else {
          interval = rush;
        }
      break;
    }
  }

  switch (keyIs) {
    case '6':
    case 'f':
      resetGame();
      break;
  }

  return false;
}

class Snake {
  constructor(_x, _y, len, interval, imgB, imgH, imgE) {
    this.imageBody = imgB;
    this.imageHead = imgH;
    this.imageEat = imgE;

    this.body = [];
    for (let i = 0; i < len; i++) {
      this.body.push({ x: _x - len + i, y: _y });
    }

    this.interval = interval;
    this.timestamp = 0;
    this.ratio = 0;
    this.dir = 0;
    this.dirNew = 0;
    this.target = [...this.body];
    this.updateTarget();

    this.dead = false;
    this.play = false;
    this.eating = undefined;
    this.pause = false;
  }

  restart() {
    this.play = true;
    this.timestamp = millis();
  }

  update(apples, interv, intervEat) {
    this.ratio = (millis() - this.timestamp) / this.interval;
    if (this.ratio >= 1) {
      this.body = [...this.target];

      this.checkCollision();
      if (!this.pause) {
        this.updateTarget(apples, interv, intervEat);
      }
      this.ratio = 0;
    }
  }

  updateTarget(apples, interv, intervEat) {
    let eaten = false;

    if (this.eating) {
      eaten = true;
      this.eating.eat();
      this.eating = undefined;
    }

    this.dir = this.dirNew;
    this.interval = interv ? interv : this.interval;

    const headX = this.body.at(-1).x;
    const headY = this.body.at(-1).y;
    let newX = 0;
    let newY = 0;
    switch (this.dir) {
      case 0:
        newX = 1;
        break;
      case 1:
        newY = 1;
        break;
      case 2:
        newX = -1;
        break;
      case 3:
        newY = -1;
        break;
    }

    const thX = this.target.at(-1).x + newX;
    const thY = this.target.at(-1).y + newY;

    if (apples) {
      apples.forEach((a) => {
        if (a.x === thX && a.y === thY) {
          this.eating = a;
          this.interval = intervEat;
        }
      });
    }

    if (eaten) {
      // this.body.push({ ...this.body.at(-1) });
      // this.target.push({
      //   x: thX,
      //   y: thY,
      // });

      this.body.unshift({ ...this.body.at(0) });
      this.target.unshift({ ...this.body.at(0) });
      for (let i = 1; i < this.body.length; i++) {
        this.body[i] = { ...this.target[i] };
        if (i < this.body.length - 1) {
          this.target[i] = { ...this.target[i + 1] };
        } else {
          this.target[i] = {
            x: thX,
            y: thY,
          };
        }
      }
    } else {
      for (let i = 0; i < this.body.length; i++) {
        this.body[i] = { ...this.target[i] };
        if (i < this.body.length - 1) {
          this.target[i] = { ...this.target[i + 1] };
        } else {
          this.target[i] = {
            x: thX,
            y: thY,
          };
        }
      }
    }

    this.timestamp = millis();
  }

  updateDir(_dir, interv) {
    if (this.pause) {
      this.pause = false;
      this.dirNew = _dir;
    } else if (this.dir !== _dir && _dir % 2 !== this.dir % 2) {
      this.dirNew = _dir;
      this.interval = interv;
      this.timestamp = millis() - this.interval * this.ratio;
    }
  }

  checkCollision() {
    let newX = 0;
    let newY = 0;
    switch (this.dirNew) {
      case 0:
        newX = 1;
        break;
      case 1:
        newY = 1;
        break;
      case 2:
        newX = -1;
        break;
      case 3:
        newY = -1;
        break;
    }

    const nextX = this.body.at(-1).x + newX;
    const nextY = this.body.at(-1).y + newY;

    if (nextX < 0 || nextX >= w) {
      this.pause = true;
    } else if (nextY < 0 || nextY >= h) {
      this.pause = true;
    } else {
      this.target.forEach((t) => {
        if (nextX === t.x && nextY === t.y) {
          this.pause = true;
        }
      });
    }
  }

  display(_x, _y, cell, scl, sclH) {
    const seg = [];
    for (let i = 0; i < this.body.length; i++) {
      const ptA = this.body[i];
      const ptB = this.target[i];
      seg.push({ start: ptA, vec: { x: ptB.x - ptA.x, y: ptB.y - ptA.y } });
    }

    for (let i = 1; i < seg.length; i++) {
      const ptA = seg[i - 1];
      const ptB = seg[i];
      const aX = ptA.start.x + this.ratio * ptA.vec.x;
      const aY = ptA.start.y + this.ratio * ptA.vec.y;
      const bX = ptB.start.x + this.ratio * ptB.vec.x;
      const bY = ptB.start.y + this.ratio * ptB.vec.y;

      // strokeWeight(cell - 2);
      // stroke(0 + (i % 2) * 50);
      // noFill();
      // line(_x + cell * aX, _y + cell * aY, _x + cell * bX, _y + cell * bY);
      // if (i === seg.length - 1) {
      //   noStroke();
      //   fill(0, 100, 0);
      //   if (this.eating) {
      //     fill(0, 255, 0);
      //   }
      //   circle(_x + cell * bX, _y + cell * bY, cell);
      // }

      push();
      imageMode(CENTER);
      // translate((bX + aX) * 0.5 * cell + _x, (bY + aY) * 0.5 * cell + _y);
      translate(aX * cell + _x, aY * cell + _y);

      if (renderSide) {
        const dirX = bX - aX;
        const dirY = bY - aY;
        if (dirY === 0) {
          scale(dirX < 0 ? -scl : scl, scl);
        } else {
          scale(scl, dirX < 0 ? -scl : scl);
          rotate(dirX < 0 ? -atan2(bY - aY, bX - aX) : atan2(bY - aY, bX - aX));
        }
      } else {
        rotate(atan2(bY - aY, bX - aX));
        scale(scl);
      }

      image(this.imageBody, 0, 0);
      pop();

      if (i === seg.length - 1) {
        push();
        imageMode(CENTER);
        translate(bX * cell + _x, bY * cell + _y);
        if (renderSide) {
          // const dirX = bX - aX;
          // const dirY = bY - aY;
          // if (dirY === 0) {
          //   scale(dirX < 0 ? -sclH : sclH, sclH);
          // } else {
          //   scale(sclH, dirX < 0 ? -sclH : sclH);
          //   rotate(dirX < 0 ? -this.dirNew * HALF_PI : this.dirNew * HALF_PI);
          // }

          if (this.dirNew % 2 === 0) {
            scale(this.dirNew === 0 ? sclH : -sclH, sclH);
          } else {
            rotate(this.dirNew * HALF_PI);
            scale(sclH);
          }
        } else {
          // rotate(this.dirNew * HALF_PI);
          let x1 = Math.cos(this.dirNew * HALF_PI) * this.ratio;
          let y1 = Math.sin(this.dirNew * HALF_PI) * this.ratio;
          let x2 = Math.cos(this.dir * HALF_PI) * (1 - this.ratio);
          let y2 = Math.sin(this.dir * HALF_PI) * (1 - this.ratio);
          rotate(Math.atan2(y2 + y1, x2 + x1));
          scale(sclH);
        }
        if (this.eating) {
          image(this.imageEat, 0, 0);
        } else {
          image(this.imageHead, 0, 0);
        }
        pop();
      }
    }
  }
}

class Apple {
  constructor(_x, _y, imgF) {
    this.x = _x;
    this.y = _y;
    this.imageFood = imgF;
    this.eaten = false;
  }

  randomPosition(snakes, w, h) {
    let candidates = [];
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        candidates.push({ x: i, y: j });
      }
    }
    snakes.forEach((s) => {
      s.target.forEach((t) => {
        candidates = candidates.filter((c) => !(c.x === t.x && c.y === t.y));
      });
    });

    let candidate = candidates[floor(random(candidates.length))];
    this.x = candidate.x;
    this.y = candidate.y;
    this.eaten = false;
  }

  eat() {
    this.eaten = true;
  }

  display(_x, _y, cell, scl) {
    // noStroke();
    // fill(255, 0, 0);
    // circle(_x + cell * this.x, _y + cell * this.y, cell * 0.8);

    push();
    imageMode(CENTER);
    translate(_x + cell * this.x, _y + cell * this.y);
    scale(scl);
    image(this.imageFood, 0, 0);
    pop();
  }
}
