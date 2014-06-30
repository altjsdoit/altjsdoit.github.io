var Config, Editor, Main, Model;

$(function() {
  window.main = new Main;
  return window.applicationCache.addEventListener('updateready', function(ev) {
    if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
      window.applicationCache.swapCache();
      if (confirm('A new version of this site is available. Save and load it?')) {
        window.main.saveURI();
        return location.reload();
      }
    }
  });
});

Main = (function() {
  function Main() {
    var config, uriData;
    config = loadDOM($("#box-config")[0]);
    uriData = loadURI(location);
    this.model = new Model();
    this.model.set(_.extend(config, uriData.config));
    this.config = new Config({
      model: this.model
    });
    this.editor = new Editor({
      model: this.model
    });
    this.editor.setValues({
      script: uriData.script || "console.log('hello world');",
      markup: uriData.markup || "<p class='helloworld'>hello world</p>",
      style: uriData.style || ".helloworld { color: gray; }"
    });
    $("#config-editor-codemirror").change((function(_this) {
      return function(ev) {
        return _this.editor.toggle(ev);
      };
    })(this));
    $("#config-project-save").click((function(_this) {
      return function(ev) {
        ev.preventDefault();
        _this.saveURI();
        return _this.shareURI();
      };
    })(this));
    $("#menu-page-tab li[data-target='#box-sandbox']").click((function(_this) {
      return function(ev) {
        return _this.run();
      };
    })(this));
    $("#menu-page-tab li").click((function(_this) {
      return function(ev) {
        var target;
        ev.preventDefault();
        $("#menu").find(".selected").removeClass("selected");
        $(ev.target).addClass("selected");
        $("#main").find(".active").removeClass("active");
        target = $(ev.target).attr("data-target");
        $(target).addClass("active");
        if (target !== "#box-sandbox") {
          _this.stop();
        }
        return _this.editor.render();
      };
    })(this));
    this.model.bind("change", (function(_this) {
      return function() {
        var opt;
        opt = _this.model.toJSON();
        return $("title").html(opt.title + (" - " + (new Date(opt.timestamp)) + " - altjsdo.it"));
      };
    })(this));
  }

  Main.prototype.dump = function() {
    var config, markup, script, style, _ref;
    _ref = this.editor.getValues(), script = _ref.script, markup = _ref.markup, style = _ref.style;
    config = JSON.stringify(this.model.toJSON());
    return {
      script: script,
      markup: markup,
      style: style,
      config: config
    };
  };

  Main.prototype.saveURI = function() {
    var url;
    this.model.set("timestamp", Date.now());
    url = makeURL(location) + "#" + encodeURIQuery({
      zip: zipDataURI(this.dump())
    });
    $("#config-project-url").val(url);
    return history.pushState(null, null, url);
  };

  Main.prototype.shareURI = function() {
    return shortenURL($("#config-project-url").val(), (function(_this) {
      return function(_url) {
        $("#config-project-url").val(_url);
        $("#config-project-twitter").html($("<a />").attr({
          "href": "https://twitter.com/share",
          "class": "twitter-share-button",
          "data-size": "large",
          "data-text": "'" + (_this.model.get('title')) + "'",
          "data-url": _url,
          "data-hashtags": "altjsdoit",
          "data-count": "none",
          "data-lang": "en"
        }).html("Tweet"));
        return twttr.widgets.load();
      };
    })(this));
  };

  Main.prototype.run = function() {
    var altcss, althtml, altjs, markup, opt, script, style, _ref, _ref1;
    _ref = opt = this.model.toJSON(), altjs = _ref.altjs, althtml = _ref.althtml, altcss = _ref.altcss;
    _ref1 = this.editor.getValues(), script = _ref1.script, markup = _ref1.markup, style = _ref1.style;
    return build({
      altjs: altjs,
      althtml: althtml,
      altcss: altcss
    }, {
      script: script,
      markup: markup,
      style: style
    }, opt, function(srcdoc) {
      var url;
      switch (opt.iframeType) {
        case "blob":
          console.log(url = createBlobURL(srcdoc, "text/html"));
          return $("#box-sandbox-iframe").attr({
            "src": url
          });
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
        case "message":
          return $("#box-sandbox-iframe").attr({
            "src": "iframe.html"
          }).on("load", function(ev) {
            console.log(srcdoc);
            return this.contentWindow.postMessage(srcdoc, "*");
          });
        default:
          throw new Error(opt.iframeType);
      }
    });
  };

  Main.prototype.stop = function() {
    return $("#box-sandbox-iframe").attr({
      "src": null,
      "srcdoc": null
    });
  };

  return Main;

})();

Model = Backbone.Model.extend({
  defaults: {
    timestamp: Date.now(),
    title: "no name",
    altjs: "JavaScript",
    althtml: "HTML",
    altcss: "CSS",
    iframeType: "blob"
  }
});

Config = Backbone.View.extend({
  el: "#box-config",
  events: {
    "change select": "load",
    "change input": "load"
  },
  load: function(ev) {
    return this.model.set($(ev.target).attr("data-config"), getElmVal(ev.target));
  },
  initialize: function() {
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
    return this.render();
  },
  render: function() {
    var opt;
    opt = this.model.toJSON();
    return Object.keys(opt).forEach((function(_this) {
      return function(key) {
        if (key.slice(0, 6) === "enable") {
          return _this.$el.find("[data-config='" + key + "']").attr("checked", (!!opt[key] ? "checked" : null));
        } else {
          return _this.$el.find("[data-config='" + key + "']").val(opt[key]);
        }
      };
    })(this));
  }
});

Editor = Backbone.View.extend({
  el: "#box-editor",
  events: {
    "click #box-editor-tab li": "selectTab",
    "click #box-editor-tab li[data-tab='compiled']": "compile"
  },
  compile: function(ev) {
    var altcss, althtml, altjs, markup, opt, script, style, _ref, _ref1;
    _ref = opt = this.model.toJSON(), altjs = _ref.altjs, althtml = _ref.althtml, altcss = _ref.altcss;
    _ref1 = this.getValues(), script = _ref1.script, markup = _ref1.markup, style = _ref1.style;
    return build({
      altjs: altjs,
      althtml: althtml,
      altcss: altcss
    }, {
      script: script,
      markup: markup,
      style: style
    }, opt, (function(_this) {
      return function(srcdoc) {
        _this.doc.compiled.setValue(srcdoc);
        if (_this.selected === "compiled") {
          $("#box-editor-textarea").val(srcdoc);
        }
        return _this.render();
      };
    })(this));
  },
  selectTab: function(ev) {
    var selected;
    ev.preventDefault();
    $(this.el).find(".selected").removeClass("selected");
    $(ev.target).addClass("selected");
    selected = $(ev.target).attr("data-tab");
    if (!this.enableCodeMirror) {
      this.doc[this.selected].setValue($("#box-editor-textarea").val());
      $("#box-editor-textarea").val(this.doc[selected].getValue());
    }
    this.selected = selected;
    return this.render();
  },
  toggle: function(ev) {
    if (this.enableCodeMirror = getElmVal(ev.target)) {
      this.cm = CodeMirror.fromTextArea($("#box-editor-textarea")[0], this.option);
      this.originDoc = this.cm.swapDoc(this.doc[this.selected]);
    } else {
      this.cm.toTextArea();
      this.cm.swapDoc(this.originDoc);
      this.cm = null;
    }
    return this.render();
  },
  initialize: function() {
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
            return main.run();
          };
        })(this),
        "Ctrl-R": (function(_this) {
          return function(cm) {
            return main.run();
          };
        })(this),
        "Cmd-S": (function(_this) {
          return function(cm) {
            return $("#config-project-save").click();
          };
        })(this),
        "Ctrl-S": (function(_this) {
          return function(cm) {
            return $("#config-project-save").click();
          };
        })(this),
        "Cmd-1": (function(_this) {
          return function(cm) {
            return $("#box-editor-tab").children("*:nth-child(1)").click();
          };
        })(this),
        "Ctrl-1": (function(_this) {
          return function(cm) {
            return $("#box-editor-tab").children("*:nth-child(1)").click();
          };
        })(this),
        "Cmd-2": (function(_this) {
          return function(cm) {
            return $("#box-editor-tab").children("*:nth-child(2)").click();
          };
        })(this),
        "Ctrl-2": (function(_this) {
          return function(cm) {
            return $("#box-editor-tab").children("*:nth-child(2)").click();
          };
        })(this),
        "Cmd-3": (function(_this) {
          return function(cm) {
            return $("#box-editor-tab").children("*:nth-child(3)").click();
          };
        })(this),
        "Ctrl-3": (function(_this) {
          return function(cm) {
            return $("#box-editor-tab").children("*:nth-child(3)").click();
          };
        })(this),
        "Cmd-4": (function(_this) {
          return function(cm) {
            return $("#box-editor-tab").children("*:nth-child(4)").click();
          };
        })(this),
        "Ctrl-4": (function(_this) {
          return function(cm) {
            return $("#box-editor-tab").children("*:nth-child(4)").click();
          };
        })(this)
      }
    };
    this.enableCodeMirror = true;
    this.selected = "script";
    this.mode = {
      script: "JavaScript",
      markup: "HTML",
      style: "CSS",
      compiled: "HTML"
    };
    this.doc = {
      script: new CodeMirror.Doc(""),
      markup: new CodeMirror.Doc(""),
      style: new CodeMirror.Doc(""),
      compiled: new CodeMirror.Doc("")
    };
    this.cm = CodeMirror.fromTextArea($("#box-editor-textarea")[0], this.option);
    this.originDoc = this.cm.swapDoc(this.doc.script);
    return this.render();
  },
  setValues: function(_arg) {
    var markup, script, style;
    script = _arg.script, markup = _arg.markup, style = _arg.style;
    if (script != null) {
      this.doc.script.setValue(script);
    }
    if (markup != null) {
      this.doc.markup.setValue(markup);
    }
    if (style != null) {
      return this.doc.style.setValue(style);
    }
  },
  getValues: function() {
    return {
      script: this.doc.script.getValue(),
      markup: this.doc.markup.getValue(),
      style: this.doc.style.getValue()
    };
  },
  render: function() {
    var opt, tmp, _ref;
    opt = this.model.toJSON();
    tmp = $("#box-editor-tab");
    tmp.find("[data-tab='script']").html(this.mode.script = opt.altjs);
    tmp.find("[data-tab='markup']").html(this.mode.markup = opt.althtml);
    tmp.find("[data-tab='style']").html(this.mode.style = opt.altcss);
    if (this.enableCodeMirror) {
      this.cm.setSize("100%", "100%");
      if ((_ref = this.cm) != null) {
        _ref.swapDoc(this.doc[this.selected]);
      }
      this.cm.setOption("mode", getCompilerSetting(this.mode[this.selected]).mode);
      if (this.selected === "compiled") {
        this.cm.setOption("readOnly", true);
      } else {
        this.cm.setOption("readOnly", false);
      }
    }
    return setTimeout((function(_this) {
      return function() {
        var _ref1;
        return (_ref1 = _this.cm) != null ? _ref1.refresh() : void 0;
      };
    })(this));
  }
});
