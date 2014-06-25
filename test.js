QUnit.module("URL");

QUnit.asyncTest("createBlobURL", function(assert) {
  var n, test;
  n = 0;
  test = function(val, expected) {
    var url;
    n++;
    url = createBlobURL(val, "text/plain");
    return $.ajax({
      url: url,
      error: function(err) {
        throw err;
      },
      success: function(res) {
        assert.strictEqual(res, expected, res);
        if (--n === 0) {
          return QUnit.start();
        }
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
      console.log(arrayBuffer);
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
  test("TypeScript", {
    mode: "javascript",
    before: "(function(){}());",
    after: "(function () {\r\n}());\r\n"
  });
  test("LispyScript", {
    mode: "scheme",
    before: "((function ()))",
    after: "// Generated by LispyScript v0.3.6\n(function() {\n})();\n"
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
  var dic, tests;
  tests = [
    {
      lang: "CoffeeScript",
      code: "}{"
    }, {
      lang: "LESS",
      code: "}{"
    }, {
      lang: "Stylus",
      code: "}{"
    }
  ];
  dic = tests.reduce((function(dic, _arg) {
    var code, lang;
    lang = _arg.lang, code = _arg.code;
    dic[lang] = code;
    return dic;
  }), {});
  expect(tests.length);
  return compileAll(dic, function(codes) {
    codes.forEach(function(_arg, i) {
      var code, err;
      err = _arg[0], code = _arg[1];
      return assert.ok(JSON.stringify(err).length > 10, tests[i].lang + ": " + JSON.stringify(err) + " : " + code);
    });
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
