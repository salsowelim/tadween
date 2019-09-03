import React from 'react';
import ReactDOM from 'react-dom';
import RichTextEditor from './RichTextEditor';
import ButtonGroup from './ui/ButtonGroup';
import Dropdown from './ui/Dropdown';
import IconButton from './ui/IconButton';

export default class MyEditor extends React.Component {
   constructor(props) {
    super(props)
    this.state = {
      value: RichTextEditor.createEmptyValue(),
    }
    this.addPostClicked = this.addPostClicked.bind(this);
    this.previewClicked = this.previewClicked.bind(this);
  }
   onChange = (value) => {
    this.setState({
      value
    })
  }
  componentDidMount() {
    var htmlcontent = document.getElementById('htmlcontent').value;
    this.setState({value: RichTextEditor.createValueFromString(htmlcontent,'html') });
    var addPostButton = document.getElementById('addpostB');
    addPostButton.addEventListener('click',this.addPostClicked);
    document.getElementById('previewbutton').addEventListener('click',this.previewClicked);
    
  }
   addPostClicked() {
    document.getElementById('htmlcontent').value = this.state.value.toString('html');
    document.getElementById('postform').submit();
  }
    previewClicked() {
    document.getElementById('htmlcontent_preview').value = this.state.value.toString('html');
    document.getElementById('title_preview').value =  document.getElementById('title').value;
    document.getElementById('pdate_preview').value =  document.getElementById('pdate').value;
    if (document.getElementById('ludate') ) {
    document.getElementById('ludate_preview').value =  document.getElementById('ludate').value;
    }
    document.getElementById('previewform').submit();
  }

  render() {
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
      <div className="editor_parent">
          <RichTextEditor
            value={this.state.value}
            onChange={this.onChange}
            className="editor_root"
            placeholder="ابدأ الكتابة"
            textAlignment="right"
            textDirectionality='RTL'
            toolbarClassName="editor_toolbar"
            editorClassName="editor_content"
            toolbarConfig={toolbarConfigAR}
          />
        </div>
    );
  }

}

ReactDOM.render(
  <MyEditor />,
  document.getElementById('app')
);