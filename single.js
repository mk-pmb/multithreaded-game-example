
console.log('running in SINGLE THREADED MODE');

var scihalt = require('science-halt');

var cvs = document.querySelector('#stage')
  , ctx = cvs.getContext('2d')
  , resizemon = require('./lib/resizemon')(cvs);

var rstats = require('./lib/rstatshelper');

var repeater = require('./lib/repeater');

var worker = require('./lib/worker')();

var BoidManager = require('./lib/boidmanager');
var boidman = new BoidManager;
var interpolationRatio = null;

window.addEventListener('message', function(ev) {

  if (ev.data.type === 'step') {
    for (var i = 0; i < ev.data.snapshots.length; i++) {
      var snapshot = ev.data.snapshots[i];
      var boid = boidman.getinate(snapshot.id);
      boid.readFromSnapshot(snapshot);
    }

    rstats('phys').set(ev.data.endTime - ev.data.startTime);
    rstats().update();
    return;
  }

  // A tick implies that the worker checked to see if it was time
  // for an update.
  if (ev.data.type === 'tick') {
    interpolationRatio = ev.data.interpolationRatio;
    return;
  }

}, false);

function graphics(dt, ratio) {
  rstats('frame').start();
  rstats('FPS').frame();
  rstats('rAF').tick();
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  var boids = boidman.all();
  for (var i = 0; i < boids.length; i++) {
    boids[i].draw(ctx, interpolationRatio);
  }
  rstats('frame').end();
  rstats().update();
}

// Call `graphics` as often as possible using `requestAnimationFrame`.
var repeaterCtl = repeater(graphics, requestAnimationFrame);
repeaterCtl.start();

scihalt(function() {
  repeaterCtl.stop();
  window.postMessage({ type: 'HALT' }, '*');
})
