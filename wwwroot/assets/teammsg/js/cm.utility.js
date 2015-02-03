CM.utility = {
	is_retina: false,
	onStart: function() {
      if ("devicePixelRatio" in window && window.devicePixelRatio > 1) {
          CM.utility.is_retina = true
      }
	},
    populateInput: function(el, value) {
        el.val(value).trigger("autosize").trigger("textchange");
        el.data("textchange_lastvalue", value)
    },

	getLowerCaseValue: function(a) {
        return (a && a.toLowerCase ? a.toLowerCase() : "")
    },
    formatTopicOrPurpose: function(a) {
        return a;
    	//return CM.utility.emojiReplace(CM.utility.linkify(a, CM.templates.builders.newWindowName(), true))
    },
    capitalize: function(a) {
        return a.charAt(0).toUpperCase() + a.slice(1)
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
	          return CM.utility.numberWithCommas(a) + "K"
	      } else {
	          return CM.utility.numberWithCommas(a)
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
	makeSafeForDomId:function(a){return a.replace(/\./g,"_")
	},
	makeSafeForDomClass:function(a){return a.replace(/\s/g,"_")
	},
	htmlEntities:function(a){
		if(!a){return""
		}
		return String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
	},
	preg_quote:function(a){return(a+"").replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g,"\\$1")
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
      return a[CM.utility.randomInt(0, a.length - 1)]
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
      var b = CM.utility._getPathAFromUrl(a);
      if (b && b.length > 0) {
          return decodeURIComponent(b[0])
      }
      return ""
  },
  getFlexNameFromUrl: function(a) {
      var b = CM.utility._getPathAFromUrl(a);
      if (b && b.length > 1) {
          return decodeURIComponent(b[1])
      }
      return ""
  },
  getFlexExtraFromUrl: function(a) {
      var b = CM.utility._getPathAFromUrl(a);
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
      return CM.utility.base64StrtoBlob(CM.utility.base64StrFromDataURI(a))
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
  date:{
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
        var a = CM.utility.date.toDateObject(e);
        var h = a.getHours();
        var c = a.getMinutes();
        var d = a.getSeconds();
        var b = false;
        if (CM.utility.date.do24hrTime()) {
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
        if (g && !CM.utility.date.do24hrTime()) {
            if (b) {
                j += " PM"
            } else {
                j += " AM"
            }
        }
        return j
    },
    toDate: function(e) {
        var a = CM.utility.date.toDateObject(e);
        var f = a.getFullYear();
        var d = a.getMonth();
        var g = a.getDate();
        var h = a.getHours();
        var c = a.getMinutes();
        var b = false;
        if (CM.utility.date.do24hrTime()) {
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
        if (!CM.utility.date.do24hrTime()) {
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
        var c = CM.utility.date.toDateObject(d);
        var b = new Date();
        var a = 31 * 24 * 60 * 60 * 1000;
        if (c.getFullYear() == b.getFullYear() || b - c <= a) {
            e = true
        }
        return CM.utility.date.toCalendarDateOrNamedDay(d, true, e)
    },
    do24hrTime: function() {
        if (CM.model.user && CM.model.prefs && CM.model.prefs.time24) {
            return true
        }
        return false
    },
    toFilenameFriendlyDate: function(e) {
        var a = CM.utility.date.toDateObject(e);
        var f = a.getFullYear();
        var d = a.getMonth();
        var g = a.getDate();
        var h = a.getHours();
        var c = a.getMinutes();
        var b = false;
        if (!CM.utility.date.do24hrTime()) {
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
        if (!CM.utility.date.do24hrTime()) {
            if (b) {
                j += " PM"
            } else {
                j += " AM"
            }
        }
        return j
    },
    toCalendarDate: function(f, d, a) {
        var c = CM.utility.date.toDateObject(f);
        var g = c.getFullYear();
        var e = c.getMonth();
        var h = c.getDate();
        var b = c.getDay();
        if (d) {
            var j = CM.utility.date.short_month_names[e] + " " + CM.utility.ordinalNumber(h)
        } else {
            var j = CM.utility.date.month_names[e] + " " + CM.utility.ordinalNumber(h)
        } if (!a) {
            j += ", " + g
        }
        return j
    },
    toCalendarDateOrNamedDay: function(e, c, g) {
        var b = CM.utility.date.toDateObject(e);
        var a = new Date();
        var d = new Date();
        d.setDate(a.getDate() - 1);
        var h;
        if (CM.utility.date.sameDay(b, a)) {
            h = "Today"
        } else {
            if (CM.utility.date.sameDay(b, d)) {
                h = "Yesterday"
            } else {
                var f = (c) ? CM.utility.date.short_day_names : CM.utility.date.day_names;
                h = f[b.getDay()] + ", " + CM.utility.date.toCalendarDate(e, c, g)
            }
        }
        return h
    },
    toCalendarDateIfYesterdayOrTomorrow: function(e, c) {
        var b = CM.utility.date.toDateObject(e);
        var a = new Date();
        var d = new Date();
        d.setDate(a.getDate() - 1);
        var f = "";
        if (CM.utility.date.sameDay(b, a)) {
            f = CM.utility.date.toCalendarDate(e, c)
        } else {
            if (CM.utility.date.sameDay(b, d)) {
                f = CM.utility.date.toCalendarDate(e, c)
            }
        }
        return f
    },
    toHour: function(d) {
        var b = CM.utility.date.toDateObject(d);
        var a = b.getHours();
        var c = false;
        if (CM.utility.date.do24hrTime()) {
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
        if (!CM.utility.date.do24hrTime()) {
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
        if (f._id == CM.model.user._id) {
            g += a + " (<a href='/account/settings' target='new'>change</a>)"
        } else {
            var d = b / 60 / 60;
            var k = (CM.model.user.tz_offset - b) / 60 / 60;
            if (h) {
                var e = new Date();
                var c = e.getTime();
                var j = c - (k * 60 * 60 * 1000);
                g += '<span class="timezone_value">' + CM.utility.date.toTime(j / 1000, true) + "</span>";
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
        b = b || CM.utility.date.fake_ts_unique_padder;
        c = (c === undefined || c === null) ? ++CM.utility.date.fake_ts_unique_incrementer : c;
        var a = Math.floor(e / 1000).toString();
        var f = CM.utility.padNumber(c, 6, b);
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
        var c = CM.utility.date.toDateObject(d);
        var b = new Date(c.getTime() + 86400000);
        var a = b.getFullYear() + "-" + CM.utility.padNumber(b.getMonth() + 1, 2, "0") + "-" + CM.utility.padNumber(b.getDate(), 2, "0");
        return a
    },
    getPrevActivityDayStamp: function(d) {
        var c = CM.utility.date.toDateObject(d);
        var b = new Date(c.getTime() - 86400000);
        var a = b.getFullYear() + "-" + CM.utility.padNumber(b.getMonth() + 1, 2, "0") + "-" + CM.utility.padNumber(b.getDate(), 2, "0");
        return a
    }
  },
  msgs:{
	  automated_subtypes: ["channel_join", "channel_leave", "channel_topic", "channel_purpose", "channel_archive", "channel_unarchive", "group_join", "group_leave", "group_topic", "group_purpose", "group_archive", "group_unarchive", "group_name", "channel_name", "play_sound"],
	    ephemeral_msgs_map: {},
	    onStart: function() {},
	    appendMsg: function(a, b) {
	        a.unshift(CM.utility.msgs.makeSureMsgObIsValid(b))
	    },
	    setMsgs: function(a, c) {
	        for (var b = 0; b < c.length; b++) {
	            c[b] = CM.utility.msgs.makeSureMsgObIsValid(c[b])
	        }
	        CM.utility.msgs.sortMsgs(c);
	        a.msgs = c;
	        CM.utility.msgs.maybeStoreMsgs(a.id, a.msgs);
	        return a.msgs
	    },
	    spliceMsg: function(b, c) {
	        var a = b.indexOf(c);
	        if (a > -1) {
	            b.splice(a, 1)
	        }
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
	    getMsg: function(ts, msgs) {
	        if (!msgs) {
	            CM.error("no msgs?");
	            return null
	        }
	        return CM.utility.msgs.getMsgByProp("ts", ts, msgs)
	    },
	    getMsgByProp: function(prop, value, msgs) {
	        if (!value && value !== 0) {
	            return null
	        }
	        var msg;
	        for (var index = 0; index < msgs.length; index++) {
	        	msg = msgs[index];
	            if (msg[prop] == value) {
	                return msg
	            }
	        }
	        return null
	    },
	    maybeStoreMsgs: function(c, b) {
	        if (!CM.client) {
	            return
	        }
	        b = CM.utility.msgs.prepareMsgsForLS(b);
	        var a = CM.storage.fetchMsgsRaw(c);
	        if (!a || JSON.stringify(a) != JSON.stringify(b)) {
	            CM.storage.storeMsgs(c, b)
	        }
	    },
	    validateMsg: function(c, b, a) {
	        if (!b.ts) {
	            CM.error("msg lacks a ts (" + c + ")");
	            CM.dir(0, b);
	            return false
	        }
	        if (CM.utility.msgs.getMsg(b.ts, a)) {
	            CM.warn("msg " + b.ts + " already exists! (" + c + ")");
	            CM.dir(0, b);
	            return false
	        }
	        return true
	    },
	    replaceMsg: function(b, a) {
	        var d = CM.utility.msgs.getMsg(a.ts, b.msgs);
	        if (!d) {
	            return
	        }
	        var e = a.comment || null;
	        a = CM.utility.msgs.processImsg(a);
	        if (e) {
	            a.comment = e
	        }
	        for (var c in d) {
	            delete d[c]
	        }
	        for (var c in a) {
	            d[c] = a[c]
	        }
	        if (b.id == CM.model.active_im_id) {
	            CM.ims.message_changed_sig.dispatch(b, d)
	        } else {
	            if (b.id == CM.model.active_channel_id) {
	                CM.channels.message_changed_sig.dispatch(b, d)
	            } else {
	                if (b.id == CM.model.active_group_id) {
	                    CM.groups.message_changed_sig.dispatch(b, d)
	                }
	            }
	        }
	        CM.utility.msgs.maybeStoreMsgs(b.id, b.msgs)
	    },
	    removeEphemeralMsg: function(b, c) {
	        var a = CM.groups.getGroupById(b) || CM.channels.getChannelById(b);
	        if (!a) {
	            return
	        }
	        if (a.is_channel) {
	            CM.channels.removeMsg(b, CM.utility.msgs.getMsg(c, a.msgs))
	        } else {
	            if (a.is_group) {
	                CM.groups.removeMsg(b, CM.utility.msgs.getMsg(c, a.msgs))
	            }
	        }
	    },
	    getMostRecentValidTs: function(b) {
	        var c;
	        for (var a = 0; a < b.length; a++) {
	            c = b[a];
	            if (!CM.utility.msgs.isTempMsg(c)) {
	                return c.ts
	            }
	        }
	        return null
	    },
	    getOldestValidTs: function(b) {
	        var c;
	        for (var a = b.length - 1; a > -1; a--) {
	            c = b[a];
	            if (!CM.utility.msgs.isTempMsg(c)) {
	                return c.ts
	            }
	        }
	        return null
	    },
	    isTempMsg: function(a) {
	        return (!a.ts || a.ts.indexOf(CM.utility.date.fake_ts_unique_padder) > -1)
	    },
  }
};