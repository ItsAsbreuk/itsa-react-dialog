/**
 * Creating floating Panel-nodes which can be shown and hidden.
 *
 *
 * <i>Copyright (c) 2014 ITSA - https://github.com/itsa</i>
 * New BSD License - http://choosealicense.com/licenses/bsd-3-clause/
 *
 *
 * @module messages
 * @class Messages
 * @since 0.0.1
*/

require('js-ext');
require('polyfill');
require('polyfill/lib/promise.js');

(function (global) {

    "use strict";

    var NAME = '[messages]: ',
        MESSAGE_LEVELS = {
            1: 'message',
            2: 'warn',
            3: 'error',
            4: 'statusmessage' // message that should hold for minimum time, and/or removes by itself (IO uses these)
        },
        PromiseClass = require("itsa-utils").Promise,
        createHashMap = require('js-ext/extra/hashmap.js').createMap,
        later = require('utils').later,
        messages, Event;

    global._ITSAmodules || Object.protectedProp(global, '_ITSAmodules', createHashMap());

/*jshint boss:true */
    if (messages=global._ITSAmodules.messages) {
/*jshint boss:false */
        module.exports = messages; // messages was already created
        return;
    }

    Event = require('itsa-event');

    messages = {
        /**
         * Sends a message (emits) and returns a promise. All option-properties will be merged into the promise.
         * (even when not defined in the api)
         *
         * @method message
         * @param message {String} The message to be send
         * @param [options] {Object} The instance that is going to detach the customEvent
         * @param [options.emitter='global'] {String} the emitter of the message, will be used as emitterName of the customEvent.
         * @param [options.icon] {String} an icon-name to be used (fe "alert"). The icon-name should be defined by the `icons`-module.
         * @param [options.level=1] {Number} The level --> 1='message', 2='warn', 3='error', 4='statusmessage'.
         * @param [options.header] {String} Can be used by a messagehandler to render the header.
         * @param [options.footer] {String} Can be used by a messagehandler to render the footer.
         * @param [options.timeout] {Number} When specified, the promise will be resolved after this period of time.
         * @param [options.stayActive] {Number} When specified, the promise won't resolved within this period of time.
         * @return {Promise}
         * @since 0.0.1
        */
        message: function(message, options) {
            var messagePromise = PromiseClass.manage(),
                emitter, level, timeout, icon, stayActive;
            message || (message='');
            options || (options={});
            emitter = options.emitter || 'global';
            icon = options.icon;
            level = MESSAGE_LEVELS[options.level] || MESSAGE_LEVELS[1];
            timeout = options.timeout;
            stayActive = options.stayActive;
            messagePromise.merge(options);
            stayActive && messagePromise.stayActive(stayActive);
            if (icon) {
                message = '<div class="dialog-message-icon"><i icon="'+icon+'"></i></div><div class="dialog-message">'+message+'</div>';
            }
            messagePromise.content = message;
            if ((typeof timeout==='number') && (timeout>0)) {
                // with nothing to notify it was timeout
                later(messagePromise.fulfill, timeout);
            }
            Event.emit(options.target || global, emitter+':'+level, {messagePromise: messagePromise});
            return messagePromise;
        },

        /**
         * Sends a simple message
         *
         * @method alert
         * @param message {String} The message to be send
         * @param [icon] {String} an icon-name to be used (fe "alert"). The icon-name should be defined by the `icons`-module.
         * @return {Promise}
         * @since 0.0.1
        */
        alert: function(message, icon) {
            return this.message(message, {
                footer: '<button class="pure-button pure-button-primary">Ok</button>',
                icon: icon
            });
        },

        /**
         * Sends a simple confirmation
         *
         * @method confirm
         * @param message {String} The message to be send
         * @param [icon] {String} an icon-name to be used (fe "alert"). The icon-name should be defined by the `icons`-module.
         * @return {Promise}
         * @since 0.0.1
        */
        confirm: function(message, icon) {
            return this.message(message, {
                footer: '<button is="no" class="pure-button">No</button><button is="yes" class="pure-button pure-button-primary">Yes</button>',
                icon: icon
            }).then(function(container) {
                var button = container.getElement('button');
                return (button.getAttr('is')==='yes');
            }, function(err) {alert(err);});
        },

        /**
         * Sends a warning-message.
         *
         * @method warn
         * @param message {String} The message to be send
         * @return {Promise}
         * @since 0.0.1
        */
        warn: function(message) {
            return this.message(message, {
                footer: '<button class="pure-button pure-button-primary">Ok</button>',
                icon: 'alert',
                level: 2
            });
        },
        /**
         * Sends a prompt-message with an input-element.
         *
         * @method prompt
         * @param message {String} The message to be send
         * @param [options] {Object} The instance that is going to detach the customEvent
         * @param [options.emitter='global'] {String} the emitter of the message, will be used as emitterName of the customEvent.
         * @param [options.defaultValue] {String} input's default value.
         * @param [options.label] {String} The label for the input-element.
         * @param [options.placeholder] {String} The placeholder for the input-element.
         * @param [options.icon] {String} an icon-name to be used (fe "alert"). The icon-name should be defined by the `icons`-module.
         * @param [options.header] {String} Can be used by a messagehandler to render the header.
         * @param [options.footer] {String} Can be used by a messagehandler to render the footer.
         * @param [options.level=1] {Number} The level --> 1='message', 2='warn', 3='error', 4='statusmessage'.
         * @param [options.timeout] {Number} When specified, the promise will be resolved after this period of time.
         * @param [options.stayActive] {Number} When specified, the promise won't resolved within this period of time.
         * @return {Promise}
         * @since 0.0.1
        */
        prompt: function(message, options) {
            var placeholder, defaultValue, label, icon;
            options || (options={});
            defaultValue = options.defaultValue;
            label = options.label;
            icon = options.icon;
            defaultValue = defaultValue ? ' value="'+defaultValue+'"' : '';
            placeholder = placeholder ? ' placeholder="'+placeholder+'"' : '';
            if ((typeof message ==='string') || (message!=='')) {
                message = '<div class="dialog-prompt">'+message+'</div>';
            }
            else {
                message = '';
            }
            label = (typeof label==='string') ? (label='<label for="iprompt">'+label+'</label>') : '';
            return this.message(
                '<div class="pure-form">'+message+label+'<input id="iprompt" type="text"'+placeholder+defaultValue+' fm-defaultitem="true" fm-primaryonenter="true"></div>',
                {
                    footer: '<button is="cancel" class="pure-button">Cancel</button><button is="ok" class="pure-button pure-button-primary">Ok</button>',
                    icon: icon
                }
            ).then(function(container) {
                var button = container.getElement('button');
                if (button.getAttr('is')==='ok') {
                    return container.getElement('input').getValue();
                }
            });
        },
        /**
         * To catch syste-errors into the message system. When set, errors won't appear in the console.
         *
         * @method catchErrors
         * @param catchOrNot {Boolean} Whether errors should be catched or not.
         * @since 0.0.1
        */
        catchErrors: function(catchOrNot) {
            // DO NOT use `this` --> when merged, `this` will become the host
            // while `global.onerror` refers to `messages`
            messages._catchErrors = catchOrNot;
        }
    };

    global.onerror = function(msg, url, line) {
        if (messages._catchErrors) {
            messages.message(msg, {
                header: 'Javascript-error (line '+line+')',
                footer: url,
                icon: 'error',
                level: 3
            });
            return true;
        }
    };

    module.exports = messages;

}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this));
