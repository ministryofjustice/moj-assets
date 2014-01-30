/*! moj-assets - v0.0.1 - 2014-01-30
* http://github.com/ministryofjustice
* Copyright (c) 2014 MOJ Digital Service; Licensed  */
(function () {
  "use strict"
  var root = this;
  if(typeof root.GOVUK === 'undefined') { root.GOVUK = {}; }

  GOVUK.addCookieMessage = function () {
    var message = document.getElementById('global-cookie-message'),
        hasCookieMessage = (message && GOVUK.cookie('seen_cookie_message') === null);

    if (hasCookieMessage) {
      message.style.display = 'block';
      GOVUK.cookie('seen_cookie_message', 'yes', { days: 28 });
    }
  };
}).call(this);

(function () {
  "use strict"
  var root = this;
  if(typeof root.GOVUK === 'undefined') { root.GOVUK = {}; }

  /*
    Cookie methods
    ==============

    Usage:

      Setting a cookie:
      GOVUK.cookie('hobnob', 'tasty', { days: 30 });

      Reading a cookie:
      GOVUK.cookie('hobnob');

      Deleting a cookie:
      GOVUK.cookie('hobnob', null);
  */
  GOVUK.cookie = function (name, value, options) {
    if(typeof value !== 'undefined'){
      if(value === false || value === null) {
        return GOVUK.setCookie(name, '', { days: -1 });
      } else {
        return GOVUK.setCookie(name, value, options);
      }
    } else {
      return GOVUK.getCookie(name);
    }
  };
  GOVUK.setCookie = function (name, value, options) {
    if(typeof options === 'undefined') {
      options = {};
    }
    var cookieString = name + "=" + value + "; path=/";
    if (options.days) {
      var date = new Date();
      date.setTime(date.getTime() + (options.days * 24 * 60 * 60 * 1000));
      cookieString = cookieString + "; expires=" + date.toGMTString();
    }
    if (document.location.protocol == 'https:'){
      cookieString = cookieString + "; Secure";
    }
    document.cookie = cookieString;
  };
  GOVUK.getCookie = function (name) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split(';');
    for(var i = 0, len = cookies.length; i < len; i++) {
      var cookie = cookies[i];
      while (cookie.charAt(0) == ' ') {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  };
}).call(this);

(function() {
  "use strict"

  // fix for printing bug in Windows Safari
  var windowsSafari = (window.navigator.userAgent.match(/(\(Windows[\s\w\.]+\))[\/\(\s\w\.\,\)]+(Version\/[\d\.]+)\s(Safari\/[\d\.]+)/) !== null),
      style;

  if (windowsSafari) {
    // set the New Transport font to Arial for printing
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('media', 'print');
    style.innerHTML = '@font-face { font-family: nta !important; src: local("Arial") !important; }';
    document.getElementsByTagName('head')[0].appendChild(style);
  }


  // add cookie message
  if (window.GOVUK && GOVUK.addCookieMessage) {
    GOVUK.addCookieMessage();
  }

  // header navigation toggle
  if (document.querySelectorAll){
    var els = document.querySelectorAll('.js-header-toggle'),
        i, _i;
    for(i=0,_i=els.length; i<_i; i++){
      els[i].addEventListener('click', function(e){
        e.preventDefault();
        var target = document.getElementById(this.getAttribute('href').substr(1)),
            targetClass = target.getAttribute('class') || '',
            sourceClass = this.getAttribute('class') || '';

        if(targetClass.indexOf('js-visible') !== -1){
          target.setAttribute('class', targetClass.replace(/(^|\s)js-visible(\s|$)/, ''));
        } else {
          target.setAttribute('class', targetClass + " js-visible");
        }
        if(sourceClass.indexOf('js-hidden') !== -1){
          this.setAttribute('class', sourceClass.replace(/(^|\s)js-hidden(\s|$)/, ''));
        } else {
          this.setAttribute('class', sourceClass + " js-hidden");
        }
      });
    }
  }
}).call(this);

//= require cookie-functions
//= require cookie-bar
//= require core

(function() {
  "use strict";
  window.GOVUK = window.GOVUK || {};
  var $ = window.$;

  // A multivariate test framework
  //
  // Based loosely on https://github.com/jamesyu/cohorts
  //
  // Full documentation is in README.md.
  //
  function MultivariateTest(options) {
    this.$el = $(options.el);
    this._loadOption(options, 'name');
    this._loadOption(options, 'customVarIndex');
    this._loadOption(options, 'cohorts');
    this._loadOption(options, 'runImmediately', true);

    if (this.runImmediately) {
      this.run();
    }
  }

  MultivariateTest.prototype._loadOption = function(options, key, defaultValue) {
    if (options[key] !== undefined) {
      this[key] = options[key];
    }
    if (this[key] === undefined) {
      if (defaultValue === undefined) {
        throw new Error(key+" option is required for a multivariate test");
      }
      else {
        this[key] = defaultValue;
      }
    }
  };

  MultivariateTest.prototype.run = function() {
    var cohort = this.getCohort();
    if (cohort) {
      this.setCustomVar(cohort);
      this.executeCohort(cohort);
    }
  };

  MultivariateTest.prototype.executeCohort = function(cohort) {
    var cohortObj = this.cohorts[cohort];
    if (cohortObj.callback) {
      if (typeof cohortObj.callback === "string") {
        this[cohortObj.callback]();
      }
      else {
        cohortObj.callback();
      }
    }
    if (cohortObj.html) {
      this.$el.html(cohortObj.html);
      this.$el.show();
    }
  };

  // Get the current cohort or assign one if it has not been already
  MultivariateTest.prototype.getCohort = function() {
    var cohort = GOVUK.cookie(this.cookieName());
    if (!cohort || !this.cohorts[cohort]) {
      cohort = this.chooseRandomCohort();
      GOVUK.cookie(this.cookieName(), cohort, {days: 30});
    }
    return cohort;
  };

  MultivariateTest.prototype.setCustomVar = function(cohort) {
    window._gaq = window._gaq || [];
    window._gaq.push([
      '_setCustomVar',
      this.customVarIndex,
      this.cookieName(),
      cohort,
      2 // session level
    ]);
    // Fire off a dummy event to set the custom var on the page.
    // Ideally we'd be able to call setCustomVar before trackPageview,
    // but would need reordering the existing GA code.
    window._gaq.push(['_trackEvent', this.cookieName(), 'run', '-', 0, true]);
  };

  MultivariateTest.prototype.cohortNames = function() {
    return $.map(this.cohorts, function(v, i) { return i; });
  };

  MultivariateTest.prototype.chooseRandomCohort = function() {
    var names = this.cohortNames();
    return names[Math.floor(Math.random() * names.length)];
  };

  MultivariateTest.prototype.cookieName = function() {
    return "multivariatetest_cohort_" + this.name;
  };

  window.GOVUK.MultivariateTest = MultivariateTest;
}());

// Stop scrolling at footer.
//
// This can be added to elements with `position: fixed` to stop them from
// overflowing on the footer.
//
// Usage:
//
//    GOVUK.stopScrollingAtFooter.addEl($(node), $(node).height());
//
// Height is passed in separatly incase the scrolling element has no height
// itself.


(function () {
  "use strict"
  var root = this,
      $ = root.jQuery;
  if(typeof root.GOVUK === 'undefined') { root.GOVUK = {}; }

  var stopScrollingAtFooter = {
    _pollingId: null,
    _isPolling: false,
    _hasScrollEvt: false,
    _els: [],

    addEl: function($fixedEl, height){
      var fixedOffset;

      if(!$fixedEl.length) { return; }

      fixedOffset = parseInt($fixedEl.css('top'), 10);
      fixedOffset = isNaN(fixedOffset) ? 0 : fixedOffset;

      stopScrollingAtFooter.updateFooterTop();
      $(root).on('govuk.pageSizeChanged', stopScrollingAtFooter.updateFooterTop);

      var $siblingEl = $('<div></div>');
      $siblingEl.insertBefore($fixedEl);
      var fixedTop = $siblingEl.offset().top - $siblingEl.position().top;
      $siblingEl.remove();

      var el = {
        $fixedEl: $fixedEl,
        height: height + fixedOffset,
        fixedTop: height + fixedTop,
        state: 'fixed'
      };
      stopScrollingAtFooter._els.push(el);

      stopScrollingAtFooter.initTimeout();
    },
    updateFooterTop: function(){
      var footer = $('.js-footer:eq(0)');
      if (footer.length === 0) {
        return 0;
      }
      stopScrollingAtFooter.footerTop = footer.offset().top - 10;
    },
    initTimeout: function(){
      if(stopScrollingAtFooter._hasScrollEvt === false) {
        $(window).scroll(stopScrollingAtFooter.onScroll);
        stopScrollingAtFooter._hasScrollEvt = true;
      }
    },
    onScroll: function(){
      if (stopScrollingAtFooter._isPolling === false) { 
        stopScrollingAtFooter.startPolling();
      }
    },
    startPolling: (function(){
      if (window.requestAnimationFrame) {
        return (function(){
          var callback = function(){
            stopScrollingAtFooter.checkScroll();
            if (stopScrollingAtFooter._isPolling === true) {
              stopScrollingAtFooter.startPolling();
            }
          };
          stopScrollingAtFooter._pollingId = window.requestAnimationFrame(callback);
          stopScrollingAtFooter._isPolling = true;
        });
      } else {
        return (function(){
          stopScrollingAtFooter._pollingId = window.setInterval(stopScrollingAtFooter.checkScroll, 16);
          stopScrollingAtFooter._isPolling = true;
        });
      }
    }()),
    stopPolling: (function(){
      if (window.requestAnimationFrame) {
        return (function(){
          window.cancelAnimationFrame(stopScrollingAtFooter._pollingId);
          stopScrollingAtFooter._isPolling = false;
        });
      } else {
        return (function(){
          window.clearInterval(stopScrollingAtFooter._pollingId);
          stopScrollingAtFooter._isPolling = false;
        });
      }
    }()),
    checkScroll: function(){
      var cachedScrollTop = $(window).scrollTop();
      if ((cachedScrollTop < (stopScrollingAtFooter.cachedScrollTop + 2)) && (cachedScrollTop > (stopScrollingAtFooter.cachedScrollTop - 2))) {
        stopScrollingAtFooter.stopPolling();
        return;
      } else {
        stopScrollingAtFooter.cachedScrollTop = cachedScrollTop;
      }

      $.each(stopScrollingAtFooter._els, function(i, el){
        var bottomOfEl = cachedScrollTop + el.height;

        if (bottomOfEl > stopScrollingAtFooter.footerTop){
          stopScrollingAtFooter.stick(el);
        } else {
          stopScrollingAtFooter.unstick(el);
        }
      });
    },
    stick: function(el){
      if(el.state === 'fixed' && el.$fixedEl.css('position') === 'fixed'){
        el.$fixedEl.css({ 'position': 'absolute', 'top': stopScrollingAtFooter.footerTop - el.fixedTop });
        el.state = 'absolute';
      }
    },
    unstick: function(el){
      if(el.state === 'absolute'){
        el.$fixedEl.css({ 'position': '', 'top': '' });
        el.state = 'fixed';
      }
    }
  };

  root.GOVUK.stopScrollingAtFooter = stopScrollingAtFooter;

  $(root).load(function(){ $(root).trigger('govuk.pageSizeChanged'); });
}).call(this);

//= require_tree ./govuk

//= require vendor/html5shiv.js
//= require vendor/html5shiv-printshiv.js

//= require html5
//= require vendor/json2

// Tabs modules for MOJ
// Dependencies: moj, jQuery

(function () {
  'use strict';

  /*
    Cookie methods
    ==============
    Usage:
      Setting a cookie:
      moj.Modules.Cookie.set('foo', 'bar', { days: 30 });

      Reading a cookie:
      moj.Modules.Cookie.get('foo');

      Removing a cookie:
      moj.Modules.Cookie.remove('foo');
  */
  var Cookie = function () {};

  Cookie.prototype = {
    set: function (name, value, options){
      if (typeof options === 'undefined') {
        options = {};
      }
      var cookieString = name + '=' + value + '; path=/',
          date;
      if (options.days) {
        date = new Date();
        date.setTime(date.getTime() + (options.days * 24 * 60 * 60 * 1000));
        cookieString = cookieString + '; expires=' + date.toGMTString();
      }
      if (document.location.protocol === 'https:') {
        cookieString = cookieString + '; Secure';
      }
      document.cookie = cookieString;
    },

    get: function (name){
      var nameEQ = name + '=',
          cookies = document.cookie.split(';'),
          i, len, cookie;
      // moj.log(cookies);
      for (i = 0, len = cookies.length; i < len;) {
        cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length));
        }
        i += 1;
      }
      return null;
    },

    remove: function (name){
      if (moj.Modules.Cookie.get(name) === undefined) {
        return false;
      }

      // Must not alter options, thus extending a fresh object...
      moj.Modules.Cookie.set(name, '', { days: -1 });
      return !moj.Modules.Cookie.get(name);
    }
  };

  moj.Modules.Cookie = new Cookie();

  moj.Modules.CookieMessage = {
    init: function () {
      var message = document.getElementById('global-cookie-message'),
          needsCookieMessage = (message && moj.Modules.Cookie.get('seen_cookie_message') === null);

      if (needsCookieMessage) {
        message.style.display = 'block';
        moj.Modules.Cookie.set('seen_cookie_message', 'yes', { days: 28 });
      }
    }
  };
}());
// Tabs modules for MOJ
// Dependencies: moj, jQuery

(function () {
  'use strict';

  // Define the class
  var Tabs = function (el, options) {
    this.settings = $.extend({}, this.defaults, options);
    this._cacheEls(el);
    this._bindEvents();
    if (this.settings.activatefirst) {
      this._activateFirstLink();
    } else {
      this._activatePane('*');
    }
  };

  Tabs.prototype = {

    defaults: {
      activatefirst: true,
      focusfirst: false,
      activetabclass: 'is-active',
      activepaneclass: 'is-active',
      activetabelement: 'li'
    },

    _cacheEls: function (wrap) {
      this.$tabNav = $('.js-tabs-nav', wrap).first();
      this.$tabs = $('a', this.$tabNav);
      this.$tabPanes = $('.js-tabs-content', wrap).first().children();
    },

    _bindEvents: function () {
      // store a reference to obj before 'this' becomes jQuery obj
      var self = this;

      this.$tabs.on('click', function (e) {
        e.preventDefault();
        self._activateTab($(this));
        self._activatePane($(this).attr('href'));
      });
    },

    _activateTab: function (activeLink) {
      var c = this.settings.activetabclass,
        e = this.settings.activetabelement;

      this.$tabs.closest(e).removeClass(c);
      this.$tabs.filter(activeLink).closest(e).addClass(c);
    },

    _activatePane: function (hash) {
      var shown = this
                    .$tabPanes.removeClass(this.settings.activepaneclass)
                    .filter(hash).addClass(this.settings.activepaneclass);

      if (this.settings.focusfirst) {
        this._focusFirstElement(shown);
      }
    },

    _activateFirstLink: function () {
      // activate first tab
      this.$tabNav.find('li').first().find('a').click();
    },

    _focusFirstElement: function (el) {
      el.find('a, input, textarea, select, button, [tabindex]').not(':disabled').first().focus();
    }

  };

  // Add module to MOJ namespace
  moj.Modules.tabs = {
    init: function () {
      $('.js-tabs').each(function () {
        $(this).data('moj.tabs', new Tabs($(this), $(this).data()));
      });
    }
  };
}());
(function(){
  'use strict';

  var moj = {

    Modules: {},

    Helpers: {},

    Events: $({}),

    init: function () {
      for (var x in moj.Modules) {
        if (typeof moj.Modules[x].init === 'function') {
          moj.Modules[x].init();
        }
      }
      // trigger initial render event
      moj.Events.trigger('render');
    },

    // safe logging
    log: function (msg) {
      if (window && window.console) {
        window.console.log(msg);
      }
    },
    dir: function (obj) {
      if (window && window.console) {
        window.console.dir(obj);
      }
    }

  };

  window.moj = moj;
}());

// Stageprompt 2.0.1
// 
// See: https://github.com/alphagov/stageprompt
// 
// Stageprompt allows user journeys to be described and instrumented 
// using data attributes.
// 
// Setup (run this on document ready):
// 
//   GOVUK.performance.stageprompt.setupForGoogleAnalytics();
// 
// Usage:
// 
//   Sending events on page load:
// 
//     <div id="wrapper" class="service" data-journey="pay-register-birth-abroad:start">
//         [...]
//     </div>
//     
//   Sending events on click:
//   
//     <a class="help-button" href="#" data-journey-click="stage:help:info">See more info...</a>

var GOVUK = GOVUK || {};

GOVUK.performance = GOVUK.performance || {};

GOVUK.performance.stageprompt = (function () {

  var setup, setupForGoogleAnalytics, splitAction;

  splitAction = function (action) {
    var parts = action.split(':');
    if (parts.length <= 3) return parts;
    return [parts.shift(), parts.shift(), parts.join(':')];
  };

  setup = function (analyticsCallback) {
    var journeyStage = $('[data-journey]').attr('data-journey'),
        journeyHelpers = $('[data-journey-click]');

    if (journeyStage) {
      analyticsCallback.apply(null, splitAction(journeyStage));
    }
    
    journeyHelpers.on('click', function (event) {
      analyticsCallback.apply(null, splitAction($(this).data('journey-click')));
    });
  };
  
  setupForGoogleAnalytics = function () {
    setup(GOVUK.performance.sendGoogleAnalyticsEvent);
  };

  return {
    setup: setup,
    setupForGoogleAnalytics: setupForGoogleAnalytics
  };
}());

GOVUK.performance.sendGoogleAnalyticsEvent = function (category, event, label) {
  _gaq.push(['_trackEvent', category, event, label, undefined, true]);
};

var webfont = {};

/**
 * @param {Object} context
 * @param {function(...)} func
 * @param {...*} opt_args
 */
webfont.bind = function(context, func, opt_args) {
  var args = arguments.length > 2 ?
      Array.prototype.slice.call(arguments, 2) : [];

  return function() {
    args.push.apply(args, arguments);
    return func.apply(context, args);
  };
};

webfont.extendsClass = function(baseClass, subClass) {

  // Avoid polluting the baseClass prototype object with methods from the
  // subClass
  /** @constructor */
  function baseExtendClass() {};
  baseExtendClass.prototype = baseClass.prototype;
  subClass.prototype = new baseExtendClass();

  subClass.prototype.constructor = subClass;
  subClass.superCtor_ = baseClass;
  subClass.super_ = baseClass.prototype;
};

/**
 * Handles common DOM manipulation tasks. The aim of this library is to cover
 * the needs of typical font loading. Not more, not less.
 * @param {HTMLDocument} doc The HTML document we'll manipulate.
 * @param {webfont.UserAgent} userAgent The current user agent.
 * @constructor
 */
webfont.DomHelper = function(doc, userAgent) {
  this.document_ = doc;
  this.userAgent_ = userAgent;
};

/**
 * Creates an element.
 * @param {string} elem The element type.
 * @param {Object=} opt_attr A hash of attribute key/value pairs.
 * @param {string=} opt_innerHtml Contents of the element.
 * @return {Element} the new element.
 */
webfont.DomHelper.prototype.createElement = function(elem, opt_attr,
    opt_innerHtml) {
  var domElement = this.document_.createElement(elem);

  if (opt_attr) {
    for (var attr in opt_attr) {
      // protect against native prototype augmentations
      if (opt_attr.hasOwnProperty(attr)) {
        if (attr == "style") {
          this.setStyle(domElement, opt_attr[attr]);
	} else {
          domElement.setAttribute(attr, opt_attr[attr]);
        }
      }
    }
  }
  if (opt_innerHtml) {
    domElement.appendChild(this.document_.createTextNode(opt_innerHtml));
  }
  return domElement;
};

/**
 * Inserts an element into the document. This is intended for unambiguous
 * elements such as html, body, head.
 * @param {string} tagName The element name.
 * @param {Element} e The element to append.
 * @return {boolean} True if the element was inserted.
 */
webfont.DomHelper.prototype.insertInto = function(tagName, e) {
  var t = this.document_.getElementsByTagName(tagName)[0];

  if (!t) { // opera allows documents without a head
    t = document.documentElement;
  }

  if (t && t.lastChild) {
    // This is safer than appendChild in IE. appendChild causes random
    // JS errors in IE. Sometimes errors in other JS exectution, sometimes
    // complete 'This page cannot be displayed' errors. For our purposes,
    // it's equivalent because we don't need to insert at any specific
    // location.
    t.insertBefore(e, t.lastChild);
    return true;
  }
  return false;
};

/**
 * Calls a function when the body tag exists.
 * @param {function()} callback The function to call.
 */
webfont.DomHelper.prototype.whenBodyExists = function(callback) {
  var check = function() {
    if (document.body) {
      callback();
    } else {
      setTimeout(check, 0);
    }
  }
  check();
};

/**
 * Removes an element from the DOM.
 * @param {Element} node The element to remove.
 * @return {boolean} True if the element was removed.
 */
webfont.DomHelper.prototype.removeElement = function(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
    return true;
  }
  return false;
};

/**
 * Creates a link to a CSS document.
 * @param {string} src The URL of the stylesheet.
 * @return {Element} a link element.
 */
webfont.DomHelper.prototype.createCssLink = function(src) {
  return this.createElement('link', {
    'rel': 'stylesheet',
    'href': src
  });
};

/**
 * Creates a link to a javascript document.
 * @param {string} src The URL of the script.
 * @return {Element} a script element.
 */
webfont.DomHelper.prototype.createScriptSrc = function(src) {
  return this.createElement('script', {
    'src': src
  });
};

/**
 * Appends a name to an element's class attribute.
 * @param {Element} e The element.
 * @param {string} name The class name to add.
 */
webfont.DomHelper.prototype.appendClassName = function(e, name) {
  var classes = e.className.split(/\s+/);
  for (var i = 0, len = classes.length; i < len; i++) {
    if (classes[i] == name) {
      return;
    }
  }
  classes.push(name);
  e.className = classes.join(' ').replace(/^\s+/, '');
};

/**
 * Removes a name to an element's class attribute.
 * @param {Element} e The element.
 * @param {string} name The class name to remove.
 */
webfont.DomHelper.prototype.removeClassName = function(e, name) {
  var classes = e.className.split(/\s+/);
  var remainingClasses = [];
  for (var i = 0, len = classes.length; i < len; i++) {
    if (classes[i] != name) {
      remainingClasses.push(classes[i]);
    }
  }
  e.className = remainingClasses.join(' ').replace(/^\s+/, '')
      .replace(/\s+$/, '');
};

/**
 * Returns true if an element has a given class name and false otherwise.
 * @param {Element} e The element.
 * @param {string} name The class name to check for.
 * @return {boolean} Whether or not the element has this class name.
 */
webfont.DomHelper.prototype.hasClassName = function(e, name) {
  var classes = e.className.split(/\s+/);
  for (var i = 0, len = classes.length; i < len; i++) {
    if (classes[i] == name) {
      return true;
    }
  }
  return false;
};

/**
 * Sets the style attribute on an element.
 * @param {Element} e The element.
 * @param {string} styleString The style string.
 */
webfont.DomHelper.prototype.setStyle = function(e, styleString) {
  if (this.userAgent_.getName() == "MSIE") {
    e.style.cssText = styleString;
  } else {
    e.setAttribute("style", styleString);
  }
};

/**
 * @param {string} name
 * @param {string} version
 * @param {string} engine
 * @param {string} engineVersion
 * @param {string} platform
 * @param {string} platformVersion
 * @param {number|undefined} documentMode
 * @param {boolean} webFontSupport
 * @constructor
 */
webfont.UserAgent = function(name, version, engine, engineVersion, platform,
    platformVersion, documentMode, webFontSupport) {
  this.name_ = name;
  this.version_ = version;
  this.engine_ = engine;
  this.engineVersion_ = engineVersion;
  this.platform_ = platform;
  this.platformVersion_ = platformVersion;
  this.documentMode_ = documentMode;
  this.webFontSupport_ = webFontSupport;
};

/**
 * @return {string}
 */
webfont.UserAgent.prototype.getName = function() {
  return this.name_;
};

/**
 * @return {string}
 */
webfont.UserAgent.prototype.getVersion = function() {
  return this.version_;
};

/**
 * @return {string}
 */
webfont.UserAgent.prototype.getEngine = function() {
  return this.engine_;
};

/**
 * @return {string}
 */
webfont.UserAgent.prototype.getEngineVersion = function() {
  return this.engineVersion_;
};

/**
 * @return {string}
 */
webfont.UserAgent.prototype.getPlatform = function() {
  return this.platform_;
};

/**
 * @return {string}
 */
webfont.UserAgent.prototype.getPlatformVersion = function() {
  return this.platformVersion_;
};

/**
 * @return {number|undefined}
 */
webfont.UserAgent.prototype.getDocumentMode = function() {
  return this.documentMode_;
};

/**
 * @return {boolean}
 */
webfont.UserAgent.prototype.isSupportingWebFont = function() {
  return this.webFontSupport_;
};

/**
 * @param {string} userAgent The browser userAgent string to parse.
 * @constructor
 */
webfont.UserAgentParser = function(userAgent, doc) {
  this.userAgent_ = userAgent;
  this.doc_ = doc;
};

/**
 * @const
 * @type {string}
 */
webfont.UserAgentParser.UNKNOWN = "Unknown";

/**
 * @const
 * @type {webfont.UserAgent}
 */
webfont.UserAgentParser.UNKNOWN_USER_AGENT = new webfont.UserAgent(
    webfont.UserAgentParser.UNKNOWN,
    webfont.UserAgentParser.UNKNOWN,
    webfont.UserAgentParser.UNKNOWN,
    webfont.UserAgentParser.UNKNOWN,
    webfont.UserAgentParser.UNKNOWN,
    webfont.UserAgentParser.UNKNOWN,
    undefined,
    false);

/**
 * Parses the user agent string and returns an object.
 * @return {webfont.UserAgent}
 */
webfont.UserAgentParser.prototype.parse = function() {
  if (this.isIe_()) {
    return this.parseIeUserAgentString_();
  } else if (this.isOpera_()) {
    return this.parseOperaUserAgentString_();
  } else if (this.isWebKit_()) {
    return this.parseWebKitUserAgentString_();
  } else if (this.isGecko_()) {
    return this.parseGeckoUserAgentString_();
  } else {
    return webfont.UserAgentParser.UNKNOWN_USER_AGENT;
  }
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.getPlatform_ = function() {
  var mobileOs = this.getMatchingGroup_(this.userAgent_,
      /(iPod|iPad|iPhone|Android)/, 1);

  if (mobileOs != "") {
    return mobileOs;
  }
  var os = this.getMatchingGroup_(this.userAgent_,
      /(Linux|Mac_PowerPC|Macintosh|Windows)/, 1);

  if (os != "") {
    if (os == "Mac_PowerPC") {
      os = "Macintosh";
    }
    return os;
  }
  return webfont.UserAgentParser.UNKNOWN;
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.getPlatformVersion_ = function() {
  var macVersion = this.getMatchingGroup_(this.userAgent_,
      /(OS X|Windows NT|Android) ([^;)]+)/, 2);
  if (macVersion) {
    return macVersion;
  }
  var iVersion = this.getMatchingGroup_(this.userAgent_,
      /(iPhone )?OS ([\d_]+)/, 2);
  if (iVersion) {
    return iVersion;
  }
  var linuxVersion = this.getMatchingGroup_(this.userAgent_,
      /Linux ([i\d]+)/, 1);
  if (linuxVersion) {
    return linuxVersion;
  }

  return webfont.UserAgentParser.UNKNOWN;
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.isIe_ = function() {
  return this.userAgent_.indexOf("MSIE") != -1;
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.parseIeUserAgentString_ = function() {
  var browser = this.getMatchingGroup_(this.userAgent_, /(MSIE [\d\w\.]+)/, 1);
  var engineName = webfont.UserAgentParser.UNKNOWN;
  var engineVersion = webfont.UserAgentParser.UNKNOWN;

  if (browser != "") {
    var pair = browser.split(' ');
    var name = pair[0];
    var version = pair[1];

    // For IE we give MSIE as the engine name and the version of IE
    // instead of the specific Trident engine name and version
    return new webfont.UserAgent(name, version, name, version,
        this.getPlatform_(), this.getPlatformVersion_(),
        this.getDocumentMode_(this.doc_), this.getMajorVersion_(version) >= 6);
  }
  return new webfont.UserAgent("MSIE", webfont.UserAgentParser.UNKNOWN,
      "MSIE", webfont.UserAgentParser.UNKNOWN,
      this.getPlatform_(), this.getPlatformVersion_(),
      this.getDocumentMode_(this.doc_), false);
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.isOpera_ = function() {
  return this.userAgent_.indexOf("Opera") != -1;
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.parseOperaUserAgentString_ = function() {
  var engineName = webfont.UserAgentParser.UNKNOWN;
  var engineVersion = webfont.UserAgentParser.UNKNOWN;
  var enginePair = this.getMatchingGroup_(this.userAgent_,
      /(Presto\/[\d\w\.]+)/, 1);

  if (enginePair != "") {
    var splittedEnginePair = enginePair.split('/');

    engineName = splittedEnginePair[0];
    engineVersion = splittedEnginePair[1];
  } else {
    if (this.userAgent_.indexOf("Gecko") != -1) {
      engineName = "Gecko";
    }
    var geckoVersion = this.getMatchingGroup_(this.userAgent_, /rv:([^\)]+)/, 1);

    if (geckoVersion != "") {
      engineVersion = geckoVersion;
    }
  }
  if (this.userAgent_.indexOf("Version/") != -1) {
    var version = this.getMatchingGroup_(this.userAgent_, /Version\/([\d\.]+)/, 1);

    if (version != "") {
      return new webfont.UserAgent("Opera", version, engineName, engineVersion,
          this.getPlatform_(), this.getPlatformVersion_(),
          this.getDocumentMode_(this.doc_), this.getMajorVersion_(version) >= 10);
    }
  }
  var version = this.getMatchingGroup_(this.userAgent_, /Opera[\/ ]([\d\.]+)/, 1);

  if (version != "") {
    return new webfont.UserAgent("Opera", version, engineName, engineVersion,
        this.getPlatform_(), this.getPlatformVersion_(),
        this.getDocumentMode_(this.doc_), this.getMajorVersion_(version) >= 10);
  }
  return new webfont.UserAgent("Opera", webfont.UserAgentParser.UNKNOWN,
      engineName, engineVersion, this.getPlatform_(),
      this.getPlatformVersion_(), this.getDocumentMode_(this.doc_), false);
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.isWebKit_ = function() {
  return this.userAgent_.indexOf("AppleWebKit") != -1;
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.parseWebKitUserAgentString_ = function() {
  var platform = this.getPlatform_();
  var platformVersion = this.getPlatformVersion_();
  var webKitVersion = this.getMatchingGroup_(this.userAgent_,
      /AppleWebKit\/([\d\.\+]+)/, 1);

  if (webKitVersion == "") {
    webKitVersion = webfont.UserAgentParser.UNKNOWN;
  }
  var name = webfont.UserAgentParser.UNKNOWN;

  if (this.userAgent_.indexOf("Chrome") != -1) {
    name = "Chrome";
  } else if (this.userAgent_.indexOf("Safari") != -1) {
    name = "Safari";
  } else if (this.userAgent_.indexOf("AdobeAIR") != -1) {
    name = "AdobeAIR";
  }
  var version = webfont.UserAgentParser.UNKNOWN;

  if (this.userAgent_.indexOf("Version/") != -1) {
    version = this.getMatchingGroup_(this.userAgent_,
        /Version\/([\d\.\w]+)/, 1);
  } else if (name == "Chrome") {
    version = this.getMatchingGroup_(this.userAgent_,
        /Chrome\/([\d\.]+)/, 1);
  } else if (name == "AdobeAIR") {
    version = this.getMatchingGroup_(this.userAgent_,
        /AdobeAIR\/([\d\.]+)/, 1);
  }
  var supportWebFont = false;
  if (name == "AdobeAIR") {
    var minor = this.getMatchingGroup_(version, /\d+\.(\d+)/, 1);
    supportWebFont = this.getMajorVersion_(version) > 2 ||
      this.getMajorVersion_(version) == 2 && parseInt(minor, 10) >= 5;
  } else {
    var minor = this.getMatchingGroup_(webKitVersion, /\d+\.(\d+)/, 1);
    supportWebFont = this.getMajorVersion_(webKitVersion) >= 526 ||
      this.getMajorVersion_(webKitVersion) >= 525 && parseInt(minor, 10) >= 13;
  }

  return new webfont.UserAgent(name, version, "AppleWebKit", webKitVersion,
      platform, platformVersion, this.getDocumentMode_(this.doc_), supportWebFont);
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.isGecko_ = function() {
  return this.userAgent_.indexOf("Gecko") != -1;
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.parseGeckoUserAgentString_ = function() {
  var name = webfont.UserAgentParser.UNKNOWN;
  var version = webfont.UserAgentParser.UNKNOWN;
  var supportWebFont = false;

  if (this.userAgent_.indexOf("Firefox") != -1) {
    name = "Firefox";
    var versionNum = this.getMatchingGroup_(this.userAgent_,
        /Firefox\/([\d\w\.]+)/, 1);

    if (versionNum != "") {
      var minor = this.getMatchingGroup_(versionNum, /\d+\.(\d+)/, 1);

      version = versionNum;
      supportWebFont = versionNum != "" && this.getMajorVersion_(versionNum) >= 3 &&
          parseInt(minor, 10) >= 5;
    }
  } else if (this.userAgent_.indexOf("Mozilla") != -1) {
    name = "Mozilla";
  }
  var geckoVersion = this.getMatchingGroup_(this.userAgent_, /rv:([^\)]+)/, 1);

  if (geckoVersion == "") {
    geckoVersion = webfont.UserAgentParser.UNKNOWN;
  } else {
    if (!supportWebFont) {
      var majorVersion = this.getMajorVersion_(geckoVersion);
      var intMinorVersion = parseInt(this.getMatchingGroup_(geckoVersion, /\d+\.(\d+)/, 1), 10);
      var subVersion = parseInt(this.getMatchingGroup_(geckoVersion, /\d+\.\d+\.(\d+)/, 1), 10);

      supportWebFont = majorVersion > 1 ||
          majorVersion == 1 && intMinorVersion > 9 ||
          majorVersion == 1 && intMinorVersion == 9 && subVersion >= 2 ||
          geckoVersion.match(/1\.9\.1b[123]/) != null ||
          geckoVersion.match(/1\.9\.1\.[\d\.]+/) != null;
    }
  }
  return new webfont.UserAgent(name, version, "Gecko", geckoVersion,
      this.getPlatform_(), this.getPlatformVersion_(), this.getDocumentMode_(this.doc_),
      supportWebFont);
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.getMajorVersion_ = function(version) {
  var majorVersion = this.getMatchingGroup_(version, /(\d+)/, 1);

  if (majorVersion != "") {
    return parseInt(majorVersion, 10);
  }
  return -1;
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.getMatchingGroup_ = function(str,
    regexp, index) {
  var groups = str.match(regexp);

  if (groups && groups[index]) {
    return groups[index];
  }
  return "";
};

/**
 * @private
 */
webfont.UserAgentParser.prototype.getDocumentMode_ = function(doc) {
  if (doc.documentMode) return doc.documentMode;
  return undefined;
};

/**
 * A class to dispatch events and manage the event class names on an html
 * element that represent the current state of fonts on the page. Active class
 * names always overwrite inactive class names of the same type, while loading
 * class names may be present whenever a font is loading (regardless of if an
 * associated active or inactive class name is also present).
 * @param {webfont.DomHelper} domHelper
 * @param {HTMLElement} htmlElement
 * @param {Object} callbacks
 * @param {string=} opt_namespace
 * @constructor
 */
webfont.EventDispatcher = function(domHelper, htmlElement, callbacks,
    opt_namespace) {
  this.domHelper_ = domHelper;
  this.htmlElement_ = htmlElement;
  this.callbacks_ = callbacks;
  this.namespace_ = opt_namespace || webfont.EventDispatcher.DEFAULT_NAMESPACE;
  this.cssClassName_ = new webfont.CssClassName('-');
};

/**
 * @const
 * @type {string}
 */
webfont.EventDispatcher.DEFAULT_NAMESPACE = 'wf';

/**
 * @const
 * @type {string}
 */
webfont.EventDispatcher.LOADING = 'loading';

/**
 * @const
 * @type {string}
 */
webfont.EventDispatcher.ACTIVE = 'active';

/**
 * @const
 * @type {string}
 */
webfont.EventDispatcher.INACTIVE = 'inactive';

/**
 * @const
 * @type {string}
 */
webfont.EventDispatcher.FONT = 'font';

/**
 * Dispatch the loading event and append the loading class name.
 */
webfont.EventDispatcher.prototype.dispatchLoading = function() {
  this.domHelper_.appendClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, webfont.EventDispatcher.LOADING));
  this.dispatch_(webfont.EventDispatcher.LOADING);
};

/**
 * Dispatch the font loading event and append the font loading class name.
 * @param {string} fontFamily
 * @param {string} fontDescription
 */
webfont.EventDispatcher.prototype.dispatchFontLoading = function(fontFamily, fontDescription) {
  this.domHelper_.appendClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, fontFamily, fontDescription, webfont.EventDispatcher.LOADING));
  this.dispatch_(
      webfont.EventDispatcher.FONT + webfont.EventDispatcher.LOADING, fontFamily, fontDescription);
};

/**
 * Dispatch the font active event, remove the font loading class name, remove
 * the font inactive class name, and append the font active class name.
 * @param {string} fontFamily
 * @param {string} fontDescription
 */
webfont.EventDispatcher.prototype.dispatchFontActive = function(fontFamily, fontDescription) {
  this.domHelper_.removeClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, fontFamily, fontDescription, webfont.EventDispatcher.LOADING));
  this.domHelper_.removeClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, fontFamily, fontDescription, webfont.EventDispatcher.INACTIVE));
  this.domHelper_.appendClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, fontFamily, fontDescription, webfont.EventDispatcher.ACTIVE));
  this.dispatch_(
      webfont.EventDispatcher.FONT + webfont.EventDispatcher.ACTIVE, fontFamily, fontDescription);
};

/**
 * Dispatch the font inactive event, remove the font loading class name, and
 * append the font inactive class name (unless the font active class name is
 * already present).
 * @param {string} fontFamily
 * @param {string} fontDescription
 */
webfont.EventDispatcher.prototype.dispatchFontInactive = function(fontFamily, fontDescription) {
  this.domHelper_.removeClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, fontFamily, fontDescription, webfont.EventDispatcher.LOADING));
  var hasFontActive = this.domHelper_.hasClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, fontFamily, fontDescription, webfont.EventDispatcher.ACTIVE));
  if (!hasFontActive) {
    this.domHelper_.appendClassName(this.htmlElement_,
        this.cssClassName_.build(
            this.namespace_, fontFamily, fontDescription, webfont.EventDispatcher.INACTIVE));
  }
  this.dispatch_(
      webfont.EventDispatcher.FONT + webfont.EventDispatcher.INACTIVE, fontFamily, fontDescription);
};

/**
 * Dispatch the inactive event, remove the loading class name, and append the
 * inactive class name (unless the active class name is already present).
 */
webfont.EventDispatcher.prototype.dispatchInactive = function() {
  this.domHelper_.removeClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, webfont.EventDispatcher.LOADING));
  var hasActive = this.domHelper_.hasClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, webfont.EventDispatcher.ACTIVE));
  if (!hasActive) {
    this.domHelper_.appendClassName(this.htmlElement_,
        this.cssClassName_.build(
          this.namespace_, webfont.EventDispatcher.INACTIVE));
  }
  this.dispatch_(webfont.EventDispatcher.INACTIVE);
};

/**
 * Dispatch the active event, remove the loading class name, remove the inactive
 * class name, and append the active class name.
 */
webfont.EventDispatcher.prototype.dispatchActive = function() {
  this.domHelper_.removeClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, webfont.EventDispatcher.LOADING));
  this.domHelper_.removeClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, webfont.EventDispatcher.INACTIVE));
  this.domHelper_.appendClassName(this.htmlElement_,
      this.cssClassName_.build(
          this.namespace_, webfont.EventDispatcher.ACTIVE));
  this.dispatch_(webfont.EventDispatcher.ACTIVE);
};

/**
 * @param {string} event
 * @param {string=} opt_arg1
 * @param {string=} opt_arg2
 */
webfont.EventDispatcher.prototype.dispatch_ = function(event, opt_arg1, opt_arg2) {
  if (this.callbacks_[event]) {
    this.callbacks_[event](opt_arg1, opt_arg2);
  }
};

/**
 * @constructor
 */
webfont.FontModuleLoader = function() {
  this.modules_ = {};
};

webfont.FontModuleLoader.prototype.addModuleFactory = function(name, factory) {
  this.modules_[name] = factory;
};

webfont.FontModuleLoader.prototype.getModules = function(configuration) {
  var modules = [];

  for (var key in configuration) {
    if (configuration.hasOwnProperty(key)) {
      var moduleFactory = this.modules_[key];

      if (moduleFactory) {
        modules.push(moduleFactory(configuration[key]));
      }
    }
  }
  return modules;
};

/**
 * @constructor
 * @param {webfont.DomHelper} domHelper
 * @param {webfont.EventDispatcher} eventDispatcher
 * @param {Object.<string, function(Object): number>} fontSizer
 * @param {function(function(), number=)} asyncCall
 * @param {function(): number} getTime
 */
webfont.FontWatcher = function(domHelper, eventDispatcher, fontSizer,
    asyncCall, getTime) {
  this.domHelper_ = domHelper;
  this.eventDispatcher_ = eventDispatcher;
  this.fontSizer_ = fontSizer;
  this.asyncCall_ = asyncCall;
  this.getTime_ = getTime;
  this.currentlyWatched_ = 0;
  this.last_ = false;
  this.success_ = false;
};

/**
 * @type {string}
 * @const
 */
webfont.FontWatcher.DEFAULT_VARIATION = 'n4';

/**
 * Watches a set of font families.
 * @param {Array.<string>} fontFamilies The font family names to watch.
 * @param {Object.<string, Array.<string>>} fontDescriptions The font variations
 *     of each family to watch. Described with FVD.
 * @param {Object.<string, string>} fontTestStrings The font test strings for
 *     each family.
 * @param {boolean} last True if this is the last set of families to watch.
 */
webfont.FontWatcher.prototype.watch = function(fontFamilies, fontDescriptions,
    fontTestStrings, fontWatchRunnerCtor, last) {
  var length = fontFamilies.length;

  for (var i = 0; i < length; i++) {
    var fontFamily = fontFamilies[i];
    if (!fontDescriptions[fontFamily]) {
      fontDescriptions[fontFamily] = [webfont.FontWatcher.DEFAULT_VARIATION];
    }
    this.currentlyWatched_ += fontDescriptions[fontFamily].length;
  }

  if (last) {
    this.last_ = last;
  }

  for (var i = 0; i < length; i++) {
    var fontFamily = fontFamilies[i];
    var descriptions = fontDescriptions[fontFamily];
    var fontTestString  = fontTestStrings[fontFamily];

    for (var j = 0, len = descriptions.length; j < len; j++) {
      var fontDescription = descriptions[j];

      this.eventDispatcher_.dispatchFontLoading(fontFamily, fontDescription);

      var activeCallback = webfont.bind(this, this.fontActive_);
      var inactiveCallback = webfont.bind(this, this.fontInactive_)
      var fontWatchRunner = new fontWatchRunnerCtor(activeCallback,
          inactiveCallback, this.domHelper_, this.fontSizer_, this.asyncCall_,
          this.getTime_, fontFamily, fontDescription, fontTestString);

      fontWatchRunner.start();
    }
  }
};

/**
 * Called by a FontWatchRunner when a font has been detected as active.
 * @param {string} fontFamily
 * @param {string} fontDescription
 * @private
 */
webfont.FontWatcher.prototype.fontActive_ = function(fontFamily, fontDescription) {
  this.eventDispatcher_.dispatchFontActive(fontFamily, fontDescription);
  this.success_ = true;
  this.decreaseCurrentlyWatched_();
};

/**
 * Called by a FontWatchRunner when a font has been detected as inactive.
 * @param {string} fontFamily
 * @param {string} fontDescription
 * @private
 */
webfont.FontWatcher.prototype.fontInactive_ = function(fontFamily, fontDescription) {
  this.eventDispatcher_.dispatchFontInactive(fontFamily, fontDescription);
  this.decreaseCurrentlyWatched_();
};

/**
 * @private
 */
webfont.FontWatcher.prototype.decreaseCurrentlyWatched_ = function() {
  if (--this.currentlyWatched_ == 0 && this.last_) {
    if (this.success_) {
      this.eventDispatcher_.dispatchActive();
    } else {
      this.eventDispatcher_.dispatchInactive();
    }
  }
};

/**
 * @constructor
 * @param {function(string, string)} activeCallback
 * @param {function(string, string)} inactiveCallback
 * @param {webfont.DomHelper} domHelper
 * @param {Object.<string, function(Object): number>} fontSizer
 * @param {function(function(), number=)} asyncCall
 * @param {function(): number} getTime
 * @param {string} fontFamily
 * @param {string} fontDescription
 * @param {string=} opt_fontTestString
 */
webfont.FontWatchRunner = function(activeCallback, inactiveCallback, domHelper,
    fontSizer, asyncCall, getTime, fontFamily, fontDescription, opt_fontTestString) {
  this.activeCallback_ = activeCallback;
  this.inactiveCallback_ = inactiveCallback;
  this.domHelper_ = domHelper;
  this.fontSizer_ = fontSizer;
  this.asyncCall_ = asyncCall;
  this.getTime_ = getTime;
  this.nameHelper_ = new webfont.CssFontFamilyName();
  this.fvd_ = new webfont.FontVariationDescription();
  this.fontFamily_ = fontFamily;
  this.fontDescription_ = fontDescription;
  this.fontTestString_ = opt_fontTestString || webfont.FontWatchRunner.DEFAULT_TEST_STRING;
  this.originalSizeA_ = this.getDefaultFontSize_(
      webfont.FontWatchRunner.DEFAULT_FONTS_A);
  this.originalSizeB_ = this.getDefaultFontSize_(
      webfont.FontWatchRunner.DEFAULT_FONTS_B);
  this.lastObservedSizeA_ = this.originalSizeA_;
  this.lastObservedSizeB_ = this.originalSizeB_;
  this.requestedFontA_ = this.createHiddenElementWithFont_(
      webfont.FontWatchRunner.DEFAULT_FONTS_A);
  this.requestedFontB_ = this.createHiddenElementWithFont_(
      webfont.FontWatchRunner.DEFAULT_FONTS_B);
};

/**
 * A set of sans-serif fonts and a generic family that cover most platforms:
 * Windows - arial - 99.71%
 * Mac - arial - 97.67%
 * Linux - 97.67%
 * (Based on http://www.codestyle.org/css/font-family/sampler-CombinedResults.shtml)
 * @type {string}
 * @const
 */
webfont.FontWatchRunner.DEFAULT_FONTS_A = "arial,'URW Gothic L',sans-serif";

/**
 * A set of serif fonts and a generic family that cover most platforms. We
 * want each of these fonts to have a different width when rendering the test
 * string than each of the fonts in DEFAULT_FONTS_A:
 * Windows - Georgia - 98.98%
 * Mac - Georgia - 95.60%
 * Linux - Century Schoolbook L - 97.97%
 * (Based on http://www.codestyle.org/css/font-family/sampler-CombinedResults.shtml)
 * @type {string}
 * @const
 */
webfont.FontWatchRunner.DEFAULT_FONTS_B = "Georgia,'Century Schoolbook L',serif";

/**
 * Default test string. Characters are chosen so that their widths vary a lot
 * between the fonts in the default stacks. We want each fallback stack
 * to always start out at a different width than the other.
 * @type {string}
 * @const
 */
webfont.FontWatchRunner.DEFAULT_TEST_STRING = 'BESbswy';

webfont.FontWatchRunner.prototype.start = function() {
  this.started_ = this.getTime_();
  this.check_();
};

/**
 * Checks the size of the two spans against their original sizes during each
 * async loop. If the size of one of the spans is different than the original
 * size, then we know that the font is rendering and finish with the active
 * callback. If we wait more than 5 seconds and nothing has changed, we finish
 * with the inactive callback.
 *
 * Because of an odd Webkit quirk, we wait to observe the new width twice
 * in a row before finishing with the active callback. Sometimes, Webkit will
 * render the spans with a changed width for one iteration even though the font
 * is broken. This only happens for one async loop, so waiting for 2 consistent
 * measurements allows us to work around the quirk.
 *
 * @private
 */
webfont.FontWatchRunner.prototype.check_ = function() {
  var sizeA = this.fontSizer_.getWidth(this.requestedFontA_);
  var sizeB = this.fontSizer_.getWidth(this.requestedFontB_);

  if ((this.originalSizeA_ != sizeA || this.originalSizeB_ != sizeB) &&
      this.lastObservedSizeA_ == sizeA && this.lastObservedSizeB_ == sizeB) {
    this.finish_(this.activeCallback_);
  } else if (this.getTime_() - this.started_ >= 5000) {
    this.finish_(this.inactiveCallback_);
  } else {
    this.lastObservedSizeA_ = sizeA;
    this.lastObservedSizeB_ = sizeB;
    this.asyncCheck_();
  }
};

/**
 * @private
 */
webfont.FontWatchRunner.prototype.asyncCheck_ = function() {
  this.asyncCall_(function(context, func) {
    return function() {
      func.call(context);
    }
  }(this, this.check_), 25);
};

/**
 * @private
 * @param {function(string, string)} callback
 */
webfont.FontWatchRunner.prototype.finish_ = function(callback) {
  this.domHelper_.removeElement(this.requestedFontA_);
  this.domHelper_.removeElement(this.requestedFontB_);
  callback(this.fontFamily_, this.fontDescription_);
};

/**
 * @private
 * @param {string} defaultFonts
 */
webfont.FontWatchRunner.prototype.getDefaultFontSize_ = function(defaultFonts) {
  var defaultFont = this.createHiddenElementWithFont_(defaultFonts, true);
  var size = this.fontSizer_.getWidth(defaultFont);

  this.domHelper_.removeElement(defaultFont);
  return size;
};

/**
 * @private
 * @param {string} defaultFonts
 * @param {boolean=} opt_withoutFontFamily
 */
webfont.FontWatchRunner.prototype.createHiddenElementWithFont_ = function(
    defaultFonts, opt_withoutFontFamily) {
  var styleString = this.computeStyleString_(defaultFonts,
      this.fontDescription_, opt_withoutFontFamily);
  var span = this.domHelper_.createElement('span', { 'style': styleString },
      this.fontTestString_);

  this.domHelper_.insertInto('body', span);
  return span;
};

webfont.FontWatchRunner.prototype.computeStyleString_ = function(defaultFonts,
    fontDescription, opt_withoutFontFamily) {
  var variationCss = this.fvd_.expand(fontDescription);
  var styleString = "position:absolute;top:-999px;left:-999px;" +
      "font-size:300px;width:auto;height:auto;line-height:normal;margin:0;" +
      "padding:0;font-variant:normal;font-family:"
      + (opt_withoutFontFamily ? "" :
        this.nameHelper_.quote(this.fontFamily_) + ",")
      + defaultFonts + ";" + variationCss;
  return styleString;
};

/**
 * @constructor
 */
webfont.WebFont = function(domHelper, fontModuleLoader, htmlElement, asyncCall,
    userAgent) {
  this.domHelper_ = domHelper;
  this.fontModuleLoader_ = fontModuleLoader;
  this.htmlElement_ = htmlElement;
  this.asyncCall_ = asyncCall;
  this.userAgent_ = userAgent;
  this.moduleLoading_ = 0;
  this.moduleFailedLoading_ = 0;
};

webfont.WebFont.prototype.addModule = function(name, factory) {
  this.fontModuleLoader_.addModuleFactory(name, factory);
};

webfont.WebFont.prototype.load = function(configuration) {
  var eventDispatcher = new webfont.EventDispatcher(
      this.domHelper_, this.htmlElement_, configuration);

  if (this.userAgent_.isSupportingWebFont()) {
    this.load_(eventDispatcher, configuration);
  } else {
    eventDispatcher.dispatchInactive();
  }
};

webfont.WebFont.prototype.isModuleSupportingUserAgent_ = function(module, eventDispatcher,
    fontWatcher, support) {
  var fontWatchRunnerCtor = module.getFontWatchRunnerCtor ?
      module.getFontWatchRunnerCtor() : webfont.FontWatchRunner;
  if (!support) {
    var allModulesLoaded = --this.moduleLoading_ == 0;

    this.moduleFailedLoading_--;
    if (allModulesLoaded) {
      if (this.moduleFailedLoading_ == 0) {
        eventDispatcher.dispatchInactive();
      } else {
        eventDispatcher.dispatchLoading();
      }
    }
    fontWatcher.watch([], {}, {}, fontWatchRunnerCtor, allModulesLoaded);
    return;
  }
  module.load(webfont.bind(this, this.onModuleReady_, eventDispatcher,
      fontWatcher, fontWatchRunnerCtor));
};

webfont.WebFont.prototype.onModuleReady_ = function(eventDispatcher, fontWatcher,
    fontWatchRunnerCtor, fontFamilies, opt_fontDescriptions, opt_fontTestStrings) {
  var allModulesLoaded = --this.moduleLoading_ == 0;

  if (allModulesLoaded) {
    eventDispatcher.dispatchLoading();
  }
  this.asyncCall_(webfont.bind(this, function(_fontWatcher, _fontFamilies,
      _fontDescriptions, _fontTestStrings, _fontWatchRunnerCtor,
      _allModulesLoaded) {
        _fontWatcher.watch(_fontFamilies, _fontDescriptions || {},
          _fontTestStrings || {}, _fontWatchRunnerCtor, _allModulesLoaded);
      }, fontWatcher, fontFamilies, opt_fontDescriptions, opt_fontTestStrings,
      fontWatchRunnerCtor, allModulesLoaded));
};

webfont.WebFont.prototype.load_ = function(eventDispatcher, configuration) {
  var modules = this.fontModuleLoader_.getModules(configuration),
      self = this;

  this.moduleFailedLoading_ = this.moduleLoading_ = modules.length;

  var fontWatcher = new webfont.FontWatcher(this.domHelper_,
      eventDispatcher, {
        getWidth: function(elem) {
          return elem.offsetWidth;
        }}, self.asyncCall_, function() {
          return new Date().getTime();
        });

  for (var i = 0, len = modules.length; i < len; i++) {
    var module = modules[i];

    module.supportUserAgent(this.userAgent_,
        webfont.bind(this, this.isModuleSupportingUserAgent_, module,
        eventDispatcher, fontWatcher));
  }
};

/**
 * Handles sanitization and construction of css class names.
 * @param {string=} opt_joinChar The character to join parts of the name on.
 *    Defaults to '-'.
 * @constructor
 */
webfont.CssClassName = function(opt_joinChar) {
  /** @type {string} */
  this.joinChar_ = opt_joinChar || webfont.CssClassName.DEFAULT_JOIN_CHAR;
};

/**
 * @const
 * @type {string}
 */
webfont.CssClassName.DEFAULT_JOIN_CHAR = '-';

/**
 * Sanitizes a string for use as a css class name. Removes non-word and
 * underscore characters.
 * @param {string} name The string.
 * @return {string} The sanitized string.
 */
webfont.CssClassName.prototype.sanitize = function(name) {
  return name.replace(/[\W_]+/g, '').toLowerCase();
};

/**
 * Builds a complete css class name given a variable number of parts.
 * Sanitizes, then joins the parts together.
 * @param {...string} var_args The parts to join.
 * @return {string} The sanitized and joined string.
 */
webfont.CssClassName.prototype.build = function(var_args) {
  var parts = []
  for (var i = 0; i < arguments.length; i++) {
    parts.push(this.sanitize(arguments[i]));
  }
  return parts.join(this.joinChar_);
};


/**
 * Handles quoting rules for a font family name in css.
 * @constructor
 */
webfont.CssFontFamilyName = function() {
  /** @type {string} */
  this.quote_ = "'";
};

/**
 * Quotes the name.
 * @param {string} name The name to quote.
 * @return {string} The quoted name.
 */
webfont.CssFontFamilyName.prototype.quote = function(name) {
  var quoted = [];
  var split = name.split(/,\s*/);
  for (var i = 0; i < split.length; i++) {
    var part = split[i].replace(/['"]/g, '');
    if (part.indexOf(' ') == -1) {
      quoted.push(part);
    } else {
      quoted.push(this.quote_ + part + this.quote_);
    }
  }
  return quoted.join(',');
};

/**
 * @constructor
 */
webfont.FontVariationDescription = function() {
  this.properties_ = webfont.FontVariationDescription.PROPERTIES;
  this.values_ = webfont.FontVariationDescription.VALUES;
};

/**
 * @const
 */
webfont.FontVariationDescription.PROPERTIES = [
  'font-style',
  'font-weight'
];

/**
 * @const
 */
webfont.FontVariationDescription.VALUES = {
  'font-style': [
    ['n', 'normal'],
    ['i', 'italic'],
    ['o', 'oblique']
  ],
  'font-weight': [
    ['1', '100'],
    ['2', '200'],
    ['3', '300'],
    ['4', '400'],
    ['5', '500'],
    ['6', '600'],
    ['7', '700'],
    ['8', '800'],
    ['9', '900'],
    ['4', 'normal'],
    ['7', 'bold']
  ]
};

/**
 * @private
 * @constructor
 */
webfont.FontVariationDescription.Item = function(index, property, values) {
  this.index_ = index;
  this.property_ = property;
  this.values_ = values;
}

webfont.FontVariationDescription.Item.prototype.compact = function(output, value) {
  for (var i = 0; i < this.values_.length; i++) {
    if (value == this.values_[i][1]) {
      output[this.index_] = this.values_[i][0];
      return;
    }
  }
}

webfont.FontVariationDescription.Item.prototype.expand = function(output, value) {
  for (var i = 0; i < this.values_.length; i++) {
    if (value == this.values_[i][0]) {
      output[this.index_] = this.property_ + ':' + this.values_[i][1];
      return;
    }
  }
}

/**
 * Compacts CSS declarations into an FVD.
 * @param {string} input A string of CSS declarations such as
 *    'font-weight:normal;font-style:italic'.
 * @return {string} The equivalent FVD such as 'n4'.
 */
webfont.FontVariationDescription.prototype.compact = function(input) {
  var result = ['n', '4'];
  var descriptors = input.split(';');

  for (var i = 0, len = descriptors.length; i < len; i++) {
    var pair = descriptors[i].replace(/\s+/g, '').split(':');
    if (pair.length == 2) {
      var property = pair[0];
      var value = pair[1];
      var item = this.getItem_(property);
      if (item) {
        item.compact(result, value);
      }
    }
  }

  return result.join('');
};

/**
 * Expands a FVD string into equivalent CSS declarations.
 * @param {string} fvd The FVD string, such as 'n4'.
 * @return {?string} The equivalent CSS such as
 *    'font-weight:normal;font-style:italic' or null if it cannot be parsed.
 */
webfont.FontVariationDescription.prototype.expand = function(fvd) {
  if (fvd.length != 2) {
    return null;
  }

  var result = [null, null];

  for (var i = 0, len = this.properties_.length; i < len; i++) {
    var property = this.properties_[i];
    var key = fvd.substr(i, 1);
    var values = this.values_[property];
    var item = new webfont.FontVariationDescription.Item(i, property, values);
    item.expand(result, key);
  }

  if (result[0] && result[1]) {
    return result.join(';') + ';';
  } else {
    return null;
  }
}

/**
 * @private
 */
webfont.FontVariationDescription.prototype.getItem_ = function(property) {
  for (var i = 0; i < this.properties_.length; i++) {
    if (property == this.properties_[i]) {
      var values = this.values_[property];
      return new webfont.FontVariationDescription.Item(i, property, values);
    }
  }

  return null;
};

// Name of the global object.
var globalName = 'WebFont';

// Provide an instance of WebFont in the global namespace.
window[globalName] = (function() {
  var userAgentParser = new webfont.UserAgentParser(navigator.userAgent, document);
  var userAgent = userAgentParser.parse();
  var domHelper = new webfont.DomHelper(document, userAgent);
  var asyncCall = function(func, timeout) { setTimeout(func, timeout); };

  return new webfont.WebFont(domHelper, new webfont.FontModuleLoader(),
      document.documentElement, asyncCall, userAgent);
})();

// Export the public API.
window[globalName]['load'] = window[globalName].load;
window[globalName]['addModule'] = window[globalName].addModule;

// Export the UserAgent API because we pass this object to external modules.
webfont.UserAgent.prototype['getName'] = webfont.UserAgent.prototype.getName;
webfont.UserAgent.prototype['getVersion'] = webfont.UserAgent.prototype.getVersion;
webfont.UserAgent.prototype['getEngine'] = webfont.UserAgent.prototype.getEngine;
webfont.UserAgent.prototype['getEngineVersion'] = webfont.UserAgent.prototype.getEngineVersion;
webfont.UserAgent.prototype['getPlatform'] = webfont.UserAgent.prototype.getPlatform;
webfont.UserAgent.prototype['getPlatformVersion'] = webfont.UserAgent.prototype.getPlatformVersion;
webfont.UserAgent.prototype['getDocumentMode'] = webfont.UserAgent.prototype.getDocumentMode;
webfont.UserAgent.prototype['isSupportingWebFont'] = webfont.UserAgent.prototype.isSupportingWebFont;

/**
 *
 * WebFont.load({
 *   ascender: {
 *     key:'ec2de397-11ae-4c10-937f-bf94283a70c1',
 *     families:['AyitaPro:regular,bold,bolditalic,italic']
 *   }
 * });
 *
 * @constructor
 */
webfont.AscenderScript = function(domHelper, configuration) {
  this.domHelper_ = domHelper;
  this.configuration_ = configuration;
};

webfont.AscenderScript.NAME = 'ascender';

webfont.AscenderScript.VARIATIONS = {
  'regular': 'n4',
  'bold': 'n7',
  'italic': 'i4',
  'bolditalic': 'i7',
  'r': 'n4',
  'b': 'n7',
  'i': 'i4',
  'bi': 'i7'
};

webfont.AscenderScript.prototype.supportUserAgent = function(userAgent, support) {
  return support(userAgent.isSupportingWebFont());
};

webfont.AscenderScript.prototype.load = function(onReady) {
  var key = this.configuration_['key'];
  var protocol = (('https:' == document.location.protocol) ? 'https:' : 'http:');
  var url = protocol + '//webfonts.fontslive.com/css/' + key + '.css';
  this.domHelper_.insertInto('head', this.domHelper_.createCssLink(url));
  var fv = this.parseFamiliesAndVariations(this.configuration_['families']);
  onReady(fv.families, fv.variations);
};

webfont.AscenderScript.prototype.parseFamiliesAndVariations = function(providedFamilies){
  var families, variations, fv;
  families = [];
  variations = {};
  for(var i = 0, len = providedFamilies.length; i < len; i++){
    fv = this.parseFamilyAndVariations(providedFamilies[i]);
    families.push(fv.family);
    variations[fv.family] = fv.variations;
  }
  return { families:families, variations:variations };
};

webfont.AscenderScript.prototype.parseFamilyAndVariations = function(providedFamily){
  var family, variations, parts;
  parts = providedFamily.split(':');
  family = parts[0];
  variations = [];
  if(parts[1]){
    variations = this.parseVariations(parts[1]);
  }else{
    variations = ['n4'];
  }
  return { family:family, variations:variations };
};

webfont.AscenderScript.prototype.parseVariations = function(source){
  var providedVariations = source.split(',');
  var variations = [];
  for(var i = 0, len = providedVariations.length; i < len; i++){
    var pv = providedVariations[i];
    if(pv){
      var v = webfont.AscenderScript.VARIATIONS[pv];
      variations.push(v ? v : pv);
    }
  }
  return variations;
};

window['WebFont'].addModule(webfont.AscenderScript.NAME, function(configuration) {
  var userAgentParser = new webfont.UserAgentParser(navigator.userAgent, document);
  var userAgent = userAgentParser.parse();
  var domHelper = new webfont.DomHelper(document, userAgent);
  return new webfont.AscenderScript(domHelper, configuration);
});

/**
 * @constructor
 */
webfont.LastResortWebKitFontWatchRunner = function(activeCallback,
    inactiveCallback, domHelper, fontSizer, asyncCall, getTime, fontFamily,
    fontDescription, opt_fontTestString) {
  webfont.LastResortWebKitFontWatchRunner.superCtor_.call(this,
      activeCallback, inactiveCallback, domHelper, fontSizer, asyncCall,
      getTime, fontFamily, fontDescription, opt_fontTestString);
  this.webKitLastResortFontSizes_ = this.setUpWebKitLastResortFontSizes_();
  this.webKitLastResortSizeChange_ = false;
};
webfont.extendsClass(webfont.FontWatchRunner, webfont.LastResortWebKitFontWatchRunner);

webfont.LastResortWebKitFontWatchRunner.METRICS_COMPATIBLE_FONTS = {
    "Arimo": true,
    "Cousine": true,
    "Tinos": true
};

/**
 * While loading a web font webkit applies a last resort fallback font to the
 * element on which the web font is applied.
 * See file: WebKit/Source/WebCore/css/CSSFontFaceSource.cpp.
 * Looking at the different implementation for the different platforms,
 * the last resort fallback font is different. This code uses the default
 * OS/browsers values.
 */
webfont.LastResortWebKitFontWatchRunner.prototype
    .setUpWebKitLastResortFontSizes_ = function() {
  var lastResortFonts = ["Times New Roman",
      "Lucida Sans Unicode", "Courier New", "Tahoma", "Arial",
      "Microsoft Sans Serif", "Times", "Lucida Console", "Sans", "Serif",
      "Monospace"];
  var lastResortFontSizes = lastResortFonts.length;
  var webKitLastResortFontSizes = {};
  var element = this.createHiddenElementWithFont_(lastResortFonts[0], true);

  webKitLastResortFontSizes[this.fontSizer_.getWidth(element)] = true;
  for (var i = 1; i < lastResortFontSizes; i++) {
    var font = lastResortFonts[i];
    this.domHelper_.setStyle(element, this.computeStyleString_(font,
        this.fontDescription_, true));
    webKitLastResortFontSizes[this.fontSizer_.getWidth(element)] = true;

    // Another WebKit quirk if the normal weight/style is loaded first,
    // the size of the normal weight is returned when loading another weight.
    if (this.fontDescription_[1] != '4') {
      this.domHelper_.setStyle(element, this.computeStyleString_(font,
        this.fontDescription_[0] + '4', true));
      webKitLastResortFontSizes[this.fontSizer_.getWidth(element)] = true;
    }
  }
  this.domHelper_.removeElement(element);
  return webKitLastResortFontSizes;
};

webfont.LastResortWebKitFontWatchRunner.prototype.check_ = function() {
  var sizeA = this.fontSizer_.getWidth(this.requestedFontA_);
  var sizeB = this.fontSizer_.getWidth(this.requestedFontB_);

  if (!this.webKitLastResortSizeChange_ && sizeA == sizeB &&
      this.webKitLastResortFontSizes_[sizeA]) {
    this.webKitLastResortFontSizes_ = {};
    this.webKitLastResortFontSizes_[sizeA] = true;
    this.webKitLastResortSizeChange_ = true;
  }
  if ((this.originalSizeA_ != sizeA || this.originalSizeB_ != sizeB) &&
      (!this.webKitLastResortFontSizes_[sizeA] &&
       !this.webKitLastResortFontSizes_[sizeB])) {
    this.finish_(this.activeCallback_);
  } else if (this.getTime_() - this.started_ >= 5000) {

    // In order to handle the fact that a font could be the same size as the
    // default browser font on a webkit browser, mark the font as active
    // after 5 seconds if the latest 2 sizes are in webKitLastResortFontSizes_
    // and the font name is known to be metrics compatible.
    if (this.webKitLastResortFontSizes_[sizeA]
        && this.webKitLastResortFontSizes_[sizeB] &&
        webfont.LastResortWebKitFontWatchRunner.METRICS_COMPATIBLE_FONTS[
          this.fontFamily_]) {
      this.finish_(this.activeCallback_);
    } else {
      this.finish_(this.inactiveCallback_);
    }
  } else {
    this.asyncCheck_();
  }
};

/**
 * @constructor
 */
webfont.FontApiUrlBuilder = function(apiUrl) {
  if (apiUrl) {
    this.apiUrl_ = apiUrl;
  } else {
    var protocol = 'https:' == window.location.protocol ? 'https:' : 'http:';

    this.apiUrl_ = protocol + webfont.FontApiUrlBuilder.DEFAULT_API_URL;
  }  
  this.fontFamilies_ = [];
  this.subsets_ = [];
};


webfont.FontApiUrlBuilder.DEFAULT_API_URL = '//fonts.googleapis.com/css';


webfont.FontApiUrlBuilder.prototype.setFontFamilies = function(fontFamilies) {
  this.parseFontFamilies_(fontFamilies);
};


webfont.FontApiUrlBuilder.prototype.parseFontFamilies_ =
    function(fontFamilies) {
  var length = fontFamilies.length;

  for (var i = 0; i < length; i++) {
    var elements = fontFamilies[i].split(':');

    if (elements.length == 3) {
      this.subsets_.push(elements.pop());
    }
    this.fontFamilies_.push(elements.join(':'));
  }
};


webfont.FontApiUrlBuilder.prototype.webSafe = function(string) {
  return string.replace(/ /g, '+');
};


webfont.FontApiUrlBuilder.prototype.build = function() {
  if (this.fontFamilies_.length == 0) {
    throw new Error('No fonts to load !');
  }
  if (this.apiUrl_.indexOf("kit=") != -1) {
    return this.apiUrl_;
  }
  var length = this.fontFamilies_.length;
  var sb = [];

  for (var i = 0; i < length; i++) {
    sb.push(this.webSafe(this.fontFamilies_[i]));
  }
  var url = this.apiUrl_ + '?family=' + sb.join('%7C'); // '|' escaped.

  if (this.subsets_.length > 0) {
    url += '&subset=' + this.subsets_.join(',');
  }

  return url;
};

/**
 * @constructor
 */
webfont.FontApiParser = function(fontFamilies) {
  this.fontFamilies_ = fontFamilies;
  this.parsedFontFamilies_ = [];
  this.variations_ = {};
  this.fontTestStrings_ = {};
  this.fvd_ = new webfont.FontVariationDescription();
};

webfont.FontApiParser.VARIATIONS = {
  'ultralight': 'n2',
  'light': 'n3',
  'regular': 'n4',
  'bold': 'n7',
  'italic': 'i4',
  'bolditalic': 'i7',
  'ul': 'n2',
  'l': 'n3',
  'r': 'n4',
  'b': 'n7',
  'i': 'i4',
  'bi': 'i7'
};

webfont.FontApiParser.INT_FONTS = {
  'latin': webfont.FontWatchRunner.DEFAULT_TEST_STRING,
  'cyrillic': '&#1081;&#1103;&#1046;',
  'greek': '&#945;&#946;&#931;',
  'khmer': '&#x1780;&#x1781;&#x1782;',
  'Hanuman': '&#x1780;&#x1781;&#x1782;' // For backward compatibility
};

webfont.FontApiParser.prototype.parse = function() {
  var length = this.fontFamilies_.length;

  for (var i = 0; i < length; i++) {
    var elements = this.fontFamilies_[i].split(":");
    var fontFamily = elements[0];
    var variations = ['n4'];

    if (elements.length >= 2) {
      var fvds = this.parseVariations_(elements[1]);

      if (fvds.length > 0) {
        variations = fvds;
      }
      if (elements.length == 3) {
        var subsets = this.parseSubsets_(elements[2]);
        if (subsets.length > 0) {
          var fontTestString = webfont.FontApiParser.INT_FONTS[subsets[0]];

          if (fontTestString) {
	    this.fontTestStrings_[fontFamily] = fontTestString;
	  }
	}
      }
    }

    // For backward compatibility
    if (!this.fontTestStrings_[fontFamily]) {
      var hanumanTestString = webfont.FontApiParser.INT_FONTS[fontFamily];
      if (hanumanTestString) {
        this.fontTestStrings_[fontFamily] = hanumanTestString;
      }
    }
    this.parsedFontFamilies_.push(fontFamily);
    this.variations_[fontFamily] = variations;
  }
};

webfont.FontApiParser.prototype.generateFontVariationDescription_ = function(variation) {
  if (!variation.match(/^[\w ]+$/)) {
    return '';
  }

  var fvd = webfont.FontApiParser.VARIATIONS[variation];

  if (fvd) {
    return fvd;
  } else {
    var groups = variation.match(/^(\d*)(\w*)$/);
    var numericMatch = groups[1];
    var styleMatch = groups[2];
    var s = styleMatch ? styleMatch : 'n';
    var w = numericMatch ? numericMatch.substr(0, 1) : '4';
    var css = this.fvd_.expand([s, w].join(''));
    if (css) {
      return this.fvd_.compact(css);
    } else {
      return null;
    }
  }
};

webfont.FontApiParser.prototype.parseVariations_ = function(variations) {
  var finalVariations = [];

  if (!variations) {
    return finalVariations;
  }
  var providedVariations = variations.split(",");
  var length = providedVariations.length;

  for (var i = 0; i < length; i++) {
    var variation = providedVariations[i];
    var fvd = this.generateFontVariationDescription_(variation);

    if (fvd) {
      finalVariations.push(fvd);
    }
  }
  return finalVariations;
};


webfont.FontApiParser.prototype.parseSubsets_ = function(subsets) {
  var finalSubsets = [];

  if (!subsets) {
    return finalSubsets;
  }
  return subsets.split(",");
};


webfont.FontApiParser.prototype.getFontFamilies = function() {
  return this.parsedFontFamilies_;
};

webfont.FontApiParser.prototype.getVariations = function() {
  return this.variations_;
};

webfont.FontApiParser.prototype.getFontTestStrings = function() {
  return this.fontTestStrings_;
};

/**
 * @constructor
 */
webfont.GoogleFontApi = function(userAgent, domHelper, configuration) {
  this.userAgent_ = userAgent;
  this.domHelper_ = domHelper;
  this.configuration_ = configuration;
};

webfont.GoogleFontApi.NAME = 'google';

webfont.GoogleFontApi.prototype.supportUserAgent = function(userAgent, support) {
  support(userAgent.isSupportingWebFont());
};

webfont.GoogleFontApi.prototype.getFontWatchRunnerCtor = function() {
  if (this.userAgent_.getEngine() == "AppleWebKit") {
    return webfont.LastResortWebKitFontWatchRunner;
  }
  return webfont.FontWatchRunner;
};

webfont.GoogleFontApi.prototype.load = function(onReady) {
  var domHelper = this.domHelper_;
  var nonBlockingIe = this.userAgent_.getName() == 'MSIE' &&
      this.configuration_['blocking'] != true;

  if (nonBlockingIe) {
    domHelper.whenBodyExists(webfont.bind(this, this.insertLink_, onReady));
  } else {
    this.insertLink_(onReady);
  }
};

webfont.GoogleFontApi.prototype.insertLink_ = function(onReady) {
  var domHelper = this.domHelper_;
  var fontApiUrlBuilder = new webfont.FontApiUrlBuilder(
      this.configuration_['api']);
  var fontFamilies = this.configuration_['families'];
  fontApiUrlBuilder.setFontFamilies(fontFamilies);

  var fontApiParser = new webfont.FontApiParser(fontFamilies);
  fontApiParser.parse();

  domHelper.insertInto('head', domHelper.createCssLink(
      fontApiUrlBuilder.build()));
  onReady(fontApiParser.getFontFamilies(), fontApiParser.getVariations(),
      fontApiParser.getFontTestStrings());
};

window['WebFont'].addModule(webfont.GoogleFontApi.NAME, function(configuration) {
  var userAgentParser = new webfont.UserAgentParser(navigator.userAgent, document);
  var userAgent = userAgentParser.parse();
  return new webfont.GoogleFontApi(userAgent,
      new webfont.DomHelper(document, userAgent), configuration);
});

/**
 *
 * WebFont.load({
 *   custom: {
 *     families: ['Font1', 'Font2'],
 *    urls: [ 'http://moo', 'http://meuh' ] }
 * });
 *
 * @constructor
 */
webfont.CustomCss = function(domHelper, configuration) {
  this.domHelper_ = domHelper;
  this.configuration_ = configuration;
};

webfont.CustomCss.NAME = 'custom';

webfont.CustomCss.prototype.load = function(onReady) {
  var urls = this.configuration_['urls'] || [];
  var families = this.configuration_['families'] || [];

  for (var i = 0, len = urls.length; i < len; i++) {
    var url = urls[i];

    this.domHelper_.insertInto('head', this.domHelper_.createCssLink(url));
  }
  onReady(families);
};

webfont.CustomCss.prototype.supportUserAgent = function(userAgent, support) {
  return support(userAgent.isSupportingWebFont());
};

window['WebFont'].addModule(webfont.CustomCss.NAME, function(configuration) {
  var userAgentParser = new webfont.UserAgentParser(navigator.userAgent, document);
  var userAgent = userAgentParser.parse();
  var domHelper = new webfont.DomHelper(document, userAgent);
  return new webfont.CustomCss(domHelper, configuration);
});

/**
 * @constructor
 */
webfont.FontdeckScript = function(global, domHelper, configuration) {
  this.global_ = global;
  this.domHelper_ = domHelper;
  this.configuration_ = configuration;
  this.fontFamilies_ = [];
  this.fontVariations_ = {};
  this.fvd_ = new webfont.FontVariationDescription();
};

webfont.FontdeckScript.NAME = 'fontdeck';
webfont.FontdeckScript.HOOK = '__webfontfontdeckmodule__';
webfont.FontdeckScript.API = '//f.fontdeck.com/s/css/js/';

webfont.FontdeckScript.prototype.getScriptSrc = function(projectId) {
  var protocol = 'https:' == this.global_.location.protocol ? 'https:' : 'http:';
  var api = this.configuration_['api'] || webfont.FontdeckScript.API;
  return protocol + api + this.global_.document.location.hostname + '/' + projectId + '.js';
};

webfont.FontdeckScript.prototype.supportUserAgent = function(userAgent, support) {
  var projectId = this.configuration_['id'];
  var self = this;

  if (projectId) {
    // Provide data to Fontdeck for processing.
    if (!this.global_[webfont.FontdeckScript.HOOK]) {
      this.global_[webfont.FontdeckScript.HOOK] = {};
    }

    // Fontdeck will call this function to indicate support status
    // and what fonts are provided.
    this.global_[webfont.FontdeckScript.HOOK][projectId] = function(fontdeckSupports, data) {
      for (var i = 0, j = data['fonts'].length; i<j; ++i) {
        var font = data['fonts'][i];
        // Add the FVDs
        self.fontFamilies_.push(font['name']);
        self.fontVariations_[font['name']] = [self.fvd_.compact("font-weight:" + font['weight'] + ";font-style:" + font['style'])];
      }
      support(fontdeckSupports);
    };

    // Call the Fontdeck API.
    var script = this.domHelper_.createScriptSrc(this.getScriptSrc(projectId));
    this.domHelper_.insertInto('head', script);

  } else {
    support(true);
  }
};

webfont.FontdeckScript.prototype.load = function(onReady) {
  onReady(this.fontFamilies_, this.fontVariations_);
};

window['WebFont'].addModule(webfont.FontdeckScript.NAME, function(configuration) {
  var userAgentParser = new webfont.UserAgentParser(navigator.userAgent, document);
  var userAgent = userAgentParser.parse();
  var domHelper = new webfont.DomHelper(document, userAgent);
  return new webfont.FontdeckScript(window, domHelper, configuration);
});

/**
webfont.load({
monotype: {
projectId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'//this is your Fonts.com Web fonts projectId
}
});
*/

/**
 * @constructor
 */
webfont.MonotypeScript = function (global, userAgent, domHelper, doc, configuration) {
  this.global_ = global;
  this.userAgent_ = userAgent;
  this.domHelper_ = domHelper;
  this.doc_ = doc;
  this.configuration_ = configuration;
  this.fontFamilies_ = [];
  this.fontVariations_ = {};
};

/**
 * name of the module through which external API is supposed to call the MonotypeFontAPI.
 * @const
 */
webfont.MonotypeScript.NAME = 'monotype';

/**
 * __mti_fntLst is the name of function that exposes Monotype's font list.
 * @const
 */
webfont.MonotypeScript.HOOK = '__mti_fntLst';

/**
 * __MonotypeAPIScript__ is the id of script added by google API. Currently 'webfonts.fonts.com' supports only one script in a page. 
 * This may require change in future if 'webfonts.fonts.com' begins supporting multiple scripts per page.
 * @const
 */
webfont.MonotypeScript.SCRIPTID = '__MonotypeAPIScript__';

webfont.MonotypeScript.prototype.supportUserAgent = function (userAgent, support) {
  var self = this;
  var projectId = self.configuration_['projectId'];
  if (projectId) {
    var sc = self.domHelper_.createScriptSrc(self.getScriptSrc(projectId));
    sc["id"] = webfont.MonotypeScript.SCRIPTID + projectId;

    sc["onreadystatechange"] = function (e) {
      if (sc["readyState"] === "loaded" || sc["readyState"] === "complete") {
        sc["onreadystatechange"] = null;
        sc["onload"](e);
      }
    };

    sc["onload"] = function (e) {
      if (self.global_[webfont.MonotypeScript.HOOK + projectId]) {
        var mti_fnts = self.global_[webfont.MonotypeScript.HOOK + projectId]();
        if (mti_fnts && mti_fnts.length) {
          var i;
          for (i = 0; i < mti_fnts.length; i++) {
            self.fontFamilies_.push(mti_fnts[i]["fontfamily"]);
          }
        }
      }
      support(userAgent.isSupportingWebFont());
    };

    this.domHelper_.insertInto('head', sc);
  }
  else {
    support(true);
  }
};

webfont.MonotypeScript.prototype.getScriptSrc = function (projectId) {
  var p = this.protocol();
  var api = (this.configuration_['api'] || 'fast.fonts.com/jsapi').replace(/^.*http(s?):(\/\/)?/, "");
  return p + "//" + api + '/' + projectId + '.js';
};

webfont.MonotypeScript.prototype.load = function (onReady) {
  onReady(this.fontFamilies_, this.fontVariations_);
};

webfont.MonotypeScript.prototype.protocol = function () {
  var supportedProtocols = ["http:", "https:"];
  var defaultProtocol = supportedProtocols[0];
  if (this.doc_ && this.doc_.location && this.doc_.location.protocol) {
    var i = 0;
    for (i = 0; i < supportedProtocols.length; i++) {
      if (this.doc_.location.protocol === supportedProtocols[i]) {
        return this.doc_.location.protocol;
      }
    }
  }

  return defaultProtocol;
};

window['WebFont'].addModule(webfont.MonotypeScript.NAME, function (configuration) {
  var userAgentParser = new webfont.UserAgentParser(navigator.userAgent, document);
  var userAgent = userAgentParser.parse();
  var domHelper = new webfont.DomHelper(document, userAgent);
  return new webfont.MonotypeScript(window, userAgent, domHelper, document, configuration);
});

/**
 * @constructor
 */
webfont.TypekitScript = function(global, domHelper, configuration) {
  this.global_ = global;
  this.domHelper_ = domHelper;
  this.configuration_ = configuration;
  this.fontFamilies_ = [];
  this.fontVariations_ = {};
};

webfont.TypekitScript.NAME = 'typekit';
webfont.TypekitScript.HOOK = '__webfonttypekitmodule__';

webfont.TypekitScript.prototype.getScriptSrc = function(kitId) {
  var protocol = 'https:' == window.location.protocol ? 'https:' : 'http:';
  var api = this.configuration_['api'] || protocol + '//use.typekit.com';
  return api + '/' + kitId + '.js';
};

webfont.TypekitScript.prototype.supportUserAgent = function(userAgent, support) {
  var kitId = this.configuration_['id'];
  var configuration = this.configuration_;
  var self = this;

  if (kitId) {
    // Provide data to Typekit for processing.
    if (!this.global_[webfont.TypekitScript.HOOK]) {
      this.global_[webfont.TypekitScript.HOOK] = {};
    }

    // Typekit will call 'init' to indicate whether it supports fonts
    // and what fonts will be provided.
    this.global_[webfont.TypekitScript.HOOK][kitId] = function(callback) {
      var init = function(typekitSupports, fontFamilies, fontVariations) {
        self.fontFamilies_ = fontFamilies;
        self.fontVariations_ = fontVariations;
        support(typekitSupports);
      };
      callback(userAgent, configuration, init);
    };

    // Load the Typekit script.
    var script = this.domHelper_.createScriptSrc(this.getScriptSrc(kitId))
    this.domHelper_.insertInto('head', script);

  } else {
    support(true);
  }
};

webfont.TypekitScript.prototype.load = function(onReady) {
  onReady(this.fontFamilies_, this.fontVariations_);
};

window['WebFont'].addModule(webfont.TypekitScript.NAME, function(configuration) {
  var userAgentParser = new webfont.UserAgentParser(navigator.userAgent, document);
  var userAgent = userAgentParser.parse();
  var domHelper = new webfont.DomHelper(document, userAgent);
  return new webfont.TypekitScript(window, domHelper, configuration);
});


if (window['WebFontConfig']) {
  window['WebFont']['load'](window['WebFontConfig']);
}

(function(j,f){function s(a,b){var c=a.createElement("p"),m=a.getElementsByTagName("head")[0]||a.documentElement;c.innerHTML="x<style>"+b+"</style>";return m.insertBefore(c.lastChild,m.firstChild)}function o(){var a=d.elements;return"string"==typeof a?a.split(" "):a}function n(a){var b=t[a[u]];b||(b={},p++,a[u]=p,t[p]=b);return b}function v(a,b,c){b||(b=f);if(e)return b.createElement(a);c||(c=n(b));b=c.cache[a]?c.cache[a].cloneNode():y.test(a)?(c.cache[a]=c.createElem(a)).cloneNode():c.createElem(a);
return b.canHaveChildren&&!z.test(a)?c.frag.appendChild(b):b}function A(a,b){if(!b.cache)b.cache={},b.createElem=a.createElement,b.createFrag=a.createDocumentFragment,b.frag=b.createFrag();a.createElement=function(c){return!d.shivMethods?b.createElem(c):v(c,a,b)};a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+o().join().replace(/\w+/g,function(a){b.createElem(a);b.frag.createElement(a);return'c("'+a+'")'})+");return n}")(d,b.frag)}
function w(a){a||(a=f);var b=n(a);if(d.shivCSS&&!q&&!b.hasCSS)b.hasCSS=!!s(a,"article,aside,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}");e||A(a,b);return a}function B(a){for(var b,c=a.attributes,m=c.length,f=a.ownerDocument.createElement(l+":"+a.nodeName);m--;)b=c[m],b.specified&&f.setAttribute(b.nodeName,b.nodeValue);f.style.cssText=a.style.cssText;return f}function x(a){function b(){clearTimeout(d._removeSheetTimer);c&&c.removeNode(!0);
c=null}var c,f,d=n(a),e=a.namespaces,j=a.parentWindow;if(!C||a.printShived)return a;"undefined"==typeof e[l]&&e.add(l);j.attachEvent("onbeforeprint",function(){b();var g,i,d;d=a.styleSheets;for(var e=[],h=d.length,k=Array(h);h--;)k[h]=d[h];for(;d=k.pop();)if(!d.disabled&&D.test(d.media)){try{g=d.imports,i=g.length}catch(j){i=0}for(h=0;h<i;h++)k.push(g[h]);try{e.push(d.cssText)}catch(n){}}g=e.reverse().join("").split("{");i=g.length;h=RegExp("(^|[\\s,>+~])("+o().join("|")+")(?=[[\\s,>+~#.:]|$)","gi");
for(k="$1"+l+"\\:$2";i--;)e=g[i]=g[i].split("}"),e[e.length-1]=e[e.length-1].replace(h,k),g[i]=e.join("}");e=g.join("{");i=a.getElementsByTagName("*");h=i.length;k=RegExp("^(?:"+o().join("|")+")$","i");for(d=[];h--;)g=i[h],k.test(g.nodeName)&&d.push(g.applyElement(B(g)));f=d;c=s(a,e)});j.attachEvent("onafterprint",function(){for(var a=f,c=a.length;c--;)a[c].removeNode();clearTimeout(d._removeSheetTimer);d._removeSheetTimer=setTimeout(b,500)});a.printShived=!0;return a}var r=j.html5||{},z=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,
y=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,q,u="_html5shiv",p=0,t={},e;(function(){try{var a=f.createElement("a");a.innerHTML="<xyz></xyz>";q="hidden"in a;var b;if(!(b=1==a.childNodes.length)){f.createElement("a");var c=f.createDocumentFragment();b="undefined"==typeof c.cloneNode||"undefined"==typeof c.createDocumentFragment||"undefined"==typeof c.createElement}e=b}catch(d){e=q=!0}})();var d={elements:r.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup main mark meter nav output progress section summary time video",
version:"3.6.2",shivCSS:!1!==r.shivCSS,supportsUnknownElements:e,shivMethods:!1!==r.shivMethods,type:"default",shivDocument:w,createElement:v,createDocumentFragment:function(a,b){a||(a=f);if(e)return a.createDocumentFragment();for(var b=b||n(a),c=b.frag.cloneNode(),d=0,j=o(),l=j.length;d<l;d++)c.createElement(j[d]);return c}};j.html5=d;w(f);var D=/^$|\b(?:all|print)\b/,l="html5shiv",C=!e&&function(){var a=f.documentElement;return!("undefined"==typeof f.namespaces||"undefined"==typeof f.parentWindow||
"undefined"==typeof a.applyElement||"undefined"==typeof a.removeNode||"undefined"==typeof j.attachEvent)}();d.type+=" print";d.shivPrint=x;x(f)})(this,document);

(function(l,f){function m(){var a=e.elements;return"string"==typeof a?a.split(" "):a}function i(a){var b=n[a[o]];b||(b={},h++,a[o]=h,n[h]=b);return b}function p(a,b,c){b||(b=f);if(g)return b.createElement(a);c||(c=i(b));b=c.cache[a]?c.cache[a].cloneNode():r.test(a)?(c.cache[a]=c.createElem(a)).cloneNode():c.createElem(a);return b.canHaveChildren&&!s.test(a)?c.frag.appendChild(b):b}function t(a,b){if(!b.cache)b.cache={},b.createElem=a.createElement,b.createFrag=a.createDocumentFragment,b.frag=b.createFrag();
a.createElement=function(c){return!e.shivMethods?b.createElem(c):p(c,a,b)};a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+m().join().replace(/\w+/g,function(a){b.createElem(a);b.frag.createElement(a);return'c("'+a+'")'})+");return n}")(e,b.frag)}function q(a){a||(a=f);var b=i(a);if(e.shivCSS&&!j&&!b.hasCSS){var c,d=a;c=d.createElement("p");d=d.getElementsByTagName("head")[0]||d.documentElement;c.innerHTML="x<style>article,aside,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}</style>";
c=d.insertBefore(c.lastChild,d.firstChild);b.hasCSS=!!c}g||t(a,b);return a}var k=l.html5||{},s=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,r=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,j,o="_html5shiv",h=0,n={},g;(function(){try{var a=f.createElement("a");a.innerHTML="<xyz></xyz>";j="hidden"in a;var b;if(!(b=1==a.childNodes.length)){f.createElement("a");var c=f.createDocumentFragment();b="undefined"==typeof c.cloneNode||
"undefined"==typeof c.createDocumentFragment||"undefined"==typeof c.createElement}g=b}catch(d){g=j=!0}})();var e={elements:k.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup main mark meter nav output progress section summary time video",version:"3.6.2",shivCSS:!1!==k.shivCSS,supportsUnknownElements:g,shivMethods:!1!==k.shivMethods,type:"default",shivDocument:q,createElement:p,createDocumentFragment:function(a,b){a||(a=f);if(g)return a.createDocumentFragment();
for(var b=b||i(a),c=b.frag.cloneNode(),d=0,e=m(),h=e.length;d<h;d++)c.createElement(e[d]);return c}};l.html5=e;q(f)})(this,document);

var swfobject=function(){var aq="undefined",aD="object",ab="Shockwave Flash",X="ShockwaveFlash.ShockwaveFlash",aE="application/x-shockwave-flash",ac="SWFObjectExprInst",ax="onreadystatechange",af=window,aL=document,aB=navigator,aa=false,Z=[aN],aG=[],ag=[],al=[],aJ,ad,ap,at,ak=false,aU=false,aH,an,aI=true,ah=function(){var a=typeof aL.getElementById!=aq&&typeof aL.getElementsByTagName!=aq&&typeof aL.createElement!=aq,e=aB.userAgent.toLowerCase(),c=aB.platform.toLowerCase(),h=c?/win/.test(c):/win/.test(e),j=c?/mac/.test(c):/mac/.test(e),g=/webkit/.test(e)?parseFloat(e.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,d=!+"\v1",f=[0,0,0],k=null;if(typeof aB.plugins!=aq&&typeof aB.plugins[ab]==aD){k=aB.plugins[ab].description;if(k&&!(typeof aB.mimeTypes!=aq&&aB.mimeTypes[aE]&&!aB.mimeTypes[aE].enabledPlugin)){aa=true;d=false;k=k.replace(/^.*\s+(\S+\s+\S+$)/,"$1");f[0]=parseInt(k.replace(/^(.*)\..*$/,"$1"),10);f[1]=parseInt(k.replace(/^.*\.(.*)\s.*$/,"$1"),10);f[2]=/[a-zA-Z]/.test(k)?parseInt(k.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0;}}else{if(typeof af.ActiveXObject!=aq){try{var i=new ActiveXObject(X);if(i){k=i.GetVariable("$version");if(k){d=true;k=k.split(" ")[1].split(",");f=[parseInt(k[0],10),parseInt(k[1],10),parseInt(k[2],10)];}}}catch(b){}}}return{w3:a,pv:f,wk:g,ie:d,win:h,mac:j};}(),aK=function(){if(!ah.w3){return;}if((typeof aL.readyState!=aq&&aL.readyState=="complete")||(typeof aL.readyState==aq&&(aL.getElementsByTagName("body")[0]||aL.body))){aP();}if(!ak){if(typeof aL.addEventListener!=aq){aL.addEventListener("DOMContentLoaded",aP,false);}if(ah.ie&&ah.win){aL.attachEvent(ax,function(){if(aL.readyState=="complete"){aL.detachEvent(ax,arguments.callee);aP();}});if(af==top){(function(){if(ak){return;}try{aL.documentElement.doScroll("left");}catch(a){setTimeout(arguments.callee,0);return;}aP();})();}}if(ah.wk){(function(){if(ak){return;}if(!/loaded|complete/.test(aL.readyState)){setTimeout(arguments.callee,0);return;}aP();})();}aC(aP);}}();function aP(){if(ak){return;}try{var b=aL.getElementsByTagName("body")[0].appendChild(ar("span"));b.parentNode.removeChild(b);}catch(a){return;}ak=true;var d=Z.length;for(var c=0;c<d;c++){Z[c]();}}function aj(a){if(ak){a();}else{Z[Z.length]=a;}}function aC(a){if(typeof af.addEventListener!=aq){af.addEventListener("load",a,false);}else{if(typeof aL.addEventListener!=aq){aL.addEventListener("load",a,false);}else{if(typeof af.attachEvent!=aq){aM(af,"onload",a);}else{if(typeof af.onload=="function"){var b=af.onload;af.onload=function(){b();a();};}else{af.onload=a;}}}}}function aN(){if(aa){Y();}else{am();}}function Y(){var d=aL.getElementsByTagName("body")[0];var b=ar(aD);b.setAttribute("type",aE);var a=d.appendChild(b);if(a){var c=0;(function(){if(typeof a.GetVariable!=aq){var e=a.GetVariable("$version");if(e){e=e.split(" ")[1].split(",");ah.pv=[parseInt(e[0],10),parseInt(e[1],10),parseInt(e[2],10)];}}else{if(c<10){c++;setTimeout(arguments.callee,10);return;}}d.removeChild(b);a=null;am();})();}else{am();}}function am(){var g=aG.length;if(g>0){for(var h=0;h<g;h++){var c=aG[h].id;var l=aG[h].callbackFn;var a={success:false,id:c};if(ah.pv[0]>0){var i=aS(c);if(i){if(ao(aG[h].swfVersion)&&!(ah.wk&&ah.wk<312)){ay(c,true);if(l){a.success=true;a.ref=av(c);l(a);}}else{if(aG[h].expressInstall&&au()){var e={};e.data=aG[h].expressInstall;e.width=i.getAttribute("width")||"0";e.height=i.getAttribute("height")||"0";if(i.getAttribute("class")){e.styleclass=i.getAttribute("class");}if(i.getAttribute("align")){e.align=i.getAttribute("align");}var f={};var d=i.getElementsByTagName("param");var k=d.length;for(var j=0;j<k;j++){if(d[j].getAttribute("name").toLowerCase()!="movie"){f[d[j].getAttribute("name")]=d[j].getAttribute("value");}}ae(e,f,c,l);}else{aF(i);if(l){l(a);}}}}}else{ay(c,true);if(l){var b=av(c);if(b&&typeof b.SetVariable!=aq){a.success=true;a.ref=b;}l(a);}}}}}function av(b){var d=null;var c=aS(b);if(c&&c.nodeName=="OBJECT"){if(typeof c.SetVariable!=aq){d=c;}else{var a=c.getElementsByTagName(aD)[0];if(a){d=a;}}}return d;}function au(){return !aU&&ao("6.0.65")&&(ah.win||ah.mac)&&!(ah.wk&&ah.wk<312);}function ae(f,d,h,e){aU=true;ap=e||null;at={success:false,id:h};var a=aS(h);if(a){if(a.nodeName=="OBJECT"){aJ=aO(a);ad=null;}else{aJ=a;ad=h;}f.id=ac;if(typeof f.width==aq||(!/%$/.test(f.width)&&parseInt(f.width,10)<310)){f.width="310";}if(typeof f.height==aq||(!/%$/.test(f.height)&&parseInt(f.height,10)<137)){f.height="137";}aL.title=aL.title.slice(0,47)+" - Flash Player Installation";var b=ah.ie&&ah.win?"ActiveX":"PlugIn",c="MMredirectURL="+af.location.toString().replace(/&/g,"%26")+"&MMplayerType="+b+"&MMdoctitle="+aL.title;if(typeof d.flashvars!=aq){d.flashvars+="&"+c;}else{d.flashvars=c;}if(ah.ie&&ah.win&&a.readyState!=4){var g=ar("div");h+="SWFObjectNew";g.setAttribute("id",h);a.parentNode.insertBefore(g,a);a.style.display="none";(function(){if(a.readyState==4){a.parentNode.removeChild(a);}else{setTimeout(arguments.callee,10);}})();}aA(f,d,h);}}function aF(a){if(ah.ie&&ah.win&&a.readyState!=4){var b=ar("div");a.parentNode.insertBefore(b,a);b.parentNode.replaceChild(aO(a),b);a.style.display="none";(function(){if(a.readyState==4){a.parentNode.removeChild(a);}else{setTimeout(arguments.callee,10);}})();}else{a.parentNode.replaceChild(aO(a),a);}}function aO(b){var d=ar("div");if(ah.win&&ah.ie){d.innerHTML=b.innerHTML;}else{var e=b.getElementsByTagName(aD)[0];if(e){var a=e.childNodes;if(a){var f=a.length;for(var c=0;c<f;c++){if(!(a[c].nodeType==1&&a[c].nodeName=="PARAM")&&!(a[c].nodeType==8)){d.appendChild(a[c].cloneNode(true));}}}}}return d;}function aA(e,g,c){var d,a=aS(c);if(ah.wk&&ah.wk<312){return d;}if(a){if(typeof e.id==aq){e.id=c;}if(ah.ie&&ah.win){var f="";for(var i in e){if(e[i]!=Object.prototype[i]){if(i.toLowerCase()=="data"){g.movie=e[i];}else{if(i.toLowerCase()=="styleclass"){f+=' class="'+e[i]+'"';}else{if(i.toLowerCase()!="classid"){f+=" "+i+'="'+e[i]+'"';}}}}}var h="";for(var j in g){if(g[j]!=Object.prototype[j]){h+='<param name="'+j+'" value="'+g[j]+'" />';}}a.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+f+">"+h+"</object>";ag[ag.length]=e.id;d=aS(e.id);}else{var b=ar(aD);b.setAttribute("type",aE);for(var k in e){if(e[k]!=Object.prototype[k]){if(k.toLowerCase()=="styleclass"){b.setAttribute("class",e[k]);}else{if(k.toLowerCase()!="classid"){b.setAttribute(k,e[k]);}}}}for(var l in g){if(g[l]!=Object.prototype[l]&&l.toLowerCase()!="movie"){aQ(b,l,g[l]);}}a.parentNode.replaceChild(b,a);d=b;}}return d;}function aQ(b,d,c){var a=ar("param");a.setAttribute("name",d);a.setAttribute("value",c);b.appendChild(a);}function aw(a){var b=aS(a);if(b&&b.nodeName=="OBJECT"){if(ah.ie&&ah.win){b.style.display="none";(function(){if(b.readyState==4){aT(a);}else{setTimeout(arguments.callee,10);}})();}else{b.parentNode.removeChild(b);}}}function aT(a){var b=aS(a);if(b){for(var c in b){if(typeof b[c]=="function"){b[c]=null;}}b.parentNode.removeChild(b);}}function aS(a){var c=null;try{c=aL.getElementById(a);}catch(b){}return c;}function ar(a){return aL.createElement(a);}function aM(a,c,b){a.attachEvent(c,b);al[al.length]=[a,c,b];}function ao(a){var b=ah.pv,c=a.split(".");c[0]=parseInt(c[0],10);c[1]=parseInt(c[1],10)||0;c[2]=parseInt(c[2],10)||0;return(b[0]>c[0]||(b[0]==c[0]&&b[1]>c[1])||(b[0]==c[0]&&b[1]==c[1]&&b[2]>=c[2]))?true:false;}function az(b,f,a,c){if(ah.ie&&ah.mac){return;}var e=aL.getElementsByTagName("head")[0];if(!e){return;}var g=(a&&typeof a=="string")?a:"screen";if(c){aH=null;an=null;}if(!aH||an!=g){var d=ar("style");d.setAttribute("type","text/css");d.setAttribute("media",g);aH=e.appendChild(d);if(ah.ie&&ah.win&&typeof aL.styleSheets!=aq&&aL.styleSheets.length>0){aH=aL.styleSheets[aL.styleSheets.length-1];}an=g;}if(ah.ie&&ah.win){if(aH&&typeof aH.addRule==aD){aH.addRule(b,f);}}else{if(aH&&typeof aL.createTextNode!=aq){aH.appendChild(aL.createTextNode(b+" {"+f+"}"));}}}function ay(a,c){if(!aI){return;}var b=c?"visible":"hidden";if(ak&&aS(a)){aS(a).style.visibility=b;}else{az("#"+a,"visibility:"+b);}}function ai(b){var a=/[\\\"<>\.;]/;var c=a.exec(b)!=null;return c&&typeof encodeURIComponent!=aq?encodeURIComponent(b):b;}var aR=function(){if(ah.ie&&ah.win){window.attachEvent("onunload",function(){var a=al.length;for(var b=0;b<a;b++){al[b][0].detachEvent(al[b][1],al[b][2]);}var d=ag.length;for(var c=0;c<d;c++){aw(ag[c]);}for(var e in ah){ah[e]=null;}ah=null;for(var f in swfobject){swfobject[f]=null;}swfobject=null;});}}();return{registerObject:function(a,e,c,b){if(ah.w3&&a&&e){var d={};d.id=a;d.swfVersion=e;d.expressInstall=c;d.callbackFn=b;aG[aG.length]=d;ay(a,false);}else{if(b){b({success:false,id:a});}}},getObjectById:function(a){if(ah.w3){return av(a);}},embedSWF:function(k,e,h,f,c,a,b,i,g,j){var d={success:false,id:e};if(ah.w3&&!(ah.wk&&ah.wk<312)&&k&&e&&h&&f&&c){ay(e,false);aj(function(){h+="";f+="";var q={};if(g&&typeof g===aD){for(var o in g){q[o]=g[o];}}q.data=k;q.width=h;q.height=f;var n={};if(i&&typeof i===aD){for(var p in i){n[p]=i[p];}}if(b&&typeof b===aD){for(var l in b){if(typeof n.flashvars!=aq){n.flashvars+="&"+l+"="+b[l];}else{n.flashvars=l+"="+b[l];}}}if(ao(c)){var m=aA(q,n,e);if(q.id==e){ay(e,true);}d.success=true;d.ref=m;}else{if(a&&au()){q.data=a;ae(q,n,e,j);return;}else{ay(e,true);}}if(j){j(d);}});}else{if(j){j(d);}}},switchOffAutoHideShow:function(){aI=false;},ua:ah,getFlashPlayerVersion:function(){return{major:ah.pv[0],minor:ah.pv[1],release:ah.pv[2]};},hasFlashPlayerVersion:ao,createSWF:function(a,b,c){if(ah.w3){return aA(a,b,c);}else{return undefined;}},showExpressInstall:function(b,a,d,c){if(ah.w3&&au()){ae(b,a,d,c);}},removeSWF:function(a){if(ah.w3){aw(a);}},createCSS:function(b,a,c,d){if(ah.w3){az(b,a,c,d);}},addDomLoadEvent:aj,addLoadEvent:aC,getQueryParamValue:function(b){var a=aL.location.search||aL.location.hash;if(a){if(/\?/.test(a)){a=a.split("?")[1];}if(b==null){return ai(a);}var c=a.split("&");for(var d=0;d<c.length;d++){if(c[d].substring(0,c[d].indexOf("="))==b){return ai(c[d].substring((c[d].indexOf("=")+1)));}}}return"";},expressInstallCallback:function(){if(aU){var a=aS(ac);if(a&&aJ){a.parentNode.replaceChild(aJ,a);if(ad){ay(ad,true);if(ah.ie&&ah.win){aJ.style.display="block";}}if(ap){ap(at);}}aU=false;}}};}();window.NOMENSA=window.NOMENSA||{};window.NOMENSA.player=window.NOMENSA.player||{};window.NOMENSA.player.YoutubePlayer=function(a){this.config=a;this.config.playerVars={controls:0,showinfo:0,origin:window.location.protocol+"//"+window.location.hostname,rel:0};};window.NOMENSA.player.YoutubePlayer.apiLoaded=false;window.NOMENSA.player.YoutubePlayer.prototype={getYTOptions:function(){var b=this,a={height:this.config.flashHeight,width:this.config.flashWidth,videoId:this.config.media,events:{onReady:function(c){b.$html.find("iframe").attr({id:b.config.id,role:"presentation"});b.onPlayerReady(c);},onStateChange:function(c){b.onPlayerStateChange(c.data);}}};a.playerVars=this.config.playerVars;if(this.config.repeat){a.playerVars.playlist=this.config.media;}return a;},init:function(){if(typeof window.postMessage!=="undefined"){return function(d){var a=document.createElement("script"),b=document.getElementsByTagName("script")[0],c=this;this.$html=this.assembleHTML();if(this.config.captions){this.getCaptions();}d.html(this.$html);window.NOMENSA.player.PlayerDaemon.addPlayer(this);if(!window.NOMENSA.player.YoutubePlayer.apiLoaded){if(typeof window.onYouTubeIframeAPIReady==="undefined"){window.onYouTubeIframeAPIReady=function(){window.NOMENSA.player.PlayerDaemon.map(function(e){if(typeof e.getYTOptions!=="undefined"){e.player=new YT.Player("player-"+e.config.id,e.getYTOptions());}});window.NOMENSA.player.YoutubePlayer.apiLoaded=true;};a.src="//www.youtube.com/iframe_api";b.parentNode.insertBefore(a,b);}}else{this.player=YT.Player("player-"+player.config.id,getOptions(player));}};}else{return function(b){var a=this;this.$html=this.assembleHTML();if(this.config.captions){this.getCaptions();}b.html(this.$html);window.NOMENSA.player.PlayerDaemon.addPlayer(this);window.NOMENSA.player.stateHandlers[this.config.id]=function(d){var c=window.NOMENSA.player.PlayerDaemon.getPlayer(a.config.id);c.onPlayerStateChange(d);};window.onYouTubePlayerReady=function(c){var d=window.NOMENSA.player.PlayerDaemon.getPlayer(c);var e=document.getElementById(d.config.id);d.player=e;d.cue();d.getPlayer().addEventListener("onStateChange","window.NOMENSA.player.stateHandlers."+a.config.id);d.onPlayerReady();};};}}(),state:{ended:0,playing:1,paused:2,unstarted:-1},onPlayerReady:(function(){var b=[],a;return function(d){var c=b.length;if(typeof d==="function"){b.push(d);}else{if(c===0){return false;}for(a=0;a<c;a++){b[a].apply(this,arguments);}}};}()),onPlayerStateChange:function(a){if(a==1){this.play();if(this.config.buttons.toggle){this.$html.find(".play").removeClass("play").addClass("pause").text("Pause");}}else{if(this.config.repeat&&(a==0)){this.play();}}},getFlashVars:function(){var a={controlbar:"none",file:this.config.media};if(this.config.image!=""){a.image=this.config.image;}if(this.config.repeat){a.repeat=this.config.repeat;}return a;},getFlashParams:function(){return{allowScriptAccess:"always",wmode:"transparent"};},generateFlashPlayer:function(c){var g=this;var a=this.getFlashVars();var f=this.getFlashParams();var h={id:this.config.id,name:this.config.id};var e=$("<"+this.config.flashContainer+" />").attr("id","player-"+this.config.id).addClass("flashReplace").html('This content requires Macromedia Flash Player. You can <a href="http://get.adobe.com/flashplayer/">install or upgrade the Adobe Flash Player here</a>.');var d=$("<span />").addClass("video");var b=this.getURL();setTimeout(function(){swfobject.embedSWF(b,e.attr("id"),g.config.flashWidth,g.config.flashHeight,"9.0.115",null,a,f,h,g.config.swfCallback);if($.browser.mozilla&&(parseInt($.browser.version,10)>=2)){g.$html.find("object").attr("tabindex","-1");}},0);c.append(d.append(e));return c;},generateVideoPlayer:function(b){if(typeof window.postMessage==="undefined"){return this.generateFlashPlayer(b);}else{var a=$("<"+this.config.flashContainer+" />").attr("id","player-"+this.config.id);var c=$("<span />").addClass("video");b.append(c.append(a));return b;}},getPlayer:function(){return this.player;},is_html5:false,play:function(){this.player.playVideo();this.setSliderTimeout();if(this.config.captionsOn&&this.captions){this.setCaptionTimeout();}},pause:function(){this.player.pauseVideo();this.clearSliderTimeout();if(this.config.captionsOn&&this.captions){this.clearCaptionTimeout();}},ffwd:function(){var b=this.getCurrentTime()+this.config.playerSkip,a=this.getDuration();if(b>a){b=a;}this.seek(b);},rewd:function(){var a=this.getCurrentTime()-this.config.playerSkip;if(a<0){a=0;}this.seek(a);},mute:function(){var a=this.$html.find("button.mute");if(this.player.isMuted()){this.player.unMute();if(a.hasClass("muted")){a.removeClass("muted");}}else{this.player.mute();a.addClass("muted");}},volup:function(){var a=this.player.getVolume();if(a>=100){a=100;}else{a=a+this.config.volumeStep;}this.player.setVolume(a);this.updateVolume(a);},voldwn:function(){var a=this.player.getVolume();if(a<=0){a=0;}else{a=a-this.config.volumeStep;}this.player.setVolume(a);this.updateVolume(a);},getDuration:function(){return this.player.getDuration();},getCurrentTime:function(){return this.player.getCurrentTime();},getBytesLoaded:function(){return this.player.getVideoBytesLoaded();},getBytesTotal:function(){return this.player.getVideoBytesTotal();},seek:function(a){this.player.seekTo(a,true);if(this.config.captionsOn&&this.captions){this.$html.find(".caption").remove();this.clearCaptionTimeout();this.setCaptionTimeout();this.getPreviousCaption();}},cue:function(){this.player.cueVideoById(this.config.media);},toggleCaptions:function(){var a=this;var b=this.$html.find(".captions");if(b.hasClass("captions-off")){b.removeClass("captions-off").addClass("captions-on");a.getPreviousCaption();a.setCaptionTimeout();a.config.captionsOn=true;}else{b.removeClass("captions-on").addClass("captions-off");a.clearCaptionTimeout();a.$html.find(".caption").remove();a.config.captionsOn=false;}}};window.NOMENSA=window.NOMENSA||{};window.NOMENSA.player=window.NOMENSA.player||{};window.NOMENSA.player.MediaplayerDecorator=function(a){var b=a;this.config=b.config;this.player=b.player;this.state=b.state;for(var c in b){if(typeof b[c]==="function"){this[c]=(function(d){return function(){return b[d].apply(this,arguments);};}(c));}}};window.NOMENSA.player.MediaplayerDecorator.prototype.generatePlayerContainer=function(){var a=$("<"+this.config.playerContainer+" />").css(this.config.playerStyles).addClass("player-container");if($.browser.msie){a.addClass("player-container-ie player-container-ie-"+$.browser.version.substring(0,1));}return a;};window.NOMENSA.player.MediaplayerDecorator.prototype.assembleHTML=function(){var a=this.generatePlayerContainer();var c=this.generateVideoPlayer(a);var b=c.append(this.getControls());return b;};window.NOMENSA.player.MediaplayerDecorator.prototype.getURL=function(){return[this.config.url,this.config.id].join("");};window.NOMENSA.player.MediaplayerDecorator.prototype.createButton=function(d,b){var a=0;var e=[d,this.config.id].join("-");var c=$("<button />").append(b).addClass(d).attr({title:d,id:e}).addClass("ui-corner-all ui-state-default").hover(function(){$(this).addClass("ui-state-hover");},function(){$(this).removeClass("ui-state-hover");}).focus(function(){$(this).addClass("ui-state-focus");}).blur(function(){$(this).removeClass("ui-state-focus");}).click(function(f){f.preventDefault();});return c;};window.NOMENSA.player.MediaplayerDecorator.prototype.getFuncControls=function(){var l=this;var j=$("<div>");j[0].className="player-controls";var g=[];if(l.config.buttons.toggle){var a=l.createButton("play","Play").attr({"aria-live":"assertive"}).click(function(){if($(this).hasClass("play")){$(this).removeClass("play").addClass("pause").attr({title:"Pause",id:"pause-"+l.config.id}).text("Pause");l.play();}else{$(this).removeClass("pause").addClass("play").attr({title:"Play",id:"play-"+l.config.id}).text("Play");l.pause();}});g.push(a);}else{var c=l.createButton("play","Play").click(function(){l.play();});var k=l.createButton("pause","Pause").click(function(){l.pause();});g.push(c);g.push(k);}if(l.config.buttons.rewind){var f=l.createButton("rewind","Rewind").click(function(){l.rewd();});g.push(f);}if(l.config.buttons.forward){var h=l.createButton("forward","Forward").click(function(){l.ffwd();});g.push(h);}if(l.config.captions){var b=l.createButton("captions","Captions").click(function(){l.toggleCaptions();});var d=(l.config.captionsOn==true)?"captions-on":"captions-off";b.addClass(d);g.push(b);}for(var e=0;e<g.length;e=e+1){j[0].appendChild(g[e][0]);}return j;};window.NOMENSA.player.MediaplayerDecorator.prototype.getVolControls=function(){var c=this;var g=$("<div>").addClass("volume-controls");var b=c.createButton("mute","Mute").click(function(){c.mute();});var h=c.createButton("vol-up",'+<span class="ui-helper-hidden-accessible"> Volume Up</span>').click(function(){c.volup();});var e=c.createButton("vol-down",'-<span class="ui-helper-hidden-accessible"> Volume Down</span>').click(function(){c.voldwn();});var f=$("<span />").attr({id:"vol-"+c.config.id,"class":"vol-display"}).text("100%");var a=[b,e,h,f];for(var d=0;d<a.length;d=d+1){g[0].appendChild(a[d][0]);}return g;};window.NOMENSA.player.MediaplayerDecorator.prototype.getSliderBar=function(){var c=$("<span />").addClass("ui-helper-hidden-accessible").html("<p>The timeline slider below uses WAI ARIA. Please use the documentation for your screen reader to find out more.</p>");var a=$("<span />").addClass("current-time").attr({id:"current-"+this.config.id}).text("00:00:00");var g=this.getSlider();var f=$("<span />").addClass("duration-time").attr({id:"duration-"+this.config.id}).text("00:00:00");var e=$("<div />").addClass("timer-bar").append(c);var d=[a,g,f];for(var b=0;b<d.length;b=b+1){e[0].appendChild(d[b][0]);}return e;};window.NOMENSA.player.MediaplayerDecorator.prototype.getSlider=function(){var d=this;var a=$("<span />").attr("id","slider-"+this.config.id).slider({orientation:"horizontal",change:function(f,g){var e=g.value;var h=(e/100)*d.getDuration();d.seek(h);}});a.find("a.ui-slider-handle").attr({role:"slider","aria-valuemin":"0","aria-valuemax":"100","aria-valuenow":"0","aria-valuetext":"0 percent",title:"Slider Control"});var c=$("<span />").addClass("progress-bar").attr({id:"progress-bar-"+this.config.id,tabindex:"-1"}).addClass("ui-progressbar-value ui-widget-header ui-corner-left").css({width:"0%",height:"95%"});var b=$("<span />").attr({id:"loaded-bar-"+this.config.id,tabindex:"-1"}).addClass("loaded-bar ui-progressbar-value ui-widget-header ui-corner-left").css({height:"95%",width:"0%"});return a.append(c,b);};window.NOMENSA.player.MediaplayerDecorator.prototype.setSliderTimeout=function(){var a=this;if(a.sliderInterval==undefined){a.sliderInterval=setInterval(function(){a.updateSlider();},a.config.sliderTimeout);}};window.NOMENSA.player.MediaplayerDecorator.prototype.clearSliderTimeout=function(){var a=this;if(a.sliderInterval!=undefined){a.sliderInterval=clearInterval(a.sliderInterval);}};window.NOMENSA.player.MediaplayerDecorator.prototype.updateSlider=function(){var c=(typeof(this.duration)!="undefined")?this.duration:this.getDuration();var a=(typeof(this.duration_found)=="boolean")?this.duration_found:false;var d=this.getCurrentTime();var b=0;if(c>0){b=(d/c)*100;b=parseInt(b,10);}else{c=0;}if(!a){$("#duration-"+this.config.id).html(this.formatTime(parseInt(c,10)));this.duration_found=true;}$("#slider-"+this.config.id).find("a.ui-slider-handle").attr({"aria-valuenow":b,"aria-valuetext":b.toString()+" percent"}).css("left",b.toString()+"%");$("#progress-bar-"+this.config.id).attr({"aria-valuenow":b,"aria-valuetext":b.toString()+" percent"}).css("width",b.toString()+"%");this.updateLoaderBar();this.updateTime(d);};window.NOMENSA.player.MediaplayerDecorator.prototype.updateLoaderBar=function(){var a=(this.getBytesLoaded()/this.getBytesTotal())*100;a=parseInt(a,10);if(!isFinite(a)){a=0;}$("#loaded-bar-"+this.config.id).attr({"aria-valuetext":a.toString()+" percent","aria-valuenow":a}).css("width",a.toString()+"%");};window.NOMENSA.player.MediaplayerDecorator.prototype.formatTime=function(e){var a=0;var d=0;var f=0;if(e>=60){d=parseInt(e/60,10);f=e-(d*60);if(d>=60){a=parseInt(d/60,10);d-=parseInt(a*60,10);}}else{f=e;}var c=[a,d,f];for(var b=0;b<c.length;b=b+1){c[b]=(c[b]<10)?"0"+c[b].toString():c[b].toString();}return c.join(":");};window.NOMENSA.player.MediaplayerDecorator.prototype.updateTime=function(b){var a=this.formatTime(parseInt(b,10));this.$html.find("#current-"+this.config.id).html(a);};window.NOMENSA.player.MediaplayerDecorator.prototype.getControls=function(){var a=$("<span />").addClass("ui-corner-bottom").addClass("control-bar");var d=$("<a />").attr("href","http://www.nomensa.com?ref=logo").html("Accessible Media Player by Nomensa").addClass("logo");a.append(d);var b=this.getFuncControls();var e=this.getVolControls();var g=this.getSliderBar();var f=[b,e,g];for(var c=0;c<f.length;c=c+1){a[0].appendChild(f[c][0]);}return a;};window.NOMENSA.player.MediaplayerDecorator.prototype.updateVolume=function(b){$("#vol-"+this.config.id).text(b.toString()+"%");var a=this.$html.find("button.mute");if(b==0){a.addClass("muted");}else{if(a.hasClass("muted")){a.removeClass("muted");}}};window.NOMENSA.player.MediaplayerDecorator.prototype.getCaptions=function(){var b=this;if(b.config.captions){var a=[];$.ajax({url:b.config.captions,success:function(c){if($(c).find("p").length>0){b.captions=$(c).find("p");}}});}};window.NOMENSA.player.MediaplayerDecorator.prototype.toggleCaptions=function(){var a=this;var b=this.$html.find(".captions");if(b.hasClass("captions-off")){b.removeClass("captions-off").addClass("captions-on");a.getPreviousCaption();a.setCaptionTimeout();a.config.captionsOn=true;}else{b.removeClass("captions-on").addClass("captions-off");a.clearCaptionTimeout();a.$html.find(".caption").remove();a.config.captionsOn=false;}};window.NOMENSA.player.MediaplayerDecorator.prototype.syncCaptions=function(){var a;if(this.captions){var b=this.getCurrentTime();b=this.formatTime(parseInt(b,10));a=this.captions.filter('[begin="'+b+'"]');if(a.length==1){this.insertCaption(a);}}};window.NOMENSA.player.MediaplayerDecorator.prototype.insertCaption=function(a){if(this.$html.find(".caption").length==1){this.$html.find(".caption").text(a.text());}else{var b=$("<div>").text(a.text());b[0].className="caption";this.$html.find(".video").prepend(b);}};window.NOMENSA.player.MediaplayerDecorator.prototype.getPreviousCaption=function(c){var a;if(c==undefined){c=this.getCurrentTime();}var b=this.formatTime(parseInt(c,10));if(this.captions){a=this.captions.filter('[begin="'+b+'"]');while((a.length!=1)&&(c>0)){c--;b=this.formatTime(parseInt(c,10));a=this.captions.filter('[begin="'+b+'"]');}if(a.length==1){this.insertCaption(a);}}};window.NOMENSA.player.MediaplayerDecorator.prototype.destroyPlayerInstance=function(){return false;};window.NOMENSA.player.MediaplayerDecorator.prototype.destroy=function(){this.clearSliderTimeout();this.clearCaptionTimeout();this.destroyPlayerInstance();this.$html.remove();};window.NOMENSA.player.MediaplayerDecorator.prototype.setCaptionTimeout=function(){var a=this;if(a.captionInterval==undefined){a.captionInterval=setInterval(function(){a.syncCaptions();},500);}};window.NOMENSA.player.MediaplayerDecorator.prototype.clearCaptionTimeout=function(){if(this.captionInterval!=undefined){this.captionInterval=clearInterval(this.captionInterval);}};window.NOMENSA=window.NOMENSA||{};window.NOMENSA.player=window.NOMENSA.player||{};jQuery(function(a){a(window).resize(function(){a(".player-container").each(function(){if(a(this).width()>580){a(this).addClass("player-wide");}else{a(this).removeClass("player-wide");}});});});if(typeof window.postMessage==="undefined"){window.NOMENSA.player.stateHandlers={};}window.NOMENSA.player.PlayerManager=function(){var a={};this.getPlayer=function(b){if(a[b]!=undefined){return a[b];}return null;};this.addPlayer=function(b){a[b.config.id]=b;return true;};this.removePlayer=function(b){if(a[b]!=undefined){a[b].destroy();delete a[b];}};this.map=function(c){var b;for(b in a){c(a[b]);}};};window.NOMENSA.player.PlayerDaemon=new window.NOMENSA.player.PlayerManager();var html5_methods={play:function(){this.player.play();this.setSliderTimeout();if(this.config.captionsOn&&this.captions){this.setCaptionTimeout();}},pause:function(){this.player.pause();this.clearSliderTimeout();if(this.config.captionsOn&&this.captions){this.clearCaptionTimeout();}},ffwd:function(){var a=this.getCurrentTime()+this.config.playerSkip;this.seek(a);},rewd:function(){var a=this.getCurrentTime()-this.config.playerSkip;if(a<0){a=0;}this.seek(a);},mute:function(){var a=this.$html.find("button.mute");if(this.player.muted){this.player.muted=false;if(a.hasClass("muted")){a.removeClass("muted");}}else{this.player.muted=true;a.addClass("muted");}},volup:function(){var a=this.player.volume*100;if(a<(100-this.config.volumeStep)){a+=this.config.volumeStep;}else{a=100;}this.player.volume=(a/100);this.updateVolume(Math.round(a));},voldwn:function(){var a=this.player.volume*100;if(a>this.config.volumeStep){a-=this.config.volumeStep;}else{a=0;}this.player.volume=(a/100);this.updateVolume(Math.round(a));},getDuration:function(){return this.player.duration;},getCurrentTime:function(){return this.player.currentTime;},getBytesLoaded:function(){return this.player.buffered.end(0);},getBytesTotal:function(){return this.player.duration;},seek:function(a){this.player.currentTime=a;},cue:function(){return;}};(function(a){a.fn.player=function(k,g){var f={id:"media_player",url:window.location.protocol+"//www.youtube.com/apiplayer?enablejsapi=1&version=3&playerapiid=",media:"8LiQ-bLJaM4",repeat:false,captions:null,captionsOn:true,flashWidth:"100%",flashHeight:"300px",playerStyles:{height:"100%",width:"100%"},sliderTimeout:350,flashContainer:"span",playerContainer:"span",image:"",playerSkip:10,volumeStep:10,buttons:{forward:true,rewind:true,toggle:true},logoURL:"http://www.nomensa.com?ref=logo",useHtml5:true,swfCallback:null};var c=a.extend(true,{},f,k);var e=function(m,l){var o=document.createElement(l);if(o.canPlayType!=undefined){var n=o.canPlayType(m);if((n.toLowerCase()=="maybe")||(n.toLowerCase()=="probably")){return true;}}return false;};var i=function(n){var m="";var l="video";switch(n){case"mp4":m='video/mp4; codecs="avc1.42E01E, mp4a.40.2"';break;case"m4v":m='video/mp4; codecs="avc1.42E01E, mp4a.40.2"';break;case"ogg":m='video/ogg; codecs="theora, vorbis"';break;case"ogv":m='video/ogg; codecs="theora, vorbis"';break;case"webm":m='video/webm; codecs="vp8, vorbis"';break;case"mp3":m="audio/mpeg";l="audio";break;}return{mimetype:m,container:l};};var h=function(l){var p=l.config.media;var n=p.lastIndexOf(".");if(n!=-1){var m=p.substring(n+1);var o=i(m);return o;}return null;};var b=function(){if(a.browser.mozilla){return(parseInt(a.browser.version,10)>=2)?true:false;}return false;};var d={generatePlayerContainer:function(){var l=a("<"+this.config.playerContainer+" />").css(this.config.playerStyles).addClass("player-container");if(a.browser.msie){l.addClass("player-container-ie player-container-ie-"+a.browser.version.substring(0,1));}return l;},getFlashVars:function(){var l={controlbar:"none",file:this.config.media};if(this.config.image!=""){l.image=this.config.image;}if(this.config.repeat){l.repeat=this.config.repeat;}return l;},getFlashParams:function(){return{allowScriptAccess:"always",wmode:"transparent"};},getURL:function(){return[this.config.url,this.config.id].join("");},generateFlashPlayer:function(n){var r=this;var l=this.getFlashVars();var q=this.getFlashParams();var s={id:this.config.id,name:this.config.id};var p=a("<"+this.config.flashContainer+" />").attr("id","player-"+this.config.id).addClass("flashReplace").html('This content requires Macromedia Flash Player. You can <a href="http://get.adobe.com/flashplayer/">install or upgrade the Adobe Flash Player here</a>.');var o=a("<span />").addClass("video");var m=this.getURL();setTimeout(function(){swfobject.embedSWF(m,p.attr("id"),r.config.flashWidth,r.config.flashHeight,"9.0.115",null,l,q,s,r.config.swfCallback);if(b()){r.$html.find("object").attr("tabindex","-1");}},0);n.append(o.append(p));return n;},generateHTML5Player:function(m,p,o){var n=a("<span />");n[0].className="video";var l=a("<"+p+" />").attr({id:this.config.id,src:this.config.media,type:o}).css({width:"100%",height:"50%"});if(a.trim(this.config.image)!=""){l.attr({poster:a.trim(this.config.image)});}return m.append(n.append(l));},createButton:function(o,m){var l=0;var p=[o,this.config.id].join("-");var n=a("<button />").append(m).addClass(o).attr({title:o,id:p}).addClass("ui-corner-all ui-state-default").hover(function(){a(this).addClass("ui-state-hover");},function(){a(this).removeClass("ui-state-hover");}).focus(function(){a(this).addClass("ui-state-focus");}).blur(function(){a(this).removeClass("ui-state-focus");}).click(function(q){q.preventDefault();});return n;},getFuncControls:function(){var v=this;var t=a("<div>");t[0].className="player-controls";var r=[];if(v.config.buttons.toggle){var l=v.createButton("play","Play").attr({"aria-live":"assertive"}).click(function(){if(a(this).hasClass("play")){a(this).removeClass("play").addClass("pause").attr({title:"Pause",id:"pause-"+v.config.id}).text("Pause");v.play();}else{a(this).removeClass("pause").addClass("play").attr({title:"Play",id:"play-"+v.config.id}).text("Play");v.pause();}});r.push(l);}else{var n=v.createButton("play","Play").click(function(){v.play();});var u=v.createButton("pause","Pause").click(function(){v.pause();});r.push(n);r.push(u);}if(v.config.buttons.rewind){var q=v.createButton("rewind","Rewind").click(function(){v.rewd();});r.push(q);}if(v.config.buttons.forward){var s=v.createButton("forward","Forward").click(function(){v.ffwd();});r.push(s);}if(v.config.captions){var m=v.createButton("captions","Captions").click(function(){v.toggleCaptions();});var o=(v.config.captionsOn==true)?"captions-on":"captions-off";m.addClass(o);r.push(m);}var p;for(p=0;p<r.length;p=p+1){t[0].appendChild(r[p][0]);}return t;},getVolControls:function(){var n=this;var r=a("<div>").addClass("volume-controls");var m=n.createButton("mute","Mute").click(function(){n.mute();});var s=n.createButton("vol-up",'+<span class="ui-helper-hidden-accessible"> Volume Up</span>').click(function(){n.volup();});var p=n.createButton("vol-down",'-<span class="ui-helper-hidden-accessible"> Volume Down</span>').click(function(){n.voldwn();});var q=a("<span />").attr({id:"vol-"+n.config.id,"class":"vol-display"}).text("100%");var l=[m,p,s,q];var o;for(o=0;o<l.length;o=o+1){r[0].appendChild(l[o][0]);}return r;},getSliderBar:function(){var n=a("<span />").addClass("ui-helper-hidden-accessible").html("<p>The timeline slider below uses WAI ARIA. Please use the documentation for your screen reader to find out more.</p>");var l=a("<span />").addClass("current-time").attr({id:"current-"+this.config.id}).text("00:00:00");var r=this.getSlider();var q=a("<span />").addClass("duration-time").attr({id:"duration-"+this.config.id}).text("00:00:00");var p=a("<div />").addClass("timer-bar").append(n);var o=[l,r,q];var m;for(m=0;m<o.length;m=m+1){p[0].appendChild(o[m][0]);}return p;},getSlider:function(){var o=this;var l=a("<span />").attr("id","slider-"+this.config.id).slider({orientation:"horizontal",change:function(q,r){var p=r.value;var s=(p/100)*o.getDuration();o.seek(s);}});l.find("a.ui-slider-handle").attr({role:"slider","aria-valuemin":"0","aria-valuemax":"100","aria-valuenow":"0","aria-valuetext":"0 percent",title:"Slider Control"});var n=a("<span />").addClass("progress-bar").attr({id:"progress-bar-"+this.config.id,tabindex:"-1"}).addClass("ui-progressbar-value ui-widget-header ui-corner-left").css({width:"0%",height:"95%"});var m=a("<span />").attr({id:"loaded-bar-"+this.config.id,tabindex:"-1"}).addClass("loaded-bar ui-progressbar-value ui-widget-header ui-corner-left").css({height:"95%",width:"0%"});return l.append(n,m);},setSliderTimeout:function(){var l=this;if(l.sliderInterval==undefined){l.sliderInterval=setInterval(function(){l.updateSlider();},l.config.sliderTimeout);}},clearSliderTimeout:function(){var l=this;if(l.sliderInterval!=undefined){l.sliderInterval=clearInterval(l.sliderInterval);}},updateSlider:function(){var n=(typeof(this.duration)!="undefined")?this.duration:this.getDuration();var l=(typeof(this.duration_found)=="boolean")?this.duration_found:false;var o=this.getCurrentTime();var m=0;if(n>0){m=(o/n)*100;m=parseInt(m,10);}else{n=0;}if(!l){a("#duration-"+this.config.id).html(this.formatTime(parseInt(n,10)));this.duration_found=true;}a("#slider-"+this.config.id).find("a.ui-slider-handle").attr({"aria-valuenow":m,"aria-valuetext":m.toString()+" percent"}).css("left",m.toString()+"%");a("#progress-bar-"+this.config.id).attr({"aria-valuenow":m,"aria-valuetext":m.toString()+" percent"}).css("width",m.toString()+"%");this.updateLoaderBar();this.updateTime(o);},updateLoaderBar:function(){var l=(this.getBytesLoaded()/this.getBytesTotal())*100;l=parseInt(l,10);if(!isFinite(l)){l=0;}a("#loaded-bar-"+this.config.id).attr({"aria-valuetext":l.toString()+" percent","aria-valuenow":l}).css("width",l.toString()+"%");},formatTime:function(p){var l=0;var o=0;var q=0;if(p>=60){o=parseInt(p/60,10);q=p-(o*60);if(o>=60){l=parseInt(o/60,10);o-=parseInt(l*60,10);}}else{q=p;}var n=[l,o,q];var m;for(m=0;m<n.length;m=m+1){n[m]=(n[m]<10)?"0"+n[m].toString():n[m].toString();}return n.join(":");},updateTime:function(m){var l=this.formatTime(parseInt(m,10));this.$html.find("#current-"+this.config.id).html(l);},getControls:function(){var l=a("<span />").addClass("ui-corner-bottom").addClass("control-bar");var o=a("<a />").attr("href","http://www.nomensa.com?ref=logo").html("Accessible Media Player by Nomensa").addClass("logo");l.append(o);var m=this.getFuncControls();var p=this.getVolControls();var r=this.getSliderBar();var q=[m,p,r];var n;for(n=0;n<q.length;n=n+1){l[0].appendChild(q[n][0]);}return l;},assembleHTML:function(){var l=this.generatePlayerContainer();var n=this.generateFlashPlayer(l);var m=n.append(this.getControls());return m;},assembleHTML5:function(p,o){var l=this.generatePlayerContainer();var n=this.generateHTML5Player(l,p,o);var m=n.append(this.getControls());return m;},updateVolume:function(m){a("#vol-"+this.config.id).text(m.toString()+"%");var l=this.$html.find("button.mute");if(m==0){l.addClass("muted");}else{if(l.hasClass("muted")){l.removeClass("muted");}}},getCaptions:function(){var m=this;if(m.config.captions){var l=[];a.ajax({url:m.config.captions,success:function(n){if(a(n).find("p").length>0){m.captions=a(n).find("p");}}});}},syncCaptions:function(){var l;if(this.captions){var m=this.getCurrentTime();m=this.formatTime(parseInt(m,10));l=this.captions.filter('[begin="'+m+'"]');if(l.length==1){this.insertCaption(l);}}},insertCaption:function(l){if(this.$html.find(".caption").length==1){this.$html.find(".caption").text(l.text());}else{var m=a("<div>").text(l.text());m[0].className="caption";this.$html.find(".video").prepend(m);}},getPreviousCaption:function(n){var l;if(n==undefined){n=this.getCurrentTime();}var m=this.formatTime(parseInt(n,10));if(this.captions){l=this.captions.filter('[begin="'+m+'"]');while((l.length!=1)&&(n>0)){n--;m=this.formatTime(parseInt(n,10));l=this.captions.filter('[begin="'+m+'"]');}if(l.length==1){this.insertCaption(l);}}},destroyPlayerInstance:function(){return false;},destroy:function(){this.clearSliderTimeout();this.clearCaptionTimeout();this.destroyPlayerInstance();this.$html.remove();},setCaptionTimeout:function(){var l=this;if(l.captionInterval==undefined){l.captionInterval=setInterval(function(){l.syncCaptions();},500);}},clearCaptionTimeout:function(){if(this.captionInterval!=undefined){this.captionInterval=clearInterval(this.captionInterval);}},play:function(){this.player.playVideo();this.setSliderTimeout();if(this.config.captionsOn&&this.captions){this.setCaptionTimeout();}},pause:function(){this.player.pauseVideo();this.clearSliderTimeout();if(this.config.captionsOn&&this.captions){this.clearCaptionTimeout();}},ffwd:function(){var l=this.getCurrentTime()+this.config.playerSkip;this.seek(l);},rewd:function(){var l=this.getCurrentTime()-this.config.playerSkip;if(l<0){l=0;}this.seek(l);},mute:function(){var l=this.$html.find("button.mute");if(this.player.isMuted()){this.player.unMute();if(l.hasClass("muted")){l.removeClass("muted");}}else{this.player.mute();l.addClass("muted");}},volup:function(){var l=this.player.getVolume();if(l<(100-this.config.volumeStep)){l+=this.config.volumeStep;}else{l=100;}this.player.setVolume(l);this.updateVolume(l);},voldwn:function(){var l=this.player.getVolume();if(l>this.config.volumeStep){l-=this.config.volumeStep;}else{l=0;}this.player.setVolume(l);this.updateVolume(l);},getDuration:function(){return this.player.getDuration();},getCurrentTime:function(){return this.player.getCurrentTime();},getBytesLoaded:function(){return this.player.getVideoBytesLoaded();},getBytesTotal:function(){return this.player.getVideoBytesTotal();},seek:function(l){this.player.seekTo(l);if(this.config.captionsOn&&this.captions){this.$html.find(".caption").remove();this.clearCaptionTimeout();this.setCaptionTimeout();this.getPreviousCaption();}},cue:function(){this.player.cueVideoById(this.config.media);},toggleCaptions:function(){var l=this;var m=this.$html.find(".captions");if(m.hasClass("captions-off")){m.removeClass("captions-off").addClass("captions-on");l.getPreviousCaption();l.setCaptionTimeout();l.config.captionsOn=true;}else{m.removeClass("captions-on").addClass("captions-off");l.clearCaptionTimeout();l.$html.find(".caption").remove();l.config.captionsOn=false;}}};function j(l){this.config=c;a.extend(true,this,d,g);this.is_html5=false;var m=h(this);if(m&&e(m.mimetype,m.container)&&this.config.useHtml5){this.is_html5=true;this.$html=this.assembleHTML5(m.container,m.mimetype);a.extend(this,html5_methods);}else{this.$html=this.assembleHTML();}if(this.config.captions){this.getCaptions();}}return this.each(function(n){var p=a(this),o,m,l=function(q){if(q.$html.width()>580){q.$html.addClass("player-wide");}if(q.is_html5){q.player=document.getElementById(q.config.id);}};if(c.url.match(/^(http|https)\:\/\/www\.youtube\.com/)){o=new window.NOMENSA.player.YoutubePlayer(c);m=new window.NOMENSA.player.MediaplayerDecorator(o);m.onPlayerReady(function(){l(m);this.getPlayer().setLoop(true);});m.init(p);}else{m=new j(n);p.html(m.$html);l(m);window.NOMENSA.player.PlayerDaemon.addPlayer(m);}});};}(jQuery));
/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());