import _extends from 'babel-runtime/helpers/extends';
import _objectWithoutProperties from 'babel-runtime/helpers/objectWithoutProperties';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import React, { Component } from 'react';
import IconButton from './IconButton';
import InputPopover from './InputPopover';
import autobind from 'class-autobind';

var PopoverIconButton = function (_Component) {
  _inherits(PopoverIconButton, _Component);

  function PopoverIconButton() {
    _classCallCheck(this, PopoverIconButton);

    var _this = _possibleConstructorReturn(this, (PopoverIconButton.__proto__ || _Object$getPrototypeOf(PopoverIconButton)).apply(this, arguments));

    autobind(_this);
    return _this;
  }

  _createClass(PopoverIconButton, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          onTogglePopover = _props.onTogglePopover,
          showPopover = _props.showPopover,
          props = _objectWithoutProperties(_props, ['onTogglePopover', 'showPopover']); // eslint-disable-line no-unused-vars


      return React.createElement(
        IconButton,
        _extends({}, props, { onClick: onTogglePopover }),
        this._renderPopover()
      );
    }
  }, {
    key: '_renderPopover',
    value: function _renderPopover() {
      if (!this.props.showPopover) {
        return null;
      }
      return React.createElement(InputPopover, {
        defaultValue: this.props.defaultValue,
        onSubmit: this._onSubmit,
        onCancel: this._hidePopover
      });
    }
  }, {
    key: '_onSubmit',
    value: function _onSubmit() {
      var _props2;

      (_props2 = this.props).onSubmit.apply(_props2, arguments);
    }
  }, {
    key: '_hidePopover',
    value: function _hidePopover() {
      if (this.props.showPopover) {
        var _props3;

        (_props3 = this.props).onTogglePopover.apply(_props3, arguments);
      }
    }
  }]);

  return PopoverIconButton;
}(Component);

export default PopoverIconButton;