(function(){ var curSystem = typeof System != 'undefined' ? System : undefined;
/* */ 
"format global";
"exports $traceurRuntime";
(function(global) {
  'use strict';
  if (global.$traceurRuntime) {
    return;
  }
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $Object.defineProperties;
  var $defineProperty = $Object.defineProperty;
  var $freeze = $Object.freeze;
  var $getOwnPropertyDescriptor = $Object.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $Object.getOwnPropertyNames;
  var $keys = $Object.keys;
  var $hasOwnProperty = $Object.prototype.hasOwnProperty;
  var $toString = $Object.prototype.toString;
  var $preventExtensions = Object.preventExtensions;
  var $seal = Object.seal;
  var $isExtensible = Object.isExtensible;
  var $apply = Function.prototype.call.bind(Function.prototype.apply);
  function $bind(operand, thisArg, args) {
    var argArray = [thisArg];
    for (var i = 0; i < args.length; i++) {
      argArray[i + 1] = args[i];
    }
    var func = $apply(Function.prototype.bind, operand, argArray);
    return func;
  }
  function $construct(func, argArray) {
    var object = new ($bind(func, null, argArray));
    return object;
  }
  var counter = 0;
  function newUniqueString() {
    return '__$' + Math.floor(Math.random() * 1e9) + '$' + ++counter + '$__';
  }
  var privateNames = $create(null);
  function isPrivateName(s) {
    return privateNames[s];
  }
  function createPrivateName() {
    var s = newUniqueString();
    privateNames[s] = true;
    return s;
  }
  var CONTINUATION_TYPE = Object.create(null);
  function createContinuation(operand, thisArg, argsArray) {
    return [CONTINUATION_TYPE, operand, thisArg, argsArray];
  }
  function isContinuation(object) {
    return object && object[0] === CONTINUATION_TYPE;
  }
  var isTailRecursiveName = null;
  function setupProperTailCalls() {
    isTailRecursiveName = createPrivateName();
    Function.prototype.call = initTailRecursiveFunction(function call(thisArg) {
      var result = tailCall(function(thisArg) {
        var argArray = [];
        for (var i = 1; i < arguments.length; ++i) {
          argArray[i - 1] = arguments[i];
        }
        var continuation = createContinuation(this, thisArg, argArray);
        return continuation;
      }, this, arguments);
      return result;
    });
    Function.prototype.apply = initTailRecursiveFunction(function apply(thisArg, argArray) {
      var result = tailCall(function(thisArg, argArray) {
        var continuation = createContinuation(this, thisArg, argArray);
        return continuation;
      }, this, arguments);
      return result;
    });
  }
  function initTailRecursiveFunction(func) {
    if (isTailRecursiveName === null) {
      setupProperTailCalls();
    }
    func[isTailRecursiveName] = true;
    return func;
  }
  function isTailRecursive(func) {
    return !!func[isTailRecursiveName];
  }
  function tailCall(func, thisArg, argArray) {
    var continuation = argArray[0];
    if (isContinuation(continuation)) {
      continuation = $apply(func, thisArg, continuation[3]);
      return continuation;
    }
    continuation = createContinuation(func, thisArg, argArray);
    while (true) {
      if (isTailRecursive(func)) {
        continuation = $apply(func, continuation[2], [continuation]);
      } else {
        continuation = $apply(func, continuation[2], continuation[3]);
      }
      if (!isContinuation(continuation)) {
        return continuation;
      }
      func = continuation[1];
    }
  }
  function construct() {
    var object;
    if (isTailRecursive(this)) {
      object = $construct(this, [createContinuation(null, null, arguments)]);
    } else {
      object = $construct(this, arguments);
    }
    return object;
  }
  var $traceurRuntime = {
    initTailRecursiveFunction: initTailRecursiveFunction,
    call: tailCall,
    continuation: createContinuation,
    construct: construct
  };
  (function() {
    function nonEnum(value) {
      return {
        configurable: true,
        enumerable: false,
        value: value,
        writable: true
      };
    }
    var method = nonEnum;
    var symbolInternalProperty = newUniqueString();
    var symbolDescriptionProperty = newUniqueString();
    var symbolDataProperty = newUniqueString();
    var symbolValues = $create(null);
    function isShimSymbol(symbol) {
      return typeof symbol === 'object' && symbol instanceof SymbolValue;
    }
    function typeOf(v) {
      if (isShimSymbol(v))
        return 'symbol';
      return typeof v;
    }
    function Symbol(description) {
      var value = new SymbolValue(description);
      if (!(this instanceof Symbol))
        return value;
      throw new TypeError('Symbol cannot be new\'ed');
    }
    $defineProperty(Symbol.prototype, 'constructor', nonEnum(Symbol));
    $defineProperty(Symbol.prototype, 'toString', method(function() {
      var symbolValue = this[symbolDataProperty];
      return symbolValue[symbolInternalProperty];
    }));
    $defineProperty(Symbol.prototype, 'valueOf', method(function() {
      var symbolValue = this[symbolDataProperty];
      if (!symbolValue)
        throw TypeError('Conversion from symbol to string');
      if (!getOption('symbols'))
        return symbolValue[symbolInternalProperty];
      return symbolValue;
    }));
    function SymbolValue(description) {
      var key = newUniqueString();
      $defineProperty(this, symbolDataProperty, {value: this});
      $defineProperty(this, symbolInternalProperty, {value: key});
      $defineProperty(this, symbolDescriptionProperty, {value: description});
      freeze(this);
      symbolValues[key] = this;
    }
    $defineProperty(SymbolValue.prototype, 'constructor', nonEnum(Symbol));
    $defineProperty(SymbolValue.prototype, 'toString', {
      value: Symbol.prototype.toString,
      enumerable: false
    });
    $defineProperty(SymbolValue.prototype, 'valueOf', {
      value: Symbol.prototype.valueOf,
      enumerable: false
    });
    var hashProperty = createPrivateName();
    var hashPropertyDescriptor = {value: undefined};
    var hashObjectProperties = {
      hash: {value: undefined},
      self: {value: undefined}
    };
    var hashCounter = 0;
    function getOwnHashObject(object) {
      var hashObject = object[hashProperty];
      if (hashObject && hashObject.self === object)
        return hashObject;
      if ($isExtensible(object)) {
        hashObjectProperties.hash.value = hashCounter++;
        hashObjectProperties.self.value = object;
        hashPropertyDescriptor.value = $create(null, hashObjectProperties);
        $defineProperty(object, hashProperty, hashPropertyDescriptor);
        return hashPropertyDescriptor.value;
      }
      return undefined;
    }
    function freeze(object) {
      getOwnHashObject(object);
      return $freeze.apply(this, arguments);
    }
    function preventExtensions(object) {
      getOwnHashObject(object);
      return $preventExtensions.apply(this, arguments);
    }
    function seal(object) {
      getOwnHashObject(object);
      return $seal.apply(this, arguments);
    }
    freeze(SymbolValue.prototype);
    function isSymbolString(s) {
      return symbolValues[s] || privateNames[s];
    }
    function toProperty(name) {
      if (isShimSymbol(name))
        return name[symbolInternalProperty];
      return name;
    }
    function removeSymbolKeys(array) {
      var rv = [];
      for (var i = 0; i < array.length; i++) {
        if (!isSymbolString(array[i])) {
          rv.push(array[i]);
        }
      }
      return rv;
    }
    function getOwnPropertyNames(object) {
      return removeSymbolKeys($getOwnPropertyNames(object));
    }
    function keys(object) {
      return removeSymbolKeys($keys(object));
    }
    function getOwnPropertySymbols(object) {
      var rv = [];
      var names = $getOwnPropertyNames(object);
      for (var i = 0; i < names.length; i++) {
        var symbol = symbolValues[names[i]];
        if (symbol) {
          rv.push(symbol);
        }
      }
      return rv;
    }
    function getOwnPropertyDescriptor(object, name) {
      return $getOwnPropertyDescriptor(object, toProperty(name));
    }
    function hasOwnProperty(name) {
      return $hasOwnProperty.call(this, toProperty(name));
    }
    function getOption(name) {
      return global.$traceurRuntime.options[name];
    }
    function defineProperty(object, name, descriptor) {
      if (isShimSymbol(name)) {
        name = name[symbolInternalProperty];
      }
      $defineProperty(object, name, descriptor);
      return object;
    }
    function polyfillObject(Object) {
      $defineProperty(Object, 'defineProperty', {value: defineProperty});
      $defineProperty(Object, 'getOwnPropertyNames', {value: getOwnPropertyNames});
      $defineProperty(Object, 'getOwnPropertyDescriptor', {value: getOwnPropertyDescriptor});
      $defineProperty(Object.prototype, 'hasOwnProperty', {value: hasOwnProperty});
      $defineProperty(Object, 'freeze', {value: freeze});
      $defineProperty(Object, 'preventExtensions', {value: preventExtensions});
      $defineProperty(Object, 'seal', {value: seal});
      $defineProperty(Object, 'keys', {value: keys});
    }
    function exportStar(object) {
      for (var i = 1; i < arguments.length; i++) {
        var names = $getOwnPropertyNames(arguments[i]);
        for (var j = 0; j < names.length; j++) {
          var name = names[j];
          if (name === '__esModule' || name === 'default' || isSymbolString(name))
            continue;
          (function(mod, name) {
            $defineProperty(object, name, {
              get: function() {
                return mod[name];
              },
              enumerable: true
            });
          })(arguments[i], names[j]);
        }
      }
      return object;
    }
    function isObject(x) {
      return x != null && (typeof x === 'object' || typeof x === 'function');
    }
    function toObject(x) {
      if (x == null)
        throw $TypeError();
      return $Object(x);
    }
    function checkObjectCoercible(argument) {
      if (argument == null) {
        throw new TypeError('Value cannot be converted to an Object');
      }
      return argument;
    }
    var hasNativeSymbol;
    function polyfillSymbol(global, Symbol) {
      if (!global.Symbol) {
        global.Symbol = Symbol;
        Object.getOwnPropertySymbols = getOwnPropertySymbols;
        hasNativeSymbol = false;
      } else {
        hasNativeSymbol = true;
      }
      if (!global.Symbol.iterator) {
        global.Symbol.iterator = Symbol('Symbol.iterator');
      }
      if (!global.Symbol.observer) {
        global.Symbol.observer = Symbol('Symbol.observer');
      }
    }
    function hasNativeSymbolFunc() {
      return hasNativeSymbol;
    }
    function setupGlobals(global) {
      polyfillSymbol(global, Symbol);
      global.Reflect = global.Reflect || {};
      global.Reflect.global = global.Reflect.global || global;
      polyfillObject(global.Object);
    }
    setupGlobals(global);
    global.$traceurRuntime = {
      call: tailCall,
      checkObjectCoercible: checkObjectCoercible,
      construct: construct,
      continuation: createContinuation,
      createPrivateName: createPrivateName,
      defineProperties: $defineProperties,
      defineProperty: $defineProperty,
      exportStar: exportStar,
      getOwnHashObject: getOwnHashObject,
      getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
      getOwnPropertyNames: $getOwnPropertyNames,
      hasNativeSymbol: hasNativeSymbolFunc,
      initTailRecursiveFunction: initTailRecursiveFunction,
      isObject: isObject,
      isPrivateName: isPrivateName,
      isSymbolString: isSymbolString,
      keys: $keys,
      options: {},
      setupGlobals: setupGlobals,
      toObject: toObject,
      toProperty: toProperty,
      typeof: typeOf
    };
  })();
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
(function() {
  function buildFromEncodedParts(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
    var out = [];
    if (opt_scheme) {
      out.push(opt_scheme, ':');
    }
    if (opt_domain) {
      out.push('//');
      if (opt_userInfo) {
        out.push(opt_userInfo, '@');
      }
      out.push(opt_domain);
      if (opt_port) {
        out.push(':', opt_port);
      }
    }
    if (opt_path) {
      out.push(opt_path);
    }
    if (opt_queryData) {
      out.push('?', opt_queryData);
    }
    if (opt_fragment) {
      out.push('#', opt_fragment);
    }
    return out.join('');
  }
  ;
  var splitRe = new RegExp('^' + '(?:' + '([^:/?#.]+)' + ':)?' + '(?://' + '(?:([^/?#]*)@)?' + '([\\w\\d\\-\\u0100-\\uffff.%]*)' + '(?::([0-9]+))?' + ')?' + '([^?#]+)?' + '(?:\\?([^#]*))?' + '(?:#(.*))?' + '$');
  var ComponentIndex = {
    SCHEME: 1,
    USER_INFO: 2,
    DOMAIN: 3,
    PORT: 4,
    PATH: 5,
    QUERY_DATA: 6,
    FRAGMENT: 7
  };
  function split(uri) {
    return (uri.match(splitRe));
  }
  function removeDotSegments(path) {
    if (path === '/')
      return '/';
    var leadingSlash = path[0] === '/' ? '/' : '';
    var trailingSlash = path.slice(-1) === '/' ? '/' : '';
    var segments = path.split('/');
    var out = [];
    var up = 0;
    for (var pos = 0; pos < segments.length; pos++) {
      var segment = segments[pos];
      switch (segment) {
        case '':
        case '.':
          break;
        case '..':
          if (out.length)
            out.pop();
          else
            up++;
          break;
        default:
          out.push(segment);
      }
    }
    if (!leadingSlash) {
      while (up-- > 0) {
        out.unshift('..');
      }
      if (out.length === 0)
        out.push('.');
    }
    return leadingSlash + out.join('/') + trailingSlash;
  }
  function joinAndCanonicalizePath(parts) {
    var path = parts[ComponentIndex.PATH] || '';
    path = removeDotSegments(path);
    parts[ComponentIndex.PATH] = path;
    return buildFromEncodedParts(parts[ComponentIndex.SCHEME], parts[ComponentIndex.USER_INFO], parts[ComponentIndex.DOMAIN], parts[ComponentIndex.PORT], parts[ComponentIndex.PATH], parts[ComponentIndex.QUERY_DATA], parts[ComponentIndex.FRAGMENT]);
  }
  function canonicalizeUrl(url) {
    var parts = split(url);
    return joinAndCanonicalizePath(parts);
  }
  function resolveUrl(base, url) {
    var parts = split(url);
    var baseParts = split(base);
    if (parts[ComponentIndex.SCHEME]) {
      return joinAndCanonicalizePath(parts);
    } else {
      parts[ComponentIndex.SCHEME] = baseParts[ComponentIndex.SCHEME];
    }
    for (var i = ComponentIndex.SCHEME; i <= ComponentIndex.PORT; i++) {
      if (!parts[i]) {
        parts[i] = baseParts[i];
      }
    }
    if (parts[ComponentIndex.PATH][0] == '/') {
      return joinAndCanonicalizePath(parts);
    }
    var path = baseParts[ComponentIndex.PATH];
    var index = path.lastIndexOf('/');
    path = path.slice(0, index + 1) + parts[ComponentIndex.PATH];
    parts[ComponentIndex.PATH] = path;
    return joinAndCanonicalizePath(parts);
  }
  function isAbsolute(name) {
    if (!name)
      return false;
    if (name[0] === '/')
      return true;
    var parts = split(name);
    if (parts[ComponentIndex.SCHEME])
      return true;
    return false;
  }
  $traceurRuntime.canonicalizeUrl = canonicalizeUrl;
  $traceurRuntime.isAbsolute = isAbsolute;
  $traceurRuntime.removeDotSegments = removeDotSegments;
  $traceurRuntime.resolveUrl = resolveUrl;
})();
(function(global) {
  'use strict';
  var $__1 = $traceurRuntime,
      canonicalizeUrl = $__1.canonicalizeUrl,
      resolveUrl = $__1.resolveUrl,
      isAbsolute = $__1.isAbsolute;
  var moduleInstantiators = Object.create(null);
  var baseURL;
  if (global.location && global.location.href)
    baseURL = resolveUrl(global.location.href, './');
  else
    baseURL = '';
  function UncoatedModuleEntry(url, uncoatedModule) {
    this.url = url;
    this.value_ = uncoatedModule;
  }
  function ModuleEvaluationError(erroneousModuleName, cause) {
    this.message = this.constructor.name + ': ' + this.stripCause(cause) + ' in ' + erroneousModuleName;
    if (!(cause instanceof ModuleEvaluationError) && cause.stack)
      this.stack = this.stripStack(cause.stack);
    else
      this.stack = '';
  }
  ModuleEvaluationError.prototype = Object.create(Error.prototype);
  ModuleEvaluationError.prototype.constructor = ModuleEvaluationError;
  ModuleEvaluationError.prototype.stripError = function(message) {
    return message.replace(/.*Error:/, this.constructor.name + ':');
  };
  ModuleEvaluationError.prototype.stripCause = function(cause) {
    if (!cause)
      return '';
    if (!cause.message)
      return cause + '';
    return this.stripError(cause.message);
  };
  ModuleEvaluationError.prototype.loadedBy = function(moduleName) {
    this.stack += '\n loaded by ' + moduleName;
  };
  ModuleEvaluationError.prototype.stripStack = function(causeStack) {
    var stack = [];
    causeStack.split('\n').some(function(frame) {
      if (/UncoatedModuleInstantiator/.test(frame))
        return true;
      stack.push(frame);
    });
    stack[0] = this.stripError(stack[0]);
    return stack.join('\n');
  };
  function beforeLines(lines, number) {
    var result = [];
    var first = number - 3;
    if (first < 0)
      first = 0;
    for (var i = first; i < number; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function afterLines(lines, number) {
    var last = number + 1;
    if (last > lines.length - 1)
      last = lines.length - 1;
    var result = [];
    for (var i = number; i <= last; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function columnSpacing(columns) {
    var result = '';
    for (var i = 0; i < columns - 1; i++) {
      result += '-';
    }
    return result;
  }
  function UncoatedModuleInstantiator(url, func) {
    UncoatedModuleEntry.call(this, url, null);
    this.func = func;
  }
  UncoatedModuleInstantiator.prototype = Object.create(UncoatedModuleEntry.prototype);
  UncoatedModuleInstantiator.prototype.getUncoatedModule = function() {
    var $__0 = this;
    if (this.value_)
      return this.value_;
    try {
      var relativeRequire;
      if (typeof $traceurRuntime !== undefined && $traceurRuntime.require) {
        relativeRequire = $traceurRuntime.require.bind(null, this.url);
      }
      return this.value_ = this.func.call(global, relativeRequire);
    } catch (ex) {
      if (ex instanceof ModuleEvaluationError) {
        ex.loadedBy(this.url);
        throw ex;
      }
      if (ex.stack) {
        var lines = this.func.toString().split('\n');
        var evaled = [];
        ex.stack.split('\n').some(function(frame, index) {
          if (frame.indexOf('UncoatedModuleInstantiator.getUncoatedModule') > 0)
            return true;
          var m = /(at\s[^\s]*\s).*>:(\d*):(\d*)\)/.exec(frame);
          if (m) {
            var line = parseInt(m[2], 10);
            evaled = evaled.concat(beforeLines(lines, line));
            if (index === 1) {
              evaled.push(columnSpacing(m[3]) + '^ ' + $__0.url);
            } else {
              evaled.push(columnSpacing(m[3]) + '^');
            }
            evaled = evaled.concat(afterLines(lines, line));
            evaled.push('= = = = = = = = =');
          } else {
            evaled.push(frame);
          }
        });
        ex.stack = evaled.join('\n');
      }
      throw new ModuleEvaluationError(this.url, ex);
    }
  };
  function getUncoatedModuleInstantiator(name) {
    if (!name)
      return;
    var url = ModuleStore.normalize(name);
    return moduleInstantiators[url];
  }
  ;
  var moduleInstances = Object.create(null);
  var liveModuleSentinel = {};
  function Module(uncoatedModule) {
    var isLive = arguments[1];
    var coatedModule = Object.create(null);
    Object.getOwnPropertyNames(uncoatedModule).forEach(function(name) {
      var getter,
          value;
      if (isLive === liveModuleSentinel) {
        var descr = Object.getOwnPropertyDescriptor(uncoatedModule, name);
        if (descr.get)
          getter = descr.get;
      }
      if (!getter) {
        value = uncoatedModule[name];
        getter = function() {
          return value;
        };
      }
      Object.defineProperty(coatedModule, name, {
        get: getter,
        enumerable: true
      });
    });
    Object.preventExtensions(coatedModule);
    return coatedModule;
  }
  var ModuleStore = {
    normalize: function(name, refererName, refererAddress) {
      if (typeof name !== 'string')
        throw new TypeError('module name must be a string, not ' + typeof name);
      if (isAbsolute(name))
        return canonicalizeUrl(name);
      if (/[^\.]\/\.\.\//.test(name)) {
        throw new Error('module name embeds /../: ' + name);
      }
      if (name[0] === '.' && refererName)
        return resolveUrl(refererName, name);
      return canonicalizeUrl(name);
    },
    get: function(normalizedName) {
      var m = getUncoatedModuleInstantiator(normalizedName);
      if (!m)
        return undefined;
      var moduleInstance = moduleInstances[m.url];
      if (moduleInstance)
        return moduleInstance;
      moduleInstance = Module(m.getUncoatedModule(), liveModuleSentinel);
      return moduleInstances[m.url] = moduleInstance;
    },
    set: function(normalizedName, module) {
      normalizedName = String(normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, function() {
        return module;
      });
      moduleInstances[normalizedName] = module;
    },
    get baseURL() {
      return baseURL;
    },
    set baseURL(v) {
      baseURL = String(v);
    },
    registerModule: function(name, deps, func) {
      var normalizedName = ModuleStore.normalize(name);
      if (moduleInstantiators[normalizedName])
        throw new Error('duplicate module named ' + normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, func);
    },
    bundleStore: Object.create(null),
    register: function(name, deps, func) {
      if (!deps || !deps.length && !func.length) {
        this.registerModule(name, deps, func);
      } else {
        this.bundleStore[name] = {
          deps: deps,
          execute: function() {
            var $__0 = arguments;
            var depMap = {};
            deps.forEach(function(dep, index) {
              return depMap[dep] = $__0[index];
            });
            var registryEntry = func.call(this, depMap);
            registryEntry.execute.call(this);
            return registryEntry.exports;
          }
        };
      }
    },
    getAnonymousModule: function(func) {
      return new Module(func.call(global), liveModuleSentinel);
    }
  };
  var moduleStoreModule = new Module({ModuleStore: ModuleStore});
  ModuleStore.set('@traceur/src/runtime/ModuleStore.js', moduleStoreModule);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
  };
  $traceurRuntime.ModuleStore = ModuleStore;
  global.System = {
    register: ModuleStore.register.bind(ModuleStore),
    registerModule: ModuleStore.registerModule.bind(ModuleStore),
    get: ModuleStore.get,
    set: ModuleStore.set,
    normalize: ModuleStore.normalize
  };
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
System.registerModule("traceur-runtime@0.0.90/src/runtime/async.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/async.js";
  if (typeof $traceurRuntime !== 'object') {
    throw new Error('traceur runtime not found.');
  }
  var $createPrivateName = $traceurRuntime.createPrivateName;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $create = Object.create;
  var thisName = $createPrivateName();
  var argsName = $createPrivateName();
  var observeName = $createPrivateName();
  function AsyncGeneratorFunction() {}
  function AsyncGeneratorFunctionPrototype() {}
  AsyncGeneratorFunction.prototype = AsyncGeneratorFunctionPrototype;
  AsyncGeneratorFunctionPrototype.constructor = AsyncGeneratorFunction;
  $defineProperty(AsyncGeneratorFunctionPrototype, 'constructor', {enumerable: false});
  var AsyncGeneratorContext = function() {
    function AsyncGeneratorContext(observer) {
      var $__0 = this;
      this.decoratedObserver = $traceurRuntime.createDecoratedGenerator(observer, function() {
        $__0.done = true;
      });
      this.done = false;
      this.inReturn = false;
    }
    return ($traceurRuntime.createClass)(AsyncGeneratorContext, {
      throw: function(error) {
        if (!this.inReturn) {
          throw error;
        }
      },
      yield: function(value) {
        if (this.done) {
          this.inReturn = true;
          throw undefined;
        }
        var result;
        try {
          result = this.decoratedObserver.next(value);
        } catch (e) {
          this.done = true;
          throw e;
        }
        if (result === undefined) {
          return;
        }
        if (result.done) {
          this.done = true;
          this.inReturn = true;
          throw undefined;
        }
        return result.value;
      },
      yieldFor: function(observable) {
        var ctx = this;
        return $traceurRuntime.observeForEach(observable[$traceurRuntime.toProperty(Symbol.observer)].bind(observable), function(value) {
          if (ctx.done) {
            this.return();
            return;
          }
          var result;
          try {
            result = ctx.decoratedObserver.next(value);
          } catch (e) {
            ctx.done = true;
            throw e;
          }
          if (result === undefined) {
            return;
          }
          if (result.done) {
            ctx.done = true;
          }
          return result;
        });
      }
    }, {});
  }();
  AsyncGeneratorFunctionPrototype.prototype[Symbol.observer] = function(observer) {
    var observe = this[observeName];
    var ctx = new AsyncGeneratorContext(observer);
    $traceurRuntime.schedule(function() {
      return observe(ctx);
    }).then(function(value) {
      if (!ctx.done) {
        ctx.decoratedObserver.return(value);
      }
    }).catch(function(error) {
      if (!ctx.done) {
        ctx.decoratedObserver.throw(error);
      }
    });
    return ctx.decoratedObserver;
  };
  $defineProperty(AsyncGeneratorFunctionPrototype.prototype, Symbol.observer, {enumerable: false});
  function initAsyncGeneratorFunction(functionObject) {
    functionObject.prototype = $create(AsyncGeneratorFunctionPrototype.prototype);
    functionObject.__proto__ = AsyncGeneratorFunctionPrototype;
    return functionObject;
  }
  function createAsyncGeneratorInstance(observe, functionObject) {
    for (var args = [],
        $__9 = 2; $__9 < arguments.length; $__9++)
      args[$__9 - 2] = arguments[$__9];
    var object = $create(functionObject.prototype);
    object[thisName] = this;
    object[argsName] = args;
    object[observeName] = observe;
    return object;
  }
  function observeForEach(observe, next) {
    return new Promise(function(resolve, reject) {
      var generator = observe({
        next: function(value) {
          return next.call(generator, value);
        },
        throw: function(error) {
          reject(error);
        },
        return: function(value) {
          resolve(value);
        }
      });
    });
  }
  function schedule(asyncF) {
    return Promise.resolve().then(asyncF);
  }
  var generator = Symbol();
  var onDone = Symbol();
  var DecoratedGenerator = function() {
    function DecoratedGenerator(_generator, _onDone) {
      this[generator] = _generator;
      this[onDone] = _onDone;
    }
    return ($traceurRuntime.createClass)(DecoratedGenerator, {
      next: function(value) {
        var result = this[generator].next(value);
        if (result !== undefined && result.done) {
          this[onDone].call(this);
        }
        return result;
      },
      throw: function(error) {
        this[onDone].call(this);
        return this[generator].throw(error);
      },
      return: function(value) {
        this[onDone].call(this);
        return this[generator].return(value);
      }
    }, {});
  }();
  function createDecoratedGenerator(generator, onDone) {
    return new DecoratedGenerator(generator, onDone);
  }
  Array.prototype[$traceurRuntime.toProperty(Symbol.observer)] = function(observer) {
    var done = false;
    var decoratedObserver = createDecoratedGenerator(observer, function() {
      return done = true;
    });
    var $__5 = true;
    var $__6 = false;
    var $__7 = undefined;
    try {
      for (var $__3 = void 0,
          $__2 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
        var value = $__3.value;
        {
          decoratedObserver.next(value);
          if (done) {
            return;
          }
        }
      }
    } catch ($__8) {
      $__6 = true;
      $__7 = $__8;
    } finally {
      try {
        if (!$__5 && $__2.return != null) {
          $__2.return();
        }
      } finally {
        if ($__6) {
          throw $__7;
        }
      }
    }
    decoratedObserver.return();
    return decoratedObserver;
  };
  $defineProperty(Array.prototype, $traceurRuntime.toProperty(Symbol.observer), {enumerable: false});
  $traceurRuntime.initAsyncGeneratorFunction = initAsyncGeneratorFunction;
  $traceurRuntime.createAsyncGeneratorInstance = createAsyncGeneratorInstance;
  $traceurRuntime.observeForEach = observeForEach;
  $traceurRuntime.schedule = schedule;
  $traceurRuntime.createDecoratedGenerator = createDecoratedGenerator;
  return {};
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/classes.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/classes.js";
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $getOwnPropertyDescriptor = $traceurRuntime.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $traceurRuntime.getOwnPropertyNames;
  var $getPrototypeOf = Object.getPrototypeOf;
  var $__0 = Object,
      getOwnPropertyNames = $__0.getOwnPropertyNames,
      getOwnPropertySymbols = $__0.getOwnPropertySymbols;
  function superDescriptor(homeObject, name) {
    var proto = $getPrototypeOf(homeObject);
    do {
      var result = $getOwnPropertyDescriptor(proto, name);
      if (result)
        return result;
      proto = $getPrototypeOf(proto);
    } while (proto);
    return undefined;
  }
  function superConstructor(ctor) {
    return ctor.__proto__;
  }
  function superGet(self, homeObject, name) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor) {
      var value = descriptor.value;
      if (value)
        return value;
      if (!descriptor.get)
        return value;
      return descriptor.get.call(self);
    }
    return undefined;
  }
  function superSet(self, homeObject, name, value) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor && descriptor.set) {
      descriptor.set.call(self, value);
      return value;
    }
    throw $TypeError(("super has no setter '" + name + "'."));
  }
  function forEachPropertyKey(object, f) {
    getOwnPropertyNames(object).forEach(f);
    getOwnPropertySymbols(object).forEach(f);
  }
  function getDescriptors(object) {
    var descriptors = {};
    forEachPropertyKey(object, function(key) {
      descriptors[key] = $getOwnPropertyDescriptor(object, key);
      descriptors[key].enumerable = false;
    });
    return descriptors;
  }
  var nonEnum = {enumerable: false};
  function makePropertiesNonEnumerable(object) {
    forEachPropertyKey(object, function(key) {
      $defineProperty(object, key, nonEnum);
    });
  }
  function createClass(ctor, object, staticObject, superClass) {
    $defineProperty(object, 'constructor', {
      value: ctor,
      configurable: true,
      enumerable: false,
      writable: true
    });
    if (arguments.length > 3) {
      if (typeof superClass === 'function')
        ctor.__proto__ = superClass;
      ctor.prototype = $create(getProtoParent(superClass), getDescriptors(object));
    } else {
      makePropertiesNonEnumerable(object);
      ctor.prototype = object;
    }
    $defineProperty(ctor, 'prototype', {
      configurable: false,
      writable: false
    });
    return $defineProperties(ctor, getDescriptors(staticObject));
  }
  function getProtoParent(superClass) {
    if (typeof superClass === 'function') {
      var prototype = superClass.prototype;
      if ($Object(prototype) === prototype || prototype === null)
        return superClass.prototype;
      throw new $TypeError('super prototype must be an Object or null');
    }
    if (superClass === null)
      return null;
    throw new $TypeError(("Super expression must either be null or a function, not " + typeof superClass + "."));
  }
  $traceurRuntime.createClass = createClass;
  $traceurRuntime.superConstructor = superConstructor;
  $traceurRuntime.superGet = superGet;
  $traceurRuntime.superSet = superSet;
  return {};
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/destructuring.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/destructuring.js";
  function iteratorToArray(iter) {
    var rv = [];
    var i = 0;
    var tmp;
    while (!(tmp = iter.next()).done) {
      rv[i++] = tmp.value;
    }
    return rv;
  }
  $traceurRuntime.iteratorToArray = iteratorToArray;
  return {};
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/generators.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/generators.js";
  if (typeof $traceurRuntime !== 'object') {
    throw new Error('traceur runtime not found.');
  }
  var createPrivateName = $traceurRuntime.createPrivateName;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $create = Object.create;
  var $TypeError = TypeError;
  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }
  var ST_NEWBORN = 0;
  var ST_EXECUTING = 1;
  var ST_SUSPENDED = 2;
  var ST_CLOSED = 3;
  var END_STATE = -2;
  var RETHROW_STATE = -3;
  function getInternalError(state) {
    return new Error('Traceur compiler bug: invalid state in state machine: ' + state);
  }
  var RETURN_SENTINEL = {};
  function GeneratorContext() {
    this.state = 0;
    this.GState = ST_NEWBORN;
    this.storedException = undefined;
    this.finallyFallThrough = undefined;
    this.sent_ = undefined;
    this.returnValue = undefined;
    this.oldReturnValue = undefined;
    this.tryStack_ = [];
  }
  GeneratorContext.prototype = {
    pushTry: function(catchState, finallyState) {
      if (finallyState !== null) {
        var finallyFallThrough = null;
        for (var i = this.tryStack_.length - 1; i >= 0; i--) {
          if (this.tryStack_[i].catch !== undefined) {
            finallyFallThrough = this.tryStack_[i].catch;
            break;
          }
        }
        if (finallyFallThrough === null)
          finallyFallThrough = RETHROW_STATE;
        this.tryStack_.push({
          finally: finallyState,
          finallyFallThrough: finallyFallThrough
        });
      }
      if (catchState !== null) {
        this.tryStack_.push({catch: catchState});
      }
    },
    popTry: function() {
      this.tryStack_.pop();
    },
    maybeUncatchable: function() {
      if (this.storedException === RETURN_SENTINEL) {
        throw RETURN_SENTINEL;
      }
    },
    get sent() {
      this.maybeThrow();
      return this.sent_;
    },
    set sent(v) {
      this.sent_ = v;
    },
    get sentIgnoreThrow() {
      return this.sent_;
    },
    maybeThrow: function() {
      if (this.action === 'throw') {
        this.action = 'next';
        throw this.sent_;
      }
    },
    end: function() {
      switch (this.state) {
        case END_STATE:
          return this;
        case RETHROW_STATE:
          throw this.storedException;
        default:
          throw getInternalError(this.state);
      }
    },
    handleException: function(ex) {
      this.GState = ST_CLOSED;
      this.state = END_STATE;
      throw ex;
    },
    wrapYieldStar: function(iterator) {
      var ctx = this;
      return {
        next: function(v) {
          return iterator.next(v);
        },
        throw: function(e) {
          var result;
          if (e === RETURN_SENTINEL) {
            if (iterator.return) {
              result = iterator.return(ctx.returnValue);
              if (!result.done) {
                ctx.returnValue = ctx.oldReturnValue;
                return result;
              }
              ctx.returnValue = result.value;
            }
            throw e;
          }
          if (iterator.throw) {
            return iterator.throw(e);
          }
          iterator.return && iterator.return();
          throw $TypeError('Inner iterator does not have a throw method');
        }
      };
    }
  };
  function nextOrThrow(ctx, moveNext, action, x) {
    switch (ctx.GState) {
      case ST_EXECUTING:
        throw new Error(("\"" + action + "\" on executing generator"));
      case ST_CLOSED:
        if (action == 'next') {
          return {
            value: undefined,
            done: true
          };
        }
        if (x === RETURN_SENTINEL) {
          return {
            value: ctx.returnValue,
            done: true
          };
        }
        throw x;
      case ST_NEWBORN:
        if (action === 'throw') {
          ctx.GState = ST_CLOSED;
          if (x === RETURN_SENTINEL) {
            return {
              value: ctx.returnValue,
              done: true
            };
          }
          throw x;
        }
        if (x !== undefined)
          throw $TypeError('Sent value to newborn generator');
      case ST_SUSPENDED:
        ctx.GState = ST_EXECUTING;
        ctx.action = action;
        ctx.sent = x;
        var value;
        try {
          value = moveNext(ctx);
        } catch (ex) {
          if (ex === RETURN_SENTINEL) {
            value = ctx;
          } else {
            throw ex;
          }
        }
        var done = value === ctx;
        if (done)
          value = ctx.returnValue;
        ctx.GState = done ? ST_CLOSED : ST_SUSPENDED;
        return {
          value: value,
          done: done
        };
    }
  }
  var ctxName = createPrivateName();
  var moveNextName = createPrivateName();
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  $defineProperty(GeneratorFunctionPrototype, 'constructor', nonEnum(GeneratorFunction));
  GeneratorFunctionPrototype.prototype = {
    constructor: GeneratorFunctionPrototype,
    next: function(v) {
      return nextOrThrow(this[ctxName], this[moveNextName], 'next', v);
    },
    throw: function(v) {
      return nextOrThrow(this[ctxName], this[moveNextName], 'throw', v);
    },
    return: function(v) {
      this[ctxName].oldReturnValue = this[ctxName].returnValue;
      this[ctxName].returnValue = v;
      return nextOrThrow(this[ctxName], this[moveNextName], 'throw', RETURN_SENTINEL);
    }
  };
  $defineProperties(GeneratorFunctionPrototype.prototype, {
    constructor: {enumerable: false},
    next: {enumerable: false},
    throw: {enumerable: false},
    return: {enumerable: false}
  });
  Object.defineProperty(GeneratorFunctionPrototype.prototype, Symbol.iterator, nonEnum(function() {
    return this;
  }));
  function createGeneratorInstance(innerFunction, functionObject, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new GeneratorContext();
    var object = $create(functionObject.prototype);
    object[ctxName] = ctx;
    object[moveNextName] = moveNext;
    return object;
  }
  function initGeneratorFunction(functionObject) {
    functionObject.prototype = $create(GeneratorFunctionPrototype.prototype);
    functionObject.__proto__ = GeneratorFunctionPrototype;
    return functionObject;
  }
  function AsyncFunctionContext() {
    GeneratorContext.call(this);
    this.err = undefined;
    var ctx = this;
    ctx.result = new Promise(function(resolve, reject) {
      ctx.resolve = resolve;
      ctx.reject = reject;
    });
  }
  AsyncFunctionContext.prototype = $create(GeneratorContext.prototype);
  AsyncFunctionContext.prototype.end = function() {
    switch (this.state) {
      case END_STATE:
        this.resolve(this.returnValue);
        break;
      case RETHROW_STATE:
        this.reject(this.storedException);
        break;
      default:
        this.reject(getInternalError(this.state));
    }
  };
  AsyncFunctionContext.prototype.handleException = function() {
    this.state = RETHROW_STATE;
  };
  function asyncWrap(innerFunction, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new AsyncFunctionContext();
    ctx.createCallback = function(newState) {
      return function(value) {
        ctx.state = newState;
        ctx.value = value;
        moveNext(ctx);
      };
    };
    ctx.errback = function(err) {
      handleCatch(ctx, err);
      moveNext(ctx);
    };
    moveNext(ctx);
    return ctx.result;
  }
  function getMoveNext(innerFunction, self) {
    return function(ctx) {
      while (true) {
        try {
          return innerFunction.call(self, ctx);
        } catch (ex) {
          handleCatch(ctx, ex);
        }
      }
    };
  }
  function handleCatch(ctx, ex) {
    ctx.storedException = ex;
    var last = ctx.tryStack_[ctx.tryStack_.length - 1];
    if (!last) {
      ctx.handleException(ex);
      return;
    }
    ctx.state = last.catch !== undefined ? last.catch : last.finally;
    if (last.finallyFallThrough !== undefined)
      ctx.finallyFallThrough = last.finallyFallThrough;
  }
  $traceurRuntime.asyncWrap = asyncWrap;
  $traceurRuntime.initGeneratorFunction = initGeneratorFunction;
  $traceurRuntime.createGeneratorInstance = createGeneratorInstance;
  return {};
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/relativeRequire.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/relativeRequire.js";
  var path;
  function relativeRequire(callerPath, requiredPath) {
    path = path || typeof require !== 'undefined' && require('path');
    function isDirectory(path) {
      return path.slice(-1) === '/';
    }
    function isAbsolute(path) {
      return path[0] === '/';
    }
    function isRelative(path) {
      return path[0] === '.';
    }
    if (isDirectory(requiredPath) || isAbsolute(requiredPath))
      return;
    return isRelative(requiredPath) ? require(path.resolve(path.dirname(callerPath), requiredPath)) : require(requiredPath);
  }
  $traceurRuntime.require = relativeRequire;
  return {};
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/spread.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/spread.js";
  function spread() {
    var rv = [],
        j = 0,
        iterResult;
    for (var i = 0; i < arguments.length; i++) {
      var valueToSpread = $traceurRuntime.checkObjectCoercible(arguments[i]);
      if (typeof valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)] !== 'function') {
        throw new TypeError('Cannot spread non-iterable object.');
      }
      var iter = valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)]();
      while (!(iterResult = iter.next()).done) {
        rv[j++] = iterResult.value;
      }
    }
    return rv;
  }
  $traceurRuntime.spread = spread;
  return {};
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/template.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/template.js";
  var $__0 = Object,
      defineProperty = $__0.defineProperty,
      freeze = $__0.freeze;
  var slice = Array.prototype.slice;
  var map = Object.create(null);
  function getTemplateObject(raw) {
    var cooked = arguments[1];
    var key = raw.join('${}');
    var templateObject = map[key];
    if (templateObject)
      return templateObject;
    if (!cooked) {
      cooked = slice.call(raw);
    }
    return map[key] = freeze(defineProperty(cooked, 'raw', {value: freeze(raw)}));
  }
  $traceurRuntime.getTemplateObject = getTemplateObject;
  return {};
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/type-assertions.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/type-assertions.js";
  var types = {
    any: {name: 'any'},
    boolean: {name: 'boolean'},
    number: {name: 'number'},
    string: {name: 'string'},
    symbol: {name: 'symbol'},
    void: {name: 'void'}
  };
  var GenericType = function() {
    function GenericType(type, argumentTypes) {
      this.type = type;
      this.argumentTypes = argumentTypes;
    }
    return ($traceurRuntime.createClass)(GenericType, {}, {});
  }();
  var typeRegister = Object.create(null);
  function genericType(type) {
    for (var argumentTypes = [],
        $__1 = 1; $__1 < arguments.length; $__1++)
      argumentTypes[$__1 - 1] = arguments[$__1];
    var typeMap = typeRegister;
    var key = $traceurRuntime.getOwnHashObject(type).hash;
    if (!typeMap[key]) {
      typeMap[key] = Object.create(null);
    }
    typeMap = typeMap[key];
    for (var i = 0; i < argumentTypes.length - 1; i++) {
      key = $traceurRuntime.getOwnHashObject(argumentTypes[i]).hash;
      if (!typeMap[key]) {
        typeMap[key] = Object.create(null);
      }
      typeMap = typeMap[key];
    }
    var tail = argumentTypes[argumentTypes.length - 1];
    key = $traceurRuntime.getOwnHashObject(tail).hash;
    if (!typeMap[key]) {
      typeMap[key] = new GenericType(type, argumentTypes);
    }
    return typeMap[key];
  }
  $traceurRuntime.GenericType = GenericType;
  $traceurRuntime.genericType = genericType;
  $traceurRuntime.type = types;
  return {};
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/runtime-modules.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/runtime-modules.js";
  System.get("traceur-runtime@0.0.90/src/runtime/relativeRequire.js");
  System.get("traceur-runtime@0.0.90/src/runtime/spread.js");
  System.get("traceur-runtime@0.0.90/src/runtime/destructuring.js");
  System.get("traceur-runtime@0.0.90/src/runtime/classes.js");
  System.get("traceur-runtime@0.0.90/src/runtime/async.js");
  System.get("traceur-runtime@0.0.90/src/runtime/generators.js");
  System.get("traceur-runtime@0.0.90/src/runtime/template.js");
  System.get("traceur-runtime@0.0.90/src/runtime/type-assertions.js");
  return {};
});
System.get("traceur-runtime@0.0.90/src/runtime/runtime-modules.js" + '');
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/utils.js";
  var $ceil = Math.ceil;
  var $floor = Math.floor;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $pow = Math.pow;
  var $min = Math.min;
  var toObject = $traceurRuntime.toObject;
  function toUint32(x) {
    return x >>> 0;
  }
  function isObject(x) {
    return x && (typeof x === 'object' || typeof x === 'function');
  }
  function isCallable(x) {
    return typeof x === 'function';
  }
  function isNumber(x) {
    return typeof x === 'number';
  }
  function toInteger(x) {
    x = +x;
    if ($isNaN(x))
      return 0;
    if (x === 0 || !$isFinite(x))
      return x;
    return x > 0 ? $floor(x) : $ceil(x);
  }
  var MAX_SAFE_LENGTH = $pow(2, 53) - 1;
  function toLength(x) {
    var len = toInteger(x);
    return len < 0 ? 0 : $min(len, MAX_SAFE_LENGTH);
  }
  function checkIterable(x) {
    return !isObject(x) ? undefined : x[Symbol.iterator];
  }
  function isConstructor(x) {
    return isCallable(x);
  }
  function createIteratorResultObject(value, done) {
    return {
      value: value,
      done: done
    };
  }
  function maybeDefine(object, name, descr) {
    if (!(name in object)) {
      Object.defineProperty(object, name, descr);
    }
  }
  function maybeDefineMethod(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  function maybeDefineConst(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: false,
      enumerable: false,
      writable: false
    });
  }
  function maybeAddFunctions(object, functions) {
    for (var i = 0; i < functions.length; i += 2) {
      var name = functions[i];
      var value = functions[i + 1];
      maybeDefineMethod(object, name, value);
    }
  }
  function maybeAddConsts(object, consts) {
    for (var i = 0; i < consts.length; i += 2) {
      var name = consts[i];
      var value = consts[i + 1];
      maybeDefineConst(object, name, value);
    }
  }
  function maybeAddIterator(object, func, Symbol) {
    if (!Symbol || !Symbol.iterator || object[Symbol.iterator])
      return;
    if (object['@@iterator'])
      func = object['@@iterator'];
    Object.defineProperty(object, Symbol.iterator, {
      value: func,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  var polyfills = [];
  function registerPolyfill(func) {
    polyfills.push(func);
  }
  function polyfillAll(global) {
    polyfills.forEach(function(f) {
      return f(global);
    });
  }
  return {
    get toObject() {
      return toObject;
    },
    get toUint32() {
      return toUint32;
    },
    get isObject() {
      return isObject;
    },
    get isCallable() {
      return isCallable;
    },
    get isNumber() {
      return isNumber;
    },
    get toInteger() {
      return toInteger;
    },
    get toLength() {
      return toLength;
    },
    get checkIterable() {
      return checkIterable;
    },
    get isConstructor() {
      return isConstructor;
    },
    get createIteratorResultObject() {
      return createIteratorResultObject;
    },
    get maybeDefine() {
      return maybeDefine;
    },
    get maybeDefineMethod() {
      return maybeDefineMethod;
    },
    get maybeDefineConst() {
      return maybeDefineConst;
    },
    get maybeAddFunctions() {
      return maybeAddFunctions;
    },
    get maybeAddConsts() {
      return maybeAddConsts;
    },
    get maybeAddIterator() {
      return maybeAddIterator;
    },
    get registerPolyfill() {
      return registerPolyfill;
    },
    get polyfillAll() {
      return polyfillAll;
    }
  };
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/Map.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/Map.js";
  var $__0 = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js"),
      isObject = $__0.isObject,
      registerPolyfill = $__0.registerPolyfill;
  var $__9 = $traceurRuntime,
      getOwnHashObject = $__9.getOwnHashObject,
      hasNativeSymbol = $__9.hasNativeSymbol;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  var deletedSentinel = {};
  function lookupIndex(map, key) {
    if (isObject(key)) {
      var hashObject = getOwnHashObject(key);
      return hashObject && map.objectIndex_[hashObject.hash];
    }
    if (typeof key === 'string')
      return map.stringIndex_[key];
    return map.primitiveIndex_[key];
  }
  function initMap(map) {
    map.entries_ = [];
    map.objectIndex_ = Object.create(null);
    map.stringIndex_ = Object.create(null);
    map.primitiveIndex_ = Object.create(null);
    map.deletedCount_ = 0;
  }
  var Map = function() {
    function Map() {
      var $__11,
          $__12;
      var iterable = arguments[0];
      if (!isObject(this))
        throw new TypeError('Map called on incompatible type');
      if ($hasOwnProperty.call(this, 'entries_')) {
        throw new TypeError('Map can not be reentrantly initialised');
      }
      initMap(this);
      if (iterable !== null && iterable !== undefined) {
        var $__5 = true;
        var $__6 = false;
        var $__7 = undefined;
        try {
          for (var $__3 = void 0,
              $__2 = (iterable)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
            var $__10 = $__3.value,
                key = ($__11 = $__10[$traceurRuntime.toProperty(Symbol.iterator)](), ($__12 = $__11.next()).done ? void 0 : $__12.value),
                value = ($__12 = $__11.next()).done ? void 0 : $__12.value;
            {
              this.set(key, value);
            }
          }
        } catch ($__8) {
          $__6 = true;
          $__7 = $__8;
        } finally {
          try {
            if (!$__5 && $__2.return != null) {
              $__2.return();
            }
          } finally {
            if ($__6) {
              throw $__7;
            }
          }
        }
      }
    }
    return ($traceurRuntime.createClass)(Map, {
      get size() {
        return this.entries_.length / 2 - this.deletedCount_;
      },
      get: function(key) {
        var index = lookupIndex(this, key);
        if (index !== undefined)
          return this.entries_[index + 1];
      },
      set: function(key, value) {
        var objectMode = isObject(key);
        var stringMode = typeof key === 'string';
        var index = lookupIndex(this, key);
        if (index !== undefined) {
          this.entries_[index + 1] = value;
        } else {
          index = this.entries_.length;
          this.entries_[index] = key;
          this.entries_[index + 1] = value;
          if (objectMode) {
            var hashObject = getOwnHashObject(key);
            var hash = hashObject.hash;
            this.objectIndex_[hash] = index;
          } else if (stringMode) {
            this.stringIndex_[key] = index;
          } else {
            this.primitiveIndex_[key] = index;
          }
        }
        return this;
      },
      has: function(key) {
        return lookupIndex(this, key) !== undefined;
      },
      delete: function(key) {
        var objectMode = isObject(key);
        var stringMode = typeof key === 'string';
        var index;
        var hash;
        if (objectMode) {
          var hashObject = getOwnHashObject(key);
          if (hashObject) {
            index = this.objectIndex_[hash = hashObject.hash];
            delete this.objectIndex_[hash];
          }
        } else if (stringMode) {
          index = this.stringIndex_[key];
          delete this.stringIndex_[key];
        } else {
          index = this.primitiveIndex_[key];
          delete this.primitiveIndex_[key];
        }
        if (index !== undefined) {
          this.entries_[index] = deletedSentinel;
          this.entries_[index + 1] = undefined;
          this.deletedCount_++;
          return true;
        }
        return false;
      },
      clear: function() {
        initMap(this);
      },
      forEach: function(callbackFn) {
        var thisArg = arguments[1];
        for (var i = 0; i < this.entries_.length; i += 2) {
          var key = this.entries_[i];
          var value = this.entries_[i + 1];
          if (key === deletedSentinel)
            continue;
          callbackFn.call(thisArg, value, key, this);
        }
      },
      entries: $traceurRuntime.initGeneratorFunction(function $__13() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return [key, value];
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__13, this);
      }),
      keys: $traceurRuntime.initGeneratorFunction(function $__14() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return key;
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__14, this);
      }),
      values: $traceurRuntime.initGeneratorFunction(function $__15() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return value;
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__15, this);
      })
    }, {});
  }();
  Object.defineProperty(Map.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Map.prototype.entries
  });
  function needsPolyfill(global) {
    var $__10 = global,
        Map = $__10.Map,
        Symbol = $__10.Symbol;
    if (!Map || !$traceurRuntime.hasNativeSymbol() || !Map.prototype[Symbol.iterator] || !Map.prototype.entries) {
      return true;
    }
    try {
      return new Map([[]]).size !== 1;
    } catch (e) {
      return false;
    }
  }
  function polyfillMap(global) {
    if (needsPolyfill(global)) {
      global.Map = Map;
    }
  }
  registerPolyfill(polyfillMap);
  return {
    get Map() {
      return Map;
    },
    get polyfillMap() {
      return polyfillMap;
    }
  };
});
System.get("traceur-runtime@0.0.90/src/runtime/polyfills/Map.js" + '');
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/Set.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/Set.js";
  var $__0 = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js"),
      isObject = $__0.isObject,
      registerPolyfill = $__0.registerPolyfill;
  var Map = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/Map.js").Map;
  var getOwnHashObject = $traceurRuntime.getOwnHashObject;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  function initSet(set) {
    set.map_ = new Map();
  }
  var Set = function() {
    function Set() {
      var iterable = arguments[0];
      if (!isObject(this))
        throw new TypeError('Set called on incompatible type');
      if ($hasOwnProperty.call(this, 'map_')) {
        throw new TypeError('Set can not be reentrantly initialised');
      }
      initSet(this);
      if (iterable !== null && iterable !== undefined) {
        var $__7 = true;
        var $__8 = false;
        var $__9 = undefined;
        try {
          for (var $__5 = void 0,
              $__4 = (iterable)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__7 = ($__5 = $__4.next()).done); $__7 = true) {
            var item = $__5.value;
            {
              this.add(item);
            }
          }
        } catch ($__10) {
          $__8 = true;
          $__9 = $__10;
        } finally {
          try {
            if (!$__7 && $__4.return != null) {
              $__4.return();
            }
          } finally {
            if ($__8) {
              throw $__9;
            }
          }
        }
      }
    }
    return ($traceurRuntime.createClass)(Set, {
      get size() {
        return this.map_.size;
      },
      has: function(key) {
        return this.map_.has(key);
      },
      add: function(key) {
        this.map_.set(key, key);
        return this;
      },
      delete: function(key) {
        return this.map_.delete(key);
      },
      clear: function() {
        return this.map_.clear();
      },
      forEach: function(callbackFn) {
        var thisArg = arguments[1];
        var $__2 = this;
        return this.map_.forEach(function(value, key) {
          callbackFn.call(thisArg, key, key, $__2);
        });
      },
      values: $traceurRuntime.initGeneratorFunction(function $__12() {
        var $__13,
            $__14;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                $__13 = $ctx.wrapYieldStar(this.map_.keys()[Symbol.iterator]());
                $ctx.sent = void 0;
                $ctx.action = 'next';
                $ctx.state = 12;
                break;
              case 12:
                $__14 = $__13[$ctx.action]($ctx.sentIgnoreThrow);
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = ($__14.done) ? 3 : 2;
                break;
              case 3:
                $ctx.sent = $__14.value;
                $ctx.state = -2;
                break;
              case 2:
                $ctx.state = 12;
                return $__14.value;
              default:
                return $ctx.end();
            }
        }, $__12, this);
      }),
      entries: $traceurRuntime.initGeneratorFunction(function $__15() {
        var $__16,
            $__17;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                $__16 = $ctx.wrapYieldStar(this.map_.entries()[Symbol.iterator]());
                $ctx.sent = void 0;
                $ctx.action = 'next';
                $ctx.state = 12;
                break;
              case 12:
                $__17 = $__16[$ctx.action]($ctx.sentIgnoreThrow);
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = ($__17.done) ? 3 : 2;
                break;
              case 3:
                $ctx.sent = $__17.value;
                $ctx.state = -2;
                break;
              case 2:
                $ctx.state = 12;
                return $__17.value;
              default:
                return $ctx.end();
            }
        }, $__15, this);
      })
    }, {});
  }();
  Object.defineProperty(Set.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  Object.defineProperty(Set.prototype, 'keys', {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  function needsPolyfill(global) {
    var $__11 = global,
        Set = $__11.Set,
        Symbol = $__11.Symbol;
    if (!Set || !$traceurRuntime.hasNativeSymbol() || !Set.prototype[Symbol.iterator] || !Set.prototype.values) {
      return true;
    }
    try {
      return new Set([1]).size !== 1;
    } catch (e) {
      return false;
    }
  }
  function polyfillSet(global) {
    if (needsPolyfill(global)) {
      global.Set = Set;
    }
  }
  registerPolyfill(polyfillSet);
  return {
    get Set() {
      return Set;
    },
    get polyfillSet() {
      return polyfillSet;
    }
  };
});
System.get("traceur-runtime@0.0.90/src/runtime/polyfills/Set.js" + '');
System.registerModule("traceur-runtime@0.0.90/node_modules/rsvp/lib/rsvp/asap.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/node_modules/rsvp/lib/rsvp/asap.js";
  var len = 0;
  function asap(callback, arg) {
    queue[len] = callback;
    queue[len + 1] = arg;
    len += 2;
    if (len === 2) {
      scheduleFlush();
    }
  }
  var $__default = asap;
  var browserGlobal = (typeof window !== 'undefined') ? window : {};
  var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
  var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
  function useNextTick() {
    return function() {
      process.nextTick(flush);
    };
  }
  function useMutationObserver() {
    var iterations = 0;
    var observer = new BrowserMutationObserver(flush);
    var node = document.createTextNode('');
    observer.observe(node, {characterData: true});
    return function() {
      node.data = (iterations = ++iterations % 2);
    };
  }
  function useMessageChannel() {
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    return function() {
      channel.port2.postMessage(0);
    };
  }
  function useSetTimeout() {
    return function() {
      setTimeout(flush, 1);
    };
  }
  var queue = new Array(1000);
  function flush() {
    for (var i = 0; i < len; i += 2) {
      var callback = queue[i];
      var arg = queue[i + 1];
      callback(arg);
      queue[i] = undefined;
      queue[i + 1] = undefined;
    }
    len = 0;
  }
  var scheduleFlush;
  if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
    scheduleFlush = useNextTick();
  } else if (BrowserMutationObserver) {
    scheduleFlush = useMutationObserver();
  } else if (isWorker) {
    scheduleFlush = useMessageChannel();
  } else {
    scheduleFlush = useSetTimeout();
  }
  return {get default() {
      return $__default;
    }};
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/Promise.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/Promise.js";
  var async = System.get("traceur-runtime@0.0.90/node_modules/rsvp/lib/rsvp/asap.js").default;
  var registerPolyfill = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js").registerPolyfill;
  var promiseRaw = {};
  function isPromise(x) {
    return x && typeof x === 'object' && x.status_ !== undefined;
  }
  function idResolveHandler(x) {
    return x;
  }
  function idRejectHandler(x) {
    throw x;
  }
  function chain(promise) {
    var onResolve = arguments[1] !== (void 0) ? arguments[1] : idResolveHandler;
    var onReject = arguments[2] !== (void 0) ? arguments[2] : idRejectHandler;
    var deferred = getDeferred(promise.constructor);
    switch (promise.status_) {
      case undefined:
        throw TypeError;
      case 0:
        promise.onResolve_.push(onResolve, deferred);
        promise.onReject_.push(onReject, deferred);
        break;
      case +1:
        promiseEnqueue(promise.value_, [onResolve, deferred]);
        break;
      case -1:
        promiseEnqueue(promise.value_, [onReject, deferred]);
        break;
    }
    return deferred.promise;
  }
  function getDeferred(C) {
    if (this === $Promise) {
      var promise = promiseInit(new $Promise(promiseRaw));
      return {
        promise: promise,
        resolve: function(x) {
          promiseResolve(promise, x);
        },
        reject: function(r) {
          promiseReject(promise, r);
        }
      };
    } else {
      var result = {};
      result.promise = new C(function(resolve, reject) {
        result.resolve = resolve;
        result.reject = reject;
      });
      return result;
    }
  }
  function promiseSet(promise, status, value, onResolve, onReject) {
    promise.status_ = status;
    promise.value_ = value;
    promise.onResolve_ = onResolve;
    promise.onReject_ = onReject;
    return promise;
  }
  function promiseInit(promise) {
    return promiseSet(promise, 0, undefined, [], []);
  }
  var Promise = function() {
    function Promise(resolver) {
      if (resolver === promiseRaw)
        return;
      if (typeof resolver !== 'function')
        throw new TypeError;
      var promise = promiseInit(this);
      try {
        resolver(function(x) {
          promiseResolve(promise, x);
        }, function(r) {
          promiseReject(promise, r);
        });
      } catch (e) {
        promiseReject(promise, e);
      }
    }
    return ($traceurRuntime.createClass)(Promise, {
      catch: function(onReject) {
        return this.then(undefined, onReject);
      },
      then: function(onResolve, onReject) {
        if (typeof onResolve !== 'function')
          onResolve = idResolveHandler;
        if (typeof onReject !== 'function')
          onReject = idRejectHandler;
        var that = this;
        var constructor = this.constructor;
        return chain(this, function(x) {
          x = promiseCoerce(constructor, x);
          return x === that ? onReject(new TypeError) : isPromise(x) ? x.then(onResolve, onReject) : onResolve(x);
        }, onReject);
      }
    }, {
      resolve: function(x) {
        if (this === $Promise) {
          if (isPromise(x)) {
            return x;
          }
          return promiseSet(new $Promise(promiseRaw), +1, x);
        } else {
          return new this(function(resolve, reject) {
            resolve(x);
          });
        }
      },
      reject: function(r) {
        if (this === $Promise) {
          return promiseSet(new $Promise(promiseRaw), -1, r);
        } else {
          return new this(function(resolve, reject) {
            reject(r);
          });
        }
      },
      all: function(values) {
        var deferred = getDeferred(this);
        var resolutions = [];
        try {
          var makeCountdownFunction = function(i) {
            return function(x) {
              resolutions[i] = x;
              if (--count === 0)
                deferred.resolve(resolutions);
            };
          };
          var count = 0;
          var i = 0;
          var $__6 = true;
          var $__7 = false;
          var $__8 = undefined;
          try {
            for (var $__4 = void 0,
                $__3 = (values)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
              var value = $__4.value;
              {
                var countdownFunction = makeCountdownFunction(i);
                this.resolve(value).then(countdownFunction, function(r) {
                  deferred.reject(r);
                });
                ++i;
                ++count;
              }
            }
          } catch ($__9) {
            $__7 = true;
            $__8 = $__9;
          } finally {
            try {
              if (!$__6 && $__3.return != null) {
                $__3.return();
              }
            } finally {
              if ($__7) {
                throw $__8;
              }
            }
          }
          if (count === 0) {
            deferred.resolve(resolutions);
          }
        } catch (e) {
          deferred.reject(e);
        }
        return deferred.promise;
      },
      race: function(values) {
        var deferred = getDeferred(this);
        try {
          for (var i = 0; i < values.length; i++) {
            this.resolve(values[i]).then(function(x) {
              deferred.resolve(x);
            }, function(r) {
              deferred.reject(r);
            });
          }
        } catch (e) {
          deferred.reject(e);
        }
        return deferred.promise;
      }
    });
  }();
  var $Promise = Promise;
  var $PromiseReject = $Promise.reject;
  function promiseResolve(promise, x) {
    promiseDone(promise, +1, x, promise.onResolve_);
  }
  function promiseReject(promise, r) {
    promiseDone(promise, -1, r, promise.onReject_);
  }
  function promiseDone(promise, status, value, reactions) {
    if (promise.status_ !== 0)
      return;
    promiseEnqueue(value, reactions);
    promiseSet(promise, status, value);
  }
  function promiseEnqueue(value, tasks) {
    async(function() {
      for (var i = 0; i < tasks.length; i += 2) {
        promiseHandle(value, tasks[i], tasks[i + 1]);
      }
    });
  }
  function promiseHandle(value, handler, deferred) {
    try {
      var result = handler(value);
      if (result === deferred.promise)
        throw new TypeError;
      else if (isPromise(result))
        chain(result, deferred.resolve, deferred.reject);
      else
        deferred.resolve(result);
    } catch (e) {
      try {
        deferred.reject(e);
      } catch (e) {}
    }
  }
  var thenableSymbol = '@@thenable';
  function isObject(x) {
    return x && (typeof x === 'object' || typeof x === 'function');
  }
  function promiseCoerce(constructor, x) {
    if (!isPromise(x) && isObject(x)) {
      var then;
      try {
        then = x.then;
      } catch (r) {
        var promise = $PromiseReject.call(constructor, r);
        x[thenableSymbol] = promise;
        return promise;
      }
      if (typeof then === 'function') {
        var p = x[thenableSymbol];
        if (p) {
          return p;
        } else {
          var deferred = getDeferred(constructor);
          x[thenableSymbol] = deferred.promise;
          try {
            then.call(x, deferred.resolve, deferred.reject);
          } catch (r) {
            deferred.reject(r);
          }
          return deferred.promise;
        }
      }
    }
    return x;
  }
  function polyfillPromise(global) {
    if (!global.Promise)
      global.Promise = Promise;
  }
  registerPolyfill(polyfillPromise);
  return {
    get Promise() {
      return Promise;
    },
    get polyfillPromise() {
      return polyfillPromise;
    }
  };
});
System.get("traceur-runtime@0.0.90/src/runtime/polyfills/Promise.js" + '');
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/StringIterator.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/StringIterator.js";
  var $__0 = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js"),
      createIteratorResultObject = $__0.createIteratorResultObject,
      isObject = $__0.isObject;
  var toProperty = $traceurRuntime.toProperty;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var iteratedString = Symbol('iteratedString');
  var stringIteratorNextIndex = Symbol('stringIteratorNextIndex');
  var StringIterator = function() {
    var $__2;
    function StringIterator() {}
    return ($traceurRuntime.createClass)(StringIterator, ($__2 = {}, Object.defineProperty($__2, "next", {
      value: function() {
        var o = this;
        if (!isObject(o) || !hasOwnProperty.call(o, iteratedString)) {
          throw new TypeError('this must be a StringIterator object');
        }
        var s = o[toProperty(iteratedString)];
        if (s === undefined) {
          return createIteratorResultObject(undefined, true);
        }
        var position = o[toProperty(stringIteratorNextIndex)];
        var len = s.length;
        if (position >= len) {
          o[toProperty(iteratedString)] = undefined;
          return createIteratorResultObject(undefined, true);
        }
        var first = s.charCodeAt(position);
        var resultString;
        if (first < 0xD800 || first > 0xDBFF || position + 1 === len) {
          resultString = String.fromCharCode(first);
        } else {
          var second = s.charCodeAt(position + 1);
          if (second < 0xDC00 || second > 0xDFFF) {
            resultString = String.fromCharCode(first);
          } else {
            resultString = String.fromCharCode(first) + String.fromCharCode(second);
          }
        }
        o[toProperty(stringIteratorNextIndex)] = position + resultString.length;
        return createIteratorResultObject(resultString, false);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, Symbol.iterator, {
      value: function() {
        return this;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__2), {});
  }();
  function createStringIterator(string) {
    var s = String(string);
    var iterator = Object.create(StringIterator.prototype);
    iterator[toProperty(iteratedString)] = s;
    iterator[toProperty(stringIteratorNextIndex)] = 0;
    return iterator;
  }
  return {get createStringIterator() {
      return createStringIterator;
    }};
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/String.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/String.js";
  var createStringIterator = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/StringIterator.js").createStringIterator;
  var $__1 = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__1.maybeAddFunctions,
      maybeAddIterator = $__1.maybeAddIterator,
      registerPolyfill = $__1.registerPolyfill;
  var $toString = Object.prototype.toString;
  var $indexOf = String.prototype.indexOf;
  var $lastIndexOf = String.prototype.lastIndexOf;
  function startsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (isNaN(pos)) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    return $indexOf.call(string, searchString, pos) == start;
  }
  function endsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var pos = stringLength;
    if (arguments.length > 1) {
      var position = arguments[1];
      if (position !== undefined) {
        pos = position ? Number(position) : 0;
        if (isNaN(pos)) {
          pos = 0;
        }
      }
    }
    var end = Math.min(Math.max(pos, 0), stringLength);
    var start = end - searchLength;
    if (start < 0) {
      return false;
    }
    return $lastIndexOf.call(string, searchString, start) == start;
  }
  function includes(search) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    if (search && $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (pos != pos) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    if (searchLength + start > stringLength) {
      return false;
    }
    return $indexOf.call(string, searchString, pos) != -1;
  }
  function repeat(count) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var n = count ? Number(count) : 0;
    if (isNaN(n)) {
      n = 0;
    }
    if (n < 0 || n == Infinity) {
      throw RangeError();
    }
    if (n == 0) {
      return '';
    }
    var result = '';
    while (n--) {
      result += string;
    }
    return result;
  }
  function codePointAt(position) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var size = string.length;
    var index = position ? Number(position) : 0;
    if (isNaN(index)) {
      index = 0;
    }
    if (index < 0 || index >= size) {
      return undefined;
    }
    var first = string.charCodeAt(index);
    var second;
    if (first >= 0xD800 && first <= 0xDBFF && size > index + 1) {
      second = string.charCodeAt(index + 1);
      if (second >= 0xDC00 && second <= 0xDFFF) {
        return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
      }
    }
    return first;
  }
  function raw(callsite) {
    var raw = callsite.raw;
    var len = raw.length >>> 0;
    if (len === 0)
      return '';
    var s = '';
    var i = 0;
    while (true) {
      s += raw[i];
      if (i + 1 === len)
        return s;
      s += arguments[++i];
    }
  }
  function fromCodePoint(_) {
    var codeUnits = [];
    var floor = Math.floor;
    var highSurrogate;
    var lowSurrogate;
    var index = -1;
    var length = arguments.length;
    if (!length) {
      return '';
    }
    while (++index < length) {
      var codePoint = Number(arguments[index]);
      if (!isFinite(codePoint) || codePoint < 0 || codePoint > 0x10FFFF || floor(codePoint) != codePoint) {
        throw RangeError('Invalid code point: ' + codePoint);
      }
      if (codePoint <= 0xFFFF) {
        codeUnits.push(codePoint);
      } else {
        codePoint -= 0x10000;
        highSurrogate = (codePoint >> 10) + 0xD800;
        lowSurrogate = (codePoint % 0x400) + 0xDC00;
        codeUnits.push(highSurrogate, lowSurrogate);
      }
    }
    return String.fromCharCode.apply(null, codeUnits);
  }
  function stringPrototypeIterator() {
    var o = $traceurRuntime.checkObjectCoercible(this);
    var s = String(o);
    return createStringIterator(s);
  }
  function polyfillString(global) {
    var String = global.String;
    maybeAddFunctions(String.prototype, ['codePointAt', codePointAt, 'endsWith', endsWith, 'includes', includes, 'repeat', repeat, 'startsWith', startsWith]);
    maybeAddFunctions(String, ['fromCodePoint', fromCodePoint, 'raw', raw]);
    maybeAddIterator(String.prototype, stringPrototypeIterator, Symbol);
  }
  registerPolyfill(polyfillString);
  return {
    get startsWith() {
      return startsWith;
    },
    get endsWith() {
      return endsWith;
    },
    get includes() {
      return includes;
    },
    get repeat() {
      return repeat;
    },
    get codePointAt() {
      return codePointAt;
    },
    get raw() {
      return raw;
    },
    get fromCodePoint() {
      return fromCodePoint;
    },
    get stringPrototypeIterator() {
      return stringPrototypeIterator;
    },
    get polyfillString() {
      return polyfillString;
    }
  };
});
System.get("traceur-runtime@0.0.90/src/runtime/polyfills/String.js" + '');
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/ArrayIterator.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/ArrayIterator.js";
  var $__0 = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js"),
      toObject = $__0.toObject,
      toUint32 = $__0.toUint32,
      createIteratorResultObject = $__0.createIteratorResultObject;
  var ARRAY_ITERATOR_KIND_KEYS = 1;
  var ARRAY_ITERATOR_KIND_VALUES = 2;
  var ARRAY_ITERATOR_KIND_ENTRIES = 3;
  var ArrayIterator = function() {
    var $__2;
    function ArrayIterator() {}
    return ($traceurRuntime.createClass)(ArrayIterator, ($__2 = {}, Object.defineProperty($__2, "next", {
      value: function() {
        var iterator = toObject(this);
        var array = iterator.iteratorObject_;
        if (!array) {
          throw new TypeError('Object is not an ArrayIterator');
        }
        var index = iterator.arrayIteratorNextIndex_;
        var itemKind = iterator.arrayIterationKind_;
        var length = toUint32(array.length);
        if (index >= length) {
          iterator.arrayIteratorNextIndex_ = Infinity;
          return createIteratorResultObject(undefined, true);
        }
        iterator.arrayIteratorNextIndex_ = index + 1;
        if (itemKind == ARRAY_ITERATOR_KIND_VALUES)
          return createIteratorResultObject(array[index], false);
        if (itemKind == ARRAY_ITERATOR_KIND_ENTRIES)
          return createIteratorResultObject([index, array[index]], false);
        return createIteratorResultObject(index, false);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, Symbol.iterator, {
      value: function() {
        return this;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__2), {});
  }();
  function createArrayIterator(array, kind) {
    var object = toObject(array);
    var iterator = new ArrayIterator;
    iterator.iteratorObject_ = object;
    iterator.arrayIteratorNextIndex_ = 0;
    iterator.arrayIterationKind_ = kind;
    return iterator;
  }
  function entries() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_ENTRIES);
  }
  function keys() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_KEYS);
  }
  function values() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_VALUES);
  }
  return {
    get entries() {
      return entries;
    },
    get keys() {
      return keys;
    },
    get values() {
      return values;
    }
  };
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/Array.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/Array.js";
  var $__0 = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/ArrayIterator.js"),
      entries = $__0.entries,
      keys = $__0.keys,
      jsValues = $__0.values;
  var $__1 = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js"),
      checkIterable = $__1.checkIterable,
      isCallable = $__1.isCallable,
      isConstructor = $__1.isConstructor,
      maybeAddFunctions = $__1.maybeAddFunctions,
      maybeAddIterator = $__1.maybeAddIterator,
      registerPolyfill = $__1.registerPolyfill,
      toInteger = $__1.toInteger,
      toLength = $__1.toLength,
      toObject = $__1.toObject;
  function from(arrLike) {
    var mapFn = arguments[1];
    var thisArg = arguments[2];
    var C = this;
    var items = toObject(arrLike);
    var mapping = mapFn !== undefined;
    var k = 0;
    var arr,
        len;
    if (mapping && !isCallable(mapFn)) {
      throw TypeError();
    }
    if (checkIterable(items)) {
      arr = isConstructor(C) ? new C() : [];
      var $__5 = true;
      var $__6 = false;
      var $__7 = undefined;
      try {
        for (var $__3 = void 0,
            $__2 = (items)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
          var item = $__3.value;
          {
            if (mapping) {
              arr[k] = mapFn.call(thisArg, item, k);
            } else {
              arr[k] = item;
            }
            k++;
          }
        }
      } catch ($__8) {
        $__6 = true;
        $__7 = $__8;
      } finally {
        try {
          if (!$__5 && $__2.return != null) {
            $__2.return();
          }
        } finally {
          if ($__6) {
            throw $__7;
          }
        }
      }
      arr.length = k;
      return arr;
    }
    len = toLength(items.length);
    arr = isConstructor(C) ? new C(len) : new Array(len);
    for (; k < len; k++) {
      if (mapping) {
        arr[k] = typeof thisArg === 'undefined' ? mapFn(items[k], k) : mapFn.call(thisArg, items[k], k);
      } else {
        arr[k] = items[k];
      }
    }
    arr.length = len;
    return arr;
  }
  function of() {
    for (var items = [],
        $__9 = 0; $__9 < arguments.length; $__9++)
      items[$__9] = arguments[$__9];
    var C = this;
    var len = items.length;
    var arr = isConstructor(C) ? new C(len) : new Array(len);
    for (var k = 0; k < len; k++) {
      arr[k] = items[k];
    }
    arr.length = len;
    return arr;
  }
  function fill(value) {
    var start = arguments[1] !== (void 0) ? arguments[1] : 0;
    var end = arguments[2];
    var object = toObject(this);
    var len = toLength(object.length);
    var fillStart = toInteger(start);
    var fillEnd = end !== undefined ? toInteger(end) : len;
    fillStart = fillStart < 0 ? Math.max(len + fillStart, 0) : Math.min(fillStart, len);
    fillEnd = fillEnd < 0 ? Math.max(len + fillEnd, 0) : Math.min(fillEnd, len);
    while (fillStart < fillEnd) {
      object[fillStart] = value;
      fillStart++;
    }
    return object;
  }
  function find(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg);
  }
  function findIndex(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg, true);
  }
  function findHelper(self, predicate) {
    var thisArg = arguments[2];
    var returnIndex = arguments[3] !== (void 0) ? arguments[3] : false;
    var object = toObject(self);
    var len = toLength(object.length);
    if (!isCallable(predicate)) {
      throw TypeError();
    }
    for (var i = 0; i < len; i++) {
      var value = object[i];
      if (predicate.call(thisArg, value, i, object)) {
        return returnIndex ? i : value;
      }
    }
    return returnIndex ? -1 : undefined;
  }
  function polyfillArray(global) {
    var $__10 = global,
        Array = $__10.Array,
        Object = $__10.Object,
        Symbol = $__10.Symbol;
    var values = jsValues;
    if (Symbol && Symbol.iterator && Array.prototype[Symbol.iterator]) {
      values = Array.prototype[Symbol.iterator];
    }
    maybeAddFunctions(Array.prototype, ['entries', entries, 'keys', keys, 'values', values, 'fill', fill, 'find', find, 'findIndex', findIndex]);
    maybeAddFunctions(Array, ['from', from, 'of', of]);
    maybeAddIterator(Array.prototype, values, Symbol);
    maybeAddIterator(Object.getPrototypeOf([].values()), function() {
      return this;
    }, Symbol);
  }
  registerPolyfill(polyfillArray);
  return {
    get from() {
      return from;
    },
    get of() {
      return of;
    },
    get fill() {
      return fill;
    },
    get find() {
      return find;
    },
    get findIndex() {
      return findIndex;
    },
    get polyfillArray() {
      return polyfillArray;
    }
  };
});
System.get("traceur-runtime@0.0.90/src/runtime/polyfills/Array.js" + '');
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/Object.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/Object.js";
  var $__0 = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__0.maybeAddFunctions,
      registerPolyfill = $__0.registerPolyfill;
  var $__1 = $traceurRuntime,
      defineProperty = $__1.defineProperty,
      getOwnPropertyDescriptor = $__1.getOwnPropertyDescriptor,
      getOwnPropertyNames = $__1.getOwnPropertyNames,
      isPrivateName = $__1.isPrivateName,
      keys = $__1.keys;
  function is(left, right) {
    if (left === right)
      return left !== 0 || 1 / left === 1 / right;
    return left !== left && right !== right;
  }
  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      var props = source == null ? [] : keys(source);
      var p = void 0,
          length = props.length;
      for (p = 0; p < length; p++) {
        var name = props[p];
        if (isPrivateName(name))
          continue;
        target[name] = source[name];
      }
    }
    return target;
  }
  function mixin(target, source) {
    var props = getOwnPropertyNames(source);
    var p,
        descriptor,
        length = props.length;
    for (p = 0; p < length; p++) {
      var name = props[p];
      if (isPrivateName(name))
        continue;
      descriptor = getOwnPropertyDescriptor(source, props[p]);
      defineProperty(target, props[p], descriptor);
    }
    return target;
  }
  function polyfillObject(global) {
    var Object = global.Object;
    maybeAddFunctions(Object, ['assign', assign, 'is', is, 'mixin', mixin]);
  }
  registerPolyfill(polyfillObject);
  return {
    get is() {
      return is;
    },
    get assign() {
      return assign;
    },
    get mixin() {
      return mixin;
    },
    get polyfillObject() {
      return polyfillObject;
    }
  };
});
System.get("traceur-runtime@0.0.90/src/runtime/polyfills/Object.js" + '');
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/Number.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/Number.js";
  var $__0 = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js"),
      isNumber = $__0.isNumber,
      maybeAddConsts = $__0.maybeAddConsts,
      maybeAddFunctions = $__0.maybeAddFunctions,
      registerPolyfill = $__0.registerPolyfill,
      toInteger = $__0.toInteger;
  var $abs = Math.abs;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
  var MIN_SAFE_INTEGER = -Math.pow(2, 53) + 1;
  var EPSILON = Math.pow(2, -52);
  function NumberIsFinite(number) {
    return isNumber(number) && $isFinite(number);
  }
  function isInteger(number) {
    return NumberIsFinite(number) && toInteger(number) === number;
  }
  function NumberIsNaN(number) {
    return isNumber(number) && $isNaN(number);
  }
  function isSafeInteger(number) {
    if (NumberIsFinite(number)) {
      var integral = toInteger(number);
      if (integral === number)
        return $abs(integral) <= MAX_SAFE_INTEGER;
    }
    return false;
  }
  function polyfillNumber(global) {
    var Number = global.Number;
    maybeAddConsts(Number, ['MAX_SAFE_INTEGER', MAX_SAFE_INTEGER, 'MIN_SAFE_INTEGER', MIN_SAFE_INTEGER, 'EPSILON', EPSILON]);
    maybeAddFunctions(Number, ['isFinite', NumberIsFinite, 'isInteger', isInteger, 'isNaN', NumberIsNaN, 'isSafeInteger', isSafeInteger]);
  }
  registerPolyfill(polyfillNumber);
  return {
    get MAX_SAFE_INTEGER() {
      return MAX_SAFE_INTEGER;
    },
    get MIN_SAFE_INTEGER() {
      return MIN_SAFE_INTEGER;
    },
    get EPSILON() {
      return EPSILON;
    },
    get isFinite() {
      return NumberIsFinite;
    },
    get isInteger() {
      return isInteger;
    },
    get isNaN() {
      return NumberIsNaN;
    },
    get isSafeInteger() {
      return isSafeInteger;
    },
    get polyfillNumber() {
      return polyfillNumber;
    }
  };
});
System.get("traceur-runtime@0.0.90/src/runtime/polyfills/Number.js" + '');
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/fround.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/fround.js";
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $__0 = Math,
      LN2 = $__0.LN2,
      abs = $__0.abs,
      floor = $__0.floor,
      log = $__0.log,
      min = $__0.min,
      pow = $__0.pow;
  function packIEEE754(v, ebits, fbits) {
    var bias = (1 << (ebits - 1)) - 1,
        s,
        e,
        f,
        ln,
        i,
        bits,
        str,
        bytes;
    function roundToEven(n) {
      var w = floor(n),
          f = n - w;
      if (f < 0.5)
        return w;
      if (f > 0.5)
        return w + 1;
      return w % 2 ? w + 1 : w;
    }
    if (v !== v) {
      e = (1 << ebits) - 1;
      f = pow(2, fbits - 1);
      s = 0;
    } else if (v === Infinity || v === -Infinity) {
      e = (1 << ebits) - 1;
      f = 0;
      s = (v < 0) ? 1 : 0;
    } else if (v === 0) {
      e = 0;
      f = 0;
      s = (1 / v === -Infinity) ? 1 : 0;
    } else {
      s = v < 0;
      v = abs(v);
      if (v >= pow(2, 1 - bias)) {
        e = min(floor(log(v) / LN2), 1023);
        f = roundToEven(v / pow(2, e) * pow(2, fbits));
        if (f / pow(2, fbits) >= 2) {
          e = e + 1;
          f = 1;
        }
        if (e > bias) {
          e = (1 << ebits) - 1;
          f = 0;
        } else {
          e = e + bias;
          f = f - pow(2, fbits);
        }
      } else {
        e = 0;
        f = roundToEven(v / pow(2, 1 - bias - fbits));
      }
    }
    bits = [];
    for (i = fbits; i; i -= 1) {
      bits.push(f % 2 ? 1 : 0);
      f = floor(f / 2);
    }
    for (i = ebits; i; i -= 1) {
      bits.push(e % 2 ? 1 : 0);
      e = floor(e / 2);
    }
    bits.push(s ? 1 : 0);
    bits.reverse();
    str = bits.join('');
    bytes = [];
    while (str.length) {
      bytes.push(parseInt(str.substring(0, 8), 2));
      str = str.substring(8);
    }
    return bytes;
  }
  function unpackIEEE754(bytes, ebits, fbits) {
    var bits = [],
        i,
        j,
        b,
        str,
        bias,
        s,
        e,
        f;
    for (i = bytes.length; i; i -= 1) {
      b = bytes[i - 1];
      for (j = 8; j; j -= 1) {
        bits.push(b % 2 ? 1 : 0);
        b = b >> 1;
      }
    }
    bits.reverse();
    str = bits.join('');
    bias = (1 << (ebits - 1)) - 1;
    s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
    e = parseInt(str.substring(1, 1 + ebits), 2);
    f = parseInt(str.substring(1 + ebits), 2);
    if (e === (1 << ebits) - 1) {
      return f !== 0 ? NaN : s * Infinity;
    } else if (e > 0) {
      return s * pow(2, e - bias) * (1 + f / pow(2, fbits));
    } else if (f !== 0) {
      return s * pow(2, -(bias - 1)) * (f / pow(2, fbits));
    } else {
      return s < 0 ? -0 : 0;
    }
  }
  function unpackF32(b) {
    return unpackIEEE754(b, 8, 23);
  }
  function packF32(v) {
    return packIEEE754(v, 8, 23);
  }
  function fround(x) {
    if (x === 0 || !$isFinite(x) || $isNaN(x)) {
      return x;
    }
    return unpackF32(packF32(Number(x)));
  }
  return {get fround() {
      return fround;
    }};
});
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/Math.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/Math.js";
  var jsFround = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/fround.js").fround;
  var $__1 = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__1.maybeAddFunctions,
      registerPolyfill = $__1.registerPolyfill,
      toUint32 = $__1.toUint32;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $__2 = Math,
      abs = $__2.abs,
      ceil = $__2.ceil,
      exp = $__2.exp,
      floor = $__2.floor,
      log = $__2.log,
      pow = $__2.pow,
      sqrt = $__2.sqrt;
  function clz32(x) {
    x = toUint32(+x);
    if (x == 0)
      return 32;
    var result = 0;
    if ((x & 0xFFFF0000) === 0) {
      x <<= 16;
      result += 16;
    }
    ;
    if ((x & 0xFF000000) === 0) {
      x <<= 8;
      result += 8;
    }
    ;
    if ((x & 0xF0000000) === 0) {
      x <<= 4;
      result += 4;
    }
    ;
    if ((x & 0xC0000000) === 0) {
      x <<= 2;
      result += 2;
    }
    ;
    if ((x & 0x80000000) === 0) {
      x <<= 1;
      result += 1;
    }
    ;
    return result;
  }
  function imul(x, y) {
    x = toUint32(+x);
    y = toUint32(+y);
    var xh = (x >>> 16) & 0xffff;
    var xl = x & 0xffff;
    var yh = (y >>> 16) & 0xffff;
    var yl = y & 0xffff;
    return xl * yl + (((xh * yl + xl * yh) << 16) >>> 0) | 0;
  }
  function sign(x) {
    x = +x;
    if (x > 0)
      return 1;
    if (x < 0)
      return -1;
    return x;
  }
  function log10(x) {
    return log(x) * 0.434294481903251828;
  }
  function log2(x) {
    return log(x) * 1.442695040888963407;
  }
  function log1p(x) {
    x = +x;
    if (x < -1 || $isNaN(x)) {
      return NaN;
    }
    if (x === 0 || x === Infinity) {
      return x;
    }
    if (x === -1) {
      return -Infinity;
    }
    var result = 0;
    var n = 50;
    if (x < 0 || x > 1) {
      return log(1 + x);
    }
    for (var i = 1; i < n; i++) {
      if ((i % 2) === 0) {
        result -= pow(x, i) / i;
      } else {
        result += pow(x, i) / i;
      }
    }
    return result;
  }
  function expm1(x) {
    x = +x;
    if (x === -Infinity) {
      return -1;
    }
    if (!$isFinite(x) || x === 0) {
      return x;
    }
    return exp(x) - 1;
  }
  function cosh(x) {
    x = +x;
    if (x === 0) {
      return 1;
    }
    if ($isNaN(x)) {
      return NaN;
    }
    if (!$isFinite(x)) {
      return Infinity;
    }
    if (x < 0) {
      x = -x;
    }
    if (x > 21) {
      return exp(x) / 2;
    }
    return (exp(x) + exp(-x)) / 2;
  }
  function sinh(x) {
    x = +x;
    if (!$isFinite(x) || x === 0) {
      return x;
    }
    return (exp(x) - exp(-x)) / 2;
  }
  function tanh(x) {
    x = +x;
    if (x === 0)
      return x;
    if (!$isFinite(x))
      return sign(x);
    var exp1 = exp(x);
    var exp2 = exp(-x);
    return (exp1 - exp2) / (exp1 + exp2);
  }
  function acosh(x) {
    x = +x;
    if (x < 1)
      return NaN;
    if (!$isFinite(x))
      return x;
    return log(x + sqrt(x + 1) * sqrt(x - 1));
  }
  function asinh(x) {
    x = +x;
    if (x === 0 || !$isFinite(x))
      return x;
    if (x > 0)
      return log(x + sqrt(x * x + 1));
    return -log(-x + sqrt(x * x + 1));
  }
  function atanh(x) {
    x = +x;
    if (x === -1) {
      return -Infinity;
    }
    if (x === 1) {
      return Infinity;
    }
    if (x === 0) {
      return x;
    }
    if ($isNaN(x) || x < -1 || x > 1) {
      return NaN;
    }
    return 0.5 * log((1 + x) / (1 - x));
  }
  function hypot(x, y) {
    var length = arguments.length;
    var args = new Array(length);
    var max = 0;
    for (var i = 0; i < length; i++) {
      var n = arguments[i];
      n = +n;
      if (n === Infinity || n === -Infinity)
        return Infinity;
      n = abs(n);
      if (n > max)
        max = n;
      args[i] = n;
    }
    if (max === 0)
      max = 1;
    var sum = 0;
    var compensation = 0;
    for (var i = 0; i < length; i++) {
      var n = args[i] / max;
      var summand = n * n - compensation;
      var preliminary = sum + summand;
      compensation = (preliminary - sum) - summand;
      sum = preliminary;
    }
    return sqrt(sum) * max;
  }
  function trunc(x) {
    x = +x;
    if (x > 0)
      return floor(x);
    if (x < 0)
      return ceil(x);
    return x;
  }
  var fround,
      f32;
  if (typeof Float32Array === 'function') {
    f32 = new Float32Array(1);
    fround = function(x) {
      f32[0] = Number(x);
      return f32[0];
    };
  } else {
    fround = jsFround;
  }
  function cbrt(x) {
    x = +x;
    if (x === 0)
      return x;
    var negate = x < 0;
    if (negate)
      x = -x;
    var result = pow(x, 1 / 3);
    return negate ? -result : result;
  }
  function polyfillMath(global) {
    var Math = global.Math;
    maybeAddFunctions(Math, ['acosh', acosh, 'asinh', asinh, 'atanh', atanh, 'cbrt', cbrt, 'clz32', clz32, 'cosh', cosh, 'expm1', expm1, 'fround', fround, 'hypot', hypot, 'imul', imul, 'log10', log10, 'log1p', log1p, 'log2', log2, 'sign', sign, 'sinh', sinh, 'tanh', tanh, 'trunc', trunc]);
  }
  registerPolyfill(polyfillMath);
  return {
    get clz32() {
      return clz32;
    },
    get imul() {
      return imul;
    },
    get sign() {
      return sign;
    },
    get log10() {
      return log10;
    },
    get log2() {
      return log2;
    },
    get log1p() {
      return log1p;
    },
    get expm1() {
      return expm1;
    },
    get cosh() {
      return cosh;
    },
    get sinh() {
      return sinh;
    },
    get tanh() {
      return tanh;
    },
    get acosh() {
      return acosh;
    },
    get asinh() {
      return asinh;
    },
    get atanh() {
      return atanh;
    },
    get hypot() {
      return hypot;
    },
    get trunc() {
      return trunc;
    },
    get fround() {
      return fround;
    },
    get cbrt() {
      return cbrt;
    },
    get polyfillMath() {
      return polyfillMath;
    }
  };
});
System.get("traceur-runtime@0.0.90/src/runtime/polyfills/Math.js" + '');
System.registerModule("traceur-runtime@0.0.90/src/runtime/polyfills/polyfills.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.90/src/runtime/polyfills/polyfills.js";
  var polyfillAll = System.get("traceur-runtime@0.0.90/src/runtime/polyfills/utils.js").polyfillAll;
  polyfillAll(Reflect.global);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
    polyfillAll(global);
  };
  return {};
});
System.get("traceur-runtime@0.0.90/src/runtime/polyfills/polyfills.js" + '');

System = curSystem; })();
(function(global) {

  var defined = {};

  // indexOf polyfill for IE8
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  function dedupe(deps) {
    var newDeps = [];
    for (var i = 0, l = deps.length; i < l; i++)
      if (indexOf.call(newDeps, deps[i]) == -1)
        newDeps.push(deps[i])
    return newDeps;
  }

  function register(name, deps, declare) {
    if (arguments.length === 4)
      return registerDynamic.apply(this, arguments);
    doRegister(name, {
      declarative: true,
      deps: deps,
      declare: declare
    });
  }

  function registerDynamic(name, deps, executingRequire, execute) {
    doRegister(name, {
      declarative: false,
      deps: deps,
      executingRequire: executingRequire,
      execute: execute
    });
  }

  function doRegister(name, entry) {
    entry.name = name;

    // we never overwrite an existing define
    if (!(name in defined))
      defined[name] = entry; 

    entry.deps = dedupe(entry.deps);

    // we have to normalize dependencies
    // (assume dependencies are normalized for now)
    // entry.normalizedDeps = entry.deps.map(normalize);
    entry.normalizedDeps = entry.deps;
  }


  function buildGroups(entry, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1)
      return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];

      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated)
        continue;

      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === undefined || depEntry.groupIndex < depGroupIndex) {

        // if already in a group, remove from the old group
        if (depEntry.groupIndex !== undefined) {
          groups[depEntry.groupIndex].splice(indexOf.call(groups[depEntry.groupIndex], depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0)
            throw new TypeError("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, groups);
    }
  }

  function link(name) {
    var startEntry = defined[name];

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative)
          linkDeclarativeModule(entry);
        else
          linkDynamicModule(entry);
      }
      curGroupDeclarative = !curGroupDeclarative; 
    }
  }

  // module binding records
  var moduleRecords = {};
  function getOrCreateModuleRecord(name) {
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      exports: {}, // start from an empty module and extend
      importers: []
    })
  }

  function linkDeclarativeModule(entry) {
    // only link if already not already started linking (stops at circular)
    if (entry.module)
      return;

    var module = entry.module = getOrCreateModuleRecord(entry.name);
    var exports = entry.module.exports;

    var declaration = entry.declare.call(global, function(name, value) {
      module.locked = true;
      exports[name] = value;

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          var importerIndex = indexOf.call(importerModule.dependencies, module);
          importerModule.setters[importerIndex](exports);
        }
      }

      module.locked = false;
      return value;
    });

    module.setters = declaration.setters;
    module.execute = declaration.execute;

    // now link all the module dependencies
    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];
      var depModule = moduleRecords[depName];

      // work out how to set depExports based on scenarios...
      var depExports;

      if (depModule) {
        depExports = depModule.exports;
      }
      else if (depEntry && !depEntry.declarative) {
        depExports = depEntry.esModule;
      }
      // in the module registry
      else if (!depEntry) {
        depExports = load(depName);
      }
      // we have an entry -> link
      else {
        linkDeclarativeModule(depEntry);
        depModule = depEntry.module;
        depExports = depModule.exports;
      }

      // only declarative modules have dynamic bindings
      if (depModule && depModule.importers) {
        depModule.importers.push(module);
        module.dependencies.push(depModule);
      }
      else
        module.dependencies.push(null);

      // run the setter for this dependency
      if (module.setters[i])
        module.setters[i](depExports);
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name) {
    var exports;
    var entry = defined[name];

    if (!entry) {
      exports = load(name);
      if (!exports)
        throw new Error("Unable to load dependency " + name + ".");
    }

    else {
      if (entry.declarative)
        ensureEvaluated(name, []);

      else if (!entry.evaluated)
        linkDynamicModule(entry);

      exports = entry.module.exports;
    }

    if ((!entry || entry.declarative) && exports && exports.__useDefault)
      return exports['default'];

    return exports;
  }

  function linkDynamicModule(entry) {
    if (entry.module)
      return;

    var exports = {};

    var module = entry.module = { exports: exports, id: entry.name };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
        var depName = entry.normalizedDeps[i];
        var depEntry = defined[depName];
        if (depEntry)
          linkDynamicModule(depEntry);
      }
    }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(global, function(name) {
      for (var i = 0, l = entry.deps.length; i < l; i++) {
        if (entry.deps[i] != name)
          continue;
        return getModule(entry.normalizedDeps[i]);
      }
      throw new TypeError('Module ' + name + ' not declared as a dependency.');
    }, exports, module);

    if (output)
      module.exports = output;

    // create the esModule object, which allows ES6 named imports of dynamics
    exports = module.exports;
 
    if (exports && exports.__esModule) {
      entry.esModule = exports;
    }
    else {
      var hasOwnProperty = exports && exports.hasOwnProperty;
      entry.esModule = {};
      for (var p in exports) {
        if (!hasOwnProperty || exports.hasOwnProperty(p))
          entry.esModule[p] = exports[p];
      }
      entry.esModule['default'] = exports;
      entry.esModule.__useDefault = true;
    }
  }

  /*
   * Given a module, and the list of modules for this current branch,
   *  ensure that each of the dependencies of this module is evaluated
   *  (unless one is a circular dependency already in the list of seen
   *  modules, in which case we execute it)
   *
   * Then we evaluate the module itself depth-first left to right 
   * execution to match ES6 modules
   */
  function ensureEvaluated(moduleName, seen) {
    var entry = defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (!entry || entry.evaluated || !entry.declarative)
      return;

    // this only applies to declarative modules which late-execute

    seen.push(moduleName);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!defined[depName])
          load(depName);
        else
          ensureEvaluated(depName, seen);
      }
    }

    if (entry.evaluated)
      return;

    entry.evaluated = true;
    entry.module.execute.call(global);
  }

  // magical execution function
  var modules = {};
  function load(name) {
    if (modules[name])
      return modules[name];

    var entry = defined[name];

    // first we check if this module has already been defined in the registry
    if (!entry)
      throw "Module " + name + " not present.";

    // recursively ensure that the module and all its 
    // dependencies are linked (with dependency group handling)
    link(name);

    // now handle dependency execution in correct order
    ensureEvaluated(name, []);

    // remove from the registry
    defined[name] = undefined;

    // return the defined module object
    return modules[name] = entry.declarative ? entry.module.exports : entry.esModule;
  };

  return function(mains, declare) {
    return function(formatDetect) {
      formatDetect(function() {
        var System = {
          _nodeRequire: typeof require != 'undefined' && require.resolve && typeof process != 'undefined' && require,
          register: register,
          registerDynamic: registerDynamic,
          get: load, 
          set: function(name, module) {
            modules[name] = module; 
          },
          newModule: function(module) {
            return module;
          },
          'import': function() {
            throw new TypeError('Dynamic System.import calls are not supported for SFX bundles. Rather use a named bundle.');
          }
        };
        System.set('@empty', {});

        declare(System);

        var firstLoad = load(mains[0]);
        if (mains.length > 1)
          for (var i = 1; i < mains.length; i++)
            load(mains[i]);

        return firstLoad;
      });
    };
  };

})(typeof self != 'undefined' ? self : global)
/* (['mainModule'], function(System) {
  System.register(...);
})
(function(factory) {
  if (typeof define && define.amd)
    define(factory);
  // etc UMD / module pattern
})*/

(['main.js'], function(System) {

(function(__global) {
  var hasOwnProperty = __global.hasOwnProperty;
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  function readMemberExpression(p, value) {
    var pParts = p.split('.');
    while (pParts.length)
      value = value[pParts.shift()];
    return value;
  }

  // bare minimum ignores for IE8
  var ignoredGlobalProps = ['_g', 'sessionStorage', 'localStorage', 'clipboardData', 'frames', 'external'];

  var globalSnapshot;

  function forEachGlobal(callback) {
    if (Object.keys)
      Object.keys(__global).forEach(callback);
    else
      for (var g in __global) {
        if (!hasOwnProperty.call(__global, g))
          continue;
        callback(g);
      }
  }

  function forEachGlobalValue(callback) {
    forEachGlobal(function(globalName) {
      if (indexOf.call(ignoredGlobalProps, globalName) != -1)
        return;
      try {
        var value = __global[globalName];
      }
      catch (e) {
        ignoredGlobalProps.push(globalName);
      }
      callback(globalName, value);
    });
  }

  System.set('@@global-helpers', System.newModule({
    prepareGlobal: function(moduleName, exportName, globals) {
      // set globals
      var oldGlobals;
      if (globals) {
        oldGlobals = {};
        for (var g in globals) {
          oldGlobals[g] = globals[g];
          __global[g] = globals[g];
        }
      }

      // store a complete copy of the global object in order to detect changes
      if (!exportName) {
        globalSnapshot = {};

        forEachGlobalValue(function(name, value) {
          globalSnapshot[name] = value;
        });
      }

      // return function to retrieve global
      return function() {
        var globalValue;

        if (exportName) {
          globalValue = readMemberExpression(exportName, __global);
        }
        else {
          var singleGlobal;
          var multipleExports;
          var exports = {};

          forEachGlobalValue(function(name, value) {
            if (globalSnapshot[name] === value)
              return;
            if (typeof value == 'undefined')
              return;
            exports[name] = value;

            if (typeof singleGlobal != 'undefined') {
              if (!multipleExports && singleGlobal !== value)
                multipleExports = true;
            }
            else {
              singleGlobal = value;
            }
          });
          globalValue = multipleExports ? exports : singleGlobal;
        }

        // revert globals
        if (oldGlobals) {
          for (var g in oldGlobals)
            __global[g] = oldGlobals[g];
        }

        return globalValue;
      };
    }
  }));

})(typeof self != 'undefined' ? self : global);

(function(__global) {
  var loader = System;
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  var commentRegEx = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
  var cjsRequirePre = "(?:^|[^$_a-zA-Z\\xA0-\\uFFFF.])";
  var cjsRequirePost = "\\s*\\(\\s*(\"([^\"]+)\"|'([^']+)')\\s*\\)";
  var fnBracketRegEx = /\(([^\)]*)\)/;
  var wsRegEx = /^\s+|\s+$/g;
  
  var requireRegExs = {};

  function getCJSDeps(source, requireIndex) {

    // remove comments
    source = source.replace(commentRegEx, '');

    // determine the require alias
    var params = source.match(fnBracketRegEx);
    var requireAlias = (params[1].split(',')[requireIndex] || 'require').replace(wsRegEx, '');

    // find or generate the regex for this requireAlias
    var requireRegEx = requireRegExs[requireAlias] || (requireRegExs[requireAlias] = new RegExp(cjsRequirePre + requireAlias + cjsRequirePost, 'g'));

    requireRegEx.lastIndex = 0;

    var deps = [];

    var match;
    while (match = requireRegEx.exec(source))
      deps.push(match[2] || match[3]);

    return deps;
  }

  /*
    AMD-compatible require
    To copy RequireJS, set window.require = window.requirejs = loader.amdRequire
  */
  function require(names, callback, errback, referer) {
    // in amd, first arg can be a config object... we just ignore
    if (typeof names == 'object' && !(names instanceof Array))
      return require.apply(null, Array.prototype.splice.call(arguments, 1, arguments.length - 1));

    // amd require
    if (typeof names == 'string' && typeof callback == 'function')
      names = [names];
    if (names instanceof Array) {
      var dynamicRequires = [];
      for (var i = 0; i < names.length; i++)
        dynamicRequires.push(loader['import'](names[i], referer));
      Promise.all(dynamicRequires).then(function(modules) {
        if (callback)
          callback.apply(null, modules);
      }, errback);
    }

    // commonjs require
    else if (typeof names == 'string') {
      var module = loader.get(names);
      return module.__useDefault ? module['default'] : module;
    }

    else
      throw new TypeError('Invalid require');
  };

  function define(name, deps, factory) {
    if (typeof name != 'string') {
      factory = deps;
      deps = name;
      name = null;
    }
    if (!(deps instanceof Array)) {
      factory = deps;
      deps = ['require', 'exports', 'module'].splice(0, factory.length);
    }

    if (typeof factory != 'function')
      factory = (function(factory) {
        return function() { return factory; }
      })(factory);

    // in IE8, a trailing comma becomes a trailing undefined entry
    if (deps[deps.length - 1] === undefined)
      deps.pop();

    // remove system dependencies
    var requireIndex, exportsIndex, moduleIndex;
    
    if ((requireIndex = indexOf.call(deps, 'require')) != -1) {
      
      deps.splice(requireIndex, 1);

      // only trace cjs requires for non-named
      // named defines assume the trace has already been done
      if (!name)
        deps = deps.concat(getCJSDeps(factory.toString(), requireIndex));
    }

    if ((exportsIndex = indexOf.call(deps, 'exports')) != -1)
      deps.splice(exportsIndex, 1);
    
    if ((moduleIndex = indexOf.call(deps, 'module')) != -1)
      deps.splice(moduleIndex, 1);

    var define = {
      name: name,
      deps: deps,
      execute: function(req, exports, module) {

        var depValues = [];
        for (var i = 0; i < deps.length; i++)
          depValues.push(req(deps[i]));

        module.uri = loader.baseURL + (module.id[0] == '/' ? module.id : '/' + module.id);

        module.config = function() {};

        // add back in system dependencies
        if (moduleIndex != -1)
          depValues.splice(moduleIndex, 0, module);
        
        if (exportsIndex != -1)
          depValues.splice(exportsIndex, 0, exports);
        
        if (requireIndex != -1) 
          depValues.splice(requireIndex, 0, function(names, callback, errback) {
            if (typeof names == 'string' && typeof callback != 'function')
              return req(names);
            return require.call(loader, names, callback, errback, module.id);
          });

        // set global require to AMD require
        var curRequire = __global.require;
        __global.require = require;

        var output = factory.apply(exportsIndex == -1 ? __global : exports, depValues);

        __global.require = curRequire;

        if (typeof output == 'undefined' && module)
          output = module.exports;

        if (typeof output != 'undefined')
          return output;
      }
    };

    // anonymous define
    if (!name) {
      // already defined anonymously -> throw
      if (lastModule.anonDefine)
        throw new TypeError('Multiple defines for anonymous module');
      lastModule.anonDefine = define;
    }
    // named define
    else {
      // if it has no dependencies and we don't have any other
      // defines, then let this be an anonymous define
      // this is just to support single modules of the form:
      // define('jquery')
      // still loading anonymously
      // because it is done widely enough to be useful
      if (deps.length == 0 && !lastModule.anonDefine && !lastModule.isBundle) {
        lastModule.anonDefine = define;
      }
      // otherwise its a bundle only
      else {
        // if there is an anonDefine already (we thought it could have had a single named define)
        // then we define it now
        // this is to avoid defining named defines when they are actually anonymous
        if (lastModule.anonDefine && lastModule.anonDefine.name)
          loader.registerDynamic(lastModule.anonDefine.name, lastModule.anonDefine.deps, false, lastModule.anonDefine.execute);

        lastModule.anonDefine = null;
      }

      // note this is now a bundle
      lastModule.isBundle = true;

      // define the module through the register registry
      loader.registerDynamic(name, define.deps, false, define.execute);
    }
  }
  define.amd = {};

  // adds define as a global (potentially just temporarily)
  function createDefine(loader) {
    lastModule.anonDefine = null;
    lastModule.isBundle = false;

    // ensure no NodeJS environment detection
    var oldModule = __global.module;
    var oldExports = __global.exports;
    var oldDefine = __global.define;

    __global.module = undefined;
    __global.exports = undefined;
    __global.define = define;

    return function() {
      __global.define = oldDefine;
      __global.module = oldModule;
      __global.exports = oldExports;
    };
  }

  var lastModule = {
    isBundle: false,
    anonDefine: null
  };

  loader.set('@@amd-helpers', loader.newModule({
    createDefine: createDefine,
    require: require,
    define: define,
    lastModule: lastModule
  }));
  loader.amdDefine = define;
  loader.amdRequire = require;
})(typeof self != 'undefined' ? self : global);
System.registerDynamic("npm:process@0.10.1/browser.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var process = module.exports = {};
  var queue = [];
  var draining = false;
  function drainQueue() {
    if (draining) {
      return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while (len) {
      currentQueue = queue;
      queue = [];
      var i = -1;
      while (++i < len) {
        currentQueue[i]();
      }
      len = queue.length;
    }
    draining = false;
  }
  process.nextTick = function(fun) {
    queue.push(fun);
    if (!draining) {
      setTimeout(drainQueue, 0);
    }
  };
  process.title = 'browser';
  process.browser = true;
  process.env = {};
  process.argv = [];
  process.version = '';
  process.versions = {};
  function noop() {}
  process.on = noop;
  process.addListener = noop;
  process.once = noop;
  process.off = noop;
  process.removeListener = noop;
  process.removeAllListeners = noop;
  process.emit = noop;
  process.binding = function(name) {
    throw new Error('process.binding is not supported');
  };
  process.cwd = function() {
    return '/';
  };
  process.chdir = function(dir) {
    throw new Error('process.chdir is not supported');
  };
  process.umask = function() {
    return 0;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:eventemitter3@1.1.1/index.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var prefix = typeof Object.create !== 'function' ? '~' : false;
  function EE(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
  }
  function EventEmitter() {}
  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype.listeners = function listeners(event, exists) {
    var evt = prefix ? prefix + event : event,
        available = this._events && this._events[evt];
    if (exists)
      return !!available;
    if (!available)
      return [];
    if (available.fn)
      return [available.fn];
    for (var i = 0,
        l = available.length,
        ee = new Array(l); i < l; i++) {
      ee[i] = available[i].fn;
    }
    return ee;
  };
  EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
    var evt = prefix ? prefix + event : event;
    if (!this._events || !this._events[evt])
      return false;
    var listeners = this._events[evt],
        len = arguments.length,
        args,
        i;
    if ('function' === typeof listeners.fn) {
      if (listeners.once)
        this.removeListener(event, listeners.fn, undefined, true);
      switch (len) {
        case 1:
          return listeners.fn.call(listeners.context), true;
        case 2:
          return listeners.fn.call(listeners.context, a1), true;
        case 3:
          return listeners.fn.call(listeners.context, a1, a2), true;
        case 4:
          return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
      }
      for (i = 1, args = new Array(len - 1); i < len; i++) {
        args[i - 1] = arguments[i];
      }
      listeners.fn.apply(listeners.context, args);
    } else {
      var length = listeners.length,
          j;
      for (i = 0; i < length; i++) {
        if (listeners[i].once)
          this.removeListener(event, listeners[i].fn, undefined, true);
        switch (len) {
          case 1:
            listeners[i].fn.call(listeners[i].context);
            break;
          case 2:
            listeners[i].fn.call(listeners[i].context, a1);
            break;
          case 3:
            listeners[i].fn.call(listeners[i].context, a1, a2);
            break;
          default:
            if (!args)
              for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
            listeners[i].fn.apply(listeners[i].context, args);
        }
      }
    }
    return true;
  };
  EventEmitter.prototype.on = function on(event, fn, context) {
    var listener = new EE(fn, context || this),
        evt = prefix ? prefix + event : event;
    if (!this._events)
      this._events = prefix ? {} : Object.create(null);
    if (!this._events[evt])
      this._events[evt] = listener;
    else {
      if (!this._events[evt].fn)
        this._events[evt].push(listener);
      else
        this._events[evt] = [this._events[evt], listener];
    }
    return this;
  };
  EventEmitter.prototype.once = function once(event, fn, context) {
    var listener = new EE(fn, context || this, true),
        evt = prefix ? prefix + event : event;
    if (!this._events)
      this._events = prefix ? {} : Object.create(null);
    if (!this._events[evt])
      this._events[evt] = listener;
    else {
      if (!this._events[evt].fn)
        this._events[evt].push(listener);
      else
        this._events[evt] = [this._events[evt], listener];
    }
    return this;
  };
  EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
    var evt = prefix ? prefix + event : event;
    if (!this._events || !this._events[evt])
      return this;
    var listeners = this._events[evt],
        events = [];
    if (fn) {
      if (listeners.fn) {
        if (listeners.fn !== fn || (once && !listeners.once) || (context && listeners.context !== context)) {
          events.push(listeners);
        }
      } else {
        for (var i = 0,
            length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || (once && !listeners[i].once) || (context && listeners[i].context !== context)) {
            events.push(listeners[i]);
          }
        }
      }
    }
    if (events.length) {
      this._events[evt] = events.length === 1 ? events[0] : events;
    } else {
      delete this._events[evt];
    }
    return this;
  };
  EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
    if (!this._events)
      return this;
    if (event)
      delete this._events[prefix ? prefix + event : event];
    else
      this._events = prefix ? {} : Object.create(null);
    return this;
  };
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;
  EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
    return this;
  };
  EventEmitter.prefixed = prefix;
  if ('undefined' !== typeof module) {
    module.exports = EventEmitter;
  }
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/transitions/Easing.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Easing = {
    inQuad: function(t) {
      return t * t;
    },
    outQuad: function(t) {
      return -(t -= 1) * t + 1;
    },
    inOutQuad: function(t) {
      if ((t /= 0.5) < 1)
        return 0.5 * t * t;
      return -0.5 * (--t * (t - 2) - 1);
    },
    inCubic: function(t) {
      return t * t * t;
    },
    outCubic: function(t) {
      return --t * t * t + 1;
    },
    inOutCubic: function(t) {
      if ((t /= 0.5) < 1)
        return 0.5 * t * t * t;
      return 0.5 * ((t -= 2) * t * t + 2);
    },
    inQuart: function(t) {
      return t * t * t * t;
    },
    outQuart: function(t) {
      return -(--t * t * t * t - 1);
    },
    inOutQuart: function(t) {
      if ((t /= 0.5) < 1)
        return 0.5 * t * t * t * t;
      return -0.5 * ((t -= 2) * t * t * t - 2);
    },
    inQuint: function(t) {
      return t * t * t * t * t;
    },
    outQuint: function(t) {
      return --t * t * t * t * t + 1;
    },
    inOutQuint: function(t) {
      if ((t /= 0.5) < 1)
        return 0.5 * t * t * t * t * t;
      return 0.5 * ((t -= 2) * t * t * t * t + 2);
    },
    inSine: function(t) {
      return -1 * Math.cos(t * (Math.PI / 2)) + 1;
    },
    outSine: function(t) {
      return Math.sin(t * (Math.PI / 2));
    },
    inOutSine: function(t) {
      return -0.5 * (Math.cos(Math.PI * t) - 1);
    },
    inExpo: function(t) {
      return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
    },
    outExpo: function(t) {
      return t === 1 ? 1 : -Math.pow(2, -10 * t) + 1;
    },
    inOutExpo: function(t) {
      if (t === 0)
        return 0;
      if (t === 1)
        return 1;
      if ((t /= 0.5) < 1)
        return 0.5 * Math.pow(2, 10 * (t - 1));
      return 0.5 * (-Math.pow(2, -10 * --t) + 2);
    },
    inCirc: function(t) {
      return -(Math.sqrt(1 - t * t) - 1);
    },
    outCirc: function(t) {
      return Math.sqrt(1 - --t * t);
    },
    inOutCirc: function(t) {
      if ((t /= 0.5) < 1)
        return -0.5 * (Math.sqrt(1 - t * t) - 1);
      return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    },
    inElastic: function(t) {
      var s = 1.70158;
      var p = 0;
      var a = 1;
      if (t === 0)
        return 0;
      if (t === 1)
        return 1;
      if (!p)
        p = 0.3;
      s = p / (2 * Math.PI) * Math.asin(1 / a);
      return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
    },
    outElastic: function(t) {
      var s = 1.70158;
      var p = 0;
      var a = 1;
      if (t === 0)
        return 0;
      if (t === 1)
        return 1;
      if (!p)
        p = 0.3;
      s = p / (2 * Math.PI) * Math.asin(1 / a);
      return a * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    },
    inOutElastic: function(t) {
      var s = 1.70158;
      var p = 0;
      var a = 1;
      if (t === 0)
        return 0;
      if ((t /= 0.5) === 2)
        return 1;
      if (!p)
        p = 0.3 * 1.5;
      s = p / (2 * Math.PI) * Math.asin(1 / a);
      if (t < 1)
        return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
      return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p) * 0.5 + 1;
    },
    inBack: function(t, s) {
      if (s === undefined)
        s = 1.70158;
      return t * t * ((s + 1) * t - s);
    },
    outBack: function(t, s) {
      if (s === undefined)
        s = 1.70158;
      return --t * t * ((s + 1) * t + s) + 1;
    },
    inOutBack: function(t, s) {
      if (s === undefined)
        s = 1.70158;
      if ((t /= 0.5) < 1)
        return 0.5 * (t * t * (((s *= 1.525) + 1) * t - s));
      return 0.5 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2);
    },
    inBounce: function(t) {
      return 1 - Easing.outBounce(1 - t);
    },
    outBounce: function(t) {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    },
    inOutBounce: function(t) {
      if (t < 0.5)
        return Easing.inBounce(t * 2) * 0.5;
      return Easing.outBounce(t * 2 - 1) * 0.5 + 0.5;
    }
  };
  module.exports = Easing;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/EventEmitter.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  function EventEmitter() {
    this.listeners = {};
    this._owner = this;
  }
  EventEmitter.prototype.emit = function emit(type, event) {
    var handlers = this.listeners[type];
    if (handlers) {
      for (var i = 0; i < handlers.length; i++) {
        handlers[i].call(this._owner, event);
      }
    }
    return this;
  };
  EventEmitter.prototype.on = function on(type, handler) {
    if (!(type in this.listeners))
      this.listeners[type] = [];
    var index = this.listeners[type].indexOf(handler);
    if (index < 0)
      this.listeners[type].push(handler);
    return this;
  };
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;
  EventEmitter.prototype.removeListener = function removeListener(type, handler) {
    var listener = this.listeners[type];
    if (listener !== undefined) {
      var index = listener.indexOf(handler);
      if (index >= 0)
        listener.splice(index, 1);
    }
    return this;
  };
  EventEmitter.prototype.bindThis = function bindThis(owner) {
    this._owner = owner;
  };
  module.exports = EventEmitter;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/OptionsManager.js", ["npm:famous@0.3.5/core/EventHandler.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var EventHandler = require("npm:famous@0.3.5/core/EventHandler.js");
  function OptionsManager(value) {
    this._value = value;
    this.eventOutput = null;
  }
  OptionsManager.patch = function patchObject(source, data) {
    var manager = new OptionsManager(source);
    for (var i = 1; i < arguments.length; i++)
      manager.patch(arguments[i]);
    return source;
  };
  function _createEventOutput() {
    this.eventOutput = new EventHandler();
    this.eventOutput.bindThis(this);
    EventHandler.setOutputHandler(this, this.eventOutput);
  }
  OptionsManager.prototype.patch = function patch() {
    var myState = this._value;
    for (var i = 0; i < arguments.length; i++) {
      var data = arguments[i];
      for (var k in data) {
        if (k in myState && (data[k] && data[k].constructor === Object) && (myState[k] && myState[k].constructor === Object)) {
          if (!myState.hasOwnProperty(k))
            myState[k] = Object.create(myState[k]);
          this.key(k).patch(data[k]);
          if (this.eventOutput)
            this.eventOutput.emit('change', {
              id: k,
              value: this.key(k).value()
            });
        } else
          this.set(k, data[k]);
      }
    }
    return this;
  };
  OptionsManager.prototype.setOptions = OptionsManager.prototype.patch;
  OptionsManager.prototype.key = function key(identifier) {
    var result = new OptionsManager(this._value[identifier]);
    if (!(result._value instanceof Object) || result._value instanceof Array)
      result._value = {};
    return result;
  };
  OptionsManager.prototype.get = function get(key) {
    return key ? this._value[key] : this._value;
  };
  OptionsManager.prototype.getOptions = OptionsManager.prototype.get;
  OptionsManager.prototype.set = function set(key, value) {
    var originalValue = this.get(key);
    this._value[key] = value;
    if (this.eventOutput && value !== originalValue)
      this.eventOutput.emit('change', {
        id: key,
        value: value
      });
    return this;
  };
  OptionsManager.prototype.on = function on() {
    _createEventOutput.call(this);
    return this.on.apply(this, arguments);
  };
  OptionsManager.prototype.removeListener = function removeListener() {
    _createEventOutput.call(this);
    return this.removeListener.apply(this, arguments);
  };
  OptionsManager.prototype.pipe = function pipe() {
    _createEventOutput.call(this);
    return this.pipe.apply(this, arguments);
  };
  OptionsManager.prototype.unpipe = function unpipe() {
    _createEventOutput.call(this);
    return this.unpipe.apply(this, arguments);
  };
  module.exports = OptionsManager;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/Entity.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var entities = [];
  function get(id) {
    return entities[id];
  }
  function set(id, entity) {
    entities[id] = entity;
  }
  function register(entity) {
    var id = entities.length;
    set(id, entity);
    return id;
  }
  function unregister(id) {
    set(id, null);
  }
  module.exports = {
    register: register,
    unregister: unregister,
    get: get,
    set: set
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/Transform.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Transform = {};
  Transform.precision = 0.000001;
  Transform.identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  Transform.multiply4x4 = function multiply4x4(a, b) {
    return [a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12] * b[3], a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13] * b[3], a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14] * b[3], a[3] * b[0] + a[7] * b[1] + a[11] * b[2] + a[15] * b[3], a[0] * b[4] + a[4] * b[5] + a[8] * b[6] + a[12] * b[7], a[1] * b[4] + a[5] * b[5] + a[9] * b[6] + a[13] * b[7], a[2] * b[4] + a[6] * b[5] + a[10] * b[6] + a[14] * b[7], a[3] * b[4] + a[7] * b[5] + a[11] * b[6] + a[15] * b[7], a[0] * b[8] + a[4] * b[9] + a[8] * b[10] + a[12] * b[11], a[1] * b[8] + a[5] * b[9] + a[9] * b[10] + a[13] * b[11], a[2] * b[8] + a[6] * b[9] + a[10] * b[10] + a[14] * b[11], a[3] * b[8] + a[7] * b[9] + a[11] * b[10] + a[15] * b[11], a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12] * b[15], a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13] * b[15], a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15], a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15]];
  };
  Transform.multiply = function multiply(a, b) {
    return [a[0] * b[0] + a[4] * b[1] + a[8] * b[2], a[1] * b[0] + a[5] * b[1] + a[9] * b[2], a[2] * b[0] + a[6] * b[1] + a[10] * b[2], 0, a[0] * b[4] + a[4] * b[5] + a[8] * b[6], a[1] * b[4] + a[5] * b[5] + a[9] * b[6], a[2] * b[4] + a[6] * b[5] + a[10] * b[6], 0, a[0] * b[8] + a[4] * b[9] + a[8] * b[10], a[1] * b[8] + a[5] * b[9] + a[9] * b[10], a[2] * b[8] + a[6] * b[9] + a[10] * b[10], 0, a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12], a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13], a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14], 1];
  };
  Transform.thenMove = function thenMove(m, t) {
    if (!t[2])
      t[2] = 0;
    return [m[0], m[1], m[2], 0, m[4], m[5], m[6], 0, m[8], m[9], m[10], 0, m[12] + t[0], m[13] + t[1], m[14] + t[2], 1];
  };
  Transform.moveThen = function moveThen(v, m) {
    if (!v[2])
      v[2] = 0;
    var t0 = v[0] * m[0] + v[1] * m[4] + v[2] * m[8];
    var t1 = v[0] * m[1] + v[1] * m[5] + v[2] * m[9];
    var t2 = v[0] * m[2] + v[1] * m[6] + v[2] * m[10];
    return Transform.thenMove(m, [t0, t1, t2]);
  };
  Transform.translate = function translate(x, y, z) {
    if (z === undefined)
      z = 0;
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
  };
  Transform.thenScale = function thenScale(m, s) {
    return [s[0] * m[0], s[1] * m[1], s[2] * m[2], 0, s[0] * m[4], s[1] * m[5], s[2] * m[6], 0, s[0] * m[8], s[1] * m[9], s[2] * m[10], 0, s[0] * m[12], s[1] * m[13], s[2] * m[14], 1];
  };
  Transform.scale = function scale(x, y, z) {
    if (z === undefined)
      z = 1;
    if (y === undefined)
      y = x;
    return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
  };
  Transform.rotateX = function rotateX(theta) {
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);
    return [1, 0, 0, 0, 0, cosTheta, sinTheta, 0, 0, -sinTheta, cosTheta, 0, 0, 0, 0, 1];
  };
  Transform.rotateY = function rotateY(theta) {
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);
    return [cosTheta, 0, -sinTheta, 0, 0, 1, 0, 0, sinTheta, 0, cosTheta, 0, 0, 0, 0, 1];
  };
  Transform.rotateZ = function rotateZ(theta) {
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);
    return [cosTheta, sinTheta, 0, 0, -sinTheta, cosTheta, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  };
  Transform.rotate = function rotate(phi, theta, psi) {
    var cosPhi = Math.cos(phi);
    var sinPhi = Math.sin(phi);
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);
    var cosPsi = Math.cos(psi);
    var sinPsi = Math.sin(psi);
    var result = [cosTheta * cosPsi, cosPhi * sinPsi + sinPhi * sinTheta * cosPsi, sinPhi * sinPsi - cosPhi * sinTheta * cosPsi, 0, -cosTheta * sinPsi, cosPhi * cosPsi - sinPhi * sinTheta * sinPsi, sinPhi * cosPsi + cosPhi * sinTheta * sinPsi, 0, sinTheta, -sinPhi * cosTheta, cosPhi * cosTheta, 0, 0, 0, 0, 1];
    return result;
  };
  Transform.rotateAxis = function rotateAxis(v, theta) {
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);
    var verTheta = 1 - cosTheta;
    var xxV = v[0] * v[0] * verTheta;
    var xyV = v[0] * v[1] * verTheta;
    var xzV = v[0] * v[2] * verTheta;
    var yyV = v[1] * v[1] * verTheta;
    var yzV = v[1] * v[2] * verTheta;
    var zzV = v[2] * v[2] * verTheta;
    var xs = v[0] * sinTheta;
    var ys = v[1] * sinTheta;
    var zs = v[2] * sinTheta;
    var result = [xxV + cosTheta, xyV + zs, xzV - ys, 0, xyV - zs, yyV + cosTheta, yzV + xs, 0, xzV + ys, yzV - xs, zzV + cosTheta, 0, 0, 0, 0, 1];
    return result;
  };
  Transform.aboutOrigin = function aboutOrigin(v, m) {
    var t0 = v[0] - (v[0] * m[0] + v[1] * m[4] + v[2] * m[8]);
    var t1 = v[1] - (v[0] * m[1] + v[1] * m[5] + v[2] * m[9]);
    var t2 = v[2] - (v[0] * m[2] + v[1] * m[6] + v[2] * m[10]);
    return Transform.thenMove(m, [t0, t1, t2]);
  };
  Transform.skew = function skew(phi, theta, psi) {
    return [1, Math.tan(theta), 0, 0, Math.tan(psi), 1, 0, 0, 0, Math.tan(phi), 1, 0, 0, 0, 0, 1];
  };
  Transform.skewX = function skewX(angle) {
    return [1, 0, 0, 0, Math.tan(angle), 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  };
  Transform.skewY = function skewY(angle) {
    return [1, Math.tan(angle), 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  };
  Transform.perspective = function perspective(focusZ) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / focusZ, 0, 0, 0, 1];
  };
  Transform.getTranslate = function getTranslate(m) {
    return [m[12], m[13], m[14]];
  };
  Transform.inverse = function inverse(m) {
    var c0 = m[5] * m[10] - m[6] * m[9];
    var c1 = m[4] * m[10] - m[6] * m[8];
    var c2 = m[4] * m[9] - m[5] * m[8];
    var c4 = m[1] * m[10] - m[2] * m[9];
    var c5 = m[0] * m[10] - m[2] * m[8];
    var c6 = m[0] * m[9] - m[1] * m[8];
    var c8 = m[1] * m[6] - m[2] * m[5];
    var c9 = m[0] * m[6] - m[2] * m[4];
    var c10 = m[0] * m[5] - m[1] * m[4];
    var detM = m[0] * c0 - m[1] * c1 + m[2] * c2;
    var invD = 1 / detM;
    var result = [invD * c0, -invD * c4, invD * c8, 0, -invD * c1, invD * c5, -invD * c9, 0, invD * c2, -invD * c6, invD * c10, 0, 0, 0, 0, 1];
    result[12] = -m[12] * result[0] - m[13] * result[4] - m[14] * result[8];
    result[13] = -m[12] * result[1] - m[13] * result[5] - m[14] * result[9];
    result[14] = -m[12] * result[2] - m[13] * result[6] - m[14] * result[10];
    return result;
  };
  Transform.transpose = function transpose(m) {
    return [m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14], m[3], m[7], m[11], m[15]];
  };
  function _normSquared(v) {
    return v.length === 2 ? v[0] * v[0] + v[1] * v[1] : v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
  }
  function _norm(v) {
    return Math.sqrt(_normSquared(v));
  }
  function _sign(n) {
    return n < 0 ? -1 : 1;
  }
  Transform.interpret = function interpret(M) {
    var x = [M[0], M[1], M[2]];
    var sgn = _sign(x[0]);
    var xNorm = _norm(x);
    var v = [x[0] + sgn * xNorm, x[1], x[2]];
    var mult = 2 / _normSquared(v);
    if (mult >= Infinity) {
      return {
        translate: Transform.getTranslate(M),
        rotate: [0, 0, 0],
        scale: [0, 0, 0],
        skew: [0, 0, 0]
      };
    }
    var Q1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
    Q1[0] = 1 - mult * v[0] * v[0];
    Q1[5] = 1 - mult * v[1] * v[1];
    Q1[10] = 1 - mult * v[2] * v[2];
    Q1[1] = -mult * v[0] * v[1];
    Q1[2] = -mult * v[0] * v[2];
    Q1[6] = -mult * v[1] * v[2];
    Q1[4] = Q1[1];
    Q1[8] = Q1[2];
    Q1[9] = Q1[6];
    var MQ1 = Transform.multiply(Q1, M);
    var x2 = [MQ1[5], MQ1[6]];
    var sgn2 = _sign(x2[0]);
    var x2Norm = _norm(x2);
    var v2 = [x2[0] + sgn2 * x2Norm, x2[1]];
    var mult2 = 2 / _normSquared(v2);
    var Q2 = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
    Q2[5] = 1 - mult2 * v2[0] * v2[0];
    Q2[10] = 1 - mult2 * v2[1] * v2[1];
    Q2[6] = -mult2 * v2[0] * v2[1];
    Q2[9] = Q2[6];
    var Q = Transform.multiply(Q2, Q1);
    var R = Transform.multiply(Q, M);
    var remover = Transform.scale(R[0] < 0 ? -1 : 1, R[5] < 0 ? -1 : 1, R[10] < 0 ? -1 : 1);
    R = Transform.multiply(R, remover);
    Q = Transform.multiply(remover, Q);
    var result = {};
    result.translate = Transform.getTranslate(M);
    result.rotate = [Math.atan2(-Q[6], Q[10]), Math.asin(Q[2]), Math.atan2(-Q[1], Q[0])];
    if (!result.rotate[0]) {
      result.rotate[0] = 0;
      result.rotate[2] = Math.atan2(Q[4], Q[5]);
    }
    result.scale = [R[0], R[5], R[10]];
    result.skew = [Math.atan2(R[9], result.scale[2]), Math.atan2(R[8], result.scale[2]), Math.atan2(R[4], result.scale[0])];
    if (Math.abs(result.rotate[0]) + Math.abs(result.rotate[2]) > 1.5 * Math.PI) {
      result.rotate[1] = Math.PI - result.rotate[1];
      if (result.rotate[1] > Math.PI)
        result.rotate[1] -= 2 * Math.PI;
      if (result.rotate[1] < -Math.PI)
        result.rotate[1] += 2 * Math.PI;
      if (result.rotate[0] < 0)
        result.rotate[0] += Math.PI;
      else
        result.rotate[0] -= Math.PI;
      if (result.rotate[2] < 0)
        result.rotate[2] += Math.PI;
      else
        result.rotate[2] -= Math.PI;
    }
    return result;
  };
  Transform.average = function average(M1, M2, t) {
    t = t === undefined ? 0.5 : t;
    var specM1 = Transform.interpret(M1);
    var specM2 = Transform.interpret(M2);
    var specAvg = {
      translate: [0, 0, 0],
      rotate: [0, 0, 0],
      scale: [0, 0, 0],
      skew: [0, 0, 0]
    };
    for (var i = 0; i < 3; i++) {
      specAvg.translate[i] = (1 - t) * specM1.translate[i] + t * specM2.translate[i];
      specAvg.rotate[i] = (1 - t) * specM1.rotate[i] + t * specM2.rotate[i];
      specAvg.scale[i] = (1 - t) * specM1.scale[i] + t * specM2.scale[i];
      specAvg.skew[i] = (1 - t) * specM1.skew[i] + t * specM2.skew[i];
    }
    return Transform.build(specAvg);
  };
  Transform.build = function build(spec) {
    var scaleMatrix = Transform.scale(spec.scale[0], spec.scale[1], spec.scale[2]);
    var skewMatrix = Transform.skew(spec.skew[0], spec.skew[1], spec.skew[2]);
    var rotateMatrix = Transform.rotate(spec.rotate[0], spec.rotate[1], spec.rotate[2]);
    return Transform.thenMove(Transform.multiply(Transform.multiply(rotateMatrix, skewMatrix), scaleMatrix), spec.translate);
  };
  Transform.equals = function equals(a, b) {
    return !Transform.notEquals(a, b);
  };
  Transform.notEquals = function notEquals(a, b) {
    if (a === b)
      return false;
    return !(a && b) || a[12] !== b[12] || a[13] !== b[13] || a[14] !== b[14] || a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2] || a[4] !== b[4] || a[5] !== b[5] || a[6] !== b[6] || a[8] !== b[8] || a[9] !== b[9] || a[10] !== b[10];
  };
  Transform.normalizeRotation = function normalizeRotation(rotation) {
    var result = rotation.slice(0);
    if (result[0] === Math.PI * 0.5 || result[0] === -Math.PI * 0.5) {
      result[0] = -result[0];
      result[1] = Math.PI - result[1];
      result[2] -= Math.PI;
    }
    if (result[0] > Math.PI * 0.5) {
      result[0] = result[0] - Math.PI;
      result[1] = Math.PI - result[1];
      result[2] -= Math.PI;
    }
    if (result[0] < -Math.PI * 0.5) {
      result[0] = result[0] + Math.PI;
      result[1] = -Math.PI - result[1];
      result[2] -= Math.PI;
    }
    while (result[1] < -Math.PI)
      result[1] += 2 * Math.PI;
    while (result[1] >= Math.PI)
      result[1] -= 2 * Math.PI;
    while (result[2] < -Math.PI)
      result[2] += 2 * Math.PI;
    while (result[2] >= Math.PI)
      result[2] -= 2 * Math.PI;
    return result;
  };
  Transform.inFront = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0.001, 1];
  Transform.behind = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -0.001, 1];
  module.exports = Transform;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/utilities/Utility.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Utility = {};
  Utility.Direction = {
    X: 0,
    Y: 1,
    Z: 2
  };
  Utility.after = function after(count, callback) {
    var counter = count;
    return function() {
      counter--;
      if (counter === 0)
        callback.apply(this, arguments);
    };
  };
  Utility.loadURL = function loadURL(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function onreadystatechange() {
      if (this.readyState === 4) {
        if (callback)
          callback(this.responseText);
      }
    };
    xhr.open('GET', url);
    xhr.send();
  };
  Utility.createDocumentFragmentFromHTML = function createDocumentFragmentFromHTML(html) {
    var element = document.createElement('div');
    element.innerHTML = html;
    var result = document.createDocumentFragment();
    while (element.hasChildNodes())
      result.appendChild(element.firstChild);
    return result;
  };
  Utility.clone = function clone(b) {
    var a;
    if (typeof b === 'object') {
      a = b instanceof Array ? [] : {};
      for (var key in b) {
        if (typeof b[key] === 'object' && b[key] !== null) {
          if (b[key] instanceof Array) {
            a[key] = new Array(b[key].length);
            for (var i = 0; i < b[key].length; i++) {
              a[key][i] = Utility.clone(b[key][i]);
            }
          } else {
            a[key] = Utility.clone(b[key]);
          }
        } else {
          a[key] = b[key];
        }
      }
    } else {
      a = b;
    }
    return a;
  };
  module.exports = Utility;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/ViewSequence.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  function ViewSequence(options) {
    if (!options)
      options = [];
    if (options instanceof Array)
      options = {array: options};
    this._ = null;
    this.index = options.index || 0;
    if (options.array)
      this._ = new this.constructor.Backing(options.array);
    else if (options._)
      this._ = options._;
    if (this.index === this._.firstIndex)
      this._.firstNode = this;
    if (this.index === this._.firstIndex + this._.array.length - 1)
      this._.lastNode = this;
    if (options.loop !== undefined)
      this._.loop = options.loop;
    if (options.trackSize !== undefined)
      this._.trackSize = options.trackSize;
    this._previousNode = null;
    this._nextNode = null;
  }
  ViewSequence.Backing = function Backing(array) {
    this.array = array;
    this.firstIndex = 0;
    this.loop = false;
    this.firstNode = null;
    this.lastNode = null;
    this.cumulativeSizes = [[0, 0]];
    this.sizeDirty = true;
    this.trackSize = false;
  };
  ViewSequence.Backing.prototype.getValue = function getValue(i) {
    var _i = i - this.firstIndex;
    if (_i < 0 || _i >= this.array.length)
      return null;
    return this.array[_i];
  };
  ViewSequence.Backing.prototype.setValue = function setValue(i, value) {
    this.array[i - this.firstIndex] = value;
  };
  ViewSequence.Backing.prototype.getSize = function getSize(index) {
    return this.cumulativeSizes[index];
  };
  ViewSequence.Backing.prototype.calculateSize = function calculateSize(index) {
    index = index || this.array.length;
    var size = [0, 0];
    for (var i = 0; i < index; i++) {
      var nodeSize = this.array[i].getSize();
      if (!nodeSize)
        return undefined;
      if (size[0] !== undefined) {
        if (nodeSize[0] === undefined)
          size[0] = undefined;
        else
          size[0] += nodeSize[0];
      }
      if (size[1] !== undefined) {
        if (nodeSize[1] === undefined)
          size[1] = undefined;
        else
          size[1] += nodeSize[1];
      }
      this.cumulativeSizes[i + 1] = size.slice();
    }
    this.sizeDirty = false;
    return size;
  };
  ViewSequence.Backing.prototype.reindex = function reindex(start, removeCount, insertCount) {
    if (!this.array[0])
      return;
    var i = 0;
    var index = this.firstIndex;
    var indexShiftAmount = insertCount - removeCount;
    var node = this.firstNode;
    while (index < start - 1) {
      node = node.getNext();
      index++;
    }
    var spliceStartNode = node;
    for (i = 0; i < removeCount; i++) {
      node = node.getNext();
      if (node)
        node._previousNode = spliceStartNode;
    }
    var spliceResumeNode = node ? node.getNext() : null;
    spliceStartNode._nextNode = null;
    node = spliceStartNode;
    for (i = 0; i < insertCount; i++)
      node = node.getNext();
    index += insertCount;
    if (node !== spliceResumeNode) {
      node._nextNode = spliceResumeNode;
      if (spliceResumeNode)
        spliceResumeNode._previousNode = node;
    }
    if (spliceResumeNode) {
      node = spliceResumeNode;
      index++;
      while (node && index < this.array.length + this.firstIndex) {
        if (node._nextNode)
          node.index += indexShiftAmount;
        else
          node.index = index;
        node = node.getNext();
        index++;
      }
    }
    if (this.trackSize)
      this.sizeDirty = true;
  };
  ViewSequence.prototype.getPrevious = function getPrevious() {
    var len = this._.array.length;
    if (!len) {
      this._previousNode = null;
    } else if (this.index === this._.firstIndex) {
      if (this._.loop) {
        this._previousNode = this._.lastNode || new this.constructor({
          _: this._,
          index: this._.firstIndex + len - 1
        });
        this._previousNode._nextNode = this;
      } else {
        this._previousNode = null;
      }
    } else if (!this._previousNode) {
      this._previousNode = new this.constructor({
        _: this._,
        index: this.index - 1
      });
      this._previousNode._nextNode = this;
    }
    return this._previousNode;
  };
  ViewSequence.prototype.getNext = function getNext() {
    var len = this._.array.length;
    if (!len) {
      this._nextNode = null;
    } else if (this.index === this._.firstIndex + len - 1) {
      if (this._.loop) {
        this._nextNode = this._.firstNode || new this.constructor({
          _: this._,
          index: this._.firstIndex
        });
        this._nextNode._previousNode = this;
      } else {
        this._nextNode = null;
      }
    } else if (!this._nextNode) {
      this._nextNode = new this.constructor({
        _: this._,
        index: this.index + 1
      });
      this._nextNode._previousNode = this;
    }
    return this._nextNode;
  };
  ViewSequence.prototype.indexOf = function indexOf(item) {
    return this._.array.indexOf(item);
  };
  ViewSequence.prototype.getIndex = function getIndex() {
    return this.index;
  };
  ViewSequence.prototype.toString = function toString() {
    return '' + this.index;
  };
  ViewSequence.prototype.unshift = function unshift(value) {
    this._.array.unshift.apply(this._.array, arguments);
    this._.firstIndex -= arguments.length;
    if (this._.trackSize)
      this._.sizeDirty = true;
  };
  ViewSequence.prototype.push = function push(value) {
    this._.array.push.apply(this._.array, arguments);
    if (this._.trackSize)
      this._.sizeDirty = true;
  };
  ViewSequence.prototype.splice = function splice(index, howMany) {
    var values = Array.prototype.slice.call(arguments, 2);
    this._.array.splice.apply(this._.array, [index - this._.firstIndex, howMany].concat(values));
    this._.reindex(index, howMany, values.length);
  };
  ViewSequence.prototype.swap = function swap(other) {
    var otherValue = other.get();
    var myValue = this.get();
    this._.setValue(this.index, otherValue);
    this._.setValue(other.index, myValue);
    var myPrevious = this._previousNode;
    var myNext = this._nextNode;
    var myIndex = this.index;
    var otherPrevious = other._previousNode;
    var otherNext = other._nextNode;
    var otherIndex = other.index;
    this.index = otherIndex;
    this._previousNode = otherPrevious === this ? other : otherPrevious;
    if (this._previousNode)
      this._previousNode._nextNode = this;
    this._nextNode = otherNext === this ? other : otherNext;
    if (this._nextNode)
      this._nextNode._previousNode = this;
    other.index = myIndex;
    other._previousNode = myPrevious === other ? this : myPrevious;
    if (other._previousNode)
      other._previousNode._nextNode = other;
    other._nextNode = myNext === other ? this : myNext;
    if (other._nextNode)
      other._nextNode._previousNode = other;
    if (this.index === this._.firstIndex)
      this._.firstNode = this;
    else if (this.index === this._.firstIndex + this._.array.length - 1)
      this._.lastNode = this;
    if (other.index === this._.firstIndex)
      this._.firstNode = other;
    else if (other.index === this._.firstIndex + this._.array.length - 1)
      this._.lastNode = other;
    if (this._.trackSize)
      this._.sizeDirty = true;
  };
  ViewSequence.prototype.get = function get() {
    return this._.getValue(this.index);
  };
  ViewSequence.prototype.getSize = function getSize() {
    var target = this.get();
    return target ? target.getSize() : null;
  };
  ViewSequence.prototype.render = function render() {
    if (this._.trackSize && this._.sizeDirty)
      this._.calculateSize();
    var target = this.get();
    return target ? target.render.apply(target, arguments) : null;
  };
  module.exports = ViewSequence;
  global.define = __define;
  return module.exports;
});

(function() {
var _removeDefine = System.get("@@amd-helpers").createDefine();
define("github:ijzerenhein/famous-flex@0.3.4/src/LayoutUtility.js", ["require", "exports", "module", "npm:famous@0.3.5/utilities/Utility.js"], function(require, exports, module) {
  var Utility = require("npm:famous@0.3.5/utilities/Utility.js");
  function LayoutUtility() {}
  LayoutUtility.registeredHelpers = {};
  var Capabilities = {
    SEQUENCE: 1,
    DIRECTION_X: 2,
    DIRECTION_Y: 4,
    SCROLLING: 8
  };
  LayoutUtility.Capabilities = Capabilities;
  LayoutUtility.normalizeMargins = function(margins) {
    if (!margins) {
      return [0, 0, 0, 0];
    } else if (!Array.isArray(margins)) {
      return [margins, margins, margins, margins];
    } else if (margins.length === 0) {
      return [0, 0, 0, 0];
    } else if (margins.length === 1) {
      return [margins[0], margins[0], margins[0], margins[0]];
    } else if (margins.length === 2) {
      return [margins[0], margins[1], margins[0], margins[1]];
    } else {
      return margins;
    }
  };
  LayoutUtility.cloneSpec = function(spec) {
    var clone = {};
    if (spec.opacity !== undefined) {
      clone.opacity = spec.opacity;
    }
    if (spec.size !== undefined) {
      clone.size = spec.size.slice(0);
    }
    if (spec.transform !== undefined) {
      clone.transform = spec.transform.slice(0);
    }
    if (spec.origin !== undefined) {
      clone.origin = spec.origin.slice(0);
    }
    if (spec.align !== undefined) {
      clone.align = spec.align.slice(0);
    }
    return clone;
  };
  function _isEqualArray(a, b) {
    if (a === b) {
      return true;
    }
    if ((a === undefined) || (b === undefined)) {
      return false;
    }
    var i = a.length;
    if (i !== b.length) {
      return false;
    }
    while (i--) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  LayoutUtility.isEqualSpec = function(spec1, spec2) {
    if (spec1.opacity !== spec2.opacity) {
      return false;
    }
    if (!_isEqualArray(spec1.size, spec2.size)) {
      return false;
    }
    if (!_isEqualArray(spec1.transform, spec2.transform)) {
      return false;
    }
    if (!_isEqualArray(spec1.origin, spec2.origin)) {
      return false;
    }
    if (!_isEqualArray(spec1.align, spec2.align)) {
      return false;
    }
    return true;
  };
  LayoutUtility.getSpecDiffText = function(spec1, spec2) {
    var result = 'spec diff:';
    if (spec1.opacity !== spec2.opacity) {
      result += '\nopacity: ' + spec1.opacity + ' != ' + spec2.opacity;
    }
    if (!_isEqualArray(spec1.size, spec2.size)) {
      result += '\nsize: ' + JSON.stringify(spec1.size) + ' != ' + JSON.stringify(spec2.size);
    }
    if (!_isEqualArray(spec1.transform, spec2.transform)) {
      result += '\ntransform: ' + JSON.stringify(spec1.transform) + ' != ' + JSON.stringify(spec2.transform);
    }
    if (!_isEqualArray(spec1.origin, spec2.origin)) {
      result += '\norigin: ' + JSON.stringify(spec1.origin) + ' != ' + JSON.stringify(spec2.origin);
    }
    if (!_isEqualArray(spec1.align, spec2.align)) {
      result += '\nalign: ' + JSON.stringify(spec1.align) + ' != ' + JSON.stringify(spec2.align);
    }
    return result;
  };
  LayoutUtility.error = function(message) {
    console.log('ERROR: ' + message);
    throw message;
  };
  LayoutUtility.warning = function(message) {
    console.log('WARNING: ' + message);
  };
  LayoutUtility.log = function(args) {
    var message = '';
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if ((arg instanceof Object) || (arg instanceof Array)) {
        message += JSON.stringify(arg);
      } else {
        message += arg;
      }
    }
    console.log(message);
  };
  LayoutUtility.combineOptions = function(options1, options2, forceClone) {
    if (options1 && !options2 && !forceClone) {
      return options1;
    } else if (!options1 && options2 && !forceClone) {
      return options2;
    }
    var options = Utility.clone(options1 || {});
    if (options2) {
      for (var key in options2) {
        options[key] = options2[key];
      }
    }
    return options;
  };
  LayoutUtility.registerHelper = function(name, Helper) {
    if (!Helper.prototype.parse) {
      LayoutUtility.error('The layout-helper for name "' + name + '" is required to support the "parse" method');
    }
    if (this.registeredHelpers[name] !== undefined) {
      LayoutUtility.warning('A layout-helper with the name "' + name + '" is already registered and will be overwritten');
    }
    this.registeredHelpers[name] = Helper;
  };
  LayoutUtility.unregisterHelper = function(name) {
    delete this.registeredHelpers[name];
  };
  LayoutUtility.getRegisteredHelper = function(name) {
    return this.registeredHelpers[name];
  };
  module.exports = LayoutUtility;
});

_removeDefine();
})();
(function() {
var _removeDefine = System.get("@@amd-helpers").createDefine();
define("github:ijzerenhein/famous-flex@0.3.4/src/LayoutContext.js", ["require", "exports", "module"], function(require, exports, module) {
  function LayoutContext(methods) {
    for (var n in methods) {
      this[n] = methods[n];
    }
  }
  LayoutContext.prototype.size = undefined;
  LayoutContext.prototype.direction = undefined;
  LayoutContext.prototype.scrollOffset = undefined;
  LayoutContext.prototype.scrollStart = undefined;
  LayoutContext.prototype.scrollEnd = undefined;
  LayoutContext.prototype.next = function() {};
  LayoutContext.prototype.prev = function() {};
  LayoutContext.prototype.get = function(node) {};
  LayoutContext.prototype.set = function(node, set) {};
  LayoutContext.prototype.resolveSize = function(node) {};
  module.exports = LayoutContext;
});

_removeDefine();
})();
System.registerDynamic("npm:famous@0.3.5/core/ElementOutput.js", ["npm:famous@0.3.5/core/Entity.js", "npm:famous@0.3.5/core/EventHandler.js", "npm:famous@0.3.5/core/Transform.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Entity = require("npm:famous@0.3.5/core/Entity.js");
  var EventHandler = require("npm:famous@0.3.5/core/EventHandler.js");
  var Transform = require("npm:famous@0.3.5/core/Transform.js");
  var usePrefix = !('transform' in document.documentElement.style);
  var devicePixelRatio = window.devicePixelRatio || 1;
  function ElementOutput(element) {
    this._matrix = null;
    this._opacity = 1;
    this._origin = null;
    this._size = null;
    this._eventOutput = new EventHandler();
    this._eventOutput.bindThis(this);
    this.eventForwarder = function eventForwarder(event) {
      this._eventOutput.emit(event.type, event);
    }.bind(this);
    this.id = Entity.register(this);
    this._element = null;
    this._sizeDirty = false;
    this._originDirty = false;
    this._transformDirty = false;
    this._invisible = false;
    if (element)
      this.attach(element);
  }
  ElementOutput.prototype.on = function on(type, fn) {
    if (this._element)
      this._element.addEventListener(type, this.eventForwarder);
    this._eventOutput.on(type, fn);
  };
  ElementOutput.prototype.removeListener = function removeListener(type, fn) {
    this._eventOutput.removeListener(type, fn);
  };
  ElementOutput.prototype.emit = function emit(type, event) {
    if (event && !event.origin)
      event.origin = this;
    var handled = this._eventOutput.emit(type, event);
    if (handled && event && event.stopPropagation)
      event.stopPropagation();
    return handled;
  };
  ElementOutput.prototype.pipe = function pipe(target) {
    return this._eventOutput.pipe(target);
  };
  ElementOutput.prototype.unpipe = function unpipe(target) {
    return this._eventOutput.unpipe(target);
  };
  ElementOutput.prototype.render = function render() {
    return this.id;
  };
  function _addEventListeners(target) {
    for (var i in this._eventOutput.listeners) {
      target.addEventListener(i, this.eventForwarder);
    }
  }
  function _removeEventListeners(target) {
    for (var i in this._eventOutput.listeners) {
      target.removeEventListener(i, this.eventForwarder);
    }
  }
  function _formatCSSTransform(m) {
    m[12] = Math.round(m[12] * devicePixelRatio) / devicePixelRatio;
    m[13] = Math.round(m[13] * devicePixelRatio) / devicePixelRatio;
    var result = 'matrix3d(';
    for (var i = 0; i < 15; i++) {
      result += m[i] < 0.000001 && m[i] > -0.000001 ? '0,' : m[i] + ',';
    }
    result += m[15] + ')';
    return result;
  }
  var _setMatrix;
  if (usePrefix) {
    _setMatrix = function(element, matrix) {
      element.style.webkitTransform = _formatCSSTransform(matrix);
    };
  } else {
    _setMatrix = function(element, matrix) {
      element.style.transform = _formatCSSTransform(matrix);
    };
  }
  function _formatCSSOrigin(origin) {
    return 100 * origin[0] + '% ' + 100 * origin[1] + '%';
  }
  var _setOrigin = usePrefix ? function(element, origin) {
    element.style.webkitTransformOrigin = _formatCSSOrigin(origin);
  } : function(element, origin) {
    element.style.transformOrigin = _formatCSSOrigin(origin);
  };
  var _setInvisible = usePrefix ? function(element) {
    element.style.webkitTransform = 'scale3d(0.0001,0.0001,0.0001)';
    element.style.opacity = 0;
  } : function(element) {
    element.style.transform = 'scale3d(0.0001,0.0001,0.0001)';
    element.style.opacity = 0;
  };
  function _xyNotEquals(a, b) {
    return a && b ? a[0] !== b[0] || a[1] !== b[1] : a !== b;
  }
  ElementOutput.prototype.commit = function commit(context) {
    var target = this._element;
    if (!target)
      return;
    var matrix = context.transform;
    var opacity = context.opacity;
    var origin = context.origin;
    var size = context.size;
    if (!matrix && this._matrix) {
      this._matrix = null;
      this._opacity = 0;
      _setInvisible(target);
      return;
    }
    if (_xyNotEquals(this._origin, origin))
      this._originDirty = true;
    if (Transform.notEquals(this._matrix, matrix))
      this._transformDirty = true;
    if (this._invisible) {
      this._invisible = false;
      this._element.style.display = '';
    }
    if (this._opacity !== opacity) {
      this._opacity = opacity;
      target.style.opacity = opacity >= 1 ? '0.999999' : opacity;
    }
    if (this._transformDirty || this._originDirty || this._sizeDirty) {
      if (this._sizeDirty)
        this._sizeDirty = false;
      if (this._originDirty) {
        if (origin) {
          if (!this._origin)
            this._origin = [0, 0];
          this._origin[0] = origin[0];
          this._origin[1] = origin[1];
        } else
          this._origin = null;
        _setOrigin(target, this._origin);
        this._originDirty = false;
      }
      if (!matrix)
        matrix = Transform.identity;
      this._matrix = matrix;
      var aaMatrix = this._size ? Transform.thenMove(matrix, [-this._size[0] * origin[0], -this._size[1] * origin[1], 0]) : matrix;
      _setMatrix(target, aaMatrix);
      this._transformDirty = false;
    }
  };
  ElementOutput.prototype.cleanup = function cleanup() {
    if (this._element) {
      this._invisible = true;
      this._element.style.display = 'none';
    }
  };
  ElementOutput.prototype.attach = function attach(target) {
    this._element = target;
    _addEventListeners.call(this, target);
  };
  ElementOutput.prototype.detach = function detach() {
    var target = this._element;
    if (target) {
      _removeEventListeners.call(this, target);
      if (this._invisible) {
        this._invisible = false;
        this._element.style.display = '';
      }
    }
    this._element = null;
    return target;
  };
  module.exports = ElementOutput;
  global.define = __define;
  return module.exports;
});

(function() {
var _removeDefine = System.get("@@amd-helpers").createDefine();
define("github:ijzerenhein/famous-flex@0.3.4/src/LayoutNode.js", ["require", "exports", "module", "npm:famous@0.3.5/core/Transform.js", "github:ijzerenhein/famous-flex@0.3.4/src/LayoutUtility.js"], function(require, exports, module) {
  var Transform = require("npm:famous@0.3.5/core/Transform.js");
  var LayoutUtility = require("github:ijzerenhein/famous-flex@0.3.4/src/LayoutUtility.js");
  function LayoutNode(renderNode, spec) {
    this.renderNode = renderNode;
    this._spec = spec ? LayoutUtility.cloneSpec(spec) : {};
    this._spec.renderNode = renderNode;
    this._specModified = true;
    this._invalidated = false;
    this._removing = false;
  }
  LayoutNode.prototype.setRenderNode = function(renderNode) {
    this.renderNode = renderNode;
    this._spec.renderNode = renderNode;
  };
  LayoutNode.prototype.setOptions = function(options) {};
  LayoutNode.prototype.destroy = function() {
    this.renderNode = undefined;
    this._spec.renderNode = undefined;
    this._viewSequence = undefined;
  };
  LayoutNode.prototype.reset = function() {
    this._invalidated = false;
    this.trueSizeRequested = false;
  };
  LayoutNode.prototype.setSpec = function(spec) {
    this._specModified = true;
    if (spec.align) {
      if (!spec.align) {
        this._spec.align = [0, 0];
      }
      this._spec.align[0] = spec.align[0];
      this._spec.align[1] = spec.align[1];
    } else {
      this._spec.align = undefined;
    }
    if (spec.origin) {
      if (!spec.origin) {
        this._spec.origin = [0, 0];
      }
      this._spec.origin[0] = spec.origin[0];
      this._spec.origin[1] = spec.origin[1];
    } else {
      this._spec.origin = undefined;
    }
    if (spec.size) {
      if (!spec.size) {
        this._spec.size = [0, 0];
      }
      this._spec.size[0] = spec.size[0];
      this._spec.size[1] = spec.size[1];
    } else {
      this._spec.size = undefined;
    }
    if (spec.transform) {
      if (!spec.transform) {
        this._spec.transform = spec.transform.slice(0);
      } else {
        for (var i = 0; i < 16; i++) {
          this._spec.transform[i] = spec.transform[i];
        }
      }
    } else {
      this._spec.transform = undefined;
    }
    this._spec.opacity = spec.opacity;
  };
  LayoutNode.prototype.set = function(set, size) {
    this._invalidated = true;
    this._specModified = true;
    this._removing = false;
    var spec = this._spec;
    spec.opacity = set.opacity;
    if (set.size) {
      if (!spec.size) {
        spec.size = [0, 0];
      }
      spec.size[0] = set.size[0];
      spec.size[1] = set.size[1];
    } else {
      spec.size = undefined;
    }
    if (set.origin) {
      if (!spec.origin) {
        spec.origin = [0, 0];
      }
      spec.origin[0] = set.origin[0];
      spec.origin[1] = set.origin[1];
    } else {
      spec.origin = undefined;
    }
    if (set.align) {
      if (!spec.align) {
        spec.align = [0, 0];
      }
      spec.align[0] = set.align[0];
      spec.align[1] = set.align[1];
    } else {
      spec.align = undefined;
    }
    if (set.skew || set.rotate || set.scale) {
      this._spec.transform = Transform.build({
        translate: set.translate || [0, 0, 0],
        skew: set.skew || [0, 0, 0],
        scale: set.scale || [1, 1, 1],
        rotate: set.rotate || [0, 0, 0]
      });
    } else if (set.translate) {
      this._spec.transform = Transform.translate(set.translate[0], set.translate[1], set.translate[2]);
    } else {
      this._spec.transform = undefined;
    }
    this.scrollLength = set.scrollLength;
  };
  LayoutNode.prototype.getSpec = function() {
    this._specModified = false;
    this._spec.removed = !this._invalidated;
    return this._spec;
  };
  LayoutNode.prototype.remove = function(removeSpec) {
    this._removing = true;
  };
  module.exports = LayoutNode;
});

_removeDefine();
})();
System.registerDynamic("npm:famous@0.3.5/math/Vector.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  function Vector(x, y, z) {
    if (arguments.length === 1 && x !== undefined)
      this.set(x);
    else {
      this.x = x || 0;
      this.y = y || 0;
      this.z = z || 0;
    }
    return this;
  }
  var _register = new Vector(0, 0, 0);
  Vector.prototype.add = function add(v) {
    return _setXYZ.call(_register, this.x + v.x, this.y + v.y, this.z + v.z);
  };
  Vector.prototype.sub = function sub(v) {
    return _setXYZ.call(_register, this.x - v.x, this.y - v.y, this.z - v.z);
  };
  Vector.prototype.mult = function mult(r) {
    return _setXYZ.call(_register, r * this.x, r * this.y, r * this.z);
  };
  Vector.prototype.div = function div(r) {
    return this.mult(1 / r);
  };
  Vector.prototype.cross = function cross(v) {
    var x = this.x;
    var y = this.y;
    var z = this.z;
    var vx = v.x;
    var vy = v.y;
    var vz = v.z;
    return _setXYZ.call(_register, z * vy - y * vz, x * vz - z * vx, y * vx - x * vy);
  };
  Vector.prototype.equals = function equals(v) {
    return v.x === this.x && v.y === this.y && v.z === this.z;
  };
  Vector.prototype.rotateX = function rotateX(theta) {
    var x = this.x;
    var y = this.y;
    var z = this.z;
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);
    return _setXYZ.call(_register, x, y * cosTheta - z * sinTheta, y * sinTheta + z * cosTheta);
  };
  Vector.prototype.rotateY = function rotateY(theta) {
    var x = this.x;
    var y = this.y;
    var z = this.z;
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);
    return _setXYZ.call(_register, z * sinTheta + x * cosTheta, y, z * cosTheta - x * sinTheta);
  };
  Vector.prototype.rotateZ = function rotateZ(theta) {
    var x = this.x;
    var y = this.y;
    var z = this.z;
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);
    return _setXYZ.call(_register, x * cosTheta - y * sinTheta, x * sinTheta + y * cosTheta, z);
  };
  Vector.prototype.dot = function dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  };
  Vector.prototype.normSquared = function normSquared() {
    return this.dot(this);
  };
  Vector.prototype.norm = function norm() {
    return Math.sqrt(this.normSquared());
  };
  Vector.prototype.normalize = function normalize(length) {
    if (arguments.length === 0)
      length = 1;
    var norm = this.norm();
    if (norm > 1e-7)
      return _setFromVector.call(_register, this.mult(length / norm));
    else
      return _setXYZ.call(_register, length, 0, 0);
  };
  Vector.prototype.clone = function clone() {
    return new Vector(this);
  };
  Vector.prototype.isZero = function isZero() {
    return !(this.x || this.y || this.z);
  };
  function _setXYZ(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  function _setFromArray(v) {
    return _setXYZ.call(this, v[0], v[1], v[2] || 0);
  }
  function _setFromVector(v) {
    return _setXYZ.call(this, v.x, v.y, v.z);
  }
  function _setFromNumber(x) {
    return _setXYZ.call(this, x, 0, 0);
  }
  Vector.prototype.set = function set(v) {
    if (v instanceof Array)
      return _setFromArray.call(this, v);
    if (typeof v === 'number')
      return _setFromNumber.call(this, v);
    return _setFromVector.call(this, v);
  };
  Vector.prototype.setXYZ = function(x, y, z) {
    return _setXYZ.apply(this, arguments);
  };
  Vector.prototype.set1D = function(x) {
    return _setFromNumber.call(this, x);
  };
  Vector.prototype.put = function put(v) {
    if (this === _register)
      _setFromVector.call(v, _register);
    else
      _setFromVector.call(v, this);
  };
  Vector.prototype.clear = function clear() {
    return _setXYZ.call(this, 0, 0, 0);
  };
  Vector.prototype.cap = function cap(cap) {
    if (cap === Infinity)
      return _setFromVector.call(_register, this);
    var norm = this.norm();
    if (norm > cap)
      return _setFromVector.call(_register, this.mult(cap / norm));
    else
      return _setFromVector.call(_register, this);
  };
  Vector.prototype.project = function project(n) {
    return n.mult(this.dot(n));
  };
  Vector.prototype.reflectAcross = function reflectAcross(n) {
    n.normalize().put(n);
    return _setFromVector(_register, this.sub(this.project(n).mult(2)));
  };
  Vector.prototype.get = function get() {
    return [this.x, this.y, this.z];
  };
  Vector.prototype.get1D = function() {
    return this.x;
  };
  module.exports = Vector;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/physics/integrators/SymplecticEuler.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var SymplecticEuler = {};
  SymplecticEuler.integrateVelocity = function integrateVelocity(body, dt) {
    var v = body.velocity;
    var w = body.inverseMass;
    var f = body.force;
    if (f.isZero())
      return;
    v.add(f.mult(dt * w)).put(v);
    f.clear();
  };
  SymplecticEuler.integratePosition = function integratePosition(body, dt) {
    var p = body.position;
    var v = body.velocity;
    p.add(v.mult(dt)).put(p);
  };
  SymplecticEuler.integrateAngularMomentum = function integrateAngularMomentum(body, dt) {
    var L = body.angularMomentum;
    var t = body.torque;
    if (t.isZero())
      return;
    L.add(t.mult(dt)).put(L);
    t.clear();
  };
  SymplecticEuler.integrateOrientation = function integrateOrientation(body, dt) {
    var q = body.orientation;
    var w = body.angularVelocity;
    if (w.isZero())
      return;
    q.add(q.multiply(w).scalarMultiply(0.5 * dt)).put(q);
  };
  module.exports = SymplecticEuler;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/physics/forces/Force.js", ["npm:famous@0.3.5/math/Vector.js", "npm:famous@0.3.5/core/EventHandler.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Vector = require("npm:famous@0.3.5/math/Vector.js");
  var EventHandler = require("npm:famous@0.3.5/core/EventHandler.js");
  function Force(force) {
    this.force = new Vector(force);
    this._eventOutput = new EventHandler();
    EventHandler.setOutputHandler(this, this._eventOutput);
  }
  Force.prototype.setOptions = function setOptions(options) {
    this._eventOutput.emit('change', options);
  };
  Force.prototype.applyForce = function applyForce(targets) {
    var length = targets.length;
    while (length--) {
      targets[length].applyForce(this.force);
    }
  };
  Force.prototype.getEnergy = function getEnergy() {
    return 0;
  };
  module.exports = Force;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/physics/PhysicsEngine.js", ["npm:famous@0.3.5/core/EventHandler.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var EventHandler = require("npm:famous@0.3.5/core/EventHandler.js");
  function PhysicsEngine(options) {
    this.options = Object.create(PhysicsEngine.DEFAULT_OPTIONS);
    if (options)
      this.setOptions(options);
    this._particles = [];
    this._bodies = [];
    this._agentData = {};
    this._forces = [];
    this._constraints = [];
    this._buffer = 0;
    this._prevTime = now();
    this._isSleeping = false;
    this._eventHandler = null;
    this._currAgentId = 0;
    this._hasBodies = false;
    this._eventHandler = null;
  }
  var TIMESTEP = 17;
  var MIN_TIME_STEP = 1000 / 120;
  var MAX_TIME_STEP = 17;
  var now = Date.now;
  var _events = {
    start: 'start',
    update: 'update',
    end: 'end'
  };
  PhysicsEngine.DEFAULT_OPTIONS = {
    constraintSteps: 1,
    sleepTolerance: 1e-7,
    velocityCap: undefined,
    angularVelocityCap: undefined
  };
  PhysicsEngine.prototype.setOptions = function setOptions(opts) {
    for (var key in opts)
      if (this.options[key])
        this.options[key] = opts[key];
  };
  PhysicsEngine.prototype.addBody = function addBody(body) {
    body._engine = this;
    if (body.isBody) {
      this._bodies.push(body);
      this._hasBodies = true;
    } else
      this._particles.push(body);
    body.on('start', this.wake.bind(this));
    return body;
  };
  PhysicsEngine.prototype.removeBody = function removeBody(body) {
    var array = body.isBody ? this._bodies : this._particles;
    var index = array.indexOf(body);
    if (index > -1) {
      for (var agentKey in this._agentData) {
        if (this._agentData.hasOwnProperty(agentKey)) {
          this.detachFrom(this._agentData[agentKey].id, body);
        }
      }
      array.splice(index, 1);
    }
    if (this.getBodies().length === 0)
      this._hasBodies = false;
  };
  function _mapAgentArray(agent) {
    if (agent.applyForce)
      return this._forces;
    if (agent.applyConstraint)
      return this._constraints;
  }
  function _attachOne(agent, targets, source) {
    if (targets === undefined)
      targets = this.getParticlesAndBodies();
    if (!(targets instanceof Array))
      targets = [targets];
    agent.on('change', this.wake.bind(this));
    this._agentData[this._currAgentId] = {
      agent: agent,
      id: this._currAgentId,
      targets: targets,
      source: source
    };
    _mapAgentArray.call(this, agent).push(this._currAgentId);
    return this._currAgentId++;
  }
  PhysicsEngine.prototype.attach = function attach(agents, targets, source) {
    this.wake();
    if (agents instanceof Array) {
      var agentIDs = [];
      for (var i = 0; i < agents.length; i++)
        agentIDs[i] = _attachOne.call(this, agents[i], targets, source);
      return agentIDs;
    } else
      return _attachOne.call(this, agents, targets, source);
  };
  PhysicsEngine.prototype.attachTo = function attachTo(agentID, target) {
    _getAgentData.call(this, agentID).targets.push(target);
  };
  PhysicsEngine.prototype.detach = function detach(id) {
    var agent = this.getAgent(id);
    var agentArray = _mapAgentArray.call(this, agent);
    var index = agentArray.indexOf(id);
    agentArray.splice(index, 1);
    delete this._agentData[id];
  };
  PhysicsEngine.prototype.detachFrom = function detachFrom(id, target) {
    var boundAgent = _getAgentData.call(this, id);
    if (boundAgent.source === target)
      this.detach(id);
    else {
      var targets = boundAgent.targets;
      var index = targets.indexOf(target);
      if (index > -1)
        targets.splice(index, 1);
    }
  };
  PhysicsEngine.prototype.detachAll = function detachAll() {
    this._agentData = {};
    this._forces = [];
    this._constraints = [];
    this._currAgentId = 0;
  };
  function _getAgentData(id) {
    return this._agentData[id];
  }
  PhysicsEngine.prototype.getAgent = function getAgent(id) {
    return _getAgentData.call(this, id).agent;
  };
  PhysicsEngine.prototype.getParticles = function getParticles() {
    return this._particles;
  };
  PhysicsEngine.prototype.getBodies = function getBodies() {
    return this._bodies;
  };
  PhysicsEngine.prototype.getParticlesAndBodies = function getParticlesAndBodies() {
    return this.getParticles().concat(this.getBodies());
  };
  PhysicsEngine.prototype.forEachParticle = function forEachParticle(fn, dt) {
    var particles = this.getParticles();
    for (var index = 0,
        len = particles.length; index < len; index++)
      fn.call(this, particles[index], dt);
  };
  PhysicsEngine.prototype.forEachBody = function forEachBody(fn, dt) {
    if (!this._hasBodies)
      return;
    var bodies = this.getBodies();
    for (var index = 0,
        len = bodies.length; index < len; index++)
      fn.call(this, bodies[index], dt);
  };
  PhysicsEngine.prototype.forEach = function forEach(fn, dt) {
    this.forEachParticle(fn, dt);
    this.forEachBody(fn, dt);
  };
  function _updateForce(index) {
    var boundAgent = _getAgentData.call(this, this._forces[index]);
    boundAgent.agent.applyForce(boundAgent.targets, boundAgent.source);
  }
  function _updateForces() {
    for (var index = this._forces.length - 1; index > -1; index--)
      _updateForce.call(this, index);
  }
  function _updateConstraint(index, dt) {
    var boundAgent = this._agentData[this._constraints[index]];
    return boundAgent.agent.applyConstraint(boundAgent.targets, boundAgent.source, dt);
  }
  function _updateConstraints(dt) {
    var iteration = 0;
    while (iteration < this.options.constraintSteps) {
      for (var index = this._constraints.length - 1; index > -1; index--)
        _updateConstraint.call(this, index, dt);
      iteration++;
    }
  }
  function _updateVelocities(body, dt) {
    body.integrateVelocity(dt);
    if (this.options.velocityCap)
      body.velocity.cap(this.options.velocityCap).put(body.velocity);
  }
  function _updateAngularVelocities(body, dt) {
    body.integrateAngularMomentum(dt);
    body.updateAngularVelocity();
    if (this.options.angularVelocityCap)
      body.angularVelocity.cap(this.options.angularVelocityCap).put(body.angularVelocity);
  }
  function _updateOrientations(body, dt) {
    body.integrateOrientation(dt);
  }
  function _updatePositions(body, dt) {
    body.integratePosition(dt);
    body.emit(_events.update, body);
  }
  function _integrate(dt) {
    _updateForces.call(this, dt);
    this.forEach(_updateVelocities, dt);
    this.forEachBody(_updateAngularVelocities, dt);
    _updateConstraints.call(this, dt);
    this.forEachBody(_updateOrientations, dt);
    this.forEach(_updatePositions, dt);
  }
  function _getParticlesEnergy() {
    var energy = 0;
    var particleEnergy = 0;
    this.forEach(function(particle) {
      particleEnergy = particle.getEnergy();
      energy += particleEnergy;
    });
    return energy;
  }
  function _getAgentsEnergy() {
    var energy = 0;
    for (var id in this._agentData)
      energy += this.getAgentEnergy(id);
    return energy;
  }
  PhysicsEngine.prototype.getAgentEnergy = function(agentId) {
    var agentData = _getAgentData.call(this, agentId);
    return agentData.agent.getEnergy(agentData.targets, agentData.source);
  };
  PhysicsEngine.prototype.getEnergy = function getEnergy() {
    return _getParticlesEnergy.call(this) + _getAgentsEnergy.call(this);
  };
  PhysicsEngine.prototype.step = function step() {
    if (this.isSleeping())
      return;
    var currTime = now();
    var dtFrame = currTime - this._prevTime;
    this._prevTime = currTime;
    if (dtFrame < MIN_TIME_STEP)
      return;
    if (dtFrame > MAX_TIME_STEP)
      dtFrame = MAX_TIME_STEP;
    _integrate.call(this, TIMESTEP);
    this.emit(_events.update, this);
    if (this.getEnergy() < this.options.sleepTolerance)
      this.sleep();
  };
  PhysicsEngine.prototype.isSleeping = function isSleeping() {
    return this._isSleeping;
  };
  PhysicsEngine.prototype.isActive = function isSleeping() {
    return !this._isSleeping;
  };
  PhysicsEngine.prototype.sleep = function sleep() {
    if (this._isSleeping)
      return;
    this.forEach(function(body) {
      body.sleep();
    });
    this.emit(_events.end, this);
    this._isSleeping = true;
  };
  PhysicsEngine.prototype.wake = function wake() {
    if (!this._isSleeping)
      return;
    this._prevTime = now();
    this.emit(_events.start, this);
    this._isSleeping = false;
  };
  PhysicsEngine.prototype.emit = function emit(type, data) {
    if (this._eventHandler === null)
      return;
    this._eventHandler.emit(type, data);
  };
  PhysicsEngine.prototype.on = function on(event, fn) {
    if (this._eventHandler === null)
      this._eventHandler = new EventHandler();
    this._eventHandler.on(event, fn);
  };
  module.exports = PhysicsEngine;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/transitions/MultipleTransition.js", ["npm:famous@0.3.5/utilities/Utility.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Utility = require("npm:famous@0.3.5/utilities/Utility.js");
  function MultipleTransition(method) {
    this.method = method;
    this._instances = [];
    this.state = [];
  }
  MultipleTransition.SUPPORTS_MULTIPLE = true;
  MultipleTransition.prototype.get = function get() {
    for (var i = 0; i < this._instances.length; i++) {
      this.state[i] = this._instances[i].get();
    }
    return this.state;
  };
  MultipleTransition.prototype.set = function set(endState, transition, callback) {
    var _allCallback = Utility.after(endState.length, callback);
    for (var i = 0; i < endState.length; i++) {
      if (!this._instances[i])
        this._instances[i] = new this.method();
      this._instances[i].set(endState[i], transition, _allCallback);
    }
  };
  MultipleTransition.prototype.reset = function reset(startState) {
    for (var i = 0; i < startState.length; i++) {
      if (!this._instances[i])
        this._instances[i] = new this.method();
      this._instances[i].reset(startState[i]);
    }
  };
  module.exports = MultipleTransition;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/transitions/TweenTransition.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  function TweenTransition(options) {
    this.options = Object.create(TweenTransition.DEFAULT_OPTIONS);
    if (options)
      this.setOptions(options);
    this._startTime = 0;
    this._startValue = 0;
    this._updateTime = 0;
    this._endValue = 0;
    this._curve = undefined;
    this._duration = 0;
    this._active = false;
    this._callback = undefined;
    this.state = 0;
    this.velocity = undefined;
  }
  TweenTransition.Curves = {
    linear: function(t) {
      return t;
    },
    easeIn: function(t) {
      return t * t;
    },
    easeOut: function(t) {
      return t * (2 - t);
    },
    easeInOut: function(t) {
      if (t <= 0.5)
        return 2 * t * t;
      else
        return -2 * t * t + 4 * t - 1;
    },
    easeOutBounce: function(t) {
      return t * (3 - 2 * t);
    },
    spring: function(t) {
      return (1 - t) * Math.sin(6 * Math.PI * t) + t;
    }
  };
  TweenTransition.SUPPORTS_MULTIPLE = true;
  TweenTransition.DEFAULT_OPTIONS = {
    curve: TweenTransition.Curves.linear,
    duration: 500,
    speed: 0
  };
  var registeredCurves = {};
  TweenTransition.registerCurve = function registerCurve(curveName, curve) {
    if (!registeredCurves[curveName]) {
      registeredCurves[curveName] = curve;
      return true;
    } else {
      return false;
    }
  };
  TweenTransition.unregisterCurve = function unregisterCurve(curveName) {
    if (registeredCurves[curveName]) {
      delete registeredCurves[curveName];
      return true;
    } else {
      return false;
    }
  };
  TweenTransition.getCurve = function getCurve(curveName) {
    var curve = registeredCurves[curveName];
    if (curve !== undefined)
      return curve;
    else
      throw new Error('curve not registered');
  };
  TweenTransition.getCurves = function getCurves() {
    return registeredCurves;
  };
  function _interpolate(a, b, t) {
    return (1 - t) * a + t * b;
  }
  function _clone(obj) {
    if (obj instanceof Object) {
      if (obj instanceof Array)
        return obj.slice(0);
      else
        return Object.create(obj);
    } else
      return obj;
  }
  function _normalize(transition, defaultTransition) {
    var result = {curve: defaultTransition.curve};
    if (defaultTransition.duration)
      result.duration = defaultTransition.duration;
    if (defaultTransition.speed)
      result.speed = defaultTransition.speed;
    if (transition instanceof Object) {
      if (transition.duration !== undefined)
        result.duration = transition.duration;
      if (transition.curve)
        result.curve = transition.curve;
      if (transition.speed)
        result.speed = transition.speed;
    }
    if (typeof result.curve === 'string')
      result.curve = TweenTransition.getCurve(result.curve);
    return result;
  }
  TweenTransition.prototype.setOptions = function setOptions(options) {
    if (options.curve !== undefined)
      this.options.curve = options.curve;
    if (options.duration !== undefined)
      this.options.duration = options.duration;
    if (options.speed !== undefined)
      this.options.speed = options.speed;
  };
  TweenTransition.prototype.set = function set(endValue, transition, callback) {
    if (!transition) {
      this.reset(endValue);
      if (callback)
        callback();
      return;
    }
    this._startValue = _clone(this.get());
    transition = _normalize(transition, this.options);
    if (transition.speed) {
      var startValue = this._startValue;
      if (startValue instanceof Object) {
        var variance = 0;
        for (var i in startValue)
          variance += (endValue[i] - startValue[i]) * (endValue[i] - startValue[i]);
        transition.duration = Math.sqrt(variance) / transition.speed;
      } else {
        transition.duration = Math.abs(endValue - startValue) / transition.speed;
      }
    }
    this._startTime = Date.now();
    this._endValue = _clone(endValue);
    this._startVelocity = _clone(transition.velocity);
    this._duration = transition.duration;
    this._curve = transition.curve;
    this._active = true;
    this._callback = callback;
  };
  TweenTransition.prototype.reset = function reset(startValue, startVelocity) {
    if (this._callback) {
      var callback = this._callback;
      this._callback = undefined;
      callback();
    }
    this.state = _clone(startValue);
    this.velocity = _clone(startVelocity);
    this._startTime = 0;
    this._duration = 0;
    this._updateTime = 0;
    this._startValue = this.state;
    this._startVelocity = this.velocity;
    this._endValue = this.state;
    this._active = false;
  };
  TweenTransition.prototype.getVelocity = function getVelocity() {
    return this.velocity;
  };
  TweenTransition.prototype.get = function get(timestamp) {
    this.update(timestamp);
    return this.state;
  };
  function _calculateVelocity(current, start, curve, duration, t) {
    var velocity;
    var eps = 1e-7;
    var speed = (curve(t) - curve(t - eps)) / eps;
    if (current instanceof Array) {
      velocity = [];
      for (var i = 0; i < current.length; i++) {
        if (typeof current[i] === 'number')
          velocity[i] = speed * (current[i] - start[i]) / duration;
        else
          velocity[i] = 0;
      }
    } else
      velocity = speed * (current - start) / duration;
    return velocity;
  }
  function _calculateState(start, end, t) {
    var state;
    if (start instanceof Array) {
      state = [];
      for (var i = 0; i < start.length; i++) {
        if (typeof start[i] === 'number')
          state[i] = _interpolate(start[i], end[i], t);
        else
          state[i] = start[i];
      }
    } else
      state = _interpolate(start, end, t);
    return state;
  }
  TweenTransition.prototype.update = function update(timestamp) {
    if (!this._active) {
      if (this._callback) {
        var callback = this._callback;
        this._callback = undefined;
        callback();
      }
      return;
    }
    if (!timestamp)
      timestamp = Date.now();
    if (this._updateTime >= timestamp)
      return;
    this._updateTime = timestamp;
    var timeSinceStart = timestamp - this._startTime;
    if (timeSinceStart >= this._duration) {
      this.state = this._endValue;
      this.velocity = _calculateVelocity(this.state, this._startValue, this._curve, this._duration, 1);
      this._active = false;
    } else if (timeSinceStart < 0) {
      this.state = this._startValue;
      this.velocity = this._startVelocity;
    } else {
      var t = timeSinceStart / this._duration;
      this.state = _calculateState(this._startValue, this._endValue, this._curve(t));
      this.velocity = _calculateVelocity(this.state, this._startValue, this._curve, this._duration, t);
    }
  };
  TweenTransition.prototype.isActive = function isActive() {
    return this._active;
  };
  TweenTransition.prototype.halt = function halt() {
    this.reset(this.get());
  };
  TweenTransition.registerCurve('linear', TweenTransition.Curves.linear);
  TweenTransition.registerCurve('easeIn', TweenTransition.Curves.easeIn);
  TweenTransition.registerCurve('easeOut', TweenTransition.Curves.easeOut);
  TweenTransition.registerCurve('easeInOut', TweenTransition.Curves.easeInOut);
  TweenTransition.registerCurve('easeOutBounce', TweenTransition.Curves.easeOutBounce);
  TweenTransition.registerCurve('spring', TweenTransition.Curves.spring);
  TweenTransition.customCurve = function customCurve(v1, v2) {
    v1 = v1 || 0;
    v2 = v2 || 0;
    return function(t) {
      return v1 * t + (-2 * v1 - v2 + 3) * t * t + (v1 + v2 - 2) * t * t * t;
    };
  };
  module.exports = TweenTransition;
  global.define = __define;
  return module.exports;
});

(function() {
var _removeDefine = System.get("@@amd-helpers").createDefine();
define("github:ijzerenhein/famous-flex@0.3.4/src/helpers/LayoutDockHelper.js", ["require", "exports", "module", "github:ijzerenhein/famous-flex@0.3.4/src/LayoutUtility.js"], function(require, exports, module) {
  var LayoutUtility = require("github:ijzerenhein/famous-flex@0.3.4/src/LayoutUtility.js");
  function LayoutDockHelper(context, options) {
    var size = context.size;
    this._size = size;
    this._context = context;
    this._options = options;
    this._data = {z: (options && options.translateZ) ? options.translateZ : 0};
    if (options && options.margins) {
      var margins = LayoutUtility.normalizeMargins(options.margins);
      this._data.left = margins[3];
      this._data.top = margins[0];
      this._data.right = size[0] - margins[1];
      this._data.bottom = size[1] - margins[2];
    } else {
      this._data.left = 0;
      this._data.top = 0;
      this._data.right = size[0];
      this._data.bottom = size[1];
    }
  }
  LayoutDockHelper.prototype.parse = function(data) {
    for (var i = 0; i < data.length; i++) {
      var rule = data[i];
      var value = (rule.length >= 3) ? rule[2] : undefined;
      if (rule[0] === 'top') {
        this.top(rule[1], value, (rule.length >= 4) ? rule[3] : undefined);
      } else if (rule[0] === 'left') {
        this.left(rule[1], value, (rule.length >= 4) ? rule[3] : undefined);
      } else if (rule[0] === 'right') {
        this.right(rule[1], value, (rule.length >= 4) ? rule[3] : undefined);
      } else if (rule[0] === 'bottom') {
        this.bottom(rule[1], value, (rule.length >= 4) ? rule[3] : undefined);
      } else if (rule[0] === 'fill') {
        this.fill(rule[1], (rule.length >= 3) ? rule[2] : undefined);
      } else if (rule[0] === 'margins') {
        this.margins(rule[1]);
      }
    }
  };
  LayoutDockHelper.prototype.top = function(node, height, z) {
    if (height instanceof Array) {
      height = height[1];
    }
    if (height === undefined) {
      var size = this._context.resolveSize(node, [this._data.right - this._data.left, this._data.bottom - this._data.top]);
      height = size[1];
    }
    this._context.set(node, {
      size: [this._data.right - this._data.left, height],
      origin: [0, 0],
      align: [0, 0],
      translate: [this._data.left, this._data.top, (z === undefined) ? this._data.z : z]
    });
    this._data.top += height;
    return this;
  };
  LayoutDockHelper.prototype.left = function(node, width, z) {
    if (width instanceof Array) {
      width = width[0];
    }
    if (width === undefined) {
      var size = this._context.resolveSize(node, [this._data.right - this._data.left, this._data.bottom - this._data.top]);
      width = size[0];
    }
    this._context.set(node, {
      size: [width, this._data.bottom - this._data.top],
      origin: [0, 0],
      align: [0, 0],
      translate: [this._data.left, this._data.top, (z === undefined) ? this._data.z : z]
    });
    this._data.left += width;
    return this;
  };
  LayoutDockHelper.prototype.bottom = function(node, height, z) {
    if (height instanceof Array) {
      height = height[1];
    }
    if (height === undefined) {
      var size = this._context.resolveSize(node, [this._data.right - this._data.left, this._data.bottom - this._data.top]);
      height = size[1];
    }
    this._context.set(node, {
      size: [this._data.right - this._data.left, height],
      origin: [0, 1],
      align: [0, 1],
      translate: [this._data.left, -(this._size[1] - this._data.bottom), (z === undefined) ? this._data.z : z]
    });
    this._data.bottom -= height;
    return this;
  };
  LayoutDockHelper.prototype.right = function(node, width, z) {
    if (width instanceof Array) {
      width = width[0];
    }
    if (node) {
      if (width === undefined) {
        var size = this._context.resolveSize(node, [this._data.right - this._data.left, this._data.bottom - this._data.top]);
        width = size[0];
      }
      this._context.set(node, {
        size: [width, this._data.bottom - this._data.top],
        origin: [1, 0],
        align: [1, 0],
        translate: [-(this._size[0] - this._data.right), this._data.top, (z === undefined) ? this._data.z : z]
      });
    }
    if (width) {
      this._data.right -= width;
    }
    return this;
  };
  LayoutDockHelper.prototype.fill = function(node, z) {
    this._context.set(node, {
      size: [this._data.right - this._data.left, this._data.bottom - this._data.top],
      translate: [this._data.left, this._data.top, (z === undefined) ? this._data.z : z]
    });
    return this;
  };
  LayoutDockHelper.prototype.margins = function(margins) {
    margins = LayoutUtility.normalizeMargins(margins);
    this._data.left += margins[3];
    this._data.top += margins[0];
    this._data.right -= margins[1];
    this._data.bottom -= margins[2];
    return this;
  };
  LayoutDockHelper.prototype.get = function() {
    return this._data;
  };
  LayoutUtility.registerHelper('dock', LayoutDockHelper);
  module.exports = LayoutDockHelper;
});

_removeDefine();
})();
System.registerDynamic("npm:famous@0.3.5/transitions/TransitionableTransform.js", ["npm:famous@0.3.5/transitions/Transitionable.js", "npm:famous@0.3.5/core/Transform.js", "npm:famous@0.3.5/utilities/Utility.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Transitionable = require("npm:famous@0.3.5/transitions/Transitionable.js");
  var Transform = require("npm:famous@0.3.5/core/Transform.js");
  var Utility = require("npm:famous@0.3.5/utilities/Utility.js");
  function TransitionableTransform(transform) {
    this._final = Transform.identity.slice();
    this._finalTranslate = [0, 0, 0];
    this._finalRotate = [0, 0, 0];
    this._finalSkew = [0, 0, 0];
    this._finalScale = [1, 1, 1];
    this.translate = new Transitionable(this._finalTranslate);
    this.rotate = new Transitionable(this._finalRotate);
    this.skew = new Transitionable(this._finalSkew);
    this.scale = new Transitionable(this._finalScale);
    if (transform)
      this.set(transform);
  }
  function _build() {
    return Transform.build({
      translate: this.translate.get(),
      rotate: this.rotate.get(),
      skew: this.skew.get(),
      scale: this.scale.get()
    });
  }
  function _buildFinal() {
    return Transform.build({
      translate: this._finalTranslate,
      rotate: this._finalRotate,
      skew: this._finalSkew,
      scale: this._finalScale
    });
  }
  TransitionableTransform.prototype.setTranslate = function setTranslate(translate, transition, callback) {
    this._finalTranslate = translate;
    this._final = _buildFinal.call(this);
    this.translate.set(translate, transition, callback);
    return this;
  };
  TransitionableTransform.prototype.setScale = function setScale(scale, transition, callback) {
    this._finalScale = scale;
    this._final = _buildFinal.call(this);
    this.scale.set(scale, transition, callback);
    return this;
  };
  TransitionableTransform.prototype.setRotate = function setRotate(eulerAngles, transition, callback) {
    this._finalRotate = eulerAngles;
    this._final = _buildFinal.call(this);
    this.rotate.set(eulerAngles, transition, callback);
    return this;
  };
  TransitionableTransform.prototype.setSkew = function setSkew(skewAngles, transition, callback) {
    this._finalSkew = skewAngles;
    this._final = _buildFinal.call(this);
    this.skew.set(skewAngles, transition, callback);
    return this;
  };
  TransitionableTransform.prototype.set = function set(transform, transition, callback) {
    var components = Transform.interpret(transform);
    this._finalTranslate = components.translate;
    this._finalRotate = components.rotate;
    this._finalSkew = components.skew;
    this._finalScale = components.scale;
    this._final = transform;
    var _callback = callback ? Utility.after(4, callback) : null;
    this.translate.set(components.translate, transition, _callback);
    this.rotate.set(components.rotate, transition, _callback);
    this.skew.set(components.skew, transition, _callback);
    this.scale.set(components.scale, transition, _callback);
    return this;
  };
  TransitionableTransform.prototype.setDefaultTransition = function setDefaultTransition(transition) {
    this.translate.setDefault(transition);
    this.rotate.setDefault(transition);
    this.skew.setDefault(transition);
    this.scale.setDefault(transition);
  };
  TransitionableTransform.prototype.get = function get() {
    if (this.isActive()) {
      return _build.call(this);
    } else
      return this._final;
  };
  TransitionableTransform.prototype.getFinal = function getFinal() {
    return this._final;
  };
  TransitionableTransform.prototype.isActive = function isActive() {
    return this.translate.isActive() || this.rotate.isActive() || this.scale.isActive() || this.skew.isActive();
  };
  TransitionableTransform.prototype.halt = function halt() {
    this.translate.halt();
    this.rotate.halt();
    this.skew.halt();
    this.scale.halt();
    this._final = this.get();
    this._finalTranslate = this.translate.get();
    this._finalRotate = this.rotate.get();
    this._finalSkew = this.skew.get();
    this._finalScale = this.scale.get();
    return this;
  };
  module.exports = TransitionableTransform;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/modifiers/StateModifier.js", ["npm:famous@0.3.5/core/Modifier.js", "npm:famous@0.3.5/core/Transform.js", "npm:famous@0.3.5/transitions/Transitionable.js", "npm:famous@0.3.5/transitions/TransitionableTransform.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Modifier = require("npm:famous@0.3.5/core/Modifier.js");
  var Transform = require("npm:famous@0.3.5/core/Transform.js");
  var Transitionable = require("npm:famous@0.3.5/transitions/Transitionable.js");
  var TransitionableTransform = require("npm:famous@0.3.5/transitions/TransitionableTransform.js");
  function StateModifier(options) {
    this._transformState = new TransitionableTransform(Transform.identity);
    this._opacityState = new Transitionable(1);
    this._originState = new Transitionable([0, 0]);
    this._alignState = new Transitionable([0, 0]);
    this._sizeState = new Transitionable([0, 0]);
    this._proportionsState = new Transitionable([0, 0]);
    this._modifier = new Modifier({
      transform: this._transformState,
      opacity: this._opacityState,
      origin: null,
      align: null,
      size: null,
      proportions: null
    });
    this._hasOrigin = false;
    this._hasAlign = false;
    this._hasSize = false;
    this._hasProportions = false;
    if (options) {
      if (options.transform)
        this.setTransform(options.transform);
      if (options.opacity !== undefined)
        this.setOpacity(options.opacity);
      if (options.origin)
        this.setOrigin(options.origin);
      if (options.align)
        this.setAlign(options.align);
      if (options.size)
        this.setSize(options.size);
      if (options.proportions)
        this.setProportions(options.proportions);
    }
  }
  StateModifier.prototype.setTransform = function setTransform(transform, transition, callback) {
    this._transformState.set(transform, transition, callback);
    return this;
  };
  StateModifier.prototype.setOpacity = function setOpacity(opacity, transition, callback) {
    this._opacityState.set(opacity, transition, callback);
    return this;
  };
  StateModifier.prototype.setOrigin = function setOrigin(origin, transition, callback) {
    if (origin === null) {
      if (this._hasOrigin) {
        this._modifier.originFrom(null);
        this._hasOrigin = false;
      }
      return this;
    } else if (!this._hasOrigin) {
      this._hasOrigin = true;
      this._modifier.originFrom(this._originState);
    }
    this._originState.set(origin, transition, callback);
    return this;
  };
  StateModifier.prototype.setAlign = function setOrigin(align, transition, callback) {
    if (align === null) {
      if (this._hasAlign) {
        this._modifier.alignFrom(null);
        this._hasAlign = false;
      }
      return this;
    } else if (!this._hasAlign) {
      this._hasAlign = true;
      this._modifier.alignFrom(this._alignState);
    }
    this._alignState.set(align, transition, callback);
    return this;
  };
  StateModifier.prototype.setSize = function setSize(size, transition, callback) {
    if (size === null) {
      if (this._hasSize) {
        this._modifier.sizeFrom(null);
        this._hasSize = false;
      }
      return this;
    } else if (!this._hasSize) {
      this._hasSize = true;
      this._modifier.sizeFrom(this._sizeState);
    }
    this._sizeState.set(size, transition, callback);
    return this;
  };
  StateModifier.prototype.setProportions = function setSize(proportions, transition, callback) {
    if (proportions === null) {
      if (this._hasProportions) {
        this._modifier.proportionsFrom(null);
        this._hasProportions = false;
      }
      return this;
    } else if (!this._hasProportions) {
      this._hasProportions = true;
      this._modifier.proportionsFrom(this._proportionsState);
    }
    this._proportionsState.set(proportions, transition, callback);
    return this;
  };
  StateModifier.prototype.halt = function halt() {
    this._transformState.halt();
    this._opacityState.halt();
    this._originState.halt();
    this._alignState.halt();
    this._sizeState.halt();
    this._proportionsState.halt();
  };
  StateModifier.prototype.getTransform = function getTransform() {
    return this._transformState.get();
  };
  StateModifier.prototype.getFinalTransform = function getFinalTransform() {
    return this._transformState.getFinal();
  };
  StateModifier.prototype.getOpacity = function getOpacity() {
    return this._opacityState.get();
  };
  StateModifier.prototype.getOrigin = function getOrigin() {
    return this._hasOrigin ? this._originState.get() : null;
  };
  StateModifier.prototype.getAlign = function getAlign() {
    return this._hasAlign ? this._alignState.get() : null;
  };
  StateModifier.prototype.getSize = function getSize() {
    return this._hasSize ? this._sizeState.get() : null;
  };
  StateModifier.prototype.getProportions = function getProportions() {
    return this._hasProportions ? this._proportionsState.get() : null;
  };
  StateModifier.prototype.modify = function modify(target) {
    return this._modifier.modify(target);
  };
  module.exports = StateModifier;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/ElementAllocator.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  function ElementAllocator(container) {
    if (!container)
      container = document.createDocumentFragment();
    this.container = container;
    this.detachedNodes = {};
    this.nodeCount = 0;
  }
  ElementAllocator.prototype.migrate = function migrate(container) {
    var oldContainer = this.container;
    if (container === oldContainer)
      return;
    if (oldContainer instanceof DocumentFragment) {
      container.appendChild(oldContainer);
    } else {
      while (oldContainer.hasChildNodes()) {
        container.appendChild(oldContainer.firstChild);
      }
    }
    this.container = container;
  };
  ElementAllocator.prototype.allocate = function allocate(type) {
    type = type.toLowerCase();
    if (!(type in this.detachedNodes))
      this.detachedNodes[type] = [];
    var nodeStore = this.detachedNodes[type];
    var result;
    if (nodeStore.length > 0) {
      result = nodeStore.pop();
    } else {
      result = document.createElement(type);
      this.container.appendChild(result);
    }
    this.nodeCount++;
    return result;
  };
  ElementAllocator.prototype.deallocate = function deallocate(element) {
    var nodeType = element.nodeName.toLowerCase();
    var nodeStore = this.detachedNodes[nodeType];
    nodeStore.push(element);
    this.nodeCount--;
  };
  ElementAllocator.prototype.getNodeCount = function getNodeCount() {
    return this.nodeCount;
  };
  module.exports = ElementAllocator;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("github:firebase/firebase-bower@2.2.7/firebase.js", [], false, function(__require, __exports, __module) {
  var _retrieveGlobal = System.get("@@global-helpers").prepareGlobal(__module.id, null, null);
  (function() {
    (function() {
      var h,
          aa = this;
      function n(a) {
        return void 0 !== a;
      }
      function ba() {}
      function ca(a) {
        a.ub = function() {
          return a.tf ? a.tf : a.tf = new a;
        };
      }
      function da(a) {
        var b = typeof a;
        if ("object" == b)
          if (a) {
            if (a instanceof Array)
              return "array";
            if (a instanceof Object)
              return b;
            var c = Object.prototype.toString.call(a);
            if ("[object Window]" == c)
              return "object";
            if ("[object Array]" == c || "number" == typeof a.length && "undefined" != typeof a.splice && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("splice"))
              return "array";
            if ("[object Function]" == c || "undefined" != typeof a.call && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("call"))
              return "function";
          } else
            return "null";
        else if ("function" == b && "undefined" == typeof a.call)
          return "object";
        return b;
      }
      function ea(a) {
        return "array" == da(a);
      }
      function fa(a) {
        var b = da(a);
        return "array" == b || "object" == b && "number" == typeof a.length;
      }
      function p(a) {
        return "string" == typeof a;
      }
      function ga(a) {
        return "number" == typeof a;
      }
      function ha(a) {
        return "function" == da(a);
      }
      function ia(a) {
        var b = typeof a;
        return "object" == b && null != a || "function" == b;
      }
      function ja(a, b, c) {
        return a.call.apply(a.bind, arguments);
      }
      function ka(a, b, c) {
        if (!a)
          throw Error();
        if (2 < arguments.length) {
          var d = Array.prototype.slice.call(arguments, 2);
          return function() {
            var c = Array.prototype.slice.call(arguments);
            Array.prototype.unshift.apply(c, d);
            return a.apply(b, c);
          };
        }
        return function() {
          return a.apply(b, arguments);
        };
      }
      function q(a, b, c) {
        q = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? ja : ka;
        return q.apply(null, arguments);
      }
      var la = Date.now || function() {
        return +new Date;
      };
      function ma(a, b) {
        function c() {}
        c.prototype = b.prototype;
        a.Zg = b.prototype;
        a.prototype = new c;
        a.prototype.constructor = a;
        a.Vg = function(a, c, f) {
          for (var g = Array(arguments.length - 2),
              k = 2; k < arguments.length; k++)
            g[k - 2] = arguments[k];
          return b.prototype[c].apply(a, g);
        };
      }
      ;
      function r(a, b) {
        for (var c in a)
          b.call(void 0, a[c], c, a);
      }
      function na(a, b) {
        var c = {},
            d;
        for (d in a)
          c[d] = b.call(void 0, a[d], d, a);
        return c;
      }
      function oa(a, b) {
        for (var c in a)
          if (!b.call(void 0, a[c], c, a))
            return !1;
        return !0;
      }
      function pa(a) {
        var b = 0,
            c;
        for (c in a)
          b++;
        return b;
      }
      function qa(a) {
        for (var b in a)
          return b;
      }
      function ra(a) {
        var b = [],
            c = 0,
            d;
        for (d in a)
          b[c++] = a[d];
        return b;
      }
      function sa(a) {
        var b = [],
            c = 0,
            d;
        for (d in a)
          b[c++] = d;
        return b;
      }
      function ta(a, b) {
        for (var c in a)
          if (a[c] == b)
            return !0;
        return !1;
      }
      function ua(a, b, c) {
        for (var d in a)
          if (b.call(c, a[d], d, a))
            return d;
      }
      function va(a, b) {
        var c = ua(a, b, void 0);
        return c && a[c];
      }
      function wa(a) {
        for (var b in a)
          return !1;
        return !0;
      }
      function xa(a) {
        var b = {},
            c;
        for (c in a)
          b[c] = a[c];
        return b;
      }
      var ya = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
      function za(a, b) {
        for (var c,
            d,
            e = 1; e < arguments.length; e++) {
          d = arguments[e];
          for (c in d)
            a[c] = d[c];
          for (var f = 0; f < ya.length; f++)
            c = ya[f], Object.prototype.hasOwnProperty.call(d, c) && (a[c] = d[c]);
        }
      }
      ;
      function Aa(a) {
        a = String(a);
        if (/^\s*$/.test(a) ? 0 : /^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, "")))
          try {
            return eval("(" + a + ")");
          } catch (b) {}
        throw Error("Invalid JSON string: " + a);
      }
      function Ba() {
        this.Pd = void 0;
      }
      function Ca(a, b, c) {
        switch (typeof b) {
          case "string":
            Da(b, c);
            break;
          case "number":
            c.push(isFinite(b) && !isNaN(b) ? b : "null");
            break;
          case "boolean":
            c.push(b);
            break;
          case "undefined":
            c.push("null");
            break;
          case "object":
            if (null == b) {
              c.push("null");
              break;
            }
            if (ea(b)) {
              var d = b.length;
              c.push("[");
              for (var e = "",
                  f = 0; f < d; f++)
                c.push(e), e = b[f], Ca(a, a.Pd ? a.Pd.call(b, String(f), e) : e, c), e = ",";
              c.push("]");
              break;
            }
            c.push("{");
            d = "";
            for (f in b)
              Object.prototype.hasOwnProperty.call(b, f) && (e = b[f], "function" != typeof e && (c.push(d), Da(f, c), c.push(":"), Ca(a, a.Pd ? a.Pd.call(b, f, e) : e, c), d = ","));
            c.push("}");
            break;
          case "function":
            break;
          default:
            throw Error("Unknown type: " + typeof b);
        }
      }
      var Ea = {
        '"': '\\"',
        "\\": "\\\\",
        "/": "\\/",
        "\b": "\\b",
        "\f": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "\t": "\\t",
        "\x0B": "\\u000b"
      },
          Fa = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
      function Da(a, b) {
        b.push('"', a.replace(Fa, function(a) {
          if (a in Ea)
            return Ea[a];
          var b = a.charCodeAt(0),
              e = "\\u";
          16 > b ? e += "000" : 256 > b ? e += "00" : 4096 > b && (e += "0");
          return Ea[a] = e + b.toString(16);
        }), '"');
      }
      ;
      function Ga() {
        return Math.floor(2147483648 * Math.random()).toString(36) + Math.abs(Math.floor(2147483648 * Math.random()) ^ la()).toString(36);
      }
      ;
      var Ha;
      a: {
        var Ia = aa.navigator;
        if (Ia) {
          var Ja = Ia.userAgent;
          if (Ja) {
            Ha = Ja;
            break a;
          }
        }
        Ha = "";
      }
      ;
      function Ka() {
        this.Wa = -1;
      }
      ;
      function La() {
        this.Wa = -1;
        this.Wa = 64;
        this.R = [];
        this.le = [];
        this.Tf = [];
        this.Id = [];
        this.Id[0] = 128;
        for (var a = 1; a < this.Wa; ++a)
          this.Id[a] = 0;
        this.be = this.$b = 0;
        this.reset();
      }
      ma(La, Ka);
      La.prototype.reset = function() {
        this.R[0] = 1732584193;
        this.R[1] = 4023233417;
        this.R[2] = 2562383102;
        this.R[3] = 271733878;
        this.R[4] = 3285377520;
        this.be = this.$b = 0;
      };
      function Ma(a, b, c) {
        c || (c = 0);
        var d = a.Tf;
        if (p(b))
          for (var e = 0; 16 > e; e++)
            d[e] = b.charCodeAt(c) << 24 | b.charCodeAt(c + 1) << 16 | b.charCodeAt(c + 2) << 8 | b.charCodeAt(c + 3), c += 4;
        else
          for (e = 0; 16 > e; e++)
            d[e] = b[c] << 24 | b[c + 1] << 16 | b[c + 2] << 8 | b[c + 3], c += 4;
        for (e = 16; 80 > e; e++) {
          var f = d[e - 3] ^ d[e - 8] ^ d[e - 14] ^ d[e - 16];
          d[e] = (f << 1 | f >>> 31) & 4294967295;
        }
        b = a.R[0];
        c = a.R[1];
        for (var g = a.R[2],
            k = a.R[3],
            l = a.R[4],
            m,
            e = 0; 80 > e; e++)
          40 > e ? 20 > e ? (f = k ^ c & (g ^ k), m = 1518500249) : (f = c ^ g ^ k, m = 1859775393) : 60 > e ? (f = c & g | k & (c | g), m = 2400959708) : (f = c ^ g ^ k, m = 3395469782), f = (b << 5 | b >>> 27) + f + l + m + d[e] & 4294967295, l = k, k = g, g = (c << 30 | c >>> 2) & 4294967295, c = b, b = f;
        a.R[0] = a.R[0] + b & 4294967295;
        a.R[1] = a.R[1] + c & 4294967295;
        a.R[2] = a.R[2] + g & 4294967295;
        a.R[3] = a.R[3] + k & 4294967295;
        a.R[4] = a.R[4] + l & 4294967295;
      }
      La.prototype.update = function(a, b) {
        if (null != a) {
          n(b) || (b = a.length);
          for (var c = b - this.Wa,
              d = 0,
              e = this.le,
              f = this.$b; d < b; ) {
            if (0 == f)
              for (; d <= c; )
                Ma(this, a, d), d += this.Wa;
            if (p(a))
              for (; d < b; ) {
                if (e[f] = a.charCodeAt(d), ++f, ++d, f == this.Wa) {
                  Ma(this, e);
                  f = 0;
                  break;
                }
              }
            else
              for (; d < b; )
                if (e[f] = a[d], ++f, ++d, f == this.Wa) {
                  Ma(this, e);
                  f = 0;
                  break;
                }
          }
          this.$b = f;
          this.be += b;
        }
      };
      var t = Array.prototype,
          Na = t.indexOf ? function(a, b, c) {
            return t.indexOf.call(a, b, c);
          } : function(a, b, c) {
            c = null == c ? 0 : 0 > c ? Math.max(0, a.length + c) : c;
            if (p(a))
              return p(b) && 1 == b.length ? a.indexOf(b, c) : -1;
            for (; c < a.length; c++)
              if (c in a && a[c] === b)
                return c;
            return -1;
          },
          Oa = t.forEach ? function(a, b, c) {
            t.forEach.call(a, b, c);
          } : function(a, b, c) {
            for (var d = a.length,
                e = p(a) ? a.split("") : a,
                f = 0; f < d; f++)
              f in e && b.call(c, e[f], f, a);
          },
          Pa = t.filter ? function(a, b, c) {
            return t.filter.call(a, b, c);
          } : function(a, b, c) {
            for (var d = a.length,
                e = [],
                f = 0,
                g = p(a) ? a.split("") : a,
                k = 0; k < d; k++)
              if (k in g) {
                var l = g[k];
                b.call(c, l, k, a) && (e[f++] = l);
              }
            return e;
          },
          Qa = t.map ? function(a, b, c) {
            return t.map.call(a, b, c);
          } : function(a, b, c) {
            for (var d = a.length,
                e = Array(d),
                f = p(a) ? a.split("") : a,
                g = 0; g < d; g++)
              g in f && (e[g] = b.call(c, f[g], g, a));
            return e;
          },
          Ra = t.reduce ? function(a, b, c, d) {
            for (var e = [],
                f = 1,
                g = arguments.length; f < g; f++)
              e.push(arguments[f]);
            d && (e[0] = q(b, d));
            return t.reduce.apply(a, e);
          } : function(a, b, c, d) {
            var e = c;
            Oa(a, function(c, g) {
              e = b.call(d, e, c, g, a);
            });
            return e;
          },
          Sa = t.every ? function(a, b, c) {
            return t.every.call(a, b, c);
          } : function(a, b, c) {
            for (var d = a.length,
                e = p(a) ? a.split("") : a,
                f = 0; f < d; f++)
              if (f in e && !b.call(c, e[f], f, a))
                return !1;
            return !0;
          };
      function Ta(a, b) {
        var c = Ua(a, b, void 0);
        return 0 > c ? null : p(a) ? a.charAt(c) : a[c];
      }
      function Ua(a, b, c) {
        for (var d = a.length,
            e = p(a) ? a.split("") : a,
            f = 0; f < d; f++)
          if (f in e && b.call(c, e[f], f, a))
            return f;
        return -1;
      }
      function Va(a, b) {
        var c = Na(a, b);
        0 <= c && t.splice.call(a, c, 1);
      }
      function Wa(a, b, c) {
        return 2 >= arguments.length ? t.slice.call(a, b) : t.slice.call(a, b, c);
      }
      function Xa(a, b) {
        a.sort(b || Ya);
      }
      function Ya(a, b) {
        return a > b ? 1 : a < b ? -1 : 0;
      }
      ;
      var Za = -1 != Ha.indexOf("Opera") || -1 != Ha.indexOf("OPR"),
          $a = -1 != Ha.indexOf("Trident") || -1 != Ha.indexOf("MSIE"),
          ab = -1 != Ha.indexOf("Gecko") && -1 == Ha.toLowerCase().indexOf("webkit") && !(-1 != Ha.indexOf("Trident") || -1 != Ha.indexOf("MSIE")),
          bb = -1 != Ha.toLowerCase().indexOf("webkit");
      (function() {
        var a = "",
            b;
        if (Za && aa.opera)
          return a = aa.opera.version, ha(a) ? a() : a;
        ab ? b = /rv\:([^\);]+)(\)|;)/ : $a ? b = /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/ : bb && (b = /WebKit\/(\S+)/);
        b && (a = (a = b.exec(Ha)) ? a[1] : "");
        return $a && (b = (b = aa.document) ? b.documentMode : void 0, b > parseFloat(a)) ? String(b) : a;
      })();
      var cb = null,
          db = null,
          eb = null;
      function fb(a, b) {
        if (!fa(a))
          throw Error("encodeByteArray takes an array as a parameter");
        gb();
        for (var c = b ? db : cb,
            d = [],
            e = 0; e < a.length; e += 3) {
          var f = a[e],
              g = e + 1 < a.length,
              k = g ? a[e + 1] : 0,
              l = e + 2 < a.length,
              m = l ? a[e + 2] : 0,
              v = f >> 2,
              f = (f & 3) << 4 | k >> 4,
              k = (k & 15) << 2 | m >> 6,
              m = m & 63;
          l || (m = 64, g || (k = 64));
          d.push(c[v], c[f], c[k], c[m]);
        }
        return d.join("");
      }
      function gb() {
        if (!cb) {
          cb = {};
          db = {};
          eb = {};
          for (var a = 0; 65 > a; a++)
            cb[a] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(a), db[a] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.".charAt(a), eb[db[a]] = a, 62 <= a && (eb["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(a)] = a);
        }
      }
      ;
      function u(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
      }
      function w(a, b) {
        if (Object.prototype.hasOwnProperty.call(a, b))
          return a[b];
      }
      function hb(a, b) {
        for (var c in a)
          Object.prototype.hasOwnProperty.call(a, c) && b(c, a[c]);
      }
      function ib(a) {
        var b = {};
        hb(a, function(a, d) {
          b[a] = d;
        });
        return b;
      }
      ;
      function jb(a) {
        var b = [];
        hb(a, function(a, d) {
          ea(d) ? Oa(d, function(d) {
            b.push(encodeURIComponent(a) + "=" + encodeURIComponent(d));
          }) : b.push(encodeURIComponent(a) + "=" + encodeURIComponent(d));
        });
        return b.length ? "&" + b.join("&") : "";
      }
      function kb(a) {
        var b = {};
        a = a.replace(/^\?/, "").split("&");
        Oa(a, function(a) {
          a && (a = a.split("="), b[a[0]] = a[1]);
        });
        return b;
      }
      ;
      function x(a, b, c, d) {
        var e;
        d < b ? e = "at least " + b : d > c && (e = 0 === c ? "none" : "no more than " + c);
        if (e)
          throw Error(a + " failed: Was called with " + d + (1 === d ? " argument." : " arguments.") + " Expects " + e + ".");
      }
      function z(a, b, c) {
        var d = "";
        switch (b) {
          case 1:
            d = c ? "first" : "First";
            break;
          case 2:
            d = c ? "second" : "Second";
            break;
          case 3:
            d = c ? "third" : "Third";
            break;
          case 4:
            d = c ? "fourth" : "Fourth";
            break;
          default:
            throw Error("errorPrefix called with argumentNumber > 4.  Need to update it?");
        }
        return a = a + " failed: " + (d + " argument ");
      }
      function A(a, b, c, d) {
        if ((!d || n(c)) && !ha(c))
          throw Error(z(a, b, d) + "must be a valid function.");
      }
      function lb(a, b, c) {
        if (n(c) && (!ia(c) || null === c))
          throw Error(z(a, b, !0) + "must be a valid context object.");
      }
      ;
      function mb(a) {
        return "undefined" !== typeof JSON && n(JSON.parse) ? JSON.parse(a) : Aa(a);
      }
      function B(a) {
        if ("undefined" !== typeof JSON && n(JSON.stringify))
          a = JSON.stringify(a);
        else {
          var b = [];
          Ca(new Ba, a, b);
          a = b.join("");
        }
        return a;
      }
      ;
      function nb() {
        this.Sd = C;
      }
      nb.prototype.j = function(a) {
        return this.Sd.oa(a);
      };
      nb.prototype.toString = function() {
        return this.Sd.toString();
      };
      function ob() {}
      ob.prototype.pf = function() {
        return null;
      };
      ob.prototype.xe = function() {
        return null;
      };
      var pb = new ob;
      function qb(a, b, c) {
        this.Qf = a;
        this.Ka = b;
        this.Hd = c;
      }
      qb.prototype.pf = function(a) {
        var b = this.Ka.D;
        if (rb(b, a))
          return b.j().M(a);
        b = null != this.Hd ? new sb(this.Hd, !0, !1) : this.Ka.u();
        return this.Qf.Xa(a, b);
      };
      qb.prototype.xe = function(a, b, c) {
        var d = null != this.Hd ? this.Hd : tb(this.Ka);
        a = this.Qf.me(d, b, 1, c, a);
        return 0 === a.length ? null : a[0];
      };
      function ub() {
        this.tb = [];
      }
      function vb(a, b) {
        for (var c = null,
            d = 0; d < b.length; d++) {
          var e = b[d],
              f = e.Yb();
          null === c || f.Z(c.Yb()) || (a.tb.push(c), c = null);
          null === c && (c = new wb(f));
          c.add(e);
        }
        c && a.tb.push(c);
      }
      function xb(a, b, c) {
        vb(a, c);
        yb(a, function(a) {
          return a.Z(b);
        });
      }
      function zb(a, b, c) {
        vb(a, c);
        yb(a, function(a) {
          return a.contains(b) || b.contains(a);
        });
      }
      function yb(a, b) {
        for (var c = !0,
            d = 0; d < a.tb.length; d++) {
          var e = a.tb[d];
          if (e)
            if (e = e.Yb(), b(e)) {
              for (var e = a.tb[d],
                  f = 0; f < e.sd.length; f++) {
                var g = e.sd[f];
                if (null !== g) {
                  e.sd[f] = null;
                  var k = g.Ub();
                  Ab && Bb("event: " + g.toString());
                  Cb(k);
                }
              }
              a.tb[d] = null;
            } else
              c = !1;
        }
        c && (a.tb = []);
      }
      function wb(a) {
        this.qa = a;
        this.sd = [];
      }
      wb.prototype.add = function(a) {
        this.sd.push(a);
      };
      wb.prototype.Yb = function() {
        return this.qa;
      };
      function D(a, b, c, d) {
        this.type = a;
        this.Ja = b;
        this.Ya = c;
        this.Je = d;
        this.Nd = void 0;
      }
      function Db(a) {
        return new D(Eb, a);
      }
      var Eb = "value";
      function Fb(a, b, c, d) {
        this.te = b;
        this.Wd = c;
        this.Nd = d;
        this.rd = a;
      }
      Fb.prototype.Yb = function() {
        var a = this.Wd.lc();
        return "value" === this.rd ? a.path : a.parent().path;
      };
      Fb.prototype.ye = function() {
        return this.rd;
      };
      Fb.prototype.Ub = function() {
        return this.te.Ub(this);
      };
      Fb.prototype.toString = function() {
        return this.Yb().toString() + ":" + this.rd + ":" + B(this.Wd.lf());
      };
      function Gb(a, b, c) {
        this.te = a;
        this.error = b;
        this.path = c;
      }
      Gb.prototype.Yb = function() {
        return this.path;
      };
      Gb.prototype.ye = function() {
        return "cancel";
      };
      Gb.prototype.Ub = function() {
        return this.te.Ub(this);
      };
      Gb.prototype.toString = function() {
        return this.path.toString() + ":cancel";
      };
      function sb(a, b, c) {
        this.B = a;
        this.$ = b;
        this.Tb = c;
      }
      function Hb(a) {
        return a.$;
      }
      function rb(a, b) {
        return a.$ && !a.Tb || a.B.Ha(b);
      }
      sb.prototype.j = function() {
        return this.B;
      };
      function Ib(a) {
        this.dg = a;
        this.Ad = null;
      }
      Ib.prototype.get = function() {
        var a = this.dg.get(),
            b = xa(a);
        if (this.Ad)
          for (var c in this.Ad)
            b[c] -= this.Ad[c];
        this.Ad = a;
        return b;
      };
      function Jb(a, b) {
        this.Mf = {};
        this.Yd = new Ib(a);
        this.ca = b;
        var c = 1E4 + 2E4 * Math.random();
        setTimeout(q(this.Hf, this), Math.floor(c));
      }
      Jb.prototype.Hf = function() {
        var a = this.Yd.get(),
            b = {},
            c = !1,
            d;
        for (d in a)
          0 < a[d] && u(this.Mf, d) && (b[d] = a[d], c = !0);
        c && this.ca.Te(b);
        setTimeout(q(this.Hf, this), Math.floor(6E5 * Math.random()));
      };
      function Kb() {
        this.Dc = {};
      }
      function Lb(a, b, c) {
        n(c) || (c = 1);
        u(a.Dc, b) || (a.Dc[b] = 0);
        a.Dc[b] += c;
      }
      Kb.prototype.get = function() {
        return xa(this.Dc);
      };
      var Mb = {},
          Nb = {};
      function Ob(a) {
        a = a.toString();
        Mb[a] || (Mb[a] = new Kb);
        return Mb[a];
      }
      function Pb(a, b) {
        var c = a.toString();
        Nb[c] || (Nb[c] = b());
        return Nb[c];
      }
      ;
      function E(a, b) {
        this.name = a;
        this.S = b;
      }
      function Qb(a, b) {
        return new E(a, b);
      }
      ;
      function Rb(a, b) {
        return Sb(a.name, b.name);
      }
      function Tb(a, b) {
        return Sb(a, b);
      }
      ;
      function Ub(a, b, c) {
        this.type = Vb;
        this.source = a;
        this.path = b;
        this.Ia = c;
      }
      Ub.prototype.Wc = function(a) {
        return this.path.e() ? new Ub(this.source, F, this.Ia.M(a)) : new Ub(this.source, G(this.path), this.Ia);
      };
      Ub.prototype.toString = function() {
        return "Operation(" + this.path + ": " + this.source.toString() + " overwrite: " + this.Ia.toString() + ")";
      };
      function Wb(a, b) {
        this.type = Xb;
        this.source = Yb;
        this.path = a;
        this.Ve = b;
      }
      Wb.prototype.Wc = function() {
        return this.path.e() ? this : new Wb(G(this.path), this.Ve);
      };
      Wb.prototype.toString = function() {
        return "Operation(" + this.path + ": " + this.source.toString() + " ack write revert=" + this.Ve + ")";
      };
      function Zb(a, b) {
        this.type = $b;
        this.source = a;
        this.path = b;
      }
      Zb.prototype.Wc = function() {
        return this.path.e() ? new Zb(this.source, F) : new Zb(this.source, G(this.path));
      };
      Zb.prototype.toString = function() {
        return "Operation(" + this.path + ": " + this.source.toString() + " listen_complete)";
      };
      function ac(a, b) {
        this.La = a;
        this.xa = b ? b : bc;
      }
      h = ac.prototype;
      h.Na = function(a, b) {
        return new ac(this.La, this.xa.Na(a, b, this.La).X(null, null, !1, null, null));
      };
      h.remove = function(a) {
        return new ac(this.La, this.xa.remove(a, this.La).X(null, null, !1, null, null));
      };
      h.get = function(a) {
        for (var b,
            c = this.xa; !c.e(); ) {
          b = this.La(a, c.key);
          if (0 === b)
            return c.value;
          0 > b ? c = c.left : 0 < b && (c = c.right);
        }
        return null;
      };
      function cc(a, b) {
        for (var c,
            d = a.xa,
            e = null; !d.e(); ) {
          c = a.La(b, d.key);
          if (0 === c) {
            if (d.left.e())
              return e ? e.key : null;
            for (d = d.left; !d.right.e(); )
              d = d.right;
            return d.key;
          }
          0 > c ? d = d.left : 0 < c && (e = d, d = d.right);
        }
        throw Error("Attempted to find predecessor key for a nonexistent key.  What gives?");
      }
      h.e = function() {
        return this.xa.e();
      };
      h.count = function() {
        return this.xa.count();
      };
      h.Rc = function() {
        return this.xa.Rc();
      };
      h.ec = function() {
        return this.xa.ec();
      };
      h.ha = function(a) {
        return this.xa.ha(a);
      };
      h.Wb = function(a) {
        return new dc(this.xa, null, this.La, !1, a);
      };
      h.Xb = function(a, b) {
        return new dc(this.xa, a, this.La, !1, b);
      };
      h.Zb = function(a, b) {
        return new dc(this.xa, a, this.La, !0, b);
      };
      h.rf = function(a) {
        return new dc(this.xa, null, this.La, !0, a);
      };
      function dc(a, b, c, d, e) {
        this.Rd = e || null;
        this.Ee = d;
        this.Pa = [];
        for (e = 1; !a.e(); )
          if (e = b ? c(a.key, b) : 1, d && (e *= -1), 0 > e)
            a = this.Ee ? a.left : a.right;
          else if (0 === e) {
            this.Pa.push(a);
            break;
          } else
            this.Pa.push(a), a = this.Ee ? a.right : a.left;
      }
      function H(a) {
        if (0 === a.Pa.length)
          return null;
        var b = a.Pa.pop(),
            c;
        c = a.Rd ? a.Rd(b.key, b.value) : {
          key: b.key,
          value: b.value
        };
        if (a.Ee)
          for (b = b.left; !b.e(); )
            a.Pa.push(b), b = b.right;
        else
          for (b = b.right; !b.e(); )
            a.Pa.push(b), b = b.left;
        return c;
      }
      function ec(a) {
        if (0 === a.Pa.length)
          return null;
        var b;
        b = a.Pa;
        b = b[b.length - 1];
        return a.Rd ? a.Rd(b.key, b.value) : {
          key: b.key,
          value: b.value
        };
      }
      function fc(a, b, c, d, e) {
        this.key = a;
        this.value = b;
        this.color = null != c ? c : !0;
        this.left = null != d ? d : bc;
        this.right = null != e ? e : bc;
      }
      h = fc.prototype;
      h.X = function(a, b, c, d, e) {
        return new fc(null != a ? a : this.key, null != b ? b : this.value, null != c ? c : this.color, null != d ? d : this.left, null != e ? e : this.right);
      };
      h.count = function() {
        return this.left.count() + 1 + this.right.count();
      };
      h.e = function() {
        return !1;
      };
      h.ha = function(a) {
        return this.left.ha(a) || a(this.key, this.value) || this.right.ha(a);
      };
      function gc(a) {
        return a.left.e() ? a : gc(a.left);
      }
      h.Rc = function() {
        return gc(this).key;
      };
      h.ec = function() {
        return this.right.e() ? this.key : this.right.ec();
      };
      h.Na = function(a, b, c) {
        var d,
            e;
        e = this;
        d = c(a, e.key);
        e = 0 > d ? e.X(null, null, null, e.left.Na(a, b, c), null) : 0 === d ? e.X(null, b, null, null, null) : e.X(null, null, null, null, e.right.Na(a, b, c));
        return hc(e);
      };
      function ic(a) {
        if (a.left.e())
          return bc;
        a.left.fa() || a.left.left.fa() || (a = jc(a));
        a = a.X(null, null, null, ic(a.left), null);
        return hc(a);
      }
      h.remove = function(a, b) {
        var c,
            d;
        c = this;
        if (0 > b(a, c.key))
          c.left.e() || c.left.fa() || c.left.left.fa() || (c = jc(c)), c = c.X(null, null, null, c.left.remove(a, b), null);
        else {
          c.left.fa() && (c = kc(c));
          c.right.e() || c.right.fa() || c.right.left.fa() || (c = lc(c), c.left.left.fa() && (c = kc(c), c = lc(c)));
          if (0 === b(a, c.key)) {
            if (c.right.e())
              return bc;
            d = gc(c.right);
            c = c.X(d.key, d.value, null, null, ic(c.right));
          }
          c = c.X(null, null, null, null, c.right.remove(a, b));
        }
        return hc(c);
      };
      h.fa = function() {
        return this.color;
      };
      function hc(a) {
        a.right.fa() && !a.left.fa() && (a = mc(a));
        a.left.fa() && a.left.left.fa() && (a = kc(a));
        a.left.fa() && a.right.fa() && (a = lc(a));
        return a;
      }
      function jc(a) {
        a = lc(a);
        a.right.left.fa() && (a = a.X(null, null, null, null, kc(a.right)), a = mc(a), a = lc(a));
        return a;
      }
      function mc(a) {
        return a.right.X(null, null, a.color, a.X(null, null, !0, null, a.right.left), null);
      }
      function kc(a) {
        return a.left.X(null, null, a.color, null, a.X(null, null, !0, a.left.right, null));
      }
      function lc(a) {
        return a.X(null, null, !a.color, a.left.X(null, null, !a.left.color, null, null), a.right.X(null, null, !a.right.color, null, null));
      }
      function nc() {}
      h = nc.prototype;
      h.X = function() {
        return this;
      };
      h.Na = function(a, b) {
        return new fc(a, b, null);
      };
      h.remove = function() {
        return this;
      };
      h.count = function() {
        return 0;
      };
      h.e = function() {
        return !0;
      };
      h.ha = function() {
        return !1;
      };
      h.Rc = function() {
        return null;
      };
      h.ec = function() {
        return null;
      };
      h.fa = function() {
        return !1;
      };
      var bc = new nc;
      function oc(a, b) {
        return a && "object" === typeof a ? (J(".sv" in a, "Unexpected leaf node or priority contents"), b[a[".sv"]]) : a;
      }
      function pc(a, b) {
        var c = new qc;
        rc(a, new K(""), function(a, e) {
          c.mc(a, sc(e, b));
        });
        return c;
      }
      function sc(a, b) {
        var c = a.A().K(),
            c = oc(c, b),
            d;
        if (a.N()) {
          var e = oc(a.Ba(), b);
          return e !== a.Ba() || c !== a.A().K() ? new tc(e, L(c)) : a;
        }
        d = a;
        c !== a.A().K() && (d = d.da(new tc(c)));
        a.U(M, function(a, c) {
          var e = sc(c, b);
          e !== c && (d = d.Q(a, e));
        });
        return d;
      }
      ;
      function K(a, b) {
        if (1 == arguments.length) {
          this.n = a.split("/");
          for (var c = 0,
              d = 0; d < this.n.length; d++)
            0 < this.n[d].length && (this.n[c] = this.n[d], c++);
          this.n.length = c;
          this.Y = 0;
        } else
          this.n = a, this.Y = b;
      }
      function N(a, b) {
        var c = O(a);
        if (null === c)
          return b;
        if (c === O(b))
          return N(G(a), G(b));
        throw Error("INTERNAL ERROR: innerPath (" + b + ") is not within outerPath (" + a + ")");
      }
      function O(a) {
        return a.Y >= a.n.length ? null : a.n[a.Y];
      }
      function uc(a) {
        return a.n.length - a.Y;
      }
      function G(a) {
        var b = a.Y;
        b < a.n.length && b++;
        return new K(a.n, b);
      }
      function vc(a) {
        return a.Y < a.n.length ? a.n[a.n.length - 1] : null;
      }
      h = K.prototype;
      h.toString = function() {
        for (var a = "",
            b = this.Y; b < this.n.length; b++)
          "" !== this.n[b] && (a += "/" + this.n[b]);
        return a || "/";
      };
      h.slice = function(a) {
        return this.n.slice(this.Y + (a || 0));
      };
      h.parent = function() {
        if (this.Y >= this.n.length)
          return null;
        for (var a = [],
            b = this.Y; b < this.n.length - 1; b++)
          a.push(this.n[b]);
        return new K(a, 0);
      };
      h.w = function(a) {
        for (var b = [],
            c = this.Y; c < this.n.length; c++)
          b.push(this.n[c]);
        if (a instanceof K)
          for (c = a.Y; c < a.n.length; c++)
            b.push(a.n[c]);
        else
          for (a = a.split("/"), c = 0; c < a.length; c++)
            0 < a[c].length && b.push(a[c]);
        return new K(b, 0);
      };
      h.e = function() {
        return this.Y >= this.n.length;
      };
      h.Z = function(a) {
        if (uc(this) !== uc(a))
          return !1;
        for (var b = this.Y,
            c = a.Y; b <= this.n.length; b++, c++)
          if (this.n[b] !== a.n[c])
            return !1;
        return !0;
      };
      h.contains = function(a) {
        var b = this.Y,
            c = a.Y;
        if (uc(this) > uc(a))
          return !1;
        for (; b < this.n.length; ) {
          if (this.n[b] !== a.n[c])
            return !1;
          ++b;
          ++c;
        }
        return !0;
      };
      var F = new K("");
      function wc(a, b) {
        this.Qa = a.slice();
        this.Ea = Math.max(1, this.Qa.length);
        this.kf = b;
        for (var c = 0; c < this.Qa.length; c++)
          this.Ea += xc(this.Qa[c]);
        yc(this);
      }
      wc.prototype.push = function(a) {
        0 < this.Qa.length && (this.Ea += 1);
        this.Qa.push(a);
        this.Ea += xc(a);
        yc(this);
      };
      wc.prototype.pop = function() {
        var a = this.Qa.pop();
        this.Ea -= xc(a);
        0 < this.Qa.length && --this.Ea;
      };
      function yc(a) {
        if (768 < a.Ea)
          throw Error(a.kf + "has a key path longer than 768 bytes (" + a.Ea + ").");
        if (32 < a.Qa.length)
          throw Error(a.kf + "path specified exceeds the maximum depth that can be written (32) or object contains a cycle " + zc(a));
      }
      function zc(a) {
        return 0 == a.Qa.length ? "" : "in property '" + a.Qa.join(".") + "'";
      }
      ;
      function Ac() {
        this.wc = {};
      }
      Ac.prototype.set = function(a, b) {
        null == b ? delete this.wc[a] : this.wc[a] = b;
      };
      Ac.prototype.get = function(a) {
        return u(this.wc, a) ? this.wc[a] : null;
      };
      Ac.prototype.remove = function(a) {
        delete this.wc[a];
      };
      Ac.prototype.uf = !0;
      function Bc(a) {
        this.Ec = a;
        this.Md = "firebase:";
      }
      h = Bc.prototype;
      h.set = function(a, b) {
        null == b ? this.Ec.removeItem(this.Md + a) : this.Ec.setItem(this.Md + a, B(b));
      };
      h.get = function(a) {
        a = this.Ec.getItem(this.Md + a);
        return null == a ? null : mb(a);
      };
      h.remove = function(a) {
        this.Ec.removeItem(this.Md + a);
      };
      h.uf = !1;
      h.toString = function() {
        return this.Ec.toString();
      };
      function Cc(a) {
        try {
          if ("undefined" !== typeof window && "undefined" !== typeof window[a]) {
            var b = window[a];
            b.setItem("firebase:sentinel", "cache");
            b.removeItem("firebase:sentinel");
            return new Bc(b);
          }
        } catch (c) {}
        return new Ac;
      }
      var Dc = Cc("localStorage"),
          P = Cc("sessionStorage");
      function Ec(a, b, c, d, e) {
        this.host = a.toLowerCase();
        this.domain = this.host.substr(this.host.indexOf(".") + 1);
        this.lb = b;
        this.Cb = c;
        this.Tg = d;
        this.Ld = e || "";
        this.Oa = Dc.get("host:" + a) || this.host;
      }
      function Fc(a, b) {
        b !== a.Oa && (a.Oa = b, "s-" === a.Oa.substr(0, 2) && Dc.set("host:" + a.host, a.Oa));
      }
      Ec.prototype.toString = function() {
        var a = (this.lb ? "https://" : "http://") + this.host;
        this.Ld && (a += "<" + this.Ld + ">");
        return a;
      };
      var Gc = function() {
        var a = 1;
        return function() {
          return a++;
        };
      }();
      function J(a, b) {
        if (!a)
          throw Hc(b);
      }
      function Hc(a) {
        return Error("Firebase (2.2.7) INTERNAL ASSERT FAILED: " + a);
      }
      function Ic(a) {
        try {
          var b;
          if ("undefined" !== typeof atob)
            b = atob(a);
          else {
            gb();
            for (var c = eb,
                d = [],
                e = 0; e < a.length; ) {
              var f = c[a.charAt(e++)],
                  g = e < a.length ? c[a.charAt(e)] : 0;
              ++e;
              var k = e < a.length ? c[a.charAt(e)] : 64;
              ++e;
              var l = e < a.length ? c[a.charAt(e)] : 64;
              ++e;
              if (null == f || null == g || null == k || null == l)
                throw Error();
              d.push(f << 2 | g >> 4);
              64 != k && (d.push(g << 4 & 240 | k >> 2), 64 != l && d.push(k << 6 & 192 | l));
            }
            if (8192 > d.length)
              b = String.fromCharCode.apply(null, d);
            else {
              a = "";
              for (c = 0; c < d.length; c += 8192)
                a += String.fromCharCode.apply(null, Wa(d, c, c + 8192));
              b = a;
            }
          }
          return b;
        } catch (m) {
          Bb("base64Decode failed: ", m);
        }
        return null;
      }
      function Jc(a) {
        var b = Kc(a);
        a = new La;
        a.update(b);
        var b = [],
            c = 8 * a.be;
        56 > a.$b ? a.update(a.Id, 56 - a.$b) : a.update(a.Id, a.Wa - (a.$b - 56));
        for (var d = a.Wa - 1; 56 <= d; d--)
          a.le[d] = c & 255, c /= 256;
        Ma(a, a.le);
        for (d = c = 0; 5 > d; d++)
          for (var e = 24; 0 <= e; e -= 8)
            b[c] = a.R[d] >> e & 255, ++c;
        return fb(b);
      }
      function Lc(a) {
        for (var b = "",
            c = 0; c < arguments.length; c++)
          b = fa(arguments[c]) ? b + Lc.apply(null, arguments[c]) : "object" === typeof arguments[c] ? b + B(arguments[c]) : b + arguments[c], b += " ";
        return b;
      }
      var Ab = null,
          Mc = !0;
      function Bb(a) {
        !0 === Mc && (Mc = !1, null === Ab && !0 === P.get("logging_enabled") && Nc(!0));
        if (Ab) {
          var b = Lc.apply(null, arguments);
          Ab(b);
        }
      }
      function Oc(a) {
        return function() {
          Bb(a, arguments);
        };
      }
      function Pc(a) {
        if ("undefined" !== typeof console) {
          var b = "FIREBASE INTERNAL ERROR: " + Lc.apply(null, arguments);
          "undefined" !== typeof console.error ? console.error(b) : console.log(b);
        }
      }
      function Qc(a) {
        var b = Lc.apply(null, arguments);
        throw Error("FIREBASE FATAL ERROR: " + b);
      }
      function Q(a) {
        if ("undefined" !== typeof console) {
          var b = "FIREBASE WARNING: " + Lc.apply(null, arguments);
          "undefined" !== typeof console.warn ? console.warn(b) : console.log(b);
        }
      }
      function Rc(a) {
        var b = "",
            c = "",
            d = "",
            e = "",
            f = !0,
            g = "https",
            k = 443;
        if (p(a)) {
          var l = a.indexOf("//");
          0 <= l && (g = a.substring(0, l - 1), a = a.substring(l + 2));
          l = a.indexOf("/");
          -1 === l && (l = a.length);
          b = a.substring(0, l);
          e = "";
          a = a.substring(l).split("/");
          for (l = 0; l < a.length; l++)
            if (0 < a[l].length) {
              var m = a[l];
              try {
                m = decodeURIComponent(m.replace(/\+/g, " "));
              } catch (v) {}
              e += "/" + m;
            }
          a = b.split(".");
          3 === a.length ? (c = a[1], d = a[0].toLowerCase()) : 2 === a.length && (c = a[0]);
          l = b.indexOf(":");
          0 <= l && (f = "https" === g || "wss" === g, k = b.substring(l + 1), isFinite(k) && (k = String(k)), k = p(k) ? /^\s*-?0x/i.test(k) ? parseInt(k, 16) : parseInt(k, 10) : NaN);
        }
        return {
          host: b,
          port: k,
          domain: c,
          Qg: d,
          lb: f,
          scheme: g,
          Zc: e
        };
      }
      function Sc(a) {
        return ga(a) && (a != a || a == Number.POSITIVE_INFINITY || a == Number.NEGATIVE_INFINITY);
      }
      function Tc(a) {
        if ("complete" === document.readyState)
          a();
        else {
          var b = !1,
              c = function() {
                document.body ? b || (b = !0, a()) : setTimeout(c, Math.floor(10));
              };
          document.addEventListener ? (document.addEventListener("DOMContentLoaded", c, !1), window.addEventListener("load", c, !1)) : document.attachEvent && (document.attachEvent("onreadystatechange", function() {
            "complete" === document.readyState && c();
          }), window.attachEvent("onload", c));
        }
      }
      function Sb(a, b) {
        if (a === b)
          return 0;
        if ("[MIN_NAME]" === a || "[MAX_NAME]" === b)
          return -1;
        if ("[MIN_NAME]" === b || "[MAX_NAME]" === a)
          return 1;
        var c = Uc(a),
            d = Uc(b);
        return null !== c ? null !== d ? 0 == c - d ? a.length - b.length : c - d : -1 : null !== d ? 1 : a < b ? -1 : 1;
      }
      function Vc(a, b) {
        if (b && a in b)
          return b[a];
        throw Error("Missing required key (" + a + ") in object: " + B(b));
      }
      function Wc(a) {
        if ("object" !== typeof a || null === a)
          return B(a);
        var b = [],
            c;
        for (c in a)
          b.push(c);
        b.sort();
        c = "{";
        for (var d = 0; d < b.length; d++)
          0 !== d && (c += ","), c += B(b[d]), c += ":", c += Wc(a[b[d]]);
        return c + "}";
      }
      function Xc(a, b) {
        if (a.length <= b)
          return [a];
        for (var c = [],
            d = 0; d < a.length; d += b)
          d + b > a ? c.push(a.substring(d, a.length)) : c.push(a.substring(d, d + b));
        return c;
      }
      function Yc(a, b) {
        if (ea(a))
          for (var c = 0; c < a.length; ++c)
            b(c, a[c]);
        else
          r(a, b);
      }
      function Zc(a) {
        J(!Sc(a), "Invalid JSON number");
        var b,
            c,
            d,
            e;
        0 === a ? (d = c = 0, b = -Infinity === 1 / a ? 1 : 0) : (b = 0 > a, a = Math.abs(a), a >= Math.pow(2, -1022) ? (d = Math.min(Math.floor(Math.log(a) / Math.LN2), 1023), c = d + 1023, d = Math.round(a * Math.pow(2, 52 - d) - Math.pow(2, 52))) : (c = 0, d = Math.round(a / Math.pow(2, -1074))));
        e = [];
        for (a = 52; a; --a)
          e.push(d % 2 ? 1 : 0), d = Math.floor(d / 2);
        for (a = 11; a; --a)
          e.push(c % 2 ? 1 : 0), c = Math.floor(c / 2);
        e.push(b ? 1 : 0);
        e.reverse();
        b = e.join("");
        c = "";
        for (a = 0; 64 > a; a += 8)
          d = parseInt(b.substr(a, 8), 2).toString(16), 1 === d.length && (d = "0" + d), c += d;
        return c.toLowerCase();
      }
      var $c = /^-?\d{1,10}$/;
      function Uc(a) {
        return $c.test(a) && (a = Number(a), -2147483648 <= a && 2147483647 >= a) ? a : null;
      }
      function Cb(a) {
        try {
          a();
        } catch (b) {
          setTimeout(function() {
            Q("Exception was thrown by user callback.", b.stack || "");
            throw b;
          }, Math.floor(0));
        }
      }
      function R(a, b) {
        if (ha(a)) {
          var c = Array.prototype.slice.call(arguments, 1).slice();
          Cb(function() {
            a.apply(null, c);
          });
        }
      }
      ;
      function Kc(a) {
        for (var b = [],
            c = 0,
            d = 0; d < a.length; d++) {
          var e = a.charCodeAt(d);
          55296 <= e && 56319 >= e && (e -= 55296, d++, J(d < a.length, "Surrogate pair missing trail surrogate."), e = 65536 + (e << 10) + (a.charCodeAt(d) - 56320));
          128 > e ? b[c++] = e : (2048 > e ? b[c++] = e >> 6 | 192 : (65536 > e ? b[c++] = e >> 12 | 224 : (b[c++] = e >> 18 | 240, b[c++] = e >> 12 & 63 | 128), b[c++] = e >> 6 & 63 | 128), b[c++] = e & 63 | 128);
        }
        return b;
      }
      function xc(a) {
        for (var b = 0,
            c = 0; c < a.length; c++) {
          var d = a.charCodeAt(c);
          128 > d ? b++ : 2048 > d ? b += 2 : 55296 <= d && 56319 >= d ? (b += 4, c++) : b += 3;
        }
        return b;
      }
      ;
      function ad(a) {
        var b = {},
            c = {},
            d = {},
            e = "";
        try {
          var f = a.split("."),
              b = mb(Ic(f[0]) || ""),
              c = mb(Ic(f[1]) || ""),
              e = f[2],
              d = c.d || {};
          delete c.d;
        } catch (g) {}
        return {
          Wg: b,
          Ac: c,
          data: d,
          Ng: e
        };
      }
      function bd(a) {
        a = ad(a).Ac;
        return "object" === typeof a && a.hasOwnProperty("iat") ? w(a, "iat") : null;
      }
      function cd(a) {
        a = ad(a);
        var b = a.Ac;
        return !!a.Ng && !!b && "object" === typeof b && b.hasOwnProperty("iat");
      }
      ;
      function dd(a) {
        this.V = a;
        this.g = a.o.g;
      }
      function ed(a, b, c, d) {
        var e = [],
            f = [];
        Oa(b, function(b) {
          "child_changed" === b.type && a.g.xd(b.Je, b.Ja) && f.push(new D("child_moved", b.Ja, b.Ya));
        });
        fd(a, e, "child_removed", b, d, c);
        fd(a, e, "child_added", b, d, c);
        fd(a, e, "child_moved", f, d, c);
        fd(a, e, "child_changed", b, d, c);
        fd(a, e, Eb, b, d, c);
        return e;
      }
      function fd(a, b, c, d, e, f) {
        d = Pa(d, function(a) {
          return a.type === c;
        });
        Xa(d, q(a.eg, a));
        Oa(d, function(c) {
          var d = gd(a, c, f);
          Oa(e, function(e) {
            e.Jf(c.type) && b.push(e.createEvent(d, a.V));
          });
        });
      }
      function gd(a, b, c) {
        "value" !== b.type && "child_removed" !== b.type && (b.Nd = c.qf(b.Ya, b.Ja, a.g));
        return b;
      }
      dd.prototype.eg = function(a, b) {
        if (null == a.Ya || null == b.Ya)
          throw Hc("Should only compare child_ events.");
        return this.g.compare(new E(a.Ya, a.Ja), new E(b.Ya, b.Ja));
      };
      function hd() {
        this.eb = {};
      }
      function id(a, b) {
        var c = b.type,
            d = b.Ya;
        J("child_added" == c || "child_changed" == c || "child_removed" == c, "Only child changes supported for tracking");
        J(".priority" !== d, "Only non-priority child changes can be tracked.");
        var e = w(a.eb, d);
        if (e) {
          var f = e.type;
          if ("child_added" == c && "child_removed" == f)
            a.eb[d] = new D("child_changed", b.Ja, d, e.Ja);
          else if ("child_removed" == c && "child_added" == f)
            delete a.eb[d];
          else if ("child_removed" == c && "child_changed" == f)
            a.eb[d] = new D("child_removed", e.Je, d);
          else if ("child_changed" == c && "child_added" == f)
            a.eb[d] = new D("child_added", b.Ja, d);
          else if ("child_changed" == c && "child_changed" == f)
            a.eb[d] = new D("child_changed", b.Ja, d, e.Je);
          else
            throw Hc("Illegal combination of changes: " + b + " occurred after " + e);
        } else
          a.eb[d] = b;
      }
      ;
      function jd(a, b, c) {
        this.Pb = a;
        this.qb = b;
        this.sb = c || null;
      }
      h = jd.prototype;
      h.Jf = function(a) {
        return "value" === a;
      };
      h.createEvent = function(a, b) {
        var c = b.o.g;
        return new Fb("value", this, new S(a.Ja, b.lc(), c));
      };
      h.Ub = function(a) {
        var b = this.sb;
        if ("cancel" === a.ye()) {
          J(this.qb, "Raising a cancel event on a listener with no cancel callback");
          var c = this.qb;
          return function() {
            c.call(b, a.error);
          };
        }
        var d = this.Pb;
        return function() {
          d.call(b, a.Wd);
        };
      };
      h.ff = function(a, b) {
        return this.qb ? new Gb(this, a, b) : null;
      };
      h.matches = function(a) {
        return a instanceof jd ? a.Pb && this.Pb ? a.Pb === this.Pb && a.sb === this.sb : !0 : !1;
      };
      h.sf = function() {
        return null !== this.Pb;
      };
      function kd(a, b, c) {
        this.ga = a;
        this.qb = b;
        this.sb = c;
      }
      h = kd.prototype;
      h.Jf = function(a) {
        a = "children_added" === a ? "child_added" : a;
        return ("children_removed" === a ? "child_removed" : a) in this.ga;
      };
      h.ff = function(a, b) {
        return this.qb ? new Gb(this, a, b) : null;
      };
      h.createEvent = function(a, b) {
        J(null != a.Ya, "Child events should have a childName.");
        var c = b.lc().w(a.Ya);
        return new Fb(a.type, this, new S(a.Ja, c, b.o.g), a.Nd);
      };
      h.Ub = function(a) {
        var b = this.sb;
        if ("cancel" === a.ye()) {
          J(this.qb, "Raising a cancel event on a listener with no cancel callback");
          var c = this.qb;
          return function() {
            c.call(b, a.error);
          };
        }
        var d = this.ga[a.rd];
        return function() {
          d.call(b, a.Wd, a.Nd);
        };
      };
      h.matches = function(a) {
        if (a instanceof kd) {
          if (!this.ga || !a.ga)
            return !0;
          if (this.sb === a.sb) {
            var b = pa(a.ga);
            if (b === pa(this.ga)) {
              if (1 === b) {
                var b = qa(a.ga),
                    c = qa(this.ga);
                return c === b && (!a.ga[b] || !this.ga[c] || a.ga[b] === this.ga[c]);
              }
              return oa(this.ga, function(b, c) {
                return a.ga[c] === b;
              });
            }
          }
        }
        return !1;
      };
      h.sf = function() {
        return null !== this.ga;
      };
      function ld(a) {
        this.g = a;
      }
      h = ld.prototype;
      h.G = function(a, b, c, d, e) {
        J(a.Ic(this.g), "A node must be indexed if only a child is updated");
        d = a.M(b);
        if (d.Z(c))
          return a;
        null != e && (c.e() ? a.Ha(b) ? id(e, new D("child_removed", d, b)) : J(a.N(), "A child remove without an old child only makes sense on a leaf node") : d.e() ? id(e, new D("child_added", c, b)) : id(e, new D("child_changed", c, b, d)));
        return a.N() && c.e() ? a : a.Q(b, c).mb(this.g);
      };
      h.ta = function(a, b, c) {
        null != c && (a.N() || a.U(M, function(a, e) {
          b.Ha(a) || id(c, new D("child_removed", e, a));
        }), b.N() || b.U(M, function(b, e) {
          if (a.Ha(b)) {
            var f = a.M(b);
            f.Z(e) || id(c, new D("child_changed", e, b, f));
          } else
            id(c, new D("child_added", e, b));
        }));
        return b.mb(this.g);
      };
      h.da = function(a, b) {
        return a.e() ? C : a.da(b);
      };
      h.Ga = function() {
        return !1;
      };
      h.Vb = function() {
        return this;
      };
      function md(a) {
        this.Ae = new ld(a.g);
        this.g = a.g;
        var b;
        a.la ? (b = nd(a), b = a.g.Oc(od(a), b)) : b = a.g.Sc();
        this.dd = b;
        a.na ? (b = pd(a), a = a.g.Oc(qd(a), b)) : a = a.g.Pc();
        this.Fc = a;
      }
      h = md.prototype;
      h.matches = function(a) {
        return 0 >= this.g.compare(this.dd, a) && 0 >= this.g.compare(a, this.Fc);
      };
      h.G = function(a, b, c, d, e) {
        this.matches(new E(b, c)) || (c = C);
        return this.Ae.G(a, b, c, d, e);
      };
      h.ta = function(a, b, c) {
        b.N() && (b = C);
        var d = b.mb(this.g),
            d = d.da(C),
            e = this;
        b.U(M, function(a, b) {
          e.matches(new E(a, b)) || (d = d.Q(a, C));
        });
        return this.Ae.ta(a, d, c);
      };
      h.da = function(a) {
        return a;
      };
      h.Ga = function() {
        return !0;
      };
      h.Vb = function() {
        return this.Ae;
      };
      function rd(a) {
        this.ra = new md(a);
        this.g = a.g;
        J(a.ia, "Only valid if limit has been set");
        this.ja = a.ja;
        this.Jb = !sd(a);
      }
      h = rd.prototype;
      h.G = function(a, b, c, d, e) {
        this.ra.matches(new E(b, c)) || (c = C);
        return a.M(b).Z(c) ? a : a.Db() < this.ja ? this.ra.Vb().G(a, b, c, d, e) : td(this, a, b, c, d, e);
      };
      h.ta = function(a, b, c) {
        var d;
        if (b.N() || b.e())
          d = C.mb(this.g);
        else if (2 * this.ja < b.Db() && b.Ic(this.g)) {
          d = C.mb(this.g);
          b = this.Jb ? b.Zb(this.ra.Fc, this.g) : b.Xb(this.ra.dd, this.g);
          for (var e = 0; 0 < b.Pa.length && e < this.ja; ) {
            var f = H(b),
                g;
            if (g = this.Jb ? 0 >= this.g.compare(this.ra.dd, f) : 0 >= this.g.compare(f, this.ra.Fc))
              d = d.Q(f.name, f.S), e++;
            else
              break;
          }
        } else {
          d = b.mb(this.g);
          d = d.da(C);
          var k,
              l,
              m;
          if (this.Jb) {
            b = d.rf(this.g);
            k = this.ra.Fc;
            l = this.ra.dd;
            var v = ud(this.g);
            m = function(a, b) {
              return v(b, a);
            };
          } else
            b = d.Wb(this.g), k = this.ra.dd, l = this.ra.Fc, m = ud(this.g);
          for (var e = 0,
              y = !1; 0 < b.Pa.length; )
            f = H(b), !y && 0 >= m(k, f) && (y = !0), (g = y && e < this.ja && 0 >= m(f, l)) ? e++ : d = d.Q(f.name, C);
        }
        return this.ra.Vb().ta(a, d, c);
      };
      h.da = function(a) {
        return a;
      };
      h.Ga = function() {
        return !0;
      };
      h.Vb = function() {
        return this.ra.Vb();
      };
      function td(a, b, c, d, e, f) {
        var g;
        if (a.Jb) {
          var k = ud(a.g);
          g = function(a, b) {
            return k(b, a);
          };
        } else
          g = ud(a.g);
        J(b.Db() == a.ja, "");
        var l = new E(c, d),
            m = a.Jb ? wd(b, a.g) : xd(b, a.g),
            v = a.ra.matches(l);
        if (b.Ha(c)) {
          var y = b.M(c),
              m = e.xe(a.g, m, a.Jb);
          null != m && m.name == c && (m = e.xe(a.g, m, a.Jb));
          e = null == m ? 1 : g(m, l);
          if (v && !d.e() && 0 <= e)
            return null != f && id(f, new D("child_changed", d, c, y)), b.Q(c, d);
          null != f && id(f, new D("child_removed", y, c));
          b = b.Q(c, C);
          return null != m && a.ra.matches(m) ? (null != f && id(f, new D("child_added", m.S, m.name)), b.Q(m.name, m.S)) : b;
        }
        return d.e() ? b : v && 0 <= g(m, l) ? (null != f && (id(f, new D("child_removed", m.S, m.name)), id(f, new D("child_added", d, c))), b.Q(c, d).Q(m.name, C)) : b;
      }
      ;
      function yd(a, b) {
        this.he = a;
        this.cg = b;
      }
      function zd(a) {
        this.I = a;
      }
      zd.prototype.bb = function(a, b, c, d) {
        var e = new hd,
            f;
        if (b.type === Vb)
          b.source.ve ? c = Ad(this, a, b.path, b.Ia, c, d, e) : (J(b.source.of, "Unknown source."), f = b.source.af, c = Bd(this, a, b.path, b.Ia, c, d, f, e));
        else if (b.type === Cd)
          b.source.ve ? c = Dd(this, a, b.path, b.children, c, d, e) : (J(b.source.of, "Unknown source."), f = b.source.af, c = Ed(this, a, b.path, b.children, c, d, f, e));
        else if (b.type === Xb)
          if (b.Ve)
            if (f = b.path, null != c.sc(f))
              c = a;
            else {
              b = new qb(c, a, d);
              d = a.D.j();
              if (f.e() || ".priority" === O(f))
                Hb(a.u()) ? b = c.ua(tb(a)) : (b = a.u().j(), J(b instanceof T, "serverChildren would be complete if leaf node"), b = c.xc(b)), b = this.I.ta(d, b, e);
              else {
                f = O(f);
                var g = c.Xa(f, a.u());
                null == g && rb(a.u(), f) && (g = d.M(f));
                b = null != g ? this.I.G(d, f, g, b, e) : a.D.j().Ha(f) ? this.I.G(d, f, C, b, e) : d;
                b.e() && Hb(a.u()) && (d = c.ua(tb(a)), d.N() && (b = this.I.ta(b, d, e)));
              }
              d = Hb(a.u()) || null != c.sc(F);
              c = Fd(a, b, d, this.I.Ga());
            }
          else
            c = Gd(this, a, b.path, c, d, e);
        else if (b.type === $b)
          d = b.path, b = a.u(), f = b.j(), g = b.$ || d.e(), c = Hd(this, new Id(a.D, new sb(f, g, b.Tb)), d, c, pb, e);
        else
          throw Hc("Unknown operation type: " + b.type);
        e = ra(e.eb);
        d = c;
        b = d.D;
        b.$ && (f = b.j().N() || b.j().e(), g = Jd(a), (0 < e.length || !a.D.$ || f && !b.j().Z(g) || !b.j().A().Z(g.A())) && e.push(Db(Jd(d))));
        return new yd(c, e);
      };
      function Hd(a, b, c, d, e, f) {
        var g = b.D;
        if (null != d.sc(c))
          return b;
        var k;
        if (c.e())
          J(Hb(b.u()), "If change path is empty, we must have complete server data"), b.u().Tb ? (e = tb(b), d = d.xc(e instanceof T ? e : C)) : d = d.ua(tb(b)), f = a.I.ta(b.D.j(), d, f);
        else {
          var l = O(c);
          if (".priority" == l)
            J(1 == uc(c), "Can't have a priority with additional path components"), f = g.j(), k = b.u().j(), d = d.hd(c, f, k), f = null != d ? a.I.da(f, d) : g.j();
          else {
            var m = G(c);
            rb(g, l) ? (k = b.u().j(), d = d.hd(c, g.j(), k), d = null != d ? g.j().M(l).G(m, d) : g.j().M(l)) : d = d.Xa(l, b.u());
            f = null != d ? a.I.G(g.j(), l, d, e, f) : g.j();
          }
        }
        return Fd(b, f, g.$ || c.e(), a.I.Ga());
      }
      function Bd(a, b, c, d, e, f, g, k) {
        var l = b.u();
        g = g ? a.I : a.I.Vb();
        if (c.e())
          d = g.ta(l.j(), d, null);
        else if (g.Ga() && !l.Tb)
          d = l.j().G(c, d), d = g.ta(l.j(), d, null);
        else {
          var m = O(c);
          if ((c.e() ? !l.$ || l.Tb : !rb(l, O(c))) && 1 < uc(c))
            return b;
          d = l.j().M(m).G(G(c), d);
          d = ".priority" == m ? g.da(l.j(), d) : g.G(l.j(), m, d, pb, null);
        }
        l = l.$ || c.e();
        b = new Id(b.D, new sb(d, l, g.Ga()));
        return Hd(a, b, c, e, new qb(e, b, f), k);
      }
      function Ad(a, b, c, d, e, f, g) {
        var k = b.D;
        e = new qb(e, b, f);
        if (c.e())
          g = a.I.ta(b.D.j(), d, g), a = Fd(b, g, !0, a.I.Ga());
        else if (f = O(c), ".priority" === f)
          g = a.I.da(b.D.j(), d), a = Fd(b, g, k.$, k.Tb);
        else {
          var l = G(c);
          c = k.j().M(f);
          if (!l.e()) {
            var m = e.pf(f);
            d = null != m ? ".priority" === vc(l) && m.oa(l.parent()).e() ? m : m.G(l, d) : C;
          }
          c.Z(d) ? a = b : (g = a.I.G(k.j(), f, d, e, g), a = Fd(b, g, k.$, a.I.Ga()));
        }
        return a;
      }
      function Dd(a, b, c, d, e, f, g) {
        var k = b;
        Kd(d, function(d, m) {
          var v = c.w(d);
          rb(b.D, O(v)) && (k = Ad(a, k, v, m, e, f, g));
        });
        Kd(d, function(d, m) {
          var v = c.w(d);
          rb(b.D, O(v)) || (k = Ad(a, k, v, m, e, f, g));
        });
        return k;
      }
      function Ld(a, b) {
        Kd(b, function(b, d) {
          a = a.G(b, d);
        });
        return a;
      }
      function Ed(a, b, c, d, e, f, g, k) {
        if (b.u().j().e() && !Hb(b.u()))
          return b;
        var l = b;
        c = c.e() ? d : Md(Nd, c, d);
        var m = b.u().j();
        c.children.ha(function(c, d) {
          if (m.Ha(c)) {
            var I = b.u().j().M(c),
                I = Ld(I, d);
            l = Bd(a, l, new K(c), I, e, f, g, k);
          }
        });
        c.children.ha(function(c, d) {
          var I = !Hb(b.u()) && null == d.value;
          m.Ha(c) || I || (I = b.u().j().M(c), I = Ld(I, d), l = Bd(a, l, new K(c), I, e, f, g, k));
        });
        return l;
      }
      function Gd(a, b, c, d, e, f) {
        if (null != d.sc(c))
          return b;
        var g = new qb(d, b, e),
            k = e = b.D.j();
        if (Hb(b.u())) {
          if (c.e())
            e = d.ua(tb(b)), k = a.I.ta(b.D.j(), e, f);
          else if (".priority" === O(c)) {
            var l = d.Xa(O(c), b.u());
            null == l || e.e() || e.A().Z(l) || (k = a.I.da(e, l));
          } else
            l = O(c), e = d.Xa(l, b.u()), null != e && (k = a.I.G(b.D.j(), l, e, g, f));
          e = !0;
        } else if (b.D.$ || c.e())
          k = e, e = b.D.j(), e.N() || e.U(M, function(c) {
            var e = d.Xa(c, b.u());
            null != e && (k = a.I.G(k, c, e, g, f));
          }), e = b.D.$;
        else {
          l = O(c);
          if (1 == uc(c) || rb(b.D, l))
            c = d.Xa(l, b.u()), null != c && (k = a.I.G(e, l, c, g, f));
          e = !1;
        }
        return Fd(b, k, e, a.I.Ga());
      }
      ;
      function Od() {}
      var Pd = {};
      function ud(a) {
        return q(a.compare, a);
      }
      Od.prototype.xd = function(a, b) {
        return 0 !== this.compare(new E("[MIN_NAME]", a), new E("[MIN_NAME]", b));
      };
      Od.prototype.Sc = function() {
        return Qd;
      };
      function Rd(a) {
        this.bc = a;
      }
      ma(Rd, Od);
      h = Rd.prototype;
      h.Hc = function(a) {
        return !a.M(this.bc).e();
      };
      h.compare = function(a, b) {
        var c = a.S.M(this.bc),
            d = b.S.M(this.bc),
            c = c.Cc(d);
        return 0 === c ? Sb(a.name, b.name) : c;
      };
      h.Oc = function(a, b) {
        var c = L(a),
            c = C.Q(this.bc, c);
        return new E(b, c);
      };
      h.Pc = function() {
        var a = C.Q(this.bc, Sd);
        return new E("[MAX_NAME]", a);
      };
      h.toString = function() {
        return this.bc;
      };
      function Td() {}
      ma(Td, Od);
      h = Td.prototype;
      h.compare = function(a, b) {
        var c = a.S.A(),
            d = b.S.A(),
            c = c.Cc(d);
        return 0 === c ? Sb(a.name, b.name) : c;
      };
      h.Hc = function(a) {
        return !a.A().e();
      };
      h.xd = function(a, b) {
        return !a.A().Z(b.A());
      };
      h.Sc = function() {
        return Qd;
      };
      h.Pc = function() {
        return new E("[MAX_NAME]", new tc("[PRIORITY-POST]", Sd));
      };
      h.Oc = function(a, b) {
        var c = L(a);
        return new E(b, new tc("[PRIORITY-POST]", c));
      };
      h.toString = function() {
        return ".priority";
      };
      var M = new Td;
      function Ud() {}
      ma(Ud, Od);
      h = Ud.prototype;
      h.compare = function(a, b) {
        return Sb(a.name, b.name);
      };
      h.Hc = function() {
        throw Hc("KeyIndex.isDefinedOn not expected to be called.");
      };
      h.xd = function() {
        return !1;
      };
      h.Sc = function() {
        return Qd;
      };
      h.Pc = function() {
        return new E("[MAX_NAME]", C);
      };
      h.Oc = function(a) {
        J(p(a), "KeyIndex indexValue must always be a string.");
        return new E(a, C);
      };
      h.toString = function() {
        return ".key";
      };
      var Vd = new Ud;
      function Wd() {}
      ma(Wd, Od);
      h = Wd.prototype;
      h.compare = function(a, b) {
        var c = a.S.Cc(b.S);
        return 0 === c ? Sb(a.name, b.name) : c;
      };
      h.Hc = function() {
        return !0;
      };
      h.xd = function(a, b) {
        return !a.Z(b);
      };
      h.Sc = function() {
        return Qd;
      };
      h.Pc = function() {
        return Xd;
      };
      h.Oc = function(a, b) {
        var c = L(a);
        return new E(b, c);
      };
      h.toString = function() {
        return ".value";
      };
      var Yd = new Wd;
      function Zd() {
        this.Rb = this.na = this.Lb = this.la = this.ia = !1;
        this.ja = 0;
        this.Nb = "";
        this.dc = null;
        this.xb = "";
        this.ac = null;
        this.vb = "";
        this.g = M;
      }
      var $d = new Zd;
      function sd(a) {
        return "" === a.Nb ? a.la : "l" === a.Nb;
      }
      function od(a) {
        J(a.la, "Only valid if start has been set");
        return a.dc;
      }
      function nd(a) {
        J(a.la, "Only valid if start has been set");
        return a.Lb ? a.xb : "[MIN_NAME]";
      }
      function qd(a) {
        J(a.na, "Only valid if end has been set");
        return a.ac;
      }
      function pd(a) {
        J(a.na, "Only valid if end has been set");
        return a.Rb ? a.vb : "[MAX_NAME]";
      }
      function ae(a) {
        var b = new Zd;
        b.ia = a.ia;
        b.ja = a.ja;
        b.la = a.la;
        b.dc = a.dc;
        b.Lb = a.Lb;
        b.xb = a.xb;
        b.na = a.na;
        b.ac = a.ac;
        b.Rb = a.Rb;
        b.vb = a.vb;
        b.g = a.g;
        return b;
      }
      h = Zd.prototype;
      h.Ge = function(a) {
        var b = ae(this);
        b.ia = !0;
        b.ja = a;
        b.Nb = "";
        return b;
      };
      h.He = function(a) {
        var b = ae(this);
        b.ia = !0;
        b.ja = a;
        b.Nb = "l";
        return b;
      };
      h.Ie = function(a) {
        var b = ae(this);
        b.ia = !0;
        b.ja = a;
        b.Nb = "r";
        return b;
      };
      h.Xd = function(a, b) {
        var c = ae(this);
        c.la = !0;
        n(a) || (a = null);
        c.dc = a;
        null != b ? (c.Lb = !0, c.xb = b) : (c.Lb = !1, c.xb = "");
        return c;
      };
      h.qd = function(a, b) {
        var c = ae(this);
        c.na = !0;
        n(a) || (a = null);
        c.ac = a;
        n(b) ? (c.Rb = !0, c.vb = b) : (c.Yg = !1, c.vb = "");
        return c;
      };
      function be(a, b) {
        var c = ae(a);
        c.g = b;
        return c;
      }
      function ce(a) {
        var b = {};
        a.la && (b.sp = a.dc, a.Lb && (b.sn = a.xb));
        a.na && (b.ep = a.ac, a.Rb && (b.en = a.vb));
        if (a.ia) {
          b.l = a.ja;
          var c = a.Nb;
          "" === c && (c = sd(a) ? "l" : "r");
          b.vf = c;
        }
        a.g !== M && (b.i = a.g.toString());
        return b;
      }
      function de(a) {
        return !(a.la || a.na || a.ia);
      }
      function ee(a) {
        var b = {};
        if (de(a) && a.g == M)
          return b;
        var c;
        a.g === M ? c = "$priority" : a.g === Yd ? c = "$value" : a.g === Vd ? c = "$key" : (J(a.g instanceof Rd, "Unrecognized index type!"), c = a.g.toString());
        b.orderBy = B(c);
        a.la && (b.startAt = B(a.dc), a.Lb && (b.startAt += "," + B(a.xb)));
        a.na && (b.endAt = B(a.ac), a.Rb && (b.endAt += "," + B(a.vb)));
        a.ia && (sd(a) ? b.limitToFirst = a.ja : b.limitToLast = a.ja);
        return b;
      }
      h.toString = function() {
        return B(ce(this));
      };
      function fe(a, b) {
        this.yd = a;
        this.cc = b;
      }
      fe.prototype.get = function(a) {
        var b = w(this.yd, a);
        if (!b)
          throw Error("No index defined for " + a);
        return b === Pd ? null : b;
      };
      function ge(a, b, c) {
        var d = na(a.yd, function(d, f) {
          var g = w(a.cc, f);
          J(g, "Missing index implementation for " + f);
          if (d === Pd) {
            if (g.Hc(b.S)) {
              for (var k = [],
                  l = c.Wb(Qb),
                  m = H(l); m; )
                m.name != b.name && k.push(m), m = H(l);
              k.push(b);
              return he(k, ud(g));
            }
            return Pd;
          }
          g = c.get(b.name);
          k = d;
          g && (k = k.remove(new E(b.name, g)));
          return k.Na(b, b.S);
        });
        return new fe(d, a.cc);
      }
      function ie(a, b, c) {
        var d = na(a.yd, function(a) {
          if (a === Pd)
            return a;
          var d = c.get(b.name);
          return d ? a.remove(new E(b.name, d)) : a;
        });
        return new fe(d, a.cc);
      }
      var je = new fe({".priority": Pd}, {".priority": M});
      function tc(a, b) {
        this.C = a;
        J(n(this.C) && null !== this.C, "LeafNode shouldn't be created with null/undefined value.");
        this.ba = b || C;
        ke(this.ba);
        this.Bb = null;
      }
      h = tc.prototype;
      h.N = function() {
        return !0;
      };
      h.A = function() {
        return this.ba;
      };
      h.da = function(a) {
        return new tc(this.C, a);
      };
      h.M = function(a) {
        return ".priority" === a ? this.ba : C;
      };
      h.oa = function(a) {
        return a.e() ? this : ".priority" === O(a) ? this.ba : C;
      };
      h.Ha = function() {
        return !1;
      };
      h.qf = function() {
        return null;
      };
      h.Q = function(a, b) {
        return ".priority" === a ? this.da(b) : b.e() && ".priority" !== a ? this : C.Q(a, b).da(this.ba);
      };
      h.G = function(a, b) {
        var c = O(a);
        if (null === c)
          return b;
        if (b.e() && ".priority" !== c)
          return this;
        J(".priority" !== c || 1 === uc(a), ".priority must be the last token in a path");
        return this.Q(c, C.G(G(a), b));
      };
      h.e = function() {
        return !1;
      };
      h.Db = function() {
        return 0;
      };
      h.K = function(a) {
        return a && !this.A().e() ? {
          ".value": this.Ba(),
          ".priority": this.A().K()
        } : this.Ba();
      };
      h.hash = function() {
        if (null === this.Bb) {
          var a = "";
          this.ba.e() || (a += "priority:" + le(this.ba.K()) + ":");
          var b = typeof this.C,
              a = a + (b + ":"),
              a = "number" === b ? a + Zc(this.C) : a + this.C;
          this.Bb = Jc(a);
        }
        return this.Bb;
      };
      h.Ba = function() {
        return this.C;
      };
      h.Cc = function(a) {
        if (a === C)
          return 1;
        if (a instanceof T)
          return -1;
        J(a.N(), "Unknown node type");
        var b = typeof a.C,
            c = typeof this.C,
            d = Na(me, b),
            e = Na(me, c);
        J(0 <= d, "Unknown leaf type: " + b);
        J(0 <= e, "Unknown leaf type: " + c);
        return d === e ? "object" === c ? 0 : this.C < a.C ? -1 : this.C === a.C ? 0 : 1 : e - d;
      };
      var me = ["object", "boolean", "number", "string"];
      tc.prototype.mb = function() {
        return this;
      };
      tc.prototype.Ic = function() {
        return !0;
      };
      tc.prototype.Z = function(a) {
        return a === this ? !0 : a.N() ? this.C === a.C && this.ba.Z(a.ba) : !1;
      };
      tc.prototype.toString = function() {
        return B(this.K(!0));
      };
      function T(a, b, c) {
        this.m = a;
        (this.ba = b) && ke(this.ba);
        a.e() && J(!this.ba || this.ba.e(), "An empty node cannot have a priority");
        this.wb = c;
        this.Bb = null;
      }
      h = T.prototype;
      h.N = function() {
        return !1;
      };
      h.A = function() {
        return this.ba || C;
      };
      h.da = function(a) {
        return this.m.e() ? this : new T(this.m, a, this.wb);
      };
      h.M = function(a) {
        if (".priority" === a)
          return this.A();
        a = this.m.get(a);
        return null === a ? C : a;
      };
      h.oa = function(a) {
        var b = O(a);
        return null === b ? this : this.M(b).oa(G(a));
      };
      h.Ha = function(a) {
        return null !== this.m.get(a);
      };
      h.Q = function(a, b) {
        J(b, "We should always be passing snapshot nodes");
        if (".priority" === a)
          return this.da(b);
        var c = new E(a, b),
            d,
            e;
        b.e() ? (d = this.m.remove(a), c = ie(this.wb, c, this.m)) : (d = this.m.Na(a, b), c = ge(this.wb, c, this.m));
        e = d.e() ? C : this.ba;
        return new T(d, e, c);
      };
      h.G = function(a, b) {
        var c = O(a);
        if (null === c)
          return b;
        J(".priority" !== O(a) || 1 === uc(a), ".priority must be the last token in a path");
        var d = this.M(c).G(G(a), b);
        return this.Q(c, d);
      };
      h.e = function() {
        return this.m.e();
      };
      h.Db = function() {
        return this.m.count();
      };
      var ne = /^(0|[1-9]\d*)$/;
      h = T.prototype;
      h.K = function(a) {
        if (this.e())
          return null;
        var b = {},
            c = 0,
            d = 0,
            e = !0;
        this.U(M, function(f, g) {
          b[f] = g.K(a);
          c++;
          e && ne.test(f) ? d = Math.max(d, Number(f)) : e = !1;
        });
        if (!a && e && d < 2 * c) {
          var f = [],
              g;
          for (g in b)
            f[g] = b[g];
          return f;
        }
        a && !this.A().e() && (b[".priority"] = this.A().K());
        return b;
      };
      h.hash = function() {
        if (null === this.Bb) {
          var a = "";
          this.A().e() || (a += "priority:" + le(this.A().K()) + ":");
          this.U(M, function(b, c) {
            var d = c.hash();
            "" !== d && (a += ":" + b + ":" + d);
          });
          this.Bb = "" === a ? "" : Jc(a);
        }
        return this.Bb;
      };
      h.qf = function(a, b, c) {
        return (c = oe(this, c)) ? (a = cc(c, new E(a, b))) ? a.name : null : cc(this.m, a);
      };
      function wd(a, b) {
        var c;
        c = (c = oe(a, b)) ? (c = c.Rc()) && c.name : a.m.Rc();
        return c ? new E(c, a.m.get(c)) : null;
      }
      function xd(a, b) {
        var c;
        c = (c = oe(a, b)) ? (c = c.ec()) && c.name : a.m.ec();
        return c ? new E(c, a.m.get(c)) : null;
      }
      h.U = function(a, b) {
        var c = oe(this, a);
        return c ? c.ha(function(a) {
          return b(a.name, a.S);
        }) : this.m.ha(b);
      };
      h.Wb = function(a) {
        return this.Xb(a.Sc(), a);
      };
      h.Xb = function(a, b) {
        var c = oe(this, b);
        if (c)
          return c.Xb(a, function(a) {
            return a;
          });
        for (var c = this.m.Xb(a.name, Qb),
            d = ec(c); null != d && 0 > b.compare(d, a); )
          H(c), d = ec(c);
        return c;
      };
      h.rf = function(a) {
        return this.Zb(a.Pc(), a);
      };
      h.Zb = function(a, b) {
        var c = oe(this, b);
        if (c)
          return c.Zb(a, function(a) {
            return a;
          });
        for (var c = this.m.Zb(a.name, Qb),
            d = ec(c); null != d && 0 < b.compare(d, a); )
          H(c), d = ec(c);
        return c;
      };
      h.Cc = function(a) {
        return this.e() ? a.e() ? 0 : -1 : a.N() || a.e() ? 1 : a === Sd ? -1 : 0;
      };
      h.mb = function(a) {
        if (a === Vd || ta(this.wb.cc, a.toString()))
          return this;
        var b = this.wb,
            c = this.m;
        J(a !== Vd, "KeyIndex always exists and isn't meant to be added to the IndexMap.");
        for (var d = [],
            e = !1,
            c = c.Wb(Qb),
            f = H(c); f; )
          e = e || a.Hc(f.S), d.push(f), f = H(c);
        d = e ? he(d, ud(a)) : Pd;
        e = a.toString();
        c = xa(b.cc);
        c[e] = a;
        a = xa(b.yd);
        a[e] = d;
        return new T(this.m, this.ba, new fe(a, c));
      };
      h.Ic = function(a) {
        return a === Vd || ta(this.wb.cc, a.toString());
      };
      h.Z = function(a) {
        if (a === this)
          return !0;
        if (a.N())
          return !1;
        if (this.A().Z(a.A()) && this.m.count() === a.m.count()) {
          var b = this.Wb(M);
          a = a.Wb(M);
          for (var c = H(b),
              d = H(a); c && d; ) {
            if (c.name !== d.name || !c.S.Z(d.S))
              return !1;
            c = H(b);
            d = H(a);
          }
          return null === c && null === d;
        }
        return !1;
      };
      function oe(a, b) {
        return b === Vd ? null : a.wb.get(b.toString());
      }
      h.toString = function() {
        return B(this.K(!0));
      };
      function L(a, b) {
        if (null === a)
          return C;
        var c = null;
        "object" === typeof a && ".priority" in a ? c = a[".priority"] : "undefined" !== typeof b && (c = b);
        J(null === c || "string" === typeof c || "number" === typeof c || "object" === typeof c && ".sv" in c, "Invalid priority type found: " + typeof c);
        "object" === typeof a && ".value" in a && null !== a[".value"] && (a = a[".value"]);
        if ("object" !== typeof a || ".sv" in a)
          return new tc(a, L(c));
        if (a instanceof Array) {
          var d = C,
              e = a;
          r(e, function(a, b) {
            if (u(e, b) && "." !== b.substring(0, 1)) {
              var c = L(a);
              if (c.N() || !c.e())
                d = d.Q(b, c);
            }
          });
          return d.da(L(c));
        }
        var f = [],
            g = !1,
            k = a;
        hb(k, function(a) {
          if ("string" !== typeof a || "." !== a.substring(0, 1)) {
            var b = L(k[a]);
            b.e() || (g = g || !b.A().e(), f.push(new E(a, b)));
          }
        });
        if (0 == f.length)
          return C;
        var l = he(f, Rb, function(a) {
          return a.name;
        }, Tb);
        if (g) {
          var m = he(f, ud(M));
          return new T(l, L(c), new fe({".priority": m}, {".priority": M}));
        }
        return new T(l, L(c), je);
      }
      var pe = Math.log(2);
      function qe(a) {
        this.count = parseInt(Math.log(a + 1) / pe, 10);
        this.hf = this.count - 1;
        this.bg = a + 1 & parseInt(Array(this.count + 1).join("1"), 2);
      }
      function re(a) {
        var b = !(a.bg & 1 << a.hf);
        a.hf--;
        return b;
      }
      function he(a, b, c, d) {
        function e(b, d) {
          var f = d - b;
          if (0 == f)
            return null;
          if (1 == f) {
            var m = a[b],
                v = c ? c(m) : m;
            return new fc(v, m.S, !1, null, null);
          }
          var m = parseInt(f / 2, 10) + b,
              f = e(b, m),
              y = e(m + 1, d),
              m = a[m],
              v = c ? c(m) : m;
          return new fc(v, m.S, !1, f, y);
        }
        a.sort(b);
        var f = function(b) {
          function d(b, g) {
            var k = v - b,
                y = v;
            v -= b;
            var y = e(k + 1, y),
                k = a[k],
                I = c ? c(k) : k,
                y = new fc(I, k.S, g, null, y);
            f ? f.left = y : m = y;
            f = y;
          }
          for (var f = null,
              m = null,
              v = a.length,
              y = 0; y < b.count; ++y) {
            var I = re(b),
                vd = Math.pow(2, b.count - (y + 1));
            I ? d(vd, !1) : (d(vd, !1), d(vd, !0));
          }
          return m;
        }(new qe(a.length));
        return null !== f ? new ac(d || b, f) : new ac(d || b);
      }
      function le(a) {
        return "number" === typeof a ? "number:" + Zc(a) : "string:" + a;
      }
      function ke(a) {
        if (a.N()) {
          var b = a.K();
          J("string" === typeof b || "number" === typeof b || "object" === typeof b && u(b, ".sv"), "Priority must be a string or number.");
        } else
          J(a === Sd || a.e(), "priority of unexpected type.");
        J(a === Sd || a.A().e(), "Priority nodes can't have a priority of their own.");
      }
      var C = new T(new ac(Tb), null, je);
      function se() {
        T.call(this, new ac(Tb), C, je);
      }
      ma(se, T);
      h = se.prototype;
      h.Cc = function(a) {
        return a === this ? 0 : 1;
      };
      h.Z = function(a) {
        return a === this;
      };
      h.A = function() {
        return this;
      };
      h.M = function() {
        return C;
      };
      h.e = function() {
        return !1;
      };
      var Sd = new se,
          Qd = new E("[MIN_NAME]", C),
          Xd = new E("[MAX_NAME]", Sd);
      function Id(a, b) {
        this.D = a;
        this.Ud = b;
      }
      function Fd(a, b, c, d) {
        return new Id(new sb(b, c, d), a.Ud);
      }
      function Jd(a) {
        return a.D.$ ? a.D.j() : null;
      }
      Id.prototype.u = function() {
        return this.Ud;
      };
      function tb(a) {
        return a.Ud.$ ? a.Ud.j() : null;
      }
      ;
      function te(a, b) {
        this.V = a;
        var c = a.o,
            d = new ld(c.g),
            c = de(c) ? new ld(c.g) : c.ia ? new rd(c) : new md(c);
        this.Gf = new zd(c);
        var e = b.u(),
            f = b.D,
            g = d.ta(C, e.j(), null),
            k = c.ta(C, f.j(), null);
        this.Ka = new Id(new sb(k, f.$, c.Ga()), new sb(g, e.$, d.Ga()));
        this.Za = [];
        this.ig = new dd(a);
      }
      function ue(a) {
        return a.V;
      }
      h = te.prototype;
      h.u = function() {
        return this.Ka.u().j();
      };
      h.hb = function(a) {
        var b = tb(this.Ka);
        return b && (de(this.V.o) || !a.e() && !b.M(O(a)).e()) ? b.oa(a) : null;
      };
      h.e = function() {
        return 0 === this.Za.length;
      };
      h.Ob = function(a) {
        this.Za.push(a);
      };
      h.kb = function(a, b) {
        var c = [];
        if (b) {
          J(null == a, "A cancel should cancel all event registrations.");
          var d = this.V.path;
          Oa(this.Za, function(a) {
            (a = a.ff(b, d)) && c.push(a);
          });
        }
        if (a) {
          for (var e = [],
              f = 0; f < this.Za.length; ++f) {
            var g = this.Za[f];
            if (!g.matches(a))
              e.push(g);
            else if (a.sf()) {
              e = e.concat(this.Za.slice(f + 1));
              break;
            }
          }
          this.Za = e;
        } else
          this.Za = [];
        return c;
      };
      h.bb = function(a, b, c) {
        a.type === Cd && null !== a.source.Ib && (J(tb(this.Ka), "We should always have a full cache before handling merges"), J(Jd(this.Ka), "Missing event cache, even though we have a server cache"));
        var d = this.Ka;
        a = this.Gf.bb(d, a, b, c);
        b = this.Gf;
        c = a.he;
        J(c.D.j().Ic(b.I.g), "Event snap not indexed");
        J(c.u().j().Ic(b.I.g), "Server snap not indexed");
        J(Hb(a.he.u()) || !Hb(d.u()), "Once a server snap is complete, it should never go back");
        this.Ka = a.he;
        return ve(this, a.cg, a.he.D.j(), null);
      };
      function we(a, b) {
        var c = a.Ka.D,
            d = [];
        c.j().N() || c.j().U(M, function(a, b) {
          d.push(new D("child_added", b, a));
        });
        c.$ && d.push(Db(c.j()));
        return ve(a, d, c.j(), b);
      }
      function ve(a, b, c, d) {
        return ed(a.ig, b, c, d ? [d] : a.Za);
      }
      ;
      function xe(a, b, c) {
        this.type = Cd;
        this.source = a;
        this.path = b;
        this.children = c;
      }
      xe.prototype.Wc = function(a) {
        if (this.path.e())
          return a = this.children.subtree(new K(a)), a.e() ? null : a.value ? new Ub(this.source, F, a.value) : new xe(this.source, F, a);
        J(O(this.path) === a, "Can't get a merge for a child not on the path of the operation");
        return new xe(this.source, G(this.path), this.children);
      };
      xe.prototype.toString = function() {
        return "Operation(" + this.path + ": " + this.source.toString() + " merge: " + this.children.toString() + ")";
      };
      var Vb = 0,
          Cd = 1,
          Xb = 2,
          $b = 3;
      function ye(a, b, c, d) {
        this.ve = a;
        this.of = b;
        this.Ib = c;
        this.af = d;
        J(!d || b, "Tagged queries must be from server.");
      }
      var Yb = new ye(!0, !1, null, !1),
          ze = new ye(!1, !0, null, !1);
      ye.prototype.toString = function() {
        return this.ve ? "user" : this.af ? "server(queryID=" + this.Ib + ")" : "server";
      };
      function Ae(a, b) {
        this.f = Oc("p:rest:");
        this.H = a;
        this.Gb = b;
        this.Fa = null;
        this.aa = {};
      }
      function Be(a, b) {
        if (n(b))
          return "tag$" + b;
        var c = a.o;
        J(de(c) && c.g == M, "should have a tag if it's not a default query.");
        return a.path.toString();
      }
      h = Ae.prototype;
      h.xf = function(a, b, c, d) {
        var e = a.path.toString();
        this.f("Listen called for " + e + " " + a.wa());
        var f = Be(a, c),
            g = {};
        this.aa[f] = g;
        a = ee(a.o);
        var k = this;
        Ce(this, e + ".json", a, function(a, b) {
          var v = b;
          404 === a && (a = v = null);
          null === a && k.Gb(e, v, !1, c);
          w(k.aa, f) === g && d(a ? 401 == a ? "permission_denied" : "rest_error:" + a : "ok", null);
        });
      };
      h.Of = function(a, b) {
        var c = Be(a, b);
        delete this.aa[c];
      };
      h.P = function(a, b) {
        this.Fa = a;
        var c = ad(a),
            d = c.data,
            c = c.Ac && c.Ac.exp;
        b && b("ok", {
          auth: d,
          expires: c
        });
      };
      h.ee = function(a) {
        this.Fa = null;
        a("ok", null);
      };
      h.Le = function() {};
      h.Bf = function() {};
      h.Gd = function() {};
      h.put = function() {};
      h.yf = function() {};
      h.Te = function() {};
      function Ce(a, b, c, d) {
        c = c || {};
        c.format = "export";
        a.Fa && (c.auth = a.Fa);
        var e = (a.H.lb ? "https://" : "http://") + a.H.host + b + "?" + jb(c);
        a.f("Sending REST request for " + e);
        var f = new XMLHttpRequest;
        f.onreadystatechange = function() {
          if (d && 4 === f.readyState) {
            a.f("REST Response for " + e + " received. status:", f.status, "response:", f.responseText);
            var b = null;
            if (200 <= f.status && 300 > f.status) {
              try {
                b = mb(f.responseText);
              } catch (c) {
                Q("Failed to parse JSON response for " + e + ": " + f.responseText);
              }
              d(null, b);
            } else
              401 !== f.status && 404 !== f.status && Q("Got unsuccessful REST response for " + e + " Status: " + f.status), d(f.status);
            d = null;
          }
        };
        f.open("GET", e, !0);
        f.send();
      }
      ;
      function De(a, b) {
        this.value = a;
        this.children = b || Ee;
      }
      var Ee = new ac(function(a, b) {
        return a === b ? 0 : a < b ? -1 : 1;
      });
      function Fe(a) {
        var b = Nd;
        r(a, function(a, d) {
          b = b.set(new K(d), a);
        });
        return b;
      }
      h = De.prototype;
      h.e = function() {
        return null === this.value && this.children.e();
      };
      function Ge(a, b, c) {
        if (null != a.value && c(a.value))
          return {
            path: F,
            value: a.value
          };
        if (b.e())
          return null;
        var d = O(b);
        a = a.children.get(d);
        return null !== a ? (b = Ge(a, G(b), c), null != b ? {
          path: (new K(d)).w(b.path),
          value: b.value
        } : null) : null;
      }
      function He(a, b) {
        return Ge(a, b, function() {
          return !0;
        });
      }
      h.subtree = function(a) {
        if (a.e())
          return this;
        var b = this.children.get(O(a));
        return null !== b ? b.subtree(G(a)) : Nd;
      };
      h.set = function(a, b) {
        if (a.e())
          return new De(b, this.children);
        var c = O(a),
            d = (this.children.get(c) || Nd).set(G(a), b),
            c = this.children.Na(c, d);
        return new De(this.value, c);
      };
      h.remove = function(a) {
        if (a.e())
          return this.children.e() ? Nd : new De(null, this.children);
        var b = O(a),
            c = this.children.get(b);
        return c ? (a = c.remove(G(a)), b = a.e() ? this.children.remove(b) : this.children.Na(b, a), null === this.value && b.e() ? Nd : new De(this.value, b)) : this;
      };
      h.get = function(a) {
        if (a.e())
          return this.value;
        var b = this.children.get(O(a));
        return b ? b.get(G(a)) : null;
      };
      function Md(a, b, c) {
        if (b.e())
          return c;
        var d = O(b);
        b = Md(a.children.get(d) || Nd, G(b), c);
        d = b.e() ? a.children.remove(d) : a.children.Na(d, b);
        return new De(a.value, d);
      }
      function Ie(a, b) {
        return Je(a, F, b);
      }
      function Je(a, b, c) {
        var d = {};
        a.children.ha(function(a, f) {
          d[a] = Je(f, b.w(a), c);
        });
        return c(b, a.value, d);
      }
      function Ke(a, b, c) {
        return Le(a, b, F, c);
      }
      function Le(a, b, c, d) {
        var e = a.value ? d(c, a.value) : !1;
        if (e)
          return e;
        if (b.e())
          return null;
        e = O(b);
        return (a = a.children.get(e)) ? Le(a, G(b), c.w(e), d) : null;
      }
      function Me(a, b, c) {
        var d = F;
        if (!b.e()) {
          var e = !0;
          a.value && (e = c(d, a.value));
          !0 === e && (e = O(b), (a = a.children.get(e)) && Ne(a, G(b), d.w(e), c));
        }
      }
      function Ne(a, b, c, d) {
        if (b.e())
          return a;
        a.value && d(c, a.value);
        var e = O(b);
        return (a = a.children.get(e)) ? Ne(a, G(b), c.w(e), d) : Nd;
      }
      function Kd(a, b) {
        Oe(a, F, b);
      }
      function Oe(a, b, c) {
        a.children.ha(function(a, e) {
          Oe(e, b.w(a), c);
        });
        a.value && c(b, a.value);
      }
      function Pe(a, b) {
        a.children.ha(function(a, d) {
          d.value && b(a, d.value);
        });
      }
      var Nd = new De(null);
      De.prototype.toString = function() {
        var a = {};
        Kd(this, function(b, c) {
          a[b.toString()] = c.toString();
        });
        return B(a);
      };
      function Qe(a) {
        this.W = a;
      }
      var Re = new Qe(new De(null));
      function Se(a, b, c) {
        if (b.e())
          return new Qe(new De(c));
        var d = He(a.W, b);
        if (null != d) {
          var e = d.path,
              d = d.value;
          b = N(e, b);
          d = d.G(b, c);
          return new Qe(a.W.set(e, d));
        }
        a = Md(a.W, b, new De(c));
        return new Qe(a);
      }
      function Te(a, b, c) {
        var d = a;
        hb(c, function(a, c) {
          d = Se(d, b.w(a), c);
        });
        return d;
      }
      Qe.prototype.Od = function(a) {
        if (a.e())
          return Re;
        a = Md(this.W, a, Nd);
        return new Qe(a);
      };
      function Ue(a, b) {
        var c = He(a.W, b);
        return null != c ? a.W.get(c.path).oa(N(c.path, b)) : null;
      }
      function Ve(a) {
        var b = [],
            c = a.W.value;
        null != c ? c.N() || c.U(M, function(a, c) {
          b.push(new E(a, c));
        }) : a.W.children.ha(function(a, c) {
          null != c.value && b.push(new E(a, c.value));
        });
        return b;
      }
      function We(a, b) {
        if (b.e())
          return a;
        var c = Ue(a, b);
        return null != c ? new Qe(new De(c)) : new Qe(a.W.subtree(b));
      }
      Qe.prototype.e = function() {
        return this.W.e();
      };
      Qe.prototype.apply = function(a) {
        return Xe(F, this.W, a);
      };
      function Xe(a, b, c) {
        if (null != b.value)
          return c.G(a, b.value);
        var d = null;
        b.children.ha(function(b, f) {
          ".priority" === b ? (J(null !== f.value, "Priority writes must always be leaf nodes"), d = f.value) : c = Xe(a.w(b), f, c);
        });
        c.oa(a).e() || null === d || (c = c.G(a.w(".priority"), d));
        return c;
      }
      ;
      function Ye() {
        this.T = Re;
        this.za = [];
        this.Lc = -1;
      }
      h = Ye.prototype;
      h.Od = function(a) {
        var b = Ua(this.za, function(b) {
          return b.ie === a;
        });
        J(0 <= b, "removeWrite called with nonexistent writeId.");
        var c = this.za[b];
        this.za.splice(b, 1);
        for (var d = c.visible,
            e = !1,
            f = this.za.length - 1; d && 0 <= f; ) {
          var g = this.za[f];
          g.visible && (f >= b && Ze(g, c.path) ? d = !1 : c.path.contains(g.path) && (e = !0));
          f--;
        }
        if (d) {
          if (e)
            this.T = $e(this.za, af, F), this.Lc = 0 < this.za.length ? this.za[this.za.length - 1].ie : -1;
          else if (c.Ia)
            this.T = this.T.Od(c.path);
          else {
            var k = this;
            r(c.children, function(a, b) {
              k.T = k.T.Od(c.path.w(b));
            });
          }
          return c.path;
        }
        return null;
      };
      h.ua = function(a, b, c, d) {
        if (c || d) {
          var e = We(this.T, a);
          return !d && e.e() ? b : d || null != b || null != Ue(e, F) ? (e = $e(this.za, function(b) {
            return (b.visible || d) && (!c || !(0 <= Na(c, b.ie))) && (b.path.contains(a) || a.contains(b.path));
          }, a), b = b || C, e.apply(b)) : null;
        }
        e = Ue(this.T, a);
        if (null != e)
          return e;
        e = We(this.T, a);
        return e.e() ? b : null != b || null != Ue(e, F) ? (b = b || C, e.apply(b)) : null;
      };
      h.xc = function(a, b) {
        var c = C,
            d = Ue(this.T, a);
        if (d)
          d.N() || d.U(M, function(a, b) {
            c = c.Q(a, b);
          });
        else if (b) {
          var e = We(this.T, a);
          b.U(M, function(a, b) {
            var d = We(e, new K(a)).apply(b);
            c = c.Q(a, d);
          });
          Oa(Ve(e), function(a) {
            c = c.Q(a.name, a.S);
          });
        } else
          e = We(this.T, a), Oa(Ve(e), function(a) {
            c = c.Q(a.name, a.S);
          });
        return c;
      };
      h.hd = function(a, b, c, d) {
        J(c || d, "Either existingEventSnap or existingServerSnap must exist");
        a = a.w(b);
        if (null != Ue(this.T, a))
          return null;
        a = We(this.T, a);
        return a.e() ? d.oa(b) : a.apply(d.oa(b));
      };
      h.Xa = function(a, b, c) {
        a = a.w(b);
        var d = Ue(this.T, a);
        return null != d ? d : rb(c, b) ? We(this.T, a).apply(c.j().M(b)) : null;
      };
      h.sc = function(a) {
        return Ue(this.T, a);
      };
      h.me = function(a, b, c, d, e, f) {
        var g;
        a = We(this.T, a);
        g = Ue(a, F);
        if (null == g)
          if (null != b)
            g = a.apply(b);
          else
            return [];
        g = g.mb(f);
        if (g.e() || g.N())
          return [];
        b = [];
        a = ud(f);
        e = e ? g.Zb(c, f) : g.Xb(c, f);
        for (f = H(e); f && b.length < d; )
          0 !== a(f, c) && b.push(f), f = H(e);
        return b;
      };
      function Ze(a, b) {
        return a.Ia ? a.path.contains(b) : !!ua(a.children, function(c, d) {
          return a.path.w(d).contains(b);
        });
      }
      function af(a) {
        return a.visible;
      }
      function $e(a, b, c) {
        for (var d = Re,
            e = 0; e < a.length; ++e) {
          var f = a[e];
          if (b(f)) {
            var g = f.path;
            if (f.Ia)
              c.contains(g) ? (g = N(c, g), d = Se(d, g, f.Ia)) : g.contains(c) && (g = N(g, c), d = Se(d, F, f.Ia.oa(g)));
            else if (f.children)
              if (c.contains(g))
                g = N(c, g), d = Te(d, g, f.children);
              else {
                if (g.contains(c))
                  if (g = N(g, c), g.e())
                    d = Te(d, F, f.children);
                  else if (f = w(f.children, O(g)))
                    f = f.oa(G(g)), d = Se(d, F, f);
              }
            else
              throw Hc("WriteRecord should have .snap or .children");
          }
        }
        return d;
      }
      function bf(a, b) {
        this.Mb = a;
        this.W = b;
      }
      h = bf.prototype;
      h.ua = function(a, b, c) {
        return this.W.ua(this.Mb, a, b, c);
      };
      h.xc = function(a) {
        return this.W.xc(this.Mb, a);
      };
      h.hd = function(a, b, c) {
        return this.W.hd(this.Mb, a, b, c);
      };
      h.sc = function(a) {
        return this.W.sc(this.Mb.w(a));
      };
      h.me = function(a, b, c, d, e) {
        return this.W.me(this.Mb, a, b, c, d, e);
      };
      h.Xa = function(a, b) {
        return this.W.Xa(this.Mb, a, b);
      };
      h.w = function(a) {
        return new bf(this.Mb.w(a), this.W);
      };
      function cf() {
        this.ya = {};
      }
      h = cf.prototype;
      h.e = function() {
        return wa(this.ya);
      };
      h.bb = function(a, b, c) {
        var d = a.source.Ib;
        if (null !== d)
          return d = w(this.ya, d), J(null != d, "SyncTree gave us an op for an invalid query."), d.bb(a, b, c);
        var e = [];
        r(this.ya, function(d) {
          e = e.concat(d.bb(a, b, c));
        });
        return e;
      };
      h.Ob = function(a, b, c, d, e) {
        var f = a.wa(),
            g = w(this.ya, f);
        if (!g) {
          var g = c.ua(e ? d : null),
              k = !1;
          g ? k = !0 : (g = d instanceof T ? c.xc(d) : C, k = !1);
          g = new te(a, new Id(new sb(g, k, !1), new sb(d, e, !1)));
          this.ya[f] = g;
        }
        g.Ob(b);
        return we(g, b);
      };
      h.kb = function(a, b, c) {
        var d = a.wa(),
            e = [],
            f = [],
            g = null != df(this);
        if ("default" === d) {
          var k = this;
          r(this.ya, function(a, d) {
            f = f.concat(a.kb(b, c));
            a.e() && (delete k.ya[d], de(a.V.o) || e.push(a.V));
          });
        } else {
          var l = w(this.ya, d);
          l && (f = f.concat(l.kb(b, c)), l.e() && (delete this.ya[d], de(l.V.o) || e.push(l.V)));
        }
        g && null == df(this) && e.push(new U(a.k, a.path));
        return {
          Hg: e,
          jg: f
        };
      };
      function ef(a) {
        return Pa(ra(a.ya), function(a) {
          return !de(a.V.o);
        });
      }
      h.hb = function(a) {
        var b = null;
        r(this.ya, function(c) {
          b = b || c.hb(a);
        });
        return b;
      };
      function ff(a, b) {
        if (de(b.o))
          return df(a);
        var c = b.wa();
        return w(a.ya, c);
      }
      function df(a) {
        return va(a.ya, function(a) {
          return de(a.V.o);
        }) || null;
      }
      ;
      function gf(a) {
        this.sa = Nd;
        this.Hb = new Ye;
        this.$e = {};
        this.kc = {};
        this.Mc = a;
      }
      function hf(a, b, c, d, e) {
        var f = a.Hb,
            g = e;
        J(d > f.Lc, "Stacking an older write on top of newer ones");
        n(g) || (g = !0);
        f.za.push({
          path: b,
          Ia: c,
          ie: d,
          visible: g
        });
        g && (f.T = Se(f.T, b, c));
        f.Lc = d;
        return e ? jf(a, new Ub(Yb, b, c)) : [];
      }
      function kf(a, b, c, d) {
        var e = a.Hb;
        J(d > e.Lc, "Stacking an older merge on top of newer ones");
        e.za.push({
          path: b,
          children: c,
          ie: d,
          visible: !0
        });
        e.T = Te(e.T, b, c);
        e.Lc = d;
        c = Fe(c);
        return jf(a, new xe(Yb, b, c));
      }
      function lf(a, b, c) {
        c = c || !1;
        b = a.Hb.Od(b);
        return null == b ? [] : jf(a, new Wb(b, c));
      }
      function mf(a, b, c) {
        c = Fe(c);
        return jf(a, new xe(ze, b, c));
      }
      function nf(a, b, c, d) {
        d = of(a, d);
        if (null != d) {
          var e = pf(d);
          d = e.path;
          e = e.Ib;
          b = N(d, b);
          c = new Ub(new ye(!1, !0, e, !0), b, c);
          return qf(a, d, c);
        }
        return [];
      }
      function rf(a, b, c, d) {
        if (d = of(a, d)) {
          var e = pf(d);
          d = e.path;
          e = e.Ib;
          b = N(d, b);
          c = Fe(c);
          c = new xe(new ye(!1, !0, e, !0), b, c);
          return qf(a, d, c);
        }
        return [];
      }
      gf.prototype.Ob = function(a, b) {
        var c = a.path,
            d = null,
            e = !1;
        Me(this.sa, c, function(a, b) {
          var f = N(a, c);
          d = b.hb(f);
          e = e || null != df(b);
          return !d;
        });
        var f = this.sa.get(c);
        f ? (e = e || null != df(f), d = d || f.hb(F)) : (f = new cf, this.sa = this.sa.set(c, f));
        var g;
        null != d ? g = !0 : (g = !1, d = C, Pe(this.sa.subtree(c), function(a, b) {
          var c = b.hb(F);
          c && (d = d.Q(a, c));
        }));
        var k = null != ff(f, a);
        if (!k && !de(a.o)) {
          var l = sf(a);
          J(!(l in this.kc), "View does not exist, but we have a tag");
          var m = tf++;
          this.kc[l] = m;
          this.$e["_" + m] = l;
        }
        g = f.Ob(a, b, new bf(c, this.Hb), d, g);
        k || e || (f = ff(f, a), g = g.concat(uf(this, a, f)));
        return g;
      };
      gf.prototype.kb = function(a, b, c) {
        var d = a.path,
            e = this.sa.get(d),
            f = [];
        if (e && ("default" === a.wa() || null != ff(e, a))) {
          f = e.kb(a, b, c);
          e.e() && (this.sa = this.sa.remove(d));
          e = f.Hg;
          f = f.jg;
          b = -1 !== Ua(e, function(a) {
            return de(a.o);
          });
          var g = Ke(this.sa, d, function(a, b) {
            return null != df(b);
          });
          if (b && !g && (d = this.sa.subtree(d), !d.e()))
            for (var d = vf(d),
                k = 0; k < d.length; ++k) {
              var l = d[k],
                  m = l.V,
                  l = wf(this, l);
              this.Mc.Xe(m, xf(this, m), l.ud, l.J);
            }
          if (!g && 0 < e.length && !c)
            if (b)
              this.Mc.Zd(a, null);
            else {
              var v = this;
              Oa(e, function(a) {
                a.wa();
                var b = v.kc[sf(a)];
                v.Mc.Zd(a, b);
              });
            }
          yf(this, e);
        }
        return f;
      };
      gf.prototype.ua = function(a, b) {
        var c = this.Hb,
            d = Ke(this.sa, a, function(b, c) {
              var d = N(b, a);
              if (d = c.hb(d))
                return d;
            });
        return c.ua(a, d, b, !0);
      };
      function vf(a) {
        return Ie(a, function(a, c, d) {
          if (c && null != df(c))
            return [df(c)];
          var e = [];
          c && (e = ef(c));
          r(d, function(a) {
            e = e.concat(a);
          });
          return e;
        });
      }
      function yf(a, b) {
        for (var c = 0; c < b.length; ++c) {
          var d = b[c];
          if (!de(d.o)) {
            var d = sf(d),
                e = a.kc[d];
            delete a.kc[d];
            delete a.$e["_" + e];
          }
        }
      }
      function uf(a, b, c) {
        var d = b.path,
            e = xf(a, b);
        c = wf(a, c);
        b = a.Mc.Xe(b, e, c.ud, c.J);
        d = a.sa.subtree(d);
        if (e)
          J(null == df(d.value), "If we're adding a query, it shouldn't be shadowed");
        else
          for (e = Ie(d, function(a, b, c) {
            if (!a.e() && b && null != df(b))
              return [ue(df(b))];
            var d = [];
            b && (d = d.concat(Qa(ef(b), function(a) {
              return a.V;
            })));
            r(c, function(a) {
              d = d.concat(a);
            });
            return d;
          }), d = 0; d < e.length; ++d)
            c = e[d], a.Mc.Zd(c, xf(a, c));
        return b;
      }
      function wf(a, b) {
        var c = b.V,
            d = xf(a, c);
        return {
          ud: function() {
            return (b.u() || C).hash();
          },
          J: function(b) {
            if ("ok" === b) {
              if (d) {
                var f = c.path;
                if (b = of(a, d)) {
                  var g = pf(b);
                  b = g.path;
                  g = g.Ib;
                  f = N(b, f);
                  f = new Zb(new ye(!1, !0, g, !0), f);
                  b = qf(a, b, f);
                } else
                  b = [];
              } else
                b = jf(a, new Zb(ze, c.path));
              return b;
            }
            f = "Unknown Error";
            "too_big" === b ? f = "The data requested exceeds the maximum size that can be accessed with a single request." : "permission_denied" == b ? f = "Client doesn't have permission to access the desired data." : "unavailable" == b && (f = "The service is unavailable");
            f = Error(b + ": " + f);
            f.code = b.toUpperCase();
            return a.kb(c, null, f);
          }
        };
      }
      function sf(a) {
        return a.path.toString() + "$" + a.wa();
      }
      function pf(a) {
        var b = a.indexOf("$");
        J(-1 !== b && b < a.length - 1, "Bad queryKey.");
        return {
          Ib: a.substr(b + 1),
          path: new K(a.substr(0, b))
        };
      }
      function of(a, b) {
        var c = a.$e,
            d = "_" + b;
        return d in c ? c[d] : void 0;
      }
      function xf(a, b) {
        var c = sf(b);
        return w(a.kc, c);
      }
      var tf = 1;
      function qf(a, b, c) {
        var d = a.sa.get(b);
        J(d, "Missing sync point for query tag that we're tracking");
        return d.bb(c, new bf(b, a.Hb), null);
      }
      function jf(a, b) {
        return zf(a, b, a.sa, null, new bf(F, a.Hb));
      }
      function zf(a, b, c, d, e) {
        if (b.path.e())
          return Af(a, b, c, d, e);
        var f = c.get(F);
        null == d && null != f && (d = f.hb(F));
        var g = [],
            k = O(b.path),
            l = b.Wc(k);
        if ((c = c.children.get(k)) && l)
          var m = d ? d.M(k) : null,
              k = e.w(k),
              g = g.concat(zf(a, l, c, m, k));
        f && (g = g.concat(f.bb(b, e, d)));
        return g;
      }
      function Af(a, b, c, d, e) {
        var f = c.get(F);
        null == d && null != f && (d = f.hb(F));
        var g = [];
        c.children.ha(function(c, f) {
          var m = d ? d.M(c) : null,
              v = e.w(c),
              y = b.Wc(c);
          y && (g = g.concat(Af(a, y, f, m, v)));
        });
        f && (g = g.concat(f.bb(b, e, d)));
        return g;
      }
      ;
      function Bf() {
        this.children = {};
        this.kd = 0;
        this.value = null;
      }
      function Cf(a, b, c) {
        this.Dd = a ? a : "";
        this.Yc = b ? b : null;
        this.B = c ? c : new Bf;
      }
      function Df(a, b) {
        for (var c = b instanceof K ? b : new K(b),
            d = a,
            e; null !== (e = O(c)); )
          d = new Cf(e, d, w(d.B.children, e) || new Bf), c = G(c);
        return d;
      }
      h = Cf.prototype;
      h.Ba = function() {
        return this.B.value;
      };
      function Ef(a, b) {
        J("undefined" !== typeof b, "Cannot set value to undefined");
        a.B.value = b;
        Ff(a);
      }
      h.clear = function() {
        this.B.value = null;
        this.B.children = {};
        this.B.kd = 0;
        Ff(this);
      };
      h.td = function() {
        return 0 < this.B.kd;
      };
      h.e = function() {
        return null === this.Ba() && !this.td();
      };
      h.U = function(a) {
        var b = this;
        r(this.B.children, function(c, d) {
          a(new Cf(d, b, c));
        });
      };
      function Gf(a, b, c, d) {
        c && !d && b(a);
        a.U(function(a) {
          Gf(a, b, !0, d);
        });
        c && d && b(a);
      }
      function Hf(a, b) {
        for (var c = a.parent(); null !== c && !b(c); )
          c = c.parent();
      }
      h.path = function() {
        return new K(null === this.Yc ? this.Dd : this.Yc.path() + "/" + this.Dd);
      };
      h.name = function() {
        return this.Dd;
      };
      h.parent = function() {
        return this.Yc;
      };
      function Ff(a) {
        if (null !== a.Yc) {
          var b = a.Yc,
              c = a.Dd,
              d = a.e(),
              e = u(b.B.children, c);
          d && e ? (delete b.B.children[c], b.B.kd--, Ff(b)) : d || e || (b.B.children[c] = a.B, b.B.kd++, Ff(b));
        }
      }
      ;
      function If(a) {
        J(ea(a) && 0 < a.length, "Requires a non-empty array");
        this.Uf = a;
        this.Nc = {};
      }
      If.prototype.de = function(a, b) {
        for (var c = this.Nc[a] || [],
            d = 0; d < c.length; d++)
          c[d].yc.apply(c[d].Ma, Array.prototype.slice.call(arguments, 1));
      };
      If.prototype.Eb = function(a, b, c) {
        Jf(this, a);
        this.Nc[a] = this.Nc[a] || [];
        this.Nc[a].push({
          yc: b,
          Ma: c
        });
        (a = this.ze(a)) && b.apply(c, a);
      };
      If.prototype.gc = function(a, b, c) {
        Jf(this, a);
        a = this.Nc[a] || [];
        for (var d = 0; d < a.length; d++)
          if (a[d].yc === b && (!c || c === a[d].Ma)) {
            a.splice(d, 1);
            break;
          }
      };
      function Jf(a, b) {
        J(Ta(a.Uf, function(a) {
          return a === b;
        }), "Unknown event: " + b);
      }
      ;
      var Kf = function() {
        var a = 0,
            b = [];
        return function(c) {
          var d = c === a;
          a = c;
          for (var e = Array(8),
              f = 7; 0 <= f; f--)
            e[f] = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(c % 64), c = Math.floor(c / 64);
          J(0 === c, "Cannot push at time == 0");
          c = e.join("");
          if (d) {
            for (f = 11; 0 <= f && 63 === b[f]; f--)
              b[f] = 0;
            b[f]++;
          } else
            for (f = 0; 12 > f; f++)
              b[f] = Math.floor(64 * Math.random());
          for (f = 0; 12 > f; f++)
            c += "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(b[f]);
          J(20 === c.length, "nextPushId: Length should be 20.");
          return c;
        };
      }();
      function Lf() {
        If.call(this, ["online"]);
        this.ic = !0;
        if ("undefined" !== typeof window && "undefined" !== typeof window.addEventListener) {
          var a = this;
          window.addEventListener("online", function() {
            a.ic || (a.ic = !0, a.de("online", !0));
          }, !1);
          window.addEventListener("offline", function() {
            a.ic && (a.ic = !1, a.de("online", !1));
          }, !1);
        }
      }
      ma(Lf, If);
      Lf.prototype.ze = function(a) {
        J("online" === a, "Unknown event type: " + a);
        return [this.ic];
      };
      ca(Lf);
      function Mf() {
        If.call(this, ["visible"]);
        var a,
            b;
        "undefined" !== typeof document && "undefined" !== typeof document.addEventListener && ("undefined" !== typeof document.hidden ? (b = "visibilitychange", a = "hidden") : "undefined" !== typeof document.mozHidden ? (b = "mozvisibilitychange", a = "mozHidden") : "undefined" !== typeof document.msHidden ? (b = "msvisibilitychange", a = "msHidden") : "undefined" !== typeof document.webkitHidden && (b = "webkitvisibilitychange", a = "webkitHidden"));
        this.uc = !0;
        if (b) {
          var c = this;
          document.addEventListener(b, function() {
            var b = !document[a];
            b !== c.uc && (c.uc = b, c.de("visible", b));
          }, !1);
        }
      }
      ma(Mf, If);
      Mf.prototype.ze = function(a) {
        J("visible" === a, "Unknown event type: " + a);
        return [this.uc];
      };
      ca(Mf);
      var Nf = /[\[\].#$\/\u0000-\u001F\u007F]/,
          Of = /[\[\].#$\u0000-\u001F\u007F]/,
          Pf = /^[a-zA-Z][a-zA-Z._\-+]+$/;
      function Qf(a) {
        return p(a) && 0 !== a.length && !Nf.test(a);
      }
      function Rf(a) {
        return null === a || p(a) || ga(a) && !Sc(a) || ia(a) && u(a, ".sv");
      }
      function Sf(a, b, c, d) {
        d && !n(b) || Tf(z(a, 1, d), b, c);
      }
      function Tf(a, b, c) {
        c instanceof K && (c = new wc(c, a));
        if (!n(b))
          throw Error(a + "contains undefined " + zc(c));
        if (ha(b))
          throw Error(a + "contains a function " + zc(c) + " with contents: " + b.toString());
        if (Sc(b))
          throw Error(a + "contains " + b.toString() + " " + zc(c));
        if (p(b) && b.length > 10485760 / 3 && 10485760 < xc(b))
          throw Error(a + "contains a string greater than 10485760 utf8 bytes " + zc(c) + " ('" + b.substring(0, 50) + "...')");
        if (ia(b)) {
          var d = !1,
              e = !1;
          hb(b, function(b, g) {
            if (".value" === b)
              d = !0;
            else if (".priority" !== b && ".sv" !== b && (e = !0, !Qf(b)))
              throw Error(a + " contains an invalid key (" + b + ") " + zc(c) + '.  Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');
            c.push(b);
            Tf(a, g, c);
            c.pop();
          });
          if (d && e)
            throw Error(a + ' contains ".value" child ' + zc(c) + " in addition to actual children.");
        }
      }
      function Uf(a, b, c) {
        if (!ia(b) || ea(b))
          throw Error(z(a, 1, !1) + " must be an Object containing the children to replace.");
        if (u(b, ".value"))
          throw Error(z(a, 1, !1) + ' must not contain ".value".  To overwrite with a leaf value, just use .set() instead.');
        Sf(a, b, c, !1);
      }
      function Vf(a, b, c) {
        if (Sc(c))
          throw Error(z(a, b, !1) + "is " + c.toString() + ", but must be a valid Firebase priority (a string, finite number, server value, or null).");
        if (!Rf(c))
          throw Error(z(a, b, !1) + "must be a valid Firebase priority (a string, finite number, server value, or null).");
      }
      function Wf(a, b, c) {
        if (!c || n(b))
          switch (b) {
            case "value":
            case "child_added":
            case "child_removed":
            case "child_changed":
            case "child_moved":
              break;
            default:
              throw Error(z(a, 1, c) + 'must be a valid event type: "value", "child_added", "child_removed", "child_changed", or "child_moved".');
          }
      }
      function Xf(a, b, c, d) {
        if ((!d || n(c)) && !Qf(c))
          throw Error(z(a, b, d) + 'was an invalid key: "' + c + '".  Firebase keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]").');
      }
      function Yf(a, b) {
        if (!p(b) || 0 === b.length || Of.test(b))
          throw Error(z(a, 1, !1) + 'was an invalid path: "' + b + '". Paths must be non-empty strings and can\'t contain ".", "#", "$", "[", or "]"');
      }
      function Zf(a, b) {
        if (".info" === O(b))
          throw Error(a + " failed: Can't modify data under /.info/");
      }
      function $f(a, b) {
        if (!p(b))
          throw Error(z(a, 1, !1) + "must be a valid credential (a string).");
      }
      function ag(a, b, c) {
        if (!p(c))
          throw Error(z(a, b, !1) + "must be a valid string.");
      }
      function bg(a, b) {
        ag(a, 1, b);
        if (!Pf.test(b))
          throw Error(z(a, 1, !1) + "'" + b + "' is not a valid authentication provider.");
      }
      function cg(a, b, c, d) {
        if (!d || n(c))
          if (!ia(c) || null === c)
            throw Error(z(a, b, d) + "must be a valid object.");
      }
      function dg(a, b, c) {
        if (!ia(b) || !u(b, c))
          throw Error(z(a, 1, !1) + 'must contain the key "' + c + '"');
        if (!p(w(b, c)))
          throw Error(z(a, 1, !1) + 'must contain the key "' + c + '" with type "string"');
      }
      ;
      function eg() {
        this.set = {};
      }
      h = eg.prototype;
      h.add = function(a, b) {
        this.set[a] = null !== b ? b : !0;
      };
      h.contains = function(a) {
        return u(this.set, a);
      };
      h.get = function(a) {
        return this.contains(a) ? this.set[a] : void 0;
      };
      h.remove = function(a) {
        delete this.set[a];
      };
      h.clear = function() {
        this.set = {};
      };
      h.e = function() {
        return wa(this.set);
      };
      h.count = function() {
        return pa(this.set);
      };
      function fg(a, b) {
        r(a.set, function(a, d) {
          b(d, a);
        });
      }
      h.keys = function() {
        var a = [];
        r(this.set, function(b, c) {
          a.push(c);
        });
        return a;
      };
      function qc() {
        this.m = this.C = null;
      }
      qc.prototype.find = function(a) {
        if (null != this.C)
          return this.C.oa(a);
        if (a.e() || null == this.m)
          return null;
        var b = O(a);
        a = G(a);
        return this.m.contains(b) ? this.m.get(b).find(a) : null;
      };
      qc.prototype.mc = function(a, b) {
        if (a.e())
          this.C = b, this.m = null;
        else if (null !== this.C)
          this.C = this.C.G(a, b);
        else {
          null == this.m && (this.m = new eg);
          var c = O(a);
          this.m.contains(c) || this.m.add(c, new qc);
          c = this.m.get(c);
          a = G(a);
          c.mc(a, b);
        }
      };
      function gg(a, b) {
        if (b.e())
          return a.C = null, a.m = null, !0;
        if (null !== a.C) {
          if (a.C.N())
            return !1;
          var c = a.C;
          a.C = null;
          c.U(M, function(b, c) {
            a.mc(new K(b), c);
          });
          return gg(a, b);
        }
        return null !== a.m ? (c = O(b), b = G(b), a.m.contains(c) && gg(a.m.get(c), b) && a.m.remove(c), a.m.e() ? (a.m = null, !0) : !1) : !0;
      }
      function rc(a, b, c) {
        null !== a.C ? c(b, a.C) : a.U(function(a, e) {
          var f = new K(b.toString() + "/" + a);
          rc(e, f, c);
        });
      }
      qc.prototype.U = function(a) {
        null !== this.m && fg(this.m, function(b, c) {
          a(b, c);
        });
      };
      var hg = "auth.firebase.com";
      function ig(a, b, c) {
        this.ld = a || {};
        this.ce = b || {};
        this.ab = c || {};
        this.ld.remember || (this.ld.remember = "default");
      }
      var jg = ["remember", "redirectTo"];
      function kg(a) {
        var b = {},
            c = {};
        hb(a || {}, function(a, e) {
          0 <= Na(jg, a) ? b[a] = e : c[a] = e;
        });
        return new ig(b, {}, c);
      }
      ;
      function lg(a, b) {
        this.Pe = ["session", a.Ld, a.Cb].join(":");
        this.$d = b;
      }
      lg.prototype.set = function(a, b) {
        if (!b)
          if (this.$d.length)
            b = this.$d[0];
          else
            throw Error("fb.login.SessionManager : No storage options available!");
        b.set(this.Pe, a);
      };
      lg.prototype.get = function() {
        var a = Qa(this.$d, q(this.ng, this)),
            a = Pa(a, function(a) {
              return null !== a;
            });
        Xa(a, function(a, c) {
          return bd(c.token) - bd(a.token);
        });
        return 0 < a.length ? a.shift() : null;
      };
      lg.prototype.ng = function(a) {
        try {
          var b = a.get(this.Pe);
          if (b && b.token)
            return b;
        } catch (c) {}
        return null;
      };
      lg.prototype.clear = function() {
        var a = this;
        Oa(this.$d, function(b) {
          b.remove(a.Pe);
        });
      };
      function mg() {
        return "undefined" !== typeof navigator && "string" === typeof navigator.userAgent ? navigator.userAgent : "";
      }
      function ng() {
        return "undefined" !== typeof window && !!(window.cordova || window.phonegap || window.PhoneGap) && /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(mg());
      }
      function og() {
        return "undefined" !== typeof location && /^file:\//.test(location.href);
      }
      function pg(a) {
        var b = mg();
        if ("" === b)
          return !1;
        if ("Microsoft Internet Explorer" === navigator.appName) {
          if ((b = b.match(/MSIE ([0-9]{1,}[\.0-9]{0,})/)) && 1 < b.length)
            return parseFloat(b[1]) >= a;
        } else if (-1 < b.indexOf("Trident") && (b = b.match(/rv:([0-9]{2,2}[\.0-9]{0,})/)) && 1 < b.length)
          return parseFloat(b[1]) >= a;
        return !1;
      }
      ;
      function qg() {
        var a = window.opener.frames,
            b;
        for (b = a.length - 1; 0 <= b; b--)
          try {
            if (a[b].location.protocol === window.location.protocol && a[b].location.host === window.location.host && "__winchan_relay_frame" === a[b].name)
              return a[b];
          } catch (c) {}
        return null;
      }
      function rg(a, b, c) {
        a.attachEvent ? a.attachEvent("on" + b, c) : a.addEventListener && a.addEventListener(b, c, !1);
      }
      function sg(a, b, c) {
        a.detachEvent ? a.detachEvent("on" + b, c) : a.removeEventListener && a.removeEventListener(b, c, !1);
      }
      function tg(a) {
        /^https?:\/\//.test(a) || (a = window.location.href);
        var b = /^(https?:\/\/[\-_a-zA-Z\.0-9:]+)/.exec(a);
        return b ? b[1] : a;
      }
      function ug(a) {
        var b = "";
        try {
          a = a.replace("#", "");
          var c = kb(a);
          c && u(c, "__firebase_request_key") && (b = w(c, "__firebase_request_key"));
        } catch (d) {}
        return b;
      }
      function vg() {
        var a = Rc(hg);
        return a.scheme + "://" + a.host + "/v2";
      }
      function wg(a) {
        return vg() + "/" + a + "/auth/channel";
      }
      ;
      function xg(a) {
        var b = this;
        this.zc = a;
        this.ae = "*";
        pg(8) ? this.Qc = this.wd = qg() : (this.Qc = window.opener, this.wd = window);
        if (!b.Qc)
          throw "Unable to find relay frame";
        rg(this.wd, "message", q(this.hc, this));
        rg(this.wd, "message", q(this.Af, this));
        try {
          yg(this, {a: "ready"});
        } catch (c) {
          rg(this.Qc, "load", function() {
            yg(b, {a: "ready"});
          });
        }
        rg(window, "unload", q(this.yg, this));
      }
      function yg(a, b) {
        b = B(b);
        pg(8) ? a.Qc.doPost(b, a.ae) : a.Qc.postMessage(b, a.ae);
      }
      xg.prototype.hc = function(a) {
        var b = this,
            c;
        try {
          c = mb(a.data);
        } catch (d) {}
        c && "request" === c.a && (sg(window, "message", this.hc), this.ae = a.origin, this.zc && setTimeout(function() {
          b.zc(b.ae, c.d, function(a, c) {
            b.ag = !c;
            b.zc = void 0;
            yg(b, {
              a: "response",
              d: a,
              forceKeepWindowOpen: c
            });
          });
        }, 0));
      };
      xg.prototype.yg = function() {
        try {
          sg(this.wd, "message", this.Af);
        } catch (a) {}
        this.zc && (yg(this, {
          a: "error",
          d: "unknown closed window"
        }), this.zc = void 0);
        try {
          window.close();
        } catch (b) {}
      };
      xg.prototype.Af = function(a) {
        if (this.ag && "die" === a.data)
          try {
            window.close();
          } catch (b) {}
      };
      function zg(a) {
        this.oc = Ga() + Ga() + Ga();
        this.Df = a;
      }
      zg.prototype.open = function(a, b) {
        P.set("redirect_request_id", this.oc);
        P.set("redirect_request_id", this.oc);
        b.requestId = this.oc;
        b.redirectTo = b.redirectTo || window.location.href;
        a += (/\?/.test(a) ? "" : "?") + jb(b);
        window.location = a;
      };
      zg.isAvailable = function() {
        return !og() && !ng();
      };
      zg.prototype.Bc = function() {
        return "redirect";
      };
      var Ag = {
        NETWORK_ERROR: "Unable to contact the Firebase server.",
        SERVER_ERROR: "An unknown server error occurred.",
        TRANSPORT_UNAVAILABLE: "There are no login transports available for the requested method.",
        REQUEST_INTERRUPTED: "The browser redirected the page before the login request could complete.",
        USER_CANCELLED: "The user cancelled authentication."
      };
      function Bg(a) {
        var b = Error(w(Ag, a), a);
        b.code = a;
        return b;
      }
      ;
      function Cg(a) {
        var b;
        (b = !a.window_features) || (b = mg(), b = -1 !== b.indexOf("Fennec/") || -1 !== b.indexOf("Firefox/") && -1 !== b.indexOf("Android"));
        b && (a.window_features = void 0);
        a.window_name || (a.window_name = "_blank");
        this.options = a;
      }
      Cg.prototype.open = function(a, b, c) {
        function d(a) {
          g && (document.body.removeChild(g), g = void 0);
          v && (v = clearInterval(v));
          sg(window, "message", e);
          sg(window, "unload", d);
          if (m && !a)
            try {
              m.close();
            } catch (b) {
              k.postMessage("die", l);
            }
          m = k = void 0;
        }
        function e(a) {
          if (a.origin === l)
            try {
              var b = mb(a.data);
              "ready" === b.a ? k.postMessage(y, l) : "error" === b.a ? (d(!1), c && (c(b.d), c = null)) : "response" === b.a && (d(b.forceKeepWindowOpen), c && (c(null, b.d), c = null));
            } catch (e) {}
        }
        var f = pg(8),
            g,
            k;
        if (!this.options.relay_url)
          return c(Error("invalid arguments: origin of url and relay_url must match"));
        var l = tg(a);
        if (l !== tg(this.options.relay_url))
          c && setTimeout(function() {
            c(Error("invalid arguments: origin of url and relay_url must match"));
          }, 0);
        else {
          f && (g = document.createElement("iframe"), g.setAttribute("src", this.options.relay_url), g.style.display = "none", g.setAttribute("name", "__winchan_relay_frame"), document.body.appendChild(g), k = g.contentWindow);
          a += (/\?/.test(a) ? "" : "?") + jb(b);
          var m = window.open(a, this.options.window_name, this.options.window_features);
          k || (k = m);
          var v = setInterval(function() {
            m && m.closed && (d(!1), c && (c(Bg("USER_CANCELLED")), c = null));
          }, 500),
              y = B({
                a: "request",
                d: b
              });
          rg(window, "unload", d);
          rg(window, "message", e);
        }
      };
      Cg.isAvailable = function() {
        var a;
        if (a = "postMessage" in window && !og())
          (a = ng() || "undefined" !== typeof navigator && (!!mg().match(/Windows Phone/) || !!window.Windows && /^ms-appx:/.test(location.href))) || (a = mg(), a = "undefined" !== typeof navigator && "undefined" !== typeof window && !!(a.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i) || a.match(/CriOS/) || a.match(/Twitter for iPhone/) || a.match(/FBAN\/FBIOS/) || window.navigator.standalone)), a = !a;
        return a && !mg().match(/PhantomJS/);
      };
      Cg.prototype.Bc = function() {
        return "popup";
      };
      function Dg(a) {
        a.method || (a.method = "GET");
        a.headers || (a.headers = {});
        a.headers.content_type || (a.headers.content_type = "application/json");
        a.headers.content_type = a.headers.content_type.toLowerCase();
        this.options = a;
      }
      Dg.prototype.open = function(a, b, c) {
        function d() {
          c && (c(Bg("REQUEST_INTERRUPTED")), c = null);
        }
        var e = new XMLHttpRequest,
            f = this.options.method.toUpperCase(),
            g;
        rg(window, "beforeunload", d);
        e.onreadystatechange = function() {
          if (c && 4 === e.readyState) {
            var a;
            if (200 <= e.status && 300 > e.status) {
              try {
                a = mb(e.responseText);
              } catch (b) {}
              c(null, a);
            } else
              500 <= e.status && 600 > e.status ? c(Bg("SERVER_ERROR")) : c(Bg("NETWORK_ERROR"));
            c = null;
            sg(window, "beforeunload", d);
          }
        };
        if ("GET" === f)
          a += (/\?/.test(a) ? "" : "?") + jb(b), g = null;
        else {
          var k = this.options.headers.content_type;
          "application/json" === k && (g = B(b));
          "application/x-www-form-urlencoded" === k && (g = jb(b));
        }
        e.open(f, a, !0);
        a = {
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json;text/plain"
        };
        za(a, this.options.headers);
        for (var l in a)
          e.setRequestHeader(l, a[l]);
        e.send(g);
      };
      Dg.isAvailable = function() {
        var a;
        if (a = !!window.XMLHttpRequest)
          a = mg(), a = !(a.match(/MSIE/) || a.match(/Trident/)) || pg(10);
        return a;
      };
      Dg.prototype.Bc = function() {
        return "json";
      };
      function Eg(a) {
        this.oc = Ga() + Ga() + Ga();
        this.Df = a;
      }
      Eg.prototype.open = function(a, b, c) {
        function d() {
          c && (c(Bg("USER_CANCELLED")), c = null);
        }
        var e = this,
            f = Rc(hg),
            g;
        b.requestId = this.oc;
        b.redirectTo = f.scheme + "://" + f.host + "/blank/page.html";
        a += /\?/.test(a) ? "" : "?";
        a += jb(b);
        (g = window.open(a, "_blank", "location=no")) && ha(g.addEventListener) ? (g.addEventListener("loadstart", function(a) {
          var b;
          if (b = a && a.url)
            a: {
              try {
                var m = document.createElement("a");
                m.href = a.url;
                b = m.host === f.host && "/blank/page.html" === m.pathname;
                break a;
              } catch (v) {}
              b = !1;
            }
          b && (a = ug(a.url), g.removeEventListener("exit", d), g.close(), a = new ig(null, null, {
            requestId: e.oc,
            requestKey: a
          }), e.Df.requestWithCredential("/auth/session", a, c), c = null);
        }), g.addEventListener("exit", d)) : c(Bg("TRANSPORT_UNAVAILABLE"));
      };
      Eg.isAvailable = function() {
        return ng();
      };
      Eg.prototype.Bc = function() {
        return "redirect";
      };
      function Fg(a) {
        a.callback_parameter || (a.callback_parameter = "callback");
        this.options = a;
        window.__firebase_auth_jsonp = window.__firebase_auth_jsonp || {};
      }
      Fg.prototype.open = function(a, b, c) {
        function d() {
          c && (c(Bg("REQUEST_INTERRUPTED")), c = null);
        }
        function e() {
          setTimeout(function() {
            window.__firebase_auth_jsonp[f] = void 0;
            wa(window.__firebase_auth_jsonp) && (window.__firebase_auth_jsonp = void 0);
            try {
              var a = document.getElementById(f);
              a && a.parentNode.removeChild(a);
            } catch (b) {}
          }, 1);
          sg(window, "beforeunload", d);
        }
        var f = "fn" + (new Date).getTime() + Math.floor(99999 * Math.random());
        b[this.options.callback_parameter] = "__firebase_auth_jsonp." + f;
        a += (/\?/.test(a) ? "" : "?") + jb(b);
        rg(window, "beforeunload", d);
        window.__firebase_auth_jsonp[f] = function(a) {
          c && (c(null, a), c = null);
          e();
        };
        Gg(f, a, c);
      };
      function Gg(a, b, c) {
        setTimeout(function() {
          try {
            var d = document.createElement("script");
            d.type = "text/javascript";
            d.id = a;
            d.async = !0;
            d.src = b;
            d.onerror = function() {
              var b = document.getElementById(a);
              null !== b && b.parentNode.removeChild(b);
              c && c(Bg("NETWORK_ERROR"));
            };
            var e = document.getElementsByTagName("head");
            (e && 0 != e.length ? e[0] : document.documentElement).appendChild(d);
          } catch (f) {
            c && c(Bg("NETWORK_ERROR"));
          }
        }, 0);
      }
      Fg.isAvailable = function() {
        return "undefined" !== typeof document && null != document.createElement;
      };
      Fg.prototype.Bc = function() {
        return "json";
      };
      function Hg(a, b, c, d) {
        If.call(this, ["auth_status"]);
        this.H = a;
        this.df = b;
        this.Sg = c;
        this.Ke = d;
        this.rc = new lg(a, [Dc, P]);
        this.nb = null;
        this.Re = !1;
        Ig(this);
      }
      ma(Hg, If);
      h = Hg.prototype;
      h.we = function() {
        return this.nb || null;
      };
      function Ig(a) {
        P.get("redirect_request_id") && Jg(a);
        var b = a.rc.get();
        b && b.token ? (Kg(a, b), a.df(b.token, function(c, d) {
          Lg(a, c, d, !1, b.token, b);
        }, function(b, d) {
          Mg(a, "resumeSession()", b, d);
        })) : Kg(a, null);
      }
      function Ng(a, b, c, d, e, f) {
        "firebaseio-demo.com" === a.H.domain && Q("Firebase authentication is not supported on demo Firebases (*.firebaseio-demo.com). To secure your Firebase, create a production Firebase at https://www.firebase.com.");
        a.df(b, function(f, k) {
          Lg(a, f, k, !0, b, c, d || {}, e);
        }, function(b, c) {
          Mg(a, "auth()", b, c, f);
        });
      }
      function Og(a, b) {
        a.rc.clear();
        Kg(a, null);
        a.Sg(function(a, d) {
          if ("ok" === a)
            R(b, null);
          else {
            var e = (a || "error").toUpperCase(),
                f = e;
            d && (f += ": " + d);
            f = Error(f);
            f.code = e;
            R(b, f);
          }
        });
      }
      function Lg(a, b, c, d, e, f, g, k) {
        "ok" === b ? (d && (b = c.auth, f.auth = b, f.expires = c.expires, f.token = cd(e) ? e : "", c = null, b && u(b, "uid") ? c = w(b, "uid") : u(f, "uid") && (c = w(f, "uid")), f.uid = c, c = "custom", b && u(b, "provider") ? c = w(b, "provider") : u(f, "provider") && (c = w(f, "provider")), f.provider = c, a.rc.clear(), cd(e) && (g = g || {}, c = Dc, "sessionOnly" === g.remember && (c = P), "none" !== g.remember && a.rc.set(f, c)), Kg(a, f)), R(k, null, f)) : (a.rc.clear(), Kg(a, null), f = a = (b || "error").toUpperCase(), c && (f += ": " + c), f = Error(f), f.code = a, R(k, f));
      }
      function Mg(a, b, c, d, e) {
        Q(b + " was canceled: " + d);
        a.rc.clear();
        Kg(a, null);
        a = Error(d);
        a.code = c.toUpperCase();
        R(e, a);
      }
      function Pg(a, b, c, d, e) {
        Qg(a);
        c = new ig(d || {}, {}, c || {});
        Rg(a, [Dg, Fg], "/auth/" + b, c, e);
      }
      function Sg(a, b, c, d) {
        Qg(a);
        var e = [Cg, Eg];
        c = kg(c);
        "anonymous" === b || "password" === b ? setTimeout(function() {
          R(d, Bg("TRANSPORT_UNAVAILABLE"));
        }, 0) : (c.ce.window_features = "menubar=yes,modal=yes,alwaysRaised=yeslocation=yes,resizable=yes,scrollbars=yes,status=yes,height=625,width=625,top=" + ("object" === typeof screen ? .5 * (screen.height - 625) : 0) + ",left=" + ("object" === typeof screen ? .5 * (screen.width - 625) : 0), c.ce.relay_url = wg(a.H.Cb), c.ce.requestWithCredential = q(a.pc, a), Rg(a, e, "/auth/" + b, c, d));
      }
      function Jg(a) {
        var b = P.get("redirect_request_id");
        if (b) {
          var c = P.get("redirect_client_options");
          P.remove("redirect_request_id");
          P.remove("redirect_client_options");
          var d = [Dg, Fg],
              b = {
                requestId: b,
                requestKey: ug(document.location.hash)
              },
              c = new ig(c, {}, b);
          a.Re = !0;
          try {
            document.location.hash = document.location.hash.replace(/&__firebase_request_key=([a-zA-z0-9]*)/, "");
          } catch (e) {}
          Rg(a, d, "/auth/session", c, function() {
            this.Re = !1;
          }.bind(a));
        }
      }
      h.re = function(a, b) {
        Qg(this);
        var c = kg(a);
        c.ab._method = "POST";
        this.pc("/users", c, function(a, c) {
          a ? R(b, a) : R(b, a, c);
        });
      };
      h.Se = function(a, b) {
        var c = this;
        Qg(this);
        var d = "/users/" + encodeURIComponent(a.email),
            e = kg(a);
        e.ab._method = "DELETE";
        this.pc(d, e, function(a, d) {
          !a && d && d.uid && c.nb && c.nb.uid && c.nb.uid === d.uid && Og(c);
          R(b, a);
        });
      };
      h.oe = function(a, b) {
        Qg(this);
        var c = "/users/" + encodeURIComponent(a.email) + "/password",
            d = kg(a);
        d.ab._method = "PUT";
        d.ab.password = a.newPassword;
        this.pc(c, d, function(a) {
          R(b, a);
        });
      };
      h.ne = function(a, b) {
        Qg(this);
        var c = "/users/" + encodeURIComponent(a.oldEmail) + "/email",
            d = kg(a);
        d.ab._method = "PUT";
        d.ab.email = a.newEmail;
        d.ab.password = a.password;
        this.pc(c, d, function(a) {
          R(b, a);
        });
      };
      h.Ue = function(a, b) {
        Qg(this);
        var c = "/users/" + encodeURIComponent(a.email) + "/password",
            d = kg(a);
        d.ab._method = "POST";
        this.pc(c, d, function(a) {
          R(b, a);
        });
      };
      h.pc = function(a, b, c) {
        Tg(this, [Dg, Fg], a, b, c);
      };
      function Rg(a, b, c, d, e) {
        Tg(a, b, c, d, function(b, c) {
          !b && c && c.token && c.uid ? Ng(a, c.token, c, d.ld, function(a, b) {
            a ? R(e, a) : R(e, null, b);
          }) : R(e, b || Bg("UNKNOWN_ERROR"));
        });
      }
      function Tg(a, b, c, d, e) {
        b = Pa(b, function(a) {
          return "function" === typeof a.isAvailable && a.isAvailable();
        });
        0 === b.length ? setTimeout(function() {
          R(e, Bg("TRANSPORT_UNAVAILABLE"));
        }, 0) : (b = new (b.shift())(d.ce), d = ib(d.ab), d.v = "js-2.2.7", d.transport = b.Bc(), d.suppress_status_codes = !0, a = vg() + "/" + a.H.Cb + c, b.open(a, d, function(a, b) {
          if (a)
            R(e, a);
          else if (b && b.error) {
            var c = Error(b.error.message);
            c.code = b.error.code;
            c.details = b.error.details;
            R(e, c);
          } else
            R(e, null, b);
        }));
      }
      function Kg(a, b) {
        var c = null !== a.nb || null !== b;
        a.nb = b;
        c && a.de("auth_status", b);
        a.Ke(null !== b);
      }
      h.ze = function(a) {
        J("auth_status" === a, 'initial event must be of type "auth_status"');
        return this.Re ? null : [this.nb];
      };
      function Qg(a) {
        var b = a.H;
        if ("firebaseio.com" !== b.domain && "firebaseio-demo.com" !== b.domain && "auth.firebase.com" === hg)
          throw Error("This custom Firebase server ('" + a.H.domain + "') does not support delegated login.");
      }
      ;
      function Ug(a) {
        this.hc = a;
        this.Kd = [];
        this.Qb = 0;
        this.pe = -1;
        this.Fb = null;
      }
      function Vg(a, b, c) {
        a.pe = b;
        a.Fb = c;
        a.pe < a.Qb && (a.Fb(), a.Fb = null);
      }
      function Wg(a, b, c) {
        for (a.Kd[b] = c; a.Kd[a.Qb]; ) {
          var d = a.Kd[a.Qb];
          delete a.Kd[a.Qb];
          for (var e = 0; e < d.length; ++e)
            if (d[e]) {
              var f = a;
              Cb(function() {
                f.hc(d[e]);
              });
            }
          if (a.Qb === a.pe) {
            a.Fb && (clearTimeout(a.Fb), a.Fb(), a.Fb = null);
            break;
          }
          a.Qb++;
        }
      }
      ;
      function Xg(a, b, c) {
        this.qe = a;
        this.f = Oc(a);
        this.ob = this.pb = 0;
        this.Va = Ob(b);
        this.Vd = c;
        this.Gc = !1;
        this.gd = function(a) {
          b.host !== b.Oa && (a.ns = b.Cb);
          var c = [],
              f;
          for (f in a)
            a.hasOwnProperty(f) && c.push(f + "=" + a[f]);
          return (b.lb ? "https://" : "http://") + b.Oa + "/.lp?" + c.join("&");
        };
      }
      var Yg,
          Zg;
      Xg.prototype.open = function(a, b) {
        this.gf = 0;
        this.ka = b;
        this.zf = new Ug(a);
        this.zb = !1;
        var c = this;
        this.rb = setTimeout(function() {
          c.f("Timed out trying to connect.");
          c.ib();
          c.rb = null;
        }, Math.floor(3E4));
        Tc(function() {
          if (!c.zb) {
            c.Ta = new $g(function(a, b, d, k, l) {
              ah(c, arguments);
              if (c.Ta)
                if (c.rb && (clearTimeout(c.rb), c.rb = null), c.Gc = !0, "start" == a)
                  c.id = b, c.Ff = d;
                else if ("close" === a)
                  b ? (c.Ta.Td = !1, Vg(c.zf, b, function() {
                    c.ib();
                  })) : c.ib();
                else
                  throw Error("Unrecognized command received: " + a);
            }, function(a, b) {
              ah(c, arguments);
              Wg(c.zf, a, b);
            }, function() {
              c.ib();
            }, c.gd);
            var a = {start: "t"};
            a.ser = Math.floor(1E8 * Math.random());
            c.Ta.fe && (a.cb = c.Ta.fe);
            a.v = "5";
            c.Vd && (a.s = c.Vd);
            "undefined" !== typeof location && location.href && -1 !== location.href.indexOf("firebaseio.com") && (a.r = "f");
            a = c.gd(a);
            c.f("Connecting via long-poll to " + a);
            bh(c.Ta, a, function() {});
          }
        });
      };
      Xg.prototype.start = function() {
        var a = this.Ta,
            b = this.Ff;
        a.rg = this.id;
        a.sg = b;
        for (a.ke = !0; ch(a); )
          ;
        a = this.id;
        b = this.Ff;
        this.fc = document.createElement("iframe");
        var c = {dframe: "t"};
        c.id = a;
        c.pw = b;
        this.fc.src = this.gd(c);
        this.fc.style.display = "none";
        document.body.appendChild(this.fc);
      };
      Xg.isAvailable = function() {
        return Yg || !Zg && "undefined" !== typeof document && null != document.createElement && !("object" === typeof window && window.chrome && window.chrome.extension && !/^chrome/.test(window.location.href)) && !("object" === typeof Windows && "object" === typeof Windows.Ug);
      };
      h = Xg.prototype;
      h.Bd = function() {};
      h.cd = function() {
        this.zb = !0;
        this.Ta && (this.Ta.close(), this.Ta = null);
        this.fc && (document.body.removeChild(this.fc), this.fc = null);
        this.rb && (clearTimeout(this.rb), this.rb = null);
      };
      h.ib = function() {
        this.zb || (this.f("Longpoll is closing itself"), this.cd(), this.ka && (this.ka(this.Gc), this.ka = null));
      };
      h.close = function() {
        this.zb || (this.f("Longpoll is being closed."), this.cd());
      };
      h.send = function(a) {
        a = B(a);
        this.pb += a.length;
        Lb(this.Va, "bytes_sent", a.length);
        a = Kc(a);
        a = fb(a, !0);
        a = Xc(a, 1840);
        for (var b = 0; b < a.length; b++) {
          var c = this.Ta;
          c.$c.push({
            Jg: this.gf,
            Rg: a.length,
            jf: a[b]
          });
          c.ke && ch(c);
          this.gf++;
        }
      };
      function ah(a, b) {
        var c = B(b).length;
        a.ob += c;
        Lb(a.Va, "bytes_received", c);
      }
      function $g(a, b, c, d) {
        this.gd = d;
        this.jb = c;
        this.Oe = new eg;
        this.$c = [];
        this.se = Math.floor(1E8 * Math.random());
        this.Td = !0;
        this.fe = Gc();
        window["pLPCommand" + this.fe] = a;
        window["pRTLPCB" + this.fe] = b;
        a = document.createElement("iframe");
        a.style.display = "none";
        if (document.body) {
          document.body.appendChild(a);
          try {
            a.contentWindow.document || Bb("No IE domain setting required");
          } catch (e) {
            a.src = "javascript:void((function(){document.open();document.domain='" + document.domain + "';document.close();})())";
          }
        } else
          throw "Document body has not initialized. Wait to initialize Firebase until after the document is ready.";
        a.contentDocument ? a.gb = a.contentDocument : a.contentWindow ? a.gb = a.contentWindow.document : a.document && (a.gb = a.document);
        this.Ca = a;
        a = "";
        this.Ca.src && "javascript:" === this.Ca.src.substr(0, 11) && (a = '<script>document.domain="' + document.domain + '";\x3c/script>');
        a = "<html><body>" + a + "</body></html>";
        try {
          this.Ca.gb.open(), this.Ca.gb.write(a), this.Ca.gb.close();
        } catch (f) {
          Bb("frame writing exception"), f.stack && Bb(f.stack), Bb(f);
        }
      }
      $g.prototype.close = function() {
        this.ke = !1;
        if (this.Ca) {
          this.Ca.gb.body.innerHTML = "";
          var a = this;
          setTimeout(function() {
            null !== a.Ca && (document.body.removeChild(a.Ca), a.Ca = null);
          }, Math.floor(0));
        }
        var b = this.jb;
        b && (this.jb = null, b());
      };
      function ch(a) {
        if (a.ke && a.Td && a.Oe.count() < (0 < a.$c.length ? 2 : 1)) {
          a.se++;
          var b = {};
          b.id = a.rg;
          b.pw = a.sg;
          b.ser = a.se;
          for (var b = a.gd(b),
              c = "",
              d = 0; 0 < a.$c.length; )
            if (1870 >= a.$c[0].jf.length + 30 + c.length) {
              var e = a.$c.shift(),
                  c = c + "&seg" + d + "=" + e.Jg + "&ts" + d + "=" + e.Rg + "&d" + d + "=" + e.jf;
              d++;
            } else
              break;
          dh(a, b + c, a.se);
          return !0;
        }
        return !1;
      }
      function dh(a, b, c) {
        function d() {
          a.Oe.remove(c);
          ch(a);
        }
        a.Oe.add(c, 1);
        var e = setTimeout(d, Math.floor(25E3));
        bh(a, b, function() {
          clearTimeout(e);
          d();
        });
      }
      function bh(a, b, c) {
        setTimeout(function() {
          try {
            if (a.Td) {
              var d = a.Ca.gb.createElement("script");
              d.type = "text/javascript";
              d.async = !0;
              d.src = b;
              d.onload = d.onreadystatechange = function() {
                var a = d.readyState;
                a && "loaded" !== a && "complete" !== a || (d.onload = d.onreadystatechange = null, d.parentNode && d.parentNode.removeChild(d), c());
              };
              d.onerror = function() {
                Bb("Long-poll script failed to load: " + b);
                a.Td = !1;
                a.close();
              };
              a.Ca.gb.body.appendChild(d);
            }
          } catch (e) {}
        }, Math.floor(1));
      }
      ;
      var eh = null;
      "undefined" !== typeof MozWebSocket ? eh = MozWebSocket : "undefined" !== typeof WebSocket && (eh = WebSocket);
      function fh(a, b, c) {
        this.qe = a;
        this.f = Oc(this.qe);
        this.frames = this.Jc = null;
        this.ob = this.pb = this.bf = 0;
        this.Va = Ob(b);
        this.fb = (b.lb ? "wss://" : "ws://") + b.Oa + "/.ws?v=5";
        "undefined" !== typeof location && location.href && -1 !== location.href.indexOf("firebaseio.com") && (this.fb += "&r=f");
        b.host !== b.Oa && (this.fb = this.fb + "&ns=" + b.Cb);
        c && (this.fb = this.fb + "&s=" + c);
      }
      var gh;
      fh.prototype.open = function(a, b) {
        this.jb = b;
        this.wg = a;
        this.f("Websocket connecting to " + this.fb);
        this.Gc = !1;
        Dc.set("previous_websocket_failure", !0);
        try {
          this.va = new eh(this.fb);
        } catch (c) {
          this.f("Error instantiating WebSocket.");
          var d = c.message || c.data;
          d && this.f(d);
          this.ib();
          return;
        }
        var e = this;
        this.va.onopen = function() {
          e.f("Websocket connected.");
          e.Gc = !0;
        };
        this.va.onclose = function() {
          e.f("Websocket connection was disconnected.");
          e.va = null;
          e.ib();
        };
        this.va.onmessage = function(a) {
          if (null !== e.va)
            if (a = a.data, e.ob += a.length, Lb(e.Va, "bytes_received", a.length), hh(e), null !== e.frames)
              ih(e, a);
            else {
              a: {
                J(null === e.frames, "We already have a frame buffer");
                if (6 >= a.length) {
                  var b = Number(a);
                  if (!isNaN(b)) {
                    e.bf = b;
                    e.frames = [];
                    a = null;
                    break a;
                  }
                }
                e.bf = 1;
                e.frames = [];
              }
              null !== a && ih(e, a);
            }
        };
        this.va.onerror = function(a) {
          e.f("WebSocket error.  Closing connection.");
          (a = a.message || a.data) && e.f(a);
          e.ib();
        };
      };
      fh.prototype.start = function() {};
      fh.isAvailable = function() {
        var a = !1;
        if ("undefined" !== typeof navigator && navigator.userAgent) {
          var b = navigator.userAgent.match(/Android ([0-9]{0,}\.[0-9]{0,})/);
          b && 1 < b.length && 4.4 > parseFloat(b[1]) && (a = !0);
        }
        return !a && null !== eh && !gh;
      };
      fh.responsesRequiredToBeHealthy = 2;
      fh.healthyTimeout = 3E4;
      h = fh.prototype;
      h.Bd = function() {
        Dc.remove("previous_websocket_failure");
      };
      function ih(a, b) {
        a.frames.push(b);
        if (a.frames.length == a.bf) {
          var c = a.frames.join("");
          a.frames = null;
          c = mb(c);
          a.wg(c);
        }
      }
      h.send = function(a) {
        hh(this);
        a = B(a);
        this.pb += a.length;
        Lb(this.Va, "bytes_sent", a.length);
        a = Xc(a, 16384);
        1 < a.length && this.va.send(String(a.length));
        for (var b = 0; b < a.length; b++)
          this.va.send(a[b]);
      };
      h.cd = function() {
        this.zb = !0;
        this.Jc && (clearInterval(this.Jc), this.Jc = null);
        this.va && (this.va.close(), this.va = null);
      };
      h.ib = function() {
        this.zb || (this.f("WebSocket is closing itself"), this.cd(), this.jb && (this.jb(this.Gc), this.jb = null));
      };
      h.close = function() {
        this.zb || (this.f("WebSocket is being closed"), this.cd());
      };
      function hh(a) {
        clearInterval(a.Jc);
        a.Jc = setInterval(function() {
          a.va && a.va.send("0");
          hh(a);
        }, Math.floor(45E3));
      }
      ;
      function jh(a) {
        kh(this, a);
      }
      var lh = [Xg, fh];
      function kh(a, b) {
        var c = fh && fh.isAvailable(),
            d = c && !(Dc.uf || !0 === Dc.get("previous_websocket_failure"));
        b.Tg && (c || Q("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."), d = !0);
        if (d)
          a.ed = [fh];
        else {
          var e = a.ed = [];
          Yc(lh, function(a, b) {
            b && b.isAvailable() && e.push(b);
          });
        }
      }
      function mh(a) {
        if (0 < a.ed.length)
          return a.ed[0];
        throw Error("No transports available");
      }
      ;
      function nh(a, b, c, d, e, f) {
        this.id = a;
        this.f = Oc("c:" + this.id + ":");
        this.hc = c;
        this.Vc = d;
        this.ka = e;
        this.Me = f;
        this.H = b;
        this.Jd = [];
        this.ef = 0;
        this.Nf = new jh(b);
        this.Ua = 0;
        this.f("Connection created");
        oh(this);
      }
      function oh(a) {
        var b = mh(a.Nf);
        a.L = new b("c:" + a.id + ":" + a.ef++, a.H);
        a.Qe = b.responsesRequiredToBeHealthy || 0;
        var c = ph(a, a.L),
            d = qh(a, a.L);
        a.fd = a.L;
        a.bd = a.L;
        a.F = null;
        a.Ab = !1;
        setTimeout(function() {
          a.L && a.L.open(c, d);
        }, Math.floor(0));
        b = b.healthyTimeout || 0;
        0 < b && (a.vd = setTimeout(function() {
          a.vd = null;
          a.Ab || (a.L && 102400 < a.L.ob ? (a.f("Connection exceeded healthy timeout but has received " + a.L.ob + " bytes.  Marking connection healthy."), a.Ab = !0, a.L.Bd()) : a.L && 10240 < a.L.pb ? a.f("Connection exceeded healthy timeout but has sent " + a.L.pb + " bytes.  Leaving connection alive.") : (a.f("Closing unhealthy connection after timeout."), a.close()));
        }, Math.floor(b)));
      }
      function qh(a, b) {
        return function(c) {
          b === a.L ? (a.L = null, c || 0 !== a.Ua ? 1 === a.Ua && a.f("Realtime connection lost.") : (a.f("Realtime connection failed."), "s-" === a.H.Oa.substr(0, 2) && (Dc.remove("host:" + a.H.host), a.H.Oa = a.H.host)), a.close()) : b === a.F ? (a.f("Secondary connection lost."), c = a.F, a.F = null, a.fd !== c && a.bd !== c || a.close()) : a.f("closing an old connection");
        };
      }
      function ph(a, b) {
        return function(c) {
          if (2 != a.Ua)
            if (b === a.bd) {
              var d = Vc("t", c);
              c = Vc("d", c);
              if ("c" == d) {
                if (d = Vc("t", c), "d" in c)
                  if (c = c.d, "h" === d) {
                    var d = c.ts,
                        e = c.v,
                        f = c.h;
                    a.Vd = c.s;
                    Fc(a.H, f);
                    0 == a.Ua && (a.L.start(), rh(a, a.L, d), "5" !== e && Q("Protocol version mismatch detected"), c = a.Nf, (c = 1 < c.ed.length ? c.ed[1] : null) && sh(a, c));
                  } else if ("n" === d) {
                    a.f("recvd end transmission on primary");
                    a.bd = a.F;
                    for (c = 0; c < a.Jd.length; ++c)
                      a.Fd(a.Jd[c]);
                    a.Jd = [];
                    th(a);
                  } else
                    "s" === d ? (a.f("Connection shutdown command received. Shutting down..."), a.Me && (a.Me(c), a.Me = null), a.ka = null, a.close()) : "r" === d ? (a.f("Reset packet received.  New host: " + c), Fc(a.H, c), 1 === a.Ua ? a.close() : (uh(a), oh(a))) : "e" === d ? Pc("Server Error: " + c) : "o" === d ? (a.f("got pong on primary."), vh(a), wh(a)) : Pc("Unknown control packet command: " + d);
              } else
                "d" == d && a.Fd(c);
            } else if (b === a.F)
              if (d = Vc("t", c), c = Vc("d", c), "c" == d)
                "t" in c && (c = c.t, "a" === c ? xh(a) : "r" === c ? (a.f("Got a reset on secondary, closing it"), a.F.close(), a.fd !== a.F && a.bd !== a.F || a.close()) : "o" === c && (a.f("got pong on secondary."), a.Lf--, xh(a)));
              else if ("d" == d)
                a.Jd.push(c);
              else
                throw Error("Unknown protocol layer: " + d);
            else
              a.f("message on old connection");
        };
      }
      nh.prototype.Da = function(a) {
        yh(this, {
          t: "d",
          d: a
        });
      };
      function th(a) {
        a.fd === a.F && a.bd === a.F && (a.f("cleaning up and promoting a connection: " + a.F.qe), a.L = a.F, a.F = null);
      }
      function xh(a) {
        0 >= a.Lf ? (a.f("Secondary connection is healthy."), a.Ab = !0, a.F.Bd(), a.F.start(), a.f("sending client ack on secondary"), a.F.send({
          t: "c",
          d: {
            t: "a",
            d: {}
          }
        }), a.f("Ending transmission on primary"), a.L.send({
          t: "c",
          d: {
            t: "n",
            d: {}
          }
        }), a.fd = a.F, th(a)) : (a.f("sending ping on secondary."), a.F.send({
          t: "c",
          d: {
            t: "p",
            d: {}
          }
        }));
      }
      nh.prototype.Fd = function(a) {
        vh(this);
        this.hc(a);
      };
      function vh(a) {
        a.Ab || (a.Qe--, 0 >= a.Qe && (a.f("Primary connection is healthy."), a.Ab = !0, a.L.Bd()));
      }
      function sh(a, b) {
        a.F = new b("c:" + a.id + ":" + a.ef++, a.H, a.Vd);
        a.Lf = b.responsesRequiredToBeHealthy || 0;
        a.F.open(ph(a, a.F), qh(a, a.F));
        setTimeout(function() {
          a.F && (a.f("Timed out trying to upgrade."), a.F.close());
        }, Math.floor(6E4));
      }
      function rh(a, b, c) {
        a.f("Realtime connection established.");
        a.L = b;
        a.Ua = 1;
        a.Vc && (a.Vc(c), a.Vc = null);
        0 === a.Qe ? (a.f("Primary connection is healthy."), a.Ab = !0) : setTimeout(function() {
          wh(a);
        }, Math.floor(5E3));
      }
      function wh(a) {
        a.Ab || 1 !== a.Ua || (a.f("sending ping on primary."), yh(a, {
          t: "c",
          d: {
            t: "p",
            d: {}
          }
        }));
      }
      function yh(a, b) {
        if (1 !== a.Ua)
          throw "Connection is not connected";
        a.fd.send(b);
      }
      nh.prototype.close = function() {
        2 !== this.Ua && (this.f("Closing realtime connection."), this.Ua = 2, uh(this), this.ka && (this.ka(), this.ka = null));
      };
      function uh(a) {
        a.f("Shutting down all connections");
        a.L && (a.L.close(), a.L = null);
        a.F && (a.F.close(), a.F = null);
        a.vd && (clearTimeout(a.vd), a.vd = null);
      }
      ;
      function zh(a, b, c, d) {
        this.id = Ah++;
        this.f = Oc("p:" + this.id + ":");
        this.wf = this.De = !1;
        this.aa = {};
        this.pa = [];
        this.Xc = 0;
        this.Uc = [];
        this.ma = !1;
        this.$a = 1E3;
        this.Cd = 3E5;
        this.Gb = b;
        this.Tc = c;
        this.Ne = d;
        this.H = a;
        this.We = null;
        this.Qd = {};
        this.Ig = 0;
        this.mf = !0;
        this.Kc = this.Fe = null;
        Bh(this, 0);
        Mf.ub().Eb("visible", this.zg, this);
        -1 === a.host.indexOf("fblocal") && Lf.ub().Eb("online", this.xg, this);
      }
      var Ah = 0,
          Ch = 0;
      h = zh.prototype;
      h.Da = function(a, b, c) {
        var d = ++this.Ig;
        a = {
          r: d,
          a: a,
          b: b
        };
        this.f(B(a));
        J(this.ma, "sendRequest call when we're not connected not allowed.");
        this.Sa.Da(a);
        c && (this.Qd[d] = c);
      };
      h.xf = function(a, b, c, d) {
        var e = a.wa(),
            f = a.path.toString();
        this.f("Listen called for " + f + " " + e);
        this.aa[f] = this.aa[f] || {};
        J(!this.aa[f][e], "listen() called twice for same path/queryId.");
        a = {
          J: d,
          ud: b,
          Fg: a,
          tag: c
        };
        this.aa[f][e] = a;
        this.ma && Dh(this, a);
      };
      function Dh(a, b) {
        var c = b.Fg,
            d = c.path.toString(),
            e = c.wa();
        a.f("Listen on " + d + " for " + e);
        var f = {p: d};
        b.tag && (f.q = ce(c.o), f.t = b.tag);
        f.h = b.ud();
        a.Da("q", f, function(f) {
          var k = f.d,
              l = f.s;
          if (k && "object" === typeof k && u(k, "w")) {
            var m = w(k, "w");
            ea(m) && 0 <= Na(m, "no_index") && Q("Using an unspecified index. Consider adding " + ('".indexOn": "' + c.o.g.toString() + '"') + " at " + c.path.toString() + " to your security rules for better performance");
          }
          (a.aa[d] && a.aa[d][e]) === b && (a.f("listen response", f), "ok" !== l && Eh(a, d, e), b.J && b.J(l, k));
        });
      }
      h.P = function(a, b, c) {
        this.Fa = {
          fg: a,
          nf: !1,
          yc: b,
          jd: c
        };
        this.f("Authenticating using credential: " + a);
        Fh(this);
        (b = 40 == a.length) || (a = ad(a).Ac, b = "object" === typeof a && !0 === w(a, "admin"));
        b && (this.f("Admin auth credential detected.  Reducing max reconnect time."), this.Cd = 3E4);
      };
      h.ee = function(a) {
        delete this.Fa;
        this.ma && this.Da("unauth", {}, function(b) {
          a(b.s, b.d);
        });
      };
      function Fh(a) {
        var b = a.Fa;
        a.ma && b && a.Da("auth", {cred: b.fg}, function(c) {
          var d = c.s;
          c = c.d || "error";
          "ok" !== d && a.Fa === b && delete a.Fa;
          b.nf ? "ok" !== d && b.jd && b.jd(d, c) : (b.nf = !0, b.yc && b.yc(d, c));
        });
      }
      h.Of = function(a, b) {
        var c = a.path.toString(),
            d = a.wa();
        this.f("Unlisten called for " + c + " " + d);
        if (Eh(this, c, d) && this.ma) {
          var e = ce(a.o);
          this.f("Unlisten on " + c + " for " + d);
          c = {p: c};
          b && (c.q = e, c.t = b);
          this.Da("n", c);
        }
      };
      h.Le = function(a, b, c) {
        this.ma ? Gh(this, "o", a, b, c) : this.Uc.push({
          Zc: a,
          action: "o",
          data: b,
          J: c
        });
      };
      h.Bf = function(a, b, c) {
        this.ma ? Gh(this, "om", a, b, c) : this.Uc.push({
          Zc: a,
          action: "om",
          data: b,
          J: c
        });
      };
      h.Gd = function(a, b) {
        this.ma ? Gh(this, "oc", a, null, b) : this.Uc.push({
          Zc: a,
          action: "oc",
          data: null,
          J: b
        });
      };
      function Gh(a, b, c, d, e) {
        c = {
          p: c,
          d: d
        };
        a.f("onDisconnect " + b, c);
        a.Da(b, c, function(a) {
          e && setTimeout(function() {
            e(a.s, a.d);
          }, Math.floor(0));
        });
      }
      h.put = function(a, b, c, d) {
        Hh(this, "p", a, b, c, d);
      };
      h.yf = function(a, b, c, d) {
        Hh(this, "m", a, b, c, d);
      };
      function Hh(a, b, c, d, e, f) {
        d = {
          p: c,
          d: d
        };
        n(f) && (d.h = f);
        a.pa.push({
          action: b,
          If: d,
          J: e
        });
        a.Xc++;
        b = a.pa.length - 1;
        a.ma ? Ih(a, b) : a.f("Buffering put: " + c);
      }
      function Ih(a, b) {
        var c = a.pa[b].action,
            d = a.pa[b].If,
            e = a.pa[b].J;
        a.pa[b].Gg = a.ma;
        a.Da(c, d, function(d) {
          a.f(c + " response", d);
          delete a.pa[b];
          a.Xc--;
          0 === a.Xc && (a.pa = []);
          e && e(d.s, d.d);
        });
      }
      h.Te = function(a) {
        this.ma && (a = {c: a}, this.f("reportStats", a), this.Da("s", a, function(a) {
          "ok" !== a.s && this.f("reportStats", "Error sending stats: " + a.d);
        }));
      };
      h.Fd = function(a) {
        if ("r" in a) {
          this.f("from server: " + B(a));
          var b = a.r,
              c = this.Qd[b];
          c && (delete this.Qd[b], c(a.b));
        } else {
          if ("error" in a)
            throw "A server-side error has occurred: " + a.error;
          "a" in a && (b = a.a, c = a.b, this.f("handleServerMessage", b, c), "d" === b ? this.Gb(c.p, c.d, !1, c.t) : "m" === b ? this.Gb(c.p, c.d, !0, c.t) : "c" === b ? Jh(this, c.p, c.q) : "ac" === b ? (a = c.s, b = c.d, c = this.Fa, delete this.Fa, c && c.jd && c.jd(a, b)) : "sd" === b ? this.We ? this.We(c) : "msg" in c && "undefined" !== typeof console && console.log("FIREBASE: " + c.msg.replace("\n", "\nFIREBASE: ")) : Pc("Unrecognized action received from server: " + B(b) + "\nAre you using the latest client?"));
        }
      };
      h.Vc = function(a) {
        this.f("connection ready");
        this.ma = !0;
        this.Kc = (new Date).getTime();
        this.Ne({serverTimeOffset: a - (new Date).getTime()});
        this.mf && (a = {}, a["sdk.js." + "2.2.7".replace(/\./g, "-")] = 1, ng() && (a["framework.cordova"] = 1), this.Te(a));
        Kh(this);
        this.mf = !1;
        this.Tc(!0);
      };
      function Bh(a, b) {
        J(!a.Sa, "Scheduling a connect when we're already connected/ing?");
        a.Sb && clearTimeout(a.Sb);
        a.Sb = setTimeout(function() {
          a.Sb = null;
          Lh(a);
        }, Math.floor(b));
      }
      h.zg = function(a) {
        a && !this.uc && this.$a === this.Cd && (this.f("Window became visible.  Reducing delay."), this.$a = 1E3, this.Sa || Bh(this, 0));
        this.uc = a;
      };
      h.xg = function(a) {
        a ? (this.f("Browser went online."), this.$a = 1E3, this.Sa || Bh(this, 0)) : (this.f("Browser went offline.  Killing connection."), this.Sa && this.Sa.close());
      };
      h.Cf = function() {
        this.f("data client disconnected");
        this.ma = !1;
        this.Sa = null;
        for (var a = 0; a < this.pa.length; a++) {
          var b = this.pa[a];
          b && "h" in b.If && b.Gg && (b.J && b.J("disconnect"), delete this.pa[a], this.Xc--);
        }
        0 === this.Xc && (this.pa = []);
        this.Qd = {};
        Mh(this) && (this.uc ? this.Kc && (3E4 < (new Date).getTime() - this.Kc && (this.$a = 1E3), this.Kc = null) : (this.f("Window isn't visible.  Delaying reconnect."), this.$a = this.Cd, this.Fe = (new Date).getTime()), a = Math.max(0, this.$a - ((new Date).getTime() - this.Fe)), a *= Math.random(), this.f("Trying to reconnect in " + a + "ms"), Bh(this, a), this.$a = Math.min(this.Cd, 1.3 * this.$a));
        this.Tc(!1);
      };
      function Lh(a) {
        if (Mh(a)) {
          a.f("Making a connection attempt");
          a.Fe = (new Date).getTime();
          a.Kc = null;
          var b = q(a.Fd, a),
              c = q(a.Vc, a),
              d = q(a.Cf, a),
              e = a.id + ":" + Ch++;
          a.Sa = new nh(e, a.H, b, c, d, function(b) {
            Q(b + " (" + a.H.toString() + ")");
            a.wf = !0;
          });
        }
      }
      h.yb = function() {
        this.De = !0;
        this.Sa ? this.Sa.close() : (this.Sb && (clearTimeout(this.Sb), this.Sb = null), this.ma && this.Cf());
      };
      h.qc = function() {
        this.De = !1;
        this.$a = 1E3;
        this.Sa || Bh(this, 0);
      };
      function Jh(a, b, c) {
        c = c ? Qa(c, function(a) {
          return Wc(a);
        }).join("$") : "default";
        (a = Eh(a, b, c)) && a.J && a.J("permission_denied");
      }
      function Eh(a, b, c) {
        b = (new K(b)).toString();
        var d;
        n(a.aa[b]) ? (d = a.aa[b][c], delete a.aa[b][c], 0 === pa(a.aa[b]) && delete a.aa[b]) : d = void 0;
        return d;
      }
      function Kh(a) {
        Fh(a);
        r(a.aa, function(b) {
          r(b, function(b) {
            Dh(a, b);
          });
        });
        for (var b = 0; b < a.pa.length; b++)
          a.pa[b] && Ih(a, b);
        for (; a.Uc.length; )
          b = a.Uc.shift(), Gh(a, b.action, b.Zc, b.data, b.J);
      }
      function Mh(a) {
        var b;
        b = Lf.ub().ic;
        return !a.wf && !a.De && b;
      }
      ;
      var V = {lg: function() {
          Yg = gh = !0;
        }};
      V.forceLongPolling = V.lg;
      V.mg = function() {
        Zg = !0;
      };
      V.forceWebSockets = V.mg;
      V.Mg = function(a, b) {
        a.k.Ra.We = b;
      };
      V.setSecurityDebugCallback = V.Mg;
      V.Ye = function(a, b) {
        a.k.Ye(b);
      };
      V.stats = V.Ye;
      V.Ze = function(a, b) {
        a.k.Ze(b);
      };
      V.statsIncrementCounter = V.Ze;
      V.pd = function(a) {
        return a.k.pd;
      };
      V.dataUpdateCount = V.pd;
      V.pg = function(a, b) {
        a.k.Ce = b;
      };
      V.interceptServerData = V.pg;
      V.vg = function(a) {
        new xg(a);
      };
      V.onPopupOpen = V.vg;
      V.Kg = function(a) {
        hg = a;
      };
      V.setAuthenticationServer = V.Kg;
      function S(a, b, c) {
        this.B = a;
        this.V = b;
        this.g = c;
      }
      S.prototype.K = function() {
        x("Firebase.DataSnapshot.val", 0, 0, arguments.length);
        return this.B.K();
      };
      S.prototype.val = S.prototype.K;
      S.prototype.lf = function() {
        x("Firebase.DataSnapshot.exportVal", 0, 0, arguments.length);
        return this.B.K(!0);
      };
      S.prototype.exportVal = S.prototype.lf;
      S.prototype.kg = function() {
        x("Firebase.DataSnapshot.exists", 0, 0, arguments.length);
        return !this.B.e();
      };
      S.prototype.exists = S.prototype.kg;
      S.prototype.w = function(a) {
        x("Firebase.DataSnapshot.child", 0, 1, arguments.length);
        ga(a) && (a = String(a));
        Yf("Firebase.DataSnapshot.child", a);
        var b = new K(a),
            c = this.V.w(b);
        return new S(this.B.oa(b), c, M);
      };
      S.prototype.child = S.prototype.w;
      S.prototype.Ha = function(a) {
        x("Firebase.DataSnapshot.hasChild", 1, 1, arguments.length);
        Yf("Firebase.DataSnapshot.hasChild", a);
        var b = new K(a);
        return !this.B.oa(b).e();
      };
      S.prototype.hasChild = S.prototype.Ha;
      S.prototype.A = function() {
        x("Firebase.DataSnapshot.getPriority", 0, 0, arguments.length);
        return this.B.A().K();
      };
      S.prototype.getPriority = S.prototype.A;
      S.prototype.forEach = function(a) {
        x("Firebase.DataSnapshot.forEach", 1, 1, arguments.length);
        A("Firebase.DataSnapshot.forEach", 1, a, !1);
        if (this.B.N())
          return !1;
        var b = this;
        return !!this.B.U(this.g, function(c, d) {
          return a(new S(d, b.V.w(c), M));
        });
      };
      S.prototype.forEach = S.prototype.forEach;
      S.prototype.td = function() {
        x("Firebase.DataSnapshot.hasChildren", 0, 0, arguments.length);
        return this.B.N() ? !1 : !this.B.e();
      };
      S.prototype.hasChildren = S.prototype.td;
      S.prototype.name = function() {
        Q("Firebase.DataSnapshot.name() being deprecated. Please use Firebase.DataSnapshot.key() instead.");
        x("Firebase.DataSnapshot.name", 0, 0, arguments.length);
        return this.key();
      };
      S.prototype.name = S.prototype.name;
      S.prototype.key = function() {
        x("Firebase.DataSnapshot.key", 0, 0, arguments.length);
        return this.V.key();
      };
      S.prototype.key = S.prototype.key;
      S.prototype.Db = function() {
        x("Firebase.DataSnapshot.numChildren", 0, 0, arguments.length);
        return this.B.Db();
      };
      S.prototype.numChildren = S.prototype.Db;
      S.prototype.lc = function() {
        x("Firebase.DataSnapshot.ref", 0, 0, arguments.length);
        return this.V;
      };
      S.prototype.ref = S.prototype.lc;
      function Nh(a, b) {
        this.H = a;
        this.Va = Ob(a);
        this.ea = new ub;
        this.Ed = 1;
        this.Ra = null;
        b || 0 <= ("object" === typeof window && window.navigator && window.navigator.userAgent || "").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i) ? (this.ca = new Ae(this.H, q(this.Gb, this)), setTimeout(q(this.Tc, this, !0), 0)) : this.ca = this.Ra = new zh(this.H, q(this.Gb, this), q(this.Tc, this), q(this.Ne, this));
        this.Pg = Pb(a, q(function() {
          return new Jb(this.Va, this.ca);
        }, this));
        this.tc = new Cf;
        this.Be = new nb;
        var c = this;
        this.zd = new gf({
          Xe: function(a, b, f, g) {
            b = [];
            f = c.Be.j(a.path);
            f.e() || (b = jf(c.zd, new Ub(ze, a.path, f)), setTimeout(function() {
              g("ok");
            }, 0));
            return b;
          },
          Zd: ba
        });
        Oh(this, "connected", !1);
        this.ka = new qc;
        this.P = new Hg(a, q(this.ca.P, this.ca), q(this.ca.ee, this.ca), q(this.Ke, this));
        this.pd = 0;
        this.Ce = null;
        this.O = new gf({
          Xe: function(a, b, f, g) {
            c.ca.xf(a, f, b, function(b, e) {
              var f = g(b, e);
              zb(c.ea, a.path, f);
            });
            return [];
          },
          Zd: function(a, b) {
            c.ca.Of(a, b);
          }
        });
      }
      h = Nh.prototype;
      h.toString = function() {
        return (this.H.lb ? "https://" : "http://") + this.H.host;
      };
      h.name = function() {
        return this.H.Cb;
      };
      function Ph(a) {
        a = a.Be.j(new K(".info/serverTimeOffset")).K() || 0;
        return (new Date).getTime() + a;
      }
      function Qh(a) {
        a = a = {timestamp: Ph(a)};
        a.timestamp = a.timestamp || (new Date).getTime();
        return a;
      }
      h.Gb = function(a, b, c, d) {
        this.pd++;
        var e = new K(a);
        b = this.Ce ? this.Ce(a, b) : b;
        a = [];
        d ? c ? (b = na(b, function(a) {
          return L(a);
        }), a = rf(this.O, e, b, d)) : (b = L(b), a = nf(this.O, e, b, d)) : c ? (d = na(b, function(a) {
          return L(a);
        }), a = mf(this.O, e, d)) : (d = L(b), a = jf(this.O, new Ub(ze, e, d)));
        d = e;
        0 < a.length && (d = Rh(this, e));
        zb(this.ea, d, a);
      };
      h.Tc = function(a) {
        Oh(this, "connected", a);
        !1 === a && Sh(this);
      };
      h.Ne = function(a) {
        var b = this;
        Yc(a, function(a, d) {
          Oh(b, d, a);
        });
      };
      h.Ke = function(a) {
        Oh(this, "authenticated", a);
      };
      function Oh(a, b, c) {
        b = new K("/.info/" + b);
        c = L(c);
        var d = a.Be;
        d.Sd = d.Sd.G(b, c);
        c = jf(a.zd, new Ub(ze, b, c));
        zb(a.ea, b, c);
      }
      h.Kb = function(a, b, c, d) {
        this.f("set", {
          path: a.toString(),
          value: b,
          Xg: c
        });
        var e = Qh(this);
        b = L(b, c);
        var e = sc(b, e),
            f = this.Ed++,
            e = hf(this.O, a, e, f, !0);
        vb(this.ea, e);
        var g = this;
        this.ca.put(a.toString(), b.K(!0), function(b, c) {
          var e = "ok" === b;
          e || Q("set at " + a + " failed: " + b);
          e = lf(g.O, f, !e);
          zb(g.ea, a, e);
          Th(d, b, c);
        });
        e = Uh(this, a);
        Rh(this, e);
        zb(this.ea, e, []);
      };
      h.update = function(a, b, c) {
        this.f("update", {
          path: a.toString(),
          value: b
        });
        var d = !0,
            e = Qh(this),
            f = {};
        r(b, function(a, b) {
          d = !1;
          var c = L(a);
          f[b] = sc(c, e);
        });
        if (d)
          Bb("update() called with empty data.  Don't do anything."), Th(c, "ok");
        else {
          var g = this.Ed++,
              k = kf(this.O, a, f, g);
          vb(this.ea, k);
          var l = this;
          this.ca.yf(a.toString(), b, function(b, d) {
            var e = "ok" === b;
            e || Q("update at " + a + " failed: " + b);
            var e = lf(l.O, g, !e),
                f = a;
            0 < e.length && (f = Rh(l, a));
            zb(l.ea, f, e);
            Th(c, b, d);
          });
          b = Uh(this, a);
          Rh(this, b);
          zb(this.ea, a, []);
        }
      };
      function Sh(a) {
        a.f("onDisconnectEvents");
        var b = Qh(a),
            c = [];
        rc(pc(a.ka, b), F, function(b, e) {
          c = c.concat(jf(a.O, new Ub(ze, b, e)));
          var f = Uh(a, b);
          Rh(a, f);
        });
        a.ka = new qc;
        zb(a.ea, F, c);
      }
      h.Gd = function(a, b) {
        var c = this;
        this.ca.Gd(a.toString(), function(d, e) {
          "ok" === d && gg(c.ka, a);
          Th(b, d, e);
        });
      };
      function Vh(a, b, c, d) {
        var e = L(c);
        a.ca.Le(b.toString(), e.K(!0), function(c, g) {
          "ok" === c && a.ka.mc(b, e);
          Th(d, c, g);
        });
      }
      function Wh(a, b, c, d, e) {
        var f = L(c, d);
        a.ca.Le(b.toString(), f.K(!0), function(c, d) {
          "ok" === c && a.ka.mc(b, f);
          Th(e, c, d);
        });
      }
      function Xh(a, b, c, d) {
        var e = !0,
            f;
        for (f in c)
          e = !1;
        e ? (Bb("onDisconnect().update() called with empty data.  Don't do anything."), Th(d, "ok")) : a.ca.Bf(b.toString(), c, function(e, f) {
          if ("ok" === e)
            for (var l in c) {
              var m = L(c[l]);
              a.ka.mc(b.w(l), m);
            }
          Th(d, e, f);
        });
      }
      function Yh(a, b, c) {
        c = ".info" === O(b.path) ? a.zd.Ob(b, c) : a.O.Ob(b, c);
        xb(a.ea, b.path, c);
      }
      h.yb = function() {
        this.Ra && this.Ra.yb();
      };
      h.qc = function() {
        this.Ra && this.Ra.qc();
      };
      h.Ye = function(a) {
        if ("undefined" !== typeof console) {
          a ? (this.Yd || (this.Yd = new Ib(this.Va)), a = this.Yd.get()) : a = this.Va.get();
          var b = Ra(sa(a), function(a, b) {
            return Math.max(b.length, a);
          }, 0),
              c;
          for (c in a) {
            for (var d = a[c],
                e = c.length; e < b + 2; e++)
              c += " ";
            console.log(c + d);
          }
        }
      };
      h.Ze = function(a) {
        Lb(this.Va, a);
        this.Pg.Mf[a] = !0;
      };
      h.f = function(a) {
        var b = "";
        this.Ra && (b = this.Ra.id + ":");
        Bb(b, arguments);
      };
      function Th(a, b, c) {
        a && Cb(function() {
          if ("ok" == b)
            a(null);
          else {
            var d = (b || "error").toUpperCase(),
                e = d;
            c && (e += ": " + c);
            e = Error(e);
            e.code = d;
            a(e);
          }
        });
      }
      ;
      function Zh(a, b, c, d, e) {
        function f() {}
        a.f("transaction on " + b);
        var g = new U(a, b);
        g.Eb("value", f);
        c = {
          path: b,
          update: c,
          J: d,
          status: null,
          Ef: Gc(),
          cf: e,
          Kf: 0,
          ge: function() {
            g.gc("value", f);
          },
          je: null,
          Aa: null,
          md: null,
          nd: null,
          od: null
        };
        d = a.O.ua(b, void 0) || C;
        c.md = d;
        d = c.update(d.K());
        if (n(d)) {
          Tf("transaction failed: Data returned ", d, c.path);
          c.status = 1;
          e = Df(a.tc, b);
          var k = e.Ba() || [];
          k.push(c);
          Ef(e, k);
          "object" === typeof d && null !== d && u(d, ".priority") ? (k = w(d, ".priority"), J(Rf(k), "Invalid priority returned by transaction. Priority must be a valid string, finite number, server value, or null.")) : k = (a.O.ua(b) || C).A().K();
          e = Qh(a);
          d = L(d, k);
          e = sc(d, e);
          c.nd = d;
          c.od = e;
          c.Aa = a.Ed++;
          c = hf(a.O, b, e, c.Aa, c.cf);
          zb(a.ea, b, c);
          $h(a);
        } else
          c.ge(), c.nd = null, c.od = null, c.J && (a = new S(c.md, new U(a, c.path), M), c.J(null, !1, a));
      }
      function $h(a, b) {
        var c = b || a.tc;
        b || ai(a, c);
        if (null !== c.Ba()) {
          var d = bi(a, c);
          J(0 < d.length, "Sending zero length transaction queue");
          Sa(d, function(a) {
            return 1 === a.status;
          }) && ci(a, c.path(), d);
        } else
          c.td() && c.U(function(b) {
            $h(a, b);
          });
      }
      function ci(a, b, c) {
        for (var d = Qa(c, function(a) {
          return a.Aa;
        }),
            e = a.O.ua(b, d) || C,
            d = e,
            e = e.hash(),
            f = 0; f < c.length; f++) {
          var g = c[f];
          J(1 === g.status, "tryToSendTransactionQueue_: items in queue should all be run.");
          g.status = 2;
          g.Kf++;
          var k = N(b, g.path),
              d = d.G(k, g.nd);
        }
        d = d.K(!0);
        a.ca.put(b.toString(), d, function(d) {
          a.f("transaction put response", {
            path: b.toString(),
            status: d
          });
          var e = [];
          if ("ok" === d) {
            d = [];
            for (f = 0; f < c.length; f++) {
              c[f].status = 3;
              e = e.concat(lf(a.O, c[f].Aa));
              if (c[f].J) {
                var g = c[f].od,
                    k = new U(a, c[f].path);
                d.push(q(c[f].J, null, null, !0, new S(g, k, M)));
              }
              c[f].ge();
            }
            ai(a, Df(a.tc, b));
            $h(a);
            zb(a.ea, b, e);
            for (f = 0; f < d.length; f++)
              Cb(d[f]);
          } else {
            if ("datastale" === d)
              for (f = 0; f < c.length; f++)
                c[f].status = 4 === c[f].status ? 5 : 1;
            else
              for (Q("transaction at " + b.toString() + " failed: " + d), f = 0; f < c.length; f++)
                c[f].status = 5, c[f].je = d;
            Rh(a, b);
          }
        }, e);
      }
      function Rh(a, b) {
        var c = di(a, b),
            d = c.path(),
            c = bi(a, c);
        ei(a, c, d);
        return d;
      }
      function ei(a, b, c) {
        if (0 !== b.length) {
          for (var d = [],
              e = [],
              f = Qa(b, function(a) {
                return a.Aa;
              }),
              g = 0; g < b.length; g++) {
            var k = b[g],
                l = N(c, k.path),
                m = !1,
                v;
            J(null !== l, "rerunTransactionsUnderNode_: relativePath should not be null.");
            if (5 === k.status)
              m = !0, v = k.je, e = e.concat(lf(a.O, k.Aa, !0));
            else if (1 === k.status)
              if (25 <= k.Kf)
                m = !0, v = "maxretry", e = e.concat(lf(a.O, k.Aa, !0));
              else {
                var y = a.O.ua(k.path, f) || C;
                k.md = y;
                var I = b[g].update(y.K());
                n(I) ? (Tf("transaction failed: Data returned ", I, k.path), l = L(I), "object" === typeof I && null != I && u(I, ".priority") || (l = l.da(y.A())), y = k.Aa, I = Qh(a), I = sc(l, I), k.nd = l, k.od = I, k.Aa = a.Ed++, Va(f, y), e = e.concat(hf(a.O, k.path, I, k.Aa, k.cf)), e = e.concat(lf(a.O, y, !0))) : (m = !0, v = "nodata", e = e.concat(lf(a.O, k.Aa, !0)));
              }
            zb(a.ea, c, e);
            e = [];
            m && (b[g].status = 3, setTimeout(b[g].ge, Math.floor(0)), b[g].J && ("nodata" === v ? (k = new U(a, b[g].path), d.push(q(b[g].J, null, null, !1, new S(b[g].md, k, M)))) : d.push(q(b[g].J, null, Error(v), !1, null))));
          }
          ai(a, a.tc);
          for (g = 0; g < d.length; g++)
            Cb(d[g]);
          $h(a);
        }
      }
      function di(a, b) {
        for (var c,
            d = a.tc; null !== (c = O(b)) && null === d.Ba(); )
          d = Df(d, c), b = G(b);
        return d;
      }
      function bi(a, b) {
        var c = [];
        fi(a, b, c);
        c.sort(function(a, b) {
          return a.Ef - b.Ef;
        });
        return c;
      }
      function fi(a, b, c) {
        var d = b.Ba();
        if (null !== d)
          for (var e = 0; e < d.length; e++)
            c.push(d[e]);
        b.U(function(b) {
          fi(a, b, c);
        });
      }
      function ai(a, b) {
        var c = b.Ba();
        if (c) {
          for (var d = 0,
              e = 0; e < c.length; e++)
            3 !== c[e].status && (c[d] = c[e], d++);
          c.length = d;
          Ef(b, 0 < c.length ? c : null);
        }
        b.U(function(b) {
          ai(a, b);
        });
      }
      function Uh(a, b) {
        var c = di(a, b).path(),
            d = Df(a.tc, b);
        Hf(d, function(b) {
          gi(a, b);
        });
        gi(a, d);
        Gf(d, function(b) {
          gi(a, b);
        });
        return c;
      }
      function gi(a, b) {
        var c = b.Ba();
        if (null !== c) {
          for (var d = [],
              e = [],
              f = -1,
              g = 0; g < c.length; g++)
            4 !== c[g].status && (2 === c[g].status ? (J(f === g - 1, "All SENT items should be at beginning of queue."), f = g, c[g].status = 4, c[g].je = "set") : (J(1 === c[g].status, "Unexpected transaction status in abort"), c[g].ge(), e = e.concat(lf(a.O, c[g].Aa, !0)), c[g].J && d.push(q(c[g].J, null, Error("set"), !1, null))));
          -1 === f ? Ef(b, null) : c.length = f + 1;
          zb(a.ea, b.path(), e);
          for (g = 0; g < d.length; g++)
            Cb(d[g]);
        }
      }
      ;
      function W() {
        this.nc = {};
        this.Pf = !1;
      }
      ca(W);
      W.prototype.yb = function() {
        for (var a in this.nc)
          this.nc[a].yb();
      };
      W.prototype.interrupt = W.prototype.yb;
      W.prototype.qc = function() {
        for (var a in this.nc)
          this.nc[a].qc();
      };
      W.prototype.resume = W.prototype.qc;
      W.prototype.ue = function() {
        this.Pf = !0;
      };
      function X(a, b) {
        this.ad = a;
        this.qa = b;
      }
      X.prototype.cancel = function(a) {
        x("Firebase.onDisconnect().cancel", 0, 1, arguments.length);
        A("Firebase.onDisconnect().cancel", 1, a, !0);
        this.ad.Gd(this.qa, a || null);
      };
      X.prototype.cancel = X.prototype.cancel;
      X.prototype.remove = function(a) {
        x("Firebase.onDisconnect().remove", 0, 1, arguments.length);
        Zf("Firebase.onDisconnect().remove", this.qa);
        A("Firebase.onDisconnect().remove", 1, a, !0);
        Vh(this.ad, this.qa, null, a);
      };
      X.prototype.remove = X.prototype.remove;
      X.prototype.set = function(a, b) {
        x("Firebase.onDisconnect().set", 1, 2, arguments.length);
        Zf("Firebase.onDisconnect().set", this.qa);
        Sf("Firebase.onDisconnect().set", a, this.qa, !1);
        A("Firebase.onDisconnect().set", 2, b, !0);
        Vh(this.ad, this.qa, a, b);
      };
      X.prototype.set = X.prototype.set;
      X.prototype.Kb = function(a, b, c) {
        x("Firebase.onDisconnect().setWithPriority", 2, 3, arguments.length);
        Zf("Firebase.onDisconnect().setWithPriority", this.qa);
        Sf("Firebase.onDisconnect().setWithPriority", a, this.qa, !1);
        Vf("Firebase.onDisconnect().setWithPriority", 2, b);
        A("Firebase.onDisconnect().setWithPriority", 3, c, !0);
        Wh(this.ad, this.qa, a, b, c);
      };
      X.prototype.setWithPriority = X.prototype.Kb;
      X.prototype.update = function(a, b) {
        x("Firebase.onDisconnect().update", 1, 2, arguments.length);
        Zf("Firebase.onDisconnect().update", this.qa);
        if (ea(a)) {
          for (var c = {},
              d = 0; d < a.length; ++d)
            c["" + d] = a[d];
          a = c;
          Q("Passing an Array to Firebase.onDisconnect().update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.");
        }
        Uf("Firebase.onDisconnect().update", a, this.qa);
        A("Firebase.onDisconnect().update", 2, b, !0);
        Xh(this.ad, this.qa, a, b);
      };
      X.prototype.update = X.prototype.update;
      function Y(a, b, c, d) {
        this.k = a;
        this.path = b;
        this.o = c;
        this.jc = d;
      }
      function hi(a) {
        var b = null,
            c = null;
        a.la && (b = od(a));
        a.na && (c = qd(a));
        if (a.g === Vd) {
          if (a.la) {
            if ("[MIN_NAME]" != nd(a))
              throw Error("Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().");
            if ("string" !== typeof b)
              throw Error("Query: When ordering by key, the argument passed to startAt(), endAt(),or equalTo() must be a string.");
          }
          if (a.na) {
            if ("[MAX_NAME]" != pd(a))
              throw Error("Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().");
            if ("string" !== typeof c)
              throw Error("Query: When ordering by key, the argument passed to startAt(), endAt(),or equalTo() must be a string.");
          }
        } else if (a.g === M) {
          if (null != b && !Rf(b) || null != c && !Rf(c))
            throw Error("Query: When ordering by priority, the first argument passed to startAt(), endAt(), or equalTo() must be a valid priority value (null, a number, or a string).");
        } else if (J(a.g instanceof Rd || a.g === Yd, "unknown index type."), null != b && "object" === typeof b || null != c && "object" === typeof c)
          throw Error("Query: First argument passed to startAt(), endAt(), or equalTo() cannot be an object.");
      }
      function ii(a) {
        if (a.la && a.na && a.ia && (!a.ia || "" === a.Nb))
          throw Error("Query: Can't combine startAt(), endAt(), and limit(). Use limitToFirst() or limitToLast() instead.");
      }
      function ji(a, b) {
        if (!0 === a.jc)
          throw Error(b + ": You can't combine multiple orderBy calls.");
      }
      Y.prototype.lc = function() {
        x("Query.ref", 0, 0, arguments.length);
        return new U(this.k, this.path);
      };
      Y.prototype.ref = Y.prototype.lc;
      Y.prototype.Eb = function(a, b, c, d) {
        x("Query.on", 2, 4, arguments.length);
        Wf("Query.on", a, !1);
        A("Query.on", 2, b, !1);
        var e = ki("Query.on", c, d);
        if ("value" === a)
          Yh(this.k, this, new jd(b, e.cancel || null, e.Ma || null));
        else {
          var f = {};
          f[a] = b;
          Yh(this.k, this, new kd(f, e.cancel, e.Ma));
        }
        return b;
      };
      Y.prototype.on = Y.prototype.Eb;
      Y.prototype.gc = function(a, b, c) {
        x("Query.off", 0, 3, arguments.length);
        Wf("Query.off", a, !0);
        A("Query.off", 2, b, !0);
        lb("Query.off", 3, c);
        var d = null,
            e = null;
        "value" === a ? d = new jd(b || null, null, c || null) : a && (b && (e = {}, e[a] = b), d = new kd(e, null, c || null));
        e = this.k;
        d = ".info" === O(this.path) ? e.zd.kb(this, d) : e.O.kb(this, d);
        xb(e.ea, this.path, d);
      };
      Y.prototype.off = Y.prototype.gc;
      Y.prototype.Ag = function(a, b) {
        function c(g) {
          f && (f = !1, e.gc(a, c), b.call(d.Ma, g));
        }
        x("Query.once", 2, 4, arguments.length);
        Wf("Query.once", a, !1);
        A("Query.once", 2, b, !1);
        var d = ki("Query.once", arguments[2], arguments[3]),
            e = this,
            f = !0;
        this.Eb(a, c, function(b) {
          e.gc(a, c);
          d.cancel && d.cancel.call(d.Ma, b);
        });
      };
      Y.prototype.once = Y.prototype.Ag;
      Y.prototype.Ge = function(a) {
        Q("Query.limit() being deprecated. Please use Query.limitToFirst() or Query.limitToLast() instead.");
        x("Query.limit", 1, 1, arguments.length);
        if (!ga(a) || Math.floor(a) !== a || 0 >= a)
          throw Error("Query.limit: First argument must be a positive integer.");
        if (this.o.ia)
          throw Error("Query.limit: Limit was already set (by another call to limit, limitToFirst, orlimitToLast.");
        var b = this.o.Ge(a);
        ii(b);
        return new Y(this.k, this.path, b, this.jc);
      };
      Y.prototype.limit = Y.prototype.Ge;
      Y.prototype.He = function(a) {
        x("Query.limitToFirst", 1, 1, arguments.length);
        if (!ga(a) || Math.floor(a) !== a || 0 >= a)
          throw Error("Query.limitToFirst: First argument must be a positive integer.");
        if (this.o.ia)
          throw Error("Query.limitToFirst: Limit was already set (by another call to limit, limitToFirst, or limitToLast).");
        return new Y(this.k, this.path, this.o.He(a), this.jc);
      };
      Y.prototype.limitToFirst = Y.prototype.He;
      Y.prototype.Ie = function(a) {
        x("Query.limitToLast", 1, 1, arguments.length);
        if (!ga(a) || Math.floor(a) !== a || 0 >= a)
          throw Error("Query.limitToLast: First argument must be a positive integer.");
        if (this.o.ia)
          throw Error("Query.limitToLast: Limit was already set (by another call to limit, limitToFirst, or limitToLast).");
        return new Y(this.k, this.path, this.o.Ie(a), this.jc);
      };
      Y.prototype.limitToLast = Y.prototype.Ie;
      Y.prototype.Bg = function(a) {
        x("Query.orderByChild", 1, 1, arguments.length);
        if ("$key" === a)
          throw Error('Query.orderByChild: "$key" is invalid.  Use Query.orderByKey() instead.');
        if ("$priority" === a)
          throw Error('Query.orderByChild: "$priority" is invalid.  Use Query.orderByPriority() instead.');
        if ("$value" === a)
          throw Error('Query.orderByChild: "$value" is invalid.  Use Query.orderByValue() instead.');
        Xf("Query.orderByChild", 1, a, !1);
        ji(this, "Query.orderByChild");
        var b = be(this.o, new Rd(a));
        hi(b);
        return new Y(this.k, this.path, b, !0);
      };
      Y.prototype.orderByChild = Y.prototype.Bg;
      Y.prototype.Cg = function() {
        x("Query.orderByKey", 0, 0, arguments.length);
        ji(this, "Query.orderByKey");
        var a = be(this.o, Vd);
        hi(a);
        return new Y(this.k, this.path, a, !0);
      };
      Y.prototype.orderByKey = Y.prototype.Cg;
      Y.prototype.Dg = function() {
        x("Query.orderByPriority", 0, 0, arguments.length);
        ji(this, "Query.orderByPriority");
        var a = be(this.o, M);
        hi(a);
        return new Y(this.k, this.path, a, !0);
      };
      Y.prototype.orderByPriority = Y.prototype.Dg;
      Y.prototype.Eg = function() {
        x("Query.orderByValue", 0, 0, arguments.length);
        ji(this, "Query.orderByValue");
        var a = be(this.o, Yd);
        hi(a);
        return new Y(this.k, this.path, a, !0);
      };
      Y.prototype.orderByValue = Y.prototype.Eg;
      Y.prototype.Xd = function(a, b) {
        x("Query.startAt", 0, 2, arguments.length);
        Sf("Query.startAt", a, this.path, !0);
        Xf("Query.startAt", 2, b, !0);
        var c = this.o.Xd(a, b);
        ii(c);
        hi(c);
        if (this.o.la)
          throw Error("Query.startAt: Starting point was already set (by another call to startAt or equalTo).");
        n(a) || (b = a = null);
        return new Y(this.k, this.path, c, this.jc);
      };
      Y.prototype.startAt = Y.prototype.Xd;
      Y.prototype.qd = function(a, b) {
        x("Query.endAt", 0, 2, arguments.length);
        Sf("Query.endAt", a, this.path, !0);
        Xf("Query.endAt", 2, b, !0);
        var c = this.o.qd(a, b);
        ii(c);
        hi(c);
        if (this.o.na)
          throw Error("Query.endAt: Ending point was already set (by another call to endAt or equalTo).");
        return new Y(this.k, this.path, c, this.jc);
      };
      Y.prototype.endAt = Y.prototype.qd;
      Y.prototype.hg = function(a, b) {
        x("Query.equalTo", 1, 2, arguments.length);
        Sf("Query.equalTo", a, this.path, !1);
        Xf("Query.equalTo", 2, b, !0);
        if (this.o.la)
          throw Error("Query.equalTo: Starting point was already set (by another call to endAt or equalTo).");
        if (this.o.na)
          throw Error("Query.equalTo: Ending point was already set (by another call to endAt or equalTo).");
        return this.Xd(a, b).qd(a, b);
      };
      Y.prototype.equalTo = Y.prototype.hg;
      Y.prototype.toString = function() {
        x("Query.toString", 0, 0, arguments.length);
        for (var a = this.path,
            b = "",
            c = a.Y; c < a.n.length; c++)
          "" !== a.n[c] && (b += "/" + encodeURIComponent(String(a.n[c])));
        return this.k.toString() + (b || "/");
      };
      Y.prototype.toString = Y.prototype.toString;
      Y.prototype.wa = function() {
        var a = Wc(ce(this.o));
        return "{}" === a ? "default" : a;
      };
      function ki(a, b, c) {
        var d = {
          cancel: null,
          Ma: null
        };
        if (b && c)
          d.cancel = b, A(a, 3, d.cancel, !0), d.Ma = c, lb(a, 4, d.Ma);
        else if (b)
          if ("object" === typeof b && null !== b)
            d.Ma = b;
          else if ("function" === typeof b)
            d.cancel = b;
          else
            throw Error(z(a, 3, !0) + " must either be a cancel callback or a context object.");
        return d;
      }
      ;
      var Z = {};
      Z.vc = zh;
      Z.DataConnection = Z.vc;
      zh.prototype.Og = function(a, b) {
        this.Da("q", {p: a}, b);
      };
      Z.vc.prototype.simpleListen = Z.vc.prototype.Og;
      zh.prototype.gg = function(a, b) {
        this.Da("echo", {d: a}, b);
      };
      Z.vc.prototype.echo = Z.vc.prototype.gg;
      zh.prototype.interrupt = zh.prototype.yb;
      Z.Sf = nh;
      Z.RealTimeConnection = Z.Sf;
      nh.prototype.sendRequest = nh.prototype.Da;
      nh.prototype.close = nh.prototype.close;
      Z.og = function(a) {
        var b = zh.prototype.put;
        zh.prototype.put = function(c, d, e, f) {
          n(f) && (f = a());
          b.call(this, c, d, e, f);
        };
        return function() {
          zh.prototype.put = b;
        };
      };
      Z.hijackHash = Z.og;
      Z.Rf = Ec;
      Z.ConnectionTarget = Z.Rf;
      Z.wa = function(a) {
        return a.wa();
      };
      Z.queryIdentifier = Z.wa;
      Z.qg = function(a) {
        return a.k.Ra.aa;
      };
      Z.listens = Z.qg;
      Z.ue = function(a) {
        a.ue();
      };
      Z.forceRestClient = Z.ue;
      function U(a, b) {
        var c,
            d,
            e;
        if (a instanceof Nh)
          c = a, d = b;
        else {
          x("new Firebase", 1, 2, arguments.length);
          d = Rc(arguments[0]);
          c = d.Qg;
          "firebase" === d.domain && Qc(d.host + " is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead");
          c && "undefined" != c || Qc("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com");
          d.lb || "undefined" !== typeof window && window.location && window.location.protocol && -1 !== window.location.protocol.indexOf("https:") && Q("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().");
          c = new Ec(d.host, d.lb, c, "ws" === d.scheme || "wss" === d.scheme);
          d = new K(d.Zc);
          e = d.toString();
          var f;
          !(f = !p(c.host) || 0 === c.host.length || !Qf(c.Cb)) && (f = 0 !== e.length) && (e && (e = e.replace(/^\/*\.info(\/|$)/, "/")), f = !(p(e) && 0 !== e.length && !Of.test(e)));
          if (f)
            throw Error(z("new Firebase", 1, !1) + 'must be a valid firebase URL and the path can\'t contain ".", "#", "$", "[", or "]".');
          if (b)
            if (b instanceof W)
              e = b;
            else if (p(b))
              e = W.ub(), c.Ld = b;
            else
              throw Error("Expected a valid Firebase.Context for second argument to new Firebase()");
          else
            e = W.ub();
          f = c.toString();
          var g = w(e.nc, f);
          g || (g = new Nh(c, e.Pf), e.nc[f] = g);
          c = g;
        }
        Y.call(this, c, d, $d, !1);
      }
      ma(U, Y);
      var li = U,
          mi = ["Firebase"],
          ni = aa;
      mi[0] in ni || !ni.execScript || ni.execScript("var " + mi[0]);
      for (var oi; mi.length && (oi = mi.shift()); )
        !mi.length && n(li) ? ni[oi] = li : ni = ni[oi] ? ni[oi] : ni[oi] = {};
      U.prototype.name = function() {
        Q("Firebase.name() being deprecated. Please use Firebase.key() instead.");
        x("Firebase.name", 0, 0, arguments.length);
        return this.key();
      };
      U.prototype.name = U.prototype.name;
      U.prototype.key = function() {
        x("Firebase.key", 0, 0, arguments.length);
        return this.path.e() ? null : vc(this.path);
      };
      U.prototype.key = U.prototype.key;
      U.prototype.w = function(a) {
        x("Firebase.child", 1, 1, arguments.length);
        if (ga(a))
          a = String(a);
        else if (!(a instanceof K))
          if (null === O(this.path)) {
            var b = a;
            b && (b = b.replace(/^\/*\.info(\/|$)/, "/"));
            Yf("Firebase.child", b);
          } else
            Yf("Firebase.child", a);
        return new U(this.k, this.path.w(a));
      };
      U.prototype.child = U.prototype.w;
      U.prototype.parent = function() {
        x("Firebase.parent", 0, 0, arguments.length);
        var a = this.path.parent();
        return null === a ? null : new U(this.k, a);
      };
      U.prototype.parent = U.prototype.parent;
      U.prototype.root = function() {
        x("Firebase.ref", 0, 0, arguments.length);
        for (var a = this; null !== a.parent(); )
          a = a.parent();
        return a;
      };
      U.prototype.root = U.prototype.root;
      U.prototype.set = function(a, b) {
        x("Firebase.set", 1, 2, arguments.length);
        Zf("Firebase.set", this.path);
        Sf("Firebase.set", a, this.path, !1);
        A("Firebase.set", 2, b, !0);
        this.k.Kb(this.path, a, null, b || null);
      };
      U.prototype.set = U.prototype.set;
      U.prototype.update = function(a, b) {
        x("Firebase.update", 1, 2, arguments.length);
        Zf("Firebase.update", this.path);
        if (ea(a)) {
          for (var c = {},
              d = 0; d < a.length; ++d)
            c["" + d] = a[d];
          a = c;
          Q("Passing an Array to Firebase.update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.");
        }
        Uf("Firebase.update", a, this.path);
        A("Firebase.update", 2, b, !0);
        this.k.update(this.path, a, b || null);
      };
      U.prototype.update = U.prototype.update;
      U.prototype.Kb = function(a, b, c) {
        x("Firebase.setWithPriority", 2, 3, arguments.length);
        Zf("Firebase.setWithPriority", this.path);
        Sf("Firebase.setWithPriority", a, this.path, !1);
        Vf("Firebase.setWithPriority", 2, b);
        A("Firebase.setWithPriority", 3, c, !0);
        if (".length" === this.key() || ".keys" === this.key())
          throw "Firebase.setWithPriority failed: " + this.key() + " is a read-only object.";
        this.k.Kb(this.path, a, b, c || null);
      };
      U.prototype.setWithPriority = U.prototype.Kb;
      U.prototype.remove = function(a) {
        x("Firebase.remove", 0, 1, arguments.length);
        Zf("Firebase.remove", this.path);
        A("Firebase.remove", 1, a, !0);
        this.set(null, a);
      };
      U.prototype.remove = U.prototype.remove;
      U.prototype.transaction = function(a, b, c) {
        x("Firebase.transaction", 1, 3, arguments.length);
        Zf("Firebase.transaction", this.path);
        A("Firebase.transaction", 1, a, !1);
        A("Firebase.transaction", 2, b, !0);
        if (n(c) && "boolean" != typeof c)
          throw Error(z("Firebase.transaction", 3, !0) + "must be a boolean.");
        if (".length" === this.key() || ".keys" === this.key())
          throw "Firebase.transaction failed: " + this.key() + " is a read-only object.";
        "undefined" === typeof c && (c = !0);
        Zh(this.k, this.path, a, b || null, c);
      };
      U.prototype.transaction = U.prototype.transaction;
      U.prototype.Lg = function(a, b) {
        x("Firebase.setPriority", 1, 2, arguments.length);
        Zf("Firebase.setPriority", this.path);
        Vf("Firebase.setPriority", 1, a);
        A("Firebase.setPriority", 2, b, !0);
        this.k.Kb(this.path.w(".priority"), a, null, b);
      };
      U.prototype.setPriority = U.prototype.Lg;
      U.prototype.push = function(a, b) {
        x("Firebase.push", 0, 2, arguments.length);
        Zf("Firebase.push", this.path);
        Sf("Firebase.push", a, this.path, !0);
        A("Firebase.push", 2, b, !0);
        var c = Ph(this.k),
            c = Kf(c),
            c = this.w(c);
        "undefined" !== typeof a && null !== a && c.set(a, b);
        return c;
      };
      U.prototype.push = U.prototype.push;
      U.prototype.jb = function() {
        Zf("Firebase.onDisconnect", this.path);
        return new X(this.k, this.path);
      };
      U.prototype.onDisconnect = U.prototype.jb;
      U.prototype.P = function(a, b, c) {
        Q("FirebaseRef.auth() being deprecated. Please use FirebaseRef.authWithCustomToken() instead.");
        x("Firebase.auth", 1, 3, arguments.length);
        $f("Firebase.auth", a);
        A("Firebase.auth", 2, b, !0);
        A("Firebase.auth", 3, b, !0);
        Ng(this.k.P, a, {}, {remember: "none"}, b, c);
      };
      U.prototype.auth = U.prototype.P;
      U.prototype.ee = function(a) {
        x("Firebase.unauth", 0, 1, arguments.length);
        A("Firebase.unauth", 1, a, !0);
        Og(this.k.P, a);
      };
      U.prototype.unauth = U.prototype.ee;
      U.prototype.we = function() {
        x("Firebase.getAuth", 0, 0, arguments.length);
        return this.k.P.we();
      };
      U.prototype.getAuth = U.prototype.we;
      U.prototype.ug = function(a, b) {
        x("Firebase.onAuth", 1, 2, arguments.length);
        A("Firebase.onAuth", 1, a, !1);
        lb("Firebase.onAuth", 2, b);
        this.k.P.Eb("auth_status", a, b);
      };
      U.prototype.onAuth = U.prototype.ug;
      U.prototype.tg = function(a, b) {
        x("Firebase.offAuth", 1, 2, arguments.length);
        A("Firebase.offAuth", 1, a, !1);
        lb("Firebase.offAuth", 2, b);
        this.k.P.gc("auth_status", a, b);
      };
      U.prototype.offAuth = U.prototype.tg;
      U.prototype.Wf = function(a, b, c) {
        x("Firebase.authWithCustomToken", 2, 3, arguments.length);
        $f("Firebase.authWithCustomToken", a);
        A("Firebase.authWithCustomToken", 2, b, !1);
        cg("Firebase.authWithCustomToken", 3, c, !0);
        Ng(this.k.P, a, {}, c || {}, b);
      };
      U.prototype.authWithCustomToken = U.prototype.Wf;
      U.prototype.Xf = function(a, b, c) {
        x("Firebase.authWithOAuthPopup", 2, 3, arguments.length);
        bg("Firebase.authWithOAuthPopup", a);
        A("Firebase.authWithOAuthPopup", 2, b, !1);
        cg("Firebase.authWithOAuthPopup", 3, c, !0);
        Sg(this.k.P, a, c, b);
      };
      U.prototype.authWithOAuthPopup = U.prototype.Xf;
      U.prototype.Yf = function(a, b, c) {
        x("Firebase.authWithOAuthRedirect", 2, 3, arguments.length);
        bg("Firebase.authWithOAuthRedirect", a);
        A("Firebase.authWithOAuthRedirect", 2, b, !1);
        cg("Firebase.authWithOAuthRedirect", 3, c, !0);
        var d = this.k.P;
        Qg(d);
        var e = [zg],
            f = kg(c);
        "anonymous" === a || "firebase" === a ? R(b, Bg("TRANSPORT_UNAVAILABLE")) : (P.set("redirect_client_options", f.ld), Rg(d, e, "/auth/" + a, f, b));
      };
      U.prototype.authWithOAuthRedirect = U.prototype.Yf;
      U.prototype.Zf = function(a, b, c, d) {
        x("Firebase.authWithOAuthToken", 3, 4, arguments.length);
        bg("Firebase.authWithOAuthToken", a);
        A("Firebase.authWithOAuthToken", 3, c, !1);
        cg("Firebase.authWithOAuthToken", 4, d, !0);
        p(b) ? (ag("Firebase.authWithOAuthToken", 2, b), Pg(this.k.P, a + "/token", {access_token: b}, d, c)) : (cg("Firebase.authWithOAuthToken", 2, b, !1), Pg(this.k.P, a + "/token", b, d, c));
      };
      U.prototype.authWithOAuthToken = U.prototype.Zf;
      U.prototype.Vf = function(a, b) {
        x("Firebase.authAnonymously", 1, 2, arguments.length);
        A("Firebase.authAnonymously", 1, a, !1);
        cg("Firebase.authAnonymously", 2, b, !0);
        Pg(this.k.P, "anonymous", {}, b, a);
      };
      U.prototype.authAnonymously = U.prototype.Vf;
      U.prototype.$f = function(a, b, c) {
        x("Firebase.authWithPassword", 2, 3, arguments.length);
        cg("Firebase.authWithPassword", 1, a, !1);
        dg("Firebase.authWithPassword", a, "email");
        dg("Firebase.authWithPassword", a, "password");
        A("Firebase.authWithPassword", 2, b, !1);
        cg("Firebase.authWithPassword", 3, c, !0);
        Pg(this.k.P, "password", a, c, b);
      };
      U.prototype.authWithPassword = U.prototype.$f;
      U.prototype.re = function(a, b) {
        x("Firebase.createUser", 2, 2, arguments.length);
        cg("Firebase.createUser", 1, a, !1);
        dg("Firebase.createUser", a, "email");
        dg("Firebase.createUser", a, "password");
        A("Firebase.createUser", 2, b, !1);
        this.k.P.re(a, b);
      };
      U.prototype.createUser = U.prototype.re;
      U.prototype.Se = function(a, b) {
        x("Firebase.removeUser", 2, 2, arguments.length);
        cg("Firebase.removeUser", 1, a, !1);
        dg("Firebase.removeUser", a, "email");
        dg("Firebase.removeUser", a, "password");
        A("Firebase.removeUser", 2, b, !1);
        this.k.P.Se(a, b);
      };
      U.prototype.removeUser = U.prototype.Se;
      U.prototype.oe = function(a, b) {
        x("Firebase.changePassword", 2, 2, arguments.length);
        cg("Firebase.changePassword", 1, a, !1);
        dg("Firebase.changePassword", a, "email");
        dg("Firebase.changePassword", a, "oldPassword");
        dg("Firebase.changePassword", a, "newPassword");
        A("Firebase.changePassword", 2, b, !1);
        this.k.P.oe(a, b);
      };
      U.prototype.changePassword = U.prototype.oe;
      U.prototype.ne = function(a, b) {
        x("Firebase.changeEmail", 2, 2, arguments.length);
        cg("Firebase.changeEmail", 1, a, !1);
        dg("Firebase.changeEmail", a, "oldEmail");
        dg("Firebase.changeEmail", a, "newEmail");
        dg("Firebase.changeEmail", a, "password");
        A("Firebase.changeEmail", 2, b, !1);
        this.k.P.ne(a, b);
      };
      U.prototype.changeEmail = U.prototype.ne;
      U.prototype.Ue = function(a, b) {
        x("Firebase.resetPassword", 2, 2, arguments.length);
        cg("Firebase.resetPassword", 1, a, !1);
        dg("Firebase.resetPassword", a, "email");
        A("Firebase.resetPassword", 2, b, !1);
        this.k.P.Ue(a, b);
      };
      U.prototype.resetPassword = U.prototype.Ue;
      U.goOffline = function() {
        x("Firebase.goOffline", 0, 0, arguments.length);
        W.ub().yb();
      };
      U.goOnline = function() {
        x("Firebase.goOnline", 0, 0, arguments.length);
        W.ub().qc();
      };
      function Nc(a, b) {
        J(!b || !0 === a || !1 === a, "Can't turn on custom loggers persistently.");
        !0 === a ? ("undefined" !== typeof console && ("function" === typeof console.log ? Ab = q(console.log, console) : "object" === typeof console.log && (Ab = function(a) {
          console.log(a);
        })), b && P.set("logging_enabled", !0)) : a ? Ab = a : (Ab = null, P.remove("logging_enabled"));
      }
      U.enableLogging = Nc;
      U.ServerValue = {TIMESTAMP: {".sv": "timestamp"}};
      U.SDK_VERSION = "2.2.7";
      U.INTERNAL = V;
      U.Context = W;
      U.TEST_ACCESS = Z;
    })();
  })();
  return _retrieveGlobal();
});

System.registerDynamic("npm:fastclick@1.0.6/lib/fastclick.js", [], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  ;
  (function() {
    'use strict';
    function FastClick(layer, options) {
      var oldOnClick;
      options = options || {};
      this.trackingClick = false;
      this.trackingClickStart = 0;
      this.targetElement = null;
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.lastTouchIdentifier = 0;
      this.touchBoundary = options.touchBoundary || 10;
      this.layer = layer;
      this.tapDelay = options.tapDelay || 200;
      this.tapTimeout = options.tapTimeout || 700;
      if (FastClick.notNeeded(layer)) {
        return;
      }
      function bind(method, context) {
        return function() {
          return method.apply(context, arguments);
        };
      }
      var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
      var context = this;
      for (var i = 0,
          l = methods.length; i < l; i++) {
        context[methods[i]] = bind(context[methods[i]], context);
      }
      if (deviceIsAndroid) {
        layer.addEventListener('mouseover', this.onMouse, true);
        layer.addEventListener('mousedown', this.onMouse, true);
        layer.addEventListener('mouseup', this.onMouse, true);
      }
      layer.addEventListener('click', this.onClick, true);
      layer.addEventListener('touchstart', this.onTouchStart, false);
      layer.addEventListener('touchmove', this.onTouchMove, false);
      layer.addEventListener('touchend', this.onTouchEnd, false);
      layer.addEventListener('touchcancel', this.onTouchCancel, false);
      if (!Event.prototype.stopImmediatePropagation) {
        layer.removeEventListener = function(type, callback, capture) {
          var rmv = Node.prototype.removeEventListener;
          if (type === 'click') {
            rmv.call(layer, type, callback.hijacked || callback, capture);
          } else {
            rmv.call(layer, type, callback, capture);
          }
        };
        layer.addEventListener = function(type, callback, capture) {
          var adv = Node.prototype.addEventListener;
          if (type === 'click') {
            adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
              if (!event.propagationStopped) {
                callback(event);
              }
            }), capture);
          } else {
            adv.call(layer, type, callback, capture);
          }
        };
      }
      if (typeof layer.onclick === 'function') {
        oldOnClick = layer.onclick;
        layer.addEventListener('click', function(event) {
          oldOnClick(event);
        }, false);
        layer.onclick = null;
      }
    }
    var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;
    var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;
    var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;
    var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);
    var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);
    var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;
    FastClick.prototype.needsClick = function(target) {
      switch (target.nodeName.toLowerCase()) {
        case 'button':
        case 'select':
        case 'textarea':
          if (target.disabled) {
            return true;
          }
          break;
        case 'input':
          if ((deviceIsIOS && target.type === 'file') || target.disabled) {
            return true;
          }
          break;
        case 'label':
        case 'iframe':
        case 'video':
          return true;
      }
      return (/\bneedsclick\b/).test(target.className);
    };
    FastClick.prototype.needsFocus = function(target) {
      switch (target.nodeName.toLowerCase()) {
        case 'textarea':
          return true;
        case 'select':
          return !deviceIsAndroid;
        case 'input':
          switch (target.type) {
            case 'button':
            case 'checkbox':
            case 'file':
            case 'image':
            case 'radio':
            case 'submit':
              return false;
          }
          return !target.disabled && !target.readOnly;
        default:
          return (/\bneedsfocus\b/).test(target.className);
      }
    };
    FastClick.prototype.sendClick = function(targetElement, event) {
      var clickEvent,
          touch;
      if (document.activeElement && document.activeElement !== targetElement) {
        document.activeElement.blur();
      }
      touch = event.changedTouches[0];
      clickEvent = document.createEvent('MouseEvents');
      clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
      clickEvent.forwardedTouchEvent = true;
      targetElement.dispatchEvent(clickEvent);
    };
    FastClick.prototype.determineEventType = function(targetElement) {
      if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
        return 'mousedown';
      }
      return 'click';
    };
    FastClick.prototype.focus = function(targetElement) {
      var length;
      if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
        length = targetElement.value.length;
        targetElement.setSelectionRange(length, length);
      } else {
        targetElement.focus();
      }
    };
    FastClick.prototype.updateScrollParent = function(targetElement) {
      var scrollParent,
          parentElement;
      scrollParent = targetElement.fastClickScrollParent;
      if (!scrollParent || !scrollParent.contains(targetElement)) {
        parentElement = targetElement;
        do {
          if (parentElement.scrollHeight > parentElement.offsetHeight) {
            scrollParent = parentElement;
            targetElement.fastClickScrollParent = parentElement;
            break;
          }
          parentElement = parentElement.parentElement;
        } while (parentElement);
      }
      if (scrollParent) {
        scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
      }
    };
    FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
      if (eventTarget.nodeType === Node.TEXT_NODE) {
        return eventTarget.parentNode;
      }
      return eventTarget;
    };
    FastClick.prototype.onTouchStart = function(event) {
      var targetElement,
          touch,
          selection;
      if (event.targetTouches.length > 1) {
        return true;
      }
      targetElement = this.getTargetElementFromEventTarget(event.target);
      touch = event.targetTouches[0];
      if (deviceIsIOS) {
        selection = window.getSelection();
        if (selection.rangeCount && !selection.isCollapsed) {
          return true;
        }
        if (!deviceIsIOS4) {
          if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
            event.preventDefault();
            return false;
          }
          this.lastTouchIdentifier = touch.identifier;
          this.updateScrollParent(targetElement);
        }
      }
      this.trackingClick = true;
      this.trackingClickStart = event.timeStamp;
      this.targetElement = targetElement;
      this.touchStartX = touch.pageX;
      this.touchStartY = touch.pageY;
      if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
        event.preventDefault();
      }
      return true;
    };
    FastClick.prototype.touchHasMoved = function(event) {
      var touch = event.changedTouches[0],
          boundary = this.touchBoundary;
      if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
        return true;
      }
      return false;
    };
    FastClick.prototype.onTouchMove = function(event) {
      if (!this.trackingClick) {
        return true;
      }
      if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
        this.trackingClick = false;
        this.targetElement = null;
      }
      return true;
    };
    FastClick.prototype.findControl = function(labelElement) {
      if (labelElement.control !== undefined) {
        return labelElement.control;
      }
      if (labelElement.htmlFor) {
        return document.getElementById(labelElement.htmlFor);
      }
      return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
    };
    FastClick.prototype.onTouchEnd = function(event) {
      var forElement,
          trackingClickStart,
          targetTagName,
          scrollParent,
          touch,
          targetElement = this.targetElement;
      if (!this.trackingClick) {
        return true;
      }
      if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
        this.cancelNextClick = true;
        return true;
      }
      if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
        return true;
      }
      this.cancelNextClick = false;
      this.lastClickTime = event.timeStamp;
      trackingClickStart = this.trackingClickStart;
      this.trackingClick = false;
      this.trackingClickStart = 0;
      if (deviceIsIOSWithBadTarget) {
        touch = event.changedTouches[0];
        targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
        targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
      }
      targetTagName = targetElement.tagName.toLowerCase();
      if (targetTagName === 'label') {
        forElement = this.findControl(targetElement);
        if (forElement) {
          this.focus(targetElement);
          if (deviceIsAndroid) {
            return false;
          }
          targetElement = forElement;
        }
      } else if (this.needsFocus(targetElement)) {
        if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
          this.targetElement = null;
          return false;
        }
        this.focus(targetElement);
        this.sendClick(targetElement, event);
        if (!deviceIsIOS || targetTagName !== 'select') {
          this.targetElement = null;
          event.preventDefault();
        }
        return false;
      }
      if (deviceIsIOS && !deviceIsIOS4) {
        scrollParent = targetElement.fastClickScrollParent;
        if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
          return true;
        }
      }
      if (!this.needsClick(targetElement)) {
        event.preventDefault();
        this.sendClick(targetElement, event);
      }
      return false;
    };
    FastClick.prototype.onTouchCancel = function() {
      this.trackingClick = false;
      this.targetElement = null;
    };
    FastClick.prototype.onMouse = function(event) {
      if (!this.targetElement) {
        return true;
      }
      if (event.forwardedTouchEvent) {
        return true;
      }
      if (!event.cancelable) {
        return true;
      }
      if (!this.needsClick(this.targetElement) || this.cancelNextClick) {
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        } else {
          event.propagationStopped = true;
        }
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
      return true;
    };
    FastClick.prototype.onClick = function(event) {
      var permitted;
      if (this.trackingClick) {
        this.targetElement = null;
        this.trackingClick = false;
        return true;
      }
      if (event.target.type === 'submit' && event.detail === 0) {
        return true;
      }
      permitted = this.onMouse(event);
      if (!permitted) {
        this.targetElement = null;
      }
      return permitted;
    };
    FastClick.prototype.destroy = function() {
      var layer = this.layer;
      if (deviceIsAndroid) {
        layer.removeEventListener('mouseover', this.onMouse, true);
        layer.removeEventListener('mousedown', this.onMouse, true);
        layer.removeEventListener('mouseup', this.onMouse, true);
      }
      layer.removeEventListener('click', this.onClick, true);
      layer.removeEventListener('touchstart', this.onTouchStart, false);
      layer.removeEventListener('touchmove', this.onTouchMove, false);
      layer.removeEventListener('touchend', this.onTouchEnd, false);
      layer.removeEventListener('touchcancel', this.onTouchCancel, false);
    };
    FastClick.notNeeded = function(layer) {
      var metaViewport;
      var chromeVersion;
      var blackberryVersion;
      var firefoxVersion;
      if (typeof window.ontouchstart === 'undefined') {
        return true;
      }
      chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1];
      if (chromeVersion) {
        if (deviceIsAndroid) {
          metaViewport = document.querySelector('meta[name=viewport]');
          if (metaViewport) {
            if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
              return true;
            }
            if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
              return true;
            }
          }
        } else {
          return true;
        }
      }
      if (deviceIsBlackBerry10) {
        blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);
        if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
          metaViewport = document.querySelector('meta[name=viewport]');
          if (metaViewport) {
            if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
              return true;
            }
            if (document.documentElement.scrollWidth <= window.outerWidth) {
              return true;
            }
          }
        }
      }
      if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
        return true;
      }
      firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1];
      if (firefoxVersion >= 27) {
        metaViewport = document.querySelector('meta[name=viewport]');
        if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
          return true;
        }
      }
      if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
        return true;
      }
      return false;
    };
    FastClick.attach = function(layer, options) {
      return new FastClick(layer, options);
    };
    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
      define(function() {
        return FastClick;
      });
    } else if (typeof module !== 'undefined' && module.exports) {
      module.exports = FastClick.attach;
      module.exports.FastClick = FastClick;
    } else {
      window.FastClick = FastClick;
    }
  }());
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:process@0.10.1.js", ["npm:process@0.10.1/browser.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:process@0.10.1/browser.js");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:eventemitter3@1.1.1.js", ["npm:eventemitter3@1.1.1/index.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:eventemitter3@1.1.1/index.js");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/EventHandler.js", ["npm:famous@0.3.5/core/EventEmitter.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var EventEmitter = require("npm:famous@0.3.5/core/EventEmitter.js");
  function EventHandler() {
    EventEmitter.apply(this, arguments);
    this.downstream = [];
    this.downstreamFn = [];
    this.upstream = [];
    this.upstreamListeners = {};
  }
  EventHandler.prototype = Object.create(EventEmitter.prototype);
  EventHandler.prototype.constructor = EventHandler;
  EventHandler.setInputHandler = function setInputHandler(object, handler) {
    object.trigger = handler.trigger.bind(handler);
    if (handler.subscribe && handler.unsubscribe) {
      object.subscribe = handler.subscribe.bind(handler);
      object.unsubscribe = handler.unsubscribe.bind(handler);
    }
  };
  EventHandler.setOutputHandler = function setOutputHandler(object, handler) {
    if (handler instanceof EventHandler)
      handler.bindThis(object);
    object.pipe = handler.pipe.bind(handler);
    object.unpipe = handler.unpipe.bind(handler);
    object.on = handler.on.bind(handler);
    object.addListener = object.on;
    object.removeListener = handler.removeListener.bind(handler);
  };
  EventHandler.prototype.emit = function emit(type, event) {
    EventEmitter.prototype.emit.apply(this, arguments);
    var i = 0;
    for (i = 0; i < this.downstream.length; i++) {
      if (this.downstream[i].trigger)
        this.downstream[i].trigger(type, event);
    }
    for (i = 0; i < this.downstreamFn.length; i++) {
      this.downstreamFn[i](type, event);
    }
    return this;
  };
  EventHandler.prototype.trigger = EventHandler.prototype.emit;
  EventHandler.prototype.pipe = function pipe(target) {
    if (target.subscribe instanceof Function)
      return target.subscribe(this);
    var downstreamCtx = target instanceof Function ? this.downstreamFn : this.downstream;
    var index = downstreamCtx.indexOf(target);
    if (index < 0)
      downstreamCtx.push(target);
    if (target instanceof Function)
      target('pipe', null);
    else if (target.trigger)
      target.trigger('pipe', null);
    return target;
  };
  EventHandler.prototype.unpipe = function unpipe(target) {
    if (target.unsubscribe instanceof Function)
      return target.unsubscribe(this);
    var downstreamCtx = target instanceof Function ? this.downstreamFn : this.downstream;
    var index = downstreamCtx.indexOf(target);
    if (index >= 0) {
      downstreamCtx.splice(index, 1);
      if (target instanceof Function)
        target('unpipe', null);
      else if (target.trigger)
        target.trigger('unpipe', null);
      return target;
    } else
      return false;
  };
  EventHandler.prototype.on = function on(type, handler) {
    EventEmitter.prototype.on.apply(this, arguments);
    if (!(type in this.upstreamListeners)) {
      var upstreamListener = this.trigger.bind(this, type);
      this.upstreamListeners[type] = upstreamListener;
      for (var i = 0; i < this.upstream.length; i++) {
        this.upstream[i].on(type, upstreamListener);
      }
    }
    return this;
  };
  EventHandler.prototype.addListener = EventHandler.prototype.on;
  EventHandler.prototype.subscribe = function subscribe(source) {
    var index = this.upstream.indexOf(source);
    if (index < 0) {
      this.upstream.push(source);
      for (var type in this.upstreamListeners) {
        source.on(type, this.upstreamListeners[type]);
      }
    }
    return this;
  };
  EventHandler.prototype.unsubscribe = function unsubscribe(source) {
    var index = this.upstream.indexOf(source);
    if (index >= 0) {
      this.upstream.splice(index, 1);
      for (var type in this.upstreamListeners) {
        source.removeListener(type, this.upstreamListeners[type]);
      }
    }
    return this;
  };
  module.exports = EventHandler;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/SpecParser.js", ["npm:famous@0.3.5/core/Transform.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Transform = require("npm:famous@0.3.5/core/Transform.js");
  function SpecParser() {
    this.result = {};
  }
  SpecParser._instance = new SpecParser();
  SpecParser.parse = function parse(spec, context) {
    return SpecParser._instance.parse(spec, context);
  };
  SpecParser.prototype.parse = function parse(spec, context) {
    this.reset();
    this._parseSpec(spec, context, Transform.identity);
    return this.result;
  };
  SpecParser.prototype.reset = function reset() {
    this.result = {};
  };
  function _vecInContext(v, m) {
    return [v[0] * m[0] + v[1] * m[4] + v[2] * m[8], v[0] * m[1] + v[1] * m[5] + v[2] * m[9], v[0] * m[2] + v[1] * m[6] + v[2] * m[10]];
  }
  var _zeroZero = [0, 0];
  SpecParser.prototype._parseSpec = function _parseSpec(spec, parentContext, sizeContext) {
    var id;
    var target;
    var transform;
    var opacity;
    var origin;
    var align;
    var size;
    if (typeof spec === 'number') {
      id = spec;
      transform = parentContext.transform;
      align = parentContext.align || _zeroZero;
      if (parentContext.size && align && (align[0] || align[1])) {
        var alignAdjust = [align[0] * parentContext.size[0], align[1] * parentContext.size[1], 0];
        transform = Transform.thenMove(transform, _vecInContext(alignAdjust, sizeContext));
      }
      this.result[id] = {
        transform: transform,
        opacity: parentContext.opacity,
        origin: parentContext.origin || _zeroZero,
        align: parentContext.align || _zeroZero,
        size: parentContext.size
      };
    } else if (!spec) {
      return;
    } else if (spec instanceof Array) {
      for (var i = 0; i < spec.length; i++) {
        this._parseSpec(spec[i], parentContext, sizeContext);
      }
    } else {
      target = spec.target;
      transform = parentContext.transform;
      opacity = parentContext.opacity;
      origin = parentContext.origin;
      align = parentContext.align;
      size = parentContext.size;
      var nextSizeContext = sizeContext;
      if (spec.opacity !== undefined)
        opacity = parentContext.opacity * spec.opacity;
      if (spec.transform)
        transform = Transform.multiply(parentContext.transform, spec.transform);
      if (spec.origin) {
        origin = spec.origin;
        nextSizeContext = parentContext.transform;
      }
      if (spec.align)
        align = spec.align;
      if (spec.size || spec.proportions) {
        var parentSize = size;
        size = [size[0], size[1]];
        if (spec.size) {
          if (spec.size[0] !== undefined)
            size[0] = spec.size[0];
          if (spec.size[1] !== undefined)
            size[1] = spec.size[1];
        }
        if (spec.proportions) {
          if (spec.proportions[0] !== undefined)
            size[0] = size[0] * spec.proportions[0];
          if (spec.proportions[1] !== undefined)
            size[1] = size[1] * spec.proportions[1];
        }
        if (parentSize) {
          if (align && (align[0] || align[1]))
            transform = Transform.thenMove(transform, _vecInContext([align[0] * parentSize[0], align[1] * parentSize[1], 0], sizeContext));
          if (origin && (origin[0] || origin[1]))
            transform = Transform.moveThen([-origin[0] * size[0], -origin[1] * size[1], 0], transform);
        }
        nextSizeContext = parentContext.transform;
        origin = null;
        align = null;
      }
      this._parseSpec(target, {
        transform: transform,
        opacity: opacity,
        origin: origin,
        align: align,
        size: size
      }, nextSizeContext);
    }
  };
  module.exports = SpecParser;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/Surface.js", ["npm:famous@0.3.5/core/ElementOutput.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var ElementOutput = require("npm:famous@0.3.5/core/ElementOutput.js");
  function Surface(options) {
    ElementOutput.call(this);
    this.options = {};
    this.properties = {};
    this.attributes = {};
    this.content = '';
    this.classList = [];
    this.size = null;
    this._classesDirty = true;
    this._stylesDirty = true;
    this._attributesDirty = true;
    this._sizeDirty = true;
    this._contentDirty = true;
    this._trueSizeCheck = true;
    this._dirtyClasses = [];
    if (options)
      this.setOptions(options);
    this._currentTarget = null;
  }
  Surface.prototype = Object.create(ElementOutput.prototype);
  Surface.prototype.constructor = Surface;
  Surface.prototype.elementType = 'div';
  Surface.prototype.elementClass = 'famous-surface';
  Surface.prototype.setAttributes = function setAttributes(attributes) {
    for (var n in attributes) {
      if (n === 'style')
        throw new Error('Cannot set styles via "setAttributes" as it will break Famo.us.  Use "setProperties" instead.');
      this.attributes[n] = attributes[n];
    }
    this._attributesDirty = true;
  };
  Surface.prototype.getAttributes = function getAttributes() {
    return this.attributes;
  };
  Surface.prototype.setProperties = function setProperties(properties) {
    for (var n in properties) {
      this.properties[n] = properties[n];
    }
    this._stylesDirty = true;
    return this;
  };
  Surface.prototype.getProperties = function getProperties() {
    return this.properties;
  };
  Surface.prototype.addClass = function addClass(className) {
    if (this.classList.indexOf(className) < 0) {
      this.classList.push(className);
      this._classesDirty = true;
    }
    return this;
  };
  Surface.prototype.removeClass = function removeClass(className) {
    var i = this.classList.indexOf(className);
    if (i >= 0) {
      this._dirtyClasses.push(this.classList.splice(i, 1)[0]);
      this._classesDirty = true;
    }
    return this;
  };
  Surface.prototype.toggleClass = function toggleClass(className) {
    var i = this.classList.indexOf(className);
    if (i >= 0) {
      this.removeClass(className);
    } else {
      this.addClass(className);
    }
    return this;
  };
  Surface.prototype.setClasses = function setClasses(classList) {
    var i = 0;
    var removal = [];
    for (i = 0; i < this.classList.length; i++) {
      if (classList.indexOf(this.classList[i]) < 0)
        removal.push(this.classList[i]);
    }
    for (i = 0; i < removal.length; i++)
      this.removeClass(removal[i]);
    for (i = 0; i < classList.length; i++)
      this.addClass(classList[i]);
    return this;
  };
  Surface.prototype.getClassList = function getClassList() {
    return this.classList;
  };
  Surface.prototype.setContent = function setContent(content) {
    if (this.content !== content) {
      this.content = content;
      this._contentDirty = true;
    }
    return this;
  };
  Surface.prototype.getContent = function getContent() {
    return this.content;
  };
  Surface.prototype.setOptions = function setOptions(options) {
    if (options.size)
      this.setSize(options.size);
    if (options.classes)
      this.setClasses(options.classes);
    if (options.properties)
      this.setProperties(options.properties);
    if (options.attributes)
      this.setAttributes(options.attributes);
    if (options.content)
      this.setContent(options.content);
    return this;
  };
  function _cleanupClasses(target) {
    for (var i = 0; i < this._dirtyClasses.length; i++)
      target.classList.remove(this._dirtyClasses[i]);
    this._dirtyClasses = [];
  }
  function _applyStyles(target) {
    for (var n in this.properties) {
      target.style[n] = this.properties[n];
    }
  }
  function _cleanupStyles(target) {
    for (var n in this.properties) {
      target.style[n] = '';
    }
  }
  function _applyAttributes(target) {
    for (var n in this.attributes) {
      target.setAttribute(n, this.attributes[n]);
    }
  }
  function _cleanupAttributes(target) {
    for (var n in this.attributes) {
      target.removeAttribute(n);
    }
  }
  function _xyNotEquals(a, b) {
    return a && b ? a[0] !== b[0] || a[1] !== b[1] : a !== b;
  }
  Surface.prototype.setup = function setup(allocator) {
    var target = allocator.allocate(this.elementType);
    if (this.elementClass) {
      if (this.elementClass instanceof Array) {
        for (var i = 0; i < this.elementClass.length; i++) {
          target.classList.add(this.elementClass[i]);
        }
      } else {
        target.classList.add(this.elementClass);
      }
    }
    target.style.display = '';
    this.attach(target);
    this._opacity = null;
    this._currentTarget = target;
    this._stylesDirty = true;
    this._classesDirty = true;
    this._attributesDirty = true;
    this._sizeDirty = true;
    this._contentDirty = true;
    this._originDirty = true;
    this._transformDirty = true;
  };
  Surface.prototype.commit = function commit(context) {
    if (!this._currentTarget)
      this.setup(context.allocator);
    var target = this._currentTarget;
    var size = context.size;
    if (this._classesDirty) {
      _cleanupClasses.call(this, target);
      var classList = this.getClassList();
      for (var i = 0; i < classList.length; i++)
        target.classList.add(classList[i]);
      this._classesDirty = false;
      this._trueSizeCheck = true;
    }
    if (this._stylesDirty) {
      _applyStyles.call(this, target);
      this._stylesDirty = false;
      this._trueSizeCheck = true;
    }
    if (this._attributesDirty) {
      _applyAttributes.call(this, target);
      this._attributesDirty = false;
      this._trueSizeCheck = true;
    }
    if (this.size) {
      var origSize = context.size;
      size = [this.size[0], this.size[1]];
      if (size[0] === undefined)
        size[0] = origSize[0];
      if (size[1] === undefined)
        size[1] = origSize[1];
      if (size[0] === true || size[1] === true) {
        if (size[0] === true) {
          if (this._trueSizeCheck || this._size[0] === 0) {
            var width = target.offsetWidth;
            if (this._size && this._size[0] !== width) {
              this._size[0] = width;
              this._sizeDirty = true;
            }
            size[0] = width;
          } else {
            if (this._size)
              size[0] = this._size[0];
          }
        }
        if (size[1] === true) {
          if (this._trueSizeCheck || this._size[1] === 0) {
            var height = target.offsetHeight;
            if (this._size && this._size[1] !== height) {
              this._size[1] = height;
              this._sizeDirty = true;
            }
            size[1] = height;
          } else {
            if (this._size)
              size[1] = this._size[1];
          }
        }
        this._trueSizeCheck = false;
      }
    }
    if (_xyNotEquals(this._size, size)) {
      if (!this._size)
        this._size = [0, 0];
      this._size[0] = size[0];
      this._size[1] = size[1];
      this._sizeDirty = true;
    }
    if (this._sizeDirty) {
      if (this._size) {
        target.style.width = this.size && this.size[0] === true ? '' : this._size[0] + 'px';
        target.style.height = this.size && this.size[1] === true ? '' : this._size[1] + 'px';
      }
      this._eventOutput.emit('resize');
    }
    if (this._contentDirty) {
      this.deploy(target);
      this._eventOutput.emit('deploy');
      this._contentDirty = false;
      this._trueSizeCheck = true;
    }
    ElementOutput.prototype.commit.call(this, context);
  };
  Surface.prototype.cleanup = function cleanup(allocator) {
    var i = 0;
    var target = this._currentTarget;
    this._eventOutput.emit('recall');
    this.recall(target);
    target.style.display = 'none';
    target.style.opacity = '';
    target.style.width = '';
    target.style.height = '';
    _cleanupStyles.call(this, target);
    _cleanupAttributes.call(this, target);
    var classList = this.getClassList();
    _cleanupClasses.call(this, target);
    for (i = 0; i < classList.length; i++)
      target.classList.remove(classList[i]);
    if (this.elementClass) {
      if (this.elementClass instanceof Array) {
        for (i = 0; i < this.elementClass.length; i++) {
          target.classList.remove(this.elementClass[i]);
        }
      } else {
        target.classList.remove(this.elementClass);
      }
    }
    this.detach(target);
    this._currentTarget = null;
    allocator.deallocate(target);
  };
  Surface.prototype.deploy = function deploy(target) {
    var content = this.getContent();
    if (content instanceof Node) {
      while (target.hasChildNodes())
        target.removeChild(target.firstChild);
      target.appendChild(content);
    } else
      target.innerHTML = content;
  };
  Surface.prototype.recall = function recall(target) {
    var df = document.createDocumentFragment();
    while (target.hasChildNodes())
      df.appendChild(target.firstChild);
    this.setContent(df);
  };
  Surface.prototype.getSize = function getSize() {
    return this._size ? this._size : this.size;
  };
  Surface.prototype.setSize = function setSize(size) {
    this.size = size ? [size[0], size[1]] : null;
    this._sizeDirty = true;
    return this;
  };
  module.exports = Surface;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/physics/bodies/Particle.js", ["npm:famous@0.3.5/math/Vector.js", "npm:famous@0.3.5/core/Transform.js", "npm:famous@0.3.5/core/EventHandler.js", "npm:famous@0.3.5/physics/integrators/SymplecticEuler.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Vector = require("npm:famous@0.3.5/math/Vector.js");
  var Transform = require("npm:famous@0.3.5/core/Transform.js");
  var EventHandler = require("npm:famous@0.3.5/core/EventHandler.js");
  var Integrator = require("npm:famous@0.3.5/physics/integrators/SymplecticEuler.js");
  function Particle(options) {
    options = options || {};
    var defaults = Particle.DEFAULT_OPTIONS;
    this.position = new Vector();
    this.velocity = new Vector();
    this.force = new Vector();
    this._engine = null;
    this._isSleeping = true;
    this._eventOutput = null;
    this.mass = options.mass !== undefined ? options.mass : defaults.mass;
    this.inverseMass = 1 / this.mass;
    this.setPosition(options.position || defaults.position);
    this.setVelocity(options.velocity || defaults.velocity);
    this.force.set(options.force || [0, 0, 0]);
    this.transform = Transform.identity.slice();
    this._spec = {
      size: [true, true],
      target: {
        transform: this.transform,
        origin: [0.5, 0.5],
        target: null
      }
    };
  }
  Particle.DEFAULT_OPTIONS = {
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    mass: 1
  };
  var _events = {
    start: 'start',
    update: 'update',
    end: 'end'
  };
  var now = Date.now;
  Particle.prototype.isBody = false;
  Particle.prototype.isActive = function isActive() {
    return !this._isSleeping;
  };
  Particle.prototype.sleep = function sleep() {
    if (this._isSleeping)
      return;
    this.emit(_events.end, this);
    this._isSleeping = true;
  };
  Particle.prototype.wake = function wake() {
    if (!this._isSleeping)
      return;
    this.emit(_events.start, this);
    this._isSleeping = false;
    this._prevTime = now();
    if (this._engine)
      this._engine.wake();
  };
  Particle.prototype.setPosition = function setPosition(position) {
    this.position.set(position);
  };
  Particle.prototype.setPosition1D = function setPosition1D(x) {
    this.position.x = x;
  };
  Particle.prototype.getPosition = function getPosition() {
    this._engine.step();
    return this.position.get();
  };
  Particle.prototype.getPosition1D = function getPosition1D() {
    this._engine.step();
    return this.position.x;
  };
  Particle.prototype.setVelocity = function setVelocity(velocity) {
    this.velocity.set(velocity);
    if (!(velocity[0] === 0 && velocity[1] === 0 && velocity[2] === 0))
      this.wake();
  };
  Particle.prototype.setVelocity1D = function setVelocity1D(x) {
    this.velocity.x = x;
    if (x !== 0)
      this.wake();
  };
  Particle.prototype.getVelocity = function getVelocity() {
    return this.velocity.get();
  };
  Particle.prototype.setForce = function setForce(force) {
    this.force.set(force);
    this.wake();
  };
  Particle.prototype.getVelocity1D = function getVelocity1D() {
    return this.velocity.x;
  };
  Particle.prototype.setMass = function setMass(mass) {
    this.mass = mass;
    this.inverseMass = 1 / mass;
  };
  Particle.prototype.getMass = function getMass() {
    return this.mass;
  };
  Particle.prototype.reset = function reset(position, velocity) {
    this.setPosition(position || [0, 0, 0]);
    this.setVelocity(velocity || [0, 0, 0]);
  };
  Particle.prototype.applyForce = function applyForce(force) {
    if (force.isZero())
      return;
    this.force.add(force).put(this.force);
    this.wake();
  };
  Particle.prototype.applyImpulse = function applyImpulse(impulse) {
    if (impulse.isZero())
      return;
    var velocity = this.velocity;
    velocity.add(impulse.mult(this.inverseMass)).put(velocity);
  };
  Particle.prototype.integrateVelocity = function integrateVelocity(dt) {
    Integrator.integrateVelocity(this, dt);
  };
  Particle.prototype.integratePosition = function integratePosition(dt) {
    Integrator.integratePosition(this, dt);
  };
  Particle.prototype._integrate = function _integrate(dt) {
    this.integrateVelocity(dt);
    this.integratePosition(dt);
  };
  Particle.prototype.getEnergy = function getEnergy() {
    return 0.5 * this.mass * this.velocity.normSquared();
  };
  Particle.prototype.getTransform = function getTransform() {
    this._engine.step();
    var position = this.position;
    var transform = this.transform;
    transform[12] = position.x;
    transform[13] = position.y;
    transform[14] = position.z;
    return transform;
  };
  Particle.prototype.modify = function modify(target) {
    var _spec = this._spec.target;
    _spec.transform = this.getTransform();
    _spec.target = target;
    return this._spec;
  };
  function _createEventOutput() {
    this._eventOutput = new EventHandler();
    this._eventOutput.bindThis(this);
    EventHandler.setOutputHandler(this, this._eventOutput);
  }
  Particle.prototype.emit = function emit(type, data) {
    if (!this._eventOutput)
      return;
    this._eventOutput.emit(type, data);
  };
  Particle.prototype.on = function on() {
    _createEventOutput.call(this);
    return this.on.apply(this, arguments);
  };
  Particle.prototype.removeListener = function removeListener() {
    _createEventOutput.call(this);
    return this.removeListener.apply(this, arguments);
  };
  Particle.prototype.pipe = function pipe() {
    _createEventOutput.call(this);
    return this.pipe.apply(this, arguments);
  };
  Particle.prototype.unpipe = function unpipe() {
    _createEventOutput.call(this);
    return this.unpipe.apply(this, arguments);
  };
  module.exports = Particle;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/physics/forces/Spring.js", ["npm:famous@0.3.5/physics/forces/Force.js", "npm:famous@0.3.5/math/Vector.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Force = require("npm:famous@0.3.5/physics/forces/Force.js");
  var Vector = require("npm:famous@0.3.5/math/Vector.js");
  function Spring(options) {
    Force.call(this);
    this.options = Object.create(this.constructor.DEFAULT_OPTIONS);
    if (options)
      this.setOptions(options);
    this.disp = new Vector(0, 0, 0);
    _init.call(this);
  }
  Spring.prototype = Object.create(Force.prototype);
  Spring.prototype.constructor = Spring;
  var pi = Math.PI;
  var MIN_PERIOD = 150;
  Spring.FORCE_FUNCTIONS = {
    FENE: function(dist, rMax) {
      var rMaxSmall = rMax * 0.99;
      var r = Math.max(Math.min(dist, rMaxSmall), -rMaxSmall);
      return r / (1 - r * r / (rMax * rMax));
    },
    HOOK: function(dist) {
      return dist;
    }
  };
  Spring.DEFAULT_OPTIONS = {
    period: 300,
    dampingRatio: 0.1,
    length: 0,
    maxLength: Infinity,
    anchor: undefined,
    forceFunction: Spring.FORCE_FUNCTIONS.HOOK
  };
  function _calcStiffness() {
    var options = this.options;
    options.stiffness = Math.pow(2 * pi / options.period, 2);
  }
  function _calcDamping() {
    var options = this.options;
    options.damping = 4 * pi * options.dampingRatio / options.period;
  }
  function _init() {
    _calcStiffness.call(this);
    _calcDamping.call(this);
  }
  Spring.prototype.setOptions = function setOptions(options) {
    if (options.anchor !== undefined) {
      if (options.anchor.position instanceof Vector)
        this.options.anchor = options.anchor.position;
      if (options.anchor instanceof Vector)
        this.options.anchor = options.anchor;
      if (options.anchor instanceof Array)
        this.options.anchor = new Vector(options.anchor);
    }
    if (options.period !== undefined) {
      if (options.period < MIN_PERIOD) {
        options.period = MIN_PERIOD;
        console.warn('The period of a SpringTransition is capped at ' + MIN_PERIOD + ' ms. Use a SnapTransition for faster transitions');
      }
      this.options.period = options.period;
    }
    if (options.dampingRatio !== undefined)
      this.options.dampingRatio = options.dampingRatio;
    if (options.length !== undefined)
      this.options.length = options.length;
    if (options.forceFunction !== undefined)
      this.options.forceFunction = options.forceFunction;
    if (options.maxLength !== undefined)
      this.options.maxLength = options.maxLength;
    _init.call(this);
    Force.prototype.setOptions.call(this, options);
  };
  Spring.prototype.applyForce = function applyForce(targets, source) {
    var force = this.force;
    var disp = this.disp;
    var options = this.options;
    var stiffness = options.stiffness;
    var damping = options.damping;
    var restLength = options.length;
    var maxLength = options.maxLength;
    var anchor = options.anchor || source.position;
    var forceFunction = options.forceFunction;
    var i;
    var target;
    var p2;
    var v2;
    var dist;
    var m;
    for (i = 0; i < targets.length; i++) {
      target = targets[i];
      p2 = target.position;
      v2 = target.velocity;
      anchor.sub(p2).put(disp);
      dist = disp.norm() - restLength;
      if (dist === 0)
        return;
      m = target.mass;
      stiffness *= m;
      damping *= m;
      disp.normalize(stiffness * forceFunction(dist, maxLength)).put(force);
      if (damping)
        if (source)
          force.add(v2.sub(source.velocity).mult(-damping)).put(force);
        else
          force.add(v2.mult(-damping)).put(force);
      target.applyForce(force);
      if (source)
        source.applyForce(force.mult(-1));
    }
  };
  Spring.prototype.getEnergy = function getEnergy(targets, source) {
    var options = this.options;
    var restLength = options.length;
    var anchor = source ? source.position : options.anchor;
    var strength = options.stiffness;
    var energy = 0;
    for (var i = 0; i < targets.length; i++) {
      var target = targets[i];
      var dist = anchor.sub(target.position).norm() - restLength;
      energy += 0.5 * strength * dist * dist;
    }
    return energy;
  };
  module.exports = Spring;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/transitions/Transitionable.js", ["npm:famous@0.3.5/transitions/MultipleTransition.js", "npm:famous@0.3.5/transitions/TweenTransition.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var MultipleTransition = require("npm:famous@0.3.5/transitions/MultipleTransition.js");
  var TweenTransition = require("npm:famous@0.3.5/transitions/TweenTransition.js");
  function Transitionable(start) {
    this.currentAction = null;
    this.actionQueue = [];
    this.callbackQueue = [];
    this.state = 0;
    this.velocity = undefined;
    this._callback = undefined;
    this._engineInstance = null;
    this._currentMethod = null;
    this.set(start);
  }
  var transitionMethods = {};
  Transitionable.register = function register(methods) {
    var success = true;
    for (var method in methods) {
      if (!Transitionable.registerMethod(method, methods[method]))
        success = false;
    }
    return success;
  };
  Transitionable.registerMethod = function registerMethod(name, engineClass) {
    if (!(name in transitionMethods)) {
      transitionMethods[name] = engineClass;
      return true;
    } else
      return false;
  };
  Transitionable.unregisterMethod = function unregisterMethod(name) {
    if (name in transitionMethods) {
      delete transitionMethods[name];
      return true;
    } else
      return false;
  };
  function _loadNext() {
    if (this._callback) {
      var callback = this._callback;
      this._callback = undefined;
      callback();
    }
    if (this.actionQueue.length <= 0) {
      this.set(this.get());
      return;
    }
    this.currentAction = this.actionQueue.shift();
    this._callback = this.callbackQueue.shift();
    var method = null;
    var endValue = this.currentAction[0];
    var transition = this.currentAction[1];
    if (transition instanceof Object && transition.method) {
      method = transition.method;
      if (typeof method === 'string')
        method = transitionMethods[method];
    } else {
      method = TweenTransition;
    }
    if (this._currentMethod !== method) {
      if (!(endValue instanceof Object) || method.SUPPORTS_MULTIPLE === true || endValue.length <= method.SUPPORTS_MULTIPLE) {
        this._engineInstance = new method();
      } else {
        this._engineInstance = new MultipleTransition(method);
      }
      this._currentMethod = method;
    }
    this._engineInstance.reset(this.state, this.velocity);
    if (this.velocity !== undefined)
      transition.velocity = this.velocity;
    this._engineInstance.set(endValue, transition, _loadNext.bind(this));
  }
  Transitionable.prototype.set = function set(endState, transition, callback) {
    if (!transition) {
      this.reset(endState);
      if (callback)
        callback();
      return this;
    }
    var action = [endState, transition];
    this.actionQueue.push(action);
    this.callbackQueue.push(callback);
    if (!this.currentAction)
      _loadNext.call(this);
    return this;
  };
  Transitionable.prototype.reset = function reset(startState, startVelocity) {
    this._currentMethod = null;
    this._engineInstance = null;
    this._callback = undefined;
    this.state = startState;
    this.velocity = startVelocity;
    this.currentAction = null;
    this.actionQueue = [];
    this.callbackQueue = [];
  };
  Transitionable.prototype.delay = function delay(duration, callback) {
    var endValue;
    if (this.actionQueue.length)
      endValue = this.actionQueue[this.actionQueue.length - 1][0];
    else if (this.currentAction)
      endValue = this.currentAction[0];
    else
      endValue = this.get();
    return this.set(endValue, {
      duration: duration,
      curve: function() {
        return 0;
      }
    }, callback);
  };
  Transitionable.prototype.get = function get(timestamp) {
    if (this._engineInstance) {
      if (this._engineInstance.getVelocity)
        this.velocity = this._engineInstance.getVelocity();
      this.state = this._engineInstance.get(timestamp);
    }
    return this.state;
  };
  Transitionable.prototype.isActive = function isActive() {
    return !!this.currentAction;
  };
  Transitionable.prototype.halt = function halt() {
    return this.set(this.get());
  };
  module.exports = Transitionable;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/Modifier.js", ["npm:famous@0.3.5/core/Transform.js", "npm:famous@0.3.5/transitions/Transitionable.js", "npm:famous@0.3.5/transitions/TransitionableTransform.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Transform = require("npm:famous@0.3.5/core/Transform.js");
  var Transitionable = require("npm:famous@0.3.5/transitions/Transitionable.js");
  var TransitionableTransform = require("npm:famous@0.3.5/transitions/TransitionableTransform.js");
  function Modifier(options) {
    this._transformGetter = null;
    this._opacityGetter = null;
    this._originGetter = null;
    this._alignGetter = null;
    this._sizeGetter = null;
    this._proportionGetter = null;
    this._legacyStates = {};
    this._output = {
      transform: Transform.identity,
      opacity: 1,
      origin: null,
      align: null,
      size: null,
      proportions: null,
      target: null
    };
    if (options) {
      if (options.transform)
        this.transformFrom(options.transform);
      if (options.opacity !== undefined)
        this.opacityFrom(options.opacity);
      if (options.origin)
        this.originFrom(options.origin);
      if (options.align)
        this.alignFrom(options.align);
      if (options.size)
        this.sizeFrom(options.size);
      if (options.proportions)
        this.proportionsFrom(options.proportions);
    }
  }
  Modifier.prototype.transformFrom = function transformFrom(transform) {
    if (transform instanceof Function)
      this._transformGetter = transform;
    else if (transform instanceof Object && transform.get)
      this._transformGetter = transform.get.bind(transform);
    else {
      this._transformGetter = null;
      this._output.transform = transform;
    }
    return this;
  };
  Modifier.prototype.opacityFrom = function opacityFrom(opacity) {
    if (opacity instanceof Function)
      this._opacityGetter = opacity;
    else if (opacity instanceof Object && opacity.get)
      this._opacityGetter = opacity.get.bind(opacity);
    else {
      this._opacityGetter = null;
      this._output.opacity = opacity;
    }
    return this;
  };
  Modifier.prototype.originFrom = function originFrom(origin) {
    if (origin instanceof Function)
      this._originGetter = origin;
    else if (origin instanceof Object && origin.get)
      this._originGetter = origin.get.bind(origin);
    else {
      this._originGetter = null;
      this._output.origin = origin;
    }
    return this;
  };
  Modifier.prototype.alignFrom = function alignFrom(align) {
    if (align instanceof Function)
      this._alignGetter = align;
    else if (align instanceof Object && align.get)
      this._alignGetter = align.get.bind(align);
    else {
      this._alignGetter = null;
      this._output.align = align;
    }
    return this;
  };
  Modifier.prototype.sizeFrom = function sizeFrom(size) {
    if (size instanceof Function)
      this._sizeGetter = size;
    else if (size instanceof Object && size.get)
      this._sizeGetter = size.get.bind(size);
    else {
      this._sizeGetter = null;
      this._output.size = size;
    }
    return this;
  };
  Modifier.prototype.proportionsFrom = function proportionsFrom(proportions) {
    if (proportions instanceof Function)
      this._proportionGetter = proportions;
    else if (proportions instanceof Object && proportions.get)
      this._proportionGetter = proportions.get.bind(proportions);
    else {
      this._proportionGetter = null;
      this._output.proportions = proportions;
    }
    return this;
  };
  Modifier.prototype.setTransform = function setTransform(transform, transition, callback) {
    if (transition || this._legacyStates.transform) {
      if (!this._legacyStates.transform) {
        this._legacyStates.transform = new TransitionableTransform(this._output.transform);
      }
      if (!this._transformGetter)
        this.transformFrom(this._legacyStates.transform);
      this._legacyStates.transform.set(transform, transition, callback);
      return this;
    } else
      return this.transformFrom(transform);
  };
  Modifier.prototype.setOpacity = function setOpacity(opacity, transition, callback) {
    if (transition || this._legacyStates.opacity) {
      if (!this._legacyStates.opacity) {
        this._legacyStates.opacity = new Transitionable(this._output.opacity);
      }
      if (!this._opacityGetter)
        this.opacityFrom(this._legacyStates.opacity);
      return this._legacyStates.opacity.set(opacity, transition, callback);
    } else
      return this.opacityFrom(opacity);
  };
  Modifier.prototype.setOrigin = function setOrigin(origin, transition, callback) {
    if (transition || this._legacyStates.origin) {
      if (!this._legacyStates.origin) {
        this._legacyStates.origin = new Transitionable(this._output.origin || [0, 0]);
      }
      if (!this._originGetter)
        this.originFrom(this._legacyStates.origin);
      this._legacyStates.origin.set(origin, transition, callback);
      return this;
    } else
      return this.originFrom(origin);
  };
  Modifier.prototype.setAlign = function setAlign(align, transition, callback) {
    if (transition || this._legacyStates.align) {
      if (!this._legacyStates.align) {
        this._legacyStates.align = new Transitionable(this._output.align || [0, 0]);
      }
      if (!this._alignGetter)
        this.alignFrom(this._legacyStates.align);
      this._legacyStates.align.set(align, transition, callback);
      return this;
    } else
      return this.alignFrom(align);
  };
  Modifier.prototype.setSize = function setSize(size, transition, callback) {
    if (size && (transition || this._legacyStates.size)) {
      if (!this._legacyStates.size) {
        this._legacyStates.size = new Transitionable(this._output.size || [0, 0]);
      }
      if (!this._sizeGetter)
        this.sizeFrom(this._legacyStates.size);
      this._legacyStates.size.set(size, transition, callback);
      return this;
    } else
      return this.sizeFrom(size);
  };
  Modifier.prototype.setProportions = function setProportions(proportions, transition, callback) {
    if (proportions && (transition || this._legacyStates.proportions)) {
      if (!this._legacyStates.proportions) {
        this._legacyStates.proportions = new Transitionable(this._output.proportions || [0, 0]);
      }
      if (!this._proportionGetter)
        this.proportionsFrom(this._legacyStates.proportions);
      this._legacyStates.proportions.set(proportions, transition, callback);
      return this;
    } else
      return this.proportionsFrom(proportions);
  };
  Modifier.prototype.halt = function halt() {
    if (this._legacyStates.transform)
      this._legacyStates.transform.halt();
    if (this._legacyStates.opacity)
      this._legacyStates.opacity.halt();
    if (this._legacyStates.origin)
      this._legacyStates.origin.halt();
    if (this._legacyStates.align)
      this._legacyStates.align.halt();
    if (this._legacyStates.size)
      this._legacyStates.size.halt();
    if (this._legacyStates.proportions)
      this._legacyStates.proportions.halt();
    this._transformGetter = null;
    this._opacityGetter = null;
    this._originGetter = null;
    this._alignGetter = null;
    this._sizeGetter = null;
    this._proportionGetter = null;
  };
  Modifier.prototype.getTransform = function getTransform() {
    return this._transformGetter();
  };
  Modifier.prototype.getFinalTransform = function getFinalTransform() {
    return this._legacyStates.transform ? this._legacyStates.transform.getFinal() : this._output.transform;
  };
  Modifier.prototype.getOpacity = function getOpacity() {
    return this._opacityGetter();
  };
  Modifier.prototype.getOrigin = function getOrigin() {
    return this._originGetter();
  };
  Modifier.prototype.getAlign = function getAlign() {
    return this._alignGetter();
  };
  Modifier.prototype.getSize = function getSize() {
    return this._sizeGetter ? this._sizeGetter() : this._output.size;
  };
  Modifier.prototype.getProportions = function getProportions() {
    return this._proportionGetter ? this._proportionGetter() : this._output.proportions;
  };
  function _update() {
    if (this._transformGetter)
      this._output.transform = this._transformGetter();
    if (this._opacityGetter)
      this._output.opacity = this._opacityGetter();
    if (this._originGetter)
      this._output.origin = this._originGetter();
    if (this._alignGetter)
      this._output.align = this._alignGetter();
    if (this._sizeGetter)
      this._output.size = this._sizeGetter();
    if (this._proportionGetter)
      this._output.proportions = this._proportionGetter();
  }
  Modifier.prototype.modify = function modify(target) {
    _update.call(this);
    this._output.target = target;
    return this._output;
  };
  module.exports = Modifier;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/Context.js", ["npm:famous@0.3.5/core/RenderNode.js", "npm:famous@0.3.5/core/EventHandler.js", "npm:famous@0.3.5/core/ElementAllocator.js", "npm:famous@0.3.5/core/Transform.js", "npm:famous@0.3.5/transitions/Transitionable.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var RenderNode = require("npm:famous@0.3.5/core/RenderNode.js");
  var EventHandler = require("npm:famous@0.3.5/core/EventHandler.js");
  var ElementAllocator = require("npm:famous@0.3.5/core/ElementAllocator.js");
  var Transform = require("npm:famous@0.3.5/core/Transform.js");
  var Transitionable = require("npm:famous@0.3.5/transitions/Transitionable.js");
  var _zeroZero = [0, 0];
  var usePrefix = !('perspective' in document.documentElement.style);
  function _getElementSize() {
    var element = this.container;
    return [element.clientWidth, element.clientHeight];
  }
  var _setPerspective = usePrefix ? function(element, perspective) {
    element.style.webkitPerspective = perspective ? perspective.toFixed() + 'px' : '';
  } : function(element, perspective) {
    element.style.perspective = perspective ? perspective.toFixed() + 'px' : '';
  };
  function Context(container) {
    this.container = container;
    this._allocator = new ElementAllocator(container);
    this._node = new RenderNode();
    this._eventOutput = new EventHandler();
    this._size = _getElementSize.call(this);
    this._perspectiveState = new Transitionable(0);
    this._perspective = undefined;
    this._nodeContext = {
      allocator: this._allocator,
      transform: Transform.identity,
      opacity: 1,
      origin: _zeroZero,
      align: _zeroZero,
      size: this._size
    };
    this._eventOutput.on('resize', function() {
      this.setSize(_getElementSize.call(this));
    }.bind(this));
  }
  Context.prototype.getAllocator = function getAllocator() {
    return this._allocator;
  };
  Context.prototype.add = function add(obj) {
    return this._node.add(obj);
  };
  Context.prototype.migrate = function migrate(container) {
    if (container === this.container)
      return;
    this.container = container;
    this._allocator.migrate(container);
  };
  Context.prototype.getSize = function getSize() {
    return this._size;
  };
  Context.prototype.setSize = function setSize(size) {
    if (!size)
      size = _getElementSize.call(this);
    this._size[0] = size[0];
    this._size[1] = size[1];
  };
  Context.prototype.update = function update(contextParameters) {
    if (contextParameters) {
      if (contextParameters.transform)
        this._nodeContext.transform = contextParameters.transform;
      if (contextParameters.opacity)
        this._nodeContext.opacity = contextParameters.opacity;
      if (contextParameters.origin)
        this._nodeContext.origin = contextParameters.origin;
      if (contextParameters.align)
        this._nodeContext.align = contextParameters.align;
      if (contextParameters.size)
        this._nodeContext.size = contextParameters.size;
    }
    var perspective = this._perspectiveState.get();
    if (perspective !== this._perspective) {
      _setPerspective(this.container, perspective);
      this._perspective = perspective;
    }
    this._node.commit(this._nodeContext);
  };
  Context.prototype.getPerspective = function getPerspective() {
    return this._perspectiveState.get();
  };
  Context.prototype.setPerspective = function setPerspective(perspective, transition, callback) {
    return this._perspectiveState.set(perspective, transition, callback);
  };
  Context.prototype.emit = function emit(type, event) {
    return this._eventOutput.emit(type, event);
  };
  Context.prototype.on = function on(type, handler) {
    return this._eventOutput.on(type, handler);
  };
  Context.prototype.removeListener = function removeListener(type, handler) {
    return this._eventOutput.removeListener(type, handler);
  };
  Context.prototype.pipe = function pipe(target) {
    return this._eventOutput.pipe(target);
  };
  Context.prototype.unpipe = function unpipe(target) {
    return this._eventOutput.unpipe(target);
  };
  module.exports = Context;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("github:firebase/firebase-bower@2.2.7.js", ["github:firebase/firebase-bower@2.2.7/firebase.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("github:firebase/firebase-bower@2.2.7/firebase.js");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:fastclick@1.0.6.js", ["npm:fastclick@1.0.6/lib/fastclick.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:fastclick@1.0.6/lib/fastclick.js");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("github:jspm/nodelibs-process@0.1.1/index.js", ["npm:process@0.10.1.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = System._nodeRequire ? process : require("npm:process@0.10.1.js");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/RenderNode.js", ["npm:famous@0.3.5/core/Entity.js", "npm:famous@0.3.5/core/SpecParser.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Entity = require("npm:famous@0.3.5/core/Entity.js");
  var SpecParser = require("npm:famous@0.3.5/core/SpecParser.js");
  function RenderNode(object) {
    this._object = null;
    this._child = null;
    this._hasMultipleChildren = false;
    this._isRenderable = false;
    this._isModifier = false;
    this._resultCache = {};
    this._prevResults = {};
    this._childResult = null;
    if (object)
      this.set(object);
  }
  RenderNode.prototype.add = function add(child) {
    var childNode = child instanceof RenderNode ? child : new RenderNode(child);
    if (this._child instanceof Array)
      this._child.push(childNode);
    else if (this._child) {
      this._child = [this._child, childNode];
      this._hasMultipleChildren = true;
      this._childResult = [];
    } else
      this._child = childNode;
    return childNode;
  };
  RenderNode.prototype.get = function get() {
    return this._object || (this._hasMultipleChildren ? null : this._child ? this._child.get() : null);
  };
  RenderNode.prototype.set = function set(child) {
    this._childResult = null;
    this._hasMultipleChildren = false;
    this._isRenderable = child.render ? true : false;
    this._isModifier = child.modify ? true : false;
    this._object = child;
    this._child = null;
    if (child instanceof RenderNode)
      return child;
    else
      return this;
  };
  RenderNode.prototype.getSize = function getSize() {
    var result = null;
    var target = this.get();
    if (target && target.getSize)
      result = target.getSize();
    if (!result && this._child && this._child.getSize)
      result = this._child.getSize();
    return result;
  };
  function _applyCommit(spec, context, cacheStorage) {
    var result = SpecParser.parse(spec, context);
    var keys = Object.keys(result);
    for (var i = 0; i < keys.length; i++) {
      var id = keys[i];
      var childNode = Entity.get(id);
      var commitParams = result[id];
      commitParams.allocator = context.allocator;
      var commitResult = childNode.commit(commitParams);
      if (commitResult)
        _applyCommit(commitResult, context, cacheStorage);
      else
        cacheStorage[id] = commitParams;
    }
  }
  RenderNode.prototype.commit = function commit(context) {
    var prevKeys = Object.keys(this._prevResults);
    for (var i = 0; i < prevKeys.length; i++) {
      var id = prevKeys[i];
      if (this._resultCache[id] === undefined) {
        var object = Entity.get(id);
        if (object.cleanup)
          object.cleanup(context.allocator);
      }
    }
    this._prevResults = this._resultCache;
    this._resultCache = {};
    _applyCommit(this.render(), context, this._resultCache);
  };
  RenderNode.prototype.render = function render() {
    if (this._isRenderable)
      return this._object.render();
    var result = null;
    if (this._hasMultipleChildren) {
      result = this._childResult;
      var children = this._child;
      for (var i = 0; i < children.length; i++) {
        result[i] = children[i].render();
      }
    } else if (this._child)
      result = this._child.render();
    return this._isModifier ? this._object.modify(result) : result;
  };
  module.exports = RenderNode;
  global.define = __define;
  return module.exports;
});

(function() {
var _removeDefine = System.get("@@amd-helpers").createDefine();
define("github:ijzerenhein/famous-flex@0.3.4/src/LayoutNodeManager.js", ["require", "exports", "module", "github:ijzerenhein/famous-flex@0.3.4/src/LayoutContext.js", "github:ijzerenhein/famous-flex@0.3.4/src/LayoutUtility.js", "npm:famous@0.3.5/core/Surface.js", "npm:famous@0.3.5/core/RenderNode.js"], function(require, exports, module) {
  var LayoutContext = require("github:ijzerenhein/famous-flex@0.3.4/src/LayoutContext.js");
  var LayoutUtility = require("github:ijzerenhein/famous-flex@0.3.4/src/LayoutUtility.js");
  var Surface = require("npm:famous@0.3.5/core/Surface.js");
  var RenderNode = require("npm:famous@0.3.5/core/RenderNode.js");
  var MAX_POOL_SIZE = 100;
  function LayoutNodeManager(LayoutNode, initLayoutNodeFn) {
    this.LayoutNode = LayoutNode;
    this._initLayoutNodeFn = initLayoutNodeFn;
    this._layoutCount = 0;
    this._context = new LayoutContext({
      next: _contextNext.bind(this),
      prev: _contextPrev.bind(this),
      get: _contextGet.bind(this),
      set: _contextSet.bind(this),
      resolveSize: _contextResolveSize.bind(this),
      size: [0, 0]
    });
    this._contextState = {};
    this._pool = {
      layoutNodes: {size: 0},
      resolveSize: [0, 0]
    };
  }
  LayoutNodeManager.prototype.prepareForLayout = function(viewSequence, nodesById, contextData) {
    var node = this._first;
    while (node) {
      node.reset();
      node = node._next;
    }
    var context = this._context;
    this._layoutCount++;
    this._nodesById = nodesById;
    this._trueSizeRequested = false;
    this._reevalTrueSize = contextData.reevalTrueSize || !context.size || (context.size[0] !== contextData.size[0]) || (context.size[1] !== contextData.size[1]);
    var contextState = this._contextState;
    contextState.startSequence = viewSequence;
    contextState.nextSequence = viewSequence;
    contextState.prevSequence = viewSequence;
    contextState.start = undefined;
    contextState.nextGetIndex = 0;
    contextState.prevGetIndex = 0;
    contextState.nextSetIndex = 0;
    contextState.prevSetIndex = 0;
    contextState.addCount = 0;
    contextState.removeCount = 0;
    contextState.lastRenderNode = undefined;
    context.size[0] = contextData.size[0];
    context.size[1] = contextData.size[1];
    context.direction = contextData.direction;
    context.reverse = contextData.reverse;
    context.alignment = contextData.reverse ? 1 : 0;
    context.scrollOffset = contextData.scrollOffset || 0;
    context.scrollStart = contextData.scrollStart || 0;
    context.scrollEnd = contextData.scrollEnd || context.size[context.direction];
    return context;
  };
  LayoutNodeManager.prototype.removeNonInvalidatedNodes = function(removeSpec) {
    var node = this._first;
    while (node) {
      if (!node._invalidated && !node._removing) {
        node.remove(removeSpec);
      }
      node = node._next;
    }
  };
  LayoutNodeManager.prototype.removeVirtualViewSequenceNodes = function() {
    if (this._contextState.startSequence && this._contextState.startSequence.cleanup) {
      this._contextState.startSequence.cleanup();
    }
  };
  LayoutNodeManager.prototype.buildSpecAndDestroyUnrenderedNodes = function(translate) {
    var specs = [];
    var result = {
      specs: specs,
      modified: false
    };
    var node = this._first;
    while (node) {
      var modified = node._specModified;
      var spec = node.getSpec();
      if (spec.removed) {
        var destroyNode = node;
        node = node._next;
        _destroyNode.call(this, destroyNode);
        result.modified = true;
      } else {
        if (modified) {
          if (spec.transform && translate) {
            spec.transform[12] += translate[0];
            spec.transform[13] += translate[1];
            spec.transform[14] += translate[2];
            spec.transform[12] = Math.round(spec.transform[12] * 100000) / 100000;
            spec.transform[13] = Math.round(spec.transform[13] * 100000) / 100000;
            if (spec.endState) {
              spec.endState.transform[12] += translate[0];
              spec.endState.transform[13] += translate[1];
              spec.endState.transform[14] += translate[2];
              spec.endState.transform[12] = Math.round(spec.endState.transform[12] * 100000) / 100000;
              spec.endState.transform[13] = Math.round(spec.endState.transform[13] * 100000) / 100000;
            }
          }
          result.modified = true;
        }
        spec.usesTrueSize = node.usesTrueSize;
        spec.trueSizeRequested = node.trueSizeRequested;
        specs.push(spec);
        node = node._next;
      }
    }
    this._contextState.addCount = 0;
    this._contextState.removeCount = 0;
    return result;
  };
  LayoutNodeManager.prototype.getNodeByRenderNode = function(renderable) {
    var node = this._first;
    while (node) {
      if (node.renderNode === renderable) {
        return node;
      }
      node = node._next;
    }
    return undefined;
  };
  LayoutNodeManager.prototype.insertNode = function(node) {
    node._next = this._first;
    if (this._first) {
      this._first._prev = node;
    }
    this._first = node;
  };
  LayoutNodeManager.prototype.setNodeOptions = function(options) {
    this._nodeOptions = options;
    var node = this._first;
    while (node) {
      node.setOptions(options);
      node = node._next;
    }
    node = this._pool.layoutNodes.first;
    while (node) {
      node.setOptions(options);
      node = node._next;
    }
  };
  LayoutNodeManager.prototype.preallocateNodes = function(count, spec) {
    var nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push(this.createNode(undefined, spec));
    }
    for (i = 0; i < count; i++) {
      _destroyNode.call(this, nodes[i]);
    }
  };
  LayoutNodeManager.prototype.createNode = function(renderNode, spec) {
    var node;
    if (this._pool.layoutNodes.first) {
      node = this._pool.layoutNodes.first;
      this._pool.layoutNodes.first = node._next;
      this._pool.layoutNodes.size--;
      node.constructor.apply(node, arguments);
    } else {
      node = new this.LayoutNode(renderNode, spec);
      if (this._nodeOptions) {
        node.setOptions(this._nodeOptions);
      }
    }
    node._prev = undefined;
    node._next = undefined;
    node._viewSequence = undefined;
    node._layoutCount = 0;
    if (this._initLayoutNodeFn) {
      this._initLayoutNodeFn.call(this, node, spec);
    }
    return node;
  };
  LayoutNodeManager.prototype.removeAll = function() {
    var node = this._first;
    while (node) {
      var next = node._next;
      _destroyNode.call(this, node);
      node = next;
    }
    this._first = undefined;
  };
  function _destroyNode(node) {
    if (node._next) {
      node._next._prev = node._prev;
    }
    if (node._prev) {
      node._prev._next = node._next;
    } else {
      this._first = node._next;
    }
    node.destroy();
    if (this._pool.layoutNodes.size < MAX_POOL_SIZE) {
      this._pool.layoutNodes.size++;
      node._prev = undefined;
      node._next = this._pool.layoutNodes.first;
      this._pool.layoutNodes.first = node;
    }
  }
  LayoutNodeManager.prototype.getStartEnumNode = function(next) {
    if (next === undefined) {
      return this._first;
    } else if (next === true) {
      return (this._contextState.start && this._contextState.startPrev) ? this._contextState.start._next : this._contextState.start;
    } else if (next === false) {
      return (this._contextState.start && !this._contextState.startPrev) ? this._contextState.start._prev : this._contextState.start;
    }
  };
  function _contextGetCreateAndOrderNodes(renderNode, prev) {
    var node;
    var state = this._contextState;
    if (!state.start) {
      node = this._first;
      while (node) {
        if (node.renderNode === renderNode) {
          break;
        }
        node = node._next;
      }
      if (!node) {
        node = this.createNode(renderNode);
        node._next = this._first;
        if (this._first) {
          this._first._prev = node;
        }
        this._first = node;
      }
      state.start = node;
      state.startPrev = prev;
      state.prev = node;
      state.next = node;
      return node;
    }
    if (prev) {
      if (state.prev._prev && (state.prev._prev.renderNode === renderNode)) {
        state.prev = state.prev._prev;
        return state.prev;
      }
    } else {
      if (state.next._next && (state.next._next.renderNode === renderNode)) {
        state.next = state.next._next;
        return state.next;
      }
    }
    node = this._first;
    while (node) {
      if (node.renderNode === renderNode) {
        break;
      }
      node = node._next;
    }
    if (!node) {
      node = this.createNode(renderNode);
    } else {
      if (node._next) {
        node._next._prev = node._prev;
      }
      if (node._prev) {
        node._prev._next = node._next;
      } else {
        this._first = node._next;
      }
      node._next = undefined;
      node._prev = undefined;
    }
    if (prev) {
      if (state.prev._prev) {
        node._prev = state.prev._prev;
        state.prev._prev._next = node;
      } else {
        this._first = node;
      }
      state.prev._prev = node;
      node._next = state.prev;
      state.prev = node;
    } else {
      if (state.next._next) {
        node._next = state.next._next;
        state.next._next._prev = node;
      }
      state.next._next = node;
      node._prev = state.next;
      state.next = node;
    }
    return node;
  }
  function _contextNext() {
    if (!this._contextState.nextSequence) {
      return undefined;
    }
    if (this._context.reverse) {
      this._contextState.nextSequence = this._contextState.nextSequence.getNext();
      if (!this._contextState.nextSequence) {
        return undefined;
      }
    }
    var renderNode = this._contextState.nextSequence.get();
    if (!renderNode) {
      this._contextState.nextSequence = undefined;
      return undefined;
    }
    var nextSequence = this._contextState.nextSequence;
    if (!this._context.reverse) {
      this._contextState.nextSequence = this._contextState.nextSequence.getNext();
    }
    if (this._contextState.lastRenderNode === renderNode) {
      throw 'ViewSequence is corrupted, should never contain the same renderNode twice, index: ' + nextSequence.getIndex();
    }
    this._contextState.lastRenderNode = renderNode;
    return {
      renderNode: renderNode,
      viewSequence: nextSequence,
      next: true,
      index: ++this._contextState.nextGetIndex
    };
  }
  function _contextPrev() {
    if (!this._contextState.prevSequence) {
      return undefined;
    }
    if (!this._context.reverse) {
      this._contextState.prevSequence = this._contextState.prevSequence.getPrevious();
      if (!this._contextState.prevSequence) {
        return undefined;
      }
    }
    var renderNode = this._contextState.prevSequence.get();
    if (!renderNode) {
      this._contextState.prevSequence = undefined;
      return undefined;
    }
    var prevSequence = this._contextState.prevSequence;
    if (this._context.reverse) {
      this._contextState.prevSequence = this._contextState.prevSequence.getPrevious();
    }
    if (this._contextState.lastRenderNode === renderNode) {
      throw 'ViewSequence is corrupted, should never contain the same renderNode twice, index: ' + prevSequence.getIndex();
    }
    this._contextState.lastRenderNode = renderNode;
    return {
      renderNode: renderNode,
      viewSequence: prevSequence,
      prev: true,
      index: --this._contextState.prevGetIndex
    };
  }
  function _contextGet(contextNodeOrId) {
    if (this._nodesById && ((contextNodeOrId instanceof String) || (typeof contextNodeOrId === 'string'))) {
      var renderNode = this._nodesById[contextNodeOrId];
      if (!renderNode) {
        return undefined;
      }
      if (renderNode instanceof Array) {
        var result = [];
        for (var i = 0,
            j = renderNode.length; i < j; i++) {
          result.push({
            renderNode: renderNode[i],
            arrayElement: true
          });
        }
        return result;
      }
      return {
        renderNode: renderNode,
        byId: true
      };
    } else {
      return contextNodeOrId;
    }
  }
  function _contextSet(contextNodeOrId, set) {
    var contextNode = this._nodesById ? _contextGet.call(this, contextNodeOrId) : contextNodeOrId;
    if (contextNode) {
      var node = contextNode.node;
      if (!node) {
        if (contextNode.next) {
          if (contextNode.index < this._contextState.nextSetIndex) {
            LayoutUtility.error('Nodes must be layed out in the same order as they were requested!');
          }
          this._contextState.nextSetIndex = contextNode.index;
        } else if (contextNode.prev) {
          if (contextNode.index > this._contextState.prevSetIndex) {
            LayoutUtility.error('Nodes must be layed out in the same order as they were requested!');
          }
          this._contextState.prevSetIndex = contextNode.index;
        }
        node = _contextGetCreateAndOrderNodes.call(this, contextNode.renderNode, contextNode.prev);
        node._viewSequence = contextNode.viewSequence;
        node._layoutCount++;
        if (node._layoutCount === 1) {
          this._contextState.addCount++;
        }
        contextNode.node = node;
      }
      node.usesTrueSize = contextNode.usesTrueSize;
      node.trueSizeRequested = contextNode.trueSizeRequested;
      node.set(set, this._context.size);
      contextNode.set = set;
    }
    return set;
  }
  function _resolveConfigSize(renderNode) {
    if (renderNode instanceof RenderNode) {
      var result = null;
      var target = renderNode.get();
      if (target) {
        result = _resolveConfigSize(target);
        if (result) {
          return result;
        }
      }
      if (renderNode._child) {
        return _resolveConfigSize(renderNode._child);
      }
    } else if (renderNode instanceof Surface) {
      return renderNode.size ? {
        renderNode: renderNode,
        size: renderNode.size
      } : undefined;
    } else if (renderNode.options && renderNode.options.size) {
      return {
        renderNode: renderNode,
        size: renderNode.options.size
      };
    }
    return undefined;
  }
  function _contextResolveSize(contextNodeOrId, parentSize) {
    var contextNode = this._nodesById ? _contextGet.call(this, contextNodeOrId) : contextNodeOrId;
    var resolveSize = this._pool.resolveSize;
    if (!contextNode) {
      resolveSize[0] = 0;
      resolveSize[1] = 0;
      return resolveSize;
    }
    var renderNode = contextNode.renderNode;
    var size = renderNode.getSize();
    if (!size) {
      return parentSize;
    }
    var configSize = _resolveConfigSize(renderNode);
    if (configSize && ((configSize.size[0] === true) || (configSize.size[1] === true))) {
      contextNode.usesTrueSize = true;
      if (configSize.renderNode instanceof Surface) {
        var backupSize = configSize.renderNode._backupSize;
        if (configSize.renderNode._contentDirty || configSize.renderNode._trueSizeCheck) {
          this._trueSizeRequested = true;
          contextNode.trueSizeRequested = true;
        }
        if (configSize.renderNode._trueSizeCheck) {
          if (backupSize && (configSize.size !== size)) {
            var newWidth = (configSize.size[0] === true) ? Math.max(backupSize[0], size[0]) : size[0];
            var newHeight = (configSize.size[1] === true) ? Math.max(backupSize[1], size[1]) : size[1];
            backupSize[0] = newWidth;
            backupSize[1] = newHeight;
            size = backupSize;
            configSize.renderNode._backupSize = undefined;
            backupSize = undefined;
          }
        }
        if (this._reevalTrueSize || (backupSize && ((backupSize[0] !== size[0]) || (backupSize[1] !== size[1])))) {
          configSize.renderNode._trueSizeCheck = true;
          configSize.renderNode._sizeDirty = true;
          this._trueSizeRequested = true;
        }
        if (!backupSize) {
          configSize.renderNode._backupSize = [0, 0];
          backupSize = configSize.renderNode._backupSize;
        }
        backupSize[0] = size[0];
        backupSize[1] = size[1];
      } else if (configSize.renderNode._nodes) {
        if (this._reevalTrueSize || configSize.renderNode._nodes._trueSizeRequested) {
          contextNode.trueSizeRequested = true;
          this._trueSizeRequested = true;
        }
      }
    }
    if ((size[0] === undefined) || (size[0] === true) || (size[1] === undefined) || (size[1] === true)) {
      resolveSize[0] = size[0];
      resolveSize[1] = size[1];
      size = resolveSize;
      if (size[0] === undefined) {
        size[0] = parentSize[0];
      } else if (size[0] === true) {
        size[0] = 0;
        this._trueSizeRequested = true;
        contextNode.trueSizeRequested = true;
      }
      if (size[1] === undefined) {
        size[1] = parentSize[1];
      } else if (size[1] === true) {
        size[1] = 0;
        this._trueSizeRequested = true;
        contextNode.trueSizeRequested = true;
      }
    }
    return size;
  }
  module.exports = LayoutNodeManager;
});

_removeDefine();
})();
(function() {
var _removeDefine = System.get("@@amd-helpers").createDefine();
define("github:ijzerenhein/famous-flex@0.3.4/src/FlowLayoutNode.js", ["require", "exports", "module", "npm:famous@0.3.5/core/OptionsManager.js", "npm:famous@0.3.5/core/Transform.js", "npm:famous@0.3.5/math/Vector.js", "npm:famous@0.3.5/physics/bodies/Particle.js", "npm:famous@0.3.5/physics/forces/Spring.js", "npm:famous@0.3.5/physics/PhysicsEngine.js", "github:ijzerenhein/famous-flex@0.3.4/src/LayoutNode.js", "npm:famous@0.3.5/transitions/Transitionable.js"], function(require, exports, module) {
  var OptionsManager = require("npm:famous@0.3.5/core/OptionsManager.js");
  var Transform = require("npm:famous@0.3.5/core/Transform.js");
  var Vector = require("npm:famous@0.3.5/math/Vector.js");
  var Particle = require("npm:famous@0.3.5/physics/bodies/Particle.js");
  var Spring = require("npm:famous@0.3.5/physics/forces/Spring.js");
  var PhysicsEngine = require("npm:famous@0.3.5/physics/PhysicsEngine.js");
  var LayoutNode = require("github:ijzerenhein/famous-flex@0.3.4/src/LayoutNode.js");
  var Transitionable = require("npm:famous@0.3.5/transitions/Transitionable.js");
  function FlowLayoutNode(renderNode, spec) {
    LayoutNode.apply(this, arguments);
    if (!this.options) {
      this.options = Object.create(this.constructor.DEFAULT_OPTIONS);
      this._optionsManager = new OptionsManager(this.options);
    }
    if (!this._pe) {
      this._pe = new PhysicsEngine();
      this._pe.sleep();
    }
    if (!this._properties) {
      this._properties = {};
    } else {
      for (var propName in this._properties) {
        this._properties[propName].init = false;
      }
    }
    if (!this._lockTransitionable) {
      this._lockTransitionable = new Transitionable(1);
    } else {
      this._lockTransitionable.halt();
      this._lockTransitionable.reset(1);
    }
    this._specModified = true;
    this._initial = true;
    this._spec.endState = {};
    if (spec) {
      this.setSpec(spec);
    }
  }
  FlowLayoutNode.prototype = Object.create(LayoutNode.prototype);
  FlowLayoutNode.prototype.constructor = FlowLayoutNode;
  FlowLayoutNode.DEFAULT_OPTIONS = {
    spring: {
      dampingRatio: 0.8,
      period: 300
    },
    properties: {
      opacity: true,
      align: true,
      origin: true,
      size: true,
      translate: true,
      skew: true,
      rotate: true,
      scale: true
    },
    particleRounding: 0.001
  };
  var DEFAULT = {
    opacity: 1,
    opacity2D: [1, 0],
    size: [0, 0],
    origin: [0, 0],
    align: [0, 0],
    scale: [1, 1, 1],
    translate: [0, 0, 0],
    rotate: [0, 0, 0],
    skew: [0, 0, 0]
  };
  FlowLayoutNode.prototype.setOptions = function(options) {
    this._optionsManager.setOptions(options);
    var wasSleeping = this._pe.isSleeping();
    for (var propName in this._properties) {
      var prop = this._properties[propName];
      if (options.spring && prop.force) {
        prop.force.setOptions(this.options.spring);
      }
      if (options.properties && (options.properties[propName] !== undefined)) {
        if (this.options.properties[propName].length) {
          prop.enabled = this.options.properties[propName];
        } else {
          prop.enabled = [this.options.properties[propName], this.options.properties[propName], this.options.properties[propName]];
        }
      }
    }
    if (wasSleeping) {
      this._pe.sleep();
    }
    return this;
  };
  FlowLayoutNode.prototype.setSpec = function(spec) {
    var set;
    if (spec.transform) {
      set = Transform.interpret(spec.transform);
    }
    if (!set) {
      set = {};
    }
    set.opacity = spec.opacity;
    set.size = spec.size;
    set.align = spec.align;
    set.origin = spec.origin;
    var oldRemoving = this._removing;
    var oldInvalidated = this._invalidated;
    this.set(set);
    this._removing = oldRemoving;
    this._invalidated = oldInvalidated;
  };
  FlowLayoutNode.prototype.reset = function() {
    if (this._invalidated) {
      for (var propName in this._properties) {
        this._properties[propName].invalidated = false;
      }
      this._invalidated = false;
    }
    this.trueSizeRequested = false;
    this.usesTrueSize = false;
  };
  FlowLayoutNode.prototype.remove = function(removeSpec) {
    this._removing = true;
    if (removeSpec) {
      this.setSpec(removeSpec);
    } else {
      this._pe.sleep();
      this._specModified = false;
    }
    this._invalidated = false;
  };
  FlowLayoutNode.prototype.releaseLock = function(enable) {
    this._lockTransitionable.halt();
    this._lockTransitionable.reset(0);
    if (enable) {
      this._lockTransitionable.set(1, {duration: this.options.spring.period || 1000});
    }
  };
  function _getRoundedValue3D(prop, def, precision, lockValue) {
    if (!prop || !prop.init) {
      return def;
    }
    return [prop.enabled[0] ? (Math.round((prop.curState.x + ((prop.endState.x - prop.curState.x) * lockValue)) / precision) * precision) : prop.endState.x, prop.enabled[1] ? (Math.round((prop.curState.y + ((prop.endState.y - prop.curState.y) * lockValue)) / precision) * precision) : prop.endState.y, prop.enabled[2] ? (Math.round((prop.curState.z + ((prop.endState.z - prop.curState.z) * lockValue)) / precision) * precision) : prop.endState.z];
  }
  FlowLayoutNode.prototype.getSpec = function() {
    var endStateReached = this._pe.isSleeping();
    if (!this._specModified && endStateReached) {
      this._spec.removed = !this._invalidated;
      return this._spec;
    }
    this._initial = false;
    this._specModified = !endStateReached;
    this._spec.removed = false;
    if (!endStateReached) {
      this._pe.step();
    }
    var spec = this._spec;
    var precision = this.options.particleRounding;
    var lockValue = this._lockTransitionable.get();
    var prop = this._properties.opacity;
    if (prop && prop.init) {
      spec.opacity = prop.enabled[0] ? (Math.round(Math.max(0, Math.min(1, prop.curState.x)) / precision) * precision) : prop.endState.x;
      spec.endState.opacity = prop.endState.x;
    } else {
      spec.opacity = undefined;
      spec.endState.opacity = undefined;
    }
    prop = this._properties.size;
    if (prop && prop.init) {
      spec.size = spec.size || [0, 0];
      spec.size[0] = prop.enabled[0] ? (Math.round((prop.curState.x + ((prop.endState.x - prop.curState.x) * lockValue)) / 0.1) * 0.1) : prop.endState.x;
      spec.size[1] = prop.enabled[1] ? (Math.round((prop.curState.y + ((prop.endState.y - prop.curState.y) * lockValue)) / 0.1) * 0.1) : prop.endState.y;
      spec.endState.size = spec.endState.size || [0, 0];
      spec.endState.size[0] = prop.endState.x;
      spec.endState.size[1] = prop.endState.y;
    } else {
      spec.size = undefined;
      spec.endState.size = undefined;
    }
    prop = this._properties.align;
    if (prop && prop.init) {
      spec.align = spec.align || [0, 0];
      spec.align[0] = prop.enabled[0] ? (Math.round((prop.curState.x + ((prop.endState.x - prop.curState.x) * lockValue)) / 0.1) * 0.1) : prop.endState.x;
      spec.align[1] = prop.enabled[1] ? (Math.round((prop.curState.y + ((prop.endState.y - prop.curState.y) * lockValue)) / 0.1) * 0.1) : prop.endState.y;
      spec.endState.align = spec.endState.align || [0, 0];
      spec.endState.align[0] = prop.endState.x;
      spec.endState.align[1] = prop.endState.y;
    } else {
      spec.align = undefined;
      spec.endState.align = undefined;
    }
    prop = this._properties.origin;
    if (prop && prop.init) {
      spec.origin = spec.origin || [0, 0];
      spec.origin[0] = prop.enabled[0] ? (Math.round((prop.curState.x + ((prop.endState.x - prop.curState.x) * lockValue)) / 0.1) * 0.1) : prop.endState.x;
      spec.origin[1] = prop.enabled[1] ? (Math.round((prop.curState.y + ((prop.endState.y - prop.curState.y) * lockValue)) / 0.1) * 0.1) : prop.endState.y;
      spec.endState.origin = spec.endState.origin || [0, 0];
      spec.endState.origin[0] = prop.endState.x;
      spec.endState.origin[1] = prop.endState.y;
    } else {
      spec.origin = undefined;
      spec.endState.origin = undefined;
    }
    var translate = this._properties.translate;
    var translateX;
    var translateY;
    var translateZ;
    if (translate && translate.init) {
      translateX = translate.enabled[0] ? (Math.round((translate.curState.x + ((translate.endState.x - translate.curState.x) * lockValue)) / precision) * precision) : translate.endState.x;
      translateY = translate.enabled[1] ? (Math.round((translate.curState.y + ((translate.endState.y - translate.curState.y) * lockValue)) / precision) * precision) : translate.endState.y;
      translateZ = translate.enabled[2] ? (Math.round((translate.curState.z + ((translate.endState.z - translate.curState.z) * lockValue)) / precision) * precision) : translate.endState.z;
    } else {
      translateX = 0;
      translateY = 0;
      translateZ = 0;
    }
    var scale = this._properties.scale;
    var skew = this._properties.skew;
    var rotate = this._properties.rotate;
    if (scale || skew || rotate) {
      spec.transform = Transform.build({
        translate: [translateX, translateY, translateZ],
        skew: _getRoundedValue3D.call(this, skew, DEFAULT.skew, this.options.particleRounding, lockValue),
        scale: _getRoundedValue3D.call(this, scale, DEFAULT.scale, this.options.particleRounding, lockValue),
        rotate: _getRoundedValue3D.call(this, rotate, DEFAULT.rotate, this.options.particleRounding, lockValue)
      });
      spec.endState.transform = Transform.build({
        translate: translate ? [translate.endState.x, translate.endState.y, translate.endState.z] : DEFAULT.translate,
        scale: scale ? [scale.endState.x, scale.endState.y, scale.endState.z] : DEFAULT.scale,
        skew: skew ? [skew.endState.x, skew.endState.y, skew.endState.z] : DEFAULT.skew,
        rotate: rotate ? [rotate.endState.x, rotate.endState.y, rotate.endState.z] : DEFAULT.rotate
      });
    } else if (translate) {
      if (!spec.transform) {
        spec.transform = Transform.translate(translateX, translateY, translateZ);
      } else {
        spec.transform[12] = translateX;
        spec.transform[13] = translateY;
        spec.transform[14] = translateZ;
      }
      if (!spec.endState.transform) {
        spec.endState.transform = Transform.translate(translate.endState.x, translate.endState.y, translate.endState.z);
      } else {
        spec.endState.transform[12] = translate.endState.x;
        spec.endState.transform[13] = translate.endState.y;
        spec.endState.transform[14] = translate.endState.z;
      }
    } else {
      spec.transform = undefined;
      spec.endState.transform = undefined;
    }
    return this._spec;
  };
  function _setPropertyValue(prop, propName, endState, defaultValue, immediate, isTranslate) {
    prop = prop || this._properties[propName];
    if (prop && prop.init) {
      prop.invalidated = true;
      var value = defaultValue;
      if (endState !== undefined) {
        value = endState;
      } else if (this._removing) {
        value = prop.particle.getPosition();
      }
      prop.endState.x = value[0];
      prop.endState.y = (value.length > 1) ? value[1] : 0;
      prop.endState.z = (value.length > 2) ? value[2] : 0;
      if (immediate) {
        prop.curState.x = prop.endState.x;
        prop.curState.y = prop.endState.y;
        prop.curState.z = prop.endState.z;
        prop.velocity.x = 0;
        prop.velocity.y = 0;
        prop.velocity.z = 0;
      } else if ((prop.endState.x !== prop.curState.x) || (prop.endState.y !== prop.curState.y) || (prop.endState.z !== prop.curState.z)) {
        this._pe.wake();
      }
      return;
    } else {
      var wasSleeping = this._pe.isSleeping();
      if (!prop) {
        prop = {
          particle: new Particle({position: (this._initial || immediate) ? endState : defaultValue}),
          endState: new Vector(endState)
        };
        prop.curState = prop.particle.position;
        prop.velocity = prop.particle.velocity;
        prop.force = new Spring(this.options.spring);
        prop.force.setOptions({anchor: prop.endState});
        this._pe.addBody(prop.particle);
        prop.forceId = this._pe.attach(prop.force, prop.particle);
        this._properties[propName] = prop;
      } else {
        prop.particle.setPosition((this._initial || immediate) ? endState : defaultValue);
        prop.endState.set(endState);
      }
      if (!this._initial && !immediate) {
        this._pe.wake();
      } else if (wasSleeping) {
        this._pe.sleep();
      }
      if (this.options.properties[propName] && this.options.properties[propName].length) {
        prop.enabled = this.options.properties[propName];
      } else {
        prop.enabled = [this.options.properties[propName], this.options.properties[propName], this.options.properties[propName]];
      }
      prop.init = true;
      prop.invalidated = true;
    }
  }
  function _getIfNE2D(a1, a2) {
    return ((a1[0] === a2[0]) && (a1[1] === a2[1])) ? undefined : a1;
  }
  function _getIfNE3D(a1, a2) {
    return ((a1[0] === a2[0]) && (a1[1] === a2[1]) && (a1[2] === a2[2])) ? undefined : a1;
  }
  FlowLayoutNode.prototype.set = function(set, defaultSize) {
    if (defaultSize) {
      this._removing = false;
    }
    this._invalidated = true;
    this.scrollLength = set.scrollLength;
    this._specModified = true;
    var prop = this._properties.opacity;
    var value = (set.opacity === DEFAULT.opacity) ? undefined : set.opacity;
    if ((value !== undefined) || (prop && prop.init)) {
      _setPropertyValue.call(this, prop, 'opacity', (value === undefined) ? undefined : [value, 0], DEFAULT.opacity2D);
    }
    prop = this._properties.align;
    value = set.align ? _getIfNE2D(set.align, DEFAULT.align) : undefined;
    if (value || (prop && prop.init)) {
      _setPropertyValue.call(this, prop, 'align', value, DEFAULT.align);
    }
    prop = this._properties.origin;
    value = set.origin ? _getIfNE2D(set.origin, DEFAULT.origin) : undefined;
    if (value || (prop && prop.init)) {
      _setPropertyValue.call(this, prop, 'origin', value, DEFAULT.origin);
    }
    prop = this._properties.size;
    value = set.size || defaultSize;
    if (value || (prop && prop.init)) {
      _setPropertyValue.call(this, prop, 'size', value, defaultSize, this.usesTrueSize);
    }
    prop = this._properties.translate;
    value = set.translate;
    if (value || (prop && prop.init)) {
      _setPropertyValue.call(this, prop, 'translate', value, DEFAULT.translate, undefined, true);
    }
    prop = this._properties.scale;
    value = set.scale ? _getIfNE3D(set.scale, DEFAULT.scale) : undefined;
    if (value || (prop && prop.init)) {
      _setPropertyValue.call(this, prop, 'scale', value, DEFAULT.scale);
    }
    prop = this._properties.rotate;
    value = set.rotate ? _getIfNE3D(set.rotate, DEFAULT.rotate) : undefined;
    if (value || (prop && prop.init)) {
      _setPropertyValue.call(this, prop, 'rotate', value, DEFAULT.rotate);
    }
    prop = this._properties.skew;
    value = set.skew ? _getIfNE3D(set.skew, DEFAULT.skew) : undefined;
    if (value || (prop && prop.init)) {
      _setPropertyValue.call(this, prop, 'skew', value, DEFAULT.skew);
    }
  };
  module.exports = FlowLayoutNode;
});

_removeDefine();
})();
System.registerDynamic("npm:famous@0.3.5/core/Engine.js", ["npm:famous@0.3.5/core/Context.js", "npm:famous@0.3.5/core/EventHandler.js", "npm:famous@0.3.5/core/OptionsManager.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Context = require("npm:famous@0.3.5/core/Context.js");
  var EventHandler = require("npm:famous@0.3.5/core/EventHandler.js");
  var OptionsManager = require("npm:famous@0.3.5/core/OptionsManager.js");
  var Engine = {};
  var contexts = [];
  var nextTickQueue = [];
  var currentFrame = 0;
  var nextTickFrame = 0;
  var deferQueue = [];
  var lastTime = Date.now();
  var frameTime;
  var frameTimeLimit;
  var loopEnabled = true;
  var eventForwarders = {};
  var eventHandler = new EventHandler();
  var options = {
    containerType: 'div',
    containerClass: 'famous-container',
    fpsCap: undefined,
    runLoop: true,
    appMode: true
  };
  var optionsManager = new OptionsManager(options);
  var MAX_DEFER_FRAME_TIME = 10;
  Engine.step = function step() {
    currentFrame++;
    nextTickFrame = currentFrame;
    var currentTime = Date.now();
    if (frameTimeLimit && currentTime - lastTime < frameTimeLimit)
      return;
    var i = 0;
    frameTime = currentTime - lastTime;
    lastTime = currentTime;
    eventHandler.emit('prerender');
    var numFunctions = nextTickQueue.length;
    while (numFunctions--)
      nextTickQueue.shift()(currentFrame);
    while (deferQueue.length && Date.now() - currentTime < MAX_DEFER_FRAME_TIME) {
      deferQueue.shift().call(this);
    }
    for (i = 0; i < contexts.length; i++)
      contexts[i].update();
    eventHandler.emit('postrender');
  };
  function loop() {
    if (options.runLoop) {
      Engine.step();
      window.requestAnimationFrame(loop);
    } else
      loopEnabled = false;
  }
  window.requestAnimationFrame(loop);
  function handleResize(event) {
    for (var i = 0; i < contexts.length; i++) {
      contexts[i].emit('resize');
    }
    eventHandler.emit('resize');
  }
  window.addEventListener('resize', handleResize, false);
  handleResize();
  function initialize() {
    window.addEventListener('touchmove', function(event) {
      event.preventDefault();
    }, true);
    addRootClasses();
  }
  var initialized = false;
  function addRootClasses() {
    if (!document.body) {
      Engine.nextTick(addRootClasses);
      return;
    }
    document.body.classList.add('famous-root');
    document.documentElement.classList.add('famous-root');
  }
  Engine.pipe = function pipe(target) {
    if (target.subscribe instanceof Function)
      return target.subscribe(Engine);
    else
      return eventHandler.pipe(target);
  };
  Engine.unpipe = function unpipe(target) {
    if (target.unsubscribe instanceof Function)
      return target.unsubscribe(Engine);
    else
      return eventHandler.unpipe(target);
  };
  Engine.on = function on(type, handler) {
    if (!(type in eventForwarders)) {
      eventForwarders[type] = eventHandler.emit.bind(eventHandler, type);
      addEngineListener(type, eventForwarders[type]);
    }
    return eventHandler.on(type, handler);
  };
  function addEngineListener(type, forwarder) {
    if (!document.body) {
      Engine.nextTick(addEventListener.bind(this, type, forwarder));
      return;
    }
    document.body.addEventListener(type, forwarder);
  }
  Engine.emit = function emit(type, event) {
    return eventHandler.emit(type, event);
  };
  Engine.removeListener = function removeListener(type, handler) {
    return eventHandler.removeListener(type, handler);
  };
  Engine.getFPS = function getFPS() {
    return 1000 / frameTime;
  };
  Engine.setFPSCap = function setFPSCap(fps) {
    frameTimeLimit = Math.floor(1000 / fps);
  };
  Engine.getOptions = function getOptions(key) {
    return optionsManager.getOptions(key);
  };
  Engine.setOptions = function setOptions(options) {
    return optionsManager.setOptions.apply(optionsManager, arguments);
  };
  Engine.createContext = function createContext(el) {
    if (!initialized && options.appMode)
      Engine.nextTick(initialize);
    var needMountContainer = false;
    if (!el) {
      el = document.createElement(options.containerType);
      el.classList.add(options.containerClass);
      needMountContainer = true;
    }
    var context = new Context(el);
    Engine.registerContext(context);
    if (needMountContainer)
      mount(context, el);
    return context;
  };
  function mount(context, el) {
    if (!document.body) {
      Engine.nextTick(mount.bind(this, context, el));
      return;
    }
    document.body.appendChild(el);
    context.emit('resize');
  }
  Engine.registerContext = function registerContext(context) {
    contexts.push(context);
    return context;
  };
  Engine.getContexts = function getContexts() {
    return contexts;
  };
  Engine.deregisterContext = function deregisterContext(context) {
    var i = contexts.indexOf(context);
    if (i >= 0)
      contexts.splice(i, 1);
  };
  Engine.nextTick = function nextTick(fn) {
    nextTickQueue.push(fn);
  };
  Engine.defer = function defer(fn) {
    deferQueue.push(fn);
  };
  optionsManager.on('change', function(data) {
    if (data.id === 'fpsCap')
      Engine.setFPSCap(data.value);
    else if (data.id === 'runLoop') {
      if (!loopEnabled && data.value) {
        loopEnabled = true;
        window.requestAnimationFrame(loop);
      }
    }
  });
  module.exports = Engine;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("github:jspm/nodelibs-process@0.1.1.js", ["github:jspm/nodelibs-process@0.1.1/index.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("github:jspm/nodelibs-process@0.1.1/index.js");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:famous@0.3.5/core/View.js", ["npm:famous@0.3.5/core/EventHandler.js", "npm:famous@0.3.5/core/OptionsManager.js", "npm:famous@0.3.5/core/RenderNode.js", "npm:famous@0.3.5/utilities/Utility.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var EventHandler = require("npm:famous@0.3.5/core/EventHandler.js");
  var OptionsManager = require("npm:famous@0.3.5/core/OptionsManager.js");
  var RenderNode = require("npm:famous@0.3.5/core/RenderNode.js");
  var Utility = require("npm:famous@0.3.5/utilities/Utility.js");
  function View(options) {
    this._node = new RenderNode();
    this._eventInput = new EventHandler();
    this._eventOutput = new EventHandler();
    EventHandler.setInputHandler(this, this._eventInput);
    EventHandler.setOutputHandler(this, this._eventOutput);
    this.options = Utility.clone(this.constructor.DEFAULT_OPTIONS || View.DEFAULT_OPTIONS);
    this._optionsManager = new OptionsManager(this.options);
    if (options)
      this.setOptions(options);
  }
  View.DEFAULT_OPTIONS = {};
  View.prototype.getOptions = function getOptions(key) {
    return this._optionsManager.getOptions(key);
  };
  View.prototype.setOptions = function setOptions(options) {
    this._optionsManager.patch(options);
  };
  View.prototype.add = function add() {
    return this._node.add.apply(this._node, arguments);
  };
  View.prototype._add = View.prototype.add;
  View.prototype.render = function render() {
    return this._node.render();
  };
  View.prototype.getSize = function getSize() {
    if (this._node && this._node.getSize) {
      return this._node.getSize.apply(this._node, arguments) || this.options.size;
    } else
      return this.options.size;
  };
  module.exports = View;
  global.define = __define;
  return module.exports;
});

(function() {
var _removeDefine = System.get("@@amd-helpers").createDefine();
define("github:ijzerenhein/famous-flex@0.3.4/src/LayoutController.js", ["require", "exports", "module", "npm:famous@0.3.5/utilities/Utility.js", "npm:famous@0.3.5/core/Entity.js", "npm:famous@0.3.5/core/ViewSequence.js", "npm:famous@0.3.5/core/OptionsManager.js", "npm:famous@0.3.5/core/EventHandler.js", "github:ijzerenhein/famous-flex@0.3.4/src/LayoutUtility.js", "github:ijzerenhein/famous-flex@0.3.4/src/LayoutNodeManager.js", "github:ijzerenhein/famous-flex@0.3.4/src/LayoutNode.js", "github:ijzerenhein/famous-flex@0.3.4/src/FlowLayoutNode.js", "npm:famous@0.3.5/core/Transform.js", "github:ijzerenhein/famous-flex@0.3.4/src/helpers/LayoutDockHelper.js"], function(require, exports, module) {
  var Utility = require("npm:famous@0.3.5/utilities/Utility.js");
  var Entity = require("npm:famous@0.3.5/core/Entity.js");
  var ViewSequence = require("npm:famous@0.3.5/core/ViewSequence.js");
  var OptionsManager = require("npm:famous@0.3.5/core/OptionsManager.js");
  var EventHandler = require("npm:famous@0.3.5/core/EventHandler.js");
  var LayoutUtility = require("github:ijzerenhein/famous-flex@0.3.4/src/LayoutUtility.js");
  var LayoutNodeManager = require("github:ijzerenhein/famous-flex@0.3.4/src/LayoutNodeManager.js");
  var LayoutNode = require("github:ijzerenhein/famous-flex@0.3.4/src/LayoutNode.js");
  var FlowLayoutNode = require("github:ijzerenhein/famous-flex@0.3.4/src/FlowLayoutNode.js");
  var Transform = require("npm:famous@0.3.5/core/Transform.js");
  require("github:ijzerenhein/famous-flex@0.3.4/src/helpers/LayoutDockHelper.js");
  function LayoutController(options, nodeManager) {
    this.id = Entity.register(this);
    this._isDirty = true;
    this._contextSizeCache = [0, 0];
    this._commitOutput = {};
    this._cleanupRegistration = {
      commit: function() {
        return undefined;
      },
      cleanup: function(context) {
        this.cleanup(context);
      }.bind(this)
    };
    this._cleanupRegistration.target = Entity.register(this._cleanupRegistration);
    this._cleanupRegistration.render = function() {
      return this.target;
    }.bind(this._cleanupRegistration);
    this._eventInput = new EventHandler();
    EventHandler.setInputHandler(this, this._eventInput);
    this._eventOutput = new EventHandler();
    EventHandler.setOutputHandler(this, this._eventOutput);
    this._layout = {options: Object.create({})};
    this._layout.optionsManager = new OptionsManager(this._layout.options);
    this._layout.optionsManager.on('change', function() {
      this._isDirty = true;
    }.bind(this));
    this.options = Object.create(LayoutController.DEFAULT_OPTIONS);
    this._optionsManager = new OptionsManager(this.options);
    if (nodeManager) {
      this._nodes = nodeManager;
    } else if (options && options.flow) {
      this._nodes = new LayoutNodeManager(FlowLayoutNode, _initFlowLayoutNode.bind(this));
    } else {
      this._nodes = new LayoutNodeManager(LayoutNode);
    }
    this.setDirection(undefined);
    if (options) {
      this.setOptions(options);
    }
  }
  LayoutController.DEFAULT_OPTIONS = {
    flow: false,
    flowOptions: {
      reflowOnResize: true,
      properties: {
        opacity: true,
        align: true,
        origin: true,
        size: true,
        translate: true,
        skew: true,
        rotate: true,
        scale: true
      },
      spring: {
        dampingRatio: 0.8,
        period: 300
      }
    }
  };
  function _initFlowLayoutNode(node, spec) {
    if (!spec && this.options.flowOptions.insertSpec) {
      node.setSpec(this.options.flowOptions.insertSpec);
    }
  }
  LayoutController.prototype.setOptions = function(options) {
    if ((options.alignment !== undefined) && (options.alignment !== this.options.alignment)) {
      this._isDirty = true;
    }
    this._optionsManager.setOptions(options);
    if (options.nodeSpring) {
      console.warn('nodeSpring options have been moved inside `flowOptions`. Use `flowOptions.spring` instead.');
      this._optionsManager.setOptions({flowOptions: {spring: options.nodeSpring}});
      this._nodes.setNodeOptions(this.options.flowOptions);
    }
    if (options.reflowOnResize !== undefined) {
      console.warn('reflowOnResize options have been moved inside `flowOptions`. Use `flowOptions.reflowOnResize` instead.');
      this._optionsManager.setOptions({flowOptions: {reflowOnResize: options.reflowOnResize}});
      this._nodes.setNodeOptions(this.options.flowOptions);
    }
    if (options.insertSpec) {
      console.warn('insertSpec options have been moved inside `flowOptions`. Use `flowOptions.insertSpec` instead.');
      this._optionsManager.setOptions({flowOptions: {insertSpec: options.insertSpec}});
      this._nodes.setNodeOptions(this.options.flowOptions);
    }
    if (options.removeSpec) {
      console.warn('removeSpec options have been moved inside `flowOptions`. Use `flowOptions.removeSpec` instead.');
      this._optionsManager.setOptions({flowOptions: {removeSpec: options.removeSpec}});
      this._nodes.setNodeOptions(this.options.flowOptions);
    }
    if (options.dataSource) {
      this.setDataSource(options.dataSource);
    }
    if (options.layout) {
      this.setLayout(options.layout, options.layoutOptions);
    } else if (options.layoutOptions) {
      this.setLayoutOptions(options.layoutOptions);
    }
    if (options.direction !== undefined) {
      this.setDirection(options.direction);
    }
    if (options.flowOptions && this.options.flow) {
      this._nodes.setNodeOptions(this.options.flowOptions);
    }
    if (options.preallocateNodes) {
      this._nodes.preallocateNodes(options.preallocateNodes.count || 0, options.preallocateNodes.spec);
    }
    return this;
  };
  function _forEachRenderable(callback) {
    var dataSource = this._dataSource;
    if (dataSource instanceof Array) {
      for (var i = 0,
          j = dataSource.length; i < j; i++) {
        callback(dataSource[i]);
      }
    } else if (dataSource instanceof ViewSequence) {
      var renderable;
      while (dataSource) {
        renderable = dataSource.get();
        if (!renderable) {
          break;
        }
        callback(renderable);
        dataSource = dataSource.getNext();
      }
    } else {
      for (var key in dataSource) {
        callback(dataSource[key]);
      }
    }
  }
  LayoutController.prototype.setDataSource = function(dataSource) {
    this._dataSource = dataSource;
    this._initialViewSequence = undefined;
    this._nodesById = undefined;
    if (dataSource instanceof Array) {
      this._viewSequence = new ViewSequence(dataSource);
      this._initialViewSequence = this._viewSequence;
    } else if ((dataSource instanceof ViewSequence) || dataSource.getNext) {
      this._viewSequence = dataSource;
      this._initialViewSequence = dataSource;
    } else if (dataSource instanceof Object) {
      this._nodesById = dataSource;
    }
    if (this.options.autoPipeEvents) {
      if (this._dataSource.pipe) {
        this._dataSource.pipe(this);
        this._dataSource.pipe(this._eventOutput);
      } else {
        _forEachRenderable.call(this, function(renderable) {
          if (renderable && renderable.pipe) {
            renderable.pipe(this);
            renderable.pipe(this._eventOutput);
          }
        }.bind(this));
      }
    }
    this._isDirty = true;
    return this;
  };
  LayoutController.prototype.getDataSource = function() {
    return this._dataSource;
  };
  LayoutController.prototype.setLayout = function(layout, options) {
    if (layout instanceof Function) {
      this._layout._function = layout;
      this._layout.capabilities = layout.Capabilities;
      this._layout.literal = undefined;
    } else if (layout instanceof Object) {
      this._layout.literal = layout;
      this._layout.capabilities = undefined;
      var helperName = Object.keys(layout)[0];
      var Helper = LayoutUtility.getRegisteredHelper(helperName);
      this._layout._function = Helper ? function(context, options2) {
        var helper = new Helper(context, options2);
        helper.parse(layout[helperName]);
      } : undefined;
    } else {
      this._layout._function = undefined;
      this._layout.capabilities = undefined;
      this._layout.literal = undefined;
    }
    if (options) {
      this.setLayoutOptions(options);
    }
    this.setDirection(this._configuredDirection);
    this._isDirty = true;
    return this;
  };
  LayoutController.prototype.getLayout = function() {
    return this._layout.literal || this._layout._function;
  };
  LayoutController.prototype.setLayoutOptions = function(options) {
    this._layout.optionsManager.setOptions(options);
    return this;
  };
  LayoutController.prototype.getLayoutOptions = function() {
    return this._layout.options;
  };
  function _getActualDirection(direction) {
    if (this._layout.capabilities && this._layout.capabilities.direction) {
      if (Array.isArray(this._layout.capabilities.direction)) {
        for (var i = 0; i < this._layout.capabilities.direction.length; i++) {
          if (this._layout.capabilities.direction[i] === direction) {
            return direction;
          }
        }
        return this._layout.capabilities.direction[0];
      } else {
        return this._layout.capabilities.direction;
      }
    }
    return (direction === undefined) ? Utility.Direction.Y : direction;
  }
  LayoutController.prototype.setDirection = function(direction) {
    this._configuredDirection = direction;
    var newDirection = _getActualDirection.call(this, direction);
    if (newDirection !== this._direction) {
      this._direction = newDirection;
      this._isDirty = true;
    }
  };
  LayoutController.prototype.getDirection = function(actual) {
    return actual ? this._direction : this._configuredDirection;
  };
  LayoutController.prototype.getSpec = function(node, normalize, endState) {
    if (!node) {
      return undefined;
    }
    if ((node instanceof String) || (typeof node === 'string')) {
      if (!this._nodesById) {
        return undefined;
      }
      node = this._nodesById[node];
      if (!node) {
        return undefined;
      }
      if (node instanceof Array) {
        return node;
      }
    }
    if (this._specs) {
      for (var i = 0; i < this._specs.length; i++) {
        var spec = this._specs[i];
        if (spec.renderNode === node) {
          if (endState && spec.endState) {
            spec = spec.endState;
          }
          if (normalize && spec.transform && spec.size && (spec.align || spec.origin)) {
            var transform = spec.transform;
            if (spec.align && (spec.align[0] || spec.align[1])) {
              transform = Transform.thenMove(transform, [spec.align[0] * this._contextSizeCache[0], spec.align[1] * this._contextSizeCache[1], 0]);
            }
            if (spec.origin && (spec.origin[0] || spec.origin[1])) {
              transform = Transform.moveThen([-spec.origin[0] * spec.size[0], -spec.origin[1] * spec.size[1], 0], transform);
            }
            return {
              opacity: spec.opacity,
              size: spec.size,
              transform: transform
            };
          }
          return spec;
        }
      }
    }
    return undefined;
  };
  LayoutController.prototype.reflowLayout = function() {
    this._isDirty = true;
    return this;
  };
  LayoutController.prototype.resetFlowState = function() {
    if (this.options.flow) {
      this._resetFlowState = true;
    }
    return this;
  };
  LayoutController.prototype.insert = function(indexOrId, renderable, insertSpec) {
    if ((indexOrId instanceof String) || (typeof indexOrId === 'string')) {
      if (this._dataSource === undefined) {
        this._dataSource = {};
        this._nodesById = this._dataSource;
      }
      if (this._nodesById[indexOrId] === renderable) {
        return this;
      }
      this._nodesById[indexOrId] = renderable;
    } else {
      if (this._dataSource === undefined) {
        this._dataSource = [];
        this._viewSequence = new ViewSequence(this._dataSource);
        this._initialViewSequence = this._viewSequence;
      }
      var dataSource = this._viewSequence || this._dataSource;
      var array = _getDataSourceArray.call(this);
      if (array && (indexOrId === array.length)) {
        indexOrId = -1;
      }
      if (indexOrId === -1) {
        dataSource.push(renderable);
      } else if (indexOrId === 0) {
        if (dataSource === this._viewSequence) {
          dataSource.splice(0, 0, renderable);
          if (this._viewSequence.getIndex() === 0) {
            var nextViewSequence = this._viewSequence.getNext();
            if (nextViewSequence && nextViewSequence.get()) {
              this._viewSequence = nextViewSequence;
            }
          }
        } else {
          dataSource.splice(0, 0, renderable);
        }
      } else {
        dataSource.splice(indexOrId, 0, renderable);
      }
    }
    if (insertSpec) {
      this._nodes.insertNode(this._nodes.createNode(renderable, insertSpec));
    }
    if (this.options.autoPipeEvents && renderable && renderable.pipe) {
      renderable.pipe(this);
      renderable.pipe(this._eventOutput);
    }
    this._isDirty = true;
    return this;
  };
  LayoutController.prototype.push = function(renderable, insertSpec) {
    return this.insert(-1, renderable, insertSpec);
  };
  function _getViewSequenceAtIndex(index, startViewSequence) {
    var viewSequence = startViewSequence || this._viewSequence;
    var i = viewSequence ? viewSequence.getIndex() : index;
    if (index > i) {
      while (viewSequence) {
        viewSequence = viewSequence.getNext();
        if (!viewSequence) {
          return undefined;
        }
        i = viewSequence.getIndex();
        if (i === index) {
          return viewSequence;
        } else if (index < i) {
          return undefined;
        }
      }
    } else if (index < i) {
      while (viewSequence) {
        viewSequence = viewSequence.getPrevious();
        if (!viewSequence) {
          return undefined;
        }
        i = viewSequence.getIndex();
        if (i === index) {
          return viewSequence;
        } else if (index > i) {
          return undefined;
        }
      }
    }
    return viewSequence;
  }
  function _getDataSourceArray() {
    if (Array.isArray(this._dataSource)) {
      return this._dataSource;
    } else if (this._viewSequence || this._viewSequence._) {
      return this._viewSequence._.array;
    }
    return undefined;
  }
  LayoutController.prototype.get = function(indexOrId) {
    if (this._nodesById || (indexOrId instanceof String) || (typeof indexOrId === 'string')) {
      return this._nodesById ? this._nodesById[indexOrId] : undefined;
    }
    var viewSequence = _getViewSequenceAtIndex.call(this, indexOrId);
    return viewSequence ? viewSequence.get() : undefined;
  };
  LayoutController.prototype.swap = function(index, index2) {
    var array = _getDataSourceArray.call(this);
    if (!array) {
      throw '.swap is only supported for dataSources of type Array or ViewSequence';
    }
    if (index === index2) {
      return this;
    }
    if ((index < 0) || (index >= array.length)) {
      throw 'Invalid index (' + index + ') specified to .swap';
    }
    if ((index2 < 0) || (index2 >= array.length)) {
      throw 'Invalid second index (' + index2 + ') specified to .swap';
    }
    var renderNode = array[index];
    array[index] = array[index2];
    array[index2] = renderNode;
    this._isDirty = true;
    return this;
  };
  LayoutController.prototype.replace = function(indexOrId, renderable, noAnimation) {
    var oldRenderable;
    if (this._nodesById || (indexOrId instanceof String) || (typeof indexOrId === 'string')) {
      oldRenderable = this._nodesById[indexOrId];
      if (oldRenderable !== renderable) {
        if (noAnimation && oldRenderable) {
          var node = this._nodes.getNodeByRenderNode(oldRenderable);
          if (node) {
            node.setRenderNode(renderable);
          }
        }
        this._nodesById[indexOrId] = renderable;
        this._isDirty = true;
      }
      return oldRenderable;
    }
    var array = _getDataSourceArray.call(this);
    if (!array) {
      return undefined;
    }
    if ((indexOrId < 0) || (indexOrId >= array.length)) {
      throw 'Invalid index (' + indexOrId + ') specified to .replace';
    }
    oldRenderable = array[indexOrId];
    if (oldRenderable !== renderable) {
      array[indexOrId] = renderable;
      this._isDirty = true;
    }
    return oldRenderable;
  };
  LayoutController.prototype.move = function(index, newIndex) {
    var array = _getDataSourceArray.call(this);
    if (!array) {
      throw '.move is only supported for dataSources of type Array or ViewSequence';
    }
    if ((index < 0) || (index >= array.length)) {
      throw 'Invalid index (' + index + ') specified to .move';
    }
    if ((newIndex < 0) || (newIndex >= array.length)) {
      throw 'Invalid newIndex (' + newIndex + ') specified to .move';
    }
    var item = array.splice(index, 1)[0];
    array.splice(newIndex, 0, item);
    this._isDirty = true;
    return this;
  };
  LayoutController.prototype.remove = function(indexOrId, removeSpec) {
    var renderNode;
    if (this._nodesById || (indexOrId instanceof String) || (typeof indexOrId === 'string')) {
      if ((indexOrId instanceof String) || (typeof indexOrId === 'string')) {
        renderNode = this._nodesById[indexOrId];
        if (renderNode) {
          delete this._nodesById[indexOrId];
        }
      } else {
        for (var key in this._nodesById) {
          if (this._nodesById[key] === indexOrId) {
            delete this._nodesById[key];
            renderNode = indexOrId;
            break;
          }
        }
      }
    } else if ((indexOrId instanceof Number) || (typeof indexOrId === 'number')) {
      var array = _getDataSourceArray.call(this);
      if (!array || (indexOrId < 0) || (indexOrId >= array.length)) {
        throw 'Invalid index (' + indexOrId + ') specified to .remove (or dataSource doesn\'t support remove)';
      }
      renderNode = array[indexOrId];
      this._dataSource.splice(indexOrId, 1);
    } else {
      indexOrId = this._dataSource.indexOf(indexOrId);
      if (indexOrId >= 0) {
        this._dataSource.splice(indexOrId, 1);
        renderNode = indexOrId;
      }
    }
    if (this._viewSequence && renderNode) {
      var viewSequence = _getViewSequenceAtIndex.call(this, this._viewSequence.getIndex(), this._initialViewSequence);
      viewSequence = viewSequence || _getViewSequenceAtIndex.call(this, this._viewSequence.getIndex() - 1, this._initialViewSequence);
      viewSequence = viewSequence || this._dataSource;
      this._viewSequence = viewSequence;
    }
    if (renderNode && removeSpec) {
      var node = this._nodes.getNodeByRenderNode(renderNode);
      if (node) {
        node.remove(removeSpec || this.options.flowOptions.removeSpec);
      }
    }
    if (renderNode) {
      this._isDirty = true;
    }
    return renderNode;
  };
  LayoutController.prototype.removeAll = function(removeSpec) {
    if (this._nodesById) {
      var dirty = false;
      for (var key in this._nodesById) {
        delete this._nodesById[key];
        dirty = true;
      }
      if (dirty) {
        this._isDirty = true;
      }
    } else if (this._dataSource) {
      this.setDataSource([]);
    }
    if (removeSpec) {
      var node = this._nodes.getStartEnumNode();
      while (node) {
        node.remove(removeSpec || this.options.flowOptions.removeSpec);
        node = node._next;
      }
    }
    return this;
  };
  LayoutController.prototype.getSize = function() {
    return this._size || this.options.size;
  };
  LayoutController.prototype.render = function render() {
    return this.id;
  };
  LayoutController.prototype.commit = function commit(context) {
    var transform = context.transform;
    var origin = context.origin;
    var size = context.size;
    var opacity = context.opacity;
    if (this._resetFlowState) {
      this._resetFlowState = false;
      this._isDirty = true;
      this._nodes.removeAll();
    }
    if (size[0] !== this._contextSizeCache[0] || size[1] !== this._contextSizeCache[1] || this._isDirty || this._nodes._trueSizeRequested || this.options.alwaysLayout) {
      var eventData = {
        target: this,
        oldSize: this._contextSizeCache,
        size: size,
        dirty: this._isDirty,
        trueSizeRequested: this._nodes._trueSizeRequested
      };
      this._eventOutput.emit('layoutstart', eventData);
      if (this.options.flow) {
        var lock = false;
        if (!this.options.flowOptions.reflowOnResize) {
          if (!this._isDirty && ((size[0] !== this._contextSizeCache[0]) || (size[1] !== this._contextSizeCache[1]))) {
            lock = undefined;
          } else {
            lock = true;
          }
        }
        if (lock !== undefined) {
          var node = this._nodes.getStartEnumNode();
          while (node) {
            node.releaseLock(lock);
            node = node._next;
          }
        }
      }
      this._contextSizeCache[0] = size[0];
      this._contextSizeCache[1] = size[1];
      this._isDirty = false;
      var scrollEnd;
      if (this.options.size && (this.options.size[this._direction] === true)) {
        scrollEnd = 1000000;
      }
      var layoutContext = this._nodes.prepareForLayout(this._viewSequence, this._nodesById, {
        size: size,
        direction: this._direction,
        scrollEnd: scrollEnd
      });
      if (this._layout._function) {
        this._layout._function(layoutContext, this._layout.options);
      }
      this._nodes.removeNonInvalidatedNodes(this.options.flowOptions.removeSpec);
      this._nodes.removeVirtualViewSequenceNodes();
      if (scrollEnd) {
        scrollEnd = 0;
        node = this._nodes.getStartEnumNode();
        while (node) {
          if (node._invalidated && node.scrollLength) {
            scrollEnd += node.scrollLength;
          }
          node = node._next;
        }
        this._size = this._size || [0, 0];
        this._size[0] = this.options.size[0];
        this._size[1] = this.options.size[1];
        this._size[this._direction] = scrollEnd;
      }
      var result = this._nodes.buildSpecAndDestroyUnrenderedNodes();
      this._specs = result.specs;
      this._commitOutput.target = result.specs;
      this._eventOutput.emit('layoutend', eventData);
      this._eventOutput.emit('reflow', {target: this});
    } else if (this.options.flow) {
      result = this._nodes.buildSpecAndDestroyUnrenderedNodes();
      this._specs = result.specs;
      this._commitOutput.target = result.specs;
      if (result.modified) {
        this._eventOutput.emit('reflow', {target: this});
      }
    }
    var target = this._commitOutput.target;
    for (var i = 0,
        j = target.length; i < j; i++) {
      if (target[i].renderNode) {
        target[i].target = target[i].renderNode.render();
      }
    }
    if (!target.length || (target[target.length - 1] !== this._cleanupRegistration)) {
      target.push(this._cleanupRegistration);
    }
    if (origin && ((origin[0] !== 0) || (origin[1] !== 0))) {
      transform = Transform.moveThen([-size[0] * origin[0], -size[1] * origin[1], 0], transform);
    }
    this._commitOutput.size = size;
    this._commitOutput.opacity = opacity;
    this._commitOutput.transform = transform;
    return this._commitOutput;
  };
  LayoutController.prototype.cleanup = function(context) {
    if (this.options.flow) {
      this._resetFlowState = true;
    }
  };
  module.exports = LayoutController;
});

_removeDefine();
})();
System.registerDynamic("npm:famous@0.3.5/utilities/Timer.js", ["npm:famous@0.3.5/core/Engine.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  var FamousEngine = require("npm:famous@0.3.5/core/Engine.js");
  var _event = 'prerender';
  var getTime = window.performance && window.performance.now ? function() {
    return window.performance.now();
  } : function() {
    return Date.now();
  };
  function addTimerFunction(fn) {
    FamousEngine.on(_event, fn);
    return fn;
  }
  function setTimeout(fn, duration) {
    var t = getTime();
    var callback = function() {
      var t2 = getTime();
      if (t2 - t >= duration) {
        fn.apply(this, arguments);
        FamousEngine.removeListener(_event, callback);
      }
    };
    return addTimerFunction(callback);
  }
  function setInterval(fn, duration) {
    var t = getTime();
    var callback = function() {
      var t2 = getTime();
      if (t2 - t >= duration) {
        fn.apply(this, arguments);
        t = getTime();
      }
    };
    return addTimerFunction(callback);
  }
  function after(fn, numTicks) {
    if (numTicks === undefined)
      return undefined;
    var callback = function() {
      numTicks--;
      if (numTicks <= 0) {
        fn.apply(this, arguments);
        clear(callback);
      }
    };
    return addTimerFunction(callback);
  }
  function every(fn, numTicks) {
    numTicks = numTicks || 1;
    var initial = numTicks;
    var callback = function() {
      numTicks--;
      if (numTicks <= 0) {
        fn.apply(this, arguments);
        numTicks = initial;
      }
    };
    return addTimerFunction(callback);
  }
  function clear(fn) {
    FamousEngine.removeListener(_event, fn);
  }
  function debounce(func, wait) {
    var timeout;
    var ctx;
    var timestamp;
    var result;
    var args;
    return function() {
      ctx = this;
      args = arguments;
      timestamp = getTime();
      var fn = function() {
        var last = getTime - timestamp;
        if (last < wait) {
          timeout = setTimeout(fn, wait - last);
        } else {
          timeout = null;
          result = func.apply(ctx, args);
        }
      };
      clear(timeout);
      timeout = setTimeout(fn, wait);
      return result;
    };
  }
  module.exports = {
    setTimeout: setTimeout,
    setInterval: setInterval,
    debounce: debounce,
    after: after,
    every: every,
    clear: clear
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:lodash@3.10.0/index.js", ["github:jspm/nodelibs-process@0.1.1.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  (function(process) {
    ;
    (function() {
      var undefined;
      var VERSION = '3.10.0';
      var BIND_FLAG = 1,
          BIND_KEY_FLAG = 2,
          CURRY_BOUND_FLAG = 4,
          CURRY_FLAG = 8,
          CURRY_RIGHT_FLAG = 16,
          PARTIAL_FLAG = 32,
          PARTIAL_RIGHT_FLAG = 64,
          ARY_FLAG = 128,
          REARG_FLAG = 256;
      var DEFAULT_TRUNC_LENGTH = 30,
          DEFAULT_TRUNC_OMISSION = '...';
      var HOT_COUNT = 150,
          HOT_SPAN = 16;
      var LARGE_ARRAY_SIZE = 200;
      var LAZY_FILTER_FLAG = 1,
          LAZY_MAP_FLAG = 2;
      var FUNC_ERROR_TEXT = 'Expected a function';
      var PLACEHOLDER = '__lodash_placeholder__';
      var argsTag = '[object Arguments]',
          arrayTag = '[object Array]',
          boolTag = '[object Boolean]',
          dateTag = '[object Date]',
          errorTag = '[object Error]',
          funcTag = '[object Function]',
          mapTag = '[object Map]',
          numberTag = '[object Number]',
          objectTag = '[object Object]',
          regexpTag = '[object RegExp]',
          setTag = '[object Set]',
          stringTag = '[object String]',
          weakMapTag = '[object WeakMap]';
      var arrayBufferTag = '[object ArrayBuffer]',
          float32Tag = '[object Float32Array]',
          float64Tag = '[object Float64Array]',
          int8Tag = '[object Int8Array]',
          int16Tag = '[object Int16Array]',
          int32Tag = '[object Int32Array]',
          uint8Tag = '[object Uint8Array]',
          uint8ClampedTag = '[object Uint8ClampedArray]',
          uint16Tag = '[object Uint16Array]',
          uint32Tag = '[object Uint32Array]';
      var reEmptyStringLeading = /\b__p \+= '';/g,
          reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
          reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
      var reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#96);/g,
          reUnescapedHtml = /[&<>"'`]/g,
          reHasEscapedHtml = RegExp(reEscapedHtml.source),
          reHasUnescapedHtml = RegExp(reUnescapedHtml.source);
      var reEscape = /<%-([\s\S]+?)%>/g,
          reEvaluate = /<%([\s\S]+?)%>/g,
          reInterpolate = /<%=([\s\S]+?)%>/g;
      var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
          reIsPlainProp = /^\w*$/,
          rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;
      var reRegExpChars = /^[:!,]|[\\^$.*+?()[\]{}|\/]|(^[0-9a-fA-Fnrtuvx])|([\n\r\u2028\u2029])/g,
          reHasRegExpChars = RegExp(reRegExpChars.source);
      var reComboMark = /[\u0300-\u036f\ufe20-\ufe23]/g;
      var reEscapeChar = /\\(\\)?/g;
      var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
      var reFlags = /\w*$/;
      var reHasHexPrefix = /^0[xX]/;
      var reIsHostCtor = /^\[object .+?Constructor\]$/;
      var reIsUint = /^\d+$/;
      var reLatin1 = /[\xc0-\xd6\xd8-\xde\xdf-\xf6\xf8-\xff]/g;
      var reNoMatch = /($^)/;
      var reUnescapedString = /['\n\r\u2028\u2029\\]/g;
      var reWords = (function() {
        var upper = '[A-Z\\xc0-\\xd6\\xd8-\\xde]',
            lower = '[a-z\\xdf-\\xf6\\xf8-\\xff]+';
        return RegExp(upper + '+(?=' + upper + lower + ')|' + upper + '?' + lower + '|' + upper + '+|[0-9]+', 'g');
      }());
      var contextProps = ['Array', 'ArrayBuffer', 'Date', 'Error', 'Float32Array', 'Float64Array', 'Function', 'Int8Array', 'Int16Array', 'Int32Array', 'Math', 'Number', 'Object', 'RegExp', 'Set', 'String', '_', 'clearTimeout', 'isFinite', 'parseFloat', 'parseInt', 'setTimeout', 'TypeError', 'Uint8Array', 'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'WeakMap'];
      var templateCounter = -1;
      var typedArrayTags = {};
      typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
      typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
      var cloneableTags = {};
      cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[stringTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
      cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[mapTag] = cloneableTags[setTag] = cloneableTags[weakMapTag] = false;
      var deburredLetters = {
        '\xc0': 'A',
        '\xc1': 'A',
        '\xc2': 'A',
        '\xc3': 'A',
        '\xc4': 'A',
        '\xc5': 'A',
        '\xe0': 'a',
        '\xe1': 'a',
        '\xe2': 'a',
        '\xe3': 'a',
        '\xe4': 'a',
        '\xe5': 'a',
        '\xc7': 'C',
        '\xe7': 'c',
        '\xd0': 'D',
        '\xf0': 'd',
        '\xc8': 'E',
        '\xc9': 'E',
        '\xca': 'E',
        '\xcb': 'E',
        '\xe8': 'e',
        '\xe9': 'e',
        '\xea': 'e',
        '\xeb': 'e',
        '\xcC': 'I',
        '\xcd': 'I',
        '\xce': 'I',
        '\xcf': 'I',
        '\xeC': 'i',
        '\xed': 'i',
        '\xee': 'i',
        '\xef': 'i',
        '\xd1': 'N',
        '\xf1': 'n',
        '\xd2': 'O',
        '\xd3': 'O',
        '\xd4': 'O',
        '\xd5': 'O',
        '\xd6': 'O',
        '\xd8': 'O',
        '\xf2': 'o',
        '\xf3': 'o',
        '\xf4': 'o',
        '\xf5': 'o',
        '\xf6': 'o',
        '\xf8': 'o',
        '\xd9': 'U',
        '\xda': 'U',
        '\xdb': 'U',
        '\xdc': 'U',
        '\xf9': 'u',
        '\xfa': 'u',
        '\xfb': 'u',
        '\xfc': 'u',
        '\xdd': 'Y',
        '\xfd': 'y',
        '\xff': 'y',
        '\xc6': 'Ae',
        '\xe6': 'ae',
        '\xde': 'Th',
        '\xfe': 'th',
        '\xdf': 'ss'
      };
      var htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '`': '&#96;'
      };
      var htmlUnescapes = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&#96;': '`'
      };
      var objectTypes = {
        'function': true,
        'object': true
      };
      var regexpEscapes = {
        '0': 'x30',
        '1': 'x31',
        '2': 'x32',
        '3': 'x33',
        '4': 'x34',
        '5': 'x35',
        '6': 'x36',
        '7': 'x37',
        '8': 'x38',
        '9': 'x39',
        'A': 'x41',
        'B': 'x42',
        'C': 'x43',
        'D': 'x44',
        'E': 'x45',
        'F': 'x46',
        'a': 'x61',
        'b': 'x62',
        'c': 'x63',
        'd': 'x64',
        'e': 'x65',
        'f': 'x66',
        'n': 'x6e',
        'r': 'x72',
        't': 'x74',
        'u': 'x75',
        'v': 'x76',
        'x': 'x78'
      };
      var stringEscapes = {
        '\\': '\\',
        "'": "'",
        '\n': 'n',
        '\r': 'r',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
      };
      var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;
      var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;
      var freeGlobal = freeExports && freeModule && typeof global == 'object' && global && global.Object && global;
      var freeSelf = objectTypes[typeof self] && self && self.Object && self;
      var freeWindow = objectTypes[typeof window] && window && window.Object && window;
      var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;
      var root = freeGlobal || ((freeWindow !== (this && this.window)) && freeWindow) || freeSelf || this;
      function baseCompareAscending(value, other) {
        if (value !== other) {
          var valIsNull = value === null,
              valIsUndef = value === undefined,
              valIsReflexive = value === value;
          var othIsNull = other === null,
              othIsUndef = other === undefined,
              othIsReflexive = other === other;
          if ((value > other && !othIsNull) || !valIsReflexive || (valIsNull && !othIsUndef && othIsReflexive) || (valIsUndef && othIsReflexive)) {
            return 1;
          }
          if ((value < other && !valIsNull) || !othIsReflexive || (othIsNull && !valIsUndef && valIsReflexive) || (othIsUndef && valIsReflexive)) {
            return -1;
          }
        }
        return 0;
      }
      function baseFindIndex(array, predicate, fromRight) {
        var length = array.length,
            index = fromRight ? length : -1;
        while ((fromRight ? index-- : ++index < length)) {
          if (predicate(array[index], index, array)) {
            return index;
          }
        }
        return -1;
      }
      function baseIndexOf(array, value, fromIndex) {
        if (value !== value) {
          return indexOfNaN(array, fromIndex);
        }
        var index = fromIndex - 1,
            length = array.length;
        while (++index < length) {
          if (array[index] === value) {
            return index;
          }
        }
        return -1;
      }
      function baseIsFunction(value) {
        return typeof value == 'function' || false;
      }
      function baseToString(value) {
        return value == null ? '' : (value + '');
      }
      function charsLeftIndex(string, chars) {
        var index = -1,
            length = string.length;
        while (++index < length && chars.indexOf(string.charAt(index)) > -1) {}
        return index;
      }
      function charsRightIndex(string, chars) {
        var index = string.length;
        while (index-- && chars.indexOf(string.charAt(index)) > -1) {}
        return index;
      }
      function compareAscending(object, other) {
        return baseCompareAscending(object.criteria, other.criteria) || (object.index - other.index);
      }
      function compareMultiple(object, other, orders) {
        var index = -1,
            objCriteria = object.criteria,
            othCriteria = other.criteria,
            length = objCriteria.length,
            ordersLength = orders.length;
        while (++index < length) {
          var result = baseCompareAscending(objCriteria[index], othCriteria[index]);
          if (result) {
            if (index >= ordersLength) {
              return result;
            }
            var order = orders[index];
            return result * ((order === 'asc' || order === true) ? 1 : -1);
          }
        }
        return object.index - other.index;
      }
      function deburrLetter(letter) {
        return deburredLetters[letter];
      }
      function escapeHtmlChar(chr) {
        return htmlEscapes[chr];
      }
      function escapeRegExpChar(chr, leadingChar, whitespaceChar) {
        if (leadingChar) {
          chr = regexpEscapes[chr];
        } else if (whitespaceChar) {
          chr = stringEscapes[chr];
        }
        return '\\' + chr;
      }
      function escapeStringChar(chr) {
        return '\\' + stringEscapes[chr];
      }
      function indexOfNaN(array, fromIndex, fromRight) {
        var length = array.length,
            index = fromIndex + (fromRight ? 0 : -1);
        while ((fromRight ? index-- : ++index < length)) {
          var other = array[index];
          if (other !== other) {
            return index;
          }
        }
        return -1;
      }
      function isObjectLike(value) {
        return !!value && typeof value == 'object';
      }
      function isSpace(charCode) {
        return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 || (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
      }
      function replaceHolders(array, placeholder) {
        var index = -1,
            length = array.length,
            resIndex = -1,
            result = [];
        while (++index < length) {
          if (array[index] === placeholder) {
            array[index] = PLACEHOLDER;
            result[++resIndex] = index;
          }
        }
        return result;
      }
      function sortedUniq(array, iteratee) {
        var seen,
            index = -1,
            length = array.length,
            resIndex = -1,
            result = [];
        while (++index < length) {
          var value = array[index],
              computed = iteratee ? iteratee(value, index, array) : value;
          if (!index || seen !== computed) {
            seen = computed;
            result[++resIndex] = value;
          }
        }
        return result;
      }
      function trimmedLeftIndex(string) {
        var index = -1,
            length = string.length;
        while (++index < length && isSpace(string.charCodeAt(index))) {}
        return index;
      }
      function trimmedRightIndex(string) {
        var index = string.length;
        while (index-- && isSpace(string.charCodeAt(index))) {}
        return index;
      }
      function unescapeHtmlChar(chr) {
        return htmlUnescapes[chr];
      }
      function runInContext(context) {
        context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;
        var Array = context.Array,
            Date = context.Date,
            Error = context.Error,
            Function = context.Function,
            Math = context.Math,
            Number = context.Number,
            Object = context.Object,
            RegExp = context.RegExp,
            String = context.String,
            TypeError = context.TypeError;
        var arrayProto = Array.prototype,
            objectProto = Object.prototype,
            stringProto = String.prototype;
        var fnToString = Function.prototype.toString;
        var hasOwnProperty = objectProto.hasOwnProperty;
        var idCounter = 0;
        var objToString = objectProto.toString;
        var oldDash = root._;
        var reIsNative = RegExp('^' + fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');
        var ArrayBuffer = context.ArrayBuffer,
            clearTimeout = context.clearTimeout,
            parseFloat = context.parseFloat,
            pow = Math.pow,
            propertyIsEnumerable = objectProto.propertyIsEnumerable,
            Set = getNative(context, 'Set'),
            setTimeout = context.setTimeout,
            splice = arrayProto.splice,
            Uint8Array = context.Uint8Array,
            WeakMap = getNative(context, 'WeakMap');
        var nativeCeil = Math.ceil,
            nativeCreate = getNative(Object, 'create'),
            nativeFloor = Math.floor,
            nativeIsArray = getNative(Array, 'isArray'),
            nativeIsFinite = context.isFinite,
            nativeKeys = getNative(Object, 'keys'),
            nativeMax = Math.max,
            nativeMin = Math.min,
            nativeNow = getNative(Date, 'now'),
            nativeParseInt = context.parseInt,
            nativeRandom = Math.random;
        var NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY,
            POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
        var MAX_ARRAY_LENGTH = 4294967295,
            MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1,
            HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;
        var MAX_SAFE_INTEGER = 9007199254740991;
        var metaMap = WeakMap && new WeakMap;
        var realNames = {};
        function lodash(value) {
          if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
            if (value instanceof LodashWrapper) {
              return value;
            }
            if (hasOwnProperty.call(value, '__chain__') && hasOwnProperty.call(value, '__wrapped__')) {
              return wrapperClone(value);
            }
          }
          return new LodashWrapper(value);
        }
        function baseLodash() {}
        function LodashWrapper(value, chainAll, actions) {
          this.__wrapped__ = value;
          this.__actions__ = actions || [];
          this.__chain__ = !!chainAll;
        }
        var support = lodash.support = {};
        lodash.templateSettings = {
          'escape': reEscape,
          'evaluate': reEvaluate,
          'interpolate': reInterpolate,
          'variable': '',
          'imports': {'_': lodash}
        };
        function LazyWrapper(value) {
          this.__wrapped__ = value;
          this.__actions__ = [];
          this.__dir__ = 1;
          this.__filtered__ = false;
          this.__iteratees__ = [];
          this.__takeCount__ = POSITIVE_INFINITY;
          this.__views__ = [];
        }
        function lazyClone() {
          var result = new LazyWrapper(this.__wrapped__);
          result.__actions__ = arrayCopy(this.__actions__);
          result.__dir__ = this.__dir__;
          result.__filtered__ = this.__filtered__;
          result.__iteratees__ = arrayCopy(this.__iteratees__);
          result.__takeCount__ = this.__takeCount__;
          result.__views__ = arrayCopy(this.__views__);
          return result;
        }
        function lazyReverse() {
          if (this.__filtered__) {
            var result = new LazyWrapper(this);
            result.__dir__ = -1;
            result.__filtered__ = true;
          } else {
            result = this.clone();
            result.__dir__ *= -1;
          }
          return result;
        }
        function lazyValue() {
          var array = this.__wrapped__.value(),
              dir = this.__dir__,
              isArr = isArray(array),
              isRight = dir < 0,
              arrLength = isArr ? array.length : 0,
              view = getView(0, arrLength, this.__views__),
              start = view.start,
              end = view.end,
              length = end - start,
              index = isRight ? end : (start - 1),
              iteratees = this.__iteratees__,
              iterLength = iteratees.length,
              resIndex = 0,
              takeCount = nativeMin(length, this.__takeCount__);
          if (!isArr || arrLength < LARGE_ARRAY_SIZE || (arrLength == length && takeCount == length)) {
            return baseWrapperValue((isRight && isArr) ? array.reverse() : array, this.__actions__);
          }
          var result = [];
          outer: while (length-- && resIndex < takeCount) {
            index += dir;
            var iterIndex = -1,
                value = array[index];
            while (++iterIndex < iterLength) {
              var data = iteratees[iterIndex],
                  iteratee = data.iteratee,
                  type = data.type,
                  computed = iteratee(value);
              if (type == LAZY_MAP_FLAG) {
                value = computed;
              } else if (!computed) {
                if (type == LAZY_FILTER_FLAG) {
                  continue outer;
                } else {
                  break outer;
                }
              }
            }
            result[resIndex++] = value;
          }
          return result;
        }
        function MapCache() {
          this.__data__ = {};
        }
        function mapDelete(key) {
          return this.has(key) && delete this.__data__[key];
        }
        function mapGet(key) {
          return key == '__proto__' ? undefined : this.__data__[key];
        }
        function mapHas(key) {
          return key != '__proto__' && hasOwnProperty.call(this.__data__, key);
        }
        function mapSet(key, value) {
          if (key != '__proto__') {
            this.__data__[key] = value;
          }
          return this;
        }
        function SetCache(values) {
          var length = values ? values.length : 0;
          this.data = {
            'hash': nativeCreate(null),
            'set': new Set
          };
          while (length--) {
            this.push(values[length]);
          }
        }
        function cacheIndexOf(cache, value) {
          var data = cache.data,
              result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];
          return result ? 0 : -1;
        }
        function cachePush(value) {
          var data = this.data;
          if (typeof value == 'string' || isObject(value)) {
            data.set.add(value);
          } else {
            data.hash[value] = true;
          }
        }
        function arrayConcat(array, other) {
          var index = -1,
              length = array.length,
              othIndex = -1,
              othLength = other.length,
              result = Array(length + othLength);
          while (++index < length) {
            result[index] = array[index];
          }
          while (++othIndex < othLength) {
            result[index++] = other[othIndex];
          }
          return result;
        }
        function arrayCopy(source, array) {
          var index = -1,
              length = source.length;
          array || (array = Array(length));
          while (++index < length) {
            array[index] = source[index];
          }
          return array;
        }
        function arrayEach(array, iteratee) {
          var index = -1,
              length = array.length;
          while (++index < length) {
            if (iteratee(array[index], index, array) === false) {
              break;
            }
          }
          return array;
        }
        function arrayEachRight(array, iteratee) {
          var length = array.length;
          while (length--) {
            if (iteratee(array[length], length, array) === false) {
              break;
            }
          }
          return array;
        }
        function arrayEvery(array, predicate) {
          var index = -1,
              length = array.length;
          while (++index < length) {
            if (!predicate(array[index], index, array)) {
              return false;
            }
          }
          return true;
        }
        function arrayExtremum(array, iteratee, comparator, exValue) {
          var index = -1,
              length = array.length,
              computed = exValue,
              result = computed;
          while (++index < length) {
            var value = array[index],
                current = +iteratee(value);
            if (comparator(current, computed)) {
              computed = current;
              result = value;
            }
          }
          return result;
        }
        function arrayFilter(array, predicate) {
          var index = -1,
              length = array.length,
              resIndex = -1,
              result = [];
          while (++index < length) {
            var value = array[index];
            if (predicate(value, index, array)) {
              result[++resIndex] = value;
            }
          }
          return result;
        }
        function arrayMap(array, iteratee) {
          var index = -1,
              length = array.length,
              result = Array(length);
          while (++index < length) {
            result[index] = iteratee(array[index], index, array);
          }
          return result;
        }
        function arrayPush(array, values) {
          var index = -1,
              length = values.length,
              offset = array.length;
          while (++index < length) {
            array[offset + index] = values[index];
          }
          return array;
        }
        function arrayReduce(array, iteratee, accumulator, initFromArray) {
          var index = -1,
              length = array.length;
          if (initFromArray && length) {
            accumulator = array[++index];
          }
          while (++index < length) {
            accumulator = iteratee(accumulator, array[index], index, array);
          }
          return accumulator;
        }
        function arrayReduceRight(array, iteratee, accumulator, initFromArray) {
          var length = array.length;
          if (initFromArray && length) {
            accumulator = array[--length];
          }
          while (length--) {
            accumulator = iteratee(accumulator, array[length], length, array);
          }
          return accumulator;
        }
        function arraySome(array, predicate) {
          var index = -1,
              length = array.length;
          while (++index < length) {
            if (predicate(array[index], index, array)) {
              return true;
            }
          }
          return false;
        }
        function arraySum(array, iteratee) {
          var length = array.length,
              result = 0;
          while (length--) {
            result += +iteratee(array[length]) || 0;
          }
          return result;
        }
        function assignDefaults(objectValue, sourceValue) {
          return objectValue === undefined ? sourceValue : objectValue;
        }
        function assignOwnDefaults(objectValue, sourceValue, key, object) {
          return (objectValue === undefined || !hasOwnProperty.call(object, key)) ? sourceValue : objectValue;
        }
        function assignWith(object, source, customizer) {
          var index = -1,
              props = keys(source),
              length = props.length;
          while (++index < length) {
            var key = props[index],
                value = object[key],
                result = customizer(value, source[key], key, object, source);
            if ((result === result ? (result !== value) : (value === value)) || (value === undefined && !(key in object))) {
              object[key] = result;
            }
          }
          return object;
        }
        function baseAssign(object, source) {
          return source == null ? object : baseCopy(source, keys(source), object);
        }
        function baseAt(collection, props) {
          var index = -1,
              isNil = collection == null,
              isArr = !isNil && isArrayLike(collection),
              length = isArr ? collection.length : 0,
              propsLength = props.length,
              result = Array(propsLength);
          while (++index < propsLength) {
            var key = props[index];
            if (isArr) {
              result[index] = isIndex(key, length) ? collection[key] : undefined;
            } else {
              result[index] = isNil ? undefined : collection[key];
            }
          }
          return result;
        }
        function baseCopy(source, props, object) {
          object || (object = {});
          var index = -1,
              length = props.length;
          while (++index < length) {
            var key = props[index];
            object[key] = source[key];
          }
          return object;
        }
        function baseCallback(func, thisArg, argCount) {
          var type = typeof func;
          if (type == 'function') {
            return thisArg === undefined ? func : bindCallback(func, thisArg, argCount);
          }
          if (func == null) {
            return identity;
          }
          if (type == 'object') {
            return baseMatches(func);
          }
          return thisArg === undefined ? property(func) : baseMatchesProperty(func, thisArg);
        }
        function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
          var result;
          if (customizer) {
            result = object ? customizer(value, key, object) : customizer(value);
          }
          if (result !== undefined) {
            return result;
          }
          if (!isObject(value)) {
            return value;
          }
          var isArr = isArray(value);
          if (isArr) {
            result = initCloneArray(value);
            if (!isDeep) {
              return arrayCopy(value, result);
            }
          } else {
            var tag = objToString.call(value),
                isFunc = tag == funcTag;
            if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
              result = initCloneObject(isFunc ? {} : value);
              if (!isDeep) {
                return baseAssign(result, value);
              }
            } else {
              return cloneableTags[tag] ? initCloneByTag(value, tag, isDeep) : (object ? value : {});
            }
          }
          stackA || (stackA = []);
          stackB || (stackB = []);
          var length = stackA.length;
          while (length--) {
            if (stackA[length] == value) {
              return stackB[length];
            }
          }
          stackA.push(value);
          stackB.push(result);
          (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
            result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
          });
          return result;
        }
        var baseCreate = (function() {
          function object() {}
          return function(prototype) {
            if (isObject(prototype)) {
              object.prototype = prototype;
              var result = new object;
              object.prototype = undefined;
            }
            return result || {};
          };
        }());
        function baseDelay(func, wait, args) {
          if (typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          return setTimeout(function() {
            func.apply(undefined, args);
          }, wait);
        }
        function baseDifference(array, values) {
          var length = array ? array.length : 0,
              result = [];
          if (!length) {
            return result;
          }
          var index = -1,
              indexOf = getIndexOf(),
              isCommon = indexOf == baseIndexOf,
              cache = (isCommon && values.length >= LARGE_ARRAY_SIZE) ? createCache(values) : null,
              valuesLength = values.length;
          if (cache) {
            indexOf = cacheIndexOf;
            isCommon = false;
            values = cache;
          }
          outer: while (++index < length) {
            var value = array[index];
            if (isCommon && value === value) {
              var valuesIndex = valuesLength;
              while (valuesIndex--) {
                if (values[valuesIndex] === value) {
                  continue outer;
                }
              }
              result.push(value);
            } else if (indexOf(values, value, 0) < 0) {
              result.push(value);
            }
          }
          return result;
        }
        var baseEach = createBaseEach(baseForOwn);
        var baseEachRight = createBaseEach(baseForOwnRight, true);
        function baseEvery(collection, predicate) {
          var result = true;
          baseEach(collection, function(value, index, collection) {
            result = !!predicate(value, index, collection);
            return result;
          });
          return result;
        }
        function baseExtremum(collection, iteratee, comparator, exValue) {
          var computed = exValue,
              result = computed;
          baseEach(collection, function(value, index, collection) {
            var current = +iteratee(value, index, collection);
            if (comparator(current, computed) || (current === exValue && current === result)) {
              computed = current;
              result = value;
            }
          });
          return result;
        }
        function baseFill(array, value, start, end) {
          var length = array.length;
          start = start == null ? 0 : (+start || 0);
          if (start < 0) {
            start = -start > length ? 0 : (length + start);
          }
          end = (end === undefined || end > length) ? length : (+end || 0);
          if (end < 0) {
            end += length;
          }
          length = start > end ? 0 : (end >>> 0);
          start >>>= 0;
          while (start < length) {
            array[start++] = value;
          }
          return array;
        }
        function baseFilter(collection, predicate) {
          var result = [];
          baseEach(collection, function(value, index, collection) {
            if (predicate(value, index, collection)) {
              result.push(value);
            }
          });
          return result;
        }
        function baseFind(collection, predicate, eachFunc, retKey) {
          var result;
          eachFunc(collection, function(value, key, collection) {
            if (predicate(value, key, collection)) {
              result = retKey ? key : value;
              return false;
            }
          });
          return result;
        }
        function baseFlatten(array, isDeep, isStrict, result) {
          result || (result = []);
          var index = -1,
              length = array.length;
          while (++index < length) {
            var value = array[index];
            if (isObjectLike(value) && isArrayLike(value) && (isStrict || isArray(value) || isArguments(value))) {
              if (isDeep) {
                baseFlatten(value, isDeep, isStrict, result);
              } else {
                arrayPush(result, value);
              }
            } else if (!isStrict) {
              result[result.length] = value;
            }
          }
          return result;
        }
        var baseFor = createBaseFor();
        var baseForRight = createBaseFor(true);
        function baseForIn(object, iteratee) {
          return baseFor(object, iteratee, keysIn);
        }
        function baseForOwn(object, iteratee) {
          return baseFor(object, iteratee, keys);
        }
        function baseForOwnRight(object, iteratee) {
          return baseForRight(object, iteratee, keys);
        }
        function baseFunctions(object, props) {
          var index = -1,
              length = props.length,
              resIndex = -1,
              result = [];
          while (++index < length) {
            var key = props[index];
            if (isFunction(object[key])) {
              result[++resIndex] = key;
            }
          }
          return result;
        }
        function baseGet(object, path, pathKey) {
          if (object == null) {
            return;
          }
          if (pathKey !== undefined && pathKey in toObject(object)) {
            path = [pathKey];
          }
          var index = 0,
              length = path.length;
          while (object != null && index < length) {
            object = object[path[index++]];
          }
          return (index && index == length) ? object : undefined;
        }
        function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
          if (value === other) {
            return true;
          }
          if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
            return value !== value && other !== other;
          }
          return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
        }
        function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
          var objIsArr = isArray(object),
              othIsArr = isArray(other),
              objTag = arrayTag,
              othTag = arrayTag;
          if (!objIsArr) {
            objTag = objToString.call(object);
            if (objTag == argsTag) {
              objTag = objectTag;
            } else if (objTag != objectTag) {
              objIsArr = isTypedArray(object);
            }
          }
          if (!othIsArr) {
            othTag = objToString.call(other);
            if (othTag == argsTag) {
              othTag = objectTag;
            } else if (othTag != objectTag) {
              othIsArr = isTypedArray(other);
            }
          }
          var objIsObj = objTag == objectTag,
              othIsObj = othTag == objectTag,
              isSameTag = objTag == othTag;
          if (isSameTag && !(objIsArr || objIsObj)) {
            return equalByTag(object, other, objTag);
          }
          if (!isLoose) {
            var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
                othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');
            if (objIsWrapped || othIsWrapped) {
              return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
            }
          }
          if (!isSameTag) {
            return false;
          }
          stackA || (stackA = []);
          stackB || (stackB = []);
          var length = stackA.length;
          while (length--) {
            if (stackA[length] == object) {
              return stackB[length] == other;
            }
          }
          stackA.push(object);
          stackB.push(other);
          var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);
          stackA.pop();
          stackB.pop();
          return result;
        }
        function baseIsMatch(object, matchData, customizer) {
          var index = matchData.length,
              length = index,
              noCustomizer = !customizer;
          if (object == null) {
            return !length;
          }
          object = toObject(object);
          while (index--) {
            var data = matchData[index];
            if ((noCustomizer && data[2]) ? data[1] !== object[data[0]] : !(data[0] in object)) {
              return false;
            }
          }
          while (++index < length) {
            data = matchData[index];
            var key = data[0],
                objValue = object[key],
                srcValue = data[1];
            if (noCustomizer && data[2]) {
              if (objValue === undefined && !(key in object)) {
                return false;
              }
            } else {
              var result = customizer ? customizer(objValue, srcValue, key) : undefined;
              if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
                return false;
              }
            }
          }
          return true;
        }
        function baseMap(collection, iteratee) {
          var index = -1,
              result = isArrayLike(collection) ? Array(collection.length) : [];
          baseEach(collection, function(value, key, collection) {
            result[++index] = iteratee(value, key, collection);
          });
          return result;
        }
        function baseMatches(source) {
          var matchData = getMatchData(source);
          if (matchData.length == 1 && matchData[0][2]) {
            var key = matchData[0][0],
                value = matchData[0][1];
            return function(object) {
              if (object == null) {
                return false;
              }
              return object[key] === value && (value !== undefined || (key in toObject(object)));
            };
          }
          return function(object) {
            return baseIsMatch(object, matchData);
          };
        }
        function baseMatchesProperty(path, srcValue) {
          var isArr = isArray(path),
              isCommon = isKey(path) && isStrictComparable(srcValue),
              pathKey = (path + '');
          path = toPath(path);
          return function(object) {
            if (object == null) {
              return false;
            }
            var key = pathKey;
            object = toObject(object);
            if ((isArr || !isCommon) && !(key in object)) {
              object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
              if (object == null) {
                return false;
              }
              key = last(path);
              object = toObject(object);
            }
            return object[key] === srcValue ? (srcValue !== undefined || (key in object)) : baseIsEqual(srcValue, object[key], undefined, true);
          };
        }
        function baseMerge(object, source, customizer, stackA, stackB) {
          if (!isObject(object)) {
            return object;
          }
          var isSrcArr = isArrayLike(source) && (isArray(source) || isTypedArray(source)),
              props = isSrcArr ? undefined : keys(source);
          arrayEach(props || source, function(srcValue, key) {
            if (props) {
              key = srcValue;
              srcValue = source[key];
            }
            if (isObjectLike(srcValue)) {
              stackA || (stackA = []);
              stackB || (stackB = []);
              baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
            } else {
              var value = object[key],
                  result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
                  isCommon = result === undefined;
              if (isCommon) {
                result = srcValue;
              }
              if ((result !== undefined || (isSrcArr && !(key in object))) && (isCommon || (result === result ? (result !== value) : (value === value)))) {
                object[key] = result;
              }
            }
          });
          return object;
        }
        function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
          var length = stackA.length,
              srcValue = source[key];
          while (length--) {
            if (stackA[length] == srcValue) {
              object[key] = stackB[length];
              return;
            }
          }
          var value = object[key],
              result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
              isCommon = result === undefined;
          if (isCommon) {
            result = srcValue;
            if (isArrayLike(srcValue) && (isArray(srcValue) || isTypedArray(srcValue))) {
              result = isArray(value) ? value : (isArrayLike(value) ? arrayCopy(value) : []);
            } else if (isPlainObject(srcValue) || isArguments(srcValue)) {
              result = isArguments(value) ? toPlainObject(value) : (isPlainObject(value) ? value : {});
            } else {
              isCommon = false;
            }
          }
          stackA.push(srcValue);
          stackB.push(result);
          if (isCommon) {
            object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
          } else if (result === result ? (result !== value) : (value === value)) {
            object[key] = result;
          }
        }
        function baseProperty(key) {
          return function(object) {
            return object == null ? undefined : object[key];
          };
        }
        function basePropertyDeep(path) {
          var pathKey = (path + '');
          path = toPath(path);
          return function(object) {
            return baseGet(object, path, pathKey);
          };
        }
        function basePullAt(array, indexes) {
          var length = array ? indexes.length : 0;
          while (length--) {
            var index = indexes[length];
            if (index != previous && isIndex(index)) {
              var previous = index;
              splice.call(array, index, 1);
            }
          }
          return array;
        }
        function baseRandom(min, max) {
          return min + nativeFloor(nativeRandom() * (max - min + 1));
        }
        function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {
          eachFunc(collection, function(value, index, collection) {
            accumulator = initFromCollection ? (initFromCollection = false, value) : iteratee(accumulator, value, index, collection);
          });
          return accumulator;
        }
        var baseSetData = !metaMap ? identity : function(func, data) {
          metaMap.set(func, data);
          return func;
        };
        function baseSlice(array, start, end) {
          var index = -1,
              length = array.length;
          start = start == null ? 0 : (+start || 0);
          if (start < 0) {
            start = -start > length ? 0 : (length + start);
          }
          end = (end === undefined || end > length) ? length : (+end || 0);
          if (end < 0) {
            end += length;
          }
          length = start > end ? 0 : ((end - start) >>> 0);
          start >>>= 0;
          var result = Array(length);
          while (++index < length) {
            result[index] = array[index + start];
          }
          return result;
        }
        function baseSome(collection, predicate) {
          var result;
          baseEach(collection, function(value, index, collection) {
            result = predicate(value, index, collection);
            return !result;
          });
          return !!result;
        }
        function baseSortBy(array, comparer) {
          var length = array.length;
          array.sort(comparer);
          while (length--) {
            array[length] = array[length].value;
          }
          return array;
        }
        function baseSortByOrder(collection, iteratees, orders) {
          var callback = getCallback(),
              index = -1;
          iteratees = arrayMap(iteratees, function(iteratee) {
            return callback(iteratee);
          });
          var result = baseMap(collection, function(value) {
            var criteria = arrayMap(iteratees, function(iteratee) {
              return iteratee(value);
            });
            return {
              'criteria': criteria,
              'index': ++index,
              'value': value
            };
          });
          return baseSortBy(result, function(object, other) {
            return compareMultiple(object, other, orders);
          });
        }
        function baseSum(collection, iteratee) {
          var result = 0;
          baseEach(collection, function(value, index, collection) {
            result += +iteratee(value, index, collection) || 0;
          });
          return result;
        }
        function baseUniq(array, iteratee) {
          var index = -1,
              indexOf = getIndexOf(),
              length = array.length,
              isCommon = indexOf == baseIndexOf,
              isLarge = isCommon && length >= LARGE_ARRAY_SIZE,
              seen = isLarge ? createCache() : null,
              result = [];
          if (seen) {
            indexOf = cacheIndexOf;
            isCommon = false;
          } else {
            isLarge = false;
            seen = iteratee ? [] : result;
          }
          outer: while (++index < length) {
            var value = array[index],
                computed = iteratee ? iteratee(value, index, array) : value;
            if (isCommon && value === value) {
              var seenIndex = seen.length;
              while (seenIndex--) {
                if (seen[seenIndex] === computed) {
                  continue outer;
                }
              }
              if (iteratee) {
                seen.push(computed);
              }
              result.push(value);
            } else if (indexOf(seen, computed, 0) < 0) {
              if (iteratee || isLarge) {
                seen.push(computed);
              }
              result.push(value);
            }
          }
          return result;
        }
        function baseValues(object, props) {
          var index = -1,
              length = props.length,
              result = Array(length);
          while (++index < length) {
            result[index] = object[props[index]];
          }
          return result;
        }
        function baseWhile(array, predicate, isDrop, fromRight) {
          var length = array.length,
              index = fromRight ? length : -1;
          while ((fromRight ? index-- : ++index < length) && predicate(array[index], index, array)) {}
          return isDrop ? baseSlice(array, (fromRight ? 0 : index), (fromRight ? index + 1 : length)) : baseSlice(array, (fromRight ? index + 1 : 0), (fromRight ? length : index));
        }
        function baseWrapperValue(value, actions) {
          var result = value;
          if (result instanceof LazyWrapper) {
            result = result.value();
          }
          var index = -1,
              length = actions.length;
          while (++index < length) {
            var action = actions[index];
            result = action.func.apply(action.thisArg, arrayPush([result], action.args));
          }
          return result;
        }
        function binaryIndex(array, value, retHighest) {
          var low = 0,
              high = array ? array.length : low;
          if (typeof value == 'number' && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
            while (low < high) {
              var mid = (low + high) >>> 1,
                  computed = array[mid];
              if ((retHighest ? (computed <= value) : (computed < value)) && computed !== null) {
                low = mid + 1;
              } else {
                high = mid;
              }
            }
            return high;
          }
          return binaryIndexBy(array, value, identity, retHighest);
        }
        function binaryIndexBy(array, value, iteratee, retHighest) {
          value = iteratee(value);
          var low = 0,
              high = array ? array.length : 0,
              valIsNaN = value !== value,
              valIsNull = value === null,
              valIsUndef = value === undefined;
          while (low < high) {
            var mid = nativeFloor((low + high) / 2),
                computed = iteratee(array[mid]),
                isDef = computed !== undefined,
                isReflexive = computed === computed;
            if (valIsNaN) {
              var setLow = isReflexive || retHighest;
            } else if (valIsNull) {
              setLow = isReflexive && isDef && (retHighest || computed != null);
            } else if (valIsUndef) {
              setLow = isReflexive && (retHighest || isDef);
            } else if (computed == null) {
              setLow = false;
            } else {
              setLow = retHighest ? (computed <= value) : (computed < value);
            }
            if (setLow) {
              low = mid + 1;
            } else {
              high = mid;
            }
          }
          return nativeMin(high, MAX_ARRAY_INDEX);
        }
        function bindCallback(func, thisArg, argCount) {
          if (typeof func != 'function') {
            return identity;
          }
          if (thisArg === undefined) {
            return func;
          }
          switch (argCount) {
            case 1:
              return function(value) {
                return func.call(thisArg, value);
              };
            case 3:
              return function(value, index, collection) {
                return func.call(thisArg, value, index, collection);
              };
            case 4:
              return function(accumulator, value, index, collection) {
                return func.call(thisArg, accumulator, value, index, collection);
              };
            case 5:
              return function(value, other, key, object, source) {
                return func.call(thisArg, value, other, key, object, source);
              };
          }
          return function() {
            return func.apply(thisArg, arguments);
          };
        }
        function bufferClone(buffer) {
          var result = new ArrayBuffer(buffer.byteLength),
              view = new Uint8Array(result);
          view.set(new Uint8Array(buffer));
          return result;
        }
        function composeArgs(args, partials, holders) {
          var holdersLength = holders.length,
              argsIndex = -1,
              argsLength = nativeMax(args.length - holdersLength, 0),
              leftIndex = -1,
              leftLength = partials.length,
              result = Array(leftLength + argsLength);
          while (++leftIndex < leftLength) {
            result[leftIndex] = partials[leftIndex];
          }
          while (++argsIndex < holdersLength) {
            result[holders[argsIndex]] = args[argsIndex];
          }
          while (argsLength--) {
            result[leftIndex++] = args[argsIndex++];
          }
          return result;
        }
        function composeArgsRight(args, partials, holders) {
          var holdersIndex = -1,
              holdersLength = holders.length,
              argsIndex = -1,
              argsLength = nativeMax(args.length - holdersLength, 0),
              rightIndex = -1,
              rightLength = partials.length,
              result = Array(argsLength + rightLength);
          while (++argsIndex < argsLength) {
            result[argsIndex] = args[argsIndex];
          }
          var offset = argsIndex;
          while (++rightIndex < rightLength) {
            result[offset + rightIndex] = partials[rightIndex];
          }
          while (++holdersIndex < holdersLength) {
            result[offset + holders[holdersIndex]] = args[argsIndex++];
          }
          return result;
        }
        function createAggregator(setter, initializer) {
          return function(collection, iteratee, thisArg) {
            var result = initializer ? initializer() : {};
            iteratee = getCallback(iteratee, thisArg, 3);
            if (isArray(collection)) {
              var index = -1,
                  length = collection.length;
              while (++index < length) {
                var value = collection[index];
                setter(result, value, iteratee(value, index, collection), collection);
              }
            } else {
              baseEach(collection, function(value, key, collection) {
                setter(result, value, iteratee(value, key, collection), collection);
              });
            }
            return result;
          };
        }
        function createAssigner(assigner) {
          return restParam(function(object, sources) {
            var index = -1,
                length = object == null ? 0 : sources.length,
                customizer = length > 2 ? sources[length - 2] : undefined,
                guard = length > 2 ? sources[2] : undefined,
                thisArg = length > 1 ? sources[length - 1] : undefined;
            if (typeof customizer == 'function') {
              customizer = bindCallback(customizer, thisArg, 5);
              length -= 2;
            } else {
              customizer = typeof thisArg == 'function' ? thisArg : undefined;
              length -= (customizer ? 1 : 0);
            }
            if (guard && isIterateeCall(sources[0], sources[1], guard)) {
              customizer = length < 3 ? undefined : customizer;
              length = 1;
            }
            while (++index < length) {
              var source = sources[index];
              if (source) {
                assigner(object, source, customizer);
              }
            }
            return object;
          });
        }
        function createBaseEach(eachFunc, fromRight) {
          return function(collection, iteratee) {
            var length = collection ? getLength(collection) : 0;
            if (!isLength(length)) {
              return eachFunc(collection, iteratee);
            }
            var index = fromRight ? length : -1,
                iterable = toObject(collection);
            while ((fromRight ? index-- : ++index < length)) {
              if (iteratee(iterable[index], index, iterable) === false) {
                break;
              }
            }
            return collection;
          };
        }
        function createBaseFor(fromRight) {
          return function(object, iteratee, keysFunc) {
            var iterable = toObject(object),
                props = keysFunc(object),
                length = props.length,
                index = fromRight ? length : -1;
            while ((fromRight ? index-- : ++index < length)) {
              var key = props[index];
              if (iteratee(iterable[key], key, iterable) === false) {
                break;
              }
            }
            return object;
          };
        }
        function createBindWrapper(func, thisArg) {
          var Ctor = createCtorWrapper(func);
          function wrapper() {
            var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
            return fn.apply(thisArg, arguments);
          }
          return wrapper;
        }
        function createCache(values) {
          return (nativeCreate && Set) ? new SetCache(values) : null;
        }
        function createCompounder(callback) {
          return function(string) {
            var index = -1,
                array = words(deburr(string)),
                length = array.length,
                result = '';
            while (++index < length) {
              result = callback(result, array[index], index);
            }
            return result;
          };
        }
        function createCtorWrapper(Ctor) {
          return function() {
            var args = arguments;
            switch (args.length) {
              case 0:
                return new Ctor;
              case 1:
                return new Ctor(args[0]);
              case 2:
                return new Ctor(args[0], args[1]);
              case 3:
                return new Ctor(args[0], args[1], args[2]);
              case 4:
                return new Ctor(args[0], args[1], args[2], args[3]);
              case 5:
                return new Ctor(args[0], args[1], args[2], args[3], args[4]);
              case 6:
                return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
              case 7:
                return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
            }
            var thisBinding = baseCreate(Ctor.prototype),
                result = Ctor.apply(thisBinding, args);
            return isObject(result) ? result : thisBinding;
          };
        }
        function createCurry(flag) {
          function curryFunc(func, arity, guard) {
            if (guard && isIterateeCall(func, arity, guard)) {
              arity = undefined;
            }
            var result = createWrapper(func, flag, undefined, undefined, undefined, undefined, undefined, arity);
            result.placeholder = curryFunc.placeholder;
            return result;
          }
          return curryFunc;
        }
        function createDefaults(assigner, customizer) {
          return restParam(function(args) {
            var object = args[0];
            if (object == null) {
              return object;
            }
            args.push(customizer);
            return assigner.apply(undefined, args);
          });
        }
        function createExtremum(comparator, exValue) {
          return function(collection, iteratee, thisArg) {
            if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
              iteratee = undefined;
            }
            iteratee = getCallback(iteratee, thisArg, 3);
            if (iteratee.length == 1) {
              collection = isArray(collection) ? collection : toIterable(collection);
              var result = arrayExtremum(collection, iteratee, comparator, exValue);
              if (!(collection.length && result === exValue)) {
                return result;
              }
            }
            return baseExtremum(collection, iteratee, comparator, exValue);
          };
        }
        function createFind(eachFunc, fromRight) {
          return function(collection, predicate, thisArg) {
            predicate = getCallback(predicate, thisArg, 3);
            if (isArray(collection)) {
              var index = baseFindIndex(collection, predicate, fromRight);
              return index > -1 ? collection[index] : undefined;
            }
            return baseFind(collection, predicate, eachFunc);
          };
        }
        function createFindIndex(fromRight) {
          return function(array, predicate, thisArg) {
            if (!(array && array.length)) {
              return -1;
            }
            predicate = getCallback(predicate, thisArg, 3);
            return baseFindIndex(array, predicate, fromRight);
          };
        }
        function createFindKey(objectFunc) {
          return function(object, predicate, thisArg) {
            predicate = getCallback(predicate, thisArg, 3);
            return baseFind(object, predicate, objectFunc, true);
          };
        }
        function createFlow(fromRight) {
          return function() {
            var wrapper,
                length = arguments.length,
                index = fromRight ? length : -1,
                leftIndex = 0,
                funcs = Array(length);
            while ((fromRight ? index-- : ++index < length)) {
              var func = funcs[leftIndex++] = arguments[index];
              if (typeof func != 'function') {
                throw new TypeError(FUNC_ERROR_TEXT);
              }
              if (!wrapper && LodashWrapper.prototype.thru && getFuncName(func) == 'wrapper') {
                wrapper = new LodashWrapper([], true);
              }
            }
            index = wrapper ? -1 : length;
            while (++index < length) {
              func = funcs[index];
              var funcName = getFuncName(func),
                  data = funcName == 'wrapper' ? getData(func) : undefined;
              if (data && isLaziable(data[0]) && data[1] == (ARY_FLAG | CURRY_FLAG | PARTIAL_FLAG | REARG_FLAG) && !data[4].length && data[9] == 1) {
                wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
              } else {
                wrapper = (func.length == 1 && isLaziable(func)) ? wrapper[funcName]() : wrapper.thru(func);
              }
            }
            return function() {
              var args = arguments,
                  value = args[0];
              if (wrapper && args.length == 1 && isArray(value) && value.length >= LARGE_ARRAY_SIZE) {
                return wrapper.plant(value).value();
              }
              var index = 0,
                  result = length ? funcs[index].apply(this, args) : value;
              while (++index < length) {
                result = funcs[index].call(this, result);
              }
              return result;
            };
          };
        }
        function createForEach(arrayFunc, eachFunc) {
          return function(collection, iteratee, thisArg) {
            return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection)) ? arrayFunc(collection, iteratee) : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
          };
        }
        function createForIn(objectFunc) {
          return function(object, iteratee, thisArg) {
            if (typeof iteratee != 'function' || thisArg !== undefined) {
              iteratee = bindCallback(iteratee, thisArg, 3);
            }
            return objectFunc(object, iteratee, keysIn);
          };
        }
        function createForOwn(objectFunc) {
          return function(object, iteratee, thisArg) {
            if (typeof iteratee != 'function' || thisArg !== undefined) {
              iteratee = bindCallback(iteratee, thisArg, 3);
            }
            return objectFunc(object, iteratee);
          };
        }
        function createObjectMapper(isMapKeys) {
          return function(object, iteratee, thisArg) {
            var result = {};
            iteratee = getCallback(iteratee, thisArg, 3);
            baseForOwn(object, function(value, key, object) {
              var mapped = iteratee(value, key, object);
              key = isMapKeys ? mapped : key;
              value = isMapKeys ? value : mapped;
              result[key] = value;
            });
            return result;
          };
        }
        function createPadDir(fromRight) {
          return function(string, length, chars) {
            string = baseToString(string);
            return (fromRight ? string : '') + createPadding(string, length, chars) + (fromRight ? '' : string);
          };
        }
        function createPartial(flag) {
          var partialFunc = restParam(function(func, partials) {
            var holders = replaceHolders(partials, partialFunc.placeholder);
            return createWrapper(func, flag, undefined, partials, holders);
          });
          return partialFunc;
        }
        function createReduce(arrayFunc, eachFunc) {
          return function(collection, iteratee, accumulator, thisArg) {
            var initFromArray = arguments.length < 3;
            return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection)) ? arrayFunc(collection, iteratee, accumulator, initFromArray) : baseReduce(collection, getCallback(iteratee, thisArg, 4), accumulator, initFromArray, eachFunc);
          };
        }
        function createHybridWrapper(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
          var isAry = bitmask & ARY_FLAG,
              isBind = bitmask & BIND_FLAG,
              isBindKey = bitmask & BIND_KEY_FLAG,
              isCurry = bitmask & CURRY_FLAG,
              isCurryBound = bitmask & CURRY_BOUND_FLAG,
              isCurryRight = bitmask & CURRY_RIGHT_FLAG,
              Ctor = isBindKey ? undefined : createCtorWrapper(func);
          function wrapper() {
            var length = arguments.length,
                index = length,
                args = Array(length);
            while (index--) {
              args[index] = arguments[index];
            }
            if (partials) {
              args = composeArgs(args, partials, holders);
            }
            if (partialsRight) {
              args = composeArgsRight(args, partialsRight, holdersRight);
            }
            if (isCurry || isCurryRight) {
              var placeholder = wrapper.placeholder,
                  argsHolders = replaceHolders(args, placeholder);
              length -= argsHolders.length;
              if (length < arity) {
                var newArgPos = argPos ? arrayCopy(argPos) : undefined,
                    newArity = nativeMax(arity - length, 0),
                    newsHolders = isCurry ? argsHolders : undefined,
                    newHoldersRight = isCurry ? undefined : argsHolders,
                    newPartials = isCurry ? args : undefined,
                    newPartialsRight = isCurry ? undefined : args;
                bitmask |= (isCurry ? PARTIAL_FLAG : PARTIAL_RIGHT_FLAG);
                bitmask &= ~(isCurry ? PARTIAL_RIGHT_FLAG : PARTIAL_FLAG);
                if (!isCurryBound) {
                  bitmask &= ~(BIND_FLAG | BIND_KEY_FLAG);
                }
                var newData = [func, bitmask, thisArg, newPartials, newsHolders, newPartialsRight, newHoldersRight, newArgPos, ary, newArity],
                    result = createHybridWrapper.apply(undefined, newData);
                if (isLaziable(func)) {
                  setData(result, newData);
                }
                result.placeholder = placeholder;
                return result;
              }
            }
            var thisBinding = isBind ? thisArg : this,
                fn = isBindKey ? thisBinding[func] : func;
            if (argPos) {
              args = reorder(args, argPos);
            }
            if (isAry && ary < args.length) {
              args.length = ary;
            }
            if (this && this !== root && this instanceof wrapper) {
              fn = Ctor || createCtorWrapper(func);
            }
            return fn.apply(thisBinding, args);
          }
          return wrapper;
        }
        function createPadding(string, length, chars) {
          var strLength = string.length;
          length = +length;
          if (strLength >= length || !nativeIsFinite(length)) {
            return '';
          }
          var padLength = length - strLength;
          chars = chars == null ? ' ' : (chars + '');
          return repeat(chars, nativeCeil(padLength / chars.length)).slice(0, padLength);
        }
        function createPartialWrapper(func, bitmask, thisArg, partials) {
          var isBind = bitmask & BIND_FLAG,
              Ctor = createCtorWrapper(func);
          function wrapper() {
            var argsIndex = -1,
                argsLength = arguments.length,
                leftIndex = -1,
                leftLength = partials.length,
                args = Array(leftLength + argsLength);
            while (++leftIndex < leftLength) {
              args[leftIndex] = partials[leftIndex];
            }
            while (argsLength--) {
              args[leftIndex++] = arguments[++argsIndex];
            }
            var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
            return fn.apply(isBind ? thisArg : this, args);
          }
          return wrapper;
        }
        function createRound(methodName) {
          var func = Math[methodName];
          return function(number, precision) {
            precision = precision === undefined ? 0 : (+precision || 0);
            if (precision) {
              precision = pow(10, precision);
              return func(number * precision) / precision;
            }
            return func(number);
          };
        }
        function createSortedIndex(retHighest) {
          return function(array, value, iteratee, thisArg) {
            var callback = getCallback(iteratee);
            return (iteratee == null && callback === baseCallback) ? binaryIndex(array, value, retHighest) : binaryIndexBy(array, value, callback(iteratee, thisArg, 1), retHighest);
          };
        }
        function createWrapper(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
          var isBindKey = bitmask & BIND_KEY_FLAG;
          if (!isBindKey && typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          var length = partials ? partials.length : 0;
          if (!length) {
            bitmask &= ~(PARTIAL_FLAG | PARTIAL_RIGHT_FLAG);
            partials = holders = undefined;
          }
          length -= (holders ? holders.length : 0);
          if (bitmask & PARTIAL_RIGHT_FLAG) {
            var partialsRight = partials,
                holdersRight = holders;
            partials = holders = undefined;
          }
          var data = isBindKey ? undefined : getData(func),
              newData = [func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity];
          if (data) {
            mergeData(newData, data);
            bitmask = newData[1];
            arity = newData[9];
          }
          newData[9] = arity == null ? (isBindKey ? 0 : func.length) : (nativeMax(arity - length, 0) || 0);
          if (bitmask == BIND_FLAG) {
            var result = createBindWrapper(newData[0], newData[2]);
          } else if ((bitmask == PARTIAL_FLAG || bitmask == (BIND_FLAG | PARTIAL_FLAG)) && !newData[4].length) {
            result = createPartialWrapper.apply(undefined, newData);
          } else {
            result = createHybridWrapper.apply(undefined, newData);
          }
          var setter = data ? baseSetData : setData;
          return setter(result, newData);
        }
        function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
          var index = -1,
              arrLength = array.length,
              othLength = other.length;
          if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
            return false;
          }
          while (++index < arrLength) {
            var arrValue = array[index],
                othValue = other[index],
                result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;
            if (result !== undefined) {
              if (result) {
                continue;
              }
              return false;
            }
            if (isLoose) {
              if (!arraySome(other, function(othValue) {
                return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
              })) {
                return false;
              }
            } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
              return false;
            }
          }
          return true;
        }
        function equalByTag(object, other, tag) {
          switch (tag) {
            case boolTag:
            case dateTag:
              return +object == +other;
            case errorTag:
              return object.name == other.name && object.message == other.message;
            case numberTag:
              return (object != +object) ? other != +other : object == +other;
            case regexpTag:
            case stringTag:
              return object == (other + '');
          }
          return false;
        }
        function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
          var objProps = keys(object),
              objLength = objProps.length,
              othProps = keys(other),
              othLength = othProps.length;
          if (objLength != othLength && !isLoose) {
            return false;
          }
          var index = objLength;
          while (index--) {
            var key = objProps[index];
            if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
              return false;
            }
          }
          var skipCtor = isLoose;
          while (++index < objLength) {
            key = objProps[index];
            var objValue = object[key],
                othValue = other[key],
                result = customizer ? customizer(isLoose ? othValue : objValue, isLoose ? objValue : othValue, key) : undefined;
            if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
              return false;
            }
            skipCtor || (skipCtor = key == 'constructor');
          }
          if (!skipCtor) {
            var objCtor = object.constructor,
                othCtor = other.constructor;
            if (objCtor != othCtor && ('constructor' in object && 'constructor' in other) && !(typeof objCtor == 'function' && objCtor instanceof objCtor && typeof othCtor == 'function' && othCtor instanceof othCtor)) {
              return false;
            }
          }
          return true;
        }
        function getCallback(func, thisArg, argCount) {
          var result = lodash.callback || callback;
          result = result === callback ? baseCallback : result;
          return argCount ? result(func, thisArg, argCount) : result;
        }
        var getData = !metaMap ? noop : function(func) {
          return metaMap.get(func);
        };
        function getFuncName(func) {
          var result = func.name,
              array = realNames[result],
              length = array ? array.length : 0;
          while (length--) {
            var data = array[length],
                otherFunc = data.func;
            if (otherFunc == null || otherFunc == func) {
              return data.name;
            }
          }
          return result;
        }
        function getIndexOf(collection, target, fromIndex) {
          var result = lodash.indexOf || indexOf;
          result = result === indexOf ? baseIndexOf : result;
          return collection ? result(collection, target, fromIndex) : result;
        }
        var getLength = baseProperty('length');
        function getMatchData(object) {
          var result = pairs(object),
              length = result.length;
          while (length--) {
            result[length][2] = isStrictComparable(result[length][1]);
          }
          return result;
        }
        function getNative(object, key) {
          var value = object == null ? undefined : object[key];
          return isNative(value) ? value : undefined;
        }
        function getView(start, end, transforms) {
          var index = -1,
              length = transforms.length;
          while (++index < length) {
            var data = transforms[index],
                size = data.size;
            switch (data.type) {
              case 'drop':
                start += size;
                break;
              case 'dropRight':
                end -= size;
                break;
              case 'take':
                end = nativeMin(end, start + size);
                break;
              case 'takeRight':
                start = nativeMax(start, end - size);
                break;
            }
          }
          return {
            'start': start,
            'end': end
          };
        }
        function initCloneArray(array) {
          var length = array.length,
              result = new array.constructor(length);
          if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
            result.index = array.index;
            result.input = array.input;
          }
          return result;
        }
        function initCloneObject(object) {
          var Ctor = object.constructor;
          if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
            Ctor = Object;
          }
          return new Ctor;
        }
        function initCloneByTag(object, tag, isDeep) {
          var Ctor = object.constructor;
          switch (tag) {
            case arrayBufferTag:
              return bufferClone(object);
            case boolTag:
            case dateTag:
              return new Ctor(+object);
            case float32Tag:
            case float64Tag:
            case int8Tag:
            case int16Tag:
            case int32Tag:
            case uint8Tag:
            case uint8ClampedTag:
            case uint16Tag:
            case uint32Tag:
              var buffer = object.buffer;
              return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);
            case numberTag:
            case stringTag:
              return new Ctor(object);
            case regexpTag:
              var result = new Ctor(object.source, reFlags.exec(object));
              result.lastIndex = object.lastIndex;
          }
          return result;
        }
        function invokePath(object, path, args) {
          if (object != null && !isKey(path, object)) {
            path = toPath(path);
            object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
            path = last(path);
          }
          var func = object == null ? object : object[path];
          return func == null ? undefined : func.apply(object, args);
        }
        function isArrayLike(value) {
          return value != null && isLength(getLength(value));
        }
        function isIndex(value, length) {
          value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
          length = length == null ? MAX_SAFE_INTEGER : length;
          return value > -1 && value % 1 == 0 && value < length;
        }
        function isIterateeCall(value, index, object) {
          if (!isObject(object)) {
            return false;
          }
          var type = typeof index;
          if (type == 'number' ? (isArrayLike(object) && isIndex(index, object.length)) : (type == 'string' && index in object)) {
            var other = object[index];
            return value === value ? (value === other) : (other !== other);
          }
          return false;
        }
        function isKey(value, object) {
          var type = typeof value;
          if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
            return true;
          }
          if (isArray(value)) {
            return false;
          }
          var result = !reIsDeepProp.test(value);
          return result || (object != null && value in toObject(object));
        }
        function isLaziable(func) {
          var funcName = getFuncName(func);
          if (!(funcName in LazyWrapper.prototype)) {
            return false;
          }
          var other = lodash[funcName];
          if (func === other) {
            return true;
          }
          var data = getData(other);
          return !!data && func === data[0];
        }
        function isLength(value) {
          return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
        }
        function isStrictComparable(value) {
          return value === value && !isObject(value);
        }
        function mergeData(data, source) {
          var bitmask = data[1],
              srcBitmask = source[1],
              newBitmask = bitmask | srcBitmask,
              isCommon = newBitmask < ARY_FLAG;
          var isCombo = (srcBitmask == ARY_FLAG && bitmask == CURRY_FLAG) || (srcBitmask == ARY_FLAG && bitmask == REARG_FLAG && data[7].length <= source[8]) || (srcBitmask == (ARY_FLAG | REARG_FLAG) && bitmask == CURRY_FLAG);
          if (!(isCommon || isCombo)) {
            return data;
          }
          if (srcBitmask & BIND_FLAG) {
            data[2] = source[2];
            newBitmask |= (bitmask & BIND_FLAG) ? 0 : CURRY_BOUND_FLAG;
          }
          var value = source[3];
          if (value) {
            var partials = data[3];
            data[3] = partials ? composeArgs(partials, value, source[4]) : arrayCopy(value);
            data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : arrayCopy(source[4]);
          }
          value = source[5];
          if (value) {
            partials = data[5];
            data[5] = partials ? composeArgsRight(partials, value, source[6]) : arrayCopy(value);
            data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : arrayCopy(source[6]);
          }
          value = source[7];
          if (value) {
            data[7] = arrayCopy(value);
          }
          if (srcBitmask & ARY_FLAG) {
            data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
          }
          if (data[9] == null) {
            data[9] = source[9];
          }
          data[0] = source[0];
          data[1] = newBitmask;
          return data;
        }
        function mergeDefaults(objectValue, sourceValue) {
          return objectValue === undefined ? sourceValue : merge(objectValue, sourceValue, mergeDefaults);
        }
        function pickByArray(object, props) {
          object = toObject(object);
          var index = -1,
              length = props.length,
              result = {};
          while (++index < length) {
            var key = props[index];
            if (key in object) {
              result[key] = object[key];
            }
          }
          return result;
        }
        function pickByCallback(object, predicate) {
          var result = {};
          baseForIn(object, function(value, key, object) {
            if (predicate(value, key, object)) {
              result[key] = value;
            }
          });
          return result;
        }
        function reorder(array, indexes) {
          var arrLength = array.length,
              length = nativeMin(indexes.length, arrLength),
              oldArray = arrayCopy(array);
          while (length--) {
            var index = indexes[length];
            array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
          }
          return array;
        }
        var setData = (function() {
          var count = 0,
              lastCalled = 0;
          return function(key, value) {
            var stamp = now(),
                remaining = HOT_SPAN - (stamp - lastCalled);
            lastCalled = stamp;
            if (remaining > 0) {
              if (++count >= HOT_COUNT) {
                return key;
              }
            } else {
              count = 0;
            }
            return baseSetData(key, value);
          };
        }());
        function shimKeys(object) {
          var props = keysIn(object),
              propsLength = props.length,
              length = propsLength && object.length;
          var allowIndexes = !!length && isLength(length) && (isArray(object) || isArguments(object));
          var index = -1,
              result = [];
          while (++index < propsLength) {
            var key = props[index];
            if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
              result.push(key);
            }
          }
          return result;
        }
        function toIterable(value) {
          if (value == null) {
            return [];
          }
          if (!isArrayLike(value)) {
            return values(value);
          }
          return isObject(value) ? value : Object(value);
        }
        function toObject(value) {
          return isObject(value) ? value : Object(value);
        }
        function toPath(value) {
          if (isArray(value)) {
            return value;
          }
          var result = [];
          baseToString(value).replace(rePropName, function(match, number, quote, string) {
            result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
          });
          return result;
        }
        function wrapperClone(wrapper) {
          return wrapper instanceof LazyWrapper ? wrapper.clone() : new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__, arrayCopy(wrapper.__actions__));
        }
        function chunk(array, size, guard) {
          if (guard ? isIterateeCall(array, size, guard) : size == null) {
            size = 1;
          } else {
            size = nativeMax(nativeFloor(size) || 1, 1);
          }
          var index = 0,
              length = array ? array.length : 0,
              resIndex = -1,
              result = Array(nativeCeil(length / size));
          while (index < length) {
            result[++resIndex] = baseSlice(array, index, (index += size));
          }
          return result;
        }
        function compact(array) {
          var index = -1,
              length = array ? array.length : 0,
              resIndex = -1,
              result = [];
          while (++index < length) {
            var value = array[index];
            if (value) {
              result[++resIndex] = value;
            }
          }
          return result;
        }
        var difference = restParam(function(array, values) {
          return (isObjectLike(array) && isArrayLike(array)) ? baseDifference(array, baseFlatten(values, false, true)) : [];
        });
        function drop(array, n, guard) {
          var length = array ? array.length : 0;
          if (!length) {
            return [];
          }
          if (guard ? isIterateeCall(array, n, guard) : n == null) {
            n = 1;
          }
          return baseSlice(array, n < 0 ? 0 : n);
        }
        function dropRight(array, n, guard) {
          var length = array ? array.length : 0;
          if (!length) {
            return [];
          }
          if (guard ? isIterateeCall(array, n, guard) : n == null) {
            n = 1;
          }
          n = length - (+n || 0);
          return baseSlice(array, 0, n < 0 ? 0 : n);
        }
        function dropRightWhile(array, predicate, thisArg) {
          return (array && array.length) ? baseWhile(array, getCallback(predicate, thisArg, 3), true, true) : [];
        }
        function dropWhile(array, predicate, thisArg) {
          return (array && array.length) ? baseWhile(array, getCallback(predicate, thisArg, 3), true) : [];
        }
        function fill(array, value, start, end) {
          var length = array ? array.length : 0;
          if (!length) {
            return [];
          }
          if (start && typeof start != 'number' && isIterateeCall(array, value, start)) {
            start = 0;
            end = length;
          }
          return baseFill(array, value, start, end);
        }
        var findIndex = createFindIndex();
        var findLastIndex = createFindIndex(true);
        function first(array) {
          return array ? array[0] : undefined;
        }
        function flatten(array, isDeep, guard) {
          var length = array ? array.length : 0;
          if (guard && isIterateeCall(array, isDeep, guard)) {
            isDeep = false;
          }
          return length ? baseFlatten(array, isDeep) : [];
        }
        function flattenDeep(array) {
          var length = array ? array.length : 0;
          return length ? baseFlatten(array, true) : [];
        }
        function indexOf(array, value, fromIndex) {
          var length = array ? array.length : 0;
          if (!length) {
            return -1;
          }
          if (typeof fromIndex == 'number') {
            fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : fromIndex;
          } else if (fromIndex) {
            var index = binaryIndex(array, value);
            if (index < length && (value === value ? (value === array[index]) : (array[index] !== array[index]))) {
              return index;
            }
            return -1;
          }
          return baseIndexOf(array, value, fromIndex || 0);
        }
        function initial(array) {
          return dropRight(array, 1);
        }
        var intersection = restParam(function(arrays) {
          var othLength = arrays.length,
              othIndex = othLength,
              caches = Array(length),
              indexOf = getIndexOf(),
              isCommon = indexOf == baseIndexOf,
              result = [];
          while (othIndex--) {
            var value = arrays[othIndex] = isArrayLike(value = arrays[othIndex]) ? value : [];
            caches[othIndex] = (isCommon && value.length >= 120) ? createCache(othIndex && value) : null;
          }
          var array = arrays[0],
              index = -1,
              length = array ? array.length : 0,
              seen = caches[0];
          outer: while (++index < length) {
            value = array[index];
            if ((seen ? cacheIndexOf(seen, value) : indexOf(result, value, 0)) < 0) {
              var othIndex = othLength;
              while (--othIndex) {
                var cache = caches[othIndex];
                if ((cache ? cacheIndexOf(cache, value) : indexOf(arrays[othIndex], value, 0)) < 0) {
                  continue outer;
                }
              }
              if (seen) {
                seen.push(value);
              }
              result.push(value);
            }
          }
          return result;
        });
        function last(array) {
          var length = array ? array.length : 0;
          return length ? array[length - 1] : undefined;
        }
        function lastIndexOf(array, value, fromIndex) {
          var length = array ? array.length : 0;
          if (!length) {
            return -1;
          }
          var index = length;
          if (typeof fromIndex == 'number') {
            index = (fromIndex < 0 ? nativeMax(length + fromIndex, 0) : nativeMin(fromIndex || 0, length - 1)) + 1;
          } else if (fromIndex) {
            index = binaryIndex(array, value, true) - 1;
            var other = array[index];
            if (value === value ? (value === other) : (other !== other)) {
              return index;
            }
            return -1;
          }
          if (value !== value) {
            return indexOfNaN(array, index, true);
          }
          while (index--) {
            if (array[index] === value) {
              return index;
            }
          }
          return -1;
        }
        function pull() {
          var args = arguments,
              array = args[0];
          if (!(array && array.length)) {
            return array;
          }
          var index = 0,
              indexOf = getIndexOf(),
              length = args.length;
          while (++index < length) {
            var fromIndex = 0,
                value = args[index];
            while ((fromIndex = indexOf(array, value, fromIndex)) > -1) {
              splice.call(array, fromIndex, 1);
            }
          }
          return array;
        }
        var pullAt = restParam(function(array, indexes) {
          indexes = baseFlatten(indexes);
          var result = baseAt(array, indexes);
          basePullAt(array, indexes.sort(baseCompareAscending));
          return result;
        });
        function remove(array, predicate, thisArg) {
          var result = [];
          if (!(array && array.length)) {
            return result;
          }
          var index = -1,
              indexes = [],
              length = array.length;
          predicate = getCallback(predicate, thisArg, 3);
          while (++index < length) {
            var value = array[index];
            if (predicate(value, index, array)) {
              result.push(value);
              indexes.push(index);
            }
          }
          basePullAt(array, indexes);
          return result;
        }
        function rest(array) {
          return drop(array, 1);
        }
        function slice(array, start, end) {
          var length = array ? array.length : 0;
          if (!length) {
            return [];
          }
          if (end && typeof end != 'number' && isIterateeCall(array, start, end)) {
            start = 0;
            end = length;
          }
          return baseSlice(array, start, end);
        }
        var sortedIndex = createSortedIndex();
        var sortedLastIndex = createSortedIndex(true);
        function take(array, n, guard) {
          var length = array ? array.length : 0;
          if (!length) {
            return [];
          }
          if (guard ? isIterateeCall(array, n, guard) : n == null) {
            n = 1;
          }
          return baseSlice(array, 0, n < 0 ? 0 : n);
        }
        function takeRight(array, n, guard) {
          var length = array ? array.length : 0;
          if (!length) {
            return [];
          }
          if (guard ? isIterateeCall(array, n, guard) : n == null) {
            n = 1;
          }
          n = length - (+n || 0);
          return baseSlice(array, n < 0 ? 0 : n);
        }
        function takeRightWhile(array, predicate, thisArg) {
          return (array && array.length) ? baseWhile(array, getCallback(predicate, thisArg, 3), false, true) : [];
        }
        function takeWhile(array, predicate, thisArg) {
          return (array && array.length) ? baseWhile(array, getCallback(predicate, thisArg, 3)) : [];
        }
        var union = restParam(function(arrays) {
          return baseUniq(baseFlatten(arrays, false, true));
        });
        function uniq(array, isSorted, iteratee, thisArg) {
          var length = array ? array.length : 0;
          if (!length) {
            return [];
          }
          if (isSorted != null && typeof isSorted != 'boolean') {
            thisArg = iteratee;
            iteratee = isIterateeCall(array, isSorted, thisArg) ? undefined : isSorted;
            isSorted = false;
          }
          var callback = getCallback();
          if (!(iteratee == null && callback === baseCallback)) {
            iteratee = callback(iteratee, thisArg, 3);
          }
          return (isSorted && getIndexOf() == baseIndexOf) ? sortedUniq(array, iteratee) : baseUniq(array, iteratee);
        }
        function unzip(array) {
          if (!(array && array.length)) {
            return [];
          }
          var index = -1,
              length = 0;
          array = arrayFilter(array, function(group) {
            if (isArrayLike(group)) {
              length = nativeMax(group.length, length);
              return true;
            }
          });
          var result = Array(length);
          while (++index < length) {
            result[index] = arrayMap(array, baseProperty(index));
          }
          return result;
        }
        function unzipWith(array, iteratee, thisArg) {
          var length = array ? array.length : 0;
          if (!length) {
            return [];
          }
          var result = unzip(array);
          if (iteratee == null) {
            return result;
          }
          iteratee = bindCallback(iteratee, thisArg, 4);
          return arrayMap(result, function(group) {
            return arrayReduce(group, iteratee, undefined, true);
          });
        }
        var without = restParam(function(array, values) {
          return isArrayLike(array) ? baseDifference(array, values) : [];
        });
        function xor() {
          var index = -1,
              length = arguments.length;
          while (++index < length) {
            var array = arguments[index];
            if (isArrayLike(array)) {
              var result = result ? arrayPush(baseDifference(result, array), baseDifference(array, result)) : array;
            }
          }
          return result ? baseUniq(result) : [];
        }
        var zip = restParam(unzip);
        function zipObject(props, values) {
          var index = -1,
              length = props ? props.length : 0,
              result = {};
          if (length && !values && !isArray(props[0])) {
            values = [];
          }
          while (++index < length) {
            var key = props[index];
            if (values) {
              result[key] = values[index];
            } else if (key) {
              result[key[0]] = key[1];
            }
          }
          return result;
        }
        var zipWith = restParam(function(arrays) {
          var length = arrays.length,
              iteratee = length > 2 ? arrays[length - 2] : undefined,
              thisArg = length > 1 ? arrays[length - 1] : undefined;
          if (length > 2 && typeof iteratee == 'function') {
            length -= 2;
          } else {
            iteratee = (length > 1 && typeof thisArg == 'function') ? (--length, thisArg) : undefined;
            thisArg = undefined;
          }
          arrays.length = length;
          return unzipWith(arrays, iteratee, thisArg);
        });
        function chain(value) {
          var result = lodash(value);
          result.__chain__ = true;
          return result;
        }
        function tap(value, interceptor, thisArg) {
          interceptor.call(thisArg, value);
          return value;
        }
        function thru(value, interceptor, thisArg) {
          return interceptor.call(thisArg, value);
        }
        function wrapperChain() {
          return chain(this);
        }
        function wrapperCommit() {
          return new LodashWrapper(this.value(), this.__chain__);
        }
        var wrapperConcat = restParam(function(values) {
          values = baseFlatten(values);
          return this.thru(function(array) {
            return arrayConcat(isArray(array) ? array : [toObject(array)], values);
          });
        });
        function wrapperPlant(value) {
          var result,
              parent = this;
          while (parent instanceof baseLodash) {
            var clone = wrapperClone(parent);
            if (result) {
              previous.__wrapped__ = clone;
            } else {
              result = clone;
            }
            var previous = clone;
            parent = parent.__wrapped__;
          }
          previous.__wrapped__ = value;
          return result;
        }
        function wrapperReverse() {
          var value = this.__wrapped__;
          var interceptor = function(value) {
            return (wrapped && wrapped.__dir__ < 0) ? value : value.reverse();
          };
          if (value instanceof LazyWrapper) {
            var wrapped = value;
            if (this.__actions__.length) {
              wrapped = new LazyWrapper(this);
            }
            wrapped = wrapped.reverse();
            wrapped.__actions__.push({
              'func': thru,
              'args': [interceptor],
              'thisArg': undefined
            });
            return new LodashWrapper(wrapped, this.__chain__);
          }
          return this.thru(interceptor);
        }
        function wrapperToString() {
          return (this.value() + '');
        }
        function wrapperValue() {
          return baseWrapperValue(this.__wrapped__, this.__actions__);
        }
        var at = restParam(function(collection, props) {
          return baseAt(collection, baseFlatten(props));
        });
        var countBy = createAggregator(function(result, value, key) {
          hasOwnProperty.call(result, key) ? ++result[key] : (result[key] = 1);
        });
        function every(collection, predicate, thisArg) {
          var func = isArray(collection) ? arrayEvery : baseEvery;
          if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
            predicate = undefined;
          }
          if (typeof predicate != 'function' || thisArg !== undefined) {
            predicate = getCallback(predicate, thisArg, 3);
          }
          return func(collection, predicate);
        }
        function filter(collection, predicate, thisArg) {
          var func = isArray(collection) ? arrayFilter : baseFilter;
          predicate = getCallback(predicate, thisArg, 3);
          return func(collection, predicate);
        }
        var find = createFind(baseEach);
        var findLast = createFind(baseEachRight, true);
        function findWhere(collection, source) {
          return find(collection, baseMatches(source));
        }
        var forEach = createForEach(arrayEach, baseEach);
        var forEachRight = createForEach(arrayEachRight, baseEachRight);
        var groupBy = createAggregator(function(result, value, key) {
          if (hasOwnProperty.call(result, key)) {
            result[key].push(value);
          } else {
            result[key] = [value];
          }
        });
        function includes(collection, target, fromIndex, guard) {
          var length = collection ? getLength(collection) : 0;
          if (!isLength(length)) {
            collection = values(collection);
            length = collection.length;
          }
          if (typeof fromIndex != 'number' || (guard && isIterateeCall(target, fromIndex, guard))) {
            fromIndex = 0;
          } else {
            fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : (fromIndex || 0);
          }
          return (typeof collection == 'string' || !isArray(collection) && isString(collection)) ? (fromIndex <= length && collection.indexOf(target, fromIndex) > -1) : (!!length && getIndexOf(collection, target, fromIndex) > -1);
        }
        var indexBy = createAggregator(function(result, value, key) {
          result[key] = value;
        });
        var invoke = restParam(function(collection, path, args) {
          var index = -1,
              isFunc = typeof path == 'function',
              isProp = isKey(path),
              result = isArrayLike(collection) ? Array(collection.length) : [];
          baseEach(collection, function(value) {
            var func = isFunc ? path : ((isProp && value != null) ? value[path] : undefined);
            result[++index] = func ? func.apply(value, args) : invokePath(value, path, args);
          });
          return result;
        });
        function map(collection, iteratee, thisArg) {
          var func = isArray(collection) ? arrayMap : baseMap;
          iteratee = getCallback(iteratee, thisArg, 3);
          return func(collection, iteratee);
        }
        var partition = createAggregator(function(result, value, key) {
          result[key ? 0 : 1].push(value);
        }, function() {
          return [[], []];
        });
        function pluck(collection, path) {
          return map(collection, property(path));
        }
        var reduce = createReduce(arrayReduce, baseEach);
        var reduceRight = createReduce(arrayReduceRight, baseEachRight);
        function reject(collection, predicate, thisArg) {
          var func = isArray(collection) ? arrayFilter : baseFilter;
          predicate = getCallback(predicate, thisArg, 3);
          return func(collection, function(value, index, collection) {
            return !predicate(value, index, collection);
          });
        }
        function sample(collection, n, guard) {
          if (guard ? isIterateeCall(collection, n, guard) : n == null) {
            collection = toIterable(collection);
            var length = collection.length;
            return length > 0 ? collection[baseRandom(0, length - 1)] : undefined;
          }
          var index = -1,
              result = toArray(collection),
              length = result.length,
              lastIndex = length - 1;
          n = nativeMin(n < 0 ? 0 : (+n || 0), length);
          while (++index < n) {
            var rand = baseRandom(index, lastIndex),
                value = result[rand];
            result[rand] = result[index];
            result[index] = value;
          }
          result.length = n;
          return result;
        }
        function shuffle(collection) {
          return sample(collection, POSITIVE_INFINITY);
        }
        function size(collection) {
          var length = collection ? getLength(collection) : 0;
          return isLength(length) ? length : keys(collection).length;
        }
        function some(collection, predicate, thisArg) {
          var func = isArray(collection) ? arraySome : baseSome;
          if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
            predicate = undefined;
          }
          if (typeof predicate != 'function' || thisArg !== undefined) {
            predicate = getCallback(predicate, thisArg, 3);
          }
          return func(collection, predicate);
        }
        function sortBy(collection, iteratee, thisArg) {
          if (collection == null) {
            return [];
          }
          if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
            iteratee = undefined;
          }
          var index = -1;
          iteratee = getCallback(iteratee, thisArg, 3);
          var result = baseMap(collection, function(value, key, collection) {
            return {
              'criteria': iteratee(value, key, collection),
              'index': ++index,
              'value': value
            };
          });
          return baseSortBy(result, compareAscending);
        }
        var sortByAll = restParam(function(collection, iteratees) {
          if (collection == null) {
            return [];
          }
          var guard = iteratees[2];
          if (guard && isIterateeCall(iteratees[0], iteratees[1], guard)) {
            iteratees.length = 1;
          }
          return baseSortByOrder(collection, baseFlatten(iteratees), []);
        });
        function sortByOrder(collection, iteratees, orders, guard) {
          if (collection == null) {
            return [];
          }
          if (guard && isIterateeCall(iteratees, orders, guard)) {
            orders = undefined;
          }
          if (!isArray(iteratees)) {
            iteratees = iteratees == null ? [] : [iteratees];
          }
          if (!isArray(orders)) {
            orders = orders == null ? [] : [orders];
          }
          return baseSortByOrder(collection, iteratees, orders);
        }
        function where(collection, source) {
          return filter(collection, baseMatches(source));
        }
        var now = nativeNow || function() {
          return new Date().getTime();
        };
        function after(n, func) {
          if (typeof func != 'function') {
            if (typeof n == 'function') {
              var temp = n;
              n = func;
              func = temp;
            } else {
              throw new TypeError(FUNC_ERROR_TEXT);
            }
          }
          n = nativeIsFinite(n = +n) ? n : 0;
          return function() {
            if (--n < 1) {
              return func.apply(this, arguments);
            }
          };
        }
        function ary(func, n, guard) {
          if (guard && isIterateeCall(func, n, guard)) {
            n = undefined;
          }
          n = (func && n == null) ? func.length : nativeMax(+n || 0, 0);
          return createWrapper(func, ARY_FLAG, undefined, undefined, undefined, undefined, n);
        }
        function before(n, func) {
          var result;
          if (typeof func != 'function') {
            if (typeof n == 'function') {
              var temp = n;
              n = func;
              func = temp;
            } else {
              throw new TypeError(FUNC_ERROR_TEXT);
            }
          }
          return function() {
            if (--n > 0) {
              result = func.apply(this, arguments);
            }
            if (n <= 1) {
              func = undefined;
            }
            return result;
          };
        }
        var bind = restParam(function(func, thisArg, partials) {
          var bitmask = BIND_FLAG;
          if (partials.length) {
            var holders = replaceHolders(partials, bind.placeholder);
            bitmask |= PARTIAL_FLAG;
          }
          return createWrapper(func, bitmask, thisArg, partials, holders);
        });
        var bindAll = restParam(function(object, methodNames) {
          methodNames = methodNames.length ? baseFlatten(methodNames) : functions(object);
          var index = -1,
              length = methodNames.length;
          while (++index < length) {
            var key = methodNames[index];
            object[key] = createWrapper(object[key], BIND_FLAG, object);
          }
          return object;
        });
        var bindKey = restParam(function(object, key, partials) {
          var bitmask = BIND_FLAG | BIND_KEY_FLAG;
          if (partials.length) {
            var holders = replaceHolders(partials, bindKey.placeholder);
            bitmask |= PARTIAL_FLAG;
          }
          return createWrapper(key, bitmask, object, partials, holders);
        });
        var curry = createCurry(CURRY_FLAG);
        var curryRight = createCurry(CURRY_RIGHT_FLAG);
        function debounce(func, wait, options) {
          var args,
              maxTimeoutId,
              result,
              stamp,
              thisArg,
              timeoutId,
              trailingCall,
              lastCalled = 0,
              maxWait = false,
              trailing = true;
          if (typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          wait = wait < 0 ? 0 : (+wait || 0);
          if (options === true) {
            var leading = true;
            trailing = false;
          } else if (isObject(options)) {
            leading = !!options.leading;
            maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
            trailing = 'trailing' in options ? !!options.trailing : trailing;
          }
          function cancel() {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            if (maxTimeoutId) {
              clearTimeout(maxTimeoutId);
            }
            lastCalled = 0;
            maxTimeoutId = timeoutId = trailingCall = undefined;
          }
          function complete(isCalled, id) {
            if (id) {
              clearTimeout(id);
            }
            maxTimeoutId = timeoutId = trailingCall = undefined;
            if (isCalled) {
              lastCalled = now();
              result = func.apply(thisArg, args);
              if (!timeoutId && !maxTimeoutId) {
                args = thisArg = undefined;
              }
            }
          }
          function delayed() {
            var remaining = wait - (now() - stamp);
            if (remaining <= 0 || remaining > wait) {
              complete(trailingCall, maxTimeoutId);
            } else {
              timeoutId = setTimeout(delayed, remaining);
            }
          }
          function maxDelayed() {
            complete(trailing, timeoutId);
          }
          function debounced() {
            args = arguments;
            stamp = now();
            thisArg = this;
            trailingCall = trailing && (timeoutId || !leading);
            if (maxWait === false) {
              var leadingCall = leading && !timeoutId;
            } else {
              if (!maxTimeoutId && !leading) {
                lastCalled = stamp;
              }
              var remaining = maxWait - (stamp - lastCalled),
                  isCalled = remaining <= 0 || remaining > maxWait;
              if (isCalled) {
                if (maxTimeoutId) {
                  maxTimeoutId = clearTimeout(maxTimeoutId);
                }
                lastCalled = stamp;
                result = func.apply(thisArg, args);
              } else if (!maxTimeoutId) {
                maxTimeoutId = setTimeout(maxDelayed, remaining);
              }
            }
            if (isCalled && timeoutId) {
              timeoutId = clearTimeout(timeoutId);
            } else if (!timeoutId && wait !== maxWait) {
              timeoutId = setTimeout(delayed, wait);
            }
            if (leadingCall) {
              isCalled = true;
              result = func.apply(thisArg, args);
            }
            if (isCalled && !timeoutId && !maxTimeoutId) {
              args = thisArg = undefined;
            }
            return result;
          }
          debounced.cancel = cancel;
          return debounced;
        }
        var defer = restParam(function(func, args) {
          return baseDelay(func, 1, args);
        });
        var delay = restParam(function(func, wait, args) {
          return baseDelay(func, wait, args);
        });
        var flow = createFlow();
        var flowRight = createFlow(true);
        function memoize(func, resolver) {
          if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          var memoized = function() {
            var args = arguments,
                key = resolver ? resolver.apply(this, args) : args[0],
                cache = memoized.cache;
            if (cache.has(key)) {
              return cache.get(key);
            }
            var result = func.apply(this, args);
            memoized.cache = cache.set(key, result);
            return result;
          };
          memoized.cache = new memoize.Cache;
          return memoized;
        }
        var modArgs = restParam(function(func, transforms) {
          transforms = baseFlatten(transforms);
          if (typeof func != 'function' || !arrayEvery(transforms, baseIsFunction)) {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          var length = transforms.length;
          return restParam(function(args) {
            var index = nativeMin(args.length, length);
            while (index--) {
              args[index] = transforms[index](args[index]);
            }
            return func.apply(this, args);
          });
        });
        function negate(predicate) {
          if (typeof predicate != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          return function() {
            return !predicate.apply(this, arguments);
          };
        }
        function once(func) {
          return before(2, func);
        }
        var partial = createPartial(PARTIAL_FLAG);
        var partialRight = createPartial(PARTIAL_RIGHT_FLAG);
        var rearg = restParam(function(func, indexes) {
          return createWrapper(func, REARG_FLAG, undefined, undefined, undefined, baseFlatten(indexes));
        });
        function restParam(func, start) {
          if (typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
          return function() {
            var args = arguments,
                index = -1,
                length = nativeMax(args.length - start, 0),
                rest = Array(length);
            while (++index < length) {
              rest[index] = args[start + index];
            }
            switch (start) {
              case 0:
                return func.call(this, rest);
              case 1:
                return func.call(this, args[0], rest);
              case 2:
                return func.call(this, args[0], args[1], rest);
            }
            var otherArgs = Array(start + 1);
            index = -1;
            while (++index < start) {
              otherArgs[index] = args[index];
            }
            otherArgs[start] = rest;
            return func.apply(this, otherArgs);
          };
        }
        function spread(func) {
          if (typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          return function(array) {
            return func.apply(this, array);
          };
        }
        function throttle(func, wait, options) {
          var leading = true,
              trailing = true;
          if (typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          if (options === false) {
            leading = false;
          } else if (isObject(options)) {
            leading = 'leading' in options ? !!options.leading : leading;
            trailing = 'trailing' in options ? !!options.trailing : trailing;
          }
          return debounce(func, wait, {
            'leading': leading,
            'maxWait': +wait,
            'trailing': trailing
          });
        }
        function wrap(value, wrapper) {
          wrapper = wrapper == null ? identity : wrapper;
          return createWrapper(wrapper, PARTIAL_FLAG, undefined, [value], []);
        }
        function clone(value, isDeep, customizer, thisArg) {
          if (isDeep && typeof isDeep != 'boolean' && isIterateeCall(value, isDeep, customizer)) {
            isDeep = false;
          } else if (typeof isDeep == 'function') {
            thisArg = customizer;
            customizer = isDeep;
            isDeep = false;
          }
          return typeof customizer == 'function' ? baseClone(value, isDeep, bindCallback(customizer, thisArg, 1)) : baseClone(value, isDeep);
        }
        function cloneDeep(value, customizer, thisArg) {
          return typeof customizer == 'function' ? baseClone(value, true, bindCallback(customizer, thisArg, 1)) : baseClone(value, true);
        }
        function gt(value, other) {
          return value > other;
        }
        function gte(value, other) {
          return value >= other;
        }
        function isArguments(value) {
          return isObjectLike(value) && isArrayLike(value) && hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
        }
        var isArray = nativeIsArray || function(value) {
          return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
        };
        function isBoolean(value) {
          return value === true || value === false || (isObjectLike(value) && objToString.call(value) == boolTag);
        }
        function isDate(value) {
          return isObjectLike(value) && objToString.call(value) == dateTag;
        }
        function isElement(value) {
          return !!value && value.nodeType === 1 && isObjectLike(value) && !isPlainObject(value);
        }
        function isEmpty(value) {
          if (value == null) {
            return true;
          }
          if (isArrayLike(value) && (isArray(value) || isString(value) || isArguments(value) || (isObjectLike(value) && isFunction(value.splice)))) {
            return !value.length;
          }
          return !keys(value).length;
        }
        function isEqual(value, other, customizer, thisArg) {
          customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
          var result = customizer ? customizer(value, other) : undefined;
          return result === undefined ? baseIsEqual(value, other, customizer) : !!result;
        }
        function isError(value) {
          return isObjectLike(value) && typeof value.message == 'string' && objToString.call(value) == errorTag;
        }
        function isFinite(value) {
          return typeof value == 'number' && nativeIsFinite(value);
        }
        function isFunction(value) {
          return isObject(value) && objToString.call(value) == funcTag;
        }
        function isObject(value) {
          var type = typeof value;
          return !!value && (type == 'object' || type == 'function');
        }
        function isMatch(object, source, customizer, thisArg) {
          customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
          return baseIsMatch(object, getMatchData(source), customizer);
        }
        function isNaN(value) {
          return isNumber(value) && value != +value;
        }
        function isNative(value) {
          if (value == null) {
            return false;
          }
          if (isFunction(value)) {
            return reIsNative.test(fnToString.call(value));
          }
          return isObjectLike(value) && reIsHostCtor.test(value);
        }
        function isNull(value) {
          return value === null;
        }
        function isNumber(value) {
          return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
        }
        function isPlainObject(value) {
          var Ctor;
          if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) || (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
            return false;
          }
          var result;
          baseForIn(value, function(subValue, key) {
            result = key;
          });
          return result === undefined || hasOwnProperty.call(value, result);
        }
        function isRegExp(value) {
          return isObject(value) && objToString.call(value) == regexpTag;
        }
        function isString(value) {
          return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
        }
        function isTypedArray(value) {
          return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
        }
        function isUndefined(value) {
          return value === undefined;
        }
        function lt(value, other) {
          return value < other;
        }
        function lte(value, other) {
          return value <= other;
        }
        function toArray(value) {
          var length = value ? getLength(value) : 0;
          if (!isLength(length)) {
            return values(value);
          }
          if (!length) {
            return [];
          }
          return arrayCopy(value);
        }
        function toPlainObject(value) {
          return baseCopy(value, keysIn(value));
        }
        var merge = createAssigner(baseMerge);
        var assign = createAssigner(function(object, source, customizer) {
          return customizer ? assignWith(object, source, customizer) : baseAssign(object, source);
        });
        function create(prototype, properties, guard) {
          var result = baseCreate(prototype);
          if (guard && isIterateeCall(prototype, properties, guard)) {
            properties = undefined;
          }
          return properties ? baseAssign(result, properties) : result;
        }
        var defaults = createDefaults(assign, assignDefaults);
        var defaultsDeep = createDefaults(merge, mergeDefaults);
        var findKey = createFindKey(baseForOwn);
        var findLastKey = createFindKey(baseForOwnRight);
        var forIn = createForIn(baseFor);
        var forInRight = createForIn(baseForRight);
        var forOwn = createForOwn(baseForOwn);
        var forOwnRight = createForOwn(baseForOwnRight);
        function functions(object) {
          return baseFunctions(object, keysIn(object));
        }
        function get(object, path, defaultValue) {
          var result = object == null ? undefined : baseGet(object, toPath(path), path + '');
          return result === undefined ? defaultValue : result;
        }
        function has(object, path) {
          if (object == null) {
            return false;
          }
          var result = hasOwnProperty.call(object, path);
          if (!result && !isKey(path)) {
            path = toPath(path);
            object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
            if (object == null) {
              return false;
            }
            path = last(path);
            result = hasOwnProperty.call(object, path);
          }
          return result || (isLength(object.length) && isIndex(path, object.length) && (isArray(object) || isArguments(object)));
        }
        function invert(object, multiValue, guard) {
          if (guard && isIterateeCall(object, multiValue, guard)) {
            multiValue = undefined;
          }
          var index = -1,
              props = keys(object),
              length = props.length,
              result = {};
          while (++index < length) {
            var key = props[index],
                value = object[key];
            if (multiValue) {
              if (hasOwnProperty.call(result, value)) {
                result[value].push(key);
              } else {
                result[value] = [key];
              }
            } else {
              result[value] = key;
            }
          }
          return result;
        }
        var keys = !nativeKeys ? shimKeys : function(object) {
          var Ctor = object == null ? undefined : object.constructor;
          if ((typeof Ctor == 'function' && Ctor.prototype === object) || (typeof object != 'function' && isArrayLike(object))) {
            return shimKeys(object);
          }
          return isObject(object) ? nativeKeys(object) : [];
        };
        function keysIn(object) {
          if (object == null) {
            return [];
          }
          if (!isObject(object)) {
            object = Object(object);
          }
          var length = object.length;
          length = (length && isLength(length) && (isArray(object) || isArguments(object)) && length) || 0;
          var Ctor = object.constructor,
              index = -1,
              isProto = typeof Ctor == 'function' && Ctor.prototype === object,
              result = Array(length),
              skipIndexes = length > 0;
          while (++index < length) {
            result[index] = (index + '');
          }
          for (var key in object) {
            if (!(skipIndexes && isIndex(key, length)) && !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
              result.push(key);
            }
          }
          return result;
        }
        var mapKeys = createObjectMapper(true);
        var mapValues = createObjectMapper();
        var omit = restParam(function(object, props) {
          if (object == null) {
            return {};
          }
          if (typeof props[0] != 'function') {
            var props = arrayMap(baseFlatten(props), String);
            return pickByArray(object, baseDifference(keysIn(object), props));
          }
          var predicate = bindCallback(props[0], props[1], 3);
          return pickByCallback(object, function(value, key, object) {
            return !predicate(value, key, object);
          });
        });
        function pairs(object) {
          object = toObject(object);
          var index = -1,
              props = keys(object),
              length = props.length,
              result = Array(length);
          while (++index < length) {
            var key = props[index];
            result[index] = [key, object[key]];
          }
          return result;
        }
        var pick = restParam(function(object, props) {
          if (object == null) {
            return {};
          }
          return typeof props[0] == 'function' ? pickByCallback(object, bindCallback(props[0], props[1], 3)) : pickByArray(object, baseFlatten(props));
        });
        function result(object, path, defaultValue) {
          var result = object == null ? undefined : object[path];
          if (result === undefined) {
            if (object != null && !isKey(path, object)) {
              path = toPath(path);
              object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
              result = object == null ? undefined : object[last(path)];
            }
            result = result === undefined ? defaultValue : result;
          }
          return isFunction(result) ? result.call(object) : result;
        }
        function set(object, path, value) {
          if (object == null) {
            return object;
          }
          var pathKey = (path + '');
          path = (object[pathKey] != null || isKey(path, object)) ? [pathKey] : toPath(path);
          var index = -1,
              length = path.length,
              lastIndex = length - 1,
              nested = object;
          while (nested != null && ++index < length) {
            var key = path[index];
            if (isObject(nested)) {
              if (index == lastIndex) {
                nested[key] = value;
              } else if (nested[key] == null) {
                nested[key] = isIndex(path[index + 1]) ? [] : {};
              }
            }
            nested = nested[key];
          }
          return object;
        }
        function transform(object, iteratee, accumulator, thisArg) {
          var isArr = isArray(object) || isTypedArray(object);
          iteratee = getCallback(iteratee, thisArg, 4);
          if (accumulator == null) {
            if (isArr || isObject(object)) {
              var Ctor = object.constructor;
              if (isArr) {
                accumulator = isArray(object) ? new Ctor : [];
              } else {
                accumulator = baseCreate(isFunction(Ctor) ? Ctor.prototype : undefined);
              }
            } else {
              accumulator = {};
            }
          }
          (isArr ? arrayEach : baseForOwn)(object, function(value, index, object) {
            return iteratee(accumulator, value, index, object);
          });
          return accumulator;
        }
        function values(object) {
          return baseValues(object, keys(object));
        }
        function valuesIn(object) {
          return baseValues(object, keysIn(object));
        }
        function inRange(value, start, end) {
          start = +start || 0;
          if (end === undefined) {
            end = start;
            start = 0;
          } else {
            end = +end || 0;
          }
          return value >= nativeMin(start, end) && value < nativeMax(start, end);
        }
        function random(min, max, floating) {
          if (floating && isIterateeCall(min, max, floating)) {
            max = floating = undefined;
          }
          var noMin = min == null,
              noMax = max == null;
          if (floating == null) {
            if (noMax && typeof min == 'boolean') {
              floating = min;
              min = 1;
            } else if (typeof max == 'boolean') {
              floating = max;
              noMax = true;
            }
          }
          if (noMin && noMax) {
            max = 1;
            noMax = false;
          }
          min = +min || 0;
          if (noMax) {
            max = min;
            min = 0;
          } else {
            max = +max || 0;
          }
          if (floating || min % 1 || max % 1) {
            var rand = nativeRandom();
            return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand + '').length - 1)))), max);
          }
          return baseRandom(min, max);
        }
        var camelCase = createCompounder(function(result, word, index) {
          word = word.toLowerCase();
          return result + (index ? (word.charAt(0).toUpperCase() + word.slice(1)) : word);
        });
        function capitalize(string) {
          string = baseToString(string);
          return string && (string.charAt(0).toUpperCase() + string.slice(1));
        }
        function deburr(string) {
          string = baseToString(string);
          return string && string.replace(reLatin1, deburrLetter).replace(reComboMark, '');
        }
        function endsWith(string, target, position) {
          string = baseToString(string);
          target = (target + '');
          var length = string.length;
          position = position === undefined ? length : nativeMin(position < 0 ? 0 : (+position || 0), length);
          position -= target.length;
          return position >= 0 && string.indexOf(target, position) == position;
        }
        function escape(string) {
          string = baseToString(string);
          return (string && reHasUnescapedHtml.test(string)) ? string.replace(reUnescapedHtml, escapeHtmlChar) : string;
        }
        function escapeRegExp(string) {
          string = baseToString(string);
          return (string && reHasRegExpChars.test(string)) ? string.replace(reRegExpChars, escapeRegExpChar) : (string || '(?:)');
        }
        var kebabCase = createCompounder(function(result, word, index) {
          return result + (index ? '-' : '') + word.toLowerCase();
        });
        function pad(string, length, chars) {
          string = baseToString(string);
          length = +length;
          var strLength = string.length;
          if (strLength >= length || !nativeIsFinite(length)) {
            return string;
          }
          var mid = (length - strLength) / 2,
              leftLength = nativeFloor(mid),
              rightLength = nativeCeil(mid);
          chars = createPadding('', rightLength, chars);
          return chars.slice(0, leftLength) + string + chars;
        }
        var padLeft = createPadDir();
        var padRight = createPadDir(true);
        function parseInt(string, radix, guard) {
          if (guard ? isIterateeCall(string, radix, guard) : radix == null) {
            radix = 0;
          } else if (radix) {
            radix = +radix;
          }
          string = trim(string);
          return nativeParseInt(string, radix || (reHasHexPrefix.test(string) ? 16 : 10));
        }
        function repeat(string, n) {
          var result = '';
          string = baseToString(string);
          n = +n;
          if (n < 1 || !string || !nativeIsFinite(n)) {
            return result;
          }
          do {
            if (n % 2) {
              result += string;
            }
            n = nativeFloor(n / 2);
            string += string;
          } while (n);
          return result;
        }
        var snakeCase = createCompounder(function(result, word, index) {
          return result + (index ? '_' : '') + word.toLowerCase();
        });
        var startCase = createCompounder(function(result, word, index) {
          return result + (index ? ' ' : '') + (word.charAt(0).toUpperCase() + word.slice(1));
        });
        function startsWith(string, target, position) {
          string = baseToString(string);
          position = position == null ? 0 : nativeMin(position < 0 ? 0 : (+position || 0), string.length);
          return string.lastIndexOf(target, position) == position;
        }
        function template(string, options, otherOptions) {
          var settings = lodash.templateSettings;
          if (otherOptions && isIterateeCall(string, options, otherOptions)) {
            options = otherOptions = undefined;
          }
          string = baseToString(string);
          options = assignWith(baseAssign({}, otherOptions || options), settings, assignOwnDefaults);
          var imports = assignWith(baseAssign({}, options.imports), settings.imports, assignOwnDefaults),
              importsKeys = keys(imports),
              importsValues = baseValues(imports, importsKeys);
          var isEscaping,
              isEvaluating,
              index = 0,
              interpolate = options.interpolate || reNoMatch,
              source = "__p += '";
          var reDelimiters = RegExp((options.escape || reNoMatch).source + '|' + interpolate.source + '|' + (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' + (options.evaluate || reNoMatch).source + '|$', 'g');
          var sourceURL = '//# sourceURL=' + ('sourceURL' in options ? options.sourceURL : ('lodash.templateSources[' + (++templateCounter) + ']')) + '\n';
          string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
            interpolateValue || (interpolateValue = esTemplateValue);
            source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);
            if (escapeValue) {
              isEscaping = true;
              source += "' +\n__e(" + escapeValue + ") +\n'";
            }
            if (evaluateValue) {
              isEvaluating = true;
              source += "';\n" + evaluateValue + ";\n__p += '";
            }
            if (interpolateValue) {
              source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
            }
            index = offset + match.length;
            return match;
          });
          source += "';\n";
          var variable = options.variable;
          if (!variable) {
            source = 'with (obj) {\n' + source + '\n}\n';
          }
          source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source).replace(reEmptyStringMiddle, '$1').replace(reEmptyStringTrailing, '$1;');
          source = 'function(' + (variable || 'obj') + ') {\n' + (variable ? '' : 'obj || (obj = {});\n') + "var __t, __p = ''" + (isEscaping ? ', __e = _.escape' : '') + (isEvaluating ? ', __j = Array.prototype.join;\n' + "function print() { __p += __j.call(arguments, '') }\n" : ';\n') + source + 'return __p\n}';
          var result = attempt(function() {
            return Function(importsKeys, sourceURL + 'return ' + source).apply(undefined, importsValues);
          });
          result.source = source;
          if (isError(result)) {
            throw result;
          }
          return result;
        }
        function trim(string, chars, guard) {
          var value = string;
          string = baseToString(string);
          if (!string) {
            return string;
          }
          if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
            return string.slice(trimmedLeftIndex(string), trimmedRightIndex(string) + 1);
          }
          chars = (chars + '');
          return string.slice(charsLeftIndex(string, chars), charsRightIndex(string, chars) + 1);
        }
        function trimLeft(string, chars, guard) {
          var value = string;
          string = baseToString(string);
          if (!string) {
            return string;
          }
          if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
            return string.slice(trimmedLeftIndex(string));
          }
          return string.slice(charsLeftIndex(string, (chars + '')));
        }
        function trimRight(string, chars, guard) {
          var value = string;
          string = baseToString(string);
          if (!string) {
            return string;
          }
          if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
            return string.slice(0, trimmedRightIndex(string) + 1);
          }
          return string.slice(0, charsRightIndex(string, (chars + '')) + 1);
        }
        function trunc(string, options, guard) {
          if (guard && isIterateeCall(string, options, guard)) {
            options = undefined;
          }
          var length = DEFAULT_TRUNC_LENGTH,
              omission = DEFAULT_TRUNC_OMISSION;
          if (options != null) {
            if (isObject(options)) {
              var separator = 'separator' in options ? options.separator : separator;
              length = 'length' in options ? (+options.length || 0) : length;
              omission = 'omission' in options ? baseToString(options.omission) : omission;
            } else {
              length = +options || 0;
            }
          }
          string = baseToString(string);
          if (length >= string.length) {
            return string;
          }
          var end = length - omission.length;
          if (end < 1) {
            return omission;
          }
          var result = string.slice(0, end);
          if (separator == null) {
            return result + omission;
          }
          if (isRegExp(separator)) {
            if (string.slice(end).search(separator)) {
              var match,
                  newEnd,
                  substring = string.slice(0, end);
              if (!separator.global) {
                separator = RegExp(separator.source, (reFlags.exec(separator) || '') + 'g');
              }
              separator.lastIndex = 0;
              while ((match = separator.exec(substring))) {
                newEnd = match.index;
              }
              result = result.slice(0, newEnd == null ? end : newEnd);
            }
          } else if (string.indexOf(separator, end) != end) {
            var index = result.lastIndexOf(separator);
            if (index > -1) {
              result = result.slice(0, index);
            }
          }
          return result + omission;
        }
        function unescape(string) {
          string = baseToString(string);
          return (string && reHasEscapedHtml.test(string)) ? string.replace(reEscapedHtml, unescapeHtmlChar) : string;
        }
        function words(string, pattern, guard) {
          if (guard && isIterateeCall(string, pattern, guard)) {
            pattern = undefined;
          }
          string = baseToString(string);
          return string.match(pattern || reWords) || [];
        }
        var attempt = restParam(function(func, args) {
          try {
            return func.apply(undefined, args);
          } catch (e) {
            return isError(e) ? e : new Error(e);
          }
        });
        function callback(func, thisArg, guard) {
          if (guard && isIterateeCall(func, thisArg, guard)) {
            thisArg = undefined;
          }
          return isObjectLike(func) ? matches(func) : baseCallback(func, thisArg);
        }
        function constant(value) {
          return function() {
            return value;
          };
        }
        function identity(value) {
          return value;
        }
        function matches(source) {
          return baseMatches(baseClone(source, true));
        }
        function matchesProperty(path, srcValue) {
          return baseMatchesProperty(path, baseClone(srcValue, true));
        }
        var method = restParam(function(path, args) {
          return function(object) {
            return invokePath(object, path, args);
          };
        });
        var methodOf = restParam(function(object, args) {
          return function(path) {
            return invokePath(object, path, args);
          };
        });
        function mixin(object, source, options) {
          if (options == null) {
            var isObj = isObject(source),
                props = isObj ? keys(source) : undefined,
                methodNames = (props && props.length) ? baseFunctions(source, props) : undefined;
            if (!(methodNames ? methodNames.length : isObj)) {
              methodNames = false;
              options = source;
              source = object;
              object = this;
            }
          }
          if (!methodNames) {
            methodNames = baseFunctions(source, keys(source));
          }
          var chain = true,
              index = -1,
              isFunc = isFunction(object),
              length = methodNames.length;
          if (options === false) {
            chain = false;
          } else if (isObject(options) && 'chain' in options) {
            chain = options.chain;
          }
          while (++index < length) {
            var methodName = methodNames[index],
                func = source[methodName];
            object[methodName] = func;
            if (isFunc) {
              object.prototype[methodName] = (function(func) {
                return function() {
                  var chainAll = this.__chain__;
                  if (chain || chainAll) {
                    var result = object(this.__wrapped__),
                        actions = result.__actions__ = arrayCopy(this.__actions__);
                    actions.push({
                      'func': func,
                      'args': arguments,
                      'thisArg': object
                    });
                    result.__chain__ = chainAll;
                    return result;
                  }
                  return func.apply(object, arrayPush([this.value()], arguments));
                };
              }(func));
            }
          }
          return object;
        }
        function noConflict() {
          root._ = oldDash;
          return this;
        }
        function noop() {}
        function property(path) {
          return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
        }
        function propertyOf(object) {
          return function(path) {
            return baseGet(object, toPath(path), path + '');
          };
        }
        function range(start, end, step) {
          if (step && isIterateeCall(start, end, step)) {
            end = step = undefined;
          }
          start = +start || 0;
          step = step == null ? 1 : (+step || 0);
          if (end == null) {
            end = start;
            start = 0;
          } else {
            end = +end || 0;
          }
          var index = -1,
              length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),
              result = Array(length);
          while (++index < length) {
            result[index] = start;
            start += step;
          }
          return result;
        }
        function times(n, iteratee, thisArg) {
          n = nativeFloor(n);
          if (n < 1 || !nativeIsFinite(n)) {
            return [];
          }
          var index = -1,
              result = Array(nativeMin(n, MAX_ARRAY_LENGTH));
          iteratee = bindCallback(iteratee, thisArg, 1);
          while (++index < n) {
            if (index < MAX_ARRAY_LENGTH) {
              result[index] = iteratee(index);
            } else {
              iteratee(index);
            }
          }
          return result;
        }
        function uniqueId(prefix) {
          var id = ++idCounter;
          return baseToString(prefix) + id;
        }
        function add(augend, addend) {
          return (+augend || 0) + (+addend || 0);
        }
        var ceil = createRound('ceil');
        var floor = createRound('floor');
        var max = createExtremum(gt, NEGATIVE_INFINITY);
        var min = createExtremum(lt, POSITIVE_INFINITY);
        var round = createRound('round');
        function sum(collection, iteratee, thisArg) {
          if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
            iteratee = undefined;
          }
          iteratee = getCallback(iteratee, thisArg, 3);
          return iteratee.length == 1 ? arraySum(isArray(collection) ? collection : toIterable(collection), iteratee) : baseSum(collection, iteratee);
        }
        lodash.prototype = baseLodash.prototype;
        LodashWrapper.prototype = baseCreate(baseLodash.prototype);
        LodashWrapper.prototype.constructor = LodashWrapper;
        LazyWrapper.prototype = baseCreate(baseLodash.prototype);
        LazyWrapper.prototype.constructor = LazyWrapper;
        MapCache.prototype['delete'] = mapDelete;
        MapCache.prototype.get = mapGet;
        MapCache.prototype.has = mapHas;
        MapCache.prototype.set = mapSet;
        SetCache.prototype.push = cachePush;
        memoize.Cache = MapCache;
        lodash.after = after;
        lodash.ary = ary;
        lodash.assign = assign;
        lodash.at = at;
        lodash.before = before;
        lodash.bind = bind;
        lodash.bindAll = bindAll;
        lodash.bindKey = bindKey;
        lodash.callback = callback;
        lodash.chain = chain;
        lodash.chunk = chunk;
        lodash.compact = compact;
        lodash.constant = constant;
        lodash.countBy = countBy;
        lodash.create = create;
        lodash.curry = curry;
        lodash.curryRight = curryRight;
        lodash.debounce = debounce;
        lodash.defaults = defaults;
        lodash.defaultsDeep = defaultsDeep;
        lodash.defer = defer;
        lodash.delay = delay;
        lodash.difference = difference;
        lodash.drop = drop;
        lodash.dropRight = dropRight;
        lodash.dropRightWhile = dropRightWhile;
        lodash.dropWhile = dropWhile;
        lodash.fill = fill;
        lodash.filter = filter;
        lodash.flatten = flatten;
        lodash.flattenDeep = flattenDeep;
        lodash.flow = flow;
        lodash.flowRight = flowRight;
        lodash.forEach = forEach;
        lodash.forEachRight = forEachRight;
        lodash.forIn = forIn;
        lodash.forInRight = forInRight;
        lodash.forOwn = forOwn;
        lodash.forOwnRight = forOwnRight;
        lodash.functions = functions;
        lodash.groupBy = groupBy;
        lodash.indexBy = indexBy;
        lodash.initial = initial;
        lodash.intersection = intersection;
        lodash.invert = invert;
        lodash.invoke = invoke;
        lodash.keys = keys;
        lodash.keysIn = keysIn;
        lodash.map = map;
        lodash.mapKeys = mapKeys;
        lodash.mapValues = mapValues;
        lodash.matches = matches;
        lodash.matchesProperty = matchesProperty;
        lodash.memoize = memoize;
        lodash.merge = merge;
        lodash.method = method;
        lodash.methodOf = methodOf;
        lodash.mixin = mixin;
        lodash.modArgs = modArgs;
        lodash.negate = negate;
        lodash.omit = omit;
        lodash.once = once;
        lodash.pairs = pairs;
        lodash.partial = partial;
        lodash.partialRight = partialRight;
        lodash.partition = partition;
        lodash.pick = pick;
        lodash.pluck = pluck;
        lodash.property = property;
        lodash.propertyOf = propertyOf;
        lodash.pull = pull;
        lodash.pullAt = pullAt;
        lodash.range = range;
        lodash.rearg = rearg;
        lodash.reject = reject;
        lodash.remove = remove;
        lodash.rest = rest;
        lodash.restParam = restParam;
        lodash.set = set;
        lodash.shuffle = shuffle;
        lodash.slice = slice;
        lodash.sortBy = sortBy;
        lodash.sortByAll = sortByAll;
        lodash.sortByOrder = sortByOrder;
        lodash.spread = spread;
        lodash.take = take;
        lodash.takeRight = takeRight;
        lodash.takeRightWhile = takeRightWhile;
        lodash.takeWhile = takeWhile;
        lodash.tap = tap;
        lodash.throttle = throttle;
        lodash.thru = thru;
        lodash.times = times;
        lodash.toArray = toArray;
        lodash.toPlainObject = toPlainObject;
        lodash.transform = transform;
        lodash.union = union;
        lodash.uniq = uniq;
        lodash.unzip = unzip;
        lodash.unzipWith = unzipWith;
        lodash.values = values;
        lodash.valuesIn = valuesIn;
        lodash.where = where;
        lodash.without = without;
        lodash.wrap = wrap;
        lodash.xor = xor;
        lodash.zip = zip;
        lodash.zipObject = zipObject;
        lodash.zipWith = zipWith;
        lodash.backflow = flowRight;
        lodash.collect = map;
        lodash.compose = flowRight;
        lodash.each = forEach;
        lodash.eachRight = forEachRight;
        lodash.extend = assign;
        lodash.iteratee = callback;
        lodash.methods = functions;
        lodash.object = zipObject;
        lodash.select = filter;
        lodash.tail = rest;
        lodash.unique = uniq;
        mixin(lodash, lodash);
        lodash.add = add;
        lodash.attempt = attempt;
        lodash.camelCase = camelCase;
        lodash.capitalize = capitalize;
        lodash.ceil = ceil;
        lodash.clone = clone;
        lodash.cloneDeep = cloneDeep;
        lodash.deburr = deburr;
        lodash.endsWith = endsWith;
        lodash.escape = escape;
        lodash.escapeRegExp = escapeRegExp;
        lodash.every = every;
        lodash.find = find;
        lodash.findIndex = findIndex;
        lodash.findKey = findKey;
        lodash.findLast = findLast;
        lodash.findLastIndex = findLastIndex;
        lodash.findLastKey = findLastKey;
        lodash.findWhere = findWhere;
        lodash.first = first;
        lodash.floor = floor;
        lodash.get = get;
        lodash.gt = gt;
        lodash.gte = gte;
        lodash.has = has;
        lodash.identity = identity;
        lodash.includes = includes;
        lodash.indexOf = indexOf;
        lodash.inRange = inRange;
        lodash.isArguments = isArguments;
        lodash.isArray = isArray;
        lodash.isBoolean = isBoolean;
        lodash.isDate = isDate;
        lodash.isElement = isElement;
        lodash.isEmpty = isEmpty;
        lodash.isEqual = isEqual;
        lodash.isError = isError;
        lodash.isFinite = isFinite;
        lodash.isFunction = isFunction;
        lodash.isMatch = isMatch;
        lodash.isNaN = isNaN;
        lodash.isNative = isNative;
        lodash.isNull = isNull;
        lodash.isNumber = isNumber;
        lodash.isObject = isObject;
        lodash.isPlainObject = isPlainObject;
        lodash.isRegExp = isRegExp;
        lodash.isString = isString;
        lodash.isTypedArray = isTypedArray;
        lodash.isUndefined = isUndefined;
        lodash.kebabCase = kebabCase;
        lodash.last = last;
        lodash.lastIndexOf = lastIndexOf;
        lodash.lt = lt;
        lodash.lte = lte;
        lodash.max = max;
        lodash.min = min;
        lodash.noConflict = noConflict;
        lodash.noop = noop;
        lodash.now = now;
        lodash.pad = pad;
        lodash.padLeft = padLeft;
        lodash.padRight = padRight;
        lodash.parseInt = parseInt;
        lodash.random = random;
        lodash.reduce = reduce;
        lodash.reduceRight = reduceRight;
        lodash.repeat = repeat;
        lodash.result = result;
        lodash.round = round;
        lodash.runInContext = runInContext;
        lodash.size = size;
        lodash.snakeCase = snakeCase;
        lodash.some = some;
        lodash.sortedIndex = sortedIndex;
        lodash.sortedLastIndex = sortedLastIndex;
        lodash.startCase = startCase;
        lodash.startsWith = startsWith;
        lodash.sum = sum;
        lodash.template = template;
        lodash.trim = trim;
        lodash.trimLeft = trimLeft;
        lodash.trimRight = trimRight;
        lodash.trunc = trunc;
        lodash.unescape = unescape;
        lodash.uniqueId = uniqueId;
        lodash.words = words;
        lodash.all = every;
        lodash.any = some;
        lodash.contains = includes;
        lodash.eq = isEqual;
        lodash.detect = find;
        lodash.foldl = reduce;
        lodash.foldr = reduceRight;
        lodash.head = first;
        lodash.include = includes;
        lodash.inject = reduce;
        mixin(lodash, (function() {
          var source = {};
          baseForOwn(lodash, function(func, methodName) {
            if (!lodash.prototype[methodName]) {
              source[methodName] = func;
            }
          });
          return source;
        }()), false);
        lodash.sample = sample;
        lodash.prototype.sample = function(n) {
          if (!this.__chain__ && n == null) {
            return sample(this.value());
          }
          return this.thru(function(value) {
            return sample(value, n);
          });
        };
        lodash.VERSION = VERSION;
        arrayEach(['bind', 'bindKey', 'curry', 'curryRight', 'partial', 'partialRight'], function(methodName) {
          lodash[methodName].placeholder = lodash;
        });
        arrayEach(['drop', 'take'], function(methodName, index) {
          LazyWrapper.prototype[methodName] = function(n) {
            var filtered = this.__filtered__;
            if (filtered && !index) {
              return new LazyWrapper(this);
            }
            n = n == null ? 1 : nativeMax(nativeFloor(n) || 0, 0);
            var result = this.clone();
            if (filtered) {
              result.__takeCount__ = nativeMin(result.__takeCount__, n);
            } else {
              result.__views__.push({
                'size': n,
                'type': methodName + (result.__dir__ < 0 ? 'Right' : '')
              });
            }
            return result;
          };
          LazyWrapper.prototype[methodName + 'Right'] = function(n) {
            return this.reverse()[methodName](n).reverse();
          };
        });
        arrayEach(['filter', 'map', 'takeWhile'], function(methodName, index) {
          var type = index + 1,
              isFilter = type != LAZY_MAP_FLAG;
          LazyWrapper.prototype[methodName] = function(iteratee, thisArg) {
            var result = this.clone();
            result.__iteratees__.push({
              'iteratee': getCallback(iteratee, thisArg, 1),
              'type': type
            });
            result.__filtered__ = result.__filtered__ || isFilter;
            return result;
          };
        });
        arrayEach(['first', 'last'], function(methodName, index) {
          var takeName = 'take' + (index ? 'Right' : '');
          LazyWrapper.prototype[methodName] = function() {
            return this[takeName](1).value()[0];
          };
        });
        arrayEach(['initial', 'rest'], function(methodName, index) {
          var dropName = 'drop' + (index ? '' : 'Right');
          LazyWrapper.prototype[methodName] = function() {
            return this.__filtered__ ? new LazyWrapper(this) : this[dropName](1);
          };
        });
        arrayEach(['pluck', 'where'], function(methodName, index) {
          var operationName = index ? 'filter' : 'map',
              createCallback = index ? baseMatches : property;
          LazyWrapper.prototype[methodName] = function(value) {
            return this[operationName](createCallback(value));
          };
        });
        LazyWrapper.prototype.compact = function() {
          return this.filter(identity);
        };
        LazyWrapper.prototype.reject = function(predicate, thisArg) {
          predicate = getCallback(predicate, thisArg, 1);
          return this.filter(function(value) {
            return !predicate(value);
          });
        };
        LazyWrapper.prototype.slice = function(start, end) {
          start = start == null ? 0 : (+start || 0);
          var result = this;
          if (result.__filtered__ && (start > 0 || end < 0)) {
            return new LazyWrapper(result);
          }
          if (start < 0) {
            result = result.takeRight(-start);
          } else if (start) {
            result = result.drop(start);
          }
          if (end !== undefined) {
            end = (+end || 0);
            result = end < 0 ? result.dropRight(-end) : result.take(end - start);
          }
          return result;
        };
        LazyWrapper.prototype.takeRightWhile = function(predicate, thisArg) {
          return this.reverse().takeWhile(predicate, thisArg).reverse();
        };
        LazyWrapper.prototype.toArray = function() {
          return this.take(POSITIVE_INFINITY);
        };
        baseForOwn(LazyWrapper.prototype, function(func, methodName) {
          var checkIteratee = /^(?:filter|map|reject)|While$/.test(methodName),
              retUnwrapped = /^(?:first|last)$/.test(methodName),
              lodashFunc = lodash[retUnwrapped ? ('take' + (methodName == 'last' ? 'Right' : '')) : methodName];
          if (!lodashFunc) {
            return;
          }
          lodash.prototype[methodName] = function() {
            var args = retUnwrapped ? [1] : arguments,
                chainAll = this.__chain__,
                value = this.__wrapped__,
                isHybrid = !!this.__actions__.length,
                isLazy = value instanceof LazyWrapper,
                iteratee = args[0],
                useLazy = isLazy || isArray(value);
            if (useLazy && checkIteratee && typeof iteratee == 'function' && iteratee.length != 1) {
              isLazy = useLazy = false;
            }
            var interceptor = function(value) {
              return (retUnwrapped && chainAll) ? lodashFunc(value, 1)[0] : lodashFunc.apply(undefined, arrayPush([value], args));
            };
            var action = {
              'func': thru,
              'args': [interceptor],
              'thisArg': undefined
            },
                onlyLazy = isLazy && !isHybrid;
            if (retUnwrapped && !chainAll) {
              if (onlyLazy) {
                value = value.clone();
                value.__actions__.push(action);
                return func.call(value);
              }
              return lodashFunc.call(undefined, this.value())[0];
            }
            if (!retUnwrapped && useLazy) {
              value = onlyLazy ? value : new LazyWrapper(this);
              var result = func.apply(value, args);
              result.__actions__.push(action);
              return new LodashWrapper(result, chainAll);
            }
            return this.thru(interceptor);
          };
        });
        arrayEach(['join', 'pop', 'push', 'replace', 'shift', 'sort', 'splice', 'split', 'unshift'], function(methodName) {
          var func = (/^(?:replace|split)$/.test(methodName) ? stringProto : arrayProto)[methodName],
              chainName = /^(?:push|sort|unshift)$/.test(methodName) ? 'tap' : 'thru',
              retUnwrapped = /^(?:join|pop|replace|shift)$/.test(methodName);
          lodash.prototype[methodName] = function() {
            var args = arguments;
            if (retUnwrapped && !this.__chain__) {
              return func.apply(this.value(), args);
            }
            return this[chainName](function(value) {
              return func.apply(value, args);
            });
          };
        });
        baseForOwn(LazyWrapper.prototype, function(func, methodName) {
          var lodashFunc = lodash[methodName];
          if (lodashFunc) {
            var key = lodashFunc.name,
                names = realNames[key] || (realNames[key] = []);
            names.push({
              'name': methodName,
              'func': lodashFunc
            });
          }
        });
        realNames[createHybridWrapper(undefined, BIND_KEY_FLAG).name] = [{
          'name': 'wrapper',
          'func': undefined
        }];
        LazyWrapper.prototype.clone = lazyClone;
        LazyWrapper.prototype.reverse = lazyReverse;
        LazyWrapper.prototype.value = lazyValue;
        lodash.prototype.chain = wrapperChain;
        lodash.prototype.commit = wrapperCommit;
        lodash.prototype.concat = wrapperConcat;
        lodash.prototype.plant = wrapperPlant;
        lodash.prototype.reverse = wrapperReverse;
        lodash.prototype.toString = wrapperToString;
        lodash.prototype.run = lodash.prototype.toJSON = lodash.prototype.valueOf = lodash.prototype.value = wrapperValue;
        lodash.prototype.collect = lodash.prototype.map;
        lodash.prototype.head = lodash.prototype.first;
        lodash.prototype.select = lodash.prototype.filter;
        lodash.prototype.tail = lodash.prototype.rest;
        return lodash;
      }
      var _ = runInContext();
      if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        root._ = _;
        define(function() {
          return _;
        });
      } else if (freeExports && freeModule) {
        if (moduleExports) {
          (freeModule.exports = _)._ = _;
        } else {
          freeExports._ = _;
        }
      } else {
        root._ = _;
      }
    }.call(this));
  })(require("github:jspm/nodelibs-process@0.1.1.js"));
  global.define = __define;
  return module.exports;
});

(function() {
var _removeDefine = System.get("@@amd-helpers").createDefine();
define("github:ijzerenhein/famous-flex@0.3.4/src/AnimationController.js", ["require", "exports", "module", "npm:famous@0.3.5/core/View.js", "github:ijzerenhein/famous-flex@0.3.4/src/LayoutController.js", "npm:famous@0.3.5/core/Transform.js", "npm:famous@0.3.5/core/Modifier.js", "npm:famous@0.3.5/modifiers/StateModifier.js", "npm:famous@0.3.5/core/RenderNode.js", "npm:famous@0.3.5/utilities/Timer.js", "npm:famous@0.3.5/transitions/Easing.js"], function(require, exports, module) {
  var View = require("npm:famous@0.3.5/core/View.js");
  var LayoutController = require("github:ijzerenhein/famous-flex@0.3.4/src/LayoutController.js");
  var Transform = require("npm:famous@0.3.5/core/Transform.js");
  var Modifier = require("npm:famous@0.3.5/core/Modifier.js");
  var StateModifier = require("npm:famous@0.3.5/modifiers/StateModifier.js");
  var RenderNode = require("npm:famous@0.3.5/core/RenderNode.js");
  var Timer = require("npm:famous@0.3.5/utilities/Timer.js");
  var Easing = require("npm:famous@0.3.5/transitions/Easing.js");
  function AnimationController(options) {
    View.apply(this, arguments);
    this._size = [0, 0];
    _createLayout.call(this);
    if (options) {
      this.setOptions(options);
    }
  }
  AnimationController.prototype = Object.create(View.prototype);
  AnimationController.prototype.constructor = AnimationController;
  AnimationController.Animation = {
    Slide: {
      Left: function(show, size) {
        return {transform: Transform.translate(show ? size[0] : -size[0], 0, 0)};
      },
      Right: function(show, size) {
        return {transform: Transform.translate(show ? -size[0] : size[0], 0, 0)};
      },
      Up: function(show, size) {
        return {transform: Transform.translate(0, show ? size[1] : -size[1], 0)};
      },
      Down: function(show, size) {
        return {transform: Transform.translate(0, show ? -size[1] : size[1], 0)};
      }
    },
    Fade: function(show, size) {
      return {opacity: (this && (this.opacity !== undefined)) ? this.opacity : 0};
    },
    Zoom: function(show, size) {
      var scale = (this && (this.scale !== undefined)) ? this.scale : 0.5;
      return {
        transform: Transform.scale(scale, scale, 1),
        align: [0.5, 0.5],
        origin: [0.5, 0.5]
      };
    },
    FadedZoom: function(show, size) {
      var scale = show ? ((this && (this.showScale !== undefined)) ? this.showScale : 0.9) : ((this && (this.hideScale !== undefined)) ? this.hideScale : 1.1);
      return {
        opacity: (this && (this.opacity !== undefined)) ? this.opacity : 0,
        transform: Transform.scale(scale, scale, 1),
        align: [0.5, 0.5],
        origin: [0.5, 0.5]
      };
    }
  };
  AnimationController.DEFAULT_OPTIONS = {
    transition: {
      duration: 400,
      curve: Easing.inOutQuad
    },
    animation: AnimationController.Animation.Fade,
    show: {},
    hide: {},
    transfer: {
      fastResize: true,
      zIndex: 10
    },
    zIndexOffset: 0
  };
  var ItemState = {
    NONE: 0,
    HIDE: 1,
    HIDING: 2,
    SHOW: 3,
    SHOWING: 4,
    VISIBLE: 5,
    QUEUED: 6
  };
  function ViewStackLayout(context, options) {
    var set = {
      size: context.size,
      translate: [0, 0, 0]
    };
    this._size[0] = context.size[0];
    this._size[1] = context.size[1];
    var views = context.get('views');
    var transferables = context.get('transferables');
    for (var i = 0; i < Math.min(views.length, 2); i++) {
      var item = this._viewStack[i];
      switch (item.state) {
        case ItemState.HIDE:
        case ItemState.HIDING:
        case ItemState.VISIBLE:
        case ItemState.SHOW:
        case ItemState.SHOWING:
          var view = views[i];
          context.set(view, set);
          for (var j = 0; j < transferables.length; j++) {
            for (var k = 0; k < item.transferables.length; k++) {
              if (transferables[j].renderNode === item.transferables[k].renderNode) {
                context.set(transferables[j], {
                  translate: [0, 0, set.translate[2]],
                  size: [context.size[0], context.size[1]]
                });
              }
            }
          }
          set.translate[2] += options.zIndexOffset;
          break;
      }
    }
  }
  function _createLayout() {
    this._renderables = {
      views: [],
      transferables: []
    };
    this._viewStack = [];
    this.layout = new LayoutController({
      layout: ViewStackLayout.bind(this),
      layoutOptions: this.options,
      dataSource: this._renderables
    });
    this.add(this.layout);
    this.layout.on('layoutend', _processAnimations.bind(this));
  }
  function _getViewSpec(item, view, id, callback) {
    if (!item.view) {
      return;
    }
    var spec = view.getSpec(id);
    if (spec && !spec.trueSizeRequested) {
      callback(spec);
    } else {
      Timer.after(_getViewSpec.bind(this, item, view, id, callback), 1);
    }
  }
  function _getTransferable(item, view, id) {
    if (view.getTransferable) {
      return view.getTransferable(id);
    }
    if (view.getSpec && view.get && view.replace) {
      if (view.get(id) !== undefined) {
        return {
          get: function() {
            return view.get(id);
          },
          show: function(renderable) {
            view.replace(id, renderable);
          },
          getSpec: _getViewSpec.bind(this, item, view, id)
        };
      }
    }
    if (view.layout) {
      return _getTransferable.call(this, item, view.layout, id);
    }
  }
  function _initTransferableAnimations(item, prevItem, callback) {
    var callbackCount = 0;
    function waitForAll() {
      callbackCount--;
      if (callbackCount === 0) {
        callback();
      }
    }
    for (var sourceId in item.options.transfer.items) {
      if (_initTransferableAnimation.call(this, item, prevItem, sourceId, waitForAll)) {
        callbackCount++;
      }
    }
    if (!callbackCount) {
      callback();
    }
  }
  function _initTransferableAnimation(item, prevItem, sourceId, callback) {
    var target = item.options.transfer.items[sourceId];
    var transferable = {};
    transferable.source = _getTransferable.call(this, prevItem, prevItem.view, sourceId);
    if (Array.isArray(target)) {
      for (var i = 0; i < target.length; i++) {
        transferable.target = _getTransferable.call(this, item, item.view, target[i]);
        if (transferable.target) {
          break;
        }
      }
    } else {
      transferable.target = _getTransferable.call(this, item, item.view, target);
    }
    if (transferable.source && transferable.target) {
      transferable.source.getSpec(function(sourceSpec) {
        transferable.sourceSpec = sourceSpec;
        transferable.originalSource = transferable.source.get();
        transferable.source.show(new RenderNode(new Modifier(sourceSpec)));
        transferable.originalTarget = transferable.target.get();
        var targetNode = new RenderNode(new Modifier({opacity: 0}));
        targetNode.add(transferable.originalTarget);
        transferable.target.show(targetNode);
        var zIndexMod = new Modifier({transform: Transform.translate(0, 0, item.options.transfer.zIndex)});
        transferable.mod = new StateModifier(sourceSpec);
        transferable.renderNode = new RenderNode(zIndexMod);
        transferable.renderNode.add(transferable.mod).add(transferable.originalSource);
        item.transferables.push(transferable);
        this._renderables.transferables.push(transferable.renderNode);
        this.layout.reflowLayout();
        Timer.after(function() {
          var callbackCalled;
          transferable.target.getSpec(function(targetSpec, transition) {
            transferable.targetSpec = targetSpec;
            transferable.transition = transition;
            if (!callbackCalled) {
              callback();
            }
          }, true);
        }, 1);
      }.bind(this), false);
      return true;
    } else {
      return false;
    }
  }
  function _startTransferableAnimations(item, callback) {
    for (var j = 0; j < item.transferables.length; j++) {
      var transferable = item.transferables[j];
      transferable.mod.halt();
      if ((transferable.sourceSpec.opacity !== undefined) || (transferable.targetSpec.opacity !== undefined)) {
        transferable.mod.setOpacity((transferable.targetSpec.opacity === undefined) ? 1 : transferable.targetSpec.opacity, transferable.transition || item.options.transfer.transition);
      }
      if (item.options.transfer.fastResize) {
        if (transferable.sourceSpec.transform || transferable.targetSpec.transform || transferable.sourceSpec.size || transferable.targetSpec.size) {
          var transform = transferable.targetSpec.transform || Transform.identity;
          if (transferable.sourceSpec.size && transferable.targetSpec.size) {
            transform = Transform.multiply(transform, Transform.scale(transferable.targetSpec.size[0] / transferable.sourceSpec.size[0], transferable.targetSpec.size[1] / transferable.sourceSpec.size[1], 1));
          }
          transferable.mod.setTransform(transform, transferable.transition || item.options.transfer.transition, callback);
          callback = undefined;
        }
      } else {
        if (transferable.sourceSpec.transform || transferable.targetSpec.transform) {
          transferable.mod.setTransform(transferable.targetSpec.transform || Transform.identity, transferable.transition || item.options.transfer.transition, callback);
          callback = undefined;
        }
        if (transferable.sourceSpec.size || transferable.targetSpec.size) {
          transferable.mod.setSize(transferable.targetSpec.size || transferable.sourceSpec.size, transferable.transition || item.options.transfer.transition, callback);
          callback = undefined;
        }
      }
    }
    if (callback) {
      callback();
    }
  }
  function _endTransferableAnimations(item) {
    for (var j = 0; j < item.transferables.length; j++) {
      var transferable = item.transferables[j];
      for (var i = 0; i < this._renderables.transferables.length; i++) {
        if (this._renderables.transferables[i] === transferable.renderNode) {
          this._renderables.transferables.splice(i, 1);
          break;
        }
      }
      transferable.source.show(transferable.originalSource);
      transferable.target.show(transferable.originalTarget);
    }
    item.transferables = [];
    this.layout.reflowLayout();
  }
  function _processAnimations(event) {
    var prevItem;
    for (var i = 0; i < this._viewStack.length; i++) {
      var item = this._viewStack[i];
      switch (item.state) {
        case ItemState.HIDE:
          item.state = ItemState.HIDING;
          _startHideAnimation.call(this, item, prevItem, event.size);
          _updateState.call(this);
          break;
        case ItemState.SHOW:
          item.state = ItemState.SHOWING;
          _initShowAnimation.call(this, item, prevItem, event.size);
          _updateState.call(this);
          break;
      }
      prevItem = item;
    }
  }
  function _initShowAnimation(item, prevItem, size) {
    var spec = item.options.show.animation ? item.options.show.animation.call(undefined, true, size) : {};
    item.startSpec = spec;
    item.endSpec = {
      opacity: 1,
      transform: Transform.identity
    };
    item.mod.halt();
    if (spec.transform) {
      item.mod.setTransform(spec.transform);
    }
    if (spec.opacity !== undefined) {
      item.mod.setOpacity(spec.opacity);
    }
    if (spec.align) {
      item.mod.setAlign(spec.align);
    }
    if (spec.origin) {
      item.mod.setOrigin(spec.origin);
    }
    if (prevItem) {
      _initTransferableAnimations.call(this, item, prevItem, _startShowAnimation.bind(this, item, spec));
    } else {
      _startShowAnimation.call(this, item, spec);
    }
  }
  function _startShowAnimation(item, spec) {
    if (!item.halted) {
      var callback = item.showCallback;
      if (spec.transform) {
        item.mod.setTransform(Transform.identity, item.options.show.transition, callback);
        callback = undefined;
      }
      if (spec.opacity !== undefined) {
        item.mod.setOpacity(1, item.options.show.transition, callback);
        callback = undefined;
      }
      _startTransferableAnimations.call(this, item, callback);
    }
  }
  function _interpolate(start, end, perc) {
    return start + ((end - start) * perc);
  }
  function _haltItemAtFrame(item, perc) {
    item.mod.halt();
    item.halted = true;
    if (item.startSpec && (perc !== undefined)) {
      if ((item.startSpec.opacity !== undefined) && (item.endSpec.opacity !== undefined)) {
        item.mod.setOpacity(_interpolate(item.startSpec.opacity, item.endSpec.opacity, perc));
      }
      if (item.startSpec.transform && item.endSpec.transform) {
        var transform = [];
        for (var i = 0; i < item.startSpec.transform.length; i++) {
          transform.push(_interpolate(item.startSpec.transform[i], item.endSpec.transform[i], perc));
        }
        item.mod.setTransform(transform);
      }
    }
  }
  function _startHideAnimation(item, prevItem, size) {
    var spec = item.options.hide.animation ? item.options.hide.animation.call(undefined, false, size) : {};
    item.endSpec = spec;
    item.startSpec = {
      opacity: 1,
      transform: Transform.identity
    };
    if (!item.halted) {
      item.mod.halt();
      var callback = item.hideCallback;
      if (spec.transform) {
        item.mod.setTransform(spec.transform, item.options.hide.transition, callback);
        callback = undefined;
      }
      if (spec.opacity !== undefined) {
        item.mod.setOpacity(spec.opacity, item.options.hide.transition, callback);
        callback = undefined;
      }
      if (callback) {
        callback();
      }
    }
  }
  function _setItemOptions(item, options, callback) {
    item.options = {
      show: {
        transition: this.options.show.transition || this.options.transition,
        animation: this.options.show.animation || this.options.animation
      },
      hide: {
        transition: this.options.hide.transition || this.options.transition,
        animation: this.options.hide.animation || this.options.animation
      },
      transfer: {
        transition: this.options.transfer.transition || this.options.transition,
        items: this.options.transfer.items || {},
        zIndex: this.options.transfer.zIndex,
        fastResize: this.options.transfer.fastResize
      }
    };
    if (options) {
      item.options.show.transition = (options.show ? options.show.transition : undefined) || options.transition || item.options.show.transition;
      if (options && options.show && (options.show.animation !== undefined)) {
        item.options.show.animation = options.show.animation;
      } else if (options && (options.animation !== undefined)) {
        item.options.show.animation = options.animation;
      }
      item.options.transfer.transition = (options.transfer ? options.transfer.transition : undefined) || options.transition || item.options.transfer.transition;
      item.options.transfer.items = (options.transfer ? options.transfer.items : undefined) || item.options.transfer.items;
      item.options.transfer.zIndex = (options.transfer && (options.transfer.zIndex !== undefined)) ? options.transfer.zIndex : item.options.transfer.zIndex;
      item.options.transfer.fastResize = (options.transfer && (options.transfer.fastResize !== undefined)) ? options.transfer.fastResize : item.options.transfer.fastResize;
    }
    item.showCallback = function() {
      item.showCallback = undefined;
      item.state = ItemState.VISIBLE;
      _updateState.call(this);
      _endTransferableAnimations.call(this, item);
      item.endSpec = undefined;
      item.startSpec = undefined;
      if (callback) {
        callback();
      }
    }.bind(this);
  }
  function _updateState() {
    var prevItem;
    var invalidated = false;
    for (var i = 0; i < Math.min(this._viewStack.length, 2); i++) {
      var item = this._viewStack[i];
      if (item.state === ItemState.QUEUED) {
        if (!prevItem || (prevItem.state === ItemState.VISIBLE) || (prevItem.state === ItemState.HIDING)) {
          if (prevItem && (prevItem.state === ItemState.VISIBLE)) {
            prevItem.state = ItemState.HIDE;
          }
          item.state = ItemState.SHOW;
          invalidated = true;
        }
        break;
      } else if ((item.state === ItemState.VISIBLE) && item.hide) {
        item.state = ItemState.HIDE;
      }
      if ((item.state === ItemState.SHOW) || (item.state === ItemState.HIDE)) {
        this.layout.reflowLayout();
      }
      prevItem = item;
    }
    if (invalidated) {
      _updateState.call(this);
      this.layout.reflowLayout();
    }
  }
  function _resume() {
    for (var i = 0; i < Math.min(this._viewStack.length, 2); i++) {
      var item = this._viewStack[i];
      if (item.halted) {
        item.halted = false;
        if (item.endSpec) {
          var callback;
          switch (item.state) {
            case ItemState.HIDE:
            case ItemState.HIDING:
              callback = item.hideCallback;
              break;
            case ItemState.SHOW:
            case ItemState.SHOWING:
              callback = item.showCallback;
              break;
          }
          item.mod.halt();
          if (item.endSpec.transform) {
            item.mod.setTransform(item.endSpec.transform, item.options.show.transition, callback);
            callback = undefined;
          }
          if (item.endSpec.opacity !== undefined) {
            item.mod.setOpacity(item.endSpec.opacity, item.options.show.transition, callback);
          }
          if (callback) {
            callback();
          }
        }
      }
    }
  }
  AnimationController.prototype.show = function(renderable, options, callback) {
    _resume.call(this, renderable);
    if (!renderable) {
      return this.hide(options, callback);
    }
    var item = this._viewStack.length ? this._viewStack[this._viewStack.length - 1] : undefined;
    if (item && (item.view === renderable)) {
      item.hide = false;
      if (item.state === ItemState.HIDE) {
        item.state = ItemState.QUEUED;
        _setItemOptions.call(this, item, options, callback);
        _updateState.call(this);
      } else if (callback) {
        callback();
      }
      return this;
    }
    if (item && (item.state !== ItemState.HIDING) && options) {
      item.options.hide.transition = (options.hide ? options.hide.transition : undefined) || options.transition || item.options.hide.transition;
      if (options && options.hide && (options.hide.animation !== undefined)) {
        item.options.hide.animation = options.hide.animation;
      } else if (options && (options.animation !== undefined)) {
        item.options.hide.animation = options.animation;
      }
    }
    item = {
      view: renderable,
      mod: new StateModifier(),
      state: ItemState.QUEUED,
      callback: callback,
      transferables: []
    };
    item.node = new RenderNode(item.mod);
    item.node.add(renderable);
    _setItemOptions.call(this, item, options, callback);
    item.hideCallback = function() {
      item.hideCallback = undefined;
      var index = this._viewStack.indexOf(item);
      this._renderables.views.splice(index, 1);
      this._viewStack.splice(index, 1);
      item.view = undefined;
      _updateState.call(this);
      this.layout.reflowLayout();
    }.bind(this);
    this._renderables.views.push(item.node);
    this._viewStack.push(item);
    _updateState.call(this);
    return this;
  };
  AnimationController.prototype.hide = function(options, callback) {
    _resume.call(this);
    var item = this._viewStack.length ? this._viewStack[this._viewStack.length - 1] : undefined;
    if (!item || (item.state === ItemState.HIDING)) {
      return this;
    }
    item.hide = true;
    if (options) {
      item.options.hide.transition = (options.hide ? options.hide.transition : undefined) || options.transition || item.options.hide.transition;
      if (options && options.hide && (options.hide.animation !== undefined)) {
        item.options.hide.animation = options.hide.animation;
      } else if (options && (options.animation !== undefined)) {
        item.options.hide.animation = options.animation;
      }
    }
    item.hideCallback = function() {
      item.hideCallback = undefined;
      var index = this._viewStack.indexOf(item);
      this._renderables.views.splice(index, 1);
      this._viewStack.splice(index, 1);
      item.view = undefined;
      _updateState.call(this);
      this.layout.reflowLayout();
      if (callback) {
        callback();
      }
    }.bind(this);
    _updateState.call(this);
    return this;
  };
  AnimationController.prototype.halt = function(stopAnimation, framePerc) {
    var item;
    for (var i = 0; i < this._viewStack.length; i++) {
      if (stopAnimation) {
        item = this._viewStack[i];
        switch (item.state) {
          case ItemState.SHOW:
          case ItemState.SHOWING:
          case ItemState.HIDE:
          case ItemState.HIDING:
          case ItemState.VISIBLE:
            _haltItemAtFrame(item, framePerc);
            break;
        }
      } else {
        item = this._viewStack[this._viewStack.length - 1];
        if ((item.state === ItemState.QUEUED) || (item.state === ItemState.SHOW)) {
          this._renderables.views.splice(this._viewStack.length - 1, 1);
          this._viewStack.splice(this._viewStack.length - 1, 1);
          item.view = undefined;
        } else {
          break;
        }
      }
    }
    return this;
  };
  AnimationController.prototype.abort = function(callback) {
    if ((this._viewStack.length >= 2) && (this._viewStack[0].state === ItemState.HIDING) && (this._viewStack[1].state === ItemState.SHOWING)) {
      var prevItem = this._viewStack[0];
      var item = this._viewStack[1];
      var swapSpec;
      item.halted = true;
      swapSpec = item.endSpec;
      item.endSpec = item.startSpec;
      item.startSpec = swapSpec;
      item.state = ItemState.HIDING;
      item.hideCallback = function() {
        item.hideCallback = undefined;
        var index = this._viewStack.indexOf(item);
        this._renderables.views.splice(index, 1);
        this._viewStack.splice(index, 1);
        item.view = undefined;
        _updateState.call(this);
        this.layout.reflowLayout();
      }.bind(this);
      prevItem.halted = true;
      swapSpec = prevItem.endSpec;
      prevItem.endSpec = prevItem.startSpec;
      prevItem.startSpec = swapSpec;
      prevItem.state = ItemState.SHOWING;
      prevItem.showCallback = function() {
        prevItem.showCallback = undefined;
        prevItem.state = ItemState.VISIBLE;
        _updateState.call(this);
        _endTransferableAnimations.call(this, prevItem);
        prevItem.endSpec = undefined;
        prevItem.startSpec = undefined;
        if (callback) {
          callback();
        }
      }.bind(this);
      _resume.call(this);
    }
    return this;
  };
  AnimationController.prototype.get = function() {
    for (var i = 0; i < this._viewStack.length; i++) {
      var item = this._viewStack[i];
      if ((item.state === ItemState.VISIBLE) || (item.state === ItemState.SHOW) || (item.state === ItemState.SHOWING)) {
        return item.view;
      }
    }
    return undefined;
  };
  AnimationController.prototype.getSize = function() {
    return this._size || this.options.size;
  };
  module.exports = AnimationController;
});

_removeDefine();
})();
System.registerDynamic("npm:lodash@3.10.0.js", ["npm:lodash@3.10.0/index.js"], true, function(require, exports, module) {
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:lodash@3.10.0/index.js");
  global.define = __define;
  return module.exports;
});

System.register("github:Bizboard/di.js@master/util.js", [], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/di.js@master/util.js";
  var ownKeys;
  function isUpperCase(char) {
    return char.toUpperCase() === char;
  }
  function isFunction(value) {
    return typeof value === 'function';
  }
  function isObject(value) {
    return typeof value === 'object';
  }
  function toString(token) {
    if (typeof token === 'string') {
      return token;
    }
    if (token === undefined || token === null) {
      return '' + token;
    }
    if (token.name) {
      return token.name;
    }
    return token.toString();
  }
  return {
    setters: [],
    execute: function() {
      ownKeys = (this && this.Reflect && Reflect.ownKeys ? Reflect.ownKeys : function ownKeys(O) {
        var keys = Object.getOwnPropertyNames(O);
        if (Object.getOwnPropertySymbols)
          return keys.concat(Object.getOwnPropertySymbols(O));
        return keys;
      });
      $__export("isUpperCase", isUpperCase), $__export("isFunction", isFunction), $__export("isObject", isObject), $__export("toString", toString), $__export("ownKeys", ownKeys);
    }
  };
});

System.register("github:Bizboard/di.js@master/profiler.js", ["github:Bizboard/di.js@master/util.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/di.js@master/profiler.js";
  var toString,
      IS_DEBUG,
      _global,
      globalCounter;
  function getUniqueId() {
    return ++globalCounter;
  }
  function serializeToken(token, tokens) {
    if (!tokens.has(token)) {
      tokens.set(token, getUniqueId().toString());
    }
    return tokens.get(token);
  }
  function serializeProvider(provider, key, tokens) {
    return {
      id: serializeToken(key, tokens),
      name: toString(key),
      isPromise: provider.isPromise,
      dependencies: provider.params.map(function(param) {
        return {
          token: serializeToken(param.token, tokens),
          isPromise: param.isPromise,
          isLazy: param.isLazy
        };
      })
    };
  }
  function serializeInjector(injector, tokens, Injector) {
    var serializedInjector = {
      id: serializeToken(injector, tokens),
      parent_id: injector._parent ? serializeToken(injector._parent, tokens) : null,
      providers: {}
    };
    var injectorClassId = serializeToken(Injector, tokens);
    serializedInjector.providers[injectorClassId] = {
      id: injectorClassId,
      name: toString(Injector),
      isPromise: false,
      dependencies: []
    };
    injector._providers.forEach(function(provider, key) {
      var serializedProvider = serializeProvider(provider, key, tokens);
      serializedInjector.providers[serializedProvider.id] = serializedProvider;
    });
    return serializedInjector;
  }
  function profileInjector(injector, Injector) {
    if (!IS_DEBUG) {
      return;
    }
    if (!_global.__di_dump__) {
      _global.__di_dump__ = {
        injectors: [],
        tokens: new Map()
      };
    }
    _global.__di_dump__.injectors.push(serializeInjector(injector, _global.__di_dump__.tokens, Injector));
  }
  $__export("profileInjector", profileInjector);
  return {
    setters: [function($__m) {
      toString = $__m.toString;
    }],
    execute: function() {
      IS_DEBUG = false;
      _global = null;
      if (typeof process === 'object' && process.env) {
        IS_DEBUG = !!process.env['DEBUG'];
        _global = global;
      } else if (typeof location === 'object' && location.search) {
        IS_DEBUG = /di_debug/.test(location.search);
        _global = window;
      }
      globalCounter = 0;
    }
  };
});

System.register("github:Bizboard/di.js@master/providers.js", ["github:Bizboard/di.js@master/annotations.js", "github:Bizboard/di.js@master/util.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/di.js@master/providers.js";
  var ClassProviderAnnotation,
      FactoryProviderAnnotation,
      SuperConstructorAnnotation,
      readAnnotations,
      hasAnnotation,
      isFunction,
      isObject,
      toString,
      isUpperCase,
      ownKeys,
      EmptyFunction,
      ClassProvider,
      FactoryProvider;
  function isClass(clsOrFunction) {
    if (hasAnnotation(clsOrFunction, ClassProviderAnnotation)) {
      return true;
    } else if (hasAnnotation(clsOrFunction, FactoryProviderAnnotation)) {
      return false;
    } else if (clsOrFunction.name) {
      return isUpperCase(clsOrFunction.name.charAt(0));
    } else {
      return ownKeys(clsOrFunction.prototype).length > 0;
    }
  }
  function createProviderFromFnOrClass(fnOrClass, annotations) {
    if (isClass(fnOrClass)) {
      return new ClassProvider(fnOrClass, annotations.params, annotations.provide.isPromise);
    }
    return new FactoryProvider(fnOrClass, annotations.params, annotations.provide.isPromise);
  }
  $__export("createProviderFromFnOrClass", createProviderFromFnOrClass);
  return {
    setters: [function($__m) {
      ClassProviderAnnotation = $__m.ClassProvider;
      FactoryProviderAnnotation = $__m.FactoryProvider;
      SuperConstructorAnnotation = $__m.SuperConstructor;
      readAnnotations = $__m.readAnnotations;
      hasAnnotation = $__m.hasAnnotation;
    }, function($__m) {
      isFunction = $__m.isFunction;
      isObject = $__m.isObject;
      toString = $__m.toString;
      isUpperCase = $__m.isUpperCase;
      ownKeys = $__m.ownKeys;
    }],
    execute: function() {
      EmptyFunction = Object.getPrototypeOf(Function);
      ClassProvider = function() {
        function ClassProvider(clazz, params, isPromise) {
          this.provider = clazz;
          this.isPromise = isPromise;
          this.params = [];
          this._constructors = [];
          this._flattenParams(clazz, params);
          this._constructors.unshift([clazz, 0, this.params.length - 1]);
        }
        return ($traceurRuntime.createClass)(ClassProvider, {
          _flattenParams: function(constructor, params) {
            var SuperConstructor;
            var constructorInfo;
            var $__4 = true;
            var $__5 = false;
            var $__6 = undefined;
            try {
              for (var $__2 = void 0,
                  $__1 = (params)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
                var param = $__2.value;
                {
                  if (param.token === SuperConstructorAnnotation) {
                    SuperConstructor = Object.getPrototypeOf(constructor);
                    if (SuperConstructor === EmptyFunction) {
                      throw new Error((toString(constructor) + " does not have a parent constructor. Only classes with a parent can ask for SuperConstructor!"));
                    }
                    constructorInfo = [SuperConstructor, this.params.length];
                    this._constructors.push(constructorInfo);
                    this._flattenParams(SuperConstructor, readAnnotations(SuperConstructor).params);
                    constructorInfo.push(this.params.length - 1);
                  } else {
                    this.params.push(param);
                  }
                }
              }
            } catch ($__7) {
              $__5 = true;
              $__6 = $__7;
            } finally {
              try {
                if (!$__4 && $__1.return != null) {
                  $__1.return();
                }
              } finally {
                if ($__5) {
                  throw $__6;
                }
              }
            }
          },
          _createConstructor: function(currentConstructorIdx, context, allArguments) {
            var constructorInfo = this._constructors[currentConstructorIdx];
            var nextConstructorInfo = this._constructors[currentConstructorIdx + 1];
            var argsForCurrentConstructor;
            if (nextConstructorInfo) {
              argsForCurrentConstructor = allArguments.slice(constructorInfo[1], nextConstructorInfo[1]).concat([this._createConstructor(currentConstructorIdx + 1, context, allArguments)]).concat(allArguments.slice(nextConstructorInfo[2] + 1, constructorInfo[2] + 1));
            } else {
              argsForCurrentConstructor = allArguments.slice(constructorInfo[1], constructorInfo[2] + 1);
            }
            return function InjectedAndBoundSuperConstructor() {
              return constructorInfo[0].apply(context, argsForCurrentConstructor);
            };
          },
          create: function(args) {
            var context = Object.create(this.provider.prototype);
            var constructor = this._createConstructor(0, context, args);
            var returnedValue = constructor();
            if (isFunction(returnedValue) || isObject(returnedValue)) {
              return returnedValue;
            }
            return context;
          }
        }, {});
      }();
      FactoryProvider = function() {
        function FactoryProvider(factoryFunction, params, isPromise) {
          this.provider = factoryFunction;
          this.params = params;
          this.isPromise = isPromise;
          var $__4 = true;
          var $__5 = false;
          var $__6 = undefined;
          try {
            for (var $__2 = void 0,
                $__1 = (params)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
              var param = $__2.value;
              {
                if (param.token === SuperConstructorAnnotation) {
                  throw new Error((toString(factoryFunction) + " is not a class. Only classes with a parent can ask for SuperConstructor!"));
                }
              }
            }
          } catch ($__7) {
            $__5 = true;
            $__6 = $__7;
          } finally {
            try {
              if (!$__4 && $__1.return != null) {
                $__1.return();
              }
            } finally {
              if ($__5) {
                throw $__6;
              }
            }
          }
        }
        return ($traceurRuntime.createClass)(FactoryProvider, {create: function(args) {
            return this.provider.apply(undefined, args);
          }}, {});
      }();
    }
  };
});

System.register("github:Bizboard/arva-utils@1.0.0-beta-1/ObjectHelper.js", ["npm:lodash@3.10.0.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/arva-utils@1.0.0-beta-1/ObjectHelper.js";
  var _,
      ObjectHelper;
  return {
    setters: [function($__m) {
      _ = $__m.default;
    }],
    execute: function() {
      ObjectHelper = function() {
        function ObjectHelper() {}
        return ($traceurRuntime.createClass)(ObjectHelper, {}, {
          hideMethodsAndPrivatePropertiesFromObject: function(object) {
            for (var propName in object) {
              var prototype = Object.getPrototypeOf(object);
              var descriptor = prototype ? Object.getOwnPropertyDescriptor(prototype, propName) : undefined;
              if (descriptor && (descriptor.get || descriptor.set) && !propName.startsWith('_')) {
                continue;
              }
              var property = object[propName];
              if (typeof property === 'function' || propName.startsWith('_')) {
                ObjectHelper.hidePropertyFromObject(object, propName);
              }
            }
          },
          hideMethodsFromObject: function(object) {
            for (var propName in object) {
              var property = object[propName];
              if (typeof property === 'function') {
                ObjectHelper.hidePropertyFromObject(object, propName);
              }
            }
          },
          hidePropertyFromObject: function(object, propName) {
            var prototype = object;
            var descriptor = Object.getOwnPropertyDescriptor(object, propName);
            while (!descriptor) {
              prototype = Object.getPrototypeOf(prototype);
              if (prototype.constructor.name === 'Object' || prototype.constructor.name === 'Array') {
                return;
              }
              descriptor = Object.getOwnPropertyDescriptor(prototype, propName);
            }
            descriptor.enumerable = false;
            Object.defineProperty(prototype, propName, descriptor);
            Object.defineProperty(object, propName, descriptor);
          },
          hideAllPropertiesFromObject: function(object) {
            for (var propName in object) {
              ObjectHelper.hidePropertyFromObject(object, propName);
            }
          },
          addHiddenPropertyToObject: function(object, propName, prop) {
            var writable = arguments[3] !== (void 0) ? arguments[3] : true;
            var useAccessors = arguments[4] !== (void 0) ? arguments[4] : true;
            return ObjectHelper.addPropertyToObject(object, propName, prop, false, writable, undefined, useAccessors);
          },
          addPropertyToObject: function(object, propName, prop) {
            var enumerable = arguments[3] !== (void 0) ? arguments[3] : true;
            var writable = arguments[4] !== (void 0) ? arguments[4] : true;
            var setCallback = arguments[5] !== (void 0) ? arguments[5] : null;
            var useAccessors = arguments[6] !== (void 0) ? arguments[6] : true;
            if (!writable || !useAccessors) {
              var descriptor = {
                enumerable: enumerable,
                writable: writable,
                value: prop
              };
              Object.defineProperty(object, propName, descriptor);
            } else {
              ObjectHelper.addGetSetPropertyWithShadow(object, propName, prop, enumerable, writable, setCallback);
            }
          },
          addGetSetPropertyWithShadow: function(object, propName, prop) {
            var enumerable = arguments[3] !== (void 0) ? arguments[3] : true;
            var writable = arguments[4] !== (void 0) ? arguments[4] : true;
            var setCallback = arguments[5] !== (void 0) ? arguments[5] : null;
            ObjectHelper.buildPropertyShadow(object, propName, prop);
            ObjectHelper.buildGetSetProperty(object, propName, enumerable, writable, setCallback);
          },
          buildPropertyShadow: function(object, propName, prop) {
            var shadow = {};
            try {
              if ('shadow' in object) {
                shadow = object.shadow;
              }
            } catch (error) {
              return;
            }
            shadow[propName] = prop;
            Object.defineProperty(object, 'shadow', {
              writable: true,
              configurable: true,
              enumerable: false,
              value: shadow
            });
          },
          buildGetSetProperty: function(object, propName) {
            var enumerable = arguments[2] !== (void 0) ? arguments[2] : true;
            var writable = arguments[3] !== (void 0) ? arguments[3] : true;
            var setCallback = arguments[4] !== (void 0) ? arguments[4] : null;
            var descriptor = {
              enumerable: enumerable,
              configurable: true,
              get: function() {
                return object.shadow[propName];
              },
              set: function(value) {
                if (writable) {
                  object.shadow[propName] = value;
                  if (setCallback && typeof setCallback === 'function') {
                    setCallback({
                      propertyName: propName,
                      newValue: value
                    });
                  }
                } else {
                  throw new ReferenceError('Attempted to write to non-writable property ' + propName + '.');
                }
              }
            };
            Object.defineProperty(object, propName, descriptor);
          },
          bindAllMethods: function(object, bindTarget) {
            var methodNames = ObjectHelper.getMethodNames(object);
            methodNames.forEach(function(name) {
              object[name] = object[name].bind(bindTarget);
            });
          },
          getMethodNames: function(object) {
            var methodNames = arguments[1] !== (void 0) ? arguments[1] : [];
            var propNames = Object.getOwnPropertyNames(object).filter(function(c) {
              return typeof object[c] === 'function';
            });
            methodNames = methodNames.concat(propNames);
            var prototype = Object.getPrototypeOf(object);
            if (prototype.constructor.name !== 'Object' && prototype.constructor.name !== 'Array') {
              return ObjectHelper.getMethodNames(prototype, methodNames);
            }
            return methodNames;
          },
          getEnumerableProperties: function(object) {
            return ObjectHelper.getPrototypeEnumerableProperties(object, object);
          },
          getPrototypeEnumerableProperties: function(rootObject, prototype) {
            var result = {};
            var propNames = Object.keys(prototype);
            var $__4 = true;
            var $__5 = false;
            var $__6 = undefined;
            try {
              for (var $__2 = void 0,
                  $__1 = (propNames.values())[$traceurRuntime.toProperty(Symbol.iterator)](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
                var name = $__2.value;
                {
                  var value = rootObject[name];
                  if (value !== null && value !== undefined && typeof value !== 'function') {
                    if (typeof value === 'object' && !(value instanceof Array)) {
                      result[name] = ObjectHelper.getEnumerableProperties(value);
                    } else {
                      result[name] = value;
                    }
                  }
                }
              }
            } catch ($__7) {
              $__5 = true;
              $__6 = $__7;
            } finally {
              try {
                if (!$__4 && $__1.return != null) {
                  $__1.return();
                }
              } finally {
                if ($__5) {
                  throw $__6;
                }
              }
            }
            var descriptorNames = Object.getOwnPropertyNames(prototype);
            descriptorNames = descriptorNames.filter(function(name) {
              return propNames.indexOf(name) < 0;
            });
            var $__11 = true;
            var $__12 = false;
            var $__13 = undefined;
            try {
              for (var $__9 = void 0,
                  $__8 = (descriptorNames.values())[$traceurRuntime.toProperty(Symbol.iterator)](); !($__11 = ($__9 = $__8.next()).done); $__11 = true) {
                var name$__15 = $__9.value;
                {
                  var descriptor = Object.getOwnPropertyDescriptor(prototype, name$__15);
                  if (descriptor && descriptor.enumerable) {
                    var value$__16 = rootObject[name$__15];
                    if (value$__16 !== null && value$__16 !== undefined && typeof value$__16 !== 'function') {
                      if (typeof value$__16 === 'object' && !(value$__16 instanceof Array)) {
                        result[name$__15] = ObjectHelper.getEnumerableProperties(value$__16);
                      } else {
                        result[name$__15] = value$__16;
                      }
                    }
                  }
                }
              }
            } catch ($__14) {
              $__12 = true;
              $__13 = $__14;
            } finally {
              try {
                if (!$__11 && $__8.return != null) {
                  $__8.return();
                }
              } finally {
                if ($__12) {
                  throw $__13;
                }
              }
            }
            var superPrototype = Object.getPrototypeOf(prototype);
            var ignorableTypes = ['Object', 'Array', 'EventEmitter'];
            if (ignorableTypes.indexOf(superPrototype.constructor.name) === -1) {
              var prototypeEnumerables = ObjectHelper.getPrototypeEnumerableProperties(rootObject, superPrototype);
              _.merge(result, prototypeEnumerables);
            }
            return result;
          }
        });
      }();
      $__export("ObjectHelper", ObjectHelper);
    }
  };
});

System.register("github:Bizboard/arva-utils@1.0.0-beta-1/Context.js", ["github:Bizboard/di.js@master.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/arva-utils@1.0.0-beta-1/Context.js";
  var Injector,
      contextContainer,
      Context;
  return {
    setters: [function($__m) {
      Injector = $__m.Injector;
    }],
    execute: function() {
      contextContainer = {};
      Context = function() {
        function Context() {}
        return ($traceurRuntime.createClass)(Context, {}, {
          getContext: function() {
            var contextName = arguments[0] !== (void 0) ? arguments[0] : 'Default';
            return contextContainer[contextName];
          },
          setContext: function() {
            var context = arguments[0] !== (void 0) ? arguments[0] : {};
            var contextName = arguments[1] !== (void 0) ? arguments[1] : 'Default';
            contextContainer[contextName] = context;
          },
          buildContext: function() {
            var dependencies = arguments[0] !== (void 0) ? arguments[0] : [];
            var contextName = arguments[1] !== (void 0) ? arguments[1] : 'Default';
            Context.setContext(new Injector(dependencies));
          }
        });
      }();
      $__export("Context", Context);
    }
  };
});

System.register("github:Bizboard/arva-ds@1.0.0-beta-1/core/DataSource.js", [], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/arva-ds@1.0.0-beta-1/core/DataSource.js";
  var DataSource;
  return {
    setters: [],
    execute: function() {
      DataSource = function() {
        function DataSource(path) {
          this._dataReference = null;
        }
        return ($traceurRuntime.createClass)(DataSource, {
          get inheritable() {
            return false;
          },
          toString: function() {},
          child: function(childName) {
            var options = arguments[1] !== (void 0) ? arguments[1] : null;
          },
          path: function() {},
          key: function() {},
          set: function(newData) {},
          remove: function() {},
          push: function(newData) {},
          setWithPriority: function(newData, priority) {},
          setPriority: function(newPriority) {},
          limitToFirst: function(amount) {},
          limitToLast: function(amount) {},
          authWithOAuthToken: function(provider, credentials, onComplete, options) {},
          authWithCustomToken: function(authToken, onComplete, options) {},
          authWithPassword: function(credentials, onComplete, options) {},
          authAnonymously: function(onComplete, options) {},
          getAuth: function() {},
          unauth: function() {},
          setValueChangedCallback: function(callback) {},
          removeValueChangedCallback: function() {},
          setChildAddedCallback: function(callback) {},
          removeChildAddedCallback: function() {},
          setChildChangedCallback: function(callback) {},
          removeChildChangedCallback: function() {},
          setChildMovedCallback: function(callback) {},
          removeChildMovedCallback: function() {},
          setChildRemovedCallback: function(callback) {},
          removeChildRemovedCallback: function() {}
        }, {});
      }();
      $__export("DataSource", DataSource);
    }
  };
});

System.register("github:Bizboard/arva-js@1.0.0-beta-1/core/App.js", ["github:Bizboard/di.js@master.js", "github:Bizboard/arva-js@1.0.0-beta-1/core/Router.js", "npm:famous@0.3.5/core/Context.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/arva-js@1.0.0-beta-1/core/App.js";
  var Inject,
      annotate,
      Router,
      Context,
      App;
  return {
    setters: [function($__m) {
      Inject = $__m.Inject;
      annotate = $__m.annotate;
    }, function($__m) {
      Router = $__m.Router;
    }, function($__m) {
      Context = $__m.default;
    }],
    execute: function() {
      App = function() {
        function App(router, context) {
          this.router = router;
          this.context = context;
          this.router.run();
        }
        return ($traceurRuntime.createClass)(App, {}, {});
      }();
      $__export("App", App);
      Object.defineProperty(App, "annotations", {get: function() {
          return [new Inject(Router, Context)];
        }});
    }
  };
});

System.register("github:Bizboard/arva-js@1.0.0-beta-1/core/Controller.js", ["npm:lodash@3.10.0.js", "github:Bizboard/di.js@master.js", "github:Bizboard/arva-js@1.0.0-beta-1/core/Router.js", "github:Bizboard/arva-utils@1.0.0-beta-1/ObjectHelper.js", "npm:famous@0.3.5/core/EventHandler.js", "github:ijzerenhein/famous-flex@0.3.4/src/AnimationController.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/arva-js@1.0.0-beta-1/core/Controller.js";
  var _,
      Inject,
      Router,
      ObjectHelper,
      EventHandler,
      AnimationController,
      Controller;
  return {
    setters: [function($__m) {
      _ = $__m.default;
    }, function($__m) {
      Inject = $__m.Inject;
    }, function($__m) {
      Router = $__m.Router;
    }, function($__m) {
      ObjectHelper = $__m.ObjectHelper;
    }, function($__m) {
      EventHandler = $__m.default;
    }, function($__m) {
      AnimationController = $__m.default;
    }],
    execute: function() {
      Controller = function() {
        function Controller(router, context, spec) {
          this.spec = spec;
          this.router = router;
          this.context = context;
          this._eventOutput = new EventHandler();
          ObjectHelper.bindAllMethods(this, this);
          var routeName = Object.getPrototypeOf(this).constructor.name.replace('Controller', '');
          routeName += '/:method';
          this.router.add(routeName, this.onRouteCalled);
        }
        return ($traceurRuntime.createClass)(Controller, {
          on: function(event, handler) {
            this._eventOutput.on(event, handler);
          },
          onRouteCalled: function(route) {
            var $__0 = this;
            if (typeof this[route.method] === 'function') {
              var result = this[route.method].apply(this, route.values);
              if (result) {
                this._eventOutput.emit('renderstart', route.method);
                if (result instanceof Promise) {
                  result.then(function(delegatedresult) {
                    $__0.context.show(delegatedresult, _.extend(route.spec, $__0.spec), function() {
                      $__0._eventOutput.emit('renderend', route.method);
                    });
                    $__0._eventOutput.emit('rendering', route.method);
                  });
                } else {
                  this.context.show(result, _.extend(route.spec, this.spec), function() {
                    $__0._eventOutput.emit('renderend', route.method);
                  });
                  this._eventOutput.emit('rendering', route.method);
                }
                this.context.show(result, _.extend(route.spec, this.spec), function() {
                  this._eventOutput.emit('renderend', route.method);
                }.bind(this));
                this._eventOutput.emit('rendering', route.method);
                return true;
              } else {
                return false;
              }
            } else {
              console.log('Route does not exist!');
              return false;
            }
          }
        }, {});
      }();
      $__export("Controller", Controller);
      Object.defineProperty(Controller, "annotations", {get: function() {
          return [new Inject(Router, AnimationController)];
        }});
    }
  };
});

System.register("github:Bizboard/arva-js@1.0.0-beta-1/core/View.js", ["npm:lodash@3.10.0.js", "npm:famous@0.3.5/core/View.js", "github:ijzerenhein/famous-flex@0.3.4/src/LayoutController.js", "github:Bizboard/arva-utils@1.0.0-beta-1/ObjectHelper.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/arva-js@1.0.0-beta-1/core/View.js";
  var _,
      FamousView,
      LayoutController,
      ObjectHelper,
      DEFAULT_OPTIONS,
      View;
  return {
    setters: [function($__m) {
      _ = $__m.default;
    }, function($__m) {
      FamousView = $__m.default;
    }, function($__m) {
      LayoutController = $__m.default;
    }, function($__m) {
      ObjectHelper = $__m.ObjectHelper;
    }],
    execute: function() {
      DEFAULT_OPTIONS = {};
      View = function($__super) {
        function View() {
          var options = arguments[0] !== (void 0) ? arguments[0] : {};
          $traceurRuntime.superConstructor(View).call(this, _.merge(options, DEFAULT_OPTIONS));
          this.renderables = {};
          this.layouts = [];
          ObjectHelper.bindAllMethods(this, this);
        }
        return ($traceurRuntime.createClass)(View, {
          build: function() {
            this._combineLayouts();
          },
          _combineLayouts: function() {
            this.layout = new LayoutController({
              autoPipeEvents: true,
              layout: function(context) {
                var isPortrait = window.matchMedia('(orientation: portrait)').matches;
                if (this.layouts && this.layouts.length > 0) {
                  var layouts = this.layouts.length;
                  for (var l = 0; l < layouts; l++) {
                    var spec = this.layouts[l];
                    var specType = typeof spec;
                    if (specType === 'object') {
                      if (isPortrait) {
                        if (spec.portrait) {
                          spec.portrait.call(this, context);
                        } else {
                          console.log('no portrait layout for view defined.');
                        }
                      } else {
                        if (spec.landscape) {
                          spec.landscape.call(this, context);
                        } else {
                          console.log('no landscape layout for view defined.');
                        }
                      }
                    } else if (specType === 'function') {
                      spec.call(this, context);
                    } else {
                      console.log('Unrecognized layout specification.');
                    }
                  }
                }
              }.bind(this),
              dataSource: this.renderables
            });
            this.add(this.layout);
            this.layout.pipe(this._eventOutput);
          }
        }, {}, $__super);
      }(FamousView);
      $__export("View", View);
    }
  };
});

System.register("github:Bizboard/di.js@master/annotations.js", ["github:Bizboard/di.js@master/util.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/di.js@master/annotations.js";
  var isFunction,
      SuperConstructor,
      TransientScope,
      Inject,
      InjectPromise,
      InjectLazy,
      Provide,
      ProvidePromise,
      ClassProvider,
      FactoryProvider;
  function annotate(fn, annotation) {
    fn.annotations = fn.annotations || [];
    fn.annotations.push(annotation);
  }
  function hasAnnotation(fn, annotationClass) {
    if (!fn.annotations || fn.annotations.length === 0) {
      return false;
    }
    var $__4 = true;
    var $__5 = false;
    var $__6 = undefined;
    try {
      for (var $__2 = void 0,
          $__1 = (fn.annotations)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
        var annotation = $__2.value;
        {
          if (annotation instanceof annotationClass) {
            return true;
          }
        }
      }
    } catch ($__7) {
      $__5 = true;
      $__6 = $__7;
    } finally {
      try {
        if (!$__4 && $__1.return != null) {
          $__1.return();
        }
      } finally {
        if ($__5) {
          throw $__6;
        }
      }
    }
    return false;
  }
  function readAnnotations(fn) {
    var collectedAnnotations = {
      provide: {
        token: null,
        isPromise: false
      },
      params: []
    };
    if (fn.annotations && fn.annotations.length) {
      var $__4 = true;
      var $__5 = false;
      var $__6 = undefined;
      try {
        for (var $__2 = void 0,
            $__1 = (fn.annotations)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
          var annotation = $__2.value;
          {
            if (annotation instanceof Inject) {
              annotation.tokens.forEach(function(token) {
                collectedAnnotations.params.push({
                  token: token,
                  isPromise: annotation.isPromise,
                  isLazy: annotation.isLazy
                });
              });
            }
            if (annotation instanceof Provide) {
              collectedAnnotations.provide.token = annotation.token;
              collectedAnnotations.provide.isPromise = annotation.isPromise;
            }
          }
        }
      } catch ($__7) {
        $__5 = true;
        $__6 = $__7;
      } finally {
        try {
          if (!$__4 && $__1.return != null) {
            $__1.return();
          }
        } finally {
          if ($__5) {
            throw $__6;
          }
        }
      }
    }
    if (fn.parameters) {
      fn.parameters.forEach(function(param, idx) {
        var $__11 = true;
        var $__12 = false;
        var $__13 = undefined;
        try {
          for (var $__9 = void 0,
              $__8 = (param)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__11 = ($__9 = $__8.next()).done); $__11 = true) {
            var paramAnnotation = $__9.value;
            {
              if (isFunction(paramAnnotation) && !collectedAnnotations.params[idx]) {
                collectedAnnotations.params[idx] = {
                  token: paramAnnotation,
                  isPromise: false,
                  isLazy: false
                };
              } else if (paramAnnotation instanceof Inject) {
                collectedAnnotations.params[idx] = {
                  token: paramAnnotation.tokens[0],
                  isPromise: paramAnnotation.isPromise,
                  isLazy: paramAnnotation.isLazy
                };
              }
            }
          }
        } catch ($__14) {
          $__12 = true;
          $__13 = $__14;
        } finally {
          try {
            if (!$__11 && $__8.return != null) {
              $__8.return();
            }
          } finally {
            if ($__12) {
              throw $__13;
            }
          }
        }
      });
    }
    return collectedAnnotations;
  }
  function inject() {
    for (var tokens = [],
        $__15 = 0; $__15 < arguments.length; $__15++)
      tokens[$__15] = arguments[$__15];
    return function(fn) {
      annotate(fn, new (Function.prototype.bind.apply(Inject, $traceurRuntime.spread([null], tokens)))());
    };
  }
  function inject() {
    for (var tokens = [],
        $__16 = 0; $__16 < arguments.length; $__16++)
      tokens[$__16] = arguments[$__16];
    return function(fn) {
      annotate(fn, new (Function.prototype.bind.apply(Inject, $traceurRuntime.spread([null], tokens)))());
    };
  }
  function injectPromise() {
    for (var tokens = [],
        $__17 = 0; $__17 < arguments.length; $__17++)
      tokens[$__17] = arguments[$__17];
    return function(fn) {
      annotate(fn, new (Function.prototype.bind.apply(InjectPromise, $traceurRuntime.spread([null], tokens)))());
    };
  }
  function injectLazy() {
    for (var tokens = [],
        $__18 = 0; $__18 < arguments.length; $__18++)
      tokens[$__18] = arguments[$__18];
    return function(fn) {
      annotate(fn, new (Function.prototype.bind.apply(InjectLazy, $traceurRuntime.spread([null], tokens)))());
    };
  }
  function provide() {
    for (var tokens = [],
        $__19 = 0; $__19 < arguments.length; $__19++)
      tokens[$__19] = arguments[$__19];
    return function(fn) {
      annotate(fn, new (Function.prototype.bind.apply(Provide, $traceurRuntime.spread([null], tokens)))());
    };
  }
  function providePromise() {
    for (var tokens = [],
        $__20 = 0; $__20 < arguments.length; $__20++)
      tokens[$__20] = arguments[$__20];
    return function(fn) {
      annotate(fn, new (Function.prototype.bind.apply(ProvidePromise, $traceurRuntime.spread([null], tokens)))());
    };
  }
  return {
    setters: [function($__m) {
      isFunction = $__m.isFunction;
    }],
    execute: function() {
      SuperConstructor = function() {
        function SuperConstructor() {}
        return ($traceurRuntime.createClass)(SuperConstructor, {}, {});
      }();
      TransientScope = function() {
        function TransientScope() {}
        return ($traceurRuntime.createClass)(TransientScope, {}, {});
      }();
      Inject = function() {
        function Inject() {
          for (var tokens = [],
              $__21 = 0; $__21 < arguments.length; $__21++)
            tokens[$__21] = arguments[$__21];
          this.tokens = tokens;
          this.isPromise = false;
          this.isLazy = false;
        }
        return ($traceurRuntime.createClass)(Inject, {}, {});
      }();
      InjectPromise = function($__super) {
        function InjectPromise() {
          for (var tokens = [],
              $__21 = 0; $__21 < arguments.length; $__21++)
            tokens[$__21] = arguments[$__21];
          $traceurRuntime.superConstructor(InjectPromise).call(this);
          this.tokens = tokens;
          this.isPromise = true;
          this.isLazy = false;
        }
        return ($traceurRuntime.createClass)(InjectPromise, {}, {}, $__super);
      }(Inject);
      InjectLazy = function($__super) {
        function InjectLazy() {
          for (var tokens = [],
              $__21 = 0; $__21 < arguments.length; $__21++)
            tokens[$__21] = arguments[$__21];
          $traceurRuntime.superConstructor(InjectLazy).call(this);
          this.tokens = tokens;
          this.isPromise = false;
          this.isLazy = true;
        }
        return ($traceurRuntime.createClass)(InjectLazy, {}, {}, $__super);
      }(Inject);
      Provide = function() {
        function Provide(token) {
          this.token = token;
          this.isPromise = false;
        }
        return ($traceurRuntime.createClass)(Provide, {}, {});
      }();
      ProvidePromise = function($__super) {
        function ProvidePromise(token) {
          $traceurRuntime.superConstructor(ProvidePromise).call(this);
          this.token = token;
          this.isPromise = true;
        }
        return ($traceurRuntime.createClass)(ProvidePromise, {}, {}, $__super);
      }(Provide);
      ClassProvider = function() {
        function ClassProvider() {}
        return ($traceurRuntime.createClass)(ClassProvider, {}, {});
      }();
      FactoryProvider = function() {
        function FactoryProvider() {}
        return ($traceurRuntime.createClass)(FactoryProvider, {}, {});
      }();
      $__export("annotate", annotate), $__export("hasAnnotation", hasAnnotation), $__export("readAnnotations", readAnnotations), $__export("SuperConstructor", SuperConstructor), $__export("TransientScope", TransientScope), $__export("Inject", Inject), $__export("InjectPromise", InjectPromise), $__export("InjectLazy", InjectLazy), $__export("Provide", Provide), $__export("ProvidePromise", ProvidePromise), $__export("ClassProvider", ClassProvider), $__export("FactoryProvider", FactoryProvider), $__export("inject", inject), $__export("injectPromise", injectPromise), $__export("injectLazy", injectLazy), $__export("provide", provide), $__export("providePromise", providePromise);
    }
  };
});

System.register("views/HomeView.js", ["npm:famous@0.3.5/core/Surface.js", "github:Bizboard/arva-js@1.0.0-beta-1/core/View.js"], function($__export) {
  "use strict";
  var __moduleName = "views/HomeView.js";
  var Surface,
      View,
      HomeView;
  return {
    setters: [function($__m) {
      Surface = $__m.default;
    }, function($__m) {
      View = $__m.View;
    }],
    execute: function() {
      HomeView = function($__super) {
        function HomeView() {
          var welcomeName = arguments[0] !== (void 0) ? arguments[0] : 'world';
          $traceurRuntime.superConstructor(HomeView).call(this);
          this.renderables.message = new Surface({content: ("Hello " + welcomeName + "!")});
          this.layouts.push(function(context) {
            context.set('message', {
              size: [true, true],
              origin: [0.5, 0.5],
              align: [0.5, 0.5]
            });
          });
          this.build();
        }
        return ($traceurRuntime.createClass)(HomeView, {}, {}, $__super);
      }(View);
      $__export("HomeView", HomeView);
    }
  };
});

System.register("github:Bizboard/di.js@master/injector.js", ["github:Bizboard/di.js@master/annotations.js", "github:Bizboard/di.js@master/util.js", "github:Bizboard/di.js@master/profiler.js", "github:Bizboard/di.js@master/providers.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/di.js@master/injector.js";
  var annotate,
      readAnnotations,
      hasAnnotation,
      ProvideAnnotation,
      TransientScopeAnnotation,
      isFunction,
      toString,
      profileInjector,
      createProviderFromFnOrClass,
      Injector;
  function constructResolvingMessage(resolving, token) {
    if (arguments.length > 1) {
      resolving.push(token);
    }
    if (resolving.length > 1) {
      return (" (" + resolving.map(toString).join(' -> ') + ")");
    }
    return '';
  }
  return {
    setters: [function($__m) {
      annotate = $__m.annotate;
      readAnnotations = $__m.readAnnotations;
      hasAnnotation = $__m.hasAnnotation;
      ProvideAnnotation = $__m.Provide;
      TransientScopeAnnotation = $__m.TransientScope;
    }, function($__m) {
      isFunction = $__m.isFunction;
      toString = $__m.toString;
    }, function($__m) {
      profileInjector = $__m.profileInjector;
    }, function($__m) {
      createProviderFromFnOrClass = $__m.createProviderFromFnOrClass;
    }],
    execute: function() {
      Injector = function() {
        function Injector() {
          var modules = arguments[0] !== (void 0) ? arguments[0] : [];
          var parentInjector = arguments[1] !== (void 0) ? arguments[1] : null;
          var providers = arguments[2] !== (void 0) ? arguments[2] : new Map();
          var scopes = arguments[3] !== (void 0) ? arguments[3] : [];
          this._cache = new Map();
          this._providers = providers;
          this._parent = parentInjector;
          this._scopes = scopes;
          this._loadModules(modules);
          profileInjector(this, Injector);
        }
        return ($traceurRuntime.createClass)(Injector, {
          _collectProvidersWithAnnotation: function(annotationClass, collectedProviders) {
            this._providers.forEach(function(provider, token) {
              if (!collectedProviders.has(token) && hasAnnotation(provider.provider, annotationClass)) {
                collectedProviders.set(token, provider);
              }
            });
            if (this._parent) {
              this._parent._collectProvidersWithAnnotation(annotationClass, collectedProviders);
            }
          },
          _loadModules: function(modules) {
            var $__5 = true;
            var $__6 = false;
            var $__7 = undefined;
            try {
              for (var $__3 = void 0,
                  $__2 = (modules)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
                var module = $__3.value;
                {
                  if (isFunction(module)) {
                    this._loadFnOrClass(module);
                    continue;
                  }
                  throw new Error('Invalid module!');
                }
              }
            } catch ($__8) {
              $__6 = true;
              $__7 = $__8;
            } finally {
              try {
                if (!$__5 && $__2.return != null) {
                  $__2.return();
                }
              } finally {
                if ($__6) {
                  throw $__7;
                }
              }
            }
          },
          _loadFnOrClass: function(fnOrClass) {
            var annotations = readAnnotations(fnOrClass);
            var token = annotations.provide.token || fnOrClass;
            var provider = createProviderFromFnOrClass(fnOrClass, annotations);
            this._providers.set(token, provider);
          },
          _hasProviderFor: function(token) {
            if (this._providers.has(token)) {
              return true;
            }
            if (this._parent) {
              return this._parent._hasProviderFor(token);
            }
            return false;
          },
          _instantiateDefaultProvider: function(provider, token, resolving, wantPromise, wantLazy) {
            if (!this._parent) {
              this._providers.set(token, provider);
              return this.get(token, resolving, wantPromise, wantLazy);
            }
            var $__5 = true;
            var $__6 = false;
            var $__7 = undefined;
            try {
              for (var $__3 = void 0,
                  $__2 = (this._scopes)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
                var ScopeClass = $__3.value;
                {
                  if (hasAnnotation(provider.provider, ScopeClass)) {
                    this._providers.set(token, provider);
                    return this.get(token, resolving, wantPromise, wantLazy);
                  }
                }
              }
            } catch ($__8) {
              $__6 = true;
              $__7 = $__8;
            } finally {
              try {
                if (!$__5 && $__2.return != null) {
                  $__2.return();
                }
              } finally {
                if ($__6) {
                  throw $__7;
                }
              }
            }
            return this._parent._instantiateDefaultProvider(provider, token, resolving, wantPromise, wantLazy);
          },
          get: function(token) {
            var resolving = arguments[1] !== (void 0) ? arguments[1] : [];
            var wantPromise = arguments[2] !== (void 0) ? arguments[2] : false;
            var wantLazy = arguments[3] !== (void 0) ? arguments[3] : false;
            var $__0 = this;
            var resolvingMsg = '';
            var provider;
            var instance;
            var injector = this;
            if (token === null || token === undefined) {
              resolvingMsg = constructResolvingMessage(resolving, token);
              throw new Error(("Invalid token \"" + token + "\" requested!" + resolvingMsg));
            }
            if (token === Injector) {
              if (wantPromise) {
                return Promise.resolve(this);
              }
              return this;
            }
            if (wantLazy) {
              return function createLazyInstance() {
                var lazyInjector = injector;
                if (arguments.length) {
                  var locals = [];
                  var args = arguments;
                  for (var i = 0; i < args.length; i += 2) {
                    locals.push((function(ii) {
                      var fn = function createLocalInstance() {
                        return args[ii + 1];
                      };
                      annotate(fn, new ProvideAnnotation(args[ii]));
                      return fn;
                    })(i));
                  }
                  lazyInjector = injector.createChild(locals);
                }
                return lazyInjector.get(token, resolving, wantPromise, false);
              };
            }
            if (this._cache.has(token)) {
              instance = this._cache.get(token);
              provider = this._providers.get(token);
              if (provider.isPromise && !wantPromise) {
                resolvingMsg = constructResolvingMessage(resolving, token);
                throw new Error(("Cannot instantiate " + toString(token) + " synchronously. It is provided as a promise!" + resolvingMsg));
              }
              if (!provider.isPromise && wantPromise) {
                return Promise.resolve(instance);
              }
              return instance;
            }
            provider = this._providers.get(token);
            if (!provider && isFunction(token) && !this._hasProviderFor(token)) {
              provider = createProviderFromFnOrClass(token, readAnnotations(token));
              return this._instantiateDefaultProvider(provider, token, resolving, wantPromise, wantLazy);
            }
            if (!provider) {
              if (!this._parent) {
                resolvingMsg = constructResolvingMessage(resolving, token);
                throw new Error(("No provider for " + toString(token) + "!" + resolvingMsg));
              }
              return this._parent.get(token, resolving, wantPromise, wantLazy);
            }
            if (resolving.indexOf(token) !== -1) {
              resolvingMsg = constructResolvingMessage(resolving, token);
              throw new Error(("Cannot instantiate cyclic dependency!" + resolvingMsg));
            }
            resolving.push(token);
            var delayingInstantiation = wantPromise && provider.params.some(function(param) {
              return !param.isPromise;
            });
            var args = provider.params.map(function(param) {
              if (delayingInstantiation) {
                return $__0.get(param.token, resolving, true, param.isLazy);
              }
              return $__0.get(param.token, resolving, param.isPromise, param.isLazy);
            });
            if (delayingInstantiation) {
              var delayedResolving = resolving.slice();
              resolving.pop();
              return Promise.all(args).then(function(args) {
                try {
                  instance = provider.create(args);
                } catch (e) {
                  resolvingMsg = constructResolvingMessage(delayedResolving);
                  var originalMsg = 'ORIGINAL ERROR: ' + e.message;
                  e.message = ("Error during instantiation of " + toString(token) + "!" + resolvingMsg + "\n" + originalMsg);
                  throw e;
                }
                if (!hasAnnotation(provider.provider, TransientScopeAnnotation)) {
                  injector._cache.set(token, instance);
                }
                return instance;
              });
            }
            try {
              instance = provider.create(args);
            } catch (e) {
              resolvingMsg = constructResolvingMessage(resolving);
              var originalMsg = 'ORIGINAL ERROR: ' + e.message;
              e.message = ("Error during instantiation of " + toString(token) + "!" + resolvingMsg + "\n" + originalMsg);
              throw e;
            }
            if (!hasAnnotation(provider.provider, TransientScopeAnnotation)) {
              this._cache.set(token, instance);
            }
            if (!wantPromise && provider.isPromise) {
              resolvingMsg = constructResolvingMessage(resolving);
              throw new Error(("Cannot instantiate " + toString(token) + " synchronously. It is provided as a promise!" + resolvingMsg));
            }
            if (wantPromise && !provider.isPromise) {
              instance = Promise.resolve(instance);
            }
            resolving.pop();
            return instance;
          },
          getPromise: function(token) {
            return this.get(token, [], true);
          },
          createChild: function() {
            var modules = arguments[0] !== (void 0) ? arguments[0] : [];
            var forceNewInstancesOf = arguments[1] !== (void 0) ? arguments[1] : [];
            var forcedProviders = new Map();
            forceNewInstancesOf.push(TransientScopeAnnotation);
            var $__5 = true;
            var $__6 = false;
            var $__7 = undefined;
            try {
              for (var $__3 = void 0,
                  $__2 = (forceNewInstancesOf)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
                var annotation = $__3.value;
                {
                  this._collectProvidersWithAnnotation(annotation, forcedProviders);
                }
              }
            } catch ($__8) {
              $__6 = true;
              $__7 = $__8;
            } finally {
              try {
                if (!$__5 && $__2.return != null) {
                  $__2.return();
                }
              } finally {
                if ($__6) {
                  throw $__7;
                }
              }
            }
            return new Injector(modules, this, forcedProviders, forceNewInstancesOf);
          }
        }, {});
      }();
      $__export("Injector", Injector);
    }
  };
});

System.register("github:Bizboard/arva-js@1.0.0-beta-1/core/Router.js", ["npm:eventemitter3@1.1.1.js", "github:Bizboard/arva-utils@1.0.0-beta-1/ObjectHelper.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/arva-js@1.0.0-beta-1/core/Router.js";
  var EventEmitter,
      ObjectHelper,
      Router;
  return {
    setters: [function($__m) {
      EventEmitter = $__m.default;
    }, function($__m) {
      ObjectHelper = $__m.ObjectHelper;
    }],
    execute: function() {
      Router = function($__super) {
        function Router() {
          $traceurRuntime.superConstructor(Router).call(this);
          ObjectHelper.bindAllMethods(this, this);
          this.controllers = [];
          this.defaultController = 'Home';
          this.defaultMethod = 'Index';
        }
        return ($traceurRuntime.createClass)(Router, {
          run: function() {},
          setDefault: function(controller, method) {},
          add: function(route, handler) {},
          go: function(controller, method, params) {},
          _executeRoute: function(rule, route) {}
        }, {}, $__super);
      }(EventEmitter);
      $__export("Router", Router);
    }
  };
});

System.register("github:Bizboard/arva-ds@1.0.0-beta-1/datasources/FirebaseDataSource.js", ["github:Bizboard/di.js@master.js", "github:firebase/firebase-bower@2.2.7.js", "github:Bizboard/arva-ds@1.0.0-beta-1/core/DataSource.js", "github:Bizboard/arva-utils@1.0.0-beta-1/ObjectHelper.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/arva-ds@1.0.0-beta-1/datasources/FirebaseDataSource.js";
  var Provide,
      Firebase,
      DataSource,
      ObjectHelper,
      FirebaseDataSource;
  return {
    setters: [function($__m) {
      Provide = $__m.Provide;
    }, function($__m) {
      Firebase = $__m.default;
    }, function($__m) {
      DataSource = $__m.DataSource;
    }, function($__m) {
      ObjectHelper = $__m.ObjectHelper;
    }],
    execute: function() {
      FirebaseDataSource = function($__super) {
        function FirebaseDataSource(path) {
          var options = arguments[1] !== (void 0) ? arguments[1] : {orderBy: '.priority'};
          $traceurRuntime.superConstructor(FirebaseDataSource).call(this, path);
          this._onValueCallback = null;
          this._onAddCallback = null;
          this._onChangeCallback = null;
          this._onMoveCallback = null;
          this._onRemoveCallback = null;
          this._dataReference = new Firebase(path);
          this.options = options;
          ObjectHelper.bindAllMethods(this, this);
        }
        return ($traceurRuntime.createClass)(FirebaseDataSource, {
          get dataReference() {
            return this._dataReference;
          },
          set dataReference(value) {
            this._dataReference = value;
          },
          toString: function() {
            return this._dataReference.toString();
          },
          child: function(childName) {
            var options = arguments[1] !== (void 0) ? arguments[1] : {};
            return new FirebaseDataSource(this._dataReference.child(childName).toString(), options);
          },
          path: function() {
            return this._dataReference.toString();
          },
          key: function() {
            return this._dataReference.key();
          },
          set: function(newData) {
            return this._dataReference.set(newData);
          },
          remove: function() {
            return this._dataReference.remove();
          },
          push: function(newData) {
            return new FirebaseDataSource(this._dataReference.push(newData).toString());
          },
          setWithPriority: function(newData, priority) {
            return this._dataReference.setWithPriority(newData, priority);
          },
          setPriority: function(newPriority) {
            return this._dataReference.setPriority(newPriority);
          },
          orderByChild: function(childKey) {
            return new FirebaseDataSource(this._dataReference.orderByChild(childKey));
          },
          orderByKey: function() {
            return new FirebaseDataSource(this._dataReference.orderByKey());
          },
          orderByValue: function() {
            return new FirebaseDataSource(this._dataReference.orderByValue());
          },
          limitToFirst: function(amount) {
            return new FirebaseDataSource(this._dataReference.limitToFirst(amount));
          },
          limitToLast: function(amount) {
            return new FirebaseDataSource(this._dataReference.limitToLast(amount));
          },
          authWithOAuthToken: function(provider, credentials, onComplete, options) {
            return this._dataReference.authWithOAuthToken(provider, credentials, onComplete, options);
          },
          authWithCustomToken: function(authToken, onComplete, options) {
            return this._dataReference.authWithCustomToken(authToken, onComplete, options);
          },
          authWithPassword: function(credentials, onComplete, options) {
            return this._dataReference.authWithPassword(credentials, onComplete, options);
          },
          authAnonymously: function(onComplete, options) {
            return this._dataReference.authAnonymously(onComplete, options);
          },
          getAuth: function() {
            return this._dataReference.getAuth();
          },
          unauth: function() {
            return this._dataReference.unauth();
          },
          setValueChangedCallback: function(callback) {
            this._onValueCallback = callback;
            if (this.options.orderBy && this.options.orderBy === '.priority') {
              this._dataReference.orderByPriority().on('value', this._onValueCallback.bind(this));
            } else if (this.options.orderBy && this.options.orderBy === '.value') {
              this._dataReference.orderByValue().on('value', this._onValueCallback.bind(this));
            } else if (this.options.orderBy && this.options.orderBy !== '') {
              this._dataReference.orderByChild(this.options.orderBy).on('value', this._onValueCallback.bind(this));
            } else {
              this._dataReference.on('value', this._onValueCallback.bind(this));
            }
          },
          removeValueChangedCallback: function() {
            if (this._onValueCallback) {
              this._dataReference.off('value', this._onValueCallback);
              this._onValueCallback = null;
            }
          },
          setChildAddedCallback: function(callback) {
            var $__0 = this;
            this._onAddCallback = callback;
            var wrapper = function(newChildSnapshot, prevChildName) {
              $__0._onAddCallback(newChildSnapshot, prevChildName);
            };
            if (this.options.orderBy && this.options.orderBy === '.priority') {
              this._dataReference.orderByPriority().on('child_added', wrapper.bind(this));
            } else if (this.options.orderBy && this.options.orderBy === '.value') {
              this._dataReference.orderByValue().on('child_added', wrapper.bind(this));
            } else if (this.options.orderBy && this.options.orderBy !== '') {
              this._dataReference.orderByChild(this.options.orderBy).on('child_added', wrapper.bind(this));
            } else {
              this._dataReference.on('child_added', wrapper.bind(this));
            }
          },
          removeChildAddedCallback: function() {
            if (this._onAddCallback) {
              this._dataReference.off('child_added', this._onAddCallback);
              this._onAddCallback = null;
            }
          },
          setChildChangedCallback: function(callback) {
            var $__0 = this;
            this._onChangeCallback = callback;
            var wrapper = function(newChildSnapshot, prevChildName) {
              $__0._onChangeCallback(newChildSnapshot, prevChildName);
            };
            if (this.options.orderBy && this.options.orderBy === '.priority') {
              this._dataReference.orderByPriority().on('child_changed', wrapper.bind(this));
            } else if (this.options.orderBy && this.options.orderBy === '.value') {
              this._dataReference.orderByValue().on('child_changed', wrapper.bind(this));
            } else if (this.options.orderBy && this.options.orderBy !== '') {
              this._dataReference.orderByChild(this.options.orderBy).on('child_changed', wrapper.bind(this));
            } else {
              this._dataReference.on('child_changed', wrapper.bind(this));
            }
          },
          removeChildChangedCallback: function() {
            if (this._onChangeCallback) {
              this._dataReference.off('child_changed', this._onChangeCallback);
              this._onChangeCallback = null;
            }
          },
          setChildMovedCallback: function(callback) {
            var $__0 = this;
            this._onMoveCallback = callback;
            this._dataReference.on('child_moved', function(newChildSnapshot, prevChildName) {
              $__0._onMoveCallback(newChildSnapshot, prevChildName);
            });
          },
          removeChildMovedCallback: function() {
            if (this._onMoveCallback) {
              this._dataReference.off('child_moved', this._onMoveCallback);
              this._onMoveCallback = null;
            }
          },
          setChildRemovedCallback: function(callback) {
            this._onRemoveCallback = callback;
            this._dataReference.on('child_removed', this._onRemoveCallback);
          },
          removeChildRemovedCallback: function() {
            if (this._onRemoveCallback) {
              this._dataReference.off('child_removed', this._onRemoveCallback);
              this._onRemoveCallback = null;
            }
          }
        }, {}, $__super);
      }(DataSource);
      $__export("FirebaseDataSource", FirebaseDataSource);
      Object.defineProperty(FirebaseDataSource, "annotations", {get: function() {
          return [new Provide(DataSource)];
        }});
    }
  };
});

System.register("controllers/HomeController.js", ["github:Bizboard/arva-js@1.0.0-beta-1/core/Controller.js", "views/HomeView.js"], function($__export) {
  "use strict";
  var __moduleName = "controllers/HomeController.js";
  var Controller,
      HomeView,
      HomeController;
  return {
    setters: [function($__m) {
      Controller = $__m.Controller;
    }, function($__m) {
      HomeView = $__m.HomeView;
    }],
    execute: function() {
      HomeController = function($__super) {
        function HomeController() {
          $traceurRuntime.superConstructor(HomeController).apply(this, arguments);
        }
        return ($traceurRuntime.createClass)(HomeController, {Index: function() {
            if (!this.homeView) {
              this.homeView = new HomeView('world');
            }
            return this.homeView;
          }}, {}, $__super);
      }(Controller);
      $__export("HomeController", HomeController);
    }
  };
});

System.register("github:Bizboard/di.js@master/index.js", ["github:Bizboard/di.js@master/injector.js", "github:Bizboard/di.js@master/annotations.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/di.js@master/index.js";
  return {
    setters: [function($__m) {
      $__export("Injector", $__m.Injector);
    }, function($__m) {
      $__export("annotate", $__m.annotate);
      $__export("Inject", $__m.Inject);
      $__export("InjectLazy", $__m.InjectLazy);
      $__export("InjectPromise", $__m.InjectPromise);
      $__export("Provide", $__m.Provide);
      $__export("ProvidePromise", $__m.ProvidePromise);
      $__export("SuperConstructor", $__m.SuperConstructor);
      $__export("TransientScope", $__m.TransientScope);
      $__export("ClassProvider", $__m.ClassProvider);
      $__export("FactoryProvider", $__m.FactoryProvider);
      $__export("inject", $__m.inject);
      $__export("injectPromise", $__m.injectPromise);
      $__export("injectLazy", $__m.injectLazy);
      $__export("provide", $__m.provide);
      $__export("providePromise", $__m.providePromise);
    }],
    execute: function() {}
  };
});

System.register("DefaultDataSource.js", ["github:Bizboard/di.js@master.js", "github:Bizboard/arva-ds@1.0.0-beta-1/core/DataSource.js", "github:Bizboard/arva-ds@1.0.0-beta-1/datasources/FirebaseDataSource.js"], function($__export) {
  "use strict";
  var __moduleName = "DefaultDataSource.js";
  var Provide,
      DataSource,
      FirebaseDataSource,
      root,
      DefaultDataSource;
  return {
    setters: [function($__m) {
      Provide = $__m.Provide;
    }, function($__m) {
      DataSource = $__m.DataSource;
    }, function($__m) {
      FirebaseDataSource = $__m.FirebaseDataSource;
    }],
    execute: function() {
      DefaultDataSource = function() {
        function DefaultDataSource() {
          return new FirebaseDataSource(root);
        }
        return ($traceurRuntime.createClass)(DefaultDataSource, {}, {setRoot: function(rootPath) {
            root = rootPath;
          }});
      }();
      $__export("DefaultDataSource", DefaultDataSource);
      Object.defineProperty(DefaultDataSource, "annotations", {get: function() {
          return [new Provide(DataSource)];
        }});
    }
  };
});

System.register("App.js", ["github:Bizboard/di.js@master.js", "npm:fastclick@1.0.6.js", "npm:famous@0.3.5/core/Context.js", "github:Bizboard/arva-js@1.0.0-beta-1/core/App.js", "github:Bizboard/arva-js@1.0.0-beta-1/core/Router.js", "controllers/HomeController.js"], function($__export) {
  "use strict";
  var __moduleName = "App.js";
  var Inject,
      FastClick,
      Context,
      ArvaApp,
      Router,
      HomeController,
      App;
  return {
    setters: [function($__m) {
      Inject = $__m.Inject;
    }, function($__m) {
      FastClick = $__m.default;
    }, function($__m) {
      Context = $__m.default;
    }, function($__m) {
      ArvaApp = $__m.App;
    }, function($__m) {
      Router = $__m.Router;
    }, function($__m) {
      HomeController = $__m.HomeController;
    }],
    execute: function() {
      App = function($__super) {
        function App(router, context) {
          FastClick(document.body);
          router.setDefault(HomeController, 'Index');
          $traceurRuntime.superConstructor(App).call(this, router, context);
        }
        return ($traceurRuntime.createClass)(App, {}, {}, $__super);
      }(ArvaApp);
      $__export("App", App);
      Object.defineProperty(App, "annotations", {get: function() {
          return [new Inject(Router, Context, HomeController)];
        }});
    }
  };
});

System.register("github:Bizboard/di.js@master.js", ["github:Bizboard/di.js@master/index.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/di.js@master.js";
  var $__exportNames = {};
  return {
    setters: [function($__m) {
      Object.keys($__m).forEach(function(p) {
        if (p !== 'default' && !$__exportNames[p])
          $__export(p, $__m[p]);
      });
    }],
    execute: function() {}
  };
});

System.register("github:Bizboard/arva-js@1.0.0-beta-1/routers/ArvaRouter.js", ["npm:lodash@3.10.0.js", "github:Bizboard/di.js@master.js", "github:Bizboard/arva-js@1.0.0-beta-1/core/Router.js", "npm:famous@0.3.5/transitions/Easing.js", "github:ijzerenhein/famous-flex@0.3.4/src/AnimationController.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/arva-js@1.0.0-beta-1/routers/ArvaRouter.js";
  var _,
      Provide,
      Router,
      Easing,
      AnimationController,
      ArvaRouter;
  return {
    setters: [function($__m) {
      _ = $__m.default;
    }, function($__m) {
      Provide = $__m.Provide;
    }, function($__m) {
      Router = $__m.Router;
    }, function($__m) {
      Easing = $__m.default;
    }, function($__m) {
      AnimationController = $__m.default;
    }],
    execute: function() {
      ArvaRouter = function($__super) {
        function ArvaRouter() {
          $traceurRuntime.superConstructor(ArvaRouter).call(this);
          if (window == null) {
            return;
          }
          this.routes = {};
          this.history = [];
          this.decode = decodeURIComponent;
          window.addEventListener('hashchange', this.run);
        }
        return ($traceurRuntime.createClass)(ArvaRouter, {
          setDefault: function(controller) {
            var method = arguments[1] !== (void 0) ? arguments[1] : null;
            this.defaultController = this._getControllerName(controller);
            if (method != null) {
              this.defaultMethod = method;
            }
          },
          setControllerSpecs: function(specs) {
            this.specs = specs;
          },
          go: function(controller, method) {
            var params = arguments[2] !== (void 0) ? arguments[2] : null;
            var controllerName = this._getControllerName(controller);
            var routeRoot = controllerName.replace(this.defaultController, '').replace('Controller', '');
            var hash = '#' + (routeRoot.length > 0 ? '/' + routeRoot : '') + ('/' + method);
            if (params !== null) {
              for (var i = 0; i < Object.keys(params).length; i++) {
                var key = Object.keys(params)[i];
                hash += i == 0 ? '?' : '&';
                hash += (key + '=' + params[key]);
              }
            }
            if (history.pushState) {
              history.pushState(null, null, hash);
            }
            this.run();
          },
          add: function(route, handler) {
            var pieces = route.split('/'),
                rules = this.routes;
            for (var i = 0; i < pieces.length; ++i) {
              var piece = pieces[i],
                  name = piece[0] === ':' ? ':' : piece;
              rules = rules[name] || (rules[name] = {});
              if (name === ':') {
                rules['@name'] = piece.slice(1);
              }
            }
            rules['@'] = handler;
          },
          run: function() {
            var url = window.location.hash.replace('#', '');
            if (url !== '') {
              url = url.replace('/?', '?');
              url[0] === '/' && (url = url.slice(1));
              url.slice(-1) === '/' && (url = url.slice(0, -1));
            }
            var rules = this.routes,
                querySplit = url.split('?'),
                pieces = querySplit[0].split('/'),
                values = [],
                keys = [],
                method = '';
            for (var piece in pieces) {
              if (pieces[piece].indexOf('=') > -1) {
                var splitted = pieces[piece].split('=');
                pieces[piece] = splitted[0];
                querySplit.push(pieces[piece] + '=' + splitted[1]);
              }
            }
            var rule = null;
            var controller;
            if (pieces.length === 1 && pieces[0].length === 0) {
              pieces[0] = this.defaultController;
              pieces.push(this.defaultMethod);
            } else if (pieces.length === 1 && pieces[0].length > 0) {
              pieces.unshift(this.defaultController);
            }
            controller = pieces[0];
            for (var i = 0; i < pieces.length && rules; ++i) {
              var piece$__1 = this.decode(pieces[i]);
              rule = rules[piece$__1];
              if (!rule && (rule = rules[':'])) {
                method = piece$__1;
              }
              rules = rules[piece$__1];
            }
            (function parseQuery(q) {
              var query = q.split('&');
              for (var i = 0; i < query.length; ++i) {
                var nameValue = query[i].split('=');
                if (nameValue.length > 1) {
                  keys.push(nameValue[0]);
                  values.push(this.decode(nameValue[1]));
                }
              }
            }).call(this, querySplit.length > 1 ? querySplit[1] : '');
            if (rule && rule['@']) {
              var previousRoute = this.history.length ? this.history[this.history.length - 1] : undefined;
              var currentRoute = {
                url: url,
                controller: controller,
                method: method,
                keys: keys,
                values: values
              };
              currentRoute.spec = previousRoute ? this._getAnimationSpec(previousRoute, currentRoute) : {};
              this._setHistory(currentRoute);
              this._executeRoute(rule, currentRoute);
              return true;
            } else {
              console.log('Controller doesn\'t exist!');
            }
            return false;
          },
          _executeRoute: function(rule, route) {
            if (rule['@'](route)) {
              this.emit('routechange', route);
            }
          },
          _setHistory: function(currentRoute) {
            for (var i = 0; i < this.history.length; i++) {
              var previousRoute = this.history[i];
              if (currentRoute.controller === previousRoute.controller && currentRoute.method === previousRoute.method && _.isEqual(currentRoute.values, previousRoute.values)) {
                this.history.splice(i, this.history.length - i);
                break;
              }
            }
            this.history.push(currentRoute);
          },
          _hasVisited: function(currentRoute) {
            for (var i = 0; i < this.history.length; i++) {
              var previousRoute = this.history[i];
              if (currentRoute.controller === previousRoute.controller && currentRoute.method === previousRoute.method && _.isEqual(currentRoute.values, previousRoute.values)) {
                return true;
              }
            }
            return false;
          },
          _getAnimationSpec: function(previousRoute, currentRoute) {
            var fromController = previousRoute.controller;
            var toController = currentRoute.controller;
            if (fromController.indexOf('Controller') === -1) {
              fromController += 'Controller';
            }
            if (toController.indexOf('Controller') === -1) {
              toController += 'Controller';
            }
            if (currentRoute.controller === previousRoute.controller && currentRoute.method === previousRoute.method && _.isEqual(currentRoute.values, previousRoute.values)) {
              return {};
            }
            if (currentRoute.controller === previousRoute.controller) {
              var direction = this._hasVisited(currentRoute) ? 'previous' : 'next';
              if (this.specs && this.specs[fromController] && this.specs[fromController].methods) {
                return this.specs[fromController].methods[direction];
              }
              var defaults = {
                'previous': {
                  transition: {
                    duration: 1000,
                    curve: Easing.outBack
                  },
                  animation: AnimationController.Animation.Slide.Right
                },
                'next': {
                  transition: {
                    duration: 1000,
                    curve: Easing.outBack
                  },
                  animation: AnimationController.Animation.Slide.Left
                }
              };
              return defaults[direction];
            }
            if (this.specs && this.specs.hasOwnProperty(toController) && this.specs[toController].controllers) {
              var controllerSpecs = this.specs[toController].controllers;
              for (var specIndex in controllerSpecs) {
                var spec = controllerSpecs[specIndex];
                if (spec.activeFrom && spec.activeFrom.indexOf(fromController) !== -1) {
                  return spec;
                }
              }
            }
            console.log('No spec defined from ' + fromController + ' to ' + toController + '. Please check router.setControllerSpecs() in your app constructor.');
          },
          _getControllerName: function(controller) {
            if (typeof controller === 'string') {
              return controller.replace('Controller', '');
            } else if (typeof controller === 'function' && Object.getPrototypeOf(controller).constructor.name == 'Function') {
              return controller.name.replace('Controller', '');
            } else {
              return typeof controller === 'object' ? Object.getPrototypeOf(controller).constructor.name.replace('Controller', '') : typeof controller;
            }
          }
        }, {}, $__super);
      }(Router);
      $__export("ArvaRouter", ArvaRouter);
      Object.defineProperty(ArvaRouter, "annotations", {get: function() {
          return [new Provide(Router)];
        }});
    }
  };
});

System.register("github:Bizboard/arva-js@1.0.0-beta-1/DefaultContext.js", ["github:Bizboard/di.js@master.js", "github:Bizboard/arva-js@1.0.0-beta-1/routers/ArvaRouter.js", "github:Bizboard/arva-utils@1.0.0-beta-1/Context.js", "npm:famous@0.3.5/core/Engine.js", "npm:famous@0.3.5/core/Context.js", "github:ijzerenhein/famous-flex@0.3.4/src/AnimationController.js"], function($__export) {
  "use strict";
  var __moduleName = "github:Bizboard/arva-js@1.0.0-beta-1/DefaultContext.js";
  var Injector,
      Provide,
      ArvaRouter,
      ArvaContext,
      Engine,
      FamousContext,
      AnimationController,
      famousContext,
      NewFamousContext,
      NewAnimationController;
  function createDefaultContext() {
    var router = arguments[0] !== (void 0) ? arguments[0] : ArvaRouter;
    var dependencies = [router, NewFamousContext, NewAnimationController];
    for (var i = 1; i < arguments.length; i++) {
      dependencies.push(arguments[i]);
    }
    ArvaContext.buildContext(dependencies);
    return ArvaContext.getContext();
  }
  $__export("createDefaultContext", createDefaultContext);
  return {
    setters: [function($__m) {
      Injector = $__m.Injector;
      Provide = $__m.Provide;
    }, function($__m) {
      ArvaRouter = $__m.ArvaRouter;
    }, function($__m) {
      ArvaContext = $__m.Context;
    }, function($__m) {
      Engine = $__m.default;
    }, function($__m) {
      FamousContext = $__m.default;
    }, function($__m) {
      AnimationController = $__m.default;
    }],
    execute: function() {
      famousContext = null;
      NewFamousContext = function() {
        function NewFamousContext() {
          return famousContext || (famousContext = Engine.createContext());
        }
        return ($traceurRuntime.createClass)(NewFamousContext, {}, {});
      }();
      Object.defineProperty(NewFamousContext, "annotations", {get: function() {
          return [new Provide(FamousContext)];
        }});
      NewAnimationController = function() {
        function NewAnimationController() {
          var context = new NewFamousContext();
          var controller = new AnimationController();
          context.add(controller);
          return controller;
        }
        return ($traceurRuntime.createClass)(NewAnimationController, {}, {});
      }();
      Object.defineProperty(NewAnimationController, "annotations", {get: function() {
          return [new Provide(AnimationController)];
        }});
    }
  };
});

System.register("main.js", ["github:Bizboard/arva-js@1.0.0-beta-1/DefaultContext.js", "github:Bizboard/arva-js@1.0.0-beta-1/routers/ArvaRouter.js", "DefaultDataSource.js", "App.js", "npm:famous@0.3.5/core/famous.css!github:systemjs/plugin-css@0.1.13.js"], function($__export) {
  "use strict";
  var __moduleName = "main.js";
  var createDefaultContext,
      ArvaRouter,
      DefaultDataSource,
      App,
      famousCSS;
  function start() {
    var context;
    return $traceurRuntime.asyncWrap(function($ctx) {
      while (true)
        switch ($ctx.state) {
          case 0:
            Promise.resolve(waitUntilReadyFired()).then($ctx.createCallback(2), $ctx.errback);
            return;
          case 2:
            DefaultDataSource.setRoot('https://your-app-here.firebaseio.com');
            context = createDefaultContext(ArvaRouter, DefaultDataSource);
            context.get(App);
            $ctx.state = -2;
            break;
          default:
            return $ctx.end();
        }
    }, this);
  }
  function waitUntilReadyFired() {
    return new Promise(function(resolve) {
      document.addEventListener('deviceready', function() {
        resolve();
      });
    });
  }
  return {
    setters: [function($__m) {
      createDefaultContext = $__m.createDefaultContext;
    }, function($__m) {
      ArvaRouter = $__m.ArvaRouter;
    }, function($__m) {
      DefaultDataSource = $__m.DefaultDataSource;
    }, function($__m) {
      App = $__m.App;
    }, function($__m) {
      famousCSS = $__m.default;
    }],
    execute: function() {
      start();
    }
  };
});

System.register('npm:famous@0.3.5/core/famous.css!github:systemjs/plugin-css@0.1.13.js', [], false, function() {});
(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})
(".famous-root{width:100%;height:100%;margin:0;padding:0;opacity:.999999;overflow:hidden;-webkit-transform-style:preserve-3d;transform-style:preserve-3d}.famous-container,.famous-group{top:0;left:0;bottom:0;right:0;overflow:visible;transform-style:preserve-3d;-webkit-backface-visibility:visible;backface-visibility:visible;pointer-events:none}.famous-container,.famous-group,.famous-surface{position:absolute;-webkit-transform-style:preserve-3d}.famous-group{width:0;height:0;margin:0;padding:0}.famous-surface{-webkit-transform-origin:center center;transform-origin:center center;-webkit-backface-visibility:hidden;backface-visibility:hidden;transform-style:preserve-3d;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-tap-highlight-color:transparent;pointer-events:auto}.famous-container-group{position:relative;width:100%;height:100%}");
})
(function(factory) {
  factory();
});
//# sourceMappingURL=bundle.js.map