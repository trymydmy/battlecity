function Keyboard(eventManager) {
  this._eventManager = eventManager;
  this._events = [];
  this._keys = {};

  // Для виртуального джойстика
  this._joystickActive = false;
  this._joystickStartX = 0;
  this._joystickStartY = 0;
  this._joystickLastDirection = null;

  this._listen();
}

// Наши коды клавиш
Keyboard.Key = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  SELECT: 17,
  START: 13
};

// События
Keyboard.Event = {
  KEY_PRESSED: 'Keyboard.Event.KEY_PRESSED',
  KEY_RELEASED: 'Keyboard.Event.KEY_RELEASED'
};

// Радиус "мёртвой зоны" (насколько далеко должен отойти палец, чтобы двинуться)
Keyboard.JOYSTICK_DEADZONE = 10;

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

  // 2) Виртуальный джойстик на #joystickArea
  // (Предполагаем, что у тебя в HTML есть <div id="joystickArea"></div>)
  $(document).on('touchstart pointerdown mousedown', '#joystickArea', function(e) {
    e.preventDefault();
    self._onJoystickStart(e);
  });
  $(document).on('touchmove pointermove mousemove', '#joystickArea', function(e) {
    e.preventDefault();
    self._onJoystickMove(e);
  });
  $(document).on('touchend pointerup mouseup', '#joystickArea', function(e) {
    e.preventDefault();
    self._onJoystickEnd(e);
  });
};

Keyboard.prototype._onJoystickStart = function(e) {
  // Запоминаем, что джойстик «активен»
  this._joystickActive = true;

  // Координаты тапа – это «центр», от которого будем считать смещение
  var pos = this._getEventPosition(e);
  this._joystickStartX = pos.x;
  this._joystickStartY = pos.y;

  // Пока направления нет
  this._joystickLastDirection = null;
};

Keyboard.prototype._onJoystickMove = function(e) {
  // Если палец/курсор вообще не нажат – игнорируем
  if (!this._joystickActive) {
    return;
  }

  // Получаем текущие координаты
  var pos = this._getEventPosition(e);
  var dx = pos.x - this._joystickStartX;
  var dy = pos.y - this._joystickStartY;

  // Проверяем, не внутри ли мёртвой зоны (никакого движения)
  var distance = Math.sqrt(dx*dx + dy*dy);
  if (distance < Keyboard.JOYSTICK_DEADZONE) {
    // Пользователь внутри deadzone => никакого направления
    this._updateJoystickDirection(null);
    return;
  }

  // Определяем основную ось (горизонт / вертикаль)
  if (Math.abs(dx) > Math.abs(dy)) {
    // Горизонталь
    if (dx > 0) {
      this._updateJoystickDirection('right');
    } else {
      this._updateJoystickDirection('left');
    }
  } else {
    // Вертикаль
    if (dy > 0) {
      this._updateJoystickDirection('down');
    } else {
      this._updateJoystickDirection('up');
    }
  }
};

Keyboard.prototype._onJoystickEnd = function(e) {
  // Палец/мышь отжали
  this._joystickActive = false;
  // Отпускаем текущее направление, если было
  this._updateJoystickDirection(null);
};

// Сопоставим строку 'up','down','left','right' => реальный keyCode
Keyboard.prototype._directionToKeyCode = function(dir) {
  switch (dir) {
    case 'left':  return Keyboard.Key.LEFT;
    case 'right': return Keyboard.Key.RIGHT;
    case 'up':    return Keyboard.Key.UP;
    case 'down':  return Keyboard.Key.DOWN;
    default:      return null;
  }
};

/**
 * Обновляет направление (если новое направление != старое),
 * пушит соответствующие KEY_PRESSED/KEY_RELEASED.
 */
Keyboard.prototype._updateJoystickDirection = function(newDir) {
  // Если направление не поменялось – ничего не делаем
  if (newDir === this._joystickLastDirection) {
    return;
  }

  // 1) Если было предыдущее направление, надо отправить KEY_RELEASED
  if (this._joystickLastDirection) {
    var oldKey = this._directionToKeyCode(this._joystickLastDirection);
    if (oldKey && this._keys[oldKey]) {
      this._keys[oldKey] = false;
      this._events.push({
        name: Keyboard.Event.KEY_RELEASED,
        key: oldKey
      });
    }
  }

  // 2) Если есть новое направление, отправим KEY_PRESSED
  if (newDir) {
    var newKey = this._directionToKeyCode(newDir);
    if (newKey && !this._keys[newKey]) {
      this._keys[newKey] = true;
      this._events.push({
        name: Keyboard.Event.KEY_PRESSED,
        key: newKey
      });
    }
  }

  // 3) Запоминаем текущее направление
  this._joystickLastDirection = newDir;
};

/**
 * Получаем координаты тапа/клика.
 */
Keyboard.prototype._getEventPosition = function(e) {
  // Если тач
  if (e.originalEvent.touches && e.originalEvent.touches.length) {
    return {
      x: e.originalEvent.touches[0].pageX,
      y: e.originalEvent.touches[0].pageY
    };
  } else if (e.originalEvent.pointerId) {
    // Pointer Events
    return {
      x: e.originalEvent.pageX,
      y: e.originalEvent.pageY
    };
  } else {
    // Мышь
    return {
      x: e.pageX,
      y: e.pageY
    };
  }
};

Keyboard.prototype.fireEvents = function () {
  // Отправляем накопленные события
  this._events.forEach(function (evt) {
    this._eventManager.fireEvent(evt);
  }, this);

  // Очищаем
  this._events = [];
};
