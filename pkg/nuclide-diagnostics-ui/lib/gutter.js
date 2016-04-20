Object.defineProperty(exports, '__esModule', {
  value: true
});

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

exports.applyUpdateToEditor = applyUpdateToEditor;

var _reactForAtom = require('react-for-atom');

var _nuclideAtomHelpers = require('../../nuclide-atom-helpers');

var _nuclideAnalytics = require('../../nuclide-analytics');

var _DiagnosticsPopup = require('./DiagnosticsPopup');

var GUTTER_ID = 'nuclide-diagnostics-gutter';

// Needs to be the same as glyph-height in gutter.atom-text-editor.less.
var GLYPH_HEIGHT = 15; // px

var POPUP_DISPOSE_TIMEOUT = 100;

// TODO(mbolin): Make it so that when mousing over an element with this CSS class (or specifically,
// the child element with the "region" CSS class), we also do a showPopupFor(). This seems to be
// tricky given how the DOM of a TextEditor works today. There are div.tile elements, each of which
// has its own div.highlights element and many div.line elements. The div.highlights element has 0
// or more children, each child being a div.highlight with a child div.region. The div.region
// element is defined to be {position: absolute; pointer-events: none; z-index: -1}. The absolute
// positioning and negative z-index make it so it isn't eligible for mouseover events, so we
// might have to listen for mouseover events on TextEditor and then use its own APIs, such as
// decorationsForScreenRowRange(), to see if there is a hit target instead. Since this will be
// happening onmousemove, we also have to be careful to make sure this is not expensive.
var HIGHLIGHT_CSS = 'nuclide-diagnostics-gutter-ui-highlight';

var ERROR_HIGHLIGHT_CSS = 'nuclide-diagnostics-gutter-ui-highlight-error';
var WARNING_HIGHLIGHT_CSS = 'nuclide-diagnostics-gutter-ui-highlight-warning';

var ERROR_GUTTER_CSS = 'nuclide-diagnostics-gutter-ui-gutter-error';
var WARNING_GUTTER_CSS = 'nuclide-diagnostics-gutter-ui-gutter-warning';

var editorToMarkers = new WeakMap();
var itemToEditor = new WeakMap();

function applyUpdateToEditor(editor, update, fixer) {
  var gutter = editor.gutterWithName(GUTTER_ID);
  if (!gutter) {
    // TODO(jessicalin): Determine an appropriate priority so that the gutter:
    // (1) Shows up to the right of the line numbers.
    // (2) Shows the items that are added to it right away.
    // Using a value of 10 fixes (1), but breaks (2). This seems like it is likely a bug in Atom.

    // By default, a gutter will be destroyed when its editor is destroyed,
    // so there is no need to register a callback via onDidDestroy().
    gutter = editor.addGutter({
      name: GUTTER_ID,
      visible: false
    });
  }

  var marker = undefined;
  var markers = editorToMarkers.get(editor);

  // TODO: Consider a more efficient strategy that does not blindly destroy all of the
  // existing markers.
  if (markers) {
    for (marker of markers) {
      marker.destroy();
    }
    markers.clear();
  } else {
    markers = new Set();
  }

  var rowToMessage = new Map();
  function addMessageForRow(message, row) {
    var messages = rowToMessage.get(row);
    if (!messages) {
      messages = [];
      rowToMessage.set(row, messages);
    }
    messages.push(message);
  }

  for (var _message of update.messages) {
    var range = _message.range;
    var highlightMarker = undefined;
    if (range) {
      addMessageForRow(_message, range.start.row);
      highlightMarker = editor.markBufferRange(range);
    } else {
      addMessageForRow(_message, 0);
    }

    var highlightCssClass = undefined;
    if (_message.type === 'Error') {
      highlightCssClass = HIGHLIGHT_CSS + ' ' + ERROR_HIGHLIGHT_CSS;
    } else {
      highlightCssClass = HIGHLIGHT_CSS + ' ' + WARNING_HIGHLIGHT_CSS;
    }

    // This marker underlines text.
    if (highlightMarker) {
      editor.decorateMarker(highlightMarker, {
        type: 'highlight',
        'class': highlightCssClass
      });
      markers.add(highlightMarker);
    }
  }

  // Find all of the gutter markers for the same row and combine them into one marker/popup.
  for (var _ref3 of rowToMessage.entries()) {
    var _ref2 = _slicedToArray(_ref3, 2);

    var row = _ref2[0];
    var messages = _ref2[1];

    // If at least one of the diagnostics is an error rather than the warning,
    // display the glyph in the gutter to represent an error rather than a warning.
    var gutterMarkerCssClass = messages.some(function (msg) {
      return msg.type === 'Error';
    }) ? ERROR_GUTTER_CSS : WARNING_GUTTER_CSS;

    // This marker adds some UI to the gutter.

    var _createGutterItem = createGutterItem(messages, gutterMarkerCssClass, fixer);

    var item = _createGutterItem.item;
    var dispose = _createGutterItem.dispose;

    itemToEditor.set(item, editor);
    var gutterMarker = editor.markBufferPosition([row, 0]);
    gutter.decorateMarker(gutterMarker, { item: item });
    gutterMarker.onDidDestroy(dispose);
    markers.add(gutterMarker);
  }

  editorToMarkers.set(editor, markers);

  // Once the gutter is shown for the first time, it is displayed for the lifetime of the
  // TextEditor.
  if (update.messages.length > 0) {
    gutter.show();
  }
}

function createGutterItem(messages, gutterMarkerCssClass, fixer) {
  var item = window.document.createElement('span');
  item.innerText = '▶'; // Unicode character for a right-pointing triangle.
  item.className = gutterMarkerCssClass;
  var popupElement = null;
  var paneItemSubscription = null;
  var disposeTimeout = null;
  var clearDisposeTimeout = function clearDisposeTimeout() {
    if (disposeTimeout) {
      clearTimeout(disposeTimeout);
    }
  };
  var dispose = function dispose() {
    if (popupElement) {
      _reactForAtom.ReactDOM.unmountComponentAtNode(popupElement);
      popupElement.parentNode.removeChild(popupElement);
      popupElement = null;
    }
    if (paneItemSubscription) {
      paneItemSubscription.dispose();
      paneItemSubscription = null;
    }
    clearDisposeTimeout();
  };
  var goToLocation = function goToLocation(path, line) {
    // Before we jump to the location, we want to close the popup.
    dispose();
    var column = 0;
    (0, _nuclideAtomHelpers.goToLocation)(path, line, column);
  };
  item.addEventListener('mouseenter', function (event) {
    // If there was somehow another popup for this gutter item, dispose it. This can happen if the
    // user manages to scroll and escape disposal.
    dispose();
    popupElement = showPopupFor(messages, item, goToLocation, fixer);
    popupElement.addEventListener('mouseleave', dispose);
    popupElement.addEventListener('mouseenter', clearDisposeTimeout);
    // This makes sure that the popup disappears when you ctrl+tab to switch tabs.
    paneItemSubscription = atom.workspace.onDidChangeActivePaneItem(dispose);
  });
  item.addEventListener('mouseleave', function (event) {
    // When the popup is shown, we want to dispose it if the user manages to move the cursor off of
    // the gutter glyph without moving it onto the popup. Even though the popup appears above (as in
    // Z-index above) the gutter glyph, if you move the cursor such that it is only above the glyph
    // for one frame you can cause the popup to appear without the mouse ever entering it.
    disposeTimeout = setTimeout(dispose, POPUP_DISPOSE_TIMEOUT);
  });
  return { item: item, dispose: dispose };
}

/**
 * Shows a popup for the diagnostic just below the specified item.
 */
function showPopupFor(messages, item, goToLocation, fixer) {
  // The popup will be an absolutely positioned child element of <atom-workspace> so that it appears
  // on top of everything.
  var workspaceElement = atom.views.getView(atom.workspace);
  var hostElement = window.document.createElement('div');
  workspaceElement.parentNode.appendChild(hostElement);

  // Move it down vertically so it does not end up under the mouse pointer.

  var _item$getBoundingClientRect = item.getBoundingClientRect();

  var top = _item$getBoundingClientRect.top;
  var left = _item$getBoundingClientRect.left;

  var trackedFixer = function trackedFixer() {
    fixer.apply(undefined, arguments);
    (0, _nuclideAnalytics.track)('diagnostics-gutter-autofix');
  };
  var trackedGoToLocation = function trackedGoToLocation() {
    goToLocation.apply(undefined, arguments);
    (0, _nuclideAnalytics.track)('diagnostics-gutter-goto-location');
  };

  _reactForAtom.ReactDOM.render(_reactForAtom.React.createElement(_DiagnosticsPopup.DiagnosticsPopup, {
    left: left,
    top: top,
    messages: messages,
    fixer: trackedFixer,
    goToLocation: trackedGoToLocation
  }), hostElement);
  // Check to see whether the popup is within the bounds of the TextEditor. If not, display it above
  // the glyph rather than below it.
  var editor = itemToEditor.get(item);
  var editorElement = atom.views.getView(editor);

  var _editorElement$getBoundingClientRect = editorElement.getBoundingClientRect();

  var editorTop = _editorElement$getBoundingClientRect.top;
  var editorHeight = _editorElement$getBoundingClientRect.height;

  var _item$getBoundingClientRect2 = item.getBoundingClientRect();

  var itemTop = _item$getBoundingClientRect2.top;
  var itemHeight = _item$getBoundingClientRect2.height;

  var popupHeight = hostElement.firstElementChild.clientHeight;
  if (itemTop + itemHeight + popupHeight > editorTop + editorHeight) {
    var popupElement = hostElement.firstElementChild;
    // Shift the popup back down by GLYPH_HEIGHT, so that the bottom padding overlaps with the
    // glyph. An additional 4 px is needed to make it look the same way it does when it shows up
    // below. I don't know why.
    popupElement.style.top = String(itemTop - popupHeight + GLYPH_HEIGHT + 4) + 'px';
  }

  try {
    return hostElement;
  } finally {
    messages.forEach(function (message) {
      (0, _nuclideAnalytics.track)('diagnostics-gutter-show-popup', {
        'diagnostics-provider': message.providerName,
        'diagnostics-message': message.text || message.html || ''
      });
    });
  }
}
//# sourceMappingURL=data:application/json;base64,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QixTQUFTO0FBQ1IsWUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFBLE9BQU8sRUFBSTtBQUMxQixtQ0FBTSwrQkFBK0IsRUFBRTtBQUNyQyw4QkFBc0IsRUFBRSxPQUFPLENBQUMsWUFBWTtBQUM1Qyw2QkFBcUIsRUFBRSxPQUFPLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksRUFBRTtPQUMxRCxDQUFDLENBQUM7S0FDSixDQUFDLENBQUM7R0FDSjtDQUNGIiwiZmlsZSI6Imd1dHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtcbiAgRmlsZU1lc3NhZ2VVcGRhdGUsXG4gIEZpbGVEaWFnbm9zdGljTWVzc2FnZSxcbn0gZnJvbSAnLi4vLi4vbnVjbGlkZS1kaWFnbm9zdGljcy1iYXNlJztcbmltcG9ydCB0eXBlIHtOdWNsaWRlVXJpfSBmcm9tICcuLi8uLi9udWNsaWRlLXJlbW90ZS11cmknO1xuXG5pbXBvcnQge1xuICBSZWFjdCxcbiAgUmVhY3RET00sXG59IGZyb20gJ3JlYWN0LWZvci1hdG9tJztcbmltcG9ydCB7Z29Ub0xvY2F0aW9uIGFzIGF0b21Hb1RvTG9jYXRpb259IGZyb20gJy4uLy4uL251Y2xpZGUtYXRvbS1oZWxwZXJzJztcbmltcG9ydCB7dHJhY2t9IGZyb20gJy4uLy4uL251Y2xpZGUtYW5hbHl0aWNzJztcbmltcG9ydCB7RGlhZ25vc3RpY3NQb3B1cH0gZnJvbSAnLi9EaWFnbm9zdGljc1BvcHVwJztcblxuY29uc3QgR1VUVEVSX0lEID0gJ251Y2xpZGUtZGlhZ25vc3RpY3MtZ3V0dGVyJztcblxuLy8gTmVlZHMgdG8gYmUgdGhlIHNhbWUgYXMgZ2x5cGgtaGVpZ2h0IGluIGd1dHRlci5hdG9tLXRleHQtZWRpdG9yLmxlc3MuXG5jb25zdCBHTFlQSF9IRUlHSFQgPSAxNTsgLy8gcHhcblxuY29uc3QgUE9QVVBfRElTUE9TRV9USU1FT1VUID0gMTAwO1xuXG4vLyBUT0RPKG1ib2xpbik6IE1ha2UgaXQgc28gdGhhdCB3aGVuIG1vdXNpbmcgb3ZlciBhbiBlbGVtZW50IHdpdGggdGhpcyBDU1MgY2xhc3MgKG9yIHNwZWNpZmljYWxseSxcbi8vIHRoZSBjaGlsZCBlbGVtZW50IHdpdGggdGhlIFwicmVnaW9uXCIgQ1NTIGNsYXNzKSwgd2UgYWxzbyBkbyBhIHNob3dQb3B1cEZvcigpLiBUaGlzIHNlZW1zIHRvIGJlXG4vLyB0cmlja3kgZ2l2ZW4gaG93IHRoZSBET00gb2YgYSBUZXh0RWRpdG9yIHdvcmtzIHRvZGF5LiBUaGVyZSBhcmUgZGl2LnRpbGUgZWxlbWVudHMsIGVhY2ggb2Ygd2hpY2hcbi8vIGhhcyBpdHMgb3duIGRpdi5oaWdobGlnaHRzIGVsZW1lbnQgYW5kIG1hbnkgZGl2LmxpbmUgZWxlbWVudHMuIFRoZSBkaXYuaGlnaGxpZ2h0cyBlbGVtZW50IGhhcyAwXG4vLyBvciBtb3JlIGNoaWxkcmVuLCBlYWNoIGNoaWxkIGJlaW5nIGEgZGl2LmhpZ2hsaWdodCB3aXRoIGEgY2hpbGQgZGl2LnJlZ2lvbi4gVGhlIGRpdi5yZWdpb25cbi8vIGVsZW1lbnQgaXMgZGVmaW5lZCB0byBiZSB7cG9zaXRpb246IGFic29sdXRlOyBwb2ludGVyLWV2ZW50czogbm9uZTsgei1pbmRleDogLTF9LiBUaGUgYWJzb2x1dGVcbi8vIHBvc2l0aW9uaW5nIGFuZCBuZWdhdGl2ZSB6LWluZGV4IG1ha2UgaXQgc28gaXQgaXNuJ3QgZWxpZ2libGUgZm9yIG1vdXNlb3ZlciBldmVudHMsIHNvIHdlXG4vLyBtaWdodCBoYXZlIHRvIGxpc3RlbiBmb3IgbW91c2VvdmVyIGV2ZW50cyBvbiBUZXh0RWRpdG9yIGFuZCB0aGVuIHVzZSBpdHMgb3duIEFQSXMsIHN1Y2ggYXNcbi8vIGRlY29yYXRpb25zRm9yU2NyZWVuUm93UmFuZ2UoKSwgdG8gc2VlIGlmIHRoZXJlIGlzIGEgaGl0IHRhcmdldCBpbnN0ZWFkLiBTaW5jZSB0aGlzIHdpbGwgYmVcbi8vIGhhcHBlbmluZyBvbm1vdXNlbW92ZSwgd2UgYWxzbyBoYXZlIHRvIGJlIGNhcmVmdWwgdG8gbWFrZSBzdXJlIHRoaXMgaXMgbm90IGV4cGVuc2l2ZS5cbmNvbnN0IEhJR0hMSUdIVF9DU1MgPSAnbnVjbGlkZS1kaWFnbm9zdGljcy1ndXR0ZXItdWktaGlnaGxpZ2h0JztcblxuY29uc3QgRVJST1JfSElHSExJR0hUX0NTUyA9ICdudWNsaWRlLWRpYWdub3N0aWNzLWd1dHRlci11aS1oaWdobGlnaHQtZXJyb3InO1xuY29uc3QgV0FSTklOR19ISUdITElHSFRfQ1NTID0gJ251Y2xpZGUtZGlhZ25vc3RpY3MtZ3V0dGVyLXVpLWhpZ2hsaWdodC13YXJuaW5nJztcblxuY29uc3QgRVJST1JfR1VUVEVSX0NTUyA9ICdudWNsaWRlLWRpYWdub3N0aWNzLWd1dHRlci11aS1ndXR0ZXItZXJyb3InO1xuY29uc3QgV0FSTklOR19HVVRURVJfQ1NTID0gJ251Y2xpZGUtZGlhZ25vc3RpY3MtZ3V0dGVyLXVpLWd1dHRlci13YXJuaW5nJztcblxuY29uc3QgZWRpdG9yVG9NYXJrZXJzOiBXZWFrTWFwPFRleHRFZGl0b3IsIFNldDxhdG9tJE1hcmtlcj4+ID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IGl0ZW1Ub0VkaXRvcjogV2Vha01hcDxIVE1MRWxlbWVudCwgVGV4dEVkaXRvcj4gPSBuZXcgV2Vha01hcCgpO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlVcGRhdGVUb0VkaXRvcihcbiAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICB1cGRhdGU6IEZpbGVNZXNzYWdlVXBkYXRlLFxuICBmaXhlcjogKG1lc3NhZ2U6IEZpbGVEaWFnbm9zdGljTWVzc2FnZSkgPT4gdm9pZCxcbik6IHZvaWQge1xuICBsZXQgZ3V0dGVyID0gZWRpdG9yLmd1dHRlcldpdGhOYW1lKEdVVFRFUl9JRCk7XG4gIGlmICghZ3V0dGVyKSB7XG4gICAgLy8gVE9ETyhqZXNzaWNhbGluKTogRGV0ZXJtaW5lIGFuIGFwcHJvcHJpYXRlIHByaW9yaXR5IHNvIHRoYXQgdGhlIGd1dHRlcjpcbiAgICAvLyAoMSkgU2hvd3MgdXAgdG8gdGhlIHJpZ2h0IG9mIHRoZSBsaW5lIG51bWJlcnMuXG4gICAgLy8gKDIpIFNob3dzIHRoZSBpdGVtcyB0aGF0IGFyZSBhZGRlZCB0byBpdCByaWdodCBhd2F5LlxuICAgIC8vIFVzaW5nIGEgdmFsdWUgb2YgMTAgZml4ZXMgKDEpLCBidXQgYnJlYWtzICgyKS4gVGhpcyBzZWVtcyBsaWtlIGl0IGlzIGxpa2VseSBhIGJ1ZyBpbiBBdG9tLlxuXG4gICAgLy8gQnkgZGVmYXVsdCwgYSBndXR0ZXIgd2lsbCBiZSBkZXN0cm95ZWQgd2hlbiBpdHMgZWRpdG9yIGlzIGRlc3Ryb3llZCxcbiAgICAvLyBzbyB0aGVyZSBpcyBubyBuZWVkIHRvIHJlZ2lzdGVyIGEgY2FsbGJhY2sgdmlhIG9uRGlkRGVzdHJveSgpLlxuICAgIGd1dHRlciA9IGVkaXRvci5hZGRHdXR0ZXIoe1xuICAgICAgbmFtZTogR1VUVEVSX0lELFxuICAgICAgdmlzaWJsZTogZmFsc2UsXG4gICAgfSk7XG4gIH1cblxuICBsZXQgbWFya2VyO1xuICBsZXQgbWFya2VycyA9IGVkaXRvclRvTWFya2Vycy5nZXQoZWRpdG9yKTtcblxuICAvLyBUT0RPOiBDb25zaWRlciBhIG1vcmUgZWZmaWNpZW50IHN0cmF0ZWd5IHRoYXQgZG9lcyBub3QgYmxpbmRseSBkZXN0cm95IGFsbCBvZiB0aGVcbiAgLy8gZXhpc3RpbmcgbWFya2Vycy5cbiAgaWYgKG1hcmtlcnMpIHtcbiAgICBmb3IgKG1hcmtlciBvZiBtYXJrZXJzKSB7XG4gICAgICBtYXJrZXIuZGVzdHJveSgpO1xuICAgIH1cbiAgICBtYXJrZXJzLmNsZWFyKCk7XG4gIH0gZWxzZSB7XG4gICAgbWFya2VycyA9IG5ldyBTZXQoKTtcbiAgfVxuXG4gIGNvbnN0IHJvd1RvTWVzc2FnZTogTWFwPG51bWJlciwgQXJyYXk8RmlsZURpYWdub3N0aWNNZXNzYWdlPj4gPSBuZXcgTWFwKCk7XG4gIGZ1bmN0aW9uIGFkZE1lc3NhZ2VGb3JSb3cobWVzc2FnZTogRmlsZURpYWdub3N0aWNNZXNzYWdlLCByb3c6IG51bWJlcikge1xuICAgIGxldCBtZXNzYWdlcyA9IHJvd1RvTWVzc2FnZS5nZXQocm93KTtcbiAgICBpZiAoIW1lc3NhZ2VzKSB7XG4gICAgICBtZXNzYWdlcyA9IFtdO1xuICAgICAgcm93VG9NZXNzYWdlLnNldChyb3csIG1lc3NhZ2VzKTtcbiAgICB9XG4gICAgbWVzc2FnZXMucHVzaChtZXNzYWdlKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgbWVzc2FnZSBvZiB1cGRhdGUubWVzc2FnZXMpIHtcbiAgICBjb25zdCByYW5nZSA9IG1lc3NhZ2UucmFuZ2U7XG4gICAgbGV0IGhpZ2hsaWdodE1hcmtlcjtcbiAgICBpZiAocmFuZ2UpIHtcbiAgICAgIGFkZE1lc3NhZ2VGb3JSb3cobWVzc2FnZSwgcmFuZ2Uuc3RhcnQucm93KTtcbiAgICAgIGhpZ2hsaWdodE1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZGRNZXNzYWdlRm9yUm93KG1lc3NhZ2UsIDApO1xuICAgIH1cblxuICAgIGxldCBoaWdobGlnaHRDc3NDbGFzcztcbiAgICBpZiAobWVzc2FnZS50eXBlID09PSAnRXJyb3InKSB7XG4gICAgICBoaWdobGlnaHRDc3NDbGFzcyA9IEhJR0hMSUdIVF9DU1MgKyAnICcgKyBFUlJPUl9ISUdITElHSFRfQ1NTO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaWdobGlnaHRDc3NDbGFzcyA9IEhJR0hMSUdIVF9DU1MgKyAnICcgKyBXQVJOSU5HX0hJR0hMSUdIVF9DU1M7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBtYXJrZXIgdW5kZXJsaW5lcyB0ZXh0LlxuICAgIGlmIChoaWdobGlnaHRNYXJrZXIpIHtcbiAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcihoaWdobGlnaHRNYXJrZXIsIHtcbiAgICAgICAgdHlwZTogJ2hpZ2hsaWdodCcsXG4gICAgICAgIGNsYXNzOiBoaWdobGlnaHRDc3NDbGFzcyxcbiAgICAgIH0pO1xuICAgICAgbWFya2Vycy5hZGQoaGlnaGxpZ2h0TWFya2VyKTtcbiAgICB9XG4gIH1cblxuICAvLyBGaW5kIGFsbCBvZiB0aGUgZ3V0dGVyIG1hcmtlcnMgZm9yIHRoZSBzYW1lIHJvdyBhbmQgY29tYmluZSB0aGVtIGludG8gb25lIG1hcmtlci9wb3B1cC5cbiAgZm9yIChjb25zdCBbcm93LCBtZXNzYWdlc10gb2Ygcm93VG9NZXNzYWdlLmVudHJpZXMoKSkge1xuICAgIC8vIElmIGF0IGxlYXN0IG9uZSBvZiB0aGUgZGlhZ25vc3RpY3MgaXMgYW4gZXJyb3IgcmF0aGVyIHRoYW4gdGhlIHdhcm5pbmcsXG4gICAgLy8gZGlzcGxheSB0aGUgZ2x5cGggaW4gdGhlIGd1dHRlciB0byByZXByZXNlbnQgYW4gZXJyb3IgcmF0aGVyIHRoYW4gYSB3YXJuaW5nLlxuICAgIGNvbnN0IGd1dHRlck1hcmtlckNzc0NsYXNzID0gbWVzc2FnZXMuc29tZShtc2cgPT4gbXNnLnR5cGUgPT09ICdFcnJvcicpXG4gICAgICA/IEVSUk9SX0dVVFRFUl9DU1NcbiAgICAgIDogV0FSTklOR19HVVRURVJfQ1NTO1xuXG4gICAgLy8gVGhpcyBtYXJrZXIgYWRkcyBzb21lIFVJIHRvIHRoZSBndXR0ZXIuXG4gICAgY29uc3Qge2l0ZW0sIGRpc3Bvc2V9ID0gY3JlYXRlR3V0dGVySXRlbShtZXNzYWdlcywgZ3V0dGVyTWFya2VyQ3NzQ2xhc3MsIGZpeGVyKTtcbiAgICBpdGVtVG9FZGl0b3Iuc2V0KGl0ZW0sIGVkaXRvcik7XG4gICAgY29uc3QgZ3V0dGVyTWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJQb3NpdGlvbihbcm93LCAwXSk7XG4gICAgZ3V0dGVyLmRlY29yYXRlTWFya2VyKGd1dHRlck1hcmtlciwge2l0ZW19KTtcbiAgICBndXR0ZXJNYXJrZXIub25EaWREZXN0cm95KGRpc3Bvc2UpO1xuICAgIG1hcmtlcnMuYWRkKGd1dHRlck1hcmtlcik7XG4gIH1cblxuICBlZGl0b3JUb01hcmtlcnMuc2V0KGVkaXRvciwgbWFya2Vycyk7XG5cbiAgLy8gT25jZSB0aGUgZ3V0dGVyIGlzIHNob3duIGZvciB0aGUgZmlyc3QgdGltZSwgaXQgaXMgZGlzcGxheWVkIGZvciB0aGUgbGlmZXRpbWUgb2YgdGhlXG4gIC8vIFRleHRFZGl0b3IuXG4gIGlmICh1cGRhdGUubWVzc2FnZXMubGVuZ3RoID4gMCkge1xuICAgIGd1dHRlci5zaG93KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlR3V0dGVySXRlbShcbiAgbWVzc2FnZXM6IEFycmF5PEZpbGVEaWFnbm9zdGljTWVzc2FnZT4sXG4gIGd1dHRlck1hcmtlckNzc0NsYXNzOiBzdHJpbmcsXG4gIGZpeGVyOiAobWVzc2FnZTogRmlsZURpYWdub3N0aWNNZXNzYWdlKSA9PiB2b2lkLFxuKToge2l0ZW06IEhUTUxFbGVtZW50OyBkaXNwb3NlOiAoKSA9PiB2b2lkfSB7XG4gIGNvbnN0IGl0ZW0gPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBpdGVtLmlubmVyVGV4dCA9ICdcXHUyNUI2JzsgLy8gVW5pY29kZSBjaGFyYWN0ZXIgZm9yIGEgcmlnaHQtcG9pbnRpbmcgdHJpYW5nbGUuXG4gIGl0ZW0uY2xhc3NOYW1lID0gZ3V0dGVyTWFya2VyQ3NzQ2xhc3M7XG4gIGxldCBwb3B1cEVsZW1lbnQgPSBudWxsO1xuICBsZXQgcGFuZUl0ZW1TdWJzY3JpcHRpb24gPSBudWxsO1xuICBsZXQgZGlzcG9zZVRpbWVvdXQgPSBudWxsO1xuICBjb25zdCBjbGVhckRpc3Bvc2VUaW1lb3V0ID0gKCkgPT4ge1xuICAgIGlmIChkaXNwb3NlVGltZW91dCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGRpc3Bvc2VUaW1lb3V0KTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IGRpc3Bvc2UgPSAoKSA9PiB7XG4gICAgaWYgKHBvcHVwRWxlbWVudCkge1xuICAgICAgUmVhY3RET00udW5tb3VudENvbXBvbmVudEF0Tm9kZShwb3B1cEVsZW1lbnQpO1xuICAgICAgcG9wdXBFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocG9wdXBFbGVtZW50KTtcbiAgICAgIHBvcHVwRWxlbWVudCA9IG51bGw7XG4gICAgfVxuICAgIGlmIChwYW5lSXRlbVN1YnNjcmlwdGlvbikge1xuICAgICAgcGFuZUl0ZW1TdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgcGFuZUl0ZW1TdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cbiAgICBjbGVhckRpc3Bvc2VUaW1lb3V0KCk7XG4gIH07XG4gIGNvbnN0IGdvVG9Mb2NhdGlvbiA9IChwYXRoOiBzdHJpbmcsIGxpbmU6IG51bWJlcikgPT4ge1xuICAgIC8vIEJlZm9yZSB3ZSBqdW1wIHRvIHRoZSBsb2NhdGlvbiwgd2Ugd2FudCB0byBjbG9zZSB0aGUgcG9wdXAuXG4gICAgZGlzcG9zZSgpO1xuICAgIGNvbnN0IGNvbHVtbiA9IDA7XG4gICAgYXRvbUdvVG9Mb2NhdGlvbihwYXRoLCBsaW5lLCBjb2x1bW4pO1xuICB9O1xuICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCBldmVudCA9PiB7XG4gICAgLy8gSWYgdGhlcmUgd2FzIHNvbWVob3cgYW5vdGhlciBwb3B1cCBmb3IgdGhpcyBndXR0ZXIgaXRlbSwgZGlzcG9zZSBpdC4gVGhpcyBjYW4gaGFwcGVuIGlmIHRoZVxuICAgIC8vIHVzZXIgbWFuYWdlcyB0byBzY3JvbGwgYW5kIGVzY2FwZSBkaXNwb3NhbC5cbiAgICBkaXNwb3NlKCk7XG4gICAgcG9wdXBFbGVtZW50ID0gc2hvd1BvcHVwRm9yKG1lc3NhZ2VzLCBpdGVtLCBnb1RvTG9jYXRpb24sIGZpeGVyKTtcbiAgICBwb3B1cEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIGRpc3Bvc2UpO1xuICAgIHBvcHVwRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgY2xlYXJEaXNwb3NlVGltZW91dCk7XG4gICAgLy8gVGhpcyBtYWtlcyBzdXJlIHRoYXQgdGhlIHBvcHVwIGRpc2FwcGVhcnMgd2hlbiB5b3UgY3RybCt0YWIgdG8gc3dpdGNoIHRhYnMuXG4gICAgcGFuZUl0ZW1TdWJzY3JpcHRpb24gPSBhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtKGRpc3Bvc2UpO1xuICB9KTtcbiAgaXRlbS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgZXZlbnQgPT4ge1xuICAgIC8vIFdoZW4gdGhlIHBvcHVwIGlzIHNob3duLCB3ZSB3YW50IHRvIGRpc3Bvc2UgaXQgaWYgdGhlIHVzZXIgbWFuYWdlcyB0byBtb3ZlIHRoZSBjdXJzb3Igb2ZmIG9mXG4gICAgLy8gdGhlIGd1dHRlciBnbHlwaCB3aXRob3V0IG1vdmluZyBpdCBvbnRvIHRoZSBwb3B1cC4gRXZlbiB0aG91Z2ggdGhlIHBvcHVwIGFwcGVhcnMgYWJvdmUgKGFzIGluXG4gICAgLy8gWi1pbmRleCBhYm92ZSkgdGhlIGd1dHRlciBnbHlwaCwgaWYgeW91IG1vdmUgdGhlIGN1cnNvciBzdWNoIHRoYXQgaXQgaXMgb25seSBhYm92ZSB0aGUgZ2x5cGhcbiAgICAvLyBmb3Igb25lIGZyYW1lIHlvdSBjYW4gY2F1c2UgdGhlIHBvcHVwIHRvIGFwcGVhciB3aXRob3V0IHRoZSBtb3VzZSBldmVyIGVudGVyaW5nIGl0LlxuICAgIGRpc3Bvc2VUaW1lb3V0ID0gc2V0VGltZW91dChkaXNwb3NlLCBQT1BVUF9ESVNQT1NFX1RJTUVPVVQpO1xuICB9KTtcbiAgcmV0dXJuIHtpdGVtLCBkaXNwb3NlfTtcbn1cblxuLyoqXG4gKiBTaG93cyBhIHBvcHVwIGZvciB0aGUgZGlhZ25vc3RpYyBqdXN0IGJlbG93IHRoZSBzcGVjaWZpZWQgaXRlbS5cbiAqL1xuZnVuY3Rpb24gc2hvd1BvcHVwRm9yKFxuICAgIG1lc3NhZ2VzOiBBcnJheTxGaWxlRGlhZ25vc3RpY01lc3NhZ2U+LFxuICAgIGl0ZW06IEhUTUxFbGVtZW50LFxuICAgIGdvVG9Mb2NhdGlvbjogKGZpbGVQYXRoOiBOdWNsaWRlVXJpLCBsaW5lOiBudW1iZXIpID0+IG1peGVkLFxuICAgIGZpeGVyOiAobWVzc2FnZTogRmlsZURpYWdub3N0aWNNZXNzYWdlKSA9PiB2b2lkLFxuICApOiBIVE1MRWxlbWVudCB7XG4gIC8vIFRoZSBwb3B1cCB3aWxsIGJlIGFuIGFic29sdXRlbHkgcG9zaXRpb25lZCBjaGlsZCBlbGVtZW50IG9mIDxhdG9tLXdvcmtzcGFjZT4gc28gdGhhdCBpdCBhcHBlYXJzXG4gIC8vIG9uIHRvcCBvZiBldmVyeXRoaW5nLlxuICBjb25zdCB3b3Jrc3BhY2VFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKTtcbiAgY29uc3QgaG9zdEVsZW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHdvcmtzcGFjZUVsZW1lbnQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChob3N0RWxlbWVudCk7XG5cbiAgLy8gTW92ZSBpdCBkb3duIHZlcnRpY2FsbHkgc28gaXQgZG9lcyBub3QgZW5kIHVwIHVuZGVyIHRoZSBtb3VzZSBwb2ludGVyLlxuICBjb25zdCB7dG9wLCBsZWZ0fSA9IGl0ZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgY29uc3QgdHJhY2tlZEZpeGVyID0gKC4uLmFyZ3MpID0+IHtcbiAgICBmaXhlciguLi5hcmdzKTtcbiAgICB0cmFjaygnZGlhZ25vc3RpY3MtZ3V0dGVyLWF1dG9maXgnKTtcbiAgfTtcbiAgY29uc3QgdHJhY2tlZEdvVG9Mb2NhdGlvbiA9ICguLi5hcmdzKSA9PiB7XG4gICAgZ29Ub0xvY2F0aW9uKC4uLmFyZ3MpO1xuICAgIHRyYWNrKCdkaWFnbm9zdGljcy1ndXR0ZXItZ290by1sb2NhdGlvbicpO1xuICB9O1xuXG4gIFJlYWN0RE9NLnJlbmRlcihcbiAgICA8RGlhZ25vc3RpY3NQb3B1cFxuICAgICAgbGVmdD17bGVmdH1cbiAgICAgIHRvcD17dG9wfVxuICAgICAgbWVzc2FnZXM9e21lc3NhZ2VzfVxuICAgICAgZml4ZXI9e3RyYWNrZWRGaXhlcn1cbiAgICAgIGdvVG9Mb2NhdGlvbj17dHJhY2tlZEdvVG9Mb2NhdGlvbn1cbiAgICAvPixcbiAgICBob3N0RWxlbWVudFxuICApO1xuICAvLyBDaGVjayB0byBzZWUgd2hldGhlciB0aGUgcG9wdXAgaXMgd2l0aGluIHRoZSBib3VuZHMgb2YgdGhlIFRleHRFZGl0b3IuIElmIG5vdCwgZGlzcGxheSBpdCBhYm92ZVxuICAvLyB0aGUgZ2x5cGggcmF0aGVyIHRoYW4gYmVsb3cgaXQuXG4gIGNvbnN0IGVkaXRvciA9IGl0ZW1Ub0VkaXRvci5nZXQoaXRlbSk7XG4gIGNvbnN0IGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcbiAgY29uc3Qge3RvcDogZWRpdG9yVG9wLCBoZWlnaHQ6IGVkaXRvckhlaWdodH0gPSBlZGl0b3JFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBjb25zdCB7dG9wOiBpdGVtVG9wLCBoZWlnaHQ6IGl0ZW1IZWlnaHR9ID0gaXRlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgY29uc3QgcG9wdXBIZWlnaHQgPSBob3N0RWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZC5jbGllbnRIZWlnaHQ7XG4gIGlmICgoaXRlbVRvcCArIGl0ZW1IZWlnaHQgKyBwb3B1cEhlaWdodCkgPiAoZWRpdG9yVG9wICsgZWRpdG9ySGVpZ2h0KSkge1xuICAgIGNvbnN0IHBvcHVwRWxlbWVudCA9IGhvc3RFbGVtZW50LmZpcnN0RWxlbWVudENoaWxkO1xuICAgIC8vIFNoaWZ0IHRoZSBwb3B1cCBiYWNrIGRvd24gYnkgR0xZUEhfSEVJR0hULCBzbyB0aGF0IHRoZSBib3R0b20gcGFkZGluZyBvdmVybGFwcyB3aXRoIHRoZVxuICAgIC8vIGdseXBoLiBBbiBhZGRpdGlvbmFsIDQgcHggaXMgbmVlZGVkIHRvIG1ha2UgaXQgbG9vayB0aGUgc2FtZSB3YXkgaXQgZG9lcyB3aGVuIGl0IHNob3dzIHVwXG4gICAgLy8gYmVsb3cuIEkgZG9uJ3Qga25vdyB3aHkuXG4gICAgcG9wdXBFbGVtZW50LnN0eWxlLnRvcCA9IFN0cmluZyhpdGVtVG9wIC0gcG9wdXBIZWlnaHQgKyBHTFlQSF9IRUlHSFQgKyA0KSArICdweCc7XG4gIH1cblxuICB0cnkge1xuICAgIHJldHVybiBob3N0RWxlbWVudDtcbiAgfSBmaW5hbGx5IHtcbiAgICBtZXNzYWdlcy5mb3JFYWNoKG1lc3NhZ2UgPT4ge1xuICAgICAgdHJhY2soJ2RpYWdub3N0aWNzLWd1dHRlci1zaG93LXBvcHVwJywge1xuICAgICAgICAnZGlhZ25vc3RpY3MtcHJvdmlkZXInOiBtZXNzYWdlLnByb3ZpZGVyTmFtZSxcbiAgICAgICAgJ2RpYWdub3N0aWNzLW1lc3NhZ2UnOiBtZXNzYWdlLnRleHQgfHwgbWVzc2FnZS5odG1sIHx8ICcnLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==