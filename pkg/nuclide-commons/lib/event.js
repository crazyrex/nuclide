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

exports.attachEvent = attachEvent;
exports.observableFromSubscribeFunction = observableFromSubscribeFunction;

var _eventKit = require('event-kit');

var _reactivexRxjs = require('@reactivex/rxjs');

/**
 * Add an event listener an return a disposable for removing it. Note that this function assumes
 * node EventEmitter semantics: namely, that adding the same combination of eventName and callback
 * adds a second listener.
 */

function attachEvent(emitter, eventName, callback) {
  emitter.addListener(eventName, callback);
  return new _eventKit.Disposable(function () {
    emitter.removeListener(eventName, callback);
  });
}

function observableFromSubscribeFunction(fn) {
  return _reactivexRxjs.Observable.create(function (observer) {
    var disposable = fn(observer.next.bind(observer));
    return function () {
      disposable.dispose();
    };
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozt3QkFheUIsV0FBVzs7NkJBQ1gsaUJBQWlCOzs7Ozs7OztBQU9uQyxTQUFTLFdBQVcsQ0FDekIsT0FBcUIsRUFDckIsU0FBaUIsRUFDakIsUUFBa0IsRUFDTjtBQUNaLFNBQU8sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3pDLFNBQU8seUJBQWUsWUFBTTtBQUMxQixXQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztHQUM3QyxDQUFDLENBQUM7Q0FDSjs7QUFLTSxTQUFTLCtCQUErQixDQUFJLEVBQXdCLEVBQWlCO0FBQzFGLFNBQU8sMEJBQVcsTUFBTSxDQUFDLFVBQUEsUUFBUSxFQUFJO0FBQ25DLFFBQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3BELFdBQU8sWUFBTTtBQUFFLGdCQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7S0FBRSxDQUFDO0dBQ3hDLENBQUMsQ0FBQztDQUNKIiwiZmlsZSI6ImV2ZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcblxuaW1wb3J0IHtEaXNwb3NhYmxlfSBmcm9tICdldmVudC1raXQnO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdAcmVhY3RpdmV4L3J4anMnO1xuXG4vKipcbiAqIEFkZCBhbiBldmVudCBsaXN0ZW5lciBhbiByZXR1cm4gYSBkaXNwb3NhYmxlIGZvciByZW1vdmluZyBpdC4gTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gYXNzdW1lc1xuICogbm9kZSBFdmVudEVtaXR0ZXIgc2VtYW50aWNzOiBuYW1lbHksIHRoYXQgYWRkaW5nIHRoZSBzYW1lIGNvbWJpbmF0aW9uIG9mIGV2ZW50TmFtZSBhbmQgY2FsbGJhY2tcbiAqIGFkZHMgYSBzZWNvbmQgbGlzdGVuZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hFdmVudChcbiAgZW1pdHRlcjogRXZlbnRFbWl0dGVyLFxuICBldmVudE5hbWU6IHN0cmluZyxcbiAgY2FsbGJhY2s6IEZ1bmN0aW9uXG4pOiBEaXNwb3NhYmxlIHtcbiAgZW1pdHRlci5hZGRMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrKTtcbiAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICB9KTtcbn1cblxudHlwZSBTdWJzY3JpYmVDYWxsYmFjazxUPiA9IChpdGVtOiBUKSA9PiBhbnk7XG50eXBlIFN1YnNjcmliZUZ1bmN0aW9uPFQ+ID0gKGNhbGxiYWNrOiBTdWJzY3JpYmVDYWxsYmFjazxUPikgPT4gSURpc3Bvc2FibGU7XG5cbmV4cG9ydCBmdW5jdGlvbiBvYnNlcnZhYmxlRnJvbVN1YnNjcmliZUZ1bmN0aW9uPFQ+KGZuOiBTdWJzY3JpYmVGdW5jdGlvbjxUPik6IE9ic2VydmFibGU8VD4ge1xuICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUob2JzZXJ2ZXIgPT4ge1xuICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBmbihvYnNlcnZlci5uZXh0LmJpbmQob2JzZXJ2ZXIpKTtcbiAgICByZXR1cm4gKCkgPT4geyBkaXNwb3NhYmxlLmRpc3Bvc2UoKTsgfTtcbiAgfSk7XG59XG4iXX0=