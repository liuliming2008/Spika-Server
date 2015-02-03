CM.client = {
	core_url: null,	
	onStart: function(){
		//CM.client.core_url = document.location.href.split("/messages")[0] + "/messages";
		
	},
    cleanFlexExtra: function(a) {
        if (a && a.indexOf("#") != -1) {
            a = a.replace(/\#/g, "%23")
        }
        return a
    },
    channelDisplaySwitched: function(channel_id, im_id, group_id, f, b) {
        if ((channel_id && (im_id || group_id)) || (im_id && (channel_id || group_id))) {
            CM.error("more than one? channel_id:" + channel_id + " im_id:" + im_id + " group_id:" + group_id);
            return false
        }
        if (!channel_id && !im_id && !group_id) {
            CM.error("none? channel_id:" + channel_id + " im_id:" + im_id + " group_id:" + group_id);
            return false
        }
        var channel;
        var im;
        var group;
        var name;
        if (channel_id) {
            channel = CM.channels.getChannelById(channel_id);
            name = channel.name
        }
        if (im_id) {
            im = CM.ims.getImById(im_id);
            name = "@" + im.name
        }
        if (group_id) {
            group = CM.groups.getGroupById(group_id);
            name = group.name
        }
        var channel_group_im = channel || group || im;
        /*if (!b) {
            var q = CM.client.cleanFlexExtra(CM.model.flex_extra_in_url);
            var h = CM.utility.refashionUrl(window.location.href, name, CM.model.flex_name_in_url, q);
            CM.client.putURLInHistory(h, !CM.model.c_name_in_url || f)
        }*/
        CM.model.c_name_in_url = name;
        if (channel_id && channel_id == CM.model.active_channel_id) {
            CM.warn("not switching, it is the active channel already");
            return false
        }
        if (im_id && im_id == CM.model.active_im_id) {
            CM.warn("not switching, it is the active im already");
            return false
        }
        if (group_id && group_id == CM.model.active_group_id) {
            CM.warn("not switching, it is the active group already");
            return false
        }
        //CM.utility.msgs.checkForMsgsToTruncate();
        //CM.ui.markAllRead(CM.model.last_active_cid);
        
        CM.model.last_active_cid = CM.model.active_channel_id || CM.model.active_im_id || CM.model.active_group_id;
        CM.model.active_channel_id = channel_id;
        CM.model.active_im_id = im_id;
        CM.model.active_group_id = group_id;
        CM.model.active_cid = CM.model.active_channel_id || CM.model.active_im_id || CM.model.active_group_id;
        CM.view.updateTitleWithContext();
        channel_group_im.last_made_active = CM.utility.date.getTimeStamp();
        var ob_id = channel_id || im_id || group_id;
        CM.log(4, ob_id + " is now active");
        CM.ui.markAllRead(CM.model.last_active_cid);
        
        /*var j = CM.model.active_history;
        var g = j.indexOf(ob_id);
        if (g != -1) {
            j.splice(g, 1)
        }
        j.push(ob_id);
        CM.log(4, j);
        CM.storage.storeActiveHistory(j);*/
        return true
    },
    markLastReadsWithAPI: function(id) {
    	if (CM.model){
    		var obj = CM.getChannelImGroupById(id);
        	
        	if(obj){// && d.needs_api_marking){
        		obj.needs_api_marking = false;
        		var obj = CM.getChannelImGroupById(id);
            	var ts = CM.utility.msgs.getMostRecentValidTs(obj.msgs);
            	
        		CM.api.call("channels.setlastread", {
                    id: obj.id,
                    ts: ts
                }, function(status,data,params) {
                	var ob = CM.getChannelImGroupById(params['id']);
                	ob.last_read = data.channel['last_read'];
                	ob.unread_cnt = 0;
                });
    		
        	}
    	}
 
    },
};
(function(a) {
    a.fn.setCursorPosition = function(b) {
        this.each(function(d, e) {
            if (e.setSelectionRange) {
                e.setSelectionRange(b, b)
            } else {
                if (e.createTextRange) {
                    var c = e.createTextRange();
                    c.collapse(true);
                    c.moveEnd("character", b);
                    c.moveStart("character", b);
                    c.select()
                }
            }
        });
        return this
    };
    a.fn.getCursorPosition = function() {
        var c = this.get(0);
        if (!c) {
            return
        }
        if ("selectionStart" in c) {
            return c.selectionStart
        } else {
            if (document.selection) {
                c.focus();
                var d = document.selection.createRange();
                var b = document.selection.createRange().text.length;
                d.moveStart("character", -c.value.length);
                return d.text.length - b
            }
        }
    };
    a.fn.getCursorRange = function() {
        var b = this.get(0);
        if (!b) {
            return
        }
        if ("selectionStart" in b) {
            return {
                s: b.selectionStart,
                l: b.selectionEnd - b.selectionStart
            }
        } else {
            if (document.selection) {}
        }
    };
    jQuery.fn.highlight = function(e, c, d, b) {
        b = (b == undefined) ? 2000 : b;
        a(this).each(function() {
            var f = a(this);
            var g = false;
            if (f.data("highlighted")) {
                return
            }
            f.data("highlighted", true);
            if (f.css("position") == "static") {
                f.css("position", "relative");
                g = true
            }
            a('<div class="' + c + '" />').width(f.outerWidth()).height(f.outerHeight()).css({
                position: "absolute",
                left: 0,
                top: 0,
                "background-color": "#FFF3B8",
                opacity: ".6",
                "z-index": "9999999",
                "pointer-events": "none"
            }).appendTo(f).delay(b).fadeOut(e).queue(function() {
                a(this).remove();
                f.data("highlighted", false);
                if (g) {
                    f.css("position", "static")
                }
                if (d) {
                    d()
                }
            })
        })
    }, jQuery.fn.highlightText = function(e, c, d, b) {
        b = (b == undefined) ? 2000 : b;
        a(this).each(function() {
            var f = a(this);
            var g = a(this).css("background-color");
            if (f.data("highlighted")) {
                return
            }
            f.data("highlighted", true);
            f.css({
                "background-color": "#FFF3B8",
                transition: "background-color 0.25s"
            }).delay(b).queue(function() {
                f.css({
                    "background-color": g
                });
                f.data("highlighted", false);
                if (d) {
                    d()
                }
            })
        })
    }, jQuery.fn.hideWithRememberedScrollTop = function() {
        a(this).each(function() {
            var b = a(this);
            if (b.hasClass("hidden")) {
                return
            }
            b.data("remembered_scrolltop", b.scrollTop());
            var c = b.find(":scrollable()");
            c.each(function(d, e) {
                a(e).data("remembered_scrolltop", a(e).scrollTop())
            });
            b.data("remembered_scrollers", c);
            b.addClass("hidden")
        })
    };
    jQuery.fn.unhideWithRememberedScrollTop = function() {
        a(this).each(function() {
            var c = a(this);
            if (!c.hasClass("hidden")) {
                return
            }
            c.removeClass("hidden");
            var b = c.data("remembered_scrolltop");
            if (b != undefined) {
                c.scrollTop(b)
            }
            var d = c.data("remembered_scrollers");
            if (d) {
                d.each(function(e, f) {
                    b = a(f).data("remembered_scrolltop");
                    if (b != undefined) {
                        a(f).scrollTop(b)
                    }
                })
            }
        })
    }
})(jQuery);
/*!
 * jQuery TextChange Plugin
 * http://www.zurb.com/playground/jquery-text-change-custom-event
 *
 * Copyright 2010, ZURB
 * Released under the MIT License
 */
(function(a) {
    a.event.special.textchange = {
        setup: function(c, b) {
            a(this).data("textchange_lastvalue", this.contentEditable === "true" ? a(this).html() : a(this).val());
            a(this).bind("keyup.textchange", a.event.special.textchange.handler);
            a(this).bind("cut.textchange paste.textchange input.textchange", a.event.special.textchange.delayedHandler)
        },
        teardown: function(b) {
            a(this).unbind(".textchange")
        },
        handler: function(b) {
            a.event.special.textchange.triggerIfChanged(a(this))
        },
        delayedHandler: function(c) {
            var b = a(this);
            if (!a.event.special.textchange.timer) {
                a.event.special.textchange.timer = setTimeout(function() {
                    a.event.special.textchange.timer = null;
                    a.event.special.textchange.triggerIfChanged(b)
                }, 250)
            }
        },
        triggerIfChanged: function(b) {
            var c = b[0].contentEditable === "true" ? b.html() : b.val();
            if (c !== b.data("textchange_lastvalue")) {
                b.trigger("textchange", [b.data("textchange_lastvalue")]);
                b.data("textchange_lastvalue", c)
            }
        },
        timer: null
    };
    a.event.special.hastext = {
        setup: function(c, b) {
            a(this).bind("textchange", a.event.special.hastext.handler)
        },
        teardown: function(b) {
            a(this).unbind("textchange", a.event.special.hastext.handler)
        },
        handler: function(c, b) {
            if ((b === "") && b !== a(this).val()) {
                a(this).trigger("hastext")
            }
        }
    };
    a.event.special.notext = {
        setup: function(c, b) {
            a(this).bind("textchange", a.event.special.notext.handler)
        },
        teardown: function(b) {
            a(this).unbind("textchange", a.event.special.notext.handler)
        },
        handler: function(c, b) {
            if (a(this).val() === "" && a(this).val() !== b) {
                a(this).trigger("notext")
            }
        }
    }
})(jQuery);
(function(a) {
    a.fn.autogrow = function(b) {
        return this.filter("textarea").each(function() {
            var d = this;
            var f = a(d);
            var e = f.height();
            var c = f.hasClass("autogrow-short") ? 0 : parseInt(f.css("lineHeight")) || 0;
            var h = a("<div></div>").css({
                position: "absolute",
                top: -10000,
                left: -10000,
                width: f.width(),
                fontSize: f.css("fontSize"),
                fontFamily: f.css("fontFamily"),
                fontWeight: f.css("fontWeight"),
                lineHeight: f.css("lineHeight"),
                resize: "none",
                "word-wrap": "break-word"
            }).appendTo(document.body);
            var g = function(j) {
                var i = function(s, v) {
                    for (var t = 0, u = ""; t < v; t++) {
                        u += s
                    }
                    return u
                };
                var k = d.value.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;").replace(/\n$/, "<br/>&nbsp;").replace(/\n/g, "<br/>").replace(/ {2,}/g, function(r) {
                    return i("&nbsp;", r.length - 1) + " "
                });
                if (j && j.data && j.data.event === "keydown" && j.keyCode === 13) {
                    k += "<br />"
                }
                var p = f.height();
                h.css("width", f.width());
                h.html(k + (c === 0 ? "..." : ""));
                f.height(Math.max(h.height() + c, e));
                var o = f.getCursorPosition();
                var q = f.val().length;
                if (q - o < 10) {
                    if (f.length && document.activeElement == f[0]) {
                        var m = f.closest(".flex_content_scroller");
                        var n = f.closest(".modal");
                        if (m.length) {
                            var l = f;
                            if (f.data("el-id-to-keep-in-view")) {
                                l = a("#" + f.data("el-id-to-keep-in-view"));
                                if (!l.length) {
                                    l = f
                                }
                            }
                            if (!CM.ui.isElInView(l, -50, m.dimensions_rect())) {
                                l.scrollintoview({
                                    offset: "bottom",
                                    px_offset: -50,
                                    duration: 200
                                })
                            }
                            if (f.height() != p) {
                                if (m.data("monkeyScroll")) {
                                    m.data("monkeyScroll").updateFunc()
                                }
                            }
                        } else {
                            if (n.length == -1) {
                                f.scrollintoview({
                                    offset: "bottom",
                                    px_offset: -50,
                                    duration: 200
                                })
                            }
                        }
                    }
                }
            };
            f.change(g).keyup(g).keydown({
                event: "keydown"
            }, g);
            a(window).resize(g);
            g()
        })
    }
})(jQuery);
(function(a) {
    a.event.special.destroyed = {
        remove: function(b) {
            if (b.handler) {
                b.handler()
            }
        }
    }
})(jQuery);
$.fn.draghover = function(a) {
    return this.each(function() {
        var c = $(),
            b = $(this);
        b.on("dragenter", function(d) {
            if (c.size() === 0) {
                b.trigger("draghoverstart", d)
            }
            c = c.add(d.target)
        });
        b.on("dragleave drop", function(d) {
            setTimeout(function() {
                c = c.not(d.target);
                if (c.size() === 0) {
                    b.trigger("draghoverend")
                }
            }, 1)
        })
    })
};
/*!
	Autosize v1.18.9 - 2014-05-27
	Automatically adjust textarea height based on user input.
	(c) 2014 Jack Moore - http://www.jacklmoore.com/autosize
	license: http://www.opensource.org/licenses/mit-license.php
*/
(function(b) {
    var e = {
            className: "autosizejs",
            id: "autosizejs",
            append: "\n",
            callback: false,
            resizeDelay: 200,
            placeholder: true
        },
        f = '<textarea tabindex="-1" style="position:absolute; top:-999px; left:0; right:auto; bottom:auto; border:0; padding: 0; -moz-box-sizing:content-box; -webkit-box-sizing:content-box; box-sizing:content-box; word-wrap:break-word; height:0 !important; min-height:0 !important; overflow:hidden; transition:none; -webkit-transition:none; -moz-transition:none;"/>',
        a = ["fontFamily", "fontSize", "fontWeight", "fontStyle", "letterSpacing", "textTransform", "wordSpacing", "textIndent"],
        d, c = b(f).data("autosize", true)[0];
    c.style.lineHeight = "99px";
    if (b(c).css("lineHeight") === "99px") {
        a.push("lineHeight")
    }
    c.style.lineHeight = "";
    b.fn.autosize = function(g) {
        if (!this.length) {
            return this
        }
        g = b.extend({}, e, g || {});
        if (c.parentNode !== document.body) {
            b(document.body).append(c)
        }
        return this.each(function() {
            var m = this,
                l = b(m),
                s, u, k = 0,
                t = b.isFunction(g.callback),
                n = {
                    height: m.style.height,
                    overflow: m.style.overflow,
                    overflowY: m.style.overflowY,
                    wordWrap: m.style.wordWrap,
                    resize: m.style.resize
                },
                h = l.width(),
                j = l.css("resize");
            if (l.data("autosize")) {
                return
            }
            l.data("autosize", true);
            if (l.css("box-sizing") === "border-box" || l.css("-moz-box-sizing") === "border-box" || l.css("-webkit-box-sizing") === "border-box") {
                k = l.outerHeight() - l.height()
            }
            k -= (typeof g.boxOffset !== "undefined" ? g.boxOffset : 0);
            u = Math.max(parseInt(l.css("minHeight"), 10) - k || 0, l.height());
            l.css({
                overflow: "hidden",
                overflowY: "hidden",
                wordWrap: "break-word"
            });
            if (j === "vertical") {
                l.css("resize", "none")
            } else {
                if (j === "both") {
                    l.css("resize", "horizontal")
                }
            }

            function o() {
                var w;
                var v = window.getComputedStyle ? window.getComputedStyle(m, null) : false;
                if (v) {
                    w = m.getBoundingClientRect().width;
                    if (w === 0 || typeof w !== "number") {
                        w = parseInt(v.width, 10)
                    }
                    b.each(["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"], function(x, y) {
                        w -= parseInt(v[y], 10)
                    })
                } else {
                    w = l.width()
                }
                c.style.width = Math.max(w, 0) + "px"
            }

            function r() {
                var w = {};
                d = m;
                c.className = g.className;
                c.id = g.id;
                s = parseInt(l.css("maxHeight"), 10);
                b.each(a, function(y, z) {
                    w[z] = l.css(z)
                });
                b(c).css(w).attr("wrap", l.attr("wrap"));
                o();
                if (window.chrome) {
                    var v = m.style.width;
                    m.style.width = "0px";
                    var x = m.offsetWidth;
                    m.style.width = v
                }
            }

            function q() {
                var v, w;
                if (d !== m) {
                    r()
                } else {
                    o()
                }
                if (!m.value && g.placeholder) {
                    c.value = (l.attr("placeholder") || "") + g.append
                } else {
                    c.value = m.value + g.append
                }
                c.style.overflowY = m.style.overflowY;
                w = parseInt(m.style.height, 10);
                c.scrollTop = 0;
                c.scrollTop = 90000;
                v = c.scrollTop;
                if (s && v > s) {
                    m.style.overflowY = "scroll";
                    v = s
                } else {
                    m.style.overflowY = "hidden";
                    if (v < u) {
                        v = u
                    }
                }
                v = parseInt(v, 10);
                if (w !== v) {
                    m.style.height = v + "px";
                    if (t) {
                        g.callback.call(m, m)
                    }
                }
            }

            function p() {
                var v = l.width();
                if (v !== h) {
                    h = v;
                    q()
                }
            }

            function i() {
//                CM.utility.throttle.method(p, "autosize_resize", g.resizeDelay)
            }
            if ("onpropertychange" in m) {
                if ("oninput" in m) {
                    l.on("input keyup", q)
                } else {
                    l.on("propertychange.autosize", function() {
                        if (event.propertyName === "value") {
                            q()
                        }
                    })
                }
            } else {
                l.on("input", q)
            }
            if (g.resizeDelay !== false) {
                b(window).on("resize.autosize", i)
            }
            l.on("autosize.resize", q);
            l.on("autosize-resize", q);
            l.on("autosize.resizeIncludeStyle", function() {
                d = null;
                q()
            });
            l.on("autosize.destroy", function() {
                d = null;
                b(window).off("resize", i);
                l.off("autosize").off(".autosize").css(n).removeData("autosize")
            });
            q()
        })
    }
}(window.jQuery || window.$));