describe('General', function() {
  var pInst;

  beforeEach(function() {
    pInst = new p5(function() {});
  });

  afterEach(function() {
    pInst.remove();
  });

  describe('createEdgeSprites method', function() {
    var edgeGroup;

    beforeEach(function() {
      edgeGroup = pInst.createEdgeSprites();
    });

    it('returns a group of sprites', function() {
      expect(edgeGroup).to.equal(pInst.edges);
      expect(edgeGroup.contains(pInst.rightEdge)).to.equal(true);
      expect(edgeGroup.contains(pInst.leftEdge)).to.equal(true);
      expect(edgeGroup.contains(pInst.bottomEdge)).to.equal(true);
      expect(edgeGroup.contains(pInst.topEdge)).to.equal(true);
      expect(edgeGroup.maxDepth()).to.equal(4);
    });

    it('creates edge sprites off screen', function() {
      expect(pInst.leftEdge.position.x).to.equal(-50);
      expect(pInst.leftEdge.position.y).to.equal(200);
      expect(pInst.leftEdge.width).to.equal(100);
      expect(pInst.leftEdge.height).to.equal(400);

      expect(pInst.rightEdge.position.x).to.equal(450);
      expect(pInst.rightEdge.position.y).to.equal(200);
      expect(pInst.rightEdge.width).to.equal(100);
      expect(pInst.rightEdge.height).to.equal(400);

      expect(pInst.bottomEdge.position.x).to.equal(200);
      expect(pInst.bottomEdge.position.y).to.equal(450);
      expect(pInst.bottomEdge.width).to.equal(400);
      expect(pInst.bottomEdge.height).to.equal(100);

      expect(pInst.topEdge.position.x).to.equal(200);
      expect(pInst.topEdge.position.y).to.equal(-50);
      expect(pInst.topEdge.width).to.equal(400);
      expect(pInst.topEdge.height).to.equal(100);
    });
  });

  describe('World.seconds', function() {
    it('returns time passed in seconds', function() {
      sinon.stub(Date.prototype, 'getTime');
      // Time at the start of the program.
      Date.prototype.getTime.onCall(0).returns(5300);
      // Time when seconds gets called.
      Date.prototype.getTime.onCall(1).returns(10000);

      // Re-init p5 to capture the _startTime
      pInst.remove();
      pInst = new p5(function() {});

      expect(pInst.World.seconds).to.equal(5);
      Date.prototype.getTime.restore();
    });
  });
});
