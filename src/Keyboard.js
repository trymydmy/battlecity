function Keyboard(eventManager) {
  this._eventManager = eventManager;
  this._events = [];
  this._listen();
  this._keys = {};
}

Keyboard.Key = {
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  S: 83,
  SELECT: 17,
  START: 13
};

Keyboard.Event = {
  KEY_PRESSED: 'Keyboard.Event.KEY_PRESSED',
  KEY_RELEASED: 'Keyboard.Event.KEY_RELEASED'
};

Keyboard.prototype._listen = function () {
  var self = this;

  // 1) Клавиатура
  $(document).keydown(function (event) {
    if (!self._keys[event.which]) {
      self._keys[event.which] = true;
      self._events.push({
        name: Keyboard.Event.KEY_PRESSED,
        key: event.which
      });
    }
    event.preventDefault();
  });

  $(document).keyup(function (event) {
    if (self._keys[event.which]) {
      self._keys[event.which] = false;
      self._events.push({
        name: Keyboard.Event.KEY_RELEASED,
        key: event.which
      });
    }
    event.preventDefault();
  });

  // 2) D-Pad (одна крестовина): pointerdown/touchstart + pointerup/touchend
  $(document).on('pointerdown touchstart mousedown', '#dpad', function(e) {
    e.preventDefault();
    var direction = getDpadDirection(e, $(this));
    var keyCode = directionToKeyCode(direction);

    if (keyCode && !self._keys[keyCode]) {
      self._keys[keyCode] = true;
      self._events.push({
        name: Keyboard.Event.KEY_PRESSED,
        key: keyCode
      });
    }
  });

  $(document).on('pointerup touchend mouseup', '#dpad', function(e) {
    e.preventDefault();
    var direction = getDpadDirection(e, $(this));
    var keyCode = directionToKeyCode(direction);

    if (keyCode && self._keys[keyCode]) {
      self._keys[keyCode] = false;
      self._events.push({
        name: Keyboard.Event.KEY_RELEASED,
        key: keyCode
      });
    }
  });
};

// Вычисляем направление, исходя из точки тапа относительно центра
function getDpadDirection(e, $dpad) {
  var offset = $dpad.offset();
  var width = $dpad.width();
  var height = $dpad.height();

  var centerX = offset.left + width / 2;
  var centerY = offset.top + height / 2;

  var pageX = 0, pageY = 0;
  if (e.originalEvent.touches && e.originalEvent.touches.length > 0) {
    pageX = e.originalEvent.touches[0].pageX;
    pageY = e.originalEvent.touches[0].pageY;
  } else {
    pageX = e.pageX;
    pageY = e.pageY;
  }

  var dx = pageX - centerX;
  var dy = pageY - centerY;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'down' : 'up';
  }
}

// Превращаем 'up','down','left','right' в keyCode
function directionToKeyCode(dir) {
  switch (dir) {
    case 'up':    return Keyboard.Key.UP;
    case 'down':  return Keyboard.Key.DOWN;
    case 'left':  return Keyboard.Key.LEFT;
    case 'right': return Keyboard.Key.RIGHT;
    default:      return null;
  }
}

Keyboard.prototype.fireEvents = function () {
  this._events.forEach(function (event) {
    this._eventManager.fireEvent(event);
  }, this);
  this._events = [];
};
