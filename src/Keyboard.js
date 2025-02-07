function Keyboard(eventManager) {
  this._eventManager = eventManager;
  this._events = [];
  this._keys = {};

  // Поля для джойстика:
  this._dpadActive = false;      // Активен ли D-Pad
  this._dpadCenter = { x: 0, y: 0 };  // Центр нажатия
  this._dpadLastDir = null;      // Последнее направление
  this._DPAD_DEADZONE = 10;      // Мёртвая зона
  this._listen();
}

// Коды клавиш
Keyboard.Key = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  SELECT: 17,
  START: 13,
  CTRL: 17
};

// Имена событий
Keyboard.Event = {
  KEY_PRESSED: 'Keyboard.Event.KEY_PRESSED',
  KEY_RELEASED: 'Keyboard.Event.KEY_RELEASED'
};

Keyboard.prototype._listen = function() {
  var self = this;
  // Ловим клавиатуру
  $(document).keydown(function(e) {
    if (!self._keys[e.which]) {
      self._keys[e.which] = true;
      self._events.push({ name: Keyboard.Event.KEY_PRESSED, key: e.which });
    }
    e.preventDefault();
  });
  $(document).keyup(function(e) {
    if (self._keys[e.which]) {
      self._keys[e.which] = false;
      self._events.push({ name: Keyboard.Event.KEY_RELEASED, key: e.which });
    }
    e.preventDefault();
  });
};

/**
 * Обработка нажатия/отжатия кнопок A/B/Start/Select (не D-Pad).
 */
Keyboard.prototype.onButtonDown = function(action) {
  var keyCode = this._actionToKeyCode(action);
  if (keyCode && !this._keys[keyCode]) {
    this._keys[keyCode] = true;
    this._events.push({
      name: Keyboard.Event.KEY_PRESSED,
      key: keyCode
    });
  }
};
Keyboard.prototype.onButtonUp = function(action) {
  var keyCode = this._actionToKeyCode(action);
  if (keyCode && this._keys[keyCode]) {
    this._keys[keyCode] = false;
    this._events.push({
      name: Keyboard.Event.KEY_RELEASED,
      key: keyCode
    });
  }
};

/**
 * D-Pad: pointerdown/touchstart => запоминаем "центр" и включаем режим.
 */
Keyboard.prototype.onDpadPointerDown = function(e, $el) {
  this._dpadActive = true;
  this._dpadLastDir = null;

  // Считаем точку нажатия "центром"
  var pos = this._getPointerPos(e);
  this._dpadCenter.x = pos.x;
  this._dpadCenter.y = pos.y;
};

/**
 * D-Pad: pointermove/touchmove => вычисляем смещение и направление.
 */
Keyboard.prototype.onDpadPointerMove = function(e, $el) {
  if (!this._dpadActive) return;

  var pos = this._getPointerPos(e);
  var dx = pos.x - this._dpadCenter.x;
  var dy = pos.y - this._dpadCenter.y;

  var dist = Math.sqrt(dx * dx + dy * dy);
  // Если в мёртвой зоне – отпускаем направление
  if (dist < this._DPAD_DEADZONE) {
    this._updateDpadDir(null);
    return;
  }

  // Определяем основную ось:
  if (Math.abs(dx) > Math.abs(dy)) {
    // Горизонталь
    this._updateDpadDir(dx > 0 ? 'right' : 'left');
  } else {
    // Вертикаль
    this._updateDpadDir(dy > 0 ? 'down' : 'up');
  }
};

/**
 * D-Pad: pointerup/touchend => отпускаем направление
 */
Keyboard.prototype.onDpadPointerUp = function(e, $el) {
  this._dpadActive = false;
  this._updateDpadDir(null);
};

/**
 * Превращаем направления up/down/left/right -> keyCode.
 * Если null, значит отпустить.
 */
Keyboard.prototype._updateDpadDir = function(newDir) {
  // Если не поменялось – выходим
  if (newDir === this._dpadLastDir) return;

  // 1) Отпускаем старый
  if (this._dpadLastDir) {
    var oldKey = this._dirToKeyCode(this._dpadLastDir);
    if (oldKey && this._keys[oldKey]) {
      this._keys[oldKey] = false;
      this._events.push({
        name: Keyboard.Event.KEY_RELEASED,
        key: oldKey
      });
    }
  }

  // 2) Нажимаем новый
  if (newDir) {
    var newKey = this._dirToKeyCode(newDir);
    if (newKey && !this._keys[newKey]) {
      this._keys[newKey] = true;
      this._events.push({
        name: Keyboard.Event.KEY_PRESSED,
        key: newKey
      });
    }
  }

  this._dpadLastDir = newDir;
};

Keyboard.prototype._dirToKeyCode = function(dir) {
  switch (dir) {
    case 'up': return Keyboard.Key.UP;
    case 'down': return Keyboard.Key.DOWN;
    case 'left': return Keyboard.Key.LEFT;
    case 'right': return Keyboard.Key.RIGHT;
    default: return null;
  }
};

/**
 * Преобразуем 'space','enter','ctrl' и т.п. -> keyCode
 */
Keyboard.prototype._actionToKeyCode = function(action) {
  switch (action) {
    case 'space': return Keyboard.Key.SPACE;
    case 'enter': return Keyboard.Key.START;
    case 'ctrl':  return Keyboard.Key.CTRL;
    default:      return null;
  }
};

/**
 * Получаем координаты pointer/touch в едином формате.
 */
Keyboard.prototype._getPointerPos = function(e) {
  // Если touch
  if (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length) {
    return {
      x: e.originalEvent.touches[0].clientX,
      y: e.originalEvent.touches[0].clientY
    };
  }
  // Pointer / Mouse
  return {
    x: e.clientX,
    y: e.clientY
  };
};

Keyboard.prototype.fireEvents = function() {
  // Отправляем все накопленные события
  for (var i = 0; i < this._events.length; i++) {
    this._eventManager.fireEvent(this._events[i]);
  }
  this._events = [];
};
