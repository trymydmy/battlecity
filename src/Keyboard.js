function Keyboard(eventManager) {
  this._eventManager = eventManager;
  this._events = [];
  this._listen();
  this._keys = {};
}

Keyboard.Key = {};
Keyboard.Key.SPACE = 32;
Keyboard.Key.LEFT = 37;
Keyboard.Key.UP = 38;
Keyboard.Key.RIGHT = 39;
Keyboard.Key.DOWN = 40;
Keyboard.Key.S = 83;
Keyboard.Key.SELECT = 17;
Keyboard.Key.START = 13;

Keyboard.Event = {};
Keyboard.Event.KEY_PRESSED = 'Keyboard.Event.KEY_PRESSED';
Keyboard.Event.KEY_RELEASED = 'Keyboard.Event.KEY_RELEASED';

Keyboard.prototype._listen = function () {
  var self = this;

  // Слушаем клавиатуру
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

  // Слушаем тач/мышь на кнопках
  $(document).on('touchstart mousedown pointerdown', '.touch-button', function(e) {
    e.preventDefault();
    var action = $(this).data('action');
    var keyCode = self._actionToKeyCode(action);

    if (keyCode !== null && !self._keys[keyCode]) {
      self._keys[keyCode] = true;
      self._events.push({
        name: Keyboard.Event.KEY_PRESSED,
        key: keyCode
      });
    }
  });

  $(document).on('touchend mouseup pointerup', '.touch-button', function(e) {
    e.preventDefault();
    var action = $(this).data('action');
    var keyCode = self._actionToKeyCode(action);

    if (keyCode !== null && self._keys[keyCode]) {
      self._keys[keyCode] = false;
      self._events.push({
        name: Keyboard.Event.KEY_RELEASED,
        key: keyCode
      });
    }
  });

  // Если хотим вообще заблокировать скролл при движении пальцем на кнопке:
  $(document).on('touchmove', '.touch-button', function(e) {
    e.preventDefault();
  });
};

Keyboard.prototype._actionToKeyCode = function (action) {
  switch (action) {
    case 'arrows':
      // Для примера будем отправлять код UP
      return Keyboard.Key.UP;
    case 'space':
      return Keyboard.Key.SPACE;
    case 'enter':
      return Keyboard.Key.START;
    case 'ctrl':
      return Keyboard.Key.SELECT;
    default:
      return null;
  }
};

Keyboard.prototype.fireEvents = function () {
  this._events.forEach(function (event) {
    this._eventManager.fireEvent(event);
  }, this);
  this._events = [];
};
