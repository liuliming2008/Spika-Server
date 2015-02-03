CM.view = {
	banner_el:$("#client_banner"),
    input_el:$("#message-input"),
	banner_h: 50,
	team_menu_h: $("#team_menu").height(),
    footer_outer_h:$("#footer").height(),
    
    msgs_scroller_div: null,
    msgs_div: null,
    last_read_msg_div: null,
    msgs_unread_divider: null,
    last_rendered_msg: null,
    
    msgs_unread_divider:null,
    
    onStart: function(){
    	
		$(window).resize(CM.view.onResize);
		CM.view.msgs_div = $("#msgs_div");
        CM.view.msgs_scroller_div = $("#msgs_scroller_div");
        $("#msgs_scroller_div").niceScroll({
    		cursoropacitymin: 0.2, // change opacity when cursor is inactive (scrollabar "hidden" state), range from 1 to 0
            cursoropacitymax: 1, // change opacity when cursor is active (scrollabar "visible" state), range from 1 to 0
            cursorwidth: 12, // cursor width in pixel (you can also write "5px")
            cursorborder: "0px solid #fff", // css definition for cursor border
            cursorcolor:"#372c36",
            horizrailenabled: true, 
        });
        //CM.view.updateClosestScroller($("#msgs_scroller_div"));
        $("#channels_scroller").niceScroll({
        		cursoropacitymin: 0.2, // change opacity when cursor is inactive (scrollabar "hidden" state), range from 1 to 0
                cursoropacitymax: 1, // change opacity when cursor is active (scrollabar "visible" state), range from 1 to 0
                cursorwidth: 12, // cursor width in pixel (you can also write "5px")
                cursorborder: "0px solid #fff", // css definition for cursor border
                cursorcolor:"#372c36",
                horizrailenabled: true, 
        });
        //CM.view.updateClosestScroller($("#channels_scroller"));
        
		CM.view.msgs_div.bind("click.view", CM.view.onMsgsDivClick);
//		CM.channels.renamed_sig.add(CM.view.channelRenamed, CM.view);
        CM.channels.switched_sig.add(CM.view.channelSwitched, CM.view);
//        CM.channels.created_sig.add(CM.view.channelCreated, CM.view);
//        CM.channels.deleted_sig.add(CM.view.channelDeleted, CM.view);
//        CM.channels.joined_sig.add(CM.view.channelJoined, CM.view);
//        CM.channels.member_joined_sig.add(CM.view.channelMemberJoined, CM.view);
//        CM.channels.left_sig.add(CM.view.channelLeft, CM.view);
//        CM.channels.member_left_sig.add(CM.view.channelMemberLeft, CM.view);
//        CM.channels.history_fetched_sig.add(CM.view.channelHistoryFetched, CM.view);
//        CM.channels.history_being_fetched_sig.add(CM.view.channelHistoryBeingFetched, CM.view);
        CM.channels.message_received_sig.add(CM.view.channelMessageReceived, CM.view);
//        CM.channels.message_removed_sig.add(CM.view.channelMessageRemoved, CM.view);
//        CM.channels.message_changed_sig.add(CM.view.channelMessageChanged, CM.view);
//        CM.channels.marked_sig.add(CM.view.channelMarked, CM.view);
//        CM.channels.unread_changed_sig.add(CM.view.channelUnreadCountChanged, CM.view);
//        CM.channels.unread_highlight_changed_sig.add(CM.view.channelUnreadHighlightCountChanged, CM.view);
//        CM.channels.topic_changed_sig.add(CM.view.channelTopicChanged, CM.view);
//        CM.channels.purpose_changed_sig.add(CM.view.channelPurposeChanged, CM.view);
//        CM.channels.archived_sig.add(CM.view.channelArchived, CM.view);
//        CM.channels.unarchived_sig.add(CM.view.channelUnArchived, CM.view);
//        CM.channels.msg_not_sent_sig.add(CM.view.channelMsgNotsent, CM.view);
//        CM.groups.renamed_sig.add(CM.view.groupRenamed, CM.view);
        CM.groups.switched_sig.add(CM.view.groupSwitched, CM.view);
//        CM.groups.deleted_sig.add(CM.view.groupDeleted, CM.view);
//        CM.groups.joined_sig.add(CM.view.groupJoined, CM.view);
//        CM.groups.member_joined_sig.add(CM.view.groupMemberJoined, CM.view);
//        CM.groups.left_sig.add(CM.view.groupLeft, CM.view);
//        CM.groups.member_left_sig.add(CM.view.groupMemberLeft, CM.view);
//        CM.groups.history_fetched_sig.add(CM.view.groupHistoryFetched, CM.view);
//        CM.groups.history_being_fetched_sig.add(CM.view.groupHistoryBeingFetched, CM.view);
        CM.groups.message_received_sig.add(CM.view.groupMessageReceived, CM.view);
//        CM.groups.message_removed_sig.add(CM.view.groupMessageRemoved, CM.view);
//        CM.groups.message_changed_sig.add(CM.view.groupMessageChanged, CM.view);
//        CM.groups.marked_sig.add(CM.view.groupMarked, CM.view);
//        CM.groups.unread_changed_sig.add(CM.view.groupUnreadCountChanged, CM.view);
//        CM.groups.unread_highlight_changed_sig.add(CM.view.groupUnreadHighlightCountChanged, CM.view);
//        CM.groups.topic_changed_sig.add(CM.view.groupTopicChanged, CM.view);
//        CM.groups.purpose_changed_sig.add(CM.view.groupPurposeChanged, CM.view);
//        CM.groups.opened_sig.add(CM.view.groupOpened, CM.view);
//        CM.groups.closed_sig.add(CM.view.groupClosed, CM.view);
//        CM.groups.archived_sig.add(CM.view.groupArchived, CM.view);
//        CM.groups.unarchived_sig.add(CM.view.groupUnArchived, CM.view);
//        CM.groups.msg_not_sent_sig.add(CM.view.groupMsgNotSent, CM.view);
//        CM.ims.opened_sig.add(CM.view.imOpened, CM.view);
//        CM.ims.closed_sig.add(CM.view.imClosed, CM.view);
        CM.ims.switched_sig.add(CM.view.imSwitched, CM.view);
//        CM.ims.history_fetched_sig.add(CM.view.imHistoryFetched, CM.view);
//        CM.ims.history_being_fetched_sig.add(CM.view.imHistoryBeingFetched, CM.view);
        CM.ims.message_received_sig.add(CM.view.imMessageReceived, CM.view);
//        CM.ims.message_removed_sig.add(CM.view.imMessageRemoved, CM.view);
//        CM.ims.message_changed_sig.add(CM.view.imMessageChanged, CM.view);
//        CM.ims.marked_sig.add(CM.view.imMarked, CM.view);
//        CM.ims.unread_changed_sig.add(CM.view.imUnreadCountChanged, CM.view);
//        CM.ims.unread_highlight_changed_sig.add(CM.view.imUnreadHighlightCountChanged, CM.view);
//        CM.ims.msg_not_sent_sig.add(CM.view.imMsgNotsent, CM.view);
//        

	},
	was_at_bottom_at_first_resize_event: false,
    resize_tim: 0,
    onResize: function() {
//        if (!CM.view.triggering_resize) {
//            CM.view.cached_wh = 0
//        }
//        CM.ui.cached_scroller_rect = null;
//        CM.ui.cached_search_scroller_rect = null;
//        CM.ui.cached_channels_scroller_rect = null;
//        if (CM.view.resize_tim) {
//            clearTimeout(CM.view.resize_tim);
//            CM.view.resize_tim = 0
//        } else {
//            CM.view.was_at_bottom_at_first_resize_event = CM.ui.areMsgsScrolledToBottom(50)
//        }
//        CM.view.resize_tim = setTimeout(function() {
//            clearTimeout(CM.view.resize_tim);
//            CM.view.resize_tim = 0;
//            CM.view.resize(true)
//        }, 250);
//        if (CM.view.triggering_resize) {
//            return
//        }
        CM.view.resize();//false, true)
    },
    team_menu_h: $("#team_menu").height(),
    cached_wh: 0,
    last_input_height: 0,
    last_input_container_height: 0,
    msgs_scroller_y: -1,
    
    default_col_flex_top: -1,
    triggering_resize: false,
    resizeManually: function(a, b) {
        a = a || "unspecified";
        CM.log(389, "======================================resizeManually (" + a + ") starting");
        var c = CM.utility.date.getTimeStamp();
        CM.view.resize(false, false, !!b);
        CM.log(389, "======================================resizeManually (" + a + ") took " + (CM.utility.date.getTimeStamp() - c) + "ms")
    },
    setFlexMenuSize: function() {
        $("#menu_items_scroller").css("max-height", CM.view.cached_wh - 200);
        CM.ui.updateClosestMonkeyScroller($("#menu_items_scroller"))
    },
    cached_wh: 0,
    resizexxx: function(j, i, h) {
//        var c = CM.utility.date.getTimeStamp();
//        CM.log(389, c + " #1 cached_wh:" + CM.view.cached_wh + " CM.view.resize from_timer:" + j + " no_trigger:" + i + " " + (CM.utility.date.getTimeStamp() - c) + "ms");
//        c = CM.utility.date.getTimeStamp();
//        var a = CM.ui.areMsgsScrolledToBottom(50);
//        CM.log(389, c + " #2 " + (CM.utility.date.getTimeStamp() - c) + "ms");
//        c = CM.utility.date.getTimeStamp();
//        var f = CM.view.cached_wh == 0;
//        var b = CM.view.cached_wh = CM.view.cached_wh || $(window).height();
//        if (CM.view.msgs_scroller_y == -1) {
//            CM.view.msgs_scroller_y = CM.view.msgs_scroller_div.offset().top
//        }
//        if (CM.view.footer_outer_h == -1) {
//            CM.view.footer_outer_h = $("#footer").outerHeight()
//        }
//        if (CM.view.default_col_flex_top == -1) {
//            CM.view.default_col_flex_top = parseInt($("#col_flex").css("top"))
//        }
//        var d = (CM.view.banner_el.hasClass("hidden")) ? 0 : parseInt(CM.view.banner_el.css("height"));
//        if (d) {
//            $("#col_flex").css("top", CM.view.default_col_flex_top + d)
//        } else {
//            $("#col_flex").css("top", CM.view.default_col_flex_top)
//        } if (CM.model.menu_is_showing) {
//            CM.view.setFlexMenuSize()
//        }
//        $("#col_channels_bg").css("top", d);
//        if (f || !!CM.view.last_input_height) {
//            if (!CM.view.last_input_height) {
//                CM.view.measureInput()
//            }
//            $("#message-form").css("height", CM.view.last_input_height);
//            var g = b - CM.view.msgs_scroller_y - CM.view.last_input_container_height - (22 + d);
//            CM.view.msgs_scroller_div.css("height", g);
//            var l = b - CM.view.msgs_scroller_y;
//            $("#flex_contents > .tab-pane").css("height", l);
//            $("#channels_scroller").css("height", b - CM.view.team_menu_h - (CM.view.footer_outer_h + d))
//        }
//        CM.log(389, c + " #10 " + (CM.utility.date.getTimeStamp() - c) + "ms");
//        c = CM.utility.date.getTimeStamp();
//        if (true || f || CM.view.never_set) {
//            $(".flex_content_scroller").each(function(n) {
//                var o = $(this);
//                if (o.is(":hidden")) {
//                    return
//                }
//                CM.view.never_set = false;
//                var m = o.offset().top;
//                var p = b - m;
//                o.css("height", p)
//            })
//        }
//        CM.log(389, c + " #11 wh_changed:" + f + " " + (CM.utility.date.getTimeStamp() - c) + "ms");
//        c = CM.utility.date.getTimeStamp();
//        CM.view.padOutMsgsScroller();
//        if (!h && (a || CM.view.was_at_bottom_at_first_resize_event)) {
//            CM.ui.instaScrollMsgsToBottom()
//        }
//        if (j) {
//            CM.view.was_at_bottom_at_first_resize_event = false
//        } else {
//            if (!i) {
//                CM.view.triggering_resize = true;
//                $(window).trigger("resize");
//                CM.view.triggering_resize = false
//            }
//        }
//        CM.ui.checkUnseenChannelsImsGroupsWithUnreads();
//        if (CM.view.msgs_unscrollable) {
//            CM.view.makeMsgsDivUnscrollable()
//        }
//        CM.ui.msg_tab_complete.positionUI();
//        if ($("#lightbox_dialog").is(":visible")) {
//            CM.ui.lightbox_dialog.position()
//        }
//        var k = $("#msgs_div").width();
//        CM.view.makeAttachmentWidthRule(k);
//        if (k > 400) {
//            $("#notification_bar").addClass("wide")
//        } else {
//            $("#notification_bar").removeClass("wide")
//        } if (k > 600) {
//            $("#notification_bar").addClass("really_wide")
//        } else {
//            $("#notification_bar").removeClass("really_wide")
//        }
//        CM.log(389, c + " #15 " + (CM.utility.date.getTimeStamp() - c) + "ms")
    },
    never_set: true,
    measureInput: function() {
        CM.view.last_input_height = CM.view.input_el[0].offsetHeight;
        $("#messages-input-container").css("height", CM.view.last_input_height);
        CM.view.last_input_container_height = $("#messages-input-container").outerHeight()
    },
	resize: function(){
		var booting=CM.view.cached_wh==0;
        var cur_windows_h = CM.view.cached_wh = $(window).height();//CM.view.cached_wh || $(window).height();
       
        if (CM.view.msgs_scroller_y == -1) {
            CM.view.msgs_scroller_y = CM.view.msgs_scroller_div.offset().top
        }
        if (CM.view.footer_outer_h == -1) {
            CM.view.footer_outer_h = $("#footer").outerHeight()
        }
        if (CM.view.default_col_flex_top == -1) {
            CM.view.default_col_flex_top = parseInt($("#col_flex").css("top"))
        }
        
        var banner_h=(CM.view.banner_el.length==0)?0:((CM.view.banner_el.hasClass("hidden"))?0:parseInt(CM.view.banner_el.css("height")));
        
        if (banner_h) {
            $("#col_flex").css("top", CM.view.default_col_flex_top + d)
        } else {
            $("#col_flex").css("top", CM.view.default_col_flex_top)
        } 
        if (CM.model.menu_is_showing) {
//            CM.view.setFlexMenuSize()
        }
        $("#col_channels_bg").css("top", banner_h);
        if (booting || !!CM.view.last_input_height) {
            if (!CM.view.last_input_height) {
                CM.view.measureInput()
            }
            $("#message-form").css("height", CM.view.last_input_height);
            var msgs_scroller_h = cur_windows_h - CM.view.msgs_scroller_y - CM.view.last_input_container_height - (22 + banner_h);
            CM.view.msgs_scroller_div.css("height", msgs_scroller_h);
            var flex_contents_h = cur_windows_h - CM.view.msgs_scroller_y;
            $("#flex_contents > .tab-pane").css("height", flex_contents_h);
            $("#channels_scroller").css("height", cur_windows_h - CM.view.team_menu_h - (CM.view.footer_outer_h + banner_h))
        }
        if (true || f || CM.view.never_set) {
            $(".flex_content_scroller").each(function(n) {
                var o = $(this);
                if (o.is(":hidden")) {
                    return
                }
                CM.view.never_set = false;
                var m = o.offset().top;
                var p = cur_windows_h - m;
                o.css("height", p)
            })
        }
//        $("#channels_scroller").css("height",cur_windows_h-CM.view.footer_outer_h-CM.view.team_menu_h-banner_h);
//        $("#msgs_scroller_div").css("height",cur_windows_h-CM.view.footer_outer_h-CM.view.team_menu_h-banner_h);
//        //$("#channels_scroller").perfectScrollbar('update');
//        
//        //CM.view.resizeClosestScroller($("#channels_scroller"));
//        //CM.view.resizeClosestScroller($("#msgs_scroller_div"));
//        $("#channels_scroller").getNiceScroll().resize();
//        $("#msgs_scroller_div").getNiceScroll().resize();
//        $("#channels_scroller").getNiceScroll().show();
//        $("#msgs_scroller_div").getNiceScroll().show();        
//        CM.view.updateClosestScroller($("#channels_scroller"));
//        CM.view.updateClosestScroller($("#msgs_scroller_div"));
//        

//        var scrollers = $("#msgs_scroller_div").getNiceScroll();
//        scroller = scrollers[0];
//        if( scrollers[0].ishwscroll && scrollers[1])
//        	scroller = scrollers[1]; 
//        var yPos = scroller.docscroll.scrollTop;
//        var yMax = scroller.docscroll.scrollTopMax;
//        scroller.resize();
//        if(yPos == yMax)
//        	scroller.scrollPos(scroller.docscroll.scrollTopMax, 500);
        
	},
	updateClosestScroller: function(el){
		//var scrollers = $(el).getNiceScroll();
		while( !$(el).getNiceScroll() && $(el) != $(document)) {
			//scrollers = $(el).getNiceScroll();
			el = $(el).parent();
		}
		if(!($(el).getNiceScroll())) return;
		//scroller = $(el).getNiceScroll()[0];
		
		$index=0;
        if( $(el).getNiceScroll()[$index].ishwscroll && $(el).getNiceScroll()[$index+1])
        	$index++; 
        
        var yPos = $(el).getNiceScroll()[$index].docscroll[0].scrollTop;
        
        
        //$(el).getNiceScroll().resize();
        $(el).getNiceScroll().resize();
        var yMax = $(el).getNiceScroll()[$index].docscroll[0].scrollTopMax;
        if(yPos == $(el).getNiceScroll()[$index].docscroll[0].prevMax){
        	//scrollers
        	//scroller.doScrollTop(yMax,500);//Pos(0, scroller.docscroll[0].scrollTopMax);
        	//scrollers.doScrollPos(0, yMax);
        	$(el).getNiceScroll()[$index].docscroll.scrollTop(yMax);//, 500);
        	
        }
        //scrollers.show();
       
        $(el).getNiceScroll()[$index].docscroll[0].prevMax = yMax;
	},
	scrollToTop: function(el){
		//var scrollers = $(el).getNiceScroll();
		while( !$(el).getNiceScroll() && $(el) != $(document)) {
			//scrollers = $(el).getNiceScroll();
			el = $(el).parent();
		}
		if(!($(el).getNiceScroll())) return;
		//scroller = $(el).getNiceScroll()[0];
		
		$index=0;
        if( $(el).getNiceScroll()[$index].ishwscroll && $(el).getNiceScroll()[$index+1])
        	$index++; 
        $(el).getNiceScroll().resize();
        //var yPos = $(el).getNiceScroll()[$index].docscroll[0].scrollTop;
        var yMax = $(el).getNiceScroll()[$index].docscroll[0].scrollTopMax;
        
        //$(el).getNiceScroll().resize();
        //scrollers.doScrollPos(0, 0);
        $(el).getNiceScroll()[$index].docscroll.scrollTop(0);
        $(el).getNiceScroll()[$index].docscroll[0].prevMax = yMax;
	},
	scrollToBottom: function(el){
		//var scrollers = $(el).getNiceScroll();
		while( !$(el).getNiceScroll() && $(el) != $(document)) {
			//scrollers = $(el).getNiceScroll();
			el = $(el).parent();
		}
		if(!($(el).getNiceScroll())) return;
		//scroller = $(el).getNiceScroll()[0];
		
		$index=0;
        if( $(el).getNiceScroll()[$index].ishwscroll && $(el).getNiceScroll()[$index+1])
        	$index++; 
        $(el).getNiceScroll().resize();
        //var yPos = $(el).getNiceScroll()[$index].docscroll[0].scrollTop;
        var yMax = $(el).getNiceScroll()[$index].docscroll[0].scrollTopMax;
        
        //$(el).getNiceScroll().resize();
        //scrollers.doScrollPos(0, yMax);
        $(el).getNiceScroll()[$index].docscroll.scrollTop(yMax);//, 500);
        $(el).getNiceScroll()[$index].docscroll[0].prevMax = yMax;
	},
	
	update_groups:function(){
		CM.view.rebuildChannelList();
//		var channel_list_html= CM.templates.channel_list(CM.model);
//    	$('#channel-list').html(channel_list_html);
    	var im_list_html= CM.templates.im_list(CM.model);
    	$('#im-list').html(im_list_html);
    	var group_list_html= CM.templates.group_list(CM.model);
    	$('#group-list').html(group_list_html);
    	
//    	var channels_scroller=$("#channels_scroller").perfectScrollbar();
    	$("#channels_scroller").css({visibility:"visible"});
//    	CM.view.resize();
	},
    updateTitleWithContext: function() {
        var c, activeOb, name, f, docTitle;
        activeOb = CM.shared.getActiveModelOb();
        if (!activeOb) {
            return
        }
        name = activeOb.name || "";
        if (!name) {
            return
        }
        context_separator = " | ";
        docTitle = document.title;
        f = docTitle.indexOf(context_separator);
        if (f !== -1) {
            docTitle = name + context_separator + docTitle.substr(f + context_separator.length)
        } else {
            docTitle = name + context_separator + docTitle
        }
        document.title = docTitle
    },
    submit: function(a) {
//        if (!CM.model.socket_connected && CM.view.input_el.val() != "/wake") {
//            return false
//        }
        CM.ui.onSubmit(CM.view.input_el.val(), a);
        return true
    },
    focusMessageInput: function() {
//        var a = CM.ims.getImById(CM.model.active_im_id);
//        if (a && CM.members.getMemberById(a.user).deleted) {
//            CM.view.input_el.attr("placeholder", "account deactivated");
//            CM.view.input_el.prop("disabled", true);
//            return
//        }
        CM.view.input_el.removeAttr("placeholder");
        CM.view.input_el.prop("disabled", false);
        if (CM.model.is_iOS || CM.model.is_ms_tablet) {
            return
        }
        CM.view.input_el.focus();
        CM.view.input_el.setCursorPosition(1000000)
    },
    clearMessageInput: function() {
        CM.ui.populateChatInput("")
    },
    switchedHelper: function() {
//        CM.view.clearBlueBarTimer();
//        CM.view.cacheMsgsHtml();
        CM.view.rebuildAll();
        CM.view.focusMessageInput();
//        CM.view.checkIfInputShouldBeDisabledAndPopulate();
//        CM.view.showInterstitialAfterChannelOrImShown()
        
        //todo: scroll to unread
//        $("#msgs_scroller_div").getNiceScroll().resize();
//        CM.view.scrollToBottom($("#msgs_scroller_div")); 
//        
//        $("#channels_scroller").getNiceScroll().resize();
//        $("#msgs_scroller_div").getNiceScroll().resize();
//        $("#channels_scroller").getNiceScroll().show();
//        $("#msgs_scroller_div").getNiceScroll().show();   
        
    },
    channelSwitched: function() {
        var c = new Date();
        CM.view.switchedHelper();
        if (CM.model.ui_state.member_list_visible) {
            CM.ui.showMemberList()
        }
        if (CM.model.prefs.seen_welcome_2) {
            CM.view.unAdjustForWelcomeSlideShow()
        } else {
            if (CM.shared.getActiveModelOb().id == CM.model.welcome_model_ob.id) {
                CM.view.adjustForWelcomeSlideShow()
            } else {
                CM.view.unAdjustForWelcomeSlideShow()
            }
        }
        CM.view.updateTitleWithContext();
//        CM.view.updateTypingText();
        var a = new Date();
        var b = (a - c);
        if (!CM.view.slow_switch_caught && b > CM.view.slow_switch_threshold) {
            CM.logError({
                message: "CM.view.channelSwitched > " + CM.view.slow_switch_threshold + " ms"
            }, " took " + b + " ms. App open for " + ((a - CM.view.start_time) / 1000 / 60).toFixed(2) + " min. localStorage = " + (CM.model && CM.model.prefs && CM.model.prefs.ls_disabled ? 0 : 1));
            CM.view.slow_switch_caught = true
        }
    },
    channelRenamed: function() {
        CM.view.rebuildAll();
        CM.view.updateTitleWithContext()
    },
    channelJoined: function(a) {
        CM.view.rebuildChannelList();
        CM.view.rebuildStarredList()
    },
    channelCreated: function(a) {
        CM.view.rebuildChannelList();
        CM.view.rebuildStarredList()
    },
    channelDeleted: function(a) {
        CM.view.rebuildChannelList();
        CM.view.rebuildStarredList()
    },
    channelMemberJoined: function(a, b) {
        if (a.id != CM.model.active_channel_id) {
            return
        }
        CM.view.rebuildChannelMembersList();
        if (a.needs_created_message) {
            CM.view.overlay.startWithCreatedChannel(a)
        }
    },
    channelLeft: function(a) {
        CM.view.rebuildChannelList();
        CM.view.rebuildStarredList()
    },
    channelMemberLeft: function(b, a) {
        if (b.id != CM.model.active_channel_id) {
            return
        }
        CM.view.rebuildChannelMembersList()
    },
    assignLastReadMsgDiv: function(a) {
        if (!a) {
            return
        }
        if (!a.msgs.length) {
            return
        }
        var c = CM.utility.msgs.getMsg(a.last_read, a.msgs);
        if (c && !c.no_display) {
            CM.view.last_read_msg_div = CM.view.getDivForMsg(a.last_read);
            return
        }
        var b = CM.utility.msgs.getOldestValidTs(a.msgs);
        if (a.last_read > b) {
            var c = CM.utility.msgs.getDisplayedMsgBeforeTS(a.last_read, a.msgs);
            if (c) {
                CM.info(c.ts + " from CM.utility.msgs.getDisplayedMsgBeforeTS(" + a.last_read + ") " + c.ts + " < " + a.last_read + " = " + (c.ts < a.last_read));
                CM.view.last_read_msg_div = CM.view.getDivForMsg(c.ts)
            } else {
                CM.view.last_read_msg_div = null;
                CM.error("WTF nulling out CM.view.last_read_msg_div because we could not find a message to use #1")
            }
        } else {
            CM.view.last_read_msg_div = null
        }
    },
    showUnSentControlsForMsg: function(a) {
        setTimeout(function() {
            CM.model.display_unsent_msgs[a.ts] = true;
            CM.view.rebuildMsg(a)
        }, 5000)
    },
    scroll_down_when_msg_from_user_is_added: false,
//    addMsg: function(h, c) {
//        var a = false;
//        var b = CM.shared.getActiveModelOb();
//        if (h.user == CM.model.user.id && CM.view.scroll_down_when_msg_from_user_is_added) {
//            CM.view.scroll_down_when_msg_from_user_is_added = false;
//            a = true
//        } else {
//            if (CM.ui.areMsgsScrolledToBottom()) {
//                a = true
//            }
//        }
//        var f = CM.view.last_rendered_msg;
//        var d = CM.templates.builders.buildMsgHTML({
//            msg: h,
//            model_ob: b,
//            prev_msg: f,
//            container_id: "msgs_div",
//            enable_slack_action_links: true
//        });
//        CM.view.msgs_div.append(d);
//        var i = CM.view.getDivForMsg(h.ts);
//        i.find(".timestamp").tooltip({
//            delay: {
//                show: 450,
//                hide: 150
//            },
//            container: "body"
//        });
//        CM.view.makeSureAllLinksHaveTargets(i);
//        if (!h.rsp_id) {
//            CM.view.last_in_stream_msg = h;
//            if (!h.no_display) {
//                CM.view.last_rendered_msg = h
//            }
//        }
//        CM.view.assignLastReadMsgDiv(b);
//        CM.view.padOutMsgsScroller();
//        if (a) {
//            CM.ui.instaScrollMsgsToBottom(false)
//        }
//        var g = CM.ui.isUserAttentionOnChat() && (c < 2);
//        if (h.user == CM.model.user.id || g) {
//            CM.ui.checkUnreads()
//        } else {
//            CM.ui.checkInlineImgs("main")
//        }
//        CM.view.insertUnreadDivider();
////        if ($("#msgs_scroller_div").data("monkeyScroll")) {
////            $("#msgs_scroller_div").data("monkeyScroll").updateFunc()
////        }
//        
//    },
    imMessageReceived: function(a, b) {
        if (!a.is_open) {
            CM.view.rebuildImList();
            CM.view.rebuildStarredList()
        }
        if (a.id != CM.model.active_im_id) {
            return
        }
        if (!b) {
            CM.error("no msg?");
            return
        }
        if (a.msgs.length == 1) {
            CM.view.rebuildMsgs()
        } else {
            CM.view.addMsg(b, a.unread_cnt)
        }
    },
    imHistoryFetched: function(a) {
        if (a.id != CM.model.active_im_id) {
            return
        }
        CM.ui.afterHistoryFetch(a)
    },
    imHistoryBeingFetched: function(a) {
        if (a.id != CM.model.active_im_id) {
            return
        }
        CM.view.updateEndMarker();
        var a = CM.ims.getImById(CM.model.active_im_id);
        if (!a || !a.msgs.length) {
            return
        }
        if (CM.model.socket_connected) {
            var b = CM.utility.msgs.getDisplayedMsgs(a.msgs);
            CM.ui.last_top_msg = b[b.length - 1]
        } else {
            CM.ui.last_top_msg = null
        }
        CM.view.updateEndMarker();
        $("html").unbind("mousemove.monkeyScroll")
    },
    imSwitched: function() {
        CM.view.switchedHelper();
        CM.ui.hideMemberList();
//        CM.view.unAdjustForWelcomeSlideShow();
        CM.view.updateTitleWithContext();
//        CM.view.updateTypingText();
        if (navigator.userAgent.match(/chrome/i)) {
            window.setTimeout(CM.view.updateTitleWithContext, 20)
        }
    },
    imOpened: function(a) {
        CM.view.rebuildChannelMembersList();
        CM.view.rebuildImList();
        CM.view.rebuildStarredList()
    },
    imClosed: function(a) {
        CM.view.rebuildChannelMembersList();
        CM.view.rebuildImList();
        CM.view.rebuildStarredList()
    },
    groupMessageReceived: function(a, b) {
        if (a.id != CM.model.active_group_id) {
            return
        }
        if (!b) {
            CM.error("no msg?");
            return
        }
        if (a.msgs.length == 1) {
            CM.view.rebuildMsgs()
        } else {
            CM.view.addMsg(b, a.unread_cnt)
        }
    },
    groupHistoryFetched: function(a) {
        if (a.id != CM.model.active_group_id) {
            return
        }
        CM.ui.afterHistoryFetch(a)
    },
    groupHistoryBeingFetched: function(b) {
        if (b.id != CM.model.active_group_id) {
            return
        }
        CM.view.updateEndMarker();
        var b = CM.groups.getGroupById(CM.model.active_group_id);
        if (!b || !b.msgs.length) {
            return
        }
        if (CM.model.socket_connected) {
            if (b.history_changed) {
                CM.ui.last_top_msg = null
            } else {
                var a = CM.utility.msgs.getDisplayedMsgs(b.msgs);
                CM.ui.last_top_msg = a[a.length - 1]
            }
        } else {
            CM.ui.last_top_msg = null
        }
        $("html").unbind("mousemove.monkeyScroll")
    },
    groupSwitched: function() {
        CM.view.switchedHelper();
        if (CM.model.ui_state.member_list_visible) {
            CM.ui.showMemberList()
        }
//        CM.view.unAdjustForWelcomeSlideShow();
        CM.view.updateTitleWithContext();
//        CM.view.updateTypingText()
    },
    groupJoined: function(a) {
        CM.view.rebuildGroupList();
        CM.view.rebuildStarredList()
    },
    groupDeleted: function(a) {
        CM.view.rebuildGroupList();
        CM.view.rebuildStarredList()
    },
    created_group_overlay_tim: 0,
    groupMemberJoined: function(a, b) {
        if (a.id != CM.model.active_group_id) {
            return
        }
        CM.view.rebuildChannelMembersList();
        if (a.needs_created_message) {
            clearTimeout(CM.view.created_group_overlay_tim);
            CM.view.created_group_overlay_tim = setTimeout(function() {
                if (a.id == CM.model.active_group_id) {
                    CM.view.overlay.startWithCreatedGroup(a)
                }
            }, 1000)
        }
    },
    groupLeft: function(a) {
        CM.view.rebuildGroupList();
        CM.view.rebuildStarredList()
    },
    groupMemberLeft: function(b, a) {
        if (b.id != CM.model.active_group_id) {
            return
        }
        CM.view.rebuildChannelMembersList()
    },
    groupOpened: function(a) {
        CM.view.rebuildChannelMembersList();
        CM.view.rebuildGroupList();
        CM.view.rebuildStarredList()
    },
    groupClosed: function(a) {
        CM.view.rebuildChannelMembersList();
        CM.view.rebuildGroupList();
        CM.view.rebuildStarredList()
    },
    channelUnreadCountChanged: function(b, c) {
        if (!b) {
            return
        }
        var a = "." + CM.templates.makeChannelDomId(b);
        if (b.unread_cnt == 0) {
            $(a).removeClass("unread mention")
        } else {
            $(a).addClass("unread");
            if (b.unread_highlight_cnt > 0) {
                $(a).addClass("mention")
            }
        }
        a = "." + CM.templates.makeUnreadJustDomId(b);
        if (b.unread_cnt == 0) {
            $(a).html(b.unread_cnt).addClass("hidden")
        } else {
            if (b.unread_cnt < 10) {
                $(a).html(b.unread_cnt).removeClass("hidden")
            } else {
                $(a).html("9+").removeClass("hidden")
            }
        }
//        CM.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    channelUnreadHighlightCountChanged: function(b, c) {
        if (!b) {
            return
        }
        var a = "." + CM.templates.makeUnreadHighlightDomId(b);
        if (b.unread_highlight_cnt == 0) {
            $(a).html(b.unread_highlight_cnt).addClass("hidden")
        } else {
            if (b.unread_highlight_cnt < 10) {
                $(a).html(b.unread_highlight_cnt).removeClass("hidden")
            } else {
                $(a).html("9+").removeClass("hidden")
            }
        }
    },
    channelMessageReceived: function(a, b) {
        if (a.id != CM.model.active_channel_id) {
            return
        }
        if (!b) {
            CM.error("no msg?");
            return
        }
        if (a.msgs.length == 1) {
            CM.view.rebuildMsgs()
        } else {
            CM.view.addMsg(b, a.unread_cnt)
        }
    },
    channelHistoryFetched: function(a) {
        if (a.id != CM.model.active_channel_id) {
            return
        }
        CM.ui.afterHistoryFetch(a)
    },
    channelHistoryBeingFetched: function(b) {
        if (b.id != CM.model.active_channel_id) {
            return
        }
        CM.view.updateEndMarker();
        var b = CM.channels.getChannelById(CM.model.active_channel_id);
        if (!b || !b.msgs.length) {
            return
        }
        if (CM.model.socket_connected) {
            if (b.history_changed) {
                CM.ui.last_top_msg = null
            } else {
                var a = CM.utility.msgs.getDisplayedMsgs(b.msgs);
                CM.ui.last_top_msg = a[a.length - 1]
            }
        } else {
            CM.ui.last_top_msg = null
        }
        $("html").unbind("mousemove.monkeyScroll")
    },
    channelSwitched: function() {
        var c = new Date();
        CM.view.switchedHelper();
        if (CM.model.ui_state.member_list_visible) {
            CM.ui.showMemberList()
        }
//        if (CM.model.prefs.seen_welcome_2) {
//            CM.view.unAdjustForWelcomeSlideShow()
//        } else {
//            if (CM.shared.getActiveModelOb().id == CM.model.welcome_model_ob.id) {
//                CM.view.adjustForWelcomeSlideShow()
//            } else {
//                CM.view.unAdjustForWelcomeSlideShow()
//            }
//        }
        CM.view.updateTitleWithContext();
//        CM.view.updateTypingText();
        var a = new Date();
        var b = (a - c);
        if (!CM.view.slow_switch_caught && b > CM.view.slow_switch_threshold) {
            CM.logError({
                message: "CM.view.channelSwitched > " + CM.view.slow_switch_threshold + " ms"
            }, " took " + b + " ms. App open for " + ((a - CM.view.start_time) / 1000 / 60).toFixed(2) + " min. localStorage = " + (CM.model && CM.model.prefs && CM.model.prefs.ls_disabled ? 0 : 1));
            CM.view.slow_switch_caught = true
        }
    },
    channelRenamed: function() {
        CM.view.rebuildAll();
        CM.view.updateTitleWithContext()
    },
    channelJoined: function(a) {
        CM.view.rebuildChannelList();
        CM.view.rebuildStarredList()
    },
    channelCreated: function(a) {
        CM.view.rebuildChannelList();
        CM.view.rebuildStarredList()
    },
    channelDeleted: function(a) {
        CM.view.rebuildChannelList();
        CM.view.rebuildStarredList()
    },
    channelMemberJoined: function(a, b) {
        if (a.id != CM.model.active_channel_id) {
            return
        }
        CM.view.rebuildChannelMembersList();
        if (a.needs_created_message) {
            CM.view.overlay.startWithCreatedChannel(a)
        }
    },
    channelLeft: function(a) {
        CM.view.rebuildChannelList();
        CM.view.rebuildStarredList()
    },
    channelMemberLeft: function(b, a) {
        if (b.id != CM.model.active_channel_id) {
            return
        }
        CM.view.rebuildChannelMembersList()
    },

    rebuildAll: function() {
        CM.view.rebuildChannelList();
//        CM.view.rebuildChannelMembersList();
    	
        CM.view.rebuildImList();
        CM.view.rebuildGroupList();
        $("#channels_scroller").getNiceScroll().resize();
        $("#channels_scroller").getNiceScroll().show();
//        CM.view.rebuildStarredList();
        CM.view.displayTitle();
        CM.view.rebuildMsgs();
//        CM.view.makeSureActiveChannelIsInView()
        //CM.view.resize();
        
        
    },
    displayTitle: function() {
        var content_html = "";
        var f = $("#active_channel_name");
        f.tooltip("disable").tooltip("destroy");
        if (CM.model.active_im_id) {
            var b = CM.ims.getImById(CM.model.active_im_id);
            var g = CM.members.getMemberById(b.user);
            if (b) {
                //c = CM.templates.builders.buildStar("im", b) + '<span class="name"><span class="prefix">@</span>' + b.name + CM.templates.makeMemberPresenceIcon(g) + "</span>"
            	content_html = '<span class="name"><span class="prefix">@</span>' + b.name + CM.templates.makeMemberPresenceIcon(g) + "</span>"
                
            }
        } else {
            if (CM.model.active_channel_id || CM.model.active_group_id) {
                var a = CM.shared.getActiveModelOb();
                if (a) {
                    if (CM.model.active_channel_id) {
                    	//CM.templates.builders.buildStar("channel", a) +
                    	content_html =  '<span class="name"><span class="prefix">#</span>' + a.name + "</span><i id='channel_actions' class='fa fa-chevron-down'></i>"
                    } else {
                    	//CM.templates.builders.buildStar("group", a) + 
                    	content_html = '<span class="name"><span class="prefix">' + CM.model.group_prefix + "</span>" + a.name + "</span><i id='group_actions' class='fa fa-chevron-down'></i>"
                    } if (a.topic && a.topic.value) {
                    	content_html += '<span class="topic">' + CM.utility.formatTopicOrPurpose(a.topic.value) + "</span>"
                    }
                }
            }
        }
        f.html(content_html);
        if (a && a.topic && a.topic.value && a.topic.value.length > 50) {
            //f.attr("title", CM.utility.emojiReplace(CM.utility.linkify(a.topic.value, CM.templates.builders.newWindowName(), true)));
//            f.tooltip({
//                placement: "bottom",
//                html: true,
//                delay: {
//                    show: 1000,
//                    hide: 3000
//                },
//                container: "body"
//            });
//            var d = f.find(".topic");
//            f.hover(function() {
//                setTimeout(function() {
//                    var h = $(".tooltip").outerWidth();
//                    var i = parseInt(d.position().left) + (d.outerWidth() / 2) - (h / 2);
//                    var j = f.position().left + f.outerWidth();
//                    if (i > j) {
//                        i = j - (h / 2)
//                    }
//                    $(".tooltip").css({
//                        top: parseInt($(".tooltip").css("top")) - 15 + "px",
//                        left: i + "px"
//                    })
//                }, 1000)
//            }, function() {})
        }
//        CM.view.makeSureAllLinksHaveTargets(f);
        if (CM.model.active_channel_id) {
            $("#active_channel_name .name, #channel_actions").bind("click.channel_actions", function(h) {
//                if (CM.tips.maybeDoThrobberProxyClick("channel_menu_tip_card_throbber", h)) {
//                    return false
//                }
                CM.menu.startWithChannel(h, a.id)
            });
//            $("#active_channel_name .star_channel").bind("click", function(h) {
//                CM.stars.checkForStarClick(h)
//            })
        } else {
            if (CM.model.active_group_id) {
                $("#active_channel_name .name, #group_actions").bind("click.channel_actions", function(h) {
                    CM.menu.startWithGroup(h, a.id)
                });
//                $("#active_channel_name .star_group").bind("click", function(h) {
//                    CM.stars.checkForStarClick(h)
//                })
            } else {
                if (CM.model.active_im_id) {
                    $("#active_channel_name .name, #channel_actions").bind("click.channel_actions", function(h) {
                        if (b) {
                            CM.menu.startWithMember(h, b.user, false, false, true)
                        }
                    });
//                    $("#active_channel_name .star_im").bind("click", function(h) {
//                        CM.stars.checkForStarClick(h)
//                    })
                }
            }
        }
    },
    insertUnreadDivider: function() {
        if (!CM.view.msgs_unread_divider) {
            var b = CM.shared.getActiveModelOb();
            if (!b) {
                CM.error("insertUnreadDivider no channel, no im, no group");
                return
            }
            if (CM.view.last_in_stream_msg && b.last_read < CM.view.last_in_stream_msg.ts && b.unread_cnt) {
                var a = CM.templates.messages_unread_divider(b.last_read);
                if (CM.view.last_read_msg_div && CM.view.last_read_msg_div.length) {
                    CM.view.last_read_msg_div.after(a)
                } else {
                    var d = CM.utility.msgs.getOldestValidTs(b.msgs);
                    if (b.last_read > d) {
                        var c = CM.utility.msgs.getDisplayedMsgAfterTS(b.last_read, b.msgs);
                        var f;
                        if (c) {
                            f = CM.view.getDivForMsg(c.ts)
                        }
                        if (f.length) {
                            f.before(a)
                        } else {
                            CM.view.msgs_div.find(".message").last().before(a)
                        }
                    } else {
                        CM.view.msgs_div.find(".message").first().before(a)
                    }
                }
                CM.view.msgs_unread_divider = $("#msgs_unread_divider");
                CM.view.msgs_unread_divider.data("last_read_ts", b.last_read);
                $(".unread_divider").removeClass("no_unreads");
                CM.view.updateNewMsgsDisplay();
                if (CM.ui.isUnreadDividerInView()) {
                    CM.view.hideNewMsgsJumpLink();
                    $("#messages_unread_status").addClass("quiet")
                } else {
                    CM.view.showNewMsgsJumpLink();
                    $("#messages_unread_status").removeClass("quiet")
                }
                CM.view.showNewMsgsBar();
                CM.view.startNewMsgsTimer()
            }
        }
//        CM.view.updateNewMsgsDisplay()
    },
    new_msgs_tim: 0,
    startNewMsgsTimer: function() {
        clearTimeout(CM.view.new_msgs_tim);
        CM.view.new_msgs_tim = setTimeout(CM.view.onNewMsgsTimer, 1500)
    },
    hide_blue_bar_tim: 0,
    onNewMsgsTimer: function() {
        var a = CM.shared.getActiveModelOb();
        if (!a.unread_cnt) {
            if (CM.model.prefs.mark_msgs_read_immediately && !CM.model.prefs.start_scroll_at_oldest && !CM.view.hide_blue_bar_tim) {
                CM.view.hide_blue_bar_tim = setTimeout(function() {
                    CM.view.hideNewMsgsBar();
                    $(".unread_divider").addClass("no_unreads")
                }, 4000)
            } else {
                CM.view.hideNewMsgsBar();
                $(".unread_divider").addClass("no_unreads")
            }
        } else {
            CM.view.startNewMsgsTimer()
        }
    },
    clearBlueBarTimer: function() {
        clearTimeout(CM.view.hide_blue_bar_tim);
        CM.view.hide_blue_bar_tim = 0
    },
    hideNewMsgsBar: function() {
        CM.view.clearBlueBarTimer();
        $("#messages_unread_status").fadeOut(150)
    },
    showNewMsgsBar: function() {
        $("#messages_unread_status").fadeIn(150)
    },	
    clearUnreadDivider: function() {
        if (!CM.view.msgs_unread_divider) {
            return
        }
        CM.view.msgs_unread_divider.remove();
        CM.view.msgs_unread_divider = null;
        CM.view.hideNewMsgsBar()
    },
    rebuildMsgs: function() {
        CM.log(5, "rebuilding msgs for " + (CM.model.active_cid));
        CM.ui.auto_scrolling_msgs = false;
        CM.view.clearUnreadDivider();
        var msgs;
        var scrollTop = -1;
        var activeOb = CM.shared.getActiveModelOb();
        var activeObHtml = "";
        if (!activeOb) {
            CM.error("rebuildMsgs no channel, no im, no group");
            return
        }
        CM.view.last_rendered_msg = null;
        CM.view.last_in_stream_msg = null;
        scrollTop = activeOb.scroll_top;
        if( !activeOb.msgs ){
        	CM.sock.call('channels.getmsgs',{id:activeOb.id},function(status,data,params) {
        		var item;
              	for (var index = 0; index < data.msgs.length; index++) {
                        item = data.msgs[index];
                        item['is_ephemeral']=false;
                        item['no_display']=false;
              	}
              	activeOb.msgs=data.msgs;
        		CM.view.rebuildMsgs();		
            });
        	return;
        }
        msgs = activeOb.msgs;
        var msg;
        var prev_msg;
        var h, f;
//        $.each(CM.view.decorated_messages, function(i, j) {
//            if (j) {
//                if (j.edited && j.edited.tooltip) {
//                    j.edited.tooltip("destroy")
//                }
//                if (j.timestamp && j.timestamp.tooltip) {
//                    j.timestamp.tooltip("destroy")
//                }
//            }
//        });
        CM.view.msgs_div.empty();
        CM.view.decorated_messages = {};
        if (activeOb._cached_html) {
            CM.info("using _cached_html");
            activeObHtml = activeOb._cached_html;
            activeOb._cached_html = null
        } else {
            if (!msgs) {
            	activeObHtml = "-"
            } else {
                var b = CM.utility.date.getTimeStamp();
                if (!msgs.length) {
                	activeObHtml = ""
                }
                for (var g = msgs.length - 1; g > -1; g--) {
                    if (!msg || !msg.no_display) {
                    	prev_msg = msg
                    }
                    msg = msgs[g];
                    activeObHtml += CM.templates.builders.buildMsgHTML({
                        msg: msg,
                        model_ob: activeOb,
                        prev_msg: prev_msg,
                        container_id: "msgs_div",
                        enable_slack_action_links: true
                    });
                    if (!msg.rsp_id) {
                        CM.view.last_in_stream_msg = msg;
                        if (!msg.no_display) {
                            CM.view.last_rendered_msg = msg
                        }
                    }
                }
            }
        }
        CM.view.msgs_div.html(activeObHtml);
//        var d = {
//            show: 450,
//            hide: 150
//        };
//
//        function m(r, i, j) {
//            var q;
//            if (!r || !i || !j) {
//                return
//            }
//            q = window.setTimeout(function() {
//                if (CM.view.decorated_messages && CM.view.decorated_messages[r] && CM.view.decorated_messages[r][j] && CM.view.decorated_messages[r][j].tooltip) {
//                    CM.view.decorated_messages[r][j].tooltip("show")
//                }
//                q = null
//            }, d.show);
//            i.one("mouseout", function() {
//                if (q) {
//                    window.clearTimeout(q);
//                    q = null
//                }
//            })
//        }
//
//        function o() {
//            var i, j, q;
//            j = $(this);
//            i = j.parents(".message");
//            q = i.attr("id");
//            if (q && !CM.view.decorated_messages[q]) {
//                CM.view.decorated_messages[q] = {
//                    edited: i.find(".edited").tooltip({
//                        container: "body"
//                    }),
//                    timestamp: i.find(".timestamp").tooltip({
//                        delay: d,
//                        container: "body"
//                    })
//                };
//                if (j.hasClass("edited")) {
//                    CM.view.decorated_messages[q].edited.tooltip("show")
//                } else {
//                    if (j.hasClass("timestamp")) {
//                        m(q, j, "timestamp")
//                    }
//                }
//            }
//            j = null;
//            i = null;
//            q = null
//        }
//        CM.view.msgs_div.undelegate(".message .edited", "mouseover");
//        CM.view.msgs_div.undelegate(".message .timestamp", "mouseover");
//        CM.view.msgs_div.delegate(".message .edited", "mouseover", o);
//        CM.view.msgs_div.delegate(".message .timestamp", "mouseover", o);
//        CM.view.makeSureAllLinksHaveTargets(CM.view.msgs_div);
//        CM.view.assignLastReadMsgDiv(activeOb);
//        CM.view.insertUnreadDivider();
//        CM.view.updateEndMarker();
//        CM.view.padOutMsgsScroller();
        $("#msgs_scroller_div").getNiceScroll().resize();
        CM.view.scrollToBottom("#msgs_scroller_div");
//        if (scrollTop == -1 || scrollTop == undefined || (CM.model.prefs.start_scroll_at_oldest && activeOb.unread_cnt)) {
//            CM.ui.instaScrollMsgsToBottom(false);
//            if (CM.model.prefs.start_scroll_at_oldest) {
//                CM.ui.scrollMsgsSoFirstUnreadMsgIsInView()
//            }
//        } else {
//            CM.ui.instaScrollMsgsToPosition(scrollTop, false)
//        }
//        CM.ui.checkInlineImgs("main")
        
    },
    assignLastReadMsgDiv: function(a) {
        if (!a) {
            return
        }
        if (!a.msgs.length) {
            return
        }
        var c = CM.utility.msgs.getMsg(a.last_read, a.msgs);
//        if (c && !c.no_display) {
//            CM.view.last_read_msg_div = CM.view.getDivForMsg(a.last_read);
//            return
//        }
//        var b = CM.utility.msgs.getOldestValidTs(a.msgs);
//        if (a.last_read > b) {
//            var c = CM.utility.msgs.getDisplayedMsgBeforeTS(a.last_read, a.msgs);
//            if (c) {
//                CM.info(c.ts + " from CM.utility.msgs.getDisplayedMsgBeforeTS(" + a.last_read + ") " + c.ts + " < " + a.last_read + " = " + (c.ts < a.last_read));
//                CM.view.last_read_msg_div = CM.view.getDivForMsg(c.ts)
//            } else {
//                CM.view.last_read_msg_div = null;
//                CM.error("WTF nulling out CM.view.last_read_msg_div because we could not find a message to use #1")
//            }
//        } else {
//            CM.view.last_read_msg_div = null
//        }
    },

    rebuildChannelList: function() {
        var channelsForUser = CM.channels.getChannelsForUser();
        var item;
        var a = 0;
        var h = [];
        channelsForUser.sort(function g(j, i) {
            if (j.is_starred != i.is_starred) {
                if (j.is_starred) {
                    return -1
                }
                if (i.is_starred) {
                    return 1
                }
            }
            var k = j._name_lc;
            var l = i._name_lc;
            if (k < l) {
                return -1
            }
            if (k > l) {
                return 1
            }
            return 0
        });
        for (var index = 0; index < channelsForUser.length; index++) {
            item = channelsForUser[index];
            if (!item.is_member && !item.is_archived) {
                a++
            }
            if (item.is_starred && !CM.view.dupe_starred) {
                continue
            }
            if (item.is_member || item.was_archived_this_session) {
                h.push(item)
            }
        }
        if (CM.model.user.is_restricted && !h.length) {
            $("#channels").addClass("hidden");
            return
        }
        $("#channels").removeClass("hidden");
        if (!CM.model.user.is_restricted) {
            $("#channels_header").unbind("click.open_dialog_or_menu").bind("click.open_dialog_or_menu", function(i) {
//                if (CM.tips.maybeDoThrobberProxyClick("channels_tip_card_throbber", i)) {
//                    return false
//                }
                CM.ui.list_browser_dialog.start("channels")
            })
        }
        var c = CM.templates.channel_list({
            channels: h,
            non_member_cnt: a,
            user: CM.model.user
        });
        $("#channel-list").html(c);
//        if (CM.ui.collapsible) {
//            $("#channel-list-collapsed").html(c)
//        }
        CM.ui.updateClosestMonkeyScroller($("#channel-list"));
//        $("#col_channels_collapse_view").html($("#col_channels_collapse_view").html());
//        CM.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    rebuildGroupList: function() {
        var f = "";
        var d = CM.model.groups;
        var k;
//        if (!CM.members.canUserCreateGroups() && !CM.groups.getUnarchivedGroups().length) {
//            $("#groups").addClass("hidden");
//            return
//        }
        $("#groups").removeClass("hidden");
        var l = function a(m, c) {
            if (m.is_starred != c.is_starred) {
                if (m.is_starred) {
                    return -1
                }
                if (c.is_starred) {
                    return 1
                }
            }
            var n = m._name_lc;
            var o = c._name_lc;
            if (n < o) {
                return -1
            }
            if (n > o) {
                return 1
            }
            return 0
        };
        d.sort(l);
        var g = 0;
        var h = 0;
        $.each(d, function(c, m) {
            if (!m.is_open && !m.unread_cnt) {
                return
            }
            if (m.is_archived) {
                h++
            }
            if (m.is_archived && !m.was_archived_this_session) {
                return
            }
            g++;
            if (m.is_starred && !CM.view.dupe_starred) {
                return
            }
            f += CM.templates.group({
                group: m
            })
        });
        $("#group-list").html(f);
        if (CM.ui.collapsible) {
            $("#group-list-collapsed").html(f)
        }
        CM.ui.updateClosestMonkeyScroller($("#group-list"));
        var i = CM.groups.getUnarchivedClosedGroups().length;
        var j = function(c) {
            CM.menu.startWithGroups(c)
        };
        var b = j;
        if (i) {
            if (g) {
                $("#group_list_more").text("+" + i + " more...")
            } else {
                $("#group_list_more").text("Open a group...")
            }
        } else {
            if (h) {
                $("#group_list_more").text("More...")
            } else {
                if (CM.members.canUserCreateGroups()) {
                    $("#group_list_more").text("New private group...");
                    b = function(c) {
                        CM.ui.group_create_dialog.start()
                    }
                } else {
                    $("#group_list_more").text("")
                }
            }
        }
        $("#groups_header").unbind("click.open_dialog_or_menu").bind("click.open_dialog_or_menu", j);
        $("#group_list_more").unbind("click.open_dialog_or_menu").bind("click.open_dialog_or_menu", b);
//        CM.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    rebuildChannelMembersList: function() {
        var d = CM.channels.getChannelById(CM.model.active_channel_id);
        if (!d) {
            d = CM.groups.getGroupById(CM.model.active_group_id)
        }
        if (d) {
            CM.ui.rebuildMemberListToggle();
            var a = [];
            var g;
            for (var c = 0; c < d.members.length; c++) {
                g = CM.members.getMemberById(d.members[c]);
                if (g && !g.deleted) {
                    a.push(g)
                }
            }
            a.sort(function f(i, h) {
                if (i.presence != h.presence) {
                    if (i.presence == "active") {
                        return -1
                    }
                    if (h.presence == "active") {
                        return 1
                    }
                }
                var j = CM.members.getMemberDisplayNameLowerCase(i);
                var k = CM.members.getMemberDisplayNameLowerCase(h);
                if (j < k) {
                    return -1
                }
                if (j > k) {
                    return 1
                }
                return 0
            });
            var b = CM.templates.channel_members_list({
                channel: d,
                members: a,
                current_user_id: CM.model.user.id,
                color_names: CM.model.prefs.color_names_in_list
            });
            $("#members_scroller").html(b);
            CM.ui.updateClosestMonkeyScroller($("#members_scroller"));
            if (d.id != CM.view.last_member_list_channel_or_group_id) {
                $("#members_scroller").scrollTop(0)
            }
            CM.view.last_member_list_channel_or_group_id = d.id
        }
    },
    buildMemberPresenceStatusHTML: function(b) {
        var a = "";
        a += '<span class="' + CM.templates.makeMemberStatusDomClass(b.id) + '">';
        if (b.status) {
            a += ' - "' + b.status + '"'
        }
        a += "</span>";
        return a
    },
    rebuildImList: function() {
        var g = "";
        var b = CM.model.ims;
        var d = CM.members.getMembersForUser();
        var a;
        var f = true;
        d.sort(function h(k, c) {
            if (k.is_slackbot) {
                return -1
            }
            if (c.is_slackbot) {
                return 1
            }
            var l = CM.members.getMemberDisplayNameLowerCase(k);
            var m = CM.members.getMemberDisplayNameLowerCase(c);
            if (l < m) {
                return -1
            }
            if (l > m) {
                return 1
            }
            return 0
        });
        var j = 0;
        var i = 0;
        $.each(d, function(c, l) {
            if (l.deleted) {
                return
            }
            if (l.is_self) {
                return
            }
            a = CM.ims.getImByMemberId(l.id);
            if (!a || (!a.is_open && !a.unread_cnt)) {
                i++;
                return
            }
            j++;
            if (a.is_starred && !CM.view.dupe_starred) {
                return
            }
            var k = {
                member: l,
                im: a,
                color_names: false,
                show_close_link: true || !a.is_slackbot_im
            };
            g += CM.templates.member(k)
        });
        $("#im-list").html(g);
        if (CM.ui.collapsible) {
            $("#im-list-collapsed").html(g)
        }
        CM.ui.updateClosestMonkeyScroller($("#im-list"));
        f = i;
        if (f) {
            $("#im_list_more, #im_list_collapsed_more").removeClass("hidden");
            if (j) {
                $("#im_list_more").text("+" + i + " More...")
            } else {
                $("#im_list_more").text("Send a direct message...")
            }
        } else {
            $("#im_list_more, #im_list_collapsed_more").addClass("hidden")
        }
        $("#im_list_more").unbind("click.open_dialog").bind("click.open_dialog", function(c) {
            if (!CM.model.socket_connected && !CM.model.change_channels_when_offline) {
                CM.ui.playSound("beep");
                return
            }
            CM.menu.startWithMembers(c)
        });
        $("#direct_messages_header").unbind("click.open_dialog").bind("click.open_dialog", function(c) {
            if (!CM.model.socket_connected && !CM.model.change_channels_when_offline) {
                //CM.ui.playSound("beep");
                return
            }
            CM.menu.startWithMembers(c)
        });
//        CM.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    channelMessageReceived: function(channel, msg) {
        if (channel.id != CM.model.active_channel_id) {
            return
        }
        if (!msg) {
            CM.error("no msg?");
            return
        }
        if (channel.msgs.length == 1) {
            CM.view.rebuildMsgs()
        } else {
            CM.view.addMsg(msg, channel.unread_cnt)
        }
    },
    groupMessageReceived: function(group, msg) {
        if (group.id != CM.model.active_group_id) {
            return
        }
        if (!msg) {
            CM.error("no msg?");
            return
        }
        if (group.msgs.length == 1) {
            CM.view.rebuildMsgs()
        } else {
            CM.view.addMsg(msg, group.unread_cnt)
        }
    },
    imMessageReceived: function(im, msg) {
        if (!im.is_open) {
            CM.view.rebuildImList();
            CM.view.rebuildStarredList()
        }
        if (im.id != CM.model.active_im_id) {
            return
        }
        if (!msg) {
            CM.error("no msg?");
            return
        }
        if (im.msgs.length == 1) {
            CM.view.rebuildMsgs()
        } else {
            CM.view.addMsg(msg, im.unread_cnt)
        }
    },
    addMsg: function(msg, unread_cnt) {
        var a = false;
        var activeob = CM.shared.getActiveModelOb();
//        if (msg.user == CM.model.user.id && CM.view.scroll_down_when_msg_from_user_is_added) {
//            CM.view.scroll_down_when_msg_from_user_is_added = false;
//            a = true
//        } else {
//            if (CM.ui.areMsgsScrolledToBottom()) {
//                a = true
//            }
//        }
        var f = CM.view.last_rendered_msg;
        var d = CM.templates.builders.buildMsgHTML({
            msg: msg,
            model_ob: activeob,
            prev_msg: f,
            container_id: "msgs_div",
            //enable_slack_action_links: true
            enable_slack_action_links: false
        });
        CM.view.msgs_div.append(d);
        var i = CM.view.getDivForMsg(msg.ts);
        i.find(".timestamp").tooltip({
            delay: {
                show: 450,
                hide: 150
            },
            container: "body"
        });
//        CM.view.makeSureAllLinksHaveTargets(i);
//        if (!msg.rsp_id) {
//            CM.view.last_in_stream_msg = msg;
//            if (!h.no_display) {
//                CM.view.last_rendered_msg = msg
//            }
//        }
        CM.view.assignLastReadMsgDiv(activeob);
//        CM.view.padOutMsgsScroller();
//        if (a) {
//            CM.ui.instaScrollMsgsToBottom(false)
//        }
//        var g = CM.ui.isUserAttentionOnChat() && (unread_cnt < 2);
//        if (msg.user == CM.model.user.id || g) {
//            CM.ui.checkUnreads()
//        } else {
//            CM.ui.checkInlineImgs("main")
//        }
        CM.view.insertUnreadDivider();
        
        CM.view.updateClosestScroller("#msgs_scroller_div");
        //CM.view.scrollToTop($("#msgs_scroller_div"));
//        if ($("#msgs_scroller_div").data("monkeyScroll")) {
//            $("#msgs_scroller_div").data("monkeyScroll").updateFunc()
//        }
    },
    getDivForMsg: function(ts) {
        return CM.view.msgs_div.find("#" + CM.templates.makeMsgDomId(ts));
    },

};