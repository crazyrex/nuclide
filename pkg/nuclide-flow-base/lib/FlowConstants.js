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

var ServerStatus = Object.freeze({
  FAILED: 'failed',
  UNKNOWN: 'unknown',
  NOT_RUNNING: 'not running',
  NOT_INSTALLED: 'not installed',
  BUSY: 'busy',
  INIT: 'init',
  READY: 'ready'
});

exports.ServerStatus = ServerStatus;
// If we put this type on the definition, use sites will not see the individual properties in the
// Server object for things like autocomplete. Worse, Flow will assume that *any* string key will
// yield a valid ServerStatus result, so we won't get protection against typos. Adding this
// assertion here ensures that all of the values are valid ServerStatus options, while yielding
// better Flow behavior at use sites.
ServerStatus;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkZsb3dDb25zdGFudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBYU8sSUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUN4QyxRQUFNLEVBQUUsUUFBUTtBQUNoQixTQUFPLEVBQUUsU0FBUztBQUNsQixhQUFXLEVBQUcsYUFBYTtBQUMzQixlQUFhLEVBQUUsZUFBZTtBQUM5QixNQUFJLEVBQUUsTUFBTTtBQUNaLE1BQUksRUFBRSxNQUFNO0FBQ1osT0FBSyxFQUFFLE9BQU87Q0FDZixDQUFDLENBQUM7Ozs7Ozs7O0FBT0gsQUFBQyxZQUFZLENBQXVDIiwiZmlsZSI6IkZsb3dDb25zdGFudHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7U2VydmVyU3RhdHVzVHlwZX0gZnJvbSAnLi4nO1xuXG5leHBvcnQgY29uc3QgU2VydmVyU3RhdHVzID0gT2JqZWN0LmZyZWV6ZSh7XG4gIEZBSUxFRDogJ2ZhaWxlZCcsXG4gIFVOS05PV046ICd1bmtub3duJyxcbiAgTk9UX1JVTk5JTkc6ICAnbm90IHJ1bm5pbmcnLFxuICBOT1RfSU5TVEFMTEVEOiAnbm90IGluc3RhbGxlZCcsXG4gIEJVU1k6ICdidXN5JyxcbiAgSU5JVDogJ2luaXQnLFxuICBSRUFEWTogJ3JlYWR5Jyxcbn0pO1xuXG4vLyBJZiB3ZSBwdXQgdGhpcyB0eXBlIG9uIHRoZSBkZWZpbml0aW9uLCB1c2Ugc2l0ZXMgd2lsbCBub3Qgc2VlIHRoZSBpbmRpdmlkdWFsIHByb3BlcnRpZXMgaW4gdGhlXG4vLyBTZXJ2ZXIgb2JqZWN0IGZvciB0aGluZ3MgbGlrZSBhdXRvY29tcGxldGUuIFdvcnNlLCBGbG93IHdpbGwgYXNzdW1lIHRoYXQgKmFueSogc3RyaW5nIGtleSB3aWxsXG4vLyB5aWVsZCBhIHZhbGlkIFNlcnZlclN0YXR1cyByZXN1bHQsIHNvIHdlIHdvbid0IGdldCBwcm90ZWN0aW9uIGFnYWluc3QgdHlwb3MuIEFkZGluZyB0aGlzXG4vLyBhc3NlcnRpb24gaGVyZSBlbnN1cmVzIHRoYXQgYWxsIG9mIHRoZSB2YWx1ZXMgYXJlIHZhbGlkIFNlcnZlclN0YXR1cyBvcHRpb25zLCB3aGlsZSB5aWVsZGluZ1xuLy8gYmV0dGVyIEZsb3cgYmVoYXZpb3IgYXQgdXNlIHNpdGVzLlxuKFNlcnZlclN0YXR1czogeyBba2V5OiBzdHJpbmddOiBTZXJ2ZXJTdGF0dXNUeXBlIH0pO1xuIl19