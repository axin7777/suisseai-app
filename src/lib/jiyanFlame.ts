export const FLAME_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  html, body { margin:0; padding:0; background: transparent; overflow:hidden; width:100%; height:100%; }
  canvas { display:block; width:100%; height:100%; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  var intensity = 0.3;
  var boost = 0;

  window.setIntensity = function(v) { intensity = v; };

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function Particle() { this.reset(); }
  Particle.prototype.reset = function () {
    this.x = canvas.width / 2 + rand(-canvas.width * 0.15, canvas.width * 0.15);
    this.y = canvas.height * 0.95;
    this.size = rand(canvas.width * 0.04, canvas.width * 0.1);
    this.speedY = rand(0.6, 1.4);
    this.speedX = rand(-0.3, 0.3);
    this.life = 1;
    this.decay = rand(0.01, 0.025);
    var hueChoice = Math.random();
    this.color = hueChoice < 0.5 ? [231, 193, 106] : hueChoice < 0.85 ? [255, 140, 60] : [255, 80, 40];
  };
  Particle.prototype.update = function (speedMul) {
    this.y -= this.speedY * speedMul;
    this.x += this.speedX * speedMul;
    this.life -= this.decay;
    this.size *= 0.985;
    if (this.life <= 0 || this.size < 1) this.reset();
  };
  Particle.prototype.draw = function () {
    var r = this.color[0], g = this.color[1], b = this.color[2];
    var alpha = Math.max(this.life, 0) * 0.8;
    var grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')');
    grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  };

  var particles = [];
  var COUNT = 60;
  for (var i = 0; i < COUNT; i++) particles.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var speedMul = 0.6 + intensity * 1.4 + boost;
    for (var j = 0; j < particles.length; j++) { particles[j].update(speedMul); particles[j].draw(); }
    if (boost > 0) boost *= 0.9;
    requestAnimationFrame(loop);
  }
  loop();

  function touchBoost() { boost = 1.5; }
  window.addEventListener('pointerdown', touchBoost);
  window.addEventListener('pointermove', touchBoost);
</script>
</body>
</html>
`;