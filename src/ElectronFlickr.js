"use strict";
import Utils from "./Utils";
const utils = new Utils();
import request from 'superagent';

export default class ElectronFlickr {
     constructor(options) {
        this.options = options;
    }

    getRequestTokenURL() {
        this.options = utils.setAuthVals(this.options);
        var url = "https://www.flickr.com/services/oauth/request_token";
        var queryArguments = {
            oauth_callback:         this.options.callback,
            oauth_consumer_key:     this.options.api_key,
            oauth_nonce:            this.options.oauth_nonce,
            oauth_timestamp:        this.options.oauth_timestamp,
            oauth_signature_method: "HMAC-SHA1",
            oauth_version:          "1.0",
        };

        const queryString = utils.formQueryString(queryArguments);
        const data = utils.formBaseString("GET", url, queryString);
        const signature = utils.sign(data, this.options.secret, this.options.access_token_secret);
        const flickrURL = url + "?" + queryString + "&oauth_signature=" + signature;
        return flickrURL;
    }

    getAuthToken(url, next) {
        request
            .get(url)
            .end( (err, res) => {
                const response = utils.parseRestResponse(res.text)
                this.options.oauth_token = response.oauth_token;
                this.options.oauth_token_secret = response.oauth_token_secret;
                next(err, res);
            });
    }

    getAuthURL() {
        const authURL = "https://www.flickr.com/services/oauth/authorize";
        return authURL + "?oauth_token=" + this.options.oauth_token + "&perms=" + this.options.permissions;
    }

    setOAuthVerifier(oauthVerifier) {
        this.options.oauth_verifier = oauthVerifier;
    }

    getAccessToken(next) {
        this.options = utils.setAuthVals(this.options);
        var queryArguments = {
                oauth_consumer_key:     this.options.api_key,
                oauth_nonce:            this.options.oauth_nonce,
                oauth_signature_method: "HMAC-SHA1",
                oauth_timestamp:        this.options.oauth_timestamp,
                oauth_verifier:         this.options.oauth_verifier,
                oauth_token:            this.options.oauth_token,
            };
        const queryString = utils.formQueryString(queryArguments);
        const url = "https://www.flickr.com/services/oauth/access_token";
        const data = utils.formBaseString("GET", url, queryString);
        const signature = utils.sign(data, this.options.secret, this.options.oauth_token_secret);
        const flickrURL = url + "?" + queryString + "&oauth_signature=" + signature;

        request
            .get(flickrURL)
            .end( (err, res) => {
                const response = utils.parseRestResponse(res.text)
                this.setAccessToken(response.oauth_token, response.oauth_token_secret);
                next(err, res);
            });
    }

    setAccessToken(accessToken, accessTokenSecret) {
        this.options.access_token = accessToken;
        this.options.access_token_secret = accessTokenSecret;
    }

    login(next) {
        this.options = utils.setAuthVals(this.options);
        var queryArguments = {
            method:                 "flickr.test.login",
            oauth_consumer_key:     this.options.api_key,
            oauth_nonce:            this.options.oauth_nonce,
            oauth_timestamp:        this.options.oauth_timestamp,
            oauth_signature_method: "HMAC-SHA1",
            oauth_version:          "1.0",
            oauth_token:            this.options.access_token,
        };

        const queryString = utils.formQueryString(queryArguments);
        const url = "https://api.flickr.com/services/rest";
        const data = utils.formBaseString("GET", url, queryString);
        const signature = utils.sign(data, this.options.secret, this.options.access_token_secret);
        const flickrURL = url + "?" + queryString + "&oauth_signature=" + signature;

        request
            .get(flickrURL)
            .end( (err, res) => {
                next(err, res);
            });
    }

    upload(photoPath, next) {
        this.options = utils.setAuthVals(this.options);
        var queryArguments = {
            oauth_consumer_key:     this.options.api_key,
            oauth_nonce:            this.options.oauth_nonce,
            oauth_timestamp:        this.options.oauth_timestamp,
            oauth_signature_method: "HMAC-SHA1",
            oauth_version:          "1.0",
            oauth_token:            this.options.access_token,

        };
        const url = "https://up.flickr.com/services/upload/";
        const queryString = utils.formQueryString(queryArguments);
        const data = utils.formBaseString("POST", url, queryString);
        const signature = utils.sign(data, this.options.secret, this.options.access_token_secret);
        const flickrURL = url + "?" + queryString + "&oauth_signature=" + signature;

        request
            .post(flickrURL)
            .field('oauth_consumer_key',     queryArguments.oauth_consumer_key)
            .field('oauth_nonce',            queryArguments.oauth_nonce)
            .field('oauth_timestamp',        queryArguments.oauth_timestamp)
            .field('oauth_signature_method', queryArguments.oauth_signature_method)
            .field('oauth_version',          queryArguments.oauth_version)
            .field('oauth_token',            queryArguments.oauth_token)
            .field('oauth_signature',        signature)
            .attach('photo', photoPath)
            .end( (err, res) => {
                next(err, res);
            });
    }
}
