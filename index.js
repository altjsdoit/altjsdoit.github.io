var Config, Editor, Main, Model;

window.applicationCache.addEventListener('updateready', function(ev) {
  if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
    window.applicationCache.swapCache();
    if (confirm('A new version of this site is available. Save and load it?')) {
      window.main.saveURI();
      return location.reload();
    }
  }
});

$(function() {
  return window.main = new Main;
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
    $("#config-project-save").click((function(_this) {
      return function(ev) {
        _this.saveURI();
        return _this.shareURI();
      };
    })(this));
    $("#menu-page-tab li").click((function(_this) {
      return function(ev) {
        var tab, target;
        ev.preventDefault();
        target = $(ev.target).attr("data-target");
        tab = $(ev.target).attr("data-tab");
        _this.model.set("tabPage", target);
        if (tab != null) {
          _this.model.set("tabEditor", tab);
        }
        return _this.saveURI();
      };
    })(this));
    $(window).resize(function() {
      return $("#main").css("top", $("#menu-page-tab").height()).height($(window).height() - $("#menu-page-tab").height());
    });
    $(window).resize();
    this.model.bind("change", (function(_this) {
      return function() {
        return _this.render();
      };
    })(this));
    this.render();
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
          throw new Error("unknown iframe type: " + opt.iframeType);
      }
    });
  };

  Main.prototype.stop = function() {
    return $("#box-sandbox-iframe").attr({
      "src": null,
      "srcdoc": null
    });
  };

  Main.prototype.render = function() {
    var opt;
    opt = this.model.toJSON();
    $("title").html(opt.title + (" - " + (new Date(opt.timestamp)) + " - altjsdo.it"));
    $("#menu").find(".selected").removeClass("selected");
    $("#main").find(".active").removeClass("active");
    $("#menu").find("[data-target='" + opt.tabPage + "'][data-tab='" + opt.tabEditor + "']").addClass("selected");
    $(opt.tabPage).addClass("active");
    if (opt.tabPage === "#box-sandbox") {
      return this.run();
    } else {
      return this.stop();
    }
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
    iframeType: "blob",
    tabPage: "#box-config",
    tabEditor: "script"
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
            return $("#menu-page-tab").children("[data-tab='script']").click();
          };
        })(this),
        "Ctrl-1": (function(_this) {
          return function(cm) {
            return $("#menu-page-tab").children("[data-tab='script']").click();
          };
        })(this),
        "Cmd-2": (function(_this) {
          return function(cm) {
            return $("#menu-page-tab").children("[data-tab='markup']").click();
          };
        })(this),
        "Ctrl-2": (function(_this) {
          return function(cm) {
            return $("#menu-page-tab").children("[data-tab='markup']").click();
          };
        })(this),
        "Cmd-3": (function(_this) {
          return function(cm) {
            return $("#menu-page-tab").children("[data-tab='style']").click();
          };
        })(this),
        "Ctrl-3": (function(_this) {
          return function(cm) {
            return $("#menu-page-tab").children("[data-tab='style']").click();
          };
        })(this),
        "Cmd-4": (function(_this) {
          return function(cm) {
            return $("#menu-page-tab").children("[data-tab='compile']").click();
          };
        })(this),
        "Ctrl-4": (function(_this) {
          return function(cm) {
            return $("#menu-page-tab").children("[data-tab='compile']").click();
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
      compile: "HTML"
    };
    this.doc = {
      script: new CodeMirror.Doc(""),
      markup: new CodeMirror.Doc(""),
      style: new CodeMirror.Doc(""),
      compile: new CodeMirror.Doc("")
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
  compile: function() {
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
        _this.doc.compile.setValue(srcdoc);
        if (_this.selected === "compile") {
          return $("#box-editor-textarea").val(srcdoc);
        }
      };
    })(this));
  },
  render: function() {
    var opt, tmp;
    opt = this.model.toJSON();
    tmp = $("#menu-page-tab");
    tmp.find("[data-target='#box-editor'][data-tab='script']").html(this.mode.script = opt.altjs);
    tmp.find("[data-target='#box-editor'][data-tab='markup']").html(this.mode.markup = opt.althtml);
    tmp.find("[data-target='#box-editor'][data-tab='style']").html(this.mode.style = opt.altcss);
    if ((opt.tabEditor != null) && this.selected !== opt.tabEditor) {
      if (!this.enableCodeMirror) {
        this.doc[this.selected].setValue($("#box-editor-textarea").val());
        $("#box-editor-textarea").val(this.doc[opt.tabEditor].getValue());
      }
      this.selected = opt.tabEditor;
    }
    if (this.selected === "compile") {
      this.compile();
    }
    if ((opt.enableCodeMirror != null) && this.enableCodeMirror !== opt.enableCodeMirror) {
      if (this.enableCodeMirror = opt.enableCodeMirror) {
        this.cm = CodeMirror.fromTextArea($("#box-editor-textarea")[0], this.option);
        this.originDoc = this.cm.swapDoc(this.doc[this.selected]);
      } else {
        this.cm.toTextArea();
        this.cm.swapDoc(this.originDoc);
        this.cm = null;
      }
    }
    if (this.enableCodeMirror) {
      this.cm.setSize("100%", "100%");
      this.cm.swapDoc(this.doc[this.selected]);
      this.cm.setOption("mode", getCompilerSetting(this.mode[this.selected]).mode);
      if (this.selected === "compile") {
        this.cm.setOption("readOnly", true);
      } else {
        this.cm.setOption("readOnly", false);
      }
    }
    return setTimeout((function(_this) {
      return function() {
        var _ref;
        return (_ref = _this.cm) != null ? _ref.refresh() : void 0;
      };
    })(this));
  }
});
