// SAKSHI site script. The site works without it; this only adds a
// "copy address" convenience for the contact email.
(function () {
  'use strict';
  var buttons = document.querySelectorAll('button.copy[data-copy]');
  Array.prototype.forEach.call(buttons, function (btn) {
    var original = btn.textContent;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      function done(ok) {
        btn.textContent = ok ? 'Copied' : 'Select and copy: ' + text;
        setTimeout(function () { btn.textContent = original; }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  });
})();
