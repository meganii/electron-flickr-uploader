"use strict";
import {app, BrowserWindow} from 'electron';
import ElectronFlickr from './src/ElectronFlickr';
import fs from 'fs';
import Utils from './src/utils.js';
const utils = new Utils();
const {ipcMain} = require('electron');

require('dotenv').config()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

let options = {
  api_key:     process.env.API_KEY,
  secret:      process.env.SECRET,
  permissions: "write",
  callback:    "http://localhost",
};

function createWindow () {
  const userDirPath = app.getPath('userData');

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600});
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  fs.open(userDirPath + "/config.json", 'r', (err, fd) => {
    if (err) {
      const flickr = new ElectronFlickr(options);
      const requestURL = flickr.getRequestTokenURL();
      flickr.getAuthToken(requestURL, (err, res) => {
        const authURL = flickr.getAuthURL();
        console.log(authURL);
        let loginWindow = new BrowserWindow({width: 800, height: 600});
        loginWindow.webContents.on('will-navigate', (preventDefault, url) => {
          var matched;
          if(matched = url.match(/\?oauth_token=([^&]*)&oauth_verifier=([^&]*)/)) {
            console.log('oauth_token', matched[1]);
            console.log('oauth_verifier', matched[2]);
            flickr.setOAuthVerifier(matched[2]);
            flickr.getAccessToken( (err, res) => {
              fs.writeFile(userDirPath + "/config.json", JSON.stringify(
                {
                  "access_token":        flickr.options.access_token,
                  "access_token_secret": flickr.options.access_token_secret,
                })
              );
            });
          }
        });
        loginWindow.loadURL(authURL);
      });
    } else {
      console.log("file exist");
      var contents = fs.readFileSync(userDirPath + "/config.json");
      var jsonContent = JSON.parse(contents);
      console.log(jsonContent);
      options.access_token = jsonContent.access_token;
      options.access_token_secret = jsonContent.access_token_secret;
      const flickr = new ElectronFlickr(options);
      console.log(flickr.options);
    }
  });
}

ipcMain.on('upload', (event, arg) => {
  console.log(arg);
  const flickr = new ElectronFlickr(options);
  flickr.upload(arg, (err, res) => {
      console.log("upload" + res.text);
      utils.parseXMLResponse(res.text, (err, data) => {
        getPhoto(data.rsp.photoid);
      });
  });
});

function getPhoto(photoId) {
  const flickr = new ElectronFlickr(options);
  flickr.getPhoto(photoId, (err, res) => {
      console.log("get" + res.text);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
