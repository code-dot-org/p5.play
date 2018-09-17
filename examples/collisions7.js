var ball1, ball2;
var wall;

function setup() {
  createCanvas(800, 400);

  ball1 = createSprite(100, 50, 5, 5);
  ball1.velocity.x = 100;
  ball1.velocity.y = 10;

  ball2 = createSprite(100, 350, 5, 5);
  ball2.disableVelocity = true;
  ball2.velocity.x = 100;
  ball2.velocity.y = -10;

  wall = createSprite(350, 200, 5, 400);
  wall.immovable = true;
  drawSprites();
}

function draw() {
  ball1.bounce(wall);
  if (ball1.position.x > 500) {
    throw new Error('ball1 tunnelled through wall');
  }

  ball2.position.x += ball2.velocity.x;
  ball2.position.y += ball2.velocity.y;
  ball2.bounce(wall);
  if (ball2.position.x > 500) {
    throw new Error('ball2 tunnelled through wall');
  }
  drawSprites();

}
