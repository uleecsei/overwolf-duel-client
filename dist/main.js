var Main;
/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/events/events.js":
/*!***************************************!*\
  !*** ./node_modules/events/events.js ***!
  \***************************************/
/***/ (function(module) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),

/***/ "./node_modules/reflect-metadata/Reflect.js":
/*!**************************************************!*\
  !*** ./node_modules/reflect-metadata/Reflect.js ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

/*! *****************************************************************************
Copyright (C) Microsoft. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
var Reflect;
(function (Reflect) {
    // Metadata Proposal
    // https://rbuckton.github.io/reflect-metadata/
    (function (factory) {
        var root = typeof __webpack_require__.g === "object" ? __webpack_require__.g :
            typeof self === "object" ? self :
                typeof this === "object" ? this :
                    Function("return this;")();
        var exporter = makeExporter(Reflect);
        if (typeof root.Reflect === "undefined") {
            root.Reflect = Reflect;
        }
        else {
            exporter = makeExporter(root.Reflect, exporter);
        }
        factory(exporter);
        function makeExporter(target, previous) {
            return function (key, value) {
                if (typeof target[key] !== "function") {
                    Object.defineProperty(target, key, { configurable: true, writable: true, value: value });
                }
                if (previous)
                    previous(key, value);
            };
        }
    })(function (exporter) {
        var hasOwn = Object.prototype.hasOwnProperty;
        // feature test for Symbol support
        var supportsSymbol = typeof Symbol === "function";
        var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
        var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
        var supportsCreate = typeof Object.create === "function"; // feature test for Object.create support
        var supportsProto = { __proto__: [] } instanceof Array; // feature test for __proto__ support
        var downLevel = !supportsCreate && !supportsProto;
        var HashMap = {
            // create an object in dictionary mode (a.k.a. "slow" mode in v8)
            create: supportsCreate
                ? function () { return MakeDictionary(Object.create(null)); }
                : supportsProto
                    ? function () { return MakeDictionary({ __proto__: null }); }
                    : function () { return MakeDictionary({}); },
            has: downLevel
                ? function (map, key) { return hasOwn.call(map, key); }
                : function (map, key) { return key in map; },
            get: downLevel
                ? function (map, key) { return hasOwn.call(map, key) ? map[key] : undefined; }
                : function (map, key) { return map[key]; },
        };
        // Load global or shim versions of Map, Set, and WeakMap
        var functionPrototype = Object.getPrototypeOf(Function);
        var usePolyfill = typeof process === "object" && process.env && process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] === "true";
        var _Map = !usePolyfill && typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
        var _Set = !usePolyfill && typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
        var _WeakMap = !usePolyfill && typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
        // [[Metadata]] internal slot
        // https://rbuckton.github.io/reflect-metadata/#ordinary-object-internal-methods-and-internal-slots
        var Metadata = new _WeakMap();
        /**
         * Applies a set of decorators to a property of a target object.
         * @param decorators An array of decorators.
         * @param target The target object.
         * @param propertyKey (Optional) The property key to decorate.
         * @param attributes (Optional) The property descriptor for the target key.
         * @remarks Decorators are applied in reverse order.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     Example = Reflect.decorate(decoratorsArray, Example);
         *
         *     // property (on constructor)
         *     Reflect.decorate(decoratorsArray, Example, "staticProperty");
         *
         *     // property (on prototype)
         *     Reflect.decorate(decoratorsArray, Example.prototype, "property");
         *
         *     // method (on constructor)
         *     Object.defineProperty(Example, "staticMethod",
         *         Reflect.decorate(decoratorsArray, Example, "staticMethod",
         *             Object.getOwnPropertyDescriptor(Example, "staticMethod")));
         *
         *     // method (on prototype)
         *     Object.defineProperty(Example.prototype, "method",
         *         Reflect.decorate(decoratorsArray, Example.prototype, "method",
         *             Object.getOwnPropertyDescriptor(Example.prototype, "method")));
         *
         */
        function decorate(decorators, target, propertyKey, attributes) {
            if (!IsUndefined(propertyKey)) {
                if (!IsArray(decorators))
                    throw new TypeError();
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes))
                    throw new TypeError();
                if (IsNull(attributes))
                    attributes = undefined;
                propertyKey = ToPropertyKey(propertyKey);
                return DecorateProperty(decorators, target, propertyKey, attributes);
            }
            else {
                if (!IsArray(decorators))
                    throw new TypeError();
                if (!IsConstructor(target))
                    throw new TypeError();
                return DecorateConstructor(decorators, target);
            }
        }
        exporter("decorate", decorate);
        // 4.1.2 Reflect.metadata(metadataKey, metadataValue)
        // https://rbuckton.github.io/reflect-metadata/#reflect.metadata
        /**
         * A default metadata decorator factory that can be used on a class, class member, or parameter.
         * @param metadataKey The key for the metadata entry.
         * @param metadataValue The value for the metadata entry.
         * @returns A decorator function.
         * @remarks
         * If `metadataKey` is already defined for the target and target key, the
         * metadataValue for that key will be overwritten.
         * @example
         *
         *     // constructor
         *     @Reflect.metadata(key, value)
         *     class Example {
         *     }
         *
         *     // property (on constructor, TypeScript only)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         static staticProperty;
         *     }
         *
         *     // property (on prototype, TypeScript only)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         property;
         *     }
         *
         *     // method (on constructor)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         static staticMethod() { }
         *     }
         *
         *     // method (on prototype)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         method() { }
         *     }
         *
         */
        function metadata(metadataKey, metadataValue) {
            function decorator(target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
                    throw new TypeError();
                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
            }
            return decorator;
        }
        exporter("metadata", metadata);
        /**
         * Define a unique metadata entry on the target.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param metadataValue A value that contains attached metadata.
         * @param target The target object on which to define metadata.
         * @param propertyKey (Optional) The property key for the target.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     Reflect.defineMetadata("custom:annotation", options, Example);
         *
         *     // property (on constructor)
         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticProperty");
         *
         *     // property (on prototype)
         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "property");
         *
         *     // method (on constructor)
         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticMethod");
         *
         *     // method (on prototype)
         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "method");
         *
         *     // decorator factory as metadata-producing annotation.
         *     function MyAnnotation(options): Decorator {
         *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
         *     }
         *
         */
        function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
        }
        exporter("defineMetadata", defineMetadata);
        /**
         * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.hasMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function hasMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryHasMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasMetadata", hasMetadata);
        /**
         * Gets a value indicating whether the target object has the provided metadata key defined.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function hasOwnMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasOwnMetadata", hasOwnMetadata);
        /**
         * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function getMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryGetMetadata(metadataKey, target, propertyKey);
        }
        exporter("getMetadata", getMetadata);
        /**
         * Gets the metadata value for the provided metadata key on the target object.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getOwnMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function getOwnMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("getOwnMetadata", getOwnMetadata);
        /**
         * Gets the metadata keys defined on the target object or its prototype chain.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns An array of unique metadata keys.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getMetadataKeys(Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getMetadataKeys(Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getMetadataKeys(Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getMetadataKeys(Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getMetadataKeys(Example.prototype, "method");
         *
         */
        function getMetadataKeys(target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryMetadataKeys(target, propertyKey);
        }
        exporter("getMetadataKeys", getMetadataKeys);
        /**
         * Gets the unique metadata keys defined on the target object.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns An array of unique metadata keys.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getOwnMetadataKeys(Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getOwnMetadataKeys(Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getOwnMetadataKeys(Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "method");
         *
         */
        function getOwnMetadataKeys(target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryOwnMetadataKeys(target, propertyKey);
        }
        exporter("getOwnMetadataKeys", getOwnMetadataKeys);
        /**
         * Deletes the metadata entry from the target object with the provided key.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata entry was found and deleted; otherwise, false.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.deleteMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function deleteMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            var metadataMap = GetOrCreateMetadataMap(target, propertyKey, /*Create*/ false);
            if (IsUndefined(metadataMap))
                return false;
            if (!metadataMap.delete(metadataKey))
                return false;
            if (metadataMap.size > 0)
                return true;
            var targetMetadata = Metadata.get(target);
            targetMetadata.delete(propertyKey);
            if (targetMetadata.size > 0)
                return true;
            Metadata.delete(target);
            return true;
        }
        exporter("deleteMetadata", deleteMetadata);
        function DecorateConstructor(decorators, target) {
            for (var i = decorators.length - 1; i >= 0; --i) {
                var decorator = decorators[i];
                var decorated = decorator(target);
                if (!IsUndefined(decorated) && !IsNull(decorated)) {
                    if (!IsConstructor(decorated))
                        throw new TypeError();
                    target = decorated;
                }
            }
            return target;
        }
        function DecorateProperty(decorators, target, propertyKey, descriptor) {
            for (var i = decorators.length - 1; i >= 0; --i) {
                var decorator = decorators[i];
                var decorated = decorator(target, propertyKey, descriptor);
                if (!IsUndefined(decorated) && !IsNull(decorated)) {
                    if (!IsObject(decorated))
                        throw new TypeError();
                    descriptor = decorated;
                }
            }
            return descriptor;
        }
        function GetOrCreateMetadataMap(O, P, Create) {
            var targetMetadata = Metadata.get(O);
            if (IsUndefined(targetMetadata)) {
                if (!Create)
                    return undefined;
                targetMetadata = new _Map();
                Metadata.set(O, targetMetadata);
            }
            var metadataMap = targetMetadata.get(P);
            if (IsUndefined(metadataMap)) {
                if (!Create)
                    return undefined;
                metadataMap = new _Map();
                targetMetadata.set(P, metadataMap);
            }
            return metadataMap;
        }
        // 3.1.1.1 OrdinaryHasMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasmetadata
        function OrdinaryHasMetadata(MetadataKey, O, P) {
            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
            if (hasOwn)
                return true;
            var parent = OrdinaryGetPrototypeOf(O);
            if (!IsNull(parent))
                return OrdinaryHasMetadata(MetadataKey, parent, P);
            return false;
        }
        // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
        function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
            if (IsUndefined(metadataMap))
                return false;
            return ToBoolean(metadataMap.has(MetadataKey));
        }
        // 3.1.3.1 OrdinaryGetMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarygetmetadata
        function OrdinaryGetMetadata(MetadataKey, O, P) {
            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
            if (hasOwn)
                return OrdinaryGetOwnMetadata(MetadataKey, O, P);
            var parent = OrdinaryGetPrototypeOf(O);
            if (!IsNull(parent))
                return OrdinaryGetMetadata(MetadataKey, parent, P);
            return undefined;
        }
        // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
        function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
            if (IsUndefined(metadataMap))
                return undefined;
            return metadataMap.get(MetadataKey);
        }
        // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
        function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ true);
            metadataMap.set(MetadataKey, MetadataValue);
        }
        // 3.1.6.1 OrdinaryMetadataKeys(O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarymetadatakeys
        function OrdinaryMetadataKeys(O, P) {
            var ownKeys = OrdinaryOwnMetadataKeys(O, P);
            var parent = OrdinaryGetPrototypeOf(O);
            if (parent === null)
                return ownKeys;
            var parentKeys = OrdinaryMetadataKeys(parent, P);
            if (parentKeys.length <= 0)
                return ownKeys;
            if (ownKeys.length <= 0)
                return parentKeys;
            var set = new _Set();
            var keys = [];
            for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
                var key = ownKeys_1[_i];
                var hasKey = set.has(key);
                if (!hasKey) {
                    set.add(key);
                    keys.push(key);
                }
            }
            for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
                var key = parentKeys_1[_a];
                var hasKey = set.has(key);
                if (!hasKey) {
                    set.add(key);
                    keys.push(key);
                }
            }
            return keys;
        }
        // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
        function OrdinaryOwnMetadataKeys(O, P) {
            var keys = [];
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
            if (IsUndefined(metadataMap))
                return keys;
            var keysObj = metadataMap.keys();
            var iterator = GetIterator(keysObj);
            var k = 0;
            while (true) {
                var next = IteratorStep(iterator);
                if (!next) {
                    keys.length = k;
                    return keys;
                }
                var nextValue = IteratorValue(next);
                try {
                    keys[k] = nextValue;
                }
                catch (e) {
                    try {
                        IteratorClose(iterator);
                    }
                    finally {
                        throw e;
                    }
                }
                k++;
            }
        }
        // 6 ECMAScript Data Typ0es and Values
        // https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values
        function Type(x) {
            if (x === null)
                return 1 /* Null */;
            switch (typeof x) {
                case "undefined": return 0 /* Undefined */;
                case "boolean": return 2 /* Boolean */;
                case "string": return 3 /* String */;
                case "symbol": return 4 /* Symbol */;
                case "number": return 5 /* Number */;
                case "object": return x === null ? 1 /* Null */ : 6 /* Object */;
                default: return 6 /* Object */;
            }
        }
        // 6.1.1 The Undefined Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-undefined-type
        function IsUndefined(x) {
            return x === undefined;
        }
        // 6.1.2 The Null Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-null-type
        function IsNull(x) {
            return x === null;
        }
        // 6.1.5 The Symbol Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-symbol-type
        function IsSymbol(x) {
            return typeof x === "symbol";
        }
        // 6.1.7 The Object Type
        // https://tc39.github.io/ecma262/#sec-object-type
        function IsObject(x) {
            return typeof x === "object" ? x !== null : typeof x === "function";
        }
        // 7.1 Type Conversion
        // https://tc39.github.io/ecma262/#sec-type-conversion
        // 7.1.1 ToPrimitive(input [, PreferredType])
        // https://tc39.github.io/ecma262/#sec-toprimitive
        function ToPrimitive(input, PreferredType) {
            switch (Type(input)) {
                case 0 /* Undefined */: return input;
                case 1 /* Null */: return input;
                case 2 /* Boolean */: return input;
                case 3 /* String */: return input;
                case 4 /* Symbol */: return input;
                case 5 /* Number */: return input;
            }
            var hint = PreferredType === 3 /* String */ ? "string" : PreferredType === 5 /* Number */ ? "number" : "default";
            var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
            if (exoticToPrim !== undefined) {
                var result = exoticToPrim.call(input, hint);
                if (IsObject(result))
                    throw new TypeError();
                return result;
            }
            return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
        }
        // 7.1.1.1 OrdinaryToPrimitive(O, hint)
        // https://tc39.github.io/ecma262/#sec-ordinarytoprimitive
        function OrdinaryToPrimitive(O, hint) {
            if (hint === "string") {
                var toString_1 = O.toString;
                if (IsCallable(toString_1)) {
                    var result = toString_1.call(O);
                    if (!IsObject(result))
                        return result;
                }
                var valueOf = O.valueOf;
                if (IsCallable(valueOf)) {
                    var result = valueOf.call(O);
                    if (!IsObject(result))
                        return result;
                }
            }
            else {
                var valueOf = O.valueOf;
                if (IsCallable(valueOf)) {
                    var result = valueOf.call(O);
                    if (!IsObject(result))
                        return result;
                }
                var toString_2 = O.toString;
                if (IsCallable(toString_2)) {
                    var result = toString_2.call(O);
                    if (!IsObject(result))
                        return result;
                }
            }
            throw new TypeError();
        }
        // 7.1.2 ToBoolean(argument)
        // https://tc39.github.io/ecma262/2016/#sec-toboolean
        function ToBoolean(argument) {
            return !!argument;
        }
        // 7.1.12 ToString(argument)
        // https://tc39.github.io/ecma262/#sec-tostring
        function ToString(argument) {
            return "" + argument;
        }
        // 7.1.14 ToPropertyKey(argument)
        // https://tc39.github.io/ecma262/#sec-topropertykey
        function ToPropertyKey(argument) {
            var key = ToPrimitive(argument, 3 /* String */);
            if (IsSymbol(key))
                return key;
            return ToString(key);
        }
        // 7.2 Testing and Comparison Operations
        // https://tc39.github.io/ecma262/#sec-testing-and-comparison-operations
        // 7.2.2 IsArray(argument)
        // https://tc39.github.io/ecma262/#sec-isarray
        function IsArray(argument) {
            return Array.isArray
                ? Array.isArray(argument)
                : argument instanceof Object
                    ? argument instanceof Array
                    : Object.prototype.toString.call(argument) === "[object Array]";
        }
        // 7.2.3 IsCallable(argument)
        // https://tc39.github.io/ecma262/#sec-iscallable
        function IsCallable(argument) {
            // NOTE: This is an approximation as we cannot check for [[Call]] internal method.
            return typeof argument === "function";
        }
        // 7.2.4 IsConstructor(argument)
        // https://tc39.github.io/ecma262/#sec-isconstructor
        function IsConstructor(argument) {
            // NOTE: This is an approximation as we cannot check for [[Construct]] internal method.
            return typeof argument === "function";
        }
        // 7.2.7 IsPropertyKey(argument)
        // https://tc39.github.io/ecma262/#sec-ispropertykey
        function IsPropertyKey(argument) {
            switch (Type(argument)) {
                case 3 /* String */: return true;
                case 4 /* Symbol */: return true;
                default: return false;
            }
        }
        // 7.3 Operations on Objects
        // https://tc39.github.io/ecma262/#sec-operations-on-objects
        // 7.3.9 GetMethod(V, P)
        // https://tc39.github.io/ecma262/#sec-getmethod
        function GetMethod(V, P) {
            var func = V[P];
            if (func === undefined || func === null)
                return undefined;
            if (!IsCallable(func))
                throw new TypeError();
            return func;
        }
        // 7.4 Operations on Iterator Objects
        // https://tc39.github.io/ecma262/#sec-operations-on-iterator-objects
        function GetIterator(obj) {
            var method = GetMethod(obj, iteratorSymbol);
            if (!IsCallable(method))
                throw new TypeError(); // from Call
            var iterator = method.call(obj);
            if (!IsObject(iterator))
                throw new TypeError();
            return iterator;
        }
        // 7.4.4 IteratorValue(iterResult)
        // https://tc39.github.io/ecma262/2016/#sec-iteratorvalue
        function IteratorValue(iterResult) {
            return iterResult.value;
        }
        // 7.4.5 IteratorStep(iterator)
        // https://tc39.github.io/ecma262/#sec-iteratorstep
        function IteratorStep(iterator) {
            var result = iterator.next();
            return result.done ? false : result;
        }
        // 7.4.6 IteratorClose(iterator, completion)
        // https://tc39.github.io/ecma262/#sec-iteratorclose
        function IteratorClose(iterator) {
            var f = iterator["return"];
            if (f)
                f.call(iterator);
        }
        // 9.1 Ordinary Object Internal Methods and Internal Slots
        // https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
        // 9.1.1.1 OrdinaryGetPrototypeOf(O)
        // https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
        function OrdinaryGetPrototypeOf(O) {
            var proto = Object.getPrototypeOf(O);
            if (typeof O !== "function" || O === functionPrototype)
                return proto;
            // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
            // Try to determine the superclass constructor. Compatible implementations
            // must either set __proto__ on a subclass constructor to the superclass constructor,
            // or ensure each class has a valid `constructor` property on its prototype that
            // points back to the constructor.
            // If this is not the same as Function.[[Prototype]], then this is definately inherited.
            // This is the case when in ES6 or when using __proto__ in a compatible browser.
            if (proto !== functionPrototype)
                return proto;
            // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
            var prototype = O.prototype;
            var prototypeProto = prototype && Object.getPrototypeOf(prototype);
            if (prototypeProto == null || prototypeProto === Object.prototype)
                return proto;
            // If the constructor was not a function, then we cannot determine the heritage.
            var constructor = prototypeProto.constructor;
            if (typeof constructor !== "function")
                return proto;
            // If we have some kind of self-reference, then we cannot determine the heritage.
            if (constructor === O)
                return proto;
            // we have a pretty good guess at the heritage.
            return constructor;
        }
        // naive Map shim
        function CreateMapPolyfill() {
            var cacheSentinel = {};
            var arraySentinel = [];
            var MapIterator = /** @class */ (function () {
                function MapIterator(keys, values, selector) {
                    this._index = 0;
                    this._keys = keys;
                    this._values = values;
                    this._selector = selector;
                }
                MapIterator.prototype["@@iterator"] = function () { return this; };
                MapIterator.prototype[iteratorSymbol] = function () { return this; };
                MapIterator.prototype.next = function () {
                    var index = this._index;
                    if (index >= 0 && index < this._keys.length) {
                        var result = this._selector(this._keys[index], this._values[index]);
                        if (index + 1 >= this._keys.length) {
                            this._index = -1;
                            this._keys = arraySentinel;
                            this._values = arraySentinel;
                        }
                        else {
                            this._index++;
                        }
                        return { value: result, done: false };
                    }
                    return { value: undefined, done: true };
                };
                MapIterator.prototype.throw = function (error) {
                    if (this._index >= 0) {
                        this._index = -1;
                        this._keys = arraySentinel;
                        this._values = arraySentinel;
                    }
                    throw error;
                };
                MapIterator.prototype.return = function (value) {
                    if (this._index >= 0) {
                        this._index = -1;
                        this._keys = arraySentinel;
                        this._values = arraySentinel;
                    }
                    return { value: value, done: true };
                };
                return MapIterator;
            }());
            return /** @class */ (function () {
                function Map() {
                    this._keys = [];
                    this._values = [];
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                }
                Object.defineProperty(Map.prototype, "size", {
                    get: function () { return this._keys.length; },
                    enumerable: true,
                    configurable: true
                });
                Map.prototype.has = function (key) { return this._find(key, /*insert*/ false) >= 0; };
                Map.prototype.get = function (key) {
                    var index = this._find(key, /*insert*/ false);
                    return index >= 0 ? this._values[index] : undefined;
                };
                Map.prototype.set = function (key, value) {
                    var index = this._find(key, /*insert*/ true);
                    this._values[index] = value;
                    return this;
                };
                Map.prototype.delete = function (key) {
                    var index = this._find(key, /*insert*/ false);
                    if (index >= 0) {
                        var size = this._keys.length;
                        for (var i = index + 1; i < size; i++) {
                            this._keys[i - 1] = this._keys[i];
                            this._values[i - 1] = this._values[i];
                        }
                        this._keys.length--;
                        this._values.length--;
                        if (key === this._cacheKey) {
                            this._cacheKey = cacheSentinel;
                            this._cacheIndex = -2;
                        }
                        return true;
                    }
                    return false;
                };
                Map.prototype.clear = function () {
                    this._keys.length = 0;
                    this._values.length = 0;
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                };
                Map.prototype.keys = function () { return new MapIterator(this._keys, this._values, getKey); };
                Map.prototype.values = function () { return new MapIterator(this._keys, this._values, getValue); };
                Map.prototype.entries = function () { return new MapIterator(this._keys, this._values, getEntry); };
                Map.prototype["@@iterator"] = function () { return this.entries(); };
                Map.prototype[iteratorSymbol] = function () { return this.entries(); };
                Map.prototype._find = function (key, insert) {
                    if (this._cacheKey !== key) {
                        this._cacheIndex = this._keys.indexOf(this._cacheKey = key);
                    }
                    if (this._cacheIndex < 0 && insert) {
                        this._cacheIndex = this._keys.length;
                        this._keys.push(key);
                        this._values.push(undefined);
                    }
                    return this._cacheIndex;
                };
                return Map;
            }());
            function getKey(key, _) {
                return key;
            }
            function getValue(_, value) {
                return value;
            }
            function getEntry(key, value) {
                return [key, value];
            }
        }
        // naive Set shim
        function CreateSetPolyfill() {
            return /** @class */ (function () {
                function Set() {
                    this._map = new _Map();
                }
                Object.defineProperty(Set.prototype, "size", {
                    get: function () { return this._map.size; },
                    enumerable: true,
                    configurable: true
                });
                Set.prototype.has = function (value) { return this._map.has(value); };
                Set.prototype.add = function (value) { return this._map.set(value, value), this; };
                Set.prototype.delete = function (value) { return this._map.delete(value); };
                Set.prototype.clear = function () { this._map.clear(); };
                Set.prototype.keys = function () { return this._map.keys(); };
                Set.prototype.values = function () { return this._map.values(); };
                Set.prototype.entries = function () { return this._map.entries(); };
                Set.prototype["@@iterator"] = function () { return this.keys(); };
                Set.prototype[iteratorSymbol] = function () { return this.keys(); };
                return Set;
            }());
        }
        // naive WeakMap shim
        function CreateWeakMapPolyfill() {
            var UUID_SIZE = 16;
            var keys = HashMap.create();
            var rootKey = CreateUniqueKey();
            return /** @class */ (function () {
                function WeakMap() {
                    this._key = CreateUniqueKey();
                }
                WeakMap.prototype.has = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                    return table !== undefined ? HashMap.has(table, this._key) : false;
                };
                WeakMap.prototype.get = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                    return table !== undefined ? HashMap.get(table, this._key) : undefined;
                };
                WeakMap.prototype.set = function (target, value) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ true);
                    table[this._key] = value;
                    return this;
                };
                WeakMap.prototype.delete = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                    return table !== undefined ? delete table[this._key] : false;
                };
                WeakMap.prototype.clear = function () {
                    // NOTE: not a real clear, just makes the previous data unreachable
                    this._key = CreateUniqueKey();
                };
                return WeakMap;
            }());
            function CreateUniqueKey() {
                var key;
                do
                    key = "@@WeakMap@@" + CreateUUID();
                while (HashMap.has(keys, key));
                keys[key] = true;
                return key;
            }
            function GetOrCreateWeakMapTable(target, create) {
                if (!hasOwn.call(target, rootKey)) {
                    if (!create)
                        return undefined;
                    Object.defineProperty(target, rootKey, { value: HashMap.create() });
                }
                return target[rootKey];
            }
            function FillRandomBytes(buffer, size) {
                for (var i = 0; i < size; ++i)
                    buffer[i] = Math.random() * 0xff | 0;
                return buffer;
            }
            function GenRandomBytes(size) {
                if (typeof Uint8Array === "function") {
                    if (typeof crypto !== "undefined")
                        return crypto.getRandomValues(new Uint8Array(size));
                    if (typeof msCrypto !== "undefined")
                        return msCrypto.getRandomValues(new Uint8Array(size));
                    return FillRandomBytes(new Uint8Array(size), size);
                }
                return FillRandomBytes(new Array(size), size);
            }
            function CreateUUID() {
                var data = GenRandomBytes(UUID_SIZE);
                // mark as random - RFC 4122 § 4.4
                data[6] = data[6] & 0x4f | 0x40;
                data[8] = data[8] & 0xbf | 0x80;
                var result = "";
                for (var offset = 0; offset < UUID_SIZE; ++offset) {
                    var byte = data[offset];
                    if (offset === 4 || offset === 6 || offset === 8)
                        result += "-";
                    if (byte < 16)
                        result += "0";
                    result += byte.toString(16).toLowerCase();
                }
                return result;
            }
        }
        // uses a heuristic used by v8 and chakra to force an object into dictionary mode.
        function MakeDictionary(obj) {
            obj.__ = undefined;
            delete obj.__;
            return obj;
        }
    });
})(Reflect || (Reflect = {}));


/***/ }),

/***/ "./src/config/game-data.ts":
/*!*********************************!*\
  !*** ./src/config/game-data.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports) {

"use strict";

var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameFileName = exports.GameKey = void 0;
var GameKey;
(function (GameKey) {
    GameKey[GameKey["LeagueOfLegends"] = 5426] = "LeagueOfLegends";
    GameKey[GameKey["CS2"] = 22730] = "CS2";
    GameKey[GameKey["RocketLeague"] = 10798] = "RocketLeague";
    GameKey[GameKey["PUBG"] = 10906] = "PUBG";
    GameKey[GameKey["Fortnite"] = 21216] = "Fortnite";
    GameKey[GameKey["ApexLegends"] = 21566] = "ApexLegends";
    GameKey[GameKey["Valorant"] = 21640] = "Valorant";
    GameKey[GameKey["CSGO"] = 7764] = "CSGO";
})(GameKey = exports.GameKey || (exports.GameKey = {}));
exports.GameFileName = (_a = {},
    _a[GameKey.LeagueOfLegends] = 'League Of Legends',
    _a[GameKey.CS2] = 'Counter Strike 2',
    _a[GameKey.RocketLeague] = 'Rocket League',
    _a[GameKey.PUBG] = 'PUBG',
    _a[GameKey.Fortnite] = 'Fortnite',
    _a[GameKey.ApexLegends] = 'Apex Legends',
    _a[GameKey.Valorant] = 'Valorant',
    _a[GameKey.CSGO] = 'Counter Strike GO',
    _a);
var data = (_b = {},
    _b[GameKey.LeagueOfLegends] = {
        interestedInFeatures: [
            'summoner_info',
            'gameMode',
            'teams',
            'matchState',
            'kill',
            'death',
            'respawn',
            'assist',
            'minions',
            'level',
            'abilities',
            'announcer',
            'counters',
            'match_info',
            'damage',
            'heal',
            'live_client_data',
            'jungle_camps',
            'team_frames',
        ],
        description: 'LOL data',
    },
    _b[GameKey.CS2] = {
        interestedInFeatures: [
            'gep_internal',
            'match_info',
            'live_data',
        ],
        description: 'CS:GO data',
    },
    _b[GameKey.RocketLeague] = {
        interestedInFeatures: [
            'stats',
            'roster',
            'match',
            'me',
            'match_info',
            'death',
            'game_info',
        ],
        description: 'Rocket league data',
    },
    _b[GameKey.PUBG] = {
        interestedInFeatures: [
            'kill',
            'revived',
            'death',
            'killer',
            'match',
            'rank',
            'location',
            'me',
            'team',
            'phase',
            'map',
            'roster',
            'inventory',
            'match_info',
            'counters',
        ],
        description: 'PUBG data',
    },
    _b[GameKey.Fortnite] = {
        interestedInFeatures: [
            'kill',
            'killed',
            'killer',
            'revived',
            'death',
            'match',
            'rank',
            'me',
            'phase',
            'location',
            'roster',
            'team',
            'items',
            'counters',
            'match_info',
            'map',
        ],
        description: 'Fortnite data',
    },
    _b[GameKey.ApexLegends] = {
        interestedInFeatures: [
            'death',
            'kill',
            'match_state',
            'me',
            'revive',
            'team',
            'roster',
            'kill_feed',
            'rank',
            'match_summary',
            'location',
            'match_info',
            'victory',
            'damage',
            'inventory',
            'localization',
        ],
        description: 'Apex data',
    },
    _b[GameKey.Valorant] = {
        interestedInFeatures: [
            'game_info',
            'me',
            'match_info',
            'kill',
            'death',
            'gep_internal',
        ],
        description: 'Valorant data',
    },
    _b[GameKey.CSGO] = {
        interestedInFeatures: [
            'kill',
            'death',
            'assist',
            'headshot',
            'round_start',
            'match_start',
            'match_end',
            'team_round_win',
            'bomb_planted',
            'bomb_change',
            'reloading',
            'fired',
            'weapon_change',
            'weapon_acquired',
            'player_activity_change',
            'team_set',
            'info',
            'roster',
            'scene',
            'match_info',
            'replay',
            'counters',
            'mvp',
            'kill_feed',
            'scoreboard',
            'score',
        ],
        description: 'CS:GO data',
    },
    _b);
exports["default"] = data;


/***/ }),

/***/ "./src/environment/environment.ts":
/*!****************************************!*\
  !*** ./src/environment/environment.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.environment = void 0;
exports.environment = {
    url: 'http://103.241.65.202:3000',
};


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Main = void 0;
__webpack_require__(/*! reflect-metadata */ "./node_modules/reflect-metadata/Reflect.js");
var tsyringe_1 = __webpack_require__(/*! tsyringe */ "./node_modules/tsyringe/dist/esm5/index.js");
var game_data_1 = __importDefault(__webpack_require__(/*! ./config/game-data */ "./src/config/game-data.ts"));
var gep_service_1 = __webpack_require__(/*! ./services/gep-service */ "./src/services/gep-service.ts");
var game_detection_service_1 = __webpack_require__(/*! ./services/game-detection-service */ "./src/services/game-detection-service.ts");
var gep_consumer_1 = __webpack_require__(/*! ./services/gep-consumer */ "./src/services/gep-consumer.ts");
var auth_service_1 = __webpack_require__(/*! ./services/auth-service */ "./src/services/auth-service.ts");
var Main = (function () {
    function Main(gepService, gepConsumer, gameDetectionService, authService) {
        this.gepService = gepService;
        this.gepConsumer = gepConsumer;
        this.gameDetectionService = gameDetectionService;
        this.authService = authService;
        this.init();
    }
    Main.prototype.init = function () {
        var _this = this;
        this.gameDetectionService.on('gameLaunched', function (gameLaunch) {
            console.log("Game was launched: ".concat(gameLaunch.name, " ").concat(gameLaunch.id));
            var gameConfig = game_data_1.default[gameLaunch.id];
            if (gameConfig) {
                _this.gepService.gameLaunchId = gameLaunch.id;
                _this.gepService.onGameLaunched(gameConfig.interestedInFeatures);
            }
        });
        this.gameDetectionService.on('gameClosed', function (gameClosed) {
            console.log("Game was closed: ".concat(gameClosed.name));
            _this.gepService.onGameClosed();
        });
        this.gameDetectionService.on('postGame', function (postGame) {
            console.log("Running post-game logic for game: ".concat(postGame.name));
        });
        this.gepService.on('gameEvent', this.gepConsumer.onNewGameEvent);
        this.gepService.on('infoUpdate', this.gepConsumer.onGameInfoUpdate);
        this.gepService.on('error', this.gepConsumer.onGEPError);
        this.gepService.on('gameEvent', this.gepService.onNewGameEvent);
        this.gepService.on('infoUpdate', this.gepService.onGameInfoUpdate);
        this.gameDetectionService.init();
    };
    Main = __decorate([
        (0, tsyringe_1.injectable)(),
        __metadata("design:paramtypes", [gep_service_1.GEPService,
            gep_consumer_1.GEPConsumer,
            game_detection_service_1.GameDetectionService,
            auth_service_1.AuthService])
    ], Main);
    return Main;
}());
exports.Main = Main;
tsyringe_1.container.resolve(Main);


/***/ }),

/***/ "./src/services/auth-service.ts":
/*!**************************************!*\
  !*** ./src/services/auth-service.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthService = void 0;
var tsyringe_1 = __webpack_require__(/*! tsyringe */ "./node_modules/tsyringe/dist/esm5/index.js");
var environment_1 = __webpack_require__(/*! ../environment/environment */ "./src/environment/environment.ts");
var AuthService = (function () {
    function AuthService() {
        this.user = null;
    }
    AuthService.prototype.getUser = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, fetch(environment_1.environment.url + "/auth/discord/user?sessionId=".concat(sessionId), {
                                method: 'GET',
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.ok) {
                            return [2, response.json()];
                        }
                        else {
                            console.error('Error:', response.statusText);
                            return [2, Promise.reject(new Error(response.statusText))];
                        }
                        return [3, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error:', error_1.message);
                        return [2, Promise.reject(error_1)];
                    case 3: return [2];
                }
            });
        });
    };
    AuthService.prototype.getConnections = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, fetch(environment_1.environment.url + "/auth/discord/connections?sessionId=".concat(sessionId), {
                                method: 'GET',
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.ok) {
                            return [2, response.json()];
                        }
                        else {
                            console.error('Error:', response.statusText);
                            return [2, Promise.reject(new Error(response.statusText))];
                        }
                        return [3, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error:', error_2.message);
                        return [2, Promise.reject(error_2)];
                    case 3: return [2];
                }
            });
        });
    };
    AuthService.prototype.login = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, fetch(environment_1.environment.url + '/auth/discord/login', {
                                method: 'GET',
                            })];
                    case 1:
                        response = _a.sent();
                        response.json().then(function (data) {
                            localStorage.setItem('sessionId', data.sessionId);
                            overwolf.utils.openUrlInDefaultBrowser(data.url);
                        });
                        return [3, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error:', error_3.message);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        });
    };
    AuthService = __decorate([
        (0, tsyringe_1.injectable)(),
        __metadata("design:paramtypes", [])
    ], AuthService);
    return AuthService;
}());
exports.AuthService = AuthService;


/***/ }),

/***/ "./src/services/game-detection-service.ts":
/*!************************************************!*\
  !*** ./src/services/game-detection-service.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameDetectionService = void 0;
var events_1 = __webpack_require__(/*! events */ "./node_modules/events/events.js");
var tsyringe_1 = __webpack_require__(/*! tsyringe */ "./node_modules/tsyringe/dist/esm5/index.js");
var GameDetectionService = (function (_super) {
    __extends(GameDetectionService, _super);
    function GameDetectionService() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._runningGame = undefined;
        return _this;
    }
    GameDetectionService.prototype.init = function () {
        var _this = this;
        overwolf.games.onGameInfoUpdated.addListener(function (update) {
            return _this.gameUpdated(update);
        });
        overwolf.games.getRunningGameInfo2(function (info) {
            var _a;
            if ((_a = info.gameInfo) === null || _a === void 0 ? void 0 : _a.isRunning)
                _this.gameLaunched(info.gameInfo, false);
        });
    };
    GameDetectionService.prototype.gameLaunched = function (gameInfo, freshLaunch) {
        if (freshLaunch && this._runningGame)
            throw new Error("A fresh launch was called, but a running game was already detected! Launched `".concat(gameInfo.title, "`, while `").concat(this._runningGame.name, "` was already running"));
        this._runningGame = {
            id: gameInfo.classId,
            name: gameInfo.title,
        };
        var gameLaunchedEvent = __assign(__assign({}, this._runningGame), { freshLaunch: freshLaunch });
        this.emit('gameLaunched', gameLaunchedEvent);
    };
    GameDetectionService.prototype.gameClosed = function (fullShutdown) {
        if (!this._runningGame)
            throw new Error('Cannot run `gameClosed` when no game is currently running!');
        var gameClosedEvent = __assign({}, this._runningGame);
        this._runningGame = undefined;
        this.emit('gameClosed', gameClosedEvent);
        if (fullShutdown) {
            var postGameEvent = __assign({}, gameClosedEvent);
            this.emit('postGame', postGameEvent);
        }
    };
    GameDetectionService.prototype.gameUpdated = function (updateEvent) {
        if (updateEvent.reason.includes("gameLaunched")) {
            if (this._runningGame) {
                this.gameClosed(false);
            }
            this.gameLaunched(updateEvent.gameInfo, true);
        }
        else if (updateEvent.reason.includes("gameTerminated")) {
            this.gameClosed(true);
        }
    };
    GameDetectionService.prototype.currentlyRunningGame = function () {
        return this._runningGame;
    };
    GameDetectionService = __decorate([
        (0, tsyringe_1.injectable)()
    ], GameDetectionService);
    return GameDetectionService;
}(events_1.EventEmitter));
exports.GameDetectionService = GameDetectionService;


/***/ }),

/***/ "./src/services/gep-consumer.ts":
/*!**************************************!*\
  !*** ./src/services/gep-consumer.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GEPConsumer = void 0;
var tsyringe_1 = __webpack_require__(/*! tsyringe */ "./node_modules/tsyringe/dist/esm5/index.js");
var GEPConsumer = (function () {
    function GEPConsumer() {
    }
    GEPConsumer.prototype.onGEPError = function (error) {
        console.error("GEP Error: ".concat(prettify(error)));
    };
    GEPConsumer.prototype.onGameInfoUpdate = function (info) {
        console.log("Game Info Changed: ".concat(prettify(info)));
    };
    GEPConsumer.prototype.onNewGameEvent = function (event) {
        console.log("Game Event Fired: ".concat(prettify(event)));
    };
    GEPConsumer = __decorate([
        (0, tsyringe_1.injectable)()
    ], GEPConsumer);
    return GEPConsumer;
}());
exports.GEPConsumer = GEPConsumer;
var prettify = function (data) {
    return JSON.stringify(data, undefined, 4);
};


/***/ }),

/***/ "./src/services/gep-service.ts":
/*!*************************************!*\
  !*** ./src/services/gep-service.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GEPService = void 0;
var events_1 = __webpack_require__(/*! events */ "./node_modules/events/events.js");
var tsyringe_1 = __webpack_require__(/*! tsyringe */ "./node_modules/tsyringe/dist/esm5/index.js");
var game_data_1 = __webpack_require__(/*! ../config/game-data */ "./src/config/game-data.ts");
var environment_1 = __webpack_require__(/*! ../environment/environment */ "./src/environment/environment.ts");
var GEPService = (function (_super) {
    __extends(GEPService, _super);
    function GEPService() {
        var _this = this;
        var _a;
        _this = _super.call(this) || this;
        _this.events = [];
        _this.info = [];
        _this.gameLaunchId = null;
        _this.getDataButton = document.getElementById('get-data-button');
        _this.userData = document.getElementById('user-data');
        _this.onErrorListener = _this.onErrorListener.bind(_this);
        _this.onInfoUpdateListener = _this.onInfoUpdateListener.bind(_this);
        _this.onGameEventListener = _this.onGameEventListener.bind(_this);
        (_a = _this.getDataButton) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
            _this.getFromDataBase();
        });
        return _this;
    }
    GEPService.prototype.saveToDataBase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var fileName, response, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('saveToDataBase worked');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        fileName = game_data_1.GameFileName[this.gameLaunchId];
                        return [4, fetch("".concat(environment_1.environment.url, "/game-data/write"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    data: {
                                        events: this.events,
                                        info: this.info,
                                        fileName: fileName || null,
                                    },
                                }),
                            })];
                    case 2:
                        response = _a.sent();
                        this.events = [];
                        this.info = [];
                        if (!!response.ok) return [3, 3];
                        console.error('Error saving to database:', response.statusText);
                        return [3, 5];
                    case 3: return [4, response.json()];
                    case 4:
                        result = _a.sent();
                        console.log('Data saved to database:', result);
                        _a.label = 5;
                    case 5: return [3, 7];
                    case 6:
                        error_1 = _a.sent();
                        this.events = [];
                        this.info = [];
                        console.error('Error:', error_1.message);
                        return [3, 7];
                    case 7: return [2];
                }
            });
        });
    };
    GEPService.prototype.getFromDataBase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, response, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        sessionId = localStorage.getItem('sessionId');
                        if (!sessionId) {
                            return [2];
                        }
                        return [4, fetch("".concat(environment_1.environment.url, "?sessionId=").concat(sessionId), {
                                method: 'GET',
                            })];
                    case 1:
                        response = _a.sent();
                        response.json().then(function (data) {
                            var _a;
                            (_a = _this.userData) === null || _a === void 0 ? void 0 : _a.innerText = JSON.stringify(data, null, 2);
                        });
                        return [3, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error:', error_2.message);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        });
    };
    GEPService.prototype.onNewGameEvent = function (event) {
        switch (this.gameLaunchId) {
            case game_data_1.GameKey.ApexLegends:
                this.handleApexLegendsEvents(event);
                break;
            case game_data_1.GameKey.RocketLeague:
                this.handleRocketLeagueEvents(event);
                break;
            case game_data_1.GameKey.Fortnite:
                this.handleFortniteEvents(event);
                break;
            case game_data_1.GameKey.Valorant:
                this.handleValorantEvents(event);
                break;
            case game_data_1.GameKey.LeagueOfLegends:
                this.handleLeagueOfLegendsEvents(event);
                break;
            case game_data_1.GameKey.PUBG:
                this.handlePUBGEvents(event);
                break;
            case game_data_1.GameKey.CS2:
                this.handleCS2Events(event);
                break;
        }
    };
    GEPService.prototype.onGameInfoUpdate = function (info) {
        if (!info.info) {
            return;
        }
        switch (this.gameLaunchId) {
            case game_data_1.GameKey.RocketLeague:
                this.handleRocketLeagueInfo(info);
                break;
            case game_data_1.GameKey.Fortnite:
                this.handleFortniteInfo(info);
                break;
            case game_data_1.GameKey.Valorant:
                this.handleValorantInfo(info);
                break;
            case game_data_1.GameKey.LeagueOfLegends:
                this.handleLeagueOfLegendsInfo(info);
                break;
            case game_data_1.GameKey.PUBG:
                this.handlePUBGInfo(info);
                break;
        }
    };
    GEPService.prototype.handleApexLegendsEvents = function (event) {
        var killFeedEvent = event.events.find(function (item) { return item.name === 'kill_feed'; });
        if (killFeedEvent) {
            var killFeedEventDataParsed = JSON.parse(killFeedEvent.data);
            var resultData = {
                local_player_name: killFeedEventDataParsed.local_player_name,
                victimName: killFeedEventDataParsed.victimName,
                action: killFeedEventDataParsed.action,
            };
            this.events.push(resultData);
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'match_end'; });
        if (matchEndEvent && this.events.length) {
            this.events.push({
                name: matchEndEvent.name,
                data: { date: new Date() },
            });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handleRocketLeagueEvents = function (event) {
        var goalEvent = event.events.find(function (item) { return item.name === 'goal'; });
        if (goalEvent) {
            this.events.push(goalEvent);
            return;
        }
        var scoreEvent = event.events.find(function (item) { return item.name === 'score'; });
        if (scoreEvent) {
            this.events.push(scoreEvent);
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'matchEnd'; });
        if (matchEndEvent && (this.info.length || this.events.length)) {
            this.events.push({
                name: matchEndEvent.name,
                data: { date: new Date() },
            });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handleRocketLeagueInfo = function (info) {
        var _this = this;
        if (info.info.matchState &&
            (Object.prototype.hasOwnProperty.call(info.info.matchState, 'started') ||
                Object.prototype.hasOwnProperty.call(info.info.matchState, 'ended'))) {
            this.info.push({
                matchState: info.info.matchState,
                data: { date: new Date() },
            });
        }
        if (info.info.playersInfo) {
            Object.keys(info.info.playersInfo).map(function (item) {
                if (item.match(/player([0-9]+)/gi)) {
                    _this.info.push(info.info);
                }
            });
        }
    };
    GEPService.prototype.handleFortniteEvents = function (event) {
        var killedEvent = event.events.find(function (item) { return item.name === 'killed'; });
        if (killedEvent) {
            this.events.push(killedEvent);
            return;
        }
        var deathEvent = event.events.find(function (item) { return item.name === 'death'; });
        if (deathEvent) {
            this.events.push(deathEvent);
            return;
        }
        var matchStartEvent = event.events.find(function (item) { return item.name === 'matchStart'; });
        if (matchStartEvent) {
            this.events.push({
                name: matchStartEvent.name,
                data: { date: new Date() },
            });
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'matchEnd'; });
        if (matchEndEvent && (this.info.length || this.events.length)) {
            this.events.push({
                name: matchEndEvent.name,
                data: { date: new Date() },
            });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handleFortniteInfo = function (info) {
        if (info.info.match_info &&
            Object.prototype.hasOwnProperty.call(info.info.match_info, 'rank')) {
            this.info.push(info.info);
        }
    };
    GEPService.prototype.handleValorantEvents = function (event) {
        var matchStartEvent = event.events.find(function (item) { return item.name === 'match_start'; });
        if (matchStartEvent) {
            this.events.push({
                name: matchStartEvent.name,
                data: { date: new Date() },
            });
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'match_end'; });
        if (matchEndEvent && (this.info.length || this.events.length)) {
            this.events.push({
                name: matchEndEvent.name,
                data: { date: new Date() },
            });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handleValorantInfo = function (info) {
        if (info.info.match_info &&
            Object.prototype.hasOwnProperty.call(info.info.match_info, 'kill_feed')) {
            this.info.push(info.info);
        }
    };
    GEPService.prototype.handleLeagueOfLegendsEvents = function (event) {
        var killEvent = event.events.find(function (item) { return item.name === 'kill'; });
        if (killEvent) {
            this.events.push(killEvent);
            return;
        }
        var deathEvent = event.events.find(function (item) { return item.name === 'death'; });
        if (deathEvent) {
            this.events.push(deathEvent);
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'announcer'; });
        if (matchEndEvent &&
            (this.info.length || this.events.length) &&
            (matchEndEvent.data.includes('victory') ||
                matchEndEvent.data.includes('defeat'))) {
            this.events.push(matchEndEvent);
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handleLeagueOfLegendsInfo = function (info) {
        if (info.info.live_client_data &&
            Object.prototype.hasOwnProperty.call(info.info.live_client_data, 'all_players')) {
            this.info.push(info.info);
        }
    };
    GEPService.prototype.handlePUBGEvents = function (event) {
        var killEvent = event.events.find(function (item) { return item.name === 'kill'; });
        if (killEvent) {
            this.events.push(killEvent);
            return;
        }
        var killerEvent = event.events.find(function (item) { return item.name === 'killer'; });
        if (killerEvent) {
            this.events.push(killerEvent);
            return;
        }
        var deathEvent = event.events.find(function (item) { return item.name === 'death'; });
        if (deathEvent) {
            this.events.push(deathEvent);
            return;
        }
        var matchStartEvent = event.events.find(function (item) { return item.name === 'matchStart'; });
        if (matchStartEvent) {
            this.events.push({
                name: matchStartEvent.name,
                data: { date: new Date() },
            });
            return;
        }
        var matchSummaryEvent = event.events.find(function (item) { return item.name === 'matchSummary'; });
        if (matchSummaryEvent) {
            this.events.push(matchSummaryEvent);
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'matchEnd'; });
        if (matchEndEvent && (this.info.length || this.events.length)) {
            this.events.push({
                name: matchEndEvent.name,
                data: { date: new Date() },
            });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handlePUBGInfo = function (info) {
        if ((info.info.match_info &&
            Object.prototype.hasOwnProperty.call(info.info.match_info, 'kills')) ||
            Object.prototype.hasOwnProperty.call(info.info.match_info, 'headshots')) {
            this.info.push(info.info);
        }
    };
    GEPService.prototype.handleCS2Events = function (event) {
        var killEvent = event.events.find(function (item) { return item.name === 'kill'; });
        if (killEvent) {
            this.events.push(killEvent);
            return;
        }
        var deathEvent = event.events.find(function (item) { return item.name === 'death'; });
        if (deathEvent) {
            this.events.push(deathEvent);
            return;
        }
        var killFeedEvent = event.events.find(function (item) { return item.name === 'kill_feed'; });
        if (killFeedEvent) {
            this.events.push(killFeedEvent);
            return;
        }
        var matchStartEvent = event.events.find(function (item) { return item.name === 'match_start'; });
        if (matchStartEvent) {
            this.events.push({
                name: matchStartEvent.name,
                data: { date: new Date() },
            });
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'match_end'; });
        console.log(matchEndEvent, 'match_end event log!');
        if (matchEndEvent && (this.info.length || this.events.length)) {
            console.log('CS2 match_end event worked');
            this.events.push({
                name: matchEndEvent.name,
                data: { date: new Date() },
            });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.onErrorListener = function (error) {
        this.emit('error', error);
    };
    GEPService.prototype.onInfoUpdateListener = function (info) {
        this.tryEmit('infoUpdate', info);
    };
    GEPService.prototype.onGameEventListener = function (events) {
        this.tryEmit('gameEvent', events);
    };
    GEPService.prototype.tryEmit = function (event, value) {
        if (this.listenerCount(event)) {
            this.emit(event, value);
        }
        else {
            console.warn("Unhandled ".concat(event, ", with value ").concat(value));
        }
    };
    GEPService.prototype.onGameLaunched = function (requiredFeatures) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('Registering GEP listeners');
                this.registerEvents();
                if (requiredFeatures) {
                    console.log('Registering required features');
                    return [2, this.setRequiredFeatures(requiredFeatures, 10)];
                }
                console.log('GEP SDK detected, no need to set required features');
                return [2];
            });
        });
    };
    GEPService.prototype.onGameClosed = function () {
        console.log('Removing all GEP listeners');
        this.unregisterEvents();
    };
    GEPService.prototype.setRequiredFeatures = function (requiredFeatures, maximumRetries) {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1, i, state_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_1 = function (i) {
                            var success_1, e_1;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 4]);
                                        return [4, this_1.trySetRequiredFeatures(requiredFeatures)];
                                    case 1:
                                        success_1 = _b.sent();
                                        console.log("Required features set: ".concat(success_1));
                                        if (success_1.length < requiredFeatures.length)
                                            console.warn("Could not set ".concat(requiredFeatures.filter(function (feature) { return !success_1.includes(feature); })));
                                        return [2, { value: success_1 }];
                                    case 2:
                                        e_1 = _b.sent();
                                        console.warn("Could not set required features: ".concat(JSON.stringify(e_1)));
                                        console.log('Retrying in 2 seconds');
                                        return [4, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                                    case 3:
                                        _b.sent();
                                        return [3, 4];
                                    case 4: return [2];
                                }
                            });
                        };
                        this_1 = this;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < maximumRetries)) return [3, 4];
                        return [5, _loop_1(i)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2, state_1.value];
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3, 1];
                    case 4: throw new Error('Aborting required features!');
                }
            });
        });
    };
    GEPService.prototype.trySetRequiredFeatures = function (requiredFeatures) {
        return __awaiter(this, void 0, void 0, function () {
            var registered, failed, promise;
            return __generator(this, function (_a) {
                promise = new Promise(function (resolve, reject) {
                    registered = resolve;
                    failed = reject;
                });
                overwolf.games.events.setRequiredFeatures(requiredFeatures, function (result) {
                    if (!result.success) {
                        return failed(result.error);
                    }
                    registered(result.supportedFeatures);
                });
                return [2, promise];
            });
        });
    };
    GEPService.prototype.registerEvents = function () {
        overwolf.games.events.onError.addListener(this.onErrorListener);
        overwolf.games.events.onInfoUpdates2.addListener(this.onInfoUpdateListener);
        overwolf.games.events.onNewEvents.addListener(this.onGameEventListener);
    };
    GEPService.prototype.unregisterEvents = function () {
        overwolf.games.events.onError.removeListener(this.onErrorListener);
        overwolf.games.events.onInfoUpdates2.removeListener(this.onInfoUpdateListener);
        overwolf.games.events.onNewEvents.removeListener(this.onGameEventListener);
    };
    GEPService = __decorate([
        (0, tsyringe_1.injectable)(),
        __metadata("design:paramtypes", [])
    ], GEPService);
    return GEPService;
}(events_1.EventEmitter));
exports.GEPService = GEPService;


/***/ }),

/***/ "./node_modules/tslib/tslib.es6.js":
/*!*****************************************!*\
  !*** ./node_modules/tslib/tslib.es6.js ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   __assign: function() { return /* binding */ __assign; },
/* harmony export */   __asyncDelegator: function() { return /* binding */ __asyncDelegator; },
/* harmony export */   __asyncGenerator: function() { return /* binding */ __asyncGenerator; },
/* harmony export */   __asyncValues: function() { return /* binding */ __asyncValues; },
/* harmony export */   __await: function() { return /* binding */ __await; },
/* harmony export */   __awaiter: function() { return /* binding */ __awaiter; },
/* harmony export */   __classPrivateFieldGet: function() { return /* binding */ __classPrivateFieldGet; },
/* harmony export */   __classPrivateFieldSet: function() { return /* binding */ __classPrivateFieldSet; },
/* harmony export */   __createBinding: function() { return /* binding */ __createBinding; },
/* harmony export */   __decorate: function() { return /* binding */ __decorate; },
/* harmony export */   __exportStar: function() { return /* binding */ __exportStar; },
/* harmony export */   __extends: function() { return /* binding */ __extends; },
/* harmony export */   __generator: function() { return /* binding */ __generator; },
/* harmony export */   __importDefault: function() { return /* binding */ __importDefault; },
/* harmony export */   __importStar: function() { return /* binding */ __importStar; },
/* harmony export */   __makeTemplateObject: function() { return /* binding */ __makeTemplateObject; },
/* harmony export */   __metadata: function() { return /* binding */ __metadata; },
/* harmony export */   __param: function() { return /* binding */ __param; },
/* harmony export */   __read: function() { return /* binding */ __read; },
/* harmony export */   __rest: function() { return /* binding */ __rest; },
/* harmony export */   __spread: function() { return /* binding */ __spread; },
/* harmony export */   __spreadArrays: function() { return /* binding */ __spreadArrays; },
/* harmony export */   __values: function() { return /* binding */ __values; }
/* harmony export */ });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __createBinding(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}

function __exportStar(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
}

function __classPrivateFieldSet(receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/auto-injectable.js":
/*!***********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/auto-injectable.js ***!
  \***********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");
/* harmony import */ var _providers_injection_token__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../providers/injection-token */ "./node_modules/tsyringe/dist/esm5/providers/injection-token.js");
/* harmony import */ var _error_helpers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../error-helpers */ "./node_modules/tsyringe/dist/esm5/error-helpers.js");





function autoInjectable() {
    return function (target) {
        var paramInfo = (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.getParamInfo)(target);
        return (function (_super) {
            (0,tslib__WEBPACK_IMPORTED_MODULE_4__.__extends)(class_1, _super);
            function class_1() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _super.apply(this, (0,tslib__WEBPACK_IMPORTED_MODULE_4__.__spread)(args.concat(paramInfo.slice(args.length).map(function (type, index) {
                    var _a, _b, _c;
                    try {
                        if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTokenDescriptor)(type)) {
                            if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTransformDescriptor)(type)) {
                                return type.multiple
                                    ? (_a = _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance
                                        .resolve(type.transform)).transform.apply(_a, (0,tslib__WEBPACK_IMPORTED_MODULE_4__.__spread)([_dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolveAll(type.token)], type.transformArgs)) : (_b = _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance
                                    .resolve(type.transform)).transform.apply(_b, (0,tslib__WEBPACK_IMPORTED_MODULE_4__.__spread)([_dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolve(type.token)], type.transformArgs));
                            }
                            else {
                                return type.multiple
                                    ? _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolveAll(type.token)
                                    : _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolve(type.token);
                            }
                        }
                        else if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTransformDescriptor)(type)) {
                            return (_c = _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance
                                .resolve(type.transform)).transform.apply(_c, (0,tslib__WEBPACK_IMPORTED_MODULE_4__.__spread)([_dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolve(type.token)], type.transformArgs));
                        }
                        return _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolve(type);
                    }
                    catch (e) {
                        var argIndex = index + args.length;
                        throw new Error((0,_error_helpers__WEBPACK_IMPORTED_MODULE_3__.formatErrorCtor)(target, argIndex, e));
                    }
                })))) || this;
            }
            return class_1;
        }(target));
    };
}
/* harmony default export */ __webpack_exports__["default"] = (autoInjectable);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/index.js":
/*!*************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/index.js ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   autoInjectable: function() { return /* reexport safe */ _auto_injectable__WEBPACK_IMPORTED_MODULE_0__["default"]; },
/* harmony export */   inject: function() { return /* reexport safe */ _inject__WEBPACK_IMPORTED_MODULE_1__["default"]; },
/* harmony export */   injectAll: function() { return /* reexport safe */ _inject_all__WEBPACK_IMPORTED_MODULE_5__["default"]; },
/* harmony export */   injectAllWithTransform: function() { return /* reexport safe */ _inject_all_with_transform__WEBPACK_IMPORTED_MODULE_6__["default"]; },
/* harmony export */   injectWithTransform: function() { return /* reexport safe */ _inject_with_transform__WEBPACK_IMPORTED_MODULE_7__["default"]; },
/* harmony export */   injectable: function() { return /* reexport safe */ _injectable__WEBPACK_IMPORTED_MODULE_2__["default"]; },
/* harmony export */   registry: function() { return /* reexport safe */ _registry__WEBPACK_IMPORTED_MODULE_3__["default"]; },
/* harmony export */   scoped: function() { return /* reexport safe */ _scoped__WEBPACK_IMPORTED_MODULE_8__["default"]; },
/* harmony export */   singleton: function() { return /* reexport safe */ _singleton__WEBPACK_IMPORTED_MODULE_4__["default"]; }
/* harmony export */ });
/* harmony import */ var _auto_injectable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./auto-injectable */ "./node_modules/tsyringe/dist/esm5/decorators/auto-injectable.js");
/* harmony import */ var _inject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./inject */ "./node_modules/tsyringe/dist/esm5/decorators/inject.js");
/* harmony import */ var _injectable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./injectable */ "./node_modules/tsyringe/dist/esm5/decorators/injectable.js");
/* harmony import */ var _registry__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./registry */ "./node_modules/tsyringe/dist/esm5/decorators/registry.js");
/* harmony import */ var _singleton__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./singleton */ "./node_modules/tsyringe/dist/esm5/decorators/singleton.js");
/* harmony import */ var _inject_all__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./inject-all */ "./node_modules/tsyringe/dist/esm5/decorators/inject-all.js");
/* harmony import */ var _inject_all_with_transform__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./inject-all-with-transform */ "./node_modules/tsyringe/dist/esm5/decorators/inject-all-with-transform.js");
/* harmony import */ var _inject_with_transform__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./inject-with-transform */ "./node_modules/tsyringe/dist/esm5/decorators/inject-with-transform.js");
/* harmony import */ var _scoped__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./scoped */ "./node_modules/tsyringe/dist/esm5/decorators/scoped.js");











/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/inject-all-with-transform.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/inject-all-with-transform.js ***!
  \*********************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");

function injectAllWithTransform(token, transformer) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var data = {
        token: token,
        multiple: true,
        transform: transformer,
        transformArgs: args
    };
    return (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.defineInjectionTokenMetadata)(data);
}
/* harmony default export */ __webpack_exports__["default"] = (injectAllWithTransform);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/inject-all.js":
/*!******************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/inject-all.js ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");

function injectAll(token) {
    var data = { token: token, multiple: true };
    return (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.defineInjectionTokenMetadata)(data);
}
/* harmony default export */ __webpack_exports__["default"] = (injectAll);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/inject-with-transform.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/inject-with-transform.js ***!
  \*****************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");

function injectWithTransform(token, transformer) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.defineInjectionTokenMetadata)(token, {
        transformToken: transformer,
        args: args
    });
}
/* harmony default export */ __webpack_exports__["default"] = (injectWithTransform);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/inject.js":
/*!**************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/inject.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");

function inject(token) {
    return (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.defineInjectionTokenMetadata)(token);
}
/* harmony default export */ __webpack_exports__["default"] = (inject);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/injectable.js":
/*!******************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/injectable.js ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");


function injectable() {
    return function (target) {
        _dependency_container__WEBPACK_IMPORTED_MODULE_1__.typeInfo.set(target, (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.getParamInfo)(target));
    };
}
/* harmony default export */ __webpack_exports__["default"] = (injectable);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/registry.js":
/*!****************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/registry.js ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");


function registry(registrations) {
    if (registrations === void 0) { registrations = []; }
    return function (target) {
        registrations.forEach(function (_a) {
            var token = _a.token, options = _a.options, provider = (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__rest)(_a, ["token", "options"]);
            return _dependency_container__WEBPACK_IMPORTED_MODULE_0__.instance.register(token, provider, options);
        });
        return target;
    };
}
/* harmony default export */ __webpack_exports__["default"] = (registry);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/scoped.js":
/*!**************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/scoped.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ scoped; }
/* harmony export */ });
/* harmony import */ var _injectable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./injectable */ "./node_modules/tsyringe/dist/esm5/decorators/injectable.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");


function scoped(lifecycle, token) {
    return function (target) {
        (0,_injectable__WEBPACK_IMPORTED_MODULE_0__["default"])()(target);
        _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.register(token || target, target, {
            lifecycle: lifecycle
        });
    };
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/singleton.js":
/*!*****************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/singleton.js ***!
  \*****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _injectable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./injectable */ "./node_modules/tsyringe/dist/esm5/decorators/injectable.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");


function singleton() {
    return function (target) {
        (0,_injectable__WEBPACK_IMPORTED_MODULE_0__["default"])()(target);
        _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.registerSingleton(target);
    };
}
/* harmony default export */ __webpack_exports__["default"] = (singleton);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/dependency-container.js":
/*!*****************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/dependency-container.js ***!
  \*****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   instance: function() { return /* binding */ instance; },
/* harmony export */   typeInfo: function() { return /* binding */ typeInfo; }
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _providers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./providers */ "./node_modules/tsyringe/dist/esm5/providers/index.js");
/* harmony import */ var _providers_provider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./providers/provider */ "./node_modules/tsyringe/dist/esm5/providers/provider.js");
/* harmony import */ var _providers_injection_token__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./providers/injection-token */ "./node_modules/tsyringe/dist/esm5/providers/injection-token.js");
/* harmony import */ var _registry__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./registry */ "./node_modules/tsyringe/dist/esm5/registry.js");
/* harmony import */ var _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./types/lifecycle */ "./node_modules/tsyringe/dist/esm5/types/lifecycle.js");
/* harmony import */ var _resolution_context__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./resolution-context */ "./node_modules/tsyringe/dist/esm5/resolution-context.js");
/* harmony import */ var _error_helpers__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./error-helpers */ "./node_modules/tsyringe/dist/esm5/error-helpers.js");
/* harmony import */ var _lazy_helpers__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./lazy-helpers */ "./node_modules/tsyringe/dist/esm5/lazy-helpers.js");
/* harmony import */ var _types_disposable__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./types/disposable */ "./node_modules/tsyringe/dist/esm5/types/disposable.js");
/* harmony import */ var _interceptors__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./interceptors */ "./node_modules/tsyringe/dist/esm5/interceptors.js");











var typeInfo = new Map();
var InternalDependencyContainer = (function () {
    function InternalDependencyContainer(parent) {
        this.parent = parent;
        this._registry = new _registry__WEBPACK_IMPORTED_MODULE_3__["default"]();
        this.interceptors = new _interceptors__WEBPACK_IMPORTED_MODULE_9__["default"]();
        this.disposed = false;
        this.disposables = new Set();
    }
    InternalDependencyContainer.prototype.register = function (token, providerOrConstructor, options) {
        if (options === void 0) { options = { lifecycle: _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Transient }; }
        this.ensureNotDisposed();
        var provider;
        if (!(0,_providers_provider__WEBPACK_IMPORTED_MODULE_1__.isProvider)(providerOrConstructor)) {
            provider = { useClass: providerOrConstructor };
        }
        else {
            provider = providerOrConstructor;
        }
        if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isTokenProvider)(provider)) {
            var path = [token];
            var tokenProvider = provider;
            while (tokenProvider != null) {
                var currentToken = tokenProvider.useToken;
                if (path.includes(currentToken)) {
                    throw new Error("Token registration cycle detected! " + (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__spread)(path, [currentToken]).join(" -> "));
                }
                path.push(currentToken);
                var registration = this._registry.get(currentToken);
                if (registration && (0,_providers__WEBPACK_IMPORTED_MODULE_0__.isTokenProvider)(registration.provider)) {
                    tokenProvider = registration.provider;
                }
                else {
                    tokenProvider = null;
                }
            }
        }
        if (options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Singleton ||
            options.lifecycle == _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ContainerScoped ||
            options.lifecycle == _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ResolutionScoped) {
            if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isValueProvider)(provider) || (0,_providers__WEBPACK_IMPORTED_MODULE_0__.isFactoryProvider)(provider)) {
                throw new Error("Cannot use lifecycle \"" + _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"][options.lifecycle] + "\" with ValueProviders or FactoryProviders");
            }
        }
        this._registry.set(token, { provider: provider, options: options });
        return this;
    };
    InternalDependencyContainer.prototype.registerType = function (from, to) {
        this.ensureNotDisposed();
        if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(to)) {
            return this.register(from, {
                useToken: to
            });
        }
        return this.register(from, {
            useClass: to
        });
    };
    InternalDependencyContainer.prototype.registerInstance = function (token, instance) {
        this.ensureNotDisposed();
        return this.register(token, {
            useValue: instance
        });
    };
    InternalDependencyContainer.prototype.registerSingleton = function (from, to) {
        this.ensureNotDisposed();
        if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(from)) {
            if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(to)) {
                return this.register(from, {
                    useToken: to
                }, { lifecycle: _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Singleton });
            }
            else if (to) {
                return this.register(from, {
                    useClass: to
                }, { lifecycle: _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Singleton });
            }
            throw new Error('Cannot register a type name as a singleton without a "to" token');
        }
        var useClass = from;
        if (to && !(0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(to)) {
            useClass = to;
        }
        return this.register(from, {
            useClass: useClass
        }, { lifecycle: _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Singleton });
    };
    InternalDependencyContainer.prototype.resolve = function (token, context) {
        if (context === void 0) { context = new _resolution_context__WEBPACK_IMPORTED_MODULE_5__["default"](); }
        this.ensureNotDisposed();
        var registration = this.getRegistration(token);
        if (!registration && (0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(token)) {
            throw new Error("Attempted to resolve unregistered dependency token: \"" + token.toString() + "\"");
        }
        this.executePreResolutionInterceptor(token, "Single");
        if (registration) {
            var result = this.resolveRegistration(registration, context);
            this.executePostResolutionInterceptor(token, result, "Single");
            return result;
        }
        if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isConstructorToken)(token)) {
            var result = this.construct(token, context);
            this.executePostResolutionInterceptor(token, result, "Single");
            return result;
        }
        throw new Error("Attempted to construct an undefined constructor. Could mean a circular dependency problem. Try using `delay` function.");
    };
    InternalDependencyContainer.prototype.executePreResolutionInterceptor = function (token, resolutionType) {
        var e_1, _a;
        if (this.interceptors.preResolution.has(token)) {
            var remainingInterceptors = [];
            try {
                for (var _b = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__values)(this.interceptors.preResolution.getAll(token)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var interceptor = _c.value;
                    if (interceptor.options.frequency != "Once") {
                        remainingInterceptors.push(interceptor);
                    }
                    interceptor.callback(token, resolutionType);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            this.interceptors.preResolution.setAll(token, remainingInterceptors);
        }
    };
    InternalDependencyContainer.prototype.executePostResolutionInterceptor = function (token, result, resolutionType) {
        var e_2, _a;
        if (this.interceptors.postResolution.has(token)) {
            var remainingInterceptors = [];
            try {
                for (var _b = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__values)(this.interceptors.postResolution.getAll(token)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var interceptor = _c.value;
                    if (interceptor.options.frequency != "Once") {
                        remainingInterceptors.push(interceptor);
                    }
                    interceptor.callback(token, result, resolutionType);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            this.interceptors.postResolution.setAll(token, remainingInterceptors);
        }
    };
    InternalDependencyContainer.prototype.resolveRegistration = function (registration, context) {
        this.ensureNotDisposed();
        if (registration.options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ResolutionScoped &&
            context.scopedResolutions.has(registration)) {
            return context.scopedResolutions.get(registration);
        }
        var isSingleton = registration.options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Singleton;
        var isContainerScoped = registration.options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ContainerScoped;
        var returnInstance = isSingleton || isContainerScoped;
        var resolved;
        if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isValueProvider)(registration.provider)) {
            resolved = registration.provider.useValue;
        }
        else if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isTokenProvider)(registration.provider)) {
            resolved = returnInstance
                ? registration.instance ||
                    (registration.instance = this.resolve(registration.provider.useToken, context))
                : this.resolve(registration.provider.useToken, context);
        }
        else if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isClassProvider)(registration.provider)) {
            resolved = returnInstance
                ? registration.instance ||
                    (registration.instance = this.construct(registration.provider.useClass, context))
                : this.construct(registration.provider.useClass, context);
        }
        else if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isFactoryProvider)(registration.provider)) {
            resolved = registration.provider.useFactory(this);
        }
        else {
            resolved = this.construct(registration.provider, context);
        }
        if (registration.options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ResolutionScoped) {
            context.scopedResolutions.set(registration, resolved);
        }
        return resolved;
    };
    InternalDependencyContainer.prototype.resolveAll = function (token, context) {
        var _this = this;
        if (context === void 0) { context = new _resolution_context__WEBPACK_IMPORTED_MODULE_5__["default"](); }
        this.ensureNotDisposed();
        var registrations = this.getAllRegistrations(token);
        if (!registrations && (0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(token)) {
            throw new Error("Attempted to resolve unregistered dependency token: \"" + token.toString() + "\"");
        }
        this.executePreResolutionInterceptor(token, "All");
        if (registrations) {
            var result_1 = registrations.map(function (item) {
                return _this.resolveRegistration(item, context);
            });
            this.executePostResolutionInterceptor(token, result_1, "All");
            return result_1;
        }
        var result = [this.construct(token, context)];
        this.executePostResolutionInterceptor(token, result, "All");
        return result;
    };
    InternalDependencyContainer.prototype.isRegistered = function (token, recursive) {
        if (recursive === void 0) { recursive = false; }
        this.ensureNotDisposed();
        return (this._registry.has(token) ||
            (recursive &&
                (this.parent || false) &&
                this.parent.isRegistered(token, true)));
    };
    InternalDependencyContainer.prototype.reset = function () {
        this.ensureNotDisposed();
        this._registry.clear();
        this.interceptors.preResolution.clear();
        this.interceptors.postResolution.clear();
    };
    InternalDependencyContainer.prototype.clearInstances = function () {
        var e_3, _a;
        this.ensureNotDisposed();
        try {
            for (var _b = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__values)(this._registry.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__read)(_c.value, 2), token = _d[0], registrations = _d[1];
                this._registry.setAll(token, registrations
                    .filter(function (registration) { return !(0,_providers__WEBPACK_IMPORTED_MODULE_0__.isValueProvider)(registration.provider); })
                    .map(function (registration) {
                    registration.instance = undefined;
                    return registration;
                }));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
    };
    InternalDependencyContainer.prototype.createChildContainer = function () {
        var e_4, _a;
        this.ensureNotDisposed();
        var childContainer = new InternalDependencyContainer(this);
        try {
            for (var _b = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__values)(this._registry.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__read)(_c.value, 2), token = _d[0], registrations = _d[1];
                if (registrations.some(function (_a) {
                    var options = _a.options;
                    return options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ContainerScoped;
                })) {
                    childContainer._registry.setAll(token, registrations.map(function (registration) {
                        if (registration.options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ContainerScoped) {
                            return {
                                provider: registration.provider,
                                options: registration.options
                            };
                        }
                        return registration;
                    }));
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return childContainer;
    };
    InternalDependencyContainer.prototype.beforeResolution = function (token, callback, options) {
        if (options === void 0) { options = { frequency: "Always" }; }
        this.interceptors.preResolution.set(token, {
            callback: callback,
            options: options
        });
    };
    InternalDependencyContainer.prototype.afterResolution = function (token, callback, options) {
        if (options === void 0) { options = { frequency: "Always" }; }
        this.interceptors.postResolution.set(token, {
            callback: callback,
            options: options
        });
    };
    InternalDependencyContainer.prototype.dispose = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__awaiter)(this, void 0, void 0, function () {
            var promises;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.disposed = true;
                        promises = [];
                        this.disposables.forEach(function (disposable) {
                            var maybePromise = disposable.dispose();
                            if (maybePromise) {
                                promises.push(maybePromise);
                            }
                        });
                        return [4, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    InternalDependencyContainer.prototype.getRegistration = function (token) {
        if (this.isRegistered(token)) {
            return this._registry.get(token);
        }
        if (this.parent) {
            return this.parent.getRegistration(token);
        }
        return null;
    };
    InternalDependencyContainer.prototype.getAllRegistrations = function (token) {
        if (this.isRegistered(token)) {
            return this._registry.getAll(token);
        }
        if (this.parent) {
            return this.parent.getAllRegistrations(token);
        }
        return null;
    };
    InternalDependencyContainer.prototype.construct = function (ctor, context) {
        var _this = this;
        if (ctor instanceof _lazy_helpers__WEBPACK_IMPORTED_MODULE_7__.DelayedConstructor) {
            return ctor.createProxy(function (target) {
                return _this.resolve(target, context);
            });
        }
        var instance = (function () {
            var paramInfo = typeInfo.get(ctor);
            if (!paramInfo || paramInfo.length === 0) {
                if (ctor.length === 0) {
                    return new ctor();
                }
                else {
                    throw new Error("TypeInfo not known for \"" + ctor.name + "\"");
                }
            }
            var params = paramInfo.map(_this.resolveParams(context, ctor));
            return new (ctor.bind.apply(ctor, (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__spread)([void 0], params)))();
        })();
        if ((0,_types_disposable__WEBPACK_IMPORTED_MODULE_8__.isDisposable)(instance)) {
            this.disposables.add(instance);
        }
        return instance;
    };
    InternalDependencyContainer.prototype.resolveParams = function (context, ctor) {
        var _this = this;
        return function (param, idx) {
            var _a, _b, _c;
            try {
                if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTokenDescriptor)(param)) {
                    if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTransformDescriptor)(param)) {
                        return param.multiple
                            ? (_a = _this.resolve(param.transform)).transform.apply(_a, (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__spread)([_this.resolveAll(param.token)], param.transformArgs)) : (_b = _this.resolve(param.transform)).transform.apply(_b, (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__spread)([_this.resolve(param.token, context)], param.transformArgs));
                    }
                    else {
                        return param.multiple
                            ? _this.resolveAll(param.token)
                            : _this.resolve(param.token, context);
                    }
                }
                else if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTransformDescriptor)(param)) {
                    return (_c = _this.resolve(param.transform, context)).transform.apply(_c, (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__spread)([_this.resolve(param.token, context)], param.transformArgs));
                }
                return _this.resolve(param, context);
            }
            catch (e) {
                throw new Error((0,_error_helpers__WEBPACK_IMPORTED_MODULE_6__.formatErrorCtor)(ctor, idx, e));
            }
        };
    };
    InternalDependencyContainer.prototype.ensureNotDisposed = function () {
        if (this.disposed) {
            throw new Error("This container has been disposed, you cannot interact with a disposed container");
        }
    };
    return InternalDependencyContainer;
}());
var instance = new InternalDependencyContainer();
/* harmony default export */ __webpack_exports__["default"] = (instance);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/error-helpers.js":
/*!**********************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/error-helpers.js ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   formatErrorCtor: function() { return /* binding */ formatErrorCtor; }
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");

function formatDependency(params, idx) {
    if (params === null) {
        return "at position #" + idx;
    }
    var argName = params.split(",")[idx].trim();
    return "\"" + argName + "\" at position #" + idx;
}
function composeErrorMessage(msg, e, indent) {
    if (indent === void 0) { indent = "    "; }
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)([msg], e.message.split("\n").map(function (l) { return indent + l; })).join("\n");
}
function formatErrorCtor(ctor, paramIdx, error) {
    var _a = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__read)(ctor.toString().match(/constructor\(([\w, ]+)\)/) || [], 2), _b = _a[1], params = _b === void 0 ? null : _b;
    var dep = formatDependency(params, paramIdx);
    return composeErrorMessage("Cannot inject the dependency " + dep + " of \"" + ctor.name + "\" constructor. Reason:", error);
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/factories/index.js":
/*!************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/factories/index.js ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   instanceCachingFactory: function() { return /* reexport safe */ _instance_caching_factory__WEBPACK_IMPORTED_MODULE_0__["default"]; },
/* harmony export */   instancePerContainerCachingFactory: function() { return /* reexport safe */ _instance_per_container_caching_factory__WEBPACK_IMPORTED_MODULE_1__["default"]; },
/* harmony export */   predicateAwareClassFactory: function() { return /* reexport safe */ _predicate_aware_class_factory__WEBPACK_IMPORTED_MODULE_2__["default"]; }
/* harmony export */ });
/* harmony import */ var _instance_caching_factory__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./instance-caching-factory */ "./node_modules/tsyringe/dist/esm5/factories/instance-caching-factory.js");
/* harmony import */ var _instance_per_container_caching_factory__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./instance-per-container-caching-factory */ "./node_modules/tsyringe/dist/esm5/factories/instance-per-container-caching-factory.js");
/* harmony import */ var _predicate_aware_class_factory__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./predicate-aware-class-factory */ "./node_modules/tsyringe/dist/esm5/factories/predicate-aware-class-factory.js");





/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/factories/instance-caching-factory.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/factories/instance-caching-factory.js ***!
  \*******************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ instanceCachingFactory; }
/* harmony export */ });
function instanceCachingFactory(factoryFunc) {
    var instance;
    return function (dependencyContainer) {
        if (instance == undefined) {
            instance = factoryFunc(dependencyContainer);
        }
        return instance;
    };
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/factories/instance-per-container-caching-factory.js":
/*!*********************************************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/factories/instance-per-container-caching-factory.js ***!
  \*********************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ instancePerContainerCachingFactory; }
/* harmony export */ });
function instancePerContainerCachingFactory(factoryFunc) {
    var cache = new WeakMap();
    return function (dependencyContainer) {
        var instance = cache.get(dependencyContainer);
        if (instance == undefined) {
            instance = factoryFunc(dependencyContainer);
            cache.set(dependencyContainer, instance);
        }
        return instance;
    };
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/factories/predicate-aware-class-factory.js":
/*!************************************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/factories/predicate-aware-class-factory.js ***!
  \************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ predicateAwareClassFactory; }
/* harmony export */ });
function predicateAwareClassFactory(predicate, trueConstructor, falseConstructor, useCaching) {
    if (useCaching === void 0) { useCaching = true; }
    var instance;
    var previousPredicate;
    return function (dependencyContainer) {
        var currentPredicate = predicate(dependencyContainer);
        if (!useCaching || previousPredicate !== currentPredicate) {
            if ((previousPredicate = currentPredicate)) {
                instance = dependencyContainer.resolve(trueConstructor);
            }
            else {
                instance = dependencyContainer.resolve(falseConstructor);
            }
        }
        return instance;
    };
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/index.js":
/*!**************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/index.js ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Lifecycle: function() { return /* reexport safe */ _types__WEBPACK_IMPORTED_MODULE_0__.Lifecycle; },
/* harmony export */   autoInjectable: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.autoInjectable; },
/* harmony export */   container: function() { return /* reexport safe */ _dependency_container__WEBPACK_IMPORTED_MODULE_5__.instance; },
/* harmony export */   delay: function() { return /* reexport safe */ _lazy_helpers__WEBPACK_IMPORTED_MODULE_4__.delay; },
/* harmony export */   inject: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.inject; },
/* harmony export */   injectAll: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.injectAll; },
/* harmony export */   injectAllWithTransform: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.injectAllWithTransform; },
/* harmony export */   injectWithTransform: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.injectWithTransform; },
/* harmony export */   injectable: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.injectable; },
/* harmony export */   instanceCachingFactory: function() { return /* reexport safe */ _factories__WEBPACK_IMPORTED_MODULE_2__.instanceCachingFactory; },
/* harmony export */   instancePerContainerCachingFactory: function() { return /* reexport safe */ _factories__WEBPACK_IMPORTED_MODULE_2__.instancePerContainerCachingFactory; },
/* harmony export */   isClassProvider: function() { return /* reexport safe */ _providers__WEBPACK_IMPORTED_MODULE_3__.isClassProvider; },
/* harmony export */   isFactoryProvider: function() { return /* reexport safe */ _providers__WEBPACK_IMPORTED_MODULE_3__.isFactoryProvider; },
/* harmony export */   isNormalToken: function() { return /* reexport safe */ _providers__WEBPACK_IMPORTED_MODULE_3__.isNormalToken; },
/* harmony export */   isTokenProvider: function() { return /* reexport safe */ _providers__WEBPACK_IMPORTED_MODULE_3__.isTokenProvider; },
/* harmony export */   isValueProvider: function() { return /* reexport safe */ _providers__WEBPACK_IMPORTED_MODULE_3__.isValueProvider; },
/* harmony export */   predicateAwareClassFactory: function() { return /* reexport safe */ _factories__WEBPACK_IMPORTED_MODULE_2__.predicateAwareClassFactory; },
/* harmony export */   registry: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.registry; },
/* harmony export */   scoped: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.scoped; },
/* harmony export */   singleton: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.singleton; }
/* harmony export */ });
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./types */ "./node_modules/tsyringe/dist/esm5/types/index.js");
/* harmony import */ var _decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./decorators */ "./node_modules/tsyringe/dist/esm5/decorators/index.js");
/* harmony import */ var _factories__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./factories */ "./node_modules/tsyringe/dist/esm5/factories/index.js");
/* harmony import */ var _providers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./providers */ "./node_modules/tsyringe/dist/esm5/providers/index.js");
/* harmony import */ var _lazy_helpers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./lazy-helpers */ "./node_modules/tsyringe/dist/esm5/lazy-helpers.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");
if (typeof Reflect === "undefined" || !Reflect.getMetadata) {
    throw new Error("tsyringe requires a reflect polyfill. Please add 'import \"reflect-metadata\"' to the top of your entry point.");
}








/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/interceptors.js":
/*!*********************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/interceptors.js ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PostResolutionInterceptors: function() { return /* binding */ PostResolutionInterceptors; },
/* harmony export */   PreResolutionInterceptors: function() { return /* binding */ PreResolutionInterceptors; }
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _registry_base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./registry-base */ "./node_modules/tsyringe/dist/esm5/registry-base.js");


var PreResolutionInterceptors = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__extends)(PreResolutionInterceptors, _super);
    function PreResolutionInterceptors() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PreResolutionInterceptors;
}(_registry_base__WEBPACK_IMPORTED_MODULE_0__["default"]));

var PostResolutionInterceptors = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__extends)(PostResolutionInterceptors, _super);
    function PostResolutionInterceptors() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PostResolutionInterceptors;
}(_registry_base__WEBPACK_IMPORTED_MODULE_0__["default"]));

var Interceptors = (function () {
    function Interceptors() {
        this.preResolution = new PreResolutionInterceptors();
        this.postResolution = new PostResolutionInterceptors();
    }
    return Interceptors;
}());
/* harmony default export */ __webpack_exports__["default"] = (Interceptors);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/lazy-helpers.js":
/*!*********************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/lazy-helpers.js ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DelayedConstructor: function() { return /* binding */ DelayedConstructor; },
/* harmony export */   delay: function() { return /* binding */ delay; }
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");

var DelayedConstructor = (function () {
    function DelayedConstructor(wrap) {
        this.wrap = wrap;
        this.reflectMethods = [
            "get",
            "getPrototypeOf",
            "setPrototypeOf",
            "getOwnPropertyDescriptor",
            "defineProperty",
            "has",
            "set",
            "deleteProperty",
            "apply",
            "construct",
            "ownKeys"
        ];
    }
    DelayedConstructor.prototype.createProxy = function (createObject) {
        var _this = this;
        var target = {};
        var init = false;
        var value;
        var delayedObject = function () {
            if (!init) {
                value = createObject(_this.wrap());
                init = true;
            }
            return value;
        };
        return new Proxy(target, this.createHandler(delayedObject));
    };
    DelayedConstructor.prototype.createHandler = function (delayedObject) {
        var handler = {};
        var install = function (name) {
            handler[name] = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                args[0] = delayedObject();
                var method = Reflect[name];
                return method.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)(args));
            };
        };
        this.reflectMethods.forEach(install);
        return handler;
    };
    return DelayedConstructor;
}());

function delay(wrappedConstructor) {
    if (typeof wrappedConstructor === "undefined") {
        throw new Error("Attempt to `delay` undefined. Constructor must be wrapped in a callback");
    }
    return new DelayedConstructor(wrappedConstructor);
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/class-provider.js":
/*!*********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/class-provider.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isClassProvider: function() { return /* binding */ isClassProvider; }
/* harmony export */ });
function isClassProvider(provider) {
    return !!provider.useClass;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/factory-provider.js":
/*!***********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/factory-provider.js ***!
  \***********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isFactoryProvider: function() { return /* binding */ isFactoryProvider; }
/* harmony export */ });
function isFactoryProvider(provider) {
    return !!provider.useFactory;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/index.js":
/*!************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/index.js ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isClassProvider: function() { return /* reexport safe */ _class_provider__WEBPACK_IMPORTED_MODULE_0__.isClassProvider; },
/* harmony export */   isFactoryProvider: function() { return /* reexport safe */ _factory_provider__WEBPACK_IMPORTED_MODULE_1__.isFactoryProvider; },
/* harmony export */   isNormalToken: function() { return /* reexport safe */ _injection_token__WEBPACK_IMPORTED_MODULE_2__.isNormalToken; },
/* harmony export */   isTokenProvider: function() { return /* reexport safe */ _token_provider__WEBPACK_IMPORTED_MODULE_3__.isTokenProvider; },
/* harmony export */   isValueProvider: function() { return /* reexport safe */ _value_provider__WEBPACK_IMPORTED_MODULE_4__.isValueProvider; }
/* harmony export */ });
/* harmony import */ var _class_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./class-provider */ "./node_modules/tsyringe/dist/esm5/providers/class-provider.js");
/* harmony import */ var _factory_provider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./factory-provider */ "./node_modules/tsyringe/dist/esm5/providers/factory-provider.js");
/* harmony import */ var _injection_token__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./injection-token */ "./node_modules/tsyringe/dist/esm5/providers/injection-token.js");
/* harmony import */ var _token_provider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./token-provider */ "./node_modules/tsyringe/dist/esm5/providers/token-provider.js");
/* harmony import */ var _value_provider__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./value-provider */ "./node_modules/tsyringe/dist/esm5/providers/value-provider.js");







/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/injection-token.js":
/*!**********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/injection-token.js ***!
  \**********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isConstructorToken: function() { return /* binding */ isConstructorToken; },
/* harmony export */   isNormalToken: function() { return /* binding */ isNormalToken; },
/* harmony export */   isTokenDescriptor: function() { return /* binding */ isTokenDescriptor; },
/* harmony export */   isTransformDescriptor: function() { return /* binding */ isTransformDescriptor; }
/* harmony export */ });
/* harmony import */ var _lazy_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lazy-helpers */ "./node_modules/tsyringe/dist/esm5/lazy-helpers.js");

function isNormalToken(token) {
    return typeof token === "string" || typeof token === "symbol";
}
function isTokenDescriptor(descriptor) {
    return (typeof descriptor === "object" &&
        "token" in descriptor &&
        "multiple" in descriptor);
}
function isTransformDescriptor(descriptor) {
    return (typeof descriptor === "object" &&
        "token" in descriptor &&
        "transform" in descriptor);
}
function isConstructorToken(token) {
    return typeof token === "function" || token instanceof _lazy_helpers__WEBPACK_IMPORTED_MODULE_0__.DelayedConstructor;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/provider.js":
/*!***************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/provider.js ***!
  \***************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isProvider: function() { return /* binding */ isProvider; }
/* harmony export */ });
/* harmony import */ var _class_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./class-provider */ "./node_modules/tsyringe/dist/esm5/providers/class-provider.js");
/* harmony import */ var _value_provider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./value-provider */ "./node_modules/tsyringe/dist/esm5/providers/value-provider.js");
/* harmony import */ var _token_provider__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./token-provider */ "./node_modules/tsyringe/dist/esm5/providers/token-provider.js");
/* harmony import */ var _factory_provider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./factory-provider */ "./node_modules/tsyringe/dist/esm5/providers/factory-provider.js");




function isProvider(provider) {
    return ((0,_class_provider__WEBPACK_IMPORTED_MODULE_0__.isClassProvider)(provider) ||
        (0,_value_provider__WEBPACK_IMPORTED_MODULE_1__.isValueProvider)(provider) ||
        (0,_token_provider__WEBPACK_IMPORTED_MODULE_2__.isTokenProvider)(provider) ||
        (0,_factory_provider__WEBPACK_IMPORTED_MODULE_3__.isFactoryProvider)(provider));
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/token-provider.js":
/*!*********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/token-provider.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isTokenProvider: function() { return /* binding */ isTokenProvider; }
/* harmony export */ });
function isTokenProvider(provider) {
    return !!provider.useToken;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/value-provider.js":
/*!*********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/value-provider.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isValueProvider: function() { return /* binding */ isValueProvider; }
/* harmony export */ });
function isValueProvider(provider) {
    return provider.useValue != undefined;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js":
/*!***************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/reflection-helpers.js ***!
  \***************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   INJECTION_TOKEN_METADATA_KEY: function() { return /* binding */ INJECTION_TOKEN_METADATA_KEY; },
/* harmony export */   defineInjectionTokenMetadata: function() { return /* binding */ defineInjectionTokenMetadata; },
/* harmony export */   getParamInfo: function() { return /* binding */ getParamInfo; }
/* harmony export */ });
var INJECTION_TOKEN_METADATA_KEY = "injectionTokens";
function getParamInfo(target) {
    var params = Reflect.getMetadata("design:paramtypes", target) || [];
    var injectionTokens = Reflect.getOwnMetadata(INJECTION_TOKEN_METADATA_KEY, target) || {};
    Object.keys(injectionTokens).forEach(function (key) {
        params[+key] = injectionTokens[key];
    });
    return params;
}
function defineInjectionTokenMetadata(data, transform) {
    return function (target, _propertyKey, parameterIndex) {
        var descriptors = Reflect.getOwnMetadata(INJECTION_TOKEN_METADATA_KEY, target) || {};
        descriptors[parameterIndex] = transform
            ? {
                token: data,
                transform: transform.transformToken,
                transformArgs: transform.args || []
            }
            : data;
        Reflect.defineMetadata(INJECTION_TOKEN_METADATA_KEY, descriptors, target);
    };
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/registry-base.js":
/*!**********************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/registry-base.js ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var RegistryBase = (function () {
    function RegistryBase() {
        this._registryMap = new Map();
    }
    RegistryBase.prototype.entries = function () {
        return this._registryMap.entries();
    };
    RegistryBase.prototype.getAll = function (key) {
        this.ensure(key);
        return this._registryMap.get(key);
    };
    RegistryBase.prototype.get = function (key) {
        this.ensure(key);
        var value = this._registryMap.get(key);
        return value[value.length - 1] || null;
    };
    RegistryBase.prototype.set = function (key, value) {
        this.ensure(key);
        this._registryMap.get(key).push(value);
    };
    RegistryBase.prototype.setAll = function (key, value) {
        this._registryMap.set(key, value);
    };
    RegistryBase.prototype.has = function (key) {
        this.ensure(key);
        return this._registryMap.get(key).length > 0;
    };
    RegistryBase.prototype.clear = function () {
        this._registryMap.clear();
    };
    RegistryBase.prototype.ensure = function (key) {
        if (!this._registryMap.has(key)) {
            this._registryMap.set(key, []);
        }
    };
    return RegistryBase;
}());
/* harmony default export */ __webpack_exports__["default"] = (RegistryBase);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/registry.js":
/*!*****************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/registry.js ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _registry_base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./registry-base */ "./node_modules/tsyringe/dist/esm5/registry-base.js");


var Registry = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__extends)(Registry, _super);
    function Registry() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Registry;
}(_registry_base__WEBPACK_IMPORTED_MODULE_0__["default"]));
/* harmony default export */ __webpack_exports__["default"] = (Registry);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/resolution-context.js":
/*!***************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/resolution-context.js ***!
  \***************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var ResolutionContext = (function () {
    function ResolutionContext() {
        this.scopedResolutions = new Map();
    }
    return ResolutionContext;
}());
/* harmony default export */ __webpack_exports__["default"] = (ResolutionContext);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/types/disposable.js":
/*!*************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/types/disposable.js ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isDisposable: function() { return /* binding */ isDisposable; }
/* harmony export */ });
function isDisposable(value) {
    if (typeof value.dispose !== "function")
        return false;
    var disposeFun = value.dispose;
    if (disposeFun.length > 0) {
        return false;
    }
    return true;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/types/index.js":
/*!********************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/types/index.js ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Lifecycle: function() { return /* reexport safe */ _lifecycle__WEBPACK_IMPORTED_MODULE_0__["default"]; }
/* harmony export */ });
/* harmony import */ var _lifecycle__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lifecycle */ "./node_modules/tsyringe/dist/esm5/types/lifecycle.js");



/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/types/lifecycle.js":
/*!************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/types/lifecycle.js ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var Lifecycle;
(function (Lifecycle) {
    Lifecycle[Lifecycle["Transient"] = 0] = "Transient";
    Lifecycle[Lifecycle["Singleton"] = 1] = "Singleton";
    Lifecycle[Lifecycle["ResolutionScoped"] = 2] = "ResolutionScoped";
    Lifecycle[Lifecycle["ContainerScoped"] = 3] = "ContainerScoped";
})(Lifecycle || (Lifecycle = {}));
/* harmony default export */ __webpack_exports__["default"] = (Lifecycle);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	!function() {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	Main = __webpack_exports__.Main;
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRWE7O0FBRWI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1COztBQUVuQjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGtCQUFrQixzQkFBc0I7QUFDeEM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTtBQUNmOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0Esb0JBQW9CLFNBQVM7QUFDN0I7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQSxNQUFNO0FBQ047QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjs7QUFFQSxrQ0FBa0MsUUFBUTtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLGlCQUFpQjtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLFFBQVE7QUFDUjtB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdHQUF3RztBQUN4RztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUZBQWlGO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzRUFBc0U7QUFDdEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNFQUFzRTtBQUN0RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3RUFBd0U7QUFDeEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsUUFBUTtBQUN4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELFFBQVE7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsdUJBQXVCO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELDBCQUEwQjtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUM7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFnRCxhQUFhO1dBQzdEOzs7OztVRU5BO1VBQ0E7VUFDQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvcmVmbGVjdC1tZXRhZGF0YS9SZWZsZWN0LmpzIiwid2VicGFjazovL01haW4vLi9zcmMvY29uZmlnL2dhbWUtZGF0YS50cyIsIndlYnBhY2s6Ly9NYWluLy4vc3JjL2Vudmlyb25tZW50L2Vudmlyb25tZW50LnRzIiwid2VicGFjazovL01haW4vLi9zcmMvbWFpbi50cyIsIndlYnBhY2s6Ly9NYWluLy4vc3JjL3NlcnZpY2VzL2F1dGgtc2VydmljZS50cyIsIndlYnBhY2s6Ly9NYWluLy4vc3JjL3NlcnZpY2VzL2dhbWUtZGV0ZWN0aW9uLXNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vTWFpbi8uL3NyYy9zZXJ2aWNlcy9nZXAtY29uc3VtZXIudHMiLCJ3ZWJwYWNrOi8vTWFpbi8uL3NyYy9zZXJ2aWNlcy9nZXAtc2VydmljZS50cyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9kZWNvcmF0b3JzL2F1dG8taW5qZWN0YWJsZS5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9kZWNvcmF0b3JzL2luZGV4LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2RlY29yYXRvcnMvaW5qZWN0LWFsbC13aXRoLXRyYW5zZm9ybS5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9kZWNvcmF0b3JzL2luamVjdC1hbGwuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZGVjb3JhdG9ycy9pbmplY3Qtd2l0aC10cmFuc2Zvcm0uanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZGVjb3JhdG9ycy9pbmplY3QuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZGVjb3JhdG9ycy9pbmplY3RhYmxlLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2RlY29yYXRvcnMvcmVnaXN0cnkuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZGVjb3JhdG9ycy9zY29wZWQuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZGVjb3JhdG9ycy9zaW5nbGV0b24uanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZGVwZW5kZW5jeS1jb250YWluZXIuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZXJyb3ItaGVscGVycy5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9mYWN0b3JpZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZmFjdG9yaWVzL2luc3RhbmNlLWNhY2hpbmctZmFjdG9yeS5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9mYWN0b3JpZXMvaW5zdGFuY2UtcGVyLWNvbnRhaW5lci1jYWNoaW5nLWZhY3RvcnkuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZmFjdG9yaWVzL3ByZWRpY2F0ZS1hd2FyZS1jbGFzcy1mYWN0b3J5LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2luZGV4LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2ludGVyY2VwdG9ycy5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9sYXp5LWhlbHBlcnMuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvcHJvdmlkZXJzL2NsYXNzLXByb3ZpZGVyLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3Byb3ZpZGVycy9mYWN0b3J5LXByb3ZpZGVyLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3Byb3ZpZGVycy9pbmRleC5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9wcm92aWRlcnMvaW5qZWN0aW9uLXRva2VuLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3Byb3ZpZGVycy9wcm92aWRlci5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9wcm92aWRlcnMvdG9rZW4tcHJvdmlkZXIuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvcHJvdmlkZXJzL3ZhbHVlLXByb3ZpZGVyLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3JlZmxlY3Rpb24taGVscGVycy5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9yZWdpc3RyeS1iYXNlLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3JlZ2lzdHJ5LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3Jlc29sdXRpb24tY29udGV4dC5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS90eXBlcy9kaXNwb3NhYmxlLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3R5cGVzL2luZGV4LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3R5cGVzL2xpZmVjeWNsZS5qcyIsIndlYnBhY2s6Ly9NYWluL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL01haW4vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL01haW4vd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9NYWluL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vTWFpbi93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL01haW4vd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9NYWluL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9NYWluL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUiA9IHR5cGVvZiBSZWZsZWN0ID09PSAnb2JqZWN0JyA/IFJlZmxlY3QgOiBudWxsXG52YXIgUmVmbGVjdEFwcGx5ID0gUiAmJiB0eXBlb2YgUi5hcHBseSA9PT0gJ2Z1bmN0aW9uJ1xuICA/IFIuYXBwbHlcbiAgOiBmdW5jdGlvbiBSZWZsZWN0QXBwbHkodGFyZ2V0LCByZWNlaXZlciwgYXJncykge1xuICAgIHJldHVybiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbCh0YXJnZXQsIHJlY2VpdmVyLCBhcmdzKTtcbiAgfVxuXG52YXIgUmVmbGVjdE93bktleXNcbmlmIChSICYmIHR5cGVvZiBSLm93bktleXMgPT09ICdmdW5jdGlvbicpIHtcbiAgUmVmbGVjdE93bktleXMgPSBSLm93bktleXNcbn0gZWxzZSBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICBSZWZsZWN0T3duS2V5cyA9IGZ1bmN0aW9uIFJlZmxlY3RPd25LZXlzKHRhcmdldCkge1xuICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0YXJnZXQpXG4gICAgICAuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHModGFyZ2V0KSk7XG4gIH07XG59IGVsc2Uge1xuICBSZWZsZWN0T3duS2V5cyA9IGZ1bmN0aW9uIFJlZmxlY3RPd25LZXlzKHRhcmdldCkge1xuICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0YXJnZXQpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBQcm9jZXNzRW1pdFdhcm5pbmcod2FybmluZykge1xuICBpZiAoY29uc29sZSAmJiBjb25zb2xlLndhcm4pIGNvbnNvbGUud2Fybih3YXJuaW5nKTtcbn1cblxudmFyIE51bWJlcklzTmFOID0gTnVtYmVyLmlzTmFOIHx8IGZ1bmN0aW9uIE51bWJlcklzTmFOKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPT0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgRXZlbnRFbWl0dGVyLmluaXQuY2FsbCh0aGlzKTtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xubW9kdWxlLmV4cG9ydHMub25jZSA9IG9uY2U7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzQ291bnQgPSAwO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG5mdW5jdGlvbiBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKSB7XG4gIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBGdW5jdGlvbi4gUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIGxpc3RlbmVyKTtcbiAgfVxufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLCAnZGVmYXVsdE1heExpc3RlbmVycycsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZGVmYXVsdE1heExpc3RlbmVycztcbiAgfSxcbiAgc2V0OiBmdW5jdGlvbihhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ251bWJlcicgfHwgYXJnIDwgMCB8fCBOdW1iZXJJc05hTihhcmcpKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIG9mIFwiZGVmYXVsdE1heExpc3RlbmVyc1wiIGlzIG91dCBvZiByYW5nZS4gSXQgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIuIFJlY2VpdmVkICcgKyBhcmcgKyAnLicpO1xuICAgIH1cbiAgICBkZWZhdWx0TWF4TGlzdGVuZXJzID0gYXJnO1xuICB9XG59KTtcblxuRXZlbnRFbWl0dGVyLmluaXQgPSBmdW5jdGlvbigpIHtcblxuICBpZiAodGhpcy5fZXZlbnRzID09PSB1bmRlZmluZWQgfHxcbiAgICAgIHRoaXMuX2V2ZW50cyA9PT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpLl9ldmVudHMpIHtcbiAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59O1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMobikge1xuICBpZiAodHlwZW9mIG4gIT09ICdudW1iZXInIHx8IG4gPCAwIHx8IE51bWJlcklzTmFOKG4pKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBvZiBcIm5cIiBpcyBvdXQgb2YgcmFuZ2UuIEl0IG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyLiBSZWNlaXZlZCAnICsgbiArICcuJyk7XG4gIH1cbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBfZ2V0TWF4TGlzdGVuZXJzKHRoYXQpIHtcbiAgaWYgKHRoYXQuX21heExpc3RlbmVycyA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgcmV0dXJuIHRoYXQuX21heExpc3RlbmVycztcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5nZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBnZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiBfZ2V0TWF4TGlzdGVuZXJzKHRoaXMpO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdCh0eXBlKSB7XG4gIHZhciBhcmdzID0gW107XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTtcbiAgdmFyIGRvRXJyb3IgPSAodHlwZSA9PT0gJ2Vycm9yJyk7XG5cbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcbiAgaWYgKGV2ZW50cyAhPT0gdW5kZWZpbmVkKVxuICAgIGRvRXJyb3IgPSAoZG9FcnJvciAmJiBldmVudHMuZXJyb3IgPT09IHVuZGVmaW5lZCk7XG4gIGVsc2UgaWYgKCFkb0Vycm9yKVxuICAgIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmIChkb0Vycm9yKSB7XG4gICAgdmFyIGVyO1xuICAgIGlmIChhcmdzLmxlbmd0aCA+IDApXG4gICAgICBlciA9IGFyZ3NbMF07XG4gICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIC8vIE5vdGU6IFRoZSBjb21tZW50cyBvbiB0aGUgYHRocm93YCBsaW5lcyBhcmUgaW50ZW50aW9uYWwsIHRoZXkgc2hvd1xuICAgICAgLy8gdXAgaW4gTm9kZSdzIG91dHB1dCBpZiB0aGlzIHJlc3VsdHMgaW4gYW4gdW5oYW5kbGVkIGV4Y2VwdGlvbi5cbiAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgIH1cbiAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcignVW5oYW5kbGVkIGVycm9yLicgKyAoZXIgPyAnICgnICsgZXIubWVzc2FnZSArICcpJyA6ICcnKSk7XG4gICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICB0aHJvdyBlcnI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gIH1cblxuICB2YXIgaGFuZGxlciA9IGV2ZW50c1t0eXBlXTtcblxuICBpZiAoaGFuZGxlciA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICBSZWZsZWN0QXBwbHkoaGFuZGxlciwgdGhpcywgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIFJlZmxlY3RBcHBseShsaXN0ZW5lcnNbaV0sIHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiBfYWRkTGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgcHJlcGVuZCkge1xuICB2YXIgbTtcbiAgdmFyIGV2ZW50cztcbiAgdmFyIGV4aXN0aW5nO1xuXG4gIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuXG4gIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpIHtcbiAgICBldmVudHMgPSB0YXJnZXQuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGFyZ2V0Ll9ldmVudHNDb3VudCA9IDA7XG4gIH0gZWxzZSB7XG4gICAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gICAgaWYgKGV2ZW50cy5uZXdMaXN0ZW5lciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0YXJnZXQuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgPyBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICAgICAgLy8gUmUtYXNzaWduIGBldmVudHNgIGJlY2F1c2UgYSBuZXdMaXN0ZW5lciBoYW5kbGVyIGNvdWxkIGhhdmUgY2F1c2VkIHRoZVxuICAgICAgLy8gdGhpcy5fZXZlbnRzIHRvIGJlIGFzc2lnbmVkIHRvIGEgbmV3IG9iamVjdFxuICAgICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG4gICAgfVxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdO1xuICB9XG5cbiAgaWYgKGV4aXN0aW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICBleGlzdGluZyA9IGV2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICAgICsrdGFyZ2V0Ll9ldmVudHNDb3VudDtcbiAgfSBlbHNlIHtcbiAgICBpZiAodHlwZW9mIGV4aXN0aW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdID1cbiAgICAgICAgcHJlcGVuZCA/IFtsaXN0ZW5lciwgZXhpc3RpbmddIDogW2V4aXN0aW5nLCBsaXN0ZW5lcl07XG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgfSBlbHNlIGlmIChwcmVwZW5kKSB7XG4gICAgICBleGlzdGluZy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhpc3RpbmcucHVzaChsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBtID0gX2dldE1heExpc3RlbmVycyh0YXJnZXQpO1xuICAgIGlmIChtID4gMCAmJiBleGlzdGluZy5sZW5ndGggPiBtICYmICFleGlzdGluZy53YXJuZWQpIHtcbiAgICAgIGV4aXN0aW5nLndhcm5lZCA9IHRydWU7XG4gICAgICAvLyBObyBlcnJvciBjb2RlIGZvciB0aGlzIHNpbmNlIGl0IGlzIGEgV2FybmluZ1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4XG4gICAgICB2YXIgdyA9IG5ldyBFcnJvcignUG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSBsZWFrIGRldGVjdGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmcubGVuZ3RoICsgJyAnICsgU3RyaW5nKHR5cGUpICsgJyBsaXN0ZW5lcnMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdhZGRlZC4gVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdpbmNyZWFzZSBsaW1pdCcpO1xuICAgICAgdy5uYW1lID0gJ01heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZyc7XG4gICAgICB3LmVtaXR0ZXIgPSB0YXJnZXQ7XG4gICAgICB3LnR5cGUgPSB0eXBlO1xuICAgICAgdy5jb3VudCA9IGV4aXN0aW5nLmxlbmd0aDtcbiAgICAgIFByb2Nlc3NFbWl0V2FybmluZyh3KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgcmV0dXJuIF9hZGRMaXN0ZW5lcih0aGlzLCB0eXBlLCBsaXN0ZW5lciwgZmFsc2UpO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZExpc3RlbmVyID1cbiAgICBmdW5jdGlvbiBwcmVwZW5kTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIHJldHVybiBfYWRkTGlzdGVuZXIodGhpcywgdHlwZSwgbGlzdGVuZXIsIHRydWUpO1xuICAgIH07XG5cbmZ1bmN0aW9uIG9uY2VXcmFwcGVyKCkge1xuICBpZiAoIXRoaXMuZmlyZWQpIHtcbiAgICB0aGlzLnRhcmdldC5yZW1vdmVMaXN0ZW5lcih0aGlzLnR5cGUsIHRoaXMud3JhcEZuKTtcbiAgICB0aGlzLmZpcmVkID0gdHJ1ZTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyLmNhbGwodGhpcy50YXJnZXQpO1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVyLmFwcGx5KHRoaXMudGFyZ2V0LCBhcmd1bWVudHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9vbmNlV3JhcCh0YXJnZXQsIHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzdGF0ZSA9IHsgZmlyZWQ6IGZhbHNlLCB3cmFwRm46IHVuZGVmaW5lZCwgdGFyZ2V0OiB0YXJnZXQsIHR5cGU6IHR5cGUsIGxpc3RlbmVyOiBsaXN0ZW5lciB9O1xuICB2YXIgd3JhcHBlZCA9IG9uY2VXcmFwcGVyLmJpbmQoc3RhdGUpO1xuICB3cmFwcGVkLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHN0YXRlLndyYXBGbiA9IHdyYXBwZWQ7XG4gIHJldHVybiB3cmFwcGVkO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuICB0aGlzLm9uKHR5cGUsIF9vbmNlV3JhcCh0aGlzLCB0eXBlLCBsaXN0ZW5lcikpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZE9uY2VMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcHJlcGVuZE9uY2VMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgY2hlY2tMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICB0aGlzLnByZXBlbmRMaXN0ZW5lcih0eXBlLCBfb25jZVdyYXAodGhpcywgdHlwZSwgbGlzdGVuZXIpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbi8vIEVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZiBhbmQgb25seSBpZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID1cbiAgICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgdmFyIGxpc3QsIGV2ZW50cywgcG9zaXRpb24sIGksIG9yaWdpbmFsTGlzdGVuZXI7XG5cbiAgICAgIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICBsaXN0ID0gZXZlbnRzW3R5cGVdO1xuICAgICAgaWYgKGxpc3QgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fCBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMClcbiAgICAgICAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdC5saXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcG9zaXRpb24gPSAtMTtcblxuICAgICAgICBmb3IgKGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8IGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBvcmlnaW5hbExpc3RlbmVyID0gbGlzdFtpXS5saXN0ZW5lcjtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAwKVxuICAgICAgICAgIGxpc3Quc2hpZnQoKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgc3BsaWNlT25lKGxpc3QsIHBvc2l0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSlcbiAgICAgICAgICBldmVudHNbdHlwZV0gPSBsaXN0WzBdO1xuXG4gICAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgb3JpZ2luYWxMaXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuICAgIGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyh0eXBlKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzLCBldmVudHMsIGk7XG5cbiAgICAgIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcbiAgICAgIGlmIChldmVudHMgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50c1t0eXBlXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApXG4gICAgICAgICAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGRlbGV0ZSBldmVudHNbdHlwZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhldmVudHMpO1xuICAgICAgICB2YXIga2V5O1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICAgICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgbGlzdGVuZXJzID0gZXZlbnRzW3R5cGVdO1xuXG4gICAgICBpZiAodHlwZW9mIGxpc3RlbmVycyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gICAgICB9IGVsc2UgaWYgKGxpc3RlbmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIExJRk8gb3JkZXJcbiAgICAgICAgZm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbmZ1bmN0aW9uIF9saXN0ZW5lcnModGFyZ2V0LCB0eXBlLCB1bndyYXApIHtcbiAgdmFyIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuXG4gIGlmIChldmVudHMgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gW107XG5cbiAgdmFyIGV2bGlzdGVuZXIgPSBldmVudHNbdHlwZV07XG4gIGlmIChldmxpc3RlbmVyID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIFtdO1xuXG4gIGlmICh0eXBlb2YgZXZsaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gdW53cmFwID8gW2V2bGlzdGVuZXIubGlzdGVuZXIgfHwgZXZsaXN0ZW5lcl0gOiBbZXZsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHVud3JhcCA/XG4gICAgdW53cmFwTGlzdGVuZXJzKGV2bGlzdGVuZXIpIDogYXJyYXlDbG9uZShldmxpc3RlbmVyLCBldmxpc3RlbmVyLmxlbmd0aCk7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKHR5cGUpIHtcbiAgcmV0dXJuIF9saXN0ZW5lcnModGhpcywgdHlwZSwgdHJ1ZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJhd0xpc3RlbmVycyA9IGZ1bmN0aW9uIHJhd0xpc3RlbmVycyh0eXBlKSB7XG4gIHJldHVybiBfbGlzdGVuZXJzKHRoaXMsIHR5cGUsIGZhbHNlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICBpZiAodHlwZW9mIGVtaXR0ZXIubGlzdGVuZXJDb3VudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGxpc3RlbmVyQ291bnQuY2FsbChlbWl0dGVyLCB0eXBlKTtcbiAgfVxufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gbGlzdGVuZXJDb3VudDtcbmZ1bmN0aW9uIGxpc3RlbmVyQ291bnQodHlwZSkge1xuICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuXG4gIGlmIChldmVudHMgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhciBldmxpc3RlbmVyID0gZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKHR5cGVvZiBldmxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9IGVsc2UgaWYgKGV2bGlzdGVuZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAwO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICByZXR1cm4gdGhpcy5fZXZlbnRzQ291bnQgPiAwID8gUmVmbGVjdE93bktleXModGhpcy5fZXZlbnRzKSA6IFtdO1xufTtcblxuZnVuY3Rpb24gYXJyYXlDbG9uZShhcnIsIG4pIHtcbiAgdmFyIGNvcHkgPSBuZXcgQXJyYXkobik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKVxuICAgIGNvcHlbaV0gPSBhcnJbaV07XG4gIHJldHVybiBjb3B5O1xufVxuXG5mdW5jdGlvbiBzcGxpY2VPbmUobGlzdCwgaW5kZXgpIHtcbiAgZm9yICg7IGluZGV4ICsgMSA8IGxpc3QubGVuZ3RoOyBpbmRleCsrKVxuICAgIGxpc3RbaW5kZXhdID0gbGlzdFtpbmRleCArIDFdO1xuICBsaXN0LnBvcCgpO1xufVxuXG5mdW5jdGlvbiB1bndyYXBMaXN0ZW5lcnMoYXJyKSB7XG4gIHZhciByZXQgPSBuZXcgQXJyYXkoYXJyLmxlbmd0aCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcmV0Lmxlbmd0aDsgKytpKSB7XG4gICAgcmV0W2ldID0gYXJyW2ldLmxpc3RlbmVyIHx8IGFycltpXTtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBvbmNlKGVtaXR0ZXIsIG5hbWUpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICBmdW5jdGlvbiBlcnJvckxpc3RlbmVyKGVycikge1xuICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihuYW1lLCByZXNvbHZlcik7XG4gICAgICByZWplY3QoZXJyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlcigpIHtcbiAgICAgIGlmICh0eXBlb2YgZW1pdHRlci5yZW1vdmVMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIGVycm9yTGlzdGVuZXIpO1xuICAgICAgfVxuICAgICAgcmVzb2x2ZShbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgIH07XG5cbiAgICBldmVudFRhcmdldEFnbm9zdGljQWRkTGlzdGVuZXIoZW1pdHRlciwgbmFtZSwgcmVzb2x2ZXIsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICBpZiAobmFtZSAhPT0gJ2Vycm9yJykge1xuICAgICAgYWRkRXJyb3JIYW5kbGVySWZFdmVudEVtaXR0ZXIoZW1pdHRlciwgZXJyb3JMaXN0ZW5lciwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFkZEVycm9ySGFuZGxlcklmRXZlbnRFbWl0dGVyKGVtaXR0ZXIsIGhhbmRsZXIsIGZsYWdzKSB7XG4gIGlmICh0eXBlb2YgZW1pdHRlci5vbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGV2ZW50VGFyZ2V0QWdub3N0aWNBZGRMaXN0ZW5lcihlbWl0dGVyLCAnZXJyb3InLCBoYW5kbGVyLCBmbGFncyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXZlbnRUYXJnZXRBZ25vc3RpY0FkZExpc3RlbmVyKGVtaXR0ZXIsIG5hbWUsIGxpc3RlbmVyLCBmbGFncykge1xuICBpZiAodHlwZW9mIGVtaXR0ZXIub24gPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAoZmxhZ3Mub25jZSkge1xuICAgICAgZW1pdHRlci5vbmNlKG5hbWUsIGxpc3RlbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZW1pdHRlci5vbihuYW1lLCBsaXN0ZW5lcik7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBlbWl0dGVyLmFkZEV2ZW50TGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBFdmVudFRhcmdldCBkb2VzIG5vdCBoYXZlIGBlcnJvcmAgZXZlbnQgc2VtYW50aWNzIGxpa2UgTm9kZVxuICAgIC8vIEV2ZW50RW1pdHRlcnMsIHdlIGRvIG5vdCBsaXN0ZW4gZm9yIGBlcnJvcmAgZXZlbnRzIGhlcmUuXG4gICAgZW1pdHRlci5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lcihhcmcpIHtcbiAgICAgIC8vIElFIGRvZXMgbm90IGhhdmUgYnVpbHRpbiBgeyBvbmNlOiB0cnVlIH1gIHN1cHBvcnQgc28gd2VcbiAgICAgIC8vIGhhdmUgdG8gZG8gaXQgbWFudWFsbHkuXG4gICAgICBpZiAoZmxhZ3Mub25jZSkge1xuICAgICAgICBlbWl0dGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgd3JhcExpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIGxpc3RlbmVyKGFyZyk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiZW1pdHRlclwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBFdmVudEVtaXR0ZXIuIFJlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBlbWl0dGVyKTtcbiAgfVxufVxuIiwiLyohICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5Db3B5cmlnaHQgKEMpIE1pY3Jvc29mdC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxudGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbkxpY2Vuc2UgYXQgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblRISVMgQ09ERSBJUyBQUk9WSURFRCBPTiBBTiAqQVMgSVMqIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbktJTkQsIEVJVEhFUiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBXSVRIT1VUIExJTUlUQVRJT04gQU5ZIElNUExJRURcbldBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBUSVRMRSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UsXG5NRVJDSEFOVEFCTElUWSBPUiBOT04tSU5GUklOR0VNRU5ULlxuXG5TZWUgdGhlIEFwYWNoZSBWZXJzaW9uIDIuMCBMaWNlbnNlIGZvciBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnNcbmFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXG52YXIgUmVmbGVjdDtcbihmdW5jdGlvbiAoUmVmbGVjdCkge1xuICAgIC8vIE1ldGFkYXRhIFByb3Bvc2FsXG4gICAgLy8gaHR0cHM6Ly9yYnVja3Rvbi5naXRodWIuaW8vcmVmbGVjdC1tZXRhZGF0YS9cbiAgICAoZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICAgICAgdmFyIHJvb3QgPSB0eXBlb2YgZ2xvYmFsID09PSBcIm9iamVjdFwiID8gZ2xvYmFsIDpcbiAgICAgICAgICAgIHR5cGVvZiBzZWxmID09PSBcIm9iamVjdFwiID8gc2VsZiA6XG4gICAgICAgICAgICAgICAgdHlwZW9mIHRoaXMgPT09IFwib2JqZWN0XCIgPyB0aGlzIDpcbiAgICAgICAgICAgICAgICAgICAgRnVuY3Rpb24oXCJyZXR1cm4gdGhpcztcIikoKTtcbiAgICAgICAgdmFyIGV4cG9ydGVyID0gbWFrZUV4cG9ydGVyKFJlZmxlY3QpO1xuICAgICAgICBpZiAodHlwZW9mIHJvb3QuUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgcm9vdC5SZWZsZWN0ID0gUmVmbGVjdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydGVyID0gbWFrZUV4cG9ydGVyKHJvb3QuUmVmbGVjdCwgZXhwb3J0ZXIpO1xuICAgICAgICB9XG4gICAgICAgIGZhY3RvcnkoZXhwb3J0ZXIpO1xuICAgICAgICBmdW5jdGlvbiBtYWtlRXhwb3J0ZXIodGFyZ2V0LCBwcmV2aW91cykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXRba2V5XSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgeyBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91cylcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXMoa2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSkoZnVuY3Rpb24gKGV4cG9ydGVyKSB7XG4gICAgICAgIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICAgICAgICAvLyBmZWF0dXJlIHRlc3QgZm9yIFN5bWJvbCBzdXBwb3J0XG4gICAgICAgIHZhciBzdXBwb3J0c1N5bWJvbCA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIjtcbiAgICAgICAgdmFyIHRvUHJpbWl0aXZlU3ltYm9sID0gc3VwcG9ydHNTeW1ib2wgJiYgdHlwZW9mIFN5bWJvbC50b1ByaW1pdGl2ZSAhPT0gXCJ1bmRlZmluZWRcIiA/IFN5bWJvbC50b1ByaW1pdGl2ZSA6IFwiQEB0b1ByaW1pdGl2ZVwiO1xuICAgICAgICB2YXIgaXRlcmF0b3JTeW1ib2wgPSBzdXBwb3J0c1N5bWJvbCAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yICE9PSBcInVuZGVmaW5lZFwiID8gU3ltYm9sLml0ZXJhdG9yIDogXCJAQGl0ZXJhdG9yXCI7XG4gICAgICAgIHZhciBzdXBwb3J0c0NyZWF0ZSA9IHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSBcImZ1bmN0aW9uXCI7IC8vIGZlYXR1cmUgdGVzdCBmb3IgT2JqZWN0LmNyZWF0ZSBzdXBwb3J0XG4gICAgICAgIHZhciBzdXBwb3J0c1Byb3RvID0geyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheTsgLy8gZmVhdHVyZSB0ZXN0IGZvciBfX3Byb3RvX18gc3VwcG9ydFxuICAgICAgICB2YXIgZG93bkxldmVsID0gIXN1cHBvcnRzQ3JlYXRlICYmICFzdXBwb3J0c1Byb3RvO1xuICAgICAgICB2YXIgSGFzaE1hcCA9IHtcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhbiBvYmplY3QgaW4gZGljdGlvbmFyeSBtb2RlIChhLmsuYS4gXCJzbG93XCIgbW9kZSBpbiB2OClcbiAgICAgICAgICAgIGNyZWF0ZTogc3VwcG9ydHNDcmVhdGVcbiAgICAgICAgICAgICAgICA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIE1ha2VEaWN0aW9uYXJ5KE9iamVjdC5jcmVhdGUobnVsbCkpOyB9XG4gICAgICAgICAgICAgICAgOiBzdXBwb3J0c1Byb3RvXG4gICAgICAgICAgICAgICAgICAgID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gTWFrZURpY3Rpb25hcnkoeyBfX3Byb3RvX186IG51bGwgfSk7IH1cbiAgICAgICAgICAgICAgICAgICAgOiBmdW5jdGlvbiAoKSB7IHJldHVybiBNYWtlRGljdGlvbmFyeSh7fSk7IH0sXG4gICAgICAgICAgICBoYXM6IGRvd25MZXZlbFxuICAgICAgICAgICAgICAgID8gZnVuY3Rpb24gKG1hcCwga2V5KSB7IHJldHVybiBoYXNPd24uY2FsbChtYXAsIGtleSk7IH1cbiAgICAgICAgICAgICAgICA6IGZ1bmN0aW9uIChtYXAsIGtleSkgeyByZXR1cm4ga2V5IGluIG1hcDsgfSxcbiAgICAgICAgICAgIGdldDogZG93bkxldmVsXG4gICAgICAgICAgICAgICAgPyBmdW5jdGlvbiAobWFwLCBrZXkpIHsgcmV0dXJuIGhhc093bi5jYWxsKG1hcCwga2V5KSA/IG1hcFtrZXldIDogdW5kZWZpbmVkOyB9XG4gICAgICAgICAgICAgICAgOiBmdW5jdGlvbiAobWFwLCBrZXkpIHsgcmV0dXJuIG1hcFtrZXldOyB9LFxuICAgICAgICB9O1xuICAgICAgICAvLyBMb2FkIGdsb2JhbCBvciBzaGltIHZlcnNpb25zIG9mIE1hcCwgU2V0LCBhbmQgV2Vha01hcFxuICAgICAgICB2YXIgZnVuY3Rpb25Qcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoRnVuY3Rpb24pO1xuICAgICAgICB2YXIgdXNlUG9seWZpbGwgPSB0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzLmVudiAmJiBwcm9jZXNzLmVudltcIlJFRkxFQ1RfTUVUQURBVEFfVVNFX01BUF9QT0xZRklMTFwiXSA9PT0gXCJ0cnVlXCI7XG4gICAgICAgIHZhciBfTWFwID0gIXVzZVBvbHlmaWxsICYmIHR5cGVvZiBNYXAgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgTWFwLnByb3RvdHlwZS5lbnRyaWVzID09PSBcImZ1bmN0aW9uXCIgPyBNYXAgOiBDcmVhdGVNYXBQb2x5ZmlsbCgpO1xuICAgICAgICB2YXIgX1NldCA9ICF1c2VQb2x5ZmlsbCAmJiB0eXBlb2YgU2V0ID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFNldC5wcm90b3R5cGUuZW50cmllcyA9PT0gXCJmdW5jdGlvblwiID8gU2V0IDogQ3JlYXRlU2V0UG9seWZpbGwoKTtcbiAgICAgICAgdmFyIF9XZWFrTWFwID0gIXVzZVBvbHlmaWxsICYmIHR5cGVvZiBXZWFrTWFwID09PSBcImZ1bmN0aW9uXCIgPyBXZWFrTWFwIDogQ3JlYXRlV2Vha01hcFBvbHlmaWxsKCk7XG4gICAgICAgIC8vIFtbTWV0YWRhdGFdXSBpbnRlcm5hbCBzbG90XG4gICAgICAgIC8vIGh0dHBzOi8vcmJ1Y2t0b24uZ2l0aHViLmlvL3JlZmxlY3QtbWV0YWRhdGEvI29yZGluYXJ5LW9iamVjdC1pbnRlcm5hbC1tZXRob2RzLWFuZC1pbnRlcm5hbC1zbG90c1xuICAgICAgICB2YXIgTWV0YWRhdGEgPSBuZXcgX1dlYWtNYXAoKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFwcGxpZXMgYSBzZXQgb2YgZGVjb3JhdG9ycyB0byBhIHByb3BlcnR5IG9mIGEgdGFyZ2V0IG9iamVjdC5cbiAgICAgICAgICogQHBhcmFtIGRlY29yYXRvcnMgQW4gYXJyYXkgb2YgZGVjb3JhdG9ycy5cbiAgICAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdC5cbiAgICAgICAgICogQHBhcmFtIHByb3BlcnR5S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSB0byBkZWNvcmF0ZS5cbiAgICAgICAgICogQHBhcmFtIGF0dHJpYnV0ZXMgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkgZGVzY3JpcHRvciBmb3IgdGhlIHRhcmdldCBrZXkuXG4gICAgICAgICAqIEByZW1hcmtzIERlY29yYXRvcnMgYXJlIGFwcGxpZWQgaW4gcmV2ZXJzZSBvcmRlci5cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcbiAgICAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxuICAgICAgICAgKiAgICAgRXhhbXBsZSA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9yc0FycmF5LCBFeGFtcGxlKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9yc0FycmF5LCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9yc0FycmF5LCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIixcbiAgICAgICAgICogICAgICAgICBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnNBcnJheSwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIixcbiAgICAgICAgICogICAgICAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKSkpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIsXG4gICAgICAgICAqICAgICAgICAgUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzQXJyYXksIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiLFxuICAgICAgICAgKiAgICAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKSkpO1xuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBwcm9wZXJ0eUtleSwgYXR0cmlidXRlcykge1xuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChwcm9wZXJ0eUtleSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIUlzQXJyYXkoZGVjb3JhdG9ycykpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KGF0dHJpYnV0ZXMpICYmICFJc1VuZGVmaW5lZChhdHRyaWJ1dGVzKSAmJiAhSXNOdWxsKGF0dHJpYnV0ZXMpKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgaWYgKElzTnVsbChhdHRyaWJ1dGVzKSlcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eUtleSA9IFRvUHJvcGVydHlLZXkocHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBEZWNvcmF0ZVByb3BlcnR5KGRlY29yYXRvcnMsIHRhcmdldCwgcHJvcGVydHlLZXksIGF0dHJpYnV0ZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFJc0FycmF5KGRlY29yYXRvcnMpKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFJc0NvbnN0cnVjdG9yKHRhcmdldCkpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gRGVjb3JhdGVDb25zdHJ1Y3RvcihkZWNvcmF0b3JzLCB0YXJnZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVyKFwiZGVjb3JhdGVcIiwgZGVjb3JhdGUpO1xuICAgICAgICAvLyA0LjEuMiBSZWZsZWN0Lm1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKVxuICAgICAgICAvLyBodHRwczovL3JidWNrdG9uLmdpdGh1Yi5pby9yZWZsZWN0LW1ldGFkYXRhLyNyZWZsZWN0Lm1ldGFkYXRhXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIGRlZmF1bHQgbWV0YWRhdGEgZGVjb3JhdG9yIGZhY3RvcnkgdGhhdCBjYW4gYmUgdXNlZCBvbiBhIGNsYXNzLCBjbGFzcyBtZW1iZXIsIG9yIHBhcmFtZXRlci5cbiAgICAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IFRoZSBrZXkgZm9yIHRoZSBtZXRhZGF0YSBlbnRyeS5cbiAgICAgICAgICogQHBhcmFtIG1ldGFkYXRhVmFsdWUgVGhlIHZhbHVlIGZvciB0aGUgbWV0YWRhdGEgZW50cnkuXG4gICAgICAgICAqIEByZXR1cm5zIEEgZGVjb3JhdG9yIGZ1bmN0aW9uLlxuICAgICAgICAgKiBAcmVtYXJrc1xuICAgICAgICAgKiBJZiBgbWV0YWRhdGFLZXlgIGlzIGFscmVhZHkgZGVmaW5lZCBmb3IgdGhlIHRhcmdldCBhbmQgdGFyZ2V0IGtleSwgdGhlXG4gICAgICAgICAqIG1ldGFkYXRhVmFsdWUgZm9yIHRoYXQga2V5IHdpbGwgYmUgb3ZlcndyaXR0ZW4uXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxuICAgICAgICAgKiAgICAgQFJlZmxlY3QubWV0YWRhdGEoa2V5LCB2YWx1ZSlcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yLCBUeXBlU2NyaXB0IG9ubHkpXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICBAUmVmbGVjdC5tZXRhZGF0YShrZXksIHZhbHVlKVxuICAgICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUsIFR5cGVTY3JpcHQgb25seSlcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIEBSZWZsZWN0Lm1ldGFkYXRhKGtleSwgdmFsdWUpXG4gICAgICAgICAqICAgICAgICAgcHJvcGVydHk7XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgQFJlZmxlY3QubWV0YWRhdGEoa2V5LCB2YWx1ZSlcbiAgICAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKCkgeyB9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIEBSZWZsZWN0Lm1ldGFkYXRhKGtleSwgdmFsdWUpXG4gICAgICAgICAqICAgICAgICAgbWV0aG9kKCkgeyB9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBtZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xuICAgICAgICAgICAgZnVuY3Rpb24gZGVjb3JhdG9yKHRhcmdldCwgcHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHByb3BlcnR5S2V5KSAmJiAhSXNQcm9wZXJ0eUtleShwcm9wZXJ0eUtleSkpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICBPcmRpbmFyeURlZmluZU93bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZWNvcmF0b3I7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZXIoXCJtZXRhZGF0YVwiLCBtZXRhZGF0YSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZpbmUgYSB1bmlxdWUgbWV0YWRhdGEgZW50cnkgb24gdGhlIHRhcmdldC5cbiAgICAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxuICAgICAgICAgKiBAcGFyYW0gbWV0YWRhdGFWYWx1ZSBBIHZhbHVlIHRoYXQgY29udGFpbnMgYXR0YWNoZWQgbWV0YWRhdGEuXG4gICAgICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdG8gZGVmaW5lIG1ldGFkYXRhLlxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxuICAgICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cbiAgICAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXG4gICAgICAgICAqICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgRXhhbXBsZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gZGVjb3JhdG9yIGZhY3RvcnkgYXMgbWV0YWRhdGEtcHJvZHVjaW5nIGFubm90YXRpb24uXG4gICAgICAgICAqICAgICBmdW5jdGlvbiBNeUFubm90YXRpb24ob3B0aW9ucyk6IERlY29yYXRvciB7XG4gICAgICAgICAqICAgICAgICAgcmV0dXJuICh0YXJnZXQsIGtleT8pID0+IFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCB0YXJnZXQsIGtleSk7XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBkZWZpbmVNZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQocHJvcGVydHlLZXkpKVxuICAgICAgICAgICAgICAgIHByb3BlcnR5S2V5ID0gVG9Qcm9wZXJ0eUtleShwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlEZWZpbmVPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZXIoXCJkZWZpbmVNZXRhZGF0YVwiLCBkZWZpbmVNZXRhZGF0YSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIGEgdmFsdWUgaW5kaWNhdGluZyB3aGV0aGVyIHRoZSB0YXJnZXQgb2JqZWN0IG9yIGl0cyBwcm90b3R5cGUgY2hhaW4gaGFzIHRoZSBwcm92aWRlZCBtZXRhZGF0YSBrZXkgZGVmaW5lZC5cbiAgICAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxuICAgICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxuICAgICAgICAgKiBAcmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG1ldGFkYXRhIGtleSB3YXMgZGVmaW5lZCBvbiB0aGUgdGFyZ2V0IG9iamVjdCBvciBpdHMgcHJvdG90eXBlIGNoYWluOyBvdGhlcndpc2UsIGBmYWxzZWAuXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XG4gICAgICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc01ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBoYXNNZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQocHJvcGVydHlLZXkpKVxuICAgICAgICAgICAgICAgIHByb3BlcnR5S2V5ID0gVG9Qcm9wZXJ0eUtleShwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlIYXNNZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZXIoXCJoYXNNZXRhZGF0YVwiLCBoYXNNZXRhZGF0YSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIGEgdmFsdWUgaW5kaWNhdGluZyB3aGV0aGVyIHRoZSB0YXJnZXQgb2JqZWN0IGhhcyB0aGUgcHJvdmlkZWQgbWV0YWRhdGEga2V5IGRlZmluZWQuXG4gICAgICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cbiAgICAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cbiAgICAgICAgICogQHBhcmFtIHByb3BlcnR5S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cbiAgICAgICAgICogQHJldHVybnMgYHRydWVgIGlmIHRoZSBtZXRhZGF0YSBrZXkgd2FzIGRlZmluZWQgb24gdGhlIHRhcmdldCBvYmplY3Q7IG90aGVyd2lzZSwgYGZhbHNlYC5cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcbiAgICAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzT3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGhhc093bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChwcm9wZXJ0eUtleSkpXG4gICAgICAgICAgICAgICAgcHJvcGVydHlLZXkgPSBUb1Byb3BlcnR5S2V5KHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeUhhc093bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlcihcImhhc093bk1ldGFkYXRhXCIsIGhhc093bk1ldGFkYXRhKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldHMgdGhlIG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgcHJvdmlkZWQgbWV0YWRhdGEga2V5IG9uIHRoZSB0YXJnZXQgb2JqZWN0IG9yIGl0cyBwcm90b3R5cGUgY2hhaW4uXG4gICAgICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cbiAgICAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cbiAgICAgICAgICogQHBhcmFtIHByb3BlcnR5S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cbiAgICAgICAgICogQHJldHVybnMgVGhlIG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgbWV0YWRhdGEga2V5IGlmIGZvdW5kOyBvdGhlcndpc2UsIGB1bmRlZmluZWRgLlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxuICAgICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cbiAgICAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0TWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHByb3BlcnR5S2V5KSlcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eUtleSA9IFRvUHJvcGVydHlLZXkocHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5R2V0TWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVyKFwiZ2V0TWV0YWRhdGFcIiwgZ2V0TWV0YWRhdGEpO1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyB0aGUgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBwcm92aWRlZCBtZXRhZGF0YSBrZXkgb24gdGhlIHRhcmdldCBvYmplY3QuXG4gICAgICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cbiAgICAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cbiAgICAgICAgICogQHBhcmFtIHByb3BlcnR5S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cbiAgICAgICAgICogQHJldHVybnMgVGhlIG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgbWV0YWRhdGEga2V5IGlmIGZvdW5kOyBvdGhlcndpc2UsIGB1bmRlZmluZWRgLlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxuICAgICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cbiAgICAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0T3duTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHByb3BlcnR5S2V5KSlcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eUtleSA9IFRvUHJvcGVydHlLZXkocHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5R2V0T3duTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVyKFwiZ2V0T3duTWV0YWRhdGFcIiwgZ2V0T3duTWV0YWRhdGEpO1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyB0aGUgbWV0YWRhdGEga2V5cyBkZWZpbmVkIG9uIHRoZSB0YXJnZXQgb2JqZWN0IG9yIGl0cyBwcm90b3R5cGUgY2hhaW4uXG4gICAgICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXG4gICAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXG4gICAgICAgICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIHVuaXF1ZSBtZXRhZGF0YSBrZXlzLlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxuICAgICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cbiAgICAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhS2V5cyhFeGFtcGxlKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGFLZXlzKEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YUtleXMoRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YUtleXMoRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGFLZXlzKEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldE1ldGFkYXRhS2V5cyh0YXJnZXQsIHByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChwcm9wZXJ0eUtleSkpXG4gICAgICAgICAgICAgICAgcHJvcGVydHlLZXkgPSBUb1Byb3BlcnR5S2V5KHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeU1ldGFkYXRhS2V5cyh0YXJnZXQsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlcihcImdldE1ldGFkYXRhS2V5c1wiLCBnZXRNZXRhZGF0YUtleXMpO1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyB0aGUgdW5pcXVlIG1ldGFkYXRhIGtleXMgZGVmaW5lZCBvbiB0aGUgdGFyZ2V0IG9iamVjdC5cbiAgICAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cbiAgICAgICAgICogQHBhcmFtIHByb3BlcnR5S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cbiAgICAgICAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgdW5pcXVlIG1ldGFkYXRhIGtleXMuXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XG4gICAgICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGFLZXlzKEV4YW1wbGUpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YUtleXMoRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhS2V5cyhFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhS2V5cyhFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YUtleXMoRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0T3duTWV0YWRhdGFLZXlzKHRhcmdldCwgcHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHByb3BlcnR5S2V5KSlcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eUtleSA9IFRvUHJvcGVydHlLZXkocHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5T3duTWV0YWRhdGFLZXlzKHRhcmdldCwgcHJvcGVydHlLZXkpO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVyKFwiZ2V0T3duTWV0YWRhdGFLZXlzXCIsIGdldE93bk1ldGFkYXRhS2V5cyk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWxldGVzIHRoZSBtZXRhZGF0YSBlbnRyeSBmcm9tIHRoZSB0YXJnZXQgb2JqZWN0IHdpdGggdGhlIHByb3ZpZGVkIGtleS5cbiAgICAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxuICAgICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxuICAgICAgICAgKiBAcmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG1ldGFkYXRhIGVudHJ5IHdhcyBmb3VuZCBhbmQgZGVsZXRlZDsgb3RoZXJ3aXNlLCBmYWxzZS5cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcbiAgICAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5kZWxldGVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5kZWxldGVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5kZWxldGVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZGVsZXRlTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5kZWxldGVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGRlbGV0ZU1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChwcm9wZXJ0eUtleSkpXG4gICAgICAgICAgICAgICAgcHJvcGVydHlLZXkgPSBUb1Byb3BlcnR5S2V5KHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAodGFyZ2V0LCBwcm9wZXJ0eUtleSwgLypDcmVhdGUqLyBmYWxzZSk7XG4gICAgICAgICAgICBpZiAoSXNVbmRlZmluZWQobWV0YWRhdGFNYXApKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICghbWV0YWRhdGFNYXAuZGVsZXRlKG1ldGFkYXRhS2V5KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAobWV0YWRhdGFNYXAuc2l6ZSA+IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0TWV0YWRhdGEgPSBNZXRhZGF0YS5nZXQodGFyZ2V0KTtcbiAgICAgICAgICAgIHRhcmdldE1ldGFkYXRhLmRlbGV0ZShwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICBpZiAodGFyZ2V0TWV0YWRhdGEuc2l6ZSA+IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBNZXRhZGF0YS5kZWxldGUodGFyZ2V0KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVyKFwiZGVsZXRlTWV0YWRhdGFcIiwgZGVsZXRlTWV0YWRhdGEpO1xuICAgICAgICBmdW5jdGlvbiBEZWNvcmF0ZUNvbnN0cnVjdG9yKGRlY29yYXRvcnMsIHRhcmdldCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVjb3JhdG9yID0gZGVjb3JhdG9yc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgZGVjb3JhdGVkID0gZGVjb3JhdG9yKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChkZWNvcmF0ZWQpICYmICFJc051bGwoZGVjb3JhdGVkKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUlzQ29uc3RydWN0b3IoZGVjb3JhdGVkKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gZGVjb3JhdGVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gRGVjb3JhdGVQcm9wZXJ0eShkZWNvcmF0b3JzLCB0YXJnZXQsIHByb3BlcnR5S2V5LCBkZXNjcmlwdG9yKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWNvcmF0b3IgPSBkZWNvcmF0b3JzW2ldO1xuICAgICAgICAgICAgICAgIHZhciBkZWNvcmF0ZWQgPSBkZWNvcmF0b3IodGFyZ2V0LCBwcm9wZXJ0eUtleSwgZGVzY3JpcHRvcik7XG4gICAgICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChkZWNvcmF0ZWQpICYmICFJc051bGwoZGVjb3JhdGVkKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KGRlY29yYXRlZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0b3IgPSBkZWNvcmF0ZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRlc2NyaXB0b3I7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcChPLCBQLCBDcmVhdGUpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXRNZXRhZGF0YSA9IE1ldGFkYXRhLmdldChPKTtcbiAgICAgICAgICAgIGlmIChJc1VuZGVmaW5lZCh0YXJnZXRNZXRhZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIUNyZWF0ZSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0YXJnZXRNZXRhZGF0YSA9IG5ldyBfTWFwKCk7XG4gICAgICAgICAgICAgICAgTWV0YWRhdGEuc2V0KE8sIHRhcmdldE1ldGFkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IHRhcmdldE1ldGFkYXRhLmdldChQKTtcbiAgICAgICAgICAgIGlmIChJc1VuZGVmaW5lZChtZXRhZGF0YU1hcCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIUNyZWF0ZSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBtZXRhZGF0YU1hcCA9IG5ldyBfTWFwKCk7XG4gICAgICAgICAgICAgICAgdGFyZ2V0TWV0YWRhdGEuc2V0KFAsIG1ldGFkYXRhTWFwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtZXRhZGF0YU1hcDtcbiAgICAgICAgfVxuICAgICAgICAvLyAzLjEuMS4xIE9yZGluYXJ5SGFzTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApXG4gICAgICAgIC8vIGh0dHBzOi8vcmJ1Y2t0b24uZ2l0aHViLmlvL3JlZmxlY3QtbWV0YWRhdGEvI29yZGluYXJ5aGFzbWV0YWRhdGFcbiAgICAgICAgZnVuY3Rpb24gT3JkaW5hcnlIYXNNZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCkge1xuICAgICAgICAgICAgdmFyIGhhc093biA9IE9yZGluYXJ5SGFzT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApO1xuICAgICAgICAgICAgaWYgKGhhc093bilcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBPcmRpbmFyeUdldFByb3RvdHlwZU9mKE8pO1xuICAgICAgICAgICAgaWYgKCFJc051bGwocGFyZW50KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlIYXNNZXRhZGF0YShNZXRhZGF0YUtleSwgcGFyZW50LCBQKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyAzLjEuMi4xIE9yZGluYXJ5SGFzT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApXG4gICAgICAgIC8vIGh0dHBzOi8vcmJ1Y2t0b24uZ2l0aHViLmlvL3JlZmxlY3QtbWV0YWRhdGEvI29yZGluYXJ5aGFzb3dubWV0YWRhdGFcbiAgICAgICAgZnVuY3Rpb24gT3JkaW5hcnlIYXNPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCkge1xuICAgICAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcChPLCBQLCAvKkNyZWF0ZSovIGZhbHNlKTtcbiAgICAgICAgICAgIGlmIChJc1VuZGVmaW5lZChtZXRhZGF0YU1hcCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIFRvQm9vbGVhbihtZXRhZGF0YU1hcC5oYXMoTWV0YWRhdGFLZXkpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyAzLjEuMy4xIE9yZGluYXJ5R2V0TWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApXG4gICAgICAgIC8vIGh0dHBzOi8vcmJ1Y2t0b24uZ2l0aHViLmlvL3JlZmxlY3QtbWV0YWRhdGEvI29yZGluYXJ5Z2V0bWV0YWRhdGFcbiAgICAgICAgZnVuY3Rpb24gT3JkaW5hcnlHZXRNZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCkge1xuICAgICAgICAgICAgdmFyIGhhc093biA9IE9yZGluYXJ5SGFzT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApO1xuICAgICAgICAgICAgaWYgKGhhc093bilcbiAgICAgICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlHZXRPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCk7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gT3JkaW5hcnlHZXRQcm90b3R5cGVPZihPKTtcbiAgICAgICAgICAgIGlmICghSXNOdWxsKHBhcmVudCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5R2V0TWV0YWRhdGEoTWV0YWRhdGFLZXksIHBhcmVudCwgUCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIC8vIDMuMS40LjEgT3JkaW5hcnlHZXRPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUClcbiAgICAgICAgLy8gaHR0cHM6Ly9yYnVja3Rvbi5naXRodWIuaW8vcmVmbGVjdC1tZXRhZGF0YS8jb3JkaW5hcnlnZXRvd25tZXRhZGF0YVxuICAgICAgICBmdW5jdGlvbiBPcmRpbmFyeUdldE93bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKSB7XG4gICAgICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKE8sIFAsIC8qQ3JlYXRlKi8gZmFsc2UpO1xuICAgICAgICAgICAgaWYgKElzVW5kZWZpbmVkKG1ldGFkYXRhTWFwKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgcmV0dXJuIG1ldGFkYXRhTWFwLmdldChNZXRhZGF0YUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gMy4xLjUuMSBPcmRpbmFyeURlZmluZU93bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBNZXRhZGF0YVZhbHVlLCBPLCBQKVxuICAgICAgICAvLyBodHRwczovL3JidWNrdG9uLmdpdGh1Yi5pby9yZWZsZWN0LW1ldGFkYXRhLyNvcmRpbmFyeWRlZmluZW93bm1ldGFkYXRhXG4gICAgICAgIGZ1bmN0aW9uIE9yZGluYXJ5RGVmaW5lT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE1ldGFkYXRhVmFsdWUsIE8sIFApIHtcbiAgICAgICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAoTywgUCwgLypDcmVhdGUqLyB0cnVlKTtcbiAgICAgICAgICAgIG1ldGFkYXRhTWFwLnNldChNZXRhZGF0YUtleSwgTWV0YWRhdGFWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gMy4xLjYuMSBPcmRpbmFyeU1ldGFkYXRhS2V5cyhPLCBQKVxuICAgICAgICAvLyBodHRwczovL3JidWNrdG9uLmdpdGh1Yi5pby9yZWZsZWN0LW1ldGFkYXRhLyNvcmRpbmFyeW1ldGFkYXRha2V5c1xuICAgICAgICBmdW5jdGlvbiBPcmRpbmFyeU1ldGFkYXRhS2V5cyhPLCBQKSB7XG4gICAgICAgICAgICB2YXIgb3duS2V5cyA9IE9yZGluYXJ5T3duTWV0YWRhdGFLZXlzKE8sIFApO1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IE9yZGluYXJ5R2V0UHJvdG90eXBlT2YoTyk7XG4gICAgICAgICAgICBpZiAocGFyZW50ID09PSBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiBvd25LZXlzO1xuICAgICAgICAgICAgdmFyIHBhcmVudEtleXMgPSBPcmRpbmFyeU1ldGFkYXRhS2V5cyhwYXJlbnQsIFApO1xuICAgICAgICAgICAgaWYgKHBhcmVudEtleXMubGVuZ3RoIDw9IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuIG93bktleXM7XG4gICAgICAgICAgICBpZiAob3duS2V5cy5sZW5ndGggPD0gMClcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50S2V5cztcbiAgICAgICAgICAgIHZhciBzZXQgPSBuZXcgX1NldCgpO1xuICAgICAgICAgICAgdmFyIGtleXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgb3duS2V5c18xID0gb3duS2V5czsgX2kgPCBvd25LZXlzXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IG93bktleXNfMVtfaV07XG4gICAgICAgICAgICAgICAgdmFyIGhhc0tleSA9IHNldC5oYXMoa2V5KTtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc0tleSkge1xuICAgICAgICAgICAgICAgICAgICBzZXQuYWRkKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIF9hID0gMCwgcGFyZW50S2V5c18xID0gcGFyZW50S2V5czsgX2EgPCBwYXJlbnRLZXlzXzEubGVuZ3RoOyBfYSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IHBhcmVudEtleXNfMVtfYV07XG4gICAgICAgICAgICAgICAgdmFyIGhhc0tleSA9IHNldC5oYXMoa2V5KTtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc0tleSkge1xuICAgICAgICAgICAgICAgICAgICBzZXQuYWRkKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBrZXlzO1xuICAgICAgICB9XG4gICAgICAgIC8vIDMuMS43LjEgT3JkaW5hcnlPd25NZXRhZGF0YUtleXMoTywgUClcbiAgICAgICAgLy8gaHR0cHM6Ly9yYnVja3Rvbi5naXRodWIuaW8vcmVmbGVjdC1tZXRhZGF0YS8jb3JkaW5hcnlvd25tZXRhZGF0YWtleXNcbiAgICAgICAgZnVuY3Rpb24gT3JkaW5hcnlPd25NZXRhZGF0YUtleXMoTywgUCkge1xuICAgICAgICAgICAgdmFyIGtleXMgPSBbXTtcbiAgICAgICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAoTywgUCwgLypDcmVhdGUqLyBmYWxzZSk7XG4gICAgICAgICAgICBpZiAoSXNVbmRlZmluZWQobWV0YWRhdGFNYXApKVxuICAgICAgICAgICAgICAgIHJldHVybiBrZXlzO1xuICAgICAgICAgICAgdmFyIGtleXNPYmogPSBtZXRhZGF0YU1hcC5rZXlzKCk7XG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBHZXRJdGVyYXRvcihrZXlzT2JqKTtcbiAgICAgICAgICAgIHZhciBrID0gMDtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHQgPSBJdGVyYXRvclN0ZXAoaXRlcmF0b3IpO1xuICAgICAgICAgICAgICAgIGlmICghbmV4dCkge1xuICAgICAgICAgICAgICAgICAgICBrZXlzLmxlbmd0aCA9IGs7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbmV4dFZhbHVlID0gSXRlcmF0b3JWYWx1ZShuZXh0KTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBrZXlzW2tdID0gbmV4dFZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgSXRlcmF0b3JDbG9zZShpdGVyYXRvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGsrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyA2IEVDTUFTY3JpcHQgRGF0YSBUeXAwZXMgYW5kIFZhbHVlc1xuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1lY21hc2NyaXB0LWRhdGEtdHlwZXMtYW5kLXZhbHVlc1xuICAgICAgICBmdW5jdGlvbiBUeXBlKHgpIHtcbiAgICAgICAgICAgIGlmICh4ID09PSBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiAxIC8qIE51bGwgKi87XG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGVvZiB4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcInVuZGVmaW5lZFwiOiByZXR1cm4gMCAvKiBVbmRlZmluZWQgKi87XG4gICAgICAgICAgICAgICAgY2FzZSBcImJvb2xlYW5cIjogcmV0dXJuIDIgLyogQm9vbGVhbiAqLztcbiAgICAgICAgICAgICAgICBjYXNlIFwic3RyaW5nXCI6IHJldHVybiAzIC8qIFN0cmluZyAqLztcbiAgICAgICAgICAgICAgICBjYXNlIFwic3ltYm9sXCI6IHJldHVybiA0IC8qIFN5bWJvbCAqLztcbiAgICAgICAgICAgICAgICBjYXNlIFwibnVtYmVyXCI6IHJldHVybiA1IC8qIE51bWJlciAqLztcbiAgICAgICAgICAgICAgICBjYXNlIFwib2JqZWN0XCI6IHJldHVybiB4ID09PSBudWxsID8gMSAvKiBOdWxsICovIDogNiAvKiBPYmplY3QgKi87XG4gICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIDYgLyogT2JqZWN0ICovO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIDYuMS4xIFRoZSBVbmRlZmluZWQgVHlwZVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzLXVuZGVmaW5lZC10eXBlXG4gICAgICAgIGZ1bmN0aW9uIElzVW5kZWZpbmVkKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB4ID09PSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNi4xLjIgVGhlIE51bGwgVHlwZVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzLW51bGwtdHlwZVxuICAgICAgICBmdW5jdGlvbiBJc051bGwoeCkge1xuICAgICAgICAgICAgcmV0dXJuIHggPT09IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNi4xLjUgVGhlIFN5bWJvbCBUeXBlXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMtc3ltYm9sLXR5cGVcbiAgICAgICAgZnVuY3Rpb24gSXNTeW1ib2woeCkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSBcInN5bWJvbFwiO1xuICAgICAgICB9XG4gICAgICAgIC8vIDYuMS43IFRoZSBPYmplY3QgVHlwZVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vYmplY3QtdHlwZVxuICAgICAgICBmdW5jdGlvbiBJc09iamVjdCh4KSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHggPT09IFwib2JqZWN0XCIgPyB4ICE9PSBudWxsIDogdHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIjtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjEgVHlwZSBDb252ZXJzaW9uXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLXR5cGUtY29udmVyc2lvblxuICAgICAgICAvLyA3LjEuMSBUb1ByaW1pdGl2ZShpbnB1dCBbLCBQcmVmZXJyZWRUeXBlXSlcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtdG9wcmltaXRpdmVcbiAgICAgICAgZnVuY3Rpb24gVG9QcmltaXRpdmUoaW5wdXQsIFByZWZlcnJlZFR5cGUpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoVHlwZShpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDAgLyogVW5kZWZpbmVkICovOiByZXR1cm4gaW5wdXQ7XG4gICAgICAgICAgICAgICAgY2FzZSAxIC8qIE51bGwgKi86IHJldHVybiBpbnB1dDtcbiAgICAgICAgICAgICAgICBjYXNlIDIgLyogQm9vbGVhbiAqLzogcmV0dXJuIGlucHV0O1xuICAgICAgICAgICAgICAgIGNhc2UgMyAvKiBTdHJpbmcgKi86IHJldHVybiBpbnB1dDtcbiAgICAgICAgICAgICAgICBjYXNlIDQgLyogU3ltYm9sICovOiByZXR1cm4gaW5wdXQ7XG4gICAgICAgICAgICAgICAgY2FzZSA1IC8qIE51bWJlciAqLzogcmV0dXJuIGlucHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGhpbnQgPSBQcmVmZXJyZWRUeXBlID09PSAzIC8qIFN0cmluZyAqLyA/IFwic3RyaW5nXCIgOiBQcmVmZXJyZWRUeXBlID09PSA1IC8qIE51bWJlciAqLyA/IFwibnVtYmVyXCIgOiBcImRlZmF1bHRcIjtcbiAgICAgICAgICAgIHZhciBleG90aWNUb1ByaW0gPSBHZXRNZXRob2QoaW5wdXQsIHRvUHJpbWl0aXZlU3ltYm9sKTtcbiAgICAgICAgICAgIGlmIChleG90aWNUb1ByaW0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBleG90aWNUb1ByaW0uY2FsbChpbnB1dCwgaGludCk7XG4gICAgICAgICAgICAgICAgaWYgKElzT2JqZWN0KHJlc3VsdCkpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5VG9QcmltaXRpdmUoaW5wdXQsIGhpbnQgPT09IFwiZGVmYXVsdFwiID8gXCJudW1iZXJcIiA6IGhpbnQpO1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuMS4xLjEgT3JkaW5hcnlUb1ByaW1pdGl2ZShPLCBoaW50KVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vcmRpbmFyeXRvcHJpbWl0aXZlXG4gICAgICAgIGZ1bmN0aW9uIE9yZGluYXJ5VG9QcmltaXRpdmUoTywgaGludCkge1xuICAgICAgICAgICAgaWYgKGhpbnQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9TdHJpbmdfMSA9IE8udG9TdHJpbmc7XG4gICAgICAgICAgICAgICAgaWYgKElzQ2FsbGFibGUodG9TdHJpbmdfMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRvU3RyaW5nXzEuY2FsbChPKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdChyZXN1bHQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlT2YgPSBPLnZhbHVlT2Y7XG4gICAgICAgICAgICAgICAgaWYgKElzQ2FsbGFibGUodmFsdWVPZikpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbHVlT2YuY2FsbChPKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdChyZXN1bHQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWVPZiA9IE8udmFsdWVPZjtcbiAgICAgICAgICAgICAgICBpZiAoSXNDYWxsYWJsZSh2YWx1ZU9mKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsdWVPZi5jYWxsKE8pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHJlc3VsdCkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdG9TdHJpbmdfMiA9IE8udG9TdHJpbmc7XG4gICAgICAgICAgICAgICAgaWYgKElzQ2FsbGFibGUodG9TdHJpbmdfMikpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRvU3RyaW5nXzIuY2FsbChPKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdChyZXN1bHQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy4xLjIgVG9Cb29sZWFuKGFyZ3VtZW50KVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvMjAxNi8jc2VjLXRvYm9vbGVhblxuICAgICAgICBmdW5jdGlvbiBUb0Jvb2xlYW4oYXJndW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiAhIWFyZ3VtZW50O1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuMS4xMiBUb1N0cmluZyhhcmd1bWVudClcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtdG9zdHJpbmdcbiAgICAgICAgZnVuY3Rpb24gVG9TdHJpbmcoYXJndW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBcIlwiICsgYXJndW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy4xLjE0IFRvUHJvcGVydHlLZXkoYXJndW1lbnQpXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLXRvcHJvcGVydHlrZXlcbiAgICAgICAgZnVuY3Rpb24gVG9Qcm9wZXJ0eUtleShhcmd1bWVudCkge1xuICAgICAgICAgICAgdmFyIGtleSA9IFRvUHJpbWl0aXZlKGFyZ3VtZW50LCAzIC8qIFN0cmluZyAqLyk7XG4gICAgICAgICAgICBpZiAoSXNTeW1ib2woa2V5KSlcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICAgICAgcmV0dXJuIFRvU3RyaW5nKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy4yIFRlc3RpbmcgYW5kIENvbXBhcmlzb24gT3BlcmF0aW9uc1xuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy10ZXN0aW5nLWFuZC1jb21wYXJpc29uLW9wZXJhdGlvbnNcbiAgICAgICAgLy8gNy4yLjIgSXNBcnJheShhcmd1bWVudClcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtaXNhcnJheVxuICAgICAgICBmdW5jdGlvbiBJc0FycmF5KGFyZ3VtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheVxuICAgICAgICAgICAgICAgID8gQXJyYXkuaXNBcnJheShhcmd1bWVudClcbiAgICAgICAgICAgICAgICA6IGFyZ3VtZW50IGluc3RhbmNlb2YgT2JqZWN0XG4gICAgICAgICAgICAgICAgICAgID8gYXJndW1lbnQgaW5zdGFuY2VvZiBBcnJheVxuICAgICAgICAgICAgICAgICAgICA6IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmd1bWVudCkgPT09IFwiW29iamVjdCBBcnJheV1cIjtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjIuMyBJc0NhbGxhYmxlKGFyZ3VtZW50KVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1pc2NhbGxhYmxlXG4gICAgICAgIGZ1bmN0aW9uIElzQ2FsbGFibGUoYXJndW1lbnQpIHtcbiAgICAgICAgICAgIC8vIE5PVEU6IFRoaXMgaXMgYW4gYXBwcm94aW1hdGlvbiBhcyB3ZSBjYW5ub3QgY2hlY2sgZm9yIFtbQ2FsbF1dIGludGVybmFsIG1ldGhvZC5cbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgYXJndW1lbnQgPT09IFwiZnVuY3Rpb25cIjtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjIuNCBJc0NvbnN0cnVjdG9yKGFyZ3VtZW50KVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1pc2NvbnN0cnVjdG9yXG4gICAgICAgIGZ1bmN0aW9uIElzQ29uc3RydWN0b3IoYXJndW1lbnQpIHtcbiAgICAgICAgICAgIC8vIE5PVEU6IFRoaXMgaXMgYW4gYXBwcm94aW1hdGlvbiBhcyB3ZSBjYW5ub3QgY2hlY2sgZm9yIFtbQ29uc3RydWN0XV0gaW50ZXJuYWwgbWV0aG9kLlxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBhcmd1bWVudCA9PT0gXCJmdW5jdGlvblwiO1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuMi43IElzUHJvcGVydHlLZXkoYXJndW1lbnQpXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWlzcHJvcGVydHlrZXlcbiAgICAgICAgZnVuY3Rpb24gSXNQcm9wZXJ0eUtleShhcmd1bWVudCkge1xuICAgICAgICAgICAgc3dpdGNoIChUeXBlKGFyZ3VtZW50KSkge1xuICAgICAgICAgICAgICAgIGNhc2UgMyAvKiBTdHJpbmcgKi86IHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIGNhc2UgNCAvKiBTeW1ib2wgKi86IHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyA3LjMgT3BlcmF0aW9ucyBvbiBPYmplY3RzXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9wZXJhdGlvbnMtb24tb2JqZWN0c1xuICAgICAgICAvLyA3LjMuOSBHZXRNZXRob2QoViwgUClcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtZ2V0bWV0aG9kXG4gICAgICAgIGZ1bmN0aW9uIEdldE1ldGhvZChWLCBQKSB7XG4gICAgICAgICAgICB2YXIgZnVuYyA9IFZbUF07XG4gICAgICAgICAgICBpZiAoZnVuYyA9PT0gdW5kZWZpbmVkIHx8IGZ1bmMgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmICghSXNDYWxsYWJsZShmdW5jKSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICByZXR1cm4gZnVuYztcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjQgT3BlcmF0aW9ucyBvbiBJdGVyYXRvciBPYmplY3RzXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9wZXJhdGlvbnMtb24taXRlcmF0b3Itb2JqZWN0c1xuICAgICAgICBmdW5jdGlvbiBHZXRJdGVyYXRvcihvYmopIHtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBHZXRNZXRob2Qob2JqLCBpdGVyYXRvclN5bWJvbCk7XG4gICAgICAgICAgICBpZiAoIUlzQ2FsbGFibGUobWV0aG9kKSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7IC8vIGZyb20gQ2FsbFxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gbWV0aG9kLmNhbGwob2JqKTtcbiAgICAgICAgICAgIGlmICghSXNPYmplY3QoaXRlcmF0b3IpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvcjtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjQuNCBJdGVyYXRvclZhbHVlKGl0ZXJSZXN1bHQpXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8yMDE2LyNzZWMtaXRlcmF0b3J2YWx1ZVxuICAgICAgICBmdW5jdGlvbiBJdGVyYXRvclZhbHVlKGl0ZXJSZXN1bHQpIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVyUmVzdWx0LnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuNC41IEl0ZXJhdG9yU3RlcChpdGVyYXRvcilcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtaXRlcmF0b3JzdGVwXG4gICAgICAgIGZ1bmN0aW9uIEl0ZXJhdG9yU3RlcChpdGVyYXRvcikge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQuZG9uZSA/IGZhbHNlIDogcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuNC42IEl0ZXJhdG9yQ2xvc2UoaXRlcmF0b3IsIGNvbXBsZXRpb24pXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWl0ZXJhdG9yY2xvc2VcbiAgICAgICAgZnVuY3Rpb24gSXRlcmF0b3JDbG9zZShpdGVyYXRvcikge1xuICAgICAgICAgICAgdmFyIGYgPSBpdGVyYXRvcltcInJldHVyblwiXTtcbiAgICAgICAgICAgIGlmIChmKVxuICAgICAgICAgICAgICAgIGYuY2FsbChpdGVyYXRvcik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gOS4xIE9yZGluYXJ5IE9iamVjdCBJbnRlcm5hbCBNZXRob2RzIGFuZCBJbnRlcm5hbCBTbG90c1xuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vcmRpbmFyeS1vYmplY3QtaW50ZXJuYWwtbWV0aG9kcy1hbmQtaW50ZXJuYWwtc2xvdHNcbiAgICAgICAgLy8gOS4xLjEuMSBPcmRpbmFyeUdldFByb3RvdHlwZU9mKE8pXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9yZGluYXJ5Z2V0cHJvdG90eXBlb2ZcbiAgICAgICAgZnVuY3Rpb24gT3JkaW5hcnlHZXRQcm90b3R5cGVPZihPKSB7XG4gICAgICAgICAgICB2YXIgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoTyk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIE8gIT09IFwiZnVuY3Rpb25cIiB8fCBPID09PSBmdW5jdGlvblByb3RvdHlwZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvdG87XG4gICAgICAgICAgICAvLyBUeXBlU2NyaXB0IGRvZXNuJ3Qgc2V0IF9fcHJvdG9fXyBpbiBFUzUsIGFzIGl0J3Mgbm9uLXN0YW5kYXJkLlxuICAgICAgICAgICAgLy8gVHJ5IHRvIGRldGVybWluZSB0aGUgc3VwZXJjbGFzcyBjb25zdHJ1Y3Rvci4gQ29tcGF0aWJsZSBpbXBsZW1lbnRhdGlvbnNcbiAgICAgICAgICAgIC8vIG11c3QgZWl0aGVyIHNldCBfX3Byb3RvX18gb24gYSBzdWJjbGFzcyBjb25zdHJ1Y3RvciB0byB0aGUgc3VwZXJjbGFzcyBjb25zdHJ1Y3RvcixcbiAgICAgICAgICAgIC8vIG9yIGVuc3VyZSBlYWNoIGNsYXNzIGhhcyBhIHZhbGlkIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgb24gaXRzIHByb3RvdHlwZSB0aGF0XG4gICAgICAgICAgICAvLyBwb2ludHMgYmFjayB0byB0aGUgY29uc3RydWN0b3IuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIG5vdCB0aGUgc2FtZSBhcyBGdW5jdGlvbi5bW1Byb3RvdHlwZV1dLCB0aGVuIHRoaXMgaXMgZGVmaW5hdGVseSBpbmhlcml0ZWQuXG4gICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBjYXNlIHdoZW4gaW4gRVM2IG9yIHdoZW4gdXNpbmcgX19wcm90b19fIGluIGEgY29tcGF0aWJsZSBicm93c2VyLlxuICAgICAgICAgICAgaWYgKHByb3RvICE9PSBmdW5jdGlvblByb3RvdHlwZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvdG87XG4gICAgICAgICAgICAvLyBJZiB0aGUgc3VwZXIgcHJvdG90eXBlIGlzIE9iamVjdC5wcm90b3R5cGUsIG51bGwsIG9yIHVuZGVmaW5lZCwgdGhlbiB3ZSBjYW5ub3QgZGV0ZXJtaW5lIHRoZSBoZXJpdGFnZS5cbiAgICAgICAgICAgIHZhciBwcm90b3R5cGUgPSBPLnByb3RvdHlwZTtcbiAgICAgICAgICAgIHZhciBwcm90b3R5cGVQcm90byA9IHByb3RvdHlwZSAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG90eXBlKTtcbiAgICAgICAgICAgIGlmIChwcm90b3R5cGVQcm90byA9PSBudWxsIHx8IHByb3RvdHlwZVByb3RvID09PSBPYmplY3QucHJvdG90eXBlKVxuICAgICAgICAgICAgICAgIHJldHVybiBwcm90bztcbiAgICAgICAgICAgIC8vIElmIHRoZSBjb25zdHJ1Y3RvciB3YXMgbm90IGEgZnVuY3Rpb24sIHRoZW4gd2UgY2Fubm90IGRldGVybWluZSB0aGUgaGVyaXRhZ2UuXG4gICAgICAgICAgICB2YXIgY29uc3RydWN0b3IgPSBwcm90b3R5cGVQcm90by5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29uc3RydWN0b3IgIT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvdG87XG4gICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIHNvbWUga2luZCBvZiBzZWxmLXJlZmVyZW5jZSwgdGhlbiB3ZSBjYW5ub3QgZGV0ZXJtaW5lIHRoZSBoZXJpdGFnZS5cbiAgICAgICAgICAgIGlmIChjb25zdHJ1Y3RvciA9PT0gTylcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvdG87XG4gICAgICAgICAgICAvLyB3ZSBoYXZlIGEgcHJldHR5IGdvb2QgZ3Vlc3MgYXQgdGhlIGhlcml0YWdlLlxuICAgICAgICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yO1xuICAgICAgICB9XG4gICAgICAgIC8vIG5haXZlIE1hcCBzaGltXG4gICAgICAgIGZ1bmN0aW9uIENyZWF0ZU1hcFBvbHlmaWxsKCkge1xuICAgICAgICAgICAgdmFyIGNhY2hlU2VudGluZWwgPSB7fTtcbiAgICAgICAgICAgIHZhciBhcnJheVNlbnRpbmVsID0gW107XG4gICAgICAgICAgICB2YXIgTWFwSXRlcmF0b3IgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gTWFwSXRlcmF0b3Ioa2V5cywgdmFsdWVzLCBzZWxlY3Rvcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMgPSBrZXlzO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMgPSB2YWx1ZXM7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIE1hcEl0ZXJhdG9yLnByb3RvdHlwZVtcIkBAaXRlcmF0b3JcIl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9O1xuICAgICAgICAgICAgICAgIE1hcEl0ZXJhdG9yLnByb3RvdHlwZVtpdGVyYXRvclN5bWJvbF0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9O1xuICAgICAgICAgICAgICAgIE1hcEl0ZXJhdG9yLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9pbmRleDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IDAgJiYgaW5kZXggPCB0aGlzLl9rZXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuX3NlbGVjdG9yKHRoaXMuX2tleXNbaW5kZXhdLCB0aGlzLl92YWx1ZXNbaW5kZXhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCArIDEgPj0gdGhpcy5fa2V5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMgPSBhcnJheVNlbnRpbmVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcyA9IGFycmF5U2VudGluZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHJlc3VsdCwgZG9uZTogZmFsc2UgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH07XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBNYXBJdGVyYXRvci5wcm90b3R5cGUudGhyb3cgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2luZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzID0gYXJyYXlTZW50aW5lbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcyA9IGFycmF5U2VudGluZWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBNYXBJdGVyYXRvci5wcm90b3R5cGUucmV0dXJuID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cyA9IGFycmF5U2VudGluZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMgPSBhcnJheVNlbnRpbmVsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiB2YWx1ZSwgZG9uZTogdHJ1ZSB9O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hcEl0ZXJhdG9yO1xuICAgICAgICAgICAgfSgpKTtcbiAgICAgICAgICAgIHJldHVybiAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gTWFwKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUtleSA9IGNhY2hlU2VudGluZWw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlSW5kZXggPSAtMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE1hcC5wcm90b3R5cGUsIFwic2l6ZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fa2V5cy5sZW5ndGg7IH0sXG4gICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gdGhpcy5fZmluZChrZXksIC8qaW5zZXJ0Ki8gZmFsc2UpID49IDA7IH07XG4gICAgICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2ZpbmQoa2V5LCAvKmluc2VydCovIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4ID49IDAgPyB0aGlzLl92YWx1ZXNbaW5kZXhdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9maW5kKGtleSwgLyppbnNlcnQqLyB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9maW5kKGtleSwgLyppbnNlcnQqLyBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9IHRoaXMuX2tleXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGluZGV4ICsgMTsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXNbaSAtIDFdID0gdGhpcy5fa2V5c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXNbaSAtIDFdID0gdGhpcy5fdmFsdWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cy5sZW5ndGgtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcy5sZW5ndGgtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IHRoaXMuX2NhY2hlS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVLZXkgPSBjYWNoZVNlbnRpbmVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlSW5kZXggPSAtMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlS2V5ID0gY2FjaGVTZW50aW5lbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVJbmRleCA9IC0yO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IE1hcEl0ZXJhdG9yKHRoaXMuX2tleXMsIHRoaXMuX3ZhbHVlcywgZ2V0S2V5KTsgfTtcbiAgICAgICAgICAgICAgICBNYXAucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBNYXBJdGVyYXRvcih0aGlzLl9rZXlzLCB0aGlzLl92YWx1ZXMsIGdldFZhbHVlKTsgfTtcbiAgICAgICAgICAgICAgICBNYXAucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgTWFwSXRlcmF0b3IodGhpcy5fa2V5cywgdGhpcy5fdmFsdWVzLCBnZXRFbnRyeSk7IH07XG4gICAgICAgICAgICAgICAgTWFwLnByb3RvdHlwZVtcIkBAaXRlcmF0b3JcIl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLmVudHJpZXMoKTsgfTtcbiAgICAgICAgICAgICAgICBNYXAucHJvdG90eXBlW2l0ZXJhdG9yU3ltYm9sXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuZW50cmllcygpOyB9O1xuICAgICAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuX2ZpbmQgPSBmdW5jdGlvbiAoa2V5LCBpbnNlcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2NhY2hlS2V5ICE9PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlSW5kZXggPSB0aGlzLl9rZXlzLmluZGV4T2YodGhpcy5fY2FjaGVLZXkgPSBrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jYWNoZUluZGV4IDwgMCAmJiBpbnNlcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlSW5kZXggPSB0aGlzLl9rZXlzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzLnB1c2godW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FjaGVJbmRleDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBNYXA7XG4gICAgICAgICAgICB9KCkpO1xuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0S2V5KGtleSwgXykge1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRWYWx1ZShfLCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEVudHJ5KGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2tleSwgdmFsdWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIG5haXZlIFNldCBzaGltXG4gICAgICAgIGZ1bmN0aW9uIENyZWF0ZVNldFBvbHlmaWxsKCkge1xuICAgICAgICAgICAgcmV0dXJuIC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBTZXQoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hcCA9IG5ldyBfTWFwKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTZXQucHJvdG90eXBlLCBcInNpemVcIiwge1xuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX21hcC5zaXplOyB9LFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBTZXQucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdGhpcy5fbWFwLmhhcyh2YWx1ZSk7IH07XG4gICAgICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRoaXMuX21hcC5zZXQodmFsdWUsIHZhbHVlKSwgdGhpczsgfTtcbiAgICAgICAgICAgICAgICBTZXQucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdGhpcy5fbWFwLmRlbGV0ZSh2YWx1ZSk7IH07XG4gICAgICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHsgdGhpcy5fbWFwLmNsZWFyKCk7IH07XG4gICAgICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fbWFwLmtleXMoKTsgfTtcbiAgICAgICAgICAgICAgICBTZXQucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX21hcC52YWx1ZXMoKTsgfTtcbiAgICAgICAgICAgICAgICBTZXQucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9tYXAuZW50cmllcygpOyB9O1xuICAgICAgICAgICAgICAgIFNldC5wcm90b3R5cGVbXCJAQGl0ZXJhdG9yXCJdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5rZXlzKCk7IH07XG4gICAgICAgICAgICAgICAgU2V0LnByb3RvdHlwZVtpdGVyYXRvclN5bWJvbF0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLmtleXMoKTsgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gU2V0O1xuICAgICAgICAgICAgfSgpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBuYWl2ZSBXZWFrTWFwIHNoaW1cbiAgICAgICAgZnVuY3Rpb24gQ3JlYXRlV2Vha01hcFBvbHlmaWxsKCkge1xuICAgICAgICAgICAgdmFyIFVVSURfU0laRSA9IDE2O1xuICAgICAgICAgICAgdmFyIGtleXMgPSBIYXNoTWFwLmNyZWF0ZSgpO1xuICAgICAgICAgICAgdmFyIHJvb3RLZXkgPSBDcmVhdGVVbmlxdWVLZXkoKTtcbiAgICAgICAgICAgIHJldHVybiAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gV2Vha01hcCgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5ID0gQ3JlYXRlVW5pcXVlS2V5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFdlYWtNYXAucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhYmxlID0gR2V0T3JDcmVhdGVXZWFrTWFwVGFibGUodGFyZ2V0LCAvKmNyZWF0ZSovIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhYmxlICE9PSB1bmRlZmluZWQgPyBIYXNoTWFwLmhhcyh0YWJsZSwgdGhpcy5fa2V5KSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgV2Vha01hcC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGFibGUgPSBHZXRPckNyZWF0ZVdlYWtNYXBUYWJsZSh0YXJnZXQsIC8qY3JlYXRlKi8gZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFibGUgIT09IHVuZGVmaW5lZCA/IEhhc2hNYXAuZ2V0KHRhYmxlLCB0aGlzLl9rZXkpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgV2Vha01hcC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHRhcmdldCwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhYmxlID0gR2V0T3JDcmVhdGVXZWFrTWFwVGFibGUodGFyZ2V0LCAvKmNyZWF0ZSovIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB0YWJsZVt0aGlzLl9rZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgV2Vha01hcC5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGFibGUgPSBHZXRPckNyZWF0ZVdlYWtNYXBUYWJsZSh0YXJnZXQsIC8qY3JlYXRlKi8gZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFibGUgIT09IHVuZGVmaW5lZCA/IGRlbGV0ZSB0YWJsZVt0aGlzLl9rZXldIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBXZWFrTWFwLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTk9URTogbm90IGEgcmVhbCBjbGVhciwganVzdCBtYWtlcyB0aGUgcHJldmlvdXMgZGF0YSB1bnJlYWNoYWJsZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXkgPSBDcmVhdGVVbmlxdWVLZXkoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBXZWFrTWFwO1xuICAgICAgICAgICAgfSgpKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIENyZWF0ZVVuaXF1ZUtleSgpIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5O1xuICAgICAgICAgICAgICAgIGRvXG4gICAgICAgICAgICAgICAgICAgIGtleSA9IFwiQEBXZWFrTWFwQEBcIiArIENyZWF0ZVVVSUQoKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoSGFzaE1hcC5oYXMoa2V5cywga2V5KSk7XG4gICAgICAgICAgICAgICAga2V5c1trZXldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gR2V0T3JDcmVhdGVXZWFrTWFwVGFibGUodGFyZ2V0LCBjcmVhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc093bi5jYWxsKHRhcmdldCwgcm9vdEtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjcmVhdGUpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCByb290S2V5LCB7IHZhbHVlOiBIYXNoTWFwLmNyZWF0ZSgpIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W3Jvb3RLZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gRmlsbFJhbmRvbUJ5dGVzKGJ1ZmZlciwgc2l6ZSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZTsgKytpKVxuICAgICAgICAgICAgICAgICAgICBidWZmZXJbaV0gPSBNYXRoLnJhbmRvbSgpICogMHhmZiB8IDA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIEdlblJhbmRvbUJ5dGVzKHNpemUpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNyeXB0byAhPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KHNpemUpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtc0NyeXB0byAhPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtc0NyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoc2l6ZSkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRmlsbFJhbmRvbUJ5dGVzKG5ldyBVaW50OEFycmF5KHNpemUpLCBzaXplKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIEZpbGxSYW5kb21CeXRlcyhuZXcgQXJyYXkoc2l6ZSksIHNpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gQ3JlYXRlVVVJRCgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IEdlblJhbmRvbUJ5dGVzKFVVSURfU0laRSk7XG4gICAgICAgICAgICAgICAgLy8gbWFyayBhcyByYW5kb20gLSBSRkMgNDEyMiDCpyA0LjRcbiAgICAgICAgICAgICAgICBkYXRhWzZdID0gZGF0YVs2XSAmIDB4NGYgfCAweDQwO1xuICAgICAgICAgICAgICAgIGRhdGFbOF0gPSBkYXRhWzhdICYgMHhiZiB8IDB4ODA7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgb2Zmc2V0ID0gMDsgb2Zmc2V0IDwgVVVJRF9TSVpFOyArK29mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYnl0ZSA9IGRhdGFbb2Zmc2V0XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9mZnNldCA9PT0gNCB8fCBvZmZzZXQgPT09IDYgfHwgb2Zmc2V0ID09PSA4KVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwiLVwiO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYnl0ZSA8IDE2KVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwiMFwiO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gYnl0ZS50b1N0cmluZygxNikudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB1c2VzIGEgaGV1cmlzdGljIHVzZWQgYnkgdjggYW5kIGNoYWtyYSB0byBmb3JjZSBhbiBvYmplY3QgaW50byBkaWN0aW9uYXJ5IG1vZGUuXG4gICAgICAgIGZ1bmN0aW9uIE1ha2VEaWN0aW9uYXJ5KG9iaikge1xuICAgICAgICAgICAgb2JqLl9fID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgZGVsZXRlIG9iai5fXztcbiAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgIH1cbiAgICB9KTtcbn0pKFJlZmxlY3QgfHwgKFJlZmxlY3QgPSB7fSkpO1xuIiwiaW50ZXJmYWNlIEdhbWVEYXRhIHtcclxuICBpbnRlcmVzdGVkSW5GZWF0dXJlcz86IHN0cmluZ1tdO1xyXG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBlbnVtIEdhbWVLZXkge1xyXG4gIExlYWd1ZU9mTGVnZW5kcyA9IDU0MjYsXHJcbiAgQ1MyID0gMjI3MzAsXHJcbiAgUm9ja2V0TGVhZ3VlID0gMTA3OTgsXHJcbiAgUFVCRyA9IDEwOTA2LFxyXG4gIEZvcnRuaXRlID0gMjEyMTYsXHJcbiAgQXBleExlZ2VuZHMgPSAyMTU2NixcclxuICBWYWxvcmFudCA9IDIxNjQwLFxyXG4gIENTR08gPSA3NzY0XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBHYW1lRmlsZU5hbWUgPSB7XHJcbiAgW0dhbWVLZXkuTGVhZ3VlT2ZMZWdlbmRzXTogJ0xlYWd1ZSBPZiBMZWdlbmRzJyxcclxuICBbR2FtZUtleS5DUzJdOiAnQ291bnRlciBTdHJpa2UgMicsXHJcbiAgW0dhbWVLZXkuUm9ja2V0TGVhZ3VlXTogJ1JvY2tldCBMZWFndWUnLFxyXG4gIFtHYW1lS2V5LlBVQkddOiAnUFVCRycsXHJcbiAgW0dhbWVLZXkuRm9ydG5pdGVdOiAnRm9ydG5pdGUnLFxyXG4gIFtHYW1lS2V5LkFwZXhMZWdlbmRzXTogJ0FwZXggTGVnZW5kcycsXHJcbiAgW0dhbWVLZXkuVmFsb3JhbnRdOiAnVmFsb3JhbnQnLFxyXG4gIFtHYW1lS2V5LkNTR09dOiAnQ291bnRlciBTdHJpa2UgR08nLFxyXG59XHJcblxyXG5jb25zdCBkYXRhOiB7IFtpZDogbnVtYmVyXTogR2FtZURhdGEgfSA9IHtcclxuICBbR2FtZUtleS5MZWFndWVPZkxlZ2VuZHNdOiB7XHJcbiAgICBpbnRlcmVzdGVkSW5GZWF0dXJlczogW1xyXG4gICAgICAnc3VtbW9uZXJfaW5mbycsXHJcbiAgICAgICdnYW1lTW9kZScsXHJcbiAgICAgICd0ZWFtcycsXHJcbiAgICAgICdtYXRjaFN0YXRlJyxcclxuICAgICAgJ2tpbGwnLFxyXG4gICAgICAnZGVhdGgnLFxyXG4gICAgICAncmVzcGF3bicsXHJcbiAgICAgICdhc3Npc3QnLFxyXG4gICAgICAnbWluaW9ucycsXHJcbiAgICAgICdsZXZlbCcsXHJcbiAgICAgICdhYmlsaXRpZXMnLFxyXG4gICAgICAnYW5ub3VuY2VyJyxcclxuICAgICAgJ2NvdW50ZXJzJyxcclxuICAgICAgJ21hdGNoX2luZm8nLFxyXG4gICAgICAnZGFtYWdlJyxcclxuICAgICAgJ2hlYWwnLFxyXG4gICAgICAnbGl2ZV9jbGllbnRfZGF0YScsXHJcbiAgICAgICdqdW5nbGVfY2FtcHMnLFxyXG4gICAgICAndGVhbV9mcmFtZXMnLFxyXG4gICAgXSxcclxuICAgIGRlc2NyaXB0aW9uOiAnTE9MIGRhdGEnLFxyXG4gIH0sXHJcbiAgW0dhbWVLZXkuQ1MyXToge1xyXG4gICAgaW50ZXJlc3RlZEluRmVhdHVyZXM6IFtcclxuICAgICAgJ2dlcF9pbnRlcm5hbCcsXHJcbiAgICAgICdtYXRjaF9pbmZvJyxcclxuICAgICAgJ2xpdmVfZGF0YScsXHJcbiAgICBdLFxyXG4gICAgZGVzY3JpcHRpb246ICdDUzpHTyBkYXRhJyxcclxuICB9LFxyXG4gIFtHYW1lS2V5LlJvY2tldExlYWd1ZV06IHtcclxuICAgIGludGVyZXN0ZWRJbkZlYXR1cmVzOiBbXHJcbiAgICAgICdzdGF0cycsXHJcbiAgICAgICdyb3N0ZXInLFxyXG4gICAgICAnbWF0Y2gnLFxyXG4gICAgICAnbWUnLFxyXG4gICAgICAnbWF0Y2hfaW5mbycsXHJcbiAgICAgICdkZWF0aCcsXHJcbiAgICAgICdnYW1lX2luZm8nLFxyXG4gICAgXSxcclxuICAgIGRlc2NyaXB0aW9uOiAnUm9ja2V0IGxlYWd1ZSBkYXRhJyxcclxuICB9LFxyXG4gIFtHYW1lS2V5LlBVQkddOiB7XHJcbiAgICBpbnRlcmVzdGVkSW5GZWF0dXJlczogW1xyXG4gICAgICAna2lsbCcsXHJcbiAgICAgICdyZXZpdmVkJyxcclxuICAgICAgJ2RlYXRoJyxcclxuICAgICAgJ2tpbGxlcicsXHJcbiAgICAgICdtYXRjaCcsXHJcbiAgICAgICdyYW5rJyxcclxuICAgICAgJ2xvY2F0aW9uJyxcclxuICAgICAgJ21lJyxcclxuICAgICAgJ3RlYW0nLFxyXG4gICAgICAncGhhc2UnLFxyXG4gICAgICAnbWFwJyxcclxuICAgICAgJ3Jvc3RlcicsXHJcbiAgICAgICdpbnZlbnRvcnknLFxyXG4gICAgICAnbWF0Y2hfaW5mbycsXHJcbiAgICAgICdjb3VudGVycycsXHJcbiAgICBdLFxyXG4gICAgZGVzY3JpcHRpb246ICdQVUJHIGRhdGEnLFxyXG4gIH0sXHJcbiAgW0dhbWVLZXkuRm9ydG5pdGVdOiB7XHJcbiAgICBpbnRlcmVzdGVkSW5GZWF0dXJlczogW1xyXG4gICAgICAna2lsbCcsXHJcbiAgICAgICdraWxsZWQnLFxyXG4gICAgICAna2lsbGVyJyxcclxuICAgICAgJ3Jldml2ZWQnLFxyXG4gICAgICAnZGVhdGgnLFxyXG4gICAgICAnbWF0Y2gnLFxyXG4gICAgICAncmFuaycsXHJcbiAgICAgICdtZScsXHJcbiAgICAgICdwaGFzZScsXHJcbiAgICAgICdsb2NhdGlvbicsXHJcbiAgICAgICdyb3N0ZXInLFxyXG4gICAgICAndGVhbScsXHJcbiAgICAgICdpdGVtcycsXHJcbiAgICAgICdjb3VudGVycycsXHJcbiAgICAgICdtYXRjaF9pbmZvJyxcclxuICAgICAgJ21hcCcsXHJcbiAgICBdLFxyXG4gICAgZGVzY3JpcHRpb246ICdGb3J0bml0ZSBkYXRhJyxcclxuICB9LFxyXG4gIFtHYW1lS2V5LkFwZXhMZWdlbmRzXToge1xyXG4gICAgaW50ZXJlc3RlZEluRmVhdHVyZXM6IFtcclxuICAgICAgJ2RlYXRoJyxcclxuICAgICAgJ2tpbGwnLFxyXG4gICAgICAnbWF0Y2hfc3RhdGUnLFxyXG4gICAgICAnbWUnLFxyXG4gICAgICAncmV2aXZlJyxcclxuICAgICAgJ3RlYW0nLFxyXG4gICAgICAncm9zdGVyJyxcclxuICAgICAgJ2tpbGxfZmVlZCcsXHJcbiAgICAgICdyYW5rJyxcclxuICAgICAgJ21hdGNoX3N1bW1hcnknLFxyXG4gICAgICAnbG9jYXRpb24nLFxyXG4gICAgICAnbWF0Y2hfaW5mbycsXHJcbiAgICAgICd2aWN0b3J5JyxcclxuICAgICAgJ2RhbWFnZScsXHJcbiAgICAgICdpbnZlbnRvcnknLFxyXG4gICAgICAnbG9jYWxpemF0aW9uJyxcclxuICAgIF0sXHJcbiAgICBkZXNjcmlwdGlvbjogJ0FwZXggZGF0YScsXHJcbiAgfSxcclxuICBbR2FtZUtleS5WYWxvcmFudF06IHtcclxuICAgIGludGVyZXN0ZWRJbkZlYXR1cmVzOiBbXHJcbiAgICAgICdnYW1lX2luZm8nLFxyXG4gICAgICAnbWUnLFxyXG4gICAgICAnbWF0Y2hfaW5mbycsXHJcbiAgICAgICdraWxsJyxcclxuICAgICAgJ2RlYXRoJyxcclxuICAgICAgJ2dlcF9pbnRlcm5hbCcsXHJcbiAgICBdLFxyXG4gICAgZGVzY3JpcHRpb246ICdWYWxvcmFudCBkYXRhJyxcclxuICB9LFxyXG4gIFtHYW1lS2V5LkNTR09dOiB7XHJcbiAgICBpbnRlcmVzdGVkSW5GZWF0dXJlczogW1xyXG4gICAgICAna2lsbCcsXHJcbiAgICAgICdkZWF0aCcsXHJcbiAgICAgICdhc3Npc3QnLFxyXG4gICAgICAnaGVhZHNob3QnLFxyXG4gICAgICAncm91bmRfc3RhcnQnLFxyXG4gICAgICAnbWF0Y2hfc3RhcnQnLFxyXG4gICAgICAnbWF0Y2hfZW5kJyxcclxuICAgICAgJ3RlYW1fcm91bmRfd2luJyxcclxuICAgICAgJ2JvbWJfcGxhbnRlZCcsXHJcbiAgICAgICdib21iX2NoYW5nZScsXHJcbiAgICAgICdyZWxvYWRpbmcnLFxyXG4gICAgICAnZmlyZWQnLFxyXG4gICAgICAnd2VhcG9uX2NoYW5nZScsXHJcbiAgICAgICd3ZWFwb25fYWNxdWlyZWQnLFxyXG4gICAgICAncGxheWVyX2FjdGl2aXR5X2NoYW5nZScsXHJcbiAgICAgICd0ZWFtX3NldCcsXHJcbiAgICAgICdpbmZvJyxcclxuICAgICAgJ3Jvc3RlcicsXHJcbiAgICAgICdzY2VuZScsXHJcbiAgICAgICdtYXRjaF9pbmZvJyxcclxuICAgICAgJ3JlcGxheScsXHJcbiAgICAgICdjb3VudGVycycsXHJcbiAgICAgICdtdnAnLFxyXG4gICAgICAna2lsbF9mZWVkJyxcclxuICAgICAgJ3Njb3JlYm9hcmQnLFxyXG4gICAgICAnc2NvcmUnLFxyXG4gICAgXSxcclxuICAgIGRlc2NyaXB0aW9uOiAnQ1M6R08gZGF0YScsXHJcbiAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRhdGE7XHJcbiIsIi8vIHVzZSBodHRwOi8vbG9jYWxob3N0OjMwMDAgZm9yIGRldiBtb2RlXHJcbi8vIHVzZSBodHRwOi8vMTAzLjI0MS42NS4yMDI6MzAwMCBmb3IgcHJvZFxyXG5cclxuZXhwb3J0IGNvbnN0IGVudmlyb25tZW50ID0ge1xyXG4gIHVybDogJ2h0dHA6Ly8xMDMuMjQxLjY1LjIwMjozMDAwJyxcclxufTtcclxuIiwiaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcclxuaW1wb3J0IHsgY29udGFpbmVyLCBpbmplY3RhYmxlIH0gZnJvbSAndHN5cmluZ2UnO1xyXG5pbXBvcnQgZ2FtZURhdGEgZnJvbSAnLi9jb25maWcvZ2FtZS1kYXRhJztcclxuaW1wb3J0IHsgR0VQU2VydmljZSB9IGZyb20gJy4vc2VydmljZXMvZ2VwLXNlcnZpY2UnO1xyXG5pbXBvcnQgeyBHYW1lRGV0ZWN0aW9uU2VydmljZSB9IGZyb20gJy4vc2VydmljZXMvZ2FtZS1kZXRlY3Rpb24tc2VydmljZSc7XHJcbmltcG9ydCB7XHJcbiAgR2FtZUNsb3NlZEV2ZW50LFxyXG4gIEdhbWVMYXVuY2hlZEV2ZW50LFxyXG4gIFBvc3RHYW1lRXZlbnQsXHJcbn0gZnJvbSAnLi9pbnRlcmZhY2VzL3J1bm5pbmctZ2FtZSc7XHJcbmltcG9ydCB7IEdFUENvbnN1bWVyIH0gZnJvbSAnLi9zZXJ2aWNlcy9nZXAtY29uc3VtZXInO1xyXG5pbXBvcnQgeyBBdXRoU2VydmljZSB9IGZyb20gJy4vc2VydmljZXMvYXV0aC1zZXJ2aWNlJztcclxuXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbkBpbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIE1haW4ge1xyXG4gIC8vIGxvZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Rpc2NvcmQtYnV0dG9uJyk7XHJcbiAgLy8gY29udGludWVCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGludWUtYnV0dG9uJyk7XHJcbiAgLy8gdXNlckdyZWV0aW5nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VzZXJHcmVldGluZycpO1xyXG4gIC8vIGdldERhdGFCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2V0LWRhdGEtYnV0dG9uJyk7XHJcblxyXG4gIHNlcnZlcjogYW55O1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdlcFNlcnZpY2U6IEdFUFNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdlcENvbnN1bWVyOiBHRVBDb25zdW1lcixcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZ2FtZURldGVjdGlvblNlcnZpY2U6IEdhbWVEZXRlY3Rpb25TZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhdXRoU2VydmljZTogQXV0aFNlcnZpY2UsXHJcbiAgKSB7XHJcbiAgICB0aGlzLmluaXQoKTtcclxuICB9XHJcblxyXG4gIC8vIGFzeW5jIG9uQ29udGludWUoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgLy8gICBjb25zdCBzZXNzaW9uSWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2Vzc2lvbklkJyk7XHJcbiAgLy8gICBpZiAoIXNlc3Npb25JZCkge1xyXG4gIC8vICAgICByZXR1cm47XHJcbiAgLy8gICB9XHJcbiAgLy9cclxuICAvLyAgIHRoaXMuYXV0aFNlcnZpY2UuZ2V0VXNlcihzZXNzaW9uSWQpLnRoZW4oKGRhdGEpID0+IHtcclxuICAvLyAgICAgY29uc3QgdXNlciA9IGRhdGEudXNlcjtcclxuICAvLyAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9iYW4tdHMtY29tbWVudFxyXG4gIC8vICAgICAvLyBAdHMtaWdub3JlXHJcbiAgLy8gICAgIHRoaXMuY29udGludWVCdXR0b24/LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgLy8gICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvYmFuLXRzLWNvbW1lbnRcclxuICAvLyAgICAgLy8gQHRzLWlnbm9yZVxyXG4gIC8vICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxlblxyXG4gIC8vICAgICB0aGlzLnVzZXJHcmVldGluZz8uaW5uZXJUZXh0ID0gYEhpLCAke3VzZXIudXNlcm5hbWV9LiBFbmpveSBwbGF5aW5nIGdhbWVzLmA7XHJcbiAgLy8gICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvYmFuLXRzLWNvbW1lbnRcclxuICAvLyAgICAgLy8gQHRzLWlnbm9yZVxyXG4gIC8vICAgICB0aGlzLmdldERhdGFCdXR0b24/LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG4gIC8vICAgICB0aGlzLmluaXQoKTtcclxuICAvLyAgIH0pO1xyXG4gIC8vXHJcbiAgLy8gICB0aGlzLmF1dGhTZXJ2aWNlLmdldENvbm5lY3Rpb25zKHNlc3Npb25JZCkudGhlbigoZGF0YSkgPT4ge1xyXG4gIC8vICAgICBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAvLyAgIH0pO1xyXG4gIC8vIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhpcyBhcHBcclxuICAgKi9cclxuICBwdWJsaWMgaW5pdCgpOiB2b2lkIHtcclxuICAgIC8vIFJlZ2lzdGVyIGZvciB0aGUgYGdhbWVMYXVuY2hlZGAgZXZlbnQgZnJvbSB0aGUgZ2FtZSBkZXRlY3Rpb24gc2VydmljZVxyXG4gICAgdGhpcy5nYW1lRGV0ZWN0aW9uU2VydmljZS5vbihcclxuICAgICAgJ2dhbWVMYXVuY2hlZCcsXHJcbiAgICAgIChnYW1lTGF1bmNoOiBHYW1lTGF1bmNoZWRFdmVudCkgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBHYW1lIHdhcyBsYXVuY2hlZDogJHtnYW1lTGF1bmNoLm5hbWV9ICR7Z2FtZUxhdW5jaC5pZH1gKTtcclxuICAgICAgICAvLyBHZXQgdGhlIGNvbmZpZ3VyZWQgZGF0YSBmb3IgdGhlIGxhdW5jaGVkIGdhbWVcclxuICAgICAgICBjb25zdCBnYW1lQ29uZmlnID0gZ2FtZURhdGFbZ2FtZUxhdW5jaC5pZF07XHJcbiAgICAgICAgLy8gSWYgdGhlIGRldGVjdGVkIGdhbWUgZXhpc3RzXHJcbiAgICAgICAgaWYgKGdhbWVDb25maWcpIHtcclxuICAgICAgICAgIHRoaXMuZ2VwU2VydmljZS5nYW1lTGF1bmNoSWQgPSBnYW1lTGF1bmNoLmlkO1xyXG4gICAgICAgICAgLy8gUnVuIHRoZSBnYW1lIGxhdW5jaGVkIGxvZ2ljIG9mIHRoZSBnZXAgc2VydmljZVxyXG4gICAgICAgICAgdGhpcy5nZXBTZXJ2aWNlLm9uR2FtZUxhdW5jaGVkKGdhbWVDb25maWcuaW50ZXJlc3RlZEluRmVhdHVyZXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICk7XHJcbiAgICAvLyBSZWdpc3RlciBmb3IgdGhlIGBnYW1lQ2xvc2VkYCBldmVudCBmcm9tIHRoZSBnYW1lRGV0ZWN0aW9uU2VydmljZVxyXG4gICAgdGhpcy5nYW1lRGV0ZWN0aW9uU2VydmljZS5vbihcclxuICAgICAgJ2dhbWVDbG9zZWQnLFxyXG4gICAgICAoZ2FtZUNsb3NlZDogR2FtZUNsb3NlZEV2ZW50KSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEdhbWUgd2FzIGNsb3NlZDogJHtnYW1lQ2xvc2VkLm5hbWV9YCk7XHJcbiAgICAgICAgLy8gUnVuIGdhbWUgY2xvc2VkIGNsZWFudXAgb2YgdGhlIGdlcCBzZXJ2aWNlXHJcbiAgICAgICAgdGhpcy5nZXBTZXJ2aWNlLm9uR2FtZUNsb3NlZCgpO1xyXG4gICAgICB9LFxyXG4gICAgKTtcclxuICAgIC8vIFJlZ2lzdGVyIGZvciB0aGUgYHBvc3RHYW1lYCBldmVudCBmcm9tIHRoZSBnYW1lRGV0ZWN0aW9uU2VydmljZVxyXG4gICAgdGhpcy5nYW1lRGV0ZWN0aW9uU2VydmljZS5vbigncG9zdEdhbWUnLCAocG9zdEdhbWU6IFBvc3RHYW1lRXZlbnQpID0+IHtcclxuICAgICAgY29uc29sZS5sb2coYFJ1bm5pbmcgcG9zdC1nYW1lIGxvZ2ljIGZvciBnYW1lOiAke3Bvc3RHYW1lLm5hbWV9YCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZWdpc3RlciBmb3IgdGhlIGBnYW1lRXZlbnRgLCBgaW5mb1VwZGF0ZWAsIGFuZCBgZXJyb3JgIGdlcFNlcnZpY2UgZXZlbnRzXHJcbiAgICB0aGlzLmdlcFNlcnZpY2Uub24oJ2dhbWVFdmVudCcsIHRoaXMuZ2VwQ29uc3VtZXIub25OZXdHYW1lRXZlbnQpO1xyXG4gICAgdGhpcy5nZXBTZXJ2aWNlLm9uKCdpbmZvVXBkYXRlJywgdGhpcy5nZXBDb25zdW1lci5vbkdhbWVJbmZvVXBkYXRlKTtcclxuICAgIHRoaXMuZ2VwU2VydmljZS5vbignZXJyb3InLCB0aGlzLmdlcENvbnN1bWVyLm9uR0VQRXJyb3IpO1xyXG5cclxuICAgIC8vIEhhbmRsZSBFdmVudHMgdG8gd3JpdGUgZGF0YSBpbnRvIGRhdGFiYXNlXHJcbiAgICB0aGlzLmdlcFNlcnZpY2Uub24oJ2dhbWVFdmVudCcsIHRoaXMuZ2VwU2VydmljZS5vbk5ld0dhbWVFdmVudCk7XHJcbiAgICB0aGlzLmdlcFNlcnZpY2Uub24oJ2luZm9VcGRhdGUnLCB0aGlzLmdlcFNlcnZpY2Uub25HYW1lSW5mb1VwZGF0ZSk7XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgZ2FtZSBkZXRlY3Rpb24gc2VydmljZVxyXG4gICAgdGhpcy5nYW1lRGV0ZWN0aW9uU2VydmljZS5pbml0KCk7XHJcbiAgfVxyXG59XHJcblxyXG5jb250YWluZXIucmVzb2x2ZShNYWluKTtcclxuIiwiaW1wb3J0IHsgaW5qZWN0YWJsZSB9IGZyb20gJ3RzeXJpbmdlJztcclxuaW1wb3J0IHsgR2FtZUZpbGVOYW1lIH0gZnJvbSAnLi4vY29uZmlnL2dhbWUtZGF0YSc7XHJcbmltcG9ydCB7IGVudmlyb25tZW50IH0gZnJvbSAnLi4vZW52aXJvbm1lbnQvZW52aXJvbm1lbnQnO1xyXG5cclxuaW50ZXJmYWNlIFRva2VuUmVzcG9uc2Uge1xyXG4gIGFjY2Vzc190b2tlbjogc3RyaW5nO1xyXG4gIHRva2VuX3R5cGU6IHN0cmluZztcclxuICBleHBpcmVzX2luOiBudW1iZXI7XHJcbiAgc2NvcGU6IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIFVzZXIge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgdXNlcm5hbWU6IHN0cmluZztcclxuICBhdmF0YXI6IHN0cmluZztcclxuICBkaXNjcmltaW5hdG9yOiBzdHJpbmc7XHJcbiAgcHVibGljX2ZsYWdzOiBudW1iZXI7XHJcbiAgcHJlbWl1bV90eXBlOiBudW1iZXI7XHJcbiAgZmxhZ3M6IG51bWJlcjtcclxuICBiYW5uZXI6IGFueTtcclxuICBhY2NlbnRfY29sb3I6IGFueTtcclxuICBnbG9iYWxfbmFtZTogYW55O1xyXG4gIGF2YXRhcl9kZWNvcmF0aW9uX2RhdGE6IGFueTtcclxuICBiYW5uZXJfY29sb3I6IGFueTtcclxuICBtZmFfZW5hYmxlZDogYW55O1xyXG4gIGxvY2FsZTogc3RyaW5nO1xyXG59XHJcblxyXG5AaW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBBdXRoU2VydmljZSB7XHJcbiAgdXNlcjogVXNlciB8IG51bGwgPSBudWxsO1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHt9XHJcblxyXG4gIGFzeW5jIGdldFVzZXIoc2Vzc2lvbklkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcclxuICAgICAgICBlbnZpcm9ubWVudC51cmwgKyBgL2F1dGgvZGlzY29yZC91c2VyP3Nlc3Npb25JZD0ke3Nlc3Npb25JZH1gLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgfSxcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICAgIC8vIFBhcnNlIGFuZCByZXR1cm4gdGhlIEpTT04gZGF0YVxyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6JywgcmVzcG9uc2Uuc3RhdHVzVGV4dCk7XHJcbiAgICAgICAgLy8gUmVqZWN0IHRoZSBwcm9taXNlIHdpdGggYW4gZXJyb3IgbWVzc2FnZVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IocmVzcG9uc2Uuc3RhdHVzVGV4dCkpO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAvLyBSZWplY3QgdGhlIHByb21pc2Ugd2l0aCB0aGUgY2F1Z2h0IGVycm9yXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXRDb25uZWN0aW9ucyhzZXNzaW9uSWQ6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQudXJsICsgYC9hdXRoL2Rpc2NvcmQvY29ubmVjdGlvbnM/c2Vzc2lvbklkPSR7c2Vzc2lvbklkfWAsXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgLy8gUGFyc2UgYW5kIHJldHVybiB0aGUgSlNPTiBkYXRhXHJcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjonLCByZXNwb25zZS5zdGF0dXNUZXh0KTtcclxuICAgICAgICAvLyBSZWplY3QgdGhlIHByb21pc2Ugd2l0aCBhbiBlcnJvciBtZXNzYWdlXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihyZXNwb25zZS5zdGF0dXNUZXh0KSk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6JywgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIC8vIFJlamVjdCB0aGUgcHJvbWlzZSB3aXRoIHRoZSBjYXVnaHQgZXJyb3JcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGxvZ2luKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbnZpcm9ubWVudC51cmwgKyAnL2F1dGgvZGlzY29yZC9sb2dpbicsIHtcclxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJlc3BvbnNlLmpzb24oKS50aGVuKChkYXRhKSA9PiB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Nlc3Npb25JZCcsIGRhdGEuc2Vzc2lvbklkKTtcclxuICAgICAgICBvdmVyd29sZi51dGlscy5vcGVuVXJsSW5EZWZhdWx0QnJvd3NlcihkYXRhLnVybCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcclxuaW1wb3J0IHsgaW5qZWN0YWJsZSB9IGZyb20gJ3RzeXJpbmdlJztcclxuaW1wb3J0IHtcclxuICBHYW1lQ2xvc2VkRXZlbnQsXHJcbiAgR2FtZUxhdW5jaGVkRXZlbnQsXHJcbiAgUG9zdEdhbWVFdmVudCxcclxuICBSdW5uaW5nR2FtZSxcclxufSBmcm9tICcuLi9pbnRlcmZhY2VzL3J1bm5pbmctZ2FtZSc7XHJcblxyXG5AaW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBHYW1lRGV0ZWN0aW9uU2VydmljZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XHJcbiAgLyoqXHJcbiAgICogVGhlIGN1cnJlbnRseSBydW5uaW5nIGdhbWUgKGlmIGFueSlcclxuICAgKi9cclxuICBwcml2YXRlIF9ydW5uaW5nR2FtZT86IFJ1bm5pbmdHYW1lID0gdW5kZWZpbmVkO1xyXG5cclxuICAvKipcclxuICAgKiBTZXR1cCBHYW1lIERldGVjdGlvbiBsaXN0ZW5lcnNcclxuICAgKi9cclxuICBwdWJsaWMgaW5pdCgpIHtcclxuICAgIC8vIFJlZ2lzdGVyIGxpc3RlbmVyIGZvciBydW5uaW5nIGdhbWUgaW5mbyBjaGFuZ2VkXHJcbiAgICBvdmVyd29sZi5nYW1lcy5vbkdhbWVJbmZvVXBkYXRlZC5hZGRMaXN0ZW5lcigodXBkYXRlKSA9PlxyXG4gICAgICB0aGlzLmdhbWVVcGRhdGVkKHVwZGF0ZSksXHJcbiAgICApO1xyXG4gICAgLy8gR2V0IHRoZSBjdXJyZW50bHkgcnVubmluZyBnYW1lIChpZiBhbnkpXHJcbiAgICBvdmVyd29sZi5nYW1lcy5nZXRSdW5uaW5nR2FtZUluZm8yKChpbmZvKSA9PiB7XHJcbiAgICAgIC8vIElmIHRoZXJlIGlzIGEgcnVubmluZyBnYW1lLCBydW4gdGhlIG5vbi1mcmVzaCBnYW1lIGxhdW5jaCBsb2dpY1xyXG4gICAgICBpZiAoaW5mby5nYW1lSW5mbz8uaXNSdW5uaW5nKSB0aGlzLmdhbWVMYXVuY2hlZChpbmZvLmdhbWVJbmZvLCBmYWxzZSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJhbiB3aGVuIGEgbmV3IGdhbWUgd2FzIGxhdW5jaGVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLlJ1bm5pbmdHYW1lSW5mb30gZ2FtZUluZm9cclxuICAgKiAtIFRoZSBHYW1lSW5mbyBvZiB0aGUgbmV3IGdhbWVcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZyZXNoTGF1bmNoXHJcbiAgICogLSBJcyB0aGlzIGEgXCJmcmVzaCBsYXVuY2hcIiwgb3Igd2FzIHRoZSBnYW1lIGFscmVhZHkgb3BlbiBiZWZvcmUgaXQgd2FzXHJcbiAgICogZGV0ZWN0ZWQ/IChGb3IgZXhhbXBsZSwgdGhlIGFwcCBvcGVuZWQgYWZ0ZXIgdGhlIGdhbWUpXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnYW1lTGF1bmNoZWQoXHJcbiAgICBnYW1lSW5mbzogb3ZlcndvbGYuZ2FtZXMuUnVubmluZ0dhbWVJbmZvLFxyXG4gICAgZnJlc2hMYXVuY2g6IGJvb2xlYW4sXHJcbiAgKSB7XHJcbiAgICAvLyBFbnN1cmUgdGhhdCBmcmVzaCBsYXVuY2ggd2FzIG5vdCBjYWxsZWQgd2hpbGUgdGhlcmUgd2FzIGEgcnVubmluZyBnYW1lXHJcbiAgICBpZiAoZnJlc2hMYXVuY2ggJiYgdGhpcy5fcnVubmluZ0dhbWUpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxlblxyXG4gICAgICAgIGBBIGZyZXNoIGxhdW5jaCB3YXMgY2FsbGVkLCBidXQgYSBydW5uaW5nIGdhbWUgd2FzIGFscmVhZHkgZGV0ZWN0ZWQhIExhdW5jaGVkIFxcYCR7Z2FtZUluZm8udGl0bGV9XFxgLCB3aGlsZSBcXGAke3RoaXMuX3J1bm5pbmdHYW1lLm5hbWV9XFxgIHdhcyBhbHJlYWR5IHJ1bm5pbmdgLFxyXG4gICAgICApO1xyXG5cclxuICAgIC8vIFNldCB0aGUgY3VycmVudGx5IHJ1bm5pbmcgZ2FtZVxyXG4gICAgdGhpcy5fcnVubmluZ0dhbWUgPSB7XHJcbiAgICAgIC8vIEdhbWUgSURcclxuICAgICAgaWQ6IGdhbWVJbmZvLmNsYXNzSWQsXHJcbiAgICAgIC8vIERpc3BsYXkgbmFtZSBvZiB0aGUgZ2FtZVxyXG4gICAgICBuYW1lOiBnYW1lSW5mby50aXRsZSxcclxuICAgIH07XHJcblxyXG4gICAgLy8gQ29uc3RydWN0IHRoZSBgZ2FtZUxhdW5jaGVkYCBldmVudFxyXG4gICAgY29uc3QgZ2FtZUxhdW5jaGVkRXZlbnQ6IEdhbWVMYXVuY2hlZEV2ZW50ID0ge1xyXG4gICAgICAuLi50aGlzLl9ydW5uaW5nR2FtZSxcclxuICAgICAgZnJlc2hMYXVuY2gsXHJcbiAgICB9O1xyXG4gICAgLy8gRW1pdCB0aGUgYGdhbWVMYXVuY2hlZGAgZXZlbnRcclxuICAgIHRoaXMuZW1pdCgnZ2FtZUxhdW5jaGVkJywgZ2FtZUxhdW5jaGVkRXZlbnQpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmFuIHdoZW4gYSBnYW1lIHdhcyBjbG9zZWRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZnVsbFNodXRkb3duIC0gSXMgdGhpcyBhIGZ1bGwgc2h1dGRvd24gb3Igbm90P1xyXG4gICAqXHJcbiAgICogKkFsdGVybmF0aXZlbHkgLSBkaWQgdGhlIGdhbWUgc2Vzc2lvbiBlbmQsIG9yIGRpZCB0aGUgZ2FtZSBzaW1wbHkgY2hhbmdlPypcclxuICAgKi9cclxuICBwcml2YXRlIGdhbWVDbG9zZWQoZnVsbFNodXRkb3duOiBib29sZWFuKSB7XHJcbiAgICAvLyBFbnN1cmUgdGhhdCB0aGVyZSBpcyBhIGdhbWUgcnVubmluZyBiZWZvcmUgcnVubmluZyBgZ2FtZUNsb3NlZGAgbG9naWNcclxuICAgIGlmICghdGhpcy5fcnVubmluZ0dhbWUpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAnQ2Fubm90IHJ1biBgZ2FtZUNsb3NlZGAgd2hlbiBubyBnYW1lIGlzIGN1cnJlbnRseSBydW5uaW5nIScsXHJcbiAgICAgICk7XHJcblxyXG4gICAgLy8gQ29uc3RydWN0IHRoZSBgZ2FtZUNsb3NlZGAgZXZlbnRcclxuICAgIGNvbnN0IGdhbWVDbG9zZWRFdmVudDogR2FtZUNsb3NlZEV2ZW50ID0ge1xyXG4gICAgICAuLi50aGlzLl9ydW5uaW5nR2FtZSxcclxuICAgIH07XHJcbiAgICAvLyBEZWxldGUgdGhlIGN1cnJlbnRseSBydW5uaW5nIGdhbWVcclxuICAgIHRoaXMuX3J1bm5pbmdHYW1lID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIC8vIEVtaXQgdGhlIGBnYW1lQ2xvc2VkYCBldmVudFxyXG4gICAgdGhpcy5lbWl0KCdnYW1lQ2xvc2VkJywgZ2FtZUNsb3NlZEV2ZW50KTtcclxuXHJcbiAgICAvLyBJZiBwb3N0LWdhbWUgbG9naWMgc2hvdWxkIHJ1biwgZW1pdCB0aGUgYHBvc3RnYW1lYCBldmVudFxyXG4gICAgaWYgKGZ1bGxTaHV0ZG93bikge1xyXG4gICAgICAvLyBDb25zdHJ1Y3QgdGhlIGBwb3N0R2FtZWAgZXZlbnRcclxuICAgICAgY29uc3QgcG9zdEdhbWVFdmVudDogUG9zdEdhbWVFdmVudCA9IHtcclxuICAgICAgICAuLi5nYW1lQ2xvc2VkRXZlbnQsXHJcbiAgICAgIH07XHJcbiAgICAgIC8vIEVtaXQgdGhlIGBwb3N0R2FtZWAgZXZlbnRcclxuICAgICAgdGhpcy5lbWl0KCdwb3N0R2FtZScsIHBvc3RHYW1lRXZlbnQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmFuIHdoZW4gdGhlIGN1cnJlbnRseSBhY3RpdmUgZ2FtZSdzIEdhbWVJbmZvIGlzIHVwZGF0ZWRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuR2FtZUluZm9VcGRhdGVkRXZlbnR9IHVwZGF0ZUV2ZW50XHJcbiAgICogLSBUaGUgR2FtZUluZm8gdXBkYXRlZCBldmVudFxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2FtZVVwZGF0ZWQodXBkYXRlRXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLkdhbWVJbmZvVXBkYXRlZEV2ZW50KSB7XHJcbiAgICAvKipcclxuICAgICAqIERpZCBhIG5ldyBnYW1lIGp1c3QgZ2V0IGxhdW5jaGVkP1xyXG4gICAgICpcclxuICAgICAqIFRoaXMgY291bGQgdGVjaG5pY2FsbHkgYmUgZG9uZSB1c2luZyBgb3ZlcndvbGYuZ2FtZXMub25HYW1lTGF1bmNoZWRgLlxyXG4gICAgICogSG93ZXZlciwgYXMgd2UgYWxyZWFkeSBuZWVkIHRvIHV0aWxpemUgYG92ZXJ3b2xmLmdhbWVzLm9uR2FtZUluZm9VcGRhdGVkYFxyXG4gICAgICogdG8gZGV0ZWN0IGlmIGEgZ2FtZSB3YXMgdGVybWluYXRlZCwgaXQgaXMgZWFzaWVyIHRvIGp1c3QgdXNlIGl0IGZvciBib3RoLlxyXG4gICAgICovXHJcbiAgICBpZiAoXHJcbiAgICAgIHVwZGF0ZUV2ZW50LnJlYXNvbi5pbmNsdWRlcyhcclxuICAgICAgICBvdmVyd29sZi5nYW1lcy5lbnVtcy5HYW1lSW5mb0NoYW5nZVJlYXNvbi5HYW1lTGF1bmNoZWQsXHJcbiAgICAgIClcclxuICAgICkge1xyXG4gICAgICAvLyBJcyB0aGVyZSBhIGdhbWUgYWxyZWFkeSBydW5uaW5nP1xyXG4gICAgICBpZiAodGhpcy5fcnVubmluZ0dhbWUpIHtcclxuICAgICAgICAvLyBSdW4gZ2FtZSBjbG9zZWQgY2xlYW51cCwgd2l0aG91dCBydW5uaW5nIHBvc3QtZ2FtZSBsb2dpY1xyXG4gICAgICAgIHRoaXMuZ2FtZUNsb3NlZChmYWxzZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qIFJ1biBnYW1lIGxhdW5jaGVkIGxvZ2ljIGZvciB0aGUgbmV3IGxhdW5jaGVkIGdhbWUsIGFzIGEgZnJlc2ggbGF1bmNoLFxyXG4gICAgICAgKiBhcyBpdCB3YXMgZGV0ZWN0ZWQgZnJvbSB0aGUgbW9tZW50IGl0IHdhcyBsYXVuY2hlZFxyXG4gICAgICAgKi9cclxuICAgICAgdGhpcy5nYW1lTGF1bmNoZWQoXHJcbiAgICAgICAgdXBkYXRlRXZlbnQuZ2FtZUluZm8gYXMgb3ZlcndvbGYuZ2FtZXMuUnVubmluZ0dhbWVJbmZvLFxyXG4gICAgICAgIHRydWUsXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICAvLyBJZiB0aGUgZ2FtZSB3YXMgdGVybWluYXRlZFxyXG4gICAgZWxzZSBpZiAoXHJcbiAgICAgIHVwZGF0ZUV2ZW50LnJlYXNvbi5pbmNsdWRlcyhcclxuICAgICAgICBvdmVyd29sZi5nYW1lcy5lbnVtcy5HYW1lSW5mb0NoYW5nZVJlYXNvbi5HYW1lVGVybWluYXRlZCxcclxuICAgICAgKVxyXG4gICAgKSB7XHJcbiAgICAgIC8vIFJ1biBnYW1lIGNsb3NlZCBjbGVhbnVwLCBpbmNsdWRpbmcgcG9zdC1nYW1lIGxvZ2ljXHJcbiAgICAgIHRoaXMuZ2FtZUNsb3NlZCh0cnVlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHRlciBmb3IgdGhlIGN1cnJlbnRseSBhY3RpdmUgZ2FtZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge251bWJlciB8IHVuZGVmaW5lZH0gVGhlIGN1cnJlbnRseSBydW5uaW5nIGdhbWUgKGlmIGFueSlcclxuICAgKi9cclxuICBwdWJsaWMgY3VycmVudGx5UnVubmluZ0dhbWUoKTogUnVubmluZ0dhbWUgfCB1bmRlZmluZWQge1xyXG4gICAgcmV0dXJuIHRoaXMuX3J1bm5pbmdHYW1lO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBpbmplY3RhYmxlIH0gZnJvbSAndHN5cmluZ2UnO1xyXG5cclxuQGluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgR0VQQ29uc3VtZXIge1xyXG4gIC8qKlxyXG4gICAqIENvbnN1bWVzIGVycm9ycyBmaXJlZCBieSB0aGUgT3ZlcndvbGYgR0VQXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5FcnJvckV2ZW50fSBlcnJvciAtIEEgZmlyZWQgZXJyb3IgZXZlbnRcclxuICAgKi9cclxuICBwdWJsaWMgb25HRVBFcnJvcihlcnJvcjogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkVycm9yRXZlbnQpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoYEdFUCBFcnJvcjogJHtwcmV0dGlmeShlcnJvcil9YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdW1lcyBnYW1lIGluZm8gdXBkYXRlcyBmaXJlZCBieSB0aGUgT3ZlcndvbGYgR0VQXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgKiAgc3RyaW5nLFxyXG4gICAqICBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgKiA+fSBpbmZvIC0gQW4gYXJyYXkgb2YgZmlyZWQgaW5mbyB1cGRhdGVzXHJcbiAgICovXHJcbiAgcHVibGljIG9uR2FtZUluZm9VcGRhdGUoXHJcbiAgICBpbmZvOiBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICAgIHN0cmluZyxcclxuICAgICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICA+LFxyXG4gICkge1xyXG4gICAgY29uc29sZS5sb2coYEdhbWUgSW5mbyBDaGFuZ2VkOiAke3ByZXR0aWZ5KGluZm8pfWApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3VtZXMgdGhlIGdhbWUgZXZlbnRzIGZpcmVkIGJ5IHRoZSBPdmVyd29sZiBHRVBcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHN9IGV2ZW50XHJcbiAgICogLSBBbiBhcnJheSBvZiBmaXJlZCBHYW1lIEV2ZW50c1xyXG4gICAqL1xyXG4gIHB1YmxpYyBvbk5ld0dhbWVFdmVudChldmVudDogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHMpIHtcclxuICAgIGNvbnNvbGUubG9nKGBHYW1lIEV2ZW50IEZpcmVkOiAke3ByZXR0aWZ5KGV2ZW50KX1gKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGb3JtYXQvcHJldHRpZnkgR0VQIGRhdGEgZm9yIGxvZ2dpbmcvZGlzcGxheVxyXG4gKlxyXG4gKiBAcGFyYW0ge2FueX0gZGF0YSAtIFRoZSBkYXRhIHRvIGJlIHByZXR0aWZpZWRcclxuICogQHJldHVybnMge3N0cmluZ30gQSBwcmV0dGlmaWVkIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgaW5wdXQgZGF0YVxyXG4gKi9cclxuY29uc3QgcHJldHRpZnkgPSAoZGF0YTogYW55KTogc3RyaW5nID0+IHtcclxuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZGF0YSwgdW5kZWZpbmVkLCA0KTtcclxufTtcclxuIiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcclxuaW1wb3J0IHsgaW5qZWN0YWJsZSB9IGZyb20gJ3RzeXJpbmdlJztcclxuaW1wb3J0IHsgR2FtZUZpbGVOYW1lLCBHYW1lS2V5IH0gZnJvbSAnLi4vY29uZmlnL2dhbWUtZGF0YSc7XHJcbmltcG9ydCB7IGVudmlyb25tZW50IH0gZnJvbSAnLi4vZW52aXJvbm1lbnQvZW52aXJvbm1lbnQnO1xyXG5cclxuQGluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgR0VQU2VydmljZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XHJcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IFtdO1xyXG4gIHByaXZhdGUgaW5mbzogYW55ID0gW107XHJcbiAgcHVibGljIGdhbWVMYXVuY2hJZDogbnVsbCB8IG51bWJlciA9IG51bGw7XHJcblxyXG4gIGdldERhdGFCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2V0LWRhdGEtYnV0dG9uJyk7XHJcbiAgdXNlckRhdGEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXNlci1kYXRhJyk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMub25FcnJvckxpc3RlbmVyID0gdGhpcy5vbkVycm9yTGlzdGVuZXIuYmluZCh0aGlzKTtcclxuICAgIHRoaXMub25JbmZvVXBkYXRlTGlzdGVuZXIgPSB0aGlzLm9uSW5mb1VwZGF0ZUxpc3RlbmVyLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLm9uR2FtZUV2ZW50TGlzdGVuZXIgPSB0aGlzLm9uR2FtZUV2ZW50TGlzdGVuZXIuYmluZCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLmdldERhdGFCdXR0b24/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICB0aGlzLmdldEZyb21EYXRhQmFzZSgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTYXZlIGRhdGEgdG8gZGJcclxuICAgKlxyXG4gICAqL1xyXG5cclxuICBhc3luYyBzYXZlVG9EYXRhQmFzZSgpIHtcclxuICAgIGNvbnNvbGUubG9nKCdzYXZlVG9EYXRhQmFzZSB3b3JrZWQnKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGZpbGVOYW1lID1cclxuICAgICAgICBHYW1lRmlsZU5hbWVbdGhpcy5nYW1lTGF1bmNoSWQgYXMga2V5b2YgdHlwZW9mIEdhbWVGaWxlTmFtZV07XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7ZW52aXJvbm1lbnQudXJsfS9nYW1lLWRhdGEvd3JpdGVgLCB7XHJcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgZXZlbnRzOiB0aGlzLmV2ZW50cyxcclxuICAgICAgICAgICAgaW5mbzogdGhpcy5pbmZvLFxyXG4gICAgICAgICAgICBmaWxlTmFtZTogZmlsZU5hbWUgfHwgbnVsbCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSksXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLmV2ZW50cyA9IFtdO1xyXG4gICAgICB0aGlzLmluZm8gPSBbXTtcclxuXHJcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzYXZpbmcgdG8gZGF0YWJhc2U6JywgcmVzcG9uc2Uuc3RhdHVzVGV4dCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdEYXRhIHNhdmVkIHRvIGRhdGFiYXNlOicsIHJlc3VsdCk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgdGhpcy5ldmVudHMgPSBbXTtcclxuICAgICAgdGhpcy5pbmZvID0gW107XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGRhdGEgZnJvbSBkYlxyXG4gICAqXHJcbiAgICovXHJcblxyXG4gIGFzeW5jIGdldEZyb21EYXRhQmFzZSgpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHNlc3Npb25JZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzZXNzaW9uSWQnKTtcclxuICAgICAgaWYgKCFzZXNzaW9uSWQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXHJcbiAgICAgICAgYCR7ZW52aXJvbm1lbnQudXJsfT9zZXNzaW9uSWQ9JHtzZXNzaW9uSWR9YCxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXNwb25zZS5qc29uKCkudGhlbigoZGF0YSkgPT4ge1xyXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvYmFuLXRzLWNvbW1lbnRcclxuICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgdGhpcy51c2VyRGF0YT8uaW5uZXJUZXh0ID0gSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMik7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN1bWVzIHRoZSBnYW1lIGV2ZW50cyBmaXJlZCBieSB0aGUgT3ZlcndvbGYgR0VQXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwdWJsaWMgb25OZXdHYW1lRXZlbnQoZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzKSB7XHJcbiAgICBzd2l0Y2ggKHRoaXMuZ2FtZUxhdW5jaElkKSB7XHJcbiAgICAgIGNhc2UgR2FtZUtleS5BcGV4TGVnZW5kczpcclxuICAgICAgICB0aGlzLmhhbmRsZUFwZXhMZWdlbmRzRXZlbnRzKGV2ZW50KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LlJvY2tldExlYWd1ZTpcclxuICAgICAgICB0aGlzLmhhbmRsZVJvY2tldExlYWd1ZUV2ZW50cyhldmVudCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgR2FtZUtleS5Gb3J0bml0ZTpcclxuICAgICAgICB0aGlzLmhhbmRsZUZvcnRuaXRlRXZlbnRzKGV2ZW50KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LlZhbG9yYW50OlxyXG4gICAgICAgIHRoaXMuaGFuZGxlVmFsb3JhbnRFdmVudHMoZXZlbnQpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEdhbWVLZXkuTGVhZ3VlT2ZMZWdlbmRzOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlTGVhZ3VlT2ZMZWdlbmRzRXZlbnRzKGV2ZW50KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LlBVQkc6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVQVUJHRXZlbnRzKGV2ZW50KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LkNTMjpcclxuICAgICAgICB0aGlzLmhhbmRsZUNTMkV2ZW50cyhldmVudCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdW1lcyBnYW1lIGluZm8gdXBkYXRlcyBmaXJlZCBieSB0aGUgT3ZlcndvbGYgR0VQXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgKiAgc3RyaW5nLFxyXG4gICAqICBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgKiA+fSBpbmZvIC0gQW4gYXJyYXkgb2YgZmlyZWQgaW5mbyB1cGRhdGVzXHJcbiAgICovXHJcbiAgcHVibGljIG9uR2FtZUluZm9VcGRhdGUoXHJcbiAgICBpbmZvOiBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICAgIHN0cmluZyxcclxuICAgICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICA+LFxyXG4gICkge1xyXG4gICAgaWYgKCFpbmZvLmluZm8pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHN3aXRjaCAodGhpcy5nYW1lTGF1bmNoSWQpIHtcclxuICAgICAgY2FzZSBHYW1lS2V5LlJvY2tldExlYWd1ZTpcclxuICAgICAgICB0aGlzLmhhbmRsZVJvY2tldExlYWd1ZUluZm8oaW5mbyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgR2FtZUtleS5Gb3J0bml0ZTpcclxuICAgICAgICB0aGlzLmhhbmRsZUZvcnRuaXRlSW5mbyhpbmZvKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LlZhbG9yYW50OlxyXG4gICAgICAgIHRoaXMuaGFuZGxlVmFsb3JhbnRJbmZvKGluZm8pO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEdhbWVLZXkuTGVhZ3VlT2ZMZWdlbmRzOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlTGVhZ3VlT2ZMZWdlbmRzSW5mbyhpbmZvKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LlBVQkc6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVQVUJHSW5mbyhpbmZvKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSBBcGV4IExlZ2VuZHMgZXZlbnRzIGZpcmVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZUFwZXhMZWdlbmRzRXZlbnRzKFxyXG4gICAgZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzLFxyXG4gICk6IHZvaWQge1xyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1sZW5cclxuICAgIGNvbnN0IGtpbGxGZWVkRXZlbnQgPSBldmVudC5ldmVudHMuZmluZChcclxuICAgICAgKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ2tpbGxfZmVlZCcsXHJcbiAgICApO1xyXG4gICAgaWYgKGtpbGxGZWVkRXZlbnQpIHtcclxuICAgICAgY29uc3Qga2lsbEZlZWRFdmVudERhdGFQYXJzZWQgPSBKU09OLnBhcnNlKGtpbGxGZWVkRXZlbnQuZGF0YSk7XHJcbiAgICAgIGNvbnN0IHJlc3VsdERhdGEgPSB7XHJcbiAgICAgICAgbG9jYWxfcGxheWVyX25hbWU6IGtpbGxGZWVkRXZlbnREYXRhUGFyc2VkLmxvY2FsX3BsYXllcl9uYW1lLFxyXG4gICAgICAgIHZpY3RpbU5hbWU6IGtpbGxGZWVkRXZlbnREYXRhUGFyc2VkLnZpY3RpbU5hbWUsXHJcbiAgICAgICAgYWN0aW9uOiBraWxsRmVlZEV2ZW50RGF0YVBhcnNlZC5hY3Rpb24sXHJcbiAgICAgIH07XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2gocmVzdWx0RGF0YSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaEVuZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoXHJcbiAgICAgIChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaF9lbmQnLFxyXG4gICAgKTtcclxuICAgIGlmIChtYXRjaEVuZEV2ZW50ICYmIHRoaXMuZXZlbnRzLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHtcclxuICAgICAgICBuYW1lOiBtYXRjaEVuZEV2ZW50Lm5hbWUsXHJcbiAgICAgICAgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLnNhdmVUb0RhdGFCYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgUm9ja2V0IExlYWd1ZSBldmVudHMgZmlyZWRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHN9IGV2ZW50XHJcbiAgICogLSBBbiBhcnJheSBvZiBmaXJlZCBHYW1lIEV2ZW50c1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlUm9ja2V0TGVhZ3VlRXZlbnRzKFxyXG4gICAgZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzLFxyXG4gICk6IHZvaWQge1xyXG4gICAgY29uc3QgZ29hbEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ2dvYWwnKTtcclxuICAgIGlmIChnb2FsRXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChnb2FsRXZlbnQpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc2NvcmVFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdzY29yZScpO1xyXG4gICAgaWYgKHNjb3JlRXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChzY29yZUV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1hdGNoRW5kRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnbWF0Y2hFbmQnKTtcclxuICAgIGlmIChtYXRjaEVuZEV2ZW50ICYmICh0aGlzLmluZm8ubGVuZ3RoIHx8IHRoaXMuZXZlbnRzLmxlbmd0aCkpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaCh7XHJcbiAgICAgICAgbmFtZTogbWF0Y2hFbmRFdmVudC5uYW1lLFxyXG4gICAgICAgIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9LFxyXG4gICAgICB9KTtcclxuICAgICAgdGhpcy5zYXZlVG9EYXRhQmFzZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIFJvY2tldCBMZWFndWUgaW5mbyB1cGRhdGVzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgKiAgc3RyaW5nLFxyXG4gICAqICBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgKiA+fSBpbmZvIC0gQW4gYXJyYXkgb2YgZmlyZWQgaW5mbyB1cGRhdGVzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVSb2NrZXRMZWFndWVJbmZvKGluZm86IGFueSkge1xyXG4gICAgaWYgKFxyXG4gICAgICBpbmZvLmluZm8ubWF0Y2hTdGF0ZSAmJlxyXG4gICAgICAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGluZm8uaW5mby5tYXRjaFN0YXRlLCAnc3RhcnRlZCcpIHx8XHJcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGluZm8uaW5mby5tYXRjaFN0YXRlLCAnZW5kZWQnKSlcclxuICAgICkge1xyXG4gICAgICB0aGlzLmluZm8ucHVzaCh7XHJcbiAgICAgICAgbWF0Y2hTdGF0ZTogaW5mby5pbmZvLm1hdGNoU3RhdGUsXHJcbiAgICAgICAgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpbmZvLmluZm8ucGxheWVyc0luZm8pIHtcclxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGFycmF5LWNhbGxiYWNrLXJldHVyblxyXG4gICAgICBPYmplY3Qua2V5cyhpbmZvLmluZm8ucGxheWVyc0luZm8pLm1hcCgoaXRlbSkgPT4ge1xyXG4gICAgICAgIGlmIChpdGVtLm1hdGNoKC9wbGF5ZXIoWzAtOV0rKS9naSkpIHtcclxuICAgICAgICAgIHRoaXMuaW5mby5wdXNoKGluZm8uaW5mbyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSBGb3J0bml0ZSBldmVudHMgZmlyZWRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHN9IGV2ZW50XHJcbiAgICogLSBBbiBhcnJheSBvZiBmaXJlZCBHYW1lIEV2ZW50c1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlRm9ydG5pdGVFdmVudHMoXHJcbiAgICBldmVudDogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHMsXHJcbiAgKTogdm9pZCB7XHJcbiAgICBjb25zdCBraWxsZWRFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdraWxsZWQnKTtcclxuICAgIGlmIChraWxsZWRFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGtpbGxlZEV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlYXRoRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnZGVhdGgnKTtcclxuICAgIGlmIChkZWF0aEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goZGVhdGhFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaFN0YXJ0RXZlbnQgPSBldmVudC5ldmVudHMuZmluZChcclxuICAgICAgKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ21hdGNoU3RhcnQnLFxyXG4gICAgKTtcclxuICAgIGlmIChtYXRjaFN0YXJ0RXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaCh7XHJcbiAgICAgICAgbmFtZTogbWF0Y2hTdGFydEV2ZW50Lm5hbWUsXHJcbiAgICAgICAgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWF0Y2hFbmRFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaEVuZCcpO1xyXG4gICAgaWYgKG1hdGNoRW5kRXZlbnQgJiYgKHRoaXMuaW5mby5sZW5ndGggfHwgdGhpcy5ldmVudHMubGVuZ3RoKSkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHtcclxuICAgICAgICBuYW1lOiBtYXRjaEVuZEV2ZW50Lm5hbWUsXHJcbiAgICAgICAgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLnNhdmVUb0RhdGFCYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgRm9ydG5pdGUgaW5mbyB1cGRhdGVzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgKiAgc3RyaW5nLFxyXG4gICAqICBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgKiA+fSBpbmZvIC0gQW4gYXJyYXkgb2YgZmlyZWQgaW5mbyB1cGRhdGVzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVGb3J0bml0ZUluZm8oaW5mbzogYW55KSB7XHJcbiAgICBpZiAoXHJcbiAgICAgIGluZm8uaW5mby5tYXRjaF9pbmZvICYmXHJcbiAgICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChpbmZvLmluZm8ubWF0Y2hfaW5mbywgJ3JhbmsnKVxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMuaW5mby5wdXNoKGluZm8uaW5mbyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgVmFsb3JhbnQgZXZlbnRzIGZpcmVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZVZhbG9yYW50RXZlbnRzKFxyXG4gICAgZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzLFxyXG4gICk6IHZvaWQge1xyXG4gICAgY29uc3QgbWF0Y2hTdGFydEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoXHJcbiAgICAgIChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaF9zdGFydCcsXHJcbiAgICApO1xyXG4gICAgaWYgKG1hdGNoU3RhcnRFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHtcclxuICAgICAgICBuYW1lOiBtYXRjaFN0YXJ0RXZlbnQubmFtZSxcclxuICAgICAgICBkYXRhOiB7IGRhdGU6IG5ldyBEYXRlKCkgfSxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaEVuZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoXHJcbiAgICAgIChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaF9lbmQnLFxyXG4gICAgKTtcclxuICAgIGlmIChtYXRjaEVuZEV2ZW50ICYmICh0aGlzLmluZm8ubGVuZ3RoIHx8IHRoaXMuZXZlbnRzLmxlbmd0aCkpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaCh7XHJcbiAgICAgICAgbmFtZTogbWF0Y2hFbmRFdmVudC5uYW1lLFxyXG4gICAgICAgIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9LFxyXG4gICAgICB9KTtcclxuICAgICAgdGhpcy5zYXZlVG9EYXRhQmFzZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIFZhbG9yYW50IGluZm8gdXBkYXRlc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICogIHN0cmluZyxcclxuICAgKiAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICogPn0gaW5mbyAtIEFuIGFycmF5IG9mIGZpcmVkIGluZm8gdXBkYXRlc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlVmFsb3JhbnRJbmZvKGluZm86IGFueSkge1xyXG4gICAgaWYgKFxyXG4gICAgICBpbmZvLmluZm8ubWF0Y2hfaW5mbyAmJlxyXG4gICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5mby5pbmZvLm1hdGNoX2luZm8sICdraWxsX2ZlZWQnKVxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMuaW5mby5wdXNoKGluZm8uaW5mbyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgTGVhZ3VlIG9mIExlZ2VuZHMgZXZlbnRzIGZpcmVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZUxlYWd1ZU9mTGVnZW5kc0V2ZW50cyhcclxuICAgIGV2ZW50OiBvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50cyxcclxuICApOiB2b2lkIHtcclxuICAgIGNvbnN0IGtpbGxFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdraWxsJyk7XHJcbiAgICBpZiAoa2lsbEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goa2lsbEV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlYXRoRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnZGVhdGgnKTtcclxuICAgIGlmIChkZWF0aEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goZGVhdGhFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaEVuZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoXHJcbiAgICAgIChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdhbm5vdW5jZXInLFxyXG4gICAgKTtcclxuICAgIGlmIChcclxuICAgICAgbWF0Y2hFbmRFdmVudCAmJlxyXG4gICAgICAodGhpcy5pbmZvLmxlbmd0aCB8fCB0aGlzLmV2ZW50cy5sZW5ndGgpICYmXHJcbiAgICAgIChtYXRjaEVuZEV2ZW50LmRhdGEuaW5jbHVkZXMoJ3ZpY3RvcnknKSB8fFxyXG4gICAgICAgIG1hdGNoRW5kRXZlbnQuZGF0YS5pbmNsdWRlcygnZGVmZWF0JykpXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChtYXRjaEVuZEV2ZW50KTtcclxuICAgICAgdGhpcy5zYXZlVG9EYXRhQmFzZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIExlYWd1ZSBvZiBMZWdlbmRzIGluZm8gdXBkYXRlc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICogIHN0cmluZyxcclxuICAgKiAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICogPn0gaW5mbyAtIEFuIGFycmF5IG9mIGZpcmVkIGluZm8gdXBkYXRlc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlTGVhZ3VlT2ZMZWdlbmRzSW5mbyhpbmZvOiBhbnkpIHtcclxuICAgIGlmIChcclxuICAgICAgaW5mby5pbmZvLmxpdmVfY2xpZW50X2RhdGEgJiZcclxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1sZW5cclxuICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKFxyXG4gICAgICAgIGluZm8uaW5mby5saXZlX2NsaWVudF9kYXRhLFxyXG4gICAgICAgICdhbGxfcGxheWVycycsXHJcbiAgICAgIClcclxuICAgICkge1xyXG4gICAgICB0aGlzLmluZm8ucHVzaChpbmZvLmluZm8pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIFBVQkcgZXZlbnRzIGZpcmVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZVBVQkdFdmVudHMoZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzKTogdm9pZCB7XHJcbiAgICBjb25zdCBraWxsRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAna2lsbCcpO1xyXG4gICAgaWYgKGtpbGxFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGtpbGxFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBraWxsZXJFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdraWxsZXInKTtcclxuICAgIGlmIChraWxsZXJFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGtpbGxlckV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlYXRoRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnZGVhdGgnKTtcclxuICAgIGlmIChkZWF0aEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goZGVhdGhFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaFN0YXJ0RXZlbnQgPSBldmVudC5ldmVudHMuZmluZChcclxuICAgICAgKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ21hdGNoU3RhcnQnLFxyXG4gICAgKTtcclxuICAgIGlmIChtYXRjaFN0YXJ0RXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaCh7XHJcbiAgICAgICAgbmFtZTogbWF0Y2hTdGFydEV2ZW50Lm5hbWUsXHJcbiAgICAgICAgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWF0Y2hTdW1tYXJ5RXZlbnQgPSBldmVudC5ldmVudHMuZmluZChcclxuICAgICAgKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ21hdGNoU3VtbWFyeScsXHJcbiAgICApO1xyXG4gICAgaWYgKG1hdGNoU3VtbWFyeUV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2gobWF0Y2hTdW1tYXJ5RXZlbnQpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWF0Y2hFbmRFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaEVuZCcpO1xyXG4gICAgaWYgKG1hdGNoRW5kRXZlbnQgJiYgKHRoaXMuaW5mby5sZW5ndGggfHwgdGhpcy5ldmVudHMubGVuZ3RoKSkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHtcclxuICAgICAgICBuYW1lOiBtYXRjaEVuZEV2ZW50Lm5hbWUsXHJcbiAgICAgICAgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLnNhdmVUb0RhdGFCYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgUFVCRyBpbmZvIHVwZGF0ZXNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGVzMkV2ZW50PFxyXG4gICAqICBzdHJpbmcsXHJcbiAgICogIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlMlxyXG4gICAqID59IGluZm8gLSBBbiBhcnJheSBvZiBmaXJlZCBpbmZvIHVwZGF0ZXNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZVBVQkdJbmZvKGluZm86IGFueSkge1xyXG4gICAgaWYgKFxyXG4gICAgICAoaW5mby5pbmZvLm1hdGNoX2luZm8gJiZcclxuICAgICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5mby5pbmZvLm1hdGNoX2luZm8sICdraWxscycpKSB8fFxyXG4gICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5mby5pbmZvLm1hdGNoX2luZm8sICdoZWFkc2hvdHMnKVxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMuaW5mby5wdXNoKGluZm8uaW5mbyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgQ1MyIGV2ZW50cyBmaXJlZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50c30gZXZlbnRcclxuICAgKiAtIEFuIGFycmF5IG9mIGZpcmVkIEdhbWUgRXZlbnRzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVDUzJFdmVudHMoZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzKTogdm9pZCB7XHJcbiAgICBjb25zdCBraWxsRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAna2lsbCcpO1xyXG4gICAgaWYgKGtpbGxFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGtpbGxFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkZWF0aEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ2RlYXRoJyk7XHJcbiAgICBpZiAoZGVhdGhFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGRlYXRoRXZlbnQpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qga2lsbEZlZWRFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKFxyXG4gICAgICAoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAna2lsbF9mZWVkJyxcclxuICAgICk7XHJcbiAgICBpZiAoa2lsbEZlZWRFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGtpbGxGZWVkRXZlbnQpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWF0Y2hTdGFydEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoXHJcbiAgICAgIChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaF9zdGFydCcsXHJcbiAgICApO1xyXG4gICAgaWYgKG1hdGNoU3RhcnRFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHtcclxuICAgICAgICBuYW1lOiBtYXRjaFN0YXJ0RXZlbnQubmFtZSxcclxuICAgICAgICBkYXRhOiB7IGRhdGU6IG5ldyBEYXRlKCkgfSxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaEVuZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoXHJcbiAgICAgIChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaF9lbmQnLFxyXG4gICAgKTtcclxuICAgIGNvbnNvbGUubG9nKG1hdGNoRW5kRXZlbnQsICdtYXRjaF9lbmQgZXZlbnQgbG9nIScpO1xyXG4gICAgaWYgKG1hdGNoRW5kRXZlbnQgJiYgKHRoaXMuaW5mby5sZW5ndGggfHwgdGhpcy5ldmVudHMubGVuZ3RoKSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnQ1MyIG1hdGNoX2VuZCBldmVudCB3b3JrZWQnKTtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaCh7XHJcbiAgICAgICAgbmFtZTogbWF0Y2hFbmRFdmVudC5uYW1lLFxyXG4gICAgICAgIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9LFxyXG4gICAgICB9KTtcclxuICAgICAgdGhpcy5zYXZlVG9EYXRhQmFzZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdCB0aGUgZmlyZWQgT3ZlcndvbGYgR0VQIEVycm9yXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5FcnJvckV2ZW50fSBlcnJvciAtIFRoZSBmaXJlZCBHRVAgZXJyb3JcclxuICAgKi9cclxuICBwcml2YXRlIG9uRXJyb3JMaXN0ZW5lcihlcnJvcjogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkVycm9yRXZlbnQpIHtcclxuICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlcnJvcik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbWl0IHRoZSBmaXJlZCBPdmVyd29sZiBHYW1lIEluZm8gVXBkYXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgKiBzdHJpbmcsXHJcbiAgICogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICogPn0gaW5mbyAtIFRoZSBmaXJlZCBpbmZvIHVwZGF0ZWRcclxuICAgKi9cclxuICBwcml2YXRlIG9uSW5mb1VwZGF0ZUxpc3RlbmVyKFxyXG4gICAgaW5mbzogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGVzMkV2ZW50PFxyXG4gICAgICBzdHJpbmcsXHJcbiAgICAgIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlMlxyXG4gICAgPixcclxuICApIHtcclxuICAgIHRoaXMudHJ5RW1pdCgnaW5mb1VwZGF0ZScsIGluZm8pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdCB0aGUgZmlyZWQgT3ZlcndvbGYgR2FtZSBFdmVudHMgYXMgZXZlbnRzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudHMgLSBUaGUgZmlyZWQgZ2FtZSBldmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIG9uR2FtZUV2ZW50TGlzdGVuZXIoZXZlbnRzOiBvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50cykge1xyXG4gICAgdGhpcy50cnlFbWl0KCdnYW1lRXZlbnQnLCBldmVudHMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXR0ZW1wdCB0byBlbWl0IGFuIGV2ZW50LlxyXG4gICAqIElmIHRoZXJlIGFyZSBubyBsaXN0ZW5lcnMgZm9yIHRoaXMgZXZlbnQsIGxvZyBpdCBhcyBhIHdhcm5pbmcuKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50XHJcbiAgICogQHBhcmFtIHthbnl9IHZhbHVlIC0gVGhlIHZhbHVlIG9mIHRoZSBldmVudFxyXG4gICAqL1xyXG4gIHByaXZhdGUgdHJ5RW1pdChldmVudDogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICBpZiAodGhpcy5saXN0ZW5lckNvdW50KGV2ZW50KSkge1xyXG4gICAgICB0aGlzLmVtaXQoZXZlbnQsIHZhbHVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUud2FybihgVW5oYW5kbGVkICR7ZXZlbnR9LCB3aXRoIHZhbHVlICR7dmFsdWV9YCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGFsbCBHRVAtcmVsYXRlZCBsb2dpYyB3aGVuIGEgZ2FtZSBpcyBsYXVuY2hlZFxyXG4gICAqXHJcbiAgICogSXQgaXMgcG9zc2libGUgdG8gcmVnaXN0ZXIgYWxsIGxpc3RlbmVycyBvbmNlIHdoZW4gc3RhcnRpbmcgdGhlIGFwcCwgYW5kXHJcbiAgICogdGhlbiBvbmx5IGRlLXJlZ2lzdGVyIHRoZW0gd2hlbiBjbG9zaW5nIHRoZSBhcHAgKGlmIGF0IGFsbCkuIFdlIGNob29zZVxyXG4gICAqIHRvIHJlZ2lzdGVyL2RlcmVnaXN0ZXIgdGhlbSBmb3IgZXZlcnkgZ2FtZSwgbW9zdGx5IGp1c3QgdG8gc2hvdyBob3cuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ1tdIHwgdW5kZWZpbmVkfSByZXF1aXJlZEZlYXR1cmVzXHJcbiAgICogLSBPcHRpb25hbCBsaXN0IG9mIHJlcXVpcmVkIGZlYXR1cmVzLiBJZ25vcmVkIGlmIHRoaXMgaXMgYSBHRVAgU0RLIGdhbWVcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmdbXSB8IHVuZGVmaW5lZD59XHJcbiAgICogQSBwcm9taXNlIHJlc29sdmluZyB0byB0aGUgZmVhdHVyZXMgdGhhdCB3ZXJlIHN1Y2Nlc3NmdWxseSBzZXQsXHJcbiAgICogb3IgdG8gbm90aGluZyBpZiB0aGlzIGlzIGEgR0VQIFNESyBnYW1lXHJcbiAgICogQHRocm93cyBFcnJvciBpZiBzZXR0aW5nIHRoZSByZXF1aXJlZCBmZWF0dXJlcyBmYWlsZWQgdG9vIG1hbnkgdGltZXNcclxuICAgKiAobmF0aXZlIEdFUCBvbmx5KVxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBvbkdhbWVMYXVuY2hlZChcclxuICAgIHJlcXVpcmVkRmVhdHVyZXM/OiBzdHJpbmdbXSxcclxuICApOiBQcm9taXNlPHN0cmluZ1tdIHwgdW5kZWZpbmVkPiB7XHJcbiAgICBjb25zb2xlLmxvZygnUmVnaXN0ZXJpbmcgR0VQIGxpc3RlbmVycycpO1xyXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50cygpO1xyXG4gICAgaWYgKHJlcXVpcmVkRmVhdHVyZXMpIHtcclxuICAgICAgY29uc29sZS5sb2coJ1JlZ2lzdGVyaW5nIHJlcXVpcmVkIGZlYXR1cmVzJyk7XHJcbiAgICAgIHJldHVybiB0aGlzLnNldFJlcXVpcmVkRmVhdHVyZXMocmVxdWlyZWRGZWF0dXJlcywgMTApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdHRVAgU0RLIGRldGVjdGVkLCBubyBuZWVkIHRvIHNldCByZXF1aXJlZCBmZWF0dXJlcycpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUnVuIGNsZWFudXAgbG9naWMgZm9yIHdoZW4gYSBnYW1lIHdhcyBjbG9zZWRcclxuICAgKi9cclxuICBwdWJsaWMgb25HYW1lQ2xvc2VkKCkge1xyXG4gICAgY29uc29sZS5sb2coJ1JlbW92aW5nIGFsbCBHRVAgbGlzdGVuZXJzJyk7XHJcbiAgICB0aGlzLnVucmVnaXN0ZXJFdmVudHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgcmVxdWlyZWQgZmVhdHVyZXMgZm9yIHRoZSBjdXJyZW50IGdhbWVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHJlcXVpcmVkRmVhdHVyZXNcclxuICAgKiAtIEFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIHJlcXVpcmVkIGZlYXR1cmVzIGZvciB0aGlzIGdhbWVcclxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4aW11bVJldHJpZXNcclxuICAgKiAtIFRoZSBtYXhpbXVtIGFtb3VudCBvZiBhdHRlbXB0cyBiZWZvcmUgZ2l2aW5nIHVwIG9uIHNldHRpbmdcclxuICAgKiB0aGUgcmVxdWlyZWQgZmVhdHVyZXNcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmdbXT59XHJcbiAgICogQSBwcm9taXNlIHJlc29sdmluZyB0byB0aGUgZmVhdHVyZXMgdGhhdCB3ZXJlIHN1Y2Nlc3NmdWxseSBzZXRcclxuICAgKiBAdGhyb3dzIEFuIGVycm9yIGlmIHNldHRpbmcgdGhlIHJlcXVpcmVkIGZlYXR1cmVzIGZhaWxlZCB0b28gbWFueSB0aW1lc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgYXN5bmMgc2V0UmVxdWlyZWRGZWF0dXJlcyhcclxuICAgIHJlcXVpcmVkRmVhdHVyZXM6IHN0cmluZ1tdLFxyXG4gICAgbWF4aW11bVJldHJpZXM6IG51bWJlcixcclxuICApOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heGltdW1SZXRyaWVzOyBpKyspIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBzdWNjZXNzID0gYXdhaXQgdGhpcy50cnlTZXRSZXF1aXJlZEZlYXR1cmVzKHJlcXVpcmVkRmVhdHVyZXMpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBSZXF1aXJlZCBmZWF0dXJlcyBzZXQ6ICR7c3VjY2Vzc31gKTtcclxuICAgICAgICBpZiAoc3VjY2Vzcy5sZW5ndGggPCByZXF1aXJlZEZlYXR1cmVzLmxlbmd0aClcclxuICAgICAgICAgIGNvbnNvbGUud2FybihcclxuICAgICAgICAgICAgYENvdWxkIG5vdCBzZXQgJHtyZXF1aXJlZEZlYXR1cmVzLmZpbHRlcihcclxuICAgICAgICAgICAgICAoZmVhdHVyZSkgPT4gIXN1Y2Nlc3MuaW5jbHVkZXMoZmVhdHVyZSksXHJcbiAgICAgICAgICAgICl9YCxcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHN1Y2Nlc3M7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oYENvdWxkIG5vdCBzZXQgcmVxdWlyZWQgZmVhdHVyZXM6ICR7SlNPTi5zdHJpbmdpZnkoZSl9YCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1JldHJ5aW5nIGluIDIgc2Vjb25kcycpO1xyXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDIwMDApKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRocm93IG5ldyBFcnJvcignQWJvcnRpbmcgcmVxdWlyZWQgZmVhdHVyZXMhJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdHRlbXB0cyB0byBzZXQgdGhlIHJlcXVpcmVkIGZlYXR1cmVzIGZvciB0aGlzIHNwZWNpZmljIGdhbWVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHJlcXVpcmVkRmVhdHVyZXNcclxuICAgKiAtIEFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIHJlcXVpcmVkIGZlYXR1cmVzIGZvciB0aGlzIGdhbWVcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmdbXT59XHJcbiAgICogQSBwcm9taXNlIHJlc29sdmluZyB0byB0aGUgZmVhdHVyZXMgdGhhdCB3ZXJlIHN1Y2Nlc3NmdWxseSBzZXRcclxuICAgKiBAdGhyb3dzIHtzdHJpbmd9IFRoZSBlcnJvciBtZXNzYWdlIGdpdmVuIGlmIHRoZSBmZWF0dXJlcyBmYWlsZWQgdG8gYmUgc2V0XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhc3luYyB0cnlTZXRSZXF1aXJlZEZlYXR1cmVzKFxyXG4gICAgcmVxdWlyZWRGZWF0dXJlczogc3RyaW5nW10sXHJcbiAgKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gICAgbGV0IHJlZ2lzdGVyZWQ6IChyZXN1bHQ6IHN0cmluZ1tdKSA9PiB2b2lkO1xyXG4gICAgbGV0IGZhaWxlZDogKHJlYXNvbjogc3RyaW5nKSA9PiB2b2lkO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhIHByb21pc2UsIGFuZCBzYXZlIGl0cyByZXNvbHZlL3JlamVjdCBjYWxsYmFja3NcclxuICAgIGNvbnN0IHByb21pc2U6IFByb21pc2U8c3RyaW5nW10+ID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICByZWdpc3RlcmVkID0gcmVzb2x2ZTtcclxuICAgICAgZmFpbGVkID0gcmVqZWN0O1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gVHJ5IHRvIHNldCB0aGUgcmVxdWlyZWQgZmVhdHVyZXNcclxuICAgIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5zZXRSZXF1aXJlZEZlYXR1cmVzKHJlcXVpcmVkRmVhdHVyZXMsIChyZXN1bHQpID0+IHtcclxuICAgICAgLy8gSWYgZmVhdHVyZXMgZmFpbGVkIHRvIGJlIHNldFxyXG4gICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XHJcbiAgICAgICAgLy8gRmFpbCB0aGUgY3VycmVudCBhdHRlbXB0IHdpdGggdGhlIGVycm9yIG1lc3NhZ2VcclxuICAgICAgICByZXR1cm4gZmFpbGVkKHJlc3VsdC5lcnJvciBhcyBzdHJpbmcpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBBcHByb3ZlIHRoZSBjdXJyZW50IGF0dGVtcHQsIGFuZCByZXR1cm4gdGhlIGxpc3Qgb2Ygc2V0IGZlYXR1cmVzXHJcbiAgICAgIHJlZ2lzdGVyZWQocmVzdWx0LnN1cHBvcnRlZEZlYXR1cmVzIGFzIHN0cmluZ1tdKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJldHVybiB0aGUgZHVtbXkgcHJvbWlzZVxyXG4gICAgcmV0dXJuIHByb21pc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWdpc3RlciBhbGwgR0VQIGxpc3RlbmVyc1xyXG4gICAqL1xyXG4gIHB1YmxpYyByZWdpc3RlckV2ZW50cygpIHtcclxuICAgIC8vIFJlZ2lzdGVyIGVycm9ycyBsaXN0ZW5lclxyXG4gICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLm9uRXJyb3IuYWRkTGlzdGVuZXIodGhpcy5vbkVycm9yTGlzdGVuZXIpO1xyXG5cclxuICAgIC8vIFJlZ2lzdGVyIEluZm8gVXBkYXRlIGxpc3RlbmVyXHJcbiAgICBvdmVyd29sZi5nYW1lcy5ldmVudHMub25JbmZvVXBkYXRlczIuYWRkTGlzdGVuZXIodGhpcy5vbkluZm9VcGRhdGVMaXN0ZW5lcik7XHJcblxyXG4gICAgLy8gUmVnaXN0ZXIgR2FtZSBldmVudCBsaXN0ZW5lclxyXG4gICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLm9uTmV3RXZlbnRzLmFkZExpc3RlbmVyKHRoaXMub25HYW1lRXZlbnRMaXN0ZW5lcik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZS1yZWdpc3RlciBhbGwgR0VQIGxpc3RlbmVyc1xyXG4gICAqL1xyXG4gIHB1YmxpYyB1bnJlZ2lzdGVyRXZlbnRzKCkge1xyXG4gICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLm9uRXJyb3IucmVtb3ZlTGlzdGVuZXIodGhpcy5vbkVycm9yTGlzdGVuZXIpO1xyXG4gICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLm9uSW5mb1VwZGF0ZXMyLnJlbW92ZUxpc3RlbmVyKFxyXG4gICAgICB0aGlzLm9uSW5mb1VwZGF0ZUxpc3RlbmVyLFxyXG4gICAgKTtcclxuICAgIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5vbk5ld0V2ZW50cy5yZW1vdmVMaXN0ZW5lcih0aGlzLm9uR2FtZUV2ZW50TGlzdGVuZXIpO1xyXG4gIH1cclxufVxyXG4iLCIvKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xyXG4gICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcclxuICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2Fzc2lnbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uIF9fYXNzaWduKHQpIHtcclxuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcclxuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKSB0W3BdID0gc1twXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVzdChzLCBlKSB7XHJcbiAgICB2YXIgdCA9IHt9O1xyXG4gICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApICYmIGUuaW5kZXhPZihwKSA8IDApXHJcbiAgICAgICAgdFtwXSA9IHNbcF07XHJcbiAgICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHAgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHMpOyBpIDwgcC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMCAmJiBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwocywgcFtpXSkpXHJcbiAgICAgICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgICAgICB9XHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcclxuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xyXG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcclxuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3BhcmFtKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XHJcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jcmVhdGVCaW5kaW5nKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIGV4cG9ydHMpIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFleHBvcnRzLmhhc093blByb3BlcnR5KHApKSBleHBvcnRzW3BdID0gbVtwXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIGlmIChvICYmIHR5cGVvZiBvLmxlbmd0aCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBvICYmIG9baSsrXSwgZG9uZTogIW8gfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzID8gXCJPYmplY3QgaXMgbm90IGl0ZXJhYmxlLlwiIDogXCJTeW1ib2wuaXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZWFkKG8sIG4pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcclxuICAgIGlmICghbSkgcmV0dXJuIG87XHJcbiAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkKCkge1xyXG4gICAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheXMoKSB7XHJcbiAgICBmb3IgKHZhciBzID0gMCwgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHMgKz0gYXJndW1lbnRzW2ldLmxlbmd0aDtcclxuICAgIGZvciAodmFyIHIgPSBBcnJheShzKSwgayA9IDAsIGkgPSAwOyBpIDwgaWw7IGkrKylcclxuICAgICAgICBmb3IgKHZhciBhID0gYXJndW1lbnRzW2ldLCBqID0gMCwgamwgPSBhLmxlbmd0aDsgaiA8IGpsOyBqKyssIGsrKylcclxuICAgICAgICAgICAgcltrXSA9IGFbal07XHJcbiAgICByZXR1cm4gcjtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0KHYpIHtcclxuICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgX19hd2FpdCA/ICh0aGlzLnYgPSB2LCB0aGlzKSA6IG5ldyBfX2F3YWl0KHYpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0dlbmVyYXRvcih0aGlzQXJnLCBfYXJndW1lbnRzLCBnZW5lcmF0b3IpIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgZyA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSwgaSwgcSA9IFtdO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiKSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlmIChnW25dKSBpW25dID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChhLCBiKSB7IHEucHVzaChbbiwgdiwgYSwgYl0pID4gMSB8fCByZXN1bWUobiwgdik7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiByZXN1bWUobiwgdikgeyB0cnkgeyBzdGVwKGdbbl0odikpOyB9IGNhdGNoIChlKSB7IHNldHRsZShxWzBdWzNdLCBlKTsgfSB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKHIpIHsgci52YWx1ZSBpbnN0YW5jZW9mIF9fYXdhaXQgPyBQcm9taXNlLnJlc29sdmUoci52YWx1ZS52KS50aGVuKGZ1bGZpbGwsIHJlamVjdCkgOiBzZXR0bGUocVswXVsyXSwgcik7IH1cclxuICAgIGZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHsgcmVzdW1lKFwibmV4dFwiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHJlamVjdCh2YWx1ZSkgeyByZXN1bWUoXCJ0aHJvd1wiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShmLCB2KSB7IGlmIChmKHYpLCBxLnNoaWZ0KCksIHEubGVuZ3RoKSByZXN1bWUocVswXVswXSwgcVswXVsxXSk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNEZWxlZ2F0b3Iobykge1xyXG4gICAgdmFyIGksIHA7XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIsIGZ1bmN0aW9uIChlKSB7IHRocm93IGU7IH0pLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlbbl0gPSBvW25dID8gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIChwID0gIXApID8geyB2YWx1ZTogX19hd2FpdChvW25dKHYpKSwgZG9uZTogbiA9PT0gXCJyZXR1cm5cIiB9IDogZiA/IGYodikgOiB2OyB9IDogZjsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY1ZhbHVlcyhvKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIG0gPSBvW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSwgaTtcclxuICAgIHJldHVybiBtID8gbS5jYWxsKG8pIDogKG8gPSB0eXBlb2YgX192YWx1ZXMgPT09IFwiZnVuY3Rpb25cIiA/IF9fdmFsdWVzKG8pIDogb1tTeW1ib2wuaXRlcmF0b3JdKCksIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiKSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpKTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpW25dID0gb1tuXSAmJiBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyB2ID0gb1tuXSh2KSwgc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgdi5kb25lLCB2LnZhbHVlKTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShyZXNvbHZlLCByZWplY3QsIGQsIHYpIHsgUHJvbWlzZS5yZXNvbHZlKHYpLnRoZW4oZnVuY3Rpb24odikgeyByZXNvbHZlKHsgdmFsdWU6IHYsIGRvbmU6IGQgfSk7IH0sIHJlamVjdCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWFrZVRlbXBsYXRlT2JqZWN0KGNvb2tlZCwgcmF3KSB7XHJcbiAgICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb29rZWQsIFwicmF3XCIsIHsgdmFsdWU6IHJhdyB9KTsgfSBlbHNlIHsgY29va2VkLnJhdyA9IHJhdzsgfVxyXG4gICAgcmV0dXJuIGNvb2tlZDtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydFN0YXIobW9kKSB7XHJcbiAgICBpZiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSByZXR1cm4gbW9kO1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgaWYgKG1vZCAhPSBudWxsKSBmb3IgKHZhciBrIGluIG1vZCkgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIHJlc3VsdFtrXSA9IG1vZFtrXTtcclxuICAgIHJlc3VsdC5kZWZhdWx0ID0gbW9kO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBwcml2YXRlTWFwKSB7XHJcbiAgICBpZiAoIXByaXZhdGVNYXAuaGFzKHJlY2VpdmVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gZ2V0IHByaXZhdGUgZmllbGQgb24gbm9uLWluc3RhbmNlXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByaXZhdGVNYXAuZ2V0KHJlY2VpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRTZXQocmVjZWl2ZXIsIHByaXZhdGVNYXAsIHZhbHVlKSB7XHJcbiAgICBpZiAoIXByaXZhdGVNYXAuaGFzKHJlY2VpdmVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gc2V0IHByaXZhdGUgZmllbGQgb24gbm9uLWluc3RhbmNlXCIpO1xyXG4gICAgfVxyXG4gICAgcHJpdmF0ZU1hcC5zZXQocmVjZWl2ZXIsIHZhbHVlKTtcclxuICAgIHJldHVybiB2YWx1ZTtcclxufVxyXG4iLCJpbXBvcnQgeyBfX2V4dGVuZHMsIF9fcmVhZCwgX19zcHJlYWQgfSBmcm9tIFwidHNsaWJcIjtcbmltcG9ydCB7IGdldFBhcmFtSW5mbyB9IGZyb20gXCIuLi9yZWZsZWN0aW9uLWhlbHBlcnNcIjtcbmltcG9ydCB7IGluc3RhbmNlIGFzIGdsb2JhbENvbnRhaW5lciB9IGZyb20gXCIuLi9kZXBlbmRlbmN5LWNvbnRhaW5lclwiO1xuaW1wb3J0IHsgaXNUb2tlbkRlc2NyaXB0b3IsIGlzVHJhbnNmb3JtRGVzY3JpcHRvciB9IGZyb20gXCIuLi9wcm92aWRlcnMvaW5qZWN0aW9uLXRva2VuXCI7XG5pbXBvcnQgeyBmb3JtYXRFcnJvckN0b3IgfSBmcm9tIFwiLi4vZXJyb3ItaGVscGVyc1wiO1xuZnVuY3Rpb24gYXV0b0luamVjdGFibGUoKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgdmFyIHBhcmFtSW5mbyA9IGdldFBhcmFtSW5mbyh0YXJnZXQpO1xuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgICAgIF9fZXh0ZW5kcyhjbGFzc18xLCBfc3VwZXIpO1xuICAgICAgICAgICAgZnVuY3Rpb24gY2xhc3NfMSgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9zdXBlci5hcHBseSh0aGlzLCBfX3NwcmVhZChhcmdzLmNvbmNhdChwYXJhbUluZm8uc2xpY2UoYXJncy5sZW5ndGgpLm1hcChmdW5jdGlvbiAodHlwZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNUb2tlbkRlc2NyaXB0b3IodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNUcmFuc2Zvcm1EZXNjcmlwdG9yKHR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0eXBlLm11bHRpcGxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IChfYSA9IGdsb2JhbENvbnRhaW5lclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXNvbHZlKHR5cGUudHJhbnNmb3JtKSkudHJhbnNmb3JtLmFwcGx5KF9hLCBfX3NwcmVhZChbZ2xvYmFsQ29udGFpbmVyLnJlc29sdmVBbGwodHlwZS50b2tlbildLCB0eXBlLnRyYW5zZm9ybUFyZ3MpKSA6IChfYiA9IGdsb2JhbENvbnRhaW5lclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlc29sdmUodHlwZS50cmFuc2Zvcm0pKS50cmFuc2Zvcm0uYXBwbHkoX2IsIF9fc3ByZWFkKFtnbG9iYWxDb250YWluZXIucmVzb2x2ZSh0eXBlLnRva2VuKV0sIHR5cGUudHJhbnNmb3JtQXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHR5cGUubXVsdGlwbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gZ2xvYmFsQ29udGFpbmVyLnJlc29sdmVBbGwodHlwZS50b2tlbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogZ2xvYmFsQ29udGFpbmVyLnJlc29sdmUodHlwZS50b2tlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoaXNUcmFuc2Zvcm1EZXNjcmlwdG9yKHR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChfYyA9IGdsb2JhbENvbnRhaW5lclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVzb2x2ZSh0eXBlLnRyYW5zZm9ybSkpLnRyYW5zZm9ybS5hcHBseShfYywgX19zcHJlYWQoW2dsb2JhbENvbnRhaW5lci5yZXNvbHZlKHR5cGUudG9rZW4pXSwgdHlwZS50cmFuc2Zvcm1BcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2xvYmFsQ29udGFpbmVyLnJlc29sdmUodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcmdJbmRleCA9IGluZGV4ICsgYXJncy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZm9ybWF0RXJyb3JDdG9yKHRhcmdldCwgYXJnSW5kZXgsIGUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pKSkpIHx8IHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2xhc3NfMTtcbiAgICAgICAgfSh0YXJnZXQpKTtcbiAgICB9O1xufVxuZXhwb3J0IGRlZmF1bHQgYXV0b0luamVjdGFibGU7XG4iLCJleHBvcnQgeyBkZWZhdWx0IGFzIGF1dG9JbmplY3RhYmxlIH0gZnJvbSBcIi4vYXV0by1pbmplY3RhYmxlXCI7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGluamVjdCB9IGZyb20gXCIuL2luamVjdFwiO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBpbmplY3RhYmxlIH0gZnJvbSBcIi4vaW5qZWN0YWJsZVwiO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyByZWdpc3RyeSB9IGZyb20gXCIuL3JlZ2lzdHJ5XCI7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHNpbmdsZXRvbiB9IGZyb20gXCIuL3NpbmdsZXRvblwiO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBpbmplY3RBbGwgfSBmcm9tIFwiLi9pbmplY3QtYWxsXCI7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGluamVjdEFsbFdpdGhUcmFuc2Zvcm0gfSBmcm9tIFwiLi9pbmplY3QtYWxsLXdpdGgtdHJhbnNmb3JtXCI7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGluamVjdFdpdGhUcmFuc2Zvcm0gfSBmcm9tIFwiLi9pbmplY3Qtd2l0aC10cmFuc2Zvcm1cIjtcbmV4cG9ydCB7IGRlZmF1bHQgYXMgc2NvcGVkIH0gZnJvbSBcIi4vc2NvcGVkXCI7XG4iLCJpbXBvcnQgeyBkZWZpbmVJbmplY3Rpb25Ub2tlbk1ldGFkYXRhIH0gZnJvbSBcIi4uL3JlZmxlY3Rpb24taGVscGVyc1wiO1xuZnVuY3Rpb24gaW5qZWN0QWxsV2l0aFRyYW5zZm9ybSh0b2tlbiwgdHJhbnNmb3JtZXIpIHtcbiAgICB2YXIgYXJncyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIGFyZ3NbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgfVxuICAgIHZhciBkYXRhID0ge1xuICAgICAgICB0b2tlbjogdG9rZW4sXG4gICAgICAgIG11bHRpcGxlOiB0cnVlLFxuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zZm9ybWVyLFxuICAgICAgICB0cmFuc2Zvcm1BcmdzOiBhcmdzXG4gICAgfTtcbiAgICByZXR1cm4gZGVmaW5lSW5qZWN0aW9uVG9rZW5NZXRhZGF0YShkYXRhKTtcbn1cbmV4cG9ydCBkZWZhdWx0IGluamVjdEFsbFdpdGhUcmFuc2Zvcm07XG4iLCJpbXBvcnQgeyBkZWZpbmVJbmplY3Rpb25Ub2tlbk1ldGFkYXRhIH0gZnJvbSBcIi4uL3JlZmxlY3Rpb24taGVscGVyc1wiO1xuZnVuY3Rpb24gaW5qZWN0QWxsKHRva2VuKSB7XG4gICAgdmFyIGRhdGEgPSB7IHRva2VuOiB0b2tlbiwgbXVsdGlwbGU6IHRydWUgfTtcbiAgICByZXR1cm4gZGVmaW5lSW5qZWN0aW9uVG9rZW5NZXRhZGF0YShkYXRhKTtcbn1cbmV4cG9ydCBkZWZhdWx0IGluamVjdEFsbDtcbiIsImltcG9ydCB7IGRlZmluZUluamVjdGlvblRva2VuTWV0YWRhdGEgfSBmcm9tIFwiLi4vcmVmbGVjdGlvbi1oZWxwZXJzXCI7XG5mdW5jdGlvbiBpbmplY3RXaXRoVHJhbnNmb3JtKHRva2VuLCB0cmFuc2Zvcm1lcikge1xuICAgIHZhciBhcmdzID0gW107XG4gICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgYXJnc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmluZUluamVjdGlvblRva2VuTWV0YWRhdGEodG9rZW4sIHtcbiAgICAgICAgdHJhbnNmb3JtVG9rZW46IHRyYW5zZm9ybWVyLFxuICAgICAgICBhcmdzOiBhcmdzXG4gICAgfSk7XG59XG5leHBvcnQgZGVmYXVsdCBpbmplY3RXaXRoVHJhbnNmb3JtO1xuIiwiaW1wb3J0IHsgZGVmaW5lSW5qZWN0aW9uVG9rZW5NZXRhZGF0YSB9IGZyb20gXCIuLi9yZWZsZWN0aW9uLWhlbHBlcnNcIjtcbmZ1bmN0aW9uIGluamVjdCh0b2tlbikge1xuICAgIHJldHVybiBkZWZpbmVJbmplY3Rpb25Ub2tlbk1ldGFkYXRhKHRva2VuKTtcbn1cbmV4cG9ydCBkZWZhdWx0IGluamVjdDtcbiIsImltcG9ydCB7IGdldFBhcmFtSW5mbyB9IGZyb20gXCIuLi9yZWZsZWN0aW9uLWhlbHBlcnNcIjtcbmltcG9ydCB7IHR5cGVJbmZvIH0gZnJvbSBcIi4uL2RlcGVuZGVuY3ktY29udGFpbmVyXCI7XG5mdW5jdGlvbiBpbmplY3RhYmxlKCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIHR5cGVJbmZvLnNldCh0YXJnZXQsIGdldFBhcmFtSW5mbyh0YXJnZXQpKTtcbiAgICB9O1xufVxuZXhwb3J0IGRlZmF1bHQgaW5qZWN0YWJsZTtcbiIsImltcG9ydCB7IF9fcmVzdCB9IGZyb20gXCJ0c2xpYlwiO1xuaW1wb3J0IHsgaW5zdGFuY2UgYXMgZ2xvYmFsQ29udGFpbmVyIH0gZnJvbSBcIi4uL2RlcGVuZGVuY3ktY29udGFpbmVyXCI7XG5mdW5jdGlvbiByZWdpc3RyeShyZWdpc3RyYXRpb25zKSB7XG4gICAgaWYgKHJlZ2lzdHJhdGlvbnMgPT09IHZvaWQgMCkgeyByZWdpc3RyYXRpb25zID0gW107IH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICByZWdpc3RyYXRpb25zLmZvckVhY2goZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICB2YXIgdG9rZW4gPSBfYS50b2tlbiwgb3B0aW9ucyA9IF9hLm9wdGlvbnMsIHByb3ZpZGVyID0gX19yZXN0KF9hLCBbXCJ0b2tlblwiLCBcIm9wdGlvbnNcIl0pO1xuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbENvbnRhaW5lci5yZWdpc3Rlcih0b2tlbiwgcHJvdmlkZXIsIG9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9O1xufVxuZXhwb3J0IGRlZmF1bHQgcmVnaXN0cnk7XG4iLCJpbXBvcnQgaW5qZWN0YWJsZSBmcm9tIFwiLi9pbmplY3RhYmxlXCI7XG5pbXBvcnQgeyBpbnN0YW5jZSBhcyBnbG9iYWxDb250YWluZXIgfSBmcm9tIFwiLi4vZGVwZW5kZW5jeS1jb250YWluZXJcIjtcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNjb3BlZChsaWZlY3ljbGUsIHRva2VuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgaW5qZWN0YWJsZSgpKHRhcmdldCk7XG4gICAgICAgIGdsb2JhbENvbnRhaW5lci5yZWdpc3Rlcih0b2tlbiB8fCB0YXJnZXQsIHRhcmdldCwge1xuICAgICAgICAgICAgbGlmZWN5Y2xlOiBsaWZlY3ljbGVcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cbiIsImltcG9ydCBpbmplY3RhYmxlIGZyb20gXCIuL2luamVjdGFibGVcIjtcbmltcG9ydCB7IGluc3RhbmNlIGFzIGdsb2JhbENvbnRhaW5lciB9IGZyb20gXCIuLi9kZXBlbmRlbmN5LWNvbnRhaW5lclwiO1xuZnVuY3Rpb24gc2luZ2xldG9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIGluamVjdGFibGUoKSh0YXJnZXQpO1xuICAgICAgICBnbG9iYWxDb250YWluZXIucmVnaXN0ZXJTaW5nbGV0b24odGFyZ2V0KTtcbiAgICB9O1xufVxuZXhwb3J0IGRlZmF1bHQgc2luZ2xldG9uO1xuIiwiaW1wb3J0IHsgX19hd2FpdGVyLCBfX2dlbmVyYXRvciwgX19yZWFkLCBfX3NwcmVhZCwgX192YWx1ZXMgfSBmcm9tIFwidHNsaWJcIjtcbmltcG9ydCB7IGlzQ2xhc3NQcm92aWRlciwgaXNGYWN0b3J5UHJvdmlkZXIsIGlzTm9ybWFsVG9rZW4sIGlzVG9rZW5Qcm92aWRlciwgaXNWYWx1ZVByb3ZpZGVyIH0gZnJvbSBcIi4vcHJvdmlkZXJzXCI7XG5pbXBvcnQgeyBpc1Byb3ZpZGVyIH0gZnJvbSBcIi4vcHJvdmlkZXJzL3Byb3ZpZGVyXCI7XG5pbXBvcnQgeyBpc0NvbnN0cnVjdG9yVG9rZW4sIGlzVG9rZW5EZXNjcmlwdG9yLCBpc1RyYW5zZm9ybURlc2NyaXB0b3IgfSBmcm9tIFwiLi9wcm92aWRlcnMvaW5qZWN0aW9uLXRva2VuXCI7XG5pbXBvcnQgUmVnaXN0cnkgZnJvbSBcIi4vcmVnaXN0cnlcIjtcbmltcG9ydCBMaWZlY3ljbGUgZnJvbSBcIi4vdHlwZXMvbGlmZWN5Y2xlXCI7XG5pbXBvcnQgUmVzb2x1dGlvbkNvbnRleHQgZnJvbSBcIi4vcmVzb2x1dGlvbi1jb250ZXh0XCI7XG5pbXBvcnQgeyBmb3JtYXRFcnJvckN0b3IgfSBmcm9tIFwiLi9lcnJvci1oZWxwZXJzXCI7XG5pbXBvcnQgeyBEZWxheWVkQ29uc3RydWN0b3IgfSBmcm9tIFwiLi9sYXp5LWhlbHBlcnNcIjtcbmltcG9ydCB7IGlzRGlzcG9zYWJsZSB9IGZyb20gXCIuL3R5cGVzL2Rpc3Bvc2FibGVcIjtcbmltcG9ydCBJbnRlcmNlcHRvcnMgZnJvbSBcIi4vaW50ZXJjZXB0b3JzXCI7XG5leHBvcnQgdmFyIHR5cGVJbmZvID0gbmV3IE1hcCgpO1xudmFyIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyKHBhcmVudCkge1xuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgdGhpcy5fcmVnaXN0cnkgPSBuZXcgUmVnaXN0cnkoKTtcbiAgICAgICAgdGhpcy5pbnRlcmNlcHRvcnMgPSBuZXcgSW50ZXJjZXB0b3JzKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlcyA9IG5ldyBTZXQoKTtcbiAgICB9XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uICh0b2tlbiwgcHJvdmlkZXJPckNvbnN0cnVjdG9yLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHsgbGlmZWN5Y2xlOiBMaWZlY3ljbGUuVHJhbnNpZW50IH07IH1cbiAgICAgICAgdGhpcy5lbnN1cmVOb3REaXNwb3NlZCgpO1xuICAgICAgICB2YXIgcHJvdmlkZXI7XG4gICAgICAgIGlmICghaXNQcm92aWRlcihwcm92aWRlck9yQ29uc3RydWN0b3IpKSB7XG4gICAgICAgICAgICBwcm92aWRlciA9IHsgdXNlQ2xhc3M6IHByb3ZpZGVyT3JDb25zdHJ1Y3RvciB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHJvdmlkZXIgPSBwcm92aWRlck9yQ29uc3RydWN0b3I7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzVG9rZW5Qcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gW3Rva2VuXTtcbiAgICAgICAgICAgIHZhciB0b2tlblByb3ZpZGVyID0gcHJvdmlkZXI7XG4gICAgICAgICAgICB3aGlsZSAodG9rZW5Qcm92aWRlciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRUb2tlbiA9IHRva2VuUHJvdmlkZXIudXNlVG9rZW47XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaW5jbHVkZXMoY3VycmVudFRva2VuKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb2tlbiByZWdpc3RyYXRpb24gY3ljbGUgZGV0ZWN0ZWQhIFwiICsgX19zcHJlYWQocGF0aCwgW2N1cnJlbnRUb2tlbl0pLmpvaW4oXCIgLT4gXCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGF0aC5wdXNoKGN1cnJlbnRUb2tlbik7XG4gICAgICAgICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbiA9IHRoaXMuX3JlZ2lzdHJ5LmdldChjdXJyZW50VG9rZW4pO1xuICAgICAgICAgICAgICAgIGlmIChyZWdpc3RyYXRpb24gJiYgaXNUb2tlblByb3ZpZGVyKHJlZ2lzdHJhdGlvbi5wcm92aWRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5Qcm92aWRlciA9IHJlZ2lzdHJhdGlvbi5wcm92aWRlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuUHJvdmlkZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5saWZlY3ljbGUgPT09IExpZmVjeWNsZS5TaW5nbGV0b24gfHxcbiAgICAgICAgICAgIG9wdGlvbnMubGlmZWN5Y2xlID09IExpZmVjeWNsZS5Db250YWluZXJTY29wZWQgfHxcbiAgICAgICAgICAgIG9wdGlvbnMubGlmZWN5Y2xlID09IExpZmVjeWNsZS5SZXNvbHV0aW9uU2NvcGVkKSB7XG4gICAgICAgICAgICBpZiAoaXNWYWx1ZVByb3ZpZGVyKHByb3ZpZGVyKSB8fCBpc0ZhY3RvcnlQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgdXNlIGxpZmVjeWNsZSBcXFwiXCIgKyBMaWZlY3ljbGVbb3B0aW9ucy5saWZlY3ljbGVdICsgXCJcXFwiIHdpdGggVmFsdWVQcm92aWRlcnMgb3IgRmFjdG9yeVByb3ZpZGVyc1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZWdpc3RyeS5zZXQodG9rZW4sIHsgcHJvdmlkZXI6IHByb3ZpZGVyLCBvcHRpb25zOiBvcHRpb25zIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUucmVnaXN0ZXJUeXBlID0gZnVuY3Rpb24gKGZyb20sIHRvKSB7XG4gICAgICAgIHRoaXMuZW5zdXJlTm90RGlzcG9zZWQoKTtcbiAgICAgICAgaWYgKGlzTm9ybWFsVG9rZW4odG8pKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3Rlcihmcm9tLCB7XG4gICAgICAgICAgICAgICAgdXNlVG9rZW46IHRvXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3Rlcihmcm9tLCB7XG4gICAgICAgICAgICB1c2VDbGFzczogdG9cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLnJlZ2lzdGVySW5zdGFuY2UgPSBmdW5jdGlvbiAodG9rZW4sIGluc3RhbmNlKSB7XG4gICAgICAgIHRoaXMuZW5zdXJlTm90RGlzcG9zZWQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXIodG9rZW4sIHtcbiAgICAgICAgICAgIHVzZVZhbHVlOiBpbnN0YW5jZVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUucmVnaXN0ZXJTaW5nbGV0b24gPSBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcbiAgICAgICAgdGhpcy5lbnN1cmVOb3REaXNwb3NlZCgpO1xuICAgICAgICBpZiAoaXNOb3JtYWxUb2tlbihmcm9tKSkge1xuICAgICAgICAgICAgaWYgKGlzTm9ybWFsVG9rZW4odG8pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXIoZnJvbSwge1xuICAgICAgICAgICAgICAgICAgICB1c2VUb2tlbjogdG9cbiAgICAgICAgICAgICAgICB9LCB7IGxpZmVjeWNsZTogTGlmZWN5Y2xlLlNpbmdsZXRvbiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXIoZnJvbSwge1xuICAgICAgICAgICAgICAgICAgICB1c2VDbGFzczogdG9cbiAgICAgICAgICAgICAgICB9LCB7IGxpZmVjeWNsZTogTGlmZWN5Y2xlLlNpbmdsZXRvbiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJlZ2lzdGVyIGEgdHlwZSBuYW1lIGFzIGEgc2luZ2xldG9uIHdpdGhvdXQgYSBcInRvXCIgdG9rZW4nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdXNlQ2xhc3MgPSBmcm9tO1xuICAgICAgICBpZiAodG8gJiYgIWlzTm9ybWFsVG9rZW4odG8pKSB7XG4gICAgICAgICAgICB1c2VDbGFzcyA9IHRvO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyKGZyb20sIHtcbiAgICAgICAgICAgIHVzZUNsYXNzOiB1c2VDbGFzc1xuICAgICAgICB9LCB7IGxpZmVjeWNsZTogTGlmZWN5Y2xlLlNpbmdsZXRvbiB9KTtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uICh0b2tlbiwgY29udGV4dCkge1xuICAgICAgICBpZiAoY29udGV4dCA9PT0gdm9pZCAwKSB7IGNvbnRleHQgPSBuZXcgUmVzb2x1dGlvbkNvbnRleHQoKTsgfVxuICAgICAgICB0aGlzLmVuc3VyZU5vdERpc3Bvc2VkKCk7XG4gICAgICAgIHZhciByZWdpc3RyYXRpb24gPSB0aGlzLmdldFJlZ2lzdHJhdGlvbih0b2tlbik7XG4gICAgICAgIGlmICghcmVnaXN0cmF0aW9uICYmIGlzTm9ybWFsVG9rZW4odG9rZW4pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlbXB0ZWQgdG8gcmVzb2x2ZSB1bnJlZ2lzdGVyZWQgZGVwZW5kZW5jeSB0b2tlbjogXFxcIlwiICsgdG9rZW4udG9TdHJpbmcoKSArIFwiXFxcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV4ZWN1dGVQcmVSZXNvbHV0aW9uSW50ZXJjZXB0b3IodG9rZW4sIFwiU2luZ2xlXCIpO1xuICAgICAgICBpZiAocmVnaXN0cmF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5yZXNvbHZlUmVnaXN0cmF0aW9uKHJlZ2lzdHJhdGlvbiwgY29udGV4dCk7XG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGVQb3N0UmVzb2x1dGlvbkludGVyY2VwdG9yKHRva2VuLCByZXN1bHQsIFwiU2luZ2xlXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNDb25zdHJ1Y3RvclRva2VuKHRva2VuKSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuY29uc3RydWN0KHRva2VuLCBjb250ZXh0KTtcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZVBvc3RSZXNvbHV0aW9uSW50ZXJjZXB0b3IodG9rZW4sIHJlc3VsdCwgXCJTaW5nbGVcIik7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dGVtcHRlZCB0byBjb25zdHJ1Y3QgYW4gdW5kZWZpbmVkIGNvbnN0cnVjdG9yLiBDb3VsZCBtZWFuIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSBwcm9ibGVtLiBUcnkgdXNpbmcgYGRlbGF5YCBmdW5jdGlvbi5cIik7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmV4ZWN1dGVQcmVSZXNvbHV0aW9uSW50ZXJjZXB0b3IgPSBmdW5jdGlvbiAodG9rZW4sIHJlc29sdXRpb25UeXBlKSB7XG4gICAgICAgIHZhciBlXzEsIF9hO1xuICAgICAgICBpZiAodGhpcy5pbnRlcmNlcHRvcnMucHJlUmVzb2x1dGlvbi5oYXModG9rZW4pKSB7XG4gICAgICAgICAgICB2YXIgcmVtYWluaW5nSW50ZXJjZXB0b3JzID0gW107XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9iID0gX192YWx1ZXModGhpcy5pbnRlcmNlcHRvcnMucHJlUmVzb2x1dGlvbi5nZXRBbGwodG9rZW4pKSwgX2MgPSBfYi5uZXh0KCk7ICFfYy5kb25lOyBfYyA9IF9iLm5leHQoKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW50ZXJjZXB0b3IgPSBfYy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyY2VwdG9yLm9wdGlvbnMuZnJlcXVlbmN5ICE9IFwiT25jZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1haW5pbmdJbnRlcmNlcHRvcnMucHVzaChpbnRlcmNlcHRvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaW50ZXJjZXB0b3IuY2FsbGJhY2sodG9rZW4sIHJlc29sdXRpb25UeXBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZV8xXzEpIHsgZV8xID0geyBlcnJvcjogZV8xXzEgfTsgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9jICYmICFfYy5kb25lICYmIChfYSA9IF9iLnJldHVybikpIF9hLmNhbGwoX2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaW5hbGx5IHsgaWYgKGVfMSkgdGhyb3cgZV8xLmVycm9yOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmludGVyY2VwdG9ycy5wcmVSZXNvbHV0aW9uLnNldEFsbCh0b2tlbiwgcmVtYWluaW5nSW50ZXJjZXB0b3JzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5leGVjdXRlUG9zdFJlc29sdXRpb25JbnRlcmNlcHRvciA9IGZ1bmN0aW9uICh0b2tlbiwgcmVzdWx0LCByZXNvbHV0aW9uVHlwZSkge1xuICAgICAgICB2YXIgZV8yLCBfYTtcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJjZXB0b3JzLnBvc3RSZXNvbHV0aW9uLmhhcyh0b2tlbikpIHtcbiAgICAgICAgICAgIHZhciByZW1haW5pbmdJbnRlcmNlcHRvcnMgPSBbXTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2IgPSBfX3ZhbHVlcyh0aGlzLmludGVyY2VwdG9ycy5wb3N0UmVzb2x1dGlvbi5nZXRBbGwodG9rZW4pKSwgX2MgPSBfYi5uZXh0KCk7ICFfYy5kb25lOyBfYyA9IF9iLm5leHQoKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW50ZXJjZXB0b3IgPSBfYy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyY2VwdG9yLm9wdGlvbnMuZnJlcXVlbmN5ICE9IFwiT25jZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1haW5pbmdJbnRlcmNlcHRvcnMucHVzaChpbnRlcmNlcHRvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaW50ZXJjZXB0b3IuY2FsbGJhY2sodG9rZW4sIHJlc3VsdCwgcmVzb2x1dGlvblR5cGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlXzJfMSkgeyBlXzIgPSB7IGVycm9yOiBlXzJfMSB9OyB9XG4gICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoX2MgJiYgIV9jLmRvbmUgJiYgKF9hID0gX2IucmV0dXJuKSkgX2EuY2FsbChfYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbmFsbHkgeyBpZiAoZV8yKSB0aHJvdyBlXzIuZXJyb3I7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaW50ZXJjZXB0b3JzLnBvc3RSZXNvbHV0aW9uLnNldEFsbCh0b2tlbiwgcmVtYWluaW5nSW50ZXJjZXB0b3JzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5yZXNvbHZlUmVnaXN0cmF0aW9uID0gZnVuY3Rpb24gKHJlZ2lzdHJhdGlvbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmVuc3VyZU5vdERpc3Bvc2VkKCk7XG4gICAgICAgIGlmIChyZWdpc3RyYXRpb24ub3B0aW9ucy5saWZlY3ljbGUgPT09IExpZmVjeWNsZS5SZXNvbHV0aW9uU2NvcGVkICYmXG4gICAgICAgICAgICBjb250ZXh0LnNjb3BlZFJlc29sdXRpb25zLmhhcyhyZWdpc3RyYXRpb24pKSB7XG4gICAgICAgICAgICByZXR1cm4gY29udGV4dC5zY29wZWRSZXNvbHV0aW9ucy5nZXQocmVnaXN0cmF0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNTaW5nbGV0b24gPSByZWdpc3RyYXRpb24ub3B0aW9ucy5saWZlY3ljbGUgPT09IExpZmVjeWNsZS5TaW5nbGV0b247XG4gICAgICAgIHZhciBpc0NvbnRhaW5lclNjb3BlZCA9IHJlZ2lzdHJhdGlvbi5vcHRpb25zLmxpZmVjeWNsZSA9PT0gTGlmZWN5Y2xlLkNvbnRhaW5lclNjb3BlZDtcbiAgICAgICAgdmFyIHJldHVybkluc3RhbmNlID0gaXNTaW5nbGV0b24gfHwgaXNDb250YWluZXJTY29wZWQ7XG4gICAgICAgIHZhciByZXNvbHZlZDtcbiAgICAgICAgaWYgKGlzVmFsdWVQcm92aWRlcihyZWdpc3RyYXRpb24ucHJvdmlkZXIpKSB7XG4gICAgICAgICAgICByZXNvbHZlZCA9IHJlZ2lzdHJhdGlvbi5wcm92aWRlci51c2VWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc1Rva2VuUHJvdmlkZXIocmVnaXN0cmF0aW9uLnByb3ZpZGVyKSkge1xuICAgICAgICAgICAgcmVzb2x2ZWQgPSByZXR1cm5JbnN0YW5jZVxuICAgICAgICAgICAgICAgID8gcmVnaXN0cmF0aW9uLmluc3RhbmNlIHx8XG4gICAgICAgICAgICAgICAgICAgIChyZWdpc3RyYXRpb24uaW5zdGFuY2UgPSB0aGlzLnJlc29sdmUocmVnaXN0cmF0aW9uLnByb3ZpZGVyLnVzZVRva2VuLCBjb250ZXh0KSlcbiAgICAgICAgICAgICAgICA6IHRoaXMucmVzb2x2ZShyZWdpc3RyYXRpb24ucHJvdmlkZXIudXNlVG9rZW4sIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzQ2xhc3NQcm92aWRlcihyZWdpc3RyYXRpb24ucHJvdmlkZXIpKSB7XG4gICAgICAgICAgICByZXNvbHZlZCA9IHJldHVybkluc3RhbmNlXG4gICAgICAgICAgICAgICAgPyByZWdpc3RyYXRpb24uaW5zdGFuY2UgfHxcbiAgICAgICAgICAgICAgICAgICAgKHJlZ2lzdHJhdGlvbi5pbnN0YW5jZSA9IHRoaXMuY29uc3RydWN0KHJlZ2lzdHJhdGlvbi5wcm92aWRlci51c2VDbGFzcywgY29udGV4dCkpXG4gICAgICAgICAgICAgICAgOiB0aGlzLmNvbnN0cnVjdChyZWdpc3RyYXRpb24ucHJvdmlkZXIudXNlQ2xhc3MsIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzRmFjdG9yeVByb3ZpZGVyKHJlZ2lzdHJhdGlvbi5wcm92aWRlcikpIHtcbiAgICAgICAgICAgIHJlc29sdmVkID0gcmVnaXN0cmF0aW9uLnByb3ZpZGVyLnVzZUZhY3RvcnkodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXNvbHZlZCA9IHRoaXMuY29uc3RydWN0KHJlZ2lzdHJhdGlvbi5wcm92aWRlciwgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbi5vcHRpb25zLmxpZmVjeWNsZSA9PT0gTGlmZWN5Y2xlLlJlc29sdXRpb25TY29wZWQpIHtcbiAgICAgICAgICAgIGNvbnRleHQuc2NvcGVkUmVzb2x1dGlvbnMuc2V0KHJlZ2lzdHJhdGlvbiwgcmVzb2x2ZWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNvbHZlZDtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUucmVzb2x2ZUFsbCA9IGZ1bmN0aW9uICh0b2tlbiwgY29udGV4dCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoY29udGV4dCA9PT0gdm9pZCAwKSB7IGNvbnRleHQgPSBuZXcgUmVzb2x1dGlvbkNvbnRleHQoKTsgfVxuICAgICAgICB0aGlzLmVuc3VyZU5vdERpc3Bvc2VkKCk7XG4gICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gdGhpcy5nZXRBbGxSZWdpc3RyYXRpb25zKHRva2VuKTtcbiAgICAgICAgaWYgKCFyZWdpc3RyYXRpb25zICYmIGlzTm9ybWFsVG9rZW4odG9rZW4pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlbXB0ZWQgdG8gcmVzb2x2ZSB1bnJlZ2lzdGVyZWQgZGVwZW5kZW5jeSB0b2tlbjogXFxcIlwiICsgdG9rZW4udG9TdHJpbmcoKSArIFwiXFxcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV4ZWN1dGVQcmVSZXNvbHV0aW9uSW50ZXJjZXB0b3IodG9rZW4sIFwiQWxsXCIpO1xuICAgICAgICBpZiAocmVnaXN0cmF0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdF8xID0gcmVnaXN0cmF0aW9ucy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMucmVzb2x2ZVJlZ2lzdHJhdGlvbihpdGVtLCBjb250ZXh0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5leGVjdXRlUG9zdFJlc29sdXRpb25JbnRlcmNlcHRvcih0b2tlbiwgcmVzdWx0XzEsIFwiQWxsXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdF8xO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHQgPSBbdGhpcy5jb25zdHJ1Y3QodG9rZW4sIGNvbnRleHQpXTtcbiAgICAgICAgdGhpcy5leGVjdXRlUG9zdFJlc29sdXRpb25JbnRlcmNlcHRvcih0b2tlbiwgcmVzdWx0LCBcIkFsbFwiKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuaXNSZWdpc3RlcmVkID0gZnVuY3Rpb24gKHRva2VuLCByZWN1cnNpdmUpIHtcbiAgICAgICAgaWYgKHJlY3Vyc2l2ZSA9PT0gdm9pZCAwKSB7IHJlY3Vyc2l2ZSA9IGZhbHNlOyB9XG4gICAgICAgIHRoaXMuZW5zdXJlTm90RGlzcG9zZWQoKTtcbiAgICAgICAgcmV0dXJuICh0aGlzLl9yZWdpc3RyeS5oYXModG9rZW4pIHx8XG4gICAgICAgICAgICAocmVjdXJzaXZlICYmXG4gICAgICAgICAgICAgICAgKHRoaXMucGFyZW50IHx8IGZhbHNlKSAmJlxuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LmlzUmVnaXN0ZXJlZCh0b2tlbiwgdHJ1ZSkpKTtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZW5zdXJlTm90RGlzcG9zZWQoKTtcbiAgICAgICAgdGhpcy5fcmVnaXN0cnkuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5pbnRlcmNlcHRvcnMucHJlUmVzb2x1dGlvbi5jbGVhcigpO1xuICAgICAgICB0aGlzLmludGVyY2VwdG9ycy5wb3N0UmVzb2x1dGlvbi5jbGVhcigpO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5jbGVhckluc3RhbmNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVfMywgX2E7XG4gICAgICAgIHRoaXMuZW5zdXJlTm90RGlzcG9zZWQoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciAodmFyIF9iID0gX192YWx1ZXModGhpcy5fcmVnaXN0cnkuZW50cmllcygpKSwgX2MgPSBfYi5uZXh0KCk7ICFfYy5kb25lOyBfYyA9IF9iLm5leHQoKSkge1xuICAgICAgICAgICAgICAgIHZhciBfZCA9IF9fcmVhZChfYy52YWx1ZSwgMiksIHRva2VuID0gX2RbMF0sIHJlZ2lzdHJhdGlvbnMgPSBfZFsxXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWdpc3RyeS5zZXRBbGwodG9rZW4sIHJlZ2lzdHJhdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocmVnaXN0cmF0aW9uKSB7IHJldHVybiAhaXNWYWx1ZVByb3ZpZGVyKHJlZ2lzdHJhdGlvbi5wcm92aWRlcik7IH0pXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKHJlZ2lzdHJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZWdpc3RyYXRpb24uaW5zdGFuY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWdpc3RyYXRpb247XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlXzNfMSkgeyBlXzMgPSB7IGVycm9yOiBlXzNfMSB9OyB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoX2MgJiYgIV9jLmRvbmUgJiYgKF9hID0gX2IucmV0dXJuKSkgX2EuY2FsbChfYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5hbGx5IHsgaWYgKGVfMykgdGhyb3cgZV8zLmVycm9yOyB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuY3JlYXRlQ2hpbGRDb250YWluZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlXzQsIF9hO1xuICAgICAgICB0aGlzLmVuc3VyZU5vdERpc3Bvc2VkKCk7XG4gICAgICAgIHZhciBjaGlsZENvbnRhaW5lciA9IG5ldyBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIodGhpcyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb3IgKHZhciBfYiA9IF9fdmFsdWVzKHRoaXMuX3JlZ2lzdHJ5LmVudHJpZXMoKSksIF9jID0gX2IubmV4dCgpOyAhX2MuZG9uZTsgX2MgPSBfYi5uZXh0KCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgX2QgPSBfX3JlYWQoX2MudmFsdWUsIDIpLCB0b2tlbiA9IF9kWzBdLCByZWdpc3RyYXRpb25zID0gX2RbMV07XG4gICAgICAgICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbnMuc29tZShmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSBfYS5vcHRpb25zO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5saWZlY3ljbGUgPT09IExpZmVjeWNsZS5Db250YWluZXJTY29wZWQ7XG4gICAgICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRDb250YWluZXIuX3JlZ2lzdHJ5LnNldEFsbCh0b2tlbiwgcmVnaXN0cmF0aW9ucy5tYXAoZnVuY3Rpb24gKHJlZ2lzdHJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbi5vcHRpb25zLmxpZmVjeWNsZSA9PT0gTGlmZWN5Y2xlLkNvbnRhaW5lclNjb3BlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVyOiByZWdpc3RyYXRpb24ucHJvdmlkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHJlZ2lzdHJhdGlvbi5vcHRpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWdpc3RyYXRpb247XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVfNF8xKSB7IGVfNCA9IHsgZXJyb3I6IGVfNF8xIH07IH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChfYyAmJiAhX2MuZG9uZSAmJiAoX2EgPSBfYi5yZXR1cm4pKSBfYS5jYWxsKF9iKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkgeyBpZiAoZV80KSB0aHJvdyBlXzQuZXJyb3I7IH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hpbGRDb250YWluZXI7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmJlZm9yZVJlc29sdXRpb24gPSBmdW5jdGlvbiAodG9rZW4sIGNhbGxiYWNrLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHsgZnJlcXVlbmN5OiBcIkFsd2F5c1wiIH07IH1cbiAgICAgICAgdGhpcy5pbnRlcmNlcHRvcnMucHJlUmVzb2x1dGlvbi5zZXQodG9rZW4sIHtcbiAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnNcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmFmdGVyUmVzb2x1dGlvbiA9IGZ1bmN0aW9uICh0b2tlbiwgY2FsbGJhY2ssIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0geyBmcmVxdWVuY3k6IFwiQWx3YXlzXCIgfTsgfVxuICAgICAgICB0aGlzLmludGVyY2VwdG9ycy5wb3N0UmVzb2x1dGlvbi5zZXQodG9rZW4sIHtcbiAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnNcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwcm9taXNlcztcbiAgICAgICAgICAgIHJldHVybiBfX2dlbmVyYXRvcih0aGlzLCBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKF9hLmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZXMuZm9yRWFjaChmdW5jdGlvbiAoZGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXliZVByb21pc2UgPSBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF5YmVQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzLnB1c2gobWF5YmVQcm9taXNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbNCwgUHJvbWlzZS5hbGwocHJvbWlzZXMpXTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICAgICAgX2Euc2VudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmdldFJlZ2lzdHJhdGlvbiA9IGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICBpZiAodGhpcy5pc1JlZ2lzdGVyZWQodG9rZW4pKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0cnkuZ2V0KHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXRSZWdpc3RyYXRpb24odG9rZW4pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5nZXRBbGxSZWdpc3RyYXRpb25zID0gZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgIGlmICh0aGlzLmlzUmVnaXN0ZXJlZCh0b2tlbikpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWdpc3RyeS5nZXRBbGwodG9rZW4pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmdldEFsbFJlZ2lzdHJhdGlvbnModG9rZW4pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5jb25zdHJ1Y3QgPSBmdW5jdGlvbiAoY3RvciwgY29udGV4dCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoY3RvciBpbnN0YW5jZW9mIERlbGF5ZWRDb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgcmV0dXJuIGN0b3IuY3JlYXRlUHJveHkoZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5yZXNvbHZlKHRhcmdldCwgY29udGV4dCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaW5zdGFuY2UgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHBhcmFtSW5mbyA9IHR5cGVJbmZvLmdldChjdG9yKTtcbiAgICAgICAgICAgIGlmICghcGFyYW1JbmZvIHx8IHBhcmFtSW5mby5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoY3Rvci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjdG9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUeXBlSW5mbyBub3Qga25vd24gZm9yIFxcXCJcIiArIGN0b3IubmFtZSArIFwiXFxcIlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gcGFyYW1JbmZvLm1hcChfdGhpcy5yZXNvbHZlUGFyYW1zKGNvbnRleHQsIGN0b3IpKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgKGN0b3IuYmluZC5hcHBseShjdG9yLCBfX3NwcmVhZChbdm9pZCAwXSwgcGFyYW1zKSkpKCk7XG4gICAgICAgIH0pKCk7XG4gICAgICAgIGlmIChpc0Rpc3Bvc2FibGUoaW5zdGFuY2UpKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5yZXNvbHZlUGFyYW1zID0gZnVuY3Rpb24gKGNvbnRleHQsIGN0b3IpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChwYXJhbSwgaWR4KSB7XG4gICAgICAgICAgICB2YXIgX2EsIF9iLCBfYztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzVG9rZW5EZXNjcmlwdG9yKHBhcmFtKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNUcmFuc2Zvcm1EZXNjcmlwdG9yKHBhcmFtKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtLm11bHRpcGxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAoX2EgPSBfdGhpcy5yZXNvbHZlKHBhcmFtLnRyYW5zZm9ybSkpLnRyYW5zZm9ybS5hcHBseShfYSwgX19zcHJlYWQoW190aGlzLnJlc29sdmVBbGwocGFyYW0udG9rZW4pXSwgcGFyYW0udHJhbnNmb3JtQXJncykpIDogKF9iID0gX3RoaXMucmVzb2x2ZShwYXJhbS50cmFuc2Zvcm0pKS50cmFuc2Zvcm0uYXBwbHkoX2IsIF9fc3ByZWFkKFtfdGhpcy5yZXNvbHZlKHBhcmFtLnRva2VuLCBjb250ZXh0KV0sIHBhcmFtLnRyYW5zZm9ybUFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbS5tdWx0aXBsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gX3RoaXMucmVzb2x2ZUFsbChwYXJhbS50b2tlbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IF90aGlzLnJlc29sdmUocGFyYW0udG9rZW4sIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGlzVHJhbnNmb3JtRGVzY3JpcHRvcihwYXJhbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChfYyA9IF90aGlzLnJlc29sdmUocGFyYW0udHJhbnNmb3JtLCBjb250ZXh0KSkudHJhbnNmb3JtLmFwcGx5KF9jLCBfX3NwcmVhZChbX3RoaXMucmVzb2x2ZShwYXJhbS50b2tlbiwgY29udGV4dCldLCBwYXJhbS50cmFuc2Zvcm1BcmdzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5yZXNvbHZlKHBhcmFtLCBjb250ZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGZvcm1hdEVycm9yQ3RvcihjdG9yLCBpZHgsIGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuZW5zdXJlTm90RGlzcG9zZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIGNvbnRhaW5lciBoYXMgYmVlbiBkaXNwb3NlZCwgeW91IGNhbm5vdCBpbnRlcmFjdCB3aXRoIGEgZGlzcG9zZWQgY29udGFpbmVyXCIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyO1xufSgpKTtcbmV4cG9ydCB2YXIgaW5zdGFuY2UgPSBuZXcgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyKCk7XG5leHBvcnQgZGVmYXVsdCBpbnN0YW5jZTtcbiIsImltcG9ydCB7IF9fcmVhZCwgX19zcHJlYWQgfSBmcm9tIFwidHNsaWJcIjtcbmZ1bmN0aW9uIGZvcm1hdERlcGVuZGVuY3kocGFyYW1zLCBpZHgpIHtcbiAgICBpZiAocGFyYW1zID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBcImF0IHBvc2l0aW9uICNcIiArIGlkeDtcbiAgICB9XG4gICAgdmFyIGFyZ05hbWUgPSBwYXJhbXMuc3BsaXQoXCIsXCIpW2lkeF0udHJpbSgpO1xuICAgIHJldHVybiBcIlxcXCJcIiArIGFyZ05hbWUgKyBcIlxcXCIgYXQgcG9zaXRpb24gI1wiICsgaWR4O1xufVxuZnVuY3Rpb24gY29tcG9zZUVycm9yTWVzc2FnZShtc2csIGUsIGluZGVudCkge1xuICAgIGlmIChpbmRlbnQgPT09IHZvaWQgMCkgeyBpbmRlbnQgPSBcIiAgICBcIjsgfVxuICAgIHJldHVybiBfX3NwcmVhZChbbXNnXSwgZS5tZXNzYWdlLnNwbGl0KFwiXFxuXCIpLm1hcChmdW5jdGlvbiAobCkgeyByZXR1cm4gaW5kZW50ICsgbDsgfSkpLmpvaW4oXCJcXG5cIik7XG59XG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RXJyb3JDdG9yKGN0b3IsIHBhcmFtSWR4LCBlcnJvcikge1xuICAgIHZhciBfYSA9IF9fcmVhZChjdG9yLnRvU3RyaW5nKCkubWF0Y2goL2NvbnN0cnVjdG9yXFwoKFtcXHcsIF0rKVxcKS8pIHx8IFtdLCAyKSwgX2IgPSBfYVsxXSwgcGFyYW1zID0gX2IgPT09IHZvaWQgMCA/IG51bGwgOiBfYjtcbiAgICB2YXIgZGVwID0gZm9ybWF0RGVwZW5kZW5jeShwYXJhbXMsIHBhcmFtSWR4KTtcbiAgICByZXR1cm4gY29tcG9zZUVycm9yTWVzc2FnZShcIkNhbm5vdCBpbmplY3QgdGhlIGRlcGVuZGVuY3kgXCIgKyBkZXAgKyBcIiBvZiBcXFwiXCIgKyBjdG9yLm5hbWUgKyBcIlxcXCIgY29uc3RydWN0b3IuIFJlYXNvbjpcIiwgZXJyb3IpO1xufVxuIiwiZXhwb3J0IHsgZGVmYXVsdCBhcyBpbnN0YW5jZUNhY2hpbmdGYWN0b3J5IH0gZnJvbSBcIi4vaW5zdGFuY2UtY2FjaGluZy1mYWN0b3J5XCI7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGluc3RhbmNlUGVyQ29udGFpbmVyQ2FjaGluZ0ZhY3RvcnkgfSBmcm9tIFwiLi9pbnN0YW5jZS1wZXItY29udGFpbmVyLWNhY2hpbmctZmFjdG9yeVwiO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBwcmVkaWNhdGVBd2FyZUNsYXNzRmFjdG9yeSB9IGZyb20gXCIuL3ByZWRpY2F0ZS1hd2FyZS1jbGFzcy1mYWN0b3J5XCI7XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbnN0YW5jZUNhY2hpbmdGYWN0b3J5KGZhY3RvcnlGdW5jKSB7XG4gICAgdmFyIGluc3RhbmNlO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZGVwZW5kZW5jeUNvbnRhaW5lcikge1xuICAgICAgICBpZiAoaW5zdGFuY2UgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpbnN0YW5jZSA9IGZhY3RvcnlGdW5jKGRlcGVuZGVuY3lDb250YWluZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9O1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5zdGFuY2VQZXJDb250YWluZXJDYWNoaW5nRmFjdG9yeShmYWN0b3J5RnVuYykge1xuICAgIHZhciBjYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkZXBlbmRlbmN5Q29udGFpbmVyKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IGNhY2hlLmdldChkZXBlbmRlbmN5Q29udGFpbmVyKTtcbiAgICAgICAgaWYgKGluc3RhbmNlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaW5zdGFuY2UgPSBmYWN0b3J5RnVuYyhkZXBlbmRlbmN5Q29udGFpbmVyKTtcbiAgICAgICAgICAgIGNhY2hlLnNldChkZXBlbmRlbmN5Q29udGFpbmVyLCBpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH07XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwcmVkaWNhdGVBd2FyZUNsYXNzRmFjdG9yeShwcmVkaWNhdGUsIHRydWVDb25zdHJ1Y3RvciwgZmFsc2VDb25zdHJ1Y3RvciwgdXNlQ2FjaGluZykge1xuICAgIGlmICh1c2VDYWNoaW5nID09PSB2b2lkIDApIHsgdXNlQ2FjaGluZyA9IHRydWU7IH1cbiAgICB2YXIgaW5zdGFuY2U7XG4gICAgdmFyIHByZXZpb3VzUHJlZGljYXRlO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZGVwZW5kZW5jeUNvbnRhaW5lcikge1xuICAgICAgICB2YXIgY3VycmVudFByZWRpY2F0ZSA9IHByZWRpY2F0ZShkZXBlbmRlbmN5Q29udGFpbmVyKTtcbiAgICAgICAgaWYgKCF1c2VDYWNoaW5nIHx8IHByZXZpb3VzUHJlZGljYXRlICE9PSBjdXJyZW50UHJlZGljYXRlKSB7XG4gICAgICAgICAgICBpZiAoKHByZXZpb3VzUHJlZGljYXRlID0gY3VycmVudFByZWRpY2F0ZSkpIHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IGRlcGVuZGVuY3lDb250YWluZXIucmVzb2x2ZSh0cnVlQ29uc3RydWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBkZXBlbmRlbmN5Q29udGFpbmVyLnJlc29sdmUoZmFsc2VDb25zdHJ1Y3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH07XG59XG4iLCJpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgIVJlZmxlY3QuZ2V0TWV0YWRhdGEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0c3lyaW5nZSByZXF1aXJlcyBhIHJlZmxlY3QgcG9seWZpbGwuIFBsZWFzZSBhZGQgJ2ltcG9ydCBcXFwicmVmbGVjdC1tZXRhZGF0YVxcXCInIHRvIHRoZSB0b3Agb2YgeW91ciBlbnRyeSBwb2ludC5cIik7XG59XG5leHBvcnQgeyBMaWZlY3ljbGUgfSBmcm9tIFwiLi90eXBlc1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZGVjb3JhdG9yc1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZmFjdG9yaWVzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9wcm92aWRlcnNcIjtcbmV4cG9ydCB7IGRlbGF5IH0gZnJvbSBcIi4vbGF6eS1oZWxwZXJzXCI7XG5leHBvcnQgeyBpbnN0YW5jZSBhcyBjb250YWluZXIgfSBmcm9tIFwiLi9kZXBlbmRlbmN5LWNvbnRhaW5lclwiO1xuIiwiaW1wb3J0IHsgX19leHRlbmRzIH0gZnJvbSBcInRzbGliXCI7XG5pbXBvcnQgUmVnaXN0cnlCYXNlIGZyb20gXCIuL3JlZ2lzdHJ5LWJhc2VcIjtcbnZhciBQcmVSZXNvbHV0aW9uSW50ZXJjZXB0b3JzID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUHJlUmVzb2x1dGlvbkludGVyY2VwdG9ycywgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBQcmVSZXNvbHV0aW9uSW50ZXJjZXB0b3JzKCkge1xuICAgICAgICByZXR1cm4gX3N1cGVyICE9PSBudWxsICYmIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpIHx8IHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBQcmVSZXNvbHV0aW9uSW50ZXJjZXB0b3JzO1xufShSZWdpc3RyeUJhc2UpKTtcbmV4cG9ydCB7IFByZVJlc29sdXRpb25JbnRlcmNlcHRvcnMgfTtcbnZhciBQb3N0UmVzb2x1dGlvbkludGVyY2VwdG9ycyA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFBvc3RSZXNvbHV0aW9uSW50ZXJjZXB0b3JzLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFBvc3RSZXNvbHV0aW9uSW50ZXJjZXB0b3JzKCkge1xuICAgICAgICByZXR1cm4gX3N1cGVyICE9PSBudWxsICYmIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpIHx8IHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBQb3N0UmVzb2x1dGlvbkludGVyY2VwdG9ycztcbn0oUmVnaXN0cnlCYXNlKSk7XG5leHBvcnQgeyBQb3N0UmVzb2x1dGlvbkludGVyY2VwdG9ycyB9O1xudmFyIEludGVyY2VwdG9ycyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSW50ZXJjZXB0b3JzKCkge1xuICAgICAgICB0aGlzLnByZVJlc29sdXRpb24gPSBuZXcgUHJlUmVzb2x1dGlvbkludGVyY2VwdG9ycygpO1xuICAgICAgICB0aGlzLnBvc3RSZXNvbHV0aW9uID0gbmV3IFBvc3RSZXNvbHV0aW9uSW50ZXJjZXB0b3JzKCk7XG4gICAgfVxuICAgIHJldHVybiBJbnRlcmNlcHRvcnM7XG59KCkpO1xuZXhwb3J0IGRlZmF1bHQgSW50ZXJjZXB0b3JzO1xuIiwiaW1wb3J0IHsgX19yZWFkLCBfX3NwcmVhZCB9IGZyb20gXCJ0c2xpYlwiO1xudmFyIERlbGF5ZWRDb25zdHJ1Y3RvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRGVsYXllZENvbnN0cnVjdG9yKHdyYXApIHtcbiAgICAgICAgdGhpcy53cmFwID0gd3JhcDtcbiAgICAgICAgdGhpcy5yZWZsZWN0TWV0aG9kcyA9IFtcbiAgICAgICAgICAgIFwiZ2V0XCIsXG4gICAgICAgICAgICBcImdldFByb3RvdHlwZU9mXCIsXG4gICAgICAgICAgICBcInNldFByb3RvdHlwZU9mXCIsXG4gICAgICAgICAgICBcImdldE93blByb3BlcnR5RGVzY3JpcHRvclwiLFxuICAgICAgICAgICAgXCJkZWZpbmVQcm9wZXJ0eVwiLFxuICAgICAgICAgICAgXCJoYXNcIixcbiAgICAgICAgICAgIFwic2V0XCIsXG4gICAgICAgICAgICBcImRlbGV0ZVByb3BlcnR5XCIsXG4gICAgICAgICAgICBcImFwcGx5XCIsXG4gICAgICAgICAgICBcImNvbnN0cnVjdFwiLFxuICAgICAgICAgICAgXCJvd25LZXlzXCJcbiAgICAgICAgXTtcbiAgICB9XG4gICAgRGVsYXllZENvbnN0cnVjdG9yLnByb3RvdHlwZS5jcmVhdGVQcm94eSA9IGZ1bmN0aW9uIChjcmVhdGVPYmplY3QpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHRhcmdldCA9IHt9O1xuICAgICAgICB2YXIgaW5pdCA9IGZhbHNlO1xuICAgICAgICB2YXIgdmFsdWU7XG4gICAgICAgIHZhciBkZWxheWVkT2JqZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFpbml0KSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBjcmVhdGVPYmplY3QoX3RoaXMud3JhcCgpKTtcbiAgICAgICAgICAgICAgICBpbml0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eSh0YXJnZXQsIHRoaXMuY3JlYXRlSGFuZGxlcihkZWxheWVkT2JqZWN0KSk7XG4gICAgfTtcbiAgICBEZWxheWVkQ29uc3RydWN0b3IucHJvdG90eXBlLmNyZWF0ZUhhbmRsZXIgPSBmdW5jdGlvbiAoZGVsYXllZE9iamVjdCkge1xuICAgICAgICB2YXIgaGFuZGxlciA9IHt9O1xuICAgICAgICB2YXIgaW5zdGFsbCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICBoYW5kbGVyW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tfaV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhcmdzWzBdID0gZGVsYXllZE9iamVjdCgpO1xuICAgICAgICAgICAgICAgIHZhciBtZXRob2QgPSBSZWZsZWN0W25hbWVdO1xuICAgICAgICAgICAgICAgIHJldHVybiBtZXRob2QuYXBwbHkodm9pZCAwLCBfX3NwcmVhZChhcmdzKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnJlZmxlY3RNZXRob2RzLmZvckVhY2goaW5zdGFsbCk7XG4gICAgICAgIHJldHVybiBoYW5kbGVyO1xuICAgIH07XG4gICAgcmV0dXJuIERlbGF5ZWRDb25zdHJ1Y3Rvcjtcbn0oKSk7XG5leHBvcnQgeyBEZWxheWVkQ29uc3RydWN0b3IgfTtcbmV4cG9ydCBmdW5jdGlvbiBkZWxheSh3cmFwcGVkQ29uc3RydWN0b3IpIHtcbiAgICBpZiAodHlwZW9mIHdyYXBwZWRDb25zdHJ1Y3RvciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlbXB0IHRvIGBkZWxheWAgdW5kZWZpbmVkLiBDb25zdHJ1Y3RvciBtdXN0IGJlIHdyYXBwZWQgaW4gYSBjYWxsYmFja1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEZWxheWVkQ29uc3RydWN0b3Iod3JhcHBlZENvbnN0cnVjdG9yKTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBpc0NsYXNzUHJvdmlkZXIocHJvdmlkZXIpIHtcbiAgICByZXR1cm4gISFwcm92aWRlci51c2VDbGFzcztcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBpc0ZhY3RvcnlQcm92aWRlcihwcm92aWRlcikge1xuICAgIHJldHVybiAhIXByb3ZpZGVyLnVzZUZhY3Rvcnk7XG59XG4iLCJleHBvcnQgeyBpc0NsYXNzUHJvdmlkZXIgfSBmcm9tIFwiLi9jbGFzcy1wcm92aWRlclwiO1xuZXhwb3J0IHsgaXNGYWN0b3J5UHJvdmlkZXIgfSBmcm9tIFwiLi9mYWN0b3J5LXByb3ZpZGVyXCI7XG5leHBvcnQgeyBpc05vcm1hbFRva2VuIH0gZnJvbSBcIi4vaW5qZWN0aW9uLXRva2VuXCI7XG5leHBvcnQgeyBpc1Rva2VuUHJvdmlkZXIgfSBmcm9tIFwiLi90b2tlbi1wcm92aWRlclwiO1xuZXhwb3J0IHsgaXNWYWx1ZVByb3ZpZGVyIH0gZnJvbSBcIi4vdmFsdWUtcHJvdmlkZXJcIjtcbiIsImltcG9ydCB7IERlbGF5ZWRDb25zdHJ1Y3RvciB9IGZyb20gXCIuLi9sYXp5LWhlbHBlcnNcIjtcbmV4cG9ydCBmdW5jdGlvbiBpc05vcm1hbFRva2VuKHRva2VuKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0b2tlbiA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgdG9rZW4gPT09IFwic3ltYm9sXCI7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNUb2tlbkRlc2NyaXB0b3IoZGVzY3JpcHRvcikge1xuICAgIHJldHVybiAodHlwZW9mIGRlc2NyaXB0b3IgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgXCJ0b2tlblwiIGluIGRlc2NyaXB0b3IgJiZcbiAgICAgICAgXCJtdWx0aXBsZVwiIGluIGRlc2NyaXB0b3IpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzVHJhbnNmb3JtRGVzY3JpcHRvcihkZXNjcmlwdG9yKSB7XG4gICAgcmV0dXJuICh0eXBlb2YgZGVzY3JpcHRvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBcInRva2VuXCIgaW4gZGVzY3JpcHRvciAmJlxuICAgICAgICBcInRyYW5zZm9ybVwiIGluIGRlc2NyaXB0b3IpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29uc3RydWN0b3JUb2tlbih0b2tlbikge1xuICAgIHJldHVybiB0eXBlb2YgdG9rZW4gPT09IFwiZnVuY3Rpb25cIiB8fCB0b2tlbiBpbnN0YW5jZW9mIERlbGF5ZWRDb25zdHJ1Y3Rvcjtcbn1cbiIsImltcG9ydCB7IGlzQ2xhc3NQcm92aWRlciB9IGZyb20gXCIuL2NsYXNzLXByb3ZpZGVyXCI7XG5pbXBvcnQgeyBpc1ZhbHVlUHJvdmlkZXIgfSBmcm9tIFwiLi92YWx1ZS1wcm92aWRlclwiO1xuaW1wb3J0IHsgaXNUb2tlblByb3ZpZGVyIH0gZnJvbSBcIi4vdG9rZW4tcHJvdmlkZXJcIjtcbmltcG9ydCB7IGlzRmFjdG9yeVByb3ZpZGVyIH0gZnJvbSBcIi4vZmFjdG9yeS1wcm92aWRlclwiO1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvdmlkZXIocHJvdmlkZXIpIHtcbiAgICByZXR1cm4gKGlzQ2xhc3NQcm92aWRlcihwcm92aWRlcikgfHxcbiAgICAgICAgaXNWYWx1ZVByb3ZpZGVyKHByb3ZpZGVyKSB8fFxuICAgICAgICBpc1Rva2VuUHJvdmlkZXIocHJvdmlkZXIpIHx8XG4gICAgICAgIGlzRmFjdG9yeVByb3ZpZGVyKHByb3ZpZGVyKSk7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gaXNUb2tlblByb3ZpZGVyKHByb3ZpZGVyKSB7XG4gICAgcmV0dXJuICEhcHJvdmlkZXIudXNlVG9rZW47XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gaXNWYWx1ZVByb3ZpZGVyKHByb3ZpZGVyKSB7XG4gICAgcmV0dXJuIHByb3ZpZGVyLnVzZVZhbHVlICE9IHVuZGVmaW5lZDtcbn1cbiIsImV4cG9ydCB2YXIgSU5KRUNUSU9OX1RPS0VOX01FVEFEQVRBX0tFWSA9IFwiaW5qZWN0aW9uVG9rZW5zXCI7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyYW1JbmZvKHRhcmdldCkge1xuICAgIHZhciBwYXJhbXMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgdGFyZ2V0KSB8fCBbXTtcbiAgICB2YXIgaW5qZWN0aW9uVG9rZW5zID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShJTkpFQ1RJT05fVE9LRU5fTUVUQURBVEFfS0VZLCB0YXJnZXQpIHx8IHt9O1xuICAgIE9iamVjdC5rZXlzKGluamVjdGlvblRva2VucykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHBhcmFtc1sra2V5XSA9IGluamVjdGlvblRva2Vuc1trZXldO1xuICAgIH0pO1xuICAgIHJldHVybiBwYXJhbXM7XG59XG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lSW5qZWN0aW9uVG9rZW5NZXRhZGF0YShkYXRhLCB0cmFuc2Zvcm0pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgX3Byb3BlcnR5S2V5LCBwYXJhbWV0ZXJJbmRleCkge1xuICAgICAgICB2YXIgZGVzY3JpcHRvcnMgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKElOSkVDVElPTl9UT0tFTl9NRVRBREFUQV9LRVksIHRhcmdldCkgfHwge307XG4gICAgICAgIGRlc2NyaXB0b3JzW3BhcmFtZXRlckluZGV4XSA9IHRyYW5zZm9ybVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgdG9rZW46IGRhdGEsXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm0udHJhbnNmb3JtVG9rZW4sXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtQXJnczogdHJhbnNmb3JtLmFyZ3MgfHwgW11cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDogZGF0YTtcbiAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShJTkpFQ1RJT05fVE9LRU5fTUVUQURBVEFfS0VZLCBkZXNjcmlwdG9ycywgdGFyZ2V0KTtcbiAgICB9O1xufVxuIiwidmFyIFJlZ2lzdHJ5QmFzZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVnaXN0cnlCYXNlKCkge1xuICAgICAgICB0aGlzLl9yZWdpc3RyeU1hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgUmVnaXN0cnlCYXNlLnByb3RvdHlwZS5lbnRyaWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0cnlNYXAuZW50cmllcygpO1xuICAgIH07XG4gICAgUmVnaXN0cnlCYXNlLnByb3RvdHlwZS5nZXRBbGwgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHRoaXMuZW5zdXJlKGtleSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWdpc3RyeU1hcC5nZXQoa2V5KTtcbiAgICB9O1xuICAgIFJlZ2lzdHJ5QmFzZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB0aGlzLmVuc3VyZShrZXkpO1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLl9yZWdpc3RyeU1hcC5nZXQoa2V5KTtcbiAgICAgICAgcmV0dXJuIHZhbHVlW3ZhbHVlLmxlbmd0aCAtIDFdIHx8IG51bGw7XG4gICAgfTtcbiAgICBSZWdpc3RyeUJhc2UucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZW5zdXJlKGtleSk7XG4gICAgICAgIHRoaXMuX3JlZ2lzdHJ5TWFwLmdldChrZXkpLnB1c2godmFsdWUpO1xuICAgIH07XG4gICAgUmVnaXN0cnlCYXNlLnByb3RvdHlwZS5zZXRBbGwgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICB0aGlzLl9yZWdpc3RyeU1hcC5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgfTtcbiAgICBSZWdpc3RyeUJhc2UucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdGhpcy5lbnN1cmUoa2V5KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlZ2lzdHJ5TWFwLmdldChrZXkpLmxlbmd0aCA+IDA7XG4gICAgfTtcbiAgICBSZWdpc3RyeUJhc2UucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9yZWdpc3RyeU1hcC5jbGVhcigpO1xuICAgIH07XG4gICAgUmVnaXN0cnlCYXNlLnByb3RvdHlwZS5lbnN1cmUgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5fcmVnaXN0cnlNYXAuaGFzKGtleSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdHJ5TWFwLnNldChrZXksIFtdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIFJlZ2lzdHJ5QmFzZTtcbn0oKSk7XG5leHBvcnQgZGVmYXVsdCBSZWdpc3RyeUJhc2U7XG4iLCJpbXBvcnQgeyBfX2V4dGVuZHMgfSBmcm9tIFwidHNsaWJcIjtcbmltcG9ydCBSZWdpc3RyeUJhc2UgZnJvbSBcIi4vcmVnaXN0cnktYmFzZVwiO1xudmFyIFJlZ2lzdHJ5ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUmVnaXN0cnksIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gUmVnaXN0cnkoKSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIgIT09IG51bGwgJiYgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgfHwgdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIFJlZ2lzdHJ5O1xufShSZWdpc3RyeUJhc2UpKTtcbmV4cG9ydCBkZWZhdWx0IFJlZ2lzdHJ5O1xuIiwidmFyIFJlc29sdXRpb25Db250ZXh0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZXNvbHV0aW9uQ29udGV4dCgpIHtcbiAgICAgICAgdGhpcy5zY29wZWRSZXNvbHV0aW9ucyA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgcmV0dXJuIFJlc29sdXRpb25Db250ZXh0O1xufSgpKTtcbmV4cG9ydCBkZWZhdWx0IFJlc29sdXRpb25Db250ZXh0O1xuIiwiZXhwb3J0IGZ1bmN0aW9uIGlzRGlzcG9zYWJsZSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUuZGlzcG9zZSAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgdmFyIGRpc3Bvc2VGdW4gPSB2YWx1ZS5kaXNwb3NlO1xuICAgIGlmIChkaXNwb3NlRnVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbiIsImV4cG9ydCB7IGRlZmF1bHQgYXMgTGlmZWN5Y2xlIH0gZnJvbSBcIi4vbGlmZWN5Y2xlXCI7XG4iLCJ2YXIgTGlmZWN5Y2xlO1xuKGZ1bmN0aW9uIChMaWZlY3ljbGUpIHtcbiAgICBMaWZlY3ljbGVbTGlmZWN5Y2xlW1wiVHJhbnNpZW50XCJdID0gMF0gPSBcIlRyYW5zaWVudFwiO1xuICAgIExpZmVjeWNsZVtMaWZlY3ljbGVbXCJTaW5nbGV0b25cIl0gPSAxXSA9IFwiU2luZ2xldG9uXCI7XG4gICAgTGlmZWN5Y2xlW0xpZmVjeWNsZVtcIlJlc29sdXRpb25TY29wZWRcIl0gPSAyXSA9IFwiUmVzb2x1dGlvblNjb3BlZFwiO1xuICAgIExpZmVjeWNsZVtMaWZlY3ljbGVbXCJDb250YWluZXJTY29wZWRcIl0gPSAzXSA9IFwiQ29udGFpbmVyU2NvcGVkXCI7XG59KShMaWZlY3ljbGUgfHwgKExpZmVjeWNsZSA9IHt9KSk7XG5leHBvcnQgZGVmYXVsdCBMaWZlY3ljbGU7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgZGVmaW5pdGlvbikge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iaiwgcHJvcCkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7IH0iLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL21haW4udHNcIik7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=