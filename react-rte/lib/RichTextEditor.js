import _Object$assign from 'babel-runtime/core-js/object/assign';
import _defineProperty from 'babel-runtime/helpers/defineProperty';
import _extends from 'babel-runtime/helpers/extends';
import _objectWithoutProperties from 'babel-runtime/helpers/objectWithoutProperties';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import React, { Component } from 'react';
import { CompositeDecorator, Editor, EditorState, Modifier, RichUtils, Entity } from 'draft-js';
import getDefaultKeyBinding from 'draft-js/lib/getDefaultKeyBinding';
import changeBlockDepth from './lib/changeBlockDepth';
import changeBlockType from './lib/changeBlockType';
import getBlocksInSelection from './lib/getBlocksInSelection';
import insertBlockAfter from './lib/insertBlockAfter';
import isListItem from './lib/isListItem';
import isSoftNewlineEvent from 'draft-js/lib/isSoftNewlineEvent';
import EditorToolbar from './lib/EditorToolbar';
import EditorValue from './lib/EditorValue';
import LinkDecorator from './lib/LinkDecorator';
import ImageDecorator from './lib/ImageDecorator';
import composite from './lib/composite';
import cx from 'classnames';
import autobind from 'class-autobind';
import EventEmitter from 'events';
import { BLOCK_TYPE } from 'draft-js-utils';

import './Draft.global.css';
import styles from './RichTextEditor.css';

import ButtonGroup from './ui/ButtonGroup';
import Button from './ui/Button';
import Dropdown from './ui/Dropdown';

var MAX_LIST_DEPTH = 2;

// Custom overrides for "code" style.
var styleMap = {
  CODE: {
    backgroundColor: '#f3f3f3',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2
  }
};

var RichTextEditor = function (_Component) {
  _inherits(RichTextEditor, _Component);

  function RichTextEditor() {
    _classCallCheck(this, RichTextEditor);

    var _this = _possibleConstructorReturn(this, (RichTextEditor.__proto__ || _Object$getPrototypeOf(RichTextEditor)).apply(this, arguments));

    _this._keyEmitter = new EventEmitter();
    autobind(_this);
    return _this;
  }

  _createClass(RichTextEditor, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var autoFocus = this.props.autoFocus;


      if (!autoFocus) {
        return;
      }

      this._focus();
    }
  }, {
    key: 'render',
    value: function render() {
      var _cx,
          _this2 = this;

      var _props = this.props,
          value = _props.value,
          className = _props.className,
          toolbarClassName = _props.toolbarClassName,
          editorClassName = _props.editorClassName,
          placeholder = _props.placeholder,
          customStyleMap = _props.customStyleMap,
          readOnly = _props.readOnly,
          disabled = _props.disabled,
          toolbarConfig = _props.toolbarConfig,
          toolbarOnBottom = _props.toolbarOnBottom,
          blockStyleFn = _props.blockStyleFn,
          customControls = _props.customControls,
          keyBindingFn = _props.keyBindingFn,
          rootStyle = _props.rootStyle,
          toolbarStyle = _props.toolbarStyle,
          editorStyle = _props.editorStyle,
          otherProps = _objectWithoutProperties(_props, ['value', 'className', 'toolbarClassName', 'editorClassName', 'placeholder', 'customStyleMap', 'readOnly', 'disabled', 'toolbarConfig', 'toolbarOnBottom', 'blockStyleFn', 'customControls', 'keyBindingFn', 'rootStyle', 'toolbarStyle', 'editorStyle']);

      var editorState = value.getEditorState();
      customStyleMap = customStyleMap ? _extends({}, styleMap, customStyleMap) : styleMap;

      // If the user changes block type before entering any text, we can either
      // style the placeholder or hide it. Let's just hide it for now.
      var combinedEditorClassName = cx((_cx = {}, _defineProperty(_cx, styles.editor, true), _defineProperty(_cx, styles.hidePlaceholder, this._shouldHidePlaceholder()), _cx), editorClassName);
      if (readOnly == null) {
        readOnly = disabled;
      }
      var editorToolbar = void 0;
      if (!readOnly) {
        editorToolbar = React.createElement(EditorToolbar, {
          rootStyle: toolbarStyle,
          isOnBottom: toolbarOnBottom,
          className: toolbarClassName,
          keyEmitter: this._keyEmitter,
          editorState: editorState,
          onChange: this._onChange,
          focusEditor: this._focus,
          toolbarConfig: toolbarConfig,
          customControls: customControls
        });
      }
      return React.createElement(
        'div',
        { className: cx(styles.root, className), style: rootStyle },
        !toolbarOnBottom && editorToolbar,
        React.createElement(
          'div',
          { className: combinedEditorClassName, style: editorStyle },
          React.createElement(Editor, _extends({}, otherProps, {
            blockStyleFn: composite(defaultBlockStyleFn, blockStyleFn),
            customStyleMap: customStyleMap,
            editorState: editorState,
            handleReturn: this._handleReturn,
            keyBindingFn: keyBindingFn || this._customKeyHandler,
            handleKeyCommand: this._handleKeyCommand,
            onTab: this._onTab,
            onChange: this._onChange,
            placeholder: placeholder,
            ref: function ref(el) {
              _this2.editor = el;
            },
            spellCheck: true,
            readOnly: readOnly
          }))
        ),
        toolbarOnBottom && editorToolbar
      );
    }
  }, {
    key: '_shouldHidePlaceholder',
    value: function _shouldHidePlaceholder() {
      var editorState = this.props.value.getEditorState();
      var contentState = editorState.getCurrentContent();
      if (!contentState.hasText()) {
        if (contentState.getBlockMap().first().getType() !== 'unstyled') {
          return true;
        }
      }
      return false;
    }
  }, {
    key: '_handleReturn',
    value: function _handleReturn(event) {
      var handleReturn = this.props.handleReturn;

      if (handleReturn != null && handleReturn(event)) {
        return true;
      }
      if (this._handleReturnSoftNewline(event)) {
        return true;
      }
      if (this._handleReturnEmptyListItem()) {
        return true;
      }
      if (this._handleReturnSpecialBlock()) {
        return true;
      }
      return false;
    }

    // `shift + return` should insert a soft newline.

  }, {
    key: '_handleReturnSoftNewline',
    value: function _handleReturnSoftNewline(event) {
      var editorState = this.props.value.getEditorState();
      if (isSoftNewlineEvent(event)) {
        var selection = editorState.getSelection();
        if (selection.isCollapsed()) {
          this._onChange(RichUtils.insertSoftNewline(editorState));
        } else {
          var content = editorState.getCurrentContent();
          var newContent = Modifier.removeRange(content, selection, 'forward');
          var newSelection = newContent.getSelectionAfter();
          var _block = newContent.getBlockForKey(newSelection.getStartKey());
          newContent = Modifier.insertText(newContent, newSelection, '\n', _block.getInlineStyleAt(newSelection.getStartOffset()), null);
          this._onChange(EditorState.push(editorState, newContent, 'insert-fragment'));
        }
        return true;
      }
      return false;
    }

    // If the cursor is in an empty list item when return is pressed, then the
    // block type should change to normal (end the list).

  }, {
    key: '_handleReturnEmptyListItem',
    value: function _handleReturnEmptyListItem() {
      var editorState = this.props.value.getEditorState();
      var selection = editorState.getSelection();
      if (selection.isCollapsed()) {
        var contentState = editorState.getCurrentContent();
        var blockKey = selection.getStartKey();
        var _block2 = contentState.getBlockForKey(blockKey);
        if (isListItem(_block2) && _block2.getLength() === 0) {
          var depth = _block2.getDepth();
          var newState = depth === 0 ? changeBlockType(editorState, blockKey, BLOCK_TYPE.UNSTYLED) : changeBlockDepth(editorState, blockKey, depth - 1);
          this._onChange(newState);
          return true;
        }
      }
      return false;
    }

    // If the cursor is at the end of a special block (any block type other than
    // normal or list item) when return is pressed, new block should be normal.

  }, {
    key: '_handleReturnSpecialBlock',
    value: function _handleReturnSpecialBlock() {
      var editorState = this.props.value.getEditorState();
      var selection = editorState.getSelection();
      if (selection.isCollapsed()) {
        var contentState = editorState.getCurrentContent();
        var blockKey = selection.getStartKey();
        var _block3 = contentState.getBlockForKey(blockKey);
        if (!isListItem(_block3) && _block3.getType() !== BLOCK_TYPE.UNSTYLED) {
          // If cursor is at end.
          if (_block3.getLength() === selection.getStartOffset()) {
            var newEditorState = insertBlockAfter(editorState, blockKey, BLOCK_TYPE.UNSTYLED);
            this._onChange(newEditorState);
            return true;
          }
        }
      }
      return false;
    }
  }, {
    key: '_onTab',
    value: function _onTab(event) {
      var editorState = this.props.value.getEditorState();
      var newEditorState = RichUtils.onTab(event, editorState, MAX_LIST_DEPTH);
      if (newEditorState !== editorState) {
        this._onChange(newEditorState);
      }
    }
  }, {
    key: '_customKeyHandler',
    value: function _customKeyHandler(event) {
      // Allow toolbar to catch key combinations.
      var eventFlags = {};
      this._keyEmitter.emit('keypress', event, eventFlags);
      if (eventFlags.wasHandled) {
        return null;
      } else {
        return getDefaultKeyBinding(event);
      }
    }
  }, {
    key: '_handleKeyCommand',
    value: function _handleKeyCommand(command) {
      var editorState = this.props.value.getEditorState();
      var newEditorState = RichUtils.handleKeyCommand(editorState, command);
      if (newEditorState) {
        this._onChange(newEditorState);
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: '_onChange',
    value: function _onChange(editorState) {
      var _props2 = this.props,
          onChange = _props2.onChange,
          value = _props2.value;

      if (onChange == null) {
        return;
      }
      var newValue = value.setEditorState(editorState);
      var newEditorState = newValue.getEditorState();
      this._handleInlineImageSelection(newEditorState);
      onChange(newValue);
    }
  }, {
    key: '_handleInlineImageSelection',
    value: function _handleInlineImageSelection(editorState) {
      var selection = editorState.getSelection();
      var blocks = getBlocksInSelection(editorState);

      var selectImage = function selectImage(block, offset) {
        var imageKey = block.getEntityAt(offset);
        Entity.mergeData(imageKey, { selected: true });
      };

      var isInMiddleBlock = function isInMiddleBlock(index) {
        return index > 0 && index < blocks.size - 1;
      };
      var isWithinStartBlockSelection = function isWithinStartBlockSelection(offset, index) {
        return index === 0 && offset > selection.getStartOffset();
      };
      var isWithinEndBlockSelection = function isWithinEndBlockSelection(offset, index) {
        return index === blocks.size - 1 && offset < selection.getEndOffset();
      };

      blocks.toIndexedSeq().forEach(function (block, index) {
        ImageDecorator.strategy(block, function (offset) {
          if (isWithinStartBlockSelection(offset, index) || isInMiddleBlock(index) || isWithinEndBlockSelection(offset, index)) {
            selectImage(block, offset);
          }
        });
      });
    }
  }, {
    key: '_focus',
    value: function _focus() {
      this.editor.focus();
    }
  }]);

  return RichTextEditor;
}(Component);

export default RichTextEditor;


function defaultBlockStyleFn(block) {
  var result = styles.block;
  switch (block.getType()) {
    case 'unstyled':
      return cx(result, styles.paragraph);
    case 'blockquote':
      return cx(result, styles.blockquote);
    case 'code-block':
      return cx(result, styles.codeBlock);
    default:
      return result;
  }
}

var decorator = new CompositeDecorator([LinkDecorator, ImageDecorator]);

function createEmptyValue() {
  return EditorValue.createEmpty(decorator);
}

function createValueFromString(markup, format, options) {
  return EditorValue.createFromString(markup, format, decorator, options);
}

// $FlowIssue - This should probably not be done this way.
_Object$assign(RichTextEditor, {
  EditorValue: EditorValue,
  decorator: decorator,
  createEmptyValue: createEmptyValue,
  createValueFromString: createValueFromString,
  ButtonGroup: ButtonGroup,
  Button: Button,
  Dropdown: Dropdown
});

export { EditorValue, decorator, createEmptyValue, createValueFromString, ButtonGroup, Button, Dropdown };