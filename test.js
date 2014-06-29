QUnit.config.testTimeout = 3500;

QUnit.module("URL");

QUnit.asyncTest("createBlobURL", function(assert) {
  var n, test;
  n = 0;
  test = function(val, expected) {
    var url;
    n++;
    url = createBlobURL(val, "text/plain");
    return URLToText(url, function(text) {
      assert.strictEqual(text, expected, text);
      if (--n === 0) {
        return QUnit.start();
      }
    });
  };
  test("𠮟", "𠮟");
  test("🐲", "🐲");
  test(new ArrayBuffer(), "");
  test(new Blob(), "");
  return expect(n);
});

QUnit.asyncTest("URLToText", function(assert) {
  var n, test;
  n = 0;
  test = function(val, expected) {
    var url;
    n++;
    url = createBlobURL(val, 'text/plain');
    return URLToText(url, function(text) {
      assert.strictEqual(text, expected, text);
      if (--n === 0) {
        return QUnit.start();
      }
    });
  };
  test("𠮟", "𠮟");
  test("🐲", "🐲");
  return expect(n);
});

QUnit.asyncTest("URLToArrayBuffer", function(assert) {
  var n, test;
  n = 0;
  test = function(val, expected) {
    var url;
    n++;
    url = createBlobURL(val, 'text/plain');
    return URLToArrayBuffer(url, function(arrayBuffer) {
      assert.strictEqual(arrayBuffer.byteLength, expected, arrayBuffer.byteLength);
      if (--n === 0) {
        return QUnit.start();
      }
    });
  };
  test("𠮟", 4);
  test("🐲", 4);
  test(new ArrayBuffer(12), 12);
  return expect(n);
});

QUnit.asyncTest("createProxyURLs", function(assert) {
  var n, urls;
  n = 0;
  urls = ["index.html", "test.html"];
  expect(urls.length);
  return createProxyURLs(urls, "text/html", function(_urls) {
    return _urls.forEach(function(_url, i) {
      n++;
      return URLToText(urls[i], function(html) {
        return URLToText(_urls[i], function(_html) {
          assert.strictEqual(_html, html, _html);
          if (--n === 0) {
            return QUnit.start();
          }
        });
      });
    });
  });
});

QUnit.asyncTest("encodeDataURI, decodeDataURI", function(assert) {
  var dic;
  expect(1);
  dic = {
    a: "a",
    b: "𠮟",
    c: "🐲"
  };
  return encodeDataURI(JSON.stringify(dic), "text/plain", function(base64) {
    return decodeDataURI(base64, function(json) {
      var _dic;
      _dic = JSON.parse(json);
      assert.deepEqual(_dic, dic, json);
      return QUnit.start();
    });
  });
});

QUnit.test("makeDomain", function(assert) {
  var url;
  expect(1);
  url = makeDomain(location);
  return assert.ok(typeof url === "string", url);
});

QUnit.test("makeURL", function(assert) {
  expect(1);
  return assert.strictEqual(makeURL(location) + location.search + location.hash, location.href);
});

QUnit.test("encodeURIQuery, decodeURIQuery", function(assert) {
  var dic, _dic;
  expect(1);
  dic = {
    a: "a",
    b: "𠮟",
    c: "🐲"
  };
  _dic = decodeURIQuery(encodeURIQuery(decodeURIQuery(encodeURIQuery(dic))));
  return assert.deepEqual(_dic, dic, _dic);
});

QUnit.asyncTest("shortenURL, expandURL", function(assert) {
  var url;
  expect(1);
  url = location.href;
  shortenURL(url, function(_url) {
    return expandURL(_url, function(__url) {
      return assert.strictEqual(__url, url, __url);
    });
  });
  return setTimeout((function() {
    return QUnit.start();
  }), 1000);
});

QUnit.module("ZIP");

QUnit.test("zipDataURI, unzipDataURI", function(assert) {
  var dic, _dic;
  expect(1);
  dic = {
    a: "a",
    b: "𠮟",
    c: "🐲"
  };
  _dic = unzipDataURI(zipDataURI(unzipDataURI(zipDataURI(dic))));
  return assert.deepEqual(_dic, dic, JSON.stringify(_dic));
});

QUnit.module("DOM");

QUnit.test("loadURI", function(assert) {
  return expect(0);
});

QUnit.test("loadDOM", function(assert) {
  return expect(0);
});

QUnit.test("getElmVal", function(assert) {
  var elm;
  expect(3);
  elm = $('<select><option value="a" selected="selected">a</option></option>');
  assert.strictEqual(getElmVal(elm), "a", elm);
  elm = $('<input type="text" value="a" />');
  assert.strictEqual(getElmVal(elm), "a", elm);
  elm = $('<textarea>a</textarea>');
  return assert.strictEqual(getElmVal(elm), "a", elm);
});

QUnit.module("Compiler");

QUnit.asyncTest("getCompilerSetting", function(assert) {
  var n, test, test1;
  n = 0;
  test = function(lang, o) {
    return test1(lang, o);
  };
  test1 = function(lang, o) {
    var compile, mode, _ref;
    n++;
    _ref = getCompilerSetting(lang), mode = _ref.mode, compile = _ref.compile;
    return compile(o.before, function(err, code) {
      assert.strictEqual(mode, o.mode, mode);
      assert.strictEqual(err, null, err);
      assert.strictEqual(code, o.after, code);
      if (--n === 0) {
        return QUnit.start();
      }
    });
  };
  test("CoffeeScript", {
    mode: "coffeescript",
    before: "do ->",
    after: "(function() {})();\n"
  });
  test("Jade", {
    mode: "jade",
    before: "p hello",
    after: "\n<p>hello</p>"
  });
  test("LESS", {
    mode: "css",
    before: "*{color:red;}",
    after: "* {\n  color: red;\n}\n"
  });
  test("Stylus", {
    mode: "css",
    before: "*{color:red;}",
    after: "* {\n  color: #f00;\n}\n"
  });
  return expect(n * 3);
});

QUnit.asyncTest("compileAll", function(assert) {
  var langs;
  langs = [
    {
      lang: "CoffeeScript",
      code: "}{"
    }, {
      lang: "Jade",
      code: "-||"
    }, {
      lang: "LESS",
      code: "}{"
    }, {
      lang: "Stylus",
      code: "-----------*"
    }
  ];
  expect(langs.length);
  return compileAll(langs, function(results) {
    results.forEach(function(_arg, i) {
      var code, err;
      err = _arg.err, code = _arg.code;
      return assert.ok(JSON.stringify(err).length > 10, langs[i].lang + ": " + JSON.stringify(err) + " : " + code);
    });
    return QUnit.start();
  });
});

QUnit.asyncTest("getIncludeStyleURLs", function(assert) {
  expect(1);
  return getIncludeStyleURLs({}, function(urls) {
    assert.strictEqual(urls.length, 0, JSON.stringify(urls));
    return QUnit.start();
  });
});

QUnit.asyncTest("getIncludeScriptURLs", function(assert) {
  expect(2);
  return getIncludeScriptURLs({
    enableJQuery: true
  }, function(urls) {
    assert.deepEqual(urls, [makeDomain(location) + "/" + "thirdparty/jquery/jquery.min.js"], JSON.stringify(urls));
    return getIncludeScriptURLs({
      enableUnderscore: true,
      enableCache: true,
      enableBlobCache: true
    }, function(urls) {
      return URLToText(urls[0], function(_text) {
        return URLToText(makeDomain(location) + "/" + "thirdparty/underscore.js/underscore-min.js", function(text) {
          assert.strictEqual(_text, text, _text);
          return QUnit.start();
        });
      });
    });
  });
});

QUnit.test("buildScripts", function(assert) {
  var tags;
  expect(1);
  tags = buildScripts(["hoge.js", "huga.js"]);
  return assert.strictEqual(tags, "<script src='hoge.js'></script>\n<script src='huga.js'></script>\n", tags);
});

QUnit.test("buildStyles", function(assert) {
  var tags;
  expect(1);
  tags = buildStyles(["hoge.css", "huga.css"]);
  return assert.strictEqual(tags, "<link rel='stylesheet' href='hoge.css' />\n<link rel='stylesheet' href='huga.css' />\n", tags);
});

QUnit.test("buildHTML", function(assert) {
  var srcdoc;
  expect(1);
  srcdoc = buildHTML("", {
    code: ""
  }, {
    code: ""
  }, {
    code: ""
  });
  return assert.ok(srcdoc, srcdoc);
});

QUnit.test("buildErr", function(assert) {
  var a, srcdoc;
  expect(1);
  a = {
    lang: "",
    code: ""
  };
  srcdoc = buildErr(a, a, a);
  return assert.ok(srcdoc, srcdoc);
});

QUnit.asyncTest("includeFirebugLite", function(assert) {
  var a;
  expect(1);
  a = {
    lang: "",
    code: ""
  };
  return includeFirebugLite("", a, a, a, {}, function() {
    assert.ok(true, JSON.stringify(arguments));
    return QUnit.start();
  });
});

QUnit.asyncTest("build", function(assert) {
  var code, lang, opt;
  expect(1);
  lang = {
    altjs: "JavaScript",
    althtml: "HTML",
    altcss: "CSS"
  };
  code = {
    script: "",
    markup: "",
    style: ""
  };
  opt = {};
  return build(lang, code, opt, function(srcdoc) {
    assert.strictEqual(srcdoc, buildHTML("", {
      code: ""
    }, {
      code: ""
    }, {
      code: ""
    }), srcdoc);
    return QUnit.start();
  });
});

QUnit.module("Complex");

QUnit.asyncTest("zipURI, URIQuery makeURL, shortenURL", function(assert) {
  var dic;
  expect(1);
  dic = {
    a: "a",
    b: "𠮟",
    c: "🐲"
  };
  return shortenURL(makeURL(location) + "#" + encodeURIQuery({
    zip: zipDataURI(dic)
  }), function(url) {
    return expandURL(url, function(_url) {
      var _dic;
      _dic = unzipDataURI(decodeURIQuery(_url.split("#")[1]).zip);
      assert.deepEqual(_dic, dic, JSON.stringify(_dic));
      return QUnit.start();
    });
  });
});

QUnit.module("iframe");

encodeDataURI("try{\n  window.testResult = window.testResult || {};\n  window.testResult.dataURI = location.href;\n  document.write(\"<p>dataURI</p>\");\n}catch(err){\n  document.write(JSON.stringify(err))\n}", "text/javascript", function(dataURI) {
  var createSrcdoc, style;
  createSrcdoc = function(context) {
    var objectURI, srcdoc;
    objectURI = createBlobURL("try{\n  window.testResult = window.testResult || {};\n  window.testResult.objectURL = location.href;\n  document.write(\"<p>objectURL</p>\");\n}catch(err){\n  document.write(JSON.stringify(err))\n}", "text/javascript");
    return srcdoc = "<h2>" + context + "</h2>\n<script type=\"text/javascript\" src=\"https://getfirebug.com/firebug-lite.js\">\n{\n  overrideConsole:true,\n  showIconWhenHidden:true,\n  startOpened:true,\n  enableTrace:true\n}\n</script>\n<script src=\"" + dataURI + "\"></script>\n<script src=\"" + objectURI + "\"></script>\n<script>\n  try{\n    window.testResult = window.testResult || {};\n    window.testResult.inline = location.href;\n    window.testResult.context = \"" + context + "\";\n    document.write(\"<p>inline</p>\");\n    document.write(\"<p><a target='_blank' href='\"+location.href+\"'>\"+location.href+\"</a></p>\");\n    target = (parent.postMessage ? parent : (parent.document.postMessage ? parent.document : undefined));\n    target.postMessage(JSON.stringify(window.testResult), \"*\");\n  }catch(err){\n    document.write(JSON.stringify(err))\n  }\n</script>";
  };
  style = {
    height: "400px",
    width: "400px"
  };
  QUnit.asyncTest("check objectURL iframe behavior", function(assert) {
    var iframe;
    iframe = $("<iframe />").css(style).attr({
      "src": createBlobURL(createSrcdoc("objectURL"), "text/html")
    });
    $("<div>").append(iframe).appendTo("body");
    expect(3);
    return window.onmessage = function(ev) {
      var testResult;
      testResult = JSON.parse(ev.data);
      console.dir(ev);
      assert.ok(testResult.dataURI, ev.data);
      assert.ok(testResult.objectURL, ev.data);
      assert.ok(testResult.inline, ev.data);
      return QUnit.start();
    };
  });
  QUnit.asyncTest("check srcdoc iframe behavior", function(assert) {
    var iframe;
    iframe = $("<iframe />").css(style).attr({
      "srcdoc": createSrcdoc("srcdoc")
    });
    $("<div>").append(iframe).appendTo("body");
    expect(3);
    return window.onmessage = function(ev) {
      var testResult;
      testResult = JSON.parse(ev.data);
      assert.ok(testResult.dataURI, ev.data);
      assert.ok(testResult.objectURL, ev.data);
      assert.ok(testResult.inline, ev.data);
      return QUnit.start();
    };
  });
  QUnit.asyncTest("check dataURI iframe behavior", function(assert) {
    return encodeDataURI(createSrcdoc("dataURI"), "text/html", function(base64) {
      var iframe;
      iframe = $("<iframe />").css(style).attr({
        "src": base64
      });
      $("<div>").append(iframe).appendTo("body");
      expect(3);
      return window.onmessage = function(ev) {
        var testResult;
        testResult = JSON.parse(ev.data);
        assert.ok(testResult.dataURI, "dataURI");
        assert.ok(testResult.objectURL, "objectURL");
        assert.ok(testResult.inline, "inline");
        return QUnit.start();
      };
    });
  });
  return QUnit.asyncTest("check message iframe behavior", function(assert) {
    var iframe;
    iframe = $("<iframe />").css(style).attr({
      "src": "iframe.html"
    });
    $("<div>").append(iframe).appendTo("body");
    iframe[0].onload = function() {
      return iframe[0].contentWindow.postMessage(createSrcdoc("message"), "*");
    };
    expect(3);
    return window.onmessage = function(ev) {
      var testResult;
      console.dir(testResult = JSON.parse(ev.data));
      assert.ok(testResult.dataURI, ev.data);
      assert.ok(testResult.objectURL, ev.data);
      assert.ok(testResult.inline, ev.data);
      return QUnit.start();
    };
  });
});
