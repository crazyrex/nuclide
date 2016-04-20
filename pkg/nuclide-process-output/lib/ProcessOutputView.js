var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;
var TextBuffer = _require.TextBuffer;

var _require2 = require('../../nuclide-ui/lib/AtomTextEditor');

var AtomTextEditor = _require2.AtomTextEditor;

var _require3 = require('react-for-atom');

var React = _require3.React;
var ReactDOM = _require3.ReactDOM;

var PROCESS_OUTPUT_PATH = 'nuclide-process-output.ansi';

var ProcessOutputView = (function (_React$Component) {
  _inherits(ProcessOutputView, _React$Component);

  /**
   * @param props.processOutputStore The ProcessOutputStore that provides the
   *   output to display in this view.
   * @param props.processOutputHandler (optional) A function that acts on the
   *   output of the process. If not provided, the default action is to simply
   *   append the output of the process to the view.
   */

  function ProcessOutputView(props) {
    _classCallCheck(this, ProcessOutputView);

    _get(Object.getPrototypeOf(ProcessOutputView.prototype), 'constructor', this).call(this, props);
    this._processOutputStore = props.processOutputStore;
    this._outputHandler = props.processOutputHandler;
    this._textBuffer = props.textBuffer;
    this._disposables = new CompositeDisposable();
  }

  _createClass(ProcessOutputView, [{
    key: 'getTitle',
    value: function getTitle() {
      return this.props.title;
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this._disposables.add(this._textBuffer.onDidChange(this._handleBufferChange.bind(this)));
    }
  }, {
    key: '_handleBufferChange',
    value: function _handleBufferChange() {
      var el = ReactDOM.findDOMNode(this);
      // TODO(natthu): Consider scrolling conditionally i.e. don't scroll if user has scrolled up the
      //               output pane.
      el.scrollTop = el.scrollHeight;
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this._disposables.dispose();
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        { className: 'nuclide-process-output-view' },
        this.props.processOutputViewTopElement,
        React.createElement(AtomTextEditor, {
          ref: 'process-output-editor',
          textBuffer: this._textBuffer,
          gutterHidden: true,
          readOnly: true,
          path: PROCESS_OUTPUT_PATH
        })
      );
    }
  }, {
    key: 'copy',
    value: function copy() {
      return ProcessOutputView.createView(_extends({}, this.props));
    }
  }], [{
    key: 'createView',
    value: function createView(props) {
      var container = document.createElement('div');
      var component = ReactDOM.render(React.createElement(ProcessOutputView, props), container);
      component.element = container;
      return component;
    }
  }]);

  return ProcessOutputView;
})(React.Component);

module.exports = ProcessOutputView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlByb2Nlc3NPdXRwdXRWaWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQWMwQyxPQUFPLENBQUMsTUFBTSxDQUFDOztJQUFsRCxtQkFBbUIsWUFBbkIsbUJBQW1CO0lBQUUsVUFBVSxZQUFWLFVBQVU7O2dCQUNiLE9BQU8sQ0FBQyxxQ0FBcUMsQ0FBQzs7SUFBaEUsY0FBYyxhQUFkLGNBQWM7O2dCQUlqQixPQUFPLENBQUMsZ0JBQWdCLENBQUM7O0lBRjNCLEtBQUssYUFBTCxLQUFLO0lBQ0wsUUFBUSxhQUFSLFFBQVE7O0FBR1YsSUFBTSxtQkFBbUIsR0FBRyw2QkFBNkIsQ0FBQzs7SUFVcEQsaUJBQWlCO1lBQWpCLGlCQUFpQjs7Ozs7Ozs7OztBQWVWLFdBZlAsaUJBQWlCLENBZVQsS0FBWSxFQUFFOzBCQWZ0QixpQkFBaUI7O0FBZ0JuQiwrQkFoQkUsaUJBQWlCLDZDQWdCYixLQUFLLEVBQUU7QUFDYixRQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQ3BELFFBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDO0FBQ2pELFFBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztBQUNwQyxRQUFJLENBQUMsWUFBWSxHQUFHLElBQUksbUJBQW1CLEVBQUUsQ0FBQztHQUMvQzs7ZUFyQkcsaUJBQWlCOztXQXVCYixvQkFBVztBQUNqQixhQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO0tBQ3pCOzs7V0FFZ0IsNkJBQUc7QUFDbEIsVUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQ25CLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FDbEUsQ0FBQztLQUNIOzs7V0FFa0IsK0JBQVM7QUFDMUIsVUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7O0FBR3RDLFFBQUUsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQztLQUNoQzs7O1dBRW1CLGdDQUFHO0FBQ3JCLFVBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDN0I7OztXQUVLLGtCQUFrQjtBQUN0QixhQUNFOztVQUFLLFNBQVMsRUFBQyw2QkFBNkI7UUFDekMsSUFBSSxDQUFDLEtBQUssQ0FBQywyQkFBMkI7UUFDdkMsb0JBQUMsY0FBYztBQUNiLGFBQUcsRUFBQyx1QkFBdUI7QUFDM0Isb0JBQVUsRUFBRSxJQUFJLENBQUMsV0FBVyxBQUFDO0FBQzdCLHNCQUFZLEVBQUUsSUFBSSxBQUFDO0FBQ25CLGtCQUFRLEVBQUUsSUFBSSxBQUFDO0FBQ2YsY0FBSSxFQUFFLG1CQUFtQixBQUFDO1VBQzFCO09BQ0UsQ0FDTjtLQUNIOzs7V0FFRyxnQkFBVztBQUNiLGFBQU8saUJBQWlCLENBQUMsVUFBVSxjQUFLLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztLQUN0RDs7O1dBRWdCLG9CQUFDLEtBQWMsRUFBVTtBQUN4QyxVQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hELFVBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQy9CLG9CQUFDLGlCQUFpQixFQUFLLEtBQUssQ0FBSSxFQUNoQyxTQUFTLENBQ1YsQ0FBQztBQUNGLGVBQVMsQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDO0FBQzlCLGFBQU8sU0FBUyxDQUFDO0tBQ2xCOzs7U0F2RUcsaUJBQWlCO0dBQVMsS0FBSyxDQUFDLFNBQVM7O0FBMkUvQyxNQUFNLENBQUMsT0FBTyxHQUFHLGlCQUFpQixDQUFDIiwiZmlsZSI6IlByb2Nlc3NPdXRwdXRWaWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge1Byb2Nlc3NPdXRwdXRTdG9yZX0gZnJvbSAnLi4vLi4vbnVjbGlkZS1wcm9jZXNzLW91dHB1dC1zdG9yZSc7XG5pbXBvcnQgdHlwZSB7UHJvY2Vzc091dHB1dEhhbmRsZXJ9IGZyb20gJy4vdHlwZXMnO1xuXG5jb25zdCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgVGV4dEJ1ZmZlcn0gPSByZXF1aXJlKCdhdG9tJyk7XG5jb25zdCB7QXRvbVRleHRFZGl0b3J9ID0gcmVxdWlyZSgnLi4vLi4vbnVjbGlkZS11aS9saWIvQXRvbVRleHRFZGl0b3InKTtcbmNvbnN0IHtcbiAgUmVhY3QsXG4gIFJlYWN0RE9NLFxufSA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG5cbmNvbnN0IFBST0NFU1NfT1VUUFVUX1BBVEggPSAnbnVjbGlkZS1wcm9jZXNzLW91dHB1dC5hbnNpJztcblxudHlwZSBQcm9wcyA9IHtcbiAgdGl0bGU6IHN0cmluZztcbiAgcHJvY2Vzc091dHB1dFN0b3JlOiBQcm9jZXNzT3V0cHV0U3RvcmU7XG4gIHByb2Nlc3NPdXRwdXRIYW5kbGVyOiA/UHJvY2Vzc091dHB1dEhhbmRsZXI7XG4gIHByb2Nlc3NPdXRwdXRWaWV3VG9wRWxlbWVudDogP0hUTUxFbGVtZW50O1xuICB0ZXh0QnVmZmVyOiBUZXh0QnVmZmVyO1xufTtcblxuY2xhc3MgUHJvY2Vzc091dHB1dFZpZXcgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8dm9pZCwgUHJvcHMsIHZvaWQ+IHtcbiAgcHJvcHM6IFByb3BzO1xuXG4gIF9wcm9jZXNzT3V0cHV0U3RvcmU6IFByb2Nlc3NPdXRwdXRTdG9yZTtcbiAgX3RleHRCdWZmZXI6IGF0b20kVGV4dEJ1ZmZlcjtcbiAgX2Rpc3Bvc2FibGVzOiBhdG9tJENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gIF9vdXRwdXRIYW5kbGVyOiA/UHJvY2Vzc091dHB1dEhhbmRsZXI7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBwcm9wcy5wcm9jZXNzT3V0cHV0U3RvcmUgVGhlIFByb2Nlc3NPdXRwdXRTdG9yZSB0aGF0IHByb3ZpZGVzIHRoZVxuICAgKiAgIG91dHB1dCB0byBkaXNwbGF5IGluIHRoaXMgdmlldy5cbiAgICogQHBhcmFtIHByb3BzLnByb2Nlc3NPdXRwdXRIYW5kbGVyIChvcHRpb25hbCkgQSBmdW5jdGlvbiB0aGF0IGFjdHMgb24gdGhlXG4gICAqICAgb3V0cHV0IG9mIHRoZSBwcm9jZXNzLiBJZiBub3QgcHJvdmlkZWQsIHRoZSBkZWZhdWx0IGFjdGlvbiBpcyB0byBzaW1wbHlcbiAgICogICBhcHBlbmQgdGhlIG91dHB1dCBvZiB0aGUgcHJvY2VzcyB0byB0aGUgdmlldy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBQcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICB0aGlzLl9wcm9jZXNzT3V0cHV0U3RvcmUgPSBwcm9wcy5wcm9jZXNzT3V0cHV0U3RvcmU7XG4gICAgdGhpcy5fb3V0cHV0SGFuZGxlciA9IHByb3BzLnByb2Nlc3NPdXRwdXRIYW5kbGVyO1xuICAgIHRoaXMuX3RleHRCdWZmZXIgPSBwcm9wcy50ZXh0QnVmZmVyO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgfVxuXG4gIGdldFRpdGxlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMudGl0bGU7XG4gIH1cblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICB0aGlzLl9kaXNwb3NhYmxlcy5hZGQoXG4gICAgICB0aGlzLl90ZXh0QnVmZmVyLm9uRGlkQ2hhbmdlKHRoaXMuX2hhbmRsZUJ1ZmZlckNoYW5nZS5iaW5kKHRoaXMpKSxcbiAgICApO1xuICB9XG5cbiAgX2hhbmRsZUJ1ZmZlckNoYW5nZSgpOiB2b2lkIHtcbiAgICBjb25zdCBlbCA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKHRoaXMpO1xuICAgIC8vIFRPRE8obmF0dGh1KTogQ29uc2lkZXIgc2Nyb2xsaW5nIGNvbmRpdGlvbmFsbHkgaS5lLiBkb24ndCBzY3JvbGwgaWYgdXNlciBoYXMgc2Nyb2xsZWQgdXAgdGhlXG4gICAgLy8gICAgICAgICAgICAgICBvdXRwdXQgcGFuZS5cbiAgICBlbC5zY3JvbGxUb3AgPSBlbC5zY3JvbGxIZWlnaHQ7XG4gIH1cblxuICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICB0aGlzLl9kaXNwb3NhYmxlcy5kaXNwb3NlKCk7XG4gIH1cblxuICByZW5kZXIoKTogUmVhY3QuRWxlbWVudCB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwibnVjbGlkZS1wcm9jZXNzLW91dHB1dC12aWV3XCI+XG4gICAgICAgIHt0aGlzLnByb3BzLnByb2Nlc3NPdXRwdXRWaWV3VG9wRWxlbWVudH1cbiAgICAgICAgPEF0b21UZXh0RWRpdG9yXG4gICAgICAgICAgcmVmPVwicHJvY2Vzcy1vdXRwdXQtZWRpdG9yXCJcbiAgICAgICAgICB0ZXh0QnVmZmVyPXt0aGlzLl90ZXh0QnVmZmVyfVxuICAgICAgICAgIGd1dHRlckhpZGRlbj17dHJ1ZX1cbiAgICAgICAgICByZWFkT25seT17dHJ1ZX1cbiAgICAgICAgICBwYXRoPXtQUk9DRVNTX09VVFBVVF9QQVRIfVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIGNvcHkoKTogT2JqZWN0IHtcbiAgICByZXR1cm4gUHJvY2Vzc091dHB1dFZpZXcuY3JlYXRlVmlldyh7Li4udGhpcy5wcm9wc30pO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZVZpZXcocHJvcHM6ID9PYmplY3QpOiBPYmplY3Qge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IFJlYWN0RE9NLnJlbmRlcihcbiAgICAgIDxQcm9jZXNzT3V0cHV0VmlldyB7Li4ucHJvcHN9IC8+LFxuICAgICAgY29udGFpbmVyLFxuICAgICk7XG4gICAgY29tcG9uZW50LmVsZW1lbnQgPSBjb250YWluZXI7XG4gICAgcmV0dXJuIGNvbXBvbmVudDtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvY2Vzc091dHB1dFZpZXc7XG4iXX0=