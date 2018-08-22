describe('Sprite', function() {
  var expectVectorsAreClose = p5PlayAssertions.expectVectorsAreClose;
  var MARGIN_OF_ERROR = 0.0000001;
  var pInst;

  beforeEach(function() {
    pInst = new p5(function() {});
  });

  afterEach(function() {
    pInst.remove();
  });

  it('sets correct coordinate mode for rendering', function() {
    // Note: This test reaches into p5's internals somewhat more than usual.
    // It's designed to catch a particular rendering regression reported in
    // issue #48, where certain local constants are initialized incorrectly.
    // See https://github.com/molleindustria/p5.play/issues/48
    expect(p5.prototype.CENTER).to.not.be.undefined;
    var rectMode, ellipseMode, imageMode;

    // Monkeypatch sprite's draw method to inspect coordinate mode at draw-time.
    var sprite = pInst.createSprite();
    sprite.draw = function() {
      rectMode = pInst._renderer._rectMode;
      ellipseMode = pInst._renderer._ellipseMode;
      imageMode = pInst._renderer._imageMode;
    };
    pInst.drawSprites();

    // Check captured modes.
    expect(rectMode).to.equal(p5.prototype.CENTER);
    expect(ellipseMode).to.equal(p5.prototype.CENTER);
    expect(imageMode).to.equal(p5.prototype.CENTER);
  });

  describe('getDirection', function() {
    var sprite;

    beforeEach(function() {
      sprite = pInst.createSprite();
    });

    function checkDirectionForVelocity(v, d) {
      sprite.velocity.x = v[0];
      sprite.velocity.y = v[1];
      expect(sprite.getDirection()).to.equal(d);
    }

    it('returns zero when there is no velocity', function() {
      checkDirectionForVelocity([0, 0], 0);
    });

    it('positive or zero y velocity gives a positive direction', function() {
      checkDirectionForVelocity([-1, 0], 180);
      checkDirectionForVelocity([0, 0], 0);
      checkDirectionForVelocity([1, 0], 0);

      checkDirectionForVelocity([-1, 1], 135);
      checkDirectionForVelocity([0, 1], 90);
      checkDirectionForVelocity([1, 1], 45);
    });

    it('negative y velocity gives a negative direction', function() {
      checkDirectionForVelocity([-1, -1], -135);
      checkDirectionForVelocity([0, -1], -90);
      checkDirectionForVelocity([1, -1], -45);
    });

    it('returns degrees when p5 angleMode is RADIANS', function() {
      pInst.angleMode(p5.prototype.RADIANS);
      checkDirectionForVelocity([1, 1], 45);
      checkDirectionForVelocity([0, 1], 90);
    });

    it('returns degrees when p5 angleMode is DEGREES', function() {
      pInst.angleMode(p5.prototype.DEGREES);
      checkDirectionForVelocity([1, 1], 45);
      checkDirectionForVelocity([0, 1], 90);
    });

  });

  describe('dimension updating when animation changes', function() {
    it('animation width and height get inherited from frame', function() {
      var image = new p5.Image(100, 100, pInst);
      var frames = [
        {name: 0, frame: {x: 0, y: 0, width: 30, height: 30}}
      ];
      var sheet = new pInst.SpriteSheet(image, frames);
      var animation = new pInst.Animation(sheet);

      var sprite = pInst.createSprite(0, 0);
      sprite.addAnimation('label', animation);

      expect(sprite.width).to.equal(30);
      expect(sprite.height).to.equal(30);
    });

    it('updates the width and height property when frames are different sizes', function() {
      var image = new p5.Image(100, 100, pInst);
      var frames = [
        {name: 0, frame: {x: 0, y: 0, width: 50, height: 50}},
        {name: 1, frame: {x: 100, y: 0, width: 40, height: 60}},
        {name: 2, frame: {x: 0, y: 80, width: 70, height: 30}}
      ];
      var sheet = new pInst.SpriteSheet(image, frames);
      var animation = new pInst.Animation(sheet);

      var sprite = pInst.createSprite(0, 0);
      sprite.addAnimation('label', animation);

      expect(sprite.width).to.equal(50);
      expect(sprite.height).to.equal(50);

      // Frame changes after every 4th update because of frame delay.
      sprite.update();
      sprite.update();
      sprite.update();
      sprite.update();
      expect(sprite.width).to.equal(40);
      expect(sprite.height).to.equal(60);

      sprite.update();
      sprite.update();
      sprite.update();
      sprite.update();
      expect(sprite.width).to.equal(70);
      expect(sprite.height).to.equal(30);
    });
  });

  describe('mouse events', function() {
    var sprite;

    beforeEach(function() {
      // Create a sprite with centered at 50,50 with size 100,100.
      // Its default collider picks up anything from 1,1 to 99,99.
      sprite = pInst.createSprite(50, 50, 100, 100);
      sprite.onMouseOver = sinon.spy();
      sprite.onMouseOut = sinon.spy();
      sprite.onMousePressed = sinon.spy();
      sprite.onMouseReleased = sinon.spy();
    });

    function moveMouseTo(x, y) {
      pInst.mouseX = x;
      pInst.mouseY = y;
      sprite.update();
    }

    function moveMouseOver() {
      moveMouseTo(1, 1);
    }

    function moveMouseOut() {
      moveMouseTo(0, 0);
    }

    function pressMouse() {
      pInst.mouseIsPressed = true;
      sprite.update();
    }

    function releaseMouse() {
      pInst.mouseIsPressed = false;
      sprite.update();
    }

    it('mouseIsOver property represents whether mouse is over collider', function() {
      moveMouseTo(0, 0);
      expect(sprite.mouseIsOver).to.be.false;
      moveMouseTo(1, 1);
      expect(sprite.mouseIsOver).to.be.true;
      moveMouseTo(99, 99);
      expect(sprite.mouseIsOver).to.be.true;
      moveMouseTo(100, 100);
      expect(sprite.mouseIsOver).to.be.false;
    });

    describe('onMouseOver callback', function() {
      it('calls onMouseOver when the mouse enters the sprite collider', function() {
        moveMouseOut();
        expect(sprite.onMouseOver.called).to.be.false;
        moveMouseOver();
        expect(sprite.onMouseOver.called).to.be.true;
      });

      it('does not call onMouseOver when the mouse moves within the sprite collider', function() {
        moveMouseTo(0, 0);
        expect(sprite.onMouseOver.callCount).to.equal(0);
        moveMouseTo(1, 1);
        expect(sprite.onMouseOver.callCount).to.equal(1);
        moveMouseTo(2, 2);
        expect(sprite.onMouseOver.callCount).to.equal(1);
      });

      it('calls onMouseOver again when the mouse leaves and returns', function() {
        moveMouseOut();
        expect(sprite.onMouseOver.callCount).to.equal(0);
        moveMouseOver();
        expect(sprite.onMouseOver.callCount).to.equal(1);
        moveMouseOut();
        expect(sprite.onMouseOver.callCount).to.equal(1);
        moveMouseOver();
        expect(sprite.onMouseOver.callCount).to.equal(2);
      });
    });

    describe('onMouseOut callback', function() {
      it('calls onMouseOut when the mouse leaves the sprite collider', function() {
        moveMouseOver();
        expect(sprite.onMouseOut.called).to.be.false;
        moveMouseOut();
        expect(sprite.onMouseOut.called).to.be.true;
      });

      it('does not call onMouseOut when the mouse moves outside the sprite collider', function() {
        moveMouseTo(0, 0);
        expect(sprite.onMouseOut.called).to.be.false;
        moveMouseTo(0, 1);
        expect(sprite.onMouseOut.called).to.be.false;
      });

      it('calls onMouseOut again when the mouse returns and leaves', function() {
        moveMouseOver();
        expect(sprite.onMouseOut.callCount).to.equal(0);
        moveMouseOut();
        expect(sprite.onMouseOut.callCount).to.equal(1);
        moveMouseOver();
        expect(sprite.onMouseOut.callCount).to.equal(1);
        moveMouseOut();
        expect(sprite.onMouseOut.callCount).to.equal(2);
      });
    });

    describe('onMousePressed callback', function() {
      it('does not call onMousePressed if the mouse was not over the sprite', function() {
        expect(sprite.mouseIsOver).to.be.false;
        pressMouse();
        expect(sprite.onMousePressed.called).to.be.false;
      });

      it('calls onMousePressed if the mouse was pressed over the sprite', function() {
        moveMouseOver();
        pressMouse();
        expect(sprite.onMousePressed.called).to.be.true;
      });

      it('calls onMousePressed if the mouse was pressed outside the sprite then dragged over it', function() {
        pressMouse();
        moveMouseOver();
        expect(sprite.onMousePressed.called).to.be.true;
      });
    });

    describe('onMouseReleased callback', function() {
      it('does not call onMouseReleased if the mouse was never pressed over the sprite', function() {
        expect(sprite.mouseIsOver).to.be.false;
        pressMouse();
        releaseMouse();
        expect(sprite.onMouseReleased.called).to.be.false;
      });

      it('calls onMouseReleased if the mouse was pressed and released over the sprite', function() {
        moveMouseOver();
        pressMouse();
        releaseMouse();
        expect(sprite.onMouseReleased.called).to.be.true;
      });

      it('calls onMouseReleased if the mouse was pressed, moved over the sprite, and then released', function() {
        pressMouse();
        moveMouseOver();
        releaseMouse();
        expect(sprite.onMouseReleased.called).to.be.true;
      });

      it('does not call onMouseReleased on mouse-out if mouse is still down', function() {
        pressMouse();
        moveMouseOver();
        moveMouseOut();
        expect(sprite.onMouseReleased.called).to.be.false;
      });

      it('does not call onMouseReleased on release if mouse has left sprite', function() {
        moveMouseOver();
        pressMouse();
        moveMouseOut();
        releaseMouse();
        expect(sprite.onMouseReleased.called).to.be.false;
      });
    });
  });

  describe('setCollider()', function() {
    var sprite;

    beforeEach(function() {
      // Position: (10, 20), Size: (30, 40)
      sprite = pInst.createSprite(10, 20, 30, 40);
    });

    it('a newly-created sprite has no collider', function() {
      expect(sprite.collider).to.be.undefined;
    });

    it('throws if first argument is not a valid type', function() {
      // Also throws if undefined
      expect(function() {
        sprite.setCollider('notAType');
      }).to.throw(TypeError, 'setCollider expects the first argument to be one of "point", "circle", "rectangle", "aabb" or "obb"');

      // Also throws if undefined
      expect(function() {
        sprite.setCollider();
      }).to.throw(TypeError, 'setCollider expects the first argument to be one of "point", "circle", "rectangle", "aabb" or "obb"');

      // Note that it's not case-sensitive
      expect(function() {
        sprite.setCollider('CIRCLE');
      }).not.to.throw();
    });

    describe('"point"', function() {
      it('can construct a collider with default offset', function() {
        sprite.setCollider('point');
        expect(sprite.collider).to.be.an.instanceOf(p5.PointCollider);
        expect(sprite.collider.center.equals(sprite.position)).to.be.true;
      });

      it('can construct a collider with custom offset', function() {
        sprite.setCollider('point', 2, 3);
        expect(sprite.collider).to.be.an.instanceOf(p5.PointCollider);
        expect(sprite.collider.center.x).to.eq(sprite.position.x + 2);
        expect(sprite.collider.center.y).to.eq(sprite.position.y + 3);
        expect(sprite.collider.offset.x).to.eq(2);
        expect(sprite.collider.offset.y).to.eq(3);
      });

      it('stores unscaled custom offset', function() {
        sprite.scale = 2;
        sprite.setCollider('point', 4, 6);
        expect(sprite.collider).to.be.an.instanceOf(p5.PointCollider);
        expect(sprite.collider.center.x).to.eq(sprite.position.x + 8);
        expect(sprite.collider.center.y).to.eq(sprite.position.y + 12);
        expect(sprite.collider.offset.x).to.eq(4);
        expect(sprite.collider.offset.y).to.eq(6);
      });

      it('stores unrotated custom offset', function() {
        sprite.rotation = 90;
        sprite.setCollider('point', 2, 3);
        expect(sprite.collider).to.be.an.instanceOf(p5.PointCollider);
        expect(sprite.collider.center.x).to.eq(sprite.position.x - 3);
        expect(sprite.collider.center.y).to.eq(sprite.position.y + 2);
        expect(sprite.collider.offset.x).to.eq(2);
        expect(sprite.collider.offset.y).to.eq(3);
      });

      it('stores unrotated and unscaled custom offset if sprite was already rotated and scaled', function() {
        sprite.scale = 2;
        sprite.rotation = 90;
        sprite.setCollider('point', 2, 3);
        expect(sprite.collider).to.be.an.instanceOf(p5.PointCollider);
        expect(sprite.collider.center.x).to.eq(sprite.position.x - 6);
        expect(sprite.collider.center.y).to.eq(sprite.position.y + 4);
        expect(sprite.collider.offset.x).to.eq(2);
        expect(sprite.collider.offset.y).to.eq(3);
      });

      it('throws if creating a point collider with 2 or 4+ params', function() {
        // setCollider('point') is okay

        expect(function() {
          sprite.setCollider('point', 2);
        }).to.throw(TypeError);

        // setCollider('point', offsetX, offsetY) is okay

        expect(function() {
          sprite.setCollider('point', 1, 2, 3);
        }).to.throw(TypeError);

        expect(function() {
          sprite.setCollider('point', 1, 2, 3, 4);
        }).to.throw(TypeError);
      });
    });

    describe('"circle"', function() {
      it('can construct collider with default radius and offset', function() {
        sprite.setCollider('circle');
        expect(sprite.collider).to.be.an.instanceOf(p5.CircleCollider);

        // Center should match sprite position
        expect(sprite.collider.center.equals(sprite.position)).to.be.true;

        // Radius should be half of sprite's larger dimension.
        expect(sprite.height).to.be.greaterThan(sprite.width);
        expect(sprite.collider.radius).to.eq(sprite.height / 2);
      });

      it('can construct a collider with default radius and custom offset', function() {
        sprite.setCollider('circle', 2, 3);
        expect(sprite.collider).to.be.an.instanceOf(p5.CircleCollider);

        // Center should be sprite position + offset
        expect(sprite.collider.center.x).to.eq(sprite.position.x + 2);
        expect(sprite.collider.center.y).to.eq(sprite.position.y + 3);

        // Radius should be half of sprite's larger dimension.
        expect(sprite.height).to.be.greaterThan(sprite.width);
        expect(sprite.collider.radius).to.eq(sprite.height / 2);
      });

      it('can construct a collider with custom radius and offset', function() {
        sprite.setCollider('circle', 2, 3, 4);
        expect(sprite.collider).to.be.an.instanceOf(p5.CircleCollider);

        // Center should be sprite position + offset
        expect(sprite.collider.center.x).to.eq(sprite.position.x + 2);
        expect(sprite.collider.center.y).to.eq(sprite.position.y + 3);

        // Radius should be as given
        expect(sprite.collider.radius).to.be.closeTo(4, MARGIN_OF_ERROR);
      });

      it('when created from a scaled sprite, has correct scaled radius', function() {
        sprite.scale = 0.25;
        sprite.setCollider('circle');
        // collider.radius is unscaled
        expect(sprite.collider.radius).to.eq(sprite.height / 2);
        // collider radius on axis will be in world-space though, and scaled.
        expect(sprite.collider._getRadiusOnAxis()).to.eq(sprite.height / 8);

        // Just changing the sprite scale is not enough to update the collider...
        // though it'd be fine if this changed in the future.
        sprite.scale = 0.5;
        expect(sprite.collider._getRadiusOnAxis()).to.eq(sprite.height / 8);

        // Right now, an update() call is required for a new sprite scale to
        // get picked up.
        sprite.update();
        expect(sprite.collider._getRadiusOnAxis()).to.eq(sprite.height / 4);
      });

      it('throws if creating a circle collider with 2 or 5+ params', function() {
        // setCollider('circle') is fine

        expect(function() {
          sprite.setCollider('circle', 1);
        }).to.throw(TypeError);

        // setCollider('circle', offsetX, offsetY) is fine


        // setCollider('circle', offsetX, offsetY, radius) is fine

        expect(function() {
          sprite.setCollider('circle', 1, 2, 3, 4);
        }).to.throw(TypeError);
        expect(function() {
          sprite.setCollider('circle', 1, 2, 3, 4, 5);
        }).to.throw(TypeError);
      });
    });

    describe('"aabb"', function() {
      it('can construct a collider with default dimensions and offset', function() {
        sprite.setCollider('aabb');
        expect(sprite.collider).to.be.an.instanceOf(p5.AxisAlignedBoundingBoxCollider);

        // Center should match sprite position
        expect(sprite.collider.center.equals(sprite.position)).to.be.true;

        // Width and height should match sprite dimensions
        expect(sprite.collider.width).to.eq(sprite.width);
        expect(sprite.collider.height).to.eq(sprite.height);
      });

      it('scaling sprite without animation does not affect default collider size', function() {
        sprite.scale = 0.25;
        sprite.setCollider('aabb');
        expect(sprite.collider.width).to.eq(sprite.width);
        expect(sprite.collider.height).to.eq(sprite.height);
      });

      it('can construct a collider with explicit dimensions and offset', function() {
        sprite.setCollider('aabb', 1, 2, 3, 4);
        expect(sprite.collider).to.be.an.instanceOf(p5.AxisAlignedBoundingBoxCollider);
        expect(sprite.collider.center.x).to.equal(sprite.position.x + 1);
        expect(sprite.collider.center.y).to.equal(sprite.position.y + 2);
        expect(sprite.collider.width).to.eq(3);
        expect(sprite.collider.height).to.eq(4);
        expect(sprite.collider.offset).to.be.an.instanceOf(p5.Vector);
        expect(sprite.collider.offset.x).to.eq(1);
        expect(sprite.collider.offset.y).to.eq(2);
      });

      it('throws if creating a collider with 2, 4, or 6+ params', function() {
        // setCollider('rectangle') is fine

        expect(function() {
          sprite.setCollider('aabb', 1);
        }).to.throw(TypeError);

        // setCollider('aabb', offsetX, offsetY) is fine

        expect(function() {
          sprite.setCollider('aabb', 1, 2, 3);
        }).to.throw(TypeError);

        // setCollider('aabb', offsetX, offsetY, width, height) is fine.

        expect(function() {
          sprite.setCollider('aabb', 1, 2, 3, 4, 5);
        }).to.throw(TypeError);

        expect(function() {
          sprite.setCollider('aabb', 1, 2, 3, 4, 5, 6);
        }).to.throw(TypeError);
      });
    });

    describe('"obb"', function() {
      it('can construct a collider with default offset, dimensions, and rotation', function() {
        sprite.setCollider('obb');
        expect(sprite.collider).to.be.an.instanceOf(p5.OrientedBoundingBoxCollider);

        // Center should match sprite position
        expect(sprite.collider.center.equals(sprite.position)).to.be.true;

        // Width and height should match sprite dimensions
        expect(sprite.collider.width).to.eq(sprite.width);
        expect(sprite.collider.height).to.eq(sprite.height);

        // Rotation should match sprite rotation
        expect(sprite.collider.rotation).to.eq(p5.prototype.radians(sprite.rotation));
      });

      it('can construct a collider with custom offset, default dimensions and rotation', function() {
        sprite.setCollider('obb', 2, 3);
        expect(sprite.collider).to.be.an.instanceOf(p5.OrientedBoundingBoxCollider);

        // Center should be sprite position + offset
        expect(sprite.collider.center.x).to.eq(sprite.position.x + 2);
        expect(sprite.collider.center.y).to.eq(sprite.position.y + 3);

        // Width and height should match sprite dimensions
        expect(sprite.collider.width).to.eq(sprite.width);
        expect(sprite.collider.height).to.eq(sprite.height);

        // Rotation should match sprite rotation
        expect(sprite.collider.rotation).to.eq(p5.prototype.radians(sprite.rotation));
      });

      it('can construct a collider with custom offset and dimensions, default rotation', function() {
        sprite.setCollider('obb', 2, 3, 4, 5);
        expect(sprite.collider).to.be.an.instanceOf(p5.OrientedBoundingBoxCollider);

        // Center should be sprite position + offset
        expect(sprite.collider.center.x).to.eq(sprite.position.x + 2);
        expect(sprite.collider.center.y).to.eq(sprite.position.y + 3);

        // Width and height should match sprite dimensions
        expect(sprite.collider.width).to.eq(4);
        expect(sprite.collider.height).to.eq(5);

        // Rotation should match sprite rotation
        expect(sprite.collider.rotation).to.eq(p5.prototype.radians(sprite.rotation));
      });
    });

    describe('"rectangle"', function() {
      it('is an alias to OBB', function() {
        sprite.setCollider('rectangle');
        expect(sprite.collider).to.be.an.instanceOf(p5.OrientedBoundingBoxCollider);
      });
    });
  });


  describe('friction', function() {
    var sprite;

    beforeEach(function() {
      sprite = pInst.createSprite();
    });

    it('has no effect on update() when set to 0', function() {
      sprite.velocity.x = 1;
      sprite.velocity.y = 1;
      sprite.friction = 0;
      sprite.update();
      expect(sprite.velocity.x).to.equal(1);
      expect(sprite.velocity.y).to.equal(1);
    });

    it('reduces velocity to zero on update() when set to 1', function() {
      sprite.velocity.x = 1;
      sprite.velocity.y = 1;
      sprite.friction = 1;
      sprite.update();
      expect(sprite.velocity.x).to.equal(0);
      expect(sprite.velocity.y).to.equal(0);
    });

    describe('axis-aligned', function() {
      beforeEach(function() {
        sprite.velocity.x = 16;
      });

      it('cuts velocity in half each update when set to 0.5', function() {
        sprite.friction = 0.5;
        expect(sprite.velocity.x).to.equal(16);
        sprite.update();
        expect(sprite.velocity.x).to.equal(8);
        sprite.update();
        expect(sprite.velocity.x).to.equal(4);
        sprite.update();
        expect(sprite.velocity.x).to.equal(2);
      });

      it('cuts velocity to one-quarter each update when set to 0.75', function() {
        sprite.friction = 0.75;
        expect(sprite.velocity.x).to.equal(16);
        sprite.update();
        expect(sprite.velocity.x).to.equal(4);
        sprite.update();
        expect(sprite.velocity.x).to.equal(1);
        sprite.update();
        expect(sprite.velocity.x).to.equal(0.25);
      });
    });

    describe('not axis-aligned', function() {
      beforeEach(function() {
        sprite.velocity.x = 3 * 16;
        sprite.velocity.y = 4 * 16;
      });

      it('cuts velocity in half each update when set to 0.5', function() {
        sprite.friction = 0.5;
        expect(sprite.velocity.x).to.equal(3 * 16);
        expect(sprite.velocity.y).to.equal(4 * 16);
        expect(sprite.velocity.mag()).to.equal(5 * 16);
        sprite.update();
        expect(sprite.velocity.x).to.equal(3 * 8);
        expect(sprite.velocity.y).to.equal(4 * 8);
        expect(sprite.velocity.mag()).to.equal(5 * 8);
        sprite.update();
        expect(sprite.velocity.x).to.equal(3 * 4);
        expect(sprite.velocity.y).to.equal(4 * 4);
        expect(sprite.velocity.mag()).to.equal(5 * 4);
        sprite.update();
        expect(sprite.velocity.x).to.equal(3 * 2);
        expect(sprite.velocity.y).to.equal(4 * 2);
        expect(sprite.velocity.mag()).to.equal(5 * 2);
      });

      it('cuts velocity to one-quarter each update when set to 0.75', function() {
        sprite.friction = 0.75;
        expect(sprite.velocity.x).to.equal(3 * 16);
        expect(sprite.velocity.y).to.equal(4 * 16);
        expect(sprite.velocity.mag()).to.equal(5 * 16);
        sprite.update();
        expect(sprite.velocity.x).to.equal(3 * 4);
        expect(sprite.velocity.y).to.equal(4 * 4);
        expect(sprite.velocity.mag()).to.equal(5 * 4);
        sprite.update();
        expect(sprite.velocity.x).to.equal(3 * 1);
        expect(sprite.velocity.y).to.equal(4 * 1);
        expect(sprite.velocity.mag()).to.equal(5 * 1);
        sprite.update();
        expect(sprite.velocity.x).to.equal(3 * 0.25);
        expect(sprite.velocity.y).to.equal(4 * 0.25);
        expect(sprite.velocity.mag()).to.equal(5 * 0.25);
      });
    });
  });

  describe('method aliases', function() {
    var testSprite;

    beforeEach(function() {
      testSprite = pInst.createSprite();
    });

    it('aliases setSpeed to setSpeedAndDirection', function() {
      testSprite.setSpeedAndDirection(5, 100);
      expect(testSprite.getSpeed()).to.be.closeTo(5, 0.01);
      expect(testSprite.getDirection()).to.be.closeTo(100, 0.01);
    });

    it('aliases remove to destroy', function() {
      testSprite.destroy();
      expect(testSprite.removed).to.be.true;
    });

    it('aliases animation.changeFrame to setFrame', function() {
      testSprite.addAnimation('label', createTestAnimation());
      sinon.stub(testSprite.animation, 'changeFrame');
      testSprite.setFrame();
      expect(testSprite.animation.changeFrame.calledOnce).to.be.true;
    });

    it('aliases animation.nextFrame to nextFrame', function() {
      testSprite.addAnimation('label', createTestAnimation());
      sinon.stub(testSprite.animation, 'nextFrame');
      testSprite.nextFrame();
      expect(testSprite.animation.nextFrame.calledOnce).to.be.true;
    });

    it('aliases animation.previousFrame to previousFrame', function() {
      testSprite.addAnimation('label', createTestAnimation());
      sinon.stub(testSprite.animation, 'previousFrame');
      testSprite.previousFrame();
      expect(testSprite.animation.previousFrame.calledOnce).to.be.true;
    });

    it('aliases animation.stop to pause', function() {
      testSprite.addAnimation('label', createTestAnimation());
      sinon.stub(testSprite.animation, 'stop');
      testSprite.pause();
      expect(testSprite.animation.stop.calledOnce).to.be.true;
    });
  });

  describe('property aliases', function() {
    var testSprite;

    beforeEach(function() {
      testSprite = pInst.createSprite();
    });

    it('aliases position.x to positionX', function() {
      testSprite.position.x = 1;
      expect(testSprite.position.x).to.equal(testSprite.x);
      var newValue = 2;
      testSprite.x = newValue;
      expect(testSprite.position.x).to.equal(testSprite.x).to.equal(newValue);
    });

    it('aliases position.y to positionY', function() {
      testSprite.position.y = 1;
      expect(testSprite.position.y).to.equal(testSprite.y);
      var newValue = 2;
      testSprite.y = newValue;
      expect(testSprite.position.y).to.equal(testSprite.y).to.equal(newValue);
    });

    it('aliases velocity.x to velocityX', function() {
      testSprite.velocity.x = 1;
      expect(testSprite.velocity.x).to.equal(testSprite.velocityX);
      var newValue = 2;
      testSprite.velocityX = newValue;
      expect(testSprite.velocity.x).to.equal(testSprite.velocityX).to.equal(newValue);
    });

    it('aliases velocity.y to velocityY', function() {
      testSprite.velocity.y = 1;
      expect(testSprite.velocity.y).to.equal(testSprite.velocityY);
      var newValue = 2;
      testSprite.velocityY = newValue;
      expect(testSprite.velocity.y).to.equal(testSprite.velocityY).to.equal(newValue);
    });

    it('aliases life to lifetime', function() {
      testSprite.life = 1;
      expect(testSprite.life).to.equal(testSprite.lifetime);
      var newValue = 2;
      testSprite.lifetime = newValue;
      expect(testSprite.life).to.equal(testSprite.lifetime).to.equal(newValue);
    });

    it('aliases restitution to bounciness', function() {
      testSprite.restitution = 1;
      expect(testSprite.restitution).to.equal(testSprite.bounciness);
      var newValue = 2;
      testSprite.bounciness = newValue;
      expect(testSprite.restitution).to.equal(testSprite.bounciness).to.equal(newValue);
    });
  });

  describe('isTouching', function() {
    it('returns false if the collider and colliding sprite dont overlap', function() {
      var sprite1 = pInst.createSprite(0, 0, 100, 100);
      var sprite2 = pInst.createSprite(200, 200, 100, 100);
      var isTouching1to2 = sprite1.isTouching(sprite2);
      var isTouching2to1 = sprite2.isTouching(sprite1);
      expect(isTouching1to2).to.equal(false).and.to.equal(isTouching2to1);
    });

    it('returns true if the collider and colliding sprite overlap', function() {
      var sprite3 = pInst.createSprite(150, 150, 100, 100);
      var sprite4 = pInst.createSprite(200, 200, 100, 100);
      var isTouching3to4 = sprite3.isTouching(sprite4);
      sprite4.isTouching(sprite3);
      expect(isTouching3to4).to.equal(true).and.to.equal(isTouching3to4);

      var sprite5 = pInst.createSprite(101, 101, 100, 100);
      var sprite6 = pInst.createSprite(200, 200, 100, 100);
      var isTouching5to6 = sprite5.isTouching(sprite6);
      sprite6.isTouching(sprite5);
      expect(isTouching5to6).to.equal(true).and.to.equal(isTouching5to6);
    });

    it('does not affect the location of the sprite', function() {
      var sprite1 = pInst.createSprite(170, 170, 100, 100);
      var sprite2 = pInst.createSprite(200, 200, 100, 100);
      var isTouching1to2 = sprite1.isTouching(sprite2);
      expect(isTouching1to2).to.equal(true);
      expect(sprite1.x).to.equal(170);
      expect(sprite1.y).to.equal(170);
      expect(sprite2.x).to.equal(200);
      expect(sprite2.y).to.equal(200);
    });

    it('does not affect the velocity of the sprites', function() {
      var sprite1 = pInst.createSprite(170, 170, 100, 100);
      var sprite2 = pInst.createSprite(200, 200, 100, 100);
      sprite1.velocityX = 1;
      sprite1.velocityY = 1;
      sprite2.velocityX = 0;
      sprite2.velocityY = 0;
      var isTouching1to2 = sprite1.isTouching(sprite2);
      expect(isTouching1to2).to.equal(true);
      expect(sprite1.velocityX).to.equal(1);
      expect(sprite1.velocityY).to.equal(1);
      expect(sprite2.velocityX).to.equal(0);
      expect(sprite2.velocityY).to.equal(0);
    });
  });

  describe('width, height', function() {
    describe('sprites without animations', function() {
      var sprite1;

      beforeEach(function() {
        sprite1 = pInst.createSprite(200, 200);
      });

      it('defaults to 100 by 100 when no width or height are set', function() {
        expect(sprite1.width).to.equal(100);
        expect(sprite1.height).to.equal(100);
      });

      it('gets and sets the same value', function() {
        sprite1.width = 200;
        sprite1.height = 450;
        expect(sprite1.width).to.equal(200);
        expect(sprite1.height).to.equal(450);
      });

      it('gets unscaled width and height', function() {
        sprite1.width = 200;
        sprite1.height = 450;
        sprite1.scale = 2;
        expect(sprite1.width).to.equal(200);
        expect(sprite1.height).to.equal(450);
        expect(sprite1.scale).to.equal(2);
        sprite1.scale = 0.5;
        expect(sprite1.width).to.equal(200);
        expect(sprite1.height).to.equal(450);
        expect(sprite1.scale).to.equal(0.5);
        sprite1.width = 100;
        expect(sprite1.width).to.equal(100);
      });
    });

    describe('sprites with animations', function() {
      var sprite;
      beforeEach(function() {
        var image = new p5.Image(100, 100, pInst);
        var frames = [{name: 0, frame: {x: 0, y: 0, width: 50, height: 50}}];
        var sheet = new pInst.SpriteSheet(image, frames);
        var animation = new pInst.Animation(sheet);
        sprite = pInst.createSprite(0, 0);
        sprite.addAnimation('label', animation);
      });

      it('defaults to image height and width when no width or height are set', function() {
        expect(sprite.width).to.equal(50);
        expect(sprite.height).to.equal(50);
      });

      it('gets and sets the same value', function() {
        sprite.width = 150;
        sprite.height = 200;
        expect(sprite.width).to.equal(150);
        expect(sprite.height).to.equal(200);
      });

      it('gets unscaled width and height', function() {
        sprite.width = 200;
        sprite.height = 450;
        sprite.scale = 2;
        expect(sprite.width).to.equal(200);
        expect(sprite.height).to.equal(450);
        expect(sprite.scale).to.equal(2);
        sprite.scale = 0.5;
        expect(sprite.width).to.equal(200);
        expect(sprite.height).to.equal(450);
        expect(sprite.scale).to.equal(0.5);
        sprite.width = 100;
        expect(sprite.width).to.equal(100);
      });
    });
  });

  describe('getScaledWidth, getScaledHeight', function() {
    describe('sprites without animations', function() {
      it('returns width and height when no scale is set', function() {
        var sprite1 = pInst.createSprite(200, 200);
        expect(sprite1.getScaledWidth()).to.equal(100);
        expect(sprite1.getScaledHeight()).to.equal(100);
        sprite1.width = 200;
        sprite1.height = 400;
        expect(sprite1.getScaledWidth()).to.equal(200);
        expect(sprite1.getScaledHeight()).to.equal(400);
      });

      it('gets scaled values', function() {
        var sprite1 = pInst.createSprite(200, 200);
        sprite1.width = 200;
        sprite1.height = 450;
        sprite1.scale = 2;
        expect(sprite1.getScaledWidth()).to.equal(400);
        expect(sprite1.getScaledHeight()).to.equal(900);
        expect(sprite1.scale).to.equal(2);
        sprite1.scale = 0.5;
        expect(sprite1.getScaledWidth()).to.equal(100);
        expect(sprite1.getScaledHeight()).to.equal(225);
        expect(sprite1.width).to.equal(200);
        expect(sprite1.height).to.equal(450);
        expect(sprite1.scale).to.equal(0.5);
        sprite1.width = 100;
        expect(sprite1.getScaledWidth()).to.equal(50);
      });
    });

    describe('sprites with animations', function() {
      var sprite1;
      beforeEach(function() {
        sprite1 = pInst.createSprite(0, 0);
        sprite1.addAnimation('label', createTestAnimation());
      });

      it('returns width and height when no scale is set', function() {
        expect(sprite1.getScaledWidth()).to.equal(50);
        expect(sprite1.getScaledHeight()).to.equal(50);
        sprite1.width = 200;
        sprite1.height = 400;
        expect(sprite1.getScaledWidth()).to.equal(200);
        expect(sprite1.getScaledHeight()).to.equal(400);
      });

      it('gets scaled values', function() {
        sprite1.width = 200;
        sprite1.height = 450;
        sprite1.scale = 2;
        expect(sprite1.getScaledWidth()).to.equal(400);
        expect(sprite1.getScaledHeight()).to.equal(900);
        expect(sprite1.scale).to.equal(2);
        sprite1.scale = 0.5;
        expect(sprite1.getScaledWidth()).to.equal(100);
        expect(sprite1.getScaledHeight()).to.equal(225);
        expect(sprite1.width).to.equal(200);
        expect(sprite1.height).to.equal(450);
        expect(sprite1.scale).to.equal(0.5);
        sprite1.width = 100;
        expect(sprite1.getScaledWidth()).to.equal(50);
      });

      it('gets scaled values regardless of colliders', function() {
        var sprite2 = pInst.createSprite(0, 0);
        sprite2.addAnimation('label', createTestAnimation());

        sprite1.width = 200;
        sprite1.height = 400;
        sprite1.scale = 2;

        expect(sprite1.getScaledWidth()).to.equal(400);
        expect(sprite1.getScaledHeight()).to.equal(800);
        sprite1.collide(sprite2);
        expect(sprite1.getScaledWidth()).to.equal(400);
        expect(sprite1.getScaledHeight()).to.equal(800);
      });
    });
  });

  describe('collision types using AABBOps', function() {
    var sprite, spriteTarget;

    beforeEach(function() {
      // sprite in to the left, moving right
      // spriteTarget in to the right, stationary
      sprite = pInst.createSprite(281, 100, 20, 20);
      spriteTarget = pInst.createSprite(300, 100, 20, 20);
      sprite.velocity.x = 3;
      spriteTarget.velocity.x = 0;

      expect(sprite.velocity.x).to.equal(3);
      expect(spriteTarget.velocity.x).to.equal(0);
    });

    it('stops movement of colliding sprite when sprites bounce', function() {
      // sprite stops moving, spriteTarget moves right
      var bounce = sprite.bounce(spriteTarget);

      expect(bounce).to.equal(true);

      expect(sprite.position.x).to.equal(280); // move back to not overlap with spriteTarget
      expect(spriteTarget.position.x).to.equal(300);
      expect(sprite.velocity.x).to.equal(0);
      expect(spriteTarget.velocity.x).to.equal(3);

      sprite.update();
      spriteTarget.update();

      expect(sprite.position.x).to.equal(280);
      expect(spriteTarget.position.x).to.equal(303);
      expect(sprite.velocity.x).to.equal(0);
      expect(spriteTarget.velocity.x).to.equal(3);

      sprite.bounce(spriteTarget);

      expect(sprite.position.x).to.equal(280);
      expect(spriteTarget.position.x).to.equal(303);
      expect(sprite.velocity.x).to.equal(0);
      expect(spriteTarget.velocity.x).to.equal(3);
    });

    it('stops movement of colliding sprite when sprites collide', function() {
      // sprite stops moving, spriteTarget stops moving
      var collide = sprite.collide(spriteTarget);

      expect(collide).to.equal(true);

      expect(sprite.position.x).to.equal(280);
      expect(spriteTarget.position.x).to.equal(300);
      expect(sprite.velocity.x).to.equal(0);
      expect(spriteTarget.velocity.x).to.equal(0);
    });

    it('continues movement of colliding sprite when sprites displace', function() {
      // sprite continues moving, spriteTarget gets pushed by sprite
      var displace = sprite.displace(spriteTarget);

      expect(displace).to.equal(true);
      expect(sprite.position.x).to.equal(281);
      expect(spriteTarget.position.x).to.equal(301);
      expect(sprite.velocity.x).to.equal(3);
      expect(spriteTarget.velocity.x).to.equal(0);

      sprite.update();
      spriteTarget.update();

      expect(sprite.position.x).to.equal(284);
      expect(spriteTarget.position.x).to.equal(301);
      expect(sprite.velocity.x).to.equal(3);
      expect(spriteTarget.velocity.x).to.equal(0);

      // Displace is true again, since sprite keeps moving into spriteTarget
      var displace2 = sprite.displace(spriteTarget);
      expect(displace2).to.be.true;
    });

    it('reverses direction of colliding sprite when sprites bounceOff', function() {
      // sprite reverses direction of movement, spriteTarget remains in its location
      var bounceOff = sprite.bounceOff(spriteTarget);

      expect(bounceOff).to.equal(true);
      expect(sprite.position.x).to.equal(280);
      expect(spriteTarget.position.x).to.equal(300);
      expect(sprite.velocity.x).to.equal(-3);
      expect(spriteTarget.velocity.x).to.equal(0);

      sprite.update();
      spriteTarget.update();

      expect(bounceOff).to.equal(true);
      expect(sprite.position.x).to.equal(277);
      expect(spriteTarget.position.x).to.equal(300);
      expect(sprite.velocity.x).to.equal(-3);
      expect(spriteTarget.velocity.x).to.equal(0);

      sprite.bounceOff(spriteTarget);

      expect(bounceOff).to.equal(true);
      expect(sprite.position.x).to.equal(277);
      expect(spriteTarget.position.x).to.equal(300);
      expect(sprite.velocity.x).to.equal(-3);
      expect(spriteTarget.velocity.x).to.equal(0);
    });

    it('continues movement of colliding sprite when sprites overlap', function() {
      // sprite continues moving, spriteTarget remains in it's location
      var overlap = sprite.overlap(spriteTarget);

      expect(overlap).to.equal(true);
      expect(sprite.position.x).to.equal(281);
      expect(spriteTarget.position.x).to.equal(300);
      expect(sprite.velocity.x).to.equal(3);
      expect(spriteTarget.velocity.x).to.equal(0);

      sprite.update();
      spriteTarget.update();

      expect(overlap).to.equal(true);
      expect(sprite.position.x).to.equal(284);
      expect(spriteTarget.position.x).to.equal(300);
      expect(sprite.velocity.x).to.equal(3);
      expect(spriteTarget.velocity.x).to.equal(0);

      sprite.overlap(spriteTarget);

      expect(overlap).to.equal(true);
      expect(sprite.position.x).to.equal(284);
      expect(spriteTarget.position.x).to.equal(300);
      expect(sprite.velocity.x).to.equal(3);
      expect(spriteTarget.velocity.x).to.equal(0);
    });

    it('destroyed sprites do not collide', function() {
      expect(sprite.overlap(spriteTarget)).to.equal(true);
      spriteTarget.remove();
      expect(sprite.overlap(spriteTarget)).to.equal(false);
      expect(spriteTarget.overlap(sprite)).to.equal(false);
    });
  });

  describe('collisions with groups', function() {
    var sprite, spriteTarget1, spriteTarget2, group;

    beforeEach(function() {
      spriteTarget1 = pInst.createSprite(0, 0, 100, 100);
      spriteTarget2 = pInst.createSprite(400, 400, 100, 100);
      sprite = pInst.createSprite(200, 200, 100, 100);
      group = pInst.createGroup();
      group.add(spriteTarget1);
      group.add(spriteTarget2);
    });

    it('isTouching returns false when sprite touches nothing in the group', function() {
      var result = sprite.isTouching(group);
      expect(result).to.equal(false);
    });

    it('isTouching returns true when sprite touches anything in the group', function() {
      spriteTarget1.x = sprite.x;
      spriteTarget1.y = sprite.y;

      var result2 = sprite.isTouching(group);
      expect(result2).to.equal(true);
    });

    it('collide returns false when sprite touches nothing in the group', function() {
      var result = sprite.collide(group);
      expect(result).to.equal(false);
    });

    it('collide returns true when sprite touches anything in the group', function() {
      spriteTarget1.x = sprite.x;
      spriteTarget1.y = sprite.y;

      var result2 = sprite.collide(group);
      expect(result2).to.equal(true);
    });

    it('bounce returns false when sprite touches nothing in the group', function() {
      var result = sprite.bounce(group);
      expect(result).to.equal(false);
    });

    it('bounce returns true when sprite touches anything in the group', function() {
      spriteTarget1.x = sprite.x;
      spriteTarget1.y = sprite.y;

      var result2 = sprite.bounce(group);
      expect(result2).to.equal(true);
    });

    it('bounceOff returns false when sprite touches nothing in the group', function() {
      var result = sprite.bounceOff(group);
      expect(result).to.equal(false);
    });

    it('bounceOff returns true when sprite touches anything in the group', function() {
      spriteTarget1.x = sprite.x;
      spriteTarget1.y = sprite.y;

      var result2 = sprite.bounceOff(group);
      expect(result2).to.equal(true);
    });

    it('displace returns false when sprite touches nothing in the group', function() {
      var result = sprite.displace(group);
      expect(result).to.equal(false);
    });

    it('displace returns true when sprite touches anything in the group', function() {
      spriteTarget1.x = sprite.x;
      spriteTarget1.y = sprite.y;

      var result2 = sprite.displace(group);
      expect(result2).to.equal(true);
    });

    it('overlap returns false when sprite touches nothing in the group', function() {
      var result = sprite.overlap(group);
      expect(result).to.equal(false);
    });

    it('overlap returns true when sprite touches anything in the group', function() {
      spriteTarget1.x = sprite.x;
      spriteTarget1.y = sprite.y;

      var result2 = sprite.overlap(group);
      expect(result2).to.equal(true);
    });
  });

  describe('sprite.collide(sprite)', function() {
    var SIZE = 10;
    var pInst;
    var spriteA, spriteB;
    var callCount, pairs;

    function testCallback(a, b) {
      callCount++;
      pairs.push([a.name, b.name]);
    }

    function moveAToB(a, b) {
      a.position.x = b.position.x;
    }

    beforeEach(function() {
      pInst = new p5(function() {});
      callCount = 0;
      pairs = [];

      function createTestSprite(letter, position) {
        var sprite = pInst.createSprite(position, 0, SIZE, SIZE);
        sprite.name = 'sprite' + letter;
        return sprite;
      }

      spriteA = createTestSprite('A', 2 * SIZE);
      spriteB = createTestSprite('B', 4 * SIZE);

      // Assert initial test state:
      // - Two total sprites
      // - no two sprites overlap
      expect(pInst.allSprites.length).to.equal(2);
      pInst.allSprites.forEach(function(caller) {
        pInst.allSprites.forEach(function(callee) {
          expect(caller.overlap(callee)).to.be.false;
        });
      });
    });

    afterEach(function() {
      pInst.remove();
    });

    it('false if sprites do not overlap', function() {
      expect(spriteA.collide(spriteB)).to.be.false;
      expect(spriteB.collide(spriteA)).to.be.false;
    });

    it('true if sprites overlap', function() {
      moveAToB(spriteA, spriteB);
      expect(spriteA.collide(spriteB)).to.be.true;

      moveAToB(spriteA, spriteB);
      expect(spriteB.collide(spriteA)).to.be.true;
    });

    it('calls callback once if sprites overlap', function() {
      expect(callCount).to.equal(0);

      moveAToB(spriteA, spriteB);
      spriteA.collide(spriteB, testCallback);
      expect(callCount).to.equal(1);

      moveAToB(spriteA, spriteB);
      spriteB.collide(spriteA, testCallback);
      expect(callCount).to.equal(2);
    });

    it('does not call callback if sprites do not overlap', function() {
      expect(callCount).to.equal(0);
      spriteA.collide(spriteB, testCallback);
      expect(callCount).to.equal(0);
      spriteB.collide(spriteA, testCallback);
      expect(callCount).to.equal(0);
    });

    describe('passes collider and collidee to callback', function() {
      it('A-B', function() {
        moveAToB(spriteA, spriteB);
        spriteA.collide(spriteB, testCallback);
        expect(pairs).to.deep.equal([[spriteA.name, spriteB.name]]);
      });

      it('B-A', function() {
        moveAToB(spriteA, spriteB);
        spriteB.collide(spriteA, testCallback);
        expect(pairs).to.deep.equal([[spriteB.name, spriteA.name]]);
      });
    });

    it('does not reposition either sprite when sprites do not overlap', function() {
      var initialPositionA = spriteA.position.copy();
      var initialPositionB = spriteB.position.copy();

      spriteA.collide(spriteB);

      expectVectorsAreClose(spriteA.position, initialPositionA);
      expectVectorsAreClose(spriteB.position, initialPositionB);

      spriteB.collide(spriteA);

      expectVectorsAreClose(spriteA.position, initialPositionA);
      expectVectorsAreClose(spriteB.position, initialPositionB);
    });

    describe('displaces the caller out of collision when sprites do overlap', function() {
      it('to the left', function() {
        spriteA.position.x = spriteB.position.x - 1;

        var expectedPositionA = spriteB.position.copy().add(-SIZE, 0);
        var expectedPositionB = spriteB.position.copy();

        spriteA.collide(spriteB);

        expectVectorsAreClose(spriteA.position, expectedPositionA);
        expectVectorsAreClose(spriteB.position, expectedPositionB);
      });

      it('to the right', function() {
        spriteA.position.x = spriteB.position.x + 1;

        var expectedPositionA = spriteB.position.copy().add(SIZE, 0);
        var expectedPositionB = spriteB.position.copy();

        spriteA.collide(spriteB);

        expectVectorsAreClose(spriteA.position, expectedPositionA);
        expectVectorsAreClose(spriteB.position, expectedPositionB);
      });

      it('caller and callee reversed', function() {
        spriteA.position.x = spriteB.position.x + 1;

        var expectedPositionA = spriteA.position.copy();
        var expectedPositionB = spriteA.position.copy().add(-SIZE, 0);

        spriteB.collide(spriteA);

        expectVectorsAreClose(spriteA.position, expectedPositionA);
        expectVectorsAreClose(spriteB.position, expectedPositionB);
      });
    });

    it('does not change velocity of either sprite when sprites do not overlap', function() {
      var initialVelocityA = spriteA.velocity.copy();
      var initialVelocityB = spriteB.velocity.copy();

      spriteA.collide(spriteB);

      expectVectorsAreClose(spriteA.velocity, initialVelocityA);
      expectVectorsAreClose(spriteB.velocity, initialVelocityB);

      spriteB.collide(spriteA);

      expectVectorsAreClose(spriteA.velocity, initialVelocityA);
      expectVectorsAreClose(spriteB.velocity, initialVelocityB);
    });

    describe('matches caller velocity to callee velocity when sprites do overlap', function() {
      it('when callee velocity is zero', function() {
        spriteA.position.x = spriteB.position.x - 1;
        spriteA.velocity.x = 2;
        spriteB.velocity.x = 0;

        var expectedVelocityA = spriteB.velocity.copy();
        var expectedVelocityB = spriteB.velocity.copy();

        spriteA.collide(spriteB);

        expectVectorsAreClose(spriteA.velocity, expectedVelocityA);
        expectVectorsAreClose(spriteB.velocity, expectedVelocityB);
      });

      it('when callee velocity is nonzero', function() {
        spriteA.position.x = spriteB.position.x - 1;
        spriteA.velocity.x = 2;
        spriteB.velocity.x = -1;

        var expectedVelocityA = spriteB.velocity.copy();
        var expectedVelocityB = spriteB.velocity.copy();

        spriteA.collide(spriteB);

        expectVectorsAreClose(spriteA.velocity, expectedVelocityA);
        expectVectorsAreClose(spriteB.velocity, expectedVelocityB);
      });

      it('only along x axis when only displaced along x axis', function() {
        spriteA.position.x = spriteB.position.x - 1;
        spriteA.velocity.x = 2;
        spriteA.velocity.y = 3;
        spriteB.velocity.x = -1;

        // Expect to change velocity only along X
        var expectedVelocityA = spriteA.velocity.copy();
        expectedVelocityA.x = spriteB.velocity.x;
        var expectedVelocityB = spriteB.velocity.copy();

        spriteA.collide(spriteB);

        expectVectorsAreClose(spriteA.velocity, expectedVelocityA);
        expectVectorsAreClose(spriteB.velocity, expectedVelocityB);
      });

      it('only along y axis when only displaced along y axis', function() {
        spriteA.position.x = spriteB.position.x;
        spriteA.position.y = spriteB.position.y + 1;
        spriteA.velocity.x = 2;
        spriteA.velocity.y = 3;
        spriteB.velocity.x = -1;
        spriteB.velocity.y = 1.5;

        // Expect to change velocity only along Y
        var expectedVelocityA = spriteA.velocity.copy();
        expectedVelocityA.y = spriteB.velocity.y;
        var expectedVelocityB = spriteB.velocity.copy();

        spriteA.collide(spriteB);

        expectVectorsAreClose(spriteA.velocity, expectedVelocityA);
        expectVectorsAreClose(spriteB.velocity, expectedVelocityB);
      });

      it('caller and callee reversed', function() {
        spriteA.position.x = spriteB.position.x - 1;
        spriteA.velocity.x = 2;
        spriteB.velocity.x = -1;

        var expectedVelocityA = spriteA.velocity.copy();
        var expectedVelocityB = spriteA.velocity.copy();

        spriteB.collide(spriteA);

        expectVectorsAreClose(spriteA.velocity, expectedVelocityA);
        expectVectorsAreClose(spriteB.velocity, expectedVelocityB);
      });
    });
  });

  describe('sprite.displace(sprite)', function() {
    var SIZE = 10;
    var pInst;
    var spriteA, spriteB;
    var callCount, pairs;

    function testCallback(a, b) {
      callCount++;
      pairs.push([a.name, b.name]);
    }

    function moveAToB(a, b) {
      a.position.x = b.position.x;
    }

    beforeEach(function() {
      pInst = new p5(function() {
      });
      callCount = 0;
      pairs = [];

      function createTestSprite(letter, position) {
        var sprite = pInst.createSprite(position, 0, SIZE, SIZE);
        sprite.name = 'sprite' + letter;
        return sprite;
      }

      spriteA = createTestSprite('A', 2 * SIZE);
      spriteB = createTestSprite('B', 4 * SIZE);

      // Assert initial test state:
      // - Two total sprites
      // - no two sprites overlap
      expect(pInst.allSprites.length).to.equal(2);
      pInst.allSprites.forEach(function(caller) {
        pInst.allSprites.forEach(function(callee) {
          expect(caller.overlap(callee)).to.be.false;
        });
      });
    });

    afterEach(function() {
      pInst.remove();
    });

    it('false if sprites do not overlap', function() {
      expect(spriteA.displace(spriteB)).to.be.false;
      expect(spriteB.displace(spriteA)).to.be.false;
    });

    it('true if sprites overlap', function() {
      moveAToB(spriteA, spriteB);
      expect(spriteA.displace(spriteB)).to.be.true;

      moveAToB(spriteA, spriteB);
      expect(spriteB.displace(spriteA)).to.be.true;
    });

    it('calls callback once if sprites overlap', function() {
      expect(callCount).to.equal(0);

      moveAToB(spriteA, spriteB);
      spriteA.displace(spriteB, testCallback);
      expect(callCount).to.equal(1);

      moveAToB(spriteA, spriteB);
      spriteB.displace(spriteA, testCallback);
      expect(callCount).to.equal(2);
    });

    it('does not call callback if sprites do not overlap', function() {
      expect(callCount).to.equal(0);
      spriteA.displace(spriteB, testCallback);
      expect(callCount).to.equal(0);
      spriteB.displace(spriteA, testCallback);
      expect(callCount).to.equal(0);
    });

    describe('passes collider and collidee to callback', function() {
      it('A-B', function() {
        moveAToB(spriteA, spriteB);
        spriteA.displace(spriteB, testCallback);
        expect(pairs).to.deep.equal([[spriteA.name, spriteB.name]]);
      });

      it('B-A', function() {
        moveAToB(spriteA, spriteB);
        spriteB.displace(spriteA, testCallback);
        expect(pairs).to.deep.equal([[spriteB.name, spriteA.name]]);
      });
    });

    it('does not reposition either sprite when sprites do not overlap', function() {
      var initialPositionA = spriteA.position.copy();
      var initialPositionB = spriteB.position.copy();

      spriteA.displace(spriteB);

      expectVectorsAreClose(spriteA.position, initialPositionA);
      expectVectorsAreClose(spriteB.position, initialPositionB);

      spriteB.displace(spriteA);

      expectVectorsAreClose(spriteA.position, initialPositionA);
      expectVectorsAreClose(spriteB.position, initialPositionB);
    });

    describe('displaces the callee out of collision when sprites do overlap', function() {
      it('to the left', function() {
        spriteA.position.x = spriteB.position.x - 1;

        var expectedPositionA = spriteA.position.copy();
        var expectedPositionB = spriteA.position.copy().add(SIZE, 0);

        spriteA.displace(spriteB);

        expectVectorsAreClose(spriteA.position, expectedPositionA);
        expectVectorsAreClose(spriteB.position, expectedPositionB);
      });

      it('to the right', function() {
        spriteA.position.x = spriteB.position.x + 1;

        var expectedPositionA = spriteA.position.copy();
        var expectedPositionB = spriteA.position.copy().add(-SIZE, 0);

        spriteA.displace(spriteB);

        expectVectorsAreClose(spriteA.position, expectedPositionA);
        expectVectorsAreClose(spriteB.position, expectedPositionB);
      });

      it('caller and callee reversed', function() {
        spriteA.position.x = spriteB.position.x + 1;

        var expectedPositionA = spriteB.position.copy().add(SIZE, 0);
        var expectedPositionB = spriteB.position.copy();

        spriteB.displace(spriteA);

        expectVectorsAreClose(spriteA.position, expectedPositionA);
        expectVectorsAreClose(spriteB.position, expectedPositionB);
      });
    });

    it('does not change velocity of either sprite when sprites do not overlap', function() {
      var initialVelocityA = spriteA.velocity.copy();
      var initialVelocityB = spriteB.velocity.copy();

      spriteA.displace(spriteB);

      expectVectorsAreClose(spriteA.velocity, initialVelocityA);
      expectVectorsAreClose(spriteB.velocity, initialVelocityB);

      spriteB.displace(spriteA);

      expectVectorsAreClose(spriteA.velocity, initialVelocityA);
      expectVectorsAreClose(spriteB.velocity, initialVelocityB);
    });

    describe('does not change callee velocity', function() {
      it('when caller velocity is zero', function() {
        spriteA.position.x = spriteB.position.x - 1;
        spriteA.velocity.x = 0;
        spriteB.velocity.x = 2;

        var expectedVelocityA = spriteA.velocity.copy();
        var expectedVelocityB = spriteB.velocity.copy();

        spriteA.displace(spriteB);

        expectVectorsAreClose(spriteA.velocity, expectedVelocityA);
        expectVectorsAreClose(spriteB.velocity, expectedVelocityB);
      });

      it('when caller velocity is nonzero', function() {
        spriteA.position.x = spriteB.position.x - 1;
        spriteA.velocity.x = 2;
        spriteB.velocity.x = -1;

        var expectedVelocityA = spriteA.velocity.copy();
        var expectedVelocityB = spriteB.velocity.copy();

        spriteA.displace(spriteB);

        expectVectorsAreClose(spriteA.velocity, expectedVelocityA);
        expectVectorsAreClose(spriteB.velocity, expectedVelocityB);
      });

      it('when only displaced along x axis', function() {
        spriteA.position.x = spriteB.position.x - 1;
        spriteA.velocity.x = 2;
        spriteA.velocity.y = 0.5;
        spriteB.velocity.x = -1;
        spriteB.velocity.y = 3;

        var expectedVelocityA = spriteA.velocity.copy();
        var expectedVelocityB = spriteB.velocity.copy();

        spriteA.displace(spriteB);

        expectVectorsAreClose(spriteA.velocity, expectedVelocityA);
        expectVectorsAreClose(spriteB.velocity, expectedVelocityB);
      });

      it('when only displaced along y axis', function() {
        spriteA.position.x = spriteB.position.x;
        spriteA.position.y = spriteB.position.y + 1;
        spriteA.velocity.x = 2;
        spriteA.velocity.y = 3;
        spriteB.velocity.x = -1;
        spriteB.velocity.y = 1.5;

        var expectedVelocityA = spriteA.velocity.copy();
        var expectedVelocityB = spriteB.velocity.copy();

        spriteA.displace(spriteB);

        expectVectorsAreClose(spriteA.velocity, expectedVelocityA);
        expectVectorsAreClose(spriteB.velocity, expectedVelocityB);
      });

      it('caller and callee reversed', function() {
        spriteA.position.x = spriteB.position.x - 1;
        spriteA.velocity.x = 2;
        spriteB.velocity.x = -1;

        var expectedVelocityA = spriteA.velocity.copy();
        var expectedVelocityB = spriteB.velocity.copy();

        spriteB.displace(spriteA);

        expectVectorsAreClose(spriteA.velocity, expectedVelocityA);
        expectVectorsAreClose(spriteB.velocity, expectedVelocityB);
      });
    });
  });

  describe('_fixedSpriteAnimationFrameSizes property', function() {
    var pInst, testAnimation;

    beforeEach(function() {
      pInst = new p5(function() {});
      // Create a test animation where the initial frame size is 50x50,
      // the next frame is 50x60, and the 3rd is 50x70:
      testAnimation = createTestAnimation(3, false, 10);
    });

    afterEach(function() {
      pInst.remove();
    });

    describe('_fixedSpriteAnimationFrameSizes is true', function() {
      var sprite;

      beforeEach(function() {
        pInst._fixedSpriteAnimationFrameSizes = true;
        sprite = pInst.createSprite(0, 0);
        sprite.addAnimation('testAnim', testAnimation);
      });

      it('initial sprite dimensions come from animation first frame size', function() {
        expect(sprite.width).to.equal(50);
        expect(sprite.height).to.equal(50);
      });

      it('sprite dimensions stay fixed when advancing to different animation frame sizes', function() {
        sprite.update();
        expect(sprite.width).to.equal(50);
        expect(sprite.height).to.equal(50);
      });

      it('allows sprite dimensions to be changed when animation is set with different frame size', function() {
        sprite.width = 190;
        sprite.height = 80;
        sprite.update();
        expect(sprite.width).to.equal(190);
        expect(sprite.height).to.equal(80);
      });
    });

    describe('_fixedSpriteAnimationFrameSizes is false', function() {
      var sprite;

      beforeEach(function() {
        pInst._fixedSpriteAnimationFrameSizes = false;
        sprite = pInst.createSprite(0, 0);
        sprite.addAnimation('testAnim', testAnimation);
      });

      it('initial sprite dimensions come from animation first frame size', function() {
        expect(sprite.width).to.equal(50);
        expect(sprite.height).to.equal(50);
      });

      it('sprite dimensions change when advancing to different animation frame sizes', function() {
        sprite.update();
        expect(sprite.width).to.equal(50);
        expect(sprite.height).to.equal(60);
      });

      it('does not allow sprite dimensions to be changed when animation is set with different frame size', function() {
        sprite.width = 190;
        sprite.height = 80;
        sprite.update();
        expect(sprite.width).to.equal(50);
        expect(sprite.height).to.equal(60);
      });
    });
  });

  describe('setAnimation(label)', function() {
    var ANIMATION_LABEL = 'animation1', SECOND_ANIMATION_LABEL = 'animation2';
    var sprite, predefinedSpriteAnimations;

    beforeEach(function() {
      sprite = pInst.createSprite(0, 0);

      // We manually preload animations onto pInst._predefinedSpriteAnimations for the use of
      // setAnimation.
      predefinedSpriteAnimations = {};
      predefinedSpriteAnimations[ANIMATION_LABEL] = createTestAnimation(8);
      predefinedSpriteAnimations[SECOND_ANIMATION_LABEL] = createTestAnimation(10);
      pInst._predefinedSpriteAnimations = predefinedSpriteAnimations;
    });

    it('throws if the named animation is not found in the project', function() {
      expect(function() {
        sprite.setAnimation('fakeAnimation');
      }).to.throw('Unable to find an animation named "fakeAnimation".  Please make sure the animation exists.');
    });

    it('makes the named animaiton the current animation, if the animation is found', function() {
      sprite.setAnimation(ANIMATION_LABEL);

      // Current animation label should be animation label
      expect(sprite.getAnimationLabel()).to.equal(ANIMATION_LABEL);

      // Current animation will be a clone of the project animation:
      expectAnimationsAreClones(sprite.animation, predefinedSpriteAnimations[ANIMATION_LABEL]);
    });

    it('changes the animation to first frame and plays it by default', function() {
      sprite.setAnimation(ANIMATION_LABEL);

      // Animation is at frame 1
      expect(sprite.animation.getFrame()).to.equal(0);

      // Animation is playing
      expect(sprite.animation.playing).to.be.true;
    });

    describe('repeat call', function() {
      beforeEach(function() {
        // Set first animation and advance a few frames, to simulate an
        // animation in the middle of playback.
        sprite.setAnimation(ANIMATION_LABEL);
        sprite.animation.changeFrame(3);
      });

      it('resets the current frame if called with a new animation', function() {
        expect(sprite.getAnimationLabel()).to.equal(ANIMATION_LABEL);
        expect(sprite.animation.getFrame()).to.equal(3);

        sprite.setAnimation(SECOND_ANIMATION_LABEL);

        expect(sprite.getAnimationLabel()).to.equal(SECOND_ANIMATION_LABEL);
        expect(sprite.animation.getFrame()).to.equal(0);
      });

      it('does not reset the current frame if called with the current animation', function() {
        expect(sprite.getAnimationLabel()).to.equal(ANIMATION_LABEL);
        expect(sprite.animation.getFrame()).to.equal(3);

        sprite.setAnimation(ANIMATION_LABEL);

        expect(sprite.getAnimationLabel()).to.equal(ANIMATION_LABEL);
        expect(sprite.animation.getFrame()).to.equal(3);
      });

      it('unpasuses a paused sprite if called with a new animation', function() {
        sprite.pause();
        expect(sprite.getAnimationLabel()).to.equal(ANIMATION_LABEL);
        expect(sprite.animation.playing).to.be.false;

        sprite.setAnimation(SECOND_ANIMATION_LABEL);

        expect(sprite.getAnimationLabel()).to.equal(SECOND_ANIMATION_LABEL);
        expect(sprite.animation.playing).to.be.true;
      });

      it('does not unpause a paused sprite if called with the current animation', function() {
        expect(sprite.animation.playing).to.be.true;
        sprite.pause();
        expect(sprite.getAnimationLabel()).to.equal(ANIMATION_LABEL);
        expect(sprite.animation.playing).to.be.false;

        sprite.setAnimation(ANIMATION_LABEL);

        expect(sprite.getAnimationLabel()).to.equal(ANIMATION_LABEL);
        expect(sprite.animation.playing).to.be.false;
      });

      // Applies to both cases, so unify them
      forEveryBooleanPermutation(function(same) {
        var description = same ? 'called with the current animation' : 'called with a new animation';
        var label = same ? ANIMATION_LABEL : SECOND_ANIMATION_LABEL;
        it('does not pause a playing sprite if ' + description, function() {
          expect(sprite.getAnimationLabel()).to.equal(ANIMATION_LABEL);
          expect(sprite.animation.playing).to.be.true;

          sprite.setAnimation(label);

          expect(sprite.getAnimationLabel()).to.equal(label);
          expect(sprite.animation.playing).to.be.true;
        });
      });
    });
  });

  /**
   * Given a function with n required boolean arguments, invokes the
   * function 2^n times, once with every possible permutation of arguments.
   * If the given function has no arguments it will be invoked once.
   * @param {function} fn
   * @example
   *   forEveryBooleanPermutation((a, b) => {
   *     console.log(a, b);
   *   });
   *   // Runs four times, logging:
   *   // false, false
   *   // false, true
   *   // true, false
   *   // true, true
   */
  function forEveryBooleanPermutation(fn) {
    var argCount = fn.length;
    var numPermutations = Math.pow(2, argCount);
    for (var i = 0; i < numPermutations; i++) {
      fn.apply(null, getBooleanPermutation(i, argCount));
    }
  }

  function zeroPadLeft(string, desiredWidth) {
    var zeroPad = '';
    for (var i = 0; i < desiredWidth; i++) {
      zeroPad = zeroPad + '0';
    }
    return (zeroPad + string).slice(-desiredWidth);
  }

  function getBooleanPermutation(n, numberOfBooleans) {
    return zeroPadLeft(n.toString(2), numberOfBooleans) // Padded binary string
        .split('') // to array of '0' and '1'
        .map(function(x) {
          return x === '1';
        }); // to array of booleans
  }

  function expectSpriteSheetsAreClones(sheet1, sheet2) {
    // Not identical
    expect(sheet1).not.to.equal(sheet2);
    // But frame array is same size
    // Note: Would check deep equal but cloning frames adds 'name' property in
    //       some cases
    expect(sheet1.frames.length).to.equal(sheet2.frames.length);
    // And other props exactly equal
    expect(sheet1.image).to.equal(sheet2.image);
    expect(sheet1.frame_width).to.equal(sheet2.frame_width);
    expect(sheet1.frame_height).to.equal(sheet2.frame_height);
    expect(sheet1.num_frames).to.equal(sheet2.num_frames);
  }

  function expectAnimationsAreClones(anim1, anim2) {
    // Not identical
    expect(anim1).not.to.equal(anim2);
    // But spritesheet is a clone
    expectSpriteSheetsAreClones(anim1.spriteSheet, anim2.spriteSheet);
    // And image array is deep equal
    expect(anim1.images).to.deep.equal(anim2.images);
    // And other props are exactly equal
    expect(anim1.offX).to.equal(anim2.offX);
    expect(anim1.offY).to.equal(anim2.offY);
    expect(anim1.frameDelay).to.equal(anim2.frameDelay);
    expect(anim1.playing).to.equal(anim2.playing);
    expect(anim1.looping).to.equal(anim2.looping);
  }

  function createTestAnimation(frameCount, looping, heightIncreasePerFrame) {
    if (frameCount === undefined) {
      frameCount = 1;
    }
    if (looping === undefined) {
      looping = true;
    }
    if (heightIncreasePerFrame === undefined) {
      heightIncreasePerFrame = 0;
    }
    var image = new p5.Image(100, 100, pInst);
    var frames = [];
    var nextHeight = 50;
    for (var i = 0; i < frameCount; i++) {
      frames.push({name: i, frame: {x: 0, y: 0, width: 50, height: nextHeight}});
      nextHeight += heightIncreasePerFrame;
    }
    var sheet = new pInst.SpriteSheet(image, frames);
    var animation = new pInst.Animation(sheet);
    animation.looping = looping;
    animation.frameDelay = 1;
    return animation;
  }
});
