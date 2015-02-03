TS.registerModule("api", {
    pending: 0,
    limit: 4,
    delay_ms: 100,
    Q: [],
    one_at_a_time_methodsA: ["users.prefs.set"],
    one_at_a_time_call_pending: false,
    one_at_a_timeQ: [],
    onStart: function() {},
    call: function(e, b, d, c) {
        b = b || {};
        var a;
        if (TS.api.one_at_a_time_methodsA.indexOf(e) != -1) {
            if (!TS.api.one_at_a_time_call_pending) {
                TS.api.actuallyCall(e, b, d, c);
                return
            }
            a = TS.api.one_at_a_timeQ
        } else {
            if (TS.api.pending < TS.api.limit) {
                TS.api.actuallyCall(e, b, d, c);
                return
            }
            a = TS.api.Q
        }
        TS.logLoad("TS.api Qing " + e);
        a.push({
            method: e,
            args: b,
            handler: d,
            dont_set_active: c
        })
    },
    callImmediately: function(d, a, c, b) {
        if (TS.api.one_at_a_time_methodsA.indexOf(d) != -1) {
            TS.warn(d + " cannot be called with TS.api.callImmediately, so sending to TS.api.call for enqueuing");
            TS.api.call(d, a, c, b);
            return
        }
        TS.api.actuallyCall(d, a || {}, c, b)
    },
    nextFromQ: function() {
        var a;
        if (TS.api.one_at_a_timeQ.length && !TS.api.one_at_a_time_call_pending) {
            a = TS.api.one_at_a_timeQ.shift()
        } else {
            if (TS.api.Q.length) {
                a = TS.api.Q.shift()
            }
        } if (!a) {
            return
        }
        TS.api.actuallyCall(a.method, a.args, a.handler, a.dont_set_active)
    },
    actuallyCall: function(h, c, e, d) {
        TS.logLoad("TS.api calling " + h);
        TS.api.pending++;
        if (TS.api.one_at_a_time_methodsA.indexOf(h) != -1) {
            TS.api.one_at_a_time_call_pending = true
        }
        c.token = TS.model.api_token;
        TS.log(2, 'calling method "' + h + '"');
        if (!d) {
            c.set_active = true;
            TS.model.last_net_send = TS.utility.date.getTimeStamp()
        }
        var g = new Date().getTime();
        var a = Math.round(new Date().getTime() / 1000);
        var b = TS.model.api_url + h + "?t=" + a;
        if (h == "rtm.start" && TS.client) {
            var f = 2000 - b.length;
            b += "&" + TS.socket.getConnectionFlowLog(1900)
        }
        if (TS.boot_data.feature_channel_eventlog_client) {
            if (h == "eventlog.history") {
                c.include_channels = 1
            } else {
                if (h == "channels.history" || h == "groups.history" || h == "im.history") {
                    c.visible = 1
                }
            }
        }
        TS.api.ajax_call(b, h, c, function(n) {
            var k = (new Date().getTime() - g);
            TS.logLoad("TS.api complete " + h + " (took " + k + "ms)");
            TS.log(2, 'got api rsp for method "' + h + '" (took ' + k + "ms)");
            TS.dir(2, c);
            TS.dir(2, n);
            var l = false;
            if (!n) {
                n = {}
            }
            if (n.ok) {
                l = true
            } else {
                if (n.ok === false) {
                    l = false;
                    if (n.error == "file_deleted") {} else {
                        TS.error('api call "' + h + '" not ok');
                        try {
                            TS.warn("args: " + JSON.stringify(c))
                        } catch (m) {
                            TS.warn("could not stringify args")
                        }
                        try {
                            TS.warn("data: " + JSON.stringify(n))
                        } catch (m) {
                            TS.warn("could not stringify data")
                        }
                    }
                } else {
                    TS.error('api call "' + h + '" not ok');
                    try {
                        TS.warn("args: " + JSON.stringify(c))
                    } catch (m) {
                        TS.warn("could not stringify args")
                    }
                    try {
                        TS.warn("data: " + JSON.stringify(n))
                    } catch (m) {
                        TS.warn("could not stringify data")
                    }
                    if (c._attempts < 3) {
                        var j = (TS.api.one_at_a_time_methodsA.indexOf(h) != -1) ? TS.api.one_at_a_timeQ : TS.api.Q;
                        j.unshift({
                            method: h,
                            args: c,
                            handler: e,
                            dont_set_active: d
                        });
                        return
                    }
                }
            } if (e) {
                e(l, n, c)
            }
        })
    },
    ajax_call: function(url, method, args, handler) {
        if (!args._attempts) {
            args._attempts = 0
        }
        args._attempts++;
        var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            var l_f = handler;
            if (req.readyState == 4) {
                if (req.status == 200) {
                    req.onreadystatechange = null;
                    var obj;
                    if (req.responseText.indexOf("{") == 0) {
                        try {
                            eval("obj = " + req.responseText)
                        } catch (err) {
                            TS.warn("unable to do anything with api rsp");
                            TS.error(err)
                        }
                    } else {
                        obj = {
                            ok: 1,
                            rsp: req.responseText
                        }
                    }
                    l_f(obj)
                } else {
                    l_f({
                        ok: 0,
                        error: "Non-200 HTTP status: " + req.status,
                        debug: req.responseText
                    })
                }
                setTimeout(function() {
                    TS.api.pending--;
                    if (TS.api.one_at_a_time_methodsA.indexOf(method) != -1) {
                        TS.api.one_at_a_time_call_pending = false
                    }
                    TS.api.nextFromQ()
                }, TS.api.delay_ms)
            }
        };
        req.open("POST", url, 1);
        req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        var args2 = [];
        for (i in args) {
            args2[args2.length] = encodeURIComponent(i) + "=" + encodeURIComponent(args[i])
        }
        req.send(args2.join("&"))
    }
});
(function() {
    TS.registerModule("channels", {
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
        onStart: function() {},
        addMsg: function(j, h) {
            var e = TS.channels.getChannelById(j);
            if (!e) {
                TS.error('unknown channel "' + j + '"');
                return
            }
            var f = e.msgs;
            if (!TS.utility.msgs.validateMsg(j, h, f)) {
                return
            }
            TS.utility.msgs.appendMsg(f, h);
            TS.utility.msgs.maybeStoreMsgs(e.id, f);
            TS.utility.msgs.maybeSetOldestMsgsTsAfterMsgAdded(e);
            var g = !TS.utility.msgs.isTempMsg(h);
            TS.channels.calcUnreadCnts(e, g);
            TS.utility.msgs.maybeTruncateMsgs(e);
            TS.channels.message_received_sig.dispatch(e, h)
        },
        calcUnreadCnts: function(e, f) {
            TS.shared.calcUnreadCnts(e, TS.channels, f)
        },
        removeMsg: function(h, g) {
            var e = TS.channels.getChannelById(h);
            if (!e) {
                TS.error('unknown channel "' + h + '"');
                return
            }
            var f = e.msgs;
            TS.utility.msgs.spliceMsg(f, g);
            TS.channels.message_removed_sig.dispatch(e, g);
            TS.utility.msgs.maybeStoreMsgs(e.id, f);
            TS.channels.calcUnreadCnts(e, true)
        },
        changeMsgText: function(h, g, e) {
            var f = TS.channels.getChannelById(h);
            if (!f) {
                TS.error('unknown channel "' + h + '"');
                return
            }
            g.text = e;
            TS.channels.message_changed_sig.dispatch(f, g);
            TS.utility.msgs.maybeStoreMsgs(f.id, f.msgs)
        },
        sendMsg: function(h, k) {
            var j = TS.channels.getChannelById(h);
            if (!j) {
                return false
            }
            if (j.is_archived) {
                return false
            }
            if (!j.is_member) {
                return false
            }
            var g = TS.channels.getGeneralChannel();
            var e = function(m, l) {
                if (l) {
                    TS.ui.addOrFlashEphemeralBotMsg({
                        text: m,
                        ephemeral_type: l
                    })
                } else {
                    TS.generic_dialog.alert(m)
                }
                TS.view.input_el.val(k);
                TS.view.focusMessageInput()
            };
            if (j.is_general && !TS.members.canUserPostInGeneral()) {
                e("A team owner has restricted posting to the #*" + j.name + "* channel.", "general_posting_restricted");
                return false
            }
            if (TS.model.everyone_regex.test(TS.format.cleanMsg(k)) || (j.is_general && (TS.model.channel_regex.test(TS.format.cleanMsg(k)) || TS.model.group_regex.test(TS.format.cleanMsg(k))))) {
                if (!TS.members.canUserAtEveryone()) {
                    var f = "<p>A team owner has restricted the use of <b>@everyone</b> messages.</p>";
                    if (TS.model.user.is_restricted) {
                        f = "<p>Your account is restricted, and you cannot send <b>@everyone</b> messages.</p>"
                    }
                    if (!j.is_general && TS.members.canUserAtChannelOrAtGroup()) {
                        f += '<p class="no_bottom_margin">If you just want to address everyone in this channel, use <b>@channel</b> instead.</p>'
                    }
                    e(f);
                    return false
                }
                if (!j.is_general) {
                    if (!g || !g.is_member) {
                        var f = "<p>You cannot send <b>@everyone</b> messages.</p>";
                        if (TS.members.canUserAtChannelOrAtGroup()) {
                            f += '<p class="no_bottom_margin">If you just want to address everyone in this channel, use <b>@channel</b> instead.</p>'
                        }
                        e(f)
                    } else {
                        TS.generic_dialog.start({
                            title: "Send @everyone a message",
                            body: '<p class="bold">Would you like to switch to #' + g.name + ' and send your message?</p><p class="">Using <b>@everyone</b> in a message is a way to address your whole team, but it must be done in the #' + g.name + ' channel.</p><p class="no_bottom_margin">If you just want to address everyone in this channel, use <b>@channel</b> instead.</p>',
                            show_cancel_button: true,
                            show_go_button: true,
                            go_button_text: "Yes, send it",
                            on_go: function() {
                                TS.channels.displayChannel(g.id, k)
                            },
                            on_cancel: function() {
                                TS.view.input_el.val(k);
                                TS.view.focusMessageInput()
                            }
                        })
                    }
                    return false
                }
            }
            if ((TS.model.channel_regex.test(TS.format.cleanMsg(k)) || TS.model.group_regex.test(TS.format.cleanMsg(k))) && !TS.members.canUserAtChannelOrAtGroup()) {
                var f = "<p>A team owner has restricted the use of <b>@channel</b> messages.</p>";
                e(f);
                return false
            }
            return TS.shared.sendMsg(h, k, TS.channels)
        },
        onSendMsg: function(g, e) {
            var f = TS.channels.getChannelById(e.SENT_MSG.channel);
            if (!f) {
                TS.error("unknown channel? " + e.SENT_MSG.channel);
                return
            }
            TS.shared.onSendMsg(g, e, f, TS.channels)
        },
        displayChannel: function(h, f, k, g) {
            k = !!k;
            g = !!g;
            var j = TS.channels.getChannelById(h);
            if (!j) {
                TS.error('channel "' + h + '" unknown');
                return
            }
            if (h == TS.model.active_channel_id && !g) {
                TS.warn('channel "' + h + '" already displayed');
                if (f) {
                    TS.channels.sendMsg(h, $.trim(f))
                }
                return
            }
            if (!j.is_member && !j.is_archived) {
                if (g) {
                    TS.error("I never ever expect to get here, but I am logging this just in case!")
                } else {
                    TS.model.requested_channel_joins[h] = {
                        and_send_txt: f
                    };
                    TS.channels.join(j.name)
                }
                return
            }
            var e = (g) ? false : k;
            if (TS.client.channelDisplaySwitched(h, null, null, g, e)) {
                TS.channels.switched_sig.dispatch()
            }
            if (f) {
                TS.channels.sendMsg(h, $.trim(f))
            }
        },
        setLastRead: function(f, e) {
            if (f.last_read == e) {
                return false
            }
            if (e.indexOf(TS.utility.date.fake_ts_unique_padder) > -1) {
                TS.error("bad ts:" + e);
                return false
            }
            if (f.last_read > e) {
                var g = TS.model.last_reads_set_by_client[f.id + "_" + e];
                delete TS.model.last_reads_set_by_client[f.id + "_" + e];
                if (g) {
                    TS.warn("NOT going back in time channel.last_read:" + f.last_read + " new:" + e);
                    return
                }
                TS.info("going back in time channel.last_read:" + f.last_read + " new:" + e)
            }
            f.last_read = e;
            TS.channels.marked_sig.dispatch(f);
            TS.channels.calcUnreadCnts(f);
            return true
        },
        markMostRecentReadMsg: function(e) {
            if (!e) {
                TS.error("channel unknown");
                return
            }
            if (!e.msgs || !e.msgs.length) {
                return
            }
            if (!e.is_member) {
                return
            }
            var f = TS.utility.msgs.getMostRecentValidTs(e.msgs);
            if (!f) {
                TS.warn("no valid tses???");
                return
            }
            e.all_read_this_session_once = true;
            TS.channels.markReadMsg(e.id, f)
        },
        markReadMsg: function(e, g) {
            var f = TS.channels.getChannelById(e);
            if (!f) {
                TS.error('channel "' + e + '" unknown');
                return
            }
            if (f.last_read == g) {
                return
            }
            if (TS.channels.setLastRead(f, g)) {
                f.needs_api_marking = true
            }
        },
        onMarked: function(f, h, e) {
            var g = TS.channels.getChannelById(e.channel);
            if (!g) {
                TS.error('wtf no channel "' + e.channel + '"');
                return
            }
            if (f || (h && (h.error == "not_in_channel" || h.error == "is_archived"))) {} else {
                g.needs_api_marking = true
            }
        },
        join: function(e, g, f) {
            if (TS.model.user.is_restricted) {
                return
            }
            if (!e) {
                return
            }
            if (!TS.channels.getChannelByName(e)) {
                if (TS.model.created_channels[e]) {
                    return
                }
                TS.model.created_channels[e] = true
            }
            TS.api.call("channels.join", {
                name: e,
                in_background: !!f
            }, function(j, k, h) {
                TS.channels.onJoin(j, k, h);
                if (g) {
                    g(j, k, h)
                }
                if (!j) {
                    delete TS.model.created_channels[e]
                }
            })
        },
        onJoin: function(h, k, g) {
            if (!h) {
                if (k.error == "name_taken") {} else {
                    if (k.error == "is_archived") {
                        TS.generic_dialog.alert("<p>The <b>#" + TS.utility.htmlEntities(g.name) + '</b> channel is archived.</p><p><a href="/archives/' + TS.utility.htmlEntities(g.name) + '" target="_blank">Click here</a> to view the channel archives or re-open it.</p>')
                    } else {
                        if (k.error == "restricted_action") {
                            TS.generic_dialog.alert("<p>You don't have permission to create new channels.</p><p>Talk to your team owner.</p>")
                        } else {
                            TS.error("failed to join channel");
                            alert("failed to join channel")
                        }
                    }
                }
                return
            }
            var f;
            if (k.channel) {
                var j = TS.channels.upsertChannel(k.channel);
                f = k.channel.id
            }
            if (!f) {
                TS.error("no channel_id?!!");
                return
            }
            var e = "";
            if (TS.model.requested_channel_joins[f]) {
                e = TS.model.requested_channel_joins[f].and_send_txt;
                delete TS.model.requested_channel_joins[f]
            }
            if (!j) {
                TS.error("no channel?!!");
                return
            }
            if (g.in_background) {
                return
            }
            if (!j.needs_created_message) {
                j.needs_joined_message = true
            }
            TS.channels.displayChannel(f, e)
        },
        leave: function(f) {
            if (TS.model.user.is_restricted) {
                return
            }
            var e = TS.channels.getChannelById(f);
            if (!e) {
                return
            }
            if (e.is_general) {
                TS.generic_dialog.alert("Sorry, you can't leave <b>#" + e.name + "</b>!");
                return
            }
            TS.channels.markMostRecentReadMsg(e);
            TS.client.markLastReadsWithAPI();
            TS.api.call("channels.leave", {
                channel: f
            }, TS.channels.onLeave)
        },
        onLeave: function(f, h, e) {
            if (!f) {
                TS.error("failed to leave channel");
                return
            }
            var g = TS.channels.getChannelById(e.channel);
            if (!g) {
                TS.error('wtf no channel "' + e.channel + '"');
                return
            }
            g.msgs.length = 0;
            TS.storage.storeMsgs(g.id, null)
        },
        setTopic: function(f, e) {
            TS.api.call("channels.setTopic", {
                channel: f,
                topic: e
            }, TS.channels.onSetTopic)
        },
        onSetTopic: function(f, g, e) {
            if (!f) {
                TS.error("failed to set channel topic");
                return
            }
        },
        setPurpose: function(f, e) {
            TS.api.call("channels.setPurpose", {
                channel: f,
                purpose: e
            }, TS.channels.onSetPurpose)
        },
        onSetPurpose: function(f, g, e) {
            if (!f) {
                TS.error("failed to set channel purpose");
                return
            }
        },
        getChannelById: function(h) {
            var e = TS.model.channels;
            var g = d[h];
            if (g) {
                return g
            }
            if (!e) {
                return null
            }
            for (var f = 0; f < e.length; f++) {
                g = e[f];
                if (g.id == h) {
                    TS.warn(h + " not in _id_map?");
                    d[h] = g;
                    return g
                }
            }
            return null
        },
        getFirstChannelYouAreIn: function() {
            var e = TS.model.channels;
            var g;
            if (!e) {
                return null
            }
            for (var f = 0; f < e.length; f++) {
                g = e[f];
                if (g.is_member) {
                    return g
                }
            }
            return null
        },
        getGeneralChannel: function() {
            var e = TS.model.channels;
            var g;
            for (var f = 0; f < e.length; f++) {
                g = e[f];
                if (g.is_general) {
                    return g
                }
            }
        },
        getChannelByName: function(f) {
            f = TS.utility.getLowerCaseValue(f);
            var e = TS.model.channels;
            var h = c[f];
            if (h) {
                return h
            }
            if (!e) {
                return null
            }
            for (var g = 0; g < e.length; g++) {
                h = e[g];
                if (h._name_lc == f || "#" + h._name_lc == f) {
                    TS.warn(f + " not in _name_map?");
                    c["#" + f] = h;
                    c[f] = h;
                    return h
                }
            }
            return null
        },
        upsertChannel: function(m) {
            var e = TS.model.channels;
            var j = TS.channels.getChannelById(m.id);
            var h;
            if (j) {
                TS.log(4, 'updating existing channel "' + m.id + '"');
                for (var g in m) {
                    if (g == "members") {
                        h = m.members;
                        j.members.length = 0;
                        for (var l = 0; l < h.length; l++) {
                            j.members.push(h[l])
                        }
                    } else {
                        j[g] = m[g]
                    }
                }
                m = j;
                if (m.is_member) {
                    TS.shared.checkInitialMsgHistory(m, TS.channels)
                }
            } else {
                TS.log(4, 'adding channel "' + m.id + '"');
                e.push(m);
                if (m.is_channel !== true) {
                    TS.warn(m.name + " lacked the is_channel flag from the server");
                    m.is_channel = true
                }
                m.is_general = !!m.is_general;
                m._name_lc = TS.utility.getLowerCaseValue(m.name);
                d[m.id] = m;
                c[m._name_lc] = m;
                c["#" + m._name_lc] = m;
                if (!m.members) {
                    m.members = []
                }
                if (!m.topic) {
                    m.topic = {}
                }
                if (!m.purpose) {
                    m.purpose = {}
                }
                if (!m.unread_count) {
                    m.unread_count = 0
                }
                m.active_members = [];
                m.is_member = !!m.is_member;
                m.oldest_msg_ts = TS.storage.fetchOldestTs(m.id);
                m.last_msg_input = TS.storage.fetchLastMsgInput(m.id);
                m.scroll_top = -1;
                m.history_is_being_fetched = false;
                m.needs_api_marking = false;
                m.unread_highlight_cnt = 0;
                m.unread_highlights = [];
                m.unread_cnt = 0;
                m.unreads = [];
                m.oldest_unread_ts = null;
                m.has_fetched_history_after_scrollback = false;
                if (TS.client) {
                    var f = (m.is_member) ? TS.utility.msgs.fetchInitialMsgsFromLS(m) : [];
                    TS.utility.msgs.setMsgs(m, f)
                } else {
                    if (TS.boot_data.msgs) {
                        TS.utility.msgs.ingestMessagesFromBootData(m)
                    }
                } if (TS.model.created_channels[m.name]) {
                    m.needs_created_message = true;
                    delete TS.model.created_channels[m.name]
                }
            } if (m.is_member && m.is_archived) {
                TS.error("channel.is_member and channel.is_archived are both true for " + m.id + " #" + m.name);
                TS.dir(0, m);
                m.is_member = false
            }
            if (TS.client) {
                var n = TS.utility.msgs.shouldMarkUnreadsOnMessageFetch();
                TS.channels.calcUnreadCnts(m, n)
            }
            TS.channels.calcActiveMembersForChannel(m);
            return m
        },
        removeChannel: function(g) {
            var e = TS.model.channels;
            TS.log(4, 'removing channel "' + g.id + '"');
            var h;
            for (var f = 0; f < e.length; f++) {
                h = e[f];
                if (h.id == g.id) {
                    e.splice(f, 1);
                    break
                }
            }
            delete d[g.id];
            delete c[g._name_lc];
            delete c["#" + g._name_lc];
            if (TS.client) {
                if (TS.model.active_channel_id == g.id) {
                    TS.client.activeChannelDisplayGoneAway()
                }
            }
            g.msgs.length = 0;
            TS.storage.storeMsgs(g.id, null);
            TS.channels.deleted_sig.dispatch(g)
        },
        channelRenamed: function(g) {
            var e = TS.channels.getChannelById(g.id);
            delete c[e._name_lc];
            delete c["#" + e._name_lc];
            var f = TS.channels.upsertChannel(g);
            f._name_lc = TS.utility.getLowerCaseValue(f.name);
            c[f._name_lc] = f;
            c["#" + f._name_lc] = f;
            TS.channels.renamed_sig.dispatch(f)
        },
        markScrollTop: function(g, e) {
            var f = TS.channels.getChannelById(g);
            if (!f) {
                return false
            }
            if (f.scroll_top == e) {
                return false
            }
            f.scroll_top = e;
            return true
        },
        maybeLoadScrollBackHistory: function(f) {
            var e = TS.channels.getChannelById(f);
            if (!e) {
                return false
            }
            return TS.shared.maybeLoadScrollBackHistory(e, TS.channels)
        },
        maybeLoadHistory: function(f) {
            var e = TS.channels.getChannelById(f);
            if (!e) {
                return false
            }
            return TS.shared.maybeLoadHistory(e, TS.channels)
        },
        onHistory: function(f, h, e) {
            var g = TS.channels.getChannelById(e.channel);
            if (!g) {
                TS.error('wtf no channel "' + e.channel + '"');
                return
            }
            if (!f || !h || !h.messages) {
                TS.error("failed to get history");
                g.history_is_being_fetched = false;
                TS.channels.history_fetched_sig.dispatch(g);
                return
            }
            var k = TS.shared.onHistory(g, h, e, TS.channels);
            if (!k) {
                g.history_is_being_fetched = false;
                TS.channels.history_fetched_sig.dispatch(g)
            }
            var j = TS.utility.msgs.shouldMarkUnreadsOnMessageFetch();
            TS.channels.calcUnreadCnts(g, j)
        },
        fetchHistory: function(f, e) {
            if (!f) {
                TS.error('wtf no channel "' + f + '"');
                return
            }
            f.history_is_being_fetched = true;
            TS.channels.history_being_fetched_sig.dispatch(f);
            TS.api.call("channels.history", e, TS.channels.onHistory)
        },
        topicChanged: function(h, e, g, f) {
            if (!h.topic) {
                h.topic = {}
            }
            h.topic.creator = e;
            h.topic.last_set = g;
            h.topic.value = f;
            TS.channels.topic_changed_sig.dispatch(h, e, f)
        },
        purposeChanged: function(h, e, g, f) {
            if (!h.purpose) {
                h.purpose = {}
            }
            h.purpose.creator = e;
            h.purpose.last_set = g;
            h.purpose.value = f;
            TS.channels.purpose_changed_sig.dispatch(h, e, f)
        },
        makeChannelOrGroupSuppresed: function(f) {
            var g = TS.channels.getChannelById(f);
            var h = TS.groups.getGroupById(f);
            if (!g && !h) {
                TS.error('wtf no channel/group "' + f + '"');
                return false
            }
            var e = TS.model.at_channel_suppressed_channels.indexOf(f);
            if (e == -1) {
                TS.model.at_channel_suppressed_channels.push(f)
            }
            TS.prefs.setSuppressedChannels(TS.model.at_channel_suppressed_channels.join(","));
            if (g) {
                TS.channels.calcUnreadCnts(g)
            }
            if (h) {
                TS.groups.calcUnreadCnts(h)
            }
        },
        makeChannelOrGroupNOTSuppresed: function(f) {
            var g = TS.channels.getChannelById(f);
            var h = TS.groups.getGroupById(f);
            if (!g && !h) {
                TS.error('wtf no channel/group "' + f + '"');
                return false
            }
            var e = TS.model.at_channel_suppressed_channels.indexOf(f);
            if (e != -1) {
                TS.model.at_channel_suppressed_channels.splice(e, 1)
            }
            TS.prefs.setSuppressedChannels(TS.model.at_channel_suppressed_channels.join(","));
            if (g) {
                TS.channels.calcUnreadCnts(g)
            }
            if (h) {
                TS.groups.calcUnreadCnts(h)
            }
        },
        makeChannelOrGroupPushSuppresed: function(f) {
            var g = TS.channels.getChannelById(f);
            var h = TS.groups.getGroupById(f);
            if (!g && !h) {
                TS.error('wtf no channel/group "' + f + '"');
                return false
            }
            var e = TS.model.push_at_channel_suppressed_channels.indexOf(f);
            if (e == -1) {
                TS.model.push_at_channel_suppressed_channels.push(f)
            }
            TS.prefs.setPushSuppressedChannels(TS.model.push_at_channel_suppressed_channels.join(","))
        },
        makeChannelOrGroupNOTPushSuppresed: function(f) {
            var g = TS.channels.getChannelById(f);
            var h = TS.groups.getGroupById(f);
            if (!g && !h) {
                TS.error('wtf no channel/group "' + f + '"');
                return false
            }
            var e = TS.model.push_at_channel_suppressed_channels.indexOf(f);
            if (e != -1) {
                TS.model.push_at_channel_suppressed_channels.splice(e, 1)
            }
            TS.prefs.setPushSuppressedChannels(TS.model.push_at_channel_suppressed_channels.join(","))
        },
        makeChannelOrGroupDTopNothing: function(f) {
            var g = TS.channels.getChannelById(f);
            var h = TS.groups.getGroupById(f);
            if (!g && !h) {
                TS.error('wtf no channel/group "' + f + '"');
                return false
            }
            var e = TS.model.loud_channels.indexOf(f);
            if (e != -1) {
                TS.model.loud_channels.splice(e, 1)
            }
            TS.prefs.setLoudChannels(TS.model.loud_channels.join(","));
            var e = TS.model.never_channels.indexOf(f);
            if (TS.model.prefs.growls_enabled) {
                if (e == -1) {
                    TS.model.never_channels.push(f)
                }
                TS.channels.markChannelOrGroupAsDTopNonDefault(f)
            } else {
                if (e != -1) {
                    TS.model.never_channels.splice(e, 1)
                }
                TS.channels.markChannelOrGroupAsDTopDefault(f)
            }
            TS.prefs.setNeverChannels(TS.model.never_channels.join(","))
        },
        makeChannelOrGroupDTopEverything: function(f) {
            var g = TS.channels.getChannelById(f);
            var h = TS.groups.getGroupById(f);
            if (!g && !h) {
                TS.error('wtf no channel/group "' + f + '"');
                return false
            }
            var e = TS.model.never_channels.indexOf(f);
            if (e != -1) {
                TS.model.never_channels.splice(e, 1)
            }
            TS.prefs.setNeverChannels(TS.model.never_channels.join(","));
            var e = TS.model.loud_channels.indexOf(f);
            if (TS.model.prefs.growls_enabled && TS.model.prefs.all_channels_loud) {
                if (e != -1) {
                    TS.model.loud_channels.splice(e, 1)
                }
                TS.channels.markChannelOrGroupAsDTopDefault(f)
            } else {
                if (e == -1) {
                    TS.model.loud_channels.push(f)
                }
                TS.channels.markChannelOrGroupAsDTopNonDefault(f)
            }
            TS.prefs.setLoudChannels(TS.model.loud_channels.join(","))
        },
        makeChannelOrGroupDTopMentions: function(f) {
            var g = TS.channels.getChannelById(f);
            var h = TS.groups.getGroupById(f);
            if (!g && !h) {
                TS.error('wtf no channel/group "' + f + '"');
                return false
            }
            var e = TS.model.loud_channels.indexOf(f);
            if (e != -1) {
                TS.model.loud_channels.splice(e, 1)
            }
            TS.prefs.setLoudChannels(TS.model.loud_channels.join(","));
            e = TS.model.never_channels.indexOf(f);
            if (e != -1) {
                TS.model.never_channels.splice(e, 1)
            }
            TS.prefs.setNeverChannels(TS.model.never_channels.join(","));
            if (TS.model.prefs.growls_enabled && !TS.model.prefs.all_channels_loud) {
                TS.channels.markChannelOrGroupAsDTopDefault(f)
            } else {
                TS.channels.markChannelOrGroupAsDTopNonDefault(f)
            }
        },
        markChannelOrGroupAsDTopNonDefault: function(f) {
            var e = TS.model.loud_channels_set.indexOf(f);
            if (e == -1) {
                TS.model.loud_channels_set.push(f)
            }
            TS.prefs.setLoudChannelsSet(TS.model.loud_channels_set.join(","))
        },
        markChannelOrGroupAsDTopDefault: function(f) {
            var e = TS.model.loud_channels_set.indexOf(f);
            if (e != -1) {
                TS.model.loud_channels_set.splice(e, 1)
            }
            TS.prefs.setLoudChannelsSet(TS.model.loud_channels_set.join(","))
        },
        makeChannelOrGroupPushNothing: function(f) {
            var g = TS.channels.getChannelById(f);
            var h = TS.groups.getGroupById(f);
            if (!g && !h) {
                TS.error('wtf no channel/group "' + f + '"');
                return false
            }
            var e = TS.model.push_loud_channels.indexOf(f);
            if (e != -1) {
                TS.model.push_loud_channels.splice(e, 1)
            }
            TS.prefs.setPushLoudChannels(TS.model.push_loud_channels.join(","));
            var e = TS.model.push_mention_channels.indexOf(f);
            if (e != -1) {
                TS.model.push_mention_channels.splice(e, 1)
            }
            TS.prefs.setPushMentionChannels(TS.model.push_mention_channels.join(","));
            if (TS.model.prefs.push_everything || TS.model.prefs.push_mention_alert) {
                TS.channels.markChannelOrGroupAsPushNonDefault(f)
            } else {
                TS.channels.markChannelOrGroupAsPushDefault(f)
            }
        },
        makeChannelOrGroupPushEverything: function(f) {
            var g = TS.channels.getChannelById(f);
            var h = TS.groups.getGroupById(f);
            if (!g && !h) {
                TS.error('wtf no channel/group "' + f + '"');
                return false
            }
            var e = TS.model.push_mention_channels.indexOf(f);
            if (e != -1) {
                TS.model.push_mention_channels.splice(e, 1)
            }
            TS.prefs.setPushMentionChannels(TS.model.push_mention_channels.join(","));
            var e = TS.model.push_loud_channels.indexOf(f);
            if (TS.model.prefs.push_everything) {
                if (e != -1) {
                    TS.model.push_loud_channels.splice(e, 1)
                }
                TS.channels.markChannelOrGroupAsPushDefault(f)
            } else {
                if (e == -1) {
                    TS.model.push_loud_channels.push(f)
                }
                TS.channels.markChannelOrGroupAsPushNonDefault(f)
            }
            TS.prefs.setPushLoudChannels(TS.model.push_loud_channels.join(","))
        },
        makeChannelOrGroupPushMentions: function(f) {
            var g = TS.channels.getChannelById(f);
            var h = TS.groups.getGroupById(f);
            if (!g && !h) {
                TS.error('wtf no channel/group "' + f + '"');
                return false
            }
            var e = TS.model.push_loud_channels.indexOf(f);
            if (e != -1) {
                TS.model.push_loud_channels.splice(e, 1)
            }
            TS.prefs.setPushLoudChannels(TS.model.push_loud_channels.join(","));
            var e = TS.model.push_mention_channels.indexOf(f);
            if (!TS.model.prefs.push_mention_alert || TS.model.prefs.push_everything) {
                if (e == -1) {
                    TS.model.push_mention_channels.push(f)
                }
                TS.channels.markChannelOrGroupAsPushNonDefault(f)
            } else {
                if (e != -1) {
                    TS.model.push_mention_channels.splice(e, 1)
                }
                TS.channels.markChannelOrGroupAsPushDefault(f)
            }
            TS.prefs.setPushMentionChannels(TS.model.push_mention_channels.join(","))
        },
        markChannelOrGroupAsPushNonDefault: function(f) {
            var e = TS.model.push_loud_channels_set.indexOf(f);
            if (e == -1) {
                TS.model.push_loud_channels_set.push(f)
            }
            TS.prefs.setPushLoudChannelsSet(TS.model.push_loud_channels_set.join(","))
        },
        markChannelOrGroupAsPushDefault: function(f) {
            var e = TS.model.push_loud_channels_set.indexOf(f);
            if (e != -1) {
                TS.model.push_loud_channels_set.splice(e, 1)
            }
            TS.prefs.setPushLoudChannelsSet(TS.model.push_loud_channels_set.join(","))
        },
        closeArchivedChannel: function(f) {
            var e = TS.channels.getChannelById(f);
            if (!e) {
                return
            }
            if (!e.is_archived) {
                return
            }
            e.was_archived_this_session = false;
            TS.client.activeChannelDisplayGoneAway()
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
        getActiveMembersNotInThisChannelForInviting: function(n, h) {
            var g = [];
            var k = h || TS.model.user.is_admin;
            if (TS.model.user.is_ultra_restricted) {
                return g
            }
            var j = TS.channels.getChannelById(n);
            if (!j) {
                return g
            }
            var l;
            var f = TS.members.getActiveMembersWithSelfAndNotSlackbot();
            for (var e = 0; e < f.length; e++) {
                l = f[e];
                if (l.is_ultra_restricted) {
                    continue
                }
                if (!k && l.is_restricted) {
                    continue
                }
                if (j.members.indexOf(l.id) == -1) {
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
                g = TS.members.getMemberById(f.members[e]);
                if (!g) {
                    continue
                }
                if (g.deleted) {
                    continue
                }
                f.active_members.push(g.id)
            }
        },
        calcActiveMembersForAllChannels: function() {
            var e = TS.model.channels;
            for (var f = 0; f < e.length; f++) {
                TS.channels.calcActiveMembersForChannel(e[f])
            }
        },
        fetchList: function() {
            TS.api.call("channels.list", {}, TS.channels.onListFetched)
        },
        onListFetched: function(f, g, e) {
            if (!f) {
                TS.error("failed to fetch channel list");
                return
            }
            $.each(g.channels, function(h, j) {
                TS.channels.upsertChannel(j)
            });
            TS.channels.list_fetched_sig.dispatch(g.channels)
        },
        kickMember: function(j, e) {
            if (!TS.members.canUserKickFromChannels()) {
                return
            }
            var f = TS.channels.getChannelById(j);
            if (!f) {
                return
            }
            var h = TS.members.getMemberById(e);
            if (!h) {
                return
            }
            if (f.members.indexOf(h.id) == -1) {
                TS.generic_dialog.alert("<b>" + TS.members.getMemberDisplayName(h, true) + "</b> is not a member of #" + f.name + ".");
                return
            }
            var g = TS.members.getMemberDisplayName(h, true);
            TS.generic_dialog.start({
                title: "Remove " + g,
                body: "<p>Are you sure you wish to remove <b>" + g + "</b> from #" + f.name + "?</p>",
                go_button_text: "Yes, remove them",
                on_go: function() {
                    TS.api.call("channels.kick", {
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
                            setTimeout(TS.generic_dialog.alert, 500, n)
                        }
                    })
                }
            })
        },
        getChannelsForUser: function() {
            if (!TS.model.user.is_restricted) {
                return TS.model.channels
            }
            b.length = 0;
            var f;
            for (var e = 0; e < TS.model.channels.length; e++) {
                f = TS.model.channels[e];
                if (!f.is_member) {
                    continue
                }
                b.push(f)
            }
            return b
        },
        getUnarchivedChannelsForUser: function() {
            a.length = 0;
            var e = TS.channels.getChannelsForUser();
            var g;
            for (var f = 0; f < e.length; f++) {
                g = e[f];
                if (g.is_archived) {
                    continue
                }
                a.push(g)
            }
            return a
        },
        setDataRetention: function(e, f, j, h) {
            var g = {
                channel: e,
                retention_type: $("select[name=retention_type]").val()
            };
            if (g.retention_type == 1) {
                g.retention_duration = $("#retention_duration").val()
            }
            TS.api.call("channels.setRetention", g, function(l, m, k) {
                if (h) {
                    h(l, m, k)
                }
                if (l) {
                    TS.channels.data_retention_changed_sig.dispatch(k)
                }
            })
        },
        getDataRetention: function(e, f) {
            TS.api.call("channels.getRetention", {
                channel: e
            }, f)
        },
        canChannelOrGroupHaveChannelMentions: function(f) {
            var e = TS.channels.getChannelById(f) || TS.groups.getGroupById(f);
            if (!e) {
                TS.error("no model_ob for c_id:" + f + "?");
                return true
            }
            if (TS.model.team.prefs.who_can_at_channel == "admin" || TS.model.team.prefs.who_can_at_channel == "owner") {
                return true
            }
            if (e.is_general && (TS.model.team.prefs.who_can_at_everyone == "admin" || TS.model.team.prefs.who_can_at_everyone == "owner")) {
                return true
            }
            if (e.is_general && (TS.model.team.prefs.who_can_post_general == "admin" || TS.model.team.prefs.who_can_post_general == "owner")) {
                return true
            }
            var g = TS.utility.msgs.getChannelOrGroupNotifySettingBasedOnLoudness(e.id);
            if (g != "mentions") {
                return true
            }
            return !TS.channels.hasUserSuppressedChannelOrGroupChannelMentions(f)
        },
        hasUserSuppressedChannelOrGroupChannelMentions: function(g) {
            var e = TS.channels.getChannelById(g) || TS.groups.getGroupById(g);
            if (!e) {
                TS.error("no model_ob for c_id:" + g + "?");
                return true
            }
            var f = TS.model.at_channel_suppressed_channels.indexOf(e.id);
            if (f != -1) {
                return true
            }
            return false
        },
        hasUserSuppressedChannelOrGroupPushChannelMentions: function(g) {
            var e = TS.channels.getChannelById(g) || TS.groups.getGroupById(g);
            if (!e) {
                TS.error("no model_ob for c_id:" + g + "?");
                return true
            }
            var f = TS.model.push_at_channel_suppressed_channels.indexOf(e.id);
            if (f != -1) {
                return true
            }
            return false
        }
    });
    var b = [];
    var a = [];
    var d = {};
    var c = {}
})();
(function() {
    TS.registerModule("channels.ui", {
        onStart: function() {},
        showDataRetentionDialog: function(p, u, h, n) {
            var k = h == null;
            var o, r, s;
            o = TS.channels.getChannelById(p);
            if (!o) {
                r = TS.ims.getImById(p)
            }
            if (!o && !r) {
                s = TS.groups.getGroupById(p)
            }
            if (!r && !o && !s) {
                TS.error("unknown channel_id passed to data retention dialog:" + p);
                return
            }
            var q, j;
            if (o) {
                j = "channel";
                q = "#" + TS.utility.htmlEntities(o.name)
            } else {
                if (r) {
                    j = "conversation";
                    q = "this conversation"
                } else {
                    j = "group";
                    q = TS.utility.htmlEntities(s.name)
                }
            }
            var l = TS.model.team.prefs.retention_type;
            var m = TS.model.team.prefs.retention_duration;
            if (s) {
                l = TS.model.team.prefs.group_retention_type;
                m = TS.model.team.prefs.group_retention_duration
            } else {
                if (r) {
                    l = TS.model.team.prefs.dm_retention_type;
                    m = TS.model.team.prefs.dm_retention_duration
                }
            }
            var t = f();
            if (!k) {
                t = TS.templates.channel_data_retention_dialog({
                    model_type: j,
                    retention_type: h,
                    retention_duration: n,
                    team_type: l,
                    team_duration: m
                })
            }
            TS.generic_dialog.start({
                title: "Edit retention policy for " + q,
                body: t,
                go_button_text: "Save settings",
                enter_always_gos: true,
                on_go: function() {
                    var v = $("select[name=retention_type]").val();
                    var w = $("#retention_duration").val();
                    if (v == null) {
                        return
                    }
                    if (w == null) {
                        return
                    }
                    if (o) {
                        TS.channels.setDataRetention(p, v, w, u)
                    } else {
                        if (r) {
                            TS.ims.setDataRetention(p, v, w, u)
                        } else {
                            TS.groups.setDataRetention(p, v, w, u)
                        }
                    }
                },
                on_show: k ? null : a
            });
            if (k) {
                if (o) {
                    TS.channels.getDataRetention(p, e)
                } else {
                    if (r) {
                        TS.ims.getDataRetention(p, c)
                    } else {
                        TS.groups.getDataRetention(p, g)
                    }
                }
            }
        },
        channelCreateDialogShowNameTakenAlert: function(h) {
            h.find(".modal_input_note").addClass("hidden");
            h.find(".name_taken_warning").removeClass("hidden");
            $("#channel_create_title").select()
        },
        channelCreateDialogShowDisallowedCharsAlert: function(h) {
            h.find(".modal_input_note").addClass("hidden");
            h.find(".invalid_chars_warning").removeClass("hidden");
            $("#channel_create_title").select()
        },
        channelCreateDialogValidateInput: function(l) {
            var j = l.find(".title_input").val();
            var h = $.trim(l.find("#channel_purpose_input").val());
            var k = TS.utility.cleanChannelName(j);
            while (j.substr(0, 1) == "#") {
                j = j.substr(1)
            }
            if (k != j) {
                l.find(".title_input").val(k);
                TS.channels.ui.channelCreateDialogShowDisallowedCharsAlert(l);
                return false
            }
            if (!j) {
                $("#channel_create_title").select();
                return false
            }
            if (TS.channels.getChannelByName(j) || TS.groups.getGroupByName(j) || TS.members.getMemberByName(j)) {
                TS.channels.ui.channelCreateDialogShowNameTakenAlert(l);
                return false
            }
            return true
        }
    });
    var e = function(j, l, h) {
        if (j) {
            var k = l.retention.retention_type;
            var m = l.retention.retention_duration;
            d("channel", k, m)
        } else {
            b("channel", l)
        }
    };
    var g = function(j, l, h) {
        if (j) {
            var k = l.retention.retention_type;
            var m = l.retention.retention_duration;
            d("group", k, m)
        } else {
            b("group", l)
        }
    };
    var c = function(j, l, h) {
        if (j) {
            var k = l.retention.retention_type;
            var m = l.retention.retention_duration;
            d("conversation", k, m)
        } else {
            b("conversation", l)
        }
    };
    var d = function(j, k, n) {
        var l = $("#generic_dialog .loading_hash_animation");
        var m = TS.model.team.prefs.retention_type;
        var h = TS.model.team.prefs.retention_duration;
        if (j === "group") {
            m = TS.model.team.prefs.group_retention_type;
            h = TS.model.team.prefs.group_retention_duration
        } else {
            if (j === "conversation") {
                m = TS.model.team.prefs.dm_retention_type;
                h = TS.model.team.prefs.dm_retention_duration
            }
        }
        l.replaceWith(TS.templates.channel_data_retention_dialog({
            model_type: j,
            retention_type: k,
            retention_duration: n,
            team_type: m,
            team_duration: h
        }));
        a()
    };
    var b = function(h, k) {
        var j = $("#generic_dialog .loading_hash_animation");
        if (k.error === "no_perms" || k.error === "is_archived" || k.error === "not_paid") {
            j.replaceWith('<p class="no_bottom_margin">Sorry! You can\'t change the retention duration for this ' + h + ".</p>")
        } else {
            j.replaceWith('<p class="no_bottom_margin">Oops! Something went wrong. Please try again.</p>')
        }
    };
    var a = function() {
        $("select[name=retention_type]").change(function() {
            if (this.value != 1) {
                $("#team_retention_pref").removeClass("hidden");
                $("#retention_duration_container, #retention_duration_warning").addClass("hidden")
            } else {
                $("#team_retention_pref").addClass("hidden");
                $("#retention_duration_container, #retention_duration_warning").removeClass("hidden");
                if ($("#retention_duration").val() == 0) {
                    $("#retention_duration").val("")
                }
                $("#retention_duration").focus()
            }
        }).change()
    };
    var f = function() {
        var h = "https://slack.global.ssl.fastly.net/20655/img/loading_hash_animation.gif";
        return '<div class="loading_hash_animation" style="margin: 2rem;"><img src="' + h + '" alt="Loading" /><br />loading...</div>'
    }
})();
(function() {
    TS.registerModule("groups", {
        switched_sig: new signals.Signal(),
        joined_sig: new signals.Signal(),
        member_joined_sig: new signals.Signal(),
        left_sig: new signals.Signal(),
        member_left_sig: new signals.Signal(),
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
        deleted_sig: new signals.Signal(),
        renamed_sig: new signals.Signal(),
        opened_sig: new signals.Signal(),
        closed_sig: new signals.Signal(),
        archived_sig: new signals.Signal(),
        unarchived_sig: new signals.Signal(),
        msg_not_sent_sig: new signals.Signal(),
        data_retention_changed_sig: new signals.Signal(),
        onStart: function() {},
        addMsg: function(k, j) {
            var h = TS.groups.getGroupById(k);
            if (!h) {
                TS.error('unknown group "' + k + '"');
                return
            }
            var f = h.msgs;
            if (!TS.utility.msgs.validateMsg(k, j, f)) {
                return
            }
            TS.utility.msgs.appendMsg(f, j);
            TS.utility.msgs.maybeStoreMsgs(h.id, f);
            TS.utility.msgs.maybeSetOldestMsgsTsAfterMsgAdded(h);
            var g = !TS.utility.msgs.isTempMsg(j);
            TS.groups.calcUnreadCnts(h, g);
            TS.utility.msgs.maybeTruncateMsgs(h);
            TS.groups.message_received_sig.dispatch(h, j);
            if (!h.is_open) {
                TS.api.call("groups.open", {
                    channel: h.id
                }, TS.groups.onOpened)
            }
        },
        calcUnreadCnts: function(g, f) {
            TS.shared.calcUnreadCnts(g, TS.groups, f)
        },
        removeMsg: function(j, h) {
            var g = TS.groups.getGroupById(j);
            if (!g) {
                TS.error('unknown group "' + j + '"');
                return
            }
            var f = g.msgs;
            TS.utility.msgs.spliceMsg(f, h);
            TS.groups.message_removed_sig.dispatch(g, h);
            TS.utility.msgs.maybeStoreMsgs(g.id, f);
            TS.groups.calcUnreadCnts(g, true)
        },
        changeMsgText: function(j, h, f) {
            var g = TS.groups.getGroupById(j);
            if (!g) {
                TS.error('unknown group "' + j + '"');
                return
            }
            h.text = f;
            TS.groups.message_changed_sig.dispatch(g, h);
            TS.utility.msgs.maybeStoreMsgs(g.id, g.msgs)
        },
        sendMsg: function(j, l) {
            var k = TS.groups.getGroupById(j);
            if (!k) {
                return false
            }
            if (k.is_archived) {
                return false
            }
            var h = TS.channels.getGeneralChannel();
            var f = function(m) {
                TS.generic_dialog.alert(m);
                TS.view.input_el.val(l);
                TS.view.focusMessageInput()
            };
            if (TS.model.everyone_regex.test(TS.format.cleanMsg(l))) {
                if (!TS.members.canUserAtEveryone()) {
                    var g = "<p>A team owner has restricted the use of <b>@everyone</b> messages.</p>";
                    if (TS.model.user.is_restricted) {
                        g = "<p>Your account is restricted, and you cannot send <b>@everyone</b> messages.</p>"
                    }
                    if (TS.members.canUserAtChannelOrAtGroup()) {
                        g += '<p class="no_bottom_margin">If you just want to address everyone in this group, use <b>@group</b> instead.</p>'
                    }
                    f(g);
                    return false
                }
                if (!h || !h.is_member) {
                    var g = "<p>You cannot send <b>@everyone</b> messages.</p>";
                    if (TS.members.canUserAtChannelOrAtGroup()) {
                        g += '<p class="no_bottom_margin">If you just want to address everyone in this group, use <b>@group</b> instead.</p>'
                    }
                    f(g)
                } else {
                    TS.generic_dialog.start({
                        title: "Send @everyone a message",
                        body: '<p class="bold">Would you like to switch to #' + h.name + ' and send your message?</p><p class="">Using <b>@everyone</b> in a message is a way to address your whole team, but it must be done in the #' + h.name + ' channel.</p><p class="no_bottom_margin">If you just want to address everyone in this group, use <b>@group</b> instead.</p>',
                        show_cancel_button: true,
                        show_go_button: true,
                        go_button_text: "Yes, send it",
                        on_go: function() {
                            TS.channels.displayChannel(h.id, l)
                        },
                        on_cancel: function() {
                            TS.view.input_el.val(l);
                            TS.view.focusMessageInput()
                        }
                    })
                }
                return false
            }
            if ((TS.model.channel_regex.test(TS.format.cleanMsg(l)) || TS.model.group_regex.test(TS.format.cleanMsg(l))) && !TS.members.canUserAtChannelOrAtGroup()) {
                var g = "<p>A team owner has restricted the use of <b>@group</b> messages.</p>";
                f(g);
                return false
            }
            return TS.shared.sendMsg(j, l, TS.groups)
        },
        onSendMsg: function(h, f) {
            var g = TS.groups.getGroupById(f.SENT_MSG.channel);
            if (!g) {
                TS.error("unknown group? " + f.SENT_MSG.channel);
                return
            }
            TS.shared.onSendMsg(h, f, g, TS.groups)
        },
        closeGroup: function(g) {
            var f = TS.groups.getGroupById(g);
            if (!f) {
                return
            }
            TS.api.call("groups.close", {
                channel: g
            }, TS.groups.onClosed)
        },
        onClosed: function(g, h, f) {
            if (!g) {
                return
            }
            if (h.no_op) {
                var j = TS.groups.getGroupById(f.channel);
                if (j) {
                    if (j.is_archived) {
                        j.was_archived_this_session = false
                    }
                    TS.groups.closed_sig.dispatch(j)
                }
            }
        },
        onOpened: function(f, g) {
            if (!f) {
                return
            }
        },
        displayGroup: function(j, g, k, h) {
            k = !!k;
            h = !!h;
            var l = TS.groups.getGroupById(j);
            if (!l) {
                TS.error('group "' + j + '" unknown');
                return
            }
            TS.info("displayGroup " + l.name + " from_history:" + k + " replace_history_state:" + h);
            if (j == TS.model.active_group_id && !h) {
                TS.warn('group "' + j + '" already displayed');
                if (g) {
                    TS.groups.sendMsg(j, $.trim(g))
                }
                return
            }
            var f = (h) ? false : k;
            if (TS.client.channelDisplaySwitched(null, null, j, h, f)) {
                TS.groups.switched_sig.dispatch()
            }
            if (l.is_open) {
                if (g) {
                    TS.groups.sendMsg(j, $.trim(g))
                }
                return
            }
            TS.model.requested_group_opens[j] = {
                and_send_txt: g
            };
            TS.api.call("groups.open", {
                channel: l.id
            }, TS.groups.onOpened)
        },
        setLastRead: function(h, f) {
            if (h.last_read == f) {
                return false
            }
            if (f.indexOf(TS.utility.date.fake_ts_unique_padder) > -1) {
                TS.error("bad ts:" + f);
                return false
            }
            if (h.last_read > f) {
                var g = TS.model.last_reads_set_by_client[h.id + "_" + f];
                delete TS.model.last_reads_set_by_client[h.id + "_" + f];
                if (g) {
                    TS.warn("NOT going back in time group.last_read:" + h.last_read + " new:" + f);
                    return
                }
                TS.info("going back in time group.last_read:" + h.last_read + " new:" + f)
            }
            h.last_read = f;
            TS.groups.marked_sig.dispatch(h);
            TS.groups.calcUnreadCnts(h);
            return true
        },
        markMostRecentReadMsg: function(f) {
            if (!f) {
                TS.error("group unknown");
                return
            }
            if (!f.msgs || !f.msgs.length) {
                return
            }
            var g = TS.utility.msgs.getMostRecentValidTs(f.msgs);
            if (!g) {
                TS.warn("no valid tses???");
                return
            }
            f.all_read_this_session_once = true;
            TS.groups.markReadMsg(f.id, g)
        },
        markReadMsg: function(g, f) {
            var h = TS.groups.getGroupById(g);
            if (!h) {
                TS.error('group "' + g + '" unknown');
                return
            }
            if (h.last_read == f) {
                return
            }
            if (TS.groups.setLastRead(h, f)) {
                h.needs_api_marking = true
            }
        },
        onMarked: function(g, h, f) {
            var j = TS.groups.getGroupById(f.channel);
            if (!j) {
                TS.error('wtf no group "' + f.channel + '"');
                return
            }
            if (g || (h && h.error == "is_archived")) {} else {
                j.needs_api_marking = true
            }
        },
        create: function(g, f, j) {
            if (!g) {
                return
            }
            TS.model.created_groups[g] = true;
            var h = (f) ? f.join(",") : "";
            TS.api.call("groups.create", {
                name: g,
                and_invite_members_ids: h
            }, function(l, m, k) {
                TS.groups.onCreate(l, m, k);
                if (j) {
                    j(l, m, k)
                }
            })
        },
        createChild: function(g, f, k) {
            var j = TS.groups.getGroupById(g);
            if (!j) {
                return
            }
            TS.model.archives_and_recreated_groups[g] = true;
            var h = (f) ? f.join(",") : "";
            TS.api.call("groups.createChild", {
                channel: g,
                and_invite_members_ids: h
            }, function(m, n, l) {
                TS.groups.onCreate(m, n, l);
                if (k) {
                    k(m, n, l)
                }
            })
        },
        onCreate: function(h, k, f) {
            if (!h) {
                if (k.error == "name_taken") {} else {
                    if (k.error == "restricted_action") {} else {
                        TS.error("failed to create group");
                        alert("failed to create group")
                    }
                }
                return
            }
            var j;
            if (k.group) {
                var m = TS.groups.upsertGroup(k.group);
                j = k.group.id
            }
            if (!j) {
                TS.error("no group_id?!!");
                return
            }
            if (!m) {
                TS.error("no group?!!");
                return
            }
            var l = f.and_invite_members_ids ? f.and_invite_members_ids.split(",") : null;
            if (l) {
                for (var g = 0; g < l.length; g++) {
                    TS.api.call("groups.invite", {
                        channel: j,
                        user: l[g]
                    })
                }
            }
            TS.groups.displayGroup(j)
        },
        leave: function(g) {
            var f = TS.groups.getGroupById(g);
            if (!f) {
                TS.error("WTF no group:" + g);
                return
            }
            if (f.active_members.length == 1) {
                TS.groups.closeGroup(g);
                return
            }
            if (!TS.groups.canLeaveGroup(g)) {
                return
            }
            TS.generic_dialog.start({
                title: "Leave " + TS.model.group_prefix + f.name,
                body: "<p>If you leave the group, you will no longer be able to see any of its messages. To rejoin the group, you will have to be re-invited.</p><p>Are you sure you wish to leave?</p>",
                go_button_text: "Yes, leave the group",
                on_go: function() {
                    TS.api.call("groups.leave", {
                        channel: g
                    }, TS.groups.onLeave)
                }
            })
        },
        onLeave: function(g, h, f) {
            if (!g) {
                if (h && h.error == "last_member") {
                    TS.groups.closeGroup(f.channel);
                    return
                }
                TS.error("failed to leave group");
                return
            }
            var j = TS.groups.getGroupById(f.channel);
            if (!j) {
                TS.error('wtf no group "' + f.channel + '"');
                return
            }
            j.msgs.length = 0;
            TS.storage.storeMsgs(j.id, null)
        },
        setTopic: function(g, f) {
            TS.api.call("groups.setTopic", {
                channel: g,
                topic: f
            }, TS.groups.onSetTopic)
        },
        onSetTopic: function(g, h, f) {
            if (!g) {
                TS.error("failed to set group topic");
                return
            }
        },
        setPurpose: function(g, f) {
            TS.api.call("groups.setPurpose", {
                channel: g,
                purpose: f
            }, TS.groups.onSetPurpose)
        },
        onSetPurpose: function(g, h, f) {
            if (!g) {
                TS.error("failed to set group purpose");
                return
            }
        },
        getGroupById: function(j) {
            var f = TS.model.groups;
            var h = c[j];
            if (h) {
                return h
            }
            if (!f) {
                return null
            }
            for (var g = 0; g < f.length; g++) {
                h = f[g];
                if (h.id == j) {
                    TS.warn(j + " not in _id_map?");
                    c[j] = h;
                    return h
                }
            }
            return null
        },
        getGroupByName: function(g) {
            g = TS.utility.getLowerCaseValue(g);
            var f = TS.model.groups;
            var j = b[g];
            if (j) {
                return j
            }
            if (!f) {
                return null
            }
            for (var h = 0; h < f.length; h++) {
                j = f[h];
                if (j._name_lc == g || TS.model.group_prefix + j._name_lc == g) {
                    TS.warn(g + " not in _name_map?");
                    b[g] = j;
                    b[TS.model.group_prefix + g] = j;
                    return j
                }
            }
            return null
        },
        upsertGroup: function(o) {
            var f = TS.model.groups;
            var l = TS.groups.getGroupById(o.id);
            var j;
            if (l) {
                TS.log(4, 'updating existing group "' + o.id + '"');
                for (var h in o) {
                    if (h == "members") {
                        j = o.members;
                        l.members.length = 0;
                        for (var m = 0; m < j.length; m++) {
                            l.members.push(j[m])
                        }
                    } else {
                        l[h] = o[h]
                    }
                }
                o = l;
                if (o.is_open || o.unread_cnt) {
                    TS.shared.checkInitialMsgHistory(o, TS.groups)
                }
            } else {
                TS.log(4, 'adding group "' + o.id + '"');
                f.push(o);
                if (o.is_group !== true) {
                    TS.warn(o.name + " lacked the is_group flag from the server");
                    o.is_group = true
                }
                o._name_lc = TS.utility.getLowerCaseValue(o.name);
                c[o.id] = o;
                b[o._name_lc] = o;
                b[TS.model.group_prefix + o._name_lc] = o;
                o.active_members = [];
                o.oldest_msg_ts = TS.storage.fetchOldestTs(o.id);
                o.last_msg_input = TS.storage.fetchLastMsgInput(o.id);
                o.scroll_top = -1;
                o.history_is_being_fetched = false;
                o.needs_api_marking = false;
                o.unread_highlight_cnt = 0;
                o.unread_highlights = [];
                o.unread_cnt = 0;
                o.unreads = [];
                o.oldest_unread_ts = null;
                o.has_fetched_history_after_scrollback = false;
                if (TS.client) {
                    var g = TS.utility.msgs.fetchInitialMsgsFromLS(o);
                    TS.utility.msgs.setMsgs(o, g)
                } else {
                    if (TS.boot_data.msgs) {
                        TS.utility.msgs.ingestMessagesFromBootData(o)
                    }
                } if (TS.model.created_groups[o.name]) {
                    delete TS.model.created_groups[o.name]
                }
            } if (TS.client) {
                var n = TS.utility.msgs.shouldMarkUnreadsOnMessageFetch();
                TS.groups.calcUnreadCnts(o, n)
            }
            TS.groups.calcActiveMembersForGroup(o);
            return o
        },
        removeGroup: function(h) {
            var f = TS.model.groups;
            TS.log(4, 'removing group "' + h.id + '"');
            var j;
            for (var g = 0; g < f.length; g++) {
                j = f[g];
                if (j.id == h.id) {
                    f.splice(g, 1);
                    break
                }
            }
            delete c[h.id];
            delete b[h._name_lc];
            delete b[TS.model.group_prefix + h._name_lc];
            if (TS.client) {
                if (TS.model.active_group_id == h.id) {
                    TS.client.activeChannelDisplayGoneAway()
                }
            }
            h.msgs.length = 0;
            TS.storage.storeMsgs(h.id, null);
            TS.groups.deleted_sig.dispatch(h)
        },
        groupRenamed: function(h) {
            var f = TS.groups.getGroupById(h.id);
            delete b[f._name_lc];
            delete b[TS.model.group_prefix + f._name_lc];
            var g = TS.groups.upsertGroup(h);
            g._name_lc = TS.utility.getLowerCaseValue(g.name);
            b[g._name_lc] = g;
            b[TS.model.group_prefix + g._name_lc] = g;
            TS.view.updateTitleWithContext();
            TS.groups.renamed_sig.dispatch(g)
        },
        markScrollTop: function(h, f) {
            var g = TS.groups.getGroupById(h);
            if (!g) {
                return false
            }
            if (g.scroll_top == f) {
                return false
            }
            g.scroll_top = f;
            return true
        },
        maybeLoadScrollBackHistory: function(g) {
            var f = TS.groups.getGroupById(g);
            if (!f) {
                return false
            }
            return TS.shared.maybeLoadScrollBackHistory(f, TS.groups)
        },
        maybeLoadHistory: function(g) {
            var f = TS.groups.getGroupById(g);
            if (!f) {
                return false
            }
            return TS.shared.maybeLoadHistory(f, TS.groups)
        },
        onHistory: function(g, h, f) {
            var k = TS.groups.getGroupById(f.channel);
            if (!k) {
                TS.error('wtf no group "' + f.channel + '"');
                return
            }
            if (!g || !h || !h.messages) {
                TS.error("failed to get history");
                k.history_is_being_fetched = false;
                TS.groups.history_fetched_sig.dispatch(k);
                return
            }
            var l = TS.shared.onHistory(k, h, f, TS.groups);
            if (!l) {
                k.history_is_being_fetched = false;
                TS.groups.history_fetched_sig.dispatch(k)
            }
            var j = TS.utility.msgs.shouldMarkUnreadsOnMessageFetch();
            TS.groups.calcUnreadCnts(k, j)
        },
        fetchHistory: function(g, f) {
            if (!g) {
                TS.error('wtf no group "' + g + '"');
                return
            }
            g.history_is_being_fetched = true;
            TS.groups.history_being_fetched_sig.dispatch(g);
            TS.api.call("groups.history", f, TS.groups.onHistory)
        },
        topicChanged: function(j, f, h, g) {
            if (!j.topic) {
                j.topic = {}
            }
            j.topic.creator = f;
            j.topic.last_set = h;
            j.topic.value = g;
            TS.groups.topic_changed_sig.dispatch(j, f, g)
        },
        purposeChanged: function(j, f, h, g) {
            if (!j.purpose) {
                j.purpose = {}
            }
            j.purpose.creator = f;
            j.purpose.last_set = h;
            j.purpose.value = g;
            TS.groups.purpose_changed_sig.dispatch(j, f, g)
        },
        getUnarchivedClosedGroups: function(j) {
            e.length = 0;
            var f = TS.model.groups;
            var h;
            for (var g = 0; g < f.length; g++) {
                h = f[g];
                if (h.is_archived) {
                    continue
                }
                if (h.is_open) {
                    continue
                }
                e.push(h)
            }
            return e
        },
        getUnarchivedGroups: function() {
            a.length = 0;
            var f = TS.model.groups;
            var h;
            for (var g = 0; g < f.length; g++) {
                h = f[g];
                if (h.is_archived) {
                    continue
                }
                a.push(h)
            }
            return a
        },
        getActiveMembersNotInThisGroupForInviting: function(h, f) {
            var g = TS.groups.getGroupById(h);
            if (!g) {
                return []
            }
            return d(f, g)
        },
        getActiveMembersForInviting: function(f) {
            return d(f)
        },
        getGroupsWithTheseActiveMembers: function(n) {
            var f = [];
            var g = TS.model.groups;
            var o;
            var j = n.sort().join(",");
            var p;
            var k;
            for (var l = 0; l < g.length; l++) {
                o = g[l];
                o.members.sort();
                p = [];
                for (var h = 0; h < o.members.length; h++) {
                    k = TS.members.getMemberById(o.members[h]);
                    if (!k) {
                        continue
                    }
                    if (k.deleted) {
                        continue
                    }
                    p.push(k.id)
                }
                if (j == p.join(",")) {
                    f.push(o)
                }
            }
            return f
        },
        calcActiveMembersForGroup: function(g) {
            g.active_members.length = 0;
            if (!g.members) {
                return
            }
            var h;
            for (var f = 0; f < g.members.length; f++) {
                h = TS.members.getMemberById(g.members[f]);
                if (!h) {
                    continue
                }
                if (h.deleted) {
                    continue
                }
                g.active_members.push(h.id)
            }
        },
        calcActiveMembersForAllGroups: function() {
            var f = TS.model.groups;
            for (var g = 0; g < f.length; g++) {
                TS.groups.calcActiveMembersForGroup(f[g])
            }
        },
        createSuggestedName: function(k) {
            var f = TS.model.user.name;
            var n = [];
            var h;
            var j;
            var l = TS.model.channel_name_max_length;
            for (j = 0; j < k.length; j++) {
                h = TS.members.getMemberById(k[j]);
                if (!h) {
                    continue
                }
                n.push(h)
            }
            n.sort(function g(r, q) {
                if (r.id == TS.ui.group_create_dialog.start_member_id) {
                    return -1
                }
                if (q.id == TS.ui.group_create_dialog.start_member_id) {
                    return 1
                }
                var s = r._name_lc;
                var t = q._name_lc;
                if (s < t) {
                    return -1
                }
                if (s > t) {
                    return 1
                }
                return 0
            });
            for (j = 0; j < n.length; j++) {
                h = n[j];
                f += "-" + h.name.split("-")[0]
            }
            if (f.length > l) {
                f = f.substr(0, l);
                if (f.charAt(f.length - 1) == "-") {
                    f = f.substr(0, l - 1)
                }
            }
            var o = f;
            var p = 1;
            var m;
            while (TS.channels.getChannelByName(f) || TS.groups.getGroupByName(f) || TS.members.getMemberByName(f)) {
                m = (p + 1).toString();
                f = o + m;
                if (f.length > l) {
                    f = o.substr(0, l - m.length) + m
                }
            }
            return f
        },
        kickMember: function(k, f) {
            if (!TS.members.canUserKickFromGroups()) {
                return
            }
            var h = TS.groups.getGroupById(k);
            if (!h) {
                return
            }
            var j = TS.members.getMemberById(f);
            if (!j) {
                return
            }
            if (h.members.indexOf(j.id) == -1) {
                TS.generic_dialog.alert("<b>" + TS.members.getMemberDisplayName(j, true) + "</b> is not a member of " + h.name + ".");
                return
            }
            var g = TS.members.getMemberDisplayName(j, true);
            TS.generic_dialog.start({
                title: "Remove " + g,
                body: "<p>If you remove <b>" + g + "</b> from " + h.name + ", they will no longer be able to see any of its messages. To rejoin the group, they will have to be re-invited.</p><p>Are you sure you wish to do this?</p>",
                go_button_text: "Yes, remove them",
                on_go: function() {
                    TS.api.call("groups.kick", {
                        channel: k,
                        user: f
                    }, function(m, n, l) {
                        if (!m) {
                            var o = 'Kicking failed with error "' + n.error + '"';
                            if (n.error == "cant_kick_from_last_channel") {
                                o = "<b>" + g + "</b> can't be kicked from <b>" + h.name + "</b> because they must belong to at least one channel or group."
                            } else {
                                if (n.error == "restricted_action") {
                                    o = "<p>You don't have permission to kick from channels.</p><p>Talk to your team owner.</p>"
                                }
                            }
                            setTimeout(TS.generic_dialog.alert, 500, o)
                        }
                    })
                }
            })
        },
        canLeaveGroup: function(h) {
            if (!TS.model.user.is_restricted) {
                return true
            }
            if (TS.model.user.is_ultra_restricted) {
                return false
            }
            if (TS.channels.getChannelsForUser().length) {
                return true
            }
            var f = TS.model.groups;
            var j;
            for (var g = 0; g < f.length; g++) {
                j = f[g];
                if (j.is_archived) {
                    continue
                }
                if (j.id == h) {
                    continue
                }
                return true
            }
            return false
        },
        setDataRetention: function(k, f, j, h) {
            var g = {
                channel: k,
                retention_type: $("select[name=retention_type]").val()
            };
            if (g.retention_type == 1) {
                g.retention_duration = $("#retention_duration").val()
            }
            TS.api.call("groups.setRetention", g, function(m, n, l) {
                if (h) {
                    h(m, n, l)
                }
                if (m) {
                    TS.groups.data_retention_changed_sig.dispatch(l)
                }
            })
        },
        getDataRetention: function(g, f) {
            TS.api.call("groups.getRetention", {
                channel: g
            }, f)
        }
    });
    var c = {};
    var b = {};
    var e = [];
    var a = [];
    var d = function(h, l) {
        var g = [];
        var k = h || TS.model.user.is_admin;
        if (TS.model.user.is_ultra_restricted && !h) {
            return g
        }
        var j = TS.members.getMembersForUser();
        var n;
        for (var f = 0; f < j.length; f++) {
            n = j[f];
            if (n.deleted) {
                continue
            }
            if (n.is_slackbot) {
                continue
            }
            if (n.is_self) {
                continue
            }
            if (n.is_ultra_restricted) {
                continue
            }
            if (!l || l.members.indexOf(n.id) == -1) {
                g.push(n)
            }
        }
        return g
    }
})();
(function() {
    TS.registerModule("files", {
        member_files_fetched_sig: new signals.Signal(),
        team_files_fetched_sig: new signals.Signal(),
        team_file_added_sig: new signals.Signal(),
        team_file_deleted_sig: new signals.Signal(),
        team_file_changed_sig: new signals.Signal(),
        team_file_comment_added_sig: new signals.Signal(),
        team_file_comment_edited_sig: new signals.Signal(),
        team_file_comment_deleted_sig: new signals.Signal(),
        file_uploaded_sig: new signals.Signal(),
        file_uploading_sig: new signals.Signal(),
        file_progress_sig: new signals.Signal(),
        file_canceled_sig: new signals.Signal(),
        file_queue_emptied_sig: new signals.Signal(),
        uploadQ: [],
        uploading: false,
        polling_count: 0,
        polling_file_id: null,
        polling_ticket: null,
        polling_tim: null,
        polling_handler: null,
        waiting_for_refresh: {},
        onStart: function() {},
        promptForFileUnshare: function(e, c) {
            var d = TS.channels.getChannelById(c);
            var f = (d) ? null : TS.groups.getGroupById(c);
            if (!f && !d) {
                return
            }
            TS.generic_dialog.start({
                title: "Un-share file",
                body: "<p>Are you sure you want to un-share this file from the <b>" + ((d) ? "#" + d.name + "</b> channel" : f.name + "</b> group") + "?</p>					<p>Un-sharing the file will not remove existing share and comment messages, but it will keep any future comments from appearing 					in the " + ((d) ? "channel" : "group") + ".</p>",
                show_cancel_button: true,
                show_go_button: true,
                go_button_text: "Yes, unshare this file",
                cancel_button_text: "Cancel",
                on_go: function() {
                    TS.files.unshareFile(e, c)
                }
            })
        },
        shareFile: function(f, c, e, d) {
            TS.api.call("files.share", {
                file: f,
                channel: c,
                comment: e || ""
            }, function(h, j, g) {
                TS.files.onFileShare(h, j, g);
                if (d) {
                    d(h, j, g)
                }
            })
        },
        onFileShare: function(d, e, c) {
            if (!d) {
                return
            }
            if (TS.web) {
                TS.files.fetchFileInfo(c.file, function(g, f) {
                    TS.files.upsertAndSignal(f)
                })
            }
        },
        unshareFile: function(e, c, d) {
            TS.api.call("files.unshare", {
                file: e,
                channel: c
            }, function(g, h, f) {
                TS.files.onFileUnShare(g, h, f);
                if (d) {
                    d(e, TS.files.getFileById(e))
                }
            })
        },
        onFileUnShare: function(d, e, c) {
            if (!d) {
                return
            } else {
                if (TS.web) {
                    if (TS.boot_data.feature_new_team_sites) {
                        TS.files.fetchFileInfo(c.file, function(g, f) {
                            TS.files.upsertAndSignal(f)
                        })
                    } else {
                        window.location.reload()
                    }
                }
            }
        },
        fetchFileInfo: function(d, c) {
            TS.api.call("files.info", {
                file: d
            }, function(f, g, e) {
                TS.files.onFileFetch(f, g, e);
                if (c) {
                    c(d, TS.files.getFileById(d))
                }
            })
        },
        onFileFetch: function(d, f, c) {
            if (!d) {
                if (f.error == "file_deleted") {
                    var e = TS.files.getFileById(c.file);
                    if (e) {
                        TS.files.removeFile(e.id);
                        TS.activity.maybeUpdateTeamActivity()
                    } else {
                        if (c.file) {
                            TS.files.removeFile(c.file)
                        }
                    }
                } else {
                    if (f.error == "file_not_found") {
                        TS.files.removeFile(c.file)
                    }
                }
                return
            }
            if (f.file) {
                f.file.comments = f.comments;
                f.file.content = f.content;
                f.file.content_html = f.content_html;
                f.file.content_highlight_html = f.content_highlight_html;
                TS.files.upsertAndSignal(f.file)
            }
        },
        fetchTeamFiles: function(d) {
            var d = TS.model.file_list_types;
            var c = (d && d.length) ? d.join(",") : "";
            TS.api.call("files.list", {
                types: c
            }, TS.files.onTeamFetch)
        },
        onTeamFetch: function(f, g, c) {
            if (!f) {
                return
            }
            if (g.files) {
                var e;
                for (var d = 0; d < g.files.length; d++) {
                    e = g.files[d];
                    TS.files.upsertFile(e)
                }
            }
            TS.files.team_files_fetched_sig.dispatch(TS.model.files)
        },
        fetchMemberFiles: function(e, d) {
            var c = (d && d.length) ? d.join(",") : "";
            TS.api.call("files.list", {
                user: e,
                types: c
            }, TS.files.onMemberFetch)
        },
        onMemberFetch: function(f, g, c) {
            if (!f) {
                return
            }
            if (g.files) {
                var e;
                for (var d = 0; d < g.files.length; d++) {
                    e = g.files[d];
                    TS.files.upsertFile(e)
                }
            }
            TS.files.team_files_fetched_sig.dispatch(TS.model.files);
            var h = TS.members.getMemberById(c.user);
            TS.files.member_files_fetched_sig.dispatch(h)
        },
        addComment: function(e, d, c) {
            TS.api.callImmediately("files.comments.add", {
                file: e,
                comment: d
            }, function(g, h, f) {
                TS.files.onFileComment(g, h, f);
                if (c) {
                    c(g, h, f)
                }
            })
        },
        onFileComment: function(e, f, c) {
            if (!e) {
                return
            }
            var d = TS.files.getFileById(c.file);
            if (!d) {
                TS.error("no file? " + c.file);
                return
            }
            TS.files.addCommentToFile(f.comment, d)
        },
        getFileById: function(f) {
            var e = TS.model.files;
            var d;
            for (var c = 0; c < e.length; c++) {
                d = e[c];
                if (d.id == f) {
                    return d
                }
            }
            return null
        },
        getFileActions: function(c) {
            if (!c) {
                return
            }
            var d = {};
            var e = false;
            if (c.user == TS.model.user.id) {
                e = true
            }
            if (c.is_public) {
                d.share = true
            } else {
                if (e) {
                    d.share = true
                }
            }
            d.comment = true;
            if (!c.public_url_shared && c.mode != "external" && !TS.model.user.is_restricted) {
                if (c.is_public) {
                    d.create_public_link = true
                } else {
                    if (e) {
                        d.create_public_link = true
                    }
                }
            }
            if (c.public_url_shared && !TS.model.user.is_restricted && (TS.model.user.is_admin || e)) {
                d.revoke_public_link = true
            }
            if (c.mode == "hosted" || c.mode == "snippet") {
                d.download = true
            }
            if ((c.mimetype && c.mimetype.indexOf("image/") == 0) || c.mode == "external" || c.mode == "snippet") {
                d.open_original = true
            }
            if (TS.web) {
                if (c.mode == "post" || c.mode == "snippet") {
                    d.print = true
                }
            }
            if (e) {
                if (c.mode == "snippet" || c.mode == "post") {
                    d.edit = true
                }
                if (c.mode == "hosted") {
                    d.edit_title = true
                }
                d.delete_file = true
            }
            if (TS.model.user.is_admin) {
                d.delete_file = true
            }
            if (c.mode == "external") {
                if (e || TS.model.user.is_admin) {
                    d.refresh = true
                }
            }
            if (window.Dropbox && Dropbox.isBrowserSupported() && TS.model.prefs.dropbox_enabled) {
                if (c.mode == "hosted") {
                    d.save_to_dropbox = true
                }
            }
            return d
        },
        sortFiles: function(c) {
            function d(f, e) {
                if (f.timestamp < e.timestamp) {
                    return 1
                }
                if (f.timestamp > e.timestamp) {
                    return -1
                }
                return 0
            }
            c.sort(d)
        },
        getFileCommentById: function(d, e) {
            var f;
            for (var c = 0; c < d.comments.length; c++) {
                f = d.comments[c];
                if (f.id == e) {
                    return f
                }
            }
            return null
        },
        addCommentToFile: function(e, c) {
            var d = TS.files.getFileCommentById(c, e.id);
            if (d) {
                return d
            }
            c.comments.push(e);
            TS.files.sortCommentsOnFile(c);
            TS.files.team_file_comment_added_sig.dispatch(c, e);
            return e
        },
        editCommentOnFile: function(h, d) {
            var g;
            var f = false;
            var e = false;
            for (var c = 0; c < d.comments.length; c++) {
                g = d.comments[c];
                if (g.id == h.id) {
                    f = true;
                    d.comments[c] = h;
                    if (g.is_starred) {
                        h.is_starred = true
                    }
                    if (d.initial_comment && g.id == d.initial_comment.id) {
                        d.initial_comment = h;
                        e = true
                    }
                    break
                }
            }
            if (!f) {
                return
            }
            TS.files.makeSureReferencesGetSavedToLS(d.id);
            TS.files.sortCommentsOnFile(d);
            TS.files.team_file_comment_edited_sig.dispatch(d, h);
            if (e) {
                TS.files.team_file_changed_sig.dispatch(d)
            }
        },
        deleteCommentOnFile: function(f, e) {
            var h;
            var c = [];
            var g = false;
            for (var d = 0; d < e.comments.length; d++) {
                h = e.comments[d];
                if (h.id == f) {
                    if (e.initial_comment && h.id == e.initial_comment.id) {
                        e.initial_comment = null;
                        g = true
                    }
                    continue
                }
                c.push(h)
            }
            if (c.length == e.comments.length) {
                return
            }
            e.comments = c;
            TS.files.makeSureReferencesGetSavedToLS(e.id);
            TS.files.sortCommentsOnFile(e);
            TS.files.team_file_comment_deleted_sig.dispatch(e, f);
            if (g) {
                TS.files.team_file_changed_sig.dispatch(e)
            }
        },
        makeSureReferencesGetSavedToLS: function(g) {
            var d = function(l, k) {
                var m;
                for (var j = 0; j < l.length; j++) {
                    m = l[j];
                    if (m.file && m.file.id == k) {
                        return true
                    }
                }
                return false
            };
            var f;
            for (var e = 0; e < TS.model.channels.length; e++) {
                f = TS.model.channels[e];
                if (f && f.msgs && f.msgs.length) {
                    if (d(f.msgs, g)) {
                        TS.utility.msgs.maybeStoreMsgs(f.id, f.msgs)
                    }
                }
            }
            var h;
            for (var e = 0; e < TS.model.groups.length; e++) {
                h = TS.model.groups[e];
                if (h && h.msgs && h.msgs.length) {
                    if (d(h.msgs, g)) {
                        TS.utility.msgs.maybeStoreMsgs(h.id, h.msgs)
                    }
                }
            }
            var c;
            for (var e = 0; e < TS.model.ims.length; e++) {
                c = TS.model.ims[e];
                if (c && c.msgs && c.msgs.length) {
                    if (d(c.msgs, g)) {
                        TS.utility.msgs.maybeStoreMsgs(c.id, c.msgs)
                    }
                }
            }
        },
        sortCommentsOnFile: function(c) {
            function d(f, e) {
                if (f.timestamp > e.timestamp) {
                    return 1
                }
                if (f.timestamp < e.timestamp) {
                    return -1
                }
                return 0
            }
            c.comments.sort(d)
        },
        upsertFile: function(e) {
            var c = TS.model.files;
            var f = TS.files.getFileById(e.id);
            var h = "NOOP";
            var p = [];
            var s;
            var d;
            var n;
            if (f) {
                s = f.channels || [];
                d = f.ims || [];
                n = f.groups || [];
                for (var g in e) {
                    if (g == "channels") {
                        if (e.channels && f.channels.join("") != e.channels.join("")) {
                            if (e.channels && e.channels.length) {
                                s = s.concat(e.channels)
                            }
                            f.channels = e.channels;
                            h = "CHANGED";
                            p.push(g)
                        }
                    } else {
                        if (g == "ims") {
                            if (e.ims && f.ims.join("") != e.ims.join("")) {
                                if (e.ims && e.ims.length) {
                                    d = d.concat(e.ims)
                                }
                                f.ims = e.ims;
                                h = "CHANGED";
                                p.push(g)
                            }
                        } else {
                            if (g == "groups") {
                                if (e.groups && f.groups.join("") != e.groups.join("")) {
                                    if (e.groups && e.groups.length) {
                                        n = n.concat(e.groups)
                                    }
                                    f.groups = e.groups;
                                    h = "CHANGED";
                                    p.push(g)
                                }
                            } else {
                                if (g == "comments") {
                                    if (e.comments && JSON.stringify(f.comments) != JSON.stringify(e.comments)) {
                                        f.comments = e.comments;
                                        h = "CHANGED";
                                        p.push(g)
                                    }
                                } else {
                                    if (g == "content") {
                                        if (e.content && f.content != e.content) {
                                            f.content = e.content;
                                            h = "CHANGED";
                                            p.push(g)
                                        }
                                    } else {
                                        if (g == "initial_comment") {
                                            f[g] = e[g]
                                        } else {
                                            if (f[g] != e[g]) {
                                                if (e[g] && !TS.utility.isScalar(e[g])) {
                                                    f[g] = e[g];
                                                    TS.warn(g + " is not scalar! it needs to be handled by upsertFile specifically to test if it has changed! " + (typeof e[g]))
                                                } else {
                                                    if (typeof e[g] != "boolean" || !e[g] != !f[g]) {
                                                        p.push(g + " [" + f[g] + "] -> [" + e[g] + "]");
                                                        f[g] = e[g];
                                                        h = "CHANGED"
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
            } else {
                h = "ADDED";
                c.push(e);
                var m = TS.members.getMemberById(e.user);
                if (m) {
                    m.files.push(e);
                    TS.files.sortFiles(m.files);
                    m.has_files = true
                } else {
                    TS.error("hmmm, file " + e.id + " does not have a know user " + e.user)
                }
                a(e);
                f = e
            } if (h == "CHANGED") {
                var l = e.thumb_360_gif || e.thumb_360;
                if (l && !TS.model.inline_imgs[l]) {
                    a(e)
                }
            }
            if (!f.comments) {
                f.comments = []
            } else {
                f.comments_count = Math.max(f.comments_count, f.comments.length)
            } if (!f.channels) {
                f.channels = []
            }
            if (!f.ims) {
                f.ims = []
            }
            if (!f.groups) {
                f.groups = []
            }
            f.is_shared = !!(f.groups.length + f.channels.length);
            if (h != "NOOP") {
                if (s) {
                    s = s.filter(function(u, t, k) {
                        return k.indexOf(u) === t
                    });
                    var o;
                    for (var j = 0; j < s.length; j++) {
                        o = TS.channels.getChannelById(s[j]);
                        if (o && o.is_member && o.msgs && o.msgs.length) {
                            TS.utility.msgs.maybeStoreMsgs(o.id, o.msgs)
                        }
                    }
                }
                if (d) {
                    d = d.filter(function(u, t, k) {
                        return k.indexOf(u) === t
                    });
                    var q;
                    for (var j = 0; j < d.length; j++) {
                        q = TS.ims.getImById(d[j]);
                        if (q && q.msgs && q.msgs.length) {
                            TS.utility.msgs.maybeStoreMsgs(q.id, q.msgs)
                        }
                    }
                }
                if (n) {
                    n = n.filter(function(u, t, k) {
                        return k.indexOf(u) === t
                    });
                    var r;
                    for (var j = 0; j < n.length; j++) {
                        r = TS.groups.getGroupById(n[j]);
                        if (r && r.msgs && r.msgs.length) {
                            TS.utility.msgs.maybeStoreMsgs(r.id, r.msgs)
                        }
                    }
                }
                if (!d || !d.length) {
                    var q = TS.ims.getImByMemberId(TS.model.user.id);
                    if (q && q.msgs && q.msgs.length) {
                        TS.utility.msgs.maybeStoreMsgs(q.id, q.msgs)
                    }
                    if (f.user != TS.model.user.id) {
                        var q = TS.ims.getImByMemberId(f.user);
                        if (q && q.msgs && q.msgs.length) {
                            TS.utility.msgs.maybeStoreMsgs(q.id, q.msgs)
                        }
                    }
                }
            }
            TS.files.sortFiles(TS.model.files);
            return {
                status: h,
                file: f,
                what_changed: p
            }
        },
        upsertAndSignal: function(c) {
            var d = TS.files.upsertFile(c);
            if (d.status == "CHANGED") {
                TS.files.team_file_changed_sig.dispatch(d.file)
            } else {
                if (d.status == "ADDED") {
                    TS.files.team_file_added_sig.dispatch(d.file)
                }
            }
            return d
        },
        removeFile: function(g) {
            TS.log(4, 'removing file "' + g + '"');
            var e;
            var d = TS.files.getFileById(g);
            if (d) {
                d.is_deleted = true
            }
            var f = TS.model.channels;
            var h;
            for (e = 0; e < f.length; e++) {
                h = f[e];
                if (d) {
                    TS.utility.msgs.removeFileSharesAndMentions(h, d)
                }
                if (d) {
                    TS.utility.msgs.removeFileComments(h, d)
                }
                TS.utility.msgs.removeFileReferences(h, g)
            }
            var c = TS.model.groups;
            var k;
            for (e = 0; e < c.length; e++) {
                k = c[e];
                if (d) {
                    TS.utility.msgs.removeFileSharesAndMentions(k, d)
                }
                if (d) {
                    TS.utility.msgs.removeFileComments(k, d)
                }
                TS.utility.msgs.removeFileReferences(k, g)
            }
            var l = TS.model.ims;
            var j;
            for (e = 0; e < l.length; e++) {
                j = l[e];
                if (d) {
                    TS.utility.msgs.removeFileSharesAndMentions(j, d)
                }
                if (d) {
                    TS.utility.msgs.removeFileComments(j, d)
                }
                TS.utility.msgs.removeFileReferences(j, g)
            }
            if (d) {
                TS.files.team_file_deleted_sig.dispatch(d)
            }
        },
        upload: function(l, e, j, c, k, h, f, g, d) {
            if (TS.files.uploading) {
                TS.files.uploadQ.push(arguments)
            } else {
                TS.files.actuallyUpload(l, e, j, c, k, h, f, g, d)
            }
        },
        actuallyUpload: function(r, h, n, c, o, m, j, l, g) {
            TS.files.uploading = true;
            g = g || 0;
            var k = new FormData();
            var q;
            var e = !!h;
            if (r) {
                q = o || m;
                TS.files.file_uploading_sig.dispatch(q, g > 0, e);
                k.append("content", r);
                if (m) {
                    k.append("filetype", m)
                }
                if (c) {
                    TS.warn("ignoring filename because it makes no sense for text files")
                }
            } else {
                q = o || c || h.name || "blob";
                TS.files.file_uploading_sig.dispatch(q, g > 0, e);
                if (typeof h == "string") {
                    k.append("content64", h)
                } else {
                    k.append("file", h)
                } if (c) {
                    k.append("filename", c)
                }
                if (m) {
                    TS.warn("ignoring filetype we send a filename which can intuit it")
                }
            }
            k.append("token", TS.model.api_token);
            if (j && j.length) {
                var p = (typeof j == "string") ? j : (j.join) ? j.join(",") : "";
                k.append("channels", p)
            }
            k.append("title", o);
            if (l) {
                k.append("initial_comment", l)
            }
            var s = "files.uploadAsync";
            if (n) {
                s = "services.dropbox.upload";
                k.append("link", n)
            }
            TS.log(2, "calling " + TS.model.api_url + "files.upload");
            var d;
            if (s == "files.uploadAsync") {
                d = TS.model.async_api_url + s
            } else {
                d = TS.model.api_url + s
            }
            var f = false;
            b = $.ajax({
                url: d,
                data: k,
                dataType: "json",
                cache: false,
                contentType: false,
                processData: false,
                type: "POST",
                xhr: function() {
                    var t = jQuery.ajaxSettings.xhr();
                    if (t.upload) {
                        t.upload.addEventListener("progress", function(u) {
                            if (u.lengthComputable) {
                                var v = parseInt(100 * u.loaded / u.total, 10);
                                TS.files.file_progress_sig.dispatch(v)
                            } else {
                                TS.info("Upload length not computable")
                            }
                        }, false)
                    }
                    return t
                },
                error: function(t, v, u) {
                    f = true;
                    TS.info("Error: Failed to upload file.");
                    TS.info("textStatus:" + v + " errorThrown:" + u);
                    if (v === "abort") {
                        TS.files.file_canceled_sig.dispatch(q);
                        TS.files.uploadOver(false);
                        return
                    }
                    if (g == 0) {
                        TS.files.actuallyUpload(r, h, n, c, o, m, j, l, ++g)
                    } else {
                        TS.generic_dialog.start({
                            title: "Upload failed",
                            body: 'Failed to upload file: "' + v + (u ? " " + u : "") + '". Try again?',
                            go_button_text: "Yes, try again",
                            cancel_button_text: "No, cancel",
                            on_go: function() {
                                TS.files.actuallyUpload(r, h, n, c, o, m, j, l, ++g)
                            },
                            on_cancel: function() {
                                TS.files.uploadOver(false)
                            }
                        })
                    }
                },
                complete: function(u) {
                    if (f) {
                        return
                    }
                    var u = jQuery.parseJSON(u.responseText);
                    if (u && u.ok && u.file) {
                        if (s == "files.uploadAsync") {
                            var v = function(y, A, x) {
                                if (!TS.files.polling_file_id) {
                                    return
                                }
                                if (y) {
                                    if (A.status == "complete") {
                                        var z = TS.files.upsertAndSignal(A.file);
                                        TS.files.uploadProcessingOver(true, z.file.id)
                                    } else {
                                        if (A.status == "failed") {
                                            var w = "";
                                            if (A.debug && TS.model.team.domain == "tinyspeck") {
                                                w = "<br><br>TS only Debugging:<br><br>" + A.debug
                                            }
                                            TS.generic_dialog.start({
                                                title: "Upload failed",
                                                body: "Failed to process the uploaded file. Try again?" + w,
                                                go_button_text: "Yes, try again",
                                                cancel_button_text: "No, cancel",
                                                on_go: function() {
                                                    TS.files.actuallyUpload(r, h, n, c, o, m, j, l, ++g)
                                                },
                                                on_cancel: function() {
                                                    TS.files.uploadProcessingOver(false, TS.files.polling_file_id)
                                                }
                                            })
                                        } else {
                                            TS.files.pollForUploadProcessing()
                                        }
                                    }
                                } else {}
                            };
                            TS.files.startPollingForUploadProcessing(u.file, u.ticket, v)
                        } else {
                            var t = TS.files.upsertAndSignal(u.file);
                            TS.files.uploadOver(u.ok, t.file.id)
                        }
                    } else {
                        TS.info("Error: Failed to upload file.");
                        TS.info(u);
                        if (u) {
                            if (g == 0) {
                                TS.files.actuallyUpload(r, h, n, c, o, m, j, l, ++g)
                            } else {
                                TS.generic_dialog.start({
                                    title: "Upload failed",
                                    body: 'Failed to upload file: "' + (u.error || "unknown error") + '". Try again?',
                                    go_button_text: "Yes, try again",
                                    cancel_button_text: "No, cancel",
                                    on_go: function() {
                                        TS.files.actuallyUpload(r, h, n, c, o, m, j, l, ++g)
                                    },
                                    on_cancel: function() {
                                        TS.files.uploadOver(false)
                                    }
                                })
                            }
                        } else {
                            alert("Upload failed.");
                            TS.files.uploadOver(false)
                        }
                    }
                }
            })
        },
        startPollingForUploadProcessing: function(c, d, e) {
            TS.files.polling_count = 0;
            TS.files.polling_file_id = c;
            TS.files.polling_ticket = d;
            TS.files.polling_handler = e;
            TS.files.pollForUploadProcessing()
        },
        pollForUploadProcessing: function() {
            TS.files.polling_count++;
            TS.files.polling_tim = setTimeout(function() {
                if (!TS.files.polling_ticket) {
                    return
                }
                TS.api.callImmediately("files.uploadStatus", {
                    ticket: TS.files.polling_ticket
                }, function(d, e, c) {
                    if (!TS.files.polling_ticket) {
                        return
                    }
                    TS.files.polling_handler(d, e, c)
                })
            }, TS.files.polling_count * 1000)
        },
        uploadProcessingOver: function(c, d) {
            if (TS.files.polling_file_id != d) {
                return
            }
            TS.info("TS.files.uploadProcessingOver polling_file_id:" + TS.files.polling_file_id + " polling_ticket:" + TS.files.polling_ticket + " polling_count:" + TS.files.polling_count);
            TS.files.polling_count = 0;
            TS.files.polling_file_id = null;
            TS.files.polling_ticket = null;
            TS.files.polling_handler = null;
            clearTimeout(TS.files.polling_tim);
            TS.files.uploadOver(c, d)
        },
        uploadOver: function(c, d) {
            TS.files.file_uploaded_sig.dispatch(c, d);
            TS.files.uploading = false;
            b = null;
            if (TS.files.uploadQ.length) {
                TS.files.actuallyUpload.apply(null, TS.files.uploadQ.shift())
            } else {
                TS.files.file_queue_emptied_sig.dispatch()
            }
        },
        cancelCurrentUpload: function() {
            if (b) {
                b.abort()
            }
        },
        deleteFile: function(c) {
            TS.api.call("files.delete", {
                file: c
            }, TS.files.onFileDelete)
        },
        onFileDelete: function(d, e, c) {
            if (!d) {
                return
            }
        },
        endEditFileTitle: function() {
            $("#file_edit_title_container").addClass("hidden");
            $("#file_title_container").removeClass("hidden")
        },
        saveEditFileTitle: function(e) {
            var d = TS.files.getFileById(e);
            if (!d) {
                return
            }
            var f = $("#file_edit_title_input").val();
            if (!$.trim(f)) {
                TS.ui.playSound("beep");
                return
            }
            var c = d.title;
            if (c == f) {
                TS.files.endEditFileTitle();
                return
            }
            TS.api.callImmediately("files.edit", {
                file: e,
                title: f
            }, function(h, j, g) {
                if (!h) {
                    TS.files.upsertAndSignal({
                        id: e,
                        title: c
                    });
                    alert("save failed!")
                }
            });
            f = TS.utility.htmlEntities(f);
            TS.files.upsertAndSignal({
                id: e,
                title: f
            });
            TS.files.endEditFileTitle()
        },
        editFileTitle: function(d) {
            var c = TS.files.getFileById(d);
            if (!c) {
                return
            }
            var e = c.title;
            if (e) {
                e = TS.format.unFormatMsg(e)
            } else {
                e = c.name
            }
            $("#file_title_container").addClass("hidden");
            $("#file_edit_title_container").removeClass("hidden");
            $("#file_edit_title_input").val(e);
            $("#file_edit_title_input").select()
        },
        openDropboxChooser: function() {
            Dropbox.choose({
                success: TS.files.onDropboxChooser,
                linkType: "direct",
                multiselect: true
            })
        },
        onDropboxChooser: function(f) {
            TS.dir(2, f);
            var e = [];
            for (var c = 0; c < f.length; c++) {
                var g = f[c];
                e.push({
                    name: g.name,
                    size: g.bytes,
                    link: g.link,
                    icon: g.icon,
                    is_dropbox: true
                })
            }
            TS.ui.upload_dialog.startWithCommentFromChatInput(e)
        },
        makeFileNameFromFile: function(d) {
            var c = TS.utility.date.getTimeStamp() / 1000;
            return d.name || "Pasted image at " + TS.utility.date.toFilenameFriendlyDate(c) + ".png"
        },
        makeFileTitleFromFile: function(d) {
            var c = TS.utility.date.getTimeStamp() / 1000;
            return d.name || "Pasted image at " + TS.utility.date.toDate(c)
        },
        justUploadTheseFileNow: function(e) {
            var d;
            for (var c = 0; c < e.length; c++) {
                d = e[c];
                if (d.size > TS.model.upload_file_size_limit_bytes) {
                    continue
                }
                TS.files.upload(null, d, null, TS.files.makeFileNameFromFile(d), TS.files.makeFileTitleFromFile(d), null, [TS.shared.getActiveModelOb().id], "")
            }
        },
        refreshFile: function(c) {
            TS.files.startRefreshingFile(c);
            TS.api.call("files.refresh", {
                file: c
            }, TS.files.onFileRefresh)
        },
        onFileRefresh: function(d, f, c) {
            var g = c.file;
            if (d) {
                TS.menu.$menu.find("#refresh_file").find(".item_label").text("File refreshed!").end().find("i").removeClass("fa-spin")
            } else {
                if (!d) {
                    TS.files.doneRefreshingFile(g, '<span class="moscow_red">Refresh failed.</span>', 5000);
                    TS.menu.$menu.find("#refresh_file").find(".item_label").text("Refresh failed").end().find("i").removeClass("fa-spin")
                }
            } if (d & !f.will_refresh) {
                TS.files.doneRefreshingFile(g, '<span class="moscow_red">File refreshed < 1 minute ago.</span>', 5000)
            }
            if (TS.web && d) {
                TS.menu.$menu.find("#refresh_file").find(".item_label").text("Reloading...");
                location.reload()
            }
            if (!d) {
                if (f.error == "file_deleted") {
                    var e = TS.files.getFileById(g);
                    if (e) {
                        TS.files.removeFile(e.id);
                        TS.activity.maybeUpdateTeamActivity()
                    }
                }
                return
            }
        },
        fileWasMaybeRefreshed: function(c) {
            if (!c) {
                return
            }
            if (!TS.files.waiting_for_refresh[c.id]) {
                return
            }
            TS.files.doneRefreshingFile(c.id, '<span class="kelly_green">File refreshed!</span>', 60000)
        },
        startRefreshingFile: function(c) {
            TS.files.waiting_for_refresh[c] = true;
            $('.file_refresh[data-file-id="' + c + '"]').addClass("hidden");
            $('.file_refresh_status[data-file-id="' + c + '"]').removeClass("hidden")
        },
        doneRefreshingFile: function(e, d, c) {
            delete TS.files.waiting_for_refresh[e];
            $('.file_refresh_status[data-file-id="' + e + '"]').html(d);
            setTimeout(function() {
                $('.file_refresh[data-file-id="' + e + '"]').removeClass("hidden");
                $('.file_refresh_status[data-file-id="' + e + '"]').text("Refreshing file...").addClass("hidden")
            }, c)
        }
    });
    var b = null;
    var a = function(d) {
        var c = d.thumb_360_gif || d.thumb_360;
        if (c && TS.model.inline_img_exclude_filetypes.indexOf(d.filetype) == -1) {
            TS.inline_imgs.makeInternalInlineImg(c, {
                width: d.thumb_360_w,
                height: d.thumb_360_h,
                link_url: d.url_private,
                internal_file_id: d.id
            })
        }
    }
})();
TS.registerModule("activity", {
    team_activity_has_new_sig: new signals.Signal(),
    team_activity_being_fetched_sig: new signals.Signal(),
    team_activity_fetched_sig: new signals.Signal(),
    team_activity_reset_sig: new signals.Signal(),
    individual_activity_fetched_sig: new signals.Signal(),
    user_recent_fetched_sig: new signals.Signal(),
    team_has_more: false,
    team_fetching: false,
    onStart: function() {},
    fetchIndividualActivity: function(c, b) {
        if (TS.model.user.is_restricted) {
            return
        }
        var a = {
            start_ts: "",
            user: c.id
        };
        if (!b && c.individual_activity_next_ts) {
            a.start_ts = c.individual_activity_next_ts
        }
        c.individual_activity_fetching = true;
        TS.api.call("activity.individual", a, TS.activity.onIndividualActivityFetch)
    },
    onIndividualActivityFetch: function(b, c, a) {
        var d = TS.members.getMemberById(a.user);
        if (!d) {
            TS.error("no member? user:" + a.user);
            return
        }
        d.individual_activity_fetching = false;
        if (!b) {
            TS.error("failed fetchIndividualActivity");
            return
        }
        if (a.start_ts) {
            d.activity = d.activity.concat(TS.activity.slurpItems(c.items, d))
        } else {
            d.activity = TS.activity.slurpItems(c.items, d)
        }
        d.individual_activity_next_ts = c.next_ts;
        TS.activity.individual_activity_fetched_sig.dispatch(d)
    },
    fetchUserLatest: function() {},
    fetchUserRecent: function(b) {
        var a = {
            period: b + "h"
        };
        TS.api.call("activity.recent", a, TS.activity.onFetchUserRecent)
    },
    onFetchUserRecent: function(b, c, a) {
        TS.activity.team_fetching = false;
        if (!b) {
            TS.error("failed fetchUserRecent");
            return
        }
        TS.info("onTeamActivityFetch");
        TS.dir(0, c);
        TS.model.user.activity_recent = TS.activity.slurpItems(c.items);
        TS.activity.user_recent_fetched_sig.dispatch(TS.model.user.activity_recent)
    },
    fetchTeamActivity: function() {
        var a = {
            start: "",
            days: 10
        };
        if (TS.model.team.activity.length) {
            a.start = TS.utility.date.getPrevActivityDayStamp(TS.model.team.activity[TS.model.team.activity.length - 1].date)
        }
        TS.activity.team_fetching = true;
        TS.activity.team_activity_being_fetched_sig.dispatch(true);
        TS.api.call("activity.team", a, TS.activity.onTeamActivityFetch)
    },
    tested_day_rollover: false,
    onTeamActivityFetch: function(b, c, a) {
        TS.activity.team_fetching = false;
        if (!b) {
            TS.activity.team_activity_being_fetched_sig.dispatch(false);
            TS.error("failed fetchTeamActivity");
            return
        }
        if (!TS.activity.tested_day_rollover) {
            TS.activity.tested_day_rollover = true
        }
        TS.model.team.activity = TS.model.team.activity.concat(TS.activity.slurpDayItems(c.days));
        TS.activity.team_has_more = c.has_more;
        TS.activity.team_activity_fetched_sig.dispatch(TS.model.team.activity);
        TS.activity.makeSureWehaveEnoughTeamActivity()
    },
    makeSureWehaveEnoughTeamActivity: function() {
        if (!TS.activity.team_has_more) {
            return
        }
        var b = 30;
        var c = 0;
        var d = TS.model.team.activity;
        for (var a = 0; a < d.length; a++) {
            if (d[a] && d[a].items) {
                c += d[a].items.length
            }
        }
        if (c < b) {
            TS.activity.fetchTeamActivity()
        }
    },
    makeSigFromActivityItem: function(b, d) {
        d = d || 0;
        var c = [];
        for (var a in b) {
            if (a == "permalink") {
                continue
            }
            if (!TS.utility.isScalar(b[a]) && d < 3) {
                if (a == "user") {
                    c.push(a + "(" + d + ")====" + b[a].id)
                } else {
                    c.push(a + "(" + d + ")=" + TS.activity.makeSigFromActivityItem(b[a], d + 1))
                }
            } else {
                c.push(a + "(" + d + ")=" + b[a])
            }
        }
        c.sort();
        return c.join("***")
    },
    current_activity_sig: "",
    current_activity_day_0_count: 0,
    maybeUpdateTeamActivity: function() {
        if (TS.boot_data.app != "client") {
            return
        }
        if (!TS.model.team) {
            return
        }
        if (TS.activity.team_activity_being_fetched) {
            TS.activity.team_activity_needs_fetched = true;
            return
        }
        if (TS.model.team && TS.model.team.activity && TS.model.team.activity.length) {
            var a = TS.model.team.activity[0];
            TS.activity.current_activity_day_0_count = a.items.length;
            if (a.items && a.items.length) {
                TS.activity.current_activity_sig = TS.activity.makeSigFromActivityItem(a.items)
            }
        }
        if (TS.model.previewed_member_id) {
            var b = TS.members.getMemberById(TS.model.previewed_member_id);
            TS.activity.fetchIndividualActivity(b, true)
        }
        TS.activity.updateTeamActivity()
    },
    team_activity_being_fetched: false,
    team_activity_needs_fetched: false,
    updateTeamActivity: function() {
        TS.activity.team_activity_being_fetched = true;
        TS.activity.team_activity_needs_fetched = false;
        TS.activity.team_activity_being_fetched_sig.dispatch(true);
        var a = true;
        TS.api.call("activity.team", {
            days: 1
        }, TS.activity.onTeamActivityUpdate, a)
    },
    onTeamActivityUpdate: function(d, e, c) {
        TS.activity.team_activity_being_fetched = false;
        if (TS.activity.team_activity_needs_fetched) {
            setTimeout(TS.activity.maybeUpdateTeamActivity, 100)
        }
        if (!d) {
            TS.activity.team_activity_being_fetched_sig.dispatch(false);
            TS.error("failed updateTeamActivity");
            return
        }
        if (!e.days.length) {
            return
        }
        var b = TS.activity.slurpDayItems(e.days)[0];
        if (TS.model.team.activity.length && TS.model.team.activity[0].date == b.date) {
            TS.info("days matched: " + b.date);
            TS.model.team.activity[0] = b;
            var a = (TS.model.team.activity && TS.model.team.activity[0] && TS.model.team.activity[0].items) ? TS.model.team.activity[0].items.length : 0;
            var g = (TS.model.team.activity && TS.model.team.activity[0] && TS.model.team.activity[0].items) ? TS.activity.makeSigFromActivityItem(TS.model.team.activity[0].items) : "";
            var f = true;
            if (a > TS.activity.current_activity_count) {
                f = false
            } else {
                if (g != TS.activity.current_activity_sig) {
                    f = false
                }
            } if (f) {
                TS.warn("no activity change")
            } else {
                TS.model.team_activity_has_new = true;
                TS.activity.team_activity_has_new_sig.dispatch(true)
            }
            TS.activity.current_activity_sig = g;
            TS.activity.current_activity_count = a;
            TS.activity.team_activity_fetched_sig.dispatch(TS.model.team.activity, f)
        } else {
            TS.info("days NOT matched: " + b.date);
            TS.activity.team_activity_reset_sig.dispatch();
            TS.model.team.activity.length = 0;
            TS.activity.fetchTeamActivity()
        }
    },
    activityRead: function() {
        TS.model.team_activity_has_new = false;
        TS.activity.team_activity_has_new_sig.dispatch(false)
    },
    expandIndividual: function(a) {
        var b = TS.members.getMemberById(a);
        if (!b) {
            TS.error("no member? member_id:" + a);
            return
        }
        if (b.individual_activity_fetching) {
            return
        }
        TS.activity.fetchIndividualActivity(b)
    },
    expandTeam: function() {
        if (TS.activity.team_fetching) {
            return
        }
        TS.activity.fetchTeamActivity()
    },
    slurpDayItems: function(b) {
        for (var a = 0; a < b.length; a++) {
            b[a].items = TS.activity.slurpItems(b[a].items)
        }
        return b
    },
    slurpStarItem: function(a, c) {
        var b;
        if (a.type == "message") {
            a.message.is_starred = true;
            if (a.message.type == "channel_topic" || a.message.type == "channel_purpose" || a.message.type == "channel_join" || a.message.type == "channel_leave") {
                a.message.subtype = a.message.type
            }
            a.message.type = "message"
        } else {
            if (a.type == "file" || a.type == "file_comment") {
                if (a.file) {
                    b = TS.files.upsertAndSignal(a.file);
                    a.file = b.file;
                    if (a.type == "file_comment") {
                        if (a.comment) {
                            a.comment = TS.files.addCommentToFile(a.comment, a.file)
                        } else {
                            TS.error("WTF no comment in type " + a.type + " in " + c);
                            return false
                        }
                    }
                } else {
                    TS.error("WTF no file in type " + a.type + " in " + c);
                    return false
                }
            } else {
                if (a.type == "channel") {} else {
                    if (a.type == "group") {} else {
                        if (a.type == "im") {} else {
                            TS.error("need to handle star item type:" + a.type + " in " + c);
                            return false
                        }
                    }
                }
            }
        }
        return true
    },
    sortStars: function(a) {
        a.sort(function b(d, c) {
            if (d.user == TS.model.user.id) {
                return -1
            }
            return 1
        })
    },
    slurpItems: function(b, h) {
        var g = [];
        var e;
        for (var c = 0; c < b.length; c++) {
            e = TS.utility.clone(b[c]);
            if (e.type == "messages") {
                if (TS.client) {
                    continue
                }
                e.channels_total = 0;
                e.channels_with_messages = 0;
                e.dms_total = 0;
                e.groups_total = 0;
                if (e.channels) {
                    var d;
                    for (var a = 0; a < e.channels.length; a++) {
                        d = TS.channels.getChannelById(e.channels[a].id);
                        if (d.is_member) {
                            e.channels[a].channel = d;
                            if (!e.channels[a].channel) {
                                TS.error('activity item of type "' + e.type + '" specifies a channel that we know nothing about:' + e.channels[a].id)
                            }
                            e.channels_total += parseInt(e.channels[a].count) || 0;
                            e.channels_with_messages++
                        }
                    }
                }
                if (e.groups) {
                    for (var a = 0; a < e.groups.length; a++) {
                        e.groups[a].group = TS.groups.getGroupById(e.groups[a].id);
                        e.groups_total += parseInt(e.groups[a].count) || 0
                    }
                }
                if (e.dms) {
                    for (var a = 0; a < e.dms.length; a++) {
                        e.dms[a].im = TS.ims.getImById(e.dms[a].id);
                        e.dms_total += parseInt(e.dms[a].count) || 0
                    }
                }
                var f = function(k, j) {
                    return (parseInt(k.count) < parseInt(j.count)) ? 1 : ((parseInt(j.count) < parseInt(k.count)) ? -1 : 0)
                };
                e.channels.sort(f);
                e.groups.sort(f);
                e.dms.sort(f)
            } else {
                if (e.type == "user_files") {
                    if (e.files) {
                        for (var a = 0; a < e.files.length; a++) {
                            e.files[a] = TS.files.upsertFile(e.files[a]).file
                        }
                    } else {
                        TS.error("WTF no files in activity item " + e.type);
                        continue
                    }
                } else {
                    if (e.type == "team_files") {} else {
                        if (e.type == "file_comments") {
                            if (e.file) {
                                e.file = TS.files.upsertFile(e.file).file
                            } else {
                                TS.error("WTF no file in activity item " + e.type);
                                continue
                            }
                        } else {
                            if (e.type == "file_stars") {
                                TS.activity.sortStars(e.stars);
                                if (e.file) {
                                    e.file = TS.files.upsertFile(e.file).file
                                } else {
                                    TS.error("WTF no file in activity item " + e.type);
                                    continue
                                }
                            } else {
                                if (e.type == "file_comment_stars") {
                                    TS.activity.sortStars(e.stars);
                                    if (e.file) {
                                        e.file = TS.files.upsertFile(e.file).file;
                                        e.comment = TS.files.addCommentToFile(e.comment, e.file)
                                    } else {
                                        TS.error("WTF no file in activity item " + e.type);
                                        continue
                                    }
                                } else {
                                    if (e.type == "message_stars") {
                                        TS.activity.sortStars(e.stars);
                                        for (var a = 0; a < e.stars.length; a++) {
                                            if (TS.model.user.id == e.stars[a].user) {
                                                e.message.is_starred = true;
                                                break
                                            }
                                        }
                                    } else {
                                        if (e.type == "starred_by_you") {
                                            if (!TS.activity.slurpStarItem(e.item, e.type)) {
                                                continue
                                            }
                                            e.user = TS.model.user
                                        } else {
                                            if (e.type == "user_star") {
                                                if (!TS.activity.slurpStarItem(e.item, e.type)) {
                                                    continue
                                                }
                                                if (h) {
                                                    e.user = h
                                                }
                                            } else {
                                                if (e.type == "new_channels") {
                                                    if (e.channels) {
                                                        for (var a = 0; a < e.channels.length; a++) {
                                                            e.channels[a] = TS.channels.getChannelById(e.channels[a])
                                                        }
                                                    }
                                                } else {
                                                    if (e.type == "new_members") {} else {
                                                        if (e.type == "unread_group_messages") {
                                                            e.group = TS.groups.getGroupById(e.id)
                                                        } else {
                                                            if (e.type == "unread_messages") {
                                                                e.channel = TS.channels.getChannelById(e.id)
                                                            } else {
                                                                if (e.type == "unread_dms") {
                                                                    e.im = TS.ims.getImById(e.id)
                                                                } else {
                                                                    if (e.type == "sent_group_messages") {
                                                                        e.group = TS.groups.getGroupById(e.id)
                                                                    } else {
                                                                        if (e.type == "sent_messages") {
                                                                            e.channel = TS.channels.getChannelById(e.id)
                                                                        } else {
                                                                            if (e.type == "sent_dms") {
                                                                                e.im = TS.ims.getImById(e.id)
                                                                            } else {
                                                                                if (e.type == "user_file") {
                                                                                    e.file = TS.files.upsertFile(e.file).file;
                                                                                    if (h) {
                                                                                        e.user = h
                                                                                    }
                                                                                } else {
                                                                                    if (e.type == "user_file_comment") {
                                                                                        e.file = TS.files.upsertFile(e.file).file;
                                                                                        e.comment = TS.files.addCommentToFile(e.comment, e.file);
                                                                                        if (h) {
                                                                                            e.user = h
                                                                                        }
                                                                                    } else {
                                                                                        if (e.type == "user_rename") {
                                                                                            var h = TS.members.getMemberById(e.user);
                                                                                            if (h) {
                                                                                                e.user = h
                                                                                            }
                                                                                        } else {
                                                                                            TS.error("unknown activity item type:" + e.type);
                                                                                            continue
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
                }
            }
            g.push(e)
        }
        return g
    }
});
TS.registerModule("activity.view", {
    list_state: "activity",
    onStart: function() {
        TS.activity.team_activity_fetched_sig.add(TS.activity.view.teamActivityFetched, TS.activity.view);
        TS.activity.team_activity_fetched_sig.add(TS.activity.view.bindTeamActivityLoadButton, TS.activity.view);
        TS.activity.team_activity_reset_sig.add(TS.activity.view.teamActivityReset, TS.activity.view);
        TS.activity.user_recent_fetched_sig.add(TS.activity.view.teamUserRecentFetched, TS.activity.view);
        TS.activity.team_activity_has_new_sig.add(TS.activity.view.teamActivityHasNew, TS.activity.view);
        $("#activity_recent_hours_select").change(function() {
            TS.activity.fetchUserRecent(this.value)
        });
        $("#activity_recent_toggle, #activity_recent_close").bind("click", function() {
            $("#activity_recent").animate({
                height: "toggle",
                opacity: "toggle"
            }, 150)
        });
        TS.activity.view.bindTeamActivityLoadButton()
    },
    expanded_activity_messages_lists: {},
    isActivityMessagesListExpanded: function(a) {
        return !!TS.activity.view.expanded_activity_messages_lists[TS.templates.makeActivityMessagesDomId(a)]
    },
    expandActivityMessagesList: function(c) {
        TS.activity.view.expanded_activity_messages_lists[c] = true;
        var b = $("#" + c);
        var a = b.find(".show_link");
        var e = b.find(".hide_link");
        var f = b.find(".activity_messages_list");
        a.addClass("hidden");
        e.removeClass("hidden");
        f.removeClass("hidden");
        f.css("opacity", 0);
        var d = f.height();
        if (d > $(window).height() - 100) {
            b.scrollintoview({
                duration: 400,
                px_offset: 50,
                complete: function() {}
            })
        } else {
            b.scrollintoview({
                duration: 400,
                offset: "bottom",
                px_offset: -50,
                complete: function() {}
            })
        }
        f.height(0);
        f.animate({
            height: d
        }, 150, function() {
            f.stop().animate({
                opacity: 1
            }, 100);
            f.css("height", "")
        })
    },
    collapseActivityMessagesList: function(c) {
        delete TS.activity.view.expanded_activity_messages_lists[c];
        var b = $("#" + c);
        var a = b.find(".show_link");
        var d = b.find(".hide_link");
        var e = b.find(".activity_messages_list");
        a.removeClass("hidden");
        d.addClass("hidden");
        e.animate({
            opacity: 0
        }, 200).animate({
            height: 0
        }, 200, function() {
            e.addClass("hidden");
            e.css("height", "")
        })
    },
    markMsgsRead: function(e, d) {
        var b = TS.shared.getModelObById(e);
        if (!b) {
            TS.error("wtf no model_ob? c_id:" + e);
            return
        }
        var h;
        var c = $("#" + d);
        var g = c.find(".mark_read_link");
        if (b.is_channel) {
            h = "channels.mark"
        } else {
            if (b.is_group) {
                h = "groups.mark"
            } else {
                h = "im.mark"
            }
        }
        var f = c.data("last_read_ts");
        var a = c.data("showing_all_msgs");
        if (!f) {
            if (a) {
                alert("Error! no last_read_ts");
                return
            }
            f = TS.utility.date.makeTsStamp(TS.session_ms, "0", "0")
        }
        if (!a) {
            if (!confirm("You have not read all messages yet... are you sure you want to mark all read?")) {
                return
            }
        }
        g.addClass("hidden");
        TS.api.call(h, {
            channel: b.id,
            ts: f,
            dom_id: d
        }, TS.activity.view.onMarkMsgsRead)
    },
    onMarkMsgsRead: function(e, f, c) {
        var d = c.channel;
        var b = $("#" + c.dom_id);
        var g = b.find(".mark_read_link");
        var a = b.find(".open_channel_link");
        if (!e) {
            g.removeClass("hidden");
            a.removeClass("hidden");
            alert("error!");
            return
        }
        b.animate({
            opacity: 0
        }, 150).animate({
            height: 0
        }, 150, function() {
            if (b.parent().find(".activity_item").length == 1) {
                b.parent().remove()
            }
            b.remove()
        })
    },
    unexpandMsgs: function(c) {
        var e = $("#" + c);
        var j = e.find(".show_link");
        var d = e.find(".hide_link");
        var b = e.find(".mark_read_link");
        var g = e.find(".open_channel_link");
        var h = e.find(".expanded_msgs_div_wrapper");
        var f = e.find(".expanded_msgs_div");
        var a = e.find(".expanded_msgs_footer_div");
        j.removeClass("hidden");
        d.addClass("hidden");
        b.addClass("hidden");
        g.addClass("hidden");
        a.addClass("hidden");
        f.css("max-height", "");
        f.animate({
            opacity: 0
        }, 200).animate({
            height: 0
        }, 200, function() {
            f.addClass("hidden");
            f.css("height", "");
            f.css("opacity", "100");
            h.addClass("hidden")
        })
    },
    expandMsgs: function(d, e, c) {
        var b = {
            channel: d,
            oldest: e,
            count: 1000,
            dom_id: c
        };
        var a = $("#" + c);
        a.find(".expanded_msgs_div").html('<span class="loading">loading...<span>');
        a.find(".expanded_msgs_div_wrapper").removeClass("hidden");
        a.find(".show_link").addClass("hidden");
        a.find(".hide_link").removeClass("hidden");
        a.find(".expanded_msgs_div").removeClass("hidden");
        var f;
        if (d.charAt(0) === "C") {
            f = "channels.history"
        } else {
            if (d.charAt(0) === "G") {
                f = "groups.history"
            } else {
                f = "im.history"
            }
        }
        TS.api.call(f, b, TS.activity.view.onExpandMsgs)
    },
    onExpandMsgs: function(o, z, e) {
        var w = e.channel;
        var s = TS.shared.getModelObById(w);
        var b = $("#" + e.dom_id);
        var k = b.find(".expanded_msgs_div_wrapper");
        var y = b.find(".expanded_msgs_div");
        var f = b.find(".expanded_msgs_footer_div");
        var v = b.find(".show_link");
        var g = b.find(".mark_read_link");
        var r = b.find(".open_channel_link");
        var a = b.find(".more_messages_notice");
        if (!s) {
            TS.error("wtf no channel/im/group c_id:" + w);
            y.html("Error fetching unread messages! (no model_ob)");
            v.removeClass("hidden");
            return
        }
        if (!o || !z || !z.messages) {
            TS.error("failed to get history");
            y.html("Error fetching unread messages!");
            v.removeClass("hidden");
            return
        }
        var m = 999999999;
        var A = 10;
        var l = !z.has_more;
        var n = "";
        var j;
        var d;
        var u = 0;
        for (var t = z.messages.length - 1; t > -1; t--) {
            u++;
            d = j;
            j = TS.utility.msgs.processImsg(z.messages[t]);
            n += TS.templates.builders.buildMsgHTML({
                msg: j,
                model_ob: s,
                prev_msg: d,
                container_id: e.dom_id
            });
            if (u == z.messages.length && !z.has_more) {
                b.data("last_read_ts", j.ts)
            }
            if (u == m) {
                if (z.messages.length > m + A) {
                    l = false;
                    break
                }
            }
        }
        b.data("showing_all_msgs", l);
        y.css("opacity", 0);
        var p = y.height();
        y.html(n || "error retrieving messages.");
        var x = y.height();
        var h = $(window).height() * 0.85;
        if (x > h) {
            x = h - 50;
            y.css("max-height", x);
            if (TS.qs_args.new_scroll != "0" && !("ontouchstart" in document.documentElement)) {
                var q = TS.qs_args.debug_scroll == "1";
                y.monkeyScroll({
                    debug: q
                })
            }
        }
        if (x > $(window).height() - 100) {
            b.scrollintoview({
                duration: 250,
                px_offset: 50,
                complete: function() {}
            })
        } else {
            b.scrollintoview({
                duration: 250,
                offset: "bottom",
                px_offset: 10,
                complete: function() {}
            })
        }
        y.height(p);
        y.animate({
            height: x
        }, 150, function() {
            y.stop().animate({
                opacity: 1
            }, 100);
            y.css("height", "");
            if (!l) {
                f.removeClass("hidden");
                a.removeClass("hidden")
            }
            y.css("overflow", "");
            if (z.messages.length) {
                g.removeClass("hidden")
            }
            r.removeClass("hidden")
        });
        if (TS.boot_data.app != "client") {
            y.bind("click.view", TS.web.onMsgsDivClick)
        }
    },
    teamActivityReset: function() {
        var a = (TS.boot_data.app != "client") ? $("#activity_team_days_items") : $("#activity_feed_items");
        a.html("");
        $("#activity_feed_scroller").data("monkeyScroll").updateFunc()
    },
    bindTeamActivityLoadButton: function() {
        var a = $("#activity_team_load_more");
        if (a.length > 0) {
            if (a.data("ladda") == undefined) {
                a.data("ladda", Ladda.create(document.querySelector("#activity_team_load_more")));
                a.bind("click.fetchMoreActivity", function(b) {
                    TS.activity.expandTeam();
                    $(this).data("ladda").start()
                })
            } else {
                $("#activity_team_load_more").data("ladda").stop()
            }
        }
    },
    teamActivityFetched: function(h, f) {
        if (f) {
            return
        }
        var g = (TS.boot_data.app != "client") ? $("#activity_team_days_items") : $("#activity_feed_items");
        var e = g.find(".activity_day");
        var d;
        var a;
        if (e.length) {
            if (h) {
                for (var c = 0; c < h.length; c++) {
                    a = h[c].date;
                    d = g.find("#" + TS.templates.makeActivityDayDomId(a));
                    if (d.length) {
                        if (d.index() === 0) {
                            d.replaceWith(TS.templates.activity_day({
                                content: TS.templates.builders.activityListHTML(h[c].items, "team", a),
                                date_str: a
                            }))
                        } else {
                            d.find(".activity_day_date .day_divider_label").html(TS.utility.date.toCalendarDateOrNamedDay(a))
                        }
                    } else {
                        var b = TS.templates.activity_day({
                            content: TS.templates.builders.activityListHTML(h[c].items, "team", a),
                            date_str: a
                        });
                        if (c == 0) {
                            g.find(".activity_days_list").prepend(b)
                        } else {
                            g.find(".activity_days_list").append(b)
                        }
                    }
                }
            }
        } else {
            g.empty()[0].innerHTML = TS.templates.builders.activityDaysListHTML(h);
            TS.view.resizeManually("teamActivityFetched")
        } if (TS.client) {
            TS.view.makeSureAllLinksHaveTargets(g)
        }
        if (TS.activity.team_has_more) {
            $("#day_list_expander").removeClass("hidden")
        } else {
            $("#day_list_expander").addClass("hidden")
        } if (TS.activity.team_has_more) {
            $("#activity_feed_block").addClass("hidden")
        } else {
            $("#activity_feed_block").removeClass("hidden")
        } if (!TS.web) {
            TS.ui.updateClosestMonkeyScroller(g)
        }
    },
    new_activity_tim: 0,
    teamActivityHasNew: function(a) {
        clearTimeout(TS.activity.view.new_activity_tim);
        if (a) {
            if (TS.ui.active_tab_id == "activity" && !$("#activity_tab_activity").hasClass("hidden")) {
                TS.activity.view.new_activity_tim = setTimeout(function() {
                    if (TS.ui.active_tab_id == "activity" && !$("#activity_tab_activity").hasClass("hidden")) {
                        TS.activity.activityRead()
                    }
                }, 3000)
            }
        }
    },
    teamUserRecentFetched: function(b) {
        if (TS.boot_data.app != "client") {
            if (b.length) {
                $("#activity_recent_items").html(TS.templates.builders.activityListHTML(b, "recent"));
                var a = $("#activity_recent_items").closest(".flex_content_scroller").data("monkeyScroll");
                if (a) {
                    a.updateFunc()
                }
            } else {
                $("#activity_recent_items").html("<p class='mini'>No activity to show for this period.</p>")
            }
        }
    },
    renderActivity: function() {
        if (TS.boot_data.app == "client") {
            return
        }
        if (TS.model.user.activity_latest.length) {
            $("#activity_latest_items").removeClass("hidden").html(TS.templates.builders.activityListHTML(TS.model.user.activity_latest, "latest"))
        } else {
            $("#activity_latest_items").remove();
            $("#activity_team_days_items").addClass("top")
        }
        TS.activity.view.teamUserRecentFetched(TS.model.user.activity_recent);
        if (TS.model.team.activity.length) {
            $("#activity_team_days_items").html(TS.templates.builders.activityDaysListHTML(TS.model.team.activity))
        } else {
            $("#activity_team_days_items").html("<p class='mini'>No team activity to show.</p>")
        }
        $("#activity_div").bind("click", function(a) {
            TS.stars.checkForStarClick(a)
        })
    }
});
(function() {
    TS.registerModule("ims", {
        switched_sig: new signals.Signal(),
        history_fetched_sig: new signals.Signal(),
        history_being_fetched_sig: new signals.Signal(),
        message_received_sig: new signals.Signal(),
        message_removed_sig: new signals.Signal(),
        message_changed_sig: new signals.Signal(),
        marked_sig: new signals.Signal(),
        closed_sig: new signals.Signal(),
        unread_changed_sig: new signals.Signal(),
        unread_highlight_changed_sig: new signals.Signal(),
        opened_sig: new signals.Signal(),
        msg_not_sent_sig: new signals.Signal(),
        data_retention_changed_sig: new signals.Signal(),
        onStart: function() {},
        addMsg: function(h, g) {
            var d = TS.ims.getImById(h);
            if (!d) {
                TS.error('unknown im "' + h + '"');
                return
            }
            var e = d.msgs;
            if (!TS.utility.msgs.validateMsg(h, g, e)) {
                return
            }
            TS.utility.msgs.appendMsg(e, g);
            TS.utility.msgs.maybeStoreMsgs(d.id, e);
            TS.utility.msgs.maybeSetOldestMsgsTsAfterMsgAdded(d);
            var f = !TS.utility.msgs.isTempMsg(g);
            TS.ims.calcUnreadCnts(d, f);
            TS.utility.msgs.maybeTruncateMsgs(d);
            TS.ims.message_received_sig.dispatch(d, g);
            if (!d.is_open) {
                TS.api.call("im.open", {
                    user: d.user
                }, TS.ims.onOpened)
            }
        },
        calcUnreadCnts: function(d, e) {
            TS.shared.calcUnreadCnts(d, TS.ims, e)
        },
        removeMsg: function(g, f) {
            var d = TS.ims.getImById(g);
            if (!d) {
                TS.error('unknown im "' + g + '"');
                return
            }
            var e = d.msgs;
            TS.utility.msgs.spliceMsg(e, f);
            TS.ims.message_removed_sig.dispatch(d, f);
            TS.utility.msgs.maybeStoreMsgs(d.id, e);
            TS.ims.calcUnreadCnts(d, true)
        },
        changeMsgText: function(g, f, d) {
            var e = TS.ims.getImById(g);
            if (!e) {
                TS.error('unknown im "' + g + '"');
                return
            }
            f.text = d;
            TS.ims.message_changed_sig.dispatch(e, f);
            TS.utility.msgs.maybeStoreMsgs(e.id, e.msgs)
        },
        sendMsg: function(e, d) {
            return TS.shared.sendMsg(e, d, TS.ims)
        },
        onSendMsg: function(f, e) {
            var d = TS.ims.getImById(e.SENT_MSG.channel);
            if (!d) {
                TS.error("unknown im? " + e.SENT_MSG.channel);
                return
            }
            TS.shared.onSendMsg(f, e, d, TS.ims)
        },
        closeImByMemberId: function(e) {
            var d = TS.ims.getImByMemberId(e);
            if (!d) {
                return
            }
            TS.ims.closeIm(d.id)
        },
        closeIm: function(e) {
            var d = TS.ims.getImById(e);
            if (!d) {
                return
            }
            if (false && d.is_slackbot_im) {
                TS.error("can't leave self channel");
                return
            }
            TS.api.call("im.close", {
                channel: e
            }, TS.ims.onClosed)
        },
        onClosed: function(f, g, e) {
            if (!f) {
                return
            }
            if (g.no_op) {
                var d = TS.ims.getImById(e.channel);
                if (d) {
                    TS.ims.closed_sig.dispatch(d)
                }
            }
        },
        startImById: function(g, f, d) {
            var e = TS.ims.getImById(g);
            if (!e) {
                TS.error(g + " not an im");
                return
            }
            TS.ims.startImByMemberId(e.user, f, d)
        },
        startImByMemberName: function(e, f, d) {
            var g = TS.members.getMemberByName(e);
            if (!g) {
                TS.error("no member?? " + e);
                return
            }
            TS.ims.startImByMemberId(g.id, f, d)
        },
        startImByMemberId: function(f, g, d, h) {
            var e = TS.ims.getImByMemberId(f);
            if (e) {
                TS.ims.displayIm(e.id, g);
                if (e.is_open) {
                    if (d) {
                        TS.ims.sendMsg(e.id, $.trim(d))
                    }
                    return
                }
            }
            TS.model.requested_im_opens[f] = {
                and_send_txt: d
            };
            TS.api.call("im.open", {
                user: f
            }, TS.ims.onOpened)
        },
        onOpened: function(d, e) {
            if (!d) {
                return
            }
        },
        displayIm: function(h, g, e) {
            var f = TS.ims.getImById(h);
            if (!f) {
                TS.error('im "' + h + '" unknown');
                return
            }
            if (h == TS.model.active_im_id) {
                if (e) {
                    TS.ims.sendMsg(f.id, $.trim(e))
                }
                return
            }
            var d = g;
            if (TS.client.channelDisplaySwitched(null, h, null, false, d)) {
                TS.ims.switched_sig.dispatch()
            }
            if (e) {
                TS.ims.sendMsg(f.id, $.trim(e))
            }
        },
        setLastRead: function(d, e) {
            if (d.last_read == e) {
                return false
            }
            if (e.indexOf(TS.utility.date.fake_ts_unique_padder) > -1) {
                TS.error("bad ts:" + e);
                return false
            }
            if (d.last_read > e) {
                var f = TS.model.last_reads_set_by_client[d.id + "_" + e];
                delete TS.model.last_reads_set_by_client[d.id + "_" + e];
                if (f) {
                    TS.warn("NOT going back in time im.last_read:" + d.last_read + " new:" + e);
                    return
                }
                TS.info("going back in time im.last_read:" + d.last_read + " new:" + e)
            }
            d.last_read = e;
            TS.ims.marked_sig.dispatch(d);
            TS.ims.calcUnreadCnts(d);
            return true
        },
        markMostRecentReadMsg: function(d) {
            if (!d) {
                TS.error("im unknown");
                return
            }
            if (!d.msgs || !d.msgs.length) {
                return
            }
            var e = TS.utility.msgs.getMostRecentValidTs(d.msgs);
            if (!e) {
                TS.warn("no valid tses???");
                return
            }
            d.all_read_this_session_once = true;
            TS.ims.markReadMsg(d.id, e)
        },
        markReadMsg: function(f, e) {
            var d = TS.ims.getImById(f);
            if (!d) {
                TS.error('im "' + f + '" unknown');
                return
            }
            if (d.last_read == e) {
                return
            }
            if (TS.ims.setLastRead(d, e)) {
                d.needs_api_marking = true
            }
        },
        onMarked: function(f, g, e) {
            var d = TS.ims.getImById(e.channel);
            if (!d) {
                TS.error('wtf no im "' + e.channel + '"');
                return
            }
            if (!f) {
                d.needs_api_marking = true
            }
        },
        getImById: function(g) {
            var e = TS.model.ims;
            var d = b[g];
            if (d) {
                return d
            }
            if (!e) {
                return null
            }
            for (var f = 0; f < e.length; f++) {
                d = e[f];
                if (d.id == g) {
                    TS.warn(g + " not in _id_map");
                    b[g] = d;
                    return d
                }
            }
            return null
        },
        getDisplayNameOfUserForIm: function(d) {
            return TS.members.getMemberDisplayName(TS.members.getMemberByName(d.name))
        },
        getDisplayNameOfUserForImLowerCase: function(d) {
            return TS.members.getMemberDisplayNameLowerCase(TS.members.getMemberByName(d.name))
        },
        getImByUsername: function(f) {
            f = TS.utility.getLowerCaseValue(f);
            var e = TS.model.ims;
            var d = a[f];
            if (d) {
                return d
            }
            if (!e) {
                return null
            }
            for (var g = 0; g < e.length; g++) {
                d = e[g];
                if (d._name_lc == f || "@" + d._name_lc == f) {
                    TS.warn(f + " not in _name_map?");
                    a[f] = d;
                    return d
                }
            }
            return null
        },
        getImByMemberId: function(g) {
            var e = TS.model.ims;
            var d = c[g];
            if (d) {
                return d
            }
            if (!e) {
                return null
            }
            for (var f = 0; f < e.length; f++) {
                d = e[f];
                if (d.user == g) {
                    TS.warn(g + " not in _member_id_map?");
                    c[g] = d;
                    return d
                }
            }
            return null
        },
        getFirstOpenIm: function() {
            var e = TS.model.ims;
            var d;
            if (!e) {
                return null
            }
            for (var f = 0; f < e.length; f++) {
                d = e[f];
                if (d.is_open) {
                    return d
                }
            }
            return null
        },
        usernameChanged: function(e) {
            var d = TS.ims.getImByMemberId(e.id);
            if (!d) {
                return
            }
            delete a[d._name_lc];
            delete a["@" + d._name_lc];
            d.name = e.name;
            d._name_lc = TS.utility.getLowerCaseValue(d.name);
            a[d._name_lc] = d;
            a["@" + d._name_lc] = d
        },
        upsertIm: function(f) {
            var e = TS.model.ims;
            var l = TS.ims.getImById(f.id);
            var h;
            if (l) {
                TS.log(4, 'updating existing im "' + f.id + '"');
                for (var g in f) {
                    l[g] = f[g]
                }
                f = l;
                if (f.is_open || f.unread_cnt) {
                    TS.shared.checkInitialMsgHistory(f, TS.ims)
                }
            } else {
                TS.log(4, 'adding im "' + f.id + '"');
                e.push(f);
                if (f.is_im !== true) {
                    TS.warn(f.user + " lacked the is_im flag from the server");
                    f.is_im = true
                }
                f.name = f.user;
                var m = TS.members.getMemberById(f.user);
                if (m) {
                    f.name = m.name;
                    if (m.is_slackbot) {
                        f.is_slackbot_im = true
                    }
                }
                f._name_lc = TS.utility.getLowerCaseValue(f.name);
                b[f.id] = f;
                c[f.user] = f;
                a[f._name_lc] = f;
                a["@" + f._name_lc] = f;
                f.opened_this_session = false;
                f.oldest_msg_ts = TS.storage.fetchOldestTs(f.id);
                f.last_msg_input = TS.storage.fetchLastMsgInput(f.id);
                f.scroll_top = -1;
                f.history_is_being_fetched = false;
                f.needs_api_marking = false;
                f.unread_highlight_cnt = 0;
                f.unread_highlights = [];
                f.unread_cnt = 0;
                f.unreads = [];
                f.oldest_unread_ts = null;
                f.has_fetched_history_after_scrollback = false;
                if (TS.client) {
                    var d = TS.utility.msgs.fetchInitialMsgsFromLS(f);
                    TS.utility.msgs.setMsgs(f, d)
                } else {
                    if (TS.boot_data.msgs) {
                        TS.utility.msgs.ingestMessagesFromBootData(f)
                    }
                }
            } if (TS.client) {
                var j = TS.utility.msgs.shouldMarkUnreadsOnMessageFetch();
                TS.ims.calcUnreadCnts(f, j)
            }
            return f
        },
        markScrollTop: function(f, e) {
            var d = TS.ims.getImById(f);
            if (!d) {
                return false
            }
            if (d.scroll_top == e) {
                return false
            }
            d.scroll_top = e;
            return true
        },
        maybeLoadScrollBackHistory: function(e) {
            var d = TS.ims.getImById(e);
            if (!d) {
                return false
            }
            return TS.shared.maybeLoadScrollBackHistory(d, TS.ims)
        },
        maybeLoadHistory: function(e) {
            var d = TS.ims.getImById(e);
            if (!d) {
                return false
            }
            return TS.shared.maybeLoadHistory(d, TS.ims)
        },
        onHistory: function(f, g, e) {
            var d = TS.ims.getImById(e.channel);
            if (!d) {
                TS.error('wtf no im "' + e.channel + '"');
                return
            }
            if (!f || !g || !g.messages) {
                TS.error("failed to get history");
                d.history_is_being_fetched = false;
                TS.ims.history_fetched_sig.dispatch(d);
                return
            }
            var j = TS.shared.onHistory(d, g, e, TS.ims);
            if (!j) {
                d.history_is_being_fetched = false;
                TS.ims.history_fetched_sig.dispatch(d)
            }
            var h = TS.utility.msgs.shouldMarkUnreadsOnMessageFetch();
            TS.ims.calcUnreadCnts(d, h);
            if (TS.view) {
                if (!j && d.unread_cnt) {
                    TS.view.rebuildImList()
                }
            }
        },
        fetchHistory: function(d, e) {
            if (!d) {
                TS.error('wtf no im "' + d + '"');
                return
            }
            d.history_is_being_fetched = true;
            TS.ims.history_being_fetched_sig.dispatch(d);
            TS.api.call("im.history", e, TS.ims.onHistory)
        },
        checkForOldImsToClose: function() {
            var p = TS.model.ims;
            var o;
            var j;
            var l;
            var m;
            var g;
            var e = 0;
            var f = 11;
            var h = 1000 * 60 * 60 * 168;
            for (g = 0; g < p.length; g++) {
                o = p[g];
                if (!o.is_open && !o.unread_cnt) {
                    continue
                }
                e++
            }
            var k = e - f;
            if (k < 1) {
                return
            }
            TS.info("checkForOldImsToClose might close some. this_too_many:" + k);
            var n = [];
            for (g = 0; g < p.length; g++) {
                o = p[g];
                if (o.is_slackbot_im) {
                    continue
                }
                if (!o.is_open) {
                    continue
                }
                if (o.unread_cnt) {
                    continue
                }
                if (o.is_starred) {
                    continue
                }
                if (o.opened_this_session) {
                    continue
                }
                j = (o.latest) ? o.latest.ts : "";
                if (o.msgs && o.msgs.length && o.msgs[0] && o.msgs[0].ts > j) {
                    j = o.msgs[0].ts
                }
                if (j) {
                    l = TS.utility.date.toDateObject(j)
                } else {
                    l = new Date(o.created * 1000)
                }
                m = new Date() - l;
                TS.info(o.name + " " + l + " ms_since_activity:" + m + " allow_elapsed_ms:" + h);
                if (m > h) {
                    n.push({
                        im: o,
                        ms_since_activity: m
                    })
                }
            }
            if (!n.length) {
                TS.info("checkForOldImsToClose found no candidates for closing")
            }
            n.sort(function d(r, q) {
                var s = r.ms_since_activity;
                var t = q.ms_since_activity;
                if (s < t) {
                    return 1
                }
                if (s > t) {
                    return -1
                }
                return 0
            });
            n.length = (n.length > k) ? k : n.length;
            for (g = 0; g < n.length; g++) {
                o = n[g].im;
                TS.warn("checkForOldImsToClose CLOSING:" + o.name + " ms_since_activity:" + n[g].ms_since_activity);
                TS.ims.closeIm(o.id)
            }
        },
        setDataRetention: function(h, d, g, f) {
            var e = {
                channel: h,
                retention_type: $("select[name=retention_type]").val()
            };
            if (e.retention_type == 1) {
                e.retention_duration = $("#retention_duration").val()
            }
            TS.api.call("im.setRetention", e, function(k, l, j) {
                if (f) {
                    f(k, l, j)
                }
                if (k) {
                    TS.ims.data_retention_changed_sig.dispatch(j)
                }
            })
        },
        getDataRetention: function(e, d) {
            TS.api.call("im.getRetention", {
                channel: e
            }, d)
        }
    });
    var b = {};
    var a = {};
    var c = {}
})();
TS.registerModule("shared", {
    onStart: function() {},
    calcUnreadCnts: function(a, e, n) {
        a.unreads.length = 0;
        a.unread_highlights.length = 0;
        a.oldest_unread_ts = null;
        var j = a.msgs;
        var k = a.unread_cnt;
        var f = a.unread_highlight_cnt;
        var b;
        var l = false;
        var m = false;
        var h = true;
        if (a.is_archived && !a.was_archived_this_session) {
            h = false
        }
        if (a.is_channel && !a.is_member) {
            h = false
        }
        if (a.is_im) {
            var d = TS.members.getMemberById(a.user);
            if (d && d.deleted) {
                h = false
            }
        }
        var g = (a.is_im) || TS.channels.canChannelOrGroupHaveChannelMentions(a.id);
        if (h) {
            for (var c = 0; c < j.length; c++) {
                b = j[c];
                if (b.ts <= a.last_read) {
                    continue
                }
                if (TS.utility.msgs.isTempMsg(b) && !b._alert_even_though_temp) {
                    continue
                }
                m = TS.utility.msgs.msgCanCountAsUnread(b);
                l = l || m;
                if (!m) {
                    continue
                }
                a.unreads.push(b.ts);
                if (!a.oldest_unread_ts || b.ts < a.oldest_unread_ts) {
                    a.oldest_unread_ts = b.ts
                }
                if (g) {
                    if (TS.utility.msgs.msgContainsMention(b)) {
                        a.unread_highlights.push(b.ts)
                    }
                } else {
                    if (TS.utility.msgs.getMsgMentionData(b).non_channel_mentions) {
                        a.unread_highlights.push(b.ts)
                    }
                }
            }
        }
        if (!l && a.unreads.length) {
            a.unreads.length = 0;
            a.unread_highlights.length = 0;
            a.oldest_unread_ts = null;
            if (n) {
                e.markMostRecentReadMsg(a)
            }
        }
        a.unread_cnt = a.unreads.length;
        a.unread_highlight_cnt = a.unread_highlights.length;
        TS.utility.msgs.countAllUnreads();
        if (k != a.unread_cnt) {
            e.unread_changed_sig.dispatch(a)
        }
        if (f != a.unread_highlight_cnt) {
            e.unread_highlight_changed_sig.dispatch(a)
        }
    },
    checkInitialMsgHistory: function(b, a) {
        if (b.history_is_being_fetched) {
            TS.warn('checkInitialMsgHistory NOT DOING ANYTHING, because "' + b.name + '" history_is_being_fetched:true');
            return
        }
        var f = TS.model.initial_msgs_cnt;
        if (!b.latest) {
            TS.shared.maybeDealWithAllSentTempMsgs(b, a)
        } else {
            var e = TS.utility.msgs.getMsg(b.latest.ts, b.msgs);
            if (e) {
                TS.log(58, 'we have all recent "' + b.id + '" "' + b.name + '" msgs unread_count:' + b.unread_count + " unread_cnt:" + b.unread_cnt + " initial_count:" + f);
                TS.shared.maybeDealWithAllSentTempMsgs(b, a);
                if (b.msgs.length < 50 && TS.utility.msgs.getOlderMsgsStatus(b).more) {
                    TS.shared.loadHistory(b, a, f);
                    return true
                }
                if (b.msgs.length < b.unread_count && TS.utility.msgs.getOlderMsgsStatus(b).more) {
                    f = Math.min(TS.model.special_initial_msgs_cnt, (b.unread_count - b.msgs.length) + 1);
                    TS.warn('setting special initial_count for "' + b.id + '" "' + b.name + '" to:' + f);
                    TS.shared.loadHistory(b, a, f);
                    return true
                }
            } else {
                TS.log(58, 'WE DO NOT HAVE ALL RECENT MESSAGES for "' + b.id + '" "' + b.name + '" unread_count:' + b.unread_count + " unread_cnt:" + b.unread_cnt + " initial_count:" + f);
                var d = false;
                if (b.unread_count > TS.model.initial_msgs_cnt) {
                    d = true;
                    f = Math.min(TS.model.special_initial_msgs_cnt, b.unread_count);
                    TS.warn('setting special initial_count for "' + b.id + '" "' + b.name + '" to:' + f)
                } else {
                    if (!b.msgs.length) {}
                }
                var c = {
                    channel: b.id,
                    latest: b.latest.ts,
                    count: f
                };
                if (d) {
                    TS.log(58, 'we have some but not all recent "' + b.id + '" "' + b.name + '" msgs but we set_initial_count_special so are not setting oldest for api call')
                } else {
                    if (b.msgs.length && !TS.utility.msgs.isTempMsg(b.msgs[0])) {
                        TS.log(58, 'we have some but not all recent "' + b.id + '" "' + b.name + '" msgs');
                        c.oldest = b.msgs[0].ts
                    } else {
                        TS.log(58, 'we have no "' + b.id + '" msgs')
                    }
                }
                a.fetchHistory(b, c)
            }
        }
    },
    maybeLoadScrollBackHistory: function(b, a) {
        if (b.scroll_top !== 0) {
            return false
        }
        if (!TS.utility.msgs.getOlderMsgsStatus(b).more) {
            return false
        }
        TS.info(b.id + " HAS MORE");
        var c = (b.has_fetched_history_after_scrollback) ? TS.model.subsequent_msgs_cnt : TS.model.initial_msgs_cnt;
        TS.shared.loadHistory(b, a);
        b.has_fetched_history_after_scrollback = true;
        b.fetched_history_after_scrollback_time = TS.utility.date.getTimeStamp();
        return true
    },
    maybeLoadHistory: function(b, a) {
        if (!TS.utility.msgs.getOlderMsgsStatus(b).more) {
            return false
        }
        TS.info(b.id + " HAS MORE");
        TS.shared.loadHistory(b, a);
        return true
    },
    loadHistory: function(b, a, d) {
        var c = {
            channel: b.id,
            latest: b.msgs[b.msgs.length - 1].ts,
            count: d || TS.model.subsequent_msgs_cnt
        };
        a.fetchHistory(b, c)
    },
    onSendMsg: function(o, m, a, g) {
        var b = TS.utility.msgs.getMsgByRspId(m.reply_to, a.msgs);
        if (!o) {
            if (b) {
                TS.model.unsent_msgs[b.ts] = true;
                g.msg_not_sent_sig.dispatch(a, b)
            } else {
                TS.error("that makes no sense")
            }
            return
        }
        TS.view.scroll_down_when_msg_from_user_is_added = true;
        if (b) {
            var k = TS.utility.clone(b);
            k.text = m.text;
            k.ts = m.ts;
            delete k.rsp_id;
            g.removeMsg(a.id, b);
            g.addMsg(a.id, k)
        } else {
            TS.warn("no temp msg for " + m.reply_to);
            g.addMsg(m.SENT_MSG.channel, {
                text: m.text,
                user: TS.model.user.id,
                ts: m.ts
            })
        }
        var p;
        var l;
        var j = TS.utility.date.makeTsStamp();
        if (a.is_channel) {
            l = "channel";
            p = TS.channels.getActiveMembersNotInThisChannelForInviting(a.id)
        } else {
            if (a.is_group) {
                l = "group";
                p = TS.groups.getActiveMembersNotInThisGroupForInviting(a.id)
            } else {
                return
            }
        } if (!p.length) {
            return
        }
        var c = m.text.match(/<@(.*?)>/g);
        var n = [];
        var f;
        if (c) {
            for (var e = 0; e < c.length; e++) {
                f = TS.utility.msgs.getMemberFromMemberMarkup(c[e].replace(">", "").replace("<", ""));
                if (p.indexOf(f) == -1) {
                    continue
                }
                if (n.indexOf(f) > -1) {
                    continue
                }
                n.push(f)
            }
        }
        if (!n.length) {
            return
        }
        var d = "";
        var h = [];
        for (var e = 0; e < n.length; e++) {
            if (e != 0) {
                if (e == n.length - 1) {
                    if (n.length > 2) {
                        d += ","
                    }
                    d += " and "
                } else {
                    d += ", "
                }
            }
            d += "<@" + n[e].id + ">";
            h.push(n[e].id)
        }
        TS.ui.addEphemeralBotMsg({
            channel: a.id,
            ts: j,
            text: "You mentioned " + d + ", but they're not in this " + l + ". Would you like to <javascript:TS.ui.promptForGroupOrChannelInvite('" + a.id + "', '" + h.join(",") + "', '" + j + "')|invite them to join>" + (l == "group" ? "?" : " or have slackbot <javascript:TS.ui.sendChannelMsgThroughSlackBot('" + a.id + "', '" + m.ts + "', '" + h.join(",") + "', '" + j + "')|send them a link to your message>?") + " Or, <javascript:TS.utility.msgs.removeEphemeralMsg('" + a.id + "', '" + j + "')|do nothing>."
        })
    },
    sendMsg: function(c, e, a) {
        if (!e) {
            return false
        }
        var d = TS.utility.date.makeTsStamp();
        var e = TS.format.cleanMsg(e);
        if (e.indexOf("DELEEEEETETEEESTTTT") == 0) {
            TS.socket.disconnect()
        }
        var b = TS.socket.send({
            type: "message",
            channel: c,
            text: $.trim(e)
        }, a.onSendMsg, d);
        TS.typing.userEnded(TS.ims.getImById(c) || TS.groups.getGroupById(c) || TS.channels.getChannelById(c));
        a.addMsg(c, {
            type: "message",
            text: e,
            user: TS.model.user.id,
            ts: d,
            rsp_id: b
        });
        return true
    },
    onHistory: function(c, h, e, b) {
        var g = c.msgs;
        var d;
        if (h.is_limited) {
            h.has_more = false;
            c.is_limited = true
        }
        if (e.oldest) {
            if (h.has_more) {
                TS.info(c.name + " has more than one page of msg history between what is in cache and the latest, so let's dump what we have and just use this page of results");
                TS.info(c.name + " args.oldest:" + e.oldest);
                g.length = 0
            }
        }
        var a = [];
        if (h.messages) {
            for (var f = 0; f < h.messages.length; f++) {
                if (!TS.utility.msgs.getMsg(h.messages[f].ts, g)) {
                    d = h.messages[f];
                    a.push(TS.utility.msgs.processImsgFromHistory(d, c.id))
                }
            }
        }
        if (a.length && !TS.utility.msgs.getDisplayedMsgs(a).length) {
            TS.warn("no displayed msgs in this page for " + c.id + ' "' + c.name + '"! We expect TS.ui.afterHistoryFetch to detect this and load another page')
        }
        g = TS.utility.msgs.setMsgs(c, a.concat(g));
        TS.log(4, c.id + " msgs has more history now");
        if (c.latest && c.latest.ts && !TS.utility.msgs.getMsg(c.latest.ts, g)) {
            TS.log(4, "tacking on latest msg " + c.latest.ts);
            d = c.latest;
            TS.utility.msgs.appendMsg(g, TS.utility.msgs.processImsgFromHistory(d, c.id));
            TS.utility.msgs.sortMsgs(g)
        }
        TS.utility.msgs.maybeStoreMsgs(c.id, g);
        if (!e.oldest) {
            if (!h.has_more && !h.is_limited) {
                TS.utility.msgs.setOldestMsgsTs(c)
            }
        }
        TS.shared.maybeDealWithAllSentTempMsgs(c, b)
    },
    maybeDealWithAllSentTempMsgs: function(a, j) {
        if (!TS.socket) {
            return
        }
        for (var f in TS.socket.sent_map) {
            var b = TS.socket.sent_map[f];
            if (b.msg.channel != a.id) {
                continue
            }
            var l = b.temp_ts;
            var c = TS.utility.msgs.getMsg(l, a.msgs);
            if (!c) {
                continue
            }
            var e = TS.utility.msgs.getNonTempMsgFromUserMatchingText(b.msg.text, TS.model.user.id, a.msgs);
            if (e) {
                var d = TS.utility.date.toDateObject(e.ts);
                var h = TS.utility.date.toDateObject(l);
                var g = d.getTime() - h.getTime();
                if (d < h) {
                    TS.info("existing_msg time is older than temp_msg time, so it cant be the message we were looking for");
                    e = null
                }
            }
            if (!e) {
                TS.warn("not removing, we dont appear to have this non-temp message:" + b.msg.text);
                TS.model.unsent_msgs[c.ts] = true;
                j.msg_not_sent_sig.dispatch(a, c);
                continue
            }
            TS.info("removing temp_msg:" + c.ts + " " + c.text + " existing_msg:" + e.ts + " " + e.text);
            delete TS.socket.sent_map[f];
            if (a.is_channel) {
                TS.channels.removeMsg(a.id, c)
            } else {
                if (a.is_group) {
                    TS.groups.removeMsg(a.id, c)
                } else {
                    TS.ims.removeMsg(a.id, c)
                }
            }
        }
    },
    getActiveModelOb: function() {
        var a;
        if (TS.client) {
            if (TS.model.active_channel_id) {
                a = TS.channels.getChannelById(TS.model.active_channel_id)
            } else {
                if (TS.model.active_im_id) {
                    a = TS.ims.getImById(TS.model.active_im_id)
                } else {
                    if (TS.model.active_group_id) {
                        a = TS.groups.getGroupById(TS.model.active_group_id)
                    } else {
                        TS.warn("WTF getActiveModelOb found no ob");
                        TS.warn("TS.model.active_channel_id: " + TS.model.active_channel_id);
                        TS.warn("TS.model.active_im_id: " + TS.model.active_im_id);
                        TS.warn("TS.model.active_group_id: " + TS.model.active_group_id)
                    }
                }
            }
        } else {
            if (TS.boot_data.channel_id) {
                a = TS.channels.getChannelById(TS.boot_data.channel_id)
            } else {
                if (TS.boot_data.im_id) {
                    a = TS.ims.getImById(TS.boot_data.im_id)
                } else {
                    if (TS.boot_data.group_id) {
                        a = TS.groups.getGroupById(TS.boot_data.group_id)
                    } else {
                        TS.warn("WTF getActiveModelOb found no ob");
                        TS.warn("TS.boot_data.channel_id: " + TS.boot_data.channel_id);
                        TS.warn("TS.boot_data.im_id: " + TS.boot_data.im_id);
                        TS.warn("TS.boot_data.group_id: " + TS.boot_data.group_id)
                    }
                }
            }
        }
        return a
    },
    getModelObById: function(a) {
        if (a.charAt(0) === "C") {
            return TS.channels.getChannelById(a)
        } else {
            if (a.charAt(0) === "G") {
                return TS.groups.getGroupById(a)
            } else {
                return TS.ims.getImById(a)
            }
        }
    },
    getShareModelObId: function(a, c) {
        var b;
        if (a && a.charAt(0) === "U") {
            b = TS.ims.getImByMemberId(a);
            if (!b) {
                TS.api.call("im.open", {
                    user: a
                }, function(d, e) {
                    if (d) {
                        b = TS.ims.getImByMemberId(a);
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
});
(function() {
    TS.registerModule("members", {
        status_changed_sig: new signals.Signal(),
        presence_changed_sig: new signals.Signal(),
        user_color_changed_sig: new signals.Signal(),
        joined_team_sig: new signals.Signal(),
        changed_name_sig: new signals.Signal(),
        changed_deleted_sig: new signals.Signal(),
        changed_profile_sig: new signals.Signal(),
        changed_tz_sig: new signals.Signal(),
        changed_account_type_sig: new signals.Signal(),
        changed_self_sig: new signals.Signal(),
        members_for_user_changed_sig: new signals.Signal(),
        onStart: function() {},
        getMemberById: function(r) {
            var o = TS.model.members;
            var q = d[r];
            if (q) {
                return q
            }
            for (var p = 0; p < o.length; p++) {
                q = o[p];
                if (q.id == r) {
                    TS.warn(r + " not in _id_map");
                    d[r] = q;
                    return q
                }
            }
            return null
        },
        getMemberByName: function(p) {
            p = TS.utility.getLowerCaseValue(p);
            var o = TS.model.members;
            var r = l[p];
            if (r) {
                return r
            }
            for (var q = 0; q < o.length; q++) {
                r = o[q];
                if (r._name_lc == p || "@" + r._name_lc == p) {
                    TS.warn(p + " not in _name_map?");
                    l[p] = r;
                    l["@" + p] = r;
                    return r
                }
            }
            return null
        },
        getMemberByEmail: function(p) {
            p = TS.utility.getLowerCaseValue(p);
            var o = TS.model.members;
            var r;
            for (var q = 0; q < o.length; q++) {
                r = o[q];
                if (!r.profile) {
                    continue
                }
                if (!r.profile.email) {
                    continue
                }
                if (TS.utility.getLowerCaseValue(r.profile.email) == p) {
                    return r
                }
            }
            return null
        },
        getMemberByRealName: function(p, r) {
            p = TS.utility.getLowerCaseValue(p);
            if (r) {
                p = p.replace(/\s/g, "")
            }
            if (!p) {
                return null
            }
            var o = TS.model.members;
            var s = (r) ? f[p] : b[p];
            if (s) {
                return s
            }
            for (var q = 0; q < o.length; q++) {
                s = o[q];
                if (s._real_name_lc) {
                    if (r) {
                        if (s._real_name_lc_no_spaces == p) {
                            TS.warn(p + " not in _real_name_lc_no_spaces?");
                            _real_name_lc_no_spaces[p] = s;
                            return s
                        }
                    } else {
                        if (s._real_name_lc == p) {
                            TS.warn(p + " not in _real_name_map?");
                            b[p] = s;
                            return s
                        }
                    }
                }
            }
            return null
        },
        upsertAndSignal: function(q) {
            var p = TS.members.upsertMember(q);
            if (p.status == "CHANGED") {
                if (p.what_changed.indexOf("profile") != -1) {
                    TS.members.changed_profile_sig.dispatch(p.member)
                }
                if (p.what_changed.indexOf("is_restricted") != -1 || p.what_changed.indexOf("is_ultra_restricted") != -1) {
                    TS.members.changed_account_type_sig.dispatch(p.member)
                }
                if (p.what_changed.indexOf("name") != -1) {
                    TS.members.changed_name_sig.dispatch(p.member)
                }
                if (p.what_changed.indexOf("tz") != -1) {
                    TS.members.changed_tz_sig.dispatch(p.member)
                }
                if (p.what_changed.indexOf("deleted") != -1) {
                    TS.members.changed_deleted_sig.dispatch(p.member);
                    var o = TS.ims.getImByMemberId(p.member.id);
                    if (o) {
                        TS.ims.calcUnreadCnts(o, true)
                    }
                    TS.channels.calcActiveMembersForAllChannels();
                    TS.groups.calcActiveMembersForAllGroups()
                }
                if (q.is_self) {
                    TS.members.changed_self_sig.dispatch(p.member);
                    TS.model.makeYouReqex()
                }
            }
            return p
        },
        upsertMember: function(t, q) {
            var r = TS.model.members;
            var w = TS.members.getMemberById(t.id);
            var s = "NOOP";
            var u = [];
            if (t.is_ultra_restricted) {
                t.is_restricted = true
            }
            if (w) {
                TS.log(4, 'updating existing member "' + t.id + '"');
                for (var p in t) {
                    if (p == "profile") {
                        if (t.profile && JSON.stringify(w.profile) != JSON.stringify(t.profile)) {
                            var o = false;
                            if (!w.profile || t.profile.real_name != w.profile.real_name) {
                                o = true;
                                delete b[w._real_name_lc];
                                delete f[w._real_name_lc_no_spaces]
                            }
                            w.profile = t.profile;
                            if (o) {
                                TS.members.setLowerCaseNamesForMemberProfile(w);
                                b[w._real_name_lc] = w;
                                f[w._real_name_lc_no_spaces] = w
                            }
                            s = "CHANGED";
                            u.push(p)
                        }
                    } else {
                        if (w[p] != t[p]) {
                            if (t[p] && !TS.utility.isScalar(t[p])) {
                                w[p] = t[p];
                                TS.warn(p + " is not scalar! it needs to be handled by upsertMember specifically to test if it has changed! " + (typeof t[p]))
                            } else {
                                if (typeof t[p] != "boolean" || !t[p] != !w[p]) {
                                    u.push(p);
                                    var v = w[p];
                                    w[p] = t[p];
                                    s = "CHANGED";
                                    if (p == "name") {
                                        TS.members.usernameChanged(w, v)
                                    } else {
                                        if (p == "real_name") {
                                            TS.members.realNameChanged(w, v)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                t = w
            } else {
                if (t.id) {
                    s = "ADDED";
                    if (t.id == "USLACKBOT") {
                        t.is_slackbot = true
                    }
                    t.member_color = t.color;
                    if (TS.model.user_colors[t.id]) {
                        TS.members.setMemberUserColor(t, TS.model.user_colors[t.id])
                    }
                    TS.log(4, 'adding member "' + t.id + '" color:' + t.color + " member_color:" + t.member_color);
                    t._first_name_lc = "";
                    t._last_name_lc = "";
                    t._real_name_normalized_lc = "";
                    TS.members.setLowerCaseNamesForMemberProfile(t);
                    t._name_lc = TS.utility.getLowerCaseValue(t.name);
                    t._real_name_lc = TS.utility.getLowerCaseValue(t.real_name);
                    t._real_name_lc_no_spaces = t._real_name_lc.replace(/\s/g, "");
                    d[t.id] = t;
                    l[t._name_lc] = t;
                    l["@" + t._name_lc] = t;
                    b[t._real_name_lc] = t;
                    f[t._real_name_lc_no_spaces] = t;
                    t.files = [];
                    t.activity = [];
                    t.stars = [];
                    t.mentions = [];
                    t.activity_latest = [];
                    t.activity_recent = [];
                    r.push(t)
                } else {
                    TS.error("bad error, no member.id")
                }
            } if (t.is_self && t.deleted) {
                TS.info("calling TS.client.reload() because member.is_self && member.deleted");
                TS.client.reload(null, "TS.client.reload() because member.is_self && member.deleted");
                return
            }
            g();
            j();
            return {
                status: s,
                member: t,
                what_changed: u
            }
        },
        setMemberUserColor: function(p, o) {
            o = TS.utility.htmlEntities(o);
            p.member_color = o || p.color;
            if (o && o != p.color) {
                TS.model.user_colors[p.id] = o
            } else {
                delete TS.model.user_colors[p.id]
            }
            TS.members.user_color_changed_sig.dispatch(p)
        },
        setUserStatus: function(o) {
            TS.api.call("status.set", {
                status: o
            }, TS.members.onUserStatusSet)
        },
        onUserStatusSet: function(o, p) {
            if (!o) {
                return
            }
        },
        toggleUserPresence: function() {
            TS.api.call("presence.set", {
                presence: (TS.model.user.presence == "away") ? "active" : "away"
            }, TS.members.onUserPresenceSet)
        },
        onUserPresenceSet: function(o, p) {
            if (!o) {
                return
            }
        },
        usernameChanged: function(p, o) {
            delete l[o];
            delete l["@" + o];
            p._name_lc = TS.utility.getLowerCaseValue(p.name);
            l[p._name_lc] = p;
            l["@" + p._name_lc] = p;
            TS.ims.usernameChanged(p, o)
        },
        realNameChanged: function(p, o) {
            if (o) {
                delete b[o];
                delete f[o.replace(/\s/g, "")]
            }
            p._real_name_lc = TS.utility.getLowerCaseValue(p.real_name);
            p._real_name_lc_no_spaces = p._real_name_lc.replace(/\s/g, "");
            b[p._real_name_lc] = p;
            f[p._real_name_lc_no_spaces] = p
        },
        setLowerCaseNamesForMemberProfile: function(p) {
            if (!p.profile) {
                return
            }
            if ("first_name" in p.profile) {
                p._first_name_lc = TS.utility.getLowerCaseValue(p.profile.first_name)
            }
            if ("last_name" in p.profile) {
                p._last_name_lc = TS.utility.getLowerCaseValue(p.profile.last_name)
            }
            if ("real_name_normalized" in p.profile) {
                p._real_name_normalized_lc = TS.utility.getLowerCaseValue(p.profile.real_name_normalized)
            }
            if ("real_name" in p.profile) {
                p._real_name_lc = TS.utility.getLowerCaseValue(p.profile.real_name);
                p._real_name_lc_no_spaces = p._real_name_lc.replace(/\s/g, "");
                var o = p.real_name;
                p.real_name = p.profile.real_name;
                TS.members.realNameChanged(p, o)
            }
        },
        getMyChannelsThatThisMemberIsNotIn: function(t) {
            var q = [];
            var s = TS.members.getMemberById(t);
            if (!s) {
                return q
            }
            var r;
            var p = TS.model.channels;
            channel_loop: for (i = 0; i < p.length; i++) {
                r = p[i];
                if (!r.is_member) {
                    continue
                }
                for (var o = 0; o < r.members.length; o++) {
                    if (r.members[o] == t) {
                        continue channel_loop
                    }
                }
                q.push(r)
            }
            return q
        },
        getMyGroupsThatThisMemberIsNotIn: function(s) {
            var p = [];
            var r = TS.members.getMemberById(s);
            if (!r) {
                return p
            }
            var q;
            group_loop: for (i = 0; i < TS.model.groups.length; i++) {
                q = TS.model.groups[i];
                if (q.is_archived) {
                    continue
                }
                for (var o = 0; o < q.members.length; o++) {
                    if (q.members[o] == s) {
                        continue group_loop
                    }
                }
                p.push(q)
            }
            return p
        },
        getActiveMembersWithSelfAndNotSlackbot: function() {
            var o = h;
            if (!o.length) {
                o = h = a(o, TS.members.getMembersForUser(), false, false)
            }
            return o
        },
        getActiveMembersExceptSelfAndSlackbot: function() {
            var o = n;
            if (!o.length) {
                o = n = a(o, TS.members.getMembersForUser(), true, false)
            }
            return o
        },
        getActiveMembersWithSelfAndSlackbot: function() {
            var o = e;
            if (!o.length) {
                o = e = a(o, TS.members.getMembersForUser(), false, true)
            }
            return o
        },
        getActiveMembersWithSlackbotAndNotSelf: function() {
            var o = c;
            if (!o.length) {
                o = c = a(o, TS.members.getMembersForUser(), true, true)
            }
            return o
        },
        getMembersForUser: function() {
            if (!TS.model.user.is_restricted) {
                return TS.model.members
            }
            var p = m;
            if (!p.length) {
                var r;
                var q = TS.model.members;
                for (var o = 0; o < q.length; o++) {
                    r = q[o];
                    if (r.deleted) {
                        continue
                    }
                    if (!TS.members.canUserSeeMember(r)) {
                        continue
                    }
                    p.push(r)
                }
            }
            return p
        },
        canUserSeeMember: function(o) {
            if (!TS.model.user.is_restricted) {
                return true
            } else {
                if (o.is_self) {
                    return true
                } else {
                    if (o.is_slackbot) {
                        return true
                    } else {
                        if (TS.ims.getImByMemberId(o.id)) {
                            return true
                        } else {
                            if (TS.members.memberIsInAChannelIAmIn(o)) {
                                return true
                            } else {
                                if (TS.members.memberIsInAGroupIAmIn(o)) {
                                    return true
                                }
                            }
                        }
                    }
                }
            }
            return false
        },
        memberIsInAChannelIAmIn: function(q) {
            var o = TS.channels.getChannelsForUser();
            for (var p = 0; p < o.length; p++) {
                if (!o[p].is_member) {
                    continue
                }
                if (o[p].members.indexOf(q.id) != -1) {
                    return true
                }
            }
            return false
        },
        memberIsInAGroupIAmIn: function(q) {
            var o = TS.model.groups;
            for (var p = 0; p < o.length; p++) {
                if (o[p].is_archived) {
                    continue
                }
                if (o[p].members.indexOf(q.id) != -1) {
                    return true
                }
            }
            return false
        },
        getMemberDisplayName: function(q, p) {
            if (!q) {
                return "NO MEMBER??"
            }
            if (!TS.model.team) {
                return q.name
            }
            var o = TS.model.prefs.display_real_names_override;
            if ((TS.model.team.prefs.display_real_names && o != -1) || o == 1) {
                if (q.real_name) {
                    if (p) {
                        return TS.utility.htmlEntities(q.real_name)
                    }
                    return q.real_name
                }
            }
            return q.name
        },
        getMemberDisplayNameLowerCase: function(q, p) {
            if (!q) {
                return "NO MEMBER??"
            }
            if (!TS.model.team) {
                return q._name_lc
            }
            var o = TS.model.prefs.display_real_names_override;
            if ((TS.model.team.prefs.display_real_names && o != -1) || o == 1) {
                if (q.real_name) {
                    if (p) {
                        return TS.utility.htmlEntities(q._real_name_lc)
                    }
                    return q._real_name_lc
                }
            }
            return q._name_lc
        },
        botNameMatchesMemberName: function(q, o) {
            if (!q) {
                return false
            }
            q = q.replace(/\s/g, "");
            var p = TS.members.getMemberByName(q) || TS.members.getMemberByRealName(q, true);
            if (p && (o || !p.is_slackbot)) {
                return true
            }
            return false
        },
        invalidateMembersUserCanSeeArrayCaches: function() {
            g()
        },
        canUserAtEveryone: function() {
            if (TS.model.user.is_restricted) {
                return (TS.model.team.prefs.who_can_at_everyone == "ra")
            }
            if (TS.model.team.prefs.who_can_at_everyone == "ra") {
                return true
            }
            if (TS.model.team.prefs.who_can_at_everyone == "regular") {
                return true
            }
            if (TS.model.team.prefs.who_can_at_everyone == "admin") {
                return !!TS.model.user.is_admin
            }
            if (TS.model.team.prefs.who_can_at_everyone == "owner") {
                return !!TS.model.user.is_owner
            }
            return true
        },
        canUserAtChannelOrAtGroup: function() {
            if (TS.model.user.is_restricted) {
                return (TS.model.team.prefs.who_can_at_channel == "ra")
            }
            if (TS.model.team.prefs.who_can_at_channel == "ra") {
                return true
            }
            if (TS.model.team.prefs.who_can_at_channel == "regular") {
                return true
            }
            if (TS.model.team.prefs.who_can_at_channel == "admin") {
                return !!TS.model.user.is_admin
            }
            if (TS.model.team.prefs.who_can_at_channel == "owner") {
                return !!TS.model.user.is_owner
            }
            return true
        },
        canUserCreateChannels: function() {
            if (TS.model.user.is_restricted) {
                return false
            }
            if (TS.model.team.prefs.who_can_create_channels == "regular") {
                return true
            }
            if (TS.model.team.prefs.who_can_create_channels == "admin") {
                return !!TS.model.user.is_admin
            }
            if (TS.model.team.prefs.who_can_create_channels == "owner") {
                return !!TS.model.user.is_owner
            }
            return true
        },
        canUserArchiveChannels: function() {
            if (TS.model.user.is_restricted) {
                return false
            }
            if (TS.model.team.prefs.who_can_archive_channels == "regular") {
                return true
            }
            if (TS.model.team.prefs.who_can_archive_channels == "admin") {
                return !!TS.model.user.is_admin
            }
            if (TS.model.team.prefs.who_can_archive_channels == "owner") {
                return !!TS.model.user.is_owner
            }
            return true
        },
        canUserCreateGroups: function() {
            if (TS.model.user.is_ultra_restricted) {
                return false
            }
            if (TS.model.user.is_restricted) {
                return (TS.model.team.prefs.who_can_create_groups == "ra")
            }
            if (TS.model.team.prefs.who_can_create_groups == "ra") {
                return true
            }
            if (TS.model.team.prefs.who_can_create_groups == "regular") {
                return true
            }
            if (TS.model.team.prefs.who_can_create_groups == "admin") {
                return !!TS.model.user.is_admin
            }
            if (TS.model.team.prefs.who_can_create_groups == "owner") {
                return !!TS.model.user.is_owner
            }
            return true
        },
        canUserPostInGeneral: function() {
            if (TS.model.user.is_restricted) {
                return (TS.model.team.prefs.who_can_post_general == "ra")
            }
            if (TS.model.team.prefs.who_can_post_general == "ra") {
                return true
            }
            if (TS.model.team.prefs.who_can_post_general == "regular") {
                return true
            }
            if (TS.model.team.prefs.who_can_post_general == "admin") {
                return !!TS.model.user.is_admin
            }
            if (TS.model.team.prefs.who_can_post_general == "owner") {
                return !!TS.model.user.is_owner
            }
            return true
        },
        canUserKickFromChannels: function() {
            if (TS.model.user.is_restricted) {
                return false
            }
            if (TS.model.team.prefs.who_can_kick_channels == "regular") {
                return true
            }
            if (TS.model.team.prefs.who_can_kick_channels == "admin") {
                return !!TS.model.user.is_admin
            }
            if (TS.model.team.prefs.who_can_kick_channels == "owner") {
                return !!TS.model.user.is_owner
            }
            return true
        },
        canUserKickFromGroups: function() {
            if (TS.model.user.is_restricted) {
                return false
            }
            if (TS.model.team.prefs.who_can_kick_groups == "regular") {
                return true
            }
            if (TS.model.team.prefs.who_can_kick_groups == "admin") {
                return !!TS.model.user.is_admin
            }
            if (TS.model.team.prefs.who_can_kick_groups == "owner") {
                return !!TS.model.user.is_owner
            }
            return true
        }
    });
    var d = {};
    var l = {};
    var b = {};
    var f = {};
    var h = [];
    var n = [];
    var e = [];
    var c = [];
    var m = [];
    var k = 0;
    var a = function(p, q, s, r) {
        p.length = 0;
        var t;
        for (var o = 0; o < q.length; o++) {
            t = q[o];
            if (t.deleted) {
                continue
            }
            if (!r && t.is_slackbot) {
                continue
            }
            if (s && t.is_self) {
                continue
            }
            p.push(t)
        }
        return p
    };
    var j = function() {
        h.length = 0;
        n.length = 0;
        e.length = 0;
        c.length = 0
    };
    var g = function() {
        if (!TS.model.user || !TS.model.user.is_restricted) {
            return
        }
        var p = m.length;
        if (!p) {
            return
        }
        m.length = 0;
        j();
        k = p;
        var o = TS.members.getMembersForUser();
        if (o.length != p) {
            TS.members.members_for_user_changed_sig.dispatch()
        }
    }
})();
TS.registerModule("bots", {
    added_sig: new signals.Signal(),
    changed_name_sig: new signals.Signal(),
    changed_deleted_sig: new signals.Signal(),
    changed_icons_sig: new signals.Signal(),
    onStart: function() {},
    getBotById: function(d) {
        var b = TS.model.bots;
        var c;
        for (var a = 0; a < b.length; a++) {
            c = b[a];
            if (c.id == d) {
                return c
            }
        }
        return null
    },
    getBotByName: function(a) {
        var c = TS.model.bots;
        var d;
        for (var b = 0; b < c.length; b++) {
            d = c[b];
            if (d.name.toLowerCase() == a.toLowerCase()) {
                return d
            }
        }
        return null
    },
    upsertAndSignal: function(b) {
        var a = TS.bots.upsertBot(b);
        if (a.status == "CHANGED") {
            if (a.what_changed.indexOf("icons") != -1) {
                TS.bots.changed_icons_sig.dispatch(a.bot)
            }
            if (a.what_changed.indexOf("name") != -1) {
                TS.bots.changed_name_sig.dispatch(a.bot)
            }
            if (a.what_changed.indexOf("deleted") != -1) {
                TS.bots.changed_deleted_sig.dispatch(a.bot)
            }
        }
        return a
    },
    upsertBot: function(g, e) {
        var d = TS.model.bots;
        var c = TS.bots.getBotById(g.id);
        var a = "NOOP";
        var f = [];
        if (c) {
            TS.log(4, 'updating existing bot "' + g.id + '"');
            for (var b in g) {
                if (b == "icons") {
                    if (g.icons && JSON.stringify(c.icons) != JSON.stringify(g.icons)) {
                        c.icons = g.icons;
                        a = "CHANGED";
                        f.push(b)
                    }
                } else {
                    if (c[b] != g[b]) {
                        if (g[b] && !TS.utility.isScalar(g[b])) {
                            c[b] = g[b];
                            TS.warn(b + " is not scalar! it needs to be handled by upsertBot specifically to test if it has changed! " + (typeof g[b]))
                        } else {
                            if (typeof g[b] != "boolean" || !g[b] != !c[b]) {
                                f.push(b);
                                c[b] = g[b];
                                a = "CHANGED"
                            }
                        }
                    }
                }
            }
            g = c
        } else {
            a = "ADDED";
            TS.log(4, 'adding bot "' + g.id);
            d.push(g)
        }
        return {
            status: a,
            bot: g,
            what_changed: f
        }
    }
});
TS.registerModule("members.view", {
    team_filter_changed_sig: new signals.Signal(),
    filter_timer: null,
    onStart: function() {
        TS.members.view.bindTeamFilter("#team_filter", "#team_list_scroller")
    },
    bindTeamFilter: function(c, e) {
        var a = $(c);
        var f = a.find("input.member_filter");
        var b = a.find(".icon_close");
        var d = "";
        f.bind("keyup", function(g) {
            if (TS.members.view.filter_timer) {
                window.clearTimeout(TS.members.view.filter_timer)
            }
            TS.members.view.filter_timer = window.setTimeout(function() {
                var h;
                if (g.which == TS.utility.keymap.enter && c == "#dms_filter") {
                    TS.members.view.selectMatch(c)
                }
                var h = $.trim(f.val().toLowerCase());
                if (h !== d) {
                    d = h;
                    TS.members.view.filterTeam(d, c, e)
                }
                if (d.length == 0) {
                    b.addClass("hidden")
                } else {
                    b.removeClass("hidden")
                }
            }, (TS.model.members.length > 100 ? 250 : 50))
        });
        b.bind("click", function() {
            TS.members.view.clearFilter(c, e);
            if (TS.members.view.filter_timer) {
                window.clearTimeout(TS.members.view.filter_timer);
                TS.members.view.filter_timer = null
            }
            setTimeout(function() {
                f.focus()
            }, 0)
        })
    },
    filterTeam: function(e, n, h) {
        var f = $(n);
        var j = f.data("list-items-id");
        var k = $(j);
        var c = k.find(".member_item");
        c.removeClass("active");
        k.find(".no_matches").addClass("hidden");
        var b = new RegExp("^" + TS.utility.regexpEscape(e), "i");
        var g = new RegExp("\\s+" + TS.utility.regexpEscape(e), "i");
        $(".restricted_header").addClass("hidden");
        var o = TS.model.members;
        var d = false;
        var m = false;
        var l = false;
        var a = {};
        $.each(c, function(p, q) {
            var r;
            q = $(q);
            r = q.data("member-id");
            a[r] = q
        });
        matches = $.grep(o, function(r, q) {
            var p = false;
            p = r.name.match(b) || (r.profile.real_name_normalized && (r.profile.real_name_normalized.match(b) || r.profile.real_name_normalized.match(g))) || (r.profile.real_name && (r.profile.real_name.match(b) || r.profile.real_name.match(g)));
            if (p) {
                if (r.is_restricted) {
                    m = true
                } else {
                    if (r.deleted) {
                        l = true
                    } else {
                        d = true
                    }
                }
            }
            return p
        });
        if (matches.length > 0) {
            $.each(matches, function(p, q) {
                if (q && q.id && a[q.id]) {
                    a[q.id].addClass("active")
                }
            });
            if (h) {
                $(h).trigger("resize")
            }
        } else {
            if (n == "#dms_filter" || n == "#file_member_filter") {
                k.find(".query").text(e);
                k.find(".no_matches").removeClass("hidden")
            }
        } if (n == "#team_filter") {
            $("#team_list").find(".query").text(e);
            if (!d) {
                $("#active_members").find(".no_matches").removeClass("hidden")
            }
            if (!m) {
                $("#restricted_members").find(".no_matches").removeClass("hidden")
            }
            if (!l) {
                $("#deleted_members").find(".no_matches").removeClass("hidden")
            }
        }
        if (TS.client) {
            if (h) {
                $(h).data("monkeyScroll").updateFunc()
            }
        }
        TS.members.view.team_filter_changed_sig.dispatch()
    },
    selectMatch: function(f) {
        var c = $(f);
        var e = c.data("list-items-id");
        var h = $(e);
        var b = h.find(".member_item");
        var g = b.filter(".active");
        if (g.length == 1) {
            var a = g.first();
            var d = a.data("member-id");
            if (d) {
                TS.ims.startImByMemberId(d);
                TS.menu.end()
            }
        }
    },
    clearFilter: function(e, f) {
        var b = $(e);
        var h = b.find("input.member_filter");
        var c = b.find(".icon_close");
        var d = b.data("list-items-id");
        var g = $(d);
        var a = g.find(".member_item");
        if (TS.members.view.filter_timer) {
            window.clearTimeout(TS.members.view.filter_timer);
            TS.members.view.filter_timer = null
        }
        h.val("");
        c.addClass("hidden");
        $(".restricted_header").removeClass("hidden");
        g.find(".no_matches").addClass("hidden");
        a.addClass("active");
        if (TS.client) {
            if (f) {
                $(f).data("monkeyScroll").updateFunc()
            }
        }
    }
});
TS.registerModule("msg_handlers", {
    onStart: function() {},
    message: function(b) {
        TS.log(2, "recved message " + b.type);
        if (b.is_ephemeral && !b.ts) {
            b.ts = TS.utility.date.makeTsStamp()
        }
        var e = "subtype__" + b.subtype;
        if (e in TS.msg_handlers) {
            TS.msg_handlers[e](b)
        }
        var c = TS.utility.msgs.processImsg(b);
        if (TS.ims.getImById(b.channel)) {
            if (b.text == "start_profile_AAAAAA") {
                TS.model.profiling_keys = true
            } else {
                if (b.text == "end_profile_AAAAAA") {
                    TS.model.profiling_keys = false;
                    if (TS.model.profiling_key_times) {
                        TS.files.upload(JSON.stringify(TS.model.profiling_key_times, null, "\t"), null, null, null, "auto profile", "javascript", [b.channel], "");
                        delete TS.model.profiling_key_times
                    }
                }
            }
            TS.ims.addMsg(b.channel, c)
        } else {
            if (TS.groups.getGroupById(b.channel)) {
                TS.groups.addMsg(b.channel, c)
            } else {
                TS.channels.addMsg(b.channel, c)
            }
        }
        var a = TS.ims.getImById(b.channel) || TS.groups.getGroupById(b.channel) || TS.channels.getChannelById(b.channel);
        var d = TS.members.getMemberById(c.user);
        if (d && a) {
            TS.typing.memberEnded(a, d)
        }
    },
    subtype__file_share: function(a) {
        if (!a.file) {
            return
        }
        if (a.file.id == TS.files.polling_file_id) {
            TS.files.uploadProcessingOver(true, a.file.id)
        }
    },
    message_changed: function(b) {
        TS.log(2, "recved message " + b.type);
        if (!b.message) {
            TS.error("no message?");
            return
        }
        var c = TS.channels.getChannelById(b.message.channel);
        if (!c) {
            var a = TS.ims.getImById(b.message.channel)
        }
        if (!a && !c) {
            TS.error("unknown imsg.message.channel:" + b.message.channel);
            return
        }
        TS.utility.msgs.replaceMsg(a || c, b.message)
    },
    subtype__message_changed: function(b) {
        TS.log(2, "recved subtype " + b.subtype);
        if (!b.message) {
            TS.error("no message?");
            return
        }
        TS.mentions.replaceMsg(b.message);
        var c = TS.channels.getChannelById(b.channel);
        if (!c) {
            var a = TS.ims.getImById(b.channel)
        }
        if (!c && !a) {
            var d = TS.groups.getGroupById(b.channel)
        }
        if (!a && !c && !d) {
            TS.error("unknown imsg.channel:" + b.channel);
            return
        }
        if (b.message.imgs || TS.utility.msgs.hasImgs(b.message)) {
            TS.model.show_inline_img_size_pref_reminder = true
        }
        TS.utility.msgs.replaceMsg(a || c || d, b.message)
    },
    message_deleted: function(d) {
        TS.log(2, "recved message " + d.type);
        if (!d.message) {
            TS.error("no message?");
            return
        }
        var e = TS.channels.getChannelById(d.message.channel);
        if (!e) {
            var b = TS.ims.getImById(d.message.channel)
        }
        if (!e && !b) {
            var f = TS.groups.getGroupById(d.channel)
        }
        if (!b && !e) {
            TS.error("unknown imsg.message.channel:" + d.message.channel);
            return
        }
        var a = b || e;
        var c = TS.utility.msgs.getMsg(d.message.ts, a.msgs);
        if (!c) {
            TS.error("unknown msg:" + d.message.ts + " in " + a.id);
            return
        }
        if (b) {
            TS.ims.removeMsg(a.id, c)
        }
        if (e) {
            TS.channels.removeMsg(a.id, c)
        }
    },
    subtype__message_deleted: function(d) {
        TS.log(2, "recved subtype " + d.subtype);
        if (!d.deleted_ts) {
            TS.error("no deleted_ts?");
            return
        }
        TS.mentions.removeMsg(d.deleted_ts);
        var e = TS.channels.getChannelById(d.channel);
        if (!e) {
            var b = TS.ims.getImById(d.channel)
        }
        if (!e && !b) {
            var f = TS.groups.getGroupById(d.channel)
        }
        if (!b && !e && !f) {
            TS.error("unknown imsg.channel:" + d.channel);
            return
        }
        var a = b || e || f;
        var c = TS.utility.msgs.getMsg(d.deleted_ts, a.msgs);
        if (!c) {
            return
        }
        if (b) {
            TS.ims.removeMsg(a.id, c)
        } else {
            if (e) {
                TS.channels.removeMsg(a.id, c)
            } else {
                if (f) {
                    TS.groups.removeMsg(a.id, c)
                }
            }
        }
    },
    channel_left: function(a) {
        TS.info("You left channel " + a.channel);
        var b = TS.channels.getChannelById(a.channel);
        if (!b) {
            TS.error('unknown channel: "' + a.channel)
        }
        b.is_member = false;
        if (TS.model.active_channel_id == a.channel && !b.was_archived_this_session) {
            TS.client.activeChannelDisplayGoneAway()
        }
        TS.channels.calcUnreadCnts(b, true);
        TS.members.invalidateMembersUserCanSeeArrayCaches();
        TS.channels.left_sig.dispatch(b)
    },
    subtype__channel_leave: function(b) {
        var a = b.user;
        var e = TS.members.getMemberById(a);
        if (!e) {
            TS.error('unknown member: "' + a + '"');
            return
        }
        TS.info(e.name + " left channel " + b.channel);
        var d = TS.channels.getChannelById(b.channel);
        if (d) {
            for (var c = 0; c < d.members.length; c++) {
                if (d.members[c] == e.id) {
                    d.members.splice(c, 1);
                    TS.channels.calcActiveMembersForChannel(d);
                    break
                }
            }
        }
        TS.members.invalidateMembersUserCanSeeArrayCaches();
        TS.channels.member_left_sig.dispatch(d, e)
    },
    channel_joined: function(a) {
        TS.info("You joined channel " + a.channel.name);
        var b = TS.channels.upsertChannel(a.channel);
        TS.members.invalidateMembersUserCanSeeArrayCaches();
        TS.channels.joined_sig.dispatch(b)
    },
    channel_created: function(a) {
        TS.info("created channel " + a.channel.name);
        var b = TS.channels.upsertChannel(a.channel);
        TS.channels.created_sig.dispatch(b);
        if (a.event_ts) {
            TS.activity.maybeUpdateTeamActivity()
        }
    },
    channel_deleted: function(a) {
        var b = TS.channels.getChannelById(a.channel);
        if (!b) {
            TS.error('unknown channel: "' + a.channel);
            return
        }
        TS.info("deleted channel " + a.channel);
        TS.channels.removeChannel(b)
    },
    channel_archive: function(a) {
        var b = TS.channels.getChannelById(a.channel);
        if (!b) {
            TS.error('unknown channel: "' + a.channel);
            return
        }
        if (b.is_archived) {
            return
        }
        TS.info("archived channel " + a.channel);
        b.members.length = 0;
        TS.channels.calcActiveMembersForChannel(b);
        b.is_archived = true;
        if (!TS.model.user.is_restricted) {
            if (b.is_member) {
                b.was_archived_this_session = true
            }
        }
        TS.channels.archived_sig.dispatch(b)
    },
    channel_unarchive: function(a) {
        var c = TS.channels.getChannelById(a.channel);
        if (!c) {
            TS.error('unknown channel: "' + a.channel);
            return
        }
        if (!c.is_archived) {
            return
        }
        TS.info("unarchived channel " + a.channel);
        if (c.was_archived_this_session) {
            var b = true;
            TS.channels.join(c.name, null, b)
        }
        c.is_archived = false;
        c.was_archived_this_session = false;
        TS.channels.unarchived_sig.dispatch(c)
    },
    channel_rename: function(a) {
        var b = TS.channels.getChannelById(a.channel.id);
        if (!b) {
            TS.error('unknown channel: "' + a.channel);
            return
        }
        TS.info("renamed channel " + a.channel.id + " to " + a.channel.name);
        TS.channels.channelRenamed(a.channel)
    },
    subtype__channel_join: function(b) {
        var a = b.user;
        var f = TS.members.getMemberById(a);
        if (!f) {
            TS.error('unknown member: "' + a + '"');
            return
        }
        TS.info(f.name + " joined channel " + b.channel);
        var e = TS.channels.getChannelById(b.channel);
        var c;
        if (e) {
            for (var d = 0; d < e.members.length; d++) {
                if (e.members[d] == f.id) {
                    c = e.members[d];
                    break
                }
            }
        }
        if (!c) {
            e.members.push(f.id);
            TS.channels.calcActiveMembersForChannel(e)
        }
        if (f.is_self && b.inviter) {
            e.needs_invited_message = true;
            e.inviter = b.inviter
        }
        TS.members.invalidateMembersUserCanSeeArrayCaches();
        TS.channels.member_joined_sig.dispatch(e, f)
    },
    channel_marked: function(a) {
        var b = TS.channels.getChannelById(a.channel);
        if (!b) {
            TS.error('unknown channel: "' + a.channel + '"');
            return
        }
        b.needs_invited_message = false;
        TS.channels.setLastRead(b, a.ts)
    },
    subtype__channel_topic: function(b) {
        var c = TS.channels.getChannelById(b.channel);
        if (!c) {
            TS.error('unknown channel: "' + b.channel + '"');
            return
        }
        var a = b.user;
        var d = TS.members.getMemberById(a);
        if (!d) {
            TS.error('unknown member: "' + a + '"');
            return
        }
        TS.info(d.name + " changed topic for channel " + b.channel + " to " + b.topic);
        TS.channels.topicChanged(c, a, b.ts, b.topic)
    },
    subtype__channel_purpose: function(b) {
        var c = TS.channels.getChannelById(b.channel);
        if (!c) {
            TS.error('unknown channel: "' + b.channel + '"');
            return
        }
        var a = b.user;
        var d = TS.members.getMemberById(a);
        if (!d) {
            TS.error('unknown member: "' + a + '"');
            return
        }
        TS.info(d.name + " changed purpose for channel " + b.channel + " to " + b.purpose);
        TS.channels.purposeChanged(c, a, b.ts, b.purpose)
    },
    subtype__channel_history_changed: function(a) {
        var b = TS.channels.getChannelById(a.channel);
        if (!b) {
            TS.error('unknown channel: "' + a.channel + '"');
            return
        }
        if (!b.is_member) {
            TS.warn("we can ignore this channel_history_changed msg, we are not a member");
            return
        }
        b.history_changed = true;
        TS.channels.fetchHistory(b, {
            channel: b.id,
            latest: a.latest,
            count: TS.utility.clamp(b.msgs.length, TS.model.initial_msgs_cnt, 1000)
        }, function(e, f, c) {
            if (!e) {
                TS.error("could not retrieve history")
            } else {
                b.oldest_msg_ts = null;
                TS.storage.storeOldestTs(b.id, null);
                TS.warn("imsg.latest: " + a.latest);
                for (var d = b.msgs.length - 1; d > -1; d--) {
                    var g = b.msgs[d];
                    if (g.ts < a.latest) {
                        continue
                    }
                    TS.warn("unshifting: " + g.ts);
                    f.messages.unshift(g)
                }
                b.msgs.length = 0;
                TS.channels.onHistory(e, f, c)
            }
            delete b.history_changed
        });
        if (b.id == TS.model.active_channel_id) {} else {}
    },
    group_left: function(a) {
        TS.info("You left group " + a.channel);
        var b = TS.groups.getGroupById(a.channel);
        if (!b) {
            TS.error('unknown group: "' + a.channel);
            return
        }
        TS.groups.removeGroup(b);
        TS.members.invalidateMembersUserCanSeeArrayCaches();
        TS.groups.left_sig.dispatch(b)
    },
    subtype__group_leave: function(b) {
        var a = b.user;
        var e = TS.members.getMemberById(a);
        if (!e) {
            TS.error('unknown member: "' + a + '"');
            return
        }
        TS.info(e.name + " left group " + b.channel);
        var d = TS.groups.getGroupById(b.channel);
        if (d) {
            for (var c = 0; c < d.members.length; c++) {
                if (d.members[c] == e.id) {
                    d.members.splice(c, 1);
                    TS.groups.calcActiveMembersForGroup(d);
                    break
                }
            }
        }
        TS.members.invalidateMembersUserCanSeeArrayCaches();
        TS.groups.member_left_sig.dispatch(d, e)
    },
    group_joined: function(a) {
        TS.info("You joined group " + a.channel.name);
        var b = TS.groups.getGroupById(a.channel.name);
        if (b) {
            TS.error("should not be getting a group_joined message if we already know about the group: " + a.channel.name + " " + a.channel.id);
            return
        }
        var c = TS.groups.upsertGroup(a.channel);
        TS.members.invalidateMembersUserCanSeeArrayCaches();
        TS.groups.joined_sig.dispatch(c);
        TS.shared.checkInitialMsgHistory(c, TS.groups)
    },
    group_deleted: function(a) {
        var b = TS.groups.getGroupById(a.channel);
        if (!b) {
            TS.error('unknown group: "' + a.channel);
            return
        }
        TS.info("deleted group " + a.channel);
        TS.groups.removeGroup(b)
    },
    group_archive: function(a) {
        var b = TS.groups.getGroupById(a.channel);
        if (!b) {
            TS.error('unknown group: "' + a.channel);
            return
        }
        if (b.is_archived) {
            return
        }
        TS.info("archived group " + a.channel);
        b.is_archived = true;
        if (b.is_open) {
            b.was_archived_this_session = true
        }
        TS.groups.archived_sig.dispatch(b)
    },
    group_unarchive: function(a) {
        var b = TS.groups.getGroupById(a.channel);
        if (!b) {
            TS.error('unknown group: "' + a.channel);
            return
        }
        if (!b.is_archived) {
            return
        }
        TS.info("unarchived group " + a.channel);
        b.is_archived = false;
        b.was_archived_this_session = false;
        TS.groups.unarchived_sig.dispatch(b)
    },
    group_rename: function(a) {
        var b = TS.groups.getGroupById(a.channel.id);
        if (!b) {
            TS.error('unknown group: "' + a.channel.id);
            return
        }
        TS.info("renamed group " + a.channel.id + " to " + a.channel.name);
        TS.groups.groupRenamed(a.channel)
    },
    subtype__group_join: function(b) {
        var a = b.user;
        var f = TS.members.getMemberById(a);
        if (!f) {
            TS.error('unknown member: "' + a + '"');
            return
        }
        TS.info(f.name + " joined group " + b.channel);
        var e = TS.groups.getGroupById(b.channel);
        var c;
        if (e) {
            for (var d = 0; d < e.members.length; d++) {
                if (e.members[d] == f.id) {
                    c = e.members[d];
                    break
                }
            }
        }
        if (!c) {
            e.members.push(f.id);
            TS.groups.calcActiveMembersForGroup(e)
        }
        if (f.is_self && b.inviter) {
            e.needs_invited_message = true;
            e.inviter = b.inviter
        }
        TS.members.invalidateMembersUserCanSeeArrayCaches();
        TS.groups.member_joined_sig.dispatch(e, f)
    },
    group_open: function(a) {
        var c = TS.groups.getGroupById(a.channel);
        if (!c) {
            TS.error("unkown group! " + a.channel);
            return
        }
        var b = c.is_open;
        c.is_open = true;
        if (TS.model.requested_group_opens[a.channel]) {
            TS.groups.displayGroup(c.id, false, TS.model.requested_group_opens[a.channel].and_send_txt);
            delete TS.model.requested_group_opens[a.channel]
        }
        c.opened_this_session = true;
        if (!b) {
            TS.groups.opened_sig.dispatch(c);
            TS.shared.checkInitialMsgHistory(c, TS.groups)
        }
    },
    group_marked: function(a) {
        var b = TS.groups.getGroupById(a.channel);
        if (!b) {
            TS.error('unknown group: "' + a.channel + '"');
            return
        }
        b.needs_invited_message = false;
        TS.groups.setLastRead(b, a.ts)
    },
    group_close: function(a) {
        var b = TS.groups.getGroupById(a.channel);
        if (!b) {
            TS.error('unknown group: "' + a.channel + '"');
            return
        }
        b.is_open = false;
        if (TS.model.active_group_id == a.channel) {
            TS.client.activeChannelDisplayGoneAway()
        }
        TS.groups.closed_sig.dispatch(b)
    },
    subtype__group_topic: function(b) {
        var c = TS.groups.getGroupById(b.channel);
        if (!c) {
            TS.error('unknown group: "' + b.channel + '"');
            return
        }
        var a = b.user;
        var d = TS.members.getMemberById(a);
        if (!d) {
            TS.error('unknown member: "' + a + '"');
            return
        }
        TS.info(d.name + " changed topic for group " + b.channel + " to " + b.topic);
        TS.groups.topicChanged(c, a, b.ts, b.topic)
    },
    subtype__group_purpose: function(b) {
        var c = TS.groups.getGroupById(b.channel);
        if (!c) {
            TS.error('unknown group: "' + b.channel + '"');
            return
        }
        var a = b.user;
        var d = TS.members.getMemberById(a);
        if (!d) {
            TS.error('unknown member: "' + a + '"');
            return
        }
        TS.info(d.name + " changed purpose for group " + b.channel + " to " + b.purpose);
        TS.groups.purposeChanged(c, a, b.ts, b.purpose)
    },
    subtype__group_history_changed: function(a) {
        var b = TS.groups.getGroupById(a.channel);
        if (!b) {
            TS.error('unknown group: "' + a.channel + '"');
            return
        }
        b.history_changed = true;
        TS.groups.fetchHistory(b, {
            channel: b.id,
            latest: a.latest,
            count: TS.utility.clamp(b.msgs.length, TS.model.initial_msgs_cnt, 1000)
        }, function(e, f, c) {
            if (!e) {
                TS.error("could not retrieve history")
            } else {
                b.oldest_msg_ts = null;
                TS.storage.storeOldestTs(b.id, null);
                TS.warn("imsg.latest: " + a.latest);
                for (var d = b.msgs.length - 1; d > -1; d--) {
                    var g = b.msgs[d];
                    if (g.ts < a.latest) {
                        continue
                    }
                    TS.warn("unshifting: " + g.ts);
                    f.messages.unshift(g)
                }
                b.msgs.length = 0;
                TS.groups.onHistory(e, f, c)
            }
            delete b.history_changed
        });
        if (b.id == TS.model.active_group_id) {} else {}
    },
    im_created: function(b) {
        var a = TS.ims.getImById(b.channel.id);
        if (a) {
            TS.error("we already have an im for this user! " + b.user);
            return
        }
        TS.ims.upsertIm(b.channel);
        a = TS.ims.getImById(b.channel.id);
        if (!a) {
            TS.error("WTF why can we not find this im: " + b.channel.id);
            return
        }
        if (a.is_open) {
            if (TS.model.requested_im_opens[b.user]) {
                TS.ims.displayIm(a.id, false, TS.model.requested_im_opens[b.user].and_send_txt);
                delete TS.model.requested_im_opens[b.user]
            }
            TS.ims.opened_sig.dispatch(a)
        }
        a.opened_this_session = true
    },
    im_open: function(b) {
        var a = TS.ims.getImById(b.channel);
        if (!a) {
            TS.error("unkown im! " + b.channel);
            return
        }
        var c = a.is_open;
        a.is_open = true;
        if (TS.model.requested_im_opens[b.user]) {
            TS.ims.displayIm(a.id, false, TS.model.requested_im_opens[b.user].and_send_txt);
            delete TS.model.requested_im_opens[b.user]
        }
        a.opened_this_session = true;
        if (!c) {
            TS.ims.opened_sig.dispatch(a);
            TS.shared.checkInitialMsgHistory(a, TS.ims)
        }
    },
    im_marked: function(b) {
        var a = TS.ims.getImById(b.channel);
        if (!a) {
            TS.error('unknown im: "' + b.channel + '"');
            return
        }
        TS.ims.setLastRead(a, b.ts)
    },
    im_close: function(b) {
        var a = TS.ims.getImById(b.channel);
        if (!a) {
            TS.error('unknown im: "' + b.channel + '"');
            return
        }
        a.is_open = false;
        if (TS.model.active_im_id == b.channel) {
            TS.client.activeChannelDisplayGoneAway()
        }
        TS.ims.closed_sig.dispatch(a)
    },
    manual_presence_change: function(b) {
        var a = TS.model.user;
        if (b.presence != "away" && b.presence != "active") {
            TS.error('unknown presence: "' + b.presence + '"');
            return
        }
        a.manual_presence = b.presence;
        TS.members.presence_changed_sig.dispatch(a)
    },
    presence_change: function(a) {
        var b = TS.members.getMemberById(a.user);
        if (!b) {
            TS.error('unknown member: "' + a.user + '"');
            return
        }
        if (a.presence != "away" && a.presence != "active") {
            TS.error('unknown presence: "' + a.presence + '"');
            return
        }
        if (b.presence == a.presence) {
            return
        }
        b.presence = a.presence;
        TS.members.presence_changed_sig.dispatch(b)
    },
    status_change: function(a) {
        var b = TS.members.getMemberById(a.user);
        if (!b) {
            TS.error('unknown member: "' + a.user + '"');
            return
        }
        if (b.status == a.status) {
            return
        }
        b.status = a.status;
        TS.members.status_changed_sig.dispatch(b)
    },
    pref_change: function(a) {
        TS.prefs.onPrefChanged(a)
    },
    team_pref_change: function(a) {
        TS.prefs.onTeamPrefChanged(a)
    },
    file_created: function(a) {
        var b = TS.files.getFileById(a.file.id);
        if (b) {
            TS.warn("we already know about this file, which probably means the files.upload response came in before this message (so np) " + a.file.id)
        } else {
            TS.files.upsertAndSignal(a.file)
        }
    },
    file_public: function(a) {
        TS.files.upsertAndSignal(a.file);
        if (a.event_ts) {
            TS.activity.maybeUpdateTeamActivity()
        }
    },
    file_deleted: function(a) {
        TS.files.removeFile(a.file_id);
        if (a.event_ts) {
            TS.activity.maybeUpdateTeamActivity()
        }
    },
    file_private: function(a) {
        TS.files.fetchFileInfo(a.file_id);
        if (a.event_ts) {
            TS.activity.maybeUpdateTeamActivity()
        }
    },
    file_change: function(a) {
        TS.files.upsertAndSignal(a.file);
        TS.files.fileWasMaybeRefreshed(a.file);
        if (a.file.mode == "snippet" || a.file.mode == "post") {
            TS.files.fetchFileInfo(a.file.id)
        }
    },
    file_shared: function(a) {
        TS.files.upsertAndSignal(a.file)
    },
    file_unshared: function(a) {
        TS.files.upsertAndSignal(a.file)
    },
    file_comment_added: function(a) {
        var b = TS.files.getFileById(a.file.id);
        if (!b) {
            return
        }
        TS.files.editCommentOnFile(a.comment, b);
        TS.files.upsertFile(a.file);
        if (a.event_ts) {
            TS.activity.maybeUpdateTeamActivity()
        }
    },
    file_comment_edited: function(a) {
        var b = TS.files.getFileById(a.file.id);
        if (!b) {
            return
        }
        TS.files.editCommentOnFile(a.comment, b);
        TS.files.upsertFile(a.file)
    },
    file_comment_deleted: function(a) {
        var b = TS.files.getFileById(a.file.id);
        if (!b) {
            return
        }
        TS.files.deleteCommentOnFile(a.comment, b);
        TS.files.upsertFile(a.file);
        if (a.event_ts) {
            TS.activity.maybeUpdateTeamActivity()
        }
    },
    hello: function(a) {
        TS.socket.onHello()
    },
    team_join: function(a) {
        var b = a.user;
        TS.info(b.name + " joined the team");
        TS.members.upsertMember(b);
        b = TS.members.getMemberById(b.id);
        if (!b) {
            TS.error("wtf no member " + b.id + "?");
            return
        }
        TS.members.joined_team_sig.dispatch(b);
        TS.view.showProperTeamPaneFiller()
    },
    user_change: function(a) {
        var c = TS.members.getMemberById(a.user.id);
        if (!c) {
            TS.error("wtf no member " + a.user.id + "?");
            return
        }
        var b = TS.members.upsertAndSignal(a.user)
    },
    star_added: function(a) {
        if (!a.item) {
            TS.error(a.type + " has no item");
            return
        }
        if (a.user == TS.model.user.id) {
            TS.stars.starStatusHasChanged(true, a.item, a.type);
            TS.stars.maybeUpdateStarredItems()
        } else {
            TS.activity.slurpStarItem(a.item, a.type)
        } if (a.event_ts) {
            TS.activity.maybeUpdateTeamActivity()
        }
    },
    star_removed: function(a) {
        if (!a.item) {
            TS.error(a.type + " has no item");
            return
        }
        if (a.user == TS.model.user.id) {
            TS.stars.starStatusHasChanged(false, a.item, a.type);
            TS.stars.maybeUpdateStarredItems()
        } else {
            TS.activity.slurpStarItem(a.item, a.type)
        } if (a.event_ts) {
            TS.activity.maybeUpdateTeamActivity()
        }
    },
    email_domain_changed: function(a) {
        TS.model.team.email_domain = a.email_domain;
        TS.view.showProperTeamPaneFiller()
    },
    team_domain_change: function(a) {
        TS.model.last_team_domain = TS.model.team.domain = a.domain;
        TSSSB.call("setCurrentTeam", {
            team: TS.model.team.domain
        }, TS.model.team.domain)
    },
    slack_broadcast: function(b) {
        var e = null;
        var g = b.title || "Broadcast message";
        var a = b.body || "";
        var f = "";
        var d = b.button || (b.reload ? "Reload" : "OK");
        var h = false;
        if (!!b.reload) {
            if (!!b.force_reload) {
                TS.info("reloading because imsg.force_reload");
                h = true
            } else {
                if (!TS.boot_data.svn_rev) {
                    TS.info("reloading because we dont have an svn_rev");
                    h = true
                } else {
                    if (b.svn_rev == "dev") {
                        TS.info("reloading because dev");
                        h = true
                    } else {
                        if (parseInt(TS.boot_data.svn_rev) < parseInt(b.svn_rev)) {
                            TS.info("reloading because " + TS.boot_data.svn_rev + " < " + b.svn_rev);
                            h = true
                        }
                    }
                }
            } if (!h) {
                return
            }
            e = function() {
                TS.client.reload()
            }
        }
        if (h) {
            var c = TS.utility.randomInt(10, 20);
            f = '<p class="top_margin">(You will be auto reloaded in <span id="auto_secs">' + c + "</span> seconds.)</p>";
            setTimeout(function() {
                TS.client.reload()
            }, c * 1000);
            setInterval(function() {
                c--;
                if (c < 1) {
                    return
                }
                $("#auto_secs").text(c)
            }, 1000)
        }
        TS.generic_dialog.start({
            title: TS.format.formatMsg(g, null, false, false, false, false, true, true),
            body: TS.format.formatMsg(a, null, false, false, false, false, true, true) + f,
            go_button_text: d,
            show_cancel_button: false,
            esc_for_ok: true,
            on_go: e
        })
    },
    team_rename: function(a) {
        $("#team_name").text(a.name);
        document.title = document.title.replace(TS.model.last_team_name, a.name);
        if (TS.ui.growls.original_document_title) {
            TS.ui.growls.original_document_title = TS.ui.growls.original_document_title.replace(TS.model.last_team_name, a.name)
        }
        TS.model.last_team_name = TS.model.team.name = a.name
    },
    bot_added: function(a) {
        var b = a.bot;
        TS.info(b.name + " was added");
        TS.bots.upsertBot(b);
        b = TS.bots.getBotById(b.id);
        if (!b) {
            TS.error("wtf no bot " + b.id + "?");
            return
        }
        TS.bots.added_sig.dispatch(b)
    },
    bot_changed: function(a) {
        var c = TS.bots.getBotById(a.bot.id);
        if (!c) {
            TS.error("wtf no bot " + a.bot.id + "?");
            return
        }
        var b = TS.bots.upsertAndSignal(a.bot)
    },
    bot_removed: function(a) {
        var c = TS.bots.getBotById(a.bot.id);
        if (!c) {
            TS.error("wtf no bot " + a.bot.id + "?");
            return
        }
        var b = TS.bots.upsertAndSignal(a.bot)
    },
    error: function(a) {
        TS.socket.onErrorMsg(a)
    },
    user_typing: function(c) {
        var f = TS.members.getMemberById(c.user);
        if (!f) {
            TS.error("unknown imsg.user:" + c.user);
            return
        }
        var d = TS.channels.getChannelById(c.channel);
        if (!d) {
            var b = TS.ims.getImById(c.channel)
        }
        if (!d && !b) {
            var e = TS.groups.getGroupById(c.channel)
        }
        if (!b && !d && !e) {
            TS.error("unknown imsg.channel:" + c.channel);
            return
        }
        var a = b || d || e;
        TS.typing.memberStarted(a, f)
    },
    issue_change: function(a) {
        TS.help.onIssueChange(a.issue)
    },
    emoji_changed: function(a) {
        TS.setUpEmoji(function() {
            TS.ui.emoji_names.length = 0;
            for (var b in emoji.data) {
                var e = emoji.data[b][3];
                for (var d = 0; d < e.length; d++) {
                    var c = e[d];
                    TS.ui.emoji_names.push(c)
                }
            }
            TS.ui.emoji_names.sort();
            TS.view.rebuildAll();
            TS.ui.makeEmoticonList()
        })
    },
    play_sound: function(a) {
        if (TS.model.prefs.autoplay_chat_sounds) {
            TS.ui.playSound(a.sound + ".mp3")
        }
    },
    accounts_changed: function() {
        setTimeout(TS.refreshTeams, 1000)
    },
    command_added: function(a) {
        if (!a.command || !a.command.name) {
            return
        }
        TS.cmd_handlers.serverCmdAddedOrChanged(a.command)
    },
    command_changed: function(a) {
        if (!a.command || !a.command.name) {
            return
        }
        TS.cmd_handlers.serverCmdAddedOrChanged(a.command)
    },
    command_removed: function(a) {
        if (!a.command || !a.command.name) {
            return
        }
        TS.cmd_handlers.serverCmdRemoved(a.command)
    }
});
TS.registerModule("prefs", {
    highlight_words_changed_sig: new signals.Signal(),
    seen_welcome_2_changed_sig: new signals.Signal(),
    emoji_mode_changed_sig: new signals.Signal(),
    obey_inline_img_limit_changed_sig: new signals.Signal(),
    show_member_presence_changed_sig: new signals.Signal(),
    messages_theme_changed_sig: new signals.Signal(),
    expand_inline_imgs_changed_sig: new signals.Signal(),
    expand_internal_inline_imgs_changed_sig: new signals.Signal(),
    expand_non_media_attachments_changed_sig: new signals.Signal(),
    webapp_spellcheck_changed_sig: new signals.Signal(),
    color_names_in_list_changed_sig: new signals.Signal(),
    search_only_my_channels_changed_sig: new signals.Signal(),
    search_exclude_channels_changed_sig: new signals.Signal(),
    dropbox_enabled_changed_sig: new signals.Signal(),
    collapsible_changed_sig: new signals.Signal(),
    read_changed_sig: new signals.Signal(),
    push_changed_sig: new signals.Signal(),
    time24_changed_sig: new signals.Signal(),
    sidebar_behavior_changed_sig: new signals.Signal(),
    dtop_notif_changed_sig: new signals.Signal(),
    mac_ssb_bullet_changed_sig: new signals.Signal(),
    team_hide_referers_changed_sig: new signals.Signal(),
    sidebar_theme_changed_sig: new signals.Signal(),
    display_real_names_override_changed_sig: new signals.Signal(),
    team_display_real_names_changed_sig: new signals.Signal(),
    team_perms_pref_changed_sig: new signals.Signal(),
    onStart: function() {
        if (TS.client) {
            TS.client.login_sig.add(TS.prefs.onLogin, TS.prefs)
        }
    },
    onLogin: function(b, d) {
        var c = TS.boot_data.new_message_sounds;
        for (var a = 0; a < c.length; a++) {
            if (c[a].label == TS.model.prefs.new_msg_snd) {
                TS.warn("corrected TS.model.prefs.new_msg_snd " + c[a].label + " -> " + c[a].value);
                TS.model.prefs.new_msg_snd == c[a].value;
                TS.api.callImmediately("users.prefs.set", {
                    name: "new_msg_snd",
                    value: c[a].value
                });
                break
            }
        }
    },
    setPrefs: function(a) {
        TS.model.prefs = a;
        TS.prefs.setUserColors(TS.model.prefs.user_colors);
        TS.prefs.setLoudChannels(TS.model.prefs.loud_channels);
        TS.prefs.setSuppressedChannels(TS.model.prefs.at_channel_suppressed_channels);
        TS.prefs.setPushSuppressedChannels(TS.model.prefs.push_at_channel_suppressed_channels);
        TS.prefs.setNeverChannels(TS.model.prefs.never_channels);
        TS.prefs.setLoudChannelsSet(TS.model.prefs.loud_channels_set);
        TS.prefs.setPushLoudChannels(TS.model.prefs.push_loud_channels);
        TS.prefs.setPushMentionChannels(TS.model.prefs.push_mention_channels);
        TS.prefs.setPushLoudChannelsSet(TS.model.prefs.push_loud_channels_set);
        TS.prefs.setSearchExcludeChannels(TS.model.prefs.search_exclude_channels);
        if (TS.model.prefs.sidebar_theme_custom_values) {
            TS.prefs.setSidebarThemeCustomValues(JSON.parse(TS.model.prefs.sidebar_theme_custom_values))
        }
        TS.prefs.setEmojiMode();
        TS.prefs.setTheme()
    },
    setHighlightWords: function(a) {
        TS.model.prefs.highlight_words = a;
        TS.model.highlight_words = ["@" + TS.model.user.name, TS.model.user.name, "<@" + TS.model.user.id];
        if (a && typeof a == "string") {
            TS.model.highlight_words = TS.model.highlight_words.concat(a.split(","))
        }
        TS.model.highlight_words_regex = null
    },
    setSuppressedChannels: function(a) {
        TS.model.prefs.at_channel_suppressed_channels = a;
        TS.model.at_channel_suppressed_channels = [];
        if (a && typeof a == "string") {
            TS.model.at_channel_suppressed_channels = TS.model.at_channel_suppressed_channels.concat(a.split(","))
        }
    },
    setPushSuppressedChannels: function(a) {
        TS.model.prefs.push_at_channel_suppressed_channels = a;
        TS.model.push_at_channel_suppressed_channels = [];
        if (a && typeof a == "string") {
            TS.model.push_at_channel_suppressed_channels = TS.model.push_at_channel_suppressed_channels.concat(a.split(","))
        }
    },
    setLoudChannels: function(a) {
        TS.model.prefs.loud_channels = a;
        TS.model.loud_channels = [];
        if (a && typeof a == "string") {
            TS.model.loud_channels = TS.model.loud_channels.concat(a.split(","))
        }
    },
    setNeverChannels: function(a) {
        TS.model.prefs.never_channels = a;
        TS.model.never_channels = [];
        if (a && typeof a == "string") {
            TS.model.never_channels = TS.model.never_channels.concat(a.split(","))
        }
    },
    setLoudChannelsSet: function(a) {
        TS.model.prefs.loud_channels_set = a;
        TS.model.loud_channels_set = [];
        if (a && typeof a == "string") {
            TS.model.loud_channels_set = TS.model.loud_channels_set.concat(a.split(","))
        }
    },
    setPushLoudChannels: function(a) {
        TS.model.prefs.push_loud_channels = a;
        TS.model.push_loud_channels = [];
        if (a && typeof a == "string") {
            TS.model.push_loud_channels = TS.model.push_loud_channels.concat(a.split(","))
        }
    },
    setPushMentionChannels: function(a) {
        TS.model.prefs.push_mention_channels = a;
        TS.model.push_mention_channels = [];
        if (a && typeof a == "string") {
            TS.model.push_mention_channels = TS.model.push_mention_channels.concat(a.split(","))
        }
    },
    setPushLoudChannelsSet: function(a) {
        TS.model.prefs.push_loud_channels_set = a;
        TS.model.push_loud_channels_set = [];
        if (a && typeof a == "string") {
            TS.model.push_loud_channels_set = TS.model.push_loud_channels_set.concat(a.split(","))
        }
    },
    setSearchExcludeChannels: function(a) {
        TS.model.prefs.search_exclude_channels = a;
        TS.model.search_exclude_channels = [];
        if (a && typeof a == "string") {
            TS.model.search_exclude_channels = TS.model.search_exclude_channels.concat(a.split(","))
        }
    },
    setUserColors: function(a) {
        TS.model.prefs.user_colors = a;
        var b = (a) ? JSON.parse(a) : {};
        TS.model.user_colors = b || {}
    },
    setTheme: function(a) {
        if (TS.model.prefs.messages_theme == "default") {
            TS.model.prefs.messages_theme = "light_with_avatars"
        }
        TS.model.prefs.theme = "light";
        TS.model.prefs.avatars = true;
        if (TS.model.prefs.messages_theme == "dense") {
            TS.model.prefs.theme = "dense";
            TS.model.prefs.avatars = false
        } else {
            if (TS.model.prefs.messages_theme == "light") {
                TS.model.prefs.theme = "light";
                TS.model.prefs.avatars = false
            } else {
                if (TS.model.prefs.messages_theme == "light_with_avatars") {
                    TS.model.prefs.theme = "light";
                    TS.model.prefs.avatars = true
                }
            }
        }
    },
    onTeamPrefChanged: function(a) {
        if (a.name == "msg_edit_window_mins") {
            TS.model.team.prefs.msg_edit_window_mins = a.value
        } else {
            if (a.name == "allow_message_deletion") {
                TS.model.team.prefs.allow_message_deletion = !!a.value
            } else {
                if (a.name == "hide_referers") {
                    TS.model.team.prefs.hide_referers = !!a.value;
                    TS.prefs.team_hide_referers_changed_sig.dispatch()
                } else {
                    if (a.name == "display_real_names") {
                        TS.model.team.prefs.display_real_names = !!a.value;
                        TS.prefs.team_display_real_names_changed_sig.dispatch()
                    } else {
                        if (a.name.indexOf("who_can_") == 0) {
                            if (TS.model.team.prefs[a.name] != a.value) {
                                TS.model.team.prefs[a.name] = a.value;
                                TS.prefs.team_perms_pref_changed_sig.dispatch(a.name)
                            }
                        } else {
                            TS.model.team.prefs[a.name] = a.value
                        }
                    }
                }
            }
        }
    },
    onPrefChanged: function(a) {
        if (a.name == "color_names_in_list") {
            TS.model.prefs.color_names_in_list = !!a.value;
            TS.prefs.color_names_in_list_changed_sig.dispatch()
        } else {
            if (a.name == "display_real_names_override") {
                TS.model.prefs.display_real_names_override = a.value;
                TS.prefs.display_real_names_override_changed_sig.dispatch()
            } else {
                if (a.name == "growls_enabled") {
                    TS.model.prefs.growls_enabled = !!a.value;
                    TS.prefs.dtop_notif_changed_sig.dispatch()
                } else {
                    if (a.name == "sidebar_theme") {
                        if (TS.model.prefs.sidebar_theme !== a.value) {
                            TS.model.prefs.sidebar_theme = a.value;
                            TS.prefs.sidebar_theme_changed_sig.dispatch()
                        }
                    } else {
                        if (a.name == "sidebar_theme_custom_values") {
                            if (TS.model.prefs.sidebar_theme_custom_values !== a.value) {
                                TS.prefs.setSidebarThemeCustomValues(JSON.parse(a.value));
                                TS.prefs.sidebar_theme_changed_sig.dispatch()
                            }
                        } else {
                            if (a.name == "expand_inline_imgs") {
                                TS.model.prefs.expand_inline_imgs = !!a.value;
                                TS.prefs.expand_inline_imgs_changed_sig.dispatch()
                            } else {
                                if (a.name == "webapp_spellcheck") {
                                    TS.model.prefs.webapp_spellcheck = !!a.value;
                                    TS.prefs.webapp_spellcheck_changed_sig.dispatch()
                                } else {
                                    if (a.name == "expand_internal_inline_imgs") {
                                        TS.model.prefs.expand_internal_inline_imgs = !!a.value;
                                        TS.prefs.expand_internal_inline_imgs_changed_sig.dispatch()
                                    } else {
                                        if (a.name == "expand_non_media_attachments") {
                                            TS.model.prefs.expand_non_media_attachments = !!a.value;
                                            TS.prefs.expand_non_media_attachments_changed_sig.dispatch()
                                        } else {
                                            if (a.name == "messages_theme") {
                                                TS.model.prefs.messages_theme = a.value;
                                                TS.prefs.setTheme();
                                                TS.prefs.messages_theme_changed_sig.dispatch()
                                            } else {
                                                if (a.name == "show_member_presence") {
                                                    TS.model.prefs.show_member_presence = !!a.value;
                                                    TS.prefs.show_member_presence_changed_sig.dispatch()
                                                } else {
                                                    if (a.name == "highlight_words") {
                                                        TS.prefs.setHighlightWords(a.value);
                                                        TS.prefs.highlight_words_changed_sig.dispatch()
                                                    } else {
                                                        if (a.name == "at_channel_suppressed_channels") {
                                                            TS.prefs.setSuppressedChannels(a.value);
                                                            TS.prefs.dtop_notif_changed_sig.dispatch()
                                                        } else {
                                                            if (a.name == "push_at_channel_suppressed_channels") {
                                                                TS.prefs.setPushSuppressedChannels(a.value);
                                                                TS.prefs.push_changed_sig.dispatch()
                                                            } else {
                                                                if (a.name == "loud_channels") {
                                                                    TS.prefs.setLoudChannels(a.value)
                                                                } else {
                                                                    if (a.name == "never_channels") {
                                                                        TS.prefs.setNeverChannels(a.value)
                                                                    } else {
                                                                        if (a.name == "loud_channels_set") {
                                                                            TS.prefs.setLoudChannelsSet(a.value);
                                                                            TS.prefs.dtop_notif_changed_sig.dispatch()
                                                                        } else {
                                                                            if (a.name == "push_loud_channels") {
                                                                                TS.prefs.setPushLoudChannels(a.value)
                                                                            } else {
                                                                                if (a.name == "push_mention_channels") {
                                                                                    TS.prefs.setPushMentionChannels(a.value)
                                                                                } else {
                                                                                    if (a.name == "push_loud_channels_set") {
                                                                                        TS.prefs.setPushLoudChannelsSet(a.value);
                                                                                        TS.prefs.push_changed_sig.dispatch()
                                                                                    } else {
                                                                                        if (a.name == "user_colors") {
                                                                                            var c;
                                                                                            var b;
                                                                                            for (b in TS.model.user_colors) {
                                                                                                c = TS.members.getMemberById(b);
                                                                                                if (c) {
                                                                                                    TS.members.setMemberUserColor(c, c.color)
                                                                                                }
                                                                                            }
                                                                                            TS.prefs.setUserColors(a.value);
                                                                                            for (b in TS.model.user_colors) {
                                                                                                c = TS.members.getMemberById(b);
                                                                                                if (c) {
                                                                                                    TS.members.setMemberUserColor(c, TS.model.user_colors[b])
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            if (a.name == "graphic_emoticons") {
                                                                                                TS.model.prefs.graphic_emoticons = a.value;
                                                                                                TS.prefs.setEmojiMode();
                                                                                                TS.prefs.emoji_mode_changed_sig.dispatch()
                                                                                            } else {
                                                                                                if (a.name == "ss_emojis") {
                                                                                                    TS.model.prefs.ss_emojis = a.value;
                                                                                                    TS.prefs.setEmojiMode();
                                                                                                    TS.prefs.emoji_mode_changed_sig.dispatch();
                                                                                                    TS.ui.makeEmoticonList()
                                                                                                } else {
                                                                                                    if (a.name == "emoji_mode") {
                                                                                                        TS.model.prefs.emoji_mode = a.value;
                                                                                                        TS.prefs.setEmojiMode();
                                                                                                        TS.prefs.emoji_mode_changed_sig.dispatch();
                                                                                                        TS.ui.makeEmoticonList()
                                                                                                    } else {
                                                                                                        if (a.name == "obey_inline_img_limit") {
                                                                                                            TS.model.prefs.obey_inline_img_limit = a.value;
                                                                                                            TS.prefs.obey_inline_img_limit_changed_sig.dispatch()
                                                                                                        } else {
                                                                                                            if (a.name == "search_only_my_channels") {
                                                                                                                TS.model.prefs.search_only_my_channels = !!a.value;
                                                                                                                TS.prefs.search_only_my_channels_changed_sig.dispatch()
                                                                                                            } else {
                                                                                                                if (a.name == "search_exclude_channels") {
                                                                                                                    TS.prefs.setSearchExcludeChannels(a.value);
                                                                                                                    TS.prefs.search_exclude_channels_changed_sig.dispatch()
                                                                                                                } else {
                                                                                                                    if (a.name == "has_uploaded") {
                                                                                                                        TS.model.prefs.has_uploaded = !!a.value;
                                                                                                                        TS.newxp.updateStartChecks()
                                                                                                                    } else {
                                                                                                                        if (a.name == "has_invited") {
                                                                                                                            TS.model.prefs.has_invited = !!a.value;
                                                                                                                            TS.newxp.updateStartChecks()
                                                                                                                        } else {
                                                                                                                            if (a.name == "has_created_channel") {
                                                                                                                                TS.model.prefs.has_created_channel = !!a.value;
                                                                                                                                TS.newxp.updateStartChecks()
                                                                                                                            } else {
                                                                                                                                if (a.name == "no_joined_overlays") {
                                                                                                                                    TS.model.prefs.no_joined_overlays = !!a.value
                                                                                                                                } else {
                                                                                                                                    if (a.name == "no_created_overlays") {
                                                                                                                                        TS.model.prefs.no_created_overlays = !!a.value
                                                                                                                                    } else {
                                                                                                                                        if (a.name == "seen_welcome_2") {
                                                                                                                                            TS.model.prefs.seen_welcome_2 = !!a.value;
                                                                                                                                            TS.prefs.seen_welcome_2_changed_sig.dispatch()
                                                                                                                                        } else {
                                                                                                                                            if (a.name == "dropbox_enabled") {
                                                                                                                                                TS.model.prefs.dropbox_enabled = !!a.value;
                                                                                                                                                TS.prefs.dropbox_enabled_changed_sig.dispatch()
                                                                                                                                            } else {
                                                                                                                                                if (a.name == "collapsible") {
                                                                                                                                                    if (TS.model.prefs.collapsible !== !!a.value) {
                                                                                                                                                        TS.model.prefs.collapsible = !!a.value;
                                                                                                                                                        TS.prefs.collapsible_changed_sig.dispatch()
                                                                                                                                                    }
                                                                                                                                                } else {
                                                                                                                                                    if (a.name == "collapsible_by_click") {
                                                                                                                                                        if (TS.model.prefs.collapsible_by_click !== !!a.value) {
                                                                                                                                                            TS.model.prefs.collapsible_by_click = !!a.value;
                                                                                                                                                            TS.prefs.collapsible_changed_sig.dispatch()
                                                                                                                                                        }
                                                                                                                                                    } else {
                                                                                                                                                        if (a.name == "mark_msgs_read_immediately") {
                                                                                                                                                            if (TS.model.prefs.mark_msgs_read_immediately !== !!a.value) {
                                                                                                                                                                TS.model.prefs.mark_msgs_read_immediately = !!a.value;
                                                                                                                                                                TS.prefs.read_changed_sig.dispatch()
                                                                                                                                                            }
                                                                                                                                                        } else {
                                                                                                                                                            if (a.name == "start_scroll_at_oldest") {
                                                                                                                                                                if (TS.model.prefs.start_scroll_at_oldest !== !!a.value) {
                                                                                                                                                                    TS.model.prefs.start_scroll_at_oldest = !!a.value;
                                                                                                                                                                    TS.prefs.read_changed_sig.dispatch()
                                                                                                                                                                }
                                                                                                                                                            } else {
                                                                                                                                                                if (a.name == "mac_ssb_bullet") {
                                                                                                                                                                    if (TS.model.prefs.mac_ssb_bullet !== !!a.value) {
                                                                                                                                                                        TS.model.prefs.mac_ssb_bullet = !!a.value;
                                                                                                                                                                        TS.prefs.mac_ssb_bullet_changed_sig.dispatch()
                                                                                                                                                                    }
                                                                                                                                                                } else {
                                                                                                                                                                    if (a.name == "all_channels_loud") {
                                                                                                                                                                        if (TS.model.prefs.all_channels_loud !== !!a.value) {
                                                                                                                                                                            TS.model.prefs.all_channels_loud = !!a.value;
                                                                                                                                                                            TS.prefs.dtop_notif_changed_sig.dispatch()
                                                                                                                                                                        }
                                                                                                                                                                    } else {
                                                                                                                                                                        if (a.name == "push_everything") {
                                                                                                                                                                            if (TS.model.prefs.push_everything !== !!a.value) {
                                                                                                                                                                                TS.model.prefs.push_everything = !!a.value;
                                                                                                                                                                                TS.prefs.push_changed_sig.dispatch()
                                                                                                                                                                            }
                                                                                                                                                                        } else {
                                                                                                                                                                            if (a.name == "push_mention_alert") {
                                                                                                                                                                                if (TS.model.prefs.push_mention_alert !== !!a.value) {
                                                                                                                                                                                    TS.model.prefs.push_mention_alert = !!a.value;
                                                                                                                                                                                    TS.prefs.push_changed_sig.dispatch()
                                                                                                                                                                                }
                                                                                                                                                                            } else {
                                                                                                                                                                                if (a.name == "push_dm_alert") {
                                                                                                                                                                                    if (TS.model.prefs.push_dm_alert !== !!a.value) {
                                                                                                                                                                                        TS.model.prefs.push_dm_alert = !!a.value;
                                                                                                                                                                                        TS.prefs.push_changed_sig.dispatch()
                                                                                                                                                                                    }
                                                                                                                                                                                } else {
                                                                                                                                                                                    if (a.name == "time24") {
                                                                                                                                                                                        if (TS.model.prefs.time24 !== !!a.value) {
                                                                                                                                                                                            TS.model.prefs.time24 = !!a.value;
                                                                                                                                                                                            TS.prefs.time24_changed_sig.dispatch()
                                                                                                                                                                                        }
                                                                                                                                                                                    } else {
                                                                                                                                                                                        if (a.name == "sidebar_behavior") {
                                                                                                                                                                                            if (TS.model.prefs.sidebar_behavior != a.value) {
                                                                                                                                                                                                TS.model.prefs.sidebar_behavior = a.value;
                                                                                                                                                                                                TS.prefs.sidebar_behavior_changed_sig.dispatch()
                                                                                                                                                                                            }
                                                                                                                                                                                        } else {
                                                                                                                                                                                            TS.model.prefs[a.name] = a.value
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
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    hex_regex: new RegExp(/^#?([0-9a-f]{6})$/i),
    setSidebarThemeCustomValues: function(b) {
        var c = false;
        if (b && typeof b === "object" && b.length === undefined) {
            for (var a in b) {
                c = false;
                if (!b[a]) {
                    break
                }
                if (!b[a].substr) {
                    break
                }
                b[a] = b[a].substr(0, 7);
                if (!b[a].match(TS.prefs.hex_regex)) {
                    break
                }
                c = true
            }
        }
        if (c) {
            TS.model.prefs.sidebar_theme_custom_values = JSON.stringify(b)
        } else {
            TS.model.prefs.sidebar_theme = "default";
            TS.model.prefs.sidebar_theme_custom_values = JSON.stringify(TS.ui.sidebar_themes.default_themes.default_theme)
        }
    },
    setEmojiMode: function() {
        emoji.text_mode = TS.model.prefs.emoji_mode == "as_text";
        emoji.do_emoticons = !!TS.model.prefs.graphic_emoticons;
        emoji.allow_native = false;
        emoji.use_sheet = !!TS.model.prefs.ss_emojis && TS.client;
        emoji.data["00a9"] = TS.utility.clone(emoji.unaltered_data["00a9"]);
        emoji.data["00ae"] = TS.utility.clone(emoji.unaltered_data["00ae"]);
        if (TS.model.prefs.emoji_mode == "google") {
            emoji.img_path = "https://slack-assets2.s3-us-west-2.amazonaws.com/19692/img/emoji-hangouts-v2/";
            emoji.sheet_path = "https://slack.global.ssl.fastly.net/19679/img/emoji_hangouts_64_indexed_256colors.png";
            if (TS.model.mac_ssb_version >= 0.44) {
                emoji.sheet_path = "slack-resources:emoji_hangouts_64_indexed_256colors.png"
            }
        } else {
            if (TS.model.prefs.emoji_mode == "twitter") {
                emoji.data["00a9"][4] = emoji.data["00a9"][5] = null;
                emoji.data["00a9"][7] = "https://slack.global.ssl.fastly.net/19678/img/emoji-hangouts/00a9.png";
                emoji.data["00a9"][8] = true;
                emoji.data["00ae"][4] = emoji.data["00ae"][5] = null;
                emoji.data["00ae"][7] = "https://slack.global.ssl.fastly.net/19678/img/emoji-hangouts/00ae.png";
                emoji.data["00a9"][8] = true;
                emoji.img_path = "https://slack-assets2.s3-us-west-2.amazonaws.com/19166/img/emoji-twitter/";
                emoji.sheet_path = "https://slack.global.ssl.fastly.net/19218/img/emoji_twitter_64_indexed_256colors.png";
                if (TS.model.mac_ssb_version >= 0.43) {
                    emoji.sheet_path = "slack-resources:emoji_twitter_64_indexed_256colors.png"
                }
            } else {
                emoji.img_path = "https://slack-assets2.s3-us-west-2.amazonaws.com/5504/img/emoji/";
                emoji.sheet_path = "https://slack.global.ssl.fastly.net/20655/img/emoji_apple_64_indexed_256colors.png";
                if (TS.model.mac_ssb_version >= 0.43) {
                    emoji.sheet_path = "slack-resources:emoji_apple_64_indexed_256colors.png"
                }
            }
        }
    },
    setMultiPrefsByAPI: function(c, d) {
        var e = "";
        for (var a in c) {
            e += "&" + encodeURIComponent(a) + "=" + encodeURIComponent(c[a])
        }
        if (!e) {
            TS.error(" no prefs to set?");
            return
        }
        var b = {
            prefs: e
        };
        TS.prefs.setPrefByAPI(b, d)
    },
    setPrefByAPI: function(a, b) {
        var c = function(f, g, d) {
            if (!f) {
                var j = "args:" + JSON.stringify(d) + " ";
                try {
                    j += "data:" + JSON.stringify(g)
                } catch (h) {
                    j += "data2:" + g
                }
                TS.logError({
                    message: "TS.prefs.setPrefByAPI call got a not ok rsp"
                }, j);
                setTimeout(function() {
                    if (d.prefs) {
                        alert("multi preferences setting failed.")
                    } else {
                        alert('"' + d.name + '" preference setting failed.')
                    }
                }, 0)
            }
            if (b) {
                b(f, g, d)
            }
        };
        TS.api.call("users.prefs.set", a, c)
    },
    saveHighlightWords: function(e, g, c) {
        var a = $.trim(e.replace(/\, /g, ",")).split(",");
        var f = [];
        for (var b = 0; b < a.length; b++) {
            if (a[b]) {
                f.push(a[b])
            }
        }
        var d = f.join(",");
        if (c || TS.model.prefs.highlight_words != d) {
            TS.prefs.setPrefByAPI({
                name: "highlight_words",
                value: d
            }, g)
        }
    },
    getReadStateTrackingPref: function() {
        var a = "default";
        if (TS.model.prefs.mark_msgs_read_immediately && TS.model.prefs.start_scroll_at_oldest) {
            a = "immediate_scroll"
        } else {
            if (TS.model.prefs.mark_msgs_read_immediately) {
                a = "immediate"
            }
        }
        return a
    },
    setReadStateTrackingPref: function(c, b) {
        var a = {};
        if (c == "immediate_scroll" || c == "immediate") {
            a.mark_msgs_read_immediately = true;
            TS.model.prefs.mark_msgs_read_immediately = true;
            if (c == "immediate_scroll") {
                a.start_scroll_at_oldest = true;
                TS.model.prefs.start_scroll_at_oldest = true
            } else {
                a.start_scroll_at_oldest = false;
                TS.model.prefs.start_scroll_at_oldest = false
            }
        } else {
            a.mark_msgs_read_immediately = false;
            TS.model.prefs.mark_msgs_read_immediately = false;
            a.start_scroll_at_oldest = false;
            TS.model.prefs.start_scroll_at_oldest = false
        }
        TS.prefs.setMultiPrefsByAPI(a, b)
    }
});
TS.registerModule("search", {
    search_dispatched_sig: new signals.Signal(),
    quick_search_results_fetched_sig: new signals.Signal(),
    all_search_results_fetched_sig: new signals.Signal(),
    autosuggest_search_results_fetched_sig: new signals.Signal(),
    search_filter_set_sig: new signals.Signal(),
    search_filetype_filter_set_sig: new signals.Signal(),
    search_sort_set_sig: new signals.Signal(),
    search_channel_set_sig: new signals.Signal(),
    search_group_set_sig: new signals.Signal(),
    search_member_set_sig: new signals.Signal(),
    message_search_more_results_fetched_sig: new signals.Signal(),
    message_search_expansion_fetched_sig: new signals.Signal(),
    query: "",
    query_string: "",
    last_search_query: "",
    previous_query: "",
    sort: "timestamp",
    filter: "messages",
    filetype: "all",
    results: {},
    submit_tim: 0,
    delay: 500,
    suggestions: [],
    input: "",
    from_regex: /from:[@*\-.\w]+/gi,
    member: null,
    from: null,
    in_regex: /in:[#*\-\w]+/gi,
    channel: null,
    group: null,
    im: null,
    per_page: -1,
    search_query_max_length: 250,
    onStart: function() {
        TS.search.per_page = parseInt(TS.qs_args.search_count) || 40;
        if (TS.client) {
            TS.client.login_sig.add(TS.search.loggedIn, TS.search)
        } else {
            if (TS.web) {
                TS.web.login_sig.add(TS.search.loggedIn, TS.search)
            }
        }
        TS.search.search_channel_set_sig.add(TS.search.searchAll, TS.search);
        TS.search.search_group_set_sig.add(TS.search.searchAll, TS.search);
        TS.search.search_member_set_sig.add(TS.search.searchAll, TS.search);
        TS.prefs.search_only_my_channels_changed_sig.add(TS.search.searchAll, TS.search);
        if (TS.qs_args.delay) {
            TS.search.delay = TS.qs_args.delay
        }
        TS.search.input = $("#search_terms")
    },
    loggedIn: function() {
        var a = TS.model.prefs.search_sort;
        TS.search.sort = (a == "score" || a == "timestamp") ? a : TS.search.sort
    },
    startSearchTimer: function(b, a, c) {
        clearTimeout(TS.search.submit_tim);
        TS.search.submit_tim = setTimeout(TS.search.dispatchSearch, TS.search.delay, b, a, c);
        TS.search.search_dispatched_sig.dispatch()
    },
    getNextPageOfSearchResults: function(b, a) {
        TS.search.dispatchSearch(b, TS.search.per_page, TS.search.onSearchAll, a)
    },
    dispatchSearch: function(d, b, e, c) {
        var a = {
            query: d,
            highlight: true,
            count: b,
            types: [TS.search.filetype],
            sort: TS.search.sort,
            no_posts: 1,
            more_matches: true,
            page: c || 1,
            include_attachments: TS.boot_data.feature_search_attachments == true
        };
        if (TS.boot_data.feature_search_extracts) {
            a.extracts = 1;
            a.extra_message_data = 1;
            a.max_extract_len = 100
        }
        TS.api.call("search.all", a, e)
    },
    setFilter: function(a) {
        TS.search.filter = a;
        TS.search.search_filter_set_sig.dispatch()
    },
    setFiletypeFilter: function(a) {
        TS.search.filetype = a;
        TS.search.search_filetype_filter_set_sig.dispatch()
    },
    setSort: function(a) {
        if (TS.search.sort == a) {
            return
        }
        $(".search_toggle").toggleClass("active");
        TS.search.sort = a;
        TS.search.search_sort_set_sig.dispatch();
        TS.prefs.setPrefByAPI({
            name: "search_sort",
            value: (a == "score" ? "score" : "timestamp")
        })
    },
    setChannel: function(b) {
        var a = TS.channels.getChannelById(b);
        if (a) {
            TS.search.channel = a;
            TS.search.group = null;
            TS.search.im = null
        } else {
            TS.search.channel = null
        }
        TS.search.search_channel_set_sig.dispatch()
    },
    setGroup: function(b) {
        var a = TS.groups.getGroupById(b);
        if (a) {
            TS.search.group = a;
            TS.search.channel = null;
            TS.search.im = null
        } else {
            TS.search.group = null
        }
        TS.search.search_group_set_sig.dispatch()
    },
    setMember: function(d) {
        var c = TS.members.getMemberById(d);
        if (c) {
            TS.search.member = c
        } else {
            TS.search.member = null;
            TS.search.from = null;
            var a = $.trim(TS.search.input.val());
            var b = a.match(TS.search.from_regex);
            if (b) {
                $.each(b, function(f, e) {
                    a = $.trim(a.replace(e, ""))
                });
                TS.search.input.val(a)
            }
        }
        TS.search.search_member_set_sig.dispatch()
    },
    buildQueryString: function(d, c) {
        var b = d.match(TS.search.from_regex);
        if (b) {
            var f = false;
            $.each(b, function(j, h) {
                if (f) {
                    d = $.trim(d.replace(h, ""))
                } else {
                    var g = h.replace("from:", "");
                    if (g.toLowerCase() == "me") {
                        if (c) {
                            TS.search.member = TS.model.user
                        }
                        TS.search.from = null;
                        f = true
                    } else {
                        var k = TS.members.getMemberByName(g);
                        if (k) {
                            if (c) {
                                TS.search.member = k
                            }
                            TS.search.from = null;
                            f = true
                        } else {
                            if (c) {
                                TS.search.from = g;
                                TS.search.member = null
                            } else {
                                if (TS.search.member) {
                                    TS.search.from = null
                                }
                            }
                            f = true
                        }
                    } if (f) {
                        d = $.trim(d.replace(h, ""))
                    }
                }
            })
        } else {
            if (!TS.search.view.advanced_options && TS.search.filter == "messages") {
                TS.search.member = null;
                TS.search.from = null
            }
        }
        var a = d.match(TS.search.in_regex);
        if (a) {
            var e = false;
            $.each(a, function(k, j) {
                if (e) {
                    d = $.trim(d.replace(j, ""))
                } else {
                    var h = j.replace("in:", "");
                    var l = TS.channels.getChannelByName(h);
                    var m = TS.groups.getGroupByName(h);
                    var g = TS.ims.getImByUsername(h);
                    if (l) {
                        e = true;
                        if (c) {
                            TS.search.channel = l;
                            TS.search.group = null;
                            TS.search.im = null
                        }
                    } else {
                        if (m) {
                            e = true;
                            if (c) {
                                TS.search.group = m;
                                TS.search.channel = null;
                                TS.search.im = null
                            }
                        } else {
                            if (g) {
                                e = true;
                                if (c) {
                                    TS.search.im = g;
                                    TS.search.channel = null;
                                    TS.search.group = null
                                }
                            } else {
                                TS.info("Unable to filter search results by channel, group, or IM named '" + h + "'")
                            }
                        }
                    }
                    e = true
                } if (e) {
                    d = $.trim(d.replace(j, ""))
                }
            })
        } else {
            if (!TS.search.view.advanced_options) {
                TS.search.channel = null;
                TS.search.group = null;
                TS.search.im = null
            }
        } if (!b) {
            if (TS.search.previous_query == TS.search.query && c) {
                TS.search.member = null;
                TS.search.from = null
            }
        }
        if (!a) {
            if (TS.search.previous_query == TS.search.query && c) {
                TS.search.channel = null;
                TS.search.group = null;
                TS.search.im = null
            }
        }
        TS.search.query = $.trim(d);
        TS.search.query_string = TS.search.query;
        if (TS.search.member != null) {
            TS.search.query_string += " from:" + TS.search.member.name
        }
        if (TS.search.from != null) {
            TS.search.query_string += " from:" + TS.search.from
        }
        if (TS.search.channel != null) {
            TS.search.query_string += " in:" + TS.search.channel.name
        }
        if (TS.search.group != null) {
            TS.search.query_string += " in:" + TS.search.group.name
        }
        if (TS.search.im != null) {
            TS.search.query_string += " in:" + TS.search.im.name
        }
        TS.search.query_string = $.trim(TS.search.query_string)
    },
    quickSearch: function(b) {
        TS.search.query = b;
        TS.search.buildQueryString(b);
        var a = 5;
        TS.search.startSearchTimer(b, a, TS.search.onQuickSearch)
    },
    onQuickSearch: function(b, c, a) {
        if (!b) {
            return
        }
        TS.search.quick_search_results_fetched_sig.dispatch(c)
    },
    searchAll: function(b) {
        clearTimeout(TS.search.widget.key_tim);
        var a;
        TS.search.previous_query = TS.search.query;
        if (b) {
            TS.search.query = b;
            a = true
        } else {
            TS.search.query = $.trim(TS.search.input.val());
            if (TS.search.previous_query == b) {
                a = true
            } else {
                a = false
            }
        }
        TS.search.buildQueryString(TS.search.query, a);
        if (TS.search.query_string) {
            TS.search.startSearchTimer(TS.search.query_string, TS.search.per_page, TS.search.onSearchAll)
        } else {
            TS.search.view.updateOptions();
            TS.search.widget.stopSpinner()
        }
    },
    onSearchAll: function(b, d, a) {
        if (TS.qs_args.force_search_fail == "1") {
            window.failed_once = true;
            b = false;
            d = {
                ok: false,
                error: "solr_failed"
            }
        }
        if (!b) {
            var e = (d && d.error) ? d.error : "unknown_error";
            if (!d) {
                d = {
                    ok: false,
                    error: e
                }
            }
            d.query = d.query || a.query;
            d.messages = d.messages || {
                total: 0,
                paging: {
                    count: TS.search.per_page,
                    total: 0,
                    page: 1,
                    pages: 0
                },
                matches: []
            };
            d.files = d.files || {
                total: 0,
                paging: {
                    count: TS.search.per_page,
                    total: 0,
                    page: 1,
                    pages: 0
                },
                matches: []
            }
        }
        if (a.query != TS.search.query_string) {
            if (!TS.search.results[a.query] || !TS.search.results[a.query].error) {
                return
            }
        }
        TS.search.last_search_query = a.query;
        if (TS.client) {
            TS.search.upsertFiles(d)
        }
        TS.search.expandChannelsAndCheckForMsgsInModel(d);
        if (a.page == 1) {
            TS.search.results[a.query] = d;
            TS.search.results[a.query]["_time_of_search"] = TS.utility.date.getTimeStamp();
            TS.search.all_search_results_fetched_sig.dispatch(d, a);
            TS.search.getNextPageOfSearchResults(a.query, 2)
        } else {
            var c = TS.search.results[a.query];
            if (c.messages.matches) {
                d.messages.matches = c.messages.matches.concat(d.messages.matches)
            }
            if (c.files.matches) {
                d.files.matches = c.files.matches.concat(d.files.matches)
            }
            TS.search.results[a.query] = d;
            TS.search.all_search_results_fetched_sig.dispatch(d, a)
        }
    },
    searchSuggest: function(a) {
        TS.api.call("search.autocomplete", {
            query: a
        }, TS.search.onSearchSuggest)
    },
    onSearchSuggest: function(b, c, a) {
        if (TS.search.widget.suppress_suggestions) {
            TS.search.widget.suppress_suggestions = false;
            return
        }
        if (!b) {
            return
        }
        TS.search.suggestions = [];
        if (c.suggestions[0] == TS.search.query && c.suggestions.length == 1) {
            TS.search.suggestions = []
        } else {
            $.each(c.suggestions, function(d, e) {
                TS.search.suggestions[d] = {
                    value: e,
                    highlighted: TS.search.highlightSuggestion(TS.utility.htmlEntities(e))
                }
            })
        }
        TS.search.autosuggest_search_results_fetched_sig.dispatch(c, a)
    },
    highlightSuggestion: function(b) {
        var a = b.replace(new RegExp("(" + TS.utility.preg_quote(TS.search.input.val()) + ")", "gi"), "<b>$1</b>");
        return a
    },
    expandChannelsAndCheckForMsgsInModel: function(d) {
        var b;
        var a;
        if (!d.messages || !d.messages.matches) {
            return
        }
        for (var c = 0; c < d.messages.matches.length; c++) {
            b = d.messages.matches[c];
            if (!b) {
                continue
            }
            TS.utility.msgs.processAttachments(b.attachments);
            if (b.next) {
                TS.utility.msgs.processAttachments(b.next.attachments)
            }
            if (b.next_2) {
                TS.utility.msgs.processAttachments(b.next_2.attachments)
            }
            if (b.previous) {
                TS.utility.msgs.processAttachments(b.previous.attachments)
            }
            if (b.previous_2) {
                TS.utility.msgs.processAttachments(b.previous_2.attachments)
            }
            a = TS.shared.getModelObById(b.channel.id);
            if (a) {
                if (a.msgs) {
                    b.is_loaded = !!TS.utility.msgs.getMsg(b.ts, a.msgs)
                } else {
                    if (TS.client) {
                        TS.warn(a.name + " has no msgs")
                    }
                }
                b.channel = a;
                if (!b.permalink) {
                    b.permalink = TS.utility.msgs.constructMsgPermalink(a, b.ts)
                }
            }
        }
    },
    upsertFiles: function(b) {
        if (!b.files || !b.files.matches) {
            return
        }
        for (var a = 0; a < b.files.matches.length; a++) {
            if (b.files.matches[a].preview) {
                b.files.matches[a].preview_search = b.files.matches[a].preview;
                delete b.files.matches[a].preview
            }
            b.files.matches[a] = TS.files.upsertFile(b.files.matches[a]).file
        }
    },
    getResultsByQuery: function(a) {
        return TS.search.results[a]
    },
    getMatchByQueryAndTs: function(b, a) {
        return TS.search.getMatchByQueryByThings(b, a)
    },
    getMatchByQueryAndChannelAndTs: function(c, a, b) {
        return TS.search.getMatchByQueryByThings(c, b, a)
    },
    getMatchByQueryByThings: function(d, c, a) {
        var b = TS.search.getResultsByQuery(d);
        if (!b) {
            TS.error("WTF no results?");
            return null
        }
        return TS.search.getMatchFromResultsByThings(false, b, c, a)
    },
    getMatchFromResultsByThings: function(f, d, e, a) {
        if (!d) {
            TS.error("WTF no results?");
            return null
        }
        if (!d.messages) {
            TS.error("WTF no results.messages?");
            return null
        }
        if (!d.messages.matches) {
            TS.error("WTF no results.messages.matches?");
            return null
        }
        var b;
        for (var c = 0; c < d.messages.matches.length; c++) {
            b = d.messages.matches[c];
            if (!b) {
                TS.error("WTF no match?");
                continue
            }
            if ((!a || b.channel.id == a) && b.ts == e) {
                if (f) {
                    return {
                        match: b,
                        index: c
                    }
                } else {
                    return b
                }
            }
        }
        return null
    },
    removeExpansions: function(a) {
        a.expands_cnt = 0;
        a.previous_expands = null;
        a.next_expands = null
    },
    big_expand_count: 6,
    small_expand_count: 2,
    expandMatch: function(b) {
        b.expands_cnt = b.expands_cnt || 0;
        b.previous_expands = b.previous_expands || [];
        b.next_expands = b.next_expands || [];
        var f = (b.next || b.previous || b.expands_cnt) ? TS.search.big_expand_count : TS.search.small_expand_count;
        var d = 0;
        var e = 0;
        var c;
        if (b.previous_expands.length) {
            c = b.previous_expands[0].ts
        } else {
            if (b.previous_2 && b.previous_2.ts) {
                c = b.previous_2.ts
            } else {
                if (b.previous && b.previous.ts) {
                    c = b.previous.ts
                } else {
                    c = b.ts
                }
            }
        } if (c) {
            d++;
            TS.api.call("search.context", {
                channel: b.channel.id,
                latest: c,
                count: f,
                include_attachments: TS.boot_data.feature_search_attachments == true,
                extra_message_data: TS.boot_data.feature_search_extracts == true
            }, a)
        }
        var g;
        if (b.next_expands.length) {
            g = b.next_expands[b.next_expands.length - 1].ts
        } else {
            if (b.next_2 && b.next_2.ts) {
                g = b.next_2.ts
            } else {
                if (b.next && b.next.ts) {
                    g = b.next.ts
                } else {
                    g = b.ts
                }
            }
        } if (g) {
            d++;
            TS.api.call("search.context", {
                channel: b.channel.id,
                oldest: g,
                count: f,
                include_attachments: TS.boot_data.feature_search_attachments == true,
                extra_message_data: TS.boot_data.feature_search_extracts == true
            }, a)
        }

        function a(k, l, h) {
            e++;
            if (k) {
                for (var j = 0; j < l.messages.length; j++) {
                    TS.utility.msgs.processAttachments(l.messages[j].attachments)
                }
                if (h.oldest) {
                    b.next_expands = b.next_expands.concat(l.messages)
                } else {
                    if (h.latest) {
                        b.previous_expands = l.messages.reverse().concat(b.previous_expands)
                    }
                }
            }
            if (d == e) {
                b.expands_cnt++;
                TS.search.message_search_expansion_fetched_sig.dispatch(b)
            }
        }
        if (!d) {
            b.expands_cnt++;
            TS.search.message_search_expansion_fetched_sig.dispatch(b)
        }
    },
    truncateQuery: function(a) {
        if (a.length > TS.search.search_query_max_length) {
            return a.substring(0, TS.search.search_query_max_length)
        }
        return a
    }
});
TS.registerModule("socket", {
    ping_interv: 0,
    ping_interv_ms: 3000,
    connect_timeout_tim: 0,
    connect_timeout_tim_ms: 0,
    connect_ws_timeout_tim_ms: 10000,
    connect_flash_timeout_tim_ms: 20000,
    hello_timeout_tim: 0,
    hello_timeout_tim_ms: 10000,
    disconnect_timeout_tim: 0,
    disconnect_timeout_tim_ms: 5000,
    recconnect_interv: 0,
    recconnect_interv_ms: 1000,
    auto_reconnect_tim: 0,
    websocket: null,
    msg_id: 0,
    sent_map: {},
    last_pong_time: 0,
    check_last_pong_time: false,
    pong_timeout_ms: 0,
    away_limit_ms: 300000,
    connect_timeout_count: 0,
    connected_sig: new signals.Signal(),
    disconnected_sig: new signals.Signal(),
    trouble_sig: new signals.Signal(),
    reconnecting_sig: new signals.Signal(),
    pong_sig: new signals.Signal(),
    onStart: function() {
        TS.socket.setPongTimeoutMs(TS.ui ? TS.ui.window_focused : true);
        if (TS.ui) {
            TS.ui.window_focus_changed_sig.add(TS.socket.setPongTimeoutMs, TS.socket)
        }
        setInterval(function() {
            if (!TS.model.socket_connected) {
                return
            }
            if (TS.model.users_login_call_throttler < 1) {
                return
            }
            TS.model.users_login_call_throttler--;
            TS.info("decremented TS.model.users_login_call_throttler:" + TS.model.users_login_call_throttler)
        }, 1000 * 60)
    },
    setPongTimeoutMs: function(a) {
        if (a) {
            TS.socket.pong_timeout_ms = 10000
        } else {
            TS.socket.pong_timeout_ms = 60000
        }
        TS.socket.pong_timeout_ms += TS.socket.ping_interv_ms;
        TS.log(3, "TS.socket.pong_timeout_ms set to:" + TS.socket.pong_timeout_ms + " has_focus:" + a)
    },
    send: function(c, a, b) {
        c.id = ++TS.socket.msg_id;
        TS.socket.sent_map[c.id.toString()] = {
            msg: c,
            handler: a,
            ts: TS.utility.date.getTimeStamp(),
            temp_ts: b
        };
        if (c.type == "ping" || c.type == "pong") {
            TS.log(3, "sending " + c.type);
            TS.dir(3, c)
        } else {
            TS.model.last_net_send = TS.utility.date.getTimeStamp();
            TS.log(2, "sending " + c.type);
            TS.dir(2, c)
        }
        TS.socket.websocket.send(JSON.stringify(c));
        return c.id
    },
    sendTyping: function(a) {
        var b = '{"type":"typing", "channel":"' + a + '"}';
        TS.socket.websocket.send(b)
    },
    onMsg: function(b) {
        var a = JSON.parse(b.data);
        TS.socket.handleMsg(a)
    },
    handleMsg: function(a) {
        var d = a.reply_to && !("ok" in a) && a.type == "message";
        if (d) {}
        var b;
        if (a.reply_to) {
            if (a.reply_to.toString() in TS.socket.sent_map) {
                b = TS.socket.sent_map[a.reply_to];
                a.SENT_MSG = b.msg;
                delete TS.socket.sent_map[a.reply_to]
            } else {
                if (!d) {
                    TS.error('received msg "' + a.reply_to + '" with type "' + a.type + '" but we have no record of it in sent_map')
                }
            }
        } else {
            if (a.event_ts) {
                TS.socket.storeLastEventTS(a.event_ts)
            }
        } if (a.type == "ping" || a.type == "pong") {
            TS.log(3, "msg " + a.type + " time: " + (TS.utility.date.getTimeStamp() - b.ts) + "ms");
            TS.socket.last_pong_time = TS.utility.date.getTimeStamp();
            TS.socket.pong_sig.dispatch();
            TS.dir(3, a)
        } else {
            if (b) {
                var c = a.type ? a.type : (a.SENT_MSG.type) ? a.SENT_MSG.type : "";
                TS.log(2, "msg " + ((c) ? '"' + c + '" ' : "") + "rsp time " + (TS.utility.date.getTimeStamp() - b.ts) + "ms")
            } else {
                TS.log(2, 'msg "' + a.type + '"')
            }
            TS.dir(2, a)
        } if (!a.reply_to && TS.msg_handlers[a.type]) {
            TS.msg_handlers[a.type](a)
        }
        if (b) {
            if (!a.ok) {
                a.error = a.error || {
                    code: 0,
                    msg: "unknown error (not specified by MS)"
                }
            }
            if (d) {
                a.ok = true
            }
            if (b.handler) {
                b.handler(a.ok, a)
            }
        }
    },
    onConnect: function(a) {
        clearTimeout(TS.socket.connect_timeout_tim);
        TS.socket.connect_timeout_count = 0;
        if (TS.qs_args.simulate_hello_timeout == 1 && !window.already_simulated_hello_timeout) {
            TS.info("simulate_hello_timeout");
            window.already_simulated_hello_timeout = true
        } else {
            TS.socket.websocket.onmessage = TS.socket.onMsg
        }
        TS.model.conn_log.length = 0;
        TS.logLoad("TS.socket.onConnect (took " + (new Date().getTime() - TS.socket.last_start_ms) + "ms)");
        TS.info("Connected to: " + TS.model.team.url);
        TS.socket.logConnectionFlow("on_connect");
        clearTimeout(TS.socket.hello_timeout_tim);
        TS.socket.hello_timeout_tim = setTimeout(TS.socket.onHelloTimeout, TS.socket.hello_timeout_tim_ms)
    },
    onHello: function() {
        clearTimeout(TS.socket.hello_timeout_tim);
        TS.logLoad("TS.socket.onHello (took " + (new Date().getTime() - TS.socket.last_start_ms) + "ms)");
        var b = TS.utility.date.getTimeStamp() - TS.socket.last_pong_time;
        TS.info("Hello from: " + TS.model.team.url + " ms_since_last_pong:" + b);
        TS.socket.logConnectionFlow("on_hello");
        if (b > TS.socket.away_limit_ms) {
            TS.ui.maybePromptForSetActive()
        }
        clearInterval(TS.socket.recconnect_interv);
        TS.socket.check_last_pong_time = true;
        TS.socket.last_pong_time = TS.utility.date.getTimeStamp();
        clearInterval(TS.socket.ping_interv);
        TS.socket.ping_interv = setInterval(TS.socket.doPingThings, TS.socket.ping_interv_ms);
        TS.model.socket_connecting = false;
        TS.model.socket_connected = true;
        TS.socket.connected_sig.dispatch();
        var a = TS.storage.fetchLastEventTS();
        if (a) {
            TS.api.callImmediately("eventlog.history", {
                start: a
            }, TS.socket.onEventLog)
        }
    },
    onErrorMsg: function(a) {
        if (a.error) {
            if (a.error.code == 1) {
                TS.socket.logConnectionFlow("msg_error_code_1")
            } else {
                TS.logError({
                    message: "TS.socket.onErrorMsg"
                }, JSON.stringify(a));
                TS.socket.onFailure("TS.socket.onErrorMsg imsg.error:" + a.error)
            }
        } else {
            TS.logError({
                message: "TS.socket.onErrorMsg"
            }, a ? JSON.stringify(a) : "no imsg?")
        }
    },
    last_slack_broadcast_imsg: null,
    onEventLog: function(f, h, c) {
        if (!f) {
            TS.error("onEventLog " + h);
            return
        }
        if (!h.events) {
            TS.error("onEventLog missing events");
            return
        }
        if (TS.client && h.total > 200) {
            TS.storage.cleanOutMsgStorageAndReset();
            TS.info("going to call TS.client.reload() after a TS.storage.cleanOutMsgStorageAndReset() because data.total > 200)");
            TS.client.reload(null, "TS.client.reload() after a TS.storage.cleanOutMsgStorageAndReset() because data.total > 200)");
            return
        }
        var b;
        var a;
        for (var d = 0; d < h.events.length; d++) {
            a = h.events[d];
            if (a.event_ts) {
                b = a.event_ts;
                delete a.event_ts
            }
            if (a.type == "slack_broadcast") {
                if (a.reload) {
                    var g = TS.socket.last_slack_broadcast_imsg;
                    if (g) {
                        if (g.force_reload) {
                            if (a.force_reload) {
                                TS.socket.last_slack_broadcast_imsg = a
                            }
                        } else {
                            TS.socket.last_slack_broadcast_imsg = a
                        }
                    } else {
                        TS.socket.last_slack_broadcast_imsg = a
                    }
                }
                continue
            }
            try {
                TS.socket.handleMsg(a)
            } catch (j) {}
        }
        if (h.has_more) {
            if (!h.events.length) {
                TS.error(" WTF data.events.length==0 and data.has_more:true ??????")
            } else {
                TS.api.call("eventlog.history", {
                    start: b
                }, TS.socket.onEventLog)
            }
        } else {
            if (b) {
                TS.socket.storeLastEventTS(b)
            }
            if (TS.socket.last_slack_broadcast_imsg) {
                try {
                    TS.socket.handleMsg(TS.socket.last_slack_broadcast_imsg)
                } catch (j) {}
                TS.socket.last_slack_broadcast_imsg = null
            }
        }
    },
    storeLastEventTS: function(b) {
        if (!b) {
            return
        }
        var a = TS.storage.fetchLastEventTS();
        if (a && b <= a) {
            return
        }
        TS.storage.storeLastEventTS(b)
    },
    doPingThings: function() {
        if (TS.socket.check_last_pong_time) {
            var a = TS.utility.date.getTimeStamp() - TS.socket.last_pong_time;
            TS.log(3, "ms_since_last_pong:" + a + " pong_timeout_ms:" + TS.socket.pong_timeout_ms);
            if (a > TS.socket.pong_timeout_ms) {
                TS.warn("ms_since_last_pong too long! " + a + " > " + TS.socket.pong_timeout_ms);
                TS.warn("calling disconnect(), expect to get an onDisconnect() callback");
                TS.socket.logConnectionFlow("on_ping_timeout");
                TS.socket.trouble_sig.dispatch();
                TS.socket.check_last_pong_time = false;
                TS.socket.reportDisconnect("You are on team Tiny Speck, so here are some pong details:\n>>>ms_since_last_pong too long! " + a + " > " + TS.socket.pong_timeout_ms + " ... calling disconnect(), expect to get an onDisconnect() callback");
                try {
                    TS.socket.disconnect();
                    clearTimeout(TS.socket.disconnect_timeout_tim);
                    TS.socket.disconnect_timeout_tim = setTimeout(function() {
                        TS.info("called disconnect, no onDisconnect callback happened in " + TS.socket.disconnect_timeout_tim_ms + "ms, so calling TS.socket.onDisconnect() manually now");
                        TS.socket.onDisconnect(null, "ms_since_last_pong too long! then called disconnect, but no onDisconnect callback happened in " + TS.socket.disconnect_timeout_tim_ms + "ms, so calling TS.socket.onDisconnect() manually now")
                    }, TS.socket.disconnect_timeout_tim_ms)
                } catch (b) {
                    TS.info("ms_since_last_pong too long! then an error calling disconnect, going to assume it is because it is already closed, calling TS.socket.onDisconnect() manually now");
                    TS.warn(b);
                    TS.socket.onDisconnect(null, "error calling disconnect, going to assume it is because it is already closed, calling TS.socket.onDisconnect() manually now")
                }
                return
            }
        }
        TS.socket.send({
            type: "ping",
            ping_interv_ms: TS.socket.ping_interv_ms
        })
    },
    onDisconnect: function(b, a) {
        a = a || "onDisconnect called with event:" + b;
        TS.info("Disconnected");
        TS.socket.logConnectionFlow("on_disconnect");
        clearTimeout(TS.socket.disconnect_timeout_tim);
        clearTimeout(TS.socket.hello_timeout_tim);
        clearTimeout(TS.socket.connect_timeout_tim);
        if (b) {
            TS.info("onDisconnect event:");
            TS.error(b);
            if (b.code == "1006" && false) {
                TS.generic_dialog.start({
                    title: "Connection trouble error #1006",
                    body: "Apologies, we're having some trouble with your connection. The particular error code indicates that restarting the application might fix it.",
                    show_cancel_button: false,
                    show_go_button: true,
                    go_button_text: "OK",
                    esc_for_ok: true
                })
            }
        } else {
            TS.info("no event")
        }
        TS.socket.onFailure(a)
    },
    reportDisconnect: function(a) {
        return;
        if (a && TS.model && TS.model.team && TS.model.team.domain == "tinyspeck") {
            TS.msg_handlers.message({
                ts: TS.utility.date.makeTsStamp(),
                channel: TS.shared.getActiveModelOb().id,
                subtype: "bot_message",
                is_ephemeral: true,
                username: "disconnectionBot",
                icons: {
                    emoji: ":boom:"
                },
                text: a
            })
        }
    },
    onFailure: function(c) {
        TS.info("TS.socket.onFailure reason_str:" + c);
        if (c) {
            TS.socket.reportDisconnect("You got disconnected and are on team Tiny Speck, so here are some details:\n>>>" + c)
        }
        TS.socket.check_last_pong_time = false;
        TS.socket.deprecateCurrentSocket();
        if (TS.model.socket_connected) {
            TS.info("Disconnected from: " + TS.model.team.url + " TS.model.users_login_call_throttler:" + TS.model.users_login_call_throttler);
            TS.socket.logConnectionFlow("on_connected_failure");
            TS.model.reconnection_ms = 100;
            TS.socket.disconnect()
        } else {
            TS.socket.logConnectionFlow("on_notconnected_failure");
            var b = TS.model.reconnection_ms = ((TS.model.reconnection_ms + 1000) * 1.3);
            if (TS.model.reconnection_ms > 4000) {
                TS.model.reconnection_ms = TS.utility.randomInt(b, b + (b / 3))
            }
            TS.model.reconnection_ms = Math.min(TS.model.reconnection_ms, 300000)
        } if (TS.model.users_login_call_throttler > 5) {
            var a = 2000 * TS.model.users_login_call_throttler;
            if (TS.model.reconnection_ms < a) {
                TS.info("because TS.model.users_login_call_throttler:" + TS.model.users_login_call_throttler + " we are increasing time until next login call");
                TS.model.reconnection_ms - a
            }
        }
        TS.info("TS.model.reconnection_ms: " + TS.model.reconnection_ms);
        if (TS.model.socket_connected) {
            TS.model.socket_connected = false;
            TS.socket.disconnected_sig.dispatch()
        }
        TS.model.socket_connected = false;
        clearInterval(TS.socket.ping_interv);
        if (TS.model.asleep) {
            TS.warn("NOT doing startReconnection(), we are asleep");
            return
        }
        TS.socket.startReconnection()
    },
    deprecateCurrentSocket: function() {
        if (!TS.socket.websocket) {
            return
        }
        TS.socket.websocket.onmessage = null;
        TS.socket.websocket.onopen = null;
        TS.socket.websocket.onerror = null;
        TS.socket.websocket.onclose = null;
        try {
            TS.socket.websocket.close()
        } catch (b) {}
        if (false) {
            var a = TS.socket.websocket;
            TS.socket.websocket.onclose = function(c) {
                TS.socket.logConnectionFlow("old_socket_closed");
                if (!TS.model.socket_connected && !TS.model.socket_connecting) {
                    TS.warn("Our last socket just fired a close event, and we are not yet connected or connecting again, so let us jump start the connection process with manualReconnectNow()");
                    TS.socket.manualReconnectNow()
                }
                a.onclose = null
            }
        }
    },
    startReconnection: function() {
        TS.model.reconnect_time = TS.utility.date.getTimeStamp() + TS.model.reconnection_ms;
        TS.info("Attempting to reconnect in " + TS.model.reconnection_ms + "ms");
        clearInterval(TS.socket.recconnect_interv);
        TS.socket.recconnect_interv = setInterval(TS.socket.onReconnectInterval, TS.socket.recconnect_interv_ms);
        TS.socket.onReconnectInterval();
        clearTimeout(TS.socket.auto_reconnect_tim);
        TS.socket.auto_reconnect_tim = setTimeout(function() {
            if (!TS.model.window_unloading) {
                TS.socket.onSocketDisconnectGo()
            }
        }, TS.model.reconnection_ms)
    },
    manualReconnectNow: function() {
        TS.socket.logConnectionFlow("manual_reconnect");
        clearTimeout(TS.socket.auto_reconnect_tim);
        clearInterval(TS.socket.recconnect_interv);
        clearTimeout(TS.socket.connect_timeout_tim);
        TS.socket.connect_timeout_count = 0;
        if (!TS.model.window_unloading) {
            TS.socket.onSocketDisconnectGo();
            TS.socket.reconnecting_sig.dispatch(0)
        }
    },
    onReconnectInterval: function() {
        var a = TS.model.reconnect_time - TS.utility.date.getTimeStamp();
        var b = Math.round(a / 1000);
        if (b >= 0) {
            TS.socket.reconnecting_sig.dispatch(b)
        }
        if (TS.model.window_unloading) {
            clearInterval(TS.socket.recconnect_interv)
        }
    },
    onSocketDisconnectGo: function() {
        TS.client.reconnect()
    },
    disconnect: function() {
        if (TS.socket.websocket && TS.model.socket_connected) {
            TS.socket.logConnectionFlow("disconnect");
            TS.socket.websocket.close()
        } else {
            TS.warn("TS.socket.disconnect called, but TS.socket.websocket=" + TS.socket.websocket + " TS.model.socket_connected=" + TS.model.socket_connected)
        }
    },
    logConnectionFlow: function(a) {
        var c = TS.model.conn_log;
        var b = TS.utility.date.getTimeStamp();
        c.push({
            name: a,
            time: b,
            delta: (c.length) ? b - c[c.length - 1].time : 0
        });
        TS.log(2, "logConnectionFlow " + a + " " + c[c.length - 1].delta)
    },
    getConnectionFlowLog: function(d) {
        var e = TS.model.conn_log;
        var a = [];
        for (var b = 0; b < e.length; b++) {
            a.push(encodeURIComponent(e[b].name + "-" + (e[b].delta ? Math.round(e[b].delta / 1000) : 0) + "-" + Math.round(e[b].time / 1000)))
        }
        TS.dir(0, TS.model.conn_log);
        var c = a.join("&");
        if (d && c.length > d) {
            c = c.substr(0, d)
        }
        return c
    },
    onHelloTimeout: function() {
        var a = "socket received no hello msg " + TS.socket.hello_timeout_tim_ms + "ms after connection";
        TS.warn(a);
        TS.socket.logConnectionFlow("onHelloTimeout");
        TS.socket.onFailure(a)
    },
    onConnectTimeout: function() {
        TS.socket.connect_timeout_count++;
        var a = "socket not connected " + TS.socket.connect_timeout_tim_ms + "ms after creation. TS.socket.connect_timeout_count:" + TS.socket.connect_timeout_count;
        TS.warn(a);
        TS.socket.logConnectionFlow("onConnectTimeout");
        if (TS.socket.connect_timeout_count == 3) {
            TS.generic_dialog.start({
                title: "Connection trouble",
                body: "<p>Apologies, we're having some trouble with your web socket connection.</p>					<p>We've seen this problem clear up with a restart of " + (TS.model.is_our_app ? "Slack" : "your browser") + ", 					a solution which we suggest to you now only with great regret and self loathing.</p>					",
                show_cancel_button: false,
                go_button_text: "OK",
                esc_for_ok: true
            });
            return
        } else {
            if (TS.socket.connect_timeout_count == 2) {
                if (window.WEB_SOCKET_USING_FLASH) {} else {
                    if (TS.model.is_chrome) {
                        window.fallBackToFlashWebSockets();
                        setTimeout(function() {
                            if (window.WEB_SOCKET_USING_FLASH_BUT_NO_FLASH || !document.getElementById("webSocketFlash") || !document.getElementById("webSocketFlash").receiveEvents) {
                                TS.generic_dialog.start({
                                    title: "Connection trouble",
                                    body: "<p>Apologies, we're having some trouble with your web socket connection. 								We tried falling back to Flash, but it appears you do not have a version of Flash installed that we can use.</p>								<p>But we've seen this problem clear up with a restart of " + (TS.model.is_our_app ? "Slack" : "your browser") + ", 								a solution which we suggest to you now only with great regret and self loathing.</p>								",
                                    show_cancel_button: false,
                                    go_button_text: "OK",
                                    esc_for_ok: true
                                })
                            } else {
                                TS.socket.onFailure()
                            }
                        }, 3000);
                        return
                    }
                }
            }
        }
        TS.socket.onFailure(a)
    },
    onError: function(a) {
        var b = "";
        if (a) {
            if (a.name) {
                b += " e.name=" + a.name
            }
            if (a.message) {
                b += " e.message=" + a.message
            }
            if (a.data) {
                b += " e.data=" + a.data
            }
        }
        TS.warn("TS.socket.onError err_str: " + b);
        TS.dir(0, a)
    },
    connect: function() {
        TS.info("Connecting to: " + TS.model.team.url);
        TS.logLoad("TS.socket.connect " + TS.model.team.url);
        if (!window.WebSocket) {
            window.WebSocket = window.MozWebSocket
        }
        if (window.WebSocket) {
            try {
                TS.socket.logConnectionFlow("connect");
                var b = TS.model.team.url;
                var e = 2000 - b.length;
                var c = TS.socket.getConnectionFlowLog(e);
                var d = (TS.qs_args.simulate_old_token == 1) ? "&TRIGGER_OLD_TOKEN=1" : "";
                b += "?svn_rev=" + TS.boot_data.svn_rev + d + "&" + c;
                TS.info("Full WSS url: " + b);
                if (TS.qs_args.simulate_first_connect_failure == 1 && !window.already_simulated_first_connect_failure) {
                    b = b.replace("e", "w");
                    TS.info("simulate_first_connect_failure url:" + b);
                    window.already_simulated_first_connect_failure = true
                }
                TS.socket.connect_timeout_tim_ms = (window.WEB_SOCKET_USING_FLASH) ? TS.socket.connect_flash_timeout_tim_ms : TS.socket.connect_ws_timeout_tim_ms;
                TS.info("TS.socket.connect_timeout_tim_ms:" + TS.socket.connect_timeout_tim_ms);
                clearTimeout(TS.socket.connect_timeout_tim);
                TS.socket.connect_timeout_tim = setTimeout(TS.socket.onConnectTimeout, TS.socket.connect_timeout_tim_ms);
                TS.socket.last_url = b;
                TS.socket.last_start_ms = new Date().getTime();
                TS.socket.deprecateCurrentSocket();
                TS.socket.websocket = new WebSocket(b)
            } catch (a) {
                TS.warn("failed to create new WebSocket");
                TS.error(a);
                TS.socket.onFailure("failed to create new WebSocket");
                return
            }
            TS.model.socket_connecting = true;
            if (TS.qs_args.simulate_first_connect_timeout == 1 && TS.socket.connect_timeout_count < 1) {
                TS.info("simulate_first_connect_timeout url:" + b)
            } else {
                TS.socket.websocket.onopen = TS.socket.onConnect
            }
            TS.socket.websocket.onclose = TS.socket.onDisconnect;
            TS.socket.websocket.onerror = TS.socket.onError
        } else {
            alert("Your browser does not support Web Sockets.")
        }
    }
});
TS.registerModule("storage", {
    msgs_version: "1.03",
    version: "0.81",
    prefix: "",
    disabled: false,
    buffer: {},
    disable_interval_buffer_write: (function() {
        var c, f, b, e, d, a;
        a = true;
        e = "slack_ssb/";
        d = 0.45;
        c = navigator.userAgent.toLowerCase();
        f = c.indexOf(e);
        if (f !== -1) {
            b = parseFloat(c.substr(f + e.length));
            if (!isNaN(b) && b < d) {
                a = false
            }
        }
        return a
    }()),
    flush_buffer_interv: 0,
    flush_buffer_interv_ms: 1000,
    setDisabled: function(a) {
        if (TS.storage.disabled == a) {
            return
        }
        if (a) {
            TS.storage.disabled = true
        } else {
            TS.storage.disabled = false;
            TS.storage.setUp()
        }
        TS.info("TS.storage.disabled:" + TS.storage.disabled)
    },
    onStart: function() {
        TS.storage.disabled = TS.storage.disabled || TS.qs_args.ls_disabled == "1";
        if (!TS.storage.disabled) {
            try {
                if (TS.boot_data.login_data.self.prefs.ls_disabled) {
                    TS.storage.disabled = true
                }
            } catch (a) {}
        }
        TS.info("TS.storage.disabled:" + TS.storage.disabled);
        TS.storage.prefix = "U" + TS.boot_data.user_id + "_";
        if (TS.client) {
            TS.client.window_unloaded_sig.add(TS.storage.windowUnloaded, TS.socket)
        }
        if (!TS.storage.disabled) {
            TS.storage.setUp()
        }
    },
    setUp: function() {
        var a = TS.storage._get("storage_msgs_version");
        TS.log(488, "TS.storage.msgs_version:" + TS.storage.msgs_version);
        TS.log(488, "storage_msgs_version:" + a);
        var d = TS.storage._get("storage_version");
        TS.log(488, "TS.storage.version:" + TS.storage.version);
        TS.log(488, "storage_version:" + d);
        var e = $.jStorage.index();
        TS.log(488, e);
        var c;
        if (!$.jStorage.storageAvailable()) {
            TS.warn("$.jStorage.storageAvailable() = false so flushing");
            if (window.localStorage) {
                window.localStorage.clear()
            }
            $.jStorage.flush()
        } else {
            if (d != TS.storage.version) {
                TS.warn("storage_version:" + d + " does not match TS.storage.version:" + TS.storage.version + " so flushing");
                for (var b = 0; b < e.length; b++) {
                    c = e[b];
                    if (c.indexOf(TS.storage.prefix) != 0) {
                        continue
                    }
                    var f = TS.utility.date.getTimeStamp();
                    $.jStorage.deleteKey(c);
                    TS.warn("jStorage.deleteKey:" + c + " " + (TS.utility.date.getTimeStamp() - f) + "ms")
                }
                TS.storage._set("storage_version", TS.storage.version);
                TS.storage._set("storage_msgs_version", TS.storage.msgs_version);
                TS.info($.jStorage.index())
            } else {
                if (a != TS.storage.msgs_version || TS.qs_args.no_ls_msgs == "1") {
                    if (TS.qs_args.no_ls_msgs == "1") {
                        TS.warn("TS.qs_args['no_ls_msgs'] == '1' so flushing channel data")
                    } else {
                        TS.warn("storage_msgs_version:" + a + " does not match TS.storage.msgs_version:" + TS.storage.msgs_version + " so flushing channel data")
                    }
                    TS.storage.cleanOutMsgStorage();
                    TS.storage._set("storage_msgs_version", TS.storage.msgs_version);
                    TS.warn($.jStorage.index())
                }
            }
        } if (TS.storage.disable_interval_buffer_write) {
            TS.storage.flushBufferOnIdleTimer()
        }
    },
    cleanOutMsgStorageIfTooOld: function() {
        if (TS.storage.isStorageTooOld()) {
            TS.warn("last LS activity too old, we're purging");
            TS.storage.cleanOutMsgStorageAndReset();
            return true
        }
        return false
    },
    cleanOutMsgStorageAndReset: function() {
        TS.storage.cleanOutMsgStorage();
        TS.storage.storeLastEventTS("", true);
        TS.storage.storeLastMsgTS("", true);
        TS.storage.flushBuffer(true)
    },
    isStorageTooOld: function() {
        var d = TS.storage.fetchLastEventTS();
        var a = TS.storage.fetchLastMsgTS();
        var c = d;
        if (!c || a > d) {
            c = a
        }
        if (c) {
            var e = TS.utility.date.toDateObject(c);
            var b = TS.utility.date.getTimeStamp() - e;
            var f = 3 * 86400000;
            if (b > f) {
                return true
            }
        }
        return false
    },
    cleanOutMsgStorage: function() {
        var c = $.jStorage.index();
        TS.log(488, c);
        var b;
        for (var a = 0; a < c.length; a++) {
            b = c[a];
            if (b.indexOf(TS.storage.prefix) != 0) {
                continue
            }
            if (b.indexOf(TS.storage.msgs_id_part) == -1 && b.indexOf(TS.storage.oldest_ts_part) == -1) {
                continue
            }
            var d = TS.utility.date.getTimeStamp();
            $.jStorage.deleteKey(b);
            delete TS.storage.buffer[b];
            TS.warn("jStorage.deleteKey:" + b + " " + (TS.utility.date.getTimeStamp() - d) + "ms")
        }
        for (b in TS.storage.buffer) {
            if (b.indexOf(TS.storage.prefix) != 0) {
                continue
            }
            if (b.indexOf(TS.storage.msgs_id_part) == -1 && b.indexOf(TS.storage.oldest_ts_part) == -1) {
                continue
            }
            delete TS.storage.buffer[b];
            TS.info("delete TS.storage.buffer:" + b)
        }
        c = $.jStorage.index();
        TS.log(488, c)
    },
    windowUnloaded: function() {
        TS.storage.flushBuffer(true)
    },
    onFlushBufferInterval: function() {
        TS.storage.flushBuffer(false)
    },
    slow_write: false,
    slow_all_write: false,
    slow_write_threshold: 1000,
    flush_all_buffer_timer: null,
    flush_all_buffer_idle_timeout: 25000,
    flush_all_buffer_user_inactive_timeout: 60000,
    flushBufferOnIdleTimer: function() {
        if (TS.storage.flush_all_buffer_timer) {
            window.clearInterval(TS.storage.flush_all_buffer_timer);
            TS.storage.flush_all_buffer_timer = null
        }
        TS.storage.flush_all_buffer_timer = window.setInterval(TS.storage.flushAllBuffer, TS.storage.flush_all_buffer_idle_timeout)
    },
    flushAllBuffer: function() {
        var a, b;
        a = new Date();
        b = false;
        if (TS.ui) {
            if (!TS.ui.window_focused) {
                b = true
            } else {
                if ((a - TS.view.last_user_active_timestamp) >= TS.storage.flush_all_buffer_user_inactive_timeout) {
                    b = true
                }
            }
        }
        TS.log(488, "TS.storage.flushBuffer: " + (b ? "OK" : "Not ready"));
        if (b) {
            TS.storage.flushBuffer(true)
        }
    },
    flushBuffer: function(l) {
        if (TS.storage.disabled) {
            return
        }
        var b = new Date();
        var a = TS.utility.date.getTimeStamp();
        var f;
        var g = 0;
        var j = (TS.model && TS.model.team && TS.model.team.domain && TS.model.team.domain === "tinyspeck");
        var m;
        var h;
        var e;
        if (!l && TS.storage.disable_interval_buffer_write) {
            return false
        }
        for (var d in TS.storage.buffer) {
            $.jStorage.set(d, TS.storage.buffer[d]);
            g++;
            f = TS.utility.date.getTimeStamp() - a;
            TS.storage.flush_buffer_interv_ms = TS.utility.clamp(f * 3, 1000, 5000);
            if (j) {
                TS.log(488, "onFlushBufferInterval jStorage.set " + d + ": " + (f) + "ms " + (TS.storage.buffer[d] && TS.storage.buffer[d].toString ? TS.storage.buffer[d].toString().substr(0, 100) : "NULL?"))
            }
            if (!l) {
                m = new Date() - b;
                if (!TS.storage.slow_write && m > TS.storage.slow_write_threshold) {
                    TS.storage.slow_write = true;
                    e = new Date();
                    try {
                        h = $.jStorage.storageSize()
                    } catch (c) {}
                    e = new Date() - e;
                    TS.logError({
                        message: "TS.storage.flushBuffer > " + TS.storage.slow_write_threshold + " ms"
                    }, " took " + m + " ms for " + g + " item (!all case). Key: " + d + ". Buffer length: " + (TS.storage.buffer[d] && TS.storage.buffer[d].toString() ? TS.storage.buffer[d].toString().length : "unknown (not a string)") + ". localStorage size: " + (h || "unknown") + ". Time to read LS size: " + e)
                }
            }
            delete TS.storage.buffer[d];
            if (!l) {
                TS.log(488, "TS.storage.flushBuffer: Wrote one item.");
                return
            }
        }
        if (g && !TS.storage.slow_all_write) {
            m = new Date() - b;
            if (m > TS.storage.slow_write_threshold) {
                TS.storage.slow_all_write = true;
                try {
                    h = $.jStorage.storageSize()
                } catch (c) {}
                TS.logError({
                    message: "TS.storage.flushBuffer (all) > " + TS.storage.slow_write_threshold + " ms"
                }, " took " + m + " ms for " + g + " items. localStorage size: " + h + ". App open for " + ((new Date() - TS.view.start_time) / 1000 / 60).toFixed(2) + " min.")
            }
        }
        if (g === 0) {
            if (TS.storage.flush_buffer_interv) {
                window.clearInterval(TS.storage.flush_buffer_interv);
                TS.storage.flush_buffer_interv = null
            }
            TS.log(488, "TS.storage.flushBuffer: Nothing to save.")
        } else {
            TS.log(488, "TS.storage.flushBuffer: Saved " + g + (g === 1 ? " item" : " items"))
        }
    },
    slow_get_threshold: 1000,
    slow_get: null,
    _get: function(e, b) {
        var d = TS.storage.prefix + e;
        if (TS.storage.disabled) {
            return TS.storage.buffer[d] || b
        }
        if (d in TS.storage.buffer) {
            return TS.storage.buffer[d] || b
        }
        var c = new Date();
        var a;
        var g;
        a = $.jStorage.get(d, b);
        c = new Date() - c;
        if (!TS.storage.slow_get && c > TS.storage.slow_get_threshold) {
            TS.storage.slow_get = true;
            try {
                g = $.jStorage.storageSize()
            } catch (f) {}
            TS.logError({
                message: "TS.storage._get > " + TS.storage.slow_get_threshold + " ms"
            }, " took " + c + " ms to read " + d + ", length = " + (a && !isNaN(a.length) ? a.length : "unknown") + ". Storage size: " + g)
        }
        return a
    },
    slow_set_threshold: 1000,
    slow_set: null,
    _set: function(d, g, c) {
        var a = new Date();
        var f;
        var b = TS.storage.prefix + d;
        TS.storage.buffer[b] = g;
        if (c) {
            if (!TS.storage.disabled) {
                $.jStorage.set(b, TS.storage.buffer[b])
            }
            delete TS.storage.buffer[b];
            a = new Date() - a;
            if (!TS.storage.slow_set && a > TS.storage.slow_set_threshold) {
                TS.storage.slow_set = true;
                try {
                    f = $.jStorage.storageSize()
                } catch (e) {}
                TS.logError({
                    message: "TS.storage._set (immediate) > " + TS.storage.slow_set_threshold + " ms"
                }, " took " + a + " ms to write " + b + ", length = " + (g && !isNaN(g.length) ? g.length : "unknown") + ". Storage length: " + f)
            }
            return
        }
        if (!TS.storage.disabled) {
            if (!TS.storage.flush_buffer_interv) {
                TS.storage.flush_buffer_interv = setInterval(TS.storage.onFlushBufferInterval, TS.storage.flush_buffer_interv_ms)
            }
        }
    },
    msgs_id_part: "channel_msgs_",
    _makeMsgsId: function(a) {
        return TS.storage.msgs_id_part + a
    },
    fetchMsgsRaw: function(a) {
        return TS.storage._get(TS.storage._makeMsgsId(a), []) || []
    },
    fetchMsgs: function(e) {
        var d = JSON.parse(JSON.stringify(TS.storage._get(TS.storage._makeMsgsId(e), []) || []));
        var a = [];
        var b;
        for (var c = 0; c < d.length; c++) {
            if (TS.qs_args.not_all_ls_msgs) {
                if (c < 5) {
                    continue
                }
            }
            b = d[c];
            if (!b.ts) {
                continue
            }
            if (TS.utility.msgs.isTempMsg(b)) {
                continue
            }
            if (b.is_ephemeral) {
                continue
            }
            a.push(TS.utility.msgs.processImsg(b))
        }
        return a
    },
    storeMsgs: function(c, b) {
        TS.storage._set(TS.storage._makeMsgsId(c), b);
        if (b && b.length) {
            var a = TS.storage.fetchLastMsgTS();
            if (b[0].ts > a) {
                TS.storage.storeLastMsgTS(b[0].ts)
            }
        }
    },
    _makeMsgInputId: function(a) {
        return "msg_input_" + a
    },
    fetchLastMsgInput: function(a) {
        return TS.storage._get(TS.storage._makeMsgInputId(a), null)
    },
    storeLastMsgInput: function(b, a) {
        TS.storage._set(TS.storage._makeMsgInputId(b), a)
    },
    _makeCommentInputId: function(a) {
        return "comment_input_" + a
    },
    fetchLastCommentInput: function(a) {
        return TS.storage._get(TS.storage._makeCommentInputId(a), null)
    },
    storeLastCommentInput: function(b, a) {
        TS.storage._set(TS.storage._makeCommentInputId(b), a)
    },
    oldest_ts_part: "oldest_ts_",
    _makeOldestTsId: function(a) {
        return TS.storage.oldest_ts_part + a
    },
    fetchOldestTs: function(a) {
        return TS.storage._get(TS.storage._makeOldestTsId(a), null)
    },
    storeOldestTs: function(b, a) {
        TS.storage._set(TS.storage._makeOldestTsId(b), a)
    },
    fetchActiveHistory: function() {
        return TS.storage._get("active_history", []) || []
    },
    storeActiveHistory: function(a) {
        TS.storage._set("active_history", a)
    },
    fetchLastEventTS: function() {
        return TS.storage._get("last_event_ts", "") || ""
    },
    storeLastEventTS: function(b, a) {
        TS.storage._set("last_event_ts", b, a)
    },
    fetchLastMsgTS: function() {
        return TS.storage._get("last_msg_ts", "") || ""
    },
    storeLastMsgTS: function(b, a) {
        TS.storage._set("last_msg_ts", b, a)
    },
    fetchUIState: function() {
        return TS.storage._get("ui_state", {}) || {}
    },
    storeUIState: function(a) {
        TS.storage._set("ui_state", a)
    },
    fetchInlineImgState: function() {
        return TS.storage._get("inline_img_state", {}) || {}
    },
    storeInlineImgState: function(a) {
        TS.storage._set("inline_img_state", a)
    },
    fetchInlineVideoState: function() {
        return TS.storage._get("inline_video_state", {}) || {}
    },
    storeInlineVideoState: function(a) {
        TS.storage._set("inline_video_state", a)
    },
    fetchInlineAttachmentState: function() {
        return TS.storage._get("inline_attachment_state", {}) || {}
    },
    storeInlineAttachmentState: function(a) {
        TS.storage._set("inline_attachment_state", a)
    },
    fetchExpandableState: function() {
        return TS.storage._get("expandable_state", {}) || {}
    },
    storeExpandableState: function(a) {
        TS.storage._set("expandable_state", a)
    },
    fetchInputHistory: function() {
        var b = TS.storage._get("input_history", []) || [];
        var a = 300;
        if (b.length > a) {
            b.length = a
        }
        return b
    },
    storeInputHistory: function(a) {
        TS.storage._set("input_history", a)
    }
});
TS.registerModule("templates", {
    onStart: function() {
        TS.templates.load();
        TS.templates.registerPartials();
        TS.members.user_color_changed_sig.add(TS.templates.memberUserColorChanged, TS.templates);
        TS.prefs.sidebar_behavior_changed_sig.add(TS.templates.sidebarBehaviorPrefChanged, TS.templates)
    },
    generic_dialog_template: '		<div class="modal-header">			<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>			<h3>{{{title}}} <img src="/img/loading.gif" width="16" height="16" class="throbber hidden"></h3>		</div>		<div class="modal-body" style="overflow-x: hidden;">			{{{body}}}		</div>		<div class="modal-footer">			<a style="cursor: pointer" class="btn btn-outline btn_outline dialog_cancel"></a>			<a style="cursor: pointer" class="btn btn dialog_secondary_go hidden"></a>			<a style="cursor: pointer" class="btn dialog_go"></a>		</div>		',
    generic_dialog_sample_template: '		<p><a class="btn btn-small" onclick="TS.generic_dialog.cancel(); $(\'#file-upload\').trigger(\'click\');">Choose a file</a> 		OR <a class="btn btn-small" hhref="/files/create/snippet" target="{{newWindowName}}" onclick="TS.ui.snippet_dialog.startCreate(); TS.generic_dialog.cancel();">Create a text file</a></p>		',
    existing_groups_template: '		{{#if_equal existing_groups.length compare=1}}			The following group has the same members as the one you are trying to create. Would you like to use it instead?<br><br>		{{else}}			The following groups have the same members as the one you are trying to create. Would you like to use one of them instead?<br><br>		{{/if_equal}}		{{#each existing_groups}}			<p class="small_bottom_margin" style="font-size:0.8rem; color:black"><span style="color: #AAA;">{{{groupPrefix}}}</span>{{this.name}}&nbsp;&nbsp;<a onclick="TS.ui.group_create_dialog.useExistingGroup(\'{{this.id}}\')" class="btn btn-mini btn-primary">{{#if this.is_archived}}unarchive{{else}}open{{/if}}</a></p>		{{/each}}		<br>		If you really want to create a new group, just click the "create new group" button again.		',
    issue_list_item_template: '		<div class="issue_list_div issue_{{issue.state}}" id="{{makeIssueListDomId issue.id}}" data-issue-id="{{issue.id}}">			<div class="issue_list_left">				<div class="issue_list_title">{{issue.title}}</div>				<div class="issue_list_short_text">{{issue.short_text}}</div>			</div>			<div class="issue_list_right">				<div class="issue_list_state">{{issue.state}}{{#if_equal issue.state compare="unread"}} <i class="fa fa-exclamation-circle icon"></i>{{/if_equal}}</div>				<div class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort issue.ts}} at {{toTime issue.ts}}</div>			</div>		</div>		',
    help_issue_div_template: '		<p class="small_bottom_margin"><b>{{issue.title}}</b></p>		{{#if show_comments}}			{{#each issue.comments}}				<div class="issue_comment_div">					<p class="small_bottom_margin"><b>{{this.from}}</b> <span class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort this.ts}} at {{toTime this.ts}}</span></p>					{{{formatMessageSimple this.text}}}				</div>			{{/each}}		{{else}}			<div class="issue_comment_div">			</div>		{{/if}}		',
    help_issue_reply_comments_template: '		{{#each issue.comments}}			<div class="issue_comment_div">				<p class="small_bottom_margin"><b>{{this.from}}</b> <span class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort this.ts}} at {{toTime this.ts}}</span></p>				{{{formatMessageSimple this.text}}}			</div>		{{/each}}		',
    message_attachment_template: '		{{{initial_caret_html}}}		<div {{#if real_src}}data-real-src="{{real_src}}"{{/if}} class="inline_attachment{{#unless expand_it}} hidden{{/unless}} {{max_width_class}}">			{{#if attachment.pretext}}				<div class="attachment_pretext">{{{formatMessageAttachmentPart attachment.pretext msg true attachment.mrkdwn_in_hash.pretext}}}</div>			{{/if}}			<div class="inline_attachment_wrapper{{#if is_standalone}} standalone{{/if}}">				<div class="attachment_bar" style="background:#{{bg_color}};"><div class="shim"></div></div>				<div class="content dynamic_content_max_width">										{{#if thumb_at_top}}					{{#if small_thumb}}						<div class="msg_inline_attachment_thumb_holder at_top">							{{#if thumb_link}}<a {{{makeRefererSafeLink url=thumb_link}}} target="{{thumb_link}}">{{/if}}							{{!using style for width height is important! we must override default img styles}}							<img class="msg_inline_attachment_thumb" src="{{small_thumb_url}}" style="width:{{attachment._floated_thumb_display_width}}px; height:{{attachment._floated_thumb_display_height}}px;">							{{#if thumb_link}}</a>{{/if}}						</div>					{{/if}}					{{/if}}										{{#if can_delete}}						<div class="delete_attachment_link" data-attachment-id="{{attachment.id}}"><i class="fa fa-times"></i></div>					{{/if}}										<div>						{{#if attachment.service_icon}}<img class="attachment_service_icon" src="{{attachment.service_icon}}" width="16" height="16">{{/if}}						{{#if attachment.author_icon}}							<img class="attachment_author_icon" src="{{attachment.author_icon}}" width="16" height="16">							<a{{#if attachment.author_link}} {{{makeRefererSafeLink url=attachment.author_link}}} target="{{attachment.author_link}}"{{/if}}><span class="attachment_author_name">{{{formatMessageAttachmentPart attachment.author_name msg false false}}}</span></a>							<a{{#if attachment.author_link}} {{{makeRefererSafeLink url=attachment.author_link}}} target="{{attachment.author_link}}"{{/if}}><span class="attachment_author_subname">{{{formatMessageAttachmentPart attachment.author_subname msg false false}}}</span></a>						{{else}}							{{#if attachment.service_url}}								<a {{{makeRefererSafeLink url=attachment.service_url}}} target="{{attachment.service_url}}"><span class="attachment_service_name">{{{formatMessageAttachmentPart attachment.service_name msg false false}}}</span></a>							{{else}}								<span class="attachment_service_name">{{{formatMessageAttachmentPart attachment.service_name msg false false}}}</span>							{{/if}}						{{/if}}						{{#unless attachment.title}}{{#unless attachment.text}}{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}{{/unless}}{{/unless}}					</div>										{{#unless thumb_at_top}}					{{#if small_thumb}}						<div class="msg_inline_attachment_thumb_holder">							{{#if thumb_link}}<a {{{makeRefererSafeLink url=thumb_link}}} target="{{thumb_link}}">{{/if}}							{{!using style for width height is important! we must override default img styles}}							<img class="msg_inline_attachment_thumb" src="{{small_thumb_url}}" style="width:{{attachment._floated_thumb_display_width}}px; height:{{attachment._floated_thumb_display_height}}px;">							{{#if thumb_link}}</a>{{/if}}						</div>					{{/if}}					{{/unless}}										{{#unless attachment.author_icon}}						<div class="attachment_author_name">{{{formatMessageAttachmentPart attachment.author_name msg false false}}}</div>					{{/unless}}										{{#if attachment.title}}						<div>							{{#if attachment.title_link}}								<span class="attachment_title"><a {{{makeRefererSafeLink url=attachment.title_link}}} target="{{attachment.title_link}}">{{{formatMessageAttachmentPart attachment.title msg true false enable_slack_action_links}}}</a></span>							{{else}}								<span class="attachment_title">{{{formatMessageAttachmentPart attachment.title msg true false enable_slack_action_links}}}</span>							{{/if}}							{{#unless attachment.text}}{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}{{/unless}}						</div>					{{/if}}										{{#if attachment.text}}						<div class="attachment_contents">							{{#if is_text_collapsed}}								<span class="short_text" data-all-text="{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text}}">{{{formatMessageAttachmentPart attachment._short_text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}</span>								<span id="{{makeMsgAttachmentTextExpanderDomId msg.ts attachment._index}}" class="rest_text_expander"> <a>Show more...</a></span>							{{else}}								{{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}							{{/if}}							{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}						</div>						{{#if attachment.footer}}<div class="attachment_footer">							{{{formatMessageAttachmentPart attachment.footer msg true attachment.mrkdwn_in_hash.footer enable_slack_action_links}}}						</div>{{/if}}						{{#if attachment.ts}}<div class="attachment_ts">							{{#if ts_link}}<a {{{makeRefererSafeLink url=ts_link}}} target="{{ts_link}}">{{/if}}							{{toCalendarDateOrNamedDayShort attachment.ts}} at {{toTime attachment.ts}}							{{#if ts_link}}</a>{{/if}}						</div>{{/if}}					{{/if}}										{{#if attachment.fields}}						<div class="attachment_fields">						{{#if show_fields_table}}							<table class="" cellpadding="0" cellspacing="0" border="0" align="left"><tbody>							{{#foreach attachment.fields}}								{{#if this.value._new_row}}<tr>{{/if}}								<td valign="top" colspan="{{#if this.value.short}}1{{else}}2{{/if}}" {{#if this.value.short}}{{#if this.value._new_row}}width="250"{{/if}}{{/if}}>									<div class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</div>									<i class="copy_only">----------------<br></i>									<div class="attachment_field_value {{#if this.value.short}}short{{/if}}">{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields ../enable_slack_action_links}}}<i class="copy_only"><br><br></i></div>								</td>							{{/foreach}}							</tbody></table>						{{else}}							{{#foreach long_fields}}								<span class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</span>&nbsp;&nbsp;&nbsp;{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields}}}<br>							{{/foreach}}							{{#foreach short_fields}}								{{#unless this.first}}&nbsp;&nbsp;â€?nbsp;&nbsp;{{/unless}}<span class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</span>&nbsp;&nbsp;&nbsp;{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields ../enable_slack_action_links}}}							{{/foreach}}						{{/if}}						</div>						{{{media_caret_html}}}					{{/if}}										{{#if attachment.video_html}}						{{#if attachment.thumb_url}}							{{#if attachment.from_url}}								{{{inlineVideoDiv attachment.from_url msg_dom_id expand_media}}}							{{else}}								{{{inlineVideoDiv attachment.thumb_url msg_dom_id expand_media}}}							{{/if}}						{{/if}}					{{else}}					{{/if}}										{{#if attachment.image_url}}						{{#if attachment.from_url}}							{{{inlineImgDiv attachment.from_url msg_dom_id expand_media}}}						{{else}}							{{{inlineImgDiv attachment.image_url msg_dom_id expand_media}}}						{{/if}}					{{/if}}										{{#if attachment.audio_html}}						{{{inlineAudioDiv attachment.audio_html msg_dom_id attachment.audio_html expand_media}}}					{{else}}						{{#if attachment.audio_url}}							{{{formatSoundUrl attachment}}}						{{/if}}					{{/if}}										{{#if show_action_links}}					{{#if attachment.actions}}						<div class="attachment_actions">						{{#foreach attachment.actions}}							{{{formatActionLink this.value msg ../enable_slack_action_links}}}							{{#unless this.last}} â€?{{/unless}}						{{/foreach}}						</div>					{{/if}}					{{/if}}				</div>			</div>		</div>		{{#if show_fallback}}<div class="attachment_fallback">{{#if attachment.fallback}}{{{formatMessageAttachmentPart attachment.fallback msg true attachment.mrkdwn_in_hash.fallback enable_slack_action_links}}}{{else}}NO FALLBACK PROVIDED{{/if}}</div>{{/if}}		',
    file_snippet_reference_template: '<div class="file_reference">{{#isTheme theme="dense"}}	<div class="meta">		{{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}\'s{{else}}a{{/if}} snippet: 		<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name bold">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>		<a href="{{file.permalink}}" target="{{file.permalink}}" class="fa fa-external-link-square icon_new_window" title="Open file page"></a>	</div>	{{#unless standalone}}		<div class="snippet_preview">			{{{file.preview_highlight}}}			{{#if_gt file.lines_more compare=0}}				<a href="{{file.permalink}}" data-file-id="{{file.id}}" class="file_preview_link snippet_preview_more" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">+ {{file.lines_more}} more line{{#if_gt file.lines_more compare=1}}s{{/if_gt}}...</a>			{{/if_gt}}		</div>		<div class="snippet_meta">			<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>			<span class="bullet">â€?/span>			{{#memberIsSelf id=member.id}} 				{{#unless uploader}}					<a href="{{file.edit_link}}" target="{{file.id}}" class="file_edit" onclick="TS.ui.snippet_dialog.startEdit(\'{{file.id}}\'); return false">Edit</a> <span class="bullet">â€?/span>				{{/unless}}			{{/memberIsSelf}}			<a href="{{file.permalink}}" target="{{file.id}}">New window</a>			<span class="bullet">â€?/span> 			<a href="{{file.url_private}}" target="{{file.id}}">View raw</a>			<span class="bullet">â€?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>		</div>	{{/unless}}	{{/isTheme}}		{{#isTheme theme="light"}}	<span class="meta">		{{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}\'s{{else}}a{{/if}} snippet: 		<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>	</span><br />	{{#unless standalone}}		<div class="snippet_preview">			{{{file.preview_highlight}}}			{{#if_gt file.lines_more compare=0}}				<a href="{{file.permalink}}" data-file-id="{{file.id}}" class="file_preview_link snippet_preview_more" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">+ {{file.lines_more}} more line{{#if_gt file.lines_more compare=1}}s{{/if_gt}}...</a>			{{/if_gt}}		</div>		<span class="meta block snippet_meta">			<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>			<span class="bullet">â€?/span> 			{{#memberIsSelf id=member.id}} 				{{#unless uploader}}					<a href="{{file.edit_link}}" target="{{file.id}}" class="file_edit" onclick="TS.ui.snippet_dialog.startEdit(\'{{file.id}}\'); return false">Edit</a> <span class="bullet">â€?/span>				{{/unless}}			{{/memberIsSelf}}			<a href="{{file.permalink}}" target="{{file.id}}">New window</a>			<span class="bullet">â€?/span> 			<a href="{{file.url_private}}" target="{{file.id}}">View raw</a>			<span class="bullet">â€?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>		</span>	{{/unless}}	{{/isTheme}}</div>',
    file_post_reference_template: '<div class="file_reference">	{{#isTheme theme="dense"}}		<div class="post_meta">			{{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}\'s{{else}}a{{/if}} post: 			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name bold">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>			<a href="{{file.permalink}}" target="{{file.permalink}}" class="fa fa-external-link-square icon_new_window" title="Open file page"></a><br />		</div>		{{#unless standalone}}			<div class="post_preview">				{{{nl2br file.preview}}}				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link">more</a>			</div>			<span class="meta block post_meta">				{{#memberIsSelf id=member.id}} 					{{#unless uploader}}						<a href="{{file.permalink}}/edit">Edit</a>						<span class="bullet">â€?/span>					{{/unless}}				{{/memberIsSelf}}				<a href="{{file.permalink}}" target="{{file.id}}">New window</a>				<span class="bullet">â€?/span>				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">					{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}				</a>			</span>		{{/unless}}	{{/isTheme}}		{{#isTheme theme="light"}}		<span class="meta">			{{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}\'s{{else}}a{{/if}} post: 			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>			<a href="{{file.permalink}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open post in a new tab"><i class="fa fa-external-link-square file_inline_icon"></i></a>		</span>		{{#unless standalone}}			<div class="post_preview">				{{{nl2br file.preview}}}				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link">more</a>			</div>			<span class="meta block post_meta">				{{#memberIsSelf id=member.id}} 					{{#unless uploader}}						<a href="{{file.permalink}}/edit">Edit</a>						<span class="bullet">â€?/span>					{{/unless}}				{{/memberIsSelf}}				<a href="{{file.permalink}}" target="{{file.id}}">New window</a>				<span class="bullet">â€?/span>				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">					{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}				</a>			</span>		{{/unless}}	{{/isTheme}}</div>',
    file_reference_template: '<div class="file_reference">{{#isTheme theme="dense"}}	<!--	<em>		{{{makeMemberPreviewLink member}}} referenced:		{{#if uploader}}			{{{makeMemberPreviewLink uploader}}}{{possessive uploader.name}} file:		{{/if}}	</em>	<a href="{{#if file.is_external}}{{file.url}}{{else}}{{file.permalink}}{{/if}}" target="{{#if file.is_external}}{{file.url}}{{else}}{{file.permalink}}{{/if}}" class="fa fa-external-link-square icon_new_window" title="{{#if file.is_external}}Open original in new tab{{else}}Open file page{{/if}}"></a>	-->	<div class="file_details">		{{#if file.is_external}}			<a href="{{file.url}}" {{#isClient}}target="{{file.url}}"{{/isClient}} data-file-id="{{file.id}}" class="icon icon_40 {{icon_class}}" title="Open original in new tab">		{{else}}			{{#fileIsImage id=file.id}}				<a href="{{file.url}}" {{#isClient}}target="{{file.url}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link icon icon_40 {{icon_class}} {{#if lightbox}}lightbox_link{{/if}}" title="Open in lightbox ({{#isMac}}cmd{{else}}ctrl{{/isMac}}+click to open original in new tab)">			{{else}}				<a href="{{file.url}}" {{#isClient}}target="{{file.url}}"{{/isClient}} data-file-id="{{file.id}}" class="icon icon_40 {{icon_class}}" title="Open original in new tab">			{{/fileIsImage}}		{{/if}}			{{#if file.thumb_80}}				{{#if_equal icon_class compare="thumb_40"}}					<img src="{{file.thumb_80}}" />				{{else}}					<img src="{{file.thumb_360}}" />				{{/if_equal}}			{{else}}				<span data-file-id="{{file.id}}" class="filetype_icon s24 {{file.filetype}}"></span>			{{/if}}		</a>		<span class="float-left" style="width: 85%">			<a href="{{file.permalink}}"{{#isClient}}target="{{file.permalink}}"{{/isClient}}  data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>			{{#unless file.thumb_360}}				{{#unless file.is_external}}					<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" target="{{newWindowName}}" data-toggle="tooltip" title="Download file"><i class="fa fa-cloud-download file_inline_icon"></i></a>				{{/unless}}			{{/unless}}			{{#unless standalone}}				{{#if file.thumb_360_gif}}					{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}				{{else}}					{{{inlineImgToggler file.thumb_360 msg_dom_id}}}				{{/if}}			{{/unless}}			<br />			{{#if file.is_shared}}				in				{{{makeFileGroupChannelList file}}}			{{/if}}			<span class="bullet">â€?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>			{{#fileIsImage id=file.id}}				<span class="bullet">â€?/span>				<a href="{{file.url_private}}" target="{{file.url_private}}" data-file-id="{{file.id}}">Open original</a>			{{/fileIsImage}}			</span>		<div class="clear-both"></div>	</div>	{{#unless standalone}}		{{#if file.thumb_360_gif}}			{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}		{{else}}			{{{inlineImgDiv file.thumb_360 msg_dom_id}}}		{{/if}}	{{/unless}}	{{/isTheme}}	{{#isTheme theme="light"}}	<span class="meta">		<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link file_name">			{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}		</a>		{{#if file.is_external}}			<a href="{{#if file.is_external}}{{file.url}}{{else}}{{file.permalink}}{{/if}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on {{#if_equal file.external_type compare="gdrive"}}Google Drive{{/if_equal}}{{#if_equal file.external_type compare="dropbox"}}Dropbox{{/if_equal}}{{#if_equal file.external_type compare="box"}}Box{{/if_equal}}{{#if_equal file.external_type compare="unknown"}}a web page{{/if_equal}}"><i class="fa fa-external-link-square file_inline_icon"></i></a>		{{/if}}		{{#unless file.thumb_360}}			{{#unless file.is_external}}				<a href="{{file.url_private_download}}" target="{{newWindowName}}" data-toggle="tooltip" title="Download file"><i class="fa fa-cloud-download file_inline_icon"></i></a>			{{/unless}}		{{/unless}}	</span>	{{#unless standalone}}		{{#if file.thumb_360_gif}}			{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}		{{else}}			{{{inlineImgToggler file.thumb_360 msg_dom_id}}}		{{/if}}		{{#if file.thumb_360_gif}}			{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}		{{else}}			{{{inlineImgDiv file.thumb_360 msg_dom_id}}}		{{/if}}	{{/unless}}	<span class="meta block">		{{#if file.is_external}}			{{#if_equal file.external_type compare="gdrive"}}				<a href="{{file.url}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Google Drive"><img src="/img/services/gdrive_16.png" class="gdrive_icon file_service_icon grayscale" /></a>			{{/if_equal}}			{{#if_equal file.external_type compare="dropbox"}}				<a href="{{file.url}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Dropbox"><i class="fa fa-dropbox file_service_icon"></i></a>			{{/if_equal}}			{{#if_equal file.external_type compare="box"}}				<a href="{{file.url}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Box"><img src="/plugins/box/assets/service_32.png" class="box_icon file_service_icon grayscale" /></a>			{{/if_equal}}		{{/if}}		{{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}{{possessive uploader.name}}{{else}}{{/if}} 		{{#if file.is_external}}			{{{external_filetype_html}}}		{{else}}			File		{{/if}}		{{#unless file.is_external}}			<span class="bullet">â€?/span>			<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" class="file_download_link" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>		{{/unless}}		{{#if file.is_shared}}			<span class="bullet">â€?/span>			in {{{makeFileGroupChannelList file}}}		{{/if}}		{{#unless standalone}}			<span class="bullet">â€?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>		{{/unless}}		{{#fileIsImage id=file.id}}			<span class="bullet">â€?/span>			<a href="{{file.url_private}}" target="{{file.url_private}}" data-file-id="{{file.id}}">Open original</a>		{{/fileIsImage}}	</span>	{{/isTheme}}</div>',
    messages_search_paging_template: '<div class="search_paging">{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=1}}<i class="left fa fa-chevron-circle-left disabled"></i>{{else}}<a onclick="TS.search.view.pageMessagesBack()"><i class="left fa fa-chevron-circle-left"></i></a>{{/if_equal}}{{/if_not_equal}}<span class="page_text">page {{current_page}} of {{pages}}</span>{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=pages}}<i class="right fa fa-chevron-circle-right disabled"></i>{{else}}<a onclick="TS.search.view.pageMessagesForward()"><i class="right fa fa-chevron-circle-right"></i></a>{{/if_equal}}{{/if_not_equal}}</div>',
    files_search_paging_template: '<div class="search_paging">{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=1}}<i class="left fa fa-chevron-circle-left disabled"></i>{{else}}<a onclick="TS.search.view.pageFilesBack()"><i class="left fa fa-chevron-circle-left"></i></a>{{/if_equal}}{{/if_not_equal}}<span class="page_text">page {{current_page}} of {{pages}}</span>{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=pages}}<i class="right fa fa-chevron-circle-right disabled"></i>{{else}}<a onclick="TS.search.view.pageFilesForward()"><i class="right fa fa-chevron-circle-right"></i></a>{{/if_equal}}{{/if_not_equal}}</div>',
    compile: function(b) {
        var e = b + "_template";
        if (TS.templates[e]) {
            return Handlebars.compile(TS.templates[e])
        }
        var a = "#" + e;
        var d = $(a).html();
        if (!d) {
            TS.warn(a + " has no html");
            return null
        }
        var c = Handlebars.compile(d);
        return c
    },
    load: function() {
        var a = TS.utility.date.getTimeStamp();
        TS.templates.message = TS.templates.compile("message");
        TS.templates.message_edit_form = TS.templates.compile("message_edit_form");
        TS.templates.message_attachment = TS.templates.compile("message_attachment");
        TS.templates.message_file_share = TS.templates.compile("message_file_share");
        TS.templates.message_file_post_share = TS.templates.compile("message_file_post_share");
        TS.templates.message_file_snippet_share = TS.templates.compile("message_file_snippet_share");
        TS.templates.message_file_upload = TS.templates.compile("message_file_upload");
        TS.templates.message_file_snippet_create = TS.templates.compile("message_file_snippet_create");
        TS.templates.message_file_comment = TS.templates.compile("message_file_comment");
        TS.templates.message_file_post_comment = TS.templates.compile("message_file_post_comment");
        TS.templates.messages_day_divider = TS.templates.compile("messages_day_divider");
        TS.templates.messages_unread_divider = TS.templates.compile("messages_unread_divider");
        TS.templates.file_reference = TS.templates.compile("file_reference");
        TS.templates.file_snippet_reference = TS.templates.compile("file_snippet_reference");
        TS.templates.file_post_reference = TS.templates.compile("file_post_reference");
        TS.templates.channel_list = TS.templates.compile("channel_list");
        TS.templates.channel_members_list = TS.templates.compile("channel_members_list");
        TS.templates.channel_create_overlay = TS.templates.compile("channel_create_overlay");
        TS.templates.channel_join_overlay = TS.templates.compile("channel_join_overlay");
        TS.templates.group_create_overlay = TS.templates.compile("group_create_overlay");
        TS.templates.group_join_overlay = TS.templates.compile("group_join_overlay");
        TS.templates.member = TS.templates.compile("member");
        TS.templates.group = TS.templates.compile("group");
        TS.templates.channel = TS.templates.compile("channel");
        TS.templates.team_list = TS.templates.compile("team_list");
        TS.templates.team_tabs = TS.templates.compile("team_tabs");
        TS.templates.team_list_item = TS.templates.compile("team_list_item");
        TS.templates.team_member_preview = TS.templates.compile("team_member_preview");
        TS.templates.team_member_edit = TS.templates.compile("team_member_edit");
        TS.templates.dm_badge = TS.templates.compile("dm_badge");
        TS.templates.file_list_item = TS.templates.compile("file_list_item");
        TS.templates.file_header = TS.templates.compile("file_header");
        TS.templates.file_masonry_item = TS.templates.compile("file_masonry_item");
        TS.templates.file_preview_head_section = TS.templates.compile("file_preview_head_section");
        TS.templates.file_snippet_list_item = TS.templates.compile("file_snippet_list_item");
        TS.templates.file_snippet_masonry_item = TS.templates.compile("file_snippet_masonry_item");
        TS.templates.file_snippet_preview_head_section = TS.templates.compile("file_snippet_preview_head_section");
        TS.templates.file_post_list_item = TS.templates.compile("file_post_list_item");
        TS.templates.file_post_masonry_item = TS.templates.compile("file_post_masonry_item");
        TS.templates.file_post_preview_head_section = TS.templates.compile("file_post_preview_head_section");
        TS.templates.file_email_preview_head_section = TS.templates.compile("file_email_preview_head_section");
        TS.templates.comments = TS.templates.compile("comments");
        TS.templates.comment = TS.templates.compile("comment");
        TS.templates.search_widget = TS.templates.compile("search_widget");
        TS.templates.search_options = TS.templates.compile("search_options");
        TS.templates.search_tabs = TS.templates.compile("search_tabs");
        TS.templates.search_files_heading = TS.templates.compile("search_files_heading");
        TS.templates.search_team_results = TS.templates.compile("search_team_results");
        TS.templates.search_message_results = TS.templates.compile("search_message_results");
        if (TS.boot_data.feature_search_extracts) {
            TS.templates.search_attachment_extracts = TS.templates.compile("search_attachment_extracts");
            TS.templates.search_message_extracts = TS.templates.compile("search_message_extracts");
            TS.templates.search_message_results_item = TS.templates.compile("search_message_results_item_with_extracts")
        } else {
            TS.templates.search_message_results_item = TS.templates.compile("search_message_results_item")
        }
        TS.templates.search_results_none = TS.templates.compile("search_results_none");
        TS.templates.user_status_form = TS.templates.compile("user_status_form");
        TS.templates.menu = TS.templates.compile("menu");
        TS.templates.emoji_menu = TS.templates.compile("emoji_menu");
        TS.templates.emoji_header = TS.templates.compile("emoji_header");
        TS.templates.menu_emoticons = TS.templates.compile("menu_emoticons");
        TS.templates.menu_member_header = TS.templates.compile("menu_member_header");
        TS.templates.menu_member_items = TS.templates.compile("menu_member_items");
        TS.templates.menu_member_footer = TS.templates.compile("menu_member_footer");
        TS.templates.menu_user_footer = TS.templates.compile("menu_user_footer");
        TS.templates.menu_members_header = TS.templates.compile("menu_members_header");
        TS.templates.menu_members_items = TS.templates.compile("menu_members_items");
        TS.templates.menu_members_footer = TS.templates.compile("menu_members_footer");
        TS.templates.menu_group_header = TS.templates.compile("menu_group_header");
        TS.templates.menu_group_items = TS.templates.compile("menu_group_items");
        TS.templates.menu_group_footer = TS.templates.compile("menu_group_footer");
        TS.templates.menu_channel_header = TS.templates.compile("menu_channel_header");
        TS.templates.menu_channel_items = TS.templates.compile("menu_channel_items");
        TS.templates.menu_channel_footer = TS.templates.compile("menu_channel_footer");
        TS.templates.menu_groups_header = TS.templates.compile("menu_groups_header");
        TS.templates.menu_groups_items = TS.templates.compile("menu_groups_items");
        TS.templates.menu_team_items = TS.templates.compile("menu_team_items");
        TS.templates.menu_user_items = TS.templates.compile("menu_user_items");
        TS.templates.menu_activity_toggle_items = TS.templates.compile("menu_activity_toggle_items");
        TS.templates.menu_file_filter_items = TS.templates.compile("menu_file_filter_items");
        TS.templates.menu_file_member_header = TS.templates.compile("menu_file_member_header");
        TS.templates.menu_file_member_filter_items = TS.templates.compile("menu_file_member_filter_items");
        TS.templates.menu_message_action_items = TS.templates.compile("menu_message_action_items");
        TS.templates.menu_comment_action_items = TS.templates.compile("menu_comment_action_items");
        TS.templates.menu_file_action_items = TS.templates.compile("menu_file_action_items");
        if (TS.boot_data.feature_new_team_sites) {
            TS.templates.menu_service_action_items = TS.templates.compile("menu_service_action_items")
        }
        TS.templates.menu_flexpane_header = TS.templates.compile("menu_flexpane_header");
        TS.templates.menu_flexpane_items = TS.templates.compile("menu_flexpane_items");
        TS.templates.menu_flexpane_footer = TS.templates.compile("menu_flexpane_footer");
        TS.templates.menu_channel_picker_header = TS.templates.compile("menu_channel_picker_header");
        TS.templates.menu_channel_picker = TS.templates.compile("menu_channel_picker");
        TS.templates.activity_messages = TS.templates.compile("activity_messages");
        TS.templates.activity_user_rename = TS.templates.compile("activity_user_rename");
        TS.templates.activity_user_files = TS.templates.compile("activity_user_files");
        TS.templates.activity_user_files_post = TS.templates.compile("activity_user_files_post");
        TS.templates.activity_user_files_snippet = TS.templates.compile("activity_user_files_snippet");
        TS.templates.activity_team_files = TS.templates.compile("activity_team_files");
        TS.templates.activity_file_comments = TS.templates.compile("activity_file_comments");
        TS.templates.activity_file_stars = TS.templates.compile("activity_file_stars");
        TS.templates.activity_file_comment_stars = TS.templates.compile("activity_file_comment_stars");
        TS.templates.activity_message_stars = TS.templates.compile("activity_message_stars");
        TS.templates.activity_new_channels = TS.templates.compile("activity_new_channels");
        TS.templates.activity_new_members = TS.templates.compile("activity_new_members");
        TS.templates.activity_unread_messages = TS.templates.compile("activity_unread_messages");
        TS.templates.activity_unread_group_messages = TS.templates.compile("activity_unread_group_messages");
        TS.templates.activity_unread_dms = TS.templates.compile("activity_unread_dms");
        TS.templates.activity_sent_messages = TS.templates.compile("activity_sent_messages");
        TS.templates.activity_sent_group_messages = TS.templates.compile("activity_sent_group_messages");
        TS.templates.activity_sent_dms = TS.templates.compile("activity_sent_dms");
        TS.templates.activity_user_file = TS.templates.compile("activity_user_file");
        TS.templates.activity_user_file_post = TS.templates.compile("activity_user_file_post");
        TS.templates.activity_user_file_snippet = TS.templates.compile("activity_user_file_snippet");
        TS.templates.activity_user_file_comment = TS.templates.compile("activity_user_file_comment");
        TS.templates.activity_user_star = TS.templates.compile("activity_user_star");
        TS.templates.activity_starred_by_you = TS.templates.compile("activity_starred_by_you");
        TS.templates.activity_day = TS.templates.compile("activity_day");
        TS.templates.activity_days_list = TS.templates.compile("activity_days_list");
        TS.templates.activity_individual_list = TS.templates.compile("activity_individual_list");
        TS.templates.star_item = TS.templates.compile("star_item");
        TS.templates.group_create = TS.templates.compile("group_create");
        TS.templates.channel_create_dialog = TS.templates.compile("channel_create_dialog");
        TS.templates.list_browser_dialog = TS.templates.compile("list_browser_dialog");
        TS.templates.list_browser_items = TS.templates.compile("list_browser_items");
        TS.templates.list_browser_items_by_membership = TS.templates.compile("list_browser_items_by_membership");
        TS.templates.purpose_dialog = TS.templates.compile("purpose_dialog");
        TS.templates.file_upload_dialog = TS.templates.compile("file_upload_dialog");
        TS.templates.channel_invite_list = TS.templates.compile("channel_invite_list");
        TS.templates.group_invite_list = TS.templates.compile("group_invite_list");
        TS.templates.channel_member_invite_list = TS.templates.compile("channel_member_invite_list");
        TS.templates.group_member_invite_list = TS.templates.compile("group_member_invite_list");
        TS.templates.channel_conversion_dialog = TS.templates.compile("channel_conversion_dialog");
        TS.templates.channel_data_retention_dialog = TS.templates.compile("channel_data_retention_dialog");
        TS.templates.channel_deletion_dialog = TS.templates.compile("channel_deletion_dialog");
        TS.templates.channel_options_dialog = TS.templates.compile("channel_options_dialog");
        TS.templates.file_sharing = TS.templates.compile("file_sharing");
        TS.templates.file_public_link = TS.templates.compile("file_public_link");
        TS.templates.prefs_dialog = TS.templates.compile("prefs_dialog");
        TS.templates.debug_prefs_dialog = TS.templates.compile("debug_prefs_dialog");
        TS.templates.channel_prefs_dialog = TS.templates.compile("channel_prefs_dialog");
        TS.templates.help_dialog = TS.templates.compile("help_dialog");
        TS.templates.share_dialog = TS.templates.compile("share_dialog");
        TS.templates.lightbox_image_container = TS.templates.compile("lightbox_image_container");
        TS.templates.lightbox_external_image_container = TS.templates.compile("lightbox_external_image_container");
        TS.templates.lightbox_dialog = TS.templates.compile("lightbox_dialog");
        TS.templates.snippet_dialog = TS.templates.compile("snippet_dialog");
        TS.templates.generic_dialog = TS.templates.compile("generic_dialog");
        TS.templates.generic_dialog_sample = TS.templates.compile("generic_dialog_sample");
        TS.templates.existing_groups = TS.templates.compile("existing_groups");
        TS.templates.tip_card = TS.templates.compile("tip_card");
        if (TS.boot_data.feature_sidebar_themes) {
            TS.templates.sidebar_theme_css = TS.templates.compile("sidebar_theme_css")
        }
        TS.templates.shortcuts_dialog = TS.templates.compile("shortcuts_dialog");
        TS.templates.omnibox = TS.templates.compile("omnibox");
        TS.templates.growl_prompt_overlay = TS.templates.compile("growl_prompt_overlay");
        TS.templates.admin_list_item = TS.templates.compile("admin_list_item");
        TS.templates.admin_invite_list_item = TS.templates.compile("admin_invite_list_item");
        TS.templates.admin_invite_row = TS.templates.compile("admin_invite_row");
        TS.templates.admin_restricted_info = TS.templates.compile("admin_restricted_info");
        TS.templates.admin_restrict_account = TS.templates.compile("admin_restrict_account");
        TS.templates.issue_list_item = TS.templates.compile("issue_list_item");
        TS.templates.help_issue_div = TS.templates.compile("help_issue_div");
        TS.templates.help_issue_reply_comments = TS.templates.compile("help_issue_reply_comments");
        TS.templates.messages_search_paging = TS.templates.compile("messages_search_paging");
        TS.templates.files_search_paging = TS.templates.compile("files_search_paging");
        TS.templates.account_notifications_channel_overrides = TS.templates.compile("account_notifications_channel_overrides");
        TS.templates.account_notifications_channel_overrides_row = TS.templates.compile("account_notifications_channel_overrides_row");
        TS.templates.billing_contact = TS.templates.compile("billing_contact");
        TS.templates.billing_add_contact_form = TS.templates.compile("billing_add_contact_form");
        TS.info(TS.utility.date.getTimeStamp() - a + "ms spent compiling templates")
    },
    registerPartials: function() {
        Handlebars.registerPartial("channel", $("#channel_template").html());
        Handlebars.registerPartial("member", $("#member_template").html());
        Handlebars.registerPartial("member", $("#member_template").html());
        Handlebars.registerPartial("team_list_item", $("#team_list_item_template").html());
        Handlebars.registerPartial("comment", $("#comment_template").html());
        Handlebars.registerPartial("search_widget_message_result", $("#search_widget_message_result_template").html());
        Handlebars.registerPartial("search_widget_file_result", $("#search_widget_file_result_template").html());
        Handlebars.registerPartial("search_message_results_item", TS.templates.search_message_results_item);
        Handlebars.registerPartial("list_browser_items", TS.templates.list_browser_items);
        Handlebars.registerPartial("file_public_link", TS.templates.file_public_link)
    },
    makeUnreadMessagesDomId: function(a) {
        return TS.utility.makeSafeForDomId("activity_unread_messages_" + a.id)
    },
    makeUnreadGroupMessagesDomId: function(a) {
        return TS.utility.makeSafeForDomId("activity_unread_group_messages_" + a.id)
    },
    makeUnreadDmsDomId: function(a) {
        return TS.utility.makeSafeForDomId("activity_unread_dms_" + a.id)
    },
    makeSentMessagesDomId: function(a) {
        return TS.utility.makeSafeForDomId("activity_sent_messages_" + a.id)
    },
    makeSentGroupMessagesDomId: function(a) {
        return TS.utility.makeSafeForDomId("activity_sent_group_messages_" + a.id)
    },
    makeActivityMessagesDomId: function(a) {
        return TS.utility.makeSafeForDomId("activity_messages_" + a)
    },
    makeActivityDayDomId: function(a) {
        return "activity_day_" + a
    },
    makeIssueListDomId: function(a) {
        return "issue_list_" + a
    },
    makeSentDmsDomId: function(a) {
        return TS.utility.makeSafeForDomId("activity_sent_dms_" + a.id)
    },
    makeMsgDomId: function(a) {
        return TS.utility.makeSafeForDomId("msg_" + a)
    },
    makeMsgAttachmentTextExpanderDomId: function(b, a) {
        return TS.utility.makeSafeForDomId("msg_rest_text_expander_" + b + "_" + a)
    },
    makeMSRDomId: function(a) {
        return TS.utility.makeSafeForDomId("MSR_" + a.channel.id + "_" + a.ts)
    },
    makeChannelDomId: function(a) {
        return "channel_" + a.id
    },
    makeDayDividerDomId: function(a) {
        return TS.utility.makeSafeForDomId("day_divider_" + a)
    },
    makeGroupDomId: function(a) {
        return "group_" + a.id
    },
    makeMemberDomId: function(a) {
        if (!a) {
            return
        }
        return TS.templates.makeMemberDomIdById(a.id)
    },
    makeMemberDomIdById: function(a) {
        if (!a) {
            return
        }
        return "member_" + a
    },
    makeChannelListDomId: function(a) {
        return "channel_" + a.id + "_member_list"
    },
    makeFileDomId: function(a) {
        return "file_" + a.id
    },
    makeFileCommentsDomId: function(a) {
        return "file_comments_" + a.id
    },
    makeFileContentsDomId: function(a) {
        return "file_contents_" + a.id
    },
    makeUnreadJustDomId: function(a) {
        return "unread_just_" + a.id
    },
    makeUnreadHighlightDomId: function(a) {
        if (!a) {
            return
        }
        return "unread_highlight_" + a.id
    },
    makeMemberPresenceDomClass: function(a) {
        return "member_presence_" + a
    },
    makeMemberPresenceIcon: function(d) {
        var c = TS.templates.makeMemberPresenceDomClass(d.id);
        var a = '<i class="fa fa-circle presence_icon"></i>';
        if (d.is_ultra_restricted) {
            c += " ura";
            a = '<i class="fa fa-caret-up presence_icon"></i>'
        } else {
            if (d.is_restricted) {
                c += " ra";
                a = '<i class="fa fa-stop presence_icon"></i>'
            }
        }
        var b = '<span class="presence ' + d.presence + " " + c + '" title="' + d.presence + '">' + a + "</span>";
        return b
    },
    makeMemberStatusDomClass: function(a) {
        return "member_status_" + a
    },
    memberUserColorChanged: function(d) {
        var a = "color_" + d.id;
        if (d.color == d.member_color) {
            var c = "color_rule_" + a;
            var b = $("#" + c);
            b.remove();
            return
        }
        TS.templates.makeUserColorRule(a, "#" + d.member_color)
    },
    makeUserColorRule: function(a, c) {
        c = TS.utility.htmlEntities(c);
        var e = "color_rule_" + a;
        var b = $("#" + e);
        var d = "			." + a + ":not(.not_user_colored), 			#col_channels ul li:not(.active):not(.away) > ." + a + ":not(.not_user_colored), 			#col_channels:not(.show_presence) ul li > ." + a + ":not(.not_user_colored) {				color:" + c + ";			}			";
        if (b.length) {
            b.html(d)
        } else {
            $('<style type="text/css" id="' + e + '">' + d + "</style>").appendTo("body")
        }
    },
    sidebarBehaviorPrefChanged: function() {
        TS.templates.makeSidebarBehaviorRule()
    },
    makeSidebarBehaviorRule: function() {
        var c;
        var b = "sidebar_behavior";
        var a = $("#" + b);
        if (TS.model.prefs.sidebar_behavior == "hide_read_channels") {
            c = "				.channels_list_holder ul li:not(.unread):not(.active) {					display: none;			}"
        } else {
            if (TS.model.prefs.sidebar_behavior == "hide_read_channels_unless_starred") {
                c = "				.channels_list_holder div:not(#starred_div)>ul li:not(.unread):not(.active) {					display: none;			}"
            } else {
                if (TS.model.prefs.sidebar_behavior == "shrink_left_column") {
                    c = "				.real_names .im_name {					font-size: 0.7rem;				}				.channels_list_holder ul li a {					height: auto;				}				.channels_list_holder ul li {					height: auto;					font-size: .7rem;				}				.channels_list_holder ul li {					height: auto;					line-height: .8rem;				}				.channels_list_holder .section_holder {					margin: .3rem 0 .4rem;				}				.slackbot_icon, .channels_list_holder ul li.group i.prefix {					font-size: 0.4rem;					margin-top: 4px;				}				.channels_list_holder .unread_highlight {					background: none repeat scroll 0 0 #eb4d5c;					font-size: 0.5rem;					font-weight: 700;					line-height: 10px;					padding: 0 9px;				}				#im-list .presence i.presence_icon, #starred-list .presence i.presence_icon {					font-size: 7px;				}				.channels_list_holder h2, .list_more {					font-size: .6rem;			}"
                }
            }
        } if (c) {
            if (a.length) {
                a.text(c)
            } else {
                $('<style type="text/css" id="' + b + '">' + c + "</style>").appendTo("head")
            }
        } else {
            $("#" + b).remove()
        }
    }
});
TS.registerModule("templates.builders", {
    onStart: function() {},
    activityDaysListHTML: function(d) {
        var c;
        var b = "";
        if (d) {
            for (var a = 0; a < d.length; a++) {
                b += TS.templates.activity_day({
                    content: TS.templates.builders.activityListHTML(d[a].items, "team", d[a].date),
                    date_str: d[a].date
                })
            }
        }
        b = TS.templates.activity_days_list({
            content: b,
            has_more: TS.activity.team_has_more
        });
        return b
    },
    activityIndividualListHTML: function(b) {
        var a = TS.templates.activity_individual_list({
            content: TS.templates.builders.activityListHTML(b.activity, "individual"),
            has_more: !!b.individual_activity_next_ts,
            member: b
        });
        return a
    },
    debug_items: {},
    debug_items_index: 0,
    activityListHTML: function(j, l, d) {
        var n;
        var f = "";
        var h;
        var b = TS.qs_args.debug_activity == "1";
        if (j) {
            for (var e = 0; e < j.length; e++) {
                n = j[e];
                if (b) {
                    var k = "act_item_" + (TS.templates.builders.debug_items_index++);
                    TS.templates.builders.debug_items[k] = n;
                    f += '<p class="admin-section" style="padding: 2px">Activity type: <a onclick="TS.dir(0, TS.templates.builders.debug_items[\'' + k + "'])\">" + n.type + "</a></p>"
                }
                h = {
                    item: n,
                    feed_type: l
                };
                if ((n.type == "file_stars" || n.type == "file_comment_stars" || n.type == "message_stars") && h.item.stars) {
                    for (var c = 0; c < h.item.stars.length; c++) {
                        if (TS.model.user.id == h.item.stars[c].user) {
                            h.can_unstar = true;
                            break
                        }
                    }
                }
                if (d) {
                    h.date_str = d
                }
                if (n.type == "file_comments" || n.type == "user_file_comment") {
                    h.item["file"]["icon_class"] = TS.utility.getImageIconClass(n.file, "thumb_80")
                } else {
                    if (n.type == "user_file") {
                        h.item["file"]["icon_class"] = TS.utility.getImageIconClass(n.file, "thumb_80")
                    } else {
                        if (n.type == "user_files") {
                            $.each(n.files, function(m, o) {
                                h.item["files"][m]["icon_class"] = TS.utility.getImageIconClass(o, "thumb_80")
                            })
                        }
                    }
                } if (l == "individual") {
                    h.current_user_id = TS.model.user.id
                }
                if ((n.type == "starred_by_you" || n.type == "user_star") && n.item.type == "message") {
                    var a = TS.channels.getChannelById(n.item.channel);
                    if (!a) {
                        a = TS.groups.getGroupById(n.item.channel)
                    }
                    if (a) {
                        if (!h.item["item"]["permalink"]) {
                            h.item["item"]["permalink"] = TS.utility.msgs.constructMsgPermalink(a, n.item.message.ts)
                        }
                    } else {
                        if (n.type != "user_star") {
                            a = TS.ims.getImById(n.item.channel);
                            if (a) {
                                var g = TS.members.getMemberById(a.user);
                                h.item["item"]["message"]["recipient"] = g
                            }
                        }
                    } if (!a) {
                        continue
                    }
                }
                if (n.type == "message_stars") {
                    var a = TS.channels.getChannelById(n.channel);
                    if (!a) {
                        a = TS.groups.getGroupById(n.channel)
                    }
                    if (a) {
                        if (!h.item["message"]["permalink"]) {
                            h.item["message"]["permalink"] = TS.utility.msgs.constructMsgPermalink(a, n.message.ts)
                        }
                    } else {
                        a = TS.ims.getImById(n.channel);
                        if (a) {
                            var g = TS.members.getMemberById(a.user);
                            h.item["message"]["recipient"] = g
                        }
                    } if (!a) {
                        continue
                    }
                }
                if (n.type == "messages") {
                    if (n.channels_with_messages > 0 || n.dms.length > 0 || n.groups.length > 0) {
                        h.expanded = TS.activity.view.isActivityMessagesListExpanded(d);
                        f += TS.templates.activity_messages(h)
                    }
                } else {
                    if (n.type == "user_files") {
                        if (n.num_files == 1) {
                            switch (n.files[0].mode) {
                                case "post":
                                    f += TS.templates.activity_user_files_post(h);
                                    break;
                                case "snippet":
                                    f += TS.templates.activity_user_files_snippet(h);
                                    break;
                                default:
                                    f += TS.templates.activity_user_files(h);
                                    break
                            }
                        } else {
                            f += TS.templates.activity_user_files(h)
                        }
                    } else {
                        if (n.type == "team_files") {} else {
                            if (n.type == "file_comments") {
                                f += TS.templates.activity_file_comments(h)
                            } else {
                                if (n.type == "file_stars") {
                                    f += TS.templates.activity_file_stars(h)
                                } else {
                                    if (n.type == "file_comment_stars") {
                                        f += TS.templates.activity_file_comment_stars(h)
                                    } else {
                                        if (n.type == "message_stars") {
                                            f += TS.templates.activity_message_stars(h)
                                        } else {
                                            if (n.type == "starred_by_you") {
                                                f += TS.templates.activity_starred_by_you(h)
                                            } else {
                                                if (n.type == "user_star") {
                                                    if (n.item.type != "im") {
                                                        f += TS.templates.activity_user_star(h)
                                                    }
                                                } else {
                                                    if (n.type == "new_channels") {
                                                        f += TS.templates.activity_new_channels(h)
                                                    } else {
                                                        if (n.type == "new_members") {
                                                            f += TS.templates.activity_new_members(h)
                                                        } else {
                                                            if (n.type == "unread_messages") {
                                                                f += TS.templates.activity_unread_messages(h)
                                                            } else {
                                                                if (n.type == "unread_group_messages") {
                                                                    f += TS.templates.activity_unread_group_messages(h)
                                                                } else {
                                                                    if (n.type == "unread_dms") {
                                                                        f += TS.templates.activity_unread_dms(h)
                                                                    } else {
                                                                        if (n.type == "sent_messages") {
                                                                            f += TS.templates.activity_sent_messages(h)
                                                                        } else {
                                                                            if (n.type == "sent_group_messages") {
                                                                                f += TS.templates.activity_sent_group_messages(h)
                                                                            } else {
                                                                                if (n.type == "sent_dms") {
                                                                                    f += TS.templates.activity_sent_dms(h)
                                                                                } else {
                                                                                    if (n.type == "user_file") {
                                                                                        switch (n.file.mode) {
                                                                                            case "post":
                                                                                                f += TS.templates.activity_user_file_post(h);
                                                                                                break;
                                                                                            case "snippet":
                                                                                                f += TS.templates.activity_user_file_snippet(h);
                                                                                                break;
                                                                                            default:
                                                                                                f += TS.templates.activity_user_file(h);
                                                                                                break
                                                                                        }
                                                                                    } else {
                                                                                        if (n.type == "user_file_comment") {
                                                                                            f += TS.templates.activity_user_file_comment(h)
                                                                                        } else {
                                                                                            if (n.type == "user_rename") {} else {
                                                                                                f += "<div>UNHANDLED: " + n.type + "</div>";
                                                                                                continue
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
                    }
                }
            }
        }
        return f
    },
    fileHTML: function(c, e, d) {
        var g = TS.members.getMemberById(c.user);
        var a = TS.files.getFileActions(c);
        var f = {
            member: g,
            file: c,
            for_search: d,
            show_revoke_public_link: a.revoke_public_link
        };
        var b;
        if (e == "grid") {
            switch (c.mode) {
                case "snippet":
                    b = TS.templates.file_snippet_masonry_item(f);
                    break;
                case "post":
                    b = TS.templates.file_post_masonry_item(f);
                    break;
                case "hosted":
                case "external":
                    f.external_filetype_html = TS.templates.builders.makeExternalFiletypeHTML(c);
                default:
                    b = TS.templates.file_masonry_item(f);
                    break
            }
        } else {
            switch (c.mode) {
                case "snippet":
                    b = TS.templates.file_snippet_list_item(f);
                    break;
                case "post":
                    b = TS.templates.file_post_list_item(f);
                    break;
                case "hosted":
                case "external":
                    f.external_filetype_html = TS.templates.builders.makeExternalFiletypeHTML(c);
                default:
                    f.icon_class = TS.utility.getImageIconClass(c, "thumb_80");
                    b = TS.templates.file_list_item(f);
                    break
            }
        }
        return b
    },
    buildMsgHTML: function(F, e) {
        if (e) {
            TS.dir(0, F)
        }
        try {
            var f = true;
            var E = F.msg;
            if (false && E.text) {
                E = TS.utility.clone(E);
                E.text += " <slack-action://BSLACKBOT/help/files/D026MK7NF|testing>"
            }
            var H = F.model_ob;
            var y = F.prev_msg;
            var N = !!F.highlight;
            var p = !!F.no_attachments;
            var C = !!F.standalone;
            var u = !!F.full_date;
            var w = F.jump_link;
            var g = !!F.starred_items_list;
            var l = (F.container_id) ? "#" + F.container_id : "";
            var q = !!F.enable_slack_action_links;
            var x = F.theme;
            if (!x) {
                x = TS.model.prefs.theme
            }
            var v = "";
            var I = TS.members.getMemberById(E.user);
            var n = true;
            var c = !C;
            var P = false;
            var z = false;
            var K = TS.utility.date.toDateObject(E.ts);
            var h = false;
            var G = false;
            var d = !!(E.rsp_id);
            var o = false;
            var D = E.user;
            var j = E.is_ephemeral;
            if (!D && f) {
                D = TS.templates.builders.getBotIdentifier(E)
            }
            var s;
            if (y) {
                s = (y.subtype == "file_comment" && y.comment) ? y.comment.user : y.user;
                if (!s && f) {
                    s = TS.templates.builders.getBotIdentifier(y)
                }
            }
            if (!E.no_display && !C) {
                if (y) {
                    var A = TS.utility.date.toDateObject(y.ts);
                    if (H.last_read <= y.ts) {
                        z = true
                    }
                    if (E.subtype && E.subtype == "file_comment" && E.comment) {
                        D = E.comment.user
                    }
                    if (TS.utility.msgs.automated_subtypes.indexOf(E.subtype) != -1) {
                        c = true;
                        n = true
                    } else {
                        if (s == D && TS.utility.msgs.automated_subtypes.indexOf(y.subtype) === -1) {
                            if (!E.subtype && y.subtype && y.subtype == "file_comment") {
                                c = true;
                                n = true
                            } else {
                                if (x == "light" && E.subtype == "file_share" || E.subtype == "file_mention") {
                                    c = true
                                } else {
                                    c = false
                                } if (!y.subtype || (TS.templates.builders.getBotIdentifier(y) && f)) {
                                    n = false
                                }
                                if (TS.utility.msgs.isTempMsg(E) && (E.type == "bot_message" || E.user == "USLACKBOT")) {
                                    n = true
                                }
                            }
                        }
                    } if (!d && !TS.utility.date.sameDay(K, A)) {
                        if (!$(l + ' div.day_divider[data-date="' + TS.utility.date.toCalendarDate(E.ts) + '"]').length) {
                            try {
                                v += TS.templates.messages_day_divider({
                                    ts: E.ts
                                })
                            } catch (M) {
                                TS.logError(M, "Problem with TS.templates.messages_day_divider 1.1 msg.ts:" + (E ? E.ts : "no msg?"))
                            }
                        }
                        h = true;
                        var t = $(l + " div.day_divider");
                        if (t.length > 0) {
                            var r;
                            var b = $(t[t.length - 1]);
                            if (b.length) {
                                r = "";
                                try {
                                    r = TS.templates.messages_day_divider({
                                        ts: b.data("ts")
                                    })
                                } catch (M) {
                                    TS.logError(M, "Problem with TS.templates.messages_day_divider 2.1 $last_divider.data('ts'):" + b.data("ts"))
                                }
                                b.replaceWith(r)
                            }
                            if (t.length > 1) {
                                var L = $(t[t.length - 2]);
                                if (L.length) {
                                    r = "";
                                    try {
                                        r = TS.templates.messages_day_divider({
                                            ts: L.data("ts")
                                        })
                                    } catch (M) {
                                        TS.logError(M, "Problem with TS.templates.messages_day_divider 3.1 $second_last_divider.data('ts'):" + L.data("ts"))
                                    }
                                    L.replaceWith(r)
                                }
                            }
                        }
                    }
                    if (!d && TS.utility.date.distanceInMinutes(K, A) > TS.model.msg_activity_interval) {
                        G = true;
                        H.last_time_divider = K
                    }
                } else {
                    if (!$(l + ' div.day_divider[data-date="' + TS.utility.date.toCalendarDate(E.ts) + '"]').length) {
                        try {
                            v += TS.templates.messages_day_divider({
                                ts: E.ts
                            })
                        } catch (M) {
                            TS.logError(M, "Problem with TS.templates.messages_day_divider 4.1 msg.ts:" + (E ? E.ts : "no msg?"))
                        }
                    }
                    G = true;
                    H.last_time_divider = K
                }
            }
            if (G) {
                n = true;
                P = true
            }
            if (E.type != "message") {
                n = true
            }
            if (E.subtype == "bot_message") {
                if (TS.templates.builders.getBotIdentifier(E)) {
                    if (!f) {
                        n = true
                    }
                } else {
                    n = false
                }
            }
            if (E.subtype == "me_message" || (y && y.subtype == "me_message")) {
                n = true;
                c = true
            }
            var O = true;
            if (C) {
                O = false
            }
            var B = TS.utility.msgs.getMsgActions(E);
            var a = false;
            if (B.edit_msg || B.delete_msg) {
                a = true
            }
            var m = {
                msg: E,
                actions: B,
                show_actions_cog: a,
                member: I,
                show_user: n,
                hide_user_name: o,
                show_divider: c,
                first_in_block: P,
                unread: z,
                unprocessed: d,
                highlight: N,
                model_ob: H,
                do_inline_imgs: O,
                msg_dom_id: TS.templates.makeMsgDomId(E.ts),
                standalone: C,
                full_date: u,
                jump_link: w,
                show_resend_controls: E.ts in TS.model.display_unsent_msgs,
                starred_items_list: g,
                theme: x,
                no_attachments: p,
                is_ephemeral: j,
                enable_slack_action_links: q
            };
            if (!TS.utility.msgs.isTempMsg(E)) {
                m.permalink = TS.utility.msgs.constructMsgPermalink(H, E.ts)
            }
            if (E.subtype == "file_share" || E.subtype == "file_mention") {
                if (!E.file) {} else {
                    m.file = E.file;
                    m.is_mention = (E.subtype == "file_mention");
                    m.lightbox = false;
                    if (E.file.thumb_360_w == 360 || E.file.thumb_360_h == 360) {
                        m.lightbox = true
                    }
                    if (E.subtype == "file_share" && E.upload) {
                        m.show_initial_comment = true;
                        if (E.file.mode == "snippet") {
                            v += TS.templates.message_file_snippet_create(m)
                        } else {
                            m.icon_class = TS.utility.getImageIconClass(E.file, "thumb_80");
                            try {
                                v += TS.templates.message_file_upload(m)
                            } catch (M) {
                                var Q = E.ts;
                                try {
                                    var k = TS.utility.clone(E);
                                    delete k.text;
                                    Q += " " + JSON.stringify(k, null, "\t")
                                } catch (M) {}
                                TS.logError(M, "Problem with TS.templates.message_file_upload msg:" + Q);
                                v += '<p class="small_top_margin small_bottom_margin"><code>Error rendering file_share msg</code></p>'
                            }
                        }
                    } else {
                        if (E.file.user != E.user) {
                            var J = TS.members.getMemberById(E.file.user);
                            m.uploader = J
                        }
                        if (E.file.mode == "snippet") {
                            v += TS.templates.message_file_snippet_share(m)
                        } else {
                            if (E.file.mode == "post") {
                                v += TS.templates.message_file_post_share(m)
                            } else {
                                m.icon_class = TS.utility.getImageIconClass(E.file, "thumb_40");
                                if (E.file.is_external) {
                                    m.external_filetype_html = TS.templates.builders.makeExternalFiletypeHTML(E.file)
                                }
                                v += TS.templates.message_file_share(m)
                            }
                        }
                    }
                }
            } else {
                if (E.subtype == "file_comment") {
                    if (y && !y.no_display && y.file && E.file && E.file.id == y.file.id) {
                        m.show_divider = false;
                        if (!h) {
                            m.is_file_convo_continuation = true
                        }
                    }
                    m.show_comment_quote_icon = true;
                    if (y && !y.no_display && y.file && E.file && E.file.id == y.file.id) {
                        if (y.subtype == "file_share" && y.upload && y.file.initial_comment) {
                            if (!h) {
                                m.show_comment_quote_icon = false
                            }
                        }
                        if (y.subtype == "file_comment") {
                            if (!h) {
                                m.show_comment_quote_icon = false
                            }
                        }
                    }
                    m.file = E.file;
                    m.icon_class = TS.utility.getImageIconClass(E.file, "thumb_40");
                    m.comment = E.comment;
                    I = (E.comment) ? TS.members.getMemberById(E.comment.user) : null;
                    m.member = I;
                    if (E.file && E.file.user != E.comment.user) {
                        var J = TS.members.getMemberById(E.file.user);
                        m.uploader = J
                    }
                    if (E.file && E.file.mode == "post") {
                        v += TS.templates.message_file_post_comment(m)
                    } else {
                        v += TS.templates.message_file_comment(m)
                    }
                } else {
                    v += TS.templates.message(m)
                }
            }
            v = v.replace(/\ue000/g, "").replace(/\ue001/g, "");
            return v
        } catch (M) {
            var Q = "";
            if (E) {
                Q = "msg.ts:" + E.ts;
                delete F.model_ob;
                try {
                    F.msg = TS.utility.clone(E);
                    delete F.msg.text;
                    Q += " " + JSON.stringify(F, null, "\t")
                } catch (M) {}
            }
            TS.logError(M, "Problem in buildMsgHTML with_args " + Q);
            return ""
        }
    },
    formatSoundUrl: function(c, b) {
        return "";
        if (!c) {
            return ""
        }
        if (!c.audio_url) {
            return ""
        }
        var a = '<a class="inline_audio_play_link" href="' + c.audio_url + '" target="_blank">' + (c.audio_title ? c.audio_title + " " : "") + '<i class="fa fa-play-circle"></i></a>';
        return a
    },
    buildAttachmentHTML: function(b) {
        var j = TS.templates.makeMsgDomId(b.msg.ts);
        var p = b.attachment;
        if (TS.templates.builders.shouldDoSimpleAttachment(p, b.msg)) {
            if (p.video_html) {
                return TS.templates.builders.buildInlineVideoTogglerAndDiv(p.from_url, j)
            } else {
                if (p.image_url) {
                    return TS.templates.builders.buildInlineImgTogglerAndDiv(p.from_url, j)
                } else {
                    if (p.audio_url) {
                        return " " + TS.templates.builders.formatSoundUrl(p, b.msg)
                    }
                }
            }
        }
        var y = true;
        var l = "";
        var k = "";
        if (b.show_initial_caret || b.show_media_caret) {
            if (p.video_html) {
                var a = TS.model.inline_videos[p.from_url || p.thumb_url];
                if (a) {
                    var x = true;
                    l = TS.templates.builders.buildInlineVideoToggler(p.from_url || p.thumb_url, j, x);
                    k = p.thumb_url;
                    y = TS.inline_videos.shouldExpand(j, a)
                }
            } else {
                if (p.audio_html || p.audio_url) {
                    var h = TS.model.inline_audios[p.audio_html || p.audio_url];
                    if (h) {
                        l = TS.templates.builders.buildInlineAudioToggler(p.audio_html || p.audio_url, j);
                        k = p.audio_html || p.audio_url;
                        y = TS.inline_audios.shouldExpand(j, h)
                    }
                } else {
                    if (p.image_url) {
                        var o = TS.model.inline_imgs[p.from_url || p.image_url];
                        if (o) {
                            var t = !b.show_media_caret;
                            l = TS.templates.builders.buildInlineImgToggler(p.from_url || p.image_url, j, t);
                            k = p.image_url;
                            y = TS.inline_imgs.shouldExpand(j, o)
                        }
                    } else {
                        var w = TS.model.inline_attachments[p.from_url];
                        if (w) {
                            k = p.from_url;
                            l = TS.templates.builders.buildInlineAttachmentToggler(p.from_url, j);
                            y = TS.inline_attachments.shouldExpand(j, w)
                        } else {
                            TS.warn("no inline_attachment for " + p.from_url)
                        }
                    }
                }
            }
        }
        if (p.color) {
            if (typeof p.color == "number") {
                p.color = p.color.toString()
            }
            if (!p.color.indexOf) {
                TS.warn("msg " + b.msg.ts + " has an invalid (non string) color:" + p.color + " (removed in client)");
                delete p.color
            } else {
                if (p.color.indexOf("#") != -1) {
                    TS.warn("msg " + b.msg.ts + " has an invalid color:" + p.color + " (fixed in client)")
                }
                p.color = p.color.replace(/\#/g, "")
            }
        }
        var m = [];
        var q = [];
        if (p.fields) {
            var A;
            var v;
            var n;
            for (var z = 0; z < p.fields.length; z++) {
                v = true;
                A = p.fields[z];
                if (n && A["short"] && n["short"] && n._new_row) {
                    v = false
                }
                A._new_row = v;
                n = A;
                if (A["short"]) {
                    m.push(A)
                } else {
                    q.push(A)
                }
            }
        }
        var d = p._short_text && !TS.inline_attachments.shouldExpandText(TS.templates.makeMsgAttachmentTextExpanderDomId(b.msg.ts, p._index));
        var r = p.ts_link || p.from_url || p.title_link || p.author_link;
        var g = p.thumb_link || r;
        var u = TS.shared.getActiveModelOb();
        var e = false;
        if (!u) {
            TS.warn("need to get model_ob passed in here somehow! for expanding messages in activity feed")
        } else {
            e = (p.id || p.id == 0) && p.from_url && ((TS.model.user.is_admin && !u.is_im) || TS.model.user.id == b.msg.user)
        }
        var s = p.thumb_url && !p.image_url && !p.video_html && !p.audio_html;
        var c = (s) ? p.proxied_thumb_url || p.thumb_url : null;
        return TS.templates.message_attachment({
            is_text_collapsed: d,
            attachment: p,
            short_fields: m,
            long_fields: q,
            url: b.url,
            msg: b.msg,
            initial_caret_html: (b.show_initial_caret) ? l : "",
            media_caret_html: (b.show_media_caret) ? l : "",
            msg_dom_id: j,
            expand_it: (b.show_initial_caret) ? y : true,
            expand_media: (b.show_media_caret) ? y : true,
            real_src: k,
            bg_color: p.color || "e3e4e6",
            is_standalone: (!b.msg.text || b.msg.ignore_if_attachments_supported) || !p.pretext,
            show_fields_table: TS.qs_args.show_fields_table != "0",
            thumb_at_top: !window.attach_thumb_align_title,
            can_delete: e,
            ts_link: r,
            thumb_link: g,
            small_thumb: s,
            small_thumb_url: c,
            max_width_class: s ? "right_thumb_max_w" : "",
            show_fallback: TS.model.show_attachment_fallback,
            enable_slack_action_links: b.enable_slack_action_links === true,
            show_action_links: b.enable_slack_action_links === true
        })
    },
    shouldDoSimpleAttachment: function(c, b) {
        var a = false;
        if ((c.image_url || c.audio_url) && c.from_url) {
            if (b && b.text && b.text.indexOf(c.from_url) != -1) {
                a = true
            }
            if (c.service_name || c.title) {
                a = false
            }
        }
        return a
    },
    formatAttachments: function(h, a) {
        a = (a === true);
        var e = "";
        if (!h.attachments) {
            return e
        }
        var g;
        var b;
        for (var d = 0; d < h.attachments.length; d++) {
            g = h.attachments[d];
            if (!g) {
                TS.info("formatAttachments bad attach");
                TS.dir(0, h);
                continue
            }
            if (g.slack_file_id) {
                var c = TS.files.getFileById(g.slack_file_id);
                if (c) {
                    if (!c.is_deleted && !g._slack_file_is_deleted) {
                        var f = {
                            icon_class: TS.utility.getImageIconClass(c, "thumb_40"),
                            file: c,
                            member: TS.members.getMemberById(h.user),
                            msg_dom_id: TS.templates.makeMsgDomId(h.ts),
                            uploader: TS.members.getMemberById(c.user)
                        };
                        if (c.mode == "snippet") {
                            e += TS.templates.file_snippet_reference(f)
                        } else {
                            if (c.mode == "post") {
                                e += TS.templates.file_post_reference(f)
                            } else {
                                f.icon_class = TS.utility.getImageIconClass(c, "thumb_40");
                                f.lightbox = false;
                                if (c.thumb_360_w == 360 || c.thumb_360_h == 360) {
                                    f.lightbox = true
                                }
                                if (c.is_external) {
                                    f.external_filetype_html = TS.templates.builders.makeExternalFiletypeHTML(c)
                                }
                                e += TS.templates.file_reference(f)
                            }
                        }
                    }
                } else {
                    if (!g._slack_file_is_deleted) {
                        TS.files.fetchFileInfo(g.slack_file_id, function(m, l) {
                            if (l && !l.is_deleted) {
                                var k = TS.inline_attachments.getAttachmentBySlackFileId(h.attachments, l.id);
                                if (k) {
                                    k._slack_file = l
                                }
                                var j = TS.shared.getActiveModelOb();
                                if (j) {
                                    TS.utility.msgs.updateFileMsgs(j, l)
                                }
                            }
                        })
                    }
                }
                continue
            }
            if (g.from_url && (TS.boot_data.feature_attachments_inline || TS.templates.builders.shouldDoSimpleAttachment(g, h))) {
                e += "";
                continue
            }
            if (!TS.inline_attachments.shouldShow(g, h)) {
                e += "";
                continue
            }
            e += TS.templates.builders.buildAttachmentHTML({
                attachment: g,
                url: null,
                msg: h,
                show_initial_caret: TS.templates.builders.shouldDoSimpleAttachment(g, h),
                show_media_caret: g.video_html || g.image_url || g.audio_html || g.audio_url,
                enable_slack_action_links: a
            })
        }
        return e
    },
    formatMessageByType: function(g, f, a) {
        var b = "";
        if (g.ignore_if_attachments_supported) {
            return b
        }
        f = (f === true);
        a = (a === true);
        if (g.subtype == "channel_join") {
            var d = TS.channels.getChannelById(TS.model.active_channel_id);
            var c = TS.members.getMemberById(g.inviter);
            if (c) {
                b = TS.format.formatMsg("joined" + (d ? " #" + d.name : " the channel") + " from an invitation by <@" + c.id + "|" + c.name + ">", g, false, false, false, false, true, true)
            } else {
                b = "joined" + (d ? " #" + d.name : " the channel")
            }
        } else {
            if (g.subtype == "channel_leave") {
                var d = TS.channels.getChannelById(TS.model.active_channel_id);
                b = "left" + (d ? " #" + d.name : " the channel")
            } else {
                if (g.subtype == "channel_name") {
                    var d = TS.channels.getChannelById(TS.model.active_channel_id);
                    b = 'renamed the channel from "' + g.old_name + '" to "' + g.name + '"'
                } else {
                    if (g.subtype == "channel_topic") {
                        if (!g.topic) {
                            b = "cleared the channel topic"
                        } else {
                            b = 'set the channel topic: <span class="topic">' + TS.format.formatMsg(g.topic, g, false, false, false, false, true, true) + "</span>"
                        }
                    } else {
                        if (g.subtype == "channel_purpose") {
                            if (!g.purpose) {
                                b = "cleared the channel purpose"
                            } else {
                                b = 'set the channel purpose: <span class="purpose">' + TS.format.formatMsg(g.purpose, g, false, false, false, false, true, true) + "</span>"
                            }
                        } else {
                            if (g.subtype == "group_join") {
                                var e = TS.groups.getGroupById(TS.model.active_group_id);
                                var c = TS.members.getMemberById(g.inviter);
                                if (c) {
                                    b = "joined" + (e ? " " + TS.model.group_prefix + e.name : " the group") + " " + TS.format.formatMsg("from an invitation by <@" + c.id + "|" + c.name + ">", g, false, false, false, false, true, true)
                                } else {
                                    b = "joined" + (e ? " " + TS.model.group_prefix + e.name : " the group")
                                }
                            } else {
                                if (g.subtype == "group_leave") {
                                    var e = TS.groups.getGroupById(TS.model.active_group_id);
                                    b = "left" + (e ? " " + TS.model.group_prefix + e.name : " the group")
                                } else {
                                    if (g.subtype == "group_name") {
                                        var d = TS.channels.getChannelById(TS.model.active_channel_id);
                                        b = 'renamed the group from "' + g.old_name + '" to "' + g.name + '"'
                                    } else {
                                        if (g.subtype == "group_topic") {
                                            if (!g.topic) {
                                                b = "cleared the group topic"
                                            } else {
                                                b = "set the group topic: " + TS.format.formatMsg(g.topic, g, false, false, false, false, true, true)
                                            }
                                        } else {
                                            if (g.subtype == "group_purpose") {
                                                if (!g.purpose) {
                                                    b = "cleared the group purpose"
                                                } else {
                                                    b = "set the group purpose: " + TS.format.formatMsg(g.purpose, g, false, false, false, false, true, true)
                                                }
                                            } else {
                                                if (g.subtype == "group_archive") {
                                                    var e = TS.groups.getGroupById(TS.model.active_group_id);
                                                    b = "archived" + (e ? " " + TS.model.group_prefix + e.name : " the group");
                                                    if (TS.client && e && e.is_archived) {
                                                        b += '. The contents will still be available in search and browsable in the <a target="_blank" href="/archives/' + e.name + '">archives</a>. 						It can also be un-archived at any time. To close it now, <a onclick="TS.groups.closeGroup(\'' + e.id + "')\">click here</a>."
                                                    }
                                                } else {
                                                    if (g.subtype == "group_unarchive") {
                                                        var e = TS.groups.getGroupById(TS.model.active_group_id);
                                                        b = "un-archived" + (e ? " " + TS.model.group_prefix + e.name : " the group")
                                                    } else {
                                                        if (g.subtype == "channel_archive") {
                                                            var d = TS.channels.getChannelById(TS.model.active_channel_id);
                                                            b = "archived" + (d ? " #" + d.name : " the channel");
                                                            if (TS.client && d && d.is_archived) {
                                                                b += '. The contents will still be available in search and browsable in the <a target="_blank" href="/archives/' + d.name + '">archives</a>. 						It can also be un-archived at any time. To close it now, <a onclick="TS.channels.closeArchivedChannel(\'' + d.id + "')\">click here</a>."
                                                            }
                                                        } else {
                                                            if (g.subtype == "channel_unarchive") {
                                                                var d = TS.channels.getChannelById(TS.model.active_channel_id);
                                                                b = "un-archived" + (d ? " #" + d.name : " the channel")
                                                            } else {
                                                                if (g.subtype == "me_message") {
                                                                    b = "<i>" + TS.format.formatMsg(g.text, g, f) + "</i>"
                                                                } else {
                                                                    if (g.subtype == "play_sound") {
                                                                        b = 'played "' + g.sound + '"'
                                                                    } else {
                                                                        b = TS.format.formatMsg(g.text, g, f, null, null, null, null, null, null, a)
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
        } if (!b && b != "") {
            TS.warn("no html msg.subtype:" + g.subtype);
            return ""
        }
        b = TS.utility.msgs.handleSearchHighlights(b);
        return b
    },
    formatSearchExtracts: function(c) {
        var b = "";
        var a = [];
        if (c.previous_2 && TS.search.view.msgHasExtracts(c.previous_2)) {
            a.push(c.previous_2)
        }
        if (c.previous && TS.search.view.msgHasExtracts(c.previous)) {
            a.push(c.previous)
        }
        if (c.extracts && TS.search.view.msgHasExtracts(c)) {
            a.push(c)
        }
        if (c.next && TS.search.view.msgHasExtracts(c.next)) {
            a.push(c.next)
        }
        if (c.next_2 && TS.search.view.msgHasExtracts(c.next_2)) {
            a.push(c.next_2)
        }
        a.forEach(function(d) {
            if (d.extracts && d.extracts.length > 0) {
                b += TS.templates.builders.formatMessageExtract(d)
            }
            if (d.attachments) {
                d.attachments.forEach(function(e) {
                    if (e.extracts && Object.keys(e.extracts).length > 0) {
                        b += TS.templates.builders.formatAttachmentExtract(e, d)
                    }
                })
            }
        });
        return b.replace(/\ue000/g, "").replace(/\ue001/g, "")
    },
    formatMessageExtract: function(a) {
        var c = a.user && TS.members.getMemberById(a.user);
        var b = a.bot_id && TS.bots.getBotById(a.bot_id);
        if (!b || !b.icons || !b.icons.image_48) {
            b = null
        }
        return TS.templates.search_message_extracts({
            message: a,
            member: c,
            bot: b
        })
    },
    formatAttachmentExtract: function(b, a) {
        return TS.templates.search_attachment_extracts({
            attachment: b,
            message: a
        })
    },
    msgHtmlForSearch: function(c, b, a) {
        if (c.subtype !== "bot_message") {
            c.subtype = null
        }
        return TS.templates.builders.buildMsgHTML({
            msg: c,
            prev_msg: b,
            model_ob: a,
            container_id: "search_message_results"
        })
    },
    buildMsgHTMLForSearch: function(f) {
        var b = f.channel;
        var c = "";
        var g = f.previous_expands || [];
        var a = [];
        if (f.previous_2) {
            a.push(f.previous_2)
        }
        if (f.previous) {
            a.push(f.previous)
        }
        a.push(f);
        if (f.next) {
            a.push(f.next)
        }
        if (f.next_2) {
            a.push(f.next_2)
        }
        var d = f.next_expands || [];
        var e;
        if (g.length > 0) {
            c += '<div class="search_message_result_previous_holder">';
            g.forEach(function(h) {
                c += TS.templates.builders.msgHtmlForSearch(h, e, b);
                e = h
            });
            c += "</div>"
        }
        a.forEach(function(h) {
            c += TS.templates.builders.msgHtmlForSearch(h, e, b);
            e = h
        });
        if (d.length > 0) {
            c += '<div class="search_message_result_next_holder">';
            d.forEach(function(h) {
                c += TS.templates.builders.msgHtmlForSearch(h, e, b);
                e = h
            });
            c += "</div>"
        }
        return c
    },
    star_html: '<span class="star fa fa-star"></span>',
    buildStar: function(c, a, g) {
        if (!c) {
            return ""
        }
        if (c == "channel" && a && typeof a == "string") {
            a = TS.channels.getChannelById(a)
        } else {
            if (c == "group" && a && typeof a == "string") {
                a = TS.groups.getGroupById(a)
            } else {
                if (c == "im" && a && typeof a == "string") {
                    a = TS.ims.getImById(a)
                }
            }
        } if (!a) {
            return ""
        }
        if (c == "message" && g && typeof g == "string") {
            var b = g;
            g = TS.channels.getChannelById(b);
            if (!g) {
                g = TS.ims.getImById(b)
            }
            if (!g) {
                g = TS.groups.getGroupById(b)
            }
        }
        var f = $(TS.templates.builders.star_html);
        var e = a.id || a.ts;
        var d = (g) ? g.id : null;
        if (c == "message") {
            if (!d) {
                return ""
            }
            f.attr("data-msg-id", e);
            f.attr("data-c-id", d);
            if (TS.utility.msgs.isTempMsg(a)) {
                f.addClass("hidden")
            }
        } else {
            if (c == "file") {
                f.attr("data-file-id", e)
            } else {
                if (c == "file_comment") {
                    f.attr("data-comment-id", e);
                    f.attr("data-file-id", d);
                    f.addClass("star_comment")
                } else {
                    if (c == "channel") {
                        f.attr("data-channel-id", e)
                    } else {
                        if (c == "group") {
                            f.attr("data-group-id", e)
                        } else {
                            if (c == "im") {
                                f.attr("data-im-id", e)
                            } else {
                                TS.error("buildStar needs to handle star item type:" + c);
                                return ""
                            }
                        }
                    }
                }
            }
        } if (a.is_starred) {
            f.addClass("starred")
        }
        f.addClass("star_" + c);
        return f[0].outerHTML
    },
    buildMentionHTML: function(k, h, d) {
        var b = k.message;
        var g = "";
        if (!b) {
            return g
        }
        if (b.subtype == "file_share" || b.subtype == "file_mention" || b.subtype == "file_comment") {
            if (!b.file) {
                return g
            }
        }
        var a = TS.channels.getChannelById(k.channel) || TS.groups.getGroupById(k.channel) || TS.ims.getImById(k.channel);
        if (!a) {
            return g
        }
        var f = TS.utility.date.toDateObject(b.ts);
        var n = (h) ? TS.utility.date.toDateObject(h.message.ts) : null;
        var j = false;
        if (!n || !TS.utility.date.sameDay(f, n)) {
            j = true
        }
        var e = true;
        var c = (h) ? h.channel : null;
        if (a.is_channel) {
            if (!a.is_member) {
                e = false
            }
        }
        if (!d) {
            if (j) {
                g += TS.templates.messages_day_divider({
                    ts: b.ts
                })
            } else {
                g += '<hr class="spacer">'
            } if (a.is_channel) {
                if (c != a.id || j) {
                    g += '<hr class="spacer">';
                    g += '<h3 class="small_bottom_margin"><a href="/archives/' + a.name + '" target="/archives/' + a.name + '" class="channel_link" data-channel-id="' + a.id + '"><span class="normal">#</span>' + a.name + "</a></h3>"
                }
            } else {
                if (a.is_group) {
                    if (c != a.id || j) {
                        g += '<hr class="spacer">';
                        g += '<h3 class="small_bottom_margin"><a href="/archives/' + a.name + '" target="/archives/' + a.name + '" class="group_link" data-group-id="' + a.id + '">' + a.name + "</a></h3>"
                    }
                } else {}
            }
        }
        var l = "";
        if (e && !!TS.utility.msgs.getMsg(b.ts, a.msgs)) {
            l = '<a class="msg_right_link msg_jump" data-cid="' + a.id + '">Jump</a>'
        } else {
            var m = TS.utility.msgs.constructMsgPermalink(a, b.ts);
            l = '<a class="msg_right_link" href="' + m + '" target="' + m + '">Archives</a>'
        }
        g += TS.templates.builders.buildMsgHTML({
            msg: b,
            model_ob: a,
            standalone: true,
            full_date: false,
            jump_link: l,
            no_attachments: !!b.text,
            theme: "light"
        });
        return g
    },
    buildStarredItemHTML: function(e) {
        var d = "<div class='star_item'>";
        var g = {
            star: e,
            current_user_id: TS.model.user.id
        };
        if (e.type == "message") {
            var b = e.message;
            var c = !!TS.client;
            var a = TS.channels.getChannelById(e.channel);
            if (a && !a.is_member) {
                c = false
            }
            if (!a) {
                a = TS.groups.getGroupById(e.channel)
            }
            if (!a && !b.permalink) {
                var a = TS.ims.getImById(e.channel);
                var f = TS.members.getMemberById(a.user);
                e.message["recipient"] = f
            }
            if (!a) {
                TS.warn("channel " + e.channel + " for this starred message was probably deleted");
                return ""
            }
            var h = "";
            if (c && !!TS.utility.msgs.getMsg(b.ts, a.msgs)) {
                h = '<a class="star_jump msg_right_link" data-cid="' + a.id + '">Jump</a>'
            } else {
                var j = TS.utility.msgs.constructMsgPermalink(a, b.ts);
                h = '<a class="msg_right_link" href="' + j + '" target="' + j + '">Archives</a>'
            }
            d += TS.templates.builders.buildMsgHTML({
                msg: b,
                model_ob: a,
                standalone: true,
                starred_items_list: true,
                jump_link: h,
                no_attachments: !!b.text,
                full_date: false,
                theme: "light"
            })
        } else {
            if (e.type == "file") {
                d += TS.templates.builders.buildStar("file", e.file);
                d += TS.templates.builders.fileHTML(e.file)
            } else {
                if (e.type == "channel" || e.type == "group") {
                    var a = TS.channels.getChannelById(e.channel);
                    if (!a) {
                        a = TS.groups.getGroupById(e.channel)
                    }
                    if (!a) {
                        TS.warn("channel or group " + e.channel + " was probably deleted");
                        return ""
                    }
                    g.model_ob = a;
                    d += TS.templates.star_item(g)
                } else {
                    d += TS.templates.star_item(g)
                }
            }
        }
        d += "</div>";
        return d
    },
    buildInlineImgTogglerAndDiv: function(a, b) {
        var c = TS.model.inline_imgs[a];
        if (!c) {
            return ""
        }
        return TS.templates.builders.buildInlineImgToggler(a, b) + " " + TS.templates.builders.buildInlineImgDiv(a, b)
    },
    buildInlineImgToggler: function(m, e, j) {
        var n = TS.model.inline_imgs[m];
        if (!n) {
            return ""
        }
        var b = TS.inline_imgs.shouldExpand(e, n);
        var c = n.link_url || m;
        var g = n.bytes && n.bytes > TS.model.inline_img_byte_limit;
        var d = n.width && n.height && (n.width * n.height) > TS.model.inline_img_pixel_limit;
        var k = !d;
        var a = "";
        if (!b && (!TS.model.prefs.obey_inline_img_limit || g) || d) {
            var f = !n.internal_file_id && TS.model.prefs.expand_inline_imgs && TS.model.expandable_state["img_" + e + n.src] !== false;
            var h = f && g;
            var l = f && d;
            if (f && d) {
                k = false;
                a = '<span class="too_large_for_auto_expand"> (Not automatically expanded because ' + n.width + "x" + n.height + " is too large to display inline.)</span>"
            } else {
                if (f && g) {
                    a = '<span class="too_large_for_auto_expand"> (Not automatically expanded because ' + TS.utility.convertFilesize(n.bytes) + ' is too large. You can <a class="cursor_pointer too_large_but_expand_anyway" data-real-src="' + TS.utility.htmlEntities(n.src) + '">expand it anyway</a> or <a ' + TS.utility.makeRefererSafeLink(c) + ' target="_blank" title="Open original in new tab">open it in a new window</a>.';
                    if (TS.model.show_inline_img_size_pref_reminder && !TS.model.shown_inline_img_size_pref_reminder_once) {
                        a += " You can also <a class=\"cursor_pointer\" onclick=\"TS.ui.prefs_dialog.start('messages', '#dont_obey_inline_img_limit_p')\">change your preferences</a> to allow images of any file size to auto expand.)";
                        TS.model.shown_inline_img_size_pref_reminder_once = true
                    }
                    a += "</span>"
                }
            }
        }
        var o = (n.bytes && j !== true) ? '<span class="inline_img_bytes ' + (a ? "hidden" : "") + '"> (' + TS.utility.convertFilesize(n.bytes) + ")</span>" : "";
        return o + a + (k ? '<i data-real-src="' + TS.utility.htmlEntities(n.src) + '" class="msg_inline_img_collapser fa fa-caret-down ' + (b ? "" : "hidden") + '"></i><i data-real-src="' + TS.utility.htmlEntities(n.src) + '" class="msg_inline_img_expander fa fa-caret-right ' + (b ? "hidden" : "") + '"></i>' : "")
    },
    buildInlineImgDiv: function(j, f, b) {
        var l = TS.model.inline_imgs[j];
        if (!l) {
            return ""
        }
        var c = b === true || TS.inline_imgs.shouldExpand(f, l);
        var e = l.link_url || j;
        var a = !!TS.client;
        var g = "";
        g = '<div data-real-src="' + TS.utility.htmlEntities(l.src) + '" class="clear-both msg_inline_img_holder msg_inline_holder ' + (c ? "" : "hidden") + '" style="width:' + l.display_w + "px; height:" + (l.display_h + 2) + 'px; max-width: 100%;">';
        var h = "ctrl";
        if (TS.model.is_mac) {
            h = "cmd"
        }
        if (l.internal_file_id) {
            var d = TS.files.getFileById(l.internal_file_id);
            if (d && d.mimetype.indexOf("image/") == 0) {
                if (d.external_type == "dropbox" || d.external_type == "gdrive" || d.external_type == "box") {
                    g += "<a " + TS.utility.makeRefererSafeLink(e) + ' target="_blank" title="Open original in new tab" class="lightbox_external_link" data-src="' + TS.utility.htmlEntities(l.src) + '"data-link-url="' + TS.utility.makeRefererSafeLink(l.link_url) + '">'
                } else {
                    var k = false;
                    if (d.thumb_360_w == 360 || d.thumb_360_h == 360) {
                        k = true
                    }
                    if (k) {
                        g += '<a href="' + e + '" target="_blank" title="Open in lightbox (' + h + '+click to open original in new tab)" class="lightbox_channel_link lightbox_link" data-file-id="' + l.internal_file_id + '">'
                    } else {
                        g += '<a href="' + e + '" target="_blank" title="' + h + '+click to open original in new tab" class="file_preview_link thumbnail_link" data-file-id="' + l.internal_file_id + '">'
                    }
                }
            } else {
                g += "<a " + TS.utility.makeRefererSafeLink(e) + ' target="_blank" class="' + d.filetype + '">'
            }
        } else {
            g += "<a " + TS.utility.makeRefererSafeLink(e) + ' target="_blank" title="Open in lightbox (' + h + '+click to open original in new tab)" class="lightbox_external_link" data-src="' + l.src + '" data-link-url="' + l.link_url + '" data-width="' + l.width + '" data-height="' + l.height + '">'
        }
        g += '<img class="msg_inline_img msg_inline_child ' + (a ? "hidden" : "") + '" ' + (a ? "data-real-src" : "src") + '="' + TS.utility.htmlEntities(l.proxied_src || l.src) + '" style="width:' + l.display_w + "px; height:" + l.display_h + 'px"></a></div>';
        return g
    },
    buildInlineAttachmentToggler: function(b, d) {
        var a = TS.model.inline_attachments[b];
        if (!a) {
            return ""
        }
        var c = TS.inline_attachments.shouldExpand(d, a);
        return ' <i data-real-src="' + TS.utility.htmlEntities(a.from_url) + '" class="msg_inline_attachment_collapser fa fa-caret-down ' + (c ? "" : "hidden") + '"></i><i data-real-src="' + TS.utility.htmlEntities(a.from_url) + '" class="msg_inline_attachment_expander fa fa-caret-right ' + (c ? "hidden" : "") + '"></i>'
    },
    makeMemberImage: function(g, e, d) {
        var f = TS.members.getMemberById(g);
        if (!f || !f.profile) {
            return ""
        }
        d = (d === true);
        var b, a;
        switch (e) {
            case 24:
                b = f.profile.image_24;
                a = "thumb_24";
                break;
            case 32:
                b = f.profile.image_32;
                a = "thumb_32";
                break;
            case 36:
                b = f.profile.image_48;
                a = "thumb_36";
                break;
            case 48:
                b = f.profile.image_48;
                a = "thumb_48";
                break;
            case 72:
                b = f.profile.image_72;
                a = "thumb_72";
                break;
            case 192:
                b = f.profile.image_192;
                a = "thumb_192";
                break;
            default:
                b = f.profile.image_48;
                a = "thumb_48";
                break
        }
        if (d) {
            var c = '<img data-original="' + b + '" class="lazy member_image ' + a + ' member_preview_image" data-member-id="' + f.id + '" />'
        } else {
            var c = '<img src="' + b + '" class="member_image ' + a + ' member_preview_image" data-member-id="' + f.id + '" />'
        }
        return c
    },
    buildInlineAudioToggler: function(b, d) {
        var a = TS.model.inline_audios[b];
        if (!a) {
            return ""
        }
        var c = TS.inline_audios.shouldExpand(d, a);
        return ' <i data-real-src="' + TS.utility.htmlEntities(a.src) + '" class="msg_inline_audio_collapser fa fa-caret-down ' + (c ? "" : "hidden") + '"></i><i data-real-src="' + TS.utility.htmlEntities(a.src) + '" class="msg_inline_audio_expander fa fa-caret-right ' + (c ? "hidden" : "") + '"></i>'
    },
    buildInlineAudioDiv: function(b, f, d, e) {
        var a = TS.model.inline_audios[b];
        if (!a) {
            return ""
        }
        var c = e === true || TS.inline_audios.shouldExpand(f, a);
        return '<div data-real-src="' + TS.utility.htmlEntities(a.src) + '" class="clear-both msg_inline_audio_holder msg_inline_holder ' + (c ? "" : "hidden") + '">' + d + "</div>"
    },
    buildInlineVideoTogglerAndDiv: function(b, c) {
        var a = TS.model.inline_videos[b];
        if (!a) {
            return ""
        }
        return TS.templates.builders.buildInlineVideoToggler(b, c) + " " + TS.templates.builders.buildInlineVideoDiv(b, c)
    },
    buildInlineVideoToggler: function(c, e, a) {
        var b = TS.model.inline_videos[c];
        if (!b) {
            return ""
        }
        var d = TS.inline_videos.shouldExpand(e, b);
        return " " + (a === true ? "" : b.title) + ' <i data-real-src="' + TS.utility.htmlEntities(b.src) + '" class="msg_inline_video_collapser fa fa-caret-down ' + (d ? "" : "hidden") + '"></i><i data-real-src="' + TS.utility.htmlEntities(b.src) + '" class="msg_inline_video_expander fa fa-caret-right ' + (d ? "hidden" : "") + '"></i>'
    },
    buildInlineVideoDiv: function(k, g, c) {
        var e = TS.model.inline_videos[k];
        if (!e) {
            return ""
        }
        var d = c === true || TS.inline_videos.shouldExpand(g, e);
        var f = e.link_url || k;
        var b = !!TS.client;
        var m = FlashDetect.installed;
        var h = m ? 281 : 137;
        var a = m ? 119 : 113;
        var l = parseInt((e.display_w - h) / 2) + "px";
        var j = parseInt((e.display_h - a) / 2) + "px";
        return '<div data-real-src="' + TS.utility.htmlEntities(e.src) + '" class="clear-both msg_inline_video_holder msg_inline_holder ' + (d ? "" : "hidden") + '" style="width:' + e.display_w + "px; height:" + (e.display_h + 2) + 'px; max-width: 100%;"><div class="msg_inline_video_iframe_div hidden" data-url="' + TS.utility.htmlEntities(k) + '"></div><div class="msg_inline_video_thumb_div"><div class="msg_inline_video_buttons_div" style="top:' + j + ";left:" + l + '">' + (m ? '<a class="msg_inline_video_play_button" style="margin-right: 90px;" title="Play video in Slack"><i class="fa fa-youtube-play" style="font-size: 3.4rem;"></i></a>' : "") + '<a class="msg_inline_video_new_window_button" ' + TS.utility.makeRefererSafeLink(f) + ' target="_blank" title="Open video in new tab"><i class="fa fa-external-link-square"></i></a></div><img class="msg_inline_video msg_inline_child ' + (b ? "hidden" : "") + '" ' + (b ? "data-real-src" : "src") + '="' + TS.utility.htmlEntities(e.proxied_src || e.src) + '" style="width:' + e.display_w + "px; height:" + e.display_h + 'px"></div></div>'
    },
    buildComments: function(d) {
        var g = {
            file: d
        };
        var f = d.comments;
        var c = "";
        var h = false;
        for (var b = 0; b < f.length; b++) {
            var a = f[b].user == TS.model.user.id;
            var e = a || TS.model.user.is_admin;
            if (a || e) {
                h = true
            }
            c += TS.templates.comment({
                comment: f[b],
                file: d,
                show_comment_actions: h
            })
        }
        return c
    },
    buildTeamListHTML: function(g) {
        var h;
        var c = [];
        var a = [];
        var f = [];
        var e = [];
        g.sort(function(k, j) {
            return (k._name_lc > j._name_lc) ? 1 : ((j._name_lc > k._name_lc) ? -1 : 0)
        });
        for (var d = 0; d < g.length; d++) {
            h = g[d];
            if (h.deleted) {
                a.push(h)
            } else {
                if (h.is_ultra_restricted) {
                    e.push(h)
                } else {
                    if (h.is_restricted) {
                        f.push(h)
                    } else {
                        c.push(h)
                    }
                }
            }
        }
        var b = false;
        if (f.length || e.length) {
            b = true
        }
        $("#team_tabs").html(TS.templates.team_tabs({
            members: c,
            show_restricted_members: b,
            restricted_members: f.concat(e),
            deleted_members: a
        }));
        $("#team_tabs").find('a[data-toggle="tab"]').on("shown", function(j) {
            if (TS.client) {
                TS.ui.updateClosestMonkeyScroller($("#team_list_members"))
            }
            if (TS.web && TS.web.members && TS.web.members.lazyload) {
                TS.web.members.lazyload.trigger("resize")
            }
        });
        return TS.templates.team_list({
            members: c,
            show_restricted_members: b,
            restricted_members: f,
            ultra_restricted_members: e,
            deleted_members: a
        })
    },
    makeChannelLink: function(a) {
        if (!a) {
            return "ERROR: MISSING CHANNEL"
        }
        var b = (TS.client) ? 'target="/archives/' + a.name + '"' : "";
        return '<a href="/archives/' + a.name + '" ' + b + ' class="channel_link" data-channel-id="' + a.id + '"><span class="normal">#</span>' + a.name + "</a>"
    },
    makeGroupLink: function(b) {
        if (!b) {
            return "ERROR: MISSING GROUP"
        }
        var a = (TS.client) ? 'target="/archives/' + b.name + '"' : "";
        return '<a href="/archives/' + b.name + '" ' + a + '" class="group_link" data-group-id="' + b.id + '">' + TS.model.group_prefix + b.name + "</a>"
    },
    makeMemberPreviewLink: function(e, b) {
        if (!e) {
            return ""
        }
        if (b !== true) {
            b = false
        }
        var a = "color_" + ((e) ? e.id : "unknown");
        var d = (TS.client) ? 'target="/team/' + e.name + '"' : "";
        var c = '<a href="/team/' + e.name + '" ' + d + ' class="bold member member_preview_link ' + a + '" data-member-id="' + e.id + '">';
        if (b && e.id == TS.model.user.id) {
            c += "You"
        } else {
            c += TS.members.getMemberDisplayName(e, true)
        }
        c += "</a>";
        return c
    },
    newWindowName: function(a) {
        if (TS.boot_data.app == "web") {
            return "_self"
        }
        return "new_" + TS.session_ms.toString()
    },
    getBotIdentifier: function(b) {
        if (!b.bot_id && !b.username) {
            return null
        }
        var d = (b.bot_id) ? TS.bots.getBotById(b.bot_id) : null;
        var a = (!b.username && d && d.name) ? d.name : b.username;
        var c = (d) ? d.id : "NOBOTID";
        return c + "_" + a
    },
    getBotName: function(a) {
        var c = a.username;
        if (!c) {
            var b = (a.bot_id) ? TS.bots.getBotById(a.bot_id) : null;
            if (b && b.name) {
                c = b.name
            }
        }
        if (TS.members.botNameMatchesMemberName(c)) {
            c += " (bot)"
        }
        return c
    },
    getBotNameWithLink: function(c) {
        var e = c.username;
        var d = (c.bot_id) ? TS.bots.getBotById(c.bot_id) : null;
        var b = "";
        var a = "";
        if (d && !d.deleted) {
            b = '<a target="/services/' + d.id + '" href="/services/' + d.id + '">';
            a = "</a>"
        }
        if (!e) {
            if (d && d.name) {
                e = d.name
            }
        }
        if (TS.members.botNameMatchesMemberName(e)) {
            e += " (bot)"
        }
        return b + TS.utility.htmlEntities(e) + a
    },
    makeExternalFiletypeHTML: function(a) {
        if (!a.is_external) {
            return
        }
        var b = "";
        switch (a.external_type) {
            case "gdrive":
                b = "Google Drive ";
                switch (a.filetype) {
                    case "gsheet":
                        b += "Spreadsheet";
                        break;
                    case "gdoc":
                        b += "Document";
                        break;
                    case "gpres":
                        b += "Presentation";
                        break;
                    case "gdraw":
                        b += "Drawing";
                        break;
                    default:
                        b += "<span>" + a.pretty_type + "</span> File"
                }
                break;
            case "dropbox":
                b = "Dropbox <span>" + a.pretty_type + "</span> File";
                break;
            case "box":
                b = "Box <span>" + a.pretty_type + "</span> File";
                break;
            default:
                b = "File"
        }
        return b
    },
    makeFileGroupChannelList: function(c) {
        var e = [];
        var b;
        var g = true;
        var d;
        for (var a = 0; a < c.channels.length; a++) {
            d = TS.channels.getChannelById(c.channels[a]);
            if (!d) {
                continue
            }
            b = '<span class="no_wrap">';
            b += TS.templates.builders.makeChannelLink(d, c);
            if (g) {
                b += '&nbsp;<a class="unshare_link" onclick="TS.files.promptForFileUnshare(\'' + c.id + "', '" + d.id + '\')" data-toggle="tooltip" title="Remove this from #' + d.name + '"><i class="fa fa-minus-circle"></i></a>'
            }
            b += "</span>";
            e.push(b)
        }
        var f;
        for (var a = 0; a < c.groups.length; a++) {
            f = TS.groups.getGroupById(c.groups[a]);
            if (!f) {
                continue
            }
            b = '<span class="no_wrap">';
            b += TS.templates.builders.makeGroupLink(f, c);
            if (g) {
                b += '&nbsp;<a class="unshare_link" onclick="TS.files.promptForFileUnshare(\'' + c.id + "', '" + f.id + '\')" data-toggle="tooltip" title="Remove this from the ' + f.name + ' group"><i class="fa fa-minus-circle"></i></a>'
            }
            b += "</span>";
            e.push(b)
        }
        if (!e.length) {
            return ""
        }
        return e.join(", ")
    },
    buildFileSharingControls: function(d, o, k) {
        var b;
        var a = TS.shared.getActiveModelOb();
        if (TS.model.active_channel_id == a.id) {
            b = "channel"
        } else {
            if (TS.model.active_im_id == a.id) {
                b = "im"
            } else {
                if (TS.model.active_group_id == a.id) {
                    b = "group"
                } else {
                    return ""
                }
            }
        }
        var j = [];
        var l;
        var p = TS.members.canUserPostInGeneral();
        for (var h = 0; h < TS.model.channels.length; h++) {
            l = TS.model.channels[h];
            if (l.is_member && (!l.is_general || p)) {
                j.push(l)
            }
        }
        var c = [];
        var n;
        for (var h = 0; h < TS.model.groups.length; h++) {
            n = TS.model.groups[h];
            if (!n.is_archived) {
                c.push(n)
            }
        }
        var f = [];
        var m;
        var g;
        var e = {};
        for (var h = 0; h < TS.model.members.length; h++) {
            m = TS.model.members[h];
            g = TS.members.getMemberById(m.id);
            if (!g || g.deleted || g.is_self) {
                continue
            }
            f.push(m);
            e[m.id] = TS.members.getMemberDisplayNameLowerCase(g)
        }
        j.sort(function(r, q) {
            return (r._name_lc > q._name_lc) ? 1 : ((q._name_lc > r._name_lc) ? -1 : 0)
        });
        c.sort(function(r, q) {
            return (r._name_lc > q._name_lc) ? 1 : ((q._name_lc > r._name_lc) ? -1 : 0)
        });
        f.sort(function(r, q) {
            return (e[r.id] > e[q.id]) ? 1 : ((e[q.id] > e[r.id]) ? -1 : 0)
        });
        if (b == "group" && !c.length) {
            b = "channel"
        }
        k = k || "";
        $("#file_sharing_div").remove();
        return TS.templates.file_sharing({
            share_context: b,
            channels: j,
            groups: c,
            members: f,
            model_ob: a,
            file: d,
            hide_checkbox: o,
            comment: k
        })
    },
    buildNonDefaultNotificationBlock: function(d) {
        d = d || "";
        var c = "";
        var b;
        var a = TS.utility.msgs.getChannelsAndGroupsNotUsingGlobalNotificationSetting();
        if (a.everything.length) {
            c += '<div class="' + d + '">Set to notify for <b>all activity</b>:';
            for (b = 0; b < a.everything.length; b++) {
                c += " " + (a.everything[b].id.charAt(0) === "C" ? "#" : "") + a.everything[b].name + (b != a.everything.length - 1 ? "," : "")
            }
            c += "</div>"
        }
        if (a.mentions.length) {
            c += '<div class="' + d + '">Set to notify only for <b>Highlight Words</b>:';
            for (b = 0; b < a.mentions.length; b++) {
                c += " " + (a.mentions[b].id.charAt(0) === "C" ? "#" : "") + a.mentions[b].name + (b != a.mentions.length - 1 ? "," : "")
            }
            c += "</div>"
        }
        if (a.nothing.length) {
            c += '<div class="' + d + '">Set to <b>never notify</b>:';
            for (b = 0; b < a.nothing.length; b++) {
                c += " " + (a.nothing[b].id.charAt(0) === "C" ? "#" : "") + a.nothing[b].name + (b != a.nothing.length - 1 ? "," : "")
            }
            c += "</div>"
        }
        return c
    }
});
TS.registerModule("templates.helpers", {
    onStart: function() {
        TS.templates.helpers.register()
    },
    register: function() {
        Handlebars.registerHelper("isClient", function(f) {
            if (TS.boot_data.app == "client") {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("isChrome", function(f) {
            if (TS.model.is_chrome) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("isFF", function(f) {
            if (TS.model.is_FF) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("isSafariDesktop", function(f) {
            if (TS.model.is_safari_desktop) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("isWeb", function(f) {
            if (TS.boot_data.app == "web" || TS.boot_data.app == "mobile") {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("isMobileWeb", function(f) {
            if (TS.boot_data.app == "mobile") {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("isMac", function(f) {
            if (TS.model.is_mac) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("isOurApp", function(f) {
            if (TS.model.is_our_app) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("supportsSpeech", function(f) {
            if (window.macgap && macgap.app && macgap.app.speakString) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("isTheme", function(f) {
            var g = f.hash.theme;
            if (g == TS.model.prefs.theme) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("showAvatars", function(f) {
            if (TS.model.prefs.avatars) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("feature", function(g) {
            var f = g.hash.flag;
            if (TS.qs_args[f] == 1 || TS.boot_data[f] == 1) {
                return g.fn(this)
            }
            return g.inverse(this)
        });
        Handlebars.registerHelper("comments", TS.templates.builders.buildComments);
        Handlebars.registerHelper("star", TS.templates.builders.buildStar);
        Handlebars.registerHelper("inlineImgTogglerAndDiv", TS.templates.builders.buildInlineImgTogglerAndDiv);
        Handlebars.registerHelper("inlineImgDiv", TS.templates.builders.buildInlineImgDiv);
        Handlebars.registerHelper("inlineImgToggler", TS.templates.builders.buildInlineImgToggler);
        Handlebars.registerHelper("inlineVideoDiv", TS.templates.builders.buildInlineVideoDiv);
        Handlebars.registerHelper("inlineAudioDiv", TS.templates.builders.buildInlineAudioDiv);
        Handlebars.registerHelper("formatActionLink", function(g, j, f) {
            if (!g) {
                return ""
            }
            var h = "<" + g.url + "|" + g.title + ">";
            html = TS.format.formatMsg(h, j, false, false, false, false, true, true, false, f === true);
            return html
        });
        Handlebars.registerHelper("formatSoundUrl", TS.templates.builders.formatSoundUrl);
        Handlebars.registerHelper("ellipsize", function(g, f) {
            TS.info("len" + f);
            return TS.utility.ellipsize(g, f)
        });
        Handlebars.registerHelper("stripWhitespace", function(f) {
            return f.replace(/\s+/g, "")
        });
        Handlebars.registerHelper("pluralize", function(h, g, f) {
            var h = parseInt(h);
            if (h === 1) {
                return g
            } else {
                return (typeof f === "string" ? f : g + "s")
            }
        });
        Handlebars.registerHelper("pluralCount", function(h, g, f) {
            return h + " " + Handlebars.helpers.pluralize.apply(this, arguments)
        });
        Handlebars.registerHelper("possessive", function(f) {
            if (f.substr(-1, f.length) == "s") {
                return "'"
            } else {
                return "'s"
            }
        });
        Handlebars.registerHelper("canUserAtEveryone", function(f) {
            return TS.members.canUserAtEveryone() ? f.fn(this) : f.inverse(this)
        });
        Handlebars.registerHelper("canUserAtChannelOrAtGroup", function(f) {
            return TS.members.canUserAtChannelOrAtGroup() ? f.fn(this) : f.inverse(this)
        });
        Handlebars.registerHelper("canUserCreateChannels", function(f) {
            return TS.members.canUserCreateChannels() ? f.fn(this) : f.inverse(this)
        });
        Handlebars.registerHelper("canUserArchiveChannels", function(f) {
            return TS.members.canUserArchiveChannels() ? f.fn(this) : f.inverse(this)
        });
        Handlebars.registerHelper("canUserCreateGroups", function(f) {
            return TS.members.canUserCreateGroups() ? f.fn(this) : f.inverse(this)
        });
        Handlebars.registerHelper("canUserPostInGeneral", function(f) {
            return TS.members.canUserPostInGeneral() ? f.fn(this) : f.inverse(this)
        });
        Handlebars.registerHelper("canUserKickFromChannels", function(f) {
            return TS.members.canUserKickFromChannels() ? f.fn(this) : f.inverse(this)
        });
        Handlebars.registerHelper("canUserKickFromGroups", function(f) {
            return TS.members.canUserKickFromGroups() ? f.fn(this) : f.inverse(this)
        });
        Handlebars.registerHelper("numberWithMax", function(g, f) {
            if (g >= f) {
                return (f - 1) + "+"
            } else {
                return g
            }
        });
        Handlebars.registerHelper("convertFilesize", function(f) {
            return TS.utility.convertFilesize(f)
        });
        Handlebars.registerHelper("toDate", function(f) {
            return TS.utility.date.toDate(f)
        });
        Handlebars.registerHelper("toCalendarDate", function(f) {
            return TS.utility.date.toCalendarDate(f)
        });
        Handlebars.registerHelper("toCalendarDateShort", function(f) {
            return TS.utility.date.toCalendarDate(f, true)
        });
        Handlebars.registerHelper("toCalendarDateOrNamedDay", function(f) {
            return TS.utility.date.toCalendarDateOrNamedDay(f)
        });
        Handlebars.registerHelper("toCalendarDateIfYesterdayOrTomorrow", function(f) {
            return TS.utility.date.toCalendarDateIfYesterdayOrTomorrow(f)
        });
        Handlebars.registerHelper("toCalendarDateOrNamedDayShort", function(f) {
            return TS.utility.date.toCalendarDateOrNamedDayShort(f)
        });
        Handlebars.registerHelper("toTime", function(g, f, h) {
            return TS.utility.date.toTime(g, f !== false, h === true)
        });
        Handlebars.registerHelper("msgTsTitle", function(g) {
            var f = (TS.utility.date.toCalendarDateOrNamedDayShort(g.ts) + " at " + TS.utility.date.toTime(g.ts, true, true)).replace(/\s/g, "&nbsp;");
            if (TS.client) {
                f += "&#013;Click to open in archives"
            }
            return f
        });
        Handlebars.registerHelper("toHour", function(f) {
            return TS.utility.date.toHour(f)
        });
        Handlebars.registerHelper("timezoneLabel", function(g, f) {
            return TS.utility.date.timezoneLabel(g, f)
        });
        Handlebars.registerHelper("if_equal", function(g, f) {
            if (g == f.hash.compare) {
                return f.fn(this)
            }
            return f.inverse(this)
        });
        Handlebars.registerHelper("if_not_equal", function(g, f) {
            if (g != f.hash.compare) {
                return f.fn(this)
            }
            return f.inverse(this)
        });
        Handlebars.registerHelper("if_gt", function(g, f) {
            if (g > f.hash.compare) {
                return f.fn(this)
            }
            return f.inverse(this)
        });
        Handlebars.registerHelper("foreach", function(f, g) {
            if (g.inverse && !f.length) {
                return g.inverse(this)
            }
            return f.map(function(j, h) {
                var k = {
                    index: h,
                    value: j,
                    length: f.length
                };
                k.first = h === 0;
                k.last = h === f.length - 1;
                return g.fn(k)
            }).join("")
        });
        Handlebars.registerHelper("makeDayDividerDomId", function(f) {
            return TS.templates.makeDayDividerDomId(f)
        });
        Handlebars.registerHelper("formatFileTitle", function(f) {
            if (!f || !f.title) {
                return ""
            }
            return TS.utility.emojiGraphicReplace(f.title)
        });
        Handlebars.registerHelper("formatMessageByType", TS.templates.builders.formatMessageByType);
        Handlebars.registerHelper("formatAttachments", TS.templates.builders.formatAttachments);
        Handlebars.registerHelper("formatMessage", function(g, f) {
            return TS.format.formatMsg(g, f)
        });
        Handlebars.registerHelper("formatMessageSimple", function(g, f) {
            return TS.format.formatMsg(g, f, false, false, false, false, true, true)
        });
        Handlebars.registerHelper("formatMessageAttachmentPart", function(k, j, f, h, g) {
            return TS.format.formatMsg(k, j, false, false, false, false, !(f === true), !(h === true), null, !(g === true))
        });
        Handlebars.registerHelper("formatTopicOrPurpose", function(f) {
            return TS.utility.formatTopicOrPurpose(f)
        });
        Handlebars.registerHelper("unFormatMessage", function(g, f) {
            return TS.format.unFormatMsg(g, f)
        });
        Handlebars.registerHelper("formatMessageResult", function(f) {
            f = TS.format.formatMsg(f);
            f = TS.utility.msgs.handleSearchHighlights(f);
            return f
        });
        Handlebars.registerHelper("formatSearchExtracts", TS.templates.builders.formatSearchExtracts);
        Handlebars.registerHelper("formatStarredMessageAndTruncate", function(j, g) {
            var h = j.text;
            if (j.subtype == "channel_topic") {
                if (j.text) {
                    h = "channel topic: " + j.text
                } else {
                    h = "channel topic cleared"
                }
            } else {
                if (j.subtype == "channel_purpose") {
                    if (j.text) {
                        h = "channel purpose: " + j.text
                    } else {
                        h = "channel purpose cleared"
                    }
                } else {
                    if (j.subtype == "channel_join") {
                        h = "joined channel"
                    } else {
                        if (j.subtype == "channel_leave") {
                            h = "left channel"
                        } else {
                            if (j.subtype == "group_topic") {
                                if (j.text) {
                                    h = "group topic: " + j.text
                                } else {
                                    h = "group topic cleared"
                                }
                            } else {
                                if (j.subtype == "group_purpose") {
                                    if (j.text) {
                                        h = "group purpose: " + j.text
                                    } else {
                                        h = "group purpose cleared"
                                    }
                                } else {
                                    if (j.subtype == "group_join") {
                                        h = "joined group"
                                    } else {
                                        if (j.subtype == "group_leave") {
                                            h = "left group"
                                        } else {
                                            if (j.subtype == "group_archive") {
                                                h = "archived group"
                                            } else {
                                                if (j.subtype == "group_unarchive") {
                                                    h = "un-archived group"
                                                } else {
                                                    if (j.subtype == "channel_archive") {
                                                        h = "archived channel"
                                                    } else {
                                                        if (j.subtype == "channel_unarchive") {
                                                            h = "un-archived channel"
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
            var k = truncate(TS.format.formatMsg(h, j), g);
            files;
            if (j.permalink) {
                var f = ' <a target="' + TS.templates.builders.newWindowName() + '" href="' + j.permalink + '" class="normal tiny">read more</a>';
                return k + f
            } else {
                return k
            }
        });
        Handlebars.registerHelper("msgActions", function(f) {
            return '<a class="msg_actions" data-msg-ts="' + f.ts + '"><input type="checkbox" class="msg_select_cb" /><i class="msg_cog fa fa-cog"></i></a>'
        });
        Handlebars.registerHelper("fileActionsCog", function(f) {
            return '<a class="file_actions file_actions_cog fa fa-cog" data-file-id="' + f.id + '"></a>'
        });
        Handlebars.registerHelper("fileActionsLink", function(f) {
            return '<a class="file_actions file_actions_link" data-file-id="' + f.id + '">Actions <i class="fa fa-caret-down"></i></a>'
        });
        Handlebars.registerHelper("makeRefererSafeLink", function(f) {
            return TS.utility.makeRefererSafeLink(f.hash.url)
        });
        Handlebars.registerHelper("makeSafeForDomId", TS.utility.makeSafeForDomId);
        Handlebars.registerHelper("makeMsgAttachmentTextExpanderDomId", TS.templates.makeMsgAttachmentTextExpanderDomId);
        Handlebars.registerHelper("makeMsgDomId", TS.templates.makeMsgDomId);
        Handlebars.registerHelper("makeMSRDomId", TS.templates.makeMSRDomId);
        Handlebars.registerHelper("makeMsgDomClass", function(g) {
            var f = "";
            if (!g.subtype) {} else {
                if (g.subtype == "channel_join" || g.subtype == "group_join") {
                    f += "joined"
                } else {
                    if (g.subtype == "channel_leave" || g.subtype == "group_leave") {
                        f += "left"
                    } else {
                        if (g.subtype == "channel_topic" || g.subtype == "group_topic") {
                            f += "topic"
                        } else {
                            if (g.subtype == "channel_name" || g.subtype == "group_name") {
                                f += "rename"
                            } else {
                                if (g.subtype == "channel_purpose" || g.subtype == "group_purpose") {
                                    f += "purpose"
                                } else {
                                    if (g.subtype == "channel_archive" || g.subtype == "group_archive") {
                                        f += "archived"
                                    } else {
                                        if (g.subtype == "channel_unarchive" || g.subtype == "group_unarchive") {
                                            f += "unarchived"
                                        } else {
                                            if (g.subtype == "bot_message") {
                                                f += "bot_message"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return f
        });
        Handlebars.registerHelper("buildMsgHTMLForSearch", TS.templates.builders.buildMsgHTMLForSearch);
        Handlebars.registerHelper("ifExtracts", function(h, f) {
            var g = TS.search.view.msgHasExtracts(h) || h.previous && TS.search.view.msgHasExtracts(h.previous) || h.previous_2 && TS.search.view.msgHasExtracts(h.previous_2) || h.next && TS.search.view.msgHasExtracts(h.next) || h.next_2 && TS.search.view.msgHasExtracts(h.next_2);
            if (g) {
                return f.fn(this)
            }
            return f.inverse(this)
        });
        Handlebars.registerHelper("concatMsgExtracts", function(g) {
            if (g.extracts.length === 0) {
                return ""
            }
            var h = [];
            g.extracts.forEach(function(j) {
                var k = TS.format.formatMsg(j.text, g, true);
                k = TS.utility.msgs.handleSearchHighlights(k);
                h.push(k)
            });
            var f = h.join(" &hellip; ");
            if (g.extracts[0].truncated_head) {
                f = "&hellip; " + f
            }
            if (g.extracts[g.extracts.length - 1].truncated_tail) {
                f += " &hellip;"
            }
            return f
        });

        function e(g, f) {
            var h = TS.format.formatMsg(g.text, f);
            h = TS.utility.msgs.handleSearchHighlights(h);
            if (g.truncated_head) {
                h = "&hellip; " + h
            }
            if (g.truncated_tail) {
                h = h + " &hellip;"
            }
            return h
        }
        Handlebars.registerHelper("concatAttachmentExtracts", function(k, g) {
            var j = [];
            var f = k.extracts;
            ["title", "text"].forEach(function(m) {
                if (f[m]) {
                    f[m].forEach(function(n) {
                        j.push(e(n, g))
                    })
                }
            });
            var h = j.join("&nbsp;");
            h = h.replace(" &hellip;&nbsp;&hellip; ", " &hellip; ");
            if (!h && k.fallback) {
                var l = TS.format.formatMsg(k.fallback, g);
                l = TS.utility.msgs.handleSearchHighlights(l);
                return l
            }
            return h
        });
        Handlebars.registerHelper("newWindowName", TS.templates.builders.newWindowName);
        Handlebars.registerHelper("nl2br", function(f) {
            if (!f) {
                return f
            }
            f = TS.utility.htmlEntities(f);
            return f.replace(/\n/g, "<br />").replace(/&amp;#95;/g, "_")
        });
        Handlebars.registerHelper("truncate", function(h, f) {
            var g = truncate(h, f);
            return g.replace(/&#64;/g, "@")
        });
        Handlebars.registerHelper("generalName", function() {
            var f = TS.channels.getGeneralChannel();
            return (f) ? f.name : ""
        });
        Handlebars.registerHelper("makeChannelDomId", function(f) {
            return TS.templates.makeChannelDomId(f)
        });
        Handlebars.registerHelper("ChannelNameMaxLength", function(f) {
            return TS.model.channel_name_max_length
        });
        Handlebars.registerHelper("ChannelPurposeMaxLength", function() {
            return TS.model.channel_purpose_max_length
        });
        Handlebars.registerHelper("ChannelTopicMaxLength", function() {
            return TS.model.channel_topic_max_length
        });
        Handlebars.registerHelper("makeUnreadJustDomId", function(f) {
            return TS.templates.makeUnreadJustDomId(f)
        });
        Handlebars.registerHelper("getChannelOrGroupNameWithPrefixById", function(h) {
            var f = TS.channels.getChannelById(h);
            if (f) {
                return "#" + f.name
            }
            var g = TS.groups.getGroupById(h);
            if (g) {
                return TS.model.group_prefix + g.name
            }
            return h
        });
        Handlebars.registerHelper("makeChannelLink", TS.templates.builders.makeChannelLink);
        Handlebars.registerHelper("makeChannelLinkById", function(g) {
            var f = TS.channels.getChannelById(g);
            if (f) {
                return TS.templates.builders.makeChannelLink(f)
            }
        });
        Handlebars.registerHelper("makeUnreadHighlightDomId", function(f) {
            return TS.templates.makeUnreadHighlightDomId(f)
        });
        Handlebars.registerHelper("makeChannelDomClass", function(g) {
            var f = "";
            if (TS.model.active_channel_id == g.id) {
                f += "active "
            }
            if (g.unread_cnt > 0) {
                f += "unread "
            }
            if (g.unread_highlight_cnt > 0) {
                f += "mention "
            }
            if (TS.utility.msgs.isChannelOrGroupMuted(g.id)) {
                f += "muted_channel "
            }
            return f
        });
        Handlebars.registerHelper("makeGroupDomId", function(f) {
            return TS.templates.makeGroupDomId(f)
        });
        Handlebars.registerHelper("groupPrefix", function(f) {
            return TS.model.group_prefix
        });
        Handlebars.registerHelper("makeGroupLink", TS.templates.builders.makeGroupLink);
        Handlebars.registerHelper("makeGroupLinkById", function(g) {
            var f = TS.groups.getGroupById(g);
            if (f) {
                return TS.templates.builders.makeGroupLink(f)
            }
        });
        Handlebars.registerHelper("makeGroupDomClass", function(g) {
            var f = "";
            if (TS.model.active_group_id == g.id) {
                f += "active "
            }
            if (g.unread_cnt > 0) {
                f += "unread "
            }
            if (g.unread_highlight_cnt > 0) {
                f += "mention "
            }
            if (g.is_starred) {
                f += "starred "
            }
            if (TS.utility.msgs.isChannelOrGroupMuted(g.id)) {
                f += "muted_channel "
            }
            return f
        });
        Handlebars.registerHelper("currentUserId", function() {
            return TS.model.user.id
        });
        Handlebars.registerHelper("makeMemberDomId", function(f) {
            return TS.templates.makeMemberDomId(f)
        });
        Handlebars.registerHelper("makeChannelListDomId", function(f) {
            return TS.templates.makeChannelListDomId(f)
        });
        Handlebars.registerHelper("makeMemberPresenceDomClass", function(f) {
            return TS.templates.makeMemberPresenceDomClass(f.id)
        });
        Handlebars.registerHelper("makeMemberPresenceIcon", function(f) {
            return TS.templates.makeMemberPresenceIcon(f)
        });
        Handlebars.registerHelper("makeMemberStatusDomClass", function(f) {
            return TS.templates.makeMemberStatusDomClass(f.id)
        });
        Handlebars.registerHelper("makeMemberDomClass", function(j) {
            var g = "";
            if (!j) {
                return g
            }
            if (!j.is_self && j.presence == "away") {
                g += "away "
            }
            if (TS.model.active_im_id) {
                var h = TS.ims.getImById(TS.model.active_im_id);
                if (h.user == j.id) {
                    g += "active "
                }
            }
            var f = TS.ims.getImByMemberId(j.id);
            if (f) {
                if (f.unread_cnt > 0 || f.unread_highlight_cnt > 0) {
                    g += "unread mention "
                }
            }
            return g
        });
        Handlebars.registerHelper("makeMemberListDomClass", function(g) {
            var f = "member ";
            if (g.presence == "away") {
                f += "away "
            }
            return f
        });
        Handlebars.registerHelper("makeMemberPreviewLink", TS.templates.builders.makeMemberPreviewLink);
        Handlebars.registerHelper("makeMemberPreviewLinkById", function(h, f) {
            if (f !== true) {
                f = false
            }
            var g = TS.members.getMemberById(h);
            if (!g) {
                return h
            }
            return TS.templates.builders.makeMemberPreviewLink(g, f)
        });
        Handlebars.registerHelper("makeMemberPreviewLinkImage", function(f, o, g) {
            var h = TS.members.getMemberById(f);
            if (!h || !h.profile) {
                return ""
            }
            g = (g === true);
            var l, n;
            var m = "background-image: ";
            switch (o) {
                case 24:
                    if (TS.utility.is_retina) {
                        l = h.profile.image_48
                    } else {
                        l = h.profile.image_24
                    }
                    n = "thumb_24";
                    break;
                case 32:
                    if (TS.utility.is_retina) {
                        l = h.profile.image_72
                    } else {
                        l = h.profile.image_32
                    }
                    n = "thumb_32";
                    break;
                case 36:
                    if (TS.utility.is_retina) {
                        l = h.profile.image_72
                    } else {
                        l = h.profile.image_48
                    }
                    n = "thumb_36";
                    break;
                case 48:
                    if (TS.utility.is_retina) {
                        l = h.profile.image_72
                    } else {
                        l = h.profile.image_48
                    }
                    n = "thumb_48";
                    break;
                case 72:
                    if (TS.utility.is_retina) {
                        l = h.profile.image_192
                    } else {
                        l = h.profile.image_72
                    }
                    n = "thumb_72";
                    break;
                case 192:
                    l = h.profile.image_192;
                    n = "thumb_192";
                    break;
                default:
                    if (TS.utility.is_retina) {
                        l = h.profile.image_72
                    } else {
                        l = h.profile.image_48
                    }
                    n = "thumb_48";
                    break
            }
            if (h.is_restricted) {
                g = false;
                if (TS.utility.is_retina) {
                    m += "url('/img/avatar_overlays_@2x.png'), "
                } else {
                    m += "url('/img/avatar_overlays.png'), "
                }
            }
            if (h.is_ultra_restricted) {
                n += " ura"
            } else {
                if (h.is_restricted) {
                    n += " ra"
                }
            }
            var j;
            var k = (TS.client) ? 'target="/team/' + h.name + '"' : "";
            if (g) {
                j = '<a href="/team/' + h.name + '" ' + k + ' class="lazy member_preview_link member_image ' + n + '" data-member-id="' + h.id + '" style="' + m + ';background-color: #f6f6f6" data-original="' + l + '" ></a>'
            } else {
                m += "url('" + l + "');";
                j = '<a href="/team/' + h.name + '" ' + k + ' class="member_preview_link member_image ' + n + '" data-member-id="' + h.id + '" style="' + m + '"></a>'
            }
            return j
        });
        Handlebars.registerHelper("emojiGraphicReplace", function(f) {
            return TS.utility.emojiGraphicReplace(f)
        });
        Handlebars.registerHelper("makeMemberImage", TS.templates.builders.makeMemberImage);
        Handlebars.registerHelper("makeUsernameImage", function(j, s) {
            var h = j.username;
            var n, g, m, f;
            var k;
            var p = (j.bot_id) ? TS.bots.getBotById(j.bot_id) : null;
            if (j.icons) {
                k = j.icons
            } else {
                if (p && p.icons) {
                    k = p.icons
                } else {}
            } if (k) {
                if (k.image_36 && !TS.utility.is_retina) {
                    n = k.image_36
                } else {
                    if (k.image_72 && TS.utility.is_retina) {
                        n = k.image_72
                    } else {
                        if (k.image_48) {
                            n = k.image_48
                        } else {
                            if (k.emoji && k.emoji.substr(0, 1) == ":" && k.emoji.substr(k.emoji.length - 1, 1) == ":") {
                                m = k.emoji
                            }
                        }
                    }
                }
            }
            var q = "";
            var r = "";
            if (p && !p.deleted) {
                q = '<a target="/services/' + p.id + '" href="/services/' + p.id + '">';
                r = "</a>"
            }
            var o = (j && j.is_ephemeral && j.username == "slackbot") ? TS.members.getMemberById("USLACKBOT") : null;
            switch (s) {
                case 24:
                    g = "thumb_24";
                    f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-24.png?ssl=1";
                    if (o) {
                        f = o.profile.image_24
                    }
                    break;
                case 32:
                    g = "thumb_32";
                    f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-32.png?ssl=1";
                    if (o) {
                        f = o.profile.image_32
                    }
                    break;
                case 36:
                    g = "thumb_36";
                    f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-48.png?ssl=1";
                    if (o) {
                        f = o.profile.image_48
                    }
                    break;
                case 72:
                    g = "thumb_72";
                    f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-72.png?ssl=1";
                    if (o) {
                        f = o.profile.image_72
                    }
                    break;
                case 192:
                    g = "thumb_192";
                    f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-192.png?ssl=1";
                    if (o) {
                        f = o.profile.image_192
                    }
                    break;
                default:
                    g = "thumb_48";
                    f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-48.png?ssl=1";
                    if (o) {
                        f = o.profile.image_48
                    }
                    break
            }
            var l;
            if (n) {
                l = q + '<img style="border: 0" src="' + n + '" class="member_image ' + g + '" />' + r
            } else {
                if (m) {
                    l = q + '<div style="border: 0" class="member_image ' + g + '">' + TS.utility.emojiGraphicReplace(TS.utility.htmlEntities(m), true, false, true) + "</div>" + r
                } else {
                    if (o) {
                        l = q + '<img src="' + f + '" class="member_image ' + g + '" />' + r
                    } else {
                        l = q + '<img src="' + f + '" class="member_image bot_icon_default ' + g + '" />' + r
                    }
                }
            }
            return l
        });
        Handlebars.registerHelper("getMemberNameById", function(g) {
            var f = TS.members.getMemberById(g);
            return f ? f.name : g
        });
        Handlebars.registerHelper("getMemberDisplayNameById", function(g) {
            var f = TS.members.getMemberById(g);
            return f ? TS.members.getMemberDisplayName(f) : g
        });
        Handlebars.registerHelper("getMemberDisplayName", function(f) {
            return TS.members.getMemberDisplayName(f)
        });
        Handlebars.registerHelper("getDisplayNameOfUserForIm", function(f) {
            if (!f) {
                return "MISSING_IM"
            }
            return TS.ims.getDisplayNameOfUserForIm(f)
        });
        Handlebars.registerHelper("getIMNameById", function(g) {
            var f = TS.ims.getImById(g);
            return f ? f.name : g
        });
        Handlebars.registerHelper("getIMIdByMemberId", function(g) {
            var f = TS.ims.getImByMemberId(g);
            return f ? f.id : ""
        });
        Handlebars.registerHelper("memberHasIm", function(f) {
            var h = f.hash.member;
            var g = false;
            if (h) {
                if (TS.ims.getImByMemberId(h.id)) {
                    g = true
                }
            }
            if (g) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });

        function b(f) {
            var j = TS.members.getMemberById(f.user);
            var h = "color_" + ((j) ? j.id : "unknown");
            var g = (TS.client) ? 'target="/messages/@' + f.name + '"' : "";
            return '<a href="/messages/@' + f.name + '" ' + g + '" class="internal_im_link ' + h + '" data-member-name="' + f.name + '">@' + f.name + "</a>"
        }
        Handlebars.registerHelper("makeIMLink", b);
        Handlebars.registerHelper("makeIMLinkById", function(g) {
            var f = TS.ims.getImById(g);
            if (f) {
                return b(f)
            }
        });

        function a(k) {
            var m = TS.utility.htmlEntities(k.username);
            var j;
            var l = (k.bot_id) ? TS.bots.getBotById(k.bot_id) : null;
            if (k.icons) {
                j = k.icons
            } else {
                if (l && l.icons) {
                    j = l.icons
                } else {}
            } if (!m && l && l.name) {
                m = TS.utility.htmlEntities(l.name)
            }
            if (TS.members.botNameMatchesMemberName(m)) {
                m += " (bot)"
            }
            var g = "";
            var f = "";
            if (l && !l.deleted) {
                g = '<a target="/services/' + l.id + '" href="/services/' + l.id + '">';
                f = "</a>"
            }
            if (!j) {
                return g + m + f
            }
            var h;
            if (j.emoji && j.emoji.substr(0, 1) == ":" && j.emoji.substr(j.emoji.length - 1, 1) == ":") {
                h = g + TS.utility.emojiGraphicReplace(TS.utility.htmlEntities(j.emoji), true, false, true) + f + " " + g + m + f
            } else {
                if (j.image_36 && !TS.utility.is_retina) {
                    h = g + '<img src="' + j.image_36 + '" class="inline_bot_icon">' + f + " " + g + m + f
                } else {
                    if (j.image_72 && TS.utility.is_retina) {
                        h = g + '<img src="' + j.image_72 + '" class="inline_bot_icon">' + f + " " + g + m + f
                    } else {
                        if (j.image_48) {
                            h = g + '<img src="' + j.image_48 + '" class="inline_bot_icon">' + f + " " + g + m + f
                        } else {
                            h = g + m + f
                        }
                    }
                }
            }
            return h
        }
        Handlebars.registerHelper("getBotNameAndIcon", a);
        Handlebars.registerHelper("getBotName", TS.templates.builders.getBotName);
        Handlebars.registerHelper("getBotNameWithLink", TS.templates.builders.getBotNameWithLink);

        function c(f) {
            if (!f) {
                return "color_unknown"
            }
            return "color_bot_" + TS.utility.makeSafeForDomClass(f)
        }
        Handlebars.registerHelper("getBotColorClassByUserName", c);

        function d(g) {
            var f = TS.members.getMemberById(g);
            if (!f) {
                return "color_unknown"
            }
            return "color_" + f.id
        }
        Handlebars.registerHelper("getMemberColorClassById", d);
        Handlebars.registerHelper("getMemberColorClassByImId", function(g) {
            var f = TS.ims.getImById(g);
            if (!f) {
                return "color_unknown"
            }
            return d(f.user)
        });
        Handlebars.registerHelper("msgIsFromSelf", function(f) {
            var g = f.hash.msg;
            var j = g.user;
            if (!j && g.subtype == "file_comment" && g.comment) {
                j = g.comment.user
            }
            var h = TS.members.getMemberById(j);
            if (!h) {
                return f.inverse(this)
            }
            if (h.is_self) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("memberIsSelf", function(f) {
            var g = TS.members.getMemberById(f.hash.id);
            if (!g) {
                return f.inverse(this)
            }
            if (g.is_self) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("memberIsAdmin", function(f) {
            var g = TS.members.getMemberById(f.hash.id);
            if (!g) {
                return f.inverse(this)
            }
            if (g.is_admin) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("currentUserIsAdmin", function(f) {
            if (TS.model.user.is_admin) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("tinyspeck", function(f) {
            if (TS.model.team.domain == "tinyspeck") {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("makeFileDomId", function(f) {
            return TS.templates.makeFileDomId(f)
        });
        Handlebars.registerHelper("makeFileCommentsDomId", function(f) {
            return TS.templates.makeFileCommentsDomId(f)
        });
        Handlebars.registerHelper("makeFileContentsDomId", function(f) {
            return TS.templates.makeFileContentsDomId(f)
        });
        Handlebars.registerHelper("makeFileHeader", function(f, g) {
            return TS.templates.file_header({
                file: f,
                member: g
            })
        });
        Handlebars.registerHelper("makeFilePreviewHeader", function(f, g) {
            return TS.templates.file_header({
                file: f,
                member: g,
                preview: true
            })
        });
        Handlebars.registerHelper("fileIsImage", function(f) {
            var g = TS.files.getFileById(f.hash.id);
            if (!g) {
                return f.inverse(this)
            }
            if (g.mimetype && g.mimetype.indexOf("image/") == 0) {
                return f.fn(this)
            } else {
                return f.inverse(this)
            }
        });
        Handlebars.registerHelper("makeFilePrivacyLabel", function(g) {
            var f = "";
            if (g.is_public) {
                f = "Published"
            } else {
                if ((g.groups.length > 0) || (g.ims.length > 0)) {
                    f = "Private"
                } else {
                    f = "Draft"
                }
            }
            return f
        });
        Handlebars.registerHelper("makeExternalFiletypeHTML", function(f) {
            return TS.templates.builders.makeExternalFiletypeHTML(f)
        });
        Handlebars.registerHelper("makeFileGroupChannelList", function(f) {
            return TS.templates.builders.makeFileGroupChannelList(f)
        });
        Handlebars.registerHelper("nl2brAndHighlightSearchMatches", function(f) {
            if (!f) {
                return
            }
            f = TS.utility.htmlEntities(f);
            f = f.replace(/\n/g, "<br />");
            return TS.utility.msgs.handleSearchHighlights(f)
        });
        Handlebars.registerHelper("highlightSearchMatches", function(f) {
            if (!f) {
                return
            }
            f = TS.utility.htmlEntities(f);
            return TS.utility.msgs.handleSearchHighlights(f)
        });
        Handlebars.registerHelper("highlightSearchMatchesInFileTitle", function(f) {
            if (!f) {
                return
            }
            f = TS.utility.emojiGraphicReplace(f);
            return TS.utility.msgs.handleSearchHighlights(f)
        });
        Handlebars.registerHelper("searchFilter", function() {
            if (!TS.search.filter) {
                return
            }
            return TS.search.filter
        });
        Handlebars.registerHelper("searchSort", function() {
            if (!TS.search.sort) {
                return
            }
            return TS.search.sort
        });
        Handlebars.registerHelper("makeUnreadMessagesDomId", function(f) {
            return TS.templates.makeUnreadMessagesDomId(f)
        });
        Handlebars.registerHelper("makeUnreadGroupMessagesDomId", function(f) {
            return TS.templates.makeUnreadGroupMessagesDomId(f)
        });
        Handlebars.registerHelper("makeUnreadDmsDomId", function(f) {
            return TS.templates.makeUnreadDmsDomId(f)
        });
        Handlebars.registerHelper("makeSentMessagesDomId", function(f) {
            return TS.templates.makeSentMessagesDomId(f)
        });
        Handlebars.registerHelper("makeSentGroupMessagesDomId", function(f) {
            return TS.templates.makeSentGroupMessagesDomId(f)
        });
        Handlebars.registerHelper("makeSentDmsDomId", function(f) {
            return TS.templates.makeSentDmsDomId(f)
        });
        Handlebars.registerHelper("makeActivityMessagesDomId", function(f) {
            return TS.templates.makeActivityMessagesDomId(f)
        });
        Handlebars.registerHelper("makeActivityDayDomId", function(f) {
            return TS.templates.makeActivityDayDomId(f)
        });
        Handlebars.registerHelper("makeIssueListDomId", function(f) {
            return TS.templates.makeIssueListDomId(f)
        });
        Handlebars.registerHelper("math", function(f, g, j, h) {
            if (arguments.length < 4) {
                h = j;
                j = g;
                g = "+"
            }
            f = parseFloat(f);
            j = parseFloat(j);
            return {
                "+": f + j,
                "-": f - j,
                "*": f * j,
                "/": f / j,
                "%": f % j
            }[g]
        });
        Handlebars.registerHelper("loadingHTML", function() {
            var f = "https://slack.global.ssl.fastly.net/20655/img/loading_hash_animation.gif";
            return '<div class="loading_hash_animation"><img src="' + f + '" alt="Loading" /><br />loading...</div>'
        })
    }
});
TS.registerModule("utility.date", {
    month_names: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    short_month_names: ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
    day_names: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    short_day_names: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    onStart: function() {},
    toDateObject: function(d) {
        var b;
        if (d && typeof d == "string" && d.indexOf("-") > -1) {
            var a = d.split("-");
            if (a.length >= 3) {
                b = new Date(a[0], a[1] - 1, a[2])
            } else {
                b = new Date(0)
            }
        } else {
            var c = (d || "0").toString();
            if (c.indexOf(".") != -1) {
                b = new Date(c.split(".")[0] * 1000)
            } else {
                b = new Date(d * 1000)
            }
        }
        return b
    },
    toTime: function(e, g, k) {
        var a = TS.utility.date.toDateObject(e);
        var h = a.getHours();
        var c = a.getMinutes();
        var d = a.getSeconds();
        var b = false;
        if (TS.utility.date.do24hrTime()) {
            if (h < 10) {
                h = "0" + h
            }
        } else {
            if (h >= 12) {
                if (h > 12) {
                    h = h - 12
                }
                b = true
            } else {
                if (h == 0) {
                    h = 12
                }
            }
        } if (c < 10) {
            c = "0" + c
        }
        var f = "";
        if (k) {
            if (d < 10) {
                f = ":0" + d
            } else {
                f = ":" + d
            }
        }
        var j = h + ":" + c + f;
        if (g && !TS.utility.date.do24hrTime()) {
            if (b) {
                j += " PM"
            } else {
                j += " AM"
            }
        }
        return j
    },
    toDate: function(e) {
        var a = TS.utility.date.toDateObject(e);
        var f = a.getFullYear();
        var d = a.getMonth();
        var g = a.getDate();
        var h = a.getHours();
        var c = a.getMinutes();
        var b = false;
        if (TS.utility.date.do24hrTime()) {
            if (h < 10) {
                h = "0" + h
            }
        } else {
            if (h >= 12) {
                if (h > 12) {
                    h = h - 12
                }
                b = true
            } else {
                if (h == 0) {
                    h = 12
                }
            }
        } if (g < 10) {
            g = "0" + g
        }
        if (c < 10) {
            c = "0" + c
        }
        d = ("0" + (d + 1)).slice(-2);
        var j = f + "-" + d + "-" + g + ", " + h + ":" + c;
        if (!TS.utility.date.do24hrTime()) {
            if (b) {
                j += " PM"
            } else {
                j += " AM"
            }
        }
        return j
    },
    toCalendarDateOrNamedDayShort: function(d) {
        var e = false;
        var c = TS.utility.date.toDateObject(d);
        var b = new Date();
        var a = 31 * 24 * 60 * 60 * 1000;
        if (c.getFullYear() == b.getFullYear() || b - c <= a) {
            e = true
        }
        return TS.utility.date.toCalendarDateOrNamedDay(d, true, e)
    },
    do24hrTime: function() {
        if (TS.model.user && TS.model.prefs && TS.model.prefs.time24) {
            return true
        }
        return false
    },
    toFilenameFriendlyDate: function(e) {
        var a = TS.utility.date.toDateObject(e);
        var f = a.getFullYear();
        var d = a.getMonth();
        var g = a.getDate();
        var h = a.getHours();
        var c = a.getMinutes();
        var b = false;
        if (!TS.utility.date.do24hrTime()) {
            if (h >= 12) {
                if (h > 12) {
                    h = h - 12
                }
                b = true
            } else {
                if (h == 0) {
                    h = 12
                }
            }
        }
        if (g < 10) {
            g = "0" + g
        }
        if (h < 10) {
            h = "0" + h
        }
        if (c < 10) {
            c = "0" + c
        }
        d = ("0" + (d + 1)).slice(-2);
        var j = f + "_" + d + "_" + g + " " + h + "_" + c;
        if (!TS.utility.date.do24hrTime()) {
            if (b) {
                j += " PM"
            } else {
                j += " AM"
            }
        }
        return j
    },
    toCalendarDate: function(f, d, a) {
        var c = TS.utility.date.toDateObject(f);
        var g = c.getFullYear();
        var e = c.getMonth();
        var h = c.getDate();
        var b = c.getDay();
        if (d) {
            var j = TS.utility.date.short_month_names[e] + " " + TS.utility.ordinalNumber(h)
        } else {
            var j = TS.utility.date.month_names[e] + " " + TS.utility.ordinalNumber(h)
        } if (!a) {
            j += ", " + g
        }
        return j
    },
    toCalendarDateOrNamedDay: function(e, c, g) {
        var b = TS.utility.date.toDateObject(e);
        var a = new Date();
        var d = new Date();
        d.setDate(a.getDate() - 1);
        var h;
        if (TS.utility.date.sameDay(b, a)) {
            h = "Today"
        } else {
            if (TS.utility.date.sameDay(b, d)) {
                h = "Yesterday"
            } else {
                var f = (c) ? TS.utility.date.short_day_names : TS.utility.date.day_names;
                h = f[b.getDay()] + ", " + TS.utility.date.toCalendarDate(e, c, g)
            }
        }
        return h
    },
    toCalendarDateIfYesterdayOrTomorrow: function(e, c) {
        var b = TS.utility.date.toDateObject(e);
        var a = new Date();
        var d = new Date();
        d.setDate(a.getDate() - 1);
        var f = "";
        if (TS.utility.date.sameDay(b, a)) {
            f = TS.utility.date.toCalendarDate(e, c)
        } else {
            if (TS.utility.date.sameDay(b, d)) {
                f = TS.utility.date.toCalendarDate(e, c)
            }
        }
        return f
    },
    toHour: function(d) {
        var b = TS.utility.date.toDateObject(d);
        var a = b.getHours();
        var c = false;
        if (TS.utility.date.do24hrTime()) {
            if (a < 10) {
                a = "0" + a
            }
        } else {
            if (a >= 12) {
                if (a > 12) {
                    a = a - 12
                }
                c = true
            } else {
                if (a == 0) {
                    a = 12
                }
            }
        }
        var e = a;
        if (!TS.utility.date.do24hrTime()) {
            if (c) {
                e += " PM"
            } else {
                e += " AM"
            }
        }
        return e
    },
    timezoneLabel: function(f, h) {
        var a = "Pacific Standard Time";
        var b = -28800;
        if (typeof f.tz_label != "undefined") {
            a = f.tz_label
        }
        if (typeof f.tz_offset != "undefined") {
            b = f.tz_offset
        }
        var g = "<span title='" + a + "'><i class='fa fa-clock-o'></i> ";
        if (f.id == TS.model.user.id) {
            g += a + " (<a href='/account/settings' target='new'>change</a>)"
        } else {
            var d = b / 60 / 60;
            var k = (TS.model.user.tz_offset - b) / 60 / 60;
            if (h) {
                var e = new Date();
                var c = e.getTime();
                var j = c - (k * 60 * 60 * 1000);
                g += '<span class="timezone_value">' + TS.utility.date.toTime(j / 1000, true) + "</span>";
                g += " local time / "
            }
            if (k == 0) {
                g += "in your timezone"
            } else {
                g += Math.abs(k) + " hour";
                if (Math.abs(k) != 1) {
                    g += "s"
                }
            } if (k > 0) {
                g += " behind you"
            } else {
                if (k < 0) {
                    g += " ahead of you"
                }
            } if (d == 0) {
                g += " (GMT)"
            } else {
                if (d < 0) {
                    g += " (GMT" + d + ")"
                } else {
                    if (d > 0) {
                        g += " (GMT+" + d + ")"
                    }
                }
            }
        }
        g += "</span>";
        return g
    },
    getTimeStamp: function() {
        return new Date().getTime()
    },
    fake_ts_unique_incrementer: "0",
    fake_ts_unique_padder: "x",
    makeTsStamp: function(e, b, c) {
        e = e || new Date().getTime();
        b = b || TS.utility.date.fake_ts_unique_padder;
        c = (c === undefined || c === null) ? ++TS.utility.date.fake_ts_unique_incrementer : c;
        var a = Math.floor(e / 1000).toString();
        var f = TS.utility.padNumber(c, 6, b);
        return a + "." + f
    },
    sameDay: function(a, b) {
        return ((a.getFullYear() == b.getFullYear()) && (a.getMonth() == b.getMonth()) && (a.getDate() == b.getDate()))
    },
    sameHour: function(a, b) {
        return ((a.getFullYear() == b.getFullYear()) && (a.getMonth() == b.getMonth()) && (a.getDate() == b.getDate()) && (a.getHours() == b.getHours()))
    },
    distanceInMinutes: function(a, d) {
        var c = Math.round(a.getTime() / 1000) - Math.round(d.getTime() / 1000);
        var b = c / 60;
        return b
    },
    getNextActivityDayStamp: function(d) {
        var c = TS.utility.date.toDateObject(d);
        var b = new Date(c.getTime() + 86400000);
        var a = b.getFullYear() + "-" + TS.utility.padNumber(b.getMonth() + 1, 2, "0") + "-" + TS.utility.padNumber(b.getDate(), 2, "0");
        return a
    },
    getPrevActivityDayStamp: function(d) {
        var c = TS.utility.date.toDateObject(d);
        var b = new Date(c.getTime() - 86400000);
        var a = b.getFullYear() + "-" + TS.utility.padNumber(b.getMonth() + 1, 2, "0") + "-" + TS.utility.padNumber(b.getDate(), 2, "0");
        return a
    }
});
TS.registerModule("utility.msgs", {
    automated_subtypes: ["channel_join", "channel_leave", "channel_topic", "channel_purpose", "channel_archive", "channel_unarchive", "group_join", "group_leave", "group_topic", "group_purpose", "group_archive", "group_unarchive", "group_name", "channel_name", "play_sound"],
    ephemeral_msgs_map: {},
    onStart: function() {},
    appendMsg: function(a, b) {
        a.unshift(TS.utility.msgs.makeSureMsgObIsValid(b))
    },
    setMsgs: function(a, c) {
        for (var b = 0; b < c.length; b++) {
            c[b] = TS.utility.msgs.makeSureMsgObIsValid(c[b])
        }
        TS.utility.msgs.sortMsgs(c);
        a.msgs = c;
        TS.utility.msgs.maybeStoreMsgs(a.id, a.msgs);
        return a.msgs
    },
    spliceMsg: function(b, c) {
        var a = b.indexOf(c);
        if (a > -1) {
            b.splice(a, 1)
        }
    },
    getNonTempMsgFromUserMatchingText: function(e, a, c) {
        if (!e && e !== 0) {
            return null
        }
        var d;
        for (var b = 0; b < c.length; b++) {
            d = c[b];
            if (d.user != a) {
                continue
            }
            if (TS.utility.msgs.isTempMsg(d)) {
                continue
            }
            if (d.text == e) {
                return d
            }
        }
        return null
    },
    getMsgByProp: function(a, d, c) {
        if (!d && d !== 0) {
            return null
        }
        var e;
        for (var b = 0; b < c.length; b++) {
            e = c[b];
            if (e[a] == d) {
                return e
            }
        }
        return null
    },
    getEditableMsgByProp: function(a, d, c) {
        if (!d && d !== 0) {
            return null
        }
        var e;
        for (var b = 0; b < c.length; b++) {
            e = c[b];
            if (e.subtype && e.subtype != "me_message") {
                continue
            }
            if (e[a] == d) {
                return e
            }
        }
        return null
    },
    sortMsgs: function(b) {
        function a(d, c) {
            if (d.ts < c.ts) {
                return 1
            }
            if (d.ts > c.ts) {
                return -1
            }
            return 0
        }
        b.sort(a)
    },
    getPrevDisplayedMsg: function(d, e) {
        var b = "ts";
        var f;
        var a = false;
        for (var c = 0; c < e.length; c++) {
            f = e[c];
            if (a) {
                if (!f.no_display) {
                    return f
                }
            } else {
                if (f.ts == d) {
                    a = true
                }
            }
        }
        return null
    },
    getDisplayedMsgs: function(c) {
        var a = [];
        var d;
        for (var b = 0; b < c.length; b++) {
            d = c[b];
            if (!d.no_display) {
                a.push(d)
            }
        }
        return a
    },
    getDisplayedMsgAfterTS: function(c, d) {
        var a = "ts";
        var e;
        for (var b = d.length - 1; b > -1; b--) {
            e = d[b];
            if (e.ts > c) {
                if (!e.no_display) {
                    return e
                }
            }
        }
        return null
    },
    getDisplayedMsgBeforeTS: function(c, d) {
        var a = "ts";
        var e;
        for (var b = 0; b < d.length; b++) {
            e = d[b];
            if (e.ts < c) {
                if (!e.no_display) {
                    return e
                }
            }
        }
        return null
    },
    getMsg: function(b, a) {
        if (!a) {
            TS.error("no msgs?");
            return null
        }
        return TS.utility.msgs.getMsgByProp("ts", b, a)
    },
    getMsgByRspId: function(a, b) {
        if (!b) {
            TS.error("no msgs?");
            return null
        }
        return TS.utility.msgs.getMsgByProp("rsp_id", a, b)
    },
    getMsgActions: function(c) {
        if (!c) {
            return
        }
        var b = {
            edit_msg: true,
            delete_msg: true
        };
        var a = false;
        if (c.user == TS.model.user.id) {
            a = true
        }
        if (!a) {
            b.edit_msg = false
        } else {
            if (TS.model.team.prefs.msg_edit_window_mins > -1 && (TS.utility.date.getTimeStamp() - TS.utility.date.toDateObject(c.ts)) / 60000 > TS.model.team.prefs.msg_edit_window_mins) {
                b.edit_msg = false
            } else {
                if (TS.utility.msgs.automated_subtypes.indexOf(c.subtype) != -1) {
                    b.edit_msg = false
                } else {
                    if (c.subtype == "file_upload" || c.subtype == "file_share" || c.subtype == "file_mention" || c.subtype == "file_comment") {
                        b.edit_msg = false
                    }
                }
            }
        } if (!TS.model.team.prefs.allow_message_deletion) {
            if (TS.boot_data.feature_message_deletion_admin_only) {
                if (!TS.model.user.is_admin) {
                    b.delete_msg = false
                } else {
                    if (TS.model.active_im_id && !a) {
                        b.delete_msg = false
                    }
                }
            } else {
                if (!TS.model.user.is_owner) {
                    b.delete_msg = false
                }
            }
        } else {
            if (TS.model.active_im_id) {
                if (!a && c.user != "USLACKBOT" && c.subtype != "bot_message") {
                    b.delete_msg = false
                }
            } else {
                if (!a) {
                    if (!TS.model.user.is_admin) {
                        b.delete_msg = false
                    }
                } else {
                    if (TS.utility.msgs.automated_subtypes.indexOf(c.subtype) != -1) {
                        if (!TS.model.user.is_admin) {
                            b.delete_msg = false
                        }
                    }
                }
            }
        } if (c.is_ephemeral) {
            b.delete_msg = true
        }
        return b
    },
    maybeStoreMsgs: function(c, b) {
        if (!TS.client) {
            return
        }
        b = TS.utility.msgs.prepareMsgsForLS(b);
        var a = TS.storage.fetchMsgsRaw(c);
        if (!a || JSON.stringify(a) != JSON.stringify(b)) {
            TS.storage.storeMsgs(c, b)
        }
    },
    validateMsg: function(c, b, a) {
        if (!b.ts) {
            TS.error("msg lacks a ts (" + c + ")");
            TS.dir(0, b);
            return false
        }
        if (TS.utility.msgs.getMsg(b.ts, a)) {
            TS.warn("msg " + b.ts + " already exists! (" + c + ")");
            TS.dir(0, b);
            return false
        }
        return true
    },
    replaceMsg: function(b, a) {
        var d = TS.utility.msgs.getMsg(a.ts, b.msgs);
        if (!d) {
            return
        }
        var e = a.comment || null;
        a = TS.utility.msgs.processImsg(a);
        if (e) {
            a.comment = e
        }
        for (var c in d) {
            delete d[c]
        }
        for (var c in a) {
            d[c] = a[c]
        }
        if (b.id == TS.model.active_im_id) {
            TS.ims.message_changed_sig.dispatch(b, d)
        } else {
            if (b.id == TS.model.active_channel_id) {
                TS.channels.message_changed_sig.dispatch(b, d)
            } else {
                if (b.id == TS.model.active_group_id) {
                    TS.groups.message_changed_sig.dispatch(b, d)
                }
            }
        }
        TS.utility.msgs.maybeStoreMsgs(b.id, b.msgs)
    },
    removeEphemeralMsg: function(b, c) {
        var a = TS.groups.getGroupById(b) || TS.channels.getChannelById(b);
        if (!a) {
            return
        }
        if (a.is_channel) {
            TS.channels.removeMsg(b, TS.utility.msgs.getMsg(c, a.msgs))
        } else {
            if (a.is_group) {
                TS.groups.removeMsg(b, TS.utility.msgs.getMsg(c, a.msgs))
            }
        }
    },
    getMemberFromMemberMarkup: function(b) {
        var c = b.substr(1);
        if (c) {
            c = c.split("|")[0]
        }
        var a = TS.members.getMemberById(c);
        if (!a) {
            a = TS.members.getMemberByName(c)
        }
        return a
    },
    makeSureMsgObIsValid: function(a) {
        return a
    },
    api_url_prefix: "api::",
    doApiUrl: function(b) {
        if (!TS.client) {
            alert("This link will not work in the archives.");
            return
        }
        b = b.replace(TS.utility.msgs.api_url_prefix, "");
        var f = b.split("?");
        var a = f[0];
        var h = {};
        if (f.length > 1) {
            var e = f[1].split("&");
            for (var g = 0; g < e.length; g++) {
                var d = e[g].indexOf("=");
                if (d != -1) {
                    var c = e[g].substring(0, d);
                    var j = e[g].substring(d + 1);
                    h[c] = unescape(j)
                }
            }
        }
        TS.api.call(a, h)
    },
    new_api_url_prefix: "slack-action://",
    doNewApiUrl: function(a) {
        if (!TS.client) {
            alert("This link will not work in the archives.");
            return
        }
        var c = a.replace(TS.utility.msgs.new_api_url_prefix, "").split("/");
        var d = c.shift();
        var b = c.join("/");
        TS.api.call("chat.action", {
            bot: d,
            payload: decodeURIComponent(b)
        })
    },
    getHighlightWordsRegex: function() {
        if (!TS.model.highlight_words_regex) {
            TS.utility.msgs.makeHighlightWordsRegex()
        }
        return TS.model.highlight_words_regex
    },
    makeHighlightWordsRegex: function() {
        var b;
        var c = [];
        for (var a = 0; a < TS.model.highlight_words.length; a++) {
            b = TS.utility.regexpEscape(TS.model.highlight_words[a]);
            if (b == "don") {
                b += "(?!'t)"
            }
            c.push(b)
        }
        TS.model.highlight_words_regex = new RegExp("\\b(" + c.join("|") + ")\\b", "i")
    },
    msgContainsMention: function(g) {
        var c = TS.utility.msgs.getHighlightWordsRegex();
        var h = (g.subtype == "bot_message");

        function b(j) {
            if (!j) {
                return false
            }
            if (TS.model.you_regex.test(j)) {
                return true
            }
            if (TS.model.everyone_regex.test(j)) {
                return true
            }
            if (TS.model.channel_regex.test(j)) {
                return true
            }
            if (TS.model.group_regex.test(j)) {
                return true
            }
            if (h) {
                return false
            }
            if (c.test(j)) {
                return true
            }
            return false
        }
        if (!g.ignore_if_attachments_supported && b(g.text)) {
            return true
        }
        var f;
        var e;
        if (g.attachments) {
            for (var d = 0; d < g.attachments.length; d++) {
                f = g.attachments[d];
                if (f.from_url) {
                    continue
                }
                if (b(f.title)) {
                    return true
                }
                if (b(f.pretext)) {
                    return true
                }
                if (b(f.text)) {
                    return true
                }
                if (b(f.footer)) {
                    return true
                }
                if (!f.fields || !f.fields.length) {
                    continue
                }
                for (var a = 0; a < f.fields.length; a++) {
                    e = f.fields[a];
                    if (b(e.value)) {
                        return true
                    }
                }
            }
        }
        return false
    },
    getMsgMentionData: function(b) {
        var h = {
            mentions: false,
            non_channel_mentions: false
        };
        var e = TS.utility.msgs.getHighlightWordsRegex();
        var f = (b.subtype == "bot_message");

        function a(m) {
            if (j(m)) {
                h.non_channel_mentions = true;
                h.mentions = true;
                return true
            }
            if (l(m)) {
                h.mentions = true
            }
            return false
        }

        function j(m) {
            if (!m) {
                return false
            }
            if (TS.model.you_regex.test(m)) {
                return true
            }
            if (f) {
                return false
            }
            if (e.test(m)) {
                return true
            }
            return false
        }

        function l(m) {
            if (!m) {
                return false
            }
            if (TS.model.everyone_regex.test(m)) {
                return true
            }
            if (TS.model.channel_regex.test(m)) {
                return true
            }
            if (TS.model.group_regex.test(m)) {
                return true
            }
            return false
        }
        if (!b.ignore_if_attachments_supported && a(b.text)) {
            return h
        }
        var g;
        var k;
        if (b.attachments) {
            for (var d = 0; d < b.attachments.length; d++) {
                g = b.attachments[d];
                if (g.from_url) {
                    continue
                }
                if (a(g.title)) {
                    return h
                }
                if (a(g.pretext)) {
                    return h
                }
                if (a(g.text)) {
                    return h
                }
                if (a(g.footer)) {
                    return h
                }
                if (!g.fields || !g.fields.length) {
                    continue
                }
                for (var c = 0; c < g.fields.length; c++) {
                    k = g.fields[c];
                    if (a(k.value)) {
                        return h
                    }
                }
            }
        }
        return h
    },
    msgCanCountAsUnread: function(a) {
        if (a.no_display) {
            return false
        }
        if (a.subtype == "channel_join" && a.inviter && a.user == TS.model.user.id) {
            return true
        }
        if (a.subtype == "group_join" && a.inviter && a.user == TS.model.user.id) {
            return true
        }
        if (a.user == TS.model.user.id) {
            return false
        }
        if (a.subtype == "channel_join") {
            return false
        }
        if (a.subtype == "channel_leave") {
            return false
        }
        if (a.subtype == "group_join") {
            return false
        }
        if (a.subtype == "group_leave") {
            return false
        }
        if (a.comment && a.comment.user == TS.model.user.id) {
            return false
        }
        return true
    },
    isChannelOrGroupMuted: function(a) {
        return false
    },
    isChannelOrGroupLoud: function(a) {
        if (!a) {
            TS.error('wtf no c_id "' + a + '"');
            return false
        }
        if (TS.model.loud_channels.indexOf(a) > -1) {
            return true
        }
        return false
    },
    isChannelOrGroupNever: function(a) {
        if (!a) {
            TS.error('wtf no c_id "' + a + '"');
            return false
        }
        if (TS.model.never_channels.indexOf(a) > -1) {
            return true
        }
        return false
    },
    isChannelOrGroupLoudSet: function(a) {
        if (!a) {
            TS.error('wtf no c_id "' + a + '"');
            return false
        }
        if (TS.model.loud_channels_set.indexOf(a) > -1) {
            return true
        }
        return false
    },
    getGlobalPushNotificationSetting: function() {
        if (TS.model.prefs.push_everything) {
            return "everything"
        }
        if (TS.model.prefs.push_mention_alert && TS.model.prefs.push_dm_alert) {
            return "dm_and_mentions"
        }
        if (TS.model.prefs.push_mention_alert) {
            return "mentions"
        }
        if (TS.model.prefs.push_dm_alert) {
            return "dms"
        }
        return "nothing"
    },
    getChannelsAndGroupsNotUsingGlobalPushNotificationSetting: function() {
        var d = {
            nothing: [],
            mentions: [],
            everything: []
        };
        var c;
        var e;
        var b = TS.channels.getChannelsForUser();
        var f = {};
        var h;
        var a;
        var g = "quiet";
        if (TS.model.prefs.push_mention_alert) {
            g = "mentions"
        }
        if (TS.model.prefs.push_everything) {
            g = "loud"
        }
        a = TS.model.prefs.push_loud_channels_set ? TS.model.prefs.push_loud_channels_set.split(",") : [];
        for (e = 0; e < a.length; e++) {
            h = $.trim(a[e]);
            if (!h) {
                continue
            }
            f[h] = "quiet"
        }
        a = TS.model.prefs.push_mention_channels ? TS.model.prefs.push_mention_channels.split(",") : [];
        for (e = 0; e < a.length; e++) {
            h = $.trim(a[e]);
            if (!h) {
                continue
            }
            if (!f[h]) {
                continue
            }
            f[h] = "mentions"
        }
        a = TS.model.prefs.push_loud_channels ? TS.model.prefs.push_loud_channels.split(",") : [];
        for (e = 0; e < a.length; e++) {
            h = $.trim(a[e]);
            if (!h) {
                continue
            }
            if (!f[h]) {
                continue
            }
            f[h] = "loud"
        }
        for (h in f) {
            c = TS.channels.getChannelById(h) || TS.groups.getGroupById(h);
            if (!c) {
                continue
            }
            if (c.is_archived) {
                continue
            }
            if (c.is_channel && !c.is_member) {
                continue
            }
            if (f[h] == "loud") {
                if (g == "loud") {
                    continue
                }
                d.everything.push(c)
            } else {
                if (f[h] == "mentions") {
                    if (g == "mentions") {
                        continue
                    }
                    d.mentions.push(c)
                } else {
                    if (g == "quiet") {
                        continue
                    }
                    d.nothing.push(c)
                }
            }
        }
        return d
    },
    getGlobalNotificationSetting: function() {
        if (!TS.model.prefs.growls_enabled) {
            return "nothing"
        }
        if (TS.model.prefs.all_channels_loud) {
            return "everything"
        }
        return "mentions"
    },
    getChannelsAndGroupsNotUsingGlobalNotificationSetting: function() {
        var c = {
            nothing: [],
            mentions: [],
            everything: []
        };
        var b;
        var d;
        var a = TS.channels.getChannelsForUser();
        for (d in a) {
            b = a[d];
            if (b.is_archived) {
                continue
            }
            if (!b.is_member) {
                continue
            }
            if (TS.utility.msgs.isChannelOrGroupNotifySettingNothingSetSpecifically(b.id)) {
                c.nothing.push(b)
            }
            if (TS.utility.msgs.isChannelOrGroupNotifySettingMentionsSetSpecifically(b.id)) {
                c.mentions.push(b)
            }
            if (TS.utility.msgs.isChannelOrGroupNotifySettingEverythingSetSpecifically(b.id)) {
                c.everything.push(b)
            }
        }
        for (d in TS.model.groups) {
            b = TS.model.groups[d];
            if (b.is_archived) {
                continue
            }
            if (TS.utility.msgs.isChannelOrGroupNotifySettingNothingSetSpecifically(b.id)) {
                c.nothing.push(b)
            }
            if (TS.utility.msgs.isChannelOrGroupNotifySettingMentionsSetSpecifically(b.id)) {
                c.mentions.push(b)
            }
            if (TS.utility.msgs.isChannelOrGroupNotifySettingEverythingSetSpecifically(b.id)) {
                c.everything.push(b)
            }
        }
        return c
    },
    isChannelOrGroupNotifySettingNothingSetSpecifically: function(a) {
        if (TS.model.prefs.growls_enabled && TS.utility.msgs.getChannelOrGroupNotifySettingBasedOnLoudness(a) == "nothing") {
            return true
        }
        return false
    },
    isChannelOrGroupNotifySettingMentionsSetSpecifically: function(a) {
        if ((!TS.model.prefs.growls_enabled || TS.model.prefs.all_channels_loud) && TS.utility.msgs.getChannelOrGroupNotifySettingBasedOnLoudness(a) == "mentions") {
            return true
        }
        return false
    },
    isChannelOrGroupNotifySettingEverythingSetSpecifically: function(a) {
        if ((!TS.model.prefs.growls_enabled || !TS.model.prefs.all_channels_loud) && TS.utility.msgs.getChannelOrGroupNotifySettingBasedOnLoudness(a) == "everything") {
            return true
        }
        return false
    },
    getChannelOrGroupNotifySettingBasedOnLoudness: function(a) {
        if (!a) {
            TS.error('wtf no c_id "' + a + '"');
            return false
        }
        var b = TS.utility.msgs.isChannelOrGroupLoudSet(a);
        if (b) {
            if (TS.utility.msgs.isChannelOrGroupLoud(a)) {
                return "everything"
            }
            if (TS.utility.msgs.isChannelOrGroupNever(a)) {
                return "nothing"
            }
            return "mentions"
        }
        if (TS.model.prefs.growls_enabled) {
            if (TS.model.prefs.all_channels_loud) {
                return "everything"
            }
            return "mentions"
        }
        return "nothing"
    },
    isChannelOrGroupPushLoud: function(a) {
        if (!a) {
            TS.error('wtf no c_id "' + a + '"');
            return false
        }
        if (TS.model.push_loud_channels.indexOf(a) > -1) {
            return true
        }
        return false
    },
    isChannelOrGroupPushMention: function(a) {
        if (!a) {
            TS.error('wtf no c_id "' + a + '"');
            return false
        }
        if (TS.model.push_mention_channels.indexOf(a) > -1) {
            return true
        }
        return false
    },
    isChannelOrGroupPushLoudSet: function(a) {
        if (!a) {
            TS.error('wtf no c_id "' + a + '"');
            return false
        }
        if (TS.model.push_loud_channels_set.indexOf(a) > -1) {
            return true
        }
        return false
    },
    getChannelOrGroupPushNotifySettingBasedOnLoudness: function(b) {
        if (!b) {
            TS.error('wtf no c_id "' + b + '"');
            return false
        }
        var a = TS.utility.msgs.isChannelOrGroupPushLoudSet(b);
        if (a) {
            if (TS.utility.msgs.isChannelOrGroupPushLoud(b)) {
                return "everything"
            }
            if (TS.utility.msgs.isChannelOrGroupPushMention(b)) {
                return "mentions"
            }
            return "nothing"
        }
        if (TS.model.prefs.push_everything) {
            return "everything"
        }
        if (TS.model.prefs.push_mention_alert) {
            return "mentions"
        }
        return "nothing"
    },
    countAllUnreads: function() {
        TS.model.all_unread_highlights_cnt = 0;
        TS.model.all_unread_cnt = 0;
        var c;
        var b;
        var d;
        var e;
        var a = TS.channels.getChannelsForUser();
        for (c = 0; c < a.length; c++) {
            d = a[c];
            if (d.is_archived && !d.was_archived_this_session) {
                continue
            }
            TS.model.all_unread_cnt += parseInt(d.unread_cnt) || 0;
            TS.model.all_unread_highlights_cnt += parseInt(d.unread_highlight_cnt) || 0
        }
        for (c = 0; c < TS.model.groups.length; c++) {
            e = TS.model.groups[c];
            if (e.is_archived && !e.was_archived_this_session) {
                continue
            }
            TS.model.all_unread_cnt += parseInt(e.unread_cnt) || 0;
            TS.model.all_unread_highlights_cnt += parseInt(e.unread_highlight_cnt) || 0
        }
        for (c = 0; c < TS.model.ims.length; c++) {
            b = TS.model.ims[c];
            TS.model.all_unread_cnt += parseInt(b.unread_cnt) || 0;
            TS.model.all_unread_highlights_cnt += parseInt(b.unread_cnt) || 0
        }
    },
    reCalcAndCountAllUnreads: function() {
        var c;
        var b;
        var d;
        var e;
        var a = TS.channels.getChannelsForUser();
        for (c = 0; c < a.length; c++) {
            d = a[c];
            if (d.is_archived && !d.was_archived_this_session) {
                continue
            }
            TS.channels.calcUnreadCnts(d)
        }
        for (c = 0; c < TS.model.groups.length; c++) {
            e = TS.model.groups[c];
            if (e.is_archived && !e.was_archived_this_session) {
                continue
            }
            TS.groups.calcUnreadCnts(e)
        }
        for (c = 0; c < TS.model.ims.length; c++) {
            b = TS.model.ims[c];
            TS.ims.calcUnreadCnts(b)
        }
        TS.utility.msgs.countAllUnreads()
    },
    whatisunread: function() {
        var c;
        var b;
        var d;
        var e;
        var a = [];
        for (c = 0; c < TS.model.channels.length; c++) {
            d = TS.model.channels[c];
            if (d.unread_cnt) {
                a.push("C:" + d.name + " " + d.unread_cnt)
            }
        }
        for (c = 0; c < TS.model.groups.length; c++) {
            e = TS.model.groups[c];
            if (e.unread_cnt) {
                a.push("G:" + e.name + " " + e.unread_cnt)
            }
        }
        for (c = 0; c < TS.model.ims.length; c++) {
            b = TS.model.ims[c];
            if (b.unread_cnt) {
                a.push("D:" + b.name + " " + b.unread_cnt)
            }
        }
        TS.info("unreads: " + a.join(","))
    },
    maybeSetOldestMsgsTsAfterMsgAdded: function(a) {
        if (a.oldest_msg_ts) {
            return
        }
        if (a.latest) {
            return
        }
        TS.utility.msgs.setOldestMsgsTs(a)
    },
    setOldestMsgsTs: function(a) {
        var b = TS.utility.msgs.getOldestValidTs(a.msgs);
        if (b) {
            a.oldest_msg_ts = b;
            TS.storage.storeOldestTs(a.id, a.oldest_msg_ts)
        }
    },
    getOlderMsgsStatus: function(b) {
        var g = b.msgs;
        var c = b.oldest_msg_ts;
        var a = (b.latest) ? b.latest.ts : null;
        var f = false;
        var h = "ERROR";
        var e = false;
        var d = 0;
        if (c && TS.utility.msgs.getMsg(c, g)) {
            f = true
        }
        if (!a) {
            if (g.length) {
                e = false;
                d = 1;
                h = "There are NOT older messages than these."
            } else {
                e = false;
                d = 2;
                h = "THIS IS A BRAND NEW CHANNEL SAY SOMETHING"
            }
        } else {
            if (f || b.is_limited) {
                e = false;
                d = 3;
                h = "We have the oldest msg: " + c + ". is_limited:" + b.is_limited
            } else {
                e = true;
                d = 4;
                if (c) {
                    h = "There are older messages than these. oldest_msg_ts: " + c
                } else {
                    h = "There are older messages than these. oldest_msg_ts: unknown"
                }
            }
        }
        return {
            text: h,
            more: e,
            code: d,
            is_limited: b.is_limited
        }
    },
    getMostRecentValidTs: function(b) {
        var c;
        for (var a = 0; a < b.length; a++) {
            c = b[a];
            if (!TS.utility.msgs.isTempMsg(c)) {
                return c.ts
            }
        }
        return null
    },
    getOldestValidTs: function(b) {
        var c;
        for (var a = b.length - 1; a > -1; a--) {
            c = b[a];
            if (!TS.utility.msgs.isTempMsg(c)) {
                return c.ts
            }
        }
        return null
    },
    getHistoryFetchJobKey: function(a, b) {
        var c = a;
        if (b) {
            c += "_" + b
        }
        return c
    },
    processImsg: function(a, c, b) {
        TS.utility.msgs._slurpExtraData(a);
        return TS.utility.msgs._makeInternalMsgObject(a)
    },
    processImsgFromHistory: function(a, b) {
        var c = TS.utility.msgs.processImsg(a);
        a.channel = b;
        if (a.subtype == "message_deleted") {
            TS.msg_handlers.subtype__message_deleted(a)
        } else {
            if (a.subtype == "message_changed") {
                TS.msg_handlers.subtype__message_changed(a)
            }
        }
        return c
    },
    _makeInternalMsgObject: function(c) {
        var a = {
            type: "message",
            ts: c.ts
        };
        if (c.type == "channel_topic" || c.type == "channel_purpose" || c.type == "channel_join" || c.type == "channel_leave") {
            c.subtype = c.type
        }
        if (c.inviter) {
            a.inviter = c.inviter
        }
        if (c.hidden) {
            a.hidden = c.hidden
        }
        if (c.ignore_if_attachments_supported) {
            a.ignore_if_attachments_supported = c.ignore_if_attachments_supported
        }
        if (c.hidden || c.no_display) {
            a.no_display = true
        }
        if (c.ignore_if_attachments_supported && (!c.attachments || !c.attachments.length)) {
            a.no_display = true
        }
        if (c.edited) {
            a.edited = c.edited
        }
        if (c.user) {
            a.user = c.user
        }
        if (c.attachments) {
            a.attachments = c.attachments
        }
        if (c.img_vids) {
            a.img_vids = c.img_vids
        }
        if (c.imgs) {
            a.img_vids = a.img_vids || {};
            var b;
            for (var d in c.imgs) {
                if (a.img_vids[d]) {
                    continue
                }
                b = c.imgs[d];
                b.img_vid_type = "img";
                a.img_vids[d] = b
            }
        }
        if (c.videos) {
            a.img_vids = a.img_vids || {};
            var f;
            for (var d in c.videos) {
                if (a.img_vids[d]) {
                    continue
                }
                f = c.videos[d];
                f.img_vid_type = "video";
                a.img_vids[d] = f
            }
        }
        if (c.icons) {
            a.icons = c.icons
        }
        if (c.bot_id) {
            a.bot_id = c.bot_id
        }
        if (c.is_ephemeral) {
            a.is_ephemeral = c.is_ephemeral
        }
        if (c._alert_even_though_temp) {
            a._alert_even_though_temp = c._alert_even_though_temp
        }
        if (c.is_starred) {
            a.is_starred = c.is_starred
        }
        if (c.topic) {
            a.topic = c.topic
        }
        if (c.name) {
            a.name = c.name
        }
        if (c.old_name) {
            a.old_name = c.old_name
        }
        if (c.purpose) {
            a.purpose = c.purpose
        }
        if (c.text) {
            a.text = c.text
        }
        if (c.sound) {
            a.sound = c.sound
        }
        if ("mrkdwn" in c) {
            a.mrkdwn = !!c.mrkdwn
        }
        if ("hex_swatches" in c) {
            a.hex_swatches = !!c.hex_swatches
        }
        if (c.subtype) {
            a.subtype = c.subtype;
            if (a.subtype == "bot_message") {
                if (c.username) {
                    a.username = c.username
                }
            }
            if (c.subtype == "file_share" || c.subtype == "file_mention" || c.subtype == "file_comment") {
                if (c.upload) {
                    a.upload = true
                }
                if (c.file) {
                    var e = TS.files.getFileById(c.file.id);
                    if (e) {
                        a.file = e
                    } else {
                        TS.error("no file, no_display = true " + a.ts);
                        a.no_display = true
                    }
                } else {
                    a.no_display = true
                } if (c.subtype == "file_comment") {
                    if (c.comment) {
                        if (a.file) {
                            a.comment = TS.files.addCommentToFile(c.comment, a.file)
                        } else {
                            a.comment = c.comment
                        }
                    } else {
                        a.no_display = true
                    }
                }
            }
        }
        return a
    },
    fetchInitialMsgsFromLS: function(b) {
        var c = TS.storage.fetchMsgs(b.id);
        var a = TS.model.initial_msgs_cnt;
        if (c.length > a) {
            c.length = a
        }
        return c
    },
    processAttachments: function(a) {
        if (!a) {
            return
        }
        var g;
        for (var e = 0; e < a.length; e++) {
            g = a[e];
            if (!g) {
                TS.warn("attachment is null!");
                continue
            }
            if (g.slack_file_id && !g._slack_file_is_deleted) {
                var d = TS.files.getFileById(g.slack_file_id);
                if (d) {
                    g._slack_file = d
                } else {
                    if (g._slack_file) {
                        g._slack_file = TS.files.upsertFile(g._slack_file).file
                    }
                }
            }
            if (g.mrkdwn_in && $.isArray(g.mrkdwn_in) && g.mrkdwn_in.length) {
                g.mrkdwn_in_hash = {};
                for (var b = 0; b < g.mrkdwn_in.length; b++) {
                    g.mrkdwn_in_hash[g.mrkdwn_in[b]] = true
                }
            }
            if (!g.mrkdwn_in_hash) {
                g.mrkdwn_in_hash = {}
            }
            delete g.mrkdwn_in;
            g.hex_swatches = !!g.hex_swatches;
            if (g.audio_html || g.audio_url) {
                TS.inline_audios.makeInternalInlineAudio(g.audio_html || g.audio_url, g)
            }
            if (g.video_html) {
                var c = (g.video_html_width && parseInt(g.video_html_width) > parseInt(g.thumb_width)) ? g.video_html_width : g.thumb_width;
                var f = (g.video_html_height && parseInt(g.video_html_height) > parseInt(g.thumb_height)) ? g.video_html_height : g.thumb_height;
                TS.inline_videos.makeInternalInlineVideo(g.from_url || g.thumb_url, {
                    title: g.title,
                    html: g.video_html,
                    thumbnail: {
                        url: g.thumb_url,
                        width: c,
                        height: f,
                        link_url: g.from_url || g.title_url
                    }
                })
            } else {
                if (g.image_url) {
                    TS.inline_imgs.makeInternalInlineImg(g.from_url || g.image_url, {
                        src: g.image_url,
                        width: g.image_width,
                        height: g.image_height,
                        link_url: g.from_url || g.title_url || g.image_url,
                        bytes: g.image_bytes
                    })
                } else {
                    if (g.from_url) {
                        TS.inline_attachments.makeInternalInlineAttachment(g.from_url, g)
                    }
                }
            }
            TS.inline_attachments.massageAttachment(g, e)
        }
    },
    _slurpExtraData: function(a) {
        TS.utility.msgs.processAttachments(a.attachments);
        if (a.img_vids) {
            var d;
            var b;
            for (b in a.img_vids) {
                d = a.img_vids[b];
                if (d.img_vid_type == "img") {
                    TS.inline_imgs.makeInternalInlineImg(b, d)
                } else {
                    if (d.img_vid_type == "video") {
                        TS.inline_videos.makeInternalInlineVideo(b, d)
                    }
                }
            }
        }
        if (a.imgs) {
            for (var b in a.imgs) {
                a.imgs[b].from_url = b;
                TS.inline_imgs.makeInternalInlineImg(b, a.imgs[b])
            }
        }
        if (a.videos) {
            for (var b in a.videos) {
                a.videos[b].from_url = b;
                TS.inline_videos.makeInternalInlineVideo(b, a.videos[b])
            }
        }
        if (a.subtype == "file_share" || a.subtype == "file_mention" || a.subtype == "file_comment") {
            if (a.file && !a.file.id) {
                TS.error("WTF no file id on file in imsg.subtype:" + a.subtype + " " + a.ts)
            } else {
                if (a.file) {
                    var e = TS.files.upsertAndSignal(a.file);
                    if (a.subtype == "file_share" || a.subtype == "file_mention") {}
                    if (a.subtype == "file_comment") {
                        if (a.comment) {
                            var c = TS.files.getFileById(a.file.id);
                            if (c) {
                                TS.files.addCommentToFile(a.comment, c)
                            } else {
                                TS.warn("WTF no file? id:" + a.file.id)
                            }
                        } else {
                            TS.error("WTF no comment in imsg.subtype:" + a.subtype + " " + a.ts)
                        }
                    }
                } else {}
            }
        }
    },
    constructMsgPermalink: function(a, b) {
        if (a.is_im) {
            return "/archives/" + a.id + "/p" + b.replace(".", "")
        }
        return "/archives/" + a.name + "/p" + b.replace(".", "")
    },
    isTempMsg: function(a) {
        return (!a.ts || a.ts.indexOf(TS.utility.date.fake_ts_unique_padder) > -1)
    },
    shouldMarkUnreadsOnMessageFetch: function() {
        if (TS.qs_args.no_unread_marking_on_msgs_fetch == "1") {
            return false
        }
        return true
    },
    ipsum: function() {
        var a = ["Now that we know who you are, I know who I am.", "I'm not a mistake! It all makes sense! In a comic, you know how you can tell who the arch-villain's going to be? He's the exact opposite of the hero.", "And most times they're friends, like you and me! I should've known way back whenâ€?You know why, David? Because of the kids.", "They called me Mr Glass.", "Normally, both your asses would be dead as fucking fried chicken, but you happen to pull this shit while I'm in a transitional period so I don't wanna kill you, I wanna help you.", "But I can't give you this case, it don't belong to me.", "Besides, I've already been through too much shit this morning over this case to hand it over to your dumb ass.", "Now that there is the Tec-9, a crappy spray gun from South Miami.", "This gun is advertised as the most popular gun in American crime.", "Do you believe that shit? It actually says that in the little book that comes with it: the most popular gun in American crime.", "Like they're actually proud of that shit.", "Now that there is the Tec-9, a crappy spray gun from South Miami.", "This gun is advertised as the most popular gun in American crime.", "Do you believe that shit? It actually says that in the little book that comes with it: the most popular gun in American crime.", "Like they're actually proud of that shit.", "Look, just because I don't be givin' no man a foot massage don't make it right for Marsellus to throw Antwone into a glass motherfuckin' house, fuckin' up the way the nigger talks.", "Motherfucker do that shit to me, he better paralyze my ass, 'cause I'll kill the motherfucker, know what I'm sayin'?", "You think water moves fast? You should see ice.", "It moves like it has a mind.", "Like it knows it killed the world once and got a taste for murder.", "After the avalanche, it took us a week to climb out.", "Now, I don't know exactly when we turned on each other, but I know that seven of us survived the slideâ€?and only five made it out.", "Now we took an oath, that I'm breaking now.", "We said we'd say it was the snow that killed the other two, but it wasn't.", "Nature is lethal but it doesn't hold a candle to man."];
        return a
    },
    removeFileSharesAndMentions: function(b, d) {
        var e = b.msgs;
        var a;
        for (var c = e.length - 1; c > -1; c--) {
            a = e[c];
            if ((a.subtype == "file_share" || a.subtype == "file_mention") && a.file && a.file.id == d.id) {
                if (b.is_channel) {
                    TS.channels.removeMsg(b.id, a)
                } else {
                    if (b.is_group) {
                        TS.groups.removeMsg(b.id, a)
                    } else {
                        TS.ims.removeMsg(b.id, a)
                    }
                }
            }
        }
    },
    removeFileComments: function(b, d) {
        var e = b.msgs;
        var a;
        for (var c = e.length - 1; c > -1; c--) {
            a = e[c];
            if (a.subtype == "file_comment" && a.file && a.file.id == d.id) {
                if (b.is_channel) {
                    TS.channels.removeMsg(b.id, a)
                } else {
                    if (b.is_group) {
                        TS.groups.removeMsg(b.id, a)
                    } else {
                        TS.ims.removeMsg(b.id, a)
                    }
                }
            }
        }
    },
    removeFileReferences: function(b, e) {
        var f = b.msgs;
        var a;
        for (var d = f.length - 1; d > -1; d--) {
            a = f[d];
            if (a.attachments) {
                var c = TS.inline_attachments.getAttachmentBySlackFileId(a.attachments, e);
                if (c && !c._slack_file_is_deleted) {
                    c._slack_file_is_deleted = true;
                    delete c._slack_file;
                    if (b.id == TS.model.active_im_id) {
                        TS.ims.message_changed_sig.dispatch(b, a)
                    } else {
                        if (b.id == TS.model.active_channel_id) {
                            TS.channels.message_changed_sig.dispatch(b, a)
                        } else {
                            if (b.id == TS.model.active_group_id) {
                                TS.groups.message_changed_sig.dispatch(b, a)
                            }
                        }
                    }
                    TS.utility.msgs.maybeStoreMsgs(b.id, f)
                }
            }
        }
    },
    updateFileMsgs: function(b, d) {
        var f = b.msgs;
        var a;
        var e = function(g) {
            if (!g) {
                return false
            }
            if (!g.attachments) {
                return false
            }
            if (!g.attachments.length) {
                return false
            }
            if (TS.inline_attachments.getAttachmentBySlackFileId(g.attachments, d.id)) {
                return true
            }
            return false
        };
        for (var c = f.length - 1; c > -1; c--) {
            a = f[c];
            if (!d.is_deleted && (a.subtype == "file_share" || a.subtype == "file_mention" || a.subtype == "file_comment") && a.file && a.file.id == d.id) {} else {
                if (e(a)) {} else {
                    continue
                }
            } if (b.id == TS.model.active_im_id) {
                TS.ims.message_changed_sig.dispatch(b, a)
            } else {
                if (b.id == TS.model.active_channel_id) {
                    TS.channels.message_changed_sig.dispatch(b, a)
                } else {
                    if (b.id == TS.model.active_group_id) {
                        TS.groups.message_changed_sig.dispatch(b, a)
                    }
                }
            }
        }
    },
    tryToEditLastMsgFromShortcut: function(c) {
        var a = TS.shared.getActiveModelOb();
        if (!a) {
            return
        }
        var f = TS.utility.msgs.getEditableMsgByProp("user", TS.model.user.id, a.msgs);
        if (!f) {
            TS.ui.playSound("beep");
            alert("Found no recent messages from you to edit :(");
            return
        }
        var e = TS.format.unFormatMsg(f.text, f);
        var d = new RegExp("(\\W|^)(" + TS.utility.regexpEscape(c.str) + ")\\b", (c.g ? "g" : "") + (c.i ? "i" : ""));
        var b = e.replace(d, function(h, j, g, l, k) {
            return j + c.rpl
        });
        if (e == b) {
            TS.ui.playSound("beep");
            return
        }
        TS.msg_edit.commitEdit(f, TS.shared.getActiveModelOb(), b)
    },
    getEditLastShortcutCmd: function(b) {
        var e = b.split("/");
        if (e.length != 5 && e.length != 4) {
            return
        }
        if (e[1] != "s") {
            return
        }
        var f = e[2];
        var a = e[3];
        var d = e.length == 5 && (e[4] == "g" || e[4] == "gi" || e[4] == "ig");
        var c = e.length == 5 && (e[4] == "i" || e[4] == "gi" || e[4] == "ig");
        if (!f) {
            return
        }
        return {
            str: f,
            rpl: a,
            g: d,
            i: c
        }
    },
    maybeTruncateMsgs: function(b) {
        if (!b) {
            return
        }
        if (!b.msgs) {
            return
        }
        if (!b.msgs.length) {
            return
        }
        var m = TS.model.initial_msgs_cnt + 1;
        var j = Math.min(TS.model.hard_msg_limit, m * 2);
        var f = 1000;
        var g = 0;
        var d = 1000 * 20;
        var k = b.msgs;
        var l = TS.utility.msgs.getDisplayedMsgs(k);
        var c = TS.utility.date.getTimeStamp();
        var h = (b.has_fetched_history_after_scrollback) ? c - b.fetched_history_after_scrollback_time : c;
        if (l.length > j && (b.id != TS.shared.getActiveModelOb().id || (b.scroll_top < f && h > d))) {
            m = j
        } else {
            if (l.length - 50 <= m) {
                return
            }
            if (b.last_made_active) {
                var e = c - b.last_made_active;
                if (e < g) {
                    return
                }
            }
            if (b.unread_cnt && b.unread_count && !b.all_read_this_session_once) {
                return
            }
            if (b.scroll_top != -1) {
                return
            }
        } if (b.history_is_being_fetched) {
            return
        }
        var a = [];
        while (TS.utility.msgs.getDisplayedMsgs(k).length > m) {
            a.push(k.pop())
        }
        if (b.id == TS.model.active_channel_id) {
            TS.view.removeMsgsAfterTruncation(a)
        }
        TS.storage.storeMsgs(b.id, TS.utility.msgs.prepareMsgsForLS(k))
    },
    checkForMsgsToTruncate: function() {
        if (!TS.model) {
            return
        }
        if (!TS.model.channels) {
            return
        }
        var b = TS.model.channels;
        var e;
        for (i = 0; i < b.length; i++) {
            e = b[i];
            if (e.id == TS.model.active_channel_id) {
                continue
            }
            if (!e.is_member) {
                continue
            }
            if (e.is_archived) {
                continue
            }
            TS.utility.msgs.maybeTruncateMsgs(e)
        }
        var d = TS.model.ims;
        var c;
        for (i = 0; i < d.length; i++) {
            c = d[i];
            if (c.id == TS.model.active_im_id) {
                continue
            }
            TS.utility.msgs.maybeTruncateMsgs(c)
        }
        var a = TS.model.groups;
        var f;
        for (i = 0; i < a.length; i++) {
            f = a[i];
            if (f.id == TS.model.active_group_id) {
                continue
            }
            if (f.is_archived) {
                continue
            }
            TS.utility.msgs.maybeTruncateMsgs(f)
        }
    },
    getEphemeralMsgsByCidAndType: function(e, c) {
        var g;
        var d;
        var a = [];
        var b = TS.groups.getGroupById(e) || TS.channels.getChannelById(e) || TS.ims.getImById(e);
        if (!b) {
            return a
        }
        for (var f in TS.utility.msgs.ephemeral_msgs_map) {
            var d = TS.utility.msgs.ephemeral_msgs_map[f];
            if (d.ephemeral_type == c && d.c_id == e) {
                g = TS.utility.msgs.getMsg(f, b.msgs);
                if (!g) {
                    continue
                }
                a.push(g)
            }
        }
        return a
    },
    removeAllEphemeralMsgsByType: function(b, d) {
        var a;
        var c;
        var f;
        for (var e in TS.utility.msgs.ephemeral_msgs_map) {
            var c = TS.utility.msgs.ephemeral_msgs_map[e];
            if (c.ephemeral_type == b) {
                if (d && d != c.c_id) {
                    continue
                }
                a = TS.shared.getModelObById(c.c_id);
                if (!a) {
                    continue
                }
                f = TS.utility.msgs.getMsg(e, a.msgs);
                if (!f) {
                    continue
                }
                if (a.is_im) {
                    TS.ims.removeMsg(a.id, f)
                } else {
                    if (a.is_channel) {
                        TS.channels.removeMsg(a.id, f)
                    } else {
                        if (a.is_group) {
                            TS.groups.removeMsg(a.id, f)
                        }
                    }
                }
                delete TS.utility.msgs.ephemeral_msgs_map[e]
            }
        }
    },
    prepareMsgsForLS: function(f) {
        if (!f) {
            return f
        }
        var b = [];
        var a;
        var g;
        for (var d = 0; d < f.length; d++) {
            g = f[d];
            a = {};
            b.push(a);
            for (var c in g) {
                if (c == "file" && g.file) {
                    a.file = {};
                    for (var e in g.file) {
                        if (e == "content") {
                            continue
                        }
                        if (e == "content_html") {
                            continue
                        }
                        if (e == "content_highlight_html") {
                            continue
                        }
                        if (e == "comments") {
                            continue
                        }
                        a.file[e] = g.file[e]
                    }
                } else {
                    a[c] = g[c]
                }
            }
        }
        return b
    },
    hasImgs: function(d) {
        if (!d) {
            return false
        }
        if (d.img_vids) {
            var c;
            var a;
            for (a in d.img_vids) {
                c = d.img_vids[a];
                if (c.img_vid_type == "img") {
                    return true
                }
            }
        } else {
            if (d.attachments) {
                for (var b = 0; b < d.attachments.length; b++) {
                    if (d.attachments[b].image_url) {
                        return true
                    }
                }
            }
        }
        return false
    },
    ingestMessagesFromBootData: function(b) {
        if (!TS.boot_data.msgs) {
            return
        }
        var e = TS.boot_data.msgs[b.id];
        var a = [];
        if (e) {
            var c;
            for (var d = 0; d < e.length; d++) {
                c = e[d];
                if (!c.ts) {
                    continue
                }
                a.push(TS.utility.msgs.processImsg(c))
            }
        }
        TS.utility.msgs.setMsgs(b, a)
    },
    handleSearchHighlights: function(b) {
        var a = 0;
        var c = false;
        while (b.match(/href="(.*?)\ue000(.*?)">/g) || b.match(/href="(.*?)\ue001(.*?)">/g)) {
            if (c && a == 0) {
                TS.warn(b)
            }
            a++;
            b = b.replace(/href="(.*?)\ue000(.*?)">/g, 'href="$1$2">').replace(/href="(.*?)\ue001(.*?)">/g, 'href="$1$2">');
            if (c) {
                TS.info(b)
            }
        }
        if (c && a > 0) {
            TS.info(b)
        }
        b = b.replace(/\ue000/g, '<span class="match">').replace(/\ue001/g, "</span>");
        return b
    }
});
TS.registerModule("utility", {
    keymap: {
        alt: 18,
        ctrl: 17,
        cmd_ff: 224,
        cmd_other: 91,
        cmd_right: 93,
        esc: 27,
        shift: 16,
        tab: 9,
        del: 8,
        enter: 13,
        left: 37,
        up: 38,
        right: 39,
        down: 40,
        pageup: 33,
        pagedown: 34,
        end: 35,
        home: 36,
        space: 32,
        semicolon: 59,
        left_square_bracket: 219,
        right_square_bracket: 221,
        V: 86,
        insert: 45
    },
    keymap_reverse: {
        "18": "alt",
        "17": "ctrl",
        "224": "cmd_ff",
        "91": "cmd_other",
        "93": "cmd_right",
        "27": "esc",
        "16": "shift",
        "9": "tab",
        "8": "del",
        "13": "enter",
        "37": "left",
        "38": "up",
        "39": "right",
        "40": "down",
        "219": "left_square_bracket",
        "221": "right_square_bracket",
        "86": "V",
        "45": "insert"
    },
    is_retina: false,
    onStart: function() {
        if ("devicePixelRatio" in window && window.devicePixelRatio > 1) {
            TS.utility.is_retina = true
        }
    },
    regexpEscape: function(b, a) {
        b = b || "";
        a = a || 500000;
        a = Math.min(a, 500000);
        if (b.length > a) {
            b = b.substr(0, a)
        }
        return b.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
    },
    randomInt: function(b, a) {
        b = parseInt(b);
        a = parseInt(a);
        return b + Math.floor(Math.random() * (1 + a - b))
    },
    randomFromArray: function(a) {
        return a[TS.utility.randomInt(0, a.length - 1)]
    },
    doRectsOverlap: function(b, a) {
        return !(a.left > b.right || a.right < b.left || a.top > b.bottom || a.bottom < b.top)
    },
    doesRectContainRect: function(c, a, b, d) {
        b = b || 0;
        if (a.top < c.top - b) {
            return false
        }
        if (a.bottom > c.bottom + b) {
            return false
        }
        if (d) {
            return true
        }
        if (a.left < c.left - b) {
            return false
        }
        if (a.right > c.right + b) {
            return false
        }
        return true
    },
    clamp: function(c, b, a) {
        return Math.max(b, Math.min(a, c))
    },
    inArray: function(b, c) {
        if (!b) {
            return false
        }
        if (!c && c != 0) {
            return false
        }
        for (var d = 0; d < b.length; d++) {
            if (b[d] == c) {
                return true
            }
        }
        return false
    },
    clone: function(a) {
        return JSON.parse(JSON.stringify(a))
    },
    padNumber: function(c, b, a) {
        a = (a || "0").toString();
        var d = c.toString();
        while (d.length < b) {
            d = a + d
        }
        return d
    },
    ordinalNumber: function(a) {
        var a = a.toString();
        var b = a.substr(-(Math.min(a.length, 2))) > 3 && a.substr(-(Math.min(a.length, 2))) < 21 ? "th" : ["th", "st", "nd", "rd", "th"][Math.min(Number(a) % 10, 4)];
        return a + b
    },
    getChannelNameFromUrl: function(a) {
        var b = TS.utility._getPathAFromUrl(a);
        if (b && b.length > 0) {
            return decodeURIComponent(b[0])
        }
        return ""
    },
    getFlexNameFromUrl: function(a) {
        var b = TS.utility._getPathAFromUrl(a);
        if (b && b.length > 1) {
            return decodeURIComponent(b[1])
        }
        return ""
    },
    getFlexExtraFromUrl: function(a) {
        var b = TS.utility._getPathAFromUrl(a);
        if (b && b.length > 2) {
            return decodeURIComponent(b[2])
        }
        return ""
    },
    _getPathAFromUrl: function(b) {
        if (b.indexOf("/messages/") == -1) {
            return null
        }
        var a = b.split("/messages/");
        var d = a[1].split("?");
        var c = d[0].split("/");
        return c
    },
    refashionUrl: function(a, d, e, j) {
        var h = a.split(".com/messages");
        var b = h[0] + ".com";
        var f = h[1].split("?");
        var c = f[0].split("/");
        var g = (f[1]) ? "?" + f[1] : "";
        c.length = 2;
        c[0] = d;
        c[1] = e;
        if (j) {
            c.length = 3;
            c[2] = j
        }
        if (!c[1]) {
            c.length = 1
        }
        return b + "/messages/" + c.join("/") + "/" + g
    },
    dataURItoBlob: function(a) {
        return TS.utility.base64StrtoBlob(TS.utility.base64StrFromDataURI(a))
    },
    base64StrFromDataURI: function(a) {
        return a.split(",")[1]
    },
    base64StrtoBlob: function(g) {
        var b = atob(g);
        var f = new ArrayBuffer(b.length);
        var j = new Uint8Array(f);
        for (var d = 0; d < b.length; d++) {
            j[d] = b.charCodeAt(d)
        }
        var h = new DataView(f);
        var a = new Blob([h]);
        return a;
        var c = atob(g);
        var e = [];
        for (var d = 0; d < c.length; d++) {
            e.push(c.charCodeAt(d))
        }
        return new Blob([new Uint8Array(e)])
    },
    ellipsize: function(d, a) {
        if (!d) {
            return d
        }
        if (!a || !parseInt(a)) {
            a = 50
        }
        if (d.length > a) {
            var b = d.substr(0, a / 2);
            var c = d.substr(-(a / 2), d.length);
            d = b + "..." + c
        }
        return d
    },
    makeSafeForDomId: function(a) {
        return a.replace(/\./g, "_")
    },
    makeSafeForDomClass: function(a) {
        return a.replace(/\s/g, "_")
    },
    getImageIconClass: function(e, a) {
        var b = a;
        var d = 80;
        var c = 80;
        if (e && (e.thumb_360_w < d || e.thumb_360_h < c)) {
            if (e.thumb_360_w > e.thumb_360_h) {
                b = "landscape"
            } else {
                if (e.thumb_360_w < e.thumb_360_h) {
                    b = "portrait"
                } else {
                    b = "square"
                }
            }
        }
        return b
    },
    convertFilesize: function(b) {
        var b = parseInt(b);
        if (b == 0) {
            return "0 bytes"
        }
        var a = ["b", "KB", "MB", "GB"];
        var c = parseInt(Math.floor(Math.log(b) / Math.log(1024)));
        var d = b / Math.pow(1024, c);
        var e = Math.round(d, 2);
        if (e > 999) {
            e = 1;
            c++
        }
        return e + a[c]
    },
    numberWithCommas: function(a) {
        if (a === undefined) {
            return ""
        }
        var b = a.toString().split(".");
        b[0] = b[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return b.join(".")
    },
    numberWithK: function(a) {
        if (a > 999) {
            a = Math.round((a / 1000) * 10) / 10;
            return TS.utility.numberWithCommas(a) + "K"
        } else {
            return TS.utility.numberWithCommas(a)
        }
    },
    cleanChannelName: function(a) {
        a = a.toLowerCase();
        while (a.substr(0, 1) == "#") {
            a = a.substr(1)
        }
        a = a.replace(/ /g, "-");
        a = a.replace(/[^a-z0-9-_]/g, "_");
        a = a.replace(/\-+/g, "-");
        a = a.replace(/\_+/g, "_");
        return a
    },
    openInNewTab: function(a, c) {
        a = TS.utility.htmlEntities(a);
        var b = $('<form><input type="hidden" name="url" value="' + a + '"></form>').attr({
            method: "GET",
            action: "http://" + TS.boot_data.redir_domain + "/link",
            target: c
        }).appendTo("body").submit().remove()
    },
    isScalar: function(a) {
        return (/boolean|number|string/).test(typeof a)
    },
    linkify: function(b, d, c, a) {
        if (!b) {
            return b
        }
        b = b.toString().replace(/((ftp|http|https)\:\/\/|\bw{3}\.)[a-z0-9\-\.]+\.[a-z]{2,3}(:[a-z0-9]*)?\/?([a-z0-9\-\._\?\,\'\/\\\+&amp;%\$#\=~])*/gi, function(e) {
            var f;
            if (e.toLowerCase().indexOf("www.") == 0) {
                if (!c) {
                    return e
                }
                f = "http://" + e
            } else {
                f = e
            } if (a) {
                return "<" + f + "|" + e + ">"
            } else {
                return "<a " + TS.utility.makeRefererSafeLink(f) + ' target="' + (d || "") + '">' + e + "</a>"
            }
        });
        return b
    },
    linkifyInternal: function(a, b) {
        return TS.utility.linkify(a, "", b, true)
    },
    emojiGraphicReplace: function(g, j, h, c) {
        var f = emoji.text_mode;
        var b = emoji.include_title;
        var a = emoji.include_text;
        var d = emoji.allow_native;
        emoji.text_mode = false;
        emoji.include_title = !!h;
        emoji.include_text = !c;
        emoji.allow_native = false;
        var e = TS.utility.emojiReplace(g);
        emoji.text_mode = f;
        emoji.include_title = b;
        emoji.include_text = a;
        emoji.allow_native = d;
        return e
    },
    emojiReplace: function(a) {
        return emoji.replace_colons(a || "")
    },
    getCursorPosition: function(a) {
        var c, e, d, b;
        c = $(a).get(0);
        e = 0;
        if ("selectionStart" in c) {
            e = c.selectionStart
        } else {
            if ("selection" in document) {
                c.focus();
                d = document.selection.createRange();
                b = document.selection.createRange().text.length;
                d.moveStart("character", -c.value.length);
                e = d.text.length - b
            }
        }
        return e
    },
    setCursorPosition: function(a, d) {
        var c, b;
        c = $(a).get(0);
        if (c != null) {
            if (c.createTextRange) {
                b = c.createTextRange();
                b.move("character", d);
                b.select()
            } else {
                c.focus();
                c.setSelectionRange(d, d)
            }
        }
    },
    htmlEntities: function(a) {
        if (!a) {
            return ""
        }
        return String(a).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    },
    preg_quote: function(a) {
        return (a + "").replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1")
    },
    getActiveElementProp: function(a) {
        if (!document) {
            return ""
        }
        if (!document.activeElement) {
            return ""
        }
        if (a == "NODENAME") {
            if (!document.activeElement.nodeName) {
                return ""
            }
            return document.activeElement.nodeName.toUpperCase()
        }
        return document.activeElement[a]
    },
    isArrowNavUnSafe: function() {
        var b = function() {
            if (!document) {
                return false
            }
            if (!document.activeElement) {
                return false
            }
            var c = TS.utility.getActiveElementProp("NODENAME");
            if (c == "INPUT") {
                return true
            }
            if (c == "SELECT") {
                return true
            }
            if (c == "CHECKBOX") {
                return true
            }
            if (c == "TEXTAREA") {
                if ($ && $("#message-input").is(":focus") && !$("#message-input").val()) {
                    return false
                }
                return true
            }
            return false
        };
        var a = b();
        return a
    },
    isFocusOnInput: function() {
        if (!document) {
            return false
        }
        if (!document.activeElement) {
            return false
        }
        var a = TS.utility.getActiveElementProp("NODENAME");
        if (a == "INPUT") {
            return true
        }
        if (a == "TEXTAREA") {
            return true
        }
        if (a == "SELECT") {
            return true
        }
        if (a == "CHECKBOX") {
            return true
        }
        return false
    },
    formatTopicOrPurpose: function(a) {
        return TS.utility.emojiReplace(TS.utility.linkify(a, TS.templates.builders.newWindowName(), true))
    },
    capitalize: function(a) {
        return a.charAt(0).toUpperCase() + a.slice(1)
    },
    shuffleArray: function(a) {
        var d = a.length,
            c, b;
        if (d == 0) {
            return a
        }
        while (--d) {
            c = Math.floor(Math.random() * (d + 1));
            b = a[d];
            a[d] = a[c];
            a[c] = b
        }
        return a
    },
    populateInput: function(b, a) {
        b.val(a).trigger("autosize").trigger("textchange");
        b.data("textchange_lastvalue", a)
    },
    diff: function(c, b) {
        function a(h) {
            var j = h;
            j = j.replace(/&/g, "&amp;");
            j = j.replace(/</g, "&lt;");
            j = j.replace(/>/g, "&gt;");
            j = j.replace(/"/g, "&quot;");
            return j
        }

        function e(q, r) {
            q = q.replace(/\s+$/, "");
            r = r.replace(/\s+$/, "");
            var j = d(q == "" ? [] : q.split(/\s+/), r == "" ? [] : r.split(/\s+/));
            var p = "";
            var h = q.match(/\s+/g);
            if (h == null) {
                h = ["\n"]
            } else {
                h.push("\n")
            }
            var l = r.match(/\s+/g);
            if (l == null) {
                l = ["\n"]
            } else {
                l.push("\n")
            } if (j.n.length == 0) {
                for (var k = 0; k < j.o.length; k++) {
                    p += "<del>" + a(j.o[k]) + h[k] + "</del>"
                }
            } else {
                if (j.n[0].text == null) {
                    for (r = 0; r < j.o.length && j.o[r].text == null; r++) {
                        p += "<del>" + a(j.o[r]) + h[r] + "</del>"
                    }
                }
                for (var k = 0; k < j.n.length; k++) {
                    if (j.n[k].text == null) {
                        p += "<ins>" + a(j.n[k]) + l[k] + "</ins>"
                    } else {
                        var m = "";
                        for (r = j.n[k].row + 1; r < j.o.length && j.o[r].text == null; r++) {
                            m += "<del>" + a(j.o[r]) + h[r] + "</del>"
                        }
                        p += " " + j.n[k].text + l[k] + m
                    }
                }
            }
            return p
        }

        function g() {
            return "rgb(" + (Math.random() * 100) + "%, " + (Math.random() * 100) + "%, " + (Math.random() * 100) + "%)"
        }

        function f(j, k) {
            j = j.replace(/\s+$/, "");
            k = k.replace(/\s+$/, "");
            var m = d(j == "" ? [] : j.split(/\s+/), k == "" ? [] : k.split(/\s+/));
            var s = j.match(/\s+/g);
            if (s == null) {
                s = ["\n"]
            } else {
                s.push("\n")
            }
            var q = k.match(/\s+/g);
            if (q == null) {
                q = ["\n"]
            } else {
                q.push("\n")
            }
            var l = "";
            var h = new Array();
            for (var p = 0; p < m.o.length; p++) {
                h[p] = g();
                if (m.o[p].text != null) {
                    l += '<span style="background-color: ' + h[p] + '">' + a(m.o[p].text) + s[p] + "</span>"
                } else {
                    l += "<del>" + a(m.o[p]) + s[p] + "</del>"
                }
            }
            var r = "";
            for (var p = 0; p < m.n.length; p++) {
                if (m.n[p].text != null) {
                    r += '<span style="background-color: ' + h[m.n[p].row] + '">' + a(m.n[p].text) + q[p] + "</span>"
                } else {
                    r += "<ins>" + a(m.n[p]) + q[p] + "</ins>"
                }
            }
            return {
                o: l,
                n: r
            }
        }

        function d(l, m) {
            var j = new Object();
            var k = new Object();
            for (var h = 0; h < m.length; h++) {
                if (j[m[h]] == null) {
                    j[m[h]] = {
                        rows: new Array(),
                        o: null
                    }
                }
                j[m[h]].rows.push(h)
            }
            for (var h = 0; h < l.length; h++) {
                if (k[l[h]] == null) {
                    k[l[h]] = {
                        rows: new Array(),
                        n: null
                    }
                }
                k[l[h]].rows.push(h)
            }
            for (var h in j) {
                if (j[h].rows.length == 1 && typeof(k[h]) != "undefined" && k[h].rows.length == 1) {
                    m[j[h].rows[0]] = {
                        text: m[j[h].rows[0]],
                        row: k[h].rows[0]
                    };
                    l[k[h].rows[0]] = {
                        text: l[k[h].rows[0]],
                        row: j[h].rows[0]
                    }
                }
            }
            for (var h = 0; h < m.length - 1; h++) {
                if (m[h].text != null && m[h + 1].text == null && m[h].row + 1 < l.length && l[m[h].row + 1].text == null && m[h + 1] == l[m[h].row + 1]) {
                    m[h + 1] = {
                        text: m[h + 1],
                        row: m[h].row + 1
                    };
                    l[m[h].row + 1] = {
                        text: l[m[h].row + 1],
                        row: h + 1
                    }
                }
            }
            for (var h = m.length - 1; h > 0; h--) {
                if (m[h].text != null && m[h - 1].text == null && m[h].row > 0 && l[m[h].row - 1].text == null && m[h - 1] == l[m[h].row - 1]) {
                    m[h - 1] = {
                        text: m[h - 1],
                        row: m[h].row - 1
                    };
                    l[m[h].row - 1] = {
                        text: l[m[h].row - 1],
                        row: h - 1
                    }
                }
            }
            return {
                o: l,
                n: m
            }
        }
        return e(c.replace(/</g, "&lt;").replace(/\,/g, ", "), b.replace(/</g, "&lt;").replace(/\,/g, ", "))
    },
    urlNeedsRefererHiding: function(a) {
        if (!TS.model.team.prefs.hide_referers) {
            return false
        }
        if (!a) {
            return false
        }
        a = a.toLowerCase();
        if (a.indexOf("https://") != 0 && a.indexOf("http://") != 0) {
            return false
        }
        a = a.replace(/^https:\/\//, "").replace(/^http:\/\//, "");
        if (a.indexOf(TS.model.team.domain + ".") == 0) {
            return false
        }
        if (a.indexOf("files.staging.slack.com") == 0) {
            return false
        }
        if (a.indexOf("files.dev.slack.com") == 0) {
            return false
        }
        if (a.indexOf("files.slack.com") == 0) {
            return false
        }
        if (a.indexOf("dev.slack-files.com") == 0) {
            return false
        }
        if (a.indexOf("staging.slack-files.com") == 0) {
            return false
        }
        if (a.indexOf("www.slack-files.com") == 0) {
            return false
        }
        if (a.indexOf("slack-files.com") == 0) {
            return false
        }
        if (a.indexOf("slack.com") == 0) {
            return false
        }
        if (a.indexOf(TS.boot_data.redir_domain) == 0) {
            return false
        }
        if (a.indexOf("my.slack.com") == 0) {
            return false
        }
        if (a.indexOf("www.slack.com") == 0) {
            return false
        }
        return true
    },
    referer_safe_url_map: {},
    makeRefererSafeLink: function(c) {
        c = c.replace(/\ue000/g, "").replace(/\ue001/g, "");
        var e = c.replace(/\&amp\;/g, "&");
        var f = TS.utility.htmlEntities(e);
        var d = 'href="' + f + '"';
        if (TS.utility.urlNeedsRefererHiding(c)) {
            var b = encodeURIComponent(e);
            var a = "http://" + TS.boot_data.redir_domain + "/link?url=" + b;
            var g = TS.utility.htmlEntities(b);
            TS.utility.referer_safe_url_map[g] = e;
            d += ' data-referer-safe="1" onclick="this.href=&quot;' + a + '&quot;" onmouseover="this.href=TS.utility.referer_safe_url_map[&quot;' + g + '&quot;]"'
        }
        return d
    },
    makeSureAllExternalLinksHaveAreRefererSafe: function(a) {
        if (!TS.model.team.prefs.hide_referers) {
            return
        }
        var c = TS.utility.date.getTimeStamp();
        var b = [];
        a.find("a[href]:not([data-referer-safe])").each(function() {
            var d = $(this);
            var e = d.attr("href");
            if (!TS.utility.urlNeedsRefererHiding(e)) {
                return
            }
            b.push(this.outerHTML);
            d.removeAttr("href");
            var f = this.outerHTML.replace("<a", "<a " + TS.utility.makeRefererSafeLink(e) + " ");
            d.replaceWith(f);
            b[b.length - 1] += "\n->\n" + f
        });
        if (b.length) {
            TS.warn("#" + a.attr("id") + " had " + b.length + " LINKS WITH EXT HREFS BUT NOT data-referer-safe! to fix it took " + (TS.utility.date.getTimeStamp() - c) + "ms");
            TS.dir(0, b)
        } else {
            TS.log(365, "#" + a.attr("id") + " had " + b.length + " LINKS WITH EXT HREFS BUT NOT data-referer-safe! to check it took " + (TS.utility.date.getTimeStamp() - c) + "ms")
        }
    },
    sortTable: function(g, b, c, d, a) {
        var c = (c == "desc") ? "desc" : "asc";
        var a = (a == "desc") ? "desc" : "asc";

        function h(k) {
            return function(o, n) {
                var m = f(o, k);
                var l = f(n, k);
                if ($.isNumeric(m) && $.isNumeric(l)) {
                    if (m == l && d) {
                        m = f(o, d);
                        l = f(n, d);
                        if ($.isNumeric(m) && $.isNumeric(l)) {
                            if (a != c) {
                                return l - m
                            } else {
                                return m - l
                            }
                        } else {
                            if (a != c) {
                                return l.localeCompare(m)
                            } else {
                                return m.localeCompare(l)
                            }
                        }
                    }
                    return m - l
                } else {
                    return m.localeCompare(l)
                }
            }
        }

        function f(l, k) {
            return $(l).children("td").eq(k).data("sort-val")
        }
        var j = g.find("tr:gt(0)").toArray().sort(h(b));
        if (c == "desc") {
            j = j.reverse()
        }
        for (var e = 0; e < j.length; e++) {
            g.append(j[e])
        }
    },
    getPercSmartly: function(a, c) {
        if (!a || !c) {
            return "0%"
        }
        var b = (a / c) * 100;
        if (b != 100 && Math.round(b) == 100) {
            return "99%"
        }
        if (b < 0.7) {
            return "<1%"
        }
        return Math.round(b) + "%"
    },
    isCursorWithinTBTs: function(b) {
        var f = b.getCursorPosition();
        var g = b.val();
        var a = g.substr(0, f);
        var c = g.substr(f);
        var d = a.match(/```/g);
        var e = c.match(/```/g);
        if ((d && e) || (d && d.length == 1)) {
            return true
        }
        return false
    },
    getLowerCaseValue: function(a) {
        return (a && a.toLowerCase ? a.toLowerCase() : "")
    },
    rgb2hex: function(a) {
        if (/^#[0-9A-F]{6}$/i.test(a)) {
            return a
        }
        var b = a.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!b) {
            b = a.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)$/)
        }

        function c(d) {
            return ("0" + parseInt(d).toString(16)).slice(-2)
        }
        return "#" + c(b[1]) + c(b[2]) + c(b[3])
    },
    debounce: function(b, a) {
        var c;
        return function() {
            var d = this;
            var e = arguments;
            clearTimeout(c);
            c = setTimeout(function() {
                b.apply(d, e)
            }, a)
        }
    },
    cmdKey: function(a) {
        if (!a) {
            return false
        }
        if (TS.model.is_mac) {
            return !!a.metaKey
        } else {
            return !!a.ctrlKey
        }
    },
    throttle: (function() {
        var b, a;
        b = {
            delay: 200,
            timer_group: "generic"
        };
        data = {
            timers: {},
            queues: {}
        };

        function c(e) {
            var g, f;
            if (data.timers[e]) {
                if (data.queues[e]) {
                    for (g = 0, f = data.queues[e].length; g < f; g++) {
                        if (data.queues[e][g]) {
                            data.queues[e][g]()
                        }
                    }
                }
                data.queues[e] = null;
                data.timers[e] = null
            }
        }

        function d(g, e, f) {
            if (!g) {
                return false
            }
            e = e || b.timer_group;
            if (!data.timers[e]) {
                f = f || b.delay;
                data.timers[e] = window.setTimeout(function() {
                    c(e)
                }, f)
            }
            if (!data.queues[e]) {
                data.queues[e] = []
            }
            if (data.queues[e].indexOf) {
                if (data.queues[e].indexOf(g) === -1) {
                    data.queues[e].push(g)
                }
            } else {
                data.queues[e].push(g)
            }
        }
        return {
            method: d
        }
    }()),
    getImgProxyURL: function(c, a, d) {
        if (!c) {
            return c
        }
        if (!TS.boot_data.feature_image_proxy) {
            return c
        }
        if (!TS.boot_data.image_proxy_url) {
            return c
        }
        if (c.match(/^(https|\/\/)/i)) {
            return c
        }
        var e = TS.boot_data.image_proxy_url;
        if (c.indexOf(e) == 0) {
            return c
        }
        var f = TS.qs_args.proxy_breakage || "";
        var b = e + "?url=" + f + encodeURIComponent(c);
        a = parseInt(a);
        d = parseInt(d);
        if (a && d) {
            b += "&width=" + a + "&height=" + d
        }
        return b
    }
});
TS.registerModule("format", {
    testing_with_generic_tokens: false,
    onStart: function() {
        if (TS.client) {
            TS.client.login_sig.add(TS.format.loggedIn, TS.format)
        } else {
            if (TS.web) {
                TS.web.login_sig.add(TS.format.loggedIn, TS.format)
            }
        }
    },
    loggedIn: function() {
        if (TS.model.team.domain == "tinyspeck") {
            TS.format.special_code_rx = TS.format.special_code_rx_ts
        }
    },
    cleanMsg: function(a) {
        if (!a) {
            return ""
        }
        a = a.replace(/\&/g, "&amp;");
        a = a.replace(/\</g, "&lt;");
        a = a.replace(/\>/g, "&gt;");
        a = a.replace(/(^|\s|\(|&gt;|\*|_)(@[\w|.|-]+)/g, function(d, g, f) {
            var e = "";
            var b = f.toLowerCase();
            var c;
            if (b == "@everyone" || b.substr(0, 10) == "@everyone." || b.substr(0, 10) == "@everyone-" || b.substr(0, 10) == "@everyone_") {
                c = "<!everyone>";
                e = b.substr(9)
            } else {
                if (b == "@channel" || b.substr(0, 9) == "@channel." || b.substr(0, 9) == "@channel-" || b.substr(0, 9) == "@channel_") {
                    c = "<!channel>";
                    e = b.substr(8)
                } else {
                    if (b == "@group" || b.substr(0, 7) == "@group." || b.substr(0, 7) == "@group-" || b.substr(0, 7) == "@group_") {
                        c = "<!group>";
                        e = b.substr(6)
                    }
                }
            } if (c) {
                return g + c + e
            }
            var d = TS.members.getMemberByName(f);
            var k = [".", "-", "_"];
            var h;
            var l = 0;
            while (!d && l < k.length) {
                h = k[l];
                if (f && f.substr(f.length - 1, 1) == h) {
                    var j = f.substr(0, f.length - 1);
                    e = h;
                    d = TS.members.getMemberByName(j)
                }
                l++
            }
            if (d) {
                return g + "<@" + d.id + ">" + e
            }
            return g + f
        });
        a = a.replace(/(^|\s|\(|&gt;|\*|_)(#[a-zA-Z0-9\-_]+)/g, function(b, f, e) {
            var j = TS.channels.getChannelByName(e);
            var d = "";
            var k = ["-", "_"];
            var g;
            var l = 0;
            while (!j && l < k.length) {
                g = k[l];
                if (e && e.substr(e.length - 1, 1) == g) {
                    var h = e.substr(0, e.length - 1);
                    d = g;
                    j = TS.channels.getChannelByName(h);
                    if (j) {
                        d = g
                    }
                }
                l++
            }
            if (j) {
                return f + "<#" + j.id + ">" + d;
                return f + "<#" + j.id + "|" + j.name + ">" + d
            }
            return f + e
        });
        if (TS.model.prefs.convert_emoticons) {
            a = TS.format.doEmoticonConversion(a)
        }
        return a
    },
    emoticon_conversion_token_map: [],
    emoticonConversionTokenReplacer: function(a) {
        return TS.format.tokenizeStr(TS.format.emoticon_conversion_token_map, a)
    },
    doEmoticonConversion: function(c) {
        TS.format.emoticon_conversion_token_map.length = 0;
        c = c.replace(TS.format.special_pre_rx, TS.format.emoticonConversionTokenReplacer);
        c = c.replace(TS.format.special_code_rx, TS.format.emoticonConversionTokenReplacer);
        c = c.replace(TS.format.special_quote_rx, TS.format.emoticonConversionTokenReplacer);
        c = emoji.replace_emoticons_with_colons(c);
        for (var a = TS.format.emoticon_conversion_token_map.length - 1; a > -1; a--) {
            var b = TS.format.emoticon_conversion_token_map[a];
            c = c.replace(b.token, b.str.replace(/\$/g, "$$$$"))
        }
        return c
    },
    unFormatMsg: function(b, a) {
        if (!b) {
            return ""
        }
        return TS.format.formatMsg(b, a, false, false, true)
    },
    token_cnt: 0,
    tokenizeStr: function(b, c) {
        if (!c) {
            return ""
        }
        var a = TS.format.encodeSpecialFormattingCharsAndColon("~~~~~~~~~~~~~~~MAGISTERLUDI^^^^^^^^^^^^^^^^^^" + (TS.format.token_cnt++) + TS.utility.date.getTimeStamp());
        b.push({
            str: c,
            token: a
        });
        return a
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
                var B = TS.channels.getChannelById(r);
                if (!B) {
                    B = TS.channels.getChannelByName(r)
                }
                if (B) {
                    if (j || k) {
                        return TS.format.tokenizeStr(b, "#" + B.name)
                    }
                    var z = (TS.client) ? 'target="/archives/' + B.name + '"' : "";
                    if (TS.format.testing_with_generic_tokens) {
                        return TS.format.tokenizeStr(b, TS.format.generic_link_open + "#" + B.name + TS.format.link_close)
                    }
                    return TS.format.tokenizeStr(b, '<a href="/archives/' + B.name + '" ' + z + ' data-channel-name="' + B.name + '" data-channel-id="' + B.id + '" class="internal_channel_link">#' + B.name + TS.format.link_close)
                } else {
                    if (y.length > 1 && y[1]) {
                        return TS.format.tokenizeStr(b, "#" + y[1])
                    } else {
                        if (TS.model.user.is_restricted) {
                            return TS.format.tokenizeStr(b, "#unknown-channel")
                        } else {
                            return TS.format.tokenizeStr(b, "#deleted-channel")
                        }
                    }
                }
            }
            if (u.substr(0, 1) == "@") {
                var t = TS.utility.msgs.getMemberFromMemberMarkup(u);
                if (t) {
                    if (j || k) {
                        return TS.format.tokenizeStr(b, "@" + t.name)
                    }
                    var z = (TS.client) ? 'target="/team/' + t.name + '" ' : "";
                    var G = (l) ? "@" + t.name : TS.format.doHighlighting("@" + t.name);
                    if (TS.format.testing_with_generic_tokens) {
                        return TS.format.tokenizeStr(b, TS.format.generic_link_open + G + TS.format.link_close)
                    }
                    return TS.format.tokenizeStr(b, '<a href="/team/' + t.name + '" ' + z + 'data-member-name="' + t.name + '" class="internal_member_link">' + G + TS.format.link_close)
                } else {
                    return TS.format.tokenizeStr(b, u)
                }
            }
            if (u.substr(0, 1) == "!") {
                var s = u.substr(1);
                if (s) {
                    s = s.split("|")[0]
                }
                if (s == "everyone") {
                    if (j || k) {
                        return TS.format.tokenizeStr(b, "@everyone")
                    }
                    return TS.format.tokenizeStr(b, '<b class="mention_everyone">@everyone</b>')
                } else {
                    if (s == "channel") {
                        if (j || k) {
                            return TS.format.tokenizeStr(b, "@channel")
                        }
                        return TS.format.tokenizeStr(b, '<b class="mention_channel">@channel</b>')
                    } else {
                        if (s == "group") {
                            if (j || k) {
                                return TS.format.tokenizeStr(b, "@group")
                            }
                            return TS.format.tokenizeStr(b, '<b class="mention_group">@group</b>')
                        }
                    }
                }
                return TS.format.tokenizeStr(b, u)
            }
            var E = u.split("|");
            var q = E.shift();
            q = q.replace(/\"/g, "&quot;");
            var D = E.join("|") || q;
            D = $.trim(D);
            if (q.indexOf("<") == 0) {
                return TS.format.tokenizeStr(b, "&lt;" + u.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "&gt;")
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
                D = TS.format.doSpecials(D, d && d._special_debug)
            }
            if (!a && D != q) {
                D = TS.utility.emojiReplace(D)
            }
            if (!l) {
                D = TS.format.doHighlighting(D)
            }
            if (q.indexOf(TS.utility.msgs.api_url_prefix) == 0) {
                if (e) {
                    return TS.format.tokenizeStr(b, "<a onclick=\"TS.utility.msgs.doApiUrl('" + q + '\')" class="api_url">' + D + TS.format.link_close)
                } else {
                    return TS.format.tokenizeStr(b, '<a class="api_url muted">' + D + " (Disabled)" + TS.format.link_close)
                }
            } else {
                if (q.indexOf(TS.utility.msgs.new_api_url_prefix) == 0) {
                    if (e) {
                        return TS.format.tokenizeStr(b, "<a onclick=\"TS.utility.msgs.doNewApiUrl('" + q + '\')" class="api_url">' + D + TS.format.link_close)
                    } else {
                        return TS.format.tokenizeStr(b, '<a class="api_url muted">' + D + " (Disabled)" + TS.format.link_close)
                    }
                } else {
                    if (q.indexOf("javascript:") == 0) {
                        return TS.format.tokenizeStr(b, '<a onclick="' + q.replace("javascript:", "") + '">' + D + TS.format.link_close)
                    } else {
                        if (TS.client && TS.client.core_url && q.indexOf(TS.client.core_url) == 0) {
                            if (TS.format.testing_with_generic_tokens) {
                                return TS.format.tokenizeStr(b, TS.format.generic_link_open + D + TS.format.link_close)
                            }
                            return TS.format.tokenizeStr(b, '<a target="_self" href="' + q + '">' + D + TS.format.link_close)
                        } else {
                            var F = "";
                            var w;
                            if (d && d.ts && n) {
                                w = TS.inline_attachments.getAttachmentByFromUrl(d.attachments, q);
                                if (w) {
                                    if (TS.boot_data.feature_attachments_inline || TS.templates.builders.shouldDoSimpleAttachment(w, d)) {
                                        F = TS.templates.builders.buildAttachmentHTML({
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
                            if (TS.format.testing_with_generic_tokens) {
                                return TS.format.tokenizeStr(b, TS.format.generic_link_open + D + TS.format.link_close + F)
                            }
                            return TS.format.tokenizeStr(b, "<a " + TS.utility.makeRefererSafeLink(q) + ' target="_blank">' + D + TS.format.link_close + F)
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
            TS.format.special_token_map = [];
            if (!g) {
                m = TS.format.doSpecials(m, d && d._special_debug)
            }
            if (n && (!d || d.subtype != "bot_message")) {
                m = m.replace(TS.format.hex_rx, TS.format.hexReplace)
            }
            if (!a) {
                m = TS.utility.emojiReplace(m)
            }
            for (var f = TS.format.special_token_map.length - 1; f > -1; f--) {
                var p = TS.format.special_token_map[f];
                m = m.replace(p.token, p.str.replace(/\$/g, "$$$$"))
            }
            TS.format.special_token_map = null;
            if (!l) {
                m = TS.format.doHighlighting(m)
            }
            m = m.replace(/\/div>\n/g, "/div>");
            m = m.replace(/codecopyonly> /g, "codecopyonly>&nbsp;");
            m = m.replace(/ <span class="codecopyonly/g, '&nbsp;<span class="codecopyonly');
            m = m.replace(/&nbsp;&nbsp;/g, " &nbsp;");
            m = m.replace(/\n\r\n\r/g, '<span class="para_break"><i class="copy_only">' + TS.format.line_break + "</i></span>");
            m = m.replace(/\n\r\n/g, '<span class="para_break"><i class="copy_only">' + TS.format.line_break + "</i></span>");
            m = m.replace(/\n\n/g, '<span class="para_break"><i class="copy_only">' + TS.format.line_break + "</i></span>");
            m = m.replace(/\n/g, TS.format.line_break);
            m = m.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
            m = m.replace(/  /g, " &nbsp;");
            m = m.replace(/^ /g, "&nbsp;")
        }
        for (var f = 0; f < b.length; f++) {
            var p = b[f];
            m = m.replace(p.token, p.str.replace(/\$/g, "$$$$"))
        }
        return m
    },
    hex_rx: /(\W|^)(#[A-Fa-f0-9]{6})(\b)/g,
    hexReplace: function(b, c, a, d) {
        return c + a + ' <div class="inline_color_block" style="background:' + a + ';"></div>' + d
    },
    special_i_rx: /(^|\s|[\?\.,\-!\^;:{(\[%$#+="])\_(.*?\S *)?\_(?=$|\s|[\?\.,\-!\^;:})\]%$#+=â€?])/g,
    special_b_rx: /(^|\s|[\?\.,\-!\^;:{(\[%$#+="])\*(.*?\S *)?\*(?=$|\s|[\?\.,\-!\^;:})\]%$#+=â€?])/g,
    special_code_rx: /(^|\s|[\?\.,\-!\^;:{(\[%$#+="])\`(.*?\S *)?\`(?=$|\s|[\?\.,\-!\^;:})\]%$#+=â€?])/g,
    special_code_rx_ts: /(^|\s|[\?\.,\-!\^;:{(\[%$#+="])\`(.*?\S *)?\`/g,
    special_pre_rx: /(^|\s|[\?\.,\-!\^;:{(\[%$#+="])```([\s\S]+)?```(?=$|\s|[\?\.,\-!\^;:})\]%$#+=â€?])/g,
    special_quote_rx: /(^|\n)&gt;(([^\n]*)(\n&gt;[^\n]*)*)/g,
    special_3_quote_rx: /(^|\n)&gt;&gt;&gt;([\s\S]*$)/,
    special_quote_prefix: '<span class="copyonly">&gt;</span>',
    special_i_open: '<i><span class="copyonly">&#95;</span>',
    special_i_close: '<span class="copyonly">&#95;</span></i>',
    special_b_open: '<b><span class="copyonly">&ast;</span>',
    special_b_close: '<span class="copyonly">&ast;</span></b>',
    special_pre_open: '<pre class="special_formatting"><span class="copyonly">&#96;&#96;&#96;</span>',
    special_pre_close: '<span class="copyonly">&#96;&#96;&#96;</span></pre>',
    special_code_open: '<code><span class="copyonly">&#96;</span codecopyonly>',
    special_code_close: '<span class="codecopyonly copyonly">&#96;</span></code>',
    special_quote_open: '<div class="special_formatting_quote"><div class="quote_bar"><div class="shim"></div></div><div class="content dynamic_content_max_width">',
    special_quote_close: "</div></div>",
    line_break: "<br>",
    hard_space: "&nbsp;",
    generic_link_open: "<a>",
    link_close: "</a>",
    specialPreReplace: function(b, a, c) {
        if (c && c.length && c.substr(0, 1) == "\n") {
            c = c.substr(1)
        }
        if (TS.format.special_token_map) {
            c = TS.format.encodeForPre(c);
            return a + TS.format.special_pre_open + TS.format.tokenizeStr(TS.format.special_token_map, c) + TS.format.special_pre_close
        }
        c = TS.format.encodeSpecialFormattingCharsAndMoreForPre(c);
        return a + TS.format.special_pre_open + (c) + TS.format.special_pre_close
    },
    specialCodeReplace: function(b, a, c) {
        if (TS.format.log_specials) {
            TS.warn('match in specialCodeReplace:\n"' + b + '"')
        }
        if (!c || c.substr(0, 1) == "`" || c.substr(c.length - 1, 1) == "`") {
            return b
        }
        if (TS.format.special_token_map) {
            return a + TS.format.special_code_open + TS.format.tokenizeStr(TS.format.special_token_map, c) + TS.format.special_code_close
        }
        c = TS.format.encodeSpecialFormattingCharsAndColon(c);
        return a + TS.format.special_code_open + c + TS.format.special_code_close
    },
    specialItalicReplace: function(b, a, c) {
        if (TS.format.log_specials) {
            TS.warn('match in specialItalicReplace:\n"' + b + '"')
        }
        if (!c || !c.match(/[^_*`]/) || c.substr(0, 1) == "_" || c.substr(c.length - 1, 1) == "_") {
            return b
        }
        return a + TS.format.special_i_open + TS.format.doSpecials(c) + TS.format.special_i_close
    },
    specialBoldReplace: function(b, a, c) {
        if (!c || !c.match(/[^_*`]/) || c.substr(0, 1) == "*" || c.substr(c.length - 1, 1) == "*" || (c.substr(0, 1) == " " && c.substr(c.length - 1, 1) == " ")) {
            return b
        }
        return a + TS.format.special_b_open + TS.format.doSpecials(c) + TS.format.special_b_close
    },
    specialQuoteReplace: function(b, a, d, c) {
        d = d.replace(/\n&gt;/g, "\n" + TS.format.special_quote_prefix);
        return TS.format.special_quote_open + TS.format.special_quote_prefix + d + TS.format.special_quote_close
    },
    special3QuoteReplace: function(b, a, c) {
        if (b == "&gt;&gt;&gt;") {
            return "&gt;&gt;&gt;"
        }
        c = c.replace(/^([\s]*)(&gt;)*/g, function(d, f, e, h, g) {
            if (e) {
                return d
            }
            return ""
        });
        return TS.format.special_quote_open + '<span class="copyonly">&gt;&gt;&gt;</span>' + c + TS.format.special_quote_close
    },
    log_specials: false,
    doSpecials: function(b, a) {
        b = b || "";
        if (a) {
            TS.info("debugging specials for text:::::::::::::::::::::\n" + b);
            TS.format.log_specials = true
        }
        b = b.replace(TS.format.special_pre_rx, TS.format.specialPreReplace);
        b = b.replace(TS.format.special_code_rx, TS.format.specialCodeReplace);
        b = b.replace(TS.format.special_i_rx, TS.format.specialItalicReplace);
        b = b.replace(TS.format.special_b_rx, TS.format.specialBoldReplace);
        b = b.replace(TS.format.special_3_quote_rx, TS.format.special3QuoteReplace);
        b = b.replace(TS.format.special_quote_rx, TS.format.specialQuoteReplace);
        TS.format.log_specials = false;
        return b
    },
    doHighlighting: function(b) {
        var g;
        var f;
        var a = TS.model.highlight_words.concat();
        a.sort(function e(j, h) {
            var k = j.length;
            var l = h.length;
            if (k < l) {
                return 1
            }
            if (k > l) {
                return -1
            }
            return 0
        });
        for (var c = 0; c < a.length; c++) {
            g = TS.utility.regexpEscape(a[c]);
            if (g == "don") {
                g += "(?!'t)"
            }
            f = new RegExp("(\\b|_)(" + g + ")(\\b|_)", "ig");
            var d = 0;
            b = b.replace(f, function(j, k, h, p, o, n) {
                if (n.substr(0, o).match(/</)) {
                    for (var l = o; l >= d; l--) {
                        if (n.charAt(l) == "<") {
                            return k + h + p
                        }
                        if (n.charAt(l) == ">") {
                            break
                        }
                    }
                }
                d = o + j.length;
                return k + '<span class="mention">' + h + "</span>" + p
            })
        }
        return b
    },
    encodeSpecialFormattingChars: function(a) {
        a = a || "";
        return a.replace(/\*/g, "&ast;").replace(/\_/g, "&#95;").replace(/\`/g, "&#96;")
    },
    encodeSpecialFormattingCharsAndColon: function(a) {
        a = a || "";
        return TS.format.encodeSpecialFormattingChars(a).replace(/\:/g, "&#58;")
    },
    encodeSpecialFormattingCharsAndMoreForPre: function(a) {
        a = a || "";
        return TS.format.encodeForPre(TS.format.encodeSpecialFormattingCharsAndColon(a))
    },
    encodeForPre: function(a) {
        a = a || "";
        return a.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, TS.format.line_break)
    }
});
TS.registerModule("emoji_menu", {
    active_emoji_group: null,
    default_emoji_group: "grinning",
    $emoji_menu: null,
    $emoji_menu_header: null,
    $emoji_menu_items_div: null,
    $emoji_menu_footer: null,
    channel: null,
    member: null,
    is_showing: false,
    input_selector: "#message-input",
    input_selector_default: "#message-input",
    onStart: function() {
        $("#client-ui").append(TS.templates.emoji_menu());
        var b = TS.emoji_menu.$emoji_menu = $("#emoji_menu");
        if (TS.qs_args.new_scroll != "0") {
            var a = TS.qs_args.debug_scroll == "1";
            b.find("#emoji_menu_items_scroller").monkeyScroll({
                debug: a
            })
        }
        TS.emoji_menu.$emoji_menu_header = b.find("#emoji_menu_header");
        TS.emoji_menu.$emoji_menu_items_div = b.find("#emoji_menu_items_div");
        TS.emoji_menu.$emoji_menu_footer = b.find("#emoji_menu_footer");
        b.detach()
    },
    slow_emo: null,
    slow_emo_threshold: 1000,
    startEmo: function(f, h) {
        if (TS.emoji_menu.is_showing) {
            TS.emoji_menu.end();
            return
        }
        if (h) {
            TS.emoji_menu.input_selector = h
        }
        if (TS.view.input_el.prop("disabled")) {
            return
        }
        var g = new Date();
        TS.emoji_menu.clean();
        var b = TS.emoji_menu.$emoji_menu;
        var d = ":smile:";
        TS.emoji_menu.active_emoji_group = TS.emoji_menu.active_emoji_group || TS.emoji_menu.default_emoji_group;
        TS.emoji_menu.$emoji_menu_header.html(TS.templates.emoji_header({
            emoticon_groups: TS.ui.emoticon_groups,
            active_group: TS.emoji_menu.active_emoji_group
        }));
        TS.emoji_menu.$emoji_menu_footer.html('<span id="emoticon_preview">' + TS.utility.emojiGraphicReplace(d) + '</span><div class=" overflow-ellipsis float-left"><span id="emoji_title">Emoji Deluxe</span><br /><span id="emoticon_name">' + d + "</span></div>");
        var a = TS.templates.menu_emoticons({
            emoticon_groups: TS.ui.emoticon_groups,
            active_group: TS.emoji_menu.active_emoji_group
        }) + '<div id="emoji_tip"><i class="fa fa-info-circle"></i> &nbsp;Type <b>":"</b> and hit TAB key for autocomplete<br>';
        if (!TS.model.user.is_restricted) {
            if (!TS.model.team.prefs.emoji_only_admins || TS.model.user.is_admin) {
                a += '<i class="fa fa-plus"></i> &nbsp;You can <a href="/admin/emoji" target="_blank">add custom emoji here</a>'
            }
        }
        a += "</div>";
        TS.emoji_menu.$emoji_menu_items_div.html(a);
        TS.emoji_menu.$emoji_menu_items_div.find(".emoticon_group_ul").find("a").bind("click.emoji_menu", TS.emoji_menu.onEmoClick);
        TS.emoji_menu.$emoji_menu_items_div.find(".emoticon_group_ul").find("a").hover(function() {
            var e = $(this).data("name");
            var j = $(this).data("names");
            $("#emoticon_preview").html(TS.utility.emojiGraphicReplace(e));
            $("#emoticon_name").html(j)
        }, function() {});
        TS.emoji_menu.$emoji_menu_header.find("a.emoji_grouping_tab").bind("click.emoji_menu", function(j) {
            $this = $(this);
            TS.emoji_menu.active_emoji_group = $this.data("group-name");
            $(".emoticon_group_ul").addClass("hidden");
            $("#emoticon_group_ul_" + TS.emoji_menu.active_emoji_group).removeClass("hidden");
            b.find("#emoji_menu_items_scroller").data("monkeyScroll").updateFunc();
            $(".emoji_grouping_tab").removeClass("active");
            $this.addClass("active")
        });
        TS.emoji_menu.start(f, false);
        var c = new Date() - g;
        if (c > TS.emoji_menu.slow_emo_threshold && !TS.emoji_menu.slow_emo) {
            TS.emoji_menu.slow_emo = true;
            TS.logError({
                message: "TS.emoji_menu.startEmo() > " + TS.emoji_menu.slow_emo_threshold + " ms"
            }, " startEmo() took " + c + " ms. localStorage = " + (TS.model.prefs.ls_disabled ? 0 : 1))
        }
    },
    onEmoClick: function() {
        var c = TS.emoji_menu.input_selector;
        var f = $(this).data("icon");
        var e = TS.utility.getCursorPosition(c);
        var d = e + f.length;
        var b = $(c).val();
        var a = b.substr(0, e) + f + b.substr(e);
        $(c).val(a).trigger("autosize");
        TS.utility.setCursorPosition(c, d)
    },
    start: function(d, b) {
        var c = TS.emoji_menu.$emoji_menu;
        c.appendTo($("#client-ui"));
        c.find("#emoji_menu_items_scroller").scrollTop(0);
        if (c.find("#emoji_menu_items_scroller").data("monkeyScroll")) {
            c.find("#emoji_menu_items_scroller").data("monkeyScroll").updateFunc()
        }
        var f = $(d.target).offset();
        var a = f.left;
        var g = f.top - (c.outerHeight() + 10);
        if (b) {
            a = d.pageX + 10;
            g = d.pageY + 10
        }
        TS.emoji_menu.is_showing = true;
        c.css({
            top: g,
            left: a
        });
        c.find("#emoji_menu_items_scroller").scrollTop(0);
        if (c.find("#emoji_menu_items_scroller").data("monkeyScroll")) {
            c.find("#emoji_menu_items_scroller").data("monkeyScroll").updateFunc()
        }
        TS.emoji_menu.keepInBounds();
        $(window).bind("resize", TS.emoji_menu.keepInBounds);
        $(window.document).bind("keydown", TS.emoji_menu.onKeyDown);
        $("html").bind("mousedown", TS.emoji_menu.onMouseDown);
        c.css("opacity", 0);
        c.stop().transition({
            opacity: 1,
            delay: 100
        }, 300)
    },
    clean: function() {
        TS.emoji_menu.$emoji_menu_footer.empty()
    },
    end: function() {
        TS.emoji_menu.is_showing = false;
        var a = TS.emoji_menu.$emoji_menu;
        a.stop().transition({
            opacity: 0
        }, 200, function() {
            a.detach();
            TS.emoji_menu.clean()
        });
        TS.emoji_menu.member = null;
        TS.emoji_menu.channel = null;
        TS.emoji_menu.input_selector = TS.emoji_menu.input_selector_default;
        $(window).unbind("resize", TS.emoji_menu.keepInBounds);
        $(window.document).unbind("keydown", TS.emoji_menu.onKeyDown);
        $("html").unbind("mousedown", TS.emoji_menu.onMouseDown)
    },
    onKeyDown: function(a) {
        if (a.which == TS.utility.keymap.esc || a.which == TS.utility.keymap.enter || a.which == TS.utility.keymap.tab || (a.which == TS.utility.keymap.semicolon && a.shiftKey)) {
            TS.emoji_menu.end();
            a.preventDefault()
        }
    },
    onMouseDown: function(a) {
        if ($(a.target).closest("#emoji_menu").length == 0 && $(a.target).closest("#message-form").length == 0) {
            TS.emoji_menu.end()
        }
    },
    keepInBounds: function() {
        var c = TS.emoji_menu.$emoji_menu;
        var b = 10;
        var d = c.dimensions_rect();
        var a = {
            top: 0 + b,
            right: $(window).width() - b,
            bottom: $(window).height() - (b + 14),
            left: 0 + b
        };
        if (TS.utility.doesRectContainRect(a, d)) {
            return
        }
        if (d.left < a.left) {
            c.css("left", a.left)
        } else {
            if (d.right > a.right) {
                c.css("left", Math.max(a.left, a.right - c.width()))
            }
        } if (d.top < a.top) {
            c.css("top", a.top)
        } else {
            if (d.bottom > a.bottom) {
                c.css("top", Math.max(a.top, a.bottom - c.height()))
            }
        }
    }
});
(function() {
    TS.registerModule("menu", {
        $menu: null,
        $menu_header: null,
        $menu_items: null,
        $menu_footer: null,
        menu_lazy_load: null,
        channel: null,
        member: null,
        end_tim: 0,
        onStart: function() {
            if (TS.client) {
                $("#client-ui").append(TS.templates.menu())
            } else {
                $("body").append(TS.templates.menu())
            }
            var c = TS.menu.$menu = $("#menu");
            if (TS.boot_data.app != "mobile" && TS.qs_args.new_scroll != "0") {
                var b = TS.qs_args.debug_scroll == "1";
                c.find("#menu_items_scroller").monkeyScroll({
                    debug: b
                })
            }
            TS.menu.$menu_header = c.find("#menu_header");
            TS.menu.$menu_items = c.find("#menu_items");
            TS.menu.$menu_footer = c.find("#menu_footer");
            c.detach()
        },
        startWithChannel: function(h, c) {
            if (TS.menu.isRedundantClick(h)) {
                return
            }
            if (TS.ui.checkForEditing(h)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var f = TS.menu.$menu;
            var g = TS.menu.channel = TS.channels.getChannelById(c);
            TS.menu.$menu.addClass("headless");
            TS.menu.$menu_header.addClass("hidden").empty();
            var j = {
                channel: g,
                user: TS.model.user
            };
            if (g.purpose.last_set == 0 && !TS.model.user.is_ultra_restricted) {
                j.show_purpose_item = true
            }
            var b = TS.channels.makeMembersWithPreselectsForTemplate(TS.channels.getActiveMembersNotInThisChannelForInviting(c));
            if (b.length == 0) {
                j.disable_invite = true
            }
            TS.menu.$menu_items.html(TS.templates.menu_channel_items(j));
            TS.menu.$menu_footer.html(TS.templates.menu_channel_footer({
                channel: g,
                user: TS.model.user,
                show_topic: !TS.model.user.is_restricted && (!g.is_general || TS.members.canUserPostInGeneral())
            }));
            TS.menu.$menu_header.bind("click.menu", TS.menu.onChannelHeaderClick);
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onChannelItemClick);
            TS.kb_nav.setSubmitItemHandler(TS.menu.onChannelItemClick);
            TS.menu.start(h);
            var d = TS.utility.keymap;
            $("#menu_channel_topic_input").bind("keydown", function(l) {
                var k = $(this);
                if (l.which == d.enter && !l.shiftKey) {
                    TS.channels.setTopic(c, $.trim(k.val()));
                    TS.menu.end()
                }
            });
            TS.menu.positionAt($("#active_channel_name .name"), 24, 47);
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
                TS.menu.end();
                return
            }
            if (c == "channel_join_item") {
                b.preventDefault();
                TS.channels.displayChannel(TS.menu.channel.id)
            } else {
                if (c == "channel_display_item") {
                    b.preventDefault();
                    TS.channels.displayChannel(TS.menu.channel.id)
                } else {
                    if (c == "channel_close_archived_item") {
                        b.preventDefault();
                        TS.channels.closeArchivedChannel(TS.menu.channel.id)
                    } else {
                        if (c == "channel_leave_item") {
                            b.preventDefault();
                            TS.channels.leave(TS.menu.channel.id)
                        } else {
                            if (c == "channel_links_item") {} else {
                                if (c == "channel_star_item") {
                                    b.preventDefault();
                                    TS.stars.checkForStarClick(b)
                                } else {
                                    if (c == "channel_advanced_item") {
                                        b.preventDefault();
                                        TS.ui.channel_options_dialog.start(TS.menu.channel.id)
                                    } else {
                                        if (c == "channel_unarchive_item") {
                                            b.preventDefault();
                                            TS.api.call("channels.unarchive", {
                                                channel: TS.menu.channel.id
                                            }, function(e, f, d) {
                                                if (e) {
                                                    return
                                                }
                                                var g = 'Un-archiving failed with error "' + f.error + '"';
                                                if (f.error == "restricted_action") {
                                                    g = "<p>You don't have permission to un-archive channels.</p><p>Talk to your team owner.</p>"
                                                }
                                                setTimeout(TS.generic_dialog.alert, 100, g)
                                            })
                                        } else {
                                            if (c == "channel_archives_item") {} else {
                                                if (c == "channel_rename_item") {
                                                    b.preventDefault();
                                                    TS.ui.channel_create_dialog.start(TS.menu.channel.name, TS.menu.channel)
                                                } else {
                                                    if (c == "channel_purpose_item") {
                                                        b.preventDefault();
                                                        TS.ui.purpose_dialog.start(TS.menu.channel.name, TS.menu.channel)
                                                    } else {
                                                        if (c == "channel_invite_item") {
                                                            b.preventDefault();
                                                            TS.ui.invite.showInviteMembersFromChannelDialog(TS.menu.channel.id)
                                                        } else {
                                                            if (c == "channel_prefs") {
                                                                b.preventDefault();
                                                                TS.ui.channel_prefs_dialog.start(TS.menu.channel.id)
                                                            } else {
                                                                if (c == "channel_add_service_item") {} else {
                                                                    TS.warn("not sure what to do with clicked element id:" + c);
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
            TS.menu.end()
        },
        startWithGroup: function(h, f) {
            if (TS.menu.isRedundantClick(h)) {
                return
            }
            if (TS.ui.checkForEditing(h)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var d = TS.menu.$menu;
            var g = TS.menu.group = TS.groups.getGroupById(f);
            TS.menu.$menu_header.addClass("hidden").empty();
            var j = {
                group: g,
                user: TS.model.user
            };
            if (g.purpose.last_set == 0 && !TS.model.user.is_ultra_restricted) {
                j.show_purpose_item = true
            }
            var b = TS.channels.makeMembersWithPreselectsForTemplate(TS.groups.getActiveMembersNotInThisGroupForInviting(f));
            if (b.length == 0) {
                j.disable_invite = true
            }
            if (TS.model.user.is_restricted && !TS.model.user.is_ultra_restricted && TS.groups.canLeaveGroup(f)) {
                j.ra_can_leave = true
            }
            TS.menu.$menu_items.html(TS.templates.menu_group_items(j));
            TS.menu.$menu_footer.html(TS.templates.menu_group_footer({
                group: g,
                user: TS.model.user
            }));
            TS.menu.$menu_header.bind("click.menu", TS.menu.onGroupHeaderClick);
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onGroupItemClick);
            TS.menu.start(h);
            var c = TS.utility.keymap;
            $("#menu_group_topic_input").bind("keydown", function(l) {
                var k = $(this);
                if (l.which == c.enter && !l.shiftKey) {
                    TS.groups.setTopic(f, $.trim(k.val()));
                    TS.menu.end()
                }
            });
            TS.menu.positionAt($("#active_channel_name .name"), 24, 53);
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
                TS.menu.end();
                return
            }
            if (d == "group_display_item") {
                c.preventDefault();
                TS.groups.displayGroup(TS.menu.group.id)
            } else {
                if (d == "group_leave_item") {
                    c.preventDefault();
                    TS.groups.leave(TS.menu.group.id)
                } else {
                    if (d == "group_links_item") {} else {
                        if (d == "group_star_item") {
                            c.preventDefault();
                            TS.stars.checkForStarClick(c)
                        } else {
                            if (d == "group_close_item") {
                                c.preventDefault();
                                TS.groups.closeGroup(TS.menu.group.id)
                            } else {
                                if (d == "group_leave_and_archive_item") {
                                    c.preventDefault();
                                    var b = TS.menu.group;
                                    TS.generic_dialog.start({
                                        title: "Leave and archive " + TS.model.group_prefix + b.name,
                                        body: "<p>If you archive this group, no one will be able to send any messages in it and it will be closed for anyone who currently has it open. You will still be able to view the archives on the site and you will still be able to search for messages from this group.</p><p>Are you sure you want to archive <b>" + TS.model.group_prefix + b.name + "</b>?</p>",
                                        go_button_text: "Yes, leave & archive the group",
                                        on_go: function() {
                                            TS.api.call("groups.archive", {
                                                channel: b.id
                                            }, function(f, g, e) {
                                                if (f) {
                                                    TS.groups.closeGroup(b.id);
                                                    return
                                                }
                                                var h = 'Archiving failed with error "' + g.error + '"';
                                                if (g.error == "last_ra_channel") {
                                                    if (TS.model.user.is_admin) {
                                                        h = "Sorry, you can't archive this group because it is the only group or channel one of the guest account members belongs to. If you first disable the guest account, you will then be able to archive the group."
                                                    } else {
                                                        h = "Sorry, you can't archive this group because it is the only group or channel one of the guest account members belongs to."
                                                    }
                                                }
                                                TS.generic_dialog.alert(h)
                                            })
                                        }
                                    })
                                } else {
                                    if (d == "group_unarchive_item") {
                                        c.preventDefault();
                                        TS.api.call("groups.unarchive", {
                                            channel: TS.menu.group.id
                                        })
                                    } else {
                                        if (d == "group_archives_item") {} else {
                                            if (d == "group_advanced_item") {
                                                c.preventDefault();
                                                TS.ui.channel_options_dialog.start(TS.menu.group.id)
                                            } else {
                                                if (d == "group_purpose_item") {
                                                    c.preventDefault();
                                                    TS.ui.purpose_dialog.start(TS.menu.group.name, TS.menu.group)
                                                } else {
                                                    if (d == "group_invite_item") {
                                                        c.preventDefault();
                                                        TS.ui.invite.showInviteMembersFromGroupDialog(TS.menu.group.id)
                                                    } else {
                                                        if (d == "group_prefs") {
                                                            c.preventDefault();
                                                            TS.ui.channel_prefs_dialog.start(TS.menu.group.id)
                                                        } else {
                                                            if (d == "group_add_service_item") {} else {
                                                                TS.warn("not sure what to do with clicked element id:" + d);
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
            TS.menu.end()
        },
        startWithGroups: function(g) {
            if (TS.menu.isRedundantClick(g)) {
                return
            }
            if (TS.ui.checkForEditing(g)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var h = [];
            var d = 0;
            var f;
            for (var b = 0; b < TS.model.groups.length; b++) {
                f = TS.model.groups[b];
                if (f.is_archived) {
                    d++;
                    continue
                }
                if (TS.model.prefs.sidebar_behavior == "hide_read_channels") {
                    if (f.unread_cnt) {
                        continue
                    }
                    h.push(f)
                } else {
                    if (TS.model.prefs.sidebar_behavior == "hide_read_channels_unless_starred") {
                        if (f.unread_cnt || f.is_starred) {
                            continue
                        }
                        h.push(f)
                    } else {
                        h.push(f)
                    }
                }
            }
            var c = TS.menu.$menu;
            TS.menu.$menu_header.html(TS.templates.menu_groups_header());
            TS.menu.$menu_items.html(TS.templates.menu_groups_items({
                nondisplayed_groups: h,
                show_archived_item: d,
                user: TS.model.user
            }));
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onGroupsItemClick);
            TS.menu.start(g)
        },
        onGroupsItemClick: function(c) {
            var d = $(this).attr("id");
            if (d == "new_group_item") {
                TS.menu.onNewGroupClick(c)
            } else {
                if (d == "groups_archives_item") {} else {
                    if (d == "about_groups_item") {
                        c.preventDefault();
                        TS.tip_card.start({
                            tip: TS.tips.getTipById("about_groups_tip_card")
                        })
                    } else {
                        c.preventDefault();
                        var b = $(this).data("group-id");
                        if (b) {
                            TS.groups.displayGroup(b)
                        }
                    }
                }
            }
            TS.menu.end()
        },
        onNewGroupClick: function(b) {
            b.preventDefault();
            TS.ui.group_create_dialog.start();
            TS.menu.end()
        },
        startWithNewFileOptions: function(f, d) {
            if (TS.menu.isRedundantClick(f)) {
                return
            }
            if (TS.ui.checkForEditing(f)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var c = TS.menu.$menu;
            TS.menu.$menu.addClass("headless footless");
            TS.menu.$menu_header.addClass("hidden").empty();
            var b = '			<li data-which="choose" class="file_menu_item"><a><i class="file_menu_icon file"></i> Upload a file</a></li>			<li data-which="snippet" class="file_menu_item"><a target="_blank" href="/files/create/snippet"><i class="file_menu_icon snippet"></i> Create a text snippet</a></li>		';
            b += '<li data-which="post" class="file_menu_item"><a target="_blank" href="/files/create/post"><i class="file_menu_icon post"></i> Create a post</a></li>';
            if (window.Dropbox && Dropbox.isBrowserSupported() && TS.model.prefs.dropbox_enabled) {
                b += '<li data-which="dropbox" class="file_menu_item"><a><i class="file_menu_icon dropbox"></i> Import from Dropbox</a></li>'
            }
            TS.menu.$menu_items.html(b);
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onNewFileOptionsItemClick);
            TS.kb_nav.setSubmitItemHandler(TS.menu.onNewFileOptionsItemClick);
            TS.menu.start(f);
            if (d.attr("id") == "primary_file_button") {
                TS.menu.positionAt(d, 1, -(TS.menu.$menu.height() + 2))
            } else {
                TS.menu.positionAt(d, d.width() - TS.menu.$menu.width(), d.height())
            }
        },
        onNewFileOptionsItemClick: function(b) {
            var c = $(this).data("which");
            if (c == "choose") {
                b.preventDefault();
                $("#file-upload").trigger("click")
            } else {
                if (c == "snippet") {
                    b.preventDefault();
                    TS.ui.startSnippetFromChatInput()
                } else {
                    if (c == "post") {} else {
                        if (c == "dropbox") {
                            b.preventDefault();
                            TS.files.openDropboxChooser()
                        } else {
                            b.preventDefault();
                            TS.warn("not sure what to do with clicked element id:" + id)
                        }
                    }
                }
            }
            TS.menu.end()
        },
        startWithMember: function(k, g, j, l, d) {
            if (TS.menu.isRedundantClick(k)) {
                return
            }
            if (TS.ui.checkForEditing(k)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var b = TS.menu.$menu;
            var f = TS.menu.member = TS.members.getMemberById(g);
            var m = {
                member: f,
                show_dm_item: !d
            };
            if (d) {
                TS.menu.$menu_header.addClass("hidden").empty();
                m.im = TS.ims.getImByMemberId(g)
            } else {
                TS.menu.$menu_header.html(TS.templates.menu_member_header(m))
            } if (l && g == TS.model.user.id) {
                m.other_accounts = TS.boot_data.other_accounts;
                m.logout_url = TS.boot_data.logout_url;
                m.signin_url = TS.boot_data.signin_url
            }
            if (!f.deleted && !f.is_slackbot && g != TS.model.user.id) {
                if (!TS.model.user.is_ultra_restricted && !f.is_ultra_restricted) {
                    var n = TS.members.getMyChannelsThatThisMemberIsNotIn(g);
                    if (n.length) {
                        m.show_channel_invite = true
                    }
                    m.show_group_create = true;
                    if (TS.model.allow_invite_to_group_from_person) {
                        m.show_group_invite = true
                    }
                }
            }
            var c = TS.shared.getActiveModelOb();
            if (TS.model.active_channel_id || TS.model.active_group_id) {
                if ((!c.is_general || f.is_restricted) && g != TS.model.user.id && c.members && c.members.indexOf(g) != -1) {
                    if (!f.is_ultra_restricted) {
                        if ((c.is_group && TS.members.canUserKickFromGroups()) || (c.is_channel && TS.members.canUserKickFromChannels())) {
                            m.channel_kick_name = (TS.model.active_channel_id ? "#" : "") + c.name
                        }
                    }
                }
            }
            if (g == "USLACKBOT") {
                var o = false;
                if (TS.model.user.is_admin) {
                    o = true
                } else {
                    if (!TS.model.team.prefs.slackbot_responses_disabled && !TS.model.team.prefs.slackbot_responses_only_admins) {
                        o = true
                    }
                }
                m.show_slackbot_responses_item = o
            }
            TS.menu.$menu_items.html(TS.templates.menu_member_items(m));
            if (g == TS.model.user.id) {
                TS.menu.$menu_footer.html(TS.templates.menu_user_footer({
                    user: f
                }));
                TS.menu.$menu.addClass("footless")
            } else {
                if (!d) {
                    TS.menu.$menu_footer.html(TS.templates.menu_member_footer({
                        member: f
                    }))
                }
            }
            TS.menu.start(k, j);
            var h = TS.utility.keymap;
            $("#menu_member_dm_input").bind("keydown", function(q) {
                var p = $(this);
                if (q.which == h.enter && !q.shiftKey) {
                    if ($.trim(p.val()) != "") {
                        q.preventDefault();
                        TS.ims.startImByMemberId(f.id, false, p.val());
                        TS.menu.end()
                    }
                }
            });
            TS.menu.$menu_header.bind("click.menu", TS.menu.onMemberHeaderClick);
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onMemberItemClick);
            TS.kb_nav.setSubmitItemHandler(TS.menu.onMemberItemClick);
            if (d) {
                TS.menu.positionAt($("#active_channel_name .name"), 24, 47)
            }
            $("#menu_user_status_input").select();
            TS.menu.keepInBounds()
        },
        onMemberHeaderClick: function(b) {
            b.preventDefault();
            TS.ui.previewMember(TS.menu.member.id);
            TS.menu.end()
        },
        onMemberItemClick: function(c) {
            var d = $(this).attr("id");
            clearTimeout(TS.menu.end_tim);
            if (d == "member_photo_item") {} else {
                if (d == "member_archives_item") {} else {
                    if (d == "member_links_item") {} else {
                        if (d == "member_star_item") {
                            c.preventDefault();
                            TS.stars.checkForStarClick(c)
                        } else {
                            if (d == "member_skype_item") {} else {
                                if (d == "member_account_item") {} else {
                                    if (d == "member_prefs_item") {
                                        c.preventDefault();
                                        TS.ui.prefs_dialog.start()
                                    } else {
                                        if (d == "member_files_item") {
                                            c.preventDefault();
                                            TS.view.fileClearFilter();
                                            TS.ui.filterFileList(TS.menu.member.id)
                                        } else {
                                            if (d == "member_dm_item") {
                                                c.preventDefault();
                                                TS.ims.startImByMemberId(TS.menu.member.id)
                                            } else {
                                                if (d == "member_invite_channel_item") {
                                                    c.preventDefault();
                                                    TS.ui.invite.showInviteMemberToChannelDialog(TS.menu.member.id)
                                                } else {
                                                    if (d == "member_invite_group_item") {
                                                        c.preventDefault();
                                                        TS.ui.invite.showInviteMemberToGroupDialog(TS.menu.member.id)
                                                    } else {
                                                        if (d == "member_create_group_item") {
                                                            c.preventDefault();
                                                            TS.ui.group_create_dialog.startWithMember(TS.menu.member.id)
                                                        } else {
                                                            if (d == "member_profile_item") {
                                                                c.preventDefault();
                                                                TS.ui.previewMember(TS.menu.member.id)
                                                            } else {
                                                                if (d == "member_presence") {
                                                                    c.preventDefault();
                                                                    TS.members.toggleUserPresence();
                                                                    TS.menu.end_tim = setTimeout(function() {
                                                                        TS.menu.end()
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
                                                                                if (TS.model.active_channel_id) {
                                                                                    TS.channels.kickMember(TS.model.active_channel_id, TS.menu.member.id)
                                                                                } else {
                                                                                    if (TS.model.active_group_id) {
                                                                                        TS.groups.kickMember(TS.model.active_group_id, TS.menu.member.id)
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                if (d == "member_slackbot_responses") {} else {
                                                                                    c.preventDefault();
                                                                                    TS.warn("not sure what to do with clicked element id:" + d);
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
            TS.menu.end()
        },
        startWithMembers: function(f) {
            if (TS.menu.isRedundantClick(f)) {
                return
            }
            if (TS.ui.checkForEditing(f)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var c = TS.menu.$menu;
            var b = false;
            var d = TS.members.getActiveMembersWithSlackbotAndNotSelf();
            if (d.length > 5) {
                b = true
            }
            TS.menu.$menu_header.html(TS.templates.menu_members_header({
                show_filter: b
            }));
            TS.menu.$menu_items.html(TS.templates.menu_members_items({
                members: d
            }));
            TS.menu.$menu_footer.html(TS.templates.menu_members_footer());
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onMembersItemClick);
            TS.menu.start(f);
            $("#about_dms_link").on("click", function(g) {
                g.preventDefault();
                TS.menu.end();
                TS.tip_card.start({
                    tip: TS.tips.getTipById("about_dms_tip_card")
                })
            });
            if (b) {
                TS.members.view.bindTeamFilter("#dms_filter", "#menu_items_scroller");
                $("#dms_filter").find(".member_filter").focus();
                TS.members.view.team_filter_changed_sig.add(TS.kb_nav.clearHighlightedItem, TS.kb_nav);
                TS.kb_nav.setAllowHighlightWithoutBlurringInput(true)
            }
        },
        onMembersItemClick: function(c) {
            c.preventDefault();
            var b = $(this).data("member-id");
            if (b) {
                TS.ims.startImByMemberId(b)
            }
            TS.menu.end()
        },
        startWithFileFilter: function(f, b) {
            if (TS.menu.isRedundantClick(f)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var d = TS.menu.$menu;
            TS.menu.$menu.addClass("headless footless no_min_width");
            var c = "all";
            if (TS.model.file_list_types) {
                c = TS.model.file_list_types[0]
            }
            TS.menu.$menu_header.addClass("hidden").empty();
            TS.menu.$menu_items.html(TS.templates.menu_file_filter_items({
                active_type: c
            }));
            if (b) {
                TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onSearchFileFilterItemClick)
            } else {
                TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onFileFilterItemClick)
            }
            TS.menu.start(f);
            if (b) {
                TS.menu.positionAt($("#search_results_container"), 8, 74)
            } else {
                TS.menu.positionAt($("#file_list_container"), 8, 44)
            }
        },
        onFileFilterItemClick: function(b) {
            b.preventDefault();
            TS.ui.filterFileList($(this).data("filetype"));
            TS.view.fileSetButtonState($(this).data("filetype"));
            TS.menu.end()
        },
        onSearchFileFilterItemClick: function(b) {
            b.preventDefault();
            TS.search.setFiletypeFilter($(this).data("filetype"));
            TS.view.fileSetButtonState($(this).data("filetype"));
            TS.menu.end()
        },
        startWithFileMemberFilter: function(d, b) {
            if (TS.menu.isRedundantClick(d)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var c = TS.menu.$menu;
            TS.menu.$menu.addClass("footless no_min_width");
            TS.menu.$menu_header.html(TS.templates.menu_file_member_header());
            TS.menu.$menu_items.html(TS.templates.menu_file_member_filter_items({
                members: TS.members.getMembersForUser()
            }));
            if (b) {
                TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onSearchFileMemberFilterItemClick)
            } else {
                TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onFileMemberFilterItemClick)
            }
            TS.menu.start(d);
            if (b) {
                TS.menu.positionAt($("#search_results_container"), 102, 100)
            } else {
                TS.menu.positionAt($("#file_list_container"), 102, 63)
            }
            TS.members.view.bindTeamFilter("#file_member_filter", "#menu_items_scroller");
            $("#file_member_filter").find(".member_filter").focus().keydown(function(f) {
                if (f.which == TS.utility.keymap.enter) {
                    var g = $("#menu_items .member_item.active");
                    if (g.length == 1) {
                        g.find("a").click()
                    }
                }
            });
            TS.members.view.team_filter_changed_sig.add(TS.kb_nav.clearHighlightedItem, TS.kb_nav);
            TS.kb_nav.setAllowHighlightWithoutBlurringInput(true)
        },
        onFileMemberFilterItemClick: function(b) {
            b.preventDefault();
            var c = $(this).data("member-id");
            TS.ui.toggleFileList(c);
            TS.menu.end()
        },
        onSearchFileMemberFilterItemClick: function(b) {
            b.preventDefault();
            var c = $(this).data("member-id");
            TS.search.setMember(c);
            TS.menu.end()
        },
        startWithMessageActions: function(d, g, c) {
            if (TS.client && !TS.model.socket_connected) {
                TS.ui.playSound("beep");
                return
            }
            if (TS.menu.isRedundantClick(d)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var b = TS.menu.$menu;
            TS.menu.$menu.addClass("headless footless");
            var f = TS.utility.msgs.getMsg(g, c);
            TS.menu.$menu_header.addClass("hidden").empty();
            TS.menu.$menu_items.html(TS.templates.menu_message_action_items({
                msg: f,
                actions: TS.utility.msgs.getMsgActions(f)
            }));
            TS.menu.$menu.addClass("no_min_width");
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onMessageActionClick);
            TS.menu.start(d)
        },
        onMessageActionClick: function(c) {
            c.preventDefault();
            var f = $(this).attr("id"),
                d = $(this).data("msg-ts");
            var b = TS.shared.getActiveModelOb();
            if (f == "edit_link") {
                TS.msg_edit.startEdit(d, b)
            } else {
                if (f == "delete_link") {
                    TS.msg_edit.startDelete(d, b)
                }
            }
            TS.menu.end()
        },
        startWithCommentActions: function(h, g, f) {
            if (TS.client && !TS.model.socket_connected) {
                TS.ui.playSound("beep");
                return
            }
            if (TS.menu.isRedundantClick(h)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var c = TS.files.getFileById(g);
            if (!c) {
                return
            }
            var k = TS.files.getFileCommentById(c, f);
            if (!k) {
                return
            }
            var b = k.user == TS.model.user.id;
            var j = b || TS.model.user.is_admin;
            var d = TS.menu.$menu;
            TS.menu.$menu.addClass("headless footless");
            TS.menu.$menu_header.addClass("hidden").empty();
            TS.menu.$menu_items.html(TS.templates.menu_comment_action_items({
                file: c,
                comment: k,
                can_edit: b,
                can_delete: j
            }));
            TS.menu.$menu.addClass("no_min_width");
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onCommentActionClick);
            TS.menu.start(h)
        },
        onCommentActionClick: function(b) {
            b.preventDefault();
            var c = $(this).attr("id");
            if (c == "edit_file_comment") {
                b.preventDefault();
                TS.comments.ui.startEdit($(this).data("file-id"), $(this).data("comment-id"))
            } else {
                if (c == "delete_file_comment") {
                    b.preventDefault();
                    TS.comments.ui.startDelete($(this).data("file-id"), $(this).data("comment-id"))
                } else {
                    b.preventDefault();
                    TS.warn("not sure what to do with clicked element id:" + c);
                    return
                }
            }
            TS.menu.end()
        },
        startWithFileActions: function(f, d) {
            if (TS.client && !TS.model.socket_connected) {
                TS.ui.playSound("beep");
                return
            }
            if (TS.menu.isRedundantClick(f)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var b = TS.files.getFileById(d);
            if (!b) {
                return
            }
            var c = TS.menu.$menu;
            TS.menu.$menu.addClass("headless footless");
            TS.menu.$menu_header.addClass("hidden").empty();
            TS.menu.$menu_items.html(TS.templates.menu_file_action_items({
                file: b,
                actions: TS.files.getFileActions(b),
                is_refreshing: TS.files.waiting_for_refresh[b.id]
            }));
            if (TS.web) {
                TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onFileActionClickWeb)
            } else {
                if (TS.client) {
                    TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onFileActionClickClient)
                }
            }
            TS.menu.start(f)
        },
        onFileActionClickClient: function(c) {
            var d = $(this).attr("id");
            var b = TS.files.getFileById($(this).data("file-id"));
            if (!b) {
                return
            }
            if (d == "share_file") {
                c.preventDefault();
                TS.view.shareFileInCurrentChannelOrIM(b.id)
            } else {
                if (d == "edit_file_snippet") {
                    c.preventDefault();
                    TS.ui.snippet_dialog.startEdit(b.id)
                } else {
                    if (d == "edit_file_post") {} else {
                        if (d == "edit_file_title") {
                            c.preventDefault();
                            if (TS.model.previewed_file_id != b.id) {
                                TS.ui.previewFile(b.id, "file_list")
                            }
                            TS.files.editFileTitle(b.id)
                        } else {
                            if (d == "delete_file") {
                                c.preventDefault();
                                TS.view.deleteFile(b.id)
                            } else {
                                if (d == "create_public_link") {
                                    c.preventDefault();
                                    TS.files.upsertAndSignal({
                                        id: b.id,
                                        public_url_shared: true
                                    });
                                    TS.api.callImmediately("files.sharedPublicURL", {
                                        file: b.id
                                    }, function() {
                                        if (TS.model.previewed_file_id) {
                                            $("#file_preview_scroller").find(".file_actions_link").scrollintoview({
                                                duration: 500,
                                                offset: "top",
                                                px_offset: -50
                                            })
                                        }
                                        $(".file_public_link_" + b.id).highlightText()
                                    })
                                } else {
                                    if (d == "revoke_public_link") {
                                        c.preventDefault();
                                        TS.ui.fileRevokePublicLink(b.id)
                                    } else {
                                        if (d == "refresh_file") {
                                            c.preventDefault();
                                            TS.files.refreshFile(b.id);
                                            TS.menu.$menu.find("#refresh_file").find(".item_label").text("Refreshing...").end().find("i").addClass("fa-spin");
                                            return
                                        } else {
                                            if (d == "download_file") {} else {
                                                if (d == "open_original_file") {} else {
                                                    if (d == "comment_file") {
                                                        c.preventDefault();
                                                        if (TS.model.previewed_file_id != b.id) {
                                                            TS.ui.previewFile(b.id, "file_list", false, true)
                                                        } else {
                                                            $("#file_comment").focus()
                                                        }
                                                    } else {
                                                        if (d == "save_to_dropbox") {
                                                            return Dropbox.save(b.url_download, b.name)
                                                        } else {
                                                            c.preventDefault();
                                                            TS.warn("not sure what to do with clicked element id:" + d);
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
            TS.menu.end()
        },
        onFileActionClickWeb: function(c) {
            var d = $(this).attr("id");
            var b = TS.files.getFileById($(this).data("file-id"));
            if (!b) {
                return
            }
            if (d == "share_file") {
                c.preventDefault();
                $("#file_share_modal").modal("show")
            } else {
                if (d == "edit_file_snippet") {} else {
                    if (d == "edit_file_post") {} else {
                        if (d == "edit_file_title") {} else {
                            if (d == "delete_file") {
                                c.preventDefault();
                                TS.web.file.deleteFile(b.id)
                            } else {
                                if (d == "create_public_link") {
                                    c.preventDefault();
                                    $(".file_public_link_shared").slideToggle(100);
                                    TS.files.upsertAndSignal({
                                        id: b.id,
                                        public_url_shared: true
                                    });
                                    TS.api.callImmediately("files.sharedPublicURL", {
                                        file: b.id
                                    })
                                } else {
                                    if (d == "revoke_public_link") {
                                        c.preventDefault();
                                        TS.web.file.revokePublicURL(b)
                                    } else {
                                        if (d == "refresh_file") {
                                            c.preventDefault();
                                            TS.files.refreshFile(b.id);
                                            TS.menu.$menu.find("#refresh_file").find(".item_label").text("Refreshing...").end().find("i").addClass("fa-spin");
                                            return
                                        } else {
                                            if (d == "download_file") {} else {
                                                if (d == "print_file") {
                                                    window.print();
                                                    c.preventDefault()
                                                } else {
                                                    if (d == "open_original_file") {} else {
                                                        if (d == "comment_file") {
                                                            c.preventDefault();
                                                            $("#file_comment").focus()
                                                        } else {
                                                            if (d == "save_to_dropbox") {
                                                                return Dropbox.save(b.url_download, b.name)
                                                            } else {
                                                                c.preventDefault();
                                                                TS.warn("not sure what to do with clicked element id:" + d);
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
            TS.menu.end()
        },
        startWithServiceActions: function(d) {
            if (TS.client && !TS.model.socket_connected) {
                TS.ui.playSound("beep");
                return
            }
            if (TS.menu.isRedundantClick(d)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var c = TS.menu.$menu;
            TS.menu.$menu.addClass("headless footless");
            var b = $(d.target).closest(".action_cog");
            TS.menu.$menu_header.addClass("hidden").empty();
            TS.menu.$menu_items.html(TS.templates.menu_service_action_items({
                can_enable: b.data("can_enable"),
                can_disable: b.data("can_disable"),
                can_remove: b.data("can_remove"),
                service_id: b.data("service_id")
            }));
            TS.menu.$menu.addClass("no_min_width");
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onServiceActionClick);
            TS.menu.start(d)
        },
        onServiceActionClick: function(b) {
            b.preventDefault();
            switch ($(this).attr("id")) {
                case "disable_service":
                    if (confirm("Are you sure you want to disable this service integration?")) {
                        $("#services_action_disable").submit()
                    }
                    break;
                case "enable_service":
                    if (confirm("Are you sure you want to re-enable this service integration?")) {
                        $("#services_action_enable").submit()
                    }
                    break;
                case "remove_service":
                    if (confirm("Are you sure you want to remove this service integration?")) {
                        $("#services_action_remove").submit()
                    }
                    break
            }
            TS.menu.end()
        },
        startWithTeam: function(d) {
            if (TS.menu.isRedundantClick(d)) {
                return
            }
            if (TS.ui.checkForEditing(d)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var c = TS.menu.$menu;
            var b = true;
            var f = {
                user: TS.model.user,
                other_accounts: TS.boot_data.other_accounts,
                logout_url: TS.boot_data.logout_url,
                signin_url: TS.boot_data.signin_url,
                help_url: TS.boot_data.help_url,
                show_invite_item: b
            };
            TS.menu.$menu.addClass("headless footless");
            TS.menu.$menu_header.addClass("hidden").empty();
            TS.menu.$menu_items.html(TS.templates.menu_team_items(f));
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onTeamItemClick);
            TS.kb_nav.setSubmitItemHandler(TS.menu.onTeamItemClick);
            TS.menu.start(d);
            TS.menu.positionAt($("#team_menu"), 150, 49)
        },
        onTeamItemClick: function(c) {
            var d = $(this).attr("id");
            if (d == "team_activity" || d == "team_admin" || d == "team_services" || d == "team_invitations" || d == "team_apps") {} else {
                if (d == "team_help") {
                    c.preventDefault();
                    TS.help_dialog.start()
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
                                TS.warn("not sure what to do with clicked element id:" + d);
                                return
                            }
                        }
                    }
                }
            }
            TS.menu.end()
        },
        startWithUser: function(c) {
            if (TS.menu.isRedundantClick(c)) {
                return
            }
            if (TS.ui.checkForEditing(c)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var b = TS.menu.$menu;
            var d = {
                user: TS.model.user,
                other_accounts: TS.boot_data.other_accounts,
                logout_url: TS.boot_data.logout_url,
                signin_url: TS.boot_data.signin_url
            };
            TS.menu.$menu.addClass("headless footless").css("min-width", 245);
            TS.menu.$menu_header.addClass("hidden").empty();
            TS.menu.$menu_items.html(TS.templates.menu_user_items(d));
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onUserItemClick);
            TS.kb_nav.setSubmitItemHandler(TS.menu.onUserItemClick);
            TS.menu.start(c);
            TS.menu.positionAt($("#user_menu"), 152, -(TS.menu.$menu.height() - 5))
        },
        onUserItemClick: function(b) {
            var c = $(this).attr("id");
            clearTimeout(TS.menu.end_tim);
            if (c == "member_photo_item") {} else {
                if (c == "member_account_item") {} else {
                    if (c == "member_prefs_item") {
                        b.preventDefault();
                        TS.ui.prefs_dialog.start()
                    } else {
                        if (c == "member_profile_item") {
                            b.preventDefault();
                            TS.ui.previewMember(TS.model.user.id)
                        } else {
                            if (c == "member_presence") {
                                b.preventDefault();
                                TS.members.toggleUserPresence();
                                TS.menu.end_tim = setTimeout(function() {
                                    TS.menu.end()
                                }, 1000);
                                return
                            } else {
                                if (c == "member_help") {
                                    b.preventDefault();
                                    TS.help_dialog.start()
                                } else {
                                    if (c == "logout") {
                                        $("body").addClass("hidden")
                                    } else {
                                        b.preventDefault();
                                        TS.warn("not sure what to do with clicked element id:" + c);
                                        return
                                    }
                                }
                            }
                        }
                    }
                }
            }
            TS.menu.end()
        },
        startWithFlexMenu: function(c) {
            if (TS.menu.isRedundantClick(c)) {
                return
            }
            if (TS.model.menu_is_showing) {
                return
            }
            TS.menu.clean();
            var b = TS.menu.$menu;
            TS.menu.$menu_header.html(TS.templates.menu_flexpane_header());
            TS.menu.$menu_items.html(TS.templates.menu_flexpane_items({
                special_flex_panes: TS.boot_data.special_flex_panes
            }));
            TS.menu.$menu_footer.html(TS.templates.menu_flexpane_footer());
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onFlexMenuItemClick);
            TS.menu.start(c);
            TS.menu.positionAt($("#flex_menu"), -(TS.menu.$menu.width() - $("#flex_menu").width() - 31), 40);
            $("#flex_menu_callout").bind("click", function(d) {
                TS.menu.end()
            });
            TS.view.setFlexMenuSize()
        },
        onFlexMenuItemClick: function(f) {
            var d = 200;
            if ($(this).data("tab-id")) {
                var c = $(this).data("tab-id");
                setTimeout(function() {
                    if (c == "files") {
                        TS.ui.toggleFileList("all");
                        TS.ui.filterFileList("all")
                    } else {
                        if (c == "team") {
                            TS.ui.showTeamList()
                        } else {
                            TS.ui.openFlexTab(c)
                        }
                    }
                }, d)
            } else {
                if ($(this).data("filetype")) {
                    var c = "files",
                        b = $(this).data("filetype");
                    setTimeout(function() {
                        TS.ui.toggleFileList("all");
                        TS.ui.filterFileList(b);
                        TS.view.fileSetButtonState(b)
                    }, d)
                } else {
                    var g = $(this).attr("id");
                    if (g == "help") {
                        f.preventDefault();
                        setTimeout(function() {
                            TS.help_dialog.start()
                        }, d)
                    }
                }
            }
            TS.menu.end()
        },
        startWithChannelPickerForChange: function(h, d) {
            if (TS.menu.isRedundantClick(h)) {
                return
            }
            TS.menu.clean();
            var g = TS.menu.$menu;
            var k = TS.members.getMemberById(d);
            var c = [],
                b = [];
            $.each(TS.channels.getUnarchivedChannelsForUser(), function(e, l) {
                if (!k.channels.hasOwnProperty(l.id)) {
                    c.push(l)
                }
            });
            $.each(TS.groups.getUnarchivedGroups(), function(e, l) {
                if (!k.groups.hasOwnProperty(l.id)) {
                    b.push(l)
                }
            });
            var j = {
                user_id: d,
                channels: c,
                groups: b
            };
            TS.menu.$menu_header.html(TS.templates.menu_channel_picker_header(j));
            TS.menu.$menu_items.html(TS.templates.menu_channel_picker(j)).css("max-height", 274);
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onChannelPickerItemClickChangeChannel);
            TS.menu.$menu.addClass("footless").css("width", 274);
            TS.menu.start(h);
            var f = $(h.target).closest(".pill");
            if (TS.boot_data.app == "mobile") {
                TS.menu.positionAt(f, -(f.offset().left) + 16, 0)
            } else {
                TS.menu.positionAt(f, -(TS.menu.$menu.width()) + f.outerWidth(), f.height() + 4)
            }
            TS.menu.$menu.scrollintoview({
                duration: 500,
                offset: "bottom",
                px_offset: -25
            });
            a();
            TS.kb_nav.setAllowHighlightWithoutBlurringInput(true)
        },
        onChannelPickerItemClickChangeChannel: function(f) {
            var c = $(this).data("user-id"),
                b = $(this).data("channel-id"),
                d = $(this).data("group-id");
            if (b) {
                TS.api.call("users.admin.changeURAChannel", {
                    user: c,
                    channel: b
                }, TS.web.admin.onMemberURAChanged)
            } else {
                if (d) {
                    TS.api.call("users.admin.changeURAChannel", {
                        user: c,
                        channel: d
                    }, TS.web.admin.onMemberURAChanged)
                }
            }
            TS.menu.end()
        },
        startWithChannelPickerForInvite: function(g, c) {
            if (TS.menu.isRedundantClick(g)) {
                return
            }
            TS.menu.clean();
            var f = TS.menu.$menu;
            var k = TS.members.getMemberById(c);
            var j = [],
                b = [];
            $.each(TS.channels.getUnarchivedChannelsForUser(), function(e, l) {
                if (!k.channels.hasOwnProperty(l.id)) {
                    j.push(l)
                }
            });
            $.each(TS.groups.getUnarchivedGroups(), function(e, l) {
                if (!k.groups.hasOwnProperty(l.id)) {
                    b.push(l)
                }
            });
            var h = {
                user_id: c,
                channels: j,
                groups: b
            };
            TS.menu.$menu_header.html(TS.templates.menu_channel_picker_header(h));
            TS.menu.$menu_items.html(TS.templates.menu_channel_picker(h)).css("max-height", 274);
            TS.menu.$menu_items.find("li").bind("click.menu", TS.menu.onChannelPickerItemClickInviteChannel);
            TS.menu.$menu.addClass("footless").css("max-width", 300);
            TS.menu.start(g);
            var d = $(g.target).closest(".pill");
            if (TS.boot_data.app == "mobile") {
                TS.menu.positionAt(d, -(d.offset().left) + 16, 0)
            } else {
                TS.menu.positionAt(d, -(d.width()) + 10, d.height() + 4)
            }
            TS.menu.$menu.scrollintoview({
                duration: 500,
                offset: "bottom",
                px_offset: -25
            });
            a();
            TS.kb_nav.setAllowHighlightWithoutBlurringInput(true)
        },
        onChannelPickerItemClickInviteChannel: function(f) {
            var c = $(this).data("user-id"),
                b = $(this).data("channel-id"),
                d = $(this).data("group-id");
            if (b) {
                TS.api.call("channels.invite", {
                    user: c,
                    channel: b
                }, TS.web.admin.onMemberInviteChannel)
            } else {
                if (d) {
                    TS.api.call("groups.invite", {
                        user: c,
                        channel: d
                    }, TS.web.admin.onMemberInviteGroup)
                }
            }
            TS.menu.end()
        },
        startWithChannelPicker: function(f, c, b, d) {
            if (TS.menu.isRedundantClick(f)) {
                return
            }
            TS.menu.clean();
            var g = {
                user_id: TS.model.user.id,
                channels: c,
                groups: b
            };
            TS.menu.$menu_header.html(TS.templates.menu_channel_picker_header(g));
            TS.menu.$menu_items.html(TS.templates.menu_channel_picker(g)).css("max-height", 274);
            TS.menu.$menu_items.find("li").bind("click.menu", d);
            TS.menu.$menu.addClass("footless").css("max-width", 300);
            TS.menu.start(f);
            a();
            TS.kb_nav.setAllowHighlightWithoutBlurringInput(true)
        },
        positionAt: function(d, c, g) {
            c = c || 0;
            g = g || 0;
            var e = d.offset();
            var b = e.left + c;
            var f = e.top + g;
            TS.menu.$menu.css({
                top: f,
                left: b
            })
        },
        isRedundantClick: function(b) {
            if (b && TS.menu.last_e && b.target == TS.menu.last_e.target) {
                return true
            }
            return false
        },
        start: function(g, c) {
            TS.menu.last_e = g;
            var h = $(g.target).offset();
            var b = h.left + $(g.target).width() + 10;
            var j = h.top;
            if (c) {
                b = g.pageX + 10;
                j = g.pageY + 10
            }
            $(".tooltip").hide();
            TS.model.menu_is_showing = true;
            var d = TS.menu.$menu;
            if (TS.client) {
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
            d.find(".menu_close").on("click", TS.menu.end);
            if (d.find("#menu_items_scroller").data("monkeyScroll")) {
                var f = true;
                d.find("#menu_items_scroller").data("monkeyScroll").updateFunc(f)
            }
            TS.menu.keepInBounds();
            if (TS.menu.menu_lazy_load && TS.menu.menu_lazy_load.detachEvents) {
                TS.menu.menu_lazy_load.detachEvents()
            }
            TS.menu.menu_lazy_load = TS.menu.$menu_items.find("img.lazy").lazyload({
                container: $("#menu_items_scroller"),
                throttle: 250
            });
            $(window).bind("resize", TS.menu.keepInBounds);
            $(window.document).bind("keydown", TS.menu.onKeyDown);
            $("html").bind("mousedown", TS.menu.onMouseDown);
            TS.kb_nav.start(d.find("#menu_items"), "li:not(.divider)")
        },
        clean: function() {
            TS.menu.$menu_footer.empty();
            TS.menu.$menu_header.removeClass("hidden");
            TS.menu.$menu.removeClass("no_min_width headless footless").css("min-width", 0)
        },
        end: function() {
            TS.model.menu_is_showing = false;
            var b = TS.menu.$menu;
            b.stop().transition({
                opacity: 0
            }, 200, function() {
                if (TS.model.menu_is_showing) {
                    return
                }
                TS.menu.last_e = null;
                b.detach();
                TS.menu.clean()
            });
            TS.menu.member = null;
            TS.menu.channel = null;
            TS.menu.$menu_header.unbind("click.menu");
            $(window).unbind("resize", TS.menu.keepInBounds);
            $(window.document).unbind("keydown", TS.menu.onKeyDown);
            $("html").unbind("mousedown", TS.menu.onMouseDown);
            TS.members.view.team_filter_changed_sig.remove(TS.kb_nav.clearHighlightedItem);
            TS.kb_nav.end()
        },
        onKeyDown: function(d) {
            var b = TS.utility.keymap;
            var c = d.which;
            if (c == b.esc) {
                d.stopPropagation();
                d.preventDefault();
                TS.menu.end();
                return
            }
        },
        onMouseDown: function(b) {
            if ($(b.target).closest("#menu").length == 0 && $(b.target).closest("#tip_card").length == 0) {
                TS.menu.end()
            }
        },
        keepInBounds: function() {
            var d = TS.menu.$menu;
            var c = 10;
            var e = d.dimensions_rect();
            var b = {
                top: 0 + c,
                right: $(window).width() - c,
                bottom: $(window).height() - (c + 14),
                left: 0 + c
            };
            if (TS.utility.doesRectContainRect(b, e)) {
                return
            }
            if (e.left < b.left) {
                d.css("left", b.left)
            } else {
                if (e.right > b.right) {
                    d.css("left", Math.max(b.left, b.right - e.width))
                }
            } if (e.top < b.top) {
                d.css("top", b.top)
            } else {
                if (e.bottom > b.bottom) {
                    d.css("top", Math.max(b.top, b.bottom - e.height + $(window).scrollTop()))
                }
            }
        }
    });
    var a = function() {
        var d = TS.menu.$menu.find(".no_matches");
        var c = TS.menu.$menu.find(".icon_close");
        var e = TS.menu.$menu.find(".menu_filter");
        var b = "";
        c.click(function() {
            e.val("").trigger("change");
            e.focus()
        });
        TS.menu.$menu_items.children("li").each(function() {
            var f = $(this).data("channel-id");
            if (f) {
                var h = TS.channels.getChannelById(f);
                if (h) {
                    $(this).data("name", h.name)
                }
                return
            }
            var g = $(this).data("group-id");
            if (g) {
                var j = TS.groups.getGroupById(g);
                if (j) {
                    $(this).data("name", j.name)
                }
            }
        });
        e.on("keyup change paste", TS.utility.debounce(function(k) {
            var j = $(this).val();
            if (j) {
                if (b !== j) {
                    var g = new RegExp(TS.utility.regexpEscape(j), "i");
                    var f = false;
                    c.removeClass("hidden");
                    TS.menu.$menu_items.children("li").removeClass("hidden").each(function() {
                        var m = $(this).data("name");
                        if (m) {
                            var l = m.match(g);
                            if (l) {
                                f = true;
                                return
                            }
                        }
                        $(this).addClass("hidden")
                    });
                    if (f) {
                        d.addClass("hidden")
                    } else {
                        d.removeClass("hidden");
                        d.find(".query").text(j)
                    }
                    TS.kb_nav.clearHighlightedItem()
                }
            } else {
                TS.menu.$menu_items.children("li.hidden").removeClass("hidden");
                d.addClass("hidden");
                c.addClass("hidden");
                if (b !== j) {
                    TS.kb_nav.clearHighlightedItem()
                }
            }
            b = j;
            if (TS.menu.$menu.find("#menu_items_scroller").data("monkeyScroll")) {
                var h = true;
                TS.menu.$menu.find("#menu_items_scroller").data("monkeyScroll").updateFunc(h)
            }
        }, 250));
        e.focus()
    }
})();
TS.registerModule("cmd_handlers", {
    server_cmds: null,
    onStart: function() {},
    serverCmdAddedOrChanged: function(a) {
        if (!TS.cmd_handlers.server_cmds) {
            TS.cmd_handlers.server_cmds = {}
        }
        if (TS.cmd_handlers.server_cmds[a.name]) {
            TS.log(65, 'serverCmdAddedOrChanged is updating "' + a.name + '" in server_cmds')
        } else {
            TS.log(65, 'serverCmdAddedOrChanged is adding "' + a.name + '" to server_cmds')
        }
        TS.cmd_handlers.server_cmds[a.name] = TS.cmd_handlers.makeInternalCmdObject(a);
        TS.cmd_handlers.mergeInServerCmds(TS.cmd_handlers.server_cmds)
    },
    serverCmdRemoved: function(a) {
        if (!TS.cmd_handlers.server_cmds) {
            return
        }
        if (TS.cmd_handlers.server_cmds[a.name]) {
            TS.log(65, 'serverCmdRemoved is removing "' + a.name + '" from server_cmds')
        } else {
            TS.log(65, 'serverCmdRemoved did not find "' + a.name + '" in server_cmds')
        }
        delete TS.cmd_handlers.server_cmds[a.name];
        TS.cmd_handlers.mergeInServerCmds(TS.cmd_handlers.server_cmds)
    },
    mergeInServerCmds: function(a) {
        TS.cmd_handlers.server_cmds = a;
        for (var b in TS.cmd_handlers) {
            if (b.indexOf("/") != 0) {
                continue
            }
            if (TS.cmd_handlers[b].type == "client") {
                delete TS.cmd_handlers[b].override
            } else {
                TS.log(65, 'mergeInCmds is removing the server command "' + b + '" from cmd_handlers');
                delete TS.cmd_handlers[b]
            }
        }
        for (var c in a) {
            if (c.indexOf("/") != 0) {
                continue
            }
            if (TS.cmd_handlers[c]) {
                TS.cmd_handlers[c].override = true;
                TS.log(65, 'mergeInCmds is NOT overwriting a client command for "' + c + '"');
                continue
            }
            TS.log(65, 'mergeInCmds is adding the server command "' + c + '" to cmd_handlers');
            TS.cmd_handlers[c] = TS.cmd_handlers.makeInternalCmdObject(a[c])
        }
        for (var c in a) {
            if (c.indexOf("/") != 0) {
                continue
            }
            if (!TS.cmd_handlers[c].alias_of) {
                continue
            }
            var d = TS.cmd_handlers[TS.cmd_handlers[c].alias_of];
            if (!d) {
                TS.log(65, 'mergeInCmds is NOT adding an alias of "' + c + '" to "' + TS.cmd_handlers[c].alias_of + '" because it was not found');
                continue
            }
            if (d.type == "client") {
                TS.log(65, 'mergeInCmds is NOT adding an alias of "' + c + '" to "' + TS.cmd_handlers[c].alias_of + '" because it is not a server command');
                continue
            }
            TS.log(65, 'mergeInCmds is adding on alias of "' + c + '" to "' + TS.cmd_handlers[c].alias_of + '"');
            if (!d.aliases) {
                d.aliases = []
            }
            d.aliases.push(c)
        }
    },
    makeInternalCmdObject: function(a) {
        return {
            autocomplete: true,
            alias_of: a.alias_of ? a.alias_of : null,
            aliases: null,
            usage: a.usage || "",
            desc: a.desc || "",
            help_text: a.help_text || "",
            type: a.type || ""
        }
    },
    addTempEphemeralFeedback: function(b, a) {
        if (a) {
            TS.view.input_el.val(a)
        }
        TS.ui.addOrFlashEphemeralBotMsg({
            text: b,
            ephemeral_type: "temp_slash_cmd_feedback"
        })
    },
    addEphemeralFeedback: function(b, a) {
        if (a) {
            TS.view.input_el.val(a)
        }
        TS.utility.msgs.removeAllEphemeralMsgsByType("temp_slash_cmd_feedback", TS.model.active_cid);
        TS.ui.addEphemeralBotMsg({
            text: b
        })
    },
    runCommand: function(b, a, d, c) {
        if (!TS.cmd_handlers[b]) {
            return
        }
        if (TS.model.last_active_cid) {
            TS.utility.msgs.removeAllEphemeralMsgsByType("temp_slash_cmd_feedback", TS.model.last_active_cid)
        }
        TS.cmd_handlers[b].func(b, a, d, c)
    },
    "/status": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.members.setUserStatus(a)
        }
    },
    "/away": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: null,
        desc: 'Toggle your "away" status',
        func: function(b, a, d, c) {
            TS.members.toggleUserPresence();
            TS.members.presence_changed_sig.add(function(e) {
                if (!e || e.id != TS.model.user.id) {
                    return
                }
                TS.members.presence_changed_sig.remove(arguments.callee);
                TS.cmd_handlers.addEphemeralFeedback(":white_check_mark: You are now marked as *" + e.presence + "*.")
            });
            if (a) {
                TS.members.setUserStatus(a)
            }
        }
    },
    "/prefs": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: null,
        desc: "Open the preferences dialog",
        func: function(b, a, d, c) {
            TS.ui.prefs_dialog.start()
        }
    },
    "/shortcuts": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: ["/keys"],
        desc: "Open the keyboard shortcuts dialog",
        func: function(b, a, d, c) {
            TS.ui.shortcuts_dialog.start()
        }
    },
    "/keys": {
        type: "client",
        autocomplete: true,
        alias_of: "/shortcuts",
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.cmd_handlers["/shortcuts"].func(b, a, d, c)
        }
    },
    "/open": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: ["/join"],
        desc: "Open a channel or group",
        args: [{
            name: "channel",
            optional: true
        }],
        func: function(d, b, h, g) {
            if (h.length == 1) {
                TS.ui.list_browser_dialog.start("channels")
            } else {
                var a = TS.utility.cleanChannelName(b);
                var c = TS.channels.getChannelByName(a);
                var f = TS.groups.getGroupByName(a);
                if (c) {
                    if (c.is_member) {
                        TS.channels.displayChannel(c.id)
                    } else {
                        if (!TS.model.user.is_restricted) {
                            TS.channels.join(c.name)
                        }
                    }
                } else {
                    if (f) {
                        if (!f.is_archived || f.was_archived_this_session) {
                            TS.groups.displayGroup(f.id)
                        }
                    } else {
                        if (TS.members.canUserCreateChannels()) {
                            TS.ui.channel_create_dialog.start(a)
                        } else {
                            TS.cmd_handlers.addEphemeralFeedback("I couldn't find a channel or group named \"" + a + '", sorry :disappointed:')
                        }
                    }
                }
            }
        }
    },
    "/join": {
        type: "client",
        autocomplete: true,
        alias_of: "/open",
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.cmd_handlers["/open"].func(b, a, d, c)
        }
    },
    "/msg": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: ["/dm"],
        desc: "Send a DM message to another user",
        args: [{
            name: "@user",
            optional: false
        }, {
            name: "your message",
            optional: true
        }],
        func: function(d, b, j, h) {
            var a = (j.length > 1) ? j[1] : "";
            var f = TS.members.getMemberByName(a);
            var g;
            if (!f) {
                if (a) {
                    var c = a.replace("#", "");
                    g = TS.channels.getChannelByName(c);
                    if (!g) {
                        g = TS.groups.getGroupByName(c)
                    }
                    if (!g) {
                        TS.cmd_handlers.addTempEphemeralFeedback("A valid team member name is required.", d + " " + b);
                        return
                    }
                } else {
                    $("#direct_messages_header").trigger("click.open_dialog").scrollintoview({
                        duration: 500
                    })
                }
            }
            var k = b.replace(a, "");
            if (f) {
                if (f.deleted) {
                    TS.cmd_handlers.addTempEphemeralFeedback("That user has been deactivated :disappointed:", d + " " + b);
                    return
                }
                TS.ims.startImByMemberId(f.id, false, k)
            } else {
                if (g) {
                    if (g.is_archived) {
                        TS.cmd_handlers.addTempEphemeralFeedback("That " + (g.is_channel ? "channel" : "groups") + " has been archived :disappointed:");
                        return
                    }
                    if (g.is_channel) {
                        TS.channels.displayChannel(g.id, k)
                    } else {
                        TS.groups.displayGroup(g.id, k)
                    }
                }
            }
        }
    },
    "/invite": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: null,
        desc: "Invite another member to a channel or group",
        args: [{
            name: "@user",
            optional: false
        }, {
            name: "channel",
            optional: true
        }],
        func: function(d, b, l, j) {
            var a = (l.length > 1) ? l[1] : "";
            var f = TS.members.getMemberByName(a);
            if (!f && a) {
                TS.cmd_handlers.addTempEphemeralFeedback("A valid team member name is required.", d + " " + b);
                return
            }
            if (f && f.deleted) {
                TS.cmd_handlers.addTempEphemeralFeedback("That user has been deactivated :disappointed:", d + " " + b);
                return
            }
            var n = (l.length > 2) ? l[2] : "";
            if (n) {
                if (!f) {
                    TS.cmd_handlers.addTempEphemeralFeedback("A valid channel name is required.", d + " " + b);
                    return
                }
                var k = TS.channels.getChannelByName(n);
                var h = TS.groups.getGroupByName(n);
                if (k) {
                    TS.api.call("channels.invite", {
                        channel: k.id,
                        user: f.id
                    })
                } else {
                    if (h) {
                        TS.ui.invite.showInviteMembersPreSelected(h.id, [f.id])
                    } else {
                        TS.cmd_handlers.addTempEphemeralFeedback("A valid channel name is required.", d + " " + b);
                        return
                    }
                }
            } else {
                if (TS.model.active_channel_id) {
                    if (f) {
                        TS.api.call("channels.invite", {
                            channel: TS.model.active_channel_id,
                            user: f.id
                        })
                    } else {
                        if (j && j.which == TS.utility.keymap.enter) {
                            $(window.document).bind("keyup.wait_for_invite", function(c) {
                                TS.ui.invite.showInviteMembersFromChannelDialog(TS.model.active_channel_id);
                                $(window.document).unbind("keyup.wait_for_invite")
                            })
                        } else {
                            TS.ui.invite.showInviteMembersFromChannelDialog(TS.model.active_channel_id)
                        }
                    }
                } else {
                    if (TS.model.active_group_id) {
                        if (f) {
                            TS.ui.invite.showInviteMembersPreSelected(TS.model.active_group_id, [f.id])
                        } else {
                            if (j && j.which == TS.utility.keymap.enter) {
                                $(window.document).bind("keyup.wait_for_invite", function(c) {
                                    TS.ui.invite.showInviteMembersFromGroupDialog(TS.model.active_group_id);
                                    $(window.document).unbind("keyup.wait_for_invite")
                                })
                            } else {
                                TS.ui.invite.showInviteMembersFromGroupDialog(TS.model.active_group_id)
                            }
                        }
                    } else {
                        TS.cmd_handlers.addTempEphemeralFeedback("A valid channel name is required.", d + " " + b);
                        return
                    }
                }
            }
        }
    },
    "/dm": {
        type: "client",
        autocomplete: true,
        alias_of: "/msg",
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.cmd_handlers["/msg"].func(b, a, d, c)
        }
    },
    "/close": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: ["/leave", "/part"],
        desc: "Close a channel, group, or DM",
        func: function(d, b, g, f) {
            if (g.length == 1) {
                var a = TS.shared.getActiveModelOb();
                if (TS.model.active_channel_id) {
                    if (TS.model.user.is_restricted) {
                        return
                    }
                    if (a.is_archived) {
                        TS.channels.closeArchivedChannel(TS.model.active_channel_id)
                    } else {
                        TS.channels.leave(TS.model.active_channel_id)
                    }
                } else {
                    if (TS.model.active_im_id) {
                        TS.ims.closeIm(TS.model.active_im_id)
                    } else {
                        if (TS.model.active_group_id) {
                            if (a.is_archived) {
                                TS.groups.closeGroup(a.id)
                            } else {
                                TS.cmd_handlers.addTempEphemeralFeedback("Please use the group menu for this.")
                            }
                        } else {
                            TS.cmd_handlers.addTempEphemeralFeedback("A valid channel, group, or team member name is required.")
                        }
                    }
                }
            } else {
                var c = TS.channels.getChannelByName(b);
                if (c) {
                    TS.channels.leave(c.id)
                } else {
                    TS.cmd_handlers.addTempEphemeralFeedback("A valid channel name is required.")
                }
            }
        }
    },
    "/leave": {
        type: "client",
        autocomplete: true,
        alias_of: "/close",
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.cmd_handlers["/close"].func(b, a, d, c)
        }
    },
    "/part": {
        type: "client",
        autocomplete: true,
        alias_of: "/close",
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.cmd_handlers["/close"].func(b, a, d, c)
        }
    },
    "/topic": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: null,
        desc: "Set the channel or group topic",
        args: [{
            name: "your text",
            optional: true
        }],
        func: function(b, a, d, c) {
            if (TS.model.user.is_restricted || (TS.shared.getActiveModelOb().is_general && !TS.members.canUserPostInGeneral())) {
                TS.cmd_handlers.addTempEphemeralFeedback("Setting the topic is a restricted action.", b + " " + a);
                return
            }
            if (a.length > TS.model.channel_topic_max_length) {
                TS.cmd_handlers.addTempEphemeralFeedback("Topics cannot exceed " + TS.model.channel_topic_max_length + " characters.", b + " " + a);
                return
            }
            if (TS.model.active_channel_id) {
                if (a) {
                    TS.channels.setTopic(TS.model.active_channel_id, a)
                } else {
                    $("#active_channel_name .name, #group_actions").trigger("click.channel_actions");
                    $("#menu_channel_topic_input").focus().select()
                }
            } else {
                if (TS.model.active_group_id) {
                    if (a) {
                        TS.groups.setTopic(TS.model.active_group_id, a)
                    } else {
                        $("#active_channel_name .name, #group_actions").trigger("click.channel_actions");
                        $("#menu_channel_topic_input").focus().select()
                    }
                } else {
                    TS.cmd_handlers.addTempEphemeralFeedback("IM channels do not have topics :disappointed:")
                }
            }
        }
    },
    "/togglethemes": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.prefs.setPrefByAPI({
                name: "messages_theme",
                value: (TS.model.prefs.messages_theme == "light_with_avatars" ? "dense" : "light_with_avatars")
            })
        }
    },
    "/search": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: ["/s"],
        desc: "Perform a search",
        args: [{
            name: "your text",
            optional: true
        }],
        func: function(b, a, d, c) {
            TS.ui.openFlexTab("search");
            TS.view.resizeManually("TS.search.view.showResults");
            $("#search_terms").val(a).removeClass("placeholder").focus()
        }
    },
    "/s": {
        type: "client",
        autocomplete: true,
        alias_of: "/search",
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.cmd_handlers["/search"].func(b, a, d, c)
        }
    },
    "/rename": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: null,
        desc: "Rename a channel or group",
        args: [{
            name: "new name",
            optional: true
        }],
        func: function(c, b, f, d) {
            if (TS.model.user.is_restricted) {
                TS.cmd_handlers.addTempEphemeralFeedback("You don't have permission to rename.");
                return
            }
            if (!TS.model.active_channel_id && !TS.model.active_group_id) {
                TS.cmd_handlers.addTempEphemeralFeedback("IM channels cannot be renamed :disappointed:");
                return
            }
            var a = TS.shared.getActiveModelOb();
            if (TS.model.active_channel_id) {
                if (!TS.model.user.is_admin && a.creator != TS.model.user.id) {
                    TS.cmd_handlers.addTempEphemeralFeedback("Only team admins (or the channel creator) are allowed to rename channels. :disappointed:");
                    return
                }
            }
            TS.ui.channel_create_dialog.start(TS.utility.htmlEntities(b) || a.name, a)
        }
    },
    "/trigger_w": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.model.collapse_trigger_w = parseInt(a);
            alert("collapse_trigger_w = " + TS.model.collapse_trigger_w)
        }
    },
    "/eeeee": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function() {
            var a = function() {
                noFunc()
            };
            try {
                a()
            } catch (b) {
                TS.logError(b, "error running myFunc in /eeeee handler")
            }
            ppppppppppppp()
        }
    },
    "/setcursorback_allbyclient": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(f, c, h, g) {
            var d;
            var a;
            for (var b = 0; b < TS.model.channels.length; b++) {
                d = TS.model.channels[b];
                if (!d.is_member) {
                    continue
                }
                TS.api.call("chat.command", {
                    agent: "webapp",
                    command: "/setcursorback",
                    text: c,
                    channel: d.id
                }, TS.ui.onAPICommand)
            }
            for (var b = 0; b < TS.model.ims.length; b++) {
                a = TS.model.ims[b];
                TS.api.call("chat.command", {
                    agent: "webapp",
                    command: "/setcursorback",
                    text: c,
                    channel: a.id
                }, TS.ui.onAPICommand)
            }
        }
    },
    "/js_path": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(d, c, g, f) {
            var b = window.location.pathname + "?";
            b += "js_path=" + c;
            for (var a in TS.qs_args) {
                if (a == "js_path") {
                    continue
                }
                b += "&" + a + "=" + TS.qs_args[a]
            }
            window.location.replace(b)
        }
    },
    "/addmember": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.msg_handlers.team_join({
                user: {
                    id: "U555555",
                    name: "AAAAAAAA",
                    status: null,
                    color: "cc0000",
                    real_name: null,
                    skype: null,
                    phone: null,
                    profile: {
                        image_24: "https://secure.gravatar.com/avatar/0290deb48e3c326c83f668ed8e040d92.jpg?s=24&d=mm",
                        image_32: "https://secure.gravatar.com/avatar/0290deb48e3c326c83f668ed8e040d92.jpg?s=32&d=mm",
                        image_48: "https://secure.gravatar.com/avatar/0290deb48e3c326c83f668ed8e040d92.jpg?s=48&d=mm",
                        image_72: "https://secure.gravatar.com/avatar/0290deb48e3c326c83f668ed8e040d92.jpg?s=72&d=mm",
                        image_192: "https://secure.gravatar.com/avatar/0290deb48e3c326c83f668ed8e040d92.jpg?s=192&d=mm"
                    },
                    presence: "away"
                }
            })
        }
    },
    "/delay": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            if (d.length > 1 && d[1]) {
                setTimeout(function() {
                    TS.ui.onSubmit(a)
                }, 5000)
            } else {
                TS.cmd_handlers.addTempEphemeralFeedback("nothing to delay?")
            }
        }
    },
    "/beep": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.ui.playSound("new_message")
        }
    },
    "/upload": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(c, b, f, d) {
            var a = TS.utility.base64StrtoBlob(b);
            TS.ui.file_pasted_sig.dispatch(a)
        }
    },
    "/msg_activity_interval": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            if (parseInt(a)) {
                TS.model.msg_activity_interval = a;
                TS.view.rebuildMsgs()
            } else {
                TS.cmd_handlers.addTempEphemeralFeedback("/msg_activity_interval only accepts integers")
            }
        }
    },
    "/model": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            if (a == "current") {
                TS.dir(0, TS.shared.getActiveModelOb())
            } else {
                TS.dir(0, TS.model.channels)
            }
        }
    },
    "/color_names_in_list": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.prefs.setPrefByAPI({
                name: "color_names_in_list",
                value: !TS.model.prefs.color_names_in_list
            })
        }
    },
    "/colors": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: ["/colours"],
        desc: "View any custom colors you have set for other members",
        func: function(d, c, h, f) {
            var a = TS.members.getMembersForUser();
            var j;
            var g = "";
            for (var b = 0; b < a.length; b++) {
                j = a[b];
                if (j.member_color != j.color) {
                    g += j.name + ": " + j.member_color + "\n"
                }
            }
            TS.cmd_handlers.addEphemeralFeedback((g) ? "You have overridden colors as follows:\n" + g : "No user color overrides have been set.")
        }
    },
    "/colours": {
        type: "client",
        autocomplete: true,
        alias_of: "/colors",
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.cmd_handlers["/colors"].func(b, a, d, c)
        }
    },
    "/color": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: ["/colour"],
        desc: "Set a custom color for another member",
        func: function(f, d, h, g) {
            var c = (h.length > 1) ? h[1] : "";
            var b = (h.length > 2) ? h[2].replace(/\#/g, "") : "";
            var a = TS.members.getMemberByName(c);
            if (!a) {
                TS.cmd_handlers.addTempEphemeralFeedback("A valid team member name is required.", f + " " + d);
                return
            }
            if (b && (b.length != 6 || !("#" + b).match(TS.format.hex_rx))) {
                TS.cmd_handlers.addTempEphemeralFeedback("A valid 6 character hex code is required, like `FF0000`.", f + " " + d);
                return
            }
            TS.members.setMemberUserColor(a, b);
            TS.model.prefs.user_colors = JSON.stringify(TS.model.user_colors);
            TS.prefs.setPrefByAPI({
                name: "user_colors",
                value: TS.model.prefs.user_colors
            });
            if (b) {
                TS.cmd_handlers.addEphemeralFeedback("You've set your custom color for @" + a.name + " to #" + b)
            } else {
                TS.cmd_handlers.addEphemeralFeedback("You've removed your custom color for @" + a.name + ".")
            }
        }
    },
    "/colour": {
        type: "client",
        autocomplete: true,
        alias_of: "/color",
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.cmd_handlers["/color"].func(b, a, d, c)
        }
    },
    "/colortest": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(f, d, h, g) {
            var a = null;
            if (d) {
                try {
                    a = JSON.parse(d)
                } catch (g) {
                    TS.cmd_handlers.addTempEphemeralFeedback("Not a good value for colors: " + d);
                    return
                }
            }
            if (!a || !a.length) {
                a = ["#DDCFFA", "#2EF645", "#F38303", "#E702AE", "#3C986D", "#9D6158", "#F43368", "#97C10A", "#7491F9", "#9E63A3", "#FACE41", "#35A5CC", "#39A93E", "#4FECA8", "#CA5B34", "#E2A974", "#2BCFCB", "#F89BA7", "#89868A", "#6A7841", "#ADC498", "#B1DBDD", "#B849C3", "#9CDB81", "#E72F36", "#A16A28", "#F68CCF", "#317C84", "#58851C", "#FC4A97", "#5774BB", "#97B7FE", "#C64D97", "#CB4A5C", "#F68B6B", "#81EE4F", "#B7ED6D", "#756D8E", "#3AED69", "#81E7FB", "#91ECB7", "#ED8947", "#57AF19", "#28BC89", "#4A9788", "#D645DF", "#B498FE", "#71C8F9", "#C07B1D", "#16BD60", "#EFCAE3", "#A4E0BB", "#478AAF", "#59953E", "#886CA7", "#F0C3F1", "#29AF70", "#80A5F8", "#636BB8"]
            }
            for (var c = 0; c < a.length; c++) {
                a[c] = a[c].replace("#", "")
            }
            var b = TS.members.getMembersForUser();
            for (var c = 0; c < b.length; c++) {
                TS.members.setMemberUserColor(b[c], a[TS.utility.randomInt(0, a.length - 1)])
            }
        }
    },
    "/discon": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.socket.disconnect()
        }
    },
    "/sleep": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.client.sleep()
        }
    },
    "/wake": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.client.wake()
        }
    },
    "/discon2": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.model.break_token = true;
            TS.socket.disconnect()
        }
    },
    "/discon3": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.model.break_reconnections = true;
            TS.socket.disconnect()
        }
    },
    "/overloaddontdothiseverpleaseyouwillbesorry": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(g, d, j, h) {
            if (TS.model.user.is_restricted) {
                return
            }
            var f = d || 10;
            var c = 0;
            var b = TS.members.getActiveMembersWithSelfAndNotSlackbot();
            var a = setInterval(function() {
                c++;
                TS.msg_handlers.message({
                    channel: TS.channels.getGeneralChannel().id,
                    type: "message",
                    user: b[TS.utility.randomInt(0, b.length - 1)].id,
                    ts: TS.utility.date.makeTsStamp(null, "0"),
                    text: "overload #" + c
                });
                if (c >= f) {
                    clearInterval(a)
                }
            }, 0)
        }
    },
    "/babbledontdothiseverpleaseyouwillbesorry": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(c, a, j, h) {
            var b = TS.utility.msgs.ipsum();
            var f = 1;
            var g = a;
            var d = function() {
                var l = "(" + f + ") " + b[TS.utility.randomInt(0, b.length - 1)];
                var e = true;
                if (parseInt(g)) {
                    if (f > parseInt(g)) {
                        clearInterval(k);
                        e = false
                    }
                }
                if (e) {
                    if (TS.model.active_channel_id) {
                        TS.channels.sendMsg(TS.model.active_channel_id, l)
                    } else {
                        if (TS.model.active_im_id) {
                            TS.ims.sendMsg(TS.model.active_im_id, l)
                        } else {
                            if (TS.model.active_group_id) {
                                TS.groups.sendMsg(TS.model.active_group_id, l)
                            }
                        }
                    }
                }
                f++
            };
            if (parseInt(g)) {
                d();
                var k = setInterval(d, 1000)
            } else {
                if (confirm("You sure you want to do this? It will put a lot of crap messages into this channel, y'know? Also, it can't be stopped without a reload.")) {
                    d();
                    var k = setInterval(d, 1000)
                }
            }
        }
    },
    "/ls": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.info($.jStorage.get(d[1], "NOTHING FOUND FOR " + d[1]))
        }
    },
    "/nohrs": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            $('<style type="text/css">.message {border-top:1px solid transparent !important;}</style>').appendTo("head")
        }
    },
    "/emo": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: ["/emote", "/emoji"],
        desc: "",
        func: function(a) {
            var b = {};
            b.target = $("#message-form");
            TS.emoji_menu.startEmo(b)
        }
    },
    "/emoji": {
        type: "client",
        autocomplete: false,
        alias_of: "/emo",
        aliases: null,
        desc: "",
        func: function(a) {
            TS.cmd_handlers["/emo"].func(a)
        }
    },
    "/emote": {
        type: "client",
        autocomplete: false,
        alias_of: "/emo",
        aliases: null,
        desc: "",
        func: function(a) {
            TS.cmd_handlers["/emo"].func(a)
        }
    },
    "/editlast": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "Edit the last message you posted",
        func: function(c, b, g, d) {
            var a = TS.shared.getActiveModelOb();
            if (!a) {
                return
            }
            b = $.trim(b);
            if (!b) {
                TS.cmd_handlers.addTempEphemeralFeedback("You must enter some text!", c + " " + b);
                return
            }
            var f = TS.utility.msgs.getEditableMsgByProp("user", TS.model.user.id, a.msgs);
            if (!f) {
                TS.cmd_handlers.addTempEphemeralFeedback("Found no recent messages from you to edit :disappointed:", c + " " + b);
                return
            }
            TS.msg_edit.commitEdit(f, TS.shared.getActiveModelOb(), b)
        }
    },
    "/deletelast": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "Delete the last message you posted",
        func: function(c, b, g, d) {
            var a = TS.shared.getActiveModelOb();
            if (!a) {
                return
            }
            var f = TS.utility.msgs.getEditableMsgByProp("user", TS.model.user.id, a.msgs);
            if (!f) {
                TS.cmd_handlers.addTempEphemeralFeedback("Found no recent messages from you to delete :disappointed:");
                return
            }
            TS.msg_edit.startDelete(f.ts)
        }
    },
    "/collapse": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: null,
        desc: "Collapse all inline images and video in the current channel (opposite of /expand)",
        func: function(b, a, d, c) {
            TS.inline_imgs.collapseAllInCurrent();
            TS.inline_videos.collapseAllInCurrent();
            TS.inline_attachments.collapseAllInCurrent();
            TS.inline_audios.collapseAllInCurrent();
            TS.cmd_handlers.addEphemeralFeedback("I've collapsed all inline images and video in this channel for you.")
        }
    },
    "/expand": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: null,
        desc: "Expand all inline images and video in the current channel (opposite of /collapse)",
        func: function(b, a, d, c) {
            TS.inline_imgs.expandAllInCurrent();
            TS.inline_videos.expandAllInCurrent();
            TS.inline_attachments.expandAllInCurrent();
            TS.inline_audios.expandAllInCurrent();
            TS.cmd_handlers.addEphemeralFeedback("I've expanded all inline images and video in this channel for you.")
        }
    },
    "/orb": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(c, b, f, d) {
            if ($("#orb").length) {
                $("#orb").destroy();
                $("#orb").remove()
            } else {
                var a = '					<div id="orb" class="tip_card_throbber throbbing">					<style>					#orb {						position: absolute;						top: 150px;						left: 65px;						z-index: 2000;					}					</style>					</div>				';
                $("body").append(a)
            }
        }
    },
    "/pong_timeout_ms": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(c, b, f, d) {
            var a = parseInt(b);
            if (a) {
                TS.socket.pong_timeout_ms = a + TS.socket.ping_interv_ms;
                TS.warn("set special pong_timeout_ms:" + a + " (really " + TS.socket.pong_timeout_ms + " but don't worry about that)")
            } else {
                TS.cmd_handlers.addTempEphemeralFeedback("Need a number", c + " " + b)
            }
        }
    },
    "/attach_align": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            $("body").toggleClass("attachments_flush_with_avatar")
        }
    },
    "/attach_thumb_align": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            window.attach_thumb_align_title = !window.attach_thumb_align_title;
            TS.view.rebuildMsgs()
        }
    },
    "/remove": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: ["/kick"],
        desc: "Remove a person from the current channel or group",
        args: [{
            name: "@user",
            optional: false
        }],
        func: function(c, b, f, d) {
            if (TS.model.active_channel_id && !TS.members.canUserKickFromChannels()) {
                TS.cmd_handlers.addTempEphemeralFeedback("Removing from channels is a restricted action.");
                return
            }
            if (TS.model.active_group_id && !TS.members.canUserKickFromGroups()) {
                TS.cmd_handlers.addTempEphemeralFeedback("Removing from groups is a restricted action.");
                return
            }
            if (TS.model.active_im_id) {
                TS.cmd_handlers.addTempEphemeralFeedback("You can't remove someone from a DM.");
                return
            }
            var a = TS.shared.getActiveModelOb();
            if (a.is_archived) {
                TS.cmd_handlers.addTempEphemeralFeedback("You can't remove anyone from *" + (TS.model.active_channel_id ? "#" : "") + a.name + "* while it is archived.");
                return
            }
            b = $.trim(b);
            if (!b) {
                TS.cmd_handlers.addTempEphemeralFeedback("Please specifiy someone to remove!", c + " " + b);
                return
            }
            var g = TS.members.getMemberByName(b);
            if (!g) {
                TS.cmd_handlers.addTempEphemeralFeedback("*" + TS.utility.htmlEntities(b) + "* is not a recognized member name.", c + " " + b);
                return
            }
            if (a.is_general && !g.is_restricted) {
                TS.cmd_handlers.addTempEphemeralFeedback("You can't remove this member from *" + (TS.model.active_channel_id ? "#" : "") + a.name + "*!");
                return
            }
            if (a.members.indexOf(g.id) == -1) {
                TS.cmd_handlers.addTempEphemeralFeedback("*" + TS.utility.htmlEntities(b) + "* is not a member of this " + (TS.model.active_channel_id ? "channel" : "group") + ".", c + " " + b);
                return
            }
            if (g.is_self) {
                TS.ui.onSubmit("/close");
                return;
                TS.cmd_handlers.addTempEphemeralFeedback("You can't remove yourself from a " + (TS.model.active_channel_id ? "channel" : "group") + ".", c + " " + b);
                return
            }
            if (TS.model.active_channel_id) {
                TS.channels.kickMember(TS.model.active_channel_id, g.id)
            } else {
                if (TS.model.active_group_id) {
                    TS.groups.kickMember(TS.model.active_group_id, g.id)
                } else {
                    return
                }
            }
        }
    },
    "/kick": {
        type: "client",
        autocomplete: true,
        alias_of: "/remove",
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.cmd_handlers["/remove"].func(b, a, d, c)
        }
    },
    "/feedback": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: null,
        desc: "Send feedback to Slack",
        args: [{
            name: "your message",
            optional: false
        }],
        func: function(b, a, d, c) {
            if (!a) {
                TS.cmd_handlers.addTempEphemeralFeedback("Looks like you are trying to send us some feedback, but you didn't say anything!", b + " " + a);
                return
            }
            TS.generic_dialog.start({
                title: "Send feedback",
                body: '<p class="bold">Looks like you are trying to send us some feedback! Yes?</p>',
                show_cancel_button: true,
                show_go_button: true,
                go_button_text: "Yes, send it",
                on_go: function() {
                    TS.api.call("chat.command", {
                        agent: "webapp",
                        command: b,
                        text: a,
                        channel: TS.model.active_cid
                    }, TS.ui.onAPICommand)
                },
                on_cancel: function() {
                    TS.view.input_el.val(b + " " + a)
                }
            })
        }
    },
    "/shrug": {
        type: "client",
        autocomplete: true,
        alias_of: null,
        aliases: null,
        desc: "Appends Â¯\\_(ãƒ?_/Â¯ to your message",
        args: [{
            name: "your message",
            optional: true
        }],
        func: function(c, b, f, d) {
            var a = b || "";
            if (a && a.substr(a.length - 1) != " ") {
                a += " "
            }
            a += "Â¯\\_(ãƒ?_/Â¯ ";
            if (TS.model.active_channel_id) {
                TS.channels.sendMsg(TS.model.active_channel_id, a)
            } else {
                if (TS.model.active_im_id) {
                    TS.ims.sendMsg(TS.model.active_im_id, a)
                } else {
                    if (TS.model.active_group_id) {
                        TS.groups.sendMsg(TS.model.active_group_id, a)
                    }
                }
            }
        }
    },
    "/showfallbacks": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.model.show_attachment_fallback = !TS.model.show_attachment_fallback;
            TS.view.rebuildMsgs()
        }
    },
    "/macgap.app.enableDeveloperTools()": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            if (window.macgap && window.macgap.app && window.macgap.app.enableDeveloperTools) {
                macgap.app.enableDeveloperTools()
            }
        }
    },
    "/toggle_debugging_prefs": {
        type: "client",
        autocomplete: false,
        alias_of: null,
        aliases: null,
        desc: "",
        func: function(b, a, d, c) {
            TS.ui.debug_prefs_dialog.start()
        }
    }
});
TS.registerModule("stars", {
    member_stars_fetched_sig: new signals.Signal(),
    member_stars_being_fetched_sig: new signals.Signal(),
    onStart: function() {
        TS.files.team_file_changed_sig.add(TS.stars.teamFileChanged, TS.stars)
    },
    teamFileChanged: function(a) {
        if ("is_starred" in a) {
            TS.stars.updateFileStar(a.id, a.is_starred, a.id)
        }
    },
    maybeUpdateStarredItems: function() {
        if (TS.boot_data.app != "client") {
            return
        }
        if (!TS.model.team) {
            return
        }
        if (TS.stars.stars_being_fetched) {
            TS.stars.stars_needs_fetched = true;
            return
        }
        TS.stars.updateStarredItems()
    },
    stars_being_fetched: false,
    stars_needs_fetched: false,
    updateStarredItems: function() {
        TS.stars.stars_being_fetched = true;
        TS.stars.stars_needs_fetched = false;
        TS.stars.member_stars_being_fetched_sig.dispatch(TS.model.user, true);
        var a = true;
        TS.api.call("stars.list", {
            user: TS.model.user.id
        }, TS.stars.onFetchStarredItems, a)
    },
    fetchStarredItems: function(a, c) {
        if (a != TS.model.user.id) {
            alert("currently this should only be called for the current user; there are issues with is_starred that need to be fixed before we can handle starred items from another user");
            return
        }
        var b = {
            user: a,
            page: c || 1
        };
        TS.api.call("stars.list", b, TS.stars.onFetchStarredItems)
    },
    onFetchStarredItems: function(d, f, b) {
        TS.stars.stars_being_fetched = false;
        if (TS.stars.stars_needs_fetched) {
            setTimeout(TS.stars.maybeUpdateStarredItems, 100)
        }
        var h = TS.members.getMemberById(b.user);
        if (!h) {
            TS.stars.member_stars_being_fetched_sig.dispatch(TS.model.user, false);
            TS.error("no member? user:" + b.user);
            return
        }
        if (!d) {
            TS.error("failed fetchStarredItems");
            return
        }
        for (var c = 0; c < f.items.length; c++) {
            var e = f.items[c];
            if (h.id == TS.model.user.id) {
                if (TS.web && e.type == "message") {
                    var a = TS.shared.getModelObById(e.channel);
                    var g;
                    if (!a) {
                        TS.warn("onFetchStarredItems item.channel:" + e.channel + " not found")
                    } else {
                        if (!a.msgs) {
                            a.msgs = []
                        }
                        g = TS.utility.msgs.getMsg(e.message.ts, a.msgs);
                        if (!g) {
                            TS.utility.msgs.appendMsg(a.msgs, e.message)
                        }
                    }
                }
                TS.stars.starStatusHasChanged(true, e, "stars.list")
            } else {
                TS.activity.slurpStarItem(e, "stars.list")
            }
        }
        if (b.start_ts) {
            h.stars = h.stars.concat(f.items)
        } else {
            h.stars = f.items
        }
        TS.stars.member_stars_fetched_sig.dispatch(h)
    },
    starStatusHasChanged: function(f, c, e) {
        TS.activity.slurpStarItem(c, e);
        if (c.type == "message") {
            TS.stars.updateMsgStar(c.message.ts, c.channel, f)
        } else {
            if (c.type == "file") {
                if (c.file.is_starred != f) {
                    TS.stars.updateFileStar(c.file.id, f)
                }
            } else {
                if (c.type == "file_comment") {
                    if (c.comment.is_starred != f) {
                        TS.stars.updateFileCommentStar(c.comment.id, c.file.id, f)
                    }
                } else {
                    if (c.type == "channel") {
                        var b = TS.channels.getChannelById(c.channel);
                        if (!b) {
                            TS.warn("starStatusHasChanged channel_id:" + c.channel + " not found")
                        } else {
                            if (b.is_starred != f) {
                                TS.stars.updateChannelStar(c.channel, f)
                            }
                        }
                    } else {
                        if (c.type == "group") {
                            var d = TS.groups.getGroupById(c.channel);
                            if (!d) {
                                TS.warn("starStatusHasChanged group_id:" + c.channel + " not found")
                            } else {
                                if (d.is_starred != f) {
                                    TS.stars.updateGroupStar(c.channel, f)
                                }
                            }
                        } else {
                            if (c.type == "im") {
                                var a = TS.ims.getImById(c.channel);
                                if (!a) {
                                    TS.warn("starStatusHasChanged im_id:" + c.channel + " not found")
                                } else {
                                    if (a.is_starred != f) {
                                        TS.stars.updateImStar(c.channel, f)
                                    }
                                }
                            } else {
                                TS.error("starStatusHasChanged needs to handle star item type:" + c.type)
                            }
                        }
                    }
                }
            }
        }
    },
    checkForStarClick: function(g) {
        if (!g.target) {
            return
        }
        var d = $(g.target);
        var a;
        if (d.closest(".star").length) {
            a = d.closest(".star")
        } else {
            a = d.closest(".star_link")
        } if (!a.length) {
            return
        }
        if (a.hasClass("not-clickable")) {
            return
        }
        var f = a.hasClass("starred");
        var c = {};
        var b;
        if (a.hasClass("star_message")) {
            c.channel = a.data("c-id");
            c.timestamp = a.data("msg-id");
            b = function(e) {
                TS.stars.updateMsgStar(c.timestamp, c.channel, e)
            }
        } else {
            if (a.hasClass("star_file")) {
                c.file = a.data("file-id");
                b = function(e) {
                    TS.stars.updateFileStar(c.file, e)
                }
            } else {
                if (a.hasClass("star_file_comment")) {
                    c.file_comment = a.data("comment-id");
                    b = function(e) {
                        TS.stars.updateFileCommentStar(c.file_comment, a.data("file-id"), e)
                    }
                } else {
                    if (a.hasClass("star_channel")) {
                        c.channel = a.data("channel-id");
                        b = function(e) {
                            TS.stars.updateChannelStar(c.channel, e)
                        }
                    } else {
                        if (a.hasClass("star_group")) {
                            c.channel = a.data("group-id");
                            b = function(e) {
                                TS.stars.updateGroupStar(c.channel, e)
                            }
                        } else {
                            if (a.hasClass("star_im")) {
                                c.channel = a.data("im-id");
                                b = function(e) {
                                    TS.stars.updateImStar(c.channel, e)
                                }
                            } else {
                                TS.error("checkForStarClick doesn't know what to do with a click on " + a[0].outerHTML);
                                return
                            }
                        }
                    }
                }
            }
        }
        b(!f);
        if (f) {
            TS.api.call("stars.remove", c, function(h, j, e) {
                if (h) {
                    return
                }
                if (j.error == "not_starred") {
                    if (TS.client && TS.clientTS.model.team.domain == "tinyspeck") {
                        alert("tell eric not_starred (this message is for team tinyspeck only)")
                    }
                    b(false)
                } else {
                    b()
                }
            })
        } else {
            TS.api.call("stars.add", c, function(h, j, e) {
                if (h) {
                    return
                }
                if (j.error == "already_starred") {
                    if (TS.client && TS.model.team.domain == "tinyspeck") {
                        alert("tell eric already_starred (this message is for team tinyspeck only)")
                    }
                    b()
                } else {
                    b(false)
                }
            })
        }
    },
    updateMsgStar: function(d, c, f) {
        var b = TS.shared.getModelObById(c);
        var e;
        if (!b) {
            TS.warn("updateMsgStar c_id:" + c + " not found")
        } else {
            e = TS.utility.msgs.getMsg(d, b.msgs);
            if (!e) {}
        }
        var a = '.star_message[data-msg-id="' + d + '"][data-c-id="' + c + '"]';
        TS.stars.updateStar($(a), f, e, a);
        if (TS.client) {
            var b = TS.shared.getActiveModelOb();
            if (b) {
                TS.utility.msgs.maybeStoreMsgs(b.id, b.msgs)
            }
        }
    },
    updateFileCommentStar: function(c, d, e) {
        var b = TS.files.getFileById(d);
        var f;
        if (!b) {
            TS.warn("updateFileStar file_id:" + d + " not found")
        } else {
            f = TS.files.getFileCommentById(b, c)
        }
        var a = '.star_comment[data-comment-id="' + c + '"]';
        TS.stars.updateStar($(a), e, f, a);
        TS.files.makeSureReferencesGetSavedToLS(d)
    },
    updateFileStar: function(c, d) {
        var b = TS.files.getFileById(c);
        if (!b) {
            TS.warn("updateFileStar file_id:" + c + " not found")
        }
        var a = '.star_file[data-file-id="' + c + '"]';
        TS.stars.updateStar($(a), d, b, a);
        TS.files.makeSureReferencesGetSavedToLS(c)
    },
    updateChannelStar: function(b, d) {
        var c = TS.channels.getChannelById(b);
        if (!c) {
            TS.warn("updateChannelStar channel_id:" + b + " not found")
        }
        var a = '.star_channel[data-channel-id="' + b + '"]';
        TS.stars.updateStar($(a), d, c, a);
        if (TS.client) {
            TS.view.rebuildChannelList();
            TS.view.rebuildStarredList()
        }
    },
    updateGroupStar: function(b, d) {
        var c = TS.groups.getGroupById(b);
        if (!c) {
            TS.warn("updateGroupStar group_id:" + b + " not found")
        }
        var a = '.star_group[data-group-id="' + b + '"]';
        TS.stars.updateStar($(a), d, c, a);
        if (TS.client) {
            TS.view.rebuildGroupList();
            TS.view.rebuildStarredList()
        }
    },
    updateImStar: function(d, c) {
        var b = TS.ims.getImById(d);
        if (!b) {
            TS.warn("updateImStar im_id:" + d + " not found")
        }
        var a = '.star_im[data-im-id="' + d + '"]';
        TS.stars.updateStar($(a), c, b, a);
        if (TS.client) {
            TS.view.rebuildImList();
            TS.view.rebuildStarredList()
        }
    },
    updateStar: function(b, d, c, a) {
        if (d) {
            if (!b.hasClass("starred")) {
                b.addClass("starred")
            }
        } else {
            b.removeClass("starred")
        } if (c) {
            c.is_starred = d
        } else {}
    }
});
TS.registerModule("mentions", {
    mention_changed_sig: new signals.Signal(),
    mention_removed_sig: new signals.Signal(),
    mentions_fetched_sig: new signals.Signal(),
    mentions_being_fetched_sig: new signals.Signal(),
    mentions_being_fetched: false,
    mentions_needs_fetched: false,
    has_more: false,
    after_ts: null,
    onStart: function() {},
    maybeUpdateMentions: function() {
        if (TS.boot_data.app != "client") {
            return
        }
        if (!TS.model.team) {
            return
        }
        if (TS.mentions.mentions_being_fetched) {
            TS.mentions.mentions_needs_fetched = true;
            return
        }
        TS.mentions.updateMentions()
    },
    updateMentions: function() {
        TS.mentions.mentions_being_fetched = true;
        TS.mentions.mentions_needs_fetched = false;
        TS.mentions.mentions_being_fetched_sig.dispatch();
        var a = true;
        TS.api.call("activity.mentions", {}, TS.mentions.onFetchMentions, a)
    },
    fetchMoreMentions: function() {
        TS.mentions.fetchMentions(TS.mentions.after_ts)
    },
    fetchMentions: function(a) {
        a = a || "";
        TS.api.call("activity.mentions", {
            after_ts: a
        }, TS.mentions.onFetchMentions)
    },
    getMentionByMsgId: function(e, d, a) {
        for (var c = 0; c < TS.model.user.mentions.length; c++) {
            var b = TS.model.user.mentions[c];
            if (!b.message) {
                continue
            }
            if (b.message.ts == e) {
                if (d) {
                    TS.model.user.mentions[c].message = d
                } else {
                    if (a) {
                        TS.model.user.mentions.splice(c, 1)
                    }
                }
                return b
            }
        }
        return null
    },
    onFetchMentions: function(e, g, c) {
        TS.mentions.mentions_being_fetched = false;
        if (TS.mentions.mentions_needs_fetched) {
            setTimeout(TS.mentions.maybeUpdateMentions, 100)
        }
        if (!e) {
            TS.error("failed fetchMentions");
            return
        }
        var a = [];
        for (var d = 0; d < g.mentions.length; d++) {
            var b = g.mentions[d];
            var h = b.message;
            if (!h) {
                continue
            }
            if (h.subtype == "file_share" || h.subtype == "file_mention" || h.subtype == "file_comment") {
                if (!h.file) {
                    continue
                }
            }
            if (h.ts == "0000000000.000000") {
                TS.warn("bad mention! msg.ts == 0000000000.000000");
                continue
            }
            if (TS.mentions.getMentionByMsgId(h.ts, h)) {
                continue
            }
            a.push(b)
        }
        TS.model.user.mentions = TS.model.user.mentions.concat(a);

        function f(k, j) {
            if (k.message.ts < j.message.ts) {
                return 1
            }
            if (k.message.ts > j.message.ts) {
                return -1
            }
            return 0
        }
        TS.model.user.mentions.sort(f);
        if (TS.mentions.after_ts === null || c.after_ts) {
            TS.mentions.has_more = g.has_more;
            if (TS.model.user.mentions.length) {
                TS.mentions.after_ts = TS.model.user.mentions[TS.model.user.mentions.length - 1].message.ts
            }
        }
        TS.mentions.mentions_fetched_sig.dispatch()
    },
    replaceMsg: function(a) {
        var b = TS.mentions.getMentionByMsgId(a.ts, a);
        if (b) {
            TS.mentions.mention_changed_sig.dispatch(b)
        }
    },
    removeMsg: function(b) {
        var a = TS.mentions.getMentionByMsgId(b, null, true);
        if (a) {
            TS.mentions.mention_removed_sig.dispatch(b)
        }
    }
});
TS.registerModule("inline_imgs", {
    no_scrolling: false,
    onStart: function() {},
    shouldExpand: function(a, b) {
        if (TS.model.expandable_state["img_" + a + b.src]) {
            return true
        }
        if (TS.model.expandable_state["img_" + a + b.src] === false) {
            return false
        }
        if (!b.internal_file_id) {
            if (TS.model.prefs.obey_inline_img_limit && b.bytes > TS.model.inline_img_byte_limit) {
                return false
            }
            if (b.width && b.height) {
                if ((b.width * b.height) > TS.model.inline_img_pixel_limit) {
                    return false
                }
            }
        }
        if (b.internal_file_id) {
            return TS.model.prefs.expand_internal_inline_imgs
        }
        return TS.model.prefs.expand_inline_imgs
    },
    expandAllInCurrent: function() {
        TS.inline_imgs.no_scrolling = true;
        $(".msg_inline_img_expander").trigger("click");
        TS.inline_imgs.no_scrolling = false;
        if (TS.client) {
            TS.ui.instaScrollMsgsToBottom(false)
        }
    },
    collapseAllInCurrent: function() {
        $(".msg_inline_img_collapser").trigger("click")
    },
    expand: function(f, g) {
        TS.model.expandable_state["img_" + f + g] = true;
        TS.storage.storeExpandableState(TS.model.expandable_state);
        var a = "#" + TS.utility.makeSafeForDomId(f);
        var b = $(a);
        if (!b.length) {
            return
        }
        var d = (TS.client && TS.ui.areMsgsScrolledToBottom());
        var c = function(h) {
            return $(this).data("real-src") == g
        };
        var e = (TS.boot_data.feature_attachments_inline) ? b.find(".inline_attachment").filter(c) : null;
        if (!e || !e.length) {
            e = b.find(".msg_inline_img_holder").filter(c)
        }
        e.removeClass("hidden");
        b.find(".msg_inline_img_expander").filter(c).addClass("hidden");
        b.find(".msg_inline_img_collapser").filter(c).removeClass("hidden");
        b.find(".too_large_for_auto_expand").addClass("hidden");
        b.find(".inline_img_bytes").removeClass("hidden");
        if (TS.client) {
            TS.ui.checkInlineImgsEverywhere()
        }
        e.css("opacity", 0).stop().animate({
            opacity: 1
        }, 300);
        if (!TS.inline_imgs.no_scrolling) {
            if (TS.client && d) {
                TS.ui.instaScrollMsgsToBottom(false);
                e.scrollintoview({
                    duration: 0,
                    offset: "top",
                    px_offset: 10,
                    direction: "y"
                })
            } else {
                e.scrollintoview({
                    duration: 200,
                    offset: "bottom",
                    px_offset: -10,
                    direction: "y"
                })
            }
        }
        if (TS.client) {
            TS.ui.checkInlineImgsEverywhere()
        }
    },
    collapse: function(e, f) {
        TS.model.expandable_state["img_" + e + f] = false;
        TS.storage.storeExpandableState(TS.model.expandable_state);
        var a = "#" + TS.utility.makeSafeForDomId(e);
        var b = $(a);
        if (!b.length) {
            return
        }
        var c = function(g) {
            return $(this).data("real-src") == f
        };
        var d = (TS.boot_data.feature_attachments_inline) ? b.find(".inline_attachment").filter(c) : null;
        if (!d || !d.length) {
            d = b.find(".msg_inline_img_holder").filter(c)
        }
        d.css("visibility", "hidden");
        b.find(".msg_inline_img_expander").filter(c).removeClass("hidden");
        b.find(".msg_inline_img_collapser").filter(c).addClass("hidden");
        setTimeout(function() {
            d.addClass("hidden");
            d.css("visibility", "visible")
        }, 200)
    },
    checkForInlineImgClick: function(g, b) {
        if (!g.target) {
            return
        }
        var c = $(g.target);
        var a = c.closest(".message").data("ts");
        var f = TS.templates.makeMsgDomId(a);
        if ((!a && b) || (TS.boot_data.feature_search_extracts && b)) {
            a = c.closest(".search_message_result").data("ts");
            f = TS.templates.makeMSRDomId(b)
        }
        if (!a) {
            return
        }
        a = a.toString();
        var d = c.closest(".too_large_but_expand_anyway");
        if (d.length) {
            g.preventDefault();
            TS.inline_imgs.expand(f, d.data("real-src"))
        }
        var j = c.closest(".msg_inline_img_expander");
        if (j.length) {
            g.preventDefault();
            TS.inline_imgs.expand(f, j.data("real-src"))
        }
        var h = c.closest(".msg_inline_img_collapser");
        if (h.length) {
            g.preventDefault();
            TS.inline_imgs.collapse(f, h.data("real-src"))
        }
    },
    makeInternalInlineImg: function(c, b) {
        var e = 400;
        var a = 500;
        if (TS.model.inline_imgs[c]) {
            b.internal_file_id = TS.model.inline_imgs[c].internal_file_id || b.internal_file_id;
            b.link_url = TS.model.inline_imgs[c].link_url || b.link_url;
            b.src = TS.model.inline_imgs[c].src || b.src
        }
        TS.model.inline_imgs[c] = b;
        b.src = b.src || c;
        b.bytes = parseInt(b.bytes);
        b.width = b.display_w = parseInt(b.width);
        b.height = b.display_h = parseInt(b.height);
        if (b.display_w > e) {
            b.display_w = e;
            b.display_h = parseInt(b.height * (b.display_w / b.width))
        }
        if (b.display_h > a) {
            b.display_h = a;
            b.display_w = parseInt(b.width * (b.display_h / b.height))
        }
        var d = TS.utility.getImgProxyURL(b.src, b.display_w, b.display_h);
        if (d != b.src) {
            b.proxied_src = d
        } else {
            delete b.proxied_src
        }
    }
});
TS.registerModule("inline_videos", {
    no_scrolling: false,
    onStart: function() {},
    shouldExpand: function(b, a) {
        if (TS.model.expandable_state["vid_" + b + a.src]) {
            return true
        }
        if (TS.model.expandable_state["vid_" + b + a.src] === false) {
            return false
        }
        if (a.internal_file_id) {
            return TS.model.prefs.expand_internal_inline_imgs
        }
        return TS.model.prefs.expand_inline_imgs
    },
    expandAllInCurrent: function() {
        TS.inline_videos.no_scrolling = true;
        $(".msg_inline_video_expander").trigger("click");
        TS.inline_videos.no_scrolling = false;
        if (TS.client) {
            TS.ui.instaScrollMsgsToBottom(false)
        }
    },
    collapseAllInCurrent: function() {
        $(".msg_inline_video_collapser").trigger("click")
    },
    expand: function(f, g) {
        TS.model.expandable_state["vid_" + f + g] = true;
        TS.storage.storeExpandableState(TS.model.expandable_state);
        var a = "#" + TS.utility.makeSafeForDomId(f);
        var b = $(a);
        if (!b.length) {
            return
        }
        var d = (TS.client && TS.ui.areMsgsScrolledToBottom());
        var c = function(h) {
            return $(this).data("real-src") == g
        };
        var e = (TS.boot_data.feature_attachments_inline) ? b.find(".inline_attachment").filter(c) : null;
        if (!e || !e.length) {
            e = b.find(".msg_inline_video_holder").filter(c)
        }
        e.find(".msg_inline_video_thumb_div").removeClass("hidden");
        e.removeClass("hidden");
        b.find(".msg_inline_video_expander").filter(c).addClass("hidden");
        b.find(".msg_inline_video_collapser").filter(c).removeClass("hidden");
        if (TS.client) {
            TS.ui.checkInlineImgsEverywhere()
        }
        e.css("opacity", 0).stop().animate({
            opacity: 1
        }, 300);
        if (!TS.inline_videos.no_scrolling) {
            if (TS.client && d) {
                TS.ui.instaScrollMsgsToBottom(false);
                b.children().first().scrollintoview({
                    duration: 0,
                    offset: "top",
                    px_offset: 10,
                    direction: "y"
                })
            } else {
                b.find(".msg_inline_video").last().scrollintoview({
                    duration: 200,
                    offset: "bottom",
                    px_offset: -10,
                    direction: "y"
                })
            }
        }
        if (TS.client) {
            TS.ui.checkInlineImgsEverywhere()
        }
    },
    collapse: function(e, f) {
        TS.model.expandable_state["vid_" + e + f] = false;
        TS.storage.storeExpandableState(TS.model.expandable_state);
        var a = "#" + TS.utility.makeSafeForDomId(e);
        var b = $(a);
        if (!b.length) {
            return
        }
        var c = function(g) {
            return $(this).data("real-src") == f
        };
        var d = (TS.boot_data.feature_attachments_inline) ? b.find(".inline_attachment").filter(c) : null;
        if (!d || !d.length) {
            d = b.find(".msg_inline_video_holder").filter(c)
        }
        d.css("visibility", "hidden");
        b.find(".msg_inline_video_expander").filter(c).removeClass("hidden");
        b.find(".msg_inline_video_collapser").filter(c).addClass("hidden");
        d.find(".msg_inline_video_iframe_div").html("");
        setTimeout(function() {
            d.addClass("hidden");
            d.css("visibility", "visible")
        }, 200)
    },
    checkForInlineVideoClick: function(l, k) {
        if (!l.target) {
            return
        }
        var o = $(l.target);
        var f = o.closest(".message").data("ts");
        var h = TS.templates.makeMsgDomId(f);
        if (!f && k) {
            f = o.closest(".search_message_result").data("ts");
            h = TS.templates.makeMSRDomId(k)
        }
        if (!f) {
            return
        }
        f = f.toString();
        var j = o.closest(".msg_inline_video_expander");
        if (j.length) {
            l.preventDefault();
            TS.inline_videos.expand(h, j.data("real-src"));
            return
        }
        var n = o.closest(".msg_inline_video_collapser");
        if (n.length) {
            l.preventDefault();
            TS.inline_videos.collapse(h, n.data("real-src"));
            return
        }
        var b = o.closest(".msg_inline_video_play_button");
        if (b.length) {
            var d = b.closest(".msg_inline_video_holder");
            var m = d.find(".msg_inline_video_iframe_div");
            m.removeClass("hidden");
            d.find(".msg_inline_video_thumb_div").addClass("hidden");
            var a = m.data("url");
            var c = TS.model.inline_videos[a];
            if (!c) {
                var g = a.replace(/\&/g, "&amp;");
                c = TS.model.inline_videos[g]
            }
            if (c) {
                m.html(c.html)
            } else {
                m.html('<div style="padding:10px; color:white">Error: unable to find "' + TS.utility.htmlEntities(a) + '" in TS.model.inline_videos</div>')
            }
            return
        }
    },
    makeInternalInlineVideo: function(b, c) {
        var e = 400;
        var a = 500;
        TS.model.inline_videos[b] = c;
        c.src = c.thumbnail.url || b;
        c.width = c.display_w = parseInt(c.thumbnail.width);
        c.height = c.display_h = parseInt(c.thumbnail.height);
        if (c.display_w > e) {
            c.display_w = e;
            c.display_h = parseInt(c.height * (c.display_w / c.width))
        }
        if (c.display_h > a) {
            c.display_h = a;
            c.display_w = parseInt(c.width * (c.display_h / c.height))
        }
        if (!c.html) {
            c.html = "MISSING video.html"
        }
        c.html = c.html.replace("http://", "//");
        if (c.html.indexOf("oldwidth") == -1) {
            c.html = c.html.replace(" width=", ' width="' + c.display_w + '" oldwidth=');
            c.html = c.html.replace(" height=", ' height="' + c.display_h + '" oldheight=')
        }
        if (c.html.indexOf("autoplay") == -1) {
            c.html = c.html.replace("feature=oembed", "feature=oembed&autoplay=1");
            c.html = c.html.replace('" width', '?autoplay=1" width')
        }
        var d = TS.utility.getImgProxyURL(c.src, c.display_w, c.display_h);
        if (d != c.src) {
            c.proxied_src = d
        } else {
            delete c.proxied_src
        }
    }
});
TS.registerModule("inline_attachments", {
    no_scrolling: false,
    onStart: function() {},
    shouldExpand: function(b, a) {
        if (TS.model.expandable_state["attach_" + b + a.from_url]) {
            return true
        }
        if (TS.model.expandable_state["attach_" + b + a.from_url] === false) {
            return false
        }
        return true
    },
    shouldShow: function(b, a) {
        if (!b.from_url) {
            return true
        }
        if (a && a.text) {
            if (a.text.indexOf(b.from_url) == -1 && a.text.indexOf(b.from_url.replace(/\&/g, "&amp;")) == -1) {
                return true
            }
        }
        if (TS.model.prefs.expand_inline_imgs) {
            if (b.audio_html) {
                return true
            }
            if (b.video_html) {
                return true
            }
            if (b.image_url) {
                return true
            }
            if (b.service_name && b.service_name.toString().toLowerCase() == "twitter") {
                return true
            }
        }
        return !!TS.model.prefs.expand_non_media_attachments
    },
    expandAllInCurrent: function() {
        TS.inline_attachments.no_scrolling = true;
        $(".msg_inline_attachment_expander").trigger("click");
        TS.inline_attachments.no_scrolling = false;
        if (TS.client) {
            TS.ui.instaScrollMsgsToBottom(false)
        }
    },
    collapseAllInCurrent: function() {
        $(".msg_inline_attachment_collapser").trigger("click")
    },
    expand: function(f, g) {
        TS.model.expandable_state["attach_" + f + g] = true;
        TS.storage.storeExpandableState(TS.model.expandable_state);
        var a = "#" + TS.utility.makeSafeForDomId(f);
        var b = $(a);
        if (!b.length) {
            return
        }
        var d = (TS.client && TS.ui.areMsgsScrolledToBottom());
        var c = function(h) {
            return $(this).data("real-src") == g
        };
        var e = b.find(".inline_attachment").filter(c);
        e.removeClass("hidden");
        b.find(".msg_inline_attachment_expander").filter(c).addClass("hidden");
        b.find(".msg_inline_attachment_collapser").filter(c).removeClass("hidden");
        if (TS.client) {
            TS.ui.checkInlineImgsEverywhere()
        }
        e.css("opacity", 0).stop().animate({
            opacity: 1
        }, 300);
        if (!TS.inline_attachments.no_scrolling) {
            if (TS.client && d) {
                TS.ui.instaScrollMsgsToBottom(false);
                b.children().first().scrollintoview({
                    duration: 0,
                    offset: "top",
                    px_offset: 10,
                    direction: "y"
                })
            } else {
                e.scrollintoview({
                    duration: 200,
                    offset: "bottom",
                    px_offset: -10,
                    direction: "y"
                })
            }
        }
        if (TS.client) {
            TS.ui.checkInlineImgsEverywhere()
        }
    },
    collapse: function(e, f) {
        TS.model.expandable_state["attach_" + e + f] = false;
        TS.storage.storeExpandableState(TS.model.expandable_state);
        var a = "#" + TS.utility.makeSafeForDomId(e);
        var b = $(a);
        if (!b.length) {
            return
        }
        var c = function(g) {
            return $(this).data("real-src") == f
        };
        var d = b.find(".inline_attachment").filter(c);
        if (!d.length) {
            d = b.find(".msg_inline_attachment_holder").filter(c)
        }
        d.css("visibility", "hidden");
        b.find(".msg_inline_attachment_expander").filter(c).removeClass("hidden");
        b.find(".msg_inline_attachment_collapser").filter(c).addClass("hidden");
        setTimeout(function() {
            d.addClass("hidden");
            d.css("visibility", "visible")
        }, 200)
    },
    checkForInlineAttachmentClick: function(q, h) {
        if (!q.target) {
            return
        }
        var t = $(q.target);
        var o = t.closest(".message").data("ts");
        var m = TS.templates.makeMsgDomId(o);
        if (!o && h) {
            o = t.closest(".search_message_result").data("ts");
            m = TS.templates.makeMSRDomId(h)
        }
        if (!o) {
            return
        }
        o = o.toString();
        var r = t.closest(".msg_inline_attachment_expander");
        if (r.length) {
            q.preventDefault();
            TS.inline_attachments.expand(m, r.data("real-src"))
        }
        var p = t.closest(".msg_inline_attachment_collapser");
        if (p.length) {
            q.preventDefault();
            TS.inline_attachments.collapse(m, p.data("real-src"))
        }
        var n = t.closest(".rest_text_expander");
        if (n.length) {
            q.preventDefault();
            var a = (TS.client && TS.ui.areMsgsScrolledToBottom());
            var b = n.parent().find(".short_text");
            b.html(b.data("all-text"));
            b.data("all-text", "");
            b.css("opacity", 0).transition({
                opacity: 1
            }, 300);
            n.css("display", "none");
            TS.inline_attachments.rest_texts_expanded[n.attr("id")] = true;
            if (TS.client) {
                TS.ui.updateClosestMonkeyScroller(b)
            }
            if (TS.client && a) {
                TS.ui.instaScrollMsgsToBottom(false);
                b.scrollintoview({
                    duration: 0,
                    offset: "top",
                    px_offset: 10,
                    direction: "y"
                })
            }
        }
        var l = t.closest(".delete_attachment_link");
        if (l.length) {
            q.preventDefault();
            var d = l.data("attachment-id").toString();
            var k = TS.shared.getActiveModelOb();
            if (!k) {
                alert("missing model_ob");
                return
            }
            if (!d) {
                alert("missing attachment-id");
                return
            }
            var s = k.id;
            var g = TS.utility.msgs.getMsg(o, k.msgs);
            var f = "";
            if (TS.model.user.is_admin) {
                var j = TS.inline_attachments.getAttachmentById(g.attachments, d);
                if (j && j.from_url) {
                    var c = TS.inline_attachments.makeBlackListSelect(j.from_url);
                    f = '						<p class="large_left_margin ' + (c ? "no_bottom_margin" : "") + '">							<label class="checkbox normal" style="font-size: 16px;">								<input id="attachment_blacklist_cb" type="checkbox" class="small_right_margin" />								Disable future attachments from this website?</label>';
                    if (c) {
                        f += c
                    }
                    f += "</p>"
                }
            }
            TS.generic_dialog.start({
                title: "Remove attachment",
                body: '<p class="' + (f ? "small_bottom_margin" : "") + '">Are you sure you wish to remove this attachment from the message?</p>' + f,
                go_button_text: "Yes, remove",
                on_show: function() {
                    $("#attachment_blacklist_cb").bind("change", function() {
                        var e = !!$("#attachment_blacklist_cb").prop("checked");
                        TS.info(e);
                        if (e) {
                            $("#attachment_blacklist_select").prop("disabled", false)
                        } else {
                            $("#attachment_blacklist_select").prop("disabled", true)
                        }
                    })
                },
                on_go: function() {
                    var w = !!$("#attachment_blacklist_cb").prop("checked");
                    var u = w ? $("#attachment_blacklist_select").val() : "none";
                    var e = w ? $("#attachment_blacklist_select").find(":selected").data("url") : "";
                    var v = {
                        channel: s,
                        ts: o,
                        attachment: d,
                        blacklist: w,
                        blacklist_type: u,
                        blacklist_url: e
                    };
                    TS.dir(0, v);
                    TS.api.call("chat.deleteAttachment", v, function(y, z, x) {
                        if (y) {
                            if (TS.web) {
                                g.attachments = TS.inline_attachments.removeAttachmentById(g.attachments, d);
                                TS.utility.msgs.replaceMsg(k, g)
                            }
                        } else {
                            TS.generic_dialog.alert("Attachment removing failed!")
                        }
                    })
                }
            })
        }
    },
    makeBlackListSelect: function(a) {
        if (!a) {
            return ""
        }
        a = TS.utility.htmlEntities(a).replace("https://", "").replace("http://", "");
        var b = "";
        var g = a.split("/");
        var f = g[0];
        var e = g[g.length - 1];
        b += '<select id="attachment_blacklist_select" disabled="disabled" class="input-xlarge">\r';
        b += '<option value="all" data-url="' + f + '">All links from ' + f + "</option>\r";
        b += '<option value="just" data-url="' + a + '">Just the link ' + a + "</option>\r";
        if (e != f) {
            TS.info(e);
            var d = g.concat();
            d.length = d.length - 1;
            var c = d.join("/");
            if (c != f) {
                c += "/";
                b += '<option value="under" data-url="' + c + '">All links under ' + c + "</option>\r"
            }
        }
        b += "</select>\r";
        return b
    },
    rest_texts_expanded: {},
    shouldExpandText: function(a) {
        return !!TS.inline_attachments.rest_texts_expanded[a]
    },
    makeInternalInlineAttachment: function(a, b) {
        TS.model.inline_attachments[a] = b
    },
    massageAttachment: function(f, j) {
        f._index = j;
        if ("id" in f) {
            f.id = f.id.toString()
        }
        var h = 500;
        var p = 3;
        var a = "";
        if (f.text) {
            var o = "";
            var n = "";
            var k;
            var m = 0;
            var d = false;
            for (var b = 0; b < f.text.length; b++) {
                k = f.text.charAt(b);
                if (n || k == "<") {
                    n += k;
                    if (k == ">") {
                        a += n;
                        n = "";
                        if (a.length > h) {
                            d = true
                        }
                    }
                } else {
                    if (k == "\n") {
                        m++
                    }
                    if (m > p + 1) {
                        o = f.text.replace(a, "");
                        break
                    }
                    a += k;
                    if (a.length > h) {
                        d = true
                    }
                    if (d && k == " ") {
                        o = f.text.replace(a, "");
                        break
                    }
                }
            }
            f._short_text = (a == f.text) ? "" : a;
            var e = a.match(/```/g);
            var l = o.match(/```/g);
            if (e && l) {
                f._short_text += "```"
            }
        }
        f._floated_thumb_display_height = 75;
        f._floated_thumb_display_width = 75;
        if (f.thumb_height && f.thumb_width) {
            if (f.thumb_height > f.thumb_width) {
                f._floated_thumb_display_width = parseInt(f.thumb_width * (f._floated_thumb_display_height / f.thumb_height))
            } else {
                f._floated_thumb_display_height = parseInt(f.thumb_height * (f._floated_thumb_display_width / f.thumb_width))
            }
            var g = TS.utility.getImgProxyURL(f.thumb_url, f._floated_thumb_display_width, f._floated_thumb_display_height);
            if (g != f.thumb_url) {
                f.proxied_thumb_url = g
            } else {
                delete f.proxied_thumb_url
            }
        }
    },
    getAttachmentByFromUrl: function(a, b) {
        if (!a) {
            return null
        }
        for (var c = 0; c < a.length; c++) {
            if (!a[c]) {
                TS.info(b);
                TS.dir(0, a);
                continue
            }
            if (a[c].from_url == b) {
                return a[c]
            }
        }
        return null
    },
    getAttachmentBySlackFileId: function(a, b) {
        if (!a) {
            return null
        }
        if (!b) {
            return null
        }
        for (var c = 0; c < a.length; c++) {
            if (!a[c]) {
                continue
            }
            if (a[c].slack_file_id == b) {
                return a[c]
            }
        }
        return null
    },
    removeAttachmentById: function(b, d) {
        if (!b) {
            return null
        }
        var a = [];
        for (var c = 0; c < b.length; c++) {
            if (b[c].id != d) {
                a.push(b[c])
            }
        }
        return a
    },
    getAttachmentById: function(a, c) {
        if (!a) {
            return null
        }
        for (var b = 0; b < a.length; b++) {
            if (a[b].id == c) {
                return a[b]
            }
        }
        return null
    }
});
TS.registerModule("inline_audios", {
    no_scrolling: false,
    onStart: function() {},
    shouldExpand: function(b, a) {
        if (TS.model.expandable_state["aud_" + b + a.src]) {
            return true
        }
        if (TS.model.expandable_state["aud_" + b + a.src] === false) {
            return false
        }
        if (a.internal_file_id) {
            return TS.model.prefs.expand_internal_inline_imgs
        }
        return TS.model.prefs.expand_inline_imgs
    },
    expandAllInCurrent: function() {
        TS.inline_audios.no_scrolling = true;
        $(".msg_inline_audio_expander").trigger("click");
        TS.inline_audios.no_scrolling = false;
        if (TS.client) {
            TS.ui.instaScrollMsgsToBottom(false)
        }
    },
    collapseAllInCurrent: function() {
        $(".msg_inline_audio_collapser").trigger("click")
    },
    expand: function(f, g) {
        TS.model.expandable_state["aud_" + f + TS.utility.htmlEntities(g)] = true;
        TS.storage.storeExpandableState(TS.model.expandable_state);
        var a = "#" + TS.utility.makeSafeForDomId(f);
        var b = $(a);
        if (!b.length) {
            return
        }
        var d = (TS.client && TS.ui.areMsgsScrolledToBottom());
        var c = function(h) {
            return $(this).data("real-src") == g
        };
        var e = (TS.boot_data.feature_attachments_inline) ? b.find(".inline_attachment").filter(c) : null;
        if (!e || !e.length) {
            e = b.find(".msg_inline_audio_holder").filter(c)
        }
        e.removeClass("hidden");
        b.find(".msg_inline_audio_expander").filter(c).addClass("hidden");
        b.find(".msg_inline_audio_collapser").filter(c).removeClass("hidden");
        if (TS.client) {
            TS.ui.checkInlineImgsEverywhere()
        }
        e.css("opacity", 0).stop().animate({
            opacity: 1
        }, 300);
        if (!TS.inline_audios.no_scrolling) {
            if (TS.client && d) {
                TS.ui.instaScrollMsgsToBottom(false);
                b.children().first().scrollintoview({
                    duration: 0,
                    offset: "top",
                    px_offset: 10,
                    direction: "y"
                })
            } else {
                b.find(".msg_inline_audio").last().scrollintoview({
                    duration: 200,
                    offset: "bottom",
                    px_offset: -10,
                    direction: "y"
                })
            }
        }
        if (TS.client) {
            TS.ui.checkInlineImgsEverywhere()
        }
    },
    collapse: function(e, f) {
        TS.model.expandable_state["aud_" + e + TS.utility.htmlEntities(f)] = false;
        TS.storage.storeExpandableState(TS.model.expandable_state);
        var a = "#" + TS.utility.makeSafeForDomId(e);
        var b = $(a);
        if (!b.length) {
            return
        }
        var c = function(g) {
            return $(this).data("real-src") == f
        };
        var d = (TS.boot_data.feature_attachments_inline) ? b.find(".inline_attachment").filter(c) : null;
        if (!d || !d.length) {
            d = b.find(".msg_inline_audio_holder").filter(c)
        }
        d.css("visibility", "hidden");
        b.find(".msg_inline_audio_expander").filter(c).removeClass("hidden");
        b.find(".msg_inline_audio_collapser").filter(c).addClass("hidden");
        d.find(".msg_inline_audio_iframe_div").html("");
        setTimeout(function() {
            d.addClass("hidden");
            d.css("visibility", "visible")
        }, 200)
    },
    checkForInlineAudioClick: function(h, g) {
        if (!h.target) {
            return
        }
        var k = $(h.target);
        var c = k.closest(".message").data("ts");
        var d = TS.templates.makeMsgDomId(c);
        if (!c && g) {
            c = k.closest(".search_message_result").data("ts");
            d = TS.templates.makeMSRDomId(g)
        }
        if (!c) {
            return
        }
        c = c.toString();
        var j = k.closest(".msg_inline_audio_expander");
        if (j.length) {
            h.preventDefault();
            TS.inline_audios.expand(d, j.data("real-src"))
        }
        var f = k.closest(".msg_inline_audio_collapser");
        if (f.length) {
            h.preventDefault();
            TS.inline_audios.collapse(d, f.data("real-src"))
        }
        var b = k.closest(".inline_audio_play_link");
        if (b.length) {
            h.preventDefault();
            var a = b.attr("href");
            return alert("play " + a);
            soundManager.createSound({
                url: a,
                autoPlay: true,
                multiShot: false
            })
        }
    },
    makeInternalInlineAudio: function(a, b) {
        if (!b.audio_html) {
            return
        }
        TS.model.inline_audios[a] = {
            src: TS.utility.htmlEntities(b.audio_url || b.audio_html),
            attachment: b
        }
    }
});
TS.registerModule("newxp", {
    slideshow_state: {
        slide: 1,
        count: -1
    },
    onStart: function() {},
    shouldShowFirstWelcome: function() {
        if (!TS.model.welcome_model_ob.id) {
            return false
        }
        var a = TS.shared.getActiveModelOb();
        if (!a) {
            return false
        }
        if (a.id == TS.model.welcome_model_ob.id) {
            return true
        }
        return false
    },
    updateStartChecks: function() {
        if (!TS.model.user.is_admin) {
            return
        }
        if (TS.model.prefs.has_invited) {
            $("#welcome_start_invite").find(".check").removeClass("fa-square-o").addClass("fa-check")
        }
        if (TS.model.prefs.has_uploaded) {
            $("#welcome_start_upload").find(".check").removeClass("fa-square-o").addClass("fa-check")
        }
        if (TS.model.prefs.has_created_channel) {
            $("#welcome_start_channel").find(".check").removeClass("fa-square-o").addClass("fa-check")
        }
    },
    initSlideShow: function() {
        if (TS.model.user.is_ultra_restricted) {
            var c = TS.channels.getChannelsForUser();
            var e = "";
            var f = "";
            if (c.length) {
                e = "#" + c[0].name;
                f = "channel"
            } else {
                var b = TS.groups.getUnarchivedGroups();
                if (b.length) {
                    e = b[0].name;
                    f = "group"
                }
            }
            $("#ura_channel_name").html("<b>" + e + "</b> " + f)
        }
        var a = $("#end_display_welcome_general_div");
        var g = $("#welcome_slides_nav");
        var d = $("#welcome_slides_dots");
        var h = TS.newxp.slideshow_state;
        h.count = a.find(".welcome_slide").length;
        if (TS.model.prefs.seen_welcome_2) {
            h.slide = h.count
        } else {
            TS.model.seen_welcome_2_this_session = true
        }
        g.find(".welcome_slides_back").bind("click.slideshow", TS.newxp.slideShowBack);
        g.find(".welcome_slides_continue").bind("click.slideshow", TS.newxp.slideShowContinue);
        g.find(".welcome_slides_done").bind("click.slideshow", TS.newxp.slideShowContinue);
        d.find("a").bind("click.slideshow", function() {
            TS.newxp.slideShowSlideFromDot($(this).data("slide"))
        });
        if (h.count < 3) {
            d.css({
                visibility: "hidden"
            })
        }
        TS.newxp.slideShowTransition(true)
    },
    slideShowTransition: function(g) {
        var a = $("#end_display_welcome_general_div");
        var d = $("#welcome_slides_nav");
        var b = $("#welcome_slides_dots");
        var e = TS.newxp.slideshow_state;
        a.find(".welcome_slide").addClass("hidden");
        var f = a.find("#welcome_slide_" + e.slide);
        if (g) {
            f.removeClass("hidden").css("opacity", 100)
        } else {
            f.removeClass("hidden").css("opacity", 0).transition({
                opacity: 100
            }, 400)
        }
        d.find(".welcome_slides_back").addClass("hidden");
        d.find(".welcome_slides_continue").addClass("hidden");
        d.find(".welcome_slides_done").addClass("hidden");
        b.find("a").removeClass("active");
        var c = false;
        if (e.slide == e.count - 1) {
            if (c) {
                d.find(".welcome_slides_back").removeClass("hidden")
            }
            d.find(".welcome_slides_done").removeClass("hidden");
            b.find('a[data-slide="2"]').addClass("active")
        } else {
            if (e.slide == 1) {
                d.find(".welcome_slides_continue").removeClass("hidden");
                b.find('a[data-slide="1"]').addClass("active")
            } else {
                if (e.slide == e.count) {
                    if (c) {
                        d.find(".welcome_slides_back").removeClass("hidden")
                    }
                    if (!TS.model.prefs.seen_welcome_2) {
                        TS.prefs.setPrefByAPI({
                            name: "seen_welcome_2",
                            value: true
                        })
                    }
                    b.addClass("hidden").find('a[data-slide="3"]').addClass("active");
                    TS.model.prefs.seen_welcome_2 = true
                } else {
                    if (c) {
                        d.find(".welcome_slides_back").removeClass("hidden")
                    }
                    d.find(".welcome_slides_continue").removeClass("hidden")
                }
            }
        }
    },
    slideShowBack: function() {
        var a = TS.newxp.slideshow_state;
        if (a.slide == 1) {
            return
        }
        a.slide--;
        TS.newxp.slideShowSlide(a.slide)
    },
    slideShowContinue: function() {
        var a = TS.newxp.slideshow_state;
        if (a.slide == a.count) {
            return
        }
        a.slide++;
        TS.newxp.slideShowSlide(a.slide)
    },
    slideShowSlideFromDot: function(b) {
        var a = TS.newxp.slideshow_state;
        if (a.slide == b) {
            return
        }
        TS.newxp.slideShowSlide(b)
    },
    slideShowSlide: function(g) {
        var a = TS.newxp.slideshow_state;
        var e = g == a.count;
        if (e) {
            var f = $("#welcome_slides_nav");
            TS.tips.animateInInititalThrobbers(f.find(".welcome_slides_done"))
        }
        a.slide = g;
        TS.newxp.slideShowTransition();
        if (e) {
            TS.view.unAdjustForWelcomeSlideShow(true);
            var b = TS.model.welcome_model_ob;
            if (!b.id) {
                return
            }
            var h = 0;
            for (var c = 0; c < b.msgs.length; c++) {
                if (b.msgs[c].no_display) {
                    continue
                }
                h++
            }
            if (h && TS.view.msgs_scroller_div[0].scrollHeight > TS.view.msgs_scroller_div[0].clientHeight) {
                var d = (TS.utility.msgs.getOlderMsgsStatus(b).more) ? "+" : "";
                var j = (h == 1) ? "is 1 message" : "are " + h + d + " messages";
                $("#scroll_to_general_bottom").removeClass("hidden").html("There " + j + " in " + b.name + '. <a style="cursor:pointer">Click to scroll down</a>').find("a").bind("click", function() {
                    $("#scroll_to_general_bottom").addClass("hidden");
                    TS.ui.slowScrollMsgsToBottom();
                    if (d) {
                        TS.view.updateEndMarker();
                        TS.view.padOutMsgsScroller()
                    }
                })
            }
        }
    }
});
TS.registerModule("comments", {
    onStart: function() {}
});
TS.registerModule("comments.ui", {
    editing_file: null,
    editing_comment: null,
    editing: false,
    $edit_form: null,
    bound: false,
    onStart: function() {
        TS.comments.ui.$edit_form = $("#file_edit_comment_form");
        TS.comments.ui.bindInput($("#file_comment"))
    },
    bindInput: function(a, b) {
        a.TS_tabComplete2({
            complete_cmds: false,
            complete_channels: true,
            complete_emoji: true,
            complete_member_specials: true,
            onComplete: function(c) {
                TS.utility.populateInput(a, c)
            }
        });
        a.bind("keydown.cmd_submit", function(c) {
            if (c.which == TS.utility.keymap.enter && TS.utility.cmdKey(c)) {
                if (b) {
                    b()
                } else {
                    $(this).closest("form").submit()
                }
                c.preventDefault()
            }
        })
    },
    bindEditForm: function() {
        TS.comments.ui.bound = true;
        var a = TS.comments.ui.$edit_form;
        $("#file_edit_comment").css("overflow", "hidden").autogrow();
        TS.comments.ui.bindInput($("#file_edit_comment"));
        a.unbind("submit").bind("submit", TS.comments.ui.submitEditForm);
        a.find(".save").unbind("click").bind("click", function(b) {
            TS.comments.ui.submitEditForm();
            return false
        });
        a.find(".cancel").unbind("click").bind("click", function(b) {
            TS.comments.ui.onEndEdit();
            return false
        });
        a.unbind("destroyed").bind("destroyed", function() {
            $("#file_comment_form").after($(this)[0].outerHTML);
            TS.comments.ui.$edit_form = $("#file_edit_comment_form");
            TS.comments.ui.bound = false;
            if (!TS.comments.ui.editing) {
                return
            }
            TS.comments.ui.onEndEdit()
        })
    },
    submitEditForm: function() {
        var a = $("#file_edit_comment").val();
        if (!$.trim(a)) {
            if (TS.client) {
                TS.ui.playSound("beep")
            }
            return false
        }
        TS.comments.ui.saveEdit();
        return false
    },
    startEdit: function(c, b) {
        if (TS.comments.ui.editing) {
            TS.comments.ui.onEndEdit()
        }
        var a = TS.files.getFileById(c);
        if (!a) {
            TS.error("no file?");
            return null
        }
        var f = TS.files.getFileCommentById(a, b);
        if (!f) {
            TS.error("no comment?");
            return null
        }
        var e = TS.comments.ui.$edit_form;
        var d = $("#" + f.id);
        if (!d.length) {
            TS.error("no #" + f.id + "?");
            return
        }
        d.find(".comment_meta").addClass("hidden");
        d.find(".comment_body").addClass("hidden").after(e);
        $("#file_edit_comment").val("").css("height", "");
        if (!TS.comments.ui.bound) {
            TS.comments.ui.bindEditForm()
        }
        e.removeClass("hidden");
        $("#file_edit_comment").val(TS.format.unFormatMsg(f.comment)).focus().setCursorPosition(1000000).trigger("keyup");
        $("#file_comment_form").css("visibility", "hidden");
        TS.comments.ui.editing = true;
        TS.comments.ui.editing_file = a;
        TS.comments.ui.editing_comment = f
    },
    saveEdit: function() {
        var a = TS.comments.ui.editing_file;
        var e = TS.comments.ui.editing_comment;
        var b = $("#" + e.id);
        var d = $("#file_edit_comment").val();
        if (d != e.comment) {
            var c = e.comment;
            e.comment = d;
            b.find(".comment_body").html(TS.format.formatMsg(TS.utility.htmlEntities(e.comment)));
            TS.api.call("files.comments.edit", {
                file: a.id,
                id: e.id,
                comment: TS.format.cleanMsg(d)
            }, function(g, h, f) {
                if (!g) {
                    e.comment = c;
                    b.find(".comment_body").html(TS.format.formatMsg(e.comment));
                    alert("save failed")
                }
            })
        }
        TS.comments.ui.onEndEdit()
    },
    onEndEdit: function() {
        var a = TS.comments.ui.editing_file;
        var c = TS.comments.ui.editing_comment;
        var b = $("#" + c.id);
        TS.comments.ui.$edit_form.addClass("hidden");
        b.find(".comment_meta").removeClass("hidden");
        b.find(".comment_body").removeClass("hidden");
        $("#file_comment_form").css("visibility", "");
        TS.comments.ui.editing = false;
        TS.comments.ui.editing_file = null;
        TS.comments.ui.editing_comment = null
    },
    startDelete: function(c, b) {
        var a = TS.files.getFileById(c);
        if (!a) {
            TS.error("no file?");
            return null
        }
        var d = TS.files.getFileCommentById(a, b);
        if (!d) {
            TS.error("no comment?");
            return null
        }
        if (TS.client) {
            TS.generic_dialog.start({
                title: "Delete a file comment",
                body: "<p>Are you sure you want to delete this comment? This cannot be undone.</p>" + TS.templates.comment({
                    comment: d,
                    file: a,
                    show_comment_actions: false,
                    hide_star: true
                }),
                go_button_text: "Yes, delete the comment",
                go_button_class: "btn-danger",
                on_go: function() {
                    TS.comments.ui.commitDelete(c, b)
                }
            })
        } else {
            if (confirm("Are you sure you want to delete this comment?")) {
                TS.comments.ui.commitDelete(c, b)
            }
        }
    },
    commitDelete: function(c, b) {
        var a = TS.files.getFileById(c);
        if (!a) {
            TS.error("no file?");
            return null
        }
        var d = TS.files.getFileCommentById(a, b);
        if (!d) {
            TS.error("no comment?");
            return null
        }
        TS.api.call("files.comments.delete", {
            file: c,
            id: b
        }, function(f, g, e) {
            if (f) {
                if (TS.client) {} else {
                    TS.files.deleteCommentOnFile(d.id, a)
                }
            } else {
                if (g.error == "comment_not_found") {
                    TS.files.deleteCommentOnFile(d.id, a)
                }
            }
        })
    },
    removeFileComment: function(b, c, a) {
        $("#" + c).slideUp(200, a)
    }
});
TS.registerModule("tips", {
    current_batch: null,
    tips_by_batch: {},
    tips: {
        channels_tip_card: {
            id: "channels_tip_card",
            pref_name: "seen_channels_tip_card",
            throbber_el_id: "channels_tip_card_throbber",
            card_el_id: "channels_tip_card_div",
            batch: "newxp"
        },
        message_input_tip_card: {
            id: "message_input_tip_card",
            pref_name: "seen_message_input_tip_card",
            throbber_el_id: "message_input_tip_card_throbber",
            card_el_id: "message_input_tip_card_div",
            batch: "newxp"
        },
        user_menu_tip_card: {
            id: "user_menu_tip_card",
            pref_name: "seen_user_menu_tip_card",
            throbber_el_id: "user_menu_tip_card_throbber",
            card_el_id: "user_menu_tip_card_div",
            batch: "newxp",
            also_onclick: function(a) {
                TS.menu.startWithUser(a)
            },
            place: function() {
                TS.tip_card.placeRightOf($("#menu"), -10, 10)
            }
        },
        flexpane_tip_card: {
            id: "flexpane_tip_card",
            pref_name: "seen_flexpane_tip_card",
            throbber_el_id: "flexpane_tip_card_throbber",
            card_el_id: "flexpane_tip_card_div",
            batch: "second",
            adjust_state: function() {},
            place: function() {
                var a = TS.tip_card.$tip_card;
                a.css("left", "").css("right", "").css("top", "").css("bottom", "");
                a.css("top", 110);
                a.css("right", $("#menu").width() + 4);
                $("#tip_card_callout").addClass("hidden");
                TS.tip_card.keepInBounds();
                $("#tip_card_callout").css("left", a.outerWidth()).removeClass("hidden")
            },
            also_onclick: function(a) {
                TS.menu.startWithFlexMenu(a)
            }
        },
        team_menu_tip_card: {
            id: "team_menu_tip_card",
            pref_name: "seen_team_menu_tip_card",
            throbber_el_id: "team_menu_tip_card_throbber",
            card_el_id: "team_menu_tip_card_div",
            batch: "second",
            also_onclick: function(a) {
                TS.menu.startWithTeam(a)
            },
            place: function() {
                TS.tip_card.placeRightOf($("#menu"), 0, 10, -30)
            }
        },
        channel_menu_tip_card: {
            id: "channel_menu_tip_card",
            pref_name: "seen_channel_menu_tip_card",
            throbber_el_id: "channel_menu_tip_card_throbber",
            card_el_id: "channel_menu_tip_card_div",
            batch: "second",
            also_onclick: function(a) {
                TS.menu.startWithChannel(a, TS.shared.getActiveModelOb().id)
            },
            place: function() {
                TS.tip_card.placeRightOf($("#menu"), 0, 10, -30)
            },
            adjust_state: function() {
                var a = $("#channel_menu_tip_card_throbber");
                if (!TS.model.active_channel_id || TS.shared.getActiveModelOb().is_general) {
                    a.css("display", "none")
                } else {
                    a.css("display", "block")
                }
            }
        },
        search_input_tip_card: {
            id: "search_input_tip_card",
            pref_name: "seen_search_input_tip_card",
            throbber_el_id: "search_input_tip_card_throbber",
            card_el_id: "search_input_tip_card_div",
            batch: "second",
            place: function() {
                var a = TS.tip_card.$tip_card;
                a.css("left", "").css("right", "").css("top", "").css("bottom", "");
                a.css("right", ($(window).width() - $("#search_terms").offset().left) - 100);
                $("#tip_card_callout").addClass("hidden");
                TS.tip_card.keepInBounds();
                $("#tip_card_callout").css("left", a.outerWidth() - 55).removeClass("hidden")
            },
            adjust_state: function() {
                var a = TS.tips.getTipById("flexpane_tip_card");
                var b = TS.tips.getTipById("search_input_tip_card");
                var c = $("#search_input_tip_card_throbber");
                if (TS.model.prefs[a.pref_name]) {
                    if (b.hidden_for_now) {
                        b.fade_in_delay = 1000;
                        b.hidden_for_now = false
                    }
                    c.css("display", "block")
                } else {
                    b.hidden_for_now = true;
                    c.css("display", "none")
                }
            }
        },
        about_channels_tip_card: {
            id: "about_channels_tip_card",
            pref_name: null,
            throbber_el_id: null,
            card_el_id: "about_channels_tip_card_div",
            batch: "no_throbber",
            place: function() {
                TS.tip_card.placeRightOf($("#channels_header"), -40)
            }
        },
        about_dms_tip_card: {
            id: "about_dms_tip_card",
            pref_name: null,
            throbber_el_id: null,
            card_el_id: "about_dms_tip_card_div",
            batch: "no_throbber",
            place: function() {
                TS.tip_card.placeRightOf($("#direct_messages_header"), -40)
            }
        },
        about_groups_tip_card: {
            id: "about_groups_tip_card",
            pref_name: null,
            throbber_el_id: null,
            card_el_id: "about_groups_tip_card_div",
            batch: "no_throbber",
            place: function() {
                TS.tip_card.placeRightOf($("#groups_header"), -40)
            }
        }
    },
    getTipById: function(a) {
        return TS.tips.getTipByProp("id", a)
    },
    getTipByThrobberElId: function(a) {
        return TS.tips.getTipByProp("throbber_el_id", a)
    },
    getTipByProp: function(b, d) {
        if (!b) {
            return null
        }
        var a = TS.tips.tips;
        var c;
        for (var e in a) {
            c = a[e];
            if (c[b] === d) {
                return c
            }
        }
        return null
    },
    getAllTipsInBatch: function(c) {
        if (c && TS.tips.tips_by_batch[c]) {
            return TS.tips.tips_by_batch[c]
        }
        var b = {};
        var a = TS.tips.tips;
        var d;
        for (var e in a) {
            d = a[e];
            if (d.batch === c) {
                b[e] = d
            }
        }
        if (c) {
            TS.tips.tips_by_batch[c] = b
        }
        return b
    },
    isBatchComplete: function(b) {
        var a = TS.tips.getAllTipsInBatch(b);
        var c;
        for (var d in a) {
            c = a[d];
            if (c.pref_name && !TS.model.prefs[c.pref_name]) {
                return false
            }
        }
        return true
    },
    onStart: function() {
        if (!TS.client) {
            return
        }
        TS.client.login_sig.add(TS.tips.loggedIn, TS.tips);
        TS.channels.switched_sig.add(TS.tips.channelOrImOrGroupDisplaySwitched, TS.tips);
        TS.ims.switched_sig.add(TS.tips.channelOrImOrGroupDisplaySwitched, TS.tips);
        TS.groups.switched_sig.add(TS.tips.channelOrImOrGroupDisplaySwitched, TS.tips);
        TS.client.flexpane_display_switched_sig.add(TS.tips.flexDisplaySwitched, TS.tips)
    },
    adjustStateForCurrentBatch: function() {
        TS.tips.adjustStateForBatch(TS.tips.current_batch)
    },
    adjustStateForBatch: function(b) {
        if (!b) {
            return
        }
        var a = TS.tips.getAllTipsInBatch(b);
        var c;
        for (var d in a) {
            c = a[d];
            if (!TS.model.prefs[c.pref_name] && c.adjust_state) {
                c.adjust_state()
            }
        }
    },
    flexDisplaySwitched: function() {
        TS.tips.adjustStateForCurrentBatch()
    },
    channelOrImOrGroupDisplaySwitched: function() {
        var a = TS.shared.getActiveModelOb();
        if (!TS.model.prefs.seen_welcome_2 || !TS.tips.isBatchComplete("newxp")) {
            var b = "";
            if (a.is_channel) {
                b = "channel_switch__"
            } else {
                if (a.is_group) {
                    b = "group_switch__"
                } else {
                    b = "dm_switch__"
                }
            }
            TS.tips.track(b + a.name)
        }
        if (TS.model.prefs.seen_welcome_2 && TS.tips.current_batch == "newxp" && a) {
            if (a.is_slackbot_im) {
                TS.tips.hideThrobbers()
            } else {
                TS.tips.showThrobbers()
            }
        }
        TS.tips.adjustStateForCurrentBatch()
    },
    maybeChangeBatch: function() {
        var a = TS.tips.current_batch;
        if (TS.tips.current_batch == "newxp" && TS.tips.isBatchComplete("newxp")) {
            TS.tips.current_batch = "second"
        }
        if (TS.tips.current_batch == "second" && TS.tips.isBatchComplete("second")) {
            TS.tips.current_batch = null
        }
        if (a != TS.tips.current_batch) {
            if (TS.tips.current_batch) {
                TS.info("a new tip batch is in play: " + TS.tips.current_batch)
            }
            return true
        }
        return false
    },
    loggedIn: function() {
        if (TS.model.user.is_restricted) {
            delete TS.tips.tips.channels_tip_card
        }
        TS.tips.current_batch = "newxp";
        TS.tips.maybeChangeBatch();
        if (TS.tips.current_batch == "newxp") {
            if (TS.model.prefs.seen_welcome_2) {
                setTimeout(function() {
                    if (!TS.shared.getActiveModelOb().is_slackbot_im) {
                        TS.tips.showThrobbers()
                    }
                }, 1000)
            }
        } else {
            if (TS.tips.current_batch == "second") {
                setTimeout(function() {
                    TS.tips.showThrobbers()
                }, 1000)
            } else {}
        }
    },
    animateInInititalThrobbers: function(a) {
        TS.tips.current_batch = "newxp";
        var b = a.offset();
        TS.tips.showThrobbers();
        $(".tip_card_throbber:not(.hidden)").each(function() {
            $this = $(this);
            var d = $this.css("top");
            var c = $this.css("left");
            $this.offset({
                top: b.top,
                left: b.left
            }).css("scale", 1.2);
            $this.transition({
                top: d,
                left: c,
                scale: 1
            }, 1000, "easeOutSine", function() {
                $(this).transition({
                    scale: 2
                }, 300, "easeOutSine", function() {
                    $(this).transition({
                        scale: 1
                    }, 300, "easeInOutSine")
                })
            })
        })
    },
    hideThrobbers: function() {
        var a = TS.tips.tips;
        var b;
        for (var c in a) {
            b = a[c];
            TS.tips.hideThrobber(c)
        }
    },
    showThrobbers: function() {
        var a = TS.tips.tips;
        var b;
        for (var c in a) {
            b = a[c];
            if (b.batch != TS.tips.current_batch) {
                continue
            }
            if (TS.model.prefs[b.pref_name] === true) {
                continue
            }
            TS.tips.initTip(c)
        }
    },
    initTip: function(c) {
        var b = TS.tips.tips[c];
        if (!b) {
            TS.error('cannot init tip "' + c + '" because there is no record in TS.tips.tips with that name');
            return
        }
        var a = $("#" + b.throbber_el_id);
        if (!a.length) {
            TS.error('cannot init tip "' + c + '" because there is no element with id: ' + b.throbber_el_id);
            return
        }
        TS.tips.showThrobber(c)
    },
    showThrobber: function(c) {
        var b = TS.tips.tips[c];
        var a = $("#" + b.throbber_el_id);
        if (!a.length) {
            return
        }
        if (!a.hasClass("hidden")) {
            return
        }
        if (b.adjust_state) {
            b.adjust_state()
        }
        a.removeClass("hidden").css("opacity", 0).css("scale", 1).transition({
            opacity: 100,
            delay: b.fade_in_delay || 0
        }, 1000, function() {
            a.addClass("throbbing")
        });
        delete b.fade_in_delay;
        b.onclick = function(d) {
            TS.tips.hideThrobber(c, true, function() {
                TS.tips.hideThrobbers();
                if (b.also_onclick) {
                    b.also_onclick(d)
                }
                TS.tip_card.start({
                    tip: b,
                    on_go: function() {
                        TS.tips.cardHasBeenRead(c)
                    },
                    on_cancel: function() {
                        TS.tips.track("cancelled", b);
                        TS.tips.showThrobbers()
                    }
                })
            })
        };
        a.unbind("click.throbber").bind("click.throbber", function(d) {
            b.onclick(d);
            TS.tips.track("clicked_throbber_for", b)
        })
    },
    track: function(a, b) {
        return;
        if (b) {
            TS.track(a + "__" + b.id)
        } else {
            TS.track(a)
        }
    },
    cardHasBeenRead: function(b) {
        var a = TS.tips.tips[b];
        if (!TS.model.prefs[a.pref_name]) {
            TS.prefs.setPrefByAPI({
                name: a.pref_name,
                value: true
            })
        }
        TS.model.prefs[a.pref_name] = true;
        TS.tips.track("completed", a);
        if (TS.tips.maybeChangeBatch()) {
            TS.tips.startTipBatchAfterLastTipBatch()
        } else {
            TS.tips.showThrobbers()
        }
    },
    startTipBatchAfterLastTipBatch: function() {
        if (TS.tips.current_batch == "second") {
            setTimeout(function() {
                TS.tips.showThrobbers()
            }, (TS.qs_args.last_newxp_throbber == "1" || TS.qs_args.seen_welcome_2 == "0" ? 0 : 1000 * 60 * 10))
        }
    },
    hideThrobber: function(d, f, c) {
        var b = TS.tips.tips[d];
        var a = $("#" + b.throbber_el_id);
        if (!a.length) {
            return
        }
        if (a.hasClass("hidden")) {
            return
        }
        a.unbind("click.throbber");
        var e = (f) ? 2 : 1;
        a.transition({
            opacity: 0,
            scale: e
        }, 500, function() {
            a.removeClass("throbbing");
            a.addClass("hidden");
            if (c) {
                c()
            }
        })
    },
    maybeDoThrobberProxyClick: function(b, d) {
        var a = $("#" + b);
        if (a.length && !a.hasClass("hidden") && a.css("display") != "none") {
            var c = TS.tips.getTipByThrobberElId(b);
            if (c) {
                if (c.onclick) {
                    c.onclick(d);
                    TS.tips.track("clicked_proxy_for", c);
                    return true
                } else {
                    TS.error("no tip.onclick for tip:" + c.id)
                }
            } else {
                TS.error("no tip for throbber_el_id:" + b)
            }
        }
        return false
    },
    optOut: function() {
        var b;
        var a = TS.tips.tips;
        var c;
        var d;
        for (d in a) {
            c = a[d];
            if (!c.pref_name) {
                continue
            }
            if (!TS.model.prefs[c.pref_name]) {
                if (!b) {
                    b = {}
                }
                b[c.pref_name] = true
            }
            TS.model.prefs[c.pref_name] = true
        }
        if (b) {
            TS.prefs.setMultiPrefsByAPI(b)
        }
    }
});
TS.registerModule("tip_card", {
    $tip_card: null,
    setting: null,
    is_showing: false,
    onStart: function() {
        if (TS.client) {
            TS.client.login_sig.add(TS.tip_card.loggedIn, TS.tip_card)
        } else {
            if (TS.web) {
                TS.web.login_sig.add(TS.tip_card.loggedIn, TS.tip_card)
            }
        }
    },
    hasSeen: function() {
        var b, c, a;
        b = ["seen_user_menu_tip_card", "seen_message_input_tip_card", "seen_channels_tip_card", "seen_flexpane_tip_card", "seen_team_menu_tip_card", "seen_channel_menu_tip_card", "seen_search_input_tip_card"];
        for (c = 0, a = b.length; c < a; c++) {
            if (!TS.model || !TS.model.prefs || !TS.model.prefs[b[c]]) {
                return false
            }
        }
        return true
    },
    loggedIn: function() {
        $("#client-ui").append(TS.templates.tip_card());
        var a = TS.tip_card.$tip_card = $("#tip_card");
        $("#tip_card_dots").find("a").bind("click.tipshow", function() {
            TS.tip_card.showScreenByIndex($(this).data("slide") - 1)
        });
        $(".tip_card_go").bind("click.tipshow", function() {
            TS.tip_card.go()
        });
        a.detach()
    },
    start: function(d) {
        if (TS.tip_card.is_showing) {
            TS.tip_card.cancel()
        }
        var h = TS.tip_card.$tip_card;
        var g = d.tip;
        h.appendTo($("#client-ui"));
        if (!$("#" + g.card_el_id).length) {
            h.detach();
            TS.error('cannot show tip "' + d.tip.id + '" because there is no element "' + g.card_el_id + '"');
            if (d.on_cancel) {
                d.on_cancel()
            }
            return
        }
        TS.tip_card.clean();
        TS.tip_card.setting = d;
        TS.tip_card.is_showing = TS.model.tip_card_is_showing = true;
        if (d.tip.id == "user_menu_tip_card") {
            var f = (!TS.model.is_iOS && !TS.ui.growls.no_notifications && TS.ui.growls.shouldShowPermissionButton() && TS.ui.growls.getPermissionLevel() != "denied");
            f = false;
            if (f) {
                $("#notifications_screen").addClass("tip_screen").removeClass("hidden")
            } else {
                $("#notifications_screen").removeClass("tip_screen").addClass("hidden")
            }
        }
        h.css("left", "").css("right", "").css("top", "").css("bottom", "");
        $("#tip_card_callout").css("left", "").css("right", "").css("top", "").css("bottom", "");
        if (d.tip.id == "channels_tip_card") {
            var e = TS.channels.getChannelByName("random");
            var c = (e && !e.is_archived);
            if (c) {
                $("#channels_both").removeClass("hidden");
                $("#channels_only_general").addClass("hidden")
            } else {
                $("#channels_only_general").removeClass("hidden");
                $("#channels_both").addClass("hidden")
            }
        }
        d.screen_index = -1;
        d.$screens = $("#" + g.card_el_id).find(".tip_screen");
        var a = $("#tip_card_dots");
        a.find("a").addClass("hidden");
        if (d.$screens.length > 1) {
            a.removeClass("hidden");
            for (var b = 0; b < d.$screens.length; b++) {
                a.find('a[data-slide="' + (b + 1) + '"]').removeClass("hidden")
            }
        } else {
            a.addClass("hidden")
        }
        TS.tip_card.showScreenByIndex(0);
        h.addClass(g.card_el_id);
        $("#" + g.card_el_id).removeClass("hidden");
        $(window.document).bind("keydown", TS.tip_card.onKeyDown);
        $("html").bind("mousedown", TS.tip_card.onMouseDown);
        h.css("opacity", 0).stop().transition({
            opacity: 1,
            delay: 100
        }, 300);
        if (g.place) {
            g.place();
            $(window).bind("resize.tip_placement", g.place)
        } else {
            TS.tip_card.keepInBounds();
            $(window).bind("resize.tip_placement", TS.tip_card.keepInBounds)
        }
        $("#tip_card_bg").css("opacity", 0).removeClass("hidden").stop().transition({
            opacity: 1
        }, 200, function() {})
    },
    placeRightOf: function(c, d, e, k) {
        d = d || 0;
        e = e || 0;
        k = k || 0;
        var j = TS.tip_card.$tip_card;
        if (!TS.tip_card.setting) {
            return
        }
        var h = TS.tip_card.setting.tip;
        var g = 30;
        var a = 10;
        var b = c.offset();
        j.css("top", b.top + d);
        j.css("left", b.left + c.width() + e);
        TS.tip_card.keepInBounds();
        var f = j.dimensions_rect();
        $("#tip_card_callout").css("top", TS.utility.clamp((b.top - f.top) + ((c.height() - g) / 2) + k, a, f.height - (a + g)))
    },
    keepInBounds: function() {
        var c = TS.tip_card.setting;
        var e = TS.tip_card.$tip_card;
        var b = 10;
        var d = e.dimensions_rect();
        var a = {
            top: 0 + b,
            right: $(window).width() - b,
            bottom: $(window).height() - (b + 14),
            left: 0 + b
        };
        if (!c.tip.place) {
            e.css("left", "").css("right", "").css("top", "").css("bottom", "")
        }
        if (TS.utility.doesRectContainRect(a, d)) {
            return
        }
        if (d.left < a.left) {
            e.css("left", a.left)
        } else {
            if (d.right > a.right) {
                e.css("left", Math.max(a.left, a.right - d.width))
            }
        } if (d.top < a.top) {
            e.css("top", a.top)
        } else {
            if (d.bottom > a.bottom) {
                e.css("top", Math.max(a.top, a.bottom - d.height))
            }
        }
    },
    clean: function() {
        $(".tip_card_div").addClass("hidden");
        if (TS.tip_card.setting) {
            TS.tip_card.$tip_card.removeClass(TS.tip_card.setting.tip.card_el_id)
        }
        TS.tip_card.setting = null
    },
    cancel: function() {
        var a = TS.tip_card.setting;
        if (a) {
            if (a.screen_index == a.$screens.length - 1) {
                if (a.on_go) {
                    a.on_go()
                }
            } else {
                if (a.on_cancel) {
                    a.on_cancel()
                }
            }
        }
        TS.tip_card.end()
    },
    openPrefsAndCloseTip: function(b) {
        var a = TS.tip_card.setting;
        a.screen_index = a.$screens.length - 1;
        TS.tip_card.go();
        setTimeout(TS.ui.prefs_dialog.start, 500, b)
    },
    go: function() {
        var a = TS.tip_card.setting;
        if (a.screen_index == a.$screens.length - 1) {
            if (TS.tip_card.setting.on_go) {
                TS.tip_card.setting.on_go()
            }
            TS.tip_card.end();
            return
        }
        TS.tip_card.showScreenByIndex(a.screen_index + 1)
    },
    optOutAndCloseTip: function() {
        TS.tip_card.end();
        TS.tips.optOut()
    },
    showScreenByIndex: function(c) {
        var d = TS.tip_card.setting;
        if (c == d.screen_index) {
            return
        }
        d.screen_index = c;
        d.$screens.addClass("hidden");
        d.$screens.eq(c).removeClass("hidden").css("opacity", 0).stop().transition({
            opacity: 1,
            delay: 100
        }, 300);
        var a = (d.screen_index == d.$screens.length - 1) ? "Done" : "Next";
        $(".tip_card_go").text(a);
        var b = $("#tip_card_dots");
        b.find("a").removeClass("active");
        b.find('a[data-slide="' + (c + 1) + '"]').addClass("active")
    },
    end: function() {
        TS.tip_card.is_showing = TS.model.tip_card_is_showing = false;
        var a = TS.tip_card.$tip_card;
        a.stop().transition({
            opacity: 0
        }, 200, function() {
            if (TS.tip_card.is_showing) {
                return
            }
            TS.tip_card.clean();
            a.detach()
        });
        $("#tip_card_bg").stop().transition({
            opacity: 0
        }, 200, function() {
            $("#tip_card_bg").addClass("hidden")
        });
        $(window.document).unbind("keydown", TS.tip_card.onKeyDown);
        $("html").unbind("mousedown", TS.tip_card.onMouseDown);
        $(window).unbind("resize.tip_placement")
    },
    onKeyDown: function(a) {
        if (a.which == TS.utility.keymap.esc) {
            TS.tip_card.cancel()
        } else {
            if (a.which == TS.utility.keymap.enter) {
                TS.tip_card.go()
            }
        }
    },
    onMouseDown: function(a) {
        if ($(a.target).closest("#tip_card").length == 0) {
            TS.tip_card.cancel()
        }
    }
});
TS.registerModule("msg_edit", {
    edit_started_sig: new signals.Signal(),
    edit_ended_sig: new signals.Signal(),
    editing: false,
    deleting_from_editing: false,
    current_msg: null,
    current_model_ob: null,
    edit_interv: 0,
    onStart: function() {},
    onCountDownInterval: function() {
        if (!TS.msg_edit.current_msg) {
            return
        }
        if (TS.model.team.prefs.msg_edit_window_mins == -1) {
            $("#edit_countdown").empty();
            return
        }
        var b = TS.utility.date.toDateObject(TS.msg_edit.current_msg.ts).getTime() + (TS.model.team.prefs.msg_edit_window_mins * 60 * 1000);
        var a = Math.floor((b - TS.utility.date.getTimeStamp()) / 1000);
        if (a < 1) {
            $("#edit_countdown").html("(your time to edit ran out)&nbsp&nbsp&nbsp&nbsp")
        } else {
            if (a < 61) {
                $("#edit_countdown").html("(you have <b>" + a + "</b> seconds)&nbsp&nbsp&nbsp&nbsp")
            } else {
                $("#edit_countdown").empty()
            }
        }
    },
    startEdit: function(k, b) {
        if ($("#message_edit_form").length) {
            TS.msg_edit.promptEdit();
            return
        }
        if (!k) {
            TS.error("no msg_ts?");
            return null
        }
        if (!b) {
            TS.error("no model_ob?");
            return null
        }
        if (!b.msgs) {
            TS.error("no model_ob.msgs?");
            return null
        }
        var d = TS.utility.msgs.getMsg(k, b.msgs);
        if (!d) {
            TS.error("no msg in model_ob.msgs?");
            return null
        }
        if (TS.model.team.prefs.msg_edit_window_mins > -1 && (TS.utility.date.getTimeStamp() - TS.utility.date.toDateObject(d.ts)) / 60000 > TS.model.team.prefs.msg_edit_window_mins) {
            TS.generic_dialog.alert("Message not editable. You have only " + TS.model.team.prefs.msg_edit_window_mins + " minutes to edit a message after posting.");
            return
        }
        TS.msg_edit.current_msg = d;
        TS.msg_edit.current_model_ob = b;
        var a = (TS.client && TS.ui.areMsgsScrolledToBottom());
        var e = TS.msg_edit.getDivForMsg(d.ts);
        var f = TS.members.getMemberById(d.user);
        e.addClass("hidden");
        var g = TS.templates.message_edit_form({
            msg: d,
            permalink: TS.utility.msgs.constructMsgPermalink(b, d.ts),
            first_in_block: e.hasClass("first"),
            include_emo: !!TS.client
        });
        e.after(g);
        var c = $("#message_edit_form");
        var j = c.find("#msg_text");
        TS.msg_edit.checkLengthOK(j);
        TS.info("message_edit_form added");
        TS.msg_edit.editing = true;
        TS.msg_edit.edit_started_sig.dispatch();
        c.bind("destroyed", function() {
            TS.info("message_edit_form removed");
            TS.msg_edit.editing = false;
            TS.msg_edit.edit_ended_sig.dispatch();
            TS.msg_edit.resetEditUI()
        });
        if (TS.client) {
            j.TS_tabComplete({
                complete_cmds: true,
                complete_channels: true,
                complete_emoji: true,
                complete_member_specials: true,
                onComplete: function(l) {
                    TS.utility.populateInput(j, l)
                },
                new_cmds: TS.boot_data.feature_cmd_autocomplete
            })
        }
        c.bind("submit", function(m) {
            m.preventDefault();
            var l = j.val();
            if (!l) {
                TS.msg_edit.startDelete(TS.msg_edit.current_msg.ts, TS.msg_edit.current_model_ob, TS.msg_edit.onCancelEdit, true);
                return
            }
            if (!$.trim(l)) {
                return
            }
            TS.msg_edit.onConfirmEdit(l)
        });
        j.bind("textchange", function(l, m) {
            TS.msg_edit.checkLengthOK(j)
        }).bind("keyup", function(m) {
            var l;
            if (window.getSelection) {
                l = getSelection();
                if (l && l.toString && !l.toString()) {
                    $("#edit_controls").scrollintoview({
                        px_offset: -50
                    })
                }
            }
        }).bind("keydown", function(m) {
            if (m.which == TS.utility.keymap.enter && (m.ctrlKey || m.altKey)) {
                if (!TS.model.is_mac || TS.model.is_FF) {
                    var l = j.getCursorPosition();
                    var n = j.val();
                    j.val(n.substr(0, l) + "\n" + n.substr(l)).trigger("autosize").setCursorPosition(l + 1)
                }
            } else {
                if (m.which == TS.utility.keymap.enter) {
                    if (TS.model.prefs.enter_is_special_in_tbt && TS.utility.isCursorWithinTBTs(j) && !m.shiftKey) {
                        return
                    } else {
                        if (TS.model.prefs.enter_is_special_in_tbt && TS.utility.isCursorWithinTBTs(j) && m.shiftKey) {
                            m.preventDefault();
                            TS.msg_edit.checkAndSubmit(j, c);
                            return
                        } else {
                            if (!m.shiftKey && !m.altKey) {
                                m.preventDefault();
                                TS.msg_edit.checkAndSubmit(j, c);
                                return
                            }
                        }
                    }
                }
            } if (TS.client) {
                if (m.which == TS.utility.keymap.tab) {
                    j.TS_tabComplete("onTabKey", m)
                } else {
                    j.TS_tabComplete("resetMatches", "not tab key:" + m.which)
                }
            }
        }).autosize();
        $("body").bind("keydown.close_message_edit_form", function(l) {
            if (l.which == TS.utility.keymap.esc) {
                if (!TS.model.menu_is_showing && !TS.model.dialog_is_showing) {
                    setTimeout(TS.msg_edit.onCancelEdit, 0)
                }
            }
        });
        c.find("#commit_edit").bind("click", function() {
            TS.msg_edit.checkAndSubmit(j, c)
        });
        c.find("#cancel_edit").bind("click", function() {
            TS.msg_edit.onCancelEdit()
        });
        var h = c.find(".emo_menu");
        h.removeClass("hidden");
        h.bind("click.open_dialog", function(l) {
            TS.emoji_menu.startEmo(l, "#msg_text")
        });
        h.html(TS.utility.emojiGraphicReplace(h.html()));
        $("#edit_controls").scrollintoview({
            duration: 500,
            px_offset: -50
        });
        j.focus();
        TS.utility.setCursorPosition("#msg_text", 100000000);
        if (TS.client && a) {
            TS.ui.instaScrollMsgsToBottom(false)
        }
        TS.msg_edit.onCountDownInterval();
        TS.msg_edit.edit_interv = setInterval(TS.msg_edit.onCountDownInterval, 1000)
    },
    checkLengthOK: function(b) {
        var a = b.val().length > TS.model.input_maxlength;
        if (a) {
            $("#edit_warning").removeClass("hidden");
            $("#edit_saver").addClass("hidden");
            return false
        } else {
            $("#edit_warning").addClass("hidden");
            $("#edit_saver").removeClass("hidden");
            return true
        }
    },
    checkAndSubmit: function(b, c) {
        var a = b.val().length > TS.model.input_maxlength;
        if (TS.msg_edit.checkLengthOK(b)) {
            c.submit()
        }
    },
    onConfirmEdit: function(a) {
        if (!TS.msg_edit.current_msg) {
            TS.error("no TS.msg_edit.current_msg?");
            return null
        }
        if (!a) {
            TS.error("no edited_text?");
            return null
        }
        TS.msg_edit.commitEditInternal(a);
        TS.msg_edit.resetEditUI()
    },
    onCancelEdit: function() {
        if (!TS.msg_edit.current_msg) {
            TS.error("no TS.msg_edit.current_msg?");
            return null
        }
        TS.msg_edit.resetEditUI();
        if (TS.view) {
            TS.view.focusMessageInput()
        }
    },
    resetEditUI: function() {
        clearInterval(TS.msg_edit.edit_interv);
        if (!TS.msg_edit.current_msg) {
            TS.error("no TS.msg_edit.current_msg?");
            return null
        }
        var a = TS.msg_edit.getDivForMsg(TS.msg_edit.current_msg.ts);
        a.removeClass("hidden");
        $("#message_edit_container").remove();
        $("body").unbind("keydown.close_message_edit_form")
    },
    getDivForMsg: function(a) {
        return $("#" + TS.templates.makeMsgDomId(a))
    },
    commitEditInternal: function(a) {
        TS.msg_edit.commitEdit(TS.msg_edit.current_msg, TS.msg_edit.current_model_ob, a)
    },
    commitEdit: function(c, a, b) {
        if (!c) {
            TS.error("no msg?");
            return null
        }
        if (!a) {
            TS.error("no model_ob?");
            return null
        }
        TS.api.call("chat.update", {
            channel: a.id,
            ts: c.ts,
            text: TS.format.cleanMsg(b)
        }, function(f, g, d) {
            if (f) {
                if (TS.web) {
                    c.text = g.text;
                    TS.utility.msgs.replaceMsg(a, c)
                }
            } else {
                if (!g || !g.error) {
                    alert("Message editing failed.")
                } else {
                    if (g.error == "message_not_found") {
                        var e = a.id;
                        if (e.charAt(0) === "C") {
                            TS.channels.removeMsg(e, c)
                        } else {
                            if (e.charAt(0) === "D") {
                                TS.ims.removeMsg(e, c)
                            } else {
                                if (e.charAt(0) === "G") {
                                    TS.groups.removeMsg(e, c)
                                }
                            }
                        }
                        alert("That message was deleted.")
                    } else {
                        if (g.error == "edit_window_closed") {
                            alert("Message editing failed. You have only " + TS.model.team.prefs.msg_edit_window_mins + " minutes to edit a message after posting.")
                        } else {
                            alert('Message editing failed with error "' + g.error + '".')
                        }
                    }
                }
            }
        })
    },
    promptEdit: function() {
        if ($("#message_editing_info").css("display") != "none") {
            $("#edit_controls").scrollintoview({
                duration: 500,
                px_offset: -50
            });
            return
        }
        $("#message_editing_info").css("display", "");
        $("#message_editing_info").css("opacity", 0);
        $("#edit_controls").scrollintoview({
            duration: 500,
            px_offset: -50,
            complete: function() {
                $("#message_editing_info").transition({
                    opacity: 1
                }, 250)
            }
        })
    },
    startDelete: function(k, a, h, f) {
        if (!k) {
            TS.error("no msg_ts?");
            return null
        }
        if (!a) {
            TS.error("no model_ob?");
            return null
        }
        if (!a.msgs) {
            TS.error("no model_ob.msgs?");
            return null
        }
        var b = TS.utility.msgs.getMsg(k, a.msgs);
        if (!b) {
            TS.error("no msg in model_ob.msgs?");
            return null
        }
        TS.msg_edit.deleting_from_editing = !!f;
        TS.msg_edit.current_msg = b;
        TS.msg_edit.current_model_ob = a;
        var c = TS.msg_edit.getDivForMsg(b.ts);
        var e = TS.members.getMemberById(b.user);
        var j = '<p class="small_bottom_margin">Are you sure you want to delete this message? This cannot be undone.</p>';
        if (b.subtype) {
            if (b.file) {
                var g = "file";
                if (b.file.mode == "snippet") {
                    g = "snippet"
                } else {
                    if (b.file.mode == "post") {
                        g = "post"
                    }
                }
            }
            var d = "";
            if (b.subtype == "file_upload") {
                d = "Note that deleting this message will not delete the " + g + " that was uploaded."
            } else {
                if (b.subtype == "file_share") {
                    d = "Note that deleting this message will not unshare the " + g + "."
                } else {
                    if (b.subtype == "file_comment") {
                        d = "Note that deleting this message will not delete the comment."
                    }
                }
            } if (d) {
                j += "<p>" + d + "</p>"
            }
        }
        c.addClass("delete_mode");
        TS.generic_dialog.start({
            title: "Delete Message",
            body: j + TS.templates.builders.buildMsgHTML({
                msg: b,
                model_ob: a,
                standalone: true
            }),
            go_button_text: "Yes, delete this message",
            go_button_class: "btn-danger btn_danger",
            on_go: function() {
                if (TS.msg_edit.deleting_from_editing) {
                    TS.msg_edit.onCancelEdit()
                }
                TS.msg_edit.commitDeleteInternal(h)
            },
            on_cancel: function() {
                TS.msg_edit.onCancelDelete()
            }
        })
    },
    onCancelDelete: function() {
        if (!TS.msg_edit.current_msg) {
            TS.error("no TS.msg_edit.current_msg?");
            return null
        }
        var a = TS.msg_edit.getDivForMsg(TS.msg_edit.current_msg.ts);
        a.removeClass("delete_mode");
        if (TS.msg_edit.deleting_from_editing) {
            $("#msg_text").focus()
        }
    },
    commitDeleteInternal: function(a) {
        TS.msg_edit.commitDelete(TS.msg_edit.current_msg, TS.msg_edit.current_model_ob, TS.msg_edit.onCancelDelete, a)
    },
    commitDelete: function(f, b, e, a, d) {
        if (!f) {
            TS.error("no msg?");
            return null
        }
        if (!b) {
            TS.error("no model_ob?");
            return null
        }
        var c = b.id;
        if (f.is_ephemeral || TS.utility.msgs.isTempMsg(f)) {
            if (c.charAt(0) === "C") {
                TS.channels.removeMsg(c, f)
            } else {
                if (c.charAt(0) === "D") {
                    TS.ims.removeMsg(c, f)
                } else {
                    if (c.charAt(0) === "G") {
                        TS.groups.removeMsg(c, f)
                    } else {
                        return
                    }
                }
            }
        } else {
            TS.api.call("chat.delete", {
                channel: c,
                ts: f.ts
            }, function(k, l, h) {
                if (k || l.error == "message_not_found") {
                    if (TS.web) {
                        if (c.charAt(0) === "C") {
                            TS.channels.removeMsg(c, f)
                        } else {
                            if (c.charAt(0) === "D") {
                                TS.ims.removeMsg(c, f)
                            } else {
                                if (c.charAt(0) === "G") {
                                    TS.groups.removeMsg(c, f)
                                }
                            }
                        }
                    }
                    if (a) {
                        a()
                    }
                } else {
                    if (e) {
                        e()
                    }
                    if (!d) {
                        var g = "The message was not deleted.  The error was: " + (l && l.error ? l.error : "unknown");
                        TS.generic_dialog.start({
                            title: "Delete Message Failed",
                            body: g,
                            show_cancel_button: false,
                            esc_for_ok: true
                        })
                    }
                } if (TS.web) {
                    var j = !TS.utility.msgs.getDisplayedMsgs(b.msgs).length;
                    if (j) {
                        var m = $(".pager .previous a");
                        if (m.attr("href")) {
                            window.location = m.attr("href")
                        } else {
                            window.location.reload()
                        }
                    }
                }
            })
        }
    },
    $last_clicked_cb: null,
    startBatchDelete: function() {
        $("#msgs_div").addClass("selecting_messages");
        $("#channel_actions_div").addClass("hidden");
        $("#batch_delete_div").removeClass("hidden");
        TS.msg_edit.batchDeleteSelectionChanged()
    },
    cancelBatchDelete: function() {
        TS.msg_edit.selectNoneBatchDelete();
        $("#msgs_div").removeClass("selecting_messages");
        $("#channel_actions_div").removeClass("hidden");
        $("#batch_delete_div").addClass("hidden")
    },
    doBatchDelete: function() {
        var g = $("#msgs_div").find(".msg_select_cb:checked");
        var a = TS.shared.getActiveModelOb();
        if (g.length) {
            var d = g.length;
            if (d == 1) {
                TS.msg_edit.startDelete(g.eq(0).closest(".msg_actions").data("msg-ts"), a, TS.msg_edit.cancelBatchDelete);
                return
            }
            var e = (d == 1) ? "this message" : "these " + d + " messages";
            var f = '<p class="small_bottom_margin">Are you sure you want to delete ' + e + "? This cannot be undone! Note that deleting these messages will not delete any files or file comments.</p>";
            var j;
            var b;
            for (var c = 0; c < d; c++) {
                if (b && !b.no_display) {
                    j = b
                }
                var h = g.eq(c).closest(".msg_actions").data("msg-ts");
                b = TS.utility.msgs.getMsg(h, a.msgs);
                if (!b) {
                    continue
                }
                f += TS.templates.builders.buildMsgHTML({
                    msg: b,
                    prev_msg: j,
                    model_ob: a,
                    standalone: true
                })
            }
            var k = function(l) {
                function n(o) {
                    TS.msg_edit.commitDelete(o, a, m, m, true)
                }

                function m() {
                    if (l.length) {
                        setTimeout(function() {
                            n(l.pop())
                        }, 100)
                    } else {
                        TS.generic_dialog.cancel();
                        TS.generic_dialog.start({
                            title: "",
                            body: "Messages deleted.",
                            show_cancel_button: false,
                            esc_for_ok: true
                        })
                    }
                }
                TS.generic_dialog.start({
                    title: "",
                    body: "Deleting messages...",
                    show_cancel_button: false,
                    show_go_button: false
                });
                m()
            };
            TS.generic_dialog.start({
                title: "Delete Messages",
                body: f,
                go_button_text: "Yes, delete these messages",
                go_button_class: "btn-danger btn_danger",
                on_go: function() {
                    var l = [];
                    for (var m = 0; m < d; m++) {
                        var o = g.eq(m).closest(".msg_actions").data("msg-ts");
                        if (!o) {
                            alert("no msg_ts");
                            return
                        }
                        var n = TS.utility.msgs.getMsg(o, a.msgs);
                        if (!n) {
                            alert("no msg");
                            return
                        }
                        l.push(n)
                    }
                    TS.msg_edit.cancelBatchDelete();
                    k(l)
                },
                on_cancel: function() {}
            })
        } else {}
    },
    batchDeleteSelectionChanged: function(b, f) {
        var h = TS.msg_edit.$last_clicked_cb;
        if (h && b && f) {
            var a = $("#msgs_div").find(".msg_select_cb:visible");
            var d = a.index(h);
            var g = a.index(b);
            if (d > g) {
                g = d;
                d = a.index(b)
            }
            var k = h.prop("checked") == "checked";
            for (var c = d; c <= g; c++) {
                a.eq(c).prop("checked", k)
            }
        }
        TS.msg_edit.$last_clicked_cb = h = b;
        var e = "0 messages";
        var j = $("#msgs_div").find(".msg_select_cb:checked");
        $("#msgs_div").find(".multi_delete_mode").removeClass("multi_delete_mode");
        if (j.length) {
            if (j.length == 1) {
                e = "1 message"
            } else {
                e = j.length + " messages"
            }
            $("#batch_delete_button").removeClass("disabled");
            j.each(function() {
                $(this).closest(".message").addClass("multi_delete_mode")
            })
        } else {
            $("#batch_delete_button").addClass("disabled")
        }
        $("#batch_delete_count_span").html(e)
    },
    selectAllBatchDelete: function() {
        $("#msgs_div").find(".msg_select_cb:visible").prop("checked", true);
        TS.msg_edit.batchDeleteSelectionChanged()
    },
    selectNoneBatchDelete: function() {
        $("#msgs_div").find(".msg_select_cb:visible").prop("checked", false);
        TS.msg_edit.batchDeleteSelectionChanged()
    }
});
TS.registerModule("generic_dialog", {
    div: null,
    is_showing: false,
    default_setting: {
        title: "",
        body: "BODY",
        body_template: null,
        show_go_button: true,
        show_secondary_go_button: false,
        show_cancel_button: true,
        go_button_text: "OK",
        go_button_class: "btn-primary",
        secondary_go_button_text: "OK 2",
        secondary_go_button_class: "btn-primary",
        cancel_button_text: "Cancel",
        on_go: null,
        on_secondary_go: null,
        on_cancel: null,
        on_end: null,
        show_throbber: false,
        esc_for_ok: false,
        on_show: null,
        force_small: false,
        enter_always_gos: false
    },
    current_setting: null,
    body_template_html: {},
    Q: [],
    onStart: function() {
        TS.generic_dialog.body_template_html.generic_dialog_sample = TS.templates.generic_dialog_sample()
    },
    onKeydown: function(a) {
        var b = TS.generic_dialog.current_setting;
        if (a.which == TS.utility.keymap.enter) {
            if (TS.utility.getActiveElementProp("NODENAME") == "BODY" || b.enter_always_gos) {
                if (b.show_go_button) {
                    TS.generic_dialog.go();
                    a.preventDefault()
                }
            }
        } else {
            if (a.which == TS.utility.keymap.esc) {
                if (TS.utility.getActiveElementProp("NODENAME") == "BODY") {
                    if (b.show_cancel_button) {
                        TS.generic_dialog.cancel()
                    } else {
                        if (b.esc_for_ok) {
                            TS.generic_dialog.go()
                        }
                    }
                }
            }
        }
    },
    alert: function(a, b) {
        TS.generic_dialog.start({
            title: b || "",
            body: a,
            show_cancel_button: false,
            esc_for_ok: true
        })
    },
    start: function(c) {
        if (TS.generic_dialog.is_showing) {
            if (c.unique && TS.generic_dialog.current_setting.unique == c.unique) {
                TS.info("redundant generic dialog not Qed: " + c.unique)
            } else {
                TS.generic_dialog.Q.push(c)
            }
            return
        }
        var e = TS.generic_dialog.current_setting = $.extend(TS.utility.clone(TS.generic_dialog.default_setting), c);
        if (!TS.generic_dialog.div) {
            TS.generic_dialog.build()
        }
        var d = TS.generic_dialog.div;
        var a = e.body;
        if (e.body_template) {
            if (TS.generic_dialog.body_template_html[e.body_template]) {
                a = TS.generic_dialog.body_template_html[e.body_template];
                if (e.body) {
                    TS.warn("both body and body_template were passed on settings, using body_template")
                }
            } else {
                TS.error(e.body_template + " not found in TS.generic_dialog.body_template_html")
            }
        }
        var b = TS.templates.generic_dialog({
            title: e.title,
            body: a
        });
        d.empty();
        d.html(b);
        d.find(".close").bind("click", function() {
            if (e.show_cancel_button) {
                TS.generic_dialog.cancel()
            } else {
                if (e.esc_for_ok) {
                    TS.generic_dialog.go()
                }
            }
        });
        d.find(".dialog_go").click(TS.generic_dialog.go);
        d.find(".dialog_go").html(e.go_button_text);
        if (e.show_go_button) {
            d.find(".dialog_go").removeClass("hidden").addClass(e.go_button_class)
        } else {
            d.find(".dialog_go").addClass("hidden")
        }
        d.find(".dialog_secondary_go").click(TS.generic_dialog.secondary_go);
        d.find(".dialog_secondary_go").html(e.secondary_go_button_text);
        if (e.show_secondary_go_button) {
            d.find(".dialog_secondary_go").removeClass("hidden").addClass(e.secondary_go_button_class)
        } else {
            d.find(".dialog_secondary_go").addClass("hidden")
        }
        d.find(".dialog_cancel").click(TS.generic_dialog.cancel);
        d.find(".dialog_cancel").html(e.cancel_button_text);
        if (e.show_cancel_button) {
            d.find(".dialog_cancel").removeClass("hidden");
            d.find(".close").removeClass("hidden")
        } else {
            d.find(".dialog_cancel").addClass("hidden");
            d.find(".close").addClass("hidden")
        } if (e.show_throbber) {
            d.find(".throbber").removeClass("hidden")
        } else {
            d.find(".throbber").addClass("hidden")
        } if (e.title) {
            d.find(".modal-header").removeClass("hidden")
        } else {
            d.find(".modal-header").addClass("hidden")
        } if (!e.show_go_button && !e.show_secondary_go_button && !e.show_cancel_button) {
            d.find(".modal-footer").addClass("hidden")
        } else {
            d.find(".modal-footer").removeClass("hidden")
        }
        d.modal("show");
        if (e.title || e.force_small) {
            d.removeClass("small")
        } else {
            d.addClass("small");
            d.css("margin-left", -d.width() / 2)
        } if (document.activeElement && document.activeElement != document.body) {
            document.activeElement.blur()
        }
        if (e.on_show) {
            e.on_show()
        }
    },
    go: function() {
        if (!TS.generic_dialog.is_showing) {
            TS.error("not showing?");
            return
        }
        var b = TS.generic_dialog.current_setting;
        var a = TS.generic_dialog.div;
        if (b.on_go) {
            if (b.on_go() !== false) {
                a.modal("hide")
            }
        } else {
            a.modal("hide")
        }
    },
    secondary_go: function() {
        if (!TS.generic_dialog.is_showing) {
            TS.error("not showing?");
            return
        }
        var b = TS.generic_dialog.current_setting;
        var a = TS.generic_dialog.div;
        if (b.on_secondary_go) {
            if (b.on_secondary_go() !== false) {
                a.modal("hide")
            }
        } else {
            a.modal("hide")
        }
    },
    cancel: function() {
        var a = TS.generic_dialog.current_setting;
        TS.generic_dialog.div.modal("hide");
        if (a.on_cancel) {
            a.on_cancel()
        }
    },
    end: function() {
        var b = TS.generic_dialog.current_setting;
        TS.generic_dialog.is_showing = TS.model.dialog_is_showing = false;
        $(window.document).unbind("keydown", TS.generic_dialog.onKeydown);
        TS.generic_dialog.div.empty();
        if (b.on_end) {
            b.on_end()
        }
        if (!TS.generic_dialog.is_showing && TS.generic_dialog.Q.length) {
            var a = TS.generic_dialog.Q.shift();
            TS.generic_dialog.start(a)
        }
    },
    build: function() {
        $("body").append('<div id="generic_dialog" class="modal hide fade" data-keyboard="false" data-backdrop="static"></div>');
        var a = TS.generic_dialog.div = $("#generic_dialog");
        a.on("hidden", function(b) {
            if (b.target != this) {
                return
            }
            setTimeout(function() {
                TS.generic_dialog.end()
            }, 200)
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.generic_dialog.is_showing = TS.model.dialog_is_showing = true
        });
        a.on("shown", function(b) {
            if (b.target != this) {
                return
            }
            setTimeout(function() {
                if (!TS.generic_dialog.is_showing) {
                    return
                }
                a.find(".title_input").select();
                $(window.document).bind("keydown", TS.generic_dialog.onKeydown)
            }, 100)
        })
    }
});
TS.registerModule("help", {
    issues_sorted_sig: new signals.Signal(),
    issues: [],
    more_url: null,
    fake_api_rsps: false,
    max_title_chars: 100,
    onStart: function() {
        if (!TS.client) {
            return
        }
        TS.api.call("help.issues.list", {}, TS.help.onListIssues)
    },
    getIssueById: function(c) {
        var a;
        for (var b = 0; b < TS.help.issues.length; b++) {
            a = TS.help.issues[b];
            if (a.id == c) {
                return a
            }
        }
        return null
    },
    onListIssues: function(b, c, a) {
        if (TS.help.fake_api_rsps) {
            TS.help.more_url = "/help";
            TS.help.issues = [{
                id: "T00001",
                title: "issue 1",
                ts: "1111111111",
                short_text: "blah blah blah blah blah",
                state: "resolved"
            }, {
                id: "T00002",
                title: "issue 2",
                ts: "1141111111",
                short_text: "I think this is ok",
                state: "open"
            }, {
                id: "T00003",
                title: "issue 3",
                ts: "1121111111",
                short_text: "but I am not so sure abotu this",
                state: "unread"
            }, {
                id: "T00004",
                title: "issue 4",
                ts: "1161111111",
                short_text: "what about that?",
                state: "open"
            }, {
                id: "T00005",
                title: "issue 5",
                ts: "1151111111",
                short_text: "fuck it all to hell",
                state: "open"
            }, {
                id: "T00006",
                title: "issue 6",
                ts: "1171111111",
                short_text: "MORE BATTRY PLZ",
                state: "read"
            }, {
                id: "T00007",
                title: "issue 7",
                ts: "1191111111",
                short_text: "halp",
                state: "unread"
            }, {
                id: "T00008",
                title: "issue 8",
                ts: "191111111",
                short_text: "halp",
                state: "unread"
            }, {
                id: "T00009",
                title: "issue 9",
                ts: "181111111",
                short_text: "halp",
                state: "unread"
            }, {
                id: "T000010",
                title: "issue 10",
                ts: "171111111",
                short_text: "halp halp halp halp halp halp halp halp halp halp ...",
                state: "unread"
            }]
        } else {
            if (b) {
                TS.help.issues = c.issues
            }
        }
        TS.help.sortIssues();
        TS.help.updateIcon()
    },
    sortIssues: function() {
        var c = {
            unread: 4,
            open: 3,
            read: 2,
            resolved: 1
        };
        var a;
        for (var b = 0; b < TS.help.issues.length; b++) {
            a = TS.help.issues[b];
            a._sorter = parseFloat((c[a.state] || 5) + "." + a.ts)
        }
        TS.help.issues.sort(function d(f, e) {
            if (f._sorter < e._sorter) {
                return 1
            }
            if (f._sorter > e._sorter) {
                return -1
            }
            return 0
        });
        TS.help.issues_sorted_sig.dispatch()
    },
    updateIcon: function() {
        var e = "normal";
        var d = 0;
        var b = 0;
        var a;
        for (var c = 0; c < TS.help.issues.length; c++) {
            a = TS.help.issues[c];
            if (a.state == "unread") {
                e = "unread";
                d++
            } else {
                if (a.state == "open") {}
            }
        }
        $("#help_icon").removeClass("normal open unread").addClass(e);
        if (d) {
            $("#help_icon_circle_count").text(d)
        } else {
            $("#help_icon_circle_count").text(b)
        }
    },
    createIssue: function(b, a, c) {
        if (!b) {
            return
        }
        a = a || "";
        TS.api.call("help.issues.create", {
            title: b,
            text: a
        }, function(f, g, e) {
            if (f) {} else {
                if (TS.help.fake_api_rsps) {
                    var d = {
                        id: TS.utility.date.getTimeStamp(),
                        title: b,
                        ts: TS.utility.date.getTimeStamp() / 1000,
                        short_text: a.substr(0, 50),
                        state: "open"
                    };
                    setTimeout(function() {
                        TS.socket.handleMsg({
                            type: "issue_created",
                            issue: d
                        })
                    }, 2000)
                }
            } if (c) {
                c(f, TS.help.makeErrStr(g))
            }
        })
    },
    fetchIssueDetails: function(c, b) {
        var a = TS.help.getIssueById(c);
        if (!a) {
            if (b) {
                b(false, a, "unknown issue")
            }
            return
        }
        TS.api.call("help.issues.info", {
            id: c
        }, function(e, f, d) {
            var g;
            if (TS.help.fake_api_rsps) {
                e = true;
                g = TS.utility.clone(a);
                g.comments = [{
                    ts: 112211111,
                    from: "eeric",
                    text: "comment 1"
                }, {
                    ts: 112214444,
                    from: "whoop",
                    text: "comment 2"
                }]
            } else {
                if (e) {
                    g = f.issue
                }
            }
            TS.help.onIssueChange(g);
            if (b) {
                b(e, a, TS.help.makeErrStr(f))
            }
        })
    },
    markIssueRead: function(c, b) {
        var a = TS.help.getIssueById(c);
        if (!a) {
            if (b) {
                b(false, "unknown issue")
            }
            return
        }
        if (a.state != "unread") {
            if (b) {
                b(true)
            }
            return
        }
        TS.api.call("help.issues.markRead", {
            id: c
        }, function(e, f, d) {
            if (e) {} else {
                if (TS.help.fake_api_rsps) {
                    var g = TS.utility.clone(a);
                    g.state = "read";
                    setTimeout(function() {
                        TS.socket.handleMsg({
                            type: "issue_change",
                            issue: g
                        })
                    }, 2000)
                }
            } if (b) {
                b(e, TS.help.makeErrStr(f))
            }
        })
    },
    replyToIssue: function(c, a, b) {
        TS.api.call("help.issues.replyTo", {
            id: c,
            text: a
        }, function(e, f, d) {
            if (b) {
                b(e, TS.help.makeErrStr(f), (f && f.error) ? f.error : "")
            }
        })
    },
    markIssueResolved: function(c, b) {
        var a = TS.help.getIssueById(c);
        if (!a) {
            if (b) {
                b(false, "unknown issue")
            }
            return
        }
        TS.api.call("help.issues.markResolved", {
            id: c
        }, function(e, f, d) {
            if (TS.help.fake_api_rsps || (!e && f && f.error == "ticket_closed")) {
                e = true;
                var g = TS.utility.clone(a);
                g.state = "resolved";
                setTimeout(function() {
                    TS.socket.handleMsg({
                        type: "issue_change",
                        issue: g
                    })
                }, 1000)
            }
            if (b) {
                b(e, TS.help.makeErrStr(f))
            }
        })
    },
    onIssueChange: function(b) {
        var a = TS.help.getIssueById(b.id);
        if (a) {
            TS.help.updateIssue(b, a)
        } else {
            TS.help.issues.push(b)
        }
        TS.help.sortIssues();
        TS.help.updateIcon()
    },
    updateIssue: function(d, a) {
        for (var b in d) {
            a[b] = d[b]
        }
        if (a.comments) {
            a.comments.sort(function c(f, e) {
                if (f.ts < e.ts) {
                    return 1
                }
                if (f.ts > e.ts) {
                    return -1
                }
                return 0
            })
        }
    },
    makeErrStr: function(b) {
        if (!b) {
            return "missing data"
        }
        if (b.ok) {
            return null
        }
        if (b.error && b.info && TS.model.team.domain == "tinyspeck") {
            try {
                return 'api error: "' + b.error + '"<br><br><div class="admin-section" style="word-wrap: break-word; word-break: break-word;">api rsp: ' + JSON.stringify(b).replace(/\,/g, ", ") + "</div>"
            } catch (a) {}
        }
        if (b.error) {
            return 'api error: "' + b.error + '"'
        }
    }
});
TS.registerModule("help_dialog", {
    div: null,
    showing: false,
    last_tab: null,
    last_issue_screen: null,
    onStart: function() {
        TS.help.issues_sorted_sig.add(TS.help_dialog.onIssuesSorted);
        TS.help_dialog.just_docs = TS.qs_args.just_docs != "0"
    },
    onKeydown: function(a) {
        if (!TS.help_dialog.showing) {
            return
        }
        if (a.which == TS.utility.keymap.enter && TS.utility.cmdKey(a)) {
            if (TS.utility.getActiveElementProp("id") == "issue_reply_text") {
                TS.help_dialog.replyToIssue();
                a.preventDefault()
            } else {
                if (TS.utility.getActiveElementProp("id") == "issue_new_text") {
                    TS.help_dialog.createIssue();
                    a.preventDefault()
                }
            }
        } else {
            if (a.which == TS.utility.keymap.esc) {
                if (TS.utility.getActiveElementProp("NODENAME") == "BODY" && TS.help_dialog.last_issue_screen != "new" && TS.help_dialog.last_issue_screen != "reply") {
                    TS.help_dialog.cancel()
                }
            }
        }
    },
    start: function(c, a) {
        c = c || TS.help_dialog.last_tab;
        if (TS.help_dialog.just_docs) {
            if (c == "issues") {
                c = "docs"
            }
        }
        if (!TS.help_dialog.div) {
            TS.help_dialog.build()
        }
        if (TS.help_dialog.showing) {
            return
        }
        var d = TS.help_dialog.div;
        var b = TS.templates.help_dialog({
            member: TS.model.user,
            issue_list_html: TS.help_dialog.buildIssueListHTML(),
            more_url: TS.help.more_url,
            max_title_chars: TS.help.max_title_chars
        });
        d.empty();
        d.html(b);
        d.find(".dialog_tabs a").bind("click", function(f) {
            $tab = $(this);
            d.find(".dialog_tabs a").removeClass("active");
            d.find(".dialog_tab_pane").removeClass("active");
            $tab.addClass("active");
            $("#" + $tab.data("pane-id")).addClass("active");
            TS.help_dialog.last_tab = $tab.data("which");
            TS.ui.updateClosestMonkeyScroller($("#help_docs_scroller"));
            TS.ui.updateClosestMonkeyScroller($("#help_issues_scroller"));
            if (TS.help_dialog.last_tab == "docs") {} else {
                d.find(".modal-footer").removeClass("hidden")
            }
        });
        if (c == "issues") {
            $("#help_issues_tab").trigger("click")
        } else {
            $("#help_docs_tab").trigger("click")
        }
        $("#help_issues_list").bind("click", function(h) {
            var g = $(h.target);
            var f = g.closest(".issue_list_div").data("issue-id");
            if (!f) {
                return
            }
            TS.help_dialog.showIssue(f)
        });
        $("#new_issue_submit_btn").bind("click", TS.help_dialog.createIssue);
        $("#new_issue_cancel_btn").bind("click", TS.help_dialog.showIssueList);
        $("#new_issue_btn").click(TS.help_dialog.showNewIssueForm);
        $("#issue_resolved_btn").bind("click", TS.help_dialog.markIssueResolved);
        $("#issue_back_btn").bind("click", TS.help_dialog.showIssueList);
        $("#issue_reply_btn").bind("click", TS.help_dialog.showIssueReplyForm);
        $("#issue_reply_submit_btn").bind("click", TS.help_dialog.replyToIssue);
        $("#issue_reply_cancel_btn, #issue_reply_title").bind("click", function() {
            TS.help_dialog.showIssue()
        });
        TS.help_dialog.last_issue_screen = "list";
        TS.help_dialog.getElsForScreen("new").addClass("hidden");
        TS.help_dialog.getElsForScreen("issue").addClass("hidden");
        TS.help_dialog.getElsForScreen("reply").addClass("hidden");
        $("#issues_overlaid_throbber").addClass("hidden");
        $("#issue_new_title").bind("textchange", function(g, j) {
            var f = $(this);
            var h = f.val();
            if (h.length > TS.help.max_title_chars) {
                f.val(h.substr(0, TS.help.max_title_chars))
            }
        });
        if (TS.help_dialog.just_docs) {
            $("#help_dialog").find(".with_tabs").removeClass("with_tabs");
            $("#help_dialog").find(".dialog_tabs").addClass("hidden");
            $("#help_dialog").find(".no_tabs_title").removeClass("hidden");
            $("#help_dialog").find("#cant_find").removeClass("hidden")
        }
        TS.help_dialog.updateDocsTab();
        d.modal("show")
    },
    updateDocsTab: function() {
        if (!TS.help_dialog.just_docs) {
            return
        }
        var e = 0;
        var c = 0;
        var a = TS.help.issues.length;
        var b;
        for (var d = 0; d < TS.help.issues.length; d++) {
            b = TS.help.issues[d];
            if (b.state == "unread") {
                e++
            } else {
                if (b.state == "open") {
                    c++
                }
            }
        }
        $("#help_dialog").find("#no_open_issues, #unread_issues, #open_issues, #unread_issues_many, #unread_issues_singular, #open_issues_many, #open_issues_singular").addClass("hidden");
        if (a) {
            $("#no_open_issues").removeClass("hidden")
        } else {
            $("#cant_find").removeClass("hidden");
            $("#help_divider").addClass("hidden")
        } if (e) {
            $("#unread_issues").removeClass("hidden");
            $("#help_divider").removeClass("hidden");
            $("#no_open_issues").addClass("hidden");
            if (e > 1) {
                $("#unread_issues_count_txt").text(e);
                $("#unread_issues_many").removeClass("hidden")
            } else {
                $("#unread_issues_singular").removeClass("hidden")
            }
        } else {
            if (c) {
                $("#open_issues").removeClass("hidden");
                $("#help_divider").removeClass("hidden");
                $("#no_open_issues").addClass("hidden");
                if (c > 1) {
                    $("#open_issues_count_txt").text(c);
                    $("#open_issues_many").removeClass("hidden")
                } else {
                    $("#open_issues_singular").removeClass("hidden")
                }
            }
        }
    },
    onIssuesSorted: function() {
        if (!TS.help_dialog.showing) {
            return
        }
        TS.help_dialog.updateDocsTab();
        $("#help_issues_list").html(TS.help_dialog.buildIssueListHTML())
    },
    buildIssueListHTML: function() {
        var c = "";
        var a;
        for (var b = 0; b < TS.help.issues.length; b++) {
            a = TS.help.issues[b];
            c += TS.templates.issue_list_item({
                issue: a
            })
        }
        return c
    },
    getElsForScreen: function(a) {
        if (a == "list") {
            return $("#help_issues_list, #help_issues_list_btns")
        }
        if (a == "new") {
            return $("#help_issue_new_form_div, #help_issue_new_form_btns")
        }
        if (a == "issue") {
            return $("#help_issue_div, #help_issue_btns")
        }
        if (a == "reply") {
            return $("#help_issue_reply_form_div, #help_issue_reply_form_btns")
        }
        return $("#wtfjones")
    },
    startWorking: function() {
        $("#issues_overlaid_throbber").removeClass("hidden").css("opacity", 0).transition({
            opacity: 1
        }, 200);
        $("#help_dialog .modal-footer").find(".btn.disable_when_working").addClass("disabled")
    },
    stopWorking: function() {
        $("#issues_overlaid_throbber").transition({
            opacity: 0
        }, 100).delay(100).addClass("hidden");
        $("#help_dialog .modal-footer").find(".btn").removeClass("disabled")
    },
    showIssueScreen: function(a, d) {
        var c = TS.help_dialog.getElsForScreen(TS.help_dialog.last_issue_screen);
        var b = TS.help_dialog.getElsForScreen(a);
        c.transition({
            opacity: 0
        }, 100, function() {
            if (arguments.callee.run) {
                return
            }
            arguments.callee.run = true;
            if (!TS.help_dialog.showing) {
                return
            }
            c.addClass("hidden");
            b.removeClass("hidden").css("opacity", 0).transition({
                opacity: 1
            }, 100, function() {
                if (arguments.callee.run) {
                    return
                }
                arguments.callee.run = true;
                if (!TS.help_dialog.showing) {
                    return
                }
                if (d) {
                    d()
                }
                TS.ui.updateClosestMonkeyScroller($("#help_issues_scroller"))
            })
        });
        TS.help_dialog.last_issue_screen = a
    },
    showIssueList: function() {
        TS.help_dialog.showIssueScreen("list")
    },
    showIssueReplyForm: function() {
        var a = TS.help.getIssueById(TS.help_dialog.last_issue_id);
        if (!a) {
            return
        }
        $("#issue_reply_title").text(a.title);
        $("#issue_reply_footer").html(TS.templates.help_issue_reply_comments({
            issue: a
        }));
        TS.ui.updateClosestMonkeyScroller($("#help_issues_scroller"));
        TS.help_dialog.showIssueScreen("reply", function() {
            $("#issue_reply_text").focus();
            TS.ui.updateClosestMonkeyScroller($("#help_issues_scroller"))
        })
    },
    showNewIssueForm: function() {
        TS.help_dialog.showIssueScreen("new", function() {
            $("#issue_new_title").focus()
        })
    },
    showIssue: function(c) {
        var a = TS.help.getIssueById(c);
        var b;
        if (c && !a) {
            return
        }
        if (a) {
            TS.help_dialog.last_issue_id = c;
            TS.help_dialog.startWorking();
            $("#help_issue_div").empty();
            b = function() {
                TS.help.fetchIssueDetails(c, function(e, d, f) {
                    if (!TS.help_dialog.showing) {
                        return
                    }
                    if (!e) {
                        TS.generic_dialog.alert("Failed to retrieve the request details.<br><br>" + f);
                        TS.help_dialog.stopWorking();
                        TS.help_dialog.showIssueList();
                        return
                    }
                    setTimeout(function() {
                        if (!TS.help_dialog.showing) {
                            return
                        }
                        TS.help.markIssueRead(c, function(g, h) {
                            if (!TS.help_dialog.showing) {
                                return
                            }
                            $("#help_issue_div").html(TS.templates.help_issue_div({
                                issue: d,
                                show_comments: true
                            }));
                            TS.ui.updateClosestMonkeyScroller($("#help_issues_scroller"));
                            TS.help_dialog.stopWorking()
                        });
                        if (d.state == "resolved" || d.is_closed) {
                            $("#issue_resolved_btn").addClass("hidden")
                        } else {
                            $("#issue_resolved_btn").removeClass("hidden")
                        } if (d.is_closed) {
                            $("#issue_reply_btn").addClass("hidden")
                        } else {
                            $("#issue_reply_btn").removeClass("hidden")
                        }
                    }, 1000)
                });
                $("#help_issue_div").html(TS.templates.help_issue_div({
                    issue: a
                }));
                TS.ui.updateClosestMonkeyScroller($("#help_issues_scroller"))
            }
        }
        TS.help_dialog.showIssueScreen("issue", b)
    },
    markIssueResolved: function() {
        TS.help_dialog.startWorking();
        TS.help.markIssueResolved(TS.help_dialog.last_issue_id, function(a, b) {
            if (!TS.help_dialog.showing) {
                return
            }
            if (!a) {
                TS.generic_dialog.alert("Failed to mark the request resolved.<br><br>" + b)
            }
            TS.help_dialog.stopWorking();
            TS.help_dialog.showIssueList()
        })
    },
    createIssue: function() {
        var b = $("#issue_new_text").val();
        var a = $("#issue_new_title").val() || "";
        if (a.length > TS.help.max_title_chars) {
            TS.info("too long");
            return
        }
        if (!b) {
            return
        }
        if (!a) {
            a = b.substr(0, 50)
        }
        TS.help_dialog.startWorking();
        TS.help.createIssue(a, b, function(c, d) {
            if (!TS.help_dialog.showing) {
                return
            }
            TS.help_dialog.stopWorking();
            if (!c) {
                TS.generic_dialog.alert("Failed to create request.<br><br>" + d)
            } else {
                TS.help_dialog.showIssueList();
                $("#issue_new_text").val("");
                $("#issue_new_title").val("")
            }
        })
    },
    replyToIssue: function() {
        var a = $("#issue_reply_text").val();
        if (!a) {
            return
        }
        TS.help_dialog.startWorking();
        TS.help.replyToIssue(TS.help_dialog.last_issue_id, a, function(c, d, b) {
            if (!TS.help_dialog.showing) {
                return
            }
            TS.help_dialog.stopWorking();
            if (!c) {
                if (b == "ticket_closed") {
                    TS.generic_dialog.alert("Failed to add comment.<br><br>" + d)
                } else {
                    TS.generic_dialog.alert("Failed to add comment.<br><br>" + d)
                }
            } else {
                TS.help_dialog.showIssue(TS.help_dialog.last_issue_id);
                $("#issue_reply_text").val("")
            }
        })
    },
    go: function() {
        if (!TS.help_dialog.showing) {
            TS.error("not showing?");
            return
        }
        var a = TS.help_dialog.div;
        a.modal("hide")
    },
    cancel: function() {
        TS.help_dialog.div.modal("hide")
    },
    end: function() {
        TS.help_dialog.showing = TS.model.dialog_is_showing = false;
        $(window.document).unbind("keydown", TS.help_dialog.onKeydown)
    },
    build: function() {
        $("body").append('<div id="help_dialog" class="modal hide fade"></div>');
        var a = TS.help_dialog.div = $("#help_dialog");
        a.on("hide", function(b) {
            if (b.target != this) {
                return
            }
            TS.help_dialog.end()
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.help_dialog.showing = TS.model.dialog_is_showing = true
        });
        a.on("shown", function(b) {
            if (b.target != this) {
                return
            }
            $(window.document).bind("keydown", TS.help_dialog.onKeydown);
            TS.ui.updateClosestMonkeyScroller($("#help_issues_scroller"));
            TS.ui.updateClosestMonkeyScroller($("#help_docs_scroller"))
        })
    }
});
(function() {
    TS.registerModule("kb_nav", {
        onStart: function() {},
        start: function(r, q) {
            l = r;
            e = q;
            $(window.document).on("keydown", TS.kb_nav.onKeyDown);
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
            $(window.document).off("keydown", TS.kb_nav.onKeyDown)
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
            var r = TS.utility.keymap;
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
    });
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
        return $(q).is("input, textarea")
    }
})();