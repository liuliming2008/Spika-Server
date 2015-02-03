TS.registerModule("client", {
    login_sig: new signals.Signal(),
    window_unloaded_sig: new signals.Signal(),
    flexpane_display_switched_sig: new signals.Signal(),
    core_url: null,
    loading_ellipsis_timer: null,
    onStart: function() {
        TS.client.core_url = document.location.href.split("/messages")[0] + "/messages";
        if (TS.boot_data.special_flex_panes) {
            for (var b = 0; b < TS.boot_data.special_flex_panes.length; b++) {
                var a = TS.boot_data.special_flex_panes[0];
                TS.model.flex_names.push(a.flex_name)
            }
        }
        TS.model.ui_state = TS.storage.fetchUIState();
        TS.model.initial_ui_state_str = (TS.model.ui_state) ? JSON.stringify(TS.model.ui_state) : "none";
        if (!("member_list_visible" in TS.model.ui_state)) {
            TS.model.ui_state.member_list_visible = false
        }
        TS.model.flex_name_in_url = TS.utility.getFlexNameFromUrl(location.href).toLowerCase();
        TS.model.flex_extra_in_url = TS.utility.getFlexExtraFromUrl(location.href);
        if (TS.model.flex_names.indexOf(TS.model.flex_name_in_url) == -1) {
            TS.model.flex_name_in_url = "";
            TS.model.flex_extra_in_url = ""
        }
        if (TS.model.flex_name_in_url) {
            TS.model.ui_state.flex_name = TS.model.flex_name_in_url;
            TS.model.ui_state.flex_extra = TS.model.flex_extra_in_url || ""
        }
        if (TS.model.ui_state.flex_name == "list") {
            TS.model.ui_state.flex_name = "files"
        }
        TS.model.ui_state.flex_visible = !!TS.model.ui_state.flex_name;
        TS.storage.storeUIState(TS.model.ui_state)
    },
    gogogo: function() {
        TS.logLoad("TS.client.gogogo");
        TS.client.login();
        if (window.macgap) {
            window.onbeforeunload = TS.client.onWindowUnload
        } else {
            if (typeof window.addEventListener != "undefined") {
                window.addEventListener("beforeunload", TS.client.onWindowUnload, false)
            } else {
                if (typeof document.addEventListener != "undefined") {
                    document.addEventListener("beforeunload", TS.client.onWindowUnload, false)
                } else {
                    if (typeof window.attachEvent != "undefined") {
                        window.attachEvent("onbeforeunload", TS.client.onWindowUnload)
                    } else {
                        if (typeof window.onbeforeunload == "function") {
                            window.onbeforeunload = function() {
                                TS.client.onWindowUnload();
                                return false
                            }
                        } else {
                            window.onbeforeunload = TS.client.onWindowUnload
                        }
                    }
                }
            }
        }
        $(window).bind("popstate", TS.client.onPopState)
    },
    last_login_tim: 0,
    last_login_ms: 0,
    login: function() {
        if (TS.model.logged_in_once) {
            var b = TS.utility.date.getTimeStamp() - TS.socket.last_pong_time;
            if (b > 1000 * 60 * 5) {
                if (TS.storage.cleanOutMsgStorageIfTooOld()) {
                    TS.info("going to call TS.client.reload() after a TS.storage.cleanOutMsgStorageIfTooOld() because ms_since_last_pong > 1000*60*5");
                    TS.client.reload(null, "TS.client.reload() after a TS.storage.cleanOutMsgStorageIfTooOld() because ms_since_last_pong > 1000*60*5")
                }
            }
        } else {
            TS.storage.cleanOutMsgStorageIfTooOld()
        }
        TS.info("logging in");
        TS.client.last_login_ms = TS.utility.date.getTimeStamp();
        var f = {
            agent: "webapp_" + TS.boot_data.svn_rev,
            login_ms: TS.client.last_login_ms
        };
        if (TS.client && TS.boot_data.login_data) {
            var d = TS.utility.date.getTimeStamp() - TS.boot_data.start_ms;
            var a = 25000;
            if (d > a) {
                TS.info("forcing a call to rtm.start because the WS url is tool old at this point: " + d + "ms");
                delete TS.boot_data.login_data;
                TS.warn(JSON.stringify(window.load_log, null, "\t"));
                TSSSB.call("didStartLoading", {
                    ms: 30000
                }, 30000)
            }
        }
        if (TS.boot_data.login_data) {
            TS.socket.logConnectionFlow("login_with_boot_data");
            var c = TS.boot_data.login_data;
            delete TS.boot_data.login_data;
            TS.client.onLogin(true, c, f)
        } else {
            TS.socket.logConnectionFlow("login");
            clearTimeout(TS.client.last_login_tim);
            TS.client.last_login_tim = setTimeout(function() {
                clearTimeout(TS.client.last_login_tim);
                TS.socket.logConnectionFlow("last_login_timeout");
                TS.socket.onFailure()
            }, 10000);
            TS.model.users_login_call_throttler++;
            TS.warn("incremented TS.model.users_login_call_throttler:" + TS.model.users_login_call_throttler);
            TS.api.callImmediately("rtm.start", f, TS.client.onLogin)
        }
    },
    reload: function(b, a) {
        if (b) {
            TS.info("TS.client.reload called msg:" + b);
            TS.generic_dialog.start({
                title: "Reloading!",
                body: b,
                show_cancel_button: false,
                esc_for_ok: true,
                on_go: function() {
                    TS.client.reload()
                }
            });
            return
        }
        if (a && TS.model && TS.model.team && TS.model.team.domain == "tinyspeck") {
            TS.info("TS.client.reload called msg:" + a);
            TS.generic_dialog.start({
                title: "This would be a silent reload, except you are on the Tiny Speck team so this is to help debug",
                body: a,
                show_cancel_button: false,
                esc_for_ok: true,
                on_go: function() {
                    TS.client.reload()
                }
            });
            return
        }
        TS.info("TS.client.reload happening!");
        if (!TSSSB.call("reload")) {
            window.location.reload()
        }
    },
    onLogin: function(c, d, b) {
        clearTimeout(TS.client.last_login_tim);
        if (TS.client.last_login_ms != b.login_ms) {
            TS.warn("ignoring this rsp, as we have issued another login call since this one (TS.client.last_login_ms != args.login_ms)");
            return
        }
        if (TS.model.logged_in_once && d.min_svn_rev) {
            if (TS.boot_data.svn_rev == "dev") {} else {
                if (parseInt(TS.boot_data.svn_rev) < parseInt(d.min_svn_rev)) {
                    TS.info("calling TS.client.reload() because parseInt(TS.boot_data.svn_rev) < parseInt(data.min_svn_rev)");
                    TS.client.reload(null, "calling TS.client.reload() because parseInt(TS.boot_data.svn_rev) < parseInt(data.min_svn_rev)");
                    return
                }
            }
        }
        if (!c) {
            if (d && (d.error == "account_inactive" || d.error == "team_disabled" || d.error == "invalid_auth")) {
                TS.info("calling TS.client.reload() because data.error: " + d.error);
                TS.client.reload(null, "calling TS.client.reload() because data.error: " + d.error);
                return
            }
            TS.socket.logConnectionFlow("on_login_failure");
            TS.info("API rtm.start rsp was no good");
            TS.socket.onFailure();
            return
        }
        if (TS.model.logged_in_once) {
            if (TS.boot_data.svn_rev != d.svn_rev) {}
        }
        if (!d.self) {
            TS.error("No self?");
            return
        }
        if (!d.team) {
            TS.error("No team?");
            return
        }
        TS.socket.logConnectionFlow("on_login");
        TS.setUpModel(d);
        TSSSB.call("setCurrentTeam", {
            team: TS.model.team.domain
        }, TS.model.team.domain);
        if (!TS.model.logged_in_once && TS.model.prefs.ss_emojis && emoji.sheet_path) {
            TS.logLoad("TS.client preloading " + emoji.sheet_path);
            var a = new Date().getTime();
            $("body").append('<img style="position:absolute; width:100px; left:-200px; top:-200%; z-index:100" id="emoji_ss_preloader" src="' + emoji.sheet_path + '">');
            $("#emoji_ss_preloader").bind("load", function() {
                $("#emoji_ss_preloader").remove();
                TS.logLoad("TS.client preloaded " + emoji.sheet_path + " (took " + (new Date().getTime() - a) + "ms)");
                TS.client.completeOnLogin()
            })
        } else {
            TS.client.completeOnLogin()
        }
    },
    completeOnLogin: function() {
        if (!TS.model.logged_in_once) {
            TS.logLoad("TS.client logged in first time");
            TS.ui.makeEmoticonList();
            if (!TS.model.welcome_model_ob.id) {
                TS.model.welcome_model_ob = TS.channels.getGeneralChannel() || TS.model.welcome_model_ob
            }
            TS.client.setInitialChannel();
            setInterval(TS.client.markLastReadsWithAPI, 5000);
            TS.client.startCheckingForCleanup();
            TS.socket.connected_sig.add(TS.client.socketConnected, TS.client);
            TS.channels.renamed_sig.add(TS.client.channelRenamed, TS.client);
            TS.groups.renamed_sig.add(TS.client.groupRenamed, TS.client);
            TS.members.changed_name_sig.add(TS.client.memberChangedName, TS.client);
            TS.members.changed_account_type_sig.add(TS.client.memberAccountTypeChanged, TS.client);
            TS.logLoad("TS.client.onLogin hiding loading screen");
            TS.reportLoad();
            TSSSB.call("didFinishLoading");
            if (TS.qs_args.halt_at_loading_screen == 1) {
                return
            }
            $("#loading_welcome").transition({
                opacity: 0
            }, 150, function() {
                $("#col_channels_bg").css("z-index", 0);
                $("#loading-zone").transition({
                    opacity: 0
                }, 250, function() {
                    $("body").removeClass("loading");
                    $("#loading-zone").css({
                        opacity: 1,
                        left: 0,
                        background: "white"
                    });
                    TS.view.resizeManually("TS.client.onLogin");
                    clearInterval(window.loading_ellipsis_timer)
                })
            })
        }
        var d = TS.channels.getChannelById(TS.model.active_channel_id);
        var b = TS.ims.getImById(TS.model.active_im_id);
        var f = TS.groups.getGroupById(TS.model.active_group_id);
        var c;
        if (d && !d.history_is_being_fetched) {
            TS.shared.checkInitialMsgHistory(d, TS.channels)
        } else {
            if (b && !b.history_is_being_fetched) {
                TS.shared.checkInitialMsgHistory(b, TS.ims)
            } else {
                if (f && !f.history_is_being_fetched) {
                    TS.shared.checkInitialMsgHistory(f, TS.groups)
                }
            }
        } if (!TS.model.logged_in_once) {
            TS.client.login_sig.dispatch()
        }
        for (c = 0; c < TS.model.ims.length; c++) {
            b = TS.model.ims[c];
            if (b.id == TS.model.active_im_id) {
                continue
            }
            if (!b.is_open && !b.unread_count) {
                continue
            }
            TS.shared.checkInitialMsgHistory(b, TS.ims)
        }
        var a = TS.model.channels;
        for (c = 0; c < a.length; c++) {
            d = a[c];
            if (d.id == TS.model.active_channel_id) {
                continue
            }
            if (!d.is_member) {
                continue
            }
            TS.shared.checkInitialMsgHistory(d, TS.channels)
        }
        for (c = 0; c < TS.model.groups.length; c++) {
            f = TS.model.groups[c];
            if (f.id == TS.model.active_group_id) {
                continue
            }
            if (f.is_archived) {
                continue
            }
            if (!f.is_open && !f.unread_count) {
                continue
            }
            TS.shared.checkInitialMsgHistory(f, TS.groups)
        }
        TS.socket.connect();
        TS.model.logged_in_once = true
    },
    groupRenamed: function(a) {
        if (a.id != TS.model.active_group_id) {
            return
        }
        TS.client.channelDisplaySwitched(null, null, a.id, true)
    },
    channelRenamed: function(a) {
        if (a.id != TS.model.active_channel_id) {
            return
        }
        TS.client.channelDisplaySwitched(a.id, null, null, true)
    },
    memberAccountTypeChanged: function(b) {
        if (!b || b.id != TS.model.user.id) {
            return
        }
        var a;
        if (b.is_ultra_restricted) {
            a = " You are now a restricted user. "
        } else {
            if (b.is_restricted) {
                a = " You are now a guest user. "
            } else {
                a = " You are now a full member of the team. "
            }
        }
        TS.generic_dialog.start({
            title: "Reload required",
            body: "<p>Your account permissions have changed!" + a + "You must now reload for the changes to take effect.</p>",
            show_cancel_button: false,
            esc_for_ok: true,
            on_go: function() {
                TS.client.reload()
            }
        })
    },
    memberChangedName: function(b) {
        if (!TS.model.active_im_id) {
            return
        }
        var a = TS.ims.getImByMemberId(b.id);
        if (!a || a.id != TS.model.active_im_id) {
            return
        }
        TS.client.channelDisplaySwitched(null, a.id, null, true)
    },
    socketConnected: function() {
        TS.ims.checkForOldImsToClose()
    },
    startCheckingForCleanup: function() {
        setInterval(function() {
            if (TS.model.socket_connected) {
                TS.ims.checkForOldImsToClose()
            }
            TS.utility.msgs.checkForMsgsToTruncate()
        }, 1000 * 60 * 15)
    },
    onWindowUnload: function() {
        TS.client.markLastReadsWithAPI();
        TS.model.window_unloading = true;
        TS.client.window_unloaded_sig.dispatch();
        return
    },
    onPopState: function(f) {
        var d = history.location || document.location;
        TS.setQsArgs(d);
        var c = TS.utility.getFlexNameFromUrl(d.href);
        var j = TS.utility.getFlexExtraFromUrl(d.href);
        var b = TS.utility.getChannelNameFromUrl(d.href);
        TS.info("onPopState\nc_name from new url:" + b + "\nflex_name from new url:" + c + "\nflex_extra from new url:" + j);
        TS.ui.setFlexStateFromHistory(c, j);
        if (!TS.model.channels) {
            return
        }
        var k;
        var h;
        var g;
        var i;
        var a = false;
        if (b) {
            g = TS.channels.getChannelByName(b);
            if (g && g.is_member) {
                k = g.id
            } else {
                if (b.indexOf("@") != -1) {
                    h = TS.ims.getImByUsername(b);
                    if (h) {
                        k = h.id
                    }
                }
            } if (!k) {
                i = TS.groups.getGroupByName(b);
                if (i && i.is_open) {
                    k = i.id
                }
            }
        }
        if (k) {
            a = true;
            TS.info("c_name from new url is good:" + b + " " + k)
        } else {
            if (TS.model.channels.length) {
                g = TS.channels.getFirstChannelYouAreIn();
                if (g) {
                    k = g.id;
                    TS.info("got getFirstChannelYouAreIn:" + k)
                }
            }
            if (!k && TS.model.ims.length) {
                h = TS.ims.getFirstOpenIm();
                if (h) {
                    k = h.id;
                    TS.info("got getFirstOpenIm:" + k)
                }
            }
        } if (h) {
            TS.ims.startImByMemberId(h.user, true)
        } else {
            if (g) {
                TS.channels.displayChannel(g.id, null, true, !a)
            } else {
                if (i) {
                    TS.groups.displayGroup(i.id, null, true, !a)
                } else {
                    TS.error("WTF DONT KNOW WHAT TO DO")
                }
            }
        }
    },
    setInitialChannel: function() {
        var k = TS.storage.fetchActiveHistory();
        var o;
        var h;
        var l;
        var n;
        var m;
        var g;
        var f = function(i) {
            if (TS.model.welcome_model_ob.id) {
                return
            }
            if (!i) {
                return
            }
            TS.model.welcome_model_ob = i
        };
        for (h = 0; h < k.length; h++) {
            o = k[h];
            if (TS.model.active_history.indexOf(o) > -1) {
                continue
            }
            m = TS.ims.getImById(o);
            l = (m) ? null : TS.channels.getChannelById(o);
            n = (m || l) ? null : TS.groups.getGroupById(o);
            if ((l && !l.is_archived && (!TS.model.user.is_restricted || l.is_member)) || (m && m.is_open) || (n && n.is_open && !n.is_archived)) {} else {
                continue
            }
            TS.model.active_history.push(o)
        }
        var d = true;
        var c = TS.model.c_name_in_url = TS.utility.getChannelNameFromUrl(location.href);
        if (c) {
            l = TS.channels.getChannelByName(c);
            if (l && !l.is_archived) {
                if (l.is_member) {
                    f(l);
                    TS.client.channelDisplaySwitched(l.id, null, null, d);
                    return
                }
                if (!TS.model.user.is_restricted) {
                    TS.channels.join(l.name);
                    return
                }
            }
            m = TS.ims.getImByUsername(c);
            if (m) {
                f(m);
                if (m.is_open) {
                    TS.client.channelDisplaySwitched(null, m.id, null, d)
                } else {
                    TS.ims.startImByMemberId(m.user, d)
                }
                return
            }
            n = TS.groups.getGroupByName(c);
            if (n && !n.is_archived) {
                f(n);
                TS.groups.displayGroup(n.id, null, false, d);
                return
            }
            g = TS.members.getMemberByName(c);
            if (g && g.id != TS.model.user.id) {
                f(m);
                TS.ims.startImByMemberId(g.id, d);
                return
            }
            if (c.indexOf("@") != 0) {}
        }
        if (TS.model.active_history.length) {
            o = TS.model.active_history[TS.model.active_history.length - 1];
            m = TS.ims.getImById(o);
            l = (m) ? null : TS.channels.getChannelById(o);
            n = (m || l) ? null : TS.groups.getGroupById(o);
            if (m) {
                f(m);
                TS.client.channelDisplaySwitched(null, m.id, null, d);
                return
            } else {
                if (l) {
                    f(l);
                    TS.client.channelDisplaySwitched(l.id, null, null, d);
                    return
                } else {
                    if (n) {
                        f(n);
                        TS.client.channelDisplaySwitched(null, null, n.id, d);
                        return
                    } else {
                        TS.error("wtf not in channel from local history")
                    }
                }
            }
        }
        if (TS.model.user.is_restricted) {
            var j = TS.model.channels;
            j.sort(function(q, i) {
                return (q._name_lc > i._name_lc) ? 1 : ((i._name_lc > q._name_lc) ? -1 : 0)
            });
            for (h = 0; h < j.length; h++) {
                l = j[h];
                if (l.is_archived) {
                    continue
                }
                if (!l.is_member) {
                    continue
                }
                f(l);
                TS.client.channelDisplaySwitched(l.id, null, null, d);
                return
            }
            var b = TS.model.groups;
            b.sort(function(q, i) {
                return (q._name_lc > i._name_lc) ? 1 : ((i._name_lc > q._name_lc) ? -1 : 0)
            });
            for (h = 0; h < b.length; h++) {
                n = b[h];
                if (b.is_archived) {
                    continue
                }
                f(n);
                TS.groups.displayGroup(n.id, null, false, d);
                return
            }
            var p = TS.ims.getImByMemberId("USLACKBOT");
            if (p) {
                f(p);
                TS.client.channelDisplaySwitched(null, p.id, null, d);
                return
            }
        } else {
            var a = TS.channels.getGeneralChannel();
            if (a) {
                f(a);
                TS.client.channelDisplaySwitched(a.id, null, null, d);
                return
            }
        }
        alert("ERROR could not find starting channel")
    },
    markLastReadsWithAPI: function() {
        var c;
        var b;
        var d;
        var f;
        if (TS.model && TS.model.channels) {
            var a = TS.model.channels;
            for (c = 0; c < a.length; c++) {
                d = a[c];
                if (d.needs_api_marking) {
                    TS.model.last_reads_set_by_client[d.id + "_" + d.last_read] = true;
                    d.needs_api_marking = false;
                    TS.api.call("channels.mark", {
                        channel: d.id,
                        ts: d.last_read
                    }, TS.channels.onMarked)
                }
            }
        }
        if (TS.model && TS.model.ims) {
            for (c = 0; c < TS.model.ims.length; c++) {
                b = TS.model.ims[c];
                if (b.needs_api_marking) {
                    TS.model.last_reads_set_by_client[b.id + "_" + b.last_read] = true;
                    b.needs_api_marking = false;
                    TS.api.call("im.mark", {
                        channel: b.id,
                        ts: b.last_read
                    }, TS.ims.onMarked)
                }
            }
        }
        if (TS.model && TS.model.groups) {
            for (c = 0; c < TS.model.groups.length; c++) {
                f = TS.model.groups[c];
                if (f.needs_api_marking) {
                    TS.model.last_reads_set_by_client[f.id + "_" + f.last_read] = true;
                    f.needs_api_marking = false;
                    TS.api.call("groups.mark", {
                        channel: f.id,
                        ts: f.last_read
                    }, TS.groups.onMarked)
                }
            }
        }
    },
    activeChannelDisplayGoneAway: function() {
        var g = TS.model.active_history.pop();
        var c;
        var a;
        var d;
        var f;
        var b;
        while (TS.model.active_history.length && !b) {
            c = TS.model.active_history.pop();
            a = TS.ims.getImById(c);
            d = (a) ? null : TS.channels.getChannelById(c);
            f = (a || d) ? null : TS.groups.getGroupById(c);
            if (a && a.is_open) {
                b = true;
                TS.log(4, "switching to im " + a.id);
                TS.ims.displayIm(a.id);
                TS.client.channelDisplaySwitched(null, a.id, null)
            } else {
                if (f && f.is_open && !f.is_archived) {
                    b = true;
                    TS.log(4, "switching to group " + f.id);
                    TS.groups.displayGroup(f.id)
                } else {
                    if (d) {
                        b = true;
                        TS.log(4, "switching to channel " + d.id);
                        TS.channels.displayChannel(d.id, null, false, true)
                    }
                }
            }
        }
    },
    putURLInHistory: function(b, a) {
        if (!history.pushState) {
            TS.warn("This browser does not support pushState.");
            return
        }
        if (a) {
            if (window.location.href.replace(/\%20/g, " ") == b.replace(/\%20/g, " ")) {} else {
                window.history.replaceState(null, null, b)
            }
        } else {
            if (window.location.href.replace(/\%20/g, " ") == b.replace(/\%20/g, " ")) {} else {
                window.history.pushState(null, null, b)
            }
        }
    },
    cleanFlexExtra: function(a) {
        if (a && a.indexOf("#") != -1) {
            a = a.replace(/\#/g, "%23")
        }
        return a
    },
    flexDisplaySwitched: function(c, f, b, a) {
        f = TS.client.cleanFlexExtra(f);
        if (!a && TS.model.c_name_in_url) {
            var d = TS.utility.refashionUrl(window.location.href, TS.model.c_name_in_url, c, f);
            TS.client.putURLInHistory(d, b)
        }
        TS.model.flex_name_in_url = c;
        TS.model.flex_extra_in_url = f;
        TS.model.ui_state.flex_name = c;
        TS.model.ui_state.flex_extra = f;
        TS.storage.storeUIState(TS.model.ui_state);
        TS.client.flexpane_display_switched_sig.dispatch()
    },
    channelDisplaySwitched: function(l, d, o, f, b) {
        if ((l && (d || o)) || (d && (l || o))) {
            TS.error("more than one? channel_id:" + l + " im_id:" + d + " group_id:" + o);
            return false
        }
        if (!l && !d && !o) {
            TS.error("none? channel_id:" + l + " im_id:" + d + " group_id:" + o);
            return false
        }
        var k;
        var m;
        var n;
        var c;
        if (l) {
            k = TS.channels.getChannelById(l);
            c = k.name
        }
        if (d) {
            m = TS.ims.getImById(d);
            c = "@" + m.name
        }
        if (o) {
            n = TS.groups.getGroupById(o);
            c = n.name
        }
        var a = k || n || m;
        if (!b) {
            var q = TS.client.cleanFlexExtra(TS.model.flex_extra_in_url);
            var h = TS.utility.refashionUrl(window.location.href, c, TS.model.flex_name_in_url, q);
            TS.client.putURLInHistory(h, !TS.model.c_name_in_url || f)
        }
        TS.model.c_name_in_url = c;
        if (l && l == TS.model.active_channel_id) {
            TS.warn("not switching, it is the active channel already");
            return false
        }
        if (d && d == TS.model.active_im_id) {
            TS.warn("not switching, it is the active im already");
            return false
        }
        if (o && o == TS.model.active_group_id) {
            TS.warn("not switching, it is the active group already");
            return false
        }
        TS.utility.msgs.checkForMsgsToTruncate();
        TS.model.last_active_cid = TS.model.active_channel_id || TS.model.active_im_id || TS.model.active_group_id;
        TS.model.active_channel_id = l;
        TS.model.active_im_id = d;
        TS.model.active_group_id = o;
        TS.model.active_cid = TS.model.active_channel_id || TS.model.active_im_id || TS.model.active_group_id;
        TS.view.updateTitleWithContext();
        a.last_made_active = TS.utility.date.getTimeStamp();
        var p = l || d || o;
        TS.log(4, p + " is now active");
        var j = TS.model.active_history;
        var g = j.indexOf(p);
        if (g != -1) {
            j.splice(g, 1)
        }
        j.push(p);
        TS.log(4, j);
        TS.storage.storeActiveHistory(j);
        return true
    },
    reconnect: function() {
        if (TS.model.asleep) {
            TS.error("NOT reconnecting, we are asleep");
            return
        }
        TS.client.login()
    },
    sleep: function() {
        if (TS.model.asleep) {
            return
        }
        TS.model.asleep = true;
        TS.socket.disconnect()
    },
    wake: function() {
        if (!TS.model.asleep) {
            return
        }
        TS.model.asleep = false;
        TS.socket.startReconnection()
    }
});
TS.registerModule("view", {
    id: "TSview",
    msgs_scroller_div: null,
    msgs_div: null,
    input_el: $("#message-input"),
    banner_el: $("#banner"),
    last_read_msg_div: null,
    msgs_unread_divider: null,
    last_rendered_msg: null,
    file_list_heading: "All File Types",
    file_list_lazyload: null,
    members_list_lazyload: null,
    member_stars_list_lazyload: null,
    decorated_messages: {},
    localTimeRefreshInterval: null,
    last_user_active_timestamp: new Date(),
    last_attachment_max_width: null,
    onStart: function() {
        TS.client.login_sig.add(TS.view.loggedIn, TS.view);
        TS.socket.connected_sig.add(TS.view.socketConnected, TS.view);
        TS.socket.trouble_sig.add(TS.view.socketTroubled, TS.view);
        TS.socket.disconnected_sig.add(TS.view.socketDisconnected, TS.view);
        TS.socket.pong_sig.add(TS.view.ponged, TS.view);
        TS.socket.reconnecting_sig.add(TS.view.socketReconnecting, TS.view);
        TS.client.window_unloaded_sig.add(TS.view.windowUnloaded, TS.view);
        TS.channels.renamed_sig.add(TS.view.channelRenamed, TS.view);
        TS.channels.switched_sig.add(TS.view.channelSwitched, TS.view);
        TS.channels.created_sig.add(TS.view.channelCreated, TS.view);
        TS.channels.deleted_sig.add(TS.view.channelDeleted, TS.view);
        TS.channels.joined_sig.add(TS.view.channelJoined, TS.view);
        TS.channels.member_joined_sig.add(TS.view.channelMemberJoined, TS.view);
        TS.channels.left_sig.add(TS.view.channelLeft, TS.view);
        TS.channels.member_left_sig.add(TS.view.channelMemberLeft, TS.view);
        TS.channels.history_fetched_sig.add(TS.view.channelHistoryFetched, TS.view);
        TS.channels.history_being_fetched_sig.add(TS.view.channelHistoryBeingFetched, TS.view);
        TS.channels.message_received_sig.add(TS.view.channelMessageReceived, TS.view);
        TS.channels.message_removed_sig.add(TS.view.channelMessageRemoved, TS.view);
        TS.channels.message_changed_sig.add(TS.view.channelMessageChanged, TS.view);
        TS.channels.marked_sig.add(TS.view.channelMarked, TS.view);
        TS.channels.unread_changed_sig.add(TS.view.channelUnreadCountChanged, TS.view);
        TS.channels.unread_highlight_changed_sig.add(TS.view.channelUnreadHighlightCountChanged, TS.view);
        TS.channels.topic_changed_sig.add(TS.view.channelTopicChanged, TS.view);
        TS.channels.purpose_changed_sig.add(TS.view.channelPurposeChanged, TS.view);
        TS.channels.archived_sig.add(TS.view.channelArchived, TS.view);
        TS.channels.unarchived_sig.add(TS.view.channelUnArchived, TS.view);
        TS.channels.msg_not_sent_sig.add(TS.view.channelMsgNotsent, TS.view);
        TS.groups.renamed_sig.add(TS.view.groupRenamed, TS.view);
        TS.groups.switched_sig.add(TS.view.groupSwitched, TS.view);
        TS.groups.deleted_sig.add(TS.view.groupDeleted, TS.view);
        TS.groups.joined_sig.add(TS.view.groupJoined, TS.view);
        TS.groups.member_joined_sig.add(TS.view.groupMemberJoined, TS.view);
        TS.groups.left_sig.add(TS.view.groupLeft, TS.view);
        TS.groups.member_left_sig.add(TS.view.groupMemberLeft, TS.view);
        TS.groups.history_fetched_sig.add(TS.view.groupHistoryFetched, TS.view);
        TS.groups.history_being_fetched_sig.add(TS.view.groupHistoryBeingFetched, TS.view);
        TS.groups.message_received_sig.add(TS.view.groupMessageReceived, TS.view);
        TS.groups.message_removed_sig.add(TS.view.groupMessageRemoved, TS.view);
        TS.groups.message_changed_sig.add(TS.view.groupMessageChanged, TS.view);
        TS.groups.marked_sig.add(TS.view.groupMarked, TS.view);
        TS.groups.unread_changed_sig.add(TS.view.groupUnreadCountChanged, TS.view);
        TS.groups.unread_highlight_changed_sig.add(TS.view.groupUnreadHighlightCountChanged, TS.view);
        TS.groups.topic_changed_sig.add(TS.view.groupTopicChanged, TS.view);
        TS.groups.purpose_changed_sig.add(TS.view.groupPurposeChanged, TS.view);
        TS.groups.opened_sig.add(TS.view.groupOpened, TS.view);
        TS.groups.closed_sig.add(TS.view.groupClosed, TS.view);
        TS.groups.archived_sig.add(TS.view.groupArchived, TS.view);
        TS.groups.unarchived_sig.add(TS.view.groupUnArchived, TS.view);
        TS.groups.msg_not_sent_sig.add(TS.view.groupMsgNotSent, TS.view);
        TS.ims.opened_sig.add(TS.view.imOpened, TS.view);
        TS.ims.closed_sig.add(TS.view.imClosed, TS.view);
        TS.ims.switched_sig.add(TS.view.imSwitched, TS.view);
        TS.ims.history_fetched_sig.add(TS.view.imHistoryFetched, TS.view);
        TS.ims.history_being_fetched_sig.add(TS.view.imHistoryBeingFetched, TS.view);
        TS.ims.message_received_sig.add(TS.view.imMessageReceived, TS.view);
        TS.ims.message_removed_sig.add(TS.view.imMessageRemoved, TS.view);
        TS.ims.message_changed_sig.add(TS.view.imMessageChanged, TS.view);
        TS.ims.marked_sig.add(TS.view.imMarked, TS.view);
        TS.ims.unread_changed_sig.add(TS.view.imUnreadCountChanged, TS.view);
        TS.ims.unread_highlight_changed_sig.add(TS.view.imUnreadHighlightCountChanged, TS.view);
        TS.ims.msg_not_sent_sig.add(TS.view.imMsgNotsent, TS.view);
        TS.members.presence_changed_sig.add(TS.view.memberPresenceChanged, TS.view);
        TS.members.status_changed_sig.add(TS.view.memberStatusChanged, TS.view);
        TS.members.joined_team_sig.add(TS.view.memberJoinedTeam, TS.view);
        TS.members.members_for_user_changed_sig.add(TS.view.memberChangeVisibilityToUser, TS.view);
        TS.members.changed_name_sig.add(TS.view.memberChangedName, TS.view);
        TS.members.changed_self_sig.add(TS.view.somethingChangedOnUser, TS.view);
        TS.members.changed_deleted_sig.add(TS.view.memberChangedDeleted, TS.view);
        TS.members.changed_profile_sig.add(TS.view.memberChangedProfile, TS.view);
        TS.members.changed_tz_sig.add(TS.view.memberChangedTZ, TS.view);
        TS.members.changed_account_type_sig.add(TS.view.memberAccountTypeChanged, TS.view);
        TS.bots.added_sig.add(TS.view.botChanged, TS.view);
        TS.bots.changed_name_sig.add(TS.view.botChanged, TS.view);
        TS.bots.changed_icons_sig.add(TS.view.botChanged, TS.view);
        TS.ui.file_dropped_sig.add(TS.view.filesDropped);
        TS.ui.file_pasted_sig.add(TS.view.filePasted);
        TS.files.team_files_fetched_sig.add(TS.view.teamFilesFetched, TS.view);
        TS.files.team_file_added_sig.add(TS.view.teamFileAdded, TS.view);
        TS.files.team_file_deleted_sig.add(TS.view.teamFileDeleted, TS.view);
        TS.files.team_file_changed_sig.add(TS.view.teamFileChanged, TS.view);
        TS.files.file_uploaded_sig.add(TS.view.fileUploaded, TS.view);
        TS.files.file_uploading_sig.add(TS.view.fileUploading, TS.view);
        TS.files.file_progress_sig.add(TS.view.fileProgress, TS.view);
        TS.files.file_canceled_sig.add(TS.view.fileCanceled, TS.view);
        TS.files.file_queue_emptied_sig.add(TS.view.fileQueueEmptied, TS.view);
        TS.prefs.webapp_spellcheck_changed_sig.add(TS.view.toggleSpellcheck, TS.view);
        TS.prefs.highlight_words_changed_sig.add(TS.view.rebuildMsgs, TS.view);
        TS.prefs.emoji_mode_changed_sig.add(TS.view.farReachingDisplayPrefChanged, TS.view);
        TS.prefs.expand_inline_imgs_changed_sig.add(TS.view.rebuildMsgs, TS.view);
        TS.prefs.expand_internal_inline_imgs_changed_sig.add(TS.view.rebuildMsgs, TS.view);
        TS.prefs.expand_non_media_attachments_changed_sig.add(TS.view.rebuildMsgs, TS.view);
        TS.prefs.obey_inline_img_limit_changed_sig.add(TS.view.rebuildMsgs, TS.view);
        TS.prefs.show_member_presence_changed_sig.add(TS.view.setPresenceClasses, TS.view);
        TS.prefs.messages_theme_changed_sig.add(TS.setThemeClasses, TS);
        TS.prefs.dtop_notif_changed_sig.add(TS.view.dTopNotificationChanged, TS.view);
        TS.prefs.team_hide_referers_changed_sig.add(TS.view.rebuildMsgs, TS.view);
        TS.prefs.team_perms_pref_changed_sig.add(TS.view.teamPermsPrefChanged, TS.view);
        TS.prefs.display_real_names_override_changed_sig.add(TS.view.farReachingDisplayPrefChanged, TS.view);
        TS.prefs.team_display_real_names_changed_sig.add(TS.view.farReachingDisplayPrefChanged, TS.view);
        TS.prefs.time24_changed_sig.add(TS.view.time24PrefChanged, TS.view);
        TS.prefs.sidebar_theme_changed_sig.add(TS.view.sidebarThemePrefChanged, TS.view);
        TS.stars.member_stars_fetched_sig.add(TS.view.memberStarsFetched, TS.view);
        TS.mentions.mentions_fetched_sig.add(TS.view.mentionsFetched, TS.view);
        TS.mentions.mention_changed_sig.add(TS.view.mentionChanged, TS.view);
        TS.mentions.mention_removed_sig.add(TS.view.mentionRemoved, TS.view);
        TS.typing.started_sig.add(TS.view.memberTypingStarted, TS.view);
        TS.typing.ended_sig.add(TS.view.memberTypingEnded, TS.view);
        TS.view.msgs_div = $("#msgs_div");
        TS.view.msgs_scroller_div = $("#msgs_scroller_div");
        TS.view.resizeManually("TS.view.onStart");
        $(window).resize(TS.view.onResize);
        if (TS.qs_args.new_scroll != "0") {
            var a = TS.qs_args.debug_scroll == "1";
            TS.view.msgs_scroller_div.monkeyScroll({
                debug: a,
                bar_colors: {
                    0: "#bac1ca",
                    0.9: "#cad1db",
                    1: "#d9d9de"
                }
            });
            $(".flex_content_scroller").monkeyScroll({
                debug: a
            });
            $("#channels_scroller").monkeyScroll({
                debug: a
            });
            $("#members_scroller").monkeyScroll({
                debug: a
            })
        }
        TS.view.changeConnectionStatus("trouble");
        TS.view.msgs_div.bind("click.view", TS.view.onMsgsDivClick);
        $(".help").bind("click.view", TS.view.onHelpClick);
        $("#activity_feed_items").bind("click.view", TS.view.onActivityFeedClick);
        $("#member_stars_list").bind("click.view", TS.view.onStarsListClick);
        $("#member_mentions").bind("click.view", TS.view.onMembersMentionsClick);
        $("#file_list").bind("click.view", TS.view.onFileListClick);
        $("#file_preview_scroller").bind("click.view", TS.view.onFilePreviewClick);
        $("#member_preview_scroller").bind("click.view", TS.view.onMemberPreviewClick);
        $("#team_list_members").bind("click.view", TS.view.onMemberListClick);
        $("#channel_members").bind("click.view", TS.view.onChannelMemberListClick);
        $("#search_results_container").bind("click.view", TS.view.onSearchResultsClick);
        $("#im_meta").on("click", function(c) {
            TS.view.doLinkThings(c)
        });
        $("a.clear_unread_messages").tooltip({
            placement: "bottom",
            delay: {
                show: 500,
                hide: 150
            }
        });
        TS.view.cached_wh = 0;
        TS.view.resizeManually("TS.view.onStart 2");
        var b = false;
        $(window).bind("scroll", function(c) {
            if (b) {
                return
            }
            b = true;
            $(window).unbind("mouseup.scroll").bind("mouseup.scroll", function(d) {
                b = false;
                $(window).unbind("mouseup.scroll");
                $("body").scrollTop(0)
            })
        });
        if (TS.model.is_mac) {
            $("#drag_drop_mac_key").text("Command")
        }
        $(window).on("click", TS.view.updateUserActive)
    },
    was_at_bottom_at_first_resize_event: false,
    resize_tim: 0,
    onResize: function() {
        if (!TS.view.triggering_resize) {
            TS.view.cached_wh = 0
        }
        TS.ui.cached_scroller_rect = null;
        TS.ui.cached_search_scroller_rect = null;
        TS.ui.cached_channels_scroller_rect = null;
        if (TS.view.resize_tim) {
            clearTimeout(TS.view.resize_tim);
            TS.view.resize_tim = 0
        } else {
            TS.view.was_at_bottom_at_first_resize_event = TS.ui.areMsgsScrolledToBottom(50)
        }
        TS.view.resize_tim = setTimeout(function() {
            clearTimeout(TS.view.resize_tim);
            TS.view.resize_tim = 0;
            TS.view.resize(true)
        }, 250);
        if (TS.view.triggering_resize) {
            return
        }
        TS.view.resize(false, true)
    },
    team_menu_h: $("#team_menu").height(),
    cached_wh: 0,
    last_input_height: 0,
    last_input_container_height: 0,
    msgs_scroller_y: -1,
    footer_outer_h: -1,
    default_col_flex_top: -1,
    triggering_resize: false,
    resizeManually: function(a, b) {
        a = a || "unspecified";
        TS.log(389, "======================================resizeManually (" + a + ") starting");
        var c = TS.utility.date.getTimeStamp();
        TS.view.resize(false, false, !!b);
        TS.log(389, "======================================resizeManually (" + a + ") took " + (TS.utility.date.getTimeStamp() - c) + "ms")
    },
    setFlexMenuSize: function() {
        $("#menu_items_scroller").css("max-height", TS.view.cached_wh - 200);
        TS.ui.updateClosestMonkeyScroller($("#menu_items_scroller"))
    },
    cached_wh: 0,
    resize: function(j, i, h) {
        var c = TS.utility.date.getTimeStamp();
        TS.log(389, c + " #1 cached_wh:" + TS.view.cached_wh + " TS.view.resize from_timer:" + j + " no_trigger:" + i + " " + (TS.utility.date.getTimeStamp() - c) + "ms");
        c = TS.utility.date.getTimeStamp();
        var a = TS.ui.areMsgsScrolledToBottom(50);
        TS.log(389, c + " #2 " + (TS.utility.date.getTimeStamp() - c) + "ms");
        c = TS.utility.date.getTimeStamp();
        var f = TS.view.cached_wh == 0;
        var b = TS.view.cached_wh = TS.view.cached_wh || $(window).height();
        if (TS.view.msgs_scroller_y == -1) {
            TS.view.msgs_scroller_y = TS.view.msgs_scroller_div.offset().top
        }
        if (TS.view.footer_outer_h == -1) {
            TS.view.footer_outer_h = $("#footer").outerHeight()
        }
        if (TS.view.default_col_flex_top == -1) {
            TS.view.default_col_flex_top = parseInt($("#col_flex").css("top"))
        }
        var d = (TS.view.banner_el.hasClass("hidden")) ? 0 : parseInt(TS.view.banner_el.css("height"));
        if (d) {
            $("#col_flex").css("top", TS.view.default_col_flex_top + d)
        } else {
            $("#col_flex").css("top", TS.view.default_col_flex_top)
        } if (TS.model.menu_is_showing) {
            TS.view.setFlexMenuSize()
        }
        $("#col_channels_bg").css("top", d);
        if (f || !!TS.view.last_input_height) {
            if (!TS.view.last_input_height) {
                TS.view.measureInput()
            }
            $("#message-form").css("height", TS.view.last_input_height);
            var g = b - TS.view.msgs_scroller_y - TS.view.last_input_container_height - (22 + d);
            TS.view.msgs_scroller_div.css("height", g);
            var l = b - TS.view.msgs_scroller_y;
            $("#flex_contents > .tab-pane").css("height", l);
            $("#channels_scroller").css("height", b - TS.view.team_menu_h - (TS.view.footer_outer_h + d))
        }
        TS.log(389, c + " #10 " + (TS.utility.date.getTimeStamp() - c) + "ms");
        c = TS.utility.date.getTimeStamp();
        if (true || f || TS.view.never_set) {
            $(".flex_content_scroller").each(function(n) {
                var o = $(this);
                if (o.is(":hidden")) {
                    return
                }
                TS.view.never_set = false;
                var m = o.offset().top;
                var p = b - m;
                o.css("height", p)
            })
        }
        TS.log(389, c + " #11 wh_changed:" + f + " " + (TS.utility.date.getTimeStamp() - c) + "ms");
        c = TS.utility.date.getTimeStamp();
        TS.view.padOutMsgsScroller();
        if (!h && (a || TS.view.was_at_bottom_at_first_resize_event)) {
            TS.ui.instaScrollMsgsToBottom()
        }
        if (j) {
            TS.view.was_at_bottom_at_first_resize_event = false
        } else {
            if (!i) {
                TS.view.triggering_resize = true;
                $(window).trigger("resize");
                TS.view.triggering_resize = false
            }
        }
        TS.ui.checkUnseenChannelsImsGroupsWithUnreads();
        if (TS.view.msgs_unscrollable) {
            TS.view.makeMsgsDivUnscrollable()
        }
        TS.ui.msg_tab_complete.positionUI();
        if ($("#lightbox_dialog").is(":visible")) {
            TS.ui.lightbox_dialog.position()
        }
        var k = $("#msgs_div").width();
        TS.view.makeAttachmentWidthRule(k);
        if (k > 400) {
            $("#notification_bar").addClass("wide")
        } else {
            $("#notification_bar").removeClass("wide")
        } if (k > 600) {
            $("#notification_bar").addClass("really_wide")
        } else {
            $("#notification_bar").removeClass("really_wide")
        }
        TS.log(389, c + " #15 " + (TS.utility.date.getTimeStamp() - c) + "ms")
    },
    never_set: true,
    measureInput: function() {
        TS.view.last_input_height = TS.view.input_el[0].offsetHeight;
        $("#messages-input-container").css("height", TS.view.last_input_height);
        TS.view.last_input_container_height = $("#messages-input-container").outerHeight()
    },
    makeAttachmentWidthRule: function(g) {
        var b, d, a, f, c;
        f = -60;
        if (TS.model.prefs && TS.model.prefs.theme == "dense") {
            f = -70
        }
        b = (g + f);
        c = "			#msgs_div div.dynamic_content_max_width {				max-width:" + b + "px;			}		";
        if (TS.view.last_attachment_max_width !== b) {
            TS.view.last_attachment_max_width = b;
            d = "dynamic_content_max_width_rule";
            a = $("#" + d);
            if (a.length) {
                a.html(c)
            } else {
                $('<style type="text/css" id="' + d + '">' + c + "</style>").appendTo("head")
            }
        }
    },
    filesSelected: function(a) {
        TS.ui.validateFiles(a, false, function(c, b) {
            TS.ui.upload_dialog.startWithCommentFromChatInput(c)
        })
    },
    filePasted: function(b, a) {
        if (a) {
            TS.files.justUploadTheseFileNow([b])
        } else {
            TS.ui.upload_dialog.startWithCommentFromChatInput([b])
        }
    },
    filesDropped: function(b, a) {
        if (a) {
            TS.files.justUploadTheseFileNow(b)
        } else {
            TS.ui.upload_dialog.startWithCommentFromChatInput(b)
        }
    },
    fileUploading: function(c, b, a) {
        c = TS.utility.htmlEntities(c);
        var d = "";
        if (a) {
            d += '<a id="cancel_upload_in_progress" class="float-right right_margin">cancel</a>'
        }
        d += '<span id="progress_label">';
        if (b) {
            d += "Re-uploading"
        } else {
            d += "Uploading"
        }
        d += " <strong class='filename'>" + TS.utility.htmlEntities(c) + "</strong> ...</span> <span id='progress_percent'></span> <span id='progress_queue'></span>";
        $("#file_progress").queue(function(f) {
            $(this).removeClass("hidden candy_red_bg ocean_teal_bg loaded").find("#progress_text").html(d).find("#cancel_upload_in_progress").click(TS.files.cancelCurrentUpload);
            f()
        }).fadeIn(200)
    },
    fileProgress: function(a) {
        $("#file_progress").queue(function(b) {
            $("#file_progress").find("#progress_bar.no_transition").removeClass("no_transition");
            if (a < 99) {
                $("#file_progress").find("#progress_bar").css({
                    width: a + "%"
                }).end().find("#progress_percent").text(a + "%")
            } else {
                $("#file_progress").addClass("loaded").find("#progress_bar").css({
                    width: "100%"
                }).end().find("#progress_percent").remove().end().find("#cancel_upload_in_progress").remove().end().find("#progress_label").text("Processing uploaded file ...")
            } if (TS.files.uploadQ.length) {
                $("#file_progress").find("#progress_queue").html(" <span>(1 of " + (TS.files.uploadQ.length + 1) + ")</span>")
            }
            b()
        })
    },
    fileUploaded: function(a, b) {
        $("#file_progress").queue(function(d) {
            if (a) {
                $("#file_progress").addClass("ocean_teal_bg").removeClass("loaded").find("#progress_bar").addClass("no_transition").css({
                    width: "0%"
                }).end().find("#progress_label").html("Processing uploaded file ... complete!").end().find("#progress_percent").text("");
                if (TS.model.ui_state.flex_visible) {
                    var c = TS.files.getFileById(b);
                    if (c && (c.mode == "snippet" || c.mode == "post")) {
                        TS.ui.previewFile(c.id, "file_list")
                    }
                }
            } else {}
            d()
        }).delay(1000)
    },
    fileCanceled: function(a) {
        $("#file_progress").queue(function(b) {
            $("#file_progress").addClass("candy_red_bg").removeClass("loaded").find("#progress_bar").css({
                width: "0%"
            }).end().find("#progress_label").html("Canceling <strong class='filename'>" + TS.utility.htmlEntities(a) + "</strong> ...").end().find("#cancel_upload_in_progress").remove().end().find("#progress_percent").text("");
            b()
        }).delay(1000)
    },
    fileQueueEmptied: function() {
        $("#file_progress").fadeOut(200)
    },
    updateTypingText: function() {
        var a = TS.typing.getTypersInChannel(TS.shared.getActiveModelOb().id);
        if (!a || !a.length) {
            $("#typing_text").empty();
            $("#notification_bar").removeClass("showing_typing");
            return
        }
        if (!TS.model.prefs.show_typing) {
            return
        }
        $("#notification_bar").addClass("showing_typing");
        if (a.length == 1) {
            $("#typing_text").html('<span class="typing_name">' + TS.utility.htmlEntities(TS.members.getMemberDisplayName(a[0])) + "</span> is typing")
        } else {
            if (a.length == 2) {
                $("#typing_text").html('<span class="typing_name">' + TS.utility.htmlEntities(TS.members.getMemberDisplayName(a[0])) + '</span> and <span class="typing_name">' + TS.utility.htmlEntities(TS.members.getMemberDisplayName(a[1])) + "</span> are typing")
            } else {
                $("#typing_text").html("several people are typing")
            }
        }
    },
    teamFilesFetched: function(a) {
        TS.view.throttledRebuildFileList()
    },
    teamFileAdded: function(a) {
        if (!a.is_deleted && TS.view.shouldFileAppearInlist(a)) {
            TS.view.throttledRebuildFileList()
        }
    },
    teamFileChanged: function(b) {
        if (!b.is_deleted && TS.view.shouldFileAppearInlist(b)) {
            TS.view.throttledRebuildFileList()
        }
        var a = TS.shared.getActiveModelOb();
        if (a) {
            TS.utility.msgs.updateFileMsgs(a, b)
        }
    },
    teamFileDeleted: function(a) {
        if (TS.view.shouldFileAppearInlist(a)) {
            TS.view.throttledRebuildFileList()
        }
    },
    throttledRebuildFileList: function() {
        TS.utility.throttle.method(TS.view.rebuildFileList, "file_list_rebuid", 1000)
    },
    fileFilterSet: function() {
        if (TS.ui.active_tab_id != "files" || !TS.model.ui_state.flex_visible || TS.model.previewed_file_id) {
            TS.ui.showFileList()
        }
        TS.view.rebuildFileList();
        $("#file_list_scroller").scrollTop(0);
        var a = $("#file_list").data("list");
        if (a == "user") {
            TS.files.fetchMemberFiles(TS.model.user.id, TS.model.file_list_types);
            return
        } else {
            if (a.indexOf("U") == 0) {
                TS.files.fetchMemberFiles($("#file_list").data("filter-user"), TS.model.file_list_types);
                return
            }
        }
        TS.files.fetchTeamFiles(TS.model.file_list_types)
    },
    fileClearFilter: function() {
        TS.model.active_file_list_filter = "all";
        TS.view.file_list_heading = "All File Types";
        TS.model.file_list_types = ["all"];
        TS.view.fileFilterSet();
        TS.view.fileSetButtonState("all");
        $("#file_list_clear_filter").addClass("hidden")
    },
    fileSetButtonState: function(a) {
        $(".secondary_file_button").addClass("hidden");
        if (a == "snippets") {
            $("#secondary_snippet_button").removeClass("hidden")
        } else {
            if (a == "posts") {
                $("#secondary_post_button").removeClass("hidden")
            } else {
                $("#file_list_button").removeClass("hidden")
            }
        }
    },
    shouldFileAppearInlist: function(b) {
        var a = TS.model.file_list_types;
        if (!a) {
            return true
        }
        if (!a.length) {
            return true
        }
        if (a.indexOf("all") > -1) {
            return true
        }
        if (a.indexOf("snippets") > -1 && b.mode == "snippet") {
            return true
        }
        if (a.indexOf("posts") > -1 && b.mode == "post") {
            return true
        }
        if (a.indexOf("zips") > -1 && b.filetype == "zip") {
            return true
        }
        if (a.indexOf("pdfs") > -1 && b.filetype == "pdf") {
            return true
        }
        if (a.indexOf("images") > -1 && b.mimetype && b.mimetype.indexOf("image/") == 0) {
            return true
        }
        if (a.indexOf("gdocs") > -1 && b.mimetype && b.mimetype.indexOf("application/vnd.google-apps") == 0) {
            return true
        }
        return false
    },
    last_files_html: "",
    rebuildFileList: function() {
        TS.log(5, "rebuildFileList");
        var d = TS.utility.date.getTimeStamp();
        var c = $("#file_list");
        var o = $("#file_list_block");
        var g = c.data("list");
        var b = TS.model.files;
        var k;
        var n = "/files";
        if (g == "user") {
            b = TS.model.user.files;
            n += "/" + TS.model.user.name
        } else {
            if (g.indexOf("U") == 0) {
                k = TS.members.getMemberById(g);
                if (k) {
                    b = k.files;
                    n += "/" + k.name
                } else {
                    TS.error(id + " is not valid?")
                }
            }
        }
        var l = "";
        var f;
        for (var j = 0; j < b.length; j++) {
            f = b[j];
            if (!f.is_deleted && TS.view.shouldFileAppearInlist(f)) {
                l += TS.templates.builders.fileHTML(f)
            }
        }
        $("#file_list_heading").find(".heading_label").text(TS.view.file_list_heading);
        $("#file_list_toggle").removeClass("hidden");
        $("#file_search_cancel").addClass("hidden");
        l = l.replace(/\ue000/g, "").replace(/\ue001/g, "");
        var m = TS.model.file_list_types;
        var h = !m || !m.length || m.indexOf("all") != -1;
        o.find(".subsection").addClass("hidden");
        if (h) {
            o.find('.subsection[data-filter="all"]').removeClass("hidden")
        } else {
            if (TS.model.active_file_list_member_filter == "all") {
                n += "/all"
            }
            n += "/" + TS.model.active_file_list_filter;
            o.find('.subsection[data-filter="' + m[0] + '"]').removeClass("hidden")
        } if (!l) {
            var a = ".";
            if (g == "user") {
                a = " from you."
            } else {
                if (k) {
                    a = " from <strong>" + TS.members.getMemberDisplayName(k, true) + "</strong>."
                }
            } if (h) {
                l = '<p class="no_results">No files' + a + "</p>"
            } else {
                l = '<p class="no_results">No ' + TS.model.file_list_type_map[m[0]] + a + "</p>"
            }
        }
        if (l != TS.view.last_files_html) {
            if (TS.view.file_list_lazyload && TS.view.file_list_lazyload.detachEvents) {
                TS.view.file_list_lazyload.detachEvents()
            }
            c.empty()[0].innerHTML = l;
            TS.view.makeSureAllLinksHaveTargets(c);
            TS.view.file_list_lazyload = c.find("img.lazy").lazyload({
                container: $("#file_list_scroller")
            });
            $("#file_list_scroller").trigger("resize-immediate")
        }
        TS.view.last_files_html = l;
        if (TS.model.files.length == 0) {
            $("#file_listing_bottom_button").addClass("hidden")
        } else {
            $("#file_listing_bottom_button").removeClass("hidden").attr("href", n)
        }
        TS.ui.updateClosestMonkeyScroller(c)
    },
    makeSureAllLinksHaveTargets: function(a) {
        var c = TS.utility.date.getTimeStamp();
        var b = [];
        a.find("a[href]:not([target])").each(function() {
            var d = $(this);
            var f = d.attr("href");
            if (f.indexOf("mailto") == 0 || f.indexOf("skype") == 0) {
                return
            }
            b.push(this.outerHTML);
            if (f && f != "#") {
                d.attr("target", f)
            } else {
                d.removeAttr("href")
            }
            b[b.length - 1] += "\n->\n" + this.outerHTML
        });
        if (!TS.model || !TS.model.team || TS.model.team.domain != "tinyspeck") {
            return
        }
        if (b.length) {
            TS.warn("#" + a.attr("id") + " had " + b.length + " LINKS WITH HREFS BUT WITHOUT TARGETS! to add targets it took " + (TS.utility.date.getTimeStamp() - c) + "ms");
            TS.dir(0, b)
        } else {}
        TS.utility.makeSureAllExternalLinksHaveAreRefererSafe(a)
    },
    shareFileInCurrentChannelOrIM: function(a) {
        TS.ui.share_dialog.start(a)
    },
    deleteFile: function(a) {
        TS.generic_dialog.start({
            title: "Delete file",
            body: "Are you sure you want to delete this file permanently?",
            show_cancel_button: true,
            show_go_button: true,
            go_button_class: "btn-danger",
            go_button_text: "Yes, delete this file",
            cancel_button_text: "Cancel",
            on_go: function() {
                TS.files.deleteFile(a)
            }
        })
    },
    saveFileToDropbox: function(a) {
        TS.generic_dialog.start({
            title: "Save to Dropbox",
            body: "Do you want to save this file to your Dropbox Slack folder?",
            show_cancel_button: true,
            show_go_button: true,
            go_button_text: "Yes",
            cancel_button_text: "No",
            on_go: function() {
                TS.files.saveFileToDropbox(a)
            }
        })
    },
    padOutMsgsScroller: function() {
        var d = $("#end_div");
        var a = $("#end_display_div");
        var b = $("#end_display_padder");
        d.css("height", "");
        b.css("height", "");
        var c = a.outerHeight();
        var f = TS.view.msgs_scroller_div[0].scrollHeight - TS.view.msgs_div.outerHeight();
        f -= 40;
        if (f > c) {
            if (!TS.newxp.shouldShowFirstWelcome()) {
                b.css("height", f - c)
            }
            d.height(f)
        }
    },
    getSelectorForTypingIndicator: function(b, c) {
        var a;
        if (b.is_im) {
            a = ".channels_list_holder ul li." + TS.templates.makeMemberDomId(c)
        } else {
            if (b.id == TS.shared.getActiveModelOb().id) {
                a = "#" + TS.templates.makeChannelListDomId(b) + " ." + TS.templates.makeMemberDomId(c)
            }
        }
        return a
    },
    memberTypingStarted: function(b, c) {
        if (!TS.model.prefs.show_typing) {
            return
        }
        if (b.id == TS.shared.getActiveModelOb().id) {
            TS.view.updateTypingText()
        }
        if (c.is_self) {
            TS.view.updateUserActive();
            return
        }
        var a = TS.view.getSelectorForTypingIndicator(b, c);
        if (a) {
            $(a).addClass("typing")
        }
    },
    memberTypingEnded: function(b, c) {
        if (b.id == TS.shared.getActiveModelOb().id) {
            TS.view.updateTypingText()
        }
        var a = TS.view.getSelectorForTypingIndicator(b, c);
        if (a) {
            $(a).removeClass("typing")
        }
    },
    memberPresenceChanged: function(d) {
        if (!d) {
            return
        }
        if (d.is_self) {
            TS.view.updateUserPresence();
            if (TS.model.socket_connected) {
                TS.view.maybeChangeConnectionDisplay()
            }
            var c = $("#menu").find("#member_presence").find(".menu_item_label");
            if (d.presence == "away") {
                c.text("[Away] Set yourself to active")
            } else {
                c.text("Set yourself away")
            }
        } else {
            var a = "." + TS.templates.makeMemberDomId(d);
            if (d.presence == "away") {
                $(a).addClass("away")
            } else {
                $(a).removeClass("away")
            }
        }
        var a = "." + TS.templates.makeMemberPresenceDomClass(d.id);
        $(a).removeClass("away active").addClass(d.presence).attr("title", d.presence);
        var b = TS.shared.getActiveModelOb();
        if ((TS.model.active_channel_id || TS.model.active_group_id) && b.members.indexOf(d.id) > -1) {
            TS.view.rebuildChannelMembersList()
        }
    },
    getUserPresenceStr: function() {
        var a = TS.model.user;
        if (a.manual_presence == "away") {
            return a.presence + " (manual)"
        } else {
            return a.presence
        }
    },
    updateUserPresence: function() {
        $(".user_presence_label").text(TS.view.getUserPresenceStr())
    },
    memberJoinedTeam: function(a) {
        TS.view.rebuildTeamList()
    },
    member_changed_visibility_to_user_tim: 0,
    memberChangeVisibilityToUser: function() {
        clearTimeout(TS.view.member_changed_visibility_to_user_tim);
        TS.view.member_changed_visibility_to_user_tim = setTimeout(function() {
            TS.view.rebuildImList();
            TS.view.rebuildStarredList();
            TS.view.rebuildTeamList()
        }, 1000)
    },
    somethingChangedOnUser: function(a) {
        TS.view.showProperTeamPaneFiller()
    },
    memberChangedName: function(a) {
        if (a.id == TS.model.user.id) {
            $("#current_user_name").html(a.name);
            TS.prefs.setHighlightWords(TS.model.prefs.highlight_words)
        }
        TS.view.updateTitleWithContext();
        TS.view.rebuildAll();
        TS.view.rebuildTeamList();
        if (a.id != TS.model.previewed_member_id) {
            return
        }
        TS.ui.previewMember(a.id)
    },
    memberChangedDeleted: function(a) {
        TS.view.rebuildImList();
        TS.view.rebuildStarredList();
        TS.view.rebuildTeamList()
    },
    memberChangedProfile: function(a) {
        TS.view.rebuildAll();
        TS.view.rebuildTeamList();
        if (a.id == TS.model.user.id) {
            $("#current_user_avatar .member_image").attr("style", "background-image: url(" + a.profile.image_72 + ")");
            $('a[data-member-id="' + TS.model.user.id + '"] .member_image, a[data-member-id="' + TS.model.user.id + '"].member_image').attr("style", "background-image: url(" + a.profile.image_48 + ")")
        }
        if (a.id != TS.model.previewed_member_id) {
            return
        }
        TS.ui.previewMember(a.id)
    },
    member_account_changed_tim: 0,
    memberAccountTypeChanged: function(a) {
        if (a && a.id == TS.model.user.id) {
            return
        }
        clearTimeout(TS.view.member_account_changed_tim);
        TS.view.member_account_changed_tim = setTimeout(function() {
            TS.view.rebuildTeamList();
            if (a.id != TS.model.previewed_member_id) {
                return
            }
            TS.ui.previewMember(a.id)
        }, 1000)
    },
    memberChangedTZ: function(a) {
        TS.view.rebuildAll();
        TS.view.rebuildTeamList();
        if (a.id != TS.model.previewed_member_id) {
            return
        }
        TS.ui.previewMember(a.id)
    },
    memberStatusChanged: function(b) {
        if (!b) {
            return
        }
        if (b.is_self) {
            $(".user_status_label").text(b.status || "")
        }
        var a = "." + TS.templates.makeMemberStatusDomClass(b.id);
        $(a).html(b.status ? b.status : "-")
    },
    botChanged: function(a) {
        TS.view.rebuildMsgs()
    },
    imUnreadHighlightCountChanged: function(b, c) {
        if (!b) {
            return
        }
        var a = "." + TS.templates.makeUnreadHighlightDomId(b);
        $(a).html(b.unread_highlight_cnt);
        var d = TS.members.getMemberById(b.user);
        TS.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    imMsgNotsent: function(a, b) {
        if (a.id != TS.model.active_im_id) {
            return
        }
        TS.view.showUnSentControlsForMsg(b)
    },
    imUnreadCountChanged: function(c, d) {
        if (!c) {
            return
        }
        var f = TS.members.getMemberById(c.user);
        var b = "." + TS.templates.makeMemberDomId(f);
        var a = "." + TS.templates.makeUnreadHighlightDomId(f);
        if (c.unread_cnt == 0) {
            $(b).removeClass("unread mention");
            $(a).html(c.unread_cnt).addClass("hidden")
        } else {
            if (c.unread_cnt < 10) {
                $(b).addClass("unread mention");
                $(a).html(c.unread_cnt).removeClass("hidden")
            } else {
                $(b).addClass("unread mention");
                $(a).html("9+").removeClass("hidden")
            }
        }
        TS.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    imMarked: function(a) {
        TS.view.rebuildImList();
        TS.view.rebuildStarredList();
        if (a.id != TS.model.active_im_id) {
            return
        }
        TS.view.assignLastReadMsgDiv(a);
        TS.view.reClassUnreads(a.last_read)
    },
    imMessageReceived: function(a, b) {
        if (!a.is_open) {
            TS.view.rebuildImList();
            TS.view.rebuildStarredList()
        }
        if (a.id != TS.model.active_im_id) {
            return
        }
        if (!b) {
            TS.error("no msg?");
            return
        }
        if (a.msgs.length == 1) {
            TS.view.rebuildMsgs()
        } else {
            TS.view.addMsg(b, a.unread_cnt)
        }
    },
    imMessageRemoved: function(a, b) {
        if (a.id != TS.model.active_im_id) {
            return
        }
        if (!b) {
            TS.error("no msg?");
            return
        }
        TS.view.removeMessageDiv(b)
    },
    imMessageChanged: function(a, b) {
        if (a.id != TS.model.active_im_id) {
            return
        }
        setTimeout(function() {
            TS.view.rebuildMsg(b)
        }, 0)
    },
    imHistoryFetched: function(a) {
        if (a.id != TS.model.active_im_id) {
            return
        }
        TS.ui.afterHistoryFetch(a)
    },
    imHistoryBeingFetched: function(a) {
        if (a.id != TS.model.active_im_id) {
            return
        }
        TS.view.updateEndMarker();
        var a = TS.ims.getImById(TS.model.active_im_id);
        if (!a || !a.msgs.length) {
            return
        }
        if (TS.model.socket_connected) {
            var b = TS.utility.msgs.getDisplayedMsgs(a.msgs);
            TS.ui.last_top_msg = b[b.length - 1]
        } else {
            TS.ui.last_top_msg = null
        }
        TS.view.updateEndMarker();
        $("html").unbind("mousemove.monkeyScroll")
    },
    switchedHelper: function() {
        if (TS.model.last_active_cid) {
            TS.utility.msgs.removeAllEphemeralMsgsByType("temp_slash_cmd_feedback", TS.model.last_active_cid)
        }
        TS.view.clearBlueBarTimer();
        TS.view.cacheMsgsHtml();
        TS.view.rebuildAll();
        TS.view.focusMessageInput();
        TS.view.checkIfInputShouldBeDisabledAndPopulate();
        TS.view.showInterstitialAfterChannelOrImShown()
    },
    imSwitched: function() {
        TS.view.switchedHelper();
        TS.ui.hideMemberList();
        TS.view.unAdjustForWelcomeSlideShow();
        TS.view.updateTitleWithContext();
        TS.view.updateTypingText();
        if (navigator.userAgent.match(/chrome/i)) {
            window.setTimeout(TS.view.updateTitleWithContext, 20)
        }
    },
    imOpened: function(a) {
        TS.view.rebuildChannelMembersList();
        TS.view.rebuildImList();
        TS.view.rebuildStarredList()
    },
    imClosed: function(a) {
        TS.view.rebuildChannelMembersList();
        TS.view.rebuildImList();
        TS.view.rebuildStarredList()
    },
    groupArchived: function(a) {
        TS.view.rebuildGroupList();
        TS.view.rebuildStarredList()
    },
    groupUnArchived: function(a) {
        TS.view.rebuildGroupList();
        TS.view.rebuildStarredList();
        if (a.id != TS.model.active_group_id) {
            return
        }
        TS.view.rebuildMsgs()
    },
    groupMsgNotSent: function(a, b) {
        if (a.id != TS.model.active_group_id) {
            return
        }
        TS.view.showUnSentControlsForMsg(b)
    },
    groupTopicChanged: function(c, a, b) {
        if (!c) {
            return
        }
        if (c.id != TS.model.active_group_id) {
            return
        }
        TS.view.displayTitle();
        TS.view.updateEndMarker()
    },
    groupPurposeChanged: function(c, a, b) {
        if (!c) {
            return
        }
        if (c.id != TS.model.active_group_id) {
            return
        }
        TS.view.updateEndMarker()
    },
    groupUnreadCountChanged: function(b, c) {
        if (!b) {
            return
        }
        var a = "." + TS.templates.makeGroupDomId(b);
        if (b.unread_cnt == 0) {
            $(a).removeClass("unread mention")
        } else {
            $(a).addClass("unread");
            if (b.unread_highlight_cnt > 0) {
                $(a).addClass("mention")
            }
        }
        a = "." + TS.templates.makeUnreadJustDomId(b);
        if (b.unread_cnt == 0) {
            $(a).html(b.unread_cnt).addClass("hidden")
        } else {
            if (b.unread_cnt < 10) {
                $(a).html(b.unread_cnt).removeClass("hidden")
            } else {
                $(a).html("9+").removeClass("hidden")
            }
        }
        TS.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    groupUnreadHighlightCountChanged: function(b, c) {
        if (!b) {
            return
        }
        var a = "." + TS.templates.makeUnreadHighlightDomId(b);
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
    groupOrChannelMutingChanged: function(b) {
        var a = "." + TS.templates.makeGroupDomId(b) + ", ." + TS.templates.makeChannelDomId(b);
        if (TS.utility.msgs.isChannelOrGroupMuted(b.id)) {
            $(a).addClass("muted_channel")
        } else {
            $(a).removeClass("muted_channel")
        }
    },
    groupMarked: function(a) {
        if (a.id != TS.model.active_group_id) {
            return
        }
        TS.view.assignLastReadMsgDiv(a);
        TS.view.reClassUnreads(a.last_read)
    },
    groupMessageReceived: function(a, b) {
        if (a.id != TS.model.active_group_id) {
            return
        }
        if (!b) {
            TS.error("no msg?");
            return
        }
        if (a.msgs.length == 1) {
            TS.view.rebuildMsgs()
        } else {
            TS.view.addMsg(b, a.unread_cnt)
        }
    },
    groupMessageRemoved: function(a, b) {
        if (a.id != TS.model.active_group_id) {
            return
        }
        if (!b) {
            TS.error("no msg?");
            return
        }
        TS.view.removeMessageDiv(b)
    },
    groupMessageChanged: function(a, b) {
        if (a.id != TS.model.active_group_id) {
            return
        }
        setTimeout(function() {
            TS.view.rebuildMsg(b)
        }, 0)
    },
    groupHistoryFetched: function(a) {
        if (a.id != TS.model.active_group_id) {
            return
        }
        TS.ui.afterHistoryFetch(a)
    },
    groupHistoryBeingFetched: function(b) {
        if (b.id != TS.model.active_group_id) {
            return
        }
        TS.view.updateEndMarker();
        var b = TS.groups.getGroupById(TS.model.active_group_id);
        if (!b || !b.msgs.length) {
            return
        }
        if (TS.model.socket_connected) {
            if (b.history_changed) {
                TS.ui.last_top_msg = null
            } else {
                var a = TS.utility.msgs.getDisplayedMsgs(b.msgs);
                TS.ui.last_top_msg = a[a.length - 1]
            }
        } else {
            TS.ui.last_top_msg = null
        }
        $("html").unbind("mousemove.monkeyScroll")
    },
    groupSwitched: function() {
        TS.view.switchedHelper();
        if (TS.model.ui_state.member_list_visible) {
            TS.ui.showMemberList()
        }
        TS.view.unAdjustForWelcomeSlideShow();
        TS.view.updateTitleWithContext();
        TS.view.updateTypingText()
    },
    groupRenamed: function() {
        TS.view.rebuildAll()
    },
    groupJoined: function(a) {
        TS.view.rebuildGroupList();
        TS.view.rebuildStarredList()
    },
    groupDeleted: function(a) {
        TS.view.rebuildGroupList();
        TS.view.rebuildStarredList()
    },
    created_group_overlay_tim: 0,
    groupMemberJoined: function(a, b) {
        if (a.id != TS.model.active_group_id) {
            return
        }
        TS.view.rebuildChannelMembersList();
        if (a.needs_created_message) {
            clearTimeout(TS.view.created_group_overlay_tim);
            TS.view.created_group_overlay_tim = setTimeout(function() {
                if (a.id == TS.model.active_group_id) {
                    TS.view.overlay.startWithCreatedGroup(a)
                }
            }, 1000)
        }
    },
    groupLeft: function(a) {
        TS.view.rebuildGroupList();
        TS.view.rebuildStarredList()
    },
    groupMemberLeft: function(b, a) {
        if (b.id != TS.model.active_group_id) {
            return
        }
        TS.view.rebuildChannelMembersList()
    },
    groupOpened: function(a) {
        TS.view.rebuildChannelMembersList();
        TS.view.rebuildGroupList();
        TS.view.rebuildStarredList()
    },
    groupClosed: function(a) {
        TS.view.rebuildChannelMembersList();
        TS.view.rebuildGroupList();
        TS.view.rebuildStarredList()
    },
    channelArchived: function(a) {
        TS.view.rebuildChannelList();
        TS.view.rebuildStarredList();
        TS.view.rebuildChannelMembersList()
    },
    channelUnArchived: function(a) {
        TS.view.rebuildChannelList();
        TS.view.rebuildStarredList();
        if (a.id != TS.model.active_channel_id) {
            return
        }
        TS.view.rebuildChannelMembersList();
        TS.view.rebuildMsgs()
    },
    channelMsgNotsent: function(a, b) {
        if (a.id != TS.model.active_channel_id) {
            return
        }
        TS.view.showUnSentControlsForMsg(b)
    },
    channelTopicChanged: function(c, a, b) {
        if (!c) {
            return
        }
        if (c.id != TS.model.active_channel_id) {
            return
        }
        TS.view.displayTitle();
        TS.view.updateEndMarker()
    },
    channelPurposeChanged: function(c, a, b) {
        if (!c) {
            return
        }
        if (c.id != TS.model.active_channel_id) {
            return
        }
        TS.view.updateEndMarker()
    },
    channelUnreadCountChanged: function(b, c) {
        if (!b) {
            return
        }
        var a = "." + TS.templates.makeChannelDomId(b);
        if (b.unread_cnt == 0) {
            $(a).removeClass("unread mention")
        } else {
            $(a).addClass("unread");
            if (b.unread_highlight_cnt > 0) {
                $(a).addClass("mention")
            }
        }
        a = "." + TS.templates.makeUnreadJustDomId(b);
        if (b.unread_cnt == 0) {
            $(a).html(b.unread_cnt).addClass("hidden")
        } else {
            if (b.unread_cnt < 10) {
                $(a).html(b.unread_cnt).removeClass("hidden")
            } else {
                $(a).html("9+").removeClass("hidden")
            }
        }
        TS.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    channelUnreadHighlightCountChanged: function(b, c) {
        if (!b) {
            return
        }
        var a = "." + TS.templates.makeUnreadHighlightDomId(b);
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
    channelMarked: function(a) {
        if (a.id != TS.model.active_channel_id) {
            return
        }
        TS.view.assignLastReadMsgDiv(a);
        TS.view.reClassUnreads(a.last_read)
    },
    channelMessageReceived: function(a, b) {
        if (a.id != TS.model.active_channel_id) {
            return
        }
        if (!b) {
            TS.error("no msg?");
            return
        }
        if (a.msgs.length == 1) {
            TS.view.rebuildMsgs()
        } else {
            TS.view.addMsg(b, a.unread_cnt)
        }
    },
    channelMessageRemoved: function(a, b) {
        if (a.id != TS.model.active_channel_id) {
            return
        }
        if (!b) {
            TS.error("no msg?");
            return
        }
        TS.view.removeMessageDiv(b)
    },
    removeMsgsAfterTruncation: function(c) {
        var d;
        for (var b = 0; b < c.length; b++) {
            d = c[b];
            TS.view.getDivForMsg(d.ts).remove();
            $("#" + TS.templates.makeDayDividerDomId(d.ts)).remove()
        }
        var a = TS.utility.msgs.getDisplayedMsgs(TS.shared.getActiveModelOb().msgs);
        if (a) {
            TS.view.rebuildMsg(a[a.length - 1])
        }
        TS.view.resizeManually("TS.view.removeMsgsAfterTruncation")
    },
    removeMessageDiv: function(f) {
        var g = TS.view.getDivForMsg(f.ts);
        if (TS.utility.msgs.isTempMsg(f)) {
            g.remove();
            return
        }
        var c = TS.view.last_rendered_msg && TS.view.last_rendered_msg.ts == g.data("ts");
        var b;
        var d = g.nextAll(".message:not(.hidden)").first();
        if (c) {
            b = g.prevAll(".message:not(.hidden)").first();
            $("#" + TS.templates.makeDayDividerDomId(f.ts)).remove()
        }
        var a = function() {
            g.remove();
            if (TS.view.msgs_unread_divider) {
                var j = TS.view.msgs_unread_divider.nextAll(".message:not(.hidden)");
                if (!j.length) {
                    TS.info("calling TS.ui.markMostRecentReadMsg(true) after message removal because there are no displayed messages after the red line now");
                    TS.ui.markMostRecentReadMsg(true)
                }
            }
            if (c && b && b.length) {
                var i = TS.utility.msgs.getMsg(b.data("ts"), TS.shared.getActiveModelOb().msgs);
                if (i) {
                    TS.view.last_rendered_msg = TS.view.last_in_stream_msg = i;
                    TS.info("set a new TS.view.last_rendered_msg && TS.view.last_in_stream_msg because the deleted msg was the last one")
                }
            }
            if (d && d.length) {
                var h = TS.utility.msgs.getMsg(d.data("ts"), TS.shared.getActiveModelOb().msgs);
                if (h) {
                    TS.view.rebuildMsg(h)
                }
            }
            TS.view.resizeManually("TS.view.removeMessageDiv")
        };
        g.find(".timestamp").tooltip("destroy");
        g.addClass("delete_mode").slideUp(200, a)
    },
    channelMessageChanged: function(a, b) {
        if (a.id != TS.model.active_channel_id) {
            return
        }
        setTimeout(function() {
            TS.view.rebuildMsg(b)
        }, 0)
    },
    channelHistoryFetched: function(a) {
        if (a.id != TS.model.active_channel_id) {
            return
        }
        TS.ui.afterHistoryFetch(a)
    },
    channelHistoryBeingFetched: function(b) {
        if (b.id != TS.model.active_channel_id) {
            return
        }
        TS.view.updateEndMarker();
        var b = TS.channels.getChannelById(TS.model.active_channel_id);
        if (!b || !b.msgs.length) {
            return
        }
        if (TS.model.socket_connected) {
            if (b.history_changed) {
                TS.ui.last_top_msg = null
            } else {
                var a = TS.utility.msgs.getDisplayedMsgs(b.msgs);
                TS.ui.last_top_msg = a[a.length - 1]
            }
        } else {
            TS.ui.last_top_msg = null
        }
        $("html").unbind("mousemove.monkeyScroll")
    },
    updateTitleWithContext: function() {
        var c, a, b, f, d;
        a = TS.shared.getActiveModelOb();
        if (!a) {
            return
        }
        b = a.name || "";
        if (!b) {
            return
        }
        context_separator = " | ";
        d = document.title;
        f = d.indexOf(context_separator);
        if (f !== -1) {
            d = b + context_separator + d.substr(f + context_separator.length)
        } else {
            d = b + context_separator + d
        }
        document.title = d
    },
    slow_switch_threshold: 5000,
    slow_switch_caught: null,
    start_time: new Date(),
    checkIfInputShouldBeDisabledAndPopulate: function() {
        if (TS.shared.getActiveModelOb() && TS.shared.getActiveModelOb().is_general && !TS.members.canUserPostInGeneral()) {
            TS.view.input_el.val("").trigger("autosize").trigger("autosize-resize");
            TS.view.input_el.attr("disabled", true);
            $("#footer").addClass("disabled");
            $("#message-input-message span").html("Your team owners have limited who can post to #<b>" + TS.channels.getGeneralChannel().name + "</b>")
        } else {
            TS.view.input_el.attr("disabled", false);
            $("#footer").removeClass("disabled");
            TS.ui.populateChatInputWithLast()
        }
    },
    channelSwitched: function() {
        var c = new Date();
        TS.view.switchedHelper();
        if (TS.model.ui_state.member_list_visible) {
            TS.ui.showMemberList()
        }
        if (TS.model.prefs.seen_welcome_2) {
            TS.view.unAdjustForWelcomeSlideShow()
        } else {
            if (TS.shared.getActiveModelOb().id == TS.model.welcome_model_ob.id) {
                TS.view.adjustForWelcomeSlideShow()
            } else {
                TS.view.unAdjustForWelcomeSlideShow()
            }
        }
        TS.view.updateTitleWithContext();
        TS.view.updateTypingText();
        var a = new Date();
        var b = (a - c);
        if (!TS.view.slow_switch_caught && b > TS.view.slow_switch_threshold) {
            TS.logError({
                message: "TS.view.channelSwitched > " + TS.view.slow_switch_threshold + " ms"
            }, " took " + b + " ms. App open for " + ((a - TS.view.start_time) / 1000 / 60).toFixed(2) + " min. localStorage = " + (TS.model && TS.model.prefs && TS.model.prefs.ls_disabled ? 0 : 1));
            TS.view.slow_switch_caught = true
        }
    },
    channelRenamed: function() {
        TS.view.rebuildAll();
        TS.view.updateTitleWithContext()
    },
    channelJoined: function(a) {
        TS.view.rebuildChannelList();
        TS.view.rebuildStarredList()
    },
    channelCreated: function(a) {
        TS.view.rebuildChannelList();
        TS.view.rebuildStarredList()
    },
    channelDeleted: function(a) {
        TS.view.rebuildChannelList();
        TS.view.rebuildStarredList()
    },
    channelMemberJoined: function(a, b) {
        if (a.id != TS.model.active_channel_id) {
            return
        }
        TS.view.rebuildChannelMembersList();
        if (a.needs_created_message) {
            TS.view.overlay.startWithCreatedChannel(a)
        }
    },
    channelLeft: function(a) {
        TS.view.rebuildChannelList();
        TS.view.rebuildStarredList()
    },
    channelMemberLeft: function(b, a) {
        if (b.id != TS.model.active_channel_id) {
            return
        }
        TS.view.rebuildChannelMembersList()
    },
    assignLastReadMsgDiv: function(a) {
        if (!a) {
            return
        }
        if (!a.msgs.length) {
            return
        }
        var c = TS.utility.msgs.getMsg(a.last_read, a.msgs);
        if (c && !c.no_display) {
            TS.view.last_read_msg_div = TS.view.getDivForMsg(a.last_read);
            return
        }
        var b = TS.utility.msgs.getOldestValidTs(a.msgs);
        if (a.last_read > b) {
            var c = TS.utility.msgs.getDisplayedMsgBeforeTS(a.last_read, a.msgs);
            if (c) {
                TS.info(c.ts + " from TS.utility.msgs.getDisplayedMsgBeforeTS(" + a.last_read + ") " + c.ts + " < " + a.last_read + " = " + (c.ts < a.last_read));
                TS.view.last_read_msg_div = TS.view.getDivForMsg(c.ts)
            } else {
                TS.view.last_read_msg_div = null;
                TS.error("WTF nulling out TS.view.last_read_msg_div because we could not find a message to use #1")
            }
        } else {
            TS.view.last_read_msg_div = null
        }
    },
    showUnSentControlsForMsg: function(a) {
        setTimeout(function() {
            TS.model.display_unsent_msgs[a.ts] = true;
            TS.view.rebuildMsg(a)
        }, 5000)
    },
    scroll_down_when_msg_from_user_is_added: false,
    addMsg: function(h, c) {
        var a = false;
        var b = TS.shared.getActiveModelOb();
        if (h.user == TS.model.user.id && TS.view.scroll_down_when_msg_from_user_is_added) {
            TS.view.scroll_down_when_msg_from_user_is_added = false;
            a = true
        } else {
            if (TS.ui.areMsgsScrolledToBottom()) {
                a = true
            }
        }
        var f = TS.view.last_rendered_msg;
        var d = TS.templates.builders.buildMsgHTML({
            msg: h,
            model_ob: b,
            prev_msg: f,
            container_id: "msgs_div",
            enable_slack_action_links: true
        });
        TS.view.msgs_div.append(d);
        var i = TS.view.getDivForMsg(h.ts);
        i.find(".timestamp").tooltip({
            delay: {
                show: 450,
                hide: 150
            },
            container: "body"
        });
        TS.view.makeSureAllLinksHaveTargets(i);
        if (!h.rsp_id) {
            TS.view.last_in_stream_msg = h;
            if (!h.no_display) {
                TS.view.last_rendered_msg = h
            }
        }
        TS.view.assignLastReadMsgDiv(b);
        TS.view.padOutMsgsScroller();
        if (a) {
            TS.ui.instaScrollMsgsToBottom(false)
        }
        var g = TS.ui.isUserAttentionOnChat() && (c < 2);
        if (h.user == TS.model.user.id || g) {
            TS.ui.checkUnreads()
        } else {
            TS.ui.checkInlineImgs("main")
        }
        TS.view.insertUnreadDivider();
        if ($("#msgs_scroller_div").data("monkeyScroll")) {
            $("#msgs_scroller_div").data("monkeyScroll").updateFunc()
        }
    },
    rebuildAll: function() {
        TS.view.rebuildChannelList();
        TS.view.rebuildChannelMembersList();
        TS.view.rebuildMsgs();
        TS.view.rebuildImList();
        TS.view.rebuildGroupList();
        TS.view.rebuildStarredList();
        TS.view.displayTitle();
        TS.view.makeSureActiveChannelIsInView()
    },
    makeSureActiveChannelIsInView: function() {
        var a = $("#starred-list").find("li.active");
        if (!a.length) {
            a = $("#channel-list").find("li.active")
        }
        if (!a.length) {
            a = $("#im-list").find("li.active")
        }
        if (!a.length) {
            a = $("#group-list").find("li.active")
        }
        a.scrollintoview({
            offset: "top",
            px_offset: 50
        })
    },
    reClassUnreads: function(b) {
        var a = TS.ui.areMsgsScrolledToBottom();
        TS.view.msgs_div.children("div.message").each(function(c) {
            var d = $(this).data("ts");
            if (d > b) {
                $(this).addClass("unread")
            } else {
                $(this).removeClass("unread")
            }
        });
        if (TS.shared.getActiveModelOb().unread_cnt) {
            TS.view.insertUnreadDivider()
        } else {} if (a) {
            TS.ui.instaScrollMsgsToBottom(false)
        }
    },
    rebuildMsg: function(g) {
        if (!g) {
            return
        }
        var f = !g.subtype || g.is_ephemeral;
        var a = TS.shared.getActiveModelOb();
        var c = TS.ui.areMsgsScrolledToBottom();
        var d = TS.utility.msgs.getPrevDisplayedMsg(g.ts, a.msgs);
        var b = TS.templates.builders.buildMsgHTML({
            msg: g,
            model_ob: a,
            prev_msg: d,
            container_id: "msgs_div",
            enable_slack_action_links: true
        });
        TS.view.getDivForMsg(g.ts).replaceWith(b);
        var h = TS.view.getDivForMsg(g.ts);
        if (f) {
            h.addClass("edit_mode")
        }
        TS.view.makeSureAllLinksHaveTargets(h);
        if (c) {
            TS.ui.instaScrollMsgsToBottom(true)
        }
        TS.ui.checkInlineImgs("main");
        h.find(".edited").tooltip({
            container: "body"
        });
        h.find(".timestamp").tooltip({
            delay: {
                show: 450,
                hide: 150
            },
            container: "body"
        });
        if (f) {
            setTimeout(function() {
                h.removeClass("edit_mode")
            }, 500)
        }
    },
    showInterstitialAfterChannelOrImShown: function() {
        var b = TS.channels.getChannelById(TS.model.active_channel_id);
        var c = TS.groups.getGroupById(TS.model.active_group_id);
        var a = TS.ims.getImById(TS.model.active_im_id);
        var d = false;
        if (b && b.needs_created_message) {
            if (TS.model.prefs.no_created_overlays) {
                b.needs_created_message = false
            } else {
                d = true;
                TS.view.overlay.startWithCreatedChannel(b)
            }
        } else {
            if (b && b.needs_invited_message) {
                if (TS.model.prefs.no_joined_overlays) {
                    b.needs_invited_message = false
                } else {
                    d = true;
                    TS.view.overlay.startWithInvitedChannel(b)
                }
            } else {
                if (b && b.needs_joined_message) {
                    if (TS.model.prefs.no_joined_overlays) {
                        b.needs_joined_message = false
                    } else {
                        d = true;
                        TS.view.overlay.startWithJoinedChannel(b)
                    }
                } else {
                    if (c && c.needs_invited_message) {
                        if (TS.model.prefs.no_joined_overlays) {
                            c.needs_invited_message = false
                        } else {
                            d = true;
                            TS.view.overlay.startWithInvitedGroup(c)
                        }
                    } else {
                        if (c && c.needs_created_message) {
                            if (TS.model.prefs.no_created_overlays) {
                                c.needs_created_message = false
                            } else {
                                d = true;
                                TS.view.overlay.startWithCreatedGroup(c)
                            }
                        }
                    }
                }
            }
        } if (!d) {
            TS.view.overlay.start();
            TS.view.overlay.cancel()
        }
    },
    memberStarsFetched: function(a) {
        if (!a || !a.is_self) {
            return
        }
        TS.view.rebuildStars()
    },
    rebuildStars: function() {
        var b = TS.model.user;
        if (TS.view.member_stars_list_lazyload && TS.view.member_stars_list_lazyload.detachEvents) {
            TS.view.member_stars_list_lazyload.detachEvents();
            TS.view.member_stars_list_lazyload = null
        }
        if (b.stars && b.stars.length) {
            $("#member_stars_list").find(".timestamp").tooltip("destroy");
            var a = "";
            $.each(b.stars, function(c, d) {
                a += TS.templates.builders.buildStarredItemHTML(d)
            });
            $("#member_stars_list").html(a);
            TS.view.member_stars_list_lazyload = $("#member_stars_list").find("img.lazy").lazyload({
                container: $("#stars_scroller")
            });
            TS.view.makeSureAllLinksHaveTargets($("#member_stars_list"));
            $("#member_stars_explanation").addClass("hidden");
            $("#member_stars_list").find(".timestamp").tooltip({
                delay: {
                    show: 450,
                    hide: 150
                },
                container: "body"
            })
        } else {
            $("#member_stars_list").html("");
            $("#member_stars_explanation").removeClass("hidden")
        }
        TS.view.resize()
    },
    mentionChanged: function(a) {
        TS.warn("mentionChanged:" + a.message.ts);
        var c = $("#member_mentions").find("#" + TS.templates.makeMsgDomId(a.message.ts));
        if (!c.length) {
            return TS.view.rebuildMentions()
        }
        var b = TS.templates.builders.buildMentionHTML(a, null, true);
        if (!b) {
            return TS.view.rebuildMentions()
        }
        c.replaceWith(b)
    },
    mentionRemoved: function(b) {
        TS.warn("mentionRemoved:" + b);
        var c = $("#member_mentions").find("#" + TS.templates.makeMsgDomId(b));
        if (!c.length) {
            return
        }
        var a = function() {
            TS.view.rebuildMentions()
        };
        c.addClass("delete_mode").slideUp(200, a)
    },
    mentionsFetched: function() {
        TS.view.rebuildMentions(true)
    },
    rebuildMentions: function(a) {
        var f = TS.model.user;
        var c = $("#member_mentions_more_btn");
        if (c.data("ladda") == undefined) {
            c.data("ladda", Ladda.create(document.querySelector("#member_mentions_more_btn")));
            c.bind("click.fetchMoreMentions", function(g) {
                TS.mentions.fetchMoreMentions();
                $(this).data("ladda").start()
            })
        } else {
            if (a) {
                c.data("ladda").stop()
            }
        } if (f.mentions && f.mentions.length) {
            var b = "";
            var d = null;
            $("#member_mentions").find(".timestamp").tooltip("destroy");
            $.each(f.mentions, function(j, g) {
                var k = TS.templates.builders.buildMentionHTML(g, d);
                if (!k) {
                    return
                }
                b += k;
                d = g
            });
            $("#member_mentions").html(b);
            TS.view.makeSureAllLinksHaveTargets($("#member_mentions"));
            $("#member_mentions_explanation").addClass("hidden");
            if (TS.mentions.has_more) {
                $("#member_mentions_more").css("visibility", "visible")
            } else {
                $("#member_mentions_more").css("visibility", "hidden")
            }
            $("#member_mentions").find(".timestamp").tooltip({
                delay: {
                    show: 450,
                    hide: 150
                },
                container: "body"
            })
        } else {
            $("#member_mentions").html("");
            $("#member_mentions_explanation").removeClass("hidden");
            $("#member_mentions_more").css("visibility", "hidden")
        }
        TS.view.resize()
    },
    displayTitle: function() {
        var c = "";
        var f = $("#active_channel_name");
        f.tooltip("disable").tooltip("destroy");
        if (TS.model.active_im_id) {
            var b = TS.ims.getImById(TS.model.active_im_id);
            var g = TS.members.getMemberById(b.user);
            if (b) {
                c = TS.templates.builders.buildStar("im", b) + '<span class="name"><span class="prefix">@</span>' + b.name + TS.templates.makeMemberPresenceIcon(g) + "</span>"
            }
        } else {
            if (TS.model.active_channel_id || TS.model.active_group_id) {
                var a = TS.shared.getActiveModelOb();
                if (a) {
                    if (TS.model.active_channel_id) {
                        c = TS.templates.builders.buildStar("channel", a) + '<span class="name"><span class="prefix">#</span>' + a.name + "</span><i id='channel_actions' class='fa fa-chevron-down'></i>"
                    } else {
                        c = TS.templates.builders.buildStar("group", a) + '<span class="name"><span class="prefix">' + TS.model.group_prefix + "</span>" + a.name + "</span><i id='group_actions' class='fa fa-chevron-down'></i>"
                    } if (a.topic && a.topic.value) {
                        c += '<span class="topic">' + TS.utility.formatTopicOrPurpose(a.topic.value) + "</span>"
                    }
                }
            }
        }
        f.html(c);
        if (a && a.topic && a.topic.value && a.topic.value.length > 50) {
            f.attr("title", TS.utility.emojiReplace(TS.utility.linkify(a.topic.value, TS.templates.builders.newWindowName(), true)));
            f.tooltip({
                placement: "bottom",
                html: true,
                delay: {
                    show: 1000,
                    hide: 3000
                },
                container: "body"
            });
            var d = f.find(".topic");
            f.hover(function() {
                setTimeout(function() {
                    var h = $(".tooltip").outerWidth();
                    var i = parseInt(d.position().left) + (d.outerWidth() / 2) - (h / 2);
                    var j = f.position().left + f.outerWidth();
                    if (i > j) {
                        i = j - (h / 2)
                    }
                    $(".tooltip").css({
                        top: parseInt($(".tooltip").css("top")) - 15 + "px",
                        left: i + "px"
                    })
                }, 1000)
            }, function() {})
        }
        TS.view.makeSureAllLinksHaveTargets(f);
        if (TS.model.active_channel_id) {
            $("#active_channel_name .name, #channel_actions").bind("click.channel_actions", function(h) {
                if (TS.tips.maybeDoThrobberProxyClick("channel_menu_tip_card_throbber", h)) {
                    return false
                }
                TS.menu.startWithChannel(h, a.id)
            });
            $("#active_channel_name .star_channel").bind("click", function(h) {
                TS.stars.checkForStarClick(h)
            })
        } else {
            if (TS.model.active_group_id) {
                $("#active_channel_name .name, #group_actions").bind("click.channel_actions", function(h) {
                    TS.menu.startWithGroup(h, a.id)
                });
                $("#active_channel_name .star_group").bind("click", function(h) {
                    TS.stars.checkForStarClick(h)
                })
            } else {
                if (TS.model.active_im_id) {
                    $("#active_channel_name .name, #channel_actions").bind("click.channel_actions", function(h) {
                        if (b) {
                            TS.menu.startWithMember(h, b.user, false, false, true)
                        }
                    });
                    $("#active_channel_name .star_im").bind("click", function(h) {
                        TS.stars.checkForStarClick(h)
                    })
                }
            }
        }
    },
    setPresenceClasses: function() {
        $("#col_channels").addClass("show_presence");
        $("#col_members").addClass("show_presence");
        return;
        if (TS.model.prefs.show_member_presence) {
            $("#col_channels").addClass("show_presence");
            $("#col_members").addClass("show_presence")
        } else {
            $("#col_channels").removeClass("show_presence");
            $("#col_members").removeClass("show_presence")
        }
    },
    loggedIn: function() {
        TS.ui.prefCollapsibleChanged();
        TS.templates.makeSidebarBehaviorRule();
        TS.newxp.initSlideShow();
        TS.view.setPresenceClasses();
        TS.setThemeClasses(true);
        TS.view.rebuildAll();
        TS.view.focusMessageInput();
        if (TS.model.active_im_id) {
            TS.ui.hideMemberList()
        } else {
            if (TS.model.ui_state.member_list_visible) {
                TS.ui.showMemberList()
            }
        }
        TS.files.fetchTeamFiles();
        TS.files.fetchMemberFiles(TS.model.user.id);
        TS.view.buildTeamList();
        TS.ui.populateChatInputWithLast();
        TS.ui.rebuildMemberListToggle();
        TS.view.updateUserPresence();
        TS.view.showProperTeamPaneFiller();
        $("#channels_scroller").css("visibility", "visible");
        TS.view.showInterstitialAfterChannelOrImShown();
        TS.view.toggleSpellcheck();
        if ((TS.model.team.prefs.display_real_names && TS.model.prefs.display_real_names_override != -1) || TS.model.prefs.display_real_names_override == 1) {
            $("#col_channels").addClass("real_names")
        } else {
            $("#col_channels").removeClass("real_names")
        } if (!TS.model.is_iOS) {
            if (TS.ui.growls.no_notifications && readCookie("no_growl_prompt") != "1") {
                $("#growl_prompt_div").removeClass("hidden");
                $("#growl_prompt_a").bind("click", function() {
                    TS.view.overlay.startWithGrowlPromptDisplay()
                })
            } else {
                if (TS.ui.growls.shouldShowPermissionButton() && TS.ui.growls.getPermissionLevel() != "denied" && readCookie("no_growl_prompt") != "1") {
                    $("#growl_prompt_div").removeClass("hidden");
                    $("#growl_prompt_a").bind("click", function() {
                        TS.view.overlay.startWithGrowlPromptDisplay()
                    })
                }
            }
        }
        $("body").addClass("no_attachment_max_width");
        if (TS.model.is_FF) {
            TS.view.msgs_scroller_div.removeAttr("tabindex")
        }
        if (TS.model.team.domain == "tinyspeck") {}
    },
    showProperTeamPaneFiller: function() {
        var d = TS.members.getActiveMembersWithSelfAndSlackbot().length;
        var b = 4;
        if (TS.model.user.is_admin) {
            $("#team_block").removeClass("hidden");
            if (d > b) {
                $("#team_block_admin_invite_few").addClass("hidden");
                $("#team_block_admin_invite_many").removeClass("hidden")
            } else {
                $("#team_block_admin_invite_few").removeClass("hidden");
                $("#team_block_admin_invite_many").addClass("hidden")
            }
        }
        if (d > b) {
            $("#team_block_description").addClass("hidden")
        } else {
            $("#team_block").removeClass("hidden");
            $("#team_block_description").removeClass("hidden")
        } if (TS.model.team.email_domain) {
            var a = TS.model.team.email_domain.split(",");
            if (a.length == 1) {
                $("#team_block_email_domains").html("<b>@" + TS.utility.htmlEntities(TS.model.team.email_domain) + "</b>")
            } else {
                var f = TS.utility.htmlEntities(a.pop());
                var c = a.join("</b>, <b>@") + "</b> or <b>@" + TS.utility.htmlEntities(f) + "</b>";
                $("#team_block_email_domains").html("<b>@" + c)
            }
            $("#team_block").removeClass("hidden");
            $("#team_block_email_on").removeClass("hidden");
            $("#team_block_admin_email_off").addClass("hidden")
        } else {
            $("#team_block_email_on").addClass("hidden");
            if (TS.model.user.is_owner) {
                $("#team_block").removeClass("hidden");
                $("#team_block_admin_email_off").removeClass("hidden")
            }
        } if (!TS.model.user.profile || !TS.model.user.profile.phone || !TS.model.user.profile.real_name) {
            $("#team_block").removeClass("hidden");
            $("#team_block_fill_prompt").removeClass("hidden")
        } else {
            $("#team_block_fill_prompt").addClass("hidden")
        }
    },
    ever_connected: false,
    socketConnected: function() {
        if (TS.view.ever_connected) {
            TS.utility.msgs.removeAllEphemeralMsgsByType("disconnected_feedback");
            TS.view.rebuildChannelList();
            TS.view.rebuildChannelMembersList();
            TS.view.rebuildImList();
            TS.view.rebuildGroupList();
            TS.view.rebuildStarredList();
            TS.view.displayTitle();
            TS.ui.rebuildMemberListToggle();
            TS.mentions.maybeUpdateMentions()
        } else {
            TS.logLoad("TS.view.socketConnected first time")
        }
        TS.view.ever_connected = true;
        TS.view.input_el.removeClass("offline");
        $("#connection_div").html("").addClass("hidden");
        TS.view.changeConnectionStatus("online");
        TS.view.updateUserPresence();
        TS.view.toggleSpellcheck();
        TS.view.checkIfInputShouldBeDisabledAndPopulate()
    },
    socketReconnecting: function(b) {
        if (TS.model.window_unloading) {
            $("#connection_div").html("").addClass("hidden")
        } else {
            var a = "reconnecting";
            if (b) {
                a += " in " + b + " second" + (b == 1 ? "" : "s...");
                if (b > 2) {
                    a += ' <a onclick="TS.socket.manualReconnectNow()">retry now</a>'
                }
            } else {
                a += "..."
            }
            $("#connection_div").html(a).removeClass("hidden")
        }
    },
    ponged: function() {
        var a = $("#connection_icon");
        if (a.css("opacity") == 1) {
            a.css("opacity", 0.98)
        } else {
            a.css("opacity", 1)
        }
    },
    socketDisconnected: function() {
        TS.view.changeConnectionStatus("offline");
        if (TS.model.asleep) {
            $("#connection_status").html("asleep")
        }
        TS.view.input_el.addClass("offline")
    },
    socketTroubled: function() {
        TS.view.changeConnectionStatus("trouble");
        $("#connection_status").html("connecting...");
        TS.view.input_el.addClass("offline")
    },
    current_connection_status: null,
    current_unread_status: null,
    changeConnectionStatus: function(a) {
        TS.view.current_connection_status = a;
        TS.view.maybeChangeFavIco();
        TS.view.maybeChangeConnectionDisplay()
    },
    changeUnreadStatus: function(a) {
        TS.view.current_unread_status = a;
        TS.view.maybeChangeFavIco();
        TS.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    maybeChangeFavIco: function() {
        var d = TS.view.current_connection_status;
        var f = TS.view.current_unread_status;
        var c;
        if (d == "online") {
            c = "app_icon_32px_green"
        } else {
            if (d == "trouble") {
                c = "app_icon_32px_yellow"
            } else {
                c = "app_icon_32px_red"
            }
        } if (f == "unreads") {
            c += "_unreads"
        } else {
            if (f == "mentions") {
                c += "_mentions"
            }
        }
        var a = TS.ui.data_urls[c];
        var b = $("#favicon");
        if (b.attr("href") != a) {
            b.replaceWith('<link id="favicon" rel="shortcut icon" href="' + a + '" sizes="16x16 32x32 48x48" type="image/png" />')
        }
    },
    maybeChangeConnectionDisplay: function() {
        var a;
        var c = $("#connection_icon");
        var b = $("#connection_status");
        if (TS.view.current_connection_status == "online") {
            if (TS.model.user.presence == "away") {
                a = TS.ui.data_urls.connection_icon_online_away;
                b.text("away")
            } else {
                a = TS.ui.data_urls.connection_icon_online;
                b.text("online")
            }
        } else {
            if (TS.view.current_connection_status == "trouble") {
                a = TS.ui.data_urls.connection_icon_trouble;
                b.text("connecting...")
            } else {
                a = TS.ui.data_urls.connection_icon_offline;
                b.text("offline")
            }
        } if (c.attr("src") != a) {
            c.attr("src", a).removeClass("hidden")
        }
    },
    windowUnloaded: function() {
        if (!TS.model.mac_ssb_version || TS.model.mac_ssb_version >= 0.32) {
            $("BODY").addClass("loading");
            $("#connection_div").html("").addClass("hidden")
        }
    },
    rebuildStarredList: function() {
        var j = TS.channels.getChannelsForUser();
        var d = TS.model.groups;
        var p = TS.model.ims;
        var b = [];
        var g;
        var k;
        var o;
        var n;
        var f;
        for (var g = 0; g < j.length; g++) {
            k = j[g];
            if (!k.is_starred) {
                continue
            }
            if (k.is_member || k.was_archived_this_session) {
                b.push(k)
            }
        }
        for (var g = 0; g < d.length; g++) {
            o = d[g];
            if (!o.is_starred) {
                continue
            }
            if (!o.is_open && !o.unread_cnt) {
                continue
            }
            if (o.is_archived && !o.was_archived_this_session) {
                continue
            }
            b.push(o)
        }
        for (var g = 0; g < p.length; g++) {
            n = p[g];
            if (!n.is_starred) {
                continue
            }
            f = TS.members.getMemberById(n.user);
            if (f.deleted) {
                continue
            }
            if (f.is_self) {
                continue
            }
            if (!n.is_open && !n.unread_cnt) {
                continue
            }
            b.push(n)
        }
        if (!b.length) {
            $(".starred_section").addClass("hidden");
            return
        }
        b.sort(function a(i, c) {
            var q = (i.is_im) ? TS.ims.getDisplayNameOfUserForImLowerCase(i) : i._name_lc;
            var r = (c.is_im) ? TS.ims.getDisplayNameOfUserForImLowerCase(c) : c._name_lc;
            if (i.is_channel) {
                q = "A" + q
            } else {
                if (i.is_im) {
                    q = "B" + q
                } else {
                    q = "C" + q
                }
            } if (c.is_channel) {
                r = "A" + r
            } else {
                if (c.is_im) {
                    r = "B" + r
                } else {
                    r = "C" + r
                }
            } if (q < r) {
                return -1
            }
            if (q > r) {
                return 1
            }
            return 0
        });
        $(".starred_section").removeClass("hidden");
        $("#starred-list").text(b.length);
        var h = "";
        var l;
        for (var g = 0; g < b.length; g++) {
            l = b[g];
            if (l.is_channel) {
                h += TS.templates.channel(l)
            } else {
                if (l.is_group) {
                    h += TS.templates.group({
                        group: l,
                        show_symbol: true
                    })
                } else {
                    var m = {
                        member: TS.members.getMemberById(l.user),
                        im: l,
                        color_names: false,
                        show_close_link: true || !l.is_slackbot_im
                    };
                    h += TS.templates.member(m)
                }
            }
        }
        $("#starred-list").html(h);
        if (TS.ui.collapsible) {
            $("#starred-list-collapsed").html(h)
        }
        TS.ui.updateClosestMonkeyScroller($("#starred-list"))
    },
    dupe_starred: false,
    rebuildChannelList: function() {
        var b = TS.channels.getChannelsForUser();
        var f;
        var a = 0;
        var h = [];
        b.sort(function g(j, i) {
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
        for (var d = 0; d < b.length; d++) {
            f = b[d];
            if (!f.is_member && !f.is_archived) {
                a++
            }
            if (f.is_starred && !TS.view.dupe_starred) {
                continue
            }
            if (f.is_member || f.was_archived_this_session) {
                h.push(f)
            }
        }
        if (TS.model.user.is_restricted && !h.length) {
            $("#channels").addClass("hidden");
            return
        }
        $("#channels").removeClass("hidden");
        if (!TS.model.user.is_restricted) {
            $("#channels_header").unbind("click.open_dialog_or_menu").bind("click.open_dialog_or_menu", function(i) {
                if (TS.tips.maybeDoThrobberProxyClick("channels_tip_card_throbber", i)) {
                    return false
                }
                TS.ui.list_browser_dialog.start("channels")
            })
        }
        var c = TS.templates.channel_list({
            channels: h,
            non_member_cnt: a,
            user: TS.model.user
        });
        $("#channel-list").html(c);
        if (TS.ui.collapsible) {
            $("#channel-list-collapsed").html(c)
        }
        TS.ui.updateClosestMonkeyScroller($("#channel-list"));
        $("#col_channels_collapse_view").html($("#col_channels_collapse_view").html());
        TS.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    rebuildGroupList: function() {
        var f = "";
        var d = TS.model.groups;
        var k;
        if (!TS.members.canUserCreateGroups() && !TS.groups.getUnarchivedGroups().length) {
            $("#groups").addClass("hidden");
            return
        }
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
            if (m.is_starred && !TS.view.dupe_starred) {
                return
            }
            f += TS.templates.group({
                group: m
            })
        });
        $("#group-list").html(f);
        if (TS.ui.collapsible) {
            $("#group-list-collapsed").html(f)
        }
        TS.ui.updateClosestMonkeyScroller($("#group-list"));
        var i = TS.groups.getUnarchivedClosedGroups().length;
        var j = function(c) {
            TS.menu.startWithGroups(c)
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
                if (TS.members.canUserCreateGroups()) {
                    $("#group_list_more").text("New private group...");
                    b = function(c) {
                        TS.ui.group_create_dialog.start()
                    }
                } else {
                    $("#group_list_more").text("")
                }
            }
        }
        $("#groups_header").unbind("click.open_dialog_or_menu").bind("click.open_dialog_or_menu", j);
        $("#group_list_more").unbind("click.open_dialog_or_menu").bind("click.open_dialog_or_menu", b);
        TS.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    rebuildChannelMembersList: function() {
        var d = TS.channels.getChannelById(TS.model.active_channel_id);
        if (!d) {
            d = TS.groups.getGroupById(TS.model.active_group_id)
        }
        if (d) {
            TS.ui.rebuildMemberListToggle();
            var a = [];
            var g;
            for (var c = 0; c < d.members.length; c++) {
                g = TS.members.getMemberById(d.members[c]);
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
                var j = TS.members.getMemberDisplayNameLowerCase(i);
                var k = TS.members.getMemberDisplayNameLowerCase(h);
                if (j < k) {
                    return -1
                }
                if (j > k) {
                    return 1
                }
                return 0
            });
            var b = TS.templates.channel_members_list({
                channel: d,
                members: a,
                current_user_id: TS.model.user.id,
                color_names: TS.model.prefs.color_names_in_list
            });
            $("#members_scroller").html(b);
            TS.ui.updateClosestMonkeyScroller($("#members_scroller"));
            if (d.id != TS.view.last_member_list_channel_or_group_id) {
                $("#members_scroller").scrollTop(0)
            }
            TS.view.last_member_list_channel_or_group_id = d.id
        }
    },
    buildMemberPresenceStatusHTML: function(b) {
        var a = "";
        a += '<span class="' + TS.templates.makeMemberStatusDomClass(b.id) + '">';
        if (b.status) {
            a += ' - "' + b.status + '"'
        }
        a += "</span>";
        return a
    },
    rebuildImList: function() {
        var g = "";
        var b = TS.model.ims;
        var d = TS.members.getMembersForUser();
        var a;
        var f = true;
        d.sort(function h(k, c) {
            if (k.is_slackbot) {
                return -1
            }
            if (c.is_slackbot) {
                return 1
            }
            var l = TS.members.getMemberDisplayNameLowerCase(k);
            var m = TS.members.getMemberDisplayNameLowerCase(c);
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
            a = TS.ims.getImByMemberId(l.id);
            if (!a || (!a.is_open && !a.unread_cnt)) {
                i++;
                return
            }
            j++;
            if (a.is_starred && !TS.view.dupe_starred) {
                return
            }
            var k = {
                member: l,
                im: a,
                color_names: false,
                show_close_link: true || !a.is_slackbot_im
            };
            g += TS.templates.member(k)
        });
        $("#im-list").html(g);
        if (TS.ui.collapsible) {
            $("#im-list-collapsed").html(g)
        }
        TS.ui.updateClosestMonkeyScroller($("#im-list"));
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
            if (!TS.model.socket_connected && !TS.model.change_channels_when_offline) {
                TS.ui.playSound("beep");
                return
            }
            TS.menu.startWithMembers(c)
        });
        $("#direct_messages_header").unbind("click.open_dialog").bind("click.open_dialog", function(c) {
            if (!TS.model.socket_connected && !TS.model.change_channels_when_offline) {
                TS.ui.playSound("beep");
                return
            }
            TS.menu.startWithMembers(c)
        });
        TS.ui.checkUnseenChannelsImsGroupsWithUnreads()
    },
    rebuildTeamList: function() {
        if (TS.view.members_list_lazyload && TS.view.members_list_lazyload.detachEvents) {
            TS.view.members_list_lazyload.detachEvents()
        }
        var a, c, f, g, d, b;
        a = "team_list_members";
        c = "team_list_members_wrapper";
        f = "team_list_scroller";
        g = $("#" + a);
        g.unbind("click.view", TS.view.onMemberListClick);
        b = $("#" + c);
        g.remove();
        b.html('<div id="' + a + '">' + TS.templates.builders.buildTeamListHTML(TS.members.getMembersForUser()) + "</div>");
        g = $("#" + a);
        g.bind("click.view", TS.view.onMemberListClick);
        d = g.find("a.lazy");
        TS.view.members_list_lazyload = d.lazyload({
            container: $("#" + f)
        });
        TS.view.startLocalTimeRefreshInterval();
        TS.ui.updateClosestMonkeyScroller(g);
        TS.view.makeSureAllLinksHaveTargets(g);
        d = null;
        g = null
    },
    updateTimezoneLabelsThrottled: function() {
        var j, g, f, h, i, b, a, d, c;
        c = -28000;
        g = new Date();
        f = g.getTime();
        b = $(".timezone_label");
        a = [];
        b.each(function(k, l) {
            l = $(l);
            h = TS.members.getMemberById(l.data("member-id"));
            if (!h) {
                a.push("");
                return
            }
            if (typeof h.tz_offset != "undefined") {
                d = h.tz_offset
            } else {
                d = c
            }
            j = (TS.model.user.tz_offset - d) / 60 / 60;
            i = f - (j * 60 * 60 * 1000);
            a.push(TS.utility.date.toTime(i / 1000, true));
            h = null;
            l = null
        });
        b.each(function(k, l) {
            l = $(l);
            l.find(".timezone_value").text(a[k]);
            l = null
        });
        b = null
    },
    updateTimezoneLabels: function() {
        TS.utility.throttle.method(TS.view.updateTimezoneLabelsThrottled, "view_tz_labels", 1000)
    },
    startLocalTimeRefreshInterval: function() {
        clearInterval(TS.view.localTimeRefreshInterval);
        TS.view.localTimeRefreshInterval = setInterval(TS.view.updateTimezoneLabels, 60000);
        TS.view.updateTimezoneLabels()
    },
    stopLocalTimeRefreshInterval: function() {
        if (TS.view.localTimeRefreshInterval) {
            clearInterval(TS.view.localTimeRefreshInterval)
        }
    },
    buildTeamList: function() {
        TS.view.rebuildTeamList()
    },
    maybeFollowLink: function(d) {
        if (!d.metaKey && !d.ctrlKey) {
            return false
        }
        var c = $(d.target);
        var b = c.closest("a[href]");
        if (b.length) {
            return true
        }
        return false
    },
    doLinkThings: function(q, c) {
        if (TS.view.maybeFollowLink(q)) {
            return
        }
        if (TS.ui.checkForEditing(q)) {
            q.preventDefault();
            return
        }
        var t = $(q.target);
        if (t.hasClass("member_preview_link") || t.hasClass("member_preview_image")) {
            TS.info("click on .member_preview_link || .member_preview_image");
            q.preventDefault();
            var m = t.data("member-id");
            if (m) {
                var b = t.closest("#member_preview_scroller");
                if (b.length && m == TS.model.previewed_member_id) {
                    TS.menu.startWithMember(q, m)
                } else {
                    var p = t.closest("#msgs_div");
                    if (TS.ui.share_dialog.showing) {
                        TS.ui.share_dialog.div.modal("hide")
                    }
                    if (p.length) {
                        TS.menu.startWithMember(q, m)
                    } else {
                        TS.ui.previewMember(m, c || "team_list")
                    }
                }
            } else {
                TS.warn("hmmm, no data-member-id?")
            }
            return
        }
        if (t.hasClass("member")) {
            TS.info("click on .member");
            q.preventDefault();
            var m = t.data("member-id");
            if (m) {
                TS.menu.startWithMember(q, m)
            } else {
                TS.warn("hmmm, no data-member-id?")
            }
            return
        }
        if (t.hasClass("internal_im_link")) {
            TS.info("click on .internal_im_link");
            q.preventDefault();
            TS.ims.startImByMemberName(t.data("member-name"));
            return
        }
        if (t.hasClass("group_link")) {
            TS.info("click on .group_link");
            TS.view.onGroupReferenceClick(q, t.data("group-id"));
            return
        }
        if (t.hasClass("edit_file_comment")) {
            TS.info("click on .edit_file_comment");
            q.preventDefault();
            TS.comments.ui.startEdit(t.data("file-id"), t.data("comment-id"));
            return
        }
        if (t.hasClass("delete_file_comment")) {
            TS.info("click on .delete_file_comment");
            q.preventDefault();
            TS.comments.ui.startDelete(t.data("file-id"), t.data("comment-id"));
            return
        }
        var i = t.closest(".lightbox_link");
        if (i.length == 1) {
            TS.info("click on .lightbox_link");
            q.preventDefault();
            if (i.hasClass("lightbox_channel_link")) {
                TS.ui.lightbox_dialog.start(true, i.data("file-id"))
            } else {
                TS.ui.lightbox_dialog.start(false, i.data("file-id"))
            }
            return
        }
        var f = t.closest(".lightbox_external_link");
        if (f.length == 1) {
            TS.info("click on .lightbox_external_link");
            q.preventDefault();
            TS.ui.lightbox_dialog.start(true, f.data("src"), true, f.data("link-url"), f.data("width"), f.data("height"));
            return
        }
        if (t.hasClass("internal_file_list_filter")) {
            TS.info("click on .internal_file_list_filter");
            q.preventDefault();
            TS.ui.showFileList();
            TS.ui.toggleFileList(t.data("file-list-filter"));
            return
        }
        if (t.hasClass("channel_link")) {
            TS.info("click on .channel_link");
            TS.view.onChannelReferenceClick(q, t.data("channel-id"));
            return
        }
        var h = t.closest(".internal_channel_link");
        if (h.length == 1) {
            TS.info("click on child of .internal_channel_link");
            TS.view.onChannelReferenceClick(q, h.data("channel-id"));
            return
        }
        var j = t.closest(".internal_member_link");
        if (j.length == 1) {
            TS.info("click on child of .internal_member_link");
            q.preventDefault();
            TS.view.onMemberReferenceClick(q, j.data("member-name"));
            return
        }
        var g = t.closest(".file_preview_link");
        if (g.length == 1) {
            TS.info("click on child of .file_preview_link");
            q.preventDefault();
            if (TS.ui.share_dialog.showing) {
                TS.ui.share_dialog.div.modal("hide")
            }
            var n = g.hasClass("file_comment_link");
            TS.ui.previewFile(g.data("file-id"), c || "file_list", false, n);
            return
        }
        var r = t.closest(".msg_actions");
        if (r.length == 1) {
            TS.info("click on child of .msg_actions");
            var d = r.data("msg-ts");
            if (t.hasClass("msg_cog")) {
                q.preventDefault();
                TS.menu.startWithMessageActions(q, d, TS.shared.getActiveModelOb().msgs)
            }
            return
        }
        var k = t.closest(".comment_actions");
        if (k.length == 1) {
            TS.info("click on child of .comment_actions");
            if (t.hasClass("comment_cog")) {
                q.preventDefault();
                TS.menu.startWithCommentActions(q, k.data("file-id"), k.data("comment-id"))
            }
            return
        }
        if (t.hasClass("file_actions")) {
            TS.info("click on .file_actions");
            q.preventDefault();
            TS.menu.startWithFileActions(q, t.data("file-id"));
            return
        }
        var l = t.closest(".file_actions");
        if (l.length == 1) {
            TS.info("click on child of .file_actions");
            q.preventDefault();
            TS.menu.startWithFileActions(q, l.data("file-id"));
            return
        }
        var a = t.closest(".msg_jump, .star_jump");
        if (a.length == 1) {
            TS.info("click on child of .msg_jump, .star_jump");
            q.preventDefault();
            var o = t.closest(".message").data("ts");
            var s = a.data("cid");
            TS.ui.tryToJump(s, o);
            return
        }
        TS.stars.checkForStarClick(q);
        TS.inline_imgs.checkForInlineImgClick(q);
        TS.inline_videos.checkForInlineVideoClick(q);
        TS.inline_audios.checkForInlineAudioClick(q);
        TS.inline_attachments.checkForInlineAttachmentClick(q);
        if (t.is("a") && t.attr("href") && !t.attr("target") && t.attr("href").toLowerCase().indexOf("skype:") != 0) {
            q.preventDefault();
            TS.utility.openInNewTab(t.attr("href"), TS.templates.builders.newWindowName());
            return
        }
    },
    onSearchResultsClick: function(a) {
        TS.view.doLinkThings(a, "search_results")
    },
    onActivityFeedClick: function(a) {
        TS.view.doLinkThings(a, "activity_feed")
    },
    onStarsListClick: function(a) {
        TS.view.doLinkThings(a, "starred_items")
    },
    onMembersMentionsClick: function(a) {
        TS.view.doLinkThings(a)
    },
    onFileListClick: function(a) {
        TS.view.doLinkThings(a, "file_list")
    },
    onFilePreviewClick: function(a) {
        TS.view.doLinkThings(a, "file_preview")
    },
    onMemberPreviewClick: function(a) {
        TS.view.doLinkThings(a, "member_preview")
    },
    onMemberListClick: function(a) {
        TS.view.doLinkThings(a)
    },
    onChannelOverlayClick: function(a) {
        TS.view.doLinkThings(a)
    },
    onChannelMemberListClick: function(c) {
        if (TS.view.maybeFollowLink(c)) {
            return
        }
        c.preventDefault();
        if (TS.ui.checkForEditing(c)) {
            return
        }
        var b = $(c.target);
        var a = b.closest("li").data("member-id");
        if (!a) {
            return
        }
        TS.menu.startWithMember(c, a, true)
    },
    onMsgsDivClick: function(h) {
        if (TS.view.maybeFollowLink(h)) {
            return
        }
        if (TS.ui.checkForEditing(h)) {
            h.preventDefault();
            return
        }
        var j = $(h.target);
        var f = j.closest(".message").data("ts");
        if (f) {
            f = f.toString()
        }
        var b = TS.shared.getActiveModelOb();
        if (f) {
            if (j.hasClass("resend_temp_msg") || j.hasClass("remove_temp_msg")) {
                var g = j.hasClass("resend_temp_msg");
                var c = TS.utility.msgs.getMsg(f, b.msgs);
                if (c) {
                    if (b.is_channel) {
                        TS.channels.removeMsg(b.id, c);
                        if (g) {
                            TS.channels.sendMsg(b.id, TS.format.unFormatMsg(c.text, c))
                        }
                    } else {
                        if (b.is_group) {
                            TS.groups.removeMsg(b.id, c);
                            if (g) {
                                TS.groups.sendMsg(b.id, TS.format.unFormatMsg(c.text, c))
                            }
                        } else {
                            TS.ims.removeMsg(b.id, c);
                            if (g) {
                                TS.ims.sendMsg(b.id, TS.format.unFormatMsg(c.text, c))
                            }
                        }
                    }
                    delete TS.model.unsent_msgs[c.ts];
                    delete TS.model.display_unsent_msgs[c.ts]
                } else {
                    TS.error("no msg?: " + f)
                }
                return
            }
            if (h.altKey) {
                h.preventDefault();
                var b = TS.shared.getActiveModelOb();
                var i = TS.utility.msgs.getPrevDisplayedMsg(f, b.msgs);
                if (i) {
                    f = i.ts
                }
                if (TS.model.active_channel_id) {
                    TS.channels.markReadMsg(TS.model.active_channel_id, f)
                } else {
                    if (TS.model.active_im_id) {
                        TS.ims.markReadMsg(TS.model.active_im_id, f)
                    } else {
                        if (TS.model.active_group_id) {
                            TS.groups.markReadMsg(TS.model.active_group_id, f)
                        } else {
                            return
                        }
                    }
                }
                TS.ui.reads.length = 0;
                TS.client.markLastReadsWithAPI();
                TS.view.clearUnreadDivider();
                TS.view.insertUnreadDivider();
                TS.ui.dont_check_unreads_til_switch = true;
                return
            }
            if (TS.utility.cmdKey(h) && h.shiftKey) {
                h.preventDefault();
                var d = TS.utility.msgs.getMsg(f, b.msgs);
                TS.dir(0, d);
                var a = d.type + " " + d.subtype + " (probably should not be growling these)";
                if (d.text) {
                    a = d.text
                } else {
                    if (d.attachments && d.attachments.length) {
                        a = TS.ui.growls.getGrowlableTxtFromAttachments(d.attachments) || a
                    }
                }
                TS.ui.growls.show("Testing ", TS.format.formatMsg(a, null, false, true), function() {}, null, true, {
                    id: "test_notification"
                });
                return
            }
        }
        TS.view.doLinkThings(h)
    },
    markAllUnread: function() {
        TS.model.last_reads_set_by_client = {};

        function c(d) {
            var f = TS.utility.msgs.getDisplayedMsgs(d.msgs);
            if (!f.length) {
                return
            }
            var g = f[f.length - 1];
            if (!g) {
                return
            }
            if (d.is_channel) {
                TS.channels.markReadMsg(d.id, g.ts)
            } else {
                if (d.is_im) {
                    TS.ims.markReadMsg(d.id, g.ts)
                } else {
                    if (d.is_group) {
                        TS.groups.markReadMsg(d.id, g.ts)
                    } else {
                        TS.warn("markIt " + d.name + "????");
                        return
                    }
                }
            }
            TS.info("markIt " + d.name + " " + g.ts)
        }
        var b;
        var a;
        for (b in TS.model.channels) {
            a = TS.model.channels[b];
            if (a.is_archived) {
                continue
            }
            if (!a.is_member) {
                continue
            }
            c(a)
        }
        for (b in TS.model.ims) {
            a = TS.model.ims[b];
            if (!a.is_open) {
                continue
            }
            c(a)
        }
        for (b in TS.model.groups) {
            a = TS.model.groups[b];
            if (a.is_archived) {
                continue
            }
            if (!a.is_open) {
                continue
            }
            c(a)
        }
        TS.ui.reads.length = 0;
        TS.client.markLastReadsWithAPI();
        TS.view.clearUnreadDivider();
        TS.view.insertUnreadDivider();
        TS.ui.dont_check_unreads_til_switch = true
    },
    onHelpClick: function(a) {
        TS.view.doLinkThings(a)
    },
    onGroupReferenceClick: function(b, c) {
        var a = TS.groups.getGroupById(c);
        if (!a) {
            return
        }
        if (a.is_archived && !a.was_archived_this_session) {} else {
            b.preventDefault();
            TS.groups.displayGroup(a.id)
        }
    },
    onChannelReferenceClick: function(b, c) {
        var a = TS.channels.getChannelById(c);
        if (!a) {
            return
        }
        if (a.is_archived && !a.was_archived_this_session) {} else {
            b.preventDefault();
            TS.channels.displayChannel(a.id)
        }
    },
    onMemberReferenceClick: function(c, b) {
        var a = TS.members.getMemberByName(b);
        if (!a) {
            return
        }
        TS.menu.startWithMember(c, a.id)
    },
    getDivForMsg: function(a) {
        return TS.view.msgs_div.find("#" + TS.templates.makeMsgDomId(a))
    },
    rebuildMsgs: function() {
        TS.log(5, "rebuilding msgs for " + (TS.model.active_cid));
        TS.ui.auto_scrolling_msgs = false;
        TS.view.clearUnreadDivider();
        var n;
        var l = -1;
        var a = TS.shared.getActiveModelOb();
        var k = "";
        if (!a) {
            TS.error("rebuildMsgs no channel, no im, no group");
            return
        }
        TS.view.last_rendered_msg = null;
        TS.view.last_in_stream_msg = null;
        l = a.scroll_top;
        n = a.msgs;
        var c;
        var p;
        var h, f;
        $.each(TS.view.decorated_messages, function(i, j) {
            if (j) {
                if (j.edited && j.edited.tooltip) {
                    j.edited.tooltip("destroy")
                }
                if (j.timestamp && j.timestamp.tooltip) {
                    j.timestamp.tooltip("destroy")
                }
            }
        });
        TS.view.msgs_div.empty();
        TS.view.decorated_messages = {};
        if (a._cached_html) {
            TS.info("using _cached_html");
            k = a._cached_html;
            a._cached_html = null
        } else {
            if (!n) {
                k = "-"
            } else {
                var b = TS.utility.date.getTimeStamp();
                if (!n.length) {
                    k = ""
                }
                for (var g = n.length - 1; g > -1; g--) {
                    if (!c || !c.no_display) {
                        p = c
                    }
                    c = n[g];
                    k += TS.templates.builders.buildMsgHTML({
                        msg: c,
                        model_ob: a,
                        prev_msg: p,
                        container_id: "msgs_div",
                        enable_slack_action_links: true
                    });
                    if (!c.rsp_id) {
                        TS.view.last_in_stream_msg = c;
                        if (!c.no_display) {
                            TS.view.last_rendered_msg = c
                        }
                    }
                }
            }
        }
        TS.view.msgs_div.html(k);
        var d = {
            show: 450,
            hide: 150
        };

        function m(r, i, j) {
            var q;
            if (!r || !i || !j) {
                return
            }
            q = window.setTimeout(function() {
                if (TS.view.decorated_messages && TS.view.decorated_messages[r] && TS.view.decorated_messages[r][j] && TS.view.decorated_messages[r][j].tooltip) {
                    TS.view.decorated_messages[r][j].tooltip("show")
                }
                q = null
            }, d.show);
            i.one("mouseout", function() {
                if (q) {
                    window.clearTimeout(q);
                    q = null
                }
            })
        }

        function o() {
            var i, j, q;
            j = $(this);
            i = j.parents(".message");
            q = i.attr("id");
            if (q && !TS.view.decorated_messages[q]) {
                TS.view.decorated_messages[q] = {
                    edited: i.find(".edited").tooltip({
                        container: "body"
                    }),
                    timestamp: i.find(".timestamp").tooltip({
                        delay: d,
                        container: "body"
                    })
                };
                if (j.hasClass("edited")) {
                    TS.view.decorated_messages[q].edited.tooltip("show")
                } else {
                    if (j.hasClass("timestamp")) {
                        m(q, j, "timestamp")
                    }
                }
            }
            j = null;
            i = null;
            q = null
        }
        TS.view.msgs_div.undelegate(".message .edited", "mouseover");
        TS.view.msgs_div.undelegate(".message .timestamp", "mouseover");
        TS.view.msgs_div.delegate(".message .edited", "mouseover", o);
        TS.view.msgs_div.delegate(".message .timestamp", "mouseover", o);
        TS.view.makeSureAllLinksHaveTargets(TS.view.msgs_div);
        TS.view.assignLastReadMsgDiv(a);
        TS.view.insertUnreadDivider();
        TS.view.updateEndMarker();
        TS.view.padOutMsgsScroller();
        if (l == -1 || l == undefined || (TS.model.prefs.start_scroll_at_oldest && a.unread_cnt)) {
            TS.ui.instaScrollMsgsToBottom(false);
            if (TS.model.prefs.start_scroll_at_oldest) {
                TS.ui.scrollMsgsSoFirstUnreadMsgIsInView()
            }
        } else {
            TS.ui.instaScrollMsgsToPosition(l, false)
        }
        TS.ui.checkInlineImgs("main")
    },
    cacheMsgsHtml: function() {
        return;
        if (!TS.view.msgs_div[0].innerHTML) {
            return
        }
        if (!TS.model.last_active_cid) {
            return
        }
        var a = TS.ims.getImById(TS.model.last_active_cid) || TS.groups.getGroupById(TS.model.last_active_cid) || TS.channels.getChannelById(TS.model.last_active_cid);
        if (!a) {
            return
        }
        TS.info("cached html for " + a.name);
        a._cached_html = TS.view.msgs_div[0].innerHTML
    },
    adjustForWelcomeSlideShow: function() {
        if (TS.model.cancelled_welcome_2_this_session) {
            return
        }
        TS.model.showing_welcome_2 = true;
        $(".messages_banner").css("visibility", "hidden");
        TS.view.makeMsgsDivUnscrollable()
    },
    msgs_unscrollable: false,
    makeMsgsDivUnscrollable: function() {
        TS.view.msgs_unscrollable = true;
        TS.view.msgs_scroller_div.css("overflow-y", "hidden").css("height", "100%");
        $("#monkey_scroll_wrapper_for_msgs_scroller_div").find(".monkey_scroll_bar").css("visibility", "hidden");
        TS.view.msgs_scroller_div.scrollTop(0);
        TS.view.msgs_div.css("visibility", "hidden");
        $("#footer").css("visibility", "hidden")
    },
    unAdjustForWelcomeSlideShow: function(a) {
        if (!TS.model.showing_welcome_2) {
            TS.view.msgs_scroller_div.data("monkeyScroll").updateFunc();
            return
        }
        TS.model.showing_welcome_2 = false;
        $(".messages_banner").css("visibility", "");
        if (TS.model.seen_welcome_2_this_session && TS.shared.getActiveModelOb().id == TS.model.welcome_model_ob.id) {
            $("#messages_unread_status").css("visibility", "hidden")
        } else {
            $("#messages_unread_status").css("visibility", "")
        } if (TS.view.makeMsgsDivScrollable()) {
            TS.view.resizeManually("ran TS.view.makeMsgsDivScrollable()", true);
            if (a) {
                TS.view.msgs_scroller_div.scrollTop(0)
            }
        } else {
            TS.view.resizeManually("NOT ran TS.view.makeMsgsDivScrollable()", true)
        }
    },
    makeMsgsDivScrollable: function() {
        if (!TS.view.msgs_unscrollable) {
            return false
        }
        TS.view.msgs_unscrollable = false;
        TS.view.msgs_scroller_div.css("overflow-y", "auto").css("height", "");
        $("#monkey_scroll_wrapper_for_msgs_scroller_div").find(".monkey_scroll_bar").css("visibility", "");
        TS.view.msgs_scroller_div.data("monkeyScroll").updateFunc();
        TS.view.msgs_div.css("visibility", "visible");
        $("#footer").css("visibility", "visible");
        return true
    },
    updateEndMarker: function() {
        var c = TS.shared.getActiveModelOb();
        if (!c) {
            TS.error("updateEndMarker no channel, no im, no group");
            return
        }
        var j = $("#end_display_div");
        var d = $("#end_display_meta");
        var i = $("#end_display_status");
        var o = $("#end_display_welcome");
        var b = "";
        var n = false;
        var a = false;
        if (c.history_is_being_fetched) {
            b = "Retrieving history..."
        } else {
            var h = TS.utility.msgs.getOlderMsgsStatus(c);
            if (TS.qs_args.test_is_limited == 1 && !h.more) {
                h.is_limited = true
            }
            if (h.more) {
                if (!TS.model.prefs.seen_welcome_2 && c.id == TS.model.welcome_model_ob.id) {
                    a = true
                } else {
                    b = "And more..."
                }
            } else {
                if (TS.newxp.shouldShowFirstWelcome()) {
                    a = true
                } else {
                    n = true
                }
            }
        } if (a) {
            o.removeClass("hidden");
            if (c.id == TS.model.welcome_model_ob.id) {
                $("#end_display_welcome_general_div").removeClass("hidden");
                if (!TS.model.prefs.seen_welcome_2) {
                    TS.view.adjustForWelcomeSlideShow()
                }
            } else {
                $("#end_display_welcome_general_div").addClass("hidden")
            } if (TS.model.user.is_admin) {
                $(".admin_only").removeClass("hidden");
                $("#welcome_start_ways").removeClass("hidden");
                $(".start_tip").tooltip();
                TS.newxp.updateStartChecks()
            }
        } else {
            o.addClass("hidden")
        } if (n) {
            d.removeClass("hidden");
            if (c.is_channel || c.is_group) {
                var g = TS.utility.date.toCalendarDateOrNamedDay(c.created);
                var m = "";
                if (g.toLowerCase() == "yesterday" || g.toLowerCase() == "today") {
                    g = g.toLowerCase()
                } else {
                    m = "on "
                }
                var f = TS.members.getMemberById(c.creator);
                if (c.is_channel) {
                    $("#channel_meta").removeClass("hidden");
                    $("#group_meta").addClass("hidden");
                    $("#im_meta").addClass("hidden");
                    $("#slackbot_meta").addClass("hidden");
                    $(".channel_meta_name").html(TS.templates.builders.makeChannelLink(c));
                    $(".channel_meta_name").find("a").bind("click", function(p) {
                        p.preventDefault();
                        TS.menu.startWithChannel(p, $(p.target).data("channel-id"))
                    });
                    if (f && f.is_self) {
                        $("#channel_creator_name").html("you created")
                    } else {
                        $("#channel_creator_name").html("was created by " + (f ? TS.templates.builders.makeMemberPreviewLink(f) : "unknown"))
                    }
                    $("#channel_create_date").html(m + g);
                    if (c.name == "random") {
                        $("#channel_meta_random_info").removeClass("hidden");
                        $("#channel_meta_others_info").addClass("hidden")
                    } else {
                        $("#channel_meta_random_info").addClass("hidden");
                        $("#channel_meta_others_info").removeClass("hidden");
                        if (c.purpose.value) {
                            $("#channel_meta_purpose_container").removeClass("hidden");
                            $("#channel_meta_purpose").html(TS.utility.formatTopicOrPurpose(c.purpose.value));
                            $("#channel_meta_purpose_prompt").addClass("hidden");
                            $(".end_action_purpose").closest("li").addClass("hidden")
                        } else {
                            $("#channel_meta_purpose_container").addClass("hidden");
                            $(".end_action_purpose").closest("li").removeClass("hidden")
                        }
                    }
                } else {
                    if (c.is_group) {
                        $("#channel_meta").addClass("hidden");
                        $("#group_meta").removeClass("hidden");
                        $("#im_meta").addClass("hidden");
                        $("#slackbot_meta").addClass("hidden");
                        $(".group_meta_name").html(TS.templates.builders.makeGroupLink(c));
                        $(".group_meta_name").find("a").addClass("ocean_teal").bind("click", function(p) {
                            p.preventDefault();
                            TS.menu.startWithGroup(p, $(p.target).data("group-id"))
                        });
                        if (f && f.is_self) {
                            $("#group_creator_name").html("you created")
                        } else {
                            $("#group_creator_name").html("was created by " + (f ? TS.templates.builders.makeMemberPreviewLink(f) : "unknown"))
                        }
                        $("#group_meta_archived_parent").addClass("hidden");
                        if (c.parent_group) {
                            var l = TS.groups.getGroupById(c.parent_group);
                            if (l) {
                                $("#group_meta_archived_parent").removeClass("hidden");
                                $("#group_meta_archived_parent_link").attr("href", "/archives/" + l.name).text(l.name)
                            }
                        }
                        $("#group_create_date").html(m + g);
                        if (c.purpose.value) {
                            $("#group_meta_purpose_container").removeClass("hidden");
                            $("#group_meta_purpose").html(TS.utility.formatTopicOrPurpose(c.purpose.value));
                            $("#group_meta_purpose_prompt").addClass("hidden");
                            $(".end_action_purpose").closest("li").addClass("hidden")
                        } else {
                            $("#group_meta_purpose_container").addClass("hidden");
                            $(".end_action_purpose").closest("li").removeClass("hidden")
                        }
                    }
                }
                $(".end_action_purpose").off("click").on("click.show_purpose_dialog", function() {
                    TS.ui.purpose_dialog.start(c.name, c)
                });
                $(".end_action_integration").attr("href", "/services/new?channel_id=" + c.id);
                $(".end_action_invite").off("click").on("click.show_invite_dialog", function() {
                    if (c.is_group) {
                        TS.ui.invite.showInviteMembersFromGroupDialog(c.id)
                    } else {
                        TS.ui.invite.showInviteMembersFromChannelDialog(c.id)
                    }
                })
            } else {
                if (c.is_slackbot_im) {
                    $("#channel_meta").addClass("hidden");
                    $("#group_meta").addClass("hidden");
                    $("#im_meta").addClass("hidden");
                    $("#slackbot_meta").removeClass("hidden")
                } else {
                    $("#channel_meta").addClass("hidden");
                    $("#group_meta").addClass("hidden");
                    $("#im_meta").removeClass("hidden");
                    $("#slackbot_meta").addClass("hidden");
                    var k = TS.members.getMemberById(c.user);
                    if (k) {
                        $("#im_meta").html(TS.templates.dm_badge({
                            member: k,
                            im: c
                        }))
                    }
                }
            }
        } else {
            d.addClass("hidden")
        } if (h && h.is_limited) {
            $(".is_limited_copy").removeClass("hidden");
            $(".not_limited_copy").addClass("hidden")
        } else {
            $(".is_limited_copy").addClass("hidden");
            $(".not_limited_copy").removeClass("hidden")
        } if (b) {
            i.removeClass("hidden");
            i.html(b)
        } else {
            i.addClass("hidden")
        }
        $(".is_limited_div").removeClass("been_seen")
    },
    insertUnreadDivider: function() {
        if (!TS.view.msgs_unread_divider) {
            var b = TS.shared.getActiveModelOb();
            if (!b) {
                TS.error("insertUnreadDivider no channel, no im, no group");
                return
            }
            if (TS.view.last_in_stream_msg && b.last_read < TS.view.last_in_stream_msg.ts && b.unread_cnt) {
                var a = TS.templates.messages_unread_divider(b.last_read);
                if (TS.view.last_read_msg_div && TS.view.last_read_msg_div.length) {
                    TS.view.last_read_msg_div.after(a)
                } else {
                    var d = TS.utility.msgs.getOldestValidTs(b.msgs);
                    if (b.last_read > d) {
                        var c = TS.utility.msgs.getDisplayedMsgAfterTS(b.last_read, b.msgs);
                        var f;
                        if (c) {
                            f = TS.view.getDivForMsg(c.ts)
                        }
                        if (f.length) {
                            f.before(a)
                        } else {
                            TS.view.msgs_div.find(".message").last().before(a)
                        }
                    } else {
                        TS.view.msgs_div.find(".message").first().before(a)
                    }
                }
                TS.view.msgs_unread_divider = $("#msgs_unread_divider");
                TS.view.msgs_unread_divider.data("last_read_ts", b.last_read);
                $(".unread_divider").removeClass("no_unreads");
                TS.view.updateNewMsgsDisplay();
                if (TS.ui.isUnreadDividerInView()) {
                    TS.view.hideNewMsgsJumpLink();
                    $("#messages_unread_status").addClass("quiet")
                } else {
                    TS.view.showNewMsgsJumpLink();
                    $("#messages_unread_status").removeClass("quiet")
                }
                TS.view.showNewMsgsBar();
                TS.view.startNewMsgsTimer()
            }
        }
        TS.view.updateNewMsgsDisplay()
    },
    new_msgs_tim: 0,
    startNewMsgsTimer: function() {
        clearTimeout(TS.view.new_msgs_tim);
        TS.view.new_msgs_tim = setTimeout(TS.view.onNewMsgsTimer, 1500)
    },
    hide_blue_bar_tim: 0,
    onNewMsgsTimer: function() {
        var a = TS.shared.getActiveModelOb();
        if (!a.unread_cnt) {
            if (TS.model.prefs.mark_msgs_read_immediately && !TS.model.prefs.start_scroll_at_oldest && !TS.view.hide_blue_bar_tim) {
                TS.view.hide_blue_bar_tim = setTimeout(function() {
                    TS.view.hideNewMsgsBar();
                    $(".unread_divider").addClass("no_unreads")
                }, 4000)
            } else {
                TS.view.hideNewMsgsBar();
                $(".unread_divider").addClass("no_unreads")
            }
        } else {
            TS.view.startNewMsgsTimer()
        }
    },
    clearBlueBarTimer: function() {
        clearTimeout(TS.view.hide_blue_bar_tim);
        TS.view.hide_blue_bar_tim = 0
    },
    hideNewMsgsBar: function() {
        TS.view.clearBlueBarTimer();
        $("#messages_unread_status").fadeOut(150)
    },
    showNewMsgsBar: function() {
        $("#messages_unread_status").fadeIn(150)
    },
    updateNewMsgsDisplay: function() {
        if (!TS.view.msgs_unread_divider) {
            return
        }
        var b = TS.shared.getActiveModelOb();
        if (b.unread_cnt) {
            var c = TS.utility.msgs.getOldestValidTs(b.msgs);
            var g = b.unread_cnt;
            var h = "";
            if (b.last_read < c && g > 10) {
                h = "+";
                g = Math.floor(g / 10) * 10
            }
            var f = TS.view.msgs_unread_divider.data("last_read_ts");
            var d = g + h + " new message" + (g == 1 ? "" : "s") + " since " + TS.utility.date.toTime(f, true);
            var a = TS.utility.date.toCalendarDateOrNamedDay(f, false, true);
            if (a !== "Today") {
                if (a == "Yesterday") {
                    d += " " + a.toLowerCase()
                } else {
                    d += " on " + a
                }
            }
            $("#new_msg_info").html(d)
        }
    },
    showNewMsgsJumpLink: function() {
        $("#messages_unread_status").find(".new_msgs_jump_link").fadeIn(100)
    },
    hideNewMsgsJumpLink: function() {
        $("#messages_unread_status").find(".new_msgs_jump_link").fadeOut(100)
    },
    clearUnreadDivider: function() {
        if (!TS.view.msgs_unread_divider) {
            return
        }
        TS.view.msgs_unread_divider.remove();
        TS.view.msgs_unread_divider = null;
        TS.view.hideNewMsgsBar()
    },
    submit: function(a) {
        if (!TS.model.socket_connected && TS.view.input_el.val() != "/wake") {
            return false
        }
        TS.ui.onSubmit(TS.view.input_el.val(), a);
        return true
    },
    focusMessageInput: function() {
        var a = TS.ims.getImById(TS.model.active_im_id);
        if (a && TS.members.getMemberById(a.user).deleted) {
            TS.view.input_el.attr("placeholder", "account deactivated");
            TS.view.input_el.prop("disabled", true);
            return
        }
        TS.view.input_el.removeAttr("placeholder");
        TS.view.input_el.prop("disabled", false);
        if (TS.model.is_iOS || TS.model.is_ms_tablet) {
            return
        }
        TS.view.input_el.focus();
        TS.view.input_el.setCursorPosition(1000000)
    },
    clearMessageInput: function() {
        TS.ui.populateChatInput("")
    },
    toggleSpellcheck: function() {
        $("textarea").attr("autocorrect", "off");
        $("textarea").attr("autocomplete", "off");
        if (TS.model.prefs.webapp_spellcheck) {
            $("textarea").attr("spellcheck", true)
        } else {
            $("textarea").attr("spellcheck", false)
        }
    },
    sidebarThemePrefChanged: function() {
        if (TS.model.prefs.sidebar_theme) {
            if (TS.model.prefs.sidebar_theme == "arctic_theme") {
                TS.model.prefs.sidebar_theme = "hoth_theme"
            }
            $client_ui = $("#client-ui");
            var d = "sidebar_theme_";
            var c = $client_ui[0];
            var b = c.className.split(" ").filter(function(f) {
                return f.lastIndexOf(d, 0) !== 0
            });
            c.className = b.join(" ");
            $client_ui.addClass(d + TS.model.prefs.sidebar_theme)
        }
        if (TS.model.prefs.sidebar_theme == "default" || TS.model.prefs.sidebar_theme == "default_theme" || TS.model.prefs.sidebar_theme == "basic_theme") {
            $("#sidebar_theme_css").remove()
        } else {
            if (TS.model.prefs.sidebar_theme_custom_values) {
                var a = TS.templates.sidebar_theme_css({
                    theme: JSON.parse(TS.model.prefs.sidebar_theme_custom_values)
                });
                if ($("#sidebar_theme_css").length) {
                    $("#sidebar_theme_css").replaceWith(a)
                } else {
                    $("head").append(a)
                }
            }
        }
        TS.view.updateTitleBarColor();
        TSSSB.call("refreshTileColors")
    },
    updateTitleBarColor: function() {
        var a = TS.utility.rgb2hex($("#team_menu").css("background-color"));
        TSSSB.call("updateTitleBarColor", {
            hex: a
        }, a)
    },
    time24PrefChanged: function() {
        TS.view.rebuildMsgs();
        TS.search.view.renderResults();
        TS.view.rebuildMentions();
        TS.view.rebuildStars();
        TS.view.throttledRebuildFileList();
        TS.view.rebuildImList();
        TS.view.rebuildStarredList();
        if (TS.model.previewed_file_id) {
            TS.ui.rebuildFilePreview(TS.files.getFileById(TS.model.previewed_file_id))
        }
        if (TS.model.team.activity) {
            TS.activity.team_activity_fetched_sig.dispatch(TS.model.team.activity)
        }
    },
    teamPermsPrefChanged: function(a) {
        if (a == "who_can_at_channel" || a == "who_can_at_everyone" || a == "who_can_post_general") {
            TS.utility.msgs.reCalcAndCountAllUnreads()
        }
        TS.view.rebuildChannelList();
        TS.view.rebuildGroupList();
        TS.view.rebuildStarredList();
        TS.view.checkIfInputShouldBeDisabledAndPopulate()
    },
    farReachingDisplayPrefChanged: function() {
        TS.view.rebuildMsgs();
        TS.search.view.renderResults();
        TS.view.rebuildMentions();
        TS.view.rebuildStars();
        TS.view.throttledRebuildFileList();
        TS.view.rebuildImList();
        TS.view.rebuildStarredList();
        TS.view.displayTitle();
        TS.view.rebuildChannelMembersList();
        if ((TS.model.team.prefs.display_real_names && TS.model.prefs.display_real_names_override != -1) || TS.model.prefs.display_real_names_override == 1) {
            $("#col_channels").addClass("real_names")
        } else {
            $("#col_channels").removeClass("real_names")
        } if (TS.model.previewed_file_id) {
            TS.ui.rebuildFilePreview(TS.files.getFileById(TS.model.previewed_file_id))
        }
        if (TS.model.team.activity) {
            TS.activity.team_activity_fetched_sig.dispatch(TS.model.team.activity)
        }
    },
    dTopNotificationChanged: function() {
        TS.utility.msgs.reCalcAndCountAllUnreads();
        TS.view.rebuildStarredList();
        TS.view.rebuildChannelList();
        TS.view.rebuildGroupList()
    },
    displayMsgInChannel: function(b, a) {
        TS.channels.displayChannel(b.id);
        if (b.id == TS.model.active_channel_id) {
            TS.ui.scrollMsgsSoMsgIsInView(a, false, true)
        }
    },
    displayMsgInGroup: function(b, a) {
        TS.groups.displayGroup(b.id);
        if (b.id == TS.model.active_group_id) {
            TS.ui.scrollMsgsSoMsgIsInView(a, false, true)
        }
    },
    displayMsgInIm: function(a, b) {
        TS.ims.startImById(a.id);
        if (a.id == TS.model.active_im_id) {
            TS.ui.scrollMsgsSoMsgIsInView(b, false, true)
        }
    },
    updateUserActive: function() {
        TS.view.last_user_active_timestamp = new Date()
    }
});
TS.registerModule("search.view", {
    advanced_options: false,
    latest_msg_search_results: null,
    latest_match_expanded: null,
    added_to_history_last_ms: 0,
    search_results_lazy_load: null,
    last_terms: "",
    filter_delay_ms: 60000,
    onStart: function() {
        TS.search.all_search_results_fetched_sig.add(TS.search.view.searchFetched, TS.search.view);
        TS.search.search_filter_set_sig.add(TS.search.view.renderResults, TS.search.view);
        TS.search.search_filetype_filter_set_sig.add(TS.search.searchAll, TS.search);
        TS.search.search_sort_set_sig.add(TS.search.searchAll, TS.search);
        TS.search.message_search_expansion_fetched_sig.add(TS.search.view.messageSearchExpansionFetched, TS.search.view);
        TS.prefs.messages_theme_changed_sig.add(TS.search.view.messagesThemeChanged, TS.search.view);
        if (TS.client) {
            $("#flexpane_tabs a").bind("click.setSearchFilter", function() {
                if ($(this).data("tab-id") == "files" || $(this).data("filetype")) {
                    TS.search.setFilter("files")
                } else {
                    TS.search.setFilter("messages")
                }
            });
            $("#search_results_items").bind("click.view", function(a) {
                if ($(a.target).closest("A").length == 0) {
                    return
                }
                if ($(a.target).closest(".file_list_item").length == 1) {
                    TS.search.view.maybeLogSearchInteraction("files")
                }
            });
            $("#search_tabs").html(TS.templates.search_tabs);
            $("#search_clear").bind("click.switch_to_files", function() {
                if (TS.search.filter == "files") {
                    TS.search.view.switchBackToFiles()
                }
            });
            $("#search_results").scroll(function() {
                TS.ui.checkInlineImgs("search")
            })
        }
        if (TS.web) {
            TS.web.login_sig.add(TS.search.view.onLogin, TS.search.view);
            TS.search.all_search_results_fetched_sig.add(TS.search.view.updateHistory, TS.search.view);
            TS.search.search_filter_set_sig.add(TS.search.view.updateHistory, TS.search.view);
            $(window).bind("popstate", function(a) {
                TS.search.view.onPopState(a.originalEvent)
            })
        }
    },
    onLogin: function(a, b) {
        if (TS.boot_data.filter) {
            TS.search.setFilter(TS.boot_data.filter)
        }
        if (TS.boot_data.query) {
            TS.search.query = TS.search.truncateQuery(TS.boot_data.query);
            TS.search.searchAll(TS.search.query)
        }
    },
    pageMessagesForward: function() {
        var a = TS.search.results[TS.search.query_string];
        if (TS.search.view.current_messages_page + 1 > a.messages.paging.pages) {
            return
        }
        TS.search.view.current_messages_page++;
        TS.search.view.renderResults();
        $("#search_results_team").addClass("hidden");
        if (TS.search.view.current_messages_page < a.messages.paging.page) {
            return
        }
        TS.search.getNextPageOfSearchResults(TS.search.query_string, TS.search.view.current_messages_page + 1)
    },
    pageMessagesBack: function() {
        var a = TS.search.results[TS.search.query_string];
        if (TS.search.view.current_messages_page - 1 < 1) {
            return
        }
        TS.search.view.current_messages_page--;
        TS.search.view.renderResults()
    },
    pageFilesForward: function() {
        var a = TS.search.results[TS.search.query_string];
        if (TS.search.view.current_files_page + 1 > a.files.paging.pages) {
            return
        }
        TS.search.view.current_files_page++;
        TS.search.view.renderResults();
        $("#search_results_team").addClass("hidden");
        if (TS.search.view.current_files_page < a.files.paging.page) {
            return
        }
        TS.search.getNextPageOfSearchResults(TS.search.query_string, TS.search.view.current_files_page + 1)
    },
    pageFilesBack: function() {
        var a = TS.search.results[TS.search.query_string];
        if (TS.search.view.current_files_page - 1 < 1) {
            return
        }
        TS.search.view.current_files_page--;
        TS.search.view.renderResults()
    },
    searchFetched: function(b, a) {
        if (a.page == 1) {
            TS.search.view.current_messages_page = 1;
            TS.search.view.current_files_page = 1;
            TS.search.view.waiting_on_page = -1;
            TS.search.view.renderResults();
            TS.search.view.messageSearchResultsFetched(b, a);
            TS.search.view.searchMembers()
        } else {
            if (a.page == TS.search.view.waiting_on_page) {
                TS.search.view.renderResults()
            }
        }
    },
    waiting_on_page: -1,
    current_messages_page: 1,
    current_files_page: 1,
    renderResults: function() {
        TS.search.view.updateOptions();
        if (!TS.search.results[TS.search.query_string]) {
            return
        }
        var c = TS.search.results[TS.search.query_string];
        var b = "";
        var f;
        var g;
        var d = true;
        if (TS.search.filter == "messages") {
            g = (TS.search.view.current_messages_page - 1) * TS.search.per_page;
            if (c.messages.matches) {
                f = c.messages.matches.slice(g, g + TS.search.per_page)
            }
            if (!f || !f.length) {
                TS.search.view.waiting_on_page = TS.search.view.current_messages_page
            }
            if (c.messages.total > 0) {
                b = TS.templates.search_message_results({
                    results: c,
                    page: f,
                    current_page: TS.search.view.current_messages_page,
                    paging_html: (d) ? TS.templates.messages_search_paging({
                        current_page: TS.search.view.current_messages_page,
                        pages: c.messages.paging.pages
                    }) : ""
                })
            } else {
                b = TS.templates.search_results_none({
                    query_string: TS.search.query_string,
                    filter: "messages",
                    error: c.error
                })
            }
            $("#search_results_message_limit").removeClass("hidden");
            $("#search_results_file_limit").addClass("hidden")
        } else {
            if (TS.search.filter == "files") {
                $("#search_tabs").slideDown(500);
                g = (TS.search.view.current_files_page - 1) * TS.search.per_page;
                f = c.files.matches.slice(g, g + TS.search.per_page);
                if (!f.length) {
                    TS.search.view.waiting_on_page = TS.search.view.current_files_page
                }
                if (c.files.total > 0) {
                    var a = (d) ? TS.templates.files_search_paging({
                        current_page: TS.search.view.current_files_page,
                        pages: c.files.paging.pages
                    }) : "";
                    if (f.length) {
                        $.each(f, function(h, i) {
                            b += TS.templates.builders.fileHTML(i, null, true)
                        });
                        b += a
                    } else {
                        b += '<div class="loading_hash_animation"><img src="/img/loading_hash_animation.gif" alt="Loading" /><br />loading page ' + TS.search.view.current_files_page + "...</div>"
                    }
                } else {
                    b += TS.templates.search_results_none({
                        query_string: TS.search.query_string,
                        filter: "files",
                        error: c.error,
                        filetype: TS.search.filetype,
                        filetype_label: TS.model.file_list_type_map[TS.search.filetype]
                    })
                }
                $("#search_results_file_limit").removeClass("hidden");
                $("#search_results_message_limit").addClass("hidden")
            }
        }
        $("#search_results_items").find(".search_jump_maybe").tooltip("destroy");
        $("#search_results_items").html(b);
        if (TS.view) {
            TS.view.makeSureAllLinksHaveTargets($("#search_results_items"))
        } else {
            TS.utility.makeSureAllExternalLinksHaveAreRefererSafe($("#search_results_items"))
        }
        $("#search_results_items").find(".search_jump_maybe").tooltip({
            delay: {
                show: 450,
                hide: 150
            },
            container: "body",
            placement: "left"
        });
        if (TS.search.filter == "messages") {
            $("#search_message_results").bind("click.view", TS.search.view.onMessageSearchResultsContainerClick);
            $(".search_message_result").bind("click.view", TS.search.view.onMessageSearchResultClick)
        }
        if (TS.client) {
            TS.search.view.showResults();
            if (g == 0) {
                TS.view.resizeManually("TS.search.view.renderResults")
            }
            $("#search_results").scrollTop(0);
            TS.ui.checkInlineImgs("search")
        }
        if (TS.search.view.search_results_lazy_load && TS.search.view.search_results_lazy_load.detachEvents) {
            TS.search.view.search_results_lazy_load.detachEvents()
        }
        $("#search_results_container").find("img.lazy").lazyload({
            container: $("#search_results"),
            throttle: 200
        })
    },
    showResults: function() {
        var b = TS.ui.active_tab_id;
        var a = TS.ui.active_tab_ts;
        TS.ui.openFlexTab("search");
        TS.view.resizeManually("TS.search.view.showResults");
        $("#header_search_form").addClass("active");
        if (b == "files" && (TS.ui.active_tab_ts - TS.search.view.filter_delay_ms) < a) {
            TS.search.setFilter("files")
        }
        if (TS.search.filter == "messages") {
            $("#search_tabs").show()
        } else {
            if (TS.search.filter == "files") {
                $("#search_tabs").slideDown(500);
                if (b == "files") {
                    TS.search.setFiletypeFilter(TS.model.active_file_list_filter);
                    if (TS.search.member == null) {
                        TS.search.setMember(TS.model.active_file_list_member_filter)
                    }
                }
            }
        }
    },
    clearFiletypeFilter: function() {
        TS.search.setFiletypeFilter("all")
    },
    updateOptions: function() {
        var a = [];
        var o = [];
        var b = [];
        var x = [];
        var q = [];
        var r = [];
        var v = TS.channels.getChannelsForUser();
        v.sort(function(g, c) {
            return (g._name_lc > c._name_lc) ? 1 : ((c._name_lc > g._name_lc) ? -1 : 0)
        });
        TS.model.groups.sort(function(g, c) {
            return (g._name_lc > c._name_lc) ? 1 : ((c._name_lc > g._name_lc) ? -1 : 0)
        });
        for (var u in v) {
            var y = v[u];
            if (!y) {
                return
            }
            if (y.is_archived) {
                b.push(y)
            } else {
                if (y.is_member) {
                    a.push(y)
                } else {
                    o.push(y)
                }
            }
        }
        for (u in TS.model.groups) {
            var w = TS.model.groups[u];
            if (!w) {
                return
            }
            if (w.is_archived) {
                r.push(w)
            } else {
                if (w.is_open) {
                    x.push(w)
                } else {
                    q.push(w)
                }
            }
        }
        var t = TS.search.query_string;
        var j = t.match(TS.search.from_regex);
        if (j) {
            var k = j[0].replace("from:", "");
            if (k.toLowerCase() == "me") {
                TS.search.member = TS.model.user
            } else {
                var d = TS.members.getMemberByName(k);
                if (d) {
                    TS.search.member = d;
                    TS.search.from = null
                } else {
                    TS.search.from = k;
                    TS.search.member = null
                }
            }
        } else {
            TS.search.member = null;
            TS.search.from = null
        }
        var m = t.match(TS.search.in_regex);
        if (m) {
            var f = m[0].replace("in:", "");
            var z = TS.channels.getChannelByName(f);
            var l = TS.groups.getGroupByName(f);
            var n = TS.ims.getImByUsername(f);
            if (z) {
                TS.search.channel = z;
                TS.search.group = null;
                TS.search.im = null
            } else {
                if (l) {
                    TS.search.group = l;
                    TS.search.channel = null;
                    TS.search.im = null
                } else {
                    if (n) {
                        TS.search.im = n;
                        TS.search.channel = null;
                        TS.search.group = null
                    } else {
                        TS.info("Unable to filter search results by channel, group, or IM named '" + f + "'")
                    }
                }
            }
        } else {
            TS.search.channel = null;
            TS.search.group = null;
            TS.search.im = null
        }
        var h = {
            query_string: TS.search.query_string,
            data: TS.search.results[TS.search.query_string],
            channels: a,
            other_channels: o,
            archived_channels: b,
            groups: x,
            other_groups: q,
            archived_groups: r,
            members: TS.members.getMembersForUser(),
            search_filter: TS.search.filter,
            sort_filter: TS.search.sort,
            advanced_options: TS.search.view.advanced_options,
            search_only_my_channels: TS.model.prefs.search_only_my_channels,
            current_user_id: TS.model.user.id
        };
        if (TS.search.channel) {
            h.channel_id_selected = TS.search.channel.id
        }
        if (TS.search.group) {
            h.group_id_selected = TS.search.group.id
        }
        if (TS.search.member) {
            h.member_id_selected = TS.search.member.id;
            h.member_selected = TS.search.member
        }
        var s = TS.search.results[TS.search.query_string];
        if (s) {
            if (TS.search.filter == "messages" && s.messages && s.messages.paging && s.messages.paging.pages) {
                h.paging_html = TS.templates.messages_search_paging({
                    current_page: TS.search.view.current_messages_page,
                    pages: s.messages.paging.pages
                })
            } else {
                if (TS.search.filter == "files" && s.files && s.files.paging && s.files.paging.pages) {
                    h.paging_html = TS.templates.files_search_paging({
                        current_page: TS.search.view.current_files_page,
                        pages: s.files.paging.pages
                    })
                }
            }
        }
        var p = TS.templates.search_options(h);
        $("#search_options").html(p);
        $("#filter_channel, #filter_group").chosen();
        if (TS.search.results[TS.search.query_string]) {
            $("#search_tabs").html(TS.templates.search_tabs({
                messages_count: TS.utility.numberWithCommas(TS.search.results[TS.search.query_string].messages.total),
                files_count: TS.utility.numberWithCommas(TS.search.results[TS.search.query_string].files.total)
            }))
        }
        if (TS.search.filter == "files") {
            $("#search_heading").html(TS.templates.search_files_heading({
                filetype: TS.search.filetype,
                filetype_label: TS.model.file_list_type_map[TS.search.filetype]
            }));
            $("#search_file_list_heading").bind("click.show_menu", function(c) {
                c.preventDefault();
                TS.menu.startWithFileFilter(c, true)
            });
            $("#search_file_list_clear_filter").bind("click.clear_filter", function(c) {
                c.stopPropagation();
                TS.search.view.clearFiletypeFilter()
            })
        } else {
            $("#search_heading").html("Search Results")
        }
        $("#search_file_list_toggle_users").bind("click.show_menu", function(c) {
            c.preventDefault();
            TS.menu.startWithFileMemberFilter(c, true)
        });
        $("#search_only_my_channels_cb").bind("change", function() {
            TS.prefs.setPrefByAPI({
                name: "search_only_my_channels",
                value: !!$(this).prop("checked")
            })
        })
    },
    toggleAdvancedOptions: function() {
        if (TS.search.view.advanced_options) {
            TS.search.view.advanced_options = false;
            TS.track("search_options_closed")
        } else {
            TS.search.view.advanced_options = true;
            TS.track("search_options_opened")
        }
        $("#advanced_options").slideToggle(100, function() {
            TS.search.view.updateOptions();
            if (TS.client) {
                TS.view.resizeManually("TS.search.view.toggleAdvancedOptions")
            }
        })
    },
    switchBackToFiles: function() {
        if (TS.search.results[TS.search.query_string]) {
            var a = (TS.utility.date.getTimeStamp() - TS.search.results[TS.search.query_string]._time_of_search) / 1000;
            if (a < 60) {
                TS.ui.filterFileList(TS.search.filetype);
                if (TS.search.member) {
                    TS.ui.toggleFileList(TS.search.member.id)
                } else {
                    TS.ui.toggleFileList("all")
                }
            } else {
                TS.ui.filterFileList("all");
                TS.ui.toggleFileList("all")
            }
        }
        $("#search_tabs").slideUp(250, function() {
            setTimeout(function() {
                TS.ui.showFileList()
            }, 100)
        })
    },
    searchMembers: function() {
        var c = TS.search.query_string,
            d = $("#search_results_team"),
            a = new RegExp(TS.utility.regexpEscape(c), "i");
        d.removeClass("hidden");
        if (TS.search.member) {
            d.empty();
            return
        }
        var b = c.toLowerCase();
        team_matches = $.grep(TS.members.getMembersForUser(), function(g, f) {
            if (!g.deleted) {
                return (g._name_lc.indexOf(b) != -1) || (g.profile.real_name_normalized && a.test(g.profile.real_name_normalized)) || (g._real_name_lc && g._real_name_lc.indexOf(b) != -1)
            }
        });
        if (team_matches.length > 0) {
            d.html(TS.templates.search_team_results({
                matches: team_matches
            }))
        } else {
            d.empty()
        }
    },
    updateHistory: function() {
        var d = {
            filter: TS.search.filter,
            query: TS.search.query,
            channel_id: null,
            member_id: null
        };
        if (TS.search.channel) {
            d.channel_id = TS.search.channel.id
        }
        if (TS.search.group) {
            d.group_id = TS.search.group.id
        }
        if (TS.search.member) {
            d.member_id = TS.search.member.id
        }
        var a = "/search/";
        a += TS.search.filter;
        a += "?q=" + encodeURIComponent(TS.search.query_string);
        if (TS.qs_args) {
            var c = Object.keys(TS.qs_args).length;
            for (var b in TS.qs_args) {
                if (TS.qs_args.hasOwnProperty(b)) {
                    if (b != "q") {
                        a += "&" + b + "=" + TS.qs_args[b]
                    }
                }
            }
        }
        if (a == window.location.pathname + window.location.search) {
            window.history.replaceState(d, null, a)
        } else {
            window.history.pushState(d, null, a)
        }
    },
    onPopState: function(b) {
        var a = b.state;
        if (!a) {
            return
        }
        if (a.filter) {
            TS.search.setFilter(a.filter)
        }
        if (a.query) {
            TS.search.query = a.query
        }
        if (a.channel_id) {
            TS.search.channel = TS.channels.getChannelById(a.channel_id)
        } else {
            TS.search.channel = null
        } if (a.group_id) {
            TS.search.group = TS.groups.getGroupById(a.group_id)
        } else {
            TS.search.group = null
        } if (a.member_id) {
            TS.search.member = TS.members.getMemberById(a.member_id)
        } else {
            TS.search.member = null
        }
        TS.search.searchAll(TS.search.query)
    },
    messageSearchResultsFetched: function(d, c) {
        TS.search.view.latest_msg_search_results = d;
        var a = TS.utility.date.getTimeStamp();
        var f = a - TS.search.view.added_to_history_last_ms;
        var b = (f < 5000);
        TS.search.view.added_to_history_last_ms = a;
        if (TS.client) {
            TS.client.flexDisplaySwitched("search", c.query, b)
        }
    },
    messageSearchExpansionFetched: function(a) {
        TS.search.view.rebuildMessageSearchResult(a, true);
        TS.search.view.latest_match_expanded = a
    },
    onMessageSearchResultsContainerClick: function(c) {
        if (getSelection().toString()) {
            return
        }
        if (!TS.search.view.latest_msg_search_results) {
            return
        }
        if (!TS.search.view.latest_msg_search_results.messages) {
            return
        }
        if (!TS.search.view.latest_msg_search_results.messages.matches) {
            return
        }
        var b = TS.search.view.latest_msg_search_results.messages.matches;
        for (var a = 0; a < b.length; a++) {
            if (b[a].expands_cnt) {
                TS.search.view.collapseMatch(b[a])
            }
        }
    },
    search_interactions_logged: {},
    maybeLogSearchInteraction: function(a) {
        var b = TS.search.last_search_query;
        if (!b) {
            return
        }
        if (TS.search.view.search_interactions_logged[a + "__" + b]) {
            return
        }
        TS.search.view.search_interactions_logged[a + "__" + b] = true;
        TS.api.call("search.save", {
            type: a,
            terms: b
        })
    },
    onMessageSearchResultClick: function(g) {
        g.stopPropagation();
        if (getSelection().toString()) {
            return
        }
        TS.search.view.maybeLogSearchInteraction("messages");
        TS.track("search_result_clicked");
        var a = $(g.originalEvent.target);
        var l = $(this).data("channel");
        var h = $(this).data("ts");
        var f = TS.search.getMatchByQueryAndChannelAndTs(TS.search.view.latest_msg_search_results.query, l, h);
        if (!f) {
            TS.error("wtf, no match for " + h + "?");
            return
        }
        var i = a.closest(".internal_member_link");
        if (a.hasClass("search_expand")) {
            TS.search.view.startExpansion(f)
        } else {
            if (a.hasClass("search_collapse")) {
                TS.search.view.collapseMatch(f)
            } else {
                if (a.hasClass("search_jump")) {
                    if (TS.web) {
                        return
                    }
                    g.preventDefault();
                    var c = false;
                    TS.ui.tryToJump(l, h, "", "", c)
                } else {
                    if (a.hasClass("search_jump_maybe") && TS.utility.cmdKey(g)) {
                        if (TS.web) {
                            return
                        }
                        g.preventDefault();
                        var c = true;
                        TS.ui.tryToJump(l, h, a.attr("href"), a.attr("target"), c)
                    } else {
                        if (i.length == 1) {
                            g.preventDefault();
                            TS.view.onMemberReferenceClick(g, i.data("member-name"));
                            return
                        } else {
                            if (a.hasClass("internal_im_link")) {
                                if (TS.web) {
                                    return
                                }
                                g.preventDefault();
                                var j = TS.ims.getImByUsername(a.data("member-name"));
                                if (!j) {
                                    return
                                }
                                TS.ims.startImById(j.id)
                            } else {
                                if (a.hasClass("channel_link")) {
                                    if (TS.web) {
                                        return
                                    }
                                    g.preventDefault();
                                    TS.channels.displayChannel(a.data("channel-id"))
                                } else {
                                    if (a.hasClass("group_link")) {
                                        if (TS.web) {
                                            return
                                        }
                                        g.preventDefault();
                                        TS.groups.displayGroup(a.data("group-id"))
                                    } else {
                                        if (a.hasClass("msg_inline_img_collapser") || a.hasClass("msg_inline_img_expander")) {
                                            TS.inline_imgs.checkForInlineImgClick(g, f);
                                            if (TS.client) {
                                                TS.ui.updateClosestMonkeyScroller($("#search_results"))
                                            }
                                        } else {
                                            if (a.hasClass("msg_inline_video_collapser") || a.hasClass("msg_inline_video_expander") || a.closest(".msg_inline_video_play_button").length) {
                                                TS.inline_videos.checkForInlineVideoClick(g, f);
                                                if (TS.client) {
                                                    TS.ui.updateClosestMonkeyScroller($("#search_results"))
                                                }
                                            } else {
                                                if (a.hasClass("msg_inline_audio_collapser") || a.hasClass("msg_inline_audio_expander") || a.closest(".inline_audio_play_link").length) {
                                                    TS.inline_audios.checkForInlineAudioClick(g, f);
                                                    if (TS.client) {
                                                        TS.ui.updateClosestMonkeyScroller($("#search_results"))
                                                    }
                                                } else {
                                                    if (a.hasClass("msg_inline_attachment_collapser") || a.hasClass("msg_inline_attachment_expander") || a.closest(".rest_text_expander").length) {
                                                        TS.inline_attachments.checkForInlineAttachmentClick(g, f);
                                                        if (TS.client) {
                                                            TS.ui.updateClosestMonkeyScroller($("#search_results"))
                                                        }
                                                    } else {
                                                        if (a.closest(".lightbox_link").length == 1) {
                                                            if (TS.web) {
                                                                return
                                                            }
                                                            var k = a.closest(".lightbox_link");
                                                            TS.info("click on .lightbox_link");
                                                            g.preventDefault();
                                                            TS.ui.lightbox_dialog.start(false, k.data("file-id"))
                                                        } else {
                                                            if (a.closest(".lightbox_external_link").length == 1) {
                                                                if (TS.web) {
                                                                    return
                                                                }
                                                                var b = a.closest(".lightbox_external_link");
                                                                TS.info("click on .lightbox_external_link");
                                                                g.preventDefault();
                                                                TS.ui.lightbox_dialog.start(false, b.data("src"), true, b.data("link-url"), b.data("width"), b.data("height"))
                                                            } else {
                                                                if (TS.boot_data.feature_search_extracts && a.closest(".search_extracts").length == 1) {
                                                                    TS.search.view.hideExtracts(a, f)
                                                                } else {
                                                                    if (TS.boot_data.feature_search_extracts && a.is(".compress_conversation")) {
                                                                        TS.search.view.showExtracts(a, f)
                                                                    } else {
                                                                        if (TS.boot_data.feature_search_extracts && a.closest(".message_star_holder").length == 1) {
                                                                            TS.stars.checkForStarClick(g)
                                                                        } else {
                                                                            if (TS.boot_data.feature_search_extracts && (a.is(".member_preview_link") || a.is(".member_preview_image") || a.is(".member"))) {
                                                                                g.preventDefault();
                                                                                var d = a.closest("[data-member-id]").data("member-id");
                                                                                if (d) {
                                                                                    TS.menu.startWithMember(g, d)
                                                                                }
                                                                            } else {
                                                                                if (a.attr("onclick") || a.attr("href")) {} else {
                                                                                    if (f.expands_cnt > 1 && (f.expands_cnt == 3 || f.previous_expands.length >= (TS.search.big_expand_count * 2) || f.next_expands.length >= (TS.search.big_expand_count * 2))) {
                                                                                        TS.search.view.collapseMatch(f)
                                                                                    } else {
                                                                                        TS.search.view.startExpansion(f)
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
    startExpansion: function(a) {
        TS.search.expandMatch(a)
    },
    collapseMatch: function(a) {
        if (!a) {
            return
        }
        TS.search.removeExpansions(a);
        TS.search.view.rebuildMessageSearchResult(a, false)
    },
    rebuildMessageSearchResult: function(d, h) {
        if (!d) {
            TS.error("wtf no match?");
            return
        }
        var a = $("#search_results_items").find("#" + TS.templates.makeMSRDomId(d));
        var c = a.find(".search_message_result_previous_holder");
        var b = a.find(".search_message_result_next_holder");
        var i = c.height();
        var g = b.height();
        a.empty().replaceWith(TS.templates.search_message_results_item(d));
        a = $("#search_results_items").find("#" + TS.templates.makeMSRDomId(d));
        c = a.find(".search_message_result_previous_holder");
        b = a.find(".search_message_result_next_holder");
        a.click(TS.search.view.onMessageSearchResultClick);
        if (h) {
            var f;
            c.show();
            b.show();
            c.css("opacity", 0);
            b.css("opacity", 0);
            f = c.height();
            c.height(i);
            c.animate({
                height: f
            }, 200, function() {
                c.stop().animate({
                    opacity: 1
                }, 100);
                c.css("height", "")
            });
            f = b.height();
            b.height(g);
            b.animate({
                height: f
            }, 200, function() {
                b.stop().animate({
                    opacity: 1
                }, 100);
                b.css("height", "")
            })
        } else {
            c.hide();
            b.hide()
        } if (TS.client) {
            setTimeout(function() {
                TS.ui.updateClosestMonkeyScroller($("#search_results"))
            }, h ? 101 : 0);
            TS.ui.checkInlineImgs("search")
        }
    },
    messagesThemeChanged: function() {
        if (TS.boot_data.feature_search_extracts && TS.model.ui_state.flex_name === "search") {
            TS.search.view.renderResults()
        }
    },
    hideExtracts: function(a, d) {
        var c = a.closest(".search_extracts").data("msg-id");
        var b = $("#search_results").find("#" + c);
        d.extracts_expanded = true;
        a.closest(".search_message_result").addClass("extracts_expanded");
        if (b.closest(":scrollable(vertical)").length === 0) {
            b.highlight(250, "", null, 400)
        } else {
            b.scrollintoview({
                duration: 500,
                offset: "top",
                px_offset: 50,
                complete: function() {
                    b.highlight(250, "", null, 400)
                }
            })
        }
    },
    showExtracts: function(a, b) {
        b.extracts_expanded = false;
        a.closest(".search_message_result").removeClass("extracts_expanded").find(".search_extracts_container").scrollintoview({
            duration: 500,
            offset: "top",
            px_offset: 50
        })
    },
    msgHasExtracts: function(c) {
        if (c.extracts && c.extracts.length > 0) {
            return true
        }
        var b;
        if (c.attachments) {
            for (var a = 0; a < c.attachments.length; a++) {
                b = c.attachments[a];
                if (b.extracts && Object.keys(b.extracts).length > 0) {
                    return true
                }
            }
        }
        return false
    }
});
TS.registerModule("search.widget", {
    is_open: false,
    suggestion_index: -1,
    suggestion_selected: false,
    suppress_suggestions: false,
    last_input_blur_logged: "",
    onStart: function() {
        TS.search.search_dispatched_sig.add(TS.search.widget.startSpinner, TS.search.widget);
        TS.search.all_search_results_fetched_sig.add(TS.search.widget.stopSpinner, TS.search.widget);
        if (TS.client) {
            TS.search.search_channel_set_sig.add(TS.search.widget.updateInput, TS.search.widget);
            TS.search.search_group_set_sig.add(TS.search.widget.updateInput, TS.search.widget);
            TS.search.search_member_set_sig.add(TS.search.widget.updateInput, TS.search.widget)
        }
        if (TS.web) {
            TS.search.quick_search_results_fetched_sig.add(TS.search.widget.stopSpinner, TS.search.widget);
            TS.search.quick_search_results_fetched_sig.add(TS.search.widget.renderResults, TS.search.widget)
        }
        TS.search.autosuggest_search_results_fetched_sig.add(TS.search.widget.renderResults, TS.search.widget);
        TS.search.widget.bindForm()
    },
    bindForm: function() {
        var c = $("#header_search_form");
        var b = $("#search_terms");
        b.TS_tabComplete2({
            complete_cmds: false,
            member_prefix: "from:",
            member_colon: false,
            complete_channels: true,
            channel_prefix: "in:",
            include_self: true,
            onComplete: function(g) {
                b.val(g);
                if (TS.client) {
                    f()
                }
                if (TS.web) {
                    a()
                }
            }
        });
        if (TS.client) {
            function f(g) {
                clearTimeout(TS.search.widget.key_tim);
                var h = $.trim(b.val());
                if (h == "") {
                    TS.search.widget.clearInput();
                    if (TS.search.filter == "files") {
                        TS.search.view.switchBackToFiles()
                    }
                } else {
                    if (h.length >= 2 || g) {
                        TS.search.searchAll(h)
                    }
                    c.addClass("active")
                }
            }
            c.bind("submit", function(g) {
                TS.track("search_enter_pressed");
                f(true);
                return false
            });
            b.bind("focus", function() {
                if ($.trim(b.val()) != "") {
                    TS.search.view.showResults()
                }
                b.setCursorPosition(1000000)
            });
            b.bind("click", function(g) {
                TS.tips.maybeDoThrobberProxyClick("search_input_tip_card_throbber", g)
            })
        }
        if (TS.web) {
            c.bind("submit", function(g) {
                TS.track("search_enter_pressed")
            });

            function a() {
                if (TS.client) {
                    return
                }
                var g = $.trim(b.val());
                if (g != "" && g != TS.search.query && g.length >= 2) {
                    TS.search.quickSearch(g)
                }
                TS.search.widget.suggestion_index = -1;
                TS.search.widget.suggestion_selected = false
            }
        }

        function d() {
            var g = $.trim(b.val());
            TS.search.widget.suggestion_index = -1;
            TS.search.widget.suggestion_selected = false;
            if (g.length) {
                TS.search.searchSuggest(g)
            }
        }
        b.bind("keyup", function(g) {
            if (g.which == TS.utility.keymap.esc) {
                b.blur();
                return
            } else {
                if (g.which == TS.utility.keymap.alt || g.which == TS.utility.keymap.ctrl || g.which == TS.utility.keymap.cmd_ff || g.which == TS.utility.keymap.cmd_other || g.which == TS.utility.keymap.cmd_right || g.which == TS.utility.keymap.shift || g.which == TS.utility.keymap.left || g.which == TS.utility.keymap.right || g.which == TS.utility.keymap.end || g.which == TS.utility.keymap.home) {
                    return
                }
            } if (TS.search.suggestions.length > 0 && TS.search.widget.is_open) {
                if (g.which == TS.utility.keymap.up || g.which == TS.utility.keymap.down) {
                    return
                }
            }
            if (TS.web) {
                a();
                d()
            }
            if (TS.client) {
                clearTimeout(TS.search.widget.key_tim);
                if (g.which == TS.utility.keymap.enter) {
                    f()
                } else {
                    TS.search.widget.key_tim = setTimeout(function() {
                        f()
                    }, 500)
                } if (g.which == TS.utility.keymap.enter) {
                    TS.search.widget.close();
                    TS.search.widget.suppress_suggestions = true
                } else {
                    d()
                }
            }
        });
        b.bind("keydown", function(h) {
            if (TS.search.widget.is_open) {
                if (TS.search.suggestions.length > 0) {
                    if (h.which == TS.utility.keymap.up || h.which == TS.utility.keymap.down) {
                        h.preventDefault();
                        if (h.which == TS.utility.keymap.up) {
                            if (TS.search.widget.suggestion_index == 0) {
                                TS.search.widget.suggestion_index = TS.search.suggestions.length - 1
                            } else {
                                TS.search.widget.suggestion_index--
                            }
                        } else {
                            if (h.which == TS.utility.keymap.down) {
                                if (TS.search.widget.suggestion_index == (TS.search.suggestions.length - 1)) {
                                    TS.search.widget.suggestion_index = 0
                                } else {
                                    TS.search.widget.suggestion_index++
                                }
                            }
                        }
                        $("#search_suggestions").find(".suggestion.active").removeClass("active");
                        var i = $("#search_suggestions").find(".suggestion[data-index=" + TS.search.widget.suggestion_index + "]");
                        i.addClass("active");
                        TS.search.widget.suggestion_selected = true;
                        if (TS.search.suggestions[TS.search.widget.suggestion_index]) {
                            var g = TS.search.suggestions[TS.search.widget.suggestion_index]["value"];
                            TS.search.input.val(g + " ")
                        }
                        return
                    }
                }
                if (h.which == TS.utility.keymap.enter) {
                    if (TS.search.widget.suggestion_selected) {
                        TS.search.widget.onSelectSuggest(TS.search.widget.suggestion_index);
                        h.stopPropagation();
                        return false
                    }
                }
            }
        });
        if (TS.web) {
            b.bind("focus.open_widget", TS.search.widget.open)
        }
        $("#search_clear").bind("click.clear_input", function() {
            TS.search.widget.clearInput()
        });
        b.bind("focus.set_cursor", function() {
            b.setCursorPosition(1000000)
        });
        b.bind("blur", TS.search.widget.maybeLogSearchInputBlur)
    },
    maybeLogSearchInputBlur: function(b) {
        var a = TS.search.last_search_query;
        if (!a) {
            return
        }
        if (TS.search.widget.last_input_blur_logged == a) {
            return
        }
        TS.search.widget.last_input_blur_logged = a;
        TS.api.call("search.save", {
            terms: a
        })
    },
    open: function() {
        $("#header_search_form").addClass("active");
        if (TS.client && TS.search.suggestions.length == 0) {
            return
        }
        if (TS.web && $("#search_widget").is(":empty")) {
            return
        }
        TS.search.widget.is_open = true;
        $("#search_widget").removeClass("hidden inactive");
        $("#search_terms").addClass("widget_open");
        $("body").bind("click.close_widget", function(b) {
            var a = $(b.target);
            if (a.parents("#header_search_form").length == 0) {
                TS.search.widget.close()
            }
        });
        $(window.document).bind("keyup.escape_widget", function(a) {
            if (a.which == TS.utility.keymap.esc) {
                TS.search.widget.close()
            }
        })
    },
    close: function() {
        TS.search.widget.is_open = false;
        if ($.trim(TS.search.input.val()) == "") {
            $("#header_search_form").removeClass("active")
        }
        $("#search_widget").addClass("inactive");
        $("#search_terms").removeClass("widget_open");
        if (TS.web) {
            $("#search_terms").blur()
        }
        $("body").unbind("click.close_widget");
        $(window.document).unbind("keyup.escape_widget");
        setTimeout(function() {
            $("#search_widget").addClass("hidden")
        }, 100)
    },
    clearInput: function() {
        var b = $("#search_terms");
        var a = $.trim(b.val());
        if (TS.client) {
            TS.search.widget.close()
        }
        b.val("");
        if (a == "") {
            if (TS.web) {
                TS.search.widget.close()
            }
        } else {
            b.focus()
        }
    },
    updateInput: function() {
        if (TS.search.query) {
            $("#search_terms").val(TS.search.query_string)
        }
    },
    renderResults: function(a) {
        var b = {};
        b = {
            query: TS.search.query,
            suggestions: TS.search.suggestions,
            messages: a.messages,
            files: a.files
        };
        html = TS.templates.search_widget(b);
        $("#search_widget").html(html);
        if (!TS.search.widget.is_open) {
            TS.search.widget.open()
        }
        TS.search.widget.bindSuggestions();
        if (TS.client && TS.search.suggestions.length == 0) {
            TS.search.widget.close()
        }
    },
    startSpinner: function() {
        $("#header_search_form").find(".icon_search").addClass("hidden");
        $("#header_search_form").find(".icon_loading").removeClass("hidden")
    },
    stopSpinner: function() {
        $("#header_search_form").find(".icon_loading").addClass("hidden");
        $("#header_search_form").find(".icon_search").removeClass("hidden")
    },
    bindSuggestions: function() {
        $("#search_suggestions").find(".suggestion").bind("click", function() {
            TS.search.widget.onSelectSuggest($(this).data("index"))
        })
    },
    onSelectSuggest: function(a) {
        var b = TS.search.suggestions[a]["value"];
        if (!TS.search.suggestions[a]) {
            return
        }
        $("#search_terms").val(b);
        TS.track("search_suggestion_chosen");
        if (TS.web) {
            TS.search.quickSearch(b);
            TS.search.searchSuggest(b)
        }
        if (TS.client) {
            TS.search.widget.close();
            TS.search.searchAll(b)
        }
    }
});
TS.registerModule("ui.group_create_dialog", {
    div: null,
    showing: false,
    auto_name: false,
    auto_name_str: null,
    start_member_id: null,
    onStart: function() {},
    onKeydown: function(a) {
        if (a.which == TS.utility.keymap.enter) {
            if (TS.utility.getActiveElementProp("NODENAME") == "BODY") {
                TS.ui.group_create_dialog.go();
                a.preventDefault()
            }
        } else {
            if (a.which == TS.utility.keymap.esc) {
                if (TS.utility.getActiveElementProp("NODENAME") == "BODY") {
                    TS.ui.group_create_dialog.cancel()
                }
            }
        }
    },
    startWithMember: function(c) {
        if (TS.ui.checkForEditing()) {
            return
        }
        var d = TS.members.getMemberById(c);
        if (!d) {
            return
        }
        var a = true;
        if (d.is_ultra_restricted || TS.model.user.is_ultra_restricted) {
            a = false
        } else {
            if (!TS.model.user.is_admin && d.is_restricted) {
                a = false
            }
        } if (!a) {
            return
        }
        TS.ui.group_create_dialog.start_member_id = c;
        var b = TS.groups.createSuggestedName([d.id]);
        TS.ui.group_create_dialog.start(b, [d.id], true)
    },
    start: function(f, b, i) {
        if (TS.ui.checkForEditing()) {
            return
        }
        if (!TS.members.canUserCreateGroups()) {
            return
        }
        f = TS.utility.cleanChannelName(f || "");
        b = b || [];
        TS.ui.group_create_dialog.auto_name = !!i;
        if (!TS.ui.group_create_dialog.div) {
            TS.ui.group_create_dialog.build()
        }
        var h = TS.ui.group_create_dialog.div;
        var d;
        var g;
        if (TS.model.user.is_admin) {
            g = d = TS.groups.getActiveMembersForInviting()
        } else {
            d = TS.groups.getActiveMembersForInviting(true);
            g = TS.groups.getActiveMembersForInviting()
        }
        var a = TS.channels.makeMembersWithPreselectsForTemplate(g, b);
        var c = TS.templates.generic_dialog({
            title: "Create a private group",
            body: TS.templates.group_create({
                title: f,
                invite_members: a,
                show_ra_tip: g.length != d.length
            })
        });
        h.empty();
        h.html(c);
        h.find(".dialog_cancel").html("Cancel").removeClass("hidden").click(TS.ui.group_create_dialog.cancel);
        h.find(".dialog_go").html("Create Group").click(TS.ui.group_create_dialog.go);
        TS.ui.group_create_dialog.bindCreateInvite();
        h.modal("show")
    },
    bindCreateInvite: function() {
        $("#select_create_invite_group_members").chosen({
            placeholder_text_multiple: " ",
            multiple_always_open: true,
            multiple_select_maintains_winnow: false
        });
        var a = 0;
        $("#select_create_invite_group_members").bind("focus", function() {
            $("#create_invite_group_members_holder").find(".chzn-drop").show();
            a = a + 1;
            if (a == 3) {
                $("#select_create_invite_group_members").bind("blur", function() {
                    $("#create_invite_group_members_holder").find(".chzn-drop").hide()
                })
            }
        });
        if (TS.ui.group_create_dialog.auto_name) {
            TS.ui.group_create_dialog.auto_name_str = $("#group_create_title").val();
            $("#select_create_invite_group_members").bind("change.auto_name", function() {
                if (TS.ui.group_create_dialog.auto_name_str != $("#group_create_title").val()) {
                    $(this).unbind("change.auto_name");
                    return
                }
                var b = $(this).val() || [];
                $("#group_create_title").val(TS.groups.createSuggestedName(b));
                TS.ui.group_create_dialog.auto_name_str = $("#group_create_title").val()
            })
        }
        $("#select_create_invite_group_members_chzn").find(".chzn-results").css("max-height", 100);
        $("#select_create_invite_group_members_holder").css("min-height", 145);
        $("#select_create_invite_group_members_chzn").find(".chzn-choices").css({
            "max-height": 58,
            "overflow-y": "scroll"
        });
        $(".modal-body").css("overflow-y", "visible");
        $("#select_create_invite_group_members_chzn").css("width", "392px");
        $("#select_create_invite_group_members_chzn").find(".default").css("width", "100%")
    },
    showNameTakenAlert: function() {
        var a = TS.ui.group_create_dialog.div;
        a.find(".modal_input_note").addClass("hidden");
        a.find(".name_taken_warning").removeClass("hidden");
        $("#group_create_title").select()
    },
    showExistingGroupsAlert: function(b) {
        $(".modal-body").css("overflow-y", "");
        var c = TS.ui.group_create_dialog.div;
        var a = TS.templates.existing_groups({
            existing_groups: b
        });
        c.find(".modal_input_note").addClass("hidden");
        c.find(".existing_groups_warning").html(a).removeClass("hidden").data("has-been-shown", true)
    },
    showNoInvitesAlert: function() {
        var a = TS.ui.group_create_dialog.div;
        a.find(".modal_input_note").addClass("hidden");
        a.find(".no_invites_warning").removeClass("hidden")
    },
    showNoTitleAlert: function() {
        var a = TS.ui.group_create_dialog.div;
        a.find(".modal_input_note").addClass("hidden");
        a.find(".name_missing_warning").removeClass("hidden")
    },
    go: function() {
        if (!TS.ui.group_create_dialog.showing) {
            TS.error("not showing?");
            return
        }
        if (TS.ui.group_create_dialog.validateAndSubmit()) {
            TS.ui.group_create_dialog.div.modal("hide")
        }
    },
    useExistingGroup: function(a) {
        var b = TS.groups.getGroupById(a);
        if (!b) {
            return
        }
        if (b.is_archived) {
            TS.api.call("groups.unarchive", {
                channel: a
            })
        }
        TS.groups.displayGroup(a);
        TS.ui.group_create_dialog.div.modal("hide")
    },
    validateAndSubmit: function() {
        var g = TS.ui.group_create_dialog.div;
        var d = $("#group_create_title").val();
        var b = $.trim($("#group_purpose_input").val());
        var f = TS.utility.cleanChannelName(d);
        while (d.substr(0, 1) == "#") {
            d = d.substr(1)
        }
        if (!d) {
            TS.ui.group_create_dialog.showNoTitleAlert();
            return false
        }
        if (f != d) {
            $("#group_create_title").val(f);
            alert("You entered some disallowed characters in the group name, which we've fixed. Make sure it looks good to you, and try again!");
            return false
        }
        if (TS.channels.getChannelByName(d) || TS.groups.getGroupByName(d) || TS.members.getMemberByName(d)) {
            TS.ui.group_create_dialog.showNameTakenAlert();
            return false
        }
        var a = $("#select_create_invite_group_members").val() || [];
        if (!g.find(".existing_groups_warning").data("has-been-shown")) {
            $("#create_invite_group_members_holder").addClass("hidden");
            var c = TS.groups.getGroupsWithTheseActiveMembers(a.concat(TS.model.user.id));
            if (c.length) {
                TS.ui.group_create_dialog.showExistingGroupsAlert(c);
                return false
            }
        }
        if (TS.model.created_groups[d]) {
            return false
        }
        TS.groups.create(d, a, function(i, j, h) {
            if (!i) {
                if (j.error == "name_taken") {
                    TS.ui.group_create_dialog.showNameTakenAlert()
                } else {
                    if (j.error == "restricted_action") {
                        TS.generic_dialog.alert("<p>You don't have permission to create new groups.</p><p>Talk to your team owner.</p>")
                    } else {
                        alert("failed! " + j.error)
                    }
                }
                return
            }
            if (b) {
                TS.groups.setPurpose(j.group.id, b)
            }
            g.modal("hide")
        });
        return false
    },
    reset: function() {
        TS.ui.group_create_dialog.auto_name = false;
        TS.ui.group_create_dialog.auto_name_str = null;
        TS.ui.group_create_dialog.start_member_id = null
    },
    cancel: function() {
        TS.ui.group_create_dialog.reset();
        TS.ui.group_create_dialog.div.modal("hide")
    },
    end: function() {
        TS.ui.group_create_dialog.div.empty();
        TS.ui.group_create_dialog.showing = TS.model.dialog_is_showing = false;
        TS.ui.group_create_dialog.reset();
        $(window.document).unbind("keydown", TS.ui.group_create_dialog.onKeydown)
    },
    build: function() {
        $("body").append('<div id="group_create_dialog" class="modal hide fade"></div>');
        var a = TS.ui.group_create_dialog.div = $("#group_create_dialog");
        a.on("hide", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.group_create_dialog.end()
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.group_create_dialog.showing = TS.model.dialog_is_showing = true
        });
        a.on("shown", function(b) {
            if (b.target != this) {
                return
            }
            setTimeout(function() {
                $("#group_create_title").select();
                $(window.document).bind("keydown", TS.ui.group_create_dialog.onKeydown)
            }, 100)
        })
    }
});
TS.registerModule("ui.channel_create_dialog", {
    div: null,
    showing: false,
    is_edit: false,
    model_ob: null,
    ladda: null,
    onStart: function() {},
    onKeydown: function(a) {
        if (a.which == TS.utility.keymap.enter) {
            TS.ui.channel_create_dialog.go();
            a.preventDefault()
        } else {
            if (a.which == TS.utility.keymap.esc) {
                TS.ui.channel_create_dialog.cancel()
            }
        }
    },
    start: function(c, a) {
        if (TS.ui.checkForEditing()) {
            return
        }
        if (a) {
            if (TS.model.user.is_restricted) {
                return
            }
            TS.ui.channel_create_dialog.is_edit = true;
            TS.ui.channel_create_dialog.model_ob = a
        } else {
            if (!TS.members.canUserCreateChannels()) {
                return
            }
            TS.ui.channel_create_dialog.is_edit = false;
            TS.ui.channel_create_dialog.model_ob = null
        }
        c = TS.utility.cleanChannelName(c || "");
        if (!TS.ui.channel_create_dialog.div) {
            TS.ui.channel_create_dialog.build()
        }
        var d = TS.ui.channel_create_dialog.div;
        var b = TS.templates.channel_create_dialog({
            title: c,
            is_edit: TS.ui.channel_create_dialog.is_edit,
            is_group: TS.ui.channel_create_dialog.model_ob && TS.ui.channel_create_dialog.model_ob.is_group,
            hide_private_group_option: false
        });
        d.empty();
        d.html(b);
        d.find(".dialog_cancel").click(TS.ui.channel_create_dialog.cancel);
        d.find(".dialog_go").click(TS.ui.channel_create_dialog.go);
        d.modal("show")
    },
    switchToGroup: function() {
        var a = TS.ui.channel_create_dialog.div.find(".title_input").val();
        TS.ui.channel_create_dialog.cancel();
        setTimeout(function() {
            TS.ui.group_create_dialog.start(a)
        }, 350)
    },
    showNameTakenAlert: function() {
        var a = TS.ui.channel_create_dialog.div;
        TS.channels.ui.channelCreateDialogShowNameTakenAlert(a)
    },
    go: function() {
        if (!TS.ui.channel_create_dialog.showing) {
            TS.error("not showing?");
            return
        }
        var f = TS.ui.channel_create_dialog.div;
        var c = TS.channels.ui.channelCreateDialogValidateInput(f);
        if (!c) {
            return
        }
        var b = f.find(".title_input").val();
        var a = $.trim(f.find("#channel_purpose_input").val());
        if (TS.ui.channel_create_dialog.ladda) {
            TS.ui.channel_create_dialog.ladda.start()
        }
        if (TS.ui.channel_create_dialog.is_edit) {
            var d = (TS.ui.channel_create_dialog.model_ob.is_channel) ? "channels.rename" : "groups.rename";
            TS.api.callImmediately(d, {
                name: b,
                channel: TS.ui.channel_create_dialog.model_ob.id
            }, function(h, i, g) {
                if (TS.ui.channel_create_dialog.ladda) {
                    TS.ui.channel_create_dialog.ladda.stop()
                }
                if (!h) {
                    if (i.error == "name_taken") {
                        TS.ui.channel_create_dialog.showNameTakenAlert()
                    } else {
                        alert("failed! " + i.error)
                    }
                    return
                }
                f.modal("hide")
            })
        } else {
            TS.channels.join(b, function(h, i, g) {
                if (TS.ui.channel_create_dialog.ladda) {
                    TS.ui.channel_create_dialog.ladda.stop()
                }
                if (!h) {
                    if (i.error == "name_taken") {
                        TS.ui.channel_create_dialog.showNameTakenAlert()
                    } else {
                        if (i.error == "restricted_action") {} else {
                            alert("failed! " + i.error)
                        }
                    }
                    return
                }
                if (a) {
                    TS.channels.setPurpose(i.channel.id, a)
                }
                f.modal("hide")
            })
        }
    },
    cancel: function() {
        TS.ui.channel_create_dialog.div.modal("hide")
    },
    end: function() {
        TS.ui.channel_create_dialog.showing = TS.model.dialog_is_showing = false;
        $(window.document).unbind("keydown", TS.ui.channel_create_dialog.onKeydown)
    },
    build: function() {
        $("body").append('<div id="channel_create_dialog" class="modal hide fade"></div>');
        var a = TS.ui.channel_create_dialog.div = $("#channel_create_dialog");
        a.on("hide", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.channel_create_dialog.end()
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.channel_create_dialog.showing = TS.model.dialog_is_showing = true
        });
        a.on("shown", function(b) {
            if (b.target != this) {
                return
            }
            setTimeout(function() {
                a.find(".title_input").select();
                $(window.document).bind("keydown", TS.ui.channel_create_dialog.onKeydown)
            }, 100);
            TS.ui.channel_create_dialog.ladda = Ladda.create(a.find(".dialog_go")[0])
        })
    }
});
TS.registerModule("ui.list_browser_dialog", {
    which: null,
    div: null,
    showing: false,
    items: [],
    active_sort: "name",
    filtered_items: [],
    active_filter: "",
    onStart: function() {
        TS.channels.list_fetched_sig.add(TS.ui.list_browser_dialog.onChannelsListFetched, TS.ui.list_browser_dialog)
    },
    onChannelsListFetched: function() {
        if (!TS.ui.list_browser_dialog.showing) {
            return
        }
        if (TS.ui.list_browser_dialog.which != "channels") {
            return
        }
        TS.ui.list_browser_dialog.sortBy(TS.ui.list_browser_dialog.active_sort)
    },
    onKeydown: function(a) {
        if (a.which == TS.utility.keymap.esc) {
            TS.ui.list_browser_dialog.cancel()
        }
    },
    start: function(f) {
        if (TS.model.user.is_restricted) {
            return
        }
        if (TS.ui.checkForEditing()) {
            return
        }
        if (!TS.ui.list_browser_dialog.div) {
            TS.ui.list_browser_dialog.build()
        }
        var g = TS.ui.list_browser_dialog.div;
        TS.ui.list_browser_dialog.which = f;
        var c;
        if (f == "channels") {
            c = TS.channels.getChannelsForUser();
            TS.channels.fetchList()
        } else {
            TS.error("TS.ui.list_browser_dialog start called with bad which: " + f);
            return
        }
        $.each(c, function(h, i) {
            if (!i.is_archived) {
                TS.ui.list_browser_dialog.items.push(i)
            }
        });
        TS.ui.list_browser_dialog.sortBy(TS.ui.list_browser_dialog.active_sort);
        var d = TS.templates.list_browser_dialog({
            title: "Browse Channels",
            items: TS.ui.list_browser_dialog.items,
            active_sort: TS.ui.list_browser_dialog.active_sort
        });
        g.empty();
        g.html(d);
        TS.ui.list_browser_dialog.bindList();
        TS.ui.list_browser_dialog.div.find("#list_sort").bind("change.sortBy", function() {
            TS.ui.list_browser_dialog.sortBy($(this).val())
        });
        TS.ui.list_browser_dialog.div.find("#list_search").bind("textchange", function(i) {
            var h = $.trim($(this).val());
            if (h == "") {
                TS.ui.list_browser_dialog.clearFilter()
            } else {
                $("#list_search_container").addClass("active");
                if (h.indexOf("#") !== -1) {
                    h = h.replace("#", "", "g");
                    h = $.trim(h)
                }
                TS.ui.list_browser_dialog.filterBy(h)
            }
        });
        TS.ui.list_browser_dialog.div.find("#list_search_container .icon_close").bind("click.clearFilter", TS.ui.list_browser_dialog.clearFilter);
        TS.ui.list_browser_dialog.div.find(".new_channel_btn").bind("click", function() {
            TS.ui.list_browser_dialog.cancel();
            setTimeout(function() {
                TS.ui.channel_create_dialog.start()
            }, 500)
        });
        TS.ui.list_browser_dialog.div.find("#about_channels").bind("click", function(h) {
            h.preventDefault();
            TS.ui.list_browser_dialog.cancel();
            setTimeout(function() {
                TS.tip_card.start({
                    tip: TS.tips.getTipById("about_channels_tip_card")
                })
            }, 500)
        });
        var a = $("#list_browser");
        var b = TS.qs_args.debug_scroll == "1";
        a.monkeyScroll({
            debug: b
        });
        g.find(".dialog_cancel").click(TS.ui.list_browser_dialog.cancel);
        TS.kb_nav.start(a, "p");
        TS.kb_nav.setAllowHighlightWithoutBlurringInput(true);
        a.on("mouseenter", "h4", TS.kb_nav.clearHighlightedItem);
        g.modal("show")
    },
    cancel: function() {
        TS.ui.list_browser_dialog.div.modal("hide")
    },
    end: function() {
        TS.ui.list_browser_dialog.showing = TS.model.dialog_is_showing = false;
        $(window.document).unbind("keydown", TS.ui.list_browser_dialog.onKeydown);
        TS.ui.list_browser_dialog.items.length = 0;
        TS.ui.list_browser_dialog.active_filter = "";
        TS.kb_nav.end()
    },
    build: function() {
        $("body").append('<div id="list_browser_dialog" class="modal hide fade"></div>');
        var a = TS.ui.list_browser_dialog.div = $("#list_browser_dialog");
        a.on("hide", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.list_browser_dialog.end()
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.list_browser_dialog.showing = TS.model.dialog_is_showing = true
        });
        a.on("shown", function(b) {
            if (b.target != this) {
                return
            }
            setTimeout(function() {
                a.find("#list_search").select();
                $(window.document).bind("keydown", TS.ui.list_browser_dialog.onKeydown);
                TS.ui.updateClosestMonkeyScroller($("#list_browser"))
            }, 100)
        })
    },
    bindList: function() {
        TS.ui.list_browser_dialog.div.find(".item_open_link").on("click.open", function(c) {
            c.preventDefault();
            var a = $(this).data("item-id");
            if (a) {
                if (a.charAt(0) === "C") {
                    var b = TS.channels.getChannelById(a);
                    if (b.is_member) {
                        TS.channels.displayChannel(a)
                    } else {
                        TS.channels.join(b.name)
                    }
                } else {
                    if (a.charAt(0) === "G") {
                        TS.groups.displayGroup(a)
                    }
                }
            }
            TS.ui.list_browser_dialog.cancel()
        })
    },
    sortBy: function(f) {
        TS.ui.list_browser_dialog.active_sort = f;
        var b = TS.ui.list_browser_dialog.items;
        if (TS.ui.list_browser_dialog.active_filter) {
            b = TS.ui.list_browser_dialog.filtered_items
        }
        switch (f) {
            case "creator":
                b.sort(function(i, g) {
                    var h, j;
                    h = TS.members.getMemberById(i.creator);
                    j = TS.members.getMemberById(g.creator);
                    if (h && j) {
                        return (h._name_lc > j._name_lc) ? 1 : ((j._name_lc > h._name_lc) ? -1 : 0)
                    } else {
                        return 1
                    }
                });
                break;
            case "created":
                b.sort(function(h, g) {
                    return (h.created < g.created) ? 1 : ((g.created < h.created) ? -1 : 0)
                });
                break;
            case "members_high":
                b.sort(function(h, g) {
                    return (h.num_members < g.num_members) ? 1 : ((g.num_members < h.num_members) ? -1 : 0)
                });
                break;
            case "members_low":
                b.sort(function(h, g) {
                    return (h.num_members > g.num_members) ? 1 : ((g.num_members > h.num_members) ? -1 : 0)
                });
                break;
            case "name":
            default:
                b.sort(function(h, g) {
                    return (h._name_lc > g._name_lc) ? 1 : ((g._name_lc > h._name_lc) ? -1 : 0)
                });
                break
        }
        if (f == "name" && !TS.ui.list_browser_dialog.active_filter) {
            var d = [],
                c = [];
            $.each(b, function(g, h) {
                if (h.is_member) {
                    c.push(h)
                } else {
                    d.push(h)
                }
            });
            $("#list_browser").html(TS.templates.list_browser_items_by_membership({
                items_to_join: d,
                items_to_leave: c,
                active_sort: TS.ui.list_browser_dialog.active_sort
            }))
        } else {
            $("#list_browser").html(TS.templates.list_browser_items({
                items: b,
                active_sort: TS.ui.list_browser_dialog.active_sort
            }))
        }
        TS.ui.list_browser_dialog.bindList();
        TS.kb_nav.clearHighlightedItem();
        var a = $("#list_browser");
        TS.ui.updateClosestMonkeyScroller(a);
        a.scrollTop(0)
    },
    filterBy: function(c) {
        var b = new RegExp(c, "i"),
            a = $("#list_browser");
        TS.ui.list_browser_dialog.active_filter = c;
        TS.ui.list_browser_dialog.filtered_items = $.grep(TS.ui.list_browser_dialog.items, function(f, d) {
            return f.name.match(b)
        });
        if (TS.ui.list_browser_dialog.filtered_items.length > 0) {
            a.html(TS.templates.list_browser_items({
                items: TS.ui.list_browser_dialog.filtered_items,
                active_sort: TS.ui.list_browser_dialog.active_sort
            }));
            TS.ui.list_browser_dialog.bindList()
        } else {
            a.html('<div class="no_matches align-center large_top_margin large_bottom_margin subtle_silver">No matches found for <strong>' + TS.utility.htmlEntities(c) + "</strong>.</div>")
        }
        TS.kb_nav.clearHighlightedItem();
        TS.ui.updateClosestMonkeyScroller(a);
        a.scrollTop(0)
    },
    clearFilter: function() {
        TS.ui.list_browser_dialog.active_filter = "";
        TS.ui.list_browser_dialog.div.find("#list_search").val("");
        $("#list_search_container").removeClass("active");
        $("#list_browser").html(TS.templates.list_browser_items({
            items: TS.ui.list_browser_dialog.items,
            active_sort: TS.ui.list_browser_dialog.active_sort
        }));
        TS.ui.list_browser_dialog.sortBy(TS.ui.list_browser_dialog.active_sort);
        TS.kb_nav.clearHighlightedItem()
    }
});
TS.registerModule("ui.purpose_dialog", {
    div: null,
    showing: false,
    model_ob: null,
    onStart: function() {},
    onKeydown: function(a) {
        if (a.which == TS.utility.keymap.enter) {
            TS.ui.purpose_dialog.go();
            a.preventDefault()
        } else {
            if (a.which == TS.utility.keymap.esc) {
                TS.ui.purpose_dialog.cancel()
            }
        }
    },
    start: function(c, a) {
        if (TS.ui.checkForEditing()) {
            return
        }
        TS.ui.purpose_dialog.model_ob = a;
        TS.ui.purpose_dialog.is_group = TS.ui.purpose_dialog.model_ob.is_group;
        if (!TS.ui.purpose_dialog.div) {
            TS.ui.purpose_dialog.build()
        }
        var d = TS.ui.purpose_dialog.div;
        var b = TS.templates.purpose_dialog({
            model_ob: TS.ui.purpose_dialog.model_ob,
            is_group: TS.ui.purpose_dialog.is_group
        });
        d.empty();
        d.html(b);
        d.find(".dialog_cancel").click(TS.ui.purpose_dialog.cancel);
        d.find(".dialog_go").click(TS.ui.purpose_dialog.go);
        d.modal("show")
    },
    go: function() {
        if (!TS.ui.purpose_dialog.showing) {
            TS.error("not showing?");
            return
        }
        var b = TS.ui.purpose_dialog.div;
        var a = $.trim(b.find("#purpose_input").val());
        if (TS.ui.purpose_dialog.is_group) {
            TS.groups.setPurpose(TS.ui.purpose_dialog.model_ob.id, a)
        } else {
            TS.channels.setPurpose(TS.ui.purpose_dialog.model_ob.id, a)
        }
        b.modal("hide")
    },
    cancel: function() {
        TS.ui.purpose_dialog.div.modal("hide")
    },
    end: function() {
        TS.ui.purpose_dialog.showing = TS.model.dialog_is_showing = false;
        $(window.document).unbind("keydown", TS.ui.purpose_dialog.onKeydown)
    },
    build: function() {
        $("body").append('<div id="purpose_dialog" class="modal hide fade"></div>');
        var a = TS.ui.purpose_dialog.div = $("#purpose_dialog");
        a.on("hide", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.purpose_dialog.end()
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.purpose_dialog.showing = TS.model.dialog_is_showing = true
        });
        a.on("shown", function(b) {
            if (b.target != this) {
                return
            }
            setTimeout(function() {
                a.find("#purpose_input").select();
                $(window.document).bind("keydown", TS.ui.purpose_dialog.onKeydown)
            }, 100)
        })
    }
});
TS.registerModule("ui.growls", {
    is_fluid: false,
    is_macgap: false,
    no_notifications: false,
    original_document_title: null,
    permission_changed_sig: new signals.Signal(),
    onStart: function() {
        window.__ssbwinGrowlOnClick = TS.ui.growls.ssbwinGrowlOnClick;
        TS.channels.unread_changed_sig.add(TS.ui.growls.updateTotalUnreadDisplays, TS.ui.growls);
        TS.channels.unread_highlight_changed_sig.add(TS.ui.growls.updateTotalUnreadDisplays, TS.ui.growls);
        TS.groups.unread_changed_sig.add(TS.ui.growls.updateTotalUnreadDisplays, TS.ui.growls);
        TS.groups.unread_highlight_changed_sig.add(TS.ui.growls.updateTotalUnreadDisplays, TS.ui.growls);
        TS.ims.unread_changed_sig.add(TS.ui.growls.updateTotalUnreadDisplays, TS.ui.growls);
        TS.ims.unread_highlight_changed_sig.add(TS.ui.growls.updateTotalUnreadDisplays, TS.ui.growls);
        TS.client.login_sig.add(TS.ui.growls.updateTotalUnreadDisplays, TS.ui.growls);
        TS.prefs.mac_ssb_bullet_changed_sig.add(TS.ui.growls.updateTotalUnreadDisplays, TS.ui.growls);
        TS.ui.window_focus_changed_sig.add(TS.ui.growls.windowFocusChanged, TS.ui.growls);
        if (window.fluid) {
            TS.ui.growls.is_fluid = true
        } else {
            if (window.macgap) {
                TS.ui.growls.is_macgap = true
            } else {
                if (window.Notification || window.webkitNotifications) {} else {
                    if (window.winssb) {} else {
                        TS.ui.growls.no_notifications = true;
                        return
                    }
                }
            }
        }
        TS.channels.message_received_sig.add(TS.ui.growls.channelOrGroupMessageReceived, TS.ui.growls);
        TS.groups.message_received_sig.add(TS.ui.growls.channelOrGroupMessageReceived, TS.ui.growls);
        TS.ims.message_received_sig.add(TS.ui.growls.imMessageReceived, TS.ui.growls)
    },
    shouldShowPermissionButton: function() {
        if (TS.ui.growls.no_notifications) {
            return false
        }
        if (TS.ui.growls.checkPermission()) {
            return false
        }
        if (TS.ui.growls.getPermissionLevel() == "denied") {
            return false
        }
        return true
    },
    checkPermission: function() {
        if (TS.ui.growls.no_notifications) {
            return false
        }
        if (TS.ui.growls.is_fluid) {
            return true
        }
        if (TS.ui.growls.is_macgap) {
            return true
        }
        if (window.winssb) {
            return true
        }
        return TS.ui.growls.getPermissionLevel() === "granted"
    },
    perm_map: {
        "0": "granted",
        "1": "default",
        "2": "denied"
    },
    getPermissionLevel: function() {
        if (TS.ui.growls.no_notifications) {
            return "na"
        }
        if (TS.ui.growls.is_fluid) {
            return "na"
        }
        if (TS.ui.growls.is_macgap) {
            return "na"
        }
        if (window.winssb) {
            return "na"
        }
        if (window.webkitNotifications && window.webkitNotifications.checkPermission) {
            return TS.ui.growls.perm_map[window.webkitNotifications.checkPermission()]
        } else {
            if (window.Notification) {
                return window.Notification.permission
            }
        }
    },
    promptForPermission: function(b) {
        if (TS.ui.growls.no_notifications) {
            if (b) {
                b(false, -9999999)
            }
            return
        }
        var a = function() {
            if (b) {
                b(TS.ui.growls.checkPermission(), TS.ui.growls.getPermissionLevel())
            }
            TS.ui.growls.permission_changed_sig.dispatch(TS.ui.growls.checkPermission(), TS.ui.growls.getPermissionLevel())
        };
        if (window.webkitNotifications && window.webkitNotifications.requestPermission && window.webkitNotifications.checkPermission) {
            window.webkitNotifications.requestPermission(a)
        } else {
            if (window.Notification) {
                window.Notification.requestPermission(a)
            }
        }
    },
    ssbwinGrowlOnClick_map: {},
    ssbwinGrowlOnClick_index: 0,
    ssbwinGrowlOnClick: function(a) {
        if (!a) {
            TS.warn("ERROR: TS.ui.growls.ssbwinGrowlOnClick called with empty argument");
            return
        }
        if (!TS.ui.growls.ssbwinGrowlOnClick_map[a]) {
            TS.warn("ERROR: TS.ui.growls.ssbwinGrowlOnClick_map[" + a + "] is not defined");
            return
        }
        TS.info("typeof TS.ui.growls.ssbwinGrowlOnClick_map[" + a + "] = " + (typeof TS.ui.growls.ssbwinGrowlOnClick_map[a]));
        TS.info("calling TS.ui.growls.ssbwinGrowlOnClick_map[" + a + "]");
        TS.ui.growls.ssbwinGrowlOnClick_map[a]()
    },
    show: function(k, h, n, l, b, c, m) {
        if (!TS.ui.growls.checkPermission()) {
            return
        }
        l = false;
        if (TS.ui.growls.is_fluid) {
            var j = {
                title: k,
                description: h,
                priority: 1,
                sticky: !!l,
                icon: TS.boot_data.img.app_icon
            };
            if (window.ssbwin && n) {
                var g = "onclick_" + (TS.ui.growls.ssbwinGrowlOnClick_index++);
                TS.ui.growls.ssbwinGrowlOnClick_map[g] = n;
                j.onclick = "__ssbwinGrowlOnClick";
                j.onclick_arg = g
            }
            window.fluid.showGrowlNotification(j)
        } else {
            if (window.winssb) {
                var j = {
                    title: k,
                    content: h,
                    forceShow: b,
                    channel: m || ""
                };
                if (n) {
                    var g = "onclick_" + (TS.ui.growls.ssbwinGrowlOnClick_index++);
                    TS.ui.growls.ssbwinGrowlOnClick_map[g] = n;
                    j.onclick = "__ssbwinGrowlOnClick";
                    j.onclick_arg = g
                }
                TSSSB.call("notify", null, j)
            } else {
                if (TS.ui.growls.is_macgap) {
                    var i = function(o) {
                        window.focus();
                        if (n) {
                            n()
                        }
                    };
                    if (window.macgap.growl) {
                        window.macgap.growl.notify({
                            title: k,
                            content: h,
                            onclick: i
                        })
                    } else {
                        if (window.macgap.notice) {
                            TSSSB.call("notify", null, {
                                title: k,
                                content: h,
                                onclick: i,
                                forceShow: b,
                                channel: m || ""
                            })
                        } else {}
                    }
                } else {
                    var f;
                    if (window.webkitNotifications) {
                        f = window.webkitNotifications.createNotification(TS.boot_data.img.app_icon, k, h)
                    } else {
                        if (window.Notification) {
                            f = new Notification(k, {
                                body: h,
                                icon: TS.boot_data.img.app_icon,
                                tag: "tag_" + (c ? c.id || c.ts || new Date().getTime() : new Date().getTime())
                            })
                        }
                    } if (!f) {
                        return
                    }
                    try {
                        f.onclick = function() {
                            window.focus();
                            if (n) {
                                n()
                            }
                            if (this.cancel) {
                                this.cancel()
                            } else {
                                if (this.close) {
                                    this.close()
                                }
                            }
                        }
                    } catch (d) {}

                    function a() {
                        setTimeout(function() {
                            if (f.cancel) {
                                f.cancel()
                            } else {
                                if (f.close) {
                                    f.close()
                                }
                            }
                        }, (h && h.length > 80 ? 10000 : 5000))
                    }
                    if (!l) {
                        if (f) {
                            try {
                                f.onshow = a;
                                setTimeout(a, 1000)
                            } catch (d) {
                                a()
                            }
                        }
                    }
                    if (f.show) {
                        f.show()
                    }
                }
            }
        }
    },
    textContainsHighlightWord: function(a) {
        if (!a) {
            return
        }
        if (TS.utility.msgs.getHighlightWordsRegex().test(a)) {
            return true
        }
        return false
    },
    updateTotalUnreadDisplays: function() {
        if (window.macgap || window.winssb) {
            TSSSB.call("setBadgeCount", null, {
                all_unread_highlights_cnt: TS.model.all_unread_highlights_cnt,
                all_unread_cnt: TS.model.all_unread_cnt,
                bullet: (window.macgap) ? !!TS.model.prefs.mac_ssb_bullet : !!TS.model.prefs.win_ssb_bullet
            })
        }
        if (window.fluid) {
            if (TS.model.all_unread_highlights_cnt + TS.model.all_unread_cnt) {
                var a = TS.model.all_unread_highlights_cnt;
                if (a > 9) {
                    a = "9+"
                }
                if (!a) {
                    a = (TS.model.prefs.mac_ssb_bullet) ? "â€?:"
                    "
}if(window.fluid){window.fluid.dockBadge=a.toString()
}}else{if(window.fluid){window.fluid.dockBadge="
                    "
}}}if(TS.model.all_unread_highlights_cnt){TS.view.changeUnreadStatus("
                    mentions ")
}else{if(TS.model.all_unread_cnt){TS.view.changeUnreadStatus("
                    unreads ")
}else{TS.view.changeUnreadStatus("
                    ")
}}},getGrowlableTxtFromAttachments:function(a){for(var b=0;
b<a.length;
b++){var c=a[b];
if(c.fallback){return c.fallback
}else{if(c.text){return c.text
}else{if(c.pretext){return c.pretext
}else{if(c.footer){return c.footer
}}}}}return null
},no_growl_subtypes:["
                    channel_leave ","
                    channel_join ","
                    group_leave ","
                    group_join "],channelOrGroupMessageReceived:function(a,b){if(!b){TS.error("
                    no msg ? ");
return
}if(b.no_display){return
}if(!a){TS.error("
                    no channel / group ? ");
return
}TS.ui.growls.growlchannelOrGroupMessage(a,b)
},growlchannelOrGroupMessage:function(m,f){if(!f){TS.error("
                    no msg ? ");
return
}if(f.no_display){return
}if(!m){TS.error("
                    no channel / group ? ");
return
}var b=TS.channels.canChannelOrGroupHaveChannelMentions(m.id);
var c;
var g;
if(b){c=TS.utility.msgs.msgContainsMention(f);
if(c){TS.mentions.maybeUpdateMentions()
}}else{g=TS.utility.msgs.getMsgMentionData(f);
c=g.non_channel_mentions;
if(g.mentions){TS.mentions.maybeUpdateMentions()
}}if(f.subtype&&TS.ui.growls.no_growl_subtypes.indexOf(f.subtype)!=-1){return
}var q=TS.utility.msgs.msgCanCountAsUnread(f);
var n=q&&c;
var d=m.is_channel;
var j=TS.ui.growls.containsCmd(f.text);
TS.log(66,"
                    qualifies_as_mention: "+n);
TS.log(66,"
                    is_unread: "+q);
TS.log(66,"
                    contains_mention: "+c);
TS.log(66,"
                    TS.utility.msgs.getHighlightWordsRegex(): "+TS.utility.msgs.getHighlightWordsRegex());
TS.log(66,"
                    msg.text: "+f.text);
var k=TS.utility.msgs.getChannelOrGroupNotifySettingBasedOnLoudness(m.id);
TS.log(66,"
                    setting: "+k);
if(f.subtype=="
                    bot_message "&&k!="
                    everything "&&!j&&!TS.model.you_regex.test(f.text)){return
}if(q&&!TS.ui.window_focused){if(!TS.ui.growls.original_document_title){TS.ui.growls.original_document_title=document.title
}if(n&&document.title.indexOf("!")==-1){document.title="!"+document.title
}else{if(document.title.indexOf(" * ")==-1){document.title=" * "+document.title
}}}if(k=="
                    nothing "){return
}if(!TS.ui.growls.checkPermission()){return
}var l=(m.id==TS.model.active_channel_id||m.id==TS.model.active_group_id);
var o=false;
if(n){o=true
}if(k=="
                    everything "){o=true
}if(l&&TS.ui.window_focused&&!j){o=false
}if(!b&&g&&g.mentions&&!g.non_channel_mentions){o=false
}if(f.user==TS.model.user.id||(f.comment&&f.comment.user==TS.model.user.id)){o=false
}if(!o){return
}var a=TS.members.getMemberById(f.user);
from_name=(((a)?TS.members.getMemberDisplayName(a):f.user)||TS.templates.builders.getBotName(f))||"
                    ";
var s=function(){if(d){TS.channels.displayChannel(m.id)
}else{TS.groups.displayGroup(m.id)
}};
var r=f.type+"
                    "+f.subtype+" (message missing text)
                    ";
if(f.text){r=f.text
}else{if(f.attachments&&f.attachments.length){r=TS.ui.growls.getGrowlableTxtFromAttachments(f.attachments)||r
}}var i=(from_name?from_name+": ":"
                    ")+r;
TS.ui.playSound("
                    new_message ");
TS.ui.growls.maybeBounceDockIcon();
var p=n&&a&&!TS.ui.window_focused;
TS.ui.growls.show("
                    New message in #"+m.name+"
                    ",TS.format.formatMsg(i,null,false,true),s,p,true,f,m.id);
if(TS.model.prefs.speak_growls){var h="
                    New message in "+(d?"
                    channel ":"
                    group ")+' "
                    '+m.name+'
                    " from "
                    '+from_name+'
                    ": '+TS.format.formatMsg(r,null,false,true);
TS.ui.growls.speak(h)
}},voices:null,speakQ:[],speak:function(g,b,k,d){if(!window.macgap||!macgap.app||!macgap.app.speakStringWithVoiceAndRateAndCallback){return
}var j=TS.ui.growls.voices=TS.ui.growls.voices||macgap.app.availableVoices();
var h=TS.ui.growls.speakQ;
var c={txt:g||"
                    no text ? ? ",voice:k||TS.utility.randomFromArray(j),speed:d||TS.utility.randomInt(100,300),asap:b||false};
if(b&&h.length){var a;
for(var f=h.length-1;
f>-1;
f--){a=h[f];
if(a.asap||f==0){h.splice(f+1,0,c);
break
}}}else{h.push(c)
}if(h.length==1){TS.ui.growls._speakNext()
}},_speakNext:function(){if(!TS.ui.growls.speakQ.length){return
}var a=TS.ui.growls.speakQ[0];
if(a.speaking){return
}a.speaking=true;
macgap.app.speakStringWithVoiceAndRateAndCallback(a.txt,a.voice,a.speed,function(){setTimeout(function(){TS.ui.growls.speakQ.shift();
TS.ui.growls._speakNext()
},100)
})
},imMessageReceived:function(a,b){if(!b){TS.error("
                    no msg ? ");
return
}if(b.no_display){return
}TS.ui.growls.growlImMessage(a,b)
},growlImMessage:function(g,c){if(!c){TS.error("
                    no msg ? ");
return
}if(c.no_display){return
}if(!TS.ui.window_focused&&document.title.indexOf("!")==-1){if(!TS.ui.growls.original_document_title){TS.ui.growls.original_document_title=document.title
}document.title="!"+document.title
}if(!TS.model.prefs.growls_enabled){return
}if(!TS.ui.growls.checkPermission()){return
}var f=false;
if(g.id!=TS.model.active_im_id||!TS.ui.window_focused){f=true
}if(c.user==TS.model.user.id||(c.comment&&c.comment.user==TS.model.user.id)){f=false
}var j=TS.templates.builders.getBotName(c);
var i=TS.ui.growls.containsCmd(c.text);
if(c.subtype=="
                    bot_message "&&!i&&!TS.model.you_regex.test(c.text)){f=false
}if(!f){return
}var k=function(){TS.ims.startImByMemberId(g.user)
};
var b=c.type+"
                    "+c.subtype+" (message missing text)
                    ";
if(c.text){b=c.text
}else{if(c.attachments&&c.attachments.length){b=TS.ui.growls.getGrowlableTxtFromAttachments(c.attachments)||b
}}TS.ui.playSound("
                    new_message ");
var d=j||TS.ims.getDisplayNameOfUserForIm(g);
TS.ui.growls.maybeBounceDockIcon();
var a=!TS.ui.window_focused;
TS.ui.growls.show("
                    New message from "+d+"
                    ",TS.format.formatMsg(b,null,false,true),k,a,true,c,g.id);
if(TS.model.prefs.speak_growls){var h='New DM message from "
                    '+d+'
                    ": '+TS.format.formatMsg(b,null,false,true);
TS.ui.growls.speak(h)
}},containsCmd:function(a){var b=a&&TS.model.everyone_regex.test(a);
var d=a&&TS.model.channel_regex.test(a);
var c=a&&TS.model.group_regex.test(a);
return(b||d||c)
},windowFocusChanged:function(a){if(a&&TS.ui.growls.original_document_title){document.title=TS.ui.growls.original_document_title;
TS.ui.growls.original_document_title=null
}if(!a&&TS.model.all_unread_highlights_cnt&&TS.model.prefs&&TS.model.prefs.mac_ssb_bounce=="
                    long "){setTimeout(TS.ui.growls.maybeBounceDockIcon,100)
}},maybeBounceDockIcon:function(){if(!window.macgap){return
}if(!window.macgap.dock){return
}if(!TS.model.prefs.mac_ssb_bounce){return
}if(TS.model.prefs.mac_ssb_bounce=="
                    long "){if(window.macgap.dock.bounceIndefinitely){window.macgap.dock.bounceIndefinitely()
}}else{if(window.macgap.dock.bounceOnce){window.macgap.dock.bounceOnce()
}}}});
(function(){TS.registerModule("
                    ui ",{emoticon_groups:[],emoji_names:[],data_urls:{connection_icon_trouble:"
                    data : image / png;
                    base64, iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAF50lEQVR4AcWXX4icVxnGf + /5zvzbndlkk520sQnV7ppiMUsNFosXRYm2eiPY3kmvihSxJVAVCv65EFF6KbbWgoJ/ciH0qupFvVHSIhpRWq00sW2W3Ro1abKb3c1Mdmfm + 877ejJzMDOzi7sRwRd++5xv9sx5nvMe9tvv4 / 9dwk2WmbkdvmeA3syCuyWLyC7nujSfnfDsXJIIAEAdNqfpFhMI0gPKAIahfoNaexVoA0DTAZb4rzrgbozXpi3P7zez70XORvKIRkLSXuT1yHfN8uNmq3sjREbWGec / mQ + 1O / 9o1BcjA7 / eqll3xayzHHU5abzOV1Oefv3CLL8vwoDtj6 //4TblAAUqqH4B574M1HXzn2xc/B3dCz+1sHHKRFdwqcmWNckmPiKVg5+R6oF7cbVbAa4C34Az3wF6cFdaF1KlANube+Ap4IvQpfX2KdrnnrJi4xTOO3HO4cQQCYBgJqgpWmB+4mNMzj0p9cP3AWXSOl8BdGj9bQMIYACq+lg0eYZ8jctnTmpr4YTL/F5cNo04jxOJCoIBYKTj1AItLqG6QWP2Wd33vocdWQMIjwLfB4As+WwNkNIVHwb/AnSbl/70A1t763Hx5VkyV0ZcQChwzkAMAYCUWlDzGB7VDkVvkb1HnrOZo48IlC5C/ingD1BKPuC2mtMAfwJoXl36DesLjyN+FqiglqOqg3ZrJDhCQq9jgpmimmPUkOzdrJ/7HK3zvwW4FUonIhNDR4FjvIriGPBp7ayw8sYzVoQ9YlYlLhoRzCBqom8aSWOVFIIUYoIiTMiVN541660BPFgUm3dHABgOIICytFTF+weAcuud19i48gLIzGBXNmQ+riPjgVpfDbglrvM87Xf+AjDhfe0B7xfLcEYBGQ4A+/fXgaPkLdaWfoZaQ4xyaitptxD+vWtGMUm/48ZxUCUS1/s5VrQBjq6v1ycjAOJHApRKDeADGgo2Vl41qIpZRjDFycBERCKgYltO0DDoG5MwDIdpRa5dec1QFeDYnnJzElgdDgBAzxXVMtymqnTaL5vLDgoqfVNNKcUMEUAEYbQMgWRuSF/pB8jotV8xzAQ43HW9CkCFGp6RMgMMEFUYbHsg5gRnYAKSpsrY3cMAkjEmKEn1OgUGCATASOXH7A0ogJJzNSydtRlI+rb00ySjlAAbVU0/1MAYaJZNk6YXFasYAOOHWLFSBzjvXEa5cVxCCOkcB0GCRg1EBd2GMCDNSeHNIsT1jgniAM5v2rVeZCSAAdDrtYBXnffU9t0tqpumajf+/g1CamnSUWxIDTCHqqKhZ7V984JzAK/UOq4dAbDRAFNTV4CX8HVm3vsQ2Doh5Kj6oZtM0tRi1YSBKWlOCqwZGrpAi5m5BxE/CXCK6en1yJYADoDetZeAC1MHjrD30GOEfGno1iuEQGr39XH6PI1Df0yak/Wvi3yBPYefoH5gDuA8vfbLEQA3HADAAChPnkX5CX6Cg/OPSql6i4XiKmZlIJmNmI+HAFWHWYlQrFKuHbF3zX9WcFWAH1GuvxVJfjAewAF5N+/+EPjj1MF5Dt3zHGaLVuRrBM0wPNY3SMdhREjXDqyMkVHkK8Df7NA9T8fd3wVwutvt/jhSAG7rv+OxKoriE97754HGhbO/tLdPf55e56Jk/jAiZZAMEGTkLhgw6xKKRSoTs3b7vU9z650fF2ANioeAXzNWYpYzWn74ieUR4NtAo33pr/z9zyft8sK3wGYw8SLY2OtFbiIrNOe+xm3zD0u9eYSBOSeAkwA7PRGxdVJxP/hvAh9Eu7QuLXB54UVal1+n6KwgzmMaKNX202i+n+bsJ6k37wBXBjgdO/lV4FcA3o9sDoBdPpJvvifqk5FzEdP8moXuVSs665boX2uxYaneDCF8KX7v9ggDzO30VLxDJ77uut0n7qhUpj4EHAfmxm7lBfDmYLfd30NlETBg/IbNTk/FOwQBlpcbVKtVQNpAPRksd/7RAVqkmpm50wH6v3o3lNRGdoHb7Xtkf9JNluzi7djYZf0LQppd/ul0XC8AAAAASUVORK5CYII=",connection_icon_online:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABmFBMVEUAAAD////////////////////////////////////2+/LR5bKw1Hmfy1KUxz2VyD2izVKz1nnS5rP////A3JuOw0qKwkCNxD+QxT6Sxj6Txz6SxUnC3Jv1+fGXx2GDvkCGwECIwUCLwj+PxD6PxT+JwUCFwECZyGD2+vGSxWF9vEGAvkGDv0CMwz+Wx2GPw2F4ukJ7u0J+vUGBvkGHwUB8u0KSxGG31pp0uEN3uUJ5u0KFv0CCv0B6u0K415p5uU1yt0N/vUF1uEN8u0zG3bFttURwtkR5ukLH3rGWxnlqtERutUR2uUOZx3l6uVZos0VvtkRxt0Nzt0N8ulVisUVlskVns0VzuENmskVfsEVps0VztlZer0VhsEVjsUVstER1t1aOwXhcrkZdr0VgsEaQwnm/2a9YrUZbrka/2rDz+PFhr09XrEZksE6pzplUq0ZVrEZarUaqzpl0tWJRq0dWrEZ1tmJztWJOqUdSq0dxtGJMqEdNqUdQqkdytWKmzJhXrFBKqEdZrU+716+GvXhjr1dIp0hkr1dYtVOVAAAAFHRSTlMAV8/v/wCH+x/n////////////9kvBHZAAAAG7SURBVHgBvdOxjtNAEIDhGe/MZO3sxVaiIJkiSNdQUPJOeQlqXoCCIg/EU9BQHRKg5CT7ErzrHTa+aBOqaxC/tdLK+2kbj+H/hoWhlCmQr0HeyYxyM8mvkWHKoAfBS6cBWEeYugAzf4QGp1SV8DvU/ZjBdN7iud6hdnOTdl+TuALyrUPEwfdu3nc1ipr9AwdIFZPysJylRDfa6cZL2rfgMd9QjO8R0Y+/u7sa4LHZz4wN/MXEyw1hbK1VZdV7PZ1OyufzktsxXADCW5EkXq06Paan02Uoo3kHmAEzJ8HBN6v5qlkqaxTmCdAzQK8Noi6rXwCrJyutepUMAARnXS++3cvm2xvftR0PzAyQAXtwdNChifvFHppBdR003IDCIg6JDOse4DX8WIdo1TwfpaUgqWC9c4eqqg5HF20QZdAMmDlasdHWkrKR03J0A4iIXRTrpba29laiY8YMyOyMKYkXroyROZZuwVTyztAFJPmZKBGq+FxFVBr5BHr7ubd3GICfAM+88qDHHYe/BmbbIAaGKU/Fz10emDxyHxBhgJTg+DGP3O3QbltMBkd92F2H9sWxB772wo9z2z8FfwDHWbdKLDfq1AAAAABJRU5ErkJggg==",connection_icon_offline:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAF30lEQVR42tWXW2xUVRSGT8EihUojBUJvM9POTC+gBg3GF2PUKEQwUaI+CDEkGhIfeDL6LImx+iDEK1BoS8t0KL1RaEtbC4W29CISEEqRB7AYIFp770w77XTmnN9/DWc37WR0SMEHV/LlzD5n7bX+vc7e++zR/ncGYAFZGAnzWcx/mTjmvn3JQ0kcnhT9/fHw+dKmPJ4sv8eTHcLvz54aG3NiYiIJuLU4iuj5JZfgQX/wDQB7yXUSIAbRiZiXdJEvA4HA8wDiZwuZd3IAjwaDwbcAnCVA0I/gyBCmh8jg4AwBtnXPCEybJG5MT6+PIiJq8iXkCxIk8N3pxe3yfFzcst7oTI7V2zVN7yId5HzOcqNn5xb0t9RTUJ8S0otgcGu4iOjJ1bsGviIwfF78XldptGZqRpOmGWcWLEfrokSci1uJ9sWE17bYFWjRlqGZz8+/vtb463y7EuFhBT8Iix915LG6rn8GWmC4D927d+kneLsxIQWnLE40O9agxbkGrZlr0WbSyvZZew6aUx34UXscjRTSW1NhzBLxTlQRyoJ+/5vSyZj04vLuXUY1+9RbnWh05qApIxOnrA40s30mjGabE6ftWWjKXIP6RCvq2K+3rlKJ6JHVEvFVqJtqtqsJd5Ody3mrhqM+6cimCDsarRwhERGnmXQ2TeYz8WnIWova+BTUsBIDly9ATNeRi2vXFkWsgrphLjV4b//GxJpRtSwJxx3Z/G1HHamX4EQJUcwkJiet9CU1jhxUMXT7h1sM3TcO2l3uH5nhVVANNfH2IuDH9SN5KNUoIM2O6nQHjjO5iKglTCBClBjhXtsiyelj+h7n66hKTEYF4wz2/AKxILAtfNDyY6FcJ4eHLbLJ+IeH0LDxCeOotgSVGQxiycAxIiJOKCEmMlJBtWtMH/E9ZrOjkqLKKOBS7kcITnhAKxwYGHhMDXyOANleAQR8Q4M4ulTTS7U4lHMUFWnpqEq7J6JaCYmASlxtChbhFZy0rCSatm7AtGcUtDav17syogDZ1wEYE9zZirm5uGPiUObIQhkFKBGhaqSJEIVdUG15FvKrJNJHBuBmitqN6+EfHQGtkwJW/ZsAXQQUUUAJK1Bq5wgYSESUixAJblI1h/SZ++Xib1JKAS5ZSZueg38sJKDD29cXWYCsU9DGKSCfAoq1xSihAHeqDUcY7KigxCjMhIoy00dESx83XwGriepXnsHUvQp04Z8qEPqkAl6ZA64UzSjUYnGYAVwUUELcEnSOGBuZ+5vPxIei01HCe650Jw4xRcN7r6k50ASPJ1EJiLQJdflHh9GwfSOrEIMimwPFDHSYQWeEKESMEHZPfFyCNQPFyVappnG16BsYUz7Q9uDOnbg5y1D9kMOEfM8Jbp6qxX52LFidhiIGKkq1ojjVRqwSPCKHBfEjRQL3j8IliSh6RNNHbt2AaZtVzohbsXmYmJzo/xPlLyQZ+7VFKOA8KEixoDDFikOCSiDJTFRbnolPocWGApsTexm6I/cTw/BPgnbFNzSUql57RAEA4omb4FbXOexjFfYnrEa+IxP5FJGfbKEYK2GSMESkkJ9mo3+WVBDupzR9+OZ1mLYjfBeMKGKaJxkAvQTd1WXGD3y0j9/8AxlOHLTZmcAqYkIcNAm1OeqD6XYc4LyRkRev0IzbFzpV8rrZ6z/qGTDIkwwAD2Dg6olyQ+bDdyIkYQXyuPTymEQEHUgncmU7L8mCfUsT8S39XE9q+qzk3dPT4+uingXC1QF4n4wR3L30M2q2bxIRCnxP1JVIYiOPtH7+sTF049eZ5OC8Ch/kfYuQkwyAHoLAxDj+6L6Elk93ouLtl+F66WmUvPosXC+uQ9W7G3Cx8GsM996ATDhVdr7OdVGSRxchO6QO5EohQkLGPZgaG8UkdzaFtHWuc9OukB3yzueVPFInOcnIYQLANlJI2kgn6SA/kSayh2xWS03FeOA/J+GzVr7n8kklq7zevlXgVbZXtcNFO4Y/uJDofgvDR/3QhURiPkn/Bo/wqzC0qdolAAAAAElFTkSuQmCC",connection_icon_online_away:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFb0lEQVR42u2Xe0xTVxzH2ZZlWfxvW2YW98f+2OaiidmmZlaglEefvBRE2RwjguJijKJxDpzipjiGL0Kckc2Z4OJmKW15WoRKsSqi+CA+shUqMnUOfJRy21IotOe7323aIGmujG2JW+Iv+eTe3nPu+X1/v3N+556GPbX/hQF4JnB9jVhNHCF+w5iNEBbiIJFATAm+9285foUoIVx4jDHGELBuIod48W8LAfBs4BpJdAd9/MF1otlagp86srC/TYxv2yLwfXsc9NfW4mzPIXBD9/CIGYjXg+NNKmrevF5vFguE1ee8wSqvbEKxORy7T0tQ0hqF0lYx9rX58d/vPSNGCV2NXfsw6LGzQFbuABAJixBOezLhZfCi446RFZtl+KpFjCJzNHaaJSQiKuAwivA79z/beSoa200iHGjLwN2BzuCc9BDTA+M+J+g82Mh3DryES7eNLN/4LgqaJSQgBjtaJPjmpIQcRWEXQU4DjiUoJmFfU1vhyRhsNUXQbzm73W8Bbz741ABeGsuEYOR9UwDsJXDLZsEXRhHLaxJjy4lYbG2OxjZTNApbyJGZhDxCUdA5tVEfEhCLvCYR9rVmM8ewDbx5vZ60CaP3eDwzALjdoxx+OJ/Hcg3zaKBYEhKLzSdi/INrO3ag514n7JwbtgEHHtj78cvv7TjcvoEyNYd37hecb4zGuob3YLZqAIwSaHa5XFPHshA6788TmwlY+i5jZf0stq5Bgs8bZdjYyEcWh3M3jOAcw3g4wPmdj2cAx68fJsHTsckoRX6TlASEY1NTHOMCWRgdHY0J+gwpOZfr3lRe5ZDXhUPnC/Bp3TwaQIrPjiuQa5iGpusaOJwe2EKd++kfcKLX1oefL+7BGsM0Eq6k96Ox6thcdrq7Cj6MgKzQarW+EBQxLv3cMPcWQAF67KR6AcupC8d6gwor6mZgf2s+bvZ1UdoHeWeCDDiGcOFmC1VCKomIxPoGuT+Q8gvbMewdBFmjw+F4ORj4OAEOj+MdAMw+ZENG1Wzf8tpIrDUkIrMmDLrL5RT9cMCRMP2cC7fv9+BA6xZk176JdYZ4rKgVociUjcERB8jOOp3OV8cJCN6MjAzOBcD63TZ8qJ/ty66Jwqp6FVZSBhquaUIECMH3O9JehvSqMH8Ay2pEKGyepIDFutm+zGoxOVdhee1MGK5OTsCP58uQqgvD6mNJyKyej20nQgQITwEvIEU7x7e0Soyc2iQka8NQcbEczr8gwE5TcIumoPRUAZbop9P8J2Cpfj6+NGbDJSAgZBFyw3asqU9hS3SRyK6JR4puFnafzEd3b+eEi5CjRdhmNWFDQyoyqqOQVaOkbM5HWes2oUUYWobuUSdKTxdgQWU4PtbL8UmVCmm6N1B3pRLOx5Uh56Iy7MXBs3tI9NvIqo6n6OMomyJmtOjhZaFlKLgRXb17CfKK91maNpYGUSJdJ0VOjQxmi5HmWHgj0l46TBHPpCpS+knVRmFZtZQqS2AjEtqKXSMcdrXksYSKCCzWykkAjwyZeinKzhSi666Faj64FdvR0XMOxaYNlKkIEqzARzo5vSeFquID1F9Twye8FQt/jG7ct2CRVsySNbE0mAJpWhmWBCEx6eOhZ2PtfP8kjRgbG7KY3S34MZr4c2y2NjGZeh6SNTKkVCqwsFKOVGJRpYwEjbGIoGd8G/VTIpFE09phfBC8+XwCn+OJDiSUOhLRyNK1KigrpEiqUJAYORYIooBcHUNVlIHuB4IHkskfyXoedrEiUz4U6jio1ArEq+VIeIREQkUspEyVnysF5+4XOJL9s0MppfRXHGzbjdz6FeRQCdlRmg5NIrY05uLoxe/wwNEreCh9osfyJ/fH5Kn91+1P0yiqwz6mfpkAAAAASUVORK5CYII=",app_icon_32px_green:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2lJREFUeNqMVk1vGkEMndmu4MLmkOWQoCqkh0APqAdUVNpKiXLux/+tFKlSDlEitcm15RI4BBBiucCFjdDUs571eL1L1EEC450d28/P9ujvH7+qbBljFFtaa9SgAN9ij9Xnb/LNdBrKIUn0rNKGKi1vvkpPQqi0syYiIBvlN7lt2kM7C6ErE2gr6BfcpCXO4mg4AURlCg6ZHCIrGuk1Kckp/q20P13u1NknW4E7VMkAreE8ONTLEA0Lpep0jDvgSReZIGRQbkSNuBnT0+ggOowP0X3uB0cC1qvu6453Te8lT3/Qv7i8SLfpbDrDN4efh4MPg91ut1gsMBprqYSEY1EledA1fNo+bcN3kiS0HzVgz7pMwGrJhRBs5glS+EuVQbkDZKIoAmHyOEEP2m/s6WmaJsnKRZ5XoijJkIrAWtKG8sP5dNw6ds46Puhmswni+HFsmclKnZe9M0BmiXD4uFavdbod3ERC713PRZDhA2GhJlkmmBuOj0vkt+EXbhl5BnY6bzvDT0P1f+v25nb0Z8SZ6rikMwO51gcGf8G7xkEDNtRqtfPLc1Be/7zebreYkv77PghXP65g5ypZWT3RP3ufjIWeOb6A7LPNZrNerymfIE/GE4wSKgAZNX2aenIrhwF5jzZCOpg3Ly4jf1bIlozsWF+zpxmxQ+liN81UWBaBMrIjOhpoZwkpBGl0hW0U1vNmvXGFooycHMbHFJY7OO4jwqAB6BOkieMYM9GrW818Oge4CuzUDCIqcW4GDsU00iKm0jrrnqFw/+t+uVxyHhZA9jRlZuAvOg5wgyXI8N3NHb55cnoCxgCxh98P6A1gBR/uIkc7LGQ4xx0WFA4lAEAAwuA76Ph85jR82ogJmje7whD37RBfOGodYYaJ4GgSMKFZW25BHiiVzwMaOx47KLF6DfPpupAxkFioO99Eiye6GhYRFEZYcdi2Wi0sMYCYJwYCek6fOdC+GRt5zQmlC8wSdGNgiG3RxlX46O8ITfojlBHDkuLwzU7cscr1LLqhd5y3hfK8Iogq7lLZ8jZK9zU+9co3KK4P+LnCca9nG8T9RedLXBL8tUUMIGwvojXtc99dthiqLnoWViADNHvvAGL2uROVFtcykZjwhZdFcAJc6TjbwTEM3QAq3lP40VSThRxU3U0rgf0nwADpJQebhAz3/AAAAABJRU5ErkJggg==",app_icon_32px_green_unreads:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4JJREFUeNqMVj1MFEEUntlsx1FzQgmXnI13JGA0XIWJmvgTEzAxBhXbw0Rjg4VWamFLIjWGUkwgFoIFNkAhJN5VHGEpMVBz1OPbfW/evJldyc1d9t7Nzrzf7/3o+9fvqmwZY5RYWmvcQQKewZl0396Uh5kb0jFT/K5QhsotJ75on4lYaZIWWMAy8jelbD7DJz3TlYl0SugL1OQV8JLeIAJIZTyFjHVRSppQa95kpeRTacc9PKmzT7YiYqpCA1PB1jjcD000wpQi7mh3JIMeRII9k8eYp4oyUg/pCVix5zJdAFAg+kp98x/f1Mbr3bPu45uPkN3aznd4tndb716+ZT+z7nw3QhTltaMLGa+JGw3gjuzw/JWxGp7s6y+lKiM7Gwp2XWoByLQBUvjLmcEXRqojyK4FArIzvNPea1G8tZZ3WemYzUklaWejxFNtrE7sMgvg05hskMjfLSVSXaY9CQhcJiMGXAYGB4AoD5VxZ2KygRYPWwtGqpVKtQI735ZXgiyhQN67dkdKplAbNf3k4dPmM9XbSjrJ6+evJFIJSzrLA7trI5N5CXXvcW1vbiltPSrSIs0VsCBwnKEkpUjMzb+49eA2EIufPq+v/oBjUzPTaNyXxSXwDOqbL7pUTW0KK1m8JM3uTg4SxG5tnDB6+veUqoBWQT5hqOAZKRNWRFIkMxlSjBGZ7B8i2J3IziGKDDsHwT79G+crOPG9XIG/jnsnwVwr9Zfgi5vloUvwPeokkOEeOrVIWOhoaIvMZ+D1fuFDjxHm+uFSSjg5MlzDtSvUAO3eIXRyfBIEkksnJZos8Sh8ZfkrhBSI2eYsehwAc3RwBMTUzBT6CvDT3mvDmfOzrqxCxu+Asd/EDQOitftHxnNjdb3bPYdLzfk5wv6vrWQ/8Qq1bNS2vsZeERWRAHq4OsxOAEdjhMuDZQuqpKCRcA5bvMZeC/ObbX181CuZWtevjrqq52tNrHMZF8ms81ouVIuhAcYoZjjXD6jbdIUbgHEhlO06LmxhqALwPTleAv9AqcFXP9c20Hs7m9uyqJFOHGqR2Ronu8KZR3g21bZwCAumIzEREPqjoDbJHHH7/3EjR5hfSYy4RPPGN+VyJGh+8qScnaQRqB/PWPA3Cg00xTOAlOFxVDoYyyRS0yBfcDkwzjk3531vBDZezYjxV1nMkY2y//DMI2NQNJsWOvafAAMAxE3MJSrFyPAAAAAASUVORK5CYII=",app_icon_32px_green_mentions:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABExJREFUeNqkVktsG0UYnpl9OF6/4JDYaWirNrFIgTbvNEilByS4FHogQeJQoCcOidQjiF6LBGcEnIs4cABBKZeUQw+IQkUicFDVJo0TJ0gtSW2paWLHr90d/t2ZnZ11TBubie3Mzu7+3//9b3z2xdeQuyilKLhMy6yb8KmVq+VLPT0j0RhqfakgF2MMO/YrlnfOYa098PsFQJjLamBA3SVQdyyrPQCCHdWbMJCx4PtPrdYmA64+osgjIJA4MMKEkFy10iYDLgv5QoWtYA+i4Qc+i+Xy/wJgPBo9QZ0PcWHyprVU3m3LyZJXGQ0B46huExAfiUSmzk2VCg/R3VzrDHCTDGBsYKMQomAyOjH63InnN48e3ia4nSjypLJ48fHYLeDR198XiUY6nk5cteotA/iJxv48T7gWc6yvEGVodCgWi8UT8av37y+36AlVeJgpDtEqwvTUy6e6urtM0zx45NDWw61EIv7C8MB3j7YvVMwwwi07WbiXZcTU22++M/0uXAFAtVI1IkY8kXjjrcnNjc3fF7On/7qD6b4BuPpSPgNG8kCSPQEm0jTNMAxAqtfr8M2nj96s1k4urZJ9FCj8+sQZBiAsQxHnz4w2/f7MK2dfrdVqn3/y2eyPs6ZVP/nSxND4sLq6NvLHrfiTbEXEA9Rb2NszQn3H0uBqILGeW9cUVVXUkfGRzmQnerbv43plfmf7SSZyFRYkRBF1vI0wRCfEKJwAxtrdHPyqSD0+fBxMpev631vbF/P5gXD4vVR3Omw8LorkngPSHbnH0nAJ0tlJdjE7MDYIJx1GONWdKpV29ZD+zKGDncmulbX1mdzqoGGMRaKnE08ldT3gA+hoTFk5n0HWpU8/aqza7rJtm8VVpVIpl3aLpVLhQeHihQ/h3LJNeKBH06KKciQUUjGGa5XLxTzT2GW6P90kHljxUBSnymKiqqquaaFwR2Gz0KGHbGpblgYK5Kn9wLRzZpnFixpoyJ4zvv3qm+xSFjbnp8/3ulb68ovLK0srsJk8N3lidABr+MrX3y/ML0DfLj7a0VTNIUdseMB2Mwl7MtVAlrm2YpeZuT9BASYd1rUrs8ViCV6a/mCGUbn582/Lt5eZQhBaTEvgwaIGds4tTIOZLHkC9r39vWy/cW+juFOETTQWTR1IcbffyTIkpylRN/wwJRD3DIBwk6h+FdozXgyODbHNwnyGnQ+OeydzGT/tRfOgvPo6ogi/RURoikcFiWQPrxYQo8xjon5k5jKiqPDXpXxiZvZ94LewIBuQu3HvMtjnxvVf2K2ffrjGrPfr9RtckNxCvNEBS/UDs8lOToK9eIiPYLTpfNYwi3gFjY8pBAXflPu+f/4fZhSjgrjV0A0DHU0gixdkiXIUyPpSRGUSckfhg08jQdp8BpAxAhIRlj0n93Ze7B7zcgM537h7rO8mqTxp+jZU2X/kxZxcsQPAXq/2WneAVmDUDBr2XwEGADZFpKJDFtSPAAAAAElFTkSuQmCC",app_icon_32px_yellow:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA6VJREFUeNp8Vr1PVEEQn3m+Ais+TOQ4TCCeARMxRyESC6EwkUIDpf530kqnJVZqZayMFBI5wpGAYMEdDZzR3Dqzszs7b+9gL7k3b97sfP5mdnH9yUvwyzkHZiGicISg/0yG+XGnFVZtQpdK6behNmBgJfPD+EqUgMFaFoHaGNxpbauMSlZCB1cgE3iNm7oyXTYbgSASXMUhF1PEpMu9VqY6Zf8Bk/ZcEv3PryIohTxANhyDE34eojOhDNMucRe26FklNDNCj4/CdC3pnxjD+mRw3/phM0HrxvydueQaXgmetVX3eqPf60GrLRtxY63/4pn7+w8Oj1CiYUsDmQgoGgoecU2+Lswz/+gEVN5zcL/tXdbEYo6FkmzGAoE8tTO0dpSZ8TEmdnaDgwvz/HrZg6NT3ib67F51ukiNJr9YCV+usO7OsHTrAAMeEKdrrHfnB2uCak9k+SjVrAJO7N0cgaVmwPXjZqjP02XnI+5LxibGiMM5o9S12i7rkliDgdkgSh/eh+erfUi5w8asa8yC0ML3HH59t42ttnE0ZpuI0uAXbXl/HsCbLepzDuXVOou/fV9cXPKueo1AxbY3tyjD8Os3Xlya5mKkpimZIsDUQPytew6drov1xE6XKyw+3hpn/vEJ7h3ITielCc0EaVzQW6mKhxaKaI8f59ESwD51m01STsIkT3Mg6vEsaYtCuzzlR3CFYf89zjtSGQO0XOjns25sFHD5yRFgH1OUTXCRW1kmMU50w2N0YhQJQiJWr3EE9RqujPAm6u3jU9M9Jt2cIm1xa6YxQxBysSK8lhbB5NZzmoIx2P5YUHzqfna6lGn2IqiZ/UPc3GL21CRPoU6XgSguPphzS4sM/A+fCu8NnJ1DVkjbz2WlwjHvtChwHwqDYq/NgJE9j5reg8ixp012gsqnonqIm1ntaSnA8Yk0ecien3pOz1oFSLDHuEpIKSqdbCpBNLVYnQGDFIG4RPi5yYXloa2TMY0A6eEsgsGjVZ3yAKUCQOc88L37VADs/al4nVS7VG3Ba5m7YEpE05gQ8n03jnGAr99YA5lMZQSXHZZqLA277I6lNqiMYRjET+T45y8QnDNDLUQfzw/b2eXgzUejSSAZuK/ZsTh4g7L8wurNBlHiG4Hs/hLPJMwuCenaUmnxeOBko+kq98Nlq4oOPVGEU+QBuivvANnZFzQCZtcywMpMKa/ZnAWXJTd33EjYHJbyhOo9xarWu2WlBsPupkMT+1+AAQCmPwV2bobFnwAAAABJRU5ErkJggg==",app_icon_32px_yellow_unreads:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA1hJREFUeNqMVr1PFUEQn9lcIc+ORylHB9gBNpLY+dEISKWhNHYWdhb+FRaa+CeYWJnYKVoJdAiVQMc7Oh90go1vnX2zOzs7dxj2JXfz9mbne36zuLa8AuPlvQe1EJF3mKCn4Qn76aRmFmlMV0LJt04d0FpZfde+EBVg1GY8EB3tk1q38Ahn4Tp4h4HA/5gpy8jS0YgEkeALg3wKUSC9tVo2xSj9BMzSLSeOf+PlolCwDgbFyTnety565UqXdPbb6aSbTEhk2jVWmAJe26EjQasqQoYdBUrExDX/7Kmfnx2dX8DLV47FvX39l54HR/jmHUqcxXY5G6uos3jYNPq6tEjSA8/BITL/3Gzk7PUCH4g3aGuhohMpQcBv6QzJ3fR0FHd4FHnqaZ92MOYbUZ8Vo11uNP6lTIwjFhebLx7QztJiVPnzIJtv+oNXZUKmM3ZrwU9Ohs2pfuReXGDOUX0jSqlrmKmDNV++2i5JOWgVBoflwT14tDIyuVlf9QCFgetjnsEJkoJsaIo2EU7Vb9TMldDvdyDHZWv3B3Do2Expi9Arq7cfarwELgpV+xtP/J3lQLz/4L5vh2P373p27uMnMhzZ3jboxipKLQydiSJaCqY5ifg1l3J+dparw/QTFyc9XXZHyp8NGbtMLSb5PB5E/BKVx01UaSdHLPvwt2ojeJRbh78ia9AgN9f1nu9NRGOpuqb6vmmQOlwHWRwKGaWJxr7o+iVZL56PrphhwQ+pIh1k5wXDMQP1TH31CoLhEE0iBTpzHwjEs/LPmxQT0g3razEHVDDNSThAJcSNTfVDSEc8FxcZVPQEtY2m4XAMk+GYZHhrG8//BJzbeJxqfx8HA3HaFqjgqys6WWWC6Dph3PA0BJpOU3qnUgOSdCNRAL/woBhh5bCdn4PkTdy/OV+CqAZOhodWxznddcXIhWxs08QOZ+wLIHqYZ0YeZJinZpGD9ghjEwYN/Bri6Sns7kUM396hkI6I3tsvQC3aJKlWkaraNx8J6NaOS+5Hnt/nfvObM1OvfYPS+85gk+6RvH9JGKXe5ZOuETvRRLMcMMNPc+q7k0ZGPVF4x1kH/aV3ADP7ZHiYa1meNiYH7cPGORNca7ji0DGs+A3lPaWYP3Ln0Tnoupt2BvafAAMA603M1k3efM4AAAAASUVORK5CYII=",app_icon_32px_yellow_mentions:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABBhJREFUeNqkVk1vG0UYfudj/bExbWo3kJLaKRWO3aaooIoKOMCBDwlBI06F/oEeQOIHcIU7N34CEieQekMIkBDtBaEgDk1aRIgdRGiSpqSpN1nvzPDOzuzurO2SxozX69lZz/vM836ThRffhngopSA/IhH1I7zCYD/4eGbmQuUxOPzgKJcQgjNzT0eybmHFEPyjAgCxsgYYqHikqPeFGA+AEn30EQxcLPz+FYZjMrDHBwUJgRTJAgOhlK7s743JwMqCTGiqK5yjaLzhtRQE/wvA8Bi0hNIXjWE2IrEc9MYHsFaN1ZTC6KPjl1K/RBbepJv1u2MBkBERYNjghFHKCD13lj59mv4xtf0PhON4USLV+EuGZ14hh0ad+WVWrNAvg/VDA2SBZj6JJTRMrH1G2ZkWmZjglQq/dmfn9iEtwVon54adx0wuPAfzZ+WpWTh/DqRUeG3dVUti5yI95hF6aIBMdHx74zW4clm256DVNHrT+ntyWvnV/hrsNnePZbo90Ivs8RMMs7NWs4QoBY+TcolVfH7kiDc5Wdid3vt2alXAI2UncumFtwxAqhllOVhrv/eueumi7Efy8y/ghxtRJPrPzIft5r7/d/GVtVNHqXewm7rZTSMlc0Noto4kCOd0fZ16jHPG59terVoIZ8JPdn/76f7OQdk0PnBKIk2iqHNcLpdU46TGYpSs/YlOhRt4q6n6EXge6T4QH213zpfLV6dPNMv+QwAcx09PreU29GOjblZgtUNacwhPSyU1VeO9PVLw6InHRXWS3V7vf7Dy+7O+//xE5eWjk08UCjkbYEUzh3XjuTUHH74vB7N2/F5IJSIVhnI/FMGe7AXR9rb49DN0YilkhEJmPK/C2FPFIicEn7mVS2ykmcfZxih/0ElF64pwncEZJx6XxQK9d0+VCjpOhPCUkhtK3onkShQYf+G5gpwY4+tvoNPFIId3FrQN8M1X10h3TfvD668qjAw0+3ffw81lJoR80FOIhLsk1aRlnDRJIpO7Cc7oyjwu3dIHMNJx/HidoN5x05XLlsrir3R1Fd1B64AzaU6JPIzX4EwLJIrnlOBYAuf1up1vbkEvZuyX4XjNmr3TsZGvi5KK3Y8oin5vAKhVCU+z0HB70W5Bwsaun2lbyOVb2T+z4qFs9tWiqH1FU9dM/5qSOJ5ki27XRni1alduLidbkhrlxpNRc2aDrITl2XS6sLFJtrbg50Wbw6/fwNwlcb74SyLILSFJ6+DmQWI6OzcIhvHAtmBqZH82kOSThGbbFAr5nW5hyNYfosa0VUhfDVTDXEVLkdMNrkTXC9zzKlAuCZvNwGl8Bgmq0T2Ai5GTCMS1nFvbbbL7j80D5DLlDmk/DlK308x0yM0vJD7nZuwcMKicDfK0cq1mXrH/CjAAfjaCPa5V5tYAAAAASUVORK5CYII=",app_icon_32px_red:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2pJREFUeNp8Vr13EzEMly5uQl+nlKnpRrtRNsp7DO1Ilz5W/gZW/iG6MrLCyMhIN9JsKVvDlH7dRdiWLcu6K27fxaeTrY/fT7Lx/dtziIOIQA1EZAlP/NPoBHleqZVlN547mcm3QRvQG8X8kFwmDjBZMxGIjf5KbVt0RLMKHajBMMH/uCnD7KWzkSZ+ClQ5RDlFYUrWaxGKU/oJWHa3mhj/4mjSpmADDIZzcCy3IZIKZWh3jrvRoBskJDM8nzawPyr7745w1iT3tR86E3401XZAg+Txr2fP4NMOHbmy8t2EPu7Aybj4J1mWHPiRWDRIHnaNv/LWyw2IPksWm6AHkli0XHA+Xxkg4F+pDMFu38E0hnr5mDw42grPW4JlF5bxfnqtOO2kCIIlJMFH8+lFzPVVK3zACAYFewFV1NVa/GMDJYNUIbaNcDxOlt6Mk7bPOGtyfnYbOJkE7WXnzZOpklzJvd7AaXm1FWDUXw9c+AdVSlESXr/e4VUEVZiatDAayFLU8P5u6fM6ZMOH8mE7qH+5xXV0ajbCs2j7Yh3w+7PB9UYVV2BqYWOJAEsBhW9/CVatnxLjudrAZcsJx+cR8OsO5i1DRQxNKiYVo39zsrFuXno+jQgHgub+tRcNeMyFHYB1N42iACf4QiPbERMNMK0/jNW7bHNhU6rnm00uFCB7ciTa5xSZDs56p5MUx4EQJnNpFg3MHJ5yKB36dFXsRJUidoGtiRm/qaHQ8dh28uOtpPDtHpctifvmdHGl9yKImUWHF+sg3hvR2SQg7InIfrx05I154n+/T3y7iRQyXUiy7SqEc9798IHHUAIp5h3Ocx29jqEsskTaWGmU9Qno6kOchBC84GAUntctpQLzJhnzjuSs7begkiigpqpkhQSXGOM575JLnj/bmDgqnbG0ACLL19BN9RFWH7aHMT8egFWmMrcKD8Bd7AZV4+QCI3vNcdYFZcl3Y8+QX4+pnfvHz4egsiKVE31GCU2wxsDcscSGh3HeVn3wDvHHAx+uoJtaCiKfH7qyXf/mI9EUOvfua7ot9m9QWt7ofU0jKnKlYO4vmIe5JJRrizmAuL2Y1vSU++mypTqjPlFY0tgA6ck7gDn70o6A5loGul9rDPqLTXAmudZxpaFz6PgX6nuK3lpqssJg6G46mNh/AgwA1LYLPz5hMyUAAAAASUVORK5CYII=",app_icon_32px_red_unreads:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAzFJREFUeNqMVr1zUzEMlxyHtincsdDOyUo6Aytz6Qoz3HVk5y/gr6ATQ2dgBWZYKWvDDAsDaZvmJUZ+smVZ77UXp5e4sqyPn76MR08OoV0hBFALEZnCG/o2PJGeb2pmkcZ7Lzs569UBnVXU99Fl4wGTNuOB6Oje1LqFRzgr1yE4jBu8xUxZRpZGI21oC6EyKGSI4jZYq4UoRulvwCLdcmL7aZdLQsE6GBVn55huXQzKlT7p7LfTQTeREGS6OVaZAkHboZGg5SvIsCdBaTOC8PoeTH2YBzj+mwx/fz8enS3h7RwEZ7Fd7qYs6k0eNo1OH90h6cDimH86TJy7LvKBeIM2FzzpzAEC/pXKkNiNs59nTeIZDxSF442o74rRrhQaf3IkWsTSmoqC1gOikE+KUtWEwcMbyHTEHg/hgYvEvZQKQHLZY/FgPMDJIHr18SqYKskx6CQGw3K0jc93bGxe7ABAqCnx39mKFChDM9q0cSp/k2bOBLZ9w/XtOkHHZkpZxEou5pcCimcnl/DuIjK+GsHTrUg/ucDPi2jjsy1g504vo+FsrzRdVD62dYC2l5lGNvZpTzhwsj/MVv1ZR2mqL5R64lDRtyvuSPpzXrUuj1Q8z5sUIMna81WqLzs5UtrHf323g7Pcia+yhczn4trF+Mdr3+G+oyOc6+pRcEfEaKKxLzp/Sdabu5tGWPqHZJEG2QXp4Vga9WSAm6fQ7zWYQErrLHUgLZ6Vf7gK5DhppsRnlChhfq3ihcPtwIVN+fOziTzzdWkqeoLaQtPtkNaPpo1nBurLAubtpZejnPtLmDWCe9WCClCQ54GMnZKggBJhAoGAptsUXmkbswaMRGn4lQfVCKuH7cEwFU1qmYgHQzCUaoKGquL4yOlpXo1c6haDUBmr+gc1UZkZZZBhmZpVDLojjE0guaeriA+1Gj76ep1K9/sSdFNLNkmoFVK++/IRQElcdj/x/FuHTws0U6/7gtJ0p+WaRlToN8Ao+S5HOkfsRBPNcsEMP82p3066M+qJwhRnHQw3vgHM7JPhYZ5lgNVM8rdcNs4ZcK3hikNj6PkX6neKFl3ePDoGfW/TXmD/CzAAcryyBfjeu1oAAAAASUVORK5CYII=",app_icon_32px_red_mentions:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA+pJREFUeNqkVktvHEUQ7q7unp19xAkHJ6BFAhshgeI8pAgpuSAO3OLkCJw5cOEXwBX4F/yAiBMCxA1yyQWUG4kEIsoGoyiWDYg4jsc7091F9XRPT8/YkeNlPLvunUd99X1V1VX8+pV1Vh+IyLqHNrrSdJbFvPhsOr00OcGOf0iyyzmnlf+OR3M9wJoD8M8LwHiw1WOA9RFRnxizGABw5/ohDFIs+jwqywUZBPcZsoZARArAjAPAbL6/IINgi7VGo1a0JtP0ReevRfG/ADyPfiTQnVDDbGvzW7G3OECIai1ThHGu0wdgzPl7Y3i8+89CAPyQCvBsaCEABIeLA/FGJh7uPd6pykWyqLHq86XF87eIw0oGIyEHnH+9vXlsgLbQ/F8TCQdTqy9AnM/ERIolJb/9d+f3Y0YCYoR9CFK5Liu2PsCrOZ9KGAt5Qqo3c/HVo43iOEUne9LHUF/P+ftDx0IjKw1JJJakvDZWW/Py1ubs3elrrbZHMgjuN/Xs31yGQEWQFwBDQSrJk0q9oFSh57c2N55zd+LXLl/1ALGAkQXfvFwfjtg7GVbWfrmLPxSVNtUlVq6xciAHV868siTV0Wma7m4OqVl7QqvS1RqReIighJRCns+z5UFmTPnFg3u3n+wcFYPa4UgibqIUCbo8Yrgi3COE8YdllFSSybNDXmmmOGzMq0//3LgwHH704kuvD0fPDHLMnOg12V2VDoOs+wqZGbaWETzkyE4rXnCeAbyci2Wp71XVx7P7F0ejt8aTt0+eOpNlnRhQR/POpgm6ptgnk0N2bTotokYsjd23hvJ1z5i/KvP5jrHWGkt3cKrURIiVwUByykCUwS4PleZ/roqmrFNffFLVyeDKD7gCyEH8zU2eWYvWGIVot9FuaTvThfdJdhpyE4xv9nFmnEQfDJlX6UbBHhgHsZ7jWemS+fsC71ag0ewaUJKIoQXLaoq1JMGm7FRZrZX/+Yt2BbfSCPXjnD2tHaGs9U/c1vy+pnSQ9JwU1ntJPHzW0MoZ5Nit5CQStH5VhPWWZU/dEsecnYYm7Dq0PNeUsE4/jkB57wEgSCLj7n9wvDinQiTu6EDxnGK9K23ugXPYL5wpCLcgpmZ8NJJYbhjMdMiiuH/cqZpXmh6V1pMXsY1B28K6bMjuDeP0+akMt26WjhPZ+bliwVDaQprRId0HZTqtpDDeXJNd4Zldi9/NOzNHHEb6c1tzHVK7vamivf4MGeOoEG/1umGno0Xk+EJqMc2C1F9kmI45aUcJg0+fIB4+A6QYHYuMp5FLe3s/Bgdf7pHridt3vDNpthpK/581EUt37A4ww04MurQ6o2ZX2P8EGAAu1YEi4TmT9gAAAABJRU5ErkJggg=="},key_triggers:{"77":{func:function(){TS.ui.openFlexTab("mentions")
                }
            }, "83": {
                func: function() {
                    TS.ui.openFlexTab("stars")
                }
            },
            "69": {
                isDisabled: function() {
                    return !!TS.model.is_FF
                },
                func: function() {
                    TS.ui.openFlexTab("team")
                }
            },
            "65": {
                func: function() {
                    TS.ui.openFlexTab("activity")
                }
            },
            "70": {
                isDisabled: function() {
                    return !(window.macgap || (TS.model && TS.model.prefs && TS.model.prefs.f_key_search))
                },
                no_shift: true,
                func: function() {
                    TS.ui.openFlexTab("search");
                    TS.view.resizeManually("TS.search.view.showResults");
                    var b = "in:" + TS.shared.getActiveModelOb().name + " ";
                    if (TS.utility.getActiveElementProp("id") == "message-input") {
                        b += TS.view.input_el.val();
                        TS.view.input_el.val("")
                    }
                    $("#search_terms").val(b).removeClass("placeholder").focus()
                }
            },
            "188": {
                isDisabled: function(b) {
                    if (!TS.model) {
                        true
                    }
                    if (!TS.model.prefs) {
                        true
                    }
                    if (!TS.model.is_mac) {
                        return true
                    }
                    if (b.shiftKey) {
                        if (TS.model.active_im_id) {
                            return true
                        } else {
                            return false
                        }
                    }
                    if (TS.model.mac_ssb_version) {
                        return true
                    }
                    if (!TS.model.prefs.comma_key_prefs) {
                        return true
                    }
                },
                shift_optional: true,
                func: function(b) {
                    if (b.shiftKey) {
                        TS.ui.channel_prefs_dialog.start(TS.model.active_cid)
                    } else {
                        TS.ui.prefs_dialog.start()
                    }
                }
            }
        }, sounds: {}, playSound: function(b) {
            if (b == "new_message") {
                b = TS.model.prefs.new_msg_snd;
                if (b == "none") {
                    return
                }
            }
            if (b == "beep") {
                b = "Frog"
            }
            if (!(b in TS.ui.sounds)) {
                TS.warn("unknown sound:" + b);
                return
            }
            if (TS.model && TS.model.prefs && TS.model.prefs.mute_sounds) {
                return
            }
            if (TS.ui.sounds[b]) {
                if (window.macgap && window.macgap.sound && window.macgap.sound.playRemote && TS.model.is_apple_webkit_5) {
                    TS.info('calling window.macgap.sound.playRemote("' + TS.ui.sounds[b].url + '")');
                    window.macgap.sound.playRemote(TS.ui.sounds[b].url)
                } else {
                    TS.ui.sounds[b].play()
                }
            } else {}
        }, cached_scroller_rect: null, cached_search_scroller_rect: null, cached_channels_scroller_rect: null, window_focused: (document.hasFocus && document.hasFocus() && window.macgap_is_in_active_space) ? true : false, auto_scrolling_msgs: false, file_dropped_sig: new signals.Signal(), file_pasted_sig: new signals.Signal(), window_focus_changed_sig: new signals.Signal(), reads: [], ims_to_show: 2, im_list_expanded: false, onSpaceChanged: function(b) {
            if (!b) {
                TS.ui.onWindowBlur({
                    target: window
                })
            } else {
                if (document.hasFocus()) {
                    TS.ui.onWindowFocus({
                        target: window
                    })
                }
            }
        }, onWindowFocus: function(b) {
            if (b.target === window) {
                if (TS.ui.window_focused) {
                    return
                }
                $("body").removeClass("blurred");
                TS.model.shift_key_pressed = false;
                TS.model.insert_key_pressed = false;
                TS.ui.window_focused = true;
                TS.ui.startUnreadCheckingTimer();
                TS.ui.window_focus_changed_sig.dispatch(true);
                TS.ui.maybeTickleMS()
            }
            TS.view.updateTitleBarColor()
        }, onWindowBlur: function(b) {
            if (b.target === window) {
                if (!TS.ui.window_focused) {
                    return
                }
                $("body").addClass("blurred");
                TS.model.shift_key_pressed = false;
                TS.model.insert_key_pressed = false;
                TS.ui.window_focused = false;
                clearTimeout(TS.ui.unread_checking_tim);
                TS.ui.window_focus_changed_sig.dispatch(false)
            }
        }, cal_key_checker: {
            tim: null,
            tim_ms: 200,
            prevent_enter: false,
            space_pressed_last: false,
            reset: function() {
                clearTimeout(TS.ui.cal_key_checker.tim);
                TS.ui.cal_key_checker.space_pressed_last = false;
                TS.ui.cal_key_checker.prevent_enter = false
            },
            check: function(b) {
                if (TS.ui.cal_key_checker.space_pressed_last && b != 32) {
                    TS.ui.cal_key_checker.reset();
                    if (b == 73) {
                        TS.ui.cal_key_checker.prevent_enter = true;
                        TS.ui.cal_key_checker.tim = setTimeout(TS.ui.cal_key_checker.reset, TS.ui.cal_key_checker.tim_ms)
                    }
                } else {
                    if (b == 32) {
                        TS.ui.cal_key_checker.reset();
                        TS.ui.cal_key_checker.space_pressed_last = true;
                        TS.ui.cal_key_checker.tim = setTimeout(TS.ui.cal_key_checker.reset, TS.ui.cal_key_checker.tim_ms)
                    } else {
                        TS.ui.cal_key_checker.reset()
                    }
                }
            }
        }, keyPressIsValidForGotoNextOpenChannelOrIM: function(c) {
            var b = TS.utility.keymap;
            if (TS.ui.isUserAttentionOnChat() && c && c.altKey) {
                if (c.shiftKey || !TS.utility.isFocusOnInput() || !TS.view.input_el.val().length) {
                    if (c.which == b.up || c.which == b.down) {
                        return true
                    }
                }
            }
            return false
        }, page_scroll_dest: null, onWindowKeyDown: function(j) {
            var c = TS.utility.date.getTimeStamp();
            var i = TS.utility.keymap;
            TS.ui.cal_key_checker.check(j.which);
            var m = TS.ui.key_triggers[j.which.toString()];
            if (TS.ui.isUserAttentionOnChat() && m && (!m.isDisabled || !m.isDisabled(j)) && ((j.metaKey && (!j.ctrlKey || !TS.model.is_mac)) || (j.ctrlKey && !j.altKey && !TS.model.is_mac)) && ((!m.no_shift && (j.shiftKey || m.shift_optional)) || (m.no_shift && !j.shiftKey))) {
                j.preventDefault();
                j.stopPropagation();
                m.func(j)
            } else {
                if (TS.ui.isUserAttentionOnChat() && !TS.utility.isFocusOnInput() && TS.utility.cmdKey(j) && j.which == i.up) {
                    TS.ui.maybeEditLast(j)
                } else {
                    if ((!TS.model.mac_ssb_version || TS.model.mac_ssb_version >= 0.52) && j.metaKey && TS.ui.isUserAttentionOnChat() && (j.which == 37 || j.which == 39)) {
                        if (document.activeElement && document.activeElement.nodeName.match(/textarea|input/i)) {
                            if (document.activeElement.value === "") {
                                window.history.go(j.which === 37 ? -1 : 1)
                            }
                        }
                    } else {
                        if (TS.model.mac_ssb_version && TS.ui.isUserAttentionOnChat() && j.metaKey && j.shiftKey && (j.which == i.left_square_bracket || j.which == i.right_square_bracket)) {
                            if (j.which == i.left_square_bracket) {
                                TS.ui.gotoNextOpenChannelOrIM(j.altKey, true)
                            } else {
                                if (j.which == i.right_square_bracket) {
                                    TS.ui.gotoNextOpenChannelOrIM(j.altKey, false)
                                }
                            }
                            j.preventDefault()
                        } else {
                            if (TS.ui.keyPressIsValidForGotoNextOpenChannelOrIM(j)) {
                                if (j.which == i.up) {
                                    TS.ui.gotoNextOpenChannelOrIM(j.shiftKey, true)
                                } else {
                                    if (j.which == i.down) {
                                        TS.ui.gotoNextOpenChannelOrIM(j.shiftKey, false)
                                    }
                                }
                            } else {
                                if ((TS.ui.isUserAttentionOnChat() || TS.ui.shortcuts_dialog.showing) && (j.which == 191) && !j.altKey && TS.utility.cmdKey(j)) {
                                    if (TS.ui.shortcuts_dialog.showing) {
                                        TS.ui.shortcuts_dialog.cancel()
                                    } else {
                                        TS.ui.shortcuts_dialog.start()
                                    }
                                    j.preventDefault()
                                } else {
                                    if (TS.ui.isUserAttentionOnChat() && (j.which == 190) && !j.altKey && TS.utility.cmdKey(j)) {
                                        TS.ui.toggleFlex();
                                        j.preventDefault()
                                    } else {
                                        if (j.which == i.shift || j.which == i.space) {
                                            if (TS.model.prefs && TS.model.prefs.pagekeys_handled) {
                                                if (TS.utility.isFocusOnInput()) {
                                                    if (j.which == i.space && j.shiftKey && !TS.view.input_el.val() && document.activeElement == TS.view.input_el[0]) {
                                                        TS.view.input_el.blur();
                                                        j.preventDefault()
                                                    }
                                                } else {
                                                    if (TS.model.is_FF) {
                                                        TS.view.msgs_scroller_div.focus()
                                                    }
                                                }
                                            }
                                        } else {
                                            if (j.which == i.esc) {
                                                TS.ui.onEscKey(j)
                                            } else {
                                                if (TS.ui.isPageKey(j.which) && TS.model.prefs && TS.model.prefs.pagekeys_handled && !j.shiftKey && !j.ctrlKey && !j.altKey && !j.metaKey) {
                                                    var n = TS.utility.getActiveElementProp("id") == "message-input";
                                                    var d = !n && TS.utility.isFocusOnInput();
                                                    var o = TS.view.msgs_scroller_div[0].scrollTop;
                                                    var g = TS.view.msgs_scroller_div[0].scrollHeight;
                                                    var f = TS.view.msgs_scroller_div.height();
                                                    var c = o;
                                                    if (TS.ui.page_scroll_dest != null) {
                                                        c = TS.ui.page_scroll_dest
                                                    }
                                                    var b = true;
                                                    var l = $(document.activeElement);
                                                    var k = false;
                                                    if (j.which == i.pageup) {
                                                        if (d) {
                                                            b = false
                                                        } else {
                                                            if (k && n && l.val()) {
                                                                b = false
                                                            } else {
                                                                TS.ui.page_scroll_dest = c - f
                                                            }
                                                        }
                                                    } else {
                                                        if (j.which == i.pagedown) {
                                                            if (d) {
                                                                b = false
                                                            } else {
                                                                if (k && n && l.val()) {
                                                                    b = false
                                                                } else {
                                                                    TS.ui.page_scroll_dest = c + f
                                                                }
                                                            }
                                                        } else {
                                                            if (j.which == i.home) {
                                                                if (d || (n && l.val())) {
                                                                    if (TS.model.is_mac) {
                                                                        if (j.shiftKey) {} else {
                                                                            l.setCursorPosition(0);
                                                                            j.preventDefault()
                                                                        }
                                                                    }
                                                                    b = false
                                                                } else {
                                                                    TS.ui.page_scroll_dest = 0
                                                                }
                                                            } else {
                                                                if (j.which == i.end) {
                                                                    if (d || (n && l.val())) {
                                                                        if (TS.model.is_mac) {
                                                                            if (j.shiftKey) {} else {
                                                                                l.setCursorPosition(1000000);
                                                                                j.preventDefault()
                                                                            }
                                                                        }
                                                                        b = false
                                                                    } else {
                                                                        TS.ui.page_scroll_dest = g
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    } if (b) {
                                                        TS.ui.slowScrollMsgsToPosition(TS.ui.page_scroll_dest, true, function() {
                                                            TS.ui.page_scroll_dest = null
                                                        });
                                                        j.preventDefault()
                                                    }
                                                } else {
                                                    if (!TS.utility.isFocusOnInput() && TS.ui.isUserAttentionOnChat() && !TS.ui.isArrowKey(j.which) && !TS.ui.isPageKey(j.which) && !j.metaKey && !j.ctrlKey) {
                                                        TS.view.focusMessageInput();
                                                        if (j.which == i.tab && !TS.utility.cmdKey(j)) {
                                                            j.preventDefault()
                                                        }
                                                        if (j.which == i.enter) {
                                                            j.preventDefault()
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
            } if (TS.model.profiling_keys) {
                TS.model.addProfilingKeyTime("onWindowKeyDown", TS.utility.date.getTimeStamp() - c)
            }
            if (j.which == i.shift || j.shiftKey) {
                TS.model.shift_key_pressed = true
            }
            if (j.which == i.insert) {
                TS.model.insert_key_pressed = true
            }
            if (j.which == i.alt || j.altKey) {
                TS.model.alt_key_pressed = true
            }
            if (j.shiftKey && j.metaKey && j.which != i.V) {
                TS.model.shift_key_pressed = false
            }
            if (TS.ui.isUserAttentionOnChat() && TS.model.is_our_app && !j.altKey && j.which == 84 && TS.utility.cmdKey(j)) {
                TS.ui.omnibox.start();
                j.preventDefault()
            }
            if (TS.ui.isUserAttentionOnChat() && !j.altKey && j.which == 75 && TS.utility.cmdKey(j)) {
                TS.ui.omnibox.start();
                j.preventDefault()
            }
        }, onWindowKeyUp: function(c) {
            var b = TS.utility.keymap;
            if (c.which == b.shift) {
                TS.model.shift_key_pressed = false
            }
            if (c.which == b.insert) {
                TS.model.insert_key_pressed = false
            }
            if (c.which == b.alt) {
                TS.model.alt_key_pressed = false
            }
        }, onEscKey: function(d) {
            try {
                d.stopPropagation()
            } catch (c) {}
            try {
                d.preventDefault()
            } catch (c) {}
            if (!TS.ui.isUserAttentionOnChat()) {
                return
            }
            if (TS.msg_edit.editing) {
                return
            }
            if (TS.emoji_menu.is_showing) {
                return
            }
            var b = d.shiftKey;
            TS.ui.forceMarkAllRead(b)
        }, mouse_is_down: false, onStart: function() {
            TS.channels.switched_sig.add(TS.ui.channelOrImOrGroupDisplaySwitched, TS.ui);
            TS.ims.switched_sig.add(TS.ui.channelOrImOrGroupDisplaySwitched, TS.ui);
            TS.groups.switched_sig.add(TS.ui.channelOrImOrGroupDisplaySwitched, TS.ui);
            TS.prefs.color_names_in_list_changed_sig.add(TS.ui.prefColorNamesInListChanged, TS.ui);
            TS.prefs.collapsible_changed_sig.add(TS.ui.prefCollapsibleChanged, TS.ui);
            TS.files.team_file_comment_added_sig.add(TS.ui.teamFileCommentAdded, TS.ui);
            TS.files.team_file_comment_edited_sig.add(TS.ui.teamFileCommentEdited, TS.ui);
            TS.files.team_file_comment_deleted_sig.add(TS.ui.teamFileCommentDeleted, TS.ui);
            TS.files.team_file_changed_sig.add(TS.ui.teamFileChanged, TS.ui);
            TS.files.team_file_deleted_sig.add(TS.ui.teamFileDeleted, TS.ui);
            TS.activity.individual_activity_fetched_sig.add(TS.ui.individualActivityFetched, TS.ui);
            $(window).bind("focus", TS.ui.onWindowFocus);
            $(window).bind("blur", TS.ui.onWindowBlur);
            $("html").bind("mousedown", function(i) {
                TS.ui.onWindowFocus({
                    target: window
                })
            });
            var j = (document.hasFocus && document.hasFocus() && window.macgap_is_in_active_space) ? true : false;
            if (j) {
                TS.ui.onWindowFocus({
                    target: window
                })
            } else {
                TS.ui.onWindowBlur({
                    target: window
                })
            }
            TS.view.msgs_scroller_div.bind("mousedown mouseup", function(i) {
                TS.ui.checkUnreads()
            });
            var h = null;
            $("html").bind("mousedown", function(i) {
                TS.ui.mouse_is_down = true;
                TS.ui.maybeTickleMS();
                h = $(i.target)
            });
            $("html").bind("dragend", function(i) {
                TS.ui.mouse_is_down = false
            });
            $("html").bind("mouseup", function(i) {
                TS.ui.mouse_is_down = false;
                setTimeout(function() {
                    if (h && h.closest(".monkey_scroll_handle").length) {
                        if (!TS.model.showing_welcome_2) {
                            TS.ui.maybeLoadScrollBackHistory()
                        }
                    }
                }, 10)
            });
            TS.view.msgs_scroller_div.scroll(TS.ui.onMsgsScroll);
            $("#channels_scroller").scroll(TS.ui.onChannelsScroll);
            TS.ui.enhanceComponents();
            TS.ui.bindMessageInput();
            TS.ui.bindCommentInput();
            TS.ui.bindUploadUI();
            TS.ui.bindFlexUI();
            TS.ui.bindFileUI();
            TS.ui.bindChannelGroupImStarredLists();
            TS.client.login_sig.add(TS.ui.loggedIn, TS.ui);
            $(window.document).keydown(TS.ui.onWindowKeyDown);
            $(window.document).keyup(TS.ui.onWindowKeyUp);
            $("#user_menu").bind("click", function(i) {
                if ($(i.target).attr("id") == "user_menu_tip_card_throbber") {
                    return
                }
                if (TS.tips.maybeDoThrobberProxyClick("user_menu_tip_card_throbber", i)) {
                    return false
                }
                TS.menu.startWithUser(i)
            });
            $("#team_menu").bind("click", function(i) {
                if (TS.tips.maybeDoThrobberProxyClick("team_menu_tip_card_throbber", i)) {
                    return false
                }
                TS.menu.startWithTeam(i)
            });
            $("#file_comment_form #file_comment").bind("textchange", function(i, l) {
                TS.ui.storeLastCommentInputForPreviewedFile($(this).val());
                $("#file_preview_scroller").data("monkeyScroll").updateFunc()
            });
            $("#file_comment").css("overflow", "hidden").autogrow();
            $("#file_comment_form").bind("submit", function(i) {
                TS.ui.submitFileComment();
                return false
            });
            var f = TS.boot_data.new_message_sounds;
            var k = TS.boot_data.alert_sounds;
            var c = TS.boot_data.chat_sounds;
            try {
                var b = [];
                for (var d = 0; d < f.length; d++) {
                    if (f[d].url) {
                        if (f[d].url.indexOf("http") != 0) {
                            f[d].url = TS.boot_data.abs_root_url + f[d].url.replace("/", "")
                        }
                        TS.log(37, "adding sound: " + f[d].value);
                        TS.ui.sounds[f[d].value] = soundManager.createSound({
                            url: f[d].url
                        });
                        TS.log(37, "TS.ui.sounds[" + f[d].value + "] = " + TS.ui.sounds[f[d].value]);
                        b.push(f[d].url)
                    }
                }
                for (var d = 0; d < k.length; d++) {
                    if (k[d].url) {
                        if (k[d].url.indexOf("http") != 0) {
                            k[d].url = TS.boot_data.abs_root_url + k[d].url.replace("/", "")
                        }
                        TS.log(37, "adding sound: " + k[d].value);
                        TS.ui.sounds[k[d].value] = soundManager.createSound({
                            url: k[d].url
                        });
                        TS.log(37, "TS.ui.sounds[" + k[d].value + "] = " + TS.ui.sounds[k[d].value]);
                        b.push(k[d].url)
                    }
                }
                for (var d = 0; d < c.length; d++) {
                    if (c[d].url) {
                        if (c[d].url.indexOf("http") != 0) {
                            c[d].url = TS.boot_data.abs_root_url + c[d].url.replace("/", "")
                        }
                        TS.log(37, "adding sound: " + c[d].value);
                        TS.ui.sounds[c[d].value] = soundManager.createSound({
                            url: c[d].url
                        });
                        TS.log(37, "TS.ui.sounds[" + c[d].value + "] = " + TS.ui.sounds[c[d].value]);
                        b.push(c[d].url)
                    }
                }
                if (window.macgap && window.macgap.sound && window.macgap.sound.preloadSounds) {
                    window.macgap.sound.preloadSounds(b)
                }
            } catch (g) {
                TS.warn("error calling soundManager.createSound")
            }
        }, checkForEditing: function(b) {
            if (!TS.msg_edit.editing) {
                return false
            }
            if (!b || !b.target || $(b.target).closest("#message_edit_form").length == 0) {
                TS.ui.playSound("beep");
                TS.msg_edit.promptEdit()
            }
            return true
        }, loggedIn: function() {
            TS.ui.setFlexStateFromHistory(TS.model.ui_state.flex_name, TS.model.ui_state.flex_extra, true);
            if (TS.model.ui_state.flex_name) {
                TS.client.flexDisplaySwitched(TS.model.ui_state.flex_name, TS.model.ui_state.flex_extra, true);
                TS.ui.showFlex()
            }
            $(".emo_menu").removeClass("hidden").bind("click.open_dialog", TS.emoji_menu.startEmo).html(TS.utility.emojiGraphicReplace($(".emo_menu").html()));
            if (TS.boot_data.special_flex_panes) {
                for (var d = 0; d < TS.boot_data.special_flex_panes.length; d++) {
                    var c = TS.boot_data.special_flex_panes[0];
                    if (c.keycode) {
                        (function(g, h) {
                            TS.ui.key_triggers[g.toString()] = {
                                func: function() {
                                    TS.ui.openFlexTab(h)
                                }
                            }
                        })(c.keycode, c.flex_name)
                    }
                }
            }
            if (TS.model.team.domain == "tinyspeck") {
                var b = "abcdefghijklmnopqrstuvwxxyz";
                var f = b.split("");
                TS.cmd_handlers["/block"] = {
                    type: "client",
                    autocomplete: true,
                    alias_of: null,
                    aliases: null,
                    desc: "Scrabble letter your message (TS only)",
                    args: [{
                        name: "text",
                        optional: false
                    }],
                    func: function(k, j, m, l) {
                        j = $.trim(j);
                        var g = "";
                        if (!j) {
                            j = b
                        }
                        for (var h = 0; h < j.length; h++) {
                            var n = j.charAt(h).toLowerCase();
                            if (f.indexOf(n) > -1) {
                                if (n == " ") {
                                    g += ":block-space:"
                                } else {
                                    g += ":block-" + n + ":"
                                }
                            } else {
                                if (n == " ") {
                                    g += "   "
                                } else {
                                    g += n
                                }
                            }
                        }
                        if (TS.model.active_channel_id) {
                            TS.channels.sendMsg(TS.model.active_channel_id, g)
                        } else {
                            if (TS.model.active_im_id) {
                                TS.ims.sendMsg(TS.model.active_im_id, g)
                            } else {
                                if (TS.model.active_group_id) {
                                    TS.groups.sendMsg(TS.model.active_group_id, g)
                                }
                            }
                        }
                    }
                };
                TS.cmd_handlers["/codeletters"] = {
                    type: "client",
                    autocomplete: true,
                    alias_of: null,
                    aliases: null,
                    desc: "`code` letter your message (TS only)",
                    args: [{
                        name: "text",
                        optional: false
                    }],
                    func: function(k, j, m, l) {
                        var g = "";
                        if (!j) {
                            TS.view.input_el.val(k);
                            return
                        }
                        for (var h = 0; h < j.length; h++) {
                            var n = j.charAt(h);
                            if (n == " ") {
                                g += "  "
                            } else {
                                if (n == "`") {
                                    g += "' "
                                } else {
                                    g += "`" + n + "` "
                                }
                            }
                        }
                        if (TS.model.active_channel_id) {
                            TS.channels.sendMsg(TS.model.active_channel_id, g)
                        } else {
                            if (TS.model.active_im_id) {
                                TS.ims.sendMsg(TS.model.active_im_id, g)
                            } else {
                                if (TS.model.active_group_id) {
                                    TS.groups.sendMsg(TS.model.active_group_id, g)
                                }
                            }
                        }
                    }
                };
                TS.cmd_handlers["/codewords"] = {
                    type: "client",
                    autocomplete: true,
                    alias_of: null,
                    aliases: null,
                    desc: "`code` word your message (TS only)",
                    args: [{
                        name: "text",
                        optional: false
                    }],
                    func: function(l, k, n, m) {
                        var h = "";
                        if (!k) {
                            TS.view.input_el.val(l);
                            return
                        }
                        var g = k.split(" ");
                        for (var j = 0; j < g.length; j++) {
                            g[j] = " `" + g[j] + "` "
                        }
                        h = g.join(" ");
                        if (TS.model.active_channel_id) {
                            TS.channels.sendMsg(TS.model.active_channel_id, h)
                        } else {
                            if (TS.model.active_im_id) {
                                TS.ims.sendMsg(TS.model.active_im_id, h)
                            } else {
                                if (TS.model.active_group_id) {
                                    TS.groups.sendMsg(TS.model.active_group_id, h)
                                }
                            }
                        }
                    }
                }
            }
        }, maybeTickleMS: function() {
            if (!TS.model.user) {
                return
            }
            if (TS.model.user.manual_presence == "away") {
                return
            }
            var c = TS.utility.date.getTimeStamp() - TS.model.last_net_send;
            var b = 1000 * 40;
            if (c < b && TS.model.user.presence == "active") {
                return
            }
            TS.info("calling tickleMS()" + c);
            TS.ui.tickleMS()
        }, tickleMS: function() {
            TS.api.call("users.setActive")
        }, validateFiles: function(l, c, i) {
            if (!l) {
                return
            }
            var c = !!c;
            var h = [];
            var q = 0;
            var v = 0;
            var b = false;
            var f = false;
            var d = navigator.platform && navigator.platform.match(/macintel/i);
            var t = {};
            var o = [];

            function n(x) {
                v = Math.max(0, v + x)
            }

            function w() {
                h = [];
                v = 0;
                q = 0;
                b = false;
                f = false
            }
            if (!TS.ui.resetFiles) {
                TS.ui.resetFiles = w
            }

            function m() {
                if (!b) {
                    if (h.length) {
                        b = true;
                        TS.ui.file_dropped_sig.dispatch(h, c)
                    }
                }
            }

            function s() {
                if (f) {
                    return false
                }
                if (q > 0 && (h.length >= v || v <= 0)) {
                    f = true;
                    if (o.length) {
                        j(l, function() {
                            if (i) {
                                i(h, m)
                            } else {
                                m()
                            }
                        })
                    } else {
                        if (i) {
                            i(h, m)
                        } else {
                            m()
                        }
                    }
                }
            }

            function p(x) {
                h.push(x)
            }

            function k(x) {
                x.onload = x.onerror = null;
                return null
            }

            function g(z, B) {
                var y, x;
                x = {
                    isFile: null,
                    isDirectory: null
                };
                if (z.size < 16384) {
                    y = new FileReader();
                    y.onload = function(C) {
                        y = k(C.currentTarget);
                        x.isFile = true;
                        B(x)
                    };
                    y.onerror = function(C) {
                        y = k(C.currentTarget);
                        x.isDirectory = true;
                        B(x)
                    };
                    try {
                        y.readAsDataURL(z)
                    } catch (A) {
                        y = k(e.currentTarget);
                        x.isDirectory = true;
                        B(x)
                    }
                } else {
                    B(x)
                }
            }

            function r(y, z, E) {
                var A, x, B, D, C;
                x = false;
                C = y.name || z.name;
                if (!C) {
                    return false
                }
                B = C.lastIndexOf(".");
                if (B !== -1) {
                    D = C.substr(B)
                }
                if (D) {
                    A = t[D] && t[D].enabled ? t[D] : null
                }
                if (z && (z.isFile || z.isDirectory)) {
                    if (z.isDirectory || (z.isFile && A && A.applyToFile)) {
                        x = true;
                        return E(x)
                    } else {
                        x = false;
                        return E(x)
                    }
                } else {
                    g(y, function(F) {
                        if (F.isDirectory) {
                            x = true
                        } else {
                            if (A && A.applyToFile) {
                                x = true
                            }
                        }
                        return E(x)
                    })
                }
            }

            function j(z, A) {
                var D, B, C, E, x, y, F;
                if (o.length) {
                    C = [];
                    x = "";
                    F = "";
                    for (D = 0, B = o.length; D < B; D++) {
                        C.push("<li><b>" + TS.utility.htmlEntities(o[D].name) + "</b></li>")
                    }
                    if (o.length > 1) {
                        x = "<ul>" + C.join("\n") + "</ul>"
                    }
                    E = q - o.length;
                    y = "<p>" + (o.length === 1 ? "Try uploading a .zip version of this file instead." : "Try uploading .zip versions of these files instead.") + "</p>";
                    if (E) {
                        F = "<p>(Don't worry, your other " + (E > 1 ? "files are next." : "file is next.") + ")</p>"
                    }
                    TS.generic_dialog.start({
                        title: (o.length > 1 ? (o.length === q ? "All files unsupported" : "Some files unsupported") : "File unsupported"),
                        body: "<p>Sorry, " + (o.length === 1 ? "<b>" + TS.utility.htmlEntities(o[0].name) + "</b> is a type of file not " : (o.length === q ? " none of those file types are" : " some of those file types are not")) + " supported by Slack.</p>" + x + y + F,
                        show_cancel_button: false,
                        esc_for_ok: true,
                        on_go: function() {
                            TS.generic_dialog.end();
                            if (A) {
                                A()
                            }
                        }
                    })
                }
                return o.length
            }

            function u(C) {
                q = C.length;
                n(C.length);
                var A, B, x, y;
                for (var z = 0; z < C.length; z++) {
                    A = C[z];
                    x = A;
                    y = A;
                    if (A.isFile || A.isDirectory) {
                        B = A;
                        y = A
                    }
                    if (A.getAsEntry) {
                        B = A.getAsEntry();
                        y = B
                    } else {
                        if (A.webkitGetAsEntry) {
                            B = A.webkitGetAsEntry();
                            y = B
                        }
                    } if (typeof A.getAsFile === "function") {
                        x = A.getAsFile()
                    } else {
                        if (File && A instanceof File) {
                            x = A
                        }
                    } if (!y || !x) {
                        n(-1)
                    }(function(E, D) {
                        r(E, D, function(F) {
                            if (F) {
                                if (D.name) {
                                    o.push(D)
                                } else {
                                    o.push(E)
                                }
                                n(-1);
                                s()
                            } else {
                                if (E.size === 0) {
                                    n(-1)
                                } else {
                                    p(E)
                                }
                                s()
                            }
                        })
                    }(x, y))
                }
            }
            u(l);
            s()
        }, bindUploadUI: function() {
            $(".file_upload_btn").bind("click.file_menu", function(b) {
                TS.menu.startWithNewFileOptions(b, $(this));
                return false
            });
            $("#primary_file_button").bind("click.show_tip", function(b) {
                if (TS.tips.maybeDoThrobberProxyClick("message_input_tip_card_throbber", b)) {
                    return false
                }
                return false
            });
            $("#file-upload").bind("change", function() {
                if (!$(this).val()) {
                    return
                }
                var b = $(this)[0].files;
                if (b) {
                    if (!b.length) {
                        return
                    }
                    TS.view.filesSelected(b);
                    $("#file-upload").val("")
                }
            });
            $("body").bind("drop", function(c) {
                window.focus();
                c.preventDefault();
                $("body").removeClass("drop-target");
                if (TS.ui.checkForEditing(c)) {
                    return
                }
                var b;
                var f = (c && c.shiftKey);
                var d = c.originalEvent.dataTransfer;
                if (d) {
                    b = d.files || d.items
                }
                if (!b) {
                    return
                }
                TS.ui.validateFiles(b, f)
            });
            $("#drop-zone").unbind("click.dismiss").bind("click.dismiss", function() {
                $("body").removeClass("drop-target")
            });
            $(window).draghover().on({
                draghoverstart: function(f, d) {
                    if ($("body").hasClass("file_snippet")) {
                        return
                    }
                    if (TS.msg_edit.editing) {
                        return false
                    }
                    if (TS.ui.mouse_is_down) {
                        return
                    }
                    var g = false;
                    if (d && d.originalEvent && d.originalEvent.dataTransfer && d.originalEvent.dataTransfer.types) {
                        var c = d.originalEvent.dataTransfer.types;
                        for (var b = 0; b < c.length; b++) {
                            if (c[b].toLowerCase() == "files") {
                                g = true;
                                break
                            }
                        }
                    }
                    if (!g) {
                        return
                    }
                    $("body").addClass("drop-target");
                    TS.info("draghoverstart")
                },
                draghoverend: function() {
                    $("body").removeClass("drop-target");
                    TS.info("draghoverend")
                }
            })
        }, forceMarkAllRead: function(f) {
            TS.ui.dont_check_unreads_til_switch = false;
            TS.ui.markMostRecentReadMsg(true);
            if (f) {
                var c = TS.model.channels;
                var d = TS.model.ims;
                var b = TS.model.groups;
                var g;
                for (g = c.length - 1; g > -1; g--) {
                    TS.channels.markMostRecentReadMsg(c[g])
                }
                for (g = d.length - 1; g > -1; g--) {
                    TS.ims.markMostRecentReadMsg(d[g])
                }
                for (g = b.length - 1; g > -1; g--) {
                    TS.groups.markMostRecentReadMsg(b[g])
                }
            }
            TS.client.markLastReadsWithAPI()
        }, maybePromptForSetActive: function() {
            var b = TS.model.user;
            if (b.manual_presence != "away") {
                return
            }
            setTimeout(function() {
                if (b.manual_presence != "away") {
                    return
                }
                TS.generic_dialog.start({
                    unique: "set_active_prompt",
                    title: 'You are marked as "away"',
                    body: "Would you like to switch to appear active?",
                    show_cancel_button: true,
                    show_go_button: true,
                    go_button_text: "Yes, set me to active",
                    go_button_class: "btn-success",
                    cancel_button_text: "No, still away",
                    on_go: function() {
                        if (b.manual_presence == "away") {
                            TS.members.toggleUserPresence()
                        }
                    }
                })
            }, 2000)
        }, bindPlaceholder: function(c) {
            var b = c;
            var d = b.data("hint");
            b.addClass("placeholder").val(d);
            b.unbind("focus.placeholder").bind("focus.placeholder", function() {
                if (b.val() == d) {
                    b.removeClass("placeholder").val("")
                }
            }).unbind("blur.placeholder").bind("blur.placeholder", function() {
                if ($.trim(b.val()) == "") {
                    b.addClass("placeholder").val(d)
                }
            })
        }, enhanceComponents: function() {
            $('input[data-behavior="placeholder"]').each(function() {
                TS.ui.bindPlaceholder($(this))
            });
            $("#flexpane_tabs li a").on("shown", function(b) {
                TS.view.resizeManually("TS.ui.enhanceComponents")
            })
        }, isArrowKey: function(c) {
            var b = TS.utility.keymap;
            if (c == b.down) {
                return true
            }
            if (c == b.up) {
                return true
            }
            if (c == b.right) {
                return true
            }
            if (c == b.left) {
                return true
            }
            return false
        }, isPageKey: function(c) {
            var b = TS.utility.keymap;
            if (c == b.pageup) {
                return true
            }
            if (c == b.pagedown) {
                return true
            }
            if (c == b.home) {
                return true
            }
            if (c == b.end) {
                return true
            }
            return false
        }, startPostFromChatInput: function() {}, startSnippetFromChatInput: function() {
            TS.ui.snippet_dialog.startCreate(TS.view.input_el.val());
            TS.view.clearMessageInput()
        }, bindMessageInput: function() {
            var d = TS.view.input_el;
            d.bind("click", function(g) {});
            d.TS_tabComplete2({
                complete_cmds: true,
                complete_channels: true,
                complete_emoji: true,
                complete_member_specials: true,
                no_tab_out: true,
                onComplete: function(g) {
                    TS.utility.populateInput(d, g);
                    TS.ui.storeLastMsgInputForActive(d.val())
                },
                ui_initer: TS.ui.msg_tab_complete.start,
                suspended: true,
                sort_by_membership: true,
                new_cmds: TS.boot_data.feature_cmd_autocomplete
            });
            (function() {
                var h = 0;
                var j = 0;
                var i = 0.66;
                var g;
                d.bind("textchange", function(k, l) {
                    j++;
                    if (d.val() == "") {
                        h = 0;
                        j = 0
                    }
                });
                if (TS.channels && TS.channels.switched_sig) {
                    TS.channels.switched_sig.add(function() {
                        h = 0;
                        j = 0
                    })
                }
                d.removeClass("hidden").autosize({
                    boxOffset: 19,
                    callback: function() {
                        h++;
                        TS.ui.inputResized.apply(this, arguments);
                        var k = d.val();
                        if (k == "") {
                            h = 0;
                            j = 0
                        } else {
                            if (!g && k && k.length > 20 && j > 20 && h > 5 && h / j > i) {
                                TS.logError({
                                    message: "TS.ui: Excessive message input resize events"
                                }, document.querySelectorAll("#msgs_div .message").length + " messages in current channel. Resize vs. change count: " + h + " / " + j + " (" + (h / j) + ")");
                                g = true
                            }
                        }
                    }
                })
            }());
            var f = $("#special_formatting_text");
            d.attr("maxlength", "");
            d.bind("textchange", function(g, i) {
                var h = TS.utility.date.getTimeStamp();
                TS.ui.storeLastMsgInputForActive(d.val());
                c(g);
                if (TS.model.profiling_keys) {
                    TS.model.addProfilingKeyTime("input textchange", TS.utility.date.getTimeStamp() - h)
                }
                if (d.val().length > 2) {
                    if (!f.hasClass("showing")) {
                        f.transition({
                            opacity: 0.7
                        }, 600);
                        f.addClass("showing")
                    }
                } else {
                    if (f.hasClass("showing")) {
                        f.transition({
                            opacity: 0
                        }, 200);
                        f.removeClass("showing")
                    }
                }
            });
            $("#snippet_prompt .prompt, #snippet_prompt .warning .snippet_link, #snippet_prompt .warning .post_link").tooltip({
                container: "body"
            });

            function c(j) {
                var k = d.val();
                var i = false;
                var h = false;
                if ($.trim(k)) {
                    h = k.length > TS.model.input_maxlength;
                    var g = k.split("\n").length;
                    if (h || g > 1) {
                        i = true
                    }
                }
                if (i) {
                    if (h) {
                        $("#snippet_prompt .prompt").addClass("hidden");
                        $("#snippet_prompt .warning").removeClass("hidden")
                    } else {
                        $("#snippet_prompt .warning").addClass("hidden");
                        $("#snippet_prompt .prompt").removeClass("hidden")
                    }
                    $("#snippet_prompt").removeClass("hidden");
                    $("#notification_bar").addClass("showing_snippet_prompt")
                } else {
                    $("#snippet_prompt").addClass("hidden");
                    $("#notification_bar").removeClass("showing_snippet_prompt")
                }
            }
            d.bind("keyup", function(k) {
                var l = d.val();
                if (l) {
                    if (l.indexOf("/") != 0) {
                        TS.typing.userStarted(TS.shared.getActiveModelOb());
                        return
                    }
                    if (l.indexOf("/msg ") == 0) {
                        var j = l.replace("/msg ", "").split(" ")[0];
                        var m = TS.members.getMemberByName(j);
                        if (m) {
                            var h = TS.ims.getImByMemberId(m.id);
                            if (h) {
                                TS.typing.userStarted(h);
                                return
                            }
                        } else {
                            var i = j.replace("#", "");
                            var g = TS.channels.getChannelByName(i);
                            if (!g) {
                                g = TS.groups.getGroupByName(i)
                            }
                            if (g) {
                                TS.typing.userStarted(g);
                                return
                            }
                        }
                    }
                }
                TS.typing.userEnded(TS.shared.getActiveModelOb())
            });
            var b = function(g) {
                if (TS.view.input_el.val().length > TS.model.input_maxlength) {
                    $("#snippet_prompt").highlight(600, "", null, 0);
                    g.preventDefault()
                } else {
                    if (TS.view.submit(g)) {
                        TS.ui.resetMessageInput();
                        TS.ui.history.resetPosition("enter key")
                    } else {
                        TS.ui.addOrFlashEphemeralBotMsg({
                            channel: TS.model.active_cid,
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
            d.bind("keydown", function(j) {
                var l = TS.utility.date.getTimeStamp();
                var h = TS.utility.keymap;
                if (TS.ui.keyPressIsValidForGotoNextOpenChannelOrIM(j)) {
                    j.preventDefault();
                    if (TS.model.profiling_keys) {
                        TS.model.addProfilingKeyTime("input keydown", TS.utility.date.getTimeStamp() - l)
                    }
                    return
                }
                if (j.which == h.enter && j.metaKey && j.shiftKey) {
                    TS.ui.startSnippetFromChatInput()
                } else {
                    if (j.which == h.enter && (!j.shiftKey && !j.altKey && !j.ctrlKey)) {
                        if (j.which == h.enter && j.metaKey) {
                            TS.ui.startSnippetFromChatInput()
                        } else {
                            if ($.trim(d.val()) != "" && !TS.ui.cal_key_checker.prevent_enter) {
                                if ($("#chat_input_tab_ui").length && !$("#chat_input_tab_ui").hasClass("hidden") && TS.model.prefs.tab_ui_return_selects) {
                                    j.preventDefault();
                                    return
                                }
                                if (TS.model.prefs.enter_is_special_in_tbt && TS.utility.isCursorWithinTBTs(d)) {
                                    return
                                }
                                b(j)
                            }
                        }
                        j.preventDefault();
                        if (TS.model.profiling_keys) {
                            TS.model.addProfilingKeyTime("input keydown", TS.utility.date.getTimeStamp() - l)
                        }
                        return
                    } else {
                        if (j.which == h.shift) {} else {
                            if (j.which == h.enter && (j.ctrlKey || j.altKey)) {
                                if (!TS.model.is_mac || TS.model.is_FF) {
                                    var i = d.getCursorPosition();
                                    var k = d.val();
                                    d.val(k.substr(0, i) + "\n" + k.substr(i)).trigger("autosize").setCursorPosition(i + 1)
                                }
                            } else {
                                if (TS.model.prefs && TS.model.prefs.enter_is_special_in_tbt && j.which == h.enter && j.shiftKey && TS.utility.isCursorWithinTBTs(d)) {
                                    b(j)
                                }
                            }
                        } if ($("#chat_input_tab_ui").length && !$("#chat_input_tab_ui").hasClass("hidden")) {} else {
                            if (!d.val() && (TS.utility.cmdKey(j) || !TS.model.prefs.arrow_history) && j.which == h.up) {
                                TS.ui.maybeEditLast(j)
                            } else {
                                if (!j.shiftKey && (j.which == h.up || j.which == h.down)) {
                                    var g = d.getCursorRange();
                                    if (!g || g.l == 0) {
                                        if (j.which == h.up && (d.getCursorPosition() < 1)) {
                                            TS.ui.history.onArrowKey(j, d)
                                        } else {
                                            if (j.which == h.down && (d.getCursorPosition() >= d.val().length)) {
                                                TS.ui.history.onArrowKey(j, d)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } if (TS.model.profiling_keys) {
                    TS.model.addProfilingKeyTime("input keydown", TS.utility.date.getTimeStamp() - l)
                }
            })
        }, maybeEditLast: function(c) {
            c.preventDefault();
            c.stopPropagation();
            var b = TS.shared.getActiveModelOb();
            var d;
            if (b) {
                d = TS.utility.msgs.getEditableMsgByProp("user", TS.model.user.id, b.msgs);
                if (d) {
                    TS.msg_edit.startEdit(d.ts, TS.shared.getActiveModelOb());
                    return true
                }
            }
            TS.ui.playSound("beep");
            return false
        }, resetMessageInput: function() {
            TS.view.input_el.height(16);
            TS.view.measureInput();
            TS.view.input_el.blur()
        }, bindCommentInput: function() {
            $("#file_comment").bind("focus", function() {
                var c = $(this).closest(".flex_content_scroller");
                var b = c[0].scrollHeight;
                c.scrollTop(b)
            }).bind("keydown.cmd_submit", function(b) {
                if (b.which == TS.utility.keymap.enter && TS.utility.cmdKey(b)) {
                    $(this).closest("form").submit()
                }
            });
            if (!TS.model.is_mac) {
                $(".file_comment_tip").text("ctrl+enter to submit")
            }
        }, bindFlexUI: function() {
            $("#help_icon").on("click", function(b) {
                if (TS.help_dialog.showing) {
                    return
                }
                TS.help_dialog.start(($("#help_icon").hasClass("open") || $("#help_icon").hasClass("unread") ? "issues" : ""))
            });
            $("#flex_menu").on("click", function(b) {
                TS.menu.startWithFlexMenu(b)
            });
            $("#flex_toggle").on("click", TS.ui.toggleFlex)
        }, toggleFlex: function() {
            if (TS.model.ui_state.flex_visible) {
                TS.ui.hideFlex()
            } else {
                if (!TS.ui.active_tab_id) {
                    TS.ui.openFlexTab(TS.model.default_flex_name)
                } else {
                    var b = (TS.ui.active_tab_id == "list");
                    TS.ui.showFlex(b);
                    TS.client.flexDisplaySwitched(TS.ui.active_tab_id || "", TS.ui.last_flex_extra || "")
                }
            }
        }, hideFlex: function(c) {
            var b = function() {
                TS.ui.last_flex_extra = TS.model.flex_extra_in_url;
                $("#client-ui").removeClass("flex_pane_showing");
                TS.model.ui_state.flex_visible = false;
                TS.model.ui_state.flex_name = "";
                TS.model.ui_state.flex_extra = "";
                TS.storage.storeUIState(TS.model.ui_state);
                TS.view.resizeManually("TS.ui.hideFlex");
                TS.view.stopLocalTimeRefreshInterval();
                $("#search_container").append($("#channel_members_toggle")).append($("#channel_members"));
                $(".messages_banner").removeClass("flex_pane_showing");
                if (!c) {
                    TS.client.flexDisplaySwitched("", "")
                }
            };
            if (TS.ui.active_tab_id == "list") {
                $("#flex_contents").transition({
                    opacity: 0
                }, 100, b)
            } else {
                b()
            }
            $("#flex_toggle").attr("title", "Show Flexpane")
        }, showFlex: function(b, c) {
            var d = TS.ui.areMsgsScrolledToBottom();
            $("#client-ui").addClass("flex_pane_showing");
            TS.model.ui_state.flex_visible = true;
            TS.storage.storeUIState(TS.model.ui_state);
            if (!c) {
                TS.view.resizeManually("TS.ui.showFlex")
            }
            if (d) {
                TS.ui.instaScrollMsgsToBottom(false)
            }
            $("#channel_header").append($("#channel_members_toggle")).append($("#channel_members"));
            $(".messages_banner").addClass("flex_pane_showing");
            if (b) {
                $("#flex_contents").css("opacity", 0).transition({
                    opacity: 100
                }, 150)
            } else {
                $("#flex_contents").css("opacity", 100)
            } if (TS.ui.active_tab_id == "files" && TS.ui.last_flex_extra != "") {
                $("#file_preview_scroller").data("monkeyScroll").updateFunc(true)
            } else {
                if (TS.ui.active_tab_id == "activity") {
                    $("#activity_feed_scroller").data("monkeyScroll").updateFunc(true)
                }
            } if (TS.ui.active_tab_id == "team" && !TS.model.previewed_member_id) {
                TS.view.startLocalTimeRefreshInterval()
            }
            $("#flex_toggle").attr("title", "Hide Flexpane")
        }, last_flex_extra: null, active_tab_id: null, active_tab_ts: null, _displayFlexTab: function(c, b) {
            var f = $("#" + c + "_tab");
            if (!f.length) {
                return false
            }
            if (TS.ui.active_tab_id == "activity") {
                $("#activity_feed_scroller").hideWithRememberedScrollTop()
            } else {
                if (TS.ui.active_tab_id == "search") {
                    $("#search_results_container").hideWithRememberedScrollTop()
                }
            } if (!TS.model.ui_state.flex_visible) {
                TS.ui.showFlex(false, true)
            }
            if (c == "activity") {
                if (TS.model.team.activity && TS.model.team.activity.length) {} else {
                    TS.activity.fetchTeamActivity()
                }
            } else {
                if (c == "stars") {
                    if (TS.model.user && TS.model.user.stars && !TS.model.user.stars.length) {
                        TS.stars.fetchStarredItems(TS.model.user.id)
                    }
                } else {
                    if (c == "mentions") {
                        if (TS.model.user && TS.model.user.mentions && !TS.model.user.mentions.length) {
                            TS.mentions.fetchMentions()
                        }
                    } else {
                        if (c == "files") {} else {
                            if (c == "team") {
                                TS.view.startLocalTimeRefreshInterval()
                            }
                        }
                    }
                }
            } if (c != "team") {
                TS.view.stopLocalTimeRefreshInterval()
            }
            $("#flex_contents > .tab-pane").removeClass("active");
            f.addClass("active");
            var d = TS.ui.active_tab_id;
            TS.ui.active_tab_id = c;
            TS.ui.active_tab_ts = TS.utility.date.getTimeStamp();
            if (c == "activity") {
                if (!$("#activity_tab_activity").hasClass("hidden")) {
                    TS.activity.activityRead()
                }
                $("#activity_feed_scroller").unhideWithRememberedScrollTop();
                if (!b) {
                    TS.view.resizeManually("TS.ui._displayFlexTab flex_name:" + c)
                }
                $("#activity_feed_scroller").data("monkeyScroll").updateFunc(true)
            } else {
                if (c == "search") {
                    $("#search_results_container").unhideWithRememberedScrollTop();
                    $("#search_results").data("monkeyScroll").updateFunc()
                } else {
                    if (!b) {
                        TS.view.resizeManually("TS.ui._displayFlexTab flex_name:" + c)
                    }
                }
            } if (!TS.model.mac_ssb_version) {
                $("#deploy_disclaimer").removeClass("hidden")
            }
            return true
        }, openFlexTab: function(b) {
            if (!TS.ui._displayFlexTab(b)) {
                return
            }
            var c;
            if (b == "files") {
                c = TS.model.previewed_file_id
            } else {
                if (b == "team") {
                    c = TS.model.previewed_member_name;
                    if (TS.model.previewed_member_name) {
                        TS.activity.fetchIndividualActivity(TS.members.getMemberByName(TS.model.previewed_member_name), true)
                    }
                } else {
                    if (b == "search") {
                        c = TS.search.last_search_query
                    }
                }
            }
            TS.client.flexDisplaySwitched(b, c)
        }, setFlexStateFromHistory: function(b, f, c) {
            if (!b) {
                if (TS.model.ui_state.flex_name || c) {
                    TS.ui.hideFlex(true)
                }
                return
            }
            f = f || "";
            var d = TS.model.ui_state.flex_extra || "";
            if (!c && (b == TS.model.ui_state.flex_name && f == d)) {
                return
            }
            if (b == "list") {
                b = "files"
            }
            if (!TS.ui._displayFlexTab(b)) {
                return
            }
            if (b == "files") {
                TS.ui.showFilesFromHistory(f)
            } else {
                if (b == "team") {
                    TS.ui.showTeamFromHistory(f)
                } else {
                    if (b == "search") {
                        TS.ui.showSearchFromHistory(f)
                    } else {
                        TS.client.flexDisplaySwitched(b, null, false, true)
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
                TS.ui.openFlexTab("activity");
                return
            }
            b = TS.search.truncateQuery(b);
            $("#search_terms").val(b).data("textchange_lastvalue", b);
            $("#header_search_form").submit();
            TS.client.flexDisplaySwitched("search", b, false, true)
        }, preview_file_waiting_on: null, showFilesFromHistory: function(c) {
            if (!c) {
                TS.ui._displayFileList();
                TS.client.flexDisplaySwitched("files", null, false, true);
                return
            }
            var b = TS.files.getFileById(c);
            if (b) {
                TS.ui._displayFile(b.id);
                TS.client.flexDisplaySwitched("files", b.id, false, true);
                TS.files.fetchFileInfo(c)
            } else {
                TS.ui.preview_file_waiting_on = c;
                TS.files.fetchFileInfo(c, function(f, d) {
                    if (f != TS.ui.preview_file_waiting_on) {
                        return
                    }
                    TS.ui.preview_file_waiting_on = null;
                    if (d) {
                        TS.ui._displayFile(d.id);
                        TS.client.flexDisplaySwitched("files", d.id, false, true)
                    } else {
                        TS.ui._displayFileList();
                        TS.client.flexDisplaySwitched("files", null, true)
                    }
                })
            }
        }, showTeamFromHistory: function(b) {
            if (!b) {
                TS.ui._displayTeamList();
                TS.client.flexDisplaySwitched("team", null, false, true);
                return
            }
            var c = TS.members.getMemberByName(b);
            if (c) {
                TS.ui._displayMember(c.id);
                TS.client.flexDisplaySwitched("team", c.name, false, true)
            } else {
                TS.ui._displayTeamList();
                TS.client.flexDisplaySwitched("team", null, true)
            }
        }, $messages_input_container: null, $emo_menu: null, inputResized: function(c, b) {
            var d = TS.utility.date.getTimeStamp();
            if (!TS.ui.$messages_input_container) {
                TS.ui.$messages_input_container = $("#messages-input-container");
                TS.ui.$file_button = $("#primary_file_button");
                TS.ui.$emo_menu = $(".emo_menu")
            }
            TS.view.measureInput();
            TS.ui.$file_button.css("height", (TS.view.last_input_height) + "px");
            TS.view.resizeManually("TS.ui.inputResized original:" + c + " height:" + b);
            if (TS.view.last_input_height >= 115) {
                TS.view.input_el.removeClass("with-emoji-menu");
                TS.ui.$emo_menu.addClass("hidden")
            } else {
                if (TS.view.last_input_height < 96) {
                    TS.view.input_el.addClass("with-emoji-menu");
                    TS.ui.$emo_menu.removeClass("hidden")
                }
            } if (TS.model.profiling_keys) {
                TS.model.addProfilingKeyTime("inputResized " + c + " " + b, TS.utility.date.getTimeStamp() - d)
            }
        }, storeLastMsgInputForActive: function(b) {
            var c = TS.shared.getActiveModelOb();
            if (TS.model.input_history_index > -1) {
                if (TS.model.input_history[TS.model.input_history_index] != b) {
                    TS.ui.history.resetPosition("storeLastMsgInputForActive " + b)
                }
            }
            if (!c) {
                return
            }
            if (c.last_msg_input == b) {
                return
            }
            c.last_msg_input = b;
            TS.storage.storeLastMsgInput(c.id, c.last_msg_input)
        }, populateChatInput: function(b) {
            TS.utility.populateInput(TS.view.input_el, b);
            TS.ui.storeLastMsgInputForActive(b);
            TS.view.input_el.trigger("autosize-resize")
        }, populateChatInputWithLast: function() {
            var b = TS.shared.getActiveModelOb();
            if (!b) {
                return
            }
            TS.ui.history.resetPosition("populateChatInputWithLast");
            TS.view.input_el.TS_tabComplete2("suspend");
            TS.ui.populateChatInput(b.last_msg_input);
            TS.view.input_el.TS_tabComplete2("unsuspend");
            TS.view.input_el.TS_tabComplete2("changeoption", "member_prefix_required", b.is_slackbot_im)
        }, onSubmit: function(g, j) {
            try {
                var h = $.trim(g);
                if (!h) {
                    return
                }
                var k = (h == "/unarchive" || h == "/leave");
                var b = TS.shared.getActiveModelOb();
                if (!k && b && b.is_archived) {
                    alert("This channel has been archived and so you cannot currently send messages to it.");
                    TS.ui.populateChatInput(h);
                    return
                }
                TS.ui.history.add(g);
                TS.view.clearMessageInput();
                if (g.substr(0, 1) == "/" && g.substr(0, 2) != "//") {
                    var l = h.split(" ");
                    var d = l[0];
                    var c = $.trim(g.replace(d, ""));
                    var i;
                    if (TS.cmd_handlers[d] && TS.cmd_handlers[d].type == "client") {
                        setTimeout(function() {
                            TS.cmd_handlers.runCommand(d, c, l, j)
                        }, 10)
                    } else {
                        if (i = TS.utility.msgs.getEditLastShortcutCmd(g)) {
                            TS.utility.msgs.removeAllEphemeralMsgsByType("temp_slash_cmd_feedback", TS.model.active_cid);
                            TS.utility.msgs.tryToEditLastMsgFromShortcut(i)
                        } else {
                            TS.api.call("chat.command", {
                                agent: "webapp",
                                command: d,
                                text: c,
                                channel: TS.model.active_cid
                            }, TS.ui.onAPICommand)
                        }
                    }
                } else {
                    if (TS.model.active_channel_id) {
                        TS.channels.sendMsg(TS.model.active_channel_id, g)
                    } else {
                        if (TS.model.active_im_id) {
                            TS.ims.sendMsg(TS.model.active_im_id, g)
                        } else {
                            if (TS.model.active_group_id) {
                                TS.groups.sendMsg(TS.model.active_group_id, g)
                            } else {
                                return
                            }
                        }
                    }
                    TS.utility.msgs.removeAllEphemeralMsgsByType("temp_slash_cmd_feedback", TS.model.active_cid)
                } if (TS.ui.isUnreadDividerInView()) {
                    TS.ui.forceMarkAllRead()
                }
                if (TS.model.overlay_is_showing) {
                    TS.view.overlay.cancelFromSendingMessage()
                }
                if (TS.model.showing_welcome_2) {
                    TS.model.cancelled_welcome_2_this_session = true;
                    TS.view.unAdjustForWelcomeSlideShow();
                    TS.ui.instaScrollMsgsToBottom(true)
                }
            } catch (f) {
                TS.error(f)
            }
        }, prefCollapsibleChanged: function() {
            if (TS.model.prefs.collapsible) {
                TS.ui.makeChanColCollapsible()
            } else {
                TS.ui.makeChanColNOTCollapsible()
            } if (TS.ui.collapsible) {
                TS.ui.setUpCollapsibleUI()
            }
        }, prefColorNamesInListChanged: function() {
            if (TS.model.prefs.color_names_in_list) {
                $(".not_user_colored").removeClass("not_user_colored").addClass("user_colored")
            } else {
                $(".user_colored").removeClass("user_colored").addClass("not_user_colored")
            }
        }, onAPICommand: function(g, i, c) {
            var h = TS.model.active_cid;
            if (!g) {
                if (!TS.view.input_el.val()) {
                    TS.view.input_el.val(c.command + " " + c.text)
                }
                var b;
                var f = "*" + TS.utility.htmlEntities(c.command) + (c.text ? " " + TS.utility.htmlEntities(c.text) : "") + "*";
                if (i.error && i.error == "restricted_action") {
                    b = "" + f + " failed because you are not allowed to perform that action. Talk to your team owner."
                } else {
                    if (i.error && (i.error != "Unknown command" && i.error != "unknown_command")) {
                        b = "" + f + ' failed with the error "' + i.error + '".'
                    } else {
                        if (i.error) {
                            b = "" + f + ' is not a valid command. In Slack, all messages that start with the "/" character are interpreted as commands.\n\nIf you are trying to send a message and not run a command, try preceding the "/" with an empty space.'
                        } else {
                            b = "" + f + " failed with an unknown error."
                        }
                    }
                }
                TS.ui.addOrFlashEphemeralBotMsg({
                    text: b,
                    ephemeral_type: "temp_slash_cmd_feedback",
                    channel: h
                })
            }
            if (i.response) {
                if (i.keep_input) {
                    if (!TS.view.input_el.val()) {
                        TS.view.input_el.val(c.command + " " + c.text)
                    }
                }
                var d = h;
                if (c.channel && c.channel != d) {
                    if (TS.channels.getChannelById(c.channel)) {
                        d = c.channel
                    } else {
                        if (TS.ims.getImById(c.channel)) {
                            d = c.channel
                        } else {
                            if (TS.groups.getGroupById(c.channel)) {
                                d = c.channel
                            }
                        }
                    }
                }
                if (i.is_temp) {
                    TS.ui.addOrFlashEphemeralBotMsg({
                        text: i.response,
                        ephemeral_type: "temp_slash_cmd_feedback",
                        channel: d
                    })
                } else {
                    TS.utility.msgs.removeAllEphemeralMsgsByType("temp_slash_cmd_feedback", TS.model.active_cid);
                    TS.ui.addEphemeralBotMsg({
                        text: i.response,
                        channel: d
                    })
                }
            } else {
                if (g) {
                    TS.utility.msgs.removeAllEphemeralMsgsByType("temp_slash_cmd_feedback", TS.model.active_cid)
                }
            }
        }, is_limited_div_tim: 0, checkScrollBack: function() {
            var b = $(".is_limited_div:visible");
            if (!b.length) {
                return
            }
            TS.ui.cached_scroller_rect = (TS.ui.cached_scroller_rect || TS.view.msgs_scroller_div.dimensions_rect());
            if (TS.ui.isElInView(b, 5, TS.ui.cached_scroller_rect)) {
                if (b.hasClass("been_seen")) {
                    return
                }
                b.addClass("been_seen");
                b.css("background-color", "#fcc");
                TS.ui.is_limited_div_tim = setTimeout(function() {
                    b.css("background-color", "")
                }, 2000)
            } else {
                clearTimeout(TS.ui.is_limited_div_tim);
                b.removeClass("been_seen")
            }
        }, checkInlineImgsEverywhere: function(b) {
            TS.ui.checkInlineImgs("main", b);
            TS.ui.checkInlineImgs("search", b)
        }, checkInlineImgs: function(j, c) {
            var i;
            var h;
            if (j == "main") {
                i = TS.view.msgs_div;
                h = TS.ui.cached_scroller_rect = (TS.ui.cached_scroller_rect || TS.view.msgs_scroller_div.dimensions_rect())
            } else {
                if (j == "search") {
                    i = $("#search_results");
                    h = TS.ui.cached_search_scroller_rect = (TS.ui.cached_search_scroller_rect || i.dimensions_rect())
                } else {
                    TS.info("unknown which in checkInlineImgs(which)");
                    return
                }
            } if (c) {
                TS.info("checkInlineImgs which:" + j)
            }
            var f = i.find(".msg_inline_holder:not(.hidden) .msg_inline_child.hidden");
            var d;
            var b;
            var g;
            if (c) {
                $("#active_channel_name").find(".topic").html(f.length)
            }
            f.each(function(k) {
                b = $(this);
                g = b.closest(".msg_inline_holder");
                if (!g.length) {
                    return
                }
                d = g.dimensions_rect();
                if (c) {
                    TS.dir(0, d)
                }
                if (c) {
                    TS.dir(0, h)
                }
                if (TS.utility.doRectsOverlap(h, d)) {
                    if (c) {
                        TS.info("yes")
                    }
                    b.removeClass("hidden");
                    b.attr("src", b.data("real-src"));
                    b.error(function() {
                        $(this).closest(".msg_inline_holder").hide()
                    })
                } else {
                    if (c) {
                        TS.warn("no")
                    }
                }
                b = null;
                g = null
            })
        }, dont_check_unreads_til_switch: false, checkUnreads: function() {
            TS.ui.checkInlineImgs("main");
            TS.ui.checkScrollBack();
            if (!TS.ui.isUserAttentionOnChat()) {
                return
            }
            var b = TS.shared.getActiveModelOb();
            if (!b) {
                return
            }
            if (!TS.model.prefs) {
                return
            }
            if (!b.unread_cnt) {
                if (TS.view.last_read_msg_div && TS.view.last_read_msg_div.length) {
                    TS.ui.markMostRecentReadMsg()
                }
                TS.view.updateNewMsgsDisplay();
                return
            }
            if (TS.ui.dont_check_unreads_til_switch) {
                TS.view.updateNewMsgsDisplay();
                return
            }
            var h;
            var f = true;
            var c = b.unreads;
            var g = false;
            if (TS.model.prefs.mark_msgs_read_immediately) {
                f = true
            } else {
                if (g) {
                    for (var d = 0; d < c.length; d++) {
                        h = c[d];
                        if (TS.ui.reads.indexOf(h) > -1) {} else {
                            if (TS.ui.isMsgInView(h)) {
                                TS.ui.reads.push(h)
                            } else {
                                var j = TS.utility.msgs.getMsg(h, b.msgs);
                                if (!j || j.no_display) {
                                    TS.ui.reads.push(h)
                                } else {
                                    f = false
                                }
                            }
                        }
                    }
                } else {
                    if (b.oldest_unread_ts) {
                        f = TS.ui.isMsgInView(b.oldest_unread_ts)
                    }
                }
            } if (f && ((TS.view.last_read_msg_div && TS.view.last_read_msg_div.length) || !parseInt(b.last_read) || TS.model.prefs.mark_msgs_read_immediately)) {
                TS.ui.markMostRecentReadMsg()
            }
            TS.view.updateNewMsgsDisplay()
        }, logUnreads: function() {
            var f = [];
            var b = TS.shared.getActiveModelOb();
            var c = b.unreads;
            if (!b) {
                return
            }
            for (var d = 0; d < c.length; d++) {
                if (TS.ui.reads.indexOf(c[d]) == -1) {
                    f.push(c[d])
                }
            }
            TS.info(f)
        }, markMostRecentReadMsg: function(c) {
            var b = TS.shared.getActiveModelOb();
            if (TS.model.active_channel_id) {
                TS.channels.markMostRecentReadMsg(b)
            } else {
                if (TS.model.active_group_id) {
                    TS.groups.markMostRecentReadMsg(b)
                } else {
                    TS.ims.markMostRecentReadMsg(b)
                }
            } if (c) {
                TS.view.clearUnreadDivider()
            }
        }, isMsgInView: function(b) {
            var c = TS.view.getDivForMsg(b);
            if (!c.length) {
                return false
            }
            if (c.hasClass("hidden")) {
                return true
            }
            TS.ui.cached_scroller_rect = (TS.ui.cached_scroller_rect || TS.view.msgs_scroller_div.dimensions_rect());
            return TS.ui.isElInView(c, 5, TS.ui.cached_scroller_rect)
        }, isUnreadDividerInView: function(b) {
            b = b || 5;
            TS.ui.cached_scroller_rect = (TS.ui.cached_scroller_rect || TS.view.msgs_scroller_div.dimensions_rect());
            return TS.ui.isElInView(TS.view.msgs_unread_divider, b, TS.ui.cached_scroller_rect)
        }, isElInView: function(c, b, f) {
            if (!c || !c.length) {
                return false
            }
            b = b || 0;
            var d = c.dimensions_rect();
            if (d.height > f.height) {
                return TS.utility.doesRectContainRect(d, f, b, true)
            } else {
                if (TS.utility.doesRectContainRect(f, d, b, true)) {
                    return true
                }
            }
            return false
        }, scrollSoTopUnseenChannelIsInView: function(f) {
            var b = $("#channels_scroller");
            var c = b.find("LI.unread");
            if (c.length) {
                c.first().scrollintoview({
                    offset: "top",
                    px_offset: 50
                })
            } else {
                var d = $("#starred_div");
                if (d.length && d.length && !d.hasClass("hidden")) {
                    $("#starred_section_header").scrollintoview()
                } else {
                    $("#channels_header").scrollintoview()
                }
            }
        }, scrollSoBottomUnseenChannelIsInView: function(d) {
            var b = $("#channels_scroller");
            var c = b.find("LI.unread");
            if (c.length) {
                c.last().scrollintoview({
                    offset: "bottom",
                    px_offset: -50
                })
            } else {
                b.children().last().scrollintoview()
            }
        }, onChannelsScroll: function(b) {
            TS.ui.cached_channels_scroller_rect = null;
            TS.ui.checkUnseenChannelsImsGroupsWithUnreads();
            if (TS.ui.collapsible) {
                $("#col_channels_collapse_view").css("top", -$("#channels_scroller").scrollTop())
            }
        }, checkUnseenChannelsImsGroupsWithUnreads: function() {
            var b = $("#channels_scroller");
            TS.ui.cached_channels_scroller_rect = (TS.ui.cached_channels_scroller_rect || b.dimensions_rect());
            var h, f, g, d = false;
            var c = b.find("li.unread");
            if (c.length) {
                c.each(function() {
                    var i = $(this);
                    if (i.is(":visible") && !TS.ui.isElInView(i, 10, TS.ui.cached_channels_scroller_rect)) {
                        if (i.position().top < TS.ui.cached_channels_scroller_rect.top) {
                            h = true;
                            if (i.hasClass("mention")) {
                                g = true
                            }
                        } else {
                            f = true;
                            if (i.hasClass("mention")) {
                                d = true
                            }
                        }
                    }
                })
            }
            if (h) {
                $("#channel_scroll_up").removeClass("hidden unseen_have_mentions");
                if (g) {
                    $("#channel_scroll_up").addClass("unseen_have_mentions").find("span").html("unread mentions")
                } else {
                    $("#channel_scroll_up").find("span").html("more unreads")
                }
            } else {
                $("#channel_scroll_up").addClass("hidden").removeClass("unseen_have_mentions")
            } if (f) {
                $("#channel_scroll_down").removeClass("hidden unseen_have_mentions");
                if (d) {
                    $("#channel_scroll_down").addClass("unseen_have_mentions").find("span").html("unread mentions")
                } else {
                    $("#channel_scroll_down").find("span").html("more unreads")
                }
            } else {
                $("#channel_scroll_down").addClass("hidden").removeClass("unseen_have_mentions")
            }
        }, onMsgsScrollThrottled: function() {
            TS.ui.markScrollTop();
            if (TS.view.msgs_unread_divider && TS.shared.getActiveModelOb().unread_cnt) {
                if (TS.ui.isUnreadDividerInView()) {
                    TS.view.hideNewMsgsJumpLink();
                    $("#messages_unread_status").addClass("quiet")
                } else {
                    TS.view.showNewMsgsJumpLink();
                    $("#messages_unread_status").removeClass("quiet");
                    TS.view.showNewMsgsBar();
                    TS.view.startNewMsgsTimer()
                }
            }
            if (TS.ui.auto_scrolling_msgs) {
                return
            }
            TS.ui.checkUnreads()
        }, onMsgsScroll: function(b) {
            TS.utility.throttle.method(TS.ui.onMsgsScrollThrottled, "ts_ui_on_msgs_scroll", 250)
        }, markScrollTop: function() {
            var b;
            if (TS.ui.areMsgsScrolledToBottom()) {
                b = -1
            } else {
                b = TS.view.msgs_scroller_div[0].scrollTop
            }
            var c = false;
            if (TS.model.active_channel_id) {
                c = TS.channels.markScrollTop(TS.model.active_channel_id, b)
            } else {
                if (TS.model.active_im_id) {
                    c = TS.ims.markScrollTop(TS.model.active_im_id, b)
                } else {
                    if (TS.model.active_group_id) {
                        c = TS.groups.markScrollTop(TS.model.active_group_id, b)
                    }
                }
            } if (b == 0 && TS.shared.getActiveModelOb() && TS.shared.getActiveModelOb().id == TS.model.welcome_model_ob.id && TS.model.cancelled_welcome_2_this_session) {
                TS.model.cancelled_welcome_2_this_session = false;
                TS.view.adjustForWelcomeSlideShow();
                return
            }
            if (c) {
                TS.ui.maybeLoadScrollBackHistory()
            }
        }, maybeLoadScrollBackHistory: function() {
            if (TS.ui.active_highlight_count || TS.ui.mouse_is_down) {
                return
            }
            if (TS.model.active_channel_id) {
                TS.channels.maybeLoadScrollBackHistory(TS.model.active_channel_id)
            } else {
                if (TS.model.active_im_id) {
                    TS.ims.maybeLoadScrollBackHistory(TS.model.active_im_id)
                } else {
                    if (TS.model.active_group_id) {
                        TS.groups.maybeLoadScrollBackHistory(TS.model.active_group_id)
                    }
                }
            }
        }, areMsgsScrolledToBottom: function(c) {
            c = c || 50;
            var b = TS.view.msgs_scroller_div;
            var d = b[0];
            return (parseInt(b.css("height")) + d.scrollTop + c > d.scrollHeight)
        }, instaScrollMsgsToBottom: function(b) {
            TS.ui.instaScrollMsgsToPosition(TS.view.msgs_scroller_div[0].scrollHeight, b)
        }, slowScrollMsgsToBottom: function() {
            TS.view.msgs_scroller_div.animate({
                scrollTop: TS.view.msgs_scroller_div[0].scrollHeight
            }, "500")
        }, instaScrollMsgsToPosition: function(b, c) {
            TS.ui.auto_scrolling_msgs = true;
            TS.view.msgs_scroller_div.scrollTop(b);
            setTimeout(function() {
                TS.ui.auto_scrolling_msgs = false
            }, 100);
            if (c) {
                TS.ui.checkUnreads()
            }
        }, slowScrollMsgsToPosition: function(b, c, d) {
            TS.ui.auto_scrolling_msgs = true;
            TS.view.msgs_scroller_div.stop().animate({
                scrollTop: b
            }, "500", function() {
                setTimeout(function() {
                    TS.ui.auto_scrolling_msgs = false
                }, 100);
                if (c) {
                    TS.ui.checkUnreads()
                }
                if (d) {
                    d()
                }
            })
        }, scrollMsgsSoMsgIsInView: function(f, b, c) {
            var g = TS.view.getDivForMsg(f);
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
                TS.ui.active_highlight_count++
            }
            TS.ui.auto_scrolling_msgs = true;
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
                            TS.ui.active_highlight_count--
                        })
                    }
                    TS.ui.auto_scrolling_msgs = false;
                    TS.ui.onMsgsScroll()
                }
            })
        }, active_highlight_count: 0, scrollMsgsSoFirstUnreadMsgIsInView: function(b) {
            if (!TS.view.msgs_unread_divider) {
                return
            }
            var c = TS.view.msgs_unread_divider.prevAll(".message:not(.hidden)").first();
            if (c.length == 0 || true) {
                c = TS.view.msgs_unread_divider
            }
            TS.ui.auto_scrolling_msgs = true;
            c.scrollintoview({
                duration: 200,
                offset: "top",
                px_offset: 50,
                complete: function() {
                    setTimeout(function() {
                        TS.ui.auto_scrolling_msgs = false;
                        TS.ui.onMsgsScroll();
                        if (b) {
                            b()
                        }
                    }, 1)
                }
            })
        }, afterHistoryFetch: function(b) {
            setTimeout(function() {
                TS.view.rebuildMsgs();
                TS.view.resizeManually("TS.ui.afterHistoryFetch");
                if (b.scroll_top !== 0) {
                    return
                }
                if (!TS.ui.last_top_msg) {
                    return
                }
                TS.ui.scrollMsgsSoMsgIsInView(TS.ui.last_top_msg.ts, true);
                TS.ui.last_top_msg = null;
                setTimeout(function() {
                    if (b.scroll_top == 0) {
                        TS.info("TS.ui.afterHistoryFetch: we're still scrolled to the top, so we'll try to fetch more messages now");
                        TS.ui.maybeLoadScrollBackHistory()
                    }
                }, 1000)
            }, TS.ui.last_top_msg ? 0 : 0)
        }, rebuildMemberListToggle: function() {
            if (TS.model.active_channel_id || TS.model.active_group_id) {
                var b = TS.shared.getActiveModelOb();
                var d = 0;
                var f;
                for (var c = 0; c < b.members.length; c++) {
                    f = TS.members.getMemberById(b.members[c]);
                    if (f && !f.deleted) {
                        d++
                    }
                }
                $("#channel_members_toggle_count").text(d);
                $("#channel_members_toggle").removeClass("hidden")
            } else {
                $("#channel_members_toggle").addClass("hidden")
            }
        }, toggleMemberList: function() {
            if (TS.model.active_channel_id || TS.model.active_group_id) {
                if (TS.model.ui_state.member_list_visible) {
                    TS.ui.hideMemberList();
                    TS.model.ui_state.member_list_visible = false
                } else {
                    TS.ui.showMemberList();
                    TS.model.ui_state.member_list_visible = true
                }
                TS.storage.storeUIState(TS.model.ui_state)
            }
        }, hideMemberList: function() {
            $("#channel_members_toggle").find(".fa-caret-left").removeClass("hidden");
            $("#channel_members_toggle").find(".fa-caret-down").addClass("hidden");
            $("#channel_members").addClass("hidden");
            $(".messages_banner").removeClass("member_list_showing")
        }, showMemberList: function() {
            $("#channel_members_toggle").find(".fa-caret-left").addClass("hidden");
            $("#channel_members_toggle").find(".fa-caret-down").removeClass("hidden");
            $("#channel_members").removeClass("hidden");
            $(".messages_banner").addClass("member_list_showing");
            TS.ui.updateClosestMonkeyScroller($("#members_scroller"))
        }, bindChannelGroupImStarredLists: function() {
            var b = function(f) {
                if (!TS.model.socket_connected && !TS.model.change_channels_when_offline) {
                    f.preventDefault();
                    f.stopPropagation();
                    TS.ui.playSound("beep");
                    return false
                }
                if (TS.view.maybeFollowLink(f)) {
                    return
                }
                if (TS.ui.checkForEditing(f)) {
                    f.preventDefault();
                    return
                }
                var l = $(f.target);
                var d = l.closest(".im_name");
                var c = d.data("member-id");
                var k = l.closest(".group_name");
                var j = k.data("group-id");
                var h = l.closest(".channel_name");
                var g = h.data("channel-id");
                if (c) {
                    if (l.hasClass("im_close")) {
                        f.stopPropagation();
                        var i = TS.ims.getImByMemberId(c);
                        TS.ui.maybePromptForClosingIm(i.id)
                    } else {
                        f.stopPropagation();
                        TS.ims.startImByMemberId(c)
                    }
                } else {
                    if (j) {
                        if (l.hasClass("group_close")) {
                            f.stopPropagation();
                            TS.ui.maybePromptForClosingGroup(j)
                        } else {
                            f.stopPropagation();
                            TS.groups.displayGroup(j)
                        }
                    } else {
                        if (g) {
                            f.preventDefault();
                            TS.channels.displayChannel(g)
                        } else {
                            if (l.hasClass("channel-list-more")) {
                                TS.ui.list_browser_dialog.start("channels")
                            } else {
                                if (l.hasClass("channel-list-create")) {
                                    TS.ui.channel_create_dialog.start()
                                }
                            }
                        }
                    }
                }
                return false
            };
            $("#im-list").unbind("click").bind("click", b);
            $("#group-list").unbind("click").bind("click", b);
            $("#starred-list").unbind("click").bind("click", b);
            $("#channel-list").unbind("click").bind("click", b)
        }, maybePromptForClosingGroup: function(c) {
            var b = TS.groups.getGroupById(c);
            if (b.unread_cnt) {
                TS.generic_dialog.start({
                    title: "You have unread messages",
                    body: "You have unread messages in the " + TS.model.group_prefix + b.name + " group. Are you sure you want to close it?",
                    show_cancel_button: true,
                    show_go_button: true,
                    go_button_text: "Yes",
                    cancel_button_text: "No",
                    on_go: function() {
                        TS.groups.markMostRecentReadMsg(b);
                        TS.client.markLastReadsWithAPI();
                        if (b.is_open) {
                            TS.groups.closeGroup(b.id)
                        } else {
                            TS.groups.closeGroup(b.id)
                        }
                    }
                })
            } else {
                TS.groups.closeGroup(b.id)
            }
        }, maybePromptForClosingIm: function(c) {
            var b = TS.ims.getImById(c);
            if (b.unread_cnt) {
                TS.generic_dialog.start({
                    title: "You have unread messages",
                    body: "You have unread messages from " + b.name + ". Are you sure you want to close the DM?",
                    show_cancel_button: true,
                    show_go_button: true,
                    go_button_text: "Yes",
                    cancel_button_text: "No",
                    on_go: function() {
                        TS.ims.markMostRecentReadMsg(b);
                        TS.client.markLastReadsWithAPI();
                        TS.ims.closeIm(b.id)
                    }
                })
            } else {
                TS.ims.closeIm(b.id)
            }
        }, unread_checking_tim: 0, channelOrImOrGroupDisplaySwitched: function() {
            TS.ui.dont_check_unreads_til_switch = false;
            TS.ui.reads.length = 0;
            TS.ui.startUnreadCheckingTimer();
            TS.ui.rebuildMemberListToggle();
            if (TS.ui.collapsible && !TS.ui.collapsed && !TS.ui.collapse_moves_whole) {
                TS.ui.collapseChanCol()
            }
        }, startUnreadCheckingTimer: function() {
            clearTimeout(TS.ui.unread_checking_tim);
            var b = (TS.model.prefs && TS.model.prefs.mark_msgs_read_immediately) ? 0 : 1000;
            TS.ui.unread_checking_tim = setTimeout(TS.ui.checkUnreads, b)
        }, isUserAttentionOnChat: function() {
            if (!TS.ui.window_focused) {
                return false
            }
            if (TS.model.dialog_is_showing) {
                return false
            }
            if (TS.model.menu_is_showing) {
                return false
            }
            if (TS.model.tip_card_is_showing) {
                return false
            }
            if (TS.model.overlay_is_showing) {
                return false
            }
            if (TS.ui.msg_tab_complete.is_showing) {
                return false
            }
            return true
        }, teamFileCommentAdded: function(b, c) {
            if (TS.ui.active_tab_id == "files" && TS.model.previewed_file_id == b.id) {
                TS.ui.appendFileComment(b, c)
            }
        }, teamFileCommentEdited: function(b, c) {
            if (TS.ui.active_tab_id == "files" && TS.model.previewed_file_id == b.id) {
                TS.ui.updateFileComment(b, c)
            }
        }, teamFileCommentDeleted: function(b, c) {
            if (TS.ui.active_tab_id == "files" && TS.model.previewed_file_id == b.id) {
                TS.comments.ui.removeFileComment(b, c, function() {
                    $("#file_preview_scroller").data("monkeyScroll").updateFunc()
                })
            }
        }, teamFileChanged: function(b) {
            if (TS.ui.active_tab_id == "files" && TS.model.previewed_file_id == b.id) {
                TS.ui.rebuildFilePreview(b)
            }
        }, teamFileDeleted: function(b) {
            if (TS.ui.active_tab_id == "files" && TS.model.previewed_file_id == b.id) {
                TS.ui.showFileList()
            }
        }, storeLastCommentInputForPreviewedFile: function(b) {
            if (!TS.model.previewed_file_id) {
                return
            }
            TS.storage.storeLastCommentInput(TS.model.previewed_file_id, b)
        }, previewFile: function(g, b, f, d) {
            var c = TS.files.getFileById(g);
            if (TS.model.previewed_file_id == g && !$("#file_preview_scroller").is(":hidden")) {
                $("#file_preview_scroller").highlight(1500, "flex_highlight", false, 0)
            }
            if (!c) {
                TS.ui.preview_file_waiting_on = g;
                TS.files.fetchFileInfo(g, function(i, h) {
                    if (i != TS.ui.preview_file_waiting_on) {
                        return
                    }
                    TS.ui.preview_file_waiting_on = null;
                    if (h) {
                        TS.ui.previewFile(h.id, b, true)
                    }
                });
                return
            }
            if (!TS.ui._displayFile(g, b)) {
                return
            }
            TS.client.flexDisplaySwitched("files", g);
            if (d) {
                $("#file_comment").focus()
            }
            if (!f) {
                TS.files.fetchFileInfo(g)
            }
        }, _displayFile: function(d, b) {
            var c = TS.files.getFileById(d);
            if (!c) {
                return false
            }
            if (!TS.ui._displayFlexTab("files")) {
                return false
            }
            $("#back_from_file_preview").unbind();
            if (b == "member_preview") {
                $("#back_from_file_preview").html("<i class='fa fa-chevron-left back_icon'></i> Team Member").bind("click.back", function() {
                    TS.ui.previewMember(TS.model.previewed_member_id)
                })
            } else {
                if (b == "starred_items") {
                    $("#back_from_file_preview").html("<i class='fa fa-chevron-left back_icon'></i> Starred Items").bind("click.back", function() {
                        TS.ui.openFlexTab("stars")
                    })
                } else {
                    if (b == "activity_feed") {
                        $("#back_from_file_preview").html("<i class='fa fa-chevron-left back_icon'></i> Activity").bind("click.back", function() {
                            TS.ui.openFlexTab("activity")
                        })
                    } else {
                        if (b == "search_results") {
                            $("#back_from_file_preview").html("<i class='fa fa-chevron-left back_icon'></i> Search Results").bind("click.back", function() {
                                TS.ui.openFlexTab("search")
                            })
                        } else {
                            $("#back_from_file_preview").html("<i class='fa fa-chevron-left back_icon'></i> Files").bind("click.back", function() {
                                TS.ui.showFileList()
                            })
                        }
                    }
                }
            }
            TS.model.previewed_file_id = d;
            $("#file_list_container").hideWithRememberedScrollTop();
            $("#file_preview_container").unhideWithRememberedScrollTop();
            TS.ui.rebuildFilePreview(c);
            $("#file_preview_scroller").scrollTop(0);
            $("#file_comment_form").css("visibility", "");
            TS.view.resizeManually("TS.ui._displayFileList");
            return true
        }, rebuildFilePreview: function(c) {
            var d = TS.members.getMemberById(c.user);
            var b = TS.files.getFileActions(c);
            var m = {
                file: c,
                member: d,
                user: TS.model.user,
                show_revoke_public_link: b.revoke_public_link
            };
            var g = "";
            switch (c.mode) {
                case "snippet":
                    g = TS.templates.file_snippet_preview_head_section(m);
                    break;
                case "post":
                    g = TS.templates.file_post_preview_head_section(m);
                    break;
                case "email":
                    g = TS.templates.file_email_preview_head_section(m);
                    break;
                case "hosted":
                case "external":
                    m.external_filetype_html = TS.templates.builders.makeExternalFiletypeHTML(c);
                default:
                    m.lightbox = false;
                    if (c.thumb_360_w == 360 || c.thumb_360_h == 360) {
                        m.lightbox = true
                    }
                    g = TS.templates.file_preview_head_section(m);
                    break
            }
            var f = $("#file_preview_scroller").find("#file_preview_head_section");
            f.html(g);
            TS.view.makeSureAllLinksHaveTargets(f);
            var m = {
                file: c
            };
            var l = $("#file_preview_scroller").find("#file_preview_comments_section");
            l.html(TS.templates.comments(m));
            TS.view.makeSureAllLinksHaveTargets(l);
            if (c.id != TS.model.last_previewed_file_id) {
                $("#file_comment_form #file_comment").val(TS.storage.fetchLastCommentInput(c.id)).trigger("keyup")
            }
            if (c.mode == "email") {}
            TS.model.last_previewed_file_id = c.id;
            if (c.content && c.mode == "snippet") {
                $("#truncated_message").addClass("hidden");
                var j = !!TS.model.code_wrap_long_lines;
                var n = TS.templates.makeFileContentsDomId(c);
                var k = c.content;
                var i = 51200 / 2;
                if (c.content.length > i) {
                    k = c.content.substr(0, i) + "\r\r..."
                }
                var h = CodeMirror(function(p) {
                    var o = document.getElementById(n);
                    o.parentNode.replaceChild(p, o)
                }, {
                    value: k,
                    lineNumbers: true,
                    matchBrackets: true,
                    indentUnit: 4,
                    indentWithTabs: true,
                    viewportMargin: Infinity,
                    readOnly: true,
                    lineWrapping: j
                });
                $("#file_preview_wrap_cb").bind("change", function(o) {
                    TS.model.code_wrap_long_lines = $(this).prop("checked");
                    h.setOption("lineWrapping", TS.model.code_wrap_long_lines)
                });
                $("#file_preview_wrap_cb").prop("checked", j);
                CodeMirror.switchSlackMode(h, c.filetype);
                setTimeout(function() {
                    h.refresh();
                    $("#file_preview_scroller").data("monkeyScroll").updateFunc()
                }, 0);
                if (k != c.content) {
                    $("#truncated_message").removeClass("hidden")
                }
            }
            $("#file_preview_scroller").data("monkeyScroll").updateFunc();
            if ($("#file_comment").is(":focus") || TS.utility.getActiveElementProp("id") == "file_comment") {
                $("#file_comment_submit_btn").scrollintoview({
                    offset: "bottom",
                    px_offset: -50,
                    duration: 0
                })
            }
        }, bindFileUI: function() {
            $("#file_list_heading").bind("click.show_menu", function(b) {
                b.preventDefault();
                TS.menu.startWithFileFilter(b)
            });
            $("#file_list_clear_filter").bind("click.clear_filter", function(b) {
                b.stopPropagation();
                TS.view.fileClearFilter()
            });
            $("#file_list_toggle_all").bind("click.toggleList", function() {
                TS.ui.toggleFileList("all")
            });
            $("#file_list_toggle_user").bind("click.toggleList", function() {
                var b = $("#file_list").data("filter-user");
                if (b) {
                    TS.ui.toggleFileList(b)
                } else {
                    TS.ui.toggleFileList(TS.model.user.id)
                }
            });
            $("#file_list_toggle_users").bind("click.show_menu", function(b) {
                b.preventDefault();
                TS.menu.startWithFileMemberFilter(b)
            })
        }, fileRevokePublicLink: function(c) {
            var b = TS.files.getFileById(c);
            if (!b) {
                return false
            }
            TS.generic_dialog.start({
                title: "Revoke public file link",
                body: '<p class="no_bottom_margin">This will disable the Public Link for this file. This will cause any previously shared links to stop working.<br /><br />Are you sure you want to revoke this public link?</p>',
                go_button_text: "Revoke it",
                on_go: function() {
                    TS.files.upsertAndSignal({
                        id: b.id,
                        public_url_shared: false
                    });
                    TS.api.callImmediately("files.revokePublicURL", {
                        file: b.id
                    })
                }
            })
        }, showFileList: function() {
            if (!TS.ui._displayFileList()) {
                return
            }
            $("#search_tabs").hide();
            TS.client.flexDisplaySwitched("files")
        }, filterFileList: function(b) {
            if (b == "all") {
                TS.model.active_file_list_filter = b;
                TS.view.fileClearFilter()
            } else {
                if (b == "user") {
                    TS.view.fileClearFilter();
                    TS.ui.toggleFileList(TS.model.user.id)
                } else {
                    if (b.indexOf("U") == 0) {
                        TS.ui.toggleFileList(b)
                    } else {
                        TS.model.active_file_list_filter = b;
                        TS.view.file_list_heading = TS.model.file_list_type_map[b];
                        TS.model.file_list_types = [b];
                        TS.view.fileFilterSet();
                        $("#file_list_clear_filter").removeClass("hidden")
                    }
                }
            }
        }, toggleFileList: function(h) {
            var b = $("#file_list"),
                c = $("#file_list_toggle_all"),
                f = $("#file_list_toggle_user"),
                d = $("#file_list_toggle_users");
            if (b.data("list") == h) {
                return
            }
            b.data("list", h);
            if (h == "all") {
                TS.model.active_file_list_member_filter = "all";
                f.text("Just You").removeClass("active");
                d.removeClass("active");
                c.addClass("active");
                b.data("filter-user", TS.model.user.id)
            } else {
                var g = TS.members.getMemberById(h);
                if (g) {
                    TS.model.active_file_list_member_filter = h;
                    c.removeClass("active");
                    f.addClass("active");
                    d.addClass("active");
                    if (g.id == TS.model.user.id) {
                        f.text("Just You")
                    } else {
                        f.text(g.name)
                    }
                    b.data("filter-user", h)
                } else {
                    TS.error(h + " is not valid?")
                }
            }
            TS.view.fileFilterSet()
        }, _displayFileList: function() {
            if (!TS.ui._displayFlexTab("files", true)) {
                return false
            }
            TS.model.previewed_file_id = "";
            $("#file_list_container").unhideWithRememberedScrollTop();
            $("#file_preview_container").hideWithRememberedScrollTop();
            TS.view.resizeManually("TS.ui._displayFileList");
            return true
        }, submitFileComment: function() {
            var b = TS.format.cleanMsg($("#file_comment_form #file_comment").val());
            if (!b) {
                TS.ui.playSound("beep");
                return
            }
            $("#file_comment_form #file_comment").val("").trigger("keyup");
            TS.files.addComment(TS.model.previewed_file_id, b, function(d, f, c) {
                if (d) {
                    TS.storage.storeLastCommentInput(c.file, "")
                } else {
                    alert("error: comment not added to file");
                    if (c.file == TS.model.last_previewed_file_id) {
                        $("#file_comment_form #file_comment").val(TS.storage.fetchLastCommentInput(c.file)).trigger("keyup")
                    }
                }
            })
        }, appendFileComment: function(d, h) {
            var c = $("#file_comments_" + d.id);
            var g = false;
            var b = h.user == TS.model.user.id;
            var f = b || TS.model.user.is_admin;
            if (b || f) {
                g = true
            }
            c.append(TS.templates.comment({
                comment: h,
                file: d,
                show_comment_actions: g
            }));
            TS.view.makeSureAllLinksHaveTargets(c);
            if (h.user == TS.model.user.id) {
                $("#file_comment_submit_btn").scrollintoview({
                    offset: "bottom",
                    px_offset: -50,
                    duration: 0
                })
            }
            $("#file_preview_scroller").data("monkeyScroll").updateFunc()
        }, updateFileComment: function(c, h) {
            var d = $("#" + h.id);
            var g = false;
            var b = h.user == TS.model.user.id;
            var f = b || TS.model.user.is_admin;
            if (b || f) {
                g = true
            }
            d.replaceWith(TS.templates.comment({
                comment: h,
                file: c,
                show_comment_actions: g
            }));
            TS.view.makeSureAllLinksHaveTargets(d);
            $("#file_preview_scroller").data("monkeyScroll").updateFunc()
        }, previewMember: function(d, b) {
            if (!TS.ui._displayMember(d, b)) {
                return
            }
            var c = TS.members.getMemberById(d);
            TS.client.flexDisplaySwitched("team", c.name)
        }, _displayMember: function(c, i) {
            var d = TS.members.getMemberById(c);
            if (!d) {
                return false
            }
            if (!TS.ui._displayFlexTab("team")) {
                return false
            }
            TS.model.previewed_member_name = d.name;
            TS.model.previewed_member_id = d.id;
            TS.info("TS.model.previewed_member_name:" + TS.model.previewed_member_name);
            var f;
            var k = !d.is_slackbot;
            if (d.is_ultra_restricted || TS.model.user.is_ultra_restricted) {
                k = false
            }
            var j = !d.is_slackbot;
            if (d.is_ultra_restricted || TS.model.user.is_ultra_restricted) {
                j = false
            } else {
                if (!TS.model.user.is_admin && d.is_restricted) {
                    j = false
                }
            } if (d.is_self) {
                f = TS.templates.team_member_edit({
                    member: d,
                    presence_str: TS.view.getUserPresenceStr()
                })
            } else {
                f = TS.templates.team_member_preview({
                    member: d,
                    show_group_invite: k && TS.model.allow_invite_to_group_from_person,
                    show_group_create: k,
                    show_channel_invite: j,
                    im: TS.ims.getImByMemberId(d.id)
                })
            }
            $("#team_list_container").hideWithRememberedScrollTop();
            $("#member_preview_container").unhideWithRememberedScrollTop();
            var h = $("#member_preview_scroller");
            h.html(f);
            TS.view.makeSureAllLinksHaveTargets(h);
            if (TS.model.last_previewed_member_id != TS.model.previewed_member_id) {
                $("#member_preview_scroller").scrollTop(0)
            }
            if (TS.model.user.is_restricted) {
                $(".team_member_activity_list").addClass("hidden")
            } else {
                $(".team_member_activity_list").removeClass("hidden");
                TS.activity.fetchIndividualActivity(d, true)
            }
            TS.model.last_previewed_member_id = d.id;
            var g = $("#member_activity_list");
            g.html(TS.templates.builders.activityIndividualListHTML(d));
            TS.view.makeSureAllLinksHaveTargets(g);
            var b = $("#back_from_member_preview");
            b.unbind();
            if (i == "file_list" || i == "file_preview") {
                b.html("<i class='fa fa-chevron-left back_icon'></i> Files").bind("click.back", function() {
                    TS.ui.openFlexTab("files")
                })
            } else {
                if (i == "activity_feed") {
                    b.html("<i class='fa fa-chevron-left back_icon'></i> Activity").bind("click.back", function() {
                        TS.ui.openFlexTab("activity")
                    })
                } else {
                    if (i == "search_results") {
                        b.html("<i class='fa fa-chevron-left back_icon'></i> Search Results").bind("click.back", function() {
                            TS.ui.openFlexTab("search")
                        })
                    } else {
                        b.html("<i class='fa fa-chevron-left back_icon'></i> Team Directory").bind("click.back", function() {
                            TS.ui.showTeamList()
                        })
                    }
                }
            }
            TS.view.stopLocalTimeRefreshInterval();
            TS.view.resizeManually("TS.ui._displayMember");
            h.find(".member_details .member_image").click(function(l) {
                TS.ui._toggleLargeMemberImage(d, this);
                return false
            });
            return true
        }, _toggleLargeMemberImage: function(f, b) {
            var c = $(b).closest(".member_details");
            var d = "";
            if (c.hasClass("expanded_member_image")) {
                $(b).removeClass("thumb_192").addClass("thumb_72");
                c.removeClass("expanded_member_image");
                if (!TS.utility.is_retina) {
                    if (f.is_restricted) {
                        d += 'url("/img/avatar_overlays.png"), '
                    }
                    d += 'url("' + f.profile.image_72 + '")'
                }
            } else {
                $(b).removeClass("thumb_72").addClass("thumb_192");
                c.addClass("expanded_member_image");
                if (!TS.utility.is_retina) {
                    if (f.is_restricted) {
                        d += 'url("/img/avatar_overlays.png"), '
                    }
                    d += 'url("' + f.profile.image_192 + '")'
                }
            } if (d) {
                $(b).css("background-image", d)
            }
        }, individualActivityFetched: function(d) {
            if (d.id != TS.model.previewed_member_id) {
                return
            }
            var c = $("#member_activity_list");
            c.html(TS.templates.builders.activityIndividualListHTML(d));
            var b = $("#activity_member_load_more");
            if (b.data("ladda") == undefined) {
                b.data("ladda", Ladda.create(document.querySelector("#activity_member_load_more")));
                b.bind("click.fetchMoreActivity", function(g) {
                    var f = b.data("member-id");
                    TS.activity.expandIndividual(f);
                    $(this).data("ladda").start()
                })
            } else {
                $("#activity_member_load_more").data("ladda").stop()
            }
            TS.ui.updateClosestMonkeyScroller(c);
            TS.view.makeSureAllLinksHaveTargets(c)
        }, showTeamList: function() {
            if (!TS.ui._displayTeamList()) {
                return
            }
            TS.client.flexDisplaySwitched("team")
        }, _displayTeamList: function() {
            if (!TS.ui._displayFlexTab("team")) {
                return false
            }
            TS.model.previewed_member_name = "";
            TS.model.previewed_member_id = "";
            $("#member_preview_container").hideWithRememberedScrollTop();
            $("#team_list_container").unhideWithRememberedScrollTop();
            TS.view.resizeManually("TS.ui._displayTeamList");
            return true
        }, showStatusForm: function(c) {
            if ($("#user_status_form").data("last_div_id")) {
                TS.ui.removeStatusForm($("#user_status_form").data("last_div_id"))
            }
            var b = TS.templates.user_status_form({
                user: TS.model.user,
                div_id: c
            });
            var d = $("#" + c);
            d.addClass("hidden");
            d.after(b);
            $("#user_status_form").data("last_div_id", c);
            $("#user_status_input").select()
        }, submitUserStatus: function(c) {
            var b = $("#user_status_input").val();
            TS.members.setUserStatus(b);
            TS.ui.removeStatusForm(c);
            return false
        }, removeStatusForm: function(b) {
            var c = $("#" + b);
            c.removeClass("hidden");
            $("#user_status_form").remove()
        }, gotoNextOpenChannelOrIM: function(i, c) {
            var b = TS.shared.getActiveModelOb();
            var f = $("#channels_scroller");
            var j = (i) ? "LI.unread, LI.active" : "LI";
            var h = f.find(j);
            if (!h.length) {
                TS.error('no $lis found for "' + j + '"');
                return
            }
            var d = h.filter(".active");
            if (!d.length) {
                TS.error("active li not found");
                return
            }
            if (!d.length > 1) {
                TS.error("too many active $lis found");
                return
            }
            var g;
            if (c) {
                g = h.eq(h.index(d) - 1);
                if (!g.length) {
                    g = h.last()
                }
            } else {
                g = h.eq(h.index(d) + 1);
                if (!g.length) {
                    g = h.first()
                }
            } if (g) {
                if (g.hasClass("channel")) {
                    TS.channels.displayChannel(g.find("A").data("channel-id"))
                } else {
                    if (g.hasClass("group")) {
                        TS.groups.displayGroup(g.find("A").data("group-id"))
                    } else {
                        if (g.hasClass("member")) {
                            TS.ims.startImByMemberId(g.find("A").data("member-id"))
                        }
                    }
                }
            }
        }, makeEmoticonList: function() {
            TS.ui.emoticon_groups = [];
            TS.ui.emoji_names = [];
            var h = [{
                name: "grinning",
                emoji_names: ["grinning", "grin", "joy", "smiley", "smile", "sweat_smile", "satisfied", "innocent", "smiling_imp", "wink", "blush", "yum", "relieved", "heart_eyes", "sunglasses", "smirk", "neutral_face", "expressionless", "unamused", "sweat", "pensive", "confused", "confounded", "kissing", "kissing_heart", "kissing_smiling_eyes", "kissing_closed_eyes", "stuck_out_tongue", "stuck_out_tongue_winking_eye", "stuck_out_tongue_closed_eyes", "disappointed", "worried", "angry", "rage", "cry", "persevere", "triumph", "disappointed_relieved", "frowning", "anguished", "fearful", "weary", "sleepy", "tired_face", "grimacing", "sob", "open_mouth", "hushed", "cold_sweat", "scream", "astonished", "flushed", "sleeping", "dizzy_face", "no_mouth", "relaxed", "mask", "smile_cat", "joy_cat", "smiley_cat", "heart_eyes_cat", "smirk_cat", "kissing_cat", "pouting_cat", "crying_cat_face", "scream_cat", "no_good", "ok_woman", "bow", "see_no_evil", "hear_no_evil", "speak_no_evil", "raising_hand", "raised_hands", "person_frowning", "person_with_pouting_face", "bust_in_silhouette", "busts_in_silhouette", "boy", "girl", "man", "woman", "family", "couple", "two_men_holding_hands", "two_women_holding_hands", "cop", "dancers", "bride_with_veil", "person_with_blond_hair", "man_with_gua_pi_mao", "man_with_turban", "older_man", "older_woman", "baby", "construction_worker", "princess", "japanese_ogre", "japanese_goblin", "ghost", "angel", "alien", "space_invader", "imp", "skull", "information_desk_person", "guardsman"]
            }, {
                name: "rat",
                emoji_names: ["rat", "mouse2", "ox", "water_buffalo", "cow2", "tiger2", "leopard", "rabbit2", "cat2", "dragon", "crocodile", "whale2", "snail", "snake", "racehorse", "ram", "goat", "sheep", "monkey", "rooster", "chicken", "dog2", "pig2", "boar", "elephant", "octopus", "shell", "bug", "ant", "honeybee", "beetle", "fish", "tropical_fish", "blowfish", "turtle", "hatching_chick", "baby_chick", "hatched_chick", "bird", "penguin", "koala", "poodle", "dromedary_camel", "camel", "flipper", "mouse", "cow", "tiger", "rabbit", "cat", "dragon_face", "whale", "horse", "monkey_face", "dog", "pig", "frog", "hamster", "wolf", "bear", "panda_face", "pig_nose", "paw_prints", "eyes", "ear", "nose", "lips", "tongue", "point_up", "fist", "raised_hand", "v", "point_up_2", "point_down", "point_left", "point_right", "punch", "wave", "ok_hand", "thumbsup", "thumbsdown", "clap", "open_hands"]
            }, {
                name: "hamburger",
                emoji_names: ["hamburger", "coffee", "pizza", "meat_on_bone", "poultry_leg", "rice_cracker", "rice_ball", "rice", "curry", "ramen", "spaghetti", "bread", "fries", "sweet_potato", "dango", "oden", "sushi", "fried_shrimp", "fish_cake", "icecream", "shaved_ice", "ice_cream", "doughnut", "cookie", "chocolate_bar", "candy", "lollipop", "custard", "honey_pot", "cake", "bento", "stew", "egg", "fork_and_knife", "tea", "sake", "wine_glass", "cocktail", "tropical_drink", "beer", "beers", "baby_bottle", "mushroom", "tomato", "eggplant", "grapes", "melon", "watermelon", "tangerine", "lemon", "banana", "pineapple", "apple", "green_apple", "pear", "peach", "cherries", "strawberry", "chestnut", "seedling", "evergreen_tree", "deciduous_tree", "palm_tree", "cactus", "tulip", "cherry_blossom", "rose", "hibiscus", "sunflower", "blossom", "corn", "ear_of_rice", "herb", "four_leaf_clover", "maple_leaf", "fallen_leaf", "leaves"]
            }, {
                name: "sunny",
                emoji_names: ["sunny", "cloud", "telephone", "umbrella", "spades", "clubs", "hearts", "diamonds", "recycle", "wheelchair", "warning", "copyright", "registered", "tm", "zap", "soccer", "baseball", "snowman", "partly_sunny", "no_entry", "golf", "sailboat", "fuelpump", "scissors", "ballot_box_with_check", "white_check_mark", "airplane", "envelope", "pencil2", "black_nib", "heavy_check_mark", "heavy_multiplication_x", "sparkles", "snowflake", "x", "negative_squared_cross_mark", "question", "heavy_exclamation_mark", "bangbang", "interrobang", "heart", "heavy_plus_sign", "heavy_minus_sign", "heavy_division_sign", "star", "o", "black_joker", "cyclone", "foggy", "closed_umbrella", "sunrise", "ocean", "earth_africa", "earth_americas", "earth_asia", "globe_with_meridians", "waxing_crescent_moon", "waning_gibbous_moon", "last_quarter_moon", "waning_crescent_moon", "crescent_moon", "new_moon_with_face", "first_quarter_moon_with_face", "last_quarter_moon_with_face", "full_moon_with_face", "sun_with_face", "star2", "ribbon", "gift", "birthday", "jack_o_lantern", "christmas_tree", "santa", "fireworks", "sparkler", "balloon", "tada", "confetti_ball", "tanabata_tree", "crossed_flags", "bamboo", "dolls", "flags", "wind_chime", "rice_scene", "school_satchel", "mortar_board", "microphone", "movie_camera", "cinema", "headphones", "art", "tophat", "circus_tent", "ticket", "clapper", "performing_arts", "video_game", "dart", "slot_machine", "8ball", "game_die", "bowling", "flower_playing_cards", "musical_note", "notes", "saxophone", "guitar", "musical_keyboard", "trumpet", "violin", "musical_score", "tennis", "ski", "basketball", "checkered_flag", "snowboarder", "running", "surfer", "trophy", "horse_racing", "football", "rugby_football", "swimmer", "dancer", "lipstick", "nail_care", "massage", "haircut", "barber", "syringe", "pill"]
            }, {
                name: "kiss",
                emoji_names: ["kiss", "love_letter", "ring", "gem", "couplekiss", "bouquet", "couple_with_heart", "wedding", "heartbeat", "broken_heart", "two_hearts", "sparkling_heart", "heartpulse", "cupid", "blue_heart", "green_heart", "yellow_heart", "purple_heart", "gift_heart", "revolving_hearts", "heart_decoration", "diamond_shape_with_a_dot_inside", "bulb", "anger", "bomb", "zzz", "collision", "sweat_drops", "droplet", "dash", "shit", "muscle", "dizzy", "speech_balloon", "thought_balloon", "heavy_dollar_sign", "credit_card", "yen", "dollar", "euro", "pound", "money_with_wings", "seat", "computer", "briefcase", "minidisc", "floppy_disk", "cd", "dvd", "file_folder", "open_file_folder", "page_with_curl", "page_facing_up", "date", "card_index", "chart_with_upwards_trend", "chart_with_downwards_trend", "bar_chart", "pushpin", "round_pushpin", "paperclip", "notebook", "open_book", "books", "pencil", "telephone_receiver", "pager", "fax", "satellite", "loudspeaker", "mega", "outbox_tray", "inbox_tray", "package", "mailbox_closed", "mailbox", "mailbox_with_mail", "mailbox_with_no_mail", "postbox", "postal_horn", "newspaper", "iphone", "no_mobile_phones", "camera", "video_camera", "tv", "radio", "vhs", "low_brightness", "high_brightness", "mute", "sound", "speaker", "battery", "electric_plug", "mag", "mag_right", "lock_with_ink_pen", "closed_lock_with_key", "key", "lock", "unlock", "bell", "no_bell", "bookmark", "link", "radio_button", "underage", "fire", "flashlight", "wrench", "hammer", "nut_and_bolt", "hocho", "gun", "microscope", "telescope", "crystal_ball", "clock3", "pray"]
            }, {
                name: "rocket",
                emoji_names: ["rocket", "helicopter", "steam_locomotive", "train", "bullettrain_side", "bullettrain_front", "train2", "light_rail", "station", "tram", "bus", "oncoming_bus", "trolleybus", "busstop", "minibus", "ambulance", "fire_engine", "police_car", "oncoming_police_car", "taxi", "oncoming_taxi", "red_car", "oncoming_automobile", "blue_car", "truck", "articulated_lorry", "tractor", "monorail", "mountain_railway", "suspension_railway", "mountain_cableway", "aerial_tramway", "ship", "rowboat", "speedboat", "traffic_light", "vertical_traffic_light", "construction", "rotating_light", "triangular_flag_on_post", "door", "house", "house_with_garden", "european_post_office", "convenience_store", "school", "no_entry_sign", "smoking", "no_smoking", "put_litter_in_its_place", "bike", "no_bicycles", "bicyclist", "mountain_bicyclist", "walking", "no_pedestrians", "mens", "womens", "toilet", "shower", "bath", "bathtub", "cn", "de", "es", "fr", "uk", "it", "jp", "kr", "ru", "us"]
            }];
            if (TS.model.all_custom_emoji && TS.model.all_custom_emoji.length) {
                h.push({
                    name: "slack",
                    emoji_names: TS.model.all_custom_emoji
                })
            }
            var n = [];
            for (var p = 0; p < h.length; p++) {
                n = n.concat(h[p].emoji_names)
            }
            var c = {};
            for (var o in emoji.data) {
                var s = emoji.data[o][3];
                for (var p = 0; p < s.length; p++) {
                    var d = s[p];
                    TS.ui.emoji_names.push(d);
                    c[d] = {
                        emoji: TS.utility.emojiGraphicReplace(":" + d + ":"),
                        name: ":" + d + ":",
                        names: ":" + s.join(": :") + ":"
                    }
                }
            }
            for (var p = 0; p < n.length; p++) {
                d = n[p];
                if (!c[d]) {
                    TS.error(d + " not in emoji map?")
                }
            }
            var f = function(u, k) {
                var w = "emoji_preloader_" + u;
                var y = "";
                for (var i = 0; i < k.length; i++) {
                    y += k[i].name
                }
                var x = emoji.supports_css;
                emoji.supports_css = false;
                $("body").append('<div style="position:absolute; width:100px; left:-200px; top:-200%" id="' + w + '">' + TS.utility.emojiGraphicReplace(y, true) + "</div>");
                emoji.supports_css = x;
                var t = 0;
                var v = k.length;
                $("#" + w).find("IMG").bind("load", function() {
                    t++;
                    if (t == v) {
                        $("#" + w).remove()
                    }
                })
            };
            var g;
            for (var p = 0; p < h.length; p++) {
                g = h[p];
                var r = [];
                var b = "";
                for (var j = 0; j < g.emoji_names.length; j++) {
                    r.push(c[g.emoji_names[j]]);
                    if (g.emoji_names[j] == g.name) {
                        b = c[g.emoji_names[j]].emoji
                    }
                }
                TS.ui.emoticon_groups.push({
                    name: g.name,
                    tab_html: b || r[0].emoji,
                    items: r
                });
                if (g.name == "slack") {
                    (function(k, i) {
                        window.setTimeout(function() {
                            f(k, i)
                        }, 5000)
                    }(g.name, r))
                }
                if (!TS.model.prefs.ss_emojis) {
                    if (g.name == TS.emoji_menu.default_emoji_group) {
                        f(g.name, r)
                    }
                }
            }
            if (TS.model.prefs.ss_emojis && emoji.sheet_path) {
                $("body").append('<img style="position:absolute; width:100px; left:-200px; top:-200%; z-index:100" id="emoji_ss_preloader_onchange" src="' + emoji.sheet_path + '">');
                $("#emoji_ss_preloader_onchange").bind("load", function() {
                    $("#emoji_ss_preloader_onchange").remove()
                })
            }
            TS.ui.emoji_names.sort();
            var q = TS.ui.emoji_names.indexOf("thumbsdown");
            var l = TS.ui.emoji_names.indexOf("thumbsup");
            TS.ui.emoji_names[q] = "thumbsup";
            TS.ui.emoji_names[l] = "thumbsdown"
        }, updateClosestMonkeyScroller: function(b) {
            if (!b) {
                return
            }
            var d = b.closest(".monkey_scroller");
            var c = d.data("monkeyScroll");
            if (!c) {
                return
            }
            c.updateFunc()
        }, collapsible: false, collapsed: false, just_collapsed: false, collapse_moves_whole: true, debug_channel_lists: true, collapsible_ms: 100, setUpCollapsibleUI: function() {
            $("html").unbind("mousemove.collapsible");
            $("html").unbind("click.collapsible");
            $("#col_channels_collapse_view").unbind("click.collapsible");
            $("#msgs_scroller_div").unbind("click.collapsible");
            $("#col_channels_collapse_view").removeClass("cursor_pointer");
            if (TS.model.prefs.collapsible_by_click) {
                $("#col_channels_collapse_view").addClass("cursor_pointer");
                $("#msgs_scroller_div").unbind("click.collapsible").bind("click.collapsible", TS.ui.onCollapsibleBodyClick)
            } else {
                var c = 0;
                var b = function(h) {
                    if (TS.model.prefs.collapsible_by_click) {
                        return
                    }
                    var d = TS.model.collapse_trigger_w;
                    if (!TS.ui.collapsible) {
                        return
                    }
                    if (!TS.ui.isUserAttentionOnChat()) {
                        return
                    }
                    if (TS.ui.collapsed) {
                        clearTimeout(c);
                        c = 0;
                        if (TS.ui.just_collapsed) {
                            return
                        }
                        var g = h.pageX < d && h.pageY > 50 && h.pageY < $(window).height() - 60;
                        if (g) {
                            c = setTimeout(function() {
                                TS.ui.expandChanCol()
                            }, 100)
                        }
                    } else {
                        var f = h.pageX > 220;
                        if (TS.ui.collapse_moves_whole) {
                            f = h.pageX > 220 + 100
                        }
                        if (f) {
                            clearTimeout(c);
                            c = 0;
                            TS.ui.collapseChanCol()
                        }
                    }
                };
                $("html").unbind("mousemove.collapsible").bind("mousemove.collapsible", b);
                $("html").unbind("click.collapsible").bind("click.collapsible", b)
            }
        }, makeChanColNOTCollapsible: function() {
            if (!TS.ui.collapsible) {
                return
            }
            TS.ui.collapsible = false;
            $("body").removeClass("collapsible");
            $("#team_menu, #user_menu, #col_channels_bg, #col_channels, #col_channels_collapse_view").css("opacity", 1);
            $("#channel_header").css("margin-left", "");
            if (TS.ui.collapse_moves_whole) {
                $("body, #footer").css("margin-left", "");
                $("#col_flex").css("right", "");
                $("#footer").css("right", "");
                $("#user_menu").css("left", "")
            }
            TS.view.resizeManually();
            TS.ui.collapsed = false;
            $("html").unbind("mousemove.collapsible");
            $("html").unbind("click.collapsible");
            $("html").unbind("click.collapsed_col");
            $("#col_channels_collapse_view").unbind("click.collapsible");
            $("#msgs_scroller_div").unbind("click.collapsible")
        }, makeChanColCollapsible: function() {
            TS.ui.debug_channel_lists = TS.qs_args.debug_channel_lists == "1";
            if (TS.ui.collapsible) {
                return
            }
            TS.ui.collapsible = true;
            $("body").addClass("collapsible");
            if ($("#col_channels_collapse_view").length == 0) {
                $("#col_channels_bg").parent().prepend('				<div id="col_channels_collapse_view" class="channels_list_holder">					<div class="section_holder starred_section"><h2>starred</h2><ul id="starred-list-collapsed"></ul></div>					<div class="section_holder"><h2>channels</h2><ul id="channel-list-collapsed"></ul><div class="clear-both"></div></div>					<div class="section_holder" id="direct_messages_collapsed"><h2>dms</h2><ul id="im-list-collapsed"></ul><div class="clear-both"></div><a id="im_list_collapsed_more" class="list_more hidden">X</a></div>					<div class="section_holder"><h2>groups</h2><ul id="group-list-collapsed"></ul></div>				</div>			');
                $("#col_channels_collapse_view").bind("click.collapsed_col", TS.ui.onCollapseClick)
            }
            $("#channel_header").css("margin-left", 10);
            TS.view.rebuildChannelList();
            TS.view.rebuildImList();
            TS.view.rebuildGroupList();
            TS.view.rebuildStarredList();
            TS.view.resizeManually();
            TS.ui.onChannelsScroll();
            TS.ui.collapsed = true
        }, onCollapsibleBodyClick: function(c) {
            if (!TS.ui.collapsible) {
                return
            }
            if (!TS.model.prefs.collapsible_by_click) {
                return
            }
            var b = $(c.target);
            if (!b.hasClass("day_divider") && !b.hasClass("message") && b.attr("id") != "msgs_div") {
                return
            }
            if (TS.ui.collapsed) {
                if (c.pageX < 10 || c.pageX > 90) {
                    return
                }
                c.preventDefault();
                TS.ui.expandChanCol()
            } else {
                if (c.pageX < 220 || c.pageX > 300) {
                    return
                }
                c.preventDefault();
                TS.ui.collapseChanCol()
            }
        }, onCollapseClick: function(b) {
            b.preventDefault();
            if (!TS.ui.collapsible) {
                return
            }
            if (!TS.model.prefs.collapsible_by_click) {
                return
            }
            if (!TS.ui.collapsed) {
                return
            }
            TS.ui.expandChanCol()
        }, collapseChanCol: function() {
            if (!TS.ui.collapsible) {
                return
            }
            if (TS.ui.collapsed) {
                return
            }
            TS.ui.just_collapsed = true;
            setTimeout(function() {
                TS.ui.just_collapsed = false;
                $("html").trigger("mousemove.collapsible")
            }, 500);
            TS.ui.collapsed = true;
            if (TS.ui.collapse_moves_whole) {
                $("#channel_header").transition({
                    "margin-left": 10
                }, TS.ui.collapsible_ms);
                $("body, #footer").transition({
                    "margin-left": 0
                }, TS.ui.collapsible_ms, function() {});
                $("#col_flex").transition({
                    right: 0
                }, TS.ui.collapsible_ms);
                $("#footer").css("right", "");
                $("#user_menu").transition({
                    left: -220
                }, TS.ui.collapsible_ms);
                $("#col_channels_collapse_view").transition({
                    left: -220,
                    opacity: 1
                }, TS.ui.collapsible_ms, function() {
                    $("#col_channels_collapse_view").css("z-index", 149)
                })
            } else {
                $("#team_menu, #user_menu, #col_channels_bg, #col_channels, #col_channels_collapse_view").transition({
                    left: -220,
                    opacity: 0
                }, TS.ui.collapsible_ms)
            }
        }, expandChanCol: function() {
            if (!TS.ui.collapsible) {
                return
            }
            if (!TS.ui.collapsed) {
                return
            }
            TS.ui.collapsed = false;
            if (TS.ui.collapse_moves_whole) {
                $("#channel_header").transition({
                    "margin-left": 0
                }, TS.ui.collapsible_ms);
                $("body, #footer").transition({
                    "margin-left": 220
                }, TS.ui.collapsible_ms, function() {});
                $("#col_flex").transition({
                    right: -220
                }, TS.ui.collapsible_ms);
                var b = parseInt($("#footer").css("right"));
                $("#footer").transition({
                    right: b - 220
                }, 0);
                $("#user_menu").transition({
                    left: 0
                }, TS.ui.collapsible_ms);
                $("#col_channels_collapse_view").css("z-index", 99);
                if (TS.ui.debug_channel_lists) {
                    $("#col_channels_collapse_view").transition({
                        left: 1,
                        opacity: 1
                    }, TS.ui.collapsible_ms)
                } else {
                    $("#col_channels_collapse_view").transition({
                        left: -230,
                        opacity: 1
                    }, TS.ui.collapsible_ms)
                }
            } else {
                $("#team_menu, #user_menu, #col_channels_bg, #col_channels, #col_channels_collapse_view").transition({
                    left: 0,
                    opacity: 1
                }, TS.ui.collapsible_ms)
            }
        }, tryToJump: function(q, l, p, j, h) {
            var m;
            var o;
            var k = TS.channels.getChannelById(q);
            if (!k) {
                m = TS.ims.getImById(q)
            }
            if (!k && !m) {
                o = TS.groups.getGroupById(q)
            }
            if (!k && !m && !o) {
                TS.error("NO CHANNEL NO IM GROUP");
                return false
            }
            if (k && !k.is_member) {
                TS.warn("Unable to jump to message: you are not a member of this channel.");
                if (h) {
                    alert("You are not a member of this channel... join first!")
                }
                return false
            }
            var b = k || m || o;
            var g = TS.utility.msgs.getMsg(l, b.msgs);

            function c() {
                g = TS.utility.msgs.getMsg(l, b.msgs);
                if (g) {
                    TS.generic_dialog.cancel();
                    setTimeout(function() {
                        if (k) {
                            TS.view.displayMsgInChannel(k, l)
                        } else {
                            if (o) {
                                TS.view.displayMsgInGroup(o, l)
                            } else {
                                TS.view.displayMsgInIm(m, l)
                            }
                        }
                    }, 500)
                } else {
                    if (b.msgs.length > 10000) {
                        if ((k || o) && p) {
                            TS.generic_dialog.start({
                                title: "We tried!",
                                body: "<p>We loaded " + TS.utility.numberWithCommas(b.msgs.length) + " messages and didn't find that one. It is probably best if you just view the message in the archives.</p>",
                                show_cancel_button: false,
                                show_go_button: true,
                                on_go: d
                            })
                        } else {
                            TS.generic_dialog.start({
                                title: "We tried!",
                                body: "<p>We loaded " + TS.utility.numberWithCommas(b.msgs.length) + " of messages and didn't find that one. Sorry!</p>",
                                show_cancel_button: false,
                                show_go_button: true,
                                on_go: d
                            })
                        }
                    } else {
                        setTimeout(n, 200)
                    }
                }
            }

            function f() {
                if (m) {
                    TS.ims.history_fetched_sig.remove(c)
                }
                if (k) {
                    TS.channels.history_fetched_sig.remove(c)
                }
                if (o) {
                    TS.groups.history_fetched_sig.remove(c)
                }
            }

            function d() {
                f();
                if (m) {
                    TS.ims.startImById(m.id);
                    return
                }
                if (!g && (k || o) && p) {
                    TS.utility.openInNewTab(p, j)
                }
            }

            function n() {
                if (!TS.generic_dialog.is_showing) {
                    if ((k || o) && p) {
                        TS.generic_dialog.start({
                            title: "Loading history to find message...",
                            body: "<p>If you'd rather just view the message in the archives in a new window, you can hit the cancel button below!</p>",
                            show_go_button: false,
                            on_cancel: d,
                            show_throbber: true
                        })
                    } else {
                        TS.generic_dialog.start({
                            title: "Loading history to find message...",
                            body: "<p>You can cancel at any time with the cancel button below</p>",
                            show_go_button: false,
                            on_cancel: d,
                            show_throbber: true
                        })
                    }
                }
                if (k) {
                    if (TS.channels.maybeLoadHistory(k.id)) {
                        TS.info("trying to find message by loading history...");
                        TS.channels.history_fetched_sig.remove(c);
                        TS.channels.history_fetched_sig.addOnce(c)
                    } else {
                        alert("Unable to jump to message: could not find message!")
                    }
                } else {
                    if (o) {
                        if (TS.groups.maybeLoadHistory(o.id)) {
                            TS.info("trying to find message by loading history...");
                            TS.groups.history_fetched_sig.remove(c);
                            TS.groups.history_fetched_sig.addOnce(c)
                        } else {
                            alert("Unable to jump to message: could not find message!")
                        }
                    } else {
                        if (TS.ims.maybeLoadHistory(m.id)) {
                            TS.info("trying to find message by loading history...");
                            TS.ims.history_fetched_sig.remove(c);
                            TS.ims.history_fetched_sig.addOnce(c)
                        } else {
                            alert("Unable to jump to message: could not find message!")
                        }
                    }
                }
            }
            if (g) {
                if (k) {
                    TS.view.displayMsgInChannel(k, l)
                }
                if (o) {
                    TS.view.displayMsgInGroup(o, l)
                }
                if (m) {
                    TS.view.displayMsgInIm(m, l)
                }
                return true
            }
            if (!h) {
                return false
            }
            var i = false;
            if (i) {
                if (k || o) {
                    TS.generic_dialog.start({
                        title: "Show the message here?",
                        body: "<p>That's an old message! I can try and find it in history to show it to you here, or you can view it in another window in the message archives.</p>",
                        show_go_button: true,
                        show_cancel_button: true,
                        go_button_text: "Find it!",
                        cancel_button_text: "Just show me the archives",
                        on_go: n,
                        on_cancel: d
                    })
                } else {
                    TS.generic_dialog.start({
                        title: "Show the message here?",
                        body: "<p>That's an old message! I can try and find it in history to show it to you here, if you like.</p>",
                        show_go_button: true,
                        show_cancel_button: true,
                        go_button_text: "Find it!",
                        cancel_button_text: "No Thanks",
                        on_go: n
                    })
                }
            } else {
                n()
            }
            return true
        }, sendChannelMsgThroughSlackBot: function(l, d, f, j) {
            var b = TS.channels.getChannelById(l);
            if (!b) {
                return
            }
            var k = f.split(",");
            if (!k.length) {
                return
            }
            var c = TS.utility.msgs.getMsg(d, b.msgs);
            var h = "";
            for (var g = 0; g < k.length; g++) {
                if (g != 0) {
                    if (g == k.length - 1) {
                        if (k.length > 2) {
                            h += ","
                        }
                        h += " and "
                    } else {
                        h += ", "
                    }
                }
                h += "<b>" + TS.members.getMemberDisplayName(TS.members.getMemberById(k[g]), true) + "</b>"
            }
            TS.generic_dialog.start({
                title: "Send message to users not in #" + b.name + "",
                body: "<p>Would you like to have slackbot send " + h + " your message?</p>" + TS.templates.builders.buildMsgHTML({
                    msg: c,
                    model_ob: b,
                    standalone: true
                }),
                go_button_text: "Yes, send it",
                on_go: function() {
                    for (var m = 0; m < k.length; m++) {
                        TS.api.call("chat.sendMention", {
                            channel: l,
                            user: k[m],
                            ts: c.ts
                        })
                    }
                    if (j) {
                        if (l.charAt(0) === "C") {
                            TS.channels.removeMsg(l, TS.utility.msgs.getMsg(j, b.msgs))
                        } else {
                            if (l.charAt(0) === "G") {
                                TS.groups.removeMsg(l, TS.utility.msgs.getMsg(j, b.msgs))
                            }
                        }
                    }
                }
            })
        }, promptForGroupOrChannelInvite: function(f, d, g) {
            var b = TS.groups.getGroupById(f) || TS.channels.getChannelById(f);
            if (!b) {
                return
            }
            var j = d.split(",");
            if (!j.length) {
                return
            }
            if (b.is_group) {
                TS.ui.invite.showInviteMembersPreSelected(f, j, g);
                return
            }
            var h = "";
            for (var c = 0; c < j.length; c++) {
                if (c != 0) {
                    if (c == j.length - 1) {
                        if (j.length > 2) {
                            h += ","
                        }
                        h += " and "
                    } else {
                        h += ", "
                    }
                }
                h += "<b>" + TS.members.getMemberDisplayName(TS.members.getMemberById(j[c]), true) + "</b>"
            }
            TS.generic_dialog.start({
                title: "Invite new members to #" + b.name + "",
                body: "<p>Would you like to invite " + h + " to #" + b.name + "?</p>",
                go_button_text: "Yes, invite them",
                on_go: function() {
                    for (var k = 0; k < j.length; k++) {
                        TS.api.call("channels.invite", {
                            channel: f,
                            user: j[k]
                        })
                    }
                    if (g) {
                        TS.channels.removeMsg(f, TS.utility.msgs.getMsg(g, b.msgs))
                    }
                }
            })
        }, addEphemeralBotMsg: function(b) {
            var d = b.channel || TS.shared.getActiveModelOb().id;
            var h = b.text;
            var c = "<javascript:TS.utility.msgs.removeEphemeralMsg('" + d + "', '" + f + "')|do nothing>";
            if (!h) {
                return
            }
            var g;
            if (b.username) {
                g = {
                    type: "message",
                    subtype: "bot_message",
                    icons: b.icons || null,
                    is_ephemeral: true,
                    username: b.username,
                    ts: b.ts,
                    text: h
                }
            } else {
                g = {
                    type: "message",
                    user: "USLACKBOT",
                    is_ephemeral: true,
                    ts: b.ts,
                    text: h
                }
            }
            var f = a(d, g, b.ephemeral_type);
            TS.info(f)
        }, addOrFlashEphemeralBotMsg: function(f) {
            var g = f.channel || TS.shared.getActiveModelOb().id;
            var d = f.ephemeral_type;
            var h = (d) ? TS.utility.msgs.getEphemeralMsgsByCidAndType(g, d) : null;
            if (h && h.length) {
                var c = TS.shared.getActiveModelOb();
                var b = h[0];
                b.text = f.text;
                if (c.is_im) {
                    TS.ims.message_changed_sig.dispatch(c, b)
                } else {
                    if (c.is_channel) {
                        TS.channels.message_changed_sig.dispatch(c, b)
                    } else {
                        if (c.is_group) {
                            TS.groups.message_changed_sig.dispatch(c, b)
                        }
                    }
                }
            } else {
                TS.ui.addEphemeralBotMsg(f)
            }
        }
    });
var a = function(d, f, b) {
    f.ts = f.ts || TS.utility.date.makeTsStamp();
    var c = TS.utility.msgs.processImsg(f);
    if (d.charAt(0) === "C") {
        TS.channels.addMsg(d, c)
    } else {
        if (d.charAt(0) === "G") {
            TS.groups.addMsg(d, c)
        } else {
            TS.ims.addMsg(d, c)
        }
    }
    TS.utility.msgs.ephemeral_msgs_map[f.ts] = {
        c_id: d,
        ephemeral_type: b
    };
    return f.ts
}
})();
TS.registerModule("ui.history", {
    onStart: function() {
        TS.model.input_history = TS.storage.fetchInputHistory()
    },
    add: function(a) {
        if (!TS.model.prefs.arrow_history && (!a || a.indexOf("/") != 0)) {
            return
        }
        var c = TS.model.input_history;
        var b = c.indexOf(a);
        if (b != -1) {
            c.splice(b, 1)
        }
        if (c.length && c[0] == "") {
            c.splice(0, 1)
        }
        c.unshift(a);
        TS.storage.storeInputHistory(c);
        TS.log(23, a);
        TS.dir(23, c)
    },
    resetPosition: function(a) {
        TS.model.input_history_index = -1
    },
    onArrowKey: function(d, b) {
        if (!TS.model.prefs.arrow_history) {
            return
        }
        if (!TS.model.input_history.length) {
            return
        }
        var a = b.val();
        var c = "";
        if (TS.model.input_history_index < 0) {
            TS.ui.history.add(a);
            TS.model.input_history_index++
        }
        if (d.which == TS.utility.keymap.up) {
            TS.model.input_history_index++;
            if (TS.model.input_history_index >= TS.model.input_history.length) {
                TS.model.input_history_index = TS.model.input_history.length - 1;
                return
            }
        } else {
            if (d.which == TS.utility.keymap.down) {
                TS.model.input_history_index--;
                if (TS.model.input_history_index < 0) {
                    TS.model.input_history_index = -1;
                    return
                }
            } else {
                return
            }
        }
        c = TS.model.input_history[TS.model.input_history_index];
        d.preventDefault();
        TS.utility.populateInput(TS.view.input_el, c);
        if (d.which == TS.utility.keymap.up) {
            b.setCursorPosition(0)
        } else {
            b.setCursorPosition(1000000)
        }
    }
});
TS.registerModule("ui.paste", {
    catcher_div: null,
    onStart: function() {
        if (!window.Clipboard) {
            TS.ui.paste.catcher_div = document.createElement("div");
            TS.ui.paste.catcher_div.setAttribute("contenteditable", "");
            TS.ui.paste.catcher_div.setAttribute("class", "offscreen");
            document.body.appendChild(TS.ui.paste.catcher_div)
        }
        var a = 86;
        $(window.document).keydown(function(b) {
            if (!TS.ui.paste.okToGo()) {
                return
            }
            if (TS.utility.cmdKey(b) && b.which == a) {
                if (TS.ui.paste.catcher_div && !TS.utility.isFocusOnInput()) {
                    TS.ui.paste.catcher_div.focus()
                }
            }
        });
        $(window).bind("paste", TS.ui.paste.handler)
    },
    okToGo: function() {
        if (!TS.view.input_el) {
            return false
        }
        if (!TS.utility.isFocusOnInput() || document.activeElement == TS.view.input_el[0]) {
            return true
        }
        return false
    },
    handler: function(g) {
        if (!TS.ui.paste.okToGo()) {
            return
        }
        TS.info("TS.ui.paste.handler");
        g = g.originalEvent || g;
        var m = TS.model.shift_key_pressed;
        var d = !TS.model.is_safari_desktop && TS.model.alt_key_pressed;
        if (!TS.model.is_FF && g.clipboardData) {
            TS.info("clipboardData!");
            TS.info(g.clipboardData.types);
            var f;
            var a;
            var l = false;
            var j = g.clipboardData.items;
            var h = {};
            if (j) {
                for (f = 0; f < j.length; f++) {
                    if (j[f]) {
                        h[j[f].type] = true
                    }
                }
                for (f = 0; f < j.length; f++) {
                    if (j[f].type.indexOf("image") !== -1) {
                        if (TS.model.is_mac && h["text/plain"] && h["text/html"] && h["text/rtf"]) {
                            TS.info("Ignoring pasted image data, likely from Office/Word for Mac.")
                        } else {
                            a = j[f].getAsFile();
                            g.preventDefault();
                            TS.ui.file_pasted_sig.dispatch(a, m);
                            l = true
                        }
                    }
                }
                if (!l && m && TS.ui && !TS.model.insert_key_pressed && !d) {
                    setTimeout(TS.ui.startSnippetFromChatInput, 100)
                }
            } else {
                TS.warn("no clipboardData.items");
                if (window.macgap && window.macgap.clipboard && window.macgap.clipboard.readImage) {
                    var k = window.macgap.clipboard.readImage();
                    if (k) {
                        var b = document.getElementById("converter_canvas");
                        if (!b) {
                            $("body").append('<canvas id="converter_canvas" class="offscreen"></canvas>');
                            b = document.getElementById("converter_canvas")
                        }
                        var n = b.getContext("2d");
                        var c = new Image();
                        c.src = "data:image/tiff;base64," + k;
                        c.onload = function() {
                            b.width = c.width;
                            b.height = c.height;
                            n.clearRect(0, 0, b.width, b.height);
                            n.drawImage(c, 0, 0);
                            var i = TS.utility.base64StrFromDataURI(b.toDataURL("image/png"));
                            TS.ui.file_pasted_sig.dispatch(i, m)
                        };
                        l = true;
                        g.preventDefault()
                    }
                }
                if (!l && m && TS.ui && !TS.model.v_key_pressed && !d) {
                    setTimeout(TS.ui.startSnippetFromChatInput, 100)
                }
            }
        } else {
            setTimeout(TS.ui.paste.checkCatcher, 0, m)
        }
    },
    checkCatcher: function(k) {
        var a = TS.ui.paste.catcher_div;
        if (!a) {
            return
        }
        var c = a.childNodes[0];
        var f = TS.view.input_el.val();
        var b = ("textContent" in a) ? a.textContent : a.innerText;
        b = $.trim(b);
        var h;
        var j = false;
        if (c) {
            if (c.tagName === "IMG") {
                j = true;
                TS.ui.file_pasted_sig.dispatch(TS.utility.base64StrFromDataURI(c.src), k)
            } else {
                if (f) {
                    var g = TS.view.input_el.getCursorRange();
                    TS.info(g);
                    var d = g.l;
                    var n = g.s;
                    var m = f.substr(0, n);
                    var i = f.substr(n + d);
                    h = m + b + i
                } else {
                    h = b
                }
                TS.info(h);
                TS.ui.populateChatInput(h)
            }
        }
        a.innerHTML = "";
        TS.view.focusMessageInput();
        if (g) {
            TS.view.input_el.setCursorPosition(g.s + g.l + b.length)
        }
        if (!j && k && TS.ui) {}
    }
});
(function() {
    TS.registerModule("ui.prefs_dialog", {
        div: null,
        showing: false,
        last_tab: "notifications",
        theme_throttle_tim: 0,
        show_customization_ui: false,
        onStart: function() {
            TS.prefs.sidebar_theme_changed_sig.add(TS.ui.prefs_dialog.updateThemeControls, TS.ui.prefs_dialog);
            TS.prefs.dtop_notif_changed_sig.add(TS.ui.prefs_dialog.updateNotificationControls, TS.ui.prefs_dialog);
            TS.prefs.read_changed_sig.add(TS.ui.prefs_dialog.updateReadControls, TS.ui.prefs_dialog);
            TS.prefs.display_real_names_override_changed_sig.add(TS.ui.prefs_dialog.updateRealNameControls, TS.ui.prefs_dialog);
            TS.prefs.team_display_real_names_changed_sig.add(TS.ui.prefs_dialog.updateRealNameControls, TS.ui.prefs_dialog)
        },
        switchToDebuggingPrefs: function() {
            TS.ui.prefs_dialog.cancel();
            setTimeout(TS.ui.debug_prefs_dialog.start, 500)
        },
        onKeydown: function(d) {
            if (!TS.ui.prefs_dialog.showing) {
                return
            }
            if (d.which == TS.utility.keymap.enter) {
                if (TS.utility.getActiveElementProp("NODENAME") == "BODY") {
                    TS.ui.prefs_dialog.go();
                    d.preventDefault()
                }
            } else {
                if (d.which == TS.utility.keymap.esc) {
                    TS.ui.prefs_dialog.cancel()
                }
            }
        },
        onGrowlsPermissionLinkClick: function() {
            TS.info("button clicked");
            $("#growls_permission_div").addClass("hidden");
            $("#growls_instructions_div").removeClass("hidden");
            TS.ui.growls.promptForPermission(function(f, d) {
                TS.info("callback called allowed:" + f + " permission_level:" + d);
                $("#growls_instructions_div").addClass("hidden");
                if (d == "granted" && f) {
                    $("#growls_allowed_div").removeClass("hidden").find(".desktop_notifications_title").addClass("kelly_green").text("Desktop Notifications enabled!");
                    if (!TS.model.prefs.growls_enabled) {
                        TS.prefs.setPrefByAPI({
                            name: "growls_enabled",
                            value: true
                        });
                        TS.model.prefs.growls_enabled = true
                    }
                    TS.ui.prefs_dialog.updateNotificationControls()
                } else {
                    if (d == "default") {
                        $("#growls_permission_div").removeClass("hidden")
                    } else {
                        if (d == "denied") {
                            $("#growls_disallowed_div").removeClass("hidden")
                        } else {
                            alert("huh allowed:" + f + " permission_level:" + d)
                        }
                    }
                }
            })
        },
        updateRealNameControls: function() {
            var d = $("#display_real_names_override_cb");
            var f = TS.model.prefs.display_real_names_override;
            d.prop("checked", (TS.model.team.prefs.display_real_names && f != -1) || f == 1);
            if (TS.model.team.prefs.display_real_names) {
                $("#display_real_names_default").removeClass("hidden");
                $("#display_usernames_default").addClass("hidden")
            } else {
                $("#display_real_names_default").addClass("hidden");
                $("#display_usernames_default").removeClass("hidden")
            }
        },
        updateNotificationControls: function() {
            var f = "all";
            if (!TS.model.prefs.growls_enabled) {
                f = "never"
            } else {
                if (!TS.model.prefs.all_channels_loud) {
                    f = "mentions"
                }
            }
            $("#growls_test").css("visibility", "");
            $('input:radio[name="notifications_rd"]').filter('[value="' + f + '"]').prop("checked", true);
            var d = TS.templates.builders.buildNonDefaultNotificationBlock("margin-left");
            if (d) {
                $(".non_default").removeClass("hidden");
                $("#non_default_html").html(d);
                $("#no_non_default").addClass("hidden")
            } else {
                $(".non_default").addClass("hidden");
                $("#no_non_default").removeClass("hidden")
            }
            $("#non_default_tip_link").tooltip("destroy").attr("title", TS.templates.builders.buildNonDefaultNotificationBlock("align-left")).tooltip({
                html: true
            })
        },
        updateThemeControls: function() {
            if (TS.model.prefs.sidebar_theme == "default") {
                TS.model.prefs.sidebar_theme = "default_theme"
            }
            var f = TS.model.prefs.sidebar_theme;
            $('input:radio[name="sidebar_theme_rd"]').filter('[value="' + f + '"]').prop("checked", true);
            if (TS.model.prefs.sidebar_theme_custom_values && TS.model.prefs.sidebar_theme_custom_values != "undefined") {
                var g = JSON.parse(TS.model.prefs.sidebar_theme_custom_values);
                var d = $.map(g, function(h) {
                    return h
                });
                if (TS.ui.prefs_dialog.div) {
                    TS.ui.prefs_dialog.div.find('input[name="color_column_bg_hex"]').val(g.column_bg);
                    TS.ui.prefs_dialog.div.find('input[name="color_menu_bg_hex"]').val(g.menu_bg);
                    TS.ui.prefs_dialog.div.find('input[name="color_active_item_hex"]').val(g.active_item);
                    TS.ui.prefs_dialog.div.find('input[name="color_active_item_text_hex"]').val(g.active_item_text);
                    TS.ui.prefs_dialog.div.find('input[name="color_hover_item_hex"]').val(g.hover_item);
                    TS.ui.prefs_dialog.div.find('input[name="color_text_color_hex"]').val(g.text_color);
                    TS.ui.prefs_dialog.div.find('input[name="color_active_presence_hex"]').val(g.active_presence);
                    TS.ui.prefs_dialog.div.find('input[name="color_badge_hex"]').val(g.badge);
                    TS.ui.prefs_dialog.div.find('.color_swatch[data-theme-element="column_bg"]').css("background-color", g.column_bg).data("hex", g.column_bg);
                    TS.ui.prefs_dialog.div.find('.color_swatch[data-theme-element="menu_bg"]').css("background-color", g.menu_bg).data("hex", g.menu_bg);
                    TS.ui.prefs_dialog.div.find('.color_swatch[data-theme-element="active_item"]').css("background-color", g.active_item).data("hex", g.active_item);
                    TS.ui.prefs_dialog.div.find('.color_swatch[data-theme-element="active_item_text"]').css("background-color", g.active_item_text).data("hex", g.active_item_text);
                    TS.ui.prefs_dialog.div.find('.color_swatch[data-theme-element="hover_item"]').css("background-color", g.hover_item).data("hex", g.hover_item);
                    TS.ui.prefs_dialog.div.find('.color_swatch[data-theme-element="text_color"]').css("background-color", g.text_color).data("hex", g.text_color);
                    TS.ui.prefs_dialog.div.find('.color_swatch[data-theme-element="active_presence"]').css("background-color", g.active_presence).data("hex", g.active_presence);
                    TS.ui.prefs_dialog.div.find('.color_swatch[data-theme-element="badge"]').css("background-color", g.badge).data("hex", g.badge);
                    $("#sidebar_theme_custom").val(d.join(","))
                }
            }
        },
        updateThemePrefsOptimistically: function(d, f) {
            TS.prefs.setPrefByAPI({
                name: "sidebar_theme",
                value: d
            });
            TS.prefs.setPrefByAPI({
                name: "sidebar_theme_custom_values",
                value: JSON.stringify(f)
            });
            TS.model.prefs.sidebar_theme = d;
            TS.prefs.setSidebarThemeCustomValues(f);
            TS.ui.prefs_dialog.updateThemeControls();
            TS.view.sidebarThemePrefChanged()
        },
        updateReadControls: function() {
            var d = TS.prefs.getReadStateTrackingPref();
            $('input:radio[name="read_rd"]').filter('[value="' + d + '"]').prop("checked", true)
        },
        start: function(h, d) {
            h = h || TS.ui.prefs_dialog.last_tab;
            if (!TS.ui.prefs_dialog.div) {
                TS.ui.prefs_dialog.build()
            }
            if (TS.ui.prefs_dialog.showing) {
                TS.ui.prefs_dialog.cancel();
                return
            }
            var f = TS.ui.prefs_dialog.div;
            var q = TS.model.prefs.highlight_words || "";
            q = q.replace(/\,/g, ", ").replace(/\ \ /g, " ");
            var l = [];
            var v = [];
            var j;
            var p = TS.channels.getChannelsForUser();
            p.sort(function g(w, i) {
                var x = w._name_lc;
                var y = i._name_lc;
                if (x < y) {
                    return -1
                }
                if (x > y) {
                    return 1
                }
                return 0
            });
            for (var k in p) {
                var s = p[k];
                j = false;
                if ($.inArray(s.id, TS.model.search_exclude_channels) != -1) {
                    j = true
                }
                if (s.is_archived) {
                    v.push({
                        search_channel_exclusion: j,
                        channel: s
                    })
                } else {
                    l.push({
                        search_channel_exclusion: j,
                        channel: s
                    })
                }
            }
            var u = (TS.model.mac_ssb_version && TS.model.mac_ssb_version >= 0.32);
            var o = !!window.winssb;
            var t = {
                member: TS.model.user,
                highlight_words: q,
                presence_str: TS.view.getUserPresenceStr(),
                prefs: TS.model.prefs,
                active_channels: l,
                archived_channels: v,
                inline_img_byte_limit: TS.model.inline_img_byte_limit,
                new_message_sounds: TS.boot_data.new_message_sounds,
                show_mac_ssb_prefs: u,
                show_win_ssb_prefs: o,
                feature_chat_sounds: TS.boot_data.feature_chat_sounds,
                team_name: TS.model.team.name
            };
            if (TS.boot_data.feature_sidebar_themes) {
                if (TS.model.prefs.sidebar_theme_custom_values && TS.model.prefs.sidebar_theme_custom_values != "undefined") {
                    t.theme = JSON.parse(TS.model.prefs.sidebar_theme_custom_values);
                    t.show_customization_ui = TS.ui.prefs_dialog.show_customization_ui
                }
            }
            var n = TS.templates.prefs_dialog(t);
            f.empty();
            f.html(n);
            $read_tips = f.find("#read_tips");
            $read_tips.html(TS.utility.emojiReplace($read_tips.html()));
            f.find(".modal-nav a").bind("click", function() {
                TS.ui.prefs_dialog.openTab($(this).data("which"))
            });
            TS.ui.prefs_dialog.openTab(h);
            $("#all_channels_loud_p").addClass("hidden");
            $(".growls_stuff").addClass("hidden");
            if (TS.ui.growls.shouldShowPermissionButton()) {
                $("#growls_permission_div").removeClass("hidden")
            } else {
                if (TS.ui.growls.checkPermission()) {
                    $("#growls_allowed_div").removeClass("hidden")
                } else {
                    if (TS.ui.growls.no_notifications) {
                        $("#growls_impossible_div").removeClass("hidden")
                    } else {
                        if (TS.ui.growls.getPermissionLevel() == "denied") {
                            $("#growls_disallowed_div").removeClass("hidden")
                        }
                    }
                }
            } if (u) {
                $("#mac_ssb_bounce_cb").prop("checked", !!TS.model.prefs.mac_ssb_bounce);
                $("#mac_ssb_bounce_short_cb").prop("checked", TS.model.prefs.mac_ssb_bounce != "long");
                var r = function() {
                    if (!!TS.model.prefs.mac_ssb_bounce) {
                        $("#mac_ssb_bounce_short_cb").prop("disabled", false)
                    } else {
                        $("#mac_ssb_bounce_short_cb").prop("disabled", true)
                    }
                };
                r();
                $("#mac_ssb_bounce_cb").bind("change", function() {
                    var i = !!$(this).prop("checked");
                    var w = !!$("#mac_ssb_bounce_short_cb").prop("checked");
                    TS.model.prefs.mac_ssb_bounce = i ? (w ? "short" : "long") : "";
                    TS.prefs.setPrefByAPI({
                        name: "mac_ssb_bounce",
                        value: TS.model.prefs.mac_ssb_bounce
                    });
                    r()
                });
                $("#mac_ssb_bounce_short_cb").bind("change", function() {
                    var i = !!$(this).prop("checked");
                    TS.prefs.setPrefByAPI({
                        name: "mac_ssb_bounce",
                        value: i ? "short" : "long"
                    })
                });
                $("#mac_ssb_bullet_cb").prop("checked", TS.model.prefs.mac_ssb_bullet === true);
                $("#mac_ssb_bullet_cb").bind("change", function() {
                    var i = !!$(this).prop("checked");
                    TS.prefs.setPrefByAPI({
                        name: "mac_ssb_bullet",
                        value: i
                    })
                })
            }
            if (o) {
                $("#win_ssb_bullet_cb").prop("checked", TS.model.prefs.win_ssb_bullet === true);
                $("#win_ssb_bullet_cb").bind("change", function() {
                    var i = !!$(this).prop("checked");
                    TS.prefs.setPrefByAPI({
                        name: "win_ssb_bullet",
                        value: i
                    })
                })
            }
            TS.ui.prefs_dialog.updateReadControls();
            $('input:radio[name="read_rd"]').bind("change", function() {
                var i = $(this).val();
                TS.prefs.setReadStateTrackingPref(i);
                TS.ui.prefs_dialog.updateReadControls()
            });
            if (TS.boot_data.feature_sidebar_themes) {
                TS.ui.prefs_dialog.updateThemeControls();
                TS.ui.prefs_dialog.div.find('input:radio[name="sidebar_theme_rd"]').bind("change", function() {
                    var i = $(this).val();
                    var w = TS.ui.sidebar_themes.default_themes[i];
                    TS.ui.prefs_dialog.updateThemePrefsOptimistically(i, w)
                });
                TS.ui.prefs_dialog.div.find("input.color_hex").bind("textchange", function() {
                    var i = $.trim($(this).val());
                    if (!i.match(TS.prefs.hex_regex)) {
                        clearTimeout(TS.ui.prefs_dialog.theme_throttle_tim);
                        return
                    }
                    if (i.indexOf("#") != 0) {
                        i = "#" + i
                    }
                    $(this).prev(".color_swatch").css("background-color", i).data("hex", i);
                    clearTimeout(TS.ui.prefs_dialog.theme_throttle_tim);
                    TS.ui.prefs_dialog.theme_throttle_tim = setTimeout(function() {
                        var w = "custom_theme";
                        var x = {
                            column_bg: TS.ui.prefs_dialog.div.find('input[name="color_column_bg_hex"]').val(),
                            menu_bg: TS.ui.prefs_dialog.div.find('input[name="color_menu_bg_hex"]').val(),
                            active_item: TS.ui.prefs_dialog.div.find('input[name="color_active_item_hex"]').val(),
                            active_item_text: TS.ui.prefs_dialog.div.find('input[name="color_active_item_text_hex"]').val(),
                            hover_item: TS.ui.prefs_dialog.div.find('input[name="color_hover_item_hex"]').val(),
                            text_color: TS.ui.prefs_dialog.div.find('input[name="color_text_color_hex"]').val(),
                            active_presence: TS.ui.prefs_dialog.div.find('input[name="color_active_presence_hex"]').val(),
                            badge: TS.ui.prefs_dialog.div.find('input[name="color_badge_hex"]').val()
                        };
                        $.each(x, function(y, z) {
                            if (z[0] !== "#") {
                                x[y] = "#" + z
                            }
                        });
                        TS.ui.prefs_dialog.updateThemePrefsOptimistically(w, x)
                    }, 250)
                });
                TS.ui.prefs_dialog.div.find("#sidebar_theme_custom").bind("textchange", function(w) {
                    var i = $(this);
                    setTimeout(function() {
                        var A = $.trim(i.val());
                        var y = A.replace(/ /g, "").split(",");
                        var x = true;
                        $.each(y, function(B, C) {
                            if (!C.match(TS.prefs.hex_regex)) {
                                x = false
                            }
                            if (!x) {
                                return
                            }
                        });
                        if (!x) {
                            clearTimeout(TS.ui.prefs_dialog.theme_throttle_tim);
                            return
                        }
                        var z = {
                            column_bg: y[0],
                            menu_bg: y[1],
                            active_item: y[2],
                            active_item_text: y[3],
                            hover_item: y[4],
                            text_color: y[5],
                            active_presence: y[6],
                            badge: y[7]
                        };
                        $.each(z, function(B, C) {
                            if (C[0] !== "#") {
                                z[B] = "#" + C
                            }
                        });
                        clearTimeout(TS.ui.prefs_dialog.theme_throttle_tim);
                        TS.ui.prefs_dialog.theme_throttle_tim = setTimeout(function() {
                            TS.ui.prefs_dialog.updateThemePrefsOptimistically("custom_theme", z)
                        }, 250)
                    }, 0)
                });
                TS.ui.prefs_dialog.div.find(".color_swatch").bind("click.show_picker", function(y) {
                    y.stopPropagation();
                    var w = $(this).data("theme-element");
                    var x = $(this);
                    var i = x.next("input");
                    TS.ui.prefs_dialog.div.find(".color_swatch.selected").removeClass("selected").find(".colpick").addClass("hidden");
                    var z = x.data("hex").replace("#", "");
                    x.colpick({
                        flat: true,
                        layout: "hex",
                        color: z,
                        submit: 0,
                        onChange: function(A, E, C, D, B) {
                            x.css("background-color", "#" + E).data("hex", "#" + E);
                            i.val("#" + E);
                            clearTimeout(TS.ui.prefs_dialog.theme_throttle_tim);
                            TS.ui.prefs_dialog.theme_throttle_tim = setTimeout(function() {
                                var F = "custom_theme";
                                var G = {
                                    column_bg: TS.ui.prefs_dialog.div.find('input[name="color_column_bg_hex"]').val(),
                                    menu_bg: TS.ui.prefs_dialog.div.find('input[name="color_menu_bg_hex"]').val(),
                                    active_item: TS.ui.prefs_dialog.div.find('input[name="color_active_item_hex"]').val(),
                                    active_item_text: TS.ui.prefs_dialog.div.find('input[name="color_active_item_text_hex"]').val(),
                                    hover_item: TS.ui.prefs_dialog.div.find('input[name="color_hover_item_hex"]').val(),
                                    text_color: TS.ui.prefs_dialog.div.find('input[name="color_text_color_hex"]').val(),
                                    active_presence: TS.ui.prefs_dialog.div.find('input[name="color_active_presence_hex"]').val(),
                                    badge: TS.ui.prefs_dialog.div.find('input[name="color_badge_hex"]').val()
                                };
                                TS.ui.prefs_dialog.updateThemePrefsOptimistically(F, G)
                            }, 500)
                        }
                    }).colpickSetColor(z);
                    $("html").bind("click.hide_colpick", function() {
                        TS.ui.prefs_dialog.div.find(".color_swatch.selected").removeClass("selected").find(".colpick").addClass("hidden")
                    });
                    x.addClass("selected").find(".colpick").removeClass("hidden")
                });
                $("#customize_theme_toggle").bind("click", function() {
                    $("#customize_theme_info").addClass("hidden");
                    $("#prefs_themes_customize").removeClass("hidden");
                    TS.ui.prefs_dialog.show_customization_ui = true
                })
            }
            TS.ui.prefs_dialog.updateNotificationControls();
            $('input:radio[name="notifications_rd"]').bind("change", function() {
                var i = $(this).val();
                if (i == "all" || i == "mentions") {
                    if (i == "all") {
                        TS.prefs.setPrefByAPI({
                            name: "all_channels_loud",
                            value: true
                        });
                        TS.model.prefs.all_channels_loud = true
                    } else {
                        TS.prefs.setPrefByAPI({
                            name: "all_channels_loud",
                            value: false
                        });
                        TS.model.prefs.all_channels_loud = false
                    } if (!TS.model.prefs.growls_enabled) {
                        TS.prefs.setPrefByAPI({
                            name: "growls_enabled",
                            value: true
                        });
                        TS.model.prefs.growls_enabled = true
                    }
                } else {
                    TS.prefs.setPrefByAPI({
                        name: "growls_enabled",
                        value: false
                    });
                    TS.model.prefs.growls_enabled = false
                }
                TS.ui.prefs_dialog.updateNotificationControls()
            });
            $("#arrow_history_cb").prop("checked", TS.model.prefs.arrow_history === true);
            $("#arrow_history_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                TS.prefs.setPrefByAPI({
                    name: "arrow_history",
                    value: i
                })
            });
            $("#convert_emoticons_cb").prop("checked", TS.model.prefs.convert_emoticons === true);
            $("#convert_emoticons_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                TS.prefs.setPrefByAPI({
                    name: "convert_emoticons",
                    value: i
                })
            });
            $("#autoplay_chat_sounds_cb").prop("checked", TS.model.prefs.autoplay_chat_sounds === true);
            $("#autoplay_chat_sounds_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                TS.prefs.setPrefByAPI({
                    name: "autoplay_chat_sounds",
                    value: i
                })
            });
            $("#tab_ui_return_selects_cb").prop("checked", TS.model.prefs.tab_ui_return_selects === true);
            $("#tab_ui_return_selects_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                TS.prefs.setPrefByAPI({
                    name: "tab_ui_return_selects",
                    value: i
                })
            });
            $("#speak_growls_cb").prop("checked", TS.model.prefs.speak_growls === true);
            $("#speak_growls_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                TS.prefs.setPrefByAPI({
                    name: "speak_growls",
                    value: i
                })
            });
            $("#comma_key_prefs_cb").prop("checked", TS.model.prefs.comma_key_prefs === true);
            $("#comma_key_prefs_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                TS.prefs.setPrefByAPI({
                    name: "comma_key_prefs",
                    value: i
                })
            });
            $("#collapsible_cb").prop("checked", TS.model.prefs.collapsible === true);
            $("#collapsible_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                TS.prefs.setPrefByAPI({
                    name: "collapsible",
                    value: i
                });
                $("#collapsible_by_click_cb").prop("disabled", !i)
            });
            $("#collapsible_by_click_cb").prop("checked", TS.model.prefs.collapsible_by_click === true);
            $("#collapsible_by_click_cb").prop("disabled", !TS.model.prefs.collapsible);
            $("#collapsible_by_click_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                TS.prefs.setPrefByAPI({
                    name: "collapsible_by_click",
                    value: i
                })
            });
            $("#start_scroll_at_oldest_cb").prop("checked", TS.model.prefs.start_scroll_at_oldest === true);
            $("#start_scroll_at_oldest_cb").bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "start_scroll_at_oldest",
                    value: !!$(this).prop("checked")
                })
            });
            $("#show_presence_cb").prop("checked", TS.model.prefs.show_member_presence === true);
            $("#show_presence_cb").bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "show_member_presence",
                    value: !!$(this).prop("checked")
                })
            });
            $("#expand_inline_imgs_cb").prop("checked", TS.model.prefs.expand_inline_imgs === true);
            $("#expand_inline_imgs_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                TS.prefs.setPrefByAPI({
                    name: "expand_inline_imgs",
                    value: i
                });
                TS.model.prefs.expand_inline_imgs = i;
                $("#dont_obey_inline_img_limit_cb").prop("disabled", !TS.model.prefs.expand_inline_imgs)
            });
            $("#dont_obey_inline_img_limit_cb").prop("checked", TS.model.prefs.obey_inline_img_limit === false);
            $("#dont_obey_inline_img_limit_cb").bind("change", function() {
                f.find("#dont_obey_inline_img_limit_p").css("background-color", "");
                var i = !!$(this).prop("checked");
                TS.model.prefs.obey_inline_img_limit = !i;
                TS.prefs.setPrefByAPI({
                    name: "obey_inline_img_limit",
                    value: !i
                })
            });
            $("#dont_obey_inline_img_limit_cb").prop("disabled", !TS.model.prefs.expand_inline_imgs);
            $("#expand_internal_inline_imgs_cb").prop("checked", TS.model.prefs.expand_internal_inline_imgs === true);
            $("#expand_internal_inline_imgs_cb").bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "expand_internal_inline_imgs",
                    value: !!$(this).prop("checked")
                })
            });
            $("#webapp_spellcheck_cb").prop("checked", TS.model.prefs.webapp_spellcheck === true).removeClass("hidden");
            $("#webapp_spellcheck_cb").bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "webapp_spellcheck",
                    value: !!$(this).prop("checked")
                })
            });
            if (window.winssb) {
                $("#webapp_spellcheck_cb").addClass("hidden")
            }
            $("#require_at_cb").prop("checked", TS.model.prefs.require_at === true).removeClass("hidden");
            $("#require_at_cb").bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "require_at",
                    value: !!$(this).prop("checked")
                })
            });
            $("#mute_sounds_cb").prop("checked", TS.model.prefs.mute_sounds === true);
            $("#mute_sounds_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                TS.model.prefs.mute_sounds = i;
                TS.prefs.setPrefByAPI({
                    name: "mute_sounds",
                    value: i
                });
                $("#soundpreview").addClass("hidden");
                if (TS.model.prefs.mute_sounds) {
                    $("#new_msg_snd_select").val("none")
                } else {
                    $("#new_msg_snd_select").val(TS.model.prefs.new_msg_snd);
                    if (TS.model.prefs.new_msg_snd != "none") {
                        $("#soundpreview").removeClass("hidden")
                    }
                }
            });
            $("#show_typing_cb").prop("checked", TS.model.prefs.show_typing === true).removeClass("hidden");
            $("#show_typing_cb").bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "show_typing",
                    value: !!$(this).prop("checked")
                })
            });
            $("#pagekeys_handled_cb").prop("checked", TS.model.prefs.pagekeys_handled === true).removeClass("hidden");
            $("#pagekeys_handled_cb").bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "pagekeys_handled",
                    value: !!$(this).prop("checked")
                })
            });
            $("#f_key_search_cb").prop("checked", TS.model.prefs.f_key_search === true).removeClass("hidden");
            $("#f_key_search_cb").bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "f_key_search",
                    value: !!$(this).prop("checked")
                })
            });
            TS.ui.prefs_dialog.updateRealNameControls();
            $("#display_real_names_override_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                var w;
                if (TS.model.team.prefs.display_real_names) {
                    w = (i) ? 0 : -1
                } else {
                    w = (i) ? 1 : 0
                }
                TS.prefs.setPrefByAPI({
                    name: "display_real_names_override",
                    value: w
                })
            });
            $("#time24_cb").prop("checked", TS.model.prefs.time24 === true);
            $("#time24_cb").bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "time24",
                    value: !!$(this).prop("checked")
                })
            });
            $("#enter_is_special_in_tbt_tip").tooltip();
            $("#enter_is_special_in_tbt_cb").prop("checked", TS.model.prefs.enter_is_special_in_tbt === true);
            $("#enter_is_special_in_tbt_cb").bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "enter_is_special_in_tbt",
                    value: !!$(this).prop("checked")
                })
            });
            $("#expand_non_media_attachments_cb").prop("checked", TS.model.prefs.expand_non_media_attachments === true);
            $("#expand_non_media_attachments_cb").bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "expand_non_media_attachments",
                    value: !!$(this).prop("checked")
                })
            });
            $('input:radio[name="emoji_mode_select"]').filter('[value="' + TS.model.prefs.emoji_mode + '"]').prop("checked", true);
            $('input:radio[name="emoji_mode_select"]').bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "emoji_mode",
                    value: $(this).val()
                })
            });
            $('input:radio[name="messages_theme_select"]').filter('[value="' + TS.model.prefs.messages_theme + '"]').prop("checked", true);
            $('input:radio[name="messages_theme_select"]').bind("change", function() {
                TS.prefs.setPrefByAPI({
                    name: "messages_theme",
                    value: $(this).val()
                })
            });
            $("#ls_disabled_cb").prop("checked", TS.model.prefs.ls_disabled === true);
            $("#ls_disabled_cb").bind("change", function() {
                var i = !!$(this).prop("checked");
                TS.model.prefs.ls_disabled = i;
                TS.prefs.setPrefByAPI({
                    name: "ls_disabled",
                    value: i
                });
                TS.storage.setDisabled(TS.model.prefs.ls_disabled)
            });
            $("#ss_emojis_cb").prop("checked", TS.model.prefs.ss_emojis !== true);
            $("#ss_emojis_cb").bind("change", function() {
                var i = !$(this).prop("checked");
                TS.model.prefs.ss_emojis = i;
                TS.prefs.setPrefByAPI({
                    name: "ss_emojis",
                    value: i
                })
            });
            var m = Math.random();
            $("#emo_bear").attr("src", "/img/emo_bear.gif?" + m);
            $("#surprise_me").on("change", function() {
                $("#surprise").fadeIn(150, function() {
                    setTimeout(function() {
                        $("#surprise").fadeOut(500, function() {
                            m = Math.random();
                            $("#emo_bear").attr("src", "/img/emo_bear.gif?" + m);
                            $("#surprise_me").prop("checked", false)
                        })
                    }, 2400)
                })
            });
            $("#search_channel_exclusion").chosen({
                placeholder_text_multiple: "Click here to pick channels to exclude...",
                optional_prefix: "#"
            });
            $("#search_channel_exclusion_chzn").find(".chzn-results").css("max-height", "200px");
            $("#search_channel_exclusion_holder").css("min-height", 235);
            $(".modal-body").css("overflow-y", "visible");
            $("#search_channel_exclusion_chzn").css("width", "100%");
            $("#search_channel_exclusion_chzn").find(".default").css("width", "100%");
            $("#search_channel_exclusion").bind("change", function() {
                var i = $(this).val();
                TS.prefs.setPrefByAPI({
                    name: "search_exclude_channels",
                    value: i ? i.join(",") : ""
                })
            });
            $("#soundpreview").bind("click", function() {
                var i = $("#new_msg_snd_select").val();
                TS.ui.playSound(i)
            });
            if (TS.model.prefs.new_msg_snd == "none" || TS.model.prefs.mute_sounds) {
                $("#soundpreview").addClass("hidden")
            } else {
                $("#soundpreview").removeClass("hidden")
            }
            $("#new_msg_snd_select").val((TS.model.prefs.mute_sounds) ? "none" : TS.model.prefs.new_msg_snd);
            $("#new_msg_snd_select").change(function() {
                var i = $("#new_msg_snd_select").val();
                if (i != "none" && TS.model.prefs.mute_sounds) {
                    TS.model.prefs.mute_sounds = false;
                    TS.prefs.setPrefByAPI({
                        name: "mute_sounds",
                        value: false
                    });
                    $("#mute_sounds_cb").prop("checked", false)
                }
                if (i != "none") {
                    $("#soundpreview").removeClass("hidden");
                    TS.ui.playSound(i)
                } else {
                    $("#soundpreview").addClass("hidden")
                }
                TS.prefs.setPrefByAPI({
                    name: "new_msg_snd",
                    value: i
                })
            });
            $("#sidebar_behavior_select").val(TS.model.prefs.sidebar_behavior);
            $("#sidebar_behavior_select").change(function() {
                var i = $("#sidebar_behavior_select").val();
                TS.prefs.setPrefByAPI({
                    name: "sidebar_behavior",
                    value: i
                });
                TS.prefs.onPrefChanged({
                    name: "sidebar_behavior",
                    value: i
                })
            });
            f.modal("show");
            f.find(".dialog_cancel").click(TS.ui.prefs_dialog.cancel);
            f.find(".dialog_go").click(TS.ui.prefs_dialog.go);
            if (d) {
                f.find(d).css("background-color", "#FFF3B8")
            }
            if (TS.boot_data.feature_sidebar_themes) {
                a();
                if (h == "themes") {
                    b()
                }
            }
        },
        go: function() {
            if (!TS.ui.prefs_dialog.showing) {
                TS.error("not showing?");
                return
            }
            var d = TS.ui.prefs_dialog.div;
            TS.prefs.saveHighlightWords(TS.ui.prefs_dialog.div.find("#highlight_words_input").val());
            d.modal("hide")
        },
        cancel: function() {
            TS.ui.prefs_dialog.div.modal("hide")
        },
        end: function() {
            if (TS.boot_data.feature_sidebar_themes) {
                $("html").unbind("click.hide_colpick")
            }
            TS.ui.prefs_dialog.showing = TS.model.dialog_is_showing = false;
            $(window.document).unbind("keydown", TS.ui.prefs_dialog.onKeydown)
        },
        build: function() {
            $("body").append('<div id="new_prefs_dialog" class="modal hide fade"></div>');
            var d = TS.ui.prefs_dialog.div = $("#new_prefs_dialog");
            d.on("hide", function(f) {
                if (f.target != this) {
                    return
                }
                TS.ui.prefs_dialog.end()
            });
            d.on("show", function(f) {
                if (f.target != this) {
                    return
                }
                TS.ui.prefs_dialog.showing = TS.model.dialog_is_showing = true
            });
            d.on("shown", function(f) {
                if (f.target != this) {
                    return
                }
                $(window.document).bind("keydown", TS.ui.prefs_dialog.onKeydown)
            })
        },
        openTab: function(d) {
            var f = TS.ui.prefs_dialog.div.find('.modal-nav a[data-which="' + d + '"]');
            TS.ui.prefs_dialog.div.find(".modal-nav a").removeClass("active");
            TS.ui.prefs_dialog.div.find(".dialog_tab_pane").removeClass("active");
            f.addClass("active");
            $("#" + f.data("pane-id")).addClass("active");
            TS.ui.prefs_dialog.last_tab = d;
            if (TS.boot_data.feature_sidebar_themes) {
                if (d == "themes") {
                    b()
                } else {
                    c()
                }
            }
        }
    });
    var a = function() {
        var d = $("#col_channels_bg").width();
        var f = $('<div id="sidebar_overlay"></div>').css({
            position: "absolute",
            top: "0",
            bottom: "0",
            left: "-" + d + "px",
            width: d + "px"
        });
        $(".modal-backdrop").append(f)
    };
    var b = function() {
        var d = $("#col_channels_bg").width();
        $(".modal-backdrop").css("left", d + "px")
    };
    var c = function() {
        $(".modal-backdrop").css("left", "0")
    }
})();
(function() {
    TS.registerModule("ui.debug_prefs_dialog", {
        div: null,
        showing: false,
        onStart: function() {},
        onKeydown: function(a) {
            if (!TS.ui.debug_prefs_dialog.showing) {
                return
            }
            if (a.which == TS.utility.keymap.enter) {
                TS.ui.debug_prefs_dialog.go();
                a.preventDefault()
            } else {
                if (a.which == TS.utility.keymap.esc) {
                    TS.ui.debug_prefs_dialog.cancel()
                }
            }
        },
        start: function() {
            if (!TS.ui.debug_prefs_dialog.div) {
                TS.ui.debug_prefs_dialog.build()
            }
            if (TS.ui.prefs_dialog.showing) {
                return
            }
            TS.ui.debug_prefs_dialog.changed = false;
            var c = TS.ui.debug_prefs_dialog.div;
            var b = {
                member: TS.model.user,
                prefs: TS.model.prefs
            };
            var a = TS.templates.debug_prefs_dialog(b);
            c.empty();
            c.html(a);
            $("#ls_disabled_cb").prop("checked", TS.model.prefs.ls_disabled === true);
            $("#ls_disabled_cb").bind("change", function() {
                var d = !!$(this).prop("checked");
                TS.model.prefs.ls_disabled = d;
                TS.prefs.setPrefByAPI({
                    name: "ls_disabled",
                    value: d
                });
                TS.storage.setDisabled(TS.model.prefs.ls_disabled);
                c.find(".dialog_go").text("Reload now");
                TS.ui.debug_prefs_dialog.changed = true
            });
            $("#ss_emojis_cb").prop("checked", TS.model.prefs.ss_emojis !== true);
            $("#ss_emojis_cb").bind("change", function() {
                var d = !$(this).prop("checked");
                TS.model.prefs.ss_emojis = d;
                TS.prefs.setPrefByAPI({
                    name: "ss_emojis",
                    value: d
                });
                c.find(".dialog_go").text("Reload now");
                TS.ui.debug_prefs_dialog.changed = true
            });
            c.modal("show");
            c.find(".dialog_cancel").click(TS.ui.debug_prefs_dialog.cancel);
            c.find(".dialog_go").click(TS.ui.debug_prefs_dialog.go)
        },
        go: function() {
            if (!TS.ui.debug_prefs_dialog.showing) {
                TS.error("not showing?");
                return
            }
            var a = TS.ui.debug_prefs_dialog.div;
            a.modal("hide")
        },
        cancel: function() {
            TS.ui.debug_prefs_dialog.div.modal("hide")
        },
        end: function() {
            TS.ui.debug_prefs_dialog.showing = TS.model.dialog_is_showing = false;
            $(window.document).unbind("keydown", TS.ui.debug_prefs_dialog.onKeydown);
            if (TS.ui.debug_prefs_dialog.changed) {
                TS.client.reload()
            }
        },
        build: function() {
            $("body").append('<div id="debug_prefs_dialog" class="modal hide fade"></div>');
            var a = TS.ui.debug_prefs_dialog.div = $("#debug_prefs_dialog");
            a.on("hide", function(b) {
                if (b.target != this) {
                    return
                }
                TS.ui.debug_prefs_dialog.end()
            });
            a.on("show", function(b) {
                if (b.target != this) {
                    return
                }
                TS.ui.debug_prefs_dialog.showing = TS.model.dialog_is_showing = true
            });
            a.on("shown", function(b) {
                if (b.target != this) {
                    return
                }
                $(window.document).bind("keydown", TS.ui.debug_prefs_dialog.onKeydown)
            })
        }
    })
})();
TS.registerModule("ui.channel_prefs_dialog", {
    div: null,
    showing: false,
    c_id: null,
    onStart: function() {
        TS.prefs.push_changed_sig.add(TS.ui.channel_prefs_dialog.setPushNotificationRadioState, TS.ui.channel_prefs_dialog);
        TS.prefs.dtop_notif_changed_sig.add(TS.ui.channel_prefs_dialog.setNotificationRadioState, TS.ui.channel_prefs_dialog);
        TS.prefs.team_perms_pref_changed_sig.add(TS.ui.channel_prefs_dialog.teamPermsPrefChanged, TS.ui.channel_prefs_dialog)
    },
    onKeydown: function(a) {
        if (!TS.ui.channel_prefs_dialog.showing) {
            return
        }
        if (a.which == TS.utility.keymap.enter) {
            if (TS.utility.getActiveElementProp("NODENAME") == "BODY") {
                TS.ui.channel_prefs_dialog.go();
                a.preventDefault()
            }
        } else {
            if (a.which == TS.utility.keymap.esc) {
                TS.ui.channel_prefs_dialog.cancel()
            }
        }
    },
    teamPermsPrefChanged: function(a) {
        if (a != "who_can_at_channel" && a != "who_can_at_everyone" && a != "who_can_post_general") {
            return
        }
        TS.ui.channel_prefs_dialog.setNotificationRadioState();
        TS.ui.channel_prefs_dialog.setPushNotificationRadioState()
    },
    setNotificationRadioState: function() {
        var d = TS.ui.channel_prefs_dialog.c_id;
        if (!d) {
            return
        }
        var f = TS.utility.msgs.getChannelOrGroupNotifySettingBasedOnLoudness(d);
        $("#all_everything_default").addClass("hidden");
        $("#all_mentions_default").addClass("hidden");
        $("#all_nothing_default").addClass("hidden");
        if (TS.model.prefs.growls_enabled && TS.model.prefs.all_channels_loud) {
            $("#all_everything_default").removeClass("hidden")
        } else {
            if (TS.model.prefs.growls_enabled) {
                $("#all_mentions_default").removeClass("hidden")
            } else {
                $("#all_nothing_default").removeClass("hidden")
            }
        }
        $('input:radio[name="channel_loud_rd"]').filter('[value="' + f + '"]').prop("checked", true);
        $('input:radio[name="channel_loud_rd"]').unbind("change").bind("change", function() {
            var i = $(this).val();
            if (i == "everything") {
                TS.channels.makeChannelOrGroupDTopEverything(d)
            } else {
                if (i == "mentions") {
                    TS.channels.makeChannelOrGroupDTopMentions(d)
                } else {
                    TS.channels.makeChannelOrGroupDTopNothing(d)
                }
            }
            TS.prefs.setMultiPrefsByAPI({
                loud_channels: TS.model.loud_channels.join(","),
                never_channels: TS.model.never_channels.join(","),
                loud_channels_set: TS.model.loud_channels_set.join(",")
            });
            TS.ui.channel_prefs_dialog.setNotificationRadioState()
        });
        var h = $("#suppressed_cb");
        var a = $("#suppressed_label");
        var g = $("#suppressed_disabled_explain");
        var c = $("#suppressed_span");
        var b = $("#suppressed_disabled_explain_tip_link");
        TS.ui.channel_prefs_dialog.setSuppressedLabelState(TS.channels.hasUserSuppressedChannelOrGroupChannelMentions(d), "at_channel_suppressed_channels", d, f, h, a, g, c, b)
    },
    setSuppressedLabelState: function(g, l, m, o, b, j, c, h, f) {
        if (o == "mentions") {
            h.removeClass("hidden")
        } else {
            h.addClass("hidden")
        }
        var a = TS.channels.getChannelById(m) || TS.groups.getGroupById(m);
        var n = TS.model.team.prefs;
        var i = false;
        if (n.who_can_at_channel == "admin" || n.who_can_at_channel == "owner") {
            i = true
        } else {
            if (a.is_general && (n.who_can_at_everyone == "admin" || n.who_can_at_everyone == "owner" || n.who_can_post_general == "admin" || n.who_can_post_general == "owner")) {
                i = true
            }
        } if (i) {
            j.addClass("subtle_silver");
            j.css("cursor", "default");
            c.removeClass("hidden");
            b.prop("disabled", true);
            b.prop("checked", false);
            var d = (m.charAt(0) === "C") ? "channel" : "group";
            var k;
            if (d == "group") {
                k = "A team owner has restricted the use of <b>@group</b> to admins and/or owners, which renders you powerless to ignore those notifications."
            } else {
                if (a.is_general) {
                    k = "A team owner has restricted who can post to general and/or restricted the use of <b>@channel</b> and/or <b>@everyone</b> to admins and/or owners, which renders you powerless to ignore those notifications."
                } else {
                    k = "A team owner has restricted the use of <b>@channel</b> to admins and/or owners, which renders you powerless to ignore those notifications."
                }
            }
            f.tooltip("destroy").attr("title", k).tooltip({
                html: true
            })
        } else {
            j.removeClass("subtle_silver");
            j.css("cursor", "");
            c.addClass("hidden");
            b.prop("disabled", false);
            b.prop("checked", g);
            b.unbind("change").bind("change", function() {
                var p = !!$(this).prop("checked");
                if (l == "at_channel_suppressed_channels") {
                    if (p) {
                        TS.channels.makeChannelOrGroupSuppresed(m)
                    } else {
                        TS.channels.makeChannelOrGroupNOTSuppresed(m)
                    }
                    TS.prefs.setPrefByAPI({
                        name: "at_channel_suppressed_channels",
                        value: TS.model.at_channel_suppressed_channels.join(",")
                    })
                } else {
                    if (p) {
                        TS.channels.makeChannelOrGroupPushSuppresed(m)
                    } else {
                        TS.channels.makeChannelOrGroupNOTPushSuppresed(m)
                    }
                    TS.prefs.setPrefByAPI({
                        name: "push_at_channel_suppressed_channels",
                        value: TS.model.push_at_channel_suppressed_channels.join(",")
                    })
                }
            })
        }
    },
    setPushNotificationRadioState: function() {
        var d = TS.ui.channel_prefs_dialog.c_id;
        if (!d) {
            return
        }
        var f = TS.utility.msgs.getChannelOrGroupPushNotifySettingBasedOnLoudness(d);
        $("#all_push_everything_default").addClass("hidden");
        $("#all_push_mentions_default").addClass("hidden");
        $("#all_push_nothing_default").addClass("hidden");
        if (TS.model.prefs.push_everything) {
            $("#all_push_everything_default").removeClass("hidden")
        } else {
            if (TS.model.prefs.push_mention_alert) {
                $("#all_push_mentions_default").removeClass("hidden")
            } else {
                $("#all_push_nothing_default").removeClass("hidden")
            }
        }
        $('input:radio[name="channel_push_loud_rd"]').filter('[value="' + f + '"]').prop("checked", true);
        $('input:radio[name="channel_push_loud_rd"]').unbind("change").bind("change", function() {
            var i = $(this).val();
            if (i == "everything") {
                TS.channels.makeChannelOrGroupPushEverything(d)
            } else {
                if (i == "mentions") {
                    TS.channels.makeChannelOrGroupPushMentions(d)
                } else {
                    TS.channels.makeChannelOrGroupPushNothing(d)
                }
            }
            TS.prefs.setMultiPrefsByAPI({
                push_loud_channels: TS.model.push_loud_channels.join(","),
                push_mention_channels: TS.model.push_mention_channels.join(","),
                push_loud_channels_set: TS.model.push_loud_channels_set.join(",")
            });
            TS.ui.channel_prefs_dialog.setPushNotificationRadioState()
        });
        var h = $("#push_suppressed_cb");
        var a = $("#push_suppressed_label");
        var g = $("#push_suppressed_disabled_explain");
        var c = $("#push_suppressed_span");
        var b = $("#push_suppressed_disabled_explain_tip_link");
        TS.ui.channel_prefs_dialog.setSuppressedLabelState(TS.channels.hasUserSuppressedChannelOrGroupPushChannelMentions(d), "push_at_channel_suppressed_channels", d, f, h, a, g, c, b)
    },
    start: function(f) {
        if (!TS.ui.channel_prefs_dialog.div) {
            TS.ui.channel_prefs_dialog.build()
        }
        if (TS.ui.channel_prefs_dialog.showing) {
            return
        }
        var g = TS.ui.channel_prefs_dialog.div;
        var b = TS.shared.getModelObById(f);
        if (!b || b.is_im) {
            alert(f + " ???");
            return
        }
        var a = "";
        var c = "";
        if (b.is_channel) {
            a = "channel";
            c = "#" + b.name
        } else {
            if (b.is_group) {
                a = "group";
                c = b.name
            }
        }
        TS.ui.channel_prefs_dialog.c_id = f;
        var d = TS.templates.channel_prefs_dialog({
            c_or_g: a,
            display_name: c
        });
        g.html(d);
        TS.ui.channel_prefs_dialog.setPushNotificationRadioState();
        TS.ui.channel_prefs_dialog.setNotificationRadioState();
        $("#notifications_not_working").addClass("hidden");
        $("#notifications_impossible").addClass("hidden");
        $("#notifications_not_yet_allowed").addClass("hidden");
        $("#notifications_not_enabled").addClass("hidden");
        $("#notifications_not_allowed").addClass("hidden");
        $("#notifications_working").removeClass("hidden");
        if (TS.ui.growls.shouldShowPermissionButton()) {
            $("#notifications_working").addClass("hidden");
            $("#notifications_not_working").removeClass("hidden");
            $("#notifications_not_yet_allowed").removeClass("hidden")
        } else {
            if (!TS.ui.growls.checkPermission()) {
                $("#notifications_working").addClass("hidden");
                $("#notifications_not_working").removeClass("hidden");
                if (TS.ui.growls.no_notifications) {
                    $("#notifications_impossible").removeClass("hidden")
                } else {
                    if (TS.ui.growls.getPermissionLevel() == "denied") {
                        $("#notifications_not_allowed").removeClass("hidden")
                    }
                }
            }
        }
        g.modal("show");
        g.find(".dialog_cancel").click(TS.ui.channel_prefs_dialog.cancel);
        g.find(".dialog_go").click(TS.ui.channel_prefs_dialog.go)
    },
    go: function() {
        if (!TS.ui.channel_prefs_dialog.showing) {
            TS.error("not showing?");
            return
        }
        var a = TS.ui.channel_prefs_dialog.div;
        a.modal("hide")
    },
    showMainPrefs: function(a) {
        TS.ui.channel_prefs_dialog.cancel();
        setTimeout(function() {
            TS.ui.prefs_dialog.start(a)
        }, 500)
    },
    cancel: function() {
        TS.ui.channel_prefs_dialog.div.modal("hide")
    },
    end: function() {
        TS.ui.channel_prefs_dialog.c_id = null;
        TS.ui.channel_prefs_dialog.showing = TS.model.dialog_is_showing = false;
        $(window.document).unbind("keydown", TS.ui.channel_prefs_dialog.onKeydown)
    },
    build: function() {
        $("body").append('<div id="channel_prefs_dialog" class="modal hide fade"></div>');
        var a = TS.ui.channel_prefs_dialog.div = $("#channel_prefs_dialog");
        a.on("hide", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.channel_prefs_dialog.end()
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.channel_prefs_dialog.showing = TS.model.dialog_is_showing = true
        });
        a.on("shown", function(b) {
            if (b.target != this) {
                return
            }
            setTimeout(function() {
                $(window.document).bind("keydown", TS.ui.channel_prefs_dialog.onKeydown)
            }, 100)
        })
    }
});
(function() {
    TS.registerModule("ui.upload_dialog", {
        div: null,
        filesQ: [],
        file: null,
        showing: false,
        last_share_cb_checked: null,
        onStart: function() {},
        onKeydown: function(h) {
            if (!TS.ui.upload_dialog.showing) {
                return
            }
            if (h.which == TS.utility.keymap.enter) {
                if (TS.utility.getActiveElementProp("NODENAME") != "TEXTAREA") {
                    TS.ui.upload_dialog.go();
                    h.preventDefault()
                }
            } else {
                if (h.which == TS.utility.keymap.esc) {}
            }
        },
        start: function(m) {
            if (!m || !m.length) {
                TS.info("no files");
                return
            }
            var h = 0;
            var k;
            for (var j = 0; j < m.length; j++) {
                k = m[j];
                if (k.size > TS.model.upload_file_size_limit_bytes) {
                    continue
                }
                h++;
                TS.ui.upload_dialog.filesQ.push(k)
            }
            if (h < m.length) {
                var l = "";
                if (m.length == 1) {
                    l = "That file is too large and cannot be uploaded. The limit is " + TS.utility.convertFilesize(TS.model.upload_file_size_limit_bytes) + "."
                } else {
                    if (!h) {
                        l = "All of those file are too large and cannot be uploaded. The limit is " + TS.utility.convertFilesize(TS.model.upload_file_size_limit_bytes) + "."
                    } else {
                        l = "We'll upload what we can, but one or more of those files is too large and cannot be uploaded. The limit is " + TS.utility.convertFilesize(TS.model.upload_file_size_limit_bytes) + "."
                    }
                }
                alert(l)
            }
            if (!h) {
                return
            }
            if (!TS.ui.upload_dialog.div) {
                TS.ui.upload_dialog.build()
            }
            if (!TS.ui.upload_dialog.showing) {
                TS.ui.upload_dialog.pullFromQ(true)
            }
        },
        startWithCommentFromChatInput: function(h) {
            a = TS.view.input_el.val();
            TS.ui.upload_dialog.start(h);
            TS.view.clearMessageInput()
        },
        pullFromQ: function(h) {
            if (TS.ui.upload_dialog.filesQ.length) {
                TS.ui.upload_dialog._startWithFile(TS.ui.upload_dialog.filesQ.shift(), h);
                return true
            }
            if (TS.ui.resetFiles) {
                TS.ui.resetFiles()
            } else {
                if (console && console.warn) {
                    console.warn("TS.ui.resetFiles undefined")
                }
            }
            return false
        },
        _startWithFile: function(k, m) {
            TS.ui.upload_dialog.file = k;
            var n = TS.templates.file_upload_dialog({
                filename: TS.files.makeFileNameFromFile(k),
                title: c(k),
                has_name: !!k.name,
                sharing_html: TS.templates.builders.buildFileSharingControls(k, null, g()),
                over_storage_limit: TS.model.team.over_storage_limit,
                more_in_queue: TS.ui.upload_dialog.filesQ.length > 0
            });
            var h = TS.ui.upload_dialog.div;
            h.html(n);
            var j = function(q) {
                $("#upload_image_preview").removeClass("hidden").find("img").attr("src", q)
            };
            if (typeof k == "string") {
                j("data:image/png;base64," + k)
            } else {
                try {
                    var o = new FileReader();
                    o.onload = function(q) {
                        var r = q.target.result;
                        if (r.indexOf("data:image/") != 0) {
                            return
                        }
                        j(r)
                    };
                    o.readAsDataURL(k)
                } catch (l) {
                    TS.info(l)
                }
            }
            var p = $("#file_comment_textarea");
            TS.comments.ui.bindInput(p, TS.ui.upload_dialog.go);
            p.autogrow();
            var i = TS.ui.upload_dialog.showing;
            h.modal("show");
            if (TS.ui.upload_dialog.filesQ.length) {
                h.find(".file_count").text(" (and " + TS.ui.upload_dialog.filesQ.length + " more...)")
            }
            if (m) {
                h.find("#share_cb").prop("checked", true)
            } else {
                h.find("#share_cb").prop("checked", TS.ui.upload_dialog.last_share_cb_checked === true)
            }
            h.find(".modal-header > .close").click(b);
            h.find(".dialog_cancel_all").click(TS.ui.upload_dialog.cancelAll);
            h.find(".dialog_cancel").click(TS.ui.upload_dialog.cancel);
            h.find(".dialog_go").click(TS.ui.upload_dialog.go);
            TS.ui.bindFileShareDropdowns();
            TS.ui.bindFileShareShareToggle();
            if (i) {
                d(h)
            }
        },
        go: function() {
            if (!TS.ui.upload_dialog.showing) {
                TS.error("not showing?");
                return
            }
            if (!TS.ui.upload_dialog.file) {
                TS.error("no file?");
                return
            }
            var o = TS.ui.upload_dialog.div;
            var j = !!o.find("#share_cb").prop("checked");
            TS.ui.upload_dialog.last_share_cb_checked = !!j;
            var h = (j) ? $("#share_model_ob_id").val() : null;
            var m = TS.format.cleanMsg($("#file_comment_textarea").val());
            if ($.trim(m) == "") {
                m = ""
            }
            var i = o.find(".filename_input").val();
            var n = o.find(".title_input").val();
            if (TS.ui.upload_dialog.file.is_dropbox) {
                var l = TS.ui.upload_dialog.file.link;
                TS.shared.getShareModelObId(h, function(p) {
                    TS.files.upload(null, null, l, i, n, null, p, m)
                })
            } else {
                var k = TS.ui.upload_dialog.file;
                TS.shared.getShareModelObId(h, function(p) {
                    TS.files.upload(null, k, null, i, n, null, p, m)
                })
            }
            TS.ui.upload_dialog.maybeGoAway()
        },
        maybeGoAway: function() {
            a = "";
            if (!TS.ui.upload_dialog.pullFromQ()) {
                TS.ui.upload_dialog.div.modal("hide");
                return true
            }
            return false
        },
        cancel: function() {
            var i = a;
            var h = TS.ui.upload_dialog.maybeGoAway();
            if (i) {
                TS.ui.populateChatInput(i)
            }
            if (h && i) {
                setTimeout(TS.view.focusMessageInput, 10)
            }
        },
        cancelAll: function() {
            TS.ui.upload_dialog.filesQ = [];
            TS.ui.upload_dialog.cancel()
        },
        end: function() {
            TS.ui.upload_dialog.showing = TS.model.dialog_is_showing = false;
            TS.ui.upload_dialog.file = null;
            a = "";
            TS.ui.upload_dialog.div.empty();
            $(window.document).unbind("keydown", TS.ui.upload_dialog.onKeydown)
        },
        build: function() {
            $("body").append('<div id="upload_dialog" class="modal hide fade" data-keyboard="false" data-backdrop="static"></div>');
            var h = TS.ui.upload_dialog.div = $("#upload_dialog");
            h.on("hidden", function(i) {
                if (i.target != this) {
                    return
                }
                TS.ui.upload_dialog.end()
            });
            h.on("show", function(i) {
                if (i.target != this) {
                    return
                }
                TS.ui.upload_dialog.showing = TS.model.dialog_is_showing = true
            });
            h.on("shown", function(i) {
                if (i.target != this) {
                    return
                }
                setTimeout(function() {
                    d(h);
                    $(window.document).bind("keydown", TS.ui.upload_dialog.onKeydown)
                }, 100)
            })
        }
    });
    var a = "";
    var f = 50;
    var d = function(h) {
        if (a && a.length > f) {
            h.find("#file_comment_textarea").focus().select()
        } else {
            h.find("#upload_file_title").focus().select()
        }
    };
    var c = function(h) {
        if (a && a.length <= f) {
            return a
        }
        return TS.files.makeFileTitleFromFile(h)
    };
    var g = function() {
        if (a && a.length > f) {
            return a
        }
        return ""
    };
    var b = function(h) {
        h.preventDefault();
        TS.ui.upload_dialog.cancelAll()
    }
})();
TS.registerModule("ui.share_dialog", {
    div: null,
    showing: false,
    onStart: function() {},
    onKeydown: function(a) {
        if (!TS.ui.share_dialog.showing) {
            return
        }
        if (a.which == TS.utility.keymap.enter) {
            if (TS.utility.getActiveElementProp("NODENAME") == "BODY") {
                TS.ui.share_dialog.go();
                a.preventDefault()
            }
        } else {
            if (a.which == TS.utility.keymap.esc) {
                if (TS.utility.getActiveElementProp("NODENAME") == "BODY") {
                    TS.ui.share_dialog.cancel()
                }
            }
        }
    },
    start: function(a) {
        if (TS.ui.checkForEditing()) {
            return
        }
        var f = TS.files.getFileById(a);
        var d = "file";
        if (f.mode == "post") {
            d = "file_post"
        } else {
            if (f.mode == "snippet") {
                d = "file_snippet"
            }
        }
        var g = {
            type: d,
            item: f,
            item_owner: TS.members.getMemberById(f.user),
            sharing_html: TS.templates.builders.buildFileSharingControls(f, true)
        };
        if (f.mode == "external") {
            g.external_filetype_html = TS.templates.builders.makeExternalFiletypeHTML(f)
        }
        g.icon_class = TS.utility.getImageIconClass(f, "thumb_80");
        if (!TS.ui.share_dialog.div) {
            TS.ui.share_dialog.build()
        }
        var c = TS.templates.share_dialog(g);
        c = c.replace(/\ue000/g, "").replace(/\ue001/g, "");
        var h = TS.ui.share_dialog.div;
        h.html(c);
        var b = $("#file_comment_textarea");
        TS.comments.ui.bindInput(b, TS.ui.share_dialog.go);
        b.autogrow();
        h.modal("show");
        h.find(".dialog_cancel").click(TS.ui.share_dialog.cancel);
        h.find(".dialog_go").click(TS.ui.share_dialog.go);
        TS.ui.bindFileShareDropdowns();
        TS.ui.bindFileShareShareToggle()
    },
    go: function() {
        if (!TS.ui.share_dialog.showing) {
            TS.error("not showing?");
            return
        }
        var d = $("#share_dialog");
        var b = d.find("#share_item_id").val();
        var a = d.find("#share_model_ob_id").val();
        var c = TS.format.cleanMsg($("#file_comment_textarea").val());
        if ($.trim(c) == "") {
            c = ""
        }
        TS.shared.getShareModelObId(a, function(f) {
            TS.files.shareFile(b, f, c)
        });
        TS.ui.share_dialog.div.modal("hide")
    },
    cancel: function() {
        TS.ui.share_dialog.div.modal("hide")
    },
    end: function() {
        TS.ui.share_dialog.showing = TS.model.dialog_is_showing = false;
        TS.ui.share_dialog.div.empty();
        $(window.document).unbind("keydown", TS.ui.share_dialog.onKeydown)
    },
    build: function() {
        $("body").append('<div id="share_dialog" class="modal hide fade"></div>');
        var a = TS.ui.share_dialog.div = $("#share_dialog");
        a.on("hidden", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.share_dialog.end()
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.share_dialog.showing = TS.model.dialog_is_showing = true
        });
        a.on("shown", function(b) {
            if (b.target != this) {
                return
            }
            $("#file_comment_textarea").focus();
            $(window.document).bind("keydown", TS.ui.share_dialog.onKeydown)
        });
        a.on("click", function(b) {
            TS.view.doLinkThings(b)
        })
    }
});
TS.registerModule("ui.snippet_dialog", {
    editor: null,
    text_from_input: null,
    edit_file_id: null,
    div: null,
    showing: false,
    onStart: function() {},
    startCreate: function(a) {
        if (TS.ui.snippet_dialog.showing) {
            return
        }
        TS.ui.snippet_dialog.showing = true;
        TS.ui.snippet_dialog.text_from_input = a || null;
        TS.ui.snippet_dialog.edit_file_id = null;
        TS.ui.snippet_dialog.start(a, null, TS.model.prefs.last_snippet_type || "text")
    },
    startEdit: function(b) {
        if (TS.ui.snippet_dialog.showing) {
            return
        }
        var a = TS.files.getFileById(b);
        if (!a) {
            return
        }
        TS.files.fetchFileInfo(b, function(d, c) {
            TS.ui.snippet_dialog.edit_file_id = b;
            TS.ui.snippet_dialog.text_from_input = null;
            TS.ui.snippet_dialog.start(c.content, c.title, c.filetype)
        })
    },
    start: function(h, g, c) {
        if (!TS.ui.snippet_dialog.div) {
            TS.ui.snippet_dialog.build()
        }
        var f = {
            codemirror_types: TS.boot_data.codemirror_types,
            wrap_lines: TS.model.prefs.snippet_editor_wrap_long_lines
        };
        if (TS.ui.snippet_dialog.edit_file_id) {
            f.mode = "Edit"
        } else {
            f.mode = "Create";
            f.sharing_html = TS.templates.builders.buildFileSharingControls()
        }
        var b = TS.templates.snippet_dialog(f);
        var i = TS.ui.snippet_dialog.div;
        i.html(b);
        i.modal("show");
        i.find(".modal-header > .close").click(TS.ui.snippet_dialog.cancel);
        i.find(".dialog_cancel").click(TS.ui.snippet_dialog.cancel);
        i.find(".dialog_go").click(TS.ui.snippet_dialog.go);
        TS.ui.snippet_dialog.editor = CodeMirror.fromTextArea(document.getElementById("client_file_snippet_textarea"), {
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 4,
            indentWithTabs: true,
            enterMode: "keep",
            tabMode: "shift",
            viewportMargin: Infinity,
            autofocus: true,
            lineWrapping: TS.model.prefs.snippet_editor_wrap_long_lines
        });
        $("#client_file_snippet_select").change(function(j) {
            CodeMirror.switchSlackMode(TS.ui.snippet_dialog.editor, $(this).val());
            TS.prefs.setPrefByAPI({
                name: "last_snippet_type",
                value: $(this).val()
            })
        }).change();
        TS.ui.snippet_dialog.div.find(".CodeMirror-scroll").css({
            "overflow-y": "scroll",
            "max-height": 196,
            "min-height": 196
        });
        $("#client_file_wrap_cb").bind("change", function(k) {
            var j = $(this).is(":checked");
            TS.ui.snippet_dialog.editor.setOption("lineWrapping", j);
            TS.prefs.setPrefByAPI({
                name: "snippet_editor_wrap_long_lines",
                value: j
            })
        });
        var d = false;
        if (TS.ui.snippet_dialog.edit_file_id) {
            TS.ui.snippet_dialog.editor.setValue(h);
            if (g) {
                g = TS.format.unFormatMsg(g)
            }
            $("#client_file_snippet_title_input").val(g || "");
            TS.ui.snippet_dialog.div.find(".CodeMirror-scroll").css({
                "max-height": 326,
                "min-height": 326
            })
        } else {
            TS.ui.snippet_dialog.editor.setValue(h || "");
            $("#client_file_snippet_title_input").val("");
            TS.ui.bindFileShareDropdowns();
            TS.ui.bindFileShareShareToggle();
            d = !!h
        }
        var a = $("#file_comment_textarea");
        TS.comments.ui.bindInput(a, TS.ui.snippet_dialog.go);
        a.autogrow();
        $("#client_file_snippet_select").val(c).trigger("change");
        setTimeout(function() {
            if (d) {
                $("#client_file_snippet_title_input").focus()
            } else {
                TS.ui.snippet_dialog.editor.focus()
            }
            TS.ui.snippet_dialog.editor.refresh()
        }, 350);
        $(window.document).bind("keydown", TS.ui.snippet_dialog.onKeyDown)
    },
    go: function() {
        if (!TS.ui.snippet_dialog.showing) {
            TS.error("not showing?");
            return
        }
        var g = TS.ui.snippet_dialog.editor.getValue();
        if (!$.trim(g)) {
            return
        }
        if (TS.ui.snippet_dialog.edit_file_id) {
            TS.api.call("files.edit", {
                file: TS.ui.snippet_dialog.edit_file_id,
                title: $("#client_file_snippet_title_input").val(),
                content: g,
                filetype: $("#client_file_snippet_select").val()
            })
        } else {
            var b = !!$("#share_cb").prop("checked");
            var a = (b) ? $("#share_model_ob_id").val() : null;
            var d = TS.format.cleanMsg($("#file_comment_textarea").val());
            var f = $("#client_file_snippet_title_input").val();
            var c = $("#client_file_snippet_select").val();
            if ($.trim(d) == "") {
                d = ""
            }
            TS.shared.getShareModelObId(a, function(h) {
                TS.files.upload(g, null, null, null, f, c, h, d)
            })
        }
        TS.ui.snippet_dialog.div.modal("hide");
        TS.ui.snippet_dialog.end()
    },
    cancel: function(a) {
        if (TS.ui.snippet_dialog.text_from_input) {
            TS.ui.populateChatInput(TS.ui.snippet_dialog.text_from_input)
        }
        setTimeout(TS.view.focusMessageInput, 10);
        TS.ui.snippet_dialog.end();
        TS.ui.snippet_dialog.div.modal("hide");
        if (a) {
            a.preventDefault()
        }
    },
    end: function() {
        $(window.document).unbind("keydown", TS.ui.snippet_dialog.onKeyDown);
        TS.ui.snippet_dialog.showing = TS.model.dialog_is_showing = false;
        TS.ui.snippet_dialog.div.empty()
    },
    onKeyDown: function(a) {
        if (a.which == TS.utility.keymap.esc) {
            if ($.trim(TS.ui.snippet_dialog.editor.getValue()) == "") {
                TS.ui.snippet_dialog.cancel()
            }
            a.preventDefault()
        } else {
            if (a.which == TS.utility.keymap.enter) {
                if (!TS.utility.isFocusOnInput() || !document.activeElement || TS.utility.getActiveElementProp("id") == "client_file_snippet_title_input") {
                    TS.ui.snippet_dialog.go();
                    a.preventDefault()
                }
            }
        }
    },
    build: function() {
        $("body").append('<div id="snippet_dialog" class="modal hide fade" data-backdrop="static" data-keyboard="false"></div>');
        var a = TS.ui.snippet_dialog.div = $("#snippet_dialog");
        a.on("hidden", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.snippet_dialog.end()
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.snippet_dialog.showing = TS.model.dialog_is_showing = true
        })
    }
});
TS.registerModule("ui.lightbox_dialog", {
    div: null,
    showing: false,
    loaded_images: {},
    current_image_id: null,
    gallery: null,
    is_gallery: false,
    preload_dist: 3,
    current_index: null,
    timeout: null,
    mouseX: null,
    mouseY: null,
    onStart: function() {
        TS.channels.switched_sig.add(TS.ui.lightbox_dialog.channelOrImOrGroupDisplaySwitched, TS.ui.lightbox_dialog);
        TS.ims.switched_sig.add(TS.ui.lightbox_dialog.channelOrImOrGroupDisplaySwitched, TS.ui.lightbox_dialog);
        TS.groups.switched_sig.add(TS.ui.lightbox_dialog.channelOrImOrGroupDisplaySwitched, TS.ui.lightbox_dialog);
        TS.channels.message_received_sig.add(TS.ui.lightbox_dialog.updateGallery, TS.ui.lightbox_dialog);
        TS.ims.message_received_sig.add(TS.ui.lightbox_dialog.updateGallery, TS.ui.lightbox_dialog);
        TS.groups.message_received_sig.add(TS.ui.lightbox_dialog.updateGallery, TS.ui.lightbox_dialog);
        TS.channels.message_removed_sig.add(TS.ui.lightbox_dialog.updateGallery, TS.ui.lightbox_dialog);
        TS.ims.message_removed_sig.add(TS.ui.lightbox_dialog.updateGallery, TS.ui.lightbox_dialog);
        TS.groups.message_removed_sig.add(TS.ui.lightbox_dialog.updateGallery, TS.ui.lightbox_dialog);
        TS.channels.message_changed_sig.add(TS.ui.lightbox_dialog.updateGallery, TS.ui.lightbox_dialog);
        TS.ims.message_changed_sig.add(TS.ui.lightbox_dialog.updateGallery, TS.ui.lightbox_dialog);
        TS.groups.message_changed_sig.add(TS.ui.lightbox_dialog.updateGallery, TS.ui.lightbox_dialog)
    },
    onKeydown: function(a) {
        if (!TS.ui.lightbox_dialog.showing) {
            return
        }
        if (a.which == TS.utility.keymap.space || a.which == TS.utility.keymap.enter || a.which == TS.utility.keymap.esc) {
            TS.ui.lightbox_dialog.cancel();
            a.preventDefault()
        } else {
            if (TS.ui.lightbox_dialog.is_gallery) {
                if (a.which == TS.utility.keymap.right) {
                    TS.ui.lightbox_dialog.goRight();
                    a.preventDefault()
                } else {
                    if (a.which == TS.utility.keymap.left) {
                        TS.ui.lightbox_dialog.goLeft();
                        a.preventDefault()
                    }
                }
            }
        }
    },
    start: function(j, h, g, d, i, b) {
        var c, f, a;
        TS.ui.lightbox_dialog.is_gallery = j;
        TS.ui.lightbox_dialog.current_image_id = h;
        if (TS.ui.checkForEditing()) {
            return
        }
        if (!TS.ui.lightbox_dialog.div) {
            TS.ui.lightbox_dialog.build()
        }
        if (j) {
            TS.ui.lightbox_dialog.gallery = $("#msgs_div").find(".lightbox_link, .lightbox_external_link, .thumbnail_link");
            TS.ui.lightbox_dialog.updateCurrentIndex();
            setTimeout(function() {
                for (var k = TS.ui.lightbox_dialog.current_index - TS.ui.lightbox_dialog.preload_dist; k <= TS.ui.lightbox_dialog.current_index + TS.ui.lightbox_dialog.preload_dist; k++) {
                    TS.ui.lightbox_dialog.preloadImage(k)
                }
            }, 500)
        }
        c = null;
        if (!g) {
            c = TS.files.getFileById(h)
        }
        f = TS.templates.lightbox_dialog({
            external: g,
            file: c
        });
        a = TS.ui.lightbox_dialog.div;
        a.html(f).modal("show");
        a.find(".dialog_cancel").click(TS.ui.lightbox_dialog.cancel);
        if (j && TS.ui.lightbox_dialog.gallery.length > 1) {
            a.find(".lightbox_nav").removeClass("hidden")
        } else {
            a.find("lightbox_nav").addClass("hidden")
        }
        a.find(".lightbox_nav").hover(function(k) {
            $(window.document).unbind("mousemove", TS.ui.lightbox_dialog.fadeControls);
            clearTimeout(TS.ui.lightbox_dialog.timeout)
        }, function(k) {
            $(window.document).bind("mousemove", TS.ui.lightbox_dialog.fadeControls)
        });
        a.find("#lightbox_go_left").click(function(k) {
            k.stopPropagation();
            TS.ui.lightbox_dialog.goLeft()
        });
        a.find("#lightbox_go_right").click(function(k) {
            k.stopPropagation();
            TS.ui.lightbox_dialog.goRight()
        });
        TS.ui.lightbox_dialog.renderImage(h, g, d, i, b);
        TS.ui.lightbox_dialog.fadeControls()
    },
    fadeControls: function() {
        if (TS.ui.lightbox_dialog.timeout) {
            clearTimeout(TS.ui.lightbox_dialog.timeout)
        }
        TS.ui.lightbox_dialog.div.find(".lightbox_nav").show();
        TS.ui.lightbox_dialog.timeout = setTimeout(function() {
            TS.ui.lightbox_dialog.div.find(".lightbox_nav").fadeOut(500)
        }, 1000)
    },
    channelOrImOrGroupDisplaySwitched: function() {
        if (!TS.ui.lightbox_dialog.showing) {
            return
        }
        TS.ui.lightbox_dialog.cancel();
        TS.ui.lightbox_dialog.gallery = null
    },
    updateGallery: function() {
        if (!TS.ui.lightbox_dialog.showing) {
            return
        }
        setTimeout(function() {
            var a = $("#msgs_div").find(".lightbox_link, .lightbox_external_link, .thumbnail_link");
            if (a !== TS.ui.lightbox_dialog.gallery) {
                TS.ui.lightbox_dialog.gallery = a;
                TS.ui.lightbox_dialog.updateArrows();
                TS.ui.lightbox_dialog.updateCurrentIndex();
                if (TS.ui.lightbox_dialog.current_index > TS.ui.lightbox_dialog.gallery.length - TS.ui.lightbox_dialog.preload_dist) {
                    for (var b = TS.ui.lightbox_dialog.current_index + 1; b < TS.ui.lightbox_dialog.gallery.length; b++) {
                        TS.ui.lightbox_dialog.preloadImage(b)
                    }
                }
            }
        }, 500)
    },
    updateArrows: function() {
        if (TS.ui.lightbox_dialog.current_index == 0) {
            $("#lightbox_go_left").addClass("faded")
        } else {
            $("#lightbox_go_left").removeClass("faded")
        } if (TS.ui.lightbox_dialog.current_index == TS.ui.lightbox_dialog.gallery.length - 1) {
            $("#lightbox_go_right").addClass("faded")
        } else {
            $("#lightbox_go_right").removeClass("faded")
        }
    },
    goLeft: function() {
        if (TS.ui.lightbox_dialog.current_index == 0) {
            return
        }
        TS.ui.lightbox_dialog.navigate(-1)
    },
    goRight: function() {
        if (TS.ui.lightbox_dialog.current_index == TS.ui.lightbox_dialog.gallery.length - 1) {
            return
        }
        TS.ui.lightbox_dialog.navigate(1)
    },
    navigate: function(c) {
        var f, g, h, b, d, a;
        TS.ui.lightbox_dialog.current_index += c;
        f = TS.ui.lightbox_dialog.gallery[TS.ui.lightbox_dialog.current_index];
        if (f.getAttribute("data-file-id")) {
            g = TS.ui.lightbox_dialog.current_image_id = f.getAttribute("data-file-id");
            TS.ui.lightbox_dialog.renderImage(g)
        } else {
            h = TS.ui.lightbox_dialog.current_image_id = f.getAttribute("data-src");
            b = f.getAttribute("data-link-url");
            d = f.getAttribute("data-width");
            a = f.getAttribute("data-height");
            TS.ui.lightbox_dialog.renderImage(h, true, b, d, a)
        }
        TS.ui.lightbox_dialog.preloadImage(TS.ui.lightbox_dialog.current_index + c * TS.ui.lightbox_dialog.preload_dist)
    },
    updateCurrentIndex: function() {
        for (var a = 0; a < TS.ui.lightbox_dialog.gallery.length; a++) {
            if (TS.ui.lightbox_dialog.gallery[a].getAttribute("data-file-id")) {
                if (TS.ui.lightbox_dialog.gallery[a].getAttribute("data-file-id") == TS.ui.lightbox_dialog.current_image_id) {
                    TS.ui.lightbox_dialog.current_index = a
                }
            } else {
                if (TS.ui.lightbox_dialog.gallery[a].getAttribute("data-src") == TS.ui.lightbox_dialog.current_image_id) {
                    TS.ui.lightbox_dialog.current_index = a
                }
            }
        }
    },
    renderImage: function(d, g, c, b, f) {
        var a = TS.ui.lightbox_dialog.loaded_images[d];
        TS.ui.lightbox_dialog.div.addClass("loading");
        TS.ui.lightbox_dialog.div.find(".lightbox_image").removeClass("loaded");
        if (a) {
            TS.ui.lightbox_dialog.div.find("#lightbox_image_container").html(a)
        } else {
            TS.ui.lightbox_dialog.loadImage(d, g, c, b, f, function() {
                TS.ui.lightbox_dialog.div.find("#lightbox_image_container").html(TS.ui.lightbox_dialog.loaded_images[d])
            })
        }
        TS.ui.lightbox_dialog.div.imagesLoaded(function() {
            TS.ui.lightbox_dialog.div.find("#spinner").removeClass("loading");
            TS.ui.lightbox_dialog.position();
            TS.ui.lightbox_dialog.div.find(".lightbox_meta").click(function(i) {
                var h = $(this).data("url");
                if (!i.target.href) {
                    TS.utility.openInNewTab(h, h)
                }
            })
        });
        TS.ui.lightbox_dialog.current_image_id = d;
        if (TS.ui.lightbox_dialog.is_gallery) {
            TS.ui.lightbox_dialog.updateArrows()
        }
    },
    preloadImage: function(g) {
        var f, d, h, b, c, a;
        if (g >= 0 && g < TS.ui.lightbox_dialog.gallery.length) {
            f = TS.ui.lightbox_dialog.gallery[g];
            if (f.getAttribute("data-file-id")) {
                d = f.getAttribute("data-file-id");
                if (!TS.ui.lightbox_dialog.loaded_images[d]) {
                    TS.ui.lightbox_dialog.loadImage(d)
                }
            } else {
                h = f.getAttribute("data-src");
                b = f.getAttribute("data-link-url");
                c = f.getAttribute("data-width");
                a = f.getAttribute("data-height");
                if (!TS.ui.lightbox_dialog.loaded_images[h]) {
                    TS.ui.lightbox_dialog.loadImage(h, true, b, c, a)
                }
            }
        }
    },
    loadImage: function(i, h, d, k, b, l) {
        var g, a, c, f, j;
        g = "";
        $("#lightbox_preloader").append('<div class="lightbox_loading_image" data-file-id-or-src="' + i + '"></div>');
        a = $('*[data-file-id-or-src="' + i + '"]');
        if (h) {
            if (k && b) {
                g = TS.templates.lightbox_external_image_container({
                    file_src: i,
                    link_url: d,
                    img_width: k,
                    img_height: b
                })
            } else {
                g = TS.templates.lightbox_external_image_container({
                    file_src: i,
                    link_url: d
                })
            }
        } else {
            c = TS.files.getFileById(i);
            f = TS.members.getMemberById(c.user);
            g = TS.templates.lightbox_image_container({
                file: c,
                member: f
            })
        }
        a.html(g);
        j = new Spinner({
            lines: 13,
            length: 10,
            width: 2,
            radius: 10,
            corners: 1,
            rotate: 0,
            direction: 1,
            color: "#FFF",
            speed: 1.3,
            trail: 60,
            shadow: false,
            hwaccel: true,
            className: "spinner",
            zIndex: 2000000000,
            top: 10,
            left: 10
        }).spin(a.find("#spinner")[0]);
        TS.ui.lightbox_dialog.loaded_images[i] = a;
        if (l) {
            l()
        }
    },
    position: function() {
        var r, f, o, h, c, b, m, p, d, n, a, l, s, g, q, j;
        r = $(window).height();
        f = $(window).width();
        o = 16;
        h = 16;
        c = TS.ui.lightbox_dialog.div.find(".lightbox_image");
        b = new Image();
        b.src = c.attr("src");
        p = b.width;
        d = b.height;
        if (p == 0 && d == 0) {
            p = c.data("width");
            d = c.data("height")
        }
        n = c.data("exif-orientation");
        if (n == 6 || n == 8) {
            a = p;
            p = d;
            d = a
        }
        for (var k = 1; k < 9; k++) {
            m = TS.ui.lightbox_dialog.div.find(".modal-body");
            if (n == k) {
                m.addClass("orientation_" + k)
            } else {
                m.removeClass("orientation_" + k)
            }
        }
        l = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            width: p,
            height: d,
            max_width: f - (h * 2),
            max_height: r - (o * 2)
        };
        if (d > l.max_height && p > l.max_width) {
            s = l.max_height / d;
            g = l.max_width / p;
            if (s < g) {
                l.height = l.max_height;
                l.width = s * p
            } else {
                l.height = g * d;
                l.width = l.max_width
            }
        } else {
            if (d > l.max_height) {
                s = l.max_height / d;
                l.height = l.max_height;
                l.width = s * p
            } else {
                if (p > l.max_width) {
                    g = l.max_width / p;
                    l.height = g * d;
                    l.width = l.max_width
                }
            }
        }
        q = (r - l.height) / 2;
        j = (f - l.width) / 2;
        l.top = l.bottom = q;
        l.right = l.left = j;
        TS.ui.lightbox_dialog.div.removeClass("loading").css({
            top: l.top,
            bottom: l.bottom,
            left: l.left,
            right: l.right,
            width: l.width,
            height: l.height,
            "max-width": l.max_width,
            "max-height": l.max_height
        });
        if (n == 6 || n == 8) {
            c.css({
                width: l.height,
                height: l.width,
                "max-width": l.max_height,
                "max-height": l.max_width
            })
        } else {
            c.css({
                width: "",
                height: "",
                "max-width": "",
                "max-height": ""
            })
        } if (l.width < 200 || l.height < 100) {
            TS.ui.lightbox_dialog.div.addClass("small")
        } else {
            TS.ui.lightbox_dialog.div.removeClass("small")
        }
        c.addClass("loaded")
    },
    cancel: function() {
        TS.ui.lightbox_dialog.div.modal("hide")
    },
    end: function() {
        TS.ui.lightbox_dialog.showing = TS.model.dialog_is_showing = false;
        TS.ui.lightbox_dialog.timeout = null;
        TS.ui.lightbox_dialog.div.empty();
        $(window.document).unbind("keydown", TS.ui.lightbox_dialog.onKeydown);
        $(window.document).unbind("mousemove", TS.ui.lightbox_dialog.fadeControls)
    },
    build: function() {
        var a;
        $("body").append('<div id="lightbox_dialog" class="lightbox_dialog modal gallery hide fade"></div>');
        a = TS.ui.lightbox_dialog.div = $("#lightbox_dialog");
        a.on("hidden", function(c) {
            var b;
            if (c.target != this) {
                return
            }
            TS.ui.lightbox_dialog.end();
            window.setTimeout(function() {
                var d = $(".modal-backdrop");
                if (d && !TS.ui.lightbox_dialog.showing) {
                    d.remove()
                }
            }, 1000)
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.lightbox_dialog.showing = TS.model.dialog_is_showing = true
        });
        a.on("shown", function(b) {
            if (b.target != this) {
                return
            }
            $(window.document).bind("keydown", TS.ui.lightbox_dialog.onKeydown);
            $(window.document).bind("mousemove", TS.ui.lightbox_dialog.fadeControls)
        });
        a.on("click", function(b) {
            TS.ui.lightbox_dialog.cancel();
            TS.view.doLinkThings(b)
        })
    }
});
TS.registerModule("view.overlay", {
    $msgs_overlay: null,
    show_another_interstitial_after: false,
    onStart: function() {
        TS.client.login_sig.add(TS.view.overlay.onLogin, TS.view.overlay);
        TS.view.overlay.$msgs_overlay = $("#msgs_overlay_div");
        $(window).resize(TS.view.overlay.onResize);
        $(window.document).keydown(function(a) {
            if (!TS.model.overlay_is_showing) {
                return
            }
            if (a.which == TS.utility.keymap.enter || a.which == TS.utility.keymap.esc) {
                if (TS.view.overlay.performCancel) {
                    TS.view.overlay.performCancel()
                } else {
                    TS.view.overlay.cancel(true)
                }
            }
        })
    },
    onLogin: function(a, b) {},
    performCancel: null,
    startWithJoinedChannel: function(a) {
        TS.view.overlay.start();
        TS.view.overlay.show_another_interstitial_after = true;
        TS.view.overlay.$msgs_overlay.html(TS.templates.channel_join_overlay({
            invited: false,
            channel: a
        }));
        $("#channel_joined").bind("click.view", TS.view.onChannelOverlayClick);
        TS.view.overlay.performCancel = function(b) {
            a.needs_joined_message = false;
            TS.view.overlay.cancel(true);
            TS.view.overlay.performCancel = null
        };
        TS.view.overlay.$msgs_overlay.find("a.btn").bind("click.clear_overlay", TS.view.overlay.performCancel)
    },
    startWithInvitedChannel: function(a) {
        TS.view.overlay.start();
        TS.view.overlay.show_another_interstitial_after = true;
        TS.view.overlay.$msgs_overlay.html(TS.templates.channel_join_overlay({
            invited: true,
            channel: a
        }));
        $("#channel_joined").bind("click.view", TS.view.onChannelOverlayClick);
        TS.view.overlay.performCancel = function(b) {
            a.needs_invited_message = false;
            TS.view.overlay.cancel(true);
            TS.view.overlay.performCancel = null
        };
        TS.view.overlay.$msgs_overlay.find("a.btn").bind("click.clear_overlay", TS.view.overlay.performCancel)
    },
    startWithCreatedChannel: function(a) {
        TS.view.overlay.start();
        TS.view.overlay.show_another_interstitial_after = true;
        TS.view.overlay.$msgs_overlay.html(TS.templates.channel_create_overlay({
            channel: a
        }));
        $("#channel_created").bind("click.view", TS.view.onChannelOverlayClick);
        TS.view.overlay.performCancel = function(b) {
            a.needs_created_message = false;
            TS.view.overlay.cancel(true);
            TS.view.overlay.performCancel = null
        };
        TS.view.overlay.$msgs_overlay.find("a.invite_link").bind("click.invite_and_clear_overlay", function(b) {
            TS.ui.invite.showInviteMembersFromChannelDialog(a.id);
            TS.view.overlay.performCancel(b)
        });
        TS.view.overlay.$msgs_overlay.find("a.btn").bind("click.clear_overlay", TS.view.overlay.performCancel)
    },
    startWithInvitedGroup: function(a) {
        TS.view.overlay.start();
        TS.view.overlay.show_another_interstitial_after = true;
        TS.view.overlay.$msgs_overlay.html(TS.templates.group_join_overlay({
            invited: true,
            group: a
        }));
        $("#group_joined").bind("click.view", TS.view.onChannelOverlayClick);
        TS.view.overlay.performCancel = function(b) {
            a.needs_invited_message = false;
            TS.view.overlay.cancel(true);
            TS.view.overlay.performCancel = null
        };
        TS.view.overlay.$msgs_overlay.find("a.btn").bind("click.clear_overlay", TS.view.overlay.performCancel);
        $("#group_joined").wrap('<div id="group_joined_wrapper">');
        $("#group_joined_wrapper").monkeyScroll()
    },
    startWithCreatedGroup: function(a) {
        TS.view.overlay.start();
        TS.view.overlay.show_another_interstitial_after = true;
        TS.view.overlay.$msgs_overlay.html(TS.templates.group_create_overlay({
            group: a
        }));
        $(window).trigger("resize");
        $("#group_created").bind("click.view", TS.view.onChannelOverlayClick);
        TS.view.overlay.performCancel = function(b) {
            a.needs_created_message = false;
            TS.view.overlay.cancel(true);
            TS.view.overlay.performCancel = null
        };
        TS.view.overlay.$msgs_overlay.find("a.btn").bind("click.clear_overlay", TS.view.overlay.performCancel)
    },
    startWithGrowlPromptDisplay: function() {
        TS.view.overlay.start();
        TS.view.overlay.show_another_interstitial_after = true;
        var a = TS.view.overlay.$msgs_overlay;
        a.html(TS.templates.growl_prompt_overlay({}));
        a.find(".prompt_allow").bind("click", function(b) {
            TS.view.overlay.onGrowlsPermissionClick(b)
        });
        a.find(".prompt_cancel_forever").bind("click", function(b) {
            createCookie("no_growl_prompt", "1", 365 * 10);
            $("#growl_prompt_div").addClass("hidden");
            TS.view.overlay.cancel()
        });
        a.find(".see-apps").bind("click", function(b) {
            createCookie("no_growl_prompt", "1", 0.5);
            $("#growl_prompt_div").addClass("hidden");
            TS.view.overlay.cancel()
        });
        a.find(".prompt_cancel").bind("click", function(b) {
            $("#growl_prompt_div").addClass("hidden");
            TS.view.overlay.cancel()
        });
        a.find(".prompt_test").bind("click", function(b) {
            $("#growl_prompt_div").addClass("hidden");
            TS.ui.playSound("new_message");
            TS.ui.growls.show("Test Notification", "Hey! it works", null, null, true, {
                id: "test_notification"
            })
        });
        if (TS.ui.growls.no_notifications) {
            $("#growl_prompt_overlay_impossible").removeClass("hidden")
        } else {
            $("#growl_prompt_overlay_start").removeClass("hidden")
        }
    },
    onGrowlsPermissionClick: function() {
        $("#growl_prompt_overlay_start").addClass("hidden");
        $("#growl_prompt_overlay_tell_to_allow").removeClass("hidden");
        TS.ui.growls.promptForPermission(function(b, a) {
            $("#growl_prompt_overlay_tell_to_allow").addClass("hidden");
            if (a == "granted" && b) {
                $("#growl_prompt_overlay_success").removeClass("hidden");
                TS.prefs.setPrefByAPI({
                    name: "growls_enabled",
                    value: true
                })
            } else {
                if (a == "default") {
                    $("#growl_prompt_overlay_start").removeClass("hidden")
                } else {
                    if (a == "denied") {
                        $("#growl_prompt_overlay_disallowed").removeClass("hidden")
                    } else {
                        alert("huh allowed:" + b + " permission_level:" + a)
                    }
                }
            }
        })
    },
    start: function(a) {
        if (TS.model.overlay_is_showing) {
            return
        }
        TS.view.overlay.$msgs_overlay.stop();
        TS.view.overlay.$msgs_overlay.empty();
        TS.view.overlay.$msgs_overlay.removeClass("hidden");
        if (a) {
            TS.view.overlay.$msgs_overlay.css("opacity", 0);
            TS.view.overlay.$msgs_overlay.transition({
                opacity: 1
            }, 250)
        } else {
            TS.view.overlay.$msgs_overlay.css("opacity", 1)
        }
        TS.model.overlay_is_showing = true
    },
    cancel: function(d) {
        var c = TS.model.overlay_is_showing;
        TS.model.overlay_is_showing = false;
        var a = TS.view.overlay.$msgs_overlay.find("#no_joined_overlays_cb");
        if (a.length && a.prop("checked")) {
            TS.prefs.setPrefByAPI({
                name: "no_joined_overlays",
                value: true
            })
        }
        var b = TS.view.overlay.$msgs_overlay.find("#no_created_overlays_cb");
        if (b.length && b.prop("checked")) {
            TS.prefs.setPrefByAPI({
                name: "no_created_overlays",
                value: true
            })
        }
        TS.view.overlay.$msgs_overlay.transition({
            opacity: 0
        }, 250, function() {
            TS.view.overlay.end()
        });
        if (TS.view.overlay.show_another_interstitial_after) {
            TS.view.overlay.show_another_interstitial_after = false;
            TS.view.showInterstitialAfterChannelOrImShown()
        }
        if (c && d) {
            TS.ui.checkUnreads()
        }
    },
    cancelFromSendingMessage: function() {
        if (!TS.model.overlay_is_showing) {
            return
        }
        if (TS.view.overlay.performCancel) {
            TS.view.overlay.performCancel()
        } else {
            TS.view.overlay.cancel(true)
        }
    },
    end: function() {
        TS.view.overlay.$msgs_overlay.addClass("hidden");
        TS.model.overlay_is_showing = false
    },
    onResize: function(a) {}
});
TS.registerModule("ui.invite", {
    onStart: function() {},
    showInviteMembersFromChannelDialog: function(b) {
        var f = TS.channels.getChannelById(b);
        var d = TS.channels.getActiveMembersNotInThisChannelForInviting(f.id, true);
        var g = (TS.model.user.is_admin) ? d : TS.channels.getActiveMembersNotInThisChannelForInviting(f.id);
        var a = TS.channels.makeMembersWithPreselectsForTemplate(g);
        if (a.length) {
            TS.generic_dialog.start({
                title: "Invite new members to #" + f.name,
                body: TS.templates.channel_member_invite_list({
                    invite_members: a,
                    show_ra_tip: g.length != d.length
                }),
                show_cancel_button: true,
                show_go_button: true,
                go_button_text: "Invite New Members",
                on_go: function() {
                    var j = $("#select_invite_channel_members").val();
                    if (j) {
                        for (var h = 0; h < j.length; h++) {
                            TS.api.call("channels.invite", {
                                channel: f.id,
                                user: j[h]
                            })
                        }
                    } else {
                        return false
                    }
                },
                on_end: function() {
                    $(".modal-body").css("overflow-y", "auto")
                }
            });
            $("#select_invite_channel_members").chosen({
                placeholder_text_multiple: " ",
                multiple_always_open: true,
                multiple_select_maintains_winnow: false
            });
            var c = 0;
            $("#select_invite_channel_members").bind("focus", function() {
                $("#select_invite_channel_members_holder").find(".chzn-drop").show();
                c = c + 1;
                if (c == 2) {
                    $("#select_invite_channel_members").bind("blur", function() {
                        $("#select_invite_channel_members_holder").find(".chzn-drop").hide()
                    })
                }
            });
            $("#select_invite_channel_members_chzn").find(".chzn-results").css("max-height", "200px");
            $("#select_invite_channel_members_holder").css("min-height", 250);
            $("#select_invite_channel_members_chzn").find(".chzn-choices").css({
                "max-height": 58,
                "overflow-y": "scroll"
            });
            $(".modal-body").css("overflow-y", "visible");
            $("#select_invite_channel_members_chzn").css("width", "100%");
            $("#select_invite_channel_members_chzn").find(".default").css("width", "100%");
            if (TS.model.user.is_admin) {
                $("#generic_dialog").find(".modal-footer").prepend('<span class="mini float-left small_top_margin">Or, <a href="/admin/invites" target="new">invite a new person to your team</a></span>')
            }
        } else {
            TS.generic_dialog.start({
                title: "Everyone is already in this channel",
                body: "Since everyone is already in this channel, there is no one to invite!",
                show_cancel_button: false,
                show_go_button: true,
                go_button_text: "OK",
                esc_for_ok: true
            })
        }
    },
    showInviteMembersFromGroupDialog: function(a) {
        TS.ui.invite.showInviteMembersDialogWorker(a)
    },
    showInviteMembersPreSelected: function(c, a, b) {
        TS.ui.invite.showInviteMembersDialogWorker(c, a, b)
    },
    showInviteMembersDialogWorker: function(n, h, g) {
        h = h || [];
        var m = TS.groups.getGroupById(n);
        var k = TS.groups.getActiveMembersNotInThisGroupForInviting(m.id, true);
        var j = (TS.model.user.is_admin) ? k : TS.groups.getActiveMembersNotInThisGroupForInviting(m.id);
        var a = TS.channels.makeMembersWithPreselectsForTemplate(j);
        if (a.length) {
            var d = false;
            var c = function(i) {
                d = true;
                $("#archive_access_cb").prop("checked", i);
                $("#generic_dialog").find(".dialog_secondary_go").addClass("hidden");
                $("#generic_dialog").find(".dialog_go").text("Invite New Members").removeClass("btn-success");
                $("#group_invite_archives_prompt").addClass("hidden");
                $("#group_invite_member_chooser").removeClass("hidden");
                $("#select_invite_group_members").trigger("liszt:activate");
                if (TS.model.user.is_admin) {
                    $("#generic_dialog").find(".modal-footer").prepend('<span class="mini float-left small_top_margin">Or, <a href="/admin/invites" target="new">invite a new person to your team</a></span>')
                }
                return
            };
            var b = function(q, p) {
                if (g) {
                    TS.groups.removeMsg(m.id, TS.utility.msgs.getMsg(g, m.msgs))
                }
                if (q) {
                    for (var o = 0; o < p.length; o++) {
                        TS.api.call("groups.invite", {
                            channel: m.id,
                            user: p[o]
                        })
                    }
                    return true
                }
                TS.groups.createChild(m.id, p, function(r, s, i) {
                    if (!r) {
                        if (s && s.error == "restricted_action") {
                            setTimeout(function() {
                                TS.generic_dialog.alert("<p>You don't have permission to create new groups.</p><p>Talk to your team owner.</p>")
                            }, 500)
                        } else {
                            alert("failed! " + s.error)
                        }
                        return
                    }
                })
            };
            var l = "new members";
            if (h.length) {
                l = "";
                for (var f = 0; f < h.length; f++) {
                    if (f != 0) {
                        if (f == h.length - 1) {
                            if (h.length > 2) {
                                l += ","
                            }
                            l += " and "
                        } else {
                            l += ", "
                        }
                    }
                    l += "<b>" + TS.members.getMemberDisplayName(TS.members.getMemberById(h[f]), true) + "</b>"
                }
            }
            TS.generic_dialog.start({
                title: "Invite " + l + " to " + TS.model.group_prefix + m.name,
                body: TS.templates.group_member_invite_list({
                    invite_members: a,
                    group: m,
                    show_ra_tip: j.length != k.length
                }),
                show_cancel_button: true,
                show_go_button: true,
                go_button_text: "Yes, show group history",
                go_button_class: "btn-success",
                show_secondary_go_button: true,
                secondary_go_button_text: "No, hide group history",
                on_go: function() {
                    if (!d) {
                        if (h.length) {
                            return b(true, h)
                        }
                        c(true);
                        return false
                    } else {
                        var i = !!$("#archive_access_cb").prop("checked");
                        var o = $("#select_invite_group_members").val();
                        if (!o) {
                            return false
                        }
                        return b(i, o)
                    }
                },
                on_secondary_go: function() {
                    if (h.length) {
                        return b(false, h)
                    }
                    c(false);
                    return false
                },
                on_end: function() {
                    $(".modal-body").css("overflow-y", "auto")
                }
            });
            $("#select_invite_group_members").chosen({
                placeholder_text_multiple: " ",
                multiple_always_open: true,
                multiple_select_maintains_winnow: false
            });
            $("#select_invite_group_members_chzn").find(".chzn-results").css("max-height", "200px");
            $("#select_invite_group_members_holder").css("min-height", 235);
            $(".modal-body").css("overflow-y", "visible");
            $("#select_invite_group_members_chzn").css("width", "100%");
            $("#select_invite_group_members_chzn").find(".default").css("width", "100%")
        } else {
            TS.generic_dialog.start({
                title: "Everyone is already in this group",
                body: "Since everyone is already in this group, there is no one to invite!",
                show_cancel_button: false,
                show_go_button: true,
                go_button_text: "OK",
                esc_for_ok: true
            })
        }
    },
    showInviteMemberToChannelDialog: function(b) {
        var c = TS.members.getMemberById(b);
        var a = TS.members.getMyChannelsThatThisMemberIsNotIn(c.id);
        if (TS.model.user.is_ultra_restricted) {
            TS.generic_dialog.start({
                title: "Invite " + TS.members.getMemberDisplayName(c, true) + " to a channel",
                body: "You are not allowed to invite other members to channels.",
                show_cancel_button: false
            })
        } else {
            if (c.is_ultra_restricted) {
                TS.generic_dialog.start({
                    title: "Invite " + TS.members.getMemberDisplayName(c, true) + " to a channel",
                    body: TS.members.getMemberDisplayName(c, true) + " cannot be invited to any new channels.",
                    show_cancel_button: false
                })
            } else {
                if (c.is_restricted && !TS.model.user.is_admin) {
                    TS.generic_dialog.start({
                        title: "Invite " + TS.members.getMemberDisplayName(c, true) + " to a channel",
                        body: "Only a team admin can invite " + TS.members.getMemberDisplayName(c, true) + " into new channels.",
                        show_cancel_button: false
                    })
                } else {
                    if (a.length) {
                        TS.generic_dialog.start({
                            title: "Invite " + TS.members.getMemberDisplayName(c, true) + " to a channel",
                            body: TS.templates.channel_invite_list({
                                channels: a
                            }),
                            show_cancel_button: true,
                            show_go_button: true,
                            go_button_text: "Invite",
                            on_go: function() {
                                var d = $("#select_invite_channels").val();
                                if (d != "ts_null_value") {
                                    TS.api.call("channels.invite", {
                                        channel: d,
                                        user: c.id
                                    })
                                } else {
                                    return false
                                }
                            }
                        })
                    } else {
                        TS.generic_dialog.start({
                            title: "" + TS.members.getMemberDisplayName(c, true) + " is already in all the channels you are in",
                            body: "Since " + TS.members.getMemberDisplayName(c, true) + " is already in all the channels you are in, there is nothing to invite them to!",
                            show_cancel_button: false,
                            show_go_button: true,
                            go_button_text: "OK",
                            esc_for_ok: true
                        })
                    }
                }
            }
        }
    },
    showInviteMemberToGroupDialog: function(b) {
        if (!TS.model.allow_invite_to_group_from_person) {
            TS.error("showInviteMemberToGroupDialog disabled (You should never see this because no one shoudl be calling this function!)");
            return
        }
        var g = TS.members.getMemberById(b);
        var d = TS.members.getMyGroupsThatThisMemberIsNotIn(g.id);
        var c;
        var f;
        if (TS.model.user.is_admin) {
            f = c = TS.groups.getActiveMembersForInviting()
        } else {
            c = TS.groups.getActiveMembersForInviting(true);
            f = TS.groups.getActiveMembersForInviting()
        }
        var a = TS.channels.makeMembersWithPreselectsForTemplate(f, [b]);
        TS.generic_dialog.start({
            title: "Invite " + TS.members.getMemberDisplayName(g, true) + " to a group",
            body: TS.templates.group_invite_list({
                groups: d,
                show_ra_tip: f.length != c.length
            }) + TS.templates.group_create({
                invite_members: a,
                preselected: b
            }),
            show_cancel_button: true,
            show_go_button: true,
            go_button_text: "Invite",
            on_go: function() {
                var h = $("#select_invite_groups").val();
                if (h != "ts_null_value") {
                    TS.api.call("groups.invite", {
                        channel: h,
                        user: g.id
                    })
                } else {
                    if (!TS.ui.group_create_dialog.validateAndSubmit()) {
                        return false
                    }
                }
            }
        });
        TS.ui.group_create_dialog.bindCreateInvite()
    }
});
TS.registerModule("ui.banner", {
    onStart: function() {
        TS.client.login_sig.add(TS.ui.banner.loggedIn, TS.ui.banner);
        TS.ui.growls.permission_changed_sig.add(TS.ui.banner.growlsPermissionChanged, TS.ui.banner)
    },
    loggedIn: function() {
        if (TS.qs_args.show_notifications_banner == "1" || TS.qs_args.show_banner == "1") {
            TS.ui.banner.show("notifications");
            return
        }
        var a = !TS.model.is_iOS && !TS.ui.growls.no_notifications && TS.ui.growls.shouldShowPermissionButton() && TS.ui.growls.getPermissionLevel() != "denied" && readCookie("no_growl_banner") != "1";
        if (a) {
            TS.ui.banner.show("notifications");
            return
        }
    },
    growlsPermissionChanged: function(b, a) {
        if (a != "default") {
            TS.ui.banner.close()
        }
    },
    show: function(b) {
        var b = b || "notifications";
        var a = TS.view.banner_el;
        a.removeClass("hidden");
        $("body").addClass("banner_showing");
        a.css("display", "block");
        a.children(".banner_content").addClass("hidden");
        if (b == "notifications_dismiss") {
            $("#notifications_dismiss_banner").removeClass("hidden");
            a.unbind("click").bind("click", function(c) {
                TS.ui.banner.close()
            })
        } else {
            if (b == "notifications") {
                $("#notifications_banner").removeClass("hidden");
                a.unbind("click").bind("click", function(c) {
                    if ($(c.target).closest(".dismiss").length == 0) {
                        setTimeout(function() {
                            TS.ui.prefs_dialog.start("notifications")
                        }, 500)
                    } else {
                        $("#notifications_banner").addClass("hidden");
                        TS.ui.banner.show("notifications_dismiss");
                        return
                    }
                    TS.ui.banner.close()
                })
            }
        }
        TS.view.resizeManually("TS.ui.banner.show")
    },
    closeNagAndSetCookie: function() {
        TS.ui.banner.close();
        createCookie("no_growl_banner", "1", 365 * 10)
    },
    closeNagAndOpenPrefs: function() {
        TS.ui.banner.close();
        setTimeout(function() {
            TS.ui.prefs_dialog.start("notifications")
        }, 500)
    },
    close: function() {
        var a = TS.view.banner_el;
        a.slideUp(200, function() {
            a.addClass("hidden");
            $("body").removeClass("banner_showing");
            var b = (TS.client && TS.ui.areMsgsScrolledToBottom());
            TS.view.resizeManually("TS.ui.banner.close");
            if (b) {
                TS.ui.instaScrollMsgsToBottom(false)
            }
        })
    }
});
TS.registerModule("ui.msg_tab_complete", {
    $el: null,
    $input: null,
    $scroller: null,
    current_matches: null,
    is_showing: false,
    last_shown_matches: null,
    show_delay_tim: 0,
    show_delay_ms: 500,
    lazy_load: null,
    date_start: new Date(),
    onStart: function() {},
    start: function(b) {
        if (TS.ui.msg_tab_complete.$el) {
            return
        }
        $("body").append('<div id="chat_input_tab_ui" class="hidden inactive"> 				<div id="chat_input_tab_ui_header"> 					<span class="header_label"></span> 					<span class="header_help"><strong>tab</strong>&nbsp; or &nbsp;<strong>&uarr;</strong> <strong>&darr;</strong>&nbsp; to navigate <strong class="left_margin">â†?/strong>&nbsp; to select <strong class="left_margin">esc</strong>&nbsp; to dismiss</span> 				</div> 				<div id="chat_input_tab_ui_scroller"></div> 			</div>');
        TS.ui.msg_tab_complete.$el = $("#chat_input_tab_ui");
        TS.ui.msg_tab_complete.$scroller = $("#chat_input_tab_ui_scroller");
        var a = TS.qs_args.debug_scroll == "1";
        TS.ui.msg_tab_complete.$scroller.monkeyScroll({
            debug: a
        });
        TS.ui.msg_tab_complete.$input = b;
        TS.ui.msg_tab_complete.$el.bind("click", TS.ui.msg_tab_complete.onElClick);
        b.bind("matches_set", TS.ui.msg_tab_complete.onInputMatchesSet);
        b.bind("match_changed", TS.ui.msg_tab_complete.onInputMatchChanged);
        b.bind("reset", TS.ui.msg_tab_complete.onInputReset)
    },
    show_threshold: 1000,
    show_slow: null,
    show: function(a) {
        var g = new Date();
        a.shown_callback();
        var b = TS.ui.msg_tab_complete.$el;
        var d = TS.ui.msg_tab_complete.$scroller;
        var f = a.current_matches.join("");
        if (TS.ui.msg_tab_complete.last_shown_matches !== f) {
            TS.ui.msg_tab_complete.last_shown_matches = f;
            TS.ui.msg_tab_complete.buildAndInsertHTML(a)
        }
        if (!TS.ui.msg_tab_complete.is_showing) {
            b.removeClass("inactive").removeClass("hidden");
            $("#chat_input_tab_ui_scroller").trigger("resize-immediate")
        }
        TS.ui.msg_tab_complete.is_showing = true;
        $("html").unbind("mousedown.tabcomplete").bind("mousedown.tabcomplete", TS.ui.msg_tab_complete.onMouseDown);
        d.data("monkeyScroll").updateFunc();
        TS.ui.msg_tab_complete.positionUI();
        var c = new Date() - g;
        if (a && a.w && c > TS.ui.msg_tab_complete.show_threshold && !TS.ui.msg_tab_complete.show_slow) {
            if (a.w === "emoji") {
                TS.logError({
                    message: "TS.ui.msg_tab_complete.show() with emoji > " + TS.ui.msg_tab_complete.show_threshold + " ms"
                }, " emoji took " + c + " ms for " + a.current_matches.length + " items. localStorage = " + (TS.model.prefs.ls_disabled ? 0 : 1))
            } else {
                if (a.w === "members") {
                    TS.logError({
                        message: "TS.ui.msg_tab_complete.show() with members > " + TS.ui.msg_tab_complete.show_threshold + " ms"
                    }, " members took " + c + " ms for " + a.current_matches.length + " items. Member images: " + ((!TS.model.mac_ssb_version || matches.length < 100) ? "included." : "excluded.") + " App open for " + ((new Date() - TS.ui.msg_tab_complete.date_start) / 1000 / 60).toFixed(2) + " min.")
                }
            }
            TS.ui.msg_tab_complete.show_slow = true
        }
    },
    hide: function() {
        var a = TS.ui.msg_tab_complete.$el;
        TS.ui.msg_tab_complete.is_showing = false;
        a.addClass("inactive");
        a.addClass("hidden");
        TS.ui.msg_tab_complete.last_shown_matches = null
    },
    onElClick: function(b) {
        var c = TS.ui.msg_tab_complete.$input;
        var a = $(b.target).closest(".chat_input_tab_item");
        if (!a.length) {
            return
        }
        c.TS_tabComplete2("choose", a.data("index"))
    },
    onInputMatchesSet: function(d, a) {
        clearTimeout(TS.ui.msg_tab_complete.show_delay_tim);
        var b = TS.ui.msg_tab_complete.$el;
        var f = TS.ui.msg_tab_complete.$scroller;
        TS.ui.msg_tab_complete.current_matches = a.current_matches;
        if (a.hide_ui) {
            TS.ui.msg_tab_complete.hide()
        } else {
            var c = function() {
                TS.ui.msg_tab_complete.show(a);
                f.scrollTop(0);
                if (a.i != -1) {
                    b.find('.chat_input_tab_item[data-index="' + a.i + '"]:not(.just_one)').addClass("active").scrollintoview({
                        duration: 10
                    })
                }
            };
            if (a.delay_ui) {
                TS.ui.msg_tab_complete.show_delay_tim = setTimeout(c, TS.ui.msg_tab_complete.show_delay_ms);
                f.scrollTop(0);
                if (a.i != -1) {
                    b.find('.chat_input_tab_item[data-index="' + a.i + '"]:not(.just_one)').addClass("active").scrollintoview({
                        duration: 10
                    })
                }
                f.data("monkeyScroll").updateFunc();
                TS.ui.msg_tab_complete.positionUI()
            } else {
                c()
            }
        }
    },
    onInputMatchChanged: function(c, a) {
        clearTimeout(TS.ui.msg_tab_complete.show_delay_tim);
        var b = TS.ui.msg_tab_complete.$el;
        if (!TS.ui.msg_tab_complete.current_matches) {
            TS.ui.msg_tab_complete.onInputMatchesSet(c, a);
            return
        }
        TS.ui.msg_tab_complete.show(a);
        b.find(".chat_input_tab_item").removeClass("active");
        b.find('.chat_input_tab_item[data-index="' + a.i + '"]').addClass("active").scrollintoview({
            duration: 10
        })
    },
    onInputReset: function(c, a) {
        clearTimeout(TS.ui.msg_tab_complete.show_delay_tim);
        var b = TS.ui.msg_tab_complete.$el;
        $("html").unbind("mousedown.tabcomplete");
        TS.ui.msg_tab_complete.hide();
        TS.ui.msg_tab_complete.current_matches = null
    },
    positionUI: function() {
        if (!TS.ui.msg_tab_complete.$el || !TS.ui.msg_tab_complete.$el.length) {
            return
        }
        var b = TS.ui.msg_tab_complete.$el;
        var f = TS.ui.msg_tab_complete.$input;
        b.css({
            width: Math.max(f.width(), 500)
        });
        var c = f.offset();
        var a = c.left;
        var d = c.top - b.outerHeight();
        b.css({
            top: d,
            left: a
        })
    },
    onMouseDown: function(b) {
        var a = TS.ui.msg_tab_complete.$el;
        var c = TS.ui.msg_tab_complete.$input;
        if ($(b.target).closest(a).length == 0 && $(b.target).closest(c).length == 0) {
            c.TS_tabComplete2("reset", "mousedown")
        }
    },
    buildItemsHTML: function(l) {
        var h = [];
        var f = TS.ui.msg_tab_complete.current_matches;
        var m = "type_" + l.w;
        h.push('<ul class="' + m + '">');
        var c = f.length == 1;
        var j = false;
        var a = {};
        for (var g = 0; g < f.length; g++) {
            if (l.w == "emoji") {
                h.push('<li class="chat_input_tab_item" data-index="' + g + '">' + TS.ui.msg_tab_complete.buildEmojiHTML(f[g]) + "</li>")
            } else {
                if (l.w == "channels") {
                    h.push('<li class="chat_input_tab_item" data-index="' + g + '">' + TS.ui.msg_tab_complete.buildChannelHTML(f[g]) + "</li>")
                } else {
                    if (l.w == "cmds") {
                        h.push('<li class="chat_input_tab_item ' + (c ? "just_one" : "") + '" data-index="' + g + '">' + TS.ui.msg_tab_complete.buildCmdHTML(f[g], c) + "</li>");
                        if (j) {
                            var b = TS.utility.clone(TS.cmd_handlers[f[g]]);
                            if (b) {
                                a[f[g]] = b;
                                for (var d in b) {
                                    if (!b[d] || d == "autocomplete") {
                                        delete b[d]
                                    }
                                }
                            }
                        }
                    } else {
                        h.push(TS.ui.msg_tab_complete.buildMemberHTML(f, g, l.sort_by_membership))
                    }
                }
            }
        }
        if (j) {
            TS.warn(JSON.stringify(a, null, "\t"))
        }
        h.push("</ul>");
        h = h.join("");
        if (l.w == "emoji") {
            h = TS.utility.emojiGraphicReplace(h)
        }
        return h
    },
    buildMemberHTML: function(g, f, c) {
        var j = g[f];
        var h;
        var m = false;
        if (j == "everyone" || j == "channel" || j == "group") {
            m = c && f > 0 && TS.members.getMemberByName(g[f - 1]);
            h = '<span class="broadcast">@' + j + "</span>";
            switch (j) {
                case "everyone":
                    h += ' <span class="broadcast_info">This will notify everyone on your team.</span>';
                    break;
                case "channel":
                    h += ' <span class="broadcast_info">This will notify everyone in this channel.</span>';
                    break;
                case "group":
                    h += ' <span class="broadcast_info">This will notify everyone in this group.</span>';
                    break;
                default:
                    break
            }
        } else {
            h = '<span class="username">' + j + "</span>";
            var d = TS.members.getMemberByName(j);
            if (!d) {
                h = "@" + h
            } else {
                var b = TS.shared.getActiveModelOb();
                var k = !b.is_im && (b.members.indexOf(d.id) > -1 || d.is_slackbot);
                if (c && f > 0 && !k && !b.is_im) {
                    var a = TS.members.getMemberByName(g[f - 1]);
                    if (!a || a.is_slackbot || b.members.indexOf(a.id) > -1) {
                        m = true
                    }
                }
                if (g.length < 100) {
                    h = TS.templates.builders.makeMemberImage(d.id, 24, true) + " " + h
                }
                h += TS.templates.makeMemberPresenceIcon(d);
                h += ' <span class="realname">' + TS.utility.htmlEntities(d.profile.real_name) + "</span>";
                if (!d.is_slackbot && !b.is_im) {
                    var l = "channel";
                    if (b.is_group) {
                        l = "group"
                    }
                    if (!k) {
                        h += ' <span class="not_in_channel">(not in ' + l + ")</span>"
                    }
                }
            }
        }
        h = '<li class="chat_input_tab_item" data-index="' + f + '">' + h + "</li>";
        if (m) {
            h = '<hr class="small_top_margin small_bottom_margin" />' + h
        }
        return h
    },
    buildChannelHTML: function(a) {
        var b = '<span class="channelname"><span class="hash">#</span>' + a + "</span>";
        return b
    },
    buildCmdHTML: function(h, c) {
        var b = TS.cmd_handlers[h];
        var g;
        if (b) {
            var a = "";
            if (b.aliases) {
                a = " (or " + b.aliases.join(", ") + ")"
            }
            var j = "";
            if (b.usage) {
                j = " " + b.usage;
                j = j.replace(/\</g, '<span class="argname argoptional"%%%% &lt;');
                j = j.replace(/\>/g, "&gt;</span>");
                j = j.replace(/\%\%\%\%/g, ">");
                j = j.replace(/\[/g, '<span class="argname"> [');
                j = j.replace(/\]/g, "]</span>")
            } else {
                if (b.args) {
                    var k;
                    for (var f = 0; f < b.args.length; f++) {
                        k = b.args[f];
                        if (k.optional) {
                            j += ' <span class="argname argoptional"> [' + k.name + "]</span>"
                        } else {
                            j += ' <span class="argname"> ' + k.name + "</span>"
                        }
                    }
                }
            }
            var l = "";
            var d = "";
            if (b.type == "client" && b.override) {
                d = " override"
            }
            if (b.type == "service" || b.type == "custom") {
                l = "[" + b.type + d + "]"
            }
            g = '<div class="cmd-left-td"><span class="cmdname">' + h + "</span>" + a + j + '</div><div class="cmd-right-td"><span class="cmddesc"><span class="cmdtype">' + l + "</span> " + TS.utility.htmlEntities(b.desc) + "</span></div>"
        } else {
            g = '<div class="cmd-left-td"><span class="cmdname">' + h + "</span></div>"
        } if (c) {}
        return g
    },
    buildEmojiHTML: function(a) {
        var c = true;
        var b = ":" + a + ": ";
        if (c) {
            b = ":" + a + ": &#58;" + a + "&#58"
        }
        return b
    },
    buildHeaderHTML: function(a) {
        var b = "";
        if (a.w == "members") {
            b = "People"
        } else {
            if (a.w == "cmds") {
                b = "Commands"
            } else {
                b = TS.utility.capitalize(a.w)
            }
        } if (a.matched_on && a.matched_on != "@" && a.matched_on != "#") {
            b += " matching <strong>" + TS.utility.htmlEntities(a.matched_on) + "</strong>"
        }
        return b
    },
    buildAndInsertHTML: function(a) {
        var b = TS.ui.msg_tab_complete.$scroller;
        $("#chat_input_tab_ui_header .header_label").html(TS.ui.msg_tab_complete.buildHeaderHTML(a));
        b.html(TS.ui.msg_tab_complete.buildItemsHTML(a));
        if (TS.ui.msg_tab_complete.lazyload && TS.ui.msg_tab_complete.lazyload.detachEvents) {
            TS.ui.msg_tab_complete.lazyload.detachEvents()
        }
        TS.ui.msg_tab_complete.lazyload = b.find("img.lazy").lazyload({
            container: $("#chat_input_tab_ui_scroller")
        })
    }
});
TS.registerModule("typing", {
    typing_self_lasts_ms: 3000,
    typing_lasts_ms: 6000,
    started_sig: new signals.Signal(),
    ended_sig: new signals.Signal(),
    map: {},
    onStart: function() {
        setInterval(TS.typing.checkMap, 1000)
    },
    userStarted: function(a) {
        if (!TS.model.socket_connected) {
            return
        }
        if (!a) {
            return
        }
        var c = TS.model.user;
        var b = a.id + "_" + c.id;
        if (TS.typing.map[b]) {
            return
        }
        TS.socket.sendTyping(a.id);
        TS.typing.memberStarted(a, TS.model.user)
    },
    memberStarted: function(a, d) {
        var c = a.id + "_" + d.id;
        var b = TS.utility.date.getTimeStamp();
        if (TS.typing.map[c]) {
            TS.typing.map[c].started = b;
            TS.log(47, "updated " + c)
        } else {
            TS.typing.map[c] = {
                started: b,
                model_ob: a,
                member: d
            };
            TS.log(47, "added " + c);
            TS.typing.started_sig.dispatch(a, d)
        }
    },
    userEnded: function(a) {
        if (!a) {
            return
        }
        var b = TS.model.user;
        TS.typing.memberEnded(a, b)
    },
    memberEnded: function(a, c) {
        var b = a.id + "_" + c.id;
        TS.typing.expungeMember(a, c);
        TS.log(47, "removed " + b)
    },
    expungeMember: function(a, c) {
        var b = a.id + "_" + c.id;
        delete TS.typing.map[b];
        TS.typing.ended_sig.dispatch(a, c)
    },
    checkMap: function() {
        var b = TS.utility.date.getTimeStamp();
        var a;
        for (var c in TS.typing.map) {
            a = TS.typing.map[c];
            var f = (a.member.is_self) ? TS.typing.typing_self_lasts_ms : TS.typing.typing_lasts_ms;
            var d = b - a.started;
            if (d >= f) {
                TS.typing.memberEnded(a.model_ob, a.member);
                TS.log(47, "removed " + c + " after " + d)
            }
        }
    },
    getTypersInChannel: function(d) {
        var a = [];
        var b;
        for (var c in TS.typing.map) {
            b = TS.typing.map[c];
            if (b.model_ob.id == d && !b.member.is_self) {
                a.push(b.member)
            }
        }
        a.sort(function(g, f) {
            if (TS.members.getMemberDisplayNameLowerCase(g) < TS.members.getMemberDisplayNameLowerCase(f)) {
                return -1
            }
            if (TS.members.getMemberDisplayNameLowerCase(g) > TS.members.getMemberDisplayNameLowerCase(f)) {
                return 1
            }
            return 0
        });
        return a
    }
});
TS.registerModule("ui.shortcuts_dialog", {
    div: null,
    showing: false,
    onStart: function() {},
    onKeydown: function(a) {
        if (!TS.ui.shortcuts_dialog.showing) {
            return
        }
        if (a.which == TS.utility.keymap.enter || a.which == TS.utility.keymap.esc) {
            TS.ui.shortcuts_dialog.cancel();
            a.preventDefault()
        }
    },
    start: function() {
        if (!TS.ui.shortcuts_dialog.div) {
            TS.ui.shortcuts_dialog.build()
        }
        var a = TS.templates.shortcuts_dialog(),
            b = TS.ui.shortcuts_dialog.div;
        b.html(a).modal("show").find(".dialog_cancel").click(TS.ui.shortcuts_dialog.cancel)
    },
    cancel: function() {
        TS.ui.shortcuts_dialog.div.modal("hide")
    },
    end: function() {
        TS.ui.shortcuts_dialog.showing = TS.model.dialog_is_showing = false;
        TS.ui.shortcuts_dialog.div.empty();
        $(window.document).unbind("keydown", TS.ui.shortcuts_dialog.onKeydown)
    },
    build: function() {
        $("body").append('<div id="shortcuts_dialog" class="modal hide fade"></div>');
        var a = TS.ui.shortcuts_dialog.div = $("#shortcuts_dialog");
        a.on("hidden", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.shortcuts_dialog.end()
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.shortcuts_dialog.showing = TS.model.dialog_is_showing = true
        });
        a.on("shown", function(b) {
            if (b.target != this) {
                return
            }
            $(window.document).bind("keydown", TS.ui.shortcuts_dialog.onKeydown)
        })
    }
});
TS.registerModule("ui.omnibox", {
    div: null,
    showing: false,
    results: [],
    matches: [],
    teams: [],
    input_el: "",
    results_el: "",
    selected_index: -1,
    onStart: function() {},
    onKeyDown: function(b) {
        if (!TS.ui.omnibox.showing) {
            return
        }
        if (b.which == TS.utility.keymap.enter) {
            var a = TS.ui.omnibox.results_el.find(".selected");
            if (a.length > 0) {
                if (a.data("team-url")) {
                    TS.ui.omnibox.selectTeamResult(a.data("team-url"), a.data("team-name"), a.data("team-id"))
                } else {
                    if (a.data("item-id")) {
                        TS.ui.omnibox.selectResult(a.data("item-id"))
                    } else {
                        TS.ui.omnibox.selectSignInLink(a.attr("href"))
                    }
                }
            }
            b.preventDefault()
        } else {
            if (b.which == TS.utility.keymap.esc || (!b.altKey && b.which == 75 && TS.utility.cmdKey(b))) {
                TS.ui.omnibox.cancel();
                b.preventDefault()
            } else {
                if (TS.model.is_our_app && !b.altKey && b.which == 84 && TS.utility.cmdKey(b)) {
                    TS.ui.omnibox.cancel();
                    b.preventDefault()
                } else {
                    if (b.which == TS.utility.keymap.up || b.which == TS.utility.keymap.down || b.which == TS.utility.keymap.tab) {
                        TS.ui.omnibox.results_el.find(".omnibox_item").removeClass("selected");
                        if (b.which == TS.utility.keymap.up) {
                            if (TS.ui.omnibox.selected_index == 0) {
                                TS.ui.omnibox.selected_index = TS.ui.omnibox.results_el.find(".omnibox_item").length - 1
                            } else {
                                TS.ui.omnibox.selected_index--
                            }
                        } else {
                            if (b.which == TS.utility.keymap.down || b.which == TS.utility.keymap.tab) {
                                if (TS.ui.omnibox.selected_index == (TS.ui.omnibox.results_el.find(".omnibox_item").length - 1)) {
                                    TS.ui.omnibox.selected_index = 0
                                } else {
                                    TS.ui.omnibox.selected_index++
                                }
                            }
                        }
                        var a = TS.ui.omnibox.results_el.find(".omnibox_item[data-index=" + TS.ui.omnibox.selected_index + "]");
                        a.addClass("selected").scrollintoview({
                            offset: "top",
                            px_offset: 0,
                            duration: 0
                        });
                        b.preventDefault()
                    }
                }
            }
        }
    },
    onKeyUp: function(a) {
        if (!TS.ui.omnibox.showing) {
            return
        }
        if (a.which == TS.utility.keymap.up || a.which == TS.utility.keymap.down || a.which == TS.utility.keymap.tab) {
            a.preventDefault()
        } else {
            if (a.which != TS.utility.keymap.enter && a.which != TS.utility.keymap.esc) {
                TS.ui.omnibox.showResults()
            }
        }
    },
    start: function() {
        if (!TS.ui.omnibox.div) {
            TS.ui.omnibox.build()
        }
        var h = TS.templates.omnibox();
        var k = TS.ui.omnibox.div;
        k.html(h);
        TS.ui.omnibox.input_el = TS.ui.omnibox.div.find("#omnibox_input");
        TS.ui.omnibox.results_el = TS.ui.omnibox.div.find("#omnibox_results");
        var a = TS.channels.getChannelsForUser();
        var g = [];
        var j = [];
        var c = [];
        var f = [];
        if (TS.boot_data.other_accounts && TS.ui.omnibox.teams.length == 0) {
            $.each(TS.boot_data.other_accounts, function(i, u) {
                TS.ui.omnibox.teams.push(u)
            })
        }
        for (var p = 0; p < a.length; p++) {
            channel = a[p];
            if (channel.is_archived) {
                continue
            }
            if (channel.is_member) {
                if (channel.unread_highlight_cnt && channel.unread_highlight_cnt > 0) {
                    g.push(channel)
                } else {
                    if (channel.unread_cnt && channel.unread_cnt > 0) {
                        j.push(channel)
                    } else {
                        c.push(channel)
                    }
                }
            } else {
                f.push(channel)
            }
        }
        var o = function(u, i) {
            return (u._name_lc > i._name_lc) ? 1 : ((i._name_lc > u._name_lc) ? -1 : 0)
        };
        g.sort(o);
        j.sort(o);
        c.sort(o);
        f.sort(o);
        var r = [];
        var t = [];
        TS.members.getActiveMembersWithSlackbotAndNotSelf().forEach(function(u) {
            var i = TS.ims.getImByMemberId(u.id);
            if (i && i.unread_cnt && i.unread_cnt > 0) {
                r.push(u)
            } else {
                t.push(u)
            }
        });
        r.sort(o);
        t.sort(o);
        var s = TS.model.groups;
        var m = [];
        var l = [];
        var b = [];
        for (var p = 0; p < s.length; p++) {
            group = s[p];
            if (group.is_archived) {
                continue
            }
            if (group.unread_highlight_cnt && group.unread_highlight_cnt > 0) {
                m.push(group)
            } else {
                if (group.unread_cnt && group.unread_cnt > 0) {
                    l.push(group)
                } else {
                    b.push(group)
                }
            }
        }
        m.sort(o);
        l.sort(o);
        b.sort(o);
        TS.ui.omnibox.all_results = g.concat(r, m, j, l, c, t, b, f);
        if (TS.boot_data.other_accounts) {
            TS.ui.omnibox.all_results = TS.ui.omnibox.all_results.concat(TS.ui.omnibox.teams)
        }
        var d = g.concat(j, c).sort(o);
        var n = r.concat(t).sort(o);
        var q = m.concat(l, b).sort(o);
        TS.ui.omnibox.results = d.concat(n, q, f);
        if (TS.boot_data.other_accounts) {
            TS.ui.omnibox.results = TS.ui.omnibox.results.concat(TS.ui.omnibox.teams)
        }
        TS.ui.omnibox.showResults();
        k.modal("show")
    },
    cancel: function() {
        TS.ui.omnibox.div.modal("hide")
    },
    end: function() {
        TS.ui.omnibox.showing = TS.model.dialog_is_showing = false;
        TS.ui.omnibox.file = null;
        TS.ui.omnibox.div.empty();
        TS.ui.omnibox.selected_index = 0;
        $(window.document).unbind("keyup", TS.ui.omnibox.onKeyUp);
        $(window.document).unbind("keydown", TS.ui.omnibox.onKeyDown)
    },
    build: function() {
        $("body").append('<div id="omnibox" class="modal hide" data-keyboard="false"></div>');
        var a = TS.ui.omnibox.div = $("#omnibox");
        a.on("hidden", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.omnibox.end()
        });
        a.on("show", function(b) {
            if (b.target != this) {
                return
            }
            TS.ui.omnibox.showing = TS.model.dialog_is_showing = true
        });
        a.on("shown", function(b) {
            $(window.document).bind("keyup", TS.ui.omnibox.onKeyUp);
            $(window.document).bind("keydown", TS.ui.omnibox.onKeyDown);
            TS.ui.omnibox.results_el.monkeyScroll();
            setTimeout(function() {
                TS.ui.omnibox.input_el.focus()
            }, 0)
        })
    },
    appendResultsHtml: function(a) {
        var c = false,
            b = false;
        $.each(a, function(d, f) {
            var g = false;
            if (d != 0 && !c && f.is_channel && !f.is_member) {
                g = true;
                c = true
            }
            if (!b && f.hasOwnProperty("team_name")) {
                if (d == 0) {
                    g = false
                } else {
                    g = true
                }
                b = true
            }
            TS.ui.omnibox.results_el.append(TS.ui.omnibox.buildItemHTML(f, d, g))
        })
    },
    buildItemHTML: function(h, c, g) {
        var f = "";
        var d = "";
        var b = false;
        var a = null;
        if (g) {
            f += "<hr />"
        }
        if (h.hasOwnProperty("team_name")) {
            f += '<div class="omnibox_item" data-index="' + c + '" data-team-url="' + h.team_url + '" data-team-name="' + TS.utility.htmlEntities(h.team_name) + '" data-team-id="' + h.id + '">';
            f += '<i class="fa fa-random prefix"></i> <span class="subtext no_left_margin">Switch to</span> ' + TS.utility.htmlEntities(h.team_name) + ' <span class="subtext no_left_margin">(signed in as ' + TS.utility.htmlEntities(h.name) + ")</span>"
        } else {
            if (h.is_group) {
                d += '<i class="fa fa-lock prefix"></i>' + TS.utility.htmlEntities(h.name);
                b = h.unread_cnt && h.unread_cnt > 0;
                if (h.unread_highlight_cnt && h.unread_highlight_cnt > 0) {
                    d += '<span class="unread_highlight_cnt">' + h.unread_highlight_cnt + "</span>"
                }
            } else {
                if (h.is_channel) {
                    d += '<span class="prefix">#</span>' + TS.utility.htmlEntities(h.name);
                    if (!h.is_member) {
                        d += ' <span class="subtext">(not a member)</span>'
                    }
                    b = h.unread_cnt && h.unread_cnt > 0;
                    if (h.unread_highlight_cnt && h.unread_highlight_cnt > 0) {
                        d += '<span class="unread_highlight_cnt">' + h.unread_highlight_cnt + "</span>"
                    }
                } else {
                    d += TS.templates.makeMemberPresenceIcon(h);
                    d += TS.utility.htmlEntities(h.name);
                    if (h.profile.real_name) {
                        d += '<span class="subtext">' + TS.utility.htmlEntities(h.profile.real_name) + "</span>"
                    }
                    a = TS.ims.getImByMemberId(h.id);
                    if (a && a.unread_cnt && a.unread_cnt > 0) {
                        b = true;
                        d += '<span class="unread_highlight_cnt">' + a.unread_cnt + "</span>"
                    }
                }
            } if (b) {
                f += '<div class="omnibox_item unread" data-index="' + c + '" data-item-id="' + h.id + '">'
            } else {
                f += '<div class="omnibox_item" data-index="' + c + '" data-item-id="' + h.id + '">'
            }
            f += d
        }
        f += "</div>";
        return f
    },
    showResults: function() {
        var n = $.trim(TS.ui.omnibox.input_el.val());
        var k = false;
        var l = false;
        var f = false;
        if (n.indexOf("#") == 0) {
            n = n.substr(1);
            k = true
        } else {
            if (n.indexOf("@") == 0) {
                n = n.substr(1);
                l = true
            } else {
                if (n.indexOf("switch ") == 0) {
                    n = n.substr(7);
                    f = true
                }
            }
        }
        var r = new RegExp("^" + TS.utility.regexpEscape(n), "i");
        var d = new RegExp("(-|_|\\s)" + TS.utility.regexpEscape(n), "i");
        var m = [];
        var o = [];
        if (n != "" || k || l || f) {
            function s(i) {
                var t = TS.ui.omnibox.results.filter(function(v) {
                    var u = false;
                    if (k) {
                        if (v.is_channel) {
                            u = v.name.match(i)
                        }
                    } else {
                        if (l) {
                            if (v.id.charAt(0) === "U" && !v.hasOwnProperty("team_name")) {
                                u = v.name.match(i) || (v.profile.real_name_normalized && (v.profile.real_name_normalized.match(i))) || (v.profile.real_name && (v.profile.real_name.match(i)))
                            }
                        } else {
                            if (f) {
                                if (v.hasOwnProperty("team_name")) {
                                    u = v.team_name.match(i)
                                }
                            } else {
                                if (v.hasOwnProperty("team_name")) {
                                    u = v.team_name.match(i)
                                } else {
                                    if (v.id.charAt(0) === "U") {
                                        u = v.name.match(i) || (v.profile.real_name_normalized && (v.profile.real_name_normalized.match(i))) || (v.profile.real_name && (v.profile.real_name.match(i)))
                                    } else {
                                        u = v.name.match(i)
                                    }
                                }
                            }
                        }
                    } if (u) {
                        $.each(m, function(x, w) {
                            if (v.id == w.id) {
                                u = false
                            }
                        })
                    }
                    return u
                });
                return t
            }
            m = s(r);
            o = s(d);
            TS.ui.omnibox.matches = m;
            if (o.length > 0) {
                TS.ui.omnibox.matches = TS.ui.omnibox.matches.concat(o)
            }
        } else {
            TS.ui.omnibox.matches.length = 0
        }
        TS.ui.omnibox.results_el.empty();
        TS.ui.omnibox.selected_index = -1;
        TS.ui.omnibox.div.find(".no_results").addClass("hidden");
        if (TS.ui.omnibox.matches.length > 0) {
            var q = [],
                j;
            for (var g = (TS.ui.omnibox.matches.length - 1); g > -1; g--) {
                j = TS.ui.omnibox.matches[g];
                if (j.hasOwnProperty("team_name") && j.team_name == n) {
                    q.push(TS.ui.omnibox.matches.splice(g, 1)[0])
                } else {
                    if (j.id.charAt(0) === "U" && !j.hasOwnProperty("team_name") && (j.name == n || (j.profile.real_name_normalized && j.profile.real_name_normalized == n) || (j.profile.real_name && j.profile.real_name == n))) {
                        q.push(TS.ui.omnibox.matches.splice(g, 1)[0])
                    } else {
                        if (j.name == n) {
                            q.push(TS.ui.omnibox.matches.splice(g, 1)[0])
                        }
                    }
                }
            }
            if (q.length > 0) {
                $.each(q, function(u, t) {
                    TS.ui.omnibox.matches.unshift(t)
                })
            }
            TS.ui.omnibox.appendResultsHtml(TS.ui.omnibox.matches);
            if (n != "") {
                TS.ui.omnibox.selected_index = 0;
                TS.ui.omnibox.results_el.find(".omnibox_item").first().addClass("selected")
            }
        } else {
            if (n == "") {
                TS.ui.omnibox.appendResultsHtml(TS.ui.omnibox.all_results);
                TS.ui.omnibox.results_el.find(".omnibox_item.unread:last").after("<hr>")
            } else {
                var p = n;
                if (k) {
                    p = "#" + p
                } else {
                    if (l) {
                        p = "@" + p
                    }
                }
                TS.ui.omnibox.div.find(".no_results").removeClass("hidden").find(".query").text(p)
            }
        }
        var h = new RegExp("^(s|sw|swi|swit|switc|switch)$", "i");
        if (TS.ui.omnibox.teams.length > 0 && n.match(h) && !f) {
            TS.ui.omnibox.results_el.empty();
            TS.ui.omnibox.selected_index = -1;
            TS.ui.omnibox.div.find(".no_results").addClass("hidden");
            var b = TS.ui.omnibox.teams.filter(function(i) {
                return !i.team_name.match(h)
            });
            TS.ui.omnibox.appendResultsHtml(TS.ui.omnibox.matches.concat(b));
            var a = TS.ui.omnibox.results_el.find(".omnibox_item").length;
            var c = '<a id="signin_item" data-index="' + a + '" class="omnibox_item" href="' + TS.boot_data.signin_url + '"><i class="fa fa-random prefix"></i> <span class="subtext no_left_margin">Sign in to another team...</span</a>';
            if (TS.ui.omnibox.div.find("#signin_item").length == 0) {
                TS.ui.omnibox.results_el.append(c)
            } else {
                TS.ui.omnibox.results_el.find("#signin_item").replaceWith(c)
            }
            TS.ui.omnibox.div.find(".no_results").addClass("hidden")
        }
        TS.ui.updateClosestMonkeyScroller($("#omnibox_results"));
        $(".omnibox_item").on("click", function(i) {
            if ($(this).data("team-url")) {
                TS.ui.omnibox.selectTeamResult($(this).data("team-url"), $(this).data("team-name"), $(this).data("team-id"))
            } else {
                if ($(this).data("item-id")) {
                    TS.ui.omnibox.selectResult($(this).data("item-id"))
                } else {
                    TS.ui.omnibox.selectSignInLink($(this).attr("href"));
                    i.preventDefault()
                }
            }
        });
        TS.ui.omnibox.results_el.hover(function() {
            TS.ui.omnibox.div.find(".selected").addClass("suspended")
        }, function() {
            TS.ui.omnibox.div.find(".selected.suspended").removeClass("suspended")
        })
    },
    selectResult: function(a) {
        if (a.charAt(0) === "G") {
            TS.groups.displayGroup(a)
        } else {
            if (a.charAt(0) === "C") {
                TS.channels.displayChannel(a)
            } else {
                TS.ims.startImByMemberId(a)
            }
        }
        TS.ui.omnibox.cancel()
    },
    selectTeamResult: function(a, b, c) {
        TS.ui.omnibox.div.find("#omnibox_ui").addClass("hidden");
        if (TSSSB.call("displayTeam", {
            id: c
        }, c)) {
            TS.ui.omnibox.cancel();
            return
        }
        window.location.href = a;
        TS.ui.omnibox.div.find("#omnibox_switching").removeClass("hidden").find("#switched_team_name").text(b)
    },
    selectSignInLink: function() {
        TS.ui.omnibox.cancel();
        TS.generic_dialog.start({
            title: "Sign in to another team?",
            body: "<p><strong>This window will reload and you'll be able to sign in to another team.</strong> You'll stay signed in to " + TS.utility.htmlEntities(TS.model.team.name) + " and can switch back at any time.</p>",
            go_button_text: "Sign in to another team",
            on_go: function() {
                window.location.href = signin_url
            }
        })
    }
});
(function() {
    TS.registerModule("ui.channel_options_dialog", {
        div: null,
        showing: false,
        c_id: null,
        onStart: function() {},
        onKeydown: function(b) {
            if (!TS.ui.channel_options_dialog.showing) {
                return
            }
            if (b.which == TS.utility.keymap.esc) {
                TS.ui.channel_options_dialog.cancel()
            }
        },
        start: function(l) {
            if (!TS.ui.channel_options_dialog.div) {
                TS.ui.channel_options_dialog.build()
            }
            if (TS.ui.channel_options_dialog.showing) {
                return
            }
            var b = TS.ui.channel_options_dialog.div;
            var c = TS.shared.getModelObById(l);
            if (!c || c.is_im) {
                alert(l + " ???");
                return
            }
            var g = "";
            var k = "";
            if (c.is_channel) {
                g = "channel";
                k = "#" + c.name
            } else {
                if (c.is_group) {
                    g = "group";
                    k = c.name
                }
            }
            TS.ui.channel_options_dialog.c_id = l;
            var m = false;
            if (g == "channel" && !c.is_general && TS.model.user.is_admin) {
                m = TS.members.canUserCreateGroups()
            }
            var f = false;
            if (!c.is_general) {
                f = (g == "channel" && TS.members.canUserArchiveChannels()) || (g == "group" && !TS.model.user.is_restricted)
            }
            var d = false;
            if (TS.model.user.is_admin || c.creator == TS.model.user.id) {
                d = true
            }
            var j = false;
            if (!TS.model.user.is_ultra_restricted && (!c.is_general || TS.members.canUserPostInGeneral())) {
                j = true
            }
            var h = TS.templates.channel_options_dialog({
                c_or_g: g,
                model_ob: c,
                display_name: k,
                show_convert_btn: m,
                show_archive_btn: f,
                show_rename_btn: d,
                show_purpose_btn: j
            });
            b.html(h);
            TS.ui.channel_options_dialog.div.find("#channel_rename_btn").bind("click", function() {
                TS.ui.channel_options_dialog.cancel();
                setTimeout(function() {
                    TS.ui.channel_create_dialog.start(c.name, c)
                }, 500)
            });
            TS.ui.channel_options_dialog.div.find("#channel_purpose_btn").bind("click", function() {
                TS.ui.channel_options_dialog.cancel();
                setTimeout(function() {
                    TS.ui.purpose_dialog.start(c.name, c)
                }, 500)
            });
            TS.ui.channel_options_dialog.div.find("#channel_archive_btn").bind("click", function() {
                TS.ui.channel_options_dialog.cancel();
                setTimeout(function() {
                    TS.generic_dialog.start({
                        title: "Archive #" + c.name,
                        body: "<p>Archiving a channel is useful to clean things up when you do not anticipate using the channel any more. If you archive this channel:</p> 					<ul> 						<li>No one will be able to send messages to it anymore</li> 						<li>It will be closed for anyone who has it open and all members will be removed</li> 						<li>You will be able to view past conversations in the Archives on the site</li> 						<li>You will be able to search for archived messages from this channel</li> 						<li>You will always be able to un-archive it later</li> 					</ul> 					<p>Are you sure you want to archive <b>#" + c.name + "</b>?</p>",
                        go_button_text: "Yes, archive the channel",
                        on_go: function() {
                            TS.api.call("channels.archive", {
                                channel: c.id
                            }, function(o, p, n) {
                                if (o) {
                                    return
                                }
                                var q = 'Archiving failed with error "' + p.error + '"';
                                if (p.error == "last_ra_channel") {
                                    if (TS.model.user.is_admin) {
                                        q = "Sorry, you can't archive this channel because it is the only group or channel one of the guest account members belongs to. If you first disable the guest account, you will then be able to archive the channel."
                                    } else {
                                        q = "Sorry, you can't archive this channel because it is the only group or channel one of the guest account members belongs to."
                                    }
                                } else {
                                    if (p.error == "restricted_action") {
                                        q = "<p>You don't have permission to archive channels.</p><p>Talk to your team owner.</p>"
                                    }
                                }
                                setTimeout(TS.generic_dialog.alert, 500, q)
                            })
                        }
                    })
                }, 500)
            });
            TS.ui.channel_options_dialog.div.find("#group_archive_btn").bind("click", function() {
                TS.ui.channel_options_dialog.cancel();
                setTimeout(function() {
                    TS.generic_dialog.start({
                        title: "Archive " + TS.model.group_prefix + c.name,
                        body: "<p>If you archive the group, you will no longer be able to send any messages in it. You will still be able to view the archives on the site.</p><p>Are you sure you want to archive <b>" + TS.model.group_prefix + c.name + "</b>?</p",
                        go_button_text: "Yes, archive the group",
                        on_go: function() {
                            TS.api.call("groups.archive", {
                                channel: c.id
                            }, function(o, p, n) {
                                if (o) {
                                    return
                                }
                                var q = 'Archiving failed with error "' + p.error + '"';
                                if (p.error == "last_ra_channel") {
                                    if (TS.model.user.is_admin) {
                                        q = "Sorry, you can't archive this group because it is the only group or channel one of the guest account members belongs to. If you first disable the guest account, you will then be able to archive the group."
                                    } else {
                                        q = "Sorry, you can't archive this group because it is the only group or channel one of the guest account members belongs to."
                                    }
                                }
                                TS.generic_dialog.alert(q)
                            })
                        }
                    })
                }, 500)
            });
            TS.ui.channel_options_dialog.div.find("#channel_convert_btn").bind("click", function() {
                TS.ui.channel_options_dialog.cancel();
                setTimeout(function() {
                    TS.generic_dialog.start({
                        title: "Convert #" + c.name + " to a private group?",
                        body: TS.templates.channel_conversion_dialog({
                            name: TS.utility.htmlEntities(c.name)
                        }),
                        go_button_text: "Yes, convert this channel",
                        on_go: function() {
                            TS.api.call("channels.convertToGroup", {
                                channel: c.id
                            }, function(o, p, n) {
                                if (o) {
                                    return
                                }
                                var q = 'converting to group failed with error "' + p.error + '"';
                                if (p.error == "restricted_action") {
                                    q = "<p>You don't have permission to create groups.</p><p>Talk to your team owner.</p>"
                                }
                                setTimeout(TS.generic_dialog.alert, 500, q)
                            })
                        }
                    })
                }, 500)
            });
            TS.ui.channel_options_dialog.div.find("#data_retention_btn").bind("click", function() {
                TS.ui.channel_options_dialog.cancel();
                setTimeout(function() {
                    TS.channels.ui.showDataRetentionDialog(l)
                }, 500)
            });
            b.modal("show");
            b.find(".dialog_cancel").click(TS.ui.channel_options_dialog.cancel);
            b.find(".dialog_go").click(TS.ui.channel_options_dialog.go);
            var i = false;
            if (TS.model.user.is_owner || g == "group") {
                i = true
            }
            if (i) {
                TS.api.call("team.paymentStatus", {}, function(n, o) {
                    if (n && o.has_paid) {
                        b.find(".retention_policy_container").removeClass("hidden")
                    }
                    a()
                })
            } else {
                a()
            }
        },
        go: function() {
            if (!TS.ui.channel_options_dialog.showing) {
                TS.error("not showing?");
                return
            }
            var b = TS.ui.channel_options_dialog.div;
            b.modal("hide")
        },
        cancel: function() {
            TS.ui.channel_options_dialog.div.modal("hide")
        },
        end: function() {
            TS.ui.channel_options_dialog.c_id = null;
            TS.ui.channel_options_dialog.showing = TS.model.dialog_is_showing = false;
            $(window.document).unbind("keydown", TS.ui.channel_options_dialog.onKeydown)
        },
        build: function() {
            $("body").append('<div id="channel_options_dialog" class="modal hide fade"></div>');
            var b = TS.ui.channel_options_dialog.div = $("#channel_options_dialog");
            b.on("hide", function(c) {
                if (c.target != this) {
                    return
                }
                TS.ui.channel_options_dialog.end()
            });
            b.on("show", function(c) {
                if (c.target != this) {
                    return
                }
                TS.ui.channel_options_dialog.showing = TS.model.dialog_is_showing = true
            });
            b.on("shown", function(c) {
                if (c.target != this) {
                    return
                }
                setTimeout(function() {
                    $(window.document).bind("keydown", TS.ui.channel_options_dialog.onKeydown)
                }, 100)
            })
        }
    });
    var a = function() {
        var b = TS.ui.channel_options_dialog.div;
        b.find(".loading_animation_container").remove();
        b.find(".modal-body.hidden").removeClass("hidden")
    }
})();
TS.registerModule("ui.sidebar_themes", {
    default_themes: {
        default_theme: {
            column_bg: "#4D394B",
            menu_bg: "#3E313C",
            active_item: "#4C9689",
            active_item_text: "#FFFFFF",
            hover_item: "#3E313C",
            text_color: "#FFFFFF",
            active_presence: "#38978D",
            badge: "#EB4D5C"
        },
        hoth_theme: {
            column_bg: "#F8F8FA",
            menu_bg: "#F8F8FA",
            active_item: "#CAD1D9",
            active_item_text: "#FFFFFF",
            hover_item: "#FFFFFF",
            text_color: "#383F45",
            active_presence: "#60D156",
            badge: "#FF8669"
        },
        cotton_theme: {
            column_bg: "#BB6A76",
            menu_bg: "#AD5B67",
            active_item: "#62B791",
            active_item_text: "#FFFFFF",
            hover_item: "#A5516A",
            text_color: "#FFFFFF",
            active_presence: "#68F798",
            badge: "#694464"
        },
        eco_theme: {
            column_bg: "#86A34E",
            menu_bg: "#94AF63",
            active_item: "#FFFFFF",
            active_item_text: "#6D8B42",
            hover_item: "#94AF63",
            text_color: "#FFFFFF",
            active_presence: "#FFB10A",
            badge: "#DFA044"
        },
        ocean_theme: {
            column_bg: "#303E4D",
            menu_bg: "#2C3849",
            active_item: "#6698C8",
            active_item_text: "#FFFFFF",
            hover_item: "#4A5664",
            text_color: "#FFFFFF",
            active_presence: "#94E864",
            badge: "#78AF8F"
        },
        workhard_theme: {
            column_bg: "#4D5250",
            menu_bg: "#444A47",
            active_item: "#D39B46",
            active_item_text: "#FFFFFF",
            hover_item: "#434745",
            text_color: "#FFFFFF",
            active_presence: "#99D04A",
            badge: "#DB6668"
        }
    },
    onStart: function() {
        if (TS.client) {
            TS.client.login_sig.add(TS.ui.sidebar_themes.onLogin, TS.ui.sidebar_themes)
        }
    },
    onLogin: function(a, b) {
        if (TS.model.prefs.sidebar_theme) {
            TS.prefs.sidebar_theme_changed_sig.dispatch()
        }
    }
});
(function(f) {
    var i = function() {
        var L = '<div class="colpick"><div class="colpick_color"><div class="colpick_color_overlay1"><div class="colpick_color_overlay2"><div class="colpick_selector_outer"><div class="colpick_selector_inner"></div></div></div></div></div><div class="colpick_hue"><div class="colpick_hue_arrs"><div class="colpick_hue_larr"></div><div class="colpick_hue_rarr"></div></div></div><div class="colpick_new_color"></div><div class="colpick_current_color"></div><div class="colpick_hex_field"><div class="colpick_field_letter">#</div><input type="text" maxlength="6" size="6" /></div><div class="colpick_rgb_r colpick_field"><div class="colpick_field_letter">R</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_rgb_g colpick_field"><div class="colpick_field_letter">G</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_rgb_b colpick_field"><div class="colpick_field_letter">B</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_hsb_h colpick_field"><div class="colpick_field_letter">H</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_hsb_s colpick_field"><div class="colpick_field_letter">S</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_hsb_b colpick_field"><div class="colpick_field_letter">B</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_submit"></div></div>',
            q = {
                showEvent: "click",
                onShow: function() {},
                onBeforeShow: function() {},
                onHide: function() {},
                onChange: function() {},
                onSubmit: function() {},
                colorScheme: "light",
                color: "3289c7",
                livePreview: true,
                flat: false,
                layout: "full",
                submit: 1,
                submitText: "OK",
                height: 156
            },
            D = function(M, O) {
                var N = g(M);
                f(O).data("colpick").fields.eq(1).val(N.r).end().eq(2).val(N.g).end().eq(3).val(N.b).end()
            },
            p = function(M, N) {
                f(N).data("colpick").fields.eq(4).val(Math.round(M.h)).end().eq(5).val(Math.round(M.s)).end().eq(6).val(Math.round(M.b)).end()
            },
            s = function(M, N) {
                f(N).data("colpick").fields.eq(0).val(a(M))
            },
            H = function(M, N) {
                f(N).data("colpick").selector.css("backgroundColor", "#" + a({
                    h: M.h,
                    s: 100,
                    b: 100
                }));
                f(N).data("colpick").selectorIndic.css({
                    left: parseInt(f(N).data("colpick").height * M.s / 100, 10),
                    top: parseInt(f(N).data("colpick").height * (100 - M.b) / 100, 10)
                })
            },
            m = function(M, N) {
                f(N).data("colpick").hue.css("top", parseInt(f(N).data("colpick").height - f(N).data("colpick").height * M.h / 360, 10))
            },
            l = function(M, N) {
                f(N).data("colpick").currentColor.css("backgroundColor", "#" + a(M))
            },
            w = function(M, N) {
                f(N).data("colpick").newColor.css("backgroundColor", "#" + a(M))
            },
            u = function(N) {
                var O = f(this).parent().parent(),
                    M;
                if (this.parentNode.className.indexOf("_hex") > 0) {
                    O.data("colpick").color = M = h(A(this.value));
                    D(M, O.get(0));
                    p(M, O.get(0))
                } else {
                    if (this.parentNode.className.indexOf("_hsb") > 0) {
                        O.data("colpick").color = M = B({
                            h: parseInt(O.data("colpick").fields.eq(4).val(), 10),
                            s: parseInt(O.data("colpick").fields.eq(5).val(), 10),
                            b: parseInt(O.data("colpick").fields.eq(6).val(), 10)
                        });
                        D(M, O.get(0));
                        s(M, O.get(0))
                    } else {
                        O.data("colpick").color = M = b(n({
                            r: parseInt(O.data("colpick").fields.eq(1).val(), 10),
                            g: parseInt(O.data("colpick").fields.eq(2).val(), 10),
                            b: parseInt(O.data("colpick").fields.eq(3).val(), 10)
                        }));
                        s(M, O.get(0));
                        p(M, O.get(0))
                    }
                }
                H(M, O.get(0));
                m(M, O.get(0));
                w(M, O.get(0));
                O.data("colpick").onChange.apply(O.parent(), [M, a(M), g(M), O.data("colpick").el, 0])
            },
            z = function(M) {
                f(this).parent().removeClass("colpick_focus")
            },
            v = function() {
                f(this).parent().parent().data("colpick").fields.parent().removeClass("colpick_focus");
                f(this).parent().addClass("colpick_focus")
            },
            k = function(M) {
                M.preventDefault ? M.preventDefault() : M.returnValue = false;
                var O = f(this).parent().find("input").focus();
                var N = {
                    el: f(this).parent().addClass("colpick_slider"),
                    max: this.parentNode.className.indexOf("_hsb_h") > 0 ? 360 : (this.parentNode.className.indexOf("_hsb") > 0 ? 100 : 255),
                    y: M.pageY,
                    field: O,
                    val: parseInt(O.val(), 10),
                    preview: f(this).parent().parent().data("colpick").livePreview
                };
                f(document).mouseup(N, y);
                f(document).mousemove(N, E)
            },
            E = function(M) {
                M.data.field.val(Math.max(0, Math.min(M.data.max, parseInt(M.data.val - M.pageY + M.data.y, 10))));
                if (M.data.preview) {
                    u.apply(M.data.field.get(0), [true])
                }
                return false
            },
            y = function(M) {
                u.apply(M.data.field.get(0), [true]);
                M.data.el.removeClass("colpick_slider").find("input").focus();
                f(document).off("mouseup", y);
                f(document).off("mousemove", E);
                return false
            },
            K = function(N) {
                N.preventDefault ? N.preventDefault() : N.returnValue = false;
                var O = {
                    cal: f(this).parent(),
                    y: f(this).offset().top
                };
                f(document).on("mouseup touchend", O, o);
                f(document).on("mousemove touchmove", O, r);
                var M = ((N.type == "touchstart") ? N.originalEvent.changedTouches[0].pageY : N.pageY);
                u.apply(O.cal.data("colpick").fields.eq(4).val(parseInt(360 * (O.cal.data("colpick").height - (M - O.y)) / O.cal.data("colpick").height, 10)).get(0), [O.cal.data("colpick").livePreview]);
                return false
            },
            r = function(N) {
                var M = ((N.type == "touchmove") ? N.originalEvent.changedTouches[0].pageY : N.pageY);
                u.apply(N.data.cal.data("colpick").fields.eq(4).val(parseInt(360 * (N.data.cal.data("colpick").height - Math.max(0, Math.min(N.data.cal.data("colpick").height, (M - N.data.y)))) / N.data.cal.data("colpick").height, 10)).get(0), [N.data.preview]);
                return false
            },
            o = function(M) {
                D(M.data.cal.data("colpick").color, M.data.cal.get(0));
                s(M.data.cal.data("colpick").color, M.data.cal.get(0));
                f(document).off("mouseup touchend", o);
                f(document).off("mousemove touchmove", r);
                return false
            },
            F = function(N) {
                N.preventDefault ? N.preventDefault() : N.returnValue = false;
                var O = {
                    cal: f(this).parent(),
                    pos: f(this).offset()
                };
                O.preview = O.cal.data("colpick").livePreview;
                f(document).on("mouseup touchend", O, J);
                f(document).on("mousemove touchmove", O, j);
                var P, M;
                if (N.type == "touchstart") {
                    pageX = N.originalEvent.changedTouches[0].pageX, M = N.originalEvent.changedTouches[0].pageY
                } else {
                    pageX = N.pageX;
                    M = N.pageY
                }
                u.apply(O.cal.data("colpick").fields.eq(6).val(parseInt(100 * (O.cal.data("colpick").height - (M - O.pos.top)) / O.cal.data("colpick").height, 10)).end().eq(5).val(parseInt(100 * (pageX - O.pos.left) / O.cal.data("colpick").height, 10)).get(0), [O.preview]);
                return false
            },
            j = function(N) {
                var O, M;
                if (N.type == "touchmove") {
                    pageX = N.originalEvent.changedTouches[0].pageX, M = N.originalEvent.changedTouches[0].pageY
                } else {
                    pageX = N.pageX;
                    M = N.pageY
                }
                u.apply(N.data.cal.data("colpick").fields.eq(6).val(parseInt(100 * (N.data.cal.data("colpick").height - Math.max(0, Math.min(N.data.cal.data("colpick").height, (M - N.data.pos.top)))) / N.data.cal.data("colpick").height, 10)).end().eq(5).val(parseInt(100 * (Math.max(0, Math.min(N.data.cal.data("colpick").height, (pageX - N.data.pos.left)))) / N.data.cal.data("colpick").height, 10)).get(0), [N.data.preview]);
                return false
            },
            J = function(M) {
                D(M.data.cal.data("colpick").color, M.data.cal.get(0));
                s(M.data.cal.data("colpick").color, M.data.cal.get(0));
                f(document).off("mouseup touchend", J);
                f(document).off("mousemove touchmove", j);
                return false
            },
            x = function(N) {
                var O = f(this).parent();
                var M = O.data("colpick").color;
                O.data("colpick").origColor = M;
                l(M, O.get(0));
                O.data("colpick").onSubmit(M, a(M), g(M), O.data("colpick").el)
            },
            I = function(N) {
                if (N) {
                    N.stopPropagation()
                }
                var R = f("#" + f(this).data("colpickId"));
                R.data("colpick").onBeforeShow.apply(this, [R.get(0)]);
                var S = f(this).offset();
                var Q = S.top + this.offsetHeight;
                var P = S.left;
                var O = C();
                var M = R.width();
                if (P + M > O.l + O.w) {
                    P -= M
                }
                R.css({
                    left: P + "px",
                    top: Q + "px"
                });
                if (R.data("colpick").onShow.apply(this, [R.get(0)]) != false) {
                    R.show()
                }
                f("html").mousedown({
                    cal: R
                }, t);
                R.mousedown(function(T) {
                    T.stopPropagation()
                })
            },
            t = function(M) {
                if (M.data.cal.data("colpick").onHide.apply(this, [M.data.cal.get(0)]) != false) {
                    M.data.cal.hide()
                }
                f("html").off("mousedown", t)
            },
            C = function() {
                var M = document.compatMode == "CSS1Compat";
                return {
                    l: window.pageXOffset || (M ? document.documentElement.scrollLeft : document.body.scrollLeft),
                    w: window.innerWidth || (M ? document.documentElement.clientWidth : document.body.clientWidth)
                }
            },
            B = function(M) {
                return {
                    h: Math.min(360, Math.max(0, M.h)),
                    s: Math.min(100, Math.max(0, M.s)),
                    b: Math.min(100, Math.max(0, M.b))
                }
            },
            n = function(M) {
                return {
                    r: Math.min(255, Math.max(0, M.r)),
                    g: Math.min(255, Math.max(0, M.g)),
                    b: Math.min(255, Math.max(0, M.b))
                }
            },
            A = function(O) {
                var M = 6 - O.length;
                if (M > 0) {
                    var P = [];
                    for (var N = 0; N < M; N++) {
                        P.push("0")
                    }
                    P.push(O);
                    O = P.join("")
                }
                return O
            },
            G = function() {
                var N = f(this).parent();
                var M = N.data("colpick").origColor;
                N.data("colpick").color = M;
                D(M, N.get(0));
                s(M, N.get(0));
                p(M, N.get(0));
                H(M, N.get(0));
                m(M, N.get(0));
                w(M, N.get(0))
            };
        return {
            init: function(M) {
                M = f.extend({}, q, M || {});
                if (typeof M.color == "string") {
                    M.color = h(M.color)
                } else {
                    if (M.color.r != undefined && M.color.g != undefined && M.color.b != undefined) {
                        M.color = b(M.color)
                    } else {
                        if (M.color.h != undefined && M.color.s != undefined && M.color.b != undefined) {
                            M.color = B(M.color)
                        } else {
                            return this
                        }
                    }
                }
                return this.each(function() {
                    if (!f(this).data("colpickId")) {
                        var W = f.extend({}, M);
                        W.origColor = M.color;
                        var P = "collorpicker_" + parseInt(Math.random() * 1000);
                        f(this).data("colpickId", P);
                        var O = f(L).attr("id", P);
                        O.addClass("colpick_" + W.layout + (W.submit ? "" : " colpick_" + W.layout + "_ns"));
                        if (W.colorScheme != "light") {
                            O.addClass("colpick_" + W.colorScheme)
                        }
                        O.find("div.colpick_submit").html(W.submitText).click(x);
                        W.fields = O.find("input").change(u).blur(z).focus(v);
                        O.find("div.colpick_field_arrs").mousedown(k).end().find("div.colpick_current_color").click(G);
                        W.selector = O.find("div.colpick_color").on("mousedown touchstart", F);
                        W.selectorIndic = W.selector.find("div.colpick_selector_outer");
                        W.el = this;
                        W.hue = O.find("div.colpick_hue_arrs");
                        huebar = W.hue.parent();
                        var U = navigator.userAgent.toLowerCase();
                        var Q = navigator.appName === "Microsoft Internet Explorer";
                        var R = Q ? parseFloat(U.match(/msie ([0-9]{1,}[\.0-9]{0,})/)[1]) : 0;
                        var S = (Q && R < 10);
                        var V = ["#ff0000", "#ff0080", "#ff00ff", "#8000ff", "#0000ff", "#0080ff", "#00ffff", "#00ff80", "#00ff00", "#80ff00", "#ffff00", "#ff8000", "#ff0000"];
                        if (S) {
                            var T, N;
                            for (T = 0; T <= 11; T++) {
                                N = f("<div></div>").attr("style", "height:8.333333%; filter:progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr=" + V[T] + ", endColorstr=" + V[T + 1] + '); -ms-filter: "progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr=' + V[T] + ", endColorstr=" + V[T + 1] + ')";');
                                huebar.append(N)
                            }
                        } else {
                            stopList = V.join(",");
                            huebar.attr("style", "background:-webkit-linear-gradient(top," + stopList + "); background: -o-linear-gradient(top," + stopList + "); background: -ms-linear-gradient(top," + stopList + "); background:-moz-linear-gradient(top," + stopList + "); -webkit-linear-gradient(top," + stopList + "); background:linear-gradient(to bottom," + stopList + "); ")
                        }
                        O.find("div.colpick_hue").on("mousedown touchstart", K);
                        W.newColor = O.find("div.colpick_new_color");
                        W.currentColor = O.find("div.colpick_current_color");
                        O.data("colpick", W);
                        D(W.color, O.get(0));
                        p(W.color, O.get(0));
                        s(W.color, O.get(0));
                        m(W.color, O.get(0));
                        H(W.color, O.get(0));
                        l(W.color, O.get(0));
                        w(W.color, O.get(0));
                        if (W.flat) {
                            O.appendTo(this).show();
                            O.css({
                                position: "relative",
                                display: "block"
                            })
                        } else {
                            O.appendTo(document.body);
                            f(this).on(W.showEvent, I);
                            O.css({
                                position: "absolute"
                            })
                        }
                    }
                })
            },
            showPicker: function() {
                return this.each(function() {
                    if (f(this).data("colpickId")) {
                        I.apply(this)
                    }
                })
            },
            hidePicker: function() {
                return this.each(function() {
                    if (f(this).data("colpickId")) {
                        f("#" + f(this).data("colpickId")).hide()
                    }
                })
            },
            setColor: function(M, N) {
                N = (typeof N === "undefined") ? 1 : N;
                if (typeof M == "string") {
                    M = h(M)
                } else {
                    if (M.r != undefined && M.g != undefined && M.b != undefined) {
                        M = b(M)
                    } else {
                        if (M.h != undefined && M.s != undefined && M.b != undefined) {
                            M = B(M)
                        } else {
                            return this
                        }
                    }
                }
                return this.each(function() {
                    if (f(this).data("colpickId")) {
                        var O = f("#" + f(this).data("colpickId"));
                        O.data("colpick").color = M;
                        O.data("colpick").origColor = M;
                        D(M, O.get(0));
                        p(M, O.get(0));
                        s(M, O.get(0));
                        m(M, O.get(0));
                        H(M, O.get(0));
                        w(M, O.get(0));
                        O.data("colpick").onChange.apply(O.parent(), [M, a(M), g(M), O.data("colpick").el, 1]);
                        if (N) {
                            l(M, O.get(0))
                        }
                    }
                })
            }
        }
    }();
    var c = function(j) {
        var j = parseInt(((j.indexOf("#") > -1) ? j.substring(1) : j), 16);
        return {
            r: j >> 16,
            g: (j & 65280) >> 8,
            b: (j & 255)
        }
    };
    var h = function(j) {
        return b(c(j))
    };
    var b = function(l) {
        var k = {
            h: 0,
            s: 0,
            b: 0
        };
        var m = Math.min(l.r, l.g, l.b);
        var j = Math.max(l.r, l.g, l.b);
        var n = j - m;
        k.b = j;
        k.s = j != 0 ? 255 * n / j : 0;
        if (k.s != 0) {
            if (l.r == j) {
                k.h = (l.g - l.b) / n
            } else {
                if (l.g == j) {
                    k.h = 2 + (l.b - l.r) / n
                } else {
                    k.h = 4 + (l.r - l.g) / n
                }
            }
        } else {
            k.h = -1
        }
        k.h *= 60;
        if (k.h < 0) {
            k.h += 360
        }
        k.s *= 100 / 255;
        k.b *= 100 / 255;
        return k
    };
    var g = function(j) {
        var l = {};
        var p = j.h;
        var o = j.s * 255 / 100;
        var k = j.b * 255 / 100;
        if (o == 0) {
            l.r = l.g = l.b = k
        } else {
            var q = k;
            var n = (255 - o) * k / 255;
            var m = (q - n) * (p % 60) / 60;
            if (p == 360) {
                p = 0
            }
            if (p < 60) {
                l.r = q;
                l.b = n;
                l.g = n + m
            } else {
                if (p < 120) {
                    l.g = q;
                    l.b = n;
                    l.r = q - m
                } else {
                    if (p < 180) {
                        l.g = q;
                        l.r = n;
                        l.b = n + m
                    } else {
                        if (p < 240) {
                            l.b = q;
                            l.r = n;
                            l.g = q - m
                        } else {
                            if (p < 300) {
                                l.b = q;
                                l.g = n;
                                l.r = n + m
                            } else {
                                if (p < 360) {
                                    l.r = q;
                                    l.g = n;
                                    l.b = q - m
                                } else {
                                    l.r = 0;
                                    l.g = 0;
                                    l.b = 0
                                }
                            }
                        }
                    }
                }
            }
        }
        return {
            r: Math.round(l.r),
            g: Math.round(l.g),
            b: Math.round(l.b)
        }
    };
    var d = function(j) {
        var k = [j.r.toString(16), j.g.toString(16), j.b.toString(16)];
        f.each(k, function(l, m) {
            if (m.length == 1) {
                k[l] = "0" + m
            }
        });
        return k.join("")
    };
    var a = function(j) {
        return d(g(j))
    };
    f.fn.extend({
        colpick: i.init,
        colpickHide: i.hidePicker,
        colpickShow: i.showPicker,
        colpickSetColor: i.setColor
    });
    f.extend({
        colpick: {
            rgbToHex: d,
            rgbToHsb: b,
            hsbToHex: a,
            hsbToRgb: g,
            hexToHsb: h,
            hexToRgb: c
        }
    })
})(jQuery);