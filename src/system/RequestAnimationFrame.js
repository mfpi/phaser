/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2014 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* Abstracts away the use of RAF or setTimeOut for the core game update loop.
*
* @class Phaser.RequestAnimationFrame
* @constructor
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {boolean} [forceSetTimeOut=false] - Tell Phaser to use setTimeOut even if raf is available.
*/
Phaser.RequestAnimationFrame = function(game, forceSetTimeOut) {

    if (typeof forceSetTimeOut === 'undefined') { forceSetTimeOut = false; }

    /**
    * @property {Phaser.Game} game - The currently running game.
    */
    this.game = game;

    /**
    * @property {boolean} isRunning - true if RequestAnimationFrame is running, otherwise false.
    * @default
    */
    this.isRunning = false;

    /**
    * @property {boolean} forceSetTimeOut - Tell Phaser to use setTimeOut even if raf is available.
    */
    this.forceSetTimeOut = forceSetTimeOut;

    var vendors = [
        'ms',
        'moz',
        'webkit',
        'o'
    ];

    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; x++)
    {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'];
    }

    /**
    * @property {boolean} _isSetTimeOut  - true if the browser is using setTimeout instead of raf.
    * @private
    */
    this._isSetTimeOut = false;

    /**
    * @property {function} _onLoop - The function called by the update.
    * @private
    */
    this._onLoop = null;

    /**
    * @property {number} _timeOutID - The callback ID used when calling cancel.
    * @private
    */
    this._timeOutID = null;

};

var gameFPS = 60;
var renderFPS = 30;
var gameNow;
var renderNow;
var gameThen = Date.now();
var renderThen = Date.now();
var gameInterval = 1000/gameFPS;
var renderInterval = 1000/renderFPS;

var gameDelta;
var renderDelta;

Phaser.RequestAnimationFrame.prototype = {

    /**
    * Starts the requestAnimationFrame running or setTimeout if unavailable in browser
    * @method Phaser.RequestAnimationFrame#start
    */
    start: function () {

        this.isRunning = true;

        var _this = this;

        if (!window.requestAnimationFrame || this.forceSetTimeOut)
        {
            this._isSetTimeOut = true;

            this._onLoop = function () {
                return _this.updateSetTimeout();
            };

            this._timeOutID = window.setTimeout(this._onLoop, 0);
        }
        else
        {
            this._isSetTimeOut = false;

            this._requestFrame = false;
            this._onLoop = function (time) {
                return _this.updateRAF(time);
            };

            this._timeOutID = window.requestAnimationFrame(this._onLoop);
        }

    },

    /**
    * The update method for the requestAnimationFrame
    * @method Phaser.RequestAnimationFrame#updateRAF
    */
    updateRAF: function () {
        if (this._requestFrame === true) {
            this._timeOutID = window.requestAnimationFrame(function() {});
            this._requestFrame = false;
        }
        
        gameNow = Date.now();
        gameDelta = gameNow - gameThen;

        var step = 1;
        while (gameDelta > gameInterval) {
            this.game.update(gameThen + step*gameInterval);
            this.game.stage.updateTransform();
            gameDelta -= gameInterval;
            step += 1;
        }
        gameThen = gameNow - gameDelta;
        
        renderNow = Date.now();
        renderDelta = renderNow - renderThen;
        while (renderDelta > renderInterval) {
            this._requestFrame = true;
            this.game.render();
            renderDelta -= renderInterval;
        }
        renderThen = renderNow - renderDelta;
        setTimeout (this._onLoop, Math.min((gameInterval-gameDelta, renderInterval-renderDelta)));
    },

    /**
    * The update method for the setTimeout.
    * @method Phaser.RequestAnimationFrame#updateSetTimeout
    */
    updateSetTimeout: function () {

        this.game.update(Date.now());

        this._timeOutID = window.setTimeout(this._onLoop, this.game.time.timeToCall);

    },

    /**
    * Stops the requestAnimationFrame from running.
    * @method Phaser.RequestAnimationFrame#stop
    */
    stop: function () {

        if (this._isSetTimeOut)
        {
            clearTimeout(this._timeOutID);
        }
        else
        {
            window.cancelAnimationFrame(this._timeOutID);
        }

        this.isRunning = false;

    },

    /**
    * Is the browser using setTimeout?
    * @method Phaser.RequestAnimationFrame#isSetTimeOut
    * @return {boolean}
    */
    isSetTimeOut: function () {
        return this._isSetTimeOut;
    },

    /**
    * Is the browser using requestAnimationFrame?
    * @method Phaser.RequestAnimationFrame#isRAF
    * @return {boolean}
    */
    isRAF: function () {
        return (this._isSetTimeOut === false);
    }

};

Phaser.RequestAnimationFrame.prototype.constructor = Phaser.RequestAnimationFrame;
