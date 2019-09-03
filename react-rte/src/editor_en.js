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
    return (
      <div className="editor_parent">
          <RichTextEditor
            value={this.state.value}
            onChange={this.onChange}
            className="editor_root"
            placeholder="Start Writing"
            toolbarClassName="editor_toolbar"
            editorClassName="editor_content"
          />
        </div>
    );
  }

}

ReactDOM.render(
  <MyEditor />,
  document.getElementById('app')
);