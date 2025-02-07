function Keyboard(eventManager) {
  this._eventManager = eventManager;
  this._events = [];
  this._keys = {};

  // Поля для "виртуального джойстика"
  this._joystickActive = false;       // Идёт ли сейчас управление
  this._joystickCenterX = 0;         // Координаты "центра"
  this._joystickCenterY = 0;
  this._joystickLastDirection = null; // Последнее направление (up/down/left/right)

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
  START: 13
};

// Имена событий
Keyboard.Event = {
  KEY_PRESSED: 'Keyboard.Event.KEY_PRESSED',
  KEY_RELEASED: 'Keyboard.Event.KEY_RELEASED'
};

// Мёртвая зона для джойстика, чтобы маленький сдвиг пальца не менял направление
Keyboard.JOYSTICK_DEADZONE = 10;

Keyboard.prototype._listen = function() {
  var self = this;

  // 1) Клавиатура
  $(document).keydown(function(event) {
    if (!self._keys[event.which]) {
      self._keys[event.which] = true;
      self._events.push({
        name: Keyboard.Event.KEY_PRESSED,
        key: event.which
      });
    }
    event.preventDefault();
  });

  $(document).keyup(function(event) {
    if (self._keys[event.which]) {
      self._keys[event.which] = false;
      self._events.push({
        name: Keyboard.Event.KEY_RELEASED,
        key: event.which
      });
    }
    event.preventDefault();
  });

  // 2) Старые .touch-button (остаются как есть, если нужны)
  //    Тут, например, ты уже повесил:
  //    $(document).on('touchstart ... pointerdown', '.touch-button', function(e) { ... });
  //    и т.п.

  // 3) Виртуальный джойстик на #joystickArea
  //    Используем pointer-события для удобства.
  $(document).on('pointerdown', '#joystickArea', function(e) {
    e.preventDefault();
    self._onJoystickStart(e);
  });
  $(document).on('pointermove', '#joystickArea', function(e) {
    e.preventDefault();
    self._onJoystickMove(e);
  });
  $(document).on('pointerup pointercancel pointerout', '#joystickArea', function(e) {
    e.preventDefault();
    self._onJoystickEnd(e);
  });
};

// При нажатии (палец/мышь упала на блок)
Keyboard.prototype._onJoystickStart = function(e) {
  this._joystickActive = true;
  this._joystickLastDirection = null;

  // Считаем координаты клика как "центр".
  // Берём clientX/clientY, чтоб избежать путаницы со скроллами
  this._joystickCenterX = e.clientX;
  this._joystickCenterY = e.clientY;
};

// При движении (палец/мышь двигается внутри блока)
Keyboard.prototype._onJoystickMove = function(e) {
  if (!this._joystickActive) return;

  var dx = e.clientX - this._joystickCenterX;
  var dy = e.clientY - this._joystickCenterY;
  var dist = Math.sqrt(dx*dx + dy*dy);

  // Проверяем мёртвую зону
  if (dist < Keyboard.JOYSTICK_DEADZONE) {
    this._updateJoystickDirection(null);
    return;
  }

  // Определяем направление (горизонталь / вертикаль)
  if (Math.abs(dx) > Math.abs(dy)) {
    // Горизонталь
    this._updateJoystickDirection(dx > 0 ? 'right' : 'left');
  } else {
    // Вертикаль
    this._updateJoystickDirection(dy > 0 ? 'down' : 'up');
  }
};

// Когда палец/мышь вышла или отпустила
Keyboard.prototype._onJoystickEnd = function(e) {
  this._joystickActive = false;
  this._updateJoystickDirection(null);
};

// Генерируем KEY_PRESSED / KEY_RELEASED при смене направления
Keyboard.prototype._updateJoystickDirection = function(newDir) {
  if (newDir === this._joystickLastDirection) {
    return; // не изменилось
  }

  // 1) Отпускаем старое направление
  if (this._joystickLastDirection) {
    var oldKey = this._dirToKeyCode(this._joystickLastDirection);
    if (oldKey && this._keys[oldKey]) {
      this._keys[oldKey] = false;
      this._events.push({
        name: Keyboard.Event.KEY_RELEASED,
        key: oldKey
      });
    }
  }

  // 2) Нажимаем новое
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

  this._joystickLastDirection = newDir;
};

// Превращаем строку направления в keyCode
Keyboard.prototype._dirToKeyCode = function(dir) {
  switch (dir) {
    case 'up':    return Keyboard.Key.UP;
    case 'down':  return Keyboard.Key.DOWN;
    case 'left':  return Keyboard.Key.LEFT;
    case 'right': return Keyboard.Key.RIGHT;
    default:      return null;
  }
};

Keyboard.prototype.fireEvents = function() {
  this._events.forEach(function(evt) {
    this._eventManager.fireEvent(evt);
  }, this);
  this._events = [];
};
