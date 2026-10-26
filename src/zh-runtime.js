// Runtime translation for text produced by the interactive charts, search
// results and workbench after the static Chinese page has loaded.
(function () {
  var root = document.documentElement;
  var dictUrl = root.getAttribute('data-zh-dict');
  if (!dictUrl) return;
  var sharedUrl = '/zh-locales/shared.json';
  var dict = Object.create(null);
  var numeric = [];
  var CJK = /[\u3400-\u9fff]/;
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, PRE: 1, CODE: 1, TEXTAREA: 1 };
  var ATTRS = ['aria-label', 'title', 'placeholder', 'alt'];
  var queued = false;

  function normalize(value) {
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function addDictionary(source) {
    if (!source || typeof source !== 'object') return;
    var entries = source.translations || source;
    Object.keys(entries).forEach(function (key) {
      var value = entries[key];
      if (typeof value !== 'string' || !value) return;
      var clean = normalize(key);
      if (!clean) return;
      dict[clean] = value;
      if (clean.length < 240 && /\d/.test(clean)) {
        var parts = clean.split(/(\d[\d,.]*)/);
        if (parts.length > 1) {
          var expression = parts.map(function (part, index) {
            return index % 2 ? '(\\d[\\d,.]*)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          }).join('');
          // Template only when the translation keeps the same digits in the
          // same order. "$5k" → "5000 美元" rescales, and "Day 7 of 60" →
          // "60 天中的第 7 天" reorders; filling either with new numbers is wrong.
          var sourceDigits = (clean.match(/\d[\d,.]*/g) || []).join('|');
          var targetDigits = (value.match(/\d[\d,.]*/g) || []).join('|');
          if (sourceDigits === targetDigits) {
            numeric.push({ re: new RegExp('^' + expression + '$'), zh: value });
          }
        }
      }
    });
  }

  function lookup(value) {
    var clean = normalize(value);
    if (!clean || CJK.test(clean)) return null;
    if (dict[clean]) return dict[clean];
    for (var index = 0; index < numeric.length; index += 1) {
      var rule = numeric[index];
      var match = clean.match(rule.re);
      if (!match) continue;
      var cursor = 0;
      return rule.zh.replace(/\d[\d,.]*/g, function () {
        cursor += 1;
        return match[cursor] || '';
      });
    }
    return null;
  }

  function translateText(node) {
    if (!node || node.nodeType !== 3) return;
    var parent = node.parentElement;
    if (!parent || SKIP[parent.tagName] || parent.closest('[data-tl-ignore]')) return;
    var raw = node.nodeValue;
    var zh = lookup(raw);
    if (!zh) return;
    var leading = (raw.match(/^\s*/) || [''])[0];
    var trailing = (raw.match(/\s*$/) || [''])[0];
    node.nodeValue = leading + zh + trailing;
  }

  function translateAttributes(element) {
    if (!element || element.nodeType !== 1) return;
    if (SKIP[element.tagName] || element.closest('[data-tl-ignore]')) return;
    for (var index = 0; index < ATTRS.length; index += 1) {
      var name = ATTRS[index];
      var current = element.getAttribute(name);
      if (!current) continue;
      var zh = lookup(current);
      if (zh && zh !== current) element.setAttribute(name, zh);
    }
  }

  function translateTree(node) {
    if (!node) return;
    if (node.nodeType === 3) { translateText(node); return; }
    if (node.nodeType !== 1) return;
    translateAttributes(node);
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (item) {
        if (item.nodeType === 1 && (SKIP[item.tagName] || item.closest('[data-tl-ignore]'))) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var current = walker.nextNode();
    while (current) {
      if (current.nodeType === 3) translateText(current);
      else translateAttributes(current);
      current = walker.nextNode();
    }
  }

  function flush() {
    queued = false;
    translateTree(document.body);
    translateText(document.title ? document.title.firstChild : null);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(flush);
  }

  fetch(sharedUrl)
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (shared) {
      addDictionary(shared);
      return fetch(dictUrl);
    })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (page) {
      addDictionary(page);
      flush();
      new MutationObserver(function (records) {
        for (var index = 0; index < records.length; index += 1) {
          var record = records[index];
          if (record.type === 'characterData') translateText(record.target);
          else if (record.type === 'attributes') translateAttributes(record.target);
          else for (var child = 0; child < record.addedNodes.length; child += 1) translateTree(record.addedNodes[child]);
        }
      }).observe(document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRS
      });
      document.documentElement.classList.add('zh-ready');
    })
    .catch(function () { /* static Chinese text remains available */ });
})();
