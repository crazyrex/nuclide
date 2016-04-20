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

exports.activate = activate;
exports.createAutocompleteProvider = createAutocompleteProvider;
exports.getHyperclickProvider = getHyperclickProvider;
exports.provideBusySignal = provideBusySignal;
exports.provideDiagnostics = provideDiagnostics;
exports.provideOutlines = provideOutlines;
exports.createTypeHintProvider = createTypeHintProvider;
exports.createEvaluationExpressionProvider = createEvaluationExpressionProvider;
exports.deactivate = deactivate;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _atom = require('atom');

var _nuclideFeatureConfig = require('../../nuclide-feature-config');

var _nuclideFeatureConfig2 = _interopRequireDefault(_nuclideFeatureConfig);

var _nuclideClient = require('../../nuclide-client');

var _nuclideAnalytics = require('../../nuclide-analytics');

var _constants = require('./constants');

var GRAMMARS_STRING = _constants.JS_GRAMMARS.join(', ');
var diagnosticsOnFlySetting = 'nuclide-flow.diagnosticsOnFly';

var PACKAGE_NAME = 'nuclide-flow';

var busySignalProvider = undefined;

var flowDiagnosticsProvider = undefined;

var disposables = undefined;

function activate() {
  if (!disposables) {
    disposables = new _atom.CompositeDisposable();

    var _require = require('./FlowServiceWatcher');

    var FlowServiceWatcher = _require.FlowServiceWatcher;

    var watcher = new FlowServiceWatcher();
    disposables.add(watcher);

    disposables.add(atom.commands.add(atom.views.getView(atom.workspace), 'nuclide-flow:restart-flow-server', allowFlowServerRestart));

    var _require2 = require('../../nuclide-atom-helpers');

    var registerGrammarForFileExtension = _require2.registerGrammarForFileExtension;

    registerGrammarForFileExtension('source.ini', '.flowconfig');
  }
}

/** Provider for autocomplete service. */

function createAutocompleteProvider() {
  var AutocompleteProvider = require('./FlowAutocompleteProvider');
  var autocompleteProvider = new AutocompleteProvider();
  var getSuggestions = autocompleteProvider.getSuggestions.bind(autocompleteProvider);

  var excludeLowerPriority = Boolean(_nuclideFeatureConfig2['default'].get('nuclide-flow.excludeOtherAutocomplete'));

  return {
    selector: _constants.JS_GRAMMARS.map(function (grammar) {
      return '.' + grammar;
    }).join(', '),
    disableForSelector: '.source.js .comment',
    inclusionPriority: 1,
    // We want to get ranked higher than the snippets provider.
    suggestionPriority: 5,
    onDidInsertSuggestion: function onDidInsertSuggestion() {
      (0, _nuclideAnalytics.track)('nuclide-flow.autocomplete-chosen');
    },
    excludeLowerPriority: excludeLowerPriority,
    getSuggestions: getSuggestions
  };
}

function getHyperclickProvider() {
  var FlowHyperclickProvider = require('./FlowHyperclickProvider');
  var flowHyperclickProvider = new FlowHyperclickProvider();
  var getSuggestionForWord = flowHyperclickProvider.getSuggestionForWord.bind(flowHyperclickProvider);
  return {
    wordRegExp: _constants.JAVASCRIPT_WORD_REGEX,
    priority: 20,
    providerName: PACKAGE_NAME,
    getSuggestionForWord: getSuggestionForWord
  };
}

function provideBusySignal() {
  if (!busySignalProvider) {
    var _require3 = require('../../nuclide-busy-signal');

    var DedupedBusySignalProviderBase = _require3.DedupedBusySignalProviderBase;

    busySignalProvider = new DedupedBusySignalProviderBase();
  }
  return busySignalProvider;
}

function provideDiagnostics() {
  if (!flowDiagnosticsProvider) {
    var busyProvider = this.provideBusySignal();
    var FlowDiagnosticsProvider = require('./FlowDiagnosticsProvider');
    var runOnTheFly = _nuclideFeatureConfig2['default'].get(diagnosticsOnFlySetting);
    flowDiagnosticsProvider = new FlowDiagnosticsProvider(runOnTheFly, busyProvider);
    (0, _assert2['default'])(disposables);
    disposables.add(_nuclideFeatureConfig2['default'].observe(diagnosticsOnFlySetting, function (newValue) {
      (0, _assert2['default'])(flowDiagnosticsProvider);
      flowDiagnosticsProvider.setRunOnTheFly(newValue);
    }));

    var _require4 = require('../../nuclide-atom-helpers');

    var projects = _require4.projects;

    disposables.add(projects.onDidRemoveProjectPath(function (projectPath) {
      (0, _assert2['default'])(flowDiagnosticsProvider);
      flowDiagnosticsProvider.invalidateProjectPath(projectPath);
    }));
  }
  return flowDiagnosticsProvider;
}

function provideOutlines() {
  var _require5 = require('./FlowOutlineProvider');

  var FlowOutlineProvider = _require5.FlowOutlineProvider;

  var provider = new FlowOutlineProvider();
  return {
    grammarScopes: _constants.JS_GRAMMARS,
    priority: 1,
    name: 'Flow',
    getOutline: provider.getOutline.bind(provider)
  };
}

function createTypeHintProvider() {
  var _require6 = require('./FlowTypeHintProvider');

  var FlowTypeHintProvider = _require6.FlowTypeHintProvider;

  var flowTypeHintProvider = new FlowTypeHintProvider();
  var typeHint = flowTypeHintProvider.typeHint.bind(flowTypeHintProvider);
  return {
    selector: GRAMMARS_STRING,
    providerName: PACKAGE_NAME,
    inclusionPriority: 1,
    typeHint: typeHint
  };
}

function createEvaluationExpressionProvider() {
  var _require7 = require('./FlowEvaluationExpressionProvider');

  var FlowEvaluationExpressionProvider = _require7.FlowEvaluationExpressionProvider;

  var evaluationExpressionProvider = new FlowEvaluationExpressionProvider();
  var getEvaluationExpression = evaluationExpressionProvider.getEvaluationExpression.bind(evaluationExpressionProvider);
  return {
    selector: GRAMMARS_STRING,
    name: PACKAGE_NAME,
    getEvaluationExpression: getEvaluationExpression
  };
}

function deactivate() {
  // TODO(mbolin): Find a way to unregister the autocomplete provider from
  // ServiceHub, or set a boolean in the autocomplete provider to always return
  // empty results.
  var service = (0, _nuclideClient.getServiceByNuclideUri)('FlowService');
  (0, _assert2['default'])(service);
  service.dispose();
  if (disposables) {
    disposables.dispose();
    disposables = null;
  }
  if (flowDiagnosticsProvider) {
    flowDiagnosticsProvider.dispose();
    flowDiagnosticsProvider = null;
  }
}

function allowFlowServerRestart() {
  var _require8 = require('./FlowServiceFactory');

  var getCurrentServiceInstances = _require8.getCurrentServiceInstances;

  for (var service of getCurrentServiceInstances()) {
    service.allowServerRestart();
  }
}
//# sourceMappingURL=data:application/json;base64,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QUksV0FBVyxFQUFFO0FBQ2YsZUFBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3RCLGVBQVcsR0FBRyxJQUFJLENBQUM7R0FDcEI7QUFDRCxNQUFJLHVCQUF1QixFQUFFO0FBQzNCLDJCQUF1QixDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2xDLDJCQUF1QixHQUFHLElBQUksQ0FBQztHQUNoQztDQUNGOztBQUVELFNBQVMsc0JBQXNCLEdBQVM7a0JBQ0QsT0FBTyxDQUFDLHNCQUFzQixDQUFDOztNQUE3RCwwQkFBMEIsYUFBMUIsMEJBQTBCOztBQUNqQyxPQUFLLElBQU0sT0FBTyxJQUFJLDBCQUEwQixFQUFFLEVBQUU7QUFDbEQsV0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7R0FDOUI7Q0FDRiIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge0h5cGVyY2xpY2tQcm92aWRlcn0gZnJvbSAnLi4vLi4vaHlwZXJjbGljayc7XG5pbXBvcnQgdHlwZSB7XG4gIEJ1c3lTaWduYWxQcm92aWRlckJhc2UgYXMgQnVzeVNpZ25hbFByb3ZpZGVyQmFzZVR5cGUsXG59IGZyb20gJy4uLy4uL251Y2xpZGUtYnVzeS1zaWduYWwnO1xuaW1wb3J0IHR5cGUge091dGxpbmVQcm92aWRlcn0gZnJvbSAnLi4vLi4vbnVjbGlkZS1vdXRsaW5lLXZpZXcnO1xuaW1wb3J0IHR5cGUge051Y2xpZGVFdmFsdWF0aW9uRXhwcmVzc2lvblByb3ZpZGVyfSBmcm9tICcuLi8uLi9udWNsaWRlLWRlYnVnZ2VyLWludGVyZmFjZXMvc2VydmljZSc7XG5cbmltcG9ydCBpbnZhcmlhbnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAnYXRvbSc7XG5cbmltcG9ydCBmZWF0dXJlQ29uZmlnIGZyb20gJy4uLy4uL251Y2xpZGUtZmVhdHVyZS1jb25maWcnO1xuaW1wb3J0IHtnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpfSBmcm9tICcuLi8uLi9udWNsaWRlLWNsaWVudCc7XG5pbXBvcnQge3RyYWNrfSBmcm9tICcuLi8uLi9udWNsaWRlLWFuYWx5dGljcyc7XG5cbmltcG9ydCB7SlNfR1JBTU1BUlMsIEpBVkFTQ1JJUFRfV09SRF9SRUdFWH0gZnJvbSAnLi9jb25zdGFudHMnO1xuY29uc3QgR1JBTU1BUlNfU1RSSU5HID0gSlNfR1JBTU1BUlMuam9pbignLCAnKTtcbmNvbnN0IGRpYWdub3N0aWNzT25GbHlTZXR0aW5nID0gJ251Y2xpZGUtZmxvdy5kaWFnbm9zdGljc09uRmx5JztcblxuY29uc3QgUEFDS0FHRV9OQU1FID0gJ251Y2xpZGUtZmxvdyc7XG5cbmxldCBidXN5U2lnbmFsUHJvdmlkZXI7XG5cbmxldCBmbG93RGlhZ25vc3RpY3NQcm92aWRlcjtcblxubGV0IGRpc3Bvc2FibGVzO1xuXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUoKSB7XG4gIGlmICghZGlzcG9zYWJsZXMpIHtcbiAgICBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICBjb25zdCB7Rmxvd1NlcnZpY2VXYXRjaGVyfSA9IHJlcXVpcmUoJy4vRmxvd1NlcnZpY2VXYXRjaGVyJyk7XG4gICAgY29uc3Qgd2F0Y2hlciA9IG5ldyBGbG93U2VydmljZVdhdGNoZXIoKTtcbiAgICBkaXNwb3NhYmxlcy5hZGQod2F0Y2hlcik7XG5cbiAgICBkaXNwb3NhYmxlcy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXG4gICAgICBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLFxuICAgICAgJ251Y2xpZGUtZmxvdzpyZXN0YXJ0LWZsb3ctc2VydmVyJyxcbiAgICAgIGFsbG93Rmxvd1NlcnZlclJlc3RhcnQsXG4gICAgKSk7XG5cbiAgICBjb25zdCB7cmVnaXN0ZXJHcmFtbWFyRm9yRmlsZUV4dGVuc2lvbn0gPSByZXF1aXJlKCcuLi8uLi9udWNsaWRlLWF0b20taGVscGVycycpO1xuICAgIHJlZ2lzdGVyR3JhbW1hckZvckZpbGVFeHRlbnNpb24oJ3NvdXJjZS5pbmknLCAnLmZsb3djb25maWcnKTtcbiAgfVxufVxuXG4vKiogUHJvdmlkZXIgZm9yIGF1dG9jb21wbGV0ZSBzZXJ2aWNlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUF1dG9jb21wbGV0ZVByb3ZpZGVyKCk6IGF0b20kQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xuICBjb25zdCBBdXRvY29tcGxldGVQcm92aWRlciA9IHJlcXVpcmUoJy4vRmxvd0F1dG9jb21wbGV0ZVByb3ZpZGVyJyk7XG4gIGNvbnN0IGF1dG9jb21wbGV0ZVByb3ZpZGVyID0gbmV3IEF1dG9jb21wbGV0ZVByb3ZpZGVyKCk7XG4gIGNvbnN0IGdldFN1Z2dlc3Rpb25zID0gYXV0b2NvbXBsZXRlUHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbnMuYmluZChhdXRvY29tcGxldGVQcm92aWRlcik7XG5cbiAgY29uc3QgZXhjbHVkZUxvd2VyUHJpb3JpdHkgPSBCb29sZWFuKGZlYXR1cmVDb25maWcuZ2V0KCdudWNsaWRlLWZsb3cuZXhjbHVkZU90aGVyQXV0b2NvbXBsZXRlJykpO1xuXG4gIHJldHVybiB7XG4gICAgc2VsZWN0b3I6IEpTX0dSQU1NQVJTLm1hcChncmFtbWFyID0+ICcuJyArIGdyYW1tYXIpLmpvaW4oJywgJyksXG4gICAgZGlzYWJsZUZvclNlbGVjdG9yOiAnLnNvdXJjZS5qcyAuY29tbWVudCcsXG4gICAgaW5jbHVzaW9uUHJpb3JpdHk6IDEsXG4gICAgLy8gV2Ugd2FudCB0byBnZXQgcmFua2VkIGhpZ2hlciB0aGFuIHRoZSBzbmlwcGV0cyBwcm92aWRlci5cbiAgICBzdWdnZXN0aW9uUHJpb3JpdHk6IDUsXG4gICAgb25EaWRJbnNlcnRTdWdnZXN0aW9uOiAoKSA9PiB7XG4gICAgICB0cmFjaygnbnVjbGlkZS1mbG93LmF1dG9jb21wbGV0ZS1jaG9zZW4nKTtcbiAgICB9LFxuICAgIGV4Y2x1ZGVMb3dlclByaW9yaXR5LFxuICAgIGdldFN1Z2dlc3Rpb25zLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SHlwZXJjbGlja1Byb3ZpZGVyKCk6IEh5cGVyY2xpY2tQcm92aWRlciB7XG4gIGNvbnN0IEZsb3dIeXBlcmNsaWNrUHJvdmlkZXIgPSByZXF1aXJlKCcuL0Zsb3dIeXBlcmNsaWNrUHJvdmlkZXInKTtcbiAgY29uc3QgZmxvd0h5cGVyY2xpY2tQcm92aWRlciA9IG5ldyBGbG93SHlwZXJjbGlja1Byb3ZpZGVyKCk7XG4gIGNvbnN0IGdldFN1Z2dlc3Rpb25Gb3JXb3JkID1cbiAgICAgIGZsb3dIeXBlcmNsaWNrUHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbkZvcldvcmQuYmluZChmbG93SHlwZXJjbGlja1Byb3ZpZGVyKTtcbiAgcmV0dXJuIHtcbiAgICB3b3JkUmVnRXhwOiBKQVZBU0NSSVBUX1dPUkRfUkVHRVgsXG4gICAgcHJpb3JpdHk6IDIwLFxuICAgIHByb3ZpZGVyTmFtZTogUEFDS0FHRV9OQU1FLFxuICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUJ1c3lTaWduYWwoKTogQnVzeVNpZ25hbFByb3ZpZGVyQmFzZVR5cGUge1xuICBpZiAoIWJ1c3lTaWduYWxQcm92aWRlcikge1xuICAgIGNvbnN0IHtEZWR1cGVkQnVzeVNpZ25hbFByb3ZpZGVyQmFzZX0gPSByZXF1aXJlKCcuLi8uLi9udWNsaWRlLWJ1c3ktc2lnbmFsJyk7XG4gICAgYnVzeVNpZ25hbFByb3ZpZGVyID0gbmV3IERlZHVwZWRCdXN5U2lnbmFsUHJvdmlkZXJCYXNlKCk7XG4gIH1cbiAgcmV0dXJuIGJ1c3lTaWduYWxQcm92aWRlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVEaWFnbm9zdGljcygpIHtcbiAgaWYgKCFmbG93RGlhZ25vc3RpY3NQcm92aWRlcikge1xuICAgIGNvbnN0IGJ1c3lQcm92aWRlciA9IHRoaXMucHJvdmlkZUJ1c3lTaWduYWwoKTtcbiAgICBjb25zdCBGbG93RGlhZ25vc3RpY3NQcm92aWRlciA9IHJlcXVpcmUoJy4vRmxvd0RpYWdub3N0aWNzUHJvdmlkZXInKTtcbiAgICBjb25zdCBydW5PblRoZUZseSA9ICgoZmVhdHVyZUNvbmZpZy5nZXQoZGlhZ25vc3RpY3NPbkZseVNldHRpbmcpOiBhbnkpOiBib29sZWFuKTtcbiAgICBmbG93RGlhZ25vc3RpY3NQcm92aWRlciA9IG5ldyBGbG93RGlhZ25vc3RpY3NQcm92aWRlcihydW5PblRoZUZseSwgYnVzeVByb3ZpZGVyKTtcbiAgICBpbnZhcmlhbnQoZGlzcG9zYWJsZXMpO1xuICAgIGRpc3Bvc2FibGVzLmFkZChmZWF0dXJlQ29uZmlnLm9ic2VydmUoZGlhZ25vc3RpY3NPbkZseVNldHRpbmcsIG5ld1ZhbHVlID0+IHtcbiAgICAgIGludmFyaWFudChmbG93RGlhZ25vc3RpY3NQcm92aWRlcik7XG4gICAgICBmbG93RGlhZ25vc3RpY3NQcm92aWRlci5zZXRSdW5PblRoZUZseShuZXdWYWx1ZSk7XG4gICAgfSkpO1xuICAgIGNvbnN0IHtwcm9qZWN0c30gPSByZXF1aXJlKCcuLi8uLi9udWNsaWRlLWF0b20taGVscGVycycpO1xuICAgIGRpc3Bvc2FibGVzLmFkZChwcm9qZWN0cy5vbkRpZFJlbW92ZVByb2plY3RQYXRoKHByb2plY3RQYXRoID0+IHtcbiAgICAgIGludmFyaWFudChmbG93RGlhZ25vc3RpY3NQcm92aWRlcik7XG4gICAgICBmbG93RGlhZ25vc3RpY3NQcm92aWRlci5pbnZhbGlkYXRlUHJvamVjdFBhdGgocHJvamVjdFBhdGgpO1xuICAgIH0pKTtcbiAgfVxuICByZXR1cm4gZmxvd0RpYWdub3N0aWNzUHJvdmlkZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlT3V0bGluZXMoKTogT3V0bGluZVByb3ZpZGVyIHtcbiAgY29uc3Qge0Zsb3dPdXRsaW5lUHJvdmlkZXJ9ID0gcmVxdWlyZSgnLi9GbG93T3V0bGluZVByb3ZpZGVyJyk7XG4gIGNvbnN0IHByb3ZpZGVyID0gbmV3IEZsb3dPdXRsaW5lUHJvdmlkZXIoKTtcbiAgcmV0dXJuIHtcbiAgICBncmFtbWFyU2NvcGVzOiBKU19HUkFNTUFSUyxcbiAgICBwcmlvcml0eTogMSxcbiAgICBuYW1lOiAnRmxvdycsXG4gICAgZ2V0T3V0bGluZTogcHJvdmlkZXIuZ2V0T3V0bGluZS5iaW5kKHByb3ZpZGVyKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVR5cGVIaW50UHJvdmlkZXIoKTogT2JqZWN0IHtcbiAgY29uc3Qge0Zsb3dUeXBlSGludFByb3ZpZGVyfSA9IHJlcXVpcmUoJy4vRmxvd1R5cGVIaW50UHJvdmlkZXInKTtcbiAgY29uc3QgZmxvd1R5cGVIaW50UHJvdmlkZXIgPSBuZXcgRmxvd1R5cGVIaW50UHJvdmlkZXIoKTtcbiAgY29uc3QgdHlwZUhpbnQgPSBmbG93VHlwZUhpbnRQcm92aWRlci50eXBlSGludC5iaW5kKGZsb3dUeXBlSGludFByb3ZpZGVyKTtcbiAgcmV0dXJuIHtcbiAgICBzZWxlY3RvcjogR1JBTU1BUlNfU1RSSU5HLFxuICAgIHByb3ZpZGVyTmFtZTogUEFDS0FHRV9OQU1FLFxuICAgIGluY2x1c2lvblByaW9yaXR5OiAxLFxuICAgIHR5cGVIaW50LFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXZhbHVhdGlvbkV4cHJlc3Npb25Qcm92aWRlcigpOiBOdWNsaWRlRXZhbHVhdGlvbkV4cHJlc3Npb25Qcm92aWRlciB7XG4gIGNvbnN0IHtGbG93RXZhbHVhdGlvbkV4cHJlc3Npb25Qcm92aWRlcn0gPSByZXF1aXJlKCcuL0Zsb3dFdmFsdWF0aW9uRXhwcmVzc2lvblByb3ZpZGVyJyk7XG4gIGNvbnN0IGV2YWx1YXRpb25FeHByZXNzaW9uUHJvdmlkZXIgPSBuZXcgRmxvd0V2YWx1YXRpb25FeHByZXNzaW9uUHJvdmlkZXIoKTtcbiAgY29uc3QgZ2V0RXZhbHVhdGlvbkV4cHJlc3Npb24gPVxuICAgIGV2YWx1YXRpb25FeHByZXNzaW9uUHJvdmlkZXIuZ2V0RXZhbHVhdGlvbkV4cHJlc3Npb24uYmluZChldmFsdWF0aW9uRXhwcmVzc2lvblByb3ZpZGVyKTtcbiAgcmV0dXJuIHtcbiAgICBzZWxlY3RvcjogR1JBTU1BUlNfU1RSSU5HLFxuICAgIG5hbWU6IFBBQ0tBR0VfTkFNRSxcbiAgICBnZXRFdmFsdWF0aW9uRXhwcmVzc2lvbixcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7XG4gIC8vIFRPRE8obWJvbGluKTogRmluZCBhIHdheSB0byB1bnJlZ2lzdGVyIHRoZSBhdXRvY29tcGxldGUgcHJvdmlkZXIgZnJvbVxuICAvLyBTZXJ2aWNlSHViLCBvciBzZXQgYSBib29sZWFuIGluIHRoZSBhdXRvY29tcGxldGUgcHJvdmlkZXIgdG8gYWx3YXlzIHJldHVyblxuICAvLyBlbXB0eSByZXN1bHRzLlxuICBjb25zdCBzZXJ2aWNlID0gZ2V0U2VydmljZUJ5TnVjbGlkZVVyaSgnRmxvd1NlcnZpY2UnKTtcbiAgaW52YXJpYW50KHNlcnZpY2UpO1xuICBzZXJ2aWNlLmRpc3Bvc2UoKTtcbiAgaWYgKGRpc3Bvc2FibGVzKSB7XG4gICAgZGlzcG9zYWJsZXMuZGlzcG9zZSgpO1xuICAgIGRpc3Bvc2FibGVzID0gbnVsbDtcbiAgfVxuICBpZiAoZmxvd0RpYWdub3N0aWNzUHJvdmlkZXIpIHtcbiAgICBmbG93RGlhZ25vc3RpY3NQcm92aWRlci5kaXNwb3NlKCk7XG4gICAgZmxvd0RpYWdub3N0aWNzUHJvdmlkZXIgPSBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG93Rmxvd1NlcnZlclJlc3RhcnQoKTogdm9pZCB7XG4gIGNvbnN0IHtnZXRDdXJyZW50U2VydmljZUluc3RhbmNlc30gPSByZXF1aXJlKCcuL0Zsb3dTZXJ2aWNlRmFjdG9yeScpO1xuICBmb3IgKGNvbnN0IHNlcnZpY2Ugb2YgZ2V0Q3VycmVudFNlcnZpY2VJbnN0YW5jZXMoKSkge1xuICAgIHNlcnZpY2UuYWxsb3dTZXJ2ZXJSZXN0YXJ0KCk7XG4gIH1cbn1cbiJdfQ==