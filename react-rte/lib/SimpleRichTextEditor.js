import _extends from 'babel-runtime/helpers/extends';
import _objectWithoutProperties from 'babel-runtime/helpers/objectWithoutProperties';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import React, { Component } from 'react';
import RichTextEditor, { createEmptyValue } from './RichTextEditor';
import autobind from 'class-autobind';

var SimpleRichTextEditor = function (_Component) {
  _inherits(SimpleRichTextEditor, _Component);

  function SimpleRichTextEditor() {
    _classCallCheck(this, SimpleRichTextEditor);

    var _this = _possibleConstructorReturn(this, (SimpleRichTextEditor.__proto__ || _Object$getPrototypeOf(SimpleRichTextEditor)).apply(this, arguments));

    autobind(_this);
    _this.state = {
      editorValue: createEmptyValue()
    };
    return _this;
  }
  // The [format, value] of what's currently displayed in the <RichTextEditor />


  _createClass(SimpleRichTextEditor, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this._updateStateFromProps(this.props);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(newProps) {
      this._updateStateFromProps(newProps);
    }
  }, {
    key: '_updateStateFromProps',
    value: function _updateStateFromProps(newProps) {
      var value = newProps.value,
          format = newProps.format;

      if (this._currentValue != null) {
        var _currentValue = _slicedToArray(this._currentValue, 2),
            currentFormat = _currentValue[0],
            currentValue = _currentValue[1];

        if (format === currentFormat && value === currentValue) {
          return;
        }
      }
      var editorValue = this.state.editorValue;

      this.setState({
        editorValue: editorValue.setContentFromString(value, format)
      });
      this._currentValue = [format, value];
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          value = _props.value,
          format = _props.format,
          onChange = _props.onChange,
          otherProps = _objectWithoutProperties(_props, ['value', 'format', 'onChange']); // eslint-disable-line no-unused-vars


      return React.createElement(RichTextEditor, _extends({}, otherProps, {
        value: this.state.editorValue,
        onChange: this._onChange
      }));
    }
  }, {
    key: '_onChange',
    value: function _onChange(editorValue) {
      var _props2 = this.props,
          format = _props2.format,
          onChange = _props2.onChange;

      var oldEditorValue = this.state.editorValue;
      this.setState({ editorValue: editorValue });
      var oldContentState = oldEditorValue ? oldEditorValue.getEditorState().getCurrentContent() : null;
      var newContentState = editorValue.getEditorState().getCurrentContent();
      if (oldContentState !== newContentState) {
        var stringValue = editorValue.toString(format);
        // Optimization so if we receive new props we don't need
        // to parse anything unnecessarily.
        this._currentValue = [format, stringValue];
        if (onChange && stringValue !== this.props.value) {
          onChange(stringValue);
        }
      }
    }
  }]);

  return SimpleRichTextEditor;
}(Component);

export default SimpleRichTextEditor;