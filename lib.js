var URLToArrayBuffer, URLToText, build, buildErr, buildHTML, buildScripts, buildStyles, compileAll, createBlobURL, createProxyURLs, decodeDataURI, decodeURIQuery, dir, encodeDataURI, encodeURIQuery, expandURL, getCompilerSetting, getElmVal, getIncludeScriptURLs, getIncludeStyleURLs, includeFirebugLite, log, makeURL, shortenURL, unzipDataURI, zipDataURI;

window.URL = window.URL || window.webkitURL || window.mozURL;

dir = function(a) {
  console.dir.apply(console, arguments);
  return a;
};

log = function(a) {
  console.log.apply(console, arguments);
  return a;
};

createBlobURL = function(data, mimetype) {
  return URL.createObjectURL(new Blob([data], {
    type: mimetype
  }));
};

URLToText = function(url, callback) {
  var xhr;
  xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'text';
  xhr.onerror = function(err) {
    throw new Error(JSON.strigify(err));
  };
  xhr.onload = function() {
    if (this.status === 200 || this.status === 0 && this.readyState === 4) {
      return callback(this.response);
    }
  };
  return xhr.send();
};

URLToArrayBuffer = function(url, callback) {
  var xhr;
  xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.onerror = function(err) {
    throw new Error(err);
  };
  xhr.onload = function() {
    if (this.status === 200 || this.status === 0 && this.readyState === 4) {
      return callback(this.response);
    }
  };
  return xhr.send();
};

createProxyURLs = function(urls, mimetype, callback) {
  var n, _urls;
  n = 0;
  _urls = [];
  return urls.forEach(function(url, i) {
    n++;
    return URLToArrayBuffer(url, function(arrayBuffer) {
      _urls[i] = createBlobURL(arrayBuffer, mimetype);
      if (--n === 0) {
        return callback(_urls);
      }
    });
  });
};

encodeDataURI = function(data, mimetype, callback) {
  var reader;
  reader = new FileReader();
  reader.readAsDataURL(new Blob([data], {
    type: mimetype
  }));
  reader.onloadend = function() {
    return callback(reader.result.replace(";base64,", ";charset=utf-8;base64,"));
  };
  return reader.onerror = function(err) {
    throw new Error(err);
  };
};

decodeDataURI = function(dataURI, callback) {
  var ab, byteString, i, ia, mimeString, reader, tmp, _i, _ref;
  tmp = dataURI.split(',');
  mimeString = tmp[0].split(':')[1].split(';')[0];
  byteString = atob(tmp[1]);
  ab = new ArrayBuffer(byteString.length);
  ia = new Uint8Array(ab);
  for (i = _i = 0, _ref = byteString.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
    ia[i] = byteString.charCodeAt(i);
  }
  reader = new FileReader();
  reader.readAsText(new Blob([ab], {
    type: mimeString
  }));
  return reader.onloadend = function() {
    return callback(reader.result);
  };
};

makeURL = function(location) {
  return location.protocol + '//' + location.hostname + (location.port ? ":" + location.port : "") + location.pathname;
};

encodeURIQuery = function(dic) {
  var key, val;
  return ((function() {
    var _results;
    _results = [];
    for (key in dic) {
      val = dic[key];
      _results.push(key + "=" + encodeURIComponent(val));
    }
    return _results;
  })()).join("&");
};

decodeURIQuery = function(query) {
  return query.split("&").map(function(a) {
    var b;
    b = a.split("=");
    return [b[0], b.slice(1).join("=")];
  }).reduce((function(a, b) {
    a[b[0]] = decodeURIComponent(b[1]);
    return a;
  }), {});
};

shortenURL = function(url, callback) {
  return $.ajax({
    url: 'https://www.googleapis.com/urlshortener/v1/url',
    type: 'POST',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify({
      longUrl: url
    }),
    dataType: 'json',
    success: function(res) {
      console.info(res);
      return callback(res.id);
    },
    error: function(err) {
      return console.error(err, err.stack);
    }
  });
};

expandURL = function(url, callback) {
  return $.ajax({
    url: "https://www.googleapis.com/urlshortener/v1/url?shortUrl=" + url,
    success: function(res) {
      console.info(res);
      return callback(res.longUrl);
    },
    error: function(err) {
      return console.error(err, err.stack);
    }
  });
};

zipDataURI = function(dic) {
  var key, val, zip;
  zip = new JSZip();
  for (key in dic) {
    val = dic[key];
    zip.file(key, val);
  }
  return zip.generate({
    compression: "DEFLATE"
  });
};

unzipDataURI = function(base64) {
  var files, hash, key, val, zip;
  zip = new JSZip();
  files = zip.load(base64, {
    base64: true
  }).files;
  hash = {};
  for (key in files) {
    val = files[key];
    hash[key] = zip.file(key).asText();
  }
  return hash;
};

getElmVal = function(elm) {
  if (elm instanceof HTMLInputElement && $(elm).attr("type") === "checkbox") {
    return $(elm).is(':checked');
  } else {
    return $(elm).val();
  }
};

getCompilerSetting = function(lang) {
  var f;
  f = function(a, b) {
    return {
      mode: a,
      compile: b
    };
  };
  switch (lang) {
    case "JavaScript":
      return f("javascript", function(code, cb) {
        return setTimeout(function() {
          return cb(null, code);
        });
      });
    case "CoffeeScript":
      return f("coffeescript", function(code, cb) {
        var _code;
        _code = CoffeeScript.compile(code, {
          bare: true
        });
        return setTimeout(function() {
          return cb(null, _code);
        });
      });
    case "HTML":
      return f("xml", function(code, cb) {
        return setTimeout(function() {
          return cb(null, code);
        });
      });
    case "Jade":
      return f("jade", function(code, cb) {
        var _code;
        _code = jade.compile(code, {
          pretty: true
        })({});
        return setTimeout(function() {
          return cb(null, _code);
        });
      });
    case "CSS":
      return f("css", function(code, cb) {
        return setTimeout(function() {
          return cb(null, code);
        });
      });
    case "LESS":
      return f("css", function(code, cb) {
        return (new less.Parser({})).parse(code, function(err, tree) {
          if (err) {
            return setTimeout(function() {
              return cb(err, code);
            });
          } else {
            return setTimeout(function() {
              return cb(err, tree.toCSS({}));
            });
          }
        });
      });
    case "Stylus":
      return f("css", function(code, cb) {
        return stylus.render(code, {}, function(err, code) {
          return setTimeout(function() {
            return cb(err, code);
          });
        });
      });
    default:
      throw new TypeError("unknown compiler");
  }
};

compileAll = function(langs, callback) {
  var n, next, results;
  n = 0;
  results = [];
  next = function(result, i) {
    results[i] = result;
    if (--n === 0) {
      return callback(results);
    }
  };
  return langs.forEach(function(_arg, i) {
    var code, compilerFn, err, lang;
    lang = _arg.lang, code = _arg.code;
    n++;
    compilerFn = getCompilerSetting(lang).compile;
    try {
      return compilerFn(code, function(err, code) {
        return next({
          lang: lang,
          err: err,
          code: code
        }, i);
      });
    } catch (_error) {
      err = _error;
      return setTimeout(function() {
        return next({
          lang: lang,
          err: err,
          code: code
        }, i);
      });
    }
  });
};

getIncludeScriptURLs = function(opt, callback) {
  var urls;
  urls = [];
  if (opt.enableZepto) {
    urls.push((opt.enableCache ? makeURL(location) + "thirdparty/zepto/zepto.min.js" : "https://cdnjs.cloudflare.com/ajax/libs/zepto/1.1.3/zepto.min.js"));
  }
  if (opt.enableJQuery) {
    urls.push((opt.enableCache ? makeURL(location) + "thirdparty/jquery/jquery.min.js" : "https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js"));
  }
  if (opt.enableUnderscore) {
    urls.push((opt.enableCache ? makeURL(location) + "thirdparty/underscore.js/underscore-min.js" : "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min.js"));
  }
  if (opt.enableBackbone) {
    urls.push((opt.enableCache ? makeURL(location) + "thirdparty/backbone.js/backbone-min.js" : "https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min.js"));
  }
  if (opt.enableES6shim) {
    urls.push((opt.enableCache ? makeURL(location) + "thirdparty/es6-shim/es6-shim.min.js" : "https://cdnjs.cloudflare.com/ajax/libs/es6-shim/0.11.0/es6-shim.min.js"));
  }
  if (opt.enableMathjs) {
    urls.push((opt.enableCache ? makeURL(location) + "thirdparty/mathjs/math.min.js" : "https://cdnjs.cloudflare.com/ajax/libs/mathjs/0.23.0/math.min.js"));
  }
  if (opt.enableProcessing) {
    urls.push((opt.enableCache ? makeURL(location) + "thirdparty/processing.js/processing.min.js" : "https://cdnjs.cloudflare.com/ajax/libs/processing.js/1.4.8/processing.min.js"));
  }
  if (opt.enableCache && opt.enableBlobCache) {
    return createProxyURLs(urls, "text/javascript", function(_urls) {
      return callback(_urls);
    });
  } else {
    return setTimeout(function() {
      return callback(urls);
    });
  }
};

getIncludeStyleURLs = function(opt, callback) {
  var urls;
  urls = [];
  if (opt.enableCache && opt.enableBlobCache) {
    return createProxyURLs(urls, "text/javascript", function(_urls) {
      return callback(_urls);
    });
  } else {
    return setTimeout(function() {
      return callback(urls);
    });
  }
};

buildScripts = function(urls) {
  return urls.reduce((function(str, url) {
    return str + ("<script src='" + url + "'><" + "/" + "script>\n");
  }), "");
};

buildStyles = function(urls) {
  return urls.reduce((function(str, url) {
    return str + ("<link rel='stylesheet' href='" + url + "' />\n");
  }), "");
};

buildHTML = function(head, jsResult, htmlResult, cssResult) {
  return "<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\" />\n" + (head || "") + "\n<style>\n" + (cssResult.code || "") + "\n</style>\n</head>\n<body>\n" + (htmlResult.code || "") + "\n<script>\n" + (jsResult.code || "") + "\n</script>\n</body>\n</html>";
};

buildErr = function(jsResult, htmlResult, cssResult) {
  return "<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\" />\n<style>\n*{font-family: 'Source Code Pro','Menlo','Monaco','Andale Mono','lucida console','Courier New','monospace';}\n</style>\n</head>\n<body>\n<pre>\n" + jsResult.lang + "\n" + jsResult.err + "\n\n" + htmlResult.lang + "\n" + htmlResult.err + "\n\n" + cssResult.lang + "\n" + cssResult.err + "\n</pre>\n</body>\n</html>";
};

includeFirebugLite = function(head, jsResult, htmlResult, cssResult, opt, callback) {
  var caching;
  caching = function(next) {
    if (opt.enableCache && opt.enableBlobCache) {
      return URLToText(makeURL(location) + "thirdparty/firebug/firebug-lite.js", function(text) {
        var _text;
        _text = text.replace("var m=path&&path.match(/([^\\/]+)\\/$/)||null;", "var m=['build/', 'build']; path='" + (makeURL(location)) + "thirdparty/firebug/build/'");
        return next(createBlobURL(_text, "text/javascript"));
      });
    } else if (opt.enableCache) {
      return setTimeout(function() {
        return next(makeURL(location) + "thirdparty/firebug/firebug-lite.js");
      });
    } else {
      return setTimeout(function() {
        return next("https://cdnjs.cloudflare.com/ajax/libs/firebug-lite/1.4.0/firebug-lite.min.js");
      });
    }
  };
  return caching(function(firebugURL) {
    jsResult.code = "try{\n  " + jsResult.code + "\n}catch(err){\n  console.error(err, err.stack);\n}";
    head = "<script id='FirebugLite' FirebugLite='4' src='" + firebugURL + "'>\n  {\n    overrideConsole:true,\n    showIconWhenHidden:true,\n    startOpened:true,\n    enableTrace:true\n  }\n<" + "/" + "script>\n<style>\n  body{\n    margin-bottom: 400px;\n  }\n</style>\n" + head;
    return callback(head, jsResult, htmlResult, cssResult);
  });
};

build = function(_arg, _arg1, opt, callback) {
  var altcss, althtml, altjs, markup, script, style;
  altjs = _arg.altjs, althtml = _arg.althtml, altcss = _arg.altcss;
  script = _arg1.script, markup = _arg1.markup, style = _arg1.style;
  return compileAll([
    {
      lang: altjs,
      code: script
    }, {
      lang: althtml,
      code: markup
    }, {
      lang: altcss,
      code: style
    }
  ], function(_arg2) {
    var cssResult, htmlResult, jsResult, srcdoc;
    jsResult = _arg2[0], htmlResult = _arg2[1], cssResult = _arg2[2];
    if ((jsResult.err != null) || (htmlResult.err != null) || (cssResult.err != null)) {
      srcdoc = buildErr(jsResult, htmlResult, cssResult);
      return setTimeout(function() {
        return callback(srcdoc);
      });
    } else {
      return getIncludeScriptURLs(opt, function(scriptURLs) {
        return getIncludeStyleURLs(opt, function(styleURLs) {
          var head;
          head = buildStyles(styleURLs) + buildScripts(scriptURLs);
          if (!opt.enableFirebugLite) {
            srcdoc = buildHTML(head, jsResult, htmlResult, cssResult);
            return setTimeout(function() {
              return callback(srcdoc);
            });
          } else {
            return includeFirebugLite(head, jsResult, htmlResult, cssResult, opt, function(_head, _jsResult, _htmlResult, _cssResult) {
              srcdoc = buildHTML(_head, _jsResult, _htmlResult, _cssResult);
              return setTimeout(function() {
                return callback(srcdoc);
              });
            });
          }
        });
      });
    }
  });
};
