describe('CollisionShape interface', function() {
  // We run this suite of tests for every type that extends from CollisionShape,
  // to ensure that none of them break these assumptions.
  [
    'PointCollider',
    'CircleCollider',
    'AxisAlignedBoundingBoxCollider',
    'OrientedBoundingBoxCollider'
  ].forEach(function(typeName) {
    describe('as implemented by ' + typeName, function() {
      var ShapeType = p5[typeName];

      it('can construct with no arguments', function() {
        var shape = new ShapeType();
        expect(shape.center.x).to.eq(0);
        expect(shape.center.y).to.eq(0);
        expect(shape.rotation).to.eq(0);
        expect(shape.scale.x).to.eq(1);
        expect(shape.scale.y).to.eq(1);
      });

      it('can construct with a center vector', function() {
        var shape = new ShapeType(new p5.Vector(2, 3));
        expect(shape.center.x).to.eq(2);
        expect(shape.center.y).to.eq(3);
        expect(shape.offset.x).to.eq(2);
        expect(shape.offset.y).to.eq(3);
        expect(shape.rotation).to.eq(0);
        expect(shape.scale.x).to.eq(1);
        expect(shape.scale.y).to.eq(1);
      });

      it('can modify shape center', function() {
        var shape = new ShapeType(new p5.Vector(2, 3));
        expect(shape.center.x).to.eq(2);
        expect(shape.center.y).to.eq(3);
        expect(shape.offset.x).to.eq(2);
        expect(shape.offset.y).to.eq(3);
        expect(shape.rotation).to.eq(0);
        expect(shape.scale.x).to.eq(1);
        expect(shape.scale.y).to.eq(1);

        shape.center = new p5.Vector(4, 5);
        expect(shape.center.x).to.eq(4);
        expect(shape.center.y).to.eq(5);
        expect(shape.offset.x).to.eq(4);
        expect(shape.offset.y).to.eq(5);
        expect(shape.rotation).to.eq(0);
        expect(shape.scale.x).to.eq(1);
        expect(shape.scale.y).to.eq(1);
      });

      it('can modify shape offset', function() {
        var shape = new ShapeType(new p5.Vector(2, 3));
        expect(shape.center.x).to.eq(2);
        expect(shape.center.y).to.eq(3);
        expect(shape.offset.x).to.eq(2);
        expect(shape.offset.y).to.eq(3);
        expect(shape.rotation).to.eq(0);
        expect(shape.scale.x).to.eq(1);
        expect(shape.scale.y).to.eq(1);

        shape.offset = new p5.Vector(4, 5);
        expect(shape.center.x).to.eq(4);
        expect(shape.center.y).to.eq(5);
        expect(shape.offset.x).to.eq(4);
        expect(shape.offset.y).to.eq(5);
        expect(shape.rotation).to.eq(0);
        expect(shape.scale.x).to.eq(1);
        expect(shape.scale.y).to.eq(1);
      });

      it('can modify shape rotation', function() {
        var shape = new ShapeType();
        expect(shape.center.x).to.eq(0);
        expect(shape.center.y).to.eq(0);
        expect(shape.offset.x).to.eq(0);
        expect(shape.offset.y).to.eq(0);
        expect(shape.rotation).to.eq(0);
        expect(shape.scale.x).to.eq(1);
        expect(shape.scale.y).to.eq(1);

        shape.rotation = 2;
        expect(shape.center.x).to.eq(0);
        expect(shape.center.y).to.eq(0);
        expect(shape.offset.x).to.eq(0);
        expect(shape.offset.y).to.eq(0);
        expect(shape.rotation).to.eq(2);
        expect(shape.scale.x).to.eq(-1);
        expect(shape.scale.y).to.eq(-1);
      });

      it('can modify shape scale', function() {
        var shape = new ShapeType();
        expect(shape.center.x).to.eq(0);
        expect(shape.center.y).to.eq(0);
        expect(shape.offset.x).to.eq(0);
        expect(shape.offset.y).to.eq(0);
        expect(shape.rotation).to.eq(0);
        expect(shape.scale.x).to.eq(1);
        expect(shape.scale.y).to.eq(1);

        shape.scale = new p5.Vector(2, 3);
        expect(shape.center.x).to.eq(0);
        expect(shape.center.y).to.eq(0);
        expect(shape.offset.x).to.eq(0);
        expect(shape.offset.y).to.eq(0);
        expect(shape.rotation).to.eq(0);
        expect(shape.scale.x).to.eq(2);
        expect(shape.scale.y).to.eq(3);
      });

      it('can compute its bounding box', function() {
        var shape = new ShapeType();
        var bbox = shape.getBoundingBox();
        expect(typeof bbox.top).to.eq('number');
        expect(typeof bbox.bottom).to.eq('number');
        expect(typeof bbox.left).to.eq('number');
        expect(typeof bbox.right).to.eq('number');
        expect(typeof bbox.width).to.eq('number');
        expect(typeof bbox.height).to.eq('number');
      });

      describe('parent transforms', function() {
        it('center represents global (combined) position, offset represents local', function() {
          var shape = new ShapeType(new p5.Vector(2, 3));
          shape.setParentTransform(new p5.Transform2D().translate(4, 5));
          expect(shape.center.x).to.eq(6);
          expect(shape.center.y).to.eq(8);
          expect(shape.offset.x).to.eq(2);
          expect(shape.offset.y).to.eq(3);
          expect(shape._parentTransform.getTranslation().x).to.eq(4);
          expect(shape._parentTransform.getTranslation().y).to.eq(5);
        });

        it('setting offset modifies center', function() {
          var shape = new ShapeType(new p5.Vector(2, 3));
          shape.setParentTransform(new p5.Transform2D().translate(4, 5));
          expect(shape.center.x).to.eq(6);
          expect(shape.center.y).to.eq(8);
          expect(shape.offset.x).to.eq(2);
          expect(shape.offset.y).to.eq(3);

          shape.offset = new p5.Vector(-3, -2);
          expect(shape.center.x).to.eq(1);
          expect(shape.center.y).to.eq(3);
          expect(shape.offset.x).to.eq(-3);
          expect(shape.offset.y).to.eq(-2);
        });

        it('setting center modifies offset', function() {
          var shape = new ShapeType(new p5.Vector(2, 3));
          shape.setParentTransform(new p5.Transform2D().translate(4, 5));
          expect(shape.center.x).to.eq(6);
          expect(shape.center.y).to.eq(8);
          expect(shape.offset.x).to.eq(2);
          expect(shape.offset.y).to.eq(3);

          shape.center = new p5.Vector(-3, -2);
          expect(shape.center.x).to.eq(-3);
          expect(shape.center.y).to.eq(-2);
          expect(shape.offset.x).to.eq(-7);
          expect(shape.offset.y).to.eq(-7);
        });

        describe('_getCandidateAxesForShapes', function() {
          it('replaces a zero axis with world X-axis', function() {
            // Circles with the same center might result in a zero-vector axis
            var a = new p5.CircleCollider(new p5.Vector(2, 3), 1);
            var b = new p5.CircleCollider(new p5.Vector(2, 3), 10);
            var candidateAxes = p5.CollisionShape._getCandidateAxesForShapes(a, b);
            expect(candidateAxes.length).to.equal(1);
            expect(candidateAxes[0].x).to.equal(1);
            expect(candidateAxes[0].y).to.equal(0);
          });
        });
      });
    });
  });
});
