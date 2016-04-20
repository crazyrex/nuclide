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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _reactForAtom = require('react-for-atom');

var _atom = require('atom');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _nuclideAtomHelpers = require('../../nuclide-atom-helpers');

var _createBoundTextBuffer = require('./createBoundTextBuffer');

var _createBoundTextBuffer2 = _interopRequireDefault(_createBoundTextBuffer);

var NUCLIDE_PROCESS_OUTPUT_VIEW_URI = 'atom://nuclide/process-output/';
var PROCESS_OUTPUT_HANDLER_KEY = 'nuclide-processOutputHandler';
var PROCESS_OUTPUT_STORE_KEY = 'nuclide-processOutputStore';
var PROCESS_OUTPUT_VIEW_TOP_ELEMENT = 'nuclide-processOutputViewTopElement';

var subscriptions = undefined;
var processOutputStores = undefined;
var logger = undefined;

function getLogger() {
  if (!logger) {
    logger = require('../../nuclide-logging').getLogger();
  }
  return logger;
}

/**
 * @param uri A String consisting of NUCLIDE_PROCESS_OUTPUT_VIEW_URI plus a
 *   tabTitle for the new pane.
 * @param options The same as the `options` passed to the atom.workspace.open()
 *   call that triggered this function. In this case, it should contain special
 *   Nuclide arguments (see `runCommandInNewPane`).
 */
function createProcessOutputView(uri, openOptions) {
  var processOutputStore = openOptions[PROCESS_OUTPUT_STORE_KEY];
  var processOutputHandler = openOptions[PROCESS_OUTPUT_HANDLER_KEY];
  var processOutputViewTopElement = openOptions[PROCESS_OUTPUT_VIEW_TOP_ELEMENT];
  var tabTitle = uri.slice(NUCLIDE_PROCESS_OUTPUT_VIEW_URI.length);

  var ProcessOutputView = require('./ProcessOutputView');
  var component = ProcessOutputView.createView({
    title: tabTitle,
    textBuffer: (0, _createBoundTextBuffer2['default'])(processOutputStore, processOutputHandler),
    processOutputStore: processOutputStore,
    processOutputViewTopElement: processOutputViewTopElement
  });

  (0, _assert2['default'])(processOutputStores);
  processOutputStores.add(processOutputStore);

  // When the process exits, we want to remove the reference to the process.
  var handleProcessExit = function handleProcessExit() {
    if (processOutputStores) {
      processOutputStores['delete'](processOutputStore);
    }
  };
  var handleProcessExitWithError = function handleProcessExitWithError(error) {
    getLogger().error('runCommandInNewPane encountered an error running: ' + tabTitle, error);
    handleProcessExit();
  };

  processOutputStore.startProcess().then(handleProcessExit, handleProcessExitWithError);
  return component;
}

/**
 * @param options See definition of RunCommandOptions.
 */
function runCommandInNewPane(options) {
  var _openOptions;

  var openOptions = (_openOptions = {}, _defineProperty(_openOptions, PROCESS_OUTPUT_HANDLER_KEY, options.processOutputHandler), _defineProperty(_openOptions, PROCESS_OUTPUT_STORE_KEY, options.processOutputStore), _defineProperty(_openOptions, PROCESS_OUTPUT_VIEW_TOP_ELEMENT, options.processOutputViewTopElement), _openOptions);

  var tabTitle = options.tabTitle;
  if (options.destroyExistingPane) {
    (0, _nuclideAtomHelpers.destroyPaneItemWithTitle)(tabTitle);
  }
  // Not documented: the 'options' passed to atom.workspace.open() are passed to the opener.
  // There's no other great way for a consumer of this service to specify a ProcessOutputHandler.
  return atom.workspace.open(NUCLIDE_PROCESS_OUTPUT_VIEW_URI + tabTitle, openOptions);
}

/**
 * Set up and Teardown of Atom Opener
 */

function activateModule() {
  if (!subscriptions) {
    subscriptions = new _atom.CompositeDisposable();
    // $FlowFixMe: the expando options argument is an undocumented hack.
    subscriptions.add(atom.workspace.addOpener(function (uri, options) {
      if (uri.startsWith(NUCLIDE_PROCESS_OUTPUT_VIEW_URI)) {
        return createProcessOutputView(uri, options);
      }
    }));
    processOutputStores = new Set();
  }
}

function disposeModule() {
  if (subscriptions) {
    subscriptions.dispose();
    subscriptions = null;
  }
  if (processOutputStores) {
    for (var processStore of processOutputStores) {
      processStore.dispose();
    }
    processOutputStores = null;
  }
}

/**
 * "Reference Counting"
 */

var references = 0;
function incrementReferences() {
  if (references === 0) {
    activateModule();
  }
  references++;
}

function decrementReferences() {
  references--;
  if (references < 0) {
    references = 0;
    getLogger.error('getRunCommandInNewPane: number of decrementReferences() ' + 'calls has exceeded the number of incrementReferences() calls.');
  }
  if (references === 0) {
    disposeModule();
  }
}

/**
 * @return a RunCommandFunctionAndCleanup, which has the fields:
 *   - runCommandInNewPane: The function which can be used to create a new pane
 *       with the output of a process.
 *   - disposable: A Disposable which should be disposed when this function is
 *       no longer needed by the caller.
 */
function getRunCommandInNewPane() {
  incrementReferences();
  return {
    runCommandInNewPane: runCommandInNewPane,
    disposable: new _atom.Disposable(function () {
      return decrementReferences();
    })
  };
}

module.exports = getRunCommandInNewPane;

/* A title for the tab of the newly opened pane. */

/* The ProcessOutputStore that provides the data to display. */

/**
 * An optional ProcessOutputHandler that is appropriate for the expected output. See the
 * constructor of ProcessOutputView for more information.
 */

/* An optional React component that will be placed at the top of the process output view. */

/* If true, before opening the new tab, it will close any existing tab with the same title. */
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldFJ1bkNvbW1hbmRJbk5ld1BhbmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs0QkFjb0IsZ0JBQWdCOztvQkFzQlUsTUFBTTs7c0JBQzlCLFFBQVE7Ozs7a0NBQ1MsNEJBQTRCOztxQ0FDakMseUJBQXlCOzs7O0FBRTNELElBQU0sK0JBQStCLEdBQUcsZ0NBQWdDLENBQUM7QUFDekUsSUFBTSwwQkFBMEIsR0FBRyw4QkFBOEIsQ0FBQztBQUNsRSxJQUFNLHdCQUF3QixHQUFHLDRCQUE0QixDQUFDO0FBQzlELElBQU0sK0JBQStCLEdBQUcscUNBQXFDLENBQUM7O0FBTzlFLElBQUksYUFBbUMsWUFBQSxDQUFDO0FBQ3hDLElBQUksbUJBQTZDLFlBQUEsQ0FBQztBQUNsRCxJQUFJLE1BQU0sWUFBQSxDQUFDOztBQUVYLFNBQVMsU0FBUyxHQUFHO0FBQ25CLE1BQUksQ0FBQyxNQUFNLEVBQUU7QUFDWCxVQUFNLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7R0FDdkQ7QUFDRCxTQUFPLE1BQU0sQ0FBQztDQUNmOzs7Ozs7Ozs7QUFTRCxTQUFTLHVCQUF1QixDQUM5QixHQUFXLEVBQ1gsV0FBMkMsRUFDOUI7QUFDYixNQUFNLGtCQUFrQixHQUFHLFdBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0FBQ2pFLE1BQU0sb0JBQW9CLEdBQUcsV0FBVyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDckUsTUFBTSwyQkFBMkIsR0FBRyxXQUFXLENBQUMsK0JBQStCLENBQUMsQ0FBQztBQUNqRixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLCtCQUErQixDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUVuRSxNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQ3pELE1BQU0sU0FBUyxHQUFHLGlCQUFpQixDQUFDLFVBQVUsQ0FBQztBQUM3QyxTQUFLLEVB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O0dBQ3BFO0FBQ0QsTUFBSSxVQUFVLEtBQUssQ0FBQyxFQUFFO0FBQ3BCLGlCQUFhLEVBQUUsQ0FBQztHQUNqQjtDQUNGOzs7Ozs7Ozs7QUFTRCxTQUFTLHNCQUFzQixHQUFpQztBQUM5RCxxQkFBbUIsRUFBRSxDQUFDO0FBQ3RCLFNBQU87QUFDTCx1QkFBbUIsRUFBbkIsbUJBQW1CO0FBQ25CLGNBQVUsRUFBRSxxQkFBZTthQUFNLG1CQUFtQixFQUFFO0tBQUEsQ0FBQztHQUN4RCxDQUFDO0NBQ0g7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxzQkFBc0IsQ0FBQyIsImZpbGUiOiJnZXRSdW5Db21tYW5kSW5OZXdQYW5lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge1Byb2Nlc3NPdXRwdXRTdG9yZX0gZnJvbSAnLi4vLi4vbnVjbGlkZS1wcm9jZXNzLW91dHB1dC1zdG9yZSc7XG5pbXBvcnQgdHlwZSB7UHJvY2Vzc091dHB1dEhhbmRsZXJ9IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQge1JlYWN0fSBmcm9tICdyZWFjdC1mb3ItYXRvbSc7XG5cbmV4cG9ydCB0eXBlIFJ1bkNvbW1hbmRPcHRpb25zID0ge1xuICAvKiBBIHRpdGxlIGZvciB0aGUgdGFiIG9mIHRoZSBuZXdseSBvcGVuZWQgcGFuZS4gKi9cbiAgdGFiVGl0bGU6IHN0cmluZztcbiAgLyogVGhlIFByb2Nlc3NPdXRwdXRTdG9yZSB0aGF0IHByb3ZpZGVzIHRoZSBkYXRhIHRvIGRpc3BsYXkuICovXG4gIHByb2Nlc3NPdXRwdXRTdG9yZTogUHJvY2Vzc091dHB1dFN0b3JlO1xuICAvKipcbiAgICogQW4gb3B0aW9uYWwgUHJvY2Vzc091dHB1dEhhbmRsZXIgdGhhdCBpcyBhcHByb3ByaWF0ZSBmb3IgdGhlIGV4cGVjdGVkIG91dHB1dC4gU2VlIHRoZVxuICAgKiBjb25zdHJ1Y3RvciBvZiBQcm9jZXNzT3V0cHV0VmlldyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIHByb2Nlc3NPdXRwdXRIYW5kbGVyPzogUHJvY2Vzc091dHB1dEhhbmRsZXI7XG4gIC8qIEFuIG9wdGlvbmFsIFJlYWN0IGNvbXBvbmVudCB0aGF0IHdpbGwgYmUgcGxhY2VkIGF0IHRoZSB0b3Agb2YgdGhlIHByb2Nlc3Mgb3V0cHV0IHZpZXcuICovXG4gIHByb2Nlc3NPdXRwdXRWaWV3VG9wRWxlbWVudD86IFJlYWN0LkVsZW1lbnQ7XG4gIC8qIElmIHRydWUsIGJlZm9yZSBvcGVuaW5nIHRoZSBuZXcgdGFiLCBpdCB3aWxsIGNsb3NlIGFueSBleGlzdGluZyB0YWIgd2l0aCB0aGUgc2FtZSB0aXRsZS4gKi9cbiAgZGVzdHJveUV4aXN0aW5nUGFuZT86IGJvb2xlYW47XG59O1xuZXhwb3J0IHR5cGUgUnVuQ29tbWFuZEZ1bmN0aW9uQW5kQ2xlYW51cCA9IHtcbiAgcnVuQ29tbWFuZEluTmV3UGFuZTogKG9wdGlvbnM6IFJ1bkNvbW1hbmRPcHRpb25zKSA9PiBQcm9taXNlPGF0b20kVGV4dEVkaXRvcj47XG4gIGRpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xufTtcblxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tICdhdG9tJztcbmltcG9ydCBpbnZhcmlhbnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7ZGVzdHJveVBhbmVJdGVtV2l0aFRpdGxlfSBmcm9tICcuLi8uLi9udWNsaWRlLWF0b20taGVscGVycyc7XG5pbXBvcnQgY3JlYXRlQm91bmRUZXh0QnVmZmVyIGZyb20gJy4vY3JlYXRlQm91bmRUZXh0QnVmZmVyJztcblxuY29uc3QgTlVDTElERV9QUk9DRVNTX09VVFBVVF9WSUVXX1VSSSA9ICdhdG9tOi8vbnVjbGlkZS9wcm9jZXNzLW91dHB1dC8nO1xuY29uc3QgUFJPQ0VTU19PVVRQVVRfSEFORExFUl9LRVkgPSAnbnVjbGlkZS1wcm9jZXNzT3V0cHV0SGFuZGxlcic7XG5jb25zdCBQUk9DRVNTX09VVFBVVF9TVE9SRV9LRVkgPSAnbnVjbGlkZS1wcm9jZXNzT3V0cHV0U3RvcmUnO1xuY29uc3QgUFJPQ0VTU19PVVRQVVRfVklFV19UT1BfRUxFTUVOVCA9ICdudWNsaWRlLXByb2Nlc3NPdXRwdXRWaWV3VG9wRWxlbWVudCc7XG50eXBlIENyZWF0ZVByb2Nlc3NPdXRwdXRWaWV3T3B0aW9ucyA9IHtcbiAgJ251Y2xpZGUtcHJvY2Vzc091dHB1dEhhbmRsZXInOiA/UHJvY2Vzc091dHB1dEhhbmRsZXI7XG4gICdudWNsaWRlLXByb2Nlc3NPdXRwdXRTdG9yZSc6IFByb2Nlc3NPdXRwdXRTdG9yZTtcbiAgJ251Y2xpZGUtcHJvY2Vzc091dHB1dFZpZXdUb3BFbGVtZW50JzogP1JlYWN0LkVsZW1lbnQ7XG59O1xuXG5sZXQgc3Vic2NyaXB0aW9uczogP0NvbXBvc2l0ZURpc3Bvc2FibGU7XG5sZXQgcHJvY2Vzc091dHB1dFN0b3JlczogP1NldDxQcm9jZXNzT3V0cHV0U3RvcmU+O1xubGV0IGxvZ2dlcjtcblxuZnVuY3Rpb24gZ2V0TG9nZ2VyKCkge1xuICBpZiAoIWxvZ2dlcikge1xuICAgIGxvZ2dlciA9IHJlcXVpcmUoJy4uLy4uL251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xuICB9XG4gIHJldHVybiBsb2dnZXI7XG59XG5cbi8qKlxuICogQHBhcmFtIHVyaSBBIFN0cmluZyBjb25zaXN0aW5nIG9mIE5VQ0xJREVfUFJPQ0VTU19PVVRQVVRfVklFV19VUkkgcGx1cyBhXG4gKiAgIHRhYlRpdGxlIGZvciB0aGUgbmV3IHBhbmUuXG4gKiBAcGFyYW0gb3B0aW9ucyBUaGUgc2FtZSBhcyB0aGUgYG9wdGlvbnNgIHBhc3NlZCB0byB0aGUgYXRvbS53b3Jrc3BhY2Uub3BlbigpXG4gKiAgIGNhbGwgdGhhdCB0cmlnZ2VyZWQgdGhpcyBmdW5jdGlvbi4gSW4gdGhpcyBjYXNlLCBpdCBzaG91bGQgY29udGFpbiBzcGVjaWFsXG4gKiAgIE51Y2xpZGUgYXJndW1lbnRzIChzZWUgYHJ1bkNvbW1hbmRJbk5ld1BhbmVgKS5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUHJvY2Vzc091dHB1dFZpZXcoXG4gIHVyaTogc3RyaW5nLFxuICBvcGVuT3B0aW9uczogQ3JlYXRlUHJvY2Vzc091dHB1dFZpZXdPcHRpb25zXG4pOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHByb2Nlc3NPdXRwdXRTdG9yZSA9IG9wZW5PcHRpb25zW1BST0NFU1NfT1VUUFVUX1NUT1JFX0tFWV07XG4gIGNvbnN0IHByb2Nlc3NPdXRwdXRIYW5kbGVyID0gb3Blbk9wdGlvbnNbUFJPQ0VTU19PVVRQVVRfSEFORExFUl9LRVldO1xuICBjb25zdCBwcm9jZXNzT3V0cHV0Vmlld1RvcEVsZW1lbnQgPSBvcGVuT3B0aW9uc1tQUk9DRVNTX09VVFBVVF9WSUVXX1RPUF9FTEVNRU5UXTtcbiAgY29uc3QgdGFiVGl0bGUgPSB1cmkuc2xpY2UoTlVDTElERV9QUk9DRVNTX09VVFBVVF9WSUVXX1VSSS5sZW5ndGgpO1xuXG4gIGNvbnN0IFByb2Nlc3NPdXRwdXRWaWV3ID0gcmVxdWlyZSgnLi9Qcm9jZXNzT3V0cHV0VmlldycpO1xuICBjb25zdCBjb21wb25lbnQgPSBQcm9jZXNzT3V0cHV0Vmlldy5jcmVhdGVWaWV3KHtcbiAgICB0aXRsZTogdGFiVGl0bGUsXG4gICAgdGV4dEJ1ZmZlcjogY3JlYXRlQm91bmRUZXh0QnVmZmVyKHByb2Nlc3NPdXRwdXRTdG9yZSwgcHJvY2Vzc091dHB1dEhhbmRsZXIpLFxuICAgIHByb2Nlc3NPdXRwdXRTdG9yZSxcbiAgICBwcm9jZXNzT3V0cHV0Vmlld1RvcEVsZW1lbnQsXG4gIH0pO1xuXG4gIGludmFyaWFudChwcm9jZXNzT3V0cHV0U3RvcmVzKTtcbiAgcHJvY2Vzc091dHB1dFN0b3Jlcy5hZGQocHJvY2Vzc091dHB1dFN0b3JlKTtcblxuICAvLyBXaGVuIHRoZSBwcm9jZXNzIGV4aXRzLCB3ZSB3YW50IHRvIHJlbW92ZSB0aGUgcmVmZXJlbmNlIHRvIHRoZSBwcm9jZXNzLlxuICBjb25zdCBoYW5kbGVQcm9jZXNzRXhpdCA9ICgpID0+IHtcbiAgICBpZiAocHJvY2Vzc091dHB1dFN0b3Jlcykge1xuICAgICAgcHJvY2Vzc091dHB1dFN0b3Jlcy5kZWxldGUocHJvY2Vzc091dHB1dFN0b3JlKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IGhhbmRsZVByb2Nlc3NFeGl0V2l0aEVycm9yID0gKGVycm9yOiBFcnJvcikgPT4ge1xuICAgIGdldExvZ2dlcigpLmVycm9yKGBydW5Db21tYW5kSW5OZXdQYW5lIGVuY291bnRlcmVkIGFuIGVycm9yIHJ1bm5pbmc6ICR7dGFiVGl0bGV9YCwgZXJyb3IpO1xuICAgIGhhbmRsZVByb2Nlc3NFeGl0KCk7XG4gIH07XG5cbiAgcHJvY2Vzc091dHB1dFN0b3JlLnN0YXJ0UHJvY2VzcygpLnRoZW4oaGFuZGxlUHJvY2Vzc0V4aXQsIGhhbmRsZVByb2Nlc3NFeGl0V2l0aEVycm9yKTtcbiAgcmV0dXJuIGNvbXBvbmVudDtcbn1cblxuLyoqXG4gKiBAcGFyYW0gb3B0aW9ucyBTZWUgZGVmaW5pdGlvbiBvZiBSdW5Db21tYW5kT3B0aW9ucy5cbiAqL1xuZnVuY3Rpb24gcnVuQ29tbWFuZEluTmV3UGFuZShvcHRpb25zOiBSdW5Db21tYW5kT3B0aW9ucyk6IFByb21pc2U8YXRvbSRUZXh0RWRpdG9yPiB7XG4gIGNvbnN0IG9wZW5PcHRpb25zID0ge1xuICAgIFtQUk9DRVNTX09VVFBVVF9IQU5ETEVSX0tFWV06IG9wdGlvbnMucHJvY2Vzc091dHB1dEhhbmRsZXIsXG4gICAgW1BST0NFU1NfT1VUUFVUX1NUT1JFX0tFWV06IG9wdGlvbnMucHJvY2Vzc091dHB1dFN0b3JlLFxuICAgIFtQUk9DRVNTX09VVFBVVF9WSUVXX1RPUF9FTEVNRU5UXTogb3B0aW9ucy5wcm9jZXNzT3V0cHV0Vmlld1RvcEVsZW1lbnQsXG4gIH07XG5cbiAgY29uc3QgdGFiVGl0bGUgPSBvcHRpb25zLnRhYlRpdGxlO1xuICBpZiAob3B0aW9ucy5kZXN0cm95RXhpc3RpbmdQYW5lKSB7XG4gICAgZGVzdHJveVBhbmVJdGVtV2l0aFRpdGxlKHRhYlRpdGxlKTtcbiAgfVxuICAvLyBOb3QgZG9jdW1lbnRlZDogdGhlICdvcHRpb25zJyBwYXNzZWQgdG8gYXRvbS53b3Jrc3BhY2Uub3BlbigpIGFyZSBwYXNzZWQgdG8gdGhlIG9wZW5lci5cbiAgLy8gVGhlcmUncyBubyBvdGhlciBncmVhdCB3YXkgZm9yIGEgY29uc3VtZXIgb2YgdGhpcyBzZXJ2aWNlIHRvIHNwZWNpZnkgYSBQcm9jZXNzT3V0cHV0SGFuZGxlci5cbiAgcmV0dXJuIGF0b20ud29ya3NwYWNlLm9wZW4oTlVDTElERV9QUk9DRVNTX09VVFBVVF9WSUVXX1VSSSArIHRhYlRpdGxlLCBvcGVuT3B0aW9ucyk7XG59XG5cbi8qKlxuICogU2V0IHVwIGFuZCBUZWFyZG93biBvZiBBdG9tIE9wZW5lclxuICovXG5cbmZ1bmN0aW9uIGFjdGl2YXRlTW9kdWxlKCk6IHZvaWQge1xuICBpZiAoIXN1YnNjcmlwdGlvbnMpIHtcbiAgICBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAvLyAkRmxvd0ZpeE1lOiB0aGUgZXhwYW5kbyBvcHRpb25zIGFyZ3VtZW50IGlzIGFuIHVuZG9jdW1lbnRlZCBoYWNrLlxuICAgIHN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLmFkZE9wZW5lcigodXJpLCBvcHRpb25zKSA9PiB7XG4gICAgICBpZiAodXJpLnN0YXJ0c1dpdGgoTlVDTElERV9QUk9DRVNTX09VVFBVVF9WSUVXX1VSSSkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVByb2Nlc3NPdXRwdXRWaWV3KHVyaSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSkpO1xuICAgIHByb2Nlc3NPdXRwdXRTdG9yZXMgPSBuZXcgU2V0KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGlzcG9zZU1vZHVsZSgpOiB2b2lkIHtcbiAgaWYgKHN1YnNjcmlwdGlvbnMpIHtcbiAgICBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICBzdWJzY3JpcHRpb25zID0gbnVsbDtcbiAgfVxuICBpZiAocHJvY2Vzc091dHB1dFN0b3Jlcykge1xuICAgIGZvciAoY29uc3QgcHJvY2Vzc1N0b3JlIG9mIHByb2Nlc3NPdXRwdXRTdG9yZXMpIHtcbiAgICAgIHByb2Nlc3NTdG9yZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHByb2Nlc3NPdXRwdXRTdG9yZXMgPSBudWxsO1xuICB9XG59XG5cbi8qKlxuICogXCJSZWZlcmVuY2UgQ291bnRpbmdcIlxuICovXG5cbmxldCByZWZlcmVuY2VzOiBudW1iZXIgPSAwO1xuZnVuY3Rpb24gaW5jcmVtZW50UmVmZXJlbmNlcygpIHtcbiAgaWYgKHJlZmVyZW5jZXMgPT09IDApIHtcbiAgICBhY3RpdmF0ZU1vZHVsZSgpO1xuICB9XG4gIHJlZmVyZW5jZXMrKztcbn1cblxuZnVuY3Rpb24gZGVjcmVtZW50UmVmZXJlbmNlcygpIHtcbiAgcmVmZXJlbmNlcy0tO1xuICBpZiAocmVmZXJlbmNlcyA8IDApIHtcbiAgICByZWZlcmVuY2VzID0gMDtcbiAgICBnZXRMb2dnZXIuZXJyb3IoJ2dldFJ1bkNvbW1hbmRJbk5ld1BhbmU6IG51bWJlciBvZiBkZWNyZW1lbnRSZWZlcmVuY2VzKCkgJyArXG4gICAgICAnY2FsbHMgaGFzIGV4Y2VlZGVkIHRoZSBudW1iZXIgb2YgaW5jcmVtZW50UmVmZXJlbmNlcygpIGNhbGxzLicpO1xuICB9XG4gIGlmIChyZWZlcmVuY2VzID09PSAwKSB7XG4gICAgZGlzcG9zZU1vZHVsZSgpO1xuICB9XG59XG5cbi8qKlxuICogQHJldHVybiBhIFJ1bkNvbW1hbmRGdW5jdGlvbkFuZENsZWFudXAsIHdoaWNoIGhhcyB0aGUgZmllbGRzOlxuICogICAtIHJ1bkNvbW1hbmRJbk5ld1BhbmU6IFRoZSBmdW5jdGlvbiB3aGljaCBjYW4gYmUgdXNlZCB0byBjcmVhdGUgYSBuZXcgcGFuZVxuICogICAgICAgd2l0aCB0aGUgb3V0cHV0IG9mIGEgcHJvY2Vzcy5cbiAqICAgLSBkaXNwb3NhYmxlOiBBIERpc3Bvc2FibGUgd2hpY2ggc2hvdWxkIGJlIGRpc3Bvc2VkIHdoZW4gdGhpcyBmdW5jdGlvbiBpc1xuICogICAgICAgbm8gbG9uZ2VyIG5lZWRlZCBieSB0aGUgY2FsbGVyLlxuICovXG5mdW5jdGlvbiBnZXRSdW5Db21tYW5kSW5OZXdQYW5lKCk6IFJ1bkNvbW1hbmRGdW5jdGlvbkFuZENsZWFudXAge1xuICBpbmNyZW1lbnRSZWZlcmVuY2VzKCk7XG4gIHJldHVybiB7XG4gICAgcnVuQ29tbWFuZEluTmV3UGFuZSxcbiAgICBkaXNwb3NhYmxlOiBuZXcgRGlzcG9zYWJsZSgoKSA9PiBkZWNyZW1lbnRSZWZlcmVuY2VzKCkpLFxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFJ1bkNvbW1hbmRJbk5ld1BhbmU7XG4iXX0=