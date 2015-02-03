CM.model={
	active_channel_id: null,
	active_group_id:null,
	active_im_id:null,
	dialog_is_showing:false,
	created_channels:[],
	
	group_prefix: "",
    flex_name_in_url: "",
    flex_extra_in_url: "",
    flex_names: ["activity", "files", "team", "search", "stars", "mentions"],
    default_flex_name: "files",
    prefs: null,
    ui_state: null,
    input_history: null,
    input_history_index: -1,
    last_net_send: 0,
    channel_name_max_length: 21,
    channel_purpose_max_length: 250,
    channel_topic_max_length: 250,
    upload_file_size_limit_bytes: 1073741824,
    msg_activity_interval: 5,
    menu_is_showing: false,
    overlay_is_showing: false,
    is_iOS: (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false),
    is_FF: (navigator.userAgent.match(/(Firefox)/g) ? true : false),
    is_chrome: (navigator.userAgent.match(/(Chrome)/g) ? true : false),
    is_safari_desktop: (navigator.userAgent.match(/(Safari)/g) && !navigator.userAgent.match(/(Chrome)/g) && navigator.userAgent.match(/(OS X)/g) ? true : false),
    is_apple_webkit_5: false,
    is_mac: (navigator.userAgent.match(/(OS X)/g) ? true : false),
    is_win: (navigator.appVersion.indexOf("Win") !== -1),
    is_ms_tablet: (navigator.appVersion.indexOf("Win") !== -1 && navigator.userAgent.match(/arm|touch/i)),
    is_our_app: (navigator.userAgent.match(/(Slack)/g) ? true : false),

    display_unsent_msgs: [],
    
    onStart:function(){
		
	},
	ui_state:{
		member_list_visible:false,
	},
	prefs:{
		theme:"light",
	}
};