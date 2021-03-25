describe('CircleCollider', function() {
  var MARGIN_OF_ERROR = 0.000001;

  it('stores properties', function() {
    var a = new p5.CircleCollider(new p5.Vector(2, 3), 4);
    expect(a.center.x).to.equal(2);
    expect(a.center.y).to.equal(3);
    expect(a.radius).to.equal(4);
  });

  describe('_getRadiusOnAxis()', function() {
    var circle;

    beforeEach(function() {
      circle = new p5.CircleCollider(new p5.Vector(), 5);
    });

    it('gives the set radius when no transforms are set', function() {
      expect(circle._getRadiusOnAxis()).to.equal(5);
    });

    it('ignoes the provided axis', function() {
      for (var i = 0; i < 10; i++) {
        expect(circle._getRadiusOnAxis(new p5.Vector(
          Math.random(),
          -1 + 2 * Math.random()
        ))).to.equal(5);
      }
    });

    it('is unaffected by translation', function() {
      circle.setParentTransform(new p5.Transform2D().translate(2, 3));
      circle.offset = new p5.Vector(4, 5);
      expect(circle._getRadiusOnAxis()).to.equal(5);
    });

    it('is unaffected by rotation', function() {
      circle.setParentTransform(new p5.Transform2D().rotate(1));
      circle.rotation = 1;
      expect(circle._getRadiusOnAxis()).to.equal(5);
    });

    it('incorporates local scale', function() {
      circle.scale = new p5.Vector(2, 2);
      expect(circle._getRadiusOnAxis()).to.equal(10);
    });

    it('incorporates parent scale', function() {
      circle.setParentTransform(new p5.Transform2D().scale(3));
      expect(circle._getRadiusOnAxis()).to.equal(15);
    });

    it('combines parent and local scale', function() {
      circle.setParentTransform(new p5.Transform2D().scale(3));
      circle.scale = new p5.Vector(2, 2);
      expect(circle._getRadiusOnAxis()).to.equal(30);
    });

    // eslint-disable-next-line no-warning-comments
    // TODO: If/when we add ellipse support, should also make the circle
    // collider report correct radius on axis when scaleX != scaleY
  });

  describe('setParentTransform', function() {
    var circle, pInst;

    beforeEach(function() {
      circle = new p5.CircleCollider(new p5.Vector(), 5);
      pInst = new p5(function() {});
    });

    afterEach(function() {
      pInst.remove();
    });

    it('scales radius by height when height is greater', function() {
      var parent = pInst.createSprite();
      parent._getScaleX = function() {
        return 2;
      };
      parent._getScaleY = function() {
        return 3;
      };
      circle.setParentTransform(parent);
      circle._computeScaledRadius();
      expect(circle._scaledRadius).to.equal(15);
    });

    it('scales radius by width when width is greater', function() {
      var parent = pInst.createSprite();
      parent._getScaleX = function() {
        return 4;
      };
      parent._getScaleY = function() {
        return 3;
      };
      circle.setParentTransform(parent);
      circle._computeScaledRadius();
      expect(circle._scaledRadius).to.equal(20);
    });
  });

  describe('circles of same radii', function() {
    var a, b;
    beforeEach(function() {
      a = new p5.CircleCollider(new p5.Vector(0, 0), 5);
      b = new p5.CircleCollider(new p5.Vector(0, 0), 5);
    });

    it('detects no collision when separated', function() {
      // Move circle B just around the perimeter of circle A
      for (var t = 0; t < Math.PI / 2; t += 0.1) {
        b.center = new p5.Vector(
          Math.cos(t) * (10 + MARGIN_OF_ERROR),
          Math.sin(t) * (10 + MARGIN_OF_ERROR));
        var displacement = a.collide(b);
        expect(displacement.x).to.equal(0);
        expect(displacement.y).to.equal(0);
      }
    });

    it('detects overlap when a is exactly centered on b', function() {
      b.center = a.center.copy();
      var displacement = a.collide(b);
      expect(displacement.mag()).not.to.equal(0);
    });

    it('detects overlap when b to the right', function() {
      b.center = new p5.Vector(9, 0);
      var displacement = a.collide(b);
      expect(displacement.x).to.equal(-1);
      expect(displacement.y).to.equal(0);
    });

    it('detects overlap when b to the left', function() {
      b.center = new p5.Vector(-9, 0);
      var displacement = a.collide(b);
      expect(displacement.x).to.equal(1);
      expect(displacement.y).to.equal(0);
    });

    it('detects overlap when b is above', function() {
      b.center = new p5.Vector(0, -9);
      var displacement = a.collide(b);
      expect(displacement.x).to.be.closeTo(0, MARGIN_OF_ERROR);
      expect(displacement.y).to.be.closeTo(1, MARGIN_OF_ERROR);
    });

    it('detects overlap when b is below', function() {
      b.center = new p5.Vector(0, 9);
      var displacement = a.collide(b);
      expect(displacement.x).to.be.closeTo(0, MARGIN_OF_ERROR);
      expect(displacement.y).to.be.closeTo(-1, MARGIN_OF_ERROR);
    });

    it('displacement is always on the line between the centers of the circles', function() {
      b.center = new p5.Vector(6, 2);
      var displacement = a.collide(b);
      expect(displacement.mag()).to.be.closeTo(3.6754446, MARGIN_OF_ERROR);
      expect(displacement.y / displacement.x).to.closeTo(2 / 6, MARGIN_OF_ERROR);
    });
  });

  describe('updateFromSprite()', function() {
    var pInst, testAnimation;

    beforeEach(function() {
      pInst = new p5(function() {});
      testAnimation = createTestAnimation(3);
    });

    afterEach(function() {
      pInst.remove();
    });

    it('adopts radius from animationless sprite when no radius is given, scale 1', function() {
      var sprite = pInst.createSprite(0, 0, 200, 200);
      sprite.setCollider('circle');
      expect(sprite.collider.radius).to.equal(100);
      expect(sprite.collider._scaledRadius).to.equal(100);

      sprite.width = 300;
      sprite.height = 300;
      sprite.update();
      expect(sprite.collider.radius).to.equal(150);
      expect(sprite.collider._scaledRadius).to.equal(150);
    });

    it('keeps own radius from animationless sprite when radius is given, scale 1', function() {
      var sprite = pInst.createSprite(0, 0, 200, 200);
      sprite.setCollider('circle', 0, 0, 25);
      expect(sprite.collider.radius).to.equal(25);
      expect(sprite.collider._scaledRadius).to.equal(25);

      sprite.width = 300;
      sprite.height = 300;
      sprite.update();
      expect(sprite.collider.radius).to.equal(25);
      expect(sprite.collider._scaledRadius).to.equal(25);
    });

    it('adopts scaled radius from animationless sprite when no radius is given, scale != 1', function() {
      var sprite = pInst.createSprite(0, 0, 200, 200);
      sprite.scale = 2;
      sprite.setCollider('circle');
      expect(sprite.collider.radius).to.equal(100);
      expect(sprite.collider._scaledRadius).to.equal(200);

      sprite.width = 300;
      sprite.height = 300;
      sprite.update();
      expect(sprite.collider.radius).to.equal(150);
      expect(sprite.collider._scaledRadius).to.equal(300);

      sprite.scale = 3;
      sprite.update();
      expect(sprite.collider.radius).to.equal(150);
      expect(sprite.collider._scaledRadius).to.equal(450);
    });

    it('scales own radius from animationless sprite when radius is given, scale != 1', function() {
      var sprite = pInst.createSprite(0, 0, 200, 200);
      sprite.scale = 2;
      sprite.setCollider('circle', 0, 0, 25);
      expect(sprite.collider.radius).to.equal(25);
      expect(sprite.collider._scaledRadius).to.equal(50);

      sprite.width = 300;
      sprite.height = 300;
      sprite.update();
      expect(sprite.collider.radius).to.equal(25);
      expect(sprite.collider._scaledRadius).to.equal(50);

      sprite.scale = 3;
      sprite.update();
      expect(sprite.collider.radius).to.equal(25);
      expect(sprite.collider._scaledRadius).to.equal(75);
    });

    it('adopts animation radius from sprite with animation when no radius is given, scale 1', function() {
      var sprite = pInst.createSprite(0, 0, 200, 200);
      sprite.addAnimation('testAnim', testAnimation);
      sprite.setCollider('circle');
      // Frames in the test animation are 50x50
      expect(sprite.collider.radius).to.equal(25);
      expect(sprite.collider._scaledRadius).to.equal(25);

      sprite.width = 300;
      sprite.height = 300;
      sprite.update();
      expect(sprite.collider.radius).to.equal(25);
      expect(sprite.collider._scaledRadius).to.equal(25);
    });

    it('keeps own radius from sprite with animation when radius is given, scale 1', function() {
      var sprite = pInst.createSprite(0, 0, 200, 200);
      sprite.addAnimation('testAnim', testAnimation);
      sprite.setCollider('circle', 0, 0, 40);
      expect(sprite.collider.radius).to.equal(40);
      expect(sprite.collider._scaledRadius).to.equal(40);

      sprite.width = 300;
      sprite.height = 300;
      sprite.update();
      expect(sprite.collider.radius).to.equal(40);
      expect(sprite.collider._scaledRadius).to.equal(40);
    });

    it('adopts scaled animation radius from sprite with animation when no radius is given, scale != 1', function() {
      var sprite = pInst.createSprite(0, 0, 200, 200);
      sprite.addAnimation('testAnim', testAnimation);
      sprite.scale = 2;
      sprite.setCollider('circle');
      // Frames in the test animation are 50x50
      expect(sprite.collider.radius).to.equal(25);
      expect(sprite.collider._scaledRadius).to.equal(50);

      sprite.width = 300;
      sprite.height = 300;
      sprite.update();
      expect(sprite.collider.radius).to.equal(25);
      expect(sprite.collider._scaledRadius).to.equal(50);

      sprite.scale = 3;
      sprite.update();
      expect(sprite.collider.radius).to.equal(25);
      expect(sprite.collider._scaledRadius).to.equal(75);
    });

    it('scales own radius from sprite with animation when radius is given, scale != 1', function() {
      var sprite = pInst.createSprite(0, 0, 200, 200);
      sprite.addAnimation('testAnim', testAnimation);
      sprite.scale = 2;
      sprite.setCollider('circle', 0, 0, 40);
      expect(sprite.collider.radius).to.equal(40);
      expect(sprite.collider._scaledRadius).to.equal(80);

      sprite.width = 300;
      sprite.height = 300;
      sprite.update();
      expect(sprite.collider.radius).to.equal(40);
      expect(sprite.collider._scaledRadius).to.equal(80);

      sprite.scale = 3;
      sprite.update();
      expect(sprite.collider.radius).to.equal(40);
      expect(sprite.collider._scaledRadius).to.equal(120);
    });

    /**
     * Makes a fake animation with the specified number of frames.
     * @param {number} frameCount
     * @returns {p5.Animation}
     */
    function createTestAnimation(frameCount) {
      frameCount = frameCount || 1;
      var image = new p5.Image(100, 100, pInst);
      var frames = [];
      for (var i = 0; i < frameCount; i++) {
        frames.push({name: i, frame: {x: 0, y: 0, width: 50, height: 50}});
      }
      var sheet = new pInst.SpriteSheet(image, frames);
      var animation = new pInst.Animation(sheet);
      animation.frameDelay = 1;
      return animation;
    }
  });
});

