import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
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

      var toolbarConfigAR = {
        // Optionally specify the groups to display (displayed in the order listed).
        display: ['INLINE_STYLE_BUTTONS', 'BLOCK_TYPE_BUTTONS', 'LINK_BUTTONS', 'IMAGE_BUTTON', 'BLOCK_TYPE_DROPDOWN', 'HISTORY_BUTTONS'],
        INLINE_STYLE_BUTTONS: [{ label: 'عريض', style: 'BOLD' }, { label: 'مائل', style: 'ITALIC' }, { label: 'خط بالمنتصف', style: 'STRIKETHROUGH' }, { label: 'كود برمجي', style: 'CODE' }, { label: 'خط سفلي', style: 'UNDERLINE' }],
        BLOCK_TYPE_DROPDOWN: [{ label: 'بنط عادي', style: 'unstyled' }, { label: 'بنط عنوان كبير', style: 'header-one' }, { label: 'بنط عنوان وسط', style: 'header-two' }, { label: 'بنط عنوان صغير', style: 'header-three' }],
        BLOCK_TYPE_BUTTONS: [{ label: 'قائمة', style: 'unordered-list-item' }, { label: 'قائمة مرقمة', style: 'ordered-list-item' }, { label: 'اقتباس', style: 'blockquote' }],
        // other config…
        LINK_BUTTONS: {
          link: {
            label: "إضافة رابط"
          },
          removeLink: {
            label: "إزالة رابط"
          }
        },
        IMAGE_BUTTON: {
          label: "إضافة صورة"
        },
        HISTORY_BUTTONS: {
          undo: {
            label: "تراجع"
          },
          redo: {
            label: "تقدم"
          }
        }
      };

      return React.createElement(
        'div',
        { className: 'editor-demo' },
        React.createElement(
          'div',
          { className: 'row' },
          React.createElement(RichTextEditor, {
            value: value,
            onChange: this._onChange,
            className: 'react-rte-demo',
            placeholder: '\u0627\u0628\u062F\u0623 \u0627\u0644\u0643\u062A\u0627\u0628\u0629',
            textAlignment: 'right',
            textDirectionality: 'RTL',
            toolbarClassName: 'demo-toolbar',
            editorClassName: 'demo-editor',
            toolbarConfig: toolbarConfigAR,
            readOnly: this.state.readOnly
            /*customControls={[
              // eslint-disable-next-line no-unused-vars
              (setValue, getValue, editorState) => {
                let choices = new Map([
                  ['1', {label: '1'}],
                  ['2', {label: '2'}],
                  ['3', {label: '3'}],
                ]);
                return (
                  <ButtonGroup key={1}>
                    <Dropdown
                      choices={choices}
                      selectedKey={getValue('my-control-name')}
                      onChange={(value) => setValue('my-control-name', value)}
                    />
                  </ButtonGroup>
                );
              },
              <ButtonGroup key={2}>
                <IconButton
                  label="Remove Link"
                  iconName="remove-link"
                  focusOnClick={false}
                  onClick={() => console.log('You pressed a button')}
                />
              </ButtonGroup>,
            ]}*/
          })
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