var Config, Editor, Main, Menu, Setting;

$(function() {
  return window.bbmain = new Main;
});

Config = Backbone.Model.extend({
  defaults: {
    timestamp: Date.now(),
    title: "no name",
    altjs: "JavaScript",
    althtml: "HTML",
    altcss: "CSS",
    iframeType: "blob"
  }
});

Main = Backbone.View.extend({
  el: "#layout",
  events: {
    "click #setting-project-save": "saveAndShorten"
  },
  saveURI: function() {
    var config, markup, script, style, url, _ref;
    this.model.set("timestamp", Date.now());
    config = JSON.stringify(this.model.toJSON());
    _ref = this.getValues(), script = _ref.script, markup = _ref.markup, style = _ref.style;
    url = makeURL(location) + "#" + encodeURIQuery({
      zip: zipDataURI({
        config: config,
        script: script,
        markup: markup,
        style: style
      })
    });
    $("#setting-project-url").val(url);
    $("#setting-project-size").html(url.length);
    return history.pushState(null, null, url);
  },
  saveAndShorten: function() {
    this.saveURI();
    return shortenURL($("#setting-project-url").val(), (function(_this) {
      return function(_url) {
        $("#setting-project-url").val(_url);
        $("#setting-project-twitter").html($("<a />").attr({
          "href": "https://twitter.com/share",
          "class": "twitter-share-button",
          "data-size": "large",
          "data-text": "'" + (_this.model.get('title')) + "'",
          "data-url": _url,
          "data-hashtags": "altjsdoit",
          "data-count": "none",
          "data-lang": "en"
        }).html("Tweet"));
        $("#setting-project-size").html(_url.length);
        return twttr.widgets.load();
      };
    })(this));
  },
  loadURI: function() {
    var config, markup, script, style, zip, _ref;
    zip = decodeURIQuery(location.hash.slice(1)).zip;
    if (zip != null) {
      _ref = unzipDataURI(zip), config = _ref.config, script = _ref.script, markup = _ref.markup, style = _ref.style;
      config = JSON.parse(config || "{}");
      this.model.set(config);
      return this.setValues({
        script: script,
        markup: markup,
        style: style
      });
    }
  },
  run: function() {
    var altcss, althtml, altjs, markup, opt, script, style, _opt, _ref;
    this.saveURI();
    opt = this.model.toJSON();
    altjs = opt.altjs, althtml = opt.althtml, altcss = opt.altcss;
    _ref = this.getValues(), script = _ref.script, markup = _ref.markup, style = _ref.style;
    _opt = Object.create(opt);
    return build({
      altjs: altjs,
      althtml: althtml,
      altcss: altcss
    }, {
      script: script,
      markup: markup,
      style: style
    }, _opt, function(srcdoc) {
      var url;
      switch (_opt.iframeType) {
        case "srcdoc":
          return $("#box-sandbox-iframe").attr({
            "srcdoc": srcdoc
          });
        case "base64":
          return encodeDataURI(srcdoc, "text/html", function(base64) {
            return $("#box-sandbox-iframe").attr({
              "src": base64
            });
          });
        case "blob":
          console.log(url = createBlobURL(srcdoc, (opt.enableViewSource ? "text/plain" : "text/html")));
          return $("#box-sandbox-iframe").attr({
            "src": url
          });
        default:
          throw new Error(_opt.iframeType);
      }
    });
  },
  initialize: function() {
    this.model = new Config();
    this.menu = new Menu({
      model: this.model
    });
    this.setting = new Setting({
      model: this.model
    });
    this.scriptEd = new Editor({
      model: this.model,
      el: $("#box-altjs-textarea")[0],
      type: "altjs"
    });
    this.markupEd = new Editor({
      model: this.model,
      el: $("#box-althtml-textarea")[0],
      type: "althtml"
    });
    this.styleEd = new Editor({
      model: this.model,
      el: $("#box-altcss-textarea")[0],
      type: "altcss"
    });
    this.setting.updateAll();
    this.loadURI();
    this.scriptEd.onsave = this.markupEd.onsave = this.styleEd.onsave = (function(_this) {
      return function() {
        return _this.saveURI();
      };
    })(this);
    this.scriptEd.onrun = this.markupEd.onrun = this.styleEd.onrun = (function(_this) {
      return function() {
        return _this.run();
      };
    })(this);
    $("#menu-altjs").click((function(_this) {
      return function() {
        return setTimeout(function() {
          return _this.scriptEd.refresh();
        });
      };
    })(this));
    $("#menu-althtml").click((function(_this) {
      return function() {
        return setTimeout(function() {
          return _this.markupEd.refresh();
        });
      };
    })(this));
    $("#menu-altcss").click((function(_this) {
      return function() {
        return setTimeout(function() {
          return _this.styleEd.refresh();
        });
      };
    })(this));
    $("#menu-sandbox").click((function(_this) {
      return function() {
        return _this.run();
      };
    })(this));
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
    return this.render();
  },
  setValues: function(_arg) {
    var markup, script, style;
    script = _arg.script, markup = _arg.markup, style = _arg.style;
    this.scriptEd.setValue(script || "");
    this.markupEd.setValue(markup || "");
    return this.styleEd.setValue(style || "");
  },
  getValues: function() {
    return {
      script: this.scriptEd.getValue() || "",
      markup: this.markupEd.getValue() || "",
      style: this.styleEd.getValue() || ""
    };
  },
  render: function() {
    var timestamp, title, _ref;
    _ref = this.model.toJSON(), title = _ref.title, timestamp = _ref.timestamp;
    return $("title").html(title + (" - " + (new Date(timestamp)) + " - altjsdo.it"));
  }
});

Menu = Backbone.View.extend({
  el: "#menu",
  initialize: function() {
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
    return this.render();
  },
  render: function() {
    var altcss, althtml, altjs, enableViewSource, title, _ref;
    _ref = this.model.toJSON(), title = _ref.title, altjs = _ref.altjs, althtml = _ref.althtml, altcss = _ref.altcss, enableViewSource = _ref.enableViewSource;
    $("#menu-head").html(title);
    $("#menu-altjs").html(altjs);
    $("#menu-althtml").html(althtml);
    $("#menu-altcss").html(altcss);
    return $("#menu-sandbox").html((enableViewSource ? "Compiled code" : "Run"));
  }
});

Setting = Backbone.View.extend({
  el: "#setting-config",
  events: {
    "change select": "update",
    "change input": "update"
  },
  updateAll: function() {
    var config;
    config = {};
    $(this.el).find("[data-config]").each(function(i, v) {
      return config[$(this).attr("data-config")] = getElmVal(this);
    });
    return this.model.set(config);
  },
  update: function(ev) {
    return this.model.set($(ev.target).attr("data-config"), getElmVal(ev.target));
  },
  initialize: function() {
    _.bindAll(this, "render");
    _.bindAll(this, "update");
    _.bindAll(this, "updateAll");
    this.model.bind("change", this.render);
    return this.render();
  },
  render: function() {
    var opt;
    opt = this.model.toJSON();
    return $(this.el).find("[data-config]").each((function(_this) {
      return function(i, v) {
        var key;
        key = $(v).attr("data-config");
        if (key.slice(0, 6) === "enable") {
          return _this.$el.find("[data-config='" + key + "']").attr("checked", opt[key]);
        } else {
          return _this.$el.find("[data-config='" + key + "']").val(opt[key]);
        }
      };
    })(this));
  }
});

Editor = Backbone.View.extend({
  initialize: function(_arg) {
    this.type = _arg.type;
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
    this.option = {
      tabMode: "indent",
      tabSize: 2,
      theme: 'solarized dark',
      autoCloseTags: true,
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      showCursorWhenSelecting: true,
      extraKeys: {
        "Tab": function(cm) {
          return CodeMirror.commands[(cm.getSelection().length ? "indentMore" : "insertSoftTab")](cm);
        },
        "Shift-Tab": "indentLess",
        "Cmd-R": (function(_this) {
          return function(cm) {
            return _this.onrun();
          };
        })(this),
        "Ctrl-R": (function(_this) {
          return function(cm) {
            return _this.onrun();
          };
        })(this),
        "Cmd-S": (function(_this) {
          return function(cm) {
            return _this.onsave();
          };
        })(this),
        "Ctrl-S": (function(_this) {
          return function(cm) {
            return _this.onsave();
          };
        })(this)
      }
    };
    this.onrun = function() {};
    this.onsave = function() {};
    this.refreshed = false;
    this.cm = CodeMirror.fromTextArea(this.el, this.option);
    this.cm.setSize("100%", "100%");
    return this.render();
  },
  setValue: function(str) {
    if (this.cm != null) {
      return this.cm.setValue(str);
    } else {
      return this.el.value = str;
    }
  },
  getValue: function() {
    if (this.cm != null) {
      return this.cm.getValue();
    } else {
      return this.el.value;
    }
  },
  refresh: function() {
    if (this.refreshed === false) {
      setTimeout((function(_this) {
        return function() {
          var _ref;
          return (_ref = _this.cm) != null ? _ref.refresh() : void 0;
        };
      })(this));
    }
    return this.refreshed = true;
  },
  render: function() {
    if ((this.cm != null) && this.cm.getOption("mode") !== this.model.get(this.type)) {
      this.cm.setOption("mode", getCompilerSetting(this.model.get(this.type)).mode);
    }
    if (this.model.get("enableCodeMirror") === false && (this.cm != null)) {
      this.cm.toTextArea();
      this.cm = null;
    }
    if (this.model.get("enableCodeMirror") === true && (this.cm == null)) {
      this.cm = CodeMirror.fromTextArea(this.el, this.option);
      this.cm.setSize("100%", "100%");
      return this.refreshed = false;
    }
  }
});
