CM.ui = {
	auto_scrolling_msgs:false,
	ui:null,
	onStart:function(){
		

		CM.ui.bindHref();
		CM.ui.bindMessageInput();
		
		CM.channels.switched_sig.add(CM.ui.channelOrImOrGroupDisplaySwitched, CM.ui);
//        CM.ims.switched_sig.add(CM.ui.channelOrImOrGroupDisplaySwitched, CM.ui);
//        CM.groups.switched_sig.add(CM.ui.channelOrImOrGroupDisplaySwitched, CM.ui);
		
		
        //activity.individual_activity_fetched_sig.add(ui.individualActivityFetched, ui);
        $(window).bind("focus", ui.onWindowFocus);
        $(window).bind("blur", ui.onWindowBlur);
        $("html").bind("mousedown", function(i) {
            ui.onWindowFocus({
                target: window
            })
        });
        var j = (document.hasFocus && document.hasFocus() && window.macgap_is_in_active_space) ? true : false;
        if (j) {
            ui.onWindowFocus({
                target: window
            })
        } else {
            ui.onWindowBlur({
                target: window
            })
        }
//        view.msgs_scroller_div.bind("mousedown mouseup", function(i) {
//            ui.checkUnreads()
//        });
        var h = null;
        $("html").bind("mousedown", function(i) {
            ui.mouse_is_down = true;
            //ui.maybeTickleMS();
            h = $(i.target)
        });
        $("html").bind("dragend", function(i) {
            ui.mouse_is_down = false
        });
        $("html").bind("mouseup", function(i) {
            ui.mouse_is_down = false;
//            setTimeout(function() {
//                if (h && h.closest(".monkey_scroll_handle").length) {
//                    if (!model.showing_welcome_2) {
//                        ui.maybeLoadScrollBackHistory()
//                    }
//                }
//            }, 10)
        });
//        $(window.document).keydown(ui.onWindowKeyDown);
//        $(window.document).keyup(ui.onWindowKeyUp);
		$("#user_menu").bind("click", function(i) {
//            if ($(i.target).attr("id") == "user_menu_tip_card_throbber") {
//                return
//            }
//            if (tips.maybeDoThrobberProxyClick("user_menu_tip_card_throbber", i)) {
//                return false
//            }
            menu.startWithUser(i)
        });
        $("#team_menu").bind("click", function(i) {
//            if (tips.maybeDoThrobberProxyClick("team_menu_tip_card_throbber", i)) {
//                return false
//            }
            menu.startWithTeam(i)
        });
	},
	onWindowFocus: function(b) {
        if (b.target === window) {
            if (ui.window_focused) {
                return
            }
            $("body").removeClass("blurred");
            model.shift_key_pressed = false;
            model.insert_key_pressed = false;
            ui.window_focused = true;
            //ui.startUnreadCheckingTimer();
            //ui.window_focus_changed_sig.dispatch(true);
            //ui.maybeTickleMS()
        }
        //view.updateTitleBarColor()
    }, onWindowBlur: function(b) {
        if (b.target === window) {
            if (!ui.window_focused) {
                return
            }
            $("body").addClass("blurred");
            model.shift_key_pressed = false;
            model.insert_key_pressed = false;
            ui.window_focused = false;
            //clearTimeout(ui.unread_checking_tim);
            //ui.window_focus_changed_sig.dispatch(false)
        }
    }, 
	bindHref:function(){
		var hrefFunc=function(event){
			var target = $(event.target);
            var d = target.closest(".im_name");
            var c = d.data("member-id");
            var k = target.closest(".group_name");
            var j = k.data("group-id");
            var h = target.closest(".channel_name");
            var g = h.data("channel-id");
            if (c) {
                if (target.hasClass("im_close")) {
                	event.stopPropagation();
                    var i = CM.ims.getImByMemberId(c);
                    CM.ui.maybePromptForClosingIm(i.id)
                } else {
                	//event.stopPropagation();
                	event.preventDefault();
                    CM.ims.displayIm(c);
                    //startImByMemberId(c)
                }
            } else {
                if (j) {
                    if (target.hasClass("group_close")) {
                    	event.stopPropagation();
                        CM.ui.maybePromptForClosingGroup(j)
                    } else {
                    	//event.stopPropagation();
                    	event.preventDefault();
                        CM.groups.displayGroup(j)
                    }
                } else {
                    if (g) {
                    	event.preventDefault();
                        CM.channels.displayChannel(g)
                    } else {
                        if (target.hasClass("channel-list-more")) {
                            CM.ui.list_browser_dialog.start("channels")
                        } else {
                            if (target.hasClass("channel-list-create")) {
                                CM.ui.channel_create_dialog.start()
                            }
                        }
                    }
                }
            }
            return false
		}
		$("#im-list").unbind("click").bind("click", hrefFunc);
		$("#group-list").unbind("click").bind("click", hrefFunc);
        $("#starred-list").unbind("click").bind("click", hrefFunc);
        $("#channel-list").unbind("click").bind("click", hrefFunc);
        $("#channels_header").bind("click.open_dialog_or_menu", function(i) {
          CM.ui.list_browser_dialog.start("channels")
      })
	}
	, maybePromptForClosingGroup: function(c) {
        var b = CM.groups.getGroupById(c);
        CM.groups.closeGroup(b.id);
//        if (b.unread_cnt) {
//            CM.generic_dialog.start({
//                title: "You have unread messages",
//                body: "You have unread messages in the " + CM.model.group_prefix + b.name + " group. Are you sure you want to close it?",
//                show_cancel_button: true,
//                show_go_button: true,
//                go_button_text: "Yes",
//                cancel_button_text: "No",
//                on_go: function() {
//                    CM.groups.markMostRecentReadMsg(b);
//                    CM.client.markLastReadsWithAPI();
//                    if (b.is_open) {
//                        CM.groups.closeGroup(b.id)
//                    } else {
//                        CM.groups.closeGroup(b.id)
//                    }
//                }
//            })
//        } else {
//            CM.groups.closeGroup(b.id)
//        }
    }, maybePromptForClosingIm: function(c) {
        var b = CM.ims.getImById(c);
        CM.ims.closeIm(b.id);
//        if (b.unread_cnt) {
//            CM.generic_dialog.start({
//                title: "You have unread messages",
//                body: "You have unread messages from " + b.name + ". Are you sure you want to close the DM?",
//                show_cancel_button: true,
//                show_go_button: true,
//                go_button_text: "Yes",
//                cancel_button_text: "No",
//                on_go: function() {
//                    CM.ims.markMostRecentReadMsg(b);
//                    CM.client.markLastReadsWithAPI();
//                    CM.ims.closeIm(b.id)
//                }
//            })
//        } else {
//            CM.ims.closeIm(b.id)
//        }
    }, 
	hideMemberList: function(){
		
	},
	updateClosestMonkeyScroller: function(b) {
        if (!b) {
            return
        }
        var d = b.closest(".monkey_scroller");
        //d.perfectScrollbar('update');
    },
    markAllRead: function(id){
    	var obj = CM.getChannelImGroupById(id);
    	var ts = CM.utility.msgs.getMostRecentValidTs(obj.msgs);

//    	obj.last_read = ts;
    	
        CM.sock.call('channels.setlastread',{id:id,ts:ts},function(status,data,params) {
        	var ob = CM.getChannelImGroupById(params['id']);
        	ob['last_read'] = data.channel['last_read'];
        	ob['unread_cnt'] = 0;
        });
        //CM.calculateUnread(id);
        
	},
    areMsgsScrolledToBottom: function(c) {
        c = c || 50;
        var b = view.msgs_scroller_div;
        var d = b[0];
        return (parseInt(b.css("height")) + d.scrollTop + c > d.scrollHeight)
    }, instaScrollMsgsToBottom: function(b) {
        ui.instaScrollMsgsToPosition(view.msgs_scroller_div[0].scrollHeight, b)
    }, slowScrollMsgsToBottom: function() {
        view.msgs_scroller_div.animate({
            scrollTop: view.msgs_scroller_div[0].scrollHeight
        }, "500")
    }, instaScrollMsgsToPosition: function(b, c) {
        ui.auto_scrolling_msgs = true;
        view.msgs_scroller_div.scrollTop(b);
        setTimeout(function() {
            ui.auto_scrolling_msgs = false
        }, 100);
        if (c) {
            ui.checkUnreads()
        }
    }, slowScrollMsgsToPosition: function(b, c, d) {
        ui.auto_scrolling_msgs = true;
        view.msgs_scroller_div.stop().animate({
            scrollTop: b
        }, "500", function() {
            setTimeout(function() {
                ui.auto_scrolling_msgs = false
            }, 100);
            if (c) {
                ui.checkUnreads()
            }
            if (d) {
                d()
            }
        })
    }, scrollMsgsSoMsgIsInView: function(f, b, c) {
        var g = view.getDivForMsg(f);
        var d;
        if (b) {
            d = g.prevAll().slice(0, 20);
            d.css("opacity", 0);
            g.next().scrollintoview({
                duration: 0,
                offset: "top"
            })
        }
        if (c) {
            ui.active_highlight_count++
        }
        ui.auto_scrolling_msgs = true;
        g.scrollintoview({
            duration: 1000,
            offset: "center_vertical",
            complete: function() {
                if (b && d) {
                    d.stop().animate({
                        opacity: 1
                    }, 500)
                }
                if (c) {
                    g.highlight(2500, "msg_highlighter", function() {
                        ui.active_highlight_count--
                    })
                }
                ui.auto_scrolling_msgs = false;
                ui.onMsgsScroll()
            }
        })
    }, active_highlight_count: 0, scrollMsgsSoFirstUnreadMsgIsInView: function(b) {
        if (!view.msgs_unread_divider) {
            return
        }
        var c = view.msgs_unread_divider.prevAll(".message:not(.hidden)").first();
        if (c.length == 0 || true) {
            c = view.msgs_unread_divider
        }
        ui.auto_scrolling_msgs = true;
        c.scrollintoview({
            duration: 200,
            offset: "top",
            px_offset: 50,
            complete: function() {
                setTimeout(function() {
                    ui.auto_scrolling_msgs = false;
                    ui.onMsgsScroll();
                    if (b) {
                        b()
                    }
                }, 1)
            }
        })
    },
	channelOrImOrGroupDisplaySwitched: function(){
		//it is ok
	},
	populateChatInput: function(b) {
        CM.utility.populateInput(CM.view.input_el, b);
//        CM.ui.storeLastMsgInputForActive(b);
        CM.view.input_el.trigger("autosize-resize")
    }, populateChatInputWithLast: function() {
        var b = CM.shared.getActiveModelOb();
        if (!b) {
            return
        }
//        CM.ui.history.resetPosition("populateChatInputWithLast");
//        CM.view.input_el.TS_tabComplete2("suspend");
        CM.ui.populateChatInput(b.last_msg_input);
//        CM.view.input_el.TS_tabComplete2("unsuspend");
//        CM.view.input_el.TS_tabComplete2("changeoption", "member_prefix_required", b.is_slackbot_im)
    }, 
    list_browser_dialog: {
        which: null,
        div: null,
        showing: false,
        items: [],
        active_sort: "name",
        filtered_items: [],
        active_filter: "",
        onStart: function() {
            //CM.channels.list_fetched_sig.add(CM.ui.list_browser_dialog.onChannelsListFetched, CM.ui.list_browser_dialog)
        },
        onChannelsListFetched: function() {
            if (!CM.ui.list_browser_dialog.showing) {
                return
            }
            if (CM.ui.list_browser_dialog.which != "channels") {
                return
            }
            CM.ui.list_browser_dialog.sortBy(CM.ui.list_browser_dialog.active_sort)
        },
        onKeydown: function(a) {
            if (a.which == CM.utility.keymap.esc) {
                CM.ui.list_browser_dialog.cancel()
            }
        },
        start: function(f) {
            if (CM.model.user.is_restricted) {
                return
            }
//            if (CM.ui.checkForEditing()) {
//                return
//            }
            if (!CM.ui.list_browser_dialog.div) {
                CM.ui.list_browser_dialog.build()
            }
            var g = CM.ui.list_browser_dialog.div;
            CM.ui.list_browser_dialog.which = f;
            var channelsForUser;
            if (f == "channels") {
                channelsForUser = CM.channels.getChannelsForUser();
                //CM.channels.fetchList()
            } else {
                CM.error("CM.ui.list_browser_dialog start called with bad which: " + f);
                return
            }
            CM.ui.list_browser_dialog.items=[];
            $.each(channelsForUser, function(h, i) {
                if (!i.is_archived) {
                    CM.ui.list_browser_dialog.items.push(i)
                }
            });
            
            var d = CM.templates.list_browser_dialog({
                title: "Browse Channels",
                items: CM.ui.list_browser_dialog.items,
                active_sort: CM.ui.list_browser_dialog.active_sort
            });
            g.empty();
            g.html(d);
            CM.ui.list_browser_dialog.sortBy(CM.ui.list_browser_dialog.active_sort);
            //CM.ui.list_browser_dialog.bindList();
            CM.ui.list_browser_dialog.div.find("#list_sort").bind("change.sortBy", function() {
                CM.ui.list_browser_dialog.sortBy($(this).val())
            });
            CM.ui.list_browser_dialog.div.find("#list_search").bind("textchange", function(i) {
                var filter = $.trim($(this).val());
                if (filter == "") {
                    CM.ui.list_browser_dialog.clearFilter()
                } else {
                    $("#list_search_container").addClass("active");
                    if (filter.indexOf("#") !== -1) {
                        filter = filter.replace("#", "", "g");
                        filter = $.trim(filter)
                    }
                    CM.ui.list_browser_dialog.filterBy(filter)
                }
            });
            CM.ui.list_browser_dialog.div.find("#list_search_container .icon_close").bind("click.clearFilter", CM.ui.list_browser_dialog.clearFilter);
            CM.ui.list_browser_dialog.div.find(".new_channel_btn").bind("click", function() {
                CM.ui.list_browser_dialog.cancel();
                setTimeout(function() {
                    CM.ui.channel_create_dialog.start()
                }, 500)
            });
//            CM.ui.list_browser_dialog.div.find("#about_channels").bind("click", function(h) {
//                h.preventDefault();
//                CM.ui.list_browser_dialog.cancel();
//                setTimeout(function() {
//                    CM.tip_card.start({
//                        tip: CM.tips.getTipById("about_channels_tip_card")
//                    })
//                }, 500)
//            });
            var a = $("#list_browser");
//            var b = CM.qs_args.debug_scroll == "1";
//            a.monkeyScroll({
//                debug: b
//            });
            g.find(".dialog_cancel").click(CM.ui.list_browser_dialog.cancel);
            CM.kb_nav.start(a, "p");
            CM.kb_nav.setAllowHighlightWithoutBlurringInput(true);
            a.on("mouseenter", "h4", CM.kb_nav.clearHighlightedItem);
            g.show();
            g.modal("show");
            
        },
        cancel: function() {
            CM.ui.list_browser_dialog.div.modal("hide")
        },
        end: function() {
            CM.ui.list_browser_dialog.showing = CM.model.dialog_is_showing = false;
            $(window.document).unbind("keydown", CM.ui.list_browser_dialog.onKeydown);
            CM.ui.list_browser_dialog.items.length = 0;
            CM.ui.list_browser_dialog.active_filter = "";
            //CM.kb_nav.end()
        },
        build: function() {
            $("body").append('<div id="list_browser_dialog" class="modal fade" ></div>');
            var a = CM.ui.list_browser_dialog.div = $("#list_browser_dialog");
            a.on("hide.bs.modal", function(b) {
                if (b.target != this) {
                    return
                }
                CM.ui.list_browser_dialog.end()
            });
            a.on("show.bs.modal", function(b) {
                if (b.target != this) {
                    return
                }
                CM.ui.list_browser_dialog.showing = CM.model.dialog_is_showing = true
            });
            a.on("shown.bs.modal", function(b) {
                if (b.target != this) {
                    return
                }
                setTimeout(function() {
                    a.find("#list_search").select();
                    $(window.document).bind("keydown", CM.ui.list_browser_dialog.onKeydown);
                    CM.ui.updateClosestMonkeyScroller($("#list_browser"))
                }, 100)
            })
        },
        bindList: function() {
            CM.ui.list_browser_dialog.div.find(".item_open_link").on("click.open", function(c) {
                c.preventDefault();
                var id = $(this).data("item-id");
                var item=CM.getChannelImGroupById(id);
                if (item) {
                    if (item.is_channel) {;
                        if (item.is_member) {
                            CM.channels.displayChannel(id)
                        } else {
                            CM.channels.join(item)
                        }
                    } else {
                        if (item.is_group) {
                            CM.groups.displayGroup(id)
                        }
                    }
                }
                CM.ui.list_browser_dialog.cancel()
            })
        },
        sortBy: function(sort) {
            CM.ui.list_browser_dialog.active_sort = sort;
            var items = CM.ui.list_browser_dialog.items;
            if (CM.ui.list_browser_dialog.active_filter) {
                items = CM.ui.list_browser_dialog.filtered_items
            }
            switch (sort) {
                case "creator":
                    items.sort(function(i, g) {
                        var h, j;
                        h = CM.members.getMemberById(i.user_id);
                        j = CM.members.getMemberById(g.user_id);
                        if (h && j) {
                            return (h._name_lc > j._name_lc) ? 1 : ((j._name_lc > h._name_lc) ? -1 : 0)
                        } else {
                            return 1
                        }
                    });
                    break;
                case "created":
                    items.sort(function(h, g) {
                        return (h.created < g.created) ? 1 : ((g.created < h.created) ? -1 : 0)
                    });
                    break;
                case "members_high":
                    items.sort(function(h, g) {
                        return (h.num_members < g.num_members) ? 1 : ((g.num_members < h.num_members) ? -1 : 0)
                    });
                    break;
                case "members_low":
                    items.sort(function(h, g) {
                        return (h.num_members > g.num_members) ? 1 : ((g.num_members > h.num_members) ? -1 : 0)
                    });
                    break;
                case "name":
                default:
                    items.sort(function(h, g) {
                        return (h._name_lc > g._name_lc) ? 1 : ((g._name_lc > h._name_lc) ? -1 : 0)
                    });
                    break
            }
            if (sort == "name" && !CM.ui.list_browser_dialog.active_filter) {
                var d = [],
                    c = [];
                $.each(items, function(g, h) {
                    if (h.is_member) {
                        c.push(h)
                    } else {
                        d.push(h)
                    }
                });
                $("#list_browser").html(CM.templates.list_browser_items_by_membership({
                    items_to_join: d,
                    items_to_leave: c,
                    active_sort: CM.ui.list_browser_dialog.active_sort
                }))
            } else {
                $("#list_browser").html(CM.templates.list_browser_items({
                    items: items,
                    active_sort: CM.ui.list_browser_dialog.active_sort
                }))
            }
            CM.ui.list_browser_dialog.bindList();
            CM.kb_nav.clearHighlightedItem();
            var a = $("#list_browser");
            a.css({'top':0});           
            a.scrollTop(0);
            CM.ui.updateClosestMonkeyScroller(a);
        },
        filterBy: function(filter) {
            var b = new RegExp(filter, "i"),
                a = $("#list_browser");
            CM.ui.list_browser_dialog.active_filter = filter;
            CM.ui.list_browser_dialog.filtered_items = $.grep(CM.ui.list_browser_dialog.items, function(f, d) {
                return f.name.match(b)
            });
            if (CM.ui.list_browser_dialog.filtered_items.length > 0) {
                a.html(CM.templates.list_browser_items({
                    items: CM.ui.list_browser_dialog.filtered_items,
                    active_sort: CM.ui.list_browser_dialog.active_sort
                }));
                CM.ui.list_browser_dialog.bindList()
            } else {
                a.html('<div class="no_matches align-center large_top_margin large_bottom_margin subtle_silver">No matches found for <strong>' + CM.utility.htmlEntities(filter) + "</strong>.</div>")
            }
            CM.kb_nav.clearHighlightedItem();
            CM.ui.updateClosestMonkeyScroller(a);
            a.scrollTop(0)
        },
        clearFilter: function() {
            CM.ui.list_browser_dialog.active_filter = "";
            CM.ui.list_browser_dialog.div.find("#list_search").val("");
            $("#list_search_container").removeClass("active");
            $("#list_browser").html(CM.templates.list_browser_items({
                items: CM.ui.list_browser_dialog.items,
                active_sort: CM.ui.list_browser_dialog.active_sort
            }));
            CM.ui.list_browser_dialog.sortBy(CM.ui.list_browser_dialog.active_sort);
            CM.kb_nav.clearHighlightedItem()
        }
    },
	channel_create_dialog: {
        div: null,
        showing: false,
        is_edit: false,
        model_ob: null,
        ladda: null,
        onStart: function() {},
        onKeydown: function(a) {
            if (a.which == CM.utility.keymap.enter) {
                CM.ui.channel_create_dialog.go();
                a.preventDefault()
            } else {
                if (a.which == CM.utility.keymap.esc) {
                    CM.ui.channel_create_dialog.cancel()
                }
            }
        },
        start: function(c, a) {
            
        	if (a) {
                //if (CM.model.user.is_restricted) {
                //    return
                //}
                CM.ui.channel_create_dialog.is_edit = true;
                CM.ui.channel_create_dialog.model_ob = a
            } else {
                //if (!CM.members.canUserCreateChannels()) {
                //    return
                //}
                CM.ui.channel_create_dialog.is_edit = false;
                CM.ui.channel_create_dialog.model_ob = null
            }
            c = CM.utility.cleanChannelName(c || "");
            if (!CM.ui.channel_create_dialog.div) {
                CM.ui.channel_create_dialog.build()
            }
            var d = CM.ui.channel_create_dialog.div;
            var b = CM.templates.channel_create_dialog({
                title: c,
                is_edit: CM.ui.channel_create_dialog.is_edit,
                is_group: CM.ui.channel_create_dialog.model_ob && CM.ui.channel_create_dialog.model_ob.is_group,
                hide_private_group_option: false
            });
            d.empty();
            d.html(b);
            d.find(".dialog_cancel").click(CM.ui.channel_create_dialog.cancel);
            d.find(".dialog_go").click(CM.ui.channel_create_dialog.go);
            d.removeClass("hide");
            d.modal("show");
        },
        switchToGroup: function() {
            var a = CM.ui.channel_create_dialog.div.find(".title_input").val();
            CM.ui.channel_create_dialog.cancel();
            setTimeout(function() {
                CM.ui.group_create_dialog.start(a)
            }, 350)
        },
        showNameTakenAlert: function() {
            var a = CM.ui.channel_create_dialog.div;
            CM.channels.ui.channelCreateDialogShowNameTakenAlert(a)
        },
        go: function() {
            if (!CM.ui.channel_create_dialog.showing) {
                CM.error("not showing?");
                return
            }
            var f = CM.ui.channel_create_dialog.div;
            /*var c = CM.channels.ui.channelCreateDialogValidateInput(f);
            if (!c) {
                return
            }*/
            var b = f.find(".title_input").val();
            var purpose_value = $.trim(f.find("#channel_purpose_input").val());
            if (CM.ui.channel_create_dialog.ladda) {
                CM.ui.channel_create_dialog.ladda.start()
            }
            if (CM.ui.channel_create_dialog.is_edit) {
                var d = (CM.ui.channel_create_dialog.model_ob.is_channel) ? "channels.rename" : "groups.rename";
                CM.api.callImmediately(d, {
                    name: b,
                    channel: CM.ui.channel_create_dialog.model_ob.id
                }, function(h, i, g) {
                    if (CM.ui.channel_create_dialog.ladda) {
                        CM.ui.channel_create_dialog.ladda.stop()
                    }
                    if (!h) {
                        if (i.error == "name_taken") {
                            CM.ui.channel_create_dialog.showNameTakenAlert()
                        } else {
                            alert("failed! " + i.error)
                        }
                        return
                    }
                    f.modal("hide")
                })
            } else {
                CM.channels.createChannel({name:b,purpose:purpose_value}, function(status,data,params) {
                    if (CM.ui.channel_create_dialog.ladda) {
                        CM.ui.channel_create_dialog.ladda.stop()
                    }
                    if (!status) {
                        if (data.error == "name_taken") {
                            CM.ui.channel_create_dialog.showNameTakenAlert()
                        } else {
                            if (data.error == "restricted_action") {} else {
                                alert("failed! " + i.error)
                            }
                        }
                        return
                    }
                    /*if (purpose) {
                        CM.channels.setPurpose(data.channel.id, purpose)
                    }*/
                    f.modal("hide")
                })
            }
        },
        cancel: function() {
            CM.ui.channel_create_dialog.div.modal("hide")
        },
        end: function() {
            CM.ui.channel_create_dialog.showing = CM.model.dialog_is_showing = false;
            $(window.document).unbind("keydown", CM.ui.channel_create_dialog.onKeydown)
        },
        build: function() {
            $("body").append('<div id="channel_create_dialog" class="modal hide fade"></div>');
            var div = CM.ui.channel_create_dialog.div = $("#channel_create_dialog");
            div.on("hide.bs.modal", function(b) {
                if (b.target != this) {
                    return
                }
                CM.ui.channel_create_dialog.end()
            });
            div.on("show.bs.modal", function(b) {
                if (b.target != this) {
                    return
                }
                CM.ui.channel_create_dialog.showing = CM.model.dialog_is_showing = true
            });
            div.on("shown.bs.modal", function(b) {
                if (b.target != this) {
                    return
                }
                setTimeout(function() {
                    a.find(".title_input").select();
                    $(window.document).bind("keydown", CM.ui.channel_create_dialog.onKeydown)
                }, 100);
                CM.ui.channel_create_dialog.ladda = Ladda.create(a.find(".dialog_go")[0])
            })
        }
    },
    bindMessageInput: function() {
        var input_el = CM.view.input_el;
        input_el.bind("click", function(g) {});
//        input_el.TS_tabComplete2({
//            complete_cmds: true,
//            complete_channels: true,
//            complete_emoji: true,
//            complete_member_specials: true,
//            no_tab_out: true,
//            onComplete: function(g) {
//                CM.utility.populateInput(input_el, g);
//                CM.ui.storeLastMsgInputForActive(input_el.val())
//            },
//            ui_initer: CM.ui.msg_tab_complete.start,
//            suspended: true,
//            sort_by_membership: true,
//            new_cmds: CM.boot_data.feature_cmd_autocomplete
//        });
        (function() {
            var h = 0;
            var j = 0;
            var i = 0.66;
            var g;
            input_el.bind("textchange", function(k, l) {
                j++;
                if (input_el.val() == "") {
                    h = 0;
                    j = 0
                }
            });
            if (CM.channels && CM.channels.switched_sig) {
                CM.channels.switched_sig.add(function() {
                    h = 0;
                    j = 0
                })
            }
            input_el.removeClass("hidden").autosize({
                boxOffset: 19,
                callback: function() {
                    h++;
                    CM.ui.inputResized.apply(this, arguments);
                    var k = input_el.val();
                    if (k == "") {
                        h = 0;
                        j = 0
                    } else {
                        if (!g && k && k.length > 20 && j > 20 && h > 5 && h / j > i) {
                            CM.logError({
                                message: "CM.ui: Excessive message input resize events"
                            }, document.querySelectorAll("#msgs_div .message").length + " messages in current channel. Resize vs. change count: " + h + " / " + j + " (" + (h / j) + ")");
                            g = true
                        }
                    }
                }
            })
        }());
        var f = $("#special_formatting_text");
        input_el.attr("maxlength", "");
//        input_el.bind("textchange", function(g, i) {
//            var h = CM.utility.date.getTimeStamp();
//            CM.ui.storeLastMsgInputForActive(input_el.val());
//            c(g);
//            if (CM.model.profiling_keys) {
//                CM.model.addProfilingKeyTime("input textchange", CM.utility.date.getTimeStamp() - h)
//            }
//            if (input_el.val().length > 2) {
//                if (!f.hasClass("showing")) {
//                    f.transition({
//                        opacity: 0.7
//                    }, 600);
//                    f.addClass("showing")
//                }
//            } else {
//                if (f.hasClass("showing")) {
//                    f.transition({
//                        opacity: 0
//                    }, 200);
//                    f.removeClass("showing")
//                }
//            }
//        });
        $("#snippet_prompt .prompt, #snippet_prompt .warning .snippet_link, #snippet_prompt .warning .post_link").tooltip({
            container: "body"
        });
//
//        function c(j) {
//            var k = input_el.val();
//            var i = false;
//            var h = false;
//            if ($.trim(k)) {
//                h = k.length > CM.model.input_maxlength;
//                var g = k.split("\n").length;
//                if (h || g > 1) {
//                    i = true
//                }
//            }
//            if (i) {
//                if (h) {
//                    $("#snippet_prompt .prompt").addClass("hidden");
//                    $("#snippet_prompt .warning").removeClass("hidden")
//                } else {
//                    $("#snippet_prompt .warning").addClass("hidden");
//                    $("#snippet_prompt .prompt").removeClass("hidden")
//                }
//                $("#snippet_prompt").removeClass("hidden");
//                $("#notification_bar").addClass("showing_snippet_prompt")
//            } else {
//                $("#snippet_prompt").addClass("hidden");
//                $("#notification_bar").removeClass("showing_snippet_prompt")
//            }
//        }
//        input_el.bind("keyup", function(k) {
//            var l = input_el.val();
//            if (l) {
//                if (l.indexOf("/") != 0) {
//                    CM.typing.userStarted(CM.shared.getActiveModelOb());
//                    return
//                }
//                if (l.indexOf("/msg ") == 0) {
//                    var j = l.replace("/msg ", "").split(" ")[0];
//                    var m = CM.members.getMemberByName(j);
//                    if (m) {
//                        var h = CM.ims.getImByMemberId(m.id);
//                        if (h) {
//                            CM.typing.userStarted(h);
//                            return
//                        }
//                    } else {
//                        var i = j.replace("#", "");
//                        var g = CM.channels.getChannelByName(i);
//                        if (!g) {
//                            g = CM.groups.getGroupByName(i)
//                        }
//                        if (g) {
//                            CM.typing.userStarted(g);
//                            return
//                        }
//                    }
//                }
//            }
//            CM.typing.userEnded(CM.shared.getActiveModelOb())
//        });
        var b = function(g) {
            if (CM.view.input_el.val().length > CM.model.input_maxlength) {
                $("#snippet_prompt").highlight(600, "", null, 0);
                g.preventDefault()
            } else {
                if (CM.view.submit(g)) {
                    CM.ui.resetMessageInput();
//                    CM.ui.history.resetPosition("enter key")
                } else {
                    CM.ui.addOrFlashEphemeralBotMsg({
                        channel: CM.model.active_cid,
                        icons: {
                            emoji: ":x:"
                        },
                        username: "disconnectedBot",
                        text: "Hmmmm... you seem to be offline, so sending messages is not possible right now!",
                        ephemeral_type: "disconnected_feedback"
                    })
                }
            }
        };
        input_el.bind("keydown", function(j) {
            var l = CM.utility.date.getTimeStamp();
            var h = CM.utility.keymap;
//            if (CM.ui.keyPressIsValidForGotoNextOpenChannelOrIM(j)) {
//                j.preventDefault();
//                if (CM.model.profiling_keys) {
//                    CM.model.addProfilingKeyTime("input keydown", CM.utility.date.getTimeStamp() - l)
//                }
//                return
//            }
            if (j.which == h.enter && j.metaKey && j.shiftKey) {
            	CM.trace("startSnippetFromChatInput");
//                CM.ui.startSnippetFromChatInput()
            	
            } else {
                if (j.which == h.enter && (!j.shiftKey && !j.altKey && !j.ctrlKey)) {
                    if (j.which == h.enter && j.metaKey) {
                        CM.ui.startSnippetFromChatInput()
                    } else {
                        if ($.trim(input_el.val()) != "" ) { //&& !CM.ui.cal_key_checker.prevent_enter
//                            if ($("#chat_input_tab_ui").length && !$("#chat_input_tab_ui").hasClass("hidden") && CM.model.prefs.tab_ui_return_selects) {
//                                j.preventDefault();
//                                return
//                            }
//                            if (CM.model.prefs.enter_is_special_in_tbt && CM.utility.isCursorWithinTBTs(input_el)) {
//                                return
//                            }
                            b(j)
                        }
                    }
                    j.preventDefault();
                    if (CM.model.profiling_keys) {
                        CM.model.addProfilingKeyTime("input keydown", CM.utility.date.getTimeStamp() - l)
                    }
                    return
                } else {
                    if (j.which == h.shift) {} else {
                        if (j.which == h.enter && (j.ctrlKey || j.altKey)) {
                            if (!CM.model.is_mac || CM.model.is_FF) {
                                var i = input_el.getCursorPosition();
                                var k = input_el.val();
                                input_el.val(k.substr(0, i) + "\n" + k.substr(i)).trigger("autosize").setCursorPosition(i + 1)
                            }
                        } else {
                            if (CM.model.prefs && CM.model.prefs.enter_is_special_in_tbt && j.which == h.enter && j.shiftKey && CM.utility.isCursorWithinTBTs(input_el)) {
                                b(j)
                            }
                        }
                    } 
//                    if ($("#chat_input_tab_ui").length && !$("#chat_input_tab_ui").hasClass("hidden")) {} else {
//                        if (!input_el.val() && (CM.utility.cmdKey(j) || !CM.model.prefs.arrow_history) && j.which == h.up) {
//                            CM.ui.maybeEditLast(j)
//                        } else {
//                            if (!j.shiftKey && (j.which == h.up || j.which == h.down)) {
//                                var g = input_el.getCursorRange();
//                                if (!g || g.l == 0) {
//                                    if (j.which == h.up && (input_el.getCursorPosition() < 1)) {
//                                        CM.ui.history.onArrowKey(j, input_el)
//                                    } else {
//                                        if (j.which == h.down && (input_el.getCursorPosition() >= input_el.val().length)) {
//                                            CM.ui.history.onArrowKey(j, input_el)
//                                        }
//                                    }
//                                }
//                            }
//                        }
//                    }
                }
            } 
//            if (CM.model.profiling_keys) {
//                CM.model.addProfilingKeyTime("input keydown", CM.utility.date.getTimeStamp() - l)
//            }
        })
    }, maybeEditLast: function(c) {
        c.preventDefault();
        c.stopPropagation();
        var b = CM.shared.getActiveModelOb();
        var d;
        if (b) {
            d = CM.utility.msgs.getEditableMsgByProp("user", CM.model.user.id, b.msgs);
            if (d) {
                CM.msg_edit.startEdit(d.ts, CM.shared.getActiveModelOb());
                return true
            }
        }
        CM.ui.playSound("beep");
        return false
    }, resetMessageInput: function() {
        CM.view.input_el.height(16);
        CM.view.measureInput();
        //CM.view.input_el.blur()
    }, bindCommentInput: function() {
        $("#file_comment").bind("focus", function() {
            var c = $(this).closest(".flex_content_scroller");
            var b = c[0].scrollHeight;
            c.scrollTop(b)
        }).bind("keydown.cmd_submit", function(b) {
            if (b.which == CM.utility.keymap.enter && CM.utility.cmdKey(b)) {
                $(this).closest("form").submit()
            }
        });
        if (!CM.model.is_mac) {
            $(".file_comment_tip").text("ctrl+enter to submit")
        }
    }, bindFlexUI: function() {
        $("#help_icon").on("click", function(b) {
            if (CM.help_dialog.showing) {
                return
            }
            CM.help_dialog.start(($("#help_icon").hasClass("open") || $("#help_icon").hasClass("unread") ? "issues" : ""))
        });
        $("#flex_menu").on("click", function(b) {
            CM.menu.startWithFlexMenu(b)
        });
        $("#flex_toggle").on("click", CM.ui.toggleFlex)
    }, toggleFlex: function() {
        if (CM.model.ui_state.flex_visible) {
            CM.ui.hideFlex()
        } else {
            if (!CM.ui.active_tab_id) {
                CM.ui.openFlexTab(CM.model.default_flex_name)
            } else {
                var b = (CM.ui.active_tab_id == "list");
                CM.ui.showFlex(b);
                CM.client.flexDisplaySwitched(CM.ui.active_tab_id || "", CM.ui.last_flex_extra || "")
            }
        }
    }, hideFlex: function(c) {
        var b = function() {
            CM.ui.last_flex_extra = CM.model.flex_extra_in_url;
            $("#client-ui").removeClass("flex_pane_showing");
            CM.model.ui_state.flex_visible = false;
            CM.model.ui_state.flex_name = "";
            CM.model.ui_state.flex_extra = "";
            CM.storage.storeUIState(CM.model.ui_state);
            CM.view.resizeManually("CM.ui.hideFlex");
            CM.view.stopLocalTimeRefreshInterval();
            $("#search_container").append($("#channel_members_toggle")).append($("#channel_members"));
            $(".messages_banner").removeClass("flex_pane_showing");
            if (!c) {
                CM.client.flexDisplaySwitched("", "")
            }
        };
        if (CM.ui.active_tab_id == "list") {
            $("#flex_contents").transition({
                opacity: 0
            }, 100, b)
        } else {
            b()
        }
        $("#flex_toggle").attr("title", "Show Flexpane")
    }, showFlex: function(b, c) {
        var d = CM.ui.areMsgsScrolledToBottom();
        $("#client-ui").addClass("flex_pane_showing");
        CM.model.ui_state.flex_visible = true;
        CM.storage.storeUIState(CM.model.ui_state);
        if (!c) {
            CM.view.resizeManually("CM.ui.showFlex")
        }
        if (d) {
            CM.ui.instaScrollMsgsToBottom(false)
        }
        $("#channel_header").append($("#channel_members_toggle")).append($("#channel_members"));
        $(".messages_banner").addClass("flex_pane_showing");
        if (b) {
            $("#flex_contents").css("opacity", 0).transition({
                opacity: 100
            }, 150)
        } else {
            $("#flex_contents").css("opacity", 100)
        } if (CM.ui.active_tab_id == "files" && CM.ui.last_flex_extra != "") {
            $("#file_preview_scroller").data("monkeyScroll").updateFunc(true)
        } else {
            if (CM.ui.active_tab_id == "activity") {
                $("#activity_feed_scroller").data("monkeyScroll").updateFunc(true)
            }
        } if (CM.ui.active_tab_id == "team" && !CM.model.previewed_member_id) {
            CM.view.startLocalTimeRefreshInterval()
        }
        $("#flex_toggle").attr("title", "Hide Flexpane")
    }, last_flex_extra: null, active_tab_id: null, active_tab_ts: null, _displayFlexTab: function(c, b) {
        var f = $("#" + c + "_tab");
        if (!f.length) {
            return false
        }
        if (CM.ui.active_tab_id == "activity") {
            $("#activity_feed_scroller").hideWithRememberedScrollTop()
        } else {
            if (CM.ui.active_tab_id == "search") {
                $("#search_results_container").hideWithRememberedScrollTop()
            }
        } if (!CM.model.ui_state.flex_visible) {
            CM.ui.showFlex(false, true)
        }
        if (c == "activity") {
            if (CM.model.team.activity && CM.model.team.activity.length) {} else {
                CM.activity.fetchTeamActivity()
            }
        } else {
            if (c == "stars") {
                if (CM.model.user && CM.model.user.stars && !CM.model.user.stars.length) {
                    CM.stars.fetchStarredItems(CM.model.user.id)
                }
            } else {
                if (c == "mentions") {
                    if (CM.model.user && CM.model.user.mentions && !CM.model.user.mentions.length) {
                        CM.mentions.fetchMentions()
                    }
                } else {
                    if (c == "files") {} else {
                        if (c == "team") {
                            CM.view.startLocalTimeRefreshInterval()
                        }
                    }
                }
            }
        } if (c != "team") {
            CM.view.stopLocalTimeRefreshInterval()
        }
        $("#flex_contents > .tab-pane").removeClass("active");
        f.addClass("active");
        var d = CM.ui.active_tab_id;
        CM.ui.active_tab_id = c;
        CM.ui.active_tab_ts = CM.utility.date.getTimeStamp();
        if (c == "activity") {
            if (!$("#activity_tab_activity").hasClass("hidden")) {
                CM.activity.activityRead()
            }
            $("#activity_feed_scroller").unhideWithRememberedScrollTop();
            if (!b) {
                CM.view.resizeManually("CM.ui._displayFlexTab flex_name:" + c)
            }
            $("#activity_feed_scroller").data("monkeyScroll").updateFunc(true)
        } else {
            if (c == "search") {
                $("#search_results_container").unhideWithRememberedScrollTop();
                $("#search_results").data("monkeyScroll").updateFunc()
            } else {
                if (!b) {
                    CM.view.resizeManually("CM.ui._displayFlexTab flex_name:" + c)
                }
            }
        } if (!CM.model.mac_ssb_version) {
            $("#deploy_disclaimer").removeClass("hidden")
        }
        return true
    }, openFlexTab: function(b) {
        if (!CM.ui._displayFlexTab(b)) {
            return
        }
        var c;
        if (b == "files") {
            c = CM.model.previewed_file_id
        } else {
            if (b == "team") {
                c = CM.model.previewed_member_name;
                if (CM.model.previewed_member_name) {
                    CM.activity.fetchIndividualActivity(CM.members.getMemberByName(CM.model.previewed_member_name), true)
                }
            } else {
                if (b == "search") {
                    c = CM.search.last_search_query
                }
            }
        }
        CM.client.flexDisplaySwitched(b, c)
    }, setFlexStateFromHistory: function(b, f, c) {
        if (!b) {
            if (CM.model.ui_state.flex_name || c) {
                CM.ui.hideFlex(true)
            }
            return
        }
        f = f || "";
        var d = CM.model.ui_state.flex_extra || "";
        if (!c && (b == CM.model.ui_state.flex_name && f == d)) {
            return
        }
        if (b == "list") {
            b = "files"
        }
        if (!CM.ui._displayFlexTab(b)) {
            return
        }
        if (b == "files") {
            CM.ui.showFilesFromHistory(f)
        } else {
            if (b == "team") {
                CM.ui.showTeamFromHistory(f)
            } else {
                if (b == "search") {
                    CM.ui.showSearchFromHistory(f)
                } else {
                    CM.client.flexDisplaySwitched(b, null, false, true)
                }
            }
        }
    }, bindFileShareDropdowns: function() {
        $("#select_share_channels").on("change", function() {
            var b = $(this).val();
            if (b == "ts_null_value" || b == null) {
                $(this)[0].selectedIndex = 0;
                $(this).trigger("liszt:updated");
                return
            } else {
                $("#share_model_ob_id").val(b)
            }
            $("#select_share_groups_note, #select_share_channels_note, #select_share_ims_note").addClass("hidden");
            var c = b.substring(0, 1);
            if (c === "C") {
                $("#select_share_channels_note").removeClass("hidden");
                $("#share_context_label").text("in")
            } else {
                if (c === "D") {
                    $("#select_share_ims_note").removeClass("hidden");
                    $("#share_context_label").text("with")
                } else {
                    $("#select_share_groups_note").removeClass("hidden");
                    $("#share_context_label").text("in")
                }
            }
        }).chosen({
            search_contains: true,
            width: "192px"
        }).each(function() {
            $(this).addClass("hidden")
        });
        $("#file_sharing_div").on("keydown", function(b) {
            b.stopPropagation()
        })
    }, bindFileShareShareToggle: function() {
        $("#share_cb").bind("click.toggle_select_list", function() {
            if ($(this).prop("checked")) {
                $(".file_share_select").prop("disabled", false)
            } else {
                $(".file_share_select").prop("disabled", true)
            }
        })
    }, showSearchFromHistory: function(b) {
        if (!b) {
            CM.ui.openFlexTab("activity");
            return
        }
        b = CM.search.truncateQuery(b);
        $("#search_terms").val(b).data("textchange_lastvalue", b);
        $("#header_search_form").submit();
        CM.client.flexDisplaySwitched("search", b, false, true)
    }, preview_file_waiting_on: null, showFilesFromHistory: function(c) {
        if (!c) {
            CM.ui._displayFileList();
            CM.client.flexDisplaySwitched("files", null, false, true);
            return
        }
        var b = CM.files.getFileById(c);
        if (b) {
            CM.ui._displayFile(b.id);
            CM.client.flexDisplaySwitched("files", b.id, false, true);
            CM.files.fetchFileInfo(c)
        } else {
            CM.ui.preview_file_waiting_on = c;
            CM.files.fetchFileInfo(c, function(f, d) {
                if (f != CM.ui.preview_file_waiting_on) {
                    return
                }
                CM.ui.preview_file_waiting_on = null;
                if (d) {
                    CM.ui._displayFile(d.id);
                    CM.client.flexDisplaySwitched("files", d.id, false, true)
                } else {
                    CM.ui._displayFileList();
                    CM.client.flexDisplaySwitched("files", null, true)
                }
            })
        }
    }, showTeamFromHistory: function(b) {
        if (!b) {
            CM.ui._displayTeamList();
            CM.client.flexDisplaySwitched("team", null, false, true);
            return
        }
        var c = CM.members.getMemberByName(b);
        if (c) {
            CM.ui._displayMember(c.id);
            CM.client.flexDisplaySwitched("team", c.name, false, true)
        } else {
            CM.ui._displayTeamList();
            CM.client.flexDisplaySwitched("team", null, true)
        }
    },
    $messages_input_container: null, $emo_menu: null, inputResized: function(c, b) {
        var d = CM.utility.date.getTimeStamp();
        if (!CM.ui.$messages_input_container) {
            CM.ui.$messages_input_container = $("#messages-input-container");
            CM.ui.$file_button = $("#primary_file_button");
            CM.ui.$emo_menu = $(".emo_menu")
        }
        CM.view.measureInput();
        CM.ui.$file_button.css("height", (CM.view.last_input_height) + "px");
        CM.view.resizeManually("CM.ui.inputResized original:" + c + " height:" + b);
        if (CM.view.last_input_height >= 115) {
            CM.view.input_el.removeClass("with-emoji-menu");
            CM.ui.$emo_menu.addClass("hidden")
        } else {
            if (CM.view.last_input_height < 96) {
                CM.view.input_el.addClass("with-emoji-menu");
                CM.ui.$emo_menu.removeClass("hidden")
            }
        } if (CM.model.profiling_keys) {
            CM.model.addProfilingKeyTime("inputResized " + c + " " + b, CM.utility.date.getTimeStamp() - d)
        }
    }, 
    onSubmit: function(g, j) {
        try {
            var h = $.trim(g);
            if (!h) {
                return
            }
            var k = (h == "/unarchive" || h == "/leave");
            var b = CM.shared.getActiveModelOb();
//            if (!k && b && b.is_archived) {
//                alert("This channel has been archived and so you cannot currently send messages to it.");
//                CM.ui.populateChatInput(h);
//                return
//            }
//            CM.ui.history.add(g);
            CM.view.clearMessageInput();
            if (g.substr(0, 1) == "/" && g.substr(0, 2) != "//") {
                var l = h.split(" ");
                var d = l[0];
                var c = $.trim(g.replace(d, ""));
                var i;
                if (CM.cmd_handlers[d] && CM.cmd_handlers[d].type == "client") {
                    setTimeout(function() {
                        CM.cmd_handlers.runCommand(d, c, l, j);
                    }, 10)
                } else {
                    if (i = CM.utility.msgs.getEditLastShortcutCmd(g)) {
                        CM.utility.msgs.removeAllEphemeralMsgsByType("temp_slash_cmd_feedback", CM.model.active_cid);
                        CM.utility.msgs.tryToEditLastMsgFromShortcut(i);
                    } else {
                        CM.api.call("chat.command", {
                            agent: "webapp",
                            command: d,
                            text: c,
                            channel: CM.model.active_cid
                        }, CM.ui.onAPICommand);
                    }
                }
            } else {
                if (CM.model.active_channel_id) {
                    CM.channels.sendMsg(CM.model.active_channel_id, g);
                } else {
                    if (CM.model.active_im_id) {
                        CM.ims.sendMsg(CM.model.active_im_id, g);
                    } else {
                        if (CM.model.active_group_id) {
                            CM.groups.sendMsg(CM.model.active_group_id, g);
                        } else {
                            return
                        }
                    }
                }
//                CM.utility.msgs.removeAllEphemeralMsgsByType("temp_slash_cmd_feedback", CM.model.active_cid);
            } 
//            if (CM.ui.isUnreadDividerInView()) {
//                CM.ui.forceMarkAllRead();
//            }
//            if (CM.model.overlay_is_showing) {
//                CM.view.overlay.cancelFromSendingMessage();
//            }
//            if (CM.model.showing_welcome_2) {
//                CM.model.cancelled_welcome_2_this_session = true;
//                CM.view.unAdjustForWelcomeSlideShow();
//                CM.ui.instaScrollMsgsToBottom(true);
//            }
        } catch (f) {
            CM.error(f)
        }
    }
};
(function() {
CM.kb_nav = {
    onStart: function() {},
    start: function(r, q) {
        l = r;
        e = q;
        $(window.document).on("keydown", CM.kb_nav.onKeyDown);
        l.on("mouseenter.keyboard_navigation", e, d).on("mouseleave.keyboard_navigation", k).on("mousemove.keyboard_navigation", o)
    },
    end: function() {
        if (l) {
            l.off(".keyboard_navigation")
        }
        l = null;
        e = null;
        b = null;
        n = false;
        a = false;
        h = null;
        $(window.document).off("keydown", CM.kb_nav.onKeyDown)
    },
    clearHighlightedItem: function() {
        g()
    },
    setAllowHighlightWithoutBlurringInput: function(q) {
        n = q
    },
    setSubmitItemHandler: function(q) {
        h = q
    },
    onKeyDown: function(t) {
        var r = CM.utility.keymap;
        var s = t.which;
        var u = t.metaKey || t.ctrlKey || t.shiftKey || t.altKey;
        if ((s == r.up) && ((n && !u) || !j(t.target))) {
            t.stopPropagation();
            t.preventDefault();
            m(t);
            return
        }
        if ((s == r.down) && ((n && !u) || !j(t.target))) {
            t.stopPropagation();
            t.preventDefault();
            c(t);
            return
        }
        if (s == r.left && !j(t.target)) {
            t.stopPropagation();
            t.preventDefault();
            m(t);
            return
        }
        if (s == r.right && !j(t.target)) {
            t.stopPropagation();
            t.preventDefault();
            c(t);
            return
        }
        if (s == r.tab) {
            t.stopPropagation();
            t.preventDefault();
            if (!n && j(t.target)) {
                $(t.target).blur()
            }
            if (t.shiftKey) {
                m(t)
            } else {
                c(t)
            }
            return
        }
        if (s == r.enter && b) {
            if (h) {
                var q = b.get(0);
                if (q) {
                    h.call(q, t)
                } else {
                    h(t)
                }
                return
            }
            t.stopPropagation();
            t.preventDefault();
            f();
            return
        }
    }
};
var l = null;
var e = null;
var b = null;
var n = false;
var a = false;
var h = null;
var m = function(s) {
    var r;
    var q = e;
    if (b) {
        r = b.prevAll(q).filter(":not(.disabled):visible:first")
    } else {
        r = l.children(q).filter(":not(.disabled):visible:last")
    } if (r.length > 0) {
        p(r, s)
    } else {
        if (l.children(q).filter(":not(.disabled):visible").length !== 0) {
            g();
            m(s)
        }
    }
};
var c = function(s) {
    var r;
    var q = e;
    if (b) {
        r = b.nextAll(q).filter(":not(.disabled):visible:first")
    } else {
        r = l.children(q).filter(":not(.disabled):visible:first")
    } if (r.length > 0) {
        p(r, s)
    } else {
        if (l.children(q).filter(":not(.disabled):visible").length !== 0) {
            g();
            c(s)
        }
    }
};
var p = function(q, r) {
    a = true;
    g();
    b = q;
    q.addClass("highlighted").scrollintoview({
        offset: "top",
        px_offset: 0,
        duration: 0
    });
    q.find("a:first").focus()
};
var g = function() {
    if (b) {
        b.removeClass("highlighted");
        b = null
    }
};
var d = function(r) {
    if (a) {
        return
    }
    var q = $(r.target).closest(e);
    g();
    if (!q.hasClass("disabled")) {
        q.addClass("highlighted");
        b = q
    }
};
var k = function(q) {
    g()
};
var o = function(q) {
    a = false
};
var f = function() {
    if (b) {
        b.find("a:first").click()
    }
};
var j = function(q) {
    return $(q).is("input, textarea");
}
})();

