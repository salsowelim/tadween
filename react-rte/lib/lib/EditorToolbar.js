import _Array$from from 'babel-runtime/core-js/array/from';
import _Map from 'babel-runtime/core-js/map';
import _defineProperty from 'babel-runtime/helpers/defineProperty';
import _extends from 'babel-runtime/helpers/extends';
import _typeof from 'babel-runtime/helpers/typeof';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import { hasCommandModifier } from 'draft-js/lib/KeyBindingUtil';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { EditorState, Entity, EntityDescription, RichUtils, Modifier } from 'draft-js';
import { ENTITY_TYPE } from 'draft-js-utils';
import DefaultToolbarConfig from './EditorToolbarConfig';
import StyleButton from './StyleButton';
import PopoverIconButton from '../ui/PopoverIconButton';
import ButtonGroup from '../ui/ButtonGroup';
import Dropdown from '../ui/Dropdown';
import IconButton from '../ui/IconButton';
import getEntityAtCursor from './getEntityAtCursor';
import clearEntityForRange from './clearEntityForRange';
import autobind from 'class-autobind';
import cx from 'classnames';

import styles from './EditorToolbar.css';

var EditorToolbar = function (_Component) {
  _inherits(EditorToolbar, _Component);

  function EditorToolbar() {
    _classCallCheck(this, EditorToolbar);

    var _this = _possibleConstructorReturn(this, (EditorToolbar.__proto__ || _Object$getPrototypeOf(EditorToolbar)).apply(this, arguments));

    autobind(_this);
    _this.state = {
      showLinkInput: false,
      showImageInput: false,
      customControlState: {}
    };
    return _this;
  }

  _createClass(EditorToolbar, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      // Technically, we should also attach/detach event listeners when the
      // `keyEmitter` prop changes.
      this.props.keyEmitter.on('keypress', this._onKeypress);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.props.keyEmitter.removeListener('keypress', this._onKeypress);
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var _props = this.props,
          className = _props.className,
          toolbarConfig = _props.toolbarConfig,
          rootStyle = _props.rootStyle,
          isOnBottom = _props.isOnBottom;

      if (toolbarConfig == null) {
        toolbarConfig = DefaultToolbarConfig;
      }
      var display = toolbarConfig.display || DefaultToolbarConfig.display;
      var buttonGroups = display.map(function (groupName) {
        switch (groupName) {
          case 'INLINE_STYLE_BUTTONS':
            {
              return _this2._renderInlineStyleButtons(groupName, toolbarConfig);
            }
          case 'BLOCK_TYPE_DROPDOWN':
            {
              return _this2._renderBlockTypeDropdown(groupName, toolbarConfig);
            }
          case 'LINK_BUTTONS':
            {
              return _this2._renderLinkButtons(groupName, toolbarConfig);
            }
          case 'IMAGE_BUTTON':
            {
              return _this2._renderImageButton(groupName, toolbarConfig);
            }
          case 'BLOCK_TYPE_BUTTONS':
            {
              return _this2._renderBlockTypeButtons(groupName, toolbarConfig);
            }
          case 'HISTORY_BUTTONS':
            {
              return _this2._renderUndoRedo(groupName, toolbarConfig);
            }
        }
      });
      return React.createElement(
        'div',
        { className: cx(styles.root, isOnBottom && styles.onBottom, className), style: rootStyle },
        buttonGroups,
        this._renderCustomControls()
      );
    }
  }, {
    key: '_renderCustomControls',
    value: function _renderCustomControls() {
      var _this3 = this;

      var _props2 = this.props,
          customControls = _props2.customControls,
          editorState = _props2.editorState;

      if (customControls == null) {
        return;
      }
      return customControls.map(function (f) {
        switch (typeof f === 'undefined' ? 'undefined' : _typeof(f)) {
          case 'function':
            {
              return f(_this3._setCustomControlState, _this3._getCustomControlState, editorState);
            }
          default:
            {
              return f;
            }
        }
      });
    }
  }, {
    key: '_setCustomControlState',
    value: function _setCustomControlState(key, value) {
      this.setState(function (_ref) {
        var customControlState = _ref.customControlState;
        return {
          customControlState: _extends({}, customControlState, _defineProperty({}, key, value))
        };
      });
    }
  }, {
    key: '_getCustomControlState',
    value: function _getCustomControlState(key) {
      return this.state.customControlState[key];
    }
  }, {
    key: '_renderBlockTypeDropdown',
    value: function _renderBlockTypeDropdown(name, toolbarConfig) {
      var blockType = this._getCurrentBlockType();
      var choices = new _Map((toolbarConfig.BLOCK_TYPE_DROPDOWN || []).map(function (type) {
        return [type.style, { label: type.label, className: type.className }];
      }));
      if (!choices.has(blockType)) {
        blockType = _Array$from(choices.keys())[0];
      }
      return React.createElement(
        ButtonGroup,
        { key: name },
        React.createElement(Dropdown, _extends({}, toolbarConfig.extraProps, {
          choices: choices,
          selectedKey: blockType,
          onChange: this._selectBlockType
        }))
      );
    }
  }, {
    key: '_renderBlockTypeButtons',
    value: function _renderBlockTypeButtons(name, toolbarConfig) {
      var _this4 = this;

      var blockType = this._getCurrentBlockType();
      var buttons = (toolbarConfig.BLOCK_TYPE_BUTTONS || []).map(function (type, index) {
        return React.createElement(StyleButton, _extends({}, toolbarConfig.extraProps, {
          key: String(index),
          isActive: type.style === blockType,
          label: type.label,
          onToggle: _this4._toggleBlockType,
          style: type.style,
          className: type.className
        }));
      });
      return React.createElement(
        ButtonGroup,
        { key: name },
        buttons
      );
    }
  }, {
    key: '_renderInlineStyleButtons',
    value: function _renderInlineStyleButtons(name, toolbarConfig) {
      var _this5 = this;

      var editorState = this.props.editorState;

      var currentStyle = editorState.getCurrentInlineStyle();
      var buttons = (toolbarConfig.INLINE_STYLE_BUTTONS || []).map(function (type, index) {
        return React.createElement(StyleButton, _extends({}, toolbarConfig.extraProps, {
          key: String(index),
          isActive: currentStyle.has(type.style),
          label: type.label,
          onToggle: _this5._toggleInlineStyle,
          style: type.style,
          className: type.className
        }));
      });
      return React.createElement(
        ButtonGroup,
        { key: name },
        buttons
      );
    }
  }, {
    key: '_renderLinkButtons',
    value: function _renderLinkButtons(name, toolbarConfig) {
      var editorState = this.props.editorState;

      var selection = editorState.getSelection();
      var entity = this._getEntityAtCursor();
      var hasSelection = !selection.isCollapsed();
      var isCursorOnLink = entity != null && entity.type === ENTITY_TYPE.LINK;
      var shouldShowLinkButton = hasSelection || isCursorOnLink;
      var defaultValue = entity && isCursorOnLink ? entity.getData().url : '';
      var config = toolbarConfig.LINK_BUTTONS || {};
      var linkConfig = config.link || {};
      var removeLinkConfig = config.removeLink || {};
      var linkLabel = linkConfig.label || 'Link';
      var removeLinkLabel = removeLinkConfig.label || 'Remove Link';

      return React.createElement(
        ButtonGroup,
        { key: name },
        React.createElement(PopoverIconButton, {
          label: linkLabel,
          iconName: 'link',
          isDisabled: !shouldShowLinkButton,
          showPopover: this.state.showLinkInput,
          onTogglePopover: this._toggleShowLinkInput,
          defaultValue: defaultValue,
          onSubmit: this._setLink
        }),
        React.createElement(IconButton, _extends({}, toolbarConfig.extraProps, {
          label: removeLinkLabel,
          iconName: 'remove-link',
          isDisabled: !isCursorOnLink,
          onClick: this._removeLink,
          focusOnClick: false
        }))
      );
    }
  }, {
    key: '_renderImageButton',
    value: function _renderImageButton(name, toolbarConfig) {
      var config = toolbarConfig.IMAGE_BUTTON || {};
      var label = config.label || 'Image';
      return React.createElement(
        ButtonGroup,
        { key: name },
        React.createElement(PopoverIconButton, {
          label: label,
          iconName: 'image',
          showPopover: this.state.showImageInput,
          onTogglePopover: this._toggleShowImageInput,
          onSubmit: this._setImage
        })
      );
    }
  }, {
    key: '_renderUndoRedo',
    value: function _renderUndoRedo(name, toolbarConfig) {
      var editorState = this.props.editorState;

      var canUndo = editorState.getUndoStack().size !== 0;
      var canRedo = editorState.getRedoStack().size !== 0;
      var config = toolbarConfig.HISTORY_BUTTONS || {};
      var undoConfig = config.undo || {};
      var redoConfig = config.redo || {};
      var undoLabel = undoConfig.label || 'Undo';
      var redoLabel = redoConfig.label || 'Redo';
      return React.createElement(
        ButtonGroup,
        { key: name },
        React.createElement(IconButton, _extends({}, toolbarConfig.extraProps, {
          label: undoLabel,
          iconName: 'undo',
          isDisabled: !canUndo,
          onClick: this._undo,
          focusOnClick: false
        })),
        React.createElement(IconButton, _extends({}, toolbarConfig.extraProps, {
          label: redoLabel,
          iconName: 'redo',
          isDisabled: !canRedo,
          onClick: this._redo,
          focusOnClick: false
        }))
      );
    }
  }, {
    key: '_onKeypress',
    value: function _onKeypress(event, eventFlags) {
      // Catch cmd+k for use with link insertion.
      if (hasCommandModifier(event) && event.keyCode === 75) {
        var _editorState = this.props.editorState;

        if (!_editorState.getSelection().isCollapsed()) {
          this.setState({ showLinkInput: true });
          eventFlags.wasHandled = true;
        }
      }
    }
  }, {
    key: '_toggleShowLinkInput',
    value: function _toggleShowLinkInput(event) {
      var isShowing = this.state.showLinkInput;
      // If this is a hide request, decide if we should focus the editor.
      if (isShowing) {
        var shouldFocusEditor = true;
        if (event && event.type === 'click') {
          // TODO: Use a better way to get the editor root node.
          var editorRoot = ReactDOM.findDOMNode(this).parentNode;
          var _document = document,
              activeElement = _document.activeElement;

          var wasClickAway = activeElement == null || activeElement === document.body;
          if (!wasClickAway && !editorRoot.contains(activeElement)) {
            shouldFocusEditor = false;
          }
        }
        if (shouldFocusEditor) {
          this.props.focusEditor();
        }
      }
      this.setState({ showLinkInput: !isShowing });
    }
  }, {
    key: '_toggleShowImageInput',
    value: function _toggleShowImageInput(event) {
      var isShowing = this.state.showImageInput;
      // If this is a hide request, decide if we should focus the editor.
      if (isShowing) {
        var shouldFocusEditor = true;
        if (event && event.type === 'click') {
          // TODO: Use a better way to get the editor root node.
          var editorRoot = ReactDOM.findDOMNode(this).parentNode;
          var _document2 = document,
              activeElement = _document2.activeElement;

          var wasClickAway = activeElement == null || activeElement === document.body;
          if (!wasClickAway && !editorRoot.contains(activeElement)) {
            shouldFocusEditor = false;
          }
        }
        if (shouldFocusEditor) {
          this.props.focusEditor();
        }
      }
      this.setState({ showImageInput: !isShowing });
    }
  }, {
    key: '_setImage',
    value: function _setImage(src) {
      var editorState = this.props.editorState;

      var contentState = editorState.getCurrentContent();
      var selection = editorState.getSelection();
      contentState = contentState.createEntity(ENTITY_TYPE.IMAGE, 'IMMUTABLE', { src: src });
      var entityKey = contentState.getLastCreatedEntityKey();
      var newContentState = Modifier.insertText(contentState, selection, ' ', null, entityKey);
      this.setState({ showImageInput: false });
      this.props.onChange(EditorState.push(editorState, newContentState));
      this._focusEditor();
    }
  }, {
    key: '_setLink',
    value: function _setLink(url) {
      var editorState = this.props.editorState;

      var contentState = editorState.getCurrentContent();
      var selection = editorState.getSelection();
      var origSelection = selection;
      var canApplyLink = false;

      if (selection.isCollapsed()) {
        var entity = this._getEntityDescriptionAtCursor();
        if (entity) {
          canApplyLink = true;
          selection = selection.merge({
            anchorOffset: entity.startOffset,
            focusOffset: entity.endOffset,
            isBackward: false
          });
        }
      } else {
        canApplyLink = true;
      }

      this.setState({ showLinkInput: false });
      if (canApplyLink) {
        contentState = contentState.createEntity(ENTITY_TYPE.LINK, 'MUTABLE', { url: url });
        var entityKey = contentState.getLastCreatedEntityKey();

        editorState = EditorState.push(editorState, contentState);
        editorState = RichUtils.toggleLink(editorState, selection, entityKey);
        editorState = EditorState.acceptSelection(editorState, origSelection);

        this.props.onChange(editorState);
      }
      this._focusEditor();
    }
  }, {
    key: '_removeLink',
    value: function _removeLink() {
      var editorState = this.props.editorState;

      var entity = getEntityAtCursor(editorState);
      if (entity != null) {
        var blockKey = entity.blockKey,
            startOffset = entity.startOffset,
            endOffset = entity.endOffset;

        this.props.onChange(clearEntityForRange(editorState, blockKey, startOffset, endOffset));
      }
    }
  }, {
    key: '_getEntityDescriptionAtCursor',
    value: function _getEntityDescriptionAtCursor() {
      var editorState = this.props.editorState;

      return getEntityAtCursor(editorState);
    }
  }, {
    key: '_getEntityAtCursor',
    value: function _getEntityAtCursor() {
      var editorState = this.props.editorState;

      var contentState = editorState.getCurrentContent();
      var entity = getEntityAtCursor(editorState);
      return entity == null ? null : contentState.getEntity(entity.entityKey);
    }
  }, {
    key: '_getCurrentBlockType',
    value: function _getCurrentBlockType() {
      var editorState = this.props.editorState;

      var selection = editorState.getSelection();
      return editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType();
    }
  }, {
    key: '_selectBlockType',
    value: function _selectBlockType() {
      this._toggleBlockType.apply(this, arguments);
      this._focusEditor();
    }
  }, {
    key: '_toggleBlockType',
    value: function _toggleBlockType(blockType) {
      this.props.onChange(RichUtils.toggleBlockType(this.props.editorState, blockType));
    }
  }, {
    key: '_toggleInlineStyle',
    value: function _toggleInlineStyle(inlineStyle) {
      this.props.onChange(RichUtils.toggleInlineStyle(this.props.editorState, inlineStyle));
    }
  }, {
    key: '_undo',
    value: function _undo() {
      var editorState = this.props.editorState;

      this.props.onChange(EditorState.undo(editorState));
    }
  }, {
    key: '_redo',
    value: function _redo() {
      var editorState = this.props.editorState;

      this.props.onChange(EditorState.redo(editorState));
    }
  }, {
    key: '_focusEditor',
    value: function _focusEditor() {
      var _this6 = this;

      // Hacky: Wait to focus the editor so we don't lose selection.
      setTimeout(function () {
        _this6.props.focusEditor();
      }, 50);
    }
  }]);

  return EditorToolbar;
}(Component);

export default EditorToolbar;