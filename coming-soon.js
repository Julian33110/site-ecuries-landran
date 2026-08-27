(function () {
  var target = new Date('2026-06-23T00:00:00').getTime();

  var daysEl    = document.getElementById('days');
  var hoursEl   = document.getElementById('hours');
  var minutesEl = document.getElementById('minutes');
  var secondsEl = document.getElementById('seconds');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function tick(el, value) {
    el.textContent = pad(value);
    el.classList.remove('tick');
    void el.offsetWidth;
    el.classList.add('tick');
  }

  function update() {
    var now  = Date.now();
    var diff = target - now;

    if (diff <= 0) {
      daysEl.textContent = hoursEl.textContent = minutesEl.textContent = secondsEl.textContent = '00';
      return;
    }

    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);

    tick(daysEl, d);
    tick(hoursEl, h);
    tick(minutesEl, m);
    tick(secondsEl, s);
  }

  update();
  setInterval(update, 1000);
})();
