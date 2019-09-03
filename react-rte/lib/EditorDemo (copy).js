import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import React, { Component } from 'react';
import RichTextEditor, { createEmptyValue } from './RichTextEditor';
import { convertToRaw } from 'draft-js';
import autobind from 'class-autobind';

import ButtonGroup from './ui/ButtonGroup';
import Dropdown from './ui/Dropdown';
import IconButton from './ui/IconButton';

var EditorDemo = function (_Component) {
  _inherits(EditorDemo, _Component);

  function EditorDemo() {
    _classCallCheck(this, EditorDemo);

    var _this = _possibleConstructorReturn(this, (EditorDemo.__proto__ || _Object$getPrototypeOf(EditorDemo)).apply(this, arguments));

    autobind(_this);
    _this.state = {
      value: createEmptyValue(),
      format: 'html',
      readOnly: false
    };
    return _this;
  }

  _createClass(EditorDemo, [{
    key: 'render',
    value: function render() {
      var _state = this.state,
          value = _state.value,
          format = _state.format;


      return React.createElement(
        'div',
        { className: 'editor-demo' },
        React.createElement(
          'div',
          { className: 'row' },
          React.createElement(
            'p',
            null,
            'This is a demo of the ',
            React.createElement(
              'a',
              { href: 'https://github.com/sstur/react-rte', target: 'top' },
              'react-rte'
            ),
            ' editor.'
          )
        ),
        React.createElement(
          'div',
          { className: 'row' },
          React.createElement(RichTextEditor, {
            value: value,
            onChange: this._onChange,
            className: 'react-rte-demo',
            placeholder: 'Tell a story',
            toolbarClassName: 'demo-toolbar',
            editorClassName: 'demo-editor',
            readOnly: this.state.readOnly,
            customControls: [
            // eslint-disable-next-line no-unused-vars
            function (setValue, getValue, editorState) {
              var choices = new _Map([['1', { label: '1' }], ['2', { label: '2' }], ['3', { label: '3' }]]);
              return React.createElement(
                ButtonGroup,
                { key: 1 },
                React.createElement(Dropdown, {
                  choices: choices,
                  selectedKey: getValue('my-control-name'),
                  onChange: function onChange(value) {
                    return setValue('my-control-name', value);
                  }
                })
              );
            }, React.createElement(
              ButtonGroup,
              { key: 2 },
              React.createElement(IconButton, {
                label: 'Remove Link',
                iconName: 'remove-link',
                focusOnClick: false,
                onClick: function onClick() {
                  return console.log('You pressed a button');
                }
              })
            )]
          })
        ),
        React.createElement(
          'div',
          { className: 'row' },
          React.createElement(
            'label',
            { className: 'radio-item' },
            React.createElement('input', {
              type: 'radio',
              name: 'format',
              value: 'html',
              checked: format === 'html',
              onChange: this._onChangeFormat
            }),
            React.createElement(
              'span',
              null,
              'HTML'
            )
          ),
          React.createElement(
            'label',
            { className: 'radio-item' },
            React.createElement('input', {
              type: 'radio',
              name: 'format',
              value: 'markdown',
              checked: format === 'markdown',
              onChange: this._onChangeFormat
            }),
            React.createElement(
              'span',
              null,
              'Markdown'
            )
          ),
          React.createElement(
            'label',
            { className: 'radio-item' },
            React.createElement('input', {
              type: 'checkbox',
              onChange: this._onChangeReadOnly,
              checked: this.state.readOnly
            }),
            React.createElement(
              'span',
              null,
              'Editor is read-only'
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'row' },
          React.createElement('textarea', {
            className: 'source',
            placeholder: 'Editor Source',
            value: value.toString(format),
            onChange: this._onChangeSource
          })
        ),
        React.createElement(
          'div',
          { className: 'row btn-row' },
          React.createElement(
            'span',
            { className: 'label' },
            'Debugging:'
          ),
          React.createElement(
            'button',
            { className: 'btn', onClick: this._logState },
            'Log Content State'
          ),
          React.createElement(
            'button',
            { className: 'btn', onClick: this._logStateRaw },
            'Log Raw'
          )
        )
      );
    }
  }, {
    key: '_logState',
    value: function _logState() {
      var editorState = this.state.value.getEditorState();
      var contentState = window.contentState = editorState.getCurrentContent().toJS();
      console.log(contentState);
    }
  }, {
    key: '_logStateRaw',
    value: function _logStateRaw() {
      var editorState = this.state.value.getEditorState();
      var contentState = editorState.getCurrentContent();
      var rawContentState = window.rawContentState = convertToRaw(contentState);
      console.log(_JSON$stringify(rawContentState));
    }
  }, {
    key: '_onChange',
    value: function _onChange(value) {
      this.setState({ value: value });
    }
  }, {
    key: '_onChangeSource',
    value: function _onChangeSource(event) {
      var source = event.target.value;
      var oldValue = this.state.value;
      this.setState({
        value: oldValue.setContentFromString(source, this.state.format)
      });
    }
  }, {
    key: '_onChangeFormat',
    value: function _onChangeFormat(event) {
      this.setState({ format: event.target.value });
    }
  }, {
    key: '_onChangeReadOnly',
    value: function _onChangeReadOnly(event) {
      this.setState({ readOnly: event.target.checked });
    }
  }]);

  return EditorDemo;
}(Component);

export default EditorDemo;