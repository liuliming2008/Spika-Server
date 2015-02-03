var FlashDetect=new function(){var a=this;
a.installed=false;
a.raw="";
a.major=-1;
a.minor=-1;
a.revision=-1;
a.revisionStr="";
var b=[{name:"ShockwaveFlash.ShockwaveFlash.7",version:function(h){return d(h)
}},{name:"ShockwaveFlash.ShockwaveFlash.6",version:function(k){var h="6,0,21";
try{k.AllowScriptAccess="always";
h=d(k)
}catch(j){}return h
}},{name:"ShockwaveFlash.ShockwaveFlash",version:function(h){return d(h)
}}];
var d=function(k){var h=-1;
try{h=k.GetVariable("$version")
}catch(j){}return h
};
var g=function(h){var k=-1;
try{k=new ActiveXObject(h)
}catch(j){k={activeXError:true}
}return k
};
var c=function(j){var h=j.split(",");
return{raw:j,major:parseInt(h[0].split(" ")[1],10),minor:parseInt(h[1],10),revision:parseInt(h[2],10),revisionStr:h[2]}
};
var f=function(l){var j=l.split(/ +/);
var k=j[2].split(/\./);
var h=j[3];
return{raw:l,major:parseInt(k[0],10),minor:parseInt(k[1],10),revisionStr:h,revision:e(h)}
};
var e=function(h){return parseInt(h.replace(/[a-zA-Z]/g,""),10)||a.revision
};
a.majorAtLeast=function(h){return a.major>=h
};
a.minorAtLeast=function(h){return a.minor>=h
};
a.revisionAtLeast=function(h){return a.revision>=h
};
a.versionAtLeast=function(j){var k=[a.major,a.minor,a.revision];
var h=Math.min(k.length,arguments.length);
for(i=0;
i<h;
i++){if(k[i]>=arguments[i]){if(i+1<h&&k[i]==arguments[i]){continue
}else{return true
}}else{return false
}}};
a.FlashDetect=function(){if(navigator.plugins&&navigator.plugins.length>0){var l="application/x-shockwave-flash";
var k=navigator.mimeTypes;
if(k&&k[l]&&k[l].enabledPlugin&&k[l].enabledPlugin.description){var h=k[l].enabledPlugin.description;
var m=f(h);
a.raw=m.raw;
a.major=m.major;
a.minor=m.minor;
a.revisionStr=m.revisionStr;
a.revision=m.revision;
a.installed=true
}}else{if(navigator.appVersion.indexOf("Mac")==-1&&window.execScript){var h=-1;
for(var j=0;
j<b.length&&h==-1;
j++){var n=g(b[j].name);
if(!n.activeXError){a.installed=true;
h=b[j].version(n);
if(h!=-1){var m=c(h);
a.raw=m.raw;
a.major=m.major;
a.minor=m.minor;
a.revision=m.revision;
a.revisionStr=m.revisionStr
}}}}}}()
};
FlashDetect.JS_RELEASE="1.0.4";