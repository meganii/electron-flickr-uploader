"use strict";

const crypto = require("crypto");
const {to_json} = require('xmljson');

export default class Utils {

  sign(data, key, secret) {
    const hmacKey = key + "&" + (secret ? secret : '');
    let hmac = crypto.createHmac("SHA1", hmacKey);
    hmac.update(data);
    const digest = hmac.digest("base64");
    return encodeURIComponent(digest);
  }

  encodeRFC5987ValueChars(str) {
    return encodeURIComponent(str).
    replace(/['()!]/g, escape).
    replace(/\*/g, '%2A').
    replace(/%(?:7C|60|5E)/g, unescape);
  }

  formQueryString(queryArguments) {
    return Object.keys(queryArguments)
    .sort()
    .map( (key) => key + "=" + this.encodeRFC5987ValueChars(queryArguments[key]))
    .join("&");
  }

  /**
  * Turn a url + query string into a Flickr API "base string".
  */
  formBaseString(verb, url, queryString) {
    return [verb, encodeURIComponent(url), encodeURIComponent(queryString)].join("&");
  }

  setAuthVals(options) {
    let val = Object.assign({}, options);
    const timestamp = "" + Date.now();
    const md5 = crypto.createHash("md5").update(timestamp).digest("hex");
    const nonce = md5.substring(0, 32);
    val.oauth_timestamp = timestamp;
    val.oauth_nonce = nonce;
    return val;
  }

  parseRestResponse(body) {
    if (!body) { return false; }

    const constituents = body.split("&");
    let response = {};
    let keyval = '';

    constituents.forEach((pair) => {
      keyval = pair.split("=");
      response[keyval[0]] = decodeURIComponent(keyval[1]);
    });

    return response;
  }

  parseXMLResponse(xml, next) {
    to_json(xml, function (error, data) {
        next(error, data);
    });
  }
}
