import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import IconButton from './IconButton';
import ButtonGroup from './ButtonGroup';
import autobind from 'class-autobind';
import cx from 'classnames';

import styles from './InputPopover.css';

var InputPopover = function (_Component) {
  _inherits(InputPopover, _Component);

  function InputPopover() {
    _classCallCheck(this, InputPopover);

    var _this = _possibleConstructorReturn(this, (InputPopover.__proto__ || _Object$getPrototypeOf(InputPopover)).apply(this, arguments));

    autobind(_this);
    return _this;
  }

  _createClass(InputPopover, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      document.addEventListener('click', this._onDocumentClick);
      document.addEventListener('keydown', this._onDocumentKeydown);
      if (this._inputRef) {
        this._inputRef.focus();
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      document.removeEventListener('click', this._onDocumentClick);
      document.removeEventListener('keydown', this._onDocumentKeydown);
    }
  }, {
    key: 'render',
    value: function render() {
      var props = this.props;

      var className = cx(props.className, styles.root);
      return React.createElement(
        'div',
        { className: className },
        React.createElement(
          'div',
          { className: styles.inner },
          React.createElement('input', {
            ref: this._setInputRef,
            defaultValue: props.defaultValue,
            type: 'text',
            placeholder: 'https://example.com/',
            className: styles.input,
            onKeyPress: this._onInputKeyPress
          }),
          React.createElement(
            ButtonGroup,
            { className: styles.buttonGroup },
            React.createElement(IconButton, {
              label: 'Cancel',
              iconName: 'cancel',
              onClick: props.onCancel
            }),
            React.createElement(IconButton, {
              label: 'Submit',
              iconName: 'accept',
              onClick: this._onSubmit
            })
          )
        )
      );
    }
  }, {
    key: '_setInputRef',
    value: function _setInputRef(inputElement) {
      this._inputRef = inputElement;
    }
  }, {
    key: '_onInputKeyPress',
    value: function _onInputKeyPress(event) {
      if (event.which === 13) {
        // Avoid submitting a <form> somewhere up the element tree.
        event.preventDefault();
        this._onSubmit();
      }
    }
  }, {
    key: '_onSubmit',
    value: function _onSubmit() {
      var value = this._inputRef ? this._inputRef.value : '';
      this.props.onSubmit(value);
    }
  }, {
    key: '_onDocumentClick',
    value: function _onDocumentClick(event) {
      var rootNode = ReactDOM.findDOMNode(this);
      if (!rootNode.contains(event.target)) {
        // Here we pass the event so the parent can manage focus.
        this.props.onCancel(event);
      }
    }
  }, {
    key: '_onDocumentKeydown',
    value: function _onDocumentKeydown(event) {
      if (event.keyCode === 27) {
        this.props.onCancel();
      }
    }
  }]);

  return InputPopover;
}(Component);

export default InputPopover;