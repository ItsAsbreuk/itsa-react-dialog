/**
 * Defines a dialog-panel to display messages.
 * Every message that fulfills will get the dialog-content as well as the pressed button as return.
 *
 *
 * <i>Copyright (c) 2014 ITSA - https://github.com/itsa</i>
 * New BSD License - http://choosealicense.com/licenses/bsd-3-clause/
 *
 *
 * @module dialog
 * @class Dialog
 * @since 0.0.1
*/

'use strict';

let maskNode, dialogNode;

const ReactDOM = require('react-dom'),
    MESSAGE_LEVELS = {
        'message': 1,
        'warn': 2,
        'error': 3
    },
    MESSAGE_HASHES = {
        'message': 'messages',
        'warn': 'warnings',
        'error': 'errors'
    },
    MESSAGE_HASHES_NR = {
        1: 'messages',
        2: 'warnings',
        3: 'errors'
    },
    FOLLOWUP_DELAY = 150, // delay when switching between 2 messages
    utils = require('itsa-utils'),
    Event = require('itsa-event'),
    async = utils.async,
    later = utils.later,
    isNode = utils.isNode,
    WINDOW = !isNode && window,
    DOCUMENT = !isNode && document,
    currentMessageLevel = 0,
    dialogMessages = {
        messages: [],
        warnings: [],
        errors: []
    };

if (!isNode && (!WINDOW._ITSA || !WINDOW._ITSA.dialog)) {
    // flag _ITSA.dialog to window, to prevent
    // double creations of the queue, which might happen when different
    // versions are installed simultaniously
    WINDOW._ITSA || (WINDOW._ITSA={});
    WINDOW._ITSA.dialog = true;

   /**
     * Creates a dom-node Panel-instance that will be used to display the messages.
     * Sets instance.model as panel's model and defines model.callback
     * which fulfills the message when a button on the dialog is pressed,
     *
     * @method createContainer
     * @since 0.0.1
     */
    const createContainer = () => {
        maskNode = DOCUMENT.createElement('div'),
        dialogNode = DOCUMENT.createElement('div');

        maskNode.className = 'itsa-react-dialog-mask';
        DOCUMENT.body.appendChild(maskNode);

        dialogNode.className = 'itsa-react-dialog';
        DOCUMENT.body.appendChild(dialogNode);
    };

   /**
     * Tells whether `dialog` is waiting for new messages and is currently iddle.
     *
     * @method isWaiting
     * @return {Boolean} whether `dialog` is waitin g for new messages
     * @since 0.0.1
     */
    const isWaiting = () => {
        return (currentMessageLevel===0);
    };

   /**
     * Processes messages that are emitted by `dialog:*` and adds them in the queue.
     *
     * @method queueMessage
     * @param e {Object} the eventobject
     * @since 0.0.1
     */
    const queueMessage = e => {
        let message;
        const Component = e.Component,
            props = e.props,
            type = e.type,
            level = MESSAGE_LEVELS[type],
            list = dialogMessages[MESSAGE_HASHES[type]];
        message = {
            props,
            Component
        };
        list.push(message);
        Component.processing.itsa_finally(
            function() {
                list.itsa_remove(message);
                // handle the next message (if there)
                handleMessage(true);
            }
        );
        (level>currentMessageLevel) && handleMessage(!isWaiting(), level);
    };

   /**
     * Retrieves the next message from the queue and calls showMessage() if it finds one.
     *
     * @method handleMessage
     * @param [delay] {Boolean} if there should be a delay between the previous dialog and the new one
     * @param [level] {Number} to force handling a specific level
     * @since 0.0.1
     */
    const handleMessage = (delay, level) => {
        let message;
        if (!level) {
            // search level
            if (dialogMessages.errors.length>0) {
                level = 3;
            }
            else if (dialogMessages.warnings.length>0) {
                level = 2;
            }
            else if (dialogMessages.messages.length>0) {
                level = 1;
            }
        }
        if (!level || (dialogMessages[MESSAGE_HASHES_NR[level]].length===0)) {
            currentMessageLevel = 0;
            return;
        }
        currentMessageLevel = level;
        // now process the highest message
        message = dialogMessages[MESSAGE_HASHES_NR[level]][0];
        if (delay) {
            later(showMessage.bind(null, message), FOLLOWUP_DELAY);
        }
        else {
            async(showMessage.bind(null, message));
        }
    };

   /**
     * Shows the specified message-promise.
     *
     * @method showMessage
     * @param reactComponent {Promise} the message to be shown.
     * @since 0.0.1
     */
    const showMessage = message => {
        const Component = message.Component,
            props = message.props;
        // window.scrollTo(0, 0);
        ReactDOM.render(
            <Component {...props} />,
            dialogNode
        );
    };

   /**
     * Defines subscribers to the events: *:message, *:warn and *:error.
     *
     * @method setupListeners
     * @since 0.0.1
     */
    const setupListeners = () => {
        Event.after(['dialog:message', 'dialog:warn', 'dialog:error'], queueMessage);
    };

    createContainer();
    setupListeners();
}
