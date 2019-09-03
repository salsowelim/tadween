/* @flow */
import React, {Component} from 'react';
import RichTextEditor, {createEmptyValue} from './RichTextEditor';
import {convertToRaw} from 'draft-js';
import autobind from 'class-autobind';

import ButtonGroup from './ui/ButtonGroup';
import Dropdown from './ui/Dropdown';
import IconButton from './ui/IconButton';

import type {EditorValue} from './RichTextEditor';

type Props = {};
type State = {
  value: EditorValue;
  format: string;
  readOnly: boolean;
};

export default class EditorDemo extends Component {
  props: Props;
  state: State;

  constructor() {
    super(...arguments);
    autobind(this);
    this.state = {
      value: createEmptyValue(),
      format: 'html',
      readOnly: false,
    };
  }

  render() {
    let {value, format} = this.state;
    const toolbarConfigAR= {
    // Optionally specify the groups to display (displayed in the order listed).
    display: ['INLINE_STYLE_BUTTONS', 'BLOCK_TYPE_BUTTONS', 'LINK_BUTTONS', 'IMAGE_BUTTON','BLOCK_TYPE_DROPDOWN', 'HISTORY_BUTTONS'],
    INLINE_STYLE_BUTTONS: [
      {label: 'عريض', style: 'BOLD'},
  {label: 'مائل', style: 'ITALIC'},
  {label: 'خط بالمنتصف', style: 'STRIKETHROUGH'},
  {label: 'كود برمجي', style: 'CODE'},
  {label: 'خط سفلي', style: 'UNDERLINE'},
    ],
    BLOCK_TYPE_DROPDOWN: [
      {label: 'بنط عادي', style: 'unstyled'},
      {label: 'بنط عنوان كبير', style: 'header-one'},
      {label: 'بنط عنوان وسط', style: 'header-two'},
      {label: 'بنط عنوان صغير', style: 'header-three'}
    ],
    BLOCK_TYPE_BUTTONS: [
      {label: 'قائمة', style: 'unordered-list-item'},
      {label: 'قائمة مرقمة', style: 'ordered-list-item'},
      {label: 'اقتباس', style: 'blockquote'}

    ],
     // other config…
  LINK_BUTTONS: {
    link: {
      label: "إضافة رابط",
    },
    removeLink: {
      label: "إزالة رابط",
    },
  },
  IMAGE_BUTTON: {
    label: "إضافة صورة",
  },
  HISTORY_BUTTONS: {
    undo: {
      label: "تراجع",
    },
    redo: {
      label: "تقدم",
    },
  },
  };

    return (
      <div className="editor-demo">
        <div className="row">
          <RichTextEditor
            value={value}
            onChange={this._onChange}
            className="react-rte-demo"
            placeholder="ابدأ الكتابة"
            textAlignment="right"
            textDirectionality='RTL'
            toolbarClassName="demo-toolbar"
            editorClassName="demo-editor"
            toolbarConfig={toolbarConfigAR}
            readOnly={this.state.readOnly}
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
          />
        </div>
      </div>
    );
  }

  _logState() {
    let editorState = this.state.value.getEditorState();
    let contentState = window.contentState = editorState.getCurrentContent().toJS();
    console.log(contentState);
  }

  _logStateRaw() {
    let editorState = this.state.value.getEditorState();
    let contentState = editorState.getCurrentContent();
    let rawContentState = window.rawContentState = convertToRaw(contentState);
    console.log(JSON.stringify(rawContentState));
  }

  _onChange(value: EditorValue) {
    this.setState({value});
  }

  _onChangeSource(event: Object) {
    let source = event.target.value;
    let oldValue = this.state.value;
    this.setState({
      value: oldValue.setContentFromString(source, this.state.format),
    });
  }

  _onChangeFormat(event: Object) {
    this.setState({format: event.target.value});
  }

  _onChangeReadOnly(event: Object) {
    this.setState({readOnly: event.target.checked});
  }
}
