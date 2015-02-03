_chatRoomManager =  {
    Chat:{},
    focusRoom :'',

    Joined:[],
    Names:{},
    _users:[],
    
    createAccordian:function (room) {
        var roomName = this.Chat.rooms[room];

        //$('<a href="#" class="groupHead" data-channel="' + room + '">' + roomName + '<span class="notifications none">0</span></a><ul class="users"></ul>').appendTo('#tab-groups');
        //$('<div id="' + room + '" class="chatWindow"></div>').prependTo('#main-view');
    },

    createTab:function (room, roomName) {
        //$('<li data-channel="' + room + '"><a href="#">' + roomName + '<span>Join</span></a></li>').hide().prependTo('#tab-groups').fadeIn('slow');
    	$('<a href="#" class="groupHead" data-channel="' + room + '">' + roomName + '<span class="notifications none">0</span></a><ul class="users"></ul>').appendTo('#tab-groups');
        $('<div id="' + room + '" class="chatWindow"></div>').prependTo('#main-view').hide();
    },

    status: function() {
        var btnStatus;

        return {
            init: function() {
                btnStatus = $('#chat-status');
            }

          , update: function(status) {
                btnStatus.removeClass().addClass('btn');

                switch (status) {
                    case 'online':
                        btnStatus.addClass('btn-success').html('Online');
                    break;
                    case 'connecting':
                        btnStatus.addClass('btn-warning').html('Connecting');
                    break;
                    case 'offline':
                        btnStatus.addClass('btn-inverse').html('Offline');
                    break;
                    case 'error':
                        btnStatus.addClass('btn-danger').html('Offline');
                    break;
                }
            }
        }
    }(),

    focusChannel:function(channel) {
        var objAccordian = $('.groupHead[data-channel="' + channel + '"]');

		$('.groupHead').each(function() {
			$('.open').next('.users').slideUp();
			$('.open').removeClass('open');
		});

		$(objAccordian).next('.users').slideToggle();
		$(objAccordian).toggleClass('open');

		$('#chat-view .active').each(function() {
			$(this).fadeOut();
			$(this).removeClass('active');
		});

		$('#' + channel).fadeIn();
		$('#' + channel).addClass('active');
		this.focusRoom = channel;
		//$('#textbox input').focus();
		objAccordian.children('.notifications').addClass('none').html(0);
    },

    join:function(id) {
        if (-1 !== $.inArray(id, this.Joined)) {
            return false;
        }

        $('li[data-channel="' + id + '"]').addClass('joined');
        $('li[data-channel="' + id + '"] span').html('Leave');

        this.Chat.join(id);
        this.createAccordian(id);
        this.focusChannel(id);

        this.Joined.push(id);
    },

    leave: function (room) {
        $('li[data-channel="' + room + '"]').removeClass('joined');
        $('li[data-channel="' + room + '"] span').html('Join');

        this.Chat.leave(room);

    	$('#' + room).fadeOut('fast', function() { $(this).remove(); });
    	$('.groupHead[data-channel="' + room + '"]').next('.users').fadeOut('fast', function() { $(this).remove(); });
    	$('.groupHead[data-channel="' + room + '"]').fadeOut('fast', function() { $(this).remove() });

    	delete this.Joined[$.inArray(room, this.Joined)];
    },
    update_groups:function(groups){
    	var count=0;
    },
    update_users:function(users){
    	var source   = $("#list-users").html();
    	var template = Handlebars.compile(source);
    	var html    = template(users);
    	$('#tab-users > #side-menu').html(html);
    	console.log(html);
    	console.log($('#tab-users > #side-menu').html());
    },
    init:function() {
    	var listWidth = 0; 
    	var self=this;
    	$(document).delegate('.groupHead','click', function() {
    		self.focusChannel($(this).data('channel'));

    		return false;
    	}); 

    	/*$(document).delegate('#channelList ul li a','click', function() {
        	roomId = $(this).parent('li').data('channel');

        	if (-1 != $.inArray(roomId, Joined)) {
            	leave(roomId);
            } else {
            	join(roomId);
            }

        	return false;
    	});*/

    	$(document).delegate('.add','click',function() {
    		$('#create').fadeIn(500);
    		$('#channelList').animate({opacity: 0}, 300);
    		$('#chat').animate({opacity: 0}, 300);
    		$('#createRoom input').focus();
    		return false;
    	});

    	$('#channelList ul li').each(function() {
    		listWidth = (listWidth + $(this).width()) + 15;
    		$('#channelList ul').width(listWidth);
    	});

    	$('#btn-chat-send').click(function(){
            
    		self.Chat.send(self.focusRoom, $('#textarea').val());
        	$('#textarea').val('');
        });

    	$('#createRoom').submit(function() {
    		var text = $('#createRoom input').val();
    		$('#createRoom input').val('');
    		$('#create').fadeOut(300);
    		$('#channelList').animate({opacity: 1}, 500);
    		$('#chat').animate({opacity: 1}, 500);

            self.Chat.create(text, function(id, disp) {
                self.join(id);
            });

    		return false;
    	});

    	self.status.init();
    	self.status.update('connecting');

    	$('#giveName input').val($.cookie('name'));

   		$('#giveName').fadeIn(500);
   		$('#channelList').animate({opacity: 0}, 300);
   		$('#chat').animate({opacity: 0}, 300);
   		//$('#giveName input').focus();

   		//$('#setName').submit(function(e) {
            //e.preventDefault();
            var Name = _loginedUser.username;//$('#setName input').val();
            var sockurl=window.location.hostname.substring(window.location.hostname.indexOf('.')+1);
            $.cookie('name', Name, {domain: '.' + sockurl});

    		//$('#giveName input').val('');
    		//$('#giveName').fadeOut(300);
    		$('#channelList').animate({opacity: 1}, 500);
    		$('#chat').animate({opacity: 1}, 500);

        	self.Chat  = new ChatRoom();
    
            $(self.Chat).bind('connect', function(e) {
                self.Names[self.Chat.sessionId] = 'Me';
    
                self.status.update('online');
    
                
                self.Chat.regist(_loginedUser.email,_loginedUser.token,function(args){
                	_boot_data.login=args.regist;
                	self.Chat.get_users('team',_boot_data.team.teamdomain, self.update_users);
                	self.Chat.get_groups('all',self.update_groups);
                	
                });
            });
    
            $(self.Chat).bind('close', function(e) {
            	self.status.update('error');
            });
    
            $(self.Chat).bind('message', function(e, room, from, msg, time) {
                if (self.focusRoom != room) {
                	var number = $('.groupHead[data-channel="' + room + '"] .notifications').html();
                	number = parseInt(number) + 1;
                	$('.groupHead[data-channel="' + room + '"] .notifications').html(number).removeClass('none');
                    // update counter
                }
    
                // create div, put in box
                var isMine = (self.Chat.sessionId == from ? ' mine' : '');
                $('<div class="comment' + isMine + '"><h2>' + self.Names[from] + '<br /><span class="timeago" title="' + time + '">' + time + '</span></h2><p>' + msg + '</p></div>').hide().prependTo('#' + room).fadeIn('slow');
                $('.timeago').removeClass('timeago').timeago();
            });
    
            $(self.Chat).bind('openRoom', function(e, roomId, roomName) {
            	self.createTab(roomId, roomName);
            	self.join(roomId);
            	if( self.focusRoom=='')
            		self.focusRoom=roomId;
            });
    
            $(self.Chat).bind('closeRoom', function(e, room) {
            	$('#' + room).fadeOut('fast', function() { $(this).remove(); });
            	$('.groupHead[data-channel="' + room + '"]').next('.users').fadeOut('fast', function() { $(this).remove(); });
            	$('.groupHead[data-channel="' + room + '"]').fadeOut('fast', function() { $(this).remove(); });
            	$('#channelList ul li[data-channel="' + room + '"]').fadeOut('slow', function() { $(this).remove(); });
            });
    
            $(self.Chat).bind('leftRoom', function(e, room, id) {
                // name has left room
                $('#' + id + room).remove();
            });
    
            $(self.Chat).bind('joinRoom', function(e, room, id, name) {
            	self.Names[id] = name;
                $('<li id="' + id + room +'"><span>Indicator</span>' + name + '</li>').appendTo($('.groupHead[data-channel="' + room + '"]').next('.users'));
            });
            
            
            
        //});
    }
};