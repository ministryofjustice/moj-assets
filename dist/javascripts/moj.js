/*! moj-assets - v0.0.2 - 2014-01-31
* http://github.com/ministryofjustice
* Copyright (c) 2014 MOJ Digital Service; Licensed  */
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

(function () {
  'use strict';

  // Invite interested developers to join us
  moj.Modules.devs = {
    init: function () {
      var m = '      ___          ___       ___\n     /__/\\        /  /\\     /  /\\\n    |  |::\\      /  /::\\   /  /:/\n    |  |:|:\\    /  /:/\\:\\ /__/::\\\n  __|__|:|\\:\\  /  /:/  \\:\\\\__\\/\\:\\\n /__/::::| \\:\\/__/:/ \\__\\:\\  \\  \\:\\\n \\  \\:\\~~\\__\\/\\  \\:\\ /  /:/   \\__\\:\\\n  \\  \\:\\       \\  \\:\\  /:/    /  /:/\n   \\  \\:\\       \\  \\:\\/:/    /__/:/\n    \\  \\:\\       \\  \\::/     \\__\\/\n     \\__\\/        \\__\\/',
      txt = "\n\nLike what you see? Want to make a difference?"+
            "\n\nFind out how we're making the Ministry Of Justice Digital by Default."+
            "\nhttp://blogs.justice.gov.uk/digital/."+
            "\n\nGet in touch to see what positions are available and see what projects you could be working on."+
            "\nhttps://twitter.com/MOJDigital/statuses/413340917509001216";
      moj.log(m+txt);
    }
  };
}());

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