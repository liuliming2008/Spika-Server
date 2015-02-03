
var MCM_last_log_date = null;
    var MCMMakeLogDate = function() {
    	var date = new Date();
    	
    	var y = date.getFullYear();
    	var mo = date.getMonth()+1;
    	var d = date.getDate();
    
    	var h = date.getHours();
    	var mi = date.getMinutes();
    	var s = date.getSeconds();
    	var ms = date.getMilliseconds();
    	var str = y+'/'+mo+'/'+d+' '+h+':'+mi+':'+s+'.'+ms;
    	if (MCM_last_log_date) {
    		var diff = date-MCM_last_log_date;
    		//str+= ' ('+diff+'ms)';
    	}
    	MCM_last_log_date = date;
    	return str+' ';
    };
MCM =  {
	
    Chat:{},
    focusRoom :'',

    Joined:[],
    Names:{},
    _users:[],
    
    model:{
    	onStart: function() {
    		
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
            console.log(MCMMakeLogDate() + c + " " + a)
        }
    },
    info: function(a) {
        if (!window.console || !console.info) {
            return
        }
        console.info(MCMMakeLogDate() + a)
    },
    warn: function(a) {
        if (!window.console || !console.warn) {
            return
        }
        console.warn(MCMMakeLogDate() + a)
    },
    ui:{
      onStart: function(){
        MCM.ui.bindChannelGroupImStarredLists();	    
      },
      bindChannelGroupImStarredLists: function() {
            var b = function(f) {
                
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
                        var i = MCM.ims.getImByMemberId(c);
                        MCM.ui.maybePromptForClosingIm(i.id)
                    } else {
                        f.stopPropagation();
                        MCM.ims.startImByMemberId(c)
                    }
                } else {
                    if (j) {
                        if (l.hasClass("group_close")) {
                            f.stopPropagation();
                            MCM.ui.maybePromptForClosingGroup(j)
                        } else {
                            f.stopPropagation();
                            MCM.groups.displayGroup(j)
                        }
                    } else {
                        if (g) {
                            f.preventDefault();
                            MCM.channels.displayChannel(g)
                        } else {
                            if (l.hasClass("channel-list-more")) {
                                MCM.ui.list_browser_dialog.start("channels")
                            } else {
                                if (l.hasClass("channel-list-create")) {
                                    MCM.ui.channel_create_dialog.start()
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
        },
      channel_create_dialog: {
        div: null,
        showing: false,
        is_edit: false,
        model_ob: null,
        ladda: null,
        onStart: function() {},
        onKeydown: function(a) {
            if (a.which == MCM.utility.keymap.enter) {
                MCM.ui.channel_create_dialog.go();
                a.preventDefault()
            } else {
                if (a.which == MCM.utility.keymap.esc) {
                    MCM.ui.channel_create_dialog.cancel()
                }
            }
        },
        start: function(c, a) {
            
            MCM.ui.channel_create_dialog.is_edit = false;
            MCM.ui.channel_create_dialog.model_ob = null
            c = MCM.utility.cleanChannelName(c || "");
            if (!MCM.ui.channel_create_dialog.div) {
                MCM.ui.channel_create_dialog.build()
            }
            var d = MCM.ui.channel_create_dialog.div;
            var b = MCM.templates.channel_create_dialog({
                title: c,
                is_edit: MCM.ui.channel_create_dialog.is_edit,
                is_group: MCM.ui.channel_create_dialog.model_ob && MCM.ui.channel_create_dialog.model_ob.is_group,
                hide_private_group_option: false
            });
            d.empty();
            d.html(b);
            d.find(".dialog_cancel").click(MCM.ui.channel_create_dialog.cancel);
            d.find(".dialog_go").click(MCM.ui.channel_create_dialog.go);
            d.removeClass("hide");
            d.modal("show");
        },
        switchToGroup: function() {
            var a = MCM.ui.channel_create_dialog.div.find(".title_input").val();
            MCM.ui.channel_create_dialog.cancel();
            setTimeout(function() {
                MCM.ui.group_create_dialog.start(a)
            }, 350)
        },
        showNameTakenAlert: function() {
            var a = MCM.ui.channel_create_dialog.div;
            MCM.channels.ui.channelCreateDialogShowNameTakenAlert(a)
        },
        go: function() {
            if (!MCM.ui.channel_create_dialog.showing) {
                MCM.error("not showing?");
                return
            }
            var f = MCM.ui.channel_create_dialog.div;
            var c = MCM.channels.ui.channelCreateDialogValidateInput(f);
            if (!c) {
                return
            }
            var b = f.find(".title_input").val();
            var a = $.trim(f.find("#channel_purpose_input").val());
            if (MCM.ui.channel_create_dialog.ladda) {
                MCM.ui.channel_create_dialog.ladda.start()
            }
            if (MCM.ui.channel_create_dialog.is_edit) {
                var d = (MCM.ui.channel_create_dialog.model_ob.is_channel) ? "channels.rename" : "groups.rename";
                MCM.api.callImmediately(d, {
                    name: b,
                    channel: MCM.ui.channel_create_dialog.model_ob.id
                }, function(h, i, g) {
                    if (MCM.ui.channel_create_dialog.ladda) {
                        MCM.ui.channel_create_dialog.ladda.stop()
                    }
                    if (!h) {
                        if (i.error == "name_taken") {
                            MCM.ui.channel_create_dialog.showNameTakenAlert()
                        } else {
                            alert("failed! " + i.error)
                        }
                        return
                    }
                    f.modal("hide")
                })
            } else {
                MCM.channels.join(b, function(h, i, g) {
                    if (MCM.ui.channel_create_dialog.ladda) {
                        MCM.ui.channel_create_dialog.ladda.stop()
                    }
                    if (!h) {
                        if (i.error == "name_taken") {
                            MCM.ui.channel_create_dialog.showNameTakenAlert()
                        } else {
                            if (i.error == "restricted_action") {} else {
                                alert("failed! " + i.error)
                            }
                        }
                        return
                    }
                    if (a) {
                        MCM.channels.setPurpose(i.channel.id, a)
                    }
                    f.modal("hide")
                })
            }
        },
        cancel: function() {
            MCM.ui.channel_create_dialog.div.modal("hide")
        },
        end: function() {
            MCM.ui.channel_create_dialog.showing = MCM.model.dialog_is_showing = false;
            $(window.document).unbind("keydown", MCM.ui.channel_create_dialog.onKeydown)
        },
        build: function() {
            $("body").append('<div id="channel_create_dialog" class="modal hide fade"></div>');
            var a = MCM.ui.channel_create_dialog.div = $("#channel_create_dialog");
            a.on("hide", function(b) {
                if (b.target != this) {
                    return
                }
                MCM.ui.channel_create_dialog.end()
            });
            a.on("show", function(b) {
                if (b.target != this) {
                    return
                }
                MCM.ui.channel_create_dialog.showing = MCM.model.dialog_is_showing = true
            });
            a.on("shown", function(b) {
                if (b.target != this) {
                    return
                }
                setTimeout(function() {
                    a.find(".title_input").select();
                    $(window.document).bind("keydown", MCM.ui.channel_create_dialog.onKeydown)
                }, 100);
                MCM.ui.channel_create_dialog.ladda = Ladda.create(a.find(".dialog_go")[0])
            })
        }
    }
    },
    view:{
      cached_wh:0,
      
      banner_el:$("#banner"),
      input_el:$("#message-input"),
      cached_wh:0,
      team_menu_h:$("#team_menu").height(),
      footer_outer_h:$("#footer").height(),

      onStart:function(){
        	 
    	},
      onResize:function(){
        var booting=MCM.view.cached_wh==0;
        var cur_windows_h=$(window).height();;
        MCM.view.cached_wh=cur_windows_h;
        
        var banner_h=(MCM.view.banner_el.hasClass("hidden"))?0:parseInt(MCM.view.banner_el.css("height"));
        $("#channels_scroller").css("height",cur_windows_h-MCM.view.footer_outer_h-MCM.view.team_menu_h-banner_h);
        $("#channels_scroller").perfectScrollbar('update');
      }
      
    },
    
    utility:{
    	onStart:function(){
    		
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
              MCM.utility.is_retina = true
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
          return a[MCM.utility.randomInt(0, a.length - 1)]
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
          var b = MCM.utility._getPathAFromUrl(a);
          if (b && b.length > 0) {
              return decodeURIComponent(b[0])
          }
          return ""
      },
      getFlexNameFromUrl: function(a) {
          var b = MCM.utility._getPathAFromUrl(a);
          if (b && b.length > 1) {
              return decodeURIComponent(b[1])
          }
          return ""
      },
      getFlexExtraFromUrl: function(a) {
          var b = MCM.utility._getPathAFromUrl(a);
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
          return MCM.utility.base64StrtoBlob(MCM.utility.base64StrFromDataURI(a))
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
            var a = MCM.utility.date.toDateObject(e);
            var h = a.getHours();
            var c = a.getMinutes();
            var d = a.getSeconds();
            var b = false;
            if (MCM.utility.date.do24hrTime()) {
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
            if (g && !MCM.utility.date.do24hrTime()) {
                if (b) {
                    j += " PM"
                } else {
                    j += " AM"
                }
            }
            return j
        },
        toDate: function(e) {
            var a = MCM.utility.date.toDateObject(e);
            var f = a.getFullYear();
            var d = a.getMonth();
            var g = a.getDate();
            var h = a.getHours();
            var c = a.getMinutes();
            var b = false;
            if (MCM.utility.date.do24hrTime()) {
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
            if (!MCM.utility.date.do24hrTime()) {
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
            var c = MCM.utility.date.toDateObject(d);
            var b = new Date();
            var a = 31 * 24 * 60 * 60 * 1000;
            if (c.getFullYear() == b.getFullYear() || b - c <= a) {
                e = true
            }
            return MCM.utility.date.toCalendarDateOrNamedDay(d, true, e)
        },
        do24hrTime: function() {
            if (MCM.model.user && MCM.model.prefs && MCM.model.prefs.time24) {
                return true
            }
            return false
        },
        toFilenameFriendlyDate: function(e) {
            var a = MCM.utility.date.toDateObject(e);
            var f = a.getFullYear();
            var d = a.getMonth();
            var g = a.getDate();
            var h = a.getHours();
            var c = a.getMinutes();
            var b = false;
            if (!MCM.utility.date.do24hrTime()) {
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
            if (!MCM.utility.date.do24hrTime()) {
                if (b) {
                    j += " PM"
                } else {
                    j += " AM"
                }
            }
            return j
        },
        toCalendarDate: function(f, d, a) {
            var c = MCM.utility.date.toDateObject(f);
            var g = c.getFullYear();
            var e = c.getMonth();
            var h = c.getDate();
            var b = c.getDay();
            if (d) {
                var j = MCM.utility.date.short_month_names[e] + " " + MCM.utility.ordinalNumber(h)
            } else {
                var j = MCM.utility.date.month_names[e] + " " + MCM.utility.ordinalNumber(h)
            } if (!a) {
                j += ", " + g
            }
            return j
        },
        toCalendarDateOrNamedDay: function(e, c, g) {
            var b = MCM.utility.date.toDateObject(e);
            var a = new Date();
            var d = new Date();
            d.setDate(a.getDate() - 1);
            var h;
            if (MCM.utility.date.sameDay(b, a)) {
                h = "Today"
            } else {
                if (MCM.utility.date.sameDay(b, d)) {
                    h = "Yesterday"
                } else {
                    var f = (c) ? MCM.utility.date.short_day_names : MCM.utility.date.day_names;
                    h = f[b.getDay()] + ", " + MCM.utility.date.toCalendarDate(e, c, g)
                }
            }
            return h
        },
        toCalendarDateIfYesterdayOrTomorrow: function(e, c) {
            var b = MCM.utility.date.toDateObject(e);
            var a = new Date();
            var d = new Date();
            d.setDate(a.getDate() - 1);
            var f = "";
            if (MCM.utility.date.sameDay(b, a)) {
                f = MCM.utility.date.toCalendarDate(e, c)
            } else {
                if (MCM.utility.date.sameDay(b, d)) {
                    f = MCM.utility.date.toCalendarDate(e, c)
                }
            }
            return f
        },
        toHour: function(d) {
            var b = MCM.utility.date.toDateObject(d);
            var a = b.getHours();
            var c = false;
            if (MCM.utility.date.do24hrTime()) {
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
            if (!MCM.utility.date.do24hrTime()) {
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
            if (f._id == MCM.model.user._id) {
                g += a + " (<a href='/account/settings' target='new'>change</a>)"
            } else {
                var d = b / 60 / 60;
                var k = (MCM.model.user.tz_offset - b) / 60 / 60;
                if (h) {
                    var e = new Date();
                    var c = e.getTime();
                    var j = c - (k * 60 * 60 * 1000);
                    g += '<span class="timezone_value">' + MCM.utility.date.toTime(j / 1000, true) + "</span>";
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
            b = b || MCM.utility.date.fake_ts_unique_padder;
            c = (c === undefined || c === null) ? ++MCM.utility.date.fake_ts_unique_incrementer : c;
            var a = Math.floor(e / 1000).toString();
            var f = MCM.utility.padNumber(c, 6, b);
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
            var c = MCM.utility.date.toDateObject(d);
            var b = new Date(c.getTime() + 86400000);
            var a = b.getFullYear() + "-" + MCM.utility.padNumber(b.getMonth() + 1, 2, "0") + "-" + MCM.utility.padNumber(b.getDate(), 2, "0");
            return a
        },
        getPrevActivityDayStamp: function(d) {
            var c = MCM.utility.date.toDateObject(d);
            var b = new Date(c.getTime() - 86400000);
            var a = b.getFullYear() + "-" + MCM.utility.padNumber(b.getMonth() + 1, 2, "0") + "-" + MCM.utility.padNumber(b.getDate(), 2, "0");
            return a
        }
      }
    },
    templates:{
    	onStart: function() {
    	    MCM.templates.load();
    	    MCM.templates.registerPartials();
    	    //MCM.members.user_color_changed_sig.add(MCM.templates.memberUserColorChanged, MCM.templates);
    	    //MCM.prefs.sidebar_behavior_changed_sig.add(MCM.templates.sidebarBehaviorPrefChanged, MCM.templates)
    	}, 
    	generic_dialog_template: '		<div class="modal-header">			<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>			<h3>{{{title}}} <img src="/img/loading.gif" width="16" height="16" class="throbber hidden"></h3>		</div>		<div class="modal-body" style="overflow-x: hidden;">			{{{body}}}		</div>		<div class="modal-footer">			<a style="cursor: pointer" class="btn btn-outline btn_outline dialog_cancel"></a>			<a style="cursor: pointer" class="btn btn dialog_secondary_go hidden"></a>			<a style="cursor: pointer" class="btn dialog_go"></a>		</div>		',
    	generic_dialog_sample_template: '		<p><a class="btn btn-small" onclick="MCM.generic_dialog.cancel(); $(\'#file-upload\').trigger(\'click\');">Choose a file</a> 		OR <a class="btn btn-small" hhref="/files/create/snippet" target="{{newWindowName}}" onclick="MCM.ui.snippet_dialog.startCreate(); MCM.generic_dialog.cancel();">Create a text file</a></p>		', 
    	existing_groups_template: '		{{#if_equal existing_groups.length compare=1}}			The following group has the same members as the one you are trying to create. Would you like to use it instead?<br><br>		{{else}}			The following groups have the same members as the one you are trying to create. Would you like to use one of them instead?<br><br>		{{/if_equal}}		{{#each existing_groups}}			<p class="small_bottom_margin" style="font-size:0.8rem; color:black"><span style="color: #AAA;">{{{groupPrefix}}}</span>{{this.name}}&nbsp;&nbsp;<a onclick="MCM.ui.group_create_dialog.useExistingGroup(\'{{this._id}}\')" class="btn btn-mini btn-primary">{{#if this.is_archived}}unarchive{{else}}open{{/if}}</a></p>		{{/each}}		<br>		If you really want to create a new group, just click the "create new group" button again.		', 
    	issue_list_item_template: '		<div class="issue_list_div issue_{{issue.state}}" id="{{makeIssueListDomId issue._id}}" data-issue-id="{{issue._id}}">			<div class="issue_list_left">				<div class="issue_list_title">{{issue.title}}</div>				<div class="issue_list_short_text">{{issue.short_text}}</div>			</div>			<div class="issue_list_right">				<div class="issue_list_state">{{issue.state}}{{#if_equal issue.state compare="unread"}} <i class="fa fa-exclamation-circle icon"></i>{{/if_equal}}</div>				<div class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort issue.ts}} at {{toTime issue.ts}}</div>			</div>		</div>		', 
    	help_issue_div_template: '		<p class="small_bottom_margin"><b>{{issue.title}}</b></p>		{{#if show_comments}}			{{#each issue.comments}}				<div class="issue_comment_div">					<p class="small_bottom_margin"><b>{{this.from}}</b> <span class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort this.ts}} at {{toTime this.ts}}</span></p>					{{{formatMessageSimple this.text}}}				</div>			{{/each}}		{{else}}			<div class="issue_comment_div">			</div>		{{/if}}		', 
    	help_issue_reply_comments_template: '		{{#each issue.comments}}			<div class="issue_comment_div">				<p class="small_bottom_margin"><b>{{this.from}}</b> <span class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort this.ts}} at {{toTime this.ts}}</span></p>				{{{formatMessageSimple this.text}}}			</div>		{{/each}}		', 
    	message_attachment_template: '		{{{initial_caret_html}}}		<div {{#if real_src}}data-real-src="{{real_src}}"{{/if}} class="inline_attachment{{#unless expand_it}} hidden{{/unless}} {{max_width_class}}">			{{#if attachment.pretext}}				<div class="attachment_pretext">{{{formatMessageAttachmentPart attachment.pretext msg true attachment.mrkdwn_in_hash.pretext}}}</div>			{{/if}}			<div class="inline_attachment_wrapper{{#if is_standalone}} standalone{{/if}}">				<div class="attachment_bar" style="background:#{{bg_color}};"><div class="shim"></div></div>				<div class="content dynamic_content_max_width">										{{#if thumb_at_top}}					{{#if small_thumb}}						<div class="msg_inline_attachment_thumb_holder at_top">							{{#if thumb_link}}<a {{{makeRefererSafeLink url=thumb_link}}} target="{{thumb_link}}">{{/if}}							{{!using style for width height is important! we must override default img styles}}							<img class="msg_inline_attachment_thumb" src="{{small_thumb_url}}" style="width:{{attachment._floated_thumb_display_width}}px; height:{{attachment._floated_thumb_display_height}}px;">							{{#if thumb_link}}</a>{{/if}}						</div>					{{/if}}					{{/if}}										{{#if can_delete}}						<div class="delete_attachment_link" data-attachment-id="{{attachment.id._id}}"><i class="fa fa-times"></i></div>					{{/if}}										<div>						{{#if attachment.service_icon}}<img class="attachment_service_icon" src="{{attachment.service_icon}}" width="16" height="16">{{/if}}						{{#if attachment.author_icon}}							<img class="attachment_author_icon" src="{{attachment.author_icon}}" width="16" height="16">							<a{{#if attachment.author_link}} {{{makeRefererSafeLink url=attachment.author_link}}} target="{{attachment.author_link}}"{{/if}}><span class="attachment_author_name">{{{formatMessageAttachmentPart attachment.author_name msg false false}}}</span></a>							<a{{#if attachment.author_link}} {{{makeRefererSafeLink url=attachment.author_link}}} target="{{attachment.author_link}}"{{/if}}><span class="attachment_author_subname">{{{formatMessageAttachmentPart attachment.author_subname msg false false}}}</span></a>						{{else}}							{{#if attachment.service_url}}								<a {{{makeRefererSafeLink url=attachment.service_url}}} target="{{attachment.service_url}}"><span class="attachment_service_name">{{{formatMessageAttachmentPart attachment.service_name msg false false}}}</span></a>							{{else}}								<span class="attachment_service_name">{{{formatMessageAttachmentPart attachment.service_name msg false false}}}</span>							{{/if}}						{{/if}}						{{#unless attachment.title}}{{#unless attachment.text}}{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}{{/unless}}{{/unless}}					</div>										{{#unless thumb_at_top}}					{{#if small_thumb}}						<div class="msg_inline_attachment_thumb_holder">							{{#if thumb_link}}<a {{{makeRefererSafeLink url=thumb_link}}} target="{{thumb_link}}">{{/if}}							{{!using style for width height is important! we must override default img styles}}							<img class="msg_inline_attachment_thumb" src="{{small_thumb_url}}" style="width:{{attachment._floated_thumb_display_width}}px; height:{{attachment._floated_thumb_display_height}}px;">							{{#if thumb_link}}</a>{{/if}}						</div>					{{/if}}					{{/unless}}										{{#unless attachment.author_icon}}						<div class="attachment_author_name">{{{formatMessageAttachmentPart attachment.author_name msg false false}}}</div>					{{/unless}}										{{#if attachment.title}}						<div>							{{#if attachment.title_link}}								<span class="attachment_title"><a {{{makeRefererSafeLink url=attachment.title_link}}} target="{{attachment.title_link}}">{{{formatMessageAttachmentPart attachment.title msg true false enable_slack_action_links}}}</a></span>							{{else}}								<span class="attachment_title">{{{formatMessageAttachmentPart attachment.title msg true false enable_slack_action_links}}}</span>							{{/if}}							{{#unless attachment.text}}{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}{{/unless}}						</div>					{{/if}}										{{#if attachment.text}}						<div class="attachment_contents">							{{#if is_text_collapsed}}								<span class="short_text" data-all-text="{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text}}">{{{formatMessageAttachmentPart attachment._short_text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}</span>								<span id="{{makeMsgAttachmentTextExpanderDomId msg.ts attachment._index}}" class="rest_text_expander"> <a>Show more...</a></span>							{{else}}								{{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}							{{/if}}							{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}						</div>						{{#if attachment.footer}}<div class="attachment_footer">							{{{formatMessageAttachmentPart attachment.footer msg true attachment.mrkdwn_in_hash.footer enable_slack_action_links}}}						</div>{{/if}}						{{#if attachment.ts}}<div class="attachment_ts">							{{#if ts_link}}<a {{{makeRefererSafeLink url=ts_link}}} target="{{ts_link}}">{{/if}}							{{toCalendarDateOrNamedDayShort attachment.ts}} at {{toTime attachment.ts}}							{{#if ts_link}}</a>{{/if}}						</div>{{/if}}					{{/if}}										{{#if attachment.fields}}						<div class="attachment_fields">						{{#if show_fields_table}}							<table class="" cellpadding="0" cellspacing="0" border="0" align="left"><tbody>							{{#foreach attachment.fields}}								{{#if this.value._new_row}}<tr>{{/if}}								<td valign="top" colspan="{{#if this.value.short}}1{{else}}2{{/if}}" {{#if this.value.short}}{{#if this.value._new_row}}width="250"{{/if}}{{/if}}>									<div class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</div>									<i class="copy_only">----------------<br></i>									<div class="attachment_field_value {{#if this.value.short}}short{{/if}}">{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields ../enable_slack_action_links}}}<i class="copy_only"><br><br></i></div>								</td>							{{/foreach}}							</tbody></table>						{{else}}							{{#foreach long_fields}}								<span class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</span>&nbsp;&nbsp;&nbsp;{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields}}}<br>							{{/foreach}}							{{#foreach short_fields}}								{{#unless this.first}}&nbsp;&nbsp;éˆ?nbsp;&nbsp;{{/unless}}<span class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</span>&nbsp;&nbsp;&nbsp;{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields ../enable_slack_action_links}}}							{{/foreach}}						{{/if}}						</div>						{{{media_caret_html}}}					{{/if}}										{{#if attachment.video_html}}						{{#if attachment.thumb_url}}							{{#if attachment.from_url}}								{{{inlineVideoDiv attachment.from_url msg_dom_id expand_media}}}							{{else}}								{{{inlineVideoDiv attachment.thumb_url msg_dom_id expand_media}}}							{{/if}}						{{/if}}					{{else}}					{{/if}}										{{#if attachment.image_url}}						{{#if attachment.from_url}}							{{{inlineImgDiv attachment.from_url msg_dom_id expand_media}}}						{{else}}							{{{inlineImgDiv attachment.image_url msg_dom_id expand_media}}}						{{/if}}					{{/if}}										{{#if attachment.audio_html}}						{{{inlineAudioDiv attachment.audio_html msg_dom_id attachment.audio_html expand_media}}}					{{else}}						{{#if attachment.audio_url}}							{{{formatSoundUrl attachment}}}						{{/if}}					{{/if}}										{{#if show_action_links}}					{{#if attachment.actions}}						<div class="attachment_actions">						{{#foreach attachment.actions}}							{{{formatActionLink this.value msg ../enable_slack_action_links}}}							{{#unless this.last}} éˆ?{{/unless}}						{{/foreach}}						</div>					{{/if}}					{{/if}}				</div>			</div>		</div>		{{#if show_fallback}}<div class="attachment_fallback">{{#if attachment.fallback}}{{{formatMessageAttachmentPart attachment.fallback msg true attachment.mrkdwn_in_hash.fallback enable_slack_action_links}}}{{else}}NO FALLBACK PROVIDED{{/if}}</div>{{/if}}		', 
    	file_snippet_reference_template: '<div class="file_reference">{{#isTheme theme="dense"}}	<div class="meta">		{{#if uploader}}{{{makeMemberPreviewLinkById uploader._id false}}}\'s{{else}}a{{/if}} snippet: 		<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file._id}}" class="file_preview_link file_name bold">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>		<a href="{{file.permalink}}" target="{{file.permalink}}" class="fa fa-external-link-square icon_new_window" title="Open file page"></a>	</div>	{{#unless standalone}}		<div class="snippet_preview">			{{{file.preview_highlight}}}			{{#if_gt file.lines_more compare=0}}				<a href="{{file.permalink}}" data-file-id="{{file._id}}" class="file_preview_link snippet_preview_more" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file._id}}">+ {{file.lines_more}} more line{{#if_gt file.lines_more compare=1}}s{{/if_gt}}...</a>			{{/if_gt}}		</div>		<div class="snippet_meta">			<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>			<span class="bullet">éˆ?/span>			{{#memberIsSelf id=member._id}} 				{{#unless uploader}}					<a href="{{file.edit_link}}" target="{{file._id}}" class="file_edit" onclick="MCM.ui.snippet_dialog.startEdit(\'{{file._id}}\'); return false">Edit</a> <span class="bullet">éˆ?/span>				{{/unless}}			{{/memberIsSelf}}			<a href="{{file.permalink}}" target="{{file._id}}">New window</a>			<span class="bullet">éˆ?/span> 			<a href="{{file.url_private}}" target="{{file._id}}">View raw</a>			<span class="bullet">éˆ?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file._id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>		</div>	{{/unless}}	{{/isTheme}}		{{#isTheme theme="light"}}	<span class="meta">		{{#if uploader}}{{{makeMemberPreviewLinkById uploader._id false}}}\'s{{else}}a{{/if}} snippet: 		<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file._id}}" class="file_preview_link file_name">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>	</span><br />	{{#unless standalone}}		<div class="snippet_preview">			{{{file.preview_highlight}}}			{{#if_gt file.lines_more compare=0}}				<a href="{{file.permalink}}" data-file-id="{{file._id}}" class="file_preview_link snippet_preview_more" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file._id}}">+ {{file.lines_more}} more line{{#if_gt file.lines_more compare=1}}s{{/if_gt}}...</a>			{{/if_gt}}		</div>		<span class="meta block snippet_meta">			<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>			<span class="bullet">éˆ?/span> 			{{#memberIsSelf id=member._id}} 				{{#unless uploader}}					<a href="{{file.edit_link}}" target="{{file._id}}" class="file_edit" onclick="MCM.ui.snippet_dialog.startEdit(\'{{file._id}}\'); return false">Edit</a> <span class="bullet">éˆ?/span>				{{/unless}}			{{/memberIsSelf}}			<a href="{{file.permalink}}" target="{{file._id}}">New window</a>			<span class="bullet">éˆ?/span> 			<a href="{{file.url_private}}" target="{{file._id}}">View raw</a>			<span class="bullet">éˆ?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file._id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>		</span>	{{/unless}}	{{/isTheme}}</div>', 
    	file_post_reference_template: '<div class="file_reference">	{{#isTheme theme="dense"}}		<div class="post_meta">			{{#if uploader}}{{{makeMemberPreviewLinkById uploader._id false}}}\'s{{else}}a{{/if}} post: 			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file._id}}" class="file_preview_link file_name bold">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>			<a href="{{file.permalink}}" target="{{file.permalink}}" class="fa fa-external-link-square icon_new_window" title="Open file page"></a><br />		</div>		{{#unless standalone}}			<div class="post_preview">				{{{nl2br file.preview}}}				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file._id}}" class="file_preview_link">more</a>			</div>			<span class="meta block post_meta">				{{#memberIsSelf id=member._id}} 					{{#unless uploader}}						<a href="{{file.permalink}}/edit">Edit</a>						<span class="bullet">éˆ?/span>					{{/unless}}				{{/memberIsSelf}}				<a href="{{file.permalink}}" target="{{file._id}}">New window</a>				<span class="bullet">éˆ?/span>				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file._id}}" class="file_preview_link file_comment_link">					{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}				</a>			</span>		{{/unless}}	{{/isTheme}}		{{#isTheme theme="light"}}		<span class="meta">			{{#if uploader}}{{{makeMemberPreviewLinkById uploader._id false}}}\'s{{else}}a{{/if}} post: 			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file._id}}" class="file_preview_link file_name">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>			<a href="{{file.permalink}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open post in a new tab"><i class="fa fa-external-link-square file_inline_icon"></i></a>		</span>		{{#unless standalone}}			<div class="post_preview">				{{{nl2br file.preview}}}				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file._id}}" class="file_preview_link">more</a>			</div>			<span class="meta block post_meta">				{{#memberIsSelf id=member._id}} 					{{#unless uploader}}						<a href="{{file.permalink}}/edit">Edit</a>						<span class="bullet">éˆ?/span>					{{/unless}}				{{/memberIsSelf}}				<a href="{{file.permalink}}" target="{{file._id}}">New window</a>				<span class="bullet">éˆ?/span>				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file._id}}" class="file_preview_link file_comment_link">					{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}				</a>			</span>		{{/unless}}	{{/isTheme}}</div>', 
    	file_reference_template: '<div class="file_reference">{{#isTheme theme="dense"}}	<!--	<em>		{{{makeMemberPreviewLink member}}} referenced:		{{#if uploader}}			{{{makeMemberPreviewLink uploader}}}{{possessive uploader.name}} file:		{{/if}}	</em>	<a href="{{#if file.is_external}}{{file.url}}{{else}}{{file.permalink}}{{/if}}" target="{{#if file.is_external}}{{file.url}}{{else}}{{file.permalink}}{{/if}}" class="fa fa-external-link-square icon_new_window" title="{{#if file.is_external}}Open original in new tab{{else}}Open file page{{/if}}"></a>	-->	<div class="file_details">		{{#if file.is_external}}			<a href="{{file.url}}" {{#isClient}}target="{{file.url}}"{{/isClient}} data-file-id="{{file._id}}" class="icon icon_40 {{icon_class}}" title="Open original in new tab">		{{else}}			{{#fileIsImage id=file._id}}				<a href="{{file.url}}" {{#isClient}}target="{{file.url}}"{{/isClient}} data-file-id="{{file._id}}" class="file_preview_link icon icon_40 {{icon_class}} {{#if lightbox}}lightbox_link{{/if}}" title="Open in lightbox ({{#isMac}}cmd{{else}}ctrl{{/isMac}}+click to open original in new tab)">			{{else}}				<a href="{{file.url}}" {{#isClient}}target="{{file.url}}"{{/isClient}} data-file-id="{{file._id}}" class="icon icon_40 {{icon_class}}" title="Open original in new tab">			{{/fileIsImage}}		{{/if}}			{{#if file.thumb_80}}				{{#if_equal icon_class compare="thumb_40"}}					<img src="{{file.thumb_80}}" />				{{else}}					<img src="{{file.thumb_360}}" />				{{/if_equal}}			{{else}}				<span data-file-id="{{file._id}}" class="filetype_icon s24 {{file.filetype}}"></span>			{{/if}}		</a>		<span class="float-left" style="width: 85%">			<a href="{{file.permalink}}"{{#isClient}}target="{{file.permalink}}"{{/isClient}}  data-file-id="{{file._id}}" class="file_preview_link file_name">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>			{{#unless file.thumb_360}}				{{#unless file.is_external}}					<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" target="{{newWindowName}}" data-toggle="tooltip" title="Download file"><i class="fa fa-cloud-download file_inline_icon"></i></a>				{{/unless}}			{{/unless}}			{{#unless standalone}}				{{#if file.thumb_360_gif}}					{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}				{{else}}					{{{inlineImgToggler file.thumb_360 msg_dom_id}}}				{{/if}}			{{/unless}}			<br />			{{#if file.is_shared}}				in				{{{makeFileGroupChannelList file}}}			{{/if}}			<span class="bullet">éˆ?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file._id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>			{{#fileIsImage id=file._id}}				<span class="bullet">éˆ?/span>				<a href="{{file.url_private}}" target="{{file.url_private}}" data-file-id="{{file._id}}">Open original</a>			{{/fileIsImage}}			</span>		<div class="clear-both"></div>	</div>	{{#unless standalone}}		{{#if file.thumb_360_gif}}			{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}		{{else}}			{{{inlineImgDiv file.thumb_360 msg_dom_id}}}		{{/if}}	{{/unless}}	{{/isTheme}}	{{#isTheme theme="light"}}	<span class="meta">		<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file._id}}" class="file_preview_link file_name">			{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}		</a>		{{#if file.is_external}}			<a href="{{#if file.is_external}}{{file.url}}{{else}}{{file.permalink}}{{/if}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on {{#if_equal file.external_type compare="gdrive"}}Google Drive{{/if_equal}}{{#if_equal file.external_type compare="dropbox"}}Dropbox{{/if_equal}}{{#if_equal file.external_type compare="box"}}Box{{/if_equal}}{{#if_equal file.external_type compare="unknown"}}a web page{{/if_equal}}"><i class="fa fa-external-link-square file_inline_icon"></i></a>		{{/if}}		{{#unless file.thumb_360}}			{{#unless file.is_external}}				<a href="{{file.url_private_download}}" target="{{newWindowName}}" data-toggle="tooltip" title="Download file"><i class="fa fa-cloud-download file_inline_icon"></i></a>			{{/unless}}		{{/unless}}	</span>	{{#unless standalone}}		{{#if file.thumb_360_gif}}			{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}		{{else}}			{{{inlineImgToggler file.thumb_360 msg_dom_id}}}		{{/if}}		{{#if file.thumb_360_gif}}			{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}		{{else}}			{{{inlineImgDiv file.thumb_360 msg_dom_id}}}		{{/if}}	{{/unless}}	<span class="meta block">		{{#if file.is_external}}			{{#if_equal file.external_type compare="gdrive"}}				<a href="{{file.url}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Google Drive"><img src="/img/services/gdrive_16.png" class="gdrive_icon file_service_icon grayscale" /></a>			{{/if_equal}}			{{#if_equal file.external_type compare="dropbox"}}				<a href="{{file.url}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Dropbox"><i class="fa fa-dropbox file_service_icon"></i></a>			{{/if_equal}}			{{#if_equal file.external_type compare="box"}}				<a href="{{file.url}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Box"><img src="/plugins/box/assets/service_32.png" class="box_icon file_service_icon grayscale" /></a>			{{/if_equal}}		{{/if}}		{{#if uploader}}{{{makeMemberPreviewLinkById uploader._id false}}}{{possessive uploader.name}}{{else}}{{/if}} 		{{#if file.is_external}}			{{{external_filetype_html}}}		{{else}}			File		{{/if}}		{{#unless file.is_external}}			<span class="bullet">éˆ?/span>			<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" class="file_download_link" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>		{{/unless}}		{{#if file.is_shared}}			<span class="bullet">éˆ?/span>			in {{{makeFileGroupChannelList file}}}		{{/if}}		{{#unless standalone}}			<span class="bullet">éˆ?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file._id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>		{{/unless}}		{{#fileIsImage id=file._id}}			<span class="bullet">éˆ?/span>			<a href="{{file.url_private}}" target="{{file.url_private}}" data-file-id="{{file._id}}">Open original</a>		{{/fileIsImage}}	</span>	{{/isTheme}}</div>', 
    	messages_search_paging_template: '<div class="search_paging">{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=1}}<i class="left fa fa-chevron-circle-left disabled"></i>{{else}}<a onclick="MCM.search.view.pageMessagesBack()"><i class="left fa fa-chevron-circle-left"></i></a>{{/if_equal}}{{/if_not_equal}}<span class="page_text">page {{current_page}} of {{pages}}</span>{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=pages}}<i class="right fa fa-chevron-circle-right disabled"></i>{{else}}<a onclick="MCM.search.view.pageMessagesForward()"><i class="right fa fa-chevron-circle-right"></i></a>{{/if_equal}}{{/if_not_equal}}</div>', 
    	files_search_paging_template: '<div class="search_paging">{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=1}}<i class="left fa fa-chevron-circle-left disabled"></i>{{else}}<a onclick="MCM.search.view.pageFilesBack()"><i class="left fa fa-chevron-circle-left"></i></a>{{/if_equal}}{{/if_not_equal}}<span class="page_text">page {{current_page}} of {{pages}}</span>{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=pages}}<i class="right fa fa-chevron-circle-right disabled"></i>{{else}}<a onclick="MCM.search.view.pageFilesForward()"><i class="right fa fa-chevron-circle-right"></i></a>{{/if_equal}}{{/if_not_equal}}</div>', 
    	compile: function(b) {
    	    var e = b + "_template";
    	    if (MCM.templates[e]) {
    	        return Handlebars.compile(MCM.templates[e])
    	    }
    	    var a = "#" + e;
    	    var d = $(a).html();
    	    if (!d) {
    	        MCM.warn(a + " has no html");
    	        return null
    	    }
    	    var c = Handlebars.compile(d);
    	    return c
    	},
    	load:function(){var a=MCM.utility.date.getTimeStamp();
    	MCM.templates.message=MCM.templates.compile("message");
    	MCM.templates.message_edit_form=MCM.templates.compile("message_edit_form");
    	MCM.templates.message_attachment=MCM.templates.compile("message_attachment");
    	MCM.templates.message_file_share=MCM.templates.compile("message_file_share");
    	MCM.templates.message_file_post_share=MCM.templates.compile("message_file_post_share");
    	MCM.templates.message_file_snippet_share=MCM.templates.compile("message_file_snippet_share");
    	MCM.templates.message_file_upload=MCM.templates.compile("message_file_upload");
    	MCM.templates.message_file_snippet_create=MCM.templates.compile("message_file_snippet_create");
    	MCM.templates.message_file_comment=MCM.templates.compile("message_file_comment");
    	MCM.templates.message_file_post_comment=MCM.templates.compile("message_file_post_comment");
    	MCM.templates.messages_day_divider=MCM.templates.compile("messages_day_divider");
    	MCM.templates.messages_unread_divider=MCM.templates.compile("messages_unread_divider");
    	MCM.templates.file_reference=MCM.templates.compile("file_reference");
    	MCM.templates.file_snippet_reference=MCM.templates.compile("file_snippet_reference");
    	MCM.templates.file_post_reference=MCM.templates.compile("file_post_reference");
    	MCM.templates.channel_list=MCM.templates.compile("channel_list");
    	MCM.templates.channel_members_list=MCM.templates.compile("channel_members_list");
    	MCM.templates.channel_create_overlay=MCM.templates.compile("channel_create_overlay");
    	MCM.templates.channel_join_overlay=MCM.templates.compile("channel_join_overlay");
    	MCM.templates.group_create_overlay=MCM.templates.compile("group_create_overlay");
    	MCM.templates.group_join_overlay=MCM.templates.compile("group_join_overlay");
    	MCM.templates.member=MCM.templates.compile("member");
    	MCM.templates.group=MCM.templates.compile("group");
    	MCM.templates.channel=MCM.templates.compile("channel");
    	MCM.templates.team_list=MCM.templates.compile("team_list");
    	MCM.templates.team_tabs=MCM.templates.compile("team_tabs");
    	MCM.templates.team_list_item=MCM.templates.compile("team_list_item");
    	MCM.templates.team_member_preview=MCM.templates.compile("team_member_preview");
    	MCM.templates.team_member_edit=MCM.templates.compile("team_member_edit");
    	MCM.templates.dm_badge=MCM.templates.compile("dm_badge");
    	MCM.templates.file_list_item=MCM.templates.compile("file_list_item");
    	MCM.templates.file_header=MCM.templates.compile("file_header");
    	MCM.templates.file_masonry_item=MCM.templates.compile("file_masonry_item");
    	MCM.templates.file_preview_head_section=MCM.templates.compile("file_preview_head_section");
    	MCM.templates.file_snippet_list_item=MCM.templates.compile("file_snippet_list_item");
    	MCM.templates.file_snippet_masonry_item=MCM.templates.compile("file_snippet_masonry_item");
    	MCM.templates.file_snippet_preview_head_section=MCM.templates.compile("file_snippet_preview_head_section");
    	MCM.templates.file_post_list_item=MCM.templates.compile("file_post_list_item");
    	MCM.templates.file_post_masonry_item=MCM.templates.compile("file_post_masonry_item");
    	MCM.templates.file_post_preview_head_section=MCM.templates.compile("file_post_preview_head_section");
    	MCM.templates.file_email_preview_head_section=MCM.templates.compile("file_email_preview_head_section");
    	MCM.templates.comments=MCM.templates.compile("comments");
    	MCM.templates.comment=MCM.templates.compile("comment");
    	MCM.templates.search_widget=MCM.templates.compile("search_widget");
    	MCM.templates.search_options=MCM.templates.compile("search_options");
    	MCM.templates.search_tabs=MCM.templates.compile("search_tabs");
    	MCM.templates.search_files_heading=MCM.templates.compile("search_files_heading");
    	MCM.templates.search_team_results=MCM.templates.compile("search_team_results");
    	MCM.templates.search_message_results=MCM.templates.compile("search_message_results");
    	//if(MCM.boot_data.feature_search_extracts){
    	//	MCM.templates.search_attachment_extracts=MCM.templates.compile("search_attachment_extracts");
    	//	MCM.templates.search_message_extracts=MCM.templates.compile("search_message_extracts");
    	//	MCM.templates.search_message_results_item=MCM.templates.compile("search_message_results_item_with_extracts")
    	//}else{
    	//	MCM.templates.search_message_results_item=MCM.templates.compile("search_message_results_item")
    	//}
    		
    	MCM.templates.search_results_none=MCM.templates.compile("search_results_none");
    	MCM.templates.user_status_form=MCM.templates.compile("user_status_form");
    	MCM.templates.menu=MCM.templates.compile("menu");
    	MCM.templates.emoji_menu=MCM.templates.compile("emoji_menu");
    	MCM.templates.emoji_header=MCM.templates.compile("emoji_header");
    	MCM.templates.menu_emoticons=MCM.templates.compile("menu_emoticons");
    	MCM.templates.menu_member_header=MCM.templates.compile("menu_member_header");
    	MCM.templates.menu_member_items=MCM.templates.compile("menu_member_items");
    	MCM.templates.menu_member_footer=MCM.templates.compile("menu_member_footer");
    	MCM.templates.menu_user_footer=MCM.templates.compile("menu_user_footer");
    	MCM.templates.menu_members_header=MCM.templates.compile("menu_members_header");
    	MCM.templates.menu_members_items=MCM.templates.compile("menu_members_items");
    	MCM.templates.menu_members_footer=MCM.templates.compile("menu_members_footer");
    	MCM.templates.menu_group_header=MCM.templates.compile("menu_group_header");
    	MCM.templates.menu_group_items=MCM.templates.compile("menu_group_items");
    	MCM.templates.menu_group_footer=MCM.templates.compile("menu_group_footer");
    	MCM.templates.menu_channel_header=MCM.templates.compile("menu_channel_header");
    	MCM.templates.menu_channel_items=MCM.templates.compile("menu_channel_items");
    	MCM.templates.menu_channel_footer=MCM.templates.compile("menu_channel_footer");
    	MCM.templates.menu_groups_header=MCM.templates.compile("menu_groups_header");
    	MCM.templates.menu_groups_items=MCM.templates.compile("menu_groups_items");
    	MCM.templates.menu_team_items=MCM.templates.compile("menu_team_items");
    	MCM.templates.menu_user_items=MCM.templates.compile("menu_user_items");
    	MCM.templates.menu_activity_toggle_items=MCM.templates.compile("menu_activity_toggle_items");
    	MCM.templates.menu_file_filter_items=MCM.templates.compile("menu_file_filter_items");
    	MCM.templates.menu_file_member_header=MCM.templates.compile("menu_file_member_header");
    	MCM.templates.menu_file_member_filter_items=MCM.templates.compile("menu_file_member_filter_items");
    	MCM.templates.menu_message_action_items=MCM.templates.compile("menu_message_action_items");
    	MCM.templates.menu_comment_action_items=MCM.templates.compile("menu_comment_action_items");
    	MCM.templates.menu_file_action_items=MCM.templates.compile("menu_file_action_items");
    	//if(MCM.boot_data.feature_new_team_sites){
    	//	MCM.templates.menu_service_action_items=MCM.templates.compile("menu_service_action_items")
    	//}
    	MCM.templates.menu_flexpane_header=MCM.templates.compile("menu_flexpane_header");
    	MCM.templates.menu_flexpane_items=MCM.templates.compile("menu_flexpane_items");
    	MCM.templates.menu_flexpane_footer=MCM.templates.compile("menu_flexpane_footer");
    	MCM.templates.menu_channel_picker_header=MCM.templates.compile("menu_channel_picker_header");
    	MCM.templates.menu_channel_picker=MCM.templates.compile("menu_channel_picker");
    	MCM.templates.activity_messages=MCM.templates.compile("activity_messages");
    	MCM.templates.activity_user_rename=MCM.templates.compile("activity_user_rename");
    	MCM.templates.activity_user_files=MCM.templates.compile("activity_user_files");
    	MCM.templates.activity_user_files_post=MCM.templates.compile("activity_user_files_post");
    	MCM.templates.activity_user_files_snippet=MCM.templates.compile("activity_user_files_snippet");
    	MCM.templates.activity_team_files=MCM.templates.compile("activity_team_files");
    	MCM.templates.activity_file_comments=MCM.templates.compile("activity_file_comments");
    	MCM.templates.activity_file_stars=MCM.templates.compile("activity_file_stars");
    	MCM.templates.activity_file_comment_stars=MCM.templates.compile("activity_file_comment_stars");
    	MCM.templates.activity_message_stars=MCM.templates.compile("activity_message_stars");
    	MCM.templates.activity_new_channels=MCM.templates.compile("activity_new_channels");
    	MCM.templates.activity_new_members=MCM.templates.compile("activity_new_members");
    	MCM.templates.activity_unread_messages=MCM.templates.compile("activity_unread_messages");
    	MCM.templates.activity_unread_group_messages=MCM.templates.compile("activity_unread_group_messages");
    	MCM.templates.activity_unread_dms=MCM.templates.compile("activity_unread_dms");
    	MCM.templates.activity_sent_messages=MCM.templates.compile("activity_sent_messages");
    	MCM.templates.activity_sent_group_messages=MCM.templates.compile("activity_sent_group_messages");
    	MCM.templates.activity_sent_dms=MCM.templates.compile("activity_sent_dms");
    	MCM.templates.activity_user_file=MCM.templates.compile("activity_user_file");
    	MCM.templates.activity_user_file_post=MCM.templates.compile("activity_user_file_post");
    	MCM.templates.activity_user_file_snippet=MCM.templates.compile("activity_user_file_snippet");
    	MCM.templates.activity_user_file_comment=MCM.templates.compile("activity_user_file_comment");
    	MCM.templates.activity_user_star=MCM.templates.compile("activity_user_star");
    	MCM.templates.activity_starred_by_you=MCM.templates.compile("activity_starred_by_you");
    	MCM.templates.activity_day=MCM.templates.compile("activity_day");
    	MCM.templates.activity_days_list=MCM.templates.compile("activity_days_list");
    	MCM.templates.activity_individual_list=MCM.templates.compile("activity_individual_list");
    	MCM.templates.star_item=MCM.templates.compile("star_item");
    	MCM.templates.group_create=MCM.templates.compile("group_create");
    	MCM.templates.channel_create_dialog=MCM.templates.compile("channel_create_dialog");
    	MCM.templates.list_browser_dialog=MCM.templates.compile("list_browser_dialog");
    	MCM.templates.list_browser_items=MCM.templates.compile("list_browser_items");
    	MCM.templates.list_browser_items_by_membership=MCM.templates.compile("list_browser_items_by_membership");
    	MCM.templates.purpose_dialog=MCM.templates.compile("purpose_dialog");
    	MCM.templates.file_upload_dialog=MCM.templates.compile("file_upload_dialog");
    	MCM.templates.channel_invite_list=MCM.templates.compile("channel_invite_list");
    	MCM.templates.group_invite_list=MCM.templates.compile("group_invite_list");
    	MCM.templates.channel_member_invite_list=MCM.templates.compile("channel_member_invite_list");
    	MCM.templates.group_member_invite_list=MCM.templates.compile("group_member_invite_list");
    	MCM.templates.channel_conversion_dialog=MCM.templates.compile("channel_conversion_dialog");
    	MCM.templates.channel_data_retention_dialog=MCM.templates.compile("channel_data_retention_dialog");
    	MCM.templates.channel_deletion_dialog=MCM.templates.compile("channel_deletion_dialog");
    	MCM.templates.channel_options_dialog=MCM.templates.compile("channel_options_dialog");
    	MCM.templates.file_sharing=MCM.templates.compile("file_sharing");
    	MCM.templates.file_public_link=MCM.templates.compile("file_public_link");
    	MCM.templates.prefs_dialog=MCM.templates.compile("prefs_dialog");
    	MCM.templates.debug_prefs_dialog=MCM.templates.compile("debug_prefs_dialog");
    	MCM.templates.channel_prefs_dialog=MCM.templates.compile("channel_prefs_dialog");
    	MCM.templates.help_dialog=MCM.templates.compile("help_dialog");
    	MCM.templates.share_dialog=MCM.templates.compile("share_dialog");
    	MCM.templates.lightbox_image_container=MCM.templates.compile("lightbox_image_container");
    	MCM.templates.lightbox_external_image_container=MCM.templates.compile("lightbox_external_image_container");
    	MCM.templates.lightbox_dialog=MCM.templates.compile("lightbox_dialog");
    	MCM.templates.snippet_dialog=MCM.templates.compile("snippet_dialog");
    	MCM.templates.generic_dialog=MCM.templates.compile("generic_dialog");
    	MCM.templates.generic_dialog_sample=MCM.templates.compile("generic_dialog_sample");
    	MCM.templates.existing_groups=MCM.templates.compile("existing_groups");
    	MCM.templates.tip_card=MCM.templates.compile("tip_card");
    	//if(MCM.boot_data.feature_sidebar_themes){
    	//	MCM.templates.sidebar_theme_css=MCM.templates.compile("sidebar_theme_css")
    	//}
    	
    	MCM.templates.shortcuts_dialog=MCM.templates.compile("shortcuts_dialog");
    	MCM.templates.omnibox=MCM.templates.compile("omnibox");
    	MCM.templates.growl_prompt_overlay=MCM.templates.compile("growl_prompt_overlay");
    	MCM.templates.admin_list_item=MCM.templates.compile("admin_list_item");
    	MCM.templates.admin_invite_list_item=MCM.templates.compile("admin_invite_list_item");
    	MCM.templates.admin_invite_row=MCM.templates.compile("admin_invite_row");
    	MCM.templates.admin_restricted_info=MCM.templates.compile("admin_restricted_info");
    	MCM.templates.admin_restrict_account=MCM.templates.compile("admin_restrict_account");
    	MCM.templates.issue_list_item=MCM.templates.compile("issue_list_item");
    	MCM.templates.help_issue_div=MCM.templates.compile("help_issue_div");
    	MCM.templates.help_issue_reply_comments=MCM.templates.compile("help_issue_reply_comments");
    	MCM.templates.messages_search_paging=MCM.templates.compile("messages_search_paging");
    	MCM.templates.files_search_paging=MCM.templates.compile("files_search_paging");
    	MCM.templates.account_notifications_channel_overrides=MCM.templates.compile("account_notifications_channel_overrides");
    	MCM.templates.account_notifications_channel_overrides_row=MCM.templates.compile("account_notifications_channel_overrides_row");
    	MCM.templates.billing_contact=MCM.templates.compile("billing_contact");
    	MCM.templates.billing_add_contact_form=MCM.templates.compile("billing_add_contact_form");
    	},
    	registerPartials:function(){
            Handlebars.registerPartial("channel",$("#channel_template").html());
            Handlebars.registerPartial("member",$("#member_template").html());
            Handlebars.registerPartial("member",$("#member_template").html());
            Handlebars.registerPartial("team_list_item",$("#team_list_item_template").html());
            Handlebars.registerPartial("comment",$("#comment_template").html());
            Handlebars.registerPartial("search_widget_message_result",$("#search_widget_message_result_template").html());
            Handlebars.registerPartial("search_widget_file_result",$("#search_widget_file_result_template").html());
            Handlebars.registerPartial("search_message_results_item",MCM.templates.search_message_results_item);
            Handlebars.registerPartial("list_browser_items",MCM.templates.list_browser_items);
            Handlebars.registerPartial("file_public_link",MCM.templates.file_public_link);
    	},
    	makeUnreadMessagesDomId: function(a) {
    	    return MCM.utility.makeSafeForDomId("activity_unread_messages_" + a._id)
    	}, makeUnreadGroupMessagesDomId: function(a) {
    	    return MCM.utility.makeSafeForDomId("activity_unread_group_messages_" + a._id)
    	}, makeUnreadDmsDomId: function(a) {
    	    return MCM.utility.makeSafeForDomId("activity_unread_dms_" + a._id)
    	}, makeSentMessagesDomId: function(a) {
    	    return MCM.utility.makeSafeForDomId("activity_sent_messages_" + a._id)
    	}, makeSentGroupMessagesDomId: function(a) {
    	    return MCM.utility.makeSafeForDomId("activity_sent_group_messages_" + a._id)
    	}, makeActivityMessagesDomId: function(a) {
    	    return MCM.utility.makeSafeForDomId("activity_messages_" + a)
    	}, makeActivityDayDomId: function(a) {
    	    return "activity_day_" + a
    	}, makeIssueListDomId: function(a) {
    	    return "issue_list_" + a
    	}, makeSentDmsDomId: function(a) {
    	    return MCM.utility.makeSafeForDomId("activity_sent_dms_" + a._id)
    	}, makeMsgDomId: function(a) {
    	    return MCM.utility.makeSafeForDomId("msg_" + a)
    	}, makeMsgAttachmentTextExpanderDomId: function(b, a) {
    	    return MCM.utility.makeSafeForDomId("msg_rest_text_expander_" + b + "_" + a)
    	}, makeMSRDomId: function(a) {
    	    return MCM.utility.makeSafeForDomId("MSR_" + a.channel._id + "_" + a.ts)
    	}, makeChannelDomId: function(a) {
    	    return "channel_" + a._id
    	}, makeDayDividerDomId: function(a) {
    	    return MCM.utility.makeSafeForDomId("day_divider_" + a)
    	}, makeGroupDomId: function(a) {
    	    return "group_" + a._id
    	}, makeMemberDomId: function(a) {
    	    if (!a) {
    	        return
    	    }
    	    return MCM.templates.makeMemberDomIdById(a._id)
    	}, makeMemberDomIdById: function(a) {
    	    if (!a) {
    	        return
    	    }
    	    return "member_" + a
    	}, makeChannelListDomId: function(a) {
    	    return "channel_" + a._id + "_member_list"
    	}, makeFileDomId: function(a) {
    	    return "file_" + a._id
    	}, makeFileCommentsDomId: function(a) {
    	    return "file_comments_" + a._id
    	}, makeFileContentsDomId: function(a) {
    	    return "file_contents_" + a._id
    	}, makeUnreadJustDomId: function(a) {
    	    return "unread_just_" + a._id
    	}, makeUnreadHighlightDomId: function(a) {
    	    if (!a) {
    	        return
    	    }
    	    return "unread_highlight_" + a._id
    	}, makeMemberPresenceDomClass: function(a) {
    	    return "member_presence_" + a
    	}, makeMemberPresenceIcon: function(d) {
    	    var c = MCM.templates.makeMemberPresenceDomClass(d._id);
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
    	}, makeMemberStatusDomClass: function(a) {
    	    return "member_status_" + a
    	}, memberUserColorChanged: function(d) {
    	    var a = "color_" + d._id;
    	    if (d.color == d.member_color) {
    	        var c = "color_rule_" + a;
    	        var b = $("#" + c);
    	        b.remove();
    	        return
    	    }
    	    MCM.templates.makeUserColorRule(a, "#" + d.member_color)
    	}, makeUserColorRule: function(a, c) {
    	    c = MCM.utility.htmlEntities(c);
    	    var e = "color_rule_" + a;
    	    var b = $("#" + e);
    	    var d = "			." + a + ":not(.not_user_colored), 			#col_channels ul li:not(.active):not(.away) > ." + a + ":not(.not_user_colored), 			#col_channels:not(.show_presence) ul li > ." + a + ":not(.not_user_colored) {				color:" + c + ";			}			";
    	    if (b.length) {
    	        b.html(d)
    	    } else {
    	        $('<style type="text/css" id="' + e + '">' + d + "</style>").appendTo("body")
    	    }
    	}, sidebarBehaviorPrefChanged: function() {
    	    MCM.templates.makeSidebarBehaviorRule()
    	}, makeSidebarBehaviorRule: function() {
    	    var c;
    	    var b = "sidebar_behavior";
    	    var a = $("#" + b);
    	    if (MCM.model.prefs.sidebar_behavior == "hide_read_channels") {
    	        c = "				.channels_list_holder ul li:not(.unread):not(.active) {					display: none;			}"
    	    } else {
    	        if (MCM.model.prefs.sidebar_behavior == "hide_read_channels_unless_starred") {
    	            c = "				.channels_list_holder div:not(#starred_div)>ul li:not(.unread):not(.active) {					display: none;			}"
    	        } else {
    	            if (MCM.model.prefs.sidebar_behavior == "shrink_left_column") {
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
    	},
    	helpers:{
        	onStart: function() {
        	    MCM.templates.helpers.register()
        	}, register: function() {
        	    Handlebars.registerHelper("isClient", function(f) {
        	        if (MCM.boot_data.app == "client") {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("isChrome", function(f) {
        	        if (MCM.model.is_chrome) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("isFF", function(f) {
        	        if (MCM.model.is_FF) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("isSafariDesktop", function(f) {
        	        if (MCM.model.is_safari_desktop) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("isWeb", function(f) {
        	        if (MCM.boot_data.app == "web" || MCM.boot_data.app == "mobile") {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("isMobileWeb", function(f) {
        	        if (MCM.boot_data.app == "mobile") {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("isMac", function(f) {
        	        if (MCM.model.is_mac) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("isOurApp", function(f) {
        	        if (MCM.model.is_our_app) {
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
        	        if (g == MCM.model.prefs.theme) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("showAvatars", function(f) {
        	        if (MCM.model.prefs.avatars) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("feature", function(g) {
        	        var f = g.hash.flag;
        	        if (MCM.qs_args[f] == 1 || MCM.boot_data[f] == 1) {
        	            return g.fn(this)
        	        }
        	        return g.inverse(this)
        	    });
        	    Handlebars.registerHelper("comments", MCM.templates.builders.buildComments);
        	    Handlebars.registerHelper("star", MCM.templates.builders.buildStar);
        	    Handlebars.registerHelper("inlineImgTogglerAndDiv", MCM.templates.builders.buildInlineImgTogglerAndDiv);
        	    Handlebars.registerHelper("inlineImgDiv", MCM.templates.builders.buildInlineImgDiv);
        	    Handlebars.registerHelper("inlineImgToggler", MCM.templates.builders.buildInlineImgToggler);
        	    Handlebars.registerHelper("inlineVideoDiv", MCM.templates.builders.buildInlineVideoDiv);
        	    Handlebars.registerHelper("inlineAudioDiv", MCM.templates.builders.buildInlineAudioDiv);
        	    Handlebars.registerHelper("formatActionLink", function(g, j, f) {
        	        if (!g) {
        	            return ""
        	        }
        	        var h = "<" + g.url + "|" + g.title + ">";
        	        html = MCM.format.formatMsg(h, j, false, false, false, false, true, true, false, f === true);
        	        return html
        	    });
        	    Handlebars.registerHelper("formatSoundUrl", MCM.templates.builders.formatSoundUrl);
        	    Handlebars.registerHelper("ellipsize", function(g, f) {
        	        MCM.info("len" + f);
        	        return MCM.utility.ellipsize(g, f)
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
        	        return true;//MCM.members.canUserAtEveryone() ? f.fn(this) : f.inverse(this)
        	    });
        	    Handlebars.registerHelper("canUserAtChannelOrAtGroup", function(f) {
        	        return true;//MCM.members.canUserAtChannelOrAtGroup() ? f.fn(this) : f.inverse(this)
        	    });
        	    Handlebars.registerHelper("canUserCreateChannels", function(f) {
        	        return true ? f.fn(this) : f.inverse(this);//MCM.members.canUserCreateChannels()
        	    });
        	    Handlebars.registerHelper("canUserArchiveChannels", function(f) {
        	        return true;//MCM.members.canUserArchiveChannels() ? f.fn(this) : f.inverse(this)
        	    });
        	    Handlebars.registerHelper("canUserCreateGroups", function(f) {
        	        return true;//MCM.members.canUserCreateGroups() ? f.fn(this) : f.inverse(this)
        	    });
        	    Handlebars.registerHelper("canUserPostInGeneral", function(f) {
        	        return true;//MCM.members.canUserPostInGeneral() ? f.fn(this) : f.inverse(this)
        	    });
        	    Handlebars.registerHelper("canUserKickFromChannels", function(f) {
        	        return true;//MCM.members.canUserKickFromChannels() ? f.fn(this) : f.inverse(this)
        	    });
        	    Handlebars.registerHelper("canUserKickFromGroups", function(f) {
        	        return true;//MCM.members.canUserKickFromGroups() ? f.fn(this) : f.inverse(this)
        	    });
        	    Handlebars.registerHelper("numberWithMax", function(g, f) {
        	        if (g >= f) {
        	            return (f - 1) + "+"
        	        } else {
        	            return g
        	        }
        	    });
        	    Handlebars.registerHelper("convertFilesize", function(f) {
        	        return MCM.utility.convertFilesize(f)
        	    });
        	    Handlebars.registerHelper("toDate", function(f) {
        	        return MCM.utility.date.toDate(f)
        	    });
        	    Handlebars.registerHelper("toCalendarDate", function(f) {
        	        return MCM.utility.date.toCalendarDate(f)
        	    });
        	    Handlebars.registerHelper("toCalendarDateShort", function(f) {
        	        return MCM.utility.date.toCalendarDate(f, true)
        	    });
        	    Handlebars.registerHelper("toCalendarDateOrNamedDay", function(f) {
        	        return MCM.utility.date.toCalendarDateOrNamedDay(f)
        	    });
        	    Handlebars.registerHelper("toCalendarDateIfYesterdayOrTomorrow", function(f) {
        	        return MCM.utility.date.toCalendarDateIfYesterdayOrTomorrow(f)
        	    });
        	    Handlebars.registerHelper("toCalendarDateOrNamedDayShort", function(f) {
        	        return MCM.utility.date.toCalendarDateOrNamedDayShort(f)
        	    });
        	    Handlebars.registerHelper("toTime", function(g, f, h) {
        	        return MCM.utility.date.toTime(g, f !== false, h === true)
        	    });
        	    Handlebars.registerHelper("msgTsTitle", function(g) {
        	        var f = (MCM.utility.date.toCalendarDateOrNamedDayShort(g.ts) + " at " + MCM.utility.date.toTime(g.ts, true, true)).replace(/\s/g, "&nbsp;");
        	        if (MCM.client) {
        	            f += "&#013;Click to open in archives"
        	        }
        	        return f
        	    });
        	    Handlebars.registerHelper("toHour", function(f) {
        	        return MCM.utility.date.toHour(f)
        	    });
        	    Handlebars.registerHelper("timezoneLabel", function(g, f) {
        	        return MCM.utility.date.timezoneLabel(g, f)
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
        	        return MCM.templates.makeDayDividerDomId(f)
        	    });
        	    Handlebars.registerHelper("formatFileTitle", function(f) {
        	        if (!f || !f.title) {
        	            return ""
        	        }
        	        return MCM.utility.emojiGraphicReplace(f.title)
        	    });
        	    Handlebars.registerHelper("formatMessageByType", MCM.templates.builders.formatMessageByType);
        	    Handlebars.registerHelper("formatAttachments", MCM.templates.builders.formatAttachments);
        	    Handlebars.registerHelper("formatMessage", function(g, f) {
        	        return MCM.format.formatMsg(g, f)
        	    });
        	    Handlebars.registerHelper("formatMessageSimple", function(g, f) {
        	        return MCM.format.formatMsg(g, f, false, false, false, false, true, true)
        	    });
        	    Handlebars.registerHelper("formatMessageAttachmentPart", function(k, j, f, h, g) {
        	        return MCM.format.formatMsg(k, j, false, false, false, false, !(f === true), !(h === true), null, !(g === true))
        	    });
        	    Handlebars.registerHelper("formatTopicOrPurpose", function(f) {
        	        return MCM.utility.formatTopicOrPurpose(f)
        	    });
        	    Handlebars.registerHelper("unFormatMessage", function(g, f) {
        	        return MCM.format.unFormatMsg(g, f)
        	    });
        	    Handlebars.registerHelper("formatMessageResult", function(f) {
        	        f = MCM.format.formatMsg(f);
        	        f = MCM.utility.msgs.handleSearchHighlights(f);
        	        return f
        	    });
        	    Handlebars.registerHelper("formatSearchExtracts", MCM.templates.builders.formatSearchExtracts);
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
        	        var k = truncate(MCM.format.formatMsg(h, j), g);
        	        files;
        	        if (j.permalink) {
        	            var f = ' <a target="' + MCM.templates.builders.newWindowName() + '" href="' + j.permalink + '" class="normal tiny">read more</a>';
        	            return k + f
        	        } else {
        	            return k
        	        }
        	    });
        	    Handlebars.registerHelper("msgActions", function(f) {
        	        return '<a class="msg_actions" data-msg-ts="' + f.ts + '"><input type="checkbox" class="msg_select_cb" /><i class="msg_cog fa fa-cog"></i></a>'
        	    });
        	    Handlebars.registerHelper("fileActionsCog", function(f) {
        	        return '<a class="file_actions file_actions_cog fa fa-cog" data-file-id="' + f._id + '"></a>'
        	    });
        	    Handlebars.registerHelper("fileActionsLink", function(f) {
        	        return '<a class="file_actions file_actions_link" data-file-id="' + f._id + '">Actions <i class="fa fa-caret-down"></i></a>'
        	    });
        	    Handlebars.registerHelper("makeRefererSafeLink", function(f) {
        	        return MCM.utility.makeRefererSafeLink(f.hash.url)
        	    });
        	    Handlebars.registerHelper("makeSafeForDomId", MCM.utility.makeSafeForDomId);
        	    Handlebars.registerHelper("makeMsgAttachmentTextExpanderDomId", MCM.templates.makeMsgAttachmentTextExpanderDomId);
        	    Handlebars.registerHelper("makeMsgDomId", MCM.templates.makeMsgDomId);
        	    Handlebars.registerHelper("makeMSRDomId", MCM.templates.makeMSRDomId);
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
        	    Handlebars.registerHelper("buildMsgHTMLForSearch", MCM.templates.builders.buildMsgHTMLForSearch);
        	    Handlebars.registerHelper("ifExtracts", function(h, f) {
        	        var g = MCM.search.view.msgHasExtracts(h) || h.previous && MCM.search.view.msgHasExtracts(h.previous) || h.previous_2 && MCM.search.view.msgHasExtracts(h.previous_2) || h.next && MCM.search.view.msgHasExtracts(h.next) || h.next_2 && MCM.search.view.msgHasExtracts(h.next_2);
        	        if (g) {
        	            return f.fn(this)
        	        }
        	        return f.inverse(this)
        	    });
        	    Handlebars.registerHelper("concatMsgExtracts", function(g) {
        	        if (g.extracMCM.length === 0) {
        	            return ""
        	        }
        	        var h = [];
        	        g.extracMCM.forEach(function(j) {
        	            var k = MCM.format.formatMsg(j.text, g, true);
        	            k = MCM.utility.msgs.handleSearchHighlights(k);
        	            h.push(k)
        	        });
        	        var f = h.join(" &hellip; ");
        	        if (g.extracts[0].truncated_head) {
        	            f = "&hellip; " + f
        	        }
        	        if (g.extracts[g.extracMCM.length - 1].truncated_tail) {
        	            f += " &hellip;"
        	        }
        	        return f
        	    });

        	    function e(g, f) {
        	        var h = MCM.format.formatMsg(g.text, f);
        	        h = MCM.utility.msgs.handleSearchHighlights(h);
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
        	            var l = MCM.format.formatMsg(k.fallback, g);
        	            l = MCM.utility.msgs.handleSearchHighlights(l);
        	            return l
        	        }
        	        return h
        	    });
        	    Handlebars.registerHelper("newWindowName", MCM.templates.builders.newWindowName);
        	    Handlebars.registerHelper("nl2br", function(f) {
        	        if (!f) {
        	            return f
        	        }
        	        f = MCM.utility.htmlEntities(f);
        	        return f.replace(/\n/g, "<br />").replace(/&amp;#95;/g, "_")
        	    });
        	    Handlebars.registerHelper("truncate", function(h, f) {
        	        var g = truncate(h, f);
        	        return g.replace(/&#64;/g, "@")
        	    });
        	    Handlebars.registerHelper("generalName", function() {
        	        var f = MCM.channels.getGeneralChannel();
        	        return (f) ? f.name : ""
        	    });
        	    Handlebars.registerHelper("makeChannelDomId", function(f) {
        	        return MCM.templates.makeChannelDomId(f)
        	    });
        	    Handlebars.registerHelper("ChannelNameMaxLength", function(f) {
        	        return MCM.model.channel_name_max_length
        	    });
        	    Handlebars.registerHelper("ChannelPurposeMaxLength", function() {
        	        return MCM.model.channel_purpose_max_length
        	    });
        	    Handlebars.registerHelper("ChannelTopicMaxLength", function() {
        	        return MCM.model.channel_topic_max_length
        	    });
        	    Handlebars.registerHelper("makeUnreadJustDomId", function(f) {
        	        return MCM.templates.makeUnreadJustDomId(f)
        	    });
        	    Handlebars.registerHelper("getChannelOrGroupNameWithPrefixById", function(h) {
        	        var f = MCM.channels.getChannelById(h);
        	        if (f) {
        	            return "#" + f.name
        	        }
        	        var g = MCM.groups.getGroupById(h);
        	        if (g) {
        	            return MCM.model.group_prefix + g.name
        	        }
        	        return h
        	    });
        	    Handlebars.registerHelper("makeChannelLink", MCM.templates.builders.makeChannelLink);
        	    Handlebars.registerHelper("makeChannelLinkById", function(g) {
        	        var f = MCM.channels.getChannelById(g);
        	        if (f) {
        	            return MCM.templates.builders.makeChannelLink(f)
        	        }
        	    });
        	    Handlebars.registerHelper("makeUnreadHighlightDomId", function(f) {
        	        return MCM.templates.makeUnreadHighlightDomId(f)
        	    });
        	    Handlebars.registerHelper("makeChannelDomClass", function(g) {
        	        var f = "";
        	        if (MCM.model.active_channel_id == g._id) {
        	            f += "active "
        	        }
        	        /*if (g.unread_cnt > 0) {
        	            f += "unread "
        	        }
        	        if (g.unread_highlight_cnt > 0) {
        	            f += "mention "
        	        }
        	        if (MCM.utility.msgs.isChannelOrGroupMuted(g._id)) {
        	            f += "muted_channel "
        	        }*/
        	        return f
        	    });
        	    Handlebars.registerHelper("makeGroupDomId", function(f) {
        	        return MCM.templates.makeGroupDomId(f)
        	    });
        	    Handlebars.registerHelper("groupPrefix", function(f) {
        	        return MCM.model.group_prefix
        	    });
        	    Handlebars.registerHelper("makeGroupLink", MCM.templates.builders.makeGroupLink);
        	    Handlebars.registerHelper("makeGroupLinkById", function(g) {
        	        var f = MCM.groups.getGroupById(g);
        	        if (f) {
        	            return MCM.templates.builders.makeGroupLink(f)
        	        }
        	    });
        	    Handlebars.registerHelper("makeGroupDomClass", function(g) {
        	        var f = "";
        	        if (MCM.model.active_group_id == g._id) {
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
        	        if (MCM.utility.msgs.isChannelOrGroupMuted(g._id)) {
        	            f += "muted_channel "
        	        }
        	        return f
        	    });
        	    Handlebars.registerHelper("currentUserId", function() {
        	        return MCM.model.user._id
        	    });
        	    Handlebars.registerHelper("makeMemberDomId", function(f) {
        	        return MCM.templates.makeMemberDomId(f)
        	    });
        	    Handlebars.registerHelper("makeChannelListDomId", function(f) {
        	        return MCM.templates.makeChannelListDomId(f)
        	    });
        	    Handlebars.registerHelper("makeMemberPresenceDomClass", function(f) {
        	        return MCM.templates.makeMemberPresenceDomClass(f._id)
        	    });
        	    Handlebars.registerHelper("makeMemberPresenceIcon", function(f) {
        	        return MCM.templates.makeMemberPresenceIcon(f)
        	    });
        	    Handlebars.registerHelper("makeMemberStatusDomClass", function(f) {
        	        return MCM.templates.makeMemberStatusDomClass(f._id)
        	    });
        	    Handlebars.registerHelper("makeMemberDomClass", function(j) {
        	        var g = "";
        	        if (!j) {
        	            return g
        	        }
        	        if (!j.is_self && j.presence == "away") {
        	            g += "away "
        	        }
        	        if (MCM.model.active_im_id) {
        	            var h = MCM.ims.getImById(MCM.model.active_im_id);
        	            if (h.user == j._id) {
        	                g += "active "
        	            }
        	        }
        	        var f = MCM.ims.getImByMemberId(j._id);
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
        	    Handlebars.registerHelper("makeMemberPreviewLink", MCM.templates.builders.makeMemberPreviewLink);
        	    Handlebars.registerHelper("makeMemberPreviewLinkById", function(h, f) {
        	        if (f !== true) {
        	            f = false
        	        }
        	        var g = MCM.members.getMemberById(h);
        	        if (!g) {
        	            return h
        	        }
        	        return MCM.templates.builders.makeMemberPreviewLink(g, f)
        	    });
        	    Handlebars.registerHelper("makeMemberPreviewLinkImage", function(f, o, g) {
        	        var h = MCM.members.getMemberById(f);
        	        if (!h || !h.profile) {
        	            return ""
        	        }
        	        g = (g === true);
        	        var l, n;
        	        var m = "background-image: ";
        	        switch (o) {
        	            case 24:
        	                if (MCM.utility.is_retina) {
        	                    l = h.profile.image_48
        	                } else {
        	                    l = h.profile.image_24
        	                }
        	                n = "thumb_24";
        	                break;
        	            case 32:
        	                if (MCM.utility.is_retina) {
        	                    l = h.profile.image_72
        	                } else {
        	                    l = h.profile.image_32
        	                }
        	                n = "thumb_32";
        	                break;
        	            case 36:
        	                if (MCM.utility.is_retina) {
        	                    l = h.profile.image_72
        	                } else {
        	                    l = h.profile.image_48
        	                }
        	                n = "thumb_36";
        	                break;
        	            case 48:
        	                if (MCM.utility.is_retina) {
        	                    l = h.profile.image_72
        	                } else {
        	                    l = h.profile.image_48
        	                }
        	                n = "thumb_48";
        	                break;
        	            case 72:
        	                if (MCM.utility.is_retina) {
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
        	                if (MCM.utility.is_retina) {
        	                    l = h.profile.image_72
        	                } else {
        	                    l = h.profile.image_48
        	                }
        	                n = "thumb_48";
        	                break
        	        }
        	        if (h.is_restricted) {
        	            g = false;
        	            if (MCM.utility.is_retina) {
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
        	        var k = (MCM.client) ? 'target="/team/' + h.name + '"' : "";
        	        if (g) {
        	            j = '<a href="/team/' + h.name + '" ' + k + ' class="lazy member_preview_link member_image ' + n + '" data-member-id="' + h._id + '" style="' + m + ';background-color: #f6f6f6" data-original="' + l + '" ></a>'
        	        } else {
        	            m += "url('" + l + "');";
        	            j = '<a href="/team/' + h.name + '" ' + k + ' class="member_preview_link member_image ' + n + '" data-member-id="' + h._id + '" style="' + m + '"></a>'
        	        }
        	        return j
        	    });
        	    Handlebars.registerHelper("emojiGraphicReplace", function(f) {
        	        return MCM.utility.emojiGraphicReplace(f)
        	    });
        	    Handlebars.registerHelper("makeMemberImage", MCM.templates.builders.makeMemberImage);
        	    Handlebars.registerHelper("makeUsernameImage", function(j, s) {
        	        var h = j.username;
        	        var n, g, m, f;
        	        var k;
        	        var p = (j.bot_id) ? MCM.boMCM.getBotById(j.bot_id) : null;
        	        if (j.icons) {
        	            k = j.icons
        	        } else {
        	            if (p && p.icons) {
        	                k = p.icons
        	            } else {}
        	        } if (k) {
        	            if (k.image_36 && !MCM.utility.is_retina) {
        	                n = k.image_36
        	            } else {
        	                if (k.image_72 && MCM.utility.is_retina) {
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
        	            q = '<a target="/services/' + p._id + '" href="/services/' + p._id + '">';
        	            r = "</a>"
        	        }
        	        var o = (j && j.is_ephemeral && j.username == "slackbot") ? MCM.members.getMemberById("USLACKBOT") : null;
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
        	                l = q + '<div style="border: 0" class="member_image ' + g + '">' + MCM.utility.emojiGraphicReplace(MCM.utility.htmlEntities(m), true, false, true) + "</div>" + r
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
        	        var f = MCM.members.getMemberById(g);
        	        return f ? f.name : g
        	    });
        	    Handlebars.registerHelper("getMemberDisplayNameById", function(g) {
        	        var f = MCM.members.getMemberById(g);
        	        return f ? MCM.members.getMemberDisplayName(f) : g
        	    });
        	    Handlebars.registerHelper("getMemberDisplayName", function(f) {
        	        return MCM.members.getMemberDisplayName(f)
        	    });
        	    Handlebars.registerHelper("getDisplayNameOfUserForIm", function(f) {
        	        if (!f) {
        	            return "MISSING_IM"
        	        }
        	        return MCM.ims.getDisplayNameOfUserForIm(f)
        	    });
        	    Handlebars.registerHelper("getIMNameById", function(g) {
        	        var f = MCM.ims.getImById(g);
        	        return f ? f.name : g
        	    });
        	    Handlebars.registerHelper("getIMIdByMemberId", function(g) {
        	        var f = MCM.ims.getImByMemberId(g);
        	        return f ? f._id : ""
        	    });
        	    Handlebars.registerHelper("memberHasIm", function(f) {
        	        var h = f.hash.member;
        	        var g = false;
        	        if (h) {
        	            if (MCM.ims.getImByMemberId(h._id)) {
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
        	        var j = MCM.members.getMemberById(f.user);
        	        var h = "color_" + ((j) ? j._id : "unknown");
        	        var g = (MCM.client) ? 'target="/messages/@' + f.name + '"' : "";
        	        return '<a href="/messages/@' + f.name + '" ' + g + '" class="internal_im_link ' + h + '" data-member-name="' + f.name + '">@' + f.name + "</a>"
        	    }
        	    Handlebars.registerHelper("makeIMLink", b);
        	    Handlebars.registerHelper("makeIMLinkById", function(g) {
        	        var f = MCM.ims.getImById(g);
        	        if (f) {
        	            return b(f)
        	        }
        	    });

        	    function a(k) {
        	        var m = MCM.utility.htmlEntities(k.username);
        	        var j;
        	        var l = (k.bot_id) ? MCM.boMCM.getBotById(k.bot_id) : null;
        	        if (k.icons) {
        	            j = k.icons
        	        } else {
        	            if (l && l.icons) {
        	                j = l.icons
        	            } else {}
        	        } if (!m && l && l.name) {
        	            m = MCM.utility.htmlEntities(l.name)
        	        }
        	        if (MCM.members.botNameMatchesMemberName(m)) {
        	            m += " (bot)"
        	        }
        	        var g = "";
        	        var f = "";
        	        if (l && !l.deleted) {
        	            g = '<a target="/services/' + l._id + '" href="/services/' + l._id + '">';
        	            f = "</a>"
        	        }
        	        if (!j) {
        	            return g + m + f
        	        }
        	        var h;
        	        if (j.emoji && j.emoji.substr(0, 1) == ":" && j.emoji.substr(j.emoji.length - 1, 1) == ":") {
        	            h = g + MCM.utility.emojiGraphicReplace(MCM.utility.htmlEntities(j.emoji), true, false, true) + f + " " + g + m + f
        	        } else {
        	            if (j.image_36 && !MCM.utility.is_retina) {
        	                h = g + '<img src="' + j.image_36 + '" class="inline_bot_icon">' + f + " " + g + m + f
        	            } else {
        	                if (j.image_72 && MCM.utility.is_retina) {
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
        	    Handlebars.registerHelper("getBotName", MCM.templates.builders.getBotName);
        	    Handlebars.registerHelper("getBotNameWithLink", MCM.templates.builders.getBotNameWithLink);

        	    function c(f) {
        	        if (!f) {
        	            return "color_unknown"
        	        }
        	        return "color_bot_" + MCM.utility.makeSafeForDomClass(f)
        	    }
        	    Handlebars.registerHelper("getBotColorClassByUserName", c);

        	    function d(g) {
        	        var f = MCM.members.getMemberById(g);
        	        if (!f) {
        	            return "color_unknown"
        	        }
        	        return "color_" + f._id
        	    }
        	    Handlebars.registerHelper("getMemberColorClassById", d);
        	    Handlebars.registerHelper("getMemberColorClassByImId", function(g) {
        	        var f = MCM.ims.getImById(g);
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
        	        var h = MCM.members.getMemberById(j);
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
        	        var g = MCM.members.getMemberById(f.hash._id);
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
        	        var g = MCM.members.getMemberById(f.hash._id);
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
        	        if (MCM.model.user.is_admin) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("tinyspeck", function(f) {
        	        if (MCM.model.team.domain == "tinyspeck") {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("makeFileDomId", function(f) {
        	        return MCM.templates.makeFileDomId(f)
        	    });
        	    Handlebars.registerHelper("makeFileCommentsDomId", function(f) {
        	        return MCM.templates.makeFileCommentsDomId(f)
        	    });
        	    Handlebars.registerHelper("makeFileContentsDomId", function(f) {
        	        return MCM.templates.makeFileContentsDomId(f)
        	    });
        	    Handlebars.registerHelper("makeFileHeader", function(f, g) {
        	        return MCM.templates.file_header({
        	            file: f,
        	            member: g
        	        })
        	    });
        	    Handlebars.registerHelper("makeFilePreviewHeader", function(f, g) {
        	        return MCM.templates.file_header({
        	            file: f,
        	            member: g,
        	            preview: true
        	        })
        	    });
        	    Handlebars.registerHelper("fileIsImage", function(f) {
        	        var g = MCM.files.getFileById(f.hash._id);
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
        	        return MCM.templates.builders.makeExternalFiletypeHTML(f)
        	    });
        	    Handlebars.registerHelper("makeFileGroupChannelList", function(f) {
        	        return MCM.templates.builders.makeFileGroupChannelList(f)
        	    });
        	    Handlebars.registerHelper("nl2brAndHighlightSearchMatches", function(f) {
        	        if (!f) {
        	            return
        	        }
        	        f = MCM.utility.htmlEntities(f);
        	        f = f.replace(/\n/g, "<br />");
        	        return MCM.utility.msgs.handleSearchHighlights(f)
        	    });
        	    Handlebars.registerHelper("highlightSearchMatches", function(f) {
        	        if (!f) {
        	            return
        	        }
        	        f = MCM.utility.htmlEntities(f);
        	        return MCM.utility.msgs.handleSearchHighlights(f)
        	    });
        	    Handlebars.registerHelper("highlightSearchMatchesInFileTitle", function(f) {
        	        if (!f) {
        	            return
        	        }
        	        f = MCM.utility.emojiGraphicReplace(f);
        	        return MCM.utility.msgs.handleSearchHighlights(f)
        	    });
        	    Handlebars.registerHelper("searchFilter", function() {
        	        if (!MCM.search.filter) {
        	            return
        	        }
        	        return MCM.search.filter
        	    });
        	    Handlebars.registerHelper("searchSort", function() {
        	        if (!MCM.search.sort) {
        	            return
        	        }
        	        return MCM.search.sort
        	    });
        	    Handlebars.registerHelper("makeUnreadMessagesDomId", function(f) {
        	        return MCM.templates.makeUnreadMessagesDomId(f)
        	    });
        	    Handlebars.registerHelper("makeUnreadGroupMessagesDomId", function(f) {
        	        return MCM.templates.makeUnreadGroupMessagesDomId(f)
        	    });
        	    Handlebars.registerHelper("makeUnreadDmsDomId", function(f) {
        	        return MCM.templates.makeUnreadDmsDomId(f)
        	    });
        	    Handlebars.registerHelper("makeSentMessagesDomId", function(f) {
        	        return MCM.templates.makeSentMessagesDomId(f)
        	    });
        	    Handlebars.registerHelper("makeSentGroupMessagesDomId", function(f) {
        	        return MCM.templates.makeSentGroupMessagesDomId(f)
        	    });
        	    Handlebars.registerHelper("makeSentDmsDomId", function(f) {
        	        return MCM.templates.makeSentDmsDomId(f)
        	    });
        	    Handlebars.registerHelper("makeActivityMessagesDomId", function(f) {
        	        return MCM.templates.makeActivityMessagesDomId(f)
        	    });
        	    Handlebars.registerHelper("makeActivityDayDomId", function(f) {
        	        return MCM.templates.makeActivityDayDomId(f)
        	    });
        	    Handlebars.registerHelper("makeIssueListDomId", function(f) {
        	        return MCM.templates.makeIssueListDomId(f)
        	    });
        	    Handlebars.registerHelper("math", function(f, g, j, h) {
        	        if (argumenMCM.length < 4) {
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
        	    });
        	}
    	},
      builders:{
        onStart:function(){},  
        newWindowName: function(a) {
            //if web
            return "_self"
        }          	
      }
    },
    
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
    updatePresence: function(status) {
        
       
    },
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
    update_groups:function(){
    	var template_html= MCM.templates.channel_list(MCM.model);
    	$('#channel-list').html(template_html);
      var channels_scroller=$("#channels_scroller").perfectScrollbar();
      $("#channels_scroller").css({visibility:"visible"});
    },
    update_users:function(){
    	var source   = $("#channel_members_list_template").html();
    	//var template = Handlebars.compile(source);
    	//var template_html    = template(users);


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
           // var Name = _loginedUser.username;//$('#setName input').val();
            var sockurl=window.location.hostname.substring(window.location.hostname.indexOf('.')+1);
            //$.cookie('name', Name, {domain: '.' + sockurl});

    		//$('#giveName input').val('');
    		//$('#giveName').fadeOut(300);
    		//$('#channelList').animate({opacity: 1}, 500);
    		//$('#chat').animate({opacity: 1}, 500);
            
            //Swag.registerHelpers();
           
            
        	self.Chat  = new ChatRoom();
    
            $(self.Chat).bind('connect', function(e) {
                self.Names[self.Chat.sessionId] = 'Me';

                self.Chat.regist(boot_data.user.email,boot_data.user.token,function(args){
                	boot_data.login=args.regist;
                	/*sess.call('set_online_status', 'online').then(function(args) {
                		self.updatePresence('online');
                    }, function(args) {
                    	self.updatePresence('online');
                    });*/
                  if(!boot_data.login)
                    return;
                	self.Chat.call('get_run_data2',{teamdomain:boot_data.team.teamdomain},function(data) {
                		//self.model=eval("("+args.data+")");
                		$.extend(self.model,data);
                    $.ajax({  
        	            type : "get",  
        	            url : boot_data.team_url+'/assets/teammsg/show/templates.html',  
        	            //data : "test=" + test,  
        	            async : false,  
        	            success : function(data){  
        	            	$("body").append(data);  
                        MCM.model.onStart();
                        MCM.utility.onStart();
                        MCM.templates.builders.onStart();
                        MCM.templates.helpers.onStart();
                        MCM.templates.onStart();
                        self.update_groups();
                      	self.update_users();
                        $(window).resize(MCM.view.onResize);
                        MCM.view.onResize();
                        MCM.ui.onStart();
        	            }  
                    }); 
                  });
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