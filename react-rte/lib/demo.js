import React from 'react';
import ReactDOM from 'react-dom';
import EditorDemo from './EditorDemo';

document.addEventListener('DOMContentLoaded', function () {
  var rootNode = document.createElement('div');
  document.body.appendChild(rootNode);
  ReactDOM.render(React.createElement(EditorDemo, null), rootNode);
});