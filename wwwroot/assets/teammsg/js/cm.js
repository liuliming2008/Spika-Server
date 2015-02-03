var CM={
	sock: null,
	reconnect: function(){
		
	},
	initApp: function(){
		CM.boot_data = boot_data;
		try{
			CM.sock  = new ChatRoom();
			CM.api = CM.sock;
		}catch(e){
			var timer=setTimeout("CM.initApp()", 3000);
			CM.info('Socket connect faild, will try in 3000ms');
			return;
		}
		$(CM.sock).bind('channels.sendmsg', function(e, topic, msg) {
			var channel = CM.channels.getChannelById(msg['to_group_id']);
            if (!channel) {
                CM.error('unknown channel "' + msg['to_group_id'] + '"');
                return
            }
            var msgs = channel.msgs;
            if(!msgs){
            	CM.sock.call('channels.getmsgs',{id:channel.id},function(status,data,params) {
            		var item;
	              	  for (var index = 0; index < data.msgs.length; index++) {
	                        item = data.msgs[index];
	                        item['is_ephemeral']=false;
	                        item['no_display']=false;
	              	  }
            		channel.msgs=data.msgs;
            		CM.channels.addMsg(msg['to_group_id'],msg);	
                });
            	
            }
            else
            	CM.channels.addMsg(msg['to_group_id'],msg);
		});
		$(CM.sock).bind('groups.sendmsg', function(e, topic, msg) {
			var group = CM.groups.getGroupById(msg['to_group_id']);
            if (!group) {
                CM.error('unknown group "' + msg['to_group_id'] + '"');
                return
            }
            var msgs = group.msgs;
            if(!msgs){
            	CM.sock.call('channels.getmsgs',{id:channel.id},function(status,data,params) {
            		var item;
	              	  for (var index = 0; index < data.msgs.length; index++) {
	                        item = data.msgs[index];
	                        item['is_ephemeral']=false;
	                        item['no_display']=false;
	              	  }
	              	group.msgs=data.msgs;
            		CM.groups.addMsg(msg['to_group_id'],msg);	
                });
            	
            }
            else
			CM.groups.addMsg(msg['to_group_id'],msg);
		});
		$(CM.sock).bind('ims.sendmsg', function(e, topic, msg) {
			var im = CM.ims.getImById(msg['to_group_id']);
            if (!im) {
                CM.error('unknown channel "' + msg['to_group_id'] + '"');
                return
            }
            var msgs = im.msgs;
            if(!msgs){
            	CM.sock.call('channels.getmsgs',{id:im.id},function(status,data,params) {
            		var item;
	              	  for (var index = 0; index < data.msgs.length; index++) {
	                        item = data.msgs[index];
	                        item['is_ephemeral']=false;
	                        item['no_display']=false;
	              	  }
	              	im.msgs=data.msgs;
            		CM.ims.addMsg(msg['to_group_id'],msg);	
                });
            	
            }
            else
            	CM.ims.addMsg(msg['to_group_id'],msg);
		});
		$(CM.sock).bind('close', function(e, topic, msg) {
			var timer=setTimeout("CM.initApp()", 3000)
			//var timer=0;
		});
		
		$(CM.sock).bind('connect', function(e) {
            //self.Names[self.Chat.sessionId] = 'Me';
			window.ui=CM.ui;
			window.model=CM.model;
			window.menu=CM.menu;
			window.view=CM.view;
			CM.sock.regist(boot_data.user.email,boot_data.user.token,boot_data.team.teamdomain,function(args){
				boot_data.login=args.regist;
            	/*sess.call('set_online_status', 'online').then(function(args) {
            		self.updatePresence('online');
                }, function(args) {
                	self.updatePresence('online');
                });*/
				if(!boot_data.login)
					return;
				CM.sock.call('get_run_data2',{teamdomain:boot_data.team.teamdomain},function(status,data,params) {
					//self.model=eval("("+args.data+")");
					var item;
					for (var index = 0; index < data.members.length; index++) {
						item = data.members[index];
					    item._name_lc=CM.utility.getLowerCaseValue(item.name);
					}
					for (var index = 0; index < data.channels.length; index++) {
						item = data.channels[index];
						item.num_members=item.members.length;
						item.needs_api_marking = false;
						item.purpose=eval("("+item.description+")");
						
						if( item.is_member )
							CM.sock.join(""+item.id);
					//                    	  CM.sock.call('channels.join',{groupid:item.id},function(status,data,params) {
					//                    		CM.track(status+" join "+params["groupid"]);  
					//                    	  });
					}
					for (var index = 0; index < data.groups.length; index++) {
						item = data.groups[index];
						item.num_members=item.members.length;
						item.needs_api_marking = false;
						CM.sock.join(""+item.id);
					//                      CM.sock.call('channels.join',{groupid:item.id},function(status,data,params) {
					//                  		CM.track(status+" join "+params["groupid"]);  
					//                  	  });
					}
					for (var index = 0; index < data.ims.length; index++) {
						item = data.ims[index];
						//item['user'] = CM.members.getMemberById(item['user']);
						item.needs_api_marking = false;
						if( item.is_open )
							CM.sock.join(""+item.id);
					//	                      CM.sock.call('channels.join',{groupid:item.id},function(status,data,params) {
					//	                  		CM.track(status+" join "+params["groupid"]);  
					//	                  	  });
					}
					  
					$.extend(CM.model,data);
					
					
					CM.utility.onStart();
					CM.model.onStart();
					CM.channels.onStart();
					CM.templates.onStart();
					
					CM.menu.onStart();
					CM.view.onStart();		
					CM.ui.onStart();
					CM.client.onStart();
					CM.kb_nav.onStart();
					//    	            	CM.view.displayTitle();
					
					//    	            	CM.view.update_groups();
					//    	            	CM.view.rebuildChannelList();
					$("#connection_div").css("display","none");
					$("#channels_scroller").css({visibility:"visible"});
					//$("#message-form").css({height:"41px"});
					//$("#primary_file_button").css({height:"41px"});
					//CM.view.rebuildAll();
					   
					var channel = CM.channels.getGeneralChannel();
					CM.sock.call('channels.getmsgs',{id:channel.id},function(status,data,params) {
						var item;
						for (var index = 0; index < data.msgs.length; index++) {
							item = data.msgs[index];
							item['is_ephemeral']=false;
							item['no_display']=false;
						}
						channel.msgs=data.msgs;
						//    	            		CM.view.rebuildMsgs();
						//    	            		CM.view.focusMessageInput();
						//    	            		CM.view.resize();
						CM.model.active_channel_id = CM.model.active_cid = channel['id'];
						CM.ui.markAllRead(CM.model.active_channel_id);
						CM.view.rebuildAll();
						//    	            		CM.view.resize();
						//    	            		$("#channels_scroller").getNiceScroll().resize();
						//    	            		$("#msgs_scroller_div").getNiceScroll().resize();      
						//    	            		$("#channels_scroller").getNiceScroll().show();
						//    	            		$("#msgs_scroller_div").getNiceScroll().show();      
						CM.view.scrollToTop("#channels_scroller");
						CM.view.scrollToBottom("#msgs_scroller_div");
					});
					$(CM.sock).subscribe('ctrl:rooms', function(room, msg) {
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
				});
			});
		});
		
	},
	getChannelImGroupById: function(id){
		var ret = CM.channels.getChannelById(id);
		if(ret)
			return ret;
		var ret = CM.groups.getGroupById(id);
		if(ret)
			return ret;
		var ret = CM.ims.getImById(id);
		if(ret)
			return ret;
		
	},
	channels:{
		
        switched_sig: new signals.Signal(),
        
        joined_sig: new signals.Signal(),
        member_joined_sig: new signals.Signal(),
        left_sig: new signals.Signal(),
        member_left_sig: new signals.Signal(),
        list_fetched_sig: new signals.Signal(),
        history_fetched_sig: new signals.Signal(),
        history_being_fetched_sig: new signals.Signal(),
        message_received_sig: new signals.Signal(),
        message_removed_sig: new signals.Signal(),
        message_changed_sig: new signals.Signal(),
        marked_sig: new signals.Signal(),
        unread_changed_sig: new signals.Signal(),
        unread_highlight_changed_sig: new signals.Signal(),
        topic_changed_sig: new signals.Signal(),
        purpose_changed_sig: new signals.Signal(),
        created_sig: new signals.Signal(),
        deleted_sig: new signals.Signal(),
        renamed_sig: new signals.Signal(),
        archived_sig: new signals.Signal(),
        unarchived_sig: new signals.Signal(),
        msg_not_sent_sig: new signals.Signal(),
        data_retention_changed_sig: new signals.Signal(),

        onStart: function() {
//        	var channel=CM.channels.getGeneralChannel();
//        	CM.model.active_channel_id=channel.id;
        },
        addMsg: function(channel_id, msg) {
            var channel = CM.channels.getChannelById(channel_id);
            if (!channel) {
                CM.error('unknown channel "' + channel_id + '"');
                return
            }
            var msgs = channel.msgs;
            msgs.unshift(msg);
            CM.channels.message_received_sig.dispatch(channel, msg)
        },
        generalChannel:null,
        getGeneralChannel:function(){
        	if (CM.channels.generalChannel) {
                return CM.channels.generalChannel
            }
        	var channels = CM.model.channels;
        	for (var g = 0; g < channels.length; g++) {
            	channel = channels[g];
                if (channel.is_general ) {
                	CM.channels.generalChannel = channel;
                    return CM.channels.generalChannel;
                }
            }
		},
		
		channelsbyid: [],
		getChannelById:function(id){
			var channels = CM.model.channels;
            var channel = CM.channels.channelsbyid[id];
            if (channel) {
                return channel
            }
            if (!channels) {
                return null
            }
            for (var g = 0; g < channels.length; g++) {
            	channel = channels[g];
                if (channel.id == id ) {
                	 CM.channels.channelsbyid[id] = channel;
                    return channel
                }
            }
            return null
		},
		channelsbyname: [],
		getChannelByName: function(name) { 
            var channels = CM.model.channels;
            var channel = this.channelsbyname[name];
            if (channel) {
                return channel
            }
            if (!channels) {
                return null
            }
            for (var g = 0; g < channels.length; g++) {
            	channel = channels[g];
                if (channel.name == name ) {
                    this.channelsbyname[name] = channel;
                    return channel
                }
            }
            return null
        },
        getChannelsForUser: function() {
            if (!CM.model.user.is_restricted) {
                return CM.model.channels
            }
            var channels;
            channels.length = 0;
            var channel;
            for (var e = 0; e < CM.model.channels.length; e++) {
            	channel = CM.model.channels[e];
                if (!channel.is_member) {
                    continue;
                }
                channels.push(channel)
            }
            return channels
        },
        getUnarchivedChannelsForUser: function() {
        	var channels;
        	channels.length = 0;
            var channelsForUser = CM.channels.getChannelsForUser();
            var g;
            for (var f = 0; f < channelsForUser.length; f++) {
                g = channelsForUser[f];
                if (g.is_archived) {
                    continue;
                }
                channels.push(g)
            }
            return channels
        },

        insertUpdateChannel: function(channel) {
            var channels = CM.model.channels;
            var channelbyid = CM.channels.getChannelById(channel.id);
            var h;
            if (channelbyid) {
                CM.log(4, 'updating existing channel "' + channel.id + '"');
                for (var g in channel) {
                    if (g == "members") {
                        h = channel.members;
                        channelbyid.members.length = 0;
                        for (var l = 0; l < h.length; l++) {
                            channelbyid.members.push(h[l])
                        }
                    } else {
                        channelbyid[g] = channel[g]
                    }
                }
                channel = channelbyid;
                //if (channel.is_member) {
                //    CM.shared.checkInitialMsgHistory(channel, CM.channels)
                //}
            } else {
                CM.log(4, 'adding channel "' + channel.id + '"');
                channels.push(channel);
                if (channel.is_channel !== true) {
                    CM.warn(channel.name + " lacked the is_channel flag from the server");
                    channel.is_channel = true
                }
                channel.is_general = !!channel.is_general;
                channel._name_lc = CM.utility.getLowerCaseValue(channel.name);
                CM.channels.channelsbyid[channel.id] = channel;
                CM.channels.channelsbyname[channel._name_lc] = channel;
                CM.channels.channelsbyname["#" + channel._name_lc] = channel;
                if (!channel.members) {
                    channel.members = []
                }
                if (!channel.topic) {
                    channel.topic = {}
                }
                if (!channel.purpose) {
                    channel.purpose = {}
                }
                if (!channel.unread_count) {
                    channel.unread_count = 0
                }
                channel.active_members = [];
                channel.is_member = !!channel.is_member;
                //m.oldest_msg_ts = CM.storage.fetchOldestTs(m.id);
                //m.last_msg_input = CM.storage.fetchLastMsgInput(m.id);
                //m.scroll_top = -1;
                //m.history_is_being_fetched = false;
                //m.needs_api_marking = false;
                channel.unread_highlight_cnt = 0;
                channel.unread_highlights = [];
                channel.unread_cnt = 0;
                channel.unreads = [];
                channel.oldest_unread_ts = null;
                /*m.has_fetched_history_after_scrollback = false;
                if (CM.client) {
                    var f = (m.is_member) ? CM.utility.msgs.fetchInitialMsgsFromLS(m) : [];
                    CM.utility.msgs.setMsgs(m, f)
                } else {
                    if (CM.boot_data.msgs) {
                        CM.utility.msgs.ingestMessagesFromBootData(m)
                    }
                } if (CM.model.created_channels[m.name]) {
                    m.needs_created_message = true;
                    delete CM.model.created_channels[m.name]
                }*/
            }
            /*if (m.is_member && m.is_archived) {
                CM.error("channel.is_member and channel.is_archived are both true for " + m.id + " #" + m.name);
                CM.dir(0, m);
                m.is_member = false
            }
            if (CM.client) {
                var n = CM.utility.msgs.shouldMarkUnreadsOnMessageFetch();
                CM.channels.calcUnreadCnts(m, n)
            }
            CM.channels.calcActiveMembersForChannel(m);*/
            return channel
        },
        removeChannel: function(channel) {
            var channels = CM.model.channels;
            CM.log(4, 'removing channel "' + channel.id + '"');
            var h;
            for (var f = 0; f < channels.length; f++) {
                h = channels[f];
                if (h.id == channel.id) {
                    channels.splice(f, 1);
                    break;
                }
            }
            delete channelsbyid[channel.id];
            delete channelsbyname[channel._name_lc];
            delete channelsbyname["#" + channel._name_lc];
            /*if (CM.client) {
                if (CM.model.active_channel_id == channel.id) {
                    CM.client.activeChannelDisplayGoneAway()
                }
            }*/
            //channel.msgs.length = 0;
            //CM.storage.storeMsgs(channel.id, null);
            //CM.channels.deleted_sig.dispatch(channel)
        },
        channelRenamed: function(channel) {
            var e = CM.channels.getChannelById(channel.id);
            delete channelsbyname[e._name_lc];
            delete channelsbyname["#" + e._name_lc];
            var newchannel = CM.channels.insertUpdateChannel(channel);
            newchannel._name_lc = CM.utility.getLowerCaseValue(newchannel.name);
            channelsbyname[newchannel._name_lc] = newchannel;
            channelsbyname["#" + newchannel._name_lc] = newchannel;
            //CM.channels.renamed_sig.dispatch(f)
        },
        createChannel: function(channel,func){
        	if (!channel.name) {
                return
            }
        	if (!CM.channels.getChannelByName(channel.name)) {
                if (CM.model.created_channels[channel.name]) {
                    return
                }
                CM.model.created_channels[channel.name] = true
            }
        	CM.sock.call('channels.create',{name:channel.name,purpose:channel.purpose},function(status,data,params) {
            	CM.channels.onJoin(status,data,params);
            	if (func) {
                	func(status,data,params)
                }
            	if (!status) {
                    delete CM.model.created_channels[channel.name]
                }

            });

        },
		join: function(channel, func) {
            if (CM.model.user.is_restricted) {
                return
            }
            if (!channel) {
                return
            }
            
            CM.sock.call('channels.join',{id:channel.id},function(status,data,params) {
            	CM.channels.onJoin(status,data,params);
            	if (func) {
                	func(status,data,params)
                }
            	if (!status) {
                    delete CM.model.created_channels[channel.name]
                }

            });
            
        },
        onJoin: function(status,data,params) {
            if (!status) {
            	alert("failed to join channel");
                return
            }
            var channel_id;
            if (data.channel) {
                var channel = CM.channels.insertUpdateChannel(data.channel);
                channel_id = data.channel.id
            }
            if (!channel_id) {
                CM.error("no channel_id?!!");
                return
            }
            var send_txt = "";
            /*if (CM.model.requested_channel_joins[channel_id]) {
                send_txt = CM.model.requested_channel_joins[channel_id].and_send_txt;
                delete CM.model.requested_channel_joins[channel_id]
            }*/
            if (!channel) {
                CM.error("no channel?!!");
                return
            }
            if (!channel.needs_created_message) {
                channel.needs_joined_message = true
            }
            CM.channels.displayChannel(channel_id, send_txt)
        },

        displayChannel: function(channel_id, send_text, k, g) {

            var channel = CM.channels.getChannelById(channel_id);
            if (!channel) {
                CM.error('channel "' + channel_id + '" unknown');
                return
            }
            if (channel_id == CM.model.active_channel_id ) {
                CM.warn('channel "' + channel_id + '" already displayed');
                if (send_text) {
                    CM.channels.sendMsg(channel_id, $.trim(f))
                }
                return
            }
            if (!channel.is_member || channel.is_archived) {
                return
            }
            
            
            if (CM.client.channelDisplaySwitched(channel_id, null, null)) {
                CM.channels.switched_sig.dispatch()
            }
            if (send_text) {
                CM.channels.sendMsg(channel_id, $.trim(f))
            }    
        },
        sendMsg: function(id, content, type, subtype) {
            var j = CM.channels.getChannelById(id);
            if (!j) {
                return false
            }
            if (j.is_archived) {
                return false
            }
            if (!j.is_member) {
                return false
            }
            return CM.shared.sendMsg('channels.sendmsg', id, content, CM.channels, type, subtype)
        },
        onSendMsg: function(status, data, params) {
            var activeOb = CM.channels.getChannelById(params['id']);
            CM.shared.onSendMsg(status, data, params, activeOb, CM.channels)
        },

        markMostRecentReadMsg:function(channel){
        	
        },
        onMarked:function(){
        	
        },
        setPurpose: function(channelid,purpose){
        	
        },
        leave: function(id) {
            if (CM.model.user.is_restricted) {
                return
            }
            var channel = CM.channels.getChannelById(id);
            if (!channel) {
                return
            }
            if (channel.is_general) {
                CM.generic_dialog.alert("Sorry, you can't leave <b>#" + channel.name + "</b>!");
                return
            }
//            CM.channels.markMostRecentReadMsg(channel);
            CM.client.markLastReadsWithAPI(id);
            CM.api.call("channels.leave", {
                channel: id
            }, CM.channels.onLeave)
        },
        onLeave: function(f, h, e) {
            if (!f) {
                CM.error("failed to leave channel");
                return
            }
            var ch = CM.channels.getChannelById(e.channel);
            if (!ch) {
                CM.error('wtf no channel "' + e.channel + '"');
                return
            }
            if(  ch.msgs ){
            	ch.msgs.length = 0;
                CM.storage.storeMsgs(ch.id, null);
            }
            
            ch.is_member = false;
            var ch_general = CM.channels.getGeneralChannel();
            CM.channels.displayChannel(ch_general.id);
        },
        makeMembersWithPreselectsForTemplate: function(e, f) {
            f = f || [];
            var g = [];
            for (var h = 0; h < e.length; h++) {
                var k = e[h];
                var j = f.indexOf(k.id) != -1;
                g[h] = {
                    member: k,
                    preselected: j
                }
            }
            return g
        },
        getActiveMembersNotInThisChannelForInviting: function(channel_id, h) {
            var g = [];
            var k = h || CM.model.user.is_admin;
            if (model.user.is_ultra_restricted) {
                returnCM. g
            }
            var channel = CM.channels.getChannelById(channel_id);
            if (!channel) {
                return g
            }
            var l;
            var f = CM.members.getActiveMembersWithSelfAndNotSlackbot();
            for (var e = 0; e < f.length; e++) {
                l = f[e];
                if (l.is_ultra_restricted) {
                    continue;
                }
                if (!k && l.is_restricted) {
                    continue;
                }
                if (channel.members.indexOf(l.id) == -1) {
                    g.push(l)
                }
            }
            return g
        },
        calcActiveMembersForChannel: function(f) {
            f.active_members.length = 0;
            if (!f.members) {
                return
            }
            var g;
            for (var e = 0; e < f.members.length; e++) {
                g = CM.members.getMemberById(f.members[e]);
                if (!g) {
                    continue;
                }
                if (g.deleted) {
                    continue;
                }
                f.active_members.push(g.id)
            }
        },
        calcActiveMembersForAllChannels: function() {
            var e = CM.model.channels;
            for (var f = 0; f < e.length; f++) {
                CM.channels.calcActiveMembersForChannel(e[f])
            }
        },
        fetchList: function() {
            CM.api.call("channels.list", {}, CM.channels.onListFetched)
        },
        onListFetched: function(f, g, e) {
            if (!f) {
                CM.error("failed to fetch channel list");
                return
            }
            $.each(g.channels, function(h, j) {
                CM.channels.upsertChannel(j)
            });
            CM.channels.list_fetched_sig.dispatch(g.channels)
        },
        kickMember: function(j, e) {
            if (!CM.members.canUserKickFromChannels()) {
                return
            }
            var f = CM.channels.getChannelById(j);
            if (!f) {
                return
            }
            var h = CM.members.getMemberById(e);
            if (!h) {
                return
            }
            if (f.members.indexOf(h.id) == -1) {
                CM.generic_dialog.alert("<b>" + CM.members.getMemberDisplayName(h, true) + "</b> is not a member of #" + f.name + ".");
                return
            }
            var g = CM.members.getMemberDisplayName(h, true);
            CM.generic_dialog.start({
                title: "Remove " + g,
                body: "<p>Are you sure you wish to remove <b>" + g + "</b> from #" + f.name + "?</p>",
                go_button_text: "Yes, remove them",
                on_go: function() {
                    CM.api.call("channels.kick", {
                        channel: j,
                        user: e
                    }, function(l, m, k) {
                        if (!l) {
                            var n = 'Kicking failed with error "' + m.error + '"';
                            if (m.error == "cant_kick_from_last_channel") {
                                n = "<b>" + g + "</b> can't be kicked from #" + f.name + " because they must belong to at least one channel or group."
                            } else {
                                if (m.error == "restricted_action") {
                                    n = "<p>You don't have permission to kick from channels.</p><p>Talk to your team owner.</p>"
                                }
                            }
                            setTimeout(CM.generic_dialog.alert, 500, n)
                        }
                    })
                }
            })
        },

	},
	storage:{
		msgs:[],
		storeMsgs: function(id,msgs){
			CM.storage.msgs[id]=msgs;
		}
	},
	groups:{
		switched_sig: new signals.Signal(),
		message_received_sig: new signals.Signal(),
		
		onStart: function() {
        },
        addMsg: function(group_id, msg) {
            var group = CM.groups.getGroupById(group_id);
            if (!group) {
                CM.error('unknown channel "' + group_id + '"');
                return
            }
            var msgs = group.msgs;
            msgs.unshift(msg);
            CM.groups.message_received_sig.dispatch(group, msg)
        },
       
        groupsbyid: [],
		getGroupById:function(id){
			var groups = CM.model.groups;
            var group = CM.groups.groupsbyid[id];
            if (group) {
                return group
            }
            if (!groups) {
                return null
            }
            for (var g = 0; g < groups.length; g++) {
            	group = groups[g];
                if (group.id == id ) {
                	 CM.groups.groupsbyid[id] = group;
                    return group
                }
            }
            return null
		},
		groupsbyname: [],
		getGroupByName: function(name) { 
            var groups = CM.model.channels;
            var group = CM.groups.groupsbyname[name];
            if (channel) {
                return channel
            }
            if (!groups) {
                return null
            }
            for (var g = 0; g < groups.length; g++) {
            	group = groups[g];
                if (group.name == name ) {
                	CM.groups.groupsbyname[name] = group;
                    return group
                }
            }
            return null
        },
        unarchivedClosedGroups:[],
        getUnarchivedClosedGroups: function(j) {
        	CM.groups.unarchivedClosedGroups.length = 0;
            var f = CM.model.groups;
            var h;
            for (var g = 0; g < f.length; g++) {
                h = f[g];
                if (h.is_archived) {
                    continue
                }
                if (h.is_open) {
                    continue
                }
                CM.groups.unarchivedClosedGroups.push(h)
            }
            return CM.groups.unarchivedClosedGroups
        },
        unarchivedGroups:[],
        getUnarchivedGroups: function() {
        	CM.groups.unarchivedGroups.length = 0;
            var f = CM.model.groups;
            var h;
            for (var g = 0; g < f.length; g++) {
                h = f[g];
                if (h.is_archived) {
                    continue
                }
                CM.groups.unarchivedGroups.push(h)
            }
            return CM.groups.unarchivedGroups
        },
        displayGroup: function(group_id, send_text, k, g) {

            var group = CM.groups.getGroupById(group_id);
            if (!group) {
                CM.error('channel "' + group_id + '" unknown');
                return
            }
            if (group_id == CM.model.active_group_id ) {
                CM.warn('channel "' + group_id + '" already displayed');
                if (send_text) {
                    CM.groups.sendMsg(group_id, $.trim(f))
                }
                return
            }
//            if (!group.is_member || group.is_archived) {
//                return
//            }
            
            if (CM.client.channelDisplaySwitched(null, null, group_id)) {
                CM.groups.switched_sig.dispatch()
            }
            if (send_text) {
                CM.groups.sendMsg(group_id, $.trim(f))
            }    
        },
        sendMsg: function(id, content, type, subtype) {
            var j = CM.groups.getGroupById(id);
            if (!j) {
                return false
            }
            if (j.is_archived) {
                return false
            }
//            if (!j.is_member) {
//                return false
//            }
            return CM.shared.sendMsg('groups.sendmsg', id, content, CM.groups, type, subtype)
        },
        onSendMsg: function(status, data, params) {
            var activeOb = CM.channels.getChannelById(params['id']);
            CM.shared.onSendMsg(status, data, params, activeOb, CM.groups)
        },
        onMarked:function(){
        	
        },
	},
	ims:{
		switched_sig: new signals.Signal(),
		message_received_sig: new signals.Signal(),
		
		addMsg: function(im_id, msg) {
            var im = CM.ims.getImById(im_id);
            if (!channel) {
                CM.error('unknown im "' + im_id + '"');
                return
            }
            var msgs = im.msgs;
            msgs.unshift(msg);
            CM.ims.message_received_sig.dispatch(im, msg)
        },
        imsbyid: [],
        getImById:function(id){
			var ims = CM.model.ims;
            var im = CM.ims.imsbyid[id];
            if (im) {
                return im
            }
            if (!ims) {
                return null
            }
            for (var g = 0; g < ims.length; g++) {
            	im = ims[g];
                if (im.id == id ) {
                	 CM.ims.imsbyid[id] = im;
                    return im
                }
            }
            return null
		},
		getImByMemberId: function(id){
			for(var key in CM.model.ims)
				if(CM.model.ims[key]['user']==id)
					return CM.model.ims[key];
			return null;
		},
//		getDisplayNameOfUserForIm: function(im) {
//			//var user=CM.members.getMemberById(im.user);
//            return CM.members.getMemberDisplayName(im.user);
//        },
//        getDisplayNameOfUserForImLowerCase: function(im) {
//        	//var user=CM.members.getMemberById(im.user);
//            return CM.members.getMemberDisplayName(im.user);
//        },
        getDisplayNameOfUserForIm: function(d) {
            return CM.members.getMemberDisplayName(CM.members.getMemberByName(d.name))
        },
        getDisplayNameOfUserForImLowerCase: function(d) {
            return CM.members.getMemberDisplayNameLowerCase(CM.members.getMemberByName(d.name))
        },
        imsbyname: [],
        getImByUsername: function(username) { 
            var ims = CM.model.ims;
            var im = this.imsbyname[username];
            if (im) {
                return im
            }
            if (!ims) {
                return null
            }
            for (var g = 0; g < ims.length; g++) {
                im = ims[g];
                if (im.name == username || "@" + im.name == username) {
                    CM.warn(username + " not in _name_map?");
                    this.imsbyname[username] = im;
                    return im
                }
            }
            return null
        },
        imsbyid: [],
        getImByMemberId: function(g) {
            var ims = CM.model.ims;
            var d = CM.ims.imsbyid[g];
            if (d) {
                return d
            }
            if (!ims) {
                return null
            }
            for (var f = 0; f < ims.length; f++) {
                d = ims[f];
                if (d.user == g) {
//                    CM.warn(g + " not in _member_id_map?");
                	CM.ims.imsbyid[g] = d;
                    return d
                }
            }
            return null
        },
        startImByMemberId: function(id){
        	
        },
        displayIm: function(member_id, send_text, k, g) {
        	k = !!k;
            g = !!g;
            var im = CM.ims.getImByMemberId(member_id);
            
            if (!im) {
                CM.error('IM member"' + member_id + '" unknown');
                return
            }
            var im_id = im['id'];
            if (im_id == CM.model.active_im_id ) {
                CM.warn('channel "' + im_id + '" already displayed');
                if (send_text) {
                    CM.ims.sendMsg(im_id, $.trim(f))
                }
                return
            }
            
            if (CM.client.channelDisplaySwitched(null, im_id, null)) {
                CM.ims.switched_sig.dispatch()
            }
            if (send_text) {
                CM.ims.sendMsg(im_id, $.trim(f))
            }    
        },
        sendMsg: function(id, content, type, subtype) {
            var j = CM.ims.getImById(id);
            if (!j) {
                return false
            }
//            if (j.is_archived) {
//                return false
//            }

            return CM.shared.sendMsg('ims.sendmsg', id, content, CM.ims, type, subtype)
        },
        onSendMsg: function(status, data, params) {
            var activeOb = CM.ims.getImById(params['id']);
            CM.shared.onSendMsg(status, data, params, activeOb, CM.ims)
        },
        onMarked:function(){
        	
        },
        closeImByMemberId: function(e) {
            var d = CM.ims.getImByMemberId(e);
            if (!d) {
                return
            }
            CM.ims.closeIm(d.id)
        },
        closeIm: function(e) {
            var d = CM.ims.getImById(e);
            if (!d) {
                return
            }
            if (false && d.is_slackbot_im) {
                CM.error("can't leave self channel");
                return
            }
            //CM.api.call("im.close", {
            CM.api.call("channels.leave", {
                channel: e
            }, CM.ims.onClosed)
        },
        onClosed: function(f, g, e) {
            if (!f) {
                return
            }
//            if (g.no_op) {
//                var d = CM.ims.getImById(e.channel);
//                if (d) {
//                    CM.ims.closed_sig.dispatch(d)
//                }
//            }
            var im = CM.ims.getImById(e.channel);
            CM.model.ims[im.id];
            var ch_general = CM.channels.getGeneralChannel();
            CM.channels.displayChannel(ch_general.id);
        },
	},
	tips:{
		onStart:function(){
			if (!CM.client) {
	            return
	        }
	        //CM.client.login_sig.add(CM.tips.loggedIn, CM.tips);
	        CM.channels.switched_sig.add(CM.tips.channelOrImOrGroupDisplaySwitched, CM.tips);
	        CM.ims.switched_sig.add(CM.tips.channelOrImOrGroupDisplaySwitched, CM.tips);
	        CM.groups.switched_sig.add(CM.tips.channelOrImOrGroupDisplaySwitched, CM.tips);
	        //CM.client.flexpane_display_switched_sig.add(CM.tips.flexDisplaySwitched, CM.tips)
		},
		channelOrImOrGroupDisplaySwitched: function(){
			//it is ok
		},
	},
	members:{
		memberById:[],
		getMemberById: function(id){
			var users=CM.model.members;
			var user = CM.members.memberById[id];
            if (user) {
                return user;
            }
            if (!users) {
                return null;
            }
			for (var index = 0; index < users.length; index++) {
                user =users[index];
                if (user.id == id) {
                	CM.members.memberById[id] = user;
                    return user
                }
            }
            return null
		},
		getMemberByName: function(dname){
			for(var key in CM.model.members)
				if(CM.model.members[key]['name']==dname)
					return CM.model.members[key];
			return null;
		},
		getMemberDisplayName: function(user){
			if(user)
				return user['name'];
			else
				return null;
		},
		getMemberDisplayNameLowerCase: function(user, p) {
			if(user)
				return user['name'];
			else
				return null;
        },
		getMemberDisplayNameByid: function(id){
			var user=CM.members.getMemberById(id);
			if(user)
				return user['name'];
			else
				return null;
		},

	    buildMembers: function(p, q, exclude_self, include_bot) {
	        p.length = 0;
	        var t;
	        for (var o = 0; o < q.length; o++) {
	            t = q[o];
	            if (t.deleted) {
	                continue;
	            }
	            if (!include_bot && t.is_slackbot) {
	                continue;
	            }
	            if (exclude_self && t.is_self) {
	                continue;
	            }
	            p.push(t)
	        }
	        return p
	    },
	    activeMembersWithSelfAndNotSlackbot:[],
		getActiveMembersWithSelfAndNotSlackbot: function() {
			
            var o = CM.members.activeMembersWithSelfAndNotSlackbot;
            if (!o.length) {
                o = CM.members.activeMembersWithSelfAndNotSlackbot = CM.members.buildMembers(o, CM.members.getMembersForUser(), false, false)
            }
            return o
        },
        activeMembersExceptSelfAndSlackbot:[],
        getActiveMembersExceptSelfAndSlackbot: function() {
            var o = activeMembersExceptSelfAndSlackbot;
            if (!o.length) {
                o = CM.members.activeMembersExceptSelfAndSlackbot = CM.members.buildMembers(o, CM.members.getMembersForUser(), true, false)
            }
            return o
        },
        activeMembersWithSelfAndSlackbot:[],
        getActiveMembersWithSelfAndSlackbot: function() {
            var o = activeMembersWithSelfAndSlackbot;
            if (!o.length) {
                o = CM.members.activeMembersWithSelfAndSlackbot = CM.members.buildMembers(o, CM.members.getMembersForUser(), false, true)
            }
            return o
        },
        activeMembersWithSlackbotAndNotSelf:[],
        getActiveMembersWithSlackbotAndNotSelf: function() {
            var o = activeMembersWithSlackbotAndNotSelf;
            if (!o.length) {
                o = CM.activeMembersWithSlackbotAndNotSelf = CM.members.buildMembers(o, CM.members.getMembersForUser(), true, true)
            }
            return o
        },
        getMembersForUser: function() {
            if (!CM.model.user.is_restricted) {
                return CM.model.members;
            }
            var p = [];
            if (!p.length) {
                var r;
                var q = CM.model.members;
                for (var o = 0; o < q.length; o++) {
                    r = q[o];
                    if (r.deleted) {
                        continue;
                    }
//                    if (!CM.members.canUserSeeMember(r)) {
//                        continue
//                    }
                    p.push(r)
                }
            }
            return p
        },
        canUserPostInGeneral: function() {
//            if (CM.model.user.is_restricted) {
//                return (CM.model.team.prefs.who_can_post_general == "ra")
//            }
//            if (CM.model.team.prefs.who_can_post_general == "ra") {
//                return true
//            }
//            if (CM.model.team.prefs.who_can_post_general == "regular") {
//                return true
//            }
//            if (CM.model.team.prefs.who_can_post_general == "admin") {
//                return !!CM.model.user.is_admin
//            }
//            if (CM.model.team.prefs.who_can_post_general == "owner") {
//                return !!CM.model.user.is_owner
//            }
            return true
        },
        canUserCreateChannels: function() {
//            if (CM.model.user.is_restricted) {
//                return false
//            }
//            if (CM.model.team.prefs.who_can_create_channels == "regular") {
//                return true
//            }
//            if (CM.model.team.prefs.who_can_create_channels == "admin") {
//                return !!CM.model.user.is_admin
//            }
//            if (CM.model.team.prefs.who_can_create_channels == "owner") {
//                return !!CM.model.user.is_owner
//            }
            return true
        },
        canUserCreateGroups: function() {
//            if (CM.model.user.is_ultra_restricted) {
//                return false
//            }
//            if (CM.model.user.is_restricted) {
//                return (CM.model.team.prefs.who_can_create_groups == "ra")
//            }
//            if (CM.model.team.prefs.who_can_create_groups == "ra") {
//                return true
//            }
//            if (CM.model.team.prefs.who_can_create_groups == "regular") {
//                return true
//            }
//            if (CM.model.team.prefs.who_can_create_groups == "admin") {
//                return !!CM.model.user.is_admin
//            }
//            if (CM.model.team.prefs.who_can_create_groups == "owner") {
//                return !!CM.model.user.is_owner
//            }
            return true
        },
	},
	shared:{
		sendMsg: function(command, group_id, content, caller, type, subtype){
			if(!type)
				type="message";
			if(!subtype)
				subtype="";
			//type:message,channel,group,im,messages,user_files,file_comments,file_stars,file_comment_stars,message_stars,starred_by_you
			//     file,user_star,new_channels,new_members
			//automated_subtypes: ["channel_join", "channel_leave", "channel_topic", "channel_purpose", "channel_archive", "channel_unarchive", "group_join", "group_leave", "group_topic", "group_purpose", "group_archive", "group_unarchive", "group_name", "channel_name", "play_sound"],
		    
			//b.subtype == "file_share" || b.subtype == "file_mention" || b.subtype == "file_comment"
			
			
			CM.sock.call(command, {id:group_id,msg:content,type:type,subtype:subtype},function(status,data,params) {
				caller.onSendMsg(status,data,params);
			});
		},
		onSendMsg: function(status,data,params, activeob, caller){
			
			//activeob.msgs.push(data['msg']);
			
		},
	    getActiveModelOb: function() {
	        var a;
	        if (CM.client) {
	            if (CM.model.active_channel_id) {
	                a = CM.channels.getChannelById(CM.model.active_channel_id)
	            } else {
	                if (CM.model.active_im_id) {
	                    a = CM.ims.getImById(CM.model.active_im_id)
	                } else {
	                    if (CM.model.active_group_id) {
	                        a = CM.groups.getGroupById(CM.model.active_group_id)
	                    } else {
	                        CM.warn("WTF getActiveModelOb found no ob");
	                        CM.warn("CM.model.active_channel_id: " + CM.model.active_channel_id);
	                        CM.warn("CM.model.active_im_id: " + CM.model.active_im_id);
	                        CM.warn("CM.model.active_group_id: " + CM.model.active_group_id)
	                    }
	                }
	            }
	        } else {
	            if (CM.boot_data.channel_id) {
	                a = CM.channels.getChannelById(CM.boot_data.channel_id)
	            } else {
	                if (CM.boot_data.im_id) {
	                    a = CM.ims.getImById(CM.boot_data.im_id)
	                } else {
	                    if (CM.boot_data.group_id) {
	                        a = CM.groups.getGroupById(CM.boot_data.group_id)
	                    } else {
	                        CM.warn("WTF getActiveModelOb found no ob");
	                        CM.warn("CM.boot_data.channel_id: " + CM.boot_data.channel_id);
	                        CM.warn("CM.boot_data.im_id: " + CM.boot_data.im_id);
	                        CM.warn("CM.boot_data.group_id: " + CM.boot_data.group_id)
	                    }
	                }
	            }
	        }
	        return a
	    },
	    getModelObById: function(a) {
	        if (a.charAt(0) === "C") {
	            return CM.channels.getChannelById(a)
	        } else {
	            if (a.charAt(0) === "G") {
	                return CM.groups.getGroupById(a)
	            } else {
	                return CM.ims.getImById(a)
	            }
	        }
	    },
	    getShareModelObId: function(a, c) {
	        var b;
	        if (a && a.charAt(0) === "U") {
	            b = CM.ims.getImByMemberId(a);
	            if (!b) {
	                CM.api.call("im.open", {
	                    user: a
	                }, function(d, e) {
	                    if (d) {
	                        b = CM.ims.getImByMemberId(a);
	                        a = b.id;
	                        c(a)
	                    } else {}
	                })
	            } else {
	                a = b.id;
	                c(a)
	            }
	        } else {
	            c(a)
	        }
	    }

	},
	menu:{
        $menu: null,
        $menu_header: null,
        $menu_items: null,
        $menu_footer: null,
        menu_lazy_load: null,
        channel: null,
        member: null,
        end_tim: 0,
        onStart: function() {
            if (CM.client) {
                $("#client-ui").append(CM.templates.menu())
            } else {
                $("body").append(CM.templates.menu())
            }
            var menu = CM.menu.$menu = $("#menu");
//            if (CM.boot_data.app != "mobile" && CM.qs_args.new_scroll != "0") {
//                var b = CM.qs_args.debug_scroll == "1";
////                c.find("#menu_items_scroller").monkeyScroll({
////                    debug: b
////                })
//            }
            CM.menu.$menu_header = menu.find("#menu_header");
            CM.menu.$menu_items = menu.find("#menu_items");
            CM.menu.$menu_footer = menu.find("#menu_footer");
            menu.detach()
        },
        startWithChannel: function(h, c) {
            if (CM.menu.isRedundantClick(h)) {
                return
            }
//            if (CM.ui.checkForEditing(h)) {
//                return
//            }
            if (CM.model.menu_is_showing) {
                return
            }
            CM.menu.clean();
            var f = CM.menu.$menu;
            var g = CM.menu.channel = CM.channels.getChannelById(c);
            CM.menu.$menu.addClass("headless");
            CM.menu.$menu_header.addClass("hidden").empty();
            var j = {
                channel: g,
                user: CM.model.user
            };
            if (g.purpose.last_set == 0 && !CM.model.user.is_ultra_restricted) {
                j.show_purpose_item = true
            }
            var b = CM.channels.makeMembersWithPreselectsForTemplate(CM.channels.getActiveMembersNotInThisChannelForInviting(c));
            if (b.length == 0) {
                j.disable_invite = true
            }
            CM.menu.$menu_items.html(CM.templates.menu_channel_items(j));
            CM.menu.$menu_footer.html(CM.templates.menu_channel_footer({
                channel: g,
                user: CM.model.user,
                show_topic: !CM.model.user.is_restricted && (!g.is_general || CM.members.canUserPostInGeneral())
            }));
            CM.menu.$menu_header.bind("click.menu", CM.menu.onChannelHeaderClick);
            CM.menu.$menu_items.find("li").bind("click.menu", CM.menu.onChannelItemClick);
            CM.kb_nav.setSubmitItemHandler(CM.menu.onChannelItemClick);
            CM.menu.start(h);
            var d = CM.utility.keymap;
            $("#menu_channel_topic_input").bind("keydown", function(l) {
                var k = $(this);
                if (l.which == d.enter && !l.shiftKey) {
                    CM.channels.setTopic(c, $.trim(k.val()));
                    CM.menu.end()
                }
            });
            CM.menu.positionAt($("#active_channel_name .name"), 24, 47);
            if (j.disable_invite) {
                $("#channel_invite_item a").tooltip({
                    title: "Everyone on your team is already in this channel",
                    delay: {
                        show: 500,
                        hide: 0
                    }
                })
            }
        },
        onChannelHeaderClick: function(b) {
            b.preventDefault()
        },
        onChannelItemClick: function(b) {
            var c = $(this).attr("id");
            if ($(this).hasClass("disabled")) {
                CM.menu.end();
                return
            }
            if (c == "channel_join_item") {
                b.preventDefault();
                CM.channels.displayChannel(CM.menu.channel.id)
            } else {
                if (c == "channel_display_item") {
                    b.preventDefault();
                    CM.channels.displayChannel(CM.menu.channel.id)
                } else {
                    if (c == "channel_close_archived_item") {
                        b.preventDefault();
                        CM.channels.closeArchivedChannel(CM.menu.channel.id)
                    } else {
                        if (c == "channel_leave_item") {
                            b.preventDefault();
                            CM.channels.leave(CM.menu.channel.id)
                        } else {
                            if (c == "channel_links_item") {} else {
                                if (c == "channel_star_item") {
                                    b.preventDefault();
                                    CM.stars.checkForStarClick(b)
                                } else {
                                    if (c == "channel_advanced_item") {
                                        b.preventDefault();
                                        CM.ui.channel_options_dialog.start(CM.menu.channel.id)
                                    } else {
                                        if (c == "channel_unarchive_item") {
                                            b.preventDefault();
                                            CM.api.call("channels.unarchive", {
                                                channel: CM.menu.channel.id
                                            }, function(e, f, d) {
                                                if (e) {
                                                    return
                                                }
                                                var g = 'Un-archiving failed with error "' + f.error + '"';
                                                if (f.error == "restricted_action") {
                                                    g = "<p>You don't have permission to un-archive channels.</p><p>Talk to your team owner.</p>"
                                                }
                                                setTimeout(CM.generic_dialog.alert, 100, g)
                                            })
                                        } else {
                                            if (c == "channel_archives_item") {} else {
                                                if (c == "channel_rename_item") {
                                                    b.preventDefault();
                                                    CM.ui.channel_create_dialog.start(CM.menu.channel.name, CM.menu.channel)
                                                } else {
                                                    if (c == "channel_purpose_item") {
                                                        b.preventDefault();
                                                        CM.ui.purpose_dialog.start(CM.menu.channel.name, CM.menu.channel)
                                                    } else {
                                                        if (c == "channel_invite_item") {
                                                            b.preventDefault();
                                                            CM.ui.invite.showInviteMembersFromChannelDialog(CM.menu.channel.id)
                                                        } else {
                                                            if (c == "channel_prefs") {
                                                                b.preventDefault();
                                                                CM.ui.channel_prefs_dialog.start(CM.menu.channel.id)
                                                            } else {
                                                                if (c == "channel_add_service_item") {} else {
                                                                    CM.warn("not sure what to do with clicked element id:" + c);
                                                                    return
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            CM.menu.end()
        },
        startWithGroup: function(h, f) {
            if (CM.menu.isRedundantClick(h)) {
                return
            }
            if (CM.ui.checkForEditing(h)) {
                return
            }
            if (CM.model.menu_is_showing) {
                return
            }
            CM.menu.clean();
            var d = CM.menu.$menu;
            var g = CM.menu.group = CM.groups.getGroupById(f);
            CM.menu.$menu_header.addClass("hidden").empty();
            var j = {
                group: g,
                user: CM.model.user
            };
            if (g.purpose.last_set == 0 && !CM.model.user.is_ultra_restricted) {
                j.show_purpose_item = true
            }
            var b = CM.channels.makeMembersWithPreselectsForTemplate(CM.groups.getActiveMembersNotInThisGroupForInviting(f));
            if (b.length == 0) {
                j.disable_invite = true
            }
            if (CM.model.user.is_restricted && !CM.model.user.is_ultra_restricted && CM.groups.canLeaveGroup(f)) {
                j.ra_can_leave = true
            }
            CM.menu.$menu_items.html(CM.templates.menu_group_items(j));
            CM.menu.$menu_footer.html(CM.templates.menu_group_footer({
                group: g,
                user: CM.model.user
            }));
            CM.menu.$menu_header.bind("click.menu", CM.menu.onGroupHeaderClick);
            CM.menu.$menu_items.find("li").bind("click.menu", CM.menu.onGroupItemClick);
            CM.menu.start(h);
            var c = CM.utility.keymap;
            $("#menu_group_topic_input").bind("keydown", function(l) {
                var k = $(this);
                if (l.which == c.enter && !l.shiftKey) {
                    CM.groups.setTopic(f, $.trim(k.val()));
                    CM.menu.end()
                }
            });
            CM.menu.positionAt($("#active_channel_name .name"), 24, 53);
            if (j.disable_invite) {
                $("#group_invite_item a").tooltip({
                    title: "Everyone on your team is already in this group",
                    delay: {
                        show: 500,
                        hide: 0
                    }
                })
            }
        },
        onGroupHeaderClick: function(b) {
            b.preventDefault()
        },
        onGroupItemClick: function(c) {
            var d = $(this).attr("id");
            if ($(this).hasClass("disabled")) {
                CM.menu.end();
                return
            }
            if (d == "group_display_item") {
                c.preventDefault();
                CM.groups.displayGroup(CM.menu.group.id)
            } else {
                if (d == "group_leave_item") {
                    c.preventDefault();
                    CM.groups.leave(CM.menu.group.id)
                } else {
                    if (d == "group_links_item") {} else {
                        if (d == "group_star_item") {
                            c.preventDefault();
                            CM.stars.checkForStarClick(c)
                        } else {
                            if (d == "group_close_item") {
                                c.preventDefault();
                                CM.groups.closeGroup(CM.menu.group.id)
                            } else {
                                if (d == "group_leave_and_archive_item") {
                                    c.preventDefault();
                                    var b = CM.menu.group;
                                    CM.generic_dialog.start({
                                        title: "Leave and archive " + CM.model.group_prefix + b.name,
                                        body: "<p>If you archive this group, no one will be able to send any messages in it and it will be closed for anyone who currently has it open. You will still be able to view the archives on the site and you will still be able to search for messages from this group.</p><p>Are you sure you want to archive <b>" + CM.model.group_prefix + b.name + "</b>?</p>",
                                        go_button_text: "Yes, leave & archive the group",
                                        on_go: function() {
                                            CM.api.call("groups.archive", {
                                                channel: b.id
                                            }, function(f, g, e) {
                                                if (f) {
                                                    CM.groups.closeGroup(b.id);
                                                    return
                                                }
                                                var h = 'Archiving failed with error "' + g.error + '"';
                                                if (g.error == "last_ra_channel") {
                                                    if (CM.model.user.is_admin) {
                                                        h = "Sorry, you can't archive this group because it is the only group or channel one of the guest account members belongs to. If you first disable the guest account, you will then be able to archive the group."
                                                    } else {
                                                        h = "Sorry, you can't archive this group because it is the only group or channel one of the guest account members belongs to."
                                                    }
                                                }
                                                CM.generic_dialog.alert(h)
                                            })
                                        }
                                    })
                                } else {
                                    if (d == "group_unarchive_item") {
                                        c.preventDefault();
                                        CM.api.call("groups.unarchive", {
                                            channel: CM.menu.group.id
                                        })
                                    } else {
                                        if (d == "group_archives_item") {} else {
                                            if (d == "group_advanced_item") {
                                                c.preventDefault();
                                                CM.ui.channel_options_dialog.start(CM.menu.group.id)
                                            } else {
                                                if (d == "group_purpose_item") {
                                                    c.preventDefault();
                                                    CM.ui.purpose_dialog.start(CM.menu.group.name, CM.menu.group)
                                                } else {
                                                    if (d == "group_invite_item") {
                                                        c.preventDefault();
                                                        CM.ui.invite.showInviteMembersFromGroupDialog(CM.menu.group.id)
                                                    } else {
                                                        if (d == "group_prefs") {
                                                            c.preventDefault();
                                                            CM.ui.channel_prefs_dialog.start(CM.menu.group.id)
                                                        } else {
                                                            if (d == "group_add_service_item") {} else {
                                                                CM.warn("not sure what to do with clicked element id:" + d);
                                                                return
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            CM.menu.end()
        },
        startWithMember: function(k, g, j, l, d) {
            if (CM.menu.isRedundantClick(k)) {
                return
            }
            if (CM.ui.checkForEditing(k)) {
                return
            }
            if (CM.model.menu_is_showing) {
                return
            }
            CM.menu.clean();
            var b = CM.menu.$menu;
            var f = CM.menu.member = CM.members.getMemberById(g);
            var m = {
                member: f,
                show_dm_item: !d
            };
            if (d) {
                CM.menu.$menu_header.addClass("hidden").empty();
                m.im = CM.ims.getImByMemberId(g)
            } else {
                CM.menu.$menu_header.html(CM.templates.menu_member_header(m))
            } if (l && g == CM.model.user.id) {
                m.other_accounts = CM.boot_data.other_accounts;
                m.logout_url = CM.boot_data.logout_url;
                m.signin_url = CM.boot_data.signin_url
            }
            if (!f.deleted && !f.is_slackbot && g != CM.model.user.id) {
                if (!CM.model.user.is_ultra_restricted && !f.is_ultra_restricted) {
                    var n = CM.members.getMyChannelsThatThisMemberIsNotIn(g);
                    if (n.length) {
                        m.show_channel_invite = true
                    }
                    m.show_group_create = true;
                    if (CM.model.allow_invite_to_group_from_person) {
                        m.show_group_invite = true
                    }
                }
            }
            var c = CM.shared.getActiveModelOb();
            if (CM.model.active_channel_id || CM.model.active_group_id) {
                if ((!c.is_general || f.is_restricted) && g != CM.model.user.id && c.members && c.members.indexOf(g) != -1) {
                    if (!f.is_ultra_restricted) {
                        if ((c.is_group && CM.members.canUserKickFromGroups()) || (c.is_channel && CM.members.canUserKickFromChannels())) {
                            m.channel_kick_name = (CM.model.active_channel_id ? "#" : "") + c.name
                        }
                    }
                }
            }
            if (g == "USLACKBOT") {
                var o = false;
                if (CM.model.user.is_admin) {
                    o = true
                } else {
                    if (!CM.model.team.prefs.slackbot_responses_disabled && !CM.model.team.prefs.slackbot_responses_only_admins) {
                        o = true
                    }
                }
                m.show_slackbot_responses_item = o
            }
            CM.menu.$menu_items.html(CM.templates.menu_member_items(m));
            if (g == CM.model.user.id) {
                CM.menu.$menu_footer.html(CM.templates.menu_user_footer({
                    user: f
                }));
                CM.menu.$menu.addClass("footless")
            } else {
                if (!d) {
                    CM.menu.$menu_footer.html(CM.templates.menu_member_footer({
                        member: f
                    }))
                }
            }
            CM.menu.start(k, j);
            var h = CM.utility.keymap;
            $("#menu_member_dm_input").bind("keydown", function(q) {
                var p = $(this);
                if (q.which == h.enter && !q.shiftKey) {
                    if ($.trim(p.val()) != "") {
                        q.preventDefault();
                        CM.ims.startImByMemberId(f.id, false, p.val());
                        CM.menu.end()
                    }
                }
            });
            CM.menu.$menu_header.bind("click.menu", CM.menu.onMemberHeaderClick);
            CM.menu.$menu_items.find("li").bind("click.menu", CM.menu.onMemberItemClick);
            CM.kb_nav.setSubmitItemHandler(CM.menu.onMemberItemClick);
            if (d) {
                CM.menu.positionAt($("#active_channel_name .name"), 24, 47)
            }
            $("#menu_user_status_input").select();
            CM.menu.keepInBounds()
        },
        onMemberHeaderClick: function(b) {
            b.preventDefault();
            CM.ui.previewMember(CM.menu.member.id);
            CM.menu.end()
        },
        onMemberItemClick: function(c) {
            var d = $(this).attr("id");
            clearTimeout(CM.menu.end_tim);
            if (d == "member_photo_item") {} else {
                if (d == "member_archives_item") {} else {
                    if (d == "member_links_item") {} else {
                        if (d == "member_star_item") {
                            c.preventDefault();
                            CM.stars.checkForStarClick(c)
                        } else {
                            if (d == "member_skype_item") {} else {
                                if (d == "member_account_item") {} else {
                                    if (d == "member_prefs_item") {
                                        c.preventDefault();
                                        CM.ui.prefs_dialog.start()
                                    } else {
                                        if (d == "member_files_item") {
                                            c.preventDefault();
                                            CM.view.fileClearFilter();
                                            CM.ui.filterFileList(CM.menu.member.id)
                                        } else {
                                            if (d == "member_dm_item") {
                                                c.preventDefault();
                                                CM.ims.startImByMemberId(CM.menu.member.id)
                                            } else {
                                                if (d == "member_invite_channel_item") {
                                                    c.preventDefault();
                                                    CM.ui.invite.showInviteMemberToChannelDialog(CM.menu.member.id)
                                                } else {
                                                    if (d == "member_invite_group_item") {
                                                        c.preventDefault();
                                                        CM.ui.invite.showInviteMemberToGroupDialog(CM.menu.member.id)
                                                    } else {
                                                        if (d == "member_create_group_item") {
                                                            c.preventDefault();
                                                            CM.ui.group_create_dialog.startWithMember(CM.menu.member.id)
                                                        } else {
                                                            if (d == "member_profile_item") {
                                                                c.preventDefault();
                                                                CM.ui.previewMember(CM.menu.member.id)
                                                            } else {
                                                                if (d == "member_presence") {
                                                                    c.preventDefault();
                                                                    CM.members.toggleUserPresence();
                                                                    CM.menu.end_tim = setTimeout(function() {
                                                                        CM.menu.end()
                                                                    }, 1000);
                                                                    return
                                                                } else {
                                                                    if (d == "logout") {
                                                                        $("body").addClass("hidden")
                                                                    } else {
                                                                        if ($(this).hasClass("switch_team")) {
                                                                            c.preventDefault();
                                                                            var b = $(this).data("team-id");
                                                                            if (TSSSB.call("displayTeam", {
                                                                                id: b
                                                                            }, b)) {
                                                                                c.preventDefault()
                                                                            } else {
                                                                                $("body").addClass("hidden")
                                                                            }
                                                                        } else {
                                                                            if (d == "member_kick_channel_item") {
                                                                                c.preventDefault();
                                                                                if (CM.model.active_channel_id) {
                                                                                    CM.channels.kickMember(CM.model.active_channel_id, CM.menu.member.id)
                                                                                } else {
                                                                                    if (CM.model.active_group_id) {
                                                                                        CM.groups.kickMember(CM.model.active_group_id, CM.menu.member.id)
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                if (d == "member_slackbot_responses") {} else {
                                                                                    c.preventDefault();
                                                                                    CM.warn("not sure what to do with clicked element id:" + d);
                                                                                    return
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            CM.menu.end()
        },
        startWithMembers: function(f) {
            if (CM.menu.isRedundantClick(f)) {
                return
            }
            if (CM.ui.checkForEditing(f)) {
                return
            }
            if (CM.model.menu_is_showing) {
                return
            }
            CM.menu.clean();
            var c = CM.menu.$menu;
            var b = false;
            var d = CM.members.getActiveMembersWithSlackbotAndNotSelf();
            if (d.length > 5) {
                b = true
            }
            CM.menu.$menu_header.html(CM.templates.menu_members_header({
                show_filter: b
            }));
            CM.menu.$menu_items.html(CM.templates.menu_members_items({
                members: d
            }));
            CM.menu.$menu_footer.html(CM.templates.menu_members_footer());
            CM.menu.$menu_items.find("li").bind("click.menu", CM.menu.onMembersItemClick);
            CM.menu.start(f);
            $("#about_dms_link").on("click", function(g) {
                g.preventDefault();
                CM.menu.end();
                CM.tip_card.start({
                    tip: CM.tips.getTipById("about_dms_tip_card")
                })
            });
            if (b) {
                CM.members.view.bindTeamFilter("#dms_filter", "#menu_items_scroller");
                $("#dms_filter").find(".member_filter").focus();
                CM.members.view.team_filter_changed_sig.add(CM.kb_nav.clearHighlightedItem, CM.kb_nav);
                CM.kb_nav.setAllowHighlightWithoutBlurringInput(true)
            }
        },
        startWithTeam: function(d) {
            if (CM.menu.isRedundantClick(d)) {
                return
            }
//            if (CM.ui.checkForEditing(d)) {
//                return
//            }
            if (CM.model.menu_is_showing) {
                return
            }
            CM.menu.clean();
            var c = CM.menu.$menu;
            var show_invite_item = false;
            var f = {
                user: CM.model.user,
                other_accounts: CM.boot_data.other_accounts,
                logout_url: CM.boot_data.logout_url,
                signin_url: CM.boot_data.signin_url,
                help_url: CM.boot_data.help_url,
                show_invite_item: show_invite_item
            };
            CM.menu.$menu.addClass("headless footless");
            CM.menu.$menu_header.addClass("hidden").empty();
            CM.menu.$menu_items.html(CM.templates.menu_team_items(f));
            CM.menu.$menu_items.find("li").bind("click.menu", CM.menu.onTeamItemClick);
            CM.kb_nav.setSubmitItemHandler(CM.menu.onTeamItemClick);
            CM.menu.start(d);
            CM.menu.positionAt($("#team_menu"), 150, 49)
        },
        onTeamItemClick: function(c) {
            var d = $(this).attr("id");
            if (d == "team_activity" || d == "team_admin" || d == "team_services" || d == "team_invitations" || d == "team_apps") {} else {
                if (d == "team_help") {
                    c.preventDefault();
                    CM.help_dialog.start()
                } else {
                    if (d == "logout") {
                        $("body").addClass("hidden")
                    } else {
                        if (d == "add_team") {
                            if (window.macgap && macgap.teams && macgap.teams.signInTeam) {
                                c.preventDefault();
                                macgap.teams.signInTeam()
                            } else {
                                $("body").addClass("hidden")
                            }
                        } else {
                            if ($(this).hasClass("switch_team")) {
                                var b = $(this).data("user-id");
                                if (TSSSB.call("displayTeam", {
                                    id: b
                                }, b)) {
                                    c.preventDefault()
                                } else {
                                    $("body").addClass("hidden")
                                }
                            } else {
                                c.preventDefault();
                                CM.warn("not sure what to do with clicked element id:" + d);
                                return
                            }
                        }
                    }
                }
            }
            CM.menu.end()
        },
        startWithUser: function(c) {
            if (CM.menu.isRedundantClick(c)) {
                return
            }
//            if (CM.ui.checkForEditing(c)) {
//                return
//            }
            if (CM.model.menu_is_showing) {
                return
            }
            CM.menu.clean();
            var b = CM.menu.$menu;
            var d = {
                user: CM.model.user,
                other_accounts: CM.boot_data.other_accounts,
                logout_url: CM.boot_data.logout_url,
                signin_url: CM.boot_data.signin_url
            };
            CM.menu.$menu.addClass("headless footless").css("min-width", 245);
            CM.menu.$menu_header.addClass("hidden").empty();
            CM.menu.$menu_items.html(CM.templates.menu_user_items(d));
            CM.menu.$menu_items.find("li").bind("click.menu", CM.menu.onUserItemClick);
            CM.kb_nav.setSubmitItemHandler(CM.menu.onUserItemClick);
            CM.menu.start(c);
            CM.menu.positionAt($("#user_menu"), 152, -(CM.menu.$menu.height() - 5))
        },
        onUserItemClick: function(b) {
            var c = $(this).attr("id");
            clearTimeout(CM.menu.end_tim);
            if (c == "member_photo_item") {} else {
                if (c == "member_account_item") {} else {
                    if (c == "member_prefs_item") {
                        b.preventDefault();
                        CM.ui.prefs_dialog.start()
                    } else {
                        if (c == "member_profile_item") {
                            b.preventDefault();
                            CM.ui.previewMember(CM.model.user.id)
                        } else {
                            if (c == "member_presence") {
                                b.preventDefault();
                                CM.members.toggleUserPresence();
                                CM.menu.end_tim = setTimeout(function() {
                                    CM.menu.end()
                                }, 1000);
                                return
                            } else {
                                if (c == "member_help") {
                                    b.preventDefault();
                                    CM.help_dialog.start()
                                } else {
                                    if (c == "logout") {
                                        $("body").addClass("hidden")
                                    } else {
                                        b.preventDefault();
                                        CM.warn("not sure what to do with clicked element id:" + c);
                                        return
                                    }
                                }
                            }
                        }
                    }
                }
            }
            CM.menu.end()
        },
        positionAt: function(d, c, g) {
            c = c || 0;
            g = g || 0;
            var e = d.offset();
            var b = e.left + c;
            var f = e.top + g;
            CM.menu.$menu.css({
                top: f,
                left: b
            })
        },
        isRedundantClick: function(b) {
            if (b && CM.menu.last_e && b.target == CM.menu.last_e.target) {
                return true
            }
            return false
        },
        start: function(g, c) {
            CM.menu.last_e = g;
            var h = $(g.target).offset();
            var b = h.left + $(g.target).width() + 10;
            var j = h.top;
            if (c) {
                b = g.pageX + 10;
                j = g.pageY + 10
            }
            $(".tooltip").hide();
            CM.model.menu_is_showing = true;
            var d = CM.menu.$menu;
            if (CM.client) {
                d.appendTo($("#client-ui"))
            } else {
                d.appendTo($("body"))
            }
            d.css("opacity", 0);
            d.stop().transition({
                opacity: 1
            }, 200);
            d.css({
                top: j,
                left: b
            });
            d.find("#menu_items_scroller").scrollTop(0);
            d.find(".menu_close").on("click", CM.menu.end);
            if (d.find("#menu_items_scroller").data("monkeyScroll")) {
                var f = true;
                d.find("#menu_items_scroller").data("monkeyScroll").updateFunc(f)
            }
//            CM.menu.keepInBounds();
//            if (CM.menu.menu_lazy_load && CM.menu.menu_lazy_load.detachEvents) {
//                CM.menu.menu_lazy_load.detachEvents()
//            }
//            CM.menu.menu_lazy_load = CM.menu.$menu_items.find("img.lazy").lazyload({
//                container: $("#menu_items_scroller"),
//                throttle: 250
//            });
            $(window).bind("resize", CM.menu.keepInBounds);
            $(window.document).bind("keydown", CM.menu.onKeyDown);
            $("html").bind("mousedown", CM.menu.onMouseDown);
            CM.kb_nav.start(d.find("#menu_items"), "li:not(.divider)")
        },
        clean: function() {
            CM.menu.$menu_footer.empty();
            CM.menu.$menu_header.removeClass("hidden");
            CM.menu.$menu.removeClass("no_min_width headless footless").css("min-width", 0)
        },
        end: function() {
            CM.model.menu_is_showing = false;
            var b = CM.menu.$menu;
            b.stop().transition({
                opacity: 0
            }, 200, function() {
                if (CM.model.menu_is_showing) {
                    return
                }
                CM.menu.last_e = null;
                b.detach();
                CM.menu.clean()
            });
            CM.menu.member = null;
            CM.menu.channel = null;
            CM.menu.$menu_header.unbind("click.menu");
            $(window).unbind("resize", CM.menu.keepInBounds);
            $(window.document).unbind("keydown", CM.menu.onKeyDown);
            $("html").unbind("mousedown", CM.menu.onMouseDown);
//            CM.members.view.team_filter_changed_sig.remove(CM.kb_nav.clearHighlightedItem);
            CM.kb_nav.end()
        },
        onKeyDown: function(d) {
            var b = CM.utility.keymap;
            var c = d.which;
            if (c == b.esc) {
                d.stopPropagation();
                d.preventDefault();
                CM.menu.end();
                return
            }
        },
        onMouseDown: function(b) {
            if ($(b.target).closest("#menu").length == 0 && $(b.target).closest("#tip_card").length == 0) {
                CM.menu.end()
            }
        },
        keepInBounds: function() {
//            var d = CM.menu.$menu;
//            var c = 10;
//            var e = d.dimensions_rect();
//            var b = {
//                top: 0 + c,
//                right: $(window).width() - c,
//                bottom: $(window).height() - (c + 14),
//                left: 0 + c
//            };
//            if (CM.utility.doesRectContainRect(b, e)) {
//                return
//            }
//            if (e.left < b.left) {
//                d.css("left", b.left)
//            } else {
//                if (e.right > b.right) {
//                    d.css("left", Math.max(b.left, b.right - e.width))
//                }
//            } if (e.top < b.top) {
//                d.css("top", b.top)
//            } else {
//                if (e.bottom > b.bottom) {
//                    d.css("top", Math.max(b.top, b.bottom - e.height + $(window).scrollTop()))
//                }
//            }
        }
	},
	format:{
	    unFormatMsg: function(b, a) {
	        if (!b) {
	            return ""
	        }
	        return CM.format.formatMsg(b, a, false, false, true)
	    },
	    formatMsg: function(h, d, n, j, k, o, l, g, a, e) {
	        l = (d && ("no_highlights" in d)) ? (d.no_highlights == true) : (l == true);
	        if (g === true || g === false) {
	            g = g
	        } else {
	            if (d && ("mrkdwn" in d)) {
	                g = (d.mrkdwn === false)
	            } else {
	                g = false
	            }
	        } if (k) {
	            g = true
	        }
	        a = (d && ("no_emoji" in d)) ? (d.no_emoji == true) : (a == true);
	        h = $.trim(h);
	        if (!$.trim(h)) {
	            return (o == true) ? "&nbsp;" : ""
	        }
	        var m = h;
	        var b = [];
	        var c = function(t, u, v, C) {
	            if (u.substr(0, 1) == "#") {
	                var x = u.substr(1);
	                var y = x.split("|");
	                var r = y[0];
	                var B = CM.channels.getChannelById(r);
	                if (!B) {
	                    B = CM.channels.getChannelByName(r)
	                }
	                if (B) {
	                    if (j || k) {
	                        return CM.format.tokenizeStr(b, "#" + B.name)
	                    }
	                    var z = (CM.client) ? 'target="/archives/' + B.name + '"' : "";
	                    if (CM.format.testing_with_generic_tokens) {
	                        return CM.format.tokenizeStr(b, CM.format.generic_link_open + "#" + B.name + CM.format.link_close)
	                    }
	                    return CM.format.tokenizeStr(b, '<a href="/archives/' + B.name + '" ' + z + ' data-channel-name="' + B.name + '" data-channel-id="' + B.id + '" class="internal_channel_link">#' + B.name + CM.format.link_close)
	                } else {
	                    if (y.length > 1 && y[1]) {
	                        return CM.format.tokenizeStr(b, "#" + y[1])
	                    } else {
	                        if (CM.model.user.is_restricted) {
	                            return CM.format.tokenizeStr(b, "#unknown-channel")
	                        } else {
	                            return CM.format.tokenizeStr(b, "#deleted-channel")
	                        }
	                    }
	                }
	            }
	            if (u.substr(0, 1) == "@") {
	                var t = CM.utility.msgs.getMemberFromMemberMarkup(u);
	                if (t) {
	                    if (j || k) {
	                        return CM.format.tokenizeStr(b, "@" + t.name)
	                    }
	                    var z = (CM.client) ? 'target="/team/' + t.name + '" ' : "";
	                    var G = (l) ? "@" + t.name : CM.format.doHighlighting("@" + t.name);
	                    if (CM.format.testing_with_generic_tokens) {
	                        return CM.format.tokenizeStr(b, CM.format.generic_link_open + G + CM.format.link_close)
	                    }
	                    return CM.format.tokenizeStr(b, '<a href="/team/' + t.name + '" ' + z + 'data-member-name="' + t.name + '" class="internal_member_link">' + G + CM.format.link_close)
	                } else {
	                    return CM.format.tokenizeStr(b, u)
	                }
	            }
	            if (u.substr(0, 1) == "!") {
	                var s = u.substr(1);
	                if (s) {
	                    s = s.split("|")[0]
	                }
	                if (s == "everyone") {
	                    if (j || k) {
	                        return CM.format.tokenizeStr(b, "@everyone")
	                    }
	                    return CM.format.tokenizeStr(b, '<b class="mention_everyone">@everyone</b>')
	                } else {
	                    if (s == "channel") {
	                        if (j || k) {
	                            return CM.format.tokenizeStr(b, "@channel")
	                        }
	                        return CM.format.tokenizeStr(b, '<b class="mention_channel">@channel</b>')
	                    } else {
	                        if (s == "group") {
	                            if (j || k) {
	                                return CM.format.tokenizeStr(b, "@group")
	                            }
	                            return CM.format.tokenizeStr(b, '<b class="mention_group">@group</b>')
	                        }
	                    }
	                }
	                return CM.format.tokenizeStr(b, u)
	            }
	            var E = u.split("|");
	            var q = E.shift();
	            q = q.replace(/\"/g, "&quot;");
	            var D = E.join("|") || q;
	            D = $.trim(D);
	            if (q.indexOf("<") == 0) {
	                return CM.format.tokenizeStr(b, "&lt;" + u.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "&gt;")
	            }
	            D = D.replace(/</g, "&lt;");
	            D = D.replace(/>/g, "&gt;");
	            if (j) {
	                if (D == q) {
	                    var A = (q.indexOf("//") > -1) ? q.split("//")[1] : q;
	                    A = jQuery.trim(A).substring(0, 30).trim(this) + "...";
	                    return "" + A + ""
	                }
	                return "<" + D + ">"
	            } else {
	                if (k) {
	                    return D
	                }
	            } if (!g && D != q) {
	                D = CM.format.doSpecials(D, d && d._special_debug)
	            }
	            if (!a && D != q) {
	                D = CM.utility.emojiReplace(D)
	            }
	            if (!l) {
	                D = CM.format.doHighlighting(D)
	            }
	            if (q.indexOf(CM.utility.msgs.api_url_prefix) == 0) {
	                if (e) {
	                    return CM.format.tokenizeStr(b, "<a onclick=\"CM.utility.msgs.doApiUrl('" + q + '\')" class="api_url">' + D + CM.format.link_close)
	                } else {
	                    return CM.format.tokenizeStr(b, '<a class="api_url muted">' + D + " (Disabled)" + CM.format.link_close)
	                }
	            } else {
	                if (q.indexOf(CM.utility.msgs.new_api_url_prefix) == 0) {
	                    if (e) {
	                        return CM.format.tokenizeStr(b, "<a onclick=\"CM.utility.msgs.doNewApiUrl('" + q + '\')" class="api_url">' + D + CM.format.link_close)
	                    } else {
	                        return CM.format.tokenizeStr(b, '<a class="api_url muted">' + D + " (Disabled)" + CM.format.link_close)
	                    }
	                } else {
	                    if (q.indexOf("javascript:") == 0) {
	                        return CM.format.tokenizeStr(b, '<a onclick="' + q.replace("javascript:", "") + '">' + D + CM.format.link_close)
	                    } else {
	                        if (CM.client && CM.client.core_url && q.indexOf(CM.client.core_url) == 0) {
	                            if (CM.format.testing_with_generic_tokens) {
	                                return CM.format.tokenizeStr(b, CM.format.generic_link_open + D + CM.format.link_close)
	                            }
	                            return CM.format.tokenizeStr(b, '<a target="_self" href="' + q + '">' + D + CM.format.link_close)
	                        } else {
	                            var F = "";
	                            var w;
	                            if (d && d.ts && n) {
	                                w = CM.inline_attachmenCM.getAttachmentByFromUrl(d.attachments, q);
	                                if (w) {
	                                    if (CM.boot_data.feature_attachments_inline || CM.templates.builders.shouldDoSimpleAttachment(w, d)) {
	                                        F = CM.templates.builders.buildAttachmentHTML({
	                                            attachment: w,
	                                            url: q,
	                                            msg: d,
	                                            show_initial_caret: true
	                                        }).replace(/\n/g, "").replace(/\t/g, "").replace(/  /g, " ")
	                                    }
	                                }
	                            }
	                            if (F) {
	                                F = F.replace(/\n/g, "").replace(/\t/g, "").replace(/ +/g, " ")
	                            }
	                            if (CM.format.testing_with_generic_tokens) {
	                                return CM.format.tokenizeStr(b, CM.format.generic_link_open + D + CM.format.link_close + F)
	                            }
	                            return CM.format.tokenizeStr(b, "<a " + CM.utility.makeRefererSafeLink(q) + ' target="_blank">' + D + CM.format.link_close + F)
	                        }
	                    }
	                }
	            }
	        };
	        m = m.replace(/<(.*?)>/g, c);
	        m = m.replace(/\</g, "&lt;");
	        m = m.replace(/\>/g, "&gt;");
	        if (j || k) {
	            m = m.replace(/\&lt\;/g, "<");
	            m = m.replace(/\&gt\;/g, ">");
	            m = m.replace(/\&amp\;/g, "&")
	        } else {
	            CM.format.special_token_map = [];
	            if (!g) {
	                m = CM.format.doSpecials(m, d && d._special_debug)
	            }
	            if (n && (!d || d.subtype != "bot_message")) {
	                m = m.replace(CM.format.hex_rx, CM.format.hexReplace)
	            }
	            if (!a) {
	                m = CM.utility.emojiReplace(m)
	            }
	            for (var f = CM.format.special_token_map.length - 1; f > -1; f--) {
	                var p = CM.format.special_token_map[f];
	                m = m.replace(p.token, p.str.replace(/\$/g, "$$$$"))
	            }
	            CM.format.special_token_map = null;
	            if (!l) {
	                m = CM.format.doHighlighting(m)
	            }
	            m = m.replace(/\/div>\n/g, "/div>");
	            m = m.replace(/codecopyonly> /g, "codecopyonly>&nbsp;");
	            m = m.replace(/ <span class="codecopyonly/g, '&nbsp;<span class="codecopyonly');
	            m = m.replace(/&nbsp;&nbsp;/g, " &nbsp;");
	            m = m.replace(/\n\r\n\r/g, '<span class="para_break"><i class="copy_only">' + CM.format.line_break + "</i></span>");
	            m = m.replace(/\n\r\n/g, '<span class="para_break"><i class="copy_only">' + CM.format.line_break + "</i></span>");
	            m = m.replace(/\n\n/g, '<span class="para_break"><i class="copy_only">' + CM.format.line_break + "</i></span>");
	            m = m.replace(/\n/g, CM.format.line_break);
	            m = m.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
	            m = m.replace(/  /g, " &nbsp;");
	            m = m.replace(/^ /g, "&nbsp;")
	        }
	        for (var f = 0; f < b.length; f++) {
	            var p = b[f];
	            m = m.replace(p.token, p.str.replace(/\$/g, "$$$$"))
	        }
	        return m
	    }
	},
    log: function(c, a) {
        if (!window.console) {
            return
        }
        var b =  ["0"];
        if (c != "0" && b.indexOf(c.toString()) == -1 && b.indexOf("all") == -1) {
            return
        }
        if (typeof a == "object") {
            console.log(a)
        } else {
            console.log(CMMakeLogDate() + c + " " + a)
        }
    },
    info: function(a) {
        if (!window.console || !console.info) {
            return
        }
        console.info(CMMakeLogDate() + a)
    },
    warn: function(a) {
        if (!window.console || !console.warn) {
            return
        }
        console.warn(CMMakeLogDate() + a)
    },
    error: function (a) {
        if (!window.console || !console.error) {
            return
        }
        console.error(CMMakeLogDate() + a)
    }, logError: function (a, b) {
        if (window.console && console.error) {
            console.error(CMMakeLogDate() + "logging e:" + a + " desc:" + b)
        }
    }, track: function (a) {
        if (window.track) {
            CM.info("tracking: " + a);
            window.track(a)
        } else {
            CM.warn('could not track "' + a + '" because there is no window.track')
        }
    }
};
var CM_last_log_date = null;
var CMMakeLogDate = function() {
	var date = new Date();
	
	var y = date.getFullYear();
	var mo = date.getMonth()+1;
	var d = date.getDate();

	var h = date.getHours();
	var mi = date.getMinutes();
	var s = date.getSeconds();
	var ms = date.getMilliseconds();
	var str = y+'/'+mo+'/'+d+' '+h+':'+mi+':'+s+'.'+ms;
	if (CM_last_log_date) {
		var diff = date-CM_last_log_date;
		//str+= ' ('+diff+'ms)';
	}
	CM_last_log_date = date;
	return str+' ';
};
(function() {
    
    $(document).ready(function() {
    	$.ajax({  
            type : "get",  
            url : boot_data.team_url+'/assets/teammsg/js/templates.html',  
            //data : "test=" + test,  
            async : false,  
            cache: false,
            success : function(data){ 
            	$("body").append(data); 
            	$("body").addClass("light_theme");
            	
            	CM.initApp();
            }});
        
        
    });

})();