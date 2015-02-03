ChatRoom = function(optDebug) {
    var onError = function(error) {
        Debug('Error: ' + error);
    }

    var Debug = function(msg) {
        if (api.debug) {
            console.log(msg);
        }
    }

    var api = {
        events: [
            /**
             * The user has connected to the server
             * @event connected
             */
            'connect'

            /**
             * The user has disconnected from the server
             * @event disconnect
             */
          , 'disconnect'

            /**
             * Crap crap crap!
             * @event error
             * @param string Message from the server
             */
          , 'error'

            /**
             * A new room has been created by another user
             * @event openRoom
             * @param string Room name
             */
          , 'openRoom'

            /**
             * A room has been closed
             * @event closeRoom
             * @param string Room name
             */
          , 'closeRoom'

            /**
             * Another use has joined a room the current user is in
             * @event joinRoom
             * @param string Room name
             * @param string Unique ID of the person who joined
             * @param string Display name of the person who joined (make sure to store this in a lookup)
             */
          , 'joinRoom'

            /**
             * Another use has left one of the rooms this user is in
             * @event leftRoom
             * @param string Room name
             * @param string Unique ID of the person who left
             */
          , 'leftRoom'

            /**
             * A message has been received in one of the chat rooms
             * @event message
             * @param string Room the message is sent to
             * @param string Unique ID of the person who sent the message
             * @param string Message received
             */
          , 'message'
        ]

      , debug: optDebug | false

      , setName: function(name) {
            // Name can not be longer than 32 characters

            sess.call('setName', name).then(function() {
            }, onError);
        }

      , join: function(room) {
            // check room name is clean
            // No more than 32 characters
            // Must be alpha numeric

            sess.subscribe(room, function(room, msg) {
                var action = msg.shift();
                msg.unshift(room);

                Debug([action, msg]);

                $(api).trigger(action, msg);
            });
        }

      , leave: function(room) {
            sess.unsubscribe(room);
        }

      , send: function(room, msg) {
            // Message can not be longer than 140 characters

            sess.publish(room, msg);
        }

      , end: function() {
            sess.close();
        }

      , create: function(name, callback) {
            sess.call('createRoom', name).then(function(args) {
                callback(args.id, args.display);
            }, function(args) {
                callback(args.id, args.display);
            });
        }
      , get_groups:function(type, callback) {
          sess.call('get_groups', type,url_or_name).then(function(args) {
              callback(eval("("+args.groups+")"));
          }, function(args) {
        	  callback(eval("("+args.groups+")"));
          });
      }
      , get_users:function(type,url_or_name, callback) {
          sess.call('get_users', type,url_or_name).then(function(args) {
              callback(eval("("+args.users+")"));
          }, function(args) {
        	  callback(eval("("+args.users+")"));
          });
      }
      , regist:function(email,token, callback) {
          sess.call('regist', email,token).then(function(args) {
        	  callback(args);
          }, function(args) {
        	  callback(args);
          });
      }
      ,call:function(command,params,callback_success,callback_fail){
    	  sess.call(command, params).then(function(args) {
    		  callback_success(true,eval("("+args.data+")"),params);
          }, function(args) {
        	  	if( callback_fail )
        	  		callback_fail(false,eval("("+args.data+")"));
        	  	else
        	  		callback_success(false,eval("("+args.data+")"),params);
          });
      }
      , sessionId: ''

      , rooms: {}
    }

    ab._debugrpc    = api.debug;
    ab._debugpubsub = api.debug;
    ab._debugws     = api.debug;
    var sockurl=window.location.hostname.substring(window.location.hostname.indexOf('.')+1);
    var sess = new ab.Session(
        'ws://' + sockurl + ':8080/chat'
      , function() {
            api.sessionId = sess._session_id;

            Debug('Connected! ' + api.sessionId);

            sess.subscribe('ctrl:rooms', function(room, msg) {
                Debug('ctrl:rooms: ' + msg);
                var state = msg.pop();

                if (1 == state) {
                    api.rooms[msg[0]] = msg[1];
                    $(api).trigger('openRoom', msg);
                } else {
                    delete api.rooms[msg[0]];
                    $(api).trigger('closeRoom', msg);
                }
            });

            $(api).trigger('connect');
        }
      , function() {
            Debug('Connection closed');
            $(api).trigger('close');
        }
      , {
            'skipSubprotocolCheck': true
        }
    );
    api.sess=sess;
    return api;
};