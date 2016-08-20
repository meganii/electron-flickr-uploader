"use strict";
const {ipcRenderer} = require('electron');

const holder = document.getElementById('holder');
holder.ondragover = () => {
  return false;
};
holder.ondragleave = holder.ondragend = () => {
  return false;
};
holder.ondrop = (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  console.log('File Path:', file.path);
  ipcRenderer.send('upload', file.path);
  return false;
};
